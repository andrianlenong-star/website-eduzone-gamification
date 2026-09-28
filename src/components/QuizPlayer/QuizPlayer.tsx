import React, { useState, useEffect, useRef } from 'react';
import { QuizSet, Question, AnswerRecord } from '../../types';
import { MultipleChoiceQuestion } from './MultipleChoiceQuestion';
import { TrueFalseQuestion } from './TrueFalseQuestion';
import { FillBlankQuestion } from './FillBlankQuestion';
import { MatchingQuestion } from './MatchingQuestion';
import { QuizResult } from './QuizResult';
import { sounds } from '../../utils/audio';
import {
  Timer,
  TimerOff,
  Flame,
  Zap,
  Snowflake,
  Lightbulb,
  ArrowRight,
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  XCircle,
  Sparkles,
} from 'lucide-react';

interface Props {
  quizSet: QuizSet;
  onBack: () => void;
  onOpenWorksheet: (quiz: QuizSet) => void;
  onEarnReward?: (xp: number, coins: number) => void;
  timerEnabled?: boolean;
  onToggleTimer?: () => void;
}

const QUESTION_TIME_SECONDS = 25;

export const QuizPlayer: React.FC<Props> = ({
  quizSet,
  onBack,
  onOpenWorksheet,
  onEarnReward,
  timerEnabled = true,
  onToggleTimer,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(QUESTION_TIME_SECONDS);
  const [isFrozen, setIsFrozen] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isAnswerSubmitted, setIsAnswerSubmitted] = useState(false);
  const [records, setRecords] = useState<AnswerRecord[]>([]);
  const [streak, setStreak] = useState(0);
  const [maxStreak, setMaxStreak] = useState(0);
  const [totalScore, setTotalScore] = useState(0);
  const [quizFinished, setQuizFinished] = useState(false);

  // Powerups states (1 use per quiz)
  const [used5050, setUsed5050] = useState(false);
  const [usedFreeze, setUsedFreeze] = useState(false);
  const [usedHint, setUsedHint] = useState(false);
  const [isHintVisible, setIsHintVisible] = useState(false);
  const [eliminatedOptions, setEliminatedOptions] = useState<string[]>([]);

  const timerRef = useRef<any>(null);
  const currentQuestion: Question | undefined = quizSet.questions[currentIndex];

  // Reset question state when moving to next question
  useEffect(() => {
    setTimeLeft(QUESTION_TIME_SECONDS);
    setSelectedAnswer(null);
    setIsAnswerSubmitted(false);
    setIsFrozen(false);
    setIsHintVisible(false);
    setEliminatedOptions([]);
  }, [currentIndex]);

  // Timer countdown
  useEffect(() => {
    if (!timerEnabled || quizFinished || isAnswerSubmitted || isFrozen) return;

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          handleTimeExpired();
          return 0;
        }
        if (prev <= 6) {
          sounds.playCountdownTick(prev === 1);
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timerRef.current);
  }, [currentIndex, isAnswerSubmitted, isFrozen, quizFinished, timerEnabled]);

  const handleTimeExpired = () => {
    if (isAnswerSubmitted) return;
    submitEvaluation('(Waktu Habis)', false, 0);
  };

  // Keyboard shortcuts (1,2,3,4 or B/S for Benar/Salah, Space/Enter for Next)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (quizFinished) return;

      if (isAnswerSubmitted && (e.key === 'Enter' || e.code === 'Space')) {
        e.preventDefault();
        handleNextQuestion();
        return;
      }

      if (isAnswerSubmitted || !currentQuestion) return;

      if (currentQuestion.type === 'multiple_choice' && currentQuestion.options) {
        if (['1', '2', '3', '4'].includes(e.key)) {
          const idx = parseInt(e.key, 10) - 1;
          const opt = currentQuestion.options[idx];
          if (opt && !eliminatedOptions.includes(opt)) {
            handleSelectAnswer(opt);
          }
        }
      } else if (currentQuestion.type === 'true_false') {
        if (e.key.toLowerCase() === 'b' || e.key === '1') {
          handleSelectAnswer('Benar');
        } else if (e.key.toLowerCase() === 's' || e.key === '2') {
          handleSelectAnswer('Salah');
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, isAnswerSubmitted, quizFinished, currentQuestion, eliminatedOptions]);

  // Evaluate Answer
  const submitEvaluation = (userAns: string, isCorrect: boolean, timeSpent: number) => {
    setIsAnswerSubmitted(true);
    clearInterval(timerRef.current);

    let multiplier = 1;
    let newStreak = streak;

    if (isCorrect) {
      newStreak = streak + 1;
      setStreak(newStreak);
      if (newStreak > maxStreak) setMaxStreak(newStreak);

      if (newStreak >= 5) multiplier = 3;
      else if (newStreak >= 3) multiplier = 2;
      else if (newStreak >= 2) multiplier = 1.5;

      const basePoints = 1000;
      const speedBonus = timerEnabled ? Math.round(timeLeft * 30) : 350;
      const earned = Math.round((basePoints + speedBonus) * multiplier);

      setTotalScore((prev) => prev + earned);

      if (newStreak >= 3) {
        sounds.playStreak();
      } else {
        sounds.playSuccess();
      }

      setRecords((prev) => [
        ...prev,
        {
          questionId: currentQuestion.id,
          question: currentQuestion,
          userAnswer: userAns,
          isCorrect: true,
          timeSpentSeconds: timeSpent,
          pointsEarned: earned,
        },
      ]);
    } else {
      setStreak(0);
      sounds.playError();

      setRecords((prev) => [
        ...prev,
        {
          questionId: currentQuestion.id,
          question: currentQuestion,
          userAnswer: userAns,
          isCorrect: false,
          timeSpentSeconds: timeSpent,
          pointsEarned: 0,
        },
      ]);
    }
  };

  const handleSelectAnswer = (ans: string) => {
    if (isAnswerSubmitted || !currentQuestion) return;
    setSelectedAnswer(ans);

    const timeSpent = timerEnabled ? QUESTION_TIME_SECONDS - timeLeft : 0;
    let isCorrect = false;

    if (currentQuestion.type === 'multiple_choice') {
      if (currentQuestion.correctIndex !== undefined && currentQuestion.options) {
        isCorrect = ans === currentQuestion.options[currentQuestion.correctIndex];
      } else {
        isCorrect = ans === currentQuestion.correctAnswer;
      }
    } else if (currentQuestion.type === 'true_false') {
      const actualTrue = currentQuestion.isTrue ?? (currentQuestion.correctAnswer.toLowerCase() === 'benar');
      isCorrect = (ans === 'Benar' && actualTrue) || (ans === 'Salah' && !actualTrue);
    } else if (currentQuestion.type === 'fill_blank') {
      const cleanUser = ans.trim().toLowerCase();
      const acceptable = (currentQuestion.acceptableAnswers || []).map((a) => a.trim().toLowerCase());
      acceptable.push(currentQuestion.correctAnswer.trim().toLowerCase());
      isCorrect = acceptable.includes(cleanUser);
    } else if (currentQuestion.type === 'matching') {
      // Matching summary grading
      const pairs = currentQuestion.matchingPairs || [];
      const parts = ans.split('; ');
      let correctMatches = 0;
      pairs.forEach((p) => {
        const expected = `${p.left} => ${p.right}`;
        if (parts.includes(expected)) {
          correctMatches++;
        }
      });
      isCorrect = correctMatches === pairs.length;
    }

    submitEvaluation(ans, isCorrect, timeSpent);
  };

  const handleNextQuestion = () => {
    sounds.playClick();
    if (currentIndex < quizSet.questions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      setQuizFinished(true);
      if (onEarnReward) {
        const xpEarned = Math.round(totalScore / 10);
        const coinsEarned = Math.round(totalScore / 50);
        onEarnReward(xpEarned, coinsEarned);
      }
    }
  };

  // Powerups logic
  const handleUse5050 = () => {
    if (used5050 || isAnswerSubmitted || currentQuestion?.type !== 'multiple_choice') return;
    setUsed5050(true);
    sounds.playClick();

    const options = currentQuestion.options || [];
    const correct = currentQuestion.correctAnswer;
    const wrongs = options.filter((o) => o !== correct);
    const shuffledWrongs = [...wrongs].sort(() => Math.random() - 0.5);
    const toEliminate = shuffledWrongs.slice(0, 2);
    setEliminatedOptions(toEliminate);
  };

  const handleUseFreeze = () => {
    if (usedFreeze || isAnswerSubmitted) return;
    setUsedFreeze(true);
    setIsFrozen(true);
    sounds.playClick();
    setTimeout(() => {
      setIsFrozen(false);
    }, 10000);
  };

  const handleUseHint = () => {
    if (usedHint || isAnswerSubmitted) return;
    setUsedHint(true);
    setIsHintVisible(true);
    sounds.playClick();
  };

  if (quizFinished) {
    return (
      <QuizResult
        quizSet={quizSet}
        records={records}
        totalScore={totalScore}
        maxStreak={maxStreak}
        onRestart={() => {
          setCurrentIndex(0);
          setRecords([]);
          setStreak(0);
          setMaxStreak(0);
          setTotalScore(0);
          setQuizFinished(false);
          setUsed5050(false);
          setUsedFreeze(false);
          setUsedHint(false);
        }}
        onBack={onBack}
        onOpenWorksheet={() => onOpenWorksheet(quizSet)}
      />
    );
  }

  if (!currentQuestion) {
    return <div>Soal tidak tersedia</div>;
  }

  const formatConfig = {
    multiple_choice: {
      label: 'Pilihan Ganda',
      badge: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
    },
    true_false: {
      label: 'Benar / Salah',
      badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    },
    fill_blank: {
      label: 'Isian Singkat',
      badge: 'bg-violet-500/20 text-violet-300 border-violet-500/30',
    },
    matching: {
      label: 'Menjodohkan',
      badge: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
    },
  }[currentQuestion.type];

  // Filter options if 50:50 power-up was used
  const activeQuestionWithOptions: Question = {
    ...currentQuestion,
    options: (currentQuestion.options || []).map((opt) =>
      eliminatedOptions.includes(opt) ? '(Telah dieliminasi 50:50)' : opt
    ),
  };

  const progressPercent = ((currentIndex + 1) / quizSet.questions.length) * 100;
  const timerPercent = (timeLeft / QUESTION_TIME_SECONDS) * 100;

  return (
    <div className="w-full max-w-5xl mx-auto py-3 md:py-6 px-3 sm:px-4 space-y-4">
      {/* Top Bar Navigation & HUD */}
      <div className="flex items-center justify-between gap-3 bg-slate-900/90 border border-slate-800 p-3.5 rounded-2xl shadow-xl backdrop-blur-sm">
        <button
          type="button"
          onClick={onBack}
          className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
          title="Keluar ke Menu"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        {/* Progress Tracker */}
        <div className="flex-1 max-w-md mx-2">
          <div className="flex items-center justify-between text-xs font-bold text-slate-300 mb-1.5">
            <span className="truncate pr-2">{quizSet.title}</span>
            <span className="shrink-0 text-indigo-400">
              Soal {currentIndex + 1} / {quizSet.questions.length}
            </span>
          </div>
          <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden p-0.5 border border-slate-700/60">
            <div
              className="h-full bg-gradient-to-r from-indigo-500 via-sky-500 to-emerald-500 rounded-full transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Streak & Score Indicators */}
        <div className="flex items-center gap-2.5">
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 font-extrabold text-sm">
            <Flame
              className={`w-4 h-4 text-amber-400 ${
                streak >= 2 ? 'animate-bounce text-orange-400' : ''
              }`}
            />
            <span>{streak}x</span>
          </div>

          <div className="px-3.5 py-1 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 font-black text-sm md:text-base">
            {totalScore.toLocaleString('id-ID')}
          </div>
        </div>
      </div>

      {/* Timer & Power-ups Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-1">
        {/* Animated Timer Pill / Untimed Mode */}
        <div className="flex items-center gap-2 flex-1 max-w-sm">
          {timerEnabled ? (
            <>
              <div
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full font-mono font-bold text-sm border transition-all ${
                  isFrozen
                    ? 'bg-cyan-500/20 border-cyan-400 text-cyan-200 animate-pulse'
                    : timeLeft <= 5
                    ? 'bg-rose-500/20 border-rose-500 text-rose-300 animate-pulse'
                    : 'bg-slate-800/80 border-slate-700 text-slate-200'
                }`}
              >
                <Timer className="w-4 h-4 shrink-0 text-amber-400" />
                <span>{isFrozen ? 'BEKU (10s)' : `${timeLeft}s`}</span>
              </div>

              <div className="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden hidden sm:block">
                <div
                  className={`h-full transition-all duration-1000 ${
                    timeLeft <= 5 ? 'bg-rose-500' : 'bg-cyan-500'
                  }`}
                  style={{ width: `${timerPercent}%` }}
                />
              </div>
            </>
          ) : (
            <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 font-bold text-xs shadow-sm">
              <TimerOff className="w-4 h-4 shrink-0 text-emerald-400" />
              <span>Bebas Waktu (Santai)</span>
            </div>
          )}

          {/* Quick Toggle Button directly in game */}
          {onToggleTimer && (
            <button
              type="button"
              onClick={onToggleTimer}
              className={`px-2.5 py-1.5 rounded-xl border text-[11px] font-extrabold transition-all cursor-pointer flex items-center gap-1.5 ${
                timerEnabled
                  ? 'bg-slate-800/90 border-slate-700 text-slate-400 hover:text-amber-300 hover:border-amber-500/40'
                  : 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300 hover:bg-emerald-900/40'
              }`}
              title={
                timerEnabled
                  ? 'Klik untuk Matikan Timer (Mode Santai tanpa batas waktu)'
                  : 'Klik untuk Nyalakan Timer (Mode Hitungan Mundur 25s)'
              }
            >
              {timerEnabled ? (
                <>
                  <TimerOff className="w-3.5 h-3.5 text-slate-400" />
                  <span className="hidden md:inline">Matikan Timer</span>
                </>
              ) : (
                <>
                  <Timer className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="hidden md:inline">Nyalakan Timer</span>
                </>
              )}
            </button>
          )}
        </div>

        {/* Powerups Buttons */}
        <div className="flex items-center gap-2">
          {currentQuestion.type === 'multiple_choice' && (
            <button
              type="button"
              disabled={used5050 || isAnswerSubmitted}
              onClick={handleUse5050}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-xs font-bold text-amber-300 border border-amber-500/30 flex items-center gap-1 transition-all cursor-pointer"
              title="Gunakan 50:50 untuk mengeliminasi 2 jawaban salah"
            >
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span>50:50</span>
            </button>
          )}

          {timerEnabled && (
            <button
              type="button"
              disabled={usedFreeze || isAnswerSubmitted}
              onClick={handleUseFreeze}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-xs font-bold text-cyan-300 border border-cyan-500/30 flex items-center gap-1 transition-all cursor-pointer"
              title="Bekukan waktu selama 10 detik"
            >
              <Snowflake className="w-3.5 h-3.5 text-cyan-400" />
              <span>Bekukan</span>
            </button>
          )}

          <button
            type="button"
            disabled={usedHint || isAnswerSubmitted || isHintVisible}
            onClick={handleUseHint}
            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-xs font-bold text-emerald-300 border border-emerald-500/30 flex items-center gap-1 transition-all cursor-pointer"
            title="Buka petunjuk bantuan"
          >
            <Lightbulb className="w-3.5 h-3.5 text-emerald-400" />
            <span>Petunjuk</span>
          </button>
        </div>
      </div>

      {/* Hint Alert if Active */}
      {isHintVisible && (
        <div className="p-3.5 rounded-2xl bg-amber-950/40 border border-amber-500/40 text-amber-200 text-sm flex items-start gap-2.5 animate-in fade-in duration-200">
          <Lightbulb className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <strong className="block text-amber-300 font-bold mb-0.5">Petunjuk:</strong>
            <p>{currentQuestion.hint}</p>
          </div>
        </div>
      )}

      {/* Main Question Card */}
      <div className="relative overflow-hidden bg-slate-900/90 border-2 border-indigo-500/30 rounded-3xl p-5 md:p-8 shadow-2xl backdrop-blur-md">
        {/* Category & Format Badges */}
        <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-slate-800 text-slate-300 border border-slate-700">
              {currentQuestion.subject || quizSet.category}
            </span>
            <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-slate-800 text-indigo-300 border border-indigo-500/40">
              {currentQuestion.targetClass || quizSet.targetClass || `Kelas ${currentQuestion.grade || quizSet.grade}`}
            </span>
          </div>

          <span
            className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider border ${formatConfig.badge}`}
          >
            {formatConfig.label}
          </span>
        </div>

        {/* Question Text */}
        <h2 className="text-xl md:text-3xl font-extrabold text-white text-center my-4 md:my-6 leading-relaxed max-w-3xl mx-auto">
          {currentQuestion.question}
        </h2>

        {/* Dynamic Question Body by Type */}
        <div className="mt-6 md:mt-8">
          {currentQuestion.type === 'multiple_choice' && (
            <MultipleChoiceQuestion
              question={activeQuestionWithOptions}
              selectedAnswer={selectedAnswer}
              isAnswerSubmitted={isAnswerSubmitted}
              onSelectAnswer={handleSelectAnswer}
              disabled={isAnswerSubmitted}
            />
          )}

          {currentQuestion.type === 'true_false' && (
            <TrueFalseQuestion
              question={currentQuestion}
              selectedAnswer={selectedAnswer}
              isAnswerSubmitted={isAnswerSubmitted}
              onSelectAnswer={handleSelectAnswer}
              disabled={isAnswerSubmitted}
            />
          )}

          {currentQuestion.type === 'fill_blank' && (
            <FillBlankQuestion
              question={currentQuestion}
              selectedAnswer={selectedAnswer}
              isAnswerSubmitted={isAnswerSubmitted}
              onSubmitAnswer={handleSelectAnswer}
              disabled={isAnswerSubmitted}
            />
          )}

          {currentQuestion.type === 'matching' && (
            <MatchingQuestion
              question={currentQuestion}
              selectedAnswer={selectedAnswer}
              isAnswerSubmitted={isAnswerSubmitted}
              onSubmitAnswer={handleSelectAnswer}
              disabled={isAnswerSubmitted}
            />
          )}
        </div>
      </div>

      {/* Answer Feedback & Explanation Drawer */}
      {isAnswerSubmitted && (
        <div className="p-5 md:p-6 rounded-3xl bg-slate-900 border-2 border-indigo-500/50 shadow-2xl space-y-4 animate-in slide-in-from-bottom-4 duration-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              {records[records.length - 1]?.isCorrect ? (
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0">
                  <CheckCircle2 className="w-8 h-8 stroke-[2.5]" />
                </div>
              ) : (
                <div className="w-12 h-12 rounded-2xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400 shrink-0">
                  <XCircle className="w-8 h-8 stroke-[2.5]" />
                </div>
              )}

              <div>
                <h3 className="text-lg md:text-xl font-black text-white">
                  {records[records.length - 1]?.isCorrect
                    ? `Luar Biasa! Jawaban Benar (+${records[records.length - 1]?.pointsEarned} Poin)`
                    : 'Kurang Tepat, Jangan Menyerah!'}
                </h3>
                <p className="text-xs text-slate-400">
                  Kunci:{' '}
                  <strong className="text-indigo-300 font-semibold">
                    {currentQuestion.correctAnswer}
                  </strong>
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleNextQuestion}
              className="btn-3d px-6 py-3.5 bg-gradient-to-r from-indigo-600 to-sky-600 hover:from-indigo-500 hover:to-sky-500 text-white font-extrabold rounded-2xl flex items-center justify-center gap-2 shadow-xl shadow-indigo-950/50 cursor-pointer text-sm md:text-base"
            >
              <span>
                {currentIndex < quizSet.questions.length - 1
                  ? 'Soal Berikutnya'
                  : 'Lihat Hasil Akhir'}
              </span>
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>

          {/* Pembahasan Detail */}
          <div className="p-4 rounded-2xl bg-indigo-950/30 border border-indigo-500/30 text-xs md:text-sm text-indigo-200/90 leading-relaxed">
            <strong className="text-indigo-300 font-bold block mb-1 flex items-center gap-1.5">
              <BookOpen className="w-4 h-4 text-indigo-400" />
              <span>Pembahasan Lengkap:</span>
            </strong>
            <p>{currentQuestion.explanation}</p>
          </div>
        </div>
      )}
    </div>
  );
};
