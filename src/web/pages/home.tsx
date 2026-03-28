import { useEffect, useState } from "react";
import { useStore } from "../store/useStore";
import { useT } from "../lib/i18n";
import { api } from "../lib/api";
import { useLocation } from "wouter";
import { BookOpen, Trophy, GraduationCap, Plus, Shield, Wifi, WifiOff, FileUp } from "lucide-react";

export default function HomePage() {
  const { user, lang, theme, isOnline } = useStore();
  const tr = useT(lang);
  const [, navigate] = useLocation();
  const [stats, setStats] = useState({ total: 0, completed: 0, avgScore: 0 });

  useEffect(() => {
    if (!user) return;
    api.getSessions({ userId: user.id }).then((res: any) => {
      if (res.sessions) {
        const completed = res.sessions.filter((s: any) => s.status === "completed");
        const avg = completed.length
          ? completed.reduce((sum: number, s: any) => sum + (s.score || 0), 0) / completed.length
          : 0;
        setStats({ total: res.sessions.length, completed: completed.length, avgScore: Math.round(avg) });
      }
    });
  }, [user]);

  if (!user) return null;

  return (
    <div data-theme={theme}>
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl flex items-center justify-center font-bold text-sm"
            style={{ background: "linear-gradient(135deg, var(--primary), var(--accent))", color: "var(--primary-foreground)" }}>
            {user.firstName[0]}{user.lastName[0]}
          </div>
          <div>
            <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>
              {lang === "ru" ? "Добро пожаловать" : lang === "tj" ? "Хуш омадед" : "Welcome"},
            </p>
            <p className="text-sm font-bold">{user.lastName} {user.firstName}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isOnline
            ? <Wifi size={15} style={{ color: "#34D399" }} />
            : <WifiOff size={15} style={{ color: "#EF4444" }} />
          }
          {(user.role === "admin" || user.role === "manager") && (
            <button onClick={() => navigate("/admin")}
              className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: "var(--primary)15", border: "1px solid var(--primary)30" }}>
              <Shield size={17} style={{ color: "var(--primary)" }} />
            </button>
          )}
        </div>
      </div>

      {/* Role badge */}
      <div className="mb-4">
        <span className="text-xs px-3 py-1 rounded-full font-semibold"
          style={{
            background: user.role === "admin" ? "rgba(212,160,23,0.15)" : "var(--secondary)",
            color: user.role === "admin" ? "var(--primary)" : "var(--muted-foreground)",
            border: `1px solid ${user.role === "admin" ? "var(--primary)40" : "var(--border)"}`
          }}>
          {user.role === "admin" ? "👑 Администратор" :
           user.role === "manager" ? "⚙️ Менеджер" :
           user.role === "student" ? "🎓 Студент" : "👤 Пользователь"}
        </span>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {[
          { label: tr("home.totalTests"), value: stats.total, icon: "📝" },
          { label: tr("home.completed"), value: stats.completed, icon: "✅" },
          { label: tr("home.avgScore"), value: stats.avgScore + "%", icon: "⭐" },
        ].map((s) => (
          <div key={s.label} className="rounded-2xl p-3 text-center card-glow"
            style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
            <div className="text-xl mb-1">{s.icon}</div>
            <div className="text-lg font-black" style={{ color: "var(--primary)" }}>{s.value}</div>
            <div className="text-[9px] leading-tight" style={{ color: "var(--muted-foreground)" }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Quick actions */}
      <h2 className="text-xs font-bold mb-3 uppercase tracking-wider" style={{ color: "var(--muted-foreground)" }}>
        {lang === "ru" ? "Быстрый старт" : lang === "tj" ? "Оғози зуд" : "Quick start"}
      </h2>
      <div className="grid grid-cols-2 gap-3 mb-6">
        <ActionCard icon={<BookOpen size={22} />} label={tr("nav.training")} color="var(--primary)"
          onClick={() => navigate("/training")} />
        <ActionCard icon={<Trophy size={22} />} label={tr("nav.rating")} color="#60A5FA"
          onClick={() => navigate("/rating")} />
        <ActionCard icon={<GraduationCap size={22} />} label={tr("nav.exam")} color="#A78BFA"
          onClick={() => navigate("/exam")} />
        <ActionCard icon={<FileUp size={22} />} label={tr("import.title")} color="#34D399"
          onClick={() => navigate("/tests/import")} />
      </div>

      {/* Footer */}
      <footer className="text-center py-4" style={{ borderTop: "1px solid var(--border)" }}>
        <div className="flex items-center justify-center gap-4">
          <a href="https://instagram.com/Jov1d_0n" target="_blank" rel="noreferrer"
            className="text-xs font-medium" style={{ color: "var(--primary)" }}>📸 @Jov1d_0n</a>
          <a href="https://wa.me/992917971000" target="_blank" rel="noreferrer"
            className="text-xs font-medium" style={{ color: "#25D366" }}>💬 WhatsApp</a>
          <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>+992 917 971 000</span>
        </div>
      </footer>
    </div>
  );
}

function ActionCard({ icon, label, color, onClick }: any) {
  return (
    <button onClick={onClick}
      className="rounded-2xl p-4 flex flex-col items-start gap-2 transition-all active:scale-95 card-glow text-left"
      style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
      <div className="w-10 h-10 rounded-xl flex items-center justify-center"
        style={{ background: color + "20", color }}>
        {icon}
      </div>
      <span className="text-sm font-semibold">{label}</span>
    </button>
  );
}
