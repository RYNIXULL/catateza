import { Request, Response } from 'express';
import { prisma } from '../../infrastructure/db';
import { z } from 'zod';

const updateSettingsSchema = z.object({
  costingMethod: z.enum(['FIFO', 'LIFO', 'AVERAGE', 'DEFAULT']),
});

export const getStoreSettings = async (req: Request, res: Response) => {
  try {
    const user = req.user;
    if (!user || !user.storeId) {
      return res.status(403).json({ message: 'Store not found' });
    }

    const store = await prisma.store.findUnique({
      where: { id: user.storeId },
      select: {
        costingMethod: true,
      },
    });

    if (!store) {
      return res.status(404).json({ message: 'Store not found' });
    }

    res.json(store);
  } catch (error) {
    console.error('Error getting store settings:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const updateStoreSettings = async (req: Request, res: Response) => {
  try {
    const user = req.user;
    if (!user || !user.storeId) {
      return res.status(403).json({ message: 'Store not found' });
    }

    const parsed = updateSettingsSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: 'Invalid input', errors: (parsed.error as any).issues || (parsed.error as any).errors });
    }

    const { costingMethod } = parsed.data;

    const store = await prisma.store.update({
      where: { id: user.storeId },
      data: {
        costingMethod,
      },
      select: {
        costingMethod: true,
      }
    });

    res.json({ message: 'Settings updated successfully', settings: store });
  } catch (error) {
    console.error('Error updating store settings:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getAllStores = async (req: Request, res: Response) => {
  try {
    const stores = await prisma.store.findMany({
      include: {
        _count: {
          select: {
            users: true,
            transactions: true
          }
        }
      }
    });
    res.json(stores);
  } catch (error) {
    console.error('Error getting stores:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const storeSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  address: z.string().optional(),
  phone: z.string().optional(),
});

export const createStore = async (req: Request, res: Response) => {
  try {
    const parsed = storeSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: 'Invalid input', errors: (parsed.error as any).issues || (parsed.error as any).errors });
    }

    const store = await prisma.store.create({
      data: parsed.data,
    });
    res.status(201).json(store);
  } catch (error) {
    console.error('Error creating store:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const updateStore = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const parsed = storeSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: 'Invalid input', errors: (parsed.error as any).issues || (parsed.error as any).errors });
    }

    const store = await prisma.store.update({
      where: { id },
      data: parsed.data,
    });
    res.json(store);
  } catch (error) {
    console.error('Error updating store:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const deleteStore = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    // We shouldn't let them delete if there are transactions, or we cascade it.
    // For now we'll just try to delete, Prisma will throw if there are relations without cascade.
    await prisma.store.delete({
      where: { id },
    });
    res.json({ message: 'Store deleted successfully' });
  } catch (error) {
    console.error('Error deleting store:', error);
    res.status(500).json({ message: 'Internal server error, store might have related data' });
  }
};

export const getStoreDashboard = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    
    // Get basic stats
    const store = await prisma.store.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            users: true,
          }
        }
      }
    });

    if (!store) {
      return res.status(404).json({ message: 'Store not found' });
    }

    const stockCount = await prisma.stock.count({
      where: { storeId: id }
    });

    // Today's Revenue
    const today = new Date();
    today.setHours(0,0,0,0);
    const todayTransactions = await prisma.transaction.findMany({
      where: {
        storeId: id,
        createdAt: { gte: today },
        status: 'COMPLETED'
      },
      select: {
        subtotal: true,
        discount: true,
      }
    });

    const todayRevenue = todayTransactions.reduce((acc, tx) => acc + Number(tx.subtotal) - Number(tx.discount), 0);

    // Total Revenue (All Time)
    const allTransactions = await prisma.transaction.findMany({
      where: {
        storeId: id,
        status: 'COMPLETED'
      },
      select: {
        subtotal: true,
        discount: true,
      }
    });
    const totalRevenue = allTransactions.reduce((acc, tx) => acc + Number(tx.subtotal) - Number(tx.discount), 0);

    res.json({
      store,
      stockCount,
      todayRevenue,
      totalRevenue,
      transactionCount: allTransactions.length
    });
  } catch (error) {
    console.error('Error getting store dashboard:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getStoreCashiers = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const cashiers = await prisma.user.findMany({
      where: {
        storeId: id,
        role: 'CASHIER'
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(cashiers);
  } catch (error) {
    console.error('Error getting store cashiers:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
