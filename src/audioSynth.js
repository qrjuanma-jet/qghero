import * as Tone from 'https://esm.sh/tone';

let acousticSynth = null;
let electricSynth = null;
let isLoaded = false;
let distortion = null;
let reverb = null;

export async function initAudio() {
  if (isLoaded) return;
  
  await Tone.start();
  
  // Reverb general más sutil
  reverb = new Tone.Reverb({ decay: 2.0, preDelay: 0.1, wet: 0.15 }).toDestination();
  
  // Sintetizador Acústico: Tone.AMSynth simula muy bien la riqueza armónica de la madera (guitarra clásica) sin el "ruido blanco" eléctrico de Karplus-Strong ni el zumbido sordo de un Synth puro.
  acousticSynth = new Tone.PolySynth(Tone.AMSynth, {
    harmonicity: 3.0,
    oscillator: { type: "triangle" },
    envelope: {
      attack: 0.01,
      decay: 3.5, // Mayor tiempo de vibración antes de apagarse
      sustain: 0.05,
      release: 3.5 // Resonancia larga al soltar
    },
    modulation: { type: "sine" },
    modulationEnvelope: {
      attack: 0.05,
      decay: 0.4,
      sustain: 0,
      release: 0.5
    }
  });

  const acousticFilter = new Tone.Filter({
    type: "lowpass",
    frequency: 2500, // Deja pasar suficientes armónicos para distinguir los acordes claramente
    rolloff: -12
  }).connect(reverb);

  acousticSynth.connect(acousticFilter);
  acousticSynth.volume.value = 2;
  
  // Cadena de efectos para la guitarra eléctrica (Estilo "Entre dos tierras")
  const chorus = new Tone.Chorus(4, 2.5, 0.5).connect(reverb).start();
  const delay = new Tone.FeedbackDelay("8n", 0.25).connect(chorus);
  
  // Sintetizador Eléctrico (limpio y dulce)
  electricSynth = new Tone.PolySynth(Tone.Synth, {
    oscillator: { type: "triangle8" }, // Enriquecido pero sin estridencias
    envelope: {
      attack: 0.005,
      decay: 2.5,
      sustain: 0.2,
      release: 2.0
    }
  }).connect(delay);
  
  electricSynth.volume.value = 0; // Volumen natural sin distorsión
  
  isLoaded = true;
}

function getSynth(style = "") {
    const isElectric = style.toLowerCase().includes("rock") || style.toLowerCase().includes("metal") || style.toLowerCase().includes("punk");
    return isElectric ? electricSynth : acousticSynth;
}


/**
 * Reproduce un acorde simultáneamente
 * @param {string[]} notes - Ej: ["E2", "A2", "D3", "G3", "B3", "E4"] (Mi mayor)
 * @param {string} duration - Duración en notación de Tone (ej "2n")
 */
export function playChord(notes, duration = "2n", style = "") {
  if (!isLoaded) return;
  const synth = getSynth(style);
  if (!synth) return;
  synth.triggerAttackRelease(notes, duration);
}

/**
 * Arpegia un acorde imitando un rasgueo hacia abajo
 */
const LATIN_TO_ANGLO = {
  'do': 'C', 're': 'D', 'mi': 'E', 'fa': 'F', 'sol': 'G', 'la': 'A', 'si': 'B',
  'do#': 'C#', 're#': 'D#', 'fa#': 'F#', 'sol#': 'G#', 'la#': 'A#',
  'reb': 'Db', 'mib': 'Eb', 'solb': 'Gb', 'lab': 'Ab', 'sib': 'Bb'
};

function formatPitchForTone(rawPitch) {
  let p = String(rawPitch).trim().toLowerCase();
  let octave = p.match(/[0-9]/);
  octave = octave ? octave[0] : "4";
  let noteName = p.replace(/[0-9]/g, '');
  
  if (LATIN_TO_ANGLO[noteName]) {
    noteName = LATIN_TO_ANGLO[noteName];
  } else {
    noteName = noteName.charAt(0).toUpperCase() + noteName.slice(1);
  }
  
  if (!/^[A-G][#b]?$/.test(noteName)) return null;
  return noteName + octave;
}

export function strumChord(notes, speed = 0.05, style = "") {
  if (!isLoaded) return;
  const synth = getSynth(style);
  if (!synth) return;
  
  const now = Tone.now();
  if (!Array.isArray(notes)) notes = [notes];

  notes.forEach((note, index) => {
    if (!note) return;
    
    let pitch = note;
    if (typeof note === 'object') {
      pitch = note.note || note.pitch || note.latin || note.anglo;
    }
    
    let validPitch = formatPitchForTone(pitch);
    
    if (validPitch) {
      synth.triggerAttackRelease(validPitch, 2, now + (index * speed));
    }
  });
}

/**
 * Reproduce una nota individual en un tiempo específico
 */
export function playNote(note, timeOffset = 0, duration = "8n", style = "") {
  if (!isLoaded) return;
  const synth = getSynth(style);
  if (!synth) return;
  synth.triggerAttackRelease(note, duration, Tone.now() + timeOffset);
}

let previewPart = null;

export function playPreviewSequence(notesArray, onComplete = null, style = "") {
  if (!isLoaded) return;
  const synth = getSynth(style);
  if (!synth) return;
  stopPreviewSequence();
  
  // Array of { time: note.time, pitch: "C4" }
  const toneEvents = notesArray.map(n => {
    const octave = n.string < 4 ? "4" : "3";
    const pitch = (n.anglo || 'C') + octave;
    return { time: n.time, note: pitch };
  });

  previewPart = new Tone.Part((time, value) => {
    synth.triggerAttackRelease(value.note, "8n", time);
  }, toneEvents).start(0);

  Tone.Transport.start();

  // Schedule completion if needed
  if (onComplete && toneEvents.length > 0) {
    const lastEventTime = Math.max(...toneEvents.map(e => e.time));
    Tone.Transport.scheduleOnce(() => {
        onComplete();
    }, lastEventTime + 1); // wait 1 sec after last note
  }
}

export function stopPreviewSequence() {
  if (previewPart) {
    previewPart.dispose();
    previewPart = null;
  }
  Tone.Transport.stop();
  Tone.Transport.cancel();
  if (acousticSynth) acousticSynth.releaseAll();
  if (electricSynth) electricSynth.releaseAll();
}
