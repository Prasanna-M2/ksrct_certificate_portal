import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import rateLimit from 'express-rate-limit';
import bcrypt from 'bcryptjs';

import authRoutes from './routes/authRoutes';
import certificateRoutes from './routes/certificateRoutes';
import dashboardRoutes from './routes/dashboardRoutes';
import userRoutes from './routes/userRoutes';
import notificationRoutes from './routes/notificationRoutes';
import auditLogRoutes from './routes/auditLogRoutes';
import supportRoutes from './routes/supportRoutes';
import templateRoutes from './routes/templateRoutes';
import odRoutes from './routes/odRoutes';
import { prisma } from './utils/prisma';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Security middleware
app.use(helmet({
  crossOriginResourcePolicy: false,
  contentSecurityPolicy: false,
}));

app.use(cors({
  origin: true,
  credentials: true,
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static certificate uploads
const uploadDir = path.resolve(__dirname, '../../uploads/certificates');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}
app.use('/uploads/certificates', express.static(uploadDir));

// Rate limit on auth routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: { success: false, message: 'Too many requests, please try again later.' },
});

// API Routes
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/certificates', certificateRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/users', userRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/audit-logs', auditLogRoutes);
app.use('/api/support', supportRoutes);
app.use('/api/templates', templateRoutes);
app.use('/api/od', odRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'KSRCT Certificate Management Portal API running.' });
});

// Serve Frontend Static Site (Single Unified Service Deployment)
const clientDistDir = path.resolve(__dirname, '../../client/dist');
if (fs.existsSync(clientDistDir)) {
  app.use(express.static(clientDistDir));
  app.get('*', (req, res) => {
    if (req.path.startsWith('/api')) {
      return res.status(404).json({ success: false, message: 'API endpoint not found.' });
    }
    res.sendFile(path.join(clientDistDir, 'index.html'));
  });
}

// Bootstrap check for Creator & Admin accounts
const ensureBootstrapAdmin = async () => {
  try {
    const userCount = await prisma.user.count();
    if (userCount === 0) {
      const creatorPasswordHash = await bcrypt.hash('Creator@123', 10);
      await prisma.user.create({
        data: {
          name: 'Master Creator',
          email: 'creator@ksrct.ac.in',
          passwordHash: creatorPasswordHash,
          role: 'CREATOR',
          department: 'Electrical and Electronics Engineering',
          phone: '+91 98422 11111',
          isActive: true,
        },
      });
      console.log('🔑 Auto-created Master Creator: creator@ksrct.ac.in');
    }
  } catch (err) {
    console.error('Error during database bootstrap check:', err);
  }
};

app.listen(PORT, async () => {
  await ensureBootstrapAdmin();
  console.log(`🚀 KSRCT Unified Portal running at http://localhost:${PORT}`);
});

export default app;

