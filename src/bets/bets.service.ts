import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { CreateBetDto } from './dto/create-bet.dto';
import { UpdateBetDto } from './dto/update-bet.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Bet } from './entities/bet.entity';
import { Model } from 'mongoose';

@Injectable()
export class BetsService {
  constructor(
    @InjectModel(Bet.name)
    private readonly betModel: Model<Bet>,
  ) {}

  create(createBetDto: CreateBetDto): Promise<Bet> {
    const {
      betAmount,
      betId,
      matchId,
      oddsAtPlacement,
      selectedOutcome,
      userAddress,
    } = createBetDto;

    try {
      const bet = new this.betModel({
        userAddress,
        betAmount,
        betId,
        matchId,
        oddsAtPlacement,
        selectedOutcome,
        placedAt: new Date().getTime(),
        // betResult,
        // isClaimed,
        // matchResult,
        // resolvedAt,
        // txHash,
      });

      return bet.save();
    } catch (error: any) {
      throw new HttpException(
        `Error Creating Bet: ${error.message}`,
        HttpStatus.BAD_GATEWAY,
        {
          cause: error.message,
          description: error,
        },
      );
    }
  }

  async findAll(): Promise<Bet[]> {
    try {
      return await this.betModel.find().exec();
    } catch (error: any) {
      throw new HttpException(
        `Error Creating Bet: ${error.message}`,
        HttpStatus.BAD_GATEWAY,
        {
          cause: error.message,
          description: error,
        },
      );
    }
  }

  async findByBetId(betId: number): Promise<Bet> {
    try {
      const bet = await this.betModel.findOne({
        betId: betId,
      });

      if (!bet) {
        throw new HttpException(
          `Cant find bet based on ${betId}`,
          HttpStatus.BAD_GATEWAY,
        );
      }

      return bet;
    } catch (error: any) {
      throw new HttpException(
        `Error Finding Bet: ${error.message}`,
        HttpStatus.BAD_GATEWAY,
        {
          cause: error.message,
          description: error,
        },
      );
    }
  }
}
