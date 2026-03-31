import { useEffect, useState } from "react";
import { useStore } from "../store/useStore";
import { api } from "../lib/api";
import { useLocation, useRoute } from "wouter";
import { ChevronLeft, ChevronRight, Clock, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { toast } from "sonner";

const DEFAULT_TIME = 30 * 60;  // 30 минут
const DEFAULT_COUNT = 25;       // 25 вопросов

interface Answer { id: string; text: string; isCorrect: boolean; order: number; }
interface Question {
  id: string; text: string; type: "single" | "multiple";
  order: number; explanation?: string; answers: Answer[];
}

export default function TestSessionPage() {
  const { user, theme } = useStore();
  const [, navigate] = useLocation();
  const [, params] = useRoute("/test/:id");
  const testId = params?.id;

  const [test, setTest] = useState<any>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState<Record<string, string[]>>({});
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState<number | null>(DEFAULT_TIME);
  const [finished, setFinished] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [answered, setAnswered] = useState<Record<string, boolean>>({}); // qId -> подтверждён

  // Read ?limit= from URL for training mode
  const urlLimit = parseInt(new URLSearchParams(window.location.search).get("limit") || "0") || 0;

  useEffect(() => {
    if (!testId || !user) return;
    loadTest();
  }, [testId, user]);

  useEffect(() => {
    if (finished || loading || timeLeft === null) return;
    if (timeLeft <= 0) { finishTest(); return; }
    const t = setTimeout(() => setTimeLeft(tl => (tl !== null ? tl - 1 : null)), 1000);
    return () => clearTimeout(t);
  }, [timeLeft, finished, loading]);

  function shuffle<T>(arr: T[]): T[] {
    return [...arr].sort(() => Math.random() - 0.5);
  }

  async function loadTest() {
    setLoading(true);
    const res: any = await api.getTest(testId!);
    if (res.error) { toast.error(res.error); navigate(-1 as any); return; }

    setTest(res.test);
    const isTraining = res.test.type === "training";

    // Собираем вопросы
    let allQuestions: Question[] = (res.questions || []).map((q: any) => ({
      ...q,
      answers: shuffle(
        (res.answers || []).filter((a: any) => a.questionId === q.id)
      ),
    }));

    // Перемешиваем вопросы
    allQuestions = shuffle(allQuestions);

    // Лимит: тренировка — настройка пользователя (urlLimit), остальные — 25 фиксировано
    const limit = isTraining
      ? (urlLimit > 0 ? Math.min(urlLimit, allQuestions.length) : allQuestions.length)
      : Math.min(DEFAULT_COUNT, allQuestions.length);

    allQuestions = allQuestions.slice(0, limit);
    setQuestions(allQuestions);

    // Время: тренировка — без лимита (null), остальные — 30 мин или кастом
    const customTime = res.test.timeLimit ? res.test.timeLimit * 60 : DEFAULT_TIME;
    setTimeLeft(isTraining ? null : customTime); // null = нет таймера для тренировки

    const sessRes: any = await api.startSession(user!.id, testId!);
    if (sessRes.sessionId) setSessionId(sessRes.sessionId);
    setLoading(false);
  }

  function toggleAnswer(qId: string, aId: string, isSingle: boolean) {
    if (answered[qId]) return; // уже ответили — нельзя менять
    setSelected(prev => {
      const curr = prev[qId] || [];
      if (isSingle) return { ...prev, [qId]: [aId] };
      if (curr.includes(aId)) return { ...prev, [qId]: curr.filter(id => id !== aId) };
      return { ...prev, [qId]: [...curr, aId] };
    });
  }

  function confirmAnswer() {
    const q = questions[current];
    if (!selected[q.id]?.length) { toast.error("Выберите ответ"); return; }
    setAnswered(prev => ({ ...prev, [q.id]: true }));
  }

  function nextQuestion() {
    if (current < questions.length - 1) {
      setCurrent(c => c + 1);
    } else {
      finishTest();
    }
  }

  async function finishTest() {
    if (!sessionId || !user || finished) return;
    setFinished(true);

    let correct = 0;
    for (const q of questions) {
      const sel = selected[q.id] || [];
      const correctIds = q.answers.filter(a => a.isCorrect).map(a => a.id);
      if (q.type === "single") {
        if (sel.length === 1 && correctIds.includes(sel[0])) correct++;
      } else {
        if (correctIds.every(id => sel.includes(id)) && sel.every(id => correctIds.includes(id))) correct++;
      }
    }

    const score = questions.length > 0 ? Math.round((correct / questions.length) * 100) : 0;
    await api.completeSession(sessionId, {
      score, totalQuestions: questions.length, correctAnswers: correct, answers: selected,
    });
    setResult({ score, correct, total: questions.length, passed: score >= (test?.passingScore || 60) });
  }

  if (loading) return (
    <div data-theme={theme} className="flex items-center justify-center min-h-screen" style={{ background: "var(--background)" }}>
      <div className="w-10 h-10 rounded-full border-2 animate-spin"
        style={{ borderColor: "var(--primary)", borderTopColor: "transparent" }} />
    </div>
  );

  if (finished && result) return (
    <ResultScreen result={result} test={test} questions={questions} selected={selected} navigate={navigate} theme={theme} />
  );

  const q = questions[current];
  if (!q) return null;

  const isTraining = test?.type === "training";
  const hasTimer = timeLeft !== null;
  const mins = timeLeft !== null ? Math.floor(timeLeft / 60) : 0;
  const secs = timeLeft !== null ? timeLeft % 60 : 0;
  const progress = ((current + 1) / questions.length) * 100;
  const isAnswered = !!answered[q.id];

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
          <div className="text-center flex-1 mx-2">
            <p className="text-xs font-medium" style={{ color: "var(--muted-foreground)" }}>
              {current + 1} / {questions.length}
            </p>
            <p className="text-xs font-bold truncate">{test?.title}</p>
          </div>
          {hasTimer ? (
            <div className="px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1"
              style={{
                background: (timeLeft !== null && timeLeft < 60) ? "rgba(239,68,68,0.15)" : "var(--secondary)",
                color: (timeLeft !== null && timeLeft < 60) ? "#EF4444" : "var(--foreground)"
              }}>
              <Clock size={12} /> {mins}:{secs.toString().padStart(2, "0")}
            </div>
          ) : (
            <div className="w-16" />
          )}
        </div>
        <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "var(--secondary)" }}>
          <div className="h-full rounded-full transition-all duration-300"
            style={{ width: `${progress}%`, background: "linear-gradient(to right, var(--primary), var(--accent))" }} />
        </div>
      </div>

      {/* Question */}
      <div className="flex-1 px-4 py-3 overflow-y-auto">
        <div className="rounded-2xl p-4 mb-4 card-glow" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
          <span className="text-xs px-2 py-0.5 rounded-full font-semibold mb-2 inline-block"
            style={{ background: "var(--primary)20", color: "var(--primary)" }}>
            {q.type === "single" ? "Один ответ" : "Несколько ответов"}
          </span>
          <p className="text-sm font-medium leading-relaxed">{q.text}</p>
        </div>

        {/* Answers */}
        <div className="flex flex-col gap-2.5">
          {q.answers.map((a) => {
            const isSel = (selected[q.id] || []).includes(a.id);
            const isCorrect = a.isCorrect;

            // Подсветка после ответа
            let bg = "var(--card)";
            let border = "var(--border)";
            let textColor = "var(--foreground)";
            let icon = null;

            if (isAnswered) {
              if (isCorrect) {
                bg = "rgba(52,211,153,0.12)";
                border = "#34D399";
                textColor = "#34D399";
                icon = <CheckCircle size={16} color="#34D399" />;
              } else if (isSel && !isCorrect) {
                bg = "rgba(239,68,68,0.12)";
                border = "#EF4444";
                textColor = "#EF4444";
                icon = <XCircle size={16} color="#EF4444" />;
              }
            } else if (isSel) {
              bg = "rgba(212,160,23,0.12)";
              border = "var(--primary)";
            }

            return (
              <button key={a.id}
                onClick={() => toggleAnswer(q.id, a.id, q.type === "single")}
                disabled={isAnswered}
                className="w-full text-left p-3.5 rounded-2xl transition-all flex items-center gap-3"
                style={{ background: bg, border: `1.5px solid ${border}`, color: textColor }}>
                <div className={`w-5 h-5 flex-shrink-0 flex items-center justify-center border-2 transition-all ${q.type === "single" ? "rounded-full" : "rounded-md"}`}
                  style={{
                    borderColor: isAnswered ? (isCorrect ? "#34D399" : isSel ? "#EF4444" : "var(--border)") : (isSel ? "var(--primary)" : "var(--border)"),
                    background: isAnswered ? (isCorrect ? "#34D399" : isSel ? "#EF4444" : "transparent") : (isSel ? "var(--primary)" : "transparent"),
                  }}>
                  {(isSel || (isAnswered && isCorrect)) && (
                    isAnswered
                      ? (isCorrect ? <CheckCircle size={12} color="white" /> : isSel ? <XCircle size={12} color="white" /> : null)
                      : <CheckCircle size={12} color="white" />
                  )}
                </div>
                <span className="text-sm flex-1">{a.text}</span>
                {isAnswered && icon && <div className="flex-shrink-0">{icon}</div>}
              </button>
            );
          })}
        </div>

        {/* Explanation after answer */}
        {isAnswered && q.explanation && (
          <div className="mt-3 rounded-xl p-3 flex items-start gap-2"
            style={{ background: "rgba(96,165,250,0.1)", border: "1px solid #60A5FA40" }}>
            <AlertCircle size={14} color="#60A5FA" className="flex-shrink-0 mt-0.5" />
            <p className="text-xs" style={{ color: "#60A5FA" }}>{q.explanation}</p>
          </div>
        )}
      </div>

      {/* Question number grid — прыгать по вопросам */}
      <div className="px-4 pb-2">
        <div className="flex flex-wrap gap-1.5 justify-center">
          {questions.map((_, idx) => {
            const qid = questions[idx].id;
            const isConf = !!answered[qid];   // подтверждён
            const hasSel = !!(selected[qid]?.length); // выбран но не подтверждён
            const isCur = idx === current;
            return (
              <button key={idx} onClick={() => setCurrent(idx)}
                className="w-8 h-8 rounded-lg text-xs font-bold transition-all active:scale-90"
                style={{
                  background: isCur
                    ? "var(--primary)"
                    : isConf
                    ? "rgba(52,211,153,0.2)"
                    : hasSel
                    ? "rgba(212,160,23,0.15)"
                    : "var(--secondary)",
                  color: isCur
                    ? "var(--primary-foreground)"
                    : isConf
                    ? "#34D399"
                    : hasSel
                    ? "var(--primary)"
                    : "var(--muted-foreground)",
                  border: isCur
                    ? "2px solid var(--primary)"
                    : isConf
                    ? "1px solid #34D39940"
                    : hasSel
                    ? "1px solid var(--primary)40"
                    : "1px solid var(--border)",
                }}>
                {idx + 1}
              </button>
            );
          })}
        </div>
      </div>

      {/* Bottom nav */}
      <div className="sticky bottom-0 px-4 py-3 flex gap-3" style={{ background: "var(--background)", borderTop: "1px solid var(--border)" }}>
        <button onClick={() => setCurrent(c => Math.max(0, c - 1))} disabled={current === 0}
          className="w-12 h-12 rounded-xl flex items-center justify-center"
          style={{ background: "var(--secondary)", opacity: current === 0 ? 0.4 : 1 }}>
          <ChevronLeft size={20} />
        </button>

        {!isAnswered ? (
          <button onClick={confirmAnswer}
            disabled={!selected[q.id]?.length}
            className="flex-1 h-12 rounded-xl font-bold text-sm transition-all active:scale-95"
            style={{
              background: selected[q.id]?.length ? "linear-gradient(135deg, var(--primary), var(--accent))" : "var(--secondary)",
              color: selected[q.id]?.length ? "var(--primary-foreground)" : "var(--muted-foreground)",
            }}>
            Подтвердить
          </button>
        ) : (
          current < questions.length - 1 ? (
            <button onClick={nextQuestion}
              className="flex-1 h-12 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all active:scale-95"
              style={{ background: "linear-gradient(135deg, var(--primary), var(--accent))", color: "var(--primary-foreground)" }}>
              Следующий <ChevronRight size={18} />
            </button>
          ) : (
            <button onClick={finishTest}
              className="flex-1 h-12 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all active:scale-95"
              style={{ background: "linear-gradient(135deg, #34D399, #10B981)", color: "#fff" }}>
              Завершить <CheckCircle size={18} />
            </button>
          )
        )}
      </div>
    </div>
  );
}

function ResultScreen({ result, test, questions, selected, navigate, theme }: any) {
  const passed = result.passed;

  return (
    <div data-theme={theme} className="flex flex-col min-h-screen" style={{ background: "var(--background)" }}>
      <div className="flex-1 px-6 py-8 flex flex-col items-center justify-start">
        <div className="text-6xl mb-4">{passed ? "🎉" : "😔"}</div>
        <h2 className="text-2xl font-black mb-1" style={{ color: passed ? "var(--primary)" : "#EF4444" }}>
          {passed ? "Зачёт!" : "Не зачёт"}
        </h2>
        <p className="text-sm mb-6" style={{ color: "var(--muted-foreground)" }}>{test?.title}</p>

        {/* Score card */}
        <div className="w-full rounded-2xl p-5 mb-6 card-glow" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
          <div className="text-center mb-4">
            <div className="text-5xl font-black" style={{ color: passed ? "var(--primary)" : "#EF4444" }}>
              {result.score}%
            </div>
            <p className="text-xs mt-1" style={{ color: "var(--muted-foreground)" }}>
              {result.correct} из {result.total} правильных
            </p>
          </div>
          <div className="h-3 rounded-full overflow-hidden mb-3" style={{ background: "var(--secondary)" }}>
            <div className="h-full rounded-full"
              style={{
                width: `${result.score}%`,
                background: passed ? "linear-gradient(to right, var(--primary), var(--accent))" : "#EF4444"
              }} />
          </div>
          <div className="flex justify-between">
            <span className="text-xs flex items-center gap-1" style={{ color: "#34D399" }}>
              <CheckCircle size={12} /> {result.correct} правильно
            </span>
            <span className="text-xs flex items-center gap-1" style={{ color: "#EF4444" }}>
              <XCircle size={12} /> {result.total - result.correct} ошибок
            </span>
          </div>
        </div>

        {/* Разбор ошибок */}
        {questions.length > 0 && (
          <div className="w-full mb-6">
            <p className="text-xs font-bold mb-3 uppercase tracking-wider" style={{ color: "var(--muted-foreground)" }}>
              Разбор ответов
            </p>
            <div className="flex flex-col gap-2">
              {questions.map((q: Question, idx: number) => {
                const sel = selected[q.id] || [];
                const correctIds = q.answers.filter(a => a.isCorrect).map(a => a.id);
                const isRight = q.type === "single"
                  ? sel.length === 1 && correctIds.includes(sel[0])
                  : correctIds.every(id => sel.includes(id)) && sel.every(id => correctIds.includes(id));

                return (
                  <div key={q.id} className="rounded-xl p-3"
                    style={{
                      background: isRight ? "rgba(52,211,153,0.08)" : "rgba(239,68,68,0.08)",
                      border: `1px solid ${isRight ? "#34D39930" : "#EF444430"}`,
                    }}>
                    <div className="flex items-start gap-2 mb-2">
                      {isRight
                        ? <CheckCircle size={14} color="#34D399" className="flex-shrink-0 mt-0.5" />
                        : <XCircle size={14} color="#EF4444" className="flex-shrink-0 mt-0.5" />}
                      <p className="text-xs font-medium leading-relaxed">{idx + 1}. {q.text}</p>
                    </div>
                    {!isRight && (
                      <div className="pl-5">
                        {q.answers.filter(a => a.isCorrect).map(a => (
                          <p key={a.id} className="text-xs flex items-center gap-1" style={{ color: "#34D399" }}>
                            <CheckCircle size={10} /> {a.text}
                          </p>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <button onClick={() => navigate("/")}
          className="w-full py-3 rounded-xl font-bold text-sm transition-all active:scale-95"
          style={{ background: "linear-gradient(135deg, var(--primary), var(--accent))", color: "var(--primary-foreground)" }}>
          На главную
        </button>
      </div>
    </div>
  );
}
