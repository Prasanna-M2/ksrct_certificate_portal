import { prisma } from '../src/utils/prisma';
import bcrypt from 'bcryptjs';
import fs from 'fs';
import path from 'path';

const EEE_DEPT = 'Electrical and Electronics Engineering';

// Official EEE Faculty Members list from Department Records
const facultyMembers = [
  { name: 'Dr. Gopalakrishnan R', email: 'gopalakrishnan@ksrct.ac.in', phone: '+91 9994150505' },
  { name: 'Dr. SriVidhya D', email: 'srividhya@ksrct.ac.in', phone: '+91 9952134526' },
  { name: 'Dr. Vijayagowri G', email: 'vijayagowri@ksrct.ac.in', phone: '+91 9442258906' },
  { name: 'Dr. Aravindan P', email: 'aravindan@ksrct.ac.in', phone: '+91 9952425269' },
  { name: 'Dr. Venkatesan T', email: 'venkatesan@ksrct.ac.in', phone: '+91 9942012455' },
  { name: 'Dr. Balamurugan R', email: 'balamurugan@ksrct.ac.in', phone: '+91 9790031900' },
  { name: 'Dr. R. Banupriya', email: 'banupriya@ksrct.ac.in', phone: '+91 7339561617' },
  { name: 'Mr. Thangadurai A', email: 'thangadurai@ksrct.ac.in', phone: '+91 9095322233' },
  { name: 'Mr. Srinivasan S', email: 'srinivasan@ksrct.ac.in', phone: '+91 9994143687' },
  { name: 'Ms. Kayalvizhi N', email: 'kayalvizhi@ksrct.ac.in', phone: '+91 9994547837' },
  { name: 'Ms. Radhamani R', email: 'radhamani@ksrct.ac.in', phone: '+91 9543167875' },
  { name: 'Mr. Rajasekaran N', email: 'rajasekaran@ksrct.ac.in', phone: '+91 8056975723' },
  { name: 'Ms. Jaividhya S', email: 'jaividhya@ksrct.ac.in', phone: '+91 9585304763' },
  { name: 'Mr. Dhanapal M', email: 'dhanapal@ksrct.ac.in', phone: '+91 8012181649' },
  { name: 'Mr. Chandra Kumar E', email: 'chandrakumar@ksrct.ac.in', phone: '+91 9360850480' },
  { name: 'Mr. Karthik P', email: 'karthik@ksrct.ac.in', phone: '+91 6380324452' },
  { name: 'Dr. Rajasekaran C', email: 'rajasekarc@ksrct.ac.in', phone: '+91 9942483404' },
];

// Official Students List (2025-29 Batch) – II Year (63 Students)
const year2Students = [
  { regNo: '2503737710521001', name: 'ABDUL RAHMAN R' },
  { regNo: '2503737710521002', name: 'ARUL S' },
  { regNo: '2503737710521003', name: 'ARUN KUMAR D' },
  { regNo: '2503737710521004', name: 'BENET JEFRI A' },
  { regNo: '2503737710521005', name: 'BHARATHKUMAR S' },
  { regNo: '2503737710521006', name: 'BHUBESH R' },
  { regNo: '2503737710521007', name: 'DEEPAK P' },
  { regNo: '2503737710521008', name: 'DHAMODHARAN P' },
  { regNo: '2503737710521009', name: 'DHARANI K S' },
  { regNo: '2503737710521010', name: 'DHIVAGAR T' },
  { regNo: '2503737710521011', name: 'DHIVAKAR M' },
  { regNo: '2503737710521012', name: 'GOPINATH S' },
  { regNo: '2503737710521013', name: 'HARILAXSMAN J' },
  { regNo: '2503737710521014', name: 'HARIPRAKASH N' },
  { regNo: '2503737710521015', name: 'HARISHKUMAR K' },
  { regNo: '2503737710521016', name: 'HEMANT V' },
  { regNo: '2503737710521017', name: 'INBA K' },
  { regNo: '2503737710521018', name: 'KAVIN A' },
  { regNo: '2503737710521019', name: 'KAVINILAVAN G A' },
  { regNo: '2503737710521020', name: 'KEERTHIPRANAV L' },
  { regNo: '2503737710521021', name: 'LINGESHWARAN K' },
  { regNo: '2503737710521022', name: 'MOHANASUDHAN K K' },
  { regNo: '2503737710521023', name: 'MUTHARASU R' },
  { regNo: '2503737710521024', name: 'NALLASHAAMI K B' },
  { regNo: '2503737710521025', name: 'NAVEEN KUMAR P' },
  { regNo: '2503737710521026', name: 'PANAIYAPPAN R S' },
  { regNo: '2503737710521027', name: 'PRAGATHEESH S' },
  { regNo: '2503737710521028', name: 'RAGAVAN K' },
  { regNo: '2503737710521029', name: 'RAHUL V' },
  { regNo: '2503737710521030', name: 'SABTHAGIRI A' },
  { regNo: '2503737710521031', name: 'SANJAY S' },
  { regNo: '2503737710521032', name: 'SANTHOSH G' },
  { regNo: '2503737710521033', name: 'SANTHOSHKUMAR S' },
  { regNo: '2503737710521034', name: 'SANTHOSH M' },
  { regNo: '2503737710521035', name: 'SHARUKESH K' },
  { regNo: '2503737710521036', name: 'SHYAM SUNDAR S' },
  { regNo: '2503737710521037', name: 'SIDDHARTH K' },
  { regNo: '2503737710521038', name: 'SRINIVASAN S' },
  { regNo: '2503737710521039', name: 'SRIRAM D' },
  { regNo: '2503737710521040', name: 'SRITHAR S' },
  { regNo: '2503737710521041', name: 'SUDHARSAN M' },
  { regNo: '2503737710521042', name: 'SUGAS D' },
  { regNo: '2503737710521043', name: 'THIRUMURUGAN A' },
  { regNo: '2503737710522044', name: 'BHAVADHARANI R' },
  { regNo: '2503737710522045', name: 'DEEPIKA S' },
  { regNo: '2503737710522046', name: 'HARINI SHREE S' },
  { regNo: '2503737710522047', name: 'INDUREEGHA M' },
  { regNo: '2503737710522048', name: 'KAVYASHREE K' },
  { regNo: '2503737710522049', name: 'KIRUTHISHA V' },
  { regNo: '2503737710522050', name: 'KRISHNIKKA M K' },
  { regNo: '2503737710522051', name: 'MANISHA K' },
  { regNo: '2503737710522052', name: 'NITHIYASRI S' },
  { regNo: '2503737710522053', name: 'NIVETHA K' },
  { regNo: '2503737710522054', name: 'RETHIKA SRI C' },
  { regNo: '2503737710522055', name: 'SANJITHA K' },
  { regNo: '2503737710522056', name: 'SARIDHA B' },
  { regNo: '2503737710522057', name: 'SASMITHA P K' },
  { regNo: '2503737710522058', name: 'SHANGIRUTHI M' },
  { regNo: '2503737710522059', name: 'SRIMATHI P' },
  { regNo: '2503737710522060', name: 'SUBIKSHA A' },
  { regNo: '2503737710522061', name: 'SUTHEKSHA PUNITHAN' },
  { regNo: '2503737710522062', name: 'SWATHI S' },
  { regNo: '2503737710522063', name: 'SWATI R M' },
];

// Official Students List (2024-28 Batch) – III Year (64 Students)
const year3Students = [
  { regNo: '2403737710521001', name: 'AADHITHYA D' },
  { regNo: '2403737710521002', name: 'AKILESH KUMAR K' },
  { regNo: '2403737710521004', name: 'CHANDRU S' },
  { regNo: '2403737710521005', name: 'DEEPAK V' },
  { regNo: '2403737710521006', name: 'DHARSANBALA U E' },
  { regNo: '2403737710521007', name: 'DHARSHAN B' },
  { regNo: '2403737710521008', name: 'DHARSHAN P' },
  { regNo: '2403737710521010', name: 'DINESH SAKTHIVEL B' },
  { regNo: '2403737710521011', name: 'GIRIRAAJAN S' },
  { regNo: '2403737710521012', name: 'GOWRI SHANKAR M' },
  { regNo: '2403737710521013', name: 'HARESH G' },
  { regNo: '2403737710521014', name: 'HARIGARAN S' },
  { regNo: '2403737710521015', name: 'HARIPRASATH T' },
  { regNo: '2403737710521016', name: 'HARSHVARTHAN A' },
  { regNo: '2403737710521017', name: 'JEEVA G' },
  { regNo: '2403737710521018', name: 'JOTHIESWARAN M' },
  { regNo: '2403737710521019', name: 'KALAIYARASAN M' },
  { regNo: '2403737710521020', name: 'KAMALKANTH K' },
  { regNo: '2403737710521021', name: 'KAVI DHARSHAN A' },
  { regNo: '2403737710521022', name: 'KAVIN G' },
  { regNo: '2403737710521023', name: 'KRISHNAMOORTHI S' },
  { regNo: '2403737710521024', name: 'LOGITH B' },
  { regNo: '2403737710521025', name: 'MADHANKUMAR S' },
  { regNo: '2403737710521026', name: 'MANISH M' },
  { regNo: '2403737710521027', name: 'MOHNISH SANJAI S J' },
  { regNo: '2403737710521028', name: 'MUHILDHARSHAN L' },
  { regNo: '2403737710521031', name: 'PAVIN KUMAR T' },
  { regNo: '2403737710521032', name: 'POOMUGILAN K' },
  { regNo: '2403737710521033', name: 'PRADEEP S' },
  { regNo: '2403737710521034', name: 'PRASANNA M' },
  { regNo: '2403737710521035', name: 'SAKTHIPRIYAN C' },
  { regNo: '2403737710521036', name: 'SANTHOSH K' },
  { regNo: '2403737710521037', name: 'SARAVANAKUMAR K M' },
  { regNo: '2403737710521038', name: 'SARAVANAN B' },
  { regNo: '2403737710521039', name: 'SRI VISHNUPRASATH S' },
  { regNo: '2403737710521040', name: 'SRIDHARAN B' },
  { regNo: '2403737710521041', name: 'VELMURUGAN R' },
  { regNo: '2403737710521042', name: 'VIJAY ANAND S' },
  { regNo: '2403737710521301', name: 'ASVIN V' },
  { regNo: '2403737710521302', name: 'DHAANU PRASATH P V' },
  { regNo: '2403737710521303', name: 'DHARNISH A' },
  { regNo: '2403737710521304', name: 'DHIVAKARAN P' },
  { regNo: '2403737710521305', name: 'JAIRUS JEBASINGH J' },
  { regNo: '2403737710521306', name: 'JAYAPRAKASH R' },
  { regNo: '2403737710521307', name: 'KANISH A' },
  { regNo: '2403737710521308', name: 'PRAVIN M' },
  { regNo: '2403737710521701', name: 'HARIKRISHNAN C' },
  { regNo: '2403737710522043', name: 'ABINAYA G' },
  { regNo: '2403737710522044', name: 'AMSHAVARTHANA R' },
  { regNo: '2403737710522045', name: 'DHAARSHINI A S' },
  { regNo: '2403737710522046', name: 'DHARSENI SANTHIYA SAMPATH KUMAR' },
  { regNo: '2403737710522047', name: 'DHARSHIKA N' },
  { regNo: '2403737710522048', name: 'DHARSHINI G' },
  { regNo: '2403737710522049', name: 'GOKULADHARSHINI B' },
  { regNo: '2403737710522050', name: 'HEMA VARDHINI S P' },
  { regNo: '2403737710522051', name: 'INDHUSRI R' },
  { regNo: '2403737710522052', name: 'KARTHICKA S' },
  { regNo: '2403737710522053', name: 'KOWSIKA M' },
  { regNo: '2403737710522054', name: 'MAHITHA P' },
  { regNo: '2403737710522055', name: 'NIRMALA D V' },
  { regNo: '2403737710522056', name: 'RAMYA T' },
  { regNo: '2403737710522057', name: 'RITHIKA G' },
  { regNo: '2403737710522058', name: 'SAHANA G P' },
  { regNo: '2403737710522059', name: 'SRIDHARSHANA M' },
];

// Official Students List (2023-27 Batch) – IV Year (69 Students)
const year4Students = [
  { regNo: '2303737710521001', name: 'AADITHYA N' },
  { regNo: '2303737710521002', name: 'ARUN M' },
  { regNo: '2303737710521003', name: 'BHARATHRAM R' },
  { regNo: '2303737710521004', name: 'DHANUSH KUMAR P' },
  { regNo: '2303737710521005', name: 'DINESH M' },
  { regNo: '2303737710521006', name: 'GOKUL P K' },
  { regNo: '2303737710521007', name: 'GOKULABALAJI G' },
  { regNo: '2303737710521008', name: 'GOWTHAM KOUSIK M' },
  { regNo: '2303737710521009', name: 'GOWTHAM S' },
  { regNo: '2303737710521010', name: 'HARISHRAJ V' },
  { regNo: '2303737710521011', name: 'HARISHWARAN R' },
  { regNo: '2303737710521012', name: 'JAIKRISHNA R' },
  { regNo: '2303737710521013', name: 'JANARTHAN M' },
  { regNo: '2303737710521014', name: 'KALAIYARASAN R V' },
  { regNo: '2303737710521015', name: 'KARMUHILAN V' },
  { regNo: '2303737710521016', name: 'KAVIN T' },
  { regNo: '2303737710521017', name: 'LOKESH P' },
  { regNo: '2303737710521018', name: 'MADHANRAJ P' },
  { regNo: '2303737710521019', name: 'MADHUMOHAN M' },
  { regNo: '2303737710521020', name: 'MATHAN P' },
  { regNo: '2303737710521021', name: 'MOTUPALLI SHEKAR' },
  { regNo: '2303737710521022', name: 'MUJAMIL S' },
  { regNo: '2303737710521023', name: 'NAVANESH D' },
  { regNo: '2303737710521024', name: 'OBULI SANJAY M' },
  { regNo: '2303737710521025', name: 'PIRITHIVRAJAN M' },
  { regNo: '2303737710521026', name: 'POOVARASAN S' },
  { regNo: '2303737710521027', name: 'POTHEESWARAN K' },
  { regNo: '2303737710521028', name: 'PRANEESH M' },
  { regNo: '2303737710521029', name: 'PRIYADHARSHAN K' },
  { regNo: '2303737710521030', name: 'RAGAVAN G' },
  { regNo: '2303737710521031', name: 'RAHUL M' },
  { regNo: '2303737710521032', name: 'RENNY SHERRWIN M' },
  { regNo: '2303737710521033', name: 'SABARI M' },
  { regNo: '2303737710521034', name: 'SAKTHIVEL B' },
  { regNo: '2303737710521035', name: 'SAKTHIVEL P' },
  { regNo: '2303737710521036', name: 'SANTHOSH A P' },
  { regNo: '2303737710521037', name: 'SHABARIVAS K R' },
  { regNo: '2303737710521038', name: 'SUJAYSARVESH D' },
  { regNo: '2303737710521039', name: 'SURENDHAR S' },
  { regNo: '2303737710521040', name: 'THARESHWARAN M.S' },
  { regNo: '2303737710521041', name: 'THIRU SELVAM S' },
  { regNo: '2303737710521042', name: 'VAARUN R' },
  { regNo: '2303737710521043', name: 'VENU PRAGASH V' },
  { regNo: '2303737710521044', name: 'VIJAYARASU K' },
  { regNo: '2303737710521045', name: 'VISHWA G' },
  { regNo: '2303737710522046', name: 'ABINAYA R' },
  { regNo: '2303737710522047', name: 'ABITHA P' },
  { regNo: '2303737710522048', name: 'ANU M' },
  { regNo: '2303737710522049', name: 'BHOOMIKA J S' },
  { regNo: '2303737710522050', name: 'CHANDIKA B' },
  { regNo: '2303737710522051', name: 'HEMADHARSHINI S' },
  { regNo: '2303737710522052', name: 'INIYA VARSHINI U' },
  { regNo: '2303737710522053', name: 'MAITHILI S' },
  { regNo: '2303737710522054', name: 'MAITHREYA S' },
  { regNo: '2303737710522055', name: 'NITHYA R' },
  { regNo: '2303737710522056', name: 'PAVITHRA J' },
  { regNo: '2303737710522057', name: 'RITHANASHRI M' },
  { regNo: '2303737710522058', name: 'ROHINI P' },
  { regNo: '2303737710522059', name: 'SARANYA S P' },
  { regNo: '2303737710522060', name: 'SATHIYABHARATHI PALANISAMY' },
  { regNo: '2303737710522061', name: 'SOWMITHA R' },
  { regNo: '2303737710522062', name: 'SRI SANKARI S' },
  { regNo: '2303737710522063', name: 'SWATHI C' },
  { regNo: '2303737710521301', name: 'KALAIYARASU D' },
  { regNo: '2303737710521302', name: 'KAMARAJ M' },
  { regNo: '2303737710521303', name: 'KIRITHARAN J' },
  { regNo: '2303737710521304', name: 'LIGNESH S B' },
  { regNo: '2303737710521305', name: 'THANNVIK ARIYA S' },
  { regNo: '2303737710521306', name: 'VISHWANATHAN K' },
];

async function main() {
  console.log('🧹 Seeding official EEE Faculty and Students into portal...');

  // Ensure uploads directory exists
  const uploadDir = path.join(__dirname, '../../uploads/certificates');
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  // Purge all existing data in foreign key safe order
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

  console.log('✅ Purged previous records.');

  // 1. Create EEE Department
  await prisma.department.create({
    data: {
      name: EEE_DEPT,
      code: 'EEE',
    },
  });

  // 2. Create Master Creator Account
  const creatorPasswordHash = await bcrypt.hash('Creator@123', 10);
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

  // 3. Create Official EEE Faculty Members
  const defaultStaffPasswordHash = await bcrypt.hash('Staff@123', 10);

  for (const faculty of facultyMembers) {
    const isHod = faculty.name.includes('Gopalakrishnan') || faculty.email.includes('gopalakrishnan');
    const advisoryYear = faculty.name.includes('SriVidhya')
      ? 'II'
      : faculty.name.includes('Vijayagowri')
      ? 'III'
      : faculty.name.includes('Aravindan')
      ? 'IV'
      : null;
    const role = isHod ? 'HOD' : 'STAFF';

    const createdFaculty = await prisma.user.create({
      data: {
        name: faculty.name,
        email: faculty.email,
        passwordHash: defaultStaffPasswordHash,
        role,
        department: EEE_DEPT,
        phone: faculty.phone,
        rollNumber: (faculty as any).rollNumber || null,
        mentorCapacity: 24,
        isActive: true,
      },
    });

    if (isHod) {
      await prisma.staffResponsibility.create({
        data: {
          staffId: createdFaculty.id,
          responsibility: 'HOD',
          department: EEE_DEPT,
          isActive: true,
        },
      });
    } else {
      await prisma.staffResponsibility.create({
        data: {
          staffId: createdFaculty.id,
          responsibility: 'ADVISOR',
          department: EEE_DEPT,
          isActive: true,
        },
      });

      await prisma.staffResponsibility.create({
        data: {
          staffId: createdFaculty.id,
          responsibility: 'MENTOR',
          department: EEE_DEPT,
          isActive: true,
        },
      });

      if (advisoryYear) {
        await prisma.advisorAssignment.create({
          data: {
            staffId: createdFaculty.id,
            department: EEE_DEPT,
            year: advisoryYear,
            section: 'A',
            isActive: true,
          },
        });
      }
    }
  }

  console.log(`✨ Added ${facultyMembers.length} official EEE faculty members with Responsibilities & Advisory.`);

  // 4. Create Students (II Year, III Year, IV Year) - Mentors & Advisors chosen by students
  const defaultStudentPasswordHash = await bcrypt.hash('Student@123', 10);

  // (2025-29 Batch) – II Year
  for (const st of year2Students) {
    await prisma.user.create({
      data: {
        name: st.name,
        email: `${st.regNo}@ksrct.ac.in`,
        passwordHash: defaultStudentPasswordHash,
        role: 'STUDENT',
        department: EEE_DEPT,
        year: 'II',
        section: 'A',
        semester: 'III',
        stayType: 'DAY_SCHOLAR',
        registerNumber: st.regNo,
        rollNumber: st.regNo,
        mentorId: null,
        advisorId: null,
        isAccountSetup: true,
        isActive: true,
      },
    });
  }

  // (2024-28 Batch) – III Year
  for (const st of year3Students) {
    await prisma.user.create({
      data: {
        name: st.name,
        email: `${st.regNo}@ksrct.ac.in`,
        passwordHash: defaultStudentPasswordHash,
        role: 'STUDENT',
        department: EEE_DEPT,
        year: 'III',
        section: 'A',
        semester: 'V',
        stayType: 'DAY_SCHOLAR',
        registerNumber: st.regNo,
        rollNumber: st.regNo,
        mentorId: null,
        advisorId: null,
        isAccountSetup: true,
        isActive: true,
      },
    });
  }

  // (2023-27 Batch) – IV Year
  for (const st of year4Students) {
    await prisma.user.create({
      data: {
        name: st.name,
        email: `${st.regNo}@ksrct.ac.in`,
        passwordHash: defaultStudentPasswordHash,
        role: 'STUDENT',
        department: EEE_DEPT,
        year: 'IV',
        section: 'A',
        semester: 'VII',
        stayType: 'DAY_SCHOLAR',
        registerNumber: st.regNo,
        rollNumber: st.regNo,
        mentorId: null,
        advisorId: null,
        isAccountSetup: true,
        isActive: true,
      },
    });
  }

  const totalStudents = year2Students.length + year3Students.length + year4Students.length;

  // Audit Log
  await prisma.auditLog.create({
    data: {
      userId: creator.id,
      userName: creator.name,
      userRole: 'CREATOR',
      action: 'DATA_INITIALIZED',
      description: `Added ${facultyMembers.length} faculty with verified phone numbers and ${totalStudents} students across Years II, III, IV.`,
    },
  });

  console.log(`🎓 Successfully added ${totalStudents} students (Year II: ${year2Students.length}, Year III: ${year3Students.length}, Year IV: ${year4Students.length}).`);
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
