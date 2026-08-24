import { createClient } from '@libsql/client';
import dotenv from 'dotenv';

dotenv.config();

const tursoUrl = process.env.TURSO_DATABASE_URL;
const tursoAuthToken = process.env.TURSO_AUTH_TOKEN;

if (!tursoUrl || !tursoAuthToken) {
  console.error('❌ Missing TURSO_DATABASE_URL or TURSO_AUTH_TOKEN in server/.env');
  process.exit(1);
}

const dropStatements = [
  `DROP TABLE IF EXISTS "AuditLog";`,
  `DROP TABLE IF EXISTS "SupportTicket";`,
  `DROP TABLE IF EXISTS "Notification";`,
  `DROP TABLE IF EXISTS "Approval";`,
  `DROP TABLE IF EXISTS "OdRequest";`,
  `DROP TABLE IF EXISTS "Certificate";`,
  `DROP TABLE IF EXISTS "CertificateTemplate";`,
  `DROP TABLE IF EXISTS "AdvisorAssignment";`,
  `DROP TABLE IF EXISTS "StaffResponsibility";`,
  `DROP TABLE IF EXISTS "Department";`,
  `DROP TABLE IF EXISTS "User";`,
];

const createStatements = [
  // 1. User
  `CREATE TABLE "User" (
    "id" TEXT PRIMARY KEY,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL UNIQUE,
    "passwordHash" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'STUDENT',
    "department" TEXT NOT NULL DEFAULT 'Electrical and Electronics Engineering',
    "year" TEXT,
    "section" TEXT,
    "registerNumber" TEXT UNIQUE,
    "rollNumber" TEXT,
    "stayType" TEXT,
    "semester" TEXT,
    "phone" TEXT,
    "profileImage" TEXT,
    "isAccountSetup" INTEGER NOT NULL DEFAULT 0,
    "authUserId" TEXT UNIQUE,
    "mentorCapacity" INTEGER NOT NULL DEFAULT 24,
    "mentorId" TEXT,
    "advisorId" TEXT,
    "isActive" INTEGER NOT NULL DEFAULT 1,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("mentorId") REFERENCES "User" ("id") ON DELETE SET NULL,
    FOREIGN KEY ("advisorId") REFERENCES "User" ("id") ON DELETE SET NULL
  );`,

  // 2. Department
  `CREATE TABLE "Department" (
    "id" TEXT PRIMARY KEY,
    "name" TEXT NOT NULL UNIQUE DEFAULT 'Electrical and Electronics Engineering',
    "code" TEXT NOT NULL UNIQUE DEFAULT 'EEE',
    "hodId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
  );`,

  // 3. StaffResponsibility
  `CREATE TABLE "StaffResponsibility" (
    "id" TEXT PRIMARY KEY,
    "staffId" TEXT NOT NULL,
    "responsibility" TEXT NOT NULL,
    "department" TEXT NOT NULL DEFAULT 'Electrical and Electronics Engineering',
    "isActive" INTEGER NOT NULL DEFAULT 1,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("staffId") REFERENCES "User" ("id") ON DELETE CASCADE,
    UNIQUE("staffId", "responsibility")
  );`,

  // 4. AdvisorAssignment
  `CREATE TABLE "AdvisorAssignment" (
    "id" TEXT PRIMARY KEY,
    "staffId" TEXT NOT NULL,
    "year" TEXT NOT NULL,
    "section" TEXT,
    "department" TEXT NOT NULL DEFAULT 'Electrical and Electronics Engineering',
    "isActive" INTEGER NOT NULL DEFAULT 1,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("staffId") REFERENCES "User" ("id") ON DELETE CASCADE,
    UNIQUE("staffId", "year")
  );`,

  // 5. CertificateTemplate
  `CREATE TABLE "CertificateTemplate" (
    "id" TEXT PRIMARY KEY,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT NOT NULL DEFAULT 'Academic',
    "layoutJson" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "createdById" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("createdById") REFERENCES "User" ("id") ON DELETE CASCADE
  );`,

  // 6. Certificate
  `CREATE TABLE "Certificate" (
    "id" TEXT PRIMARY KEY,
    "certificateId" TEXT UNIQUE,
    "certificateCode" TEXT UNIQUE,
    "studentId" TEXT NOT NULL,
    "templateId" TEXT,
    "title" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "eventName" TEXT,
    "organization" TEXT,
    "eventDate" TEXT,
    "description" TEXT,
    "fileName" TEXT NOT NULL,
    "filePath" TEXT NOT NULL,
    "fileType" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "supportingFile" TEXT,
    "status" TEXT NOT NULL DEFAULT 'SUBMITTED',
    "currentStage" TEXT NOT NULL DEFAULT 'MENTOR_REVIEW',
    "issuedDate" TEXT NOT NULL,
    "uploadedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "verifiedAt" DATETIME,
    "verifiedById" TEXT,
    "approvedAt" DATETIME,
    "approvedById" TEXT,
    "issuedAt" DATETIME,
    "issuedById" TEXT,
    "rejectionReason" TEXT,
    "rejectedByRole" TEXT,
    "rejectedByName" TEXT,
    "mentorRemarks" TEXT,
    "advisorRemarks" TEXT,
    "hodRemarks" TEXT,
    "correctionRemarks" TEXT,
    "qrCodeUrl" TEXT,
    FOREIGN KEY ("studentId") REFERENCES "User" ("id") ON DELETE CASCADE,
    FOREIGN KEY ("templateId") REFERENCES "CertificateTemplate" ("id") ON DELETE SET NULL,
    FOREIGN KEY ("verifiedById") REFERENCES "User" ("id") ON DELETE SET NULL,
    FOREIGN KEY ("approvedById") REFERENCES "User" ("id") ON DELETE SET NULL,
    FOREIGN KEY ("issuedById") REFERENCES "User" ("id") ON DELETE SET NULL
  );`,

  // 7. OdRequest
  `CREATE TABLE "OdRequest" (
    "id" TEXT PRIMARY KEY,
    "odId" TEXT UNIQUE,
    "requestType" TEXT NOT NULL DEFAULT 'EVENT_OD',
    "studentId" TEXT NOT NULL,
    "studentName" TEXT NOT NULL,
    "registerNumber" TEXT,
    "rollNumber" TEXT,
    "department" TEXT NOT NULL DEFAULT 'Electrical and Electronics Engineering',
    "year" TEXT NOT NULL DEFAULT 'III',
    "section" TEXT NOT NULL DEFAULT 'A',
    "semester" TEXT NOT NULL DEFAULT 'V',
    "stayType" TEXT NOT NULL DEFAULT 'DAY_SCHOLAR',
    "eventName" TEXT,
    "eventType" TEXT,
    "organization" TEXT,
    "venue" TEXT,
    "odDate" TEXT,
    "startTime" TEXT,
    "endTime" TEXT,
    "numberOfDays" INTEGER NOT NULL DEFAULT 1,
    "purpose" TEXT,
    "description" TEXT,
    "coordinator" TEXT,
    "supportingFile" TEXT,
    "companyName" TEXT,
    "companyAddress" TEXT,
    "internshipMode" TEXT,
    "organizingBody" TEXT,
    "eventPlace" TEXT,
    "reason" TEXT,
    "startDate" TEXT,
    "endDate" TEXT,
    "session" TEXT NOT NULL DEFAULT 'FULL_DAY',
    "availedLeaveCount" INTEGER NOT NULL DEFAULT 0,
    "availedOdCount" INTEGER NOT NULL DEFAULT 0,
    "availedPermissionCount" INTEGER NOT NULL DEFAULT 0,
    "attachmentName" TEXT,
    "attachmentPath" TEXT,
    "mentorId" TEXT,
    "advisorId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'SUBMITTED',
    "currentStage" TEXT NOT NULL DEFAULT 'MENTOR_REVIEW',
    "mentorRemarks" TEXT,
    "advisorRemarks" TEXT,
    "hodRemarks" TEXT,
    "rejectionReason" TEXT,
    "rejectedByRole" TEXT,
    "rejectedByName" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("studentId") REFERENCES "User" ("id") ON DELETE CASCADE
  );`,

  // 8. Approval
  `CREATE TABLE "Approval" (
    "id" TEXT PRIMARY KEY,
    "requestType" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "approverId" TEXT NOT NULL,
    "approverName" TEXT,
    "approverRole" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "previousStatus" TEXT,
    "newStatus" TEXT,
    "remarks" TEXT,
    "actionDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("approverId") REFERENCES "User" ("id") ON DELETE CASCADE
  );`,

  // 9. Notification
  `CREATE TABLE "Notification" (
    "id" TEXT PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'INFO',
    "requestType" TEXT,
    "requestId" TEXT,
    "isRead" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE
  );`,

  // 10. SupportTicket
  `CREATE TABLE "SupportTicket" (
    "id" TEXT PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE
  );`,

  // 11. AuditLog
  `CREATE TABLE "AuditLog" (
    "id" TEXT PRIMARY KEY,
    "userId" TEXT,
    "userName" TEXT,
    "userRole" TEXT,
    "requestType" TEXT,
    "requestId" TEXT,
    "action" TEXT NOT NULL,
    "previousStatus" TEXT,
    "newStatus" TEXT,
    "remarks" TEXT,
    "entityType" TEXT,
    "entityId" TEXT,
    "description" TEXT NOT NULL,
    "oldValue" TEXT,
    "newValue" TEXT,
    "ipAddress" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL
  );`,
];

async function syncToTurso() {
  console.log(`🚀 Connecting to Turso Cloud: ${tursoUrl}`);
  const turso = createClient({ url: tursoUrl!, authToken: tursoAuthToken });

  console.log(`🧹 Dropping previous tables on Turso Cloud...`);
  for (const sql of dropStatements) {
    try {
      await turso.execute(sql);
    } catch {}
  }

  console.log(`📦 Recreating 11 tables on Turso Cloud according to schema...`);
  for (const sql of createStatements) {
    await turso.execute(sql);
  }

  console.log('✅ All 11 tables created on Turso Cloud successfully!');
}

syncToTurso().catch((err) => {
  console.error('❌ Sync failed:', err);
  process.exit(1);
});
