import BANK from './data/questions.json';
import { icons } from './icons/index.js';

// Retours Haptiques
export const haptic = (intensity = 'light') => {
  if (!navigator.vibrate) return;
  if (intensity === 'light') navigator.vibrate(10);
  if (intensity === 'medium') navigator.vibrate(25);
  if (intensity === 'heavy') navigator.vibrate([40, 30, 40]);
};

// Accents Couleurs "La Carte"
export const THEMES = {
  Chill: { base:"#050505", accent:"#00F0FF", label:"CHILL", icon: icons.chill }, // Cyan Glacial
  Spicy: { base:"#050505", accent:"#FFB800", label:"SPICY", icon: icons.spicy }, // Ambre
  Hardcore: { base:"#050505", accent:"#FF003C", label:"HARDCORE", icon: icons.hardcore } // Rouge Sang
};

// ZÉRO EMOJI. Que du texte impactant.
export const JOKERS = {
  SHIELD: { name: "BOUCLIER", icon: icons.shield, desc: "Immunité totale. Aucune gorgée." },
  MIRROR: { name: "MIROIR", icon: icons.mirror, desc: "Renvoyez la sanction à l'expéditeur." },
  DOUBLE: { name: "DOUBLE", icon: icons.double, desc: "Quitte ou double sur vos gorgées." },
  SHOT: { name: "CUL SEC", icon: icons.shot, desc: "Assignez un cul sec immédiat." },
  THIEF: { name: "VOLEUR", icon: icons.thief, desc: "Dérobez le pouvoir d'un adversaire." }
};

export const ROASTS = [
  "{name} vit dans une autre dimension.",
  "Lucidité de {name} : introuvable.",
  "L'art de se voiler la face par {name}."
];

export let QUESTIONS = { Chill: [...BANK.Chill], Spicy: [...BANK.Spicy], Hardcore: [...BANK.Hardcore] };

export const S = { 
  screen: "HOME", code: null, pid: null, room: null, 
  name: "", joinCode: "", pendingMode: "Chill", voteValue: 50, 
  roomRef: null, isLoading: false, animDone: false
};

export const rand = a => a[Math.floor(Math.random() * a.length)];
export const genId = () => Math.random().toString(36).slice(2, 10);
export const genCode = () => Array.from({length: 4}, () => rand([..."ABCDEFGHJKLMNPQRSTUVWXYZ23456789"])).join(""); // ROOM: A8FX
export const esc = s => (s || "").toString().replace(/[&<>"]/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[m]));
export const playersArr = (room) => Object.entries(room.players || {}).map(([id, p]) => ({id, ...p})); 
export const connectedArr = (room) => playersArr(room).filter(p => p.connected !== false);
