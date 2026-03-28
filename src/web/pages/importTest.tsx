import { useState, useRef } from "react";
import { useStore } from "../store/useStore";
import { useT } from "../lib/i18n";
import { api } from "../lib/api";
import { useLocation } from "wouter";
import { toast } from "sonner";
import { ChevronLeft, Upload, Zap, Settings2, Check, Trash2, AlertCircle } from "lucide-react";
import { parseFileContent, manualParseText, type ParsedQuestion } from "../lib/testParser";
import mammoth from "mammoth";

type Method = "auto" | "manual";

export default function ImportTestPage() {
  const { user, lang, theme } = useStore();
  const tr = useT(lang);
  const [, navigate] = useLocation();
  const fileRef = useRef<HTMLInputElement>(null);

  const [method, setMethod] = useState<Method>("auto");
  const [step, setStep] = useState<"upload" | "preview" | "meta">("upload");
  const [fileName, setFileName] = useState("");
  const [questions, setQuestions] = useState<ParsedQuestion[]>([]);
  const [title, setTitle] = useState("");
  const [scope, setScope] = useState<"personal" | "shared">("personal");
  const [type, setType] = useState("training");
  const [loading, setLoading] = useState(false);
  const [parsing, setParsing] = useState(false);

  async function readFileAsText(file: File): Promise<string> {
    // DOCX — use mammoth to extract text
    if (file.name.endsWith(".docx") || file.name.endsWith(".doc")) {
      const buf = await file.arrayBuffer();
      const result = await mammoth.extractRawText({ arrayBuffer: buf });
      return result.value;
    }
    // TXT, plain
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsText(file, "UTF-8");
    });
  }

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 25 * 1024 * 1024) { toast.error("Файл слишком большой (макс. 25 МБ)"); return; }

    setFileName(file.name);
    setTitle(file.name.replace(/\.[^.]+$/, ""));
    setParsing(true);

    try {
      const text = await readFileAsText(file);
      const parsed = method === "auto"
        ? parseFileContent(text, "auto")
        : manualParseText(text);

      if (parsed.length === 0) {
        toast.error("Не удалось распознать вопросы. Проверьте формат.");
        setParsing(false);
        return;
      }

      setQuestions(parsed);
      setStep("preview");
      toast.success(`Распознано ${parsed.length} вопросов!`);
    } catch (err) {
      toast.error("Ошибка чтения файла");
    }
    setParsing(false);
    // Reset input
    if (fileRef.current) fileRef.current.value = "";
  }

  function toggleCorrect(qIdx: number, aIdx: number) {
    setQuestions(qs => qs.map((q, i) => {
      if (i !== qIdx) return q;
      if (q.type === "single") {
        return { ...q, answers: q.answers.map((a, j) => ({ ...a, isCorrect: j === aIdx })) };
      }
      return { ...q, answers: q.answers.map((a, j) => j === aIdx ? { ...a, isCorrect: !a.isCorrect } : a) };
    }));
  }

  function updateQType(qIdx: number, type: "single" | "multiple") {
    setQuestions(qs => qs.map((q, i) => i !== qIdx ? q : {
      ...q, type,
      answers: type === "single"
        ? q.answers.map((a, j) => ({ ...a, isCorrect: j === 0 }))
        : q.answers,
    }));
  }

  function removeQuestion(idx: number) {
    setQuestions(qs => qs.filter((_, i) => i !== idx));
  }

  async function handleSave() {
    if (!title.trim()) { toast.error("Введите название"); return; }
    if (!user) return;

    // Validate
    for (const q of questions) {
      if (!q.answers.some(a => a.isCorrect)) {
        toast.error(`Нет правильного ответа: "${q.text.slice(0, 40)}..."`);
        return;
      }
    }

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
    toast.success(`Тест импортирован! ${questions.length} вопросов.`);
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
        {step === "preview" && (
          <button onClick={() => setStep("meta")}
            className="px-4 py-2 rounded-xl text-sm font-bold transition-all active:scale-95"
            style={{ background: "linear-gradient(135deg, var(--primary), var(--accent))", color: "var(--primary-foreground)" }}>
            Далее →
          </button>
        )}
      </div>

      {/* STEP 1: Upload */}
      {step === "upload" && (
        <>
          {/* Method selector */}
          <div className="grid grid-cols-2 gap-3 mb-5">
            <MethodCard active={method === "auto"} onClick={() => setMethod("auto")}
              icon={<Zap size={20} />}
              title="Авто"
              desc="Определяет правильный ответ автоматически (КТМ и стандартные форматы)" />
            <MethodCard active={method === "manual"} onClick={() => setMethod("manual")}
              icon={<Settings2 size={20} />}
              title="Вручную"
              desc="Ты сам выбираешь правильный ответ для каждого вопроса" />
          </div>

          {/* Supported formats info */}
          <div className="rounded-2xl p-3 mb-4" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
            <p className="text-xs font-bold mb-2 flex items-center gap-1.5" style={{ color: "var(--primary)" }}>
              <AlertCircle size={13} /> Поддерживаемые форматы:
            </p>
            <div className="flex flex-col gap-1.5 text-xs" style={{ color: "var(--muted-foreground)" }}>
              <div className="flex items-start gap-2">
                <span className="font-mono text-[10px] px-1.5 py-0.5 rounded"
                  style={{ background: "var(--primary)20", color: "var(--primary)" }}>КТМ</span>
                <span>@1. Вопрос → $A) Правильный → $B) $C) $D) $E)</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="font-mono text-[10px] px-1.5 py-0.5 rounded"
                  style={{ background: "var(--secondary)", color: "var(--foreground)" }}>ЦРФ</span>
                <span>1. Вопрос → А) Б) В) Г) → Ответ: А</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="font-mono text-[10px] px-1.5 py-0.5 rounded"
                  style={{ background: "var(--secondary)", color: "var(--foreground)" }}>ЛАТ</span>
                <span>1. Вопрос → A) B) C) D) → Ответ: A</span>
              </div>
            </div>
          </div>

          {/* Drop zone */}
          <div onClick={() => !parsing && fileRef.current?.click()}
            className="rounded-2xl p-8 text-center cursor-pointer transition-all active:scale-98"
            style={{ border: "2px dashed var(--primary)", background: "var(--primary)08" }}>
            {parsing ? (
              <>
                <div className="w-10 h-10 rounded-full border-2 animate-spin mx-auto mb-3"
                  style={{ borderColor: "var(--primary)", borderTopColor: "transparent" }} />
                <p className="text-sm font-semibold" style={{ color: "var(--primary)" }}>Читаю файл...</p>
              </>
            ) : (
              <>
                <Upload size={32} className="mx-auto mb-3" style={{ color: "var(--primary)" }} />
                <p className="text-sm font-semibold mb-1">Нажми или перетащи файл</p>
                <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>DOCX, TXT до 25 МБ</p>
              </>
            )}
            <input ref={fileRef} type="file" accept=".txt,.docx,.doc" className="hidden" onChange={handleFile} />
          </div>
        </>
      )}

      {/* STEP 2: Preview questions */}
      {step === "preview" && (
        <>
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-xs truncate" style={{ color: "var(--muted-foreground)" }}>{fileName}</p>
              <p className="text-sm font-bold">{questions.length} вопросов</p>
            </div>
            <span className="text-xs px-2 py-1 rounded-full"
              style={{ background: "var(--primary)15", color: "var(--primary)" }}>
              {method === "auto" ? "Авто" : "Ручной"}
            </span>
          </div>

          <div className="flex flex-col gap-3 pb-4">
            {questions.map((q, qIdx) => (
              <div key={qIdx} className="rounded-2xl p-4 card-glow"
                style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-bold" style={{ color: "var(--primary)" }}>#{qIdx + 1}</span>
                    <select value={q.type} onChange={e => updateQType(qIdx, e.target.value as any)}
                      className="text-xs rounded-lg px-2 py-1 border"
                      style={{ background: "var(--input)", color: "var(--foreground)", borderColor: "var(--border)" }}>
                      <option value="single">Один ответ</option>
                      <option value="multiple">Несколько</option>
                    </select>
                  </div>
                  <button onClick={() => removeQuestion(qIdx)}
                    className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ background: "rgba(239,68,68,0.1)", color: "#EF4444" }}>
                    <Trash2 size={11} />
                  </button>
                </div>
                <p className="text-xs font-medium mb-2 leading-relaxed">{q.text}</p>
                <div className="flex flex-col gap-1.5">
                  {q.answers.map((a, aIdx) => (
                    <button key={aIdx} onClick={() => toggleCorrect(qIdx, aIdx)}
                      className="flex items-center gap-2 text-left w-full"
                      style={{ opacity: 1 }}>
                      <div className={`w-5 h-5 flex-shrink-0 flex items-center justify-center border-2 transition-all ${q.type === "single" ? "rounded-full" : "rounded"}`}
                        style={{
                          borderColor: a.isCorrect ? "#34D399" : "var(--border)",
                          background: a.isCorrect ? "#34D399" : "transparent"
                        }}>
                        {a.isCorrect && <Check size={11} color="white" />}
                      </div>
                      <span className="text-xs leading-relaxed" style={{ color: a.isCorrect ? "#34D399" : "var(--foreground)" }}>
                        {a.text}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* STEP 3: Meta */}
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

          <div className="rounded-xl px-4 py-3 text-sm" style={{ background: "var(--secondary)" }}>
            Вопросов: <strong style={{ color: "var(--primary)" }}>{questions.length}</strong>
          </div>

          <button onClick={handleSave} disabled={loading}
            className="w-full py-3.5 rounded-2xl font-bold text-sm transition-all active:scale-95"
            style={{
              background: "linear-gradient(135deg, var(--primary), var(--accent))",
              color: "var(--primary-foreground)",
              opacity: loading ? 0.7 : 1
            }}>
            {loading ? "Сохранение..." : "Сохранить тест"}
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
