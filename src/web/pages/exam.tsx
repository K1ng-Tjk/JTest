import { useEffect, useState } from "react";
import { useStore } from "../store/useStore";
import { useT } from "../lib/i18n";
import { api } from "../lib/api";
import { useLocation } from "wouter";
import { GraduationCap, Lock, CheckCircle, ChevronRight, RefreshCw, Send } from "lucide-react";
import { toast } from "sonner";

export default function ExamPage() {
  const { user, lang, theme } = useStore();
  const tr = useT(lang);
  const [, navigate] = useLocation();
  const [exams, setExams] = useState<any[]>([]);
  const [sessions, setSessions] = useState<any[]>([]);
  const [resets, setResets] = useState<any[]>([]);
  const [myRequests, setMyRequests] = useState<any[]>([]);
  const [requesting, setRequesting] = useState<string | null>(null);
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadData(); }, [user]);

  // Auto-reload every 30s to pick up admin-approved retakes
  useEffect(() => {
    const interval = setInterval(() => { if (user) loadData(); }, 30000);
    return () => clearInterval(interval);
  }, [user]);

  async function loadData() {
    if (!user) return;
    setLoading(true);
    const [testsRes, sessionsRes, resetsRes, reqRes] = await Promise.all([
      api.getTests({ type: "exam" }),
      api.getSessions({ userId: user.id }),
      api.getExamResets({ userId: user.id }),
      api.getRetakeRequests({ userId: user.id }),
    ]) as any[];

    setExams((testsRes.tests || []).filter((t: any) => t.status === "approved"));
    setSessions((sessionsRes.sessions || []).filter((s: any) => s.status === "completed"));
    setResets(resetsRes.resets || []);
    setMyRequests(reqRes.requests || []);
    setLoading(false);
  }

  function getStatus(examId: string, passingScore: number) {
    const completed = sessions.filter(s => s.testId === examId);
    const lastReset = resets.filter(r => r.testId === examId).sort((a: any, b: any) => b.resetAt - a.resetAt)[0];
    if (completed.length > 0) {
      const last = completed.sort((a: any, b: any) => b.completedAt - a.completedAt)[0];
      if (lastReset && lastReset.resetAt > last.completedAt) return { locked: false, session: null };
      return { locked: true, session: last };
    }
    return { locked: false, session: null };
  }

  function getRequestStatus(testId: string) {
    const req = myRequests.filter(r => r.testId === testId).sort((a: any, b: any) => b.requestedAt - a.requestedAt)[0];
    return req?.status || null;
  }

  async function sendRequest(testId: string) {
    if (!user) return;
    const res: any = await api.requestRetake(user.id, testId, "exam", reason.trim() || undefined);
    if (res.error) { toast.error(res.error); return; }
    toast.success(lang === "ru" ? "Запрос отправлен администратору" : "Дархост ирсол шуд");
    setRequesting(null);
    setReason("");
    loadData();
  }

  return (
    <div data-theme={theme}>
      <div className="flex items-center gap-2 mb-2">
        <GraduationCap size={22} style={{ color: "var(--primary)" }} />
        <h1 className="text-lg font-black">{tr("nav.exam")}</h1>
      </div>
      <p className="text-xs mb-5" style={{ color: "var(--muted-foreground)" }}>
        {lang === "ru" ? "Один раз. Пересдача — только с разрешения администратора." : "Як бор. Такрор — бо иҷозати маъмур."}
      </p>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 rounded-full border-2 animate-spin" style={{ borderColor: "var(--primary)", borderTopColor: "transparent" }} />
        </div>
      ) : exams.length === 0 ? (
        <div className="flex flex-col items-center py-16 gap-3">
          <div className="text-4xl">🎓</div>
          <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>Экзаменов нет</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {exams.map(exam => {
            const { locked, session } = getStatus(exam.id, exam.passingScore || 60);
            const passed = session && session.score >= (exam.passingScore || 60);
            const reqStatus = getRequestStatus(exam.id);
            const isRequesting = requesting === exam.id;

            return (
              <div key={exam.id} className="rounded-2xl overflow-hidden card-glow"
                style={{ background: "var(--card)", border: `1px solid ${locked ? "var(--border)" : "var(--primary)40"}` }}>
                <div className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <h3 className="text-sm font-bold mb-1">{exam.title}</h3>
                      {exam.description && <p className="text-xs line-clamp-2" style={{ color: "var(--muted-foreground)" }}>{exam.description}</p>}
                    </div>
                    {locked ? <Lock size={18} className="flex-shrink-0 ml-2" style={{ color: "var(--muted-foreground)" }} />
                      : <div className="w-2.5 h-2.5 rounded-full mt-1 pulse-gold flex-shrink-0 ml-2" style={{ background: "var(--primary)" }} />}
                  </div>

                  {locked && session && (
                    <div className="rounded-xl p-3 mb-3"
                      style={{ background: passed ? "rgba(52,211,153,0.1)" : "rgba(239,68,68,0.1)", border: `1px solid ${passed ? "#34D39930" : "#EF444430"}` }}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-semibold" style={{ color: passed ? "#34D399" : "#EF4444" }}>
                          {passed ? "✓ Сдан" : "✗ Не сдан"}
                        </span>
                        <span className="text-xl font-black" style={{ color: passed ? "#34D399" : "#EF4444" }}>{session.score}%</span>
                      </div>
                      <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "var(--secondary)" }}>
                        <div className="h-full rounded-full" style={{ width: `${session.score}%`, background: passed ? "#34D399" : "#EF4444" }} />
                      </div>
                      <p className="text-xs mt-1" style={{ color: "var(--muted-foreground)" }}>{session.correctAnswers}/{session.totalQuestions} правильных</p>
                    </div>
                  )}

                  {/* Запрос пересдачи */}
                  {locked && (
                    <div className="mb-3">
                      {reqStatus === "pending" ? (
                        <div className="rounded-xl px-3 py-2 text-xs font-medium flex items-center gap-2"
                          style={{ background: "rgba(251,191,36,0.1)", color: "#FBBF24" }}>
                          <RefreshCw size={12} />
                          {lang === "ru" ? "Запрос на пересдачу отправлен, ожидайте..." : "Дархост ирсол шуд, интизор шавед..."}
                        </div>
                      ) : reqStatus === "rejected" ? (
                        <div className="rounded-xl px-3 py-2 text-xs font-medium flex items-center gap-2 mb-2"
                          style={{ background: "rgba(239,68,68,0.1)", color: "#EF4444" }}>
                          {lang === "ru" ? "Запрос отклонён" : "Дархост рад шуд"}
                        </div>
                      ) : null}

                      {reqStatus !== "pending" && (
                        isRequesting ? (
                          <div className="flex flex-col gap-2">
                            <textarea value={reason} onChange={e => setReason(e.target.value)}
                              placeholder={lang === "ru" ? "Причина (по желанию)..." : "Сабаб (ихтиёрӣ)..."}
                              rows={2} className="w-full rounded-xl px-3 py-2 text-xs border outline-none resize-none"
                              style={{ background: "var(--input)", color: "var(--foreground)", borderColor: "var(--border)" }} />
                            <div className="flex gap-2">
                              <button onClick={() => { setRequesting(null); setReason(""); }}
                                className="flex-1 py-2 rounded-xl text-xs font-semibold"
                                style={{ background: "var(--secondary)", color: "var(--muted-foreground)" }}>
                                Отмена
                              </button>
                              <button onClick={() => sendRequest(exam.id)}
                                className="flex-1 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1"
                                style={{ background: "var(--primary)20", color: "var(--primary)" }}>
                                <Send size={12} /> Отправить
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button onClick={() => setRequesting(exam.id)}
                            className="w-full py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all active:scale-95"
                            style={{ background: "var(--secondary)", color: "var(--primary)" }}>
                            <RefreshCw size={12} />
                            {lang === "ru" ? "Запросить пересдачу" : "Дархости такрор"}
                          </button>
                        )
                      )}
                    </div>
                  )}

                  <button onClick={() => !locked && navigate(`/test/${exam.id}`)} disabled={locked}
                    className="w-full py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all active:scale-95"
                    style={{
                      background: locked ? "var(--secondary)" : "linear-gradient(135deg, var(--primary), var(--accent))",
                      color: locked ? "var(--muted-foreground)" : "var(--primary-foreground)",
                      cursor: locked ? "not-allowed" : "pointer",
                    }}>
                    {locked ? <><Lock size={14} /> Завершён</> : <>{tr("tests.start")} <ChevronRight size={16} /></>}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
