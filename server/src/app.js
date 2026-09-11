import cors from "cors";
import express from "express";
import authRoutes from "./routes/authRoutes.js";
import dashboardRoutes from "./routes/dashboardRoutes.js";
import qaRoutes from "./routes/qaRoutes.js";
import sessionRoutes from "./routes/sessionRoutes.js";
import { errorHandler } from "./middleware/errorHandler.js";

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/sessions", sessionRoutes);
app.use("/api/qa", qaRoutes);
app.use("/api/dashboard", dashboardRoutes);

app.get("/api/health", (_request, response) => {
  response.json({ status: "ok", service: "interview-prep-coach-api" });
});

app.use(errorHandler);

export default app;
