import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Ensure uploads directory exists
  const uploadDir = path.join(__dirname, '../../uploads/certificates');
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  // Clear existing data
  await prisma.auditLog.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.certificate.deleteMany();
  await prisma.supportTicket.deleteMany();
  await prisma.user.deleteMany();
  await prisma.department.deleteMany();

  // Create Departments
  const deptEEE = await prisma.department.create({
    data: { name: 'Electrical and Electronics Engineering', code: 'EEE' },
  });
  await prisma.department.create({
    data: { name: 'Computer Science and Engineering', code: 'CSE' },
  });
  await prisma.department.create({
    data: { name: 'Electronics and Communication Engineering', code: 'ECE' },
  });
  await prisma.department.create({
    data: { name: 'Mechanical Engineering', code: 'MECH' },
  });

  // Password hashes
  const studentPasswordHash = await bcrypt.hash('Student@123', 10);
  const hodPasswordHash = await bcrypt.hash('Hod@123', 10);
  const adminPasswordHash = await bcrypt.hash('Admin@123', 10);

  // 1. Primary Demo Student - Prasanna M
  const prasanna = await prisma.user.create({
    data: {
      name: 'Prasanna M',
      email: 'prasanna@student.ksrct.ac.in',
      passwordHash: studentPasswordHash,
      role: 'STUDENT',
      department: 'Electrical and Electronics Engineering',
      year: 'III',
      registerNumber: '22EE123',
      phone: '+91 98765 43210',
      isActive: true,
    },
  });

  // Additional Students
  const rahul = await prisma.user.create({
    data: {
      name: 'Rahul R',
      email: 'rahul@student.ksrct.ac.in',
      passwordHash: studentPasswordHash,
      role: 'STUDENT',
      department: 'Electrical and Electronics Engineering',
      year: 'III',
      registerNumber: '22EE124',
      phone: '+91 98765 43211',
      isActive: true,
    },
  });

  const kavin = await prisma.user.create({
    data: {
      name: 'Kavin K',
      email: 'kavin@student.ksrct.ac.in',
      passwordHash: studentPasswordHash,
      role: 'STUDENT',
      department: 'Electrical and Electronics Engineering',
      year: 'II',
      registerNumber: '23EE045',
      phone: '+91 98765 43212',
      isActive: true,
    },
  });

  const divya = await prisma.user.create({
    data: {
      name: 'Divya S',
      email: 'divya@student.ksrct.ac.in',
      passwordHash: studentPasswordHash,
      role: 'STUDENT',
      department: 'Computer Science and Engineering',
      year: 'IV',
      registerNumber: '21CS089',
      phone: '+91 98765 43213',
      isActive: true,
    },
  });

  // 2. Demo HOD - EEE
  const hodEEE = await prisma.user.create({
    data: {
      name: 'EEE HOD',
      email: 'hod.eee@ksrct.ac.in',
      passwordHash: hodPasswordHash,
      role: 'HOD',
      department: 'Electrical and Electronics Engineering',
      phone: '+91 94433 11223',
      isActive: true,
    },
  });

  // Update department with HOD reference
  await prisma.department.update({
    where: { id: deptEEE.id },
    data: { hodId: hodEEE.id },
  });

  // 3. Demo Admin
  const admin = await prisma.user.create({
    data: {
      name: 'System Administrator',
      email: 'admin@ksrct.ac.in',
      passwordHash: adminPasswordHash,
      role: 'ADMIN',
      department: 'Administration',
      phone: '+91 94433 00000',
      isActive: true,
    },
  });

  // Create Sample Dummy File in uploads directory if not present
  const dummyCertFileName = 'sample_cert_demo.pdf';
  const dummyFilePath = path.join(uploadDir, dummyCertFileName);
  if (!fs.existsSync(dummyFilePath)) {
    fs.writeFileSync(dummyFilePath, '%PDF-1.4 Mock PDF Certificate for KSRCT Certificate Portal');
  }

  // Create Initial Seed Certificates for Prasanna
  await prisma.certificate.createMany({
    data: [
      {
        studentId: prasanna.id,
        title: 'NPTEL - Internet of Things',
        category: 'NPTEL',
        description: '12-week NPTEL Online Certification Course completed with Elite status.',
        fileName: dummyCertFileName,
        filePath: `/uploads/certificates/${dummyCertFileName}`,
        fileType: 'application/pdf',
        fileSize: 1024 * 450,
        status: 'APPROVED',
        issuedDate: '2026-07-20',
        uploadedAt: new Date('2026-07-21T10:00:00Z'),
        verifiedAt: new Date('2026-07-22T14:30:00Z'),
        verifiedById: hodEEE.id,
      },
      {
        studentId: prasanna.id,
        title: 'Summer Internship - SCG Exd Tech Pvt. Ltd.',
        category: 'Internship',
        description: 'Completed 4-week industrial internship on embedded system automation.',
        fileName: dummyCertFileName,
        filePath: `/uploads/certificates/${dummyCertFileName}`,
        fileType: 'application/pdf',
        fileSize: 1024 * 720,
        status: 'PENDING',
        issuedDate: '2026-07-18',
        uploadedAt: new Date('2026-07-20T11:15:00Z'),
      },
      {
        studentId: prasanna.id,
        title: 'Workshop on PLC & SCADA',
        category: 'Workshop',
        description: 'Two-day hands-on workshop organized by IEEE KSRCT Student Branch.',
        fileName: dummyCertFileName,
        filePath: `/uploads/certificates/${dummyCertFileName}`,
        fileType: 'application/pdf',
        fileSize: 1024 * 310,
        status: 'APPROVED',
        issuedDate: '2026-07-15',
        uploadedAt: new Date('2026-07-16T09:20:00Z'),
        verifiedAt: new Date('2026-07-17T11:00:00Z'),
        verifiedById: hodEEE.id,
      },
      {
        studentId: prasanna.id,
        title: 'AICTE IDE Bootcamp',
        category: 'Hackathon',
        description: 'National Level Innovation & Design Hackathon runner up.',
        fileName: dummyCertFileName,
        filePath: `/uploads/certificates/${dummyCertFileName}`,
        fileType: 'application/pdf',
        fileSize: 1024 * 512,
        status: 'REJECTED',
        issuedDate: '2026-07-10',
        uploadedAt: new Date('2026-07-11T16:45:00Z'),
        verifiedAt: new Date('2026-07-12T10:15:00Z'),
        verifiedById: hodEEE.id,
        rejectionReason: 'Certificate seal is blurry. Please upload a high-resolution clear scan copy.',
      },
      {
        studentId: prasanna.id,
        title: 'NSS Special Camp Participation',
        category: 'NSS',
        description: '7-day rural development camp held at Erode district.',
        fileName: dummyCertFileName,
        filePath: `/uploads/certificates/${dummyCertFileName}`,
        fileType: 'application/pdf',
        fileSize: 1024 * 280,
        status: 'APPROVED',
        issuedDate: '2026-07-05',
        uploadedAt: new Date('2026-07-06T08:30:00Z'),
        verifiedAt: new Date('2026-07-07T15:20:00Z'),
        verifiedById: hodEEE.id,
      },
    ],
  });

  // Seed certificates for Rahul
  await prisma.certificate.createMany({
    data: [
      {
        studentId: rahul.id,
        title: 'Electric Vehicle Design Workshop',
        category: 'Workshop',
        description: 'National level technical workshop on EV Powertrain architecture.',
        fileName: dummyCertFileName,
        filePath: `/uploads/certificates/${dummyCertFileName}`,
        fileType: 'application/pdf',
        fileSize: 1024 * 350,
        status: 'APPROVED',
        issuedDate: '2026-06-25',
        uploadedAt: new Date('2026-06-26T14:10:00Z'),
        verifiedAt: new Date('2026-06-28T09:30:00Z'),
        verifiedById: hodEEE.id,
      },
      {
        studentId: rahul.id,
        title: 'NPTEL - Power Electronics',
        category: 'NPTEL',
        description: '8-week online certification course.',
        fileName: dummyCertFileName,
        filePath: `/uploads/certificates/${dummyCertFileName}`,
        fileType: 'application/pdf',
        fileSize: 1024 * 600,
        status: 'PENDING',
        issuedDate: '2026-08-01',
        uploadedAt: new Date('2026-08-02T12:00:00Z'),
      },
    ],
  });

  // Seed certificates for Kavin
  await prisma.certificate.createMany({
    data: [
      {
        studentId: kavin.id,
        title: 'MATLAB Simulation Training',
        category: 'Technical',
        description: '30-hour course on Simulink and control systems.',
        fileName: dummyCertFileName,
        filePath: `/uploads/certificates/${dummyCertFileName}`,
        fileType: 'application/pdf',
        fileSize: 1024 * 420,
        status: 'PENDING',
        issuedDate: '2026-08-05',
        uploadedAt: new Date('2026-08-06T15:30:00Z'),
      },
    ],
  });

  // Seed Notifications
  await prisma.notification.createMany({
    data: [
      {
        userId: prasanna.id,
        title: 'Certificate Approved',
        message: 'Your certificate "NPTEL - Internet of Things" has been verified and approved by EEE HOD.',
        type: 'SUCCESS',
        isRead: false,
      },
      {
        userId: prasanna.id,
        title: 'Certificate Action Required',
        message: 'Your certificate "AICTE IDE Bootcamp" was rejected. Reason: Certificate seal is blurry. Please re-upload.',
        type: 'WARNING',
        isRead: false,
      },
      {
        userId: hodEEE.id,
        title: 'Pending Certificates Awaiting Review',
        message: 'You have 3 new certificate verification requests from students in your department.',
        type: 'INFO',
        isRead: false,
      },
    ],
  });

  // Seed Audit Logs
  await prisma.auditLog.createMany({
    data: [
      {
        userId: prasanna.id,
        userName: 'Prasanna M',
        action: 'CERTIFICATE_UPLOAD',
        entityType: 'Certificate',
        description: 'Uploaded certificate "Summer Internship - SCG Exd Tech Pvt. Ltd."',
        ipAddress: '127.0.0.1',
        createdAt: new Date('2026-07-20T11:15:00Z'),
      },
      {
        userId: hodEEE.id,
        userName: 'EEE HOD',
        action: 'CERTIFICATE_APPROVED',
        entityType: 'Certificate',
        description: 'Approved certificate "NPTEL - Internet of Things" for student Prasanna M',
        ipAddress: '127.0.0.1',
        createdAt: new Date('2026-07-22T14:30:00Z'),
      },
      {
        userId: hodEEE.id,
        userName: 'EEE HOD',
        action: 'CERTIFICATE_REJECTED',
        entityType: 'Certificate',
        description: 'Rejected certificate "AICTE IDE Bootcamp" for student Prasanna M (Blurry seal)',
        ipAddress: '127.0.0.1',
        createdAt: new Date('2026-07-12T10:15:00Z'),
      },
    ],
  });

  // Seed Support Ticket
  await prisma.supportTicket.create({
    data: {
      userId: prasanna.id,
      subject: 'Correction in Register Number',
      message: 'Hello Admin, my register number is showing 22EE123, please verify if my section is mapped correctly.',
      status: 'OPEN',
    },
  });

  console.log('✅ Database seed completed successfully!');
  console.log('🔑 Credentials summary:');
  console.log('   - Student: prasanna@student.ksrct.ac.in / Student@123');
  console.log('   - HOD:     hod.eee@ksrct.ac.in / Hod@123');
  console.log('   - Admin:   admin@ksrct.ac.in / Admin@123');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
