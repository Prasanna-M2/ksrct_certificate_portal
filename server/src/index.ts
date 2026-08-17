import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import rateLimit from 'express-rate-limit';

import authRoutes from './routes/authRoutes';
import certificateRoutes from './routes/certificateRoutes';
import dashboardRoutes from './routes/dashboardRoutes';
import userRoutes from './routes/userRoutes';
import notificationRoutes from './routes/notificationRoutes';
import auditLogRoutes from './routes/auditLogRoutes';
import supportRoutes from './routes/supportRoutes';

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

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'KSRCT Certificate Management Portal API running.' });
});

// Serve Frontend Static Site (Single Unified Service Deployment)
const clientDistDir = path.resolve(__dirname, '../../client/dist');
if (fs.existsSync(clientDistDir)) {
  app.use(express.static(clientDistDir));
  app.get('*', (req, res) => {
    res.sendFile(path.join(clientDistDir, 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`🚀 KSRCT Unified Portal running at http://localhost:${PORT}`);
});

export default app;
