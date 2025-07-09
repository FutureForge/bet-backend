import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, HydratedDocument } from 'mongoose';
import { ApiProperty } from '@nestjs/swagger';

export type SelectedOutcome = 'home' | 'away' | 'draw';
export type BetResult = 'pending' | 'won' | 'lost';
export type MatchResult = 'pending' | 'home' | 'away' | 'draw';

@Schema({ timestamps: true })
export class Bet {
  @ApiProperty({
    description: 'XFI wallet address of the user placing the bet',
    example: '0x1234567890abcdef1234567890abcdef12345678',
  })
  @Prop({
    type: String,
    required: true,
  })
  userAddress: string;

  @ApiProperty({
    description: 'ID of the bet',
    example: '12345',
  })
  @Prop({
    type: Number,
    required: true,
    unique: true,
  })
  betId: number;

  @ApiProperty({
    description: 'ID of the match to bet on',
    example: '12345',
  })
  @Prop({
    type: Number,
    required: true,
  })
  matchId: number;

  @ApiProperty({
    description: 'Bet amount in XFI or token decimals',
    example: 100.5,
  })
  @Prop({
    type: Number,
    required: true,
  })
  betAmount: number;

  @ApiProperty({
    description: 'Selected outcome for the bet',
    enum: ['home', 'away', 'draw'],
    example: 'home',
  })
  @Prop({
    type: String,
    enum: ['home', 'away', 'draw'],
    required: true,
  })
  selectedOutcome: SelectedOutcome;

  @ApiProperty({
    description: 'Odds at the time of bet placement for fixed payout logic',
    example: 2.5,
  })
  @Prop({
    type: Number,
    required: true,
  })
  oddsAtPlacement: number;

  @ApiProperty({
    description: 'Whether the bet has been claimed',
    example: false,
  })
  @Prop({
    type: Boolean,
    default: false,
  })
  isClaimed: boolean;

  @ApiProperty({
    description: 'Result of the bet',
    enum: ['pending', 'won', 'lost'],
    example: 'pending',
  })
  @Prop({
    type: String,
    enum: ['pending', 'won', 'lost'],
    required: true,
    default: 'pending',
  })
  betResult: BetResult;

  @ApiProperty({
    description: 'Result of the match',
    enum: ['pending', 'home', 'away', 'draw'],
    example: 'pending',
  })
  @Prop({
    type: String,
    enum: ['pending', 'home', 'away', 'draw'],
    required: true,
    default: 'pending',
  })
  matchResult: MatchResult;

  @ApiProperty({
    description: 'Smart contract transaction reference',
    example:
      '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
    required: false,
  })
  @Prop({
    type: String,
  })
  txHash?: string;

  @ApiProperty({
    description: 'Date when the bet was placed',
    example: '2024-01-15T10:30:00Z',
  })
  @Prop({
    type: Date,
    default: Date.now,
  })
  placedAt: Date;

  @ApiProperty({
    description: 'Date when the bet was resolved',
    example: '2024-01-16T15:45:00Z',
    required: false,
  })
  @Prop({
    type: Date,
  })
  resolvedAt?: Date;
}

export type BetDocument = HydratedDocument<Bet>;

export const BetSchema = SchemaFactory.createForClass(Bet);
