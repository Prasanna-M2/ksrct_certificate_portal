export type Role = 'STUDENT' | 'STAFF' | 'CREATOR' | 'MENTOR' | 'ADVISOR' | 'HOD' | 'ADMIN';
export type StaffResponsibilityType = 'MENTOR' | 'ADVISOR' | 'HOD';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  department: string;
  year?: string | null;
  section?: string | null;
  registerNumber?: string | null;
  rollNumber?: string | null;
  stayType?: 'DAY_SCHOLAR' | 'HOSTELLER' | null;
  semester?: string | null;
  phone?: string | null;
  profileImage?: string | null;
  mentorId?: string | null;
  mentor?: {
    id: string;
    name: string;
    email: string;
    phone?: string;
  } | null;
  advisorId?: string | null;
  advisor?: {
    id: string;
    name: string;
    email: string;
    phone?: string;
  } | null;
  mentorCapacity?: number;
  responsibilities?: StaffResponsibilityType[];
  advisorAssignments?: {
    id: string;
    year: string;
    section?: string | null;
  }[];
  isActive?: boolean;
  createdAt?: string;
  _count?: {
    certificates?: number;
    odRequests?: number;
    mentees?: number;
    advisees?: number;
  };
}

export type PortalStage = 'MENTOR_REVIEW' | 'ADVISOR_REVIEW' | 'HOD_REVIEW' | 'COMPLETED';

export type PortalStatus =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'MENTOR_REVIEW'
  | 'ADVISOR_REVIEW'
  | 'HOD_REVIEW'
  | 'APPROVED'
  | 'REJECTED'
  | 'RESUBMITTED'
  | 'PENDING';

export type CertificateStatus = PortalStatus;

export interface ApprovalRecord {
  id: string;
  requestType: 'CERTIFICATE' | 'OD';
  requestId: string;
  approverId: string;
  approverName?: string;
  approverRole: string;
  action: 'SUBMITTED' | 'APPROVED' | 'REJECTED' | 'RESUBMITTED';
  previousStatus?: string;
  newStatus?: string;
  remarks?: string;
  actionDate: string;
  approver?: {
    id: string;
    name: string;
    role: string;
  };
}

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
  certificateId?: string | null; // e.g. CERT-2026-0001
  certificateCode?: string | null;
  studentId: string;
  studentName?: string;
  registerNumber?: string;
  department?: string;
  student?: {
    id: string;
    name: string;
    registerNumber?: string;
    email: string;
    department: string;
    year?: string;
    section?: string;
    phone?: string;
    mentorId?: string;
    advisorId?: string;
  };
  title: string;
  category: CertificateCategory;
  eventName?: string | null;
  organization?: string | null;
  eventDate?: string | null;
  description?: string | null;
  fileName: string;
  filePath: string;
  fileType: string;
  fileSize: number;
  supportingFile?: string | null;
  status: CertificateStatus;
  currentStage: PortalStage;
  issuedDate: string;
  uploadedAt: string;
  updatedAt?: string;
  verifiedBy?: { id: string; name: string; role: string };
  verifiedById?: string;
  rejectionReason?: string | null;
  rejectedByRole?: string | null;
  rejectedByName?: string | null;
  mentorRemarks?: string | null;
  advisorRemarks?: string | null;
  hodRemarks?: string | null;
}

export type OdRequestType = 'INTERNSHIP_OD' | 'EVENT_OD' | 'CAMPUS_PERMISSION' | 'LEAVE';

export interface OdRequest {
  id: string;
  odId?: string | null; // e.g. OD-2026-0001
  requestType: OdRequestType;
  studentId: string;
  studentName: string;
  registerNumber?: string;
  rollNumber?: string;
  department: string;
  year: string;
  section: string;
  semester: string;
  stayType: string;
  eventName?: string;
  eventType?: string;
  organization?: string;
  venue?: string;
  odDate?: string;
  startTime?: string;
  endTime?: string;
  numberOfDays: number;
  purpose?: string;
  description?: string;
  coordinator?: string;
  supportingFile?: string;
  attachmentName?: string;
  attachmentPath?: string;
  status: PortalStatus;
  currentStage: PortalStage;
  mentorRemarks?: string;
  advisorRemarks?: string;
  hodRemarks?: string;
  rejectionReason?: string;
  rejectedByRole?: string;
  rejectedByName?: string;
  createdAt: string;
  updatedAt?: string;
  student?: {
    id: string;
    name: string;
    registerNumber?: string;
    email: string;
    department: string;
    year?: string;
    section?: string;
    mentorId?: string;
    advisorId?: string;
  };
}

export interface CertificateTemplate {
  id: string;
  title: string;
  description?: string;
  category: string;
  layoutJson: string;
  status: 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'PUBLISHED';
  createdById: string;
  createdBy?: { id: string; name: string; email?: string; role?: string };
  createdAt: string;
  updatedAt: string;
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

export interface NotificationItem {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR';
  requestType?: 'CERTIFICATE' | 'OD' | null;
  requestId?: string | null;
  isRead: boolean;
  createdAt: string;
}

export interface AuditLogItem {
  id: string;
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
  createdAt: string;
}
