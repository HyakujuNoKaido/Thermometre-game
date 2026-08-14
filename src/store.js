import BANK from './data/questions.json';
import { icons } from './icons/index.js';

export const GEMINI_API_KEY = "AQ.Ab8RN6IB_6U4QMMkAf7W_tFyngxZv3X12jImgPfSGYpmMFp-cQ"; // À sécuriser côté backend idéalement

// Haptique de luxe
export const haptic = (intensity = 'light') => {
  if (!navigator.vibrate) return;
  try {
    if (intensity === 'light') navigator.vibrate(10);
    if (intensity === 'medium') navigator.vibrate(25);
    if (intensity === 'heavy') navigator.vibrate([40, 30, 40]);
  } catch (e) {}
};

// Accents Couleurs du Speakeasy
export const THEMES = {
  Chill: { base:"#050505", accent:"#00F0FF", label:"CHILL", icon: icons.chill }, // Cyan Glacial
  Spicy: { base:"#050505", accent:"#FFB800", label:"SPICY", icon: icons.spicy }, // Ambre
  Hardcore: { base:"#050505", accent:"#FF003C", label:"HARDCORE", icon: icons.hardcore } // Rouge Sang
};

// Terminologie pure, pas d'émojis
export const JOKERS = {
  SHIELD: { name: "BOUCLIER", icon: icons.shield, desc: "Immunité totale. Aucune gorgée." },
  MIRROR: { name: "MIROIR", icon: icons.mirror, desc: "Renvoyez la sanction à l'expéditeur." },
  DOUBLE: { name: "DOUBLE", icon: icons.double, desc: "Quitte ou double sur vos gorgées." },
  SHOT: { name: "CUL SEC", icon: icons.shot, desc: "Assignez un cul sec immédiat." },
  THIEF: { name: "VOLEUR", icon: icons.thief, desc: "Dérobez le pouvoir d'un adversaire." }
};

export const ROASTS = [
  "{name} réside dans le déni absolu.",
  "La lucidité de {name} est introuvable.",
  "Un décalage total avec la réalité pour {name}."
];

export let QUESTIONS = {
  Chill: [...BANK.Chill],
  Spicy: [...BANK.Spicy],
  Hardcore: [...BANK.Hardcore]
};

export const S = { 
  screen: "HOME", code: null, pid: null, room: null, 
  name: sessionStorage.getItem('thermo_name') || "", 
  joinCode: "", pendingMode: "Chill", voteValue: 50, 
  roomRef: null, pickingShot: false, timerLeft: null, 
  timerInt: null, isLoading: false, animDone: false
};

export const rand = a => a[Math.floor(Math.random() * a.length)];
export const genId = () => Math.random().toString(36).slice(2, 10);
export const genCode = () => Array.from({length: 4}, () => rand([..."ABCDEFGHJKLMNPQRSTUVWXYZ23456789"])).join("");
export const esc = s => (s || "").toString().replace(/[&<>"]/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[m]));
export const playersArr = (room) => Object.entries(room.players || {}).map(([id, p]) => ({id, ...p})); 
export const connectedArr = (room) => playersArr(room).filter(p => p.connected !== false);
