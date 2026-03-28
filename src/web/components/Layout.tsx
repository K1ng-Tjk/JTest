import { useLocation } from "wouter";
import { useStore } from "../store/useStore";
import { useT } from "../lib/i18n";
import { Home, BookOpen, Trophy, GraduationCap, MessageCircle, User } from "lucide-react";

interface Props {
  children: React.ReactNode;
}

export default function Layout({ children }: Props) {
  const { lang, theme } = useStore();
  const tr = useT(lang);
  const [location, navigate] = useLocation();

  const navItems = [
    { path: "/", icon: Home, label: tr("nav.home") },
    { path: "/training", icon: BookOpen, label: tr("nav.training") },
    { path: "/rating", icon: Trophy, label: tr("nav.rating") },
    { path: "/exam", icon: GraduationCap, label: tr("nav.exam") },
    { path: "/chat", icon: MessageCircle, label: tr("nav.chat") },
    { path: "/profile", icon: User, label: tr("nav.profile") },
  ];

  const isActive = (path: string) => {
    if (path === "/") return location === "/";
    return location.startsWith(path);
  };

  return (
    <div data-theme={theme} style={{ minHeight: "100vh" }}>
      <main className="page animate-fade-up">
        {children}
      </main>
      <nav className="bottom-nav safe-bottom">
        <div className="flex items-center justify-around px-1 py-2">
          {navItems.map(({ path, icon: Icon, label }) => (
            <button
              key={path}
              onClick={() => navigate(path)}
              className="flex flex-col items-center gap-0.5 px-2 py-1 rounded-xl transition-all duration-200"
              style={{
                color: isActive(path) ? "var(--primary)" : "var(--muted-foreground)",
                background: isActive(path) ? "rgba(212,160,23,0.1)" : "transparent",
              }}
            >
              <Icon size={20} strokeWidth={isActive(path) ? 2.5 : 1.8} />
              <span className="text-[9px] font-medium">{label}</span>
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
}
