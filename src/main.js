// Estilos cargados en index.html
import { fetchSongData, expandGameSong } from './groqApi.js';
import { GameEngine } from './gameEngine.js';
import { initShareButtons } from './share.js';
import { initPracticeMode } from './practiceMode.js';
import { initTheoryMode } from './theoryMode.js';
import { initAudio, strumChord, playNote } from './audioSynth.js';

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
  const sharedUrl = urlParams.get('url') || urlParams.get('text');
  if (sharedUrl && sharedUrl.includes('youtu')) {
    showScreen('game', true);
    document.getElementById('youtube-url').value = sharedUrl;
    // Quitamos los query params para no re-ejecutar al recargar
    window.history.replaceState({}, document.title, window.location.pathname);
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
            const response = await fetch(`https://noembed.com/embed?url=${url}`);
            const data = await response.json();
            if (data.title) {
                name = data.title;
            } else {
                name = "Canción desconocida";
            }
        } catch (e) {
            name = "Canción personalizada";
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
    modals.technique.classList.add('hidden');
  });
  
  document.getElementById('start-game-btn').addEventListener('click', async () => {
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
          gameEngine.loadSong(currentSongData);
          alert(`¡Genial! Se han añadido ${newSongData.notes.length} notas/acordes más a la partitura.`);
        }
      } catch (err) {
        alert("Error ampliando la canción: " + err.message);
      } finally {
        expandBtn.disabled = false;
        expandBtn.textContent = "➕ Seguir Aprendiendo (Alargar Canción)";
      }
    });
  }
  
  document.getElementById('preview-audio-btn').addEventListener('click', async () => {
    await initAudio();
    if (currentSongData && currentSongData.notes && currentSongData.notes.length > 0) {
      currentSongData.notes.forEach(n => {
        const octave = n.string < 4 ? "4" : "3";
        const pitch = (n.anglo || 'C') + octave;
        playNote(pitch, n.time, "8n");
      });
    }
  });

  // Game specific
  gameEngine.onNoteHit = (note) => {
    document.getElementById('current-note-latin').textContent = note.latin;
    document.getElementById('current-note-anglo').textContent = note.anglo;
  };

  document.getElementById('back-to-menu-btn').addEventListener('click', () => {
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
    if (ytPlayer && ytPlayer.getCurrentTime) ytPlayer.seekTo(ytPlayer.getCurrentTime() - 10, true);
  });
  document.getElementById('forward-btn').addEventListener('click', () => {
    if (ytPlayer && ytPlayer.getCurrentTime) ytPlayer.seekTo(ytPlayer.getCurrentTime() + 10, true);
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
    schemaEl.textContent = tech.schema;
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
  }, 100);
}

initApp();
