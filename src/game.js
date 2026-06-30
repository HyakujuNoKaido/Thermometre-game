import { S, GEMINI_API_KEY, QUESTIONS, JOKERS, THEMES, BANK, ROASTS, rand, genId, genCode, esc, connectedArr, playersArr, vibrate } from './store.js';
import { db, ServerValue } from './firebase.js';
import { render, toast } from './ui.js';

let revealing = false;

export async function tryReconnect() {
  const code = localStorage.getItem('thermo_code'); const pid = localStorage.getItem('thermo_pid');
  if (code && pid) {
    try {
      const snap = await db.ref("rooms/" + code).get();
      if (snap.exists() && snap.val().players && snap.val().players[pid]) {
        S.name = snap.val().players[pid].name;
        await db.ref(`rooms/${code}/players/${pid}`).update({connected: true});
        enterRoom(code, pid); toast("Reconnexion réussie ✨", true); return true;
      }
    } catch(e) {}
  }
  return false;
}

export async function createRoom() {
  if (!S.name.trim()) return toast("Oups ! Dis-nous comment tu t'appelles."); 
  if (S.isLoading) return; vibrate(20); S.isLoading = true; render(); 
  try {
    let code; for (let i=0; i<5; i++) { code = genCode(); const s = await db.ref("rooms/" + code).get(); if (!s.exists()) break; }
    const pid = genId();
    await db.ref("rooms/" + code).set({ mode: S.pendingMode, phase: "LOBBY", round: 0, hostId: pid, maxRounds: 0, timer: 0, createdAt: ServerValue.TIMESTAMP, players: { [pid]: { name: S.name.trim().slice(0, 20), joker: rand(Object.keys(JOKERS)), score: 0, jokerUsed: false, connected: true } } });
    localStorage.setItem('thermo_code', code); localStorage.setItem('thermo_pid', pid);
    enterRoom(code, pid);
  } catch(e) { toast("Erreur de connexion."); } finally { S.isLoading = false; if (!S.room) render(); }
}

export async function joinRoom() {
  if (!S.name.trim()) return toast("Oups ! Dis-nous comment tu t'appelles.");
  const code = (S.joinCode || "").toUpperCase().trim(); 
  if (S.isLoading) return; vibrate(20); S.isLoading = true; render();
  try {
    const snap = await db.ref("rooms/" + code).get(); 
    if (!snap.exists()) return toast("Salle introuvable.");
    const pid = genId();
    await db.ref(`rooms/${code}/players/${pid}`).set({ name: S.name.trim().slice(0, 20), joker: rand(Object.keys(JOKERS)), score: 0, jokerUsed: false, connected: true });
    localStorage.setItem('thermo_code', code); localStorage.setItem('thermo_pid', pid);
    enterRoom(code, pid);
  } catch (e) { toast("Erreur réseau."); } finally { S.isLoading = false; if (!S.room) render(); }
}

function enterRoom(code, pid) {
  S.code = code; S.pid = pid; history.replaceState(null, "", "?room=" + code);
  db.ref(`rooms/${code}/players/${pid}`).onDisconnect().update({ connected: false });
  S.roomRef = db.ref("rooms/" + code);
  S.roomRef.on("value", snap => { 
    const room = snap.val();
    if (!room || !room.players || !room.players[S.pid]) { S.screen = "HOME"; S.room = null; toast("Tu as quitté la salle."); render(); return; }
    S.room = room; S.screen = "ROOM"; hostAutoReveal(); render();
  });
}

export async function quitGame() { await db.ref(`rooms/${S.code}/players/${S.pid}`).remove(); S.screen = "HOME"; render(); }
export function pickMode(m) { S.pendingMode = m; render(); }
export async function chooseMode(m) { await S.roomRef.update({ mode: m }); }
export async function selectJoker(k) { await S.roomRef.update({ [`players/${S.pid}/joker`]: k }); }
export async function stealJoker(id) { const r = S.room; await S.roomRef.update({ [`players/${S.pid}/joker`]: r.players[id].joker, [`players/${id}/joker`]: r.players[S.pid].joker }); toast("Voleur ! 🥷", true); }

export async function startRound() {
  const r = S.room; if (S.pid !== r.hostId) return;
  const t = rand(connectedArr(r)); const qText = rand(QUESTIONS[r.mode]).replace(/{name}/g, t.name);
  const expectedVoters = {}; connectedArr(r).forEach(p => expectedVoters[p.id] = true);
  await S.roomRef.update({ phase: "VOTING", round: (r.round || 0) + 1, question: {text: qText, targetId: t.id, targetName: t.name}, expectedVoters, votes: null, result: null });
}

export async function vote() { await db.ref(`rooms/${S.code}/votes/${S.pid}`).set(Number(S.voteValue)); }

export async function hostAutoReveal() { 
  const r = S.room; if (!r || r.phase !== "VOTING" || S.pid !== r.hostId || revealing) return;
  const expectedIds = Object.keys(r.expectedVoters || {}); const votes = r.votes || {};
  if (expectedIds.filter(id => r.players[id] && r.players[id].connected && votes[id] === undefined).length > 0) return;
  
  revealing = true; const tid = r.question.targetId; const pool = Object.values(votes);
  const average = Math.round(pool.reduce((a, b) => a + b, 0) / pool.length); const tv = votes[tid] ?? 50; const diff = Math.abs(tv - average);
  
  const result = { average, targetVote: tv, targetName: r.question.targetName, targetId: tid, diff, isClose: diff <= 15 };
  await S.roomRef.update({ phase: "REVEAL", result, [`players/${tid}/score`]: (r.players[tid].score || 0) + diff });
  revealing = false;
}

export async function nextRound() { startRound(); }
export async function restart() { await S.roomRef.update({ phase: "LOBBY", round: 0 }); }
