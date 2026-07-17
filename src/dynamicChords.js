const ROMAN_NUMERALS = ["", "Ⅰ", "Ⅱ", "Ⅲ", "Ⅳ", "Ⅴ", "Ⅵ", "Ⅶ", "Ⅷ", "Ⅸ", "Ⅹ", "Ⅺ", "Ⅻ", "XIII", "XIV", "XV", "XVI", "XVII", "XVIII", "XIX", "XX", "XXI", "XXII", "XXIII", "XXIV"];

// Strings 6 and 5 notes
const string6Notes = ["E", "F", "F#", "G", "G#", "A", "A#", "B", "C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B", "C", "C#", "D", "D#", "E"];
const string5Notes = ["A", "A#", "B", "C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B", "C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A"];

// Parse a chord name like "C#m7" into Root="C#" and Quality="m7"
export function parseChordParts(chordName) {
  let root = chordName;
  let quality = "";
  if (chordName.length > 1 && (chordName[1] === '#' || chordName[1] === 'b')) {
    root = chordName.substring(0, 2);
    quality = chordName.substring(2);
  } else {
    root = chordName.substring(0, 1);
    quality = chordName.substring(1);
  }
  return { root, quality };
}

// Map common qualities to standard shape templates
// E-Shape (6th string root), A-Shape (5th string root)
// Format of fingering: [E, A, D, G, B, e] where numbers are fret offsets from barre, or -1 for muted
const SHAPE_TEMPLATES = {
  // Mayor
  "": {
    "E-Shape": { offsets: [0, 2, 2, 1, 0, 0], fingers: [1, 3, 4, 2, 1, 1], type: "Mayor", latinSuffix: "Mayor" },
    "A-Shape": { offsets: [-1, 0, 2, 2, 2, 0], fingers: [-1, 1, 2, 3, 4, 1], type: "Mayor", latinSuffix: "Mayor" }
  },
  // Menor
  "m": {
    "E-Shape": { offsets: [0, 2, 2, 0, 0, 0], fingers: [1, 3, 4, 1, 1, 1], type: "Menor", latinSuffix: "menor" },
    "A-Shape": { offsets: [-1, 0, 2, 2, 1, 0], fingers: [-1, 1, 3, 4, 2, 1], type: "Menor", latinSuffix: "menor" }
  },
  // Power Chord (Quinta)
  "5": {
    "E-Shape": { offsets: [0, 2, 2, -1, -1, -1], fingers: [1, 3, 4, -1, -1, -1], type: "Quinta", latinSuffix: "5a" },
    "A-Shape": { offsets: [-1, 0, 2, 2, -1, -1], fingers: [-1, 1, 3, 4, -1, -1], type: "Quinta", latinSuffix: "5a" }
  },
  // Séptima Dominante
  "7": {
    "E-Shape": { offsets: [0, 2, 0, 1, 0, 0], fingers: [1, 3, 1, 2, 1, 1], type: "Séptima", latinSuffix: "7a" },
    "A-Shape": { offsets: [-1, 0, 2, 0, 2, 0], fingers: [-1, 1, 3, 1, 4, 1], type: "Séptima", latinSuffix: "7a" }
  },
  // Menor Séptima
  "m7": {
    "E-Shape": { offsets: [0, 2, 0, 0, 0, 0], fingers: [1, 3, 1, 1, 1, 1], type: "Menor 7", latinSuffix: "m7" },
    "A-Shape": { offsets: [-1, 0, 2, 0, 1, 0], fingers: [-1, 1, 3, 1, 2, 1], type: "Menor 7", latinSuffix: "m7" }
  },
  // Mayor Séptima
  "maj7": {
    "E-Shape": { offsets: [0, -1, 1, 1, 0, -1], fingers: [1, -1, 3, 4, 2, -1], type: "Mayor 7", latinSuffix: "maj7" },
    "A-Shape": { offsets: [-1, 0, 2, 1, 2, -1], fingers: [-1, 1, 3, 2, 4, -1], type: "Mayor 7", latinSuffix: "maj7" }
  },
  // Semidisminuido (m7b5)
  "m7b5": {
    "E-Shape": { offsets: [0, -1, 0, 0, -1, -1], fingers: [2, -1, 3, 4, 1, -1], type: "Semidisminuido", latinSuffix: "m7b5" },
    "A-Shape": { offsets: [-1, 0, 1, 0, 1, -1], fingers: [-1, 1, 3, 2, 4, -1], type: "Semidisminuido", latinSuffix: "m7b5" }
  },
  // Disminuido (dim7)
  "dim": {
    "E-Shape": { offsets: [0, -1, -1, 0, -1, -1], fingers: [2, -1, 1, 3, 1, -1], type: "Disminuido", latinSuffix: "dim" },
    "A-Shape": { offsets: [-1, 0, 1, -1, 1, -1], fingers: [-1, 2, 3, 1, 4, -1], type: "Disminuido", latinSuffix: "dim" }
  },
  // Aumentado (aug)
  "aug": {
    "E-Shape": { offsets: [0, -1, 2, 1, 1, -1], fingers: [1, -1, 4, 2, 3, -1], type: "Aumentado", latinSuffix: "aug" },
    "A-Shape": { offsets: [-1, 0, -1, -2, -2, -1], fingers: [-1, 3, 2, 1, 1, -1], type: "Aumentado", latinSuffix: "aug" }
  },
  // Novena (9)
  "9": {
    "E-Shape": { offsets: [0, -1, 0, 1, 0, 2], fingers: [1, -1, 1, 2, 1, 4], type: "Novena", latinSuffix: "9" },
    "A-Shape": { offsets: [-1, 0, -1, 0, 0, -1], fingers: [-1, 2, 1, 3, 4, -1], type: "Novena", latinSuffix: "9" }
  },
  // Mayor Novena (maj9)
  "maj9": {
    "E-Shape": { offsets: [0, -1, 1, 1, 0, -1], fingers: [1, -1, 3, 4, 2, -1], type: "Mayor 9", latinSuffix: "maj9" }, // Degrada a maj7 por facilidad
    "A-Shape": { offsets: [-1, 0, -1, 1, 0, -1], fingers: [-1, 2, 1, 4, 3, -1], type: "Mayor 9", latinSuffix: "maj9" }
  },
  // Menor Novena (m9)
  "m9": {
    "E-Shape": { offsets: [0, -1, 0, 0, 0, -1], fingers: [1, -1, 1, 1, 1, -1], type: "Menor 9", latinSuffix: "m9" }, // Degrada a m7 en 6a cuerda
    "A-Shape": { offsets: [-1, 0, -2, 0, 0, -1], fingers: [-1, 2, 1, 3, 4, -1], type: "Menor 9", latinSuffix: "m9" }
  }
};

function generateAsciiSchema(anglo, latin, baseFret, fingering) {
  let schema = [];
  schema.push(`${latin} (${anglo}) [Cejilla ${ROMAN_NUMERALS[baseFret]}]:`);
  
  let r1 = ROMAN_NUMERALS[baseFret];
  let r2 = ROMAN_NUMERALS[baseFret+1];
  let r3 = ROMAN_NUMERALS[baseFret+2];
  
  // Pad roman numerals to roughly center in a 5 char block
  // 'TS     Ⅰ    Ⅱ    Ⅲ'
  const padRoman = (r) => {
    if (!r) return "    ";
    let len = r.length;
    if (len === 1) return r + "    ";
    if (len === 2) return r + "   ";
    if (len === 3) return r + "  ";
    if (len === 4) return r + " ";
    return r;
  };

  schema.push(`TS     ${padRoman(r1)}${padRoman(r2)}${padRoman(r3)}`);

  const strings = [
    { name: "E (1)", idx: 0 },
    { name: "B (2)", idx: 1 },
    { name: "G (3)", idx: 2 },
    { name: "D (4)", idx: 3 },
    { name: "A (5)", idx: 4 },
    { name: "E (6)", idx: 5 }
  ];

  for (let s of strings) {
    let fNote = fingering[s.idx];
    let cells = ["----", "----", "----"];
    
    if (fNote.fret === -1) {
      cells[0] = "X---";
    } else if (fNote.fret === 0) {
      cells[0] = "O---";
    } else {
      let relativeFret = fNote.fret - baseFret; // 0, 1, 2
      if (relativeFret >= 0 && relativeFret < 3) {
        cells[relativeFret] = fNote.finger + "---";
      }
    }
    schema.push(`${s.name} ${cells[0]}|${cells[1]}|${cells[2]}`);
  }

  return schema;
}

import { generateAlgorithmicChord } from './algorithmicChords.js';

export function generateDynamicChord(chordName, baseFret = 0) {
  const { root, quality } = parseChordParts(chordName);

  // 1. Intento de Generación Algorítmica Geométrica Pura
  const algorithmic = generateAlgorithmicChord(chordName, root, quality, baseFret);
  
  // Degradación inteligente de cualidades complejas no mapeadas
  let effectiveQuality = quality;
  if (!SHAPE_TEMPLATES[effectiveQuality]) {
    if (quality.includes("m11") || quality.includes("m13")) effectiveQuality = "m7";
    else if (quality.includes("maj11") || quality.includes("maj13")) effectiveQuality = "maj7";
    else if (quality.includes("11") || quality.includes("13")) effectiveQuality = "7";
    else if (quality.includes("sus") || quality.includes("add") || quality.includes("6")) effectiveQuality = quality.startsWith("m") ? "m" : "";
  }

  // Check if we support this quality
  const template = SHAPE_TEMPLATES[effectiveQuality];
  if (!template) {
    if (algorithmic) return buildFinalDynamicObject(chordName, root, algorithmic.fingering, algorithmic.baseFret, quality);
    return null;
  }

  let shapeName = "";
  let shapeObj = null;

  // Evaluamos disponibilidad de formas
  let hasE = !!template["E-Shape"];
  let hasA = !!template["A-Shape"];

  // Si no nos dan baseFret, buscamos el traste óptimo considerando las formas disponibles
  if (baseFret <= 0) {
    let fret6 = hasE ? string6Notes.indexOf(root) : -1;
    let fret5 = hasA ? string5Notes.indexOf(root) : -1;
    
    if (fret6 > 0 && fret5 > 0) {
      baseFret = Math.min(fret6, fret5);
    } else if (fret6 > 0) {
      baseFret = fret6;
    } else if (fret5 > 0) {
      baseFret = fret5;
    } else {
      return null;
    }
  }

  if (baseFret > 12) {
    const lowerFret = baseFret - 12;
    if (lowerFret > 0) baseFret = lowerFret;
  }
  
  if (baseFret > 14) return null;

  // Seleccionamos la forma según la cuerda donde cae la raíz
  if (string6Notes[baseFret] === root && hasE) {
    shapeName = "E-Shape";
    shapeObj = template["E-Shape"];
  } else if (string5Notes[baseFret] === root && hasA) {
    shapeName = "A-Shape";
    shapeObj = template["A-Shape"];
  } else {
    // Si la raíz no coincide o no hay forma disponible
    if (algorithmic) return buildFinalDynamicObject(chordName, root, algorithmic.fingering, algorithmic.baseFret, quality);
    return null;
  }

  // Si tenemos plantilla, construimos el fingering array
  let fingering = [];
  let offsets = shapeObj.offsets;
  let fingers = shapeObj.fingers;

  for (let i = 0; i < 6; i++) {
    let sIdx = 5 - i; // 5 -> 6th string, 0 -> 1st string
    let offset = offsets[sIdx];
    let finger = fingers[sIdx];

    fingering.push({
      string: i + 1,
      fret: offset === -1 ? -1 : baseFret + offset,
      finger: finger
    });
  }

  return buildFinalDynamicObject(chordName, root, fingering, baseFret, shapeObj.latinSuffix);
}

function buildFinalDynamicObject(chordName, root, fingering, baseFret, latinSuffix) {
  let rootLatinMap = {
    "C": "Do", "C#": "Do#", "D": "Re", "D#": "Re#", "E": "Mi", "F": "Fa", "F#": "Fa#", "G": "Sol", "G#": "Sol#", "A": "La", "A#": "La#", "B": "Si"
  };
  let rootLatin = rootLatinMap[root] || root;
  let latin = rootLatin + (latinSuffix ? " " + latinSuffix : "");

  let schema = generateAsciiSchema(chordName, latin, baseFret, fingering);

  const stringBaseMidi = {
    1: 64, // E4
    2: 59, // B3
    3: 55, // G3
    4: 50, // D3
    5: 45, // A2
    6: 40  // E2
  };
  const noteNames = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
  
  let notes = [];
  for (let f of fingering) {
    if (f.fret >= 0) {
      const midi = stringBaseMidi[f.string] + f.fret;
      const octave = Math.floor(midi / 12) - 1;
      const noteName = noteNames[midi % 12];
      notes.push(`${noteName}${octave}`);
    }
  }

  return {
    latin: latin,
    anglo: chordName,
    fingering: fingering,
    notes: notes,
    schema: schema
  };
}
