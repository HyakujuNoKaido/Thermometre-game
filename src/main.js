import './style.css';
import { S } from './store.js';
import * as Game from './game.js';
import * as UI from './ui.js';

Object.assign(window, Game);
window.toggleRules = UI.toggleRules;

function bindInputs() {
  const g = id => document.getElementById(id);
  
  // Utilisation de sessionStorage ici
  const ni = g("nameI"); 
  if (ni) ni.oninput = e => { S.name = e.target.value; sessionStorage.setItem('thermo_name', S.name); };
  
  const ji = g("joinI"); 
  if (ji) ji.oninput = e => S.joinCode = e.target.value.toUpperCase();
  
  if (g("createB")) g("createB").onclick = Game.createRoom;
  if (g("joinB")) g("joinB").onclick = Game.joinRoom;
  if (g("startB")) g("startB").onclick = Game.startRound;
  if (g("voteB")) g("voteB").onclick = Game.vote;
  if (g("nextB")) g("nextB").onclick = Game.nextRound;
  if (g("restartB")) g("restartB").onclick = Game.restart;
  if (g("jokerB")) g("jokerB").onclick = Game.useJoker;
  
  const sl = g("slider"); 
  if (sl) {
    UI.updateThermometerColor(sl.value);
    sl.oninput = e => { S.voteValue = e.target.value; UI.updateThermometerColor(e.target.value); };
  }
}

const originalRender = UI.render;
UI.render = function() {
    originalRender(); 
    bindInputs();     
    
    if (S.room && S.room.phase === "REVEAL" && !S.animDone) {
        S.animDone = true; 
        const avgEl = document.getElementById("reveal-avg");
        if(avgEl) {
            let current = 0; const target = S.room.result.average;
            const interval = setInterval(() => {
                current += target / 40;
                if (current >= target) {
                    clearInterval(interval);
                    document.getElementById("reveal-details").classList.remove("opacity-0");
                    if (S.room.result.diff <= 15 && typeof confetti === 'function') confetti({ particleCount: 150 });
                    if (S.room.result.diff > 35) document.body.classList.add('shake-violent');
                }
                avgEl.textContent = Math.round(current) + "%";
                avgEl.classList.remove("opacity-0", "blur-xl");
            }, 50);
        }
    } else if (S.room && S.room.phase !== "REVEAL") {
        S.animDone = false;
    }
}

async function initApp() {
  const urlRoom = new URLSearchParams(window.location.search).get("room"); 
  if (urlRoom) S.joinCode = urlRoom.toUpperCase();
  if (await Game.tryReconnect()) return;
  UI.render();
}

initApp();
