export type Role = 'STUDENT' | 'HOD' | 'ADMIN';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  department: string;
  year?: string | null;
  registerNumber?: string | null;
  phone?: string | null;
  profileImage?: string | null;
  isActive?: boolean;
  createdAt?: string;
  _count?: {
    certificates: number;
  };
}

export type CertificateStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export type CertificateCategory =
  | 'NPTEL'
  | 'Internship'
  | 'Workshop'
  | 'Hackathon'
  | 'NSS'
  | 'NCC'
  | 'Sports'
  | 'Technical'
  | 'Academic'
  | 'Certification'
  | 'Other';

export interface Certificate {
  id: string;
  studentId: string;
  student?: {
    id: string;
    name: string;
    registerNumber?: string;
    email: string;
    department: string;
    year?: string;
    phone?: string;
  };
  title: string;
  category: CertificateCategory;
  description?: string;
  fileName: string;
  filePath: string;
  fileType: string;
  fileSize: number;
  status: CertificateStatus;
  issuedDate: string;
  uploadedAt: string;
  verifiedAt?: string;
  verifiedById?: string;
  verifiedBy?: {
    id: string;
    name: string;
    role: string;
  };
  rejectionReason?: string;
}

export interface NotificationItem {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR';
  isRead: boolean;
  createdAt: string;
}

export interface AuditLogItem {
  id: string;
  userId?: string;
  userName?: string;
  action: string;
  entityType?: string;
  entityId?: string;
  description: string;
  ipAddress?: string;
  createdAt: string;
}

export interface SupportTicket {
  id: string;
  userId: string;
  user?: {
    name: string;
    email: string;
    role: string;
    department: string;
  };
  subject: string;
  message: string;
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED';
  createdAt: string;
}
