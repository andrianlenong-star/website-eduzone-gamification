import React, { useState } from 'react';
import { QuizSet, Question } from '../../types';
import { sounds } from '../../utils/audio';
import { ArrowLeft, Swords, Trophy, RotateCcw } from 'lucide-react';
import confetti from 'canvas-confetti';
import { MultipleChoiceQuestion } from '../QuizPlayer/MultipleChoiceQuestion';
import { TrueFalseQuestion } from '../QuizPlayer/TrueFalseQuestion';

interface Props {
  quizSet: QuizSet;
  onBack: () => void;
}

export const TwoPlayerDuel: React.FC<Props> = ({ quizSet, onBack }) => {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [p1Score, setP1Score] = useState(0);
  const [p2Score, setP2Score] = useState(0);
  const [turn, setTurn] = useState<1 | 2>(1); // Active turn
  const [isAnswered, setIsAnswered] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isGameOver, setIsGameOver] = useState(false);

  // Filter to questions that work smoothly in duel mode (multiple_choice, true_false)
  const duelQuestions = quizSet.questions.filter(
    (q) => q.type === 'multiple_choice' || q.type === 'true_false'
  );
  const currentQ: Question = duelQuestions[currentIdx] || quizSet.questions[0];

  const handleAnswer = (ans: string) => {
    if (isAnswered) return;
    setSelectedAnswer(ans);
    setIsAnswered(true);

    let isCorrect = false;
    if (currentQ.type === 'multiple_choice') {
      if (currentQ.correctIndex !== undefined && currentQ.options) {
        isCorrect = ans === currentQ.options[currentQ.correctIndex];
      } else {
        isCorrect = ans === currentQ.correctAnswer;
      }
    } else if (currentQ.type === 'true_false') {
      const actualTrue = currentQ.isTrue ?? (currentQ.correctAnswer.toLowerCase() === 'benar');
      isCorrect = (ans === 'Benar' && actualTrue) || (ans === 'Salah' && !actualTrue);
    }

    if (isCorrect) {
      sounds.playSuccess();
      if (turn === 1) setP1Score((s) => s + 100);
      else setP2Score((s) => s + 100);
    } else {
      sounds.playError();
    }
  };

  const handleNextRound = () => {
    sounds.playClick();
    if (currentIdx < duelQuestions.length - 1) {
      setCurrentIdx((prev) => prev + 1);
      setTurn((t) => (t === 1 ? 2 : 1));
      setIsAnswered(false);
      setSelectedAnswer(null);
    } else {
      setIsGameOver(true);
      sounds.playWin();
      try {
        confetti({ particleCount: 70, spread: 60 });
      } catch (e) {}
    }
  };

  const restart = () => {
    setCurrentIdx(0);
    setP1Score(0);
    setP2Score(0);
    setTurn(1);
    setIsAnswered(false);
    setSelectedAnswer(null);
    setIsGameOver(false);
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

        <div className="text-center flex items-center gap-2">
          <Swords className="w-5 h-5 text-rose-400" />
          <h2 className="text-base md:text-lg font-black text-white">Duel 2 Pemain (Tantangan Teman)</h2>
        </div>

        <button
          type="button"
          onClick={restart}
          className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>

      {/* Duel Scoreboard */}
      <div className="grid grid-cols-2 gap-4">
        {/* Player 1 Card */}
        <div
          className={`p-4 rounded-2xl border-2 transition-all text-center ${
            turn === 1 && !isGameOver
              ? 'bg-rose-950/40 border-rose-500 ring-2 ring-rose-500/30'
              : 'bg-slate-900/60 border-slate-800 opacity-60'
          }`}
        >
          <div className="text-xs uppercase font-extrabold text-rose-400 mb-1">
            Pemain 1 (Merah) {turn === 1 && !isGameOver ? '• Giliran Menjawab' : ''}
          </div>
          <div className="text-3xl md:text-4xl font-black text-rose-300">{p1Score}</div>
        </div>

        {/* Player 2 Card */}
        <div
          className={`p-4 rounded-2xl border-2 transition-all text-center ${
            turn === 2 && !isGameOver
              ? 'bg-sky-950/40 border-sky-500 ring-2 ring-sky-500/30'
              : 'bg-slate-900/60 border-slate-800 opacity-60'
          }`}
        >
          <div className="text-xs uppercase font-extrabold text-sky-400 mb-1">
            Pemain 2 (Biru) {turn === 2 && !isGameOver ? '• Giliran Menjawab' : ''}
          </div>
          <div className="text-3xl md:text-4xl font-black text-sky-300">{p2Score}</div>
        </div>
      </div>

      {!isGameOver ? (
        <div className="p-6 md:p-8 rounded-3xl bg-slate-900 border-2 border-slate-800 space-y-6">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400">
              Ronde {currentIdx + 1} dari {duelQuestions.length}
            </span>
            <span
              className={`text-xs px-3 py-1 rounded-full font-bold uppercase ${
                turn === 1 ? 'bg-rose-500/20 text-rose-300' : 'bg-sky-500/20 text-sky-300'
              }`}
            >
              Giliran Pemain {turn}
            </span>
          </div>

          <h3 className="text-xl md:text-2xl font-bold text-white text-center leading-relaxed">
            {currentQ.question}
          </h3>

          <div className="pt-2">
            {currentQ.type === 'multiple_choice' ? (
              <MultipleChoiceQuestion
                question={currentQ}
                selectedAnswer={selectedAnswer}
                isAnswerSubmitted={isAnswered}
                onSelectAnswer={handleAnswer}
                disabled={isAnswered}
              />
            ) : (
              <TrueFalseQuestion
                question={currentQ}
                selectedAnswer={selectedAnswer}
                isAnswerSubmitted={isAnswered}
                onSelectAnswer={handleAnswer}
                disabled={isAnswered}
              />
            )}
          </div>

          {isAnswered && (
            <div className="pt-4 flex items-center justify-between border-t border-slate-800">
              <span className="text-xs text-slate-400">
                Kunci: <strong className="text-indigo-300">{currentQ.correctAnswer}</strong>
              </span>

              <button
                type="button"
                onClick={handleNextRound}
                className="btn-3d px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-sm cursor-pointer"
              >
                {currentIdx < duelQuestions.length - 1 ? 'Ronde Berikutnya' : 'Lihat Pemenang'}
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="p-8 rounded-3xl bg-slate-900 border-2 border-amber-500/50 text-center space-y-4 animate-in zoom-in-95 duration-200">
          <Trophy className="w-16 h-16 text-amber-400 mx-auto animate-bounce" />
          <h3 className="text-3xl font-black text-white">
            {p1Score > p2Score
              ? 'Pemain 1 Juara Duel!'
              : p2Score > p1Score
              ? 'Pemain 2 Juara Duel!'
              : 'Hasil Seri, Pertarungan Sengit!'}
          </h3>
          <p className="text-slate-300 text-base">
            Skor Akhir: <strong className="text-rose-400">P1: {p1Score}</strong> vs{' '}
            <strong className="text-sky-400">P2: {p2Score}</strong>
          </p>
          <div className="pt-4 flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={restart}
              className="btn-3d px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-2xl cursor-pointer"
            >
              Tanding Ulang
            </button>
            <button
              type="button"
              onClick={onBack}
              className="btn-3d px-6 py-3 bg-slate-800 hover:bg-slate-750 text-slate-300 font-bold rounded-2xl cursor-pointer"
            >
              Kembali
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
