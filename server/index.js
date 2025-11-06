require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const expensesRouter = require('./routes/expenses');
const ocrRouter = require('./routes/ocr');
const categoriesRouter = require('./routes/categories');

const app = express();

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.json({ status: 'ok', name: 'slipwise-server' });
});

app.use('/expenses', expensesRouter);
app.use('/ocr', ocrRouter);
app.use('/categories', categoriesRouter);

// 404
app.use((req, res) => res.status(404).json({ error: 'Not found' }));

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Slipwise server listening on port ${PORT}`);
});
