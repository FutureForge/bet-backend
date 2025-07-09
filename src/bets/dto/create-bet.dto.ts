import { IsString, IsNotEmpty, IsNumber, IsIn } from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class CreateBetDto {
  @ApiProperty({
    description: 'XFI wallet address of the user placing the bet',
    example: '0x1234567890abcdef1234567890abcdef12345678',
  })
  @IsString()
  @IsNotEmpty()
  userAddress: string;

  @ApiProperty({
    description: 'ID of the match to bet on',
    example: '12345',
  })
  @IsNumber()
  @IsNotEmpty()
  matchId: number;

  @ApiProperty({
    description: 'ID of the bet',
    example: '12345',
  })
  @IsNumber()
  @IsNotEmpty()
  betId: number;

  @ApiProperty({
    description: 'Bet amount in XFI or token decimals',
    example: 100.5,
  })
  @IsNumber()
  @Type(() => Number)
  betAmount: number;

  @ApiProperty({
    description: 'Selected outcome for the bet',
    enum: ['home', 'draw', 'away'],
    example: 'home',
  })
  @IsString()
  @IsIn(['home', 'draw', 'away'])
  selectedOutcome: 'home' | 'draw' | 'away';

  @ApiProperty({
    description: 'Odds at the time of bet placement for fixed payout logic',
    example: 2.5,
  })
  @IsNumber()
  @Type(() => Number)
  oddsAtPlacement: number;
}
