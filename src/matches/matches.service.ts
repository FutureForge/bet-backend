import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { MatchesProvider } from './provider/matches-provider.provider';
import {
  Country,
  Fixture,
  GroupedFixturesResponse,
} from './types/matches.type';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject } from '@nestjs/common';
import { Cache } from 'cache-manager';

@Injectable()
export class MatchesService {
  private readonly logger = new Logger(MatchesService.name);
  private readonly CACHE_KEY_FIXTURES = 'matches:fixtures:grouped';
  private readonly CACHE_KEY_DUMMY_FIXTURES = 'matches:fixtures:dummy';
  private readonly CACHE_TTL = 3600000; // 1 hour in milliseconds

  constructor(
    private matchesProvider: MatchesProvider,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  @Cron(CronExpression.EVERY_HOUR)
  async handleGetMatches() {
    this.logger.debug('Fetching matches data every hour');
    try {
      const fixtures = await this.matchesProvider.getFixtures();
      await this.cacheManager.set(
        this.CACHE_KEY_FIXTURES,
        fixtures,
        this.CACHE_TTL,
      );
      this.logger.debug(`Cached ${fixtures.length} country groups for 1 hour`);
    } catch (error) {
      this.logger.error('Failed to fetch and cache matches data:', error);
    }
  }

  async getAllFixtures(): Promise<GroupedFixturesResponse> {
    let fixtures = await this.cacheManager.get<GroupedFixturesResponse>(
      this.CACHE_KEY_FIXTURES,
    );

    if (!fixtures) {
      this.logger.debug('Cache miss, fetching fresh data');
      try {
        fixtures = await this.matchesProvider.getFixtures();
        await this.cacheManager.set(
          this.CACHE_KEY_FIXTURES,
          fixtures,
          this.CACHE_TTL,
        );
        this.logger.debug(
          `Cached ${fixtures.length} country groups for 1 hour`,
        );
      } catch (error) {
        this.logger.error('Failed to fetch fixtures data:', error);
        throw error;
      }
    } else {
      this.logger.debug('Cache hit, returning cached data');
    }

    return fixtures;
  }

  async getDummyFixtures(): Promise<{
    country: Country;
    fixtures: Fixture[];
  }> {
    let fixtures = await this.cacheManager.get<{
      country: Country;
      fixtures: Fixture[];
    }>(this.CACHE_KEY_DUMMY_FIXTURES);

    if (!fixtures) {
      this.logger.debug('Cache miss, fetching fresh dummy data');
      try {
        fixtures = await this.matchesProvider.getDummyFixtures();
        await this.cacheManager.set(
          this.CACHE_KEY_DUMMY_FIXTURES,
          fixtures,
          this.CACHE_TTL,
        );
        this.logger.debug(
          `Cached ${fixtures.fixtures.length} dummy fixtures for 1 hour`,
        );
      } catch (error) {
        this.logger.error('Failed to fetch dummy fixtures data:', error);
        throw error;
      }
    } else {
      this.logger.debug('Cache hit, returning cached data');
    }

    return fixtures;
  }

  async getSingleFixture(fixtureId: string): Promise<Fixture> {
    const fixture = await this.matchesProvider.getSingleFixture(fixtureId);
    return fixture;
  }

  async clearFixturesCache(): Promise<void> {
    await this.cacheManager.del(this.CACHE_KEY_FIXTURES);
    await this.cacheManager.del(this.CACHE_KEY_DUMMY_FIXTURES);
    // Clear individual fixture cache as well
    this.matchesProvider.clearAllFixtureCache();
    this.logger.debug('All fixtures cache cleared');
  }

  async clearIndividualFixtureCache(): Promise<void> {
    this.matchesProvider.clearAllFixtureCache();
    this.logger.debug('Individual fixtures cache cleared');
  }

  async getCacheStatus(): Promise<{
    fixturesListCache: {
      cached: boolean;
      key: string;
      ttl: number;
    };
    dummyFixturesCache: {
      cached: boolean;
      key: string;
      ttl: number;
    };
    individualFixturesCache: {
      size: number;
      entries: string[];
      totalMemoryUsage: number;
      averageEntrySize: number;
      oldestEntry: number | null;
      newestEntry: number | null;
    };
  }> {
    const fixtures = await this.cacheManager.get<GroupedFixturesResponse>(
      this.CACHE_KEY_FIXTURES,
    );
    const dummyFixtures = await this.cacheManager.get<Fixture[]>(
      this.CACHE_KEY_DUMMY_FIXTURES,
    );
    const fixtureCacheStats = this.matchesProvider.getDetailedCacheStats();

    return {
      fixturesListCache: {
        cached: !!fixtures,
        key: this.CACHE_KEY_FIXTURES,
        ttl: this.CACHE_TTL,
      },
      dummyFixturesCache: {
        cached: !!dummyFixtures,
        key: this.CACHE_KEY_DUMMY_FIXTURES,
        ttl: this.CACHE_TTL,
      },
      individualFixturesCache: fixtureCacheStats,
    };
  }
}
