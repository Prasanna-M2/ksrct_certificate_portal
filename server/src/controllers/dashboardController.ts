import { Response } from 'express';
import { prisma } from '../utils/prisma';
import { AuthenticatedRequest } from '../middleware/auth';

export const getStudentDashboard = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const studentId = req.user.userId;

    const [total, approved, pending, rejected, recentUploads] = await Promise.all([
      prisma.certificate.count({ where: { studentId } }),
      prisma.certificate.count({ where: { studentId, status: 'APPROVED' } }),
      prisma.certificate.count({ where: { studentId, status: 'PENDING' } }),
      prisma.certificate.count({ where: { studentId, status: 'REJECTED' } }),
      prisma.certificate.findMany({
        where: { studentId },
        orderBy: { uploadedAt: 'desc' },
        take: 5,
      }),
    ]);

    return res.status(200).json({
      success: true,
      stats: {
        total,
        approved,
        pending,
        rejected,
      },
      recentUploads,
    });
  } catch (error) {
    console.error('Student dashboard error:', error);
    return res.status(500).json({ success: false, message: 'Failed to load student dashboard metrics.' });
  }
};

export const getHodDashboard = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const department = req.user.department;

    const whereDept = {
      student: { department },
    };

    const [totalStudents, totalCertificates, pending, approved, rejected, recentActivities, categoryGroups] = await Promise.all([
      prisma.user.count({ where: { role: 'STUDENT', department } }),
      prisma.certificate.count({ where: whereDept }),
      prisma.certificate.count({ where: { ...whereDept, status: 'PENDING' } }),
      prisma.certificate.count({ where: { ...whereDept, status: 'APPROVED' } }),
      prisma.certificate.count({ where: { ...whereDept, status: 'REJECTED' } }),
      prisma.auditLog.findMany({
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),
      prisma.certificate.groupBy({
        by: ['category'],
        where: whereDept,
        _count: { category: true },
      }),
    ]);

    // Monthly uploads calculation
    const allCerts = await prisma.certificate.findMany({
      where: whereDept,
      select: { uploadedAt: true },
    });

    const monthMap: Record<string, number> = {};
    allCerts.forEach((c) => {
      const monthStr = new Date(c.uploadedAt).toLocaleString('default', { month: 'short' });
      monthMap[monthStr] = (monthMap[monthStr] || 0) + 1;
    });

    const monthlyUploads = Object.keys(monthMap).map((month) => ({
      month,
      count: monthMap[month],
    }));

    const statusOverview = [
      { name: 'Approved', value: approved, color: '#10b981' },
      { name: 'Pending', value: pending, color: '#f59e0b' },
      { name: 'Rejected', value: rejected, color: '#ef4444' },
    ];

    const categoryDistribution = categoryGroups.map((g) => ({
      category: g.category,
      count: g._count.category,
    }));

    return res.status(200).json({
      success: true,
      stats: {
        totalStudents,
        totalCertificates,
        pending,
        approved,
        rejected,
      },
      charts: {
        statusOverview,
        monthlyUploads,
        categoryDistribution,
      },
      recentActivities,
    });
  } catch (error) {
    console.error('HOD dashboard error:', error);
    return res.status(500).json({ success: false, message: 'Failed to load HOD dashboard metrics.' });
  }
};

export const getAdminDashboard = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const [totalUsers, totalStudents, totalHods, totalCertificates, pendingCerts, approvedCerts, rejectedCerts, openTickets] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { role: 'STUDENT' } }),
      prisma.user.count({ where: { role: 'HOD' } }),
      prisma.certificate.count(),
      prisma.certificate.count({ where: { status: 'PENDING' } }),
      prisma.certificate.count({ where: { status: 'APPROVED' } }),
      prisma.certificate.count({ where: { status: 'REJECTED' } }),
      prisma.supportTicket.count({ where: { status: 'OPEN' } }),
    ]);

    const recentLogs = await prisma.auditLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    return res.status(200).json({
      success: true,
      stats: {
        totalUsers,
        totalStudents,
        totalHods,
        totalCertificates,
        pendingCerts,
        approvedCerts,
        rejectedCerts,
        openTickets,
      },
      recentLogs,
    });
  } catch (error) {
    console.error('Admin dashboard error:', error);
    return res.status(500).json({ success: false, message: 'Failed to load Admin dashboard metrics.' });
  }
};
