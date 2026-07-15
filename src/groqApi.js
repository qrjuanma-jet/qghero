export async function fetchSongData(apiKey, songName) {
  if (!apiKey) throw new Error("No API Key provided");
  if (!songName) throw new Error("No song name provided");

  const prompt = `
Eres un maestro de guitarra acústica.
El usuario quiere tocar la canción "${songName}".
Devuelve un JSON puro (sin formato markdown) con la estructura musical.
Debe tener exactamente esta estructura:
{
  "title": "Nombre de la canción",
  "artist": "Artista",
  "bpm": 120,
  "technique": {
    "hands": "Explicación detallada de la posición de la mano izquierda (cejillas, acordes abiertos). Usa números 1-4 para dedos, T/P para pulgar. ¡REGLA DE ORO: JAMÁS asignes el mismo dedo a diferentes cuerdas en distintos trastes (salvo cejillas)! Cada nota distinta debe usar un dedo diferente.",
    "rhythm": "Explicación del punteo/rasgueo. Usa p,i,m,a,e para los dedos de la mano derecha.",
    "effects": "Efectos especiales o percusión.",
    "schema": [
      "La menor (Am) [trastes I-III, acorde abierto]:",
      "TS      Ⅰ   Ⅱ   Ⅲ",
      "E (1) O---|---|---",
      "B (2) |-1-|---|---",
      "G (3) |---|-2-|---",
      "D (4) |---|-3-|---",
      "A (5) O---|---|---",
      "E (6) X---|---|---",
      "",
      "La Mayor barre (A) [cejilla en traste V]:",
      "TS      Ⅴ   Ⅵ   Ⅶ",
      "E (1) 1---|---|---",
      "B (2) 1---|---|---",
      "G (3) 1---|---|---",
      "D (4) 1---|-3-|---",
      "A (5) 1---|-3-|---",
      "E (6) 1---|---|---"
    ]
  },
  "notes": [
    { "time": 1.0, "duration": 1.5, "string": 6, "fret": 3, "finger": 2, "latin": "Sol", "anglo": "G" }
  ]
}

Genera al menos 16 notas iniciales (una progresión o intro completa, aprox 4 compases).

REGLAS ESTRICTAS PARA EL JSON:
1. ¡CRÍTICO PARA LOS TRASTES EN 'schema'!: La fila "TS" de cada esquema DEBE indicar los trastes REALES del acorde. Si el acorde usa los trastes IV, V y VI, escribe "TS      Ⅳ   Ⅴ   Ⅵ". Si usa trastes I, II, III, escribe "TS      Ⅰ   Ⅱ   Ⅲ". NO siempre uses Ⅰ Ⅱ Ⅲ para todos los acordes, eso sería incorrecto.
2. ¡CRÍTICO PARA 'schema'!: El array 'schema' DEBE ser una lista CRONOLÓGICA EXACTA de todos los acordes o notas que suenan en el array 'notes', en el mismo orden. Para la PRIMERA vez que aparece un acorde/nota, dibuja su esquema ASCII completo (6 cuerdas). Si el acorde/nota SE REPITE más adelante, escribe solo su nombre (ej. 'Re Mayor (D) - Repetición').
3. ¡PROHIBIDO usar saltos de línea físicos (Enter) dentro de los valores de texto ("hands", "rhythm", "effects", etc)! Si necesitas separar párrafos, escribe literalmente los caracteres \\\\n.
4. Devuelve SÓLO el JSON puro, sin bloques markdown de código.`;

  return callGroq(apiKey, prompt);
}

export async function expandGameSong(apiKey, songName, lastTime) {
  if (!apiKey) throw new Error("No API Key provided");

  const prompt = `
Eres un maestro de guitarra acústica.
El usuario está tocando la canción "${songName}" y acaba de pulsar "+" para seguir aprendiendo.
El último tiempo (time) de la última nota generada fue: ${lastTime} segundos.
Genera un JSON puro con la CONTINUACIÓN de los acordes/notas de la canción (al menos 16 notas más, aprox 4 compases, siguiendo el ritmo y melodía).
Estructura obligatoria:
{
  "new_schemas": [
    "La menor (Am) - Repetición",
    "",
    "La Mayor barre (A) [cejilla en traste V]:",
    "TS      Ⅴ   Ⅵ   Ⅶ",
    "E (1) 1---|---|---",
    "B (2) 1---|---|---",
    "G (3) 1---|---|---",
    "D (4) 1---|-3-|---",
    "A (5) 1---|-3-|---",
    "E (6) 1---|---|---"
  ],
  "notes": [
    { "time": ${lastTime + 1}, "duration": 1.5, "string": 6, "fret": 3, "finger": 2, "latin": "Sol", "anglo": "G" }
  ]
}
Asegúrate de que el "time" de las nuevas notas sea estrictamente mayor que ${lastTime}, de forma ascendente.

REGLAS ESTRICTAS PARA EL JSON:
1. ¡CRÍTICO PARA LOS TRASTES EN 'new_schemas'!: La fila "TS" de cada esquema DEBE indicar los trastes REALES del acorde. Si el acorde está en traste VII, VIII y IX, escribe "TS      Ⅶ   Ⅷ   Ⅸ". NO siempre uses Ⅰ Ⅱ Ⅲ.
2. ¡CRÍTICO PARA 'new_schemas'!: El array 'new_schemas' DEBE ser una lista CRONOLÓGICA EXACTA de los acordes/notas generados en 'notes'. Para acordes NUEVOS dibuja su esquema ASCII completo. Para acordes que SE REPITEN, escribe solo su nombre (ej. 'Do Mayor (C) - Repetición').
3. ¡PROHIBIDO usar saltos de línea físicos (Enter) dentro de los strings! Si necesitas saltos de línea, usa literalmente \\\\n.
4. Devuelve SÓLO el JSON puro, sin bloques markdown de código.`;

  return callGroq(apiKey, prompt, 0.1, 2500);
}

export async function fetchTheoryCourse(apiKey, level) {
  if (!apiKey) throw new Error("No API Key provided");
  
  const prompt = `
Eres un profesor experto de guitarra en la academia QGHERO.
El usuario ha seleccionado el nivel de teoría: "${level}".
Genera una clase magistral en formato HTML básico (usando etiquetas <h3>, <p>, <ul>, <strong>) adecuada a su nivel.

REGLAS ESTRICTAS DE NOMENCLATURA que debes usar en tus explicaciones:
- Mano Izquierda: Dedos 1 (índice), 2 (medio), 3 (anular), 4 (meñique), T/P (pulgar). ¡REGLA DE ORO: JAMÁS asignes el mismo dedo a diferentes cuerdas en distintos trastes (salvo cejillas)! Cada dedo pisa un traste distinto.
- Mano Derecha: p (pulgar), i (índice), m (medio), a (anular), e (meñique).
- Cuerdas: 1 a 6 (1 fina, 6 gruesa).
- Acordes: Mencionar O (al aire) o X (no tocar).
- ES OBLIGATORIO Y CRÍTICO que TODOS los esquemas ASCII empiecen por la fila de trastes ("TS      Ⅰ   Ⅱ   Ⅲ"). ¡NO LA OMITAS NUNCA!

El HTML debe contener:
- Una introducción motivadora.
- Explicaciones muy claras sobre qué son y cómo pisar los trastes correctamente.
- MENCIONA SIEMPRE las notas y acordes en ambas nomenclaturas a la vez (Latina y Anglo. Ej: "Do Mayor (C)", "Sol (G)").
- Cuando enseñes un acorde o posición, DEBES incluir su esquema ASCII (6 cuerdas) envuelto en la etiqueta <pre class="ascii-schema">. Dibuja SIEMPRE las 6 cuerdas y pon SIEMPRE el número de traste en la primera fila. Utiliza caracteres Unicode de ancho simple (Ⅰ, Ⅱ, Ⅲ, Ⅳ) perfectamente alineados sobre el guion central de cada traste, y EMPIEZA ESA FILA con la palabra 'TS' seguida de 6 espacios vacíos. Ejemplo:
<pre class="ascii-schema">
TS      Ⅰ   Ⅱ   Ⅲ
E (1) |---|---|---
B (2) |-1-|---|---
G (3) |---|-2-|---
D (4) |---|-3-|---
A (5) X---|---|---
E (6) O---|---|---
</pre>
- JUSTO DEBAJO de cada esquema ASCII, DEBES incluir obligatoriamente un botón para reproducir el acorde. Debes usar exactamente este formato HTML, asegurándote de que data-notes contiene un array JSON válido con las notas reales de Tone.js (ej. "C3", "E3", "G3"):
<button class="btn primary-btn play-chord-btn" data-notes='["E2", "B2", "E3", "G#3", "B3", "E4"]'>🔊 Escuchar</button>
- Un ejemplo de ejercicio práctico.
- No uses la etiqueta \`\`\`html ni Markdown, sólo las etiquetas HTML crudas.
`;

  const content = await callGroq(apiKey, prompt, 0.5);
  let cleanContent = content;
  if (cleanContent.startsWith('```html')) cleanContent = cleanContent.substring(7);
  if (cleanContent.startsWith('```')) cleanContent = cleanContent.substring(3);
  if (cleanContent.endsWith('```')) cleanContent = cleanContent.substring(0, cleanContent.length - 3);
  
  return cleanContent.trim();
}

export async function expandTheoryCourse(apiKey, level, previousContent) {
  if (!apiKey) throw new Error("No API Key provided");
  
  // Convertimos el HTML a texto plano para ahorrar una cantidad brutal de tokens
  // Así le pasamos todo el historial para que no repita NADA de lo enseñado
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = previousContent;
  let textHistory = tempDiv.innerText || tempDiv.textContent || "";
  
  // Mantenemos hasta ~15000 caracteres de texto puro (muchísimas páginas de lectura)
  if (textHistory.length > 15000) {
      textHistory = "..." + textHistory.substring(textHistory.length - 15000);
  }

  const prompt = `
Eres un profesor experto de guitarra en la academia QGHERO.
El usuario está en el nivel de teoría: "${level}".
Aquí tienes el historial completo (en texto plano) de TODO lo que ya le has enseñado al alumno en este cuaderno:
"""
${textHistory}
"""

El usuario quiere AMPLIAR la clase. Genera la CONTINUACIÓN de la clase en formato HTML básico (usando etiquetas <h3>, <p>, <ul>, <strong>). No repitas NINGÚN concepto, acorde o ejercicio que ya esté en el historial de arriba. Simplemente sigue directamente con un NUEVO subtítulo <h3> y un concepto más avanzado o un nuevo acorde que siga el hilo.

REGLAS ESTRICTAS DE NOMENCLATURA:
- Mano Izquierda: Dedos 1 (índice), 2 (medio), 3 (anular), 4 (meñique), T/P (pulgar). ¡REGLA DE ORO: JAMÁS asignes el mismo dedo a diferentes cuerdas en distintos trastes (salvo cejillas)! Cada dedo pisa un traste distinto.
- Mano Derecha: p (pulgar), i (índice), m (medio), a (anular), e (meñique).
- Explicaciones muy claras sobre qué son y cómo pisar los trastes correctamente.
- MENCIONA SIEMPRE las notas y acordes en ambas nomenclaturas a la vez (Latina y Anglo. Ej: "Do Mayor (C)", "Sol (G)").
- ES OBLIGATORIO Y CRÍTICO que TODOS los esquemas ASCII empiecen por la fila de trastes ("TS      Ⅰ   Ⅱ   Ⅲ"). ¡NO LA OMITAS NUNCA!
- Cuando enseñes un acorde o posición, DEBES incluir su esquema ASCII (6 cuerdas) envuelto en la etiqueta <pre class="ascii-schema">. Dibuja SIEMPRE las 6 cuerdas y pon SIEMPRE el número de traste en la primera fila. Utiliza caracteres Unicode de ancho simple (Ⅰ, Ⅱ, Ⅲ, Ⅳ) perfectamente alineados sobre el guion central de cada traste, y EMPIEZA ESA FILA con la palabra 'TS' seguida de 6 espacios vacíos. Ejemplo:
<pre class="ascii-schema">
TS      Ⅰ   Ⅱ   Ⅲ
E (1) |---|---|---
B (2) |-1-|---|---
G (3) |---|-2-|---
D (4) |---|-3-|---
A (5) X---|---|---
E (6) O---|---|---
</pre>
- JUSTO DEBAJO de cada esquema ASCII, DEBES incluir obligatoriamente un botón para reproduciro. Usa exactamente este HTML con las notas reales de Tone.js en el array (ej. "C3", "E3"):
<button class="btn primary-btn play-chord-btn" data-notes='["E2", "B2", "E3", "G#3", "B3", "E4"]'>🔊 Escuchar</button>
- No uses la etiqueta \`\`\`html ni Markdown, sólo las etiquetas HTML crudas.
`;

  const content = await callGroq(apiKey, prompt, 0.5);
  let cleanContent = content;
  if (cleanContent.startsWith('```html')) cleanContent = cleanContent.substring(7);
  if (cleanContent.startsWith('```')) cleanContent = cleanContent.substring(3);
  if (cleanContent.endsWith('```')) cleanContent = cleanContent.substring(0, cleanContent.length - 3);
  
  return cleanContent.trim();
}

export async function fetchPracticeLevel(apiKey, style, level) {
  if (!apiKey) throw new Error("No API Key provided");
  
  const prompt = `
Eres el profesor virtual de guitarra acústica de QGHERO.
El usuario está aprendiendo el estilo "${style}" y acaba de llegar al NIVEL ${level}.
Si el nivel es 1, enséñale lo más básico. Si es mayor, sube progresivamente la dificultad de los acordes (ej. introduciendo cejillas en niveles altos).

Devuelve un JSON estricto con la siguiente estructura:
{
  "title": "Nombre del nivel (ej. Rock Nivel 2: Power Chords Avanzados)",
  "desc": "Descripción motivadora de lo que aprenderá en este nivel.",
  "rightHand": "Técnica de mano derecha esperada para este nivel. (Usa nomenclatura p,i,m,a,e)",
  "chords": [
    {
      "name": "Nombre Acorde (ej. Fa Mayor)",
      "notes": ["F2", "C3", "F3", "A3", "C4", "F4"], 
      "finger": "Explicación de dedos (usa 1,2,3,4). ¡REGLA DE ORO: JAMÁS repitas el mismo dedo para distintas cuerdas en distintos trastes!",
      "schema": [
        "Array de strings (una línea por string) para el esquema ASCII. Ejemplo:",
        "TS      Ⅰ   Ⅱ   Ⅲ",
        "E (1) |---|---|---",
        "B (2) |-1-|---|---",
        "G (3) |---|-2-|---",
        "D (4) |---|-3-|---",
        "A (5) X---|---|---",
        "E (6) X---|---|---"
      ]
    }
  ],
  "examples": [
    {
      "song": "Título de la canción - Artista",
      "rhythm": "Cómo es el rasgueo para esta canción",
      "progression": "Los acordes de arriba que se usan (ej. Am -> C -> G)"
    }
  ]
}

- Genera de 2 a 4 acordes por nivel.
- notes: Array estricto de notas de Tone.js (ej. "C3", "E3") para que el sintetizador pueda reproducirlo.
- examples: 1 o 2 canciones famosas reales que usen EXACTAMENTE los acordes enseñados en este nivel.

REGLAS ESTRICTAS PARA EL JSON:
1. ¡PROHIBIDO usar saltos de línea físicos (Enter) dentro de los valores de texto (desc, rightHand, etc)! Si necesitas saltos de línea, usa literalmente \\\\n.
2. Devuelve SÓLO el JSON puro, sin bloques markdown de código.
`;

  return callGroq(apiKey, prompt, 0.4);
}

export async function fetchPracticeSong(apiKey, songName) {
  if (!apiKey) throw new Error("No API Key provided");
  
  const prompt = `
Eres el profesor virtual de guitarra acústica de QGHERO.
El usuario quiere aprender a tocar esta canción específica: "${songName}".

Enséñale los acordes exactos y el ritmo necesario para tocarla, usando nuestra nomenclatura estricta.

Devuelve un JSON estricto con la siguiente estructura:
{
  "title": "A la Carta: Nombre Canción",
  "desc": "Breve descripción de la canción y por qué es interesante tocarla.",
  "rightHand": "Técnica de mano derecha esperada para tocarla (Usa p,i,m,a,e y patrón de rasgueo).",
  "chords": [
    {
      "name": "Nombre Acorde (ej. Fa Mayor)",
      "notes": ["F2", "C3", "F3", "A3", "C4", "F4"], 
      "finger": "Explicación de dedos (usa 1,2,3,4). ¡REGLA DE ORO: JAMÁS repitas el mismo dedo para distintas cuerdas en distintos trastes!",
      "schema": [
        "Array de strings (una línea por string) para el esquema ASCII. Ejemplo:",
        "TS      Ⅰ   Ⅱ   Ⅲ",
        "E (1) |---|---|---",
        "B (2) |-1-|---|---",
        "G (3) |---|-2-|---",
        "D (4) |---|-3-|---",
        "A (5) X---|---|---",
        "E (6) X---|---|---"
      ]
    }
  ],
  "examples": [
    {
      "song": "Estructura de la canción (Intro, Verso, Estribillo)",
      "rhythm": "Patrón rítmico sugerido",
      "progression": "Progresión de acordes (ej. Intro: Am -> C -> G)"
    }
  ]
}

- notes: Array estricto de notas de Tone.js para el sintetizador.
- examples: Usa este array para describir la progresión de las diferentes partes de la canción.

REGLAS ESTRICTAS PARA EL JSON:
1. ¡PROHIBIDO usar saltos de línea físicos (Enter) dentro de los valores de texto (desc, rightHand, etc)! Si necesitas saltos de línea, usa literalmente \\\\n.
2. Devuelve SÓLO el JSON puro, sin bloques markdown de código.
`;

  return callGroq(apiKey, prompt, 0.4);
}

async function callGroq(apiKey, prompt, temperature = 0.1, maxTokens = 3500) {
  try {
    const body = {
        model: 'llama-3.1-8b-instant',
        messages: [{ role: 'user', content: prompt }],
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
