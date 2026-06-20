const mongoose = require('mongoose');

async function connectDB(uri) {
  const DB_URL = uri || process.env.DB_URL || 'mongodb://127.0.0.1:27017/payrolldb';
  return mongoose.connect(DB_URL)
    .then(() => console.log('Connected to MongoDB'))
    .catch((err) => {
      console.error('MongoDB connection error:', err);
      throw err;
    });
}

module.exports = { connectDB };
