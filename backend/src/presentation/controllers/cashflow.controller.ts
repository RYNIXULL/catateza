import { Request, Response } from 'express';
import { CashFlowService } from '../../application/cashflow.service';

const cashFlowService = new CashFlowService();

export class CashFlowController {
  async getByStore(req: Request, res: Response) {
    try {
      const storeId = req.params.storeId as string;
      const cashFlows = await cashFlowService.getCashFlowByStore(storeId);
      const summary = await cashFlowService.getCashFlowSummary(storeId);
      
      res.json({ data: cashFlows, summary });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Failed to fetch cash flow data' });
    }
  }

  async create(req: Request, res: Response) {
    try {
      const data = req.body;
      const userId = (req as any).user?.userId || data.userId;
      
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const cashFlow = await cashFlowService.createCashFlow({ ...data, userId });
      res.status(201).json(cashFlow);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Failed to create cash flow entry' });
    }
  }

  async delete(req: Request, res: Response) {
    try {
      const id = req.params.id as string;
      await cashFlowService.deleteCashFlow(id);
      res.status(204).send();
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Failed to delete cash flow entry' });
    }
  }
}
