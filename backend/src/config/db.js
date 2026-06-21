const mongoose = require('mongoose');

async function connectDB(uri) {
  const DB_URL = uri || process.env.DB_URL || 'mongodb://127.0.0.1:27017/payrolldb';
  // Ensure retryWrites=false is always present in the connection string
  const connectUrl = DB_URL.includes('retryWrites')
    ? DB_URL
    : DB_URL.includes('?')
      ? `${DB_URL}&retryWrites=false`
      : `${DB_URL}?retryWrites=false`;

  return mongoose.connect(connectUrl, { retryWrites: false })
    .then(() => console.log('Connected to MongoDB'))
    .catch((err) => {
      console.error('MongoDB connection error:', err);
      throw err;
    });
}

module.exports = { connectDB };
