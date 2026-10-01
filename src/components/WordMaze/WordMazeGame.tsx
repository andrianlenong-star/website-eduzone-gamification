import React, { useState, useEffect } from 'react';
import { QuizSet, Question } from '../../types';
import { sounds } from '../../utils/audio';
import { RotateCcw, ArrowLeft, Lightbulb, Sparkles, CheckCircle2, Award, KeyRound } from 'lucide-react';
import confetti from 'canvas-confetti';

interface Props {
  quizSet: QuizSet;
  onBack: () => void;
  onEarnReward?: (xp: number, coins: number) => void;
}

function getTargetWordForQuestion(q: Question): { word: string; displayAnswer: string } {
  // 1. If explicit anagramWord is set and valid
  if (q.anagramWord && q.anagramWord.trim().length >= 3) {
    const clean = q.anagramWord.toUpperCase().replace(/[^A-Z]/g, '');
    if (clean.length >= 3) {
      return { word: clean, displayAnswer: q.anagramWord.trim() };
    }
  }

  // 2. Derive directly from the real answer key
  let raw = '';
  if (q.type === 'multiple_choice' && q.options && q.options.length > 0) {
    if (q.correctIndex !== undefined && q.options[q.correctIndex]) {
      raw = q.options[q.correctIndex];
    } else {
      raw = q.correctAnswer || q.options[0] || '';
    }
  } else {
    raw = q.correctAnswer || '';
  }

  if (q.type === 'true_false') {
    const isTrue = q.isTrue ?? (raw.toLowerCase() === 'benar');
    return { word: isTrue ? 'BENAR' : 'SALAH', displayAnswer: isTrue ? 'Benar' : 'Salah' };
  }

  // Strip prefixes like "A. ", "B. ", "Opsi A: "
  const cleanedText = raw.replace(/^[A-Ea-e][\.\:\-\)]\s*/, '').trim();
  const cleanAlpha = cleanedText.toUpperCase().replace(/[^A-Z]/g, '');

  if (cleanAlpha.length >= 3) {
    // If reasonably sized (<= 14 chars), use the exact answer letters
    if (cleanAlpha.length <= 14) {
      return { word: cleanAlpha, displayAnswer: cleanedText };
    }
    // If long sentence, take the first significant word (>= 3 chars)
    const words = cleanedText
      .split(/\s+/)
      .map((w) => w.toUpperCase().replace(/[^A-Z]/g, ''))
      .filter((w) => w.length >= 3);
    if (words.length > 0) {
      return { word: words[0], displayAnswer: words[0] };
    }
    return { word: cleanAlpha.slice(0, 10), displayAnswer: cleanedText };
  }

  return { word: 'EDUKASI', displayAnswer: 'Edukasi' };
}

export const WordMazeGame: React.FC<Props> = ({ quizSet, onBack, onEarnReward }) => {
  const eligibleQuestions = quizSet.questions.filter((q) => {
    const { word } = getTargetWordForQuestion(q);
    return word.length >= 3;
  });

  const [currentIndex, setCurrentIndex] = useState(0);
  const [targetWord, setTargetWord] = useState('');
  const [displayAnswer, setDisplayAnswer] = useState('');
  const [availableTiles, setAvailableTiles] = useState<{ id: string; letter: string }[]>([]);
  const [placedTiles, setPlacedTiles] = useState<{ id: string; letter: string }[]>([]);
  const [isCompleted, setIsCompleted] = useState(false);
  const [score, setScore] = useState(0);
  const [revealedClue, setRevealedClue] = useState(false);

  const currentQ: Question = eligibleQuestions[currentIndex] || quizSet.questions[0];

  useEffect(() => {
    if (!currentQ) return;
    const { word, displayAnswer: disp } = getTargetWordForQuestion(currentQ);
    setTargetWord(word);
    setDisplayAnswer(disp);

    // Scramble tiles
    const letters = word.split('').map((ch, i) => ({
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

  // Quick auto-solve / Reveal answer button for assistance
  const handleAutoSolve = () => {
    sounds.playPowerup();
    const correctTiles = targetWord.split('').map((ch, i) => ({
      id: `${ch}-${i}-${Math.random()}`,
      letter: ch,
    }));
    setPlacedTiles(correctTiles);
    setAvailableTiles([]);
    setIsCompleted(true);
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
        <div className="flex items-center justify-center gap-2">
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-indigo-500/20 text-indigo-300">
            Pertanyaan #{currentIndex + 1}
          </span>
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-slate-800 text-slate-400 border border-slate-700">
            {targetWord.length} Huruf
          </span>
        </div>

        <h3 className="text-lg md:text-xl font-bold text-white max-w-xl mx-auto leading-relaxed">
          {currentQ.question}
        </h3>

        <div className="pt-2 flex flex-wrap items-center justify-center gap-2">
          {currentQ.hint && !revealedClue && (
            <button
              type="button"
              onClick={() => setRevealedClue(true)}
              className="inline-flex items-center gap-1.5 text-xs text-amber-400 hover:text-amber-300 font-semibold px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 transition-all cursor-pointer"
            >
              <Lightbulb className="w-3.5 h-3.5" />
              <span>Buka Petunjuk</span>
            </button>
          )}

          {!isCompleted && (
            <button
              type="button"
              onClick={handleAutoSolve}
              className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-indigo-300 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-750 border border-slate-700 transition-all cursor-pointer"
              title="Buka Kunci Jawaban Lengkap"
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>Buka Kunci Jawaban</span>
            </button>
          )}
        </div>

        {revealedClue && currentQ.hint && (
          <p className="text-xs text-amber-300 italic max-w-md mx-auto pt-1">
            Petunjuk: {currentQ.hint}
          </p>
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
              className={`w-11 h-14 sm:w-14 sm:h-18 md:w-16 md:h-20 rounded-2xl flex items-center justify-center text-xl sm:text-2xl md:text-3xl font-black uppercase transition-all select-none cursor-pointer ${
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
          Pilih & Susun Huruf-Huruf Berikut Sesuai Kunci Jawaban:
        </span>

        <div className="flex flex-wrap items-center justify-center gap-2 md:gap-3">
          {availableTiles.map((tile) => (
            <button
              key={tile.id}
              type="button"
              onClick={() => handleTileClick(tile)}
              className="btn-3d w-11 h-13 sm:w-13 sm:h-15 md:w-14 md:h-16 rounded-xl bg-slate-800 hover:bg-slate-700 active:bg-indigo-600 text-white border-b-4 border-slate-900 text-lg md:text-2xl font-black shadow-md cursor-pointer transition-transform"
            >
              {tile.letter}
            </button>
          ))}
          {availableTiles.length === 0 && !isCompleted && (
            <span className="text-xs text-slate-500">Semua huruf telah diletakkan</span>
          )}
        </div>
      </div>

      {/* Success Notification matching exact answer */}
      {isCompleted && (
        <div className="p-5 rounded-2xl bg-emerald-950/60 border border-emerald-500/50 flex flex-col sm:flex-row items-center justify-between gap-4 animate-in zoom-in-95 duration-200">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-8 h-8 text-emerald-400 shrink-0" />
            <div>
              <h4 className="text-base font-bold text-white">Susunan Kata Tepat!</h4>
              <p className="text-xs text-emerald-300">
                Kunci Jawaban: <strong className="text-white uppercase">{displayAnswer || targetWord}</strong>
              </p>
              {currentQ.explanation && (
                <p className="text-[11px] text-slate-300 mt-1 max-w-lg">
                  {currentQ.explanation}
                </p>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={handleNextWord}
            className="btn-3d px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-sm shadow-md cursor-pointer whitespace-nowrap shrink-0"
          >
            {currentIndex < eligibleQuestions.length - 1 ? 'Lanjut Kata Berikutnya' : 'Selesai'}
          </button>
        </div>
      )}
    </div>
  );
};
