const BASE = "/api";

async function request(method: string, path: string, body?: any) {
  const res = await fetch(BASE + path, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  return res.json();
}

export const api = {
  // Auth
  login: (phone: string, password: string) =>
    request("POST", "/auth/login", { phone, password }),
  register: (data: any) => request("POST", "/auth/register", data),
  updateUser: (id: string, data: any) => request("PUT", `/users/${id}`, data),
  getUsers: () => request("GET", "/users"),
  banUser: (id: string, banned: boolean, reason?: string) =>
    request("PUT", `/users/${id}/ban`, { banned, reason }),
  changeRole: (id: string, role: string) =>
    request("PUT", `/users/${id}/role`, { role }),

  // Tests
  getTests: (params?: Record<string, string>) => {
    const qs = params ? "?" + new URLSearchParams(params).toString() : "";
    return request("GET", `/tests${qs}`);
  },
  getTest: (id: string) => request("GET", `/tests/${id}`),
  createTest: (data: any) => request("POST", "/tests", data),
  updateTest: (id: string, data: any) => request("PUT", `/tests/${id}`, data),
  deleteTest: (id: string) => request("DELETE", `/tests/${id}`),

  // Sessions
  startSession: (userId: string, testId: string) =>
    request("POST", "/sessions", { userId, testId }),
  completeSession: (id: string, data: any) =>
    request("PUT", `/sessions/${id}/complete`, data),
  getSessions: (params?: Record<string, string>) => {
    const qs = params ? "?" + new URLSearchParams(params).toString() : "";
    return request("GET", `/sessions${qs}`);
  },
  getSession: (id: string) => request("GET", `/sessions/${id}`),

  // Ratings
  getRatings: (type: string) => request("GET", `/ratings?type=${type}`),

  // Messages
  getMessages: (params: Record<string, string>) => {
    const qs = "?" + new URLSearchParams(params).toString();
    return request("GET", `/messages${qs}`);
  },
  sendMessage: (data: any) => request("POST", "/messages", data),
  deleteMessage: (id: string) => request("DELETE", `/messages/${id}`),

  // Exam resets
  resetExam: (userId: string, testId: string, resetBy: string) =>
    request("POST", "/exam-resets", { userId, testId, resetBy }),
  getExamResets: (params: Record<string, string>) => {
    const qs = "?" + new URLSearchParams(params).toString();
    return request("GET", `/exam-resets${qs}`);
  },

  // Retake requests
  requestRetake: (userId: string, testId: string, testType: string, reason?: string) =>
    request("POST", "/retake-requests", { userId, testId, testType, reason }),
  getRetakeRequests: (params?: Record<string, string>) => {
    const qs = params ? "?" + new URLSearchParams(params).toString() : "";
    return request("GET", `/retake-requests${qs}`);
  },
  reviewRetake: (id: string, status: "approved" | "rejected", reviewedBy: string) =>
    request("PUT", `/retake-requests/${id}`, { status, reviewedBy }),
};
