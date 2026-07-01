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
        toast("Connexion restaurée ✨", true); 
        return true;
      }
    } catch(e) {}
  }
  return false;
}

export async function createRoom() {
  if (!S.name.trim()) return toast("Veuillez saisir un pseudonyme valide. 🛑"); 
  if (S.isLoading) return; vibrate(20); S.isLoading = true; render(); 
  try {
    let code; for (let i=0; i<5; i++) { code = genCode(); const s = await db.ref("rooms/" + code).get(); if (!s.exists()) break; }
    const pid = genId();
    await db.ref("rooms/" + code).set({ mode: S.pendingMode, phase: "LOBBY", round: 0, hostId: pid, maxRounds: 10, timer: 0, createdAt: ServerValue.TIMESTAMP, players: { [pid]: { name: S.name.trim().slice(0, 20), joker: rand(Object.keys(JOKERS)), score: 0, jokerUsed: false, connected: true } } });
    sessionStorage.setItem('thermo_code', code); sessionStorage.setItem('thermo_pid', pid);
    enterRoom(code, pid);
  } catch(e) { toast("Erreur de connexion au serveur."); } finally { S.isLoading = false; if (!S.room) render(); }
}

export async function joinRoom() {
  if (!S.name.trim()) return toast("Veuillez saisir un pseudonyme valide. 🛑");
  const code = (S.joinCode || "").toUpperCase().trim(); 
  if (S.isLoading) return; vibrate(20); S.isLoading = true; render();
  try {
    const snap = await db.ref("rooms/" + code).get(); 
    if (!snap.exists()) return toast("Salon introuvable. 🕵️‍♂️");
    const room = snap.val();
    
    // RECONNAISSANCE DU JOUEUR (Cas du refresh ou reconnexions manuelles)
    const existingPlayerPair = Object.entries(room.players || {}).find(
      ([id, p]) => p.name.toLowerCase() === S.name.trim().toLowerCase()
    );

    let pid;
    if (existingPlayerPair) {
      // RÉCUPÉRATION DE PROFIL : Le joueur revient dans son ancienne case
      pid = existingPlayerPair[0];
      await db.ref(`rooms/${code}/players/${pid}`).update({ connected: true });
      toast("Te revoilà dans la partie ! ⚡", true);
    } else {
      // NOUVEAU JOUEUR ABSOLU
      pid = genId();
      const newPlayer = { 
        name: S.name.trim().slice(0, 20), 
        joker: rand(Object.keys(JOKERS)), 
        score: 0, 
        jokerUsed: false, 
        connected: true 
      };
      
      const updates = { [`players/${pid}`]: newPlayer };
      // Gestion de l'intégration si une question est déjà en cours de vote
      if (room.phase === "VOTING" && room.expectedVoters) {
        updates[`expectedVoters/${pid}`] = true;
      }
      await db.ref("rooms/" + code).update(updates);
      toast("Bienvenue dans le salon ! 🍻", true);
    }

    sessionStorage.setItem('thermo_code', code); 
    sessionStorage.setItem('thermo_pid', pid);
    enterRoom(code, pid);
  } catch (e) { 
    toast("Erreur réseau."); 
  } finally { 
    S.isLoading = false; 
    if (!S.room) render(); 
  }
}

function enterRoom(code, pid) {
  S.code = code; S.pid = pid; history.replaceState(null, "", "?room=" + code);
  db.ref(`rooms/${code}/players/${pid}`).onDisconnect().update({ connected: false });
  S.roomRef = db.ref("rooms/" + code);
  S.roomRef.on("value", snap => { 
    const room = snap.val();
    if (!room || !room.players || !room.players[S.pid]) { detach(); S.screen = "HOME"; S.room = null; toast("Salon déconnecté."); render(); return; }
    S.room = room; S.screen = "ROOM"; 
    promoteHostIfNeeded(); 
    hostAutoReveal(); 
    render();
  });
}

function detach() {
  if (S.roomRef) { S.roomRef.off(); S.roomRef = null; }
  sessionStorage.removeItem('thermo_code'); sessionStorage.removeItem('thermo_pid');
  S.code = null; S.pid = null; history.replaceState(null, "", window.location.pathname);
}

export async function quitGame() { 
  try {
    if (S.code && S.pid) {
      await db.ref(`rooms/${S.code}/players/${S.pid}`).remove(); 
    }
  } catch(e) {}
  detach(); S.screen = "HOME"; render(); 
}

export async function kickPlayer(id) { await db.ref(`rooms/${S.code}/players/${id}`).remove(); }
export async function changeMaxRounds(num) { if(S.pid !== S.room.hostId) return; await S.roomRef.update({ maxRounds: num }); }
export function pickMode(m) { S.pendingMode = m; render(); }
export async function chooseMode(m) { vibrate(10); await S.roomRef.update({ mode: m }); }

async function promoteHostIfNeeded() { 
  const r = S.room; if (!r || !r.players || promoting || r.hostId === S.pid) return; 
  const host = r.players[r.hostId];
  
  // SÉCURITÉ REFRESH : On ne change d'hôte QUE si le compte de l'ancien gérant a été supprimé (clic sur Quitter)
  if (!host) { 
    const conn = connectedArr(r).sort((a, b) => a.id < b.id ? -1 : 1); 
    if (conn.length > 0 && conn[0].id === S.pid) { 
      promoting = true;
      try {
        await S.roomRef.update({ hostId: S.pid }); 
        toast("Vous êtes le nouvel hôte de la partie 👑", true); 
      } catch(e) {} finally { promoting = false; }
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
  Object.keys(r.players).forEach(id => { upd[`players/${id}/dbl`] = false; });
  await S.roomRef.update(upd);
}

export async function nextRound() { const r = S.room; if (r.maxRounds > 0 && r.round >= r.maxRounds) return endGame(); startRound(); }
export async function vote() { vibrate([30, 50]); await db.ref(`rooms/${S.code}/votes/${S.pid}`).set(Number(S.voteValue)); }

export async function hostAutoReveal() {  
  try {
    const r = S.room; 
    if (!r || r.phase !== "VOTING" || S.pid !== r.hostId || revealing) return;
    
    const expectedIds = Object.keys(r.expectedVoters || {}); 
    const votes = r.votes || {};
    
    const missing = expectedIds.filter(id => r.players[id] && votes[id] === undefined);
    if (missing.length > 0) return; 
    
    revealing = true; 

    const tid = r.question.targetId; 
    const tv = votes[tid] !== undefined ? votes[tid] : 50; 
    
    const nonTargetVotes = Object.keys(votes).filter(id => id !== tid).map(id => votes[id]);
    const average = nonTargetVotes.length > 0 
      ? Math.round(nonTargetVotes.reduce((a, b) => a + b, 0) / nonTargetVotes.length) 
      : 50;
    
    const thomasDiff = Math.abs(tv - average);
    const thomasShot = thomasDiff >= 30;

    const playersDifs = Object.keys(votes)
      .filter(id => id !== tid && r.players[id])
      .map(id => ({
        id,
        name: r.players[id].name,
        diff: Math.abs(votes[id] - tv)
      }))
      .sort((a, b) => b.diff - a.diff);

    const losers = playersDifs.slice(0, 2);

    const result = { 
      average: average, 
      targetVote: tv, 
      targetName: r.question.targetName || "La cible", 
      targetId: tid, 
      thomasDiff: thomasDiff,
      thomasShot: thomasShot, 
      losers: losers
    };
    
    const updates = {
      phase: "REVEAL", 
      result: result,
      [`players/${tid}/score`]: (r.players[tid].score || 0) + (thomasShot ? 20 : 0)
    };

    losers.forEach(l => {
      updates[`players/${l.id}/score`] = (r.players[l.id].score || 0) + 10;
    });
    
    await S.roomRef.update(updates);

  } catch (err) {
    console.error("Erreur mécanique de calcul :", err);
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
  Object.keys(r.players).forEach(id => { upd[`players/${id}/score`] = 0; upd[`players/${id}/jokerUsed`] = false; }); 
  await S.roomRef.update(upd); 
}
