import { IsString, IsNotEmpty, IsIn, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { SelectionResult, MatchResult } from '../entities/bet-selection.entity';

export class UpdateSelectionDto {
  @ApiProperty({
    description: 'Result of this individual selection',
    enum: ['pending', 'won', 'lost'],
    example: 'won',
  })
  @IsOptional()
  @IsString()
  @IsIn(['pending', 'won', 'lost'])
  selectionResult?: SelectionResult;

  @ApiProperty({
    description: 'Result of the match',
    enum: ['pending', 'home', 'away', 'draw'],
    example: 'home',
  })
  @IsOptional()
  @IsString()
  @IsIn(['pending', 'home', 'away', 'draw'])
  matchResult?: MatchResult;
}
