import { BetSelection } from '../entities/bet-selection.entity';
import { BetSlip } from '../entities/bet-slip.entity';

export enum Blockchain {
  CROSSFI = 'crossfi',
  BNB = 'bnb',
}

export interface BetSlipAndSelection {
  betSlip: BetSlip;
  betSelection: BetSelection[];
}
