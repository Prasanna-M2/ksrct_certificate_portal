import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();
const EEE_DEPT = 'Electrical and Electronics Engineering';

async function main() {
  console.log('🧹 Purging and seeding KSRCT EEE Departmental Portal...');

  // Ensure uploads directory exists
  const uploadDir = path.join(__dirname, '../../uploads/certificates');
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  // Purge all data in foreign key safe order
  await prisma.approval.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.odRequest.deleteMany();
  await prisma.certificate.deleteMany();
  await prisma.certificateTemplate.deleteMany();
  await prisma.supportTicket.deleteMany();
  await prisma.advisorAssignment.deleteMany();
  await prisma.staffResponsibility.deleteMany();
  await prisma.user.deleteMany();
  await prisma.department.deleteMany();

  console.log('✅ Purged existing records.');

  // 1. Create EEE Department
  const dept = await prisma.department.create({
    data: {
      name: EEE_DEPT,
      code: 'EEE',
    },
  });

  const staffPasswordHash = await bcrypt.hash('Staff@123', 10);
  const studentPasswordHash = await bcrypt.hash('Student@123', 10);
  const creatorPasswordHash = await bcrypt.hash('Creator@123', 10);

  // 2. Master Creator
  const creator = await prisma.user.create({
    data: {
      name: 'Master Creator',
      email: 'creator@ksrct.ac.in',
      passwordHash: creatorPasswordHash,
      role: 'CREATOR',
      department: EEE_DEPT,
      phone: '+91 98422 11111',
      isActive: true,
    },
  });

  // 3. Exactly 1 Active HOD for EEE (also has MENTOR responsibility with own mentees)
  const hodUser = await prisma.user.create({
    data: {
      name: 'Dr. K. EEE HOD',
      email: 'hod@ksrct.ac.in',
      passwordHash: staffPasswordHash,
      role: 'STAFF',
      department: EEE_DEPT,
      phone: '+91 94433 88888',
      mentorCapacity: 6,
      isActive: true,
    },
  });

  // Link HOD in Department & StaffResponsibility
  await prisma.department.update({
    where: { id: dept.id },
    data: { hodId: hodUser.id },
  });

  await prisma.staffResponsibility.create({
    data: {
      staffId: hodUser.id,
      responsibility: 'HOD',
      department: EEE_DEPT,
      isActive: true,
    },
  });

  await prisma.staffResponsibility.create({
    data: {
      staffId: hodUser.id,
      responsibility: 'MENTOR',
      department: EEE_DEPT,
      isActive: true,
    },
  });

  // 4. Create Year Advisors (2 per year: I, II, III, IV)
  // Year I Advisors
  const adv1A = await prisma.user.create({
    data: { name: 'Dr. M. Senthil (Advisor Year I-A)', email: 'advisor1a@ksrct.ac.in', passwordHash: staffPasswordHash, role: 'STAFF', department: EEE_DEPT, phone: '+91 98422 10001', isActive: true },
  });
  const adv1B = await prisma.user.create({
    data: { name: 'Dr. P. Gomathi (Advisor Year I-B)', email: 'advisor1b@ksrct.ac.in', passwordHash: staffPasswordHash, role: 'STAFF', department: EEE_DEPT, phone: '+91 98422 10002', isActive: true },
  });

  // Year II Advisors
  const adv2A = await prisma.user.create({
    data: { name: 'Dr. R. Karthik (Advisor Year II-A)', email: 'advisor2a@ksrct.ac.in', passwordHash: staffPasswordHash, role: 'STAFF', department: EEE_DEPT, phone: '+91 98422 20001', isActive: true },
  });
  const adv2B = await prisma.user.create({
    data: { name: 'Dr. N. Balamurugan (Advisor Year II-B)', email: 'advisor2b@ksrct.ac.in', passwordHash: staffPasswordHash, role: 'STAFF', department: EEE_DEPT, phone: '+91 98422 20002', isActive: true },
  });

  // Year III Advisors (adv3A also acts as Mentor for special multi-responsibility testing!)
  const adv3A = await prisma.user.create({
    data: { name: 'Dr. Venkatesan (Advisor Year III-A & Mentor)', email: 'advisor@ksrct.ac.in', passwordHash: staffPasswordHash, role: 'STAFF', department: EEE_DEPT, phone: '+91 98422 30001', mentorCapacity: 6, isActive: true },
  });
  const adv3B = await prisma.user.create({
    data: { name: 'Dr. S. Sundaram (Advisor Year III-B)', email: 'advisor3b@ksrct.ac.in', passwordHash: staffPasswordHash, role: 'STAFF', department: EEE_DEPT, phone: '+91 98422 30002', isActive: true },
  });

  // Year IV Advisors
  const adv4A = await prisma.user.create({
    data: { name: 'Dr. C. Rajesh (Advisor Year IV-A)', email: 'advisor4a@ksrct.ac.in', passwordHash: staffPasswordHash, role: 'STAFF', department: EEE_DEPT, phone: '+91 98422 40001', isActive: true },
  });
  const adv4B = await prisma.user.create({
    data: { name: 'Dr. A. Meenakshi (Advisor Year IV-B)', email: 'advisor4b@ksrct.ac.in', passwordHash: staffPasswordHash, role: 'STAFF', department: EEE_DEPT, phone: '+91 98422 40002', isActive: true },
  });

  // 5. Additional Dedicated Faculty Mentors
  const mentor1 = await prisma.user.create({
    data: { name: 'Prof. R. Faculty Mentor', email: 'mentor@ksrct.ac.in', passwordHash: staffPasswordHash, role: 'STAFF', department: EEE_DEPT, phone: '+91 94433 99991', mentorCapacity: 6, isActive: true },
  });
  const mentor2 = await prisma.user.create({
    data: { name: 'Prof. K. Anand (Mentor B)', email: 'mentor2@ksrct.ac.in', passwordHash: staffPasswordHash, role: 'STAFF', department: EEE_DEPT, phone: '+91 94433 99992', mentorCapacity: 6, isActive: true },
  });

  // Assign Staff Responsibilities & Advisor Assignments
  const allAdvisorsWithYears = [
    { staff: adv1A, year: 'I', section: 'A' },
    { staff: adv1B, year: 'I', section: 'B' },
    { staff: adv2A, year: 'II', section: 'A' },
    { staff: adv2B, year: 'II', section: 'B' },
    { staff: adv3A, year: 'III', section: 'A' },
    { staff: adv3B, year: 'III', section: 'B' },
    { staff: adv4A, year: 'IV', section: 'A' },
    { staff: adv4B, year: 'IV', section: 'B' },
  ];

  for (const item of allAdvisorsWithYears) {
    await prisma.staffResponsibility.create({
      data: { staffId: item.staff.id, responsibility: 'ADVISOR', department: EEE_DEPT, isActive: true },
    });
    await prisma.advisorAssignment.create({
      data: { staffId: item.staff.id, year: item.year, section: item.section, department: EEE_DEPT, isActive: true },
    });
  }

  // Assign Mentor responsibilities
  await prisma.staffResponsibility.create({
    data: { staffId: adv3A.id, responsibility: 'MENTOR', department: EEE_DEPT, isActive: true },
  });
  await prisma.staffResponsibility.create({
    data: { staffId: mentor1.id, responsibility: 'MENTOR', department: EEE_DEPT, isActive: true },
  });
  await prisma.staffResponsibility.create({
    data: { staffId: mentor2.id, responsibility: 'MENTOR', department: EEE_DEPT, isActive: true },
  });

  // 6. Create Students for Years I, II, III, IV
  // Student 1 (Year III, Mentor: mentor1, Advisor: adv3A)
  const student1 = await prisma.user.create({
    data: {
      name: 'Prasanna M',
      email: 'student1@ksrct.ac.in',
      passwordHash: studentPasswordHash,
      role: 'STUDENT',
      department: EEE_DEPT,
      year: 'III',
      section: 'A',
      registerNumber: '24EE042',
      rollNumber: '24EE042',
      stayType: 'DAY_SCHOLAR',
      semester: 'V',
      phone: '+91 98765 43210',
      mentorId: mentor1.id,
      advisorId: adv3A.id,
      isActive: true,
    },
  });

  // Student 2 (Year II, Mentor: mentor1, Advisor: adv2A)
  const student2 = await prisma.user.create({
    data: {
      name: 'Kavitha S',
      email: 'student2@ksrct.ac.in',
      passwordHash: studentPasswordHash,
      role: 'STUDENT',
      department: EEE_DEPT,
      year: 'II',
      section: 'A',
      registerNumber: '24EE043',
      rollNumber: '24EE043',
      stayType: 'HOSTELLER',
      semester: 'III',
      phone: '+91 98765 43211',
      mentorId: mentor1.id,
      advisorId: adv2A.id,
      isActive: true,
    },
  });

  // Student 3 (Year III, Mentor: adv3A [Mentor + Advisor is SAME!], Advisor: adv3A)
  const student3 = await prisma.user.create({
    data: {
      name: 'Arun Kumar',
      email: 'student3@ksrct.ac.in',
      passwordHash: studentPasswordHash,
      role: 'STUDENT',
      department: EEE_DEPT,
      year: 'III',
      section: 'A',
      registerNumber: '24EE044',
      rollNumber: '24EE044',
      stayType: 'DAY_SCHOLAR',
      semester: 'V',
      phone: '+91 98765 43212',
      mentorId: adv3A.id,
      advisorId: adv3A.id,
      isActive: true,
    },
  });

  // Student 4 (Year IV, Mentor: hodUser [HOD is Mentor], Advisor: adv4A)
  const student4 = await prisma.user.create({
    data: {
      name: 'Deepa V',
      email: 'student4@ksrct.ac.in',
      passwordHash: studentPasswordHash,
      role: 'STUDENT',
      department: EEE_DEPT,
      year: 'IV',
      section: 'A',
      registerNumber: '24EE045',
      rollNumber: '24EE045',
      stayType: 'HOSTELLER',
      semester: 'VII',
      phone: '+91 98765 43213',
      mentorId: hodUser.id,
      advisorId: adv4A.id,
      isActive: true,
    },
  });

  // 7. Seed Sample Requests across Workflow Stages
  // Certificate 1: in MENTOR_REVIEW stage
  const cert1 = await prisma.certificate.create({
    data: {
      certificateId: 'CERT-2026-0001',
      studentId: student1.id,
      title: 'NPTEL Online Certification - Electric Vehicles',
      category: 'NPTEL',
      eventName: 'NPTEL 8-Week Course',
      organization: 'IIT Madras',
      eventDate: '2026-07-15',
      issuedDate: '2026-08-01',
      description: 'Scored 85% Elite+Gold in Electric Vehicles & Energy Storage Systems.',
      fileName: 'nptel_ev_cert.pdf',
      filePath: '/uploads/certificates/sample_cert.pdf',
      fileType: 'application/pdf',
      fileSize: 245000,
      status: 'SUBMITTED',
      currentStage: 'MENTOR_REVIEW',
    },
  });

  // Certificate 2: in ADVISOR_REVIEW stage (Student 2)
  const cert2 = await prisma.certificate.create({
    data: {
      certificateId: 'CERT-2026-0002',
      studentId: student2.id,
      title: 'Workshop on IoT in Power Systems',
      category: 'Workshop',
      eventName: 'National Tech Symposium',
      organization: 'NIT Trichy',
      eventDate: '2026-08-05',
      issuedDate: '2026-08-06',
      description: 'Hands-on training in smart grid communications.',
      fileName: 'iot_power_cert.pdf',
      filePath: '/uploads/certificates/sample_cert.pdf',
      fileType: 'application/pdf',
      fileSize: 185000,
      status: 'ADVISOR_REVIEW',
      currentStage: 'ADVISOR_REVIEW',
      mentorRemarks: 'Verified participation and grade. Recommended for approval.',
    },
  });

  // OD Request 1: in MENTOR_REVIEW stage
  const od1 = await prisma.odRequest.create({
    data: {
      odId: 'OD-2026-0001',
      requestType: 'EVENT_OD',
      studentId: student1.id,
      studentName: student1.name,
      registerNumber: '24EE042',
      rollNumber: '24EE042',
      department: EEE_DEPT,
      year: 'III',
      section: 'A',
      semester: 'V',
      stayType: 'DAY_SCHOLAR',
      eventName: 'National Paper Presentation Contest',
      eventType: 'Technical',
      organization: 'IEEE Student Branch',
      venue: 'KSRCT Main Auditorium',
      odDate: '2026-08-25',
      startTime: '09:00 AM',
      endTime: '05:00 PM',
      numberOfDays: 1,
      purpose: 'Presenting research paper on Smart Microgrids',
      description: 'Selected for final round of IEEE State Level Symposium',
      coordinator: 'Dr. S. Sundaram',
      status: 'SUBMITTED',
      currentStage: 'MENTOR_REVIEW',
      mentorId: mentor1.id,
      advisorId: adv3A.id,
    },
  });

  // Seed Initial Approval and Audit logs
  await prisma.approval.create({
    data: {
      requestType: 'CERTIFICATE',
      requestId: cert1.id,
      approverId: student1.id,
      approverName: student1.name,
      approverRole: 'STUDENT',
      action: 'SUBMITTED',
      previousStatus: 'DRAFT',
      newStatus: 'MENTOR_REVIEW',
      remarks: 'Initial Submission',
    },
  });

  await prisma.approval.create({
    data: {
      requestType: 'CERTIFICATE',
      requestId: cert2.id,
      approverId: mentor1.id,
      approverName: mentor1.name,
      approverRole: 'MENTOR',
      action: 'APPROVED',
      previousStatus: 'MENTOR_REVIEW',
      newStatus: 'ADVISOR_REVIEW',
      remarks: 'Verified participation and grade. Recommended for approval.',
    },
  });

  await prisma.approval.create({
    data: {
      requestType: 'OD',
      requestId: od1.id,
      approverId: student1.id,
      approverName: student1.name,
      approverRole: 'STUDENT',
      action: 'SUBMITTED',
      previousStatus: 'DRAFT',
      newStatus: 'MENTOR_REVIEW',
      remarks: 'Initial Submission',
    },
  });

  await prisma.auditLog.create({
    data: {
      userId: student1.id,
      userName: student1.name,
      userRole: 'STUDENT',
      requestType: 'CERTIFICATE',
      requestId: cert1.certificateId,
      action: 'CERTIFICATE_SUBMITTED',
      description: `Submitted Certificate ${cert1.certificateId}`,
    },
  });

  await prisma.auditLog.create({
    data: {
      userId: mentor1.id,
      userName: mentor1.name,
      userRole: 'MENTOR',
      requestType: 'CERTIFICATE',
      requestId: cert2.certificateId,
      action: 'MENTOR_APPROVED',
      previousStatus: 'MENTOR_REVIEW',
      newStatus: 'ADVISOR_REVIEW',
      description: `Mentor ${mentor1.name} approved Certificate ${cert2.certificateId}`,
    },
  });

  console.log('✅ Seed completed successfully with EEE structure (1 HOD, 2 Advisors/year, Mentors, Students, Requests).');
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
