import React, { useState } from 'react';
import { QuizSet, GameMode } from '../../types';
import { generateShareUrl, downloadQuizJson, encodeQuizToCode } from '../../utils/shareQuiz';
import { sounds } from '../../utils/audio';
import {
  X,
  Share2,
  Copy,
  Check,
  Download,
  Code,
  Zap,
  RotateCcw,
  Grid,
  Swords,
  BookOpen,
  MessageCircle,
  ExternalLink,
  ShieldCheck,
} from 'lucide-react';

interface Props {
  quiz: QuizSet;
  onClose: () => void;
  onLaunchMode: (mode: GameMode) => void;
}

export const ShareQuizModal: React.FC<Props> = ({ quiz, onClose, onLaunchMode }) => {
  const [selectedMode, setSelectedMode] = useState<GameMode | 'auto'>('auto');
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  const activeShareUrl = generateShareUrl(quiz, selectedMode === 'auto' ? undefined : selectedMode);
  const shareCode = encodeQuizToCode(quiz);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(activeShareUrl);
      setCopiedLink(true);
      sounds.playSuccess();
      setTimeout(() => setCopiedLink(false), 2500);
    } catch {
      // Fallback
    }
  };

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(shareCode);
      setCopiedCode(true);
      sounds.playSuccess();
      setTimeout(() => setCopiedCode(false), 2500);
    } catch {
      // Fallback
    }
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Mainkan Game Edukasi: ${quiz.title}`,
          text: `Ayo mainkan kuis interaktif "${quiz.title}" (${quiz.questions.length} soal) di Edu Zone!`,
          url: activeShareUrl,
        });
      } catch {
        // Ignored or cancelled
      }
    } else {
      const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(
        `Ayo mainkan kuis "${quiz.title}" (${quiz.questions.length} soal) di Edu Zone: ${activeShareUrl}`
      )}`;
      window.open(waUrl, '_blank');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-slate-900 border-2 border-indigo-500/50 rounded-3xl p-6 md:p-8 max-w-xl w-full space-y-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
              <Share2 className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs font-black uppercase text-indigo-400 tracking-wider">
                Bagikan & Salin Tautan
              </span>
              <h3 className="text-lg md:text-xl font-black text-white leading-tight">
                {quiz.title}
              </h3>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Info callout */}
        <div className="p-3.5 rounded-2xl bg-indigo-950/40 border border-indigo-500/30 text-xs text-indigo-200 flex items-start gap-2.5">
          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            <strong>Tautan Universal:</strong> Tautan yang disalin di bawah ini memuat data paket soal secara mandiri. Siapapun yang membuka link ini (di link Publish, HP siswa, maupun browser lain) akan langsung mendapatkan kuis ini!
          </p>
        </div>

        {/* Mode Selector for Share */}
        <div className="space-y-2">
          <label className="text-xs font-extrabold text-slate-300 block">
            Pilih Target Mode Permainan (Opsional):
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
            <button
              type="button"
              onClick={() => setSelectedMode('auto')}
              className={`p-2 rounded-xl font-bold border transition-all text-left flex items-center gap-1.5 cursor-pointer ${
                selectedMode === 'auto'
                  ? 'bg-indigo-600 text-white border-indigo-400 shadow-sm'
                  : 'bg-slate-800/80 text-slate-300 border-slate-700 hover:border-slate-600'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5 shrink-0" />
              <span>Pilihan Bebas</span>
            </button>
            <button
              type="button"
              onClick={() => setSelectedMode('kuis-kilat')}
              className={`p-2 rounded-xl font-bold border transition-all text-left flex items-center gap-1.5 cursor-pointer ${
                selectedMode === 'kuis-kilat'
                  ? 'bg-indigo-600 text-white border-indigo-400 shadow-sm'
                  : 'bg-slate-800/80 text-slate-300 border-slate-700 hover:border-slate-600'
              }`}
            >
              <Zap className="w-3.5 h-3.5 shrink-0 text-amber-400" />
              <span>Kuis Kilat</span>
            </button>
            <button
              type="button"
              onClick={() => setSelectedMode('roda-putar')}
              className={`p-2 rounded-xl font-bold border transition-all text-left flex items-center gap-1.5 cursor-pointer ${
                selectedMode === 'roda-putar'
                  ? 'bg-indigo-600 text-white border-indigo-400 shadow-sm'
                  : 'bg-slate-800/80 text-slate-300 border-slate-700 hover:border-slate-600'
              }`}
            >
              <RotateCcw className="w-3.5 h-3.5 shrink-0 text-cyan-400" />
              <span>Roda Putar</span>
            </button>
            <button
              type="button"
              onClick={() => setSelectedMode('kartu-cocok')}
              className={`p-2 rounded-xl font-bold border transition-all text-left flex items-center gap-1.5 cursor-pointer ${
                selectedMode === 'kartu-cocok'
                  ? 'bg-indigo-600 text-white border-indigo-400 shadow-sm'
                  : 'bg-slate-800/80 text-slate-300 border-slate-700 hover:border-slate-600'
              }`}
            >
              <Grid className="w-3.5 h-3.5 shrink-0 text-emerald-400" />
              <span>Kartu Cocok</span>
            </button>
            <button
              type="button"
              onClick={() => setSelectedMode('duel-teman')}
              className={`p-2 rounded-xl font-bold border transition-all text-left flex items-center gap-1.5 cursor-pointer ${
                selectedMode === 'duel-teman'
                  ? 'bg-indigo-600 text-white border-indigo-400 shadow-sm'
                  : 'bg-slate-800/80 text-slate-300 border-slate-700 hover:border-slate-600'
              }`}
            >
              <Swords className="w-3.5 h-3.5 shrink-0 text-rose-400" />
              <span>Duel Teman</span>
            </button>
          </div>
        </div>

        {/* Direct Link Input Box */}
        <div className="space-y-2">
          <label className="text-xs font-extrabold text-slate-300 block">
            Tautan Link Langsung:
          </label>
          <div className="flex items-center gap-2">
            <input
              type="text"
              readOnly
              value={activeShareUrl}
              className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-slate-200 font-mono focus:outline-none select-all"
            />
            <button
              type="button"
              onClick={handleCopyLink}
              className="btn-3d px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-extrabold rounded-xl flex items-center gap-1.5 shrink-0 cursor-pointer shadow-md"
            >
              {copiedLink ? (
                <>
                  <Check className="w-4 h-4 text-emerald-300" />
                  <span>Tersalin!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>Salin Link</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Share buttons row */}
        <div className="flex flex-wrap items-center gap-2.5 pt-2">
          <button
            type="button"
            onClick={handleNativeShare}
            className="flex-1 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <MessageCircle className="w-4 h-4" />
            <span>Bagikan ke WhatsApp</span>
          </button>

          <button
            type="button"
            onClick={() => downloadQuizJson(quiz)}
            className="py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition-colors cursor-pointer border border-slate-700"
          >
            <Download className="w-4 h-4 text-sky-400" />
            <span>Unduh JSON</span>
          </button>

          <button
            type="button"
            onClick={handleCopyCode}
            className="py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition-colors cursor-pointer border border-slate-700"
            title="Salin kode unik kuis untuk diimpor"
          >
            {copiedCode ? (
              <>
                <Check className="w-4 h-4 text-emerald-400" />
                <span>Kode Tersalin!</span>
              </>
            ) : (
              <>
                <Code className="w-4 h-4 text-amber-400" />
                <span>Salin Kode Kuis</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
