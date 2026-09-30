import React, { useState } from 'react';
import { QuizSet } from '../../types';
import { getQuizQuestionBreakdown } from '../../utils/quizStats';
import { sounds } from '../../utils/audio';
import {
  Play,
  Volume2,
  VolumeX,
  Timer,
  TimerOff,
  Sparkles,
  Dices,
  ShieldCheck,
  Zap,
  BookOpen,
  Award,
  Users,
  CheckCircle2,
  Flame,
} from 'lucide-react';

interface Props {
  quizSet: QuizSet;
  onStartGame: (settings: {
    nickname: string;
    avatar: string;
    showMemes: boolean;
    timerEnabled: boolean;
  }) => void;
  onBack: () => void;
  timerEnabled: boolean;
  onToggleTimer?: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
}

const AVATAR_OPTIONS = ['🚀', '🦁', '🐼', '🦊', '🤖', '🦄', '🐱', '🦉', '🐯', '⚡', '🌟', '🍕', '🎯', '👾', '🏆'];

const FUN_NAMES = [
  'Bintang Juara',
  'Super Panda',
  'Cosmic Cheetah',
  'Captain Comet',
  'Ninja Cerdas',
  'Ksatria Logika',
  'Doktor Cilik',
  'Pakar Sains',
  'Garuda Emas',
  'Master Kuis',
  'Profesor Hebat',
  'Meteor Cepat',
  'Pemenang Sejati',
  'Si Paling Tahu',
  'Pena Emas',
];

export const WaygroundLobby: React.FC<Props> = ({
  quizSet,
  onStartGame,
  onBack,
  timerEnabled,
  onToggleTimer,
  soundEnabled,
  onToggleSound,
}) => {
  const [nickname, setNickname] = useState(() => {
    const saved = localStorage.getItem('wayground_player_name');
    return saved || 'Bintang Juara';
  });
  const [selectedAvatar, setSelectedAvatar] = useState(() => {
    const saved = localStorage.getItem('wayground_player_avatar');
    return saved || '🚀';
  });
  const [showMemes, setShowMemes] = useState(true);
  const [gamePin] = useState(() => Math.floor(100000 + Math.random() * 900000).toString());

  const breakdown = getQuizQuestionBreakdown(quizSet);

  const handleRandomizeName = () => {
    const randomName = FUN_NAMES[Math.floor(Math.random() * FUN_NAMES.length)];
    const randomAvatar = AVATAR_OPTIONS[Math.floor(Math.random() * AVATAR_OPTIONS.length)];
    setNickname(randomName);
    setSelectedAvatar(randomAvatar);
    sounds.playClick();
  };

  const handleStart = () => {
    const finalName = nickname.trim() || 'Pemain Hebat';
    localStorage.setItem('wayground_player_name', finalName);
    localStorage.setItem('wayground_player_avatar', selectedAvatar);
    sounds.playPowerup();
    onStartGame({
      nickname: finalName,
      avatar: selectedAvatar,
      showMemes,
      timerEnabled,
    });
  };

  return (
    <div className="w-full max-w-3xl mx-auto py-6 px-4 animate-in fade-in duration-200">
      {/* Wayground PIN & Server Header */}
      <div className="flex items-center justify-between p-3.5 px-5 rounded-2xl bg-indigo-950/40 border border-indigo-500/30 text-xs mb-6 shadow-lg">
        <div className="flex items-center gap-2 text-indigo-300 font-extrabold">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
          <span>WAYGROUND LIVE ARENA</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-slate-400">PIN GAME:</span>
          <span className="px-2.5 py-0.5 rounded-lg bg-indigo-600 text-white font-mono font-black text-sm tracking-wider">
            {gamePin.slice(0, 3)} {gamePin.slice(3)}
          </span>
        </div>
      </div>

      {/* Main Lobby Box */}
      <div className="bg-slate-900 border-2 border-indigo-500/40 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-indigo-950/50 space-y-6 relative overflow-hidden">
        {/* Glow decorations */}
        <div className="absolute -top-20 -right-20 w-44 h-44 bg-purple-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -left-20 w-44 h-44 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />

        {/* Title & Metadata */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-gradient-to-r from-amber-500/20 via-pink-500/20 to-indigo-500/20 text-amber-300 border border-amber-500/30">
            <Flame className="w-3.5 h-3.5 text-amber-400 fill-current" />
            <span>Kuis Interaktif Wayground</span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-black text-white leading-tight">
            {quizSet.title}
          </h1>

          <p className="text-xs sm:text-sm text-slate-400 max-w-xl mx-auto line-clamp-2">
            {quizSet.description}
          </p>

          {/* Penjelasan Rincian Jumlah Soal */}
          <div className="inline-flex flex-wrap items-center justify-center gap-2 pt-1 text-xs">
            <span className="px-3 py-1 rounded-xl bg-slate-800 text-slate-200 font-bold border border-slate-700">
              {quizSet.category}
            </span>
            <span className="px-3 py-1 rounded-xl bg-slate-800 text-indigo-300 font-bold border border-slate-700">
              {quizSet.targetClass || `Kelas ${quizSet.grade}`}
            </span>
            <span className="px-3 py-1 rounded-xl bg-indigo-600/30 text-indigo-300 font-extrabold border border-indigo-500/40">
              📋 {breakdown.total} Butir Soal ({breakdown.summaryText})
            </span>
          </div>
        </div>

        {/* Player Profile & Avatar Customizer */}
        <div className="p-5 rounded-2xl bg-slate-800/80 border border-slate-700/80 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>Profil Karakter Kamu</span>
            </span>

            <button
              type="button"
              onClick={handleRandomizeName}
              className="text-xs font-bold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 cursor-pointer transition-colors"
            >
              <Dices className="w-4 h-4" />
              <span>Acak Nama & Avatar</span>
            </button>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-4">
            {/* Selected Big Avatar */}
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-4xl shadow-xl shadow-indigo-950/60 border-2 border-indigo-400/50 shrink-0 animate-bounce duration-1000">
              {selectedAvatar}
            </div>

            {/* Nickname input */}
            <div className="flex-1 w-full space-y-1.5">
              <label className="block text-xs font-bold text-slate-400">
                Nama Panggilan di Papan Peringkat:
              </label>
              <input
                type="text"
                maxLength={24}
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder="Masukkan namamu..."
                className="w-full px-4 py-3 bg-slate-900 border-2 border-indigo-500/50 rounded-2xl text-base font-black text-white focus:outline-none focus:border-indigo-400 shadow-inner"
              />
            </div>
          </div>

          {/* Quick Avatar Grid */}
          <div className="space-y-1.5 pt-1">
            <span className="text-[11px] font-bold text-slate-400 block">Pilih Avatar Favorit:</span>
            <div className="flex flex-wrap items-center gap-2">
              {AVATAR_OPTIONS.map((av) => (
                <button
                  key={av}
                  type="button"
                  onClick={() => {
                    setSelectedAvatar(av);
                    sounds.playClick();
                  }}
                  className={`w-10 h-10 rounded-xl text-xl flex items-center justify-center transition-all cursor-pointer ${
                    selectedAvatar === av
                      ? 'bg-indigo-600 scale-110 shadow-lg shadow-indigo-950/60 ring-2 ring-indigo-400'
                      : 'bg-slate-900 hover:bg-slate-700/80 border border-slate-700'
                  }`}
                >
                  {av}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Game Mode Settings Options */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          {/* Timer Toggle */}
          {onToggleTimer && (
            <button
              type="button"
              onClick={() => {
                onToggleTimer();
                sounds.playClick();
              }}
              className={`p-3.5 rounded-2xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                timerEnabled
                  ? 'bg-slate-800/90 border-amber-500/40 text-amber-300'
                  : 'bg-slate-800/90 border-emerald-500/40 text-emerald-300'
              }`}
            >
              <div className="flex items-center gap-2.5">
                {timerEnabled ? <Timer className="w-5 h-5" /> : <TimerOff className="w-5 h-5" />}
                <div>
                  <div className="font-extrabold text-white">Batas Waktu (Timer)</div>
                  <div className="text-[11px] text-slate-400">
                    {timerEnabled ? '25 Detik / Soal' : 'Santai (Tanpa Batas Detik)'}
                  </div>
                </div>
              </div>
              <span className="font-black">{timerEnabled ? 'ON' : 'OFF'}</span>
            </button>
          )}

          {/* Sound Toggle */}
          <button
            type="button"
            onClick={() => {
              onToggleSound();
              sounds.playClick();
            }}
            className={`p-3.5 rounded-2xl border text-left flex items-center justify-between transition-all cursor-pointer ${
              soundEnabled
                ? 'bg-slate-800/90 border-indigo-500/40 text-indigo-300'
                : 'bg-slate-800/90 border-slate-700 text-slate-400'
            }`}
          >
            <div className="flex items-center gap-2.5">
              {soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
              <div>
                <div className="font-extrabold text-white">Efek Suara & Musik</div>
                <div className="text-[11px] text-slate-400">
                  {soundEnabled ? 'Suara Kuis Aktif' : 'Senyap (Mute)'}
                </div>
              </div>
            </div>
            <span className="font-black">{soundEnabled ? 'ON' : 'OFF'}</span>
          </button>

          {/* Meme Feedback Toggle */}
          <button
            type="button"
            onClick={() => {
              setShowMemes((prev) => !prev);
              sounds.playClick();
            }}
            className={`p-3.5 rounded-2xl border text-left flex items-center justify-between transition-all cursor-pointer ${
              showMemes
                ? 'bg-slate-800/90 border-pink-500/40 text-pink-300'
                : 'bg-slate-800/90 border-slate-700 text-slate-400'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <Sparkles className="w-5 h-5 text-pink-400" />
              <div>
                <div className="font-extrabold text-white">Meme & Reaksi Wayground</div>
                <div className="text-[11px] text-slate-400">
                  {showMemes ? 'Tampilkan Reaksi Seru Tiap Jawaban' : 'Langsung Soal Berikutnya'}
                </div>
              </div>
            </div>
            <span className="font-black">{showMemes ? 'ON' : 'OFF'}</span>
          </button>

          {/* Powerups Info */}
          <div className="p-3.5 rounded-2xl bg-slate-800/90 border border-slate-700 text-slate-300 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Zap className="w-5 h-5 text-amber-400" />
              <div>
                <div className="font-extrabold text-white">Powerup Diaktifkan</div>
                <div className="text-[11px] text-slate-400">50:50, Bekukan, Petunjuk, Buka Kunci</div>
              </div>
            </div>
            <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 font-extrabold text-[10px]">
              AKTIF
            </span>
          </div>
        </div>

        {/* Big 3D START Button */}
        <div className="pt-2 space-y-3">
          <button
            type="button"
            onClick={handleStart}
            className="w-full btn-3d py-4 sm:py-5 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-500 hover:from-emerald-400 hover:to-teal-400 text-white font-black text-lg sm:text-xl flex items-center justify-center gap-3 shadow-2xl shadow-emerald-950/60 cursor-pointer active:scale-95 border-2 border-emerald-300/40 tracking-wider"
          >
            <Play className="w-7 h-7 fill-current" />
            <span>MULAI GAME (START)</span>
          </button>

          <button
            type="button"
            onClick={onBack}
            className="w-full py-2.5 text-xs font-bold text-slate-400 hover:text-white transition-colors cursor-pointer text-center"
          >
            ← Kembali ke Menu
          </button>
        </div>
      </div>
    </div>
  );
};
