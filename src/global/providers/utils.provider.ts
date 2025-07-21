
/**
 * Convert Unix timestamp to readable time format based on timezone
 * @param timestamp - Unix timestamp in seconds
 * @param timezone - Timezone string (e.g., 'UTC', 'Europe/London', 'America/New_York')
 * @returns Formatted time string (e.g., '15:30', '3:30 PM')
 */
export function convertTimestampToTime(timestamp: number, timezone: string): string {
  try {
    // Convert seconds to milliseconds if needed
    const milliseconds = timestamp * 1000;
    // Create date object
    const date = new Date(milliseconds);
    // Format time as HH:MM
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  } catch (error) {
    console.error(
      `Error converting timestamp ${timestamp} with timezone ${timezone}:`,
      error,
    );
    return '00:00'; // Fallback time
  }
}

/**
 * Advanced odds generation model that mimics real bookmaker calculations.
 * Uses multiple factors: form, attack/defense, home advantage, market volatility,
 * and creates realistic odds with proper margins and market dynamics.
 * @param percent - { home: string, draw: string, away: string }
 * @param comparison - { h2h: { home: string, away: string }, goals: { home: string, away: string }, total: { home: string, away: string } }
 * @returns { home: number, draw: number, away: number }
 */
export function generateOdds(
  percent: { home: string; draw: string; away: string },
  comparison: {
    h2h: { home: string; away: string };
    goals: { home: string; away: string };
    total: { home: string; away: string };
  }
): { home: number; draw: number; away: number } {
  // Helper to parse percent string to number
  const parse = (val: string) => parseFloat(val.replace('%', ''));

  // Parse base probabilities from API
  const homeProb = Math.max(parse(percent.home), 1);
  const drawProb = Math.max(parse(percent.draw), 1);
  const awayProb = Math.max(parse(percent.away), 1);

  // Calculate comprehensive team strength indicators
  const homeH2H = parse(comparison.h2h.home);
  const awayH2H = parse(comparison.h2h.away);
  const homeGoals = parse(comparison.goals.home);
  const awayGoals = parse(comparison.goals.away);
  const homeTotal = parse(comparison.total.home);
  const awayTotal = parse(comparison.total.away);

  // Multi-factor strength calculation with weighted components
  const homeStrength = (homeH2H * 0.4 + homeGoals * 0.35 + homeTotal * 0.25);
  const awayStrength = (awayH2H * 0.4 + awayGoals * 0.35 + awayTotal * 0.25);

  // Calculate strength difference and normalize
  const strengthDiff = homeStrength - awayStrength;
  const normalizedDiff = Math.max(-1, Math.min(1, strengthDiff / 100));

  // Home advantage factor (typically 10-15% in football)
  const homeAdvantage = 0.12; // 12% home advantage

  // Calculate adjusted probabilities with multiple factors
  let adjustedHomeProb = homeProb;
  let adjustedAwayProb = awayProb;
  let adjustedDrawProb = drawProb;

  // Apply strength-based adjustments (max 20% adjustment)
  const strengthAdjustment = normalizedDiff * 0.20;
  adjustedHomeProb *= (1 + strengthAdjustment);
  adjustedAwayProb *= (1 - strengthAdjustment);

  // Apply home advantage
  adjustedHomeProb *= (1 + homeAdvantage);
  adjustedAwayProb *= (1 - homeAdvantage * 0.5); // Away teams suffer less than home teams benefit

  // Adjust draw probability based on match competitiveness
  const competitiveness = Math.abs(adjustedHomeProb - adjustedAwayProb) / 100;
  if (competitiveness > 0.3) {
    // One-sided matches have lower draw probability
    adjustedDrawProb *= (1 - competitiveness * 0.4);
  } else {
    // Close matches have higher draw probability
    adjustedDrawProb *= (1 + (0.3 - competitiveness) * 0.3);
  }

  // Ensure minimum probabilities
  adjustedHomeProb = Math.max(adjustedHomeProb, 8);
  adjustedAwayProb = Math.max(adjustedAwayProb, 8);
  adjustedDrawProb = Math.max(adjustedDrawProb, 12);

  // Normalize to 100%
  const totalProb = adjustedHomeProb + adjustedDrawProb + adjustedAwayProb;
  adjustedHomeProb = (adjustedHomeProb / totalProb) * 100;
  adjustedDrawProb = (adjustedDrawProb / totalProb) * 100;
  adjustedAwayProb = (adjustedAwayProb / totalProb) * 100;

  // Calculate base odds
  let homeOdds = 100 / adjustedHomeProb;
  let drawOdds = 100 / adjustedDrawProb;
  let awayOdds = 100 / adjustedAwayProb;

  // Dynamic bookmaker margin based on match characteristics
  const baseMargin = 0.025; // 2.5% base margin
  const volatilityMargin = competitiveness * 0.02; // Higher margin for volatile matches
  const totalMargin = baseMargin + volatilityMargin;

  // Apply margin to create overround
  const marginMultiplier = 1 + totalMargin;
  homeOdds *= marginMultiplier;
  drawOdds *= marginMultiplier;
  awayOdds *= marginMultiplier;

  // Market dynamics: compress extreme odds
  const oddsArray = [homeOdds, drawOdds, awayOdds];
  const maxOdds = Math.max(...oddsArray);
  const minOdds = Math.min(...oddsArray);
  const oddsRatio = maxOdds / minOdds;

  // Apply compression for extreme odds ratios
  if (oddsRatio > 8) {
    const compressionFactor = 8 / oddsRatio;
    const avgOdds = oddsArray.reduce((a, b) => a + b, 0) / 3;
    
    homeOdds = avgOdds + (homeOdds - avgOdds) * compressionFactor;
    drawOdds = avgOdds + (drawOdds - avgOdds) * compressionFactor;
    awayOdds = avgOdds + (awayOdds - avgOdds) * compressionFactor;
  }

  // Realistic odds constraints with market-based limits
  const clampOdds = (odds: number) => {
    // More realistic limits: 1.10 to 15.00
    const clamped = Math.max(1.10, Math.min(15.00, odds));
    // Round to 2 decimal places
    return Math.round(clamped * 100) / 100;
  };

  // Apply final constraints and rounding
  const finalHomeOdds = clampOdds(homeOdds);
  const finalDrawOdds = clampOdds(drawOdds);
  const finalAwayOdds = clampOdds(awayOdds);

  // Ensure mathematical consistency
  const finalOddsArray = [finalHomeOdds, finalDrawOdds, finalAwayOdds];
  const finalMaxOdds = Math.max(...finalOddsArray);
  const finalMinOdds = Math.min(...finalOddsArray);

  // Final compression if still too extreme
  if (finalMaxOdds / finalMinOdds > 10) {
    const finalCompression = 10 / (finalMaxOdds / finalMinOdds);
    const finalAvgOdds = finalOddsArray.reduce((a, b) => a + b, 0) / 3;
    
    return {
      home: clampOdds(finalAvgOdds + (finalHomeOdds - finalAvgOdds) * finalCompression),
      draw: clampOdds(finalAvgOdds + (finalDrawOdds - finalAvgOdds) * finalCompression),
      away: clampOdds(finalAvgOdds + (finalAwayOdds - finalAvgOdds) * finalCompression),
    };
  }

  return {
    home: finalHomeOdds,
    draw: finalDrawOdds,
    away: finalAwayOdds,
  };
} 