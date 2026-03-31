import { Hono } from "hono";
import { drizzle } from "drizzle-orm/d1";
import { eq, and, desc, or, ne } from "drizzle-orm";
import * as schema from "./database/schema";
import { createId } from "@paralleldrive/cuid2";
import bcrypt from "bcryptjs";

type Env = { DB: D1Database };
const app = new Hono<{ Bindings: Env }>();

function db(c: any) {
  return drizzle(c.env.DB, { schema });
}

function genId() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function now() {
  return Math.floor(Date.now() / 1000);
}

function hashPassword(password: string): string {
  // Simple hash - in production use bcrypt
  let hash = 0;
  for (let i = 0; i < password.length; i++) {
    const char = password.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16) + password.length.toString(16) + "jtest";
}

// ===================== AUTH =====================

app.post("/api/auth/register", async (c) => {
  try {
    const { phone, password, firstName, lastName, middleName, gender, birthDate, email } = await c.req.json();
    
    if (!phone || !password || !firstName || !lastName) {
      return c.json({ error: "Заполните все обязательные поля" }, 400);
    }
    
    if (!phone.startsWith("+992")) {
      return c.json({ error: "Номер должен начинаться с +992" }, 400);
    }
    
    const d = db(c);
    const existing = await d.select().from(schema.users).where(eq(schema.users.phone, phone)).get();
    if (existing) {
      return c.json({ error: "Этот номер уже зарегистрирован" }, 400);
    }
    
    const id = genId();
    const hashedPwd = hashPassword(password);
    
    await d.insert(schema.users).values({
      id,
      phone,
      password: hashedPwd,
      firstName,
      lastName,
      middleName: middleName || null,
      gender: gender || null,
      birthDate: birthDate || null,
      email: email || null,
      role: "student",
      createdAt: now(),
      lastSeen: now(),
    });
    
    const user = await d.select().from(schema.users).where(eq(schema.users.id, id)).get();
    const { password: _, ...safeUser } = user!;
    return c.json({ user: safeUser });
  } catch (e: any) {
    return c.json({ error: e.message }, 500);
  }
});

app.post("/api/auth/login", async (c) => {
  try {
    const { phone, password } = await c.req.json();
    const d = db(c);
    
    // Admin hardcoded
    if (phone === "+992917971000" && password === "Jovid2004.") {
      let admin = await d.select().from(schema.users).where(eq(schema.users.phone, "+992917971000")).get();
      if (!admin) {
        const adminId = "admin_" + genId();
        await d.insert(schema.users).values({
          id: adminId,
          phone: "+992917971000",
          password: hashPassword("Jovid2004."),
          firstName: "Човидон",
          lastName: "Исмоилзода",
          middleName: "Нурулло",
          gender: "male",
          role: "admin",
          createdAt: now(),
          lastSeen: now(),
        });
        admin = await d.select().from(schema.users).where(eq(schema.users.id, adminId)).get();
      }
      const { password: _, ...safeAdmin } = admin!;
      return c.json({ user: safeAdmin });
    }
    
    const user = await d.select().from(schema.users).where(eq(schema.users.phone, phone)).get();
    if (!user) return c.json({ error: "Пользователь не найден" }, 404);
    if (user.isBanned) return c.json({ error: "Аккаунт заблокирован: " + (user.banReason || "") }, 403);
    
    const hashedPwd = hashPassword(password);
    if (user.password !== hashedPwd) return c.json({ error: "Неверный пароль" }, 401);
    
    await d.update(schema.users).set({ lastSeen: now() }).where(eq(schema.users.id, user.id));
    const { password: _, ...safeUser } = user;
    return c.json({ user: safeUser });
  } catch (e: any) {
    return c.json({ error: e.message }, 500);
  }
});

app.put("/api/users/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const body = await c.req.json();
    const d = db(c);
    
    const updates: any = {};
    if (body.firstName) updates.firstName = body.firstName;
    if (body.lastName) updates.lastName = body.lastName;
    if (body.middleName !== undefined) updates.middleName = body.middleName;
    if (body.gender) updates.gender = body.gender;
    if (body.birthDate) updates.birthDate = body.birthDate;
    if (body.email !== undefined) updates.email = body.email;
    if (body.photo !== undefined) updates.photo = body.photo;
    
    await d.update(schema.users).set(updates).where(eq(schema.users.id, id));
    const user = await d.select().from(schema.users).where(eq(schema.users.id, id)).get();
    const { password: _, ...safeUser } = user!;
    return c.json({ user: safeUser });
  } catch (e: any) {
    return c.json({ error: e.message }, 500);
  }
});

app.get("/api/users", async (c) => {
  try {
    const d = db(c);
    const allUsers = await d.select({
      id: schema.users.id,
      phone: schema.users.phone,
      firstName: schema.users.firstName,
      lastName: schema.users.lastName,
      middleName: schema.users.middleName,
      gender: schema.users.gender,
      email: schema.users.email,
      photo: schema.users.photo,
      role: schema.users.role,
      isBanned: schema.users.isBanned,
      banReason: schema.users.banReason,
      createdAt: schema.users.createdAt,
      lastSeen: schema.users.lastSeen,
    }).from(schema.users);
    return c.json({ users: allUsers });
  } catch (e: any) {
    return c.json({ error: e.message }, 500);
  }
});

app.put("/api/users/:id/ban", async (c) => {
  try {
    const id = c.req.param("id");
    const { banned, reason } = await c.req.json();
    const d = db(c);
    
    // Cannot ban admin
    const user = await d.select().from(schema.users).where(eq(schema.users.id, id)).get();
    if (user?.phone === "+992917971000") {
      return c.json({ error: "Нельзя заблокировать администратора" }, 403);
    }
    
    await d.update(schema.users).set({ isBanned: banned, banReason: reason || null }).where(eq(schema.users.id, id));
    return c.json({ success: true });
  } catch (e: any) {
    return c.json({ error: e.message }, 500);
  }
});

app.put("/api/users/:id/role", async (c) => {
  try {
    const id = c.req.param("id");
    const { role } = await c.req.json();
    const d = db(c);
    
    const user = await d.select().from(schema.users).where(eq(schema.users.id, id)).get();
    if (user?.phone === "+992917971000") {
      return c.json({ error: "Нельзя изменить роль администратора" }, 403);
    }
    
    await d.update(schema.users).set({ role }).where(eq(schema.users.id, id));
    return c.json({ success: true });
  } catch (e: any) {
    return c.json({ error: e.message }, 500);
  }
});

// ===================== TESTS =====================

app.get("/api/tests", async (c) => {
  try {
    const d = db(c);
    const userId = c.req.query("userId");
    const scope = c.req.query("scope");
    const type = c.req.query("type");
    
    let query = d.select().from(schema.tests);
    const allTests = await query;
    
    let filtered = allTests;
    if (scope) filtered = filtered.filter(t => t.scope === scope);
    if (type) filtered = filtered.filter(t => t.type === type);
    
    // Personal: own tests OR approved shared
    if (userId) {
      filtered = filtered.filter(t => 
        t.authorId === userId || 
        (t.scope === "shared" && t.status === "approved") ||
        t.authorId === userId
      );
    }
    
    return c.json({ tests: filtered });
  } catch (e: any) {
    return c.json({ error: e.message }, 500);
  }
});

app.get("/api/tests/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const d = db(c);
    
    const test = await d.select().from(schema.tests).where(eq(schema.tests.id, id)).get();
    if (!test) return c.json({ error: "Тест не найден" }, 404);
    
    const qs = await d.select().from(schema.questions).where(eq(schema.questions.testId, id));
    const questionIds = qs.map(q => q.id);
    
    let ans: typeof schema.answers.$inferSelect[] = [];
    for (const qid of questionIds) {
      const qAnswers = await d.select().from(schema.answers).where(eq(schema.answers.questionId, qid));
      ans = [...ans, ...qAnswers];
    }
    
    return c.json({ test, questions: qs, answers: ans });
  } catch (e: any) {
    return c.json({ error: e.message }, 500);
  }
});

app.post("/api/tests", async (c) => {
  try {
    const body = await c.req.json();
    const { title, description, authorId, type, scope, timeLimit, passingScore, questions: qs } = body;
    
    const d = db(c);
    const testId = genId();
    
    // Auto-approve personal tests, pending for shared
    const status = scope === "personal" ? "approved" : "pending";
    
    await d.insert(schema.tests).values({
      id: testId,
      title,
      description: description || null,
      authorId,
      type: type || "training",
      scope: scope || "personal",
      status,
      timeLimit: timeLimit || null,
      passingScore: passingScore || 60,
      createdAt: now(),
      updatedAt: now(),
    });
    
    // Insert questions and answers
    if (qs && qs.length > 0) {
      for (let i = 0; i < qs.length; i++) {
        const q = qs[i];
        const qId = genId();
        await d.insert(schema.questions).values({
          id: qId,
          testId,
          text: q.text,
          type: q.type || "single",
          order: i,
          explanation: q.explanation || null,
        });
        
        if (q.answers && q.answers.length > 0) {
          for (let j = 0; j < q.answers.length; j++) {
            const a = q.answers[j];
            await d.insert(schema.answers).values({
              id: genId(),
              questionId: qId,
              text: a.text,
              isCorrect: a.isCorrect || false,
              order: j,
            });
          }
        }
      }
    }
    
    return c.json({ testId, status });
  } catch (e: any) {
    return c.json({ error: e.message }, 500);
  }
});

app.put("/api/tests/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const body = await c.req.json();
    const d = db(c);
    
    const updates: any = { updatedAt: now() };
    if (body.title) updates.title = body.title;
    if (body.description !== undefined) updates.description = body.description;
    if (body.timeLimit !== undefined) updates.timeLimit = body.timeLimit;
    if (body.passingScore !== undefined) updates.passingScore = body.passingScore;
    if (body.status) updates.status = body.status;
    
    await d.update(schema.tests).set(updates).where(eq(schema.tests.id, id));
    
    // Update questions if provided
    if (body.questions) {
      // Delete old questions and answers
      const oldQs = await d.select().from(schema.questions).where(eq(schema.questions.testId, id));
      for (const oq of oldQs) {
        await d.delete(schema.answers).where(eq(schema.answers.questionId, oq.id));
      }
      await d.delete(schema.questions).where(eq(schema.questions.testId, id));
      
      // Insert new
      for (let i = 0; i < body.questions.length; i++) {
        const q = body.questions[i];
        const qId = q.id || genId();
        await d.insert(schema.questions).values({
          id: qId,
          testId: id,
          text: q.text,
          type: q.type || "single",
          order: i,
          explanation: q.explanation || null,
        });
        
        if (q.answers) {
          for (let j = 0; j < q.answers.length; j++) {
            const a = q.answers[j];
            await d.insert(schema.answers).values({
              id: genId(),
              questionId: qId,
              text: a.text,
              isCorrect: a.isCorrect || false,
              order: j,
            });
          }
        }
      }
    }
    
    return c.json({ success: true });
  } catch (e: any) {
    return c.json({ error: e.message }, 500);
  }
});

app.delete("/api/tests/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const d = db(c);
    
    const qs = await d.select().from(schema.questions).where(eq(schema.questions.testId, id));
    for (const q of qs) {
      await d.delete(schema.answers).where(eq(schema.answers.questionId, q.id));
    }
    await d.delete(schema.questions).where(eq(schema.questions.testId, id));
    await d.delete(schema.tests).where(eq(schema.tests.id, id));
    
    return c.json({ success: true });
  } catch (e: any) {
    return c.json({ error: e.message }, 500);
  }
});

// ===================== SESSIONS =====================

app.post("/api/sessions", async (c) => {
  try {
    const { userId, testId } = await c.req.json();
    const d = db(c);
    
    const id = genId();
    await d.insert(schema.testSessions).values({
      id,
      userId,
      testId,
      status: "in_progress",
      startedAt: now(),
      totalQuestions: 0,
      correctAnswers: 0,
    });
    
    return c.json({ sessionId: id });
  } catch (e: any) {
    return c.json({ error: e.message }, 500);
  }
});

app.put("/api/sessions/:id/complete", async (c) => {
  try {
    const id = c.req.param("id");
    const { score, totalQuestions, correctAnswers, answers } = await c.req.json();
    const d = db(c);
    
    await d.update(schema.testSessions).set({
      score,
      totalQuestions,
      correctAnswers,
      status: "completed",
      completedAt: now(),
      answers: JSON.stringify(answers),
    }).where(eq(schema.testSessions.id, id));
    
    return c.json({ success: true });
  } catch (e: any) {
    return c.json({ error: e.message }, 500);
  }
});

app.get("/api/sessions", async (c) => {
  try {
    const userId = c.req.query("userId");
    const testId = c.req.query("testId");
    const d = db(c);
    
    let allSessions = await d.select().from(schema.testSessions);
    if (userId) allSessions = allSessions.filter(s => s.userId === userId);
    if (testId) allSessions = allSessions.filter(s => s.testId === testId);
    
    return c.json({ sessions: allSessions });
  } catch (e: any) {
    return c.json({ error: e.message }, 500);
  }
});

// GET single session with questions+answers for review
app.get("/api/sessions/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const d = db(c);
    const session = await d.select().from(schema.testSessions).where(eq(schema.testSessions.id, id)).get();
    if (!session) return c.json({ error: "Not found" }, 404);
    const questions = await d.select().from(schema.questions).where(eq(schema.questions.testId, session.testId));
    const answers = await d.select().from(schema.answers);
    const filteredAnswers = answers.filter(a => questions.some(q => q.id === a.questionId));
    return c.json({ session, questions, answers: filteredAnswers });
  } catch (e: any) {
    return c.json({ error: e.message }, 500);
  }
});

// ===================== RATINGS =====================

app.get("/api/ratings", async (c) => {
  try {
    const ratingType = c.req.query("type") || "rating1";
    const d = db(c);
    
    const allRatings = await d.select().from(schema.ratings)
      .where(eq(schema.ratings.ratingType, ratingType));
    
    return c.json({ ratings: allRatings });
  } catch (e: any) {
    return c.json({ error: e.message }, 500);
  }
});

// ===================== MESSAGES =====================

app.get("/api/messages", async (c) => {
  try {
    const chatType = c.req.query("chatType");
    const userId = c.req.query("userId");
    const otherUserId = c.req.query("otherUserId");
    const d = db(c);
    
    let msgs = await d.select().from(schema.messages);
    
    if (chatType === "general") {
      msgs = msgs.filter(m => m.chatType === "general" && !m.isDeleted);
    } else if (chatType === "private") {
      if (!userId || !otherUserId) return c.json({ messages: [] }); // both required
      msgs = msgs.filter(m => 
        m.chatType === "private" && !m.isDeleted &&
        ((m.senderId === userId && m.receiverId === otherUserId) ||
         (m.senderId === otherUserId && m.receiverId === userId))
      );
    } else if (chatType === "admin" && userId) {
      msgs = msgs.filter(m => 
        m.chatType === "admin" && !m.isDeleted &&
        (m.senderId === userId || m.receiverId === userId)
      );
    }
    
    msgs.sort((a, b) => a.createdAt - b.createdAt);
    return c.json({ messages: msgs });
  } catch (e: any) {
    return c.json({ error: e.message }, 500);
  }
});

app.post("/api/messages", async (c) => {
  try {
    const { chatType, senderId, receiverId, text, attachment, scheduledAt } = await c.req.json();
    const d = db(c);
    
    const id = genId();
    await d.insert(schema.messages).values({
      id,
      chatType,
      senderId,
      receiverId: receiverId || null,
      text: text || null,
      attachment: attachment || null,
      isDeleted: false,
      scheduledAt: scheduledAt || null,
      createdAt: now(),
    });
    
    return c.json({ messageId: id });
  } catch (e: any) {
    return c.json({ error: e.message }, 500);
  }
});

app.delete("/api/messages/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const d = db(c);
    await d.update(schema.messages).set({ isDeleted: true }).where(eq(schema.messages.id, id));
    return c.json({ success: true });
  } catch (e: any) {
    return c.json({ error: e.message }, 500);
  }
});

// ===================== EXAM RESETS =====================

app.post("/api/exam-resets", async (c) => {
  try {
    const { userId, testId, resetBy } = await c.req.json();
    const d = db(c);
    
    await d.insert(schema.examResets).values({
      id: genId(),
      userId,
      testId,
      resetBy,
      resetAt: now(),
    });
    
    return c.json({ success: true });
  } catch (e: any) {
    return c.json({ error: e.message }, 500);
  }
});

app.get("/api/exam-resets", async (c) => {
  try {
    const userId = c.req.query("userId");
    const testId = c.req.query("testId");
    const d = db(c);
    
    let resets = await d.select().from(schema.examResets);
    if (userId) resets = resets.filter(r => r.userId === userId);
    if (testId) resets = resets.filter(r => r.testId === testId);
    
    return c.json({ resets });
  } catch (e: any) {
    return c.json({ error: e.message }, 500);
  }
});

// ===================== RETAKE REQUESTS =====================

// User requests retake
app.post("/api/retake-requests", async (c) => {
  try {
    const { userId, testId, testType, reason } = await c.req.json();
    const d = db(c);
    // Check no pending request already
    const existing = await d.select().from(schema.retakeRequests);
    const dup = existing.find(r => r.userId === userId && r.testId === testId && r.status === "pending");
    if (dup) return c.json({ error: "Запрос уже отправлен, ожидайте" }, 400);

    const id = genId();
    await d.insert(schema.retakeRequests).values({
      id, userId, testId, testType: testType || "exam",
      reason: reason || null,
      status: "pending",
      requestedAt: now(),
    });
    return c.json({ id });
  } catch (e: any) {
    return c.json({ error: e.message }, 500);
  }
});

// Get all retake requests (admin) or user's own
app.get("/api/retake-requests", async (c) => {
  try {
    const userId = c.req.query("userId");
    const status = c.req.query("status");
    const d = db(c);
    let reqs = await d.select().from(schema.retakeRequests);
    if (userId) reqs = reqs.filter(r => r.userId === userId);
    if (status) reqs = reqs.filter(r => r.status === status);
    reqs.sort((a, b) => b.requestedAt - a.requestedAt);
    return c.json({ requests: reqs });
  } catch (e: any) {
    return c.json({ error: e.message }, 500);
  }
});

// Admin approves or rejects retake request
app.put("/api/retake-requests/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const { status, reviewedBy } = await c.req.json(); // approved | rejected
    const d = db(c);

    const req = await d.select().from(schema.retakeRequests).where(eq(schema.retakeRequests.id, id)).get();
    if (!req) return c.json({ error: "Запрос не найден" }, 404);

    await d.update(schema.retakeRequests).set({
      status,
      reviewedAt: now(),
      reviewedBy: reviewedBy || null,
    }).where(eq(schema.retakeRequests.id, id));

    // If approved — create an exam reset so user can retake
    if (status === "approved") {
      await d.insert(schema.examResets).values({
        id: genId(),
        userId: req.userId,
        testId: req.testId,
        resetBy: reviewedBy || "admin",
        resetAt: now(),
      });
    }

    return c.json({ success: true });
  } catch (e: any) {
    return c.json({ error: e.message }, 500);
  }
});

export default app;

