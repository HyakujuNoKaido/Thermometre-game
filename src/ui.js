import { S, THEMES, JOKERS, esc, connectedArr, playersArr, haptic } from './store.js';
import { icons } from './icons/index.js';
import { activateCounter } from './game.js';

export function toast(msg, ok=false) { 
  const el = document.createElement("div"); 
  el.className = `fixed top-[6rem] left-1/2 -translate-x-1/2 px-6 py-3 luxury-card border border-${ok ? 'white/40' : 'red-500/40'} text-center shadow-2xl z-50 fade-in pointer-events-none`; 
  el.innerHTML = `<span class="font-mono text-[10px] uppercase tracking-widest text-white">${msg}</span>`;
  document.getElementById("toasts").appendChild(el); 
  setTimeout(() => { el.classList.remove('fade-in'); el.classList.add('fade-out'); setTimeout(() => el.remove(), 600); }, 2500); 
}

export function showSmashAlert(action) {
  const container = document.getElementById("smash-alert");
  if (!container) return;
  const iconEl = document.getElementById("smash-icon");
  const titleEl = document.getElementById("smash-title");
  const subEl = document.getElementById("smash-subtitle");

  let title = "POUVOIR ENGAGÉ";
  let sub = `${esc(action.actor)} active son privilège`;
  let color = "var(--accent)"; 
  let iconSvg = icons.logo("w-20 h-20 sm:w-28 sm:h-28 mx-auto text-white opacity-80");

  if (action.type === "SHOT") {
      title = "CUL SEC CIBLÉ";
      sub = `${esc(action.actor)} cible ${esc(action.target)}`;
      iconSvg = icons.alert("w-16 h-16 mx-auto text-white");
  } else if (action.type === "THIEF") {
      title = "VOL DE PRIVILÈGE";
      sub = `${esc(action.actor)} dépouille ${esc(action.target)}`;
      iconSvg = icons.thief("w-16 h-16 mx-auto text-white");
  } else if (action.type === "SHIELD") {
      title = "IMMUNITÉ ACTIVÉE";
      sub = `${esc(action.actor)} est intouchable`;
      iconSvg = icons.shield("w-16 h-16 mx-auto text-white");
  } else if (action.type === "DOUBLE") {
      title = "RISQUE MAXIMAL";
      sub = `${esc(action.actor)} double les enjeux`;
      iconSvg = icons.double("w-16 h-16 mx-auto text-white");
  } else if (action.type === "MIRROR") {
      title = "RÉFLEXION";
      sub = `${esc(action.actor)} prépare un renvoi`;
      iconSvg = icons.mirror("w-16 h-16 mx-auto text-white");
  } else if (action.type === "COUNTER") {
      title = "RIPOSTE IMMÉDIATE";
      sub = `${esc(action.actor)} contre-attaque !`;
      iconSvg = action.joker === 'SHIELD' ? icons.shield("w-16 h-16 mx-auto text-white") : icons.mirror("w-16 h-16 mx-auto text-white");
  }

  if(iconEl) iconEl.innerHTML = iconSvg;
  if(titleEl) {
      titleEl.textContent = title;
      titleEl.style.color = color;
  }
  if(subEl) {
      subEl.textContent = sub;
  }

  container.classList.remove("hidden");
  container.classList.add("fade-in");

  setTimeout(() => { 
    container.classList.remove("fade-in");
    container.classList.add("fade-out");
    setTimeout(() => {
        container.classList.add("hidden");
        container.classList.remove("fade-out");
    }, 600);
  }, 2800);
}

export function confirmCounter() {
  document.getElementById("counterModal").classList.add("hidden");
  activateCounter();
}
export function ignoreCounter() {
  document.getElementById("counterModal").classList.add("hidden");
}

window.confirmCounter = confirmCounter;
window.ignoreCounter = ignoreCounter;

export function toggleRules() {
  const modal = document.getElementById('rulesModal');
  if (!modal) return;
  if (modal.classList.contains('hidden')) {
    modal.classList.remove('hidden');
  } else {
    modal.classList.add('hidden');
  }
}

function applyBg() { 
  const t = THEMES[(S.room && S.room.mode) || S.pendingMode] || THEMES.Chill;
  document.documentElement.style.setProperty('--accent', t.accent);
}

export function updateThermometerColor(val) {
  const sv = document.getElementById("sv");
  const bub = document.getElementById("thumb-bubble");
  if (sv) sv.textContent = val + "%";
  if (bub) bub.textContent = val + "%";
}

function renderHome(t) { 
  let tableOptions = "";
  try {
    const tablePlayers = JSON.parse(localStorage.getItem('ja_players')) || [];
    if (tablePlayers.length > 0) {
      tableOptions = `<div class="flex gap-2 overflow-x-auto scroll pb-2 mt-2">` + 
        tablePlayers.map(p => `<button onclick="document.getElementById('nameI').value='${esc(p.name)}'; document.getElementById('nameI').dispatchEvent(new Event('input'))" class="px-3 py-1.5 text-[9px] font-mono border border-white/10 hover:border-white/40 text-white/60 transition-colors uppercase whitespace-nowrap">${esc(p.name)}</button>`).join('')
      + `</div>`;
    }
  } catch(e) {}

  return `<div class="flex-1 flex flex-col justify-center pb-8 mt-12 animate-pop">
    <div class="text-center mb-10">
      <h1 class="text-4xl font-display font-light tracking-[0.1em] uppercase text-white mb-2">Le <span style="color:${t.accent}">Thermo</span>mètre</h1>
      <p class="font-mono text-[9px] text-white/40 uppercase tracking-[0.4em]">Évaluer . Sanctionner . Répéter</p>
    </div>

    <div class="luxury-card p-6 flex flex-col gap-6 mb-6">
      <div class="flex flex-col gap-2">
        <label class="text-white/50 font-mono text-[9px] uppercase tracking-[0.2em]">Identité (La Table)</label>
        <input id="nameI" maxlength="15" placeholder="VOTRE NOM" value="${esc(S.name)}" class="w-full bg-transparent border-b border-white/20 px-2 py-3 text-xl font-display font-light outline-none focus:border-white transition-colors text-white uppercase placeholder:text-white/20"/>
        ${tableOptions}
      </div>
      
      <div class="flex flex-col gap-3 mt-4">
        <label class="text-white/50 font-mono text-[9px] uppercase tracking-[0.2em]">Atmosphère</label>
        <div class="grid grid-cols-3 gap-3">
          ${Object.keys(THEMES).map(m => {
            const act = S.pendingMode === m; const tm = THEMES[m];
            return `<button onclick="window.pickMode('${m}'); window.haptic('light');" class="py-4 border transition-all ${act ? `border-[${tm.accent}] text-white bg-white/5` : 'border-white/10 text-white/30'} flex flex-col items-center gap-2 rounded-sm">
              <span style="color:${act ? tm.accent : 'currentColor'}">${tm.icon("w-5 h-5")}</span>
              <span class="font-mono text-[9px] tracking-widest uppercase">${tm.label}</span>
            </button>`;
          }).join("")}
        </div>
      </div>
      <button id="createB" class="w-full py-4 mt-4 luxury-btn" style="border-color:${t.accent}; color:${t.accent}" ${S.isLoading ? 'disabled' : ''}>Ouvrir le salon</button>
    </div>

    <div class="luxury-card p-4 flex flex-row gap-4 items-center">
      <input id="joinI" maxlength="4" placeholder="ROOM" value="${esc(S.joinCode)}" class="flex-1 min-w-0 bg-transparent border-none px-2 py-2 text-xl font-mono tracking-[0.3em] text-center uppercase outline-none text-white placeholder:text-white/10"/>
      <button id="joinB" class="py-3 px-6 border border-white/20 text-[9px] font-mono uppercase tracking-widest hover:bg-white/10 transition-all text-white rounded-sm" ${S.isLoading ? 'disabled' : ''}>Rejoindre</button>
    </div>
  </div>`; 
}

function renderLobby(r, t) { 
  const isHost = S.pid === r.hostId; const ps = playersArr(r); const me = r.players[S.pid]; const myJoker = JOKERS[me.joker];
  const currentMax = r.maxRounds || 10;
  
  let roundsSelectorUi = "";
  if (isHost) {
    roundsSelectorUi = `
      <div class="luxury-card p-5 flex flex-col gap-4 mt-4">
        <h2 class="text-[9px] font-mono uppercase tracking-[0.2em] text-white/50">Questions</h2>
        <div class="grid grid-cols-4 gap-2">
          ${[5, 10, 15, 0].map(num => `<button onclick="window.changeMaxRounds(${num})" class="py-3 font-mono text-xs border transition-all rounded-sm ${currentMax === num || (num === 0 && r.maxRounds === 0) ? `border-[${t.accent}] text-white bg-white/5` : 'border-white/10 text-white/40'}">${num === 0 ? 'INF' : num}</button>`).join("")}
        </div>
      </div>
    `;
  }

  const jokerSection = isHost ? `
    <div class="luxury-card p-5 flex flex-col gap-3 mt-4">
      <div class="flex justify-between items-center">
         <h2 class="text-[9px] font-mono uppercase tracking-[0.2em] text-white/50">Privilèges</h2>
         <button onclick="window.randomizeJokers()" class="text-[9px] font-mono uppercase tracking-widest text-white/60 hover:text-white border border-white/20 px-3 py-1.5 rounded-sm transition-colors">Mélanger</button>
      </div>
      <p class="text-[10px] text-white/40 font-mono mt-2 leading-relaxed">Le maître de cérémonie peut réattribuer individuellement les privilèges des invités ci-dessous.</p>
    </div>
  ` : `
    <div class="luxury-card p-5 flex items-center gap-5 mt-4">
      <div class="w-12 h-12 shrink-0 border border-white/20 flex items-center justify-center text-white" style="color:${t.accent}">${myJoker ? myJoker.icon("w-6 h-6") : ''}</div>
      <div class="flex flex-col min-w-0 gap-1">
        <span class="text-[9px] font-mono uppercase tracking-[0.2em] text-white/50">Votre privilège</span>
        <span class="text-sm font-display font-light text-white tracking-widest uppercase">${myJoker ? esc(myJoker.name) : 'AUCUN'}</span>
        <span class="text-[10px] text-white/40 font-mono leading-snug">${myJoker ? esc(myJoker.desc) : ''}</span>
      </div>
    </div>
  `;

  return `<div class="flex-1 flex flex-col pb-8 mt-10">
    <div class="flex justify-between items-center mb-6 px-2">
      <button onclick="window.toggleRules()" class="font-mono text-[9px] uppercase tracking-widest text-white/50 border border-white/10 px-3 py-1.5 rounded-sm hover:text-white transition-colors">Règlement</button>
      <button onclick="window.quitGame()" class="font-mono text-[9px] uppercase tracking-widest text-red-500/80 border border-red-500/30 px-3 py-1.5 rounded-sm hover:text-red-500 transition-colors">Quitter</button>
    </div>

    <div class="luxury-card p-6 text-center flex flex-col items-center justify-center gap-2">
      <span class="text-[9px] font-mono uppercase tracking-[0.3em] text-white/40">Code Accès</span>
      <span class="text-3xl font-mono font-light tracking-[0.3em] uppercase select-all" style="color:${t.accent}">ROOM: ${S.code}</span>
    </div>

    ${jokerSection}
    ${roundsSelectorUi}
    
    <div class="luxury-card p-5 flex flex-col gap-4 mt-4">
      <h2 class="text-[9px] font-mono uppercase tracking-[0.2em] text-white/50">Invités (${ps.length})</h2>
      <div class="flex flex-col gap-3 max-h-48 overflow-y-auto scroll pr-2">
        ${ps.map(p => `
          <div class="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
            <div class="flex items-center gap-4">
              <span class="font-display font-light text-white text-lg tracking-wide uppercase">${esc(p.name)}</span>
              ${p.id === S.pid ? `<span class="text-[8px] font-mono uppercase tracking-widest border border-white/20 text-white/60 px-2 py-0.5">Moi</span>` : ''}
            </div>
            ${isHost ? `<button onclick="window.cycleJoker('${p.id}')" class="text-white/40 hover:text-white transition-colors" title="Modifier le pouvoir">${JOKERS[p.joker]?.icon("w-5 h-5")}</button>` : `<div class="text-white/20">${JOKERS[p.joker]?.icon("w-5 h-5")}</div>`}
          </div>
        `).join("")}
      </div>
    </div>

    <div class="mt-6">
       ${connectedArr(r).length < 2 ? `<p class="font-mono text-[10px] text-center uppercase tracking-widest text-white/40 mb-4">Attente des invités...</p>` : ''}
       ${isHost ? `<button id="startB" class="w-full py-4 luxury-btn" style="border-color:${t.accent}; color:${t.accent}" ${connectedArr(r).length < 2 ? 'disabled' : ''}>Ouvrir les débats</button>` : (!isHost && connectedArr(r).length >= 2 ? `<p class="font-mono text-[10px] text-center uppercase tracking-widest text-white/40 animate-pulse">L'hôte configure le salon...</p>` : "")}
    </div>
  </div>`;
}

function renderVoting(r, t) { 
  const q = r.question; const voted = (r.votes || {})[S.pid] !== undefined;
  const roundCounter = r.maxRounds > 0 ? `Q.${r.round} / ${r.maxRounds}` : `Q.${r.round}`;
  const amTarget = q.targetId === S.pid;
  
  const me = r.players[S.pid];
  const myJokerStr = me.joker;
  const myJoker = JOKERS[myJokerStr];
  let jokerActionHtml = "";

  if (myJoker && !me.jokerConsumed) {
      if (myJokerStr === "THIEF") {
          const stealablePlayers = connectedArr(r).filter(p => p.id !== S.pid && p.joker && !p.jokerConsumed);
          if (stealablePlayers.length > 0) {
              jokerActionHtml = `<div class="w-full luxury-card p-4 mb-4">
                  <span class="text-white/50 font-mono uppercase tracking-widest text-[9px] block mb-3">Subtiliser un privilège :</span>
                  <div class="flex gap-2 overflow-x-auto scroll pb-2">
                      ${stealablePlayers.map(p => `<button onclick="window.stealJoker('${p.id}')" class="shrink-0 px-4 py-2 border border-white/20 text-white font-mono text-[10px] uppercase tracking-widest hover:bg-white/10 transition-colors rounded-sm">${esc(p.name)}</button>`).join("")}
                  </div>
              </div>`;
          } else {
              jokerActionHtml = `<div class="w-full border border-white/10 p-3 mb-4 text-center text-white/30 text-[9px] font-mono uppercase tracking-widest">Aucun privilège dérobable</div>`;
          }
      } else if (myJokerStr === "SHOT") {
          if (!me.jokerActive) {
              const attackablePlayers = connectedArr(r).filter(p => p.id !== S.pid);
              jokerActionHtml = `<div class="w-full luxury-card p-4 mb-4">
                  <span class="text-white/50 font-mono uppercase tracking-widest text-[9px] block mb-3">Assigner un CUL SEC :</span>
                  <div class="flex gap-2 overflow-x-auto scroll pb-2">
                      ${attackablePlayers.map(p => `<button onclick="window.assignShotTarget('${p.id}')" class="shrink-0 px-4 py-2 border border-white/20 text-white font-mono text-[10px] uppercase tracking-widest hover:bg-white/10 transition-colors rounded-sm">${esc(p.name)}</button>`).join("")}
                  </div>
              </div>`;
          } else {
              const targetName = r.players[me.shotTarget]?.name || "Inconnu";
              jokerActionHtml = `<button onclick="window.cancelShotTarget()" class="w-full py-4 luxury-card !bg-white/5 border border-white/10 text-white/50 font-mono text-[10px] uppercase tracking-widest mb-4 hover:text-white transition-colors">Cul sec programmé pour ${esc(targetName)} (Annuler)</button>`;
          }
      } else {
          if (!me.jokerActive) {
              jokerActionHtml = `<button onclick="window.toggleJoker()" class="w-full py-4 luxury-btn mb-4">Engager le privilège : ${esc(myJoker.name)}</button>`;
          } else {
              jokerActionHtml = `<button onclick="window.toggleJoker()" class="w-full py-4 luxury-card !bg-white/5 border border-white/10 text-white/50 font-mono text-[10px] uppercase tracking-widest mb-4 hover:text-white transition-colors">Privilège engagé (Annuler)</button>`;
          }
      }
  } else if (me.jokerConsumed) {
      jokerActionHtml = `<div class="w-full border border-white/10 p-3 mb-4 text-center text-white/30 text-[9px] font-mono uppercase tracking-widest">Privilège épuisé</div>`;
  }
  
  return `<div class="flex-1 flex flex-col justify-center gap-8 pb-8 mt-4 animate-pop">
    <div class="text-center pt-8 relative">
      <span class="absolute top-0 left-1/2 -translate-x-1/2 font-mono text-[9px] uppercase tracking-[0.2em] text-white/30 border border-white/10 px-3 py-1">${roundCounter}</span>
      <h2 class="text-3xl font-display font-light leading-snug mt-6 px-4">"${esc(q.text)}"</h2>
      ${amTarget ? `<span class="mt-4 inline-block text-[10px] font-mono uppercase tracking-widest border border-white/20 px-4 py-2" style="color:${t.accent}">Cible : Vous-même</span>` : ''}
    </div>

    ${!voted ? `
      ${jokerActionHtml}
      <div class="mt-4 flex flex-col items-center gap-8 px-4">
        <span id="sv" class="text-6xl font-mono font-light text-white tracking-tighter">${S.voteValue}%</span>
        
        <div class="relative w-full h-12 flex items-center">
          <input type="range" id="slider" min="0" max="100" value="${S.voteValue}" class="thermo-slider absolute inset-0 z-10" />
        </div>

        <button id="voteB" class="w-full py-4 luxury-btn mt-2" style="border-color:${t.accent}; color:${t.accent}">Sceller l'estimation</button>
      </div>
    ` : `
      <div class="mt-10 flex flex-col items-center">
        <span class="font-mono text-[9px] uppercase tracking-[0.2em] text-white/40 mb-6">Attente de la table</span>
        <div class="w-full luxury-card p-5 flex flex-col gap-2">
          ${connectedArr(r).map(p => {
            const hasV = (r.votes || {})[p.id] !== undefined;
            return `<div class="flex justify-between items-center py-3 border-b border-white/5 last:border-0"><span class="font-display font-light text-lg uppercase tracking-wide ${hasV ? 'text-white' : 'text-white/30'}">${esc(p.name)}</span> ${hasV ? `<span class="font-mono text-[10px] uppercase" style="color:${t.accent}">Validé</span>` : `<span class="font-mono text-[10px] text-white/30">Décision...</span>`}</div>`;
          }).join('')}
        </div>
      </div>
    `}
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
        <div class="mt-6 w-full p-4 border border-white/10 flex justify-between items-center">
          <span class="text-white/50 text-[10px] font-mono uppercase tracking-widest">Votre vote : <span class="text-white">${myVote}%</span></span>
          <span class="text-[10px] font-mono uppercase tracking-widest" style="color:${t.accent}">Écart : <span class="text-white">${myDiff} pts</span></span>
        </div>
      `;
  }

  let jokersLogHtml = "";
  if (res.usedJokersLog && res.usedJokersLog.length > 0) {
      jokersLogHtml = res.usedJokersLog.map(log => {
          if (log.blocked) {
              return `<div class="w-full border border-white/20 p-3 mb-2 text-center text-white text-[10px] font-mono uppercase tracking-widest">
                <span style="color:${t.accent}">${esc(log.name)}</span> a utilisé son Bouclier contre ${esc(log.blocked)}
              </div>`;
          } else if (log.reflectedTo) {
              return `<div class="w-full border border-white/20 p-3 mb-2 text-center text-white text-[10px] font-mono uppercase tracking-widest">
                <span style="color:${t.accent}">${esc(log.name)}</span> a renvoyé l'attaque sur ${esc(log.reflectedTo)}
              </div>`;
          }
          return `<div class="w-full border border-white/20 p-3 mb-2 text-center text-white text-[10px] font-mono uppercase tracking-widest">
            <span style="color:${t.accent}">${esc(log.name)}</span> a engagé son pouvoir
          </div>`;
      }).join("");
  }

  let jokerShotVictimsHtml = "";
  if (res.jokerShotVictims && res.jokerShotVictims.length > 0) {
      jokerShotVictimsHtml = res.jokerShotVictims.map(v => {
          if (v.originalTarget) {
               return `<div class="w-full border border-white/40 p-4 mb-3 text-center text-white font-mono uppercase tracking-[0.2em] text-xs">
                Miroir : ${esc(v.name)} subit son propre CUL SEC (Cible intiale : ${esc(v.originalTarget)})
              </div>`;
          }
          return `<div class="w-full border border-red-500/50 p-4 mb-3 text-center text-white font-mono uppercase tracking-[0.2em] text-xs">
            ${esc(v.name)} subit un CUL SEC (Ciblé)
          </div>`;
      }).join("");
  }

  let targetVerdictHtml = "";
  if (res.targetShot) {
    targetVerdictHtml = `<div class="w-full border border-red-500/50 p-5 text-center text-white font-display font-light tracking-[0.2em] flex flex-col gap-2 mt-4">
      <span class="text-xl">CUL SEC : ${esc(res.targetName).toUpperCase()}</span>
      <span class="text-[10px] font-mono text-white/60">Déni total (${res.targetDiff} pts d'écart)</span>
    </div>`;
  } else if (res.targetSips > 0) {
    targetVerdictHtml = `<div class="w-full border border-white/20 p-5 text-center text-white font-display font-light tracking-[0.2em] flex flex-col gap-2 mt-4">
      <span class="text-xl text-yellow-500">${esc(res.targetName).toUpperCase()} : ${res.targetSips} GORGÉE${res.targetSips > 1 ? 'S' : ''}</span>
      <span class="text-[10px] font-mono text-white/60">${res.targetMsg}</span>
    </div>`;
  } else {
    targetVerdictHtml = `<div class="w-full border border-white/20 p-5 text-center text-white font-display font-light tracking-[0.2em] flex flex-col gap-2 mt-4">
      <span class="text-xl" style="color:${t.accent}">${esc(res.targetName).toUpperCase()} : 0 GORGÉE</span>
      <span class="text-[10px] font-mono text-white/60">${res.targetMsg}</span>
    </div>`;
  }

  let groupVerdictHtml = "";
  const penalizedGroup = (res.groupResults || []).filter(p => p.sips > 0 || p.shot).sort((a,b) => b.diff - a.diff);
  
  if (penalizedGroup.length === 0) {
    groupVerdictHtml = `<div class="w-full border border-white/10 p-4 text-center text-white/50 font-mono text-[10px] uppercase tracking-widest mt-4">Le groupe est resté lucide (0 gorgée)</div>`;
  } else {
    const listHtml = penalizedGroup.map(p => {
      const penalty = p.shot ? "CUL SEC" : `${p.sips} gorgée${p.sips > 1 ? 's' : ''}`;
      return `<div class="flex justify-between items-center text-xs font-mono uppercase py-2 border-b border-white/5 last:border-0"><span class="text-white">${esc(p.name)} <span class="text-white/30 text-[9px]">(${p.diff} pts)</span></span> <span class="text-white/80">${penalty}</span></div>`;
    }).join("");
    groupVerdictHtml = `<div class="w-full border border-white/20 p-4 text-left mt-4">
      <span class="block text-center text-white/50 font-mono uppercase text-[9px] tracking-widest mb-4">Sanctions du groupe</span>
      ${listHtml}
    </div>`;
  }

  const recapList = connectedArr(r).map(p => {
       const v = (r.votes || {})[p.id];
       const isTarget = p.id === res.targetId;
       return `<div class="flex justify-between items-center py-2 border-b border-white/5 last:border-0 ${isTarget ? 'text-white' : 'text-white/60'}">
         <span class="text-sm font-display font-light uppercase tracking-wide">${esc(p.name)} ${isTarget ? '<span class="text-[9px] font-mono text-white/40 tracking-widest">(Cible)</span>' : ''}</span>
         <span class="font-mono text-lg" ${isTarget ? `style="color:${t.accent}"` : ''}>${v !== undefined ? v.toString().padStart(2, '0') + '%' : '---'}</span>
       </div>`;
  }).join("");

  const hostControls = isHost ? `
    <div class="flex flex-col gap-4 mt-6 w-full">
      <button id="nextB" class="w-full py-4 luxury-btn" style="border-color:${t.accent}; color:${t.accent}">${r.maxRounds > 0 && r.round >= r.maxRounds ? 'Bilan Final' : 'Question Suivante'}</button>
    </div>
  ` : `<p class="font-mono text-[10px] text-center uppercase tracking-widest text-white/40 mt-8">En attente de l'hôte...</p>`;

  return `<div class="flex-1 flex flex-col gap-5 pb-8 mt-6">
    <div class="text-center">
      <p class="text-white/40 text-[9px] font-mono uppercase tracking-[0.3em]">Le Verdict Social</p>
      <h2 class="text-2xl font-display font-light text-white tracking-[0.1em] mt-2 uppercase">${esc(res.targetName)} VS Le Groupe</h2>
    </div>
    
    <div class="text-center animate-pop mt-4 h-24 flex items-center justify-center">
      <span id="reveal-avg" class="font-mono font-light text-white opacity-0 text-7xl tracking-tighter">00</span>
    </div>
    
    <div id="reveal-details" class="flex flex-col opacity-0 transition-opacity duration-700">
      ${jokersLogHtml}
      ${jokerShotVictimsHtml}
      
      <div class="luxury-card p-6 flex flex-col items-center">
        <div class="flex w-full justify-around items-center">
          <div class="flex flex-col text-center gap-1">
            <span class="text-white/40 text-[9px] font-mono uppercase tracking-widest">La Moyenne</span>
            <span class="text-3xl font-mono text-white">${res.average}%</span>
          </div>
          <div class="w-px h-10 bg-white/10"></div>
          <div class="flex flex-col text-center gap-1">
            <span class="text-white/40 text-[9px] font-mono uppercase tracking-widest">La Cible</span>
            <span class="text-3xl font-mono" style="color:${t.accent}">${res.targetVote}%</span>
          </div>
        </div>
        
        ${targetVerdictHtml}
        ${groupVerdictHtml}
        ${myStatsHtml}
      </div>
      
      <div class="w-full luxury-card p-5 mt-4">
        <h4 class="text-[9px] text-white/40 font-mono uppercase tracking-[0.2em] mb-4 text-center">Évaluations Individuelles</h4>
        <div class="max-h-44 overflow-y-auto scroll pr-2">
          ${recapList}
        </div>
      </div>
      
      ${hostControls}
    </div>
  </div>`; 
}

function renderStats(r, t) { 
  const rk = r.ranking; const isHost = S.pid === r.hostId;
  return `<div class="flex-1 flex flex-col gap-6 pb-8 mt-10">
    <div class="text-center mb-4">
      <h2 class="text-3xl font-display font-light uppercase tracking-[0.2em] text-white">Fin de Session</h2>
    </div>
    
    <div class="luxury-card p-8 text-center flex flex-col items-center justify-center border border-white/20">
      <span class="text-[9px] font-mono uppercase tracking-[0.3em] text-white/50 mb-4">La plus grande lucidité</span>
      <p class="text-4xl font-display font-light text-white uppercase tracking-wider mb-4" style="color:${t.accent}">${esc(rk.winner.name)}</p>
      <span class="font-mono text-[10px] text-white/60 border border-white/10 px-4 py-2 uppercase">${rk.winner.score} pts d'erreur cumulés</span>
    </div>
    
    <div class="luxury-card p-8 text-center flex flex-col items-center justify-center mt-2 border border-white/5 opacity-80">
      <span class="text-[9px] font-mono uppercase tracking-[0.3em] text-white/40 mb-4">Déni absolu (Dernière place)</span>
      <p class="text-3xl font-display font-light text-white/80 uppercase tracking-wider mb-4">${esc(rk.loser.name)}</p>
      <span class="font-mono text-[10px] text-white/40 border border-white/10 px-4 py-2 uppercase">${rk.loser.score} pts d'erreur cumulés</span>
    </div>

    <div class="mt-8 border border-white/20 p-6 text-center">
      <span class="text-[9px] font-mono uppercase tracking-[0.2em] text-white/50 block mb-3">La Sentence Légitime</span>
      <p class="text-xs font-mono text-white leading-relaxed uppercase">
        <span style="color:${t.accent}">${esc(rk.winner.name)}</span> détient l'autorité absolue pour imposer une ultime sanction à <span>${esc(rk.loser.name)}</span>.
      </p>
    </div>
    
    <div class="mt-8">
      ${isHost ? `<button id="restartB" class="w-full py-4 luxury-btn" style="border-color:${t.accent}; color:${t.accent}">Nouvelle Session</button>` : `<p class="font-mono text-[10px] text-center uppercase tracking-[0.2em] text-white/40">Session clôturée</p>`}
    </div>
  </div>`; 
}

let afterRenderHook = null;
export function onAfterRender(fn) { afterRenderHook = fn; }

let lastViewKey = null;
let lastPromptedActionId = null; 

export function render() {
  applyBg(); const app = document.getElementById("app"); const t = THEMES[(S.room && S.room.mode) || S.pendingMode] || THEMES.Chill; let body = "";
  
  const viewKey = S.screen === "HOME" ? "HOME" : (S.room ? S.room.phase : "");
  const isNewView = viewKey !== lastViewKey;

  const r = S.room;
  if (r && r.lastAction && r.lastAction.type === 'SHOT' && r.lastAction.targetId === S.pid) {
      const me = r.players[S.pid];
      if (me && (me.joker === 'SHIELD' || me.joker === 'MIRROR') && !me.jokerConsumed && !me.jokerActive) {
          if (lastPromptedActionId !== r.lastAction.id) {
              lastPromptedActionId = r.lastAction.id;
              const modal = document.getElementById("counterModal");
              if (modal) {
                 document.getElementById("counter-desc").innerHTML = `${esc(r.lastAction.actor)} vous assigne un CUL SEC`;
                 const btn = document.getElementById("counter-btn-yes");
                 if (me.joker === 'SHIELD') {
                     btn.innerHTML = `Activer Immunité`;
                 } else {
                     btn.innerHTML = `Renvoyer (Miroir)`;
                 }
                 modal.classList.remove("hidden");
              }
          }
      }
  }

  if (S.screen === "HOME") body = renderHome(t);
  else if (S.room) {
    if (S.room.phase === "LOBBY") body = renderLobby(S.room, t);
    else if (S.room.phase === "VOTING") body = renderVoting(S.room, t);
    else if (S.room.phase === "REVEAL") body = renderReveal(S.room, t);
    else if (S.room.phase === "STATS") body = renderStats(S.room, t);
  }
  
  const html = body;
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
  }

  if (activeId) {
    const n = document.getElementById(activeId);
    if (n) { try { n.focus({ preventScroll: true }); if (selStart != null && n.setSelectionRange) n.setSelectionRange(selStart, selEnd); } catch (e) {} }
  }

  if (afterRenderHook) afterRenderHook();
}
