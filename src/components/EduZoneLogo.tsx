import React from 'react';

interface Props {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
}

export const EduZoneLogo: React.FC<Props> = ({ size = 'md', showText = true }) => {
  const iconDimensions = {
    sm: 'w-8 h-8',
    md: 'w-11 h-11',
    lg: 'w-16 h-16',
  }[size];

  const titleSizes = {
    sm: 'text-lg',
    md: 'text-2xl',
    lg: 'text-4xl',
  }[size];

  const subSizes = {
    sm: 'text-[9px]',
    md: 'text-[11px]',
    lg: 'text-xs',
  }[size];

  return (
    <div className="flex items-center gap-3 select-none">
      {/* Colorful Educational Emblem */}
      <div className={`relative ${iconDimensions} shrink-0 group`}>
        {/* Ambient glow */}
        <div className="absolute -inset-1 bg-gradient-to-r from-amber-500 via-rose-500 to-indigo-500 rounded-2xl blur-sm opacity-70 group-hover:opacity-100 transition-opacity duration-300 animate-pulse" />

        <svg
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="relative w-full h-full drop-shadow-xl"
        >
          {/* Defs for gradients & filters */}
          <defs>
            <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#4f46e5" />
              <stop offset="50%" stopColor="#7c3aed" />
              <stop offset="100%" stopColor="#06b6d4" />
            </linearGradient>

            <linearGradient id="bookLeft" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#38bdf8" />
              <stop offset="100%" stopColor="#0284c7" />
            </linearGradient>

            <linearGradient id="bookRight" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#a855f7" />
              <stop offset="100%" stopColor="#7e22ce" />
            </linearGradient>

            <linearGradient id="capGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#fbbf24" />
              <stop offset="60%" stopColor="#f59e0b" />
              <stop offset="100%" stopColor="#d97706" />
            </linearGradient>

            <linearGradient id="tasselGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#f43f5e" />
              <stop offset="100%" stopColor="#e11d48" />
            </linearGradient>

            <linearGradient id="glowRays" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#34d399" />
              <stop offset="100%" stopColor="#059669" />
            </linearGradient>
          </defs>

          {/* Background Rounded Shield */}
          <rect width="100" height="100" rx="26" fill="url(#bgGrad)" />

          {/* Inner border line */}
          <rect
            x="3"
            y="3"
            width="94"
            height="94"
            rx="23"
            stroke="#ffffff"
            strokeOpacity="0.25"
            strokeWidth="2"
          />

          {/* Sunburst Knowledge rays */}
          <circle cx="50" cy="46" r="32" stroke="#ffffff" strokeOpacity="0.15" strokeDasharray="3 4" strokeWidth="2" />

          {/* Open Book: Left Page */}
          <path
            d="M 50 68 C 38 64 26 66 18 70 L 18 45 C 26 41 38 39 50 43 Z"
            fill="url(#bookLeft)"
            stroke="#ffffff"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
          {/* Left page line details */}
          <path d="M 23 49 C 32 46 40 45 46 48" stroke="#ffffff" strokeOpacity="0.6" strokeWidth="1.5" strokeLinecap="round" />
          <path d="M 23 55 C 32 52 40 51 46 54" stroke="#ffffff" strokeOpacity="0.6" strokeWidth="1.5" strokeLinecap="round" />
          <path d="M 23 61 C 32 58 40 57 46 60" stroke="#ffffff" strokeOpacity="0.6" strokeWidth="1.5" strokeLinecap="round" />

          {/* Open Book: Right Page */}
          <path
            d="M 50 68 C 62 64 74 66 82 70 L 82 45 C 74 41 62 39 50 43 Z"
            fill="url(#bookRight)"
            stroke="#ffffff"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
          {/* Right page line details */}
          <path d="M 54 48 C 60 45 68 46 77 49" stroke="#ffffff" strokeOpacity="0.6" strokeWidth="1.5" strokeLinecap="round" />
          <path d="M 54 54 C 60 51 68 52 77 55" stroke="#ffffff" strokeOpacity="0.6" strokeWidth="1.5" strokeLinecap="round" />
          <path d="M 54 60 C 60 57 68 58 77 61" stroke="#ffffff" strokeOpacity="0.6" strokeWidth="1.5" strokeLinecap="round" />

          {/* Book Spine */}
          <path d="M 50 43 L 50 72" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" />

          {/* Graduation Cap (Mortarboard) Floating on Top */}
          {/* Cap diamond */}
          <polygon
            points="50,16 78,28 50,38 22,28"
            fill="url(#capGrad)"
            stroke="#ffffff"
            strokeWidth="2"
            strokeLinejoin="round"
          />

          {/* Cap skull cap under */}
          <path
            d="M 34 32 C 34 40 66 40 66 32"
            fill="#d97706"
            stroke="#ffffff"
            strokeWidth="1.5"
          />

          {/* Golden Cap Button */}
          <circle cx="50" cy="27" r="3" fill="#ffffff" />

          {/* Cap Tassel Ribbon */}
          <path
            d="M 50 27 Q 66 28 68 37 Q 70 44 67 48"
            fill="none"
            stroke="url(#tasselGrad)"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          <circle cx="67" cy="49" r="2.5" fill="#f43f5e" />

          {/* Sparkle of Wisdom (Top Left Star) */}
          <path
            d="M 20 22 Q 22 25 25 25 Q 22 25 20 28 Q 18 25 15 25 Q 18 25 20 22 Z"
            fill="#fde047"
          />

          {/* Sparkle of Wisdom (Top Right Star) */}
          <path
            d="M 80 18 Q 81.5 20 83.5 20 Q 81.5 20 80 22 Q 78.5 20 76.5 20 Q 78.5 20 80 18 Z"
            fill="#fde047"
          />
        </svg>
      </div>

      {/* Brand Typography */}
      {showText && (
        <div className="flex flex-col">
          <div className="flex items-center leading-none">
            <span className={`font-fun font-black tracking-tight ${titleSizes}`}>
              <span className="text-white">Edu</span>
              <span className="bg-gradient-to-r from-amber-400 via-rose-400 to-cyan-300 bg-clip-text text-transparent drop-shadow-sm">Zone</span>
            </span>
            <span className="hidden sm:inline-block text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-gradient-to-r from-emerald-500/20 to-teal-500/20 text-emerald-300 border border-emerald-500/30 ml-2">
              Interactive
            </span>
          </div>
          <span className={`text-slate-400 font-bold tracking-wide mt-0.5 ${subSizes}`}>
            Game Edukasi & Bank Soal
          </span>
        </div>
      )}
    </div>
  );
};
