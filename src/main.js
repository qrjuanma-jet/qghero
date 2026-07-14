// Estilos cargados en index.html
import { fetchSongData } from './groqApi.js';
import { GameEngine } from './gameEngine.js';
import { initShareButtons } from './share.js';
import { initPracticeMode } from './practiceMode.js';
import { initTheoryMode } from './theoryMode.js';
import { initAudio, strumChord } from './audioSynth.js';

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

function showScreen(screenName) {
  Object.values(screens).forEach(s => {
    s.classList.remove('active');
    s.classList.add('hidden');
  });
  screens[screenName].classList.remove('hidden');
  screens[screenName].classList.add('active');
}

function getApiKey() {
  return groqApiKey;
}

function initApp() {
  gameEngine = new GameEngine('game-canvas');
  initShareButtons('');
  initPracticeMode(getApiKey);
  initTheoryMode(getApiKey);
  
  if (groqApiKey) {
    showScreen('main');
  } else {
    showScreen('login');
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
    const url = document.getElementById('youtube-url').value.trim();
    const name = document.getElementById('song-name').value.trim();
    
    if (!url || !name) {
      alert("Ingresa el link y el nombre de la canción.");
      return;
    }
    const videoId = extractVideoId(url);
    if (!videoId) {
      alert("Link inválido.");
      return;
    }

    document.getElementById('loading-indicator').classList.remove('hidden');
    
    try {
      currentSongData = await fetchSongData(groqApiKey, name);
      
      // Setup Game UI
      document.getElementById('current-song-title').textContent = currentSongData.title || name;
      gameEngine.loadSong(currentSongData);
      initShareButtons(url);
      initYouTubePlayer(videoId);
      
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
  
  document.getElementById('preview-audio-btn').addEventListener('click', async () => {
    await initAudio();
    if (currentSongData && currentSongData.notes && currentSongData.notes.length > 0) {
      strumChord(["E3", "A3", "D4"], 0.1); 
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
