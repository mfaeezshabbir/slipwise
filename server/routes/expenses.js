const express = require('express');
const controller = require('../controllers/expensesController');

const router = express.Router();

// List all expenses
router.get('/', async (req, res) => {
  const rows = await controller.listExpenses();
  res.json(rows);
});

// Get one expense
router.get('/:id', async (req, res) => {
  const id = req.params.id;
  const row = await controller.getExpense(id);
  if (!row) return res.status(404).json({ error: 'Expense not found' });
  res.json(row);
});

// Create an expense
router.post('/', async (req, res) => {
  const { title, amount, date, note, categoryId } = req.body;
  if (!title || amount == null || !date) {
    return res.status(400).json({ error: 'title, amount and date are required' });
  }
  const created = await controller.createExpense({ title, amount, date, note, categoryId });
  res.status(201).json(created);
});

// Update an expense
router.put('/:id', async (req, res) => {
  const id = req.params.id;
  const { title, amount, date, note, categoryId } = req.body;
  const updated = await controller.updateExpense(id, { title, amount, date, note, categoryId });
  if (!updated) return res.status(404).json({ error: 'Expense not found' });
  res.json(updated);
});

// Delete an expense
router.delete('/:id', async (req, res) => {
  const id = req.params.id;
  const ok = await controller.deleteExpense(id);
  if (!ok) return res.status(404).json({ error: 'Expense not found' });
  res.status(204).end();
});

module.exports = router;
