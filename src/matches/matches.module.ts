import { Module } from '@nestjs/common';
import { MatchesService } from './matches.service';
import { MatchesController } from './matches.controller';
import { MatchesProvider } from './provider/matches-provider.provider';

@Module({
  controllers: [MatchesController],
  providers: [MatchesService, MatchesProvider],
})
export class MatchesModule {}
