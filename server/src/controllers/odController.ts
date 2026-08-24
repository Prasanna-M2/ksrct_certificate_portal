import { Response } from 'express';
import path from 'path';
import fs from 'fs';
import { prisma } from '../utils/prisma';
import { AuthenticatedRequest } from '../middleware/auth';
import { logAudit } from '../utils/auditLogger';
import { calculateApprovalTransition, getFallbackStaff } from '../utils/approvalWorkflow';

const EEE_DEPT = 'Electrical and Electronics Engineering';

// Helper to generate OD ID e.g. OD-2026-0001
const generateOdId = async (): Promise<string> => {
  const year = new Date().getFullYear();
  const count = await prisma.odRequest.count();
  const sequence = String(count + 1).padStart(4, '0');
  return `OD-${year}-${sequence}`;
};

export const createOdRequest = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const {
      eventName,
      eventType,
      organization,
      venue,
      odDate,
      startTime,
      endTime,
      numberOfDays,
      purpose,
      description,
      coordinator,
      requestType = 'EVENT_OD',
    } = req.body;

    if (!eventName || (!odDate && !req.body.startDate) || !purpose) {
      return res.status(400).json({ success: false, message: 'Event name, OD date, and purpose are required.' });
    }

    const student = await prisma.user.findUnique({
      where: { id: req.user.userId },
      include: { mentor: true, advisor: true },
    });

    if (!student) {
      return res.status(404).json({ success: false, message: 'Student account not found.' });
    }

    const odId = await generateOdId();
    let attachmentName: string | undefined;
    let attachmentPath: string | undefined;

    if (req.file) {
      attachmentName = req.file.originalname;
      attachmentPath = `/uploads/certificates/${req.file.filename}`;
    }

    const newOd = await prisma.odRequest.create({
      data: {
        odId,
        requestType,
        studentId: student.id,
        studentName: student.name,
        registerNumber: student.registerNumber || 'N/A',
        rollNumber: student.rollNumber || student.registerNumber || 'N/A',
        department: EEE_DEPT,
        year: student.year || 'III',
        section: student.section || 'A',
        semester: student.semester || 'V',
        stayType: student.stayType || 'DAY_SCHOLAR',
        eventName: eventName || req.body.reason,
        eventType: eventType || 'Technical',
        organization: organization || req.body.organizingBody || 'N/A',
        venue: venue || req.body.eventPlace || 'College Campus',
        odDate: odDate || req.body.startDate,
        startTime: startTime || '09:00 AM',
        endTime: endTime || '05:00 PM',
        numberOfDays: parseInt(numberOfDays as string, 10) || 1,
        purpose,
        description: description || req.body.reason || null,
        coordinator: coordinator || null,
        supportingFile: attachmentPath,
        attachmentName,
        attachmentPath,
        status: 'SUBMITTED',
        currentStage: 'MENTOR_REVIEW',
        mentorId: student.mentorId,
        advisorId: student.advisorId,
      },
    });

    // Create Audit Log
    await logAudit({
      userId: student.id,
      userName: student.name,
      userRole: student.role,
      requestType: 'OD',
      requestId: odId,
      action: 'OD_SUBMITTED',
      previousStatus: 'DRAFT',
      newStatus: 'MENTOR_REVIEW',
      description: `Student ${student.name} submitted OD request ${odId} for ${eventName}`,
      ipAddress: req.ip,
    });

    // Create Initial Approval record
    await prisma.approval.create({
      data: {
        requestType: 'OD',
        requestId: newOd.id,
        approverId: student.id,
        approverName: student.name,
        approverRole: 'STUDENT',
        action: 'SUBMITTED',
        previousStatus: 'DRAFT',
        newStatus: 'MENTOR_REVIEW',
        remarks: 'Initial Submission',
      },
    });

    // Notify Mentor
    const mentorId = student.mentorId;
    if (mentorId) {
      await prisma.notification.create({
        data: {
          userId: mentorId,
          title: 'New OD Request Awaiting Review',
          message: `OD Application ${odId} submitted by ${student.name} (${student.registerNumber || 'Student'}) is awaiting your mentor review.`,
          requestType: 'OD',
          requestId: newOd.id,
        },
      });
    }

    return res.status(201).json({
      success: true,
      message: `OD request ${odId} submitted successfully and forwarded to Mentor for review.`,
      odRequest: newOd,
    });
  } catch (error) {
    console.error('Create OD error:', error);
    return res.status(500).json({ success: false, message: 'Failed to submit OD application.' });
  }
};

export const getOdRequests = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const { status, stage, requestType, studentId, search, page = '1', limit = '50' } = req.query;
    const userRole = req.user.role;
    const responsibilities = req.user.responsibilities || [];
    const userId = req.user.userId;

    const whereClause: any = {
      department: EEE_DEPT,
    };

    // Scoping
    if (userRole === 'STUDENT') {
      whereClause.studentId = userId;
    } else if (userRole === 'STAFF' || userRole === 'MENTOR' || userRole === 'ADVISOR') {
      const isHod = responsibilities.includes('HOD') || (userRole as string) === 'HOD';
      const isAdvisor = responsibilities.includes('ADVISOR') || (userRole as string) === 'ADVISOR';
      const isMentor = responsibilities.includes('MENTOR') || (userRole as string) === 'MENTOR';

      if (isHod) {
        // HOD sees all EEE
      } else if (isMentor && !isAdvisor) {
        whereClause.mentorId = userId;
      } else if (isAdvisor && !isMentor) {
        const assignedYears = req.user.advisoryYears || [];
        whereClause.OR = [
          { advisorId: userId },
          { year: { in: assignedYears } },
        ];
      } else if (isMentor && isAdvisor) {
        const assignedYears = req.user.advisoryYears || [];
        whereClause.OR = [
          { mentorId: userId },
          { advisorId: userId },
          { year: { in: assignedYears } },
        ];
      }
    }

    if (status && typeof status === 'string' && status !== 'ALL') {
      whereClause.status = status;
    }

    if (stage && typeof stage === 'string' && stage !== 'ALL') {
      whereClause.currentStage = stage;
    }

    if (requestType && typeof requestType === 'string' && requestType !== 'ALL') {
      whereClause.requestType = requestType;
    }

    if (studentId && typeof studentId === 'string') {
      whereClause.studentId = studentId;
    }

    if (search && typeof search === 'string' && search.trim() !== '') {
      const query = search.trim();
      whereClause.OR = [
        { eventName: { contains: query } },
        { odId: { contains: query } },
        { organization: { contains: query } },
        { studentName: { contains: query } },
        { registerNumber: { contains: query } },
      ];
    }

    const pageNum = parseInt(page as string, 10) || 1;
    const limitNum = parseInt(limit as string, 10) || 50;
    const skip = (pageNum - 1) * limitNum;

    const [odRequests, total] = await Promise.all([
      prisma.odRequest.findMany({
        where: whereClause,
        include: {
          student: {
            select: { id: true, name: true, registerNumber: true, email: true, year: true, section: true, phone: true, mentorId: true, advisorId: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limitNum,
      }),
      prisma.odRequest.count({ where: whereClause }),
    ]);

    return res.status(200).json({
      success: true,
      odRequests,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    console.error('Get OD error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch OD requests.' });
  }
};

export const getOdById = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const { id } = req.params;

    const odRequest = await prisma.odRequest.findFirst({
      where: {
        OR: [{ id }, { odId: id }],
      },
      include: {
        student: {
          select: { id: true, name: true, registerNumber: true, email: true, department: true, year: true, section: true, phone: true, mentorId: true, advisorId: true },
        },
      },
    });

    if (!odRequest) {
      return res.status(404).json({ success: false, message: 'OD request not found.' });
    }

    // Security checks
    if (req.user.role === 'STUDENT' && odRequest.studentId !== req.user.userId) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    const approvals = await prisma.approval.findMany({
      where: { requestId: odRequest.id },
      include: {
        approver: { select: { id: true, name: true, role: true } },
      },
      orderBy: { actionDate: 'asc' },
    });

    const auditLogs = await prisma.auditLog.findMany({
      where: { requestId: odRequest.odId || odRequest.id },
      orderBy: { createdAt: 'desc' },
    });

    return res.status(200).json({
      success: true,
      odRequest,
      approvals,
      auditLogs,
    });
  } catch (error) {
    console.error('Get OD by ID error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch OD request details.' });
  }
};

/**
 * Approve OD Request with Dynamic Deduplication
 */
export const approveOd = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const { id } = req.params;
    const { remarks } = req.body;

    const odRequest = await prisma.odRequest.findUnique({
      where: { id },
      include: { student: true },
    });

    if (!odRequest) {
      return res.status(404).json({ success: false, message: 'OD request not found.' });
    }

    if (odRequest.status === 'APPROVED' || odRequest.currentStage === 'COMPLETED') {
      return res.status(400).json({ success: false, message: 'OD Request is already fully approved.' });
    }

    // Calculate dynamic transition
    const transition = await calculateApprovalTransition(
      odRequest.studentId,
      odRequest.currentStage,
      req.user.userId,
      req.user.role,
      req.user.responsibilities || []
    );

    const { nextStage, nextStatus, isFinalApproval, exercisedRoles, nextApproverId } = transition;
    const primaryRole = exercisedRoles[0] || req.user.role;

    const updateData: any = {
      currentStage: nextStage,
      status: nextStatus,
    };

    if (exercisedRoles.includes('MENTOR')) {
      updateData.mentorRemarks = remarks || 'Approved by Mentor';
    }
    if (exercisedRoles.includes('ADVISOR')) {
      updateData.advisorRemarks = remarks || 'Approved by Class Advisor';
    }
    if (exercisedRoles.includes('HOD') || isFinalApproval) {
      updateData.hodRemarks = remarks || 'Approved by HOD';
    }

    await prisma.odRequest.update({
      where: { id },
      data: updateData,
    });

    await prisma.approval.create({
      data: {
        requestType: 'OD',
        requestId: odRequest.id,
        approverId: req.user.userId,
        approverName: req.user.name,
        approverRole: primaryRole,
        action: 'APPROVED',
        previousStatus: odRequest.status,
        newStatus: nextStatus,
        remarks: remarks || `Approved by ${exercisedRoles.join(' & ')}`,
      },
    });

    await logAudit({
      userId: req.user.userId,
      userName: req.user.name,
      userRole: primaryRole,
      requestType: 'OD',
      requestId: odRequest.odId || odRequest.id,
      action: isFinalApproval ? 'HOD_APPROVED' : `${primaryRole}_APPROVED`,
      previousStatus: odRequest.status,
      newStatus: nextStatus,
      remarks: remarks || `Approved as ${exercisedRoles.join(' & ')}`,
      description: `Staff ${req.user.name} approved OD ${odRequest.odId} exercising roles [${exercisedRoles.join(', ')}]`,
      ipAddress: req.ip,
    });

    // Notify Student
    let studentMsg = '';
    if (isFinalApproval) {
      studentMsg = `Your OD Request ${odRequest.odId} has been officially approved by HOD.`;
    } else if (nextStage === 'ADVISOR_REVIEW') {
      studentMsg = `Your OD Request ${odRequest.odId} has been approved by your Mentor and forwarded to your Advisor.`;
    } else if (nextStage === 'HOD_REVIEW') {
      studentMsg = `Your OD Request ${odRequest.odId} has been approved by your Advisor and forwarded to HOD.`;
    }

    await prisma.notification.create({
      data: {
        userId: odRequest.studentId,
        title: isFinalApproval ? 'OD Request Approved!' : 'OD Workflow Advanced',
        message: studentMsg,
        type: isFinalApproval ? 'SUCCESS' : 'INFO',
        requestType: 'OD',
        requestId: odRequest.id,
      },
    });

    // Notify next approver
    if (nextApproverId && !isFinalApproval) {
      await prisma.notification.create({
        data: {
          userId: nextApproverId,
          title: `OD Request Awaiting ${nextStage === 'HOD_REVIEW' ? 'HOD' : 'Advisor'} Review`,
          message: `OD Request ${odRequest.odId} from ${odRequest.studentName} is awaiting your review.`,
          requestType: 'OD',
          requestId: odRequest.id,
        },
      });
    }

    return res.status(200).json({
      success: true,
      message: isFinalApproval ? `OD Request ${odRequest.odId} fully approved!` : `OD Request approved and advanced to ${nextStage}.`,
      currentStage: nextStage,
      status: nextStatus,
    });
  } catch (error: any) {
    console.error('Approve OD error:', error);
    return res.status(400).json({ success: false, message: error.message || 'Failed to approve OD request.' });
  }
};

/**
 * Reject OD Request with Mandatory Reason
 */
export const rejectOd = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const { id } = req.params;
    const { remarks, reason } = req.body;
    const rejectionReason = (remarks || reason || '').trim();

    if (!rejectionReason) {
      return res.status(400).json({ success: false, message: 'Rejection reason is mandatory.' });
    }

    const odRequest = await prisma.odRequest.findUnique({
      where: { id },
      include: { student: true },
    });

    if (!odRequest) {
      return res.status(404).json({ success: false, message: 'OD request not found.' });
    }

    await prisma.odRequest.update({
      where: { id },
      data: {
        status: 'REJECTED',
        rejectionReason,
        rejectedByRole: req.user.role,
        rejectedByName: req.user.name,
      },
    });

    await prisma.approval.create({
      data: {
        requestType: 'OD',
        requestId: odRequest.id,
        approverId: req.user.userId,
        approverName: req.user.name,
        approverRole: req.user.role,
        action: 'REJECTED',
        previousStatus: odRequest.status,
        newStatus: 'REJECTED',
        remarks: rejectionReason,
      },
    });

    await logAudit({
      userId: req.user.userId,
      userName: req.user.name,
      userRole: req.user.role,
      requestType: 'OD',
      requestId: odRequest.odId || odRequest.id,
      action: 'OD_REJECTED',
      previousStatus: odRequest.status,
      newStatus: 'REJECTED',
      remarks: rejectionReason,
      description: `OD ${odRequest.odId} rejected by ${req.user.name} (${req.user.role}). Reason: ${rejectionReason}`,
      ipAddress: req.ip,
    });

    // Notify Student
    await prisma.notification.create({
      data: {
        userId: odRequest.studentId,
        title: 'OD Request Rejected',
        message: `Your OD Request ${odRequest.odId} was rejected by ${req.user.role} (${req.user.name}). Reason: ${rejectionReason}`,
        requestType: 'OD',
        requestId: odRequest.id,
        type: 'ERROR',
      },
    });

    return res.status(200).json({
      success: true,
      message: 'OD request rejected successfully with remarks.',
    });
  } catch (error) {
    console.error('Reject OD error:', error);
    return res.status(500).json({ success: false, message: 'Failed to reject OD request.' });
  }
};

/**
 * Resubmit OD Request (Restarts at Mentor stage)
 */
export const resubmitOd = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const { id } = req.params;
    const { eventName, eventType, organization, venue, odDate, startTime, endTime, numberOfDays, purpose, description, coordinator } = req.body;

    const odRequest = await prisma.odRequest.findUnique({
      where: { id },
      include: { student: true },
    });

    if (!odRequest) {
      return res.status(404).json({ success: false, message: 'OD request not found.' });
    }

    if (odRequest.studentId !== req.user.userId) {
      return res.status(403).json({ success: false, message: 'You can only resubmit your own OD requests.' });
    }

    let attachmentPath = odRequest.attachmentPath;
    let attachmentName = odRequest.attachmentName;

    if (req.file) {
      attachmentName = req.file.originalname;
      attachmentPath = `/uploads/certificates/${req.file.filename}`;
    }

    const updatedOd = await prisma.odRequest.update({
      where: { id },
      data: {
        eventName: eventName || odRequest.eventName,
        eventType: eventType || odRequest.eventType,
        organization: organization || odRequest.organization,
        venue: venue || odRequest.venue,
        odDate: odDate || odRequest.odDate,
        startTime: startTime || odRequest.startTime,
        endTime: endTime || odRequest.endTime,
        numberOfDays: numberOfDays ? parseInt(numberOfDays as string, 10) : odRequest.numberOfDays,
        purpose: purpose || odRequest.purpose,
        description: description !== undefined ? description : odRequest.description,
        coordinator: coordinator || odRequest.coordinator,
        attachmentPath,
        attachmentName,
        supportingFile: attachmentPath,
        status: 'RESUBMITTED',
        currentStage: 'MENTOR_REVIEW',
        rejectionReason: null,
      },
    });

    await prisma.approval.create({
      data: {
        requestType: 'OD',
        requestId: odRequest.id,
        approverId: req.user.userId,
        approverName: req.user.name,
        approverRole: 'STUDENT',
        action: 'RESUBMITTED',
        previousStatus: 'REJECTED',
        newStatus: 'MENTOR_REVIEW',
        remarks: 'Student edited OD details and resubmitted request.',
      },
    });

    await logAudit({
      userId: req.user.userId,
      userName: req.user.name,
      userRole: req.user.role,
      requestType: 'OD',
      requestId: odRequest.odId || odRequest.id,
      action: 'OD_RESUBMITTED',
      previousStatus: 'REJECTED',
      newStatus: 'MENTOR_REVIEW',
      description: `Student resubmitted OD request ${odRequest.odId}. Approval workflow restarted at Mentor stage.`,
      ipAddress: req.ip,
    });

    // Notify Mentor
    const mentorId = odRequest.mentorId || odRequest.student.mentorId;
    if (mentorId) {
      await prisma.notification.create({
        data: {
          userId: mentorId,
          title: 'Resubmitted OD Request Pending Review',
          message: `OD request ${odRequest.odId} has been resubmitted by ${odRequest.studentName} and is awaiting your mentor review.`,
          requestType: 'OD',
          requestId: odRequest.id,
        },
      });
    }

    return res.status(200).json({
      success: true,
      message: 'OD request resubmitted successfully. Approval workflow restarted at Mentor stage.',
      odRequest: updatedOd,
    });
  } catch (error) {
    console.error('Resubmit OD error:', error);
    return res.status(500).json({ success: false, message: 'Failed to resubmit OD request.' });
  }
};

export const deleteOdRequest = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const { id } = req.params;
    const odRequest = await prisma.odRequest.findFirst({
      where: { OR: [{ id }, { odId: id }] },
    });

    if (!odRequest) {
      return res.status(404).json({ success: false, message: 'OD request not found.' });
    }

    const isOwner = req.user.role === 'STUDENT' && odRequest.studentId === req.user.userId;
    const isCreator = req.user.role === 'CREATOR' || req.user.role === 'ADMIN';

    if (!isOwner && !isCreator) {
      return res.status(403).json({ success: false, message: 'Only the student owner or Creator can delete this request.' });
    }

    if (odRequest.status === 'APPROVED' && !isCreator) {
      return res.status(400).json({ success: false, message: 'Approved OD requests cannot be deleted by students.' });
    }

    await prisma.odRequest.delete({ where: { id: odRequest.id } });

    return res.status(200).json({ success: true, message: 'OD request deleted successfully.' });
  } catch (error) {
    console.error('Delete OD error:', error);
    return res.status(500).json({ success: false, message: 'Failed to delete OD request.' });
  }
};

export const getOdFile = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const { id } = req.params;
    const odRequest = await prisma.odRequest.findFirst({
      where: { OR: [{ id }, { odId: id }] },
      include: { student: true },
    });

    if (!odRequest) {
      return res.status(404).json({ success: false, message: 'OD request not found.' });
    }

    const filePathRaw = odRequest.attachmentPath || odRequest.supportingFile;
    if (!filePathRaw) {
      return res.status(404).json({ success: false, message: 'No file attachment found for this OD request.' });
    }

    const fileName = path.basename(filePathRaw);
    const resolvedPath = path.join(__dirname, '../../../uploads/certificates', fileName);

    if (!fs.existsSync(resolvedPath)) {
      return res.status(404).json({ success: false, message: 'Physical file not found on server.' });
    }

    return res.sendFile(resolvedPath);
  } catch (error) {
    console.error('Get OD file error:', error);
    return res.status(500).json({ success: false, message: 'Failed to retrieve OD file.' });
  }
};

export const getOdRequestById = getOdById;
export const approveOdRequest = approveOd;
export const rejectOdRequest = rejectOd;
export const resubmitOdRequest = resubmitOd;

