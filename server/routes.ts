import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./auth";
import {
  insertQuizSchema,
  insertQuestionSchema,
  insertQuizAttemptSchema,
} from "@shared/schema";

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
          return res
            .status(403)
            .json({
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
          return res
            .status(403)
            .json({
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
