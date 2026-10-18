import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { prisma } from './infrastructure/db';

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

app.use(helmet({
  crossOriginResourcePolicy: false,
}));
app.use(cors({
  origin: (origin, callback) => {
    // Mengizinkan request dari Electron desktop, localhost, web apps, maupun client tanpa origin header
    callback(null, true);
  },
  credentials: true
}));

import authRoutes from './presentation/routes/auth.routes';
import productRoutes from './presentation/routes/product.routes';
import transactionRoutes from './presentation/routes/transaction.routes';
import storeRoutes from './presentation/routes/store.routes';
import reportRoutes from './presentation/routes/report.routes';
import cashflowRoutes from './presentation/routes/cashflow.routes';
import userRoutes from './presentation/routes/user.routes';

// Parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/store', storeRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/cashflow', cashflowRoutes);
app.use('/api/users', userRoutes);

// Healthcheck Route
app.get('/api/health', async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.status(200).json({ status: 'UP', message: 'API is healthy and DB is connected' });
  } catch (error) {
    res.status(503).json({ status: 'DOWN', message: 'Database connection failed' });
  }
});

// Start Server
app.listen(port, () => {
  console.log(`🚀 Smart POS Backend running on port ${port}`);
});

export default app;
