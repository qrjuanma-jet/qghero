import * as Tone from 'https://esm.sh/tone';

let synth = null;
let isLoaded = false;

export async function initAudio() {
  if (isLoaded) return;
  
  await Tone.start();
  
  // Usaremos un PolySynth básico con un oscilador tipo 'triangle' o 'sine' 
  // que simula vagamente una cuerda punteada si no hay samples grandes.
  // Para una app de producción, se usaría un Tone.Sampler con archivos .mp3
  
  synth = new Tone.PolySynth(Tone.Synth, {
    oscillator: { type: "fatcustom", partials: [0.2, 1, 0, 0.5, 0.1] },
    envelope: { attack: 0.01, decay: 1.5, sustain: 0.2, release: 1.2 }
  }).toDestination();
  
  synth.volume.value = -8; // Bajar un poco el volumen
  isLoaded = true;
}

/**
 * Reproduce un acorde simultáneamente
 * @param {string[]} notes - Ej: ["E2", "A2", "D3", "G3", "B3", "E4"] (Mi mayor)
 * @param {string} duration - Duración en notación de Tone (ej "2n")
 */
export function playChord(notes, duration = "2n") {
  if (!isLoaded || !synth) return;
  synth.triggerAttackRelease(notes, duration);
}

/**
 * Arpegia un acorde imitando un rasgueo hacia abajo
 */
export function strumChord(notes, speed = 0.05) {
  if (!isLoaded || !synth) return;
  
  const now = Tone.now();
  notes.forEach((note, index) => {
    let pitch = note;
    if (typeof note === 'object') {
      pitch = note.note || note.pitch || note.latin || note.anglo;
    }
    if (pitch) {
      // Ensure pitch has an octave number to avoid Tone.js errors
      if (!/[0-9]/.test(pitch)) {
        pitch += "4"; // default to 4th octave
      }
      // Using explicit 2 seconds duration instead of "1m" to avoid Transport dependency
      synth.triggerAttackRelease(pitch, 2, now + (index * speed));
    }
  });
}

/**
 * Reproduce una nota individual en un tiempo específico
 */
export function playNote(note, timeOffset = 0, duration = "8n") {
  if (!isLoaded || !synth) return;
  synth.triggerAttackRelease(note, duration, Tone.now() + timeOffset);
}

let previewPart = null;

export function playPreviewSequence(notesArray, onComplete = null) {
  if (!isLoaded || !synth) return;
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
  if (synth) synth.releaseAll();
}
