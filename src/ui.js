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
  fill.style.width = `calc(${val}% - 16px)`; fill.style.background = color; fill.style.boxShadow = `0 0 35px ${color}`;
  if (sv) { sv.textContent = val + "%"; sv.style.color = color; sv.style.textShadow = `0 4px 30px rgba(${r},${g},${b},0.8)`; }
}

const btnPrimary = "w-full py-4 px-8 rounded-2xl btn-gold font-extrabold text-lg shadow-[0_0_30px_rgba(251,191,36,0.4)] active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed";

function modeBtns(cur, fn) { 
  return Object.keys(THEMES).map(m => {
    const t = THEMES[m]; const a = cur === m;
    return `<button onclick="window.${fn}('${m}')" class="flex flex-col items-center gap-2 py-4 rounded-2xl border transition-all duration-300 ${a ? 'border-white/50 scale-[1.02] shadow-[0_0_20px_rgba(255,255,255,0.2)]' : 'bg-black/20 border-white/10 text-white/50 hover:bg-white/5'}" ${a ? `style="background:linear-gradient(135deg, ${t.base}, rgba(0,0,0,0.8)); border-color: ${t.from}"` : ""}>
      <span class="text-3xl filter drop-shadow-md">${t.icon}</span><span class="text-xs font-black uppercase tracking-wider ${a ? 'text-white' : ''}">${t.label}</span>
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
      ${!S.room ? `<button onclick="window.toggleRules()" class="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white/70 font-bold border border-white/20 active:scale-95 transition-transform text-white shadow-lg">?</button>` : ""}
      ${S.room && S.code ? `<span class="text-xs font-bold bg-white/10 backdrop-blur-md border border-white/20 px-3 py-1.5 rounded-full shadow-inner text-white">${t.emoji} ${S.room.mode}</span> <button onclick="window.quitGame()" class="px-3 py-1.5 rounded-full bg-red-500/20 text-red-300 font-bold border border-red-500/30 text-xs active:scale-95 transition-transform shadow-lg">🚪</button>` : ""}
    </div>
  </header>`; 
}

function renderHome(t) { 
  return `<div class="flex-1 flex flex-col justify-center animate-up pb-8">
    <div class="glass-card rounded-[2rem] p-6 flex flex-col gap-5 mb-6 shadow-2xl">
      <div class="flex flex-col gap-2"><label class="text-white/60 font-black text-xs uppercase tracking-widest ml-1">Ton p'tit blaze 👀</label><input id="nameI" maxlength="15" placeholder="Ex: Alex" value="${esc(S.name)}" class="w-full bg-black/40 border border-white/10 rounded-2xl px-5 py-4 text-xl font-bold outline-none focus:border-white/50 transition-colors placeholder:text-white/20 text-white shadow-inner"/></div>
      <div class="flex flex-col gap-2"><label class="text-white/60 font-black text-xs uppercase tracking-widest ml-1">Choisis la Vibe 🔥</label><div class="grid grid-cols-3 gap-3">${modeBtns(S.pendingMode, "pickMode")}</div></div>
      <button id="createB" class="${btnPrimary} mt-2" ${S.isLoading ? 'disabled' : ''}>${S.isLoading ? 'Création...' : 'Créer le salon 🚀'}</button>
    </div>
    <div class="glass-card rounded-[2rem] p-3 flex flex-row gap-3 items-center shadow-xl">
      <input id="joinI" maxlength="4" placeholder="CODE" value="${esc(S.joinCode)}" class="flex-1 min-w-0 bg-transparent border-none px-4 py-2 text-2xl font-black tracking-[0.3em] text-center uppercase outline-none placeholder:text-white/20 placeholder:tracking-normal text-white"/>
      <button id="joinB" class="shrink-0 py-3 px-8 rounded-xl bg-white/10 border border-white/20 font-bold hover:bg-white/20 active:scale-95 transition-all text-white shadow-md" ${S.isLoading ? 'disabled' : ''}>Go 🍻</button>
    </div>
  </div>`; 
}

function renderLobby(r, t) { 
  const isHost = S.pid === r.hostId; const ps = playersArr(r); const me = r.players[S.pid]; const myJoker = JOKERS[me.joker]; const others = connectedArr(r).filter(p => p.id !== S.pid);
  const currentMax = r.maxRounds || 10;
  
  let roundsSelectorUi = "";
  if (isHost) {
    roundsSelectorUi = `
      <div class="glass-card rounded-3xl p-5 flex flex-col gap-3 shadow-xl">
        <h2 class="text-xs font-black uppercase tracking-widest text-white/50 ml-1">Nombre de questions</h2>
        <div class="grid grid-cols-4 gap-2">
          ${[5, 10, 15, 0].map(num => `<button onclick="window.changeMaxRounds(${num})" class="py-2 rounded-xl font-bold border transition-all ${currentMax === num || (num === 0 && r.maxRounds === 0) ? 'bg-white/25 border-white/60 shadow-[0_0_15px_rgba(255,255,255,0.2)]' : 'bg-black/20 border-white/10 text-white/60 hover:bg-white/10'}">${num === 0 ? '♾️' : num}</button>`).join("")}
        </div>
      </div>
    `;
  }

  return `<div class="flex flex-col gap-5 animate-up pb-8">
    <div class="glass-card rounded-3xl p-6 text-center flex flex-col gap-4 relative overflow-hidden shadow-2xl border-white/10">
      <div class="absolute inset-0 opacity-20" style="background: linear-gradient(135deg, transparent, ${t.from}, transparent);"></div>
      <span class="text-white/60 text-xs font-black uppercase tracking-widest relative z-10">Passe ce code à la team 🤫</span>
      <span class="text-6xl font-display font-black tracking-widest relative z-10 text-white drop-shadow-2xl" style="text-shadow: 0 4px 30px ${t.glow}">${S.code}</span>
    </div>
    
    ${isHost ? `<div class="glass-card rounded-3xl p-5 flex flex-col gap-3 shadow-xl"><h2 class="text-xs font-black uppercase tracking-widest text-white/50 ml-1">Vibe de la partie</h2><div class="grid grid-cols-3 gap-2">${modeBtns(r.mode, "chooseMode")}</div></div>` : ""}
    ${roundsSelectorUi}
    
    <div class="glass-card rounded-3xl p-5 flex flex-col gap-4 shadow-xl">
      <h2 class="text-xs font-black uppercase tracking-widest text-white/50 ml-1">L'équipe (${ps.length}) 🍻</h2>
      <div class="flex flex-col gap-2 max-h-48 overflow-y-auto scroll">
        ${ps.map(p => `
          <div class="flex items-center justify-between p-3 rounded-2xl bg-black/40 border border-white/5 shadow-inner">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-full flex items-center justify-center font-black text-white ring-2 ring-white/20 ring-offset-2 ring-offset-[#040B16]" style="background:${getAvatarGradient(p.name)}">${esc((p.name || "A")[0].toUpperCase())}</div>
              <span class="font-bold text-white text-lg">${esc(p.name)} ${p.id === S.pid ? '<span class="text-white/40 text-xs uppercase tracking-widest ml-1">C\\'est toi</span>' : ''}</span>
            </div>
          </div>
        `).join("")}
      </div>
    </div>

    <div class="glass-card rounded-3xl p-5 border border-dashed border-white/30 bg-black/40 shadow-xl">
      <h3 class="text-xs font-black uppercase tracking-widest text-white/50 mb-3 text-center">Choisis ton Joker 🃏</h3>
      <div class="grid grid-cols-5 gap-2 mb-3">
          ${Object.entries(JOKERS).map(([k, j]) => `<button onclick="window.selectJoker('${k}')" class="flex flex-col items-center p-2 rounded-xl border transition-all duration-300 ${me.joker === k ? 'bg-white/20 border-white/50 scale-110 shadow-[0_0_15px_rgba(255,255,255,0.3)]' : 'bg-black/20 border-white/10 opacity-70'}"><span class="text-2xl">${j.icon}</span></button>`).join('')}
      </div>
      <div class="bg-black/30 rounded-xl p-3 text-center border border-white/5"><p class="font-black text-sm text-white uppercase tracking-wider">${myJoker.name}</p><p class="text-white/60 text-xs mt-1 leading-snug">${myJoker.desc}</p></div>
    </div>

    ${isHost ? `<button id="startB" class="${btnPrimary}" ${connectedArr(r).length < 2 ? 'disabled' : ''}>${connectedArr(r).length < 2 ? '⏳ Rameute l\\'équipe...' : '🚀 Let\\'s Go !'}</button>` : `<div class="glass-card rounded-3xl p-5 text-center flex items-center justify-center gap-3 text-white/70 font-bold shadow-xl"><span class="animate-spin text-xl">⏳</span> En attente du boss...</div>`}
  </div>`; 
}

function renderVoting(r, t) { 
  const q = r.question; const voted = (r.votes || {})[S.pid] !== undefined; const conn = connectedArr(r).length; const vc = Object.keys(r.votes || {}).length;
  const roundCounter = r.maxRounds > 0 ? `Question ${r.round} / ${r.maxRounds}` : `Question ${r.round}`;
  const amTarget = q.targetId === S.pid;
  
  const waitingList = connectedArr(r).map(p => {
      const hasVoted = (r.votes || {})[p.id] !== undefined;
      return `<div class="flex items-center justify-between p-3 rounded-2xl border transition-all ${hasVoted ? 'bg-black/40 border-white/10 shadow-lg scale-[1.02]' : 'bg-black/20 border-white/5 opacity-60'}"><div class="flex items-center gap-3"><div class="w-10 h-10 rounded-full flex items-center justify-center font-black text-white ring-2 ring-white/20" style="background:${getAvatarGradient(p.name)}">${esc((p.name || "A")[0].toUpperCase())}</div><span class="font-bold text-white text-lg">${esc(p.name)}</span></div><div>${hasVoted ? '<span class="text-xl filter drop-shadow-[0_0_5px_rgba(255,255,255,0.8)]">✅</span>' : '<span class="animate-pulse text-xl">⏳</span>'}</div></div>`;
  }).join("");
  
  return `<div class="flex-1 flex flex-col justify-center gap-6 animate-up pb-8">
    <div class="glass-card rounded-3xl p-8 text-center flex flex-col gap-4 relative overflow-hidden min-h-[180px] justify-center shadow-2xl ${amTarget ? 'border-yellow-400/50 shadow-[0_0_40px_rgba(250,204,21,0.2)]' : 'border-white/10'}">
      <div class="absolute top-4 left-0 right-0 flex justify-center">
         <span class="px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest bg-white/10 border border-white/20 text-white shadow-inner">${roundCounter}</span>
      </div>
      <div class="mt-4">
        ${amTarget ? `<span class="text-yellow-400 font-black text-xs uppercase tracking-widest block mb-2 animate-pulse">👀 C'est TOI la cible !</span>` : ``}
        <p class="text-2xl font-bold leading-relaxed text-white">"${esc(q.text)}"</p>
      </div>
    </div>
    ${!voted ? `
      <div class="glass-card rounded-3xl p-6 flex flex-col gap-6 shadow-2xl border-white/10">
        <div class="flex justify-between items-end"><span class="font-black text-white/50 text-xs uppercase tracking-widest">${amTarget ? 'Sois honnête 🤫' : 'Tu penses à combien ? 🤔'}</span><span id="sv" class="text-6xl font-display font-black text-white">${S.voteValue}%</span></div>
        <div class="relative h-16 rounded-full bg-black/50 shadow-inner border border-white/10 flex items-center px-2"><div id="fill" class="absolute left-2 top-2 bottom-2 rounded-full transition-all duration-100 ease-out" style="width:calc(${S.voteValue}% - 16px); background:linear-gradient(90deg,${t.b1},${t.b2});"></div><input id="slider" type="range" min="0" max="100" value="${S.voteValue}" class="thermo-slider relative z-10 w-full"/></div>
      </div>
      <button id="voteB" class="${btnPrimary}">Je lock mon vote 🔒</button>
    ` : `<div class="glass-card rounded-3xl p-6 flex flex-col gap-4 shadow-xl"><div class="flex flex-col gap-2 max-h-60 overflow-y-auto scroll pr-2">${waitingList}</div></div>`}
  </div>`; 
}

function renderReveal(r, t) { 
  const res = r.result; if (!res) return "";
  const isHost = S.pid === r.hostId; 
  
  let sipsSentence = "";
  let glowColor = "";
  if (res.isClose) {
      sipsSentence = `<span class="text-yellow-400 font-black block text-3xl uppercase tracking-wide mt-2 drop-shadow-[0_0_15px_rgba(250,204,21,0.5)]">DANS LE MILLE 🎯<br><span class="text-xl text-white mt-1 block">La team prend ${res.sips} gorgée${res.sips > 1 ? 's' : ''} 🍻</span></span>`;
      glowColor = "border-yellow-400/30 shadow-[0_0_50px_rgba(250,204,21,0.15)]";
  } else {
      sipsSentence = `<span class="text-red-500 font-black block text-3xl uppercase tracking-wide mt-2 drop-shadow-[0_0_15px_rgba(239,68,68,0.5)]">AÏE COUP DUR 📉<br><span class="text-xl text-white mt-1 block">${esc(res.drinkerName)} prend ${res.sips} gorgée${res.sips > 1 ? 's' : ''} 🍻</span></span>`;
      glowColor = "border-red-500/30 shadow-[0_0_50px_rgba(239,68,68,0.15)]";
  }

  return `<div class="flex-1 flex flex-col gap-5 animate-up pb-8">
    <div class="text-center pt-2"><p class="text-white/50 text-[10px] font-black uppercase tracking-widest shadow-sm">L'avis du groupe sur</p><h2 class="text-3xl font-black uppercase text-white tracking-tight mt-1">${esc(res.targetName)}</h2></div>
    <div class="text-center animate-pop my-4 h-28 flex items-center justify-center"><span id="reveal-avg" class="font-display text-white font-black leading-none drop-shadow-[0_15px_35px_rgba(255,255,255,0.4)] blur-xl opacity-0 transition-all duration-[2000ms] text-[25vw]">0%</span></div>
    
    <div id="reveal-details" class="opacity-0 transition-opacity duration-700 flex flex-col gap-5">
      <div class="glass-card bg-black/50 border rounded-3xl p-6 flex flex-col items-center text-center gap-5 ${glowColor}">
        <div class="flex w-full justify-around items-center">
          <div class="flex flex-col"><span class="text-white/50 text-[10px] font-black uppercase tracking-widest">La réalité</span><span class="text-5xl font-display font-black text-white drop-shadow-md">${res.targetVote}%</span></div>
          <div class="w-px h-12 bg-white/20"></div>
          <div class="flex flex-col"><span class="text-white/50 text-[10px] font-black uppercase tracking-widest">Écart</span><span class="text-5xl font-display font-black text-white drop-shadow-md">${res.diff} <span class="text-xl">pts</span></span></div>
        </div>
        <div class="w-full h-px bg-white/10"></div>
        <div class="text-center leading-relaxed font-bold text-lg w-full bg-black/30 p-4 rounded-2xl border border-white/5 shadow-inner">${sipsSentence}</div>
      </div>
      
      <div class="flex gap-3">
        ${isHost ? `<button id="nextB" class="flex-grow py-4 px-6 rounded-2xl btn-gold font-extrabold text-lg transition-all shadow-[0_0_20px_rgba(251,191,36,0.3)] active:scale-95">${r.maxRounds > 0 && r.round >= r.maxRounds ? '🏁 Le Classement' : 'On enchaîne ! ➡️'}</button>` : `<div class="w-full glass-card rounded-3xl p-4 text-center text-white/50 font-bold shadow-xl">On attend le chef...</div>`}
        ${isHost ? `<button onclick="window.endGame()" class="py-4 px-5 rounded-2xl bg-red-500/20 border border-red-500/30 text-red-200 font-bold active:scale-95 shadow-lg flex items-center justify-center" title="Arrêter de jouer">🏁</button>` : ""}
      </div>
    </div>
  </div>`; 
}

function renderStats(r, t) { 
  const rk = r.ranking; const isHost = S.pid === r.hostId;
  return `<div class="flex-1 flex flex-col gap-6 animate-up pb-8">
    <div class="text-center pt-4"><h2 class="text-4xl font-black mb-2 text-white tracking-tight">FIN DU GAME 🏁</h2></div>
    <div class="bg-black/80 backdrop-blur-xl rounded-[2rem] p-6 text-center shadow-[0_15px_40px_rgba(250,204,21,0.2)] border border-yellow-500/40 relative overflow-hidden">
      <div class="absolute -top-10 -right-10 text-8xl opacity-10 blur-sm">👑</div>
      <span class="text-yellow-400 text-[10px] font-black uppercase tracking-widest block mb-1 relative z-10">Le devin de la soirée</span>
      <p class="text-4xl font-black text-white relative z-10">👑 ${esc(rk.winner.name)}</p>
      <p class="text-white/60 text-sm mt-2 font-bold relative z-10 bg-black/40 inline-block px-3 py-1 rounded-full">${rk.winner.score} pts d'erreur au total</p>
    </div>
    <div class="bg-black/80 backdrop-blur-xl rounded-[2rem] p-6 text-center shadow-[0_15px_40px_rgba(239,68,68,0.2)] border border-red-500/40 relative overflow-hidden">
      <div class="absolute -top-10 -left-10 text-8xl opacity-10 blur-sm">🤡</div>
      <span class="text-red-400 text-[10px] font-black uppercase tracking-widest block mb-1 relative z-10">À l'ouest complet</span>
      <p class="text-4xl font-black text-white relative z-10">🤡 ${esc(rk.loser.name)}</p>
      <p class="text-white/60 text-sm mt-2 font-bold relative z-10 bg-black/40 inline-block px-3 py-1 rounded-full">${rk.loser.score} pts dans le vent !</p>
    </div>
    ${isHost ? `<button id="restartB" class="${btnPrimary} mt-4">🔄 Rejouer</button>` : `<div class="glass-card rounded-3xl p-5 text-center text-white/70 font-bold shadow-xl">Merci d'avoir joué ! Santé 🍻</div>`}
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
