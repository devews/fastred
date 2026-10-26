/**
 * Procedural Web Audio Engine Synthesizer for 3D Racing Game
 * Generates all motor, drift, nitro, collision, and UI sounds in code without any external files.
 */

class SoundManager {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private masterGain: GainNode | null = null;

  // Engine audio nodes
  private engineOsc1: OscillatorNode | null = null;
  private engineOsc2: OscillatorNode | null = null;
  private engineSubOsc: OscillatorNode | null = null;
  private engineGain: GainNode | null = null;
  private engineFilter: BiquadFilterNode | null = null;
  private isEngineRunning: boolean = false;

  // Tire screech audio nodes
  private screechGain: GainNode | null = null;
  private screechFilter: BiquadFilterNode | null = null;
  private screechSource: AudioBufferSourceNode | null = null;

  // Nitro audio nodes
  private nitroGain: GainNode | null = null;
  private nitroFilter: BiquadFilterNode | null = null;
  private nitroOsc: OscillatorNode | null = null;

  private isInitialized: boolean = false;

  private initContext() {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
      return;
    }

    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : 0.6, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);

      this.setupEngineSynth();
      this.setupScreechSynth();
      this.setupNitroSynth();

      this.isInitialized = true;
    } catch {
      // AudioContext unavailable or restricted
    }
  }

  private setupEngineSynth() {
    if (!this.ctx || !this.masterGain) return;

    this.engineGain = this.ctx.createGain();
    this.engineGain.gain.setValueAtTime(0, this.ctx.currentTime);

    this.engineFilter = this.ctx.createBiquadFilter();
    this.engineFilter.type = 'lowpass';
    this.engineFilter.frequency.setValueAtTime(450, this.ctx.currentTime);
    this.engineFilter.Q.setValueAtTime(3.5, this.ctx.currentTime);

    this.engineOsc1 = this.ctx.createOscillator();
    this.engineOsc1.type = 'sawtooth';
    this.engineOsc1.frequency.setValueAtTime(55, this.ctx.currentTime);

    this.engineOsc2 = this.ctx.createOscillator();
    this.engineOsc2.type = 'triangle';
    this.engineOsc2.frequency.setValueAtTime(110, this.ctx.currentTime);

    this.engineSubOsc = this.ctx.createOscillator();
    this.engineSubOsc.type = 'sine';
    this.engineSubOsc.frequency.setValueAtTime(27.5, this.ctx.currentTime);

    this.engineOsc1.connect(this.engineFilter);
    this.engineOsc2.connect(this.engineFilter);
    this.engineSubOsc.connect(this.engineFilter);

    this.engineFilter.connect(this.engineGain);
    this.engineGain.connect(this.masterGain);

    this.engineOsc1.start();
    this.engineOsc2.start();
    this.engineSubOsc.start();
    this.isEngineRunning = true;
  }

  private setupScreechSynth() {
    if (!this.ctx || !this.masterGain) return;

    // Generate looping white/pink noise buffer
    const bufferSize = this.ctx.sampleRate * 2;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    let b0 = 0, b1 = 0, b2 = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99 * b0 + white * 0.05;
      b1 = 0.96 * b1 + white * 0.11;
      b2 = 0.86 * b2 + white * 0.25;
      output[i] = (b0 + b1 + b2 + white * 0.5) * 0.2;
    }

    this.screechSource = this.ctx.createBufferSource();
    this.screechSource.buffer = noiseBuffer;
    this.screechSource.loop = true;

    this.screechFilter = this.ctx.createBiquadFilter();
    this.screechFilter.type = 'bandpass';
    this.screechFilter.frequency.setValueAtTime(1400, this.ctx.currentTime);
    this.screechFilter.Q.setValueAtTime(4.0, this.ctx.currentTime);

    this.screechGain = this.ctx.createGain();
    this.screechGain.gain.setValueAtTime(0, this.ctx.currentTime);

    this.screechSource.connect(this.screechFilter);
    this.screechFilter.connect(this.screechGain);
    this.screechGain.connect(this.masterGain);

    this.screechSource.start();
  }

  private setupNitroSynth() {
    if (!this.ctx || !this.masterGain) return;

    this.nitroGain = this.ctx.createGain();
    this.nitroGain.gain.setValueAtTime(0, this.ctx.currentTime);

    this.nitroFilter = this.ctx.createBiquadFilter();
    this.nitroFilter.type = 'bandpass';
    this.nitroFilter.frequency.setValueAtTime(800, this.ctx.currentTime);
    this.nitroFilter.Q.setValueAtTime(2.0, this.ctx.currentTime);

    this.nitroOsc = this.ctx.createOscillator();
    this.nitroOsc.type = 'sawtooth';
    this.nitroOsc.frequency.setValueAtTime(90, this.ctx.currentTime);

    this.nitroOsc.connect(this.nitroFilter);
    this.nitroFilter.connect(this.nitroGain);
    this.nitroGain.connect(this.masterGain);

    this.nitroOsc.start();
  }

  public userGesture() {
    this.initContext();
  }

  public updateEngine(rpmNormalized: number, speedKmh: number, isAccelerating: boolean) {
    if (!this.ctx || !this.isEngineRunning || !this.engineOsc1 || !this.engineOsc2 || !this.engineSubOsc || !this.engineGain || !this.engineFilter) {
      return;
    }

    const t = this.ctx.currentTime;
    const baseFreq = 45 + rpmNormalized * 140; // 45Hz idle to 185Hz redline
    const filterFreq = 300 + rpmNormalized * 1400; // richer high frequencies as revs climb

    this.engineOsc1.frequency.setTargetAtTime(baseFreq, t, 0.05);
    this.engineOsc2.frequency.setTargetAtTime(baseFreq * 1.5, t, 0.05);
    this.engineSubOsc.frequency.setTargetAtTime(baseFreq * 0.5, t, 0.05);

    this.engineFilter.frequency.setTargetAtTime(filterFreq, t, 0.06);

    const targetGain = isAccelerating ? 0.35 + (speedKmh / 300) * 0.15 : 0.15 + (speedKmh / 300) * 0.08;
    this.engineGain.gain.setTargetAtTime(targetGain, t, 0.08);
  }

  public updateDrift(isDrifting: boolean, slipRatio: number) {
    if (!this.ctx || !this.screechGain || !this.screechFilter) return;

    const t = this.ctx.currentTime;
    if (isDrifting && slipRatio > 0.15) {
      const volume = Math.min(0.4, slipRatio * 0.45);
      const freq = 1100 + slipRatio * 800;
      this.screechGain.gain.setTargetAtTime(volume, t, 0.04);
      this.screechFilter.frequency.setTargetAtTime(freq, t, 0.04);
    } else {
      this.screechGain.gain.setTargetAtTime(0, t, 0.06);
    }
  }

  public updateNitro(isNitroActive: boolean) {
    if (!this.ctx || !this.nitroGain || !this.nitroFilter) return;

    const t = this.ctx.currentTime;
    if (isNitroActive) {
      this.nitroGain.gain.setTargetAtTime(0.35, t, 0.05);
      this.nitroFilter.frequency.setTargetAtTime(1400, t, 0.1);
    } else {
      this.nitroGain.gain.setTargetAtTime(0, t, 0.08);
    }
  }

  public playCollision(intensity: number) {
    if (!this.ctx || !this.masterGain || this.isMuted) return;

    try {
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(160, t);
      osc.frequency.exponentialRampToValueAtTime(30, t + 0.18);

      const amp = Math.min(0.7, 0.2 + intensity * 0.5);
      gain.gain.setValueAtTime(amp, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(t);
      osc.stop(t + 0.22);
    } catch {
      // Audio trigger guard
    }
  }

  public playCountdownBeep(isFinal: boolean) {
    if (!this.ctx || !this.masterGain || this.isMuted) return;

    try {
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = isFinal ? 'triangle' : 'sine';
      osc.frequency.setValueAtTime(isFinal ? 880 : 440, t);
      if (isFinal) {
        osc.frequency.exponentialRampToValueAtTime(1320, t + 0.35);
      }

      gain.gain.setValueAtTime(0.4, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + (isFinal ? 0.45 : 0.2));

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(t);
      osc.stop(t + (isFinal ? 0.45 : 0.2));
    } catch {
      // Audio trigger guard
    }
  }

  public playLapChime() {
    if (!this.ctx || !this.masterGain || this.isMuted) return;

    try {
      const t = this.ctx.currentTime;
      [523.25, 659.25, 783.99, 1046.5].forEach((freq, idx) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();

        const delay = idx * 0.08;
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, t + delay);

        gain.gain.setValueAtTime(0.25, t + delay);
        gain.gain.exponentialRampToValueAtTime(0.001, t + delay + 0.35);

        osc.connect(gain);
        gain.connect(this.masterGain!);

        osc.start(t + delay);
        osc.stop(t + delay + 0.38);
      });
    } catch {
      // Audio trigger guard
    }
  }

  public playVictoryFanfare() {
    if (!this.ctx || !this.masterGain || this.isMuted) return;

    try {
      const t = this.ctx.currentTime;
      const notes = [440, 554.37, 659.25, 880];
      notes.forEach((freq, idx) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();

        const start = t + idx * 0.12;
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, start);

        gain.gain.setValueAtTime(0.3, start);
        gain.gain.exponentialRampToValueAtTime(0.001, start + 0.5);

        osc.connect(gain);
        gain.connect(this.masterGain!);

        osc.start(start);
        osc.stop(start + 0.52);
      });
    } catch {
      // Audio trigger guard
    }
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : 0.6, this.ctx.currentTime);
    }
    return this.isMuted;
  }

  public getIsMuted(): boolean {
    return this.isMuted;
  }

  public stopAll() {
    if (this.engineGain && this.ctx) {
      this.engineGain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.05);
    }
    if (this.screechGain && this.ctx) {
      this.screechGain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.05);
    }
    if (this.nitroGain && this.ctx) {
      this.nitroGain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.05);
    }
  }
}

export const soundManager = new SoundManager();
