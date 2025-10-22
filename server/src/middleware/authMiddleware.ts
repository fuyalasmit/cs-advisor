import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();
const JWT_SECRET = process.env.JWT_SECRET;

declare global {
  namespace Express {
    interface Request {
      userId?: number;
    }
  }
}

export const authMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.cookies.token;

    if (!token) {
      return res.status(401).json({
        message: "Authentication required",
      });
    }

    if (!JWT_SECRET) {
      return res.status(500).json({
        message: "Internal server error",
      });
    }

    const decoded = jwt.verify(token, JWT_SECRET) as { id: number };

    req.userId = decoded.id;

    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({
        message: "Invalid or expired token",
      });
    }

    console.error("Auth middleware error:", error);
    return res.status(500).json({
      message: "Internal server error",
    });
  }
};
