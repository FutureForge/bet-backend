import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, HydratedDocument, Types } from 'mongoose';
import { ApiProperty } from '@nestjs/swagger';

export type SelectedOutcome = 'home' | 'away' | 'draw';
export type SelectionResult = 'pending' | 'won' | 'lost';
export type MatchResult = 'pending' | 'home' | 'away' | 'draw';

@Schema({ timestamps: true })
export class BetSelection {
  @ApiProperty({
    description: 'MongoDB ObjectId reference to the bet slip',
    example: '507f1f77bcf86cd799439011',
  })
  @Prop({
    type: Types.ObjectId,
    ref: 'BetSlip',
    required: true,
  })
  betSlipId: Types.ObjectId;

  @ApiProperty({
    description: 'ID of the match/fixture',
    example: '12345',
  })
  @Prop({
    type: Number,
    required: true,
  })
  matchId: number;

  @ApiProperty({
    description: 'Selected outcome for this match',
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
    description: 'Odds at the time of bet placement for this match',
    example: 2.5,
  })
  @Prop({
    type: Number,
    required: true,
  })
  oddsAtPlacement: number;

  @ApiProperty({
    description: 'Result of this individual selection',
    enum: ['pending', 'won', 'lost'],
    example: 'pending',
  })
  @Prop({
    type: String,
    enum: ['pending', 'won', 'lost'],
    required: true,
    default: 'pending',
  })
  selectionResult: SelectionResult;

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
    description: 'Date when this selection was resolved',
    example: '2024-01-16T15:45:00Z',
    required: false,
  })
  @Prop({
    type: Date,
  })
  resolvedAt?: Date;

  @ApiProperty({
    description: 'Home team name',
    example: 'Manchester United',
  })
  @Prop({
    type: String,
    required: true,
  })
  homeTeam: string;

  @ApiProperty({
    description: 'Away team name',
    example: 'Liverpool',
  })
  @Prop({
    type: String,
    required: true,
  })
  awayTeam: string;

  @ApiProperty({
    description: 'Match start time',
    example: '2024-01-15T20:00:00Z',
  })
  @Prop({
    type: Date,
    required: true,
  })
  matchStartTime: Date;
}

export type BetSelectionDocument = HydratedDocument<BetSelection>;

export const BetSelectionSchema = SchemaFactory.createForClass(BetSelection);
