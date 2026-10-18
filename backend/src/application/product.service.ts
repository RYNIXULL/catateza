import { prisma } from '../infrastructure/db';

export class ProductService {
  async getAllProducts(storeId?: string) {
    const whereCondition = storeId ? { storeId, isActive: true } : { isActive: true };
    return await prisma.product.findMany({
      where: whereCondition,
      include: {
        category: true,
        stocks: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
  }

  async getProductById(id: string) {
    return await prisma.product.findUnique({
      where: { id },
      include: {
        category: true,
        stocks: true
      }
    });
  }

  async createProduct(data: {
    sku: string;
    barcode?: string;
    name: string;
    description?: string;
    buyPrice: number;
    sellPrice: number;
    categoryId?: string;
    storeId: string;
    initialStock?: number;
  }) {
    // Start a transaction if we need to initialize stock
    return await prisma.$transaction(async (tx) => {
      const product = await tx.product.create({
        data: {
          sku: data.sku,
          barcode: data.barcode,
          name: data.name,
          description: data.description,
          buyPrice: data.buyPrice,
          sellPrice: data.sellPrice,
          categoryId: data.categoryId,
          storeId: data.storeId,
        },
      });

      const activeStoreId = data.storeId;

      if (data.initialStock !== undefined) {
        await tx.stock.create({
          data: {
            productId: product.id,
            storeId: activeStoreId,
            quantity: data.initialStock,
          }
        });

        if (data.initialStock > 0) {
          await tx.stockMovement.create({
            data: {
              type: 'MANUAL',
              quantity: data.initialStock,
              unitCost: data.buyPrice,
              productId: product.id,
              storeId: activeStoreId,
              notes: 'Initial stock',
            }
          });
        }
      }

      return product;
    });
  }

  async createBulkProducts(products: {
    sku: string;
    barcode?: string;
    name: string;
    description?: string;
    buyPrice: number;
    sellPrice: number;
    categoryId?: string;
    storeId: string;
    initialStock?: number;
  }[]) {
    return await prisma.$transaction(async (tx) => {
      const createdProducts = [];

      for (const data of products) {
        // Skip if SKU already exists in this store
        const existing = await tx.product.findFirst({ 
          where: { sku: data.sku, storeId: data.storeId } 
        });
        if (existing) continue;

        const product = await tx.product.create({
          data: {
            sku: data.sku,
            barcode: data.barcode,
            name: data.name,
            description: data.description,
            buyPrice: data.buyPrice,
            sellPrice: data.sellPrice,
            categoryId: data.categoryId,
            storeId: data.storeId,
          },
        });

        const activeStoreId = data.storeId;
        const initialStock = data.initialStock || 0;
        
        await tx.stock.create({
          data: {
            productId: product.id,
            storeId: activeStoreId,
            quantity: initialStock,
          }
        });

        if (initialStock > 0) {
          await tx.stockMovement.create({
            data: {
              type: 'MANUAL',
              quantity: initialStock,
              unitCost: data.buyPrice,
              productId: product.id,
              storeId: activeStoreId,
              notes: 'Bulk import initial stock',
            }
          });
        }

        createdProducts.push(product);
      }

      return createdProducts;
    });
  }

  async updateProduct(id: string, data: any) {
    return await prisma.product.update({
      where: { id },
      data
    });
  }

  async deleteProduct(id: string) {
    const transactionCount = await prisma.transactionItem.count({
      where: { productId: id }
    });

    if (transactionCount > 0) {
      // Soft-delete to preserve transaction history & financial audits
      return await prisma.product.update({
        where: { id },
        data: { isActive: false }
      });
    }

    // Hard-delete if no transactions exist yet
    return await prisma.$transaction(async (tx) => {
      await tx.stockMovement.deleteMany({ where: { productId: id } });
      await tx.stock.deleteMany({ where: { productId: id } });
      return await tx.product.delete({ where: { id } });
    });
  }
}
