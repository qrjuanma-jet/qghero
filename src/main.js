// Estilos cargados en index.html
import { fetchSongData, expandGameSong } from './groqApi.js';
import { GameEngine } from './gameEngine.js';
import { initShareButtons } from './share.js';
import { initPracticeMode } from './practiceMode.js';
import { initTheoryMode } from './theoryMode.js';
import { initAudio, strumChord, playNote, playPreviewSequence, stopPreviewSequence } from './audioSynth.js';

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js').catch(err => console.log('SW reg error:', err));
  });
}

// App State
let groqApiKey = localStorage.getItem('qghero_groq_key') || '';
let currentSongData = null;
let ytPlayer = null;
let gameEngine = null;

const screens = {
  login: document.getElementById('login-screen'),
  main: document.getElementById('main-screen'),
  setup: document.getElementById('game-setup-screen'),
  practice: document.getElementById('practice-screen'),
  theory: document.getElementById('theory-screen'),
  game: document.getElementById('game-screen')
};

const modals = {
  technique: document.getElementById('technique-modal')
};

function showScreen(screenName, pushHistory = true) {
  Object.values(screens).forEach(s => {
    s.classList.remove('active');
    s.classList.add('hidden');
  });
  screens[screenName].classList.remove('hidden');
  screens[screenName].classList.add('active');
  
  if (pushHistory) {
    history.pushState({ screen: screenName }, '', `#${screenName}`);
  }
}

window.addEventListener('popstate', (e) => {
  if (e.state && e.state.screen) {
    showScreen(e.state.screen, false);
  } else {
    showScreen('main', false);
  }
});

function getApiKey() {
  return groqApiKey;
}

let deferredPrompt;

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
  const btn = document.getElementById('install-app-btn');
  if (btn) btn.classList.remove('hidden');
});

function checkSharedUrl() {
  const urlParams = new URLSearchParams(window.location.search);
  const sharedUrl = urlParams.get('v') || urlParams.get('url') || urlParams.get('text');
  if (sharedUrl && sharedUrl.includes('youtu')) {
    document.getElementById('youtube-url').value = sharedUrl;
    document.getElementById('song-name').value = '';
    
    // Quitamos los query params para no re-ejecutar al recargar
    window.history.replaceState({}, document.title, window.location.pathname);
    
    // Redirigir a la pantalla de setup y simular el click para cargar de verdad
    showScreen('setup', true);
    setTimeout(() => {
        document.getElementById('load-song-btn').click();
    }, 100);
  }
}

function initApp() {
  gameEngine = new GameEngine('game-canvas');
  initShareButtons('');
  initPracticeMode(getApiKey);
  initTheoryMode(getApiKey);
  
  if (groqApiKey) {
    showScreen('main', false);
    checkSharedUrl();
  } else {
    showScreen('login', false);
  }
  
  // Login
  const keyInput = document.getElementById('groq-api-key');
  document.getElementById('toggle-key-visibility').addEventListener('click', (e) => {
    e.preventDefault();
    if (keyInput.type === 'password') {
      keyInput.type = 'text';
    } else {
      keyInput.type = 'password';
    }
  });

  document.getElementById('save-key-btn').addEventListener('click', () => {
    const key = keyInput.value.trim();
    if (key.startsWith('gsk_')) {
      groqApiKey = key;
      localStorage.setItem('qghero_groq_key', key);
      showScreen('main');
    } else {
      alert("La clave debe empezar por 'gsk_'");
    }
  });
  
  document.getElementById('logout-btn').addEventListener('click', () => {
    localStorage.removeItem('qghero_groq_key');
    groqApiKey = '';
    showScreen('login');
  });

  setupEventListeners();
}

function setupEventListeners() {
  const helpContents = {
      main: `
          <h3>Bienvenido a QGHERO</h3>
          <p>Esta aplicación te ayuda a aprender guitarra usando Inteligencia Artificial. Tienes 3 modos:</p>
          <ul>
              <li><strong>Modo Teoría:</strong> Genera lecciones y esquemas técnicos según tu nivel, usando nomenclatura oficial (dedos 1,2,3,4).</li>
              <li><strong>Modo Práctica:</strong> Elige un estilo musical y la IA te enseñará acordes y ejercicios progresivos.</li>
              <li><strong>Modo Juego:</strong> El modo principal. Pega un enlace de YouTube y la IA extraerá los acordes para que los toques al estilo Guitar Hero.</li>
          </ul>`,
      theory: `
          <h3>Modo Teoría</h3>
          <p>Aquí la IA actúa como tu profesor particular.</p>
          <p>Usa los botones de nivel ("Básico", "Intermedio", "Avanzado") para generar una clase magistral desde cero. Si quieres profundizar en el mismo tema sin repetir conceptos, usa el botón "Avanzar Temario".</p>
          <p><strong>Interpretación de Acordes:</strong><br>Las "X" significan "no tocar esa cuerda". La "O" significa "cuerda al aire". Los números (1, 2, 3, 4) indican qué dedo usar.</p>`,
      practice: `
          <h3>Modo Práctica</h3>
          <p>Selecciona un estilo musical en la barra lateral para recibir una lección enfocada en ese género.</p>
          <p>Cada vez que dominas un nivel, pulsa "Subir de Nivel" para que la IA genere acordes y ritmos más complejos del mismo estilo. Si buscas una canción concreta, usa el buscador "A la Carta".</p>`,
      setup: `
          <h3>Configurar Partida</h3>
          <p>Tienes dos formas de jugar:</p>
          <ul>
              <li><strong>Buscar por Nombre:</strong> Escribe "Smells Like Teen Spirit" y la IA deducirá los acordes (sonará con audio sintetizado interno).</li>
              <li><strong>Enlace de YouTube (Recomendado):</strong> Pega un link de YouTube. La IA extraerá los acordes y el vídeo sonará de fondo sincronizado con las notas del juego.</li>
          </ul>`,
      game: `
          <h3>¿Cómo Jugar?</h3>
          <p>Si nunca has jugado a algo como Guitar Hero, lee esto atentamente:</p>
          <ul style="margin-bottom: 1rem;">
              <li><strong>Las 6 líneas:</strong> Representan las 6 cuerdas de tu guitarra. La línea roja (e) es la cuerda más fina. La morada (E) es la más gruesa.</li>
              <li><strong>Las notas cayendo:</strong> Cuando una letra cae, indica la cuerda que debes tocar y el traste (ej: "G (3)" significa "Nota Sol en el traste 3").</li>
              <li><strong>¿Cuándo tocar?:</strong> Tienes que pisar el traste y rasguear la cuerda en tu guitarra <em>exactamente en el momento en que la nota que cae cruza la línea blanca inferior</em> de la pantalla.</li>
              <li><strong>¡Juega en la Pantalla!:</strong> Si no tienes guitarra a mano, puedes <strong>tocar (o hacer clic) directamente en el carril de la cuerda</strong> en la pantalla justo cuando la nota cruce la meta para que suene el sintetizador.</li>
          </ul>
          <h4>Controles</h4>
          <ul>
              <li><strong>▶️ / ⏸️:</strong> Pausa o reanuda la canción/juego.</li>
              <li><strong>Deslizador:</strong> Muévelo para rebobinar o adelantar a una parte específica de la canción.</li>
              <li><strong>Velocidad:</strong> Reduce la velocidad a 0.5x si la canción va demasiado rápido para ti.</li>
          </ul>`
  };

  const helpModal = document.getElementById('global-help-modal');
  const helpTitle = document.getElementById('help-title');
  const helpContent = document.getElementById('help-content');
  const closeHelpBtn = document.getElementById('close-help-btn');

  document.querySelectorAll('.help-btn').forEach(btn => {
      btn.addEventListener('click', () => {
          const target = btn.getAttribute('data-help');
          helpTitle.textContent = "Ayuda: " + btn.title.replace('Ayuda de ', '').replace('Ayuda', 'Información');
          helpContent.innerHTML = helpContents[target] || "<p>Ayuda no disponible.</p>";
          helpModal.classList.remove('hidden');
      });
  });

  closeHelpBtn.addEventListener('click', () => {
      helpModal.classList.add('hidden');
  });

  const installBtn = document.getElementById('install-app-btn');
  if (installBtn) {
    installBtn.addEventListener('click', async () => {
      if (deferredPrompt) {
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
          deferredPrompt = null;
          installBtn.classList.add('hidden');
        }
      }
    });
  }

  const shareBtn = document.getElementById('share-app-btn');
  if (shareBtn) {
    shareBtn.addEventListener('click', async () => {
      const shareData = {
        title: 'QGHERO - IA Guitar',
        text: '¡Aprende a tocar la guitarra con IA al estilo Guitar Hero!',
        url: window.location.href
      };
      if (navigator.share) {
        try {
          await navigator.share(shareData);
        } catch (err) {}
      } else {
        window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(shareData.text + " " + shareData.url)}`);
      }
    });
  }

  // Main Menu Routing
  document.getElementById('btn-theory-mode').addEventListener('click', () => {
    showScreen('theory');
  });
  document.getElementById('btn-practice-mode').addEventListener('click', () => {
    showScreen('practice');
  });
  document.getElementById('btn-game-mode').addEventListener('click', () => {
    showScreen('setup');
  });

  // Back Buttons
  document.getElementById('back-from-setup-btn').addEventListener('click', () => showScreen('main'));
  document.getElementById('back-from-practice-btn').addEventListener('click', () => showScreen('main'));
  document.getElementById('back-from-theory-btn').addEventListener('click', () => showScreen('main'));

  // Accessibility: Press Enter to submit inputs
  const bindEnterToClick = (inputId, btnId) => {
    const input = document.getElementById(inputId);
    if (input) {
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') document.getElementById(btnId).click();
      });
    }
  };
  bindEnterToClick('groq-api-key', 'save-key-btn');
  bindEnterToClick('song-name', 'load-song-btn');
  bindEnterToClick('youtube-url', 'load-song-btn');
  bindEnterToClick('custom-song-input', 'search-custom-song-btn');

  // Load Song for Game Mode
  document.getElementById('load-song-btn').addEventListener('click', async () => {
    let url = document.getElementById('youtube-url').value.trim();
    let name = document.getElementById('song-name').value.trim();
    
    if (!url && !name) {
      alert("Debes ingresar el nombre de la canción o el enlace de YouTube.");
      return;
    }
    
    document.getElementById('loading-indicator').classList.remove('hidden');

    // Si no hay nombre, lo intentamos sacar del título del video de YT
    if (!name && url) {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 3000);
            const response = await fetch(`https://noembed.com/embed?url=${url}`, { signal: controller.signal });
            clearTimeout(timeoutId);
            const data = await response.json();
            if (data.title) {
                name = data.title;
            } else {
                throw new Error("No title in response");
            }
        } catch (e) {
            alert("No pudimos obtener el nombre del vídeo automáticamente. Por favor, escribe el nombre de la canción a mano en la casilla y dale a '¡A Tocar!'.");
            document.getElementById('loading-indicator').classList.add('hidden');
            return;
        }
        document.getElementById('song-name').value = name; // Update input for feedback
    }

    const videoId = url ? extractVideoId(url) : null;
    if (url && !videoId) {
      alert("Enlace de YouTube inválido.");
      document.getElementById('loading-indicator').classList.add('hidden');
      return;
    }
    
    try {
      currentSongData = await fetchSongData(groqApiKey, name);
      
      // Setup Game UI
      document.getElementById('current-song-title').textContent = currentSongData.title || name;
      gameEngine.loadSong(currentSongData);
      
      if (videoId) {
        initShareButtons(url);
        document.getElementById('youtube-player').style.display = 'block';
        initYouTubePlayer(videoId);
      } else {
        initShareButtons('');
        document.getElementById('youtube-player').style.display = 'none';
        // Arrancar el motor de juego manualmente ya que no hay video que le de al Play
        setTimeout(() => gameEngine.play(), 1000);
      }
      
      // Show Technique Modal before game
      showTechniqueModal(currentSongData);
      
    } catch (err) {
      alert("Error analizando la canción: " + err.message);
    } finally {
      document.getElementById('loading-indicator').classList.add('hidden');
    }
  });

  // Technique Modal
  document.getElementById('close-tech-modal').addEventListener('click', () => {
    stopPreviewSequence();
    isPreviewPlaying = false;
    document.getElementById('preview-audio-btn').textContent = "🔊 Escuchar Pista Sintetizada";
    modals.technique.classList.add('hidden');
  });
  
  document.getElementById('start-game-btn').addEventListener('click', async () => {
    stopPreviewSequence();
    isPreviewPlaying = false;
    document.getElementById('preview-audio-btn').textContent = "🔊 Escuchar Pista Sintetizada";
    modals.technique.classList.add('hidden');
    await initAudio(); // Start audio context on user gesture
    showScreen('game');
    if (ytPlayer && ytPlayer.playVideo) {
      ytPlayer.playVideo();
    }
  });
  
  const expandBtn = document.getElementById('expand-game-song-btn');
  if (expandBtn) {
    expandBtn.addEventListener('click', async () => {
      if (!currentSongData || !currentSongData.notes || currentSongData.notes.length === 0) return;
      expandBtn.disabled = true;
      expandBtn.textContent = "⏳ Escuchando siguientes compases...";
      
      try {
        const latestTime = Math.max(...currentSongData.notes.map(n => n.time));
        const newSongData = await expandGameSong(groqApiKey, currentSongData.title || "Canción", latestTime);
        
        if (newSongData.notes && newSongData.notes.length > 0) {
          currentSongData.notes = currentSongData.notes.concat(newSongData.notes);
          
          if (newSongData.new_schemas && newSongData.new_schemas.length > 0) {
             if (!currentSongData.technique.schema) {
                currentSongData.technique.schema = [];
             } else if (!Array.isArray(currentSongData.technique.schema)) {
                currentSongData.technique.schema = [currentSongData.technique.schema];
             }
             currentSongData.technique.schema = currentSongData.technique.schema.concat(["", "--- Acordes Añadidos ---", ""], newSongData.new_schemas);
             const schemaEl = document.getElementById('tech-schema');
             if (schemaEl) schemaEl.textContent = currentSongData.technique.schema.join('\n');
          }
          
          gameEngine.loadSong(currentSongData);
          alert(`¡Genial! Se han añadido ${newSongData.notes.length} notas/acordes más a la partitura.`);
        }
        expandBtn.disabled = false;
        expandBtn.textContent = "➕ Seguir Aprendiendo (Alargar Canción)";
      } catch (err) {
        expandBtn.disabled = false;
        expandBtn.textContent = "➕ Seguir Aprendiendo (Alargar Canción)";
        if (err.message.includes('429')) {
            const match = err.message.match(/try again in ([\d\.]+)s/);
            const waitTime = match ? Math.ceil(parseFloat(match[1])) : 40;
            alert(`¡Uf! La IA va muy rápido. Por usar la versión gratuita, necesitamos dejarla respirar. Por favor, espera ${waitTime} segundos y vuelve a darle al botón.`);
        } else {
            alert("Error ampliando la canción: " + err.message);
        }
      }
    });
  }
  
  let isPreviewPlaying = false;
  const previewBtn = document.getElementById('preview-audio-btn');
  previewBtn.addEventListener('click', async () => {
    await initAudio();
    if (isPreviewPlaying) {
        stopPreviewSequence();
        isPreviewPlaying = false;
        previewBtn.textContent = "🔊 Escuchar Pista Sintetizada";
        return;
    }

    if (currentSongData && currentSongData.notes && currentSongData.notes.length > 0) {
      isPreviewPlaying = true;
      previewBtn.textContent = "🛑 Detener Pista";
      playPreviewSequence(currentSongData.notes, () => {
          isPreviewPlaying = false;
          previewBtn.textContent = "🔊 Escuchar Pista Sintetizada";
      });
    }
  });

  // Game specific
  gameEngine.onNoteHit = (note) => {
    document.getElementById('current-note-latin').textContent = note.latin;
    document.getElementById('current-note-anglo').textContent = note.anglo;
  };
  
  gameEngine.onManualHit = async (note) => {
    await initAudio();
    const octave = note.string < 4 ? "4" : "3";
    const pitch = (note.anglo || 'C') + octave;
    playNote(pitch, 0, "8n");
  };

  document.getElementById('back-to-menu-btn').addEventListener('click', () => {
    stopPreviewSequence();
    if (ytPlayer && ytPlayer.pauseVideo) ytPlayer.pauseVideo();
    gameEngine.stop();
    showScreen('main');
  });

  const speedSlider = document.getElementById('speed-slider');
  speedSlider.addEventListener('input', (e) => {
    const rate = parseFloat(e.target.value);
    document.getElementById('speed-value').textContent = rate.toFixed(2) + 'x';
    if (ytPlayer && ytPlayer.setPlaybackRate) ytPlayer.setPlaybackRate(rate);
    gameEngine.playbackRate = rate;
  });
  document.getElementById('rewind-btn').addEventListener('click', () => {
    const newTime = Math.max(0, gameEngine.currentTime - 10);
    if (ytPlayer && ytPlayer.seekTo) ytPlayer.seekTo(newTime, true);
    gameEngine.updateTime(newTime, gameEngine.playbackRate);
  });
  document.getElementById('forward-btn').addEventListener('click', () => {
    const newTime = gameEngine.currentTime + 10;
    if (ytPlayer && ytPlayer.seekTo) ytPlayer.seekTo(newTime, true);
    gameEngine.updateTime(newTime, gameEngine.playbackRate);
  });

  const timeSlider = document.getElementById('time-slider');
  timeSlider.addEventListener('input', (e) => {
      const targetTime = parseFloat(e.target.value);
      if (ytPlayer && ytPlayer.seekTo) ytPlayer.seekTo(targetTime, true);
      gameEngine.updateTime(targetTime, gameEngine.playbackRate);
  });

  const playPauseBtn = document.getElementById('play-pause-btn');
  playPauseBtn.addEventListener('click', () => {
      if (ytPlayer && ytPlayer.getPlayerState) {
          const state = ytPlayer.getPlayerState();
          if (state === window.YT.PlayerState.PLAYING) ytPlayer.pauseVideo();
          else ytPlayer.playVideo();
      } else {
          if (gameEngine.isPlaying) gameEngine.stop();
          else gameEngine.start();
      }
  });
}

function showTechniqueModal(data) {
  document.getElementById('tech-song-title').textContent = data.title;
  
  const tech = data.technique || {};
  document.getElementById('tech-hands').textContent = tech.hands || "Posición estándar.";
  document.getElementById('tech-rhythm').textContent = tech.rhythm || "Ritmo básico.";
  document.getElementById('tech-effects').textContent = tech.effects || "Ninguno.";
  
  const schemaEl = document.getElementById('tech-schema');
  if (tech.schema) {
    schemaEl.textContent = Array.isArray(tech.schema) ? tech.schema.join('\n') : tech.schema;
    schemaEl.classList.remove('hidden');
  } else {
    schemaEl.classList.add('hidden');
  }
  
  modals.technique.classList.remove('hidden');
}

function extractVideoId(url) {
  const match = url.match(/^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/);
  return (match && match[2].length === 11) ? match[2] : null;
}

function initYouTubePlayer(videoId) {
  if (ytPlayer && ytPlayer.loadVideoById) {
    ytPlayer.loadVideoById(videoId);
    ytPlayer.pauseVideo();
    return;
  }
  if (window.YT && window.YT.Player) {
    createPlayer(videoId);
  } else {
    window.onYouTubeIframeAPIReady = () => createPlayer(videoId);
  }
}

function createPlayer(videoId) {
  ytPlayer = new window.YT.Player('youtube-player', {
    height: '100', width: '100', videoId: videoId,
    playerVars: { 'playsinline': 1, 'controls': 0, 'disablekb': 1 },
    events: {
      'onReady': (e) => {}, 
      'onStateChange': (e) => {
        if (e.data == window.YT.PlayerState.PLAYING) gameEngine.start();
        else if (e.data == window.YT.PlayerState.PAUSED || e.data == window.YT.PlayerState.ENDED) gameEngine.stop();
      }
    }
  });
  
  setInterval(() => {
    if (ytPlayer && ytPlayer.getCurrentTime && gameEngine.isPlaying) {
      gameEngine.updateTime(ytPlayer.getCurrentTime(), ytPlayer.getPlaybackRate());
    }

    // Update Time Slider UI regardless of playback state
    const timeSlider = document.getElementById('time-slider');
    const timeDisplay = document.getElementById('time-display');
    const playPauseBtn = document.getElementById('play-pause-btn');
    if (timeSlider && timeDisplay) {
        let maxTime = 100;
        if (ytPlayer && ytPlayer.getDuration && ytPlayer.getDuration() > 0) {
            maxTime = ytPlayer.getDuration();
        } else if (currentSongData && currentSongData.notes && currentSongData.notes.length > 0) {
            maxTime = Math.max(...currentSongData.notes.map(n => n.time)) + 5;
        }
        timeSlider.max = maxTime;
        // Solo actualizar el valor visual si el usuario NO lo está arrastrando en este milisegundo (evita saltos)
        if (document.activeElement !== timeSlider) {
            timeSlider.value = gameEngine.currentTime;
        }
        
        const mins = Math.floor(gameEngine.currentTime / 60);
        const secs = Math.floor(gameEngine.currentTime % 60).toString().padStart(2, '0');
        timeDisplay.textContent = `${mins}:${secs}`;
    }
    
    // Update Play/Pause UI state
    if (playPauseBtn) {
        playPauseBtn.textContent = gameEngine.isPlaying ? '⏸️' : '▶️';
    }
  }, 100);
}

initApp();
