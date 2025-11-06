const prisma = require('../prisma');

async function listCategories() {
  return prisma.category.findMany({ orderBy: [{ name: 'asc' }] });
}

async function getCategory(id) {
  return prisma.category.findUnique({ where: { id } });
}

async function createCategory({ name }) {
  // Try to find existing by case-insensitive name, otherwise create.
  const existing = await prisma.category.findUnique({ where: { name } }).catch(() => null);
  if (existing) return existing;
  return prisma.category.create({ data: { name } });
}

module.exports = {
  listCategories,
  getCategory,
  createCategory,
};
