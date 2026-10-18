import { prisma } from '../../infrastructure/db';

export type CostingMethod = 'FIFO' | 'LIFO' | 'AVERAGE' | 'DEFAULT';

interface Batch {
  qty: number;
  cost: number;
}

export class CostingService {
  /**
   * Calculates the total Cost of Goods Sold (COGS) for selling `quantityToSell` items
   * of `productId` in `storeId`, based on the specified `costingMethod`.
   * Returns the TOTAL COGS (not per unit).
   */
  static async calculateCOGS(
    storeId: string,
    productId: string,
    quantityToSell: number,
    costingMethod: CostingMethod,
    defaultBuyPrice: number
  ): Promise<number> {
    if (quantityToSell <= 0) return 0;
    if (costingMethod === 'DEFAULT') {
      return quantityToSell * defaultBuyPrice;
    }

    // Fetch all historical movements for this product in this store
    const movements = await prisma.stockMovement.findMany({
      where: {
        storeId,
        productId,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    if (costingMethod === 'AVERAGE') {
      let totalQty = 0;
      let averageCost = defaultBuyPrice; // fallback

      for (const mov of movements) {
        const qty = mov.quantity;
        const cost = Number(mov.unitCost) || defaultBuyPrice;

        if (['PURCHASE', 'RETURN', 'ADJUSTMENT'].includes(mov.type)) {
          // Incoming stock
          const currentTotalValue = totalQty * averageCost;
          const incomingValue = qty * cost;
          totalQty += qty;
          if (totalQty > 0) {
            averageCost = (currentTotalValue + incomingValue) / totalQty;
          }
        } else {
          // Outgoing stock (SALE, DAMAGED, EXPIRED, TRANSFER)
          totalQty -= qty;
          if (totalQty < 0) totalQty = 0; // Guard against negative stock issues
        }
      }

      return quantityToSell * averageCost;
    }

    if (costingMethod === 'FIFO' || costingMethod === 'LIFO') {
      let batches: Batch[] = [];

      // Replay history to build current batches
      for (const mov of movements) {
        const qty = mov.quantity;
        const cost = Number(mov.unitCost) || defaultBuyPrice;

        if (['PURCHASE', 'RETURN', 'ADJUSTMENT'].includes(mov.type)) {
          // Incoming stock
          batches.push({ qty, cost });
        } else {
          // Outgoing stock
          let qtyToRemove = qty;
          while (qtyToRemove > 0 && batches.length > 0) {
            const batchIdx = costingMethod === 'FIFO' ? 0 : batches.length - 1;
            const batch = batches[batchIdx];

            if (batch.qty > qtyToRemove) {
              batch.qty -= qtyToRemove;
              qtyToRemove = 0;
            } else {
              qtyToRemove -= batch.qty;
              // Remove the depleted batch
              if (costingMethod === 'FIFO') {
                batches.shift();
              } else {
                batches.pop();
              }
            }
          }
        }
      }

      // Now calculate COGS for the new sale
      let totalCogs = 0;
      let remainingToSell = quantityToSell;

      while (remainingToSell > 0 && batches.length > 0) {
        const batchIdx = costingMethod === 'FIFO' ? 0 : batches.length - 1;
        const batch = batches[batchIdx];

        if (batch.qty > remainingToSell) {
          totalCogs += remainingToSell * batch.cost;
          // We don't actually mutate the array here because we're just calculating,
          // not saving the new state back (the new SALE movement will be saved by the controller)
          batch.qty -= remainingToSell;
          remainingToSell = 0;
        } else {
          totalCogs += batch.qty * batch.cost;
          remainingToSell -= batch.qty;
          
          if (costingMethod === 'FIFO') {
            batches.shift();
          } else {
            batches.pop();
          }
        }
      }

      // If there's still remainingToSell (stock went negative), fallback to default cost for the remainder
      if (remainingToSell > 0) {
        totalCogs += remainingToSell * defaultBuyPrice;
      }

      return totalCogs;
    }

    return quantityToSell * defaultBuyPrice;
  }
}
