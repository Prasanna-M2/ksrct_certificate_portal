import { Response } from 'express';
import path from 'path';
import fs from 'fs';
import { prisma } from '../utils/prisma';
import { AuthenticatedRequest } from '../middleware/auth';
import { logAudit } from '../utils/auditLogger';
import { calculateApprovalTransition, getActiveHod } from '../utils/approvalWorkflow';

const EEE_DEPT = 'Electrical and Electronics Engineering';

// Helper to generate CERT ID e.g. CERT-2026-0001
const generateCertificateId = async (): Promise<string> => {
  const year = new Date().getFullYear();
  const count = await prisma.certificate.count();
  const sequence = String(count + 1).padStart(4, '0');
  return `CERT-${year}-${sequence}`;
};

export const uploadCertificate = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const files = req.files as { [fieldname: string]: Express.Multer.File[] } | undefined;
    const primaryFile = files?.file?.[0] || req.file;

    if (!primaryFile) {
      return res.status(400).json({ success: false, message: 'Please select a certificate file to upload.' });
    }

    const { title, category, eventName, organization, eventDate, issuedDate, description } = req.body;

    if (!title || !category || (!issuedDate && !eventDate)) {
      if (primaryFile && fs.existsSync(primaryFile.path)) {
        fs.unlinkSync(primaryFile.path);
      }
      return res.status(400).json({ success: false, message: 'Title, category, and issue/event date are required.' });
    }

    const certificateId = await generateCertificateId();
    const relativeFilePath = `/uploads/certificates/${primaryFile.filename}`;
    
    let relativeSupportingPath: string | null = null;
    if (files?.supportingFile?.[0]) {
      relativeSupportingPath = `/uploads/certificates/${files.supportingFile[0].filename}`;
    }

    const student = await prisma.user.findUnique({
      where: { id: req.user.userId },
      include: { mentor: true, advisor: true },
    });

    if (!student) {
      return res.status(404).json({ success: false, message: 'Student user not found.' });
    }

    const certificate = await prisma.certificate.create({
      data: {
        certificateId,
        studentId: req.user.userId,
        title,
        category,
        eventName: eventName || title,
        organization: organization || 'N/A',
        eventDate: eventDate || issuedDate,
        issuedDate: issuedDate || eventDate,
        description: description || null,
        fileName: primaryFile.filename,
        filePath: relativeFilePath,
        fileType: primaryFile.mimetype,
        fileSize: primaryFile.size,
        supportingFile: relativeSupportingPath,
        status: 'SUBMITTED',
        currentStage: 'MENTOR_REVIEW',
      },
      include: {
        student: {
          select: { id: true, name: true, registerNumber: true, department: true, year: true, section: true, mentorId: true, advisorId: true },
        },
      },
    });

    // Create Audit Log
    await logAudit({
      userId: req.user.userId,
      userName: req.user.name,
      userRole: req.user.role,
      requestType: 'CERTIFICATE',
      requestId: certificateId,
      action: 'CERTIFICATE_SUBMITTED',
      previousStatus: 'DRAFT',
      newStatus: 'MENTOR_REVIEW',
      description: `Student ${student.name} submitted Certificate "${certificate.title}" (${certificateId})`,
      ipAddress: req.ip,
    });

    // Create Initial Approval record
    await prisma.approval.create({
      data: {
        requestType: 'CERTIFICATE',
        requestId: certificate.id,
        approverId: req.user.userId,
        approverName: req.user.name,
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
          title: 'New Certificate Awaiting Mentor Review',
          message: `Certificate ${certificateId} submitted by ${student.name} (${student.registerNumber || 'Student'}) is awaiting your review.`,
          requestType: 'CERTIFICATE',
          requestId: certificate.id,
        },
      });
    } else {
      // Notify all EEE mentors
      const mentors = await prisma.user.findMany({
        where: {
          department: EEE_DEPT,
          isActive: true,
          OR: [
            { role: 'MENTOR' },
            { staffResponsibilities: { some: { responsibility: 'MENTOR', isActive: true } } },
          ],
        },
      });
      for (const mentor of mentors) {
        await prisma.notification.create({
          data: {
            userId: mentor.id,
            title: 'New Certificate Awaiting Review',
            message: `Certificate ${certificateId} submitted by ${student.name} (${student.registerNumber || 'Student'}) requires mentor review.`,
            requestType: 'CERTIFICATE',
            requestId: certificate.id,
          },
        });
      }
    }

    return res.status(201).json({
      success: true,
      message: `Certificate ${certificateId} submitted successfully and forwarded to Mentor for review.`,
      certificate,
    });
  } catch (error) {
    console.error('Upload certificate error:', error);
    return res.status(500).json({ success: false, message: 'Failed to upload certificate.' });
  }
};

export const getCertificates = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const { status, stage, category, studentId, search, page = '1', limit = '50' } = req.query;
    const userRole = req.user.role;
    const responsibilities = req.user.responsibilities || [];
    const userId = req.user.userId;

    const whereClause: any = {
      student: { department: EEE_DEPT },
    };

    // Role & Responsibility-based Scoping
    if (userRole === 'STUDENT') {
      whereClause.studentId = userId;
    } else if (userRole === 'STAFF' || userRole === 'MENTOR' || userRole === 'ADVISOR') {
      const isHod = responsibilities.includes('HOD') || (userRole as string) === 'HOD';
      const isAdvisor = responsibilities.includes('ADVISOR') || (userRole as string) === 'ADVISOR';
      const isMentor = responsibilities.includes('MENTOR') || (userRole as string) === 'MENTOR';

      if (isHod) {
        // HOD sees all EEE certificates
      } else if (isMentor && !isAdvisor) {
        // Only assigned mentees
        whereClause.student.mentorId = userId;
      } else if (isAdvisor && !isMentor) {
        // Assigned year class
        const assignedYears = req.user.advisoryYears || [];
        whereClause.student.OR = [
          { advisorId: userId },
          { year: { in: assignedYears } },
        ];
      } else if (isMentor && isAdvisor) {
        // Mentees OR Class advisees
        const assignedYears = req.user.advisoryYears || [];
        whereClause.student.OR = [
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

    if (category && typeof category === 'string' && category !== 'ALL') {
      whereClause.category = category;
    }

    if (studentId && typeof studentId === 'string') {
      whereClause.studentId = studentId;
    }

    if (search && typeof search === 'string' && search.trim() !== '') {
      const query = search.trim();
      whereClause.OR = [
        { title: { contains: query } },
        { category: { contains: query } },
        { certificateId: { contains: query } },
        { eventName: { contains: query } },
        { organization: { contains: query } },
        { student: { name: { contains: query } } },
        { student: { registerNumber: { contains: query } } },
      ];
    }

    const pageNum = parseInt(page as string, 10) || 1;
    const limitNum = parseInt(limit as string, 10) || 50;
    const skip = (pageNum - 1) * limitNum;

    const [certificates, total] = await Promise.all([
      prisma.certificate.findMany({
        where: whereClause,
        include: {
          student: {
            select: { id: true, name: true, registerNumber: true, email: true, department: true, year: true, section: true, mentorId: true, advisorId: true },
          },
        },
        orderBy: { uploadedAt: 'desc' },
        skip,
        take: limitNum,
      }),
      prisma.certificate.count({ where: whereClause }),
    ]);

    return res.status(200).json({
      success: true,
      certificates,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    console.error('Get certificates error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch certificates.' });
  }
};

export const getCertificateById = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const { id } = req.params;

    const certificate = await prisma.certificate.findFirst({
      where: {
        OR: [{ id }, { certificateId: id }],
      },
      include: {
        student: {
          select: { id: true, name: true, registerNumber: true, email: true, department: true, year: true, section: true, phone: true, mentorId: true, advisorId: true },
        },
      },
    });

    if (!certificate) {
      return res.status(404).json({ success: false, message: 'Certificate not found.' });
    }

    // Security check: Student can only view own certificate
    if (req.user.role === 'STUDENT' && certificate.studentId !== req.user.userId) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    // Staff scoping check: Mentor can only view assigned mentees
    if (req.user.role === 'STAFF' || req.user.role === 'MENTOR') {
      const responsibilities = req.user.responsibilities || [];
      const isHod = responsibilities.includes('HOD') || (req.user.role as string) === 'HOD';
      const isAdvisor = responsibilities.includes('ADVISOR') || (req.user.role as string) === 'ADVISOR';
      const isMentor = responsibilities.includes('MENTOR') || (req.user.role as string) === 'MENTOR';

      if (!isHod && isMentor && !isAdvisor && certificate.student.mentorId !== req.user.userId) {
        return res.status(403).json({ success: false, message: 'Access denied. You can only view certificates of your assigned mentees.' });
      }
    }

    // Fetch approvals timeline & audit history
    const approvals = await prisma.approval.findMany({
      where: { requestId: certificate.id },
      include: {
        approver: { select: { id: true, name: true, role: true } },
      },
      orderBy: { actionDate: 'asc' },
    });

    const auditLogs = await prisma.auditLog.findMany({
      where: { requestId: certificate.certificateId || certificate.id },
      orderBy: { createdAt: 'desc' },
    });

    return res.status(200).json({
      success: true,
      certificate,
      approvals,
      auditLogs,
    });
  } catch (error) {
    console.error('Get certificate by ID error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch certificate details.' });
  }
};

/**
 * Approve Certificate using Dynamic Approval Chain (Handling consecutive deduplication)
 */
export const approveCertificate = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const { id } = req.params;
    const { remarks } = req.body;

    const certificate = await prisma.certificate.findUnique({
      where: { id },
      include: { student: true },
    });

    if (!certificate) {
      return res.status(404).json({ success: false, message: 'Certificate not found.' });
    }

    if (certificate.status === 'APPROVED' || certificate.currentStage === 'COMPLETED') {
      return res.status(400).json({ success: false, message: 'Certificate is already fully approved.' });
    }

    // Calculate dynamic transition
    const transition = await calculateApprovalTransition(
      certificate.studentId,
      certificate.currentStage,
      req.user.userId,
      req.user.role,
      req.user.responsibilities || []
    );

    const { nextStage, nextStatus, isFinalApproval, exercisedRoles, nextApproverId } = transition;
    const primaryRole = exercisedRoles[0] || req.user.role;

    // Prepare update payload
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
      updateData.approvedAt = new Date();
      updateData.approvedById = req.user.userId;
    }

    await prisma.certificate.update({
      where: { id },
      data: updateData,
    });

    // Create Approval record
    await prisma.approval.create({
      data: {
        requestType: 'CERTIFICATE',
        requestId: certificate.id,
        approverId: req.user.userId,
        approverName: req.user.name,
        approverRole: primaryRole,
        action: 'APPROVED',
        previousStatus: certificate.status,
        newStatus: nextStatus,
        remarks: remarks || `Approved by ${exercisedRoles.join(' & ')}`,
      },
    });

    // Log Audit
    await logAudit({
      userId: req.user.userId,
      userName: req.user.name,
      userRole: primaryRole,
      requestType: 'CERTIFICATE',
      requestId: certificate.certificateId || certificate.id,
      action: isFinalApproval ? 'HOD_APPROVED' : `${primaryRole}_APPROVED`,
      previousStatus: certificate.status,
      newStatus: nextStatus,
      remarks: remarks || `Approved as ${exercisedRoles.join(' & ')}`,
      description: `Staff ${req.user.name} approved Certificate ${certificate.certificateId} exercising roles [${exercisedRoles.join(', ')}]`,
      ipAddress: req.ip,
    });

    // Notification to Student
    let studentMsg = '';
    if (isFinalApproval) {
      studentMsg = `Your Certificate ${certificate.certificateId || certificate.title} has been officially approved by HOD.`;
    } else if (nextStage === 'ADVISOR_REVIEW') {
      studentMsg = `Certificate ${certificate.certificateId || certificate.title} has been approved by your Mentor and forwarded to your Advisor.`;
    } else if (nextStage === 'HOD_REVIEW') {
      studentMsg = `Certificate ${certificate.certificateId || certificate.title} has been approved by your Advisor and forwarded to HOD.`;
    }

    await prisma.notification.create({
      data: {
        userId: certificate.studentId,
        title: isFinalApproval ? 'Certificate Approved!' : 'Certificate Workflow Advanced',
        message: studentMsg,
        type: isFinalApproval ? 'SUCCESS' : 'INFO',
        requestType: 'CERTIFICATE',
        requestId: certificate.id,
      },
    });

    // Notify next approver if workflow not completed
    if (nextApproverId && !isFinalApproval) {
      await prisma.notification.create({
        data: {
          userId: nextApproverId,
          title: `Certificate Awaiting ${nextStage === 'HOD_REVIEW' ? 'HOD' : 'Advisor'} Review`,
          message: `Certificate ${certificate.certificateId || certificate.title} from ${certificate.student.name} is awaiting your approval.`,
          requestType: 'CERTIFICATE',
          requestId: certificate.id,
        },
      });
    }

    return res.status(200).json({
      success: true,
      message: isFinalApproval
        ? `Certificate ${certificate.certificateId} fully approved!`
        : `Certificate approved and advanced to ${nextStage}.`,
      currentStage: nextStage,
      status: nextStatus,
    });
  } catch (error: any) {
    console.error('Approve certificate error:', error);
    return res.status(400).json({ success: false, message: error.message || 'Failed to approve certificate.' });
  }
};

/**
 * Reject Certificate with Mandatory Reason
 */
export const rejectCertificate = async (req: AuthenticatedRequest, res: Response) => {
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

    const certificate = await prisma.certificate.findUnique({
      where: { id },
      include: { student: true },
    });

    if (!certificate) {
      return res.status(404).json({ success: false, message: 'Certificate not found.' });
    }

    await prisma.certificate.update({
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
        requestType: 'CERTIFICATE',
        requestId: certificate.id,
        approverId: req.user.userId,
        approverName: req.user.name,
        approverRole: req.user.role,
        action: 'REJECTED',
        previousStatus: certificate.status,
        newStatus: 'REJECTED',
        remarks: rejectionReason,
      },
    });

    await logAudit({
      userId: req.user.userId,
      userName: req.user.name,
      userRole: req.user.role,
      requestType: 'CERTIFICATE',
      requestId: certificate.certificateId || certificate.id,
      action: 'CERTIFICATE_REJECTED',
      previousStatus: certificate.status,
      newStatus: 'REJECTED',
      remarks: rejectionReason,
      description: `Certificate ${certificate.certificateId} rejected by ${req.user.name} (${req.user.role}). Reason: ${rejectionReason}`,
      ipAddress: req.ip,
    });

    // Notify Student
    await prisma.notification.create({
      data: {
        userId: certificate.studentId,
        title: 'Certificate Rejected',
        message: `Your Certificate ${certificate.certificateId || certificate.title} was rejected by ${req.user.role} (${req.user.name}). Reason: ${rejectionReason}`,
        requestType: 'CERTIFICATE',
        requestId: certificate.id,
        type: 'ERROR',
      },
    });

    return res.status(200).json({
      success: true,
      message: 'Certificate rejected successfully with remarks.',
    });
  } catch (error) {
    console.error('Reject certificate error:', error);
    return res.status(500).json({ success: false, message: 'Failed to reject certificate.' });
  }
};

/**
 * Resubmit Certificate (Restarts approval at Mentor Review stage)
 */
export const resubmitCertificate = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const { id } = req.params;
    const { title, category, eventName, organization, eventDate, issuedDate, description } = req.body;

    const certificate = await prisma.certificate.findUnique({
      where: { id },
      include: { student: true },
    });

    if (!certificate) {
      return res.status(404).json({ success: false, message: 'Certificate not found.' });
    }

    if (certificate.studentId !== req.user.userId) {
      return res.status(403).json({ success: false, message: 'You can only resubmit your own certificates.' });
    }

    const files = req.files as { [fieldname: string]: Express.Multer.File[] } | undefined;
    const primaryFile = files?.file?.[0] || req.file;

    let relativeFilePath = certificate.filePath;
    let fileName = certificate.fileName;
    let fileType = certificate.fileType;
    let fileSize = certificate.fileSize;

    if (primaryFile) {
      relativeFilePath = `/uploads/certificates/${primaryFile.filename}`;
      fileName = primaryFile.filename;
      fileType = primaryFile.mimetype;
      fileSize = primaryFile.size;
    }

    let relativeSupportingPath = certificate.supportingFile;
    if (files?.supportingFile?.[0]) {
      relativeSupportingPath = `/uploads/certificates/${files.supportingFile[0].filename}`;
    }

    const updatedCertificate = await prisma.certificate.update({
      where: { id },
      data: {
        title: title || certificate.title,
        category: category || certificate.category,
        eventName: eventName || certificate.eventName,
        organization: organization || certificate.organization,
        eventDate: eventDate || certificate.eventDate,
        issuedDate: issuedDate || certificate.issuedDate,
        description: description !== undefined ? description : certificate.description,
        filePath: relativeFilePath,
        fileName,
        fileType,
        fileSize,
        supportingFile: relativeSupportingPath,
        status: 'RESUBMITTED',
        currentStage: 'MENTOR_REVIEW',
        rejectionReason: null,
      },
    });

    await prisma.approval.create({
      data: {
        requestType: 'CERTIFICATE',
        requestId: certificate.id,
        approverId: req.user.userId,
        approverName: req.user.name,
        approverRole: 'STUDENT',
        action: 'RESUBMITTED',
        previousStatus: 'REJECTED',
        newStatus: 'MENTOR_REVIEW',
        remarks: 'Student corrected details and resubmitted request.',
      },
    });

    await logAudit({
      userId: req.user.userId,
      userName: req.user.name,
      userRole: req.user.role,
      requestType: 'CERTIFICATE',
      requestId: certificate.certificateId || certificate.id,
      action: 'CERTIFICATE_RESUBMITTED',
      previousStatus: 'REJECTED',
      newStatus: 'MENTOR_REVIEW',
      description: `Student resubmitted certificate ${certificate.certificateId}. Approval workflow restarted at Mentor stage.`,
      ipAddress: req.ip,
    });

    // Notify Mentor
    const mentorId = certificate.student.mentorId;
    if (mentorId) {
      await prisma.notification.create({
        data: {
          userId: mentorId,
          title: 'Resubmitted Certificate Awaiting Review',
          message: `Certificate ${certificate.certificateId} has been resubmitted by ${certificate.student.name} and is awaiting your mentor review.`,
          requestType: 'CERTIFICATE',
          requestId: certificate.id,
        },
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Certificate resubmitted successfully. Approval workflow restarted at Mentor stage.',
      certificate: updatedCertificate,
    });
  } catch (error) {
    console.error('Resubmit certificate error:', error);
    return res.status(500).json({ success: false, message: 'Failed to resubmit certificate.' });
  }
};

/**
 * Public or QR verification
 */
export const getVerificationByCode = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { code } = req.params;

    const certificate = await prisma.certificate.findFirst({
      where: {
        OR: [
          { certificateCode: code },
          { certificateId: code },
          { id: code },
        ],
      },
      include: {
        student: {
          select: { name: true, registerNumber: true, department: true, year: true, section: true },
        },
        approvedBy: {
          select: { name: true, role: true },
        },
      },
    });

    if (!certificate) {
      return res.status(404).json({ success: false, message: 'No certificate found matching code.' });
    }

    return res.status(200).json({
      success: true,
      verified: certificate.status === 'APPROVED',
      certificate,
    });
  } catch (error) {
    console.error('Verification error:', error);
    return res.status(500).json({ success: false, message: 'Failed to verify certificate.' });
  }
};

export const issueCertificate = async (req: AuthenticatedRequest, res: Response) => {
  return res.status(200).json({ success: true, message: 'Certificate issued.' });
};

export const getCertificateFile = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const { id } = req.params;
    const certificate = await prisma.certificate.findFirst({
      where: { OR: [{ id }, { certificateId: id }] },
      include: { student: true },
    });

    if (!certificate) {
      return res.status(404).json({ success: false, message: 'Certificate not found.' });
    }

    // Security check: only student owner, assigned Mentor, assigned Advisor, HOD, and Creator
    const isOwner = req.user.role === 'STUDENT' && certificate.studentId === req.user.userId;
    const isAssignedMentor = certificate.student.mentorId === req.user.userId;
    const isAssignedAdvisor = certificate.student.advisorId === req.user.userId || (req.user.advisoryYears || []).includes(certificate.student.year || '');
    const isHod = (req.user.responsibilities || []).includes('HOD') || req.user.role === 'HOD';
    const isCreator = req.user.role === 'CREATOR' || req.user.role === 'ADMIN';

    if (!isOwner && !isAssignedMentor && !isAssignedAdvisor && !isHod && !isCreator) {
      return res.status(403).json({ success: false, message: 'Access denied to this certificate file.' });
    }

    const filePath = path.join(__dirname, '../../../uploads/certificates', certificate.fileName);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ success: false, message: 'Physical file not found on server.' });
    }

    return res.sendFile(filePath);
  } catch (error) {
    console.error('Get certificate file error:', error);
    return res.status(500).json({ success: false, message: 'Failed to retrieve certificate file.' });
  }
};

export const deleteCertificate = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const { id } = req.params;
    const certificate = await prisma.certificate.findFirst({
      where: { OR: [{ id }, { certificateId: id }] },
    });

    if (!certificate) {
      return res.status(404).json({ success: false, message: 'Certificate not found.' });
    }

    const isOwner = req.user.role === 'STUDENT' && certificate.studentId === req.user.userId;
    const isCreator = req.user.role === 'CREATOR' || req.user.role === 'ADMIN';

    if (!isOwner && !isCreator) {
      return res.status(403).json({ success: false, message: 'Only the student or Creator can delete this certificate.' });
    }

    if (certificate.status === 'APPROVED' && !isCreator) {
      return res.status(400).json({ success: false, message: 'Approved certificates cannot be deleted by students.' });
    }

    await prisma.certificate.delete({ where: { id: certificate.id } });

    return res.status(200).json({ success: true, message: 'Certificate deleted successfully.' });
  } catch (error) {
    console.error('Delete certificate error:', error);
    return res.status(500).json({ success: false, message: 'Failed to delete certificate.' });
  }
};

