import { QuizSet, GameMode } from '../types';

// Safely encode unicode string to base64
export function encodeQuizToCode(quiz: QuizSet): string {
  try {
    const jsonStr = JSON.stringify(quiz);
    const utf8Bytes = new TextEncoder().encode(jsonStr);
    let binary = '';
    for (let i = 0; i < utf8Bytes.length; i++) {
      binary += String.fromCharCode(utf8Bytes[i]);
    }
    return btoa(binary);
  } catch (err) {
    console.error('Failed to encode quiz:', err);
    return '';
  }
}

// Safely decode base64 to QuizSet
export function decodeQuizFromCode(code: string): QuizSet | null {
  try {
    const trimmed = code.trim();
    if (!trimmed) return null;

    // Check if it's direct JSON
    if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
      const parsed = JSON.parse(trimmed);
      if (parsed && parsed.title && Array.isArray(parsed.questions)) {
        return parsed as QuizSet;
      }
    }

    const binary = atob(trimmed);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    const jsonStr = new TextDecoder().decode(bytes);
    const parsed = JSON.parse(jsonStr);

    if (parsed && parsed.title && Array.isArray(parsed.questions)) {
      return parsed as QuizSet;
    }
    return null;
  } catch (err) {
    console.error('Failed to decode quiz code:', err);
    return null;
  }
}

// Generate complete shareable game URL that works across any browser/domain
export function generateShareUrl(quiz: QuizSet, mode?: GameMode): string {
  const origin = window.location.origin;
  const encoded = encodeQuizToCode(quiz);
  const modeParam = mode ? `&mode=${mode}` : '';

  // If encoded payload is reasonably sized (< 6000 chars), embed it directly in URL for 100% domain-independence
  if (encoded && encoded.length < 6000) {
    return `${origin}/?shareQuiz=${encodeURIComponent(encoded)}${modeParam}`;
  }

  // Fallback to ID-based URL
  return `${origin}/?quizId=${encodeURIComponent(quiz.id)}${modeParam}`;
}

// Download single quiz as JSON file
export function downloadQuizJson(quiz: QuizSet) {
  const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(quiz, null, 2));
  const downloadAnchor = document.createElement('a');
  const safeName = quiz.title.replace(/[^a-zA-Z0-9_\-]/g, '_').toLowerCase();
  downloadAnchor.setAttribute('href', dataStr);
  downloadAnchor.setAttribute('download', `eduzone-kuis-${safeName}.json`);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
}

// Download all custom quizzes as backup file
export function downloadAllQuizzesJson(quizzes: QuizSet[]) {
  const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(quizzes, null, 2));
  const downloadAnchor = document.createElement('a');
  downloadAnchor.setAttribute('href', dataStr);
  downloadAnchor.setAttribute('download', `eduzone-backup-semua-kuis-${new Date().toISOString().slice(0, 10)}.json`);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
}

// API Server Integration
export async function fetchServerQuizzes(): Promise<QuizSet[]> {
  try {
    const res = await fetch('/api/quizzes');
    if (!res.ok) return [];
    const json = await res.json();
    return Array.isArray(json.data) ? json.data : [];
  } catch (err) {
    console.warn('Could not fetch quizzes from server:', err);
    return [];
  }
}

export async function saveQuizToServer(quiz: QuizSet): Promise<boolean> {
  try {
    const res = await fetch('/api/quizzes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(quiz),
    });
    return res.ok;
  } catch (err) {
    console.warn('Could not save quiz to server:', err);
    return false;
  }
}

export async function syncCustomQuizzesToServer(quizzes: QuizSet[]): Promise<QuizSet[]> {
  try {
    const res = await fetch('/api/quizzes/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ quizzes }),
    });
    if (!res.ok) return quizzes;
    const json = await res.json();
    return Array.isArray(json.data) ? json.data : quizzes;
  } catch (err) {
    console.warn('Could not sync quizzes with server:', err);
    return quizzes;
  }
}

export async function deleteServerQuiz(id: string): Promise<boolean> {
  try {
    const res = await fetch(`/api/quizzes/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
    return res.ok;
  } catch (err) {
    console.warn('Could not delete quiz from server:', err);
    return false;
  }
}
