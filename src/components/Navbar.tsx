import React from 'react';
import { PlayerProfile, GameMode } from '../types';
import { Volume2, VolumeX, Sparkles, BookOpen, User, Flame, Gamepad2, PlusCircle, Timer, TimerOff, LayoutDashboard } from 'lucide-react';
import { sounds } from '../utils/audio';
import { EduZoneLogo } from './EduZoneLogo';

interface Props {
  activeTab: 'bank-soal' | 'creator' | 'admin';
  setActiveTab: (tab: 'bank-soal' | 'creator' | 'admin') => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
  timerEnabled?: boolean;
  onToggleTimer?: () => void;
  playerProfile: PlayerProfile;
  onOpenProfile: () => void;
  onHomeClick: () => void;
}

export const Navbar: React.FC<Props> = ({
  activeTab,
  setActiveTab,
  soundEnabled,
  onToggleSound,
  timerEnabled = true,
  onToggleTimer,
  playerProfile,
  onOpenProfile,
  onHomeClick,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-slate-900/90 border-b border-slate-800 backdrop-blur-md px-3 sm:px-6 py-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
        {/* Brand Logo EduZone */}
        <div
          onClick={onHomeClick}
          className="cursor-pointer group select-none transition-transform hover:scale-[1.02]"
        >
          <EduZoneLogo size="md" showText={true} />
        </div>

        {/* Navigation Tabs */}
        <nav className="flex items-center gap-1 bg-slate-800/80 p-1 rounded-2xl border border-slate-700/80">
          <button
            type="button"
            onClick={() => {
              sounds.playClick();
              setActiveTab('bank-soal');
            }}
            className={`px-3.5 py-1.5 rounded-xl text-xs md:text-sm font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'bank-soal'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Bank Soal</span>
          </button>

          <button
            type="button"
            onClick={() => {
              sounds.playClick();
              setActiveTab('creator');
            }}
            className={`px-3.5 py-1.5 rounded-xl text-xs md:text-sm font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'creator'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>Buat Soal / AI</span>
          </button>

          <button
            type="button"
            onClick={() => {
              sounds.playClick();
              setActiveTab('admin');
            }}
            className={`px-3.5 py-1.5 rounded-xl text-xs md:text-sm font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'admin'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            <span>Dashboard Admin</span>
          </button>
        </nav>

        {/* Right Controls: Timer, Sound & Profile */}
        <div className="flex items-center gap-2">
          {/* Timer Toggle */}
          {onToggleTimer && (
            <button
              type="button"
              onClick={onToggleTimer}
              className={`p-2 sm:px-3 sm:py-2 rounded-xl border transition-all cursor-pointer flex items-center gap-1.5 ${
                timerEnabled
                  ? 'bg-slate-800 border-slate-700 text-amber-400 hover:text-amber-300 hover:border-amber-500/40'
                  : 'bg-emerald-950/40 border-emerald-500/40 text-emerald-400 hover:bg-emerald-900/40'
              }`}
              title={
                timerEnabled
                  ? 'Timer Permainan: AKTIF (Klik untuk Matikan Timer / Mode Santai)'
                  : 'Timer Permainan: NONAKTIF / SANTAI (Klik untuk Nyalakan Timer)'
              }
            >
              {timerEnabled ? (
                <>
                  <Timer className="w-4 h-4 shrink-0" />
                  <span className="text-[11px] font-extrabold hidden md:inline">Timer ON</span>
                </>
              ) : (
                <>
                  <TimerOff className="w-4 h-4 shrink-0 text-emerald-400" />
                  <span className="text-[11px] font-extrabold text-emerald-300 hidden md:inline">
                    Santai (Tanpa Timer)
                  </span>
                </>
              )}
            </button>
          )}

          {/* Sound Toggle */}
          <button
            type="button"
            onClick={onToggleSound}
            className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
              soundEnabled
                ? 'bg-slate-800 border-slate-700 text-indigo-400 hover:text-indigo-300'
                : 'bg-slate-800 border-slate-700 text-slate-500 hover:text-slate-400'
            }`}
            title={soundEnabled ? 'Matikan Suara' : 'Nyalakan Suara'}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>

          {/* Profile Button */}
          <button
            type="button"
            onClick={() => {
              sounds.playClick();
              onOpenProfile();
            }}
            className="flex items-center gap-2 p-1.5 pr-3 rounded-2xl bg-slate-800 hover:bg-slate-750 border border-slate-700 transition-all cursor-pointer select-none"
          >
            <div className="w-7 h-7 rounded-xl bg-indigo-600 flex items-center justify-center text-sm shadow">
              {playerProfile.avatar}
            </div>
            <div className="text-left hidden md:block">
              <span className="text-xs font-bold text-white block leading-none">
                {playerProfile.name}
              </span>
              <span className="text-[10px] text-amber-400 font-extrabold">
                Lvl {playerProfile.level} • {playerProfile.coins} 🪙
              </span>
            </div>
          </button>
        </div>
      </div>
    </header>
  );
};
