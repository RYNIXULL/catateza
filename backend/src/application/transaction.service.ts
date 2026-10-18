import { prisma } from '../infrastructure/db';
import { CostingService, CostingMethod } from './services/costing.service';

interface TransactionItemInput {
  productId: string;
  quantity: number;
  price: number;
  discount?: number;
}

interface CreateTransactionInput {
  userId: string;
  storeId?: string; // We'll handle this dynamically
  items: TransactionItemInput[];
  subtotal: number;
  tax: number;
  discount: number;
  grandTotal: number;
  paymentMethod: 'CASH' | 'QRIS' | 'TRANSFER' | 'DEBIT' | 'KREDIT' | 'EWALLET';
  amountPaid: number;
}

export class TransactionService {
  async createTransaction(data: CreateTransactionInput) {
    let storeId = data.storeId?.trim() ? data.storeId.trim() : undefined;
    let storeConfig: any = null;
    
    // If storeId is provided, validate that the store exists
    if (storeId) {
      storeConfig = await prisma.store.findUnique({ where: { id: storeId } });
      if (!storeConfig) {
        throw new Error(`Cabang dengan ID '${storeId}' tidak ditemukan.`);
      }
    } else {
      // Fallback: If no storeId is provided, get or create a default store
      let store = await prisma.store.findFirst();
      if (!store) {
        store = await prisma.store.create({
          data: {
            name: 'Pusat (Default)',
            address: 'Jakarta',
          }
        });
      }
      storeId = store.id;
      storeConfig = store;
    }

    const costingMethod = storeConfig?.costingMethod as CostingMethod || 'DEFAULT';

    // Generate Invoice Number
    const date = new Date();
    const invoicePrefix = `INV-${date.getFullYear()}${(date.getMonth() + 1).toString().padStart(2, '0')}${date.getDate().toString().padStart(2, '0')}`;
    const count = await prisma.transaction.count({
      where: {
        invoiceNumber: {
          startsWith: invoicePrefix
        }
      }
    });
    const invoiceNumber = `${invoicePrefix}-${(count + 1).toString().padStart(4, '0')}`;

    return await prisma.$transaction(async (tx) => {
      // 1. Create Transaction
      const transaction = await tx.transaction.create({
        data: {
          invoiceNumber,
          subtotal: data.subtotal,
          tax: data.tax,
          discount: data.discount,
          grandTotal: data.grandTotal,
          storeId: storeId!,
          userId: data.userId,
          status: 'COMPLETED',
        }
      });

      // 2. Create Transaction Items & Deduct Stock
      for (const item of data.items) {
        const total = (item.price * item.quantity) - (item.discount || 0);
        
        // Fetch product to get base price
        const product = await tx.product.findUnique({ where: { id: item.productId } });
        const defaultBuyPrice = Number(product?.buyPrice || 0);

        // Calculate COGS using CostingService (we pass the tx client implicitly if we want, but CostingService uses global prisma for reads. Since it only reads past movements, reading outside the tx is fine, or we could refactor it. For simplicity, we just call the static method which uses the global prisma client. Since reads are historical, it's generally safe).
        const totalCogs = await CostingService.calculateCOGS(
          storeId!,
          item.productId,
          item.quantity,
          costingMethod,
          defaultBuyPrice
        );
        // Calculate per unit cogs
        const unitCogs = item.quantity > 0 ? totalCogs / item.quantity : 0;
        
        await tx.transactionItem.create({
          data: {
            transactionId: transaction.id,
            productId: item.productId,
            quantity: item.quantity,
            price: item.price,
            cogs: unitCogs,
            discount: item.discount || 0,
            total,
          }
        });

        // Handle Stock Deduction
        const existingStock = await tx.stock.findUnique({
          where: {
            productId_storeId: {
              productId: item.productId,
              storeId: storeId!
            }
          }
        });

        if (existingStock) {
          await tx.stock.update({
            where: { id: existingStock.id },
            data: { quantity: { decrement: item.quantity } }
          });
        } else {
          // Create stock with negative balance if not exists (for flexibility)
          await tx.stock.create({
            data: {
              productId: item.productId,
              storeId: storeId!,
              quantity: -item.quantity
            }
          });
        }

        // Record Stock Movement
        await tx.stockMovement.create({
          data: {
            type: 'SALE',
            quantity: -item.quantity,
            productId: item.productId,
            storeId: storeId!,
            referenceId: transaction.id,
            notes: `Sale - Invoice ${invoiceNumber}`
          }
        });
      }

      // 3. Create Payment Record
      await tx.payment.create({
        data: {
          transactionId: transaction.id,
          method: data.paymentMethod,
          amount: data.amountPaid,
        }
      });

      // 4. Record to CashFlow (Arus Kas Masuk Cabang Otomatis)
      await tx.cashFlow.create({
        data: {
          type: 'INCOME',
          amount: data.grandTotal,
          description: `Penjualan POS - ${invoiceNumber}`,
          category: 'PENJUALAN',
          storeId: storeId!,
          userId: data.userId,
          date: date,
        }
      });

      return transaction;
    });
  }

  async getTransactions(storeId?: string) {
    return await prisma.transaction.findMany({
      where: storeId ? { storeId } : undefined,
      include: {
        items: {
          include: {
            product: true
          }
        },
        payments: true,
        user: {
          select: { name: true, email: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  }
}
