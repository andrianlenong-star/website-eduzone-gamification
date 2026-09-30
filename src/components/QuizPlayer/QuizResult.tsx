import React, { useState, useEffect } from 'react';
import { QuizSet, AnswerRecord } from '../../types';
import {
  Trophy,
  Star,
  RotateCcw,
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Share2,
  Award,
  BookOpen,
  Sparkles,
  Flame,
  Layers,
  ChevronLeft,
  ChevronRight,
  Eye,
  Crown,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { sounds } from '../../utils/audio';

interface Props {
  quizSet: QuizSet;
  records: AnswerRecord[];
  totalScore: number;
  maxStreak: number;
  playerName?: string;
  playerAvatar?: string;
  onRestart: () => void;
  onBack: () => void;
  onOpenWorksheet: () => void;
}

export const QuizResult: React.FC<Props> = ({
  quizSet,
  records,
  totalScore,
  maxStreak,
  playerName = 'Bintang Juara',
  playerAvatar = '🚀',
  onRestart,
  onBack,
  onOpenWorksheet,
}) => {
  const [viewMode, setViewMode] = useState<'list' | 'flashcard'>('list');
  const [flashcardIdx, setFlashcardIdx] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  const correctCount = records.filter((r) => r.isCorrect).length;
  const totalCount = records.length;
  const accuracy = Math.round((correctCount / totalCount) * 100) || 0;

  // Rank determination
  const rank = accuracy >= 85 ? 1 : accuracy >= 65 ? 2 : accuracy >= 40 ? 3 : 4;

  useEffect(() => {
    sounds.playWin();
    try {
      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.55 },
      });
      setTimeout(() => {
        confetti({
          particleCount: 80,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
        });
        confetti({
          particleCount: 80,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
        });
      }, 400);
    } catch (e) {}
  }, [accuracy]);

  const handleShare = () => {
    const text = `Saya berhasil meraih Peringkat #${rank} dengan skor ${totalScore.toLocaleString('id-ID')} (Akurasi ${accuracy}%) pada kuis "${quizSet.title}" di Wayground Edu Zone! Ayo coba uji kemampuanmu!`;
    if (navigator.share) {
      navigator.share({ title: 'Skor Wayground', text }).catch(() => {});
    } else {
      navigator.clipboard.writeText(text);
      alert('Teks hasil kuis berhasil disalin!');
    }
  };

  const currentFlashcard = records[flashcardIdx];

  return (
    <div className="w-full max-w-4xl mx-auto py-6 px-4 space-y-8 animate-in fade-in zoom-in-95 duration-200">
      {/* Wayground 3D Podium & Celebration Header */}
      <div className="relative overflow-hidden bg-gradient-to-b from-indigo-950 via-slate-900 to-slate-900 border-2 border-indigo-500/50 rounded-3xl p-6 sm:p-10 text-center shadow-2xl space-y-6">
        {/* Glow decoration */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-md h-48 bg-gradient-to-b from-purple-500/20 to-transparent blur-3xl pointer-events-none" />

        {/* Podium Columns */}
        <div className="pt-2 pb-4">
          <div className="text-xs font-black uppercase tracking-widest text-amber-300 mb-6 flex items-center justify-center gap-1.5">
            <Crown className="w-4 h-4 text-amber-400" />
            <span>PAPAN PERINGKAT AKHIR KELAS</span>
          </div>

          <div className="flex items-end justify-center gap-3 sm:gap-6 max-w-lg mx-auto">
            {/* 2nd Place Column */}
            <div className="flex-1 flex flex-col items-center">
              <div className="w-12 h-12 rounded-2xl bg-slate-800 border border-slate-600 flex items-center justify-center text-2xl shadow-lg mb-2">
                {rank === 2 ? playerAvatar : '🦊'}
              </div>
              <span className="text-[11px] font-black text-slate-300 truncate max-w-[90px] block">
                {rank === 2 ? playerName : 'Ninja Rubah'}
              </span>
              <span className="text-[10px] text-slate-400">
                {rank === 2 ? totalScore.toLocaleString() : (totalScore * 0.85).toFixed(0)}
              </span>

              <div className="w-full h-24 rounded-t-2xl bg-gradient-to-b from-slate-400 to-slate-600 flex flex-col items-center justify-center text-white shadow-lg border-t-2 border-slate-300">
                <span className="text-2xl font-black">2</span>
                <span className="text-[10px] uppercase font-bold tracking-wider opacity-80">Perak</span>
              </div>
            </div>

            {/* 1st Place Column (Champion) */}
            <div className="flex-1 flex flex-col items-center -mt-6">
              <div className="relative mb-2">
                <Crown className="w-7 h-7 text-amber-300 absolute -top-5 left-1/2 -translate-x-1/2 animate-bounce" />
                <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-amber-400 to-yellow-300 text-slate-950 flex items-center justify-center text-3xl shadow-xl shadow-amber-500/40 border-2 border-yellow-200">
                  {rank === 1 ? playerAvatar : '🦁'}
                </div>
              </div>

              <span className="text-xs font-black text-amber-300 truncate max-w-[110px] block">
                {rank === 1 ? playerName : 'Singa Juara'}
              </span>
              <span className="text-[11px] font-extrabold text-white">
                {rank === 1 ? totalScore.toLocaleString() : Math.max(totalScore, 14200).toLocaleString()}
              </span>

              <div className="w-full h-36 rounded-t-2xl bg-gradient-to-b from-amber-500 via-yellow-500 to-amber-600 flex flex-col items-center justify-center text-slate-950 shadow-2xl border-t-2 border-yellow-200">
                <Trophy className="w-8 h-8 fill-current mb-0.5" />
                <span className="text-3xl font-black leading-none">1</span>
                <span className="text-[11px] uppercase font-black tracking-wider opacity-90">Juara 1</span>
              </div>
            </div>

            {/* 3rd Place Column */}
            <div className="flex-1 flex flex-col items-center">
              <div className="w-12 h-12 rounded-2xl bg-slate-800 border border-slate-600 flex items-center justify-center text-2xl shadow-lg mb-2">
                {rank === 3 ? playerAvatar : '🐼'}
              </div>
              <span className="text-[11px] font-black text-slate-300 truncate max-w-[90px] block">
                {rank === 3 ? playerName : 'Super Panda'}
              </span>
              <span className="text-[10px] text-slate-400">
                {rank === 3 ? totalScore.toLocaleString() : (totalScore * 0.7).toFixed(0)}
              </span>

              <div className="w-full h-16 rounded-t-2xl bg-gradient-to-b from-amber-700 to-amber-900 flex flex-col items-center justify-center text-amber-200 shadow-md border-t-2 border-amber-600">
                <span className="text-xl font-black">3</span>
                <span className="text-[10px] uppercase font-bold tracking-wider opacity-80">Perunggu</span>
              </div>
            </div>
          </div>
        </div>

        {/* Title celebration text */}
        <div>
          <h1 className="text-3xl sm:text-4xl font-black text-white">
            {accuracy >= 80 ? 'Luar Biasa, Kamu Juara! 🏆' : accuracy >= 50 ? 'Bagus Sekali! 🌟' : 'Terus Semangat Belajar! 💪'}
          </h1>
          <p className="text-slate-300 text-xs sm:text-sm mt-1 max-w-md mx-auto">
            Kamu menyelesaikan kuis <strong className="text-white">{quizSet.title}</strong> di posisi Peringkat #{rank}!
          </p>
        </div>

        {/* Big Score Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700/80">
            <span className="text-xs uppercase font-extrabold text-slate-400 block mb-1">
              Total Skor
            </span>
            <span className="text-2xl sm:text-3xl font-black text-amber-400">
              {totalScore.toLocaleString('id-ID')}
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700/80">
            <span className="text-xs uppercase font-extrabold text-slate-400 block mb-1">
              Akurasi Jawaban
            </span>
            <span className="text-2xl sm:text-3xl font-black text-emerald-400">
              {accuracy}%
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700/80">
            <span className="text-xs uppercase font-extrabold text-slate-400 block mb-1">
              Benar / Total
            </span>
            <span className="text-2xl sm:text-3xl font-black text-cyan-400">
              {correctCount} / {totalCount}
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700/80">
            <span className="text-xs uppercase font-extrabold text-slate-400 block mb-1">
              Streak Tertinggi
            </span>
            <span className="text-2xl sm:text-3xl font-black text-rose-400">
              {maxStreak}x 🔥
            </span>
          </div>
        </div>

        {/* Main Action Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <button
            type="button"
            onClick={onRestart}
            className="btn-3d px-6 py-3.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-black rounded-2xl flex items-center gap-2 shadow-xl shadow-indigo-950/60 cursor-pointer"
          >
            <RotateCcw className="w-5 h-5" />
            <span>Mainkan Lagi</span>
          </button>

          <button
            type="button"
            onClick={handleShare}
            className="btn-3d px-5 py-3.5 bg-slate-800 hover:bg-slate-750 text-white font-extrabold rounded-2xl flex items-center gap-2 border border-slate-700 cursor-pointer"
          >
            <Share2 className="w-5 h-5 text-indigo-400" />
            <span>Bagikan Hasil</span>
          </button>

          <button
            type="button"
            onClick={onOpenWorksheet}
            className="btn-3d px-5 py-3.5 bg-emerald-700 hover:bg-emerald-600 text-white font-extrabold rounded-2xl flex items-center gap-2 border border-emerald-600/50 cursor-pointer"
          >
            <BookOpen className="w-5 h-5" />
            <span>Cetak Lembar LKS</span>
          </button>

          <button
            type="button"
            onClick={onBack}
            className="btn-3d px-5 py-3.5 bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white font-bold rounded-2xl flex items-center gap-2 cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Kembali ke Beranda</span>
          </button>
        </div>
      </div>

      {/* Review Section with Toggle: List vs Flashcards */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-1">
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
              <BookOpen className="w-6 h-6 text-indigo-400" />
              <span>Tinjau Pembahasan & Materi</span>
            </h2>
            <p className="text-xs text-slate-400">
              Pelajari kembali setiap butir pertanyaan untuk memperdalam pemahamanmu.
            </p>
          </div>

          {/* Toggle View Mode */}
          <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800 self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'list' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Daftar Soal
            </button>
            <button
              type="button"
              onClick={() => {
                setViewMode('flashcard');
                setIsFlipped(false);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                viewMode === 'flashcard' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Mode Flashcard</span>
            </button>
          </div>
        </div>

        {/* 1. Flashcard Mode (Wayground Study Tool) */}
        {viewMode === 'flashcard' && currentFlashcard && (
          <div className="p-6 rounded-3xl bg-slate-900 border-2 border-indigo-500/40 space-y-5 text-center shadow-xl">
            <div className="flex items-center justify-between text-xs font-extrabold text-slate-400">
              <span>Kartu Flashcard {flashcardIdx + 1} dari {records.length}</span>
              <span className={`px-2.5 py-0.5 rounded-full ${currentFlashcard.isCorrect ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'}`}>
                {currentFlashcard.isCorrect ? 'Jawaban Benar' : 'Sempat Salah'}
              </span>
            </div>

            {/* Flashcard Body (Click to Flip) */}
            <div
              onClick={() => {
                setIsFlipped((prev) => !prev);
                sounds.playClick();
              }}
              className="p-8 min-h-[220px] rounded-2xl bg-slate-800/80 border-2 border-indigo-500/30 flex flex-col items-center justify-center cursor-pointer transition-all hover:border-indigo-400 select-none space-y-3"
            >
              {!isFlipped ? (
                <>
                  <span className="text-xs uppercase font-black text-indigo-400 tracking-wider">
                    PERTANYAAN (KLIK UNTUK BUKA KUNCI & PEMBAHASAN)
                  </span>
                  <p className="text-base sm:text-xl font-black text-white leading-relaxed max-w-lg">
                    {currentFlashcard.question.question}
                  </p>
                  <span className="text-xs text-slate-400 flex items-center gap-1">
                    <Eye className="w-3.5 h-3.5" />
                    <span>Ketuk untuk membalik kartu</span>
                  </span>
                </>
              ) : (
                <>
                  <span className="text-xs uppercase font-black text-emerald-400 tracking-wider">
                    KUNCI JAWABAN RESMI & PEMBAHASAN
                  </span>
                  <div className="p-3 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-200 font-black text-lg">
                    {currentFlashcard.question.correctAnswer}
                  </div>
                  <p className="text-xs sm:text-sm text-slate-300 max-w-lg leading-relaxed">
                    {currentFlashcard.question.explanation || 'Pembahasan materi untuk memperkuat konsep.'}
                  </p>
                </>
              )}
            </div>

            {/* Navigation buttons */}
            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                disabled={flashcardIdx === 0}
                onClick={() => {
                  setFlashcardIdx((prev) => prev - 1);
                  setIsFlipped(false);
                }}
                className="px-4 py-2 rounded-xl bg-slate-800 disabled:opacity-20 text-xs font-bold text-white flex items-center gap-1 cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Kartu Sebelumnya</span>
              </button>

              <button
                type="button"
                disabled={flashcardIdx === records.length - 1}
                onClick={() => {
                  setFlashcardIdx((prev) => prev + 1);
                  setIsFlipped(false);
                }}
                className="px-4 py-2 rounded-xl bg-indigo-600 disabled:opacity-20 text-xs font-bold text-white flex items-center gap-1 cursor-pointer shadow-md"
              >
                <span>Kartu Berikutnya</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* 2. List Mode (All Questions) */}
        {viewMode === 'list' && (
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
        )}
      </div>
    </div>
  );
};
