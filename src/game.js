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
    const room = snap.val();
    const nameExists = Object.values(room.players || {}).some(p => p.name.toLowerCase() === S.name.trim().toLowerCase());
    if (nameExists) return toast("Ce prénom est déjà pris.");
    
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
    if (!room || !room.players || !room.players[S.pid]) { detach(); S.screen = "HOME"; S.room = null; toast("Tu as quitté la salle."); render(); return; }
    S.room = room; S.screen = "ROOM"; promoteHostIfNeeded(); hostAutoReveal(); render();
  });
}

function detach() {
  if (S.roomRef) { S.roomRef.off(); S.roomRef = null; }
  localStorage.removeItem('thermo_code'); localStorage.removeItem('thermo_pid');
  S.code = null; S.pid = null; history.replaceState(null, "", window.location.pathname);
}

export async function quitGame() { await db.ref(`rooms/${S.code}/players/${S.pid}`).remove(); detach(); S.screen = "HOME"; render(); }
export async function kickPlayer(id) { await db.ref(`rooms/${S.code}/players/${id}`).remove(); toast("Joueur expulsé."); }
export async function stealJoker(id) { const r = S.room; await S.roomRef.update({ [`players/${S.pid}/joker`]: r.players[id].joker, [`players/${id}/joker`]: r.players[S.pid].joker }); toast("Voleur ! 🥷", true); }
export async function selectJoker(k) { vibrate(10); await S.roomRef.update({ [`players/${S.pid}/joker`]: k }); }
export async function addDossier() {
  const el = document.getElementById("dossierI"); const text = el.value.trim();
  if (!text || !text.includes("{name}")) return toast("Ta question doit contenir {name} !");
  await db.ref(`rooms/${S.code}/dossiers`).push(text); el.value = ""; toast("Dossier secret ajouté ! 🤫", true);
}
export function pickMode(m) { S.pendingMode = m; render(); }
export async function chooseMode(m) { vibrate(10); await S.roomRef.update({ mode: m }); }

async function promoteHostIfNeeded() { 
  const r = S.room; if (!r) return; const host = r.players[r.hostId];
  if (host && host.connected === false) { 
    const conn = connectedArr(r).sort((a, b) => a.id < b.id ? -1 : 1); 
    if (conn.length && conn[0].id === S.pid) { await S.roomRef.update({ hostId: S.pid }); toast("Tu es le nouvel hôte 👑", true); } 
  } 
}

export async function startRound() {
  const r = S.room; if (S.pid !== r.hostId) return;
  if (connectedArr(r).length < 2) return toast("Il faut au moins 2 joueurs !");
  vibrate(50);
  const t = rand(connectedArr(r)); const qText = rand(QUESTIONS[r.mode]).replace(/{name}/g, t.name);
  const expectedVoters = {}; connectedArr(r).forEach(p => expectedVoters[p.id] = true);
  
  const upd = { phase: "VOTING", round: (r.round || 0) + 1, question: {text: qText, targetId
