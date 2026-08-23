import { prisma } from './prisma';

export interface AuditLogOptions {
  userId?: string;
  userName?: string;
  userRole?: string;
  requestType?: string;
  requestId?: string;
  action: string;
  previousStatus?: string;
  newStatus?: string;
  remarks?: string;
  entityType?: string;
  entityId?: string;
  description: string;
  oldValue?: string;
  newValue?: string;
  ipAddress?: string;
}

export const logAudit = async (options: AuditLogOptions) => {
  try {
    await prisma.auditLog.create({
      data: {
        userId: options.userId,
        userName: options.userName,
        userRole: options.userRole,
        requestType: options.requestType,
        requestId: options.requestId,
        action: options.action,
        previousStatus: options.previousStatus,
        newStatus: options.newStatus,
        remarks: options.remarks,
        entityType: options.entityType,
        entityId: options.entityId,
        description: options.description,
        oldValue: options.oldValue || null,
        newValue: options.newValue || null,
        ipAddress: options.ipAddress || '127.0.0.1',
      },
    });
  } catch (error) {
    console.error('Failed to record audit log:', error);
  }
};
