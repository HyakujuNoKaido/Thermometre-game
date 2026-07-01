import { S, QUESTIONS, JOKERS, rand, genId, genCode, connectedArr, playersArr, vibrate } from './store.js';
import { db, ServerValue } from './firebase.js';
import { render, toast } from './ui.js';

let revealing = false;
let promoting = false;

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
    } catch(e) {}
  }
  return false;
}

export async function createRoom() {
  if (!S.name.trim()) return toast("Veuillez saisir un pseudonyme valide."); 
  if (S.isLoading) return; vibrate(20); S.isLoading = true; render(); 
  try {
    let code; for (let i=0; i<5; i++) { code = genCode(); const s = await db.ref("rooms/" + code).get(); if (!s.exists()) break; }
    const pid = genId();
    await db.ref("rooms/" + code).set({ mode: S.pendingMode, phase: "LOBBY", round: 0, hostId: pid, maxRounds: 10, timer: 0, createdAt: ServerValue.TIMESTAMP, players: { [pid]: { name: S.name.trim().slice(0, 20), joker: rand(Object.keys(JOKERS)), score: 0, jokerConsumed: false, jokerActive: false, connected: true } } });
    sessionStorage.setItem('thermo_code', code); sessionStorage.setItem('thermo_pid', pid);
    enterRoom(code, pid);
  } catch(e) { toast("Erreur de connexion au serveur."); } finally { S.isLoading = false; if (!S.room) render(); }
}

export async function joinRoom() {
  if (!S.name.trim()) return toast("Veuillez saisir un pseudonyme valide.");
  const code = (S.joinCode || "").toUpperCase().trim(); 
  if (S.isLoading) return; vibrate(20); S.isLoading = true; render();
  try {
    const snap = await db.ref("rooms/" + code).get(); 
    if (!snap.exists()) return toast("Salon introuvable.");
    const room = snap.val();
    
    const existingPlayerPair = Object.entries(room.players || {}).find(
      ([id, p]) => p.name.toLowerCase() === S.name.trim().toLowerCase()
    );

    let pid;
    if (existingPlayerPair) {
      pid = existingPlayerPair[0];
      await db.ref(`rooms/${code}/players/${pid}`).update({ connected: true });
      toast("Te revoilà dans la partie !", true);
    } else {
      pid = genId();
      const newPlayer = { name: S.name.trim().slice(0, 20), joker: rand(Object.keys(JOKERS)), score: 0, jokerConsumed: false, jokerActive: false, connected: true };
      const updates = { [`players/${pid}`]: newPlayer };
      
      if (room.phase === "VOTING" && room.expectedVoters) updates[`expectedVoters/${pid}`] = true;
      await db.ref("rooms/" + code).update(updates);
      toast("Bienvenue dans le salon !", true);
    }

    sessionStorage.setItem('thermo_code', code); sessionStorage.setItem('thermo_pid', pid);
    enterRoom(code, pid);
  } catch (e) { toast("Erreur réseau."); } finally { S.isLoading = false; if (!S.room) render(); }
}

function enterRoom(code, pid) {
  S.code = code; S.pid = pid; history.replaceState(null, "", "?room=" + code);
  db.ref(`rooms/${code}/players/${pid}`).onDisconnect().update({ connected: false });
  S.roomRef = db.ref("rooms/" + code);
  S.roomRef.on("value", snap => { 
    const room = snap.val();
    if (!room || !room.players || !room.players[S.pid]) { detach(); S.screen = "HOME"; S.room = null; toast("Salon fermé ou déconnexion."); render(); return; }
    S.room = room; S.screen = "ROOM"; 
    promoteHostIfNeeded(); hostAutoReveal(); render();
  });
}

// GESTION DES JOKERS ET CIBLAGES
export async function toggleJoker() {
  const me = S.room.players[S.pid];
  if (!me || me.jokerConsumed || !me.joker) return;
  vibrate(10);
  await S.roomRef.update({ [`players/${S.pid}/jokerActive`]: !me.jokerActive });
}

export async function assignShotTarget(targetId) {
  vibrate(20);
  await S.roomRef.update({
    [`players/${S.pid}/shotTarget`]: targetId,
    [`players/${S.pid}/jokerActive`]: true
  });
  toast("Cible du cul sec verrouillée ! 🥃", true);
}

export async function cancelShotTarget() {
  vibrate(10);
  await S.roomRef.update({
    [`players/${S.pid}/shotTarget`]: null,
    [`players/${S.pid}/jokerActive`]: false
  });
}

export async function stealJoker(targetId) {
  const r = S.room;
  const targetP = r.players[targetId];
  if (!targetP || targetP.jokerConsumed || !targetP.joker) return toast("Impossible de voler ce joueur.");
  vibrate(20);
  await S.roomRef.update({
    [`players/${S.pid}/joker`]: targetP.joker,
    [`players/${S.pid}/jokerActive`]: false,
    [`players/${S.pid}/jokerConsumed`]: false,
    [`players/${targetId}/joker`]: null,
    [`players/${targetId}/jokerActive`]: false,
    [`players/${targetId}/jokerConsumed`]: true
  });
  toast("Pouvoir volé avec succès ! 🥷", true);
}

export async function randomizeJokers() {
  if (S.pid !== S.room.hostId) return;
  vibrate(20);
  const updates = {};
  Object.keys(S.room.players).forEach(id => {
    updates[`players/${id}/joker`] = rand(Object.keys(JOKERS));
    updates[`players/${id}/jokerConsumed`] = false;
    updates[`players/${id}/jokerActive`] = false;
    updates[`players/${id}/shotTarget`] = null;
  });
  await S.roomRef.update(updates);
}

export async function cycleJoker(pid) {
  if (S.pid !== S.room.hostId) return;
  vibrate(10);
  const p = S.room.players[pid];
  if (!p) return;
  const keys = Object.keys(JOKERS);
  let idx = keys.indexOf(p.joker);
  idx = (idx + 1) % keys.length;
  await S.roomRef.update({ [`players/${pid}/joker`]: keys[idx], [`players/${pid}/jokerConsumed`]: false, [`players/${pid}/jokerActive`]: false, [`players/${pid}/shotTarget`]: null });
}

function detach() {
  if (S.roomRef) { S.roomRef.off(); S.roomRef = null; }
  sessionStorage.removeItem('thermo_code'); sessionStorage.removeItem('thermo_pid');
  S.code = null; S.pid = null; history.replaceState(null, "", window.location.pathname);
}

export async function quitGame() { 
  try { if (S.code && S.pid) await db.ref(`rooms/${S.code}/players/${S.pid}`).remove(); } catch(e) {}
  detach(); S.screen = "HOME"; render(); 
}

export async function kickPlayer(id) { await db.ref(`rooms/${S.code}/players/${id}`).remove(); }
export async function changeMaxRounds(num) { if(S.pid !== S.room.hostId) return; await S.roomRef.update({ maxRounds: num }); }
export function pickMode(m) { S.pendingMode = m; render(); }
export async function chooseMode(m) { vibrate(10); await S.roomRef.update({ mode: m }); }

async function promoteHostIfNeeded() { 
  const r = S.room; if (!r || !r.players || promoting || r.hostId === S.pid) return; 
  const host = r.players[r.hostId];
  if (!host) { 
    const conn = connectedArr(r).sort((a, b) => a.id < b.id ? -1 : 1); 
    if (conn.length > 0 && conn[0].id === S.pid) { 
      promoting = true;
      try { await S.roomRef.update({ hostId: S.pid }); toast("Vous êtes le nouvel hôte de la partie", true); } catch(e) {} finally { promoting = false; }
    } 
  } 
}

export async function startRound() {
  const r = S.room; if (S.pid !== r.hostId) return;
  if (connectedArr(r).length < 2) return toast("Il faut au moins 2 joueurs connectés.");
  vibrate(50);
  const t = rand(connectedArr(r)); const qText = rand(QUESTIONS[r.mode]).replace(/{name}/g, t.name);
  const expectedVoters = {}; connectedArr(r).forEach(p => expectedVoters[p.id] = true);
  
  const upd = { phase: "VOTING", round: (r.round || 0) + 1, question: {text: qText, targetId: t.id, targetName: t.name}, expectedVoters, votes: null, result: null, startedAt: ServerValue.TIMESTAMP };
  Object.keys(r.players).forEach(id => { upd[`players/${id}/jokerActive`] = false; });
  await S.roomRef.update(upd);
}

export async function nextRound() { const r = S.room; if (r.maxRounds > 0 && r.round >= r.maxRounds) return endGame(); startRound(); }
export async function vote() { vibrate([30, 50]); await db.ref(`rooms/${S.code}/votes/${S.pid}`).set(Number(S.voteValue)); }

function getPenalty(diff) {
  if (diff <= 10) return { sips: 0, shot: false };
  if (diff <= 20) return { sips: 1, shot: false };
  if (diff <= 30) return { sips: 2, shot: false };
  if (diff <= 40) return { sips: 3, shot: false };
  return { sips: 0, shot: true };
}

export async function hostAutoReveal() {  
  try {
    const r = S.room; 
    if (!r || r.phase !== "VOTING" || S.pid !== r.hostId || revealing) return;
    
    const expectedIds = Object.keys(r.expectedVoters || {}); 
    const votes = r.votes || {};
    
    // On compte combien de personnes ont réellement voté
    const voters = Object.keys(votes);
    
    // Si personne n'a voté, on attend
    if (voters.length === 0) return;

    // SECURITÉ : On déclenche le reveal si au moins 50% des gens ont voté 
    // OU si tout le monde a voté. Cela évite le plantage si quelqu'un a quitté.
    const allExpected = expectedIds.length;
    const progress = voters.length / allExpected;

    // On attend que tout le monde ait voté, mais si un joueur est déconnecté (connected: false), 
    // on ne l'attend pas.
    const missing = expectedIds.filter(id => 
        r.players[id] && 
        r.players[id].connected !== false && 
        votes[id] === undefined
    );

    if (missing.length > 0) return; 
    
    revealing = true; 

    const tid = r.question.targetId; 
    const tv = votes[tid] !== undefined ? votes[tid] : 50; 
    
    const nonTargetVotes = Object.keys(votes).filter(id => id !== tid).map(id => votes[id]);
    const average = nonTargetVotes.length > 0 ? Math.round(nonTargetVotes.reduce((a, b) => a + b, 0) / nonTargetVotes.length) : 50;
    
    const targetDiff = Math.abs(tv - average);
    const targetPenalty = getPenalty(targetDiff);
    let targetSips = targetPenalty.sips;
    let targetShot = targetPenalty.shot;
    let targetMsg = "";

    // Logique des Jokers
    const hasJoker = (id, jName) => {
        const p = r.players[id];
        return p && p.jokerActive && p.joker === jName && !p.jokerConsumed;
    };

    if (hasJoker(tid, "SHIELD") || hasJoker(tid, "MIRROR")) {
        targetSips = 0; targetShot = false; targetMsg = "Intouchable grâce au pouvoir !";
    } else if (hasJoker(tid, "DOUBLE")) {
        targetSips *= 2; 
        targetMsg = targetDiff <= 10 ? "Pari réussi (0 gorgée) !" : "Pari raté, gorgées doublées !";
    } else {
        if (targetDiff <= 10) targetMsg = "Lucidité parfaite";
        else if (targetDiff <= 20) targetMsg = "Léger déni";
        else if (targetDiff <= 30) targetMsg = "À l'ouest";
        else if (targetDiff <= 40) targetMsg = "Gros déni";
        else targetMsg = "Voilage de face total";
    }

    const groupResults = [];
    Object.keys(votes).forEach(id => {
      if (id === tid || !r.players[id]) return;
      const diff = Math.abs(votes[id] - average);
      let penalty = getPenalty(diff);
      
      if (hasJoker(id, "SHIELD") || hasJoker(id, "MIRROR")) {
          penalty.sips = 0; penalty.shot = false;
      } else if (hasJoker(id, "DOUBLE")) {
          penalty.sips *= 2;
      }
      groupResults.push({ id, name: r.players[id].name, diff, sips: penalty.sips, shot: penalty.shot });
    });

    const result = { 
      average: average, targetVote: tv, targetName: r.question.targetName || "La cible", 
      targetId: tid, targetDiff: targetDiff, targetSips: targetSips, targetShot: targetShot, targetMsg: targetMsg,
      groupResults: groupResults
    };
    
    const updates = { phase: "REVEAL", result: result };

    updates[`players/${tid}/score`] = (r.players[tid].score || 0) + targetDiff;
    groupResults.forEach(p => { updates[`players/${p.id}/score`] = (r.players[p.id].score || 0) + p.diff; });
    
    // Marquer les jokers comme consommés
    Object.keys(r.players).forEach(id => {
       if (r.players[id].jokerActive && !r.players[id].jokerConsumed) {
          updates[`players/${id}/jokerConsumed`] = true;
          updates[`players/${id}/jokerActive`] = false;
       }
    });

    await S.roomRef.update(updates);

  } catch (err) { 
    console.error("Erreur mécanique :", err); 
    revealing = false; // Important pour débloquer en cas d'erreur
  } finally { 
    revealing = false; 
  }
}

export async function endGame() { 
  const r = S.room; if (!r) return;
  const ranked = playersArr(r).sort((a, b) => a.score - b.score);
  const w = ranked[0]; const l = ranked[ranked.length - 1]; 
  await S.roomRef.update({ phase: "STATS", ranking: { winner: { name: w.name, score: w.score }, loser: { name: l.name, score: l.score }, all: ranked.map(p => ({ id: p.id, name: p.name, score: p.score })) } }); 
}

export async function restart() { 
  const r = S.room; if (S.pid !== r.hostId) return; 
  const upd = { phase: "LOBBY", round: 0, votes: null, result: null, ranking: null };
  Object.keys(r.players).forEach(id => { 
      upd[`players/${id}/score`] = 0; 
      upd[`players/${id}/jokerConsumed`] = false; 
      upd[`players/${id}/jokerActive`] = false; 
      upd[`players/${id}/shotTarget`] = null; 
      upd[`players/${id}/joker`] = rand(Object.keys(JOKERS));
  }); 
  await S.roomRef.update(upd); 
}
