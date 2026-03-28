export interface ParsedAnswer {
  text: string;
  isCorrect: boolean;
}

export interface ParsedQuestion {
  text: string;
  type: "single" | "multiple";
  answers: ParsedAnswer[];
  explanation?: string;
}

/**
 * Method 1: AUTO parse
 * - Single answer: always single unless markers found
 * - Multiple answer markers: а1 б2 с3 д4 / a1 b2 c3 d4
 * Pattern:
 *   1. Вопрос текст
 *   А) Ответ 1
 *   Б) Ответ 2
 *   В) Ответ 3 
 *   Г) Ответ 4
 *   Ответ: А (single) OR Ответ: а1б2 / а1 б2 (multiple)
 */
export function autoParseText(text: string): ParsedQuestion[] {
  const questions: ParsedQuestion[] = [];
  
  // Split by numbered questions: 1. or 1) 
  const blocks = text.split(/(?=\n?\d+[\.\)]\s)/g).filter(b => b.trim());
  
  for (const block of blocks) {
    const lines = block.split("\n").map(l => l.trim()).filter(l => l);
    if (lines.length < 3) continue;
    
    // First line is question (remove number prefix)
    const questionText = lines[0].replace(/^\d+[\.\)]\s*/, "").trim();
    if (!questionText) continue;
    
    const answerLines: { letter: string; text: string }[] = [];
    let correctLine = "";
    
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      // Answer options: А) Б) В) Г) or A) B) C) D) or а) б) в) г)
      const ansMatch = line.match(/^([АБВГДЕЖЗаабвгдabcde])[)\.\s]\s*(.+)/i);
      if (ansMatch) {
        answerLines.push({ letter: ansMatch[1].toLowerCase(), text: ansMatch[2] });
      }
      // Correct answer line
      if (/^(ответ|answer|ҷавоб)[:\s]/i.test(line)) {
        correctLine = line.replace(/^(ответ|answer|ҷавоб)[:\s]*/i, "").trim().toLowerCase();
      }
    }
    
    if (answerLines.length === 0) continue;
    
    // Detect multiple answer markers: а1б2 or "а1 б2" or "a1 b2"
    const multiplePattern = /[абвгдabcde]\d/gi;
    const multipleMatches = correctLine.match(multiplePattern);
    const isMultiple = multipleMatches && multipleMatches.length > 1;
    
    let correctLetters: string[] = [];
    if (isMultiple && multipleMatches) {
      // Extract letters from markers: а1 -> а, б2 -> б
      correctLetters = multipleMatches.map(m => m[0].toLowerCase());
    } else {
      // Single: just the letter
      correctLetters = [correctLine.charAt(0).toLowerCase()];
    }
    
    const parsedAnswers: ParsedAnswer[] = answerLines.map(a => ({
      text: a.text,
      isCorrect: correctLetters.includes(a.letter),
    }));
    
    questions.push({
      text: questionText,
      type: isMultiple ? "multiple" : "single",
      answers: parsedAnswers,
    });
  }
  
  return questions;
}

/**
 * Method 2: MANUAL - just parse questions and answers, user sets types
 */
export function manualParseText(text: string): ParsedQuestion[] {
  const questions: ParsedQuestion[] = [];
  
  const blocks = text.split(/(?=\n?\d+[\.\)]\s)/g).filter(b => b.trim());
  
  for (const block of blocks) {
    const lines = block.split("\n").map(l => l.trim()).filter(l => l);
    if (lines.length < 2) continue;
    
    const questionText = lines[0].replace(/^\d+[\.\)]\s*/, "").trim();
    if (!questionText) continue;
    
    const answers: ParsedAnswer[] = [];
    
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      if (/^(ответ|answer|ҷавоб)[:\s]/i.test(line)) continue;
      const ansMatch = line.match(/^[АБВГДЕаабвгдabcdeABCDE][)\.\s]\s*(.+)/i);
      if (ansMatch) {
        answers.push({ text: ansMatch[1], isCorrect: false }); // user sets later
      }
    }
    
    if (answers.length === 0) continue;
    
    questions.push({
      text: questionText,
      type: "single", // user will change
      answers,
    });
  }
  
  return questions;
}

export function parseFileContent(content: string, method: "auto" | "manual"): ParsedQuestion[] {
  if (method === "auto") return autoParseText(content);
  return manualParseText(content);
}
