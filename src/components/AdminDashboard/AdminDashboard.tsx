import React, { useState } from 'react';
import { QuizSet, Question, QuestionType, Jenjang, MataPelajaran, Difficulty, MatchingPair, GameMode } from '../../types';
import { getQuizQuestionBreakdown } from '../../utils/quizStats';
import { generateStudentShareUrl } from '../../utils/shareQuiz';
import { sounds } from '../../utils/audio';
import { GRADE_CLASSES_MAP } from '../QuestionCreator/QuestionCreator';
import {
  LayoutDashboard,
  BookOpen,
  Plus,
  Edit3,
  Trash2,
  Copy,
  Check,
  Share2,
  Search,
  Filter,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Sparkles,
  Layers,
  ArrowUp,
  ArrowDown,
  Save,
  X,
  Play,
  Printer,
  ChevronDown,
  ChevronUp,
  FileQuestion,
  GraduationCap,
  PieChart,
  BarChart3,
  Flame,
  Clock,
} from 'lucide-react';

interface Props {
  quizSets: QuizSet[];
  initialEditingQuiz?: QuizSet | null;
  onClearInitialQuiz?: () => void;
  onSaveQuiz: (quiz: QuizSet) => void;
  onDeleteQuiz?: (id: string) => void;
  onCreateNewQuiz: () => void;
  onSelectGame: (quiz: QuizSet, mode: GameMode) => void;
  onOpenWorksheet: (quiz: QuizSet) => void;
}

const ALL_SUBJECTS: MataPelajaran[] = [
  'IPA / Sains',
  'Matematika',
  'Bahasa Indonesia',
  'Bahasa Inggris',
  'IPS & Sejarah',
  'Informatika & Logika',
  'Pengetahuan Umum',
];

const ALL_GRADES: Jenjang[] = ['SD', 'SMP', 'SMA', 'Kuliah / Umum'];

export const AdminDashboard: React.FC<Props> = ({
  quizSets,
  initialEditingQuiz,
  onClearInitialQuiz,
  onSaveQuiz,
  onDeleteQuiz,
  onCreateNewQuiz,
  onSelectGame,
  onOpenWorksheet,
}) => {
  const [activeTab, setActiveTab] = useState<'quizzes' | 'analytics'>('quizzes');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGrade, setSelectedGrade] = useState<string>('Semua');
  const [selectedSubject, setSelectedSubject] = useState<string>('Semua');
  const [copiedQuizId, setCopiedQuizId] = useState<string | null>(null);

  // Editing state
  const [editingQuiz, setEditingQuiz] = useState<QuizSet | null>(null);
  const [expandedQuestionIdx, setExpandedQuestionIdx] = useState<number | null>(0);
  const [editSuccessMsg, setEditSuccessMsg] = useState<string | null>(null);
  const [editErrorMsg, setEditErrorMsg] = useState<string | null>(null);

  // Open quiz in editor if initialEditingQuiz was passed from BankSoal
  React.useEffect(() => {
    if (initialEditingQuiz) {
      const cloned: QuizSet = JSON.parse(JSON.stringify(initialEditingQuiz));
      setEditingQuiz(cloned);
      setExpandedQuestionIdx(0);
      setEditSuccessMsg(null);
      setEditErrorMsg(null);
      if (onClearInitialQuiz) {
        onClearInitialQuiz();
      }
    }
  }, [initialEditingQuiz]);

  // Delete modal state
  const [quizToDelete, setQuizToDelete] = useState<QuizSet | null>(null);

  // Analytics calculation
  const totalQuizzes = quizSets.length;
  const totalQuestions = quizSets.reduce((acc, q) => acc + (q.questions?.length || 0), 0);
  const customQuizzes = quizSets.filter((q) => q.isCustom);

  let totalMC = 0;
  let totalTF = 0;
  let totalFill = 0;
  let totalMatch = 0;

  quizSets.forEach((q) => {
    (q.questions || []).forEach((quest) => {
      if (quest.type === 'multiple_choice') totalMC++;
      else if (quest.type === 'true_false') totalTF++;
      else if (quest.type === 'fill_blank') totalFill++;
      else if (quest.type === 'matching') totalMatch++;
    });
  });

  const gradeCounts: Record<string, number> = { SD: 0, SMP: 0, SMA: 0, 'Kuliah / Umum': 0 };
  quizSets.forEach((q) => {
    if (gradeCounts[q.grade] !== undefined) {
      gradeCounts[q.grade]++;
    }
  });

  // Filter quizzes
  const filteredQuizzes = quizSets.filter((quiz) => {
    const matchesSearch =
      quiz.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      quiz.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      quiz.category.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesGrade = selectedGrade === 'Semua' || quiz.grade === selectedGrade;
    const matchesSubject = selectedSubject === 'Semua' || quiz.category === selectedSubject;

    return matchesSearch && matchesGrade && matchesSubject;
  });

  const handleCopyStudentLink = async (quiz: QuizSet) => {
    try {
      const studentUrl = generateStudentShareUrl(quiz, 'kuis-kilat');
      await navigator.clipboard.writeText(studentUrl);
      setCopiedQuizId(quiz.id);
      sounds.playSuccess();
      setTimeout(() => setCopiedQuizId(null), 3000);
    } catch {
      // Fallback
    }
  };

  const handleStartEditQuiz = (quiz: QuizSet) => {
    // Clone quiz deeply so edits are isolated until saved
    const cloned: QuizSet = JSON.parse(JSON.stringify(quiz));
    setEditingQuiz(cloned);
    setExpandedQuestionIdx(0);
    setEditSuccessMsg(null);
    setEditErrorMsg(null);
    sounds.playClick();
  };

  const handleSaveEditedQuiz = () => {
    if (!editingQuiz) return;

    if (!editingQuiz.title.trim()) {
      setEditErrorMsg('Judul kuis tidak boleh kosong.');
      return;
    }

    if (!editingQuiz.questions || editingQuiz.questions.length === 0) {
      setEditErrorMsg('Kuis harus memiliki minimal 1 butir soal.');
      return;
    }

    // Validate that questions have text
    for (let i = 0; i < editingQuiz.questions.length; i++) {
      const q = editingQuiz.questions[i];
      if (!q.question.trim()) {
        setEditErrorMsg(`Pertanyaan nomor ${i + 1} tidak boleh kosong.`);
        setExpandedQuestionIdx(i);
        return;
      }
    }

    onSaveQuiz(editingQuiz);
    setEditSuccessMsg('Semua perubahan kuis & butir soal berhasil disimpan!');
    sounds.playWin();

    setTimeout(() => {
      setEditingQuiz(null);
      setEditSuccessMsg(null);
    }, 1200);
  };

  // Question editing sub-handlers inside editingQuiz
  const handleUpdateQuestion = (idx: number, patch: Partial<Question>) => {
    if (!editingQuiz) return;
    const updatedQuestions = [...editingQuiz.questions];
    updatedQuestions[idx] = { ...updatedQuestions[idx], ...patch };
    setEditingQuiz({ ...editingQuiz, questions: updatedQuestions });
  };

  const handleAddQuestion = () => {
    if (!editingQuiz) return;
    const newQ: Question = {
      id: `q-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      type: 'multiple_choice',
      question: '',
      options: ['Opsi A', 'Opsi B', 'Opsi C', 'Opsi D'],
      correctIndex: 0,
      correctAnswer: 'Opsi A',
      explanation: 'Pembahasan materi untuk soal ini.',
      hint: 'Petunjuk pengerjaan soal.',
      subject: editingQuiz.category,
      grade: editingQuiz.grade,
      targetClass: editingQuiz.targetClass,
      difficulty: editingQuiz.difficulty,
    };

    const updatedQuestions = [...editingQuiz.questions, newQ];
    setEditingQuiz({ ...editingQuiz, questions: updatedQuestions });
    setExpandedQuestionIdx(updatedQuestions.length - 1);
    sounds.playClick();
  };

  const handleDeleteQuestion = (idx: number) => {
    if (!editingQuiz || editingQuiz.questions.length <= 1) {
      alert('Kuis harus memiliki setidaknya satu soal.');
      return;
    }
    const updatedQuestions = editingQuiz.questions.filter((_, i) => i !== idx);
    setEditingQuiz({ ...editingQuiz, questions: updatedQuestions });
    setExpandedQuestionIdx(Math.max(0, idx - 1));
    sounds.playClick();
  };

  const handleMoveQuestion = (idx: number, direction: 'up' | 'down') => {
    if (!editingQuiz) return;
    const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= editingQuiz.questions.length) return;

    const list = [...editingQuiz.questions];
    const temp = list[idx];
    list[idx] = list[targetIdx];
    list[targetIdx] = temp;

    setEditingQuiz({ ...editingQuiz, questions: list });
    setExpandedQuestionIdx(targetIdx);
    sounds.playClick();
  };

  const handleDuplicateQuestion = (idx: number) => {
    if (!editingQuiz) return;
    const original = editingQuiz.questions[idx];
    const duplicate: Question = {
      ...JSON.parse(JSON.stringify(original)),
      id: `q-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      question: `${original.question} (Salinan)`,
    };

    const list = [...editingQuiz.questions];
    list.splice(idx + 1, 0, duplicate);
    setEditingQuiz({ ...editingQuiz, questions: list });
    setExpandedQuestionIdx(idx + 1);
    sounds.playClick();
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
      {/* Top Admin Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900 border-2 border-indigo-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
              <LayoutDashboard className="w-5 h-5" />
            </div>
            <span className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              Dashboard Admin & Guru
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black text-white">
            Kelola Bank Soal & Materi Pembelajaran
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 max-w-2xl">
            Edit isi soal, perbarui rincian materi kuis, pantau statistik, dan bagikan tautan khusus
            yang hanya menampilkan soal yang dipilih kepada siswa.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={onCreateNewQuiz}
            className="btn-3d px-5 py-3 rounded-2xl bg-gradient-to-r from-indigo-600 to-sky-600 hover:from-indigo-500 hover:to-sky-500 text-white font-extrabold text-xs sm:text-sm flex items-center gap-2 shadow-xl shadow-indigo-950/50 cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Tambah Kuis Baru</span>
          </button>
        </div>
      </div>

      {/* Analytics Summary Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Kuis */}
        <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-lg space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs font-bold">
            <span>Total Paket Materi</span>
            <BookOpen className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-white">{totalQuizzes}</div>
          <div className="text-[11px] text-slate-400">
            {customQuizzes.length} kuis kustom guru • {totalQuizzes - customQuizzes.length} kuis bawaan
          </div>
        </div>

        {/* Total Butir Soal */}
        <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-lg space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs font-bold">
            <span>Total Butir Soal</span>
            <FileQuestion className="w-4 h-4 text-sky-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-white">{totalQuestions}</div>
          <div className="text-[11px] text-slate-400">
            Rata-rata {totalQuizzes > 0 ? Math.round(totalQuestions / totalQuizzes) : 0} soal / materi
          </div>
        </div>

        {/* Rincian Format Soal */}
        <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-lg space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs font-bold">
            <span>Komposisi Format</span>
            <PieChart className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-sm font-black text-white pt-1">
            {totalMC} Pilgan • {totalTF} B/S
          </div>
          <div className="text-[11px] text-slate-400">
            {totalFill} Isian • {totalMatch} Menjodohkan
          </div>
        </div>

        {/* Jenjang Cakupan */}
        <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-lg space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs font-bold">
            <span>Cakupan Jenjang</span>
            <GraduationCap className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-sm font-black text-white pt-1">
            SD ({gradeCounts.SD}) • SMP ({gradeCounts.SMP})
          </div>
          <div className="text-[11px] text-slate-400">
            SMA ({gradeCounts.SMA}) • Umum ({gradeCounts['Kuliah / Umum']})
          </div>
        </div>
      </div>

      {/* Main Tab Controls: Quizzes Table vs Analytics */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-1.5 bg-slate-900 p-1.5 rounded-2xl border border-slate-800">
          <button
            type="button"
            onClick={() => setActiveTab('quizzes')}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'quizzes'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Daftar Kuis & Edit Soal ({filteredQuizzes.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('analytics')}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'analytics'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>Statistik Lengkap</span>
          </button>
        </div>

        {copiedQuizId && (
          <div className="px-3.5 py-1.5 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4" />
            <span>Tautan siswa berhasil disalin! Hanya menampilkan soal ini saat dibuka siswa.</span>
          </div>
        )}
      </div>

      {/* TAB 1: QUIZZES MANAGEMENT & EDITING */}
      {activeTab === 'quizzes' && (
        <div className="space-y-4">
          {/* Search & Filters */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 space-y-3">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Cari materi kuis, topik, atau mata pelajaran..."
                  className="w-full pl-10 pr-4 py-2 bg-slate-800/80 border border-slate-700 rounded-xl text-xs sm:text-sm text-white focus:outline-none focus:border-indigo-500 placeholder-slate-500"
                />
              </div>

              {/* Filter Jenjang */}
              <select
                value={selectedGrade}
                onChange={(e) => setSelectedGrade(e.target.value)}
                className="bg-slate-800 border border-slate-700 text-slate-300 rounded-xl px-3 py-2 text-xs font-bold focus:outline-none cursor-pointer"
              >
                <option value="Semua">Semua Jenjang</option>
                {ALL_GRADES.map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </select>

              {/* Filter Mapel */}
              <select
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
                className="bg-slate-800 border border-slate-700 text-slate-300 rounded-xl px-3 py-2 text-xs font-bold focus:outline-none cursor-pointer"
              >
                <option value="Semua">Semua Mata Pelajaran</option>
                {ALL_SUBJECTS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* List of Quiz Cards for Admin */}
          <div className="space-y-3">
            {filteredQuizzes.map((quiz) => {
              const breakdown = getQuizQuestionBreakdown(quiz);

              return (
                <div
                  key={quiz.id}
                  className="p-4 sm:p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-indigo-500/40 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 group"
                >
                  {/* Left: Info & Breakdown */}
                  <div className="space-y-2 flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                        {quiz.category}
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-800 text-slate-300 border border-slate-700">
                        {quiz.targetClass || `Kelas ${quiz.grade}`}
                      </span>
                      {quiz.isCustom && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/40">
                          Kuis Guru
                        </span>
                      )}
                      <span className="text-xs font-bold text-slate-400">
                        • {quiz.difficulty}
                      </span>
                    </div>

                    <div>
                      <h3 className="text-base sm:text-lg font-black text-white group-hover:text-indigo-300 transition-colors">
                        {quiz.title}
                      </h3>
                      <p className="text-xs text-slate-400 line-clamp-1 mt-0.5">
                        {quiz.description}
                      </p>
                    </div>

                    {/* Penjelasan Rincian Jumlah Soal */}
                    <div className="flex flex-wrap items-center gap-1.5 pt-1">
                      <span className="px-2.5 py-0.5 rounded-lg text-xs font-black bg-indigo-600 text-white">
                        {breakdown.total} Soal
                      </span>
                      <span className="text-xs text-slate-300 font-semibold">
                        ({breakdown.summaryText})
                      </span>
                      <span className="text-xs text-slate-500">• Estimasi ~{breakdown.estimatedMinutes} Menit</span>
                    </div>
                  </div>

                  {/* Right: Quick Action Buttons */}
                  <div className="flex flex-wrap items-center gap-2 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-slate-800">
                    {/* Tombol Edit Soal */}
                    <button
                      type="button"
                      onClick={() => handleStartEditQuiz(quiz)}
                      className="px-3.5 py-2 rounded-xl bg-indigo-600/20 hover:bg-indigo-600 text-indigo-300 hover:text-white border border-indigo-500/40 text-xs font-extrabold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
                      title="Edit Judul, Deskripsi, dan Butir-butir Soal"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Edit Soal</span>
                    </button>

                    {/* Tombol Salin Link Khusus Siswa */}
                    <button
                      type="button"
                      onClick={() => handleCopyStudentLink(quiz)}
                      className="px-3.5 py-2 rounded-xl bg-emerald-600/20 hover:bg-emerald-600 text-emerald-300 hover:text-white border border-emerald-500/40 text-xs font-extrabold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
                      title="Salin Link Khusus Siswa (Hanya Menampilkan Materi Soal Ini)"
                    >
                      {copiedQuizId === quiz.id ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-white" />
                          <span>Tersalin!</span>
                        </>
                      ) : (
                        <>
                          <Share2 className="w-3.5 h-3.5" />
                          <span>Link Siswa</span>
                        </>
                      )}
                    </button>

                    {/* Tombol Uji Kuis */}
                    <button
                      type="button"
                      onClick={() => onSelectGame(quiz, 'kuis-kilat')}
                      className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-xs font-bold transition-all cursor-pointer"
                      title="Uji Coba Kerjakan Kuis"
                    >
                      <Play className="w-4 h-4" />
                    </button>

                    {/* Tombol Cetak LKS */}
                    <button
                      type="button"
                      onClick={() => onOpenWorksheet(quiz)}
                      className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-xs font-bold transition-all cursor-pointer"
                      title="Cetak Lembar Kerja Siswa (LKS)"
                    >
                      <Printer className="w-4 h-4" />
                    </button>

                    {/* Tombol Hapus */}
                    {onDeleteQuiz && (
                      <button
                        type="button"
                        onClick={() => setQuizToDelete(quiz)}
                        className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/30 text-rose-400 hover:text-rose-200 border border-rose-500/20 text-xs font-bold transition-all cursor-pointer"
                        title="Hapus Kuis Ini"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}

            {filteredQuizzes.length === 0 && (
              <div className="p-8 text-center bg-slate-900 border border-slate-800 rounded-3xl text-slate-400">
                Tidak ada kuis yang sesuai dengan pencarian atau filter yang dipilih.
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: DETAILED ANALYTICS */}
      {activeTab === 'analytics' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Format Breakdown */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
            <h3 className="text-base font-black text-white flex items-center gap-2">
              <PieChart className="w-5 h-5 text-indigo-400" />
              <span>Distribusi Format Butir Soal</span>
            </h3>

            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-xs font-bold text-slate-300 mb-1">
                  <span>Pilihan Ganda</span>
                  <span>{totalMC} soal ({totalQuestions > 0 ? Math.round((totalMC / totalQuestions) * 100) : 0}%)</span>
                </div>
                <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
                  <div
                    className="h-full bg-blue-500 rounded-full"
                    style={{ width: `${totalQuestions > 0 ? (totalMC / totalQuestions) * 100 : 0}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-bold text-slate-300 mb-1">
                  <span>Benar / Salah</span>
                  <span>{totalTF} soal ({totalQuestions > 0 ? Math.round((totalTF / totalQuestions) * 100) : 0}%)</span>
                </div>
                <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-full"
                    style={{ width: `${totalQuestions > 0 ? (totalTF / totalQuestions) * 100 : 0}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-bold text-slate-300 mb-1">
                  <span>Isian Singkat</span>
                  <span>{totalFill} soal ({totalQuestions > 0 ? Math.round((totalFill / totalQuestions) * 100) : 0}%)</span>
                </div>
                <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
                  <div
                    className="h-full bg-violet-500 rounded-full"
                    style={{ width: `${totalQuestions > 0 ? (totalFill / totalQuestions) * 100 : 0}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-bold text-slate-300 mb-1">
                  <span>Menjodohkan</span>
                  <span>{totalMatch} soal ({totalQuestions > 0 ? Math.round((totalMatch / totalQuestions) * 100) : 0}%)</span>
                </div>
                <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
                  <div
                    className="h-full bg-amber-500 rounded-full"
                    style={{ width: `${totalQuestions > 0 ? (totalMatch / totalQuestions) * 100 : 0}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Subject Breakdown */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
            <h3 className="text-base font-black text-white flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-amber-400" />
              <span>Jumlah Paket per Mata Pelajaran</span>
            </h3>

            <div className="space-y-2.5">
              {ALL_SUBJECTS.map((sub) => {
                const count = quizSets.filter((q) => q.category === sub).length;
                return (
                  <div key={sub} className="flex items-center justify-between text-xs font-bold text-slate-300 p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/60">
                    <span>{sub}</span>
                    <span className="px-2.5 py-0.5 rounded-full bg-slate-900 text-indigo-400 border border-slate-700">
                      {count} Paket
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* MODAL / DRAWER: EDIT SOAL LENGKAP */}
      {editingQuiz && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-slate-900 border-2 border-indigo-500/50 rounded-3xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden relative">
            {/* Modal Header */}
            <div className="p-5 sm:p-6 border-b border-slate-800 flex items-center justify-between gap-3 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center text-indigo-400 shrink-0">
                  <Edit3 className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg sm:text-xl font-black text-white">
                    Edit Materi & Butir Soal
                  </h2>
                  <p className="text-xs text-slate-400">
                    Ubah pertanyaan, pilihan jawaban, kunci, dan pembahasan secara langsung.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setEditingQuiz(null)}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Error / Success Notifications */}
            {editErrorMsg && (
              <div className="mx-6 mt-4 p-3 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs font-bold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{editErrorMsg}</span>
              </div>
            )}

            {editSuccessMsg && (
              <div className="mx-6 mt-4 p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{editSuccessMsg}</span>
              </div>
            )}

            {/* Scrollable Body: Quiz Metadata & Question Items */}
            <div className="p-5 sm:p-6 overflow-y-auto space-y-6 flex-1">
              {/* Quiz Metadata Section */}
              <div className="p-4 sm:p-5 rounded-2xl bg-slate-800/80 border border-slate-700/80 space-y-4">
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-indigo-400 flex items-center gap-2">
                  <BookOpen className="w-4 h-4" />
                  <span>Informasi Paket Kuis</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-300 mb-1">
                      Judul Materi Kuis
                    </label>
                    <input
                      type="text"
                      value={editingQuiz.title}
                      onChange={(e) => setEditingQuiz({ ...editingQuiz, title: e.target.value })}
                      className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white focus:outline-none focus:border-indigo-500 font-bold"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-300 mb-1">
                      Deskripsi Materi
                    </label>
                    <textarea
                      rows={2}
                      value={editingQuiz.description}
                      onChange={(e) =>
                        setEditingQuiz({ ...editingQuiz, description: e.target.value })
                      }
                      className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs sm:text-sm text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">
                      Mata Pelajaran
                    </label>
                    <select
                      value={editingQuiz.category}
                      onChange={(e) =>
                        setEditingQuiz({ ...editingQuiz, category: e.target.value as MataPelajaran })
                      }
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs sm:text-sm text-white font-bold focus:outline-none"
                    >
                      {ALL_SUBJECTS.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">
                      Jenjang Sekolah
                    </label>
                    <select
                      value={editingQuiz.grade}
                      onChange={(e) => {
                        const newGrade = e.target.value as Jenjang;
                        const classOptions = GRADE_CLASSES_MAP[newGrade] || [];
                        setEditingQuiz({
                          ...editingQuiz,
                          grade: newGrade,
                          targetClass: classOptions[0]?.id || `Kelas ${newGrade}`,
                        });
                      }}
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs sm:text-sm text-white font-bold focus:outline-none"
                    >
                      {ALL_GRADES.map((g) => (
                        <option key={g} value={g}>
                          {g}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">
                      Kelas Target
                    </label>
                    <select
                      value={editingQuiz.targetClass || ''}
                      onChange={(e) =>
                        setEditingQuiz({ ...editingQuiz, targetClass: e.target.value })
                      }
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs sm:text-sm text-white font-bold focus:outline-none"
                    >
                      {(GRADE_CLASSES_MAP[editingQuiz.grade] || []).map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">
                      Tingkat Kesulitan
                    </label>
                    <select
                      value={editingQuiz.difficulty}
                      onChange={(e) =>
                        setEditingQuiz({ ...editingQuiz, difficulty: e.target.value as Difficulty })
                      }
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs sm:text-sm text-white font-bold focus:outline-none"
                    >
                      <option value="Mudah">Mudah</option>
                      <option value="Sedang">Sedang</option>
                      <option value="Tantangan">Tantangan</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Questions List Header */}
              <div className="flex items-center justify-between pt-2">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm sm:text-base font-black text-white">
                    Daftar Butir Pertanyaan ({editingQuiz.questions.length} Soal)
                  </h3>
                  <span className="text-xs text-slate-400">
                    Klik untuk membuka dan mengedit butir soal
                  </span>
                </div>

                <button
                  type="button"
                  onClick={handleAddQuestion}
                  className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-md"
                >
                  <Plus className="w-4 h-4" />
                  <span>Tambah Soal</span>
                </button>
              </div>

              {/* Accordion / List of Questions */}
              <div className="space-y-3">
                {editingQuiz.questions.map((q, idx) => {
                  const isExpanded = expandedQuestionIdx === idx;

                  return (
                    <div
                      key={q.id || idx}
                      className="rounded-2xl bg-slate-950 border border-slate-800 overflow-hidden transition-all"
                    >
                      {/* Question Item Summary Bar */}
                      <div
                        onClick={() => setExpandedQuestionIdx(isExpanded ? null : idx)}
                        className="p-3.5 sm:p-4 flex items-center justify-between gap-3 cursor-pointer hover:bg-slate-800/40 select-none"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span className="w-7 h-7 rounded-lg bg-indigo-600 text-white font-black text-xs flex items-center justify-center shrink-0">
                            {idx + 1}
                          </span>
                          <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-slate-800 text-slate-300 border border-slate-700">
                            {q.type === 'multiple_choice' && 'Pilgan'}
                            {q.type === 'true_false' && 'Benar/Salah'}
                            {q.type === 'fill_blank' && 'Isian'}
                            {q.type === 'matching' && 'Jodohkan'}
                          </span>
                          <span className="text-xs sm:text-sm font-bold text-slate-200 truncate">
                            {q.question || '(Belum ada teks pertanyaan)'}
                          </span>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleMoveQuestion(idx, 'up');
                            }}
                            disabled={idx === 0}
                            className="p-1.5 rounded text-slate-400 hover:text-white disabled:opacity-20 cursor-pointer"
                            title="Pindah Naik"
                          >
                            <ArrowUp className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleMoveQuestion(idx, 'down');
                            }}
                            disabled={idx === editingQuiz.questions.length - 1}
                            className="p-1.5 rounded text-slate-400 hover:text-white disabled:opacity-20 cursor-pointer"
                            title="Pindah Turun"
                          >
                            <ArrowDown className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDuplicateQuestion(idx);
                            }}
                            className="p-1.5 rounded text-slate-400 hover:text-indigo-400 cursor-pointer"
                            title="Duplikat Soal"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteQuestion(idx);
                            }}
                            className="p-1.5 rounded text-rose-400 hover:text-rose-200 cursor-pointer"
                            title="Hapus Soal"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>

                          <span className="text-slate-500 pl-1">
                            {isExpanded ? (
                              <ChevronUp className="w-4 h-4" />
                            ) : (
                              <ChevronDown className="w-4 h-4" />
                            )}
                          </span>
                        </div>
                      </div>

                      {/* Question Details Editor when Expanded */}
                      {isExpanded && (
                        <div className="p-4 sm:p-5 border-t border-slate-800 bg-slate-900/60 space-y-4">
                          {/* Format Selector & Question Text */}
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <div>
                              <label className="block text-xs font-bold text-slate-400 mb-1">
                                Format Soal
                              </label>
                              <select
                                value={q.type}
                                onChange={(e) => {
                                  const newType = e.target.value as QuestionType;
                                  let newCorrect = q.correctAnswer;
                                  if (newType === 'true_false') newCorrect = 'Benar';
                                  if (newType === 'multiple_choice' && q.options) {
                                    newCorrect = q.options[0] || '';
                                  }
                                  handleUpdateQuestion(idx, { type: newType, correctAnswer: newCorrect });
                                }}
                                className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs font-bold text-white focus:outline-none"
                              >
                                <option value="multiple_choice">Pilihan Ganda (Multiple Choice)</option>
                                <option value="true_false">Benar / Salah (True / False)</option>
                                <option value="fill_blank">Isian Singkat (Fill in Blank)</option>
                                <option value="matching">Menjodohkan (Matching Pairs)</option>
                              </select>
                            </div>

                            <div className="sm:col-span-2">
                              <label className="block text-xs font-bold text-slate-400 mb-1">
                                Teks Pertanyaan *
                              </label>
                              <textarea
                                rows={2}
                                value={q.question}
                                onChange={(e) => handleUpdateQuestion(idx, { question: e.target.value })}
                                placeholder="Tuliskan pertanyaan soal di sini..."
                                className="w-full px-3.5 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs sm:text-sm text-white focus:outline-none focus:border-indigo-500 font-bold"
                              />
                            </div>
                          </div>

                          {/* Specific Format Editor */}
                          {/* 1. Multiple Choice */}
                          {q.type === 'multiple_choice' && (() => {
                            const opts = q.options && q.options.length > 0 ? q.options : ['Opsi A', 'Opsi B', 'Opsi C', 'Opsi D'];
                            const letters = ['A', 'B', 'C', 'D', 'E'];

                            // Determine effective correct index accurately
                            let effectiveCorrectIdx = 0;
                            if (q.correctIndex !== undefined && q.correctIndex >= 0 && q.correctIndex < opts.length) {
                              effectiveCorrectIdx = q.correctIndex;
                            } else {
                              const foundIdx = opts.findIndex(
                                (opt) => opt.trim().toLowerCase() === (q.correctAnswer || '').trim().toLowerCase()
                              );
                              if (foundIdx !== -1) effectiveCorrectIdx = foundIdx;
                            }

                            const handleSetCorrectOption = (optIdx: number) => {
                              const targetOpt = opts[optIdx] || '';
                              handleUpdateQuestion(idx, {
                                correctIndex: optIdx,
                                correctAnswer: targetOpt,
                              });
                              sounds.playClick();
                            };

                            const handleUpdateOptionText = (optIdx: number, val: string) => {
                              const newOpts = [...opts];
                              newOpts[optIdx] = val;
                              const isThisCorrect = effectiveCorrectIdx === optIdx;
                              const patch: Partial<Question> = { options: newOpts };
                              if (isThisCorrect) {
                                patch.correctAnswer = val;
                                patch.correctIndex = optIdx;
                              }
                              handleUpdateQuestion(idx, patch);
                            };

                            const handleAddOption = () => {
                              if (opts.length >= 5) return;
                              const nextLetter = letters[opts.length] || 'X';
                              handleUpdateQuestion(idx, { options: [...opts, `Pilihan ${nextLetter}`] });
                              sounds.playClick();
                            };

                            const handleRemoveOption = (optIdx: number) => {
                              if (opts.length <= 2) return;
                              const newOpts = opts.filter((_, i) => i !== optIdx);
                              let nextCorrect = effectiveCorrectIdx;
                              if (optIdx === effectiveCorrectIdx) {
                                nextCorrect = Math.max(0, optIdx - 1);
                              } else if (optIdx < effectiveCorrectIdx) {
                                nextCorrect = effectiveCorrectIdx - 1;
                              }
                              handleUpdateQuestion(idx, {
                                options: newOpts,
                                correctIndex: nextCorrect,
                                correctAnswer: newOpts[nextCorrect] || '',
                              });
                              sounds.playClick();
                            };

                            return (
                              <div className="p-4 rounded-2xl bg-slate-800/40 border border-slate-700/60 space-y-3.5">
                                {/* Header with Dropdown & Quick Selector */}
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-700/60 pb-3">
                                  <div>
                                    <label className="text-xs font-black text-emerald-400 flex items-center gap-1.5">
                                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                                      <span>Kunci Jawaban Benar (Pilihan Ganda):</span>
                                    </label>
                                    <p className="text-[11px] text-slate-400 mt-0.5">
                                      Klik radio, huruf, atau tombol "Jadikan Kunci" pada opsi yang benar di bawah.
                                    </p>
                                  </div>

                                  <div className="flex items-center gap-2">
                                    <span className="text-[11px] font-bold text-slate-400">Pilih Kunci:</span>
                                    <select
                                      value={effectiveCorrectIdx}
                                      onChange={(e) => handleSetCorrectOption(parseInt(e.target.value, 10))}
                                      className="bg-emerald-950/80 border border-emerald-500/60 text-emerald-300 font-black text-xs px-3 py-1.5 rounded-xl cursor-pointer"
                                    >
                                      {opts.map((opt, oIdx) => (
                                        <option key={oIdx} value={oIdx}>
                                          Opsi {letters[oIdx]}: {opt ? opt.slice(0, 32) : `(Pilihan ${letters[oIdx]})`}
                                        </option>
                                      ))}
                                    </select>
                                  </div>
                                </div>

                                {/* Quick Switch Pills Row */}
                                <div className="flex flex-wrap items-center gap-2 py-1">
                                  <span className="text-[11px] font-extrabold text-slate-400">Pilihan Cepat Kunci:</span>
                                  {opts.map((_, oIdx) => {
                                    const isSelected = effectiveCorrectIdx === oIdx;
                                    return (
                                      <button
                                        key={oIdx}
                                        type="button"
                                        onClick={() => handleSetCorrectOption(oIdx)}
                                        className={`px-3 py-1 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer ${
                                          isSelected
                                            ? 'bg-emerald-500 text-white shadow-md shadow-emerald-950/40 ring-2 ring-emerald-400'
                                            : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 border border-slate-700'
                                        }`}
                                      >
                                        {isSelected ? (
                                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                                        ) : (
                                          <span className="w-2 h-2 rounded-full bg-slate-600" />
                                        )}
                                        <span>Opsi {letters[oIdx]}</span>
                                      </button>
                                    );
                                  })}

                                  {opts.length < 5 && (
                                    <button
                                      type="button"
                                      onClick={handleAddOption}
                                      className="px-2.5 py-1 rounded-xl text-xs font-bold text-indigo-400 hover:text-indigo-300 bg-indigo-950/40 border border-indigo-500/30 flex items-center gap-1 cursor-pointer ml-auto"
                                    >
                                      <Plus className="w-3.5 h-3.5" />
                                      <span>Tambah Opsi ({letters[opts.length]})</span>
                                    </button>
                                  )}
                                </div>

                                {/* Options Cards List */}
                                <div className="space-y-2.5">
                                  {opts.map((opt, optIdx) => {
                                    const isCorrect = effectiveCorrectIdx === optIdx;

                                    return (
                                      <div
                                        key={optIdx}
                                        className={`p-3 rounded-2xl border-2 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 ${
                                          isCorrect
                                            ? 'bg-emerald-950/70 border-emerald-500 ring-2 ring-emerald-500/40 shadow-lg shadow-emerald-950/30'
                                            : 'bg-slate-800/80 border-slate-700/80 hover:border-slate-600'
                                        }`}
                                      >
                                        <div className="flex items-center gap-2.5 flex-1 min-w-0">
                                          {/* Radio button to switch correct answer */}
                                          <input
                                            type="radio"
                                            name={`mc-correct-radio-${q.id || idx}`}
                                            checked={isCorrect}
                                            onChange={() => handleSetCorrectOption(optIdx)}
                                            className="w-4 h-4 accent-emerald-500 cursor-pointer shrink-0"
                                            title={`Pilih Opsi ${letters[optIdx]} sebagai Kunci Jawaban Benar`}
                                          />

                                          {/* Letter Badge Button */}
                                          <button
                                            type="button"
                                            onClick={() => handleSetCorrectOption(optIdx)}
                                            className={`w-7 h-7 rounded-xl font-black text-xs flex items-center justify-center cursor-pointer transition-all shrink-0 ${
                                              isCorrect
                                                ? 'bg-emerald-500 text-white shadow-md ring-2 ring-emerald-400'
                                                : 'bg-slate-700 hover:bg-slate-600 text-slate-300 hover:text-white'
                                            }`}
                                            title={`Klik untuk memilih Opsi ${letters[optIdx]} sebagai Kunci Jawaban Benar`}
                                          >
                                            {letters[optIdx]}
                                          </button>

                                          {/* Text input */}
                                          <input
                                            type="text"
                                            value={opt}
                                            onChange={(e) => handleUpdateOptionText(optIdx, e.target.value)}
                                            className="flex-1 bg-slate-900/70 border border-slate-700/80 focus:border-indigo-500 rounded-xl px-3 py-1.5 text-xs sm:text-sm text-white focus:outline-none font-bold"
                                            placeholder={`Tulis pilihan jawaban untuk Opsi ${letters[optIdx]}...`}
                                          />
                                        </div>

                                        {/* Status & Action Badge/Button */}
                                        <div className="flex items-center gap-2 shrink-0 self-end sm:self-center pl-7 sm:pl-0">
                                          {isCorrect ? (
                                            <span className="px-3 py-1.5 rounded-xl bg-emerald-500 text-white font-black text-xs flex items-center gap-1.5 shadow-md">
                                              <Check className="w-3.5 h-3.5 stroke-[3]" />
                                              <span>KUNCI BENAR</span>
                                            </span>
                                          ) : (
                                            <button
                                              type="button"
                                              onClick={() => handleSetCorrectOption(optIdx)}
                                              className="px-3 py-1.5 rounded-xl bg-slate-700 hover:bg-emerald-600 text-slate-200 hover:text-white font-extrabold text-xs flex items-center gap-1 cursor-pointer transition-all border border-slate-600 hover:border-emerald-500"
                                            >
                                              <span>Jadikan Kunci</span>
                                            </button>
                                          )}

                                          {opts.length > 2 && (
                                            <button
                                              type="button"
                                              onClick={() => handleRemoveOption(optIdx)}
                                              className="p-1.5 text-slate-500 hover:text-rose-400 rounded-lg hover:bg-rose-950/40 transition-colors cursor-pointer"
                                              title="Hapus pilihan opsi ini"
                                            >
                                              <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                          )}
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            );
                          })()}

                          {/* 2. True / False */}
                          {q.type === 'true_false' && (() => {
                            const isCurrentTrue =
                              q.isTrue !== undefined
                                ? q.isTrue
                                : (q.correctAnswer || '').toLowerCase() === 'benar';

                            return (
                              <div className="p-4 rounded-2xl bg-slate-800/40 border border-slate-700/60 space-y-3">
                                <label className="text-xs font-black text-indigo-300 flex items-center gap-1.5">
                                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                                  <span>Pilih Kunci Jawaban Pernyataan Ini:</span>
                                </label>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      handleUpdateQuestion(idx, {
                                        isTrue: true,
                                        correctAnswer: 'Benar',
                                      });
                                      sounds.playClick();
                                    }}
                                    className={`p-3.5 rounded-2xl border-2 font-black text-sm flex items-center justify-between cursor-pointer transition-all ${
                                      isCurrentTrue
                                        ? 'bg-emerald-950/80 border-emerald-500 text-emerald-300 ring-4 ring-emerald-500/20 shadow-lg'
                                        : 'bg-slate-800/60 border-slate-700 text-slate-400 hover:text-white hover:border-slate-600'
                                    }`}
                                  >
                                    <div className="flex items-center gap-2.5">
                                      <div
                                        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                          isCurrentTrue
                                            ? 'border-emerald-400 bg-emerald-500 text-white'
                                            : 'border-slate-600'
                                        }`}
                                      >
                                        {isCurrentTrue && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                                      </div>
                                      <span>BENAR (True)</span>
                                    </div>
                                    {isCurrentTrue ? (
                                      <span className="text-[11px] px-2 py-0.5 rounded-md bg-emerald-500 text-white font-extrabold uppercase">
                                        Kunci Benar
                                      </span>
                                    ) : (
                                      <span className="text-[11px] text-slate-500">Klik untuk Pilih</span>
                                    )}
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => {
                                      handleUpdateQuestion(idx, {
                                        isTrue: false,
                                        correctAnswer: 'Salah',
                                      });
                                      sounds.playClick();
                                    }}
                                    className={`p-3.5 rounded-2xl border-2 font-black text-sm flex items-center justify-between cursor-pointer transition-all ${
                                      !isCurrentTrue
                                        ? 'bg-rose-950/80 border-rose-500 text-rose-300 ring-4 ring-rose-500/20 shadow-lg'
                                        : 'bg-slate-800/60 border-slate-700 text-slate-400 hover:text-white hover:border-slate-600'
                                    }`}
                                  >
                                    <div className="flex items-center gap-2.5">
                                      <div
                                        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                          !isCurrentTrue
                                            ? 'border-rose-400 bg-rose-500 text-white'
                                            : 'border-slate-600'
                                        }`}
                                      >
                                        {!isCurrentTrue && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                                      </div>
                                      <span>SALAH (False)</span>
                                    </div>
                                    {!isCurrentTrue ? (
                                      <span className="text-[11px] px-2 py-0.5 rounded-md bg-rose-500 text-white font-extrabold uppercase">
                                        Kunci Benar
                                      </span>
                                    ) : (
                                      <span className="text-[11px] text-slate-500">Klik untuk Pilih</span>
                                    )}
                                  </button>
                                </div>
                              </div>
                            );
                          })()}

                          {/* 3. Fill in Blank */}
                          {q.type === 'fill_blank' && (
                            <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/60 space-y-3">
                              <div>
                                <label className="block text-xs font-bold text-emerald-300 mb-1">
                                  Kunci Jawaban Baku *
                                </label>
                                <input
                                  type="text"
                                  value={q.correctAnswer}
                                  onChange={(e) =>
                                    handleUpdateQuestion(idx, { correctAnswer: e.target.value })
                                  }
                                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white font-black focus:outline-none focus:border-emerald-500"
                                  placeholder="Contoh: Fotosintesis"
                                />
                              </div>

                              <div>
                                <label className="block text-xs font-bold text-slate-400 mb-1">
                                  Alternatif Variasi Jawaban Diterima (Pisahkan dengan koma)
                                </label>
                                <input
                                  type="text"
                                  value={(q.acceptableAnswers || []).join(', ')}
                                  onChange={(e) =>
                                    handleUpdateQuestion(idx, {
                                      acceptableAnswers: e.target.value
                                        .split(',')
                                        .map((s) => s.trim())
                                        .filter(Boolean),
                                    })
                                  }
                                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-slate-300 focus:outline-none"
                                  placeholder="Contoh: proses fotosintesis, fotosintesa"
                                />
                              </div>
                            </div>
                          )}

                          {/* 4. Matching */}
                          {q.type === 'matching' && (
                            <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/60 space-y-3">
                              <div className="flex items-center justify-between">
                                <label className="text-xs font-extrabold text-amber-300">
                                  Pasangan Menjodohkan (Kolom Kiri ➔ Kolom Kanan):
                                </label>

                                <button
                                  type="button"
                                  onClick={() => {
                                    const currentPairs = q.matchingPairs || [];
                                    const newPair: MatchingPair = {
                                      id: String(currentPairs.length + 1),
                                      left: '',
                                      right: '',
                                    };
                                    handleUpdateQuestion(idx, {
                                      matchingPairs: [...currentPairs, newPair],
                                    });
                                  }}
                                  className="text-[11px] font-bold text-amber-400 hover:text-amber-300 cursor-pointer"
                                >
                                  + Tambah Pasangan
                                </button>
                              </div>

                              <div className="space-y-2">
                                {(q.matchingPairs || []).map((pair, pIdx) => (
                                  <div
                                    key={pair.id || pIdx}
                                    className="flex items-center gap-2 p-2 rounded-xl bg-slate-800 border border-slate-700"
                                  >
                                    <input
                                      type="text"
                                      value={pair.left}
                                      onChange={(e) => {
                                        const pairs = [...(q.matchingPairs || [])];
                                        pairs[pIdx].left = e.target.value;
                                        handleUpdateQuestion(idx, { matchingPairs: pairs });
                                      }}
                                      placeholder="Pernyataan Kiri (Konsep)"
                                      className="flex-1 bg-transparent text-xs text-white font-bold focus:outline-none"
                                    />
                                    <span className="text-amber-400 font-black">➔</span>
                                    <input
                                      type="text"
                                      value={pair.right}
                                      onChange={(e) => {
                                        const pairs = [...(q.matchingPairs || [])];
                                        pairs[pIdx].right = e.target.value;
                                        handleUpdateQuestion(idx, { matchingPairs: pairs });
                                      }}
                                      placeholder="Pasangan Kanan (Jawaban)"
                                      className="flex-1 bg-transparent text-xs text-white font-bold focus:outline-none"
                                    />
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const pairs = (q.matchingPairs || []).filter(
                                          (_, i) => i !== pIdx
                                        );
                                        handleUpdateQuestion(idx, { matchingPairs: pairs });
                                      }}
                                      className="p-1 text-slate-500 hover:text-rose-400 cursor-pointer"
                                      title="Hapus pasangan ini"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Explanation and Hint */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                            <div>
                              <label className="block text-xs font-bold text-indigo-300 mb-1">
                                Pembahasan / Penjelasan Materi
                              </label>
                              <textarea
                                rows={2}
                                value={q.explanation}
                                onChange={(e) => handleUpdateQuestion(idx, { explanation: e.target.value })}
                                placeholder="Jelaskan alasan mengapa jawaban tersebut benar..."
                                className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-slate-300 focus:outline-none focus:border-indigo-500"
                              />
                            </div>

                            <div>
                              <label className="block text-xs font-bold text-amber-300 mb-1">
                                Petunjuk / Rumus Bantuan
                              </label>
                              <textarea
                                rows={2}
                                value={q.hint}
                                onChange={(e) => handleUpdateQuestion(idx, { hint: e.target.value })}
                                placeholder="Petunjuk singkat jika siswa kesulitan..."
                                className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-slate-300 focus:outline-none focus:border-amber-500"
                              />
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Modal Sticky Footer */}
            <div className="p-4 sm:p-5 border-t border-slate-800 flex items-center justify-between gap-3 shrink-0 bg-slate-900">
              <button
                type="button"
                onClick={() => setEditingQuiz(null)}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-bold text-xs cursor-pointer border border-slate-700 transition-colors"
              >
                Batal
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    if (editingQuiz) {
                      onOpenWorksheet(editingQuiz);
                    }
                  }}
                  className="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer border border-slate-700"
                  title="Cetak atau Simpan Lembar Kerja Soal ke PDF"
                >
                  <Printer className="w-4 h-4 text-emerald-400" />
                  <span>Cetak / PDF</span>
                </button>

                <button
                  type="button"
                  onClick={handleAddQuestion}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-indigo-300 hover:text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer border border-indigo-500/30"
                >
                  <Plus className="w-4 h-4" />
                  <span>Tambah Soal</span>
                </button>

                <button
                  type="button"
                  onClick={handleSaveEditedQuiz}
                  className="btn-3d px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs sm:text-sm flex items-center gap-2 cursor-pointer shadow-lg shadow-emerald-950/40"
                >
                  <Save className="w-4 h-4" />
                  <span>Simpan Semua Perubahan</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {quizToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border-2 border-rose-500/50 rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-rose-500/20 text-rose-400 flex items-center justify-center shrink-0">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-black text-white">Hapus Paket Soal?</h3>
                <p className="text-xs text-slate-400 line-clamp-1">{quizToDelete.title}</p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Tindakan ini akan menghapus paket kuis beserta semua butir soal di dalamnya secara
              permanen.
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setQuizToDelete(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-bold text-xs cursor-pointer"
              >
                Batal
              </button>

              <button
                type="button"
                onClick={() => {
                  if (onDeleteQuiz) onDeleteQuiz(quizToDelete.id);
                  setQuizToDelete(null);
                  sounds.playClick();
                }}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-black text-xs cursor-pointer shadow-md"
              >
                Ya, Hapus Kuis
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
