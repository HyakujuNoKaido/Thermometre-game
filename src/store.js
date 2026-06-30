import BANK from './data/questions.json';

export const GEMINI_API_KEY = "AQ.Ab8RN6IB_6U4QMMkAf7W_tFyngxZv3X12jImgPfSGYpmMFp-cQ";

export const THEMES = {
  Chill: { base:"#040B16", b1:"#00F0FF", b2:"#0038FF", glow:"rgba(0,240,255,.5)", from:"#67e8f9", to:"#3b82f6", label:"Chill", emoji:"🥶", icon:"❄️" },
  Spicy: { base:"#1A0505", b1:"#FF5C00", b2:"#FF003C", glow:"rgba(255,92,0,.5)", from:"#facc15", to:"#f97316", label:"Spicy", emoji:"🥵", icon:"🔥" },
  Hardcore: { base:"#0A0012", b1:"#9D00FF", b2:"#FF003C", glow:"rgba(157,0,255,.5)", from:"#e879f9", to:"#dc2626", label:"Hardcore", emoji:"😈", icon:"💀" }
};

export const JOKERS = {
  SHIELD: { name: "Bouclier", icon: "🛡️", desc: "Annule tes gorgées." },
  MIRROR: { name: "Miroir", icon: "🔁", desc: "Transfère tes gorgées." },
  DOUBLE: { name: "Double ou rien", icon: "✖️2", desc: "Mise tout (x2)." },
  SHOT: { name: "Cul sec", icon: "🥃", desc: "Distribue un cul sec." },
  THIEF: { name: "Voleur", icon: "🥷", desc: "Échange ton joker secrètement." }
};

export const ROASTS = [
  "{name}, c'est vivre dans un univers parallèle. Santé !",
  "L'intuition sociale de {name} est proche d'une petite cuillère."
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
export const vibrate = p => { if (navigator.vibrate) try { navigator.vibrate(p) } catch(e){} };
