import { fetchPracticeLevel, fetchPracticeSong } from './groqApi.js';
import { initAudio, strumChord } from './audioSynth.js';
import { buildMiniFretboard } from './chordUI.js';
import { lookupChord } from './chordDb.js';

let currentStyle = 'rock';
let isGenerating = false;

const MAIN_CHORDS_BY_STYLE = {
  rock: [
    { chord: 'E5', type: 'Power Chord', desc: 'Base del rock. Potente y sin tercera.' },
    { chord: 'A5', type: 'Power Chord', desc: 'Ideal para transiciones desde E5.' },
    { chord: 'D5', type: 'Power Chord', desc: 'Da un tono más brillante al riff.' },
    { chord: 'G5', type: 'Power Chord', desc: 'Común en punk y hard rock.' }
  ],
  blues: [
    { chord: 'E7', type: 'Séptima Dominante', desc: 'El acorde fundamental del blues clásico.' },
    { chord: 'A7', type: 'Séptima Dominante', desc: 'El acorde de subdominante en progresión 12-bar.' },
    { chord: 'B7', type: 'Séptima Dominante', desc: 'El acorde de tensión (turnaround).' }
  ],
  metal: [
    { chord: 'E5', type: 'Power Chord Muteado', desc: 'Tocado con Palm Mute para agresividad.' },
    { chord: 'Drop D (D5)', type: 'Power Chord', desc: 'Típico en afinaciones graves.' },
    { chord: 'F5', type: 'Power Chord', desc: 'Para riffs oscuros de medio tono.' }
  ],
  clásico: [
    { chord: 'C', type: 'Mayor', desc: 'Alegre, brillante y base de la tonalidad.' },
    { chord: 'G', type: 'Mayor', desc: 'Dominante de Do, muy frecuente.' },
    { chord: 'Am', type: 'Menor', desc: 'Relativo menor, melancólico.' },
    { chord: 'Em', type: 'Menor', desc: 'Oscuro pero suave.' }
  ],
  pop: [
    { chord: 'C', type: 'Mayor', desc: 'Progresión I-V-vi-IV (ej. Let it Be).' },
    { chord: 'G', type: 'Mayor', desc: 'El grado V, da movimiento.' },
    { chord: 'Am', type: 'Menor', desc: 'El toque emotivo de la canción.' },
    { chord: 'F', type: 'Mayor', desc: 'Resolución típica pop.' }
  ],
  flamenco: [
    { chord: 'Am', type: 'Menor', desc: 'Inicio de la cadencia andaluza.' },
    { chord: 'G', type: 'Mayor', desc: 'Paso descendente.' },
    { chord: 'F', type: 'Mayor', desc: 'Tensión preparatoria.' },
    { chord: 'E', type: 'Mayor (Frigio)', desc: 'Resolución típica flamenca.' }
  ],
  rancheras: [
    { chord: 'G', type: 'Mayor', desc: 'Tónica muy usada en rancheras.' },
    { chord: 'D7', type: 'Dominante', desc: 'Tensión para volver a Sol.' },
    { chord: 'C', type: 'Mayor', desc: 'Acorde de paso.' }
  ]
};

// Helpers para localStorage
function getLevel(style) {
  return parseInt(localStorage.getItem(`qghero_level_${style}`)) || 1;
}

function setLevel(style, level) {
  localStorage.setItem(`qghero_level_${style}`, level);
}

function getCache(style, level) {
  const data = localStorage.getItem(`qghero_cache_${style}_${level}`);
  return data ? JSON.parse(data) : null;
}

function setCache(style, level, data) {
  localStorage.setItem(`qghero_cache_${style}_${level}`, JSON.stringify(data));
}

// UI Elements
let styleBtns, styleTitle, styleDesc, styleRightHand, styleChords, styleExamples, levelDisplay, practiceLoading, practiceContent, levelUpBtn;
let customSongInputContainer, customSongInput, searchCustomSongBtn;

export function initPracticeMode(getApiKeyFn) {
  styleBtns = document.querySelectorAll('.style-btn');
  styleTitle = document.getElementById('style-title');
  styleDesc = document.getElementById('style-desc');
  styleRightHand = document.getElementById('style-right-hand');
  styleChords = document.getElementById('style-chords');
  styleExamples = document.getElementById('style-examples');
  levelDisplay = document.getElementById('current-level-display');
  practiceLoading = document.getElementById('practice-loading');
  practiceContent = document.getElementById('practice-content');
  levelUpBtn = document.getElementById('level-up-btn');
  
  customSongInputContainer = document.getElementById('custom-song-input-container');
  customSongInput = document.getElementById('custom-song-input');
  searchCustomSongBtn = document.getElementById('search-custom-song-btn');

  const levelSelectorBtn = document.getElementById('level-selector-btn');
  if (levelSelectorBtn) {
    levelSelectorBtn.addEventListener('click', async () => {
      if (isGenerating || currentStyle === 'custom') return;
      const currentLvl = getLevel(currentStyle);
      const input = prompt(`¿A qué nivel de ${currentStyle.toUpperCase()} quieres saltar?`, currentLvl);
      if (input !== null) {
        const nextLevel = parseInt(input);
        if (!isNaN(nextLevel) && nextLevel > 0) {
          const apiKey = getApiKeyFn();
          if (!apiKey) {
            alert("Inicia sesión con tu API Key primero.");
            return;
          }
          setLevel(currentStyle, nextLevel);
          await renderStyle(currentStyle, apiKey);
        } else {
          alert("Por favor, introduce un número válido mayor que 0.");
        }
      }
    });
  }

  levelUpBtn.addEventListener('click', async () => {
    if (isGenerating || currentStyle === 'custom') return;
    const apiKey = getApiKeyFn();
    if (!apiKey) {
      alert("Inicia sesión con tu API Key primero.");
      return;
    }
    const nextLevel = getLevel(currentStyle) + 1;
    setLevel(currentStyle, nextLevel);
    await renderStyle(currentStyle, apiKey);
  });

  styleBtns.forEach(btn => {
    btn.addEventListener('click', async (e) => {
      if (isGenerating) return;
      styleBtns.forEach(b => b.classList.remove('active'));
      e.target.classList.add('active');
      currentStyle = e.target.dataset.style;
      
      const apiKey = getApiKeyFn();
      if (currentStyle === 'custom') {
        renderCustomMode();
      } else {
        await renderStyle(currentStyle, apiKey);
      }
    });
  });

  searchCustomSongBtn.addEventListener('click', async () => {
    if (isGenerating) return;
    const songName = customSongInput.value.trim();
    if (!songName) return;
    
    const apiKey = getApiKeyFn();
    if (!apiKey) {
        alert("Inicia sesión con tu API Key primero.");
        return;
    }
    await loadCustomSong(songName, apiKey);
  });

  const mainChordsBtn = document.getElementById('main-chords-btn');
  if (mainChordsBtn) {
    mainChordsBtn.addEventListener('click', () => {
      const modal = document.getElementById('global-help-modal');
      const title = document.getElementById('help-title');
      const content = document.getElementById('help-content');
      
      if (currentStyle === 'custom') {
        alert('En el modo "A la carta", busca una canción primero para ver sus acordes.');
        return;
      }
      
      const chordsData = MAIN_CHORDS_BY_STYLE[currentStyle] || [];
      title.textContent = `🎸 Acordes Principales: ${currentStyle.toUpperCase()}`;
      
      let html = `<p>Estos son los acordes más característicos del estilo <strong>${currentStyle}</strong>:</p>`;
      html += `<table style="width: 100%; border-collapse: collapse; margin-top: 15px;">
        <thead>
          <tr style="border-bottom: 2px solid var(--neon-cyan);">
            <th style="padding: 10px; text-align: left; color: var(--neon-cyan);">Acorde</th>
            <th style="padding: 10px; text-align: left; color: var(--neon-cyan);">Tipo</th>
            <th style="padding: 10px; text-align: left; color: var(--neon-cyan);">Uso / Sonoridad</th>
          </tr>
        </thead>
        <tbody>`;
        
      chordsData.forEach(c => {
        html += `<tr style="border-bottom: 1px solid rgba(0, 255, 255, 0.2);">
          <td style="padding: 10px; font-weight: bold; font-size: 1.2rem;">${c.chord}</td>
          <td style="padding: 10px;">${c.type}</td>
          <td style="padding: 10px;">${c.desc}</td>
        </tr>`;
      });
      
      html += `</tbody></table>`;
      content.innerHTML = html;
      modal.classList.remove('hidden');
    });
  }

  // Init
  const initialKey = getApiKeyFn();
  if (initialKey) {
    renderStyle('rock', initialKey);
  }
}

function renderCustomMode() {
    practiceContent.classList.add('hidden');
    customSongInputContainer.style.display = 'block';
    
    // Resetear contenido previo si lo hay
    styleTitle.textContent = "A la carta";
    levelDisplay.parentElement.style.display = 'none'; // Ocultar nivel
    styleDesc.textContent = "Busca cualquier canción para aprender sus acordes paso a paso.";
    styleRightHand.textContent = "...";
    styleChords.innerHTML = '';
    styleExamples.innerHTML = '';
    levelUpBtn.style.display = 'none'; // No hay niveles aquí
    
    practiceContent.classList.remove('hidden');
}

async function loadCustomSong(songName, apiKey) {
  isGenerating = true;
  practiceContent.classList.add('hidden');
  practiceLoading.classList.remove('hidden');

  try {
    const data = await fetchPracticeSong(apiKey, songName);
    renderDataToUI(data, songName);
  } catch (err) {
    alert("Error cargando canción: " + err.message);
  } finally {
    practiceLoading.classList.add('hidden');
    practiceContent.classList.remove('hidden');
    isGenerating = false;
  }
}

async function renderStyle(styleKey, apiKey) {
  isGenerating = true;
  const level = getLevel(styleKey);
  
  levelDisplay.parentElement.style.display = 'block';
  levelDisplay.textContent = level;
  customSongInputContainer.style.display = 'none';
  levelUpBtn.style.display = 'inline-block';
  
  practiceContent.classList.add('hidden');
  practiceLoading.classList.remove('hidden');

  try {
    let data = getCache(styleKey, level);
    
    if (!data) {
      if (!apiKey) throw new Error("API Key requerida para generar nivel.");
      data = await fetchPracticeLevel(apiKey, styleKey, level);
      setCache(styleKey, level, data);
    }
    
    renderDataToUI(data);
  } catch (err) {
    alert("Error cargando nivel: " + err.message);
  } finally {
    practiceLoading.classList.add('hidden');
    practiceContent.classList.remove('hidden');
    isGenerating = false;
  }
}

function renderDataToUI(data, customSongQuery = null) {
    styleTitle.textContent = data.title;
    styleDesc.textContent = data.desc;
    styleRightHand.textContent = data.rightHand;

    // Chords
    styleChords.innerHTML = '';
    if (data.chords && data.chords.length > 0) {
      data.chords.forEach(chord => {
        // Enriquecer el acorde con chordDb para obtener digitación y notas reales
        const dbInfo = lookupChord(chord.name);
        if (dbInfo) {
          chord.fingering = dbInfo.fingering;
          chord.notes = dbInfo.notes;
          if (dbInfo.latin && dbInfo.anglo) {
            chord.name = `${dbInfo.latin} (${dbInfo.anglo})`;
          }
        } else if (!chord.notes) {
          // Fallback mínimo por si no está en la DB
          chord.notes = ["C4"]; 
        }

        const card = document.createElement('div');
        card.className = 'chord-card';
        card.innerHTML = `
          <h4>${chord.name}</h4>
          <div class="chord-ui-container"></div>
          <button class="btn primary-btn play-chord-btn" data-notes='${JSON.stringify(chord.notes)}'>
            🔊 Escuchar
          </button>
        `;
        
        // Check if chord has a fingering to build the UI
        if (chord.fingering) {
          const uiContainer = card.querySelector('.chord-ui-container');
          const fb = buildMiniFretboard(chord);
          uiContainer.appendChild(fb);
        }
        
        styleChords.appendChild(card);
      });
    }

    // Examples / Structure
    styleExamples.innerHTML = '';
    if (data.examples && data.examples.length > 0) {
      data.examples.forEach(ex => {
        const card = document.createElement('div');
        card.className = 'example-card';
        card.innerHTML = `
          <h5>${ex.song}</h5>
          <p><strong>Progresión:</strong> ${ex.progression}</p>
          <p><strong>Ritmo:</strong> ${ex.rhythm}</p>
        `;
        styleExamples.appendChild(card);
      });
      document.getElementById('examples-section').classList.remove('hidden');
    } else {
      document.getElementById('examples-section').classList.add('hidden');
    }

    // Botón Partitura
    const extraActions = document.getElementById('practice-extra-actions');
    if (extraActions) {
      extraActions.innerHTML = '';
      if (customSongQuery) {
        const tabLink = document.createElement('a');
        tabLink.href = `https://www.ultimate-guitar.com/search.php?search_type=title&value=${encodeURIComponent(customSongQuery)}`;
        tabLink.target = '_blank';
        tabLink.className = 'btn secondary-btn';
        tabLink.style.borderColor = 'var(--neon-cyan)';
        tabLink.style.color = 'var(--neon-cyan)';
        tabLink.style.textDecoration = 'none';
        tabLink.innerHTML = `📄 Buscar Partitura/Tabs en la Web`;
        extraActions.appendChild(tabLink);
      }
    }

    // Bind Audio
    document.querySelectorAll('.play-chord-btn').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const notes = JSON.parse(e.target.getAttribute('data-notes'));
        await initAudio();
        strumChord(notes, 0.05, currentStyle);
      });
    });
}
