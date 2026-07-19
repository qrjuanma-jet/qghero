import { fetchTheoryCourse, expandTheoryCourse } from './groqApi.js';
import { initAudio, strumChord } from './audioSynth.js';
import { lookupChord } from './chordDb.js';
import { buildMiniFretboard } from './chordUI.js';

let currentLevel = 'Principiante';

export function initTheoryMode(getApiKeyFn) {
  const generateBtn = document.getElementById('generate-course-btn');
  const resultContainer = document.getElementById('theory-result');
  const loadingIndicator = document.getElementById('theory-loading');
  const levelSelect = document.getElementById('theory-level');
  
  const expandBtnContainer = document.getElementById('theory-expand-container');
  const expandBtn = document.getElementById('expand-course-btn');

  function renderTheoryChords() {
    resultContainer.querySelectorAll('.theory-chord-card').forEach(container => {
      if (container.dataset.rendered) return;
      container.dataset.rendered = "true";
      
      const chordName = container.getAttribute('data-chord');
      const noteName = container.getAttribute('data-note'); // Format: "string-fret" e.g. "6-3"

      let fb = null;
      let playableNotes = null;

      if (noteName) {
        // Es un punteo
        const [str, frt] = noteName.split('-');
        if (str && frt) {
          const stringNum = parseInt(str, 10);
          const fretNum = parseInt(frt, 10);
          fb = buildMiniFretboard({ single_note: { string: stringNum, fret: fretNum } });
          
          // Import/use getPitchFromStringFret logic here, or we can just import playNote
          // Let's rely on a helper or just define it here to calculate pitch
          const openPitches = ["E4", "B3", "G3", "D3", "A2", "E2"];
          const notesStr = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
          const openPitch = openPitches[stringNum - 1]; 
          if (openPitch && fretNum >= 0) {
            const baseNote = openPitch.slice(0, -1);
            const baseOctave = parseInt(openPitch.slice(-1));
            let baseIndex = notesStr.indexOf(baseNote);
            let finalIndex = baseIndex + fretNum;
            let finalOctave = baseOctave + Math.floor(finalIndex / 12);
            playableNotes = [`${notesStr[finalIndex % 12]}${finalOctave}`];
          }
        }
      } else if (chordName) {
        // Es un acorde
        const chord = lookupChord(chordName);
        if (chord) {
          fb = buildMiniFretboard(chord);
          playableNotes = chord.notes;
        } else {
          container.innerHTML = `<p style="color:red; font-size:12px;">[Acorde no encontrado en DB: ${chordName}]</p>`;
          return;
        }
      } else {
        return;
      }

      if (fb) {
        container.appendChild(fb);
        
        if (playableNotes) {
          const btn = document.createElement('button');
          btn.className = 'btn primary-btn play-chord-btn';
          btn.innerHTML = '🔊 Escuchar';
          btn.style.marginTop = '10px';
          btn.style.display = 'block';
          
          btn.addEventListener('click', async () => {
            try {
              await initAudio();
              // Si es punteo (1 nota) strumChord lo toca igual si le pasas array o usa playNote
              if (noteName) {
                // we need playNote, but wait, strumChord with speed 0.05 on [note] works fine!
                strumChord(playableNotes, 0.05);
              } else {
                strumChord(playableNotes, 0.05);
              }
            } catch(err) {
              console.error("Error reproduciendo audio:", err);
            }
          });
          
          container.appendChild(btn);
        }
      }
    });
  }

  function loadCachedCourse(level) {
    const cachedHTML = localStorage.getItem(`qghero_theory_course_${level}`);
    if (cachedHTML) {
      resultContainer.innerHTML = cachedHTML;
      renderTheoryChords();
      resultContainer.classList.remove('hidden');
      expandBtnContainer.classList.remove('hidden');
      return true;
    }
    return false;
  }

  function saveCourse(level, htmlContent) {
    localStorage.setItem(`qghero_theory_course_${level}`, htmlContent);
  }

  // Cargar caché si cambiamos en el selector
  levelSelect.addEventListener('change', () => {
    currentLevel = levelSelect.value;
    resultContainer.classList.add('hidden');
    expandBtnContainer.classList.add('hidden');
    loadCachedCourse(currentLevel);
  });

  generateBtn.addEventListener('click', async () => {
    const apiKey = getApiKeyFn();
    if (!apiKey) {
      alert("Por favor, inicia sesión con tu API Key en la pantalla principal primero.");
      return;
    }

    currentLevel = levelSelect.value;
    
    // Si queremos regenerar de cero al pulsar generar
    loadingIndicator.classList.remove('hidden');
    resultContainer.classList.add('hidden');
    expandBtnContainer.classList.add('hidden');
    generateBtn.disabled = true;

    try {
      const courseHtml = await fetchTheoryCourse(apiKey, currentLevel);
      resultContainer.innerHTML = courseHtml;
      saveCourse(currentLevel, courseHtml);
      
      renderTheoryChords();

      resultContainer.classList.remove('hidden');
      expandBtnContainer.classList.remove('hidden');
    } catch (error) {
      alert("Hubo un error al generar el curso: " + error.message);
    } finally {
      loadingIndicator.classList.add('hidden');
      generateBtn.disabled = false;
    }
  });

  // Botón ampliar curso
  expandBtn.addEventListener('click', async () => {
    const apiKey = getApiKeyFn();
    if (!apiKey) {
      alert("Por favor, inicia sesión con tu API Key primero.");
      return;
    }

    expandBtn.disabled = true;
    const originalText = expandBtn.innerHTML;
    expandBtn.innerHTML = '<div class="spinner" style="width:20px;height:20px;margin:0;border-width:2px;"></div>';

    try {
      const previousHtml = resultContainer.innerHTML;
      const newHtml = await expandTheoryCourse(apiKey, currentLevel, previousHtml);
      
      // Añadir al final
      const newSection = document.createElement('div');
      newSection.style.marginTop = "2rem";
      newSection.style.paddingTop = "2rem";
      newSection.style.borderTop = "1px dashed var(--neon-cyan)";
      newSection.innerHTML = newHtml;
      
      resultContainer.appendChild(newSection);
      
      // Guardar completo
      saveCourse(currentLevel, resultContainer.innerHTML);
      
      renderTheoryChords();
    } catch (error) {
      alert("Hubo un error al ampliar el curso: " + error.message);
    } finally {
      expandBtn.disabled = false;
      expandBtn.innerHTML = originalText;
    }
  });
  
  // Attempt load on init
  loadCachedCourse(levelSelect.value);
}
