import { S, THEMES, JOKERS, esc, connectedArr, playersArr } from './store.js';
import { icons } from './icons/index.js';

export function toast(msg, ok=false) { 
  const el = document.createElement("div"); 
  el.className = `toast px-4 py-3 rounded-2xl font-black text-sm text-center shadow-[0_10px_30px_rgba(0,0,0,0.8)] ${ok ? 'bg-emerald-500 text-white' : 'bg-red-600 text-white'} backdrop-blur-md border border-white/30`; 
  el.textContent = msg; 
  document.getElementById("toasts").appendChild(el); 
  setTimeout(() => el.remove(), 3000); 
}

// LA FONCTION MANQUANTE QUI CAUSAIT L'ERREUR DE BUILD !
export function showSmashAlert(action) {
  const container = document.getElementById("smash-alert");
  if (!container) return;
  const iconEl = document.getElementById("smash-icon");
  const titleEl = document.getElementById("smash-title");
  const subEl = document.getElementById("smash-subtitle");

  let title = "POUVOIR !";
  let sub = `${esc(action.actor)} a engagé un pouvoir !`;
  let color = "rgba(168,85,247,0.9)"; // Violet par défaut
  let iconSvg = icons.logo("w-20 h-20 sm:w-28 sm:h-28 mx-auto drop-shadow-[0_0_30px_rgba(168,85,247,1)]");

  if (action.type === "SHOT") {
      title = "CUL SEC !";
      sub = `${esc(action.actor)} a ciblé ${esc(action.target)} !`;
      color = "rgba(220,38,38,0.9)";
      iconSvg = icons.alert("w-24 h-24 sm:w-32 sm:h-32 mx-auto drop-shadow-[0_0_30px_rgba(220,38,38,1)] text-white");
  } else if (action.type === "THIEF") {
      title = "VOL !";
      sub = `${esc(action.actor)} a dépouillé ${esc(action.target)} !`;
      color = "rgba(147,51,234,0.9)";
      iconSvg = icons.thief("w-24 h-24 sm:w-32 sm:h-32 mx-auto drop-shadow-[0_0_30px_rgba(147,51,234,1)] text-white");
  } else if (action.type === "SHIELD") {
      title = "BOUCLIER !";
      sub = `${esc(action.actor)} est intouchable`;
      color = "rgba(6,182,212,0.9)";
      iconSvg = icons.shield("w-24 h-24 sm:w-32 sm:h-32 mx-auto drop-shadow-[0_0_30px_rgba(6,182,212,1)] text-white");
  } else if (action.type === "DOUBLE") {
      title = "RISQUE X2 !";
      sub = `${esc(action.actor)} double les enjeux`;
      color = "rgba(234,179,8,0.9)";
      iconSvg = icons.double("w-24 h-24 sm:w-32 sm:h-32 mx-auto drop-shadow-[0_0_30px_rgba(234,179,8,1)] text-white");
  } else if (action.type === "MIRROR") {
      title = "MIROIR !";
      sub = `${esc(action.actor)} renvoie l'attaque`;
      color = "rgba(236,72,153,0.9)";
      iconSvg = icons.mirror("w-24 h-24 sm:w-32 sm:h-32 mx-auto drop-shadow-[0_0_30px_rgba(236,72,153,1)] text-white");
  }

  // On injecte le bon SVG dans le HTML
  if(iconEl) iconEl.innerHTML = iconSvg;

  if(titleEl) {
      titleEl.textContent = title;
      titleEl.style.textShadow = `0 0 30px ${color}, 0 0 70px ${color}`;
  }
  if(subEl) {
      subEl.textContent = sub;
      subEl.style.color = color.replace("0.9", "1"); 
  }

  container.classList.remove("hidden", "animate-smash-container");
  void container.offsetWidth; // Force le reflow
  container.classList.add("animate-smash-container");

  setTimeout(() => { container.classList.add("hidden"); }, 3400);
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
  
  // Répare l'espace noir iOS en colorant dynamiquement la racine du site !
  document.documentElement.style.setProperty('background-color', t.base, 'important');
  document.body.style.setProperty('background-color', 'transparent', 'important');
  
  // Met à jour les couleurs des nuages de fond
  if(bg) bg.style.backgroundColor = t.base; 
  if(b1) b1.style.backgroundColor = t.b1; 
  if(b2) b2.style.backgroundColor = t.b2; 
  if(b3) b3.style.backgroundColor = t.from;
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
  if (sv) sv.textContent = val + "%";
}

const btnPrimary = "w-full py-4 px-8 rounded-2xl btn-gold font-extrabold text-lg shadow-[0_0_35px_rgba(251,191,36,0.5)] active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-wider";

function modeBtns(cur, fn) { 
  return Object.keys(THEMES).map(m => {
    const t = THEMES[m]; const a = cur === m;
    return `<button onclick="window.${fn}('${m}')" class="flex flex-col items-center gap-2 py-4 rounded-2xl border-2 transition-all duration-300 ${a ? 'border-white/80 scale-105 shadow-[0_0_25px_rgba(255,255,255,0.3)]' : 'bg-black/40 border-white/10 text-white/40 hover:bg-white/10'}" ${a ? `style="background:linear-gradient(135deg, ${t.base}, rgba(0,0,0,0.9)); border-color: ${t.from}"` : ""}>
      <span class="text-4xl filter drop-shadow-lg flex items-center justify-center text-white">${t.icon("w-10 h-10")}</span><span class="text-[10px] font-black uppercase tracking-widest ${a ? 'text-white' : ''}">${t.label}</span>
    </button>`;
  }).join(""); 
}

function header() { 
  const t = theme();
  let jokerBadge = "";
  if (S.room && S.pid && S.room.phase !== "LOBBY" && S.room.players && S.room.players[S.pid]) {
      const me = S.room.players[S.pid];
      const myJoker = JOKERS[me.joker];
      if (myJoker && !me.jokerConsumed) {
          jokerBadge = `<div class="flex items-center gap-1.5 px-3 py-1.5 rounded-full ${me.jokerActive ? 'bg-purple-600 border border-purple-400 shadow-[0_0_15px_rgba(168,85,247,0.6)]' : 'bg-purple-600/30 border border-purple-500/50'} text-xs font-bold text-white transition-all">${myJoker.icon("w-4 h-4")} <span class="hidden sm:inline">${esc(me.jokerActive ? 'Pouvoir engagé' : esc(myJoker.name))}</span></div>`;
      } else if (me.jokerConsumed) {
          jokerBadge = `<div class="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/40 border border-white/10 text-xs font-bold text-white/40 transition-all">${myJoker ? myJoker.icon("w-4 h-4 opacity-40") : ''} <span class="hidden sm:inline">Épuisé</span></div>`;
      }
  }

  return `<header class="flex justify-between items-center mb-6 pt-2">
    <div class="flex items-center gap-3">
      <div class="p-2.5 rounded-2xl shadow-[0_10px_20px_rgba(0,0,0,0.5)] flex items-center justify-center text-white" style="background:linear-gradient(135deg,${t.from},${t.to})">
        ${icons.logo("w-6 h-6")}
      </div>
      <h1 class="text-3xl font-extrabold tracking-tighter text-white drop-shadow-md">Le <span style="background:linear-gradient(90deg,${t.from},${t.to});-webkit-background-clip:text;background-clip:text;color:transparent">Thermo</span>mètre</h1>
    </div>
    <div class="flex gap-2 items-center">
      ${jokerBadge}
      ${!S.room ? `<button onclick="window.toggleRules()" class="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white font-black border border-white/30 active:scale-95 transition-transform shadow-lg">${icons.help("w-5 h-5")}</button>` : ""}
      ${S.room && S.code ? `
        <span class="text-xs font-black bg-emerald-500 text-white px-3 py-1.5 rounded-full shadow-md tracking-wider flex items-center gap-1">${icons.hashtag("w-4 h-4")} ${S.code}</span> 
        <button onclick="window.quitGame()" class="px-3 py-1.5 rounded-full bg-red-500/20 text-red-400 font-bold border border-red-500/40 text-xs active:scale-95 transition-transform shadow-lg flex items-center">${icons.exit("w-4 h-4")}</button>
      ` : ""}
    </div>
  </header>`; 
}

function renderHome(t) { 
  return `<div class="view-content flex-1 flex flex-col justify-center pb-8">
    <div class="glass-card rounded-[2rem] p-7 flex flex-col gap-6 mb-6 shadow-[0_15px_40px_rgba(0,0,0,0.6)] border border-white/20">
      <div class="flex flex-col gap-2"><label class="text-white/70 font-black text-xs uppercase tracking-widest ml-1">Pseudonyme</label><input id="nameI" maxlength="15" placeholder="Ex: Alex" value="${esc(S.name)}" class="w-full bg-black/60 border-2 border-white/10 rounded-2xl px-5 py-4 text-xl font-bold outline-none focus:border-white/60 transition-colors placeholder:text-white/20 text-white shadow-inner"/></div>
      <div class="flex flex-col gap-2"><label class="text-white/70 font-black text-xs uppercase tracking-widest ml-1">Configuration de l'ambiance</label><div class="grid grid-cols-3 gap-3">${modeBtns(S.pendingMode, "pickMode")}</div></div>
      <button id="createB" class="${btnPrimary} mt-2" ${S.isLoading ? 'disabled' : ''}>${S.isLoading ? 'Création...' : 'Créer le salon'}</button>
    </div>
    <div class="glass-card rounded-[2rem] p-3 flex flex-row gap-3 items-center shadow-xl border border-white/10">
      <input id="joinI" maxlength="4" placeholder="CODE" value="${esc(S.joinCode)}" class="flex-1 min-w-0 bg-transparent border-none px-4 py-2 text-3xl font-display font-black tracking-[0.3em] text-center uppercase outline-none placeholder:text-white/10 placeholder:tracking-normal text-white"/>
      <button id="joinB" class="shrink-0 py-3 px-8 rounded-xl bg-white/10 border border-white/30 font-black uppercase tracking-wider hover:bg-white/20 active:scale-95 transition-all text-white shadow-lg" ${S.isLoading ? 'disabled' : ''}>Rejoindre</button>
    </div>
  </div>`; 
}

function renderLobby(r, t) { 
  const isHost = S.pid === r.hostId; const ps = playersArr(r); const me = r.players[S.pid]; const myJoker = JOKERS[me.joker];
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

  const jokerSection = isHost ? `
    <div class="glass-card rounded-3xl p-5 flex flex-col gap-3 shadow-xl border border-purple-500/30 bg-black/40 relative overflow-hidden">
      <div class="absolute -right-4 -top-4 w-24 h-24 bg-purple-500/20 blur-2xl rounded-full"></div>
      <div class="flex justify-between items-center z-10">
         <h2 class="text-[10px] font-black uppercase tracking-widest text-purple-300 ml-1">Distribution des Pouvoirs</h2>
         <button onclick="window.randomizeJokers()" class="text-[10px] bg-purple-500/20 text-purple-200 px-3 py-1.5 rounded-full border border-purple-500/40 active:scale-95 transition-transform font-bold">Tout Mélanger</button>
      </div>
      <p class="text-xs text-white/50 mb-1 z-10 font-medium">Appuyez sur le pouvoir d'un joueur plus bas pour le modifier individuellement.</p>
    </div>
  ` : `
    <div class="glass-card rounded-3xl p-5 flex items-center gap-4 shadow-xl border border-white/10 bg-black/40">
      <div class="w-14 h-14 shrink-0 rounded-2xl flex items-center justify-center text-white shadow-lg bg-purple-600/30 border border-purple-500/50">${myJoker ? myJoker.icon("w-7 h-7") : ''}</div>
      <div class="flex flex-col min-w-0">
        <span class="text-[10px] font-black uppercase tracking-widest text-purple-300">Ton privilège secret</span>
        <span class="text-lg font-black text-white leading-tight">${myJoker ? esc(myJoker.name) : 'Aucun'}</span>
        <span class="text-xs text-white/60 font-medium leading-snug">${myJoker ? esc(myJoker.desc) : ''}</span>
      </div>
    </div>
  `;

  const waitingText = connectedArr(r).length < 2 
       ? `<span class="text-white/70 font-bold block mb-1">${icons.refresh("w-5 h-5 animate-spin inline-block mr-1 align-middle")} En attente de partenaires...</span>`
       : `<span class="text-emerald-400 font-black block text-lg mb-1 drop-shadow-md">Équipe constituée</span>`;
  const guestWaitingText = !isHost && connectedArr(r).length >= 2 
       ? `<span class="text-white/50 font-bold text-sm mt-1 animate-pulse block">L'hôte configure le lancement...</span>` : "";
  const hostControls = isHost ? `<button id="startB" class="${btnPrimary} mt-3" ${connectedArr(r).length < 2 ? 'disabled' : ''}>Lancer la partie</button>` : "";

  return `<div class="view-content flex-1 flex flex-col gap-4 pb-8">
    <div class="glass-card rounded-3xl p-5 text-center border border-white/20 bg-black/50 shadow-xl flex flex-col items-center justify-center gap-1">
      <span class="text-[10px] font-black uppercase tracking-widest text-white/40">Code du salon</span>
      <span class="text-4xl font-display font-black text-emerald-400 tracking-widest my-1 select-all">${S.code}</span>
      <span class="text-[11px] text-white/40 font-medium bg-white/5 px-3 py-1 rounded-full border border-white/5 break-all">
        ${window.location.origin}?room=${S.code}
      </span>
    </div>

    ${jokerSection}
    
    ${isHost ? `<div class="glass-card rounded-3xl p-5 flex flex-col gap-3 shadow-xl border border-white/10 bg-black/40"><h2 class="text-[10px] font-black uppercase tracking-widest text-white/60 ml-1">Configuration du salon</h2><div class="grid grid-cols-3 gap-2">${modeBtns(r.mode, "chooseMode")}</div></div>` : ""}
    ${roundsSelectorUi}
    
    <div class="glass-card rounded-3xl p-5 flex flex-col gap-4 shadow-xl border border-white/10 bg-black/40">
      <h2 class="text-[10px] font-black uppercase tracking-widest text-white/60 ml-1">Membres du salon (${ps.length})</h2>
      <div class="flex flex-col gap-3 max-h-48 overflow-y-auto scroll pr-2">
        ${ps.map(p => `
          <div class="flex items-center justify-between p-3 rounded-2xl bg-black/60 border border-white/10 shadow-md">
            <div class="flex items-center gap-3">
              <div class="w-12 h-12 rounded-full flex items-center justify-center font-black text-white text-lg ring-2 ring-white/30 ring-offset-2 ring-offset-[#040B16]" style="background:${getAvatarGradient(p.name)}">${esc((p.name || "A")[0].toUpperCase())}</div>
              <span class="font-bold text-white text-lg">${esc(p.name)} ${p.id === S.pid ? '<span class="text-white/40 text-[10px] uppercase tracking-widest ml-2 bg-white/10 px-2 py-1 rounded-full">Moi</span>' : ''}</span>
            </div>
            <div class="flex items-center gap-2">
              ${isHost ? `<button onclick="window.cycleJoker('${p.id}')" class="w-10 h-10 rounded-full bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-white shadow-inner active:scale-90 transition-transform" title="Attribuer un autre pouvoir">${JOKERS[p.joker]?.icon("w-5 h-5") || '🎴'}</button>` : `<div class="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/50">${JOKERS[p.joker]?.icon("w-5 h-5") || '🎴'}</div>`}
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
  const q = r.question; const voted = (r.votes || {})[S.pid] !== undefined;
  const roundCounter = r.maxRounds > 0 ? `Question ${r.round} / ${r.maxRounds}` : `Question ${r.round}`;
  const amTarget = q.targetId === S.pid;
  
  const me = r.players[S.pid];
  const myJokerStr = me.joker;
  const myJoker = JOKERS[myJokerStr];
  let jokerActionHtml = "";

  if (myJoker && !me.jokerConsumed) {
      if (myJokerStr === "THIEF") {
          const stealablePlayers = connectedArr(r).filter(p => p.id !== S.pid && p.joker && !p.jokerConsumed);
          if (stealablePlayers.length > 0) {
              jokerActionHtml = `<div class="w-full bg-black/60 border border-purple-500/50 rounded-2xl p-4 mb-4 shadow-[0_0_20px_rgba(168,85,247,0.2)]">
                  <span class="text-purple-400 font-black uppercase tracking-widest text-[10px] block mb-3 flex items-center gap-2">${myJoker.icon("w-4 h-4")} Subtiliser le pouvoir de :</span>
                  <div class="flex gap-2 overflow-x-auto scroll pb-2">
                      ${stealablePlayers.map(p => `<button onclick="window.stealJoker('${p.id}')" class="shrink-0 px-4 py-2 bg-purple-600/30 border border-purple-500/50 rounded-xl text-white font-bold text-xs active:scale-95 transition-all">${esc(p.name)}</button>`).join("")}
                  </div>
              </div>`;
          } else {
              jokerActionHtml = `<div class="w-full bg-black/40 border border-white/10 rounded-2xl p-3 mb-4 text-center text-white/40 text-[10px] font-bold uppercase tracking-widest flex items-center justify-center gap-2">${myJoker.icon("w-4 h-4")} Aucun pouvoir dérobable</div>`;
          }
      } else if (myJokerStr === "SHOT") {
          if (!me.jokerActive) {
              const attackablePlayers = connectedArr(r).filter(p => p.id !== S.pid);
              jokerActionHtml = `<div class="w-full bg-black/60 border border-purple-500/50 rounded-2xl p-4 mb-4 shadow-[0_0_20px_rgba(168,85,247,0.2)]">
                  <span class="text-purple-400 font-black uppercase tracking-widest text-[10px] block mb-3 flex items-center gap-2">${myJoker.icon("w-4 h-4")} Asséner un CUL SEC ciblé à :</span>
                  <div class="flex gap-2 overflow-x-auto scroll pb-2">
                      ${attackablePlayers.map(p => `<button onclick="window.assignShotTarget('${p.id}')" class="shrink-0 px-4 py-2 bg-red-600/30 border border-red-500/50 rounded-xl text-white font-bold text-xs active:scale-95 transition-all">${esc(p.name)}</button>`).join("")}
                  </div>
              </div>`;
          } else {
              const targetName = r.players[me.shotTarget]?.name || "Inconnu";
              jokerActionHtml = `<button onclick="window.cancelShotTarget()" class="w-full py-4 rounded-2xl bg-white/5 border border-white/10 text-white/50 font-bold uppercase tracking-wider flex items-center justify-center gap-2 mb-4 active:scale-95 transition-all">${myJoker.icon("w-5 h-5 opacity-50")} Cul sec programmé pour ${esc(targetName)} (Annuler)</button>`;
          }
      } else {
          if (!me.jokerActive) {
              jokerActionHtml = `<button onclick="window.toggleJoker()" class="w-full py-4 rounded-2xl bg-gradient-to-r from-purple-600/40 to-pink-600/40 border border-purple-500/50 text-white font-black uppercase tracking-wider flex items-center justify-center gap-2 mb-4 shadow-[0_0_20px_rgba(168,85,247,0.3)] active:scale-95 transition-all">${myJoker.icon("w-6 h-6")} Engager mon pouvoir (${esc(myJoker.name)})</button>`;
          } else {
              jokerActionHtml = `<button onclick="window.toggleJoker()" class="w-full py-4 rounded-2xl bg-white/5 border border-white/10 text-white/50 font-bold uppercase tracking-wider flex items-center justify-center gap-2 mb-4 active:scale-95 transition-all">${myJoker.icon("w-5 h-5 opacity-50")} Pouvoir engagé (Annuler)</button>`;
          }
      }
  } else if (me.jokerConsumed) {
      jokerActionHtml = `<div class="w-full bg-black/40 border border-white/10 rounded-2xl p-3 mb-4 flex items-center justify-center gap-2 text-white/40 font-bold uppercase tracking-widest text-[10px]">${myJoker ? myJoker.icon("w-4 h-4 opacity-30") : ''} Unique privilège déjà consommé</div>`;
  }

  const waitingList = connectedArr(r).map(p => {
      const hasVoted = (r.votes || {})[p.id] !== undefined;
      return `<div class="flex items-center justify-between p-3 rounded-2xl border-2 transition-all ${hasVoted ? 'bg-white/10 border-white/20 shadow-lg scale-[1.02]' : 'bg-black/40 border-transparent opacity-60'}"><div class="flex items-center gap-3"><div class="w-10 h-10 rounded-full flex items-center justify-center font-black text-white ring-2 ring-white/20" style="background:${getAvatarGradient(p.name)}">${esc((p.name || "A")[0].toUpperCase())}</div><span class="font-bold text-white text-lg">${esc(p.name)}</span></div><div>${hasVoted ? `${icons.check("w-6 h-6 text-emerald-400 drop-shadow-md")}` : `${icons.refresh("w-6 h-6 text-white/50 animate-spin")}`}</div></div>`;
  }).join("");
  
  return `<div class="view-content flex-1 flex flex-col justify-center gap-6 pb-8">
    <div class="glass-card rounded-3xl p-8 text-center flex flex-col gap-4 relative overflow-hidden min-h-[200px] justify-center shadow-2xl bg-black/60 ${amTarget ? 'border-2 border-yellow-400/80 shadow-[0_0_50px_rgba(250,204,21,0.3)]' : 'border border-white/20'}">
      <div class="absolute top-4 left-0 right-0 flex justify-center">
         <span class="px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest bg-white/10 border border-white/20 text-white shadow-inner">${roundCounter}</span>
      </div>
      <div class="mt-6">
        ${amTarget ? `<span class="text-yellow-400 font-black text-xs uppercase tracking-widest block mb-3 animate-pulse drop-shadow-md">Évalue-toi toi-même ! 🤫</span>` : ``}
        <p class="text-2xl font-bold leading-relaxed text-white drop-shadow-lg">"${esc(q.text)}"</p>
      </div>
    </div>
    ${!voted ? `
      ${jokerActionHtml}
      <div class="glass-card rounded-3xl p-6 flex flex-col gap-6 shadow-2xl border border-white/20 bg-black/60">
        <div class="flex justify-between items-end"><span class="font-black text-white/50 text-[10px] uppercase tracking-widest">${amTarget ? 'Sois honnête' : 'Tu penses à combien ?'}</span><span id="sv" class="text-7xl font-display font-black text-white drop-shadow-xl">${S.voteValue}%</span></div>
        <div class="relative h-20 rounded-full bg-black/80 shadow-[inset_0_5px_15px_rgba(0,0,0,0.5)] border-2 border-white/10 flex items-center px-2">
          <div id="fill" class="absolute left-2 h-16 rounded-full pointer-events-none" style="width: calc(${S.voteValue}% - 16px); background: ${t.b1}; transition: none !important;"></div>
          <input type="range" id="slider" min="0" max="100" value="${S.voteValue}" class="thermo-slider absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" style="touch-action: pan-x;" onpointerup="this.blur()" ontouchend="this.blur()" onmouseup="this.blur()" />
          <div id="thumb-bubble" class="thumb-bubble font-display pointer-events-none z-20" style="left:${S.voteValue}%;background:${t.b1};border-top-color:${t.b1}; transition: none !important;">${S.voteValue}%</div>
        </div>
      </div>
      <button id="voteB" class="${btnPrimary}">Valider la position <svg class="w-5 h-5 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg></button>
    ` : `<div class="glass-card rounded-3xl p-6 flex flex-col gap-4 shadow-2xl border border-white/10 bg-black/40"><div class="flex flex-col gap-3 max-h-[50vh] overflow-y-auto scroll pr-2">${waitingList}</div></div>`}
  </div>`; 
}

function renderReveal(r, t) { 
  const res = r.result; if (!res) return "";
  const isHost = S.pid === r.hostId; 
  const myVote = (r.votes || {})[S.pid];
  
  let myStatsHtml = "";
  if (S.pid !== res.targetId && myVote !== undefined) {
      const myDiff = Math.abs(myVote - res.average);
      myStatsHtml = `
        <div class="mt-4 w-full p-4 bg-black/40 border border-white/10 rounded-2xl flex justify-between items-center shadow-inner">
          <span class="text-white/60 text-xs font-bold uppercase tracking-wider">Ton Estimation : <b class="text-white text-sm">${myVote}%</b></span>
          <span class="text-cyan-400 text-xs font-bold uppercase tracking-wider">Ton Écart : <b class="text-white text-sm">${myDiff} pts</b></span>
        </div>
      `;
  }

  let jokersLogHtml = "";
  if (res.usedJokersLog && res.usedJokersLog.length > 0) {
      jokersLogHtml = res.usedJokersLog.map(log => {
          const j = JOKERS[log.joker];
          return `<div class="w-full bg-purple-600/30 border border-purple-500 rounded-2xl p-3 mb-2 text-center text-white font-bold shadow-[0_0_15px_rgba(168,85,247,0.3)] text-sm">
            <span class="inline-flex items-center gap-1.5">${j.icon("w-5 h-5")} <b>${esc(log.name)}</b> a engagé son pouvoir !</span>
          </div>`;
      }).join("");
  }

  let jokerShotVictimsHtml = "";
  if (res.jokerShotVictims && res.jokerShotVictims.length > 0) {
      jokerShotVictimsHtml = res.jokerShotVictims.map(v => {
          return `<div class="w-full bg-gradient-to-r from-red-600/50 to-orange-600/50 border border-red-500 rounded-2xl p-4 mb-3 text-center text-white font-black shadow-lg uppercase tracking-wide text-sm animate-pulse flex items-center justify-center gap-2">
            ${icons.alert("w-5 h-5 text-white animate-bounce")} <span>${esc(v.name)} a reçu un CUL SEC, une personne ayant utilisé son pouvoir l'a pris pour cible !</span>
          </div>`;
      }).join("");
  }

  let targetVerdictHtml = "";
  if (res.targetShot) {
    targetVerdictHtml = `<div class="w-full bg-red-600/40 border border-red-500 rounded-2xl p-4 text-center text-white font-bold shadow-lg flex flex-col items-center justify-center gap-1">${icons.alert("w-8 h-8 text-white animate-bounce")} <span>CUL SEC POUR ${esc(res.targetName).toUpperCase()} !</span> <span class="text-xs text-white/80 font-medium normal-case">Déni total (${res.targetDiff} pts d'écart).</span></div>`;
  } else if (res.targetSips > 0) {
    targetVerdictHtml = `<div class="w-full bg-yellow-500/20 border border-yellow-500/40 rounded-2xl p-4 text-center text-yellow-200 font-bold shadow-md">🎯 ${esc(res.targetName)} : ${res.targetSips} GORGÉE${res.targetSips > 1 ? 'S' : ''} <br><span class="text-xs text-white/60 font-medium normal-case">${res.targetMsg}</span></div>`;
  } else {
    targetVerdictHtml = `<div class="w-full bg-emerald-500/20 border border-emerald-500/40 rounded-2xl p-4 text-center text-emerald-200 font-bold shadow-md">✨ ${esc(res.targetName)} : 0 Gorgée <br><span class="text-xs text-white/60 font-medium normal-case">${res.targetMsg}</span></div>`;
  }

  let groupVerdictHtml = "";
  const penalizedGroup = (res.groupResults || []).filter(p => p.sips > 0 || p.shot).sort((a,b) => b.diff - a.diff);
  
  if (penalizedGroup.length === 0) {
    groupVerdictHtml = `<div class="w-full bg-emerald-500/20 border border-emerald-500/40 rounded-2xl p-3 text-center text-emerald-200 font-bold shadow-md mt-3">✨ Le groupe est resté soudé ! 0 gorgée.</div>`;
  } else {
    const listHtml = penalizedGroup.map(p => {
      const penalty = p.shot ? "CUL SEC" : `${p.sips} gorgée${p.sips > 1 ? 's' : ''}`;
      return `<div class="flex justify-between items-center text-sm border-b border-white/10 last:border-0 py-1.5"><span class="font-bold text-white">${esc(p.name)} <span class="text-white/40 text-[10px] font-normal">(${p.diff} pts d'erreur)</span></span> <span class="text-orange-300 font-black">${penalty}</span></div>`;
    }).join("");
    groupVerdictHtml = `<div class="w-full bg-orange-500/20 border border-orange-500/40 rounded-2xl p-4 text-left text-white shadow-md mt-3"><span class="block text-center text-orange-300 font-black uppercase text-[10px] tracking-widest mb-2 flex items-center justify-center gap-1">${icons.cheers("w-4 h-4")} Sanctions du groupe</span>${listHtml}</div>`;
  }

  const recapList = connectedArr(r).map(p => {
       const v = (r.votes || {})[p.id];
       const isTarget = p.id === res.targetId;
       return `<div class="flex justify-between items-center p-3 border-b border-white/5 last:border-0 ${isTarget ? 'bg-white/5 rounded-xl border-none mb-1' : ''}">
         <div class="flex items-center gap-3">
           <div class="w-8 h-8 rounded-full flex items-center justify-center text-xs font-black text-white" style="background:${getAvatarGradient(p.name)}">${esc((p.name || "A")[0].toUpperCase())}</div>
           <span class="text-sm font-bold text-white/80">${esc(p.name)} ${isTarget ? '(La Cible)' : ''}</span>
         </div>
         <span class="font-black text-lg ${isTarget ? 'text-yellow-400' : 'text-white'}">${v !== undefined ? v + '%' : '---'}</span>
       </div>`;
  }).join("");

  const hostControls = isHost ? `
    <div class="flex flex-col gap-3 mt-4 w-full">
      <button id="nextB" class="${btnPrimary}">${r.maxRounds > 0 && r.round >= r.maxRounds ? 'Tableau final' : 'Question suivante'}</button>
      <button onclick="window.endGame();" class="w-full py-3.5 px-6 rounded-2xl bg-red-600/20 hover:bg-red-600/40 border border-red-500/30 text-red-300 font-bold text-xs uppercase tracking-widest transition-all shadow-md" style="touch-action: manipulation;">
        Terminer la session
      </button>
    </div>
  ` : "";

  return `<div class="view-content flex-1 flex flex-col gap-5 pb-8">
    <div class="text-center pt-2"><p class="text-white/40 text-[10px] font-black uppercase tracking-widest">Le verdict social</p><h2 class="text-3xl font-black text-white tracking-tight mt-0.5">${esc(res.targetName)} face au groupe</h2></div>
    
    <div class="text-center animate-pop my-1 h-20 flex items-center justify-center"><span id="reveal-avg" class="font-display text-cyan-400 font-black leading-none drop-shadow-[0_15px_40px_rgba(34,211,238,0.8)] text-[24vw]">${res.average}%</span></div>
    
    <div id="reveal-details" class="flex flex-col gap-4">
      ${jokersLogHtml}
      ${jokerShotVictimsHtml}
      <div class="glass-card border rounded-3xl p-6 flex flex-col items-center shadow-2xl bg-black/70 border-white/10">
        
        <div class="flex w-full justify-around items-center">
          <div class="flex flex-col text-center">
            <span class="text-white/40 text-[10px] font-black uppercase tracking-widest mb-0.5">La Moyenne</span>
            <span class="text-4xl font-display font-black text-cyan-400 drop-shadow-md">${res.average}%</span>
          </div>
          <div class="w-px h-12 bg-white/10"></div>
          <div class="flex flex-col text-center">
            <span class="text-white/40 text-[10px] font-black uppercase tracking-widest mb-0.5">Note de la cible</span>
            <span class="text-4xl font-display font-black text-yellow-400 drop-shadow-md">${res.targetVote}%</span>
          </div>
        </div>
        
        <div class="w-full h-px bg-white/10 my-4"></div>
        ${targetVerdictHtml}
        ${groupVerdictHtml}
        ${myStatsHtml}
      </div>
      
      <div class="w-full glass-card bg-black/60 rounded-3xl p-5 border border-white/10 shadow-xl">
        <h4 class="text-[10px] text-white/40 font-black uppercase tracking-widest mb-3 text-center">Scores individuels</h4>
        <div class="max-h-44 overflow-y-auto scroll pr-2">
          ${recapList}
        </div>
      </div>
      
      <div class="w-full glass-card bg-black/50 rounded-3xl p-5 text-center flex flex-col items-center justify-center shadow-xl border border-white/10">
         <span class="text-white/60 text-xs font-bold mb-1">${isHost ? "Action requise du gérant" : "En attente du prochain tour..."}</span>
         ${hostControls}
      </div>
    </div>
  </div>`; 
}

function renderStats(r, t) { 
  const rk = r.ranking; const isHost = S.pid === r.hostId;
  return `<div class="view-content flex-1 flex flex-col gap-6 pb-8">
    <div class="text-center pt-4"><h2 class="text-5xl font-black mb-2 text-white tracking-tighter drop-shadow-xl">FIN DE SESSION</h2></div>
    
    <div class="bg-black/80 backdrop-blur-xl rounded-[2rem] p-8 text-center shadow-[0_15px_50px_rgba(250,204,21,0.3)] border-2 border-yellow-500/50 relative overflow-hidden mt-4">
      <div class="absolute -top-10 -right-10 text-9xl opacity-10 blur-sm">${icons.crown("w-24 h-24")}</div>
      <span class="text-yellow-400 text-[10px] font-black uppercase tracking-widest block mb-2 relative z-10">Grand vainqueur</span>
      <p class="text-5xl font-black text-white relative z-10 drop-shadow-md">${esc(rk.winner.name)}</p>
      <p class="text-white/80 text-sm mt-3 font-black uppercase tracking-widest relative z-10 bg-black/60 inline-block px-4 py-2 rounded-full border border-white/10">Le plus lucide : ${rk.winner.score} pts d'erreur !</p>
    </div>
    
    <div class="bg-black/80 backdrop-blur-xl rounded-[2rem] p-8 text-center shadow-[0_15px_50px_rgba(239,68,68,0.3)] border-2 border-red-500/50 relative overflow-hidden mt-4">
      <div class="absolute -top-10 -left-10 text-9xl opacity-10 blur-sm">${icons.clown("w-24 h-24")}</div>
      <span class="text-red-400 text-[10px] font-black uppercase tracking-widest block mb-2 relative z-10">Dernière place</span>
      <p class="text-5xl font-black text-white relative z-10 drop-shadow-md">${esc(rk.loser.name)}</p>
      <p class="text-white/80 text-sm mt-3 font-black uppercase tracking-widest relative z-10 bg-black/60 inline-block px-4 py-2 rounded-full border border-white/10">Le plus décalé : ${rk.loser.score} pts d'erreur !</p>
    </div>

    <div class="bg-gradient-to-br from-purple-600/50 to-pink-600/50 backdrop-blur-xl rounded-[2rem] p-6 text-center shadow-[0_15px_50px_rgba(168,85,247,0.3)] border-2 border-purple-400/50 relative overflow-hidden mt-2">
      <span class="text-purple-300 text-[10px] font-black uppercase tracking-widest block mb-1 relative z-10">La Sentence Finale</span>
      <p class="text-lg font-black text-white relative z-10 drop-shadow-md leading-snug">👑 <b>${esc(rk.winner.name)}</b> obtient le pouvoir absolu pour attribuer un gage de clôture ou imposer une sanction à <b>${esc(rk.loser.name)}</b> !</p>
    </div>
    
    <div class="mt-6">
      ${isHost ? `<button id="restartB" class="${btnPrimary} py-5 text-xl">Relancer une session</button>` : `<div class="glass-card bg-black/60 rounded-3xl p-6 text-center text-white/70 font-black uppercase tracking-widest shadow-2xl border border-white/20">Session clôturée</div>`}
    </div>
  </div>`; 
}

let afterRenderHook = null;
export function onAfterRender(fn) { afterRenderHook = fn; }

let lastViewKey = null;
export function render() {
  applyBg(); const app = document.getElementById("app"); const t = theme(); let body = "";
  
  const viewKey = S.screen === "HOME" ? "HOME" : (S.room ? S.room.phase : "");
  const isNewView = viewKey !== lastViewKey;

  if (S.screen === "HOME") body = renderHome(t);
  else if (S.room) {
    if (S.room.phase === "LOBBY") body = renderLobby(S.room, t);
    else if (S.room.phase === "VOTING") body = renderVoting(S.room, t);
    else if (S.room.phase === "REVEAL") body = renderReveal(S.room, t);
    else if (S.room.phase === "STATS") body = renderStats(S.room, t);
  }
  
  const html = header() + body;
  if (app.__html === html) return;

  const active = document.activeElement;
  const activeId = active && active.id ? active.id : null;
  
  if (activeId === "slider" && !isNewView) return; 

  const selStart = active && 'selectionStart' in active ? active.selectionStart : null;
  const selEnd = active && 'selectionEnd' in active ? active.selectionEnd : null;

  app.innerHTML = html;
  app.__html = html;

  if (isNewView) {
    lastViewKey = viewKey;
    const content = app.querySelector('.view-content');
    if (content) {
      void content.offsetWidth;
      content.classList.add('animate-view');
    }
  }

  if (activeId) {
    const n = document.getElementById(activeId);
    if (n) { try { n.focus({ preventScroll: true }); if (selStart != null && n.setSelectionRange) n.setSelectionRange(selStart, selEnd); } catch (e) {} }
  }

  if (afterRenderHook) afterRenderHook();
}
