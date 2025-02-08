const express = require('express');
const dotenv = require('dotenv');

dotenv.config();
const app = express();
app.use(express.json());

app.get('/users', (req, res) => {
  res.json({ message: 'User service is running' });
});

const PORT = process.env.PORT || 4001;
app.listen(PORT, () => console.log(`User Service running on port ${PORT}`));
