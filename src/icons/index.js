// src/icons/index.js
const svgLine = (vb, cls, paths) => `<svg viewBox="${vb}" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="${cls}">${paths}</svg>`;

export const icons = {
  logo: (cls = "w-6 h-6") => svgLine("0 0 24 24", cls, `<path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>`),
  help: (cls = "w-5 h-5") => svgLine("0 0 24 24", cls, `<circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3M12 17h.01"/>`),
  exit: (cls = "w-4 h-4") => svgLine("0 0 24 24", cls, `<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/>`),
  hashtag: (cls = "w-4 h-4") => svgLine("0 0 24 24", cls, `<path d="M4 9h16M4 15h16M10 3L8 21M16 3l-2 18"/>`),
  refresh: (cls = "w-5 h-5") => svgLine("0 0 24 24", cls, `<path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8M21 3v5h-5"/>`),
  
  // Modes
  chill: (cls = "w-6 h-6") => svgLine("0 0 24 24", cls, `<path d="M2 12h4l3-9 5 18 3-9h5"/>`),
  spicy: (cls = "w-6 h-6") => svgLine("0 0 24 24", cls, `<path d="M12 2c0 0-5 4-5 10a5 5 0 0 0 10 0c0-6-5-10-5-10Z"/>`),
  hardcore: (cls = "w-6 h-6") => svgLine("0 0 24 24", cls, `<path d="M12 2a5 5 0 0 0-5 5v2H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-9a2 2 0 0 0-2-2h-2V7a5 5 0 0 0-5-5ZM9 7a3 3 0 0 1 6 0v2H9Z"/>`),

  // Les Pouvoirs (Totalement repensés et explicites)
  shield: (cls = "w-6 h-6") => svgLine("0 0 24 24", cls, `<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"/><path d="M12 22V5"/>`), // Bouclier avec axe central
  mirror: (cls = "w-6 h-6") => svgLine("0 0 24 24", cls, `<path d="M9 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14Z"/><path d="M14 22l-3-4"/><path d="M6 10l2-2"/>`), // Miroir à main avec reflet
  double: (cls = "w-6 h-6") => `<svg viewBox="0 0 24 24" class="${cls}" fill="none" stroke="currentColor" stroke-width="1.5"><text x="12" y="16" text-anchor="middle" font-family="Outfit, sans-serif" font-weight="700" font-size="12">x2</text><circle cx="12" cy="12" r="10"/></svg>`, // x2 typographique dans un cercle
  shot: (cls = "w-6 h-6") => svgLine("0 0 24 24", cls, `<path d="M7 5l1 14h8l1-14Z"/><path d="M8 10h8"/><path d="M6 2h12"/>`), // Verre de shot rempli
  thief: (cls = "w-6 h-6") => svgLine("0 0 24 24", cls, `<path d="M2 12c0-3 3-4 6-4s4 2 4 2 1-2 4-2 6 1 6 4-3 5-6 5-4-2-4-2-1 2-4 2-6-2-6-5Z"/><circle cx="7" cy="12" r="1.5"/><circle cx="17" cy="12" r="1.5"/>`), // Masque de braqueur/bandit
  alert: (cls = "w-6 h-6") => svgLine("0 0 24 24", cls, `<path d="M12 3l10 18H2L12 3Z"/><path d="M12 10v4"/><circle cx="12" cy="18" r="1"/>`) // Triangle d'alerte classique
};
