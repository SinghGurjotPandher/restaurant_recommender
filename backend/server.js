const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();
const app = express();
const PORT = process.env.PORT || 3000;
const recommendationsRouter = require('./routes/recommendations');

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/recommendations', recommendationsRouter);

// Listen
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});