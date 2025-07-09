import { Injectable, Logger } from '@nestjs/common';
import { CreateMatchDto } from './dto/create-match.dto';
import { UpdateMatchDto } from './dto/update-match.dto';
import { Cron, CronExpression } from '@nestjs/schedule';
import { MatchesProvider } from './provider/matches-provider.provider';
import { Fixture } from './types/matches.type';

@Injectable()
export class MatchesService {
  private readonly logger = new Logger(MatchesService.name);

  constructor(
    private matchesProvider: MatchesProvider,
    //
  ) {}

  @Cron(CronExpression.EVERY_30_SECONDS)
  async handleGetMatches() {
    this.logger.debug('Called every 30 seconds');
  }

  async getAllFixtures(): Promise<Fixture[]> {
    return this.matchesProvider.getFixtures();
  }

  create(createMatchDto: CreateMatchDto) {
    return 'This action adds a new match';
  }

  findAll() {
    return `This action returns all matches`;
  }

  findOne(id: number) {
    return `This action returns a #${id} match`;
  }

  update(id: number, updateMatchDto: UpdateMatchDto) {
    return `This action updates a #${id} match`;
  }

  remove(id: number) {
    return `This action removes a #${id} match`;
  }
}
