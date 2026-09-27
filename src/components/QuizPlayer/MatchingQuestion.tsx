import React, { useState, useEffect } from 'react';
import { Question, MatchingPair } from '../../types';
import { Check, X, ArrowRight, RotateCcw, Sparkles } from 'lucide-react';
import { sounds } from '../../utils/audio';

interface Props {
  question: Question;
  selectedAnswer: string | null;
  isAnswerSubmitted: boolean;
  onSubmitAnswer: (matchedSummary: string) => void;
  disabled: boolean;
}

const PAIR_COLORS = [
  { border: 'border-blue-500', bg: 'bg-blue-500/20 text-blue-200', tag: 'bg-blue-500' },
  { border: 'border-purple-500', bg: 'bg-purple-500/20 text-purple-200', tag: 'bg-purple-500' },
  { border: 'border-amber-500', bg: 'bg-amber-500/20 text-amber-200', tag: 'bg-amber-500' },
  { border: 'border-emerald-500', bg: 'bg-emerald-500/20 text-emerald-200', tag: 'bg-emerald-500' },
  { border: 'border-rose-500', bg: 'bg-rose-500/20 text-rose-200', tag: 'bg-rose-500' },
];

export const MatchingQuestion: React.FC<Props> = ({
  question,
  isAnswerSubmitted,
  onSubmitAnswer,
  disabled,
}) => {
  const originalPairs = question.matchingPairs || [];
  const [shuffledRights, setShuffledRights] = useState<string[]>([]);
  const [activeLeft, setActiveLeft] = useState<string | null>(null);
  // pairs map: leftText -> rightText
  const [userMatches, setUserMatches] = useState<Record<string, string>>({});

  useEffect(() => {
    // Shuffle right items on load
    const rights = originalPairs.map((p) => p.right);
    const shuffled = [...rights].sort(() => Math.random() - 0.5);
    setShuffledRights(shuffled);
    setUserMatches({});
    setActiveLeft(null);
  }, [question.id]);

  const handleSelectLeft = (leftText: string) => {
    if (disabled || isAnswerSubmitted) return;
    sounds.playClick();
    if (activeLeft === leftText) {
      setActiveLeft(null);
    } else {
      setActiveLeft(leftText);
    }
  };

  const handleSelectRight = (rightText: string) => {
    if (disabled || isAnswerSubmitted) return;
    if (!activeLeft) return;

    // Check if rightText is already matched to another left
    const newMatches = { ...userMatches };
    Object.keys(newMatches).forEach((k) => {
      if (newMatches[k] === rightText) {
        delete newMatches[k];
      }
    });

    newMatches[activeLeft] = rightText;
    setUserMatches(newMatches);
    setActiveLeft(null);
    sounds.playMatchPair();
  };

  const handleUnmatch = (leftText: string) => {
    if (disabled || isAnswerSubmitted) return;
    const newMatches = { ...userMatches };
    delete newMatches[leftText];
    setUserMatches(newMatches);
    sounds.playClick();
  };

  const allMatched = originalPairs.length > 0 && Object.keys(userMatches).length === originalPairs.length;

  const handleSubmit = () => {
    if (!allMatched || disabled || isAnswerSubmitted) return;
    const summary = Object.entries(userMatches)
      .map(([l, r]) => `${l} => ${r}`)
      .join('; ');
    onSubmitAnswer(summary);
  };

  const getPairIndex = (leftText: string) => {
    return originalPairs.findIndex((p) => p.left === leftText);
  };

  const isMatchedCorrect = (leftText: string, rightText: string) => {
    const pair = originalPairs.find((p) => p.left === leftText);
    return pair ? pair.right === rightText : false;
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="text-center mb-3">
        <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
          Format: Menjodohkan Pasangan (Klik Kiri lalu Klik Kanan)
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 relative">
        {/* Kolom Kiri */}
        <div className="space-y-2.5">
          <h4 className="text-xs uppercase tracking-wider text-slate-400 font-extrabold flex items-center gap-1.5 px-1">
            <span>Kolom Istilah / Konsep</span>
          </h4>

          {originalPairs.map((pair, idx) => {
            const isSelected = activeLeft === pair.left;
            const matchedRight = userMatches[pair.left];
            const color = PAIR_COLORS[idx % PAIR_COLORS.length];
            const isCorrect = isAnswerSubmitted && matchedRight && isMatchedCorrect(pair.left, matchedRight);
            const isWrong = isAnswerSubmitted && matchedRight && !isCorrect;

            return (
              <div
                key={pair.id || idx}
                onClick={() => handleSelectLeft(pair.left)}
                className={`p-3.5 md:p-4 rounded-xl border-2 transition-all cursor-pointer relative flex items-center justify-between ${
                  isAnswerSubmitted
                    ? isCorrect
                      ? 'bg-emerald-950/40 border-emerald-500 text-emerald-200'
                      : isWrong
                      ? 'bg-rose-950/40 border-rose-500 text-rose-200'
                      : 'bg-slate-800/50 border-slate-700 text-slate-400'
                    : isSelected
                    ? 'bg-indigo-600/30 border-indigo-400 ring-2 ring-indigo-400 text-white shadow-lg'
                    : matchedRight
                    ? `${color.bg} ${color.border}`
                    : 'bg-slate-800/80 hover:bg-slate-750 border-slate-700 hover:border-slate-500 text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-lg bg-black/30 flex items-center justify-center text-xs font-bold shrink-0">
                    {idx + 1}
                  </span>
                  <span className="font-bold text-sm md:text-base">{pair.left}</span>
                </div>

                {matchedRight && !isAnswerSubmitted && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleUnmatch(pair.left);
                    }}
                    className="text-xs px-2 py-0.5 rounded bg-black/30 hover:bg-rose-500/40 text-slate-300 hover:text-white transition-colors"
                  >
                    Lepas
                  </button>
                )}

                {isAnswerSubmitted && (
                  <span className="shrink-0 ml-2">
                    {isCorrect ? (
                      <Check className="w-5 h-5 text-emerald-400 stroke-[3]" />
                    ) : (
                      <X className="w-5 h-5 text-rose-400 stroke-[3]" />
                    )}
                  </span>
                )}
              </div>
            );
          })}
        </div>

        {/* Kolom Kanan */}
        <div className="space-y-2.5">
          <h4 className="text-xs uppercase tracking-wider text-slate-400 font-extrabold flex items-center gap-1.5 px-1">
            <span>Kolom Pasangan / Jawaban</span>
          </h4>

          {shuffledRights.map((rightText, idx) => {
            // Find which left has matched this right
            const matchedLeft = Object.keys(userMatches).find((k) => userMatches[k] === rightText);
            const leftIdx = matchedLeft ? getPairIndex(matchedLeft) : -1;
            const color = leftIdx >= 0 ? PAIR_COLORS[leftIdx % PAIR_COLORS.length] : null;

            const isCorrect =
              isAnswerSubmitted && matchedLeft && isMatchedCorrect(matchedLeft, rightText);
            const isWrong = isAnswerSubmitted && matchedLeft && !isCorrect;

            return (
              <div
                key={idx}
                onClick={() => handleSelectRight(rightText)}
                className={`p-3.5 md:p-4 rounded-xl border-2 transition-all cursor-pointer relative flex items-center justify-between ${
                  isAnswerSubmitted
                    ? isCorrect
                      ? 'bg-emerald-950/40 border-emerald-500 text-emerald-200'
                      : isWrong
                      ? 'bg-rose-950/40 border-rose-500 text-rose-200'
                      : 'bg-slate-800/50 border-slate-700 text-slate-400'
                    : color
                    ? `${color.bg} ${color.border}`
                    : activeLeft
                    ? 'bg-indigo-950/30 border-dashed border-indigo-400 hover:bg-indigo-900/40 text-white animate-pulse'
                    : 'bg-slate-800/80 hover:bg-slate-750 border-slate-700 hover:border-slate-500 text-white'
                }`}
              >
                <span className="text-sm md:text-base font-medium pr-2">{rightText}</span>

                {matchedLeft && (
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-bold shrink-0 text-white ${
                      color?.tag || 'bg-indigo-600'
                    }`}
                  >
                    Pasangan #{leftIdx + 1}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Action Footer */}
      {!isAnswerSubmitted && (
        <div className="mt-5 flex items-center justify-between bg-slate-800/60 p-3.5 rounded-2xl border border-slate-700/60">
          <div className="text-xs text-slate-300">
            Terpasang:{' '}
            <strong className="text-indigo-400 text-sm">
              {Object.keys(userMatches).length}
            </strong>{' '}
            dari {originalPairs.length} pasangan
          </div>

          <div className="flex items-center gap-2">
            {Object.keys(userMatches).length > 0 && (
              <button
                type="button"
                onClick={() => setUserMatches({})}
                className="px-3 py-1.5 text-xs text-slate-400 hover:text-white flex items-center gap-1 transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset</span>
              </button>
            )}

            <button
              type="button"
              disabled={!allMatched || disabled}
              onClick={handleSubmit}
              className="btn-3d px-5 py-2.5 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-40 text-white text-sm font-bold rounded-xl flex items-center gap-1.5 shadow-md shadow-cyan-900/40 cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              <span>Kunci Jawaban</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
