import { ApiProperty } from '@nestjs/swagger';
import { BetSlip } from '../entities/bet-slip.entity';
import { BetSelection } from '../entities/bet-selection.entity';

export class BetSlipWithSelectionsResponseDto {
  @ApiProperty({
    description: 'The bet slip information',
    type: BetSlip,
  })
  betSlip: BetSlip;

  @ApiProperty({
    description: 'Array of selections in this bet slip',
    type: [BetSelection],
  })
  selections: BetSelection[];
}

export class BetSlipAndSelectionResponseDto {
  @ApiProperty({
    description: 'The bet slip information',
    type: BetSlip,
  })
  betSlip: BetSlip;

  @ApiProperty({
    description: 'Array of selections in this bet slip',
    type: [BetSelection],
  })
  betSelection: BetSelection[];
}
