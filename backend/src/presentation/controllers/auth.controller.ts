import { Request, Response } from 'express';
import { prisma } from '../../infrastructure/db';
import { comparePassword, hashPassword } from '../../utils/hash';
import { generateTokens } from '../../utils/jwt';
import { z } from 'zod';

const loginSchema = z.object({
  email: z.string(),
  password: z.string().min(6),
});

export const login = async (req: Request, res: Response) => {
  try {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: 'Invalid credentials format', errors: (parsed.error as any).issues || (parsed.error as any).errors });
    }

    const email = parsed.data.email.trim().toLowerCase();
    const password = parsed.data.password.trim();

    const user = await prisma.user.findFirst({ 
      where: { 
        email: {
          equals: email
        }
      },
      include: { store: true }
    });
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const isValid = await comparePassword(password, user.password);
    if (!isValid) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const tokens = generateTokens({
      userId: user.id,
      role: user.role,
      storeId: user.storeId,
    });

    res.json({
      message: 'Login successful',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        storeId: user.storeId,
        store: user.store
      },
      tokens,
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Internal server error', error: String(error) });
  }
};

const createCashierSchema = z.object({
  email: z.string(),
  password: z.string().min(6),
  name: z.string().min(2),
  storeId: z.string().uuid().optional().nullable(),
});

export const createCashier = async (req: Request, res: Response) => {
  try {
    const parsed = createCashierSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: 'Invalid input', errors: (parsed.error as any).issues || (parsed.error as any).errors });
    }

    const { email, password, name, storeId } = parsed.data;

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(409).json({ message: 'Email already registered' });
    }

    if (storeId) {
      const store = await prisma.store.findUnique({ where: { id: storeId } });
      if (!store) {
        return res.status(404).json({ message: 'Store not found' });
      }
    }

    const hashedPassword = await hashPassword(password);

    const newUser = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        role: 'CASHIER',
        storeId,
      },
    });

    res.status(201).json({
      message: 'Cashier created successfully',
      user: {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
        role: newUser.role,
        storeId: newUser.storeId,
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'Internal server error' });
  }
};

const updateCashierSchema = z.object({
  email: z.string().optional(),
  password: z.string().min(6).optional(),
  name: z.string().min(2).optional(),
});

export const updateCashier = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const parsed = updateCashierSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: 'Invalid input', errors: (parsed.error as any).issues || (parsed.error as any).errors });
    }

    const { email, password, name } = parsed.data;

    // Verify user exists and is a cashier
    const existingUser = await prisma.user.findUnique({ where: { id } });
    if (!existingUser) {
      return res.status(404).json({ message: 'User not found' });
    }
    if (existingUser.role !== 'CASHIER') {
      return res.status(403).json({ message: 'Can only update cashier accounts' });
    }

    if (email && email !== existingUser.email) {
      const emailTaken = await prisma.user.findUnique({ where: { email } });
      if (emailTaken) {
        return res.status(409).json({ message: 'Email already registered' });
      }
    }

    const updateData: any = { name, email };
    
    if (password) {
      updateData.password = await hashPassword(password);
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: updateData,
    });

    res.json({
      message: 'Cashier updated successfully',
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        name: updatedUser.name,
        role: updatedUser.role,
        storeId: updatedUser.storeId,
      },
    });
  } catch (error) {
    console.error('Error updating cashier:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const deleteCashier = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    
    const existingUser = await prisma.user.findUnique({ where: { id } });
    if (!existingUser) {
      return res.status(404).json({ message: 'User not found' });
    }
    if (existingUser.role !== 'CASHIER') {
      return res.status(403).json({ message: 'Can only delete cashier accounts' });
    }

    await prisma.user.delete({ where: { id } });

    res.json({ message: 'Cashier deleted successfully' });
  } catch (error) {
    console.error('Error deleting cashier:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Kata sandi saat ini harus diisi'),
  newPassword: z.string().min(6, 'Kata sandi baru minimal 6 karakter'),
});

export const changePassword = async (req: Request, res: Response) => {
  try {
    const user = req.user;
    if (!user || !user.userId) {
      return res.status(401).json({ message: 'Sesi tidak valid, silakan login kembali' });
    }

    const parsed = changePasswordSchema.safeParse(req.body);
    if (!parsed.success) {
      const firstError = parsed.error.issues?.[0]?.message || 'Format kata sandi tidak valid';
      return res.status(400).json({ message: firstError });
    }

    const { currentPassword, newPassword } = parsed.data;

    const dbUser = await prisma.user.findUnique({
      where: { id: user.userId },
    });

    if (!dbUser) {
      return res.status(404).json({ message: 'Pengguna tidak ditemukan' });
    }

    const isCurrentValid = await comparePassword(currentPassword, dbUser.password);
    if (!isCurrentValid) {
      return res.status(400).json({ message: 'Kata sandi saat ini tidak sesuai / salah' });
    }

    const hashedNewPassword = await hashPassword(newPassword);
    await prisma.user.update({
      where: { id: user.userId },
      data: { password: hashedNewPassword },
    });

    return res.json({ message: 'Kata sandi berhasil diperbarui' });
  } catch (error) {
    console.error('Error changing password:', error);
    return res.status(500).json({ message: 'Terjadi kesalahan pada server saat mengubah kata sandi' });
  }
};
