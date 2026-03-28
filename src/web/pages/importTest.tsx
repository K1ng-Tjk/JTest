import { useState, useRef } from "react";
import { useStore } from "../store/useStore";
import { useT } from "../lib/i18n";
import { api } from "../lib/api";
import { useLocation } from "wouter";
import { toast } from "sonner";
import { ChevronLeft, Upload, Zap, Settings2, Check, Trash2, Plus } from "lucide-react";
import { parseFileContent, type ParsedQuestion } from "../lib/testParser";

type Method = "auto" | "manual";

export default function ImportTestPage() {
  const { user, lang, theme } = useStore();
  const tr = useT(lang);
  const [, navigate] = useLocation();
  const fileRef = useRef<HTMLInputElement>(null);

  const [method, setMethod] = useState<Method>("auto");
  const [step, setStep] = useState<"upload" | "preview" | "meta">("upload");
  const [fileText, setFileText] = useState("");
  const [fileName, setFileName] = useState("");
  const [questions, setQuestions] = useState<ParsedQuestion[]>([]);
  const [title, setTitle] = useState("");
  const [scope, setScope] = useState<"personal" | "shared">("personal");
  const [type, setType] = useState("training");
  const [loading, setLoading] = useState(false);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 25 * 1024 * 1024) { toast.error("Файл слишком большой (макс. 25 МБ)"); return; }

    setFileName(file.name);
    setTitle(file.name.replace(/\.[^.]+$/, ""));

    const text = await readFileText(file);
    setFileText(text);

    const parsed = parseFileContent(text, method);
    if (parsed.length === 0) {
      toast.error("Не удалось распознать вопросы. Проверьте формат файла.");
      return;
    }
    setQuestions(parsed);
    setStep("preview");
  }

  async function readFileText(file: File): Promise<string> {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.readAsText(file, "UTF-8");
    });
  }

  function updateQuestion(idx: number, field: string, value: any) {
    setQuestions(qs => qs.map((q, i) => i === idx ? { ...q, [field]: value } : q));
  }

  function toggleCorrect(qIdx: number, aIdx: number) {
    const q = questions[qIdx];
    setQuestions(qs => qs.map((q, i) => {
      if (i !== qIdx) return q;
      if (q.type === "single") {
        return { ...q, answers: q.answers.map((a, j) => ({ ...a, isCorrect: j === aIdx })) };
      }
      return { ...q, answers: q.answers.map((a, j) => j === aIdx ? { ...a, isCorrect: !a.isCorrect } : a) };
    }));
  }

  function removeQuestion(idx: number) {
    setQuestions(qs => qs.filter((_, i) => i !== idx));
  }

  async function handleSave() {
    if (!title.trim()) { toast.error("Введите название"); return; }
    if (!user) return;

    setLoading(true);
    const res: any = await api.createTest({
      title: title.trim(),
      authorId: user.id,
      type,
      scope,
      passingScore: 60,
      questions: questions.map((q, i) => ({
        text: q.text,
        type: q.type,
        order: i,
        answers: q.answers.map((a, j) => ({ text: a.text, isCorrect: a.isCorrect, order: j })),
      })),
    });
    setLoading(false);

    if (res.error) { toast.error(res.error); return; }
    toast.success("Тест импортирован!");
    navigate("/training");
  }

  return (
    <div data-theme={theme}>
      {/* Header */}
      <div className="flex items-center gap-3 mb-5">
        <button onClick={() => step === "upload" ? navigate(-1 as any) : setStep("upload")}
          className="w-9 h-9 rounded-xl flex items-center justify-center"
          style={{ background: "var(--secondary)" }}>
          <ChevronLeft size={18} />
        </button>
        <h1 className="text-lg font-black flex-1">{tr("import.title")}</h1>
      </div>

      {step === "upload" && (
        <>
          {/* Method tabs */}
          <div className="grid grid-cols-2 gap-3 mb-5">
            <MethodCard
              active={method === "auto"}
              onClick={() => setMethod("auto")}
              icon={<Zap size={20} />}
              title={tr("import.method1")}
              desc={tr("import.method1desc")}
            />
            <MethodCard
              active={method === "manual"}
              onClick={() => setMethod("manual")}
              icon={<Settings2 size={20} />}
              title={tr("import.method2")}
              desc={tr("import.method2desc")}
            />
          </div>

          {/* Format info */}
          {method === "auto" && (
            <div className="rounded-2xl p-3 mb-4 text-xs" style={{ background: "var(--card)", border: "1px solid var(--border)", color: "var(--muted-foreground)" }}>
              <p className="font-semibold mb-1" style={{ color: "var(--foreground)" }}>Формат файла:</p>
              <pre className="text-xs leading-relaxed whitespace-pre-wrap">{`1. Вопрос?
А) Ответ 1
Б) Ответ 2
В) Ответ 3
Г) Ответ 4
Ответ: А

2. Вопрос с несколькими?
А) Ответ 1
Б) Ответ 2
В) Ответ 3
Г) Ответ 4
Ответ: а1б2`}</pre>
            </div>
          )}

          {/* Drop zone */}
          <div
            onClick={() => fileRef.current?.click()}
            className="rounded-2xl p-8 text-center cursor-pointer transition-all active:scale-98"
            style={{ border: "2px dashed var(--primary)", background: "var(--primary)08" }}>
            <Upload size={32} className="mx-auto mb-3" style={{ color: "var(--primary)" }} />
            <p className="text-sm font-semibold mb-1">{tr("import.dropFile")}</p>
            <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>{tr("import.formats")}</p>
            <input ref={fileRef} type="file" accept=".txt,.pdf,.doc,.docx" className="hidden" onChange={handleFile} />
          </div>
        </>
      )}

      {step === "preview" && (
        <>
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>{fileName}</p>
              <p className="text-sm font-bold">{questions.length} вопросов распознано</p>
            </div>
            <button onClick={() => setStep("meta")}
              className="px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-1.5 transition-all active:scale-95"
              style={{ background: "linear-gradient(135deg, var(--primary), var(--accent))", color: "var(--primary-foreground)" }}>
              Далее <ChevronLeft size={14} className="rotate-180" />
            </button>
          </div>

          <div className="flex flex-col gap-3">
            {questions.map((q, qIdx) => (
              <div key={qIdx} className="rounded-2xl p-4 card-glow" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
                <div className="flex items-start justify-between mb-2 gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold" style={{ color: "var(--primary)" }}>#{qIdx + 1}</span>
                    {method === "manual" && (
                      <select value={q.type} onChange={e => updateQuestion(qIdx, "type", e.target.value)}
                        className="text-xs rounded-lg px-2 py-1 border"
                        style={{ background: "var(--input)", color: "var(--foreground)", borderColor: "var(--border)" }}>
                        <option value="single">Один ответ</option>
                        <option value="multiple">Несколько ответов</option>
                      </select>
                    )}
                    {method === "auto" && (
                      <span className="text-xs px-2 py-0.5 rounded-full"
                        style={{ background: "var(--primary)15", color: "var(--primary)" }}>
                        {q.type === "single" ? "Один" : "Несколько"}
                      </span>
                    )}
                  </div>
                  <button onClick={() => removeQuestion(qIdx)}
                    className="w-6 h-6 rounded-lg flex items-center justify-center"
                    style={{ background: "rgba(239,68,68,0.1)", color: "#EF4444" }}>
                    <Trash2 size={11} />
                  </button>
                </div>
                <p className="text-xs font-medium mb-2">{q.text}</p>
                <div className="flex flex-col gap-1.5">
                  {q.answers.map((a, aIdx) => (
                    <div key={aIdx} className="flex items-center gap-2">
                      <button onClick={() => toggleCorrect(qIdx, aIdx)}
                        className="w-5 h-5 flex-shrink-0 rounded flex items-center justify-center border-2 transition-all"
                        style={{
                          borderColor: a.isCorrect ? "#34D399" : "var(--border)",
                          background: a.isCorrect ? "#34D399" : "transparent"
                        }}>
                        {a.isCorrect && <Check size={11} color="white" />}
                      </button>
                      <span className="text-xs">{a.text}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {step === "meta" && (
        <div className="flex flex-col gap-4">
          <div className="rounded-2xl p-4 card-glow" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
            <div className="flex flex-col gap-3">
              <div>
                <label className="text-xs font-medium block mb-1" style={{ color: "var(--muted-foreground)" }}>Название теста *</label>
                <input value={title} onChange={e => setTitle(e.target.value)}
                  className="w-full rounded-xl px-3 py-2.5 text-sm border outline-none"
                  style={{ background: "var(--input)", color: "var(--foreground)", borderColor: "var(--border)" }} />
              </div>
              <div className="grid grid-cols-2 gap-3">
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
                    <option value="shared">Общий</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-2xl p-3 text-xs" style={{ background: "var(--secondary)", color: "var(--muted-foreground)" }}>
            Распознано вопросов: <strong style={{ color: "var(--foreground)" }}>{questions.length}</strong>
          </div>

          <button onClick={handleSave} disabled={loading}
            className="w-full py-3.5 rounded-2xl font-bold text-sm transition-all active:scale-95"
            style={{ background: "linear-gradient(135deg, var(--primary), var(--accent))", color: "var(--primary-foreground)", opacity: loading ? 0.7 : 1 }}>
            {loading ? tr("common.loading") : tr("import.save")}
          </button>
        </div>
      )}
    </div>
  );
}

function MethodCard({ active, onClick, icon, title, desc }: any) {
  return (
    <button onClick={onClick}
      className="rounded-2xl p-3 text-left transition-all active:scale-95"
      style={{
        background: active ? "var(--primary)15" : "var(--card)",
        border: `2px solid ${active ? "var(--primary)" : "var(--border)"}`,
      }}>
      <div className="mb-2" style={{ color: active ? "var(--primary)" : "var(--muted-foreground)" }}>{icon}</div>
      <p className="text-xs font-bold mb-1" style={{ color: active ? "var(--primary)" : "var(--foreground)" }}>{title}</p>
      <p className="text-[10px] leading-relaxed" style={{ color: "var(--muted-foreground)" }}>{desc}</p>
    </button>
  );
}
