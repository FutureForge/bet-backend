import { connect, disconnect } from 'mongoose';

// Migration script to add blockchain-specific stats to existing users
async function migrateBlockchainStats() {
  try {
    // Connect to MongoDB (update with your connection string)
    await connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/bet-backend');
    
    console.log('Connected to MongoDB');
    
    // Get the users collection
    const db = await connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/bet-backend');
    const usersCollection = db.connection.collection('users');
    
    // Update all existing users to have blockchain-specific stats initialized to 0
    const result = await usersCollection.updateMany(
      {},
      {
        $set: {
          crossfiTotalWagered: 0,
          crossfiTotalWon: 0,
          crossfiWinCount: 0,
          crossfiLossCount: 0,
          bnbTotalWagered: 0,
          bnbTotalWon: 0,
          bnbWinCount: 0,
          bnbLossCount: 0,
        }
      }
    );
    
    console.log(`Updated ${result.modifiedCount} users with blockchain stats fields`);
    
    // Optionally, you can migrate existing global stats to a specific blockchain
    // For example, if you want to migrate existing stats to CrossFi:
    const migrationResult = await usersCollection.updateMany(
      {
        $or: [
          { totalWagered: { $gt: 0 } },
          { totalWon: { $gt: 0 } },
          { winCount: { $gt: 0 } },
          { lossCount: { $gt: 0 } }
        ]
      },
      [
        {
          $set: {
            crossfiTotalWagered: '$totalWagered',
            crossfiTotalWon: '$totalWon',
            crossfiWinCount: '$winCount',
            crossfiLossCount: '$lossCount'
          }
        }
      ]
    );
    
    console.log(`Migrated existing stats to CrossFi for ${migrationResult.modifiedCount} users`);
    
    await disconnect();
    console.log('Migration completed successfully');
    
  } catch (error) {
    console.error('Migration failed:', error);
    await disconnect();
    process.exit(1);
  }
}

// Run migration if this file is executed directly
if (require.main === module) {
  migrateBlockchainStats();
}

export { migrateBlockchainStats }; 