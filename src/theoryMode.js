import { fetchTheoryCourse, expandTheoryCourse } from './groqApi.js';
import { initAudio, strumChord } from './audioSynth.js';

let currentLevel = 'Principiante';

export function initTheoryMode(getApiKeyFn) {
  const generateBtn = document.getElementById('generate-course-btn');
  const resultContainer = document.getElementById('theory-result');
  const loadingIndicator = document.getElementById('theory-loading');
  const levelSelect = document.getElementById('theory-level');
  
  const expandBtnContainer = document.getElementById('theory-expand-container');
  const expandBtn = document.getElementById('expand-course-btn');

  function bindAudioButtons() {
    resultContainer.querySelectorAll('.play-chord-btn').forEach(btn => {
      // Remove previous event listeners by cloning if necessary, but since we just append, 
      // we can just bind to ones that don't have a specific attribute yet
      if (btn.dataset.bound) return;
      btn.dataset.bound = "true";
      
      btn.addEventListener('click', async (e) => {
        try {
          const notes = JSON.parse(e.target.getAttribute('data-notes'));
          await initAudio();
          strumChord(notes, 0.05);
        } catch(err) {
          console.error("Error reproduciendo acorde:", err);
        }
      });
    });
  }

  function loadCachedCourse(level) {
    const cachedHTML = localStorage.getItem(`qghero_theory_course_${level}`);
    if (cachedHTML) {
      resultContainer.innerHTML = cachedHTML;
      bindAudioButtons();
      resultContainer.classList.remove('hidden');
      expandBtnContainer.classList.remove('hidden');
      return true;
    }
    return false;
  }

  function saveCourse(level, htmlContent) {
    localStorage.setItem(`qghero_theory_course_${level}`, htmlContent);
  }

  // Cargar caché si cambiamos en el selector
  levelSelect.addEventListener('change', () => {
    currentLevel = levelSelect.value;
    resultContainer.classList.add('hidden');
    expandBtnContainer.classList.add('hidden');
    loadCachedCourse(currentLevel);
  });

  generateBtn.addEventListener('click', async () => {
    const apiKey = getApiKeyFn();
    if (!apiKey) {
      alert("Por favor, inicia sesión con tu API Key en la pantalla principal primero.");
      return;
    }

    currentLevel = levelSelect.value;
    
    // Si queremos regenerar de cero al pulsar generar
    loadingIndicator.classList.remove('hidden');
    resultContainer.classList.add('hidden');
    expandBtnContainer.classList.add('hidden');
    generateBtn.disabled = true;

    try {
      const courseHtml = await fetchTheoryCourse(apiKey, currentLevel);
      resultContainer.innerHTML = courseHtml;
      saveCourse(currentLevel, courseHtml);
      
      bindAudioButtons();

      resultContainer.classList.remove('hidden');
      expandBtnContainer.classList.remove('hidden');
    } catch (error) {
      alert("Hubo un error al generar el curso: " + error.message);
    } finally {
      loadingIndicator.classList.add('hidden');
      generateBtn.disabled = false;
    }
  });

  // Botón ampliar curso
  expandBtn.addEventListener('click', async () => {
    const apiKey = getApiKeyFn();
    if (!apiKey) {
      alert("Por favor, inicia sesión con tu API Key primero.");
      return;
    }

    expandBtn.disabled = true;
    const originalText = expandBtn.innerHTML;
    expandBtn.innerHTML = '<div class="spinner" style="width:20px;height:20px;margin:0;border-width:2px;"></div>';

    try {
      const previousHtml = resultContainer.innerHTML;
      const newHtml = await expandTheoryCourse(apiKey, currentLevel, previousHtml);
      
      // Añadir al final
      const newSection = document.createElement('div');
      newSection.style.marginTop = "2rem";
      newSection.style.paddingTop = "2rem";
      newSection.style.borderTop = "1px dashed var(--neon-cyan)";
      newSection.innerHTML = newHtml;
      
      resultContainer.appendChild(newSection);
      
      // Guardar completo
      saveCourse(currentLevel, resultContainer.innerHTML);
      
      bindAudioButtons();
    } catch (error) {
      alert("Hubo un error al ampliar el curso: " + error.message);
    } finally {
      expandBtn.disabled = false;
      expandBtn.innerHTML = originalText;
    }
  });
  
  // Attempt load on init
  loadCachedCourse(levelSelect.value);
}
