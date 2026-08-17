import { Response } from 'express';
import { prisma } from '../utils/prisma';
import { AuthenticatedRequest } from '../middleware/auth';
import { logAudit } from '../utils/auditLogger';

export const createSupportTicket = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const { subject, message } = req.body;

    if (!subject || !message) {
      return res.status(400).json({ success: false, message: 'Subject and message are required.' });
    }

    const ticket = await prisma.supportTicket.create({
      data: {
        userId: req.user.userId,
        subject,
        message,
        status: 'OPEN',
      },
    });

    await logAudit({
      userId: req.user.userId,
      userName: req.user.name,
      action: 'SUPPORT_TICKET_CREATED',
      entityType: 'SupportTicket',
      entityId: ticket.id,
      description: `Submitted support ticket: "${subject}"`,
      ipAddress: req.ip,
    });

    return res.status(201).json({
      success: true,
      message: 'Support ticket submitted successfully. Admin/Support team will get back to you.',
      ticket,
    });
  } catch (error) {
    console.error('Create support ticket error:', error);
    return res.status(500).json({ success: false, message: 'Failed to create support ticket.' });
  }
};

export const getSupportTickets = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const whereClause: any = {};
    if (req.user.role === 'STUDENT') {
      whereClause.userId = req.user.userId;
    }

    const tickets = await prisma.supportTicket.findMany({
      where: whereClause,
      include: {
        user: {
          select: { name: true, email: true, role: true, department: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return res.status(200).json({
      success: true,
      tickets,
    });
  } catch (error) {
    console.error('Get support tickets error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch support tickets.' });
  }
};

export const updateTicketStatus = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user || req.user.role !== 'ADMIN') {
      return res.status(403).json({ success: false, message: 'Admin access required.' });
    }

    const { id } = req.params;
    const { status } = req.body;

    if (!['OPEN', 'IN_PROGRESS', 'RESOLVED'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid ticket status.' });
    }

    const ticket = await prisma.supportTicket.update({
      where: { id },
      data: { status },
    });

    return res.status(200).json({
      success: true,
      message: `Support ticket status updated to ${status}.`,
      ticket,
    });
  } catch (error) {
    console.error('Update ticket status error:', error);
    return res.status(500).json({ success: false, message: 'Failed to update support ticket.' });
  }
};
