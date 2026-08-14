import BANK from './data/questions.json';
import { icons } from './icons/index.js';

export const GEMINI_API_KEY = "AQ.Ab8RN6IB_6U4QMMkAf7W_tFyngxZv3X12jImgPfSGYpmMFp-cQ";

export const haptic = (intensity = 'light') => {
  if (!navigator.vibrate) return;
  try {
    if (intensity === 'light') navigator.vibrate(10);
    if (intensity === 'medium') navigator.vibrate(30);
    if (intensity === 'heavy') navigator.vibrate([50, 40, 50]);
  } catch (e) {}
};

export const THEMES = {
  Chill: { base:"#050505", accent:"#00F0FF", label:"Chill", icon: icons.chill }, 
  Spicy: { base:"#050505", accent:"#FFB800", label:"Spicy", icon: icons.spicy }, 
  Hardcore: { base:"#050505", accent:"#FF003C", label:"Hardcore", icon: icons.hardcore } 
};

export const JOKERS = {
  SHIELD: { name: "Bouclier", icon: icons.shield, desc: "Immunité totale face aux sanctions." },
  MIRROR: { name: "Miroir", icon: icons.mirror, desc: "Renvoyez l'affront à l'expéditeur." },
  DOUBLE: { name: "Double", icon: icons.double, desc: "Quitte ou double sur la sentence." },
  SHOT: { name: "Cul Sec", icon: icons.shot, desc: "Condamnez une cible de votre choix." },
  THIEF: { name: "Voleur", icon: icons.thief, desc: "Dérobez furtivement un privilège." }
};

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
