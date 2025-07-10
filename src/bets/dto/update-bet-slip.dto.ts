import {
  IsString,
  IsNotEmpty,
  IsIn,
  IsOptional,
  IsNumber,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { BetSlipResult, BetSlipStatus } from '../entities/bet-slip.entity';

export class UpdateBetSlipDto {
  @ApiProperty({
    description: 'Overall result of the bet slip',
    enum: ['pending', 'won', 'lost'],
    example: 'won',
  })
  @IsOptional()
  @IsString()
  @IsIn(['pending', 'won', 'lost'])
  betSlipResult?: BetSlipResult;

  @ApiProperty({
    description: 'Status of the bet slip',
    enum: ['pending', 'resolved', 'claimed'],
    example: 'resolved',
  })
  @IsOptional()
  @IsString()
  @IsIn(['pending', 'resolved', 'claimed'])
  status?: BetSlipStatus;

  @ApiProperty({
    description: 'Actual winnings amount',
    example: 1500,
  })
  @IsOptional()
  @IsNumber()
  actualWinnings?: number;

  @ApiProperty({
    description: 'Claim signature',
    example: '0xabcdef...',
  })
  @IsOptional()
  @IsString()
  claimSignature?: string;
}
