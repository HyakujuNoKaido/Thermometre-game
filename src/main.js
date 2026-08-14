import './style.css';
import { S, haptic } from './store.js';
import {
  tryReconnect, createRoom, joinRoom, startRound, vote, nextRound,
  restart, activateCounter, stealJoker, assignShotTarget,
  cancelShotTarget, toggleJoker, endGame, quitGame, changeMaxRounds,
  pickMode, chooseMode, randomizeJokers, cycleJoker, toggleBloodPact
} from './game.js';
import * as UI from './ui.js';

window.tryReconnect = tryReconnect;
window.createRoom = createRoom;
window.joinRoom = joinRoom;
window.startRound = startRound;
window.vote = vote;
window.nextRound = nextRound;
window.restart = restart;
window.activateCounter = activateCounter;
window.stealJoker = stealJoker;
window.assignShotTarget = assignShotTarget;
window.cancelShotTarget = cancelShotTarget;
window.toggleJoker = toggleJoker;
window.endGame = endGame;
window.quitGame = quitGame;
window.changeMaxRounds = changeMaxRounds;
window.pickMode = pickMode;
window.chooseMode = chooseMode;
window.randomizeJokers = randomizeJokers;
window.cycleJoker = cycleJoker;
window.toggleBloodPact = toggleBloodPact;

window.toggleRules = UI.toggleRules;
window.haptic = haptic;

// CORRECTION MOBILE : Force la hauteur réelle du viewport de l'appareil (iOS / Android)
function setAppHeight() {
  const doc = document.documentElement;
  doc.style.setProperty('--app-height', `${window.innerHeight}px`);
}
window.addEventListener('resize', setAppHeight);
window.addEventListener('orientationchange', () => setTimeout(setAppHeight, 200));
setAppHeight();

function syncLaTablePlayers() {
  try {
    const tablePlayers = JSON.parse(localStorage.getItem('ja_players')) || [];
    if (tablePlayers.length > 0 && !S.name) {
      S.name = tablePlayers[0].name;
      sessionStorage.setItem('thermo_name', S.name);
    }
  } catch (e) { console.error("La Table introuvable", e); }
}

function handleHubReturn() {
  haptic('medium');
  const app = document.getElementById("app");
  if(app) {
    app.classList.remove('fade-in');
    app.classList.add('fade-out');
  }
  setTimeout(() => {
    window.location.href = '/'; 
  }, 600);
}

function bindInputs() {
  const sl = document.getElementById("slider");
  if (sl) {
    sl.value = S.voteValue; 
    UI.updateThermometerColor(S.voteValue);
    let lastStep = Math.round(S.voteValue / 5); 
    
    sl.oninput = e => {
      const val = parseInt(e.target.value);
      S.voteValue = val;
      UI.updateThermometerColor(val);
      
      const step = Math.round(val / 5);
      if (step !== lastStep) { 
        lastStep = step; 
        if (val > 80) haptic('heavy');
        else if (val > 50) haptic('medium');
        else haptic('light');
      }
    };
  }
}

UI.onAfterRender(function() {
  bindInputs();
  
  if (S.room && S.room.phase === "REVEAL" && !S.animDone) {
    S.animDone = true;
    const avgEl = document.getElementById("reveal-avg");
    const detailsEl = document.getElementById("reveal-details");
    const flashEl = document.getElementById("flash-overlay");
    
    if (avgEl && detailsEl) {
      const target = Number(S.room.result?.average) || 0;
      let rolls = 0;
      const maxRolls = 30; 
      
      avgEl.classList.remove("opacity-0");
      avgEl.classList.add("blur-[2px]");
      
      const interval = setInterval(() => {
        rolls++;
        avgEl.textContent = Math.floor(Math.random() * 101).toString().padStart(2, '0');
        haptic('light');
        
        if (rolls >= maxRolls) {
          clearInterval(interval);
          avgEl.classList.remove("blur-[2px]");
          avgEl.textContent = target.toString().padStart(2, '0');
          
          if(flashEl) {
             flashEl.classList.remove("hidden");
             flashEl.classList.add("animate-flash");
          }
          haptic('heavy');
          
          detailsEl.classList.remove("opacity-0");
          detailsEl.classList.add("fade-in");
        }
      }, 40);
    }
  } else if (S.room && S.room.phase !== "REVEAL") {
    S.animDone = false;
    const flashEl = document.getElementById("flash-overlay");
    if (flashEl) flashEl.classList.remove("animate-flash");
  }
  
  const returnBtn = document.getElementById('hubReturnBtn');
  if(returnBtn) returnBtn.onclick = handleHubReturn;
});

async function initApp() {
  try {
    syncLaTablePlayers();
    const urlRoom = new URLSearchParams(window.location.search).get("room");
    if (urlRoom) S.joinCode = urlRoom.toUpperCase();
    
    const reconnected = await tryReconnect();
    if (reconnected) return;
  } catch (e) {
    console.error("Erreur init:", e);
  }
  UI.render();
}

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => navigator.serviceWorker.register('./sw.js').catch(() => {}));
}

initApp();
