import { useEffect, useState } from "react";
import { useStore } from "../store/useStore";
import { useT } from "../lib/i18n";
import { api } from "../lib/api";
import { useLocation } from "wouter";
import { toast } from "sonner";
import { Shield, ChevronLeft, Users, BookOpen, RotateCcw, Ban, CheckCircle } from "lucide-react";

export default function AdminPage() {
  const { user, lang, theme } = useStore();
  const tr = useT(lang);
  const [, navigate] = useLocation();
  const [tab, setTab] = useState<"users" | "tests" | "exams">("users");
  const [users, setUsers] = useState<any[]>([]);
  const [pendingTests, setPendingTests] = useState<any[]>([]);
  const [allTests, setAllTests] = useState<any[]>([]);
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  if (user?.role !== "admin" && user?.role !== "manager") {
    return (
      <div data-theme={theme} className="flex items-center justify-center min-h-screen">
        <p style={{ color: "var(--destructive)" }}>Нет доступа</p>
      </div>
    );
  }

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    setLoading(true);
    const [usersRes, testsRes, sessionsRes] = await Promise.all([
      api.getUsers(),
      api.getTests(),
      api.getSessions(),
    ]) as any[];

    const allUsers = usersRes.users || [];
    setUsers(allUsers);

    const tests = testsRes.tests || [];
    setAllTests(tests);
    setPendingTests(tests.filter((t: any) => t.status === "pending" && t.scope === "shared"));
    setSessions(sessionsRes.sessions || []);
    setLoading(false);
  }

  async function approveTest(id: string, status: "approved" | "rejected") {
    await api.updateTest(id, { status });
    toast.success(status === "approved" ? "Одобрено!" : "Отклонено");
    loadData();
  }

  async function banUser(id: string, ban: boolean) {
    const reason = ban ? prompt("Причина блокировки:") || "" : "";
    await api.banUser(id, ban, reason);
    toast.success(ban ? "Заблокирован" : "Разблокирован");
    loadData();
  }

  async function changeRole(id: string, role: string) {
    await api.changeRole(id, role);
    toast.success("Роль изменена");
    loadData();
  }

  async function resetExam(userId: string, testId: string) {
    if (!user) return;
    await api.resetExam(userId, testId, user.id);
    toast.success("Экзамен сброшен");
  }

  const examTests = allTests.filter((t: any) => t.type === "exam" && t.status === "approved");

  return (
    <div data-theme={theme}>
      <div className="flex items-center gap-3 mb-5">
        <button onClick={() => navigate(-1 as any)}
          className="w-9 h-9 rounded-xl flex items-center justify-center"
          style={{ background: "var(--secondary)" }}>
          <ChevronLeft size={18} />
        </button>
        <Shield size={20} style={{ color: "var(--primary)" }} />
        <h1 className="text-lg font-black">{tr("admin.title")}</h1>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        <StatCard label="Пользователей" value={users.length} color="var(--primary)" />
        <StatCard label="На проверке" value={pendingTests.length} color="#FBBF24" />
        <StatCard label="Сессий" value={sessions.length} color="#60A5FA" />
      </div>

      {/* Tabs */}
      <div className="flex rounded-xl overflow-hidden mb-4" style={{ background: "var(--secondary)" }}>
        {[
          { id: "users", icon: <Users size={13} />, label: tr("admin.users") },
          { id: "tests", icon: <BookOpen size={13} />, label: tr("admin.pendingTests") },
          { id: "exams", icon: <RotateCcw size={13} />, label: "Экзамены" },
        ].map(t => (
          <button key={t.id} onClick={() => setTab(t.id as any)}
            className="flex-1 py-2 text-xs font-semibold flex items-center justify-center gap-1 transition-all"
            style={{
              background: tab === t.id ? "var(--primary)" : "transparent",
              color: tab === t.id ? "var(--primary-foreground)" : "var(--muted-foreground)",
              borderRadius: "10px"
            }}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 rounded-full border-2 animate-spin"
            style={{ borderColor: "var(--primary)", borderTopColor: "transparent" }} />
        </div>
      ) : (
        <>
          {/* Users tab */}
          {tab === "users" && (
            <div className="flex flex-col gap-2">
              {users.map(u => (
                <div key={u.id} className="rounded-2xl p-3 card-glow"
                  style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <p className="text-sm font-semibold">{u.lastName} {u.firstName}</p>
                      <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>{u.phone}</p>
                    </div>
                    <span className="text-xs px-2 py-0.5 rounded-full"
                      style={{
                        background: u.isBanned ? "rgba(239,68,68,0.15)" : "var(--primary)15",
                        color: u.isBanned ? "#EF4444" : "var(--primary)"
                      }}>
                      {u.isBanned ? "Заблокирован" : u.role}
                    </span>
                  </div>
                  {u.phone !== "+992917971000" && (
                    <div className="flex gap-2">
                      <select value={u.role} onChange={e => changeRole(u.id, e.target.value)}
                        className="flex-1 text-xs rounded-lg px-2 py-1.5 border"
                        style={{ background: "var(--input)", color: "var(--foreground)", borderColor: "var(--border)" }}>
                        <option value="student">Студент</option>
                        <option value="user">Пользователь</option>
                        <option value="manager">Менеджер</option>
                      </select>
                      <button onClick={() => banUser(u.id, !u.isBanned)}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all"
                        style={{
                          background: u.isBanned ? "rgba(52,211,153,0.15)" : "rgba(239,68,68,0.15)",
                          color: u.isBanned ? "#34D399" : "#EF4444"
                        }}>
                        {u.isBanned ? <><CheckCircle size={11} /> Разбл.</> : <><Ban size={11} /> Забл.</>}
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Tests tab */}
          {tab === "tests" && (
            <div className="flex flex-col gap-2">
              {pendingTests.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-3xl mb-2">✅</div>
                  <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>Нет тестов на проверке</p>
                </div>
              ) : pendingTests.map(test => (
                <div key={test.id} className="rounded-2xl p-3 card-glow"
                  style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
                  <p className="text-sm font-semibold mb-1">{test.title}</p>
                  <p className="text-xs mb-3" style={{ color: "var(--muted-foreground)" }}>
                    Тип: {test.type} | Доступ: {test.scope}
                  </p>
                  <div className="flex gap-2">
                    <button onClick={() => approveTest(test.id, "approved")}
                      className="flex-1 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1"
                      style={{ background: "rgba(52,211,153,0.15)", color: "#34D399" }}>
                      <CheckCircle size={12} /> {tr("admin.approve")}
                    </button>
                    <button onClick={() => approveTest(test.id, "rejected")}
                      className="flex-1 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1"
                      style={{ background: "rgba(239,68,68,0.15)", color: "#EF4444" }}>
                      <Ban size={12} /> {tr("admin.reject")}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Exams tab */}
          {tab === "exams" && (
            <div className="flex flex-col gap-2">
              {examTests.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-3xl mb-2">🎓</div>
                  <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>Нет экзаменов</p>
                </div>
              ) : examTests.map(exam => (
                <div key={exam.id} className="rounded-2xl p-3 card-glow"
                  style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
                  <p className="text-sm font-semibold mb-2">{exam.title}</p>
                  <p className="text-xs mb-2" style={{ color: "var(--muted-foreground)" }}>Сбросить для пользователя:</p>
                  <div className="flex flex-col gap-1.5">
                    {users.filter(u => u.phone !== "+992917971000").map(u => (
                      <div key={u.id} className="flex items-center justify-between px-3 py-2 rounded-xl"
                        style={{ background: "var(--secondary)" }}>
                        <span className="text-xs">{u.lastName} {u.firstName}</span>
                        <button onClick={() => resetExam(u.id, exam.id)}
                          className="px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1"
                          style={{ background: "var(--primary)20", color: "var(--primary)" }}>
                          <RotateCcw size={11} /> Сброс
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function StatCard({ label, value, color }: any) {
  return (
    <div className="rounded-xl p-3 text-center" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
      <p className="text-xl font-black" style={{ color }}>{value}</p>
      <p className="text-[9px]" style={{ color: "var(--muted-foreground)" }}>{label}</p>
    </div>
  );
}
