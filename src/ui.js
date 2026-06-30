import { S, THEMES, JOKERS, esc, connectedArr, playersArr } from './store.js';

export function toast(msg, ok=false) { 
  const el = document.createElement("div"); 
  el.className = `toast px-4 py-3 rounded-2xl font-bold text-sm text-center shadow-[0_4px_20px_rgba(0,0,0,0.5)] ${ok ? 'bg-emerald-500/90' : 'bg-red-500/90'} backdrop-blur-md text-white border border-white/20`; 
  el.textContent = msg; 
  document.getElementById("toasts").appendChild(el); 
  setTimeout(() => el.remove(), 3000); 
}

export function toggleRules() {
  const modal = document.getElementById('rulesModal');
  if(modal) modal.classList.toggle('hidden');
}

export function getAvatarGradient(name) {
  const safeName = name || "A";
  let hash = 0;
  for (let i = 0; i < safeName.length; i++) hash = safeName.charCodeAt(i) + ((hash << 5) - hash);
  const h1 = Math.abs(hash) % 360; const h2 = (h1 + 50) % 360;
  return `linear-gradient(135deg, hsl(${h1}, 80%, 60%), hsl(${h2}, 80%, 50%))`;
}

function theme() { return THEMES[(S.room && S.room.mode) || S.pendingMode] || THEMES.Chill; }

function applyBg() { 
  const t = theme(); if(!t) return;
  const bg = document.getElementById("bg"), b1 = document.getElementById("blob1"), b2 = document.getElementById("blob2"), b3 = document.getElementById("blob3");
  if(bg) bg.style.background = t.base; 
  if(b1) b1.style.background = t.b1; 
  if(b2) b2.style.background = t.b2; 
  if(b3) b3.style.background = t.from;
}

export function updateThermometerColor(val) {
  const sv = document.getElementById("sv"); const fill = document.getElementById("fill");
  if (!fill) return;
  let r, g, b;
  if (val <= 50) {
      const p = val / 50; r = Math.round(0 + (255 - 0) * p); g = Math.round(240 + (140 - 240) * p); b = Math.round(255 + (0 - 255) * p);
  } else {
      const p = (val - 50) / 50; r = Math.round(255 + (255 - 255) * p); g = Math.round(140 + (0 - 140) * p); b = Math.round(0 + (60 - 0) * p);
  }
  const color = `rgb(${r},${g},${b})`;
  fill.style.width = `calc(${val}% - 16px)`; fill.style.background = color; fill.style.boxShadow = `0 0 25px ${color}`;
  if (sv) { sv.textContent = val + "%"; sv.style.color = color; sv.style.textShadow = `0 4px 25px rgba(${r},${g},${b},0.6)`; }
}

const btnPrimary = "w-full py-4 px-8 rounded-2xl btn-gold font-extrabold text-lg shadow-[0_0_20px_rgba(251,191,36,0.3)] active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed";

function modeBtns(cur, fn) { 
  return Object.keys(THEMES).map(m => {
    const t = THEMES[m]; const a = cur === m;
    return `<button onclick="window.${fn}('${m}')" class="flex flex-col items-center gap-2 py-4 rounded-2xl border transition-all duration-300 ${a ? 'border-white/50 scale-[1.02] shadow-[0_0_20px_rgba(255,255,255,0.2)]' : 'bg-black/20 border-white/10 text-white/50 hover:bg-white/5'}" ${a ? `style="background:linear-gradient(135deg, ${t.base}, rgba(0,0,0,0.8)); border-color: ${t.from}"` : ""}>
      <span class="text-2xl filter drop-shadow-md">${t.icon}</span><span class="text-xs font-bold uppercase tracking-wider ${a ? 'text-white' : ''}">${t.label}</span>
    </button>`;
  }).join(""); 
}

function header() { 
  const t = theme();
  return `<header class="flex justify-between items-center mb-6 pt-2">
    <div class="flex items-center gap-3">
      <div class="p-2.5 rounded-2xl shadow-xl" style="background:linear-gradient(135deg,${t.from},${t.to})">
        <svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 14.76V3.5a2.5 2.5 0 0 0-5 0v11.26a4.5 4.5 0 1 0 5 0z"></path><path d="M12 7v5"></path></svg>
      </div>
      <h1 class="text-2xl font-extrabold tracking-tight text-white">Le <span style="background:linear-gradient(90deg,${t.from},${t.to});-webkit-background-clip:text;background-clip:text;color:transparent">Thermo</span>mètre</h1>
    </div>
    <div class="flex gap-2 items-center">
      ${!S.room ? `<button onclick="window.toggleRules()" class="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white/70 font-bold border border-white/20 active:scale-95 transition-transform text-white">?</button>` : ""}
      ${S.room && S.code ? `<span class="text-xs font-bold bg-white/10 backdrop-blur-md border border-white/20 px-3 py-1.5 rounded-full shadow-inner text-white">${t.emoji} ${S.room.mode}</span> <button onclick="window.quitGame()" class="px-3 py-1.5 rounded-full bg-red-500/20 text-red-300 font-bold border border-red-500/30 text-xs active:scale-95 transition-transform">🚪</button>` : ""}
    </div>
  </header>`; 
}

function renderHome(t) { 
  return `<div class="flex-1 flex flex-col justify-center animate-up pb-8">
    <div class="glass-card rounded-[2rem] p-6 flex flex-col gap-5 mb-6">
      <div class="flex flex-col gap-2"><label class="text-white/60 font-bold text-xs uppercase tracking-widest ml-1">Ton Prénom</label><input id="nameI" maxlength="15" placeholder="Ex: Alex" value="${esc(S.name)}" class="w-full bg-black/40 border border-white/10 rounded-2xl px-5 py-4 text-xl font-bold outline-none focus:border-white/50 transition-colors placeholder:text-white/20 text-white"/></div>
      <div class="flex flex-col gap-2"><label class="text-white/60 font-bold text-xs uppercase tracking-widest ml-1">Ambiance</label><div class="grid grid-cols-3 gap-3">${modeBtns(S.pendingMode, "pickMode")}</div></div>
      <button id="createB" class="${btnPrimary} mt-2" ${S.isLoading ? 'disabled' : ''}>${S.isLoading ? 'Création...' : 'Créer une partie'}</button>
    </div>
    <div class="glass-card rounded-[2rem] p-3 flex flex-row gap-3 items-center">
      <input id="joinI" maxlength="4" placeholder="CODE" value="${esc(S.joinCode)}" class="flex-1 min-w-0 bg-transparent border-none px-4 py-2 text-2xl font-black tracking-[0.3em] text-center uppercase outline-none placeholder:text-white/20 placeholder:tracking-normal text-white"/>
      <button id="joinB" class="shrink-0 py-3 px-8 rounded-xl bg-white/10 border border-white/20 font-bold hover:bg-white/20 active:scale-95 transition-all text-white" ${S.isLoading ? 'disabled' : ''}>Go </button>
    </div>
  </div>`; 
}

function renderLobby(r, t) { 
  const isHost = S.pid === r.hostId; const ps = playersArr(r); const me = r.players[S.pid]; const myJoker = JOKERS[me.joker]; const others = connectedArr(r).filter(p => p.id !== S.pid);
  const currentMax = r.maxRounds || 10;
  
  let thiefUi = "";
  if (me.joker === "THIEF" && !me.jokerUsed && others.length > 0) {
    const targets = others.map(p => `<button onclick="window.stealJoker('${p.id}')" class="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl border border-white/20 text-sm font-bold active:scale-95 transition-colors text-white">${esc(p.name)}</button>`).join("");
    thiefUi = `<div class="mt-4 p-4 bg-black/40 border border-white/10 rounded-2xl"><p class="text-xs font-bold uppercase tracking-widest text-emerald-400 mb-3">🥷 Choisis ta victime :</p><div class="flex flex-wrap gap-2">${targets}</div></div>`;
  }

  // Sélection du nombre de questions pour l'hôte
  let roundsSelectorUi = "";
  if (isHost) {
    roundsSelectorUi = `
      <div class="glass-card rounded-3xl p-5 flex flex-col gap-3">
        <h2 class="text-xs font-bold uppercase tracking-widest text-white/50 ml-1">Nombre de questions</h2>
        <div class="grid grid-cols-4 gap-2">
          ${[5, 10, 15, 0].map(num => `
            <button onclick="window.changeMaxRounds(${num})" class="py-2 rounded-xl font-bold border ${currentMax === num || (num === 0 && r.maxRounds === 0) ? 'bg-white/25 border-white/60' : 'bg-black/20 border-white/10 text-white/60'}">
              ${num === 0 ? '♾️' : num}
            </button>
          `).join("")}
        </div>
      </div>
    `;
  }

  return `<div class="flex flex-col gap-5 animate-up pb-8">
    <div class="glass-card rounded-3xl p-6 text-center flex flex-col gap-4 relative overflow-hidden">
      <div class="absolute inset-0 opacity-20" style="background: linear-gradient(135deg, transparent, ${t.from}, transparent);"></div>
      <span class="text-white/60 text-xs font-bold uppercase tracking-widest relative z-10">Code de la salle</span><span class="text-6xl font-black tracking-widest relative z-10 text-white" style="text-shadow: 0 4px 20px ${t.glow}">${S.code}</span>
    </div>
    ${isHost ? `<div class="glass-card rounded-3xl p-5 flex flex-col gap-3"><h2 class="text-xs font-bold uppercase tracking-widest text-white/50 ml-1">Ambiance</h2><div class="grid grid-cols-3 gap-2">${modeBtns(r.mode, "chooseMode")}</div></div>` : ""}
    ${roundsSelectorUi}
    
    <div class="glass-card rounded-3xl p-5 flex flex-col gap-4">
      <h2 class="text-xs font-bold uppercase tracking-widest text-white/50 ml-1">Joueurs connectés (${ps.length})</h2>
      <div class="flex flex-col gap-2 max-h-48 overflow-y-auto scroll">
        ${ps.map(p => `
          <div class="flex items-center justify-between p-3 rounded-2xl bg-black/30 border border-white/5">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-full flex items-center justify-center font-black text-white" style="background:${getAvatarGradient(p.name)}">${esc((p.name || "A")[0].toUpperCase())}</div>
              <span class="font-bold text-white">${esc(p.name)} ${p.id === S.pid ? '<span class="text-white/40 text-xs">(Toi)</span>' : ''}</span>
            </div>
          </div>
        `).join("")}
      </div>
    </div>

    <div class="glass-card rounded-3xl p-5 border border-dashed border-white/30 bg-black/40">
      <h3 class="text-xs font-bold uppercase tracking-widest text-white/50 mb-3 text-center">Choisis ton pouvoir</h3>
      <div class="grid grid-cols-5 gap-2 mb-3">
          ${Object.entries(JOKERS).map(([k, j]) => `<button onclick="window.selectJoker('${k}')" class="flex flex-col items-center p-2 rounded-xl border transition-all duration-300 ${me.joker === k ? 'bg-white/20 border-white/50 scale-105' : 'bg-black/20 border-white/10'}"><span class="text-2xl">${j.icon}</span></button>`).join('')}
      </div>
      <div class="bg-black/30 rounded-xl p-3 text-center"><p class="font-bold text-sm text-white">${myJoker.name}</p><p class="text-white/60 text-xs mt-1 leading-snug">${myJoker.desc}</p></div>
      ${thiefUi}
    </div>

    ${isHost ? `<button id="startB" class="${btnPrimary}" ${connectedArr(r).length < 2 ? 'disabled' : ''}>${connectedArr(r).length < 2 ? '⏳ En attente de joueurs...' : '🚀 Lancer !'}</button>` : `<div class="glass-card rounded-3xl p-5 text-center flex items-center justify-center gap-3 text-white/70 font-bold"><span class="animate-spin text-xl">⏳</span> En attente du chef...</div>`}
  </div>`; 
}

function renderVoting(r, t) { 
  const q = r.question; const voted = (r.votes || {})[S.pid] !== undefined; const conn = connectedArr(r).length; const vc = Object.keys(r.votes || {}).length;
  const roundCounter = r.maxRounds > 0 ? `Question ${r.round} / ${r.maxRounds}` : `Question ${r.round}`;
  
  const waitingList = connectedArr(r).map(p => {
      const hasVoted = (r.votes || {})[p.id] !== undefined;
      return `<div class="flex items-center justify-between p-3 rounded-2xl bg-black/40 border border-white/5"><div class="flex items-center gap-3"><div class="w-10 h-10 rounded-full flex items-center justify-center font-black text-white" style="background:${getAvatarGradient(p.name)}">${esc((p.name || "A")[0].toUpperCase())}</div><span class="font-bold text-white ${!hasVoted ? 'opacity-50' : ''}">${esc(p.name)}</span></div><div>${hasVoted ? '✅' : '<span class="animate-pulse text-xl">⏳</span>'}</div></div>`;
  }).join("");
  
  return `<div class="flex-1 flex flex-col justify-center gap-6 animate-up pb-8">
    <div class="glass-card rounded-3xl p-8 text-center flex flex-col gap-4 relative overflow-hidden min-h-[180px] justify-center">
      <div class="absolute top-4 left-0 right-0 flex justify-center">
         <span class="px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest bg-white/10 border border-white/20 text-white/80">${roundCounter}</span>
      </div>
      <div class="mt-4">
        <p class="text-xl font-medium leading-relaxed text-white">"${esc(q.text)}"</p>
      </div>
    </div>
    ${!voted ? `
      <div class="glass-card rounded-3xl p-6 flex flex-col gap-6">
        <div class="flex justify-between items-end"><span class="font-bold text-white/50 text-sm uppercase tracking-widest">Ton estimation :</span><span id="sv" class="text-6xl font-display font-black text-white">${S.voteValue}%</span></div>
        <div class="relative h-16 rounded-full bg-black/50 shadow-inner border border-white/10 flex items-center px-2"><div id="fill" class="absolute left-2 top-2 bottom-2 rounded-full transition-all duration-100 ease-out" style="width:calc(${S.voteValue}% - 16px); background:linear-gradient(90deg,${t.b1},${t.b2});"></div><input id="slider" type="range" min="0" max="100" value="${S.voteValue}" class="thermo-slider relative z-10 w-full"/></div>
      </div>
      <button id="voteB" class="${btnPrimary}">Valider mon choix ✓</button>
    ` : `<div class="glass-card rounded-3xl p-6 flex flex-col gap-4"><div class="flex flex-col gap-2 max-h-60 overflow-y-auto scroll pr-2">${waitingList}</div></div>`}
  </div>`; 
}

function renderReveal(r, t) { 
  const res = r.result; if (!res) return "";
  const isHost = S.pid === r.hostId; 
  
  // LOGIQUE ET AFFICHAGE VISUELS POUR DIRE QUI BOIT QUOI EN TOUTES LETTRES
  let sipsSentence = "";
  if (res.isClose) {
      sipsSentence = `<span class="text-yellow-400 font-extrabold block text-2xl uppercase tracking-wide mt-2">Tout le monde boit ${res.sips} gorgée${res.sips > 1 ? 's' : ''} ! 🍻</span>`;
  } else {
      sipsSentence = `<span class="text-red-400 font-extrabold block text-2xl uppercase tracking-wide mt-2">${esc(res.drinkerName)} boit ${res.sips} gorgée${res.sips > 1 ? 's' : ''} ! 🍻</span>`;
  }

  return `<div class="flex-1 flex flex-col gap-5 animate-up pb-8">
    <div class="text-center pt-2"><p class="text-white/50 text-xs font-bold uppercase tracking-widest">Moyenne générale de la table</p></div>
    <div class="text-center animate-pop my-4 h-28 flex items-center justify-center"><span id="reveal-avg" class="font-display text-white font-black leading-none drop-shadow-2xl blur-xl opacity-0 transition-all duration-[2000ms] text-[25vw]">0%</span></div>
    
    <div id="reveal-details" class="opacity-0 transition-opacity duration-700 flex flex-col gap-5">
      <div class="glass-card bg-black/40 border rounded-3xl p-6 flex flex-col items-center text-center gap-5">
        <div class="flex w-full justify-around items-center">
          <div class="flex flex-col"><span class="text-white/50 text-[10px] font-bold uppercase">Réponse de la cible</span><span class="text-4xl font-display font-black text-white">${res.targetVote}%</span></div>
          <div class="w-px h-10 bg-white/20"></div>
          <div class="flex flex-col"><span class="text-white/50 text-[10px] font-bold uppercase">Écart</span><span class="text-4xl font-display font-black text-white">${res.diff} pts</span></div>
        </div>
        <div class="w-full h-px bg-white/10"></div>
        <div class="text-center leading-relaxed font-bold text-lg">${sipsSentence}</div>
      </div>
      
      <div class="flex gap-3">
        ${isHost ? `<button id="nextB" class="flex-grow py-4 px-6 rounded-2xl btn-gold font-extrabold text-lg transition-all shadow-lg active:scale-95">${r.maxRounds > 0 && r.round >= r.maxRounds ? '🏁 Voir le classement' : 'Manche Suivante ➡️'}</button>` : `<div class="w-full glass-card rounded-3xl p-4 text-center text-white/50 font-bold">En attente de l'hôte...</div>`}
        ${isHost ? `<button onclick="window.endGame()" class="py-4 px-6 rounded-2xl bg-red-500/20 border border-red-500/30 text-red-200 font-bold active:scale-95" title="Terminer et voir les scores">🏁 Fin</button>` : ""}
      </div>
    </div>
  </div>`; 
}

function renderStats(r, t) { 
  const rk = r.ranking; const isHost = S.pid === r.hostId;
  return `<div class="flex-1 flex flex-col gap-6 animate-up pb-8">
    <div class="text-center pt-4"><h2 class="text-4xl font-black mb-2 text-white">Partie Terminée 🏁</h2></div>
    <div class="bg-black/90 rounded-[1.8rem] p-6 text-center shadow-lg border border-yellow-500/30"><span class="text-yellow-400 text-xs font-bold uppercase tracking-widest block mb-1">Le Médium du groupe</span><p class="text-3xl font-black text-white">👑 ${esc(rk.winner.name)}</p><p class="text-white/50 text-sm mt-1">${rk.winner.score} pts d'écart total</p></div>
    <div class="bg-black/90 rounded-[1.8rem] p-6 text-center shadow-lg border border-red-500/30"><span class="text-red-400 text-xs font-bold uppercase tracking-widest block mb-1">Le pire radar social</span><p class="text-3xl font-black text-white">💀 ${esc(rk.loser.name)}</p><p class="text-white/50 text-sm mt-1">${rk.loser.score} pts d'erreur !</p></div>
    ${isHost ? `<button id="restartB" class="${btnPrimary} mt-4">🔄 Recommencer</button>` : `<div class="glass-card rounded-3xl p-5 text-center text-white/70 font-bold">Merci d'avoir joué ! Santé 🍻</div>`}
  </div>`; 
}

export function render() { 
  applyBg(); const app = document.getElementById("app"); const t = theme(); let body = "";
  if (S.screen === "HOME") body = renderHome(t);
  else if (S.room) { 
    if (S.room.phase === "LOBBY") body = renderLobby(S.room, t);
    else if (S.room.phase === "VOTING") body = renderVoting(S.room, t);
    else if (S.room.phase === "REVEAL") body = renderReveal(S.room, t);
    else if (S.room.phase === "STATS") body = renderStats(S.room, t); 
  }
  app.innerHTML = header() + body; 
}
