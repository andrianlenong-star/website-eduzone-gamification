import React, { useState, useEffect, useRef } from 'react';
import { Question } from '../../types';
import { Send, Lightbulb, Check, X } from 'lucide-react';

interface Props {
  question: Question;
  selectedAnswer: string | null;
  isAnswerSubmitted: boolean;
  onSubmitAnswer: (answer: string) => void;
  disabled: boolean;
}

export const FillBlankQuestion: React.FC<Props> = ({
  question,
  selectedAnswer,
  isAnswerSubmitted,
  onSubmitAnswer,
  disabled,
}) => {
  const [inputVal, setInputVal] = useState('');
  const [revealedChars, setRevealedChars] = useState<number>(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setInputVal(selectedAnswer || '');
    setRevealedChars(0);
    if (!disabled && !isAnswerSubmitted) {
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [question.id, disabled, isAnswerSubmitted]);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (disabled || isAnswerSubmitted) return;
    if (inputVal.trim()) {
      onSubmitAnswer(inputVal.trim());
    }
  };

  const cleanAns = question.correctAnswer.trim().toLowerCase();
  const userAns = (selectedAnswer || inputVal).trim().toLowerCase();

  const acceptable = (question.acceptableAnswers || []).map((a) =>
    a.trim().toLowerCase()
  );
  acceptable.push(cleanAns);

  const isCorrect = isAnswerSubmitted && acceptable.includes(userAns);

  const handleRevealLetter = () => {
    if (revealedChars < question.correctAnswer.length) {
      setRevealedChars((prev) => prev + 1);
    }
  };

  const hintPrefix = question.correctAnswer.slice(0, revealedChars);

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="text-center mb-3">
        <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-violet-500/20 text-violet-300 border border-violet-500/30">
          Format: Isian Singkat (Ketik Jawaban Anda)
        </span>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="relative">
          <input
            ref={inputRef}
            type="text"
            disabled={disabled || isAnswerSubmitted}
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            placeholder="Ketik jawaban di sini lalu tekan Enter..."
            className={`w-full px-5 py-4 md:py-5 text-lg md:text-xl font-bold rounded-2xl border-2 transition-all outline-none ${
              isAnswerSubmitted
                ? isCorrect
                  ? 'bg-emerald-950/40 border-emerald-500 text-emerald-200'
                  : 'bg-rose-950/40 border-rose-500 text-rose-200'
                : 'bg-slate-800/90 border-indigo-500/50 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/20 text-white placeholder-slate-500'
            }`}
          />

          {!isAnswerSubmitted && (
            <button
              type="submit"
              disabled={disabled || !inputVal.trim()}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white font-bold rounded-xl flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <span>Kirim</span>
              <Send className="w-4 h-4" />
            </button>
          )}

          {isAnswerSubmitted && (
            <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center">
              {isCorrect ? (
                <div className="w-9 h-9 rounded-full bg-emerald-500 flex items-center justify-center text-white">
                  <Check className="w-6 h-6 stroke-[3]" />
                </div>
              ) : (
                <div className="w-9 h-9 rounded-full bg-rose-500 flex items-center justify-center text-white">
                  <X className="w-6 h-6 stroke-[3]" />
                </div>
              )}
            </div>
          )}
        </div>

        {/* Revealed letters hint helper */}
        {!isAnswerSubmitted && (
          <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-xs">
            <div className="text-slate-400">
              {revealedChars > 0 ? (
                <span>
                  Bocoran huruf awal:{' '}
                  <span className="font-mono font-bold text-amber-300 text-sm tracking-wider">
                    {hintPrefix}
                    {'_ '.repeat(Math.max(0, question.correctAnswer.length - revealedChars))}
                  </span>
                </span>
              ) : (
                <span>Ketik kata/angka jawaban yang tepat</span>
              )}
            </div>

            <button
              type="button"
              onClick={handleRevealLetter}
              disabled={revealedChars >= Math.min(3, question.correctAnswer.length)}
              className="flex items-center gap-1 text-amber-400 hover:text-amber-300 font-semibold px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/20 disabled:opacity-40 transition-colors cursor-pointer"
            >
              <Lightbulb className="w-3.5 h-3.5" />
              <span>Buka Huruf ({revealedChars}/3)</span>
            </button>
          </div>
        )}

        {/* Post-submission answer display */}
        {isAnswerSubmitted && (
          <div
            className={`p-4 rounded-xl border text-sm ${
              isCorrect
                ? 'bg-emerald-950/30 border-emerald-500/30 text-emerald-300'
                : 'bg-rose-950/30 border-rose-500/30 text-rose-300'
            }`}
          >
            <div className="font-bold flex items-center gap-2 mb-1">
              <span>{isCorrect ? 'Jawaban Anda Tepat!' : 'Jawaban Anda Kurang Tepat'}</span>
            </div>
            <div>
              Kunci Jawaban:{' '}
              <strong className="underline text-white font-mono text-base ml-1">
                {question.correctAnswer}
              </strong>
              {question.acceptableAnswers && question.acceptableAnswers.length > 1 && (
                <span className="text-xs text-slate-400 block mt-1">
                  Variasi yang diterima: {question.acceptableAnswers.join(', ')}
                </span>
              )}
            </div>
          </div>
        )}
      </form>
    </div>
  );
};
