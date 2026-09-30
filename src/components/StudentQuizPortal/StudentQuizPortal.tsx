import React, { useState } from 'react';
import { QuizSet, GameMode, PlayerProfile } from '../../types';
import { getQuizQuestionBreakdown } from '../../utils/quizStats';
import { sounds } from '../../utils/audio';
import { EduZoneLogo } from '../EduZoneLogo';
import {
  Play,
  Zap,
  RotateCcw,
  Sparkles,
  Grid,
  Swords,
  Printer,
  BookOpen,
  Clock,
  Award,
  CheckCircle2,
  HelpCircle,
  Volume2,
  VolumeX,
  Timer,
  TimerOff,
  User,
  ArrowRight,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

interface Props {
  quiz: QuizSet;
  onSelectGame: (quiz: QuizSet, mode: GameMode) => void;
  playerProfile: PlayerProfile;
  onOpenProfile: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
  timerEnabled: boolean;
  onToggleTimer: () => void;
  onExitStudentMode?: () => void;
}

export const StudentQuizPortal: React.FC<Props> = ({
  quiz,
  onSelectGame,
  playerProfile,
  onOpenProfile,
  soundEnabled,
  onToggleSound,
  timerEnabled,
  onToggleTimer,
  onExitStudentMode,
}) => {
  const [showPreviewQuestions, setShowPreviewQuestions] = useState(false);
  const breakdown = getQuizQuestionBreakdown(quiz);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      {/* Student View Navigation Header */}
      <header className="sticky top-0 z-40 bg-slate-900/95 border-b border-indigo-500/30 backdrop-blur-md px-4 sm:px-8 py-3.5 shadow-xl shadow-black/30">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <EduZoneLogo size="sm" showText={true} />
            <span className="hidden sm:inline-block px-2.5 py-1 rounded-full text-[11px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
              Tampilan Siswa
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Timer Toggle */}
            <button
              type="button"
              onClick={onToggleTimer}
              className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                timerEnabled
                  ? 'bg-slate-800 border-slate-700 text-amber-400'
                  : 'bg-emerald-950/40 border-emerald-500/40 text-emerald-400'
              }`}
              title={timerEnabled ? 'Timer Aktif' : 'Mode Santai (Tanpa Batas Waktu)'}
            >
              {timerEnabled ? (
                <>
                  <Timer className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Timer ON</span>
                </>
              ) : (
                <>
                  <TimerOff className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Santai</span>
                </>
              )}
            </button>

            {/* Sound Toggle */}
            <button
              type="button"
              onClick={onToggleSound}
              className="p-2 rounded-xl bg-slate-800 border border-slate-700 text-indigo-400 hover:text-white transition-all cursor-pointer"
              title={soundEnabled ? 'Matikan Suara' : 'Nyalakan Suara'}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>

            {/* Profile Avatar */}
            <button
              type="button"
              onClick={onOpenProfile}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-bold text-slate-200 cursor-pointer transition-all"
              title="Ganti Nama Siswa"
            >
              <span className="text-base leading-none">{playerProfile.avatar}</span>
              <span className="hidden sm:inline max-w-[100px] truncate">{playerProfile.name}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Student Portal Content */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-10 space-y-6">
        {/* Banner Notice */}
        <div className="p-4 rounded-2xl bg-indigo-950/40 border border-indigo-500/40 flex items-center justify-between gap-3 text-xs text-indigo-200">
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="w-5 h-5 text-indigo-400 shrink-0" />
            <span>
              <strong>Mode Pembelajaran Terarah:</strong> Halaman ini khusus menyajikan materi dan
              soal yang telah dibagikan oleh guru untuk Anda pelajari.
            </span>
          </div>
        </div>

        {/* Hero Card for the Shared Lesson */}
        <div className="relative overflow-hidden bg-slate-900 border-2 border-indigo-500/40 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-black bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                {quiz.category}
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-slate-800 text-slate-300 border border-slate-700">
                {quiz.targetClass || `Kelas ${quiz.grade}`}
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                Tingkat {quiz.difficulty}
              </span>
            </div>

            <div className="flex items-center gap-2 text-xs text-slate-400 font-bold">
              <Clock className="w-4 h-4 text-sky-400" />
              <span>Estimasi {breakdown.estimatedMinutes} Menit</span>
            </div>
          </div>

          <div>
            <h1 className="text-2xl sm:text-4xl font-black text-white leading-tight">
              {quiz.title}
            </h1>
            <p className="text-slate-300 text-sm sm:text-base mt-2 leading-relaxed max-w-3xl">
              {quiz.description}
            </p>
          </div>

          {/* Penjelasan Lengkap Jumlah & Format Soal */}
          <div className="p-4 sm:p-5 rounded-2xl bg-slate-800/80 border border-slate-700/80 space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <span className="text-xs font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-indigo-400" />
                <span>Rincian & Penjelasan Jumlah Soal:</span>
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-black bg-indigo-600 text-white shadow-sm">
                Total {breakdown.total} Butir Soal
              </span>
            </div>

            <p className="text-xs sm:text-sm text-slate-300 font-semibold leading-relaxed">
              {breakdown.detailedText}
            </p>

            {/* Format Pills */}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              {breakdown.badges.map((b, idx) => (
                <span
                  key={idx}
                  className={`px-3 py-1 rounded-xl text-xs font-extrabold border ${b.color}`}
                >
                  {b.label}: {b.count} Soal
                </span>
              ))}
              <span className="px-3 py-1 rounded-xl text-xs font-bold bg-slate-900 text-slate-400 border border-slate-700">
                Maks Nilai: 100 Poin
              </span>
            </div>
          </div>

          {/* Main Action Button to Start Immediate Quiz */}
          <button
            type="button"
            onClick={() => {
              sounds.playClick();
              onSelectGame(quiz, 'kuis-kilat');
            }}
            className="w-full btn-3d py-4 sm:py-5 px-6 rounded-2xl bg-gradient-to-r from-indigo-600 via-sky-600 to-indigo-600 hover:from-indigo-500 hover:to-sky-500 text-white font-black text-base sm:text-lg flex items-center justify-center gap-3 shadow-2xl shadow-indigo-950/60 cursor-pointer transition-all active:scale-[0.98] border border-indigo-400/40"
          >
            <Play className="w-6 h-6 fill-current" />
            <span>Mulai Kerjakan Kuis Sekarang</span>
            <ArrowRight className="w-5 h-5 ml-1" />
          </button>
        </div>

        {/* Pilihan Mode Belajar & Permainan Lainnya untuk Materi Ini */}
        <div className="space-y-4 pt-2">
          <div className="flex items-center justify-between">
            <h2 className="text-lg sm:text-xl font-black text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-400" />
              <span>Mode Pembelajaran Lainnya untuk Materi Ini</span>
            </h2>
            <span className="text-xs text-slate-400">Pilih gaya belajar favoritmu</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
            {/* Mode 1: Kuis Kilat */}
            <button
              type="button"
              onClick={() => {
                sounds.playClick();
                onSelectGame(quiz, 'kuis-kilat');
              }}
              className="p-4 rounded-2xl bg-slate-900 border border-indigo-500/30 hover:border-indigo-400 hover:bg-slate-850 flex items-start gap-3 transition-all text-left group cursor-pointer"
            >
              <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                <Zap className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-white group-hover:text-indigo-300">
                  Kuis Kilat
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Format utama dengan bantuan 50:50 & Buka Jawaban.
                </p>
              </div>
            </button>

            {/* Mode 2: Labirin Kata */}
            <button
              type="button"
              onClick={() => {
                sounds.playClick();
                onSelectGame(quiz, 'labirin-kata');
              }}
              className="p-4 rounded-2xl bg-slate-900 border border-slate-800 hover:border-violet-500/50 hover:bg-slate-850 flex items-start gap-3 transition-all text-left group cursor-pointer"
            >
              <div className="w-10 h-10 rounded-xl bg-violet-500/20 text-violet-400 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                <RotateCcw className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-white group-hover:text-violet-300">
                  Labirin Kata
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Susun huruf & temukan kosakata penting materi.
                </p>
              </div>
            </button>

            {/* Mode 3: Kartu Cocok */}
            <button
              type="button"
              onClick={() => {
                sounds.playClick();
                onSelectGame(quiz, 'kartu-cocok');
              }}
              className="p-4 rounded-2xl bg-slate-900 border border-slate-800 hover:border-emerald-500/50 hover:bg-slate-850 flex items-start gap-3 transition-all text-left group cursor-pointer"
            >
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                <Grid className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-white group-hover:text-emerald-300">
                  Kartu Cocok
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Latih daya ingat dan cocokkan konsep soal.
                </p>
              </div>
            </button>

            {/* Mode 4: Roda Putar */}
            <button
              type="button"
              onClick={() => {
                sounds.playClick();
                onSelectGame(quiz, 'roda-putar');
              }}
              className="p-4 rounded-2xl bg-slate-900 border border-slate-800 hover:border-amber-500/50 hover:bg-slate-850 flex items-start gap-3 transition-all text-left group cursor-pointer"
            >
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-white group-hover:text-amber-300">
                  Roda Putar
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Putar roda keberuntungan dan jawab acak.
                </p>
              </div>
            </button>

            {/* Mode 5: Duel Teman */}
            <button
              type="button"
              onClick={() => {
                sounds.playClick();
                onSelectGame(quiz, 'duel-teman');
              }}
              className="p-4 rounded-2xl bg-slate-900 border border-slate-800 hover:border-rose-500/50 hover:bg-slate-850 flex items-start gap-3 transition-all text-left group cursor-pointer"
            >
              <div className="w-10 h-10 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                <Swords className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-white group-hover:text-rose-300">
                  Duel 2 Pemain
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Tanding seru di 1 layar bersama temanmu.
                </p>
              </div>
            </button>

            {/* Mode 6: Cetak LKS */}
            <button
              type="button"
              onClick={() => {
                sounds.playClick();
                onSelectGame(quiz, 'cetak-lks');
              }}
              className="p-4 rounded-2xl bg-slate-900 border border-slate-800 hover:border-sky-500/50 hover:bg-slate-850 flex items-start gap-3 transition-all text-left group cursor-pointer"
            >
              <div className="w-10 h-10 rounded-xl bg-sky-500/20 text-sky-400 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                <Printer className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-white group-hover:text-sky-300">
                  Cetak Lembar Kerja
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Cetak atau simpan PDF untuk latihan offline.
                </p>
              </div>
            </button>
          </div>
        </div>

        {/* Pratinjau Butir Soal untuk Belajar (Tanpa Kunci Jawaban) */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 sm:p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm sm:text-base font-extrabold text-white">
                Daftar Topik Pertanyaan ({quiz.questions.length} Soal)
              </h3>
              <p className="text-xs text-slate-400">
                Pratinjau soal sebelum mengerjakan kuis (kunci jawaban disembunyikan).
              </p>
            </div>

            <button
              type="button"
              onClick={() => setShowPreviewQuestions((prev) => !prev)}
              className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-indigo-300 flex items-center gap-1.5 transition-all cursor-pointer border border-slate-700"
            >
              <span>{showPreviewQuestions ? 'Sembunyikan' : 'Lihat Soal'}</span>
              {showPreviewQuestions ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </button>
          </div>

          {showPreviewQuestions && (
            <div className="space-y-2.5 pt-2 border-t border-slate-800">
              {quiz.questions.map((q, idx) => (
                <div
                  key={q.id || idx}
                  className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/60 flex items-start gap-3"
                >
                  <span className="w-6 h-6 rounded-lg bg-indigo-600/30 text-indigo-300 font-black text-xs flex items-center justify-center shrink-0 border border-indigo-500/30">
                    {idx + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs sm:text-sm font-bold text-slate-200">{q.question}</p>
                    <span className="inline-block mt-1 text-[10px] font-extrabold uppercase tracking-wider text-slate-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                      {q.type === 'multiple_choice' && 'Pilihan Ganda'}
                      {q.type === 'true_false' && 'Benar / Salah'}
                      {q.type === 'fill_blank' && 'Isian Singkat'}
                      {q.type === 'matching' && 'Menjodohkan'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer for Teachers/Admins to switch back */}
        {onExitStudentMode && (
          <div className="text-center pt-4 pb-8">
            <button
              type="button"
              onClick={onExitStudentMode}
              className="text-xs text-slate-500 hover:text-indigo-400 transition-colors underline cursor-pointer"
            >
              Apakah Anda Guru/Admin? Klik di sini untuk membuka semua bank soal & dasbor
            </button>
          </div>
        )}
      </main>
    </div>
  );
};
