import {
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
  Logger,
} from '@nestjs/common';
import { CreateBetDto, BetSelectionDto } from './dto/create-bet.dto';
import { UpdateBetSlipDto } from './dto/update-bet-slip.dto';
import { UpdateSelectionDto } from './dto/update-selection.dto';
import { InjectModel } from '@nestjs/mongoose';
import {
  BetSlip,
  BetSlipResult,
  BetSlipStatus,
} from './entities/bet-slip.entity';
import {
  BetSelection,
  SelectionResult,
  MatchResult,
} from './entities/bet-selection.entity';
import { Model, Types } from 'mongoose';
import { Cron, CronExpression } from '@nestjs/schedule';
import { MatchesService } from 'src/matches/matches.service';
import { MatchesProvider } from 'src/matches/provider/matches-provider.provider';
import { UsersService } from 'src/users/users.service';
import { BlockchainService } from './services/blockchain.service';
import { BetSlipAndSelection, Blockchain } from './types/bet.types';
import blockchainConfig from 'src/config/blockchain.config';
import { ConfigType } from '@nestjs/config';
import { ethers } from 'ethers';

@Injectable()
export class BetsService {
  private readonly logger = new Logger(BetsService.name);

  constructor(
    @Inject(blockchainConfig.KEY)
    private blockchainConfiguration: ConfigType<typeof blockchainConfig>,

    @InjectModel(BetSlip.name)
    private readonly betSlipModel: Model<BetSlip>,

    @InjectModel(BetSelection.name)
    private readonly betSelectionModel: Model<BetSelection>,

    private matchProvider: MatchesProvider,

    private usersService: UsersService,

    private blockchainService: BlockchainService,
  ) {}

  /**
   * Helper method to calculate total odds with precise decimal arithmetic
   * This prevents floating-point precision issues when multiplying decimal odds
   */
  private calculateTotalOdds(
    selections: { oddsAtPlacement: number }[],
  ): number {
    return selections.reduce((acc, selection) => {
      const result = parseFloat((acc * selection.oddsAtPlacement).toFixed(4));
      return result;
    }, 1);
  }

  /**
   * Generate blockchain signature for winning bet slips
   */
  private async generateClaimSignature(betSlip: BetSlip): Promise<string> {
    const privateKey = this.blockchainConfiguration.adminPrivateKey;
    const wallet = new ethers.Wallet(privateKey);
  
    const userAddress = ethers.getAddress(betSlip.userAddress.trim());
    const betId = BigInt(betSlip.betSlipId);
    const reward = BigInt(ethers.parseEther(betSlip.actualWinnings.toString()));
  
    const messageHash = ethers.solidityPackedKeccak256(
      ['address', 'uint256', 'uint256'],
      [userAddress, betId, reward],
    );

    // const ethSignedMessageHash = ethers.hashMessage(
    //   ethers.getBytes(messageHash),
    // );
    // const signerAddress = ethers.verifyMessage(ethers.getBytes(messageHash), signature);
  
    // signMessage auto wraps with Ethereum Signed Message prefix
    const signature = await wallet.signMessage(ethers.getBytes(messageHash));
  
    this.logger.debug(
      `Signature for betId ${betId} of reward ${reward} for user ${userAddress} generated =`,
      signature,
    );
  
    return signature;
  }

  @Cron(CronExpression.EVERY_30_MINUTES)
  async handleBetResolutions() {
    this.logger.debug('Updating bet slip data every 15 minutes');
    try {
      const unresolvedSelections = await this.findAllUnresolvedSelections();

      if (unresolvedSelections.length === 0) {
        this.logger.debug('No unresolved selections');
        return;
      }

      // Group selections by matchId to avoid multiple API calls for the same fixture
      const selectionsByMatch = new Map<string, BetSelection[]>();
      for (const selection of unresolvedSelections) {
        const matchId = selection.matchId.toString();
        if (!selectionsByMatch.has(matchId)) {
          selectionsByMatch.set(matchId, []);
        }
        selectionsByMatch.get(matchId)!.push(selection);
      }

      // Process each unique fixture
      for (const [matchId, selections] of selectionsByMatch) {
        try {
          const fixture = await this.matchProvider.getSingleFixture(matchId);
          const isMatchOver = fixture.matchStats.status === 'FT';

          if (isMatchOver) {
            const isHomeWinner = fixture.matchStats.isHomeWinner;
            const isAwayWinner = fixture.matchStats.isAwayWinner;

            let matchResult: MatchResult;
            if (isHomeWinner) {
              matchResult = 'home';
            } else if (isAwayWinner) {
              matchResult = 'away';
            } else {
              matchResult = 'draw';
            }

            // Process all selections for this fixture
            for (const selection of selections) {
              let selectionResult: SelectionResult;
              if (selection.selectedOutcome === matchResult) {
                selectionResult = 'won';
              } else {
                selectionResult = 'lost';
              }

              // Update selection with match outcome
              await this.updateSelection({
                betSlipId: selection.betSlipId,
                matchId: selection.matchId,
                selectionResult,
                matchResult,
              });

              this.logger.debug(
                `Updated selection ${selection.betSlipId}-${selection.matchId}: ${selectionResult} (match: ${matchResult})`,
              );
            }

            this.logger.debug(
              `Processed ${selections.length} selections for fixture ${matchId}`,
            );
          }
        } catch (error: any) {
          this.logger.error(
            `Error processing fixture ${matchId}: ${error.message}`,
          );
        }
      }

      // After processing all selections, update bet slip results
      await this.updateBetSlipResults();
    } catch (error: any) {
      this.logger.error(`Error updating bet slips: ${error.message}`);
    }
  }

  async updateBetSlipResults() {
    try {
      const pendingBetSlips = await this.findAllPendingBetSlips();

      for (const betSlipData of pendingBetSlips) {
        const selections = betSlipData.betSelection;

        // Check if all selections are resolved
        const allResolved = selections.every(
          (selection) => selection.selectionResult !== 'pending',
        );

        if (allResolved) {
          const wonSelections = selections.filter(
            (selection) => selection.selectionResult === 'won',
          );
          const lostSelections = selections.filter(
            (selection) => selection.selectionResult === 'lost',
          );

          let betSlipResult: BetSlipResult;
          let actualWinnings = 0;

          if (lostSelections.length === 0) {
            // All selections won
            betSlipResult = 'won';
            actualWinnings = betSlipData.betSlip.expectedPayment;
          } else if (wonSelections.length === 0) {
            // All selections lost
            betSlipResult = 'lost';
            actualWinnings = 0;
          } else {
            // Mixed results - some won, some lost
            betSlipResult = 'lost';
            actualWinnings = 0;
          }

          // Update bet slip
          await this.updateBetSlip({
            betSlipId: betSlipData.betSlip.betSlipId.toString(),
            betSlipResult,
            status: 'resolved',
            actualWinnings,
          });

          // Update user stats (totalWagered is already updated during bet creation)
          await this.usersService.updateStats({
            address: betSlipData.betSlip.userAddress,
            stats: {
              totalWon: actualWinnings,
              winCount: betSlipResult === 'won' ? 1 : 0,
              lossCount: betSlipResult === 'lost' ? 1 : 0,
            },
            blockchain: betSlipData.betSlip.blockchain,
          });

          this.logger.debug(
            `Updated bet slip ${betSlipData.betSlip.betSlipId}: ${betSlipResult} (winnings: ${actualWinnings})`,
          );

          // Generate signature only for winning bet slips
          if (betSlipResult === 'won') {
            const signature = await this.generateClaimSignature(
              betSlipData.betSlip,
            );

            await this.betSlipModel.findOneAndUpdate(
              { betSlipId: betSlipData.betSlip.betSlipId },
              { claimSignature: signature },
              { new: true },
            );

            this.logger.debug(`Claim signature added to betslip`);
          }
        }
      }
    } catch (error: any) {
      this.logger.error(`Error updating bet slip results: ${error.message}`);
    }
  }

  async create(createBetDto: CreateBetDto): Promise<BetSlipAndSelection> {
    const { userAddress, betSlipId, totalBetAmount, selections, blockchain } =
      createBetDto;

    try {
      // Validate blockchain
      if (!this.blockchainService.isSupportedBlockchain(blockchain)) {
        throw new HttpException(
          `Unsupported blockchain: ${blockchain}`,
          HttpStatus.BAD_REQUEST,
        );
      }

      // Validate wallet address for the specific blockchain
      if (
        !this.blockchainService.validateWalletAddress(userAddress, blockchain)
      ) {
        throw new HttpException(
          `Invalid wallet address for blockchain ${blockchain}`,
          HttpStatus.BAD_REQUEST,
        );
      }

      // Check if user exists and create if not
      try {
        await this.usersService.findByAddress(userAddress);
      } catch (error) {
        // User doesn't exist, create them
        await this.usersService.create({ address: userAddress });
      }

      // checking if betSlipId already exists for this blockchain
      const existingBet = await this.betSlipModel.findOne({
        blockchain: blockchain,
        betSlipId: betSlipId,
      });

      if (existingBet) {
        throw new HttpException(
          `Bet with ID: ${betSlipId} already exists for blockchain ${blockchain}`,
          HttpStatus.CONFLICT,
        );
      }

      // Calculate expected payment (multiply all odds together)
      const totalOdds = this.calculateTotalOdds(selections);
      const expectedPayment = totalBetAmount * totalOdds;

      // Validate all matches exist and get team information
      const selectionsWithTeamInfo = [];

      for (const selection of selections) {
        const fixture = await this.matchProvider.getSingleFixture(
          selection.matchId.toString(),
        );

        if (!fixture) {
          throw new HttpException(
            `Match with ID ${selection.matchId} not found`,
            HttpStatus.NOT_FOUND,
          );
        }

        //  if (fixture.matchStats.status !== 'NS') {
        //   throw new HttpException(
        //     `Cannot place bet on match ${selection.matchId}. Match status is ${fixture.matchStats.status}. Only matches with status 'NS' (Not Started) are allowed for betting.`,
        //     HttpStatus.BAD_REQUEST,
        //   );
        // }

        // Extract team information from fixture
        const homeTeam = fixture.homeTeam || 'Unknown Home Team';
        const awayTeam = fixture.awayTeam || 'Unknown Away Team';
        const matchStartTime = fixture.date || new Date();

        selectionsWithTeamInfo.push({
          ...selection,
          homeTeam,
          awayTeam,
          matchStartTime: new Date(matchStartTime),
        });
      }

      // Create bet slip
      const betSlip = new this.betSlipModel({
        userAddress,
        betSlipId,
        totalBetAmount,
        expectedPayment,
        totalOdds,
        blockchain,
        placedAt: new Date(),
      });

      const savedBetSlip = await betSlip.save();

      // Create bet selections with team information
      const betSelections = selectionsWithTeamInfo.map((selection) => ({
        betSlipId: betSlip._id,
        matchId: selection.matchId,
        selectedOutcome: selection.selectedOutcome,
        oddsAtPlacement: selection.oddsAtPlacement,
        homeTeam: selection.homeTeam,
        awayTeam: selection.awayTeam,
        matchStartTime: selection.matchStartTime,
      }));

      const savedBetSelection =
        await this.betSelectionModel.insertMany(betSelections);

      // Update user's totalWagered stats immediately upon bet creation
      await this.usersService.updateStats({
        address: userAddress,
        stats: {
          totalWagered: totalBetAmount,
        },
        blockchain: blockchain,
      });

      return {
        betSlip: savedBetSlip,
        betSelection: savedBetSelection,
      };
    } catch (error: any) {
      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException(
        `Error Creating Bet Slip: ${error.message}`,
        HttpStatus.BAD_GATEWAY,
        {
          cause: error.message,
          description: error,
        },
      );
    }
  }

  async updateBetSlip({
    betSlipId,
    betSlipResult,
    status,
    actualWinnings,
  }: {
    betSlipId: string;
    betSlipResult: BetSlipResult;
    status: BetSlipStatus;
    actualWinnings: number;
  }) {
    try {
      const updateData: any = {};

      if (betSlipResult !== undefined) {
        updateData.betSlipResult = betSlipResult;
      }

      if (status !== undefined) {
        updateData.status = status;
        if (status === 'resolved') {
          updateData.resolvedAt = new Date();
        } else if (status === 'claimed') {
          updateData.claimedAt = new Date();
          updateData.isClaimed = true;
        }
      }

      if (actualWinnings !== undefined) {
        updateData.actualWinnings = actualWinnings;
      }

      const updatedBetSlip = await this.betSlipModel.findOneAndUpdate(
        { betSlipId: parseInt(betSlipId) },
        updateData,
        { new: true },
      );

      if (!updatedBetSlip) {
        throw new HttpException(
          `Bet slip with ID ${betSlipId} not found`,
          HttpStatus.NOT_FOUND,
        );
      }

      return updatedBetSlip;
    } catch (error: any) {
      throw new HttpException(
        `Error Updating Bet Slip: ${error.message}`,
        HttpStatus.BAD_GATEWAY,
        {
          cause: error.message,
          description: error,
        },
      );
    }
  }

  async updateSelection({
    betSlipId,
    matchId,
    selectionResult,
    matchResult,
  }: {
    betSlipId: Types.ObjectId;
    matchId: number;
    selectionResult: SelectionResult;
    matchResult: MatchResult;
  }) {
    try {
      const updatedSelection = await this.betSelectionModel.findOneAndUpdate(
        { betSlipId, matchId },
        {
          selectionResult,
          matchResult,
          resolvedAt: new Date(),
        },
        { new: true },
      );

      if (!updatedSelection) {
        throw new HttpException(
          `Selection with betSlipId ${betSlipId} and matchId ${matchId} not found`,
          HttpStatus.NOT_FOUND,
        );
      }

      return updatedSelection;
    } catch (error: any) {
      throw new HttpException(
        `Error Updating Selection: ${error.message}`,
        HttpStatus.BAD_GATEWAY,
        {
          cause: error.message,
          description: error,
        },
      );
    }
  }

  async findAllPendingBetSlips(): Promise<BetSlipAndSelection[]> {
    try {
      const betSlips = await this.betSlipModel
        .find({ status: 'pending' })
        .exec();
      const result: BetSlipAndSelection[] = [];

      for (const betSlip of betSlips) {
        const betSelections = await this.betSelectionModel.find({
          betSlipId: betSlip._id,
        });

        result.push({
          betSlip: betSlip,
          betSelection: betSelections,
        });
      }

      return result;
    } catch (error: any) {
      throw new HttpException(
        `Error Finding Pending Bet Slips: ${error.message}`,
        HttpStatus.BAD_GATEWAY,
        {
          cause: error.message,
          description: error,
        },
      );
    }
  }

  async findAllUnresolvedSelections(): Promise<BetSelection[]> {
    try {
      return await this.betSelectionModel
        .find({ selectionResult: 'pending' })
        .exec();
    } catch (error: any) {
      throw new HttpException(
        `Error Finding Unresolved Selections: ${error.message}`,
        HttpStatus.BAD_GATEWAY,
        {
          cause: error.message,
          description: error,
        },
      );
    }
  }

  async findSelectionsByBetSlipId(betSlipId: number): Promise<BetSelection[]> {
    try {
      return await this.betSelectionModel.find({ betSlipId }).exec();
    } catch (error: any) {
      throw new HttpException(
        `Error Finding Selections: ${error.message}`,
        HttpStatus.BAD_GATEWAY,
        {
          cause: error.message,
          description: error,
        },
      );
    }
  }

  async findAll(): Promise<BetSlipAndSelection[]> {
    try {
      const betSlips = await this.betSlipModel.find().exec();
      const result: BetSlipAndSelection[] = [];

      for (const betSlip of betSlips) {
        const betSelections = await this.betSelectionModel.find({
          betSlipId: betSlip._id,
        });

        result.push({
          betSlip: betSlip,
          betSelection: betSelections,
        });
      }

      return result;
    } catch (error: any) {
      throw new HttpException(
        `Error Finding Bet Slips: ${error.message}`,
        HttpStatus.BAD_GATEWAY,
        {
          cause: error.message,
          description: error,
        },
      );
    }
  }

  async findByBetSlipId(betSlipId: string, blockchain?: Blockchain): Promise<BetSlipAndSelection> {
    try {
      // const query: any = { id: betSlipId };
      
      // // If blockchain is provided, filter by it
      // if (blockchain) {
      //   query.blockchain = blockchain;
      // }

      const betSlip = await this.betSlipModel.findById(betSlipId);

      if (!betSlip) {
        const errorMessage = blockchain 
          ? `Can't find bet slip with ID ${betSlipId} for blockchain ${blockchain}`
          : `Can't find bet slip with ID ${betSlipId}`;
        throw new HttpException(
          errorMessage,
          HttpStatus.NOT_FOUND,
        );
      }

      const betSelections = await this.betSelectionModel.find({
        betSlipId: betSlip._id,
      });

      return {
        betSlip: betSlip,
        betSelection: betSelections,
      };
    } catch (error: any) {
      throw new HttpException(
        `Error Finding Bet Slip: ${error.message}`,
        HttpStatus.BAD_GATEWAY,
        {
          cause: error.message,
          description: error,
        },
      );
    }
  }

  private async findUserBetSlips(
    userAddress: string,
  ): Promise<BetSlipAndSelection[]> {
    try {
      const betSlips = await this.betSlipModel.find({
        userAddress: userAddress,
      });
      const result: BetSlipAndSelection[] = [];

      for (const betSlip of betSlips) {
        const betSelections = await this.betSelectionModel.find({
          betSlipId: betSlip._id,
        });

        result.push({
          betSlip: betSlip,
          betSelection: betSelections,
        });
      }

      return result;
    } catch (error: any) {
      throw new HttpException(
        `Error Finding User Bet Slips: ${error.message}`,
        HttpStatus.BAD_GATEWAY,
        {
          cause: error.message,
          description: error,
        },
      );
    }
  }

  async findUserLostBet(
    userAddress: string,
  ): Promise<BetSlipAndSelection[]> {
    try {
      const userBets = await this.findUserBetSlips(userAddress);

      const lostBets = userBets.filter((bets) => {
        return bets.betSlip.betSlipResult === 'lost'
      })

      return lostBets
    } catch (error: any) {
      throw new HttpException(
        `Error Finding User Unclaimed Winnings: ${error.message}`,
        HttpStatus.BAD_GATEWAY,
        {
          cause: error.message,
          description: error,
        },
      );
    }
  }

  async findUserUnclaimedWinnings(
    userAddress: string,
  ): Promise<BetSlipAndSelection[]> {
    try {
      const userBets = await this.findUserBetSlips(userAddress);

      const unclaimedWinnings = userBets.filter((bets) => {
        const unclaimedBets =
          bets.betSlip.betSlipResult === 'won' &&
          bets.betSlip.actualWinnings !== 0 &&
          bets.betSlip.status === 'resolved' &&
          !bets.betSlip.isClaimed;

        return unclaimedBets;
      });

      return unclaimedWinnings;
    } catch (error: any) {
      throw new HttpException(
        `Error Finding User Unclaimed Winnings: ${error.message}`,
        HttpStatus.BAD_GATEWAY,
        {
          cause: error.message,
          description: error,
        },
      );
    }
  }

  async findUserClaimedWinnings(
    userAddress: string,
  ): Promise<BetSlipAndSelection[]> {
    try {
      const userBets = await this.findUserBetSlips(userAddress);

      const unclaimedWinnings = userBets.filter((bets) => {
        const unclaimedBets =
          bets.betSlip.betSlipResult === 'won' &&
          bets.betSlip.actualWinnings !== 0 &&
          bets.betSlip.status === 'claimed' &&
          bets.betSlip.isClaimed;

        return unclaimedBets;
      });

      return unclaimedWinnings;
    } catch (error: any) {
      throw new HttpException(
        `Error Finding User Claimed Winnings: ${error.message}`,
        HttpStatus.BAD_GATEWAY,
        {
          cause: error.message,
          description: error,
        },
      );
    }
  }

  async findUserPendingSlips(
    userAddress: string,
  ): Promise<BetSlipAndSelection[]> {
    try {
      const userBets = await this.findUserBetSlips(userAddress);

      const pendingBets = userBets.filter((bets) => {
        const pendingBets = bets.betSlip.status === 'pending';

        return pendingBets;
      });

      return pendingBets;
    } catch (error: any) {
      throw new HttpException(
        `Error Finding User Bets: ${error.message}`,
        HttpStatus.BAD_GATEWAY,
        {
          cause: error.message,
          description: error,
        },
      );
    }
  }

  async findBetSlipsByBlockchain(
    blockchain: Blockchain,
  ): Promise<BetSlipAndSelection[]> {
    try {
      const betSlips = await this.betSlipModel.find({ blockchain }).exec();
      const result: BetSlipAndSelection[] = [];

      for (const betSlip of betSlips) {
        const betSelections = await this.betSelectionModel.find({
          betSlipId: betSlip._id,
        });

        result.push({
          betSlip: betSlip,
          betSelection: betSelections,
        });
      }

      return result;
    } catch (error: any) {
      throw new HttpException(
        `Error Finding Bet Slips by Blockchain: ${error.message}`,
        HttpStatus.BAD_GATEWAY,
        {
          cause: error.message,
          description: error,
        },
      );
    }
  }

  async findUserBetSlipsByBlockchain(
    userAddress: string,
    blockchain: Blockchain,
  ): Promise<BetSlipAndSelection[]> {
    try {
      const betSlips = await this.betSlipModel.find({
        userAddress: userAddress,
        blockchain: blockchain,
      });
      const result: BetSlipAndSelection[] = [];

      for (const betSlip of betSlips) {
        const betSelections = await this.betSelectionModel.find({
          betSlipId: betSlip._id,
        });

        result.push({
          betSlip: betSlip,
          betSelection: betSelections,
        });
      }

      return result;
    } catch (error: any) {
      throw new HttpException(
        `Error Finding User Bet Slips by Blockchain: ${error.message}`,
        HttpStatus.BAD_GATEWAY,
        {
          cause: error.message,
          description: error,
        },
      );
    }
  }

  async addClaimSignature({
    betSlipId,
    signature,
  }: {
    betSlipId: string;
    signature: string;
  }) {
    try {
      const updatedBetSlip = await this.betSlipModel.findOneAndUpdate(
        { betSlipId: parseInt(betSlipId) },
        {
          claimSignature: signature,
        },
        { new: true },
      );

      if (!updatedBetSlip) {
        throw new HttpException(
          `Bet slip with ID ${betSlipId} not found`,
          HttpStatus.NOT_FOUND,
        );
      }

      return updatedBetSlip;
    } catch (error: any) {
      throw new HttpException(
        `Error Adding ClaimSignature to Bet Slip: ${error.message}`,
        HttpStatus.BAD_GATEWAY,
        {
          cause: error.message,
          description: error,
        },
      );
    }
  }

  async markBetSlipAsClaimed({ id }: { id: string }) {
    try {
      const updatedBetSlip = await this.betSlipModel.findByIdAndUpdate(
        id,
        {
          claimSignature: '',
          isClaimed: true,
          status: 'claimed',
          claimedAt: new Date(),
        },
        { new: true },
      );

      if (!updatedBetSlip) {
        throw new HttpException(
          `Bet slip with ID ${id} not found`,
          HttpStatus.NOT_FOUND,
        );
      }

      return updatedBetSlip;
    } catch (error: any) {
      throw new HttpException(
        `Error Claiming Bet Slip: ${error.message}`,
        HttpStatus.BAD_GATEWAY,
        {
          cause: error.message,
          description: error,
        },
      );
    }
  }
}
