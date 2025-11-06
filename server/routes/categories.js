const express = require('express');
const controller = require('../controllers/categoriesController');

const router = express.Router();

// List all categories
router.get('/', async (req, res) => {
  const rows = await controller.listCategories();
  res.json(rows);
});

// Create a category
router.post('/', async (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: 'name is required' });
  const created = await controller.createCategory({ name });
  res.status(201).json(created);
});

module.exports = router;
