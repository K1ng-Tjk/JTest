import { useEffect, useState } from "react";
import { useStore } from "../store/useStore";
import { useT } from "../lib/i18n";
import { api } from "../lib/api";
import { Trophy } from "lucide-react";

interface UserStat {
  userId: string;
  name: string;
  photo?: string;
  // per test results
  results: Record<string, { score: number; correct: number; total: number; completedAt: number }>;
  totalScore: number; // sum of all scores
  avgScore: number;
  grade: string;
  position: number;
}

export default function RatingPage() {
  const { user, lang, theme } = useStore();
  const tr = useT(lang);
  const [tab, setTab] = useState<"rating1" | "rating2">("rating1");
  const [entries, setEntries] = useState<UserStat[]>([]);
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
    const ratingTests: any[] = (testsRes.tests || []).filter(
      (t: any) => t.type === tab && t.status === "approved"
    );
    const allSessions: any[] = (sessionsRes.sessions || []).filter(
      (s: any) => s.status === "completed"
    );

    setTests(ratingTests);

    // Build per-user stats
    const userMap: Record<string, UserStat> = {};

    for (const u of allUsers) {
      userMap[u.id] = {
        userId: u.id,
        name: `${u.lastName} ${u.firstName}`,
        results: {},
        totalScore: 0,
        avgScore: 0,
        grade: "—",
        position: 0,
      };
    }

    for (const sess of allSessions) {
      const testIds = ratingTests.map((t: any) => t.id);
      if (!testIds.includes(sess.testId)) continue;
      if (!userMap[sess.userId]) continue;

      const existing = userMap[sess.userId].results[sess.testId];
      // Keep best attempt per test
      if (!existing || sess.score > existing.score) {
        userMap[sess.userId].results[sess.testId] = {
          score: sess.score || 0,
          correct: sess.correctAnswers || 0,
          total: sess.totalQuestions || 0,
          completedAt: sess.completedAt || 0,
        };
      }
    }

    // Calculate totals — only users who did at least one test
    const result: UserStat[] = Object.values(userMap)
      .filter(u => Object.keys(u.results).length > 0)
      .map(u => {
        const scores = Object.values(u.results).map(r => r.score);
        const totalScore = scores.reduce((a, b) => a + b, 0);
        const avg = scores.length ? totalScore / scores.length : 0;
        return {
          ...u,
          totalScore: Math.round(totalScore),
          avgScore: Math.round(avg),
          grade: getGrade(avg),
        };
      });

    // Sort by totalScore descending
    result.sort((a, b) => b.totalScore - a.totalScore);
    result.forEach((e, i) => e.position = i + 1);

    setEntries(result);
    setLoading(false);
  }

  function getGrade(avg: number) {
    if (avg >= 90) return "A";
    if (avg >= 80) return "B";
    if (avg >= 70) return "C";
    if (avg >= 60) return "D";
    return "F";
  }

  const myEntry = entries.find(e => e.userId === user?.id);

  return (
    <div data-theme={theme}>
      {/* Header */}
      <div className="flex items-center gap-2 mb-5">
        <Trophy size={22} style={{ color: "var(--primary)" }} />
        <h1 className="text-lg font-black">{tr("rating.title")}</h1>
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
            {t === "rating1"
              ? (lang === "ru" ? "Рейтинг 1" : lang === "tj" ? "Рейтинги 1" : "Rating 1")
              : (lang === "ru" ? "Рейтинг 2" : lang === "tj" ? "Рейтинги 2" : "Rating 2")}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-8 h-8 rounded-full border-2 animate-spin"
            style={{ borderColor: "var(--primary)", borderTopColor: "transparent" }} />
        </div>
      ) : (
        <>
          {/* My position card */}
          {myEntry && (
            <div className="rounded-2xl p-4 mb-4"
              style={{ background: "var(--primary)15", border: "1.5px solid var(--primary)" }}>
              <div className="flex items-center justify-between mb-2">
                <div>
                  <p className="text-xs mb-0.5" style={{ color: "var(--primary)" }}>
                    {lang === "ru" ? "Моя позиция" : lang === "tj" ? "Ҷойгоҳи ман" : "My position"}
                  </p>
                  <p className="text-sm font-bold">{myEntry.name}</p>
                  <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>
                    #{myEntry.position} {lang === "ru" ? "место" : lang === "tj" ? "ҷой" : "place"}
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-black" style={{ color: getGradeColor(myEntry.grade) }}>
                    {myEntry.grade}
                  </div>
                  <div className="text-xs font-bold" style={{ color: "var(--primary)" }}>
                    {myEntry.totalScore} {lang === "ru" ? "баллов" : "хол"}
                  </div>
                  <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>
                    {lang === "ru" ? "среднее" : "миёна"}: {myEntry.avgScore}%
                  </div>
                </div>
              </div>

              {/* Per-test results */}
              {tests.length > 0 && Object.keys(myEntry.results).length > 0 && (
                <div className="flex flex-col gap-1 mt-2 pt-2"
                  style={{ borderTop: "1px solid var(--primary)30" }}>
                  {tests.map((test: any) => {
                    const r = myEntry.results[test.id];
                    if (!r) return (
                      <div key={test.id} className="flex items-center justify-between text-xs">
                        <span className="truncate max-w-[60%]" style={{ color: "var(--muted-foreground)" }}>{test.title}</span>
                        <span style={{ color: "var(--muted-foreground)" }}>—</span>
                      </div>
                    );
                    return (
                      <div key={test.id} className="flex items-center justify-between text-xs">
                        <span className="truncate max-w-[60%]">{test.title}</span>
                        <span className="font-bold" style={{ color: getGradeColor(getGrade(r.score)) }}>
                          {r.score}% ({r.correct}/{r.total})
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Leaderboard */}
          {entries.length === 0 ? (
            <div className="text-center py-16">
              <div className="text-4xl mb-3">🏆</div>
              <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>
                {lang === "ru" ? "Рейтинг пустой — пройди тест рейтинга!" :
                 lang === "tj" ? "Рейтинг холӣ — тести рейтинг гузаред!" :
                 "No ratings yet — take a rating test!"}
              </p>
            </div>
          ) : (
            <>
              {/* Column headers */}
              <div className="flex items-center px-4 mb-2">
                <span className="w-8 text-xs font-bold" style={{ color: "var(--muted-foreground)" }}>#</span>
                <span className="flex-1 text-xs font-bold" style={{ color: "var(--muted-foreground)" }}>
                  {lang === "ru" ? "Участник" : "Иштирокчи"}
                </span>
                <span className="w-14 text-right text-xs font-bold" style={{ color: "var(--muted-foreground)" }}>
                  {lang === "ru" ? "Баллы" : "Холҳо"}
                </span>
                <span className="w-8 text-right text-xs font-bold" style={{ color: "var(--muted-foreground)" }}>%</span>
                <span className="w-7 text-right text-xs font-bold" style={{ color: "var(--muted-foreground)" }}>Gr</span>
              </div>

              <div className="flex flex-col gap-2">
                {entries.map((e) => (
                  <div key={e.userId}
                    className="rounded-2xl overflow-hidden"
                    style={{
                      background: e.userId === user?.id ? "var(--primary)12" : "var(--card)",
                      border: `1px solid ${e.userId === user?.id ? "var(--primary)" : "var(--border)"}`,
                    }}>
                    {/* Main row */}
                    <div className="flex items-center px-3 py-3 gap-2">
                      {/* Position */}
                      <div className="w-7 h-7 rounded-xl flex items-center justify-center font-black text-xs flex-shrink-0"
                        style={{
                          background: e.position === 1 ? "#FFD700" :
                                      e.position === 2 ? "#C0C0C0" :
                                      e.position === 3 ? "#CD7F32" : "var(--secondary)",
                          color: e.position <= 3 ? "#0A0E1A" : "var(--muted-foreground)",
                        }}>
                        {e.position <= 3 ? ["🥇","🥈","🥉"][e.position - 1] : e.position}
                      </div>

                      {/* Name */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold truncate">{e.name}</p>
                        <p className="text-[10px]" style={{ color: "var(--muted-foreground)" }}>
                          {Object.keys(e.results).length}/{tests.length} тестов
                        </p>
                      </div>

                      {/* Total score */}
                      <div className="w-14 text-right">
                        <p className="text-sm font-black" style={{ color: "var(--primary)" }}>
                          {e.totalScore}
                        </p>
                        <p className="text-[10px]" style={{ color: "var(--muted-foreground)" }}>баллов</p>
                      </div>

                      {/* Avg % */}
                      <div className="w-10 text-right">
                        <p className="text-xs font-bold" style={{ color: "var(--muted-foreground)" }}>
                          {e.avgScore}%
                        </p>
                      </div>

                      {/* Grade */}
                      <div className="w-8 text-right">
                        <span className="text-base font-black" style={{ color: getGradeColor(e.grade) }}>
                          {e.grade}
                        </span>
                      </div>
                    </div>

                    {/* Per-test breakdown */}
                    {tests.length > 0 && (
                      <div className="px-3 pb-2 flex flex-col gap-1"
                        style={{ borderTop: "1px solid var(--border)" }}>
                        {tests.map((test: any) => {
                          const r = e.results[test.id];
                          return (
                            <div key={test.id} className="flex items-center justify-between py-0.5">
                              <span className="text-[10px] truncate max-w-[65%]"
                                style={{ color: "var(--muted-foreground)" }}>{test.title}</span>
                              {r ? (
                                <div className="flex items-center gap-2">
                                  <div className="h-1 w-16 rounded-full overflow-hidden"
                                    style={{ background: "var(--secondary)" }}>
                                    <div className="h-full rounded-full"
                                      style={{
                                        width: `${r.score}%`,
                                        background: getGradeColor(getGrade(r.score))
                                      }} />
                                  </div>
                                  <span className="text-[10px] font-bold w-8 text-right"
                                    style={{ color: getGradeColor(getGrade(r.score)) }}>
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
        </>
      )}
    </div>
  );
}

function getGradeColor(grade: string) {
  if (grade === "A") return "#34D399";
  if (grade === "B") return "#60A5FA";
  if (grade === "C") return "#FBBF24";
  if (grade === "D") return "#F97316";
  return "#EF4444";
}
