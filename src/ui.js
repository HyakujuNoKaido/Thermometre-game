import { S, THEMES, JOKERS, esc, connectedArr, playersArr } from './store.js';

export function toast(msg, ok=false) { 
  const el = document.createElement("div"); 
  el.className = `toast px-4 py-3 rounded-2xl font-black text-sm text-center shadow-[0_10px_30px_rgba(0,0,0,0.8)] ${ok ? 'bg-emerald-500 text-white' : 'bg-red-600 text-white'} backdrop-blur-md border border-white/30`; 
  el.textContent = msg; 
  document.getElementById("toasts").appendChild(el); 
  setTimeout(() => el.remove(), 3000); 
}

export function toggleRules() {
  const modal = document.getElementById('rulesModal');
if (!modal) return;
  if (modal.classList.contains('hidden')) {
    modal.classList.remove('hidden');
    requestAnimationFrame(() => modal.classList.add('sheet-open'));
  } else {
    modal.classList.remove('sheet-open');
    setTimeout(() => modal.classList.add('hidden'), 320);
  }
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
  fill.style.width = `calc(${val}% - 16px)`; fill.style.background = color; fill.style.boxShadow = `0 0 40px ${color}`;
  const bub = document.getElementById("thumb-bubble");
  if (bub) { bub.textContent = val + "%"; bub.style.left = val + "%"; bub.style.background = color; bub.style.borderTopColor = color; }
  if (sv) sv.textContent = val + "%"; // CORRECTION : Le gros texte se met maintenant à jour
}

const btnPrimary = "w-full py-4 px-8 rounded-2xl btn-gold font-extrabold text-lg shadow-[0_0_35px_rgba(251,191,36,0.5)] active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-wider";

function modeBtns(cur, fn) { 
  return Object.keys(THEMES).map(m => {
    const t = THEMES[m]; const a = cur === m;
    return `<button onclick="window.${fn}('${m}')" class="flex flex-col items-center gap-2 py-4 rounded-2xl border-2 transition-all duration-300 ${a ? 'border-white/80 scale-105 shadow-[0_0_25px_rgba(255,255,255,0.3)]' : 'bg-black/40 border-white/10 text-white/40 hover:bg-white/10'}" ${a ? `style="background:linear-gradient(135deg, ${t.base}, rgba(0,0,0,0.9)); border-color: ${t.from}"` : ""}>
      <span class="text-4xl filter drop-shadow-lg">${t.icon}</span><span class="text-[10px] font-black uppercase tracking-widest ${a ? 'text-white' : ''}">${t.label}</span>
    </button>`;
  }).join(""); 
}

function header() { 
  const t = theme();
  return `<header class="flex justify-between items-center mb-6 pt-2">
    <div class="flex items-center gap-3">
      <div class="p-2.5 rounded-2xl shadow-[0_10px_20px_rgba(0,0,0,0.5)]" style="background:linear-gradient(135deg,${t.from},${t.to})">
        <svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M14 14.76V3.5a2.5 2.5 0 0 0-5 0v11.26a4.5 4.5 0 1 0 5 0z"></path><path d="M12 7v5"></path></svg>
      </div>
      <h1 class="text-3xl font-extrabold tracking-tighter text-white drop-shadow-md">Le <span style="background:linear-gradient(90deg,${t.from},${t.to});-webkit-background-clip:text;background-clip:text;color:transparent">Thermo</span>mètre</h1>
    </div>
    <div class="flex gap-2 items-center">
      ${!S.room ? `<button onclick="window.toggleRules()" class="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white font-black border border-white/30 active:scale-95 transition-transform shadow-lg">?</button>` : ""}
      ${S.room && S.code ? `
        <span class="text-xs font-black bg-emerald-500 text-white px-3 py-1.5 rounded-full shadow-md tracking-wider">🎯 ${S.code}</span> 
        <span class="text-xs font-bold bg-black/40 backdrop-blur-md border border-white/20 px-3 py-1.5 rounded-full shadow-inner text-white">${t.emoji} ${S.room.mode}</span> 
        <button onclick="window.quitGame()" class="px-3 py-1.5 rounded-full bg-red-500/20 text-red-400 font-bold border border-red-500/40 text-xs active:scale-95 transition-transform shadow-lg">🚪</button>
      ` : ""}
    </div>
  </header>`; 
}

function renderLobby(r, t) { 
  const isHost = S.pid === r.hostId; const ps = playersArr(r); const me = r.players[S.pid]; const myJoker = JOKERS[me.joker]; const others = connectedArr(r).filter(p => p.id !== S.pid);
  const currentMax = r.maxRounds || 10;
  
  let roundsSelectorUi = "";
  if (isHost) {
    roundsSelectorUi = `
      <div class="glass-card rounded-3xl p-5 flex flex-col gap-3 shadow-xl border border-white/10 bg-black/40">
        <h2 class="text-[10px] font-black uppercase tracking-widest text-white/60 ml-1">Nombre de questions</h2>
        <div class="grid grid-cols-4 gap-2">
          ${[5, 10, 15, 0].map(num => `<button onclick="window.changeMaxRounds(${num})" class="py-3 rounded-xl font-black border-2 transition-all ${currentMax === num || (num === 0 && r.maxRounds === 0) ? 'bg-white/30 border-white shadow-[0_0_20px_rgba(255,255,255,0.4)] text-white' : 'bg-black/40 border-white/5 text-white/40 hover:bg-white/10'}">${num === 0 ? '♾️' : num}</button>`).join("")}
        </div>
      </div>
    `;
  }

  const waitingText = connectedArr(r).length < 2 
       ? `<span class="text-white/70 font-bold block mb-1"><span class="animate-spin inline-block text-xl">⏳</span> Rameute l'équipe... (1/2 min)</span>`
       : `<span class="text-emerald-400 font-black block text-lg mb-1 drop-shadow-md">✅ L'équipe est parée !</span>`;
  const guestWaitingText = !isHost && connectedArr(r).length >= 2 
       ? `<span class="text-white/50 font-bold text-sm mt-1 animate-pulse block">On attend le lancement du boss...</span>` : "";
  const hostControls = isHost ? `<button id="startB" class="${btnPrimary} mt-3" ${connectedArr(r).length < 2 ? 'disabled' : ''}>🚀 Let's Go !</button>` : "";

  return `<div class="flex-1 flex flex-col gap-4 animate-up pb-8">
    
    <div class="glass-card rounded-3xl p-5 text-center border border-white/20 bg-black/50 shadow-xl flex flex-col items-center justify-center gap-1">
      <span class="text-[10px] font-black uppercase tracking-widest text-white/40">Code du salon</span>
      <span class="text-4xl font-display font-black text-emerald-400 tracking-widest my-1 select-all">${S.code}</span>
      <span class="text-[11px] text-white/40 font-medium bg-white/5 px-3 py-1 rounded-full border border-white/5 break-all">
        ${window.location.origin}?room=${S.code}
      </span>
    </div>

    <div class="glass-card rounded-3xl p-5 flex items-center gap-4 shadow-xl border border-white/10 bg-black/40">
      <div class="w-14 h-14 shrink-0 rounded-2xl flex items-center justify-center text-3xl shadow-lg" style="background:linear-gradient(135deg,${t.from},${t.to})">${myJoker ? myJoker.icon : '🎴'}</div>
      <div class="flex flex-col min-w-0">
        <span class="text-[10px] font-black uppercase tracking-widest text-white/60">Ton pouvoir secret 🃏</span>
        <span class="text-lg font-black text-white leading-tight">${myJoker ? esc(myJoker.name) : 'Aucun'}</span>
        <span class="text-xs text-white/60 font-medium leading-snug">${myJoker ? esc(myJoker.desc) : ''}</span>
      </div>
    </div>
    
    ${isHost ? `<div class="glass-card rounded-3xl p-5 flex flex-col gap-3 shadow-xl border border-white/10 bg-black/40"><h2 class="text-[10px] font-black uppercase tracking-widest text-white/60 ml-1">Vibe de la partie</h2><div class="grid grid-cols-3 gap-2">${modeBtns(r.mode, "chooseMode")}</div></div>` : ""}
    ${roundsSelectorUi}
    
    <div class="glass-card rounded-3xl p-5 flex flex-col gap-4 shadow-xl border border-white/10 bg-black/40">
      <h2 class="text-[10px] font-black uppercase tracking-widest text-white/60 ml-1">L'équipe (${ps.length}) 🍻</h2>
      <div class="flex flex-col gap-3 max-h-48 overflow-y-auto scroll pr-2">
        ${ps.map(p => `
          <div class="flex items-center justify-between p-3 rounded-2xl bg-black/60 border border-white/10 shadow-md">
            <div class="flex items-center gap-3">
              <div class="w-12 h-12 rounded-full flex items-center justify-center font-black text-white text-lg ring-2 ring-white/30 ring-offset-2 ring-offset-[#040B16]" style="background:${getAvatarGradient(p.name)}">${esc((p.name || "A")[0].toUpperCase())}</div>
              <span class="font-bold text-white text-lg">${esc(p.name)} ${p.id === S.pid ? '<span class="text-white/40 text-[10px] uppercase tracking-widest ml-2 bg-white/10 px-2 py-1 rounded-full">C\'est toi</span>' : ''}</span>
            </div>
          </div>
        `).join("")}
      </div>
    </div>

    <div class="glass-card rounded-3xl p-6 text-center flex flex-col shadow-2xl border-white/20 bg-black/50">
       ${waitingText}
       ${guestWaitingText}
       ${hostControls}
    </div>

  </div>`;
}

function renderLobby(r, t) { 
  const isHost = S.pid === r.hostId; const ps = playersArr(r); const me = r.players[S.pid]; const myJoker = JOKERS[me.joker]; const others = connectedArr(r).filter(p => p.id !== S.pid);
  const currentMax = r.maxRounds || 10;
  
  let roundsSelectorUi = "";
  if (isHost) {
    roundsSelectorUi = `
      <div class="glass-card rounded-3xl p-5 flex flex-col gap-3 shadow-xl border border-white/10 bg-black/40">
        <h2 class="text-[10px] font-black uppercase tracking-widest text-white/60 ml-1">Nombre de questions</h2>
        <div class="grid grid-cols-4 gap-2">
          ${[5, 10, 15, 0].map(num => `<button onclick="window.changeMaxRounds(${num})" class="py-3 rounded-xl font-black border-2 transition-all ${currentMax === num || (num === 0 && r.maxRounds === 0) ? 'bg-white/30 border-white shadow-[0_0_20px_rgba(255,255,255,0.4)] text-white' : 'bg-black/40 border-white/5 text-white/40 hover:bg-white/10'}">${num === 0 ? '♾️' : num}</button>`).join("")}
        </div>
      </div>
    `;
  }

  const waitingText = connectedArr(r).length < 2 
       ? `<span class="text-white/70 font-bold block mb-1"><span class="animate-spin inline-block text-xl">⏳</span> Rameute l'équipe... (1/2 min)</span>`
       : `<span class="text-emerald-400 font-black block text-lg mb-1 drop-shadow-md">✅ L'équipe est parée !</span>`;
  const guestWaitingText = !isHost && connectedArr(r).length >= 2 
       ? `<span class="text-white/50 font-bold text-sm mt-1 animate-pulse block">On attend le lancement du boss...</span>` : "";
  const hostControls = isHost ? `<button id="startB" class="${btnPrimary} mt-3" ${connectedArr(r).length < 2 ? 'disabled' : ''}>🚀 Let's Go !</button>` : "";

  return `<div class="glass-card rounded-3xl p-5 flex items-center gap-4 shadow-xl border border-white/10 bg-black/40">
      <div class="w-14 h-14 shrink-0 rounded-2xl flex items-center justify-center text-3xl shadow-lg" style="background:linear-gradient(135deg,${t.from},${t.to})">${myJoker ? myJoker.icon : '🎴'}</div>
      <div class="flex flex-col min-w-0">
        <span class="text-[10px] font-black uppercase tracking-widest text-white/60">Ton pouvoir secret 🃏</span>
        <span class="text-lg font-black text-white leading-tight">${myJoker ? esc(myJoker.name) : 'Aucun'}</span>
        <span class="text-xs text-white/60 font-medium leading-snug">${myJoker ? esc(myJoker.desc) : ''}</span>
      </div>
    </div>
    
    ${isHost ? `<div class="glass-card rounded-3xl p-5 flex flex-col gap-3 shadow-xl border border-white/10 bg-black/40"><h2 class="text-[10px] font-black uppercase tracking-widest text-white/60 ml-1">Vibe de la partie</h2><div class="grid grid-cols-3 gap-2">${modeBtns(r.mode, "chooseMode")}</div></div>` : ""}
    ${roundsSelectorUi}
    
    <div class="glass-card rounded-3xl p-5 flex flex-col gap-4 shadow-xl border border-white/10 bg-black/40">
      <h2 class="text-[10px] font-black uppercase tracking-widest text-white/60 ml-1">L'équipe (${ps.length}) 🍻</h2>
      <div class="flex flex-col gap-3 max-h-48 overflow-y-auto scroll pr-2">
        ${ps.map(p => `
          <div class="flex items-center justify-between p-3 rounded-2xl bg-black/60 border border-white/10 shadow-md">
            <div class="flex items-center gap-3">
              <div class="w-12 h-12 rounded-full flex items-center justify-center font-black text-white text-lg ring-2 ring-white/30 ring-offset-2 ring-offset-[#040B16]" style="background:${getAvatarGradient(p.name)}">${esc((p.name || "A")[0].toUpperCase())}</div>
              <span class="font-bold text-white text-lg">${esc(p.name)} ${p.id === S.pid ? '<span class="text-white/40 text-[10px] uppercase tracking-widest ml-2 bg-white/10 px-2 py-1 rounded-full">C\'est toi</span>' : ''}</span>
            </div>
          </div>
        `).join("")}
      </div>
    </div>

    <div class="glass-card rounded-3xl p-6 text-center flex flex-col shadow-2xl border-white/20 bg-black/50">
       ${waitingText}
       ${guestWaitingText}
       ${hostControls}
    </div>
  </div>`; 
}

function renderVoting(r, t) { 
  const q = r.question; const voted = (r.votes || {})[S.pid] !== undefined; const conn = connectedArr(r).length; const vc = Object.keys(r.votes || {}).length;
  const roundCounter = r.maxRounds > 0 ? `Question ${r.round} / ${r.maxRounds}` : `Question ${r.round}`;
  const amTarget = q.targetId === S.pid;
  
  const waitingList = connectedArr(r).map(p => {
      const hasVoted = (r.votes || {})[p.id] !== undefined;
      return `<div class="flex items-center justify-between p-3 rounded-2xl border-2 transition-all ${hasVoted ? 'bg-white/10 border-white/20 shadow-lg scale-[1.02]' : 'bg-black/40 border-transparent opacity-60'}"><div class="flex items-center gap-3"><div class="w-10 h-10 rounded-full flex items-center justify-center font-black text-white ring-2 ring-white/20" style="background:${getAvatarGradient(p.name)}">${esc((p.name || "A")[0].toUpperCase())}</div><span class="font-bold text-white text-lg">${esc(p.name)}</span></div><div>${hasVoted ? '<span class="text-2xl filter drop-shadow-[0_0_10px_rgba(255,255,255,1)]">✅</span>' : '<span class="animate-pulse text-2xl opacity-50">⏳</span>'}</div></div>`;
  }).join("");
  
  return `<div class="flex-1 flex flex-col justify-center gap-6 animate-up pb-8">
    <div class="glass-card rounded-3xl p-8 text-center flex flex-col gap-4 relative overflow-hidden min-h-[200px] justify-center shadow-2xl bg-black/60 ${amTarget ? 'border-2 border-yellow-400/80 shadow-[0_0_50px_rgba(250,204,21,0.3)]' : 'border border-white/20'}">
      <div class="absolute top-4 left-0 right-0 flex justify-center">
         <span class="px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest bg-white/10 border border-white/20 text-white shadow-inner">${roundCounter}</span>
      </div>
      <div class="mt-6">
        ${amTarget ? `<span class="text-yellow-400 font-black text-xs uppercase tracking-widest block mb-3 animate-pulse drop-shadow-md">👀 C'est TOI la cible !</span>` : ``}
        <p class="text-2xl font-bold leading-relaxed text-white drop-shadow-lg">"${esc(q.text)}"</p>
      </div>
    </div>
    ${!voted ? `
      <div class="glass-card rounded-3xl p-6 flex flex-col gap-6 shadow-2xl border border-white/20 bg-black/60">
        <div class="flex justify-between items-end"><span class="font-black text-white/50 text-[10px] uppercase tracking-widest">${amTarget ? 'Sois honnête 🤫' : 'Tu penses à combien ? 🤔'}</span><span id="sv" class="text-7xl font-display font-black text-white drop-shadow-xl">${S.voteValue}%</span></div>
        <div class="relative h-20 rounded-full bg-black/80 shadow-[inset_0_5px_15px_rgba(0,0,0,0.5)] border-2 border-white/10 flex items-center px-2"><div id="thumb-bubble" class="thumb-bubble font-display" style="left:${S.voteValue}%;background:${t.b1};border-top-color:${t.b1}">${S.voteValue}%</div>

      </div>
      <button id="voteB" class="${btnPrimary}">Je lock mon vote 🔒</button>
    ` : `<div class="glass-card rounded-3xl p-6 flex flex-col gap-4 shadow-2xl border border-white/10 bg-black/40"><div class="flex flex-col gap-3 max-h-[50vh] overflow-y-auto scroll pr-2">${waitingList}</div></div>`}
  </div>`; 
}

function renderReveal(r, t) { 
  const res = r.result; if (!res) return "";
  const isHost = S.pid === r.hostId; 
  
  // 1. Calcul de TES statistiques individuelles
  const myVote = (r.votes || {})[S.pid];
  let myStatsHtml = "";
  if (S.pid === res.targetId) {
      myStatsHtml = `<div class="mt-5 p-4 bg-yellow-500/20 border-2 border-yellow-500/50 rounded-2xl text-center shadow-[0_0_25px_rgba(250,204,21,0.2)] text-yellow-300 font-black uppercase tracking-widest text-xs">C'était toi la cible 🎯</div>`;
  } else if (myVote !== undefined) {
      const myDiff = Math.abs(myVote - res.targetVote);
      const colorClass = myDiff <= 15 ? 'text-emerald-400' : (myDiff > 35 ? 'text-red-500' : 'text-orange-400');
      myStatsHtml = `
        <div class="mt-5 w-full p-5 bg-black/80 border-2 border-white/10 rounded-2xl flex justify-between items-center shadow-inner">
          <div class="flex flex-col text-left">
            <span class="text-white/50 text-[10px] font-black uppercase tracking-widest mb-1">Tu as voté</span>
            <span class="text-white font-display font-black text-3xl">${myVote}%</span>
          </div>
          <div class="flex flex-col text-right">
            <span class="text-white/50 text-[10px] font-black uppercase tracking-widest mb-1">Ton erreur</span>
            <span class="${colorClass} font-display font-black text-3xl">${myDiff} pts</span>
          </div>
        </div>
      `;
  }

  // 2. Le Récapitulatif de tous les votes
  const sortedPlayers = connectedArr(r).sort((a, b) => {
      if(a.id === res.targetId) return -1; if(b.id === res.targetId) return 1; return 0;
  });
  
  const recapList = sortedPlayers.map(p => {
       const v = (r.votes || {})[p.id];
       const isTarget = p.id === res.targetId;
       let voteText = v !== undefined ? `${v}%` : "Pas voté";
       if(isTarget) voteText = `🎯 ${res.targetVote}%`;
       
       return `<div class="flex justify-between items-center p-3 border-b border-white/5 last:border-0 ${isTarget ? 'bg-white/5 rounded-xl border-none mb-2' : ''}">
         <div class="flex items-center gap-3">
           <div class="w-8 h-8 rounded-full flex items-center justify-center text-xs font-black text-white ring-1 ring-white/30" style="background:${getAvatarGradient(p.name)}">${esc((p.name || "A")[0].toUpperCase())}</div>
           <span class="text-sm font-bold ${isTarget ? 'text-white' : 'text-white/80'}">${esc(p.name)}</span>
         </div>
         <span class="font-black text-lg ${isTarget ? 'text-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.8)]' : 'text-white'}">${voteText}</span>
       </div>`;
  }).join("");

  // 3. Affichage du verdict (Qui boit)
  let sipsSentence = ""; let glowColor = "";
  if (res.isClose) {
      sipsSentence = `<span class="text-yellow-400 font-black block text-4xl uppercase tracking-tighter mt-1 drop-shadow-[0_0_25px_rgba(250,204,21,1)]">DANS LE MILLE 🎯<br><span class="text-xl text-white mt-2 block drop-shadow-md">La team boit ${res.sips} gorgée${res.sips > 1 ? 's' : ''} 🍻</span></span>`;
      glowColor = "border-yellow-400/60 shadow-[0_0_80px_rgba(250,204,21,0.3)] bg-black/80";
  } else {
      sipsSentence = `<span class="text-red-500 font-black block text-4xl uppercase tracking-tighter mt-1 drop-shadow-[0_0_25px_rgba(239,68,68,1)]">AÏE COUP DUR 📉<br><span class="text-xl text-white mt-2 block drop-shadow-md">${esc(res.drinkerName)} boit ${res.sips} gorgée${res.sips > 1 ? 's' : ''} 🍻</span></span>`;
      glowColor = "border-red-500/60 shadow-[0_0_80px_rgba(239,68,68,0.3)] bg-black/80";
  }

  // 4. Interface unifiée pour l'Hôte et les Joueurs
  const hostControls = isHost ? `
    <div class="flex gap-3 mt-4 w-full animate-fade">
      <button id="nextB" class="${btnPrimary} flex-grow">${r.maxRounds > 0 && r.round >= r.maxRounds ? '🏁 Le Classement' : 'Enchaîner ! ➡️'}</button>
      <button onclick="window.endGame()" class="py-4 px-6 rounded-2xl bg-red-500/20 border-2 border-red-500/50 text-red-200 font-bold active:scale-95 shadow-lg text-2xl" title="Arrêter de jouer">🛑</button>
    </div>
  ` : "";

  return `<div class="flex-1 flex flex-col gap-6 animate-up pb-8">
    <div class="text-center pt-2"><p class="text-white/50 text-[10px] font-black uppercase tracking-widest shadow-sm">L'avis du groupe sur</p><h2 class="text-4xl font-black uppercase text-white tracking-tight mt-1 drop-shadow-lg">${esc(res.targetName)}</h2></div>
    
    <div class="text-center animate-pop my-2 h-24 flex items-center justify-center"><span id="reveal-avg" class="font-display text-white font-black leading-none drop-shadow-[0_15px_40px_rgba(255,255,255,0.8)] blur-xl opacity-0 transition-all duration-[2000ms] text-[28vw]">0%</span></div>
    
    <div id="reveal-details" class="opacity-0 transition-opacity duration-700 flex flex-col gap-6">
      <div class="glass-card border-2 rounded-3xl p-7 flex flex-col items-center text-center gap-5 ${glowColor}">
        <div class="flex w-full justify-around items-center">
          <div class="flex flex-col"><span class="text-white/50 text-[10px] font-black uppercase tracking-widest mb-1">La réalité</span><span class="text-6xl font-display font-black text-white drop-shadow-xl">${res.targetVote}%</span></div>
          <div class="w-px h-16 bg-white/20"></div>
          <div class="flex flex-col"><span class="text-white/50 text-[10px] font-black uppercase tracking-widest mb-1">Écart global</span><span class="text-6xl font-display font-black text-white drop-shadow-xl">${res.diff}<span class="text-2xl text-white/50 ml-1">pts</span></span></div>
        </div>
        <div class="w-full h-px bg-white/20"></div>
        <div class="text-center leading-relaxed font-bold text-lg w-full bg-black/50 p-5 rounded-2xl border border-white/10 shadow-inner">${sipsSentence}</div>
        ${myStatsHtml}
      </div>
      
      <div class="w-full glass-card bg-black/60 rounded-3xl p-6 border border-white/20 shadow-2xl">
        <h4 class="text-[10px] text-white/50 font-black uppercase tracking-widest mb-4 text-center">Ce qu'ils ont mis 🧐</h4>
        <div class="max-h-48 overflow-y-auto scroll pr-2">
          ${recapList}
        </div>
      </div>
      
      <div class="w-full glass-card bg-black/50 rounded-3xl p-6 text-center flex flex-col items-center justify-center shadow-2xl border border-white/20 mt-2">
         <span class="text-white/70 font-bold mb-1">${isHost ? "T'es le boss, lance la suite quand t'es prêt 👇" : "<span class='animate-pulse text-2xl inline-block'>⏳</span><br>On attend le boss pour la suite..."}</span>
         ${hostControls}
      </div>
    </div>
  </div>`; 
}

function renderStats(r, t) { 
  const rk = r.ranking; const isHost = S.pid === r.hostId;
  return `<div class="flex-1 flex flex-col gap-6 animate-up pb-8">
    <div class="text-center pt-4"><h2 class="text-5xl font-black mb-2 text-white tracking-tighter drop-shadow-xl">FIN DU GAME 🏁</h2></div>
    
    <div class="bg-black/80 backdrop-blur-xl rounded-[2rem] p-8 text-center shadow-[0_15px_50px_rgba(250,204,21,0.3)] border-2 border-yellow-500/50 relative overflow-hidden mt-4">
      <div class="absolute -top-10 -right-10 text-9xl opacity-20 blur-sm">👑</div>
      <span class="text-yellow-400 text-[10px] font-black uppercase tracking-widest block mb-2 relative z-10">Le devin de la soirée</span>
      <p class="text-5xl font-black text-white relative z-10 drop-shadow-md">👑 ${esc(rk.winner.name)}</p>
      <p class="text-white/80 text-sm mt-3 font-black uppercase tracking-widest relative z-10 bg-black/60 inline-block px-4 py-2 rounded-full border border-white/10">${rk.winner.score} pts d'erreur au total</p>
    </div>
    
    <div class="bg-black/80 backdrop-blur-xl rounded-[2rem] p-8 text-center shadow-[0_15px_50px_rgba(239,68,68,0.3)] border-2 border-red-500/50 relative overflow-hidden mt-4">
      <div class="absolute -top-10 -left-10 text-9xl opacity-20 blur-sm">🤡</div>
      <span class="text-red-400 text-[10px] font-black uppercase tracking-widest block mb-2 relative z-10">À l'ouest complet</span>
      <p class="text-5xl font-black text-white relative z-10 drop-shadow-md">🤡 ${esc(rk.loser.name)}</p>
      <p class="text-white/80 text-sm mt-3 font-black uppercase tracking-widest relative z-10 bg-black/60 inline-block px-4 py-2 rounded-full border border-white/10">${rk.loser.score} pts dans le vent !</p>
    </div>
    
    <div class="mt-6">
      ${isHost ? `<button id="restartB" class="${btnPrimary} py-5 text-xl">🔄 Rejouer</button>` : `<div class="glass-card bg-black/60 rounded-3xl p-6 text-center text-white/70 font-black uppercase tracking-widest shadow-2xl border border-white/20">Merci d'avoir joué ! Santé 🍻</div>`}
    </div>
  </div>`; 
}

let afterRenderHook = null;
export function onAfterRender(fn) { afterRenderHook = fn; }

let lastViewKey = null;
export function render() {
  applyBg(); const app = document.getElementById("app"); const t = theme(); let body = "";
  if (S.screen === "HOME") body = renderHome(t);
  else if (S.room) {
    if (S.room.phase === "LOBBY") body = renderLobby(S.room, t);
    else if (S.room.phase === "VOTING") body = renderVoting(S.room, t);
    else if (S.room.phase === "REVEAL") body = renderReveal(S.room, t);
    else if (S.room.phase === "STATS") body = renderStats(S.room, t);
  }
  const html = header() + body;
  // Anti-flicker : on ne re-render que si le contenu a réellement changé.
  // Préserve le focus/curseur des inputs ET le slider en cours de manipulation.
  if (app.__html === html) return;

  const active = document.activeElement;
  const activeId = active && active.id ? active.id : null;
  const selStart = active && 'selectionStart' in active ? active.selectionStart : null;
  const selEnd = active && 'selectionEnd' in active ? active.selectionEnd : null;

  app.innerHTML = html;
  app.__html = html;

  // Animation d'entrée uniquement lors d'un VRAI changement d'écran
  const viewKey = S.screen === "HOME" ? "HOME" : (S.room ? S.room.phase : "");
  if (viewKey !== lastViewKey) {
    lastViewKey = viewKey;
    const root = app.lastElementChild;
    if (root) root.classList.add("view-enter");
  }

  if (activeId) {
    const n = document.getElementById(activeId);
    if (n) { try { n.focus({ preventScroll: true }); if (selStart != null && n.setSelectionRange) n.setSelectionRange(selStart, selEnd); } catch (e) {} }
  }

  if (afterRenderHook) afterRenderHook();
}
