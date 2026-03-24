// Run this file using a cron job, e.g., using the 'node-cron' package
const mongoose = require('mongoose');
const cron = require('node-cron');
const BlacklistedToken = require('../models/BlacklistedToken'); // Example model

const startTokenCleanup = () => {
  // Run every day at midnight
  cron.schedule('0 0 * * *', async () => {
    console.log('Running scheduled token cleanup...');
    try {
      // Delete tokens that have an expiry date older than right now
      const result = await BlacklistedToken.deleteMany({ expiresAt: { $lt: new Date() } });
      console.log(`Cleanup complete: Removed ${result.deletedCount} expired tokens.`);
    } catch (error) {
      console.error('Error during token cleanup:', error);
    }
  });
};

module.exports = startTokenCleanup;