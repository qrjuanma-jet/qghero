// Estilos cargados en index.html
import { fetchSongData, expandGameSong } from './groqApi.js';
import { enrichSongData, enrichNotesWithChordDb, lookupChord } from './chordDb.js';
import { GameEngine } from './gameEngine.js';
import { initShareButtons } from './share.js';
import { initPracticeMode } from './practiceMode.js';
import { initTheoryMode } from './theoryMode.js';
import { initDictionaryMode } from './dictionaryMode.js';
import { initAudio, strumChord, playNote, playPreviewSequence, stopPreviewSequence, startRhythm, stopRhythm } from './audioSynth.js';
import { buildMiniFretboard } from './chordUI.js';
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js').catch(err => console.log('SW reg error:', err));
  });
}

window.onerror = function(msg, url, line, col, error) {
   alert("Global Error: " + msg + "\nLine: " + line);
   return false;
};

window.addEventListener('unhandledrejection', function(event) {
  alert("Unhandled Promise Rejection: " + event.reason);
});

// App State
let groqApiKey = localStorage.getItem('qghero_groq_key') || '';
let currentSongData = null;
let ytPlayer = null;
let isYoutubeReady = false;
let pendingYoutubePlay = false;
let gameEngine = null;

const screens = {
  login: document.getElementById('login-screen'),
  main: document.getElementById('main-screen'),
  setup: document.getElementById('game-setup-screen'),
  practice: document.getElementById('practice-screen'),
  theory: document.getElementById('theory-screen'),
  game: document.getElementById('game-screen'),
  dictionary: document.getElementById('dictionary-screen')
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
    document.getElementById('song-input').value = sharedUrl;
    
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
  try {
  gameEngine = new GameEngine();
  initShareButtons('');
  initPracticeMode(getApiKey);
  initTheoryMode(getApiKey);
  initDictionaryMode(getApiKey);
  
  if (groqApiKey) {
    showScreen('main', false);
    checkSharedUrl();
    renderSavedSongs();
  }
  
  // Event listeners para la tasa de límite de Groq (Rate Limit)
  window.addEventListener('ai-waiting', (e) => {
    const loadingText = document.getElementById('loading-indicator');
    if (loadingText && !loadingText.classList.contains('hidden')) {
       const span = loadingText.querySelector('span');
       if (span) span.textContent = `Pausando por límite de la IA... (${Math.round(e.detail.waitMs/1000)}s)`;
    }
    const statusEl = document.getElementById('auto-expand-status');
    if (statusEl) {
       statusEl.textContent = `⏳ Límite de IA alcanzado... Esperando ${Math.round(e.detail.waitMs/1000)}s`;
    }
  });
  window.addEventListener('ai-resumed', () => {
    const loadingText = document.getElementById('loading-indicator');
    if (loadingText && !loadingText.classList.contains('hidden')) {
       const span = loadingText.querySelector('span');
       if (span) span.textContent = 'Analizando canción con IA...';
    }
    const statusEl = document.getElementById('auto-expand-status');
    if (statusEl) {
       statusEl.textContent = `⚙️ IA reanudada, generando esquemas...`;
    }
  });

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
  } catch(e) {
    alert("Error en initApp: " + e.stack);
  }
}

function setupEventListeners() {
  const helpContents = {
      main: `
          <h3>Bienvenido a QGHERO</h3>
          <p>Esta aplicación te ayuda a aprender guitarra usando Inteligencia Artificial. Tienes 4 secciones principales:</p>
          <ul>
              <li><strong>Modo Teoría:</strong> Genera clases magistrales según tu nivel con viñetas de acordes generadas de forma autónoma.</li>
              <li><strong>Modo Práctica:</strong> Selecciona un estilo musical (Rock, Pop, Clásico, etc.) y la IA te enseñará de forma progresiva.</li>
              <li><strong>Buscador de Acordes:</strong> Usa tu voz o teclado para pedirle un acorde en lenguaje natural y la IA te lo dibujará al instante.</li>
              <li><strong>Modo Juego:</strong> El modo principal. Pega un enlace de YouTube y toca la canción al estilo Guitar Hero sincronizado con el vídeo.</li>
          </ul>`,
      theory: `
          <h3>Modo Teoría</h3>
          <p>Aquí la IA actúa como tu profesor particular.</p>
          <p>Usa los botones de nivel para generar una clase magistral desde cero. Si quieres profundizar en el mismo tema sin repetir conceptos, usa el botón "Avanzar Temario".</p>
          <p><strong>Novedad - Ritmos y Orquesta:</strong> Ahora la IA te enseñará <strong>patrones de rasgueo</strong> detallados para cada progresión y te dará consejos clave sobre cómo tocar en <strong>Orquesta o Banda</strong> (seguir el tempo, escuchar a la batería/bajo, o leer al director).</p>
          <p><strong>Las Viñetas Gráficas:</strong><br>La IA dibujará tanto <strong>Acordes Completos</strong> como <strong>Punteos (Notas Sueltas)</strong>. Las líneas horizontales son las cuerdas (arriba la más fina, abajo la más gruesa) y las verticales son los trastes. El número romano te indica dónde colocar la mano. El punto brillante indica el número del dedo a utilizar.</p>
          <p>Si la IA menciona un acorde complejo o un traste específico para un punteo, nuestro nuevo <strong>Motor Algorítmico Universal</strong> calculará en tiempo real la postura más cómoda basándose puramente en matemáticas e intervalos musicales.</p>`,
      practice: `
          <h3>Modo Práctica</h3>
          <p>Selecciona un estilo musical en la barra lateral para recibir una lección enfocada en ese género. Soporta estilos desde Rock y Pop, hasta acordes de jazz y arpegios de música Clásica.</p>
          <p>Cada vez que dominas un nivel, pulsa "Subir de Nivel" para que la IA genere progresiones y acordes más complejos. Nuestro motor inteligente dibujará automáticamente cualquier acorde que la IA decida enseñarte.</p>`,
      dictionary: `
          <h3>Buscador Inteligente de Acordes</h3>
          <p>Esta sección usa el motor de procesamiento natural de la IA para entender tus dudas musicales.</p>
          <ul>
              <li><strong>Búsqueda por Voz (🎤):</strong> Haz clic en el micrófono, dale permiso en tu navegador y di algo como <em>"Enséñame el Do Mayor séptima"</em> o <em>"Cómo se toca el Hendrix Chord"</em>.</li>
              <li><strong>Búsqueda por Texto:</strong> Puedes escribir en lenguaje natural, como <em>"acorde triste de Mi"</em> o <em>"F#m7"</em>.</li>
              <li><strong>Orquesta/Ritmos:</strong> Ahora puedes preguntar cómo tocar un acorde en un contexto de orquesta o banda, y la IA te dará consejos sobre qué inversiones usar para no chocar con el bajo o el piano.</li>
          </ul>
          <p>La IA extraerá el acorde y el <strong>Motor Geométrico</strong> lo construirá matemáticamente desde cero, encontrando la postura más ergonómica en el mástil y generando el audio sintetizado al vuelo.</p>`,
      setup: `
          <h3>Configurar Partida</h3>
          <p>Tienes dos formas de jugar:</p>
          <ul>
              <li><strong>Buscar por Nombre:</strong> Escribe "Smells Like Teen Spirit" y la IA deducirá los acordes (sonará con audio sintetizado interno). Si luego le das a buscar en YouTube, la app copiará automáticamente el nombre en el portapapeles de tu móvil para que solo tengas que pegarlo en el buscador de YouTube.</li>
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
          <h4>Nuevos Controles (Diapasón/Ritmo)</h4>
          <ul>
              <li><strong>🎵 Ritmo/Diapasón:</strong> Selecciona un patrón rítmico (Balada, Vals, Rock) o un simple clic de metrónomo. Empezará a sonar sincronizado con el tempo de la canción para ayudarte a "tocar al ritmo real" en lugar de hacer rasgueos al aire.</li>
          </ul>
          <h4>Controles Básicos</h4>
          <ul>
              <li><strong>▶️ / ⏸:</strong> Pausa o reanuda la canción/juego.</li>
              <li><strong>Deslizador:</strong> Muévelo para rebobinar o adelantar a una parte específica de la canción.</li>
              <li><strong>Velocidad:</strong> Reduce la velocidad a 0.5x si la canción va demasiado rápido para ti.</li>
          </ul>`,
      technique: `
          <h3>¿Cómo leer esta pantalla?</h3>
          <p>Aquí la IA te muestra los acordes y técnicas que necesitas antes de empezar a jugar. Vamos por partes:</p>

          <h4>🔍 ¿Cómo sé que la IA ha reconocido bien la canción?</h4>
          <p>La caja azul de <strong>Ritmo / Punteo</strong> y <strong>Efectos</strong> es la "huella digital" de la canción. Léela primero:</p>
          <ul>
              <li><strong>Ritmo:</strong> ¿Dice algo parecido al patrón que conoces? (ej: "rasgueo hacia abajo en negras", "arpegio p-i-m-a"). Si suena razonable para esa canción, la IA la ha identificado bien.</li>
              <li><strong>Efectos:</strong> ¿Menciona el estilo característico? (ej: "Power chords con distorsión", "punteo limpio fingerpicking"). Esto confirma que la IA conoce la canción.</li>
              <li>Si el ritmo o los efectos no tienen nada que ver, prueba a buscar con más detalle: "artista - nombre de la canción".</li>
          </ul>

          <h4>📊 El Esquema de Acorde y Punteo (Viñeta Gráfica)</h4>
          <p>Cada caja gráfica es una "foto" del mástil de tu guitarra. Las líneas <strong>horizontales</strong> indican las cuerdas (la más fina arriba, la más gruesa abajo), y las <strong>verticales</strong> separan los trastes.</p>
          <p>El número romano arriba de los trastes (ej. Ⅰ, Ⅴ) te indica en qué traste base debes colocar la mano.</p>
          <ul>
              <li><strong>O (cyan):</strong> cuerda <em>al aire</em> (suénala sin pisar ningún traste).</li>
              <li><strong>X (rojo):</strong> cuerda <em>silenciada</em> (no la toques, apágala con algún dedo).</li>
              <li><strong>1, 2, 3, 4:</strong> el <em>dedo</em> que debes usar para los acordes.</li>
              <li><strong>Punteos:</strong> Si ves un solo punto en todo el esquema, significa que es una nota melódica suelta que debes tocar individualmente.</li>
          </ul>

          <h4>🤚 ¿Qué es una Cejilla?</h4>
          <p>Una <strong>cejilla</strong> es cuando usas el dedo índice (dedo 1) para presionar <em>todas</em> las cuerdas en un mismo traste a la vez. En los esquemas verás el número 1 repetido verticalmente en varias cuerdas.</p>

          <h4>🎵 Mapa Cronológico</h4>
          <p>El mapa muestra todos los acordes y melodías sueltas en el orden <em>exacto</em> en que suenan en la canción. La primera vez que aparece un acorde se dibuja su esquema completo. Si se repite, aparece su nombre en diminuto. El mapa va creciendo automáticamente mientras la IA analiza la canción.</p>

          <h4>🔊 Botones de esta pantalla</h4>
          <ul>
              <li><strong>🔊 Escuchar (Viñeta):</strong> Reproduce un acorde o un punteo para que escuches su sonoridad aislada.</li>
              <li><strong>Escuchar Pista Sintetizada:</strong> Reproduce en orden todo el mapa cronológico.</li>
              <li><strong>➕ Seguir Aprendiendo:</strong> Fuerza a la IA a seguir escuchando y añadiendo música a la lista.</li>
              <li><strong>▶️ Iniciar Juego:</strong> ¡Empieza a tocar!</li>
          </ul>`,
      score: `
          <h3>¿Cómo leer la partitura / tablatura?</h3>
          <p>Esta es una tablatura de guitarra (tab) generada automáticamente por la IA a partir de las notas de la canción.</p>
          <ul style="margin-bottom: 1rem;">
              <li><strong>Las 6 líneas horizontales:</strong> Representan las cuerdas de la guitarra. La línea de arriba es la primera cuerda (e, la más fina), y la de abajo es la sexta (E, la más gruesa).</li>
              <li><strong>Los números (en azul):</strong> Indican en qué <strong>traste</strong> debes poner el dedo en esa cuerda específica. Si hay varios números apilados en la misma vertical, se tocan a la vez (es un acorde).</li>
              <li><strong>Nombre del acorde (en rosa):</strong> Aparece arriba de cada columna de notas indicando el nombre del acorde que estás tocando (ej: Am, G).</li>
              <li><strong>Guiones (–):</strong> Significan que esa cuerda no se toca en ese momento.</li>
          </ul>
          <h4>Controles del visor</h4>
          <ul>
              <li><strong>⬅️ / ➡️:</strong> Pasa a la página anterior o siguiente de la partitura.</li>
              <li><strong>▶️ Auto:</strong> Activa el avance automático para que puedas tocar sin usar las manos.</li>
          </ul>`,
      dictionary: `
          <h3>Buscador de Acordes IA</h3>
          <p>Esta herramienta te permite buscar cualquier acorde usando lenguaje natural. La inteligencia artificial lo entenderá y te mostrará cómo tocarlo.</p>
          <ul>
              <li><strong>Búsqueda Flexible:</strong> Puedes escribir "Do mayor", "Cmaj7", o incluso "el acorde triste de Mi". La IA deducirá a qué te refieres.</li>
              <li><strong>Viñeta Gráfica:</strong> Te mostrará la posición exacta de los dedos (1, 2, 3, 4), las cuerdas al aire (O), y las que no se tocan (X).</li>
              <li><strong>Consejos de la IA:</strong> Al buscar un acorde, la IA generará en tiempo real un pequeño consejo o truco para ayudarte a colocar mejor la mano.</li>
              <li><strong>Voz:</strong> Usa el botón de micrófono para pedir el acorde hablando, ideal cuando tienes la guitarra en las manos.</li>
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

  const linkPrivacy = document.getElementById('link-privacy');
  if (linkPrivacy) {
    linkPrivacy.addEventListener('click', (e) => {
      e.preventDefault();
      helpTitle.textContent = "Política de Privacidad";
      helpContent.innerHTML = "<p>En QGHERO respetamos tu privacidad. Esta aplicación funciona de manera completamente local en tu navegador. Tu API Key de Groq se guarda exclusivamente en el almacenamiento interno de tu dispositivo y nunca es enviada a nuestros servidores. Las únicas conexiones externas son hacia la API de Groq para generar el contenido musical con IA y hacia YouTube para la reproducción de los vídeos del Modo Juego.</p>";
      helpModal.classList.remove('hidden');
    });
  }

  const linkTerms = document.getElementById('link-terms');
  if (linkTerms) {
    linkTerms.addEventListener('click', (e) => {
      e.preventDefault();
      helpTitle.textContent = "Términos de Uso";
      helpContent.innerHTML = "<p>QGHERO es una aplicación educativa diseñada para aprender guitarra de forma interactiva e impulsada por Inteligencia Artificial. Al utilizarla, aceptas que el contenido generado (acordes, lecciones, técnicas, tablaturas) se proporciona \"tal cual\" y es fruto de modelos probabilísticos, por lo que podría no ser exacto en el 100% de las canciones. QGHERO no se hace responsable del uso de los vídeos incrustados, los cuales son mostrados a través de la API pública y oficial de YouTube bajo sus propios términos de servicio.</p>";
      helpModal.classList.remove('hidden');
    });
  }

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
  const dictBtn = document.getElementById('btn-dictionary-mode');
  if (dictBtn) {
    dictBtn.addEventListener('click', () => {
      showScreen('dictionary');
    });
  }

  // Back Buttons
  document.getElementById('back-from-setup-btn').addEventListener('click', () => showScreen('main'));
  document.getElementById('back-from-practice-btn').addEventListener('click', () => showScreen('main'));
  document.getElementById('back-from-theory-btn').addEventListener('click', () => showScreen('main'));
  const backFromDictBtn = document.getElementById('back-from-dictionary-btn');
  if (backFromDictBtn) backFromDictBtn.addEventListener('click', () => showScreen('main'));

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
  bindEnterToClick('song-input', 'load-song-btn');
  bindEnterToClick('custom-song-input', 'search-custom-song-btn');

  // Load Song for Game Mode
  document.getElementById('load-song-btn').addEventListener('click', async () => {
    const rawInput = document.getElementById('song-input').value.trim();
    
    if (!rawInput) {
      alert("Escribe el nombre de una canción o pega un enlace de YouTube.");
      return;
    }

    // Smart detection: is it a YouTube URL?
    const isYouTubeUrl = rawInput.includes('youtube.com') || rawInput.includes('youtu.be');
    let url = isYouTubeUrl ? rawInput : '';
    let name = isYouTubeUrl ? '' : rawInput;
    
    document.getElementById('loading-indicator').classList.remove('hidden');

    // Si es URL de YT, intentar obtener el nombre del vídeo con varios métodos
    if (isYouTubeUrl) {
        const videoId = extractVideoId(url);
        
        // Método 1: noembed.com
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 3000);
            const response = await fetch(`https://noembed.com/embed?url=${encodeURIComponent(url)}`, { signal: controller.signal });
            clearTimeout(timeoutId);
            const data = await response.json();
            if (data.title) name = data.title;
        } catch (e) { /* Falló, prueba siguiente */ }

        // Método 2: YouTube oEmbed API oficial
        if (!name && videoId) {
            try {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 3000);
                const response = await fetch(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`, { signal: controller.signal });
                clearTimeout(timeoutId);
                const data = await response.json();
                if (data.title) name = data.title;
            } catch (e) { /* Falló, prueba siguiente */ }
        }

        // Método 3: Usar el ID del vídeo como nombre genérico — nunca preguntar al usuario
        if (!name) {
            name = videoId ? `Canción de YouTube (${videoId})` : "Canción de YouTube";
        }
    }

    const videoId = url ? extractVideoId(url) : null;
    if (url && !videoId) {
      alert("Enlace de YouTube inválido.");
      document.getElementById('loading-indicator').classList.add('hidden');
      return;
    }
    
    try {
      currentSongData = await fetchSongData(groqApiKey, name);
      // Enriquecer con la base de datos de acordes verificados
      currentSongData = enrichSongData(currentSongData);
      
      // Setup Game UI
      document.getElementById('current-song-title').textContent = currentSongData.title || name;
      gameEngine.loadSong(currentSongData);
      
      if (videoId) {
        currentSongData.originalVideoId = videoId;
        initShareButtons(url);
        document.getElementById('youtube-player').style.display = 'block';
        initYouTubePlayer(videoId);
        showTechniqueModal(currentSongData);
      } else {
        // Show YouTube prompt modal
        const ytInput = document.getElementById('youtube-prompt-input');
        if (ytInput) ytInput.value = '';
        document.getElementById('youtube-prompt-modal').classList.remove('hidden');
      }
      
    } catch (err) {
      alert("Error analizando la canción: " + err.message);
    } finally {
      document.getElementById('loading-indicator').classList.add('hidden');
    }
  });
  // YouTube Prompt Modal Logic
  document.getElementById('youtube-prompt-search-btn').addEventListener('click', async () => {
    const songName = currentSongData ? (currentSongData.title || document.getElementById('current-song-title').textContent) : "";
    if (songName) {
      try {
        await navigator.clipboard.writeText(songName);
      } catch (err) {
        console.warn("No se pudo copiar al portapapeles:", err);
      }
      window.open(`https://www.youtube.com/results?search_query=${encodeURIComponent(songName)}`, '_blank');
    }
  });
  document.getElementById('youtube-prompt-skip-btn').addEventListener('click', () => {
    document.getElementById('youtube-prompt-modal').classList.add('hidden');
    initShareButtons('');
    document.getElementById('youtube-player').style.display = 'none';
    setTimeout(() => gameEngine.play(), 1000);
    showTechniqueModal(currentSongData);
  });

  document.getElementById('youtube-prompt-save-btn').addEventListener('click', () => {
    const yUrl = document.getElementById('youtube-prompt-input').value.trim();
    document.getElementById('youtube-prompt-modal').classList.add('hidden');
    
    if (yUrl) {
      const vId = extractVideoId(yUrl);
      if (vId) {
        currentSongData.originalVideoId = vId;
        initShareButtons(yUrl);
        document.getElementById('youtube-player').style.display = 'block';
        initYouTubePlayer(vId);
      } else {
        alert("Enlace inválido, se jugará en silencio.");
        initShareButtons('');
        document.getElementById('youtube-player').style.display = 'none';
        setTimeout(() => gameEngine.play(), 1000);
      }
    } else {
      initShareButtons('');
      document.getElementById('youtube-player').style.display = 'none';
      setTimeout(() => gameEngine.play(), 1000);
    }
    
    showTechniqueModal(currentSongData);
  });

  // Technique Modal
  document.getElementById('close-tech-modal').addEventListener('click', () => {
    autoExpandRunning = false; // Stop background expansion
    stopPreviewSequence();
    isPreviewPlaying = false;
    document.getElementById('preview-audio-btn').textContent = "🔊 Escuchar Pista Sintetizada";
    modals.technique.classList.add('hidden');
  });
  
  document.getElementById('start-game-btn').addEventListener('click', async () => {
    autoExpandRunning = false; // Stop background expansion
    stopPreviewSequence();
    isPreviewPlaying = false;
    document.getElementById('preview-audio-btn').textContent = "🔊 Escuchar Pista Sintetizada";
    modals.technique.classList.add('hidden');
    await initAudio(); // Start audio context on user gesture
    showScreen('game');
    if (ytPlayer && currentSongData.originalVideoId) {
      if (isYoutubeReady && ytPlayer.playVideo) {
        ytPlayer.playVideo();
      } else {
        pendingYoutubePlay = true;
      }
    } else {
      gameEngine.play();
    }
  });
  

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
      
      const styleHint = (currentSongData.technique.effects || "") + " " + (currentSongData.technique.rhythm || "");

      playPreviewSequence(currentSongData.notes, () => {
          isPreviewPlaying = false;
          previewBtn.textContent = "🔊 Escuchar Pista Sintetizada";
      }, styleHint);
    }
  });

  // Game specific
  const songTipsBtn = document.getElementById('song-tips-btn');
  if (songTipsBtn) {
    songTipsBtn.addEventListener('click', () => {
      showTechniqueModal(currentSongData);
    });
  }
  
  gameEngine.onTimeJump = (targetTime) => {
      if (ytPlayer && ytPlayer.seekTo) ytPlayer.seekTo(targetTime, true);
  };

  document.getElementById('back-to-menu-btn').addEventListener('click', () => {
    stopPreviewSequence();
    if (ytPlayer && ytPlayer.pauseVideo) ytPlayer.pauseVideo();
    gameEngine.stop();
    showScreen('main');
  });

  const speedSlider = document.getElementById('speed-slider');
  const rhythmSelect = document.getElementById('rhythm-select');
  const ytAudioToggle = document.getElementById('yt-audio-toggle');

  if (ytAudioToggle) {
      ytAudioToggle.addEventListener('change', (e) => {
          if (ytPlayer && ytPlayer.mute && ytPlayer.unMute) {
              if (e.target.checked) ytPlayer.unMute();
              else ytPlayer.mute();
          }
      });
  }

  function syncRhythm() {
      if (!gameEngine.isPlaying) return;
      const bpm = 100 * gameEngine.playbackRate;
      const pattern = rhythmSelect ? rhythmSelect.value : 'none';
      if (pattern !== 'none') {
          startRhythm(pattern, bpm);
      } else {
          stopRhythm();
      }
  }

  if (rhythmSelect) {
      rhythmSelect.addEventListener('change', () => {
          syncRhythm();
      });
  }

  speedSlider.addEventListener('input', (e) => {
    const rate = parseFloat(e.target.value);
    document.getElementById('speed-value').textContent = rate.toFixed(2) + 'x';
    if (ytPlayer && ytPlayer.setPlaybackRate) ytPlayer.setPlaybackRate(rate);
    gameEngine.playbackRate = rate;
    if (gameEngine.isPlaying && rhythmSelect && rhythmSelect.value !== 'none') {
        syncRhythm();
    }
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
          if (gameEngine.isPlaying) {
              gameEngine.stop();
              stopRhythm();
          } else {
              gameEngine.start();
              syncRhythm();
          }
      }
  });
}

/**
 * Parses the raw schema array from the LLM into a map of {chordKey → [asciiLines]}
 * Chord keys are derived from the first line of each block (e.g. "La menor (Am)")
 */
function parseSchemaBlocks(rawSchemaArray) {
  if (!rawSchemaArray || !Array.isArray(rawSchemaArray)) return {};
  const blocks = {};
  let currentKey = null;
  let currentLines = [];

  for (const line of rawSchemaArray) {
    // A line ending with ':' or containing '(' is likely a chord name header
    const isHeader = typeof line === 'string' && line.trim().length > 0 &&
                     !line.startsWith('TS') && !line.startsWith('E ') &&
                     !line.startsWith('B ') && !line.startsWith('G ') &&
                     !line.startsWith('D ') && !line.startsWith('A ') &&
                     !line.includes('|') && !line.includes('---') &&
                     (line.includes('(') || line.endsWith(':'));

    if (isHeader) {
      if (currentKey && currentLines.length > 0) {
        blocks[currentKey] = currentLines;
      }
      // Normalize key: extract content in parentheses as secondary key
      currentKey = line.trim().replace(/:$/, '');
      currentLines = [line.trim()];
    } else if (currentKey) {
      if (line !== undefined) currentLines.push(line);
    }
  }
  // Push last block
  if (currentKey && currentLines.length > 0) {
    blocks[currentKey] = currentLines;
  }
  return blocks;
}

function getPitchFromStringFret(stringNum, fretNum) {
  const openPitches = ["E4", "B3", "G3", "D3", "A2", "E2"];
  const notesStr = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
  const openPitch = openPitches[stringNum - 1]; 
  if (!openPitch) return "E2";
  if (fretNum === 'X' || fretNum < 0) return null;
  const baseNote = openPitch.slice(0, -1);
  const baseOctave = parseInt(openPitch.slice(-1));
  let baseIndex = notesStr.indexOf(baseNote);
  let finalIndex = baseIndex + fretNum;
  let finalOctave = baseOctave + Math.floor(finalIndex / 12);
  finalIndex = finalIndex % 12;
  return `${notesStr[finalIndex]}${finalOctave}`;
}

/**
 * Builds a chronological schema display using visual viñetas instead of ASCII art.
 */
function renderChronologicalViñetas(notes, container) {
  if (!notes || notes.length === 0) return;

  const shownChords = new Set();
  let lastChordKey = null;
  
  // Para que se vean como en Teoría, los ponemos en columna con un ancho máximo
  container.style.display = 'flex';
  container.style.flexDirection = 'column';
  container.style.alignItems = 'center';
  container.style.gap = '2rem';

  for (const note of notes) {
    let chordName = "";
    let isPunteo = !!note.single_note;
    
    if (isPunteo) {
      chordName = `Punteo (Cuerda ${note.single_note.string}, Traste ${note.single_note.fret})`;
    } else {
      const fallbackName = note.name || note.chord || note.acorde;
      chordName = (note.latin && note.anglo) 
        ? `${note.latin} (${note.anglo})` 
        : (note.latin || note.anglo || fallbackName);

      if (!chordName) chordName = "DEBUG: " + JSON.stringify(note);
    }

    if (chordName === lastChordKey) continue;
    lastChordKey = chordName;

    const card = document.createElement('div');
    card.className = 'theory-chord-card';
    card.style.width = '100%';
    card.style.maxWidth = '500px'; 
    card.style.background = 'rgba(255, 255, 255, 0.03)';
    card.style.border = '1px solid rgba(0, 229, 255, 0.2)';
    card.style.borderRadius = '12px';
    card.style.padding = '1.5rem';
    card.style.textAlign = 'center';

    if (shownChords.has(chordName)) {
      card.innerHTML = `<h5 style="margin:0; color:var(--text-secondary); font-size:1.2rem;">↩️ ${chordName} (Repetición)</h5>`;
      card.style.padding = '1rem';
    } else {
      shownChords.add(chordName);
      card.innerHTML = `<h3 style="margin-top:0; margin-bottom:1rem; color:var(--neon-cyan);">${chordName}</h3>`;
      
      let fb = null;
      let playableNotes = null;

      if (isPunteo) {
        // Usa la misma lógica visual de chordUI pasando el single_note simulado
        fb = buildMiniFretboard({ single_note: note.single_note });
        const pitch = getPitchFromStringFret(note.single_note.string, note.single_note.fret);
        if (pitch) playableNotes = [pitch];
      } else {
        const dbKey = note.anglo || note.latin || note.name || note.chord || note.acorde;
        const chordDbInfo = lookupChord(dbKey);
        if (chordDbInfo) {
          fb = buildMiniFretboard(chordDbInfo);
          playableNotes = chordDbInfo.notes;
        }
      }

      if (fb) {
        card.appendChild(fb);
        
        if (playableNotes) {
          const btn = document.createElement('button');
          btn.className = 'btn primary-btn play-chord-btn';
          btn.innerHTML = '🔊 Escuchar';
          btn.style.marginTop = '15px';
          btn.style.display = 'inline-block';
          
          btn.addEventListener('click', async () => {
            try {
              await initAudio();
              const styleHint = currentSongData ? ((currentSongData.technique.effects || "") + " " + (currentSongData.technique.rhythm || "")) : "";
              if (isPunteo) {
                playNote(playableNotes[0], 0, "4n", styleHint);
              } else {
                strumChord(playableNotes, 0.05, styleHint);
              }
            } catch(err) {
              console.error("Error reproduciendo audio:", err);
            }
          });
          
          card.appendChild(btn);
        }
      } else {
        card.innerHTML += `<p style="color:#ff4444; font-size:1rem;">(Esquema no disponible)</p>`;
      }
    }
    container.appendChild(card);
  }
}

/**
 * Builds a chronological schema display from notes + raw schema blocks.
 * Each unique chord shows its full ASCII diagram once; repeats show just the name.
 */
function buildChronologicalSchema(notes, rawSchemaArray) {
  if (!notes || notes.length === 0) return '';

  const schemaBlocks = parseSchemaBlocks(rawSchemaArray);
  const lines = [];
  const shownChords = new Set();
  let lastChordKey = null;

  for (const note of notes) {
    const chordName = (note.latin && note.anglo) ? `${note.latin} (${note.anglo})` : (note.latin || note.anglo || '?');
    if (chordName === lastChordKey) continue; // skip if same chord as previous note
    lastChordKey = chordName;

    if (shownChords.has(chordName)) {
      lines.push(`↩️  ${chordName} (Repetición)`);
      lines.push('');
    } else {
      shownChords.add(chordName);
      // Find the matching schema block
      const blockKey = Object.keys(schemaBlocks).find(k => {
        const lowerK = k.toLowerCase();
        return (note.latin && lowerK.includes(note.latin.toLowerCase())) ||
               (note.anglo && lowerK.includes(note.anglo.toLowerCase()));
      });
      if (blockKey) {
        // First line of block is usually the title, let's keep it but ensure it's clean
        const blockLines = [...schemaBlocks[blockKey]];
        blockLines[0] = `🎸 ${chordName} [Posición]:`;
        lines.push(...blockLines);
      } else {
        lines.push(`🎸 ${chordName}`);
      }
      lines.push('');
    }
  }

  return lines.join('\n');
}

let autoExpandRunning = false;

function saveCurrentSong() {
  if (!currentSongData || !currentSongData.title) return;
  try {
    const saved = JSON.parse(localStorage.getItem('qghero_saved_songs') || '[]');
    const filtered = saved.filter(s => s.title !== currentSongData.title);
    filtered.unshift(currentSongData);
    if (filtered.length > 20) filtered.pop();
    localStorage.setItem('qghero_saved_songs', JSON.stringify(filtered));
    renderSavedSongs(); // update UI if visible
  } catch (e) { console.error("Error saving song", e); }
}

function loadSavedSong(songData) {
  currentSongData = enrichSongData(songData); // Re-enriquecer con la DB de acordes
  document.getElementById('current-song-title').textContent = currentSongData.title || "Canción Guardada";
  gameEngine.loadSong(currentSongData);
  
  // Try to find if this song had a youtube ID from the original input or title
  // Since we don't save the URL explicitly, we can't easily get it unless we saved it.
  // Wait, if it has a youtube URL, let's just assume it doesn't for now unless we add a field.
  // Actually, we can add `originalUrl` to currentSongData when first fetched.
  if (currentSongData.originalVideoId) {
    initShareButtons(`https://youtube.com/watch?v=${currentSongData.originalVideoId}`);
    document.getElementById('youtube-player').style.display = 'block';
    initYouTubePlayer(currentSongData.originalVideoId);
  } else {
    initShareButtons('');
    document.getElementById('youtube-player').style.display = 'none';
    setTimeout(() => gameEngine.play(), 1000);
  }
  
  // Set default speed to 0.7
  const speedSlider = document.getElementById('speed-slider');
  const speedValue = document.getElementById('speed-value');
  if (speedSlider) speedSlider.value = 0.70;
  if (speedValue) speedValue.textContent = '0.70x';
  gameEngine.playbackRate = 0.7;
  if (ytPlayer && ytPlayer.setPlaybackRate) {
    ytPlayer.setPlaybackRate(0.7);
  }
  
  showTechniqueModal(currentSongData);
}

function renderSavedSongs() {
  const container = document.getElementById('saved-songs-container');
  const list = document.getElementById('saved-songs-list');
  if (!container || !list) return;
  
  try {
    const saved = JSON.parse(localStorage.getItem('qghero_saved_songs') || '[]');
    if (saved.length === 0) {
      container.style.display = 'none';
      return;
    }
    
    container.style.display = 'block';
    list.innerHTML = '';
    
    saved.forEach((song, idx) => {
      const wrapper = document.createElement('div');
      wrapper.style.cssText = 'display: flex; gap: 0.5rem; align-items: stretch; margin-bottom: 0.5rem;';
      
      const btn = document.createElement('button');
      btn.className = 'btn secondary-btn';
      btn.style.cssText = 'flex: 1; text-align: left; padding: 0.8rem; display: flex; justify-content: space-between; align-items: center; border-color: rgba(255,255,255,0.1); margin-bottom: 0;';
      
      const duration = song.notes && song.notes.length > 0 
        ? Math.round(Math.max(...song.notes.map(n => n.time))) 
        : 0;
      
      btn.innerHTML = `
        <span><strong>${song.title}</strong> <span style="color:var(--text-secondary); font-size:0.8rem; margin-left: 0.5rem;">${song.artist || ''}</span></span>
        <span style="color:var(--neon-cyan); font-size:0.8rem;">${duration}s</span>
      `;
      btn.addEventListener('click', () => loadSavedSong(song));
      
      const fixBtn = document.createElement('button');
      fixBtn.className = 'btn icon-btn';
      fixBtn.style.cssText = 'border-color: var(--neon-cyan); color: var(--neon-cyan); padding: 0 0.8rem; height: auto; border-radius: 8px;';
      fixBtn.title = 'Arreglar Canción (Re-generar con IA)';
      fixBtn.innerHTML = '✏️';
      fixBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (confirm(`¿Volver a generar '${song.title}' con la IA para arreglar posibles fallos?`)) {
          // Trigger fetch but act as if we searched for it
          const searchInput = document.getElementById('song-input');
          if (searchInput) searchInput.value = song.originalVideoId ? `https://youtube.com/watch?v=${song.originalVideoId}` : song.title;
          document.getElementById('load-song-btn').click();
        }
      });
      
      const delBtn = document.createElement('button');
      delBtn.className = 'btn icon-btn';
      delBtn.style.cssText = 'border-color: #ff4444; color: #ff4444; padding: 0 0.8rem; height: auto; border-radius: 8px;';
      delBtn.title = 'Borrar Canción';
      delBtn.innerHTML = '🗑️';
      delBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (confirm(`¿Seguro que quieres borrar '${song.title}'?`)) {
          const newSaved = saved.filter(s => s.title !== song.title);
          localStorage.setItem('qghero_saved_songs', JSON.stringify(newSaved));
          renderSavedSongs();
        }
      });
      
      wrapper.appendChild(btn);
      wrapper.appendChild(fixBtn);
      wrapper.appendChild(delBtn);
      list.appendChild(wrapper);
    });
  } catch (e) {
    console.error("Error rendering saved songs", e);
  }
}

async function autoExpandSong() {
  if (autoExpandRunning) return;
  autoExpandRunning = true;

  const statusEl = document.getElementById('auto-expand-status');
  const MAX_EXPANSIONS = 20; // Increased to allow long songs
  const MIN_DURATION_S = ytPlayer && ytPlayer.getDuration && ytPlayer.getDuration() > 0 ? ytPlayer.getDuration() : 180;

  let expansions = 0;

  const setStatus = (msg) => { if (statusEl) statusEl.textContent = msg; };
  const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

  setStatus(`🏗️ Construyendo canción... (sección 1/${MAX_EXPANSIONS})`);

  while (expansions < MAX_EXPANSIONS) {
    if (!currentSongData || !currentSongData.notes) break;

    const lastTime = Math.max(...currentSongData.notes.map(n => n.time));
    if (lastTime >= MIN_DURATION_S) {
      break;
    }

    try {
      const newSongData = await expandGameSong(groqApiKey, currentSongData.title || 'Canción', lastTime);

      if (newSongData.notes && newSongData.notes.length > 0) {
        // Enriquecer notas nuevas con la base de datos de acordes
        newSongData.notes = enrichNotesWithChordDb(newSongData.notes);
        currentSongData.notes = currentSongData.notes.concat(newSongData.notes);
        if (newSongData.new_schemas && newSongData.new_schemas.length > 0) {
          if (!Array.isArray(currentSongData.technique.schema)) {
            currentSongData.technique.schema = currentSongData.technique.schema
              ? [currentSongData.technique.schema] : [];
          }
          currentSongData.technique.schema = currentSongData.technique.schema.concat(newSongData.new_schemas);
        }
        // Rebuild chronological display
        const schemaEl = document.getElementById('tech-schema');
        if (schemaEl) {
          schemaEl.innerHTML = '';
          renderChronologicalViñetas(currentSongData.notes, schemaEl);
        }
        gameEngine.loadSong(currentSongData);
        saveCurrentSong(); // Guardamos paso a paso por si recarga
        
        expansions++;
        const newLast = Math.max(...currentSongData.notes.map(n => n.time));
        setStatus(`🏗️ Construyendo canción... (sección ${expansions + 1}/${MAX_EXPANSIONS}, ${Math.round(newLast)}s)`);
      } else {
        break; // No new notes, done
      }

      await sleep(1500);
    } catch (err) {
      if (err.message.includes('429')) {
        const match = err.message.match(/try again in ([\d\.]+)s/);
        const waitMs = match ? Math.ceil(parseFloat(match[1])) * 1000 + 2000 : 45000;
        setStatus(`⏳ Esperando límite de IA... (${Math.round(waitMs / 1000)}s)`);
        await sleep(waitMs);
      } else {
        break;
      }
    }
  }

  const finalTime = currentSongData?.notes?.length > 0
    ? Math.max(...currentSongData.notes.map(n => n.time))
    : 0;
    
  setStatus(`✅ Canción construida (${Math.round(finalTime)}s)`);
  
  autoExpandRunning = false;
}

// ─── GLOSARIO MUSICAL ──────────────────────────────────────────────────────────
const MUSIC_TERMS = {
  'rasgueo': 'Técnica de la mano derecha en la que se pasa los dedos (o la púa) sobre todas las cuerdas en un movimiento rápido. Puede ser hacia abajo (↓) o hacia arriba (↑).',
  'punteo': 'Técnica de la mano derecha en la que se tocan las cuerdas de una en una con la punta del dedo o la púa, en lugar de rasguearlas todas a la vez. Produce notas individuales.',
  'arpegio': 'Técnica en la que las notas de un acorde se tocan sucesivamente (una a una) en lugar de simultáneamente. Muy común en guitarra clásica y fingerpicking.',
  'fingerpicking': 'Estilo de punteo con los dedos de la mano derecha (sin púa). Cada dedo cubre cuerdas específicas: p=pulgar(cuerdas gruesas), i=índice, m=medio, a=anular.',
  'cejilla': 'Técnica en la que el dedo índice (dedo 1) presiona todas las cuerdas en un mismo traste a la vez, actuando como una ceja. Permite transportar acordes a cualquier posición del mástil.',
  'power chord': 'Acorde de 2 o 3 notas (fundamental + quinta) muy usado en rock y metal. No tiene tercera, por lo que suena "potente" y neutro. Se toca normalmente con distorsión.',
  'corchea': 'Figura musical que vale la mitad de una negra. A 120 BPM, una corchea dura 0.25 segundos. En rasgueo "en corcheas" das 8 golpes por compás de 4/4.',
  'negra': 'Figura musical básica. A 120 BPM, una negra dura 0.5 segundos. En rasgueo "en negras" das 4 golpes por compás de 4/4.',
  'compás': 'Unidad de tiempo en música. Un compás de 4/4 tiene 4 pulsos de negra. El número de compases determina la duración de una sección de la canción.',
  'bpm': 'Beats Per Minute (pulsaciones por minuto). Indica la velocidad de la canción. 60 BPM = 1 golpe por segundo. 120 BPM = 2 golpes por segundo.',
  'distorsión': 'Efecto electrónico que distorsiona la señal de la guitarra eléctrica para crear un sonido más agresivo y saturado. Característico del rock y el metal.',
  'vibrato': 'Técnica de hacer oscilar el dedo sobre una cuerda pulsada para variar ligeramente la altura del sonido, creando un efecto expresivo y cantable.',
  'hammer-on': 'Técnica en la que se pulsa una cuerda y luego se golpea otro traste más alto con otro dedo sin volver a rasguear. Produce una nota legata (ligada).',
  'pull-off': 'Técnica opuesta al hammer-on. Se tienen dos dedos pisados y se "tira" del que está más arriba para hacer sonar el traste inferior sin rasguear.',
  'slide': 'Técnica en la que se desliza el dedo por el mástil de un traste a otro manteniendo la presión, creando una transición suave entre notas.',
  'traste': 'Cada uno de los espacios separados por las barras metálicas (trastes) en el mástil de la guitarra. El traste 1 está más cerca de la cejilla, el 12 en el centro.',
  'mástil': 'La parte larga de la guitarra donde están los trastes y donde se pisan las notas con la mano izquierda.',
  'acorde': 'Conjunto de 3 o más notas tocadas simultáneamente. En guitarra, la mayoría de acordes básicos usan entre 3 y 6 cuerdas.',
  'pentatónica': 'Escala musical de 5 notas. La escala pentatónica menor es el vocabulario básico del blues, rock y muchos solos de guitarra.',
};

function linkMusicTerms(text) {
  if (!text) return '';
  // Escape HTML first
  let safe = text.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  // Detect and wrap known terms (case-insensitive, whole-word-ish)
  const termsSorted = Object.keys(MUSIC_TERMS).sort((a,b) => b.length - a.length);
  for (const term of termsSorted) {
    const regex = new RegExp(`(${term}s?)`, 'gi');
    safe = safe.replace(regex, (match) => {
      const key = termsSorted.find(t => match.toLowerCase().startsWith(t));
      if (!key) return match;
      const def = MUSIC_TERMS[key].replace(/'/g, '&#39;');
      return `<span class="music-term" data-def="${def}" title="¿Qué es esto?">${match}</span>`;
    });
  }
  return safe;
}

// ─── VISOR DE PARTITURA ────────────────────────────────────────────────────────
let scoreImages = [];
let scoreIndex = 0;
let scoreAutoInterval = null;

// Wikimedia Commons — search specifically within music score categories
async function searchCommons(query) {
  // Force search within Music scores category to avoid photos/concert images
  const q = encodeURIComponent(`${query} incategory:Music_scores`);
  const url = `https://commons.wikimedia.org/w/api.php?action=query&list=search&srsearch=${q}&srnamespace=6&format=json&origin=*&srlimit=30`;
  const resp = await fetch(url, { signal: AbortSignal.timeout(6000) });
  const data = await resp.json();
  if (!data.query?.search?.length) return [];

  const titles = data.query.search.map(r => r.title).join('|');
  const infoUrl = `https://commons.wikimedia.org/w/api.php?action=query&titles=${encodeURIComponent(titles)}&prop=imageinfo&iiprop=url|mediatype&format=json&origin=*`;
  const infoData = await (await fetch(infoUrl, { signal: AbortSignal.timeout(6000) })).json();

  return Object.values(infoData.query?.pages || {}).reduce((acc, page) => {
    const info = page.imageinfo?.[0];
    if (!info) return acc;
    const imgUrl = info.url;
    const title = (page.title || '').toLowerCase();
    // Only accept images (not audio/video) AND must look like a score page
    const isImage = /\.(jpg|jpeg|png|gif|svg)$/i.test(imgUrl);
    const looksLikeScore = title.includes('score') || title.includes('sheet') ||
      title.includes('music') || title.includes('tablature') || title.includes('partitura') ||
      title.includes('notation') || title.includes('manuscript') || title.endsWith('.svg');
    if (isImage && looksLikeScore) acc.push({ url: imgUrl, title: page.title });
    return acc;
  }, []);
}

/**
 * Generates paginated guitar tablature images from currentSongData.
 * Returns array of { url, title } objects (data URLs).
 */
function generateTabImages(songData) {
  if (!songData || !songData.notes || songData.notes.length === 0) return [];

  const STRING_NAMES = ['e', 'B', 'G', 'D', 'A', 'E']; // string index 1→e, 6→E
  const BG        = '#0d0d1a';
  const LINE_CLR  = '#334';
  const TEXT_CLR  = '#e0e8ff';
  const NEON      = '#00e5ff';
  const DIM_CLR   = '#556';
  const ACCENT    = '#ff2d78';

  // Layout
  const PW = 900, PH = 1100;
  const MARGIN = 50;
  const HEADER_H = 170;
  const STR_SPACING = 24;       // px between tab lines
  const TAB_H = STR_SPACING * 5; // total height of 6 lines
  const ROW_LABEL_W = 30;        // width for string labels
  const COL_W = 58;              // width per chord column
  const ROW_GAP = 50;            // gap between rows (for chord names above)
  const ROW_H = TAB_H + ROW_GAP;
  const USABLE_W = PW - MARGIN * 2 - ROW_LABEL_W;
  const COLS_PER_ROW = Math.floor(USABLE_W / COL_W);
  const ROWS_PER_PAGE = Math.floor((PH - HEADER_H - MARGIN) / ROW_H);

  // Deduplicate consecutive identical chords in notes → chord sequence
  const chords = [];
  let lastChordKey = null;
  for (const note of songData.notes) {
    const key = `${note.latin||note.anglo||'?'}-${note.fret}-${note.string}`;
    if (key !== lastChordKey) {
      chords.push(note);
      lastChordKey = key;
    }
  }

  const pages = [];
  let chordIdx = 0;

  while (chordIdx < chords.length) {
    const canvas = document.createElement('canvas');
    canvas.width = PW; canvas.height = PH;
    const ctx = canvas.getContext('2d');

    // Background
    ctx.fillStyle = BG;
    ctx.fillRect(0, 0, PW, PH);

    // Header (only first page)
    if (pages.length === 0) {
      ctx.fillStyle = NEON;
      ctx.font = 'bold 28px Outfit, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(songData.title || 'Tablatura', PW / 2, 40);
      ctx.fillStyle = TEXT_CLR;
      ctx.font = '18px Outfit, sans-serif';
      ctx.fillText(`${songData.artist || ''}   ♩ = ${songData.bpm || 120} BPM`, PW / 2, 68);
      
      const tech = songData.technique || {};
      ctx.font = '14px Outfit, sans-serif';
      ctx.fillStyle = '#bbb';
      
      // Limit text length to avoid overflowing canvas
      const trunc = (str, len) => str.length > len ? str.substring(0, len) + '...' : str;
      
      ctx.fillText(`✋ Manos: ${trunc(tech.hands || 'Estándar', 100)}`, PW / 2, 98);
      ctx.fillText(`🎸 Ritmo: ${trunc(tech.rhythm || 'Básico', 100)}`, PW / 2, 120);
      ctx.fillText(`🎛️ Efectos: ${trunc(tech.effects || 'Ninguno', 100)}`, PW / 2, 142);

      // Divider
      ctx.strokeStyle = NEON;
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(MARGIN, 155); ctx.lineTo(PW - MARGIN, 155); ctx.stroke();
    }

    let y0 = pages.length === 0 ? HEADER_H : MARGIN;

    for (let row = 0; row < ROWS_PER_PAGE && chordIdx < chords.length; row++) {
      const x0 = MARGIN + ROW_LABEL_W;
      const y = y0 + row * ROW_H;

      // Draw string labels
      for (let s = 0; s < 6; s++) {
        ctx.fillStyle = DIM_CLR;
        ctx.font = '13px Courier New, monospace';
        ctx.textAlign = 'right';
        ctx.fillText(STRING_NAMES[s], MARGIN + ROW_LABEL_W - 4, y + s * STR_SPACING + 5);
      }

      // Draw 6 horizontal tab lines for this row
      const rowEndX = x0 + COLS_PER_ROW * COL_W;
      for (let s = 0; s < 6; s++) {
        ctx.strokeStyle = LINE_CLR;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x0, y + s * STR_SPACING);
        ctx.lineTo(rowEndX, y + s * STR_SPACING);
        ctx.stroke();
      }

      // Draw each chord column in this row
      for (let col = 0; col < COLS_PER_ROW && chordIdx < chords.length; col++) {
        const note = chords[chordIdx];
        const cx = x0 + col * COL_W + COL_W / 2;
        const stringIdx = note.string - 1; // 0-based (0=e, 5=E)

        // Chord name above tab
        ctx.fillStyle = ACCENT;
        ctx.font = 'bold 12px Outfit, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(note.latin || note.anglo || '', cx, y - 6);

        // Draw fret number on the correct string line
        const sy = y + stringIdx * STR_SPACING;
        const fretStr = String(note.fret);
        const fretW = fretStr.length * 9 + 6;

        // Clear line behind number
        ctx.fillStyle = BG;
        ctx.fillRect(cx - fretW / 2, sy - 10, fretW, 16);

        // Fret number
        ctx.fillStyle = NEON;
        ctx.font = 'bold 14px Courier New, monospace';
        ctx.textAlign = 'center';
        ctx.fillText(fretStr, cx, sy + 5);

        // Other strings show dashes
        for (let s = 0; s < 6; s++) {
          if (s === stringIdx) continue;
          ctx.fillStyle = DIM_CLR;
          ctx.font = '12px Courier New, monospace';
          ctx.fillText('–', cx, y + s * STR_SPACING + 5);
        }

        chordIdx++;
      }
    }

    // Page number
    ctx.fillStyle = DIM_CLR;
    ctx.font = '12px Outfit, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`Pág. ${pages.length + 1}  •  Generada por QGHERO IA`, PW / 2, PH - 15);

    pages.push({ url: canvas.toDataURL('image/png'), title: `Página ${pages.length + 1}` });
  }

  return pages;
}

async function searchSheetMusicSmart(songTitle, artistHint = '') {
  const clean = songTitle.replace(/[\(\)\[\]]/g, '').trim();
  const artist = artistHint.trim();

  // Only try queries where Commons is likely to have a score (classical/well-known)
  const queries = [
    artist ? `${artist} ${clean} guitar` : null,
    `${clean} guitar`,
    artist ? `${artist} ${clean}` : null,
    `${clean}`,
  ].filter(Boolean);

  for (const q of queries) {
    try {
      const results = await searchCommons(q);
      if (results.length > 0) return { mode: 'images', images: results };
    } catch (_) { /* try next */ }
  }

  // No external score found → generate our own tablature from the song data
  return { mode: 'images', images: generateTabImages(currentSongData) };
}

function openScoreViewer(result, songTitle) {
  scoreImages = result.mode === 'images' ? result.images : [];
  scoreIndex = 0;
  const viewer = document.getElementById('score-viewer');
  const img = document.getElementById('score-image');
  const container = document.getElementById('score-image-container');
  const info = document.getElementById('score-page-info');
  const titleEl = document.getElementById('score-title');
  const prevBtn = document.getElementById('score-prev');
  const nextBtn = document.getElementById('score-next');
  const autoBtn = document.getElementById('score-auto');

  titleEl.textContent = `Partitura: ${songTitle}`;
  viewer.style.display = 'flex';
  document.getElementById('score-error').style.display = 'none';

  if (result.mode === 'iframe') {
    // Embed MuseScore search results directly — no user action needed
    img.style.display = 'none';
    let iframe = document.getElementById('score-iframe');
    if (!iframe) {
      iframe = document.createElement('iframe');
      iframe.id = 'score-iframe';
      iframe.style.cssText = 'width:100%;height:100%;border:none;border-radius:0.5rem;';
      container.appendChild(iframe);
    }
    iframe.src = result.url;
    iframe.style.display = 'block';
    info.textContent = 'MuseScore';
    // Navigation not applicable for iframe mode
    prevBtn.style.display = 'none';
    nextBtn.style.display = 'none';
    autoBtn.style.display = 'none';
  } else {
    // Image navigation mode
    let iframe = document.getElementById('score-iframe');
    if (iframe) iframe.style.display = 'none';
    img.style.display = 'block';
    prevBtn.style.display = '';
    nextBtn.style.display = '';
    autoBtn.style.display = '';

    const show = (i) => {
      scoreIndex = Math.max(0, Math.min(i, scoreImages.length - 1));
      img.src = scoreImages[scoreIndex].url;
      info.textContent = `${scoreIndex + 1} / ${scoreImages.length}`;
    };
    show(0);

    prevBtn.onclick = () => show(scoreIndex - 1);
    nextBtn.onclick = () => show(scoreIndex + 1);

    autoBtn.onclick = () => {
      if (scoreAutoInterval) {
        clearInterval(scoreAutoInterval); scoreAutoInterval = null;
        autoBtn.textContent = '▶️ Auto';
      } else {
        scoreAutoInterval = setInterval(() => {
          if (scoreIndex >= scoreImages.length - 1) {
            clearInterval(scoreAutoInterval); scoreAutoInterval = null;
            autoBtn.textContent = '▶️ Auto';
          } else { show(scoreIndex + 1); }
        }, 4000);
        autoBtn.textContent = '⏹ Parar';
      }
    };
  }

  document.getElementById('score-close').onclick = () => {
    if (scoreAutoInterval) { clearInterval(scoreAutoInterval); scoreAutoInterval = null; }
    autoBtn.textContent = '▶️ Auto';
    prevBtn.style.display = ''; nextBtn.style.display = ''; autoBtn.style.display = '';
    viewer.style.display = 'none';
    const iframe = document.getElementById('score-iframe');
    if (iframe) iframe.src = '';
  };
}

function showTechniqueModal(data) {

  autoExpandRunning = false; // Reset so a new song starts fresh

  document.getElementById('tech-song-title').textContent = data.title;
  
  const tech = data.technique || {};
  document.getElementById('tech-hands').innerHTML = linkMusicTerms(tech.hands || "Posición estándar.");
  document.getElementById('tech-rhythm').innerHTML = linkMusicTerms(tech.rhythm || "Ritmo básico.");
  document.getElementById('tech-effects').innerHTML = linkMusicTerms(tech.effects || "Ninguno.");

  // Wire up clickable music terms
  modals.technique.querySelectorAll('.music-term').forEach(span => {
    span.style.cssText = 'color:#00e5ff; cursor:pointer; text-decoration:underline dotted; font-weight:500;';
    span.addEventListener('click', (e) => {
      e.stopPropagation();
      const helpModal = document.getElementById('global-help-modal');
      document.getElementById('help-title').textContent = `📖 ${span.textContent}`;
      document.getElementById('help-content').innerHTML = `<p style="font-size:1.1rem;">${span.getAttribute('data-def')}</p>`;
      helpModal.classList.remove('hidden');
    });
  });
  
  const schemaEl = document.getElementById('tech-schema');
  schemaEl.innerHTML = '';
  if (data.notes && data.notes.length > 0) {
    renderChronologicalViñetas(data.notes, schemaEl);
    schemaEl.classList.remove('hidden');
  } else if (tech.schema) {
    const pre = document.createElement('pre');
    pre.className = 'ascii-schema';
    pre.textContent = Array.isArray(tech.schema) ? tech.schema.join('\n') : tech.schema;
    schemaEl.appendChild(pre);
    schemaEl.classList.remove('hidden');
  } else {
    schemaEl.classList.add('hidden');
  }

  const statusEl = document.getElementById('auto-expand-status');
  if (statusEl) statusEl.textContent = '';
  
  // ── Partitura: buscar en background, abrir al instante cuando el usuario pulse ──
  const scoreBtn = document.getElementById('show-score-btn');
  scoreBtn.disabled = true;
  scoreBtn.textContent = '⏳ Buscando partitura...';
  scoreBtn.style.cssText = 'border-color:#555; color:#555; margin-bottom:0.5rem;';

  let prefetchedScore = null;

  searchSheetMusicSmart(data.title || 'guitar', data.artist || '')
    .then(result => {
      prefetchedScore = result;
      scoreBtn.disabled = false;
      scoreBtn.textContent = '🎼 Ver Partitura';
      scoreBtn.style.cssText = 'border-color:var(--neon-cyan); color:var(--neon-cyan); margin-bottom:0.5rem;';
    })
    .catch(() => {
      // Fallback to MuseScore iframe — always available
      const msQuery = encodeURIComponent(data.title || 'guitar');
      prefetchedScore = { mode: 'iframe', url: `https://musescore.com/sheetmusic?text=${msQuery}&instrument=guitar` };
      scoreBtn.disabled = false;
      scoreBtn.textContent = '🎼 Ver Partitura';
      scoreBtn.style.cssText = 'border-color:var(--neon-cyan); color:var(--neon-cyan); margin-bottom:0.5rem;';
    });

  scoreBtn.onclick = () => {
    if (!prefetchedScore) return;
    openScoreViewer(prefetchedScore, data.title || 'Partitura');
  };
  
  modals.technique.classList.remove('hidden');

  // Start auto-expanding the song in the background
  setTimeout(() => autoExpandSong(), 1200);
}

function extractVideoId(url) {
  const match = url.match(/^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/);
  return (match && match[2].length === 11) ? match[2] : null;
}

function initYouTubePlayer(videoId) {
  if (ytPlayer && ytPlayer.loadVideoById) {
    ytPlayer.loadVideoById(videoId);
    ytPlayer.pauseVideo();
    ytPlayer.setPlaybackRate(0.7);
    const ytAudioToggle = document.getElementById('yt-audio-toggle');
    if (ytAudioToggle && !ytAudioToggle.checked && ytPlayer.mute) ytPlayer.mute();
    else if (ytPlayer.unMute) ytPlayer.unMute();
    return;
  }
  if (window.YT && window.YT.Player) {
    createPlayer(videoId);
  } else {
    window.onYouTubeIframeAPIReady = () => createPlayer(videoId);
  }
}

function createPlayer(videoId) {
  isYoutubeReady = false;
  pendingYoutubePlay = false;
  ytPlayer = new window.YT.Player('youtube-player', {
    height: '100', width: '100', videoId: videoId,
    playerVars: { 'playsinline': 1, 'controls': 0, 'disablekb': 1 },
    events: {
        'onReady': () => {
          isYoutubeReady = true;
          if (pendingYoutubePlay) {
            ytPlayer.playVideo();
            pendingYoutubePlay = false;
          }
          const speedSlider = document.getElementById('speed-slider');
          if (speedSlider) ytPlayer.setPlaybackRate(parseFloat(speedSlider.value) || 0.7);
          const ytAudioToggle = document.getElementById('yt-audio-toggle');
          if (ytAudioToggle && !ytAudioToggle.checked && ytPlayer.mute) ytPlayer.mute();
        },
      'onStateChange': (e) => {
          if (e.data == window.YT.PlayerState.PLAYING) {
              gameEngine.start();
              const rhythmSelect = document.getElementById('rhythm-select');
              if (rhythmSelect && rhythmSelect.value !== 'none') {
                  const bpm = 100 * gameEngine.playbackRate;
                  startRhythm(rhythmSelect.value, bpm);
              }
          } else if (e.data == window.YT.PlayerState.PAUSED || e.data == window.YT.PlayerState.ENDED) {
              gameEngine.stop();
              stopRhythm();
          }
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
