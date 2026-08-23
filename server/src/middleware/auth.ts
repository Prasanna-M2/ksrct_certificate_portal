import { Request, Response, NextFunction } from 'express';
import { verifyToken, TokenPayload } from '../utils/jwt';
import { prisma } from '../utils/prisma';
import { hasPermission, Permission } from '../utils/permissions';

export interface AuthenticatedRequest extends Request {
  user?: TokenPayload & {
    name?: string;
    responsibilities?: string[];
    advisoryYears?: string[];
    mentorCapacity?: number;
  };
}

export const authenticate = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    let token = '';

    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    } else if (req.query && req.query.token && typeof req.query.token === 'string') {
      token = req.query.token;
    } else if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }

    if (!token) {
      return res.status(401).json({ success: false, message: 'Authentication required. No token provided.' });
    }

    const payload = verifyToken(token);
    
    // Verify user exists and is active in database, fetch staff responsibilities & advisor assignments
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      include: {
        staffResponsibilities: {
          where: { isActive: true },
        },
        advisorAssignments: {
          where: { isActive: true },
        },
      },
    });

    if (!user || !user.isActive) {
      return res.status(401).json({ success: false, message: 'User account is inactive or no longer exists.' });
    }

    const responsibilities = user.staffResponsibilities.map((r) => r.responsibility);
    
    // Legacy fallback: if role is MENTOR, ADVISOR, or HOD and not in responsibilities, include it
    if (['MENTOR', 'ADVISOR', 'HOD'].includes(user.role) && !responsibilities.includes(user.role)) {
      responsibilities.push(user.role);
    }

    const advisoryYears = user.advisorAssignments.map((a) => a.year);

    req.user = {
      userId: user.id,
      email: user.email,
      role: user.role,
      department: user.department,
      name: user.name,
      responsibilities,
      advisoryYears,
      mentorCapacity: user.mentorCapacity,
    };

    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Invalid or expired token.' });
  }
};

export const authorize = (allowedRoles: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required.' });
    }

    // Allow if user's main role is in allowedRoles, or if user is CREATOR / ADMIN
    if (allowedRoles.includes(req.user.role) || req.user.role === 'CREATOR' || req.user.role === 'ADMIN') {
      return next();
    }

    // If STAFF role is allowed, and user is STAFF
    if (allowedRoles.includes('STAFF') && req.user.role === 'STAFF') {
      return next();
    }

    // If allowedRoles specifies MENTOR, ADVISOR, or HOD, check staff responsibilities
    const userResponsibilities = req.user.responsibilities || [];
    const hasAllowedResponsibility = allowedRoles.some((r) => userResponsibilities.includes(r));
    if (hasAllowedResponsibility) {
      return next();
    }

    return res.status(403).json({
      success: false,
      message: `Access denied. Role ${req.user.role} (${userResponsibilities.join(', ') || 'No responsibilities'}) is not authorized for this resource.`,
    });
  };
};

export const requireResponsibility = (requiredResponsibilities: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required.' });
    }

    if (req.user.role === 'CREATOR' || req.user.role === 'ADMIN') {
      return next();
    }

    const userResponsibilities = req.user.responsibilities || [];
    const hasMatch = requiredResponsibilities.some(
      (r) => userResponsibilities.includes(r) || req.user?.role === r
    );

    if (!hasMatch) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Requires one of the following responsibilities: ${requiredResponsibilities.join(', ')}`,
      });
    }

    next();
  };
};

export const requirePermission = (permission: Permission) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required.' });
    }

    if (!hasPermission(req.user.role, permission)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Role ${req.user.role} lacks required permission: ${permission}`,
      });
    }

    next();
  };
};
