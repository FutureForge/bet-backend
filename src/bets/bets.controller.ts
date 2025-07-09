import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { BetsService } from './bets.service';
import { CreateBetDto } from './dto/create-bet.dto';
import { Bet } from './entities/bet.entity';

@ApiTags('bets')
@Controller('bets')
export class BetsController {
  constructor(private readonly betsService: BetsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new bet' })
  @ApiResponse({
    status: 201,
    description: 'Bet created successfully',
    type: Bet,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - Match not in NS status or invalid data',
  })
  @ApiResponse({ status: 404, description: 'Match not found' })
  @ApiResponse({ status: 502, description: 'Error creating bet' })
  async create(@Body() createBetDto: CreateBetDto): Promise<Bet> {
    return await this.betsService.create(createBetDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all bets' })
  @ApiResponse({ status: 200, description: 'List of all bets', type: [Bet] })
  async findAll(): Promise<Bet[]> {
    return await this.betsService.findAll();
  }

  @Get('unresolved')
  @ApiOperation({ summary: 'Get all unresolved bets' })
  @ApiResponse({
    status: 200,
    description: 'List of unresolved bets',
    type: [Bet],
  })
  async findUnresolvedBets(): Promise<Bet[]> {
    return await this.betsService.findAllUnresolvedBet();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get bet by ID' })
  @ApiParam({ name: 'id', description: 'Bet ID' })
  @ApiResponse({ status: 200, description: 'Bet found', type: Bet })
  @ApiResponse({ status: 404, description: 'Bet not found' })
  async findByBetId(@Param('id') id: string): Promise<Bet> {
    return await this.betsService.findByBetId(+id);
  }

  @Get('/user/:userAddress')
  @ApiOperation({ summary: 'Get bets by user address' })
  @ApiParam({ name: 'userAddress', description: 'User wallet address' })
  @ApiResponse({ status: 200, description: 'User bets found', type: [Bet] })
  async findUserBets(
    @Param('userAddress') userAddress: string,
  ): Promise<Bet[]> {
    return await this.betsService.findUserBets(userAddress);
  }
}
