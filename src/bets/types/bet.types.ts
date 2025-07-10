import { BetSelection } from '../entities/bet-selection.entity';
import { BetSlip } from '../entities/bet-slip.entity';

export interface BetSlipAndSelection {
  betSlip: BetSlip;
  betSelection: BetSelection[];
}
