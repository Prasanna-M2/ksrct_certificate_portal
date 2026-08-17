import { Response } from 'express';
import path from 'path';
import fs from 'fs';
import { prisma } from '../utils/prisma';
import { AuthenticatedRequest } from '../middleware/auth';
import { logAudit } from '../utils/auditLogger';

export const uploadCertificate = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Please select a certificate file to upload.' });
    }

    const { title, category, issuedDate, description } = req.body;

    if (!title || !category || !issuedDate) {
      // Remove uploaded file if validation fails
      if (fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(400).json({ success: false, message: 'Title, category, and issue date are required.' });
    }

    const relativeFilePath = `/uploads/certificates/${req.file.filename}`;

    const certificate = await prisma.certificate.create({
      data: {
        studentId: req.user.userId,
        title,
        category,
        description: description || null,
        fileName: req.file.filename,
        filePath: relativeFilePath,
        fileType: req.file.mimetype,
        fileSize: req.file.size,
        issuedDate,
        status: 'PENDING',
      },
      include: {
        student: {
          select: { name: true, registerNumber: true, department: true },
        },
      },
    });

    // Create audit log
    await logAudit({
      userId: req.user.userId,
      userName: req.user.name,
      action: 'CERTIFICATE_UPLOAD',
      entityType: 'Certificate',
      entityId: certificate.id,
      description: `Uploaded certificate "${certificate.title}" (${certificate.category})`,
      ipAddress: req.ip,
    });

    // Notify HODs in the same department
    const hods = await prisma.user.findMany({
      where: { role: 'HOD', department: req.user.department },
    });

    for (const hod of hods) {
      await prisma.notification.create({
        data: {
          userId: hod.id,
          title: 'New Certificate Uploaded',
          message: `${req.user.name} (${certificate.student.registerNumber || 'Student'}) uploaded a new certificate "${title}" requiring verification.`,
          type: 'INFO',
        },
      });
    }

    return res.status(201).json({
      success: true,
      message: 'Certificate uploaded successfully and is pending verification.',
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

    const { status, category, studentId, search, department, page = '1', limit = '50' } = req.query;

    const whereClause: any = {};

    // Role-based scoping
    if (req.user.role === 'STUDENT') {
      whereClause.studentId = req.user.userId;
    } else if (req.user.role === 'HOD') {
      whereClause.student = {
        department: req.user.department,
      };
    }

    // Optional filters
    if (status && typeof status === 'string' && status !== 'ALL') {
      whereClause.status = status;
    }

    if (category && typeof category === 'string' && category !== 'ALL') {
      whereClause.category = category;
    }

    if (studentId && typeof studentId === 'string') {
      whereClause.studentId = studentId;
    }

    if (department && typeof department === 'string' && department !== 'ALL' && req.user.role === 'ADMIN') {
      whereClause.student = { ...whereClause.student, department };
    }

    if (search && typeof search === 'string' && search.trim() !== '') {
      const query = search.trim();
      whereClause.OR = [
        { title: { contains: query } },
        { category: { contains: query } },
        { description: { contains: query } },
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
            select: { id: true, name: true, registerNumber: true, email: true, department: true, year: true },
          },
          verifiedBy: {
            select: { id: true, name: true, role: true },
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

    const certificate = await prisma.certificate.findUnique({
      where: { id },
      include: {
        student: {
          select: { id: true, name: true, registerNumber: true, email: true, department: true, year: true, phone: true },
        },
        verifiedBy: {
          select: { id: true, name: true, role: true },
        },
      },
    });

    if (!certificate) {
      return res.status(404).json({ success: false, message: 'Certificate not found.' });
    }

    // Access control check
    if (req.user.role === 'STUDENT' && certificate.studentId !== req.user.userId) {
      return res.status(403).json({ success: false, message: 'Access denied to this certificate.' });
    }

    if (req.user.role === 'HOD' && certificate.student.department !== req.user.department) {
      return res.status(403).json({ success: false, message: 'Access denied. Student belongs to another department.' });
    }

    return res.status(200).json({
      success: true,
      certificate,
    });
  } catch (error) {
    console.error('Get certificate by ID error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch certificate details.' });
  }
};

export const approveCertificate = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const { id } = req.params;

    const certificate = await prisma.certificate.findUnique({
      where: { id },
      include: { student: true },
    });

    if (!certificate) {
      return res.status(404).json({ success: false, message: 'Certificate not found.' });
    }

    if (req.user.role === 'HOD' && certificate.student.department !== req.user.department) {
      return res.status(403).json({ success: false, message: 'Not authorized for this department.' });
    }

    const updatedCertificate = await prisma.certificate.update({
      where: { id },
      data: {
        status: 'APPROVED',
        verifiedAt: new Date(),
        verifiedById: req.user.userId,
        rejectionReason: null,
      },
    });

    // Notify Student
    await prisma.notification.create({
      data: {
        userId: certificate.studentId,
        title: 'Certificate Approved',
        message: `Your certificate "${certificate.title}" has been verified and APPROVED.`,
        type: 'SUCCESS',
      },
    });

    // Log Audit
    await logAudit({
      userId: req.user.userId,
      userName: req.user.name,
      action: 'CERTIFICATE_APPROVED',
      entityType: 'Certificate',
      entityId: certificate.id,
      description: `Approved certificate "${certificate.title}" for student ${certificate.student.name}`,
      ipAddress: req.ip,
    });

    return res.status(200).json({
      success: true,
      message: 'Certificate approved successfully.',
      certificate: updatedCertificate,
    });
  } catch (error) {
    console.error('Approve certificate error:', error);
    return res.status(500).json({ success: false, message: 'Failed to approve certificate.' });
  }
};

export const rejectCertificate = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const { id } = req.params;
    const { rejectionReason } = req.body;

    if (!rejectionReason || rejectionReason.trim() === '') {
      return res.status(400).json({ success: false, message: 'A rejection reason is required.' });
    }

    const certificate = await prisma.certificate.findUnique({
      where: { id },
      include: { student: true },
    });

    if (!certificate) {
      return res.status(404).json({ success: false, message: 'Certificate not found.' });
    }

    if (req.user.role === 'HOD' && certificate.student.department !== req.user.department) {
      return res.status(403).json({ success: false, message: 'Not authorized for this department.' });
    }

    const updatedCertificate = await prisma.certificate.update({
      where: { id },
      data: {
        status: 'REJECTED',
        verifiedAt: new Date(),
        verifiedById: req.user.userId,
        rejectionReason: rejectionReason.trim(),
      },
    });

    // Notify Student
    await prisma.notification.create({
      data: {
        userId: certificate.studentId,
        title: 'Certificate Action Required',
        message: `Your certificate "${certificate.title}" was REJECTED. Reason: ${rejectionReason.trim()}`,
        type: 'WARNING',
      },
    });

    // Log Audit
    await logAudit({
      userId: req.user.userId,
      userName: req.user.name,
      action: 'CERTIFICATE_REJECTED',
      entityType: 'Certificate',
      entityId: certificate.id,
      description: `Rejected certificate "${certificate.title}" for student ${certificate.student.name}. Reason: ${rejectionReason.trim()}`,
      ipAddress: req.ip,
    });

    return res.status(200).json({
      success: true,
      message: 'Certificate rejected with remarks.',
      certificate: updatedCertificate,
    });
  } catch (error) {
    console.error('Reject certificate error:', error);
    return res.status(500).json({ success: false, message: 'Failed to reject certificate.' });
  }
};

export const deleteCertificate = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const { id } = req.params;

    const certificate = await prisma.certificate.findUnique({
      where: { id },
      include: { student: true },
    });

    if (!certificate) {
      return res.status(404).json({ success: false, message: 'Certificate not found.' });
    }

    // Role checks: Student can delete ONLY if status is PENDING
    if (req.user.role === 'STUDENT') {
      if (certificate.studentId !== req.user.userId) {
        return res.status(403).json({ success: false, message: 'Access denied.' });
      }
      if (certificate.status !== 'PENDING') {
        return res.status(400).json({
          success: false,
          message: 'Cannot delete an approved or rejected certificate. Please contact HOD.',
        });
      }
    }

    // Unlink file from storage
    const absoluteFilePath = path.resolve(__dirname, '../../../uploads/certificates', certificate.fileName);
    if (fs.existsSync(absoluteFilePath)) {
      fs.unlinkSync(absoluteFilePath);
    }

    await prisma.certificate.delete({
      where: { id },
    });

    await logAudit({
      userId: req.user.userId,
      userName: req.user.name,
      action: 'CERTIFICATE_DELETED',
      entityType: 'Certificate',
      entityId: id,
      description: `Deleted certificate "${certificate.title}"`,
      ipAddress: req.ip,
    });

    return res.status(200).json({
      success: true,
      message: 'Certificate deleted successfully.',
    });
  } catch (error) {
    console.error('Delete certificate error:', error);
    return res.status(500).json({ success: false, message: 'Failed to delete certificate.' });
  }
};

export const getCertificateFile = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const { id } = req.params;

    const certificate = await prisma.certificate.findUnique({
      where: { id },
      include: { student: true },
    });

    if (!certificate) {
      return res.status(404).json({ success: false, message: 'Certificate not found.' });
    }

    if (req.user.role === 'STUDENT' && certificate.studentId !== req.user.userId) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    if (req.user.role === 'HOD' && certificate.student.department !== req.user.department) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    const absoluteFilePath = path.resolve(__dirname, '../../../uploads/certificates', certificate.fileName);

    if (!fs.existsSync(absoluteFilePath)) {
      return res.status(404).json({ success: false, message: 'Certificate file missing on server.' });
    }

    res.setHeader('Content-Type', certificate.fileType || 'application/pdf');
    return res.sendFile(absoluteFilePath);
  } catch (error) {
    console.error('Get file error:', error);
    return res.status(500).json({ success: false, message: 'Failed to retrieve file.' });
  }
};
