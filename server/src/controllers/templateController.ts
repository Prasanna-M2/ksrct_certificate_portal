import { Response } from 'express';
import { prisma } from '../utils/prisma';
import { AuthenticatedRequest } from '../middleware/auth';
import { logAudit } from '../utils/auditLogger';

export const getTemplates = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const { status, category, search } = req.query;

    const whereClause: any = {};

    if (status && typeof status === 'string' && status !== 'ALL') {
      whereClause.status = status;
    }

    if (category && typeof category === 'string' && category !== 'ALL') {
      whereClause.category = category;
    }

    if (search && typeof search === 'string' && search.trim() !== '') {
      whereClause.OR = [
        { title: { contains: search.trim() } },
        { description: { contains: search.trim() } },
      ];
    }

    // Non-Admin/Creator users only see PUBLISHED templates
    if (!['ADMIN', 'CREATOR', 'CERTIFICATE_COORDINATOR'].includes(req.user.role)) {
      whereClause.status = 'PUBLISHED';
    }

    const templates = await prisma.certificateTemplate.findMany({
      where: whereClause,
      include: {
        createdBy: {
          select: { id: true, name: true, email: true, role: true },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    return res.status(200).json({
      success: true,
      templates,
    });
  } catch (error) {
    console.error('Get templates error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch templates.' });
  }
};

export const getTemplateById = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const { id } = req.params;

    const template = await prisma.certificateTemplate.findUnique({
      where: { id },
      include: {
        createdBy: {
          select: { id: true, name: true, email: true, role: true },
        },
      },
    });

    if (!template) {
      return res.status(404).json({ success: false, message: 'Template not found.' });
    }

    return res.status(200).json({
      success: true,
      template,
    });
  } catch (error) {
    console.error('Get template by ID error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch template.' });
  }
};

export const createTemplate = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    if (!['CREATOR', 'ADMIN', 'CERTIFICATE_COORDINATOR'].includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Only Creator, Coordinator, or Admin can create templates.' });
    }

    const { title, description, category, layoutJson, status } = req.body;

    if (!title || !layoutJson) {
      return res.status(400).json({ success: false, message: 'Title and layout configuration are required.' });
    }

    const template = await prisma.certificateTemplate.create({
      data: {
        title: title.trim(),
        description: description ? description.trim() : null,
        category: category || 'Academic',
        layoutJson: typeof layoutJson === 'string' ? layoutJson : JSON.stringify(layoutJson),
        status: status && ['DRAFT', 'SUBMITTED', 'APPROVED', 'PUBLISHED'].includes(status) ? status : 'DRAFT',
        createdById: req.user.userId,
      },
      include: {
        createdBy: {
          select: { id: true, name: true, role: true },
        },
      },
    });

    await logAudit({
      userId: req.user.userId,
      userName: req.user.name,
      action: 'TEMPLATE_CREATED',
      entityType: 'CertificateTemplate',
      entityId: template.id,
      description: `Created template "${template.title}" (${template.status})`,
      ipAddress: req.ip,
    });

    return res.status(201).json({
      success: true,
      message: 'Certificate template created successfully.',
      template,
    });
  } catch (error) {
    console.error('Create template error:', error);
    return res.status(500).json({ success: false, message: 'Failed to create template.' });
  }
};

export const updateTemplate = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    if (!['CREATOR', 'ADMIN', 'CERTIFICATE_COORDINATOR'].includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Not authorized to edit templates.' });
    }

    const { id } = req.params;
    const { title, description, category, layoutJson, status } = req.body;

    const existing = await prisma.certificateTemplate.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Template not found.' });
    }

    const updated = await prisma.certificateTemplate.update({
      where: { id },
      data: {
        ...(title ? { title: title.trim() } : {}),
        ...(description !== undefined ? { description: description ? description.trim() : null } : {}),
        ...(category ? { category } : {}),
        ...(layoutJson ? { layoutJson: typeof layoutJson === 'string' ? layoutJson : JSON.stringify(layoutJson) } : {}),
        ...(status && ['DRAFT', 'SUBMITTED', 'APPROVED', 'PUBLISHED'].includes(status) ? { status } : {}),
      },
      include: {
        createdBy: {
          select: { id: true, name: true, role: true },
        },
      },
    });

    await logAudit({
      userId: req.user.userId,
      userName: req.user.name,
      action: 'TEMPLATE_UPDATED',
      entityType: 'CertificateTemplate',
      entityId: updated.id,
      description: `Updated template "${updated.title}" (${updated.status})`,
      ipAddress: req.ip,
    });

    return res.status(200).json({
      success: true,
      message: 'Template updated successfully.',
      template: updated,
    });
  } catch (error) {
    console.error('Update template error:', error);
    return res.status(500).json({ success: false, message: 'Failed to update template.' });
  }
};

export const deleteTemplate = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    if (!['CREATOR', 'ADMIN'].includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Only Creator or Admin can delete templates.' });
    }

    const { id } = req.params;

    await prisma.certificateTemplate.delete({ where: { id } });

    await logAudit({
      userId: req.user.userId,
      userName: req.user.name,
      action: 'TEMPLATE_DELETED',
      entityType: 'CertificateTemplate',
      entityId: id,
      description: `Deleted template ${id}`,
      ipAddress: req.ip,
    });

    return res.status(200).json({
      success: true,
      message: 'Template deleted successfully.',
    });
  } catch (error) {
    console.error('Delete template error:', error);
    return res.status(500).json({ success: false, message: 'Failed to delete template.' });
  }
};
