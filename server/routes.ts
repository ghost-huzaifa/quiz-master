import type { Express } from "express";
import express from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./auth";
import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs/promises";
import {
  insertQuizSchema,
  insertQuestionSchema,
  insertQuizAttemptSchema,
} from "@shared/schema";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configure multer for image uploads
const storage_config = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = path.join(__dirname, "../uploads");
    try {
      await fs.access(uploadDir);
    } catch {
      await fs.mkdir(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, "question-" + uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({
  storage: storage_config,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      const error = new Error("Only image files are allowed") as any;
      error.code = "INVALID_FILE_TYPE";
      cb(error, false);
    }
  },
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Health check endpoint
  app.get("/api/health", (req, res) => {
    res.status(200).json({
      status: "healthy",
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || "1.0.0",
    });
  });

  // Auth middleware
  setupAuth(app);

  // Serve uploaded images
  app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

  // Image upload endpoint
  app.post("/api/upload/image", isAuthenticated, (req: any, res) => {
    upload.single("image")(req, res, async (err) => {
      try {
        if (err) {
          console.error("Multer error:", err);
          if (err.code === "LIMIT_FILE_SIZE") {
            return res
              .status(400)
              .json({ message: "File size too large. Maximum size is 5MB." });
          }
          if (err.message.includes("Only image files")) {
            return res
              .status(400)
              .json({ message: "Only image files are allowed" });
          }
          return res
            .status(400)
            .json({ message: "File upload error: " + err.message });
        }

        const userId = req.user.id;
        const user = await storage.getUser(userId);

        if (user?.role !== "teacher") {
          return res
            .status(403)
            .json({ message: "Only teachers can upload images" });
        }

        if (!req.file) {
          return res.status(400).json({ message: "No image file provided" });
        }

        const imageUrl = `/uploads/${req.file.filename}`;
        res.json({ url: imageUrl });
      } catch (error) {
        console.error("Error uploading image:", error);
        res.status(500).json({ message: "Failed to upload image" });
      }
    });
  });

  // Quiz routes
  app.post("/api/quizzes", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);

      if (user?.role !== "teacher") {
        return res
          .status(403)
          .json({ message: "Only teachers can create quizzes" });
      }

      const quizData = insertQuizSchema.parse({
        ...req.body,
        createdBy: userId,
      });
      const quiz = await storage.createQuiz(quizData);

      res.json(quiz);
    } catch (error) {
      console.error("Error creating quiz:", error);
      res.status(500).json({ message: "Failed to create quiz" });
    }
  });

  app.get("/api/quizzes", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);

      let quizzes;
      if (user?.role === "teacher") {
        quizzes = await storage.getQuizzesByTeacher(userId);
      } else {
        quizzes = await storage.getActiveQuizzes();
      }

      res.json(quizzes);
    } catch (error) {
      console.error("Error fetching quizzes:", error);
      res.status(500).json({ message: "Failed to fetch quizzes" });
    }
  });

  app.get("/api/quizzes/:id", isAuthenticated, async (req, res) => {
    try {
      const quiz = await storage.getQuizById(req.params.id);
      if (!quiz) {
        return res.status(404).json({ message: "Quiz not found" });
      }
      res.json(quiz);
    } catch (error) {
      console.error("Error fetching quiz:", error);
      res.status(500).json({ message: "Failed to fetch quiz" });
    }
  });

  // Question routes
  app.post(
    "/api/quizzes/:quizId/questions",
    isAuthenticated,
    async (req: any, res) => {
      try {
        const userId = req.user.id;
        const user = await storage.getUser(userId);

        if (user?.role !== "teacher") {
          return res
            .status(403)
            .json({ message: "Only teachers can add questions" });
        }

        const quiz = await storage.getQuizById(req.params.quizId);
        if (!quiz || quiz.createdBy !== userId) {
          return res.status(403).json({
            message: "You can only add questions to your own quizzes",
          });
        }

        const questionData = insertQuestionSchema.parse({
          ...req.body,
          quizId: req.params.quizId,
        });

        const question = await storage.createQuestion(questionData);
        res.json(question);
      } catch (error) {
        console.error("Error creating question:", error);
        res.status(500).json({ message: "Failed to create question" });
      }
    }
  );

  app.get(
    "/api/quizzes/:quizId/questions",
    isAuthenticated,
    async (req, res) => {
      try {
        const questions = await storage.getQuestionsByQuizId(req.params.quizId);
        res.json(questions);
      } catch (error) {
        console.error("Error fetching questions:", error);
        res.status(500).json({ message: "Failed to fetch questions" });
      }
    }
  );

  // Quiz attempt routes
  app.post(
    "/api/quizzes/:quizId/attempts",
    isAuthenticated,
    async (req: any, res) => {
      try {
        const userId = req.user.id;
        const user = await storage.getUser(userId);

        if (user?.role !== "student") {
          return res
            .status(403)
            .json({ message: "Only students can take quizzes" });
        }

        // Check if student already took this quiz
        const existingAttempt = await storage.getAttemptByStudentAndQuiz(
          userId,
          req.params.quizId
        );
        if (existingAttempt) {
          return res
            .status(400)
            .json({ message: "You have already taken this quiz" });
        }

        const attemptData = insertQuizAttemptSchema.parse({
          ...req.body,
          quizId: req.params.quizId,
          studentId: userId,
        });

        const attempt = await storage.createQuizAttempt(attemptData);
        res.json(attempt);
      } catch (error) {
        console.error("Error creating quiz attempt:", error);
        res.status(500).json({ message: "Failed to create quiz attempt" });
      }
    }
  );

  app.get(
    "/api/quizzes/:quizId/attempts",
    isAuthenticated,
    async (req: any, res) => {
      try {
        const userId = req.user.id;
        const user = await storage.getUser(userId);

        if (user?.role !== "teacher") {
          return res
            .status(403)
            .json({ message: "Only teachers can view quiz attempts" });
        }

        // Verify teacher owns this quiz
        const quiz = await storage.getQuizById(req.params.quizId);
        if (!quiz || quiz.createdBy !== userId) {
          return res.status(403).json({
            message: "You can only view attempts for your own quizzes",
          });
        }

        const attempts = await storage.getAttemptsByQuizId(req.params.quizId);
        res.json(attempts);
      } catch (error) {
        console.error("Error fetching quiz attempts:", error);
        res.status(500).json({ message: "Failed to fetch quiz attempts" });
      }
    }
  );

  app.get(
    "/api/students/:studentId/attempts",
    isAuthenticated,
    async (req: any, res) => {
      try {
        const userId = req.user.id;
        const requestedStudentId = req.params.studentId;

        // Students can only view their own attempts
        if (userId !== requestedStudentId) {
          const user = await storage.getUser(userId);
          if (user?.role !== "teacher") {
            return res.status(403).json({ message: "Access denied" });
          }
        }

        const attempts = await storage.getAttemptsByStudentId(
          requestedStudentId
        );
        res.json(attempts);
      } catch (error) {
        console.error("Error fetching student attempts:", error);
        res.status(500).json({ message: "Failed to fetch student attempts" });
      }
    }
  );

  const httpServer = createServer(app);
  return httpServer;
}
