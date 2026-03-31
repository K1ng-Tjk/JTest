import { useEffect, useState } from "react";
import { useStore } from "../store/useStore";
import { useT } from "../lib/i18n";
import { api } from "../lib/api";
import { useLocation } from "wouter";
import { Trophy, ChevronRight, Clock, CheckCircle, BarChart2, RefreshCw, Send, Lock, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";

export default function RatingPage() {
  const { user, lang, theme } = useStore();
  const tr = useT(lang);
  const [, navigate] = useLocation();
  const [tab, setTab] = useState<"rating1" | "rating2">("rating1");
  const [tests, setTests] = useState<any[]>([]);
  const [sessions, setSessions] = useState<any[]>([]);
  const [resets, setResets] = useState<any[]>([]);
  const [myRequests, setMyRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [requesting, setRequesting] = useState<string | null>(null);
  const [reason, setReason] = useState("");
  const [viewAnswersId, setViewAnswersId] = useState<string | null>(null);
  const [answersData, setAnswersData] = useState<Record<string, any>>({});

  useEffect(() => { loadData(); }, [tab]);

  async function loadData() {
    if (!user) return;
    setLoading(true);
    const [testsRes, sessionsRes, resetsRes, reqRes] = await Promise.all([
      api.getTests({ type: tab }),
      api.getSessions({ userId: user.id }),
      api.getExamResets({ userId: user.id }),
      api.getRetakeRequests({ userId: user.id }),
    ]) as any[];

    setTests((testsRes.tests || []).filter((t: any) => t.status === "approved"));
    setSessions((sessionsRes.sessions || []).filter((s: any) => s.status === "completed"));
    setResets(resetsRes.resets || []);
    setMyRequests(reqRes.requests || []);
    setLoading(false);
  }

  function getBestSession(testId: string) {
    const ts = sessions.filter(s => s.testId === testId);
    if (!ts.length) return null;
    return ts.reduce((best, s) => (parseFloat(s.score) > parseFloat(best.score) ? s : best));
  }

  function getRequestStatus(testId: string) {
    const req = myRequests.filter(r => r.testId === testId).sort((a: any, b: any) => b.requestedAt - a.requestedAt)[0];
    return req?.status || null;
  }

  async function sendRequest(testId: string) {
    if (!user) return;
    const res: any = await api.requestRetake(user.id, testId, tab, reason.trim() || undefined);
    if (res.error) { toast.error(res.error); return; }
    toast.success("Запрос отправлен администратору");
    setRequesting(null); setReason(""); loadData();
  }

  function getGrade(score: number | string) {
    const s = parseFloat(String(score));
    if (s >= 90) return "A";
    if (s >= 80) return "B";
    if (s >= 70) return "C";
    if (s >= 60) return "D";
    return "F";
  }

  function getGradeColor(grade: string) {
    if (grade === "A") return "#34D399";
    if (grade === "B") return "#60A5FA";
    if (grade === "C") return "#FBBF24";
    if (grade === "D") return "#F97316";
    return "#EF4444";
  }

  return (
    <div data-theme={theme}>
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <Trophy size={22} style={{ color: "var(--primary)" }} />
          <h1 className="text-lg font-black">{tr("rating.title")}</h1>
        </div>
        {/* Результаты — отдельная кнопка */}
        <button onClick={() => navigate("/rating-results")}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all active:scale-95"
          style={{ background: "var(--secondary)", color: "var(--primary)" }}>
          <BarChart2 size={14} />
          {lang === "ru" ? "Результаты" : lang === "tj" ? "Натиҷаҳо" : "Results"}
        </button>
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
            {t === "rating1"
              ? (lang === "ru" ? "Рейтинг 1" : "Рейтинги 1")
              : (lang === "ru" ? "Рейтинг 2" : "Рейтинги 2")}
          </button>
        ))}
      </div>

      <p className="text-xs mb-4" style={{ color: "var(--muted-foreground)" }}>
        {lang === "ru"
          ? "Тесты рейтинга. Можно сдавать несколько раз — учитывается лучший результат."
          : "Тестҳои рейтинг. Якчанд маротиба сдавать мешавад — беҳтарин натиҷа ба ҳисоб меравад."}
      </p>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-8 h-8 rounded-full border-2 animate-spin"
            style={{ borderColor: "var(--primary)", borderTopColor: "transparent" }} />
        </div>
      ) : tests.length === 0 ? (
        <div className="flex flex-col items-center py-16 gap-3">
          <div className="text-4xl">🏆</div>
          <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>
            {lang === "ru" ? "Тестов рейтинга нет" : "Тестҳо нест"}
          </p>
          <p className="text-xs text-center" style={{ color: "var(--muted-foreground)" }}>
            {lang === "ru" ? "Администратор добавит тесты" : "Маъмур тестҳо илова мекунад"}
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {tests.map(test => {
            const best = getBestSession(test.id);
            const passed = best && parseFloat(best.score) >= (test.passingScore || 60);

            return (
              <div key={test.id} className="rounded-2xl overflow-hidden card-glow"
                style={{
                  background: "var(--card)",
                  border: `1px solid ${best ? (passed ? "#34D39440" : "#EF444440") : "var(--border)"}`,
                }}>
                {/* Test info */}
                <div className="p-4">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex-1">
                      <h3 className="text-sm font-bold mb-1">{test.title}</h3>
                      {test.description && (
                        <p className="text-xs line-clamp-2" style={{ color: "var(--muted-foreground)" }}>
                          {test.description}
                        </p>
                      )}
                    </div>
                    {/* Лучший результат */}
                    {best && (
                      <div className="text-right flex-shrink-0">
                        <div className="text-2xl font-black" style={{ color: getGradeColor(getGrade(best.score)) }}>
                          {getGrade(best.score)}
                        </div>
                        <div className="text-xs font-bold" style={{ color: getGradeColor(getGrade(best.score)) }}>
                          {best.score}%
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Meta */}
                  <div className="flex items-center gap-3 mb-3">
                    {test.timeLimit && (
                      <span className="text-xs flex items-center gap-1" style={{ color: "var(--muted-foreground)" }}>
                        <Clock size={11} /> {test.timeLimit} {lang === "ru" ? "мин" : "дақ"}
                      </span>
                    )}
                    <span className="text-xs flex items-center gap-1" style={{ color: "var(--muted-foreground)" }}>
                      <CheckCircle size={11} /> {lang === "ru" ? "Проходной" : "Гузаштан"}: {test.passingScore || 60}%
                    </span>
                    {best && (
                      <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>
                        {best.correctAnswers}/{best.totalQuestions} ✓
                      </span>
                    )}
                  </div>

                  {/* Progress bar (если уже сдавал) */}
                  {best && (
                    <div className="mb-3">
                      <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "var(--secondary)" }}>
                        <div className="h-full rounded-full transition-all"
                          style={{
                            width: `${best.score}%`,
                            background: passed
                              ? "linear-gradient(to right, #34D399, #10B981)"
                              : "linear-gradient(to right, #EF4444, #F97316)"
                          }} />
                      </div>
                      <div className="flex justify-between mt-1">
                        <span className="text-[10px]" style={{ color: "var(--muted-foreground)" }}>
                          {lang === "ru" ? "Лучший результат" : "Беҳтарин натиҷа"}
                        </span>
                        <span className="text-[10px] font-semibold"
                          style={{ color: passed ? "#34D399" : "#EF4444" }}>
                          {passed
                            ? (lang === "ru" ? "Зачёт ✓" : "Зачёт ✓")
                            : (lang === "ru" ? "Не зачёт" : "Нагузашт")}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Пересдача: рейтинг можно сдать повторно только с разрешения */}
                  {best && (() => {
                    const reqStatus = getRequestStatus(test.id);
                    const isReq = requesting === test.id;
                    return (
                      <div className="mb-3">
                        {reqStatus === "pending" ? (
                          <div className="rounded-xl px-3 py-2 text-xs flex items-center gap-2"
                            style={{ background: "rgba(251,191,36,0.1)", color: "#FBBF24" }}>
                            <RefreshCw size={11} /> Запрос на пересдачу ожидает...
                          </div>
                        ) : isReq ? (
                          <div className="flex flex-col gap-2">
                            <textarea value={reason} onChange={e => setReason(e.target.value)}
                              placeholder="Причина (по желанию)..." rows={2}
                              className="w-full rounded-xl px-3 py-2 text-xs border outline-none resize-none"
                              style={{ background: "var(--input)", color: "var(--foreground)", borderColor: "var(--border)" }} />
                            <div className="flex gap-2">
                              <button onClick={() => { setRequesting(null); setReason(""); }}
                                className="flex-1 py-2 rounded-xl text-xs" style={{ background: "var(--secondary)" }}>Отмена</button>
                              <button onClick={() => sendRequest(test.id)}
                                className="flex-1 py-2 rounded-xl text-xs flex items-center justify-center gap-1"
                                style={{ background: "var(--primary)20", color: "var(--primary)" }}>
                                <Send size={11} /> Отправить
                              </button>
                            </div>
                          </div>
                        ) : reqStatus !== "pending" && (
                          <button onClick={() => setRequesting(test.id)}
                            className="w-full py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5"
                            style={{ background: "var(--secondary)", color: "var(--primary)" }}>
                            <RefreshCw size={11} /> Запросить пересдачу
                          </button>
                        )}
                      </div>
                    );
                  })()}

                  {/* View answers for completed test */}
                  {best && (
                    <>
                      <button
                        onClick={async () => {
                          const isOpen = viewAnswersId === test.id;
                          setViewAnswersId(isOpen ? null : test.id);
                          if (!isOpen && !answersData[best.id]) {
                            const res: any = await api.getSession(best.id);
                            setAnswersData(prev => ({ ...prev, [best.id]: res }));
                          }
                        }}
                        className="w-full py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 mb-2 transition-all active:scale-95"
                        style={{ background: "rgba(96,165,250,0.1)", color: "#60A5FA" }}>
                        {viewAnswersId === test.id ? <EyeOff size={12} /> : <Eye size={12} />}
                        {viewAnswersId === test.id
                          ? (lang === "ru" ? "Скрыть ответы" : "Пинҳон кардан")
                          : (lang === "ru" ? "Посмотреть мои ответы" : "Ҷавобҳои ман")}
                      </button>
                      {viewAnswersId === test.id && answersData[best.id] && (
                        <SessionAnswerReview data={answersData[best.id]} lang={lang} />
                      )}
                    </>
                  )}

                  <button onClick={() => !best && navigate(`/test/${test.id}`)}
                    disabled={!!best}
                    className="w-full py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all active:scale-95"
                    style={{
                      background: best ? "var(--secondary)" : "linear-gradient(135deg, var(--primary), var(--accent))",
                      color: best ? "var(--muted-foreground)" : "var(--primary-foreground)",
                      cursor: best ? "not-allowed" : "pointer",
                    }}>
                    {best ? <><Lock size={14} /> Завершён</> : <>{lang === "ru" ? "Начать" : "Оғоз кардан"} <ChevronRight size={16} /></>}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function SessionAnswerReview({ data, lang }: { data: any; lang: string }) {
  const session = data?.session;
  const questions: any[] = data?.questions || [];
  const answers: any[] = data?.answers || [];
  if (!session) return null;
  let userAnswers: Record<string, string[]> = {};
  try { userAnswers = JSON.parse(session.answers || "{}"); } catch { }

  return (
    <div className="mb-3 rounded-xl overflow-hidden" style={{ border: "1px solid var(--border)" }}>
      <div className="px-3 py-2 text-xs font-bold" style={{ background: "var(--secondary)", color: "var(--muted-foreground)" }}>
        {lang === "ru" ? `Мои ответы (${session.correctAnswers}/${session.totalQuestions} правильно)` : `Ҷавобҳои ман (${session.correctAnswers}/${session.totalQuestions})`}
      </div>
      <div className="flex flex-col divide-y" style={{ borderColor: "var(--border)" }}>
        {questions.map((q: any, idx: number) => {
          const qAnswers = answers.filter((a: any) => a.questionId === q.id);
          const correctIds = qAnswers.filter((a: any) => a.isCorrect).map((a: any) => a.id);
          const selected = userAnswers[q.id] || [];
          const isRight = q.type === "single"
            ? selected.length === 1 && correctIds.includes(selected[0])
            : correctIds.every((id: string) => selected.includes(id)) && selected.every((id: string) => correctIds.includes(id));
          return (
            <div key={q.id} className="p-3">
              <div className="flex items-start gap-2 mb-2">
                <span className="text-xs font-bold flex-shrink-0 mt-0.5" style={{ color: isRight ? "#34D399" : "#EF4444" }}>
                  {isRight ? "✓" : "✗"} {idx + 1}.
                </span>
                <p className="text-xs leading-relaxed">{q.text}</p>
              </div>
              <div className="flex flex-col gap-1 pl-4">
                {qAnswers.map((a: any) => {
                  const wasSel = selected.includes(a.id);
                  const correct = a.isCorrect;
                  let color = "var(--muted-foreground)";
                  if (correct) color = "#34D399";
                  else if (wasSel && !correct) color = "#EF4444";
                  return (
                    <div key={a.id} className="flex items-center gap-1.5">
                      <span className="text-xs" style={{ color }}>{correct ? "●" : wasSel ? "○" : "·"}</span>
                      <span className="text-xs" style={{ color }}>{a.text}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
