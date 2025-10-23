import express from "express";
import { z } from "zod";
import prisma from "../lib/db.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(authMiddleware);

router.get("/:id/completed", async (req, res) => {
  try {
    const studentId = parseInt(req.params.id);
    const teacherId = req.userId;

    if (isNaN(studentId)) {
      return res.status(400).json({
        message: "Invalid student ID",
      });
    }

    if (!teacherId) {
      return res.status(401).json({
        message: "Unauthorized",
      });
    }

    const student = await prisma.student.findFirst({
      where: {
        id: studentId,
        teacherId: teacherId,
      },
    });

    if (!student) {
      return res.status(404).json({
        message: "Student not found",
      });
    }

    const completedCourses = await prisma.completedCourse.findMany({
      where: {
        studentId: studentId,
      },
      include: {
        course: {
          select: {
            courseNo: true,
            title: true,
            creditHour: true,
            category: true,
            genEdCategory: true,
          },
        },
      },
      orderBy: {
        courseId: "asc",
      },
    });

    const totalCredits = completedCourses.reduce((sum, cc) => sum + cc.course.creditHour, 0);

    res.status(200).json({
      studentId: student.id,
      studentName: student.name,
      completedCourses: completedCourses.map((cc) => ({
        courseNo: cc.course.courseNo,
        title: cc.course.title,
        creditHour: cc.course.creditHour,
        category: cc.course.category,
        genEdCategory: cc.course.genEdCategory,
        grade: cc.grade,
      })),
      totalCredits,
      totalCourses: completedCourses.length,
    });
  } catch (error) {
    console.error("Error fetching completed courses:", error);
    res.status(500).json({
      message: "Internal server error",
    });
  }
});

router.post("/:id/completed", async (req, res) => {
  try {
    const studentId = parseInt(req.params.id);
    const teacherId = req.userId;

    if (isNaN(studentId)) {
      return res.status(400).json({
        message: "Invalid student ID",
      });
    }

    if (!teacherId) {
      return res.status(401).json({
        message: "Unauthorized",
      });
    }

    const completedCourseSchema = z.object({
      courseNo: z.string().min(1, "Course number is required"),
      grade: z.enum(["A", "B", "C", "D", "F"], {
        message: "Grade must be A, B, C, D, or F",
      }),
    });

    const requestSchema = z.union([
      completedCourseSchema,
      z.object({
        courses: z.array(completedCourseSchema).min(1, "At least one course is required"),
      }),
    ]);

    const parsedData = requestSchema.safeParse(req.body);

    if (!parsedData.success) {
      return res.status(400).json({
        message: "Invalid request data",
        errors: parsedData.error.issues.map((issue) => ({
          field: issue.path.join("."),
          message: issue.message,
        })),
      });
    }

    const student = await prisma.student.findFirst({
      where: {
        id: studentId,
        teacherId: teacherId,
      },
    });

    if (!student) {
      return res.status(404).json({
        message: "Student not found",
      });
    }

    const coursesToAdd = "courses" in parsedData.data ? parsedData.data.courses : [parsedData.data];

    const courseNumbers = coursesToAdd.map((c) => c.courseNo);
    const existingCourses = await prisma.course.findMany({
      where: {
        courseNo: {
          in: courseNumbers,
        },
      },
    });

    if (existingCourses.length !== courseNumbers.length) {
      const foundCourseNos = existingCourses.map((c) => c.courseNo);
      const notFoundCourses = courseNumbers.filter((cn) => !foundCourseNos.includes(cn));
      return res.status(404).json({
        message: "Some courses not found",
        notFound: notFoundCourses,
      });
    }

    // check for duplicates
    const alreadyCompleted = await prisma.completedCourse.findMany({
      where: {
        studentId: studentId,
        courseId: {
          in: courseNumbers,
        },
      },
    });

    if (alreadyCompleted.length > 0) {
      const duplicateCourses = alreadyCompleted.map((cc) => cc.courseId);
      return res.status(409).json({
        message: "Some courses are already marked as completed",
        duplicates: duplicateCourses,
      });
    }

    const completedCourses = await prisma.$transaction(
      coursesToAdd.map((course) =>
        prisma.completedCourse.create({
          data: {
            studentId: studentId,
            courseId: course.courseNo,
            grade: course.grade,
          },
          include: {
            course: {
              select: {
                courseNo: true,
                title: true,
                creditHour: true,
                category: true,
              },
            },
          },
        })
      )
    );

    res.status(201).json({
      message: "Completed course(s) added successfully",
      added: completedCourses.map((cc) => ({
        courseNo: cc.course.courseNo,
        title: cc.course.title,
        creditHour: cc.course.creditHour,
        category: cc.course.category,
        grade: cc.grade,
      })),
      count: completedCourses.length,
    });
  } catch (error) {
    console.error("Error adding completed courses:", error);
    res.status(500).json({
      message: "Internal server error",
    });
  }
});

router.delete("/:id/completed/:courseNo", async (req, res) => {
  try {
    const studentId = parseInt(req.params.id);
    const courseNo = req.params.courseNo;
    const teacherId = req.userId;

    if (isNaN(studentId)) {
      return res.status(400).json({
        message: "Invalid student ID",
      });
    }

    if (!teacherId) {
      return res.status(401).json({
        message: "Unauthorized",
      });
    }

    const student = await prisma.student.findFirst({
      where: {
        id: studentId,
        teacherId: teacherId,
      },
    });

    if (!student) {
      return res.status(404).json({
        message: "Student not found",
      });
    }

    // check if completed course exists
    const completedCourse = await prisma.completedCourse.findUnique({
      where: {
        studentId_courseId: {
          studentId: studentId,
          courseId: courseNo,
        },
      },
      include: {
        course: {
          select: {
            courseNo: true,
            title: true,
          },
        },
      },
    });

    if (!completedCourse) {
      return res.status(404).json({
        message: "Completed course not found",
      });
    }

    // delete
    await prisma.completedCourse.delete({
      where: {
        studentId_courseId: {
          studentId: studentId,
          courseId: courseNo,
        },
      },
    });

    res.status(200).json({
      message: "Completed course removed successfully",
      removed: {
        courseNo: completedCourse.course.courseNo,
        title: completedCourse.course.title,
      },
    });
  } catch (error) {
    console.error("Error removing completed course:", error);
    res.status(500).json({
      message: "Internal server error",
    });
  }
});

export default router;
