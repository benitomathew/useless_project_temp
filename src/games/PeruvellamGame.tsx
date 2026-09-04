import React, { useEffect, useRef, useState, useCallback } from 'react';
import { ArrowLeft, Volume2, VolumeX, RotateCcw, Droplets, Zap, Clock, Award } from 'lucide-react';
import confetti from 'canvas-confetti';
import { GAMES_DATA } from '../data/gamesData';
import { GameResult } from '../types';
import { sound } from '../utils/audio';

interface PeruvellamGameProps {
  onGameOver: (result: GameResult) => void;
  onExit: () => void;
}

type DropType = 'normal' | 'heavy' | 'golden' | 'mud' | 'lightning';

interface Droplet {
  id: number;
  x: number;
  y: number;
  vy: number;
  type: DropType;
  radius: number;
  ml: number;
  points: number;
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
  shape: 'drop' | 'circle' | 'sparkle';
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

interface BackgroundRainDrop {
  x: number;
  y: number;
  length: number;
  speed: number;
  alpha: number;
}

export const PeruvellamGame: React.FC<PeruvellamGameProps> = ({ onGameOver, onExit }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Game Parameters
  const TARGET_WATER = 500; // 500 ml to fill bucket
  const INITIAL_TIME = 35; // 35 seconds time limit

  const [score, setScore] = useState(0);
  const [waterAmount, setWaterAmount] = useState(0);
  const [timeLeft, setTimeLeft] = useState(INITIAL_TIME);
  const [combo, setCombo] = useState(0);
  const [isMuted, setIsMuted] = useState(sound.isMuted());
  const [shake, setShake] = useState(false);
  const [isVictoryCelebration, setIsVictoryCelebration] = useState(false);

  // Refs for animation loop
  const scoreRef = useRef(0);
  scoreRef.current = score;
  const waterRef = useRef(0);
  waterRef.current = waterAmount;
  const timeLeftRef = useRef(INITIAL_TIME);
  timeLeftRef.current = timeLeft;
  const comboRef = useRef(0);
  comboRef.current = combo;
  const gameEndedRef = useRef(false);

  // Bucket State
  const bucketRef = useRef({
    x: 300,
    targetX: 300,
    y: 0, // set based on ground
    width: 86,
    height: 70,
    vx: 0,
    tilt: 0,
    wavePhase: 0,
  });

  // Game Entities
  const dropletsRef = useRef<Droplet[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const floatingTextsRef = useRef<FloatingText[]>([]);
  const bgRainRef = useRef<BackgroundRainDrop[]>([]);
  const nextDropTimeRef = useRef(0);
  const dropIdCounter = useRef(1);
  const textIdCounter = useRef(1);
  const keysPressed = useRef<{ left: boolean; right: boolean }>({ left: false, right: false });

  const animationFrameId = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(performance.now());

  const gameInfo = GAMES_DATA.find(g => g.id === 'peruvellam')!;

  // Screen shake
  const triggerShake = useCallback(() => {
    setShake(true);
    setTimeout(() => setShake(false), 240);
  }, []);

  // Add floating text
  const addFloatingText = (text: string, x: number, y: number, color: string = '#0284C7') => {
    floatingTextsRef.current.push({
      id: textIdCounter.current++,
      text,
      x,
      y,
      color,
      opacity: 1,
      vy: -1.6,
    });
  };

  // Create water splash particles
  const createSplashParticles = (x: number, y: number, color: string, isBig: boolean = false) => {
    const count = isBig ? 24 : 12;
    for (let i = 0; i < count; i++) {
      const angle = (Math.random() * Math.PI) + Math.PI; // upward spray
      const speed = 2 + Math.random() * (isBig ? 6 : 4);
      particlesRef.current.push({
        x: x + (Math.random() * 20 - 10),
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color,
        size: 2.5 + Math.random() * (isBig ? 4.5 : 3),
        life: 0,
        maxLife: 20 + Math.random() * 15,
        shape: Math.random() > 0.3 ? 'drop' : 'circle',
      });
    }
  };

  // Spawn droplet
  const spawnDroplet = (canvasWidth: number) => {
    const rand = Math.random();
    let type: DropType = 'normal';
    let ml = 10;
    let points = 50;
    let radius = 9;
    let speed = 2.6 + Math.random() * 1.4;

    if (rand < 0.50) {
      type = 'normal';
      ml = 10;
      points = 50;
      radius = 9;
    } else if (rand < 0.74) {
      type = 'heavy';
      ml = 25;
      points = 100;
      radius = 13;
      speed *= 1.25;
    } else if (rand < 0.86) {
      type = 'mud';
      ml = -20;
      points = -30;
      radius = 11;
      speed *= 1.1;
    } else if (rand < 0.94) {
      type = 'lightning';
      ml = 35;
      points = 160;
      radius = 10;
      speed *= 1.6;
    } else {
      type = 'golden';
      ml = 50;
      points = 250;
      radius = 12;
      speed *= 1.15;
    }

    const margin = 40;
    const x = margin + Math.random() * (canvasWidth - margin * 2);

    dropletsRef.current.push({
      id: dropIdCounter.current++,
      x,
      y: -15,
      vy: speed,
      type,
      radius,
      ml,
      points,
    });
  };

  // Finish game callback
  const finishGame = useCallback((won: boolean, finalScore: number, finalWater: number) => {
    if (gameEndedRef.current) return;
    gameEndedRef.current = true;

    if (won) {
      setIsVictoryCelebration(true);
      sound.playFloodCrescendo();
      sound.playVictory();
      confetti({
        particleCount: 90,
        spread: 80,
        origin: { y: 0.6 }
      });
    } else {
      sound.playSadWahWah();
    }

    const reactionPool = won ? gameInfo.funnyQuotes.win : gameInfo.funnyQuotes.lose;
    const reaction = reactionPool[Math.floor(Math.random() * reactionPool.length)];

    setTimeout(() => {
      onGameOver({
        gameId: 'peruvellam',
        won,
        score: finalScore,
        highScore: finalScore,
        reactionMalayalam: reaction,
        reactionEnglish: won
          ? 'Little droplets made an epic ocean! The bucket overflowed with monsoon glory!'
          : 'Time ran out before the bucket could fill! Every little drop slipped away!'
      });
    }, won ? 1400 : 800);
  }, [gameInfo, onGameOver]);

  // Main Timer Countdown
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
      const won = waterRef.current >= TARGET_WATER;
      finishGame(won, scoreRef.current, waterRef.current);
    }
  }, [timeLeft, finishGame, TARGET_WATER]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'ArrowLeft' || e.code === 'KeyA') {
        keysPressed.current.left = true;
      } else if (e.code === 'ArrowRight' || e.code === 'KeyD') {
        keysPressed.current.right = true;
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'ArrowLeft' || e.code === 'KeyA') {
        keysPressed.current.left = false;
      } else if (e.code === 'ArrowRight' || e.code === 'KeyD') {
        keysPressed.current.right = false;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // Initialize Background Raindrops
  useEffect(() => {
    bgRainRef.current = [];
    for (let i = 0; i < 40; i++) {
      bgRainRef.current.push({
        x: Math.random() * 800,
        y: Math.random() * 500,
        length: 12 + Math.random() * 16,
        speed: 8 + Math.random() * 6,
        alpha: 0.15 + Math.random() * 0.25,
      });
    }
  }, []);

  // Main Canvas & Animation Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const handleResize = () => {
      const parent = canvas.parentElement;
      if (!parent) return;
      canvas.width = parent.clientWidth;
      canvas.height = parent.clientHeight || 400;
      bucketRef.current.y = canvas.height - 45;
      if (bucketRef.current.x > canvas.width - 50) {
        bucketRef.current.x = canvas.width / 2;
        bucketRef.current.targetX = canvas.width / 2;
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);

    const loop = (timestamp: number) => {
      const dt = Math.min(2.0, (timestamp - lastTimeRef.current) / 16.666);
      lastTimeRef.current = timestamp;

      const width = canvas.width;
      const height = canvas.height;
      const groundY = height - 20;
      const bucket = bucketRef.current;
      bucket.y = groundY - bucket.height + 6;

      ctx.clearRect(0, 0, width, height);

      // 1. Draw Monsoon Sky Gradient
      const skyGrad = ctx.createLinearGradient(0, 0, 0, height);
      skyGrad.addColorStop(0, '#0F172A'); // dark slate rain cloud
      skyGrad.addColorStop(0.35, '#1E293B');
      skyGrad.addColorStop(0.75, '#0284C7'); // rain blue
      skyGrad.addColorStop(1, '#38BDF8'); // vibrant water reflection
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, width, height);

      // Distant Kerala lush coconut / banana foliage silhouettes in rain
      ctx.fillStyle = 'rgba(6, 78, 59, 0.4)';
      ctx.beginPath();
      ctx.arc(width * 0.15, height - 30, 90, Math.PI, 0);
      ctx.arc(width * 0.5, height - 30, 110, Math.PI, 0);
      ctx.arc(width * 0.85, height - 30, 100, Math.PI, 0);
      ctx.fill();

      // Monsoon clouds drifting at top
      ctx.fillStyle = 'rgba(30, 41, 59, 0.85)';
      ctx.beginPath();
      ctx.arc(width * 0.2, 10, 50, 0, Math.PI * 2);
      ctx.arc(width * 0.4, 15, 65, 0, Math.PI * 2);
      ctx.arc(width * 0.65, 10, 55, 0, Math.PI * 2);
      ctx.arc(width * 0.85, 20, 60, 0, Math.PI * 2);
      ctx.fill();

      // Ground (wet Kerala courtyard veranda tiles)
      ctx.fillStyle = '#7C2D12'; // terracotta tile
      ctx.fillRect(0, groundY, width, height - groundY);
      ctx.fillStyle = '#9A3412';
      ctx.fillRect(0, groundY, width, 5);

      // Wet shine puddles on ground
      ctx.fillStyle = 'rgba(56, 189, 248, 0.35)';
      ctx.beginPath();
      ctx.ellipse(width * 0.25, groundY + 10, 60, 4, 0, 0, Math.PI * 2);
      ctx.ellipse(width * 0.75, groundY + 12, 75, 5, 0, 0, Math.PI * 2);
      ctx.fill();

      // 2. Background Rain Streaks
      ctx.strokeStyle = '#BAE6FD';
      ctx.lineWidth = 1.5;
      for (const r of bgRainRef.current) {
        r.y += r.speed * dt;
        r.x += 1.2 * dt; // wind slant
        if (r.y > height) {
          r.y = -20;
          r.x = Math.random() * (width + 100) - 50;
        }
        ctx.globalAlpha = r.alpha;
        ctx.beginPath();
        ctx.moveTo(r.x, r.y);
        ctx.lineTo(r.x + 2, r.y + r.length);
        ctx.stroke();
      }
      ctx.globalAlpha = 1.0;

      // 3. Handle Keyboard & Smooth Bucket Motion
      const moveSpeed = 8 * dt;
      if (keysPressed.current.left) {
        bucket.targetX = Math.max(bucket.width * 0.55, bucket.targetX - moveSpeed);
      }
      if (keysPressed.current.right) {
        bucket.targetX = Math.min(width - bucket.width * 0.55, bucket.targetX + moveSpeed);
      }

      // Smooth lerp to targetX
      const prevX = bucket.x;
      bucket.x += (bucket.targetX - bucket.x) * 0.28;
      bucket.vx = bucket.x - prevX;
      bucket.tilt = Math.max(-0.15, Math.min(0.15, -bucket.vx * 0.025));
      bucket.wavePhase += 0.1 * dt;

      // 4. Spawning Droplets
      if (!gameEndedRef.current && timestamp > nextDropTimeRef.current) {
        spawnDroplet(width);
        // Spawn interval gets slightly faster as bucket fills or time decreases
        const progress = waterRef.current / TARGET_WATER;
        const delay = Math.max(280, 520 - progress * 200);
        nextDropTimeRef.current = timestamp + delay;
      }

      // 5. Update & Draw Droplets
      const bucketTop = bucket.y;
      const bucketLeft = bucket.x - bucket.width * 0.48;
      const bucketRight = bucket.x + bucket.width * 0.48;

      for (let i = dropletsRef.current.length - 1; i >= 0; i--) {
        const drop = dropletsRef.current[i];
        drop.y += drop.vy * dt;

        // Check catch collision with bucket opening
        if (
          drop.y + drop.radius >= bucketTop &&
          drop.y - drop.radius <= bucketTop + 16 &&
          drop.x >= bucketLeft &&
          drop.x <= bucketRight
        ) {
          // CATCH!
          dropletsRef.current.splice(i, 1);

          if (drop.type === 'mud') {
            // MUD caught! Lose water and combo
            sound.playMudSplat();
            triggerShake();
            createSplashParticles(drop.x, bucketTop + 6, '#78350F', true);
            addFloatingText(`${drop.ml} ml 💩 Mud!`, drop.x, bucketTop - 15, '#B91C1C');

            setCombo(0);
            setWaterAmount(w => {
              const updated = Math.max(0, w + drop.ml);
              waterRef.current = updated;
              return updated;
            });
            setScore(s => Math.max(0, s + drop.points));
          } else {
            // Clean water droplet caught!
            const fillRatio = waterRef.current / TARGET_WATER;
            if (drop.type === 'golden') {
              sound.playGoldenDrop();
              createSplashParticles(drop.x, bucketTop + 6, '#FACC15', true);
              addFloatingText(`+${drop.ml} ml ✨ GOLDEN!`, drop.x, bucketTop - 18, '#CA8A04');
            } else if (drop.type === 'lightning') {
              sound.playBigWaterSplash();
              createSplashParticles(drop.x, bucketTop + 6, '#38BDF8', true);
              addFloatingText(`+${drop.ml} ml ⚡ SPEED!`, drop.x, bucketTop - 18, '#0284C7');
            } else {
              sound.playWaterDrop(fillRatio);
              const splashColor = drop.type === 'heavy' ? '#0369A1' : '#38BDF8';
              createSplashParticles(drop.x, bucketTop + 6, splashColor, drop.type === 'heavy');
              addFloatingText(`+${drop.ml} ml 💧`, drop.x, bucketTop - 15, '#0284C7');
            }

            // Update combo
            const nextCombo = comboRef.current + 1;
            setCombo(nextCombo);
            comboRef.current = nextCombo;

            if (nextCombo > 2 && nextCombo % 3 === 0) {
              addFloatingText(`${nextCombo}x Peruvellam Combo! 🔥`, bucket.x, bucketTop - 45, '#D97706');
            }

            const comboBonus = nextCombo > 1 ? nextCombo * 10 : 0;
            const totalEarned = drop.points + comboBonus;
            setScore(s => s + totalEarned);

            // Increase water
            setWaterAmount(prev => {
              const newWater = Math.min(TARGET_WATER, prev + drop.ml);
              waterRef.current = newWater;

              // Check if 100% capacity reached -> PERUVELLAM VICTORY!
              if (newWater >= TARGET_WATER && !gameEndedRef.current) {
                const timeBonus = timeLeftRef.current * 40;
                const finalScore = scoreRef.current + totalEarned + 500 + timeBonus;
                setScore(finalScore);
                finishGame(true, finalScore, newWater);
              }

              return newWater;
            });
          }
          continue;
        }

        // Droplet hits ground
        if (drop.y >= groundY) {
          dropletsRef.current.splice(i, 1);
          if (drop.type !== 'mud') {
            createSplashParticles(drop.x, groundY, '#7DD3FC', false);
            setCombo(0);
            comboRef.current = 0;
          }
          continue;
        }

        // Draw Droplet
        ctx.save();
        ctx.translate(drop.x, drop.y);

        if (drop.type === 'normal') {
          // Classic blue tear drop
          ctx.fillStyle = '#38BDF8';
          ctx.strokeStyle = '#0284C7';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(0, -drop.radius * 1.5);
          ctx.bezierCurveTo(drop.radius, -drop.radius * 0.4, drop.radius, drop.radius, 0, drop.radius);
          ctx.bezierCurveTo(-drop.radius, drop.radius, -drop.radius, -drop.radius * 0.4, 0, -drop.radius * 1.5);
          ctx.fill();
          ctx.stroke();

          // Highlight
          ctx.fillStyle = 'rgba(255,255,255,0.7)';
          ctx.beginPath();
          ctx.arc(-drop.radius * 0.3, drop.radius * 0.1, drop.radius * 0.3, 0, Math.PI * 2);
          ctx.fill();
        } else if (drop.type === 'heavy') {
          // Fat monsoon drop
          ctx.fillStyle = '#0284C7';
          ctx.strokeStyle = '#0C4A6E';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(0, -drop.radius * 1.6);
          ctx.bezierCurveTo(drop.radius * 1.1, -drop.radius * 0.4, drop.radius * 1.1, drop.radius, 0, drop.radius);
          ctx.bezierCurveTo(-drop.radius * 1.1, drop.radius, -drop.radius * 1.1, -drop.radius * 0.4, 0, -drop.radius * 1.6);
          ctx.fill();
          ctx.stroke();

          // White shine
          ctx.fillStyle = '#FFFFFF';
          ctx.beginPath();
          ctx.arc(-drop.radius * 0.35, -drop.radius * 0.1, drop.radius * 0.35, 0, Math.PI * 2);
          ctx.fill();
        } else if (drop.type === 'golden') {
          // Golden nectar drop
          ctx.fillStyle = '#FACC15';
          ctx.strokeStyle = '#854D0E';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(0, -drop.radius * 1.5);
          ctx.bezierCurveTo(drop.radius, -drop.radius * 0.4, drop.radius, drop.radius, 0, drop.radius);
          ctx.bezierCurveTo(-drop.radius, drop.radius, -drop.radius, -drop.radius * 0.4, 0, -drop.radius * 1.5);
          ctx.fill();
          ctx.stroke();

          // Star sparkle
          ctx.fillStyle = '#FFFFFF';
          ctx.beginPath();
          ctx.arc(0, 0, drop.radius * 0.4, 0, Math.PI * 2);
          ctx.fill();
        } else if (drop.type === 'mud') {
          // Mud drop
          ctx.fillStyle = '#78350F';
          ctx.strokeStyle = '#451A03';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(0, 0, drop.radius, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();

          // Mud spots
          ctx.fillStyle = '#451A03';
          ctx.beginPath();
          ctx.arc(drop.radius * 0.3, drop.radius * 0.2, 2, 0, Math.PI * 2);
          ctx.arc(-drop.radius * 0.3, -drop.radius * 0.2, 2.5, 0, Math.PI * 2);
          ctx.fill();
        } else if (drop.type === 'lightning') {
          // Lightning blue drop
          ctx.fillStyle = '#67E8F9';
          ctx.strokeStyle = '#0891B2';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(0, -drop.radius * 1.7);
          ctx.lineTo(drop.radius * 0.9, drop.radius);
          ctx.lineTo(-drop.radius * 0.9, drop.radius);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();
        }

        ctx.restore();
      }

      // 6. Draw The Bucket
      ctx.save();
      ctx.translate(bucket.x, bucket.y + bucket.height / 2);
      ctx.rotate(bucket.tilt);

      const halfW = bucket.width / 2;
      const halfH = bucket.height / 2;
      const fillRatio = Math.min(1.0, waterRef.current / TARGET_WATER);

      // Bucket Outer Shadow
      ctx.fillStyle = 'rgba(0,0,0,0.3)';
      ctx.beginPath();
      ctx.ellipse(0, halfH + 8, halfW * 0.85, 7, 0, 0, Math.PI * 2);
      ctx.fill();

      // Bucket Steel / Brass Body (trapezoid tapering downwards)
      const topW = halfW;
      const botW = halfW * 0.76;

      ctx.save();
      ctx.beginPath();
      ctx.moveTo(-topW, -halfH);
      ctx.lineTo(topW, -halfH);
      ctx.lineTo(botW, halfH);
      ctx.lineTo(-botW, halfH);
      ctx.closePath();
      ctx.clip();

      // Bucket body gradient
      const bucketGrad = ctx.createLinearGradient(-topW, 0, topW, 0);
      bucketGrad.addColorStop(0, '#CBD5E1'); // cool steel
      bucketGrad.addColorStop(0.3, '#F1F5F9'); // highlight shine
      bucketGrad.addColorStop(0.7, '#94A3B8');
      bucketGrad.addColorStop(1, '#64748B');
      ctx.fillStyle = bucketGrad;
      ctx.fillRect(-topW, -halfH, bucket.width, bucket.height);

      // Water Level Inside Bucket
      if (fillRatio > 0) {
        const waterHeight = bucket.height * 0.82 * fillRatio;
        const waterTopY = halfH - waterHeight;

        const waterGrad = ctx.createLinearGradient(0, waterTopY, 0, halfH);
        waterGrad.addColorStop(0, '#38BDF8');
        waterGrad.addColorStop(0.5, '#0284C7');
        waterGrad.addColorStop(1, '#0369A1');
        ctx.fillStyle = waterGrad;

        // Animated wavy surface
        ctx.beginPath();
        ctx.moveTo(-topW, halfH);
        ctx.lineTo(topW, halfH);
        ctx.lineTo(topW, waterTopY);

        const waveAmplitude = 3 + bucket.vx * 0.6;
        for (let wx = topW; wx >= -topW; wx -= 8) {
          const wy = waterTopY + Math.sin(bucket.wavePhase + wx * 0.1) * waveAmplitude;
          ctx.lineTo(wx, wy);
        }
        ctx.closePath();
        ctx.fill();

        // Water surface light reflection line
        ctx.strokeStyle = 'rgba(255,255,255,0.75)';
        ctx.lineWidth = 2.5;
        ctx.stroke();

        // Water bubbles rising inside
        ctx.fillStyle = 'rgba(255,255,255,0.6)';
        ctx.beginPath();
        const b1Y = waterTopY + (waterHeight * 0.4 + Math.sin(bucket.wavePhase * 2) * 5);
        ctx.arc(-8, b1Y, 2.5, 0, Math.PI * 2);
        const b2Y = waterTopY + (waterHeight * 0.7 + Math.cos(bucket.wavePhase * 1.5) * 4);
        ctx.arc(12, b2Y, 3, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();

      // Bucket Outline & Metal Ribs
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.moveTo(-topW, -halfH);
      ctx.lineTo(topW, -halfH);
      ctx.lineTo(botW, halfH);
      ctx.lineTo(-botW, halfH);
      ctx.closePath();
      ctx.stroke();

      // Metal ring bands
      ctx.strokeStyle = '#475569';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-topW * 0.88, -halfH * 0.2);
      ctx.lineTo(topW * 0.88, -halfH * 0.2);
      ctx.moveTo(-topW * 0.82, halfH * 0.4);
      ctx.lineTo(topW * 0.82, halfH * 0.4);
      ctx.stroke();

      // Top rim ellipse
      ctx.fillStyle = '#E2E8F0';
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.ellipse(0, -halfH, topW, 7, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Bucket Handle (metal arch over bucket)
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.arc(0, -halfH + 4, topW * 0.95, Math.PI, 0);
      ctx.stroke();

      // Handle wooden grip in middle
      ctx.fillStyle = '#D97706';
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 2;
      ctx.fillRect(-12, -halfH - topW * 0.95 - 4, 24, 7);
      ctx.strokeRect(-12, -halfH - topW * 0.95 - 4, 24, 7);

      // Percentage badge on bucket
      const pct = Math.floor(fillRatio * 100);
      ctx.fillStyle = pct >= 80 ? '#22C55E' : '#0284C7';
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(-22, halfH * 0.1, 44, 18, 6);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 11px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`${pct}%`, 0, halfH * 0.1 + 13);

      ctx.restore();

      // 7. Update & Draw Splash Particles
      for (let i = particlesRef.current.length - 1; i >= 0; i--) {
        const p = particlesRef.current[i];
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.vy += 0.28 * dt; // gravity
        p.life += dt;

        if (p.life >= p.maxLife) {
          particlesRef.current.splice(i, 1);
          continue;
        }

        const alpha = Math.max(0, 1 - p.life / p.maxLife);
        ctx.save();
        ctx.fillStyle = p.color;
        ctx.globalAlpha = alpha;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // 8. Update & Draw Floating Texts
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
        ctx.font = 'bold 16px "Noto Sans Malayalam", "Fredoka", sans-serif';
        ctx.fillStyle = ft.color;
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 3.5;
        ctx.textAlign = 'center';
        ctx.strokeText(ft.text, ft.x, ft.y);
        ctx.fillText(ft.text, ft.x, ft.y);
        ctx.restore();
      }

      // 9. Peruvellam Flood Celebration Overlay
      if (isVictoryCelebration) {
        ctx.save();
        ctx.fillStyle = 'rgba(2, 132, 199, 0.45)';
        ctx.fillRect(0, 0, width, height);

        ctx.font = '900 36px "Noto Sans Malayalam", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillStyle = '#FFFFFF';
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 7;
        ctx.strokeText('പെരുവെള്ളം! 🌊🪣', width / 2, height / 2 - 10);
        ctx.fillText('പെരുവെള്ളം! 🌊🪣', width / 2, height / 2 - 10);

        ctx.font = 'bold 18px sans-serif';
        ctx.fillStyle = '#FEF08A';
        ctx.strokeText('The Bucket Overflowed into an Ocean!', width / 2, height / 2 + 25);
        ctx.fillText('The Bucket Overflowed into an Ocean!', width / 2, height / 2 + 25);
        ctx.restore();
      }

      animationFrameId.current = requestAnimationFrame(loop);
    };

    animationFrameId.current = requestAnimationFrame(loop);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
    };
  }, [finishGame, isVictoryCelebration, TARGET_WATER, triggerShake]);

  // Pointer move handler (mouse or touch drag to move bucket)
  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const width = canvas.width;
    const clampedX = Math.max(bucketRef.current.width * 0.55, Math.min(width - bucketRef.current.width * 0.55, x));
    bucketRef.current.targetX = clampedX;
  };

  const moveBucketButton = (direction: 'left' | 'right') => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const step = 55;
    const width = canvas.width;
    if (direction === 'left') {
      bucketRef.current.targetX = Math.max(bucketRef.current.width * 0.55, bucketRef.current.targetX - step);
    } else {
      bucketRef.current.targetX = Math.min(width - bucketRef.current.width * 0.55, bucketRef.current.targetX + step);
    }
  };

  const toggleSound = () => {
    const next = sound.toggleMute();
    setIsMuted(next);
  };

  const restartGame = () => {
    sound.playClick();
    gameEndedRef.current = false;
    setIsVictoryCelebration(false);
    setScore(0);
    setWaterAmount(0);
    setTimeLeft(INITIAL_TIME);
    setCombo(0);
    waterRef.current = 0;
    scoreRef.current = 0;
    timeLeftRef.current = INITIAL_TIME;
    comboRef.current = 0;
    dropletsRef.current = [];
    particlesRef.current = [];
    floatingTextsRef.current = [];
    if (canvasRef.current) {
      bucketRef.current.x = canvasRef.current.width / 2;
      bucketRef.current.targetX = canvasRef.current.width / 2;
    }
  };

  const fillPercentage = Math.min(100, Math.floor((waterAmount / TARGET_WATER) * 100));

  return (
    <div
      ref={containerRef}
      className="relative w-full max-w-4xl mx-auto flex flex-col items-center select-none"
    >
      {/* Top Game Bar */}
      <div className="w-full bg-white border-4 border-black rounded-3xl p-4 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] mb-3 flex flex-wrap items-center justify-between gap-3">
        {/* Left: Back & Proverb Title */}
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
              <span>🪣</span> ചെറിയ തുള്ളി പെരുവെള്ളം
            </h2>
            <p className="text-xs font-bold text-gray-600">
              Cheriya Thulli Peruvellam
            </p>
          </div>
        </div>

        {/* Right Stats: Bucket Water Meter, Timer, Score, Sound */}
        <div className="flex items-center gap-3 ml-auto">
          {/* Water Fill Meter */}
          <div className="flex flex-col items-center bg-[#E0F2FE] border-2 border-black px-3 py-1 rounded-xl shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] min-w-[110px]">
            <div className="flex items-center gap-1 text-[10px] uppercase font-black text-[#0369A1]">
              <Droplets className="w-3 h-3" />
              <span>BUCKET</span>
            </div>
            <div className="w-full bg-white border border-black rounded-full h-3 overflow-hidden mt-0.5">
              <div
                className="h-full bg-[#0284C7] transition-all duration-150"
                style={{ width: `${fillPercentage}%` }}
              />
            </div>
            <span className="text-[11px] font-black text-[#0369A1] mt-0.5">
              {waterAmount}/{TARGET_WATER} ml ({fillPercentage}%)
            </span>
          </div>

          {/* Timer */}
          <div className={`flex flex-col items-center border-2 border-black px-3 py-1 rounded-xl min-w-[70px] shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] ${
            timeLeft <= 10 ? 'bg-[#FF6B6B] text-white animate-pulse' : 'bg-[#FFD93D] text-black'
          }`}>
            <div className="flex items-center gap-1 text-[10px] uppercase font-black">
              <Clock className="w-3 h-3" />
              <span>TIME</span>
            </div>
            <span className="text-lg font-black">{timeLeft}s</span>
          </div>

          {/* Score */}
          <div className="flex flex-col items-center bg-[#4ECDC4] border-2 border-black px-4 py-1 rounded-xl min-w-[90px] shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
            <div className="flex items-center gap-1 text-[10px] uppercase font-black text-white">
              <Award className="w-3 h-3" />
              <span>SCORE</span>
            </div>
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
            id="restart-peruvellam-btn"
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
        onPointerMove={handlePointerMove}
        className={`relative w-full overflow-hidden border-4 border-black rounded-3xl shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] bg-slate-900 cursor-ew-resize select-none touch-none ${
          shake ? 'animate-arcade-shake' : ''
        }`}
      >
        <canvas ref={canvasRef} className="block w-full h-[380px] md:h-[420px]" />

        {/* Floating Combo Badge */}
        {combo > 1 && (
          <div className="absolute top-4 left-4 bg-[#FFD93D] border-3 border-black px-3 py-1 rounded-full font-black text-sm text-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] flex items-center gap-1 animate-pulse">
            <Zap className="w-4 h-4 text-black fill-black" />
            <span>{combo}X Flood Combo!</span>
          </div>
        )}

        {/* Drop Types Legend Bar */}
        <div className="absolute top-4 right-4 hidden sm:flex items-center gap-2 bg-black/60 backdrop-blur-xs border border-white/20 px-3 py-1 rounded-full text-[11px] text-white font-semibold">
          <span>💧 +10ml</span>
          <span>💦 +25ml</span>
          <span className="text-[#FACC15]">✨ +50ml</span>
          <span className="text-red-400">🟤 Mud: -20ml</span>
        </div>

        {/* Instructions Overlay Hint */}
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-black/80 text-white text-xs px-4 py-1.5 rounded-full font-bold tracking-wide pointer-events-none flex items-center gap-1.5">
          <Droplets className="w-3.5 h-3.5 text-[#38BDF8]" />
          <span>Move bucket left & right to catch drops! Avoid mud!</span>
        </div>
      </div>

      {/* Mobile & Keyboard Touch Action Buttons */}
      <div className="w-full mt-3 flex items-center justify-between gap-3">
        <button
          id="move-bucket-left-btn"
          onClick={() => moveBucketButton('left')}
          className="flex-1 py-3.5 bg-[#38BDF8] hover:bg-[#0284C7] active:translate-y-1 active:shadow-none border-4 border-black rounded-2xl font-black text-lg text-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center gap-2 cursor-pointer transition-transform"
        >
          <span>◀</span>
          <span>LEAN LEFT</span>
        </button>

        <button
          id="move-bucket-right-btn"
          onClick={() => moveBucketButton('right')}
          className="flex-1 py-3.5 bg-[#38BDF8] hover:bg-[#0284C7] active:translate-y-1 active:shadow-none border-4 border-black rounded-2xl font-black text-lg text-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center gap-2 cursor-pointer transition-transform"
        >
          <span>LEAN RIGHT</span>
          <span>▶</span>
        </button>
      </div>
    </div>
  );
};
