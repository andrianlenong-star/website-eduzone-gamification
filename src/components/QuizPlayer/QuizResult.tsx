import React, { useEffect } from 'react';
import { QuizSet, AnswerRecord } from '../../types';
import { Trophy, Star, RotateCcw, ArrowLeft, CheckCircle2, XCircle, Share2, Award, BookOpen } from 'lucide-react';
import confetti from 'canvas-confetti';
import { sounds } from '../../utils/audio';

interface Props {
  quizSet: QuizSet;
  records: AnswerRecord[];
  totalScore: number;
  maxStreak: number;
  onRestart: () => void;
  onBack: () => void;
  onOpenWorksheet: () => void;
}

export const QuizResult: React.FC<Props> = ({
  quizSet,
  records,
  totalScore,
  maxStreak,
  onRestart,
  onBack,
  onOpenWorksheet,
}) => {
  const correctCount = records.filter((r) => r.isCorrect).length;
  const totalCount = records.length;
  const accuracy = Math.round((correctCount / totalCount) * 100) || 0;

  useEffect(() => {
    sounds.playWin();
    if (accuracy >= 60) {
      try {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
        });
      } catch (e) {}
    }
  }, []);

  const handleShare = () => {
    const text = `Saya berhasil meraih skor ${totalScore} (Akurasi ${accuracy}%) pada kuis "${quizSet.title}" di Edu Zone! Ayo uji kemampuanmu!`;
    if (navigator.share) {
      navigator.share({ title: 'Skor Edu Zone', text }).catch(() => {});
    } else {
      navigator.clipboard.writeText(text);
      alert('Teks skor berhasil disalin ke clipboard!');
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto py-6 px-4 space-y-8 animate-in fade-in zoom-in-95 duration-200">
      {/* Trophy & Score Header */}
      <div className="relative overflow-hidden bg-gradient-to-b from-indigo-900/80 via-slate-900 to-slate-900 border-2 border-indigo-500/40 rounded-3xl p-6 md:p-10 text-center shadow-2xl">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-40 bg-indigo-500/10 blur-3xl pointer-events-none" />

        <div className="inline-flex items-center justify-center w-24 h-24 md:w-28 md:h-28 rounded-3xl bg-gradient-to-tr from-amber-500 to-yellow-300 text-slate-950 shadow-xl shadow-amber-500/30 mb-4 animate-bounce">
          <Trophy className="w-14 h-14 md:w-16 md:h-16" />
        </div>

        <h1 className="text-3xl md:text-5xl font-extrabold text-white mb-2">
          {accuracy >= 80 ? 'Luar Biasa, Juara!' : accuracy >= 50 ? 'Bagus Sekali!' : 'Terus Semangat Belajar!'}
        </h1>
        <p className="text-slate-300 text-sm md:text-base max-w-lg mx-auto">
          Kamu telah menyelesaikan paket soal <strong className="text-white font-semibold">{quizSet.title}</strong>
        </p>

        {/* Big Score Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mt-8">
          <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700/80">
            <span className="text-xs uppercase font-extrabold text-slate-400 block mb-1">
              Total Skor
            </span>
            <span className="text-2xl md:text-3xl font-black text-amber-400">
              {totalScore.toLocaleString('id-ID')}
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700/80">
            <span className="text-xs uppercase font-extrabold text-slate-400 block mb-1">
              Akurasi
            </span>
            <span className="text-2xl md:text-3xl font-black text-emerald-400">
              {accuracy}%
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700/80">
            <span className="text-xs uppercase font-extrabold text-slate-400 block mb-1">
              Benar / Total
            </span>
            <span className="text-2xl md:text-3xl font-black text-cyan-400">
              {correctCount} / {totalCount}
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700/80">
            <span className="text-xs uppercase font-extrabold text-slate-400 block mb-1">
              Streak Tertinggi
            </span>
            <span className="text-2xl md:text-3xl font-black text-rose-400">
              {maxStreak}x 🔥
            </span>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-3 mt-8">
          <button
            type="button"
            onClick={onRestart}
            className="btn-3d px-6 py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-2xl flex items-center gap-2 shadow-lg shadow-indigo-900/40 cursor-pointer"
          >
            <RotateCcw className="w-5 h-5" />
            <span>Mainkan Lagi</span>
          </button>

          <button
            type="button"
            onClick={handleShare}
            className="btn-3d px-6 py-3.5 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-2xl flex items-center gap-2 border border-slate-700 cursor-pointer"
          >
            <Share2 className="w-5 h-5" />
            <span>Bagikan Hasil</span>
          </button>

          <button
            type="button"
            onClick={onOpenWorksheet}
            className="btn-3d px-6 py-3.5 bg-emerald-700 hover:bg-emerald-600 text-white font-bold rounded-2xl flex items-center gap-2 border border-emerald-600/50 cursor-pointer"
          >
            <BookOpen className="w-5 h-5" />
            <span>Cetak Lembar LKS</span>
          </button>

          <button
            type="button"
            onClick={onBack}
            className="btn-3d px-6 py-3.5 bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white font-bold rounded-2xl flex items-center gap-2 cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Kembali ke Beranda</span>
          </button>
        </div>
      </div>

      {/* Review All Questions with Detailed Pembahasan */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-xl md:text-2xl font-black text-white flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-indigo-400" />
            <span>Pembahasan & Evaluasi Soal</span>
          </h2>
          <span className="text-xs text-slate-400">
            Pelajari setiap soal untuk memperdalam pemahamanmu
          </span>
        </div>

        <div className="space-y-3.5">
          {records.map((rec, idx) => {
            const formatBadge = {
              multiple_choice: { label: 'Pilihan Ganda', bg: 'bg-blue-500/20 text-blue-300 border-blue-500/30' },
              true_false: { label: 'Benar / Salah', bg: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' },
              fill_blank: { label: 'Isian Singkat', bg: 'bg-violet-500/20 text-violet-300 border-violet-500/30' },
              matching: { label: 'Menjodohkan', bg: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30' },
            }[rec.question.type];

            return (
              <div
                key={rec.questionId || idx}
                className={`p-5 rounded-2xl border transition-all ${
                  rec.isCorrect
                    ? 'bg-slate-900/80 border-emerald-500/40 hover:border-emerald-500/70'
                    : 'bg-slate-900/80 border-rose-500/40 hover:border-rose-500/70'
                }`}
              >
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex items-center gap-2">
                    <span className="w-7 h-7 rounded-lg bg-slate-800 flex items-center justify-center text-xs font-bold text-slate-300">
                      #{idx + 1}
                    </span>
                    <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold border ${formatBadge.bg}`}>
                      {formatBadge.label}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {rec.isCorrect ? (
                      <span className="flex items-center gap-1 text-xs font-bold text-emerald-400 bg-emerald-950/40 px-2.5 py-1 rounded-full border border-emerald-500/30">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Benar (+{rec.pointsEarned})</span>
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-xs font-bold text-rose-400 bg-rose-950/40 px-2.5 py-1 rounded-full border border-rose-500/30">
                        <XCircle className="w-4 h-4" />
                        <span>Kurang Tepat</span>
                      </span>
                    )}
                  </div>
                </div>

                <h3 className="text-base md:text-lg font-bold text-white mb-3">
                  {rec.question.question}
                </h3>

                {/* Show Answers */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs md:text-sm mb-3">
                  <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60">
                    <span className="text-slate-400 block text-xs mb-0.5">Jawaban Kamu:</span>
                    <span className={`font-semibold ${rec.isCorrect ? 'text-emerald-300' : 'text-rose-300'}`}>
                      {rec.userAnswer || '(Tidak dijawab)'}
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-emerald-950/20 border border-emerald-500/30">
                    <span className="text-emerald-400 block text-xs mb-0.5">Kunci Jawaban:</span>
                    <span className="font-semibold text-emerald-200">
                      {rec.question.correctAnswer}
                    </span>
                  </div>
                </div>

                {/* Matching Pairs detailed breakdown if matching */}
                {rec.question.type === 'matching' && rec.question.matchingPairs && (
                  <div className="mb-3 p-3 rounded-xl bg-slate-800/40 border border-slate-700 text-xs">
                    <span className="text-slate-400 font-bold block mb-1">Pasangan yang Benar:</span>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-1.5">
                      {rec.question.matchingPairs.map((pair, pIdx) => (
                        <div key={pIdx} className="flex items-center gap-1 text-slate-300">
                          <strong className="text-cyan-300">{pair.left}</strong>
                          <span className="text-slate-500">↔</span>
                          <span className="text-slate-200">{pair.right}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* In-depth Pembahasan */}
                <div className="p-3.5 rounded-xl bg-indigo-950/30 border border-indigo-500/30 text-xs md:text-sm text-indigo-200/90 leading-relaxed">
                  <strong className="text-indigo-300 font-bold block mb-1 flex items-center gap-1.5">
                    <Award className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Pembahasan Lengkap:</span>
                  </strong>
                  <p>{rec.question.explanation}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
