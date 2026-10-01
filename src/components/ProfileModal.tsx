import React from 'react';
import { PlayerProfile } from '../types';
import { X, Award, Flame, Trophy, Coins, Star, CheckCircle } from 'lucide-react';
import { sounds } from '../utils/audio';

interface Props {
  profile: PlayerProfile;
  onClose: () => void;
}

export const ProfileModal: React.FC<Props> = ({ profile, onClose }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-slate-900 border-2 border-indigo-500/50 rounded-3xl p-6 md:p-8 max-w-lg w-full space-y-6 shadow-2xl relative">
        <button
          type="button"
          onClick={() => {
            sounds.playClick();
            onClose();
          }}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Profile Card Header */}
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 md:w-20 md:h-20 rounded-3xl bg-gradient-to-tr from-indigo-600 to-sky-500 flex items-center justify-center text-3xl shadow-xl shadow-indigo-900/40">
            {profile.avatar}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xl md:text-2xl font-black text-white">{profile.name}</h3>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-indigo-500 text-white">
                LVL {profile.level}
              </span>
            </div>
            <p className="text-xs text-indigo-300 font-semibold mt-0.5">
              Cendekiawan Muda EduZone
            </p>
            <div className="flex items-center gap-3 mt-2 text-xs font-bold">
              <span className="text-amber-400 flex items-center gap-1">
                <Coins className="w-3.5 h-3.5" />
                {profile.coins} Koin
              </span>
              <span className="text-indigo-300 flex items-center gap-1">
                <Star className="w-3.5 h-3.5" />
                {profile.xp} XP
              </span>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-3">
          <div className="p-3.5 rounded-2xl bg-slate-800/80 border border-slate-700/80 text-center">
            <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">
              Permainan
            </span>
            <span className="text-xl font-black text-white">{profile.stats.gamesPlayed}</span>
          </div>
          <div className="p-3.5 rounded-2xl bg-slate-800/80 border border-slate-700/80 text-center">
            <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">
              Jawaban Benar
            </span>
            <span className="text-xl font-black text-emerald-400">{profile.stats.correctAnswers}</span>
          </div>
          <div className="p-3.5 rounded-2xl bg-slate-800/80 border border-slate-700/80 text-center">
            <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">
              Streak Top
            </span>
            <span className="text-xl font-black text-rose-400">{profile.stats.streakHigh}x 🔥</span>
          </div>
        </div>

        {/* Badges Section */}
        <div className="space-y-3">
          <h4 className="text-sm font-bold text-slate-300 flex items-center gap-1.5">
            <Award className="w-4 h-4 text-amber-400" />
            <span>Lencana Prestasi</span>
          </h4>

          <div className="grid grid-cols-2 gap-2.5">
            {profile.badges.map((badge) => (
              <div
                key={badge.id}
                className="p-3 rounded-xl bg-slate-800 border border-slate-700 flex items-center gap-3"
              >
                <span className="text-2xl">{badge.icon}</span>
                <div>
                  <h5 className="text-xs font-bold text-white">{badge.name}</h5>
                  <p className="text-[10px] text-slate-400 leading-tight">{badge.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="pt-2 text-center">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
