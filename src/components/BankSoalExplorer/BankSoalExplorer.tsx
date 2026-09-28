import React, { useState } from 'react';
import { QuizSet, Jenjang, MataPelajaran, GameMode, QuestionType } from '../../types';
import { sounds } from '../../utils/audio';
import { ShareQuizModal } from './ShareQuizModal';
import { ImportExportModal } from './ImportExportModal';
import {
  Search,
  BookOpen,
  Zap,
  RotateCcw,
  Sparkles,
  Printer,
  Swords,
  Play,
  Grid,
  Filter,
  CheckCircle2,
  HelpCircle,
  Cpu,
  Calculator,
  Languages,
  Landmark,
  Orbit,
  Share2,
  Trash2,
  Cloud,
  ArrowRightLeft,
  Layers,
  FileQuestion,
  ChevronDown,
  ChevronUp,
  Copy,
  Check,
  Eye,
  EyeOff,
  Timer,
  TimerOff,
} from 'lucide-react';

interface Props {
  quizSets: QuizSet[];
  onSelectGame: (quiz: QuizSet, mode: GameMode) => void;
  onCreateNew: () => void;
  onImportQuiz?: (quiz: QuizSet) => void;
  onImportMultiple?: (quizzes: QuizSet[]) => void;
  onDeleteQuiz?: (id: string) => void;
  timerEnabled?: boolean;
  onToggleTimer?: () => void;
}

export const BankSoalExplorer: React.FC<Props> = ({
  quizSets,
  onSelectGame,
  onCreateNew,
  onImportQuiz = () => {},
  onImportMultiple = () => {},
  onDeleteQuiz,
  timerEnabled = true,
  onToggleTimer,
}) => {
  const [viewTab, setViewTab] = useState<'pakets' | 'butir-soal'>('pakets');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGrade, setSelectedGrade] = useState<string>('Semua');
  const [selectedSubject, setSelectedSubject] = useState<string>('Semua');
  const [selectedFormat, setSelectedFormat] = useState<string>('Semua');

  const [expandedQuestionId, setExpandedQuestionId] = useState<string | null>(null);
  const [copiedQuestionId, setCopiedQuestionId] = useState<string | null>(null);

  // Modal for selecting which game mode to launch for a quiz
  const [activeModalQuiz, setActiveModalQuiz] = useState<QuizSet | null>(null);
  // Modal for sharing a quiz link
  const [shareModalQuiz, setShareModalQuiz] = useState<QuizSet | null>(null);
  // Modal for import / export / sync
  const [isImportExportOpen, setIsImportExportOpen] = useState(false);

  const customQuizzes = quizSets.filter((q) => q.isCustom);

  // Flatten all individual questions across all quiz sets
  const allQuestionsWithQuiz = quizSets.flatMap((quiz) =>
    quiz.questions.map((q, idx) => ({
      ...q,
      parentQuiz: quiz,
      indexInQuiz: idx + 1,
    }))
  );

  const totalQuestionsCount = allQuestionsWithQuiz.length;

  const filteredQuizzes = quizSets.filter((quiz) => {
    const matchesSearch =
      quiz.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      quiz.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      quiz.category.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesGrade = selectedGrade === 'Semua' || quiz.grade === selectedGrade;
    const matchesSubject = selectedSubject === 'Semua' || quiz.category === selectedSubject;

    const matchesFormat =
      selectedFormat === 'Semua' ||
      quiz.questions.some((q) => q.type === selectedFormat);

    return matchesSearch && matchesGrade && matchesSubject && matchesFormat;
  });

  const filteredQuestions = allQuestionsWithQuiz.filter((item) => {
    const qText = item.question.toLowerCase();
    const explanationText = (item.explanation || '').toLowerCase();
    const quizTitle = item.parentQuiz.title.toLowerCase();
    const term = searchTerm.toLowerCase();

    const matchesSearch =
      !term ||
      qText.includes(term) ||
      explanationText.includes(term) ||
      quizTitle.includes(term) ||
      (item.options && item.options.some((o) => o.toLowerCase().includes(term)));

    const matchesGrade = selectedGrade === 'Semua' || item.parentQuiz.grade === selectedGrade;
    const matchesSubject = selectedSubject === 'Semua' || item.parentQuiz.category === selectedSubject;
    const matchesFormat = selectedFormat === 'Semua' || item.type === selectedFormat;

    return matchesSearch && matchesGrade && matchesSubject && matchesFormat;
  });

  const handleCopyQuestionText = (item: typeof allQuestionsWithQuiz[0]) => {
    let text = `[Soal ${item.parentQuiz.category} - ${item.parentQuiz.targetClass || item.parentQuiz.grade}]\n${item.question}\n`;
    if (item.type === 'multiple_choice' && item.options) {
      item.options.forEach((opt, idx) => {
        text += `${String.fromCharCode(65 + idx)}. ${opt}\n`;
      });
      text += `Kunci Jawaban: ${item.correctAnswer}\n`;
    } else if (item.type === 'true_false') {
      text += `Kunci Jawaban: ${item.correctAnswer}\n`;
    } else if (item.type === 'fill_blank') {
      text += `Kunci Jawaban: ${item.correctAnswer}\n`;
    } else if (item.type === 'matching' && item.matchingPairs) {
      text += `Pasangan Menjodohkan:\n`;
      item.matchingPairs.forEach((p) => {
        text += `- ${p.left} <=> ${p.right}\n`;
      });
    }
    if (item.explanation) {
      text += `Pembahasan: ${item.explanation}\n`;
    }

    navigator.clipboard.writeText(text);
    setCopiedQuestionId(item.id);
    sounds.playSuccess();
    setTimeout(() => setCopiedQuestionId(null), 2000);
  };

  const getSubjectIcon = (cat: MataPelajaran) => {
    switch (cat) {
      case 'Matematika':
        return <Calculator className="w-5 h-5 text-emerald-400" />;
      case 'IPA / Sains':
        return <Orbit className="w-5 h-5 text-blue-400" />;
      case 'Bahasa Indonesia':
        return <BookOpen className="w-5 h-5 text-amber-400" />;
      case 'Bahasa Inggris':
        return <Languages className="w-5 h-5 text-cyan-400" />;
      case 'IPS & Sejarah':
        return <Landmark className="w-5 h-5 text-rose-400" />;
      case 'Informatika & Logika':
        return <Cpu className="w-5 h-5 text-purple-400" />;
      default:
        return <Sparkles className="w-5 h-5 text-indigo-400" />;
    }
  };

  const openGameModal = (quiz: QuizSet) => {
    sounds.playClick();
    setActiveModalQuiz(quiz);
  };

  const launchMode = (mode: GameMode) => {
    if (!activeModalQuiz) return;
    sounds.playClick();
    onSelectGame(activeModalQuiz, mode);
    setActiveModalQuiz(null);
  };

  return (
    <div className="w-full max-w-7xl mx-auto py-4 px-3 sm:px-6 space-y-6">
      {/* Hero Banner */}
      <div className="relative overflow-hidden bg-gradient-to-r from-indigo-950 via-slate-900 to-slate-900 border-2 border-indigo-500/30 rounded-3xl p-6 md:p-10 shadow-2xl">
        <div className="max-w-2xl space-y-3 relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-black uppercase bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Platform Bank Soal & Game Edukasi Interaktif</span>
          </div>

          <h1 className="text-3xl md:text-5xl font-black text-white leading-tight">
            Belajar Jadi Petualangan Seru di <span className="bg-gradient-to-r from-amber-400 via-rose-400 to-cyan-300 bg-clip-text text-transparent">Edu Zone</span>
          </h1>

          <p className="text-slate-300 text-sm md:text-base leading-relaxed">
            Mainkan ratusan soal kurikulum Indonesia dalam format <strong>Pilihan Ganda</strong>,{' '}
            <strong>Benar/Salah</strong>, <strong>Isian Singkat</strong>, dan{' '}
            <strong>Menjodohkan Pasangan</strong> dengan audio efek & grafis dinamis.
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={onCreateNew}
              className="btn-3d px-6 py-3 bg-gradient-to-r from-indigo-600 to-sky-600 hover:from-indigo-500 hover:to-sky-500 text-white font-extrabold rounded-2xl flex items-center gap-2 shadow-lg shadow-indigo-950/50 cursor-pointer text-sm"
            >
              <Sparkles className="w-4 h-4" />
              <span>Buat Soal / AI Generator</span>
            </button>

            <button
              type="button"
              onClick={() => {
                sounds.playClick();
                setIsImportExportOpen(true);
              }}
              className="px-4 py-3 bg-slate-800/90 hover:bg-slate-700/90 text-slate-200 font-extrabold rounded-2xl flex items-center gap-2 border border-slate-700 hover:border-indigo-400 transition-all cursor-pointer text-xs md:text-sm"
              title="Sinkronkan kuis buatan Anda ke server agar muncul di link Publish atau transfer data antar perangkat"
            >
              <Cloud className="w-4 h-4 text-sky-400" />
              <span>Sinkronkan / Transfer Kuis</span>
              {customQuizzes.length > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-indigo-500/30 text-indigo-300 text-xs font-black border border-indigo-500/40">
                  {customQuizzes.length}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Ambient background decoration */}
        <div className="absolute right-0 top-0 w-80 h-80 bg-indigo-600/10 blur-3xl pointer-events-none" />
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-3xl space-y-4 shadow-xl">
        {/* View Mode Switcher */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                sounds.playClick();
                setViewTab('pakets');
              }}
              className={`px-4 py-2.5 rounded-2xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer ${
                viewTab === 'pakets'
                  ? 'bg-gradient-to-r from-indigo-600 to-sky-600 text-white shadow-lg shadow-indigo-950/50'
                  : 'bg-slate-800/80 text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>Paket Permainan ({filteredQuizzes.length})</span>
            </button>

            <button
              type="button"
              onClick={() => {
                sounds.playClick();
                setViewTab('butir-soal');
              }}
              className={`px-4 py-2.5 rounded-2xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer ${
                viewTab === 'butir-soal'
                  ? 'bg-gradient-to-r from-indigo-600 to-sky-600 text-white shadow-lg shadow-indigo-950/50'
                  : 'bg-slate-800/80 text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <FileQuestion className="w-4 h-4 text-amber-400" />
              <span>Katalog Semua Butir Soal ({filteredQuestions.length})</span>
            </button>
          </div>

          <div className="flex items-center gap-2 text-xs font-bold text-slate-400">
            <span>Isi Bank Soal:</span>
            <span className="px-2.5 py-1 rounded-xl bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-black">
              {totalQuestionsCount} Soal ({quizSets.length} Paket)
            </span>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={
              viewTab === 'pakets'
                ? 'Cari paket kuis (misal: Kalimat Langsung, Kosakata Khusus, Surat Pribadi, Tata Surya)...'
                : 'Cari dalam seluruh butir soal, pertanyaan, pilihan jawaban, atau pembahasan...'
            }
            className="w-full pl-11 pr-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm focus:border-indigo-400 outline-none"
          />
        </div>

        {/* Filter Rows */}
        <div className="space-y-2.5 pt-1 text-xs">
          {/* Jenjang Filter */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="font-extrabold text-slate-400 mr-1 flex items-center gap-1">
              <Filter className="w-3.5 h-3.5" />
              <span>Jenjang:</span>
            </span>
            {['Semua', 'SD', 'SMP', 'SMA', 'Kuliah / Umum'].map((gr) => (
              <button
                key={gr}
                type="button"
                onClick={() => setSelectedGrade(gr)}
                className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                  selectedGrade === gr
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                {gr}
              </button>
            ))}
          </div>

          {/* Mata Pelajaran Filter */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="font-extrabold text-slate-400 mr-1 flex items-center gap-1">
              <BookOpen className="w-3.5 h-3.5" />
              <span>Mapel:</span>
            </span>
            {[
              'Semua',
              'Bahasa Indonesia',
              'IPA / Sains',
              'Matematika',
              'IPS & Sejarah',
              'Informatika & Logika',
              'Bahasa Inggris',
            ].map((sub) => (
              <button
                key={sub}
                type="button"
                onClick={() => setSelectedSubject(sub)}
                className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                  selectedSubject === sub
                    ? 'bg-amber-600 text-white shadow-sm'
                    : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                {sub}
              </button>
            ))}
          </div>

          {/* Format Filter */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="font-extrabold text-slate-400 mr-1">Format Soal:</span>
            {[
              { id: 'Semua', label: 'Semua Format' },
              { id: 'multiple_choice', label: 'Pilihan Ganda' },
              { id: 'true_false', label: 'Benar / Salah' },
              { id: 'fill_blank', label: 'Isian' },
              { id: 'matching', label: 'Menjodohkan' },
            ].map((fmt) => (
              <button
                key={fmt.id}
                type="button"
                onClick={() => setSelectedFormat(fmt.id)}
                className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                  selectedFormat === fmt.id
                    ? 'bg-cyan-600 text-white shadow-sm'
                    : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                {fmt.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* VIEW 1: QUIZ PACKAGES GRID */}
      {viewTab === 'pakets' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredQuizzes.map((quiz) => {
            // Detect format presence in this quiz
            const hasMC = quiz.questions.some((q) => q.type === 'multiple_choice');
            const hasTF = quiz.questions.some((q) => q.type === 'true_false');
            const hasFill = quiz.questions.some((q) => q.type === 'fill_blank');
            const hasMatching = quiz.questions.some((q) => q.type === 'matching');

            return (
              <div
                key={quiz.id}
                className="group bg-slate-900 border-2 border-slate-800 hover:border-indigo-500/60 rounded-3xl p-5 flex flex-col justify-between transition-all duration-200 hover:shadow-xl hover:shadow-indigo-950/30"
              >
                <div className="space-y-3">
                  {/* Header row */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-10 h-10 rounded-2xl bg-slate-800 flex items-center justify-center">
                        {getSubjectIcon(quiz.category)}
                      </div>
                      <div>
                        <span className="text-xs font-bold text-slate-400 block leading-tight">
                          {quiz.category}
                        </span>
                        <span className="text-[11px] font-bold text-indigo-400">
                          {quiz.targetClass || `Tingkat ${quiz.grade}`}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {quiz.isCustom && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-black bg-amber-500/20 text-amber-300 border border-amber-500/40 uppercase tracking-wider">
                          Kuis Saya
                        </span>
                      )}
                      <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-slate-800 text-slate-300 border border-slate-700">
                        {quiz.questions.length} Soal
                      </span>
                    </div>
                  </div>

                  {/* Title & Desc */}
                  <div>
                    <h3 className="text-lg font-black text-white group-hover:text-indigo-300 transition-colors">
                      {quiz.title}
                    </h3>
                    <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                      {quiz.description}
                    </p>
                  </div>

                  {/* Question Formats Pills */}
                  <div className="pt-1 flex flex-wrap items-center gap-1.5 text-[11px]">
                    {hasMC && (
                      <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-300 border border-blue-500/20 font-bold">
                        Pilgan
                      </span>
                    )}
                    {hasTF && (
                      <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 font-bold">
                        Benar/Salah
                      </span>
                    )}
                    {hasFill && (
                      <span className="px-2 py-0.5 rounded bg-violet-500/10 text-violet-300 border border-violet-500/20 font-bold">
                        Isian
                      </span>
                    )}
                    {hasMatching && (
                      <span className="px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 font-bold">
                        Menjodohkan
                      </span>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="pt-5 mt-4 border-t border-slate-800/80 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => onSelectGame(quiz, 'cetak-lks')}
                      className="p-2 text-xs font-bold text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl flex items-center gap-1 transition-colors cursor-pointer"
                      title="Cetak LKS & Kunci Jawaban"
                    >
                      <Printer className="w-4 h-4" />
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        sounds.playClick();
                        setShareModalQuiz(quiz);
                      }}
                      className="px-2.5 py-1.5 text-xs font-bold text-indigo-400 hover:text-white hover:bg-indigo-600/30 border border-indigo-500/30 rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
                      title="Salin Link & Bagikan Game"
                    >
                      <Share2 className="w-3.5 h-3.5" />
                      <span>Bagikan</span>
                    </button>

                    {quiz.isCustom && onDeleteQuiz && (
                      <button
                        type="button"
                        onClick={() => {
                          if (window.confirm(`Hapus kuis "${quiz.title}" dari daftar?`)) {
                            onDeleteQuiz(quiz.id);
                          }
                        }}
                        className="p-2 text-slate-500 hover:text-rose-400 hover:bg-rose-950/40 rounded-xl transition-colors cursor-pointer"
                        title="Hapus Kuis Ini"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => openGameModal(quiz)}
                    className="btn-3d px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs md:text-sm font-extrabold rounded-xl flex items-center gap-1.5 shadow-md shadow-indigo-950/40 cursor-pointer"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Main</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* VIEW 2: INDIVIDUAL QUESTION ITEMS CATALOG */}
      {viewTab === 'butir-soal' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-slate-400 px-1">
            <span>
              Menampilkan <strong className="text-white">{filteredQuestions.length}</strong> butir soal (dari total {totalQuestionsCount} soal di Bank Soal)
            </span>
          </div>

          {filteredQuestions.length === 0 ? (
            <div className="bg-slate-900 border-2 border-dashed border-slate-800 rounded-3xl p-12 text-center text-slate-400 space-y-3">
              <FileQuestion className="w-10 h-10 mx-auto text-slate-600" />
              <p className="font-bold">Tidak ada butir soal yang sesuai dengan filter atau pencarian Anda.</p>
              <button
                type="button"
                onClick={() => {
                  setSearchTerm('');
                  setSelectedGrade('Semua');
                  setSelectedSubject('Semua');
                  setSelectedFormat('Semua');
                }}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-xl"
              >
                Reset Semua Filter
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredQuestions.map((item, index) => {
                const isExpanded = expandedQuestionId === item.id;
                const isCopied = copiedQuestionId === item.id;

                const getTypeBadge = () => {
                  switch (item.type) {
                    case 'multiple_choice':
                      return (
                        <span className="px-2.5 py-1 rounded-lg bg-blue-500/20 text-blue-300 border border-blue-500/30 text-xs font-bold">
                          Pilihan Ganda
                        </span>
                      );
                    case 'true_false':
                      return (
                        <span className="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold">
                          Benar / Salah
                        </span>
                      );
                    case 'fill_blank':
                      return (
                        <span className="px-2.5 py-1 rounded-lg bg-violet-500/20 text-violet-300 border border-violet-500/30 text-xs font-bold">
                          Isian Singkat
                        </span>
                      );
                    case 'matching':
                      return (
                        <span className="px-2.5 py-1 rounded-lg bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-xs font-bold">
                          Menjodohkan
                        </span>
                      );
                    default:
                      return null;
                  }
                };

                return (
                  <div
                    key={`${item.parentQuiz.id}-${item.id}-${index}`}
                    className="bg-slate-900 border-2 border-slate-800 hover:border-indigo-500/40 rounded-3xl p-5 md:p-6 transition-all duration-200 space-y-4 shadow-lg"
                  >
                    {/* Header info */}
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="w-7 h-7 rounded-xl bg-slate-800 text-indigo-400 font-black text-xs flex items-center justify-center border border-slate-700">
                          #{index + 1}
                        </span>
                        {getTypeBadge()}
                        <span className="text-xs font-bold text-slate-400">
                          {item.parentQuiz.category} • {item.parentQuiz.targetClass || item.parentQuiz.grade}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleCopyQuestionText(item)}
                          className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer border border-slate-700"
                          title="Salin butir soal dan jawaban"
                        >
                          {isCopied ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                              <span className="text-emerald-400">Tersalin!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5" />
                              <span>Salin Soal</span>
                            </>
                          )}
                        </button>

                        <button
                          type="button"
                          onClick={() => openGameModal(item.parentQuiz)}
                          className="px-3 py-1.5 rounded-xl bg-indigo-600/30 hover:bg-indigo-600 text-indigo-300 hover:text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer border border-indigo-500/40"
                          title="Buka dan mainkan kuis dari soal ini"
                        >
                          <Play className="w-3.5 h-3.5 fill-current" />
                          <span>Mainkan Paket</span>
                        </button>
                      </div>
                    </div>

                    {/* Question text */}
                    <div>
                      <p className="text-base font-extrabold text-white leading-relaxed">
                        {item.question}
                      </p>
                      <span className="text-[11px] text-slate-500 block mt-1">
                        Dari paket: <strong>{item.parentQuiz.title}</strong>
                      </span>
                    </div>

                    {/* Question options / interactive display */}
                    <div className="pt-1">
                      {/* Multiple choice options */}
                      {item.type === 'multiple_choice' && item.options && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                          {item.options.map((opt, oIdx) => {
                            const isCorrect = oIdx === item.correctIndex || opt === item.correctAnswer;
                            return (
                              <div
                                key={oIdx}
                                className={`p-3 rounded-2xl border flex items-center gap-2.5 ${
                                  isCorrect
                                    ? 'bg-emerald-950/40 border-emerald-500/60 text-emerald-200 font-bold'
                                    : 'bg-slate-950/60 border-slate-800 text-slate-300'
                                }`}
                              >
                                <span
                                  className={`w-6 h-6 rounded-lg text-xs font-black flex items-center justify-center shrink-0 ${
                                    isCorrect
                                      ? 'bg-emerald-500 text-slate-950'
                                      : 'bg-slate-800 text-slate-400'
                                  }`}
                                >
                                  {String.fromCharCode(65 + oIdx)}
                                </span>
                                <span className="flex-1">{opt}</span>
                                {isCorrect && (
                                  <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                                    Kunci
                                  </span>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {/* True / False view */}
                      {item.type === 'true_false' && (
                        <div className="flex items-center gap-3 text-xs">
                          <div
                            className={`px-4 py-2 rounded-xl font-bold border flex items-center gap-2 ${
                              item.correctAnswer === 'Benar'
                                ? 'bg-emerald-950/50 border-emerald-500/60 text-emerald-300'
                                : 'bg-slate-950/60 border-slate-800 text-slate-400 opacity-60'
                            }`}
                          >
                            <span>Benar</span>
                            {item.correctAnswer === 'Benar' && (
                              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                            )}
                          </div>

                          <div
                            className={`px-4 py-2 rounded-xl font-bold border flex items-center gap-2 ${
                              item.correctAnswer === 'Salah'
                                ? 'bg-rose-950/50 border-rose-500/60 text-rose-300'
                                : 'bg-slate-950/60 border-slate-800 text-slate-400 opacity-60'
                            }`}
                          >
                            <span>Salah</span>
                            {item.correctAnswer === 'Salah' && (
                              <CheckCircle2 className="w-4 h-4 text-rose-400" />
                            )}
                          </div>
                        </div>
                      )}

                      {/* Fill in the blank view */}
                      {item.type === 'fill_blank' && (
                        <div className="p-3 rounded-2xl bg-violet-950/30 border border-violet-500/30 text-xs space-y-1">
                          <span className="text-violet-300 font-extrabold block">
                            Kunci Jawaban Tepat:
                          </span>
                          <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                            <span className="px-3 py-1 rounded-xl bg-violet-600/40 text-violet-200 border border-violet-400/40 font-mono font-bold">
                              {item.correctAnswer}
                            </span>
                            {item.acceptableAnswers &&
                              item.acceptableAnswers
                                .filter((a) => a.toLowerCase() !== item.correctAnswer.toLowerCase())
                                .map((alt, aIdx) => (
                                  <span
                                    key={aIdx}
                                    className="px-2.5 py-0.5 rounded-lg bg-slate-800 text-slate-400 font-mono text-[11px]"
                                    title="Variasi jawaban yang diterima"
                                  >
                                    opsi: {alt}
                                  </span>
                                ))}
                          </div>
                        </div>
                      )}

                      {/* Matching pairs view */}
                      {item.type === 'matching' && item.matchingPairs && (
                        <div className="space-y-1.5 text-xs">
                          <span className="text-cyan-300 font-extrabold block">
                            Pasangan Konsep Menjodohkan:
                          </span>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {item.matchingPairs.map((p, pIdx) => (
                              <div
                                key={p.id || pIdx}
                                className="p-2.5 rounded-xl bg-slate-950/60 border border-cyan-500/30 flex items-center justify-between gap-2"
                              >
                                <span className="font-bold text-cyan-200">{p.left}</span>
                                <span className="text-slate-500">➔</span>
                                <span className="font-bold text-emerald-300">{p.right}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Educational discussion toggle */}
                    <div className="pt-2 border-t border-slate-800/60">
                      <button
                        type="button"
                        onClick={() =>
                          setExpandedQuestionId(isExpanded ? null : item.id)
                        }
                        className="text-xs font-bold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 cursor-pointer"
                      >
                        {isExpanded ? (
                          <>
                            <EyeOff className="w-3.5 h-3.5" />
                            <span>Sembunyikan Pembahasan</span>
                          </>
                        ) : (
                          <>
                            <Eye className="w-3.5 h-3.5" />
                            <span>Lihat Pembahasan & Petunjuk Edukatif</span>
                          </>
                        )}
                      </button>

                      {isExpanded && (
                        <div className="mt-3 p-4 rounded-2xl bg-indigo-950/30 border border-indigo-500/20 text-xs space-y-2 animate-in fade-in duration-150">
                          {item.explanation && (
                            <div>
                              <span className="font-extrabold text-indigo-300 block mb-0.5">
                                💡 Pembahasan Detail:
                              </span>
                              <p className="text-slate-300 leading-relaxed">
                                {item.explanation}
                              </p>
                            </div>
                          )}

                          {item.hint && (
                            <div className="pt-1 border-t border-indigo-500/20">
                              <span className="font-extrabold text-amber-300 block mb-0.5">
                                🔍 Petunjuk Siswa (Hint):
                              </span>
                              <p className="text-slate-400 italic">
                                {item.hint}
                              </p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* GAME MODE SELECTION MODAL */}
      {activeModalQuiz && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-slate-900 border-2 border-indigo-500/50 rounded-3xl p-6 md:p-8 max-w-xl w-full space-y-6 shadow-2xl relative">
            <div>
              <span className="text-xs font-extrabold uppercase text-indigo-400 tracking-wider">
                Pilih Mode Game Edukasi
              </span>
              <h3 className="text-xl md:text-2xl font-black text-white mt-1">
                {activeModalQuiz.title}
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Pilih format permainan interaktif yang ingin kamu mainkan bersama paket soal ini:
              </p>
            </div>

            {/* Timer Setting Option Card */}
            {onToggleTimer && (
              <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-800/90 border border-slate-700/80 shadow-inner">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                      timerEnabled
                        ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                        : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    }`}
                  >
                    {timerEnabled ? <Timer className="w-5 h-5" /> : <TimerOff className="w-5 h-5" />}
                  </div>
                  <div>
                    <div className="text-xs font-black text-white flex items-center gap-1.5">
                      <span>Batas Waktu Soal</span>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-md font-extrabold uppercase ${
                          timerEnabled
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                            : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                        }`}
                      >
                        {timerEnabled ? 'Aktif (25 detik)' : 'Nonaktif (Bebas Waktu)'}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      {timerEnabled
                        ? 'Timer 25 detik per soal. Klik tombol di kanan jika ingin santai.'
                        : 'Bebas waktu tanpa batas detik untuk belajar dengan rileks.'}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    sounds.playClick();
                    onToggleTimer();
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer border ${
                    timerEnabled
                      ? 'bg-slate-700 hover:bg-slate-600 text-rose-300 border-rose-500/30'
                      : 'bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-400 shadow-md'
                  }`}
                >
                  {timerEnabled ? 'Matikan Timer' : 'Aktifkan Timer'}
                </button>
              </div>
            )}

            {/* Game Modes Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* 1. Kuis Kilat */}
              <button
                type="button"
                onClick={() => launchMode('kuis-kilat')}
                className="btn-3d p-4 rounded-2xl bg-gradient-to-br from-indigo-900/60 to-indigo-950 border border-indigo-500/40 hover:border-indigo-400 text-left cursor-pointer group"
              >
                <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white mb-2 shadow-md">
                  <Zap className="w-5 h-5 fill-current" />
                </div>
                <h4 className="font-extrabold text-white text-sm">Kuis Kilat Interaktif</h4>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Dukung 4 format soal, timer, streak, & power-up seru.
                </p>
              </button>

              {/* 2. Kartu Cocok */}
              <button
                type="button"
                onClick={() => launchMode('kartu-cocok')}
                className="btn-3d p-4 rounded-2xl bg-gradient-to-br from-cyan-900/60 to-cyan-950 border border-cyan-500/40 hover:border-cyan-400 text-left cursor-pointer group"
              >
                <div className="w-10 h-10 rounded-xl bg-cyan-600 flex items-center justify-center text-white mb-2 shadow-md">
                  <Grid className="w-5 h-5" />
                </div>
                <h4 className="font-extrabold text-white text-sm">Kartu Cocok & Memori</h4>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Cocokkan pasangan istilah, rumus, dan definisi.
                </p>
              </button>

              {/* 3. Labirin Kata */}
              <button
                type="button"
                onClick={() => launchMode('labirin-kata')}
                className="btn-3d p-4 rounded-2xl bg-gradient-to-br from-emerald-900/60 to-emerald-950 border border-emerald-500/40 hover:border-emerald-400 text-left cursor-pointer group"
              >
                <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center text-white mb-2 shadow-md">
                  <BookOpen className="w-5 h-5" />
                </div>
                <h4 className="font-extrabold text-white text-sm">Labirin & Susun Kata</h4>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Anagram huruf berantakan berdasarkan petunjuk soal.
                </p>
              </button>

              {/* 4. Roda Putar */}
              <button
                type="button"
                onClick={() => launchMode('roda-putar')}
                className="btn-3d p-4 rounded-2xl bg-gradient-to-br from-amber-900/60 to-amber-950 border border-amber-500/40 hover:border-amber-400 text-left cursor-pointer group"
              >
                <div className="w-10 h-10 rounded-xl bg-amber-600 flex items-center justify-center text-white mb-2 shadow-md">
                  <RotateCcw className="w-5 h-5" />
                </div>
                <h4 className="font-extrabold text-white text-sm">Roda Putar Soal</h4>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Putar roda keberuntungan untuk tantangan & double XP.
                </p>
              </button>

              {/* 5. Duel 2 Pemain */}
              <button
                type="button"
                onClick={() => launchMode('duel-teman')}
                className="btn-3d p-4 rounded-2xl bg-gradient-to-br from-rose-900/60 to-rose-950 border border-rose-500/40 hover:border-rose-400 text-left cursor-pointer group sm:col-span-2"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-rose-600 flex items-center justify-center text-white shadow-md shrink-0">
                    <Swords className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-white text-sm">Duel 2 Pemain (Tantangan Teman)</h4>
                    <p className="text-[11px] text-slate-400">
                      Tanding adu cepat di satu layar (Pemain 1 Merah vs Pemain 2 Biru).
                    </p>
                  </div>
                </div>
              </button>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setActiveModalQuiz(null)}
                className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SHARE QUIZ MODAL */}
      {shareModalQuiz && (
        <ShareQuizModal
          quiz={shareModalQuiz}
          onClose={() => setShareModalQuiz(null)}
          onLaunchMode={(mode) => {
            const q = shareModalQuiz;
            setShareModalQuiz(null);
            onSelectGame(q, mode);
          }}
        />
      )}

      {/* IMPORT / EXPORT / SYNC MODAL */}
      {isImportExportOpen && (
        <ImportExportModal
          customQuizzes={customQuizzes}
          onImportQuiz={(newQ) => {
            onImportQuiz(newQ);
            sounds.playWin();
          }}
          onImportMultiple={(quizzes) => {
            onImportMultiple(quizzes);
            sounds.playWin();
          }}
          onClose={() => setIsImportExportOpen(false)}
        />
      )}
    </div>
  );
};
