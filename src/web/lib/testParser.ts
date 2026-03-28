export interface ParsedAnswer {
  text: string;
  isCorrect: boolean;
}

export interface ParsedQuestion {
  text: string;
  type: "single" | "multiple";
  answers: ParsedAnswer[];
}

// ============================================================
// FORMAT 1: КТМ / Tajik standard format
//   @1. Question text
//   $A) Answer 1
//   $B) Answer 2
//   $C) Answer 3
//   $D) Answer 4
//   $E) Answer 5
//   → correct answer is ALWAYS $A) (first option)
//   BUT answers get shuffled so A is not always shown first
//
// MULTIPLE ANSWER variant (matching/compare):
//   @N. Question...
//   Саволњо: / Тартиб: / Љавобњо: (sub-labels)
//   $A) or $А) sub-question
//   $B) sub-question
//   $A1) correct match for A
//   $B2) correct match for B
//   etc.
// ============================================================
function parseKTM(lines: string[]): ParsedQuestion[] {
  const questions: ParsedQuestion[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i].trim();

    // Question starts with @ or number+dot
    if (/^@\d+\./.test(line) || /^\d+[\.\)]\s+\S/.test(line)) {
      const questionText = line.replace(/^@\d+\.\s*/, "").replace(/^\d+[\.\)]\s*/, "").trim();
      if (!questionText) { i++; continue; }

      const answers: { letter: string; text: string }[] = [];
      i++;

      // Collect answer lines $A) $B) $C) $D) $E) until next question
      while (i < lines.length) {
        const aLine = lines[i].trim();
        if (!aLine) { i++; continue; }
        // Stop at next question
        if (/^@\d+\./.test(aLine) || /^\d+[\.\)]\s+\S/.test(aLine)) break;
        // Skip sub-labels like "Саволњо:", "Љавобњо:", "Тартиб:"
        if (/^(Саволњо|Љавобњо|Тартиби|Тартиб|Саволх|Ҷавобх|Ответ|Answer)[:\s]/i.test(aLine)) { i++; continue; }

        // Match $A) $B) $C) $D) $E) $А) $В) etc (Cyrillic + Latin)
        const m = aLine.match(/^\$([A-EА-ЕABCDEabcdeАБВГДЕабвгде])\d*[\)\.]\s*(.+)/);
        if (m) {
          const letter = m[1].toUpperCase();
          const text = m[2].trim();
          if (text) answers.push({ letter, text });
          i++;
          continue;
        }
        // If line doesn't match answer pattern and not empty, stop
        if (aLine.length > 2) break;
        i++;
      }

      if (answers.length < 2) continue;

      // In KTM format: correct answer is always the one with letter A (or А)
      // Shuffle answers to randomize display order
      const correctLetter = answers[0].letter; // first answer = correct

      // Shuffle answers
      const shuffled = [...answers].sort(() => Math.random() - 0.5);

      const parsedAnswers: ParsedAnswer[] = shuffled.map(a => ({
        text: a.text,
        isCorrect: a.letter === correctLetter,
      }));

      questions.push({ text: questionText, type: "single", answers: parsedAnswers });
      continue;
    }
    i++;
  }

  return questions;
}

// ============================================================
// FORMAT 2: Numbered with А) Б) В) Г) (Cyrillic letters)
//   1. Question?
//   А) Answer 1
//   Б) Answer 2
//   В) Answer 3
//   Г) Answer 4
//   Ответ: А  OR  Правильный ответ: А
//   Multiple: Ответ: А, В  OR  а1б3
// ============================================================
function parseCyrillicNumbered(lines: string[]): ParsedQuestion[] {
  const questions: ParsedQuestion[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i].trim();
    if (!/^\d+[\.\)]\s/.test(line)) { i++; continue; }

    const questionText = line.replace(/^\d+[\.\)]\s*/, "").trim();
    if (!questionText) { i++; continue; }

    const answers: { letter: string; text: string }[] = [];
    let correctLetters: string[] = [];
    i++;

    while (i < lines.length) {
      const aLine = lines[i].trim();
      if (!aLine) { i++; continue; }
      if (/^\d+[\.\)]\s/.test(aLine)) break;

      // Answer options А) Б) В) Г) Д) or A) B) C) D)
      const m = aLine.match(/^([АБВГДЕЖабвгдежABCDEabcde])[\)\.]\s*(.+)/);
      if (m) {
        answers.push({ letter: m[1].toUpperCase(), text: m[2].trim() });
        i++; continue;
      }

      // Answer key line
      if (/^(ответ|правильный ответ|answer)[:\s]/i.test(aLine)) {
        const raw = aLine.replace(/^(ответ|правильный ответ|answer)[:\s]*/i, "").trim().toLowerCase();
        const multiMarkers = raw.match(/[абвгдabcde]\d/gi);
        if (multiMarkers && multiMarkers.length > 1) {
          correctLetters = multiMarkers.map(m => m[0].toUpperCase());
        } else {
          correctLetters = [raw.charAt(0).toUpperCase()];
        }
        i++; continue;
      }
      if (aLine.length > 2) break;
      i++;
    }

    if (answers.length < 2) continue;

    // If no answer key found, default to first
    if (correctLetters.length === 0) correctLetters = [answers[0].letter];

    const isMultiple = correctLetters.length > 1;
    const parsedAnswers: ParsedAnswer[] = answers.map(a => ({
      text: a.text,
      isCorrect: correctLetters.includes(a.letter),
    }));

    questions.push({ text: questionText, type: isMultiple ? "multiple" : "single", answers: parsedAnswers });
  }

  return questions;
}

// ============================================================
// FORMAT 3: Plain text — Question on one line, answers follow
//   Detect by looking for repeated patterns
// ============================================================
function parsePlainText(lines: string[]): ParsedQuestion[] {
  // Try KTM first, then Cyrillic numbered
  const ktm = parseKTM(lines);
  if (ktm.length > 0) return ktm;
  return parseCyrillicNumbered(lines);
}

// ============================================================
// MAIN EXPORT
// ============================================================
export function parseFileContent(content: string, _method: "auto" | "manual"): ParsedQuestion[] {
  const lines = content.split("\n").filter(l => l.trim().length > 0);

  // Detect KTM format by @ prefix
  const hasKTM = lines.some(l => /^@\d+\./.test(l.trim()));
  if (hasKTM) return parseKTM(lines);

  // Cyrillic numbered
  const hasCyrillic = lines.some(l => /^[АБВГДабвгд][\)\.]/.test(l.trim()));
  if (hasCyrillic) return parseCyrillicNumbered(lines);

  // Fallback generic
  return parsePlainText(lines);
}

// Manual parse — same structure but user sets correct answers themselves
export function manualParseText(content: string): ParsedQuestion[] {
  const lines = content.split("\n").filter(l => l.trim().length > 0);
  const hasKTM = lines.some(l => /^@\d+\./.test(l.trim()));

  let questions: ParsedQuestion[] = [];

  if (hasKTM) {
    questions = parseKTM(lines);
  } else {
    questions = parseCyrillicNumbered(lines);
  }

  // Reset all correct answers — user will set manually
  return questions.map(q => ({
    ...q,
    type: "single" as const,
    answers: q.answers.map(a => ({ ...a, isCorrect: false })),
  }));
}
