const ROMAN_NUMERALS = ["", "Ⅰ", "Ⅱ", "Ⅲ", "Ⅳ", "Ⅴ", "Ⅵ", "Ⅶ", "Ⅷ", "Ⅸ", "Ⅹ", "Ⅺ", "Ⅻ", "XIII", "XIV", "XV", "XVI", "XVII", "XVIII", "XIX", "XX", "XXI", "XXII", "XXIII", "XXIV"];

// Strings 6 and 5 notes
const string6Notes = ["E", "F", "F#", "G", "G#", "A", "A#", "B", "C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B", "C", "C#", "D", "D#", "E"];
const string5Notes = ["A", "A#", "B", "C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B", "C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A"];

// Parse a chord name like "C#m7" into Root="C#" and Quality="m7"
function parseChordParts(chordName) {
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

export function generateDynamicChord(chordName, baseFret = 0) {
  const { root, quality } = parseChordParts(chordName);
  
  // Si no nos dan baseFret, buscamos el traste óptimo
  if (baseFret <= 0) {
    // Buscamos en la 6ª cuerda (E-Shape)
    let fret6 = string6Notes.indexOf(root);
    // Buscamos en la 5ª cuerda (A-Shape)
    let fret5 = string5Notes.indexOf(root);
    
    // Elegimos la posición más baja (más cerca del clavijero)
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
    // Si se pasa del traste 12, intentamos restarle 12
    const lowerFret = baseFret - 12;
    if (lowerFret > 0) baseFret = lowerFret;
  }
  
  if (baseFret > 14) return null;
  
  // Check if we support this quality
  const template = SHAPE_TEMPLATES[quality];
  if (!template) return null; // Fallback to database or nothing

  let shapeName = "";
  let shapeObj = null;

  // Is the root on the 6th string at baseFret?
  if (string6Notes[baseFret] === root) {
    shapeName = "E-Shape";
    shapeObj = template["E-Shape"];
  } 
  // Is the root on the 5th string at baseFret?
  else if (string5Notes[baseFret] === root) {
    shapeName = "A-Shape";
    shapeObj = template["A-Shape"];
  } else {
    // If the root doesn't match the base fret on 6th or 5th, we can't reliably generate a standard shape.
    // For example, an inversion. We fallback.
    return null;
  }

  // Construct the fingering array
  let fingering = [];
  // shapeObj.offsets order is 6th, 5th, 4th, 3rd, 2nd, 1st
  // But our fingering array wants string 1 to 6
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

  // Find a latin name based on root
  let rootLatinMap = {
    "C": "Do", "C#": "Do#", "D": "Re", "D#": "Re#", "E": "Mi", "F": "Fa", "F#": "Fa#", "G": "Sol", "G#": "Sol#", "A": "La", "A#": "La#", "B": "Si"
  };
  let rootLatin = rootLatinMap[root] || root;
  let latin = rootLatin + " " + shapeObj.latinSuffix;

  let schema = generateAsciiSchema(chordName, latin, baseFret, fingering);

  // Calcular notas musicales reales para el sintetizador
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
