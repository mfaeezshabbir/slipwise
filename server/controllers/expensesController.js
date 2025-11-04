const prisma = require('../prisma');

async function listExpenses() {
  return prisma.expense.findMany({
    orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
  });
}

async function getExpense(id) {
  return prisma.expense.findUnique({ where: { id } });
}

async function createExpense({ title, amount, date, note }) {
  const data = {
    title,
    amount: Number(amount),
    date: new Date(date),
    note: note ?? undefined,
  };
  return prisma.expense.create({ data });
}

async function updateExpense(id, { title, amount, date, note }) {
  const existing = await getExpense(id);
  if (!existing) return null;
  const data = {};
  if (title !== undefined) data.title = title;
  if (amount !== undefined) data.amount = Number(amount);
  if (date !== undefined) data.date = new Date(date);
  if (note !== undefined) data.note = note;
  data.updatedAt = new Date();
  return prisma.expense.update({ where: { id }, data });
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
