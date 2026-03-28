import { useEffect, useState } from "react";
import { useStore } from "../store/useStore";
import { useT } from "../lib/i18n";
import { api } from "../lib/api";
import { Trophy, Medal } from "lucide-react";

interface RatingEntry { userId: string; name: string; score: number; grade: string; position: number; }

export default function RatingPage() {
  const { user, lang, theme } = useStore();
  const tr = useT(lang);
  const [tab, setTab] = useState<"rating1" | "rating2">("rating1");
  const [ratings, setRatings] = useState<RatingEntry[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [tab]);

  async function loadData() {
    setLoading(true);
    const [usersRes, sessionsRes] = await Promise.all([
      api.getUsers(),
      api.getSessions(),
    ]) as any[];

    const allUsers = usersRes.users || [];
    const allSessions = (sessionsRes.sessions || []).filter((s: any) => s.status === "completed");
    setUsers(allUsers);
    setSessions(allSessions);

    // Build rating from sessions
    const userScores: Record<string, number[]> = {};
    for (const s of allSessions) {
      if (!userScores[s.userId]) userScores[s.userId] = [];
      userScores[s.userId].push(s.score || 0);
    }

    const entries: RatingEntry[] = Object.entries(userScores).map(([uid, scores]) => {
      const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
      const u = allUsers.find((u: any) => u.id === uid);
      return {
        userId: uid,
        name: u ? `${u.lastName} ${u.firstName}` : "Пользователь",
        score: Math.round(avg),
        grade: getGrade(avg),
        position: 0,
      };
    });

    entries.sort((a, b) => b.score - a.score);
    entries.forEach((e, i) => e.position = i + 1);

    setRatings(entries);
    setLoading(false);
  }

  function getGrade(score: number): string {
    if (score >= 90) return "A";
    if (score >= 80) return "B";
    if (score >= 70) return "C";
    if (score >= 60) return "D";
    return "F";
  }

  const myEntry = ratings.find(r => r.userId === user?.id);

  return (
    <div data-theme={theme}>
      <div className="flex items-center gap-2 mb-5">
        <Trophy size={22} style={{ color: "var(--primary)" }} />
        <h1 className="text-lg font-black">{tr("rating.title")}</h1>
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
            {t === "rating1" ? "Рейтинг 1" : "Рейтинг 2"}
          </button>
        ))}
      </div>

      {/* My position */}
      {myEntry && (
        <div className="rounded-2xl p-4 mb-4 card-glow"
          style={{ background: "var(--primary)15", border: "1.5px solid var(--primary)" }}>
          <p className="text-xs mb-1" style={{ color: "var(--primary)" }}>Ваша позиция</p>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-bold">{myEntry.name}</p>
              <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>#{myEntry.position} место</p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-black" style={{ color: "var(--primary)" }}>{myEntry.grade}</p>
              <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>{myEntry.score}%</p>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 rounded-full border-2 animate-spin"
            style={{ borderColor: "var(--primary)", borderTopColor: "transparent" }} />
        </div>
      ) : ratings.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-4xl mb-3">🏆</div>
          <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>Рейтинг пустой</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {ratings.map((r) => (
            <div key={r.userId} className="rounded-2xl px-4 py-3 flex items-center gap-3"
              style={{
                background: r.userId === user?.id ? "var(--primary)10" : "var(--card)",
                border: `1px solid ${r.userId === user?.id ? "var(--primary)" : "var(--border)"}`,
              }}>
              <div className="w-8 h-8 rounded-xl flex items-center justify-center font-black text-sm flex-shrink-0"
                style={{
                  background: r.position === 1 ? "#FFD700" : r.position === 2 ? "#C0C0C0" : r.position === 3 ? "#CD7F32" : "var(--secondary)",
                  color: r.position <= 3 ? "#0A0E1A" : "var(--muted-foreground)"
                }}>
                {r.position <= 3 ? ["🥇","🥈","🥉"][r.position - 1] : r.position}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate">{r.name}</p>
              </div>
              <div className="text-right">
                <p className="text-lg font-black" style={{ color: getGradeColor(r.grade) }}>{r.grade}</p>
                <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>{r.score}%</p>
              </div>
            </div>
          ))}
        </div>
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
