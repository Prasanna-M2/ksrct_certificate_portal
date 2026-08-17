import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../utils/prisma';
import { generateToken } from '../utils/jwt';
import { logAudit } from '../utils/auditLogger';
import { AuthenticatedRequest } from '../middleware/auth';

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide email and password.' });
    }

    const user = await prisma.user.findUnique({
      where: { email: email.trim().toLowerCase() },
    });

    if (!user || !user.isActive) {
      return res.status(401).json({ success: false, message: 'Invalid credentials or inactive account.' });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials.' });
    }

    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      department: user.department,
    });

    await logAudit({
      userId: user.id,
      userName: user.name,
      action: 'LOGIN',
      description: `User ${user.email} (${user.role}) logged in successfully.`,
      ipAddress: req.ip,
    });

    const userResponse = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      department: user.department,
      year: user.year,
      registerNumber: user.registerNumber,
      phone: user.phone,
      profileImage: user.profileImage,
    };

    return res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      user: userResponse,
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ success: false, message: 'Server error during login.' });
  }
};

export const register = async (req: Request, res: Response) => {
  try {
    const { name, email, password, role, department, year, registerNumber, phone } = req.body;

    if (!name || !email || !password || !department) {
      return res.status(400).json({ success: false, message: 'Required fields missing.' });
    }

    const existingUser = await prisma.user.findUnique({
      where: { email: email.trim().toLowerCase() },
    });

    if (existingUser) {
      return res.status(400).json({ success: false, message: 'User with this email already exists.' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const assignedRole = role && ['STUDENT', 'HOD', 'ADMIN'].includes(role) ? role : 'STUDENT';

    const newUser = await prisma.user.create({
      data: {
        name,
        email: email.trim().toLowerCase(),
        passwordHash,
        role: assignedRole,
        department,
        year: year || null,
        registerNumber: registerNumber || null,
        phone: phone || null,
      },
    });

    const token = generateToken({
      userId: newUser.id,
      email: newUser.email,
      role: newUser.role,
      department: newUser.department,
    });

    await logAudit({
      userId: newUser.id,
      userName: newUser.name,
      action: 'USER_REGISTERED',
      description: `New user ${newUser.email} registered with role ${newUser.role}.`,
      ipAddress: req.ip,
    });

    return res.status(201).json({
      success: true,
      message: 'User registered successfully.',
      token,
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        department: newUser.department,
        year: newUser.year,
        registerNumber: newUser.registerNumber,
        phone: newUser.phone,
      },
    });
  } catch (error) {
    console.error('Register error:', error);
    return res.status(500).json({ success: false, message: 'Server error during registration.' });
  }
};

export const getMe = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Not authenticated.' });
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        department: true,
        year: true,
        registerNumber: true,
        phone: true,
        profileImage: true,
        createdAt: true,
      },
    });

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    return res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    console.error('GetMe error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch user profile.' });
  }
};

export const logout = async (req: AuthenticatedRequest, res: Response) => {
  if (req.user) {
    await logAudit({
      userId: req.user.userId,
      userName: req.user.name,
      action: 'LOGOUT',
      description: `User ${req.user.email} logged out.`,
      ipAddress: req.ip,
    });
  }
  return res.status(200).json({ success: true, message: 'Logged out successfully.' });
};
