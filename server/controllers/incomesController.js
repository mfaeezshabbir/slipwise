const prisma = require('../prisma');

async function listIncomes() {
  return prisma.income.findMany({
    orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
    include: { category: true },
  });
}

async function getIncome(id) {
  return prisma.income.findUnique({ where: { id }, include: { category: true } });
}

async function createIncome({ title, amount, date, note, categoryId, account }) {
  const data = {
    title,
    amount: Number(amount),
    date: new Date(date),
    note: note ?? undefined,
    account: account ?? 'default',
  };

  if (categoryId) {
    data.category = { connect: { id: categoryId } };
  }

  return prisma.income.create({ data, include: { category: true } });
}

async function updateIncome(id, { title, amount, date, note, categoryId, account }) {
  const existing = await getIncome(id);
  if (!existing) return null;
  const data = {};
  if (title !== undefined) data.title = title;
  if (amount !== undefined) data.amount = Number(amount);
  if (date !== undefined) data.date = new Date(date);
  if (note !== undefined) data.note = note;
  if (account !== undefined) data.account = account;
  if (categoryId !== undefined) {
    if (categoryId) data.category = { connect: { id: categoryId } };
    else data.category = { disconnect: true };
  }
  data.updatedAt = new Date();
  return prisma.income.update({ where: { id }, data, include: { category: true } });
}

async function deleteIncome(id) {
  try {
    await prisma.income.delete({ where: { id } });
    return true;
  } catch (e) {
    return false;
  }
}

module.exports = {
  listIncomes,
  getIncome,
  createIncome,
  updateIncome,
  deleteIncome,
};
