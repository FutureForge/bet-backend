# Blockchain-Specific Stats Migration

## Overview

This update adds blockchain-specific statistics to the user entity and related services. Previously, users had global stats (`totalWagered`, `totalWon`, `winCount`, `lossCount`), but now they have separate stats for each supported blockchain (`crossfi` and `bnb`).

## Changes Made

### 1. User Entity Updates (`src/users/entities/user.entity.ts`)

Added new fields for blockchain-specific stats:
- `crossfiTotalWagered`, `crossfiTotalWon`, `crossfiWinCount`, `crossfiLossCount`
- `bnbTotalWagered`, `bnbTotalWon`, `bnbWinCount`, `bnbLossCount`

Legacy fields are kept for backward compatibility but are deprecated.

### 2. Users Service Updates (`src/users/users.service.ts`)

#### Updated `updateStats` method
- Now accepts an optional `blockchain` parameter
- Updates blockchain-specific stats when blockchain is provided
- Falls back to legacy global stats when no blockchain is specified

#### Updated `getLeaderboard` method
- Now accepts an optional `blockchain` parameter
- Filters leaderboard by blockchain-specific stats
- Falls back to global stats when no blockchain is specified

#### New `getBlockchainStats` method
- Returns blockchain-specific stats for a given user and blockchain
- Calculates win rate based on blockchain-specific win/loss counts

### 3. Bets Service Updates (`src/bets/bets.service.ts`)

#### Updated `updateBetSlipResults` method
- Now passes the blockchain information when updating user stats
- Ensures stats are updated for the correct blockchain

### 4. Users Controller Updates (`src/users/users.controller.ts`)

#### Updated `getLeaderboard` endpoint
- Added `blockchain` query parameter support
- Updated API documentation

#### Updated `updateStats` endpoint
- Now accepts blockchain parameter in request body
- Updated API documentation

#### New `getBlockchainStats` endpoint
- `GET /users/:address/stats/:blockchain`
- Returns blockchain-specific stats for a user

### 5. DTO Updates (`src/users/dto/leaderboard.dto.ts`)

Added `blockchain` field to `LeaderboardQueryDto`:
- Optional enum field with values `'crossfi'` or `'bnb'`

## Migration

### Running the Migration

1. Ensure your MongoDB connection is properly configured
2. Run the migration script:

```bash
# Using ts-node
npx ts-node src/migrations/add-blockchain-stats.ts

# Or compile and run
npm run build
node dist/migrations/add-blockchain-stats.js
```

### What the Migration Does

1. **Adds new fields**: Initializes all blockchain-specific stats fields to 0 for existing users
2. **Migrates existing data**: Optionally migrates existing global stats to CrossFi blockchain (you can modify this behavior)

### Manual Migration (if needed)

If you prefer to run the migration manually via MongoDB shell:

```javascript
// Add new fields to all users
db.users.updateMany({}, {
  $set: {
    crossfiTotalWagered: 0,
    crossfiTotalWon: 0,
    crossfiWinCount: 0,
    crossfiLossCount: 0,
    bnbTotalWagered: 0,
    bnbTotalWon: 0,
    bnbWinCount: 0,
    bnbLossCount: 0
  }
});

// Optionally migrate existing stats to CrossFi
db.users.updateMany({
  $or: [
    { totalWagered: { $gt: 0 } },
    { totalWon: { $gt: 0 } },
    { winCount: { $gt: 0 } },
    { lossCount: { $gt: 0 } }
  ]
}, [
  {
    $set: {
      crossfiTotalWagered: '$totalWagered',
      crossfiTotalWon: '$totalWon',
      crossfiWinCount: '$winCount',
      crossfiLossCount: '$lossCount'
    }
  }
]);
```

## API Changes

### New Endpoints

#### Get Blockchain Stats
```
GET /users/:address/stats/:blockchain
```

Response:
```json
{
  "totalWagered": 100,
  "totalWon": 50,
  "winCount": 5,
  "lossCount": 3,
  "winRate": 62.5
}
```

### Updated Endpoints

#### Leaderboard with Blockchain Filter
```
GET /users/leaderboard?blockchain=crossfi&type=totalWon&limit=10
```

#### Update Stats with Blockchain
```
PATCH /users/:address/stats
```

Request body:
```json
{
  "stats": {
    "totalWagered": 100,
    "totalWon": 50,
    "winCount": 1,
    "lossCount": 0
  },
  "blockchain": "crossfi"
}
```

## Backward Compatibility

- Legacy global stats fields are preserved
- Existing API endpoints continue to work without blockchain parameter
- When no blockchain is specified, the system falls back to global stats
- No breaking changes to existing functionality

## Testing

After migration, test the following:

1. **Create new users** - Verify blockchain-specific fields are initialized to 0
2. **Place bets on different blockchains** - Verify stats are updated correctly
3. **Check leaderboards** - Verify blockchain filtering works
4. **Get user stats** - Verify blockchain-specific stats are returned correctly

## Rollback Plan

If you need to rollback:

1. The legacy fields are still available and functional
2. You can continue using the old API endpoints without blockchain parameters
3. The migration script can be modified to reverse the changes if needed

## Notes

- The migration assumes existing stats should be migrated to CrossFi blockchain
- You can modify the migration script to distribute existing stats differently
- Consider running this migration during a maintenance window
- Monitor the application after migration to ensure all functionality works correctly 