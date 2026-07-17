import { fetchPracticeLevel, fetchPracticeSong } from './groqApi.js';
import { initAudio, strumChord } from './audioSynth.js';
import { buildMiniFretboard } from './chordUI.js';
import { lookupChord } from './chordDb.js';

let currentStyle = 'rock';
let isGenerating = false;

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
          if (!chord.name.includes(dbInfo.anglo)) {
            chord.name = `${dbInfo.latin || chord.name} (${dbInfo.anglo})`;
          }
        } else if (!chord.notes) {
          // Fallback mínimo por si no está en la DB
          chord.notes = ["C4"]; 
        }

        const card = document.createElement('div');
        card.className = 'chord-card';
        card.innerHTML = `
          <h4>${chord.name}</h4>
          <p><strong>Dedo:</strong> ${chord.finger || "Posición estándar"}</p>
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
        strumChord(notes, 0.05);
      });
    });
}
