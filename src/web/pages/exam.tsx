import { useEffect, useState } from "react";
import { useStore } from "../store/useStore";
import { useT } from "../lib/i18n";
import { api } from "../lib/api";
import { useLocation } from "wouter";
import { GraduationCap, Lock, CheckCircle, ChevronRight } from "lucide-react";

export default function ExamPage() {
  const { user, lang, theme } = useStore();
  const tr = useT(lang);
  const [, navigate] = useLocation();
  const [exams, setExams] = useState<any[]>([]);
  const [sessions, setSessions] = useState<any[]>([]);
  const [resets, setResets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadData(); }, [user]);

  async function loadData() {
    if (!user) return;
    setLoading(true);
    const [testsRes, sessionsRes, resetsRes] = await Promise.all([
      api.getTests({ type: "exam" }),
      api.getSessions({ userId: user.id }),
      api.getExamResets({ userId: user.id }),
    ]) as any[];

    // Только одобренные админом/менеджером
    setExams((testsRes.tests || []).filter((t: any) => t.status === "approved"));
    setSessions((sessionsRes.sessions || []).filter((s: any) => s.status === "completed"));
    setResets(resetsRes.resets || []);
    setLoading(false);
  }

  function getExamStatus(examId: string, passingScore: number) {
    const completed = sessions.filter(s => s.testId === examId);
    const lastReset = resets
      .filter(r => r.testId === examId)
      .sort((a: any, b: any) => b.resetAt - a.resetAt)[0];

    if (completed.length > 0) {
      const last = completed.sort((a: any, b: any) => b.completedAt - a.completedAt)[0];
      if (lastReset && lastReset.resetAt > last.completedAt) {
        return { locked: false, session: null };
      }
      return { locked: true, session: last };
    }
    return { locked: false, session: null };
  }

  return (
    <div data-theme={theme}>
      <div className="flex items-center gap-2 mb-2">
        <GraduationCap size={22} style={{ color: "var(--primary)" }} />
        <h1 className="text-lg font-black">{tr("nav.exam")}</h1>
      </div>
      <p className="text-xs mb-5" style={{ color: "var(--muted-foreground)" }}>
        {lang === "ru"
          ? "Экзамен сдаётся один раз. Сброс — только администратором или менеджером."
          : "Имтиҳон як бор сдавать мешавад. Бозгашт — танҳо аз ҷониби маъмур."}
      </p>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-8 h-8 rounded-full border-2 animate-spin"
            style={{ borderColor: "var(--primary)", borderTopColor: "transparent" }} />
        </div>
      ) : exams.length === 0 ? (
        <div className="flex flex-col items-center py-16 gap-3">
          <div className="text-4xl">🎓</div>
          <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>
            {lang === "ru" ? "Экзаменов нет" : "Имтиҳон нест"}
          </p>
          <p className="text-xs text-center" style={{ color: "var(--muted-foreground)" }}>
            {lang === "ru" ? "Администратор добавит и одобрит тест" : "Маъмур тест илова мекунад"}
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {exams.map(exam => {
            const { locked, session } = getExamStatus(exam.id, exam.passingScore || 60);
            const passed = session && session.score >= (exam.passingScore || 60);

            return (
              <div key={exam.id} className="rounded-2xl overflow-hidden card-glow"
                style={{
                  background: "var(--card)",
                  border: `1px solid ${locked ? "var(--border)" : "var(--primary)40"}`,
                }}>
                <div className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <h3 className="text-sm font-bold mb-1">{exam.title}</h3>
                      {exam.description && (
                        <p className="text-xs line-clamp-2" style={{ color: "var(--muted-foreground)" }}>
                          {exam.description}
                        </p>
                      )}
                    </div>
                    {locked
                      ? <Lock size={18} className="flex-shrink-0 ml-2" style={{ color: "var(--muted-foreground)" }} />
                      : <div className="w-2.5 h-2.5 rounded-full mt-1 pulse-gold flex-shrink-0 ml-2"
                          style={{ background: "var(--primary)" }} />
                    }
                  </div>

                  {locked && session && (
                    <div className="rounded-xl p-3 mb-3"
                      style={{
                        background: passed ? "rgba(52,211,153,0.1)" : "rgba(239,68,68,0.1)",
                        border: `1px solid ${passed ? "#34D39930" : "#EF444430"}`,
                      }}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-semibold flex items-center gap-1"
                          style={{ color: passed ? "#34D399" : "#EF4444" }}>
                          {passed ? <><CheckCircle size={12} /> Сдан</> : "Не сдан"}
                        </span>
                        <span className="text-xl font-black"
                          style={{ color: passed ? "#34D399" : "#EF4444" }}>
                          {session.score}%
                        </span>
                      </div>
                      <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "var(--secondary)" }}>
                        <div className="h-full rounded-full"
                          style={{
                            width: `${session.score}%`,
                            background: passed ? "#34D399" : "#EF4444"
                          }} />
                      </div>
                      <p className="text-xs mt-1" style={{ color: "var(--muted-foreground)" }}>
                        {session.correctAnswers}/{session.totalQuestions} правильных
                      </p>
                    </div>
                  )}

                  <button
                    onClick={() => !locked && navigate(`/test/${exam.id}`)}
                    disabled={locked}
                    className="w-full py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all active:scale-95"
                    style={{
                      background: locked ? "var(--secondary)" : "linear-gradient(135deg, var(--primary), var(--accent))",
                      color: locked ? "var(--muted-foreground)" : "var(--primary-foreground)",
                      cursor: locked ? "not-allowed" : "pointer",
                    }}>
                    {locked
                      ? <><Lock size={14} /> Завершён</>
                      : <>{tr("tests.start")} <ChevronRight size={16} /></>
                    }
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
