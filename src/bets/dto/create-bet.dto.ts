import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsIn,
  IsArray,
  ValidateNested,
  ArrayMinSize,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { Blockchain } from '../types/bet.types';

export class BetSelectionDto {
  @ApiProperty({
    description: 'ID of the match/fixture',
    example: 12345,
  })
  @IsNumber()
  @IsNotEmpty()
  matchId: number;

  @ApiProperty({
    description: 'Selected outcome for this match',
    enum: ['home', 'draw', 'away'],
    example: 'home',
  })
  @IsString()
  @IsIn(['home', 'draw', 'away'])
  selectedOutcome: 'home' | 'draw' | 'away';

  @ApiProperty({
    description: 'Odds at the time of bet placement for this match',
    example: 2.5,
  })
  @IsNumber()
  @Type(() => Number)
  oddsAtPlacement: number;
}

export class CreateBetDto {
  @ApiProperty({
    description: 'XFI wallet address of the user placing the bet',
    example: '0x1234567890abcdef1234567890abcdef12345678',
  })
  @IsString()
  @IsNotEmpty()
  userAddress: string;

  @ApiProperty({
    description: 'Blockchain where the bet is being placed',
    enum: ['crossfi', 'bnb'],
    example: 'crossfi',
  })
  @IsString()
  @IsIn(['crossfi', 'bnb'])
  blockchain: Blockchain;

  @ApiProperty({
    description: 'Unique ID of the bet slip',
    example: 12345,
  })
  @IsNumber()
  @IsNotEmpty()
  betSlipId: number;

  @ApiProperty({
    description: 'Total bet amount in XFI or token decimals',
    example: 100.5,
  })
  @IsNumber()
  @Type(() => Number)
  totalBetAmount: number;

  @ApiProperty({
    description: 'Array of bet selections (matches)',
    type: [BetSelectionDto],
    example: [
      {
        matchId: 12345,
        selectedOutcome: 'home',
        oddsAtPlacement: 2.5,
      },
      {
        matchId: 12346,
        selectedOutcome: 'away',
        oddsAtPlacement: 1.8,
      },
    ],
  })
  @IsArray()
  @ArrayMinSize(1, { message: 'At least one selection is required' })
  @ValidateNested({ each: true })
  @Type(() => BetSelectionDto)
  selections: BetSelectionDto[];
}
