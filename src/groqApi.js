export async function fetchSongData(apiKey, songName) {
  if (!apiKey) throw new Error("No API Key provided");
  if (!songName) throw new Error("No song name provided");

  const systemMsg = `Eres un maestro de guitarra acústica con 30 años de experiencia. Conoces a la perfección los acordes, trastes y posiciones REALES de miles de canciones. Cuando analizas una canción, usas los trastes EXACTOS donde se toca cada acorde en la realidad, NUNCA los mismos trastes genéricos para todas las canciones. Cada canción es diferente.`;

  const prompt = `
Analiza la canción "${songName}" y devuelve un JSON puro con su estructura musical REAL para guitarra.

FORMATO OBLIGATORIO del JSON (rellena con los datos REALES de "${songName}", NO copies los valores de ejemplo):
{
  "title": "<título real>",
  "artist": "<artista real>",
  "bpm": <BPM real de la canción>,
  "technique": {
    "hands": "<posición real de manos para ESTA canción>",
    "rhythm": "<patrón rítmico real: rasgueo, punteo, arpegio...>",
    "effects": "<efectos reales: distorsión, limpio, palm mute...>",
    "schema": [
      "<nombre acorde 1> [posición real]:",
      "TS      <traste_inicio>   <traste_inicio+1>   <traste_inicio+2>",
      "E (1) <posición real en esta cuerda>",
      "B (2) <posición real>",
      "G (3) <posición real>",
      "D (4) <posición real>",
      "A (5) <posición real>",
      "E (6) <posición real>"
    ]
  },
  "notes": [
    { "time": <segundos>, "duration": <seg>, "string": <1-6>, "fret": <TRASTE REAL 0-24>, "finger": <1-4>, "latin": "<nombre latino>", "anglo": "<nombre anglo>" }
  ]
}

REFERENCIA DE FORMATO (esto es solo para que entiendas la estructura, NO copies estos acordes ni estos trastes):
- Acorde abierto (ej. Mi menor, trastes 0-3): TS usa Ⅰ Ⅱ Ⅲ, cuerdas con O/X/números
- Cejilla en traste II (ej. Fa#m): TS usa Ⅱ Ⅲ Ⅳ
- Cejilla en traste V (ej. La Mayor barre): TS usa Ⅴ Ⅵ Ⅶ
- Power chord traste VII: TS usa Ⅶ Ⅷ Ⅸ
- Símbolos: O = al aire, X = no tocar, 1-4 = dedo que pisa

INSTRUCCIONES CRÍTICAS:
1. TRASTES: Analiza "${songName}" y usa los trastes donde REALMENTE se toca. "Entre Dos Tierras" usa power chords en trastes V, VII. "Wonderwall" usa trastes I-III. "Hotel California" usa trastes I-IV y VII. Cada canción es diferente. El fret del array notes DEBE coincidir con los trastes del esquema.
2. SCHEMA CRONOLÓGICO: El array 'schema' sigue el orden de 'notes'. Primera aparición de un acorde = esquema completo. Repeticiones = solo "Nombre (X) - Repetición".
3. NOTAS: Genera mínimo 16 notas (4 compases de intro). El BPM debe ser el real de la canción.
4. STRINGS: hands/rhythm/effects son strings simples, sin saltos de línea reales. Usa \\\\n si necesitas separar.
5. Devuelve SÓLO JSON puro, sin markdown.`;

  return callGroq(apiKey, prompt, 0.1, 3500, systemMsg);
}

export async function expandGameSong(apiKey, songName, lastTime) {
  if (!apiKey) throw new Error("No API Key provided");

  const systemMsg = `Eres un maestro de guitarra. Continúas generando los acordes REALES de canciones conocidas con trastes correctos. NUNCA generas trastes genéricos.`;

  const prompt = `
Continúa la canción "${songName}" desde el segundo ${lastTime}.
Genera la SIGUIENTE sección (al menos 16 notas, 4 compases más) con los acordes REALES que siguen en la canción.

FORMATO JSON obligatorio (rellena con datos REALES, NO copies estos valores):
{
  "new_schemas": [
    "<si el acorde ya apareció antes>: Nombre (X) - Repetición",
    "<si es nuevo, esquema completo de 8 líneas con trastes reales>"
  ],
  "notes": [
    { "time": <mayor que ${lastTime}>, "duration": <seg>, "string": <1-6>, "fret": <TRASTE REAL>, "finger": <1-4>, "latin": "<nota>", "anglo": "<nota>" }
  ]
}

REGLAS:
1. Los "time" DEBEN ser estrictamente mayores que ${lastTime} y ascendentes.
2. Los "fret" deben ser los trastes REALES de la canción. Si la siguiente sección usa un acorde en traste V, pon fret:5. NO pongas siempre 1, 2, 3.
3. La fila "TS" del esquema debe mostrar los trastes reales (ej. "TS      Ⅴ   Ⅵ   Ⅶ" para un acorde en traste V).
4. Acordes ya vistos = solo "Nombre - Repetición". Acordes nuevos = esquema ASCII completo de 8 líneas.
5. Sin saltos de línea reales en strings. Sin markdown. Solo JSON puro.`;

  return callGroq(apiKey, prompt, 0.1, 2500, systemMsg);
}

export async function fetchTheoryCourse(apiKey, level) {
  if (!apiKey) throw new Error("No API Key provided");
  
  const systemMsg = `Eres un profesor de guitarra experto. Generas clases con esquemas ASCII que SIEMPRE muestran los trastes REALES de cada acorde. Nunca usas los mismos trastes para todos los acordes.`;

  const prompt = `
Genera una clase magistral de guitarra para el nivel "${level}" en HTML básico (h3, p, ul, strong).

NOMENCLATURA OBLIGATORIA:
- Mano izquierda: dedos 1 (índice), 2 (medio), 3 (anular), 4 (meñique). REGLA: cada dedo pisa UN traste (salvo cejilla).
- Mano derecha: p (pulgar), i (índice), m (medio), a (anular), e (meñique).
- Cuerdas: 1 (fina) a 6 (gruesa). O = al aire, X = silenciada.
- Acordes: siempre en ambas nomenclaturas (ej. "Do Mayor (C)").

ESQUEMAS ASCII - FORMATO (cada acorde debe tener su propio esquema con sus trastes REALES):
<pre class="ascii-schema">
TS      <traste_real>   <traste_real+1>   <traste_real+2>
E (1) <O/X/1-4>---|---|---
B (2) ...
G (3) ...
D (4) ...
A (5) ...
E (6) ...
</pre>

EJEMPLOS de trastes reales (NO copies, genera los que correspondan al nivel):
- Mi menor (Em): TS Ⅰ Ⅱ Ⅲ (acorde abierto en trastes 1-3)
- Fa Mayor (F): TS Ⅰ Ⅱ Ⅲ (cejilla en traste I)
- Si menor (Bm): TS Ⅱ Ⅲ Ⅳ (cejilla en traste II)
- La Mayor barre: TS Ⅴ Ⅵ Ⅶ (cejilla en traste V)
- Do# menor: TS Ⅳ Ⅴ Ⅵ (cejilla en traste IV)
- Mi Mayor traste VII: TS Ⅶ Ⅷ Ⅸ (cejilla en traste VII)

JUSTO DEBAJO de cada esquema, incluye un botón con las notas reales de Tone.js:
<button class="btn primary-btn play-chord-btn" data-notes='["<nota1>", "<nota2>", ...]'>🔊 Escuchar</button>

CONTENIDO:
- Introducción motivadora
- Explicaciones claras de cómo pisar los trastes
- Mínimo 2 acordes con esquemas ASCII completos (con trastes REALES de cada acorde)
- Un ejercicio práctico
- Solo HTML crudo, sin markdown ni backticks`;

  const content = await callGroq(apiKey, prompt, 0.5, 3500, systemMsg);
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

  const systemMsg = `Eres un profesor de guitarra experto. Generas clases con esquemas ASCII que SIEMPRE muestran los trastes REALES de cada acorde. Nunca repites contenido ya enseñado.`;

  const prompt = `
Continúa la clase de guitarra nivel "${level}". 
Historial de lo ya enseñado (NO repitas nada de esto):
"""
${textHistory}
"""

Genera la CONTINUACIÓN con un nuevo concepto/acorde más avanzado.

REGLAS:
- Nomenclatura: dedos 1-4, p/i/m/a/e, cuerdas 1-6, O/X.
- Acordes en ambas nomenclaturas (ej. "Sol Mayor (G)").
- Cada esquema ASCII en <pre class="ascii-schema"> con 8 líneas: cabecera TS con trastes REALES + 6 cuerdas.
- Si enseñas un acorde con cejilla en traste V, la fila TS es "TS      Ⅴ   Ⅵ   Ⅶ". NO uses siempre Ⅰ Ⅱ Ⅲ.
- Debajo de cada esquema, botón: <button class="btn primary-btn play-chord-btn" data-notes='["<notas_reales>"]'>🔊 Escuchar</button>
- Solo HTML crudo. Sin markdown. Sin repetir conceptos del historial.`;

  const content = await callGroq(apiKey, prompt, 0.5, 3500, systemMsg);
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

  const systemMsg = `Eres el profesor de guitarra de QGHERO. Generas lecciones con trastes REALES y correctos para cada acorde. ${fretGuidance}`;

  const prompt = `
Genera la lección de ${style.toUpperCase()} NIVEL ${level} para guitarra acústica.
${fretGuidance}

FORMATO JSON obligatorio (rellena con acordes REALES del estilo ${style}, NO copies los valores del ejemplo):
{
  "title": "<Nombre creativo del nivel>",
  "desc": "<Descripción motivadora>",
  "rightHand": "<Técnica de mano derecha para este nivel, usa p/i/m/a/e>",
  "chords": [
    {
      "name": "<nombre real del acorde>",
      "notes": ["<notas reales de Tone.js>"],
      "finger": "<explicación real de dedos 1-4>",
      "schema": [
        "<Nombre acorde> [posición real]:",
        "TS      <trastes reales en romanos>",
        "E (1) <posición real>",
        "B (2) <posición real>",
        "G (3) <posición real>",
        "D (4) <posición real>",
        "A (5) <posición real>",
        "E (6) <posición real>"
      ]
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

REFERENCIA de trastes (NO copies, usa los que correspondan a cada acorde):
- Acordes abiertos (Am, Em, C, G, D): TS con Ⅰ Ⅱ Ⅲ
- Fa Mayor (F) cejilla traste I: TS con Ⅰ Ⅱ Ⅲ
- Si menor (Bm) cejilla traste II: TS con Ⅱ Ⅲ Ⅳ
- Do menor (Cm) cejilla traste III: TS con Ⅲ Ⅳ Ⅴ
- La barre traste V: TS con Ⅴ Ⅵ Ⅶ
- Power chord traste VII: TS con Ⅶ Ⅷ Ⅸ

REGLAS:
1. Genera 2-4 acordes DISTINTOS y apropiados para el estilo ${style} nivel ${level}.
2. notes = notas de Tone.js REALES del acorde (ej. ["A2","E3","A3","C#4","E4"] para La Mayor).
3. examples = 1-2 canciones famosas REALES que usen exactamente estos acordes.
4. Sin saltos de línea reales en strings de texto. Sin markdown. Solo JSON puro.`;

  return callGroq(apiKey, prompt, 0.4, 3500, systemMsg);
}

export async function fetchPracticeSong(apiKey, songName) {
  if (!apiKey) throw new Error("No API Key provided");
  
  const systemMsg = `Eres un profesor de guitarra experto. Cuando analizas una canción específica, proporcionas los acordes REALES con los trastes EXACTOS donde se tocan.`;

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
        "E (1) <pos real>",
        "B (2) <pos real>",
        "G (3) <pos real>",
        "D (4) <pos real>",
        "A (5) <pos real>",
        "E (6) <pos real>"
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
5. Sin saltos de línea reales en strings. Sin markdown. Solo JSON puro.`;

  return callGroq(apiKey, prompt, 0.4, 3500, systemMsg);
}

async function callGroq(apiKey, prompt, temperature = 0.1, maxTokens = 3500, systemMsg = '') {
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
    
    if (temperature !== 0.5) { // 0.5 is HTML for Theory Course
        return JSON.parse(content);
    }
    return content;
  } catch (error) {
    console.error("Groq API Error:", error);
    throw error;
  }
}
