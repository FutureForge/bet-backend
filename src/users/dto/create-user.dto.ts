import { IsString, IsOptional, IsNumber, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

export class CreateUserDto {
  @ApiProperty({ description: 'XFI wallet address' })
  @IsString()
  @Transform(({value}: {value:string}) => {value.toLowerCase()})
  address: string;

  @ApiPropertyOptional({ description: 'Username (optional)' })
  @IsOptional()
  @IsString()
  username?: string;

  @ApiPropertyOptional({ description: 'Total amount wagered', default: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  totalWagered?: number;

  @ApiPropertyOptional({ description: 'Total amount won', default: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  totalWon?: number;

  @ApiPropertyOptional({ description: 'Number of wins', default: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  winCount?: number;

  @ApiPropertyOptional({ description: 'Number of losses', default: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  lossCount?: number;
}
