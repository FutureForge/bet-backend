import { ApiProperty } from '@nestjs/swagger';

export class LeaderboardEntryDto {
  @ApiProperty({ description: 'User ID' })
  _id: string;

  @ApiProperty({ description: 'User wallet address' })
  address: string;

  @ApiProperty({ description: 'Username (optional)' })
  username?: string;

  @ApiProperty({ description: 'Total amount wagered' })
  totalWagered: number;

  @ApiProperty({ description: 'Total amount won' })
  totalWon: number;

  @ApiProperty({ description: 'Number of wins' })
  winCount: number;

  @ApiProperty({ description: 'Number of losses' })
  lossCount: number;

  @ApiProperty({ description: 'User rank in the leaderboard' })
  rank: number;

  @ApiProperty({ description: 'Win rate percentage (calculated)' })
  winRate?: number;

  @ApiProperty({ description: 'User creation date' })
  createdAt: Date;

  @ApiProperty({ description: 'Last active date' })
  lastActiveAt: Date;
}
