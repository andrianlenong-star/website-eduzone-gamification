import { QuizSet } from '../types';

export interface QuestionBreakdown {
  total: number;
  multipleChoice: number;
  trueFalse: number;
  fillBlank: number;
  matching: number;
  summaryText: string;
  detailedText: string;
  estimatedMinutes: number;
  badges: { label: string; count: number; color: string }[];
}

export function getQuizQuestionBreakdown(quiz: QuizSet): QuestionBreakdown {
  let multipleChoice = 0;
  let trueFalse = 0;
  let fillBlank = 0;
  let matching = 0;

  if (Array.isArray(quiz.questions)) {
    quiz.questions.forEach((q) => {
      if (q.type === 'multiple_choice') multipleChoice++;
      else if (q.type === 'true_false') trueFalse++;
      else if (q.type === 'fill_blank') fillBlank++;
      else if (q.type === 'matching') matching++;
    });
  }

  const total = quiz.questions?.length || 0;

  const parts: string[] = [];
  if (multipleChoice > 0) parts.push(`${multipleChoice} Pilgan`);
  if (trueFalse > 0) parts.push(`${trueFalse} Benar/Salah`);
  if (fillBlank > 0) parts.push(`${fillBlank} Isian`);
  if (matching > 0) parts.push(`${matching} Menjodohkan`);

  const summaryText = parts.length > 0 ? parts.join(' • ') : 'Belum ada soal';
  const detailedText =
    parts.length > 0
      ? `Total ${total} Soal: ${parts.join(', ')}`
      : 'Paket kuis belum memiliki butir soal.';

  const estimatedMinutes = Math.max(3, Math.ceil(total * 1.5));

  const badges: { label: string; count: number; color: string }[] = [];
  if (multipleChoice > 0) {
    badges.push({
      label: 'Pilgan',
      count: multipleChoice,
      color: 'bg-blue-500/15 text-blue-300 border-blue-500/30',
    });
  }
  if (trueFalse > 0) {
    badges.push({
      label: 'Benar/Salah',
      count: trueFalse,
      color: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
    });
  }
  if (fillBlank > 0) {
    badges.push({
      label: 'Isian',
      count: fillBlank,
      color: 'bg-violet-500/15 text-violet-300 border-violet-500/30',
    });
  }
  if (matching > 0) {
    badges.push({
      label: 'Menjodohkan',
      count: matching,
      color: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
    });
  }

  return {
    total,
    multipleChoice,
    trueFalse,
    fillBlank,
    matching,
    summaryText,
    detailedText,
    estimatedMinutes,
    badges,
  };
}
