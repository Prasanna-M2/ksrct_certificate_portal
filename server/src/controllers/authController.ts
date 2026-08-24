import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../utils/prisma';
import { generateToken } from '../utils/jwt';
import { logAudit } from '../utils/auditLogger';
import { AuthenticatedRequest } from '../middleware/auth';

const EEE_DEPARTMENT = 'Electrical and Electronics Engineering';

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide email and password.' });
    }

    const rawInput = email.trim();
    const normalizedEmail = rawInput.toLowerCase();

    let user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: normalizedEmail },
          { registerNumber: rawInput },
          { rollNumber: rawInput },
          { email: rawInput },
        ],
      },
      include: {
        staffResponsibilities: {
          where: { isActive: true },
        },
        advisorAssignments: {
          where: { isActive: true },
        },
        mentor: {
          select: { id: true, name: true, email: true, phone: true },
        },
        advisor: {
          select: { id: true, name: true, email: true, phone: true },
        },
      },
    });

    if (!user || !user.isActive) {
      return res.status(401).json({ success: false, message: 'Invalid credentials or inactive account.' });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials.' });
    }

    const responsibilities = user.staffResponsibilities.map((r) => r.responsibility);
    if (['MENTOR', 'ADVISOR', 'HOD'].includes(user.role) && !responsibilities.includes(user.role)) {
      responsibilities.push(user.role);
    }

    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      department: user.department || EEE_DEPARTMENT,
      responsibilities,
    });

    await logAudit({
      userId: user.id,
      userName: user.name,
      action: 'LOGIN',
      description: `User ${user.email} (${user.role} - [${responsibilities.join(', ')}]) logged in successfully.`,
      ipAddress: req.ip,
    });

    const userResponse = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      department: user.department || EEE_DEPARTMENT,
      year: user.year,
      section: user.section,
      registerNumber: user.registerNumber,
      rollNumber: user.rollNumber,
      phone: user.phone,
      profileImage: user.profileImage,
      mentorId: user.mentorId,
      mentor: user.mentor,
      advisorId: user.advisorId,
      advisor: user.advisor,
      mentorCapacity: user.mentorCapacity,
      responsibilities,
      advisorAssignments: user.advisorAssignments.map((a) => ({
        id: a.id,
        year: a.year,
        section: a.section,
      })),
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

/**
 * Check Register Number existence & setup status for linking
 */
export const checkRegisterNumber = async (req: Request, res: Response) => {
  try {
    const { registerNumber } = req.body;

    if (!registerNumber || !registerNumber.trim()) {
      return res.status(400).json({ success: false, message: 'Please provide a Register Number.' });
    }

    const regNo = registerNumber.trim().toUpperCase();

    const student = await prisma.user.findUnique({
      where: { registerNumber: regNo },
      include: {
        mentor: { select: { id: true, name: true, email: true } },
        advisor: { select: { id: true, name: true, email: true } },
      },
    });

    if (!student) {
      return res.status(404).json({
        success: false,
        status: 'NOT_FOUND',
        message: 'Register number not found. Please verify your Register Number or contact the EEE department administrator.',
      });
    }

    if (student.isAccountSetup) {
      return res.status(200).json({
        success: true,
        status: 'ALREADY_ACTIVE',
        message: 'This register number is already linked to an active account. Please log in or use Forgot Password.',
        student: {
          name: student.name,
          registerNumber: student.registerNumber,
          email: student.email,
        },
      });
    }

    // Account setup is available
    return res.status(200).json({
      success: true,
      status: 'SETUP_AVAILABLE',
      message: `Student record found for ${student.name}. Complete your account setup.`,
      student: {
        id: student.id,
        name: student.name,
        registerNumber: student.registerNumber,
        email: student.email || `${regNo.toLowerCase()}@ksrct.ac.in`,
        year: student.year || 'I',
        section: student.section || 'A',
        phone: student.phone || '',
        mentorId: student.mentorId || '',
        advisorId: student.advisorId || '',
        mentor: student.mentor,
        advisor: student.advisor,
      },
    });
  } catch (error) {
    console.error('Check register error:', error);
    return res.status(500).json({ success: false, message: 'Server error checking register number.' });
  }
};

/**
 * Complete Student Account Setup & Linking
 */
export const completeStudentSetup = async (req: Request, res: Response) => {
  try {
    const { registerNumber, email, password, phone, mentorId, advisorId } = req.body;

    if (!registerNumber || !email || !password) {
      return res.status(400).json({ success: false, message: 'Register Number, Institutional Email, and Password are required.' });
    }

    const regNo = registerNumber.trim().toUpperCase();
    const normalizedEmail = email.trim().toLowerCase();

    if (password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters.' });
    }

    const existingStudent = await prisma.user.findUnique({
      where: { registerNumber: regNo },
    });

    if (!existingStudent) {
      return res.status(404).json({
        success: false,
        status: 'NOT_FOUND',
        message: 'Register number not found in department master records. Please contact the EEE department.',
      });
    }

    if (existingStudent.isAccountSetup) {
      return res.status(400).json({
        success: false,
        status: 'ALREADY_ACTIVE',
        message: 'This register number is already linked to an active account. Please log in or use Forgot Password.',
      });
    }

    // Check if email belongs to another account
    const emailOwner = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (emailOwner && emailOwner.id !== existingStudent.id) {
      return res.status(400).json({
        success: false,
        message: 'This institutional email is already associated with another account.',
      });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const authUserId = `auth_${existingStudent.id}`;

    const updatedStudent = await prisma.user.update({
      where: { id: existingStudent.id },
      data: {
        email: normalizedEmail,
        passwordHash,
        phone: phone ? phone.trim() : existingStudent.phone,
        mentorId: mentorId || existingStudent.mentorId,
        advisorId: advisorId || existingStudent.advisorId,
        isAccountSetup: true,
        authUserId,
        isActive: true,
      },
      include: {
        mentor: { select: { id: true, name: true, email: true, phone: true } },
        advisor: { select: { id: true, name: true, email: true, phone: true } },
      },
    });

    const token = generateToken({
      userId: updatedStudent.id,
      email: updatedStudent.email,
      role: updatedStudent.role,
      department: updatedStudent.department,
      responsibilities: [],
    });

    await logAudit({
      userId: updatedStudent.id,
      userName: updatedStudent.name,
      action: 'STUDENT_ACCOUNT_LINKED',
      description: `Student ${updatedStudent.name} (${updatedStudent.registerNumber}) linked credentials and completed account setup.`,
      ipAddress: req.ip,
    });

    return res.status(200).json({
      success: true,
      message: `Account setup complete! Welcome ${updatedStudent.name}.`,
      token,
      user: {
        id: updatedStudent.id,
        name: updatedStudent.name,
        email: updatedStudent.email,
        role: updatedStudent.role,
        department: updatedStudent.department,
        year: updatedStudent.year,
        section: updatedStudent.section,
        registerNumber: updatedStudent.registerNumber,
        phone: updatedStudent.phone,
        mentorId: updatedStudent.mentorId,
        mentor: updatedStudent.mentor,
        advisorId: updatedStudent.advisorId,
        advisor: updatedStudent.advisor,
        isAccountSetup: true,
        responsibilities: [],
        advisorAssignments: [],
      },
    });
  } catch (error) {
    console.error('Complete setup error:', error);
    return res.status(500).json({ success: false, message: 'Server error during account setup.' });
  }
};

/**
 * Universal Registration Handler (Links existing pre-imported record or creates new record)
 */
export const register = async (req: Request, res: Response) => {
  try {
    const { name, email, password, year, section, registerNumber, phone, mentorId, advisorId } = req.body;

    if (!registerNumber || !email || !password) {
      return res.status(400).json({ success: false, message: 'Register Number, Institutional Email, and Password are required.' });
    }

    const regNo = registerNumber.trim().toUpperCase();
    const normalizedEmail = email.trim().toLowerCase();

    // Check if student already exists in pre-imported records
    const existingStudent = await prisma.user.findUnique({
      where: { registerNumber: regNo },
    });

    if (existingStudent) {
      // If not setup yet -> complete linking!
      if (!existingStudent.isAccountSetup) {
        return completeStudentSetup(req, res);
      }

      return res.status(400).json({
        success: false,
        status: 'ALREADY_ACTIVE',
        message: 'This register number is already linked to an active account. Please log in or use Forgot Password.',
      });
    }

    // Normal new student registration if not pre-imported
    if (!name) {
      return res.status(400).json({ success: false, message: 'Full name is required for new registration.' });
    }

    const existingEmail = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingEmail) {
      return res.status(400).json({ success: false, message: 'User with this email already exists.' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const assignedRole = 'STUDENT';

    const newUser = await prisma.user.create({
      data: {
        name: name.trim(),
        email: normalizedEmail,
        passwordHash,
        role: assignedRole,
        department: EEE_DEPARTMENT,
        year: year || 'I',
        section: section || 'A',
        registerNumber: regNo,
        rollNumber: regNo,
        phone: phone || null,
        mentorId: mentorId || null,
        advisorId: advisorId || null,
        isAccountSetup: true,
        isActive: true,
      },
      include: {
        mentor: { select: { id: true, name: true, email: true } },
        advisor: { select: { id: true, name: true, email: true } },
      },
    });

    const token = generateToken({
      userId: newUser.id,
      email: newUser.email,
      role: newUser.role,
      department: newUser.department,
      responsibilities: [],
    });

    await logAudit({
      userId: newUser.id,
      userName: newUser.name,
      action: 'USER_REGISTERED',
      description: `New student ${newUser.email} (${newUser.registerNumber}) registered for EEE Department.`,
      ipAddress: req.ip,
    });

    return res.status(201).json({
      success: true,
      message: 'Student account registered successfully.',
      token,
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        department: newUser.department,
        year: newUser.year,
        section: newUser.section,
        registerNumber: newUser.registerNumber,
        phone: newUser.phone,
        mentorId: newUser.mentorId,
        mentor: newUser.mentor,
        advisorId: newUser.advisorId,
        advisor: newUser.advisor,
        isAccountSetup: true,
        responsibilities: [],
        advisorAssignments: [],
      },
    });
  } catch (error) {
    console.error('Register error:', error);
    return res.status(500).json({ success: false, message: 'Server error during registration.' });
  }
};

/**
 * Forgot Password Lookup
 */
export const forgotPassword = async (req: Request, res: Response) => {
  try {
    const { identity } = req.body;
    if (!identity || !identity.trim()) {
      return res.status(400).json({ success: false, message: 'Please enter your Register Number or Email Address.' });
    }

    const term = identity.trim();
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: term.toLowerCase() },
          { registerNumber: term.toUpperCase() },
        ],
      },
    });

    if (!user) {
      return res.status(404).json({ success: false, message: 'No account found for the provided identifier.' });
    }

    return res.status(200).json({
      success: true,
      message: `Account found for ${user.name}. You may now reset your password.`,
      userId: user.id,
      name: user.name,
      email: user.email,
      registerNumber: user.registerNumber,
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    return res.status(500).json({ success: false, message: 'Server error during account verification.' });
  }
};

/**
 * Reset Password
 */
export const resetPassword = async (req: Request, res: Response) => {
  try {
    const { userId, newPassword } = req.body;

    if (!userId || !newPassword || newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'Valid user ID and new password (min 6 characters) are required.' });
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);
    const updated = await prisma.user.update({
      where: { id: userId },
      data: { passwordHash, isAccountSetup: true, isActive: true },
    });

    await logAudit({
      userId: updated.id,
      userName: updated.name,
      action: 'PASSWORD_RESET',
      description: `User ${updated.email} (${updated.registerNumber || 'Staff'}) reset password successfully.`,
      ipAddress: req.ip,
    });

    return res.status(200).json({
      success: true,
      message: 'Password reset successfully! Please sign in with your new credentials.',
    });
  } catch (error) {
    console.error('Reset password error:', error);
    return res.status(500).json({ success: false, message: 'Failed to reset password.' });
  }
};

export const getMe = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Not authenticated.' });
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      include: {
        staffResponsibilities: {
          where: { isActive: true },
        },
        advisorAssignments: {
          where: { isActive: true },
        },
        mentor: {
          select: { id: true, name: true, email: true, phone: true },
        },
        advisor: {
          select: { id: true, name: true, email: true, phone: true },
        },
      },
    });

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    const responsibilities = user.staffResponsibilities.map((r) => r.responsibility);
    if (['MENTOR', 'ADVISOR', 'HOD'].includes(user.role) && !responsibilities.includes(user.role)) {
      responsibilities.push(user.role);
    }

    return res.status(200).json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department || EEE_DEPARTMENT,
        year: user.year,
        section: user.section,
        registerNumber: user.registerNumber,
        rollNumber: user.rollNumber,
        phone: user.phone,
        profileImage: user.profileImage,
        mentorId: user.mentorId,
        mentor: user.mentor,
        advisorId: user.advisorId,
        advisor: user.advisor,
        mentorCapacity: user.mentorCapacity,
        responsibilities,
        advisorAssignments: user.advisorAssignments.map((a) => ({
          id: a.id,
          year: a.year,
          section: a.section,
        })),
        createdAt: user.createdAt,
      },
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
