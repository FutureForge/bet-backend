import {
  HttpException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { LeaderboardEntryDto } from './dto/leaderboard-response.dto';
import { User, UserDocument } from './entities/user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    try {
      const user = new this.userModel({
        ...createUserDto,
        totalWagered: createUserDto.totalWagered || 0,
        totalWon: createUserDto.totalWon || 0,
        winCount: createUserDto.winCount || 0,
        lossCount: createUserDto.lossCount || 0,
      });
      return await user.save();
    } catch (error: any) {
      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException(
        `Error Creating User: ${error.message}`,
        HttpStatus.BAD_GATEWAY,
        {
          cause: error.message,
          description: error,
        },
      );
    }
  }

  async findAll(): Promise<User[]> {
    return await this.userModel.find().exec();
  }

  async findOne(id: string): Promise<User> {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException(`Invalid user ID: ${id}`);
    }

    const user = await this.userModel.findById(id).exec();

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    return user;
  }

  async findByAddress(address: string): Promise<User | null> {
    try {
      const user = await this.userModel.findOne({ address }).exec();

      if (!user) {
        throw new HttpException(`User doesnt exist`, HttpStatus.BAD_GATEWAY);
      }

      return user;
    } catch (error: any) {
      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException(
        `Error Finding User: ${error.message}`,
        HttpStatus.BAD_GATEWAY,
        {
          cause: error.message,
          description: error,
        },
      );
    }
  }

  async update({
    address,
    updateUserDto,
  }: {
    address: string;
    updateUserDto: UpdateUserDto;
  }): Promise<User> {
    try {
      if (!address) {
        throw new HttpException(
          `User address is required`,
          HttpStatus.NOT_FOUND,
        );
      }

      const user = await this.userModel
        .findOneAndUpdate(
          { address },
          { ...updateUserDto, lastActiveAt: new Date() },
          { new: true },
        )
        .exec();

      if (!user) {
        throw new HttpException(
          `User with address ${address} not found`,
          HttpStatus.BAD_GATEWAY,
        );
      }
      return user;
    } catch (error: any) {
      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException(
        `Error Creating User: ${error.message}`,
        HttpStatus.BAD_GATEWAY,
        {
          cause: error.message,
          description: error,
        },
      );
    }
  }

  async remove(id: string): Promise<void> {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException(`Invalid user ID: ${id}`);
    }

    const user = await this.userModel.findByIdAndDelete(id).exec();
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
  }

  async updateStats({
    address,
    stats,
    blockchain,
  }: {
    address: string;
    stats: {
      totalWagered?: number;
      totalWon?: number;
      winCount?: number;
      lossCount?: number;
    };
    blockchain?: 'crossfi' | 'bnb';
  }): Promise<User> {
    try {
      if (!address) {
        throw new HttpException(
          `User address is required`,
          HttpStatus.BAD_REQUEST,
        );
      }

      const updateData: any = { lastActiveAt: new Date() };

      // If blockchain is specified, update blockchain-specific stats
      if (blockchain) {
        const prefix = blockchain === 'crossfi' ? 'crossfi' : 'bnb';
        
        if (stats.totalWagered !== undefined) {
          updateData.$inc = { [`${prefix}TotalWagered`]: stats.totalWagered };
        }
        if (stats.totalWon !== undefined) {
          updateData.$inc = { ...updateData.$inc, [`${prefix}TotalWon`]: stats.totalWon };
        }
        if (stats.winCount !== undefined) {
          updateData.$inc = { ...updateData.$inc, [`${prefix}WinCount`]: stats.winCount };
        }
        if (stats.lossCount !== undefined) {
          updateData.$inc = { ...updateData.$inc, [`${prefix}LossCount`]: stats.lossCount };
        }
      } else {
        // Legacy support - update global stats (deprecated)
        if (stats.totalWagered !== undefined) {
          updateData.$inc = { totalWagered: stats.totalWagered };
        }
        if (stats.totalWon !== undefined) {
          updateData.$inc = { ...updateData.$inc, totalWon: stats.totalWon };
        }
        if (stats.winCount !== undefined) {
          updateData.$inc = { ...updateData.$inc, winCount: stats.winCount };
        }
        if (stats.lossCount !== undefined) {
          updateData.$inc = { ...updateData.$inc, lossCount: stats.lossCount };
        }
      }

      const user = await this.userModel
        .findOneAndUpdate({ address }, updateData, { new: true })
        .exec();

      if (!user) {
        throw new HttpException(
          `User with address ${address} not found`,
          HttpStatus.NOT_FOUND,
        );
      }
      return user;
    } catch (error: any) {
      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException(
        `Error updating user stats: ${error.message}`,
        HttpStatus.BAD_GATEWAY,
        {
          cause: error.message,
          description: error,
        },
      );
    }
  }

  async getLeaderboard({
    type = 'totalWon',
    limit = 10,
    offset = 0,
    blockchain,
  }: {
    type?: 'totalWon' | 'totalWagered' | 'winCount' | 'winRate';
    limit?: number;
    offset?: number;
    blockchain?: 'crossfi' | 'bnb';
  }): Promise<LeaderboardEntryDto[]> {
    try {
      let sortCriteria: any = {};
      let projection: any = {};

      // Determine which fields to use based on blockchain
      const prefix = blockchain === 'crossfi' ? 'crossfi' : blockchain === 'bnb' ? 'bnb' : '';
      const totalWonField = prefix ? `${prefix}TotalWon` : 'totalWon';
      const totalWageredField = prefix ? `${prefix}TotalWagered` : 'totalWagered';
      const winCountField = prefix ? `${prefix}WinCount` : 'winCount';
      const lossCountField = prefix ? `${prefix}LossCount` : 'lossCount';

      switch (type) {
        case 'totalWon':
          sortCriteria = { [totalWonField]: -1 };
          break;
        case 'totalWagered':
          sortCriteria = { [totalWageredField]: -1 };
          break;
        case 'winCount':
          sortCriteria = { [winCountField]: -1 };
          break;
        case 'winRate':
          // For win rate, we'll calculate it in the aggregation pipeline
          const pipeline = [
            {
              $addFields: {
                winRate: {
                  $cond: {
                    if: { $gt: [{ $add: [`$${winCountField}`, `$${lossCountField}`] }, 0] },
                    then: {
                      $multiply: [
                        { $divide: [`$${winCountField}`, { $add: [`$${winCountField}`, `$${lossCountField}`] }] },
                        100
                      ]
                    },
                    else: 0
                  }
                }
              }
            },
            { $sort: { winRate: -1 as any } },
            { $skip: offset },
            { $limit: limit }
          ];

          const winRateResults = await this.userModel.aggregate(pipeline).exec();
          
          // Add rank manually and transform to DTO format
          return winRateResults.map((user, index) => ({
            _id: user._id.toString(),
            address: user.address,
            username: user.username,
            totalWagered: user[totalWageredField] || 0,
            totalWon: user[totalWonField] || 0,
            winCount: user[winCountField] || 0,
            lossCount: user[lossCountField] || 0,
            rank: offset + index + 1,
            winRate: user.winRate,
            createdAt: user.createdAt,
            lastActiveAt: user.lastActiveAt,
          }));
        default:
          sortCriteria = { totalWon: -1 };
      }

      // Handle non-winRate cases
      if (type === 'totalWon' || type === 'totalWagered' || type === 'winCount') {
        const users = await this.userModel
          .find()
          .sort(sortCriteria)
          .skip(offset)
          .limit(limit)
          .exec();

        // Calculate win rate for each user and transform to DTO format
        const usersWithRank = users.map((user, index) => {
          const totalGames = (user[winCountField] || 0) + (user[lossCountField] || 0);
          const winRate = totalGames > 0 ? ((user[winCountField] || 0) / totalGames) * 100 : 0;
          
          return {
            _id: user._id.toString(),
            address: user.address,
            username: user.username,
            totalWagered: user[totalWageredField] || 0,
            totalWon: user[totalWonField] || 0,
            winCount: user[winCountField] || 0,
            lossCount: user[lossCountField] || 0,
            rank: offset + index + 1,
            winRate: Math.round(winRate * 100) / 100, // Round to 2 decimal places
            createdAt: user.createdAt,
            lastActiveAt: user.lastActiveAt,
          };
        });

        return usersWithRank;
      }

      return [];
    } catch (error: any) {
      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException(
        `Error fetching leaderboard: ${error.message}`,
        HttpStatus.BAD_GATEWAY,
        {
          cause: error.message,
          description: error,
        },
      );
    }
  }

  async getBlockchainStats({
    address,
    blockchain,
  }: {
    address: string;
    blockchain: 'crossfi' | 'bnb';
  }): Promise<{
    totalWagered: number;
    totalWon: number;
    winCount: number;
    lossCount: number;
    winRate: number;
  }> {
    try {
      const user = await this.userModel.findOne({ address }).exec();
      
      if (!user) {
        throw new HttpException(
          `User with address ${address} not found`,
          HttpStatus.NOT_FOUND,
        );
      }

      const prefix = blockchain === 'crossfi' ? 'crossfi' : 'bnb';
      const totalWagered = user[`${prefix}TotalWagered`] || 0;
      const totalWon = user[`${prefix}TotalWon`] || 0;
      const winCount = user[`${prefix}WinCount`] || 0;
      const lossCount = user[`${prefix}LossCount`] || 0;
      const totalGames = winCount + lossCount;
      const winRate = totalGames > 0 ? (winCount / totalGames) * 100 : 0;

      return {
        totalWagered,
        totalWon,
        winCount,
        lossCount,
        winRate: Math.round(winRate * 100) / 100,
      };
    } catch (error: any) {
      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException(
        `Error fetching blockchain stats: ${error.message}`,
        HttpStatus.BAD_GATEWAY,
        {
          cause: error.message,
          description: error,
        },
      );
    }
  }
}
