import { useEffect, useState } from "react";
import { useStore } from "../store/useStore";
import { useT } from "../lib/i18n";
import { api } from "../lib/api";
import { useLocation } from "wouter";
import { ChevronLeft, BarChart2 } from "lucide-react";

interface Entry {
  userId: string;
  name: string;
  position: number;
  totalScore: number;
  avgScore: number;
  grade: string;
  perTest: Record<string, { score: number; correct: number; total: number } | null>;
}

export default function RatingResultsPage() {
  const { user, lang, theme } = useStore();
  const [, navigate] = useLocation();
  const [tab, setTab] = useState<"rating1" | "rating2">("rating1");
  const [entries, setEntries] = useState<Entry[]>([]);
  const [tests, setTests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadData(); }, [tab]);

  async function loadData() {
    setLoading(true);
    const [usersRes, testsRes, sessionsRes] = await Promise.all([
      api.getUsers(),
      api.getTests({ type: tab }),
      api.getSessions(),
    ]) as any[];

    const allUsers: any[] = usersRes.users || [];
    const ratingTests: any[] = (testsRes.tests || []).filter((t: any) => t.status === "approved");
    const allSessions: any[] = (sessionsRes.sessions || []).filter((s: any) => s.status === "completed");

    setTests(ratingTests);

    const map: Record<string, Entry> = {};
    for (const u of allUsers) {
      map[u.id] = {
        userId: u.id,
        name: `${u.lastName} ${u.firstName}`,
        position: 0,
        totalScore: 0,
        avgScore: 0,
        grade: "—",
        perTest: {},
      };
    }

    // Best session per test per user
    for (const sess of allSessions) {
      if (!ratingTests.find((t: any) => t.id === sess.testId)) continue;
      if (!map[sess.userId]) continue;
      const cur = map[sess.userId].perTest[sess.testId];
      if (!cur || sess.score > cur.score) {
        map[sess.userId].perTest[sess.testId] = {
          score: sess.score || 0,
          correct: sess.correctAnswers || 0,
          total: sess.totalQuestions || 0,
        };
      }
    }

    const result: Entry[] = Object.values(map)
      .filter(e => Object.values(e.perTest).some(r => r !== null))
      .map(e => {
        const scores = Object.values(e.perTest).filter(Boolean).map(r => r!.score);
        const total = scores.reduce((a, b) => a + b, 0);
        const avg = scores.length ? total / scores.length : 0;
        return { ...e, totalScore: Math.round(total), avgScore: Math.round(avg), grade: getGrade(avg) };
      });

    result.sort((a, b) => b.totalScore - a.totalScore);
    result.forEach((e, i) => e.position = i + 1);
    setEntries(result);
    setLoading(false);
  }

  function getGrade(s: number) {
    if (s >= 90) return "A"; if (s >= 80) return "B";
    if (s >= 70) return "C"; if (s >= 60) return "D"; return "F";
  }
  function gradeColor(g: string) {
    if (g === "A") return "#34D399"; if (g === "B") return "#60A5FA";
    if (g === "C") return "#FBBF24"; if (g === "D") return "#F97316";
    return "#EF4444";
  }

  return (
    <div data-theme={theme}>
      <div className="flex items-center gap-3 mb-5">
        <button onClick={() => navigate("/rating")}
          className="w-9 h-9 rounded-xl flex items-center justify-center"
          style={{ background: "var(--secondary)" }}>
          <ChevronLeft size={18} />
        </button>
        <BarChart2 size={20} style={{ color: "var(--primary)" }} />
        <h1 className="text-lg font-black flex-1">
          {lang === "ru" ? "Результаты рейтинга" : lang === "tj" ? "Натиҷаҳои рейтинг" : "Rating Results"}
        </h1>
      </div>

      {/* Tabs */}
      <div className="flex rounded-xl overflow-hidden mb-4" style={{ background: "var(--secondary)" }}>
        {(["rating1", "rating2"] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className="flex-1 py-2.5 text-sm font-semibold transition-all"
            style={{
              background: tab === t ? "var(--primary)" : "transparent",
              color: tab === t ? "var(--primary-foreground)" : "var(--muted-foreground)",
              borderRadius: "10px"
            }}>
            {t === "rating1" ? "Рейтинг 1" : "Рейтинг 2"}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 rounded-full border-2 animate-spin"
            style={{ borderColor: "var(--primary)", borderTopColor: "transparent" }} />
        </div>
      ) : entries.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-4xl mb-3">📊</div>
          <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>
            {lang === "ru" ? "Результатов пока нет" : "Натиҷаҳо нест"}
          </p>
        </div>
      ) : (
        <>
          {/* My position */}
          {entries.find(e => e.userId === user?.id) && (() => {
            const me = entries.find(e => e.userId === user!.id)!;
            return (
              <div className="rounded-2xl p-4 mb-4"
                style={{ background: "var(--primary)15", border: "1.5px solid var(--primary)" }}>
                <p className="text-xs mb-1" style={{ color: "var(--primary)" }}>
                  {lang === "ru" ? "Моя позиция" : "Ҷойгоҳи ман"}
                </p>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-bold">{me.name}</p>
                    <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>
                      #{me.position} место
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-3xl font-black" style={{ color: gradeColor(me.grade) }}>{me.grade}</p>
                    <p className="text-xs font-bold" style={{ color: "var(--primary)" }}>{me.totalScore} баллов</p>
                    <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>среднее {me.avgScore}%</p>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* Header */}
          <div className="flex items-center px-3 mb-2 gap-2">
            <span className="w-7 text-[10px] font-bold" style={{ color: "var(--muted-foreground)" }}>#</span>
            <span className="flex-1 text-[10px] font-bold" style={{ color: "var(--muted-foreground)" }}>Участник</span>
            <span className="w-16 text-right text-[10px] font-bold" style={{ color: "var(--muted-foreground)" }}>Баллы</span>
            <span className="w-8 text-right text-[10px] font-bold" style={{ color: "var(--muted-foreground)" }}>Ср%</span>
            <span className="w-6 text-right text-[10px] font-bold" style={{ color: "var(--muted-foreground)" }}>Gr</span>
          </div>

          <div className="flex flex-col gap-2">
            {entries.map(e => (
              <div key={e.userId} className="rounded-2xl overflow-hidden"
                style={{
                  background: e.userId === user?.id ? "var(--primary)10" : "var(--card)",
                  border: `1px solid ${e.userId === user?.id ? "var(--primary)" : "var(--border)"}`,
                }}>
                {/* Main row */}
                <div className="flex items-center px-3 py-2.5 gap-2">
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black flex-shrink-0"
                    style={{
                      background: e.position === 1 ? "#FFD700" : e.position === 2 ? "#C0C0C0" : e.position === 3 ? "#CD7F32" : "var(--secondary)",
                      color: e.position <= 3 ? "#0A0E1A" : "var(--muted-foreground)",
                    }}>
                    {e.position <= 3 ? ["🥇","🥈","🥉"][e.position - 1] : e.position}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate">{e.name}</p>
                  </div>
                  <div className="w-16 text-right">
                    <p className="text-sm font-black" style={{ color: "var(--primary)" }}>{e.totalScore}</p>
                  </div>
                  <div className="w-8 text-right">
                    <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>{e.avgScore}%</p>
                  </div>
                  <div className="w-6 text-right">
                    <span className="text-base font-black" style={{ color: gradeColor(e.grade) }}>{e.grade}</span>
                  </div>
                </div>

                {/* Per-test breakdown */}
                {tests.length > 0 && (
                  <div className="px-3 pb-2.5 flex flex-col gap-1"
                    style={{ borderTop: "1px solid var(--border)" }}>
                    {tests.map((test: any) => {
                      const r = e.perTest[test.id];
                      return (
                        <div key={test.id} className="flex items-center justify-between gap-2">
                          <span className="text-[10px] truncate flex-1" style={{ color: "var(--muted-foreground)" }}>
                            {test.title}
                          </span>
                          {r ? (
                            <div className="flex items-center gap-1.5">
                              <div className="h-1 w-12 rounded-full overflow-hidden"
                                style={{ background: "var(--secondary)" }}>
                                <div className="h-full rounded-full"
                                  style={{ width: `${r.score}%`, background: gradeColor(getGrade(r.score)) }} />
                              </div>
                              <span className="text-[10px] font-bold w-7 text-right"
                                style={{ color: gradeColor(getGrade(r.score)) }}>
                                {r.score}%
                              </span>
                            </div>
                          ) : (
                            <span className="text-[10px]" style={{ color: "var(--border)" }}>—</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
