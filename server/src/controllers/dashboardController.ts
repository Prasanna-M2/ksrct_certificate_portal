import { Response } from 'express';
import { prisma } from '../utils/prisma';
import { AuthenticatedRequest } from '../middleware/auth';

const EEE_DEPT = 'Electrical and Electronics Engineering';

export const getStudentDashboard = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const studentId = req.user.userId;

    const [
      totalCerts,
      approvedCerts,
      pendingCerts,
      rejectedCerts,
      totalOd,
      approvedOd,
      pendingOd,
      rejectedOd,
      recentCertificates,
      recentOdRequests,
      studentUser,
    ] = await Promise.all([
      prisma.certificate.count({ where: { studentId } }),
      prisma.certificate.count({ where: { studentId, status: 'APPROVED' } }),
      prisma.certificate.count({
        where: {
          studentId,
          status: { in: ['SUBMITTED', 'MENTOR_REVIEW', 'ADVISOR_REVIEW', 'HOD_REVIEW', 'RESUBMITTED'] },
        },
      }),
      prisma.certificate.count({ where: { studentId, status: 'REJECTED' } }),
      prisma.odRequest.count({ where: { studentId } }),
      prisma.odRequest.count({ where: { studentId, status: 'APPROVED' } }),
      prisma.odRequest.count({
        where: {
          studentId,
          status: { in: ['SUBMITTED', 'MENTOR_REVIEW', 'ADVISOR_REVIEW', 'HOD_REVIEW', 'RESUBMITTED'] },
        },
      }),
      prisma.odRequest.count({ where: { studentId, status: 'REJECTED' } }),
      prisma.certificate.findMany({
        where: { studentId },
        orderBy: { uploadedAt: 'desc' },
        take: 5,
      }),
      prisma.odRequest.findMany({
        where: { studentId },
        orderBy: { createdAt: 'desc' },
        take: 5,
      }),
      prisma.user.findUnique({
        where: { id: studentId },
        include: {
          mentor: { select: { id: true, name: true, email: true, phone: true } },
          advisor: { select: { id: true, name: true, email: true, phone: true } },
        },
      }),
    ]);

    return res.status(200).json({
      success: true,
      stats: {
        totalCertificates: totalCerts,
        approvedCertificates: approvedCerts,
        pendingCertificates: pendingCerts,
        rejectedCertificates: rejectedCerts,
        totalOd,
        approvedOd,
        pendingOd,
        rejectedOd,
      },
      academicSupport: {
        mentor: studentUser?.mentor,
        advisor: studentUser?.advisor,
      },
      recentCertificates,
      recentOdRequests,
    });
  } catch (error) {
    console.error('Student dashboard error:', error);
    return res.status(500).json({ success: false, message: 'Failed to load student dashboard metrics.' });
  }
};

/**
 * Unified Staff Dashboard endpoint providing scoped metrics for MENTOR, ADVISOR, and HOD
 */
export const getStaffDashboard = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const userId = req.user.userId;
    const responsibilities = req.user.responsibilities || [];
    const isHod = responsibilities.includes('HOD') || req.user.role === 'HOD';
    const isAdvisor = responsibilities.includes('ADVISOR') || req.user.role === 'ADVISOR';
    const isMentor = responsibilities.includes('MENTOR') || req.user.role === 'MENTOR';
    const advisoryYears = req.user.advisoryYears || [];

    // 1. Mentor Scope Metrics
    let mentorStats = null;
    if (isMentor) {
      const [
        totalMentees,
        pendingMentorCerts,
        pendingMentorOd,
        approvedMenteesCerts,
        rejectedMenteesCerts,
        mentees,
      ] = await Promise.all([
        prisma.user.count({ where: { mentorId: userId, isActive: true } }),
        prisma.certificate.count({
          where: {
            student: { mentorId: userId },
            currentStage: 'MENTOR_REVIEW',
            status: { not: 'REJECTED' },
          },
        }),
        prisma.odRequest.count({
          where: {
            student: { mentorId: userId },
            currentStage: 'MENTOR_REVIEW',
            status: { not: 'REJECTED' },
          },
        }),
        prisma.certificate.count({
          where: { student: { mentorId: userId }, status: 'APPROVED' },
        }),
        prisma.certificate.count({
          where: { student: { mentorId: userId }, status: 'REJECTED' },
        }),
        prisma.user.findMany({
          where: { mentorId: userId, isActive: true },
          select: {
            id: true,
            name: true,
            registerNumber: true,
            year: true,
            section: true,
            _count: { select: { certificates: true, odRequests: true } },
          },
        }),
      ]);

      mentorStats = {
        totalMentees,
        pendingApprovals: pendingMentorCerts + pendingMentorOd,
        pendingCertificates: pendingMentorCerts,
        pendingOd: pendingMentorOd,
        approvedCertificates: approvedMenteesCerts,
        rejectedCertificates: rejectedMenteesCerts,
        mentees,
      };
    }

    // 2. Advisor Scope Metrics
    let advisorStats = null;
    if (isAdvisor) {
      const classWhere = {
        OR: [
          { advisorId: userId },
          { year: { in: advisoryYears } },
        ],
        department: EEE_DEPT,
        isActive: true,
      };

      const [
        totalClassStudents,
        pendingAdvisorCerts,
        pendingAdvisorOd,
        approvedClassCerts,
        rejectedClassCerts,
      ] = await Promise.all([
        prisma.user.count({ where: classWhere }),
        prisma.certificate.count({
          where: {
            student: classWhere,
            currentStage: 'ADVISOR_REVIEW',
            status: { not: 'REJECTED' },
          },
        }),
        prisma.odRequest.count({
          where: {
            student: classWhere,
            currentStage: 'ADVISOR_REVIEW',
            status: { not: 'REJECTED' },
          },
        }),
        prisma.certificate.count({
          where: { student: classWhere, status: 'APPROVED' },
        }),
        prisma.certificate.count({
          where: { student: classWhere, status: 'REJECTED' },
        }),
      ]);

      advisorStats = {
        advisoryYears,
        totalClassStudents,
        pendingApprovals: pendingAdvisorCerts + pendingAdvisorOd,
        pendingCertificates: pendingAdvisorCerts,
        pendingOd: pendingAdvisorOd,
        approvedCertificates: approvedClassCerts,
        rejectedCertificates: rejectedClassCerts,
      };
    }

    // 3. HOD Scope Metrics
    let hodStats = null;
    if (isHod || req.user.role === 'CREATOR' || req.user.role === 'ADMIN') {
      const deptWhere = { department: EEE_DEPT };

      const [
        totalStudents,
        year1Count,
        year2Count,
        year3Count,
        year4Count,
        pendingHodCerts,
        pendingHodOd,
        totalApprovedCerts,
        totalApprovedOd,
        totalRejectedRequests,
      ] = await Promise.all([
        prisma.user.count({ where: { role: 'STUDENT', ...deptWhere } }),
        prisma.user.count({ where: { role: 'STUDENT', year: 'I', ...deptWhere } }),
        prisma.user.count({ where: { role: 'STUDENT', year: 'II', ...deptWhere } }),
        prisma.user.count({ where: { role: 'STUDENT', year: 'III', ...deptWhere } }),
        prisma.user.count({ where: { role: 'STUDENT', year: 'IV', ...deptWhere } }),
        prisma.certificate.count({ where: { currentStage: 'HOD_REVIEW', status: { not: 'REJECTED' } } }),
        prisma.odRequest.count({ where: { currentStage: 'HOD_REVIEW', status: { not: 'REJECTED' } } }),
        prisma.certificate.count({ where: { status: 'APPROVED' } }),
        prisma.odRequest.count({ where: { status: 'APPROVED' } }),
        prisma.certificate.count({ where: { status: 'REJECTED' } }),
      ]);

      hodStats = {
        totalStudents,
        yearDistribution: {
          year1: year1Count,
          year2: year2Count,
          year3: year3Count,
          year4: year4Count,
        },
        pendingApprovals: pendingHodCerts + pendingHodOd,
        pendingCertificates: pendingHodCerts,
        pendingOd: pendingHodOd,
        approvedCertificates: totalApprovedCerts,
        approvedOd: totalApprovedOd,
        rejectedRequests: totalRejectedRequests,
      };
    }

    // Recent activities & pending approval queues
    const pendingCertificates = await prisma.certificate.findMany({
      where: {
        status: { in: ['SUBMITTED', 'MENTOR_REVIEW', 'ADVISOR_REVIEW', 'HOD_REVIEW', 'RESUBMITTED'] },
      },
      include: {
        student: { select: { id: true, name: true, registerNumber: true, year: true, section: true, mentorId: true, advisorId: true } },
      },
      orderBy: { uploadedAt: 'desc' },
      take: 10,
    });

    const pendingOdRequests = await prisma.odRequest.findMany({
      where: {
        status: { in: ['SUBMITTED', 'MENTOR_REVIEW', 'ADVISOR_REVIEW', 'HOD_REVIEW', 'RESUBMITTED'] },
      },
      include: {
        student: { select: { id: true, name: true, registerNumber: true, year: true, section: true, mentorId: true, advisorId: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    return res.status(200).json({
      success: true,
      responsibilities,
      mentorStats,
      advisorStats,
      hodStats,
      pendingCertificates,
      pendingOdRequests,
    });
  } catch (error) {
    console.error('Staff dashboard error:', error);
    return res.status(500).json({ success: false, message: 'Failed to load staff dashboard metrics.' });
  }
};

export const getCreatorDashboard = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const [
      totalUsers,
      totalStudents,
      totalStaff,
      totalCertificates,
      pendingCertificates,
      approvedCertificates,
      rejectedCertificates,
      totalOd,
      pendingOd,
      approvedOd,
      rejectedOd,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { role: 'STUDENT' } }),
      prisma.user.count({ where: { role: 'STAFF' } }),
      prisma.certificate.count(),
      prisma.certificate.count({ where: { status: { in: ['SUBMITTED', 'MENTOR_REVIEW', 'ADVISOR_REVIEW', 'HOD_REVIEW', 'RESUBMITTED'] } } }),
      prisma.certificate.count({ where: { status: 'APPROVED' } }),
      prisma.certificate.count({ where: { status: 'REJECTED' } }),
      prisma.odRequest.count(),
      prisma.odRequest.count({ where: { status: { in: ['SUBMITTED', 'MENTOR_REVIEW', 'ADVISOR_REVIEW', 'HOD_REVIEW', 'RESUBMITTED'] } } }),
      prisma.odRequest.count({ where: { status: 'APPROVED' } }),
      prisma.odRequest.count({ where: { status: 'REJECTED' } }),
    ]);

    const recentLogs = await prisma.auditLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 15,
    });

    return res.status(200).json({
      success: true,
      stats: {
        totalUsers,
        totalStudents,
        totalStaff,
        totalCertificates,
        pendingCertificates,
        approvedCertificates,
        rejectedCertificates,
        totalOd,
        pendingOd,
        approvedOd,
        rejectedOd,
      },
      recentLogs,
    });
  } catch (error) {
    console.error('Creator dashboard error:', error);
    return res.status(500).json({ success: false, message: 'Failed to load Creator dashboard.' });
  }
};

export const getHodDashboard = getStaffDashboard;
export const getCoordinatorDashboard = getStaffDashboard;
export const getAdminDashboard = getCreatorDashboard;
