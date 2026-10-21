import mammoth from 'mammoth';

export interface ParsedQuestion {
  questionText: string;
  options: string[];
  correctOptionIndex: number;
  marks: number;
}

export interface ParseResult {
  rawText: string;
  questions: ParsedQuestion[];
  detectedCount: number;
}

export function parseTextToQuestions(text: string): ParsedQuestion[] {
  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);
  const questions: ParsedQuestion[] = [];
  let current: ParsedQuestion | null = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Detect question start: e.g., "1. What is...", "Q1: What is...", "Question 1:"
    const qMatch = line.match(/^(?:Q(?:uestion)?\s*\d+[\.\:\)]|\d+[\.\)])\s*(.+)/i);
    if (qMatch) {
      if (current && current.questionText && current.options.length > 0) {
        questions.push(current);
      }
      current = {
        questionText: qMatch[1].trim(),
        options: [],
        correctOptionIndex: 0,
        marks: 10,
      };
      continue;
    }

    // Detect Option: e.g., "A) React", "a. React", "(A) React", "1) React"
    const optMatch = line.match(/^[\(\[]?([A-Da-d1-4])[\)\]\.\:]\s*(.+)/);
    if (optMatch && current) {
      current.options.push(optMatch[2].trim());
      continue;
    }

    // Detect Answer line: e.g., "Answer: B", "Ans: A", "Correct Answer: C"
    const ansMatch = line.match(/^(?:Answer|Ans|Correct(?:\s*Answer)?)\s*[:\-\=]\s*([A-Da-d1-4])/i);
    if (ansMatch && current) {
      const char = ansMatch[1].toUpperCase();
      let idx = 0;
      if (char === 'A' || char === '1') idx = 0;
      else if (char === 'B' || char === '2') idx = 1;
      else if (char === 'C' || char === '3') idx = 2;
      else if (char === 'D' || char === '4') idx = 3;
      current.correctOptionIndex = idx;
      continue;
    }

    // Detect Marks: e.g., "[10 marks]", "(5 points)"
    const marksMatch = line.match(/\[?\s*(\d+)\s*(?:marks?|points?|pts?)\s*\]?/i);
    if (marksMatch && current) {
      current.marks = parseInt(marksMatch[1], 10) || 10;
      continue;
    }

    // Otherwise, append to current question text if no options yet
    if (current && current.options.length === 0) {
      current.questionText += ' ' + line;
    }
  }

  if (current && current.questionText && current.options.length > 0) {
    questions.push(current);
  }

  return questions;
}

export async function parseDocxFile(file: File): Promise<ParseResult> {
  const arrayBuffer = await file.arrayBuffer();
  const { value } = await mammoth.extractRawText({ arrayBuffer });
  const questions = parseTextToQuestions(value);
  return {
    rawText: value,
    questions,
    detectedCount: questions.length,
  };
}
