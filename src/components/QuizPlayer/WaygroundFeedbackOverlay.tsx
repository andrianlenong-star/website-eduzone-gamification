import React, { useEffect, useState } from 'react';
import { Question } from '../../types';
import { sounds } from '../../utils/audio';
import {
  CheckCircle2,
  XCircle,
  Flame,
  Zap,
  ArrowRight,
  Sparkles,
  BookOpen,
  Award,
  KeyRound,
} from 'lucide-react';

interface Props {
  isCorrect: boolean;
  question: Question;
  userAnswer: string;
  pointsEarned: number;
  streak: number;
  speedBonus: number;
  currentRank: number;
  onNext: () => void;
  onOpenReveal: () => void;
}

const PRAISE_TITLES = [
  'LUAR BIASA! 🌟',
  'ON FIRE! 🔥',
  'SUPERB! ⚡',
  'UNSTOPPABLE! 🚀',
  'GENIUS! 🧠',
  'MANTAP SEKALI! 🎯',
  'SEMPURNA! 🏆',
];

const ENCOURAGING_TITLES = [
  'JANGAN MENYERAH! 💪',
  'HAMPIR BENAR! 🎯',
  'TETAP SEMANGAT! 🌟',
  'PELAJARI KUNCI INI! 💡',
  'FOKUS KE DEPAN! 🚀',
];

export const WaygroundFeedbackOverlay: React.FC<Props> = ({
  isCorrect,
  question,
  userAnswer,
  pointsEarned,
  streak,
  speedBonus,
  currentRank,
  onNext,
  onOpenReveal,
}) => {
  const [title] = useState(() => {
    const list = isCorrect ? PRAISE_TITLES : ENCOURAGING_TITLES;
    return list[Math.floor(Math.random() * list.length)];
  });

  // Auto focus / listen to keyboard Enter or Space to quickly advance
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.code === 'Space') {
        e.preventDefault();
        onNext();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onNext]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in zoom-in-95 duration-200">
      <div
        className={`w-full max-w-lg rounded-3xl p-6 sm:p-8 shadow-2xl border-2 text-center space-y-6 relative overflow-hidden ${
          isCorrect
            ? 'bg-gradient-to-b from-emerald-950 via-slate-900 to-slate-900 border-emerald-500/60 shadow-emerald-950/60'
            : 'bg-gradient-to-b from-rose-950 via-slate-900 to-slate-900 border-rose-500/60 shadow-rose-950/60'
        }`}
      >
        {/* Glow Effects */}
        <div
          className={`absolute -top-24 left-1/2 -translate-x-1/2 w-64 h-64 rounded-full blur-3xl pointer-events-none ${
            isCorrect ? 'bg-emerald-500/20' : 'bg-rose-500/20'
          }`}
        />

        {/* Big Animated Icon */}
        <div className="flex justify-center">
          <div
            className={`w-20 h-20 rounded-3xl flex items-center justify-center shadow-xl border-2 animate-bounce duration-700 ${
              isCorrect
                ? 'bg-emerald-500 text-white border-emerald-300 shadow-emerald-500/40'
                : 'bg-rose-500 text-white border-rose-300 shadow-rose-500/40'
            }`}
          >
            {isCorrect ? (
              <CheckCircle2 className="w-12 h-12 stroke-[2.5]" />
            ) : (
              <XCircle className="w-12 h-12 stroke-[2.5]" />
            )}
          </div>
        </div>

        {/* Banner Title */}
        <div className="space-y-1">
          <h2
            className={`text-2xl sm:text-3xl font-black tracking-tight ${
              isCorrect ? 'text-emerald-300' : 'text-rose-300'
            }`}
          >
            {title}
          </h2>

          <p className="text-xs sm:text-sm text-slate-300 font-bold">
            {isCorrect
              ? `Hebat! Jawabanmu tepat dan cepat!`
              : `Pertanyaan ini belum tepat, tetap optimis!`}
          </p>
        </div>

        {/* Breakdown Card if Correct */}
        {isCorrect ? (
          <div className="p-4 rounded-2xl bg-slate-800/90 border border-emerald-500/40 space-y-2 text-left">
            <div className="flex items-center justify-between text-xs font-black text-slate-300">
              <span>Perolehan Poin Kuis:</span>
              <span className="text-emerald-400 text-sm">+{pointsEarned} Poin</span>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center pt-1 text-xs">
              <div className="p-2 rounded-xl bg-slate-900/80 border border-slate-700">
                <span className="text-[10px] text-slate-400 block font-bold">Dasar</span>
                <span className="font-extrabold text-white">+1.000</span>
              </div>
              <div className="p-2 rounded-xl bg-slate-900/80 border border-slate-700">
                <span className="text-[10px] text-sky-400 block font-bold">Kecepatan</span>
                <span className="font-extrabold text-sky-300">+{speedBonus}</span>
              </div>
              <div className="p-2 rounded-xl bg-slate-900/80 border border-slate-700">
                <span className="text-[10px] text-amber-400 block font-bold">Streak</span>
                <span className="font-extrabold text-amber-300">🔥 x{Math.max(1, streak)}</span>
              </div>
            </div>

            {/* Rank Notification */}
            <div className="pt-1 flex items-center justify-center gap-1.5 text-xs font-extrabold text-indigo-300">
              <Award className="w-4 h-4 text-amber-400" />
              <span>Kamu berada di Peringkat #{currentRank} di Kelas!</span>
            </div>
          </div>
        ) : (
          /* Incorrect answer breakdown & key display */
          <div className="p-4 rounded-2xl bg-slate-800/90 border border-rose-500/40 space-y-3 text-left">
            <div className="flex items-center justify-between text-xs font-bold">
              <span className="text-slate-400">Jawaban Kamu:</span>
              <span className="text-rose-400 font-extrabold">{userAnswer || '(Tidak dijawab)'}</span>
            </div>

            <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/40">
              <span className="text-[10px] uppercase font-black text-emerald-400 block mb-0.5">
                Kunci Jawaban Benar:
              </span>
              <span className="text-sm font-black text-emerald-200">
                {question.correctAnswer}
              </span>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            type="button"
            onClick={onOpenReveal}
            className="w-full sm:w-auto px-4 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-amber-300 hover:text-white font-extrabold text-xs flex items-center justify-center gap-2 border border-amber-500/40 cursor-pointer transition-all"
          >
            <KeyRound className="w-4 h-4 text-amber-400" />
            <span>Buka Kunci & Pembahasan</span>
          </button>

          <button
            type="button"
            onClick={onNext}
            className="w-full sm:flex-1 btn-3d py-3.5 px-6 rounded-2xl bg-gradient-to-r from-indigo-600 via-sky-600 to-indigo-600 hover:from-indigo-500 hover:to-sky-500 text-white font-black text-sm flex items-center justify-center gap-2 shadow-xl shadow-indigo-950/60 cursor-pointer active:scale-95 border border-indigo-400/30"
          >
            <span>Lanjut Soal Berikutnya (Enter)</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
