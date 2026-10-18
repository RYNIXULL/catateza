import { execSync } from 'child_process';
import { createClient } from '@libsql/client';
import dotenv from 'dotenv';
import path from 'path';
import bcrypt from 'bcryptjs';

dotenv.config({ path: path.join(__dirname, '..', '.env') });

async function syncTurso() {
  const url = process.env.TURSO_DATABASE_URL;
  const authToken = process.env.TURSO_AUTH_TOKEN;

  if (!url) {
    console.error('❌ Error: TURSO_DATABASE_URL belum diatur di file .env');
    console.log('Silakan isi variabel berikut di file backend/.env:');
    console.log('TURSO_DATABASE_URL="libsql://your-database.turso.io"');
    console.log('TURSO_AUTH_TOKEN="your_token_here"');
    process.exit(1);
  }

  console.log(`📡 Menghubungkan ke Turso Cloud: ${url}...`);
  const client = createClient({ url, authToken });

  // 1. Generate SQL migration from Prisma schema
  console.log('🔨 Mengompilasi skema Prisma ke SQL DDL...');
  const schemaPath = path.join(__dirname, '..', 'prisma', 'schema.prisma');
  const ddlSql = execSync(
    `npx prisma migrate diff --from-empty --to-schema-datamodel "${schemaPath}" --script`,
    { cwd: path.join(__dirname, '..'), encoding: 'utf-8' }
  );

  // 2. Execute statements on Turso
  console.log('🚀 Menerapkan tabel ke Turso Database...');
  const statements = ddlSql
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0);

  for (const statement of statements) {
    try {
      await client.execute(statement);
    } catch (err: any) {
      // Ignore if table/index already exists
      if (!err.message?.includes('already exists')) {
        console.warn(`Peringatan SQL: ${err.message}`);
      }
    }
  }
  console.log(`✅ Berhasil menyinkronkan ${statements.length} instruksi skema ke Turso!`);

  // 3. Seed default Store and Admin user if empty
  console.log('🌱 Memeriksa data awal (Seed)...');
  const userCheck = await client.execute('SELECT COUNT(*) as count FROM User');
  const count = Number(userCheck.rows[0]?.count || 0);

  if (count === 0) {
    console.log('Membuat Akun Admin dan Cabang Default di Turso...');
    const storeId = 'store-default-pusat';
    const passwordHash = await bcrypt.hash('admin123', 10);
    const now = new Date().toISOString();

    await client.execute({
      sql: `INSERT INTO Store (id, name, address, phone, costingMethod, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      args: [storeId, 'Cabang Pusat', 'Jl. Merdeka No. 1, Jakarta', '08123456789', 'DEFAULT', now, now],
    });

    await client.execute({
      sql: `INSERT INTO User (id, email, password, name, role, storeId, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      args: ['user-admin-1', 'admin@smartpos.com', passwordHash, 'Owner Admin', 'OWNER', null, now, now],
    });

    console.log('✅ Akun Admin berhasil dibuat di Turso: admin@smartpos.com / admin123');
  } else {
    console.log(`ℹ️ Database Turso sudah memiliki ${count} pengguna. Seeding dilewati.`);
  }

  console.log('🎉 Selesai! Database Turso Cloud Anda siap digunakan.');
}

syncTurso().catch((err) => {
  console.error('❌ Gagal sinkronisasi ke Turso:', err);
  process.exit(1);
});
