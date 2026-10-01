import React, { useState } from 'react';
import { QuizSet } from '../../types';
import {
  ArrowLeft,
  Printer,
  Download,
  FileText,
  Eye,
  EyeOff,
  Check,
  Loader2,
  Sparkles,
  School,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { sounds } from '../../utils/audio';
import {
  exportWorksheetToPdf,
  printWorksheetElement,
  exportWorksheetToWord,
} from '../../utils/pdfExport';

interface Props {
  quizSet: QuizSet;
  onBack: () => void;
}

export const WorksheetGenerator: React.FC<Props> = ({ quizSet, onBack }) => {
  const [showAnswerKey, setShowAnswerKey] = useState(false);
  const [schoolName, setSchoolName] = useState('EDUZONE SMART ACADEMY');
  const [fontSize, setFontSize] = useState<'sm' | 'base' | 'lg'>('base');
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [exportNotice, setExportNotice] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  // 1. Export directly to PDF file
  const handleSavePdf = async () => {
    setIsExportingPdf(true);
    setExportNotice(null);
    sounds.playClick();

    try {
      const fileName = `${quizSet.title}-LKS-${showAnswerKey ? 'Kunci' : 'Siswa'}-EduZone`;
      await exportWorksheetToPdf('printable-worksheet', fileName);
      sounds.playSuccess();
      setExportNotice({
        type: 'success',
        text: 'File PDF berhasil diunduh ke perangkat Anda!',
      });
      setTimeout(() => setExportNotice(null), 4000);
    } catch (err: any) {
      console.error('PDF export error:', err);
      sounds.playError();
      setExportNotice({
        type: 'error',
        text: 'Gagal membuat file PDF. Silakan gunakan tombol "Cetak Lembar Soal" sebagai alternatif.',
      });
    } finally {
      setIsExportingPdf(false);
    }
  };

  // 2. Print directly via isolated print iframe
  const handlePrint = async () => {
    sounds.playClick();
    setExportNotice(null);
    try {
      await printWorksheetElement('printable-worksheet');
    } catch (err) {
      console.warn('Fallback print:', err);
      window.print();
    }
  };

  // 3. Export to Microsoft Word document (.doc)
  const handleSaveWord = () => {
    sounds.playClick();
    try {
      exportWorksheetToWord(quizSet, schoolName, showAnswerKey);
      sounds.playSuccess();
      setExportNotice({
        type: 'success',
        text: 'File Dokumen Word (.doc) berhasil diunduh!',
      });
      setTimeout(() => setExportNotice(null), 4000);
    } catch (err) {
      sounds.playError();
      setExportNotice({
        type: 'error',
        text: 'Gagal mengunduh dokumen Word.',
      });
    }
  };

  const fontClasses = {
    sm: 'text-xs',
    base: 'text-sm',
    lg: 'text-base',
  }[fontSize];

  return (
    <div className="w-full max-w-5xl mx-auto py-4 px-4 space-y-5">
      {/* Control Actions (Hidden when printing) */}
      <div className="print:hidden space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900 border border-slate-800 p-4 sm:p-5 rounded-3xl shadow-xl">
          <button
            type="button"
            onClick={onBack}
            className="px-3.5 py-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors cursor-pointer flex items-center gap-1.5 text-xs sm:text-sm font-bold"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Kembali</span>
          </button>

          {/* Action buttons */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
            {/* Toggle Answer Key */}
            <button
              type="button"
              onClick={() => {
                setShowAnswerKey(!showAnswerKey);
                sounds.playClick();
              }}
              className={`px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-1.5 transition-all cursor-pointer border ${
                showAnswerKey
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-sm'
                  : 'bg-slate-800 text-slate-300 border-slate-700 hover:text-white hover:bg-slate-700'
              }`}
              title="Sembunyikan atau tampilkan kunci jawaban & pembahasan guru"
            >
              {showAnswerKey ? <Eye className="w-4 h-4 text-amber-400" /> : <EyeOff className="w-4 h-4" />}
              <span>{showAnswerKey ? 'Kunci: Aktif' : 'Tampilkan Kunci Guru'}</span>
            </button>

            {/* Simpan ke File PDF Button */}
            <button
              type="button"
              disabled={isExportingPdf}
              onClick={handleSavePdf}
              className="btn-3d px-4 sm:px-5 py-2.5 bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white font-extrabold rounded-xl text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-rose-950/40 cursor-pointer transition-all"
              title="Unduh langsung lembar soal ini sebagai file PDF"
            >
              {isExportingPdf ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Menyiapkan PDF...</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>Simpan File PDF</span>
                </>
              )}
            </button>

            {/* Cetak Langsung Button */}
            <button
              type="button"
              onClick={handlePrint}
              className="btn-3d px-4 sm:px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold rounded-xl text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-indigo-950/40 cursor-pointer transition-all"
              title="Buka dialog cetak lembar kerja kertas A4"
            >
              <Printer className="w-4 h-4" />
              <span>Cetak Soal</span>
            </button>

            {/* Unduh Word Button */}
            <button
              type="button"
              onClick={handleSaveWord}
              className="px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 hover:text-white font-bold rounded-xl text-xs sm:text-sm flex items-center gap-1.5 cursor-pointer transition-all"
              title="Unduh dalam format dokumen Microsoft Word (.doc)"
            >
              <FileText className="w-4 h-4 text-sky-400" />
              <span className="hidden sm:inline">Unduh Word (.doc)</span>
            </button>
          </div>
        </div>

        {/* Customization Toolbar & Notice */}
        <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/80 border border-slate-800/80 px-4 py-2.5 rounded-2xl text-xs text-slate-300">
          <div className="flex items-center gap-2 flex-1 min-w-[240px]">
            <School className="w-4 h-4 text-indigo-400 shrink-0" />
            <span className="font-bold text-slate-400 shrink-0">Nama Lembaga:</span>
            <input
              type="text"
              value={schoolName}
              onChange={(e) => setSchoolName(e.target.value)}
              placeholder="Contoh: SMP NEGERI 1 INDONESIA"
              className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-white font-bold focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="flex items-center gap-3">
            <span className="font-bold text-slate-400">Ukuran Teks:</span>
            <div className="flex items-center bg-slate-800 rounded-lg p-0.5 border border-slate-700">
              {(['sm', 'base', 'lg'] as const).map((sz) => (
                <button
                  key={sz}
                  type="button"
                  onClick={() => setFontSize(sz)}
                  className={`px-2 py-0.5 rounded text-[11px] font-bold cursor-pointer transition-colors ${
                    fontSize === sz ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {sz === 'sm' ? 'Kecil' : sz === 'base' ? 'Normal' : 'Besar'}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Feedback Alert Notice */}
        {exportNotice && (
          <div
            className={`p-3.5 rounded-2xl flex items-center gap-2.5 text-xs font-bold animate-fadeIn transition-all ${
              exportNotice.type === 'success'
                ? 'bg-emerald-950/60 border border-emerald-500/40 text-emerald-300'
                : 'bg-rose-950/60 border border-rose-500/40 text-rose-300'
            }`}
          >
            {exportNotice.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            )}
            <span>{exportNotice.text}</span>
          </div>
        )}
      </div>

      {/* Printable Sheet Card */}
      <div
        id="printable-worksheet"
        className="bg-white text-slate-900 rounded-3xl p-6 sm:p-10 md:p-14 shadow-2xl print:shadow-none print:p-0 print:m-0 border border-slate-200 print:border-none print:w-full print:text-black transition-all"
        style={{ fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}
      >
        {/* School & Test Header */}
        <div className="border-b-2 border-slate-900 pb-4 mb-6 text-center space-y-1">
          <h2 className="text-lg md:text-xl font-black uppercase tracking-wider text-slate-900">
            {schoolName || 'EDUZONE SMART ACADEMY'}
          </h2>
          <h1 className="text-xl md:text-2xl font-black uppercase text-indigo-950">
            LEMBAR KERJA SISWA (LKS) & EVALUASI
          </h1>
          <p className="text-xs md:text-sm font-semibold text-slate-600">
            Mata Pelajaran: <strong>{quizSet.category}</strong> | Tingkat/Kelas: <strong>{quizSet.targetClass || quizSet.grade}</strong> | Materi: <strong>{quizSet.title}</strong>
          </p>
        </div>

        {/* Student Identity Form */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 border border-slate-300 rounded-xl mb-6 text-xs md:text-sm">
          <div>
            <span className="font-bold text-slate-600 block">Nama Siswa:</span>
            <div className="border-b border-dotted border-slate-400 h-6 mt-1" />
          </div>
          <div>
            <span className="font-bold text-slate-600 block">Kelas / No. Absen:</span>
            <div className="border-b border-dotted border-slate-400 h-6 mt-1" />
          </div>
          <div>
            <span className="font-bold text-slate-600 block">Hari / Tanggal:</span>
            <div className="border-b border-dotted border-slate-400 h-6 mt-1" />
          </div>
          <div>
            <span className="font-bold text-slate-600 block">Nilai / Paraf Guru:</span>
            <div className="border border-slate-400 rounded h-10 mt-1 flex items-center justify-center font-bold text-slate-400">
              / 100
            </div>
          </div>
        </div>

        {/* Questions Section */}
        <div className={`space-y-6 ${fontClasses}`}>
          <div className="border-b border-slate-300 pb-2 flex items-center justify-between">
            <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-700">
              Petunjuk: Kerjakan soal-soal berikut dengan teliti dan jujur pada lembar ini!
            </h3>
            {showAnswerKey && (
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-100 text-emerald-800 border border-emerald-300">
                Mode Kunci Guru
              </span>
            )}
          </div>

          <div className="space-y-6">
            {(quizSet.questions || []).map((q, idx) => {
              return (
                <div key={q.id || idx} className="space-y-2 leading-relaxed page-break-inside-avoid">
                  <div className="flex items-start gap-2">
                    <span className="font-black text-slate-900 shrink-0">{idx + 1}.</span>
                    <div className="flex-1">
                      <span className="font-semibold text-slate-900">{q.question}</span>
                      <span className="ml-2 text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-slate-100 border text-slate-500 print:hidden">
                        {q.type.replace('_', ' ')}
                      </span>
                    </div>
                  </div>

                  {/* Question Renderers for Paper */}
                  {/* 1. Multiple Choice */}
                  {q.type === 'multiple_choice' && q.options && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pl-6 pt-1">
                      {q.options.map((opt, oIdx) => {
                        const letter = ['A', 'B', 'C', 'D', 'E'][oIdx];
                        const isCorrect =
                          showAnswerKey &&
                          (opt === q.correctAnswer || (q.correctIndex !== undefined && oIdx === q.correctIndex));

                        return (
                          <div
                            key={oIdx}
                            className={`flex items-center gap-2 p-1.5 rounded transition-colors ${
                              isCorrect ? 'bg-emerald-50 text-emerald-950 font-bold border border-emerald-300' : ''
                            }`}
                          >
                            <span
                              className={`w-5 h-5 rounded-full border flex items-center justify-center text-xs font-bold shrink-0 ${
                                isCorrect ? 'border-emerald-600 bg-emerald-600 text-white' : 'border-slate-400 text-slate-700'
                              }`}
                            >
                              {letter}
                            </span>
                            <span>{opt}</span>
                            {isCorrect && (
                              <span className="ml-auto text-xs font-black text-emerald-700 flex items-center gap-0.5">
                                <Check className="w-3.5 h-3.5 stroke-[3]" />
                                <span>[Kunci]</span>
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* 2. True / False */}
                  {q.type === 'true_false' && (() => {
                    const isTrue = q.isTrue ?? (q.correctAnswer.toLowerCase() === 'benar');

                    return (
                      <div className="flex items-center gap-8 pl-6 pt-1">
                        <div
                          className={`flex items-center gap-2 p-1 px-2 rounded ${
                            showAnswerKey && isTrue ? 'bg-emerald-50 border border-emerald-300 font-bold' : ''
                          }`}
                        >
                          <span className="w-6 h-6 rounded border-2 border-slate-400 flex items-center justify-center font-bold text-xs">
                            B
                          </span>
                          <span>BENAR</span>
                          {showAnswerKey && isTrue && (
                            <span className="text-xs font-bold text-emerald-700 ml-1 flex items-center gap-0.5">
                              <Check className="w-3.5 h-3.5 stroke-[3]" /> [Kunci]
                            </span>
                          )}
                        </div>
                        <div
                          className={`flex items-center gap-2 p-1 px-2 rounded ${
                            showAnswerKey && !isTrue ? 'bg-emerald-50 border border-emerald-300 font-bold' : ''
                          }`}
                        >
                          <span className="w-6 h-6 rounded border-2 border-slate-400 flex items-center justify-center font-bold text-xs">
                            S
                          </span>
                          <span>SALAH</span>
                          {showAnswerKey && !isTrue && (
                            <span className="text-xs font-bold text-emerald-700 ml-1 flex items-center gap-0.5">
                              <Check className="w-3.5 h-3.5 stroke-[3]" /> [Kunci]
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })()}

                  {/* 3. Fill in the Blank */}
                  {q.type === 'fill_blank' && (
                    <div className="pl-6 pt-1">
                      <div className="flex items-center gap-2">
                        <span className="text-slate-500 font-medium">Jawaban:</span>
                        <div className="flex-1 border-b border-slate-400 h-6 max-w-md">
                          {showAnswerKey && (
                            <span className="font-bold text-emerald-800 pl-2">
                              {q.correctAnswer}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 4. Matching */}
                  {q.type === 'matching' && q.matchingPairs && (
                    <div className="pl-6 pt-2">
                      <div className="grid grid-cols-2 gap-4 max-w-lg border border-slate-300 p-3 rounded-lg bg-slate-50">
                        <div className="space-y-2">
                          <span className="font-bold text-xs block text-slate-500">Kolom A:</span>
                          {q.matchingPairs.map((p, pIdx) => (
                            <div key={pIdx} className="flex items-center justify-between text-xs font-semibold">
                              <span>{p.left}</span>
                              <span className="w-2.5 h-2.5 rounded-full border border-slate-400 shrink-0 ml-2" />
                            </div>
                          ))}
                        </div>

                        <div className="space-y-2">
                          <span className="font-bold text-xs block text-slate-500">Kolom B:</span>
                          {q.matchingPairs.map((p, pIdx) => (
                            <div key={pIdx} className="flex items-center gap-2 text-xs">
                              <span className="w-2.5 h-2.5 rounded-full border border-slate-400 shrink-0" />
                              <span>{p.right}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {showAnswerKey && (
                        <div className="mt-2 text-xs text-emerald-800 font-semibold bg-emerald-50 p-2 rounded border border-emerald-200">
                          Kunci Pasangan: {q.matchingPairs.map((p) => `${p.left} ↔ ${p.right}`).join(', ')}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Explanation in Teacher Mode */}
                  {showAnswerKey && q.explanation && (
                    <div className="mt-1 pl-6 text-xs text-slate-700 bg-amber-50/80 p-2.5 rounded-lg border border-amber-200">
                      <strong className="text-amber-900">Pembahasan:</strong> {q.explanation}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="mt-12 pt-4 border-t border-slate-300 text-center text-xs text-slate-500 flex items-center justify-between">
          <span>EduZone - Platform Edukasi Interaktif Indonesia</span>
          <span>Dicetak pada: {new Date().toLocaleDateString('id-ID')}</span>
        </div>
      </div>
    </div>
  );
};
