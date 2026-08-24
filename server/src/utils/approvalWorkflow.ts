import { prisma } from './prisma';

export interface ApprovalChainStep {
  stage: 'MENTOR_REVIEW' | 'ADVISOR_REVIEW' | 'HOD_REVIEW';
  responsibility: 'MENTOR' | 'ADVISOR' | 'HOD';
  approverId: string;
  approverName?: string;
}

export interface DynamicChainResult {
  rawSteps: ApprovalChainStep[];
  deduplicatedSteps: {
    stage: 'MENTOR_REVIEW' | 'ADVISOR_REVIEW' | 'HOD_REVIEW';
    exercisedResponsibilities: ('MENTOR' | 'ADVISOR' | 'HOD')[];
    approverId: string;
  }[];
  mentorId: string | null;
  advisorId: string | null;
  hodId: string | null;
}

/**
 * Get fallback active staff for a given responsibility
 */
export const getFallbackStaff = async (responsibility: 'MENTOR' | 'ADVISOR') => {
  const resp = await prisma.staffResponsibility.findFirst({
    where: {
      responsibility,
      isActive: true,
    },
    include: { staff: true },
  });

  if (resp && resp.staff?.isActive) {
    return resp.staff;
  }

  return await prisma.user.findFirst({
    where: {
      role: 'STAFF',
      isActive: true,
      department: 'Electrical and Electronics Engineering',
    },
  });
};

/**
 * Get active EEE HOD
 */
export const getActiveHod = async () => {
  const hodResponsibility = await prisma.staffResponsibility.findFirst({
    where: {
      responsibility: 'HOD',
      isActive: true,
    },
    include: { staff: true },
  });

  if (hodResponsibility && hodResponsibility.staff?.isActive) {
    return hodResponsibility.staff;
  }

  // Fallback to role = 'HOD'
  return (
    (await prisma.user.findFirst({
      where: {
        role: 'HOD',
        isActive: true,
      },
    })) ||
    (await prisma.user.findFirst({
      where: {
        staffResponsibilities: {
          some: { responsibility: 'HOD', isActive: true },
        },
        isActive: true,
      },
    })) ||
    (await prisma.user.findFirst({
      where: {
        name: { contains: 'Gopalakrishnan' },
        isActive: true,
      },
    }))
  );
};

/**
 * Build dynamic approval chain for a student, deduplicating consecutive approvers
 */
export const buildDynamicApprovalChain = async (studentId: string): Promise<DynamicChainResult> => {
  const student = await prisma.user.findUnique({
    where: { id: studentId },
    include: {
      mentor: true,
      advisor: true,
    },
  });

  if (!student) {
    throw new Error(`Student with ID ${studentId} not found.`);
  }

  let mentorId = student.mentorId;
  let mentorName = student.mentor?.name;
  let advisorId = student.advisorId;
  let advisorName = student.advisor?.name;

  // Fallback for mentor if unassigned
  if (!mentorId) {
    const fallbackMentor = await getFallbackStaff('MENTOR');
    if (fallbackMentor) {
      mentorId = fallbackMentor.id;
      mentorName = fallbackMentor.name;
    }
  }

  // If advisorId is not set directly on student, look up advisor assignment for student's year
  if (!advisorId && student.year) {
    const advisorAssign = await prisma.advisorAssignment.findFirst({
      where: {
        year: student.year,
        isActive: true,
      },
      include: { staff: true },
    });
    if (advisorAssign && advisorAssign.staff?.isActive) {
      advisorId = advisorAssign.staffId;
      advisorName = advisorAssign.staff.name;
    }
  }

  // Fallback for advisor if unassigned
  if (!advisorId) {
    const fallbackAdvisor = await getFallbackStaff('ADVISOR');
    if (fallbackAdvisor) {
      advisorId = fallbackAdvisor.id;
      advisorName = fallbackAdvisor.name;
    }
  }

  // Find active HOD
  const hod = await getActiveHod();
  const hodId = hod ? hod.id : null;

  const rawSteps: ApprovalChainStep[] = [];

  if (mentorId) {
    rawSteps.push({
      stage: 'MENTOR_REVIEW',
      responsibility: 'MENTOR',
      approverId: mentorId,
      approverName: mentorName,
    });
  }

  if (advisorId) {
    rawSteps.push({
      stage: 'ADVISOR_REVIEW',
      responsibility: 'ADVISOR',
      approverId: advisorId,
      approverName: advisorName,
    });
  }

  if (hodId) {
    rawSteps.push({
      stage: 'HOD_REVIEW',
      responsibility: 'HOD',
      approverId: hodId,
      approverName: hod?.name,
    });
  }

  // Fallback: If still empty, use any available staff or creator
  if (rawSteps.length === 0) {
    const defaultApprover = await prisma.user.findFirst({
      where: {
        role: { in: ['CREATOR', 'ADMIN', 'HOD', 'STAFF'] },
        isActive: true,
      },
    });
    if (defaultApprover) {
      rawSteps.push({
        stage: 'HOD_REVIEW',
        responsibility: 'HOD',
        approverId: defaultApprover.id,
        approverName: defaultApprover.name,
      });
    }
  }

  // Deduplicate consecutive approvers
  const deduplicatedSteps: DynamicChainResult['deduplicatedSteps'] = [];

  for (const step of rawSteps) {
    const lastStep = deduplicatedSteps[deduplicatedSteps.length - 1];
    if (lastStep && lastStep.approverId === step.approverId) {
      // Same consecutive approver! Merge responsibilities so user doesn't approve twice consecutively
      lastStep.exercisedResponsibilities.push(step.responsibility);
    } else {
      deduplicatedSteps.push({
        stage: step.stage,
        exercisedResponsibilities: [step.responsibility],
        approverId: step.approverId,
      });
    }
  }

  return {
    rawSteps,
    deduplicatedSteps,
    mentorId,
    advisorId,
    hodId,
  };
};

/**
 * Determine if a user is authorized to approve at the current stage and what the next stage will be
 */
export const calculateApprovalTransition = async (
  studentId: string,
  currentStage: string,
  userId: string,
  userRole: string,
  userResponsibilities: string[] = []
) => {
  const chain = await buildDynamicApprovalChain(studentId);
  const { deduplicatedSteps } = chain;

  if (deduplicatedSteps.length === 0) {
    throw new Error('Approval chain is empty or invalid.');
  }

  // Find index in deduplicated chain corresponding to currentStage
  let currentStepIndex = deduplicatedSteps.findIndex((step) => {
    if (currentStage === 'MENTOR_REVIEW' && step.stage === 'MENTOR_REVIEW') return true;
    if (
      currentStage === 'ADVISOR_REVIEW' &&
      (step.stage === 'ADVISOR_REVIEW' || step.exercisedResponsibilities.includes('ADVISOR'))
    )
      return true;
    if (
      currentStage === 'HOD_REVIEW' &&
      (step.stage === 'HOD_REVIEW' || step.exercisedResponsibilities.includes('HOD'))
    )
      return true;
    return false;
  });

  if (currentStepIndex === -1) {
    // If not exact match, pick the first step for SUBMITTED / RESUBMITTED
    currentStepIndex = 0;
  }

  const currentStep = deduplicatedSteps[currentStepIndex];

  if (!currentStep) {
    throw new Error('Approval chain is empty or invalid.');
  }

  // Verify authorization:
  // Must match approverId OR (user holds appropriate Staff Responsibility AND is Creator / Department Head / Assigned / Staff)
  const isDirectApprover = currentStep.approverId === userId;
  const isCreator = userRole === 'CREATOR' || userRole === 'ADMIN';
  const isStaff = userRole === 'STAFF';

  // Verify if user holds the necessary responsibility for the stage
  const requiredResponsibilities = currentStep.exercisedResponsibilities;
  const hasMatchingResponsibility = requiredResponsibilities.some(
    (r) => userResponsibilities.includes(r) || userRole === r
  );

  if (!isDirectApprover && !isCreator && !hasMatchingResponsibility && !isStaff) {
    throw new Error(
      `You are not authorized to approve this request at stage ${currentStage}. Required approver: ${currentStep.approverId}`
    );
  }

  const nextStep = deduplicatedSteps[currentStepIndex + 1];
  const isFinalApproval = !nextStep;

  let nextStage: string;
  let nextStatus: string;
  let nextApproverId: string | null = null;

  if (isFinalApproval) {
    nextStage = 'COMPLETED';
    nextStatus = 'APPROVED';
  } else {
    nextStage = nextStep.stage;
    nextStatus = nextStep.stage;
    nextApproverId = nextStep.approverId;
  }

  return {
    authorized: true,
    currentStep,
    nextStep,
    nextStage,
    nextStatus,
    isFinalApproval,
    exercisedRoles: requiredResponsibilities,
    nextApproverId,
    chain,
  };
};
