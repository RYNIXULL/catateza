import { Request, Response } from 'express';
import { prisma } from '../../infrastructure/db';

export class UserController {
  // Get all employees (Role: CASHIER)
  async getAllEmployees(req: Request, res: Response) {
    try {
      const employees = await prisma.user.findMany({
        where: { role: 'CASHIER' },
        include: { store: true },
        orderBy: { createdAt: 'desc' }
      });
      
      // Strip passwords
      const safeEmployees = employees.map(emp => {
        const { password, ...safeData } = emp;
        return safeData;
      });

      res.json(safeEmployees);
    } catch (error) {
      console.error('Error fetching employees:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }

  // Assign or unassign a user from a store
  async assignStore(req: Request, res: Response) {
    try {
      const id = req.params.id as string;
      const { storeId } = req.body; // Can be null to unassign

      const user = await prisma.user.findUnique({ where: { id } });
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      if (user.role !== 'CASHIER') {
        return res.status(400).json({ message: 'Only cashiers can be assigned to stores' });
      }

      if (storeId) {
        const store = await prisma.store.findUnique({ where: { id: storeId } });
        if (!store) {
          return res.status(404).json({ message: 'Store not found' });
        }
      }

      const updatedUser = await prisma.user.update({
        where: { id },
        data: { storeId: storeId || null }
      });

      const { password, ...safeUser } = updatedUser;
      res.json({ message: 'User assignment updated', user: safeUser });
    } catch (error) {
      console.error('Error assigning store:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }
}
