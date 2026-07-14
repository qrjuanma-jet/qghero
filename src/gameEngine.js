export class GameEngine {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas.getContext('2d');
    this.notes = [];
    this.currentTime = 0;
    this.playbackRate = 1.0;
    this.isPlaying = false;
    this.animationId = null;
    this.onNoteHit = null; // Callback for UI updates
    
    // Canvas dimensions
    this.resize();
    window.addEventListener('resize', () => this.resize());
    
    // Guitar Strings (1 to 6)
    this.stringColors = [
      '#ff0055', // 1: e
      '#ffaa00', // 2: B
      '#ffff00', // 3: G
      '#00ff00', // 4: D
      '#00ffff', // 5: A
      '#cc00ff'  // 6: E
    ];
  }

  resize() {
    const parent = this.canvas.parentElement;
    this.canvas.width = parent.clientWidth;
    this.canvas.height = parent.clientHeight;
    this.width = this.canvas.width;
    this.height = this.canvas.height;
    
    // Calculate string positions
    this.stringSpacing = this.width / 7;
    this.hitLineY = this.height - 100; // Position where note should be played
  }

  loadSong(songData) {
    // Sort notes by time just in case
    this.notes = songData.notes.sort((a, b) => a.time - b.time).map(note => ({
      ...note,
      hit: false
    }));
    this.currentTime = 0;
    this.render();
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
    }
  }

  updateTime(time, playbackRate = 1.0) {
    this.currentTime = time;
    this.playbackRate = playbackRate;
    if (!this.isPlaying) this.render();
  }

  loop(timestamp = performance.now()) {
    if (!this.isPlaying) return;
    
    const delta = (timestamp - this.lastTimestamp) / 1000; // in seconds
    this.lastTimestamp = timestamp;
    
    // Predict current time based on delta, actual sync comes from YouTube API via updateTime
    this.currentTime += delta * this.playbackRate;
    
    this.render();
    this.checkHits();
    
    this.animationId = requestAnimationFrame((ts) => this.loop(ts));
  }
  
  checkHits() {
    const windowOffset = 0.2; // +/- 0.2s window for visual hit
    
    for (let note of this.notes) {
      if (!note.hit && Math.abs(note.time - this.currentTime) < windowOffset) {
        note.hit = true;
        if (this.onNoteHit) {
          this.onNoteHit(note);
        }
      } else if (note.hit && this.currentTime < note.time - windowOffset) {
        // user rewound
        note.hit = false;
      }
    }
  }

  render() {
    this.ctx.clearRect(0, 0, this.width, this.height);
    
    // Draw Fretboard
    this.drawFretboard();
    
    // Draw Notes
    const pixelsPerSecond = 300; // How fast notes fall
    
    this.notes.forEach(note => {
      const timeDiff = note.time - this.currentTime;
      
      // Only draw if within screen vertically (e.g. up to 3 seconds ahead)
      if (timeDiff > -1 && timeDiff < (this.height / pixelsPerSecond) + 1) {
        const x = this.stringSpacing * note.string;
        const y = this.hitLineY - (timeDiff * pixelsPerSecond);
        
        this.drawNote(x, y, note);
      }
    });
  }

  drawFretboard() {
    // Draw strings
    this.ctx.lineWidth = 3;
    for (let i = 1; i <= 6; i++) {
      this.ctx.beginPath();
      this.ctx.moveTo(this.stringSpacing * i, 0);
      this.ctx.lineTo(this.stringSpacing * i, this.height);
      // Fading color towards the top
      const grad = this.ctx.createLinearGradient(0, 0, 0, this.height);
      grad.addColorStop(0, 'rgba(255,255,255,0.1)');
      grad.addColorStop(1, 'rgba(255,255,255,0.4)');
      this.ctx.strokeStyle = grad;
      this.ctx.stroke();
    }
    
    // Draw hit line (glow effect)
    this.ctx.beginPath();
    this.ctx.moveTo(0, this.hitLineY);
    this.ctx.lineTo(this.width, this.hitLineY);
    this.ctx.lineWidth = 4;
    this.ctx.strokeStyle = 'rgba(0, 255, 204, 0.8)';
    this.ctx.shadowBlur = 15;
    this.ctx.shadowColor = '#00ffcc';
    this.ctx.stroke();
    this.ctx.shadowBlur = 0; // Reset
    
    // Hit indicators for each string
    for (let i = 1; i <= 6; i++) {
      this.ctx.beginPath();
      this.ctx.arc(this.stringSpacing * i, this.hitLineY, 15, 0, Math.PI * 2);
      this.ctx.strokeStyle = this.stringColors[i-1];
      this.ctx.lineWidth = 2;
      this.ctx.stroke();
    }
  }

  drawNote(x, y, note) {
    const color = this.stringColors[note.string - 1];
    const radius = 20;
    
    // Note Glow
    this.ctx.shadowBlur = 20;
    this.ctx.shadowColor = color;
    
    // Draw Note Circle
    this.ctx.beginPath();
    this.ctx.arc(x, y, radius, 0, Math.PI * 2);
    this.ctx.fillStyle = '#111';
    this.ctx.fill();
    this.ctx.lineWidth = 4;
    this.ctx.strokeStyle = color;
    this.ctx.stroke();
    
    // Reset shadow for text
    this.ctx.shadowBlur = 0;
    
    // Draw Fret Number inside Note
    this.ctx.fillStyle = '#fff';
    this.ctx.font = 'bold 16px Outfit';
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    this.ctx.fillText(note.fret, x, y);
    
    // Draw Finger suggestion small below
    if (note.finger > 0) {
      this.ctx.fillStyle = '#aaa';
      this.ctx.font = '12px Outfit';
      this.ctx.fillText(`D${note.finger}`, x, y + 30);
    }
  }
}
