import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  FixtureAPIResponse,
  Fixture,
  PredictionAPIResponse,
  FormattedPrediction,
  MatchStatsStatus,
  GroupedFixturesResponse,
  CountryFixtures,
  Country,
  WidgetConfig,
} from '../types/matches.type';
import {
  convertTimestampToTime,
  generateOdds,
} from '../../global/providers/utils.provider';

interface CacheEntry {
  data: Fixture;
  timestamp: number;
  ttl: number;
}

@Injectable()
export class MatchesProvider {
  private readonly logger = new Logger(MatchesProvider.name);

  private countries: Country[] = [
    {
      id: 39,
      name: 'England',
      code: 'GB-ENG',
      flag: 'https://media.api-sports.io/flags/gb-eng.svg',
    },
    {
      id: 135,
      name: 'Italy',
      code: 'IT',
      flag: 'https://media.api-sports.io/flags/it.svg',
    },
    {
      id: 140,
      name: 'Spain',
      code: 'ES',
      flag: 'https://media.api-sports.io/flags/es.svg',
    },
  ];

  private season = 2025;

  // In-memory cache for single fixtures
  private fixtureCache: Map<string, CacheEntry> = new Map();

  // Cache TTL configurations (in milliseconds)
  private readonly CACHE_TTL_LIVE_MATCH = 30000; // 30 seconds for live matches
  private readonly CACHE_TTL_FINISHED_MATCH = 900000; // 15 minutes for finished matches
  private readonly CACHE_TTL_UPCOMING_MATCH = 300000; // 5 minutes for upcoming matches
  private readonly CACHE_TTL_DEFAULT = 60000; // 1 minute default

  constructor(private readonly configService: ConfigService) {
    // Clean up expired cache entries every 5 minutes
    setInterval(() => this.cleanupCache(), 300000);
  }

  public async getSingleFixture(fixtureId: string): Promise<Fixture> {
    // Check cache first
    const cachedFixture = this.getFromCache(fixtureId);

    if (cachedFixture) {
      return cachedFixture;
    }

    // If not in cache, fetch from API
    const endpoint = `fixtures?id=${fixtureId}`;
    const fixtureResponse =
      await this.callFootballAPI<FixtureAPIResponse>(endpoint);
    const fixture = fixtureResponse.response[0];

    const fixturePrediction = await this.getPrediction(fixture.fixture.id);

    const formattedFixtures = {
      id: fixture.fixture.id,
      date: fixture.fixture.date,
      time: convertTimestampToTime(
        fixture.fixture.timestamp,
        fixture.fixture.timezone,
      ),
      timezone: fixture.fixture.timezone,
      venue: fixture.fixture.venue.name,
      leagueCountry: fixture.league.country,
      leagueName: fixture.league.name,
      leagueLogo: fixture.league.logo,
      leagueFlag: fixture.league.flag,
      matchDay: fixture.league.round,
      homeTeamId: fixture.teams.home.id,
      homeTeam: fixture.teams.home.name,
      homeTeamLogo: fixture.teams.home.logo,
      awayTeamId: fixture.teams.away.id,
      awayTeam: fixture.teams.away.name,
      awayTeamLogo: fixture.teams.away.logo,
      widget: this.fixtureWidget(fixture.fixture.id.toString()),
      matchStats: {
        status: fixture.fixture.status.short as MatchStatsStatus,
        isHomeWinner: fixture.teams.home.winner,
        isAwayWinner: fixture.teams.away.winner,
      },
      prediction: fixturePrediction || undefined,
    };

    // Cache the result with appropriate TTL
    this.setInCache(fixtureId, formattedFixtures);

    return formattedFixtures;
  }

  public async getFixtures(): Promise<GroupedFixturesResponse> {
    const today = new Date();
    const sevenDaysLater = new Date(today);
    sevenDaysLater.setDate(today.getDate() + 7);
    // const fromDate = today.toISOString().split('T')[0];
    // const toDate = sevenDaysLater.toISOString().split('T')[0];

    const fromDate = '2025-08-15';
    const toDate = '2025-08-18';

    const groupedFixtures: GroupedFixturesResponse = [];

    for (const country of this.countries) {
      const league = country.id;
      const endpoint = `fixtures?league=${league}&season=${this.season}&from=${fromDate}&to=${toDate}`;

      const fixtures = await this.callFootballAPI<FixtureAPIResponse>(endpoint);

      if (fixtures.errors.length !== 0) {
        throw new HttpException(
          `Error fetching fixtures for ${league}`,
          HttpStatus.BAD_GATEWAY,
        );
      }

      const fixturesResponse = fixtures.response;

      const fixturesWithCountry = await Promise.all(
        fixturesResponse.map(async (fixture) => {
          const fixturePrediction = await this.getPrediction(
            fixture.fixture.id,
          );

          const formattedFixtures = {
            id: fixture.fixture.id,
            date: fixture.fixture.date,
            time: convertTimestampToTime(
              fixture.fixture.timestamp,
              fixture.fixture.timezone,
            ),
            timezone: fixture.fixture.timezone,
            venue: fixture.fixture.venue.name,
            leagueCountry: fixture.league.country,
            leagueName: fixture.league.name,
            leagueLogo: fixture.league.logo,
            leagueFlag: fixture.league.flag,
            matchDay: fixture.league.round,
            homeTeamId: fixture.teams.home.id,
            homeTeam: fixture.teams.home.name,
            homeTeamLogo: fixture.teams.home.logo,
            awayTeamId: fixture.teams.away.id,
            awayTeam: fixture.teams.away.name,
            awayTeamLogo: fixture.teams.away.logo,
            country: {
              id: country.id,
              name: country.name,
              code: country.code,
              flag: country.flag,
            },
            widget: this.fixtureWidget(fixture.fixture.id.toString()),
            prediction: fixturePrediction || undefined,
            matchStats: {
              status: fixture.fixture.status.short as MatchStatsStatus,
              isHomeWinner: fixture.teams.home.winner,
              isAwayWinner: fixture.teams.away.winner,
            },
          };

          return formattedFixtures;
        }),
      );

      // Group fixtures by country
      const countryFixtures: CountryFixtures = {
        country: {
          id: country.id,
          name: country.name,
          code: country.code,
          flag: country.flag,
          tableWidget: this.leagueWidget({ league: country.id }),
        },
        fixtures: fixturesWithCountry.filter((fixture) => {
          return fixture.matchStats.status === 'NS';
        }),
      };

      groupedFixtures.push(countryFixtures);
    }

    return groupedFixtures;
  }

  public async getDummyFixtures(): Promise<{
    country: Country;
    fixtures: Fixture[];
  }> {
    const today = new Date();
    const date = today.toISOString().split('T')[0];

    const endpoint = `fixtures?date=${date}`;

    const fixtures = await this.callFootballAPI<FixtureAPIResponse>(endpoint);

    if (fixtures.errors.length !== 0) {
      throw new HttpException(
        `Error fetching fixtures`,
        HttpStatus.BAD_GATEWAY,
      );
    }

    const fixturesResponse = fixtures.response;

    const fixturesWithCountry = await Promise.all(
      fixturesResponse.map(async (fixture) => {
        const fixturePrediction = await this.getPrediction(fixture.fixture.id);

        const formattedFixtures = {
          id: fixture.fixture.id,
          date: fixture.fixture.date,
          time: convertTimestampToTime(
            fixture.fixture.timestamp,
            fixture.fixture.timezone,
          ),
          timezone: fixture.fixture.timezone,
          venue: fixture.fixture.venue.name,
          leagueCountry: fixture.league.country,
          leagueName: fixture.league.name,
          leagueLogo: fixture.league.logo,
          leagueFlag: fixture.league.flag,
          matchDay: fixture.league.round,
          homeTeamId: fixture.teams.home.id,
          homeTeam: fixture.teams.home.name,
          homeTeamLogo: fixture.teams.home.logo,
          awayTeamId: fixture.teams.away.id,
          awayTeam: fixture.teams.away.name,
          awayTeamLogo: fixture.teams.away.logo,
          country: {
            id: fixture.league.id,
            name: fixture.league.name,
            code: fixture.league.country,
            flag: fixture.league.flag,
          },
          widget: this.fixtureWidget(fixture.fixture.id.toString()),
          prediction: fixturePrediction || undefined,
          matchStats: {
            status: fixture.fixture.status.short as MatchStatsStatus,
            isHomeWinner: fixture.teams.home.winner,
            isAwayWinner: fixture.teams.away.winner,
          },
        };

        return formattedFixtures;
      }),
    );

    const country: Country = {
      id: 10000,
      name: 'Friendly',
      code: 'FR',
      flag: 'https://media.api-sports.io/flags/es.svg',
    };

    const fullFixtures = fixturesWithCountry
      .filter((fixture) => {
        return fixture.matchStats.status === 'NS';
      })
      .filter((fixture) => {
        return fixture.prediction !== undefined;
      })
      .slice(0, 30);

    return {
      country,
      fixtures: fullFixtures,
    };

    // return fixturesWithCountry
    //   .filter((fixture) => {
    //     return fixture.matchStats.status === 'NS';
    //   })
    //   .slice(0, 30);
  }

  private async getPrediction(
    fixtureId: number,
  ): Promise<FormattedPrediction | null> {
    try {
      const endpoint = `predictions?fixture=${fixtureId}`;

      const fixturePrediction =
        await this.callFootballAPI<PredictionAPIResponse>(endpoint);

      // Check if response exists and has data
      if (
        !fixturePrediction.response ||
        fixturePrediction.response.length === 0
      ) {
        this.logger.warn(
          `No prediction data available for fixture ${fixtureId}`,
        );
        return null;
      }

      const predictionResponse = fixturePrediction.response[0];

      // Check if predictionResponse has the required properties
      if (
        !predictionResponse ||
        !predictionResponse.predictions ||
        !predictionResponse.comparison
      ) {
        this.logger.warn(
          `Invalid prediction data structure for fixture ${fixtureId}`,
        );
        return null;
      }

      const odds = generateOdds(
        predictionResponse.predictions.percent,
        predictionResponse.comparison,
      );

      const formattedPrediction: FormattedPrediction = {
        homePercent: predictionResponse.predictions.percent.home,
        awayPercent: predictionResponse.predictions.percent.away,
        drawPercent: predictionResponse.predictions.percent.draw,
        advice: predictionResponse.predictions.advice,
        h2hHome: predictionResponse.comparison.h2h.home,
        h2hAway: predictionResponse.comparison.h2h.away,
        h2hGoalsHome: predictionResponse.comparison.goals.home,
        h2hGoalsAway: predictionResponse.comparison.goals.away,
        h2hTotalHome: predictionResponse.comparison.total.home,
        h2hTotalAway: predictionResponse.comparison.total.away,
        odds,
      };

      return formattedPrediction;
    } catch (error) {
      this.logger.error(
        `Failed to get prediction for fixture ${fixtureId}: ${error.message}`,
      );
      return null;
    }
  }

  private leagueWidget({ league }: { league: number }): WidgetConfig {
    return {
      type: 'standings',
      config: {
        host: 'v3.football.api-sports.io',
        league,
        team: '',
        season: this.season,
        theme: '',
        showErrors: false,
        showLogos: true,
      },
    };
  }

  private fixtureWidget(fixtureId: string): WidgetConfig {
    return {
      type: 'game',
      config: {
        host: 'v3.football.api-sports.io',
        id: fixtureId,
        theme: '',
        refresh: 15,
        showErrors: false,
        showLogos: true,
      },
    };
  }

  /**
   * Generic function to call the football API from anywhere in the application
   * @param endpoint - The API endpoint (e.g., '/fixtures?live=all', '/teams/countries')
   * @returns Promise with the API response
   */
  private async callFootballAPI<T = any>(endpoint: string): Promise<T> {
    const baseUrl = this.configService.get<string>('SPORT_API_URL');
    const apiKey = this.configService.get<string>('SPORT_API_KEY');

    if (!baseUrl || !apiKey) {
      throw new Error('Football API configuration is missing');
    }

    const url = `${baseUrl}${endpoint}`;

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'x-rapidapi-host': 'v3.football.api-sports.io',
          'x-rapidapi-key': apiKey,
        },
      });

      if (!response.ok) {
        throw new Error(`API request failed with status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      this.logger.error(`${error}`);
      throw new Error(`Failed to call football API: ${error.message}`);
    }
  }

  /**
   * Get fixture from cache if it exists and is not expired
   */
  private getFromCache(fixtureId: string): Fixture | null {
    const cacheKey = `matches:fixture:${fixtureId}`;
    const cacheEntry = this.fixtureCache.get(cacheKey);

    if (!cacheEntry) {
      return null;
    }

    const now = Date.now();
    if (now - cacheEntry.timestamp > cacheEntry.ttl) {
      // Cache entry expired, remove it
      this.fixtureCache.delete(cacheKey);
      return null;
    }

    return cacheEntry.data;
  }

  /**
   * Set fixture in cache with appropriate TTL based on match status
   */
  private setInCache(fixtureId: string, fixture: Fixture): void {
    const now = Date.now();
    let ttl: number;

    // Determine TTL based on match status
    switch (fixture.matchStats.status) {
      case '1H':
      case 'HT':
      case '2H':
      case 'ET':
      case 'P':
      case 'BT':
      case 'LIVE':
        // Live matches - short TTL for frequent updates
        ttl = this.CACHE_TTL_LIVE_MATCH;
        break;
      case 'FT':
      case 'AET':
      case 'PEN':
      case 'FT_PEN':
        // Finished matches - longer TTL since result won't change
        ttl = this.CACHE_TTL_FINISHED_MATCH;
        break;
      case 'NS':
      case 'TBD':
      case 'POSTP':
      case 'SUSP':
      case 'INT':
      case 'CANC':
      case 'ABD':
      case 'AWD':
      case 'WO':
        // Upcoming or special status matches - medium TTL
        ttl = this.CACHE_TTL_UPCOMING_MATCH;
        break;
      default:
        // Default TTL for unknown statuses
        ttl = this.CACHE_TTL_DEFAULT;
    }

    // Use namespaced key for better organization
    const cacheKey = `matches:fixture:${fixtureId}`;
    this.fixtureCache.set(cacheKey, {
      data: fixture,
      timestamp: now,
      ttl,
    });
  }

  /**
   * Clean up expired cache entries
   */
  private cleanupCache(): void {
    const now = Date.now();
    const expiredKeys: string[] = [];

    for (const [key, entry] of this.fixtureCache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        expiredKeys.push(key);
      }
    }

    expiredKeys.forEach((key) => this.fixtureCache.delete(key));

    if (expiredKeys.length > 0) {
      console.log(`Cleaned up ${expiredKeys.length} expired cache entries`);
    }
  }

  /**
   * Force refresh a specific fixture in cache
   */
  public invalidateFixtureCache(fixtureId: string): void {
    const cacheKey = `matches:fixture:${fixtureId}`;
    this.fixtureCache.delete(cacheKey);
  }

  /**
   * Clear all fixture cache entries
   */
  public clearAllFixtureCache(): void {
    this.fixtureCache.clear();
  }

  /**
   * Get cache statistics for monitoring
   */
  public getCacheStats(): { size: number; entries: string[] } {
    return {
      size: this.fixtureCache.size,
      entries: Array.from(this.fixtureCache.keys()).map(
        (key) => key.replace('matches:fixture:', ''), // Remove namespace for cleaner display
      ),
    };
  }

  /**
   * Get detailed cache statistics including hit rate and memory usage
   */
  public getDetailedCacheStats(): {
    size: number;
    entries: string[];
    totalMemoryUsage: number;
    averageEntrySize: number;
    oldestEntry: number | null;
    newestEntry: number | null;
  } {
    const entries = Array.from(this.fixtureCache.entries());
    const timestamps = entries.map(([_, entry]) => entry.timestamp);

    return {
      size: this.fixtureCache.size,
      entries: Array.from(this.fixtureCache.keys()).map(
        (key) => key.replace('matches:fixture:', ''), // Remove namespace for cleaner display
      ),
      totalMemoryUsage: JSON.stringify(Array.from(this.fixtureCache.values()))
        .length,
      averageEntrySize:
        this.fixtureCache.size > 0
          ? JSON.stringify(Array.from(this.fixtureCache.values())).length /
            this.fixtureCache.size
          : 0,
      oldestEntry: timestamps.length > 0 ? Math.min(...timestamps) : null,
      newestEntry: timestamps.length > 0 ? Math.max(...timestamps) : null,
    };
  }
}
