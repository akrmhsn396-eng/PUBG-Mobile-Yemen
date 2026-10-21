/**
 * Procedural Web Audio API sound generator and dynamic synthwave soundtrack.
 * Zero external audio files; 100% synthesized in real time.
 */

class SoundManager {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private masterGain: GainNode | null = null;
  private musicGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private isMusicPlaying: boolean = false;
  private musicStep: number = 0;
  private musicTimer: number | null = null;
  private currentBpm: number = 128;

  constructor() {
    // AudioContext will be initialized on first user interaction
  }

  private initContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();

      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = this.isMuted ? 0 : 0.7;
      this.masterGain.connect(this.ctx.destination);

      this.musicGain = this.ctx.createGain();
      this.musicGain.gain.value = 0.35;
      this.musicGain.connect(this.masterGain);

      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.value = 0.65;
      this.sfxGain.connect(this.masterGain);
    }

    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public ensureAudio() {
    this.initContext();
    if (!this.isMusicPlaying) {
      this.startMusic();
    }
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(this.isMuted ? 0 : 0.7, this.ctx.currentTime, 0.05);
    }
    return this.isMuted;
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  // SFX: Player Primary Blaster Fire
  public playLaser(pitchMultiplier = 1.0) {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx || !this.sfxGain) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    const baseFreq = 880 * pitchMultiplier;
    osc.frequency.setValueAtTime(baseFreq, t);
    osc.frequency.exponentialRampToValueAtTime(110 * pitchMultiplier, t + 0.12);

    // Filter to give high-tech zap feel
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(4500, t);
    filter.frequency.exponentialRampToValueAtTime(800, t + 0.12);

    gain.gain.setValueAtTime(0.3, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(t);
    osc.stop(t + 0.13);
  }

  // Realistic Weapon Gunshot: M416 / 5.56mm Tactical High-Velocity Burst
  public playM416Shot() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx || !this.sfxGain) return;

    const t = this.ctx.currentTime;

    // 1. Sharp Supersonic Crack (White noise burst filtered high)
    const dur = 0.12;
    const bufSize = Math.floor(this.ctx.sampleRate * dur);
    const buf = this.ctx.createBuffer(1, bufSize, this.ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < bufSize; i++) {
      d[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufSize * 0.18));
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = buf;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(3200, t);
    filter.Q.value = 2.0;

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.55, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + dur);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);
    noise.start(t);

    // 2. Punchy Mid-Frequency Bark
    const osc = this.ctx.createOscillator();
    const oscGain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(480, t);
    osc.frequency.exponentialRampToValueAtTime(65, t + 0.08);

    oscGain.gain.setValueAtTime(0.4, t);
    oscGain.gain.exponentialRampToValueAtTime(0.001, t + 0.09);

    osc.connect(oscGain);
    oscGain.connect(this.sfxGain);
    osc.start(t);
    osc.stop(t + 0.1);
  }

  // Realistic Weapon Gunshot: AKM / 7.62mm Heavy Assault Thump
  public playAKMShot() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx || !this.sfxGain) return;

    const t = this.ctx.currentTime;
    const dur = 0.16;

    // Heavy bass thump
    const subOsc = this.ctx.createOscillator();
    const subGain = this.ctx.createGain();
    subOsc.type = 'triangle';
    subOsc.frequency.setValueAtTime(260, t);
    subOsc.frequency.exponentialRampToValueAtTime(45, t + 0.12);

    subGain.gain.setValueAtTime(0.65, t);
    subGain.gain.exponentialRampToValueAtTime(0.001, t + 0.14);

    subOsc.connect(subGain);
    subGain.connect(this.sfxGain);
    subOsc.start(t);
    subOsc.stop(t + 0.15);

    // Crack noise
    const bufSize = Math.floor(this.ctx.sampleRate * dur);
    const buf = this.ctx.createBuffer(1, bufSize, this.ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < bufSize; i++) {
      d[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufSize * 0.25));
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = buf;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(2400, t);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.6, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + dur);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);
    noise.start(t);
  }

  // Realistic Weapon Gunshot: AWM .300 Magnum Sniper (Thunderous Sonic Boom)
  public playAWMShot() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx || !this.sfxGain) return;

    const t = this.ctx.currentTime;
    const dur = 0.65;

    // Tremendous sonic boom & echo
    const bufSize = Math.floor(this.ctx.sampleRate * dur);
    const buf = this.ctx.createBuffer(1, bufSize, this.ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < bufSize; i++) {
      d[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufSize * 0.15));
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = buf;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(4500, t);
    filter.frequency.exponentialRampToValueAtTime(200, t + dur);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.9, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + dur);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);
    noise.start(t);

    // Deep sub-shockwave
    const subOsc = this.ctx.createOscillator();
    const subGain = this.ctx.createGain();
    subOsc.type = 'sine';
    subOsc.frequency.setValueAtTime(150, t);
    subOsc.frequency.exponentialRampToValueAtTime(30, t + 0.45);

    subGain.gain.setValueAtTime(0.85, t);
    subGain.gain.exponentialRampToValueAtTime(0.001, t + 0.48);

    subOsc.connect(subGain);
    subGain.connect(this.sfxGain);
    subOsc.start(t);
    subOsc.stop(t + 0.5);

    // Bolt rack cycle after 0.4s
    setTimeout(() => {
      if (!this.ctx || !this.sfxGain || this.isMuted) return;
      const t2 = this.ctx.currentTime;
      const bOsc = this.ctx.createOscillator();
      const bGain = this.ctx.createGain();
      bOsc.type = 'triangle';
      bOsc.frequency.setValueAtTime(1400, t2);
      bOsc.frequency.exponentialRampToValueAtTime(600, t2 + 0.08);
      bGain.gain.setValueAtTime(0.2, t2);
      bGain.gain.exponentialRampToValueAtTime(0.001, t2 + 0.09);
      bOsc.connect(bGain);
      bGain.connect(this.sfxGain);
      bOsc.start(t2);
      bOsc.stop(t2 + 0.1);
    }, 380);
  }

  // Realistic Weapon Gunshot: RPG-7 Rocket Launch
  public playRPGShot() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx || !this.sfxGain) return;

    const t = this.ctx.currentTime;
    // Initial whoosh
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(80, t);
    osc.frequency.linearRampToValueAtTime(380, t + 0.25);

    gain.gain.setValueAtTime(0.5, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(t);
    osc.stop(t + 0.36);
  }

  // Rotary Vulcan Minigun rapid cycle
  public playMinigunShot() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx || !this.sfxGain) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(320, t);
    osc.frequency.exponentialRampToValueAtTime(70, t + 0.045);

    gain.gain.setValueAtTime(0.3, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.05);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(t);
    osc.stop(t + 0.055);
  }

  // Javelin Guided Missile Launch: ignition roar & turbine whoosh
  public playJavelinShot() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx || !this.sfxGain) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(140, t);
    osc.frequency.exponentialRampToValueAtTime(620, t + 0.3);

    gain.gain.setValueAtTime(0.65, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.45);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(t);
    osc.stop(t + 0.46);
  }

  // Valkyrie Multi-Rocket Salvo: high-pitched shrieking micro-rockets
  public playValkyrieShot() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx || !this.sfxGain) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(340 + Math.random() * 200, t);
    osc.frequency.linearRampToValueAtTime(880, t + 0.12);

    gain.gain.setValueAtTime(0.4, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(t);
    osc.stop(t + 0.16);
  }

  // Realistic Tactical Weapon Reload Click (Mechanical magazine insert)
  public playReload() {
    this.playReloadSound();
  }

  public playReloadSound() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx || !this.sfxGain) return;

    const t = this.ctx.currentTime;
    // Magazine drop clack
    const osc1 = this.ctx.createOscillator();
    const gain1 = this.ctx.createGain();
    osc1.type = 'triangle';
    osc1.frequency.setValueAtTime(850, t);
    osc1.frequency.exponentialRampToValueAtTime(200, t + 0.06);
    gain1.gain.setValueAtTime(0.3, t);
    gain1.gain.exponentialRampToValueAtTime(0.001, t + 0.07);
    osc1.connect(gain1);
    gain1.connect(this.sfxGain);
    osc1.start(t);
    osc1.stop(t + 0.08);

    // Magazine lock in click (at 0.2s)
    const osc2 = this.ctx.createOscillator();
    const gain2 = this.ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(1200, t + 0.18);
    osc2.frequency.exponentialRampToValueAtTime(450, t + 0.25);
    gain2.gain.setValueAtTime(0.35, t + 0.18);
    gain2.gain.exponentialRampToValueAtTime(0.001, t + 0.26);
    osc2.connect(gain2);
    gain2.connect(this.sfxGain);
    osc2.start(t + 0.18);
    osc2.stop(t + 0.27);
  }

  // Authentic PUBG Hitmarker Sound (Tick for body hit, high-pitched Ping for headshot!)
  public playHitmarker(isHeadshot = false) {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx || !this.sfxGain) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    if (isHeadshot) {
      // Crisp metallic ding / headshot ping!
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1850, t);
      osc.frequency.exponentialRampToValueAtTime(1200, t + 0.12);
      gain.gain.setValueAtTime(0.45, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.13);
    } else {
      // Soft tactile body hit click
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(900, t);
      osc.frequency.exponentialRampToValueAtTime(300, t + 0.04);
      gain.gain.setValueAtTime(0.25, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.05);
    }

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(t);
    osc.stop(t + (isHeadshot ? 0.14 : 0.06));
  }

  // Procedural Audio Synthesis Trigger: Crisp, high-pitched tactile click when landing a hit
  public playHitClick(isHeadshot = false) {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx || !this.sfxGain) return;

    const t = this.ctx.currentTime;

    // 1. High-frequency transient click burst
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(isHeadshot ? 3400 : 2600, t);
    filter.Q.value = 4.5;

    osc.type = isHeadshot ? 'sine' : 'triangle';
    const startFreq = isHeadshot ? 3800 : 2900;
    const endFreq = isHeadshot ? 2100 : 1300;
    osc.frequency.setValueAtTime(startFreq, t);
    osc.frequency.exponentialRampToValueAtTime(endFreq, t + 0.032);

    gain.gain.setValueAtTime(isHeadshot ? 0.55 : 0.4, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.035);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(t);
    osc.stop(t + 0.04);

    // 2. Headshot bonus resonant metallic ring
    if (isHeadshot) {
      const ping = this.ctx.createOscillator();
      const pingGain = this.ctx.createGain();
      ping.type = 'sine';
      ping.frequency.setValueAtTime(4200, t);
      ping.frequency.exponentialRampToValueAtTime(2600, t + 0.15);
      pingGain.gain.setValueAtTime(0.35, t);
      pingGain.gain.exponentialRampToValueAtTime(0.001, t + 0.16);

      ping.connect(pingGain);
      pingGain.connect(this.sfxGain);
      ping.start(t);
      ping.stop(t + 0.17);
    }
  }

  // Weapon Overheat Alarm & Steam Release Hiss
  public playOverheatWarning() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx || !this.sfxGain) return;

    const t = this.ctx.currentTime;

    // Steam release hiss (white noise through bandpass)
    const bufSize = Math.floor(this.ctx.sampleRate * 0.35);
    const buf = this.ctx.createBuffer(1, bufSize, this.ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < bufSize; i++) {
      data[i] = (Math.random() * 2 - 1) * 0.5;
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = buf;
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(1500, t);
    filter.frequency.linearRampToValueAtTime(800, t + 0.35);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.35, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);
    noise.start(t);

    // Warning electronic beeps
    [0, 0.12].forEach((delay) => {
      if (!this.ctx || !this.sfxGain) return;
      const osc = this.ctx.createOscillator();
      const oscGain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(920, t + delay);
      oscGain.gain.setValueAtTime(0.2, t + delay);
      oscGain.gain.exponentialRampToValueAtTime(0.001, t + delay + 0.07);

      osc.connect(oscGain);
      oscGain.connect(this.sfxGain);
      osc.start(t + delay);
      osc.stop(t + delay + 0.08);
    });
  }

  // Weapon Cooling Complete Confirmation Chime
  public playCoolingComplete() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx || !this.sfxGain) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(587.33, t); // D5
    osc.frequency.setValueAtTime(880, t + 0.08); // A5
    gain.gain.setValueAtTime(0.25, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(t);
    osc.stop(t + 0.22);
  }

  // Tactical Target Lock Confirmation Sound (Manual Enemy Aim)
  public playTargetLock() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx || !this.sfxGain) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(1046.5, t); // C6
    osc.frequency.setValueAtTime(1567.98, t + 0.05); // G6
    gain.gain.setValueAtTime(0.3, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.16);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(t);
    osc.stop(t + 0.18);
  }

  // Environmental Hazard: Electric Water Shock Zap
  public playElectricShock() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx || !this.sfxGain) return;

    const t = this.ctx.currentTime;
    // White noise spark burst
    const bufSize = Math.floor(this.ctx.sampleRate * 0.12);
    const buf = this.ctx.createBuffer(1, bufSize, this.ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < bufSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufSize * 0.25));
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = buf;

    const bq = this.ctx.createBiquadFilter();
    bq.type = 'bandpass';
    bq.frequency.setValueAtTime(3200, t);
    bq.Q.setValueAtTime(4.0, t);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.35, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);

    noise.connect(bq);
    bq.connect(gain);
    gain.connect(this.sfxGain);
    noise.start(t);

    // Rapid crackle oscillator
    const osc = this.ctx.createOscillator();
    const oscGain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(120, t);
    osc.frequency.setValueAtTime(840, t + 0.04);
    osc.frequency.setValueAtTime(220, t + 0.08);

    oscGain.gain.setValueAtTime(0.2, t);
    oscGain.gain.exponentialRampToValueAtTime(0.001, t + 0.1);

    osc.connect(oscGain);
    oscGain.connect(this.sfxGain);
    osc.start(t);
    osc.stop(t + 0.11);
  }

  // Environmental Hazard: Geiger Counter Clicks (Radioactive Zone)
  public playGeigerClick(count = 3) {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx || !this.sfxGain) return;

    const t = this.ctx.currentTime;
    for (let i = 0; i < count; i++) {
      const delay = Math.random() * 0.08;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(1800 + Math.random() * 600, t + delay);

      gain.gain.setValueAtTime(0.22, t + delay);
      gain.gain.exponentialRampToValueAtTime(0.001, t + delay + 0.015);

      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(t + delay);
      osc.stop(t + delay + 0.018);
    }
  }

  // Environmental Hazard: Warning Klaxon
  public playHazardWarningAlarm() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx || !this.sfxGain) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(740, t); // F#5
    osc.frequency.setValueAtTime(580, t + 0.1); // D5

    gain.gain.setValueAtTime(0.18, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.22);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(t);
    osc.stop(t + 0.24);
  }

  // Airdrop Cargo Plane Flyby Siren / Drone
  public playAirdropAlarm() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx || !this.sfxGain) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(95, t);
    osc.frequency.linearRampToValueAtTime(110, t + 1.2);

    gain.gain.setValueAtTime(0.18, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 1.5);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(t);
    osc.stop(t + 1.6);
  }

  // SFX: Enemy Laser / Gunshot
  public playEnemyLaser() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx || !this.sfxGain) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(520, t);
    osc.frequency.exponentialRampToValueAtTime(80, t + 0.11);

    gain.gain.setValueAtTime(0.3, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.11);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(t);
    osc.stop(t + 0.12);
  }

  // SFX: Heavy Impact & Explosion
  public playExplosion(scale = 1.0) {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx || !this.sfxGain) return;

    const t = this.ctx.currentTime;
    const dur = Math.min(0.8 * scale, 1.4);

    // Synthesize noise buffer
    const bufferSize = Math.floor(this.ctx.sampleRate * dur);
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(800, t);
    filter.frequency.exponentialRampToValueAtTime(60, t + dur);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(Math.min(0.5 * scale, 0.9), t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + dur);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);

    noise.start(t);

    // Sub-bass thump
    const subOsc = this.ctx.createOscillator();
    const subGain = this.ctx.createGain();
    subOsc.type = 'sine';
    subOsc.frequency.setValueAtTime(140, t);
    subOsc.frequency.exponentialRampToValueAtTime(35, t + 0.35);

    subGain.gain.setValueAtTime(0.4 * scale, t);
    subGain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);

    subOsc.connect(subGain);
    subGain.connect(this.sfxGain);

    subOsc.start(t);
    subOsc.stop(t + 0.36);
  }

  // SFX: Boost Surge / Jet Rush
  public playBoost() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx || !this.sfxGain) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(90, t);
    osc.frequency.exponentialRampToValueAtTime(280, t + 0.25);

    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(300, t);
    filter.frequency.exponentialRampToValueAtTime(1600, t + 0.25);
    filter.Q.value = 3;

    gain.gain.setValueAtTime(0.35, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.4);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(t);
    osc.stop(t + 0.42);
  }

  // SFX: EMP Shockwave
  public playEMP() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx || !this.sfxGain) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(1200, t);
    osc.frequency.exponentialRampToValueAtTime(80, t + 0.6);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(3000, t);
    filter.frequency.exponentialRampToValueAtTime(200, t + 0.6);

    gain.gain.setValueAtTime(0.6, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.7);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(t);
    osc.stop(t + 0.72);
  }

  // SFX: Shield Hit / Deflection
  public playShieldHit() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx || !this.sfxGain) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(580, t);
    osc.frequency.exponentialRampToValueAtTime(220, t + 0.18);

    gain.gain.setValueAtTime(0.35, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.18);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(t);
    osc.stop(t + 0.19);
  }

  // SFX: Railgun Hypersonic Shot
  public playRailgun() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx || !this.sfxGain) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(1400, t);
    osc.frequency.exponentialRampToValueAtTime(120, t + 0.22);

    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(2400, t);
    filter.frequency.exponentialRampToValueAtTime(300, t + 0.22);
    filter.Q.value = 4.0;

    gain.gain.setValueAtTime(0.45, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(t);
    osc.stop(t + 0.26);
  }

  // SFX: Homing Micro-Missile Launch
  public playMissile() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx || !this.sfxGain) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(320, t);
    osc.frequency.linearRampToValueAtTime(860, t + 0.18);

    gain.gain.setValueAtTime(0.25, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.22);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(t);
    osc.stop(t + 0.23);
  }

  // SFX: Weapon Upgrade Fanfare
  public playUpgradeFanfare() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx || !this.sfxGain) return;

    const chords = [440, 554.37, 659.25, 880]; // A major triumphant chord
    const t = this.ctx.currentTime;
    chords.forEach((freq, idx) => {
      if (!this.ctx || !this.sfxGain) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const start = t + idx * 0.06;

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, start);

      gain.gain.setValueAtTime(0.2, start);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.35);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(start);
      osc.stop(start + 0.36);
    });
  }

  // SFX: Health / Powerup Picked
  public playPickup() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx || !this.sfxGain) return;

    const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
    const t = this.ctx.currentTime;

    notes.forEach((freq, idx) => {
      if (!this.ctx || !this.sfxGain) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const start = t + idx * 0.045;

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, start);

      gain.gain.setValueAtTime(0.2, start);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.15);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(start);
      osc.stop(start + 0.16);
    });
  }

  // SFX: Telegraph Warning Beep
  public playWarningBeep() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx || !this.sfxGain) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'square';
    osc.frequency.setValueAtTime(950, t);

    gain.gain.setValueAtTime(0.15, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.08);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(t);
    osc.stop(t + 0.09);
  }

  // PROCEDURAL SYNTHWAVE SOUNDTRACK
  public startMusic() {
    if (this.isMusicPlaying) return;
    this.initContext();
    this.isMusicPlaying = true;
    this.musicStep = 0;

    const stepInterval = (60 / this.currentBpm) / 4; // 16th notes

    const bassLine = [
      65.41, 65.41, 65.41, 65.41,  // C2
      65.41, 65.41, 77.78, 87.31,  // Eb2, F2
      58.27, 58.27, 58.27, 58.27,  // Bb1
      58.27, 58.27, 65.41, 73.42,  // C2, D2
      49.00, 49.00, 49.00, 49.00,  // G1
      49.00, 49.00, 55.00, 58.27,  // A1, Bb1
      51.91, 51.91, 51.91, 51.91,  // Ab1
      51.91, 58.27, 65.41, 77.78   // Bb1, C2, Eb2
    ];

    const leadArp = [
      261.63, 311.13, 392.00, 523.25, 392.00, 311.13, 261.63, 392.00,
      233.08, 293.66, 349.23, 466.16, 349.23, 293.66, 233.08, 349.23,
      196.00, 246.94, 293.66, 392.00, 293.66, 246.94, 196.00, 293.66,
      207.65, 261.63, 311.13, 415.30, 311.13, 261.63, 207.65, 311.13
    ];

    const tick = () => {
      if (!this.isMusicPlaying || !this.ctx || !this.musicGain) return;

      const t = this.ctx.currentTime;
      const step = this.musicStep;

      // 1. Kick on 0, 4, 8, 12 of a 16-step bar
      if (step % 4 === 0) {
        const kickOsc = this.ctx.createOscillator();
        const kickGain = this.ctx.createGain();
        kickOsc.frequency.setValueAtTime(130, t);
        kickOsc.frequency.exponentialRampToValueAtTime(35, t + 0.12);

        kickGain.gain.setValueAtTime(0.4, t);
        kickGain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);

        kickOsc.connect(kickGain);
        kickGain.connect(this.musicGain);

        kickOsc.start(t);
        kickOsc.stop(t + 0.13);
      }

      // 2. Snare / Clack on beats 4 and 12 (steps 4, 12)
      if (step % 8 === 4) {
        const snareNoise = this.createNoiseBuffer(0.12);
        if (snareNoise) {
          const filter = this.ctx.createBiquadFilter();
          filter.type = 'highpass';
          filter.frequency.value = 900;
          const snareGain = this.ctx.createGain();
          snareGain.gain.setValueAtTime(0.2, t);
          snareGain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);

          snareNoise.connect(filter);
          filter.connect(snareGain);
          snareGain.connect(this.musicGain);
          snareNoise.start(t);
        }
      }

      // 3. Hi-hat on off-beats
      if (step % 2 === 1) {
        const hhNoise = this.createNoiseBuffer(0.04);
        if (hhNoise) {
          const filter = this.ctx.createBiquadFilter();
          filter.type = 'highpass';
          filter.frequency.value = 6500;
          const hhGain = this.ctx.createGain();
          hhGain.gain.setValueAtTime(0.07, t);
          hhGain.gain.exponentialRampToValueAtTime(0.001, t + 0.04);

          hhNoise.connect(filter);
          filter.connect(hhGain);
          hhGain.connect(this.musicGain);
          hhNoise.start(t);
        }
      }

      // 4. Bass pulse
      const bassNote = bassLine[step % bassLine.length];
      const bassOsc = this.ctx.createOscillator();
      const bassFilter = this.ctx.createBiquadFilter();
      const bGain = this.ctx.createGain();

      bassOsc.type = 'sawtooth';
      bassOsc.frequency.setValueAtTime(bassNote, t);

      bassFilter.type = 'lowpass';
      bassFilter.frequency.setValueAtTime(380, t);

      bGain.gain.setValueAtTime(0.22, t);
      bGain.gain.exponentialRampToValueAtTime(0.01, t + stepInterval * 0.9);

      bassOsc.connect(bassFilter);
      bassFilter.connect(bGain);
      bGain.connect(this.musicGain);

      bassOsc.start(t);
      bassOsc.stop(t + stepInterval * 0.95);

      // 5. Arpeggio lead
      const leadNote = leadArp[step % leadArp.length];
      const leadOsc = this.ctx.createOscillator();
      const lGain = this.ctx.createGain();

      leadOsc.type = 'sine';
      leadOsc.frequency.setValueAtTime(leadNote, t);

      lGain.gain.setValueAtTime(0.08, t);
      lGain.gain.exponentialRampToValueAtTime(0.001, t + stepInterval * 0.85);

      leadOsc.connect(lGain);
      lGain.connect(this.musicGain);

      leadOsc.start(t);
      leadOsc.stop(t + stepInterval * 0.9);

      this.musicStep = (this.musicStep + 1) % 64;
    };

    this.musicTimer = window.setInterval(tick, stepInterval * 1000);
  }

  private createNoiseBuffer(duration: number): AudioBufferSourceNode | null {
    if (!this.ctx) return null;
    const bufferSize = Math.floor(this.ctx.sampleRate * duration);
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;
    return noise;
  }

  public playKillStreak(streakLevel: number) {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx || !this.sfxGain) return;

    const t = this.ctx.currentTime;
    const pitchMultiplier = Math.min(2.5, 1.0 + (streakLevel - 1) * 0.25);
    
    const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
    notes.forEach((baseFreq, idx) => {
      const noteTime = t + idx * 0.08;
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();

      osc.type = idx === notes.length - 1 ? 'triangle' : 'sine';
      const freq = baseFreq * pitchMultiplier;
      osc.frequency.setValueAtTime(freq, noteTime);

      gain.gain.setValueAtTime(0.18, noteTime);
      gain.gain.exponentialRampToValueAtTime(0.001, noteTime + 0.25);

      osc.connect(gain);
      gain.connect(this.sfxGain!);

      osc.start(noteTime);
      osc.stop(noteTime + 0.28);
    });
  }

  public setCombatIntensity(intensity: number) {
    if (this.musicGain && this.ctx) {
      const targetGain = 0.25 + intensity * 0.3;
      this.musicGain.gain.setTargetAtTime(targetGain, this.ctx.currentTime, 0.2);
    }
    this.currentBpm = Math.round(120 + intensity * 35);
  }

  public playThunder() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx || !this.sfxGain) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(65, t);
    osc.frequency.exponentialRampToValueAtTime(25, t + 1.8);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(350, t);
    filter.frequency.exponentialRampToValueAtTime(90, t + 1.8);

    gain.gain.setValueAtTime(0.5, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 1.8);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(t);
    osc.stop(t + 1.85);
  }

  public playWindGust() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx || !this.sfxGain) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(140, t);
    osc.frequency.linearRampToValueAtTime(220, t + 0.6);
    osc.frequency.exponentialRampToValueAtTime(80, t + 1.4);

    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(400, t);
    filter.frequency.linearRampToValueAtTime(700, t + 0.5);
    filter.frequency.exponentialRampToValueAtTime(250, t + 1.4);

    gain.gain.setValueAtTime(0.05, t);
    gain.gain.linearRampToValueAtTime(0.2, t + 0.5);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 1.4);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(t);
    osc.stop(t + 1.45);
  }

  // ========================================================
  // HUMAN COMBATANT AUDIO (أصوات المقاتل البشري والزحف والمشاهد البانورامية)
  // ========================================================

  // Human Military Combat Footsteps on Desert Gravel / Sand
  public playHumanFootstep(isSprint = false, isCrawl = false) {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx || !this.sfxGain) return;

    const t = this.ctx.currentTime;
    const dur = isCrawl ? 0.22 : isSprint ? 0.09 : 0.12;

    if (isCrawl) {
      // Cloth and grit rustle on the ground (زحف على الرمال والحصى)
      const bufSize = Math.floor(this.ctx.sampleRate * dur);
      const buf = this.ctx.createBuffer(1, bufSize, this.ctx.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < bufSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufSize * 0.35));
      }
      const noise = this.ctx.createBufferSource();
      noise.buffer = buf;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(850, t);
      filter.Q.setValueAtTime(1.8, t);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.18, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + dur);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.sfxGain);
      noise.start(t);
      return;
    }

    // Heavy tactical combat boot impact on gravel/earth
    const bufSize = Math.floor(this.ctx.sampleRate * dur);
    const buf = this.ctx.createBuffer(1, bufSize, this.ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < bufSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufSize * 0.2));
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = buf;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(isSprint ? 1400 : 950, t);
    filter.frequency.exponentialRampToValueAtTime(200, t + dur);

    const gain = this.ctx.createGain();
    const vol = isSprint ? 0.28 : 0.18;
    gain.gain.setValueAtTime(vol, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + dur);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);
    noise.start(t);

    // Deep sub-thump of boot heel striking earth
    const thump = this.ctx.createOscillator();
    const thumpGain = this.ctx.createGain();
    thump.type = 'sine';
    thump.frequency.setValueAtTime(isSprint ? 95 : 70, t);
    thump.frequency.exponentialRampToValueAtTime(35, t + dur);

    thumpGain.gain.setValueAtTime(isSprint ? 0.22 : 0.14, t);
    thumpGain.gain.exponentialRampToValueAtTime(0.001, t + dur);

    thump.connect(thumpGain);
    thumpGain.connect(this.sfxGain);
    thump.start(t);
    thump.stop(t + dur);
  }

  // Tactical Stance Change (Stand <-> Crouch <-> Prone)
  public playHumanStanceChange() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx || !this.sfxGain) return;

    const t = this.ctx.currentTime;
    // Gear shift / tactical harness buckle click & rustle
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(320, t);
    osc.frequency.exponentialRampToValueAtTime(140, t + 0.12);

    gain.gain.setValueAtTime(0.18, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(t);
    osc.stop(t + 0.13);
  }

  // Human Soldier Hurt / Exertion Grunt (صوت تأوه الجندي البشري عند الإصابة)
  public playHumanGrunt() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx || !this.sfxGain) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(180, t);
    osc.frequency.exponentialRampToValueAtTime(95, t + 0.22);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(700, t);
    filter.frequency.exponentialRampToValueAtTime(250, t + 0.22);

    gain.gain.setValueAtTime(0.3, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.22);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(t);
    osc.stop(t + 0.24);
  }

  // Majestic Panoramic Vista Chime (رنين المشهد البانورامي السينمائي)
  public playPanoramicVistaChime() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx || !this.sfxGain) return;

    const t = this.ctx.currentTime;
    const chords = [523.25, 659.25, 783.99, 1046.5]; // C major open cinematic chord
    chords.forEach((freq, idx) => {
      if (!this.ctx || !this.sfxGain) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t + idx * 0.08);

      gain.gain.setValueAtTime(0, t + idx * 0.08);
      gain.gain.linearRampToValueAtTime(0.12, t + idx * 0.08 + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, t + idx * 0.08 + 1.6);

      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(t + idx * 0.08);
      osc.stop(t + idx * 0.08 + 1.65);
    });
  }

  public stopMusic() {
    if (this.musicTimer !== null) {
      clearInterval(this.musicTimer);
      this.musicTimer = null;
    }
    this.isMusicPlaying = false;
  }
}

export const soundManager = new SoundManager();
