import express from "express";
import prisma from "../lib/db.js";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { generateCompletion, type AiRequestOptions } from "../services/aiService.js";

const router = express.Router();
router.use(authMiddleware);

const SYSTEM_PROMPT = `You are an academic advisor AI for Alabama A&M University (AAMU) Computer Science department.
Provide career path and graduate study recommendations based on a student's actual academic profile.
Ground all recommendations in the specific courses and grades the student has completed.

Return a valid JSON object with this exact structure (no markdown, no extra text):
{
  "industryPaths": [
    {
      "title": "string",
      "fit": "high" | "medium" | "low",
      "reasoning": "string (1-2 sentences grounded in their specific courses/grades)",
      "coursesToTake": ["CS XXX"]
    }
  ],
  "gradPaths": [
    {
      "title": "string",
      "fit": "high" | "medium" | "low",
      "reasoning": "string (1-2 sentences)",
      "requirements": ["string"]
    }
  ],
  "skillGaps": ["string"],
  "nextStep": "string (1-2 sentences — specific advisor recommendation for this student)"
}

Include 2-3 industry paths and 1-2 graduate study options. Return ONLY the JSON object.`;

const CONCENTRATION_LABELS: Record<string, string> = {
  GCS: "General Computer Science",
  AI: "Artificial Intelligence",
  CYS: "Cybersecurity",
};

function buildPrompt(student: {
  name: string;
  currentYear: string;
  currentSem: string;
  currentGpa: number | null;
  concentration: string;
  completedCourses: { courseId: string; title: string; grade: string; category: string }[];
}): string {
  const courses = student.completedCourses
    .map((cc) => `  ${cc.courseId} — ${cc.title} (Grade: ${cc.grade}, ${cc.category})`)
    .join("\n");

  const concentrationLabel =
    CONCENTRATION_LABELS[student.concentration] ?? student.concentration;

  return `Student Academic Profile:
Name: ${student.name}
Year: ${student.currentYear} | Semester: ${student.currentSem}
GPA: ${student.currentGpa !== null ? student.currentGpa.toFixed(2) : "Not recorded"}
Concentration: ${concentrationLabel} (${student.concentration})

Completed Courses (${student.completedCourses.length} total):
${courses || "  None recorded yet"}

Provide career and graduate study recommendations tailored to this specific student's profile.`;
}

function extractJson(raw: string): string {
  // Strip markdown code fences if the LLM wraps the output
  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenced?.[1]) return fenced[1].trim();
  // Otherwise find the outermost { ... } block
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start !== -1 && end !== -1 && end > start) return raw.slice(start, end + 1);
  return raw.trim();
}

// GET /students/:id/career-insights
router.get("/:id/career-insights", async (req, res) => {
  try {
    const studentId = parseInt(req.params["id"] ?? "");
    const teacherId = req.userId;

    if (isNaN(studentId)) return res.status(400).json({ message: "Invalid student ID" });
    if (!teacherId) return res.status(401).json({ message: "Unauthorized" });

    const student = await prisma.student.findFirst({
      where: { id: studentId, teacherId },
      include: {
        completedCourses: {
          include: { course: true },
        },
      },
    });

    if (!student) return res.status(404).json({ message: "Student not found" });

    const prompt = buildPrompt({
      name: student.name,
      currentYear: student.currentYear,
      currentSem: student.currentSem,
      currentGpa: student.currentGpa,
      concentration: student.concentration,
      completedCourses: student.completedCourses.map((cc) => ({
        courseId: cc.courseId,
        title: cc.course.title,
        grade: cc.grade,
        category: cc.course.category,
      })),
    });

    const p = typeof req.headers["x-ai-provider"] === "string" ? req.headers["x-ai-provider"] : null;
    const k = typeof req.headers["x-ai-api-key"]  === "string" ? req.headers["x-ai-api-key"]  : null;
    const aiOpts: AiRequestOptions = {
      ...(p ? { provider: p } : {}),
      ...(k ? { apiKey: k }   : {}),
    };

    let raw: string;
    try {
      raw = await generateCompletion(SYSTEM_PROMPT, prompt, aiOpts);
    } catch (err) {
      const message = err instanceof Error ? err.message : "AI service unavailable";
      return res.status(503).json({ message: `AI service error: ${message}` });
    }

    let insights: unknown;
    try {
      insights = JSON.parse(extractJson(raw));
    } catch {
      console.error("Failed to parse AI response:", raw);
      return res.status(502).json({ message: "AI returned an invalid response. Please try again." });
    }

    res.json(insights);
  } catch (error) {
    console.error("Error generating career insights:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

export default router;
