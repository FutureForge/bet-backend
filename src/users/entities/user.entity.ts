import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type UserDocument = User & Document;

@Schema({ timestamps: true })
export class User {
  _id: Types.ObjectId;

  @Prop({ required: true, unique: true })
  address: string;

  @Prop()
  username?: string;

  // CrossFi blockchain stats
  @Prop({ default: 0 })
  crossfiTotalWagered: number;

  @Prop({ default: 0 })
  crossfiTotalWon: number;

  @Prop({ default: 0 })
  crossfiWinCount: number;

  @Prop({ default: 0 })
  crossfiLossCount: number;

  // BNB blockchain stats
  @Prop({ default: 0 })
  bnbTotalWagered: number;

  @Prop({ default: 0 })
  bnbTotalWon: number;

  @Prop({ default: 0 })
  bnbWinCount: number;

  @Prop({ default: 0 })
  bnbLossCount: number;

  // Legacy fields for backward compatibility (deprecated)
  @Prop({ default: 0 })
  totalWagered: number;

  @Prop({ default: 0 })
  totalWon: number;

  @Prop({ default: 0 })
  winCount: number;

  @Prop({ default: 0 })
  lossCount: number;

  @Prop({ default: Date.now })
  createdAt: Date;

  @Prop({ default: Date.now })
  lastActiveAt: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);
