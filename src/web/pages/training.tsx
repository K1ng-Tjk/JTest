import { useEffect, useState } from "react";
import { useStore } from "../store/useStore";
import { useT } from "../lib/i18n";
import { api } from "../lib/api";
import { useLocation } from "wouter";
import { Plus, FileUp, Clock, CheckCircle, ChevronRight, BookOpen, Globe, Settings, Eye, Download, EyeOff } from "lucide-react";
import { toast } from "sonner";

export default function TrainingPage() {
  const { user, lang, theme } = useStore();
  const tr = useT(lang);
  const [, navigate] = useLocation();
  const [tab, setTab] = useState<"personal" | "shared">("personal");
  const [tests, setTests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [questionLimit, setQuestionLimit] = useState(0);
  const [showSettings, setShowSettings] = useState(false);
  const [viewAnswersId, setViewAnswersId] = useState<string | null>(null);

  useEffect(() => { loadTests(); }, [tab, user]);

  async function loadTests() {
    if (!user) return;
    setLoading(true);
    const res: any = await api.getTests({ userId: user.id, type: "training" });
    if (res.tests) {
      const filtered = res.tests.filter((t: any) =>
        tab === "personal"
          ? t.authorId === user.id
          : t.scope === "shared" && t.status === "approved"
      );
      setTests(filtered);
    }
    setLoading(false);
  }

  async function deleteTest(id: string) {
    await api.deleteTest(id);
    loadTests();
  }

  return (
    <div data-theme={theme}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <BookOpen size={22} style={{ color: "var(--primary)" }} />
          <h1 className="text-lg font-black">{tr("nav.training")}</h1>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowSettings(!showSettings)}
            className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: showSettings ? "var(--primary)20" : "var(--secondary)", color: showSettings ? "var(--primary)" : "var(--muted-foreground)" }}>
            <Settings size={16} />
          </button>
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

      {showSettings && (
        <div className="rounded-2xl p-4 mb-4 card-glow" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
          <p className="text-xs font-bold mb-3" style={{ color: "var(--muted-foreground)" }}>
            {lang === "ru" ? "Настройки тренировки" : "Танзимоти машқ"}
          </p>
          <div>
            <label className="text-xs block mb-1" style={{ color: "var(--muted-foreground)" }}>
              {lang === "ru" ? "Количество вопросов (0 = все)" : "Шумораи саволҳо (0 = ҳама)"}
            </label>
            <input type="number" min={0} max={200} value={questionLimit}
              onChange={e => setQuestionLimit(parseInt(e.target.value) || 0)}
              className="w-full rounded-xl px-3 py-2 text-sm border outline-none"
              style={{ background: "var(--input)", color: "var(--foreground)", borderColor: "var(--border)" }} />
            <p className="text-xs mt-1" style={{ color: "var(--muted-foreground)" }}>
              {questionLimit === 0
                ? (lang === "ru" ? "Все вопросы, случайный порядок" : "Ҳама саволҳо")
                : (lang === "ru" ? `${questionLimit} случайных вопросов` : `${questionLimit} савол`)}
            </p>
          </div>
        </div>
      )}

      <div className="flex rounded-xl overflow-hidden mb-4" style={{ background: "var(--secondary)" }}>
        <button onClick={() => setTab("personal")}
          className="flex-1 py-2.5 text-sm font-semibold flex items-center justify-center gap-1.5 transition-all"
          style={{ background: tab === "personal" ? "var(--primary)" : "transparent", color: tab === "personal" ? "var(--primary-foreground)" : "var(--muted-foreground)", borderRadius: "10px" }}>
          <BookOpen size={13} /> {lang === "ru" ? "Личные" : "Шахсӣ"}
        </button>
        <button onClick={() => setTab("shared")}
          className="flex-1 py-2.5 text-sm font-semibold flex items-center justify-center gap-1.5 transition-all"
          style={{ background: tab === "shared" ? "var(--primary)" : "transparent", color: tab === "shared" ? "var(--primary-foreground)" : "var(--muted-foreground)", borderRadius: "10px" }}>
          <Globe size={13} /> {lang === "ru" ? "Общие" : "Умумӣ"}
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-8 h-8 rounded-full border-2 animate-spin" style={{ borderColor: "var(--primary)", borderTopColor: "transparent" }} />
        </div>
      ) : tests.length === 0 ? (
        <div className="flex flex-col items-center py-16 gap-3">
          <div className="text-4xl">📚</div>
          <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>{tr("tests.noTests")}</p>
          <button onClick={() => navigate("/tests/create")}
            className="px-4 py-2 rounded-xl text-sm font-semibold transition-all active:scale-95"
            style={{ background: "var(--primary)", color: "var(--primary-foreground)" }}>
            {tr("tests.create")}
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {tests.map(test => (
            <TestCard key={test.id} test={test}
              onStart={() => navigate(`/test/${test.id}?limit=${questionLimit}`)}
              onEdit={() => navigate(`/tests/edit/${test.id}`)}
              onDelete={() => deleteTest(test.id)}
              showingAnswers={viewAnswersId === test.id}
              onToggleAnswers={() => setViewAnswersId(viewAnswersId === test.id ? null : test.id)}
              lang={lang} tr={tr} userId={user!.id} />
          ))}
        </div>
      )}
    </div>
  );
}

function TestCard({ test, onStart, onEdit, onDelete, lang, tr, userId, showingAnswers, onToggleAnswers }: any) {
  const isOwner = test.authorId === userId;
  const [questionsData, setQuestionsData] = useState<any>(null);
  const [loadingQ, setLoadingQ] = useState(false);

  async function loadQuestions() {
    if (questionsData) return; // already loaded
    setLoadingQ(true);
    const res: any = await api.getTest(test.id);
    setQuestionsData(res);
    setLoadingQ(false);
  }

  function handleToggle() {
    if (!questionsData) loadQuestions();
    onToggleAnswers();
  }

  function downloadTest() {
    const res = questionsData;
    if (!res) { toast.error("Сначала загрузите ответы"); return; }
    const qs: any[] = res.questions || [];
    const ans: any[] = res.answers || [];

    let txt = `${test.title}\n`;
    if (test.description) txt += `${test.description}\n`;
    txt += `${"=".repeat(50)}\n\n`;

    qs.forEach((q: any, i: number) => {
      txt += `${i + 1}. ${q.text}\n`;
      const qAnswers = ans.filter((a: any) => a.questionId === q.id).sort((a: any, b: any) => a.order - b.order);
      qAnswers.forEach((a: any) => {
        txt += `   ${a.isCorrect ? "✓" : "○"} ${a.text}\n`;
      });
      txt += "\n";
    });

    const blob = new Blob([txt], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${test.title.replace(/[^а-яёa-z0-9\s]/gi, "")}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(lang === "ru" ? "Тест скачан!" : "Тест зеркашида шуд!");
  }

  return (
    <div className="rounded-2xl p-4 card-glow" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1 pr-2">
          <h3 className="text-sm font-bold mb-1">{test.title}</h3>
          {test.description && (
            <p className="text-xs line-clamp-2" style={{ color: "var(--muted-foreground)" }}>{test.description}</p>
          )}
        </div>
        <span className="text-xs px-2 py-0.5 rounded-full flex-shrink-0"
          style={{
            background: test.status === "approved" ? "rgba(52,211,153,0.15)" : test.status === "pending" ? "rgba(251,191,36,0.15)" : "rgba(239,68,68,0.15)",
            color: test.status === "approved" ? "#34D399" : test.status === "pending" ? "#FBBF24" : "#EF4444"
          }}>
          {test.status === "approved" ? tr("tests.approved") : test.status === "pending" ? tr("tests.pending") : tr("tests.rejected")}
        </span>
      </div>

      <div className="flex items-center gap-3 mb-3">
        {test.timeLimit && (
          <span className="flex items-center gap-1 text-xs" style={{ color: "var(--muted-foreground)" }}>
            <Clock size={11} /> {test.timeLimit} {lang === "ru" ? "мин" : "дақ"}
          </span>
        )}
        <span className="flex items-center gap-1 text-xs" style={{ color: "var(--muted-foreground)" }}>
          <CheckCircle size={11} /> {test.passingScore || 60}%
        </span>
        <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>
          {lang === "ru" ? "Тренировка" : "Машқ"}
        </span>
      </div>

      {/* Action buttons row */}
      <div className="flex gap-2 mb-2">
        <button onClick={handleToggle}
          className="flex-1 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1 transition-all active:scale-95"
          style={{ background: showingAnswers ? "rgba(96,165,250,0.15)" : "var(--secondary)", color: showingAnswers ? "#60A5FA" : "var(--muted-foreground)" }}>
          {showingAnswers ? <EyeOff size={12} /> : <Eye size={12} />}
          {lang === "ru" ? "Ответы" : "Ҷавобҳо"}
        </button>
        <button onClick={() => { if (!questionsData) loadQuestions().then(downloadTest); else downloadTest(); }}
          className="flex-1 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1 transition-all active:scale-95"
          style={{ background: "var(--secondary)", color: "var(--muted-foreground)" }}>
          <Download size={12} />
          {lang === "ru" ? "Скачать" : "Зеркашӣ"}
        </button>
      </div>

      {/* Answers panel */}
      {showingAnswers && (
        <div className="mb-3 rounded-xl overflow-hidden" style={{ border: "1px solid var(--border)" }}>
          {loadingQ ? (
            <div className="flex justify-center py-4">
              <div className="w-5 h-5 rounded-full border-2 animate-spin" style={{ borderColor: "var(--primary)", borderTopColor: "transparent" }} />
            </div>
          ) : questionsData ? (
            <AllAnswersPanel questionsData={questionsData} lang={lang} />
          ) : null}
        </div>
      )}

      <div className="flex gap-2">
        {isOwner && (
          <>
            <button onClick={onEdit}
              className="px-3 py-2 rounded-xl text-xs font-semibold transition-all active:scale-95"
              style={{ background: "var(--secondary)", color: "var(--foreground)" }}>
              {tr("tests.edit")}
            </button>
            <button onClick={onDelete}
              className="px-3 py-2 rounded-xl text-xs font-semibold transition-all active:scale-95"
              style={{ background: "rgba(239,68,68,0.1)", color: "#EF4444" }}>
              {tr("tests.delete")}
            </button>
          </>
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

function AllAnswersPanel({ questionsData, lang }: { questionsData: any; lang: string }) {
  const questions: any[] = questionsData.questions || [];
  const answers: any[] = questionsData.answers || [];

  if (questions.length === 0) return (
    <div className="p-3 text-xs text-center" style={{ color: "var(--muted-foreground)" }}>
      {lang === "ru" ? "Вопросов нет" : "Саволҳо нест"}
    </div>
  );

  return (
    <div className="flex flex-col divide-y" style={{ borderColor: "var(--border)" }}>
      <div className="px-3 py-2 text-xs font-bold" style={{ background: "var(--secondary)", color: "var(--muted-foreground)" }}>
        {lang === "ru" ? `Все ответы (${questions.length} вопросов)` : `Ҳамаи ҷавобҳо (${questions.length} савол)`}
      </div>
      {questions
        .sort((a: any, b: any) => a.order - b.order)
        .map((q: any, idx: number) => {
          const qAnswers = answers
            .filter((a: any) => a.questionId === q.id)
            .sort((a: any, b: any) => a.order - b.order);
          return (
            <div key={q.id} className="p-3">
              <p className="text-xs font-semibold mb-1.5 leading-relaxed">
                {idx + 1}. {q.text}
              </p>
              <div className="flex flex-col gap-1 pl-2">
                {qAnswers.map((a: any) => (
                  <div key={a.id} className="flex items-start gap-1.5">
                    <span className="text-xs flex-shrink-0 mt-0.5" style={{ color: a.isCorrect ? "#34D399" : "var(--muted-foreground)" }}>
                      {a.isCorrect ? "✓" : "○"}
                    </span>
                    <span className="text-xs" style={{ color: a.isCorrect ? "#34D399" : "var(--foreground)", fontWeight: a.isCorrect ? 600 : 400 }}>
                      {a.text}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
    </div>
  );
}
