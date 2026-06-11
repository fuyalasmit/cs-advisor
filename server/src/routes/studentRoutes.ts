import express from "express";
import { z } from "zod";
import prisma from "../lib/db.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(authMiddleware);

router.get("/", async (req, res) => {
  try {
    const teacherId = req.userId;

    if (!teacherId) {
      return res.status(401).json({
        message: "Unauthorized",
      });
    }

    const students = await prisma.student.findMany({
      where: {
        teacherId: teacherId,
      },
      select: {
        id: true,
        name: true,
        email: true,
        stream: true,
        currentYear: true,
        currentSem: true,
        currentGpa: true,
        concentration: true,
        isOnHold: true,
      },
      orderBy: {
        name: "asc",
      },
    });

    res.status(200).json({
      students,
      total: students.length,
    });
  } catch (error) {
    console.error("Error fetching students:", error);
    res.status(500).json({
      message: "Internal server error",
    });
  }
});

router.post("/", async (req, res) => {
  try {
    const studentSchema = z.object({
      name: z.string().min(1, "Name is required").max(100, "Name must be within 100 characters"),
      email: z.email("Invalid email format"),
      stream: z.string().default("computer science"),
      currentYear: z.enum(["freshman", "sophomore", "junior", "senior"]),
      currentSem: z.enum(["first", "second"]),
      currentGpa: z
        .number()
        .min(0, "GPA cannot be negative")
        .max(4.0, "GPA cannot exceed 4.0")
        .optional()
        .nullable(),
      concentration: z.string().default("GCS"),
    });

    const parsedData = studentSchema.safeParse(req.body);

    if (!parsedData.success) {
      return res.status(400).json({
        message: "Invalid student data",
        errors: parsedData.error.issues.map((issue) => ({
          field: issue.path.join("."),
          message: issue.message,
        })),
      });
    }

    const teacherId = req.userId;

    if (!teacherId) {
      return res.status(401).json({
        message: "Unauthorized",
      });
    }

    const existingStudent = await prisma.student.findUnique({
      where: {
        email: parsedData.data.email,
      },
    });

    if (existingStudent) {
      return res.status(409).json({
        message: "A student with this email already exists",
      });
    }

    const newStudent = await prisma.student.create({
      data: {
        name: parsedData.data.name,
        email: parsedData.data.email,
        stream: parsedData.data.stream,
        currentYear: parsedData.data.currentYear,
        currentSem: parsedData.data.currentSem,
        concentration: parsedData.data.concentration,
        teacherId: teacherId,
        ...(parsedData.data.currentGpa !== undefined && {
          currentGpa: parsedData.data.currentGpa,
        }),
      },
      select: {
        id: true,
        name: true,
        email: true,
        stream: true,
        currentYear: true,
        currentSem: true,
        currentGpa: true,
        concentration: true,
        isOnHold: true,
      },
    });

    res.status(201).json({
      message: "Student created successfully",
      student: newStudent,
    });
  } catch (error) {
    console.error("Error creating student:", error);
    res.status(500).json({
      message: "Internal server error",
    });
  }
});

router.get("/:id", async (req, res) => {
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
      include: {
        completedCourses: {
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
          orderBy: {
            courseId: "asc",
          },
        },
      },
    });

    if (!student) {
      return res.status(404).json({
        message: "Student not found",
      });
    }

    const totalCredits = student.completedCourses.reduce(
      (sum: number, cc: any) => sum + cc.course.creditHour,
      0
    );

    res.status(200).json({
      student: {
        id: student.id,
        name: student.name,
        email: student.email,
        stream: student.stream,
        currentYear: student.currentYear,
        currentSem: student.currentSem,
        currentGpa: student.currentGpa,
        concentration: student.concentration,
        isOnHold: student.isOnHold,
        holdReason: student.holdReason,
        completedCourses: student.completedCourses.map((cc: any) => ({
          courseNo: cc.course.courseNo,
          title: cc.course.title,
          creditHour: cc.course.creditHour,
          category: cc.course.category,
          grade: cc.grade,
        })),
        totalCredits,
      },
    });
  } catch (error) {
    console.error("Error fetching student details:", error);
    res.status(500).json({
      message: "Internal server error",
    });
  }
});

router.patch("/:id", async (req, res) => {
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

    const updateSchema = z.object({
      name: z.string().min(1).max(100).optional(),
      email: z.email().optional(),
      stream: z.string().optional(),
      currentYear: z.enum(["freshman", "sophomore", "junior", "senior"]).optional(),
      currentSem: z.enum(["first", "second"]).optional(),
      currentGpa: z.number().min(0).max(4.0).optional().nullable(),
      concentration: z.string().optional(),
      isOnHold: z.boolean().optional(),
      holdReason: z.string().max(500).optional().nullable(),
    });

    const parsedData = updateSchema.safeParse(req.body);

    if (!parsedData.success) {
      return res.status(400).json({
        message: "Invalid update data",
        errors: parsedData.error.issues.map((issue) => ({
          field: issue.path.join("."),
          message: issue.message,
        })),
      });
    }

    const existingStudent = await prisma.student.findFirst({
      where: {
        id: studentId,
        teacherId: teacherId,
      },
    });

    if (!existingStudent) {
      return res.status(404).json({
        message: "Student not found",
      });
    }

    // duplicate email checks
    if (parsedData.data.email && parsedData.data.email !== existingStudent.email) {
      const emailExists = await prisma.student.findUnique({
        where: {
          email: parsedData.data.email,
        },
      });

      if (emailExists) {
        return res.status(409).json({
          message: "A student with this email already exists",
        });
      }
    }

    // obj to update with
    const updateData: any = {};
    if (parsedData.data.name !== undefined) updateData.name = parsedData.data.name;
    if (parsedData.data.email !== undefined) updateData.email = parsedData.data.email;
    if (parsedData.data.stream !== undefined) updateData.stream = parsedData.data.stream;
    if (parsedData.data.currentYear !== undefined) updateData.currentYear = parsedData.data.currentYear;
    if (parsedData.data.currentSem !== undefined) updateData.currentSem = parsedData.data.currentSem;
    if (parsedData.data.currentGpa !== undefined) updateData.currentGpa = parsedData.data.currentGpa;
    if (parsedData.data.concentration !== undefined) updateData.concentration = parsedData.data.concentration;
    if (parsedData.data.isOnHold !== undefined) updateData.isOnHold = parsedData.data.isOnHold;
    if (parsedData.data.holdReason !== undefined) updateData.holdReason = parsedData.data.holdReason;

    const updatedStudent = await prisma.student.update({
      where: {
        id: studentId,
      },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        stream: true,
        currentYear: true,
        currentSem: true,
        currentGpa: true,
        concentration: true,
        isOnHold: true,
        holdReason: true,
      },
    });

    res.status(200).json({
      message: "Student updated successfully",
      student: updatedStudent,
    });
  } catch (error) {
    console.error("Error updating student:", error);
    res.status(500).json({
      message: "Internal server error",
    });
  }
});

router.delete("/:id", async (req, res) => {
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

    await prisma.student.delete({
      where: {
        id: studentId,
      },
    });

    res.status(200).json({
      message: "Student deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting student:", error);
    res.status(500).json({
      message: "Internal server error",
    });
  }
});

export default router;
