import React, { useState, useEffect } from 'react';
import { QuizSet, Question } from '../../types';
import { sounds } from '../../utils/audio';
import { RotateCcw, ArrowLeft, Lightbulb, Sparkles, CheckCircle2, Award } from 'lucide-react';
import confetti from 'canvas-confetti';

interface Props {
  quizSet: QuizSet;
  onBack: () => void;
  onEarnReward?: (xp: number, coins: number) => void;
}

export const WordMazeGame: React.FC<Props> = ({ quizSet, onBack, onEarnReward }) => {
  const eligibleQuestions = quizSet.questions.filter((q) => {
    const target = q.anagramWord || (q.type === 'fill_blank' ? q.correctAnswer : null);
    return target && target.replace(/[^A-Za-z]/g, '').length >= 3;
  });

  const [currentIndex, setCurrentIndex] = useState(0);
  const [targetWord, setTargetWord] = useState('');
  const [availableTiles, setAvailableTiles] = useState<{ id: string; letter: string }[]>([]);
  const [placedTiles, setPlacedTiles] = useState<{ id: string; letter: string }[]>([]);
  const [isCompleted, setIsCompleted] = useState(false);
  const [score, setScore] = useState(0);
  const [revealedClue, setRevealedClue] = useState(false);

  const currentQ: Question = eligibleQuestions[currentIndex] || quizSet.questions[0];

  useEffect(() => {
    if (!currentQ) return;
    const raw = currentQ.anagramWord || (currentQ.type === 'fill_blank' ? currentQ.correctAnswer : 'EDUKASI');
    const clean = raw.toUpperCase().replace(/[^A-Z]/g, '');
    setTargetWord(clean);

    // Scramble tiles
    const letters = clean.split('').map((ch, i) => ({
      id: `${ch}-${i}-${Math.random()}`,
      letter: ch,
    }));
    const shuffled = [...letters].sort(() => Math.random() - 0.5);
    setAvailableTiles(shuffled);
    setPlacedTiles([]);
    setIsCompleted(false);
    setRevealedClue(false);
  }, [currentIndex, currentQ]);

  const handleTileClick = (tile: { id: string; letter: string }) => {
    sounds.playClick();
    setAvailableTiles((prev) => prev.filter((t) => t.id !== tile.id));
    const nextPlaced = [...placedTiles, tile];
    setPlacedTiles(nextPlaced);

    // Check if word is complete
    if (nextPlaced.length === targetWord.length) {
      const built = nextPlaced.map((t) => t.letter).join('');
      if (built === targetWord) {
        sounds.playSuccess();
        setIsCompleted(true);
        setScore((prev) => prev + 500);
        try {
          confetti({ particleCount: 50, spread: 60, origin: { y: 0.7 } });
        } catch (e) {}
      } else {
        sounds.playError();
      }
    }
  };

  const handleRemovePlaced = (tile: { id: string; letter: string }) => {
    sounds.playClick();
    setPlacedTiles((prev) => prev.filter((t) => t.id !== tile.id));
    setAvailableTiles((prev) => [...prev, tile]);
    setIsCompleted(false);
  };

  const handleNextWord = () => {
    sounds.playClick();
    if (currentIndex < eligibleQuestions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      if (onEarnReward) {
        onEarnReward(Math.round(score / 5), 10);
      }
      onBack();
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto py-4 px-4 space-y-6">
      {/* Top Header */}
      <div className="flex items-center justify-between bg-slate-900 border border-slate-800 p-4 rounded-2xl">
        <button
          type="button"
          onClick={onBack}
          className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        <div className="text-center">
          <h2 className="text-base md:text-lg font-black text-white">Labirin & Susun Kata</h2>
          <span className="text-xs text-indigo-400 font-semibold">
            Kata {currentIndex + 1} dari {eligibleQuestions.length || 1}
          </span>
        </div>

        <div className="px-3.5 py-1 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 font-black text-sm">
          {score} Pts
        </div>
      </div>

      {/* Clue Card */}
      <div className="p-5 md:p-6 rounded-3xl bg-slate-900/90 border-2 border-indigo-500/30 text-center space-y-3">
        <div className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-indigo-500/20 text-indigo-300">
          Petunjuk Pertanyaan
        </div>
        <h3 className="text-lg md:text-xl font-bold text-white max-w-xl mx-auto">
          {currentQ.question}
        </h3>

        {currentQ.hint && (
          <div className="pt-2">
            {!revealedClue ? (
              <button
                type="button"
                onClick={() => setRevealedClue(true)}
                className="inline-flex items-center gap-1.5 text-xs text-amber-400 hover:text-amber-300 font-semibold px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 transition-all cursor-pointer"
              >
                <Lightbulb className="w-3.5 h-3.5" />
                <span>Buka Petunjuk Tambahan</span>
              </button>
            ) : (
              <p className="text-xs text-amber-300 italic max-w-md mx-auto">
                Petunjuk: {currentQ.hint}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Placed Letter Slots */}
      <div className="flex flex-wrap items-center justify-center gap-2 md:gap-3 py-4">
        {Array.from({ length: targetWord.length }).map((_, idx) => {
          const placed = placedTiles[idx];
          return (
            <div
              key={idx}
              onClick={() => placed && handleRemovePlaced(placed)}
              className={`w-12 h-14 md:w-16 md:h-20 rounded-2xl flex items-center justify-center text-xl md:text-3xl font-black uppercase transition-all select-none cursor-pointer ${
                placed
                  ? isCompleted
                    ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-950/40 ring-4 ring-emerald-300 animate-bounce'
                    : 'bg-indigo-600 text-white shadow-lg shadow-indigo-950/40 border-b-4 border-indigo-800'
                  : 'bg-slate-800/80 border-2 border-dashed border-slate-600 text-slate-500'
              }`}
            >
              {placed?.letter || ''}
            </div>
          );
        })}
      </div>

      {/* Available Letter Tiles */}
      <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 text-center space-y-4">
        <span className="text-xs uppercase font-extrabold text-slate-400 block tracking-wider">
          Pilih & Susun Huruf-Huruf Berikut:
        </span>

        <div className="flex flex-wrap items-center justify-center gap-2 md:gap-3">
          {availableTiles.map((tile) => (
            <button
              key={tile.id}
              type="button"
              onClick={() => handleTileClick(tile)}
              className="btn-3d w-11 h-13 md:w-14 md:h-16 rounded-xl bg-slate-800 hover:bg-slate-700 active:bg-indigo-600 text-white border-b-4 border-slate-900 text-lg md:text-2xl font-black shadow-md cursor-pointer transition-transform"
            >
              {tile.letter}
            </button>
          ))}
        </div>
      </div>

      {/* Success Notification */}
      {isCompleted && (
        <div className="p-5 rounded-2xl bg-emerald-950/60 border border-emerald-500/50 flex flex-col sm:flex-row items-center justify-between gap-4 animate-in zoom-in-95 duration-200">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-8 h-8 text-emerald-400 shrink-0" />
            <div>
              <h4 className="text-base font-bold text-white">Susunan Kata Tepat!</h4>
              <p className="text-xs text-emerald-300">
                Kamu menyusun kata <strong className="uppercase">{targetWord}</strong> dengan sempurna!
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleNextWord}
            className="btn-3d px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-sm shadow-md cursor-pointer whitespace-nowrap"
          >
            {currentIndex < eligibleQuestions.length - 1 ? 'Lanjut Kata Berikutnya' : 'Selesai'}
          </button>
        </div>
      )}
    </div>
  );
};
