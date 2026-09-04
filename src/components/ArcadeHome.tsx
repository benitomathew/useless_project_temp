import React from 'react';
import { GAMES_DATA } from '../data/gamesData';
import { GameId, GameInfo } from '../types';
import { sound } from '../utils/audio';
import { Play, Trophy } from 'lucide-react';

interface ArcadeHomeProps {
  highScores: Record<string, number>;
  onSelectGame: (gameId: GameId) => void;
}

const GAME_BUTTON_STYLES: Record<string, { bg: string; text: string; hover: string }> = {
  'jackfruit': { bg: 'bg-[#4ECDC4]', text: 'text-white', hover: 'hover:bg-[#3ec4ba]' },
  'hole': { bg: 'bg-[#FFD93D]', text: 'text-black', hover: 'hover:bg-[#ebc428]' },
  'peruvellam': { bg: 'bg-[#0284C7]', text: 'text-white', hover: 'hover:bg-[#0369A1]' },
};

export const ArcadeHome: React.FC<ArcadeHomeProps> = ({ highScores, onSelectGame }) => {
  return (
    <div className="w-full max-w-5xl mx-auto px-4 pb-12 flex flex-col items-center">
      {/* Vibrant Palette Hero Header */}
      <header className="flex flex-col items-center my-6 md:my-8 text-center">
        <div className="bg-[#FF6B6B] border-4 border-black px-6 sm:px-12 py-3 sm:py-5 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] -rotate-1 flex flex-col items-center">
          <h1 className="text-3xl sm:text-5xl md:text-6xl font-black text-white tracking-tight uppercase leading-none">
            Pazhaya Chollu
          </h1>
          <div className="w-full flex justify-end mt-1 sm:mt-2 pr-1 sm:pr-4">
            <span className="text-2xl sm:text-4xl md:text-5xl font-black text-[#FFD93D] tracking-tight uppercase leading-none drop-shadow-[3px_3px_0px_rgba(0,0,0,1)]">
              Puthiya Kali
            </span>
          </div>
        </div>

        <p className="text-sm sm:text-base font-bold text-[#4D4D4D] mt-4 uppercase tracking-wider bg-white/80 px-4 sm:px-6 py-1.5 rounded-full border border-black/10 flex flex-wrap items-center justify-center gap-2">
          <span className="font-['Noto_Sans_Malayalam'] font-black text-black">പഴയ ചൊല്ല് പുതിയ കളി</span>
          <span className="text-gray-400 hidden sm:inline">•</span>
          <span>Malayalam Proverbs, Ridiculous Games</span>
        </p>

        <p className="text-xs sm:text-sm font-semibold text-[#4D4D4D] max-w-lg mt-2">
        
        </p>
      </header>

      {/* Game Cards Grid + Coming Soon Card */}
      <div className="w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 content-center">
        {GAMES_DATA.map((game: GameInfo) => {
          const gameScore = highScores[game.id] || 0;
          const btnStyle = GAME_BUTTON_STYLES[game.id] || {
            bg: 'bg-[#4ECDC4]',
            text: 'text-white',
            hover: 'hover:bg-[#3ec4ba]',
          };

          return (
            <div
              key={game.id}
              className="bg-white border-4 border-black rounded-[40px] p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex flex-col items-center text-center justify-between transition-transform hover:-translate-y-2"
            >
              {/* Card Top: Emoji & Badge */}
              <div className="w-full flex flex-col items-center">
                <div className="text-6xl mb-4 transform hover:scale-110 transition-transform">
                  {game.emoji}
                </div>

                {/* Proverb Title */}
                <h2 className="text-xl sm:text-2xl font-black mb-1 text-black leading-tight font-['Noto_Sans_Malayalam']">
                  {game.titleMalayalam}
                </h2>

                {/* Proverb Transliteration */}
                <p className="text-xs sm:text-sm font-bold text-[#FF8B13] tracking-wide mb-3">
                  {game.titleEnglish}
                </p>

                <p className="text-xs font-semibold text-gray-500 mb-6">
                  {game.description}
                </p>
              </div>

              {/* Card Bottom: High Score & Play Button */}
              <div className="w-full flex flex-col gap-3 pt-2 border-t border-black/10">
                <div className="flex items-center justify-center gap-1.5 text-xs font-extrabold text-stone-700">
                  <Trophy className="w-3.5 h-3.5 text-amber-600" />
                  <span>High Score: {gameScore}</span>
                </div>

                <button
                  id={`play-btn-${game.id}`}
                  onClick={() => {
                    sound.playClick();
                    onSelectGame(game.id);
                  }}
                  className={`w-full ${btnStyle.bg} ${btnStyle.hover} border-2 border-black py-3 rounded-2xl font-black ${btnStyle.text} shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] uppercase active:translate-y-0.5 cursor-pointer transition-all flex items-center justify-center gap-2`}
                >
                  <Play className={`w-4 h-4 ${btnStyle.text === 'text-black' ? 'fill-black' : 'fill-white'}`} />
                  <span>PLAY</span>
                </button>
              </div>
            </div>
          );
        })}

        {/* 6th Card: Coming Soon / Culture */}
        <div className="border-4 border-dashed border-black/20 rounded-[40px] p-6 flex flex-col items-center justify-center text-center min-h-[320px]">
          <div className="text-3xl md:text-4xl font-black text-black/20 uppercase rotate-12">
            Coming Soon...
          </div>
          <p className="text-xs font-bold text-black/30 mt-2">
            MORE STUPID PROVERBS
          </p>
          <p className="text-xs text-black/40 mt-4 max-w-[220px]">
            Timeless folklore meets arcade madness. More hilarious games cooking soon!
          </p>
        </div>
      </div>
    </div>
  );
};
