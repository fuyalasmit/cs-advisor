import express from "express";
import prisma from "./lib/db.js";
import jwt from "jsonwebtoken";
import { z } from "zod";
import bcrypt from "bcrypt";

const app = express();

app.use(express.json());

app.get("/health", (req, res) => {
  res.json({
    message: "health check passed.",
  });
});

app.post("/signup", async (req, res) => {
  const requiredBody = z.object({
    email: z.email(),
    password: z
      .string()
      .min(5, "Password must be at least 5 character")
      .max(20, "Password must be within 20 characters"),
    name: z
      .string()
      .min(1, "Name must have at least one character")
      .max(30, "Exceeded character limit for name"),
  });
  const parsedData = requiredBody.safeParse(req.body);

  if (!parsedData.success) {
    const parsedMessage = JSON.parse(parsedData.error.message);
    const messages = parsedMessage.map((value: any) => value.message);

    return res.status(400).json({
      message: messages,
    });
  }

  const { email, password, name } = parsedData.data;

  try {
    const hashedPassword = await bcrypt.hash(password, 5);

    await prisma.teacher.create({
      data: {
        name,
        email,
        password: hashedPassword,
      },
    });

    res.status(200).json({
      message: "You're signed up.",
      hashedPassword: hashedPassword,
    });
  } catch (error) {
    res.status(500).json({
      message: "Internal server error",
    });
  }
});

app.listen(3000);
