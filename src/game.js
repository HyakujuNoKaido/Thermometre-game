import { S, JOKERS, rand, genId, genCode, connectedArr, playersArr, haptic, getQuestion } from './store.js';
import { db, ServerValue } from './firebase.js';
import { render, toast, showSmashAlert } from './ui.js';

let revealing = false;
let promoting = false;
let lastActionId = null;

async function cleanRoomIfEmpty(code) {
  if (!code) return;
  try {
    const snap = await db.ref(`rooms/${code}/players`).get();
    if (!snap.exists() || Object.keys(snap.val() || {}).length === 0) {
      await db.ref(`rooms/${code}`).remove();
    }
  } catch(e) {}
}

// FIX: Restauration de la fonction d'auto-reconnexion manquante
export async function tryReconnect() {
  const code = sessionStorage.getItem('thermo_code'); 
  const pid = sessionStorage.getItem('thermo_pid');
  if (code && pid) {
    try {
      const snap = await db.ref("rooms/" + code).get();
      if (snap.exists() && snap.val().players && snap.val().players[pid]) {
        S.name = snap.val().players[pid].name;
        await db.ref(`rooms/${code}/players/${pid}`).update({ connected: true });
        enterRoom(code, pid); 
        return true;
      }
    } catch(e) {
        console.error("Firebase Error:", e);
    }
  }
  return false;
}

export async function createRoom() {
  if (!S.name.trim()) return toast("Veuillez décliner votre identité."); 
  if (S.isLoading) return; haptic('medium'); S.isLoading = true; render(); 
  try {
    let code; for (let i=0; i<5; i++) { code = genCode(); const s = await db.ref("rooms/" + code).get(); if (!s.exists()) break; }
    const pid = genId();
    await db.ref("rooms/" + code).set({ mode: S.pendingMode, phase: "LOBBY", round: 0, hostId: pid, maxRounds: 10, createdAt: ServerValue.TIMESTAMP, players: { [pid]: { name: S.name.trim().slice(0, 20), joker: rand(Object.keys(JOKERS)), score: 0, jokerConsumed: false, jokerActive: false, connected: true } } });
    sessionStorage.setItem('thermo_code', code); sessionStorage.setItem('thermo_pid', pid);
    enterRoom(code, pid);
  } catch(e) { toast("Connexion au club impossible."); } finally { S.isLoading = false; if (!S.room) render(); }
}

export async function joinRoom() {
  if (!S.name.trim()) return toast("Veuillez décliner votre identité.");
  const code = (S.joinCode || "").toUpperCase().trim(); 
  if (S.isLoading) return; haptic('medium'); S.isLoading = true; render();
  try {
    const snap = await db.ref("rooms/" + code).get(); 
    if (!snap.exists()) return toast("Cette table n'existe pas.");
    const room = snap.val();
    
    const existingPlayerPair = Object.entries(room.players || {}).find(([id, p]) => p.name.toLowerCase() === S.name.trim().toLowerCase());
    let pid;
    if (existingPlayerPair) {
      pid = existingPlayerPair[0];
      await db.ref(`rooms/${code}/players/${pid}`).update({ connected: true });
    } else {
      pid = genId();
      const newPlayer = { name: S.name.trim().slice(0, 20), joker: rand(Object.keys(JOKERS)), score: 0, jokerConsumed: false, jokerActive: false, connected: true };
      const updates = { [`players/${pid}`]: newPlayer };
      if (room.phase === "VOTING" && room.expectedVoters) updates[`expectedVoters/${pid}`] = true;
      await db.ref("rooms/" + code).update(updates);
    }
    sessionStorage.setItem('thermo_code', code); sessionStorage.setItem('thermo_pid', pid);
    enterRoom(code, pid);
  } catch (e) { toast("Le service est indisponible."); } finally { S.isLoading = false; if (!S.room) render(); }
}

function enterRoom(code, pid) {
  S.code = code; S.pid = pid; history.replaceState(null, "", "?room=" + code);
  if (S.roomRef) S.roomRef.off(); 
  
  const connRef = db.ref(`rooms/${code}/players/${pid}/connected`);
  connRef.onDisconnect().cancel(); 
  db.ref(`rooms/${code}/players/${pid}`).onDisconnect().remove().then(() => {
    db.ref(`rooms/${code}/players`).onDisconnect().cancel(); 
  });

  S.roomRef = db.ref("rooms/" + code);
  S.roomRef.on("value", snap => { 
    const room = snap.val();
    if (!room || !room.players || !room.players[S.pid]) { 
      cleanRoomIfEmpty(code); 
      detach(); S.screen = "HOME"; S.room = null; render(); return; 
    }
    S.room = room; 
    S.screen = "ROOM"; 

    if (room.lastAction && room.lastAction.id !== lastActionId) {
       lastActionId = room.lastAction.id;
       if (Date.now() - room.lastAction.id < 10000) showSmashAlert(room.lastAction);
    }
    promoteHostIfNeeded(); hostAutoReveal(); render();
  });
}

export async function toggleJoker() {
  const me = S.room.players[S.pid]; if (!me || me.jokerConsumed || !me.joker) return;
  haptic('light');
  const upd = { [`players/${S.pid}/jokerActive`]: !me.jokerActive };
  if (!me.jokerActive) upd.lastAction = { id: Date.now(), type: me.joker, actor: me.name };
  await S.roomRef.update(upd);
}

export async function assignShotTarget(targetId) {
  haptic('medium'); const targetName = S.room.players[targetId].name;
  await S.roomRef.update({ [`players/${S.pid}/shotTarget`]: targetId, [`players/${S.pid}/jokerActive`]: true, lastAction: { id: Date.now(), type: 'SHOT', actor: S.room.players[S.pid].name, target: targetName, targetId: targetId } });
}
export async function cancelShotTarget() { haptic('light'); await S.roomRef.update({ [`players/${S.pid}/shotTarget`]: null, [`players/${S.pid}/jokerActive`]: false }); }
export async function activateCounter() { haptic('heavy'); const me = S.room.players[S.pid]; await S.roomRef.update({ [`players/${S.pid}/jokerActive`]: true, lastAction: { id: Date.now(), type: 'COUNTER', actor: me.name, joker: me.joker } }); }

export async function stealJoker(targetId) {
  const r = S.room; const targetP = r.players[targetId];
  if (!targetP || targetP.jokerConsumed || !targetP.joker) return toast("Cible protégée.");
  haptic('medium');
  const stolenJoker = targetP.joker;
  const actorName = S.room.players[S.pid].name;

  await S.roomRef.update({
    [`players/${S.pid}/joker`]: stolenJoker, [`players/${S.pid}/jokerActive`]: false, [`players/${S.pid}/jokerConsumed`]: false,
    [`players/${targetId}/joker`]: null, [`players/${targetId}/jokerActive`]: false, [`players/${targetId}/jokerConsumed`]: true,
    lastAction: { id: Date.now(), type: 'THIEF', actor: actorName, target: targetP.name }
  });
}

export async function randomizeJokers() {
  if (S.pid !== S.room.hostId) return; haptic('medium');
  const updates = {};
  Object.keys(S.room.players).forEach(id => {
    updates[`players/${id}/joker`] = rand(Object.keys(JOKERS));
    updates[`players/${id}/jokerConsumed`] = false; updates[`players/${id}/jokerActive`] = false; updates[`players/${id}/shotTarget`] = null;
  });
  await S.roomRef.update(updates);
}

export async function cycleJoker(pid) {
  if (S.pid !== S.room.hostId) return; haptic('light');
  const p = S.room.players[pid]; if (!p) return;
  const keys = Object.keys(JOKERS); let idx = keys.indexOf(p.joker); idx = (idx + 1) % keys.length;
  await S.roomRef.update({ [`players/${pid}/joker`]: keys[idx], [`players/${pid}/jokerConsumed`]: false, [`players/${pid}/jokerActive`]: false, [`players/${pid}/shotTarget`]: null });
}

function detach() {
  if (S.roomRef) { S.roomRef.off(); S.roomRef = null; }
  sessionStorage.removeItem('thermo_code'); sessionStorage.removeItem('thermo_pid');
  S.code = null; S.pid = null; history.replaceState(null, "", window.location.pathname);
}

export async function quitGame() { 
  try { 
    const code = S.code; const pid = S.pid; detach(); S.screen = "HOME"; render(); 
    if (code && pid) { await db.ref(`rooms/${code}/players/${pid}`).remove(); cleanRoomIfEmpty(code); }
  } catch(e) {}
}

export async function changeMaxRounds(num) { if(S.pid !== S.room.hostId) return; await S.roomRef.update({ maxRounds: num }); }
export function pickMode(m) { S.pendingMode = m; render(); }
export async function chooseMode(m) { haptic('light'); await S.roomRef.update({ mode: m }); }

async function promoteHostIfNeeded() { 
  const r = S.room; if (!r || !r.players || promoting || r.hostId === S.pid) return; 
  const host = r.players[r.hostId];
  if (!host || host.connected === false) { 
    const conn = connectedArr(r).sort((a, b) => a.id < b.id ? -1 : 1); 
    if (conn.length > 0 && conn[0].id === S.pid) { 
      promoting = true;
      try { await S.roomRef.update({ hostId: S.pid }); toast("Vous dirigez la table.", true); } catch(e) {} finally { promoting = false; }
    } 
  } 
}

export async function startRound() {
  const r = S.room; if (S.pid !== r.hostId) return;
  const conn = connectedArr(r);
  if (conn.length < 2) return toast("Invitez au moins un convive.");
  haptic('heavy');
  
  const t = rand(conn); 
  const others = conn.filter(p => p.id !== t.id);
  const t2 = others.length > 0 ? rand(others) : t;

  const used = r.usedQuestions || [];
  const qData = getQuestion(r.mode, used, t.name, t2.name);
  used.push(qData.raw);

  const expectedVoters = {}; conn.forEach(p => expectedVoters[p.id] = true);
  
  const upd = { 
      phase: "VOTING", round: (r.round || 0) + 1, 
      question: {text: qData.text, targetId: t.id, targetName: t.name}, 
      expectedVoters, votes: null, result: null, usedQuestions: used, 
      startedAt: ServerValue.TIMESTAMP 
  };

  if (conn.length >= 3 && (!r.bloodPact || r.round === 0)) {
      const shuffled = [...conn].sort(() => 0.5 - Math.random());
      upd.bloodPact = { p1: shuffled[0].id, p2: shuffled[1].id };
  }

  upd.angelRound = Math.random() < 0.15;

  Object.keys(r.players).forEach(id => { upd[`players/${id}/jokerActive`] = false; });
  await S.roomRef.update(upd);
}

export async function nextRound() { const r = S.room; if (r.maxRounds > 0 && r.round >= r.maxRounds) return endGame(); startRound(); }
export async function vote() { haptic('heavy'); await db.ref(`rooms/${S.code}/votes/${S.pid}`).set(Number(S.voteValue)); }

export async function hostAutoReveal() {  
  try {
    const r = S.room; 
    if (!r || r.phase !== "VOTING" || S.pid !== r.hostId || revealing) return;
    const expectedIds = Object.keys(r.expectedVoters || {}); 
    const votes = r.votes || {};
    const voters = Object.keys(votes);
    if (voters.length === 0) return;

    const missing = expectedIds.filter(id => r.players[id] && r.players[id].connected !== false && votes[id] === undefined);
    if (missing.length > 0) return; 
    revealing = true; 

    const usedJokersLog = [];
    const jokerShotVictims = [];
    
    Object.keys(r.players).forEach(id => {
       const p = r.players[id];
       if (p.jokerActive && p.joker && !p.jokerConsumed && p.joker !== "SHIELD" && p.joker !== "MIRROR") {
           usedJokersLog.push({ id, name: p.name, joker: p.joker });
       }
    });

    const attackers = Object.keys(r.players).filter(id => r.players[id].jokerActive && r.players[id].joker === "SHOT" && r.players[id].shotTarget);
    attackers.forEach(atkId => {
        const p = r.players[atkId]; const victimId = p.shotTarget; const victim = r.players[victimId];
        if (victim && victim.jokerActive && !victim.jokerConsumed) {
            if (victim.joker === "SHIELD") usedJokersLog.push({ id: victimId, name: victim.name, joker: "SHIELD", blocked: p.name });
            else if (victim.joker === "MIRROR") {
                usedJokersLog.push({ id: victimId, name: victim.name, joker: "MIRROR", reflectedTo: p.name });
                jokerShotVictims.push({ id: atkId, name: p.name, originalTarget: victim.name });
            } else jokerShotVictims.push({ id: victimId, name: victim.name });
        } else if (victim) jokerShotVictims.push({ id: victimId, name: victim.name });
    });

    Object.keys(r.players).forEach(id => {
       const p = r.players[id];
       if (p.jokerActive && !p.jokerConsumed && (p.joker === "SHIELD" || p.joker === "MIRROR")) {
           if (!usedJokersLog.find(l => l.id === id)) usedJokersLog.push({ id, name: p.name, joker: p.joker });
       }
    });

    const hasJoker = (id, jName) => { const p = r.players[id]; return p && p.jokerActive && p.joker === jName && !p.jokerConsumed; };

    const tid = r.question.targetId; 
    const tv = votes[tid] !== undefined ? votes[tid] : 50; 
    const allVotes = Object.values(votes);
    const average = allVotes.length > 0 ? Math.round(allVotes.reduce((a, b) => a + b, 0) / allVotes.length) : 50;
    
    const targetDiff = Math.abs(tv - average);
    let targetSips = 0; let targetShot = false; let targetMsg = ""; let givesSips = 0;
    let angelLoser = null;

    if (r.angelRound) {
        targetSips = 0; givesSips = 0; targetMsg = "La Part des Anges. Clémence absolue.";
        let maxDiff = -1; let angelLoserId = null;
        Object.keys(votes).forEach(id => {
            const d = Math.abs(votes[id] - average);
            if(d > maxDiff) { maxDiff = d; angelLoserId = id; }
        });
        if (angelLoserId) angelLoser = { name: r.players[angelLoserId].name, diff: maxDiff };
    } else {
        if (targetDiff <= 10) { givesSips = 3; targetMsg = "Lucidité parfaite. Cible distribue 3 gorgées."; } 
        else if (targetDiff <= 20) { targetSips = 1; targetMsg = "Légère dissonance (1 gorgée)."; } 
        else if (targetDiff <= 30) { targetSips = 2; targetMsg = "Le voile de l'illusion (2 gorgées)."; } 
        else { targetSips = 4; targetMsg = "Déconnexion absolue (4 gorgées)."; }

        if (hasJoker(tid, "DOUBLE")) {
            if (givesSips > 0) givesSips *= 2;
            if (targetSips > 0) targetSips *= 2;
            targetMsg = givesSips > 0 ? "Pari gagné ! Distribuez le double." : "Pari raté, sanction doublée.";
        }
        if (hasJoker(tid, "SHIELD") || hasJoker(tid, "MIRROR")) {
            targetSips = 0; givesSips = 0; targetMsg = "Immunité accordée par privilège.";
        }
    }

    const groupResults = [];
    Object.keys(votes).forEach(id => {
      if (id === tid || !r.players[id]) return;
      const playerDiff = Math.abs(votes[id] - average);
      let sips = 0;
      
      if (!r.angelRound && targetSips > 0 && playerDiff > targetDiff + 5) {
          sips = 1; 
      }
      
      if (hasJoker(id, "SHIELD") || hasJoker(id, "MIRROR")) sips = 0;
      if (hasJoker(id, "DOUBLE")) sips *= 2;
      
      groupResults.push({ id, name: r.players[id].name, diff: playerDiff, sips, shot: false, collateral: 0 });
    });

    if (r.bloodPact && !r.angelRound) {
        const applyCollateral = (partnerId, penaltySips, penaltyShot) => {
            if (penaltyShot || penaltySips >= 3) {
                const partnerRes = groupResults.find(g => g.id === partnerId);
                if (partnerRes && !hasJoker(partnerId, "SHIELD")) { 
                    partnerRes.collateral = penaltyShot ? 'CUL SEC (Pacte)' : Math.ceil(penaltySips / 2); 
                    partnerRes.sips += Math.ceil(penaltySips / 2);
                }
            }
        };
        if (tid === r.bloodPact.p1) applyCollateral(r.bloodPact.p2, targetSips, targetShot);
        if (tid === r.bloodPact.p2) applyCollateral(r.bloodPact.p1, targetSips, targetShot);
        jokerShotVictims.forEach(v => {
            if (v.id === r.bloodPact.p1) applyCollateral(r.bloodPact.p2, 0, true);
            if (v.id === r.bloodPact.p2) applyCollateral(r.bloodPact.p1, 0, true);
        });
    }

    const result = { 
      average, targetVote: tv, targetName: r.question.targetName || "La cible", 
      targetId: tid, targetDiff, targetSips, targetShot, targetMsg, givesSips,
      groupResults, usedJokersLog, jokerShotVictims, angelLoser
    };
    
    const updates = { phase: "REVEAL", result: result };
    updates[`players/${tid}/score`] = (r.players[tid].score || 0) + targetDiff;
    groupResults.forEach(p => { updates[`players/${p.id}/score`] = (r.players[p.id].score || 0) + p.diff; });
    jokerShotVictims.forEach(v => { updates[`players/${v.id}/score`] = (r.players[v.id].score || 0) + 25; });

    Object.keys(r.players).forEach(id => {
       if (r.players[id].jokerActive && !r.players[id].jokerConsumed) {
          updates[`players/${id}/jokerConsumed`] = true;
          updates[`players/${id}/jokerActive`] = false;
          updates[`players/${id}/shotTarget`] = null;
       }
    });

    await S.roomRef.update(updates);
  } catch (err) { console.error(err); revealing = false; } finally { revealing = false; }
}

export async function endGame() { 
  const r = S.room; if (!r) return;
  const ranked = playersArr(r).sort((a, b) => a.score - b.score);
  const w = ranked[0]; const l = ranked[ranked.length - 1]; 
  await S.roomRef.update({ phase: "STATS", ranking: { winner: { name: w.name, score: w.score }, loser: { name: l.name, score: l.score }, all: ranked.map(p => ({ id: p.id, name: p.name, score: p.score })) } }); 
}

export async function restart() { 
  const r = S.room; if (S.pid !== r.hostId) return; 
  const upd = { phase: "LOBBY", round: 0, votes: null, result: null, ranking: null, usedQuestions: null, angelRound: null };
  Object.keys(r.players).forEach(id => { 
      upd[`players/${id}/score`] = 0; 
      upd[`players/${id}/jokerConsumed`] = false; 
      upd[`players/${id}/jokerActive`] = false; 
      upd[`players/${id}/shotTarget`] = null; 
      upd[`players/${id}/joker`] = rand(Object.keys(JOKERS));
  }); 
  await S.roomRef.update(upd); 
}
