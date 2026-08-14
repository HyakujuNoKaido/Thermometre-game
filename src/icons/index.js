const svgLine = (vb, cls, paths) => `<svg viewBox="${vb}" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="${cls}">${paths}</svg>`;

export const icons = {
  logo: (cls = "w-6 h-6") => svgLine("0 0 24 24", cls, `<path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>`),
  help: (cls = "w-5 h-5") => svgLine("0 0 24 24", cls, `<circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3M12 17h.01"/>`),
  exit: (cls = "w-4 h-4") => svgLine("0 0 24 24", cls, `<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/>`),
  hashtag: (cls = "w-4 h-4") => svgLine("0 0 24 24", cls, `<path d="M4 9h16M4 15h16M10 3L8 21M16 3l-2 18"/>`),
  refresh: (cls = "w-5 h-5") => svgLine("0 0 24 24", cls, `<path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8M21 3v5h-5"/>`),
  check: (cls = "w-6 h-6") => svgLine("0 0 24 24", cls, `<path d="M20 6L9 17l-5-5"/>`),
  
  // Modes
  chill: (cls = "w-6 h-6") => svgLine("0 0 24 24", cls, `<path d="M8 22h8M12 11v11M3 3l9 8 9-8Z"/>`), 
  spicy: (cls = "w-6 h-6") => svgLine("0 0 24 24", cls, `<path d="M12 2c0 0-5 4-5 10a5 5 0 0 0 10 0c0-6-5-10-5-10Z"/><path d="M12 10c0 0-2 1.5-2 3.5a2 2 0 0 0 4 0c0-2-2-3.5-2-3.5Z"/>`), 
  hardcore: (cls = "w-6 h-6") => svgLine("0 0 24 24", cls, `<path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>`), 

  // Pouvoirs Speakeasy
  shield: (cls = "w-6 h-6") => svgLine("0 0 24 24", cls, `<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"/><path d="M12 22V5"/>`),
  mirror: (cls = "w-6 h-6") => svgLine("0 0 24 24", cls, `<path d="M9 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14Z"/><path d="M14 22l-3-4"/><path d="M6 10l2-2"/>`),
  double: (cls = "w-6 h-6") => `<svg viewBox="0 0 24 24" class="${cls}" fill="none" stroke="currentColor" stroke-width="1.5"><text x="12" y="16" text-anchor="middle" font-family="Outfit, sans-serif" font-weight="700" font-size="12">x2</text><circle cx="12" cy="12" r="10"/></svg>`,
  shot: (cls = "w-6 h-6") => svgLine("0 0 24 24", cls, `<path d="M7 5l1 14h8l1-14Z"/><path d="M8 10h8"/><path d="M6 2h12"/>`),
  thief: (cls = "w-6 h-6") => svgLine("0 0 24 24", cls, `<path d="M2 12c0-3 3-4 6-4s4 2 4 2 1-2 4-2 6 1 6 4-3 5-6 5-4-2-4-2-1 2-4 2-6-2-6-5Z"/><circle cx="7" cy="12" r="1.5"/><circle cx="17" cy="12" r="1.5"/>`),
  alert: (cls = "w-6 h-6") => svgLine("0 0 24 24", cls, `<path d="M12 3l10 18H2L12 3Z"/><path d="M12 10v4"/><circle cx="12" cy="18" r="1"/>`),

  // Mécaniques Spéciales
  bloodPact: (cls = "w-4 h-4") => svgLine("0 0 24 24", cls, `<path d="M12 21.5c-3-3-6-6.5-6-10.5a6 6 0 1 1 12 0c0 4-3 7.5-6 10.5Z"/><path d="M12 8a2 2 0 0 1 2 2"/>`), // Goutte pure
  angel: (cls = "w-4 h-4") => svgLine("0 0 24 24", cls, `<path d="M12 6a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z"/><path d="M4 10s3-2 8-2 8 2 8 2-2 10-8 10-8-10-8-10Z"/>`) // Ailes/Halo abstrait
};
