import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const password = await bcrypt.hash('admin123', 10);
  
  const defaultStore = await prisma.store.create({
    data: {
      name: 'Cabang Pusat',
      address: 'Jl. Merdeka No. 1, Jakarta',
      phone: '08123456789'
    }
  });

  const owner = await prisma.user.upsert({
    where: { email: 'admin@smartpos.com' },
    update: {},
    create: {
      email: 'admin@smartpos.com',
      name: 'Owner Admin',
      password,
      role: 'OWNER',
    },
  });

  const cashier = await prisma.user.upsert({
    where: { email: 'cashier@smartpos.com' },
    update: {},
    create: {
      email: 'cashier@smartpos.com',
      name: 'Kasir Satu',
      password,
      role: 'CASHIER',
      storeId: defaultStore.id
    },
  });

  console.log('Seed berhasil! Akun telah dibuat:');
  console.log(`[Store]   Name: ${defaultStore.name}`);
  console.log(`[Owner]   Email: ${owner.email} | Pass: admin123`);
  console.log(`[Cashier] Email: ${cashier.email} | Pass: admin123 | Store: ${defaultStore.name}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
