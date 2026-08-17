import { Response } from 'express';
import { prisma } from '../utils/prisma';
import { AuthenticatedRequest } from '../middleware/auth';

export const getAuditLogs = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user || !['HOD', 'ADMIN'].includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'HOD or Admin access required.' });
    }

    const { action, search, page = '1', limit = '50' } = req.query;

    const whereClause: any = {};

    if (action && typeof action === 'string' && action !== 'ALL') {
      whereClause.action = action;
    }

    if (search && typeof search === 'string' && search.trim() !== '') {
      const q = search.trim();
      whereClause.OR = [
        { userName: { contains: q } },
        { action: { contains: q } },
        { description: { contains: q } },
      ];
    }

    const pageNum = parseInt(page as string, 10) || 1;
    const limitNum = parseInt(limit as string, 10) || 50;
    const skip = (pageNum - 1) * limitNum;

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where: whereClause,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limitNum,
      }),
      prisma.auditLog.count({ where: whereClause }),
    ]);

    return res.status(200).json({
      success: true,
      logs,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    console.error('Get audit logs error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch audit logs.' });
  }
};
