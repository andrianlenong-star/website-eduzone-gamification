import React from 'react';
import { PlayerProfile, GameMode } from '../types';
import { Volume2, VolumeX, Sparkles, BookOpen, User, Flame, Gamepad2, PlusCircle } from 'lucide-react';
import { sounds } from '../utils/audio';
import { EduZoneLogo } from './EduZoneLogo';

interface Props {
  activeTab: 'bank-soal' | 'creator';
  setActiveTab: (tab: 'bank-soal' | 'creator') => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
  playerProfile: PlayerProfile;
  onOpenProfile: () => void;
  onHomeClick: () => void;
}

export const Navbar: React.FC<Props> = ({
  activeTab,
  setActiveTab,
  soundEnabled,
  onToggleSound,
  playerProfile,
  onOpenProfile,
  onHomeClick,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-slate-900/90 border-b border-slate-800 backdrop-blur-md px-3 sm:px-6 py-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
        {/* Brand Logo Edu Zone */}
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
        </nav>

        {/* Right Controls: Sound & Profile */}
        <div className="flex items-center gap-2">
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
