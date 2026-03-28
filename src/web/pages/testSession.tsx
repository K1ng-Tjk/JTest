import { useEffect, useState } from "react";
import { useStore } from "../store/useStore";
import { useT } from "../lib/i18n";
import { api } from "../lib/api";
import { useLocation, useRoute } from "wouter";
import { ChevronLeft, ChevronRight, Clock, CheckCircle, XCircle } from "lucide-react";
import { toast } from "sonner";

interface Question {
  id: string;
  text: string;
  type: "single" | "multiple";
  order: number;
  explanation?: string;
  answers?: { id: string; text: string; isCorrect: boolean; order: number }[];
}

export default function TestSessionPage() {
  const { user, lang, theme } = useStore();
  const tr = useT(lang);
  const [, navigate] = useLocation();
  const [, params] = useRoute("/test/:id");
  const testId = params?.id;

  const [test, setTest] = useState<any>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState<Record<string, string[]>>({});
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [finished, setFinished] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!testId || !user) return;
    loadTest();
  }, [testId, user]);

  useEffect(() => {
    if (timeLeft === null || finished) return;
    if (timeLeft <= 0) { finishTest(); return; }
    const t = setTimeout(() => setTimeLeft(tl => (tl || 0) - 1), 1000);
    return () => clearTimeout(t);
  }, [timeLeft, finished]);

  async function loadTest() {
    setLoading(true);
    const res: any = await api.getTest(testId!);
    if (res.error) { toast.error(res.error); navigate(-1 as any); return; }

    setTest(res.test);
    const qs = (res.questions || []).map((q: any) => ({
      ...q,
      answers: (res.answers || []).filter((a: any) => a.questionId === q.id)
        .sort((a: any, b: any) => a.order - b.order),
    })).sort((a: any, b: any) => a.order - b.order);
    setQuestions(qs);

    if (res.test.timeLimit) setTimeLeft(res.test.timeLimit * 60);

    const sessRes: any = await api.startSession(user!.id, testId!);
    if (sessRes.sessionId) setSessionId(sessRes.sessionId);
    setLoading(false);
  }

  function toggleAnswer(qId: string, aId: string, isSingle: boolean) {
    setSelected(prev => {
      const curr = prev[qId] || [];
      if (isSingle) return { ...prev, [qId]: [aId] };
      if (curr.includes(aId)) return { ...prev, [qId]: curr.filter(id => id !== aId) };
      return { ...prev, [qId]: [...curr, aId] };
    });
  }

  async function finishTest() {
    if (!sessionId || !user) return;
    setFinished(true);

    let correct = 0;
    for (const q of questions) {
      const sel = selected[q.id] || [];
      const correctIds = (q.answers || []).filter(a => a.isCorrect).map(a => a.id);
      if (q.type === "single") {
        if (sel.length === 1 && correctIds.includes(sel[0])) correct++;
      } else {
        const allCorrect = correctIds.every(id => sel.includes(id)) &&
                           sel.every(id => correctIds.includes(id));
        if (allCorrect) correct++;
      }
    }

    const score = questions.length > 0 ? Math.round((correct / questions.length) * 100) : 0;
    const passed = score >= (test?.passingScore || 60);

    await api.completeSession(sessionId, {
      score,
      totalQuestions: questions.length,
      correctAnswers: correct,
      answers: selected,
    });

    setResult({ score, correct, total: questions.length, passed });
  }

  if (loading) return (
    <div data-theme={theme} className="flex items-center justify-center min-h-screen">
      <div className="w-10 h-10 rounded-full border-2 animate-spin"
        style={{ borderColor: "var(--primary)", borderTopColor: "transparent" }} />
    </div>
  );

  if (finished && result) return <ResultScreen result={result} test={test} tr={tr} navigate={navigate} theme={theme} />;

  const q = questions[current];
  if (!q) return null;

  const progress = ((current + 1) / questions.length) * 100;
  const mins = Math.floor((timeLeft || 0) / 60);
  const secs = (timeLeft || 0) % 60;

  return (
    <div data-theme={theme} className="flex flex-col min-h-screen" style={{ background: "var(--background)" }}>
      {/* Header */}
      <div className="sticky top-0 z-10 px-4 pt-4 pb-3" style={{ background: "var(--background)" }}>
        <div className="flex items-center justify-between mb-3">
          <button onClick={() => navigate(-1 as any)}
            className="w-8 h-8 rounded-xl flex items-center justify-center"
            style={{ background: "var(--secondary)" }}>
            <ChevronLeft size={18} />
          </button>
          <div className="text-center flex-1 mx-3">
            <p className="text-xs font-medium" style={{ color: "var(--muted-foreground)" }}>
              {current + 1} / {questions.length}
            </p>
            <p className="text-sm font-bold truncate">{test?.title}</p>
          </div>
          {timeLeft !== null && (
            <div className="px-3 py-1 rounded-xl text-xs font-bold"
              style={{
                background: timeLeft < 60 ? "rgba(239,68,68,0.15)" : "var(--secondary)",
                color: timeLeft < 60 ? "#EF4444" : "var(--foreground)"
              }}>
              <Clock size={12} className="inline mr-1" />
              {mins}:{secs.toString().padStart(2, "0")}
            </div>
          )}
        </div>
        {/* Progress */}
        <div className="h-1.5 rounded-full" style={{ background: "var(--secondary)" }}>
          <div className="h-full rounded-full transition-all duration-300"
            style={{ width: `${progress}%`, background: "linear-gradient(to right, var(--primary), var(--accent))" }} />
        </div>
      </div>

      {/* Question */}
      <div className="flex-1 px-4 py-4">
        <div className="rounded-2xl p-4 mb-4 card-glow" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
          <div className="flex items-start gap-2 mb-2">
            <span className="text-xs px-2 py-0.5 rounded-full font-semibold flex-shrink-0"
              style={{ background: "var(--primary)20", color: "var(--primary)" }}>
              {q.type === "single" ? tr("tests.single") : tr("tests.multiple")}
            </span>
          </div>
          <p className="text-sm font-medium leading-relaxed">{q.text}</p>
        </div>

        {/* Answers */}
        <div className="flex flex-col gap-2.5">
          {(q.answers || []).map((a) => {
            const isSelected = (selected[q.id] || []).includes(a.id);
            return (
              <button key={a.id}
                onClick={() => toggleAnswer(q.id, a.id, q.type === "single")}
                className="w-full text-left p-3.5 rounded-2xl transition-all active:scale-98 flex items-center gap-3"
                style={{
                  background: isSelected ? "rgba(212,160,23,0.15)" : "var(--card)",
                  border: `1.5px solid ${isSelected ? "var(--primary)" : "var(--border)"}`,
                }}>
                <div className={`w-5 h-5 flex-shrink-0 flex items-center justify-center border-2 transition-all ${q.type === "single" ? "rounded-full" : "rounded-md"}`}
                  style={{
                    borderColor: isSelected ? "var(--primary)" : "var(--border)",
                    background: isSelected ? "var(--primary)" : "transparent"
                  }}>
                  {isSelected && <CheckCircle size={14} style={{ color: "var(--primary-foreground)" }} />}
                </div>
                <span className="text-sm">{a.text}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Navigation */}
      <div className="sticky bottom-0 px-4 py-4 flex gap-3" style={{ background: "var(--background)" }}>
        <button onClick={() => setCurrent(c => Math.max(0, c - 1))} disabled={current === 0}
          className="w-12 h-12 rounded-xl flex items-center justify-center transition-all"
          style={{ background: "var(--secondary)", opacity: current === 0 ? 0.4 : 1 }}>
          <ChevronLeft size={20} />
        </button>
        {current < questions.length - 1 ? (
          <button onClick={() => setCurrent(c => c + 1)}
            className="flex-1 h-12 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all active:scale-95"
            style={{ background: "linear-gradient(135deg, var(--primary), var(--accent))", color: "var(--primary-foreground)" }}>
            {tr("common.next")} <ChevronRight size={18} />
          </button>
        ) : (
          <button onClick={finishTest}
            className="flex-1 h-12 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all active:scale-95"
            style={{ background: "linear-gradient(135deg, #34D399, #10B981)", color: "#fff" }}>
            {tr("common.finish")} <CheckCircle size={18} />
          </button>
        )}
      </div>
    </div>
  );
}

function ResultScreen({ result, test, tr, navigate, theme }: any) {
  const passed = result.passed;
  return (
    <div data-theme={theme} className="flex flex-col items-center justify-center min-h-screen px-6"
      style={{ background: "var(--background)" }}>
      <div className="text-6xl mb-4">{passed ? "🎉" : "😔"}</div>
      <h2 className="text-2xl font-black mb-1" style={{ color: passed ? "var(--primary)" : "#EF4444" }}>
        {passed ? (tr("common.success") || "Отлично!") : "Не прошёл"}
      </h2>
      <p className="text-sm mb-6" style={{ color: "var(--muted-foreground)" }}>{test?.title}</p>

      <div className="w-full rounded-2xl p-5 mb-6 card-glow" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
        <div className="text-center mb-4">
          <div className="text-5xl font-black" style={{ color: passed ? "var(--primary)" : "#EF4444" }}>
            {result.score}%
          </div>
          <p className="text-xs mt-1" style={{ color: "var(--muted-foreground)" }}>
            {result.correct} / {result.total} {tr("tests.questions")}
          </p>
        </div>
        <div className="h-3 rounded-full overflow-hidden" style={{ background: "var(--secondary)" }}>
          <div className="h-full rounded-full transition-all"
            style={{
              width: `${result.score}%`,
              background: passed ? "linear-gradient(to right, var(--primary), var(--accent))" : "#EF4444"
            }} />
        </div>
        <div className="flex justify-between mt-2">
          <span className="text-xs flex items-center gap-1" style={{ color: "#34D399" }}>
            <CheckCircle size={12} /> {result.correct} {tr("common.success") || "правильно"}
          </span>
          <span className="text-xs flex items-center gap-1" style={{ color: "#EF4444" }}>
            <XCircle size={12} /> {result.total - result.correct} {tr("common.error") || "ошибок"}
          </span>
        </div>
      </div>

      <button onClick={() => navigate("/")}
        className="w-full py-3 rounded-xl font-bold text-sm transition-all active:scale-95"
        style={{ background: "linear-gradient(135deg, var(--primary), var(--accent))", color: "var(--primary-foreground)" }}>
        {tr("common.back") || "На главную"}
      </button>
    </div>
  );
}
