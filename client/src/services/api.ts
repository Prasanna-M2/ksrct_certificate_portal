import axios from 'axios';
import { User, Certificate, NotificationItem } from '../types';

// Demo Initial Accounts
const DEMO_USERS: Record<string, User> = {
  'prasanna@student.ksrct.ac.in': {
    id: 'student-1',
    name: 'Prasanna M',
    email: 'prasanna@student.ksrct.ac.in',
    role: 'STUDENT',
    department: 'Electrical and Electronics Engineering',
    year: 'III',
    registerNumber: '22EE123',
    phone: '+91 98765 43210',
    isActive: true,
  },
  'hod.eee@ksrct.ac.in': {
    id: 'hod-1',
    name: 'EEE HOD',
    email: 'hod.eee@ksrct.ac.in',
    role: 'HOD',
    department: 'Electrical and Electronics Engineering',
    phone: '+91 94433 11223',
    isActive: true,
  },
  'admin@ksrct.ac.in': {
    id: 'admin-1',
    name: 'System Administrator',
    email: 'admin@ksrct.ac.in',
    role: 'ADMIN',
    department: 'Administration',
    phone: '+91 94433 00000',
    isActive: true,
  },
};

const DEFAULT_CERTS: Certificate[] = [
  {
    id: 'cert-1',
    studentId: 'student-1',
    student: {
      id: 'student-1',
      name: 'Prasanna M',
      registerNumber: '22EE123',
      email: 'prasanna@student.ksrct.ac.in',
      department: 'Electrical and Electronics Engineering',
      year: 'III',
    },
    title: 'NPTEL - Internet of Things',
    category: 'NPTEL',
    description: '12-week NPTEL Online Certification Course completed with Elite status.',
    fileName: 'ksrct-campus.jpg',
    filePath: '/assets/ksrct-campus.jpg',
    fileType: 'image/jpeg',
    fileSize: 450000,
    status: 'APPROVED',
    issuedDate: '2026-07-20',
    uploadedAt: new Date('2026-07-21').toISOString(),
  },
  {
    id: 'cert-2',
    studentId: 'student-1',
    student: {
      id: 'student-1',
      name: 'Prasanna M',
      registerNumber: '22EE123',
      email: 'prasanna@student.ksrct.ac.in',
      department: 'Electrical and Electronics Engineering',
      year: 'III',
    },
    title: 'Summer Internship - SCG Exd Tech Pvt. Ltd.',
    category: 'Internship',
    description: 'Completed 4-week industrial training in embedded automation.',
    fileName: 'ksrct-campus.jpg',
    filePath: '/assets/ksrct-campus.jpg',
    fileType: 'image/jpeg',
    fileSize: 720000,
    status: 'PENDING',
    issuedDate: '2026-07-18',
    uploadedAt: new Date('2026-07-20').toISOString(),
  },
  {
    id: 'cert-3',
    studentId: 'student-1',
    student: {
      id: 'student-1',
      name: 'Prasanna M',
      registerNumber: '22EE123',
      email: 'prasanna@student.ksrct.ac.in',
      department: 'Electrical and Electronics Engineering',
      year: 'III',
    },
    title: 'Workshop on PLC & SCADA',
    category: 'Workshop',
    description: 'Hands-on technical workshop organized by IEEE Student Branch.',
    fileName: 'ksrct-campus.jpg',
    filePath: '/assets/ksrct-campus.jpg',
    fileType: 'image/jpeg',
    fileSize: 310000,
    status: 'APPROVED',
    issuedDate: '2026-07-15',
    uploadedAt: new Date('2026-07-16').toISOString(),
  },
  {
    id: 'cert-4',
    studentId: 'student-1',
    student: {
      id: 'student-1',
      name: 'Prasanna M',
      registerNumber: '22EE123',
      email: 'prasanna@student.ksrct.ac.in',
      department: 'Electrical and Electronics Engineering',
      year: 'III',
    },
    title: 'AICTE IDE Bootcamp',
    category: 'Hackathon',
    description: 'National Level Innovation Bootcamp runner-up.',
    fileName: 'ksrct-campus.jpg',
    filePath: '/assets/ksrct-campus.jpg',
    fileType: 'image/jpeg',
    fileSize: 512000,
    status: 'REJECTED',
    issuedDate: '2026-07-10',
    uploadedAt: new Date('2026-07-11').toISOString(),
    rejectionReason: 'Certificate seal is blurry. Please upload a clear high-resolution copy.',
  },
];

function getCerts(): Certificate[] {
  const saved = localStorage.getItem('ksrct_certs');
  if (saved) return JSON.parse(saved);
  localStorage.setItem('ksrct_certs', JSON.stringify(DEFAULT_CERTS));
  return DEFAULT_CERTS;
}

function setCerts(certs: Certificate[]) {
  localStorage.setItem('ksrct_certs', JSON.stringify(certs));
}

// Bulletproof API Client
export const api = {
  get: async (url: string, config?: any) => {
    // 1. Auth Me
    if (url.includes('/auth/me')) {
      const savedUser = localStorage.getItem('ksrct_user');
      const user = savedUser ? JSON.parse(savedUser) : DEMO_USERS['prasanna@student.ksrct.ac.in'];
      return { data: { success: true, user } };
    }

    // 2. Student Dashboard
    if (url.includes('/dashboard/student')) {
      const certs = getCerts();
      const myCerts = certs.filter((c) => c.studentId === 'student-1');
      return {
        data: {
          success: true,
          stats: {
            total: myCerts.length,
            approved: myCerts.filter((c) => c.status === 'APPROVED').length,
            pending: myCerts.filter((c) => c.status === 'PENDING').length,
            rejected: myCerts.filter((c) => c.status === 'REJECTED').length,
          },
          recentUploads: myCerts.slice(0, 5),
        },
      };
    }

    // 3. HOD Dashboard
    if (url.includes('/dashboard/hod')) {
      const certs = getCerts();
      const approved = certs.filter((c) => c.status === 'APPROVED').length;
      const pending = certs.filter((c) => c.status === 'PENDING').length;
      const rejected = certs.filter((c) => c.status === 'REJECTED').length;

      return {
        data: {
          success: true,
          stats: {
            totalStudents: 240,
            totalCertificates: certs.length,
            pending,
            approved,
            rejected,
          },
          charts: {
            statusOverview: [
              { name: 'Approved', value: approved, color: '#10b981' },
              { name: 'Pending', value: pending, color: '#f59e0b' },
              { name: 'Rejected', value: rejected, color: '#ef4444' },
            ],
            monthlyUploads: [
              { month: 'Jun', count: 45 },
              { month: 'Jul', count: 120 },
              { month: 'Aug', count: 85 },
            ],
            categoryDistribution: [
              { category: 'NPTEL', count: 42 },
              { category: 'Internship', count: 35 },
              { category: 'Workshop', count: 28 },
              { category: 'Hackathon', count: 15 },
            ],
          },
          recentActivities: [
            { id: '1', description: 'Prasanna M uploaded Internship Certificate', userName: 'Prasanna M', createdAt: new Date().toISOString() },
            { id: '2', description: 'EEE HOD approved NPTEL Certificate', userName: 'EEE HOD', createdAt: new Date().toISOString() },
          ],
        },
      };
    }

    // 4. Certificates List
    if (url.includes('/certificates') && !url.includes('/file')) {
      let certs = getCerts();
      const params = config?.params || {};

      if (params.status && params.status !== 'ALL') {
        certs = certs.filter((c) => c.status === params.status);
      }
      if (params.category && params.category !== 'ALL') {
        certs = certs.filter((c) => c.category === params.category);
      }
      if (params.search) {
        const q = params.search.toLowerCase();
        certs = certs.filter(
          (c) =>
            c.title.toLowerCase().includes(q) ||
            c.category.toLowerCase().includes(q) ||
            c.student?.name.toLowerCase().includes(q)
        );
      }

      return {
        data: {
          success: true,
          certificates: certs,
        },
      };
    }

    // 5. Users List
    if (url.includes('/users')) {
      return {
        data: {
          success: true,
          users: Object.values(DEMO_USERS),
        },
      };
    }

    // 6. Notifications
    if (url.includes('/notifications')) {
      return {
        data: {
          success: true,
          notifications: [
            {
              id: 'n1',
              title: 'Certificate Approved',
              message: 'Your NPTEL - Internet of Things certificate was verified and approved by EEE HOD.',
              type: 'SUCCESS',
              isRead: false,
              createdAt: new Date().toISOString(),
            },
            {
              id: 'n2',
              title: 'Action Required',
              message: 'AICTE IDE Bootcamp certificate was rejected due to blurry seal.',
              type: 'WARNING',
              isRead: false,
              createdAt: new Date().toISOString(),
            },
          ],
          unreadCount: 2,
        },
      };
    }

    // 7. Support Tickets
    if (url.includes('/support')) {
      return {
        data: {
          success: true,
          tickets: [
            {
              id: 't1',
              subject: 'Register Number Correction',
              message: 'My register number is showing 22EE123, please verify section mapping.',
              status: 'OPEN',
              createdAt: new Date().toISOString(),
              user: DEMO_USERS['prasanna@student.ksrct.ac.in'],
            },
          ],
        },
      };
    }

    // 8. Audit Logs
    if (url.includes('/audit-logs')) {
      return {
        data: {
          success: true,
          logs: [
            {
              id: 'al-1',
              userName: 'Prasanna M',
              action: 'CERTIFICATE_UPLOAD',
              description: 'Uploaded certificate "Summer Internship - SCG Exd Tech Pvt. Ltd."',
              ipAddress: '127.0.0.1',
              createdAt: new Date().toISOString(),
            },
            {
              id: 'al-2',
              userName: 'EEE HOD',
              action: 'CERTIFICATE_APPROVED',
              description: 'Approved certificate "NPTEL - Internet of Things" for Prasanna M',
              ipAddress: '127.0.0.1',
              createdAt: new Date().toISOString(),
            },
          ],
        },
      };
    }

    return { data: { success: true } };
  },

  post: async (url: string, data?: any, config?: any) => {
    // 1. Auth Login
    if (url.includes('/auth/login')) {
      const email = (data?.email || '').toLowerCase().trim();
      const user = DEMO_USERS[email] || {
        id: `user-${Date.now()}`,
        name: email.split('@')[0].toUpperCase(),
        email: email || 'student@ksrct.ac.in',
        role: email.includes('hod') ? 'HOD' : email.includes('admin') ? 'ADMIN' : 'STUDENT',
        department: 'Electrical and Electronics Engineering',
        year: 'III',
        registerNumber: '22EE123',
        phone: '+91 98765 43210',
        isActive: true,
      };

      return {
        data: {
          success: true,
          message: 'Login successful',
          token: `token-${user.id}`,
          user,
        },
      };
    }

    // 2. Upload Certificate
    if (url.includes('/certificates') && !url.includes('/approve') && !url.includes('/reject')) {
      const certs = getCerts();
      let title = 'Uploaded Certificate';
      let category: any = 'NPTEL';
      let issuedDate = new Date().toISOString().split('T')[0];

      if (data instanceof FormData) {
        title = (data.get('title') as string) || title;
        category = (data.get('category') as any) || category;
        issuedDate = (data.get('issuedDate') as string) || issuedDate;
      } else if (data) {
        title = data.title || title;
        category = data.category || category;
        issuedDate = data.issuedDate || issuedDate;
      }

      const newCert: Certificate = {
        id: `cert-${Date.now()}`,
        studentId: 'student-1',
        student: {
          id: 'student-1',
          name: 'Prasanna M',
          registerNumber: '22EE123',
          email: 'prasanna@student.ksrct.ac.in',
          department: 'Electrical and Electronics Engineering',
          year: 'III',
        },
        title,
        category,
        issuedDate,
        fileName: 'ksrct-campus.jpg',
        filePath: '/assets/ksrct-campus.jpg',
        fileType: 'image/jpeg',
        fileSize: 520000,
        status: 'PENDING',
        uploadedAt: new Date().toISOString(),
      };

      certs.unshift(newCert);
      setCerts(certs);

      return {
        data: {
          success: true,
          message: 'Certificate uploaded successfully.',
          certificate: newCert,
        },
      };
    }

    // 3. Approve Certificate
    if (url.includes('/approve')) {
      const parts = url.split('/');
      const id = parts[parts.indexOf('approve') - 1] || parts[2];
      const certs = getCerts();
      const idx = certs.findIndex((c) => c.id === id);
      if (idx !== -1) {
        certs[idx].status = 'APPROVED';
        certs[idx].verifiedAt = new Date().toISOString();
        setCerts(certs);
      }
      return { data: { success: true, message: 'Certificate approved successfully.' } };
    }

    // 4. Reject Certificate
    if (url.includes('/reject')) {
      const parts = url.split('/');
      const id = parts[parts.indexOf('reject') - 1] || parts[2];
      const certs = getCerts();
      const idx = certs.findIndex((c) => c.id === id);
      if (idx !== -1) {
        certs[idx].status = 'REJECTED';
        certs[idx].rejectionReason = data?.rejectionReason || 'Rejected by verifier.';
        setCerts(certs);
      }
      return { data: { success: true, message: 'Certificate rejected with remarks.' } };
    }

    // 5. Support Ticket Submission
    if (url.includes('/support')) {
      return { data: { success: true, message: 'Support ticket submitted.' } };
    }

    return { data: { success: true } };
  },

  patch: async (url: string, data?: any) => {
    if (url.includes('/users/profile')) {
      const saved = localStorage.getItem('ksrct_user');
      const current = saved ? JSON.parse(saved) : DEMO_USERS['prasanna@student.ksrct.ac.in'];
      const updated = { ...current, ...data };
      localStorage.setItem('ksrct_user', JSON.stringify(updated));
      return { data: { success: true, user: updated } };
    }
    return { data: { success: true } };
  },

  delete: async (url: string) => {
    if (url.includes('/certificates')) {
      const parts = url.split('/');
      const id = parts[parts.length - 1];
      const certs = getCerts().filter((c) => c.id !== id);
      setCerts(certs);
      return { data: { success: true, message: 'Certificate deleted.' } };
    }
    return { data: { success: true } };
  },
};

export default api;
