import { Response } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../utils/prisma';
import { AuthenticatedRequest } from '../middleware/auth';
import { logAudit } from '../utils/auditLogger';

const EEE_DEPT = 'Electrical and Electronics Engineering';

/**
 * Get available EEE Mentors with their capacity
 */
export const getAvailableMentors = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const mentors = await prisma.user.findMany({
      where: {
        department: EEE_DEPT,
        isActive: true,
        OR: [
          { role: 'STAFF' },
          { role: 'MENTOR' },
          { role: 'ADVISOR' },
          { role: 'HOD' },
          { staffResponsibilities: { some: { responsibility: 'MENTOR', isActive: true } } },
        ],
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        mentorCapacity: true,
        _count: {
          select: { mentees: true },
        },
      },
      orderBy: { name: 'asc' },
    });

    const formattedMentors = mentors.map((m) => ({
      id: m.id,
      name: m.name,
      email: m.email,
      phone: m.phone,
      capacity: m.mentorCapacity || 6,
      currentCount: m._count.mentees,
      isAvailable: m._count.mentees < (m.mentorCapacity || 6),
    }));

    return res.status(200).json({ success: true, mentors: formattedMentors });
  } catch (error) {
    console.error('Get mentors error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch mentors.' });
  }
};

/**
 * Get available EEE Advisors, optionally filtered by Year
 */
export const getAvailableAdvisors = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { year } = req.query;

    let whereClause: any = {
      department: EEE_DEPT,
      isActive: true,
      OR: [
        { role: 'STAFF' },
        { role: 'ADVISOR' },
        { role: 'HOD' },
        { staffResponsibilities: { some: { responsibility: 'ADVISOR', isActive: true } } },
      ],
    };

    if (year && typeof year === 'string' && year !== 'ALL') {
      // Find staff who have AdvisorAssignment for this year
      const assignments = await prisma.advisorAssignment.findMany({
        where: { year, isActive: true },
        select: { staffId: true },
      });
      const staffIds = assignments.map((a) => a.staffId);

      if (staffIds.length > 0) {
        whereClause.id = { in: staffIds };
      }
    }

    const advisors = await prisma.user.findMany({
      where: whereClause,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        advisorAssignments: {
          where: { isActive: true },
          select: { year: true, section: true },
        },
        _count: {
          select: { advisees: true },
        },
      },
      orderBy: { name: 'asc' },
    });

    return res.status(200).json({ success: true, advisors });
  } catch (error) {
    console.error('Get advisors error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch advisors.' });
  }
};

/**
 * Get Full EEE Departmental Organization Structure
 */
export const getEeeStructure = async (req: AuthenticatedRequest, res: Response) => {
  try {
    // 1. Get current HOD
    const hodResp = await prisma.staffResponsibility.findFirst({
      where: { responsibility: 'HOD', isActive: true },
      include: { staff: true },
    });
    const hod = hodResp?.staff || await prisma.user.findFirst({
      where: { role: 'HOD', isActive: true },
    });

    // 2. Get Years (I, II, III, IV) with Advisors & Mentors & Student counts
    const years = ['I', 'II', 'III', 'IV'];
    const structure = await Promise.all(
      years.map(async (year) => {
        const advisorAssignments = await prisma.advisorAssignment.findMany({
          where: { year, isActive: true },
          include: { staff: { select: { id: true, name: true, email: true, phone: true } } },
        });

        const studentsCount = await prisma.user.count({
          where: { role: 'STUDENT', department: EEE_DEPT, year },
        });

        return {
          year,
          advisors: advisorAssignments.map((a) => a.staff),
          studentCount: studentsCount,
        };
      })
    );

    // 3. Get all Mentors with their mentees
    const mentors = await prisma.user.findMany({
      where: {
        department: EEE_DEPT,
        isActive: true,
        OR: [
          { role: 'STAFF' },
          { role: 'MENTOR' },
          { staffResponsibilities: { some: { responsibility: 'MENTOR', isActive: true } } },
        ],
      },
      select: {
        id: true,
        name: true,
        email: true,
        mentorCapacity: true,
        mentees: {
          where: { isActive: true },
          select: { id: true, name: true, registerNumber: true, year: true, section: true },
        },
      },
      orderBy: { name: 'asc' },
    });

    return res.status(200).json({
      success: true,
      structure: {
        hod,
        years,
        yearDetails: structure,
        mentors,
      },
    });
  } catch (error) {
    console.error('Get structure error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch EEE departmental structure.' });
  }
};

/**
 * Get Students with role-based scoping
 */
export const getUsers = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const { role, year, section, search, mentorId, advisorId, page = '1', limit = '100' } = req.query;
    const userRole = req.user.role;
    const responsibilities = req.user.responsibilities || [];
    const userId = req.user.userId;

    const whereClause: any = {
      department: EEE_DEPT,
    };

    // Scoping based on Caller:
    // If Student: only self
    if (userRole === 'STUDENT') {
      whereClause.id = userId;
    } 
    // If Staff with ONLY MENTOR responsibility: see only assigned mentees
    else if (userRole === 'STAFF' || userRole === 'MENTOR') {
      const isHod = responsibilities.includes('HOD') || (userRole as string) === 'HOD';
      const isAdvisor = responsibilities.includes('ADVISOR') || (userRole as string) === 'ADVISOR';
      const isMentor = responsibilities.includes('MENTOR') || (userRole as string) === 'MENTOR';

      if (!isHod && !isAdvisor && isMentor) {
        whereClause.mentorId = userId;
      } else if (!isHod && isAdvisor && !isMentor) {
        // Find assigned years
        const assignedYears = req.user.advisoryYears || [];
        whereClause.OR = [
          { advisorId: userId },
          { year: { in: assignedYears } },
        ];
      } else if (!isHod && isAdvisor && isMentor) {
        const assignedYears = req.user.advisoryYears || [];
        whereClause.OR = [
          { mentorId: userId },
          { advisorId: userId },
          { year: { in: assignedYears } },
        ];
      }
      // If HOD or Creator/Admin: can see all EEE students
    }

    if (role && typeof role === 'string' && role !== 'ALL') {
      whereClause.role = role;
    }

    if (year && typeof year === 'string' && year !== 'ALL') {
      whereClause.year = year;
    }

    if (section && typeof section === 'string' && section !== 'ALL') {
      whereClause.section = section;
    }

    if (mentorId && typeof mentorId === 'string' && mentorId !== 'ALL') {
      whereClause.mentorId = mentorId;
    }

    if (advisorId && typeof advisorId === 'string' && advisorId !== 'ALL') {
      whereClause.advisorId = advisorId;
    }

    if (search && typeof search === 'string' && search.trim() !== '') {
      const q = search.trim();
      whereClause.AND = [
        ...(whereClause.AND || []),
        {
          OR: [
            { name: { contains: q } },
            { email: { contains: q } },
            { registerNumber: { contains: q } },
            { rollNumber: { contains: q } },
          ],
        },
      ];
    }

    const pageNum = parseInt(page as string, 10) || 1;
    const limitNum = parseInt(limit as string, 10) || 100;
    const skip = (pageNum - 1) * limitNum;

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where: whereClause,
        include: {
          mentor: { select: { id: true, name: true, email: true } },
          advisor: { select: { id: true, name: true, email: true } },
          staffResponsibilities: { where: { isActive: true } },
          advisorAssignments: { where: { isActive: true } },
          _count: {
            select: { certificates: true, odRequests: true, mentees: true },
          },
        },
        orderBy: { name: 'asc' },
        skip,
        take: limitNum,
      }),
      prisma.user.count({ where: whereClause }),
    ]);

    return res.status(200).json({
      success: true,
      users,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    console.error('Get users error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch users.' });
  }
};

/**
 * Get All Staff Members with Responsibilities & Assignments
 */
export const getStaff = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const staff = await prisma.user.findMany({
      where: {
        department: EEE_DEPT,
        OR: [
          { role: 'STAFF' },
          { role: 'MENTOR' },
          { role: 'ADVISOR' },
          { role: 'HOD' },
          { role: 'CREATOR' },
        ],
      },
      include: {
        staffResponsibilities: { where: { isActive: true } },
        advisorAssignments: { where: { isActive: true } },
        _count: { select: { mentees: true } },
      },
      orderBy: { name: 'asc' },
    });

    return res.status(200).json({ success: true, staff });
  } catch (error) {
    console.error('Get staff error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch staff.' });
  }
};

/**
 * Creator: Assign Staff Responsibilities (MENTOR, ADVISOR, HOD). Enforces ONLY 1 ACTIVE HOD.
 */
export const assignStaffResponsibilities = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user || (req.user.role !== 'CREATOR' && req.user.role !== 'ADMIN')) {
      return res.status(403).json({ success: false, message: 'Only Creator is authorized to assign staff responsibilities.' });
    }

    const { staffId } = req.params;
    const { responsibilities, mentorCapacity } = req.body; // array e.g. ['MENTOR', 'ADVISOR', 'HOD']

    if (!Array.isArray(responsibilities)) {
      return res.status(400).json({ success: false, message: 'Responsibilities must be an array.' });
    }

    const staff = await prisma.user.findUnique({ where: { id: staffId } });
    if (!staff) {
      return res.status(404).json({ success: false, message: 'Staff member not found.' });
    }

    // Check if assigning HOD: ensure ONLY ONE ACTIVE HOD for EEE!
    if (responsibilities.includes('HOD')) {
      // Deactivate any other HOD in StaffResponsibility
      await prisma.staffResponsibility.updateMany({
        where: {
          responsibility: 'HOD',
          department: EEE_DEPT,
          staffId: { not: staffId },
        },
        data: { isActive: false },
      });

      // Update department table
      await prisma.department.updateMany({
        where: { code: 'EEE' },
        data: { hodId: staffId },
      });
    }

    // Delete existing responsibilities for this staff member and recreate
    await prisma.staffResponsibility.deleteMany({ where: { staffId } });

    for (const resp of responsibilities) {
      if (['MENTOR', 'ADVISOR', 'HOD'].includes(resp)) {
        await prisma.staffResponsibility.create({
          data: {
            staffId,
            responsibility: resp,
            department: EEE_DEPT,
            isActive: true,
          },
        });
      }
    }

    if (mentorCapacity !== undefined && Number(mentorCapacity) > 0) {
      await prisma.user.update({
        where: { id: staffId },
        data: { mentorCapacity: Number(mentorCapacity) },
      });
    }

    await logAudit({
      userId: req.user.userId,
      userName: req.user.name,
      action: 'STAFF_RESPONSIBILITIES_UPDATED',
      entityType: 'User',
      entityId: staffId,
      description: `Creator ${req.user.name} assigned responsibilities [${responsibilities.join(', ')}] to ${staff.name}`,
      newValue: responsibilities.join(', '),
      ipAddress: req.ip,
    });

    return res.status(200).json({
      success: true,
      message: `Responsibilities updated for ${staff.name}.`,
      responsibilities,
    });
  } catch (error) {
    console.error('Assign responsibilities error:', error);
    return res.status(500).json({ success: false, message: 'Failed to assign staff responsibilities.' });
  }
};

/**
 * Creator: Assign Advisors to a Year (Max 2 active advisors per year)
 */
export const assignYearAdvisors = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user || (req.user.role !== 'CREATOR' && req.user.role !== 'ADMIN')) {
      return res.status(403).json({ success: false, message: 'Only Creator can assign year advisors.' });
    }

    const { year, staffIds } = req.body; // e.g. year: 'III', staffIds: ['id1', 'id2']

    if (!year || !Array.isArray(staffIds)) {
      return res.status(400).json({ success: false, message: 'Year and staffIds array are required.' });
    }

    if (staffIds.length > 2) {
      return res.status(400).json({ success: false, message: 'Exactly/maximum 2 active Advisors allowed per year.' });
    }

    // Deactivate existing advisor assignments for this year
    await prisma.advisorAssignment.deleteMany({
      where: { year, department: EEE_DEPT },
    });

    for (const staffId of staffIds) {
      await prisma.advisorAssignment.create({
        data: {
          staffId,
          year,
          department: EEE_DEPT,
          isActive: true,
        },
      });

      // Ensure staff has ADVISOR responsibility
      await prisma.staffResponsibility.upsert({
        where: { staffId_responsibility: { staffId, responsibility: 'ADVISOR' } },
        update: { isActive: true },
        create: { staffId, responsibility: 'ADVISOR', department: EEE_DEPT, isActive: true },
      });
    }

    await logAudit({
      userId: req.user.userId,
      userName: req.user.name,
      action: 'YEAR_ADVISORS_ASSIGNED',
      entityType: 'Department',
      description: `Creator assigned ${staffIds.length} advisor(s) to Year ${year} in EEE.`,
      newValue: staffIds.join(', '),
      ipAddress: req.ip,
    });

    return res.status(200).json({
      success: true,
      message: `Advisors updated for Year ${year} successfully.`,
    });
  } catch (error) {
    console.error('Assign year advisors error:', error);
    return res.status(500).json({ success: false, message: 'Failed to assign year advisors.' });
  }
};

/**
 * Creator/HOD: Reassign a student's Mentor or Advisor
 */
export const assignStudentMentorAdvisor = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user || (req.user.role !== 'CREATOR' && req.user.role !== 'ADMIN' && req.user.role !== 'HOD')) {
      return res.status(403).json({ success: false, message: 'Creator or HOD access required.' });
    }

    const { studentId, mentorId, advisorId, year, section } = req.body;

    if (!studentId) {
      return res.status(400).json({ success: false, message: 'studentId is required.' });
    }

    const student = await prisma.user.findUnique({ where: { id: studentId } });
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found.' });
    }

    const updated = await prisma.user.update({
      where: { id: studentId },
      data: {
        ...(mentorId !== undefined ? { mentorId } : {}),
        ...(advisorId !== undefined ? { advisorId } : {}),
        ...(year ? { year } : {}),
        ...(section ? { section } : {}),
      },
      include: {
        mentor: { select: { id: true, name: true, email: true } },
        advisor: { select: { id: true, name: true, email: true } },
      },
    });

    await logAudit({
      userId: req.user.userId,
      userName: req.user.name,
      action: 'STUDENT_ASSIGNMENT_CHANGED',
      entityType: 'User',
      entityId: studentId,
      description: `Reassigned student ${student.name} (${student.registerNumber}) - Mentor: ${mentorId || student.mentorId}, Advisor: ${advisorId || student.advisorId}`,
      ipAddress: req.ip,
    });

    return res.status(200).json({
      success: true,
      message: `Student assignment updated successfully.`,
      student: updated,
    });
  } catch (error) {
    console.error('Student assignment error:', error);
    return res.status(500).json({ success: false, message: 'Failed to update student assignment.' });
  }
};

/**
 * Student/User Profile Update (including Mentor & Advisor selection for students)
 */
export const updateProfile = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const { name, phone, mentorId, advisorId, section, rollNumber } = req.body;
    const currentUser = await prisma.user.findUnique({ where: { id: req.user.userId } });

    if (!currentUser) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    // If student is selecting a mentor, verify mentor capacity (unless already assigned to this mentor)
    if (mentorId && mentorId !== currentUser.mentorId && currentUser.role === 'STUDENT') {
      const mentor = await prisma.user.findUnique({
        where: { id: mentorId },
        include: { _count: { select: { mentees: true } } },
      });

      if (!mentor) {
        return res.status(400).json({ success: false, message: 'Selected mentor does not exist.' });
      }

      const capacity = mentor.mentorCapacity || 6;
      if (mentor._count.mentees >= capacity) {
        return res.status(400).json({
          success: false,
          message: `Mentor ${mentor.name} has reached maximum student capacity (${capacity} students). Please select another mentor.`,
        });
      }
    }

    // If student is selecting an advisor, verify advisor belongs to student's year
    if (advisorId && currentUser.role === 'STUDENT' && currentUser.year) {
      const assignment = await prisma.advisorAssignment.findFirst({
        where: { staffId: advisorId, year: currentUser.year, isActive: true },
      });

      if (!assignment) {
        // If not found in assignments table, verify staff has advisor role in EEE
        const advisorUser = await prisma.user.findFirst({
          where: { id: advisorId, department: EEE_DEPT, isActive: true },
        });
        if (!advisorUser) {
          return res.status(400).json({ success: false, message: 'Selected advisor is not valid for your year.' });
        }
      }
    }

    const updatedUser = await prisma.user.update({
      where: { id: req.user.userId },
      data: {
        ...(name ? { name } : {}),
        ...(phone !== undefined ? { phone } : {}),
        ...(mentorId ? { mentorId } : {}),
        ...(advisorId ? { advisorId } : {}),
        ...(section ? { section } : {}),
        ...(rollNumber ? { rollNumber } : {}),
      },
      include: {
        mentor: { select: { id: true, name: true, email: true } },
        advisor: { select: { id: true, name: true, email: true } },
        staffResponsibilities: { where: { isActive: true } },
        advisorAssignments: { where: { isActive: true } },
      },
    });

    await logAudit({
      userId: req.user.userId,
      userName: req.user.name,
      action: 'PROFILE_UPDATED',
      entityType: 'User',
      entityId: updatedUser.id,
      description: `User ${updatedUser.name} updated profile details.`,
      ipAddress: req.ip,
    });

    const responsibilities = updatedUser.staffResponsibilities.map((r) => r.responsibility);

    return res.status(200).json({
      success: true,
      message: 'Profile updated successfully.',
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
        department: updatedUser.department,
        year: updatedUser.year,
        section: updatedUser.section,
        registerNumber: updatedUser.registerNumber,
        rollNumber: updatedUser.rollNumber,
        phone: updatedUser.phone,
        mentorId: updatedUser.mentorId,
        mentor: updatedUser.mentor,
        advisorId: updatedUser.advisorId,
        advisor: updatedUser.advisor,
        responsibilities,
        advisorAssignments: updatedUser.advisorAssignments,
      },
    });
  } catch (error) {
    console.error('Update profile error:', error);
    return res.status(500).json({ success: false, message: 'Failed to update profile.' });
  }
};

/**
 * Creator: Create New User (Student or Staff)
 */
export const createUser = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user || (req.user.role !== 'CREATOR' && req.user.role !== 'ADMIN')) {
      return res.status(403).json({ success: false, message: 'Creator access required.' });
    }

    const { name, email, password, role, year, section, registerNumber, phone, responsibilities } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({ success: false, message: 'Name, email, password, and role are required.' });
    }

    const existing = await prisma.user.findUnique({
      where: { email: email.trim().toLowerCase() },
    });

    if (existing) {
      return res.status(400).json({ success: false, message: 'User with this email already exists.' });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const newUser = await prisma.user.create({
      data: {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        passwordHash,
        role, // STUDENT, STAFF, CREATOR
        department: EEE_DEPT,
        year: year || null,
        section: section || null,
        registerNumber: registerNumber ? registerNumber.trim().toUpperCase() : null,
        rollNumber: registerNumber ? registerNumber.trim().toUpperCase() : null,
        phone: phone || null,
      },
    });

    // If staff and responsibilities provided, create them
    if (role === 'STAFF' && Array.isArray(responsibilities)) {
      if (responsibilities.includes('HOD')) {
        await prisma.staffResponsibility.updateMany({
          where: { responsibility: 'HOD', department: EEE_DEPT },
          data: { isActive: false },
        });
      }

      for (const resp of responsibilities) {
        if (['MENTOR', 'ADVISOR', 'HOD'].includes(resp)) {
          await prisma.staffResponsibility.create({
            data: {
              staffId: newUser.id,
              responsibility: resp,
              department: EEE_DEPT,
              isActive: true,
            },
          });
        }
      }
    }

    await logAudit({
      userId: req.user.userId,
      userName: req.user.name,
      action: 'USER_CREATED',
      entityType: 'User',
      entityId: newUser.id,
      description: `Creator ${req.user.name} created user ${newUser.email} (${newUser.name}) with role ${newUser.role}`,
      ipAddress: req.ip,
    });

    return res.status(201).json({
      success: true,
      message: 'User created successfully.',
      user: newUser,
    });
  } catch (error) {
    console.error('Create user error:', error);
    return res.status(500).json({ success: false, message: 'Failed to create user.' });
  }
};

/**
 * Creator: Enable / Disable User
 */
export const updateUserStatus = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user || (req.user.role !== 'CREATOR' && req.user.role !== 'ADMIN')) {
      return res.status(403).json({ success: false, message: 'Creator access required.' });
    }

    const { id } = req.params;
    const { isActive } = req.body;

    const user = await prisma.user.update({
      where: { id },
      data: { isActive: Boolean(isActive) },
    });

    await logAudit({
      userId: req.user.userId,
      userName: req.user.name,
      action: isActive ? 'USER_ENABLED' : 'USER_DISABLED',
      entityType: 'User',
      entityId: user.id,
      description: `Creator ${req.user.name} set status of ${user.email} to ${isActive}`,
      ipAddress: req.ip,
    });

    return res.status(200).json({
      success: true,
      message: `User status updated to ${isActive ? 'Active' : 'Disabled'}.`,
      user,
    });
  } catch (error) {
    console.error('Update status error:', error);
    return res.status(500).json({ success: false, message: 'Failed to update user status.' });
  }
};

/**
 * Legacy support for assign mentor
 */
export const assignMentor = async (req: AuthenticatedRequest, res: Response) => {
  return assignStudentMentorAdvisor(req, res);
};

export const updateUserRole = async (req: AuthenticatedRequest, res: Response) => {
  return assignStaffResponsibilities(req, res);
};
