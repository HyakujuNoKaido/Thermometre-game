import { S, GEMINI_API_KEY, QUESTIONS, JOKERS, THEMES, BANK, ROASTS, rand, genId, genCode, esc, connectedArr, playersArr, vibrate } from './store.js';
import { db, ServerValue } from './firebase.js';
import { render, toast } from './ui.js';

let revealing = false;

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
        toast("T'es de retour ! ✨", true); 
        return true;
      }
    } catch(e) {}
  }
  return false;
}

export async function createRoom() {
  if (!S.name.trim()) return toast("Eh, tu dois mettre un blaze pour jouer ! 🛑"); 
  if (S.isLoading) return; vibrate(20); S.isLoading = true; render(); 
  try {
    let code; for (let i=0; i<5; i++) { code = genCode(); const s = await db.ref("rooms/" + code).get(); if (!s.exists()) break; }
    const pid = genId();
    await db.ref("rooms/" + code).set({ mode: S.pendingMode, phase: "LOBBY", round: 0, hostId: pid, maxRounds: 10, timer: 0, createdAt: ServerValue.TIMESTAMP, players: { [pid]: { name: S.name.trim().slice(0, 20), joker: rand(Object.keys(JOKERS)), score: 0, jokerUsed: false, connected: true } } });
    sessionStorage.setItem('thermo_code', code); sessionStorage.setItem('thermo_pid', pid);
    enterRoom(code, pid);
  } catch(e) { toast("Erreur de connexion."); } finally { S.isLoading = false; if (!S.room) render(); }
}

export async function joinRoom() {
  if (!S.name.trim()) return toast("Eh, tu dois mettre un blaze pour jouer ! 🛑");
  const code = (S.joinCode || "").toUpperCase().trim(); 
  if (S.isLoading) return; vibrate(20); S.isLoading = true; render();
  try {
    const snap = await db.ref("rooms/" + code).get(); 
    if (!snap.exists()) return toast("Code introuvable. T'es sûr de toi ? 🤔");
    const room = snap.val();
    const nameExists = Object.values(room.players || {}).some(p => p.name.toLowerCase() === S.name.trim().toLowerCase());
    if (nameExists) return toast("Ce pseudo est déjà pris dans la partie ! 👯");
    
    const pid = genId();
    await db.ref(`rooms/${code}/players/${pid}`).set({ name: S.name.trim().slice(0, 20), joker: rand(Object.keys(JOKERS)), score: 0, jokerUsed: false, connected: true });
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
    if (!room || !room.players || !room.players[S.pid]) { detach(); S.screen = "HOME"; S.room = null; toast("Tu as quitté le salon."); render(); return; }
    S.room = room; S.screen = "ROOM"; promoteHostIfNeeded(); hostAutoReveal(); render();
  });
}

function detach() {
  if (S.roomRef) { S.roomRef.off(); S.roomRef = null; }
  sessionStorage.removeItem('thermo_code'); sessionStorage.removeItem('thermo_pid');
  S.code = null; S.pid = null; history.replaceState(null, "", window.location.pathname);
}

export async function quitGame() { await db.ref(`rooms/${S.code}/players/${S.pid}`).remove(); detach(); S.screen = "HOME"; render(); }
export async function kickPlayer(id) { await db.ref(`rooms/${S.code}/players/${id}`).remove(); toast("Joueur viré 🚪"); }
export async function stealJoker(id) { const r = S.room; await S.roomRef.update({ [`players/${S.pid}/joker`]: r.players[id].joker, [`players/${id}/joker`]: r.players[S.pid].joker }); toast("Pouvoir volé en scred ! 🥷", true); }
export async function selectJoker(k) { vibrate(10); await S.roomRef.update({ [`players/${S.pid}/joker`]: k }); }
export async function changeMaxRounds(num) { if(S.pid !== S.room.hostId) return; await S.roomRef.update({ maxRounds: num }); }
export function pickMode(m) { S.pendingMode = m; render(); }
export async function chooseMode(m) { vibrate(10); await S.roomRef.update({ mode: m }); }

async function promoteHostIfNeeded() { 
  const r = S.room; if (!r) return; const host = r.players[r.hostId];
  if (host && host.connected === false) { 
    const conn = connectedArr(r).sort((a, b) => a.id < b.id ? -1 : 1); 
    if (conn.length && conn[0].id === S.pid) { await S.roomRef.update({ hostId: S.pid }); toast("C'est toi le boss du salon 👑", true); } 
  } 
}

export async function startRound() {
  const r = S.room; if (S.pid !== r.hostId) return;
  if (connectedArr(r).length < 2) return toast("Rameute au moins un pote pour jouer !");
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
  const r = S.room; if (!r || r.phase !== "VOTING" || S.pid !== r.hostId || revealing) return;
  const expectedIds = Object.keys(r.expectedVoters || {}); const votes = r.votes || {};
  if (expectedIds.filter(id => r.players[id] && r.players[id].connected && votes[id] === undefined).length > 0) return;
  
  revealing = true; const tid = r.question.targetId; 
  
  // CORRECTION DU BUG MATHÉMATIQUE ICI : On exclut le vote de la cible !
  const nonTargetVotes = Object.keys(votes).filter(id => id !== tid).map(id => votes[id]);
  const pool = nonTargetVotes.length > 0 ? nonTargetVotes : [50]; 
  
  const average = Math.round(pool.reduce((a, b) => a + b, 0) / pool.length); 
  const tv = votes[tid] !== undefined ? votes[tid] : 50; 
  const diff = Math.abs(tv - average);
  
  const isClose = diff <= 15; let sips = diff > 45 ? 4 : (diff > 25 ? 2 : 1); if (r.mode === "Hardcore") sips += 1;
  const dbl = !!(r.players[tid] && r.players[tid].dbl);
  
  const finalSips = isClose ? (dbl ? 2 : 1) : (dbl ? sips * 2 : sips);
  const finalDrinker = isClose ? "others" : tid;
  const finalDrinkerName = isClose ? null : r.question.targetName;
  
  const result = { average, targetVote: tv, targetName: r.question.targetName, targetId: tid, diff, isClose, double: dbl, sips: finalSips, drinker: finalDrinker, drinkerName: finalDrinkerName, jokerUsed: null, shot: null };
  await S.roomRef.update({ phase: "REVEAL", result, [`players/${tid}/score`]: (r.players[tid].score || 0) + diff });
  revealing = false;
}

export async function endGame() { 
  const r = S.room; if (!r) return;
  const ranked = playersArr(r).sort((a, b) => a.score - b.score);
  const w = ranked[0]; const l = ranked[ranked.length - 1]; 
  const roast = (l ? rand(ROASTS) : "").replace(/{name}/g, l ? l.name : "");
  await S.roomRef.update({ phase: "STATS", ranking: { winner: { name: w.name, score: w.score }, loser: { name: l.name, score: l.score }, all: ranked.map(p => ({ id: p.id, name: p.name, score: p.score })) }, roast }); 
}

export async function restart() { 
  const r = S.room; if (S.pid !== r.hostId) return; 
  const upd = { phase: "LOBBY", round: 0, votes: null, result: null, ranking: null, roast: null };
  Object.keys(r.players).forEach(id => { upd[`players/${id}/score`] = 0; upd[`players/${id}/jokerUsed`] = false; upd[`players/${id}/dbl`] = false; }); 
  await S.roomRef.update(upd); 
}
