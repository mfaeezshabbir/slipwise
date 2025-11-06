const prisma = require('../prisma');

async function listExpenses() {
  return prisma.expense.findMany({
    orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
    include: { category: true },
  });
}

async function getExpense(id) {
  return prisma.expense.findUnique({ where: { id }, include: { category: true } });
}

async function createExpense({ title, amount, date, note, categoryId }) {
  const data = {
    title,
    amount: Number(amount),
    date: new Date(date),
    note: note ?? undefined,
  };

  if (categoryId) {
    data.category = { connect: { id: categoryId } };
  }

  return prisma.expense.create({ data, include: { category: true } });
}

async function updateExpense(id, { title, amount, date, note, categoryId }) {
  const existing = await getExpense(id);
  if (!existing) return null;
  const data = {};
  if (title !== undefined) data.title = title;
  if (amount !== undefined) data.amount = Number(amount);
  if (date !== undefined) data.date = new Date(date);
  if (note !== undefined) data.note = note;
  if (categoryId !== undefined) {
    if (categoryId) data.category = { connect: { id: categoryId } };
    else data.category = { disconnect: true };
  }
  data.updatedAt = new Date();
  return prisma.expense.update({ where: { id }, data, include: { category: true } });
}

async function deleteExpense(id) {
  try {
    await prisma.expense.delete({ where: { id } });
    return true;
  } catch (e) {
    return false;
  }
}

module.exports = {
  listExpenses,
  getExpense,
  createExpense,
  updateExpense,
  deleteExpense,
};
