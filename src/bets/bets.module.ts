import { Module } from '@nestjs/common';
import { BetsService } from './bets.service';
import { BetsController } from './bets.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Bet, BetSchema } from './entities/bet.entity';

@Module({
  controllers: [BetsController],
  providers: [BetsService],
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
