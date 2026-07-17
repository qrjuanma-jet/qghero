import { lookupChord } from './chordDb.js';
import { buildMiniFretboard } from './chordUI.js';
import { parseNaturalChordQuery } from './groqApi.js';
import { strumChord } from './audioSynth.js';

export function initDictionaryMode(apiKey) {
    const dictScreen = document.getElementById('dictionary-screen');
    const inputField = document.getElementById('dict-query');
    const searchBtn = document.getElementById('dict-search-btn');
    const voiceBtn = document.getElementById('dict-voice-btn');
    const resultContainer = document.getElementById('dict-result-container');
    const loadingEl = document.getElementById('dict-loading');

    // Manejo de la búsqueda
    const performSearch = async (query) => {
        if (!query.trim()) return;
        if (!apiKey) {
            alert('Falta la API Key');
            return;
        }

        resultContainer.innerHTML = '';
        loadingEl.classList.remove('hidden');

        try {
            // 1. Preguntar a la IA qué acorde quiere el usuario
            const chordName = await parseNaturalChordQuery(apiKey, query);
            
            // 2. Buscar en la base de datos o generar dinámicamente
            const dbInfo = lookupChord(chordName);
            loadingEl.classList.add('hidden');

            if (!dbInfo) {
                resultContainer.innerHTML = `<p class="neon-text" style="color: #ff4444;">No pude entender qué acorde quieres o no existe: "${chordName}". Intenta ser más específico.</p>`;
                return;
            }

            // 3. Renderizar el acorde
            const card = document.createElement('div');
            card.className = 'chord-card theory-chord-card';
            card.style.transform = 'scale(1.5)';
            card.style.margin = '20px 0';
            
            const fullName = dbInfo.latin && dbInfo.anglo ? `${dbInfo.latin} (${dbInfo.anglo})` : dbInfo.latin || dbInfo.anglo;

            card.innerHTML = `
                <h4>${fullName}</h4>
                <div class="chord-ui-container"></div>
                <button class="btn primary-btn play-chord-btn" style="margin-top: 15px;">
                    🔊 Escuchar
                </button>
            `;

            const uiContainer = card.querySelector('.chord-ui-container');
            const fb = buildMiniFretboard(dbInfo);
            uiContainer.appendChild(fb);

            const playBtn = card.querySelector('.play-chord-btn');
            playBtn.addEventListener('click', () => {
                if (dbInfo.notes && dbInfo.notes.length > 0) {
                    strumChord(dbInfo.notes);
                }
            });

            resultContainer.appendChild(card);

        } catch (error) {
            console.error(error);
            loadingEl.classList.add('hidden');
            resultContainer.innerHTML = `<p style="color: red;">Error conectando con la IA: ${error.message}</p>`;
        }
    };

    searchBtn.addEventListener('click', () => {
        performSearch(inputField.value);
    });

    inputField.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            performSearch(inputField.value);
        }
    });

    // Manejo de la voz
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.lang = 'es-ES';
        recognition.interimResults = false;
        recognition.maxAlternatives = 1;

        recognition.onstart = () => {
            voiceBtn.style.color = 'var(--neon-cyan)';
            voiceBtn.style.textShadow = '0 0 10px var(--neon-cyan)';
            inputField.placeholder = "Escuchando...";
            inputField.value = "";
        };

        recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript;
            inputField.value = transcript;
            performSearch(transcript);
        };

        recognition.onerror = (event) => {
            console.error('Speech recognition error', event.error);
            inputField.placeholder = 'Ej: "Enséñame el Fa sostenido menor"';
            voiceBtn.style.color = '';
            voiceBtn.style.textShadow = '';
            alert('Error al capturar el audio. Asegúrate de dar permisos de micrófono.');
        };

        recognition.onend = () => {
            inputField.placeholder = 'Ej: "Enséñame el Fa sostenido menor"';
            voiceBtn.style.color = '';
            voiceBtn.style.textShadow = '';
        };

        voiceBtn.addEventListener('click', () => {
            recognition.start();
        });
    } else {
        voiceBtn.style.display = 'none'; // Navegador no soporta API de voz
    }
}
