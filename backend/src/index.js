require('dotenv').config();
const express = require('express');
const userRoutes = require('./routes/userRoutes');
const { connectDB } = require('./config/db');

const app = express();
const PORT = process.env.PORT || 5000;
app.use(express.json());

connectDB().catch(() => process.exit(1));

app.use('/api/users', userRoutes);

app.get('/', (req, res) => {
  res.json({ message: 'Server is running' });
});


app.listen(PORT, () => {
  console.log(`Server running on port http://localhost:${PORT}`);
});