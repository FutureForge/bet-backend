import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { MatchesProvider } from './provider/matches-provider.provider';
import { Fixture } from './types/matches.type';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject } from '@nestjs/common';
import { Cache } from 'cache-manager';

@Injectable()
export class MatchesService {
  private readonly logger = new Logger(MatchesService.name);
  private readonly CACHE_KEY = 'fixtures';
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
      await this.cacheManager.set(this.CACHE_KEY, fixtures, this.CACHE_TTL);
      this.logger.debug(`Cached ${fixtures.length} fixtures for 1 hour`);
    } catch (error) {
      this.logger.error('Failed to fetch and cache matches data:', error);
    }
  }

  async getAllFixtures(): Promise<Fixture[]> {
    let fixtures = await this.cacheManager.get<Fixture[]>(this.CACHE_KEY);
    
    if (!fixtures) {
      this.logger.debug('Cache miss, fetching fresh data');
      try {
        fixtures = await this.matchesProvider.getFixtures();
        await this.cacheManager.set(this.CACHE_KEY, fixtures, this.CACHE_TTL);
        this.logger.debug(`Cached ${fixtures.length} fixtures for 1 hour`);
      } catch (error) {
        this.logger.error('Failed to fetch fixtures data:', error);
        throw error;
      }
    } else {
      this.logger.debug('Cache hit, returning cached data');
    }
    
    return fixtures;
  }

  async clearFixturesCache(): Promise<void> {
    await this.cacheManager.del(this.CACHE_KEY);
    this.logger.debug('Fixtures cache cleared');
  }

  async getCacheStatus(): Promise<{ cached: boolean; key: string; ttl: number }> {
    const fixtures = await this.cacheManager.get<Fixture[]>(this.CACHE_KEY);
    return {
      cached: !!fixtures,
      key: this.CACHE_KEY,
      ttl: this.CACHE_TTL,
    };
  }
}
