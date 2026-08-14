import { S, THEMES, JOKERS, esc, connectedArr, playersArr, haptic } from './store.js';
import { icons } from './icons/index.js';

export function toast(msg, ok=false) { 
  const el = document.createElement("div"); 
  el.className = `fixed top-[6rem] left-1/2 -translate-x-1/2 px-6 py-3 luxury-card border border-${ok ? 'white/40' : 'red-500/40'} text-center shadow-2xl z-50 fade-in pointer-events-none`; 
  el.innerHTML = `<span class="font-display text-xs uppercase tracking-widest text-white">${msg}</span>`;
  document.getElementById("toasts").appendChild(el); 
  setTimeout(() => { el.classList.remove('fade-in'); el.classList.add('fade-out'); setTimeout(() => el.remove(), 600); }, 2500); 
}

// ALERTE VOLANTE (CARTE 3D ANIMÉE)
export function showSmashAlert(action) {
  const container = document.getElementById("smash-alert");
  if (!container) return;

  let title = "Privilège";
  let sub = `${esc(action.actor)} abat sa carte`;
  let color = "var(--accent)"; 
  let iconSvg = icons.logo("w-10 h-10");

  if (action.type === "SHOT") { title = "Ciblage"; sub = `${esc(action.actor)} condamne ${esc(action.target)}`; iconSvg = icons.shot("w-10 h-10"); color = "#ef4444"; } 
  else if (action.type === "THIEF") { title = "Vol"; sub = `${esc(action.actor)} dépouille ${esc(action.target)}`; iconSvg = icons.thief("w-10 h-10"); } 
  else if (action.type === "SHIELD") { title = "Immunité"; sub = `${esc(action.actor)} se protège`; iconSvg = icons.shield("w-10 h-10"); } 
  else if (action.type === "DOUBLE") { title = "Risque"; sub = `${esc(action.actor)} double la mise`; iconSvg = icons.double("w-10 h-10"); } 
  else if (action.type === "MIRROR") { title = "Réflection"; sub = `${esc(action.actor)} se prépare`; iconSvg = icons.mirror("w-10 h-10"); color = "#ec4899"; } 
  else if (action.type === "COUNTER") { title = "Riposte"; sub = `${esc(action.actor)} contre-attaque !`; iconSvg = action.joker === 'SHIELD' ? icons.shield("w-10 h-10") : icons.mirror("w-10 h-10"); color = "#06b6d4"; }

  container.innerHTML = `
    <div class="flex flex-col items-center justify-center w-full h-full relative z-10 pointer-events-none px-4">
       <div class="card-alert" style="box-shadow: 0 0 50px ${color}80; border: 1px solid ${color};">
          <span style="color:${color}" class="mb-3 drop-shadow-md">${iconSvg}</span>
          <span class="font-serif italic text-white text-xl tracking-wide px-2 text-center leading-none">${title}</span>
       </div>
       <div class="mt-6 text-center animate-pop bg-black/90 border border-white/20 px-4 py-2 rounded-sm shadow-2xl">
          <span class="font-display text-[10px] uppercase tracking-widest text-white">${sub}</span>
       </div>
    </div>
  `;

  container.classList.remove("hidden");
  // FORCE REFLOW : Garantit que l'animation CSS se joue à chaque appel
  void container.offsetWidth;

  setTimeout(() => { 
    container.classList.add("hidden");
    container.innerHTML = '';
  }, 2600); 
}

export function toggleRules() {
  const modal = document.getElementById('rulesModal');
  if (!modal) return;
  if (modal.classList.contains('hidden')) modal.classList.remove('hidden'); else modal.classList.add('hidden');
}

function applyBg() { 
  let t = THEMES[(S.room && S.room.mode) || S.pendingMode] || THEMES.Chill;
  const goldOverlay = document.getElementById("gold-overlay");
  
  if (S.room && S.room.angelRound) {
      t = { accent: "#FFD700" }; 
      if (goldOverlay) { goldOverlay.classList.remove("opacity-0"); goldOverlay.classList.add("opacity-30"); }
  } else {
      if (goldOverlay) { goldOverlay.classList.add("opacity-0"); goldOverlay.classList.remove("opacity-30"); }
  }
  document.documentElement.style.setProperty('--accent', t.accent);
}

function hexToRgb(hex) {
    var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? { r: parseInt(result[1], 16), g: parseInt(result[2], 16), b: parseInt(result[3], 16) } : {r: 255, g: 255, b: 255};
}

export function updateThermometerColor(val) {
  const t = THEMES[(S.room && S.room.mode) || S.pendingMode] || THEMES.Chill;
  const start = hexToRgb(t.accent);
  const end = {r: 255, g: 0, b: 60}; 
  const ratio = val <= 50 ? 0 : (val - 50) / 50; 
  const color = `rgb(${Math.round(start.r + (end.r - start.r) * ratio)}, ${Math.round(start.g + (end.g - start.g) * ratio)}, ${Math.round(start.b + (end.b - start.b) * ratio)})`;

  const sv = document.getElementById("sv");
  if (sv) {
      sv.textContent = val + "%";
      sv.style.color = color;
      sv.style.textShadow = `0 0 20px ${color}80`;
  }

  const fill = document.getElementById("slider-fill");
  if(fill) {
      fill.style.width = val + "%";
      fill.style.background = color;
      fill.style.boxShadow = `inset 0 2px 5px rgba(255,255,255,0.5), inset 0 -2px 5px rgba(0,0,0,0.5), 0 0 ${10 + (val/5)}px ${color}`;
  }
}

// GESTION DU TOUCHER SUR LA CARTE INTERACTIVE
window.flipTarotCard = function(e) {
  if (e) { e.stopPropagation(); e.preventDefault(); }
  const card = document.getElementById('tarot-card-interactive');
  if (card && !card.classList.contains('flipped')) {
      card.classList.add('flipped');
      if (window.haptic) window.haptic('light');
  }
};

window.unflipTarotCard = function(e) {
  if (e) { e.stopPropagation(); e.preventDefault(); }
  const card = document.getElementById('tarot-card-interactive');
  if (card) {
      card.classList.remove('flipped');
      if (window.haptic) window.haptic('light');
  }
};

window.confirmTarotAction = function(actionType, targetId, e) {
  if (e) { e.stopPropagation(); e.preventDefault(); }
  const card = document.getElementById('tarot-card-interactive');
  if(card) card.classList.add('consumed');
  if (window.haptic) window.haptic('medium');
  
  setTimeout(() => {
      if(actionType === 'toggle' && window.toggleJoker) window.toggleJoker();
      else if (actionType === 'shot' && window.assignShotTarget) window.assignShotTarget(targetId);
      else if (actionType === 'steal' && window.stealJoker) window.stealJoker(targetId);
  }, 600);
};

window.updateName = function(val) {
  S.name = val;
  sessionStorage.setItem('thermo_name', val);
  const ni = document.getElementById('nameI');
  if (ni && ni.value !== val) ni.value = val;
  const createB = document.getElementById('createB');
  if (createB) createB.disabled = S.isLoading || !val.trim();
}

window.updateJoinCode = function(val) {
  S.joinCode = val.toUpperCase();
  const ji = document.getElementById('joinI');
  if (ji && ji.value !== S.joinCode) ji.value = S.joinCode;
}

window.pickMode = function(m) {
  if (S.pendingMode === m) return;
  S.pendingMode = m;
  if (window.haptic) window.haptic('light');
  
  const t = THEMES[m];
  document.documentElement.style.setProperty('--accent', t.accent);

  Object.keys(THEMES).forEach(mode => {
      const btn = document.getElementById(`btn-mode-${mode}`);
      if (!btn) return;
      const tm = THEMES[mode];
      const act = (m === mode);
      const spanIcon = btn.querySelector('.mode-icon');
      
      if (act) {
          btn.className = "h-[88px] box-border border transition-all duration-500 glow-active text-white bg-white/5 flex flex-col items-center justify-center gap-2 rounded-sm";
          btn.style.borderColor = tm.accent;
          btn.style.boxShadow = `0 0 20px ${tm.accent}40`;
          if(spanIcon) spanIcon.style.color = tm.accent;
      } else {
          btn.className = "h-[88px] box-border border transition-all duration-500 border-white/10 text-white/30 flex flex-col items-center justify-center gap-2 rounded-sm";
          btn.style.borderColor = "rgba(255,255,255,0.1)";
          btn.style.boxShadow = "none";
          if(spanIcon) spanIcon.style.color = "currentColor";
      }
  });

  const createB = document.getElementById("createB");
  if (createB) {
      createB.style.borderColor = t.accent;
      createB.style.color = t.accent;
  }
}

function renderHome(t) { 
  let tableOptions = "";
  try {
    const tablePlayers = JSON.parse(localStorage.getItem('ja_players')) || [];
    if (tablePlayers.length > 0) {
      tableOptions = `<div class="flex gap-2 overflow-x-auto scroll pb-2 mt-2">` + 
        tablePlayers.map(p => `<button onclick="window.updateName('${esc(p.name)}')" class="px-3 py-1.5 text-xs font-display border border-white/10 hover:border-white/40 text-white/60 transition-colors uppercase whitespace-nowrap">${esc(p.name)}</button>`).join('')
      + `</div>`;
    }
  } catch(e) {}

  return `<div class="flex-1 flex flex-col justify-center pb-8 mt-12 animate-pop relative z-10">
    <div class="text-center mb-10">
      <h1 class="text-4xl font-serif italic tracking-wide text-white mb-2">Le <span style="color:var(--accent); transition: color 0.5s ease;">Thermo</span>mètre</h1>
      <p class="font-display text-[10px] text-white/40 uppercase tracking-widest">Évaluer. Sanctionner. Répéter.</p>
    </div>

    <div class="luxury-card p-6 flex flex-col gap-6 mb-6">
      <div class="flex flex-col gap-2">
        <label class="text-white/50 font-display text-[10px] uppercase tracking-widest">Identité à la table</label>
        <input id="nameI" oninput="window.updateName(this.value)" maxlength="15" placeholder="Votre nom" value="${esc(S.name)}" class="w-full bg-transparent border-b border-white/20 px-2 py-3 text-xl font-display outline-none focus:border-white transition-colors text-white uppercase placeholder:text-white/20 placeholder:capitalize"/>
        ${tableOptions}
      </div>
      
      <div class="flex flex-col gap-3 mt-4">
        <label class="text-white/50 font-display text-[10px] uppercase tracking-widest">Atmosphère</label>
        <div class="grid grid-cols-3 gap-3">
          ${Object.keys(THEMES).map(m => {
            const act = S.pendingMode === m; const tm = THEMES[m];
            return `<button id="btn-mode-${m}" onclick="window.pickMode('${m}')" class="h-[88px] box-border border transition-all duration-500 ${act ? `glow-active text-white bg-white/5` : 'border-white/10 text-white/30'} flex flex-col items-center justify-center gap-2 rounded-sm" ${act ? `style="border-color:${tm.accent}; box-shadow: 0 0 20px ${tm.accent}40;"` : 'style="border-color:rgba(255,255,255,0.1);"'}>
              <span class="mode-icon transition-colors duration-500" style="color:${act ? tm.accent : 'currentColor'}">${tm.icon("w-5 h-5")}</span>
              <span class="font-display text-xs tracking-widest uppercase">${tm.label}</span>
            </button>`;
          }).join("")}
        </div>
      </div>
      <button id="createB" onclick="window.createRoom()" class="w-full py-4 mt-4 luxury-btn transition-colors duration-500" style="border-color:var(--accent); color:var(--accent); font-weight:700;" ${S.isLoading || !S.name.trim() ? 'disabled' : ''}>Créer le salon</button>
    </div>

    <div class="luxury-card p-4 flex flex-row gap-4 items-center">
      <input id="joinI" oninput="window.updateJoinCode(this.value)" maxlength="4" placeholder="ROOM" value="${esc(S.joinCode)}" class="flex-1 min-w-0 bg-transparent border-none px-2 py-2 text-xl font-display tracking-[0.2em] text-center uppercase outline-none text-white placeholder:text-white/10"/>
      <button id="joinB" onclick="window.joinRoom()" class="py-3 px-6 border border-white/20 text-xs font-display uppercase tracking-widest hover:bg-white/10 transition-all text-white rounded-sm">Rejoindre</button>
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
        <h2 class="text-xs font-display uppercase tracking-widest text-white/50">Questions</h2>
        <div class="grid grid-cols-4 gap-2">
          ${[5, 10, 15, 0].map(num => `<button onclick="window.changeMaxRounds(${num})" class="h-[48px] box-border font-display text-xs border transition-all rounded-sm ${currentMax === num || (num === 0 && r.maxRounds === 0) ? `glow-active text-white bg-white/5` : 'border-white/10 text-white/40'}" ${(currentMax === num || (num === 0 && r.maxRounds === 0)) ? `style="border-color:${t.accent}; box-shadow: 0 0 15px ${t.accent}40"` : ''}>${num === 0 ? 'Infini' : num}</button>`).join("")}
        </div>
      </div>
    `;
  }

  const jokerSection = isHost ? `
    <div class="luxury-card p-5 flex flex-col gap-3 mt-4">
      <div class="flex justify-between items-center">
         <h2 class="text-xs font-display uppercase tracking-widest text-white/50">Privilèges</h2>
         <button onclick="window.randomizeJokers()" class="text-[10px] font-display uppercase tracking-widest text-white/60 hover:text-white border border-white/20 px-3 py-1.5 rounded-sm transition-colors">Battre les cartes</button>
      </div>
      <p class="text-xs text-white/40 font-display mt-2 leading-relaxed">Les privilèges sont distribués aléatoirement. L'hôte peut rectifier un tirage ci-dessous.</p>
    </div>
  ` : `
    <div class="luxury-card p-5 flex items-center gap-5 mt-4">
      <div class="w-12 h-12 shrink-0 border border-white/20 flex items-center justify-center text-white" style="color:${t.accent}">${myJoker ? myJoker.icon("w-6 h-6") : ''}</div>
      <div class="flex flex-col min-w-0 gap-1">
        <span class="text-[10px] font-display uppercase tracking-widest text-white/50">Votre Carte</span>
        <span class="text-sm font-serif italic text-white tracking-wide capitalize">${myJoker ? esc(myJoker.name) : 'Aucun'}</span>
        <span class="text-[11px] text-white/40 font-display leading-snug">La carte flottera à l'écran durant la partie.</span>
      </div>
    </div>
  `;

  return `<div class="flex-1 flex flex-col pb-8 mt-10 relative z-10">
    <div class="flex justify-between items-center mb-6 px-2">
      <button onclick="window.toggleRules()" class="font-display text-[10px] uppercase tracking-widest text-white/50 border border-white/10 px-3 py-1.5 rounded-sm hover:text-white transition-colors">L'Étiquette</button>
      <button onclick="window.quitGame()" class="font-display text-[10px] uppercase tracking-widest text-red-500/80 border border-red-500/30 px-3 py-1.5 rounded-sm hover:text-red-500 transition-colors">Quitter</button>
    </div>

    <div class="luxury-card p-6 text-center flex flex-col items-center justify-center gap-2">
      <span class="text-[10px] font-display uppercase tracking-widest text-white/40">Code d'accès</span>
      <span class="text-3xl font-serif italic tracking-wider uppercase select-all" style="color:${t.accent}">Room ${S.code}</span>
    </div>

    ${jokerSection}
    ${roundsSelectorUi}
    
    <div class="luxury-card p-5 flex flex-col gap-4 mt-4">
      <h2 class="text-xs font-display uppercase tracking-widest text-white/50">Les Invités (${ps.length})</h2>
      <div class="flex flex-col gap-3 max-h-48 overflow-y-auto scroll pr-2">
        ${ps.map(p => `
          <div class="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
            <div class="flex items-center gap-4">
              <span class="font-display font-light text-white text-lg capitalize tracking-wide ${p.connected === false ? 'opacity-40' : ''}">${esc(p.name)}</span>
              ${p.id === S.pid ? `<span class="text-[9px] font-display uppercase tracking-widest border border-white/20 text-white/60 px-2 py-0.5">Vous</span>` : ''}
              ${p.connected === false ? `<span class="text-[9px] font-display uppercase tracking-widest text-red-500/80">Absent</span>` : ''}
            </div>
            ${isHost ? `<button onclick="window.cycleJoker('${p.id}')" class="text-white/40 hover:text-white transition-colors" title="Modifier la carte">${JOKERS[p.joker]?.icon("w-5 h-5")}</button>` : `<div class="text-white/20">${JOKERS[p.joker]?.icon("w-5 h-5")}</div>`}
          </div>
        `).join("")}
      </div>
    </div>

    <div class="mt-6">
       ${connectedArr(r).length < 2 ? `<p class="font-display text-xs text-center uppercase tracking-widest text-white/40 mb-4">En attente des invités...</p>` : ''}
       ${isHost ? `<button onclick="window.startRound()" class="w-full py-4 luxury-btn" style="border-color:${t.accent}; color:${t.accent}" ${connectedArr(r).length < 2 ? 'disabled' : ''}>Ouvrir les débats</button>` : (!isHost && connectedArr(r).length >= 2 ? `<p class="font-display text-xs text-center uppercase tracking-widest text-white/40 animate-pulse">Le maître de cérémonie prépare la table...</p>` : "")}
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
      let backContent = "";
      if (myJokerStr === "THIEF") {
          const stealablePlayers = connectedArr(r).filter(p => p.id !== S.pid && p.joker && !p.jokerConsumed);
          if (stealablePlayers.length > 0) {
              backContent = `<span class="text-white/50 font-display uppercase tracking-widest text-[8px] block mb-2">Dérober la carte de :</span>
              <div class="flex flex-col gap-1 w-full px-2 max-h-24 overflow-y-auto scroll">
                  ${stealablePlayers.map(p => `<button onclick="window.confirmTarotAction('steal', '${p.id}', event)" class="w-full py-1.5 border border-white/20 text-white font-display text-[9px] uppercase tracking-widest hover:bg-white/10 transition-colors rounded-sm">${esc(p.name)}</button>`).join("")}
              </div>`;
          } else {
              backContent = `<span class="text-white/30 text-[9px] font-display uppercase tracking-widest text-center px-2">Aucune cible valide</span>`;
          }
      } else if (myJokerStr === "SHOT") {
          const attackablePlayers = connectedArr(r).filter(p => p.id !== S.pid);
          backContent = `<span class="text-white/50 font-display uppercase tracking-widest text-[8px] block mb-2">Condamner :</span>
          <div class="flex flex-col gap-1 w-full px-2 max-h-24 overflow-y-auto scroll">
              ${attackablePlayers.map(p => `<button onclick="window.confirmTarotAction('shot', '${p.id}', event)" class="w-full py-1.5 border border-white/20 text-white font-display text-[9px] uppercase tracking-widest hover:bg-white/10 transition-colors rounded-sm">${esc(p.name)}</button>`).join("")}
          </div>`;
      } else {
          backContent = `
            <span class="text-white font-serif italic text-xs mb-2 text-center">Confirmer ?</span>
            <button onclick="window.confirmTarotAction('toggle', null, event)" class="w-[80%] py-1.5 border text-white font-display text-[9px] uppercase tracking-widest hover:bg-white/10 transition-colors rounded-sm" style="border-color:${t.accent}">Oui</button>
            <button onclick="window.unflipTarotCard(event)" class="w-[80%] mt-1 py-1 border border-white/10 text-white/40 font-display text-[8px] uppercase tracking-widest hover:text-white transition-colors rounded-sm">Retour</button>
          `;
      }

      jokerActionHtml = `
      <div class="tarot-scene-interactive mb-4">
        <div id="tarot-card-interactive" class="tarot-card-interactive" ontouchstart="window.flipTarotCard(event)" onclick="window.flipTarotCard(event)">
           <div class="tarot-face tarot-front">
              <span style="color:${t.accent}" class="mb-2 drop-shadow-md">${myJoker.icon("w-10 h-10")}</span>
              <span class="font-serif italic text-white text-lg tracking-wide text-center leading-none">${esc(myJoker.name)}</span>
              <span class="font-display text-[8px] text-white/40 uppercase tracking-widest mt-2 border border-white/10 px-2 py-1 rounded-sm bg-black/40">Abattre la carte</span>
           </div>
           <div class="tarot-face tarot-back" style="border-color:${t.accent}">
              ${backContent}
           </div>
        </div>
      </div>`;
  }

  let pactHtml = "";
  if (r.bloodPact && (r.bloodPact.p1 === S.pid || r.bloodPact.p2 === S.pid)) {
      const partnerId = r.bloodPact.p1 === S.pid ? r.bloodPact.p2 : r.bloodPact.p1;
      const partnerName = r.players[partnerId]?.name || "Inconnu";
      pactHtml = `<div class="w-full bg-red-600/10 border-b border-red-500/30 py-2 text-center fixed top-0 left-0 z-50 text-red-400 font-display text-[9px] uppercase tracking-widest flex items-center justify-center gap-2">
        ${icons.bloodPact("w-4 h-4")} Pacte de Sang : Lié à ${esc(partnerName)}
      </div>`;
  }
  
  let angelHtml = "";
  if (r.angelRound) {
      angelHtml = `<div class="w-full border border-[#FFD700]/30 bg-[#FFD700]/5 p-3 text-center text-[#FFD700] font-serif italic text-sm tracking-wide mt-4">
        ${icons.angel("w-5 h-5 mx-auto mb-1")} La Part des Anges : Ce tour, la table ne boit pas. La pire estimation subira le gage de l'Hôte.
      </div>`;
  }

  return `${pactHtml}<div class="flex-1 flex flex-col justify-center gap-6 pb-8 mt-4 animate-pop relative z-10">
    <div class="text-center pt-8 relative">
      <span class="absolute top-0 left-1/2 -translate-x-1/2 font-display text-[10px] uppercase tracking-widest text-white/30 border border-white/10 px-3 py-1">${r.angelRound ? 'LA PART DES ANGES' : roundCounter}</span>
      <h2 class="text-3xl font-serif italic leading-snug mt-6 px-4" style="${r.angelRound ? 'color:#FFD700' : ''}">"${esc(q.text)}"</h2>
      ${amTarget ? `<span class="mt-4 inline-block text-xs font-display uppercase tracking-widest border border-white/20 px-4 py-2 glow-active bg-white/5 text-white" style="border-color:${t.accent}; box-shadow:0 0 15px ${t.accent}40">Cible : Vous-même</span>` : ''}
    </div>
    
    ${angelHtml}

    ${!voted ? `
      ${jokerActionHtml}
      <div class="mt-2 flex flex-col items-center gap-6 px-4">
        
        <div class="relative w-full h-10 glass-tube rounded-full overflow-hidden flex items-center p-1">
           <div id="slider-fill" class="h-full rounded-full mercury-fluid pointer-events-none" style="width: ${S.voteValue}%; background: ${t.accent};"></div>
           <input type="range" id="slider" min="0" max="100" value="${S.voteValue}" class="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-50" style="touch-action: pan-x;" />
        </div>
        
        <span id="sv" class="text-6xl font-display font-light text-white tracking-tighter" style="color:${t.accent}">${S.voteValue}%</span>

        <button onclick="window.vote()" class="w-full py-4 luxury-btn mt-2 breathing bg-black/50" style="border-color:${t.accent}; color:${t.accent}">Sceller la décision</button>
      </div>
    ` : `
      <div class="mt-10 flex flex-col items-center">
        <span class="font-display text-[10px] uppercase tracking-widest text-white/40 mb-6 animate-pulse">Le tribunal délibère...</span>
        <div class="w-full luxury-card p-5 flex flex-col gap-2">
          ${connectedArr(r).map(p => {
            const hasV = (r.votes || {})[p.id] !== undefined;
            return `<div class="flex justify-between items-center py-3 border-b border-white/5 last:border-0"><span class="font-display font-light text-lg capitalize tracking-wide ${hasV ? 'text-white' : 'text-white/30'}">${esc(p.name)}</span> ${hasV ? `<span class="font-display text-[10px] uppercase tracking-widest" style="color:${t.accent}">Validé</span>` : `<span class="font-display text-[10px] uppercase tracking-widest text-white/30">Décision...</span>`}</div>`;
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
          <span class="text-white/50 text-[10px] font-display uppercase tracking-widest">Votre vote : <span class="text-white">${myVote}%</span></span>
          <span class="text-[10px] font-display uppercase tracking-widest" style="color:${t.accent}">Écart : <span class="text-white">${myDiff} pts</span></span>
        </div>
      `;
  }

  let jokersLogHtml = "";
  if (res.usedJokersLog && res.usedJokersLog.length > 0) {
      jokersLogHtml = res.usedJokersLog.map(log => {
          if (log.blocked) {
              return `<div class="w-full border border-white/20 p-3 mb-2 text-center text-white text-[10px] font-display uppercase tracking-widest">
                <span style="color:${t.accent}">${esc(log.name)}</span> a utilisé son Bouclier contre ${esc(log.blocked)}
              </div>`;
          } else if (log.reflectedTo) {
              return `<div class="w-full border border-white/20 p-3 mb-2 text-center text-white text-[10px] font-display uppercase tracking-widest">
                <span style="color:${t.accent}">${esc(log.name)}</span> a renvoyé l'attaque sur ${esc(log.reflectedTo)}
              </div>`;
          }
          return `<div class="w-full border border-white/20 p-3 mb-2 text-center text-white text-[10px] font-display uppercase tracking-widest">
            <span style="color:${t.accent}">${esc(log.name)}</span> a engagé sa carte
          </div>`;
      }).join("");
  }

  let jokerShotVictimsHtml = "";
  if (res.jokerShotVictims && res.jokerShotVictims.length > 0) {
      jokerShotVictimsHtml = res.jokerShotVictims.map(v => {
          if (v.originalTarget) {
               return `<div class="w-full border border-white/40 p-4 mb-3 text-center text-white font-display uppercase tracking-widest text-xs">
                Effet Miroir : ${esc(v.name)} subit son propre CUL SEC (Cible intiale : ${esc(v.originalTarget)})
              </div>`;
          }
          return `<div class="w-full border border-red-500/50 p-4 mb-3 text-center text-white font-display uppercase tracking-widest text-xs">
            ${esc(v.name)} subit une condamnation ciblée (CUL SEC)
          </div>`;
      }).join("");
  }

  let targetVerdictHtml = "";
  if (r.angelRound) {
    targetVerdictHtml = `<div class="w-full border border-[#FFD700]/50 p-5 text-center text-white font-serif italic tracking-wide flex flex-col gap-2 mt-4">
      <span class="text-2xl" style="color:#FFD700">Clémence Divine</span>
      <span class="text-xs font-display font-sans text-white/80 tracking-widest uppercase">${res.targetMsg}</span>
      ${res.angelLoser ? `<span class="mt-2 text-[10px] font-display text-[#FFD700] uppercase tracking-widest border-t border-[#FFD700]/30 pt-2">Conséquence physique pour ${esc(res.angelLoser.name)} (${res.angelLoser.diff} pts d'écart)</span>` : ''}
    </div>`;
  } else {
    if (res.givesSips > 0) {
      targetVerdictHtml = `<div class="w-full border border-white/20 p-5 text-center text-white font-serif italic tracking-wide flex flex-col gap-2 mt-4">
        <span class="text-2xl" style="color:${t.accent}">${esc(res.targetName)} distribue ${res.givesSips} gorgée${res.givesSips > 1 ? 's' : ''}</span>
        <span class="text-xs font-display font-sans text-white/60 tracking-widest uppercase">${res.targetMsg}</span>
      </div>`;
    } else if (res.targetShot) {
      targetVerdictHtml = `<div class="w-full border border-red-500/50 p-5 text-center text-white font-serif italic tracking-wide flex flex-col gap-2 mt-4">
        <span class="text-2xl">Condamnation absolue : CUL SEC</span>
        <span class="text-xs font-display font-sans text-white/60 tracking-widest uppercase">${res.targetMsg} (${res.targetDiff} pts d'écart)</span>
      </div>`;
    } else if (res.targetSips > 0) {
      targetVerdictHtml = `<div class="w-full border border-white/20 p-5 text-center text-white font-serif italic tracking-wide flex flex-col gap-2 mt-4">
        <span class="text-2xl">${esc(res.targetName)} boit ${res.targetSips} gorgée${res.targetSips > 1 ? 's' : ''}</span>
        <span class="text-xs font-display font-sans text-white/60 tracking-widest uppercase">${res.targetMsg}</span>
      </div>`;
    } else {
      targetVerdictHtml = `<div class="w-full border border-white/20 p-5 text-center text-white font-serif italic tracking-wide flex flex-col gap-2 mt-4">
        <span class="text-2xl" style="color:${t.accent}">${esc(res.targetName)} ne boit pas.</span>
        <span class="text-xs font-display font-sans text-white/60 tracking-widest uppercase">${res.targetMsg}</span>
      </div>`;
    }
  }

  let groupVerdictHtml = "";
  const penalizedGroup = (res.groupResults || []).filter(p => p.sips > 0 || p.shot || p.collateral).sort((a,b) => b.diff - a.diff);
  
  if (penalizedGroup.length === 0 && !r.angelRound) {
    groupVerdictHtml = `<div class="w-full border border-white/10 p-4 text-center text-white/50 font-display text-[10px] uppercase tracking-widest mt-4">Le groupe échappe aux pénalités</div>`;
  } else if (!r.angelRound) {
    const listHtml = penalizedGroup.map(p => {
      const penalty = p.shot ? "CUL SEC" : `${p.sips} gorgée${p.sips > 1 ? 's' : ''}`;
      const colMsg = p.collateral ? `<span class="text-red-400 block text-[8px]">+ ${p.collateral}</span>` : "";
      return `<div class="flex justify-between items-center text-xs font-display uppercase py-2 border-b border-white/5 last:border-0"><span class="text-white">${esc(p.name)} <span class="text-white/30 text-[9px] tracking-widest">(${p.diff} pts)</span>${colMsg}</span> <span class="text-white/80">${penalty}</span></div>`;
    }).join("");
    groupVerdictHtml = `<div class="w-full border border-white/20 p-4 text-left mt-4">
      <span class="block text-center text-white/50 font-display uppercase text-[9px] tracking-widest mb-4">Balles Perdues & Dégâts collatéraux</span>
      ${listHtml}
    </div>`;
  }

  let pactHtml = "";
  if (r.bloodPact && (r.bloodPact.p1 === S.pid || r.bloodPact.p2 === S.pid)) {
      pactHtml = `<div class="w-full bg-red-600/10 border-b border-red-500/30 py-2 text-center fixed top-0 left-0 z-50 text-red-400 font-display text-[9px] uppercase tracking-widest flex items-center justify-center gap-2">
        ${icons.bloodPact("w-4 h-4")} Pacte de Sang Actif
      </div>`;
  }

  const recapList = playersArr(r).map(p => {
       const v = (r.votes || {})[p.id];
       const isTarget = p.id === res.targetId;
       const opacityClass = p.connected === false ? 'opacity-40' : '';
       return `<div class="flex justify-between items-center py-2 border-b border-white/5 last:border-0 ${isTarget ? 'text-white' : 'text-white/60'} ${opacityClass}">
         <span class="text-sm font-display font-light capitalize tracking-wide">${esc(p.name)} ${isTarget ? '<span class="text-[9px] font-display text-white/40 tracking-widest uppercase">(Cible)</span>' : ''}</span>
         <span class="font-display font-light text-xl" ${isTarget ? `style="color:${t.accent}"` : ''}>${v !== undefined ? v.toString().padStart(2, '0') + '%' : '---'}</span>
       </div>`;
  }).join("");

  const hostControls = isHost ? `
    <div class="flex flex-col gap-4 mt-6 w-full">
      <button onclick="window.nextRound()" class="w-full py-4 luxury-btn bg-black/50" style="border-color:${t.accent}; color:${t.accent}">${r.maxRounds > 0 && r.round >= r.maxRounds ? 'Bilan Final' : 'Question Suivante'}</button>
      <button onclick="window.endGame()" class="w-full py-4 luxury-btn !border-red-500/30 !text-red-500/80 hover:!bg-red-500/10 transition-colors bg-black/50">Clôturer la session</button>
    </div>
  ` : `<p class="font-display text-[10px] text-center uppercase tracking-widest text-white/40 mt-8">En attente de l'hôte...</p>`;

  return `${pactHtml}<div class="flex-1 flex flex-col gap-5 pb-8 mt-6 relative z-10">
    <div class="text-center">
      <p class="text-white/40 text-[9px] font-display uppercase tracking-widest">Le Verdict Social</p>
      <h2 class="text-2xl font-serif italic text-white tracking-wide mt-2 capitalize">${esc(res.targetName)} VS Moyenne</h2>
    </div>
    
    <div class="text-center animate-pop mt-4 h-24 flex items-center justify-center">
      <span id="reveal-avg" class="font-display font-light text-white opacity-0 text-7xl tracking-tighter">00</span>
    </div>
    
    <div id="reveal-details" class="flex flex-col opacity-0 transition-opacity duration-700">
      ${jokersLogHtml}
      ${jokerShotVictimsHtml}
      
      <div class="luxury-card p-6 flex flex-col items-center">
        <div class="flex w-full justify-around items-center">
          <div class="flex flex-col text-center gap-1">
            <span class="text-white/40 text-[9px] font-display uppercase tracking-widest">La Moyenne</span>
            <span class="text-3xl font-display font-light text-white">${res.average}%</span>
          </div>
          <div class="w-px h-10 bg-white/10"></div>
          <div class="flex flex-col text-center gap-1">
            <span class="text-white/40 text-[9px] font-display uppercase tracking-widest">La Cible</span>
            <span class="text-3xl font-display font-light" style="color:${t.accent}">${res.targetVote}%</span>
          </div>
        </div>
        
        ${targetVerdictHtml}
        ${groupVerdictHtml}
        ${myStatsHtml}
      </div>
      
      <div class="w-full luxury-card p-5 mt-4">
        <h4 class="text-[9px] font-display uppercase tracking-widest mb-4 text-center">Les Évaluations</h4>
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
  return `<div class="flex-1 flex flex-col gap-6 pb-8 mt-10 relative z-10">
    <div class="text-center mb-4">
      <h2 class="text-3xl font-serif italic tracking-wide text-white">Fin de Session</h2>
    </div>
    
    <div class="luxury-card p-8 text-center flex flex-col items-center justify-center border border-white/20 glow-active" style="border-color:${t.accent}60">
      <span class="text-[9px] font-display uppercase tracking-widest text-white/50 mb-4">La plus grande lucidité</span>
      <p class="text-4xl font-display font-light text-white capitalize tracking-wide mb-4" style="color:${t.accent}">${esc(rk.winner.name)}</p>
      <span class="font-display text-[10px] text-white/60 border border-white/10 px-4 py-2 uppercase tracking-widest">${rk.winner.score} pts d'erreur cumulés</span>
    </div>
    
    <div class="luxury-card p-8 text-center flex flex-col items-center justify-center mt-2 border border-white/5 opacity-80">
      <span class="text-[9px] font-display uppercase tracking-widest text-white/40 mb-4">Déni absolu (Dernière place)</span>
      <p class="text-3xl font-display font-light text-white/80 capitalize tracking-wide mb-4">${esc(rk.loser.name)}</p>
      <span class="font-display text-[10px] text-white/40 border border-white/10 px-4 py-2 uppercase tracking-widest">${rk.loser.score} pts d'erreur cumulés</span>
    </div>

    <div class="mt-8 border border-white/20 p-6 text-center bg-white/5">
      <span class="text-[9px] font-display uppercase tracking-widest text-white/50 block mb-3">La Sentence Légitime</span>
      <p class="text-xs font-display text-white leading-relaxed uppercase tracking-widest">
        <span style="color:${t.accent}">${esc(rk.winner.name)}</span> détient l'autorité absolue pour imposer une ultime sanction à <span>${esc(rk.loser.name)}</span>.
      </p>
    </div>
    
    <div class="mt-8">
      ${isHost ? `<button onclick="window.restart()" class="w-full py-4 luxury-btn bg-black/50" style="border-color:${t.accent}; color:${t.accent}">Nouvelle Session</button>` : `<p class="font-display text-[10px] text-center uppercase tracking-widest text-white/40">Session clôturée</p>`}
    </div>
  </div>`; 
}

let afterRenderHook = null;
export function onAfterRender(fn) { afterRenderHook = fn; }

let lastViewKey = null;

export function render() {
  applyBg(); const app = document.getElementById("app"); const t = THEMES[(S.room && S.room.mode) || S.pendingMode] || THEMES.Chill; let body = "";
  
  const viewKey = S.screen === "HOME" ? "HOME" : (S.room ? S.room.phase : "");
  const isNewView = viewKey !== lastViewKey;

  const r = S.room;
  if (r && r.lastAction && r.lastAction.type === 'SHOT' && r.lastAction.targetId === S.pid) {
      const me = r.players[S.pid];
      if (me && (me.joker === 'SHIELD' || me.joker === 'MIRROR') && !me.jokerConsumed && !me.jokerActive) {
          const modal = document.getElementById("counterModal");
          if (modal && modal.classList.contains("hidden")) {
             document.getElementById("counter-desc").innerHTML = `${esc(r.lastAction.actor)} vous assigne un CUL SEC`;
             const btnYes = document.getElementById("counter-btn-yes");
             if(btnYes) {
                 if (me.joker === 'SHIELD') btnYes.innerHTML = "Activer Bouclier";
                 else btnYes.innerHTML = "Renvoyer (Miroir)";
             }
             modal.classList.remove("hidden");
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

  if (isNewView) lastViewKey = viewKey;

  if (activeId) {
    const n = document.getElementById(activeId);
    if (n) { try { n.focus({ preventScroll: true }); if (selStart != null && n.setSelectionRange) n.setSelectionRange(selStart, selEnd); } catch (e) {} }
  }

  if (afterRenderHook) afterRenderHook();
}
