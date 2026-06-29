// Cloudflare Worker — proxy IA sécurisé pour générer des questions (clé API cachée côté serveur).
// Déploiement : Cloudflare Dashboard > Workers > Create > colle ce code.
// Ajoute la variable d'environnement (Settings > Variables) : ANTHROPIC_API_KEY = ta_cle
// Puis dans index.html, mets WORKER_URL = "https://ton-worker.workers.dev".

const TONES = {
  Chill: "léger, fun et bon enfant, pour un apéro entre amis",
  Spicy: "osé, coquin et un peu gênant, mais sans être vulgaire",
  Hardcore: "trash, noir et sans filtre, humour très provocateur",
};

export default {
  async fetch(req, env) {
    const cors = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    };
    if (req.method === "OPTIONS") return new Response(null, { headers: cors });

    const url = new URL(req.url);
    const mode = url.searchParams.get("mode") || "Chill";
    const count = Math.min(10, parseInt(url.searchParams.get("count") || "6"));
    const tone = TONES[mode] || TONES.Chill;

    try {
      const r = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "x-api-key": env.ANTHROPIC_API_KEY,
          "anthropic-version": "2023-06-01",
          "content-type": "application/json",
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-6",
          max_tokens: 700,
          system: "Tu génères des questions pour un jeu d'alcool français 'Le Thermomètre'. Chaque question commence par 'À quel pourcentage' et utilise le placeholder {n} pour le joueur ciblé (et {n2} optionnel pour un 2e). Réponds UNIQUEMENT avec un tableau JSON de chaînes.",
          messages: [{ role: "user", content: `Donne ${count} questions originales sur un ton ${tone}. Utilise exactement {n}. Format: ["À quel pourcentage {n} ... ?"]` }],
        }),
      });
      const data = await r.json();
      let text = (data.content && data.content[0] && data.content[0].text) || "[]";
      const s = text.indexOf("["), e = text.lastIndexOf("]");
      if (s !== -1 && e !== -1) text = text.slice(s, e + 1);
      const questions = JSON.parse(text).filter(q => typeof q === "string" && q.includes("{n}"));
      return new Response(JSON.stringify({ [mode]: questions }), { headers: { ...cors, "content-type": "application/json" } });
    } catch (err) {
      return new Response(JSON.stringify({ error: String(err) }), { status: 500, headers: { ...cors, "content-type": "application/json" } });
    }
  },
};
