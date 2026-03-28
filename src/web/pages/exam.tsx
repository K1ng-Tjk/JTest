import { useEffect, useState } from "react";
import { useStore } from "../store/useStore";
import { useT } from "../lib/i18n";
import { api } from "../lib/api";
import { useLocation } from "wouter";
import { GraduationCap, Lock, CheckCircle, ChevronRight } from "lucide-react";
import type { Test } from "../store/useStore";

export default function ExamPage() {
  const { user, lang, theme } = useStore();
  const tr = useT(lang);
  const [, navigate] = useLocation();
  const [exams, setExams] = useState<Test[]>([]);
  const [sessions, setSessions] = useState<any[]>([]);
  const [resets, setResets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [user]);

  async function loadData() {
    if (!user) return;
    setLoading(true);
    const [testsRes, sessionsRes, resetsRes] = await Promise.all([
      api.getTests({ type: "exam" }),
      api.getSessions({ userId: user.id }),
      api.getExamResets({ userId: user.id }),
    ]) as any[];

    setExams(testsRes.tests?.filter((t: Test) => t.status === "approved") || []);
    setSessions(sessionsRes.sessions || []);
    setResets(resetsRes.resets || []);
    setLoading(false);
  }

  function getExamStatus(exam: Test) {
    const completedSessions = sessions.filter(s => s.testId === exam.id && s.status === "completed");
    const lastReset = resets.filter(r => r.testId === exam.id).sort((a: any, b: any) => b.resetAt - a.resetAt)[0];

    if (completedSessions.length > 0) {
      const lastSession = completedSessions.sort((a: any, b: any) => b.completedAt - a.completedAt)[0];
      // Check if there's a reset after completion
      if (lastReset && lastReset.resetAt > lastSession.completedAt) {
        return { status: "available", session: null };
      }
      return { status: "completed", session: lastSession };
    }
    return { status: "available", session: null };
  }

  return (
    <div data-theme={theme}>
      <div className="flex items-center gap-2 mb-2">
        <GraduationCap size={22} style={{ color: "var(--primary)" }} />
        <h1 className="text-lg font-black">{tr("nav.exam")}</h1>
      </div>
      <p className="text-xs mb-5" style={{ color: "var(--muted-foreground)" }}>
        {lang === "ru" ? "Экзамен проходится один раз. Сброс только администратором." :
         lang === "tj" ? "Имтиҳон як бор гузаронида мешавад. Бозгашт танҳо аз ҷониби маъмур." :
         "Exam is taken once. Reset only by admin."}
      </p>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 rounded-full border-2 animate-spin"
            style={{ borderColor: "var(--primary)", borderTopColor: "transparent" }} />
        </div>
      ) : exams.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-4xl mb-3">🎓</div>
          <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>Экзаменов нет</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {exams.map(exam => {
            const { status, session } = getExamStatus(exam);
            const isLocked = status === "completed";
            return (
              <div key={exam.id} className="rounded-2xl p-4 card-glow"
                style={{ background: "var(--card)", border: `1px solid ${isLocked ? "var(--border)" : "var(--primary)"}` }}>
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="text-sm font-bold mb-1">{exam.title}</h3>
                    {exam.description && (
                      <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>{exam.description}</p>
                    )}
                  </div>
                  {isLocked ? (
                    <Lock size={18} style={{ color: "var(--muted-foreground)" }} />
                  ) : (
                    <div className="w-2.5 h-2.5 rounded-full mt-1 pulse-gold" style={{ background: "var(--primary)" }} />
                  )}
                </div>

                {isLocked && session ? (
                  <div className="rounded-xl p-3 mb-3"
                    style={{ background: session.score >= (exam.passingScore || 60) ? "rgba(52,211,153,0.1)" : "rgba(239,68,68,0.1)" }}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CheckCircle size={14} style={{ color: session.score >= (exam.passingScore || 60) ? "#34D399" : "#EF4444" }} />
                        <span className="text-xs font-medium">
                          {session.score >= (exam.passingScore || 60) ? "Сдан" : "Не сдан"}
                        </span>
                      </div>
                      <span className="text-lg font-black"
                        style={{ color: session.score >= (exam.passingScore || 60) ? "#34D399" : "#EF4444" }}>
                        {session.score}%
                      </span>
                    </div>
                    <p className="text-xs mt-1" style={{ color: "var(--muted-foreground)" }}>
                      {session.correctAnswers}/{session.totalQuestions} правильных
                    </p>
                  </div>
                ) : null}

                <button
                  onClick={() => !isLocked && navigate(`/test/${exam.id}`)}
                  disabled={isLocked}
                  className="w-full py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all"
                  style={{
                    background: isLocked ? "var(--secondary)" : "linear-gradient(135deg, var(--primary), var(--accent))",
                    color: isLocked ? "var(--muted-foreground)" : "var(--primary-foreground)",
                    cursor: isLocked ? "not-allowed" : "pointer"
                  }}>
                  {isLocked ? (
                    <><Lock size={14} /> Завершён</>
                  ) : (
                    <>{tr("tests.start")} <ChevronRight size={16} /></>
                  )}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
