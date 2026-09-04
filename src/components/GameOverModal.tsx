import React from 'react';
import { GameResult } from '../types';
import { sound } from '../utils/audio';
import { RotateCcw, Home, Trophy, Sparkles } from 'lucide-react';

interface GameOverModalProps {
  result: GameResult;
  onPlayAgain: () => void;
  onBackToArcade: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  result,
  onPlayAgain,
  onBackToArcade
}) => {
  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="relative w-full max-w-lg bg-white border-4 border-black rounded-[40px] p-6 md:p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex flex-col items-center text-center animate-in zoom-in-95 duration-200">
        {/* Top Status Header */}
        <div className="mb-2">
          <span className="text-5xl md:text-6xl block mb-2">
            {result.won ? '🏆🎉' : '🤦‍♂️💥'}
          </span>
          <h2
            id="game-result-title"
            className={`text-3xl md:text-4xl font-black uppercase tracking-wider ${
              result.won ? 'text-[#FF6B6B]' : 'text-[#2F2F2F]'
            }`}
          >
            {result.won ? 'YOU WON!' : 'GAME OVER!'}
          </h2>
          <span className="text-sm font-bold text-[#4D4D4D]">
            {result.won ? 'VICTORY ACHIEVED!' : 'THE PROVERB PROVED TRUE!'}
          </span>
        </div>

        {/* Score Box */}
        <div className="w-full bg-[#FFF9E6] border-3 border-black rounded-2xl p-4 my-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex items-center justify-around">
          <div className="flex flex-col items-center">
            <span className="text-xs uppercase font-extrabold text-[#4D4D4D] tracking-wider">
              FINAL SCORE
            </span>
            <span className="text-3xl md:text-4xl font-black text-black">
              {result.score}
            </span>
          </div>

          <div className="w-0.5 h-10 bg-black/20" />

          <div className="flex flex-col items-center">
            <span className="text-xs uppercase font-extrabold text-[#4D4D4D] tracking-wider flex items-center gap-1">
              <Trophy className="w-3.5 h-3.5 text-[#FF8B13]" />
              HIGH SCORE
            </span>
            <span className="text-2xl md:text-3xl font-black text-[#FF8B13]">
              {result.highScore}
            </span>
          </div>
        </div>

        {/* Reaction Box */}
        <div className="w-full bg-[#FFF9E6] border-3 border-black rounded-2xl p-4 mb-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] text-center">
          <p className="text-lg md:text-xl font-black text-black leading-snug font-['Noto_Sans_Malayalam']">
            "{result.reactionMalayalam || result.reactionEnglish}"
          </p>
          {result.reactionMalayalam && result.reactionEnglish && (
            <p className="text-xs text-[#4D4D4D] font-semibold mt-1.5">
              {result.reactionEnglish}
            </p>
          )}
        </div>

        {/* Extra stats if available */}
        {result.stats && (
          <div className="w-full flex flex-wrap gap-2 justify-center mb-6">
            {Object.entries(result.stats).map(([k, v]) => (
              <span
                key={k}
                className="bg-white border-2 border-black text-xs font-bold px-3 py-1 rounded-full text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
              >
                {k}: {v}
              </span>
            ))}
          </div>
        )}

        {/* Action Buttons */}
        <div className="w-full flex flex-col sm:flex-row gap-3">
          <button
            id="play-again-btn"
            onClick={() => {
              sound.playClick();
              onPlayAgain();
            }}
            className="flex-1 py-3.5 px-5 bg-[#4ECDC4] hover:bg-[#3ec4ba] active:translate-y-0.5 border-3 border-black rounded-2xl font-black text-lg text-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center gap-2 cursor-pointer transition-all"
          >
            <RotateCcw className="w-5 h-5" />
            <span>PLAY AGAIN</span>
          </button>

          <button
            id="back-to-arcade-btn"
            onClick={() => {
              sound.playClick();
              onBackToArcade();
            }}
            className="flex-1 py-3.5 px-5 bg-[#FFD93D] hover:bg-[#ebc428] active:translate-y-0.5 border-3 border-black rounded-2xl font-black text-lg text-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center gap-2 cursor-pointer transition-all"
          >
            <Home className="w-5 h-5" />
            <span>BACK TO ARCADE</span>
          </button>
        </div>
      </div>
    </div>
  );
};
