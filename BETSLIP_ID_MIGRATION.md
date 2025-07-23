# BetSlip ID Migration Guide

## Problem
The original implementation had a unique constraint on `betSlipId` across all blockchains. However, each blockchain (CrossFi and BNB) maintains its own separate counter for bet slip IDs, starting from 0-10000. This caused conflicts when both blockchains tried to use the same `betSlipId` values.

## Solution
Changed the unique constraint to be compound: `(blockchain, betSlipId)`. This allows each blockchain to have its own sequence of IDs without conflicts.

## Changes Made

### 1. Entity Changes (`src/bets/entities/bet-slip.entity.ts`)
- Removed `unique: true` from the `betSlipId` field
- Added compound unique index: `{ blockchain: 1, betSlipId: 1 }`
- Updated API documentation to clarify that betSlipId is unique within the blockchain

### 2. Service Changes (`src/bets/bets.service.ts`)
- Updated validation logic to check uniqueness based on both `blockchain` and `betSlipId`
- Modified `findByBetSlipId` method to accept optional `blockchain` parameter
- Updated error messages to be more specific about blockchain context

### 3. Controller Changes (`src/bets/bets.controller.ts`)
- Added optional `blockchain` query parameter to the `GET /:id` endpoint
- Added proper API documentation for the new query parameter
- Added necessary imports (`Query`, `ApiQuery`)

### 4. Database Migration (`src/migrations/update-betslip-index.ts`)
- Created migration script to update the database index
- Drops the old unique index on `betSlipId`
- Creates new compound unique index on `(blockchain, betSlipId)`

## How to Apply the Migration

### Option 1: Run the Migration Script
```bash
# Make sure you're in the project root
cd /path/to/bet-backend

# Run the migration
node run-migration.js
```

### Option 2: Manual Database Update
If you prefer to run the migration manually:

1. Connect to your MongoDB database
2. Drop the existing index:
   ```javascript
   db.betslips.dropIndex("betSlipId_1")
   ```
3. Create the new compound index:
   ```javascript
   db.betslips.createIndex(
     { blockchain: 1, betSlipId: 1 },
     { unique: true, name: "blockchain_betSlipId_unique" }
   )
   ```

## API Changes

### Before
```
GET /bets/12345
```
This would search for betSlipId 12345 across all blockchains.

### After
```
GET /bets/12345                    # Search across all blockchains
GET /bets/12345?blockchain=crossfi # Search only in CrossFi blockchain
GET /bets/12345?blockchain=bnb     # Search only in BNB blockchain
```

## Benefits
1. **No More Conflicts**: Each blockchain can have its own betSlipId sequence
2. **Better Performance**: Compound index provides efficient queries when filtering by blockchain
3. **Backward Compatibility**: Existing API calls still work (searches across all blockchains)
4. **Flexibility**: New optional blockchain parameter allows for more specific queries

## Testing
After applying the migration, test the following scenarios:
1. Create bets with the same betSlipId on different blockchains
2. Query bet slips with and without the blockchain parameter
3. Verify that duplicate betSlipIds within the same blockchain are still rejected
4. Ensure existing functionality continues to work

## Rollback Plan
If you need to rollback:
1. Drop the compound index: `db.betslips.dropIndex("blockchain_betSlipId_unique")`
2. Recreate the original index: `db.betslips.createIndex({ betSlipId: 1 }, { unique: true })`
3. Revert the code changes 