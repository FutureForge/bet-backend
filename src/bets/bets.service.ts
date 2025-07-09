import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { CreateBetDto } from './dto/create-bet.dto';
import { UpdateBetDto } from './dto/update-bet.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Bet, BetResult, MatchResult } from './entities/bet.entity';
import { Model } from 'mongoose';
import { Cron, CronExpression } from '@nestjs/schedule';
import { MatchesService } from 'src/matches/matches.service';
import { MatchesProvider } from 'src/matches/provider/matches-provider.provider';
import { UsersService } from 'src/users/users.service';

@Injectable()
export class BetsService {
  private readonly logger = new Logger(MatchesService.name);

  constructor(
    @InjectModel(Bet.name)
    private readonly betModel: Model<Bet>,

    private matchProvider: MatchesProvider,

    private usersService: UsersService,
  ) {}

  // @Cron(CronExpression.EVERY_10_SECONDS)
  @Cron('0 */15 * * * *')
  async handleBet() {
    this.logger.debug('Updating bet data every 15 minutes');
    try {
      const unresolvedBets = await this.findAllUnresolvedBet();

      if (unresolvedBets.length === 0) {
        this.logger.debug('No unresolved bet');
        return;
      }

      // Group bets by matchId to avoid multiple API calls for the same fixture
      const betsByMatch = new Map<string, Bet[]>();
      for (const bet of unresolvedBets) {
        const matchId = bet.matchId.toString();
        if (!betsByMatch.has(matchId)) {
          betsByMatch.set(matchId, []);
        }
        betsByMatch.get(matchId)!.push(bet);
      }

      // Process each unique fixture
      for (const [matchId, bets] of betsByMatch) {
        try {
          const betFixture = await this.matchProvider.getSingleFixture(matchId);
          const isMatchOver = betFixture.matchStats.status === 'FT';

          if (isMatchOver) {
            const isHomeWinner = betFixture.matchStats.isHomeWinner;
            const isAwayWinner = betFixture.matchStats.isAwayWinner;

            let matchResult: MatchResult;
            if (isHomeWinner) {
              matchResult = 'home';
            } else if (isAwayWinner) {
              matchResult = 'away';
            } else {
              matchResult = 'draw';
            }

            // Process all bets for this fixture
            for (const bet of bets) {
              let betResult: BetResult;
              if (bet.selectedOutcome === matchResult) {
                betResult = 'won';
              } else {
                betResult = 'lost';
              }

              await this.updateBet({
                betId: bet.betId.toString(),
                betResult,
                matchResult,
              });

              // updating user info
              const winnings =
                betResult === 'won' ? bet.betAmount * bet.oddsAtPlacement : 0;

              await this.usersService.updateStats({
                address: bet.userAddress,
                stats: {
                  totalWagered: bet.betAmount,
                  totalWon: winnings,
                  winCount: betResult === 'won' ? 1 : 0,
                  lossCount: betResult === 'lost' ? 1 : 0,
                },
              });

              this.logger.debug(
                `Updated bet ${bet.betId}: ${betResult} (match: ${matchResult})`,
              );
            }

            this.logger.debug(
              `Processed ${bets.length} bets for fixture ${matchId}`,
            );
          }
        } catch (error: any) {
          this.logger.error(
            `Error processing fixture ${matchId}: ${error.message}`,
          );
        }
      }
    } catch (error: any) {
      this.logger.error(`Error updating bet: ${error.message}`);
    }
  }

  async updateBet({
    betId,
    betResult,
    matchResult,
  }: {
    matchResult: MatchResult;
    betResult: BetResult;
    betId: string;
  }) {
    try {
      const updatedBet = await this.betModel.findOneAndUpdate(
        { betId: parseInt(betId) },
        {
          betResult,
          matchResult,
          resolvedAt: new Date(),
        },
        { new: true },
      );

      if (!updatedBet) {
        throw new HttpException(
          `Bet with ID ${betId} not found`,
          HttpStatus.NOT_FOUND,
        );
      }

      return updatedBet;
    } catch (error: any) {
      throw new HttpException(
        `Error Updating Bet: ${error.message}`,
        HttpStatus.BAD_GATEWAY,
        {
          cause: error.message,
          description: error,
        },
      );
    }
  }

  async create(createBetDto: CreateBetDto): Promise<Bet> {
    const {
      betAmount,
      betId,
      matchId,
      oddsAtPlacement,
      selectedOutcome,
      userAddress,
    } = createBetDto;

    try {
      // First, check if the match exists and get its status
      const fixture = await this.matchProvider.getSingleFixture(
        matchId.toString(),
      );

      if (!fixture) {
        throw new HttpException(
          `Match with ID ${matchId} not found`,
          HttpStatus.NOT_FOUND,
        );
      }

      // Check if the match status is 'NS' (Not Started)
      if (fixture.matchStats.status !== 'NS') {
        throw new HttpException(
          `Cannot place bet on match ${matchId}. Match status is ${fixture.matchStats.status}. Only matches with status 'NS' (Not Started) are allowed for betting.`,
          HttpStatus.BAD_REQUEST,
        );
      }

      const bet = new this.betModel({
        userAddress,
        betAmount,
        betId,
        matchId,
        oddsAtPlacement,
        selectedOutcome,
        placedAt: new Date(),
        // betResult,
        // isClaimed,
        // matchResult,
        // resolvedAt,
        // txHash,
      });

      return bet.save();
    } catch (error: any) {
      if (error instanceof HttpException) {
        throw error;
      }

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

  async findAllUnresolvedBet(): Promise<Bet[]> {
    const bets = await this.findAll();

    const filteredBet = bets.filter((bet) => {
      return bet.matchResult === 'pending';
    });

    return filteredBet;
  }

  async findAllResolvedBet(): Promise<Bet[]> {
    const bets = await this.findAll();

    const filteredBet = bets.filter((bet) => {
      return bet.matchResult !== 'pending';
    });

    return filteredBet;
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

  async findUserBets(userAddress: string): Promise<Bet[]> {
    try {
      const bets = await this.betModel.find({
        userAddress: userAddress,
      });

      return bets;
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
