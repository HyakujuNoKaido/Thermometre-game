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
        toast("Reconnexion réussie ✨", true); 
        return true;
      }
    } catch(e) {}
  }
  return false;
}

export async function createRoom() {
  if (!S.name.trim()) return toast("Oups ! Dis-nous comment tu t'appelles."); 
  if (S.isLoading) return; 
  vibrate(20); 
  S.isLoading = true; 
  render(); 
  
  try {
    let code; 
    for (let i=0; i<5; i++) { 
      code = genCode(); 
      const s = await db.ref("rooms/" + code).get(); 
      if (!s.exists()) break; 
    }
    const pid = genId();
    await db.ref("rooms/" + code).set({ 
      mode: S.pendingMode, 
      phase: "LOBBY", 
      round: 0, 
      hostId: pid, 
      maxRounds: 0, 
      timer: 0, 
      createdAt: ServerValue.TIMESTAMP, 
      players: { 
        [pid]: { 
          name: S.name.trim().slice(0, 20), 
          joker: rand(Object.keys(JOKERS)), 
          score: 0, 
          jokerUsed: false, 
          connected: true 
        } 
      } 
    });
    sessionStorage.setItem('thermo_code', code); 
    sessionStorage.setItem('thermo_pid', pid);
    enterRoom(code, pid);
  } catch(e) { 
    toast("Erreur de connexion."); 
  } finally { 
    S.isLoading = false; 
    if (!S.room) render(); 
  }
}

export async function joinRoom() {
  if (!S.name.trim()) return toast("Oups ! Dis-nous comment tu t'appelles.");
  const code = (S.joinCode || "").toUpperCase().trim(); 
  if (S.isLoading) return; 
  vibrate(20); 
  S.isLoading = true; 
  render();
  
  try {
    const snap = await db.ref("rooms/" + code).get(); 
    if (!snap.exists()) return toast("Salle introuvable.");
    const room = snap.val();
    const nameExists = Object.values(room.players || {}).some(p => p.name.toLowerCase() === S.name.trim().toLowerCase());
    if (nameExists) return toast("Ce prénom est déjà pris.");
    
    const pid = genId();
    await db.ref(`rooms/${code}/players/${pid}`).set({ 
      name: S.name.trim().slice(0, 20), 
      joker: rand(Object.keys(JOKERS)), 
      score: 0, 
      jokerUsed: false, 
      connected: true 
    });
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
  S.code = code; 
  S.pid = pid; 
  history.replaceState(null, "", "?room=" + code);
  db.ref(`rooms/${code}/players/${pid}`).onDisconnect().update({ connected: false });
  S.roomRef = db.ref("rooms/" + code);
  S.roomRef.on("value", snap => { 
    const room = snap.val();
    if (!room || !room.players || !room.players[S.pid]) { 
      detach(); 
      S.screen = "HOME"; 
      S.room = null; 
      toast("Tu as quitté la salle."); 
      render(); 
      return; 
    }
    S.room = room; 
    S.screen = "ROOM"; 
    promoteHostIfNeeded(); 
    hostAutoReveal(); 
    render();
  });
}

function detach() {
  if (S.roomRef) { 
    S.roomRef.off(); 
    S.roomRef = null; 
  }
  sessionStorage.removeItem('thermo_code'); 
  sessionStorage.removeItem('thermo_pid');
  S.code = null; 
  S.pid = null; 
  history.replaceState(null, "", window.location.pathname);
}

export async function quitGame() { 
  await db.ref(`rooms/${S.code}/players/${S.pid}`).remove(); 
  detach(); 
  S.screen = "HOME"; 
  render(); 
}

export async function kickPlayer(id) { 
  await db.ref(`rooms/${S.code}/players/${id}`).remove(); 
  toast("Joueur expulsé."); 
}

export async function stealJoker(id) { 
  const r = S.room; 
  await S.roomRef.update({ 
    [`players/${S.pid}/joker`]: r.players[id].joker, 
    [`players/${id}/joker`]: r.players[S.pid].joker 
  }); 
  toast("Voleur ! 🥷", true); 
}

export async function selectJoker(k) { 
  vibrate(10); 
  await S.roomRef.update({ [`players/${S.pid}/joker`]: k }); 
}

export async function addDossier() {
  const el = document.getElementById("dossierI"); 
  const text = el.value.trim();
  if (!text || !text.includes("{name}")) return toast("Ta question doit contenir {name} !");
  await db.ref(`rooms/${S.code}/dossiers`).push(text); 
  el.value = ""; 
  toast("Dossier secret ajouté ! 🤫", true);
}

export function pickMode(m) { 
  S.pendingMode = m; 
  render(); 
}

export async function chooseMode(m) { 
  vibrate(10); 
  await S.roomRef.update({ mode: m }); 
}

async function promoteHostIfNeeded() { 
  const r = S.room; 
  if (!r) return; 
  const host = r.players[r.hostId];
  if (host && host.connected === false) { 
    const conn = connectedArr(r).sort((a, b) => a.id < b.id ? -1 : 1); 
    if (conn.length && conn[0].id === S.pid) { 
      await S.roomRef.update({ hostId: S.pid }); 
      toast("Tu es le nouvel hôte 👑", true); 
    } 
  } 
}

export async function startRound() {
  const r = S.room; 
  if (S.pid !== r.hostId) return;
  if (connectedArr(r).length < 2) return toast("Il faut au moins 2 joueurs !");
  vibrate(50);
  
  const t = rand(connectedArr(r)); 
  const qText = rand(QUESTIONS[r.mode]).replace(/{name}/g, t.name);
  
  const expectedVoters = {}; 
  connectedArr(r).forEach(p => expectedVoters[p.id] = true);
  
  const upd = { 
    phase: "VOTING", 
    round: (r.round || 0) + 1, 
    question: { text: qText, targetId: t.id, targetName: t.name }, 
    expectedVoters: expectedVoters, 
    votes: null, 
    result: null, 
    startedAt: ServerValue.TIMESTAMP 
  };
  
  Object.keys(r.players).forEach(id => { upd[`players/${id}/dbl`] = false; });
  await S.roomRef.update(upd);
}

export async function nextRound() { 
  const r = S.room; 
  if (r.maxRounds > 0 && r.round >= r.maxRounds) return endGame(); 
  startRound(); 
}

export async function vote() { 
  vibrate([30, 50]); 
  await db.ref(`rooms/${S.code}/votes/${S.pid}`).set(Number(S.voteValue)); 
}

export async function hostAutoReveal() { 
  const r = S.room; 
  if (!r || r.phase !== "VOTING" || S.pid !== r.hostId || revealing) return;
  
  const expectedIds = Object.keys(r.expectedVoters || {}); 
  const votes = r.votes || {};
  if (expectedIds.filter(id => r.players[id] && r.players[id].connected && votes[id] === undefined).length > 0) return;
  
  revealing = true; 
  const tid = r.question.targetId; 
  const pool = Object.values(votes);
  const average = Math.round(pool.reduce((a, b) => a + b, 0) / pool.length); 
  const tv = votes[tid] !== undefined ? votes[tid] : 50; 
  const diff = Math.abs(tv - average);
  
  const isClose = diff <= 15; 
  let sips = diff > 45 ? 4 : (diff > 25 ? 2 : 1); 
  if (r.mode === "Hardcore") sips += 1;
  const dbl = !!(r.players[tid] && r.players[tid].dbl);
  
  const finalSips = isClose ? (dbl ? 2 : 1) : (dbl ? sips * 2 : sips);
  const finalDrinker = isClose ? "others" : tid;
  const finalDrinkerName = isClose ? null : r.question.targetName;
  
  const result = { 
    average: average, 
    targetVote: tv, 
    targetName: r.question.targetName, 
    targetId: tid, 
    diff: diff, 
    isClose: isClose, 
    double: dbl, 
    sips: finalSips, 
    drinker: finalDrinker, 
    drinkerName: finalDrinkerName, 
    jokerUsed: null, 
    shot: null 
  };
  
  await S.roomRef.update({ 
    phase: "REVEAL", 
    result: result, 
    [`players/${tid}/score`]: (r.players[tid].score || 0) + diff 
  });
  revealing = false;
}

export async function activateDouble() { 
  const r = S.room; 
  const me = r.players[S.pid]; 
  if (me.joker !== "DOUBLE" || me.jokerUsed || r.question.targetId !== S.pid) return; 
  
  vibrate(30); 
  await S.roomRef.update({ 
    [`players/${S.pid}/dbl`]: true, 
    [`players/${S.pid}/jokerUsed`]: true 
  }); 
  toast("Double activé ! ✖️2", true); 
}

export async function useJoker() { 
  const r = S.room; 
  const res = r.result; 
  const me = r.players[S.pid]; 
  if (!res || res.isClose || me.jokerUsed || res.jokerUsed || res.drinker !== S.pid) return; 
  
  vibrate([20, 40, 20]); 
  const upd = { [`players/${S.pid}/jokerUsed`]: true };
  if (me.joker === "SHIELD") { 
    upd["result/jokerUsed"] = "SHIELD"; 
    upd["result/drinker"] = "none"; 
    upd["result/drinkerName"] = null; 
  } else if (me.joker === "MIRROR") { 
    const others = connectedArr(r).filter(p => p.id !== S.pid); 
    if (others.length) { 
      const victim = rand(others); 
      upd["result/jokerUsed"] = "MIRROR"; 
      upd["result/drinker"] = victim.id; 
      upd["result/drinkerName"] = victim.name; 
    } 
  }
  await S.roomRef.update(upd);
}

export async function shotPick(id) { 
  const r = S.room; 
  const me = r.players[S.pid]; 
  if (me.joker !== "SHOT" || me.jokerUsed) return; 
  
  vibrate(40); 
  await S.roomRef.update({ 
    [`players/${S.pid}/jokerUsed`]: true, 
    "result/shot": { by: me.name, who: r.players[id].name } 
  }); 
  S.pickingShot = false; 
  render();
}

export async function endGame() { 
  const r = S.room; 
  if (S.pid !== r.hostId) return; 
  
  const ranked = playersArr(r).sort((a, b) => a.score - b.score);
  const w = ranked[0]; 
  const l = ranked[ranked.length - 1]; 
  const roast = (l ? rand(ROASTS) : "").replace(/{name}/g, l ? l.name : "");
  
  await S.roomRef.update({ 
    phase: "STATS", 
    ranking: { 
      winner: { name: w.name, score: w.score }, 
      loser: { name: l.name, score: l.score }, 
      all: ranked.map(p => ({ id: p.id, name: p.name, score: p.score })) 
    }, 
    roast: roast 
  }); 
}

export async function restart() { 
  const r = S.room; 
  if (S.pid !== r.hostId) return; 
  
  const upd = { phase: "LOBBY", round: 0, votes: null, result: null, ranking: null, roast: null };
  Object.keys(r.players).forEach(id => { 
    upd[`players/${id}/score`] = 0; 
    upd[`players/${id}/jokerUsed`] = false; 
    upd[`players/${id}/dbl`] = false; 
  }); 
  await S.roomRef.update(upd); 
}
