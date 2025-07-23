import { connect, disconnect } from 'mongoose';

// Migration script to update betSlipId index to be compound with blockchain
async function updateBetSlipIndex() {
  try {
    // Connect to MongoDB
    await connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/bet-backend');
    
    console.log('Connected to MongoDB');
    
    const db = await connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/bet-backend');
    const betSlipsCollection = db.connection.collection('betslips');
    
    // Drop the existing unique index on betSlipId
    try {
      await betSlipsCollection.dropIndex('betSlipId_1');
      console.log('Dropped existing betSlipId index');
    } catch (error) {
      console.log('betSlipId index not found or already dropped');
    }
    
    // Create new compound unique index on blockchain + betSlipId
    await betSlipsCollection.createIndex(
      { blockchain: 1, betSlipId: 1 },
      { unique: true, name: 'blockchain_betSlipId_unique' }
    );
    
    console.log('Created compound unique index on blockchain + betSlipId');
    
    // Verify the index was created
    const indexes = await betSlipsCollection.indexes();
    console.log('Current indexes:', indexes.map(idx => idx.name));
    
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
  updateBetSlipIndex();
}

export { updateBetSlipIndex }; 