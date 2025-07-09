import { Module } from '@nestjs/common';
import { BetsService } from './bets.service';
import { BetsController } from './bets.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Bet, BetSchema } from './entities/bet.entity';
import { MatchesProvider } from 'src/matches/provider/matches-provider.provider';

@Module({
  controllers: [BetsController],
  providers: [BetsService, MatchesProvider],
  imports: [
    MongooseModule.forFeature([
      {
        name: Bet.name,
        schema: BetSchema,
      },
    ]),
  ],
})
export class BetsModule {}
