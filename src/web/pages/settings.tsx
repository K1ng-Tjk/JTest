import { useStore } from "../store/useStore";
import { useT } from "../lib/i18n";
import { useLocation } from "wouter";
import { ChevronLeft, Sun, Moon, Waves } from "lucide-react";
import type { Theme, Lang } from "../store/useStore";

export default function SettingsPage() {
  const { lang, theme, setTheme, setLang } = useStore();
  const tr = useT(lang);
  const [, navigate] = useLocation();

  const themes: { id: Theme; label: string; color: string; bg: string }[] = [
    { id: "gold", label: lang === "ru" ? "Золотой" : lang === "tj" ? "Тиллоӣ" : "Gold", color: "#D4A017", bg: "#0A0E1A" },
    { id: "blue", label: lang === "ru" ? "Синий" : lang === "tj" ? "Кабуд" : "Blue", color: "#3B82F6", bg: "#0F172A" },
    { id: "night", label: lang === "ru" ? "Ночной" : lang === "tj" ? "Шабона" : "Night", color: "#A78BFA", bg: "#09090B" },
  ];

  const langs: { id: Lang; label: string; flag: string }[] = [
    { id: "ru", label: "Русский", flag: "🇷🇺" },
    { id: "tj", label: "Тоҷикӣ", flag: "🇹🇯" },
    { id: "en", label: "English", flag: "🇬🇧" },
  ];

  return (
    <div data-theme={theme}>
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate(-1 as any)}
          className="w-9 h-9 rounded-xl flex items-center justify-center"
          style={{ background: "var(--secondary)" }}>
          <ChevronLeft size={18} />
        </button>
        <h1 className="text-lg font-black">{tr("common.settings")}</h1>
      </div>

      {/* Theme */}
      <div className="rounded-2xl p-4 mb-4 card-glow" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
        <p className="text-xs font-bold mb-3" style={{ color: "var(--muted-foreground)" }}>{tr("common.theme")}</p>
        <div className="grid grid-cols-3 gap-2">
          {themes.map(t => (
            <button key={t.id} onClick={() => setTheme(t.id)}
              className="rounded-xl p-3 flex flex-col items-center gap-2 transition-all active:scale-95"
              style={{
                background: t.bg,
                border: `2px solid ${theme === t.id ? t.color : "var(--border)"}`,
              }}>
              <div className="w-7 h-7 rounded-full"
                style={{ background: `linear-gradient(135deg, ${t.color}, ${t.color}80)` }} />
              <span className="text-xs font-semibold" style={{ color: theme === t.id ? t.color : "#9CA3AF" }}>
                {t.label}
              </span>
              {theme === t.id && (
                <div className="w-1.5 h-1.5 rounded-full" style={{ background: t.color }} />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Language */}
      <div className="rounded-2xl p-4 card-glow" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
        <p className="text-xs font-bold mb-3" style={{ color: "var(--muted-foreground)" }}>{tr("common.language")}</p>
        <div className="flex flex-col gap-2">
          {langs.map(l => (
            <button key={l.id} onClick={() => setLang(l.id)}
              className="flex items-center justify-between px-4 py-3 rounded-xl transition-all active:scale-98"
              style={{
                background: lang === l.id ? "var(--primary)15" : "var(--secondary)",
                border: `1.5px solid ${lang === l.id ? "var(--primary)" : "transparent"}`,
              }}>
              <div className="flex items-center gap-3">
                <span className="text-xl">{l.flag}</span>
                <span className="text-sm font-semibold">{l.label}</span>
              </div>
              {lang === l.id && (
                <div className="w-5 h-5 rounded-full flex items-center justify-center"
                  style={{ background: "var(--primary)" }}>
                  <div className="w-2 h-2 rounded-full bg-white" />
                </div>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
