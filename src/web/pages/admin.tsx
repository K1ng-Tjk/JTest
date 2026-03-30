import { useEffect, useState } from "react";
import { useStore } from "../store/useStore";
import { useT } from "../lib/i18n";
import { api } from "../lib/api";
import { useLocation } from "wouter";
import { toast } from "sonner";
import { Shield, ChevronLeft, Users, BookOpen, RotateCcw, Ban, CheckCircle, RefreshCw, Clock } from "lucide-react";

export default function AdminPage() {
  const { user, lang, theme } = useStore();
  const tr = useT(lang);
  const [, navigate] = useLocation();
  const [tab, setTab] = useState<"users" | "tests" | "retakes" | "exams">("users");
  const [users, setUsers] = useState<any[]>([]);
  const [pendingTests, setPendingTests] = useState<any[]>([]);
  const [allTests, setAllTests] = useState<any[]>([]);
  const [retakeRequests, setRetakeRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  if (user?.role !== "admin" && user?.role !== "manager") {
    return <div data-theme={theme} className="flex items-center justify-center min-h-screen">
      <p style={{ color: "var(--destructive)" }}>Нет доступа</p>
    </div>;
  }

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    setLoading(true);
    const [usersRes, testsRes, retakeRes] = await Promise.all([
      api.getUsers(),
      api.getTests(),
      api.getRetakeRequests({ status: "pending" }),
    ]) as any[];

    setUsers(usersRes.users || []);
    const tests = testsRes.tests || [];
    setAllTests(tests);
    setPendingTests(tests.filter((t: any) => t.status === "pending" && t.scope === "shared"));
    setRetakeRequests(retakeRes.requests || []);
    setLoading(false);
  }

  async function approveTest(id: string, status: "approved" | "rejected") {
    await api.updateTest(id, { status });
    toast.success(status === "approved" ? "Одобрено!" : "Отклонено");
    loadData();
  }

  async function banUser(id: string, ban: boolean) {
    const reason = ban ? (prompt("Причина блокировки:") || "") : "";
    await api.banUser(id, ban, reason);
    toast.success(ban ? "Заблокирован" : "Разблокирован");
    loadData();
  }

  async function changeRole(id: string, role: string) {
    await api.changeRole(id, role);
    toast.success("Роль изменена");
    loadData();
  }

  async function resetExamDirect(userId: string, testId: string) {
    if (!user) return;
    await api.resetExam(userId, testId, user.id);
    toast.success("Доступ к пересдаче открыт");
    loadData();
  }

  async function reviewRetake(reqId: string, status: "approved" | "rejected") {
    if (!user) return;
    await api.reviewRetake(reqId, status, user.id);
    toast.success(status === "approved" ? "Пересдача разрешена" : "Отклонено");
    loadData();
  }

  function getUserName(id: string) {
    const u = users.find(u => u.id === id);
    return u ? `${u.lastName} ${u.firstName}` : id;
  }

  function getTestName(id: string) {
    const t = allTests.find(t => t.id === id);
    return t ? t.title : id;
  }

  const examTests = allTests.filter((t: any) => (t.type === "exam" || t.type === "rating1" || t.type === "rating2") && t.status === "approved");

  const tabs = [
    { id: "users", icon: <Users size={13} />, label: "Пользов." },
    { id: "tests", icon: <BookOpen size={13} />, label: "Тесты", badge: pendingTests.length },
    { id: "retakes", icon: <RefreshCw size={13} />, label: "Пересдача", badge: retakeRequests.length },
    { id: "exams", icon: <RotateCcw size={13} />, label: "Сброс" },
  ];

  return (
    <div data-theme={theme}>
      <div className="flex items-center gap-3 mb-4">
        <button onClick={() => navigate(-1 as any)}
          className="w-9 h-9 rounded-xl flex items-center justify-center"
          style={{ background: "var(--secondary)" }}>
          <ChevronLeft size={18} />
        </button>
        <Shield size={20} style={{ color: "var(--primary)" }} />
        <h1 className="text-lg font-black">{tr("admin.title")}</h1>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-2 mb-4">
        <div className="rounded-xl p-2 text-center" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
          <p className="text-lg font-black" style={{ color: "var(--primary)" }}>{users.length}</p>
          <p className="text-[9px]" style={{ color: "var(--muted-foreground)" }}>Польз.</p>
        </div>
        <div className="rounded-xl p-2 text-center" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
          <p className="text-lg font-black" style={{ color: "#FBBF24" }}>{pendingTests.length}</p>
          <p className="text-[9px]" style={{ color: "var(--muted-foreground)" }}>Тестов</p>
        </div>
        <div className="rounded-xl p-2 text-center" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
          <p className="text-lg font-black" style={{ color: "#60A5FA" }}>{retakeRequests.length}</p>
          <p className="text-[9px]" style={{ color: "var(--muted-foreground)" }}>Запросов</p>
        </div>
        <div className="rounded-xl p-2 text-center" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
          <p className="text-lg font-black" style={{ color: "#34D399" }}>{allTests.filter(t => t.status === "approved").length}</p>
          <p className="text-[9px]" style={{ color: "var(--muted-foreground)" }}>Тестов ✓</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex rounded-xl overflow-hidden mb-4" style={{ background: "var(--secondary)" }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id as any)}
            className="flex-1 py-2 text-[10px] font-semibold flex items-center justify-center gap-1 transition-all relative"
            style={{
              background: tab === t.id ? "var(--primary)" : "transparent",
              color: tab === t.id ? "var(--primary-foreground)" : "var(--muted-foreground)",
              borderRadius: "10px"
            }}>
            {t.icon} {t.label}
            {t.badge ? (
              <span className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full text-[9px] font-black flex items-center justify-center"
                style={{ background: "#EF4444", color: "#fff" }}>{t.badge}</span>
            ) : null}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 rounded-full border-2 animate-spin"
            style={{ borderColor: "var(--primary)", borderTopColor: "transparent" }} />
        </div>
      ) : (
        <>
          {/* USERS */}
          {tab === "users" && (
            <div className="flex flex-col gap-2">
              {users.map(u => (
                <div key={u.id} className="rounded-2xl p-3 card-glow"
                  style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {u.photo ? (
                        <img src={u.photo} className="w-8 h-8 rounded-xl object-cover" />
                      ) : (
                        <div className="w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold"
                          style={{ background: "var(--primary)20", color: "var(--primary)" }}>
                          {u.firstName[0]}{u.lastName[0]}
                        </div>
                      )}
                      <div>
                        <p className="text-sm font-semibold">{u.lastName} {u.firstName}</p>
                        <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>{u.phone}</p>
                      </div>
                    </div>
                    <span className="text-xs px-2 py-0.5 rounded-full"
                      style={{
                        background: u.isBanned ? "rgba(239,68,68,0.15)" : "var(--primary)15",
                        color: u.isBanned ? "#EF4444" : "var(--primary)"
                      }}>
                      {u.isBanned ? "Блок." : u.role}
                    </span>
                  </div>
                  {u.phone !== "+992917971000" && (
                    <div className="flex gap-2">
                      <select value={u.role} onChange={e => changeRole(u.id, e.target.value)}
                        className="flex-1 text-xs rounded-lg px-2 py-1.5 border"
                        style={{ background: "var(--input)", color: "var(--foreground)", borderColor: "var(--border)" }}>
                        <option value="student">Студент</option>
                        <option value="user">Польз.</option>
                        <option value="manager">Менеджер</option>
                      </select>
                      <button onClick={() => banUser(u.id, !u.isBanned)}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1"
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

          {/* TESTS */}
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
                    {test.type} · {test.scope}
                  </p>
                  <div className="flex gap-2">
                    <button onClick={() => approveTest(test.id, "approved")}
                      className="flex-1 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1"
                      style={{ background: "rgba(52,211,153,0.15)", color: "#34D399" }}>
                      <CheckCircle size={12} /> Одобрить
                    </button>
                    <button onClick={() => approveTest(test.id, "rejected")}
                      className="flex-1 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1"
                      style={{ background: "rgba(239,68,68,0.15)", color: "#EF4444" }}>
                      <Ban size={12} /> Отклонить
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* RETAKE REQUESTS */}
          {tab === "retakes" && (
            <div className="flex flex-col gap-2">
              {retakeRequests.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-3xl mb-2">🔄</div>
                  <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>Запросов на пересдачу нет</p>
                </div>
              ) : retakeRequests.map(req => (
                <div key={req.id} className="rounded-2xl p-3 card-glow"
                  style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="text-sm font-semibold">{getUserName(req.userId)}</p>
                      <p className="text-xs" style={{ color: "var(--primary)" }}>{getTestName(req.testId)}</p>
                      <span className="text-[10px] px-2 py-0.5 rounded-full mt-1 inline-block"
                        style={{ background: "var(--secondary)", color: "var(--muted-foreground)" }}>
                        {req.testType}
                      </span>
                    </div>
                    <span className="text-[10px] flex items-center gap-1" style={{ color: "var(--muted-foreground)" }}>
                      <Clock size={10} />
                      {new Date(req.requestedAt * 1000).toLocaleDateString("ru")}
                    </span>
                  </div>
                  {req.reason && (
                    <p className="text-xs mb-2 px-2 py-1.5 rounded-lg italic"
                      style={{ background: "var(--secondary)", color: "var(--muted-foreground)" }}>
                      "{req.reason}"
                    </p>
                  )}
                  <div className="flex gap-2">
                    <button onClick={() => reviewRetake(req.id, "approved")}
                      className="flex-1 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1"
                      style={{ background: "rgba(52,211,153,0.15)", color: "#34D399" }}>
                      <CheckCircle size={12} /> Разрешить
                    </button>
                    <button onClick={() => reviewRetake(req.id, "rejected")}
                      className="flex-1 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1"
                      style={{ background: "rgba(239,68,68,0.15)", color: "#EF4444" }}>
                      <Ban size={12} /> Отклонить
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* DIRECT RESET */}
          {tab === "exams" && (
            <div className="flex flex-col gap-3">
              <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>
                Прямой сброс — открывает пересдачу без запроса от пользователя
              </p>
              {examTests.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>Нет тестов</p>
                </div>
              ) : examTests.map(exam => (
                <div key={exam.id} className="rounded-2xl p-3 card-glow"
                  style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
                  <p className="text-sm font-semibold mb-1">{exam.title}</p>
                  <span className="text-[10px] px-2 py-0.5 rounded-full mb-3 inline-block"
                    style={{ background: "var(--secondary)", color: "var(--muted-foreground)" }}>
                    {exam.type}
                  </span>
                  <div className="flex flex-col gap-1.5">
                    {users.filter(u => u.phone !== "+992917971000").map(u => (
                      <div key={u.id} className="flex items-center justify-between px-3 py-2 rounded-xl"
                        style={{ background: "var(--secondary)" }}>
                        <div className="flex items-center gap-2">
                          {u.photo
                            ? <img src={u.photo} className="w-6 h-6 rounded-lg object-cover" />
                            : <div className="w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-bold"
                                style={{ background: "var(--primary)20", color: "var(--primary)" }}>
                                {u.firstName[0]}
                              </div>
                          }
                          <span className="text-xs">{u.lastName} {u.firstName}</span>
                        </div>
                        <button onClick={() => resetExamDirect(u.id, exam.id)}
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
