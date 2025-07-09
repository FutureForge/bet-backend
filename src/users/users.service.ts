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
  }: {
    address: string;
    stats: {
      totalWagered?: number;
      totalWon?: number;
      winCount?: number;
      lossCount?: number;
    };
  }): Promise<User> {
    try {
      if (!address) {
        throw new HttpException(
          `User address is required`,
          HttpStatus.BAD_REQUEST,
        );
      }

      const updateData: any = { lastActiveAt: new Date() };

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
}
