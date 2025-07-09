import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsEnum, IsNumber, Min, Max } from 'class-validator';
import { Transform } from 'class-transformer';

export class LeaderboardQueryDto {
  @ApiPropertyOptional({
    description: 'Type of leaderboard to retrieve',
    enum: ['totalWon', 'totalWagered', 'winCount', 'winRate'],
    default: 'totalWon',
  })
  @IsOptional()
  @IsEnum(['totalWon', 'totalWagered', 'winCount', 'winRate'])
  type?: 'totalWon' | 'totalWagered' | 'winCount' | 'winRate';

  @ApiPropertyOptional({
    description: 'Number of results to return',
    minimum: 1,
    maximum: 100,
    default: 10,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  @Transform(({ value }) => parseInt(value))
  limit?: number;

  @ApiPropertyOptional({
    description: 'Number of results to skip for pagination',
    minimum: 0,
    default: 0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Transform(({ value }) => parseInt(value))
  offset?: number;
}
