import React, { useState, useEffect, useRef } from 'react';
import { QuizSet, Question, AnswerRecord } from '../../types';
import { MultipleChoiceQuestion } from './MultipleChoiceQuestion';
import { TrueFalseQuestion } from './TrueFalseQuestion';
import { FillBlankQuestion } from './FillBlankQuestion';
import { MatchingQuestion } from './MatchingQuestion';
import { QuizResult } from './QuizResult';
import { WaygroundLobby } from './WaygroundLobby';
import { WaygroundFeedbackOverlay } from './WaygroundFeedbackOverlay';
import { WaygroundRedemptionRound } from './WaygroundRedemptionRound';
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
  KeyRound,
  Eye,
  X,
  Shield,
  Award,
  Crown,
  Volume2,
  VolumeX,
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
  // Game Flow Stage: lobby -> countdown -> playing -> redemption -> result
  const [gameStage, setGameStage] = useState<'lobby' | 'countdown' | 'playing' | 'redemption' | 'result'>('lobby');
  const [countdownValue, setCountdownValue] = useState<number | string>(3);

  // Player Wayground Identity
  const [playerName, setPlayerName] = useState('Bintang Juara');
  const [playerAvatar, setPlayerAvatar] = useState('🚀');
  const [showMemes, setShowMemes] = useState(true);
  const [currentRank, setCurrentRank] = useState(3); // Simulated live rank in class (3 -> 2 -> 1)

  // Quiz Progress
  const [currentIndex, setCurrentIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(QUESTION_TIME_SECONDS);
  const [isFrozen, setIsFrozen] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isAnswerSubmitted, setIsAnswerSubmitted] = useState(false);
  const [records, setRecords] = useState<AnswerRecord[]>([]);
  const [streak, setStreak] = useState(0);
  const [maxStreak, setMaxStreak] = useState(0);
  const [totalScore, setTotalScore] = useState(0);

  // Powerups states
  const [used5050, setUsed5050] = useState(false);
  const [usedFreeze, setUsedFreeze] = useState(false);
  const [usedHint, setUsedHint] = useState(false);
  const [isHintVisible, setIsHintVisible] = useState(false);
  const [eliminatedOptions, setEliminatedOptions] = useState<string[]>([]);
  const [usedShield, setUsedShield] = useState(false);
  const [hasShieldActive, setHasShieldActive] = useState(false);

  // Modal "Buka Jawaban" ala Wayground
  const [isRevealModalOpen, setIsRevealModalOpen] = useState(false);

  // Instant Feedback Overlay state
  const [feedbackOverlay, setFeedbackOverlay] = useState<{
    isCorrect: boolean;
    question: Question;
    userAnswer: string;
    pointsEarned: number;
    speedBonus: number;
  } | null>(null);

  // Redemption Round tracker
  const [redemptionDone, setRedemptionDone] = useState(false);

  const timerRef = useRef<any>(null);
  const currentQuestion: Question | undefined = quizSet.questions[currentIndex];
  const currentRecord = currentQuestion
    ? records.find((r) => r.questionId === currentQuestion.id)
    : undefined;

  // Start from Lobby handler
  const handleStartFromLobby = (settings: {
    nickname: string;
    avatar: string;
    showMemes: boolean;
    timerEnabled: boolean;
  }) => {
    setPlayerName(settings.nickname);
    setPlayerAvatar(settings.avatar);
    setShowMemes(settings.showMemes);
    setGameStage('countdown');
    setCountdownValue(3);
    sounds.playCountdownBeep(false);

    // 3... 2... 1... GO! sequence
    setTimeout(() => {
      setCountdownValue(2);
      sounds.playCountdownBeep(false);
    }, 900);

    setTimeout(() => {
      setCountdownValue(1);
      sounds.playCountdownBeep(false);
    }, 1800);

    setTimeout(() => {
      setCountdownValue('GO!');
      sounds.playCountdownBeep(true);
    }, 2700);

    setTimeout(() => {
      setGameStage('playing');
    }, 3400);
  };

  // Restore or reset question state when moving between questions
  useEffect(() => {
    setIsRevealModalOpen(false);
    setFeedbackOverlay(null);
    if (!currentQuestion) return;
    const existing = records.find((r) => r.questionId === currentQuestion.id);
    if (existing) {
      setSelectedAnswer(existing.userAnswer);
      setIsAnswerSubmitted(true);
      setTimeLeft(0);
      setIsFrozen(false);
      setIsHintVisible(false);
      setEliminatedOptions([]);
    } else {
      setTimeLeft(QUESTION_TIME_SECONDS);
      setSelectedAnswer(null);
      setIsAnswerSubmitted(false);
      setIsFrozen(false);
      setIsHintVisible(false);
      setEliminatedOptions([]);
    }
  }, [currentIndex, currentQuestion?.id]);

  // Timer countdown
  useEffect(() => {
    if (!timerEnabled || gameStage !== 'playing' || isAnswerSubmitted || isFrozen) return;

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
  }, [currentIndex, isAnswerSubmitted, isFrozen, gameStage, timerEnabled]);

  const handleTimeExpired = () => {
    if (isAnswerSubmitted) return;
    submitEvaluation('(Waktu Habis)', false, 0);
  };

  // Keyboard shortcuts in play mode
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (gameStage !== 'playing') return;

      // Don't intercept when user is typing in input or textarea
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      if (e.key === 'ArrowLeft' && currentIndex > 0) {
        e.preventDefault();
        handlePrevQuestion();
        return;
      }

      if (e.key === 'ArrowRight') {
        e.preventDefault();
        handleNextQuestion();
        return;
      }

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
  }, [currentIndex, isAnswerSubmitted, gameStage, currentQuestion, eliminatedOptions]);

  // Evaluate Answer
  const submitEvaluation = (userAns: string, isCorrect: boolean, timeSpent: number) => {
    setIsAnswerSubmitted(true);
    clearInterval(timerRef.current);

    let multiplier = 1;
    let newStreak = streak;

    const basePoints = 1000;
    const speedBonus = timerEnabled ? Math.round(timeLeft * 30) : 350;

    if (isCorrect) {
      newStreak = streak + 1;
      setStreak(newStreak);
      if (newStreak > maxStreak) setMaxStreak(newStreak);

      if (newStreak >= 5) multiplier = 3;
      else if (newStreak >= 3) multiplier = 2;
      else if (newStreak >= 2) multiplier = 1.5;

      const earned = Math.round((basePoints + speedBonus) * multiplier);
      setTotalScore((prev) => prev + earned);

      // Rank advances when answering correctly and fast!
      setCurrentRank((prev) => Math.max(1, prev - 1));

      if (newStreak >= 3) {
        sounds.playStreak();
      } else {
        sounds.playSuccess();
      }

      setRecords((prev) => {
        const filtered = prev.filter((r) => r.questionId !== currentQuestion?.id);
        return [
          ...filtered,
          {
            questionId: currentQuestion!.id,
            question: currentQuestion!,
            userAnswer: userAns,
            isCorrect: true,
            timeSpentSeconds: timeSpent,
            pointsEarned: earned,
          },
        ];
      });

      if (showMemes && currentQuestion) {
        setFeedbackOverlay({
          isCorrect: true,
          question: currentQuestion,
          userAnswer: userAns,
          pointsEarned: earned,
          speedBonus,
        });
      }
    } else {
      if (hasShieldActive) {
        // Shield protected the streak!
        setHasShieldActive(false);
        sounds.playPowerup();
      } else {
        setStreak(0);
        setCurrentRank((prev) => Math.min(5, prev + 1));
      }

      sounds.playError();

      setRecords((prev) => {
        const filtered = prev.filter((r) => r.questionId !== currentQuestion?.id);
        return [
          ...filtered,
          {
            questionId: currentQuestion!.id,
            question: currentQuestion!,
            userAnswer: userAns,
            isCorrect: false,
            timeSpentSeconds: timeSpent,
            pointsEarned: 0,
          },
        ];
      });

      if (showMemes && currentQuestion) {
        setFeedbackOverlay({
          isCorrect: false,
          question: currentQuestion,
          userAnswer: userAns,
          pointsEarned: 0,
          speedBonus: 0,
        });
      }
    }
  };

  const handleSelectAnswer = (ans: string) => {
    if (isAnswerSubmitted || !currentQuestion) return;
    setSelectedAnswer(ans);

    const timeSpent = timerEnabled ? QUESTION_TIME_SECONDS - timeLeft : 0;
    let isCorrect = false;

    if (currentQuestion.type === 'multiple_choice') {
      const optByIndex =
        currentQuestion.correctIndex !== undefined &&
        currentQuestion.options &&
        currentQuestion.options[currentQuestion.correctIndex];
      const optByAnswer =
        currentQuestion.correctAnswer &&
        currentQuestion.options?.find(
          (o) => o.trim().toLowerCase() === currentQuestion.correctAnswer.trim().toLowerCase()
        );

      const expectedAnswer = optByIndex || optByAnswer || currentQuestion.correctAnswer;
      isCorrect = ans.trim().toLowerCase() === (expectedAnswer || '').trim().toLowerCase();
    } else if (currentQuestion.type === 'true_false') {
      const actualTrue = currentQuestion.isTrue ?? (currentQuestion.correctAnswer.toLowerCase() === 'benar');
      isCorrect = (ans === 'Benar' && actualTrue) || (ans === 'Salah' && !actualTrue);
    } else if (currentQuestion.type === 'fill_blank') {
      const cleanUser = ans.trim().toLowerCase();
      const acceptable = (currentQuestion.acceptableAnswers || []).map((a) => a.trim().toLowerCase());
      acceptable.push(currentQuestion.correctAnswer.trim().toLowerCase());
      isCorrect = acceptable.includes(cleanUser);
    } else if (currentQuestion.type === 'matching') {
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

  // Fitur "Buka Jawaban" ala Wayground: Langsung membuka kunci & pembahasan
  const handleRevealAnswer = () => {
    sounds.playPowerup();
    if (!currentQuestion) return;

    if (!isAnswerSubmitted) {
      setIsAnswerSubmitted(true);
      setSelectedAnswer(currentQuestion.correctAnswer);
      setTimeLeft(0);
      clearInterval(timerRef.current);

      setRecords((prev) => {
        const filtered = prev.filter((r) => r.questionId !== currentQuestion.id);
        return [
          ...filtered,
          {
            questionId: currentQuestion.id,
            question: currentQuestion,
            userAnswer: '(Membuka Kunci Jawaban)',
            isCorrect: false,
            timeSpentSeconds: timerEnabled ? QUESTION_TIME_SECONDS - timeLeft : 0,
            pointsEarned: 0,
          },
        ];
      });
    }

    setIsRevealModalOpen(true);
  };

  const handlePrevQuestion = () => {
    sounds.playClick();
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  };

  const handleNextQuestion = () => {
    sounds.playClick();
    setFeedbackOverlay(null);

    if (currentIndex < quizSet.questions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      // Last question reached
      const answeredIds = new Set(records.map((r) => r.questionId));
      const missingRecords: AnswerRecord[] = [];
      quizSet.questions.forEach((q) => {
        if (!answeredIds.has(q.id)) {
          missingRecords.push({
            questionId: q.id,
            question: q,
            userAnswer: '(Tidak dijawab)',
            isCorrect: false,
            timeSpentSeconds: 0,
            pointsEarned: 0,
          });
        }
      });

      const finalRecords = [...records, ...missingRecords];
      setRecords(finalRecords);

      // Check if redemption round can be offered (Wayground classic mechanic)
      const missed = finalRecords.filter((r) => !r.isCorrect);
      if (missed.length > 0 && !redemptionDone) {
        setGameStage('redemption');
        return;
      }

      finishQuiz(finalRecords);
    }
  };

  const finishQuiz = (finalRecords: AnswerRecord[]) => {
    setGameStage('result');

    const totalEarned = finalRecords.reduce((acc, r) => acc + (r.pointsEarned || 0), 0);
    const correctCount = finalRecords.filter((r) => r.isCorrect).length;
    const coinsEarned = Math.round(correctCount * 15);
    const xpEarned = Math.round(totalEarned / 10);

    if (onEarnReward) {
      onEarnReward(xpEarned, coinsEarned);
    }
  };

  // Power-up handlers
  const handleUse5050 = () => {
    if (used5050 || isAnswerSubmitted || !currentQuestion || currentQuestion.type !== 'multiple_choice') return;
    const options = currentQuestion.options || [];
    const correct = currentQuestion.correctAnswer;
    const incorrect = options.filter((opt) => opt !== correct);

    // Shuffle and pick 2 incorrect options to eliminate
    const shuffled = [...incorrect].sort(() => 0.5 - Math.random());
    const toEliminate = shuffled.slice(0, 2);

    setEliminatedOptions(toEliminate);
    setUsed5050(true);
    sounds.playPowerup();
  };

  const handleUseFreeze = () => {
    if (usedFreeze || isAnswerSubmitted || !timerEnabled) return;
    setIsFrozen(true);
    setUsedFreeze(true);
    sounds.playPowerup();

    setTimeout(() => {
      setIsFrozen(false);
    }, 10000);
  };

  const handleUseHint = () => {
    if (usedHint || isAnswerSubmitted) return;
    setIsHintVisible(true);
    setUsedHint(true);
    sounds.playPowerup();
  };

  const handleUseShield = () => {
    if (usedShield || isAnswerSubmitted) return;
    setUsedShield(true);
    setHasShieldActive(true);
    sounds.playPowerup();
  };

  // 1. STAGE: LOBBY
  if (gameStage === 'lobby') {
    return (
      <WaygroundLobby
        quizSet={quizSet}
        onStartGame={handleStartFromLobby}
        onBack={onBack}
        timerEnabled={timerEnabled}
        onToggleTimer={onToggleTimer}
        soundEnabled={sounds.isEnabled()}
        onToggleSound={() => sounds.toggle()}
      />
    );
  }

  // 2. STAGE: COUNTDOWN (3... 2... 1... GO!)
  if (gameStage === 'countdown') {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/95 backdrop-blur-md select-none">
        <div className="text-center space-y-4 animate-in zoom-in-50 duration-300">
          <div className="text-8xl sm:text-9xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-pink-500 to-indigo-500 tracking-tighter drop-shadow-[0_10px_20px_rgba(236,72,153,0.5)] animate-pulse">
            {countdownValue}
          </div>
          <p className="text-base sm:text-xl font-black text-indigo-300 uppercase tracking-widest">
            {countdownValue === 'GO!' ? 'SEMANGAT MENJAWAB!' : 'BERSIAPLAH!'}
          </p>
        </div>
      </div>
    );
  }

  // 3. STAGE: REDEMPTION ROUND
  if (gameStage === 'redemption') {
    const missed = records.filter((r) => !r.isCorrect);
    return (
      <WaygroundRedemptionRound
        missedRecords={missed}
        onCompleteRedemption={(redeemed) => {
          setRedemptionDone(true);
          if (redeemed) {
            const updatedRecords = records.map((r) =>
              r.questionId === redeemed.questionId ? redeemed : r
            );
            setRecords(updatedRecords);
            setTotalScore((prev) => prev + redeemed.pointsEarned);
            finishQuiz(updatedRecords);
          } else {
            finishQuiz(records);
          }
        }}
        onSkipRedemption={() => {
          setRedemptionDone(true);
          finishQuiz(records);
        }}
      />
    );
  }

  // 4. STAGE: RESULT (Podium & Analysis)
  if (gameStage === 'result') {
    return (
      <QuizResult
        quizSet={quizSet}
        records={records}
        totalScore={totalScore}
        maxStreak={maxStreak}
        playerName={playerName}
        playerAvatar={playerAvatar}
        onRestart={() => {
          setCurrentIndex(0);
          setRecords([]);
          setStreak(0);
          setMaxStreak(0);
          setTotalScore(0);
          setUsed5050(false);
          setUsedFreeze(false);
          setUsedHint(false);
          setUsedShield(false);
          setHasShieldActive(false);
          setRedemptionDone(false);
          setGameStage('lobby');
        }}
        onBack={onBack}
        onOpenWorksheet={() => onOpenWorksheet(quizSet)}
      />
    );
  }

  // 5. STAGE: PLAYING (The Game Arena)
  if (!currentQuestion) return null;

  const timerPercent = (timeLeft / QUESTION_TIME_SECONDS) * 100;
  const progressPercent = ((currentIndex + (isAnswerSubmitted ? 1 : 0)) / quizSet.questions.length) * 100;

  return (
    <div className="w-full max-w-4xl mx-auto py-3 px-4 space-y-4 animate-in fade-in duration-200">
      {/* Wayground Full-Width Top Progress Bar */}
      <div className="fixed top-0 left-0 right-0 z-50 h-2 bg-slate-900 border-b border-indigo-500/20">
        <div
          className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 transition-all duration-300 shadow-sm shadow-pink-500/50"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* Wayground Top Header: Rank, Streak Flame, Live Score */}
      <div className="flex items-center justify-between gap-3 p-3.5 sm:p-4 rounded-2xl bg-slate-900/95 border-2 border-indigo-500/30 shadow-xl backdrop-blur-md">
        {/* Left: Player Info & Simulated Live Rank */}
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-xl shadow-md border border-indigo-400/40">
            {playerAvatar}
          </div>

          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs sm:text-sm font-black text-white max-w-[120px] truncate">
                {playerName}
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1">
                <Crown className="w-3 h-3 text-amber-400" />
                <span>#{currentRank}</span>
              </span>
            </div>
            <span className="text-[11px] font-bold text-slate-400 block">
              Soal {currentIndex + 1} dari {quizSet.questions.length}
            </span>
          </div>
        </div>

        {/* Center: Streak Flame Multiplier */}
        <div className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-slate-800/90 border border-amber-500/30 text-amber-300 font-black text-xs sm:text-sm shadow-inner">
          <Flame className={`w-4 h-4 text-amber-400 ${streak >= 2 ? 'animate-bounce text-orange-400' : ''}`} />
          <span>Streak x{Math.max(1, streak)}</span>
        </div>

        {/* Right: Live Score */}
        <div className="flex items-center gap-2">
          <div className="text-right">
            <span className="text-[10px] font-black uppercase text-slate-400 block tracking-wider">
              SKOR
            </span>
            <span className="text-base sm:text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-300 to-yellow-200">
              {totalScore.toLocaleString('id-ID')}
            </span>
          </div>
        </div>
      </div>

      {/* Timer & Power-ups Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 px-1">
        {/* Timer Bar or Untimed Mode */}
        <div className="flex items-center gap-2 flex-1 max-w-sm">
          {timerEnabled ? (
            <>
              <div
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-mono font-black text-xs border transition-all ${
                  isFrozen
                    ? 'bg-cyan-500/20 border-cyan-400 text-cyan-200 animate-pulse'
                    : timeLeft <= 5
                    ? 'bg-rose-500/20 border-rose-500 text-rose-300 animate-pulse'
                    : 'bg-slate-800/90 border-slate-700 text-slate-200'
                }`}
              >
                <Timer className="w-3.5 h-3.5 text-amber-400" />
                <span>{isFrozen ? 'BEKU 10s' : `${timeLeft}s`}</span>
              </div>

              <div className="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden hidden sm:block border border-slate-700">
                <div
                  className={`h-full transition-all duration-1000 ${
                    timeLeft <= 5 ? 'bg-rose-500' : 'bg-cyan-500'
                  }`}
                  style={{ width: `${timerPercent}%` }}
                />
              </div>
            </>
          ) : (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 font-bold text-xs">
              <TimerOff className="w-3.5 h-3.5 text-emerald-400" />
              <span>Santai (Tanpa Timer)</span>
            </div>
          )}
        </div>

        {/* Powerups Buttons */}
        <div className="flex items-center gap-1.5">
          {currentQuestion.type === 'multiple_choice' && (
            <button
              type="button"
              disabled={used5050 || isAnswerSubmitted}
              onClick={handleUse5050}
              className="px-2.5 sm:px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-xs font-bold text-amber-300 border border-amber-500/30 flex items-center gap-1 transition-all cursor-pointer"
              title="50:50 (Eliminasi 2 Opsi Salah)"
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
              className="px-2.5 sm:px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-xs font-bold text-cyan-300 border border-cyan-500/30 flex items-center gap-1 transition-all cursor-pointer"
              title="Bekukan Timer 10 Detik"
            >
              <Snowflake className="w-3.5 h-3.5 text-cyan-400" />
              <span>Bekukan</span>
            </button>
          )}

          <button
            type="button"
            disabled={usedHint || isAnswerSubmitted || isHintVisible}
            onClick={handleUseHint}
            className="px-2.5 sm:px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-xs font-bold text-emerald-300 border border-emerald-500/30 flex items-center gap-1 transition-all cursor-pointer"
            title="Buka Petunjuk Bantuan"
          >
            <Lightbulb className="w-3.5 h-3.5 text-emerald-400" />
            <span>Petunjuk</span>
          </button>

          {/* Immunity Shield Powerup */}
          <button
            type="button"
            disabled={usedShield || isAnswerSubmitted}
            onClick={handleUseShield}
            className={`px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-bold border flex items-center gap-1 transition-all cursor-pointer ${
              hasShieldActive
                ? 'bg-purple-600 text-white border-purple-400 animate-pulse'
                : 'bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-purple-300 border-purple-500/30'
            }`}
            title="Perisai Kebal (Melindungi streak jika 1 kali salah)"
          >
            <Shield className="w-3.5 h-3.5 text-purple-400" />
            <span>Perisai</span>
          </button>

          {/* Tombol Buka Jawaban ala Wayground */}
          <button
            type="button"
            onClick={handleRevealAnswer}
            className="px-2.5 sm:px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500/20 via-emerald-500/20 to-amber-500/20 hover:from-amber-500/30 hover:via-emerald-500/30 hover:to-amber-500/30 text-amber-300 hover:text-white border border-amber-500/40 hover:border-emerald-400 text-xs font-black flex items-center gap-1 transition-all cursor-pointer shadow-md active:scale-95"
            title="Buka Kunci Jawaban & Pembahasan Lengkap (Wayground Mode)"
          >
            <KeyRound className="w-3.5 h-3.5 text-amber-400" />
            <span>Buka Kunci</span>
          </button>
        </div>
      </div>

      {/* Hint Alert if Active */}
      {isHintVisible && (
        <div className="p-3.5 rounded-2xl bg-amber-950/40 border border-amber-500/40 text-amber-200 text-xs sm:text-sm flex items-start gap-2.5 animate-in fade-in duration-200">
          <Lightbulb className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <strong className="text-amber-300 font-bold block mb-0.5">Petunjuk Soal:</strong>
            <p>{currentQuestion.hint || 'Perhatikan materi dan konsep kunci yang ditanyakan pada soal ini.'}</p>
          </div>
        </div>
      )}

      {/* Question Card Box */}
      <div className="relative bg-slate-900 border-2 border-slate-800 rounded-3xl p-5 md:p-8 shadow-2xl flex flex-col justify-between min-h-[340px]">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-xs font-extrabold uppercase tracking-wider text-indigo-400">
              Pertanyaan #{currentIndex + 1} • {currentQuestion.subject || quizSet.category}
            </span>
            <span className="text-xs font-extrabold text-slate-400">
              {currentQuestion.type === 'multiple_choice' && 'Pilihan Ganda'}
              {currentQuestion.type === 'true_false' && 'Benar / Salah'}
              {currentQuestion.type === 'fill_blank' && 'Isian Singkat'}
              {currentQuestion.type === 'matching' && 'Menjodohkan'}
            </span>
          </div>

          <h2 className="text-lg sm:text-2xl font-black text-white leading-relaxed">
            {currentQuestion.question}
          </h2>

          {/* Interactive Question Input Components (All 4 Types Maintained) */}
          <div className="pt-2">
            {currentQuestion.type === 'multiple_choice' && (
              <MultipleChoiceQuestion
                question={currentQuestion}
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

        {/* Bottom Navigation Bar: 'Buka Jawaban' di kiri, 'Sebelum' di tengah, & 'Selanjutnya' di kanan */}
        <div className="mt-8 pt-4 border-t border-slate-800/80 flex items-center justify-between gap-2 sm:gap-3">
          {/* Tombol Buka Jawaban di kiri */}
          <button
            type="button"
            onClick={handleRevealAnswer}
            className="px-4 sm:px-5 py-2.5 md:py-3.5 rounded-2xl font-black text-xs md:text-sm flex items-center gap-2 transition-all cursor-pointer bg-gradient-to-r from-amber-500/20 via-emerald-500/20 to-amber-500/20 hover:from-amber-500/30 hover:via-emerald-500/30 hover:to-amber-500/30 text-amber-300 hover:text-white border border-amber-500/40 hover:border-emerald-400 shadow-lg shadow-amber-950/30 active:scale-95"
            title="Buka Kunci Jawaban & Pembahasan Lengkap (Wayground Mode)"
          >
            <Eye className="w-4 h-4 md:w-5 md:h-5 text-amber-400" />
            <span>Buka Jawaban</span>
          </button>

          {/* Tombol Sebelum di tengah */}
          <button
            type="button"
            onClick={handlePrevQuestion}
            disabled={currentIndex === 0}
            className={`px-4 sm:px-5 py-2.5 md:py-3.5 rounded-2xl font-bold text-xs md:text-sm flex items-center gap-2 transition-all cursor-pointer ${
              currentIndex === 0
                ? 'opacity-30 bg-slate-800/50 text-slate-500 border border-slate-700/50 cursor-not-allowed'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 hover:border-indigo-500/50 shadow-md active:scale-95'
            }`}
            title={currentIndex === 0 ? 'Ini soal pertama' : 'Kembali ke soal sebelumnya'}
          >
            <ArrowLeft className="w-4 h-4 md:w-5 md:h-5" />
            <span>Sebelum</span>
          </button>

          {/* Tombol Selanjutnya di kanan */}
          <button
            type="button"
            onClick={handleNextQuestion}
            className="btn-3d px-5 md:px-8 py-2.5 md:py-3.5 rounded-2xl bg-gradient-to-r from-indigo-600 via-sky-600 to-indigo-600 hover:from-indigo-500 hover:to-sky-500 text-white font-extrabold text-xs md:text-sm flex items-center gap-2.5 shadow-xl shadow-indigo-950/60 transition-all cursor-pointer active:scale-95 border border-indigo-400/30"
          >
            <span>
              {currentIndex < quizSet.questions.length - 1 ? 'Selanjutnya' : 'Selesai & Hasil'}
            </span>
            <ArrowRight className="w-4 h-4 md:w-5 md:h-5" />
          </button>
        </div>
      </div>

      {/* Answer Feedback Drawer if Submitted */}
      {isAnswerSubmitted && !feedbackOverlay && (
        <div className="p-4 sm:p-5 rounded-2xl bg-slate-900 border-2 border-indigo-500/40 shadow-xl space-y-3 animate-in fade-in duration-150">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              {currentRecord?.isCorrect ? (
                <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/40">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
              ) : (
                <div className="w-8 h-8 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center border border-rose-500/40">
                  <XCircle className="w-5 h-5" />
                </div>
              )}
              <div>
                <span className="text-xs font-black text-white block">
                  {currentRecord?.isCorrect
                    ? `Jawaban Benar (+${currentRecord.pointsEarned} Poin)`
                    : 'Kurang Tepat'}
                </span>
                <span className="text-[11px] text-slate-400">
                  Kunci: <strong className="text-emerald-300">{currentQuestion.correctAnswer}</strong>
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsRevealModalOpen(true)}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 font-extrabold text-xs flex items-center gap-1.5 border border-amber-500/30 cursor-pointer"
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>Detail Pembahasan</span>
            </button>
          </div>

          <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700 text-xs text-slate-300 leading-relaxed">
            <strong className="text-indigo-300 block mb-0.5">Pembahasan:</strong>
            <p>{currentQuestion.explanation || 'Pembahasan materi untuk memperdalam pemahaman.'}</p>
          </div>
        </div>
      )}

      {/* WAYGROUND MEME / REACTION OVERLAY (On each answer) */}
      {feedbackOverlay && (
        <WaygroundFeedbackOverlay
          isCorrect={feedbackOverlay.isCorrect}
          question={feedbackOverlay.question}
          userAnswer={feedbackOverlay.userAnswer}
          pointsEarned={feedbackOverlay.pointsEarned}
          streak={streak}
          speedBonus={feedbackOverlay.speedBonus}
          currentRank={currentRank}
          onNext={handleNextQuestion}
          onOpenReveal={() => {
            setFeedbackOverlay(null);
            setIsRevealModalOpen(true);
          }}
        />
      )}

      {/* WAYGROUND DETAIL KUNCI JAWABAN MODAL */}
      {isRevealModalOpen && currentQuestion && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-slate-900 border-2 border-amber-500/50 rounded-3xl max-w-xl w-full p-5 md:p-7 shadow-2xl shadow-amber-950/40 relative overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between gap-3 border-b border-slate-800 pb-4 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/40 flex items-center justify-center shrink-0">
                  <KeyRound className="w-5 h-5 animate-pulse" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black text-white">
                    Kunci Jawaban Resmi
                  </h3>
                  <span className="text-xs text-slate-400">
                    Soal {currentIndex + 1} dari {quizSet.questions.length} • Wayground Mode
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsRevealModalOpen(false)}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer border border-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="py-4 space-y-4 overflow-y-auto pr-1">
              <div className="bg-slate-800/80 border border-slate-700 rounded-2xl p-4">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1">
                  Pertanyaan:
                </span>
                <p className="text-sm sm:text-base font-bold text-white">
                  {currentQuestion.question}
                </p>
              </div>

              <div className="bg-emerald-950/60 border-2 border-emerald-500/60 rounded-2xl p-4 space-y-1.5">
                <div className="text-xs font-black text-emerald-400 flex items-center gap-1.5 uppercase">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Kunci Jawaban Benar:</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-900 border border-emerald-500/40 text-base sm:text-lg font-black text-emerald-300">
                  {currentQuestion.correctAnswer}
                </div>
              </div>

              <div className="bg-indigo-950/40 border border-indigo-500/40 rounded-2xl p-4 space-y-1.5">
                <div className="text-xs font-black text-indigo-400 flex items-center gap-1.5 uppercase">
                  <BookOpen className="w-4 h-4" />
                  <span>Pembahasan Materi:</span>
                </div>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  {currentQuestion.explanation || 'Pembahasan materi pembelajaran untuk memperdalam konsep.'}
                </p>
              </div>

              {currentQuestion.hint && (
                <div className="bg-amber-950/30 border border-amber-500/30 rounded-2xl p-3 flex items-start gap-2">
                  <Lightbulb className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <p className="text-xs text-amber-200">
                    <strong>Petunjuk: </strong>{currentQuestion.hint}
                  </p>
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-slate-800 flex items-center justify-between gap-3 shrink-0">
              <button
                type="button"
                onClick={() => setIsRevealModalOpen(false)}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold cursor-pointer"
              >
                Tutup Kunci
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsRevealModalOpen(false);
                  handleNextQuestion();
                }}
                className="btn-3d px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs sm:text-sm flex items-center gap-2 cursor-pointer shadow-md"
              >
                <span>Lanjut Soal Berikutnya</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
