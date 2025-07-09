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
