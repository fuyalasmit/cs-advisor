import express from "express";
import prisma from "../lib/db.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(authMiddleware);

const YEAR_ORDER = ["freshman", "sophomore", "junior", "senior"] as const;

function checkPrerequisites(
  course: any,
  completedCoursesSet: Set<string>,
  completedCoursesMap: Map<string, string>,
  currentYear: string
): boolean {
  if (!course.prerequisites || course.prerequisites.length === 0) {
    return true;
  }

  const currentYearIndex = YEAR_ORDER.indexOf(currentYear as any);

  const andPrereqs: boolean[] = [];
  const orPrereqs: boolean[] = [];

  for (const prereq of course.prerequisites) {
    let isMet = false;

    if (prereq.extra === "junior standing") {
      isMet = currentYearIndex >= 2;
    } else if (prereq.extra === "senior standing") {
      isMet = currentYearIndex >= 3;
    } else if (prereq.extra === "instructor consent") {
      isMet = true;
    } else if (prereq.preReqCourseId) {
      if (completedCoursesSet.has(prereq.preReqCourseId)) {
        if (prereq.minGrade) {
          const gradeValues: Record<string, number> = { A: 4, B: 3, C: 2, D: 1, F: 0 };
          const completedGrade = completedCoursesMap.get(prereq.preReqCourseId);
          const minGradeValue = gradeValues[prereq.minGrade];
          if (completedGrade && minGradeValue !== undefined) {
            const completedGradeValue = gradeValues[completedGrade];
            isMet = completedGradeValue !== undefined && completedGradeValue >= minGradeValue;
          }
        } else {
          isMet = true;
        }
      }
    } else {
      isMet = true;
    }

    if (prereq.operator === "OR") {
      orPrereqs.push(isMet);
    } else {
      andPrereqs.push(isMet);
    }
  }

  const andsPassed = andPrereqs.length === 0 || andPrereqs.every((p) => p);
  const orsPassed = orPrereqs.length === 0 || orPrereqs.some((p) => p);

  return andsPassed && orsPassed;
}

router.get("/:id/suggestions", async (req, res) => {
  try {
    const studentId = parseInt(req.params.id);
    const teacherId = req.userId;

    if (isNaN(studentId)) {
      return res.status(400).json({ message: "Invalid student ID" });
    }

    if (!teacherId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const student = await prisma.student.findFirst({
      where: { id: studentId, teacherId },
      include: { completedCourses: true },
    });

    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    // Create efficient lookup structures
    const completedCoursesSet = new Set(student.completedCourses.map((cc) => cc.courseId));
    const completedCoursesMap = new Map(student.completedCourses.map((cc) => [cc.courseId, cc.grade]));

    const currentYearIndex = YEAR_ORDER.indexOf(student.currentYear as any);
    if (currentYearIndex === -1) {
      return res.status(400).json({ message: "Invalid student year" });
    }

    // Fetch all required curriculum slots in one query
    const yearsToFetch = YEAR_ORDER.slice(0, currentYearIndex + 1);
    const allSlots = await prisma.curriculumSlot.findMany({
      where: { year: { in: yearsToFetch } },
      include: {
        course: {
          include: {
            prerequisites: { include: { preReqCourse: true } },
          },
        },
      },
      orderBy: [{ year: "asc" }, { semester: "asc" }],
    });

    // Fetch next semester slots
    const nextSem = student.currentSem === "first" ? "second" : "first";
    const nextYear =
      student.currentSem === "second" && currentYearIndex < 3
        ? YEAR_ORDER[currentYearIndex + 1]
        : student.currentYear;

    const nextSemesterSlots = nextYear
      ? await prisma.curriculumSlot.findMany({
          where: { year: nextYear, semester: nextSem },
          include: {
            course: {
              include: {
                prerequisites: { include: { preReqCourse: true } },
              },
            },
          },
        })
      : [];

    // Fetch all courses by category in parallel
    const [genEdCourses, concentrationCourses, electiveCourses] = await Promise.all([
      prisma.course.findMany({
        where: { category: "genEd" },
        include: { prerequisites: { include: { preReqCourse: true } } },
      }),
      prisma.course.findMany({
        where: { category: "concentration" },
        include: { prerequisites: { include: { preReqCourse: true } } },
      }),
      prisma.course.findMany({
        where: { category: "elective" },
        include: { prerequisites: { include: { preReqCourse: true } } },
      }),
    ]);

    // Group courses by category for quick lookup
    const genEdByCategory = genEdCourses.reduce((acc, course) => {
      if (course.genEdCategory) {
        if (!acc[course.genEdCategory]) acc[course.genEdCategory] = [];
        acc[course.genEdCategory]!.push(course);
      }
      return acc;
    }, {} as Record<string, any[]>);

    // Separate past and current slots
    const pastSlots = allSlots.filter(
      (s) =>
        YEAR_ORDER.indexOf(s.year as any) < currentYearIndex ||
        (s.year === student.currentYear && s.semester !== student.currentSem)
    );

    const currentSlots = allSlots.filter(
      (s) => s.year === student.currentYear && s.semester === student.currentSem
    );

    const missedCourses: any[] = [];
    const suggestions: any[] = [];

    // Process missed courses
    for (const slot of pastSlots) {
      if (slot.slotType === "fixed" && slot.courseId && slot.course) {
        if (
          !completedCoursesSet.has(slot.courseId) &&
          checkPrerequisites(slot.course, completedCoursesSet, completedCoursesMap, student.currentYear)
        ) {
          missedCourses.push({
            courseNo: slot.course.courseNo,
            title: slot.course.title,
            creditHour: slot.course.creditHour,
            originalSemester: `${slot.year} ${slot.semester}`,
          });
        }
      }
    }

    // Helper to process slots
    const processSlots = (slots: any[], semesterLabel?: string) => {
      for (const slot of slots) {
        if (slot.slotType === "fixed" && slot.courseId && slot.course) {
          if (
            !completedCoursesSet.has(slot.courseId) &&
            checkPrerequisites(slot.course, completedCoursesSet, completedCoursesMap, student.currentYear)
          ) {
            suggestions.push({
              slotType: "fixed",
              courseNo: slot.course.courseNo,
              title: slot.course.title,
              creditHour: slot.course.creditHour,
              ...(semesterLabel && { semester: semesterLabel }),
            });
          }
        } else if (slot.slotType === "genEd" && slot.genEdCategory) {
          const coursesInCategory = genEdByCategory[slot.genEdCategory] || [];
          const availableOptions = coursesInCategory
            .filter(
              (course) =>
                !completedCoursesSet.has(course.courseNo) &&
                checkPrerequisites(course, completedCoursesSet, completedCoursesMap, student.currentYear)
            )
            .map((course) => ({
              courseNo: course.courseNo,
              title: course.title,
              creditHour: course.creditHour,
            }));

          if (availableOptions.length > 0) {
            suggestions.push({
              slotType: "genEd",
              category: slot.genEdCategory,
              options: availableOptions,
              message: `Choose 1 ${slot.genEdCategory} course`,
              ...(semesterLabel && { semester: semesterLabel }),
            });
          }
        } else if (slot.slotType === "concentration") {
          const availableOptions = concentrationCourses
            .filter(
              (course) =>
                !completedCoursesSet.has(course.courseNo) &&
                checkPrerequisites(course, completedCoursesSet, completedCoursesMap, student.currentYear)
            )
            .map((course) => ({
              courseNo: course.courseNo,
              title: course.title,
              creditHour: course.creditHour,
            }));

          if (availableOptions.length > 0) {
            suggestions.push({
              slotType: "concentration",
              options: availableOptions,
              message: "Choose 1 concentration course",
              ...(semesterLabel && { semester: semesterLabel }),
            });
          }
        } else if (slot.slotType === "elective") {
          const availableOptions = electiveCourses
            .filter(
              (course) =>
                !completedCoursesSet.has(course.courseNo) &&
                checkPrerequisites(course, completedCoursesSet, completedCoursesMap, student.currentYear)
            )
            .map((course) => ({
              courseNo: course.courseNo,
              title: course.title,
              creditHour: course.creditHour,
            }));

          if (availableOptions.length > 0) {
            suggestions.push({
              slotType: "elective",
              options: availableOptions,
              message: "Choose 1 CS elective (3xx-4xx level)",
              ...(semesterLabel && { semester: semesterLabel }),
            });
          }
        }
      }
    };

    // Process current and next semester slots
    processSlots(currentSlots);
    processSlots(nextSemesterSlots, `${nextYear} ${nextSem}`);

    res.status(200).json({
      studentId: student.id,
      studentName: student.name,
      currentYear: student.currentYear,
      currentSemester: student.currentSem,
      missedCourses,
      suggestions,
    });
  } catch (error) {
    console.error("Error generating suggestions:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

export default router;
