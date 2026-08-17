import { prisma } from './prisma';

export interface AuditLogOptions {
  userId?: string;
  userName?: string;
  action: string;
  entityType?: string;
  entityId?: string;
  description: string;
  ipAddress?: string;
}

export const logAudit = async (options: AuditLogOptions) => {
  try {
    await prisma.auditLog.create({
      data: {
        userId: options.userId,
        userName: options.userName,
        action: options.action,
        entityType: options.entityType,
        entityId: options.entityId,
        description: options.description,
        ipAddress: options.ipAddress || '127.0.0.1',
      },
    });
  } catch (error) {
    console.error('Failed to record audit log:', error);
  }
};
