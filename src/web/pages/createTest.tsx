import { useState } from "react";
import { useStore } from "../store/useStore";
import { useT } from "../lib/i18n";
import { api } from "../lib/api";
import { useLocation } from "wouter";
import { toast } from "sonner";
import { Plus, Trash2, ChevronLeft, Check } from "lucide-react";

interface Answer { id: string; text: string; isCorrect: boolean; }
interface Question { id: string; text: string; type: "single" | "multiple"; answers: Answer[]; }

export default function CreateTestPage() {
  const { user, lang, theme } = useStore();
  const tr = useT(lang);
  const [, navigate] = useLocation();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [scope, setScope] = useState<"personal" | "shared">("personal");
  const [type, setType] = useState("training");
  const [timeLimit, setTimeLimit] = useState("");
  const [passingScore, setPassingScore] = useState("60");
  const [questions, setQuestions] = useState<Question[]>([newQuestion()]);
  const [loading, setLoading] = useState(false);

  function newQuestion(): Question {
    return { id: Date.now().toString(), text: "", type: "single", answers: [newAnswer(), newAnswer(), newAnswer(), newAnswer()] };
  }
  function newAnswer(): Answer {
    return { id: Date.now().toString() + Math.random(), text: "", isCorrect: false };
  }

  function addQuestion() {
    setQuestions(qs => [...qs, newQuestion()]);
  }

  function removeQuestion(idx: number) {
    setQuestions(qs => qs.filter((_, i) => i !== idx));
  }

  function updateQuestion(idx: number, field: string, value: any) {
    setQuestions(qs => qs.map((q, i) => i === idx ? { ...q, [field]: value } : q));
  }

  function addAnswer(qIdx: number) {
    setQuestions(qs => qs.map((q, i) => i === qIdx ? { ...q, answers: [...q.answers, newAnswer()] } : q));
  }

  function removeAnswer(qIdx: number, aIdx: number) {
    setQuestions(qs => qs.map((q, i) => i === qIdx ? { ...q, answers: q.answers.filter((_, j) => j !== aIdx) } : q));
  }

  function updateAnswer(qIdx: number, aIdx: number, field: string, value: any) {
    setQuestions(qs => qs.map((q, i) => {
      if (i !== qIdx) return q;
      const answers = q.answers.map((a, j) => {
        if (j !== aIdx) return field === "isCorrect" && q.type === "single" ? { ...a, isCorrect: false } : a;
        return { ...a, [field]: value };
      });
      return { ...q, answers };
    }));
  }

  function toggleCorrect(qIdx: number, aIdx: number) {
    const q = questions[qIdx];
    if (q.type === "single") {
      // Only one correct
      setQuestions(qs => qs.map((q, i) => {
        if (i !== qIdx) return q;
        return { ...q, answers: q.answers.map((a, j) => ({ ...a, isCorrect: j === aIdx })) };
      }));
    } else {
      updateAnswer(qIdx, aIdx, "isCorrect", !q.answers[aIdx].isCorrect);
    }
  }

  async function handleSave() {
    if (!title.trim()) { toast.error("Введите название теста"); return; }
    if (!user) return;
    for (const q of questions) {
      if (!q.text.trim()) { toast.error("Заполните все вопросы"); return; }
      const hasCorrect = q.answers.some(a => a.isCorrect);
      if (!hasCorrect) { toast.error(`Выберите правильный ответ для: "${q.text.slice(0, 30)}..."`); return; }
    }
    setLoading(true);
    const res: any = await api.createTest({
      title: title.trim(),
      description: description.trim() || undefined,
      authorId: user.id,
      type,
      scope,
      timeLimit: timeLimit ? parseInt(timeLimit) : undefined,
      passingScore: parseFloat(passingScore),
      questions: questions.map((q, i) => ({
        text: q.text,
        type: q.type,
        order: i,
        answers: q.answers.filter(a => a.text.trim()).map((a, j) => ({
          text: a.text,
          isCorrect: a.isCorrect,
          order: j,
        })),
      })),
    });
    setLoading(false);
    if (res.error) { toast.error(res.error); return; }
    toast.success(scope === "personal" ? "Тест сохранён!" : "Тест отправлен на проверку!");
    navigate("/training");
  }

  return (
    <div data-theme={theme}>
      {/* Header */}
      <div className="flex items-center gap-3 mb-5">
        <button onClick={() => navigate(-1 as any)}
          className="w-9 h-9 rounded-xl flex items-center justify-center"
          style={{ background: "var(--secondary)" }}>
          <ChevronLeft size={18} />
        </button>
        <h1 className="text-lg font-black flex-1">{tr("tests.create")}</h1>
        <button onClick={handleSave} disabled={loading}
          className="px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-1.5 transition-all active:scale-95"
          style={{ background: "linear-gradient(135deg, var(--primary), var(--accent))", color: "var(--primary-foreground)" }}>
          <Check size={16} /> {tr("common.save")}
        </button>
      </div>

      {/* Meta */}
      <div className="rounded-2xl p-4 mb-4 card-glow" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
        <Field label="Название теста *" value={title} onChange={e => setTitle(e.target.value)} />
        <div className="mt-3">
          <label className="text-xs font-medium block mb-1" style={{ color: "var(--muted-foreground)" }}>Описание</label>
          <textarea value={description} onChange={e => setDescription(e.target.value)} rows={2}
            className="w-full rounded-xl px-3 py-2.5 text-sm border outline-none resize-none"
            style={{ background: "var(--input)", color: "var(--foreground)", borderColor: "var(--border)" }} />
        </div>
        <div className="grid grid-cols-2 gap-3 mt-3">
          <div>
            <label className="text-xs font-medium block mb-1" style={{ color: "var(--muted-foreground)" }}>Тип</label>
            <select value={type} onChange={e => setType(e.target.value)}
              className="w-full rounded-xl px-3 py-2.5 text-sm border"
              style={{ background: "var(--input)", color: "var(--foreground)", borderColor: "var(--border)" }}>
              <option value="training">Тренировка</option>
              <option value="rating1">Рейтинг 1</option>
              <option value="rating2">Рейтинг 2</option>
              <option value="exam">Экзамен</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-medium block mb-1" style={{ color: "var(--muted-foreground)" }}>Доступ</label>
            <select value={scope} onChange={e => setScope(e.target.value as any)}
              className="w-full rounded-xl px-3 py-2.5 text-sm border"
              style={{ background: "var(--input)", color: "var(--foreground)", borderColor: "var(--border)" }}>
              <option value="personal">Личный</option>
              <option value="shared">Общий (на проверке)</option>
            </select>
          </div>
          <Field label={tr("tests.timeLimit")} value={timeLimit} onChange={e => setTimeLimit(e.target.value)} type="number" />
          <Field label={tr("tests.passingScore")} value={passingScore} onChange={e => setPassingScore(e.target.value)} type="number" />
        </div>
      </div>

      {/* Questions */}
      <div className="flex flex-col gap-3">
        {questions.map((q, qIdx) => (
          <QuestionEditor key={q.id} q={q} qIdx={qIdx}
            onUpdate={(f, v) => updateQuestion(qIdx, f, v)}
            onRemove={() => removeQuestion(qIdx)}
            onAddAnswer={() => addAnswer(qIdx)}
            onRemoveAnswer={(aIdx) => removeAnswer(qIdx, aIdx)}
            onUpdateAnswer={(aIdx, f, v) => updateAnswer(qIdx, aIdx, f, v)}
            onToggleCorrect={(aIdx) => toggleCorrect(qIdx, aIdx)}
            canRemove={questions.length > 1}
            tr={tr}
          />
        ))}
      </div>

      <button onClick={addQuestion}
        className="w-full mt-3 py-3 rounded-2xl text-sm font-semibold flex items-center justify-center gap-2 transition-all active:scale-95"
        style={{ background: "var(--secondary)", color: "var(--foreground)", border: "2px dashed var(--border)" }}>
        <Plus size={16} /> Добавить вопрос
      </button>

      <div className="h-4" />
    </div>
  );
}

function QuestionEditor({ q, qIdx, onUpdate, onRemove, onAddAnswer, onRemoveAnswer, onUpdateAnswer, onToggleCorrect, canRemove, tr }: any) {
  return (
    <div className="rounded-2xl p-4 card-glow" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-bold px-2 py-0.5 rounded-lg"
          style={{ background: "var(--primary)20", color: "var(--primary)" }}>
          Вопрос {qIdx + 1}
        </span>
        <div className="flex items-center gap-2">
          <select value={q.type} onChange={e => onUpdate("type", e.target.value)}
            className="text-xs rounded-lg px-2 py-1 border"
            style={{ background: "var(--input)", color: "var(--foreground)", borderColor: "var(--border)" }}>
            <option value="single">Один ответ</option>
            <option value="multiple">Несколько ответов</option>
          </select>
          {canRemove && (
            <button onClick={onRemove}
              className="w-7 h-7 rounded-lg flex items-center justify-center"
              style={{ background: "rgba(239,68,68,0.1)", color: "#EF4444" }}>
              <Trash2 size={13} />
            </button>
          )}
        </div>
      </div>
      <textarea value={q.text} onChange={e => onUpdate("text", e.target.value)}
        placeholder="Текст вопроса..." rows={2}
        className="w-full rounded-xl px-3 py-2.5 text-sm border outline-none resize-none mb-3"
        style={{ background: "var(--input)", color: "var(--foreground)", borderColor: "var(--border)" }} />

      <div className="flex flex-col gap-2">
        {q.answers.map((a: Answer, aIdx: number) => (
          <div key={a.id} className="flex items-center gap-2">
            <button onClick={() => onToggleCorrect(aIdx)}
              className="w-6 h-6 flex-shrink-0 rounded flex items-center justify-center border-2 transition-all"
              style={{
                borderColor: a.isCorrect ? "#34D399" : "var(--border)",
                background: a.isCorrect ? "#34D399" : "transparent"
              }}>
              {a.isCorrect && <Check size={13} color="white" />}
            </button>
            <input value={a.text} onChange={e => onUpdateAnswer(aIdx, "text", e.target.value)}
              placeholder={`Ответ ${aIdx + 1}`}
              className="flex-1 rounded-xl px-3 py-2 text-sm border outline-none"
              style={{ background: "var(--input)", color: "var(--foreground)", borderColor: a.isCorrect ? "#34D39940" : "var(--border)" }} />
            {q.answers.length > 2 && (
              <button onClick={() => onRemoveAnswer(aIdx)}
                className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ background: "rgba(239,68,68,0.1)", color: "#EF4444" }}>
                <Trash2 size={12} />
              </button>
            )}
          </div>
        ))}
      </div>
      <button onClick={onAddAnswer}
        className="mt-2 text-xs flex items-center gap-1 px-3 py-1.5 rounded-lg transition-all"
        style={{ color: "var(--primary)", background: "var(--primary)15" }}>
        <Plus size={12} /> Добавить ответ
      </button>
    </div>
  );
}

function Field({ label, value, onChange, type = "text" }: any) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-medium" style={{ color: "var(--muted-foreground)" }}>{label}</label>
      <input type={type} value={value} onChange={onChange}
        className="rounded-xl px-3 py-2.5 text-sm border outline-none"
        style={{ background: "var(--input)", color: "var(--foreground)", borderColor: "var(--border)" }} />
    </div>
  );
}
