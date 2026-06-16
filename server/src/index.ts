import express from "express";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import cors from "cors";

import authRoute from "../src/routes/authRoutes.js";
import courseRoute from "../src/routes/courseRoutes.js";
import studentRoute from "../src/routes/studentRoutes.js";
import progressRoute from "../src/routes/progressRoutes.js";
import suggestionRoute from "../src/routes/suggestionRoutes.js";
import riskRoute from "../src/routes/riskRoutes.js";
import careerRoute from "../src/routes/careerRoutes.js";

dotenv.config();
const FE_URL = process.env.FE_URL;
const PORT = process.env.PORT || 3000;

const app = express();

app.use(express.json());
app.use(cookieParser());
app.use(
  cors({
    origin: FE_URL,
    credentials: true,
  })
);

app.get("/api/v1/health", (req, res) => {
  res.json({
    message: "health check passed.",
  });
});

app.use("/api/v1/auth", authRoute);
app.use("/api/v1/courses", courseRoute);
// riskRoute before studentRoute so /risk-summary doesn't match /:id
app.use("/api/v1/students", riskRoute);
app.use("/api/v1/students", studentRoute);
app.use("/api/v1/students", progressRoute);
app.use("/api/v1/students", suggestionRoute);
app.use("/api/v1/students", careerRoute);

app.listen(PORT, () => {
  console.log("Server listening on port", PORT);
});
