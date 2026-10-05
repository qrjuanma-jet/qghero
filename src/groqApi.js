export async function fetchSongData(apiKey, songName) {
  if (!apiKey) throw new Error("No API Key provided");
  if (!songName) throw new Error("No song name provided");

  const systemMsg = `Eres un maestro de guitarra con 30 años de experiencia. Analizas canciones y devuelves la secuencia de acordes con sus tiempos exactos. NO necesitas generar esquemas de digitación ni fingerings, solo los NOMBRES de los acordes y sus tiempos.`;

  const prompt = `
Analiza la canción "${songName}" y devuelve un JSON puro con su estructura musical REAL para guitarra.

FORMATO OBLIGATORIO del JSON:
{
  "title": "<título real>",
  "artist": "<artista real>",
  "bpm": <BPM real>,
  "technique": {
    "hands": "<posición real de manos>",
    "rhythm": "<patrón rítmico real>",
    "effects": "<efectos reales>"
  },
  "notes": [
    { "time": <segundos>, "duration": <seg>, "right_hand": "<↓/↑/P/X>", "latin": "<nombre latino>", "anglo": "<nombre anglo>", "base_fret": <0-24>, "lyric": "<palabra o vacío>", "single_note": {"string": <1-6>, "fret": <0-24>} }
  ]
}

INSTRUCCIONES:
1. "anglo" = notación estándar. Si es un acorde: C, D, Am, F#m, etc. Si es NOTA SUELTA (punteo): "E note".
2. "latin" = Si es acorde: Do Mayor, Re menor. Si es NOTA SUELTA: "Nota Mi".
3. "base_fret" = El traste de inicio REAL del acorde en esta canción. 0 para abiertos, >0 para cejillas o acordes altos.
4. "single_note": SI es un punteo, el objeto {"string": 6, "fret": 0}. SI es un acorde, "single_note": null.
5. Genera mínimo 16 notas. BPM real de la canción.
6. "right_hand": ↓ (rasgueo abajo), ↑ (arriba), P (punteo) o X (muteo).
7. "lyric": palabra cantada en ese instante o vacío.
8. Tiempos ascendentes, representando la canción REAL.
9. Devuelve SÓLO JSON puro, sin markdown.`;

  return callGroq(apiKey, prompt, 0.1, 2000, systemMsg, true);
}

export async function expandGameSong(apiKey, songName, lastTime) {
  if (!apiKey) throw new Error("No API Key provided");

  const systemMsg = `Eres un maestro de guitarra. Continúas analizando canciones. NO necesitas generar esquemas de digitación, solo los nombres de los acordes y tiempos exactos.`;

  const prompt = `
Continúa la canción "${songName}" desde el segundo ${lastTime}.
Genera la SIGUIENTE sección (al menos 16 notas, 4 compases más) con los acordes REALES que siguen en la canción.

FORMATO JSON obligatorio:
{
  "notes": [
    { "time": <mayor que ${lastTime}>, "duration": <seg>, "right_hand": "<↓/↑/P/X>", "latin": "<Latina>", "anglo": "<Anglo>", "base_fret": <0-24>, "lyric": "<palabra o vacío>", "single_note": {"string": <1-6>, "fret": <0-24>} }
  ]
}

REGLAS ESTRICTAS:
1. Los "time" DEBEN ser estrictamente mayores que ${lastTime} y ascendentes.
2. "anglo" y "latin" deben ser los acordes correctos. 
3. "base_fret": el traste inicial REAL del acorde (0=abierto, >0=cejilla).
4. Si es PUNTEO, pon "E note", base_fret: 0, y "single_note": {"string": 6, "fret": 0}. Si es acorde, "single_note": null.
5. "right_hand" debe ser estrictamente un símbolo (↓, ↑, P, X).
6. "lyric" la letra real en ese segundo, o vacío si no hay voz.
7. Devuelve SÓLO JSON puro, sin markdown.`;

  return callGroq(apiKey, prompt, 0.1, 2000, systemMsg, true);
}

export async function fetchTheoryCourse(apiKey, level) {
  if (!apiKey) throw new Error("No API Key provided");
  
  const systemMsg = `Eres un maestro de guitarra experto con décadas de experiencia pedagógica. Tu enseñanza es rigurosa, absolutamente precisa y realista. NUNCA alucinas ni inventas acordes o posiciones imposibles de tocar. Sabes que un guitarrista real jamás pondría el mismo dedo en dos trastes a la vez, ni usaría posiciones físicamente imposibles. Tienes una lógica musical perfecta: nunca repites el uso de los dedos 2, 3 o 4 en un mismo acorde. Solo el dedo 1 puede usarse en múltiples cuerdas si es cejilla. Te ciñes estrictamente a la teoría musical real.`;

  const prompt = `
Genera una clase magistral de guitarra para el nivel "${level}" en HTML básico (h3, p, ul, strong).

NOMENCLATURA OBLIGATORIA:
- Equivalencia de Acordes: Es OBLIGATORIO que SIEMPRE que menciones una nota o acorde expliques su equivalencia entre la nomenclatura latina y la anglosajona (ej. "Do Mayor, que se representa con la letra C", "Sol Mayor (G)", "Re menor (Dm)"). ¡El alumno no sabe qué significa G por sí sola!
- Mano izquierda: dedos 1 (índice), 2 (medio), 3 (anular), 4 (meñique). REGLA: cada dedo pisa UN traste (salvo cejilla).
- Mano derecha: p (pulgar), i (índice), m (medio), a (anular), e (meñique).
ESQUEMAS DE ACORDES Y PUNTEOS - REGLAS ESTRICTAS:
- NUNCA intentes dibujar esquemas ASCII.
- NUNCA expliques con texto en qué cuerda o traste va cada dedo (sueles cometer errores al explicar la geometría). Céntrate en la teoría, de qué notas se compone y cómo debe sonar. Indica al alumno que se fije en la viñeta gráfica generada.
- OBLIGATORIO PARA ACORDES: Cuando quieras enseñar un acorde (ej. Do Mayor), inserta EXACTAMENTE este código HTML:
<div class="theory-chord-card" data-chord="C"></div>
(SUSTITUYE "C" por el acorde en formato anglosajón o latino).
- OBLIGATORIO PARA PUNTEOS / NOTAS SUELTAS: Cuando quieras enseñar una nota suelta (ej. "Toca la sexta cuerda en el tercer traste"), inserta EXACTAMENTE este código HTML:
<div class="theory-chord-card" data-note="6-3"></div>
(SUSTITUYE "6-3" por "cuerda-traste", donde cuerda es 1-6 y traste es 0-24).
- ¡ESTO ES MUY IMPORTANTE! Si no pones este <div>, el alumno no podrá ver ni escuchar la nota o acorde. No pongas ningún botón "Escuchar" a mano.

CONTENIDO:
- Introducción motivadora
- Explicaciones claras de cómo pisar los trastes
- Mínimo 2 acordes o punteos explicados, insertando su respectivo <div class="theory-chord-card"...></div>
- Un ejercicio práctico
- Solo HTML crudo, sin markdown ni backticks`;

  const content = await callGroq(apiKey, prompt, 0.5, 2500, systemMsg, false);
  let cleanContent = content;
  if (cleanContent.startsWith('```html')) cleanContent = cleanContent.substring(7);
  if (cleanContent.startsWith('```')) cleanContent = cleanContent.substring(3);
  if (cleanContent.endsWith('```')) cleanContent = cleanContent.substring(0, cleanContent.length - 3);
  
  return cleanContent.trim();
}

export async function expandTheoryCourse(apiKey, level, previousContent) {
  if (!apiKey) throw new Error("No API Key provided");
  
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = previousContent;
  let textHistory = tempDiv.innerText || tempDiv.textContent || "";
  
  if (textHistory.length > 15000) {
      textHistory = "..." + textHistory.substring(textHistory.length - 15000);
  }

  const systemMsg = `Eres un maestro de guitarra experto con décadas de experiencia pedagógica. Tu enseñanza es rigurosa, absolutamente precisa y realista. NUNCA alucinas ni inventas acordes o posiciones imposibles de tocar. Sabes que un guitarrista real jamás pondría el mismo dedo en dos trastes a la vez, ni usaría posiciones físicamente imposibles. Tienes una lógica musical perfecta: nunca repites el uso de los dedos 2, 3 o 4 en un mismo acorde. Solo el dedo 1 puede usarse en múltiples cuerdas si es cejilla. Nunca repites contenido ya enseñado y te ciñes estrictamente a la teoría musical real.`;

  const prompt = `
Continúa la clase de guitarra nivel "${level}". 
Historial de lo ya enseñado (NO repitas nada de esto):
"""
${textHistory}
"""

Genera la CONTINUACIÓN con un nuevo concepto/acorde más avanzado.

REGLAS:
- Nomenclatura: dedos 1-4, p/i/m/a/e.
- Equivalencia de Acordes: Es OBLIGATORIO que siempre incluyas la nomenclatura latina y anglosajona juntas (ej. "Sol Mayor (G)").
- NUNCA expliques con texto en qué cuerda o traste va cada dedo. El motor lo dibuja solo.
- NUNCA dibujes esquemas ASCII. Para mostrar acordes o punteos, inserta EXACTAMENTE esto: 
  - Acordes: <div class="theory-chord-card" data-chord="C"></div> (cambiando "C").
  - Punteos: <div class="theory-chord-card" data-note="6-3"></div> (cuerda-traste).
- ¡Prohibido poner botones de Escuchar! El sistema los crea solos.
- Solo HTML crudo. Sin markdown. Sin repetir conceptos del historial.`;

  const content = await callGroq(apiKey, prompt, 0.5, 2500, systemMsg, false);
  let cleanContent = content;
  if (cleanContent.startsWith('```html')) cleanContent = cleanContent.substring(7);
  if (cleanContent.startsWith('```')) cleanContent = cleanContent.substring(3);
  if (cleanContent.endsWith('```')) cleanContent = cleanContent.substring(0, cleanContent.length - 3);
  
  return cleanContent.trim();
}

export async function fetchPracticeLevel(apiKey, style, level) {
  if (!apiKey) throw new Error("No API Key provided");
  
  const fretGuidance = level <= 2
    ? `Nivel ${level}: usa acordes abiertos (trastes I-III) y algún acorde con cejilla simple.`
    : level <= 5
    ? `Nivel ${level}: DEBES incluir al menos 1 acorde con cejilla en trastes altos (III-VII). Mezcla abiertos con barre chords.`
    : `Nivel ${level}: DEBES usar acordes avanzados con cejillas en trastes V-XII. Incluye power chords, acordes con séptima, o posiciones avanzadas.`;

  const styleGuidance = style.toLowerCase() === 'clásico' 
    ? "ESTILO CLÁSICO: Fomenta el uso de arpegios (p-i-m-a), acordes complejos como maj7, dim, m7b5 o aug, y progresiones armónicas de música clásica o jazz." 
    : "";

  const systemMsg = `Eres el profesor de guitarra de QGHERO. Generas lecciones con trastes REALES y correctos para cada acorde. ${fretGuidance} ${styleGuidance}`;

  const prompt = `
Genera la lección de ${style.toUpperCase()} NIVEL ${level} para guitarra acústica.
${fretGuidance}

FORMATO JSON obligatorio (rellena con acordes REALES del estilo ${style}):
{
  "title": "<Nombre creativo del nivel>",
  "desc": "<Descripción motivadora>",
  "rightHand": "<Técnica de mano derecha, usa púa (↓/↑/Palm Mute) o dedos (p/i/m/a)>",
  "chords": [
    {
      "name": "<nombre real del acorde en formato anglosajón, ej: C, Dm, G7>"
    }
  ],
  "examples": [
    {
      "song": "<canción famosa REAL que use estos acordes>",
      "rhythm": "<patrón rítmico real>",
      "progression": "<progresión real de la canción>"
    }
  ]
}

REGLAS:
1. Genera 2-4 acordes DISTINTOS y apropiados para el estilo ${style} nivel ${level}.
2. examples = 1-2 canciones famosas REALES que usen exactamente estos acordes.
3. Sin saltos de línea reales en strings de texto. Sin markdown. Solo JSON puro.`;

  return callGroq(apiKey, prompt, 0.4, 2500, systemMsg, true);
}

export async function fetchPracticeSong(apiKey, songName) {
  if (!apiKey) throw new Error("No API Key provided");
  
  const systemMsg = `Eres un profesor de guitarra experto. Eres especialista en dibujar tablaturas. Tu regla de oro es anatómica: un dedo (2, 3 o 4) JAMÁS se repite en dos cuerdas a la vez. Solo el dedo 1 puede repetir si hace cejilla. Proporcionas acordes REALES con los trastes EXACTOS.`;

  const prompt = `
Analiza la canción "${songName}" y enséñale al usuario los acordes REALES para tocarla en guitarra.

FORMATO JSON obligatorio (rellena con los acordes REALES de "${songName}", NO copies valores genéricos):
{
  "title": "A la Carta: ${songName}",
  "desc": "<por qué esta canción es interesante para aprender>",
  "rightHand": "<técnica de mano derecha REAL de esta canción: rasgueo, punteo, arpegio... con p/i/m/a/e>",
  "chords": [
    {
      "name": "<acorde real de la canción>",
      "notes": ["<notas reales de Tone.js>"],
      "finger": "<explicación real de dedos 1-4>",
      "schema": [
        "<Nombre acorde real> [posición real]:",
        "TS      <trastes reales romanos>",
        "E (1) <O/X/->---|<O/X/->---|<O/X/->---",
        "B (2) <O/X/->---|<O/X/->---|<O/X/->---",
        "G (3) <O/X/->---|<O/X/->---|<O/X/->---",
        "D (4) <O/X/->---|<O/X/->---|<O/X/->---",
        "A (5) <O/X/->---|<O/X/->---|<O/X/->---",
        "E (6) <O/X/->---|<O/X/->---|<O/X/->---"
      ]
    }
  ],
  "examples": [
    {
      "song": "<parte de la canción: Intro / Verso / Estribillo>",
      "rhythm": "<patrón rítmico real de esa parte>",
      "progression": "<progresión de acordes real de esa parte>"
    }
  ]
}

REGLAS:
1. TRASTES REALES: Cada acorde debe tener sus trastes correctos. Si "${songName}" usa un Fa# menor con cejilla en traste II → "TS      Ⅱ   Ⅲ   Ⅳ". Si usa La Mayor barre en traste V → "TS      Ⅴ   Ⅵ   Ⅶ". Analiza la canción REAL.
2. Genera TODOS los acordes distintos que usa la canción (típicamente 3-6).
3. examples: describe la estructura real (intro usa X→Y, verso usa Y→Z, estribillo...).
4. notes = notas de Tone.js REALES de cada acorde.
5. DEDOS LÓGICOS: Un dedo (2, 3, 4) no puede pisar dos cuerdas a la vez. Solo el dedo 1 hace cejilla.
6. Sin saltos de línea reales en strings. Sin markdown. Solo JSON puro.`;

  return callGroq(apiKey, prompt, 0.4, 2500, systemMsg, true);
}

// Registro de modelos dados de baja o inaccesibles durante la sesión actual
const decommissionedModels = new Set(
  (() => {
    try {
      return JSON.parse(sessionStorage.getItem('qghero_decommissioned_models') || '[]');
    } catch (e) {
      return [];
    }
  })()
);

function markModelDecommissioned(modelId) {
  if (!modelId) return;
  decommissionedModels.add(modelId);
  try {
    sessionStorage.setItem('qghero_decommissioned_models', JSON.stringify([...decommissionedModels]));
  } catch (e) {}
}

let activeModelsCache = null;
let lastModelsFetchTime = 0;
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutos de caché

// Modelos de respaldo ordenados por preferencia (producción y soporte de texto general)
const DEFAULT_FALLBACK_MODELS = [
  'llama-3.3-70b-versatile',
  'openai/gpt-oss-120b',
  'qwen/qwen3-32b',
  'meta-llama/llama-4-scout-17b-16e-instruct',
  'llama3-70b-8192',
  'llama3-8b-8192',
  'mixtral-8x7b-32768',
  'gemma2-9b-it'
];

/**
 * Consulta la lista de modelos activos en Groq para la API Key dada.
 * Filtra los modelos no aptos (audio, guardrails, embeddings, etc.)
 * y prioriza los modelos de texto/chat más idóneos.
 */
export async function fetchActiveGroqModels(apiKey, forceRefresh = false) {
  const now = Date.now();
  if (!forceRefresh && activeModelsCache && (now - lastModelsFetchTime < CACHE_TTL_MS)) {
    const valid = activeModelsCache.filter(m => !decommissionedModels.has(m.id));
    if (valid.length > 0) return valid;
  }

  try {
    const response = await fetch('https://api.groq.com/openai/v1/models', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    });

    if (response.ok) {
      const data = await response.json();
      if (data && Array.isArray(data.data)) {
        // Patrones que NO son modelos de chat/texto de propósito general
        const excludedPatterns = [
          /whisper/i,
          /tts/i,
          /orpheus/i,
          /guard/i,
          /safeguard/i,
          /moderation/i,
          /embed/i
        ];

        // Preferencia de modelos LLM ordenados de más capaz a menor
        const priorityPatterns = [
          /llama-3\.3-70b/i,
          /llama-4/i,
          /gpt-oss-120b/i,
          /gpt-oss-20b/i,
          /gpt-oss/i,
          /qwen3/i,
          /qwen/i,
          /llama-3\.1-70b/i,
          /llama3-70b/i,
          /llama-3\.1-8b/i,
          /llama3-8b/i,
          /llama-3\.2/i,
          /mixtral/i,
          /gemma2/i
        ];

        const eligible = data.data.filter(m => {
          if (!m || !m.id) return false;
          if (m.active === false) return false;
          const id = m.id.toLowerCase();
          if (excludedPatterns.some(pat => pat.test(id))) return false;
          if (decommissionedModels.has(m.id)) return false;
          return true;
        });

        eligible.sort((a, b) => {
          const getPrio = (id) => {
            const idx = priorityPatterns.findIndex(pat => pat.test(id));
            return idx !== -1 ? idx : 999;
          };
          const prioA = getPrio(a.id);
          const prioB = getPrio(b.id);
          if (prioA !== prioB) return prioA - prioB;
          return (b.context_window || 0) - (a.context_window || 0);
        });

        if (eligible.length > 0) {
          activeModelsCache = eligible;
          lastModelsFetchTime = now;
          console.log(`[Groq API] Modelos activos detectados (${eligible.length}):`, eligible.map(m => m.id));
          return eligible;
        }
      }
    } else {
      console.warn(`[Groq API] Consulta a /models retornó status ${response.status}`);
    }
  } catch (err) {
    console.warn("[Groq API] Error conectando con /models:", err);
  }

  // Si falló la consulta o no hubo resultados, usar lista de respaldo excluyendo los no válidos
  return DEFAULT_FALLBACK_MODELS
    .filter(id => !decommissionedModels.has(id))
    .map(id => ({ id }));
}

/**
 * Retorna el mejor modelo activo disponible en este momento.
 */
export async function getBestActiveModel(apiKey, forceRefresh = false) {
  const models = await fetchActiveGroqModels(apiKey, forceRefresh);
  if (models && models.length > 0) {
    return models[0].id;
  }
  return DEFAULT_FALLBACK_MODELS[0];
}

/**
 * Extracción y parseo seguro de respuestas JSON de la IA.
 */
function safeJsonParse(content) {
  let cleaned = (content || '').trim();
  if (cleaned.startsWith('```json')) cleaned = cleaned.substring(7);
  else if (cleaned.startsWith('```')) cleaned = cleaned.substring(3);
  if (cleaned.endsWith('```')) cleaned = cleaned.substring(0, cleaned.length - 3);
  cleaned = cleaned.trim();

  try {
    return JSON.parse(cleaned);
  } catch (err) {
    // Intenta extraer el bloque JSON externo {...}
    const firstBrace = cleaned.indexOf('{');
    const lastBrace = cleaned.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      try {
        return JSON.parse(cleaned.substring(firstBrace, lastBrace + 1));
      } catch (innerErr) {}
    }

    // Intenta extraer array JSON [...]
    const firstBracket = cleaned.indexOf('[');
    const lastBracket = cleaned.lastIndexOf(']');
    if (firstBracket !== -1 && lastBracket !== -1 && lastBracket > firstBracket) {
      try {
        return JSON.parse(cleaned.substring(firstBracket, lastBracket + 1));
      } catch (innerErr) {}
    }

    throw new Error(`Error procesando respuesta JSON de la IA: ${err.message}`);
  }
}

async function callGroq(apiKey, prompt, temperature = 0.1, maxTokens = 3500, systemMsg = '', expectJson = true) {
  const maxRetries = 3;
  let modelAttempt = 0;
  const maxModelChanges = 3;

  // Seleccionar automáticamente el mejor modelo activo actual
  let currentModel = await getBestActiveModel(apiKey);
  let useJsonFormat = expectJson;

  while (modelAttempt < maxModelChanges) {
    let attempt = 0;
    let switchedModel = false;

    while (attempt < maxRetries) {
      try {
        const messages = [];
        if (systemMsg) {
          messages.push({ role: 'system', content: systemMsg });
        }
        messages.push({ role: 'user', content: prompt });

        const body = {
          model: currentModel,
          messages: messages,
          temperature: temperature,
          max_tokens: maxTokens
        };

        if (useJsonFormat) {
          body.response_format = { type: "json_object" };
        }

        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(body)
        });

        // 1. Manejo de Rate Limit (429)
        if (response.status === 429) {
          const errText = await response.text();
          const match = errText.match(/try again in ([\d\.]+)s/);
          const waitMs = match ? Math.ceil(parseFloat(match[1])) * 1000 + 1000 : 15000;
          console.warn(`[Groq API] Límite alcanzado (429). Esperando ${waitMs}ms antes de reintentar... (Intento ${attempt + 1}/${maxRetries})`);
          
          window.dispatchEvent(new CustomEvent('ai-waiting', { detail: { waitMs } }));
          await new Promise(r => setTimeout(r, waitMs));
          attempt++;
          continue;
        }

        // 2. Errores HTTP
        if (!response.ok) {
          const errText = await response.text();
          console.error(`[Groq API] Error ${response.status} en modelo "${currentModel}":`, errText);

          let isModelError = false;
          let isJsonFormatError = false;

          try {
            const errObj = JSON.parse(errText);
            const errCode = errObj?.error?.code;
            const errMsg = (errObj?.error?.message || '').toLowerCase();

            if (
              response.status === 404 ||
              errCode === 'model_not_found' ||
              errCode === 'model_decommissioned' ||
              errMsg.includes('does not exist') ||
              errMsg.includes('not have access') ||
              errMsg.includes('decommissioned') ||
              errMsg.includes('model not found')
            ) {
              isModelError = true;
            }

            if (errMsg.includes('response_format') || errMsg.includes('json_object') || errCode === 'json_validate_failed') {
              isJsonFormatError = true;
            }
          } catch (e) {
            if (response.status === 404 || errText.includes('model_not_found') || errText.includes('does not exist')) {
              isModelError = true;
            }
          }

          // Si el modelo está obsoleto o no existe en la cuenta, cambiarlo de inmediato a uno activo
          if (isModelError) {
            markModelDecommissioned(currentModel);
            console.warn(`[Groq API] El modelo "${currentModel}" no está activo o fue descontinuado. Buscando otro modelo activo en Groq...`);
            currentModel = await getBestActiveModel(apiKey, true);
            console.log(`[Groq API] Cambiando automáticamente al modelo: ${currentModel}`);
            switchedModel = true;
            break; // Romper bucle de intentos y probar el nuevo modelo
          }

          // Si el modelo no soporta response_format json_object, reintentar con extracción de JSON limpia
          if (isJsonFormatError && useJsonFormat) {
            console.warn(`[Groq API] El modelo "${currentModel}" no soporta response_format json_object. Reintentando con extracción directa...`);
            useJsonFormat = false;
            continue;
          }

          throw new Error(`API Error ${response.status}: ${errText}`);
        }

        const data = await response.json();
        if (!data.choices || !data.choices[0] || !data.choices[0].message) {
          throw new Error("Respuesta incompleta de Groq API: sin choices.");
        }

        let content = data.choices[0].message.content.trim();

        // Avisar a la UI que ya hemos reanudado si veníamos de una pausa por rate limit
        if (attempt > 0) {
          window.dispatchEvent(new CustomEvent('ai-resumed'));
        }

        if (expectJson) {
          return safeJsonParse(content);
        }
        return content;

      } catch (error) {
        if (attempt >= maxRetries - 1) {
          console.error(`[Groq API] Error persistente tras reintentos con modelo "${currentModel}":`, error);
          throw error;
        }
        await new Promise(r => setTimeout(r, 2000));
        attempt++;
      }
    }

    if (switchedModel) {
      modelAttempt++;
      continue;
    }

    break;
  }

  throw new Error("Límite de reintentos superado al contactar con la IA.");
}

export async function parseNaturalChordQuery(apiKey, query) {
  if (!apiKey) throw new Error("No API Key provided");

  const systemMsg = `Eres un asistente experto en teoría musical. Tu ÚNICO objetivo es extraer o inferir el nombre del acorde de guitarra que el usuario pide en lenguaje natural.`;

  const prompt = `
El usuario ha dicho lo siguiente: "${query}"

Extrae el acorde que quiere aprender.
Devuelve ÚNICAMENTE un JSON con la clave "chord" que contenga el nombre del acorde en formato anglosajón estándar.
Ejemplos de lo que debes devolver: {"chord": "C"}, {"chord": "Dm7"}, {"chord": "F#maj7"}
Si el usuario dice "do mayor séptima", devuelve: {"chord": "Cmaj7"}
Si pide algo que no es un acorde, devuelve: {"chord": "UNKNOWN"}

Devuelve SOLO JSON puro.`;

  const response = await callGroq(apiKey, prompt, 0.1, 50, systemMsg, true);
  return response.chord ? response.chord.trim() : "UNKNOWN";
}

export async function fetchChordAdvice(apiKey, chordName) {
  if (!apiKey) throw new Error("No API Key provided");

  const systemMsg = `Eres un profesor de guitarra. El usuario quiere aprender el acorde ${chordName}. Dale un consejo rápido y muy útil.`;
  const prompt = `
Da un único consejo de 1 o 2 líneas sobre cómo colocar la mano, cómo hacer que suene bien, o un truco para el acorde ${chordName}.
NO uses saludos. NO uses introducciones. Ve directo al consejo.
Devuelve ÚNICAMENTE un JSON con la clave "advice" que contenga el consejo.
Ejemplo: {"advice": "Acerca más el pulgar al centro del mástil para tener más fuerza en la cejilla."}`;

  try {
    const response = await callGroq(apiKey, prompt, 0.7, 100, systemMsg, true);
    return response.advice ? response.advice : "";
  } catch (err) {
    console.error("Error fetching chord advice", err);
    return "";
  }
}
