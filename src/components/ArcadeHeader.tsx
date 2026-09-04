import React, { useState } from 'react';
import { sound } from '../utils/audio';
import { Volume2, VolumeX, Sparkles, Trophy } from 'lucide-react';

interface ArcadeHeaderProps {
  highScores: Record<string, number>;
  onHomeClick: () => void;
}

export const ArcadeHeader: React.FC<ArcadeHeaderProps> = ({ highScores, onHomeClick }) => {
  const [isMuted, setIsMuted] = useState(sound.isMuted());

  const handleToggleSound = () => {
    const next = sound.toggleMute();
    setIsMuted(next);
  };

  const totalScore = Object.values(highScores).reduce<number>((a, b) => a + (typeof b === 'number' ? b : 0), 0);

  return (
    <header className="w-full max-w-5xl mx-auto py-4 px-4 flex items-center justify-between">
      {/* Brand logo / home link */}
      <button
        id="arcade-logo-btn"
        onClick={() => {
          sound.playClick();
          onHomeClick();
        }}
        className="flex items-center gap-2.5 group text-left cursor-pointer"
      >
        <div className="w-11 h-11 bg-[#FF6B6B] border-3 border-black rounded-2xl flex items-center justify-center text-2xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] group-hover:rotate-6 transition-transform">
          🕹️
        </div>
        <div>
          <h1 className="text-sm sm:text-base md:text-lg font-black tracking-tight text-black uppercase leading-tight">
            Pazhaya Chollu
          </h1>
          <p className="text-xs sm:text-sm font-black text-[#FF6B6B] tracking-wide ml-2 leading-none uppercase">
            Puthiya Kali
          </p>
        </div>
      </button>

      {/* Right controls */}
      <div className="flex items-center gap-3">
        {/* Total Arcade Trophy Score */}
        <div className="hidden sm:flex items-center gap-1.5 bg-[#FFD93D] border-3 border-black px-3.5 py-1.5 rounded-2xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] text-black">
          <Trophy className="w-4 h-4 text-black" />
          <span className="text-xs uppercase font-extrabold text-black">TOTAL:</span>
          <span className="text-sm font-black text-black">{totalScore} pts</span>
        </div>

        {/* Sound Toggle */}
        <button
          id="global-sound-toggle-btn"
          onClick={handleToggleSound}
          aria-label="Toggle Sound Effects"
          className="p-2.5 bg-white hover:bg-gray-100 active:translate-y-0.5 border-3 border-black rounded-2xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] cursor-pointer transition-all"
        >
          {isMuted ? (
            <VolumeX className="w-5 h-5 text-[#FF6B6B]" />
          ) : (
            <Volume2 className="w-5 h-5 text-[#4ECDC4]" />
          )}
        </button>
      </div>
    </header>
  );
};
