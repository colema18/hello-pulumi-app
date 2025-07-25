import express from 'express';
import cors from 'cors';

const app = express();
const PORT = process.env.PORT || 5050;

app.use(cors());

app.get('/api/message', (_req, res) => {
  res.json({ message: 'abc123' });
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
