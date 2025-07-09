
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
 * Generate decimal odds from percent and comparison stats, with moderate adjustment.
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

  // Base odds
  const homeProb = Math.max(parse(percent.home), 0.01);
  const drawProb = Math.max(parse(percent.draw), 0.01);
  const awayProb = Math.max(parse(percent.away), 0.01);
  let homeOdds = 100 / homeProb;
  let drawOdds = 100 / drawProb;
  let awayOdds = 100 / awayProb;

  // Average comparison advantage
  const homeAdv = (parse(comparison.h2h.home) + parse(comparison.goals.home) + parse(comparison.total.home)) / 3;
  const awayAdv = (parse(comparison.h2h.away) + parse(comparison.goals.away) + parse(comparison.total.away)) / 3;
  const advDiff = homeAdv - awayAdv; // positive: home advantage, negative: away advantage

  // Moderate adjustment: up to ±7% based on advantage difference
  // Clamp advDiff to [-30, 30] for safety
  const clampedDiff = Math.max(-30, Math.min(30, advDiff));
  const adjFactor = clampedDiff / 30 * 0.07; // max ±7%

  // Adjust odds
  homeOdds = homeOdds * (1 - adjFactor);
  awayOdds = awayOdds * (1 + adjFactor);
  // Draw odds: slight adjustment (half of home/away adjustment, opposite direction of max advantage)
  drawOdds = drawOdds * (1 + Math.abs(adjFactor) * 0.5 * (advDiff < 0 ? -1 : 1));

  // Ensure odds are at least 1.01 and round to 2dp
  const round = (n: number) => Math.max(1.01, Math.round(n * 100) / 100);
  return {
    home: round(homeOdds),
    draw: round(drawOdds),
    away: round(awayOdds),
  };
} 