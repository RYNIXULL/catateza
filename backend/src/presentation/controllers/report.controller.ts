import { Request, Response } from 'express';
import { prisma } from '../../infrastructure/db';

export class ReportController {
  async getProfitLoss(req: Request, res: Response) {
    try {
      const storeId = req.query.storeId as string | undefined;
      const period = req.query.period as string || 'all';

      let dateFilter: any = undefined;
      const now = new Date();

      if (period === 'today') {
        const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        dateFilter = { gte: start };
      } else if (period === 'week') {
        const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7);
        dateFilter = { gte: start };
      } else if (period === 'month') {
        const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 30);
        dateFilter = { gte: start };
      } else if (period === '3months') {
        const start = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate());
        dateFilter = { gte: start };
      } else if (period === 'year') {
        const start = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
        dateFilter = { gte: start };
      } else if (period === 'all') {
        dateFilter = undefined;
      }

      const transactions = await prisma.transaction.findMany({
        where: {
          storeId: storeId ? storeId : undefined,
          status: 'COMPLETED',
          createdAt: dateFilter,
        },
        include: {
          items: true
        }
      });

      let totalRevenue = 0;
      let totalCogs = 0;
      let totalDiscounts = 0;

      for (const tx of transactions) {
        // Omzet = subtotal - discount (atau grandTotal kalau mau memperhitungkan tax)
        // Kita hitung dari subtotal penjualan murni:
        totalRevenue += Number(tx.subtotal);
        totalDiscounts += Number(tx.discount);

        for (const item of tx.items) {
          totalCogs += Number(item.cogs) * item.quantity;
        }
      }

      // Hitung pengeluaran dari CashFlow
      const cashFlows = await prisma.cashFlow.findMany({
        where: {
          storeId: storeId ? storeId : undefined,
          type: 'EXPENSE',
          date: dateFilter,
        }
      });
      
      const totalExpense = cashFlows.reduce((acc, curr) => acc + Number(curr.amount), 0);

      const netRevenue = totalRevenue - totalDiscounts;
      const grossProfit = netRevenue - totalCogs;

      res.json({
        period,
        revenue: totalRevenue,
        discounts: totalDiscounts,
        netRevenue,
        cogs: totalCogs,
        grossProfit,
        expenses: totalExpense
      });
    } catch (error: any) {
      console.error('Error fetching profit loss:', error);
      res.status(500).json({ message: 'Failed to fetch profit and loss report' });
    }
  }
}
