import { IsString, IsOptional, IsNumber, Min } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateUserDto {
  @ApiPropertyOptional({ description: 'Username (optional)' })
  @IsOptional()
  @IsString()
  username?: string;

//   @ApiPropertyOptional({ description: 'Total amount wagered' })
//   @IsOptional()
//   @IsNumber()
//   @Min(0)
//   totalWagered?: number;

//   @ApiPropertyOptional({ description: 'Total amount won' })
//   @IsOptional()
//   @IsNumber()
//   @Min(0)
//   totalWon?: number;

//   @ApiPropertyOptional({ description: 'Number of wins' })
//   @IsOptional()
//   @IsNumber()
//   @Min(0)
//   winCount?: number;

//   @ApiPropertyOptional({ description: 'Number of losses' })
//   @IsOptional()
//   @IsNumber()
//   @Min(0)
//   lossCount?: number;
}
