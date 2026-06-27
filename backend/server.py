from fastapi import FastAPI, APIRouter, WebSocket, WebSocketDisconnect
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
import os
import json
import random
import string
import asyncio
import logging
from pathlib import Path

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

import game  # noqa: E402

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

app = FastAPI()
api_router = APIRouter(prefix="/api")

JOKERS = {
    "SHIELD": {"name": "Bouclier", "desc": "Annule tes gorgées une fois dans la partie."},
    "MIRROR": {"name": "Miroir", "desc": "Transfère tes gorgées à un autre joueur au hasard."},
}

ROOMS = {}
CONNECTIONS = {}


def gen_code():
    while True:
        code = "".join(random.choices(string.ascii_uppercase + string.digits, k=4))
        if code not in ROOMS:
            return code


def gen_pid():
    return "".join(random.choices(string.ascii_lowercase + string.digits, k=8))


def public_state(room, recipient_id):
    phase = room["phase"]
    players = [{
        "id": p["id"], "name": p["name"], "joker": p["joker"],
        "jokerName": JOKERS[p["joker"]]["name"], "score": p["score"],
        "isHost": p["id"] == room["hostId"],
        "hasVoted": p["id"] in room["votes"],
        "jokerUsed": p["jokerUsed"],
        "connected": p.get("connected", True),
    } for p in room["players"]]

    state = {
        "type": "state",
        "code": room["code"],
        "mode": room["mode"],
        "phase": phase,
        "round": room["round"],
        "hostId": room["hostId"],
        "you": recipient_id,
        "isHost": recipient_id == room["hostId"],
        "players": players,
        "jokers": JOKERS,
        "votedCount": len(room["votes"]),
        "question": room.get("question"),
    }
    if phase == "REVEAL" or phase == "STATS":
        state["result"] = room.get("result")
    if phase == "STATS":
        state["ranking"] = room.get("ranking")
        state["roast"] = room.get("roast")
    return state


async def broadcast(code):
    room = ROOMS.get(code)
    if not room:
        return
    conns = CONNECTIONS.get(code, {})
    dead = []
    for pid, ws in list(conns.items()):
        try:
            await ws.send_text(json.dumps(public_state(room, pid)))
        except Exception:
            dead.append(pid)
    for pid in dead:
        conns.pop(pid, None)


def get_player(room, pid):
    return next((p for p in room["players"] if p["id"] == pid), None)


async def refill_ai_pool(code, mode):
    room = ROOMS.get(code)
    if not room or room.get("ai_disabled"):
        return
    qs = await game.generate_ai_questions(mode)
    room = ROOMS.get(code)
    if not room:
        return
    if qs:
        room["ai_pool"].setdefault(mode, []).extend(qs)
    else:
        room["ai_disabled"] = True


def next_question(room):
    mode = room["mode"]
    players = [p for p in room["players"] if p.get("connected", True)]
    pool = room["ai_pool"].get(mode, [])
    target = random.choice(players)
    if pool:
        template = pool.pop(0)
        cible2 = None
        if "{name2}" in template:
            others = [p for p in players if p["id"] != target["id"]] or players
            t2 = random.choice(others)
            cible2 = t2["name"]
            text = template.replace("{name}", target["name"]).replace("{name2}", t2["name"])
        else:
            text = template.replace("{name}", target["name"])
        return {"text": text, "targetId": target["id"], "targetName": target["name"], "cible2": cible2}
    return game.build_question(mode, players)


def compute_result(room):
    votes = room["votes"]
    q = room["question"]
    target_id = q["targetId"]
    non_target = [v for pid, v in votes.items() if pid != target_id]
    pool = non_target if non_target else list(votes.values())
    average = round(sum(pool) / len(pool)) if pool else 0
    target_vote = votes.get(target_id, 50)
    diff = abs(target_vote - average)
    is_close = diff <= 15

    sips = 1
    if diff > 20:
        sips = 2
    if diff > 40:
        sips = 4
    if room["mode"] == "Hardcore":
        sips += 1

    tgt = get_player(room, target_id)
    if tgt:
        tgt["score"] += diff

    if is_close:
        verdict = {"drinker": "others", "drinkerName": None, "sips": 1}
    else:
        verdict = {"drinker": target_id, "drinkerName": q["targetName"], "sips": sips}

    return {
        "average": average,
        "targetVote": target_vote,
        "targetName": q["targetName"],
        "targetId": target_id,
        "diff": diff,
        "isClose": is_close,
        "jokerUsed": None,
        **verdict,
    }


def build_ranking(room):
    ranked = sorted(room["players"], key=lambda p: p["score"])
    ranking = [{"name": p["name"], "score": p["score"], "id": p["id"]} for p in ranked]
    loser = ranked[-1] if ranked else None
    winner = ranked[0] if ranked else None
    roast = ""
    if loser:
        roast = random.choice(game.ROASTS).format(name=loser["name"], score=loser["score"])
    room["ranking"] = {
        "winner": {"name": winner["name"], "score": winner["score"]} if winner else None,
        "loser": {"name": loser["name"], "score": loser["score"]} if loser else None,
        "all": ranking,
    }
    room["roast"] = roast


async def handle_message(code, pid, data):
    room = ROOMS.get(code)
    if not room:
        return
    action = data.get("type")
    player = get_player(room, pid)

    if action == "set_mode" and pid == room["hostId"] and room["phase"] == "LOBBY":
        mode = data.get("mode")
        if mode in game.QUESTION_BANK:
            room["mode"] = mode
            asyncio.create_task(refill_ai_pool(code, mode))
            await broadcast(code)

    elif action == "start_round" and pid == room["hostId"]:
        connected = [p for p in room["players"] if p.get("connected", True)]
        if len(connected) < 2:
            return
        room["votes"] = {}
        room["result"] = None
        room["round"] += 1
        room["question"] = next_question(room)
        room["phase"] = "VOTING"
        if len(room["ai_pool"].get(room["mode"], [])) < 2:
            asyncio.create_task(refill_ai_pool(code, room["mode"]))
        await broadcast(code)

    elif action == "vote" and room["phase"] == "VOTING" and player:
        try:
            val = max(0, min(100, int(data.get("value", 50))))
        except (TypeError, ValueError):
            return
        room["votes"][pid] = val
        connected = [p for p in room["players"] if p.get("connected", True)]
        if all(p["id"] in room["votes"] for p in connected):
            room["result"] = compute_result(room)
            room["phase"] = "REVEAL"
        await broadcast(code)

    elif action == "use_joker" and room["phase"] == "REVEAL" and player:
        result = room.get("result")
        if not result or result["isClose"] or player["jokerUsed"]:
            return
        if result["drinker"] != pid:
            return
        if player["joker"] == "SHIELD":
            result["jokerUsed"] = "SHIELD"
            result["drinker"] = "none"
            result["drinkerName"] = None
        elif player["joker"] == "MIRROR":
            others = [p for p in room["players"] if p["id"] != pid and p.get("connected", True)]
            if others:
                victim = random.choice(others)
                result["jokerUsed"] = "MIRROR"
                result["drinker"] = victim["id"]
                result["drinkerName"] = victim["name"]
        player["jokerUsed"] = True
        await broadcast(code)

    elif action == "next" and pid == room["hostId"]:
        await handle_message(code, pid, {"type": "start_round"})

    elif action == "end_game" and pid == room["hostId"]:
        build_ranking(room)
        room["phase"] = "STATS"
        await broadcast(code)

    elif action == "restart" and pid == room["hostId"]:
        for p in room["players"]:
            p["score"] = 0
            p["jokerUsed"] = False
        room["phase"] = "LOBBY"
        room["votes"] = {}
        room["result"] = None
        room["round"] = 0
        await broadcast(code)


@api_router.get("/")
async def root():
    return {"message": "Le Thermomètre API"}


@api_router.websocket("/ws")
async def ws_endpoint(websocket: WebSocket):
    await websocket.accept()
    code = None
    pid = None
    try:
        while True:
            raw = await websocket.receive_text()
            data = json.loads(raw)
            action = data.get("type")

            if action == "create_room" and code is None:
                code = gen_code()
                pid = gen_pid()
                name = (data.get("name") or "Hôte").strip()[:20]
                mode = data.get("mode") if data.get("mode") in game.QUESTION_BANK else "Chill"
                joker = random.choice(list(JOKERS.keys()))
                ROOMS[code] = {
                    "code": code, "mode": mode, "phase": "LOBBY", "round": 0,
                    "hostId": pid, "players": [], "votes": {}, "result": None,
                    "ai_pool": {}, "question": None,
                }
                ROOMS[code]["players"].append({
                    "id": pid, "name": name, "joker": joker, "score": 0,
                    "jokerUsed": False, "connected": True,
                })
                CONNECTIONS.setdefault(code, {})[pid] = websocket
                asyncio.create_task(refill_ai_pool(code, mode))
                await websocket.send_text(json.dumps({"type": "joined", "code": code, "playerId": pid}))
                await broadcast(code)

            elif action == "join_room" and code is None:
                jcode = (data.get("code") or "").upper().strip()
                room = ROOMS.get(jcode)
                name = (data.get("name") or "Joueur").strip()[:20]
                if not room:
                    await websocket.send_text(json.dumps({"type": "error", "message": "Room introuvable."}))
                    continue
                if room["phase"] != "LOBBY":
                    await websocket.send_text(json.dumps({"type": "error", "message": "La partie a déjà commencé."}))
                    continue
                if any(p["name"].lower() == name.lower() for p in room["players"]):
                    await websocket.send_text(json.dumps({"type": "error", "message": "Ce prénom est déjà pris."}))
                    continue
                code = jcode
                pid = gen_pid()
                joker = random.choice(list(JOKERS.keys()))
                room["players"].append({
                    "id": pid, "name": name, "joker": joker, "score": 0,
                    "jokerUsed": False, "connected": True,
                })
                CONNECTIONS.setdefault(code, {})[pid] = websocket
                await websocket.send_text(json.dumps({"type": "joined", "code": code, "playerId": pid}))
                await broadcast(code)

            elif code and pid:
                await handle_message(code, pid, data)
    except WebSocketDisconnect:
        pass
    except Exception as e:
        logger.warning(f"WS error: {e}")
    finally:
        if code and pid:
            conns = CONNECTIONS.get(code, {})
            conns.pop(pid, None)
            room = ROOMS.get(code)
            if room:
                player = get_player(room, pid)
                if player:
                    if room["phase"] == "LOBBY":
                        room["players"] = [p for p in room["players"] if p["id"] != pid]
                    else:
                        player["connected"] = False
                if not conns:
                    ROOMS.pop(code, None)
                    CONNECTIONS.pop(code, None)
                else:
                    if room["hostId"] == pid and room["players"]:
                        room["hostId"] = room["players"][0]["id"]
                    await broadcast(code)


app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)
