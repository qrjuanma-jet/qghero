const CHROMATIC = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
const STRING_TUNING_MIDI = [64, 59, 55, 50, 45, 40]; // 1=e, 2=B, 3=G, 4=D, 5=A, 6=E

function getNotesForQuality(root, quality) {
  let rootIdx = CHROMATIC.indexOf(root);
  if (rootIdx === -1) return null;

  let req = [0]; // Semitones from root
  
  let isM = quality.includes("m") && !quality.includes("maj") && quality !== "dim" && !quality.includes("dim7");
  let isDim = quality.includes("dim");
  let isAug = quality.includes("aug");
  
  // 3rd
  if (quality === "5") {
    // Power chord, no 3rd
  } else if (isM || isDim) {
    req.push(3); // m3
  } else if (quality.includes("sus2")) {
    req.push(2);
  } else if (quality.includes("sus4") || quality.includes("sus")) {
    req.push(5);
  } else {
    req.push(4); // M3
  }
  
  // 5th
  if (isDim || quality.includes("b5")) {
    req.push(6); // d5
  } else if (isAug || quality.includes("#5")) {
    req.push(8); // A5
  } else if (quality !== "5") {
    req.push(7); // P5 (Omit in 5 chords already handled, but for others we request it)
  }
  
  // 7th
  if (quality.includes("maj7") || quality.includes("maj9") || quality.includes("maj11") || quality.includes("maj13")) {
    req.push(11);
  } else if (quality.includes("7") || quality.includes("9") || quality.includes("11") || quality.includes("13") || quality.includes("m7")) {
    if (quality === "dim7" || quality === "dim") req.push(9); // bb7 = 6
    else req.push(10); // b7
  }
  
  // 9th
  if (quality.includes("b9")) req.push(1);
  else if (quality.includes("#9")) req.push(3);
  else if (quality.includes("9") || quality.includes("11") || quality.includes("13") || quality.includes("add9")) req.push(2);
  
  // 11th
  if (quality.includes("#11")) req.push(6);
  else if (quality.includes("11") || quality.includes("13")) req.push(5);
  
  // 13th
  if (quality.includes("b13")) req.push(8);
  else if (quality.includes("13")) req.push(9);
  
  // 6th
  if (quality.includes("6")) req.push(9);

  // Convert to absolute notes
  let uniqueIntervals = [...new Set(req)];
  return uniqueIntervals.map(iv => CHROMATIC[(rootIdx + iv) % 12]);
}

export function generateAlgorithmicChord(chordName, root, quality, requestedBaseFret = 0) {
  const requiredNotes = getNotesForQuality(root, quality);
  if (!requiredNotes) return null;

  // Precompute the note at each fret for each string
  const fretboard = [];
  for (let s = 0; s < 6; s++) { // 0=e, 5=E
    let stringNotes = [];
    for (let f = 0; f <= 15; f++) {
      let midi = STRING_TUNING_MIDI[s] + f;
      stringNotes.push(CHROMATIC[midi % 12]);
    }
    fretboard.push(stringNotes);
  }

  let bestVoicing = null;
  let bestScore = -9999;

  // Escanear el mástil en ventanas de 3 trastes (porque chordUI dibuja 3 trastes exactos)
  let scanMin = 0;
  let scanMax = 12;
  if (requestedBaseFret > 0) {
    scanMin = requestedBaseFret;
    scanMax = requestedBaseFret;
  }

  for (let startFret = scanMin; startFret <= scanMax; startFret++) {
    let optionsPerString = [];
    for (let s = 0; s < 6; s++) {
      let opts = [-1]; // Mute
      if (startFret !== 0) opts.push(0); // Open string
      
      let maxFret = startFret === 0 ? 3 : startFret + 2; // Ventana de 3 trastes
      for (let f = Math.max(1, startFret); f <= maxFret; f++) {
        opts.push(f);
      }
      optionsPerString.push(opts);
    }

    // Brute force combinaciones (recursivo)
    let combinations = [];
    function generateCombinations(stringIdx, currentCombo) {
      if (stringIdx === 6) {
        combinations.push([...currentCombo]);
        return;
      }
      for (let opt of optionsPerString[stringIdx]) {
        currentCombo.push(opt);
        generateCombinations(stringIdx + 1, currentCombo);
        currentCombo.pop();
      }
    }
    generateCombinations(0, []);

    // Evaluar
    for (let combo of combinations) {
      // Find lowest string
      let lowestString = -1;
      for (let s = 5; s >= 0; s--) { 
        if (combo[s] !== -1) {
          lowestString = s;
          break;
        }
      }

      if (lowestString === -1) continue;

      // Root on bottom?
      let lowestNote = fretboard[lowestString][combo[lowestString]];
      if (lowestNote !== root) continue;

      let playedNotes = new Set();
      let activeStringsCount = 0;
      for (let s = 0; s < 6; s++) {
        if (combo[s] !== -1) {
          playedNotes.add(fretboard[s][combo[s]]);
          activeStringsCount++;
        }
      }

      // Checking missing notes
      let missingNotes = [];
      let rootIdx = CHROMATIC.indexOf(root);
      let perfect5th = CHROMATIC[(rootIdx + 7) % 12];
      
      for (let req of requiredNotes) {
        if (!playedNotes.has(req)) missingNotes.push(req);
      }

      let hasAlienNotes = false;
      for (let note of playedNotes) {
        if (!requiredNotes.includes(note)) {
          hasAlienNotes = true;
          break;
        }
      }
      if (hasAlienNotes) continue;

      let valid = false;
      if (missingNotes.length === 0) valid = true;
      else if (missingNotes.length === 1 && missingNotes[0] === perfect5th && requiredNotes.length >= 4) {
        valid = true; // Dropping 5th is ok
      } else if (missingNotes.length === 2 && missingNotes.includes(perfect5th) && requiredNotes.length >= 5) {
        // Asegurarse de que no omitimos la raíz o la 3ra
        let rootIdx = CHROMATIC.indexOf(root);
        let thirdIdx = (rootIdx + 4) % 12; // M3
        let mThirdIdx = (rootIdx + 3) % 12; // m3
        if (!missingNotes.includes(CHROMATIC[rootIdx]) && !missingNotes.includes(CHROMATIC[thirdIdx]) && !missingNotes.includes(CHROMATIC[mThirdIdx])) {
            valid = true; // Dropping 5th and some extension is ok
        }
      }

      if (!valid) continue;

      // Puntuación heurística
      let score = 0;
      score += activeStringsCount * 10;
      
      let innerMutes = 0;
      let foundActive = false;
      for (let s = 5; s >= 0; s--) {
        if (combo[s] !== -1) foundActive = true;
        else if (foundActive && combo[s] === -1) {
          let hasHigherActive = false;
          for (let higher = s - 1; higher >= 0; higher--) {
            if (combo[higher] !== -1) hasHigherActive = true;
          }
          if (hasHigherActive) innerMutes++;
        }
      }
      score -= innerMutes * 50; // Gran penalización por mutear cuerdas intermedias

      let openStrings = combo.filter(f => f === 0).length;
      score += openStrings * 5;

      let sumFrets = combo.reduce((a, b) => a + (b === -1 ? 0 : b), 0);
      score -= sumFrets;

      if (score > bestScore) {
        bestScore = score;
        bestVoicing = combo;
      }
    }
  }

  if (!bestVoicing) return null;

  let fingering = [];
  let fretted = [];
  for (let s = 0; s < 6; s++) {
    if (bestVoicing[s] > 0) fretted.push({ stringIdx: s, fret: bestVoicing[s] });
  }
  fretted.sort((a, b) => a.fret - b.fret);

  let fingerMap = {};
  if (fretted.length > 0) {
    let fingerCounter = 1;
    let currentFret = fretted[0].fret;
    for (let f of fretted) {
      if (f.fret > currentFret) {
        fingerCounter++;
        currentFret = f.fret;
      }
      if (fingerCounter > 4) fingerCounter = 4;
      fingerMap[f.stringIdx] = fingerCounter;
    }
  }

  // Identificar cejilla (barre)
  let barreFret = -1;
  let fretCounts = {};
  for (let f of fretted) {
    fretCounts[f.fret] = (fretCounts[f.fret] || 0) + 1;
  }
  for (let f in fretCounts) {
    if (fretCounts[f] > 1 && parseInt(f) === fretted[0].fret) {
      barreFret = parseInt(f);
      break;
    }
  }

  if (barreFret !== -1) {
    for (let f of fretted) {
      if (f.fret === barreFret) fingerMap[f.stringIdx] = 1;
    }
  }

  let minActiveFret = 99;
  for (let s = 0; s < 6; s++) { // 0=e, 5=E
    let fret = bestVoicing[s];
    let finger = -1;
    if (fret === 0) finger = 0;
    else if (fret > 0) {
      finger = fingerMap[s];
      if (fret < minActiveFret) minActiveFret = fret;
    }
    fingering.push({
      string: s + 1, // 1=e
      fret: fret,
      finger: finger
    });
  }

  let baseFret = minActiveFret === 99 ? 0 : minActiveFret;
  let maxFret = Math.max(...bestVoicing);
  if (maxFret <= 3) baseFret = 0;

  return {
    fingering: fingering,
    baseFret: baseFret
  };
}
