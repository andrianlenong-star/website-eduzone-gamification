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
import { StudentQuizPortal } from './components/StudentQuizPortal/StudentQuizPortal';
import { AdminDashboard } from './components/AdminDashboard/AdminDashboard';
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
          // Earlier lists (custom/edited quizzes) take absolute priority over later lists (defaults)
          if (!map.has(q.id)) {
            map.set(q.id, q);
          }
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
      description: 'Menyelesaikan kuis pertama di EduZone',
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
  const [deletedQuizIds, setDeletedQuizIds] = useState<string[]>(() => {
    const saved = localStorage.getItem('wayground_deleted_quiz_ids');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      } catch (e) {}
    }
    return [];
  });

  const [quizSets, setQuizSets] = useState<QuizSet[]>(() => {
    let deletedSet = new Set<string>();
    const savedDeleted = localStorage.getItem('wayground_deleted_quiz_ids');
    if (savedDeleted) {
      try {
        const parsed = JSON.parse(savedDeleted);
        if (Array.isArray(parsed)) deletedSet = new Set(parsed);
      } catch (e) {}
    }

    const saved = localStorage.getItem('wayground_custom_quizzes');
    let initialList = DEFAULT_QUIZ_SETS;
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          initialList = deduplicateQuizzes(parsed, DEFAULT_QUIZ_SETS);
        }
      } catch (e) {
        initialList = DEFAULT_QUIZ_SETS;
      }
    }
    return initialList.filter((q) => !deletedSet.has(q.id));
  });

  const [activeTab, setActiveTab] = useState<'bank-soal' | 'creator' | 'admin'>('bank-soal');
  const [activeGame, setActiveGame] = useState<{ quiz: QuizSet; mode: GameMode } | null>(null);
  const [studentSharedQuiz, setStudentSharedQuiz] = useState<QuizSet | null>(null);
  const [quizToEditInAdmin, setQuizToEditInAdmin] = useState<QuizSet | null>(null);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(sounds.isEnabled());
  const [timerEnabled, setTimerEnabled] = useState<boolean>(() => {
    const saved = localStorage.getItem('wayground_timer_enabled');
    return saved !== null ? saved === 'true' : true;
  });
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

  useEffect(() => {
    localStorage.setItem('wayground_timer_enabled', String(timerEnabled));
  }, [timerEnabled]);

  const handleToggleTimer = () => {
    setTimerEnabled((prev) => !prev);
    sounds.playClick();
  };

  // Initial Sync from URL params and Server Storage
  useEffect(() => {
    // 1. Check for URL query params: ?shareQuiz=... or ?quizId=... &mode=... &student=...
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

        // Lock student view to ONLY this shared quiz
        setStudentSharedQuiz(decoded);

        if (modeParam) {
          setActiveGame({ quiz: decoded, mode: modeParam });
        }

        sounds.playSuccess();
      }
    } else if (quizIdParam) {
      const existing = quizSets.find((q) => q.id === quizIdParam);
      if (existing) {
        setStudentSharedQuiz(existing);
        if (modeParam) {
          setActiveGame({ quiz: existing, mode: modeParam });
        }
      } else {
        fetchServerQuizzes().then((serverQuizzes) => {
          const found = serverQuizzes.find((q) => q.id === quizIdParam);
          if (found) {
            setStudentSharedQuiz(found);
            if (modeParam) {
              setActiveGame({ quiz: found, mode: modeParam });
            }
          }
        });
      }
    }

    // 2. Fetch quizzes stored on server and merge with localStorage and DEFAULT_QUIZ_SETS
    fetchServerQuizzes().then((serverQuizzes) => {
      let currentDeleted = new Set<string>();
      const savedDeleted = localStorage.getItem('wayground_deleted_quiz_ids');
      if (savedDeleted) {
        try {
          const parsed = JSON.parse(savedDeleted);
          if (Array.isArray(parsed)) currentDeleted = new Set(parsed);
        } catch (e) {}
      }

      if (serverQuizzes && serverQuizzes.length > 0) {
        setQuizSets((prev) => {
          const merged = deduplicateQuizzes(serverQuizzes, prev, DEFAULT_QUIZ_SETS);
          const filtered = merged.filter((q) => !currentDeleted.has(q.id));
          const customOnly = filtered.filter((q) => q.isCustom);
          localStorage.setItem('wayground_custom_quizzes', JSON.stringify(customOnly));
          return filtered;
        });
      }

      // Also ensure any existing local custom quizzes are synced back to server
      const localCustom = localStorage.getItem('wayground_custom_quizzes');
      if (localCustom) {
        try {
          const parsed = JSON.parse(localCustom);
          if (Array.isArray(parsed) && parsed.length > 0) {
            const valid = parsed.filter((q: any) => !currentDeleted.has(q.id));
            syncCustomQuizzesToServer(valid);
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

    // Un-delete if this quiz ID was previously deleted
    const updatedDeleted = deletedQuizIds.filter((dId) => dId !== newQuiz.id);
    setDeletedQuizIds(updatedDeleted);
    localStorage.setItem('wayground_deleted_quiz_ids', JSON.stringify(updatedDeleted));

    const updated = deduplicateQuizzes([newQuiz], quizSets, DEFAULT_QUIZ_SETS).filter(
      (q) => !updatedDeleted.includes(q.id)
    );
    setQuizSets(updated);

    // Save only custom quizzes to localStorage
    const customOnly = updated.filter((q) => q.isCustom);
    localStorage.setItem('wayground_custom_quizzes', JSON.stringify(customOnly));

    // Persist to server backend
    saveQuizToServer(newQuiz);

    if (activeTab === 'creator') {
      setActiveTab('bank-soal');
    }
    sounds.playWin();
  };

  const handleImportQuiz = (quiz: QuizSet) => {
    quiz.isCustom = true;

    // Un-delete if previously marked as deleted
    const updatedDeleted = deletedQuizIds.filter((dId) => dId !== quiz.id);
    setDeletedQuizIds(updatedDeleted);
    localStorage.setItem('wayground_deleted_quiz_ids', JSON.stringify(updatedDeleted));

    const updated = deduplicateQuizzes([quiz], quizSets, DEFAULT_QUIZ_SETS).filter(
      (q) => !updatedDeleted.includes(q.id)
    );
    setQuizSets(updated);

    const customOnly = updated.filter((q) => q.isCustom);
    localStorage.setItem('wayground_custom_quizzes', JSON.stringify(customOnly));
    saveQuizToServer(quiz);
  };

  const handleImportMultiple = (quizzes: QuizSet[]) => {
    const tagged = quizzes.map((q) => ({ ...q, isCustom: true }));
    const importedIds = new Set(quizzes.map((q) => q.id));

    // Un-delete any of the imported quizzes
    const updatedDeleted = deletedQuizIds.filter((dId) => !importedIds.has(dId));
    setDeletedQuizIds(updatedDeleted);
    localStorage.setItem('wayground_deleted_quiz_ids', JSON.stringify(updatedDeleted));

    const updated = deduplicateQuizzes(tagged, quizSets, DEFAULT_QUIZ_SETS).filter(
      (q) => !updatedDeleted.includes(q.id)
    );
    setQuizSets(updated);

    const customOnly = updated.filter((q) => q.isCustom);
    localStorage.setItem('wayground_custom_quizzes', JSON.stringify(customOnly));
    syncCustomQuizzesToServer(customOnly);
  };

  const handleDeleteQuiz = (id: string) => {
    // 1. Mark ID in deletedQuizIds to persist removal permanently
    const nextDeleted = Array.from(new Set([...deletedQuizIds, id]));
    setDeletedQuizIds(nextDeleted);
    localStorage.setItem('wayground_deleted_quiz_ids', JSON.stringify(nextDeleted));

    // 2. Remove immediately from state
    setQuizSets((prev) => prev.filter((q) => q.id !== id));

    // 3. Remove from custom quizzes in localStorage
    const localCustom = localStorage.getItem('wayground_custom_quizzes');
    if (localCustom) {
      try {
        const parsed = JSON.parse(localCustom);
        if (Array.isArray(parsed)) {
          const filtered = parsed.filter((q: any) => q.id !== id);
          localStorage.setItem('wayground_custom_quizzes', JSON.stringify(filtered));
        }
      } catch (e) {}
    }

    // 4. Delete on server backend
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

  // STUDENT VIEW ONLY (when link is shared to a student)
  if (studentSharedQuiz && !activeGame) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
        <StudentQuizPortal
          quiz={studentSharedQuiz}
          onSelectGame={handleSelectGame}
          playerProfile={playerProfile}
          onOpenProfile={() => setIsProfileOpen(true)}
          soundEnabled={soundEnabled}
          onToggleSound={handleToggleSound}
          timerEnabled={timerEnabled}
          onToggleTimer={handleToggleTimer}
          onExitStudentMode={() => {
            setStudentSharedQuiz(null);
            window.history.replaceState({}, document.title, window.location.pathname);
          }}
        />

        {isProfileOpen && (
          <ProfileModal
            profile={playerProfile}
            onClose={() => setIsProfileOpen(false)}
          />
        )}
      </div>
    );
  }

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
        timerEnabled={timerEnabled}
        onToggleTimer={handleToggleTimer}
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
                timerEnabled={timerEnabled}
                onToggleTimer={handleToggleTimer}
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
                timerEnabled={timerEnabled}
                onToggleTimer={handleToggleTimer}
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
                onEditQuiz={(quiz) => {
                  setQuizToEditInAdmin(quiz);
                  setActiveTab('admin');
                }}
                timerEnabled={timerEnabled}
                onToggleTimer={handleToggleTimer}
              />
            )}

            {activeTab === 'creator' && (
              <QuestionCreator
                onSaveQuiz={handleSaveQuiz}
                onCancel={() => setActiveTab('bank-soal')}
              />
            )}

            {activeTab === 'admin' && (
              <AdminDashboard
                quizSets={quizSets}
                initialEditingQuiz={quizToEditInAdmin}
                onClearInitialQuiz={() => setQuizToEditInAdmin(null)}
                onSaveQuiz={handleSaveQuiz}
                onDeleteQuiz={handleDeleteQuiz}
                onCreateNewQuiz={() => setActiveTab('creator')}
                onSelectGame={handleSelectGame}
                onOpenWorksheet={(quiz) => setActiveGame({ quiz, mode: 'cetak-lks' })}
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
