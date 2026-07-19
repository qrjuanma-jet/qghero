import { generateDynamicChord } from './dynamicChords.js';

/**
 * Base de datos de acordes de guitarra con digitaciones REALES.
 * La IA solo necesita decir QUÉ acorde y CUÁNDO; este fichero sabe CÓMO se toca.
 * 
 * Cada acorde tiene:
 *   fingering: [{string, fret, finger}]  → las 6 cuerdas (finger: 0=aire, -1=mute, 1-4=dedo)
 *   notes: [Tone.js notes]
 *   schema: [8 líneas ASCII]
 */

const CHORDS = {
  // ═══════════════════════════════════════
  // ACORDES ABIERTOS MAYORES
  // ═══════════════════════════════════════
  "C": {
    latin: "Do Mayor", anglo: "C",
    fingering: [
      { string: 1, fret: 0, finger: 0 },
      { string: 2, fret: 1, finger: 1 },
      { string: 3, fret: 0, finger: 0 },
      { string: 4, fret: 2, finger: 2 },
      { string: 5, fret: 3, finger: 3 },
      { string: 6, fret: -1, finger: -1 }
    ],
    notes: ["C3", "E3", "G3", "C4", "E4"],
    schema: [
      "Do Mayor (C) [Abierto]:",
      "TS     Ⅰ    Ⅱ    Ⅲ",
      "E (1) O---|----|----",
      "B (2) 1---|----|----",
      "G (3) O---|----|----",
      "D (4) ----|2---|----",
      "A (5) ----|----|3---",
      "E (6) X---|----|----"
    ]
  },
  "D": {
    latin: "Re Mayor", anglo: "D",
    fingering: [
      { string: 1, fret: 2, finger: 2 },
      { string: 2, fret: 3, finger: 3 },
      { string: 3, fret: 2, finger: 1 },
      { string: 4, fret: 0, finger: 0 },
      { string: 5, fret: -1, finger: -1 },
      { string: 6, fret: -1, finger: -1 }
    ],
    notes: ["D3", "A3", "D4", "F#4"],
    schema: [
      "Re Mayor (D) [Abierto]:",
      "TS     Ⅰ    Ⅱ    Ⅲ",
      "E (1) ----|2---|----",
      "B (2) ----|----|3---",
      "G (3) ----|1---|----",
      "D (4) O---|----|----",
      "A (5) X---|----|----",
      "E (6) X---|----|----"
    ]
  },
  "E": {
    latin: "Mi Mayor", anglo: "E",
    fingering: [
      { string: 1, fret: 0, finger: 0 },
      { string: 2, fret: 0, finger: 0 },
      { string: 3, fret: 1, finger: 1 },
      { string: 4, fret: 2, finger: 3 },
      { string: 5, fret: 2, finger: 2 },
      { string: 6, fret: 0, finger: 0 }
    ],
    notes: ["E2", "B2", "E3", "G#3", "B3", "E4"],
    schema: [
      "Mi Mayor (E) [Abierto]:",
      "TS     Ⅰ    Ⅱ    Ⅲ",
      "E (1) O---|----|----",
      "B (2) O---|----|----",
      "G (3) 1---|----|----",
      "D (4) ----|3---|----",
      "A (5) ----|2---|----",
      "E (6) O---|----|----"
    ]
  },
  "G": {
    latin: "Sol Mayor", anglo: "G",
    fingering: [
      { string: 1, fret: 3, finger: 4 },
      { string: 2, fret: 0, finger: 0 },
      { string: 3, fret: 0, finger: 0 },
      { string: 4, fret: 0, finger: 0 },
      { string: 5, fret: 2, finger: 1 },
      { string: 6, fret: 3, finger: 2 }
    ],
    notes: ["G2", "B2", "D3", "G3", "B3", "G4"],
    schema: [
      "Sol Mayor (G) [Abierto]:",
      "TS     Ⅰ    Ⅱ    Ⅲ",
      "E (1) ----|----|4---",
      "B (2) O---|----|----",
      "G (3) O---|----|----",
      "D (4) O---|----|----",
      "A (5) ----|1---|----",
      "E (6) ----|----|2---"
    ]
  },
  "A": {
    latin: "La Mayor", anglo: "A",
    fingering: [
      { string: 1, fret: 0, finger: 0 },
      { string: 2, fret: 2, finger: 3 },
      { string: 3, fret: 2, finger: 2 },
      { string: 4, fret: 2, finger: 1 },
      { string: 5, fret: 0, finger: 0 },
      { string: 6, fret: -1, finger: -1 }
    ],
    notes: ["A2", "E3", "A3", "C#4", "E4"],
    schema: [
      "La Mayor (A) [Abierto]:",
      "TS     Ⅰ    Ⅱ    Ⅲ",
      "E (1) O---|----|----",
      "B (2) ----|3---|----",
      "G (3) ----|2---|----",
      "D (4) ----|1---|----",
      "A (5) O---|----|----",
      "E (6) X---|----|----"
    ]
  },

  // ═══════════════════════════════════════
  // ACORDES ABIERTOS MENORES
  // ═══════════════════════════════════════
  "Am": {
    latin: "La menor", anglo: "Am",
    fingering: [
      { string: 1, fret: 0, finger: 0 },
      { string: 2, fret: 1, finger: 1 },
      { string: 3, fret: 2, finger: 2 },
      { string: 4, fret: 2, finger: 3 },
      { string: 5, fret: 0, finger: 0 },
      { string: 6, fret: -1, finger: -1 }
    ],
    notes: ["A2", "E3", "A3", "C4", "E4"],
    schema: [
      "La menor (Am) [Abierto]:",
      "TS     Ⅰ    Ⅱ    Ⅲ",
      "E (1) O---|----|----",
      "B (2) 1---|----|----",
      "G (3) ----|2---|----",
      "D (4) ----|3---|----",
      "A (5) O---|----|----",
      "E (6) X---|----|----"
    ]
  },
  "Dm": {
    latin: "Re menor", anglo: "Dm",
    fingering: [
      { string: 1, fret: 1, finger: 1 },
      { string: 2, fret: 3, finger: 3 },
      { string: 3, fret: 2, finger: 2 },
      { string: 4, fret: 0, finger: 0 },
      { string: 5, fret: -1, finger: -1 },
      { string: 6, fret: -1, finger: -1 }
    ],
    notes: ["D3", "A3", "D4", "F4"],
    schema: [
      "Re menor (Dm) [Abierto]:",
      "TS     Ⅰ    Ⅱ    Ⅲ",
      "E (1) 1---|----|----",
      "B (2) ----|----|3---",
      "G (3) ----|2---|----",
      "D (4) O---|----|----",
      "A (5) X---|----|----",
      "E (6) X---|----|----"
    ]
  },
  "Em": {
    latin: "Mi menor", anglo: "Em",
    fingering: [
      { string: 1, fret: 0, finger: 0 },
      { string: 2, fret: 0, finger: 0 },
      { string: 3, fret: 0, finger: 0 },
      { string: 4, fret: 2, finger: 3 },
      { string: 5, fret: 2, finger: 2 },
      { string: 6, fret: 0, finger: 0 }
    ],
    notes: ["E2", "B2", "E3", "G3", "B3", "E4"],
    schema: [
      "Mi menor (Em) [Abierto]:",
      "TS     Ⅰ    Ⅱ    Ⅲ",
      "E (1) O---|----|----",
      "B (2) O---|----|----",
      "G (3) O---|----|----",
      "D (4) ----|3---|----",
      "A (5) ----|2---|----",
      "E (6) O---|----|----"
    ]
  },
  // ═══════════════════════════════════════
  // ACORDES DE SÉPTIMA (7)
  // ═══════════════════════════════════════
  "Dm7": {
    latin: "Re menor séptima", anglo: "Dm7",
    fingering: [
      { string: 1, fret: 1, finger: 1 },
      { string: 2, fret: 1, finger: 1 },
      { string: 3, fret: 2, finger: 2 },
      { string: 4, fret: 0, finger: 0 },
      { string: 5, fret: -1, finger: -1 },
      { string: 6, fret: -1, finger: -1 }
    ],
    notes: ["D3", "A3", "C4", "F4"]
  },
  "G7": {
    latin: "Sol séptima", anglo: "G7",
    fingering: [
      { string: 1, fret: 1, finger: 1 },
      { string: 2, fret: 0, finger: 0 },
      { string: 3, fret: 0, finger: 0 },
      { string: 4, fret: 0, finger: 0 },
      { string: 5, fret: 2, finger: 2 },
      { string: 6, fret: 3, finger: 3 }
    ],
    notes: ["G2", "B2", "D3", "G3", "B3", "F4"]
  },
  "C7": {
    latin: "Do séptima", anglo: "C7",
    fingering: [
      { string: 1, fret: 0, finger: 0 },
      { string: 2, fret: 1, finger: 1 },
      { string: 3, fret: 3, finger: 4 },
      { string: 4, fret: 2, finger: 2 },
      { string: 5, fret: 3, finger: 3 },
      { string: 6, fret: -1, finger: -1 }
    ],
    notes: ["C3", "E3", "Bb3", "C4", "E4"]
  },
  "D7": {
    latin: "Re séptima", anglo: "D7",
    fingering: [
      { string: 1, fret: 2, finger: 3 },
      { string: 2, fret: 1, finger: 1 },
      { string: 3, fret: 2, finger: 2 },
      { string: 4, fret: 0, finger: 0 },
      { string: 5, fret: -1, finger: -1 },
      { string: 6, fret: -1, finger: -1 }
    ],
    notes: ["D3", "A3", "C4", "F#4"]
  },
  "E7": {
    latin: "Mi séptima", anglo: "E7",
    fingering: [
      { string: 1, fret: 0, finger: 0 },
      { string: 2, fret: 0, finger: 0 },
      { string: 3, fret: 1, finger: 1 },
      { string: 4, fret: 0, finger: 0 },
      { string: 5, fret: 2, finger: 2 },
      { string: 6, fret: 0, finger: 0 }
    ],
    notes: ["E2", "B2", "D3", "G#3", "B3", "E4"]
  },
  "A7": {
    latin: "La séptima", anglo: "A7",
    fingering: [
      { string: 1, fret: 0, finger: 0 },
      { string: 2, fret: 2, finger: 3 },
      { string: 3, fret: 0, finger: 0 },
      { string: 4, fret: 2, finger: 2 },
      { string: 5, fret: 0, finger: 0 },
      { string: 6, fret: -1, finger: -1 }
    ],
    notes: ["A2", "E3", "G3", "C#4", "E4"]
  },
  "B7": {
    latin: "Si séptima", anglo: "B7",
    fingering: [
      { string: 1, fret: 2, finger: 4 },
      { string: 2, fret: 0, finger: 0 },
      { string: 3, fret: 2, finger: 3 },
      { string: 4, fret: 1, finger: 1 },
      { string: 5, fret: 2, finger: 2 },
      { string: 6, fret: -1, finger: -1 }
    ],
    notes: ["B2", "D#3", "A3", "B3", "F#4"]
  },
  "Em7": {
    latin: "Mi menor séptima", anglo: "Em7",
    fingering: [
      { string: 1, fret: 0, finger: 0 },
      { string: 2, fret: 0, finger: 0 },
      { string: 3, fret: 0, finger: 0 },
      { string: 4, fret: 0, finger: 0 },
      { string: 5, fret: 2, finger: 2 },
      { string: 6, fret: 0, finger: 0 }
    ],
    notes: ["E2", "B2", "D3", "G3", "B3", "E4"]
  },
  "Am7": {
    latin: "La menor séptima", anglo: "Am7",
    fingering: [
      { string: 1, fret: 0, finger: 0 },
      { string: 2, fret: 1, finger: 1 },
      { string: 3, fret: 0, finger: 0 },
      { string: 4, fret: 2, finger: 2 },
      { string: 5, fret: 0, finger: 0 },
      { string: 6, fret: -1, finger: -1 }
    ],
    notes: ["A2", "E3", "G3", "C4", "E4"]
  },
  "Cmaj7": {
    latin: "Do mayor séptima", anglo: "Cmaj7",
    fingering: [
      { string: 1, fret: 0, finger: 0 },
      { string: 2, fret: 0, finger: 0 },
      { string: 3, fret: 0, finger: 0 },
      { string: 4, fret: 2, finger: 2 },
      { string: 5, fret: 3, finger: 3 },
      { string: 6, fret: -1, finger: -1 }
    ],
    notes: ["C3", "E3", "G3", "B3", "E4"]
  },
  "F": {
    latin: "Fa Mayor", anglo: "F",
    fingering: [
      { string: 1, fret: 1, finger: 1 },
      { string: 2, fret: 1, finger: 1 },
      { string: 3, fret: 2, finger: 2 },
      { string: 4, fret: 3, finger: 4 },
      { string: 5, fret: 3, finger: 3 },
      { string: 6, fret: 1, finger: 1 }
    ],
    notes: ["F2", "C3", "F3", "A3", "C4", "F4"],
    schema: [
      "Fa Mayor (F) [Cejilla I]:",
      "TS     Ⅰ    Ⅱ    Ⅲ",
      "E (1) 1---|----|----",
      "B (2) 1---|----|----",
      "G (3) ----|2---|----",
      "D (4) ----|----|4---",
      "A (5) ----|----|3---",
      "E (6) 1---|----|----"
    ]
  },
  "Fm": {
    latin: "Fa menor", anglo: "Fm",
    fingering: [
      { string: 1, fret: 1, finger: 1 },
      { string: 2, fret: 1, finger: 1 },
      { string: 3, fret: 1, finger: 1 },
      { string: 4, fret: 3, finger: 4 },
      { string: 5, fret: 3, finger: 3 },
      { string: 6, fret: 1, finger: 1 }
    ],
    notes: ["F2", "C3", "F3", "Ab3", "C4", "F4"],
    schema: [
      "Fa menor (Fm) [Cejilla I]:",
      "TS     Ⅰ    Ⅱ    Ⅲ",
      "E (1) 1---|----|----",
      "B (2) 1---|----|----",
      "G (3) 1---|----|----",
      "D (4) ----|----|4---",
      "A (5) ----|----|3---",
      "E (6) 1---|----|----"
    ]
  },
  "Bm": {
    latin: "Si menor", anglo: "Bm",
    fingering: [
      { string: 1, fret: 2, finger: 1 },
      { string: 2, fret: 3, finger: 2 },
      { string: 3, fret: 4, finger: 4 },
      { string: 4, fret: 4, finger: 3 },
      { string: 5, fret: 2, finger: 1 },
      { string: 6, fret: -1, finger: -1 }
    ],
    notes: ["B2", "F#3", "B3", "D4", "F#4"],
    schema: [
      "Si menor (Bm) [Cejilla II]:",
      "TS     Ⅱ    Ⅲ    Ⅳ",
      "E (1) 1---|----|----",
      "B (2) ----|2---|----",
      "G (3) ----|----|4---",
      "D (4) ----|----|3---",
      "A (5) 1---|----|----",
      "E (6) X---|----|----"
    ]
  },
  "B": {
    latin: "Si Mayor", anglo: "B",
    fingering: [
      { string: 1, fret: 2, finger: 1 },
      { string: 2, fret: 4, finger: 4 },
      { string: 3, fret: 4, finger: 3 },
      { string: 4, fret: 4, finger: 2 },
      { string: 5, fret: 2, finger: 1 },
      { string: 6, fret: -1, finger: -1 }
    ],
    notes: ["B2", "F#3", "B3", "D#4", "F#4"],
    schema: [
      "Si Mayor (B) [Cejilla II]:",
      "TS     Ⅱ    Ⅲ    Ⅳ",
      "E (1) 1---|----|----",
      "B (2) ----|----|4---",
      "G (3) ----|----|3---",
      "D (4) ----|----|2---",
      "A (5) 1---|----|----",
      "E (6) X---|----|----"
    ]
  },
  "Bb": {
    latin: "Si bemol Mayor", anglo: "Bb",
    fingering: [
      { string: 1, fret: 1, finger: 1 },
      { string: 2, fret: 3, finger: 4 },
      { string: 3, fret: 3, finger: 3 },
      { string: 4, fret: 3, finger: 2 },
      { string: 5, fret: 1, finger: 1 },
      { string: 6, fret: -1, finger: -1 }
    ],
    notes: ["Bb2", "F3", "Bb3", "D4", "F4"],
    schema: [
      "Si bemol Mayor (Bb) [Cejilla I]:",
      "TS     Ⅰ    Ⅱ    Ⅲ",
      "E (1) 1---|----|----",
      "B (2) ----|----|4---",
      "G (3) ----|----|3---",
      "D (4) ----|----|2---",
      "A (5) 1---|----|----",
      "E (6) X---|----|----"
    ]
  },
  "F#m": {
    latin: "Fa# menor", anglo: "F#m",
    fingering: [
      { string: 1, fret: 2, finger: 1 },
      { string: 2, fret: 2, finger: 1 },
      { string: 3, fret: 2, finger: 1 },
      { string: 4, fret: 4, finger: 4 },
      { string: 5, fret: 4, finger: 3 },
      { string: 6, fret: 2, finger: 1 }
    ],
    notes: ["F#2", "C#3", "F#3", "A3", "C#4", "F#4"],
    schema: [
      "Fa# menor (F#m) [Cejilla II]:",
      "TS     Ⅱ    Ⅲ    Ⅳ",
      "E (1) 1---|----|----",
      "B (2) 1---|----|----",
      "G (3) 1---|----|----",
      "D (4) ----|----|4---",
      "A (5) ----|----|3---",
      "E (6) 1---|----|----"
    ]
  },
  "C#m": {
    latin: "Do# menor", anglo: "C#m",
    fingering: [
      { string: 1, fret: 4, finger: 1 },
      { string: 2, fret: 5, finger: 2 },
      { string: 3, fret: 6, finger: 4 },
      { string: 4, fret: 6, finger: 3 },
      { string: 5, fret: 4, finger: 1 },
      { string: 6, fret: -1, finger: -1 }
    ],
    notes: ["C#3", "G#3", "C#4", "E4", "G#4"],
    schema: [
      "Do# menor (C#m) [Cejilla IV]:",
      "TS     Ⅳ    Ⅴ    Ⅵ",
      "E (1) 1---|----|----",
      "B (2) ----|2---|----",
      "G (3) ----|----|4---",
      "D (4) ----|----|3---",
      "A (5) 1---|----|----",
      "E (6) X---|----|----"
    ]
  },
  "G#m": {
    latin: "Sol# menor", anglo: "G#m",
    fingering: [
      { string: 1, fret: 4, finger: 1 },
      { string: 2, fret: 4, finger: 1 },
      { string: 3, fret: 4, finger: 1 },
      { string: 4, fret: 6, finger: 4 },
      { string: 5, fret: 6, finger: 3 },
      { string: 6, fret: 4, finger: 1 }
    ],
    notes: ["G#2", "D#3", "G#3", "B3", "D#4", "G#4"],
    schema: [
      "Sol# menor (G#m) [Cejilla IV]:",
      "TS     Ⅳ    Ⅴ    Ⅵ",
      "E (1) 1---|----|----",
      "B (2) 1---|----|----",
      "G (3) 1---|----|----",
      "D (4) ----|----|4---",
      "A (5) ----|----|3---",
      "E (6) 1---|----|----"
    ]
  },
  "Cm": {
    latin: "Do menor", anglo: "Cm",
    fingering: [
      { string: 1, fret: 3, finger: 1 },
      { string: 2, fret: 4, finger: 2 },
      { string: 3, fret: 5, finger: 4 },
      { string: 4, fret: 5, finger: 3 },
      { string: 5, fret: 3, finger: 1 },
      { string: 6, fret: -1, finger: -1 }
    ],
    notes: ["C3", "G3", "C4", "Eb4", "G4"],
    schema: [
      "Do menor (Cm) [Cejilla III]:",
      "TS     Ⅲ    Ⅳ    Ⅴ",
      "E (1) 1---|----|----",
      "B (2) ----|2---|----",
      "G (3) ----|----|4---",
      "D (4) ----|----|3---",
      "A (5) 1---|----|----",
      "E (6) X---|----|----"
    ]
  },
  "Gm": {
    latin: "Sol menor", anglo: "Gm",
    fingering: [
      { string: 1, fret: 3, finger: 1 },
      { string: 2, fret: 3, finger: 1 },
      { string: 3, fret: 3, finger: 1 },
      { string: 4, fret: 5, finger: 4 },
      { string: 5, fret: 5, finger: 3 },
      { string: 6, fret: 3, finger: 1 }
    ],
    notes: ["G2", "D3", "G3", "Bb3", "D4", "G4"],
    schema: [
      "Sol menor (Gm) [Cejilla III]:",
      "TS     Ⅲ    Ⅳ    Ⅴ",
      "E (1) 1---|----|----",
      "B (2) 1---|----|----",
      "G (3) 1---|----|----",
      "D (4) ----|----|4---",
      "A (5) ----|----|3---",
      "E (6) 1---|----|----"
    ]
  },

  // ═══════════════════════════════════════
  // SÉPTIMAS
  // ═══════════════════════════════════════
  "A7": {
    latin: "La 7a", anglo: "A7",
    fingering: [
      { string: 1, fret: 0, finger: 0 },
      { string: 2, fret: 2, finger: 2 },
      { string: 3, fret: 0, finger: 0 },
      { string: 4, fret: 2, finger: 1 },
      { string: 5, fret: 0, finger: 0 },
      { string: 6, fret: -1, finger: -1 }
    ],
    notes: ["A2", "E3", "G3", "C#4", "E4"],
    schema: [
      "La 7a (A7) [Abierto]:",
      "TS     Ⅰ    Ⅱ    Ⅲ",
      "E (1) O---|----|----",
      "B (2) ----|2---|----",
      "G (3) O---|----|----",
      "D (4) ----|1---|----",
      "A (5) O---|----|----",
      "E (6) X---|----|----"
    ]
  },
  "B7": {
    latin: "Si 7a", anglo: "B7",
    fingering: [
      { string: 1, fret: 2, finger: 4 },
      { string: 2, fret: 0, finger: 0 },
      { string: 3, fret: 2, finger: 3 },
      { string: 4, fret: 1, finger: 1 },
      { string: 5, fret: 2, finger: 2 },
      { string: 6, fret: -1, finger: -1 }
    ],
    notes: ["B2", "F#3", "B3", "D#4", "A4"],
    schema: [
      "Si 7a (B7) [Abierto]:",
      "TS     Ⅰ    Ⅱ    Ⅲ",
      "E (1) ----|4---|----",
      "B (2) O---|----|----",
      "G (3) ----|3---|----",
      "D (4) 1---|----|----",
      "A (5) ----|2---|----",
      "E (6) X---|----|----"
    ]
  },
  "D7": {
    latin: "Re 7a", anglo: "D7",
    fingering: [
      { string: 1, fret: 2, finger: 3 },
      { string: 2, fret: 1, finger: 1 },
      { string: 3, fret: 2, finger: 2 },
      { string: 4, fret: 0, finger: 0 },
      { string: 5, fret: -1, finger: -1 },
      { string: 6, fret: -1, finger: -1 }
    ],
    notes: ["D3", "A3", "C4", "F#4"],
    schema: [
      "Re 7a (D7) [Abierto]:",
      "TS     Ⅰ    Ⅱ    Ⅲ",
      "E (1) ----|3---|----",
      "B (2) 1---|----|----",
      "G (3) ----|2---|----",
      "D (4) O---|----|----",
      "A (5) X---|----|----",
      "E (6) X---|----|----"
    ]
  },
  "E7": {
    latin: "Mi 7a", anglo: "E7",
    fingering: [
      { string: 1, fret: 0, finger: 0 },
      { string: 2, fret: 0, finger: 0 },
      { string: 3, fret: 1, finger: 1 },
      { string: 4, fret: 0, finger: 0 },
      { string: 5, fret: 2, finger: 2 },
      { string: 6, fret: 0, finger: 0 }
    ],
    notes: ["E2", "B2", "D3", "G#3", "B3", "E4"],
    schema: [
      "Mi 7a (E7) [Abierto]:",
      "TS     Ⅰ    Ⅱ    Ⅲ",
      "E (1) O---|----|----",
      "B (2) O---|----|----",
      "G (3) 1---|----|----",
      "D (4) O---|----|----",
      "A (5) ----|2---|----",
      "E (6) O---|----|----"
    ]
  },
  "G7": {
    latin: "Sol 7a", anglo: "G7",
    fingering: [
      { string: 1, fret: 1, finger: 1 },
      { string: 2, fret: 0, finger: 0 },
      { string: 3, fret: 0, finger: 0 },
      { string: 4, fret: 0, finger: 0 },
      { string: 5, fret: 2, finger: 2 },
      { string: 6, fret: 3, finger: 3 }
    ],
    notes: ["G2", "B2", "D3", "G3", "B3", "F4"],
    schema: [
      "Sol 7a (G7) [Abierto]:",
      "TS     Ⅰ    Ⅱ    Ⅲ",
      "E (1) 1---|----|----",
      "B (2) O---|----|----",
      "G (3) O---|----|----",
      "D (4) O---|----|----",
      "A (5) ----|2---|----",
      "E (6) ----|----|3---"
    ]
  },

  // ═══════════════════════════════════════
  // POWER CHORDS
  // ═══════════════════════════════════════
  "E5": {
    latin: "Mi 5a", anglo: "E5",
    fingering: [
      { string: 1, fret: -1, finger: -1 },
      { string: 2, fret: -1, finger: -1 },
      { string: 3, fret: -1, finger: -1 },
      { string: 4, fret: -1, finger: -1 },
      { string: 5, fret: 2, finger: 1 },
      { string: 6, fret: 0, finger: 0 }
    ],
    notes: ["E2", "B2"],
    schema: [
      "Mi 5a (E5) [Power Chord]:",
      "TS     Ⅰ    Ⅱ    Ⅲ",
      "E (1) X---|----|----",
      "B (2) X---|----|----",
      "G (3) X---|----|----",
      "D (4) X---|----|----",
      "A (5) ----|1---|----",
      "E (6) O---|----|----"
    ]
  },
  "A5": {
    latin: "La 5a", anglo: "A5",
    fingering: [
      { string: 1, fret: -1, finger: -1 },
      { string: 2, fret: -1, finger: -1 },
      { string: 3, fret: -1, finger: -1 },
      { string: 4, fret: 2, finger: 3 },
      { string: 5, fret: 0, finger: 0 },
      { string: 6, fret: -1, finger: -1 }
    ],
    notes: ["A2", "E3"],
    schema: [
      "La 5a (A5) [Power Chord]:",
      "TS     Ⅰ    Ⅱ    Ⅲ",
      "E (1) X---|----|----",
      "B (2) X---|----|----",
      "G (3) X---|----|----",
      "D (4) ----|3---|----",
      "A (5) O---|----|----",
      "E (6) X---|----|----"
    ]
  },
  "F5": {
    latin: "Fa 5a", anglo: "F5",
    fingering: [
      { string: 1, fret: -1, finger: -1 },
      { string: 2, fret: -1, finger: -1 },
      { string: 3, fret: -1, finger: -1 },
      { string: 4, fret: 3, finger: 3 },
      { string: 5, fret: 3, finger: 3 },
      { string: 6, fret: 1, finger: 1 }
    ],
    notes: ["F2", "C3", "F3"],
    schema: [
      "Fa 5a (F5) [Power Chord I]:",
      "TS     Ⅰ    Ⅱ    Ⅲ",
      "E (1) X---|----|----",
      "B (2) X---|----|----",
      "G (3) X---|----|----",
      "D (4) ----|----|3---",
      "A (5) ----|----|3---",
      "E (6) 1---|----|----"
    ]
  },
  "Bb5": {
    latin: "Si bemol 5a", anglo: "Bb5",
    fingering: [
      { string: 1, fret: -1, finger: -1 },
      { string: 2, fret: -1, finger: -1 },
      { string: 3, fret: -1, finger: -1 },
      { string: 4, fret: 8, finger: 3 },
      { string: 5, fret: 6, finger: 1 },
      { string: 6, fret: -1, finger: -1 }
    ],
    notes: ["Bb2", "F3"],
    schema: [
      "Si bemol 5a (Bb5) [Power Chord VI]:",
      "TS     Ⅵ    Ⅶ    Ⅷ",
      "E (1) X---|----|----",
      "B (2) X---|----|----",
      "G (3) X---|----|----",
      "D (4) ----|----|3---",
      "A (5) 1---|----|----",
      "E (6) X---|----|----"
    ]
  },

  // ═══════════════════════════════════════
  // MENORES 7a
  // ═══════════════════════════════════════
  "Am7": {
    latin: "La menor 7a", anglo: "Am7",
    fingering: [
      { string: 1, fret: 0, finger: 0 },
      { string: 2, fret: 1, finger: 1 },
      { string: 3, fret: 0, finger: 0 },
      { string: 4, fret: 2, finger: 2 },
      { string: 5, fret: 0, finger: 0 },
      { string: 6, fret: -1, finger: -1 }
    ],
    notes: ["A2", "E3", "G3", "C4", "E4"],
    schema: [
      "La menor 7a (Am7) [Abierto]:",
      "TS     Ⅰ    Ⅱ    Ⅲ",
      "E (1) O---|----|----",
      "B (2) 1---|----|----",
      "G (3) O---|----|----",
      "D (4) ----|2---|----",
      "A (5) O---|----|----",
      "E (6) X---|----|----"
    ]
  },
  "Em7": {
    latin: "Mi menor 7a", anglo: "Em7",
    fingering: [
      { string: 1, fret: 0, finger: 0 },
      { string: 2, fret: 0, finger: 0 },
      { string: 3, fret: 0, finger: 0 },
      { string: 4, fret: 0, finger: 0 },
      { string: 5, fret: 2, finger: 2 },
      { string: 6, fret: 0, finger: 0 }
    ],
    notes: ["E2", "B2", "D3", "G3", "B3", "E4"],
    schema: [
      "Mi menor 7a (Em7) [Abierto]:",
      "TS     Ⅰ    Ⅱ    Ⅲ",
      "E (1) O---|----|----",
      "B (2) O---|----|----",
      "G (3) O---|----|----",
      "D (4) O---|----|----",
      "A (5) ----|2---|----",
      "E (6) O---|----|----"
    ]
  },

  // ═══════════════════════════════════════
  // SUSPENDIDOS
  // ═══════════════════════════════════════
  "Dsus2": {
    latin: "Re sus2", anglo: "Dsus2",
    fingering: [
      { string: 1, fret: 0, finger: 0 },
      { string: 2, fret: 3, finger: 3 },
      { string: 3, fret: 2, finger: 2 },
      { string: 4, fret: 0, finger: 0 },
      { string: 5, fret: -1, finger: -1 },
      { string: 6, fret: -1, finger: -1 }
    ],
    notes: ["D3", "A3", "D4", "E4"],
    schema: [
      "Re sus2 (Dsus2) [Abierto]:",
      "TS     Ⅰ    Ⅱ    Ⅲ",
      "E (1) O---|----|----",
      "B (2) ----|----|3---",
      "G (3) ----|2---|----",
      "D (4) O---|----|----",
      "A (5) X---|----|----",
      "E (6) X---|----|----"
    ]
  },
  "Dsus4": {
    latin: "Re sus4", anglo: "Dsus4",
    fingering: [
      { string: 1, fret: 3, finger: 4 },
      { string: 2, fret: 3, finger: 3 },
      { string: 3, fret: 2, finger: 2 },
      { string: 4, fret: 0, finger: 0 },
      { string: 5, fret: -1, finger: -1 },
      { string: 6, fret: -1, finger: -1 }
    ],
    notes: ["D3", "A3", "D4", "G4"],
    schema: [
      "Re sus4 (Dsus4) [Abierto]:",
      "TS     Ⅰ    Ⅱ    Ⅲ",
      "E (1) ----|----|4---",
      "B (2) ----|----|3---",
      "G (3) ----|2---|----",
      "D (4) O---|----|----",
      "A (5) X---|----|----",
      "E (6) X---|----|----"
    ]
  },
  "Asus2": {
    latin: "La sus2", anglo: "Asus2",
    fingering: [
      { string: 1, fret: 0, finger: 0 },
      { string: 2, fret: 0, finger: 0 },
      { string: 3, fret: 2, finger: 2 },
      { string: 4, fret: 2, finger: 1 },
      { string: 5, fret: 0, finger: 0 },
      { string: 6, fret: -1, finger: -1 }
    ],
    notes: ["A2", "E3", "A3", "B3", "E4"],
    schema: [
      "La sus2 (Asus2) [Abierto]:",
      "TS     Ⅰ    Ⅱ    Ⅲ",
      "E (1) O---|----|----",
      "B (2) O---|----|----",
      "G (3) ----|2---|----",
      "D (4) ----|1---|----",
      "A (5) O---|----|----",
      "E (6) X---|----|----"
    ]
  },
  "Asus4": {
    latin: "La sus4", anglo: "Asus4",
    fingering: [
      { string: 1, fret: 0, finger: 0 },
      { string: 2, fret: 3, finger: 4 },
      { string: 3, fret: 2, finger: 2 },
      { string: 4, fret: 2, finger: 1 },
      { string: 5, fret: 0, finger: 0 },
      { string: 6, fret: -1, finger: -1 }
    ],
    notes: ["A2", "E3", "A3", "D4", "E4"],
    schema: [
      "La sus4 (Asus4) [Abierto]:",
      "TS     Ⅰ    Ⅱ    Ⅲ",
      "E (1) O---|----|----",
      "B (2) ----|----|4---",
      "G (3) ----|2---|----",
      "D (4) ----|1---|----",
      "A (5) O---|----|----",
      "E (6) X---|----|----"
    ]
  }
};

// ══════════════════════════════════════════════════════════════
// ALIAS MAPPING
// ══════════════════════════════════════════════════════════════
const ALIASES = {
  "A#": "Bb", "D#": "Eb",
  "Amin": "Am", "Emin": "Em", "Dmin": "Dm", "Bmin": "Bm",
  "Fmin": "Fm", "Cmin": "Cm", "Gmin": "Gm",
  "F#min": "F#m", "C#min": "C#m", "G#min": "G#m",
  "Amaj": "A", "Cmaj": "C", "Dmaj": "D", "Emaj": "E", "Fmaj": "F", "Gmaj": "G",
  "AM": "A", "CM": "C", "DM": "D", "EM": "E", "FM": "F", "GM": "G",
  "am": "Am", "em": "Em", "dm": "Dm", "bm": "Bm",
  "fm": "Fm", "cm": "Cm", "gm": "Gm",
  "Bbm": "Bb",
  "dm7": "Dm7", "D-7": "Dm7",
  "G7": "G7", "g7": "G7",
  "C7": "C7", "c7": "C7",
  "D7": "D7", "d7": "D7",
  "E7": "E7", "e7": "E7",
  "A7": "A7", "a7": "A7",
  "B7": "B7", "b7": "B7",
  "Em7": "Em7", "e-7": "Em7",
  "Am7": "Am7", "a-7": "Am7",
  "Cmaj7": "Cmaj7", "CM7": "Cmaj7"
};

/**
 * Busca un acorde en la base de datos.
 */
export function lookupChord(chordName, baseFret = 0) {
  if (!chordName) return null;
  let clean = chordName.trim();
  
  // Extraer la parte anglo si viene en formato "Latina (Anglo)" ej "Do Mayor (C)"
  const angloMatch = clean.match(/\(([A-G][#b]?[a-z0-9]*)\)/i);
  if (angloMatch) {
    clean = angloMatch[1]; 
  }

  // 1. Intento dinámico si baseFret > 0
  if (baseFret > 0) {
    const dynamic = generateDynamicChord(clean, baseFret);
    if (dynamic) return dynamic;
  }

  // 2. Exact match en la DB
  if (CHORDS[clean]) return { ...CHORDS[clean] };
  
  // 3. Alias
  if (ALIASES[clean] && CHORDS[ALIASES[clean]]) return { ...CHORDS[ALIASES[clean]] };
  
  // 4. Intentar traducir de Latino a Anglo por si la IA no trajo anglo
  const LATIN_MAP = { "Do": "C", "Re": "D", "Mi": "E", "Fa": "F", "Sol": "G", "La": "A", "Si": "B" };
  let angloAttempt = clean;
  for (const [lat, ang] of Object.entries(LATIN_MAP)) {
    if (angloAttempt.startsWith(lat)) {
      angloAttempt = angloAttempt.replace(lat, ang);
      break;
    }
  }
  // Limpiar sufijos
  angloAttempt = angloAttempt.replace(/ mayor/i, "")
                 .replace(/ menor/i, "m")
                 .replace(/ disminuido/i, "dim")
                 .replace(/ aumentada/i, "aug")
                 .replace(/\s+/g, ""); // "C m 7" -> "Cm7"

  if (CHORDS[angloAttempt]) return { ...CHORDS[angloAttempt] };
  if (ALIASES[angloAttempt] && CHORDS[ALIASES[angloAttempt]]) return { ...CHORDS[ALIASES[angloAttempt]] };

  // 5. Fallback a generación dinámica
  let dynamicFallback = generateDynamicChord(angloAttempt, 0);
  if (dynamicFallback) {
    // Si se generó a partir del intento anglo, aseguramos que devuelva el nombre original
    dynamicFallback.latin = clean;
    return dynamicFallback;
  }

  dynamicFallback = generateDynamicChord(clean, 0);
  if (dynamicFallback) return dynamicFallback;

  // 6. Último recurso (cortar por espacio)
  const firstPart = clean.split(/[\s\/]/)[0];
  if (CHORDS[firstPart]) return { ...CHORDS[firstPart] };
  if (ALIASES[firstPart] && CHORDS[ALIASES[firstPart]]) return { ...CHORDS[ALIASES[firstPart]] };
  
  const dynamicFirstPart = generateDynamicChord(firstPart, 0);
  if (dynamicFirstPart) return dynamicFirstPart;

  return null;
}

/**
 * Enriquece notas de la IA con fingerings correctos del diccionario.
 */
export function enrichNotesWithChordDb(notes) {
  if (!notes || !Array.isArray(notes)) return notes;
  
  return notes.map(note => {
    // Si es un punteo (single_note) no aplicamos acordes
    if (note.single_note) return note;

    const chordKey = note.anglo || note.latin;
    const baseFret = note.base_fret || 0;
    const chord = lookupChord(chordKey, baseFret);
    
    if (chord) {
      return {
        ...note,
        fingering: chord.fingering,
        latin: chord.latin,
        anglo: chord.anglo
      };
    }
    return note;
  });
}

/**
 * Enriquece toda la cancion: notas + technique.schema.
 */
export function enrichSongData(songData) {
  if (!songData) return songData;
  
  // Enriquecer notas
  if (songData.notes) {
    songData.notes = enrichNotesWithChordDb(songData.notes);
  }
  
  // Reconstruir technique.schema
  if (songData.notes && songData.notes.length > 0) {
    const seenChords = new Set();
    const newSchemas = [];
    
    for (const note of songData.notes) {
      if (note.single_note) continue; // Saltamos punteos

      const key = note.anglo || note.latin;
      const baseFret = note.base_fret || 0;
      const chord = lookupChord(key, baseFret);
      if (!chord) continue;
      
      const uniqueId = chord.anglo + "_" + baseFret;

      if (!seenChords.has(uniqueId)) {
        seenChords.add(uniqueId);
        newSchemas.push(...chord.schema);
        newSchemas.push("");
      }
    }
    
    if (newSchemas.length > 0) {
      if (!songData.technique) songData.technique = {};
      songData.technique.schema = newSchemas;
    }
  }
  
  return songData;
}
