import React, { useState, useEffect } from 'react';
import { QuizSet } from '../../types';
import { sounds } from '../../utils/audio';
import { ArrowLeft, RotateCcw, Trophy, Check, Timer, TimerOff } from 'lucide-react';
import confetti from 'canvas-confetti';

interface Props {
  quizSet: QuizSet;
  onBack: () => void;
  onEarnReward?: (xp: number, coins: number) => void;
  timerEnabled?: boolean;
  onToggleTimer?: () => void;
}

interface CardItem {
  id: string;
  pairKey: string;
  content: string;
  isLeft: boolean;
  isFlipped: boolean;
  isMatched: boolean;
}

export const MemoryMatchGame: React.FC<Props> = ({
  quizSet,
  onBack,
  onEarnReward,
  timerEnabled = true,
  onToggleTimer,
}) => {
  const [cards, setCards] = useState<CardItem[]>([]);
  const [flippedIndices, setFlippedIndices] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [matchesCount, setMatchesCount] = useState(0);
  const [isGameOver, setIsGameOver] = useState(false);
  const [seconds, setSeconds] = useState(0);

  // Initialize pairs from matching questions or quiz questions
  const setupGame = () => {
    const rawPairs: { left: string; right: string; key: string }[] = [];

    // Extract from matching questions first
    quizSet.questions.forEach((q, qIdx) => {
      if (q.type === 'matching' && q.matchingPairs) {
        q.matchingPairs.forEach((p, pIdx) => {
          rawPairs.push({ left: p.left, right: p.right, key: `m-${qIdx}-${pIdx}` });
        });
      }
    });

    // If less than 6 pairs, supplement with other questions (question prompt -> answer)
    if (rawPairs.length < 6) {
      quizSet.questions.forEach((q, idx) => {
        if (rawPairs.length >= 6) return;
        if (q.type !== 'matching') {
          const shortQ = q.question.length > 40 ? q.question.slice(0, 37) + '...' : q.question;
          rawPairs.push({ left: shortQ, right: q.correctAnswer, key: `q-${idx}` });
        }
      });
    }

    // Take up to 6 pairs for a 12-card grid (accessible and fast)
    const selectedPairs = rawPairs.slice(0, 6);

    const generatedCards: CardItem[] = [];
    selectedPairs.forEach((p, idx) => {
      generatedCards.push({
        id: `card-left-${idx}`,
        pairKey: p.key,
        content: p.left,
        isLeft: true,
        isFlipped: false,
        isMatched: false,
      });
      generatedCards.push({
        id: `card-right-${idx}`,
        pairKey: p.key,
        content: p.right,
        isLeft: false,
        isFlipped: false,
        isMatched: false,
      });
    });

    const shuffled = [...generatedCards].sort(() => Math.random() - 0.5);
    setCards(shuffled);
    setFlippedIndices([]);
    setMoves(0);
    setMatchesCount(0);
    setIsGameOver(false);
    setSeconds(0);
  };

  useEffect(() => {
    setupGame();
  }, [quizSet.id]);

  // Timer
  useEffect(() => {
    if (isGameOver || !timerEnabled) return;
    const interval = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(interval);
  }, [isGameOver, timerEnabled]);

  const handleCardClick = (index: number) => {
    if (flippedIndices.length >= 2 || cards[index].isFlipped || cards[index].isMatched) {
      return;
    }

    sounds.playClick();
    const newCards = [...cards];
    newCards[index].isFlipped = true;
    setCards(newCards);

    const newFlipped = [...flippedIndices, index];
    setFlippedIndices(newFlipped);

    if (newFlipped.length === 2) {
      setMoves((m) => m + 1);
      const [firstIdx, secondIdx] = newFlipped;
      const firstCard = newCards[firstIdx];
      const secondCard = newCards[secondIdx];

      if (firstCard.pairKey === secondCard.pairKey && firstCard.isLeft !== secondCard.isLeft) {
        // MATCH!
        setTimeout(() => {
          sounds.playMatchPair();
          newCards[firstIdx].isMatched = true;
          newCards[secondIdx].isMatched = true;
          setCards([...newCards]);
          setFlippedIndices([]);
          setMatchesCount((cnt) => {
            const nextCnt = cnt + 1;
            if (nextCnt === cards.length / 2) {
              setIsGameOver(true);
              sounds.playWin();
              try {
                confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
              } catch (e) {}
              if (onEarnReward) onEarnReward(300, 15);
            }
            return nextCnt;
          });
        }, 500);
      } else {
        // NO MATCH
        setTimeout(() => {
          newCards[firstIdx].isFlipped = false;
          newCards[secondIdx].isFlipped = false;
          setCards([...newCards]);
          setFlippedIndices([]);
        }, 1100);
      }
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto py-4 px-4 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between bg-slate-900 border border-slate-800 p-4 rounded-2xl">
        <button
          type="button"
          onClick={onBack}
          className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        <div className="text-center">
          <h2 className="text-base md:text-lg font-black text-white">Kartu Cocok & Memori</h2>
          <span className="text-xs text-cyan-400 font-semibold">
            {matchesCount} / {cards.length / 2} Pasangan Ditemukan
          </span>
        </div>

        <div className="flex items-center gap-2">
          {timerEnabled ? (
            <span className="text-xs font-mono font-bold text-amber-300 bg-slate-800 border border-slate-700 px-2.5 py-1 rounded-xl flex items-center gap-1">
              <Timer className="w-3.5 h-3.5 text-amber-400" />
              <span>{seconds}s</span>
            </span>
          ) : (
            <span className="text-xs font-bold text-emerald-300 bg-emerald-950/40 border border-emerald-500/30 px-2.5 py-1 rounded-xl flex items-center gap-1">
              <TimerOff className="w-3.5 h-3.5 text-emerald-400" />
              <span>Santai</span>
            </span>
          )}

          {onToggleTimer && (
            <button
              type="button"
              onClick={onToggleTimer}
              className={`p-2 rounded-xl border transition-colors cursor-pointer ${
                timerEnabled
                  ? 'text-slate-400 hover:text-white bg-slate-800 border-slate-700'
                  : 'text-emerald-300 bg-emerald-950/30 border-emerald-500/40'
              }`}
              title={timerEnabled ? 'Matikan timer stopwatch' : 'Nyalakan timer stopwatch'}
            >
              {timerEnabled ? <TimerOff className="w-4 h-4" /> : <Timer className="w-4 h-4" />}
            </button>
          )}

          <button
            type="button"
            onClick={setupGame}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
            title="Kocok Ulang Kartu"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 md:gap-4">
        {cards.map((card, idx) => {
          const isRevealed = card.isFlipped || card.isMatched;

          return (
            <div
              key={card.id}
              onClick={() => handleCardClick(idx)}
              className={`h-28 md:h-36 rounded-2xl p-3 flex items-center justify-center text-center font-bold text-xs md:text-sm transition-all duration-300 select-none cursor-pointer border-2 ${
                card.isMatched
                  ? 'bg-emerald-950/40 border-emerald-500 text-emerald-200 shadow-md ring-2 ring-emerald-500/20'
                  : isRevealed
                  ? 'bg-indigo-900 border-indigo-400 text-white shadow-xl scale-[1.02]'
                  : 'bg-slate-800/90 hover:bg-slate-750 border-slate-700 hover:border-slate-500 text-slate-500'
              }`}
            >
              {isRevealed ? (
                <div className="relative">
                  {card.isMatched && (
                    <span className="absolute -top-3 -right-3 w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center text-white">
                      <Check className="w-3 h-3 stroke-[3]" />
                    </span>
                  )}
                  <p className="line-clamp-4 leading-tight">{card.content}</p>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-1 opacity-60">
                  <span className="text-2xl">?</span>
                  <span className="text-[10px] uppercase font-bold tracking-wider">Edu Zone</span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Victory Screen */}
      {isGameOver && (
        <div className="p-6 rounded-3xl bg-slate-900 border-2 border-emerald-500/60 text-center space-y-4 animate-in zoom-in-95 duration-200">
          <Trophy className="w-12 h-12 text-amber-400 mx-auto animate-bounce" />
          <h3 className="text-2xl font-black text-white">Semua Kartu Berhasil Dicocokkan!</h3>
          <p className="text-slate-300 text-sm">
            Diselesaikan dalam <strong className="text-emerald-400">{seconds} detik</strong> dengan{' '}
            <strong className="text-cyan-400">{moves} langkah</strong>.
          </p>
          <div className="flex items-center justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={setupGame}
              className="btn-3d px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-sm cursor-pointer"
            >
              Mainkan Lagi
            </button>
            <button
              type="button"
              onClick={onBack}
              className="btn-3d px-6 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl text-sm cursor-pointer"
            >
              Kembali
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
