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
    synth.triggerAttackRelease(note, "1m", now + (index * speed));
  });
}
