import React, { useState } from 'react';
import { QuizSet, Question, QuestionType, Jenjang, MataPelajaran, Difficulty, MatchingPair } from '../../types';
import { sounds } from '../../utils/audio';
import {
  Sparkles,
  Plus,
  Trash2,
  Save,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Layers,
  Wand2,
  FileText,
  Loader2,
  GraduationCap,
  Copy,
  Infinity,
  Edit3,
  Check,
  ChevronUp,
  ChevronDown,
} from 'lucide-react';

export const GRADE_CLASSES_MAP: Record<Jenjang, { id: string; name: string; fase?: string }[]> = {
  SD: [
    { id: 'Semua Kelas SD', name: 'Semua Tingkat SD (Kelas 1 - 6)' },
    { id: 'Kelas 1 SD', name: 'Kelas 1 SD', fase: 'Fase A (Awal Angka & Membaca)' },
    { id: 'Kelas 2 SD', name: 'Kelas 2 SD', fase: 'Fase A (Dasar)' },
    { id: 'Kelas 3 SD', name: 'Kelas 3 SD', fase: 'Fase B (Pemahaman)' },
    { id: 'Kelas 4 SD', name: 'Kelas 4 SD', fase: 'Fase B (Menengah)' },
    { id: 'Kelas 5 SD', name: 'Kelas 5 SD', fase: 'Fase C (Lanjutan)' },
    { id: 'Kelas 6 SD', name: 'Kelas 6 SD', fase: 'Fase C (Ujian Akhir & Kelulusan)' },
  ],
  SMP: [
    { id: 'Semua Kelas SMP', name: 'Semua Tingkat SMP (Kelas 7 - 9)' },
    { id: 'Kelas 7 SMP', name: 'Kelas 7 SMP', fase: 'Fase D (Transisi & Adaptasi)' },
    { id: 'Kelas 8 SMP', name: 'Kelas 8 SMP', fase: 'Fase D (Pendalaman Konsep)' },
    { id: 'Kelas 9 SMP', name: 'Kelas 9 SMP', fase: 'Fase D (Persiapan Masuk SMA)' },
  ],
  SMA: [
    { id: 'Semua Kelas SMA', name: 'Semua Tingkat SMA/SMK (Kelas 10 - 12)' },
    { id: 'Kelas 10 SMA', name: 'Kelas 10 SMA/SMK', fase: 'Fase E (Eksplorasi Minat)' },
    { id: 'Kelas 11 SMA', name: 'Kelas 11 SMA/SMK', fase: 'Fase F (Peminatan Lanjutan)' },
    { id: 'Kelas 12 SMA', name: 'Kelas 12 SMA/SMK', fase: 'Fase F (Persiapan SNBT & PTN)' },
  ],
  'Kuliah / Umum': [
    { id: 'Umum / Semua Usia', name: 'Umum / Semua Usia' },
    { id: 'Tingkat Mahasiswa', name: 'Tingkat Kuliah / Mahasiswa' },
    { id: 'Tingkat Dasar (Pemula)', name: 'Tingkat Dasar (Pemula)' },
    { id: 'Tingkat Menengah', name: 'Tingkat Menengah (Intermediate)' },
    { id: 'Tingkat Mahir', name: 'Tingkat Lanjut (Mahir / Profesional)' },
  ],
};

interface Props {
  onSaveQuiz: (newQuiz: QuizSet) => void;
  onCancel: () => void;
}

export const QuestionCreator: React.FC<Props> = ({ onSaveQuiz, onCancel }) => {
  const [mode, setMode] = useState<'ai' | 'manual'>('ai');

  // AI Generator state
  const [aiTopic, setAiTopic] = useState('');
  const [aiGrade, setAiGrade] = useState<Jenjang>('SMP');
  const [aiTargetClass, setAiTargetClass] = useState<string>('Kelas 7 SMP');
  const [aiSubject, setAiSubject] = useState<MataPelajaran>('IPA / Sains');
  const [aiCount, setAiCount] = useState<number>(6);
  const [isCustomCount, setIsCustomCount] = useState<boolean>(false);
  const [aiDifficulty, setAiDifficulty] = useState<Difficulty>('Sedang');
  const [aiFormat, setAiFormat] = useState<string>('campuran'); // 'campuran' | 'multiple_choice' | 'true_false' | 'fill_blank' | 'matching'
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiNotice, setAiNotice] = useState<string | null>(null);

  // Manual / Staging state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<MataPelajaran>('IPA / Sains');
  const [grade, setGrade] = useState<Jenjang>('SMP');
  const [targetClass, setTargetClass] = useState<string>('Kelas 7 SMP');
  const [difficulty, setDifficulty] = useState<Difficulty>('Sedang');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [editingPackageQuestionIdx, setEditingPackageQuestionIdx] = useState<number | null>(null);

  const handleUpdatePackageQuestion = (idx: number, patch: Partial<Question>) => {
    const updated = [...questions];
    updated[idx] = { ...updated[idx], ...patch };
    setQuestions(updated);
  };

  // Current editing question in manual form
  const [qType, setQType] = useState<QuestionType>('multiple_choice');
  const [qText, setQText] = useState('');
  const [qOptions, setQOptions] = useState<string[]>(['', '', '', '']);
  const [qCorrectIdx, setQCorrectIdx] = useState<number>(0);
  const [qIsTrue, setQIsTrue] = useState<boolean>(true);
  const [qFillAnswer, setQFillAnswer] = useState('');
  const [qFillVariations, setQFillVariations] = useState('');
  const [qMatchingPairs, setQMatchingPairs] = useState<MatchingPair[]>([
    { id: '1', left: '', right: '' },
    { id: '2', left: '', right: '' },
    { id: '3', left: '', right: '' },
  ]);
  const [qExplanation, setQExplanation] = useState('');
  const [qHint, setQHint] = useState('');
  const [qAnagram, setQAnagram] = useState('');

  // AI Generation handler
  const handleGenerateAI = async () => {
    if (!aiTopic.trim()) {
      setAiError('Mohon isi topik soal yang ingin dibuat');
      return;
    }

    setIsAiLoading(true);
    setAiError(null);
    setAiNotice(null);
    sounds.playClick();

    try {
      const res = await fetch('/api/generate-questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: aiTopic,
          grade: aiGrade,
          targetClass: aiTargetClass,
          subject: aiSubject,
          count: aiCount,
          difficulty: aiDifficulty,
          questionFormat: aiFormat,
        }),
      });

      const json = await res.json();
      if (!res.ok || json.error) {
        throw new Error(json.error || 'Gagal memproses pembuatan soal dengan AI');
      }

      if (json.notice) {
        setAiNotice(json.notice);
      }

      const generated = json.data;
      setTitle(generated.title || `Kuis: ${aiTopic}`);
      setDescription(generated.description || `Paket soal ${aiSubject} tentang ${aiTopic}`);
      setCategory(aiSubject);
      setGrade(aiGrade);
      setTargetClass(aiTargetClass);
      setDifficulty(aiDifficulty);

      // Map questions
      const parsedQuestions: Question[] = (generated.questions || []).map((q: any, i: number) => {
        const type: QuestionType = ['multiple_choice', 'true_false', 'fill_blank', 'matching'].includes(
          q.type
        )
          ? q.type
          : 'multiple_choice';

        let correctAns = q.correctAnswer || '';
        if (type === 'multiple_choice' && q.options && q.correctIndex !== undefined) {
          correctAns = q.options[q.correctIndex] || correctAns;
        } else if (type === 'true_false') {
          correctAns = q.isTrue ? 'Benar' : 'Salah';
        }

        const pairs: MatchingPair[] = (q.matchingPairs || []).map((p: any, pIdx: number) => ({
          id: `mp-${i}-${pIdx}`,
          left: p.left || '',
          right: p.right || '',
        }));

        return {
          id: `ai-q-${Date.now()}-${i}`,
          type,
          question: q.question,
          options: q.options || (type === 'multiple_choice' ? ['Opsi A', 'Opsi B', 'Opsi C', 'Opsi D'] : undefined),
          correctIndex: q.correctIndex !== undefined ? q.correctIndex : 0,
          isTrue: q.isTrue !== undefined ? q.isTrue : true,
          acceptableAnswers: q.acceptableAnswers || [correctAns],
          matchingPairs: pairs.length > 0 ? pairs : undefined,
          correctAnswer: correctAns,
          explanation: q.explanation || 'Pembahasan mendalam konsep.',
          hint: q.hint || 'Petunjuk konsep materi.',
          anagramWord: q.anagramWord || 'KUIS',
          subject: aiSubject,
          grade: aiGrade,
          targetClass: aiTargetClass,
          difficulty: aiDifficulty,
        };
      });

      setQuestions(parsedQuestions);
      setMode('manual'); // Switch to preview/edit mode
      sounds.playSuccess();
    } catch (err: any) {
      console.error(err);
      const rawMsg = err.message || '';
      let userMsg = rawMsg;
      if (rawMsg.includes('503') || rawMsg.includes('high demand') || rawMsg.includes('UNAVAILABLE')) {
        userMsg =
          'Server Google AI sedang mengalami lonjakan antrean trafik (503 High Demand). Sistem EduZone telah mengaktifkan perlindungan multi-model dan generator cadangan. Silakan coba klik tombol Buat lagi.';
      } else if (rawMsg.includes('quota') || rawMsg.includes('Resource exhausted') || rawMsg.includes('429')) {
        userMsg =
          'Batas kuota harian server AI sedang terisi penuh. Sistem telah beralih ke generator kurikulum pintar cadangan.';
      }
      setAiError(userMsg);
      sounds.playError();
    } finally {
      setIsAiLoading(false);
    }
  };

  // Add question manually
  const handleAddManualQuestion = () => {
    if (!qText.trim()) {
      alert('Teks pertanyaan wajib diisi');
      return;
    }

    sounds.playClick();
    let correctAns = '';
    let pairs: MatchingPair[] | undefined = undefined;
    let acceptable: string[] | undefined = undefined;

    if (qType === 'multiple_choice') {
      if (qOptions.some((o) => !o.trim())) {
        alert('Semua 4 pilihan jawaban harus diisi');
        return;
      }
      correctAns = qOptions[qCorrectIdx];
    } else if (qType === 'true_false') {
      correctAns = qIsTrue ? 'Benar' : 'Salah';
    } else if (qType === 'fill_blank') {
      if (!qFillAnswer.trim()) {
        alert('Kunci jawaban isian singkat wajib diisi');
        return;
      }
      correctAns = qFillAnswer.trim();
      const vars = qFillVariations
        .split(',')
        .map((v) => v.trim())
        .filter(Boolean);
      acceptable = [correctAns, ...vars];
    } else if (qType === 'matching') {
      const validPairs = qMatchingPairs.filter((p) => p.left.trim() && p.right.trim());
      if (validPairs.length < 2) {
        alert('Minimal sediakan 2 pasang konsep untuk dijodohkan');
        return;
      }
      pairs = validPairs;
      correctAns = 'Semua pasangan cocok';
    }

    const newQ: Question = {
      id: `manual-q-${Date.now()}`,
      type: qType,
      question: qText.trim(),
      options: qType === 'multiple_choice' ? [...qOptions] : undefined,
      correctIndex: qType === 'multiple_choice' ? qCorrectIdx : undefined,
      isTrue: qType === 'true_false' ? qIsTrue : undefined,
      acceptableAnswers: acceptable,
      matchingPairs: pairs,
      correctAnswer: correctAns,
      explanation: qExplanation.trim() || 'Pembahasan materi pembelajaran.',
      hint: qHint.trim() || 'Petunjuk soal.',
      anagramWord: qAnagram.trim() || undefined,
      subject: category,
      grade: grade,
      targetClass: targetClass,
      difficulty: difficulty,
    };

    setQuestions([...questions, newQ]);

    // Reset inputs
    setQText('');
    setQOptions(['', '', '', '']);
    setQFillAnswer('');
    setQFillVariations('');
    setQMatchingPairs([
      { id: '1', left: '', right: '' },
      { id: '2', left: '', right: '' },
      { id: '3', left: '', right: '' },
    ]);
    setQExplanation('');
    setQHint('');
    setQAnagram('');
  };

  const handleRemoveQuestion = (id: string) => {
    sounds.playClick();
    setQuestions(questions.filter((q) => q.id !== id));
  };

  const handleDuplicateQuestion = (q: Question) => {
    sounds.playClick();
    const cloned: Question = {
      ...q,
      id: `manual-q-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      question: `${q.question} (Salinan)`,
      options: q.options ? [...q.options] : undefined,
      matchingPairs: q.matchingPairs
        ? q.matchingPairs.map((p) => ({ ...p, id: `mp-clone-${Date.now()}-${Math.random()}` }))
        : undefined,
      acceptableAnswers: q.acceptableAnswers ? [...q.acceptableAnswers] : undefined,
    };
    setQuestions([...questions, cloned]);
  };

  const handleSaveQuizSet = () => {
    if (!title.trim()) {
      alert('Judul paket soal wajib diisi');
      return;
    }
    if (questions.length === 0) {
      alert('Paket soal harus memiliki minimal 1 pertanyaan');
      return;
    }

    sounds.playWin();
    const newQuiz: QuizSet = {
      id: `custom-quiz-${Date.now()}`,
      title: title.trim(),
      description: description.trim() || `Paket soal buatan sendiri`,
      category,
      grade,
      targetClass,
      difficulty,
      icon: 'BookOpen',
      color: 'from-indigo-600 to-sky-700',
      questions,
      playCount: 1,
      isCustom: true,
      createdAt: new Date().toLocaleDateString('id-ID'),
    };

    onSaveQuiz(newQuiz);
  };

  return (
    <div className="w-full max-w-5xl mx-auto py-4 px-4 space-y-6">
      {/* Header Mode Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-4 md:p-5 rounded-3xl shadow-xl">
        <div>
          <h2 className="text-xl md:text-2xl font-black text-white flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-amber-400" />
            <span>
              Studio Pembuat Soal{' '}
              <span className="bg-gradient-to-r from-amber-400 via-rose-400 to-cyan-300 bg-clip-text text-transparent">
                EduZone
              </span>
            </span>
            <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-black uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              <Infinity className="w-3.5 h-3.5" />
              <span>Tanpa Batas</span>
            </span>
          </h2>
          <p className="text-xs md:text-sm text-slate-400">
            Dukung 4 format: Pilihan Ganda, Benar/Salah, Isian Singkat, & Menjodohkan • Kapasitas Soal Bebas
          </p>
        </div>

        <div className="flex items-center p-1 bg-slate-800 rounded-2xl border border-slate-700/80">
          <button
            type="button"
            onClick={() => setMode('ai')}
            className={`px-4 py-2 rounded-xl text-xs md:text-sm font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              mode === 'ai'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Wand2 className="w-4 h-4" />
            <span>AI Generator</span>
          </button>

          <button
            type="button"
            onClick={() => setMode('manual')}
            className={`px-4 py-2 rounded-xl text-xs md:text-sm font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              mode === 'manual'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Editor Manual ({questions.length})</span>
          </button>
        </div>
      </div>

      {/* AI GENERATOR PANEL */}
      {mode === 'ai' && (
        <div className="bg-slate-900/90 border-2 border-indigo-500/30 rounded-3xl p-6 md:p-8 space-y-6 shadow-2xl">
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Wand2 className="w-5 h-5 text-indigo-400" />
              <span>Buat Paket Soal Otomatis dengan AI</span>
            </h3>
            <p className="text-xs text-slate-400">
              Cukup masukkan topik materi yang diajarkan, AI akan menyusun soal lengkap dengan pembahasan edukatif.
            </p>
          </div>

          {aiError && (
            <div className="p-4 rounded-2xl bg-rose-950/40 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{aiError}</span>
            </div>
          )}

          {aiNotice && (
            <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2">
              <Sparkles className="w-4 h-4 shrink-0 text-emerald-400" />
              <span>{aiNotice}</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Topik */}
            <div className="md:col-span-2">
              <label className="text-xs font-bold text-slate-300 block mb-1.5">
                Topik Materi Pembelajaran *
              </label>
              <input
                type="text"
                value={aiTopic}
                onChange={(e) => setAiTopic(e.target.value)}
                placeholder="Contoh: Fotosintesis & Klorofil, Teorema Pythagoras, Majas Bahasa Indonesia, Perang Diponegoro..."
                className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm focus:border-indigo-400 outline-none"
              />
            </div>

            {/* Mata Pelajaran */}
            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1.5">
                Mata Pelajaran
              </label>
              <select
                value={aiSubject}
                onChange={(e) => setAiSubject(e.target.value as MataPelajaran)}
                className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm focus:border-indigo-400 outline-none"
              >
                <option value="IPA / Sains">IPA / Sains</option>
                <option value="Matematika">Matematika</option>
                <option value="Bahasa Indonesia">Bahasa Indonesia</option>
                <option value="Bahasa Inggris">Bahasa Inggris</option>
                <option value="IPS & Sejarah">IPS & Sejarah</option>
                <option value="Informatika & Logika">Informatika & Logika</option>
                <option value="Pengetahuan Umum">Pengetahuan Umum</option>
              </select>
            </div>

            {/* Jenjang & Tingkatan / Kelas Spesifik */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1.5 flex items-center gap-1">
                  <span>Jenjang Pendidikan *</span>
                </label>
                <select
                  value={aiGrade}
                  onChange={(e) => {
                    const newGrade = e.target.value as Jenjang;
                    setAiGrade(newGrade);
                    const classes = GRADE_CLASSES_MAP[newGrade];
                    setAiTargetClass(classes[1]?.id || classes[0].id);
                  }}
                  className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm focus:border-indigo-400 outline-none cursor-pointer"
                >
                  <option value="SD">SD (Sekolah Dasar)</option>
                  <option value="SMP">SMP (Sekolah Menengah Pertama)</option>
                  <option value="SMA">SMA / SMK (Sekolah Menengah Atas)</option>
                  <option value="Kuliah / Umum">Kuliah / Umum</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1.5 flex items-center gap-1">
                  <GraduationCap className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Tingkatan / Kelas Sasaran *</span>
                </label>
                <select
                  value={aiTargetClass}
                  onChange={(e) => setAiTargetClass(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-indigo-500/50 text-white text-sm focus:border-indigo-400 outline-none font-semibold cursor-pointer"
                >
                  {GRADE_CLASSES_MAP[aiGrade].map((cls) => (
                    <option key={cls.id} value={cls.id}>
                      {cls.name} {cls.fase ? `• ${cls.fase}` : ''}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Format Soal Khusus */}
            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1.5">
                Format Soal yang Diinginkan
              </label>
              <select
                value={aiFormat}
                onChange={(e) => setAiFormat(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm focus:border-indigo-400 outline-none"
              >
                <option value="campuran">Variasi Campuran (Semua 4 Format)</option>
                <option value="multiple_choice">Hanya Pilihan Ganda (4 Opsi)</option>
                <option value="true_false">Hanya Benar / Salah</option>
                <option value="fill_blank">Hanya Isian Singkat</option>
                <option value="matching">Hanya Menjodohkan Pasangan</option>
              </select>
            </div>

            {/* Jumlah Soal (Tanpa Batas) & Kesulitan */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-slate-300 flex items-center gap-1">
                    <span>Jumlah Soal Dibuat</span>
                    <span className="text-[10px] font-black text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20 flex items-center gap-0.5">
                      <Infinity className="w-3 h-3" />
                      <span>Tanpa Batas</span>
                    </span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsCustomCount(!isCustomCount)}
                    className="text-[11px] text-indigo-400 hover:text-indigo-300 font-bold underline cursor-pointer"
                  >
                    {isCustomCount ? 'Pilih Preset' : 'Ketik Angka Bebas'}
                  </button>
                </div>

                {isCustomCount ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min={1}
                      max={100}
                      value={aiCount}
                      onChange={(e) => setAiCount(Math.max(1, parseInt(e.target.value, 10) || 1))}
                      placeholder="Masukkan jumlah soal (misal: 15, 25, 50)..."
                      className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-emerald-500/50 text-white text-sm focus:border-emerald-400 outline-none font-bold"
                    />
                    <span className="text-xs text-slate-400 font-bold whitespace-nowrap">Soal</span>
                  </div>
                ) : (
                  <select
                    value={aiCount}
                    onChange={(e) => setAiCount(Number(e.target.value))}
                    className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm focus:border-indigo-400 outline-none cursor-pointer"
                  >
                    <option value={5}>5 Soal (Cepat)</option>
                    <option value={10}>10 Soal (Standar)</option>
                    <option value={15}>15 Soal (Lengkap)</option>
                    <option value={20}>20 Soal (Ulangan Harian)</option>
                    <option value={25}>25 Soal (Ujian Bab)</option>
                    <option value={30}>30 Soal (Try Out)</option>
                    <option value={50}>50 Soal (Bank Soal Besar)</option>
                  </select>
                )}
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1.5">
                  Tingkat Kesulitan
                </label>
                <select
                  value={aiDifficulty}
                  onChange={(e) => setAiDifficulty(e.target.value as Difficulty)}
                  className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm focus:border-indigo-400 outline-none cursor-pointer"
                >
                  <option value="Mudah">Mudah</option>
                  <option value="Sedang">Sedang</option>
                  <option value="Tantangan">Tantangan</option>
                </select>
              </div>
            </div>
          </div>

          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onCancel}
              className="px-5 py-3 rounded-xl text-slate-400 hover:text-white text-sm font-bold cursor-pointer"
            >
              Batal
            </button>

            <button
              type="button"
              disabled={isAiLoading || !aiTopic.trim()}
              onClick={handleGenerateAI}
              className="btn-3d px-7 py-3 bg-gradient-to-r from-indigo-600 to-sky-600 hover:from-indigo-500 hover:to-sky-500 text-white font-extrabold rounded-2xl flex items-center gap-2 shadow-lg shadow-indigo-900/40 cursor-pointer disabled:opacity-40"
            >
              {isAiLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>AI Sedang Menyusun Soal...</span>
                </>
              ) : (
                <>
                  <Wand2 className="w-5 h-5" />
                  <span>Hasilkan Soal Edukatif</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* MANUAL BUILDER / PREVIEW & EDIT PANEL */}
      {mode === 'manual' && (
        <div className="space-y-6">
          {aiNotice && (
            <div className="p-4 rounded-2xl bg-indigo-950/60 border border-indigo-500/40 text-indigo-200 text-xs flex items-center justify-between gap-3 shadow-lg">
              <div className="flex items-center gap-2.5">
                <Sparkles className="w-5 h-5 shrink-0 text-amber-400" />
                <span>{aiNotice}</span>
              </div>
              <button
                type="button"
                onClick={() => setAiNotice(null)}
                className="text-indigo-400 hover:text-white text-xs font-bold px-2 py-1 rounded-lg hover:bg-indigo-900/50 cursor-pointer"
              >
                ✕
              </button>
            </div>
          )}

          {/* Metadata Package Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 md:p-6 space-y-4">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <FileText className="w-5 h-5 text-indigo-400" />
              <span>Informasi Paket Soal</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">
                  Judul Paket Soal *
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Misal: Ulangan Harian Tata Surya Kelas 7"
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">
                  Deskripsi
                </label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Deskripsi singkat materi..."
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">
                  Mata Pelajaran
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as MataPelajaran)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm outline-none"
                >
                  <option value="IPA / Sains">IPA / Sains</option>
                  <option value="Matematika">Matematika</option>
                  <option value="Bahasa Indonesia">Bahasa Indonesia</option>
                  <option value="Bahasa Inggris">Bahasa Inggris</option>
                  <option value="IPS & Sejarah">IPS & Sejarah</option>
                  <option value="Informatika & Logika">Informatika & Logika</option>
                  <option value="Pengetahuan Umum">Pengetahuan Umum</option>
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">
                    Jenjang
                  </label>
                  <select
                    value={grade}
                    onChange={(e) => {
                      const newGrade = e.target.value as Jenjang;
                      setGrade(newGrade);
                      const classes = GRADE_CLASSES_MAP[newGrade];
                      setTargetClass(classes[1]?.id || classes[0].id);
                    }}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm outline-none cursor-pointer"
                  >
                    <option value="SD">SD</option>
                    <option value="SMP">SMP</option>
                    <option value="SMA">SMA / SMK</option>
                    <option value="Kuliah / Umum">Kuliah / Umum</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1 flex items-center gap-1">
                    <GraduationCap className="w-3 h-3 text-indigo-400" />
                    <span>Tingkatan / Kelas</span>
                  </label>
                  <select
                    value={targetClass}
                    onChange={(e) => setTargetClass(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-800 border border-indigo-500/50 text-white text-sm outline-none font-semibold cursor-pointer"
                  >
                    {GRADE_CLASSES_MAP[grade].map((cls) => (
                      <option key={cls.id} value={cls.id}>
                        {cls.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">
                    Kesulitan
                  </label>
                  <select
                    value={difficulty}
                    onChange={(e) => setDifficulty(e.target.value as Difficulty)}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm outline-none cursor-pointer"
                  >
                    <option value="Mudah">Mudah</option>
                    <option value="Sedang">Sedang</option>
                    <option value="Tantangan">Tantangan</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Form to Add / Insert Question */}
          <div className="bg-slate-900 border-2 border-indigo-500/40 rounded-3xl p-5 md:p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Plus className="w-5 h-5 text-indigo-400" />
                <span>Tambah Soal Baru</span>
              </h3>

              {/* Format Selector Pills */}
              <div className="flex flex-wrap gap-1.5">
                {(
                  [
                    { id: 'multiple_choice', label: 'Pilihan Ganda' },
                    { id: 'true_false', label: 'Benar / Salah' },
                    { id: 'fill_blank', label: 'Isian Singkat' },
                    { id: 'matching', label: 'Menjodohkan' },
                  ] as { id: QuestionType; label: string }[]
                ).map((fmt) => (
                  <button
                    key={fmt.id}
                    type="button"
                    onClick={() => setQType(fmt.id)}
                    className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      qType === fmt.id
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'bg-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    {fmt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Question Text */}
            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1">
                Teks Pertanyaan / Pernyataan *
              </label>
              <textarea
                rows={2}
                value={qText}
                onChange={(e) => setQText(e.target.value)}
                placeholder={
                  qType === 'true_false'
                    ? 'Tuliskan pernyataan yang akan dinilai kebenarannya...'
                    : qType === 'fill_blank'
                    ? 'Gunakan tanda "_____" untuk bagian kalimat yang harus diisi...'
                    : qType === 'matching'
                    ? 'Tuliskan instruksi penjodohan konsep...'
                    : 'Tuliskan pertanyaan pilihan ganda...'
                }
                className="w-full px-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm outline-none resize-none focus:border-indigo-400"
              />
            </div>

            {/* Dynamic Input based on Question Type */}
            {qType === 'multiple_choice' && (
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-300 block">
                  Pilihan Jawaban (Pilih radio untuk menandai kunci jawaban yang benar):
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {['A', 'B', 'C', 'D'].map((letter, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-2 p-2 rounded-xl bg-slate-800/80 border border-slate-700"
                    >
                      <input
                        type="radio"
                        name="correctIdx"
                        checked={qCorrectIdx === idx}
                        onChange={() => setQCorrectIdx(idx)}
                        className="w-4 h-4 accent-indigo-500 cursor-pointer"
                      />
                      <span className="font-bold text-xs text-indigo-400 w-5">
                        {letter}.
                      </span>
                      <input
                        type="text"
                        value={qOptions[idx]}
                        onChange={(e) => {
                          const updated = [...qOptions];
                          updated[idx] = e.target.value;
                          setQOptions(updated);
                        }}
                        placeholder={`Teks Opsi ${letter}...`}
                        className="flex-1 bg-transparent text-sm text-white outline-none"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {qType === 'true_false' && (
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-300 block">
                  Kunci Kebenaran Pernyataan:
                </label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 p-3 rounded-xl bg-emerald-950/30 border border-emerald-500/40 text-emerald-300 text-sm font-bold cursor-pointer">
                    <input
                      type="radio"
                      name="tfChoice"
                      checked={qIsTrue === true}
                      onChange={() => setQIsTrue(true)}
                      className="accent-emerald-500"
                    />
                    <span>Pernyataan ini BENAR</span>
                  </label>

                  <label className="flex items-center gap-2 p-3 rounded-xl bg-rose-950/30 border border-rose-500/40 text-rose-300 text-sm font-bold cursor-pointer">
                    <input
                      type="radio"
                      name="tfChoice"
                      checked={qIsTrue === false}
                      onChange={() => setQIsTrue(false)}
                      className="accent-rose-500"
                    />
                    <span>Pernyataan ini SALAH</span>
                  </label>
                </div>
              </div>
            )}

            {qType === 'fill_blank' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">
                    Kunci Jawaban Tepat *
                  </label>
                  <input
                    type="text"
                    value={qFillAnswer}
                    onChange={(e) => setQFillAnswer(e.target.value)}
                    placeholder="Contoh: Gravitasi"
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">
                    Variasi Jawaban Diterima (Pisahkan dengan koma)
                  </label>
                  <input
                    type="text"
                    value={qFillVariations}
                    onChange={(e) => setQFillVariations(e.target.value)}
                    placeholder="Contoh: gaya gravitasi, gravitation"
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm outline-none"
                  />
                </div>
              </div>
            )}

            {qType === 'matching' && (
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-300 block">
                  Pasangan Konsep (Kiri dijodohkan dengan Kanan):
                </label>
                <div className="space-y-2">
                  {qMatchingPairs.map((pair, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <span className="text-xs font-bold text-cyan-400 w-6">#{idx + 1}</span>
                      <input
                        type="text"
                        value={pair.left}
                        onChange={(e) => {
                          const updated = [...qMatchingPairs];
                          updated[idx].left = e.target.value;
                          setQMatchingPairs(updated);
                        }}
                        placeholder="Konsep Kiri (misal: Jupiter)"
                        className="flex-1 px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs outline-none"
                      />
                      <span className="text-slate-500">↔</span>
                      <input
                        type="text"
                        value={pair.right}
                        onChange={(e) => {
                          const updated = [...qMatchingPairs];
                          updated[idx].right = e.target.value;
                          setQMatchingPairs(updated);
                        }}
                        placeholder="Pasangan Kanan (misal: Planet Terbesar)"
                        className="flex-1 px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs outline-none"
                      />
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setQMatchingPairs([
                      ...qMatchingPairs,
                      { id: String(Date.now()), left: '', right: '' },
                    ])
                  }
                  className="text-xs text-indigo-400 hover:text-indigo-300 font-bold flex items-center gap-1 mt-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Tambah Baris Pasangan</span>
                </button>
              </div>
            )}

            {/* Explanation & Hint */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">
                  Pembahasan Edukatif (Muncul setelah dijawab)
                </label>
                <input
                  type="text"
                  value={qExplanation}
                  onChange={(e) => setQExplanation(e.target.value)}
                  placeholder="Jelaskan alasan dan konsep di balik jawaban..."
                  className="w-full px-4 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">
                  Petunjuk Bantuan (Hint)
                </label>
                <input
                  type="text"
                  value={qHint}
                  onChange={(e) => setQHint(e.target.value)}
                  placeholder="Petunjuk singkat jika siswa kesulitan..."
                  className="w-full px-4 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs outline-none"
                />
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={handleAddManualQuestion}
                className="btn-3d px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-sm flex items-center gap-1.5 shadow-md cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Tambahkan Soal ke Paket</span>
              </button>
            </div>
          </div>

          {/* List of Questions in the Package */}
          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-white">
                  Daftar Soal Dalam Paket ({questions.length})
                </h3>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-black uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  <Infinity className="w-3.5 h-3.5" />
                  <span>Tanpa Batas</span>
                </span>
              </div>
              <span className="text-xs text-slate-400 font-normal">
                Bisa ditambah sebanyak mungkin & langsung dimainkan di semua mode
              </span>
            </div>

            {questions.length === 0 ? (
              <div className="p-8 text-center bg-slate-900 border border-slate-800 rounded-3xl text-slate-400 text-sm">
                Belum ada soal dalam paket ini. Tambahkan soal secara manual atau gunakan AI Generator.
              </div>
            ) : (
              <div className="space-y-3">
                {questions.map((q, idx) => {
                  const isEditingThis = editingPackageQuestionIdx === idx;

                  return (
                    <div
                      key={q.id || idx}
                      className={`rounded-2xl border transition-all ${
                        isEditingThis
                          ? 'bg-slate-900 border-indigo-500/80 shadow-xl ring-2 ring-indigo-500/30'
                          : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      {/* Summary Row */}
                      <div className="p-4 flex items-start justify-between gap-3">
                        <div className="space-y-1 flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="w-6 h-6 rounded-lg bg-slate-800 text-xs font-bold flex items-center justify-center text-slate-300">
                              #{idx + 1}
                            </span>
                            <span className="text-xs px-2.5 py-0.5 rounded-full font-bold uppercase bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                              {q.type.replace('_', ' ')}
                            </span>
                            {isEditingThis && (
                              <span className="text-[10px] px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 font-extrabold uppercase border border-amber-500/30">
                                Mode Edit
                              </span>
                            )}
                          </div>

                          <h4 className="text-sm font-bold text-white line-clamp-2">{q.question || '(Belum ada teks pertanyaan)'}</h4>

                          <div className="text-xs text-slate-400">
                            Kunci Jawaban:{' '}
                            <strong className="text-emerald-400 font-semibold">{q.correctAnswer || '(Belum ditentukan)'}</strong>
                          </div>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => {
                              sounds.playClick();
                              setEditingPackageQuestionIdx(isEditingThis ? null : idx);
                            }}
                            className={`px-2.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer ${
                              isEditingThis
                                ? 'bg-indigo-600 text-white shadow-md'
                                : 'text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10 border border-emerald-500/30'
                            }`}
                            title="Edit Soal & Kunci Jawaban"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                            <span>{isEditingThis ? 'Tutup' : 'Edit'}</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDuplicateQuestion(q)}
                            className="p-2 text-indigo-400 hover:text-indigo-300 hover:bg-indigo-500/10 rounded-xl transition-colors cursor-pointer"
                            title="Gandakan Soal Ini"
                          >
                            <Copy className="w-4 h-4" />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleRemoveQuestion(q.id)}
                            className="p-2 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-xl transition-colors cursor-pointer"
                            title="Hapus Soal"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Inline Question Editor */}
                      {isEditingThis && (
                        <div className="p-4 sm:p-5 border-t border-slate-800 bg-slate-950/70 rounded-b-2xl space-y-4">
                          {/* Question Text */}
                          <div>
                            <label className="block text-xs font-bold text-slate-400 mb-1">
                              Teks Pertanyaan *
                            </label>
                            <textarea
                              rows={2}
                              value={q.question}
                              onChange={(e) => handleUpdatePackageQuestion(idx, { question: e.target.value })}
                              placeholder="Tuliskan pertanyaan di sini..."
                              className="w-full px-3.5 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs sm:text-sm text-white focus:outline-none focus:border-indigo-500 font-bold"
                            />
                          </div>

                          {/* Multiple Choice Editor */}
                          {q.type === 'multiple_choice' && (() => {
                            const opts = q.options && q.options.length > 0 ? q.options : ['Opsi A', 'Opsi B', 'Opsi C', 'Opsi D'];
                            const letters = ['A', 'B', 'C', 'D', 'E'];

                            let effectiveCorrectIdx = 0;
                            if (q.correctIndex !== undefined && q.correctIndex >= 0 && q.correctIndex < opts.length) {
                              effectiveCorrectIdx = q.correctIndex;
                            } else {
                              const foundIdx = opts.findIndex(
                                (opt) => opt.trim().toLowerCase() === (q.correctAnswer || '').trim().toLowerCase()
                              );
                              if (foundIdx !== -1) effectiveCorrectIdx = foundIdx;
                            }

                            const handleSetCorrect = (targetIdx: number) => {
                              const chosen = opts[targetIdx] || '';
                              handleUpdatePackageQuestion(idx, {
                                correctIndex: targetIdx,
                                correctAnswer: chosen,
                              });
                              sounds.playClick();
                            };

                            const handleUpdateText = (targetIdx: number, val: string) => {
                              const nextOpts = [...opts];
                              nextOpts[targetIdx] = val;
                              const isThisCorrect = effectiveCorrectIdx === targetIdx;
                              const patch: Partial<Question> = { options: nextOpts };
                              if (isThisCorrect) {
                                patch.correctAnswer = val;
                                patch.correctIndex = targetIdx;
                              }
                              handleUpdatePackageQuestion(idx, patch);
                            };

                            return (
                              <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-2">
                                  <label className="text-xs font-black text-emerald-400 flex items-center gap-1.5">
                                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                                    <span>Tentukan Kunci Jawaban Benar:</span>
                                  </label>

                                  <div className="flex items-center gap-1.5">
                                    <span className="text-[11px] text-slate-400">Pilih Cepat Kunci:</span>
                                    {opts.map((_, oIdx) => (
                                      <button
                                        key={oIdx}
                                        type="button"
                                        onClick={() => handleSetCorrect(oIdx)}
                                        className={`px-2.5 py-0.5 rounded-lg text-xs font-black transition-all cursor-pointer ${
                                          effectiveCorrectIdx === oIdx
                                            ? 'bg-emerald-500 text-white shadow-md'
                                            : 'bg-slate-800 text-slate-400 hover:text-white'
                                        }`}
                                      >
                                        Opsi {letters[oIdx]}
                                      </button>
                                    ))}
                                  </div>
                                </div>

                                <div className="space-y-2">
                                  {opts.map((opt, optIdx) => {
                                    const isCorrect = effectiveCorrectIdx === optIdx;

                                    return (
                                      <div
                                        key={optIdx}
                                        className={`p-2.5 rounded-xl border flex items-center gap-2.5 transition-all ${
                                          isCorrect
                                            ? 'bg-emerald-950/60 border-emerald-500 ring-2 ring-emerald-500/30'
                                            : 'bg-slate-800/80 border-slate-700/80'
                                        }`}
                                      >
                                        <input
                                          type="radio"
                                          name={`creator-correct-${q.id || idx}`}
                                          checked={isCorrect}
                                          onChange={() => handleSetCorrect(optIdx)}
                                          className="w-4 h-4 accent-emerald-500 cursor-pointer shrink-0"
                                        />

                                        <button
                                          type="button"
                                          onClick={() => handleSetCorrect(optIdx)}
                                          className={`w-6 h-6 rounded-lg font-black text-xs flex items-center justify-center cursor-pointer shrink-0 ${
                                            isCorrect ? 'bg-emerald-500 text-white' : 'bg-slate-700 text-slate-300'
                                          }`}
                                        >
                                          {letters[optIdx]}
                                        </button>

                                        <input
                                          type="text"
                                          value={opt}
                                          onChange={(e) => handleUpdateText(optIdx, e.target.value)}
                                          className="flex-1 bg-transparent border-0 text-xs sm:text-sm text-white focus:outline-none font-bold"
                                          placeholder={`Teks Opsi ${letters[optIdx]}...`}
                                        />

                                        {isCorrect ? (
                                          <span className="px-2 py-0.5 rounded-md bg-emerald-500 text-white font-extrabold text-[10px] uppercase shrink-0">
                                            Kunci Benar
                                          </span>
                                        ) : (
                                          <button
                                            type="button"
                                            onClick={() => handleSetCorrect(optIdx)}
                                            className="px-2 py-0.5 rounded-md bg-slate-700 hover:bg-emerald-600 text-slate-300 hover:text-white text-[10px] font-bold cursor-pointer shrink-0"
                                          >
                                            Pilih Kunci
                                          </button>
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            );
                          })()}

                          {/* True / False Editor */}
                          {q.type === 'true_false' && (() => {
                            const isCurrentTrue =
                              q.isTrue !== undefined
                                ? q.isTrue
                                : (q.correctAnswer || '').toLowerCase() === 'benar';

                            return (
                              <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
                                <label className="text-xs font-black text-emerald-400 block mb-1">
                                  Kunci Jawaban Pernyataan Ini:
                                </label>
                                <div className="flex gap-3">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      handleUpdatePackageQuestion(idx, {
                                        isTrue: true,
                                        correctAnswer: 'Benar',
                                      });
                                      sounds.playClick();
                                    }}
                                    className={`px-4 py-2 rounded-xl text-xs font-black cursor-pointer transition-all ${
                                      isCurrentTrue
                                        ? 'bg-emerald-600 text-white shadow-md ring-2 ring-emerald-400'
                                        : 'bg-slate-800 text-slate-400 hover:text-white'
                                    }`}
                                  >
                                    BENAR (True)
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => {
                                      handleUpdatePackageQuestion(idx, {
                                        isTrue: false,
                                        correctAnswer: 'Salah',
                                      });
                                      sounds.playClick();
                                    }}
                                    className={`px-4 py-2 rounded-xl text-xs font-black cursor-pointer transition-all ${
                                      !isCurrentTrue
                                        ? 'bg-rose-600 text-white shadow-md ring-2 ring-rose-400'
                                        : 'bg-slate-800 text-slate-400 hover:text-white'
                                    }`}
                                  >
                                    SALAH (False)
                                  </button>
                                </div>
                              </div>
                            );
                          })()}

                          {/* Fill Blank Editor */}
                          {q.type === 'fill_blank' && (
                            <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
                              <label className="text-xs font-black text-emerald-400 block">
                                Kunci Jawaban Utama Baku *
                              </label>
                              <input
                                type="text"
                                value={q.correctAnswer}
                                onChange={(e) => handleUpdatePackageQuestion(idx, { correctAnswer: e.target.value })}
                                className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white font-bold focus:outline-none focus:border-emerald-500"
                                placeholder="Contoh: Fotosintesis"
                              />
                            </div>
                          )}

                          {/* Explanation & Hint */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                            <div>
                              <label className="block text-xs font-bold text-slate-400 mb-1">
                                Pembahasan Soal
                              </label>
                              <input
                                type="text"
                                value={q.explanation || ''}
                                onChange={(e) => handleUpdatePackageQuestion(idx, { explanation: e.target.value })}
                                className="w-full px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white font-medium focus:outline-none"
                                placeholder="Penjelasan jawaban..."
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-bold text-slate-400 mb-1">
                                Petunjuk (Hint)
                              </label>
                              <input
                                type="text"
                                value={q.hint || ''}
                                onChange={(e) => handleUpdatePackageQuestion(idx, { hint: e.target.value })}
                                className="w-full px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white font-medium focus:outline-none"
                                placeholder="Petunjuk singkat..."
                              />
                            </div>
                          </div>

                          <div className="flex justify-end pt-2">
                            <button
                              type="button"
                              onClick={() => {
                                sounds.playClick();
                                setEditingPackageQuestionIdx(null);
                              }}
                              className="px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs flex items-center gap-1.5 cursor-pointer shadow-md"
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span>Selesai Edit Soal Ini</span>
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Action Save */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={onCancel}
              className="px-6 py-3 rounded-xl text-slate-400 hover:text-white text-sm font-bold cursor-pointer"
            >
              Batal
            </button>

            <button
              type="button"
              disabled={questions.length === 0 || !title.trim()}
              onClick={handleSaveQuizSet}
              className="btn-3d px-7 py-3 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white font-extrabold rounded-2xl flex items-center gap-2 shadow-xl shadow-emerald-950/40 cursor-pointer"
            >
              <Save className="w-5 h-5" />
              <span>Simpan ke Bank Soal</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
