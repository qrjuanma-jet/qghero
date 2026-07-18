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

  return callGroq(apiKey, prompt, 0.1, 2000, systemMsg);
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

  return callGroq(apiKey, prompt, 0.1, 2000, systemMsg);
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
ESQUEMAS DE ACORDES - REGLAS ESTRICTAS:
- NUNCA intentes dibujar esquemas ASCII.
- NUNCA expliques con texto en qué cuerda o traste va cada dedo (sueles cometer errores al explicar la geometría). Céntrate en la teoría, de qué notas se compone y cómo debe sonar. Indica al alumno que se fije en la viñeta gráfica generada.
- OBLIGATORIO: Cuando quieras enseñar un acorde (ej. Do Mayor, Sol, Re menor, Fa#), inserta EXACTAMENTE este código HTML para que el sistema dibuje la viñeta perfecta:
<div class="theory-chord-card" data-chord="C"></div>
- SUSTITUYE "C" por el nombre del acorde en formato anglosajón o latino (ej. "Dm", "G", "Do Mayor", "Fa#m").
- ¡ESTO ES MUY IMPORTANTE! Si no pones este <div>, el alumno no podrá ver ni escuchar el acorde. No pongas ningún botón "Escuchar" a mano, el sistema lo generará automáticamente.

CONTENIDO:
- Introducción motivadora
- Explicaciones claras de cómo pisar los trastes
- Mínimo 2 acordes explicados, insertando su respectivo <div class="theory-chord-card" data-chord="..."></div>
- Un ejercicio práctico
- Solo HTML crudo, sin markdown ni backticks`;

  const content = await callGroq(apiKey, prompt, 0.5, 2500, systemMsg);
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
- Equivalencia de Acordes: Es OBLIGATORIO que siempre incluyas la nomenclatura latina y anglosajona juntas (ej. "Sol Mayor (G)", "La menor (Am)"). ¡Nunca pongas solo la letra!
- NUNCA expliques con texto en qué cuerda o traste va cada dedo. El motor lo dibuja solo.
- NUNCA dibujes esquemas ASCII. Para mostrar un acorde, inserta EXACTAMENTE esto: <div class="theory-chord-card" data-chord="C"></div> (cambiando "C" por el acorde correspondiente).
- ¡Prohibido poner botones de Escuchar! El sistema los crea solos.
- Solo HTML crudo. Sin markdown. Sin repetir conceptos del historial.`;

  const content = await callGroq(apiKey, prompt, 0.5, 2500, systemMsg);
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

  return callGroq(apiKey, prompt, 0.4, 2500, systemMsg);
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

  return callGroq(apiKey, prompt, 0.4, 2500, systemMsg);
}

async function callGroq(apiKey, prompt, temperature = 0.1, maxTokens = 3500, systemMsg = '') {
  let attempt = 0;
  const maxRetries = 3;

  while (attempt < maxRetries) {
    try {
      const messages = [];
      if (systemMsg) {
        messages.push({ role: 'system', content: systemMsg });
      }
      messages.push({ role: 'user', content: prompt });

      const body = {
          model: 'llama-3.1-8b-instant',
          messages: messages,
          temperature: temperature,
          max_tokens: maxTokens
      };
      if (temperature !== 0.5) {
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

      if (response.status === 429) {
        const errText = await response.text();
        const match = errText.match(/try again in ([\d\.]+)s/);
        const waitMs = match ? Math.ceil(parseFloat(match[1])) * 1000 + 1000 : 15000;
        console.warn(`[Groq API] Límite alcanzado (429). Esperando ${waitMs}ms antes de reintentar... (Intento ${attempt + 1}/${maxRetries})`);
        
        // Disparar evento para que la UI pueda mostrar que estamos esperando
        const event = new CustomEvent('ai-waiting', { detail: { waitMs } });
        window.dispatchEvent(event);

        await new Promise(r => setTimeout(r, waitMs));
        attempt++;
        continue;
      }

      if (!response.ok) {
        const errText = await response.text();
        console.error("Groq Error Response:", errText);
        throw new Error(`API Error ${response.status}: ${errText}`);
      }

      const data = await response.json();
      let content = data.choices[0].message.content.trim();
      
      // Clean JSON markdown if model outputs it
      if (content.startsWith('```json')) content = content.substring(7);
      if (content.startsWith('```')) content = content.substring(3);
      if (content.endsWith('```')) content = content.substring(0, content.length - 3);
      
      // Avisar a la UI que ya hemos reanudado
      if (attempt > 0) {
        window.dispatchEvent(new CustomEvent('ai-resumed'));
      }

      if (temperature !== 0.5) { // 0.5 is HTML for Theory Course
          return JSON.parse(content);
      }
      return content;
    } catch (error) {
      if (attempt >= maxRetries - 1) {
        console.error("Groq API Error after retries:", error);
        throw error;
      }
      // Si es un error de red u otro, esperar un poco y reintentar
      await new Promise(r => setTimeout(r, 2000));
      attempt++;
    }
  }
  throw new Error("Límite de reintentos superado al contactar con la IA.");
}

export async function parseNaturalChordQuery(apiKey, query) {
  if (!apiKey) throw new Error("No API Key provided");

  const systemMsg = `Eres un asistente experto en teoría musical. Tu ÚNICO objetivo es extraer o inferir el nombre del acorde de guitarra que el usuario pide en lenguaje natural.`;

  const prompt = `
El usuario ha dicho lo siguiente: "${query}"

Extrae el acorde que quiere aprender.
Devuelve ÚNICAMENTE el nombre del acorde en formato anglosajón estándar, sin espacios, sin comillas, sin signos de puntuación extra.
Ejemplos de lo que debes devolver: C, Dm7, F#maj7, Gaug, Bdim.
Si el usuario dice "do mayor séptima", devuelve: Cmaj7
Si el usuario dice "el acorde triste de mi", devuelve: Em
Si el usuario dice "sol séptima", devuelve: G7

Si pide algo que no es un acorde en absoluto, devuelve: UNKNOWN

Devuelve SOLO la cadena corta (ej: "Am7"). Ni una palabra más.`;

  const response = await callGroq(apiKey, prompt, 0.1, 10, systemMsg);
  return response.trim();
}
