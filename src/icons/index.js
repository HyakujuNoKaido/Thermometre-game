// src/icons/index.js
const svgLine = (vb, cls, paths) => `<svg viewBox="${vb}" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="${cls}">${paths}</svg>`;

export const icons = {
  logo: (cls = "w-6 h-6") => svgLine("0 0 24 24", cls, `<path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>`),
  help: (cls = "w-5 h-5") => svgLine("0 0 24 24", cls, `<circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3M12 17h.01"/>`),
  exit: (cls = "w-4 h-4") => svgLine("0 0 24 24", cls, `<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/>`),
  hashtag: (cls = "w-4 h-4") => svgLine("0 0 24 24", cls, `<path d="M4 9h16M4 15h16M10 3L8 21M16 3l-2 18"/>`),
  refresh: (cls = "w-5 h-5") => svgLine("0 0 24 24", cls, `<path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8M21 3v5h-5"/>`),
  check: (cls = "w-6 h-6") => svgLine("0 0 24 24", cls, `<path d="M20 6L9 17l-5-5"/>`),
  
  // Modes
  chill: (cls = "w-6 h-6") => svgLine("0 0 24 24", cls, `<path d="M2 12h4l3-9 5 18 3-9h5"/>`),
  spicy: (cls = "w-6 h-6") => svgLine("0 0 24 24", cls, `<path d="M12 2c0 0-5 4-5 10a5 5 0 0 0 10 0c0-6-5-10-5-10Z"/>`),
  hardcore: (cls = "w-6 h-6") => svgLine("0 0 24 24", cls, `<path d="M12 2a5 5 0 0 0-5 5v2H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-9a2 2 0 0 0-2-2h-2V7a5 5 0 0 0-5-5ZM9 7a3 3 0 0 1 6 0v2H9Z"/>`),

  // Pouvoirs
  shield: (cls = "w-6 h-6") => svgLine("0 0 24 24", cls, `<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"/>`),
  mirror: (cls = "w-6 h-6") => svgLine("0 0 24 24", cls, `<rect width="16" height="20" x="4" y="2" rx="2" ry="2"/><path d="M8 6h8M8 10h8M8 14h8M8 18h8"/>`),
  double: (cls = "w-6 h-6") => svgLine("0 0 24 24", cls, `<path d="M4 6h16M4 12h16M4 18h16"/>`), // Remplacé par une icone abstraite chic
  shot: (cls = "w-6 h-6") => svgLine("0 0 24 24", cls, `<path d="M6 2v14a6 6 0 0 0 12 0V2Z"/><line x1="6" y1="8" x2="18" y2="8"/>`),
  thief: (cls = "w-6 h-6") => svgLine("0 0 24 24", cls, `<path d="M2 12a10 10 0 0 1 20 0M2 12a10 10 0 0 0 20 0M12 2a10 10 0 0 0 0 20M12 2a10 10 0 0 1 0 20"/>`),
  alert: (cls = "w-6 h-6") => svgLine("0 0 24 24", cls, `<path d="M12 2L2 22h20L12 2Z"/><path d="M12 8v4M12 16h.01"/>`)
};
