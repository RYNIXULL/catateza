import { prisma } from '../infrastructure/db';

export class CashFlowService {
  async getCashFlowByStore(storeId: string) {
    const whereClause = storeId === 'all' ? {} : { storeId };
    const cashFlows = await prisma.cashFlow.findMany({
      where: whereClause,
      orderBy: { date: 'desc' },
      include: {
        user: { select: { name: true } },
        store: { select: { name: true } }
      }
    });

    return cashFlows;
  }

  async getCashFlowSummary(storeId: string) {
    const whereClause = storeId === 'all' ? {} : { storeId };
    const cashFlows = await prisma.cashFlow.findMany({
      where: whereClause
    });

    const summary = cashFlows.reduce(
      (acc, curr) => {
        const amount = Number(curr.amount);
        if (curr.type === 'INCOME') acc.totalIncome += amount;
        else if (curr.type === 'EXPENSE') acc.totalExpense += amount;
        return acc;
      },
      { totalIncome: 0, totalExpense: 0 }
    );

    return {
      totalIncome: summary.totalIncome,
      totalExpense: summary.totalExpense,
      balance: summary.totalIncome - summary.totalExpense
    };
  }

  async createCashFlow(data: {
    type: 'INCOME' | 'EXPENSE';
    amount: number;
    description: string;
    category?: string;
    date?: Date;
    storeId: string;
    userId: string;
  }) {
    return await prisma.cashFlow.create({
      data: {
        type: data.type,
        amount: data.amount,
        description: data.description,
        category: data.category,
        date: data.date ? new Date(data.date) : new Date(),
        storeId: data.storeId,
        userId: data.userId
      },
      include: {
        user: { select: { name: true } }
      }
    });
  }

  async deleteCashFlow(id: string) {
    return await prisma.cashFlow.delete({
      where: { id }
    });
  }
}
