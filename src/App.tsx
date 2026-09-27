/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { QuizSet, GameMode, PlayerProfile } from './types';
import { DEFAULT_QUIZ_SETS } from './data/defaultBankSoal';
import { Navbar } from './components/Navbar';
import { BankSoalExplorer } from './components/BankSoalExplorer/BankSoalExplorer';
import { QuizPlayer } from './components/QuizPlayer/QuizPlayer';
import { WordMazeGame } from './components/WordMaze/WordMazeGame';
import { MemoryMatchGame } from './components/MemoryMatch/MemoryMatchGame';
import { SpinWheelGame } from './components/SpinWheel/SpinWheelGame';
import { TwoPlayerDuel } from './components/TwoPlayerDuel/TwoPlayerDuel';
import { WorksheetGenerator } from './components/WorksheetGenerator/WorksheetGenerator';
import { QuestionCreator } from './components/QuestionCreator/QuestionCreator';
import { ProfileModal } from './components/ProfileModal';
import { sounds } from './utils/audio';
import {
  decodeQuizFromCode,
  fetchServerQuizzes,
  saveQuizToServer,
  syncCustomQuizzesToServer,
  deleteServerQuiz,
} from './utils/shareQuiz';

function deduplicateQuizzes(...lists: (QuizSet[] | undefined | null)[]): QuizSet[] {
  const map = new Map<string, QuizSet>();
  for (const list of lists) {
    if (Array.isArray(list)) {
      for (const q of list) {
        if (q && q.id) {
          map.set(q.id, q);
        }
      }
    }
  }
  return Array.from(map.values());
}

const INITIAL_PROFILE: PlayerProfile = {
  name: 'Bintang Pelajar',
  avatar: '🚀',
  xp: 1250,
  level: 3,
  coins: 140,
  stats: {
    gamesPlayed: 12,
    correctAnswers: 58,
    totalScore: 48500,
    streakHigh: 8,
  },
  badges: [
    {
      id: 'b-start',
      name: 'Langkah Pertama',
      description: 'Menyelesaikan kuis pertama di Edu Zone',
      icon: '🌱',
      unlockedAt: '2026-09-01',
    },
    {
      id: 'b-streak5',
      name: 'Streak Berapi',
      description: 'Menjawab 5 pertanyaan berturut-turut tanpa salah',
      icon: '🔥',
      unlockedAt: '2026-09-10',
    },
    {
      id: 'b-polymath',
      name: 'Penjelajah 4 Format',
      description: 'Menguasai Pilgan, Benar/Salah, Isian, dan Menjodohkan',
      icon: '🧠',
      unlockedAt: '2026-09-15',
    },
    {
      id: 'b-astronomy',
      name: 'Penjelajah Kosmos',
      description: 'Sempurna pada paket IPA & Tata Surya',
      icon: '🪐',
      unlockedAt: '2026-09-20',
    },
  ],
};

export default function App() {
  const [quizSets, setQuizSets] = useState<QuizSet[]>(() => {
    const saved = localStorage.getItem('wayground_custom_quizzes');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return deduplicateQuizzes(DEFAULT_QUIZ_SETS, parsed);
        }
      } catch (e) {
        return DEFAULT_QUIZ_SETS;
      }
    }
    return DEFAULT_QUIZ_SETS;
  });

  const [activeTab, setActiveTab] = useState<'bank-soal' | 'creator'>('bank-soal');
  const [activeGame, setActiveGame] = useState<{ quiz: QuizSet; mode: GameMode } | null>(null);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(sounds.isEnabled());
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const [playerProfile, setPlayerProfile] = useState<PlayerProfile>(() => {
    const saved = localStorage.getItem('wayground_profile');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return INITIAL_PROFILE;
      }
    }
    return INITIAL_PROFILE;
  });

  useEffect(() => {
    localStorage.setItem('wayground_profile', JSON.stringify(playerProfile));
  }, [playerProfile]);

  // Initial Sync from URL params and Server Storage
  useEffect(() => {
    // 1. Check for URL query params: ?shareQuiz=... or ?quizId=... &mode=...
    const urlParams = new URLSearchParams(window.location.search);
    const shareQuizParam = urlParams.get('shareQuiz');
    const quizIdParam = urlParams.get('quizId');
    const modeParam = urlParams.get('mode') as GameMode | null;

    if (shareQuizParam) {
      const decoded = decodeQuizFromCode(shareQuizParam);
      if (decoded) {
        decoded.isCustom = true;
        setQuizSets((prev) => {
          const updated = deduplicateQuizzes([decoded], prev, DEFAULT_QUIZ_SETS);
          const customOnly = updated.filter((q) => q.isCustom);
          localStorage.setItem('wayground_custom_quizzes', JSON.stringify(customOnly));
          return updated;
        });

        // Save decoded quiz to server storage as well
        saveQuizToServer(decoded);

        if (modeParam) {
          setActiveGame({ quiz: decoded, mode: modeParam });
        }

        sounds.playSuccess();
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    } else if (quizIdParam && modeParam) {
      const existing = quizSets.find((q) => q.id === quizIdParam);
      if (existing) {
        setActiveGame({ quiz: existing, mode: modeParam });
      }
    }

    // 2. Fetch quizzes stored on server and merge with localStorage and DEFAULT_QUIZ_SETS
    fetchServerQuizzes().then((serverQuizzes) => {
      if (serverQuizzes && serverQuizzes.length > 0) {
        setQuizSets((prev) => {
          const merged = deduplicateQuizzes(serverQuizzes, prev, DEFAULT_QUIZ_SETS);
          const customOnly = merged.filter((q) => q.isCustom);
          localStorage.setItem('wayground_custom_quizzes', JSON.stringify(customOnly));
          return merged;
        });
      }

      // Also ensure any existing local custom quizzes are synced back to server
      const localCustom = localStorage.getItem('wayground_custom_quizzes');
      if (localCustom) {
        try {
          const parsed = JSON.parse(localCustom);
          if (Array.isArray(parsed) && parsed.length > 0) {
            syncCustomQuizzesToServer(parsed);
          }
        } catch {
          // Ignore
        }
      }
    });
  }, []);

  const handleToggleSound = () => {
    const newState = sounds.toggle();
    setSoundEnabled(newState);
  };

  const handleSelectGame = (quiz: QuizSet, mode: GameMode) => {
    setActiveGame({ quiz, mode });
  };

  const handleSaveQuiz = (newQuiz: QuizSet) => {
    newQuiz.isCustom = true;
    const updated = deduplicateQuizzes([newQuiz], quizSets, DEFAULT_QUIZ_SETS);
    setQuizSets(updated);

    // Save only custom quizzes to localStorage
    const customOnly = updated.filter((q) => q.isCustom);
    localStorage.setItem('wayground_custom_quizzes', JSON.stringify(customOnly));

    // Persist to server backend
    saveQuizToServer(newQuiz);

    setActiveTab('bank-soal');
    sounds.playWin();
  };

  const handleImportQuiz = (quiz: QuizSet) => {
    quiz.isCustom = true;
    const updated = deduplicateQuizzes([quiz], quizSets, DEFAULT_QUIZ_SETS);
    setQuizSets(updated);

    const customOnly = updated.filter((q) => q.isCustom);
    localStorage.setItem('wayground_custom_quizzes', JSON.stringify(customOnly));
    saveQuizToServer(quiz);
  };

  const handleImportMultiple = (quizzes: QuizSet[]) => {
    const tagged = quizzes.map((q) => ({ ...q, isCustom: true }));
    const updated = deduplicateQuizzes(tagged, quizSets, DEFAULT_QUIZ_SETS);
    setQuizSets(updated);

    const customOnly = updated.filter((q) => q.isCustom);
    localStorage.setItem('wayground_custom_quizzes', JSON.stringify(customOnly));
    syncCustomQuizzesToServer(customOnly);
  };

  const handleDeleteQuiz = (id: string) => {
    const updated = quizSets.filter((q) => q.id !== id);
    setQuizSets(updated);

    const customOnly = updated.filter((q) => q.isCustom);
    localStorage.setItem('wayground_custom_quizzes', JSON.stringify(customOnly));
    deleteServerQuiz(id);
    sounds.playClick();
  };

  const handleEarnReward = (xpEarned: number, coinsEarned: number) => {
    setPlayerProfile((prev) => {
      const newXp = prev.xp + xpEarned;
      const newCoins = prev.coins + coinsEarned;
      const newLevel = Math.floor(newXp / 1000) + 1;

      if (newLevel > prev.level) {
        setTimeout(() => sounds.playWin(), 500);
      }

      return {
        ...prev,
        xp: newXp,
        coins: newCoins,
        level: newLevel,
        stats: {
          ...prev.stats,
          gamesPlayed: prev.stats.gamesPlayed + 1,
          totalScore: prev.stats.totalScore + xpEarned * 10,
        },
      };
    });
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      {/* Top Navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={(tab) => {
          setActiveTab(tab);
          setActiveGame(null);
        }}
        soundEnabled={soundEnabled}
        onToggleSound={handleToggleSound}
        playerProfile={playerProfile}
        onOpenProfile={() => setIsProfileOpen(true)}
        onHomeClick={() => {
          setActiveGame(null);
          setActiveTab('bank-soal');
        }}
      />

      {/* Main Content Area */}
      <main className="flex-1 pb-12">
        {/* If in active game mode */}
        {activeGame ? (
          <div>
            {activeGame.mode === 'kuis-kilat' && (
              <QuizPlayer
                quizSet={activeGame.quiz}
                onBack={() => setActiveGame(null)}
                onOpenWorksheet={(quiz) => setActiveGame({ quiz, mode: 'cetak-lks' })}
                onEarnReward={handleEarnReward}
              />
            )}

            {activeGame.mode === 'labirin-kata' && (
              <WordMazeGame
                quizSet={activeGame.quiz}
                onBack={() => setActiveGame(null)}
                onEarnReward={handleEarnReward}
              />
            )}

            {activeGame.mode === 'kartu-cocok' && (
              <MemoryMatchGame
                quizSet={activeGame.quiz}
                onBack={() => setActiveGame(null)}
                onEarnReward={handleEarnReward}
              />
            )}

            {activeGame.mode === 'roda-putar' && (
              <SpinWheelGame
                quizSet={activeGame.quiz}
                onBack={() => setActiveGame(null)}
                onEarnReward={handleEarnReward}
              />
            )}

            {activeGame.mode === 'duel-teman' && (
              <TwoPlayerDuel
                quizSet={activeGame.quiz}
                onBack={() => setActiveGame(null)}
              />
            )}

            {activeGame.mode === 'cetak-lks' && (
              <WorksheetGenerator
                quizSet={activeGame.quiz}
                onBack={() => setActiveGame(null)}
              />
            )}
          </div>
        ) : (
          /* Tab navigation views */
          <div>
            {activeTab === 'bank-soal' && (
              <BankSoalExplorer
                quizSets={quizSets}
                onSelectGame={handleSelectGame}
                onCreateNew={() => setActiveTab('creator')}
                onImportQuiz={handleImportQuiz}
                onImportMultiple={handleImportMultiple}
                onDeleteQuiz={handleDeleteQuiz}
              />
            )}

            {activeTab === 'creator' && (
              <QuestionCreator
                onSaveQuiz={handleSaveQuiz}
                onCancel={() => setActiveTab('bank-soal')}
              />
            )}
          </div>
        )}
      </main>

      {/* Profile Dialog */}
      {isProfileOpen && (
        <ProfileModal
          profile={playerProfile}
          onClose={() => setIsProfileOpen(false)}
        />
      )}
    </div>
  );
}
