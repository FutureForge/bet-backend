import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, HydratedDocument, Types } from 'mongoose';
import { ApiProperty } from '@nestjs/swagger';
import { Blockchain } from '../types/bet.types';

export type BetSlipResult = 'pending' | 'won' | 'lost';
export type BetSlipStatus = 'pending' | 'resolved' | 'claimed';

@Schema({ timestamps: true })
export class BetSlip {
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
    description: 'Blockchain where the bet was placed',
    enum: ['crossfi', 'bnb'],
    example: 'crossfi',
  })
  @Prop({
    type: String,
    enum: ['crossfi', 'bnb'],
    required: true,
  })
  blockchain: Blockchain;

  @ApiProperty({
    description: 'Unique ID of the bet slip',
    example: '12345',
  })
  @Prop({
    type: Number,
    required: true,
    unique: true,
  })
  betSlipId: number;

  @ApiProperty({
    description: 'Total betting odd',
    example: '12345',
  })
  @Prop({
    type: Number,
    required: true,
  })
  totalOdds: number;

  @ApiProperty({
    description: 'Total bet amount in XFI or token decimals',
    example: 100.5,
  })
  @Prop({
    type: Number,
    required: true,
  })
  totalBetAmount: number;

  @ApiProperty({
    description: 'Expected total payment if all selections win',
    example: 2000,
  })
  @Prop({
    type: Number,
    required: true,
  })
  expectedPayment: number;

  @ApiProperty({
    description: 'Overall result of the bet slip',
    enum: ['pending', 'won', 'lost'],
    example: 'pending',
  })
  @Prop({
    type: String,
    enum: ['pending', 'won', 'lost'],
    required: true,
    default: 'pending',
  })
  betSlipResult: BetSlipResult;

  @ApiProperty({
    description: 'Status of the bet slip',
    enum: ['pending', 'resolved', 'claimed'],
    example: 'pending',
  })
  @Prop({
    type: String,
    enum: ['pending', 'resolved', 'claimed'],
    required: true,
    default: 'pending',
  })
  status: BetSlipStatus;

  @ApiProperty({
    description: 'Whether the bet slip has been claimed',
    example: false,
  })
  @Prop({
    type: Boolean,
    default: false,
  })
  isClaimed: boolean;

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
    description: 'Date when the bet slip was placed',
    example: '2024-01-15T10:30:00Z',
  })
  @Prop({
    type: Date,
    default: Date.now,
  })
  placedAt: Date;

  @ApiProperty({
    description: 'Date when the bet slip was resolved',
    example: '2024-01-16T15:45:00Z',
    required: false,
  })
  @Prop({
    type: Date,
  })
  resolvedAt?: Date;

  @ApiProperty({
    description: 'Date when the bet slip was claimed',
    example: '2024-01-17T12:00:00Z',
    required: false,
  })
  @Prop({
    type: Date,
  })
  claimedAt?: Date;

  @Prop({
    type: String,
    default: '',
  })
  claimSignature?: string;

  @ApiProperty({
    description: 'Actual winnings amount',
    example: 1500,
    required: false,
  })
  @Prop({
    type: Number,
    default: 0,
  })
  actualWinnings: number;
}

export type BetSlipDocument = HydratedDocument<BetSlip>;

export const BetSlipSchema = SchemaFactory.createForClass(BetSlip);
