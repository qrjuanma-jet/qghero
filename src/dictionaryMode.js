import { lookupChord } from './chordDb.js';
import { buildMiniFretboard } from './chordUI.js';
import { parseNaturalChordQuery, fetchChordAdvice } from './groqApi.js';
import { strumChord } from './audioSynth.js';

export function initDictionaryMode(getApiKeyFn) {
    const dictScreen = document.getElementById('dictionary-screen');
    const inputField = document.getElementById('dict-query');
    const searchBtn = document.getElementById('dict-search-btn');
    const voiceBtn = document.getElementById('dict-voice-btn');
    const resultContainer = document.getElementById('dict-result-container');
    const loadingEl = document.getElementById('dict-loading');

    // Manejo de la búsqueda
    const performSearch = async (query) => {
        if (!query.trim()) return;
        const apiKey = getApiKeyFn();
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
                resultContainer.innerHTML = `<p class="neon-text" style="color: #ff4444; overflow-wrap: break-word; word-break: break-word;">No pude entender qué acorde quieres o no existe: "${chordName}". Intenta ser más específico.</p>`;
                return;
            }

            // 3. Renderizar el acorde
            const card = document.createElement('div');
            card.className = 'chord-card theory-chord-card';
            card.style.margin = '20px auto';
            card.style.maxWidth = '350px';
            
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

            // 4. Pedir consejo a la IA de fondo y mostrarlo
            const adviceContainer = document.createElement('div');
            adviceContainer.style.marginTop = '15px';
            adviceContainer.style.fontSize = '0.9rem';
            adviceContainer.style.color = 'var(--text-secondary)';
            adviceContainer.innerHTML = '<span class="spinner" style="width: 15px; height: 15px; display: inline-block; border-width: 2px;"></span> Generando consejo...';
            card.appendChild(adviceContainer);

            resultContainer.appendChild(card);

            fetchChordAdvice(apiKey, fullName).then(advice => {
                if (advice) {
                    adviceContainer.innerHTML = `💡 <i>${advice}</i>`;
                } else {
                    adviceContainer.innerHTML = '';
                }
            });

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

        let isRecognizing = false;

        recognition.onstart = () => {
            isRecognizing = true;
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
            isRecognizing = false;
            console.error('Speech recognition error', event.error);
            inputField.placeholder = 'Ej: "Enséñame el Fa sostenido menor"';
            voiceBtn.style.color = '';
            voiceBtn.style.textShadow = '';
            if (event.error !== 'aborted') {
                alert('Error al capturar el audio. Asegúrate de dar permisos de micrófono.');
            }
        };

        recognition.onend = () => {
            isRecognizing = false;
            inputField.placeholder = 'Ej: "Enséñame el Fa sostenido menor"';
            voiceBtn.style.color = '';
            voiceBtn.style.textShadow = '';
        };

        voiceBtn.addEventListener('click', () => {
            if (isRecognizing) {
                try { recognition.stop(); } catch(e){}
            } else {
                try { recognition.start(); } catch(e){}
            }
        });
    } else {
        voiceBtn.style.display = 'none'; // Navegador no soporta API de voz
    }
}
