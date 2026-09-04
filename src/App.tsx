import React, { useState, useEffect } from 'react';
import { ArcadeHeader } from './components/ArcadeHeader';
import { ArcadeHome } from './components/ArcadeHome';
import { GameOverModal } from './components/GameOverModal';
import { JackfruitGame } from './games/JackfruitGame';
import { HoleGame } from './games/HoleGame';
import { PeruvellamGame } from './games/PeruvellamGame';
import { GameId, GameResult } from './types';
import { getHighScores, saveHighScore } from './utils/storage';
import { sound } from './utils/audio';

export default function App() {
  const [activeGame, setActiveGame] = useState<GameId | null>(null);
  const [highScores, setHighScores] = useState<Record<string, number>>({});
  const [gameResult, setGameResult] = useState<GameResult | null>(null);
  const [gameSessionId, setGameSessionId] = useState(0);

  // Load high scores on mount
  useEffect(() => {
    setHighScores(getHighScores());
  }, []);

  const handleSelectGame = (gameId: GameId) => {
    sound.playClick();
    setGameResult(null);
    setActiveGame(gameId);
    setGameSessionId(prev => prev + 1);
  };

  const handleGameOver = (result: GameResult) => {
    // Save high score if beaten
    saveHighScore(result.gameId, result.score);
    const updatedScores = getHighScores();
    setHighScores(updatedScores);

    // Attach current stored high score to result
    const best = updatedScores[result.gameId] || result.score;
    setGameResult({
      ...result,
      highScore: best,
    });
  };

  const handlePlayAgain = () => {
    setGameResult(null);
    setGameSessionId(prev => prev + 1);
  };

  const handleBackToArcade = () => {
    setGameResult(null);
    setActiveGame(null);
  };

  return (
    <div className="min-h-screen bg-[#FFF9E6] text-black flex flex-col justify-between selection:bg-[#FFD93D] selection:text-black font-['Fredoka',sans-serif]">
      {/* Arcade Top Navigation */}
      <ArcadeHeader
        highScores={highScores}
        onHomeClick={() => {
          setGameResult(null);
          setActiveGame(null);
        }}
      />

      {/* Main Content Area */}
      <main className="flex-1 w-full flex flex-col items-center justify-center p-2 sm:p-4">
        {!activeGame && (
          <ArcadeHome
            highScores={highScores}
            onSelectGame={handleSelectGame}
          />
        )}

        {activeGame === 'jackfruit' && (
          <JackfruitGame
            key={`jackfruit-${gameSessionId}`}
            onGameOver={handleGameOver}
            onExit={handleBackToArcade}
          />
        )}

        {activeGame === 'hole' && (
          <HoleGame
            key={`hole-${gameSessionId}`}
            onGameOver={handleGameOver}
            onExit={handleBackToArcade}
          />
        )}

        {activeGame === 'peruvellam' && (
          <PeruvellamGame
            key={`peruvellam-${gameSessionId}`}
            onGameOver={handleGameOver}
            onExit={handleBackToArcade}
          />
        )}
      </main>

      {/* Game Result Modal */}
      {gameResult && (
        <GameOverModal
          result={gameResult}
          onPlayAgain={handlePlayAgain}
          onBackToArcade={handleBackToArcade}
        />
      )}

      {/* Vibrant Palette Neo-brutalist Footer */}
      <div className="w-full max-w-5xl mx-auto px-4 pb-6 mt-6">
        <footer className="w-full flex flex-col sm:flex-row justify-between items-center bg-[#2F2F2F] text-white p-4 sm:px-6 rounded-3xl border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] gap-3">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 bg-[#FF6B6B] rounded-full border-2 border-white flex items-center justify-center font-black text-white text-base shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
              P
            </div>
            <div>
              <span className="font-black tracking-tight text-sm">PAZHAYA CHOLLU PUTHIYA KALI</span>
              <span className="text-[11px] text-gray-400 block font-['Noto_Sans_Malayalam']">പഴയ ചൊല്ല് പുതിയ കളി</span>
            </div>
          </div>
          <div className="flex items-center space-x-4 sm:space-x-6 text-xs sm:text-sm font-black uppercase tracking-wider text-gray-200">
            <span className="flex items-center gap-1 text-[#FFD93D]">
              <span>🎮</span> 3 ORIGINAL GAMES
            </span>
            <span className="hidden md:inline text-gray-500">•</span>
            <span className="text-gray-300">100% PLAYABLE</span>
          </div>
        </footer>
      </div>
    </div>
  );
}
