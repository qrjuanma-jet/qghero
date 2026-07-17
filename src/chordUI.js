/**
 * Generador de interfaz de usuario para acordes (Viñetas / Fretboards).
 */

function toRoman(num) {
  const map = { M: 1000, CM: 900, D: 500, CD: 400, C: 100, XC: 90, L: 50, XL: 40, X: 10, IX: 9, V: 5, IV: 4, I: 1 };
  let result = '';
  for (let key in map) {
    while (num >= map[key]) {
      result += key;
      num -= map[key];
    }
  }
  return result;
}

/**
 * Dibuja un mini mástil dinámico para un acorde o nota.
 * @param {Object} note Objeto con 'fingering' o 'string'/'fret'/'finger'
 * @returns {HTMLElement} El div con la clase .mini-fretboard
 */
export function buildMiniFretboard(note) {
  const fb = document.createElement('div');
  fb.className = 'mini-fretboard';

  // Get fingering array or fallback to single note logic
  const fingerings = note.fingering || (note.single_note ? [note.single_note] : [{ string: note.string, fret: note.fret, finger: note.finger }]);
  
  // Find min and max fret for rendering scale
  let minFret = 999;
  let maxFret = -999;
  for (const f of fingerings) {
    if (f.fret > 0) {
      minFret = Math.min(minFret, f.fret);
      maxFret = Math.max(maxFret, f.fret);
    }
  }
  
  // If no fretted notes, default to 1-3
  if (minFret === 999) { minFret = 1; maxFret = 3; }
  
  // Expand window to at least 3 frets
  if (maxFret - minFret < 2) maxFret = minFret + 2;

  const numFrets = maxFret - minFret + 1;

  // Draw horizontal fret lines
  for (let i = 0; i <= numFrets; i++) {
    const relPos = i / numFrets;
    const pos = 20 + (relPos * 70);

    const line = document.createElement('div');
    line.className = 'mini-fret-line';
    line.style.left = `${pos}%`;
    fb.appendChild(line);

    // Add roman numeral above the fret
    const currentFret = minFret + i;
    const numLabel = document.createElement('div');
    numLabel.className = 'mini-fret-num';
    numLabel.style.left = `${pos}%`;
    numLabel.textContent = toRoman(currentFret);
    fb.appendChild(numLabel);
  }

  // Build 6 strings
  for (let s = 1; s <= 6; s++) {
    const stringLine = document.createElement('div');
    stringLine.className = 'mini-string';

    const fNote = fingerings.find(f => f.string === s);
    if (fNote) {
      if (fNote.fret === -1 || fNote.fret === 'X') {
        // Muted string
        const cross = document.createElement('div');
        cross.className = `mini-fret-dot str-${s}`;
        cross.textContent = 'X';
        cross.style.left = '5%';
        cross.style.background = 'transparent';
        cross.style.color = '#ff4444';
        stringLine.appendChild(cross);
      } else if (fNote.fret === 0) {
        // Open string
        const circle = document.createElement('div');
        circle.className = `mini-fret-dot str-${s}`;
        circle.textContent = 'O';
        circle.style.left = '5%';
        circle.style.background = 'transparent';
        circle.style.color = 'var(--neon-cyan)';
        stringLine.appendChild(circle);
      } else {
        // Fretted note
        const dot = document.createElement('div');
        dot.className = `mini-fret-dot str-${s}`;
        dot.textContent = fNote.finger && fNote.finger > 0 ? fNote.finger : toRoman(fNote.fret);
        // Position relative to the [minFret, maxFret] window
        // Centered in the fret space
        const relPos = (fNote.fret - minFret + 0.5) / numFrets;
        const pos = 20 + (relPos * 70); // From 20% to 90%
        dot.style.left = `${pos}%`;
        dot.style.color = s <= 1 || s >= 6 ? '#fff' : '#000';
        stringLine.appendChild(dot);
      }
    }

    fb.appendChild(stringLine);
  }

  // Fret label in corner (base fret)
  if (minFret > 0) {
    const label = document.createElement('div');
    label.className = 'mini-fret-label';
    label.textContent = `T${toRoman(minFret)}`;
    fb.appendChild(label);
  }

  return fb;
}
