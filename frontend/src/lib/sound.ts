/**
 * Web Audio API Sound Synthesizer for Smart POS Notifications
 * Generates clear, high-quality audio tones natively without any external file dependencies.
 */

class SoundManager {
  private ctx: AudioContext | null = null;
  private soundEnabledKey = 'smartpos_sound_enabled';

  private getAudioContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;

    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }

    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {
        // Resume on user interaction
      });
    }

    return this.ctx;
  }

  public isEnabled(): boolean {
    if (typeof window === 'undefined') return true;
    const stored = localStorage.getItem(this.soundEnabledKey);
    return stored === null ? true : stored === 'true';
  }

  public setEnabled(enabled: boolean): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(this.soundEnabledKey, String(enabled));
  }

  /**
   * Pleasant, crisp bell chime for incoming notifications
   */
  public playNotification(): void {
    if (!this.isEnabled()) return;
    const ctx = this.getAudioContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;

      // Primary tone
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(880, now); // A5
      osc1.frequency.exponentialRampToValueAtTime(1760, now + 0.08); // A6 overtone

      gain1.gain.setValueAtTime(0.001, now);
      gain1.gain.exponentialRampToValueAtTime(0.3, now + 0.01);
      gain1.gain.exponentialRampToValueAtTime(0.0001, now + 0.5);

      osc1.connect(gain1);
      gain1.connect(ctx.destination);

      // Harmony tone for bell glass effect
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(1318.51, now); // E6

      gain2.gain.setValueAtTime(0.001, now);
      gain2.gain.exponentialRampToValueAtTime(0.15, now + 0.015);
      gain2.gain.exponentialRampToValueAtTime(0.0001, now + 0.35);

      osc2.connect(gain2);
      gain2.connect(ctx.destination);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + 0.55);
      osc2.stop(now + 0.4);
    } catch (err) {
      console.warn('Audio playback not allowed yet by user gesture', err);
    }
  }

  /**
   * Cashier / POS checkout success chime (Ascending 3-chord arpeggio C5 -> E5 -> G5)
   */
  public playSuccess(): void {
    if (!this.isEnabled()) return;
    const ctx = this.getAudioContext();
    if (!ctx) return;

    try {
      const notes = [523.25, 659.25, 783.99]; // C5, E5, G5
      const now = ctx.currentTime;

      notes.forEach((freq, idx) => {
        const startTime = now + idx * 0.08;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, startTime);

        gain.gain.setValueAtTime(0.001, startTime);
        gain.gain.exponentialRampToValueAtTime(0.25, startTime + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.35);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(startTime);
        osc.stop(startTime + 0.4);
      });
    } catch (err) {
      console.warn('Audio playback error', err);
    }
  }

  /**
   * Warning alert chime (e.g. low stock alert)
   */
  public playWarning(): void {
    if (!this.isEnabled()) return;
    const ctx = this.getAudioContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const notes = [659.25, 523.25]; // E5 -> C5

      notes.forEach((freq, idx) => {
        const startTime = now + idx * 0.12;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, startTime);

        gain.gain.setValueAtTime(0.001, startTime);
        gain.gain.exponentialRampToValueAtTime(0.25, startTime + 0.015);
        gain.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.3);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(startTime);
        osc.stop(startTime + 0.35);
      });
    } catch (err) {
      console.warn('Audio playback error', err);
    }
  }

  /**
   * Error sound
   */
  public playError(): void {
    if (!this.isEnabled()) return;
    const ctx = this.getAudioContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(220, now);
      osc.frequency.exponentialRampToValueAtTime(140, now + 0.25);

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.exponentialRampToValueAtTime(0.2, now + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.28);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.3);
    } catch (err) {
      console.warn('Audio playback error', err);
    }
  }
}

export const soundManager = new SoundManager();
