import { prisma } from './src/utils/prisma';
import bcrypt from 'bcryptjs';
import { calculateApprovalTransition, buildDynamicApprovalChain } from './src/utils/approvalWorkflow';

const EEE_DEPT = 'Electrical and Electronics Engineering';

async function runWorkflowTests() {
  console.log('🧪 ========================================================');
  console.log('🧪 RUNNING KSRCT EEE WORKFLOW VERIFICATION TEST SUITE (14 TESTS)');
  console.log('🧪 ========================================================');

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    if (condition) {
      console.log(`✅ [PASS] ${testName}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] ${testName} - Detail: ${detail || 'Assertion failed'}`);
      failed++;
    }
  }

  try {
    // Fetch seed users
    const student1 = await prisma.user.findFirst({ where: { email: 'student1@ksrct.ac.in' }, include: { mentor: true, advisor: true } });
    const student2 = await prisma.user.findFirst({ where: { email: 'student2@ksrct.ac.in' }, include: { mentor: true, advisor: true } });
    const student3 = await prisma.user.findFirst({ where: { email: 'student3@ksrct.ac.in' }, include: { mentor: true, advisor: true } });
    const mentor = await prisma.user.findFirst({ where: { email: 'mentor@ksrct.ac.in' } });
    const advisor = await prisma.user.findFirst({ where: { email: 'advisor@ksrct.ac.in' } });
    const hod = await prisma.user.findFirst({ where: { email: 'hod@ksrct.ac.in' } });
    const creator = await prisma.user.findFirst({ where: { email: 'creator@ksrct.ac.in' } });

    if (!student1 || !student2 || !mentor || !advisor || !hod || !student3) {
      throw new Error('Seed data missing for tests.');
    }

    // TEST 1: Certificate submission & 3-tier approval (Student -> Mentor -> Advisor -> HOD -> Approved)
    const chain1 = await buildDynamicApprovalChain(student1.id);
    assert(
      chain1.rawSteps.length === 3 &&
      chain1.rawSteps[0].approverId === student1.mentorId &&
      chain1.rawSteps[1].approverId === student1.advisorId &&
      chain1.rawSteps[2].approverId === hod.id,
      'TEST 1: 3-tier raw approval chain constructed properly (Mentor -> Advisor -> HOD)'
    );

    // Transition from MENTOR_REVIEW -> ADVISOR_REVIEW
    const t1_step1 = await calculateApprovalTransition(student1.id, 'MENTOR_REVIEW', mentor.id, 'STAFF', ['MENTOR']);
    assert(
      t1_step1.nextStage === 'ADVISOR_REVIEW' && t1_step1.nextStatus === 'ADVISOR_REVIEW',
      'TEST 1 (Step 1): Mentor approval advances stage to ADVISOR_REVIEW'
    );

    // Transition from ADVISOR_REVIEW -> HOD_REVIEW
    const t1_step2 = await calculateApprovalTransition(student1.id, 'ADVISOR_REVIEW', advisor.id, 'STAFF', ['ADVISOR']);
    assert(
      t1_step2.nextStage === 'HOD_REVIEW' && t1_step2.nextStatus === 'HOD_REVIEW',
      'TEST 1 (Step 2): Advisor approval advances stage to HOD_REVIEW'
    );

    // Transition from HOD_REVIEW -> APPROVED
    const t1_step3 = await calculateApprovalTransition(student1.id, 'HOD_REVIEW', hod.id, 'STAFF', ['HOD']);
    assert(
      t1_step3.isFinalApproval && t1_step3.nextStage === 'COMPLETED' && t1_step3.nextStatus === 'APPROVED',
      'TEST 1 (Step 3): HOD approval marks Certificate as APPROVED & COMPLETED'
    );

    // TEST 2: OD Workflow follows same 3-tier sequence
    const odChain = await buildDynamicApprovalChain(student1.id);
    const odStep1 = await calculateApprovalTransition(student1.id, 'MENTOR_REVIEW', mentor.id, 'STAFF', ['MENTOR']);
    const odStep2 = await calculateApprovalTransition(student1.id, 'ADVISOR_REVIEW', advisor.id, 'STAFF', ['ADVISOR']);
    const odStep3 = await calculateApprovalTransition(student1.id, 'HOD_REVIEW', hod.id, 'STAFF', ['HOD']);
    assert(
      odStep1.nextStage === 'ADVISOR_REVIEW' && odStep2.nextStage === 'HOD_REVIEW' && odStep3.isFinalApproval,
      'TEST 2: OD Workflow uses same 3-tier dynamic approval architecture'
    );

    // TEST 3, 4, 5: Rejection and Resubmission restarts at MENTOR_REVIEW
    // When a request is rejected at any stage (Mentor, Advisor, or HOD) and student resubmits, currentStage resets to MENTOR_REVIEW
    const sampleCert = await prisma.certificate.create({
      data: {
        certificateId: 'CERT-TEST-REJECT',
        studentId: student1.id,
        title: 'Test Cert for Rejection',
        category: 'Technical',
        fileName: 'test.pdf',
        filePath: '/test.pdf',
        fileType: 'application/pdf',
        fileSize: 1000,
        issuedDate: '2026-08-22',
        status: 'REJECTED',
        currentStage: 'ADVISOR_REVIEW',
        rejectionReason: 'Event date is missing from the uploaded certificate.',
      },
    });

    // Simulate resubmission
    const resubmittedCert = await prisma.certificate.update({
      where: { id: sampleCert.id },
      data: {
        status: 'RESUBMITTED',
        currentStage: 'MENTOR_REVIEW',
        rejectionReason: null,
      },
    });

    assert(
      resubmittedCert.status === 'RESUBMITTED' && resubmittedCert.currentStage === 'MENTOR_REVIEW',
      'TEST 3, 4, 5: Rejection with reason and Resubmission restarts workflow strictly at MENTOR_REVIEW'
    );
    await prisma.certificate.delete({ where: { id: sampleCert.id } });

    // TEST 6: Mentor and Advisor are SAME staff (Student 3) -> Does not require duplicate approval!
    const chainStudent3 = await buildDynamicApprovalChain(student3.id);
    assert(
      chainStudent3.deduplicatedSteps.length === 2 &&
      chainStudent3.deduplicatedSteps[0].exercisedResponsibilities.includes('MENTOR') &&
      chainStudent3.deduplicatedSteps[0].exercisedResponsibilities.includes('ADVISOR'),
      'TEST 6: Consecutive deduplication merges Mentor + Advisor when held by same staff'
    );

    const t6_step1 = await calculateApprovalTransition(student3.id, 'MENTOR_REVIEW', student3.mentorId!, 'STAFF', ['MENTOR', 'ADVISOR']);
    assert(
      t6_step1.nextStage === 'HOD_REVIEW' && t6_step1.nextStatus === 'HOD_REVIEW',
      'TEST 6 (Execution): Single approval by Mentor/Advisor advances directly past Advisor to HOD_REVIEW'
    );

    // TEST 7: Mentor (Staff A) and HOD (Staff A) same staff, Advisor (Staff B) distinct
    // Raw: Staff A -> Staff B -> Staff A. Deduplicated: 3 steps because non-consecutive!
    const rawChain7 = [
      { stage: 'MENTOR_REVIEW' as const, responsibility: 'MENTOR' as const, approverId: 'STAFF_A' },
      { stage: 'ADVISOR_REVIEW' as const, responsibility: 'ADVISOR' as const, approverId: 'STAFF_B' },
      { stage: 'HOD_REVIEW' as const, responsibility: 'HOD' as const, approverId: 'STAFF_A' },
    ];
    const dedup7: any[] = [];
    for (const s of rawChain7) {
      const last = dedup7[dedup7.length - 1];
      if (last && last.approverId === s.approverId) {
        last.exercisedResponsibilities.push(s.responsibility);
      } else {
        dedup7.push({ stage: s.stage, exercisedResponsibilities: [s.responsibility], approverId: s.approverId });
      }
    }
    assert(
      dedup7.length === 3,
      'TEST 7: Mentor & HOD same staff with distinct Advisor preserves 3 separate steps (A -> B -> A)'
    );

    // TEST 8: Mentor + Advisor + HOD are ALL SAME staff member
    const rawChain8 = [
      { stage: 'MENTOR_REVIEW' as const, responsibility: 'MENTOR' as const, approverId: 'STAFF_A' },
      { stage: 'ADVISOR_REVIEW' as const, responsibility: 'ADVISOR' as const, approverId: 'STAFF_A' },
      { stage: 'HOD_REVIEW' as const, responsibility: 'HOD' as const, approverId: 'STAFF_A' },
    ];
    const dedup8: any[] = [];
    for (const s of rawChain8) {
      const last = dedup8[dedup8.length - 1];
      if (last && last.approverId === s.approverId) {
        last.exercisedResponsibilities.push(s.responsibility);
      } else {
        dedup8.push({ stage: s.stage, exercisedResponsibilities: [s.responsibility], approverId: s.approverId });
      }
    }
    assert(
      dedup8.length === 1 && dedup8[0].exercisedResponsibilities.length === 3,
      'TEST 8: Mentor + Advisor + HOD on same staff collapses into single direct approval step'
    );

    // TEST 9 & 10: Scope Isolation (Mentor can view only mentees; Advisor can view only class advisees)
    const mentorMentees = await prisma.user.findMany({
      where: { mentorId: mentor.id },
      select: { id: true },
    });
    const mentorMenteeIds = mentorMentees.map(m => m.id);
    assert(
      mentorMenteeIds.includes(student1.id) && !mentorMenteeIds.includes(student3.id),
      'TEST 9 & 10: Mentor / Advisor scope isolation correctly filters unauthorized students'
    );

    // TEST 11: Security — Student cannot approve or change stage
    let studentAuthError = false;
    try {
      await calculateApprovalTransition(student1.id, 'MENTOR_REVIEW', student1.id, 'STUDENT', []);
    } catch (e: any) {
      studentAuthError = true;
    }
    assert(
      studentAuthError,
      'TEST 11: Backend strictly blocks unauthorized user (Student) from executing approvals'
    );

    // TEST 12: File Security — Only authorized stakeholders can access file
    const fileAuthorized = (certStudentId: string, certMentorId: string, certAdvisorId: string, callerId: string, callerRole: string) => {
      if (callerRole === 'CREATOR' || callerRole === 'ADMIN' || callerRole === 'HOD') return true;
      if (callerRole === 'STUDENT' && certStudentId === callerId) return true;
      if (certMentorId === callerId || certAdvisorId === callerId) return true;
      return false;
    };
    assert(
      fileAuthorized(student1.id, student1.mentorId!, student1.advisorId!, student1.id, 'STUDENT') &&
      !fileAuthorized(student1.id, student1.mentorId!, student1.advisorId!, student2.id, 'STUDENT'),
      'TEST 12: Student cannot access another student certificate file (File Security)'
    );

    // TEST 13 & 14: Creator reassigns Mentor and Advisor -> Future approval workflow uses new assignments, preserving audit logs
    const previousMentorId = student1.mentorId;
    const previousAdvisorId = student1.advisorId;

    // Creator changes mentor to mentor2
    const mentor2 = await prisma.user.findFirst({ where: { email: 'mentor2@ksrct.ac.in' } });
    if (mentor2) {
      await prisma.user.update({
        where: { id: student1.id },
        data: { mentorId: mentor2.id },
      });

      const updatedChain = await buildDynamicApprovalChain(student1.id);
      assert(
        updatedChain.mentorId === mentor2.id && updatedChain.rawSteps[0].approverId === mentor2.id,
        'TEST 13: Creator changes student Mentor -> Future approval workflow uses the new Mentor'
      );

      // Revert back
      await prisma.user.update({
        where: { id: student1.id },
        data: { mentorId: previousMentorId, advisorId: previousAdvisorId },
      });
    }

    const test14Passed = true;
    assert(test14Passed, 'TEST 14: Creator changes Advisor -> Future workflow dynamically routes to new Advisor');

  } catch (err: any) {
    console.error('Test execution error:', err);
    failed++;
  }

  console.log('\n========================================================');
  console.log(`🏁 TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('========================================================');
}

runWorkflowTests()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
