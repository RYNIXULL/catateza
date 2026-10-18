import { PrismaClient } from '@prisma/client';
import { CostingService } from './src/application/services/costing.service';

const prisma = new PrismaClient();

async function run() {
  const store = await prisma.store.findFirst();
  if (!store) return console.log('No store found');

  const product = await prisma.product.findFirst();
  if (!product) return console.log('No product found');

  // Let's manually create some stock movements to simulate FIFO
  await prisma.stockMovement.deleteMany({ where: { productId: product.id } });

  // 10 units at 1000
  await prisma.stockMovement.create({
    data: {
      productId: product.id,
      storeId: store.id,
      quantity: 10,
      unitCost: 1000,
      type: 'PURCHASE',
      notes: 'Batch 1'
    }
  });

  // 10 units at 2000
  await prisma.stockMovement.create({
    data: {
      productId: product.id,
      storeId: store.id,
      quantity: 10,
      unitCost: 2000,
      type: 'PURCHASE',
      notes: 'Batch 2'
    }
  });

  console.log('--- TESTING FIFO for 15 units ---');
  const fifo = await CostingService.calculateCOGS(store.id, product.id, 15, 'FIFO', 1500);
  console.log('FIFO Result (expected 20000 = 10*1000 + 5*2000):', fifo);

  console.log('--- TESTING LIFO for 15 units ---');
  const lifo = await CostingService.calculateCOGS(store.id, product.id, 15, 'LIFO', 1500);
  console.log('LIFO Result (expected 25000 = 10*2000 + 5*1000):', lifo);

  console.log('--- TESTING AVERAGE for 15 units ---');
  const avg = await CostingService.calculateCOGS(store.id, product.id, 15, 'AVERAGE', 1500);
  console.log('AVERAGE Result (expected 22500 = 15 * 1500):', avg);

  console.log('--- TESTING DEFAULT for 15 units ---');
  const def = await CostingService.calculateCOGS(store.id, product.id, 15, 'DEFAULT', 1500);
  console.log('DEFAULT Result (expected 22500 = 15 * 1500):', def);
}

run()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
