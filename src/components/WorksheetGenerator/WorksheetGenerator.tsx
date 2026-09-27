import React, { useState } from 'react';
import { QuizSet } from '../../types';
import { ArrowLeft, Printer, Eye, EyeOff, BookOpen, Check } from 'lucide-react';
import { sounds } from '../../utils/audio';

interface Props {
  quizSet: QuizSet;
  onBack: () => void;
}

export const WorksheetGenerator: React.FC<Props> = ({ quizSet, onBack }) => {
  const [showAnswerKey, setShowAnswerKey] = useState(false);
  const [schoolName, setSchoolName] = useState('EDU ZONE SMART ACADEMY');

  const handlePrint = () => {
    sounds.playClick();
    window.print();
  };

  return (
    <div className="w-full max-w-4xl mx-auto py-4 px-4 space-y-6">
      {/* Control Actions (Hidden when printing) */}
      <div className="print:hidden flex flex-wrap items-center justify-between gap-3 bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow-lg">
        <button
          type="button"
          onClick={onBack}
          className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors cursor-pointer flex items-center gap-1.5 text-sm font-bold"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Kembali</span>
        </button>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setShowAnswerKey(!showAnswerKey)}
            className={`px-4 py-2 rounded-xl text-xs md:text-sm font-bold flex items-center gap-1.5 transition-all cursor-pointer border ${
              showAnswerKey
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                : 'bg-slate-800 text-slate-300 border-slate-700'
            }`}
          >
            {showAnswerKey ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
            <span>{showAnswerKey ? 'Sembunyikan Kunci' : 'Tampilkan Kunci Guru'}</span>
          </button>

          <button
            type="button"
            onClick={handlePrint}
            className="btn-3d px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-sm flex items-center gap-2 shadow-md cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Cetak / PDF</span>
          </button>
        </div>
      </div>

      {/* Printable Sheet Card */}
      <div className="bg-white text-slate-900 rounded-3xl p-6 md:p-12 shadow-2xl print:shadow-none print:p-0 print:m-0 border border-slate-200 print:border-none print:w-full">
        {/* School & Test Header */}
        <div className="border-b-2 border-slate-900 pb-4 mb-6 text-center space-y-1">
          <input
            type="text"
            value={schoolName}
            onChange={(e) => setSchoolName(e.target.value)}
            className="w-full text-center text-lg md:text-xl font-black uppercase tracking-wider outline-none border-b border-transparent hover:border-slate-300 focus:border-slate-500 print:border-none"
          />
          <h1 className="text-xl md:text-2xl font-black uppercase text-indigo-950">
            LEMBAR KERJA SISWA (LKS) & EVALUASI
          </h1>
          <p className="text-xs md:text-sm font-semibold text-slate-600">
            Mata Pelajaran: {quizSet.category} | Tingkat/Kelas: {quizSet.targetClass || quizSet.grade} | Materi: {quizSet.title}
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
        <div className="space-y-6">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-700 border-b pb-1">
            Petunjuk: Kerjakan soal-soal berikut dengan teliti dan jujur pada lembar ini!
          </h2>

          <div className="space-y-6">
            {quizSet.questions.map((q, idx) => (
              <div key={q.id || idx} className="space-y-2 text-sm leading-relaxed page-break-inside-avoid">
                <div className="flex items-start gap-2">
                  <span className="font-bold text-slate-900 shrink-0">{idx + 1}.</span>
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
                      const letter = ['A', 'B', 'C', 'D'][oIdx];
                      const isCorrect = showAnswerKey && opt === q.correctAnswer;
                      return (
                        <div
                          key={oIdx}
                          className={`flex items-center gap-2 p-1.5 rounded ${
                            isCorrect ? 'bg-emerald-50 text-emerald-900 font-bold border border-emerald-300' : ''
                          }`}
                        >
                          <span className="w-5 h-5 rounded-full border border-slate-400 flex items-center justify-center text-xs font-bold shrink-0">
                            {letter}
                          </span>
                          <span>{opt}</span>
                          {isCorrect && <Check className="w-4 h-4 text-emerald-600 ml-auto" />}
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* 2. True / False */}
                {q.type === 'true_false' && (
                  <div className="flex items-center gap-6 pl-6 pt-1">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded border-2 border-slate-400 flex items-center justify-center font-bold text-xs">
                        B
                      </span>
                      <span>BENAR</span>
                      {showAnswerKey && q.correctAnswer.toLowerCase() === 'benar' && (
                        <Check className="w-4 h-4 text-emerald-600" />
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded border-2 border-slate-400 flex items-center justify-center font-bold text-xs">
                        S
                      </span>
                      <span>SALAH</span>
                      {showAnswerKey && q.correctAnswer.toLowerCase() === 'salah' && (
                        <Check className="w-4 h-4 text-emerald-600" />
                      )}
                    </div>
                  </div>
                )}

                {/* 3. Fill in the Blank */}
                {q.type === 'fill_blank' && (
                  <div className="pl-6 pt-1">
                    <div className="flex items-center gap-2">
                      <span className="text-slate-500 font-medium">Jawaban:</span>
                      <div className="flex-1 border-b border-slate-400 h-6 max-w-md">
                        {showAnswerKey && (
                          <span className="font-bold text-emerald-700 pl-2">
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
                    <div className="grid grid-cols-2 gap-4 max-w-lg border p-3 rounded-lg bg-slate-50">
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
                      <div className="mt-2 text-xs text-emerald-700 font-semibold bg-emerald-50 p-2 rounded border border-emerald-200">
                        Kunci Pasangan: {q.matchingPairs.map((p) => `${p.left} ↔ ${p.right}`).join(', ')}
                      </div>
                    )}
                  </div>
                )}

                {/* Explanation in Teacher Mode */}
                {showAnswerKey && q.explanation && (
                  <div className="mt-1 pl-6 text-xs text-slate-600 bg-amber-50/70 p-2 rounded border border-amber-200">
                    <strong className="text-amber-800">Pembahasan:</strong> {q.explanation}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="mt-12 pt-4 border-t border-slate-300 text-center text-xs text-slate-500 flex items-center justify-between">
          <span>Edu Zone Edukasi Interaktif Indonesia</span>
          <span>Halaman 1 dari 1</span>
        </div>
      </div>
    </div>
  );
};
