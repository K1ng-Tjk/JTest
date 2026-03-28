import { useEffect, useState } from "react";
import { useStore } from "../store/useStore";
import { useT } from "../lib/i18n";
import { api } from "../lib/api";
import { useLocation } from "wouter";
import { Plus, FileUp, Clock, CheckCircle, ChevronRight, BookOpen, Globe } from "lucide-react";
import type { Test } from "../store/useStore";

export default function TrainingPage() {
  const { user, lang, theme } = useStore();
  const tr = useT(lang);
  const [, navigate] = useLocation();
  const [tab, setTab] = useState<"personal" | "shared">("personal");
  const [tests, setTests] = useState<Test[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTests();
  }, [tab, user]);

  async function loadTests() {
    if (!user) return;
    setLoading(true);
    const res: any = await api.getTests({ userId: user.id, type: "training" });
    if (res.tests) {
      const filtered = res.tests.filter((t: Test) =>
        tab === "personal"
          ? t.authorId === user.id
          : t.scope === "shared" && t.status === "approved"
      );
      setTests(filtered);
    }
    setLoading(false);
  }

  return (
    <div data-theme={theme}>
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <BookOpen size={22} style={{ color: "var(--primary)" }} />
          <h1 className="text-lg font-black">{tr("nav.training")}</h1>
        </div>
        <div className="flex gap-2">
          <button onClick={() => navigate("/tests/import")}
            className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: "var(--secondary)" }}>
            <FileUp size={17} style={{ color: "var(--primary)" }} />
          </button>
          <button onClick={() => navigate("/tests/create")}
            className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: "linear-gradient(135deg, var(--primary), var(--accent))" }}>
            <Plus size={17} style={{ color: "var(--primary-foreground)" }} />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex rounded-xl overflow-hidden mb-5" style={{ background: "var(--secondary)" }}>
        <button onClick={() => setTab("personal")}
          className="flex-1 py-2.5 text-sm font-semibold flex items-center justify-center gap-1.5 transition-all"
          style={{
            background: tab === "personal" ? "var(--primary)" : "transparent",
            color: tab === "personal" ? "var(--primary-foreground)" : "var(--muted-foreground)",
            borderRadius: "10px"
          }}>
          <BookOpen size={14} /> {lang === "ru" ? "Личные" : lang === "tj" ? "Шахсӣ" : "Personal"}
        </button>
        <button onClick={() => setTab("shared")}
          className="flex-1 py-2.5 text-sm font-semibold flex items-center justify-center gap-1.5 transition-all"
          style={{
            background: tab === "shared" ? "var(--primary)" : "transparent",
            color: tab === "shared" ? "var(--primary-foreground)" : "var(--muted-foreground)",
            borderRadius: "10px"
          }}>
          <Globe size={14} /> {lang === "ru" ? "Общие" : lang === "tj" ? "Умумӣ" : "Shared"}
        </button>
      </div>

      {/* Tests list */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin"
            style={{ borderColor: "var(--primary)", borderTopColor: "transparent" }} />
        </div>
      ) : tests.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <div className="text-4xl">📚</div>
          <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>{tr("tests.noTests")}</p>
          <button onClick={() => navigate("/tests/create")}
            className="px-4 py-2 rounded-xl text-sm font-semibold mt-2 transition-all active:scale-95"
            style={{ background: "var(--primary)", color: "var(--primary-foreground)" }}>
            {tr("tests.create")}
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {tests.map(test => (
            <TestCard key={test.id} test={test} onStart={() => navigate(`/test/${test.id}`)}
              onEdit={() => navigate(`/tests/edit/${test.id}`)} lang={lang} tr={tr} userId={user!.id} />
          ))}
        </div>
      )}
    </div>
  );
}

function TestCard({ test, onStart, onEdit, lang, tr, userId }: any) {
  const isOwner = test.authorId === userId;
  return (
    <div className="rounded-2xl p-4 card-glow" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1">
          <h3 className="text-sm font-bold mb-1">{test.title}</h3>
          {test.description && (
            <p className="text-xs line-clamp-2" style={{ color: "var(--muted-foreground)" }}>{test.description}</p>
          )}
        </div>
        <span className="ml-2 text-xs px-2 py-0.5 rounded-full"
          style={{
            background: test.status === "approved" ? "rgba(52,211,153,0.15)" :
                        test.status === "pending" ? "rgba(251,191,36,0.15)" : "rgba(239,68,68,0.15)",
            color: test.status === "approved" ? "#34D399" :
                   test.status === "pending" ? "#FBBF24" : "#EF4444"
          }}>
          {test.status === "approved" ? tr("tests.approved") :
           test.status === "pending" ? tr("tests.pending") : tr("tests.rejected")}
        </span>
      </div>
      <div className="flex items-center gap-3 mb-3">
        {test.timeLimit && (
          <span className="flex items-center gap-1 text-xs" style={{ color: "var(--muted-foreground)" }}>
            <Clock size={12} /> {test.timeLimit} {lang === "ru" ? "мин" : "дақ"}
          </span>
        )}
        <span className="flex items-center gap-1 text-xs" style={{ color: "var(--muted-foreground)" }}>
          <CheckCircle size={12} /> {test.passingScore}%
        </span>
      </div>
      <div className="flex gap-2">
        {isOwner && (
          <button onClick={onEdit}
            className="flex-1 py-2 rounded-xl text-xs font-semibold transition-all active:scale-95"
            style={{ background: "var(--secondary)", color: "var(--foreground)" }}>
            {tr("tests.edit")}
          </button>
        )}
        <button onClick={onStart}
          className="flex-1 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1 transition-all active:scale-95"
          style={{ background: "linear-gradient(135deg, var(--primary), var(--accent))", color: "var(--primary-foreground)" }}>
          {tr("tests.start")} <ChevronRight size={14} />
        </button>
      </div>
    </div>
  );
}
