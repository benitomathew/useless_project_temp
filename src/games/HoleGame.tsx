import React, { useEffect, useRef, useState, useCallback } from 'react';
import { sound } from '../utils/audio';
import { GameResult } from '../types';
import { GAMES_DATA } from '../data/gamesData';
import { RotateCcw, Volume2, VolumeX, ArrowLeft, Shovel, AlertTriangle } from 'lucide-react';
import confetti from 'canvas-confetti';

interface HoleGameProps {
  onGameOver: (result: GameResult) => void;
  onExit: () => void;
}

export type HumanType =
  | 'ammavan'
  | 'ammayi'
  | 'politician'
  | 'student'
  | 'tea_maker'
  | 'fish_seller'
  | 'trendsetter'
  | 'auto_driver'
  | 'police_chettan';

export type CharacterType = HumanType;

interface Hole {
  id: number;
  x: number;
  y: number;
  radius: number;
  dugAt: number;
  isFilled: boolean;
  trappedNpcName?: string;
  trappedCharType?: CharacterType;
  trappedIsHuman?: boolean;
}

interface NPC {
  id: number;
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  speed: number;
  name: string;
  emoji: string;
  color: string;
  isHuman: boolean;
  charType: CharacterType;
  facing: 'left' | 'right';
  isTrapped: boolean;
  trapTimer: number;
  walkCycle: number;
}

// Crisp Vector Drawing for Each Funny Human Character
function drawHumanSprite(ctx: CanvasRenderingContext2D, type: HumanType, walkCycle: number) {
  if (type === 'ammavan') {
    // === നാട്ടുകൂട്ടം അമ്മാവൻ (Elder with Folded Mundu & Black Umbrella) ===
    const legSwing = Math.sin(walkCycle) * 6;
    const armSwing = Math.cos(walkCycle) * 6;

    // Bare legs with chappals
    ctx.fillStyle = '#D97706';
    ctx.fillRect(-6, 8, 4, 12 + legSwing * 0.3);
    ctx.fillRect(2, 8, 4, 12 - legSwing * 0.3);
    // Black flip-flop sandals
    ctx.fillStyle = '#0F172A';
    ctx.fillRect(-8, 20 + legSwing * 0.3, 7, 3);
    ctx.fillRect(1, 20 - legSwing * 0.3, 7, 3);

    // Folded Mundu (കൈലി/മുണ്ട് മടക്കിക്കുത്തിയത്)
    ctx.fillStyle = '#FEF08A';
    ctx.strokeStyle = '#0F172A';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(-9, 0, 18, 10, 2);
    ctx.fill();
    ctx.stroke();
    // Kasavu gold border on mundu hem
    ctx.fillStyle = '#CA8A04';
    ctx.fillRect(-9, 8, 18, 2);

    // Yellow Half-sleeve Shirt
    ctx.fillStyle = '#FDE047';
    ctx.beginPath();
    ctx.roundRect(-10, -14, 20, 15, 3);
    ctx.fill();
    ctx.stroke();
    // Collar
    ctx.fillStyle = '#EAB308';
    ctx.beginPath();
    ctx.moveTo(-4, -14); ctx.lineTo(0, -9); ctx.lineTo(4, -14);
    ctx.fill();

    // Black Umbrella in hand
    ctx.save();
    ctx.translate(8 + armSwing * 0.3, -4);
    ctx.rotate(0.35 + armSwing * 0.05);
    ctx.fillStyle = '#0F172A';
    ctx.beginPath();
    ctx.moveTo(-2, -18); ctx.lineTo(4, -18); ctx.lineTo(2, 10); ctx.lineTo(-1, 10);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#94A3B8';
    ctx.fillRect(0, -22, 2, 4);
    ctx.strokeStyle = '#78350F';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(4, 13, 4, Math.PI, 0, false);
    ctx.stroke();
    ctx.restore();

    // Head
    ctx.fillStyle = '#FDBA74';
    ctx.strokeStyle = '#0F172A';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, -21, 8.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Bald pate with side fringe gray hair
    ctx.fillStyle = '#64748B';
    ctx.beginPath();
    ctx.arc(-7, -21, 3.5, 0, Math.PI * 2);
    ctx.arc(7, -21, 3.5, 0, Math.PI * 2);
    ctx.fill();

    // Big Kerala mustache (കൊമ്പൻ മീശ)
    ctx.fillStyle = '#0F172A';
    ctx.beginPath();
    ctx.moveTo(-7, -18);
    ctx.quadraticCurveTo(0, -15, 7, -18);
    ctx.quadraticCurveTo(5, -20, 0, -18);
    ctx.quadraticCurveTo(-5, -20, -7, -18);
    ctx.fill();

    // Eyes & Eyebrows
    ctx.fillRect(-4, -23, 2, 2.5);
    ctx.fillRect(2, -23, 2, 2.5);
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(-5, -25); ctx.lineTo(-2, -24);
    ctx.moveTo(2, -24); ctx.lineTo(5, -25);
    ctx.stroke();
  } else if (type === 'ammayi') {
    // === വാട്സാപ്പ് അമ്മായി (WhatsApp Ammayi with Saree & Smartphone) ===
    const legSwing = Math.sin(walkCycle) * 5;

    // Saree lower draping (swaying pleats)
    ctx.fillStyle = '#DB2777';
    ctx.strokeStyle = '#0F172A';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-8, 0);
    ctx.lineTo(8, 0);
    ctx.lineTo(10 + legSwing * 0.3, 20);
    ctx.lineTo(-10 + legSwing * 0.3, 20);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    // Gold zari border
    ctx.fillStyle = '#FACC15';
    ctx.fillRect(-10 + legSwing * 0.3, 17, 20, 3);

    // Blouse and saree pallu
    ctx.fillStyle = '#BE185D';
    ctx.beginPath();
    ctx.roundRect(-9, -13, 18, 14, 3);
    ctx.fill();
    ctx.stroke();

    // Gold necklace
    ctx.strokeStyle = '#FACC15';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(0, -13, 4, 0, Math.PI);
    ctx.stroke();

    // Head tilted down toward phone
    ctx.fillStyle = '#FDBA74';
    ctx.strokeStyle = '#0F172A';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, -19, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Hair bun on back with jasmine flowers (മുല്ലപ്പൂവ്)
    ctx.fillStyle = '#0F172A';
    ctx.beginPath();
    ctx.arc(-8, -21, 4.5, 0, Math.PI * 2);
    ctx.fill();
    // Jasmine garland
    ctx.strokeStyle = '#FEF08A';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(-8, -21, 6, 0.8 * Math.PI, 1.8 * Math.PI);
    ctx.stroke();

    // Bindi & Glasses
    ctx.fillStyle = '#DC2626';
    ctx.beginPath();
    ctx.arc(1, -21, 1.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 1.2;
    ctx.strokeRect(-4, -19, 3.5, 3);
    ctx.strokeRect(1, -19, 3.5, 3);

    // Hands holding smartphone out in front
    ctx.fillStyle = '#10B981';
    ctx.strokeStyle = '#0F172A';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(5, -12, 7, 11, 1.5);
    ctx.fill();
    ctx.stroke();
    // Glowing screen with green chat dot
    ctx.fillStyle = '#DCFCE7';
    ctx.fillRect(6, -10, 5, 7);
    ctx.fillStyle = '#22C55E';
    ctx.beginPath();
    ctx.arc(8.5, -6.5, 1.8, 0, Math.PI * 2);
    ctx.fill();
  } else if (type === 'politician') {
    // === പഞ്ചായത്ത് മെമ്പർ (Panchayat Member with Shawl & Files) ===
    const legSwing = Math.sin(walkCycle) * 6;
    const waveArm = Math.sin(walkCycle * 2) * 5;

    // White Mundu down to feet
    ctx.fillStyle = '#FFFFFF';
    ctx.strokeStyle = '#0F172A';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-8, 2);
    ctx.lineTo(8, 2);
    ctx.lineTo(9 + legSwing * 0.3, 21);
    ctx.lineTo(-9 + legSwing * 0.3, 21);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    // Kasavu gold border
    ctx.fillStyle = '#EAB308';
    ctx.fillRect(-9 + legSwing * 0.3, 18, 18, 3);

    // White Kurta / Jubba
    ctx.fillStyle = '#F8FAFC';
    ctx.beginPath();
    ctx.roundRect(-10, -14, 20, 17, 3);
    ctx.fill();
    ctx.stroke();

    // Red Khadi Silk Angavastram / Shawl draped over left shoulder
    ctx.fillStyle = '#DC2626';
    ctx.strokeStyle = '#0F172A';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(-10, -14);
    ctx.lineTo(-5, -14);
    ctx.lineTo(-2, 8);
    ctx.lineTo(-8, 8);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Brown Govt File under left arm
    ctx.fillStyle = '#B45309';
    ctx.strokeStyle = '#0F172A';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(-12, -7, 7, 10);
    ctx.fillRect(-12, -7, 7, 10);
    // White file ribbons
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(-12, -3, 7, 1.5);

    // Right arm raised waving to voters
    ctx.fillStyle = '#FDBA74';
    ctx.strokeStyle = '#0F172A';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(9, -10);
    ctx.lineTo(15, -18 + waveArm);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(16, -20 + waveArm, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Head
    ctx.fillStyle = '#FDBA74';
    ctx.beginPath();
    ctx.arc(0, -21, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Neat hair with silver streaks
    ctx.fillStyle = '#334155';
    ctx.beginPath();
    ctx.arc(0, -24, 7.5, Math.PI, 0);
    ctx.fill();

    // Glasses & Broad political grin
    ctx.strokeStyle = '#0F172A';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(-5, -23, 4, 3);
    ctx.strokeRect(1, -23, 4, 3);
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(0, -17, 3.5, 0, Math.PI);
    ctx.fill();
    ctx.stroke();
  } else if (type === 'student') {
    // === ട്യൂഷൻ പയ്യൻ (Student with Heavy Backpack) ===
    const legSwing = Math.sin(walkCycle) * 8;

    // Blue school shorts & running legs
    ctx.fillStyle = '#1E3A8A';
    ctx.fillRect(-7, 2, 6, 8);
    ctx.fillRect(1, 2, 6, 8);
    ctx.fillStyle = '#FDBA74';
    ctx.fillRect(-6 - legSwing * 0.4, 10, 4, 8);
    ctx.fillRect(2 + legSwing * 0.4, 10, 4, 8);
    // Shoes
    ctx.fillStyle = '#0F172A';
    ctx.fillRect(-8 - legSwing * 0.4, 18, 6, 3);
    ctx.fillRect(2 + legSwing * 0.4, 18, 6, 3);

    // GIANT School Backpack on back
    ctx.fillStyle = '#F97316';
    ctx.strokeStyle = '#0F172A';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(-18, -17, 12, 19, 4);
    ctx.fill();
    ctx.stroke();
    // Pocket & water bottle
    ctx.fillStyle = '#0284C7';
    ctx.fillRect(-17, -10, 10, 8);
    ctx.fillStyle = '#38BDF8';
    ctx.fillRect(-16, -19, 3, 5);

    // Sky-blue school shirt
    ctx.fillStyle = '#BAE6FD';
    ctx.beginPath();
    ctx.roundRect(-8, -13, 16, 15, 3);
    ctx.fill();
    ctx.stroke();

    // Head tilted forward in hurry
    ctx.fillStyle = '#FDBA74';
    ctx.beginPath();
    ctx.arc(2, -20, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Messy hair
    ctx.fillStyle = '#0F172A';
    ctx.beginPath();
    ctx.arc(2, -24, 7.5, Math.PI, 0);
    ctx.fill();

    // Round glasses & panting mouth
    ctx.strokeStyle = '#0F172A';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(-0.5, -20, 2.5, 0, Math.PI * 2);
    ctx.arc(5, -20, 2.5, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = '#DC2626';
    ctx.beginPath();
    ctx.ellipse(2, -15, 2, 1.5, 0, 0, Math.PI * 2);
    ctx.fill();

    // Flying sweat drop!
    ctx.fillStyle = '#38BDF8';
    ctx.beginPath();
    ctx.arc(9, -23, 2, 0, Math.PI * 2);
    ctx.fill();
  } else if (type === 'tea_maker') {
    // === ചായക്കട ശാന്തേട്ടൻ (Teashop Shantettan with Glass Chai & Towel) ===
    const legSwing = Math.sin(walkCycle) * 6;

    // Checked Lungi folded above knees
    ctx.fillStyle = '#DC2626';
    ctx.strokeStyle = '#0F172A';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(-9, 0, 18, 10, 2);
    ctx.fill();
    ctx.stroke();
    // Checks pattern
    ctx.strokeStyle = '#2563EB';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(-9, 4); ctx.lineTo(9, 4);
    ctx.moveTo(-3, 0); ctx.lineTo(-3, 10);
    ctx.moveTo(3, 0); ctx.lineTo(3, 10);
    ctx.stroke();

    // Legs & slippers
    ctx.fillStyle = '#EA580C';
    ctx.fillRect(-6, 10, 4, 9 + legSwing * 0.3);
    ctx.fillRect(2, 10, 4, 9 - legSwing * 0.3);

    // White banian (vest)
    ctx.fillStyle = '#F8FAFC';
    ctx.strokeStyle = '#0F172A';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(-9, -14, 18, 15, 3);
    ctx.fill();
    ctx.stroke();

    // Red & White Striped Thorthu towel draped over left shoulder
    ctx.fillStyle = '#EF4444';
    ctx.fillRect(-10, -14, 5, 18);
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(-10, -11, 5, 2);
    ctx.fillRect(-10, -6, 5, 2);
    ctx.fillRect(-10, -1, 5, 2);

    // Glass Tumbler with Meter-Chai in right hand
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    ctx.strokeStyle = '#0F172A';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(8, -8, 6, 9);
    // Caramel tea
    ctx.fillStyle = '#78350F';
    ctx.fillRect(8.5, -4, 5, 5);
    // Frothy top foam
    ctx.fillStyle = '#FEF3C7';
    ctx.fillRect(8.5, -6, 5, 2);
    // Steam wisps
    ctx.strokeStyle = 'rgba(255,255,255,0.7)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(10, -9); ctx.quadraticCurveTo(8, -12, 10, -14);
    ctx.moveTo(12, -9); ctx.quadraticCurveTo(14, -12, 12, -14);
    ctx.stroke();

    // Head
    ctx.fillStyle = '#FDBA74';
    ctx.strokeStyle = '#0F172A';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, -21, 8.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Curly black hair
    ctx.fillStyle = '#0F172A';
    ctx.beginPath();
    ctx.arc(-4, -25, 3.5, 0, Math.PI * 2);
    ctx.arc(0, -26, 4, 0, Math.PI * 2);
    ctx.arc(4, -25, 3.5, 0, Math.PI * 2);
    ctx.fill();

    // Mustache & Pencil behind ear
    ctx.fillStyle = '#0F172A';
    ctx.beginPath();
    ctx.moveTo(-6, -18); ctx.quadraticCurveTo(0, -15, 6, -18); ctx.quadraticCurveTo(0, -20, -6, -18);
    ctx.fill();
    ctx.fillStyle = '#FACC15';
    ctx.fillRect(5, -24, 6, 2);
  } else if (type === 'fish_seller') {
    // === മീൻകാരൻ സലിം (Fish Vendor Salim with Woven Head Basket) ===
    const legSwing = Math.sin(walkCycle) * 6;

    // Indigo Lungi tied above knees
    ctx.fillStyle = '#1E40AF';
    ctx.strokeStyle = '#0F172A';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(-9, 0, 18, 10, 2);
    ctx.fill();
    ctx.stroke();

    // Strong legs
    ctx.fillStyle = '#D97706';
    ctx.fillRect(-6, 10, 4, 9 + legSwing * 0.3);
    ctx.fillRect(2, 10, 4, 9 - legSwing * 0.3);

    // Green cotton shirt
    ctx.fillStyle = '#059669';
    ctx.strokeStyle = '#0F172A';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(-9, -14, 18, 15, 3);
    ctx.fill();
    ctx.stroke();

    // Head
    ctx.fillStyle = '#FDBA74';
    ctx.beginPath();
    ctx.arc(0, -20, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Wide open shouting mouth ("മീനേ!")
    ctx.fillStyle = '#7F1D1D';
    ctx.beginPath();
    ctx.ellipse(0, -16, 3, 3, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Wicker Fish Basket balanced on head
    ctx.fillStyle = '#D97706';
    ctx.strokeStyle = '#0F172A';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(0, -28, 13, 5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    // Basket base
    ctx.beginPath();
    ctx.moveTo(-11, -28); ctx.lineTo(-8, -23); ctx.lineTo(8, -23); ctx.lineTo(11, -28);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Silvery-blue fish tails peeking out of basket!
    ctx.fillStyle = '#60A5FA';
    ctx.strokeStyle = '#0F172A';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(-7, -29); ctx.lineTo(-11, -35); ctx.lineTo(-5, -34); ctx.closePath();
    ctx.fill(); ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(5, -29); ctx.lineTo(10, -35); ctx.lineTo(4, -33); ctx.closePath();
    ctx.fill(); ctx.stroke();
  } else if (type === 'trendsetter') {
    // === കവലയിലെ ചുള്ളൻ (Trendsetter with Sunglasses & Floral Shirt) ===
    const legSwing = Math.sin(walkCycle) * 6;

    // Slim black jeans & white sneakers
    ctx.fillStyle = '#0F172A';
    ctx.fillRect(-6, 2, 4, 15 + legSwing * 0.3);
    ctx.fillRect(2, 2, 4, 15 - legSwing * 0.3);
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(-8, 17 + legSwing * 0.3, 7, 4);
    ctx.fillRect(1, 17 - legSwing * 0.3, 7, 4);
    ctx.fillStyle = '#EF4444';
    ctx.fillRect(-7, 18 + legSwing * 0.3, 5, 1.5);
    ctx.fillRect(2, 18 - legSwing * 0.3, 5, 1.5);

    // Bright Tropical Floral Shirt
    ctx.fillStyle = '#10B981';
    ctx.strokeStyle = '#0F172A';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(-9, -14, 18, 17, 3);
    ctx.fill();
    ctx.stroke();
    // Floral dots
    ctx.fillStyle = '#FB923C';
    ctx.beginPath();
    ctx.arc(-4, -8, 2, 0, Math.PI * 2);
    ctx.arc(4, -5, 2, 0, Math.PI * 2);
    ctx.arc(-2, 0, 1.8, 0, Math.PI * 2);
    ctx.fill();

    // Head
    ctx.fillStyle = '#FDBA74';
    ctx.beginPath();
    ctx.arc(0, -21, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Stylish pompadour haircut
    ctx.fillStyle = '#78350F';
    ctx.beginPath();
    ctx.arc(1, -26, 7.5, Math.PI, 0);
    ctx.fill();
    ctx.stroke();

    // Black Aviator Sunglasses
    ctx.fillStyle = '#000000';
    ctx.strokeStyle = '#F59E0B';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.roundRect(-6, -23, 5, 4, 1);
    ctx.roundRect(1, -23, 5, 4, 1);
    ctx.fill();
    ctx.stroke();

    // Pink bubblegum bubble
    ctx.fillStyle = '#F472B6';
    ctx.beginPath();
    ctx.arc(4, -16, 3, 0, Math.PI * 2);
    ctx.fill();
  } else if (type === 'auto_driver') {
    // === ഓട്ടോ ചേട്ടൻ (Auto Rickshaw Driver with Khaki Shirt & Badge) ===
    const legSwing = Math.sin(walkCycle) * 6;
    const armSwing = Math.cos(walkCycle) * 6;

    // Dark blue pants & flip flops
    ctx.fillStyle = '#1E293B';
    ctx.fillRect(-6, 3, 4, 15 + legSwing * 0.3);
    ctx.fillRect(2, 3, 4, 15 - legSwing * 0.3);
    ctx.fillStyle = '#0F172A';
    ctx.fillRect(-8, 18 + legSwing * 0.3, 7, 3);
    ctx.fillRect(1, 18 - legSwing * 0.3, 7, 3);

    // Khaki Uniform Shirt
    ctx.fillStyle = '#D97706';
    ctx.strokeStyle = '#0F172A';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(-9, -14, 18, 17, 3);
    ctx.fill();
    ctx.stroke();

    // Shirt collar
    ctx.fillStyle = '#B45309';
    ctx.beginPath();
    ctx.moveTo(-5, -14); ctx.lineTo(0, -9); ctx.lineTo(5, -14);
    ctx.fill();

    // Yellow Kerala Auto Driver Badge on chest
    ctx.fillStyle = '#FACC15';
    ctx.strokeStyle = '#0F172A';
    ctx.lineWidth = 1;
    ctx.strokeRect(-8, -10, 5, 4);
    ctx.fillRect(-8, -10, 5, 4);

    // Yellow cloth for cleaning auto
    ctx.fillStyle = '#FEF08A';
    ctx.strokeStyle = '#CA8A04';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(8, -6 + armSwing * 0.3);
    ctx.lineTo(13, 2 + armSwing * 0.3);
    ctx.lineTo(9, 6 + armSwing * 0.3);
    ctx.lineTo(6, -2 + armSwing * 0.3);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Head
    ctx.fillStyle = '#FDBA74';
    ctx.strokeStyle = '#0F172A';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, -21, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Dark wavy hair & sideburns
    ctx.fillStyle = '#0F172A';
    ctx.beginPath();
    ctx.arc(0, -25, 7.5, Math.PI, 0);
    ctx.fill();
    ctx.fillRect(-8, -23, 2.5, 4);

    // Iconic thick driver mustache
    ctx.fillStyle = '#0F172A';
    ctx.beginPath();
    ctx.moveTo(-6, -18); ctx.quadraticCurveTo(0, -15, 6, -18); ctx.quadraticCurveTo(0, -20, -6, -18);
    ctx.fill();

    // Focused driver eyes
    ctx.fillRect(-4, -22, 2, 2.5);
    ctx.fillRect(2, -22, 2, 2.5);
  } else {
    // === ട്രാഫിക് പോലീസ് (Kerala Traffic Policeman with Khaki Cap & Whistle) ===
    const legSwing = Math.sin(walkCycle) * 6;

    // Khaki trousers & polished black police shoes
    ctx.fillStyle = '#B45309';
    ctx.fillRect(-6, 3, 4, 15 + legSwing * 0.3);
    ctx.fillRect(2, 3, 4, 15 - legSwing * 0.3);
    ctx.fillStyle = '#0F172A';
    ctx.fillRect(-8, 18 + legSwing * 0.3, 7, 4);
    ctx.fillRect(1, 18 - legSwing * 0.3, 7, 4);

    // Khaki Police Uniform Shirt
    ctx.fillStyle = '#D97706';
    ctx.strokeStyle = '#0F172A';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(-9, -14, 18, 17, 3);
    ctx.fill();
    ctx.stroke();

    // Brown leather Sam Browne cross-belt (diagonal strap across chest)
    ctx.strokeStyle = '#78350F';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(-8, -14);
    ctx.lineTo(8, 2);
    ctx.stroke();
    // Belt waist
    ctx.fillStyle = '#78350F';
    ctx.fillRect(-9, 1, 18, 2.5);
    // Gold buckle
    ctx.fillStyle = '#FACC15';
    ctx.fillRect(-2, 0.5, 4, 3.5);

    // Silver whistle hanging on red lanyard
    ctx.strokeStyle = '#EF4444';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(6, -13); ctx.lineTo(4, -6);
    ctx.stroke();
    ctx.fillStyle = '#E2E8F0';
    ctx.strokeStyle = '#0F172A';
    ctx.lineWidth = 1;
    ctx.strokeRect(3, -6, 3, 5);
    ctx.fillRect(3, -6, 3, 5);

    // Head
    ctx.fillStyle = '#FDBA74';
    ctx.strokeStyle = '#0F172A';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, -21, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Khaki Police Peak Cap with gold badge emblem
    ctx.fillStyle = '#92400E';
    ctx.strokeStyle = '#0F172A';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.ellipse(0, -25, 9, 4, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    // Black visor rim
    ctx.fillStyle = '#0F172A';
    ctx.beginPath();
    ctx.ellipse(2, -24, 8, 2.5, 0.1, 0, Math.PI);
    ctx.fill();
    // Gold emblem
    ctx.fillStyle = '#FACC15';
    ctx.beginPath();
    ctx.arc(0, -27, 2, 0, Math.PI * 2);
    ctx.fill();

    // Stern police mustache
    ctx.fillStyle = '#0F172A';
    ctx.beginPath();
    ctx.moveTo(-6, -18); ctx.quadraticCurveTo(0, -16, 6, -18); ctx.quadraticCurveTo(0, -20, -6, -18);
    ctx.fill();
  }
}

// Draw Trapped Character (100% Humans) Head sticking out of pit with funny props and dizzy swirls
function drawTrappedCharacterHead(ctx: CanvasRenderingContext2D, charType: CharacterType) {
  ctx.save();

  const hType = charType;
  if (hType === 'ammavan') {
      // Ammavan bald head with mustache poking out
      ctx.fillStyle = '#FDBA74';
      ctx.strokeStyle = '#0F172A';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(0, -6, 11, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Side grey hair fringes
      ctx.fillStyle = '#64748B';
      ctx.beginPath();
      ctx.arc(-8, -6, 4, 0, Math.PI * 2);
      ctx.arc(8, -6, 4, 0, Math.PI * 2);
      ctx.fill();

      // Big mustache
      ctx.fillStyle = '#0F172A';
      ctx.beginPath();
      ctx.moveTo(-7, -4); ctx.quadraticCurveTo(0, -1, 7, -4); ctx.quadraticCurveTo(0, -6, -7, -4);
      ctx.fill();

      // Dizzy X eyes
      ctx.strokeStyle = '#0F172A';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(-5, -10); ctx.lineTo(-2, -7); ctx.moveTo(-2, -10); ctx.lineTo(-5, -7);
      ctx.moveTo(2, -10); ctx.lineTo(5, -7); ctx.moveTo(5, -10); ctx.lineTo(2, -7);
      ctx.stroke();

      // Black umbrella stuck beside the pit in dirt
      ctx.fillStyle = '#0F172A';
      ctx.fillRect(-16, -16, 3, 16);
      ctx.strokeStyle = '#78350F';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(-13, -16, 3, Math.PI, 0, false);
      ctx.stroke();
    } else if (hType === 'ammayi') {
      // Ammayi head with saree bun
      ctx.fillStyle = '#FDBA74';
      ctx.strokeStyle = '#0F172A';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(0, -6, 11, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Bun with fallen jasmine flowers
      ctx.fillStyle = '#0F172A';
      ctx.beginPath();
      ctx.arc(-8, -10, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#FEF08A';
      ctx.beginPath();
      ctx.arc(-12, -4, 2.5, 0, Math.PI * 2);
      ctx.arc(10, 4, 2, 0, Math.PI * 2);
      ctx.fill();

      // Crooked glasses
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 1.2;
      ctx.strokeRect(-5, -9, 4, 3);
      ctx.strokeRect(1, -7, 4, 3);

      // Smartphone stuck in mud displaying 📴
      ctx.fillStyle = '#10B981';
      ctx.fillRect(12, -8, 6, 10);
      ctx.fillStyle = '#EF4444';
      ctx.fillRect(13, -6, 4, 6);
    } else if (hType === 'politician') {
      // Politician head with white shawl draped on dirt
      ctx.fillStyle = '#FDBA74';
      ctx.strokeStyle = '#0F172A';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(0, -6, 11, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Glasses askew
      ctx.strokeStyle = '#0F172A';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(-6, -9, 5, 3.5);
      ctx.strokeRect(2, -7, 5, 3.5);

      // White Khadi shawl draped over mud mound
      ctx.fillStyle = '#FFFFFF';
      ctx.strokeStyle = '#DC2626';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.roundRect(-16, 2, 10, 6, 2);
      ctx.fill();
      ctx.stroke();

      // Govt files scattered
      ctx.fillStyle = '#B45309';
      ctx.fillRect(10, 0, 8, 6);
    } else if (hType === 'student') {
      // Student head with giant backpack lying beside
      ctx.fillStyle = '#FDBA74';
      ctx.strokeStyle = '#0F172A';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(0, -6, 11, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Round glasses crooked
      ctx.strokeStyle = '#0F172A';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(-4, -7, 3, 0, Math.PI * 2);
      ctx.arc(4, -5, 3, 0, Math.PI * 2);
      ctx.stroke();

      // Big backpack lying on mud
      ctx.fillStyle = '#F97316';
      ctx.strokeStyle = '#0F172A';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(8, -6, 12, 14, 3);
      ctx.fill();
      ctx.stroke();
    } else if (hType === 'tea_maker') {
      // Teashop owner head with thorthu towel draped on dirt
      ctx.fillStyle = '#FDBA74';
      ctx.strokeStyle = '#0F172A';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(0, -6, 11, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Red-striped thorthu towel over shoulder/rim
      ctx.fillStyle = '#EF4444';
      ctx.fillRect(-16, -2, 8, 12);
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(-16, 2, 8, 2);

      // Overturned tea glass spilled
      ctx.strokeStyle = '#94A3B8';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(10, 2, 8, 5);
      ctx.fillStyle = '#78350F';
      ctx.beginPath();
      ctx.ellipse(14, 8, 5, 2, 0, 0, Math.PI * 2);
      ctx.fill();
    } else if (hType === 'fish_seller') {
      // Fish seller head with flipped basket & cartoon fish
      ctx.fillStyle = '#FDBA74';
      ctx.strokeStyle = '#0F172A';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(0, -6, 11, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Open shocked mouth
      ctx.fillStyle = '#7F1D1D';
      ctx.beginPath();
      ctx.ellipse(0, -1, 3, 4, 0, 0, Math.PI * 2);
      ctx.fill();

      // Flipped fish basket on side
      ctx.fillStyle = '#D97706';
      ctx.strokeStyle = '#0F172A';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(-14, 2, 7, 0, Math.PI);
      ctx.fill();
      ctx.stroke();

      // Cartoon fish flopping on mud
      ctx.fillStyle = '#60A5FA';
      ctx.beginPath();
      ctx.ellipse(13, 3, 5, 2.5, 0.2, 0, Math.PI * 2);
      ctx.fill();
    } else if (hType === 'trendsetter') {
      // Trendsetter head with sunglasses hanging off ear
      ctx.fillStyle = '#FDBA74';
      ctx.strokeStyle = '#0F172A';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(0, -6, 11, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Sunglasses hanging off ear at angle
      ctx.fillStyle = '#000000';
      ctx.save();
      ctx.translate(4, -8);
      ctx.rotate(0.5);
      ctx.fillRect(-5, -2, 10, 4);
      ctx.restore();
    } else if (hType === 'auto_driver') {
      // Auto driver head with yellow cleaning cloth on rim
      ctx.fillStyle = '#FDBA74';
      ctx.strokeStyle = '#0F172A';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(0, -6, 11, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Thick mustache
      ctx.fillStyle = '#0F172A';
      ctx.beginPath();
      ctx.moveTo(-7, -4); ctx.quadraticCurveTo(0, -1, 7, -4); ctx.quadraticCurveTo(0, -6, -7, -4);
      ctx.fill();

      // Dizzy X eyes
      ctx.strokeStyle = '#0F172A';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(-5, -10); ctx.lineTo(-2, -7); ctx.moveTo(-2, -10); ctx.lineTo(-5, -7);
      ctx.moveTo(2, -10); ctx.lineTo(5, -7); ctx.moveTo(5, -10); ctx.lineTo(2, -7);
      ctx.stroke();

      // Yellow wiping cloth fallen on dirt
      ctx.fillStyle = '#FDE047';
      ctx.strokeStyle = '#CA8A04';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.roundRect(-16, 0, 10, 6, 2);
      ctx.fill();
      ctx.stroke();

      // Auto fare meter on the ground
      ctx.fillStyle = '#0F172A';
      ctx.fillRect(8, -6, 11, 8);
      ctx.fillStyle = '#EF4444';
      ctx.fillRect(9.5, -4.5, 8, 5);
    } else {
      // Policeman head with cap askew and whistle on string
      ctx.fillStyle = '#FDBA74';
      ctx.strokeStyle = '#0F172A';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(0, -6, 11, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Crooked police cap
      ctx.fillStyle = '#92400E';
      ctx.strokeStyle = '#0F172A';
      ctx.lineWidth = 1.5;
      ctx.save();
      ctx.translate(2, -14);
      ctx.rotate(0.35);
      ctx.beginPath();
      ctx.ellipse(0, 0, 11, 4.5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#FACC15';
      ctx.beginPath();
      ctx.arc(0, -2, 2.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // Whistle flying with lanyard
      ctx.strokeStyle = '#EF4444';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(-8, -4); ctx.quadraticCurveTo(-14, -8, -15, -1);
      ctx.stroke();
      ctx.fillStyle = '#E2E8F0';
      ctx.fillRect(-17, -3, 5, 4);

      // Dizzy spiral eyes
      ctx.strokeStyle = '#0F172A';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(-4, -8, 2.5, 0, Math.PI * 2);
      ctx.arc(4, -8, 2.5, 0, Math.PI * 2);
      ctx.stroke();
    }

  // Comic Dizzy / Stars symbols above trapped head
  ctx.font = '13px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('💫', -10, -22);
  ctx.fillText('❓', 10, -22);

  ctx.restore();
}

export const HoleGame: React.FC<HoleGameProps> = ({ onGameOver, onExit }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [score, setScore] = useState(0);
  const [wave, setWave] = useState(1);
  const [trappedCount, setTrappedCount] = useState(0);
  const [holesLeft, setHolesLeft] = useState(4);
  const [timeLeft, setTimeLeft] = useState(45);
  const [isMuted, setIsMuted] = useState(sound.isMuted());
  const [selfTrapped, setSelfTrapped] = useState(false);

  // Player State
  const playerRef = useRef({
    x: 200,
    y: 200,
    vx: 0,
    vy: 0,
    speed: 3.5,
    size: 26,
    isFalling: false,
    fallProgress: 0,
    facing: 'down' as 'left' | 'right' | 'up' | 'down',
    walkCycle: 0,
  });

  const holesRef = useRef<Hole[]>([]);
  const npcsRef = useRef<NPC[]>([]);
  const holeIdCounter = useRef(1);
  const npcIdCounter = useRef(1);
  const keysRef = useRef<{ [key: string]: boolean }>({});
  const animationFrameId = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(performance.now());
  const scoreRef = useRef(0);
  scoreRef.current = score;
  const gameEndedRef = useRef(false);
  const trappedCountRef = useRef(0);
  trappedCountRef.current = trappedCount;
  const waveRef = useRef(1);
  waveRef.current = wave;
  const selfTrappedRef = useRef(false);
  selfTrappedRef.current = selfTrapped;

  const gameInfo = GAMES_DATA.find(g => g.id === 'hole')!;

  // Spawn an NPC with a target waypoint (100% Kerala Village Humans)
  const spawnNpc = useCallback((width: number, height: number, waveNum: number) => {
    const humanRoles: Array<{ name: string; emoji: string; color: string; charType: HumanType }> = [
      { name: 'നാട്ടുകൂട്ടം അമ്മാവൻ', emoji: '👴', color: '#F97316', charType: 'ammavan' },
      { name: 'വാട്സാപ്പ് അമ്മായി', emoji: '🧕', color: '#EC4899', charType: 'ammayi' },
      { name: 'പഞ്ചായത്ത് മെമ്പർ', emoji: '🧑‍💼', color: '#3B82F6', charType: 'politician' },
      { name: 'ട്യൂഷൻ പയ്യൻ', emoji: '👦', color: '#8B5CF6', charType: 'student' },
      { name: 'ചായക്കട ശാന്തേട്ടൻ', emoji: '☕', color: '#D97706', charType: 'tea_maker' },
      { name: 'മീൻകാരൻ സലിം', emoji: '🐟', color: '#0EA5E9', charType: 'fish_seller' },
      { name: 'കവലയിലെ ചുള്ളൻ', emoji: '😎', color: '#10B981', charType: 'trendsetter' },
      { name: 'ഓട്ടോ ചേട്ടൻ', emoji: '🛺', color: '#EAB308', charType: 'auto_driver' },
      { name: 'ട്രാഫിക് പോലീസ്', emoji: '👮', color: '#6366F1', charType: 'police_chettan' },
    ];
    const role = humanRoles[Math.floor(Math.random() * humanRoles.length)];

    // Spawn near borders
    const edge = Math.floor(Math.random() * 4);
    let x = 40;
    let y = 40;
    if (edge === 0) { x = Math.random() * width; y = 30; }
    else if (edge === 1) { x = width - 30; y = Math.random() * height; }
    else if (edge === 2) { x = Math.random() * width; y = height - 30; }
    else { x = 30; y = Math.random() * height; }

    const targetX = 60 + Math.random() * (width - 120);
    const targetY = 60 + Math.random() * (height - 120);
    const initialFacing: 'left' | 'right' = targetX >= x ? 'right' : 'left';

    npcsRef.current.push({
      id: npcIdCounter.current++,
      x,
      y,
      targetX,
      targetY,
      speed: 1.1 + Math.random() * 0.8 + waveNum * 0.25,
      name: role.name,
      emoji: role.emoji,
      color: role.color,
      isHuman: true,
      charType: role.charType,
      facing: initialFacing,
      isTrapped: false,
      trapTimer: 0,
      walkCycle: Math.random() * Math.PI * 2,
    });
  }, []);

  // Dig a hole at current player position
  const digHole = useCallback(() => {
    const p = playerRef.current;
    if (p.isFalling || holesRef.current.filter(h => !h.isFilled).length >= 4) return;

    // Check if already on a hole
    const onExisting = holesRef.current.some(
      h => Math.hypot(h.x - p.x, h.y - p.y) < h.radius * 1.5
    );
    if (onExisting) return;

    sound.playDig();

    holesRef.current.push({
      id: holeIdCounter.current++,
      x: p.x,
      y: p.y,
      radius: 22,
      dugAt: Date.now(),
      isFilled: false,
    });

    setHolesLeft(4 - holesRef.current.filter(h => !h.isFilled).length);
  }, []);

  // Finish Game
  const finishGame = useCallback((won: boolean, reason: 'self-trapped' | 'time-up' | 'won') => {
    if (gameEndedRef.current) return;
    gameEndedRef.current = true;

    if (won) {
      sound.playVictory();
      confetti({ particleCount: 60, spread: 70 });
    } else {
      sound.playSadWahWah();
    }

    const reactionPool = won ? gameInfo.funnyQuotes.win : gameInfo.funnyQuotes.lose;
    const reaction = reactionPool[Math.floor(Math.random() * reactionPool.length)];

    setTimeout(() => {
      onGameOver({
        gameId: 'hole',
        won,
        score: scoreRef.current,
        highScore: scoreRef.current,
        stats: {
          'Trapped Villagers': trappedCountRef.current,
          'Wave': waveRef.current,
        },
        reactionMalayalam: reaction,
        reactionEnglish: reason === 'self-trapped'
          ? 'You literally fell into the exact hole you dug yourself! Classic proverb moment!'
          : won
          ? 'Genius trap positioning! All wandering villagers tumbled in, while you stayed safe!'
          : 'Time ran out before you could trap enough wandering villagers!'
      });
    }, reason === 'self-trapped' ? 800 : 400);
  }, [gameInfo, onGameOver]);

  // Handle Controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keysRef.current[e.code] = true;
      if (e.code === 'Space' || e.code === 'KeyE') {
        e.preventDefault();
        digHole();
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      keysRef.current[e.code] = false;
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [digHole]);

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
      finishGame(scoreRef.current >= 400, 'time-up');
    }
  }, [timeLeft, finishGame]);

  // Main Canvas Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = (canvas.width = canvas.parentElement?.clientWidth || 700);
    let height = (canvas.height = 420);

    // Initial NPCs
    npcsRef.current = [];
    for (let i = 0; i < 4; i++) {
      spawnNpc(width, height, 1);
    }

    const handleResize = () => {
      if (!canvas || !canvas.parentElement) return;
      width = canvas.width = canvas.parentElement.clientWidth;
      height = canvas.height = 420;
    };
    window.addEventListener('resize', handleResize);

    const loop = (timestamp: number) => {
      const dt = Math.min((timestamp - lastTimeRef.current) / 16.66, 2.5);
      lastTimeRef.current = timestamp;

      ctx.clearRect(0, 0, width, height);

      // 1. Draw Ground: Clay / dirt yard with cobblestone border
      ctx.fillStyle = '#E6CCA0'; // Warm clay
      ctx.fillRect(0, 0, width, height);

      // Decorative yard tiles / path lines
      ctx.strokeStyle = '#D4B37F';
      ctx.lineWidth = 1.5;
      for (let x = 40; x < width; x += 60) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 40; y < height; y += 60) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // 2. Draw Holes
      const holes = holesRef.current;
      holes.forEach(hole => {
        ctx.save();
        ctx.translate(hole.x, hole.y);

        if (hole.isFilled) {
          // Filled hole with dirt mound
          ctx.fillStyle = '#78350F';
          ctx.beginPath();
          ctx.ellipse(0, 2, hole.radius + 2, (hole.radius + 2) * 0.7, 0, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = '#92400E';
          ctx.beginPath();
          ctx.ellipse(0, 0, hole.radius, hole.radius * 0.65, 0, 0, Math.PI * 2);
          ctx.fill();

          // Specks of dug dirt
          ctx.fillStyle = '#B45309';
          ctx.beginPath();
          ctx.arc(-8, 4, 2, 0, Math.PI * 2);
          ctx.arc(6, 2, 2.5, 0, Math.PI * 2);
          ctx.arc(-2, -3, 1.8, 0, Math.PI * 2);
          ctx.fill();

          // Draw the trapped character's head sticking out with dizzy swirls
          drawTrappedCharacterHead(ctx, hole.trappedCharType || 'ammavan');

          // Trapped pill banner
          if (hole.trappedNpcName) {
            ctx.save();
            ctx.font = 'bold 10px "Noto Sans Malayalam", sans-serif';
            const trappedText = `${hole.trappedNpcName} കുടുങ്ങി!`;
            const tWidth = ctx.measureText(trappedText).width;
            const pillW = tWidth + 14;
            const pillH = 18;

            ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
            ctx.strokeStyle = '#000000';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.roundRect(-pillW / 2, -hole.radius - 28, pillW, pillH, 9);
            ctx.fill();
            ctx.stroke();

            ctx.fillStyle = '#DC2626';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(trappedText, 0, -hole.radius - 19);
            ctx.restore();
          }
        } else {
          // Open dangerous pit
          // Outer Rim
          ctx.fillStyle = '#78350F';
          ctx.beginPath();
          ctx.ellipse(0, 0, hole.radius + 4, (hole.radius + 4) * 0.7, 0, 0, Math.PI * 2);
          ctx.fill();

          // Black deep hole
          ctx.fillStyle = '#1C1917';
          ctx.beginPath();
          ctx.ellipse(0, 0, hole.radius, hole.radius * 0.65, 0, 0, Math.PI * 2);
          ctx.fill();

          // Shovel marks on edge
          ctx.strokeStyle = '#B45309';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(0, 0, hole.radius, 0.2, 1.2);
          ctx.stroke();

          // Danger Warning Sign above hole
          ctx.font = '13px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('⚠️', 0, -hole.radius - 4);
        }
        ctx.restore();
      });

      // 3. Update & Draw NPCs
      const npcs = npcsRef.current;
      // Maintain NPC count
      if (npcs.filter(n => !n.isTrapped).length < 3 + wave) {
        spawnNpc(width, height, wave);
      }

      for (let i = npcs.length - 1; i >= 0; i--) {
        const npc = npcs[i];

        if (npc.isTrapped) {
          npc.trapTimer += dt;
          if (npc.trapTimer > 60) {
            npcs.splice(i, 1);
          }
          continue;
        }

        // Move towards waypoint
        const dx = npc.targetX - npc.x;
        const dy = npc.targetY - npc.y;
        const dist = Math.hypot(dx, dy);

        if (dist < 15) {
          // Pick new waypoint
          npc.targetX = 60 + Math.random() * (width - 120);
          npc.targetY = 60 + Math.random() * (height - 120);
        } else {
          npc.x += (dx / dist) * npc.speed * dt;
          npc.y += (dy / dist) * npc.speed * dt;
          npc.walkCycle += 0.22 * dt;
          npc.facing = dx >= 0 ? 'right' : 'left';
        }

        // Check if NPC stepped into any open hole
        for (const hole of holes) {
          if (!hole.isFilled) {
            const dHole = Math.hypot(npc.x - hole.x, npc.y - hole.y);
            if (dHole < hole.radius * 0.85) {
              // CHARACTER FELL IN!
              npc.isTrapped = true;
              hole.isFilled = true;
              hole.trappedNpcName = npc.name;
              hole.trappedCharType = npc.charType;
              hole.trappedIsHuman = true;

              sound.playTrapFall();
              trappedCountRef.current += 1;
              setTrappedCount(trappedCountRef.current);
              setScore(s => s + 100);
              setHolesLeft(4 - holes.filter(h => !h.isFilled).length);

              // Check wave progression
              if (trappedCountRef.current % 4 === 0) {
                waveRef.current += 1;
                setWave(waveRef.current);
              }
              break;
            }
          }
        }

        // Draw Human Villager NPC
        ctx.save();
        ctx.translate(npc.x, npc.y);

        // Ground shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.22)';
        ctx.beginPath();
        ctx.ellipse(0, 15, 16, 6, 0, 0, Math.PI * 2);
        ctx.fill();

        // Draw Sprite with direction flip and walk bounce
        ctx.save();
        const bob = Math.sin(npc.walkCycle) * 2.5;
        ctx.translate(0, bob);
        if (npc.facing === 'left') {
          ctx.scale(-1, 1);
        }
        drawHumanSprite(ctx, npc.charType, npc.walkCycle);
        ctx.restore();

        // High-Contrast Name Pill Tag (Always un-flipped and clearly readable)
        ctx.save();
        ctx.font = 'bold 11px "Noto Sans Malayalam", sans-serif';
        const nameText = `${npc.emoji} ${npc.name}`;
        const tWidth = ctx.measureText(nameText).width;
        const pillW = tWidth + 16;
        const pillH = 19;

        // White badge pill with crisp black border
        ctx.fillStyle = 'rgba(255, 255, 255, 0.96)';
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(-pillW / 2, -38, pillW, pillH, 9.5);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#0F172A';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(nameText, 0, -28.5);
        ctx.restore();

        ctx.restore();
      }

      // 4. Update & Draw Player
      const p = playerRef.current;

      if (p.isFalling) {
        // Dramatic Fall Animation into Own Hole
        p.fallProgress += 0.04 * dt;
        const scale = Math.max(0.05, 1 - p.fallProgress);

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.scale(scale, scale);
        ctx.rotate(p.fallProgress * Math.PI * 4);

        // Dizzy face
        ctx.font = '32px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('😱', 0, 0);
        ctx.restore();

        if (p.fallProgress >= 1 && !selfTrappedRef.current && !gameEndedRef.current) {
          selfTrappedRef.current = true;
          setSelfTrapped(true);
          finishGame(false, 'self-trapped');
        }
      } else {
        // Movement input
        let mx = 0;
        let my = 0;
        if (keysRef.current['ArrowLeft'] || keysRef.current['KeyA']) mx -= 1;
        if (keysRef.current['ArrowRight'] || keysRef.current['KeyD']) mx += 1;
        if (keysRef.current['ArrowUp'] || keysRef.current['KeyW']) my -= 1;
        if (keysRef.current['ArrowDown'] || keysRef.current['KeyS']) my += 1;

        if (mx !== 0 && my !== 0) {
          mx *= 0.7071;
          my *= 0.7071;
        }

        if (mx !== 0 || my !== 0) {
          p.x += mx * p.speed * dt;
          p.y += my * p.speed * dt;
          p.walkCycle += 0.25 * dt;

          if (Math.abs(mx) > Math.abs(my)) {
            p.facing = mx > 0 ? 'right' : 'left';
          } else {
            p.facing = my > 0 ? 'down' : 'up';
          }
        }

        // Clamp inside bounds
        p.x = Math.max(25, Math.min(width - 25, p.x));
        p.y = Math.max(25, Math.min(height - 25, p.y));

        // CRITICAL CHECK: Did player step into ANY of their own open holes?
        for (const hole of holes) {
          if (!hole.isFilled) {
            // Give 800ms grace period after digging so player isn't instantly trapped while standing
            const timeSinceDug = Date.now() - hole.dugAt;
            const dist = Math.hypot(p.x - hole.x, p.y - hole.y);

            if (dist < hole.radius * 0.75 && timeSinceDug > 800) {
              // PLAYER FELL INTO THEIR OWN HOLE!
              // "താൻ കുഴിച്ച കുഴിയിൽ താൻ തന്നെ വീഴും"
              p.isFalling = true;
              sound.playTrapFall();
              break;
            }
          }
        }

        // Draw Player Character (Cheeky digger with shovel)
        ctx.save();
        ctx.translate(p.x, p.y);

        // Player shadow
        ctx.fillStyle = 'rgba(0,0,0,0.22)';
        ctx.beginPath();
        ctx.ellipse(0, 12, 16, 6, 0, 0, Math.PI * 2);
        ctx.fill();

        const pBob = Math.sin(p.walkCycle) * 3;
        ctx.translate(0, pBob);

        // Face & Body
        ctx.fillStyle = '#F59E0B'; // Amber shirt
        ctx.strokeStyle = '#2C2416';
        ctx.lineWidth = 2.5;

        // Torso
        ctx.beginPath();
        ctx.roundRect(-12, -4, 24, 18, 5);
        ctx.fill();
        ctx.stroke();

        // Head
        ctx.fillStyle = '#FED7AA'; // Skin
        ctx.beginPath();
        ctx.arc(0, -14, 13, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Hair / Kerala Thorthu Mundu headband
        ctx.fillStyle = '#DC2626';
        ctx.beginPath();
        ctx.ellipse(0, -22, 14, 5, 0, 0, Math.PI * 2);
        ctx.fill();

        // Eyes & smirk
        ctx.fillStyle = '#1F2937';
        if (p.facing === 'left') {
          ctx.beginPath();
          ctx.arc(-5, -14, 2.5, 0, Math.PI * 2);
          ctx.fill();
        } else if (p.facing === 'right') {
          ctx.beginPath();
          ctx.arc(5, -14, 2.5, 0, Math.PI * 2);
          ctx.fill();
        } else {
          ctx.beginPath();
          ctx.arc(-4, -14, 2.5, 0, Math.PI * 2);
          ctx.arc(4, -14, 2.5, 0, Math.PI * 2);
          ctx.fill();
        }

        // Shovel held in hand
        ctx.strokeStyle = '#78350F';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(12, 4);
        ctx.lineTo(20, -12);
        ctx.stroke();

        // Shovel head
        ctx.fillStyle = '#94A3B8';
        ctx.strokeStyle = '#334155';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(16, -18, 10, 8, 2);
        ctx.fill();
        ctx.stroke();

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
  }, [digHole, finishGame, spawnNpc]);

  // Mobile Tap / Joystick Move
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas || playerRef.current.isFalling) return;
    const rect = canvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    // Set player moving towards clicked spot
    const p = playerRef.current;
    const dx = clickX - p.x;
    const dy = clickY - p.y;
    const dist = Math.hypot(dx, dy);

    if (dist > 10) {
      p.x += (dx / dist) * Math.min(dist, 40);
      p.y += (dy / dist) * Math.min(dist, 40);
    }
  };

  const restartGame = () => {
    sound.playClick();
    gameEndedRef.current = false;
    selfTrappedRef.current = false;
    trappedCountRef.current = 0;
    waveRef.current = 1;
    setScore(0);
    setWave(1);
    setTrappedCount(0);
    setHolesLeft(4);
    setTimeLeft(45);
    setSelfTrapped(false);
    holesRef.current = [];
    npcsRef.current = [];
    playerRef.current = {
      x: 200,
      y: 200,
      vx: 0,
      vy: 0,
      speed: 3.5,
      size: 26,
      isFalling: false,
      fallProgress: 0,
      facing: 'down',
      walkCycle: 0,
    };
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full max-w-4xl mx-auto flex flex-col items-center select-none"
    >
      {/* Top Game Bar */}
      <div className="w-full bg-white border-4 border-black rounded-3xl p-4 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] mb-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button
            id="exit-hole-btn"
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
              <span>🕳️</span> താൻ കുഴിച്ച കുഴിയിൽ താൻ തന്നെ വീഴും
            </h2>
            <p className="text-xs font-bold text-gray-600">
              Thaan Kuzhicha Kuzhiyil Thaan Thanne Veezhum
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-3 ml-auto">
          {/* Holes remaining */}
          <div className="flex flex-col items-center bg-[#FFD93D] border-2 border-black px-3 py-1 rounded-xl text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
            <span className="text-[10px] uppercase font-black">HOLES</span>
            <span className="text-base font-black">
              {holesLeft}/4 Left
            </span>
          </div>

          {/* Timer */}
          <div className="flex flex-col items-center bg-white border-2 border-black px-3 py-1 rounded-xl min-w-[65px] shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
            <span className="text-[10px] uppercase font-black text-gray-600">TIME</span>
            <span className="text-lg font-black text-black">{timeLeft}s</span>
          </div>

          {/* Score */}
          <div className="flex flex-col items-center bg-[#4ECDC4] border-2 border-black px-4 py-1 rounded-xl min-w-[85px] text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
            <span className="text-[10px] uppercase font-black">SCORE</span>
            <span className="text-lg font-black">{score}</span>
          </div>

          <button
            id="sound-toggle-hole-btn"
            onClick={() => setIsMuted(sound.toggleMute())}
            aria-label="Toggle sound"
            className="p-2 bg-white hover:bg-gray-100 border-2 border-black rounded-xl cursor-pointer shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
          >
            {isMuted ? <VolumeX className="w-5 h-5 text-[#FF6B6B]" /> : <Volume2 className="w-5 h-5 text-[#4ECDC4]" />}
          </button>

          <button
            id="restart-hole-btn"
            onClick={restartGame}
            aria-label="Restart game"
            className="p-2 bg-white hover:bg-gray-100 border-2 border-black rounded-xl cursor-pointer shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] text-black"
          >
            <RotateCcw className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Warning Banner */}
      <div className="w-full bg-[#FFD93D] border-3 border-black rounded-2xl px-4 py-2 mb-2.5 flex items-center justify-between text-xs font-black text-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-black shrink-0" />
          <span>CAUTION: If you step into your own hole, it's instant GAME OVER!</span>
        </div>
        <span className="hidden sm:inline text-[11px] text-black/80 font-bold">
          WASD / Arrows to Move • SPACE to Dig
        </span>
      </div>

      {/* Main Canvas Stage */}
      <div className="relative w-full overflow-hidden border-4 border-black rounded-3xl shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] bg-[#E6CCA0]">
        <canvas
          ref={canvasRef}
          onClick={handleCanvasClick}
          className="block w-full h-[380px] md:h-[420px] cursor-crosshair"
        />

        {/* Self Trapped Overlay Alert */}
        {selfTrapped && (
          <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center p-4 text-center animate-fade-in">
            <span className="text-6xl mb-2">🕳️😱</span>
            <h3 className="text-2xl md:text-3xl font-black text-[#FFD93D]">
              You Fell Into Your Own Trap!
            </h3>
            <p className="text-white text-sm mt-1 font-semibold font-['Noto_Sans_Malayalam']">
              താൻ കുഴിച്ച കുഴിയിൽ താൻ തന്നെ വീണു!
            </p>
          </div>
        )}
      </div>

      {/* Roaming Characters (100% Kerala Village Folk) */}
      <div className="w-full mt-2.5 bg-white border-3 border-black rounded-2xl px-3 py-2.5 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] flex flex-col gap-1.5">
        <div className="flex flex-wrap items-center justify-between gap-1.5">
          <span className="font-black text-amber-800 flex items-center gap-1.5 uppercase text-[11px] tracking-wide">
            <span>👥</span> Village Folk On The Move (100% Humans):
          </span>
          <div className="flex flex-wrap items-center gap-1.5 font-bold font-['Noto_Sans_Malayalam'] text-[10.5px] text-black">
            <span className="px-2 py-0.5 bg-[#FFF7ED] border border-black rounded-lg">👴 അമ്മാവൻ</span>
            <span className="px-2 py-0.5 bg-[#FDF2F8] border border-black rounded-lg">🧕 വാട്സാപ്പ് അമ്മായി</span>
            <span className="px-2 py-0.5 bg-[#EFF6FF] border border-black rounded-lg">🧑‍💼 പഞ്ചായത്ത് മെമ്പർ</span>
            <span className="px-2 py-0.5 bg-[#F5F3FF] border border-black rounded-lg">👦 ട്യൂഷൻ പയ്യൻ</span>
            <span className="px-2 py-0.5 bg-[#FEF3C7] border border-black rounded-lg">☕ ശാന്തേട്ടൻ</span>
            <span className="px-2 py-0.5 bg-[#F0FDF4] border border-black rounded-lg">🐟 മീൻകാരൻ സലിം</span>
            <span className="px-2 py-0.5 bg-[#ECFDF5] border border-black rounded-lg">😎 കവലയിലെ ചുള്ളൻ</span>
            <span className="px-2 py-0.5 bg-[#FEF9C3] border border-black rounded-lg">🛺 ഓട്ടോ ചേട്ടൻ</span>
            <span className="px-2 py-0.5 bg-[#EEF2FF] border border-black rounded-lg">👮 ട്രാഫിക് പോലീസ്</span>
          </div>
        </div>
      </div>

      {/* Mobile/Quick Action Buttons Bar */}
      <div className="w-full mt-3 flex flex-wrap gap-2 justify-center">
        {/* Dig Hole Action Button */}
        <button
          id="dig-hole-action-btn"
          onClick={digHole}
          disabled={holesLeft <= 0 || playerRef.current.isFalling}
          className="flex-1 min-w-[200px] py-3.5 bg-[#FFD93D] hover:bg-[#ebc428] active:translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed border-4 border-black rounded-2xl font-black text-xl text-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center gap-2 cursor-pointer transition-all"
        >
          <Shovel className="w-6 h-6" />
          <span>DIG HOLE!</span>
        </button>

        {/* Mobile On-Screen D-Pad for Touch Devices */}
        <div className="flex md:hidden items-center gap-1 bg-white border-3 border-black p-1.5 rounded-2xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <button
            onPointerDown={() => { keysRef.current['ArrowLeft'] = true; }}
            onPointerUp={() => { keysRef.current['ArrowLeft'] = false; }}
            className="w-10 h-10 bg-gray-100 hover:bg-gray-200 border-2 border-black rounded-xl font-black text-sm flex items-center justify-center active:bg-gray-300"
          >
            ←
          </button>
          <div className="flex flex-col gap-1">
            <button
              onPointerDown={() => { keysRef.current['ArrowUp'] = true; }}
              onPointerUp={() => { keysRef.current['ArrowUp'] = false; }}
              className="w-10 h-10 bg-gray-100 hover:bg-gray-200 border-2 border-black rounded-xl font-black text-sm flex items-center justify-center active:bg-gray-300"
            >
              ↑
            </button>
            <button
              onPointerDown={() => { keysRef.current['ArrowDown'] = true; }}
              onPointerUp={() => { keysRef.current['ArrowDown'] = false; }}
              className="w-10 h-10 bg-gray-100 hover:bg-gray-200 border-2 border-black rounded-xl font-black text-sm flex items-center justify-center active:bg-gray-300"
            >
              ↓
            </button>
          </div>
          <button
            onPointerDown={() => { keysRef.current['ArrowRight'] = true; }}
            onPointerUp={() => { keysRef.current['ArrowRight'] = false; }}
            className="w-10 h-10 bg-gray-100 hover:bg-gray-200 border-2 border-black rounded-xl font-black text-sm flex items-center justify-center active:bg-gray-300"
          >
            →
          </button>
        </div>
      </div>
    </div>
  );
};
