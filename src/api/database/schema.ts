import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";

// Users table
export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  phone: text("phone").notNull().unique(),
  password: text("password").notNull(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  middleName: text("middle_name"),
  gender: text("gender"), // male | female
  birthDate: text("birth_date"),
  email: text("email"),
  photo: text("photo"),
  role: text("role").notNull().default("user"), // admin | manager | user | student
  isBanned: integer("is_banned", { mode: "boolean" }).default(false),
  banReason: text("ban_reason"),
  createdAt: integer("created_at").notNull(),
  lastSeen: integer("last_seen"),
});

// Tests table
export const tests = sqliteTable("tests", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  authorId: text("author_id").notNull(),
  type: text("type").notNull().default("training"), // training | rating1 | rating2 | exam
  scope: text("scope").notNull().default("personal"), // personal | shared
  status: text("status").notNull().default("pending"), // pending | approved | rejected
  timeLimit: integer("time_limit"), // minutes
  passingScore: real("passing_score").default(60),
  createdAt: integer("created_at").notNull(),
  updatedAt: integer("updated_at").notNull(),
});

// Questions table
export const questions = sqliteTable("questions", {
  id: text("id").primaryKey(),
  testId: text("test_id").notNull(),
  text: text("text").notNull(),
  type: text("type").notNull().default("single"), // single | multiple
  order: integer("order").notNull().default(0),
  explanation: text("explanation"),
});

// Answers table
export const answers = sqliteTable("answers", {
  id: text("id").primaryKey(),
  questionId: text("question_id").notNull(),
  text: text("text").notNull(),
  isCorrect: integer("is_correct", { mode: "boolean" }).notNull().default(false),
  order: integer("order").notNull().default(0),
});

// Test sessions (attempts)
export const testSessions = sqliteTable("test_sessions", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  testId: text("test_id").notNull(),
  score: real("score"),
  totalQuestions: integer("total_questions"),
  correctAnswers: integer("correct_answers"),
  status: text("status").notNull().default("in_progress"), // in_progress | completed | expired
  startedAt: integer("started_at").notNull(),
  completedAt: integer("completed_at"),
  answers: text("answers"), // JSON
});

// Chat messages
export const messages = sqliteTable("messages", {
  id: text("id").primaryKey(),
  chatType: text("chat_type").notNull(), // general | private | admin
  senderId: text("sender_id").notNull(),
  receiverId: text("receiver_id"), // for private chats
  text: text("text"),
  attachment: text("attachment"),
  isDeleted: integer("is_deleted", { mode: "boolean" }).default(false),
  scheduledAt: integer("scheduled_at"),
  createdAt: integer("created_at").notNull(),
});

// Ratings
export const ratings = sqliteTable("ratings", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  testId: text("test_id").notNull(),
  ratingType: text("rating_type").notNull(), // rating1 | rating2
  score: real("score").notNull(),
  grade: text("grade"), // A B C D F
  position: integer("position"),
  createdAt: integer("created_at").notNull(),
});

// Exam resets
export const examResets = sqliteTable("exam_resets", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  testId: text("test_id").notNull(),
  resetBy: text("reset_by").notNull(), // admin id
  resetAt: integer("reset_at").notNull(),
});
