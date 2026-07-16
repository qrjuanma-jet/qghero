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
    this.lyricsBar = document.getElementById('lyrics-bar');
    this.rightHandBar = document.getElementById('right-hand-bar');
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

      const latin = note.latin || '?';
      const anglo = note.anglo || '?';
      const chordName = `${latin} (${anglo})`;
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
      
      let baseFret = -1;
      if (note.fingering && note.fingering.length > 0) {
        const frets = note.fingering.map(f => f.fret).filter(fr => fr > 0);
        if (frets.length > 0) {
          baseFret = Math.min(...frets);
        }
      } else if (note.fret > 0) {
        baseFret = note.fret;
      }
      
      const fretText = baseFret > 0 ? `Traste Base ${this.toRoman(baseFret)}` : 'Traste Base I';
      footer.innerHTML = `<span class="card-fret">${fretText}</span>`;

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

    // Get fingering array or fallback to single note logic
    const fingerings = note.fingering || (note.single_note ? [note.single_note] : [{ string: note.string, fret: note.fret, finger: note.finger }]);
    
    // Find min and max fret for rendering scale
    let minFret = 999;
    let maxFret = -999;
    for (const f of fingerings) {
      if (f.fret > 0) {
        minFret = Math.min(minFret, f.fret);
        maxFret = Math.max(maxFret, f.fret);
      }
    }
    
    // If no fretted notes, default to 1-3
    if (minFret === 999) { minFret = 1; maxFret = 3; }
    
    // Expand window to at least 3 frets
    if (maxFret - minFret < 2) maxFret = minFret + 2;

    const numFrets = maxFret - minFret + 1;

    // Draw horizontal fret lines
    for (let i = 0; i <= numFrets; i++) {
      const relPos = i / numFrets;
      const pos = 20 + (relPos * 70);

      const line = document.createElement('div');
      line.className = 'mini-fret-line';
      line.style.left = `${pos}%`;
      fb.appendChild(line);

      // Add roman numeral above the fret
      const currentFret = minFret + i;
      const numLabel = document.createElement('div');
      numLabel.className = 'mini-fret-num';
      numLabel.style.left = `${pos}%`;
      numLabel.textContent = this.toRoman(currentFret);
      fb.appendChild(numLabel);
    }

    // Build 6 strings
    for (let s = 1; s <= 6; s++) {
      const stringLine = document.createElement('div');
      stringLine.className = 'mini-string';

      const fNote = fingerings.find(f => f.string === s);
      if (fNote) {
        if (fNote.fret === -1 || fNote.fret === 'X') {
          // Muted string
          const cross = document.createElement('div');
          cross.className = `mini-fret-dot str-${s}`;
          cross.textContent = 'X';
          cross.style.left = '5%';
          cross.style.background = 'transparent';
          cross.style.color = '#ff4444';
          stringLine.appendChild(cross);
        } else if (fNote.fret === 0) {
          // Open string
          const circle = document.createElement('div');
          circle.className = `mini-fret-dot str-${s}`;
          circle.textContent = 'O';
          circle.style.left = '5%';
          circle.style.background = 'transparent';
          circle.style.color = 'var(--neon-cyan)';
          stringLine.appendChild(circle);
        } else {
          // Fretted note
          const dot = document.createElement('div');
          dot.className = `mini-fret-dot str-${s}`;
          dot.textContent = fNote.finger && fNote.finger > 0 ? fNote.finger : this.toRoman(fNote.fret);
          // Position relative to the [minFret, maxFret] window
          const relPos = (fNote.fret - minFret) / (maxFret - minFret);
          const pos = 20 + (relPos * 70); // From 20% to 90%
          dot.style.left = `${pos}%`;
          dot.style.color = s <= 1 || s >= 6 ? '#fff' : '#000';
          stringLine.appendChild(dot);
        }
      }

      fb.appendChild(stringLine);
    }

    // Fret label in corner (base fret)
    if (minFret > 0) {
      const label = document.createElement('div');
      label.className = 'mini-fret-label';
      label.textContent = `T${this.toRoman(minFret)}`;
      fb.appendChild(label);
    }

    return fb;
  }

  toRoman(num) {
    if (num <= 0) return num.toString();
    const romanMap = {
      1: 'Ⅰ', 2: 'Ⅱ', 3: 'Ⅲ', 4: 'Ⅳ', 5: 'Ⅴ', 6: 'Ⅵ', 7: 'Ⅶ', 8: 'Ⅷ',
      9: 'Ⅸ', 10: 'Ⅹ', 11: 'Ⅺ', 12: 'Ⅻ', 13: 'XIII', 14: 'XIV', 15: 'XV',
      16: 'XVI', 17: 'XVII', 18: 'XVIII', 19: 'XIX', 20: 'XX', 21: 'XXI',
      22: 'XXII', 23: 'XXIII', 24: 'XXIV'
    };
    return romanMap[num] || num.toString();
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

    if (this.activeIndex >= 0 && this.activeIndex < this.notes.length) {
      const currentNote = this.notes[this.activeIndex];
      const currentLyric = currentNote.lyric;
      if (this.lyricsBar) {
        if (currentLyric && currentLyric.trim().length > 0) {
          this.lyricsBar.textContent = currentLyric;
        }
      }
      if (this.rightHandBar && currentNote.right_hand) {
        this.rightHandBar.textContent = currentNote.right_hand;
        // Trigger animation
        this.rightHandBar.classList.remove('active');
        void this.rightHandBar.offsetWidth; // trigger reflow
        this.rightHandBar.classList.add('active');
      }
    } else {
      if (this.lyricsBar) this.lyricsBar.textContent = '';
      if (this.rightHandBar) this.rightHandBar.classList.remove('active');
    }

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
