import { useEffect, useState } from "react";
import { useStore } from "../store/useStore";
import { useT } from "../lib/i18n";
import { api } from "../lib/api";
import { useLocation } from "wouter";
import { Trophy, ChevronRight, Clock, CheckCircle, BarChart2 } from "lucide-react";

export default function RatingPage() {
  const { user, lang, theme } = useStore();
  const tr = useT(lang);
  const [, navigate] = useLocation();
  const [tab, setTab] = useState<"rating1" | "rating2">("rating1");
  const [tests, setTests] = useState<any[]>([]);
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadData(); }, [tab]);

  async function loadData() {
    if (!user) return;
    setLoading(true);
    const [testsRes, sessionsRes] = await Promise.all([
      api.getTests({ type: tab }),
      api.getSessions({ userId: user.id }),
    ]) as any[];

    setTests((testsRes.tests || []).filter((t: any) => t.status === "approved"));
    setSessions((sessionsRes.sessions || []).filter((s: any) => s.status === "completed"));
    setLoading(false);
  }

  // Лучший результат по тесту
  function getBestSession(testId: string) {
    const testSessions = sessions.filter(s => s.testId === testId);
    if (!testSessions.length) return null;
    return testSessions.reduce((best, s) => (s.score > best.score ? s : best));
  }

  function getGrade(score: number) {
    if (score >= 90) return "A";
    if (score >= 80) return "B";
    if (score >= 70) return "C";
    if (score >= 60) return "D";
    return "F";
  }

  function getGradeColor(grade: string) {
    if (grade === "A") return "#34D399";
    if (grade === "B") return "#60A5FA";
    if (grade === "C") return "#FBBF24";
    if (grade === "D") return "#F97316";
    return "#EF4444";
  }

  return (
    <div data-theme={theme}>
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <Trophy size={22} style={{ color: "var(--primary)" }} />
          <h1 className="text-lg font-black">{tr("rating.title")}</h1>
        </div>
        {/* Результаты — отдельная кнопка */}
        <button onClick={() => navigate("/rating-results")}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all active:scale-95"
          style={{ background: "var(--secondary)", color: "var(--primary)" }}>
          <BarChart2 size={14} />
          {lang === "ru" ? "Результаты" : lang === "tj" ? "Натиҷаҳо" : "Results"}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex rounded-xl overflow-hidden mb-5" style={{ background: "var(--secondary)" }}>
        {(["rating1", "rating2"] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className="flex-1 py-2.5 text-sm font-semibold transition-all"
            style={{
              background: tab === t ? "var(--primary)" : "transparent",
              color: tab === t ? "var(--primary-foreground)" : "var(--muted-foreground)",
              borderRadius: "10px"
            }}>
            {t === "rating1"
              ? (lang === "ru" ? "Рейтинг 1" : "Рейтинги 1")
              : (lang === "ru" ? "Рейтинг 2" : "Рейтинги 2")}
          </button>
        ))}
      </div>

      <p className="text-xs mb-4" style={{ color: "var(--muted-foreground)" }}>
        {lang === "ru"
          ? "Тесты рейтинга. Можно сдавать несколько раз — учитывается лучший результат."
          : "Тестҳои рейтинг. Якчанд маротиба сдавать мешавад — беҳтарин натиҷа ба ҳисоб меравад."}
      </p>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-8 h-8 rounded-full border-2 animate-spin"
            style={{ borderColor: "var(--primary)", borderTopColor: "transparent" }} />
        </div>
      ) : tests.length === 0 ? (
        <div className="flex flex-col items-center py-16 gap-3">
          <div className="text-4xl">🏆</div>
          <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>
            {lang === "ru" ? "Тестов рейтинга нет" : "Тестҳо нест"}
          </p>
          <p className="text-xs text-center" style={{ color: "var(--muted-foreground)" }}>
            {lang === "ru" ? "Администратор добавит тесты" : "Маъмур тестҳо илова мекунад"}
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {tests.map(test => {
            const best = getBestSession(test.id);
            const passed = best && best.score >= (test.passingScore || 60);

            return (
              <div key={test.id} className="rounded-2xl overflow-hidden card-glow"
                style={{
                  background: "var(--card)",
                  border: `1px solid ${best ? (passed ? "#34D39440" : "#EF444440") : "var(--border)"}`,
                }}>
                {/* Test info */}
                <div className="p-4">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex-1">
                      <h3 className="text-sm font-bold mb-1">{test.title}</h3>
                      {test.description && (
                        <p className="text-xs line-clamp-2" style={{ color: "var(--muted-foreground)" }}>
                          {test.description}
                        </p>
                      )}
                    </div>
                    {/* Лучший результат */}
                    {best && (
                      <div className="text-right flex-shrink-0">
                        <div className="text-2xl font-black" style={{ color: getGradeColor(getGrade(best.score)) }}>
                          {getGrade(best.score)}
                        </div>
                        <div className="text-xs font-bold" style={{ color: getGradeColor(getGrade(best.score)) }}>
                          {best.score}%
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Meta */}
                  <div className="flex items-center gap-3 mb-3">
                    {test.timeLimit && (
                      <span className="text-xs flex items-center gap-1" style={{ color: "var(--muted-foreground)" }}>
                        <Clock size={11} /> {test.timeLimit} {lang === "ru" ? "мин" : "дақ"}
                      </span>
                    )}
                    <span className="text-xs flex items-center gap-1" style={{ color: "var(--muted-foreground)" }}>
                      <CheckCircle size={11} /> {lang === "ru" ? "Проходной" : "Гузаштан"}: {test.passingScore || 60}%
                    </span>
                    {best && (
                      <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>
                        {best.correctAnswers}/{best.totalQuestions} ✓
                      </span>
                    )}
                  </div>

                  {/* Progress bar (если уже сдавал) */}
                  {best && (
                    <div className="mb-3">
                      <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "var(--secondary)" }}>
                        <div className="h-full rounded-full transition-all"
                          style={{
                            width: `${best.score}%`,
                            background: passed
                              ? "linear-gradient(to right, #34D399, #10B981)"
                              : "linear-gradient(to right, #EF4444, #F97316)"
                          }} />
                      </div>
                      <div className="flex justify-between mt-1">
                        <span className="text-[10px]" style={{ color: "var(--muted-foreground)" }}>
                          {lang === "ru" ? "Лучший результат" : "Беҳтарин натиҷа"}
                        </span>
                        <span className="text-[10px] font-semibold"
                          style={{ color: passed ? "#34D399" : "#EF4444" }}>
                          {passed
                            ? (lang === "ru" ? "Зачёт ✓" : "Зачёт ✓")
                            : (lang === "ru" ? "Не зачёт" : "Нагузашт")}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Start button */}
                  <button onClick={() => navigate(`/test/${test.id}`)}
                    className="w-full py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all active:scale-95"
                    style={{
                      background: best
                        ? "var(--secondary)"
                        : "linear-gradient(135deg, var(--primary), var(--accent))",
                      color: best ? "var(--foreground)" : "var(--primary-foreground)",
                    }}>
                    {best
                      ? (lang === "ru" ? "Пересдать" : "Аз нав")
                      : (lang === "ru" ? "Начать" : "Оғоз кардан")}
                    <ChevronRight size={16} />
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
