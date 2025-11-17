const express = require('express');
const controller = require('../controllers/incomesController');

const router = express.Router();

// List all incomes
router.get('/', async (req, res) => {
  const rows = await controller.listIncomes();
  res.json(rows);
});

// Get one income
router.get('/:id', async (req, res) => {
  const id = req.params.id;
  const row = await controller.getIncome(id);
  if (!row) return res.status(404).json({ error: 'Income not found' });
  res.json(row);
});

// Create an income
router.post('/', async (req, res) => {
  const { title, amount, date, note, categoryId, account } = req.body;
  if (!title || amount == null || !date) {
    return res.status(400).json({ error: 'title, amount and date are required' });
  }
  const created = await controller.createIncome({ title, amount, date, note, categoryId, account });
  res.status(201).json(created);
});

// Update an income
router.put('/:id', async (req, res) => {
  const id = req.params.id;
  const { title, amount, date, note, categoryId, account } = req.body;
  const updated = await controller.updateIncome(id, {
    title,
    amount,
    date,
    note,
    categoryId,
    account,
  });
  if (!updated) return res.status(404).json({ error: 'Income not found' });
  res.json(updated);
});

// Delete an income
router.delete('/:id', async (req, res) => {
  const id = req.params.id;
  const ok = await controller.deleteIncome(id);
  if (!ok) return res.status(404).json({ error: 'Income not found' });
  res.status(204).end();
});

module.exports = router;
