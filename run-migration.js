#!/usr/bin/env node

// Simple script to run the betSlipId index migration
const { updateBetSlipIndex } = require('./src/migrations/update-betslip-index.ts');

console.log('Starting betSlipId index migration...');
updateBetSlipIndex()
  .then(() => {
    console.log('Migration completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Migration failed:', error);
    process.exit(1);
  }); 