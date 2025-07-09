import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  FixtureAPIResponse,
  FixtureResponse,
  Fixture,
  PredictionAPIResponse,
  FormattedPrediction,
} from '../types/matches.type';
import {
  convertTimestampToTime,
  generateOdds,
} from '../../global/providers/utils.provider';

interface Countries {
  id: number;
  name: string;
  code: string;
}

@Injectable()
export class MatchesProvider {
  private countries: Countries[] = [
    { id: 39, name: 'England', code: 'GB-ENG' },
    { id: 135, name: 'Italy', code: 'IT' },
    { id: 140, name: 'Spain', code: 'ES' },
  ];

  private season = 2025;

  constructor(private readonly configService: ConfigService) {}

  async getFixtures(): Promise<Fixture[]> {
    const today = new Date();
    const sevenDaysLater = new Date(today);
    sevenDaysLater.setDate(today.getDate() + 7);
    // const fromDate = today.toISOString().split('T')[0];
    // const toDate = sevenDaysLater.toISOString().split('T')[0];

    const fromDate = '2025-08-15';
    const toDate = '2025-08-18';

    const allFixtures: Fixture[] = [];

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
          console.log({ fixturePrediction });

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
            },
            prediction: fixturePrediction,
          };

          return formattedFixtures;
        }),
      );

      allFixtures.push(...fixturesWithCountry);
    }

    return allFixtures;
  }

  async getPrediction(fixtureId: number): Promise<FormattedPrediction> {
    const endpoint = `predictions?fixture=${fixtureId}`;

    const fixturePrediction =
      await this.callFootballAPI<PredictionAPIResponse>(endpoint);

    const predictionResponse = fixturePrediction.response[0];

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
  }

  /**
   * Generic function to call the football API from anywhere in the application
   * @param endpoint - The API endpoint (e.g., '/fixtures?live=all', '/teams/countries')
   * @returns Promise with the API response
   */
  async callFootballAPI<T = any>(endpoint: string): Promise<T> {
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
      throw new Error(`Failed to call football API: ${error.message}`);
    }
  }
}
