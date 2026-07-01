import BANK from './data/questions.json';

export const GEMINI_API_KEY = "AQ.Ab8RN6IB_6U4QMMkAf7W_tFyngxZv3X12jImgPfSGYpmMFp-cQ";

export const THEMES = {
  Chill: { 
    base:"#040B16", b1:"#00F0FF", b2:"#0038FF", glow:"rgba(0,240,255,.5)", from:"#67e8f9", to:"#3b82f6", label:"Chill", 
    icon: `<svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" class="w-10 h-10"><path stroke-linecap="round" stroke-linejoin="round" d="M12 3v18M3 12h18m-3-6L6 18M6 6l12 12"></path></svg>` 
  },
  Spicy: { 
    base:"#1A0505", b1:"#FF5C00", b2:"#FF003C", glow:"rgba(255,92,0,.5)", from:"#facc15", to:"#f97316", label:"Spicy", 
    icon: `<svg fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24" class="w-10 h-10"><path stroke-linecap="round" stroke-linejoin="round" d="M15.362 5.214A8.252 8.252 0 0 1 12 21 8.25 8.25 0 0 1 6.038 7.047 8.287 8.287 0 0 0 9 9.601a8.983 8.983 0 0 1 3.361-6.867 8.21 8.21 0 0 0 3 2.48Z"></path><path stroke-linecap="round" stroke-linejoin="round" d="M12 18a3.75 3.75 0 0 0 .495-7.468 5.99 5.99 0 0 0-1.925 3.547 5.975 5.975 0 0 1-2.133-1.001A3.75 3.75 0 0 0 12 18Z"></path></svg>` 
  },
  Hardcore: { 
    base:"#0A0012", b1:"#9D00FF", b2:"#FF003C", glow:"rgba(157,0,255,.5)", from:"#e879f9", to:"#dc2626", label:"Hardcore", 
    icon: `<svg fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24" class="w-10 h-10"><path stroke-linecap="round" stroke-linejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z"></path></svg>` 
  }
};

export const JOKERS = {
  SHIELD: { name: "Bouclier", icon: `<svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"></path></svg>`, desc: "Mode intouchable. Zéro gorgée." },
  MIRROR: { name: "Miroir", icon: `<svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7.5 21 3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5"></path></svg>`, desc: "C'est l'autre qui trinque." },
  DOUBLE: { name: "Double ou Rien", icon: `<svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7.5 7.5 3m0 0L12 7.5M7.5 3v13.5m13.5 0L16.5 21m0 0L12 16.5m4.5 4.5V7.5"></path></svg>`, desc: "Grosse prise de risque (x2)." },
  SHOT: { name: "Cul sec", icon: `<svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.75 3.104v5.714a2.25 2.25 0 0 1-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 0 1 4.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.89 15.3M14.25 3.104c.251.023.501.05.75.082M19.89 15.3l-1.57.393A9.065 9.065 0 0 1 12 15a9.065 9.065 0 0 0-6.32-.711l-1.57-.393m15.78 0a.75.75 0 0 0-.689-1.072h-14.2a.75.75 0 0 0-.689 1.072m15.78 0 1.2 3.6a.75.75 0 0 1-.71 1.05H3.51a.75.75 0 0 1-.71-1.05l1.2-3.6"></path></svg>`, desc: "Bim. Un cul sec cadeau." },
  THIEF: { name: "Voleur", icon: `<svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v12m-3-2.818.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"></path></svg>`, desc: "Pique un pouvoir en scred." }
};

export const ROASTS = [
  "{name} vit clairement dans une autre galaxie. 🛸",
  "Radar social de {name} : ERROR 404. 🤖",
  "Même en tirant au hasard, {name} aurait fait mieux. 🤡"
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
