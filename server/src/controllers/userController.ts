import { Response } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../utils/prisma';
import { AuthenticatedRequest } from '../middleware/auth';
import { logAudit } from '../utils/auditLogger';

export const getUsers = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const { role, department, year, search, page = '1', limit = '50' } = req.query;

    const whereClause: any = {};

    if (req.user.role === 'HOD') {
      whereClause.role = 'STUDENT';
      whereClause.department = req.user.department;
    } else if (role && typeof role === 'string' && role !== 'ALL') {
      whereClause.role = role;
    }

    if (department && typeof department === 'string' && department !== 'ALL' && req.user.role === 'ADMIN') {
      whereClause.department = department;
    }

    if (year && typeof year === 'string' && year !== 'ALL') {
      whereClause.year = year;
    }

    if (search && typeof search === 'string' && search.trim() !== '') {
      const q = search.trim();
      whereClause.OR = [
        { name: { contains: q } },
        { email: { contains: q } },
        { registerNumber: { contains: q } },
      ];
    }

    const pageNum = parseInt(page as string, 10) || 1;
    const limitNum = parseInt(limit as string, 10) || 50;
    const skip = (pageNum - 1) * limitNum;

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where: whereClause,
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          department: true,
          year: true,
          registerNumber: true,
          phone: true,
          isActive: true,
          createdAt: true,
          _count: {
            select: { certificates: true },
          },
        },
        orderBy: { name: 'asc' },
        skip,
        take: limitNum,
      }),
      prisma.user.count({ where: whereClause }),
    ]);

    return res.status(200).json({
      success: true,
      users,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    console.error('Get users error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch users.' });
  }
};

export const createUser = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user || req.user.role !== 'ADMIN') {
      return res.status(403).json({ success: false, message: 'Admin access required.' });
    }

    const { name, email, password, role, department, year, registerNumber, phone } = req.body;

    if (!name || !email || !password || !department || !role) {
      return res.status(400).json({ success: false, message: 'All required fields must be filled.' });
    }

    const existing = await prisma.user.findUnique({
      where: { email: email.trim().toLowerCase() },
    });

    if (existing) {
      return res.status(400).json({ success: false, message: 'User with this email already exists.' });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const newUser = await prisma.user.create({
      data: {
        name,
        email: email.trim().toLowerCase(),
        passwordHash,
        role,
        department,
        year: year || null,
        registerNumber: registerNumber || null,
        phone: phone || null,
      },
    });

    await logAudit({
      userId: req.user.userId,
      userName: req.user.name,
      action: 'USER_CREATED',
      entityType: 'User',
      entityId: newUser.id,
      description: `Created user ${newUser.email} with role ${newUser.role}`,
      ipAddress: req.ip,
    });

    return res.status(201).json({
      success: true,
      message: 'User created successfully.',
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        department: newUser.department,
        year: newUser.year,
        registerNumber: newUser.registerNumber,
      },
    });
  } catch (error) {
    console.error('Create user error:', error);
    return res.status(500).json({ success: false, message: 'Failed to create user.' });
  }
};

export const updateUserStatus = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user || req.user.role !== 'ADMIN') {
      return res.status(403).json({ success: false, message: 'Admin access required.' });
    }

    const { id } = req.params;
    const { isActive } = req.body;

    const user = await prisma.user.update({
      where: { id },
      data: { isActive: Boolean(isActive) },
    });

    await logAudit({
      userId: req.user.userId,
      userName: req.user.name,
      action: isActive ? 'USER_ENABLED' : 'USER_DISABLED',
      entityType: 'User',
      entityId: user.id,
      description: `Set active status of ${user.email} to ${isActive}`,
      ipAddress: req.ip,
    });

    return res.status(200).json({
      success: true,
      message: `User status updated to ${isActive ? 'Active' : 'Disabled'}.`,
      user: { id: user.id, isActive: user.isActive },
    });
  } catch (error) {
    console.error('Update status error:', error);
    return res.status(500).json({ success: false, message: 'Failed to update user status.' });
  }
};

export const updateUserRole = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user || req.user.role !== 'ADMIN') {
      return res.status(403).json({ success: false, message: 'Admin access required.' });
    }

    const { id } = req.params;
    const { role } = req.body;

    if (!['STUDENT', 'HOD', 'ADMIN'].includes(role)) {
      return res.status(400).json({ success: false, message: 'Invalid role.' });
    }

    const user = await prisma.user.update({
      where: { id },
      data: { role },
    });

    await logAudit({
      userId: req.user.userId,
      userName: req.user.name,
      action: 'USER_ROLE_CHANGED',
      entityType: 'User',
      entityId: user.id,
      description: `Changed role of ${user.email} to ${role}`,
      ipAddress: req.ip,
    });

    return res.status(200).json({
      success: true,
      message: `User role updated to ${role}.`,
      user: { id: user.id, role: user.role },
    });
  } catch (error) {
    console.error('Update role error:', error);
    return res.status(500).json({ success: false, message: 'Failed to update user role.' });
  }
};

export const updateProfile = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const { name, phone } = req.body;

    const user = await prisma.user.update({
      where: { id: req.user.userId },
      data: {
        ...(name ? { name } : {}),
        ...(phone !== undefined ? { phone } : {}),
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        department: true,
        year: true,
        registerNumber: true,
        phone: true,
      },
    });

    await logAudit({
      userId: req.user.userId,
      userName: req.user.name,
      action: 'PROFILE_UPDATED',
      entityType: 'User',
      entityId: user.id,
      description: `Updated profile details.`,
      ipAddress: req.ip,
    });

    return res.status(200).json({
      success: true,
      message: 'Profile updated successfully.',
      user,
    });
  } catch (error) {
    console.error('Update profile error:', error);
    return res.status(500).json({ success: false, message: 'Failed to update profile.' });
  }
};
