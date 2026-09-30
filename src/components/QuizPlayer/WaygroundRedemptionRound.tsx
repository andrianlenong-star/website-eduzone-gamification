import React, { useState } from 'react';
import { AnswerRecord, Question } from '../../types';
import { MultipleChoiceQuestion } from './MultipleChoiceQuestion';
import { TrueFalseQuestion } from './TrueFalseQuestion';
import { FillBlankQuestion } from './FillBlankQuestion';
import { MatchingQuestion } from './MatchingQuestion';
import { sounds } from '../../utils/audio';
import {
  Sparkles,
  Heart,
  RotateCcw,
  CheckCircle2,
  XCircle,
  ArrowRight,
  Award,
  Zap,
} from 'lucide-react';

interface Props {
  missedRecords: AnswerRecord[];
  onCompleteRedemption: (redeemedRecord?: AnswerRecord) => void;
  onSkipRedemption: () => void;
}

export const WaygroundRedemptionRound: React.FC<Props> = ({
  missedRecords,
  onCompleteRedemption,
  onSkipRedemption,
}) => {
  const [selectedRecordIndex, setSelectedRecordIndex] = useState<number | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isAnswerSubmitted, setIsAnswerSubmitted] = useState(false);
  const [isRedeemedCorrect, setIsRedeemedCorrect] = useState<boolean | null>(null);

  const activeRecord =
    selectedRecordIndex !== null ? missedRecords[selectedRecordIndex] : null;

  const handleSelectMissed = (idx: number) => {
    setSelectedRecordIndex(idx);
    setSelectedAnswer(null);
    setIsAnswerSubmitted(false);
    setIsRedeemedCorrect(null);
    sounds.playClick();
  };

  const handleSubmitAnswer = (ans: string) => {
    if (!activeRecord) return;
    setSelectedAnswer(ans);
    setIsAnswerSubmitted(true);

    const q = activeRecord.question;
    let correct = false;

    if (q.type === 'multiple_choice') {
      correct =
        ans === q.correctAnswer ||
        Boolean(q.correctIndex !== undefined && q.options && q.options[q.correctIndex] === ans);
    } else if (q.type === 'true_false') {
      const isTrueExpected =
        q.isTrue ?? (q.correctAnswer.toLowerCase() === 'benar');
      const isUserTrue = ans.toLowerCase() === 'benar';
      correct = isTrueExpected === isUserTrue;
    } else if (q.type === 'fill_blank') {
      const cleanUser = ans.trim().toLowerCase();
      const cleanExpected = q.correctAnswer.trim().toLowerCase();
      const alternatives = (q.acceptableAnswers || []).map((a) => a.trim().toLowerCase());
      correct = cleanUser === cleanExpected || alternatives.includes(cleanUser);
    } else if (q.type === 'matching') {
      const pairs = q.matchingPairs || [];
      const parts = ans.split(' | ');
      let matches = 0;
      pairs.forEach((p) => {
        if (parts.includes(`${p.left} => ${p.right}`)) matches++;
      });
      correct = matches === pairs.length;
    }

    setIsRedeemedCorrect(correct);

    if (correct) {
      sounds.playSuccess();
    } else {
      sounds.playError();
    }
  };

  const handleFinish = () => {
    if (activeRecord && isRedeemedCorrect) {
      const updated: AnswerRecord = {
        ...activeRecord,
        userAnswer: selectedAnswer || activeRecord.userAnswer,
        isCorrect: true,
        pointsEarned: 800, // Redemption points
      };
      onCompleteRedemption(updated);
    } else {
      onCompleteRedemption();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-slate-900 border-2 border-purple-500/50 rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl shadow-purple-950/50 space-y-6 relative overflow-hidden">
        {/* Glow decoration */}
        <div className="absolute -top-24 -left-24 w-52 h-52 bg-purple-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-52 h-52 bg-pink-500/20 rounded-full blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-purple-500/20 text-purple-300 border border-purple-500/30">
            <Heart className="w-3.5 h-3.5 text-pink-400 fill-current animate-pulse" />
            <span>KESEMPATAN KEDUA (REDEMPTION ROUND)</span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-black text-white">
            Tebus Soal yang Sempat Salah!
          </h2>

          <p className="text-xs sm:text-sm text-slate-300 max-w-md mx-auto">
            Wayground memberimu kesempatan untuk memperbaiki 1 pertanyaan yang sempat keliru dan
            meraih bonus poin penebusan!
          </p>
        </div>

        {/* Step 1: Pick a missed question if none chosen */}
        {selectedRecordIndex === null && (
          <div className="space-y-3">
            <span className="text-xs font-extrabold uppercase text-slate-400 block text-center">
              Pilih salah satu soal untuk ditebus:
            </span>

            <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
              {missedRecords.map((rec, idx) => (
                <button
                  key={rec.questionId || idx}
                  type="button"
                  onClick={() => handleSelectMissed(idx)}
                  className="w-full p-4 rounded-2xl bg-slate-800 hover:bg-slate-750 border border-slate-700 hover:border-purple-500/60 text-left transition-all cursor-pointer flex items-center justify-between gap-3 group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="w-8 h-8 rounded-xl bg-purple-600/30 text-purple-300 font-black text-xs flex items-center justify-center shrink-0 border border-purple-500/40">
                      #{idx + 1}
                    </span>
                    <p className="text-xs sm:text-sm font-bold text-slate-200 group-hover:text-white truncate">
                      {rec.question.question}
                    </p>
                  </div>
                  <span className="px-3 py-1 rounded-xl bg-purple-600 text-white font-extrabold text-xs shrink-0 shadow-sm">
                    Pilih ➔
                  </span>
                </button>
              ))}
            </div>

            <div className="pt-2 text-center">
              <button
                type="button"
                onClick={onSkipRedemption}
                className="text-xs text-slate-400 hover:text-white transition-colors cursor-pointer underline"
              >
                Lewati Penebusan & Langsung ke Hasil
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Answer the chosen question */}
        {activeRecord && (
          <div className="space-y-5">
            {/* Question card */}
            <div className="p-4 sm:p-5 rounded-2xl bg-slate-800/90 border border-slate-700 space-y-2">
              <span className="text-[10px] font-black uppercase tracking-wider text-purple-400 block">
                Pertanyaan Penebusan:
              </span>
              <p className="text-sm sm:text-base font-extrabold text-white leading-relaxed">
                {activeRecord.question.question}
              </p>
            </div>

            {/* Answer Input based on Type */}
            <div className="pt-1">
              {activeRecord.question.type === 'multiple_choice' && (
                <MultipleChoiceQuestion
                  question={activeRecord.question}
                  selectedAnswer={selectedAnswer}
                  isAnswerSubmitted={isAnswerSubmitted}
                  onSelectAnswer={handleSubmitAnswer}
                  disabled={isAnswerSubmitted}
                />
              )}

              {activeRecord.question.type === 'true_false' && (
                <TrueFalseQuestion
                  question={activeRecord.question}
                  selectedAnswer={selectedAnswer}
                  isAnswerSubmitted={isAnswerSubmitted}
                  onSelectAnswer={handleSubmitAnswer}
                  disabled={isAnswerSubmitted}
                />
              )}

              {activeRecord.question.type === 'fill_blank' && (
                <FillBlankQuestion
                  question={activeRecord.question}
                  selectedAnswer={selectedAnswer}
                  isAnswerSubmitted={isAnswerSubmitted}
                  onSubmitAnswer={handleSubmitAnswer}
                  disabled={isAnswerSubmitted}
                />
              )}

              {activeRecord.question.type === 'matching' && (
                <MatchingQuestion
                  question={activeRecord.question}
                  selectedAnswer={selectedAnswer}
                  isAnswerSubmitted={isAnswerSubmitted}
                  onSubmitAnswer={handleSubmitAnswer}
                  disabled={isAnswerSubmitted}
                />
              )}
            </div>

            {/* Feedback result of redemption */}
            {isAnswerSubmitted && (
              <div
                className={`p-4 rounded-2xl border text-center space-y-2 animate-in fade-in duration-200 ${
                  isRedeemedCorrect
                    ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-300'
                    : 'bg-rose-950/40 border-rose-500/50 text-rose-300'
                }`}
              >
                <div className="flex items-center justify-center gap-2 font-black text-sm sm:text-base">
                  {isRedeemedCorrect ? (
                    <>
                      <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                      <span>Penebusan Berhasil! (+800 Poin Bonus)</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="w-5 h-5 text-rose-400" />
                      <span>Belum Tepat, Kunci: {activeRecord.question.correctAnswer}</span>
                    </>
                  )}
                </div>

                <button
                  type="button"
                  onClick={handleFinish}
                  className="btn-3d mt-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-extrabold text-xs sm:text-sm inline-flex items-center gap-2 cursor-pointer shadow-lg shadow-purple-950/50"
                >
                  <span>Lihat Papan Peringkat Akhir</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
