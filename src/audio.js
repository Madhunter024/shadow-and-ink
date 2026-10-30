class NoirAudioManager {
  constructor() {
    this.isMuted = false;

    // Pre-instantiate audio objects so there is zero latency on scroll triggers
    this.sounds = {
      click: new Audio('/audio/click.mp3'),
      impact: new Audio('/audio/impact.mp3'),
      swoosh: new Audio('/audio/swoosh.mp3'),
      blade: new Audio('/audio/blade.mp3'),
    };

    // Preset volumes
    if (this.sounds.click) this.sounds.click.volume = 0.4;
    if (this.sounds.impact) this.sounds.impact.volume = 0.6;
    if (this.sounds.swoosh) this.sounds.swoosh.volume = 0.5;
    if (this.sounds.blade) this.sounds.blade.volume = 0.7;
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    return this.isMuted;
  }

  play(name) {
    if (this.isMuted) return;
    const sound = this.sounds[name];
    if (sound) {
      // Clone or reset time to 0 so fast repetitive triggers don't cut off
      sound.currentTime = 0;
      sound.play().catch(() => {
        // Silently handles browser autoplay restrictions until first user interaction
      });
    }
  }

  playClick() {
    this.play('click');
  }

  playImpact() {
    this.play('impact');
  }

  playSwoosh() {
    this.play('swoosh');
  }

  playBlade() {
    this.play('blade');
  }
}

export const sound = new NoirAudioManager();