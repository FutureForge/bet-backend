import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { BetsService } from './bets.service';
import { CreateBetDto } from './dto/create-bet.dto';

@Controller('bets')
export class BetsController {
  constructor(private readonly betsService: BetsService) {}

  @Post()
  create(@Body() createBetDto: CreateBetDto) {
    return this.betsService.create(createBetDto);
  }

  @Get()
  findAll() {
    return this.betsService.findAll();
  }

  @Get('unresolved')
  findUnresolvedBets() {
    return this.betsService.findAllUnresolvedBet();
  }

  @Get(':id')
  findByBetId(@Param('id') id: string) {
    return this.betsService.findByBetId(+id);
  }

  @Get('/user/:userAddress')
  findUserBets(@Param('userAddress') userAddress: string) {
    return this.betsService.findUserBets(userAddress);
  }
}
