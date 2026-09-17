class AudioManager {
  private ctx: AudioContext | null = null;
  private gainSfx: GainNode | null = null;
  private gainBgm: GainNode | null = null;

  init(): void {
    if (this.ctx) return;
    this.ctx = new AudioContext();
    this.gainSfx = this.ctx.createGain();
    this.gainBgm = this.ctx.createGain();

    this.gainSfx.connect(this.ctx.destination);
    this.gainBgm.connect(this.ctx.destination);
    
    // Default volumes
    this.gainSfx.gain.value = 1;
    this.gainBgm.gain.value = 1;
  }

  playSfx(_name: 'vote' | 'draw_start' | 'timer_tick' | 'score'): void {
    if (!this.ctx) return;
    // Stub
  }

  playBgm(_name: 'lobby' | 'draw'): void {
    if (!this.ctx) return;
    // Stub
  }

  setSfxVolume(v: number): void {
    if (this.gainSfx) this.gainSfx.gain.value = v;
  }

  setBgmVolume(v: number): void {
    if (this.gainBgm) this.gainBgm.gain.value = v;
  }
}
export const audioManager = new AudioManager();

