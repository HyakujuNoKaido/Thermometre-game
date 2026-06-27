"""Game logic, question bank and AI question generation for Le Thermomètre."""
import os
import json
import random
import logging

logger = logging.getLogger(__name__)

EMERGENT_LLM_KEY = os.environ.get("EMERGENT_LLM_KEY")

QUESTION_BANK = {
    "Chill": [
        "À quel pourcentage {name} est susceptible de s'endormir devant un film avant le générique ?",
        "À quel pourcentage {name} a le pire sens de l'orientation du groupe ?",
        "À quel pourcentage {name} chante faux sous la douche ?",
        "À quel pourcentage {name} oublie les anniversaires de ses proches ?",
        "À quel pourcentage {name} et {name2} feraient un bon road-trip ensemble ?",
        "À quel pourcentage {name} pleure devant un film d'animation ?",
        "À quel pourcentage {name} est accro à son téléphone ?",
        "À quel pourcentage {name} arriverait en retard à son propre mariage ?",
    ],
    "Spicy": [
        "À quel pourcentage {name} a déjà fouillé dans le téléphone de quelqu'un ?",
        "À quel pourcentage {name} survend ses exploits au lit ?",
        "À quel pourcentage {name} a déjà menti pour annuler un plan ?",
        "À quel pourcentage {name} flirterait avec un ex après quelques verres ?",
        "À quel pourcentage {name} et {name2} ont déjà eu un crush l'un sur l'autre ?",
        "À quel pourcentage {name} regarde encore le profil de son ex ?",
        "À quel pourcentage {name} embrasserait un inconnu ce soir ?",
        "À quel pourcentage {name} a déjà envoyé un texto qu'il/elle regrette ?",
    ],
    "Hardcore": [
        "Si on devait sacrifier l'un d'entre vous, à quel pourcentage choisirait-on {name} ?",
        "À quel pourcentage {name} rirait secrètement à un enterrement ?",
        "À quel pourcentage {name} trahirait le groupe pour de l'argent ?",
        "À quel pourcentage {name} cacherait un corps sans poser de questions ?",
        "À quel pourcentage {name} et {name2} formeraient le pire couple toxique ?",
        "À quel pourcentage {name} finirait en prison avant 40 ans ?",
        "À quel pourcentage {name} balancerait un secret pour sauver sa peau ?",
        "À quel pourcentage {name} a déjà souhaité du mal à quelqu'un ici ?",
    ],
}

ROASTS = [
    "{name}, finir dernier avec {score} points d'écart, c'est pas être nul, c'est vivre dans un univers parallèle. Bois et tais-toi.",
    "{name}, ton intuition sociale est aussi affûtée qu'une cuillère en plastique. {score} points d'erreur... impressionnant de médiocrité. Cul sec.",
    "Mesdames et messieurs, {name} et ses {score} points : la preuve vivante qu'on peut respirer sans réfléchir. Bois tes gorgées.",
    "{name}, avec {score} points d'écart, tu connais ce groupe comme moi je connais le calme. C'est-à-dire pas du tout. Santé !",
    "{name}, {score} points... Même une boule de cristal cassée devinait mieux. Le bar t'attend.",
]


def build_question(mode, players):
    target = random.choice(players)
    template = random.choice(QUESTION_BANK.get(mode, QUESTION_BANK["Chill"]))
    cible2 = None
    if "{name2}" in template:
        others = [p for p in players if p["id"] != target["id"]] or players
        t2 = random.choice(others)
        cible2 = t2["name"]
        text = template.replace("{name}", target["name"]).replace("{name2}", t2["name"])
    else:
        text = template.replace("{name}", target["name"])
    return {"text": text, "targetId": target["id"], "targetName": target["name"], "cible2": cible2}


async def generate_ai_questions(mode, count=6):
    if not EMERGENT_LLM_KEY:
        return []
    tone = {
        "Chill": "léger, fun et bon enfant, pour un apéro entre amis",
        "Spicy": "osé, coquin et un peu gênant, mais sans être vulgaire",
        "Hardcore": "trash, noir et sans filtre, humour très provocateur",
    }.get(mode, "fun")
    try:
        from emergentintegrations.llm.chat import LlmChat, UserMessage
        chat = LlmChat(
            api_key=EMERGENT_LLM_KEY,
            session_id=f"thermo-{mode}-{random.randint(1000,9999)}",
            system_message=(
                "Tu génères des questions pour un jeu d'alcool français appelé 'Le Thermomètre'. "
                "Chaque question commence par 'À quel pourcentage' et concerne un joueur désigné par "
                "le placeholder {name}. Réponds UNIQUEMENT avec un tableau JSON de chaînes, sans texte autour."
            ),
        ).with_model("anthropic", "claude-sonnet-4-6")
        prompt = (
            f"Donne {count} questions originales sur un ton {tone}. "
            "Utilise exactement le placeholder {name} pour le joueur ciblé. "
            'Exemple de format: ["À quel pourcentage {name} ... ?", "..."]'
        )
        resp = await chat.send_message(UserMessage(text=prompt))
        raw = resp.strip()
        start, end = raw.find("["), raw.rfind("]")
        if start != -1 and end != -1:
            raw = raw[start:end + 1]
        questions = json.loads(raw)
        return [q for q in questions if isinstance(q, str) and "{name}" in q]
    except Exception as e:
        logger.warning(f"AI question generation failed: {e}")
        return []
