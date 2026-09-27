import React, { useState, useRef, useEffect } from 'react';
import { QuizSet, Question } from '../../types';
import { sounds } from '../../utils/audio';
import { ArrowLeft, Play, Sparkles, Award } from 'lucide-react';
import { MultipleChoiceQuestion } from '../QuizPlayer/MultipleChoiceQuestion';
import { TrueFalseQuestion } from '../QuizPlayer/TrueFalseQuestion';
import { FillBlankQuestion } from '../QuizPlayer/FillBlankQuestion';
import { MatchingQuestion } from '../QuizPlayer/MatchingQuestion';

interface Props {
  quizSet: QuizSet;
  onBack: () => void;
  onEarnReward?: (xp: number, coins: number) => void;
}

const SEGMENTS = [
  { label: 'Tantangan 1000 Poin', color: '#6366f1', multiplier: 1 },
  { label: 'DOUBLE XP (2x)', color: '#ec4899', multiplier: 2 },
  { label: 'Bonus Cepat 1500', color: '#10b981', multiplier: 1.5 },
  { label: 'Tantangan Kilat', color: '#f59e0b', multiplier: 1 },
  { label: 'SUPER JACKPOT 3x', color: '#8b5cf6', multiplier: 3 },
  { label: 'Poin Ekstra 800', color: '#06b6d4', multiplier: 1.2 },
];

export const SpinWheelGame: React.FC<Props> = ({ quizSet, onBack, onEarnReward }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isSpinning, setIsSpinning] = useState(false);
  const [currentAngle, setCurrentAngle] = useState(0);
  const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null);
  const [currentMultiplier, setCurrentMultiplier] = useState(1);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isAnswerSubmitted, setIsAnswerSubmitted] = useState(false);
  const [totalScore, setTotalScore] = useState(0);

  // Draw wheel
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const size = canvas.width;
    const center = size / 2;
    const radius = center - 15;
    const numSegs = SEGMENTS.length;
    const anglePerSeg = (2 * Math.PI) / numSegs;

    ctx.clearRect(0, 0, size, size);

    // Save and rotate
    ctx.save();
    ctx.translate(center, center);
    ctx.rotate(currentAngle);

    SEGMENTS.forEach((seg, i) => {
      const startAngle = i * anglePerSeg;
      const endAngle = startAngle + anglePerSeg;

      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, radius, startAngle, endAngle);
      ctx.fillStyle = seg.color;
      ctx.fill();
      ctx.lineWidth = 3;
      ctx.strokeStyle = '#0f172a';
      ctx.stroke();

      // Text
      ctx.save();
      ctx.rotate(startAngle + anglePerSeg / 2);
      ctx.textAlign = 'right';
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 12px Plus Jakarta Sans, sans-serif';
      ctx.fillText(seg.label, radius - 20, 4);
      ctx.restore();
    });

    // Center hub
    ctx.beginPath();
    ctx.arc(0, 0, 24, 0, 2 * Math.PI);
    ctx.fillStyle = '#0f172a';
    ctx.fill();
    ctx.lineWidth = 4;
    ctx.strokeStyle = '#ffffff';
    ctx.stroke();

    ctx.restore();

    // Top pointer
    ctx.beginPath();
    ctx.moveTo(center - 12, 10);
    ctx.lineTo(center + 12, 10);
    ctx.lineTo(center, 34);
    ctx.closePath();
    ctx.fillStyle = '#f59e0b';
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#ffffff';
    ctx.stroke();
  }, [currentAngle]);

  const spinWheel = () => {
    if (isSpinning || selectedQuestion) return;
    setIsSpinning(true);
    sounds.playClick();

    const spinRotations = 5 + Math.random() * 5;
    const targetAngle = currentAngle + spinRotations * 2 * Math.PI;
    const duration = 4000;
    const startTime = performance.now();
    const initialAngle = currentAngle;

    let lastTickAngle = initialAngle;

    const animate = (time: number) => {
      const elapsed = time - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const easeOut = 1 - Math.pow(1 - progress, 3);
      const angle = initialAngle + (targetAngle - initialAngle) * easeOut;

      setCurrentAngle(angle);

      if (Math.abs(angle - lastTickAngle) >= (2 * Math.PI) / SEGMENTS.length) {
        sounds.playClick();
        lastTickAngle = angle;
      }

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        setIsSpinning(false);
        // Determine segment
        const normalizedAngle = (3 * Math.PI / 2 - (angle % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
        const segIndex = Math.floor(normalizedAngle / ((2 * Math.PI) / SEGMENTS.length)) % SEGMENTS.length;
        const wonSeg = SEGMENTS[segIndex];
        setCurrentMultiplier(wonSeg.multiplier);
        sounds.playSuccess();

        // Pick random question
        const randomQ = quizSet.questions[Math.floor(Math.random() * quizSet.questions.length)];
        setSelectedQuestion(randomQ);
        setSelectedAnswer(null);
        setIsAnswerSubmitted(false);
      }
    };

    requestAnimationFrame(animate);
  };

  const handleAnswerSubmit = (ans: string) => {
    if (!selectedQuestion || isAnswerSubmitted) return;
    setSelectedAnswer(ans);
    setIsAnswerSubmitted(true);

    let isCorrect = false;
    if (selectedQuestion.type === 'multiple_choice') {
      if (selectedQuestion.correctIndex !== undefined && selectedQuestion.options) {
        isCorrect = ans === selectedQuestion.options[selectedQuestion.correctIndex];
      } else {
        isCorrect = ans === selectedQuestion.correctAnswer;
      }
    } else if (selectedQuestion.type === 'true_false') {
      const actualTrue = selectedQuestion.isTrue ?? (selectedQuestion.correctAnswer.toLowerCase() === 'benar');
      isCorrect = (ans === 'Benar' && actualTrue) || (ans === 'Salah' && !actualTrue);
    } else if (selectedQuestion.type === 'fill_blank') {
      const cleanUser = ans.trim().toLowerCase();
      const acceptable = (selectedQuestion.acceptableAnswers || []).map((a) => a.trim().toLowerCase());
      acceptable.push(selectedQuestion.correctAnswer.trim().toLowerCase());
      isCorrect = acceptable.includes(cleanUser);
    } else if (selectedQuestion.type === 'matching') {
      const pairs = selectedQuestion.matchingPairs || [];
      const parts = ans.split('; ');
      let correctMatches = 0;
      pairs.forEach((p) => {
        if (parts.includes(`${p.left} => ${p.right}`)) correctMatches++;
      });
      isCorrect = correctMatches === pairs.length;
    }

    if (isCorrect) {
      sounds.playSuccess();
      const points = Math.round(1000 * currentMultiplier);
      setTotalScore((prev) => prev + points);
      if (onEarnReward) onEarnReward(Math.round(points / 10), 5);
    } else {
      sounds.playError();
    }
  };

  const handleNextSpin = () => {
    setSelectedQuestion(null);
    setSelectedAnswer(null);
    setIsAnswerSubmitted(false);
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
          <h2 className="text-base md:text-lg font-black text-white">Roda Putar Soal Edukasi</h2>
          <span className="text-xs text-amber-400 font-semibold">
            {quizSet.title}
          </span>
        </div>

        <div className="px-3.5 py-1 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 font-black text-sm">
          {totalScore} Pts
        </div>
      </div>

      {!selectedQuestion ? (
        <div className="flex flex-col items-center justify-center py-6 space-y-6">
          <div className="relative">
            <canvas
              ref={canvasRef}
              width={340}
              height={340}
              className="drop-shadow-2xl"
            />
          </div>

          <button
            type="button"
            disabled={isSpinning}
            onClick={spinWheel}
            className="btn-3d px-8 py-4 bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 hover:from-amber-400 hover:to-rose-400 text-slate-950 text-lg font-black rounded-2xl flex items-center gap-2 shadow-2xl shadow-orange-500/30 cursor-pointer disabled:opacity-40 uppercase tracking-wider"
          >
            <Sparkles className="w-6 h-6 fill-current" />
            <span>{isSpinning ? 'Sedang Berputar...' : 'PUTAR RODA SEKARANG!'}</span>
          </button>
        </div>
      ) : (
        <div className="p-6 md:p-8 rounded-3xl bg-slate-900/90 border-2 border-indigo-500/40 space-y-6 animate-in zoom-in-95 duration-200">
          <div className="flex items-center justify-between">
            <span className="px-3 py-1 rounded-full text-xs font-black uppercase bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              Format: {selectedQuestion.type.replace('_', ' ').toUpperCase()}
            </span>

            <span className="px-3.5 py-1 rounded-full text-xs font-black bg-amber-500/20 text-amber-300 border border-amber-500/30">
              Pengali: {currentMultiplier}x Nilai Poin!
            </span>
          </div>

          <h3 className="text-xl md:text-2xl font-bold text-white text-center leading-relaxed">
            {selectedQuestion.question}
          </h3>

          <div className="pt-2">
            {selectedQuestion.type === 'multiple_choice' && (
              <MultipleChoiceQuestion
                question={selectedQuestion}
                selectedAnswer={selectedAnswer}
                isAnswerSubmitted={isAnswerSubmitted}
                onSelectAnswer={handleAnswerSubmit}
                disabled={isAnswerSubmitted}
              />
            )}
            {selectedQuestion.type === 'true_false' && (
              <TrueFalseQuestion
                question={selectedQuestion}
                selectedAnswer={selectedAnswer}
                isAnswerSubmitted={isAnswerSubmitted}
                onSelectAnswer={handleAnswerSubmit}
                disabled={isAnswerSubmitted}
              />
            )}
            {selectedQuestion.type === 'fill_blank' && (
              <FillBlankQuestion
                question={selectedQuestion}
                selectedAnswer={selectedAnswer}
                isAnswerSubmitted={isAnswerSubmitted}
                onSubmitAnswer={handleAnswerSubmit}
                disabled={isAnswerSubmitted}
              />
            )}
            {selectedQuestion.type === 'matching' && (
              <MatchingQuestion
                question={selectedQuestion}
                selectedAnswer={selectedAnswer}
                isAnswerSubmitted={isAnswerSubmitted}
                onSubmitAnswer={handleAnswerSubmit}
                disabled={isAnswerSubmitted}
              />
            )}
          </div>

          {isAnswerSubmitted && (
            <div className="pt-4 flex items-center justify-between border-t border-slate-800">
              <div className="text-xs text-slate-300">
                Kunci:{' '}
                <strong className="text-indigo-300 font-bold ml-1">
                  {selectedQuestion.correctAnswer}
                </strong>
              </div>

              <button
                type="button"
                onClick={handleNextSpin}
                className="btn-3d px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-sm cursor-pointer"
              >
                Putar Roda Lagi
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
