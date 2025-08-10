import {
  users,
  quizzes,
  questions,
  quizAttempts,
  type User,
  type InsertUser,
  type Quiz,
  type InsertQuiz,
  type Question,
  type InsertQuestion,
  type QuizAttempt,
  type InsertQuizAttempt,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and } from "drizzle-orm";

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Quiz operations
  createQuiz(quiz: InsertQuiz): Promise<Quiz>;
  getQuizById(id: string): Promise<Quiz | undefined>;
  getQuizzesByTeacher(teacherId: string): Promise<Quiz[]>;
  getActiveQuizzes(): Promise<Quiz[]>;
  updateQuiz(id: string, updates: Partial<InsertQuiz>): Promise<Quiz | undefined>;
  
  // Question operations
  createQuestion(question: InsertQuestion): Promise<Question>;
  getQuestionsByQuizId(quizId: string): Promise<Question[]>;
  
  // Quiz attempt operations
  createQuizAttempt(attempt: InsertQuizAttempt): Promise<QuizAttempt>;
  getAttemptsByQuizId(quizId: string): Promise<(QuizAttempt & { student: User })[]>;
  getAttemptsByStudentId(studentId: string): Promise<(QuizAttempt & { quiz: Quiz })[]>;
  getAttemptByStudentAndQuiz(studentId: string, quizId: string): Promise<QuizAttempt | undefined>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async createUser(userData: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .returning();
    return user;
  }

  // Quiz operations
  async createQuiz(quiz: InsertQuiz): Promise<Quiz> {
    const [createdQuiz] = await db.insert(quizzes).values(quiz).returning();
    return createdQuiz;
  }

  async getQuizById(id: string): Promise<Quiz | undefined> {
    const [quiz] = await db.select().from(quizzes).where(eq(quizzes.id, id));
    return quiz;
  }

  async getQuizzesByTeacher(teacherId: string): Promise<Quiz[]> {
    return await db
      .select()
      .from(quizzes)
      .where(eq(quizzes.createdBy, teacherId))
      .orderBy(desc(quizzes.createdAt));
  }

  async getActiveQuizzes(): Promise<Quiz[]> {
    return await db
      .select()
      .from(quizzes)
      .where(eq(quizzes.isActive, true))
      .orderBy(desc(quizzes.createdAt));
  }

  async updateQuiz(id: string, updates: Partial<InsertQuiz>): Promise<Quiz | undefined> {
    const [updatedQuiz] = await db
      .update(quizzes)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(quizzes.id, id))
      .returning();
    return updatedQuiz;
  }

  // Question operations
  async createQuestion(question: InsertQuestion): Promise<Question> {
    const [createdQuestion] = await db.insert(questions).values(question).returning();
    return createdQuestion;
  }

  async getQuestionsByQuizId(quizId: string): Promise<Question[]> {
    return await db
      .select()
      .from(questions)
      .where(eq(questions.quizId, quizId))
      .orderBy(questions.questionNumber);
  }

  // Quiz attempt operations
  async createQuizAttempt(attempt: InsertQuizAttempt): Promise<QuizAttempt> {
    const [createdAttempt] = await db.insert(quizAttempts).values(attempt).returning();
    return createdAttempt;
  }

  async getAttemptsByQuizId(quizId: string): Promise<(QuizAttempt & { student: User })[]> {
    return await db
      .select({
        id: quizAttempts.id,
        quizId: quizAttempts.quizId,
        studentId: quizAttempts.studentId,
        answers: quizAttempts.answers,
        score: quizAttempts.score,
        totalQuestions: quizAttempts.totalQuestions,
        timeTaken: quizAttempts.timeTaken,
        completedAt: quizAttempts.completedAt,
        student: users,
      })
      .from(quizAttempts)
      .innerJoin(users, eq(quizAttempts.studentId, users.id))
      .where(eq(quizAttempts.quizId, quizId))
      .orderBy(desc(quizAttempts.completedAt));
  }

  async getAttemptsByStudentId(studentId: string): Promise<(QuizAttempt & { quiz: Quiz })[]> {
    return await db
      .select({
        id: quizAttempts.id,
        quizId: quizAttempts.quizId,
        studentId: quizAttempts.studentId,
        answers: quizAttempts.answers,
        score: quizAttempts.score,
        totalQuestions: quizAttempts.totalQuestions,
        timeTaken: quizAttempts.timeTaken,
        completedAt: quizAttempts.completedAt,
        quiz: quizzes,
      })
      .from(quizAttempts)
      .innerJoin(quizzes, eq(quizAttempts.quizId, quizzes.id))
      .where(eq(quizAttempts.studentId, studentId))
      .orderBy(desc(quizAttempts.completedAt));
  }

  async getAttemptByStudentAndQuiz(studentId: string, quizId: string): Promise<QuizAttempt | undefined> {
    const [attempt] = await db
      .select()
      .from(quizAttempts)
      .where(and(eq(quizAttempts.studentId, studentId), eq(quizAttempts.quizId, quizId)));
    return attempt;
  }
}

export const storage = new DatabaseStorage();
