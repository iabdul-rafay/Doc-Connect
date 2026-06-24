/**
 * config/db.js
 * Connects to MongoDB via Mongoose using the MONGO_URI environment variable.
 */
const mongoose = require('mongoose');

async function connectDB() {
  const uri = process.env.MONGO_URI;

  if (!uri) {
    console.error('✖  MONGO_URI is not set. Copy .env.example to .env and fill it in.');
    process.exit(1);
  }

  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 8000,
    });
    console.log(`✔  MongoDB connected: ${conn.connection.host}/${conn.connection.name}`);
  } catch (err) {
    console.error(`✖  MongoDB connection failed: ${err.message}`);
    console.error('   Is MongoDB running? Check your MONGO_URI in .env');
    process.exit(1);
  }

  mongoose.connection.on('disconnected', () =>
    console.warn('⚠  MongoDB disconnected — attempting to reconnect…')
  );
}

module.exports = connectDB;
