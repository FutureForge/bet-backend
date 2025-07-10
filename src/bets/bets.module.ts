import { Module } from '@nestjs/common';
import { BetsService } from './bets.service';
import { BetsController } from './bets.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { BetSlip, BetSlipSchema } from './entities/bet-slip.entity';
import {
  BetSelection,
  BetSelectionSchema,
} from './entities/bet-selection.entity';
import { MatchesProvider } from 'src/matches/provider/matches-provider.provider';
import { UsersModule } from 'src/users/users.module';

@Module({
  controllers: [BetsController],
  providers: [BetsService, MatchesProvider],
  imports: [
    MongooseModule.forFeature([
      {
        name: BetSlip.name,
        schema: BetSlipSchema,
      },
      {
        name: BetSelection.name,
        schema: BetSelectionSchema,
      },
    ]),
    UsersModule,
  ],
})
export class BetsModule {}
