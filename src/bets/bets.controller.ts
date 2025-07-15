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
import { BlockchainService } from './services/blockchain.service';
import { CreateBetDto } from './dto/create-bet.dto';
import { UpdateBetSlipDto } from './dto/update-bet-slip.dto';
import {
  BetSlipWithSelectionsResponseDto,
  BetSlipAndSelectionResponseDto,
} from './dto/bet-slip-response.dto';
import { BetSlip } from './entities/bet-slip.entity';
import { BetSelection } from './entities/bet-selection.entity';
import { BetSlipAndSelection, Blockchain } from './types/bet.types';

@ApiTags('bets')
@Controller('bets')
export class BetsController {
  constructor(
    private readonly betsService: BetsService,
    private readonly blockchainService: BlockchainService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create a new bet slip with multiple selections' })
  @ApiResponse({
    status: 201,
    description: 'Bet slip created successfully',
    type: BetSlip,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - Match not in NS status or invalid data',
  })
  @ApiResponse({ status: 404, description: 'Match not found' })
  @ApiResponse({ status: 502, description: 'Error creating bet slip' })
  async create(
    @Body() createBetDto: CreateBetDto,
  ): Promise<BetSlipAndSelection> {
    return await this.betsService.create(createBetDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all bet slips' })
  @ApiResponse({
    status: 200,
    description: 'List of all bet slips',
    type: [BetSlipAndSelectionResponseDto],
  })
  async findAll(): Promise<BetSlipAndSelection[]> {
    return await this.betsService.findAll();
  }

  @Get('pending')
  @ApiOperation({ summary: 'Get all pending bet slips' })
  @ApiResponse({
    status: 200,
    description: 'List of pending bet slips',
    type: [BetSlipAndSelectionResponseDto],
  })
  async findPendingBetSlips(): Promise<BetSlipAndSelection[]> {
    return await this.betsService.findAllPendingBetSlips();
  }

  @Get('unresolved-selections')
  @ApiOperation({ summary: 'Get all unresolved selections' })
  @ApiResponse({
    status: 200,
    description: 'List of unresolved selections',
    type: [BetSelection],
  })
  async findUnresolvedSelections(): Promise<BetSelection[]> {
    return await this.betsService.findAllUnresolvedSelections();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get bet slip by ID' })
  @ApiParam({ name: 'id', description: 'Bet slip ID' })
  @ApiResponse({ status: 200, description: 'Bet slip found', type: BetSlip })
  @ApiResponse({ status: 404, description: 'Bet slip not found' })
  async findByBetSlipId(@Param('id') id: string): Promise<BetSlip> {
    return await this.betsService.findByBetSlipId(+id);
  }

  @Get('/user/:userAddress')
  @ApiOperation({ summary: 'Get bet slips by user address' })
  @ApiParam({ name: 'userAddress', description: 'User wallet address' })
  @ApiResponse({
    status: 200,
    description: 'User bet slips found',
    type: [BetSlipAndSelectionResponseDto],
  })
  async findUserBetSlips(
    @Param('userAddress') userAddress: string,
  ): Promise<BetSlipAndSelection[]> {
    return await this.betsService.findUserPendingSlips(
      userAddress.toLowerCase(),
    );
  }

  @Get('/user/unclaimed/:userAddress')
  @ApiOperation({ summary: 'Get user unclaimed winning bet slips' })
  @ApiParam({ name: 'userAddress', description: 'User wallet address' })
  @ApiResponse({
    status: 200,
    description: 'User unclaimed winning bet slips found',
    type: [BetSlipAndSelectionResponseDto],
  })
  async findUserUnclaimedBetSlips(
    @Param('userAddress') userAddress: string,
  ): Promise<BetSlipAndSelection[]> {
    return await this.betsService.findUserUnclaimedWinnings(
      userAddress.toLowerCase(),
    );
  }

  @Get('/user/claimed/:userAddress')
  @ApiOperation({ summary: 'Get user claimed winning bet slips' })
  @ApiParam({ name: 'userAddress', description: 'User wallet address' })
  @ApiResponse({
    status: 200,
    description: 'User claimed winning bet slips found',
    type: [BetSlipAndSelectionResponseDto],
  })
  async findUserClaimedBetSlips(
    @Param('userAddress') userAddress: string,
  ): Promise<BetSlipAndSelection[]> {
    return await this.betsService.findUserClaimedWinnings(
      userAddress.toLowerCase(),
    );
  }

  // @Get('/blockchain/:blockchain')
  // @ApiOperation({ summary: 'Get all bet slips by blockchain' })
  // @ApiParam({
  //   name: 'blockchain',
  //   description: 'Blockchain name (crossfi or bnb)',
  //   enum: ['crossfi', 'bnb'],
  // })
  // @ApiResponse({
  //   status: 200,
  //   description: 'List of bet slips for the specified blockchain',
  //   type: [BetSlipAndSelectionResponseDto],
  // })
  // async findBetSlipsByBlockchain(
  //   @Param('blockchain') blockchain: Blockchain,
  // ): Promise<BetSlipAndSelection[]> {
  //   return await this.betsService.findBetSlipsByBlockchain(blockchain);
  // }

  // @Get('/user/:userAddress/blockchain/:blockchain')
  // @ApiOperation({ summary: 'Get user bet slips by blockchain' })
  // @ApiParam({ name: 'userAddress', description: 'User wallet address' })
  // @ApiParam({
  //   name: 'blockchain',
  //   description: 'Blockchain name (crossfi or bnb)',
  //   enum: ['crossfi', 'bnb'],
  // })
  // @ApiResponse({
  //   status: 200,
  //   description: 'User bet slips for the specified blockchain found',
  //   type: [BetSlipAndSelectionResponseDto],
  // })
  // async findUserBetSlipsByBlockchain(
  //   @Param('userAddress') userAddress: string,
  //   @Param('blockchain') blockchain: Blockchain,
  // ): Promise<BetSlipAndSelection[]> {
  //   return await this.betsService.findUserBetSlipsByBlockchain(
  //     userAddress.toLowerCase(),
  //     blockchain,
  //   );
  // }

  // @Get('/blockchains')
  // @ApiOperation({ summary: 'Get all supported blockchains' })
  // @ApiResponse({
  //   status: 200,
  //   description: 'List of supported blockchains',
  // })
  // async getSupportedBlockchains() {
  //   const blockchains = this.blockchainService.getSupportedBlockchains();
  //   return {
  //     blockchains: blockchains.map((chain) =>
  //       this.blockchainService.getBlockchainInfo(chain),
  //     ),
  //     defaultChain: this.blockchainService.getDefaultBlockchain(),
  //   };
  // }

  // @Get('/blockchains/:blockchain')
  // @ApiOperation({ summary: 'Get blockchain information' })
  // @ApiParam({
  //   name: 'blockchain',
  //   description: 'Blockchain name (crossfi or bnb)',
  //   enum: ['crossfi', 'bnb'],
  // })
  // @ApiResponse({
  //   status: 200,
  //   description: 'Blockchain information',
  // })
  // async getBlockchainInfo(@Param('blockchain') blockchain: Blockchain) {
  //   return this.blockchainService.getBlockchainInfo(blockchain);
  // }

  // @Patch(':id')
  // @ApiOperation({ summary: 'Update bet slip' })
  // @ApiParam({ name: 'id', description: 'Bet slip ID' })
  // @ApiResponse({
  //   status: 200,
  //   description: 'Bet slip updated successfully',
  //   type: BetSlip,
  // })
  // @ApiResponse({ status: 404, description: 'Bet slip not found' })
  // async updateBetSlip(
  //   @Param('id') id: string,
  //   @Body() updateBetSlipDto: UpdateBetSlipDto,
  // ): Promise<BetSlip> {
  //   return await this.betsService.updateBetSlip({
  //     betSlipId: id,
  //     ...updateBetSlipDto,
  //   });
  // }

  @Post(':id/claim')
  @ApiOperation({ summary: 'Mark bet slip as claimed' })
  @ApiParam({ name: 'id', description: 'Bet slip ID' })
  @ApiResponse({
    status: 200,
    description: 'Bet slip claimed successfully',
    type: BetSlip,
  })
  @ApiResponse({ status: 404, description: 'Bet slip not found' })
  async claimBetSlip(@Param('id') id: string): Promise<BetSlip> {
    return await this.betsService.markBetSlipAsClaimed({ id: id });
  }

  // @Post(':id/add-signature')
  // @ApiOperation({ summary: 'Add claim signature to bet slip' })
  // @ApiParam({ name: 'id', description: 'Bet slip ID' })
  // @ApiResponse({
  //   status: 200,
  //   description: 'Signature added successfully',
  //   type: BetSlip,
  // })
  // @ApiResponse({ status: 404, description: 'Bet slip not found' })
  // async addClaimSignature(
  //   @Param('id') id: string,
  //   @Body() body: { signature: string },
  // ): Promise<BetSlip> {
  //   return await this.betsService.addClaimSignature({
  //     betSlipId: id,
  //     signature: body.signature,
  //   });
  // }
}
