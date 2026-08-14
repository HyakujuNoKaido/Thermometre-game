import './style.css';
import { S, haptic } from './store.js';
import * as Game from './game.js';
import * as UI from './ui.js';

Object.assign(window, Game);
window.toggleRules = UI.toggleRules;
window.haptic = haptic;

// --- INTEGRATION "LA TABLE" (Le Hub) ---
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
  app.classList.remove('fade-in');
  app.classList.add('fade-out');
  setTimeout(() => {
    window.location.href = '/la-carte'; // À adapter si le path de ton hub est différent
  }, 600);
}

function bindInputs() {
  const g = id => document.getElementById(id);
  const ni = g("nameI"); if (ni) ni.oninput = e => { S.name = e.target.value; sessionStorage.setItem('thermo_name', S.name); };
  const ji = g("joinI"); if (ji) ji.oninput = e => S.joinCode = e.target.value.toUpperCase();

  if (g("createB")) g("createB").onclick = Game.createRoom;
  if (g("joinB")) g("joinB").onclick = Game.joinRoom;
  if (g("startB")) g("startB").onclick = Game.startRound;
  if (g("voteB")) g("voteB").onclick = Game.vote;
  if (g("nextB")) g("nextB").onclick = Game.nextRound;
  if (g("restartB")) g("restartB").onclick = Game.restart;

  const sl = g("slider");
  if (sl) {
    sl.value = S.voteValue; 
    UI.updateThermometerColor(S.voteValue);
    let lastStep = Math.round(S.voteValue / 10);
    sl.oninput = e => {
      S.voteValue = e.target.value;
      UI.updateThermometerColor(e.target.value);
      const step = Math.round(e.target.value / 10);
      if (step !== lastStep) { lastStep = step; haptic('light'); }
    };
  }
}

UI.onAfterRender(function() {
  bindInputs();
  if (S.room && S.room.phase === "REVEAL" && !S.animDone) {
    S.animDone = true;
    const avgEl = document.getElementById("reveal-avg");
    const detailsEl = document.getElementById("reveal-details");
    
    if (avgEl && detailsEl) {
      let current = 0; 
      const target = Number(S.room.result?.average) || 0;
      
      if (target === 0) {
          avgEl.textContent = "00";
          avgEl.classList.remove("opacity-0");
          detailsEl.classList.remove("opacity-0");
      } else {
          const interval = setInterval(() => {
            current += Math.max(1, target / 30);
            if (current >= target) {
              current = target;
              clearInterval(interval);
              detailsEl.classList.remove("opacity-0");
              haptic('heavy');
            }
            avgEl.textContent = Math.round(current).toString().padStart(2, '0');
            avgEl.classList.remove("opacity-0");
          }, 30);
      }
    }
  } else if (S.room && S.room.phase !== "REVEAL") {
    S.animDone = false;
  }
});

async function initApp() {
  syncLaTablePlayers();
  
  const returnBtn = document.getElementById('hubReturnBtn');
  if(returnBtn) returnBtn.onclick = handleHubReturn;

  const urlRoom = new URLSearchParams(window.location.search).get("room");
  if (urlRoom) S.joinCode = urlRoom.toUpperCase();
  if (await Game.tryReconnect()) return;
  UI.render();
}

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => navigator.serviceWorker.register('./sw.js').catch(() => {}));
}

initApp();
