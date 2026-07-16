/**
 * Card-based Game Engine for QGHERO
 * Replaces the old Canvas-based scrolling engine with interactive note cards.
 */
export class GameEngine {
  constructor() {
    this.notes = [];
    this.cards = [];          // DOM elements for each note
    this.currentTime = 0;
    this.playbackRate = 1.0;
    this.isPlaying = false;
    this.animationId = null;
    this.activeIndex = -1;    // Currently highlighted card index
    this.onNoteHit = null;
    this.onTimeJump = null;   // Callback when user clicks a card to jump

    this.container = document.getElementById('note-cards-container');
    this.viewport = document.getElementById('note-cards-viewport');
    this.progressFill = document.getElementById('game-progress-fill');
    this.progressText = document.getElementById('game-progress-text');

    this.STRING_COLORS = [
      '#ff0055', // 1: e
      '#ffaa00', // 2: B
      '#ffff00', // 3: G
      '#00ff00', // 4: D
      '#00ffff', // 5: A
      '#cc00ff'  // 6: E
    ];
  }

  loadSong(songData) {
    this.notes = songData.notes.sort((a, b) => a.time - b.time).map(note => ({
      ...note,
      hit: false
    }));
    this.currentTime = 0;
    this.activeIndex = -1;
    this.buildCards();
    this.updateProgress();
  }

  buildCards() {
    this.container.innerHTML = '';
    this.cards = [];

    this.notes.forEach((note, i) => {
      const card = document.createElement('div');
      card.className = 'note-card';
      card.dataset.index = i;

      const chordName = note.latin || note.anglo || '?';
      const mins = Math.floor(note.time / 60);
      const secs = Math.floor(note.time % 60).toString().padStart(2, '0');
      const timeStr = `${mins}:${secs}`;

      // Card header
      const header = document.createElement('div');
      header.className = 'card-header';
      header.innerHTML = `
        <span class="card-chord-name">${chordName}</span>
        <span class="card-time">${timeStr}</span>
      `;

      // Check mark for played cards
      const check = document.createElement('span');
      check.className = 'card-check';
      check.textContent = '✅';

      // Mini fretboard
      const fretboard = this.buildMiniFretboard(note);

      // Card footer
      const footer = document.createElement('div');
      footer.className = 'card-footer';
      const fingerText = note.finger > 0 ? `Dedo ${note.finger}` : '';
      const fretText = note.fret >= 0 ? `Traste ${note.fret}` : '';
      footer.innerHTML = `
        <span class="card-finger">${fingerText}</span>
        <span class="card-fret">${fretText}</span>
      `;

      card.appendChild(check);
      card.appendChild(header);
      card.appendChild(fretboard);
      card.appendChild(footer);

      // Click to jump to this note's time
      card.addEventListener('click', () => {
        const targetTime = Math.max(0, note.time - 0.3); // slightly before
        this.currentTime = targetTime;
        // Reset hit state for all notes from this point forward
        this.notes.forEach((n, idx) => {
          if (idx >= i) n.hit = false;
          else n.hit = true;
        });
        this.updateActiveCard();
        this.updateProgress();
        if (this.onTimeJump) this.onTimeJump(targetTime);
      });

      this.container.appendChild(card);
      this.cards.push(card);
    });
  }

  buildMiniFretboard(note) {
    const fb = document.createElement('div');
    fb.className = 'mini-fretboard';

    // Build 6 strings
    for (let s = 1; s <= 6; s++) {
      const stringLine = document.createElement('div');
      stringLine.className = 'mini-string';

      // If this note is on this string, add a fret dot
      if (note.string === s) {
        const dot = document.createElement('div');
        dot.className = `mini-fret-dot str-${s}`;
        dot.textContent = note.fret;
        // Position: map fret 0-24 to 5%-95% of width
        const pos = note.fret === 0 ? 3 : Math.min(5 + (note.fret / 24) * 90, 95);
        dot.style.left = `${pos}%`;
        dot.style.color = s <= 1 || s >= 6 ? '#fff' : '#000';
        stringLine.appendChild(dot);
      }

      fb.appendChild(stringLine);
    }

    // Fret label in corner
    if (note.fret > 0) {
      const label = document.createElement('div');
      label.className = 'mini-fret-label';
      label.textContent = `T${note.fret}`;
      fb.appendChild(label);
    }

    return fb;
  }

  start() {
    this.isPlaying = true;
    this.lastTimestamp = performance.now();
    this.loop();
  }

  stop() {
    this.isPlaying = false;
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }

  play() {
    this.start();
  }

  updateTime(time, playbackRate = 1.0) {
    this.currentTime = time;
    this.playbackRate = playbackRate;
    this.updateActiveCard();
    this.updateProgress();
  }

  loop(timestamp = performance.now()) {
    if (!this.isPlaying) return;

    const delta = (timestamp - this.lastTimestamp) / 1000;
    this.lastTimestamp = timestamp;

    this.currentTime += delta * this.playbackRate;

    this.updateActiveCard();
    this.checkHits();
    this.updateProgress();

    this.animationId = requestAnimationFrame((ts) => this.loop(ts));
  }

  checkHits() {
    const hitWindow = 0.25;

    for (let i = 0; i < this.notes.length; i++) {
      const note = this.notes[i];
      if (!note.hit && Math.abs(note.time - this.currentTime) < hitWindow) {
        note.hit = true;
        if (this.onNoteHit) this.onNoteHit(note);
      } else if (note.hit && this.currentTime < note.time - hitWindow) {
        note.hit = false; // user rewound
      }
    }
  }

  updateActiveCard() {
    // Find the note closest to currentTime that hasn't fully passed
    let newActive = -1;
    for (let i = 0; i < this.notes.length; i++) {
      if (this.notes[i].time <= this.currentTime + 0.5) {
        newActive = i;
      } else {
        break;
      }
    }

    if (newActive === this.activeIndex) return;
    this.activeIndex = newActive;

    // Update card classes
    this.cards.forEach((card, i) => {
      card.classList.remove('active', 'played');
      if (i === this.activeIndex) {
        card.classList.add('active');
      } else if (i < this.activeIndex) {
        card.classList.add('played');
      }
    });

    // Auto-scroll to keep active card visible
    if (this.activeIndex >= 0 && this.cards[this.activeIndex]) {
      const activeCard = this.cards[this.activeIndex];
      const viewport = this.viewport;
      const cardRect = activeCard.getBoundingClientRect();
      const viewportRect = viewport.getBoundingClientRect();

      // If card is below the visible area or above it, scroll it into view
      if (cardRect.bottom > viewportRect.bottom - 20 || cardRect.top < viewportRect.top + 20) {
        activeCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }

  updateProgress() {
    const total = this.notes.length;
    const played = this.activeIndex + 1;
    const pct = total > 0 ? (played / total) * 100 : 0;

    if (this.progressFill) this.progressFill.style.width = `${pct}%`;
    if (this.progressText) this.progressText.textContent = `${Math.max(0, played)} / ${total}`;
  }
}
