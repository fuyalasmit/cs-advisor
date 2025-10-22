import express from "express";
import { z } from "zod";
import prisma from "../lib/db.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();
const JWT_SECRET = process.env.JWT_SECRET;



const router = express.Router();

router.post("/signup", async (req, res) => {
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

  const userExists = await prisma.teacher.findFirst({
    where: {
      email: email,
    },
  });

  if (userExists) {
    return res.status(403).json({
      message: "Email already exists, try signing in.",
    });
  }

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
      // hashedPassword: hashedPassword,
    });
  } catch (error) {
    res.status(500).json({
      message: "Internal server error",
    });
  }
});

router.post("/signin", async (req, res) => {
  const requiredBody = z.object({
    email: z.email(),
    password: z.string().min(1),
  });

  const parsedData = requiredBody.safeParse(req.body);
  if (!parsedData.success) {
    return res.status(400).json({
      message: "Invalid credentials format.",
    });
  }

  const { email, password } = parsedData.data;

  const user = await prisma.teacher.findFirst({
    where: {
      email: email,
    },
  });

  if (!user) {
    return res.status(404).json({
      message: "Invalid Credentials",
    });
  }

  const isPasswordMatch = await bcrypt.compare(password, user.password);

  if (!JWT_SECRET) {
    return res.status(500).json({
      message: "Internal Server Error",
    });
  }

  if (isPasswordMatch) {
    const token = jwt.sign(
      {
        id: user.id,
      },
      JWT_SECRET,
      {
        expiresIn: "3d",
      }
    );

    res.cookie("token", token, {
      httpOnly: true,
      maxAge: 3 * 24 * 60 * 60 * 1000,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
    });

    res.status(200).json({
      message: "User signed in",
      token,
    });
  } else {
    res.status(403).json({
      message: "Invalid Credentials",
    });
  }
});

router.post("/signout", (req, res) => {
  res.clearCookie("token", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
  });

  res.status(200).json({
    message: "User signed out",
  });
});


export default router