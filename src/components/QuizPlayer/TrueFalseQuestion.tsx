import React from 'react';
import { Question } from '../../types';
import { CheckCircle2, XCircle } from 'lucide-react';

interface Props {
  question: Question;
  selectedAnswer: string | null;
  isAnswerSubmitted: boolean;
  onSelectAnswer: (answer: string) => void;
  disabled: boolean;
}

export const TrueFalseQuestion: React.FC<Props> = ({
  question,
  selectedAnswer,
  isAnswerSubmitted,
  onSelectAnswer,
  disabled,
}) => {
  const isActualTrue = question.isTrue ?? (question.correctAnswer.toLowerCase() === 'benar');

  const getButtonState = (val: 'Benar' | 'Salah') => {
    const isSelected = selectedAnswer === val;
    const isThisCorrect = val === 'Benar' ? isActualTrue : !isActualTrue;

    if (!isAnswerSubmitted) {
      return {
        isSelected,
        isCorrect: false,
        isWrong: false,
      };
    }

    return {
      isSelected,
      isCorrect: isThisCorrect,
      isWrong: isSelected && !isThisCorrect,
    };
  };

  const trueState = getButtonState('Benar');
  const falseState = getButtonState('Salah');

  return (
    <div className="w-full">
      <div className="text-center mb-4">
        <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
          Format: Tentukan Benar atau Salah
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6 w-full max-w-2xl mx-auto">
        {/* Tombol BENAR */}
        <button
          type="button"
          disabled={disabled}
          onClick={() => onSelectAnswer('Benar')}
          className={`btn-3d flex flex-col items-center justify-center p-6 md:p-8 rounded-3xl border-b-4 transition-all duration-150 cursor-pointer disabled:cursor-default relative ${
            isAnswerSubmitted
              ? trueState.isCorrect
                ? 'bg-emerald-600 border-emerald-800 text-white ring-4 ring-emerald-300 shadow-xl shadow-emerald-950/40'
                : trueState.isWrong
                ? 'bg-rose-700 border-rose-900 text-white opacity-85'
                : 'bg-slate-800 border-slate-900 text-slate-500 opacity-40'
              : trueState.isSelected
              ? 'bg-emerald-600 border-emerald-700 ring-4 ring-emerald-300 text-white translate-y-1'
              : 'bg-emerald-500 hover:bg-emerald-600 border-emerald-700 text-white shadow-lg shadow-emerald-900/30'
          }`}
        >
          <CheckCircle2 className="w-16 h-16 md:w-20 md:h-20 mb-3 drop-shadow" />
          <span className="text-2xl md:text-3xl font-black uppercase tracking-wider">
            BENAR
          </span>
          <span className="text-xs font-semibold mt-1 text-emerald-100 opacity-80">
            [Pilihan 1 / Tekan B]
          </span>
        </button>

        {/* Tombol SALAH */}
        <button
          type="button"
          disabled={disabled}
          onClick={() => onSelectAnswer('Salah')}
          className={`btn-3d flex flex-col items-center justify-center p-6 md:p-8 rounded-3xl border-b-4 transition-all duration-150 cursor-pointer disabled:cursor-default relative ${
            isAnswerSubmitted
              ? falseState.isCorrect
                ? 'bg-emerald-600 border-emerald-800 text-white ring-4 ring-emerald-300 shadow-xl shadow-emerald-950/40'
                : falseState.isWrong
                ? 'bg-rose-700 border-rose-900 text-white opacity-85'
                : 'bg-slate-800 border-slate-900 text-slate-500 opacity-40'
              : falseState.isSelected
              ? 'bg-rose-600 border-rose-700 ring-4 ring-rose-300 text-white translate-y-1'
              : 'bg-rose-500 hover:bg-rose-600 border-rose-700 text-white shadow-lg shadow-rose-900/30'
          }`}
        >
          <XCircle className="w-16 h-16 md:w-20 md:h-20 mb-3 drop-shadow" />
          <span className="text-2xl md:text-3xl font-black uppercase tracking-wider">
            SALAH
          </span>
          <span className="text-xs font-semibold mt-1 text-rose-100 opacity-80">
            [Pilihan 2 / Tekan S]
          </span>
        </button>
      </div>
    </div>
  );
};
