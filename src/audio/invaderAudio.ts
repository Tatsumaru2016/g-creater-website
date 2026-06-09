let audioCtx: AudioContext | null = null;
let sfxOn = true;
let bgmOn = true;
let bgmNoteIdx = 0;

// Space Invaders–style bass ostinato (approximate semitones)
const BGM_NOTES = [55, 49, 44, 41];

function getCtx(): AudioContext | null {
  try {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    }
    if (audioCtx.state === "suspended") {
      void audioCtx.resume();
    }
    return audioCtx;
  } catch {
    return null;
  }
}

function tone(
  freq: number,
  duration: number,
  type: OscillatorType,
  volume: number,
  freqEnd?: number
) {
  if (!sfxOn) return;
  const ctx = getCtx();
  if (!ctx) return;

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, ctx.currentTime);
  if (freqEnd) {
    osc.frequency.exponentialRampToValueAtTime(Math.max(freqEnd, 1), ctx.currentTime + duration);
  }
  gain.gain.setValueAtTime(volume, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start();
  osc.stop(ctx.currentTime + duration);
}

function noiseBurst(duration: number, volume: number) {
  if (!sfxOn) return;
  const ctx = getCtx();
  if (!ctx) return;

  const bufferSize = Math.floor(ctx.sampleRate * duration);
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
  }

  const source = ctx.createBufferSource();
  const gain = ctx.createGain();
  const filter = ctx.createBiquadFilter();
  source.buffer = buffer;
  filter.type = "lowpass";
  filter.frequency.value = 2800;
  gain.gain.setValueAtTime(volume, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
  source.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);
  source.start();
}

export type InvaderSfx =
  | "shoot"
  | "explosion"
  | "enemyShoot"
  | "march"
  | "playerExplosion"
  | "uiClick"
  | "stageClear"
  | "ufoAppear";

export function setInvaderAudioOptions(opts: { sfx?: boolean; bgm?: boolean }) {
  if (opts.sfx !== undefined) sfxOn = opts.sfx;
  if (opts.bgm !== undefined) bgmOn = opts.bgm;
}

export function isInvaderSfxEnabled() {
  return sfxOn;
}

export function isInvaderBgmEnabled() {
  return bgmOn;
}

export type AppTone = "click" | "success" | "transition" | "clear";

/** UI・シーン遷移用（効果音トグルに連動） */
export function playAppTone(type: AppTone) {
  if (!sfxOn) return;
  const ctx = getCtx();
  if (!ctx) return;

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain);
  gain.connect(ctx.destination);

  if (type === "click") {
    osc.type = "square";
    osc.frequency.setValueAtTime(450, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(900, ctx.currentTime + 0.08);
    gain.gain.setValueAtTime(0.04, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);
    osc.start();
    osc.stop(ctx.currentTime + 0.08);
  } else if (type === "success") {
    osc.type = "sine";
    osc.frequency.setValueAtTime(523.25, ctx.currentTime);
    osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.08);
    osc.frequency.setValueAtTime(783.99, ctx.currentTime + 0.16);
    gain.gain.setValueAtTime(0.05, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
    osc.start();
    osc.stop(ctx.currentTime + 0.3);
  } else if (type === "transition") {
    osc.type = "triangle";
    osc.frequency.setValueAtTime(140, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(320, ctx.currentTime + 0.22);
    gain.gain.setValueAtTime(0.08, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.22);
    osc.start();
    osc.stop(ctx.currentTime + 0.22);
  } else if (type === "clear") {
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(280, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(70, ctx.currentTime + 0.18);
    gain.gain.setValueAtTime(0.03, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.18);
    osc.start();
    osc.stop(ctx.currentTime + 0.18);
  }
}

export function playInvaderSfx(type: InvaderSfx) {
  if (type === "uiClick") {
    if (!sfxOn) return;
    tone(520, 0.06, "square", 0.035, 780);
    return;
  }
  if (!sfxOn) return;

  switch (type) {
    case "shoot":
      tone(880, 0.07, "square", 0.045, 1200);
      break;
    case "enemyShoot":
      tone(180, 0.1, "square", 0.04, 90);
      break;
    case "march":
      tone(68, 0.09, "square", 0.028);
      break;
    case "explosion":
      noiseBurst(0.18, 0.07);
      tone(220, 0.14, "sawtooth", 0.05, 40);
      break;
    case "playerExplosion":
      noiseBurst(0.35, 0.1);
      tone(160, 0.25, "sawtooth", 0.07, 30);
      tone(90, 0.3, "square", 0.04, 20);
      break;
    case "stageClear":
      tone(523.25, 0.1, "square", 0.04);
      tone(659.25, 0.1, "square", 0.04);
      tone(783.99, 0.14, "square", 0.05);
      break;
    case "ufoAppear":
      tone(1046.5, 0.08, "square", 0.035);
      tone(880, 0.12, "square", 0.03, 440);
      break;
  }
}

/** インベーダー移動と同期する BGM マーチ音（BGM ON 時のみ・効果音とは独立） */
export function playInvaderMarchNote() {
  if (!bgmOn) return;
  const ctx = getCtx();
  if (!ctx) return;

  const freq = BGM_NOTES[bgmNoteIdx % BGM_NOTES.length];
  bgmNoteIdx++;

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = "square";
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(0.028, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start();
  osc.stop(ctx.currentTime + 0.12);
}

export function setInvaderBgmTempo(_aliveRatio: number) {
  // テンポは HeaderInvaders の march 間隔で制御
}

export function startInvaderBgm() {
  if (!bgmOn) return;
  bgmNoteIdx = 0;
}

export function stopInvaderBgm() {
  bgmNoteIdx = 0;
}

export function resumeAudioContext() {
  void getCtx()?.resume();
}
