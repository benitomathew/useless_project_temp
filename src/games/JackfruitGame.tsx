import React, { useEffect, useRef, useState, useCallback } from 'react';
import { sound } from '../utils/audio';
import { GameResult } from '../types';
import { GAMES_DATA } from '../data/gamesData';
import { RotateCcw, Volume2, VolumeX, ArrowLeft, Zap, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';

interface JackfruitGameProps {
  onGameOver: (result: GameResult) => void;
  onExit: () => void;
}

interface Rabbit {
  id: number;
  x: number;
  y: number;
  vx: number;
  width: number;
  height: number;
  type: 'speedy' | 'normal' | 'chonky' | 'golden';
  points: number;
  color: string;
  isDazed: boolean;
  dazeTimer: number;
  direction: 1 | -1;
  hopPhase: number;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  life: number;
  maxLife: number;
  shape: 'circle' | 'star' | 'leaf' | 'seed';
}

interface FloatingText {
  id: number;
  text: string;
  x: number;
  y: number;
  color: string;
  opacity: number;
  vy: number;
}

export const JackfruitGame: React.FC<JackfruitGameProps> = ({ onGameOver, onExit }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [timeLeft, setTimeLeft] = useState(40);
  const [misses, setMisses] = useState(0);
  const maxMisses = 4;
  const [isMuted, setIsMuted] = useState(sound.isMuted());
  const [shake, setShake] = useState(false);
  const [isStrongShake, setIsStrongShake] = useState(false);
  const shakeIntensityRef = useRef(0);
  const shakeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const resetTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Jackfruit State
  const fruitRef = useRef({
    x: 0,
    y: 90,
    vy: 0,
    isFalling: false,
    isSplatted: false,
    stemY: 50,
    width: 58,
    height: 74,
    sway: 0,
    swaySpeed: 0.04,
  });

  const rabbitsRef = useRef<Rabbit[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const floatingTextsRef = useRef<FloatingText[]>([]);
  const nextRabbitTimeRef = useRef(0);
  const animationFrameId = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(performance.now());
  const rabbitIdCounter = useRef(1);
  const textIdCounter = useRef(1);
  const scoreRef = useRef(0);
  scoreRef.current = score;
  const gameEndedRef = useRef(false);

  const gameInfo = GAMES_DATA.find(g => g.id === 'jackfruit')!;

  // Trigger screen shake (focused arcade rumble)
  const triggerShake = useCallback((strong: boolean = false) => {
    shakeIntensityRef.current = strong ? 12 : 7;
    setIsStrongShake(strong);
    setShake(true);
    if (shakeTimeoutRef.current) {
      clearTimeout(shakeTimeoutRef.current);
    }
    shakeTimeoutRef.current = setTimeout(() => {
      setShake(false);
      setIsStrongShake(false);
    }, strong ? 320 : 280);
  }, []);

  // Spawn a new rabbit
  const spawnRabbit = useCallback((canvasWidth: number, groundY: number) => {
    const types: ('speedy' | 'normal' | 'chonky' | 'golden')[] = ['normal', 'speedy', 'chonky', 'golden'];
    const weights = [0.45, 0.35, 0.15, 0.05];
    const rand = Math.random();
    let cumulative = 0;
    let chosenType: 'speedy' | 'normal' | 'chonky' | 'golden' = 'normal';
    for (let i = 0; i < weights.length; i++) {
      cumulative += weights[i];
      if (rand < cumulative) {
        chosenType = types[i];
        break;
      }
    }

    const direction: 1 | -1 = Math.random() > 0.5 ? 1 : -1;
    let baseSpeed = 2.5 + Math.random() * 2.2;
    let width = 50;
    let height = 36;
    let points = 100;
    let color = '#F3F4F6';

    if (chosenType === 'speedy') {
      baseSpeed *= 1.75;
      width = 42;
      height = 30;
      points = 150;
      color = '#E0F2FE';
    } else if (chosenType === 'chonky') {
      baseSpeed *= 0.65;
      width = 65;
      height = 46;
      points = 70;
      color = '#E5E7EB';
    } else if (chosenType === 'golden') {
      baseSpeed *= 1.4;
      width = 48;
      height = 34;
      points = 300;
      color = '#FDE047';
    }

    const vx = direction === 1 ? baseSpeed : -baseSpeed;
    const x = direction === 1 ? -width - 20 : canvasWidth + width + 20;

    rabbitsRef.current.push({
      id: rabbitIdCounter.current++,
      x,
      y: groundY - height + 4,
      vx,
      width,
      height,
      type: chosenType,
      points,
      color,
      isDazed: false,
      dazeTimer: 0,
      direction,
      hopPhase: Math.random() * Math.PI * 2,
    });
  }, []);

  // Reset Jackfruit to top
  const resetJackfruit = useCallback((canvasWidth: number) => {
    fruitRef.current.isFalling = false;
    fruitRef.current.isSplatted = false;
    fruitRef.current.y = 90;
    fruitRef.current.x = canvasWidth / 2;
    fruitRef.current.vy = 0;
  }, []);

  // Drop Jackfruit
  const dropJackfruit = useCallback(() => {
    const f = fruitRef.current;
    if (f.isFalling) return;

    // If still in brief splat/recovery window, immediately cancel wait, reset, and drop!
    if (f.isSplatted) {
      if (resetTimeoutRef.current) {
        clearTimeout(resetTimeoutRef.current);
        resetTimeoutRef.current = null;
      }
      const canvas = canvasRef.current;
      resetJackfruit(canvas ? canvas.width : 600);
    }

    f.isFalling = true;
    f.vy = 3.8;
    sound.playPop();
  }, [resetJackfruit]);

  // Spawn splat particles
  const createSplatParticles = (x: number, y: number, isHit: boolean, isMultiKill: boolean = false) => {
    const colors = isHit
      ? ['#FACC15', '#EAB308', '#F59E0B', '#FDE047', '#FEF08A', '#FFEDD5', '#EF4444']
      : ['#84CC16', '#65A30D', '#A3E635', '#D97706', '#92400E'];

    const count = isMultiKill ? 48 : 28;
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 2 + Math.random() * (isMultiKill ? 8.5 : 6);
      particlesRef.current.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - (isHit ? (isMultiKill ? 4.5 : 2.5) : 1),
        color: colors[Math.floor(Math.random() * colors.length)],
        size: 4 + Math.random() * (isMultiKill ? 8.5 : 7),
        life: 0,
        maxLife: 30 + Math.random() * 20,
        shape: isHit ? (Math.random() > 0.4 ? 'star' : 'seed') : 'circle',
      });
    }
  };

  // Add floating text feedback
  const addFloatingText = (text: string, x: number, y: number, color: string = '#15803D') => {
    floatingTextsRef.current.push({
      id: textIdCounter.current++,
      text,
      x,
      y,
      color,
      opacity: 1,
      vy: -1.8,
    });
  };

  // Handle Finish
  const finishGame = useCallback((finalScore: number) => {
    if (gameEndedRef.current) return;
    gameEndedRef.current = true;

    const isWin = finalScore >= 400;
    if (isWin) {
      sound.playVictory();
      confetti({
        particleCount: 70,
        spread: 70,
        origin: { y: 0.6 }
      });
    } else {
      sound.playSadWahWah();
    }

    const reactionPool = isWin ? gameInfo.funnyQuotes.win : gameInfo.funnyQuotes.lose;
    const reaction = reactionPool[Math.floor(Math.random() * reactionPool.length)];

    setTimeout(() => {
      onGameOver({
        gameId: 'jackfruit',
        won: isWin,
        score: finalScore,
        highScore: finalScore,
        reactionMalayalam: reaction,
        reactionEnglish: isWin
          ? 'Pure blind luck! The proverb says you accidentally scored big!'
          : 'The rabbits were too fast and the jackfruit hit the dirt!'
      });
    }, 400);
  }, [gameInfo, onGameOver]);

  // Keyboard space listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
        dropJackfruit();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [dropJackfruit]);

  // Timer countdown
  useEffect(() => {
    const timer = setInterval(() => {
      if (gameEndedRef.current) {
        clearInterval(timer);
        return;
      }
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Time-up trigger
  useEffect(() => {
    if (timeLeft <= 0 && !gameEndedRef.current) {
      finishGame(scoreRef.current);
    }
  }, [timeLeft, finishGame]);

  // Canvas Main Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = (canvas.width = canvas.parentElement?.clientWidth || 700);
    let height = (canvas.height = Math.min(540, window.innerHeight - 200));
    fruitRef.current.x = width / 2;

    const handleResize = () => {
      if (!canvas || !canvas.parentElement) return;
      width = canvas.width = canvas.parentElement.clientWidth;
      height = canvas.height = Math.min(540, window.innerHeight - 200);
      if (!fruitRef.current.isFalling) {
        fruitRef.current.x = width / 2;
      }
    };
    window.addEventListener('resize', handleResize);

    const groundY = height - 55;

    const loop = (timestamp: number) => {
      const dt = Math.min((timestamp - lastTimeRef.current) / 16.66, 2.5);
      lastTimeRef.current = timestamp;

      ctx.clearRect(0, 0, width, height);

      // Smooth camera shake rumble
      let shakeX = 0;
      let shakeY = 0;
      if (shakeIntensityRef.current > 0.1) {
        shakeX = (Math.random() - 0.5) * shakeIntensityRef.current * 2;
        shakeY = (Math.random() - 0.5) * shakeIntensityRef.current * 2;
        shakeIntensityRef.current *= 0.84;
      } else {
        shakeIntensityRef.current = 0;
      }

      ctx.save();
      ctx.translate(shakeX, shakeY);

      // 1. Draw Background: Warm comic Kerala garden / village
      // Sky gradient
      const skyGrad = ctx.createLinearGradient(0, 0, 0, height);
      skyGrad.addColorStop(0, '#FEF9C3'); // sunny pale yellow
      skyGrad.addColorStop(0.6, '#ECFCCB'); // soft fresh green
      skyGrad.addColorStop(1, '#D9F99D');
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, width, height);

      // Distant hill curves
      ctx.fillStyle = '#BEF264';
      ctx.beginPath();
      ctx.arc(width * 0.25, height + 80, 260, Math.PI, 0);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(width * 0.75, height + 90, 300, Math.PI, 0);
      ctx.fill();

      // Ground / grass patch
      ctx.fillStyle = '#65A30D';
      ctx.fillRect(0, groundY, width, height - groundY);
      ctx.fillStyle = '#4D7C0F';
      ctx.fillRect(0, groundY + 12, width, height - groundY - 12);

      // Grassy tufts along ground
      ctx.strokeStyle = '#84CC16';
      ctx.lineWidth = 3;
      for (let gx = 15; gx < width; gx += 45) {
        ctx.beginPath();
        ctx.moveTo(gx, groundY);
        ctx.lineTo(gx - 4, groundY - 8);
        ctx.moveTo(gx, groundY);
        ctx.lineTo(gx + 3, groundY - 10);
        ctx.stroke();
      }

      // 2. Tree Branches at Top
      ctx.strokeStyle = '#78350F';
      ctx.lineWidth = 18;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(-20, 30);
      ctx.quadraticCurveTo(width * 0.35, 45, width / 2, 48);
      ctx.quadraticCurveTo(width * 0.7, 50, width + 20, 20);
      ctx.stroke();

      // Secondary leafy clumps
      ctx.fillStyle = '#15803D';
      ctx.beginPath();
      ctx.arc(width * 0.2, 20, 45, 0, Math.PI * 2);
      ctx.arc(width * 0.45, 25, 40, 0, Math.PI * 2);
      ctx.arc(width * 0.55, 20, 48, 0, Math.PI * 2);
      ctx.arc(width * 0.8, 15, 50, 0, Math.PI * 2);
      ctx.fill();

      // Jackfruit stalk vine
      const fruit = fruitRef.current;
      if (!fruit.isFalling && !fruit.isSplatted) {
        fruit.sway += fruit.swaySpeed;
        const swayOffset = Math.sin(fruit.sway) * 8;
        fruit.x = width / 2 + swayOffset;

        ctx.strokeStyle = '#854D0E';
        ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.moveTo(width / 2, 48);
        ctx.quadraticCurveTo(width / 2 + swayOffset * 0.5, 65, fruit.x, fruit.y - fruit.height / 2);
        ctx.stroke();
      }

      // 3. Spawning Rabbits
      if (timestamp > nextRabbitTimeRef.current) {
        spawnRabbit(width, groundY);
        // Next spawn between 0.9s and 2.2s
        const spawnDelay = Math.max(800, 2200 - scoreRef.current * 1.5);
        nextRabbitTimeRef.current = timestamp + spawnDelay;
      }

      // 4. Update & Draw Rabbits
      for (let i = rabbitsRef.current.length - 1; i >= 0; i--) {
        const r = rabbitsRef.current[i];

        if (r.isDazed) {
          r.dazeTimer += dt;
          if (r.dazeTimer > 45) {
            rabbitsRef.current.splice(i, 1);
            continue;
          }
        } else {
          r.x += r.vx * dt;
          r.hopPhase += 0.2 * dt;
        }

        // Remove offscreen
        if (
          (r.direction === 1 && r.x > width + 70) ||
          (r.direction === -1 && r.x < -70)
        ) {
          rabbitsRef.current.splice(i, 1);
          continue;
        }

        // Draw Rabbit
        ctx.save();
        ctx.translate(r.x, r.y);
        if (r.direction === -1) {
          ctx.scale(-1, 1);
        }

        const hopY = r.isDazed ? 0 : -Math.abs(Math.sin(r.hopPhase)) * 8;

        // Shadow
        ctx.fillStyle = 'rgba(0,0,0,0.18)';
        ctx.beginPath();
        ctx.ellipse(0, 4, r.width * 0.45, 6, 0, 0, Math.PI * 2);
        ctx.fill();

        // Rabbit Body
        ctx.translate(0, hopY);
        ctx.fillStyle = r.color;
        ctx.strokeStyle = '#1F2937';
        ctx.lineWidth = 2.5;

        // Tail
        ctx.beginPath();
        ctx.arc(-r.width * 0.38, -r.height * 0.25, 7, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Main body oval
        ctx.beginPath();
        ctx.ellipse(0, -r.height * 0.35, r.width * 0.42, r.height * 0.38, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Head
        ctx.beginPath();
        ctx.arc(r.width * 0.3, -r.height * 0.6, r.height * 0.35, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Ears
        ctx.beginPath();
        ctx.ellipse(r.width * 0.22, -r.height * 1.05, 5, 14, -0.2, 0, Math.PI * 2);
        ctx.ellipse(r.width * 0.34, -r.height * 1.1, 5, 15, 0.1, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Inner ear pink
        ctx.fillStyle = '#FDA4AF';
        ctx.beginPath();
        ctx.ellipse(r.width * 0.22, -r.height * 1.05, 2.5, 9, -0.2, 0, Math.PI * 2);
        ctx.ellipse(r.width * 0.34, -r.height * 1.1, 2.5, 10, 0.1, 0, Math.PI * 2);
        ctx.fill();

        // Eyes
        ctx.fillStyle = '#111827';
        if (r.isDazed) {
          // Dizzy swirl / X eyes
          ctx.lineWidth = 2;
          ctx.strokeStyle = '#DC2626';
          ctx.beginPath();
          ctx.moveTo(r.width * 0.36, -r.height * 0.65);
          ctx.lineTo(r.width * 0.44, -r.height * 0.55);
          ctx.moveTo(r.width * 0.44, -r.height * 0.65);
          ctx.lineTo(r.width * 0.36, -r.height * 0.55);
          ctx.stroke();
        } else {
          ctx.beginPath();
          ctx.arc(r.width * 0.38, -r.height * 0.62, 3, 0, Math.PI * 2);
          ctx.fill();
          // Pupil sparkle
          ctx.fillStyle = '#FFFFFF';
          ctx.beginPath();
          ctx.arc(r.width * 0.39, -r.height * 0.64, 1, 0, Math.PI * 2);
          ctx.fill();
        }

        // Little nose
        ctx.fillStyle = '#FB7185';
        ctx.beginPath();
        ctx.arc(r.width * 0.47, -r.height * 0.56, 2.5, 0, Math.PI * 2);
        ctx.fill();

        // Feet
        ctx.fillStyle = r.color;
        ctx.strokeStyle = '#1F2937';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.ellipse(-r.width * 0.15, 0, 9, 4, 0, 0, Math.PI * 2);
        ctx.ellipse(r.width * 0.2, 0, 8, 4, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Dazed stars orbiting head
        if (r.isDazed) {
          ctx.fillStyle = '#FBBF24';
          const starAngle = (r.dazeTimer * 0.25);
          for (let s = 0; s < 3; s++) {
            const a = starAngle + (s * (Math.PI * 2 / 3));
            const sx = r.width * 0.3 + Math.cos(a) * 22;
            const sy = -r.height * 0.95 + Math.sin(a) * 8;
            ctx.beginPath();
            ctx.arc(sx, sy, 3.5, 0, Math.PI * 2);
            ctx.fill();
          }
        }

        ctx.restore();
      }

      // 5. Update & Draw Jackfruit
      if (fruit.isFalling) {
        fruit.vy += 1.4 * dt; // Faster, punchier gravity acceleration
        fruit.y += fruit.vy * dt;

        // Check collision with running rabbits FIRST before ground check
        const hitRabbits: Rabbit[] = [];
        const fruitLeft = fruit.x - fruit.width * 0.48;
        const fruitRight = fruit.x + fruit.width * 0.48;
        const fruitBottom = fruit.y + fruit.height * 0.48;

        for (let i = 0; i < rabbitsRef.current.length; i++) {
          const r = rabbitsRef.current[i];
          if (r.isDazed) continue;

          const rabbitLeft = r.x - r.width * 0.48;
          const rabbitRight = r.x + r.width * 0.48;
          const rabbitTop = r.y - r.height;

          // Check direct vertical & horizontal overlap
          if (
            fruitRight > rabbitLeft &&
            fruitLeft < rabbitRight &&
            fruitBottom >= rabbitTop &&
            fruit.y - fruit.height * 0.3 <= r.y
          ) {
            hitRabbits.push(r);
          }
        }

        // If any rabbit was hit, also catch any coinciding rabbits overlapping with the impact or hit rabbits
        if (hitRabbits.length > 0) {
          for (let i = 0; i < rabbitsRef.current.length; i++) {
            const r = rabbitsRef.current[i];
            if (r.isDazed || hitRabbits.includes(r)) continue;

            const isCoincidingWithHit = hitRabbits.some(hr => {
              const distanceBetween = Math.abs(r.x - hr.x);
              return distanceBetween < (r.width * 0.6 + hr.width * 0.6);
            });

            const isInFruitSplash =
              Math.abs(r.x - fruit.x) < (fruit.width * 0.65 + r.width * 0.5) &&
              fruitBottom >= (r.y - r.height);

            if (isCoincidingWithHit || isInFruitSplash) {
              hitRabbits.push(r);
            }
          }
        }

        if (hitRabbits.length > 0) {
          // DIRECT HIT on all coinciding rabbits! "ചക്ക വീണു മുയൽ ചത്തു!"
          for (const r of hitRabbits) {
            r.isDazed = true;
            r.dazeTimer = 0;
          }

          fruit.isFalling = false;
          fruit.isSplatted = true;

          const isMultiKill = hitRabbits.length > 1;
          triggerShake(isMultiKill);
          sound.playSquish();
          sound.playBonk();
          if (isMultiKill) {
            sound.playVictory();
          }

          createSplatParticles(fruit.x, fruit.y, true, isMultiKill);

          const baseEarned = hitRabbits.reduce((sum, r) => sum + r.points, 0);

          setCombo(c => {
            const nextCombo = c + hitRabbits.length;
            const comboBonus = nextCombo > 1 ? nextCombo * 35 : 0;
            const multiBonus = isMultiKill ? 250 * (hitRabbits.length - 1) : 0;
            const earnedTotal = baseEarned + comboBonus + multiBonus;

            setScore(s => s + earnedTotal);

            if (isMultiKill) {
              addFloatingText(`💥 DOUBLE KILL! ${hitRabbits.length} Rabbits Dead! 🐰🐰`, fruit.x, fruit.y - 55, '#DC2626');
              addFloatingText(`+${earnedTotal} pts! Double Fluke Luck! 🍈✨`, fruit.x, fruit.y - 25, '#15803D');
            } else {
              addFloatingText(`+${earnedTotal} pts! Pure Luck! 🍈`, fruit.x, fruit.y - 30, '#15803D');
              if (nextCombo > 1) {
                setTimeout(() => {
                  addFloatingText(`${nextCombo}X Luck Combo! 🔥`, fruit.x, fruit.y - 55, '#D97706');
                }, 150);
              }
            }

            return nextCombo;
          });

          if (resetTimeoutRef.current) {
            clearTimeout(resetTimeoutRef.current);
          }
          resetTimeoutRef.current = setTimeout(() => {
            resetJackfruit(width);
            resetTimeoutRef.current = null;
          }, 180);
        } else if (fruit.y + fruit.height / 2 >= groundY) {
          // If no rabbits hit, but reached ground -> Miss!
          fruit.y = groundY - fruit.height / 3;
          fruit.isFalling = false;
          fruit.isSplatted = true;

          // Splat on dirt - Miss!
          sound.playThud();
          createSplatParticles(fruit.x, groundY, false, false);
          addFloatingText('Missed! Splat in the dirt! 🤦‍♂️', fruit.x, groundY - 20, '#DC2626');
          setCombo(0);
          setMisses(m => {
            const nextMiss = m + 1;
            if (nextMiss >= maxMisses) {
              setTimeout(() => finishGame(scoreRef.current), 350);
            }
            return nextMiss;
          });

          // Reset fruit after snappy splat delay
          if (resetTimeoutRef.current) {
            clearTimeout(resetTimeoutRef.current);
          }
          resetTimeoutRef.current = setTimeout(() => {
            resetJackfruit(width);
            resetTimeoutRef.current = null;
          }, 180);
        }
      }

      // Draw Jackfruit
      if (!fruit.isSplatted) {
        ctx.save();
        ctx.translate(fruit.x, fruit.y);

        // Jackfruit shadow on ground when falling
        if (fruit.isFalling) {
          const shadowScale = Math.max(0.2, (fruit.y / groundY));
          ctx.fillStyle = `rgba(0,0,0,${0.25 * shadowScale})`;
          ctx.beginPath();
          ctx.ellipse(0, groundY - fruit.y, fruit.width * 0.5 * shadowScale, 6 * shadowScale, 0, 0, Math.PI * 2);
          ctx.fill();
        }

        // Textured Green-Yellow Jackfruit Body
        ctx.fillStyle = '#65A30D';
        ctx.strokeStyle = '#1F2937';
        ctx.lineWidth = 3;

        // Oval base
        ctx.beginPath();
        ctx.ellipse(0, 0, fruit.width * 0.5, fruit.height * 0.5, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Prickly bumps / spikes texture
        ctx.fillStyle = '#4D7C0F';
        for (let py = -fruit.height * 0.35; py <= fruit.height * 0.35; py += 12) {
          for (let px = -fruit.width * 0.35; px <= fruit.width * 0.35; px += 12) {
            if ((px * px) / (fruit.width * fruit.width * 0.25) + (py * py) / (fruit.height * fruit.height * 0.25) < 0.8) {
              ctx.beginPath();
              ctx.arc(px, py, 2.5, 0, Math.PI * 2);
              ctx.fill();
            }
          }
        }

        // Ripe yellowish highlight
        ctx.fillStyle = 'rgba(250, 204, 21, 0.45)';
        ctx.beginPath();
        ctx.ellipse(-8, -6, fruit.width * 0.25, fruit.height * 0.3, -0.2, 0, Math.PI * 2);
        ctx.fill();

        // Jackfruit Stalk stem
        ctx.fillStyle = '#78350F';
        ctx.fillRect(-4, -fruit.height * 0.5 - 8, 8, 10);

        ctx.restore();
      }

      // 6. Update & Draw Particles
      for (let i = particlesRef.current.length - 1; i >= 0; i--) {
        const p = particlesRef.current[i];
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.vy += 0.2 * dt; // gravity
        p.life += dt;

        if (p.life >= p.maxLife) {
          particlesRef.current.splice(i, 1);
          continue;
        }

        const alpha = Math.max(0, 1 - p.life / p.maxLife);
        ctx.save();
        ctx.fillStyle = p.color;
        ctx.globalAlpha = alpha;

        if (p.shape === 'star') {
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();
        } else {
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size * 0.6, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      }

      // 7. Update & Draw Floating Texts
      for (let i = floatingTextsRef.current.length - 1; i >= 0; i--) {
        const ft = floatingTextsRef.current[i];
        ft.y += ft.vy * dt;
        ft.opacity -= 0.02 * dt;

        if (ft.opacity <= 0) {
          floatingTextsRef.current.splice(i, 1);
          continue;
        }

        ctx.save();
        ctx.globalAlpha = ft.opacity;
        ctx.font = 'bold 18px "Noto Sans Malayalam", "Fredoka", sans-serif';
        ctx.fillStyle = ft.color;
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 4;
        ctx.textAlign = 'center';
        ctx.strokeText(ft.text, ft.x, ft.y);
        ctx.fillText(ft.text, ft.x, ft.y);
        ctx.restore();
      }

      // Restore camera shake transformation
      ctx.restore();

      animationFrameId.current = requestAnimationFrame(loop);
    };

    animationFrameId.current = requestAnimationFrame(loop);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
      if (shakeTimeoutRef.current) {
        clearTimeout(shakeTimeoutRef.current);
      }
      if (resetTimeoutRef.current) {
        clearTimeout(resetTimeoutRef.current);
      }
    };
  }, [finishGame, resetJackfruit, spawnRabbit, triggerShake]);

  const toggleSound = () => {
    const next = sound.toggleMute();
    setIsMuted(next);
  };

  const restartGame = () => {
    sound.playClick();
    gameEndedRef.current = false;
    setScore(0);
    setCombo(0);
    setTimeLeft(40);
    setMisses(0);
    rabbitsRef.current = [];
    particlesRef.current = [];
    floatingTextsRef.current = [];
    if (canvasRef.current) {
      resetJackfruit(canvasRef.current.width);
    }
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full max-w-4xl mx-auto flex flex-col items-center select-none"
    >
      {/* Top Game Bar */}
      <div className="w-full bg-white border-4 border-black rounded-3xl p-4 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] mb-3 flex flex-wrap items-center justify-between gap-3">
        {/* Left: Back & Title */}
        <div className="flex items-center gap-3">
          <button
            id="exit-game-btn"
            onClick={() => {
              sound.playClick();
              onExit();
            }}
            className="px-3 py-2 bg-[#FFD93D] hover:bg-[#ebc428] active:translate-y-0.5 border-2 border-black rounded-xl font-bold flex items-center gap-1 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] cursor-pointer text-black"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Arcade</span>
          </button>
          <div>
            <h2 className="text-xl md:text-2xl font-black tracking-tight flex items-center gap-2 text-black font-['Noto_Sans_Malayalam']">
              <span>🍈</span> ചക്ക വീണു മുയൽ ചത്തു
            </h2>
            <p className="text-xs font-bold text-gray-600">
              Chakka Veenu Muyal Chathu
            </p>
          </div>
        </div>

        {/* Right Stats: Score, Misses, Timer */}
        <div className="flex items-center gap-3 ml-auto">
          {/* Misses Indicator */}
          <div className="flex flex-col items-center bg-[#FF6B6B] border-2 border-black px-3 py-1 rounded-xl text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
            <span className="text-[10px] uppercase font-black tracking-wider">MISSES</span>
            <div className="flex gap-1 mt-0.5">
              {[...Array(maxMisses)].map((_, i) => (
                <span
                  key={i}
                  className={`text-sm ${i < misses ? 'opacity-100 scale-110' : 'opacity-30'}`}
                >
                  ❌
                </span>
              ))}
            </div>
          </div>

          {/* Timer */}
          <div className="flex flex-col items-center bg-[#FFD93D] border-2 border-black px-3 py-1 rounded-xl min-w-[70px] shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
            <span className="text-[10px] uppercase font-black text-black">TIME</span>
            <span className="text-lg font-black text-black">{timeLeft}s</span>
          </div>

          {/* Score */}
          <div className="flex flex-col items-center bg-[#4ECDC4] border-2 border-black px-4 py-1 rounded-xl min-w-[90px] shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
            <span className="text-[10px] uppercase font-black text-white">SCORE</span>
            <span className="text-lg font-black text-white">{score}</span>
          </div>

          {/* Audio toggle & restart */}
          <button
            id="sound-toggle-btn"
            onClick={toggleSound}
            aria-label="Toggle sound"
            className="p-2 bg-white hover:bg-gray-100 border-2 border-black rounded-xl cursor-pointer shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
          >
            {isMuted ? <VolumeX className="w-5 h-5 text-[#FF6B6B]" /> : <Volume2 className="w-5 h-5 text-[#4ECDC4]" />}
          </button>

          <button
            id="restart-jackfruit-btn"
            onClick={restartGame}
            aria-label="Restart game"
            className="p-2 bg-white hover:bg-gray-100 border-2 border-black rounded-xl cursor-pointer shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] text-black"
          >
            <RotateCcw className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main Canvas Stage */}
      <div
        onClick={dropJackfruit}
        className={`relative w-full overflow-hidden border-4 border-black rounded-3xl shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] bg-amber-50 cursor-pointer select-none touch-none ${
          shake ? (isStrongShake ? 'animate-arcade-shake-strong' : 'animate-arcade-shake') : ''
        }`}
      >
        <canvas ref={canvasRef} className="block w-full h-[380px] md:h-[420px]" />

        {/* Floating Combo Badge */}
        {combo > 1 && (
          <div className="absolute top-4 left-4 bg-[#FFD93D] border-3 border-black px-3 py-1 rounded-full font-black text-sm text-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] flex items-center gap-1 animate-pulse">
            <Zap className="w-4 h-4 text-black fill-black" />
            <span>{combo}X Luck Combo!</span>
          </div>
        )}

        {/* Tap to Drop overlay hint */}
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-black/80 text-white text-xs px-4 py-1.5 rounded-full font-bold tracking-wide pointer-events-none flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-[#FFD93D]" />
          <span>Tap screen or press SPACEBAR to drop!</span>
        </div>
      </div>

      {/* Bottom Big Drop Action Button for Touch / Ease of Play */}
      <div className="w-full mt-3 flex justify-center">
        <button
          id="drop-jackfruit-action-btn"
          onClick={dropJackfruit}
          className="w-full md:w-2/3 py-3.5 bg-[#4ECDC4] hover:bg-[#3ec4ba] active:translate-y-1 active:shadow-none border-4 border-black rounded-2xl font-black text-xl text-white shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center gap-2 cursor-pointer transition-transform"
        >
          <span>🍈</span>
          <span>DROP JACKFRUIT!</span>
        </button>
      </div>
    </div>
  );
};
