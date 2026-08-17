import axios from 'axios';
import { User, Certificate, NotificationItem, AuditLogItem, SupportTicket } from '../types';

const baseURL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 5000,
});

// Attach JWT token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('ksrct_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Demo In-Browser Storage Helper for Standalone Static Hosting
const DEMO_USERS: User[] = [
  {
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
  {
    id: 'hod-1',
    name: 'EEE HOD',
    email: 'hod.eee@ksrct.ac.in',
    role: 'HOD',
    department: 'Electrical and Electronics Engineering',
    phone: '+91 94433 11223',
    isActive: true,
  },
  {
    id: 'admin-1',
    name: 'System Administrator',
    email: 'admin@ksrct.ac.in',
    role: 'ADMIN',
    department: 'Administration',
    phone: '+91 94433 00000',
    isActive: true,
  },
];

const INITIAL_CERTS: Certificate[] = [
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
    description: '12-week NPTEL Online Certification completed with Elite status.',
    fileName: 'nptel_iot_cert.pdf',
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
    fileName: 'internship_cert.pdf',
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
    fileName: 'plc_workshop.pdf',
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
    fileName: 'aicte_bootcamp.pdf',
    filePath: '/assets/ksrct-campus.jpg',
    fileType: 'image/jpeg',
    fileSize: 512000,
    status: 'REJECTED',
    issuedDate: '2026-07-10',
    uploadedAt: new Date('2026-07-11').toISOString(),
    rejectionReason: 'Certificate seal is blurry. Please upload a clear high-resolution copy.',
  },
];

function getStoredCerts(): Certificate[] {
  const saved = localStorage.getItem('demo_certs');
  if (saved) return JSON.parse(saved);
  localStorage.setItem('demo_certs', JSON.stringify(INITIAL_CERTS));
  return INITIAL_CERTS;
}

function saveStoredCerts(certs: Certificate[]) {
  localStorage.setItem('demo_certs', JSON.stringify(certs));
}

// Smart Interceptor Fallback for Standalone Public Demo
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // If real backend call fails (network error / 404 on static host), handle gracefully in Demo Mode!
    const config = error.config;
    if (!config) return Promise.reject(error);

    const url = config.url || '';
    const method = (config.method || 'get').toLowerCase();

    // 1. Auth Login Fallback
    if (url.includes('/auth/login') && method === 'post') {
      const body = typeof config.data === 'string' ? JSON.parse(config.data) : config.data;
      const email = body?.email?.toLowerCase();
      const user = DEMO_USERS.find((u) => u.email.toLowerCase() === email) || DEMO_USERS[0];

      return Promise.resolve({
        data: {
          success: true,
          token: `demo-token-${user.id}`,
          user,
        },
      });
    }

    // 2. Auth Me Fallback
    if (url.includes('/auth/me') && method === 'get') {
      const savedUser = localStorage.getItem('ksrct_user');
      const user = savedUser ? JSON.parse(savedUser) : DEMO_USERS[0];
      return Promise.resolve({ data: { success: true, user } });
    }

    // 3. Student Dashboard Stats Fallback
    if (url.includes('/dashboard/student')) {
      const certs = getStoredCerts();
      const studentId = 'student-1';
      const myCerts = certs.filter((c) => c.studentId === studentId);

      return Promise.resolve({
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
      });
    }

    // 4. HOD Dashboard Stats Fallback
    if (url.includes('/dashboard/hod')) {
      const certs = getStoredCerts();
      const approved = certs.filter((c) => c.status === 'APPROVED').length;
      const pending = certs.filter((c) => c.status === 'PENDING').length;
      const rejected = certs.filter((c) => c.status === 'REJECTED').length;

      return Promise.resolve({
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
      });
    }

    // 5. Certificates List & Search Fallback
    if (url.includes('/certificates') && method === 'get' && !url.includes('/file')) {
      let certs = getStoredCerts();
      const params = config.params || {};

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

      return Promise.resolve({
        data: {
          success: true,
          certificates: certs,
        },
      });
    }

    // 6. Upload Certificate Fallback
    if (url.includes('/certificates') && method === 'post' && !url.includes('/approve') && !url.includes('/reject')) {
      const certs = getStoredCerts();
      let title = 'New Certificate';
      let category: any = 'NPTEL';
      let issuedDate = new Date().toISOString().split('T')[0];

      if (config.data instanceof FormData) {
        title = (config.data.get('title') as string) || title;
        category = (config.data.get('category') as any) || category;
        issuedDate = (config.data.get('issuedDate') as string) || issuedDate;
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
        fileName: 'certificate_upload.pdf',
        filePath: '/assets/ksrct-campus.jpg',
        fileType: 'image/jpeg',
        fileSize: 500000,
        status: 'PENDING',
        uploadedAt: new Date().toISOString(),
      };

      certs.unshift(newCert);
      saveStoredCerts(certs);

      return Promise.resolve({
        data: {
          success: true,
          message: 'Certificate uploaded successfully in Demo Mode.',
          certificate: newCert,
        },
      });
    }

    // 7. Approve Certificate Fallback
    if (url.includes('/approve') && method === 'post') {
      const id = url.split('/')[2];
      const certs = getStoredCerts();
      const idx = certs.findIndex((c) => c.id === id);
      if (idx !== -1) {
        certs[idx].status = 'APPROVED';
        certs[idx].verifiedAt = new Date().toISOString();
        saveStoredCerts(certs);
      }

      return Promise.resolve({
        data: {
          success: true,
          message: 'Certificate approved successfully.',
        },
      });
    }

    // 8. Reject Certificate Fallback
    if (url.includes('/reject') && method === 'post') {
      const id = url.split('/')[2];
      const body = typeof config.data === 'string' ? JSON.parse(config.data) : config.data;
      const certs = getStoredCerts();
      const idx = certs.findIndex((c) => c.id === id);
      if (idx !== -1) {
        certs[idx].status = 'REJECTED';
        certs[idx].rejectionReason = body?.rejectionReason || 'Rejected by verifier.';
        saveStoredCerts(certs);
      }

      return Promise.resolve({
        data: {
          success: true,
          message: 'Certificate rejected with remarks.',
        },
      });
    }

    // 9. Users Fallback
    if (url.includes('/users') && method === 'get') {
      return Promise.resolve({
        data: {
          success: true,
          users: DEMO_USERS,
        },
      });
    }

    // 10. Notifications Fallback
    if (url.includes('/notifications')) {
      return Promise.resolve({
        data: {
          success: true,
          notifications: [
            {
              id: 'n1',
              title: 'Certificate Approved',
              message: 'Your NPTEL - Internet of Things certificate was approved by EEE HOD.',
              type: 'SUCCESS',
              isRead: false,
              createdAt: new Date().toISOString(),
            },
            {
              id: 'n2',
              title: 'Rejection Remarks',
              message: 'AICTE IDE Bootcamp certificate was rejected due to blurry seal.',
              type: 'WARNING',
              isRead: false,
              createdAt: new Date().toISOString(),
            },
          ],
          unreadCount: 2,
        },
      });
    }

    // Default fallback
    return Promise.resolve({
      data: {
        success: true,
        message: 'Action completed in standalone demo mode.',
      },
    });
  }
);

export default api;
