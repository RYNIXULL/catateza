import { Request, Response } from 'express';
import { TransactionService } from '../../application/transaction.service';

const transactionService = new TransactionService();

export class TransactionController {
  async createTransaction(req: Request, res: Response) {
    try {
      // The user ID is injected by authMiddleware
      const userId = req.user?.userId;
      if (!userId) {
        return res.status(401).json({ message: 'User not found in token' });
      }

      const transactionData = {
        ...req.body,
        userId,
        // req.body.storeId might be injected by requireStoreIsolation for cashiers
      };

      const transaction = await transactionService.createTransaction(transactionData);
      res.status(201).json({ message: 'Transaction successful', transaction });
    } catch (error: any) {
      console.error('Transaction Error:', error);
      res.status(500).json({ message: 'Failed to process transaction', error: error.message });
    }
  }

  async getTransactions(req: Request, res: Response) {
    try {
      // req.query.storeId might be injected by requireStoreIsolation for cashiers
      const storeId = req.query.storeId as string | undefined;
      const transactions = await transactionService.getTransactions(storeId);
      res.json(transactions);
    } catch (error: any) {
      res.status(500).json({ message: 'Error fetching transactions', error: error.message });
    }
  }
}
