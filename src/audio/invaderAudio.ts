let audioCtx: AudioContext | null = null;
let masterGain: GainNode | null = null;
let globalSoundOn = false;
let invaderGameSoundOn = true;
let arkanoidGameSoundOn = true;
let bgmNoteIdx = 0;
let playEpoch = 0;

const activeNodes = new Set<AudioScheduledSourceNode>();

const BGM_ENABLED = false;
const BGM_NOTES = [55, 49, 44, 41];

function trackNode(node: AudioScheduledSourceNode) {
  activeNodes.add(node);
  node.addEventListener("ended", () => activeNodes.delete(node), { once: true });
}

function stopAllActiveNodes() {
  for (const node of activeNodes) {
    try {
      node.stop(0);
    } catch {
      /* already stopped */
    }
    try {
      node.disconnect();
    } catch {
      /* ignore */
    }
  }
  activeNodes.clear();
}

function destroyAudioContext() {
  stopAllActiveNodes();
  bgmNoteIdx = 0;
  if (masterGain) {
    try {
      masterGain.gain.cancelScheduledValues(0);
      masterGain.gain.setValueAtTime(0, 0);
      masterGain.disconnect();
    } catch {
      /* ignore */
    }
    masterGain = null;
  }
  if (audioCtx) {
    const ctx = audioCtx;
    audioCtx = null;
    try {
      void ctx.close();
    } catch {
      /* ignore */
    }
  }
}

function ensureMasterGain(ctx: AudioContext): GainNode {
  if (!masterGain) {
    masterGain = ctx.createGain();
    masterGain.gain.value = globalSoundOn ? 1 : 0;
    masterGain.connect(ctx.destination);
  }
  return masterGain;
}

function canPlay(epoch: number): boolean {
  return globalSoundOn && epoch === playEpoch;
}

function getCtx(epoch: number): AudioContext | null {
  if (!canPlay(epoch)) return null;
  try {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      ensureMasterGain(audioCtx);
      if (!globalSoundOn) {
        masterGain!.gain.setValueAtTime(0, audioCtx.currentTime);
        return null;
      }
      masterGain!.gain.setValueAtTime(1, audioCtx.currentTime);
    }
    if (!canPlay(epoch)) return null;
    if (audioCtx.state === "suspended") {
      void audioCtx.resume();
    }
    return audioCtx;
  } catch {
    return null;
  }
}

function startNode(node: AudioScheduledSourceNode, epoch: number, when = 0) {
  if (!canPlay(epoch)) {
    try {
      node.stop(0);
    } catch {
      /* ignore */
    }
    return false;
  }
  trackNode(node);
  try {
    node.start(when);
  } catch {
    activeNodes.delete(node);
    return false;
  }
  return true;
}

/** サイト全体の Sound ON/OFF（ミニゲーム・環境音すべて） */
export function setGlobalSoundEnabled(on: boolean) {
  if (on === globalSoundOn) return;
  if (!on) {
    globalSoundOn = false;
    playEpoch++;
    destroyAudioContext();
    return;
  }
  globalSoundOn = true;
  playEpoch++;
}

/** @deprecated use setGlobalSoundEnabled */
export function setInvaderSoundEnabled(on: boolean) {
  setGlobalSoundEnabled(on);
}

export function setInvaderGameSoundEnabled(on: boolean) {
  invaderGameSoundOn = on;
}

export function setArkanoidGameSoundEnabled(on: boolean) {
  arkanoidGameSoundOn = on;
}

export function isGlobalSoundEnabled() {
  return globalSoundOn;
}

export function isInvaderSoundEnabled() {
  return globalSoundOn && invaderGameSoundOn;
}

function tone(
  freq: number,
  duration: number,
  type: OscillatorType,
  volume: number,
  freqEnd?: number,
  when?: number
) {
  const epoch = playEpoch;
  if (!canPlay(epoch)) return;
  const ctx = getCtx(epoch);
  if (!ctx) return;

  const t0 = when ?? ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  if (freqEnd) {
    osc.frequency.exponentialRampToValueAtTime(Math.max(freqEnd, 1), t0 + duration);
  }
  gain.gain.setValueAtTime(volume, t0);
  gain.gain.exponentialRampToValueAtTime(0.001, t0 + duration);
  osc.connect(gain);
  gain.connect(ensureMasterGain(ctx));
  if (!startNode(osc, epoch, t0)) return;
  osc.stop(t0 + duration);
}

function noiseBurst(duration: number, volume: number) {
  const epoch = playEpoch;
  if (!canPlay(epoch)) return;
  const ctx = getCtx(epoch);
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
  gain.connect(ensureMasterGain(ctx));
  startNode(source, epoch);
}

export type InvaderSfx =
  | "shoot"
  | "explosion"
  | "enemyShoot"
  | "march"
  | "playerExplosion"
  | "stageClear"
  | "ufoAppear";

export function playInvaderSfx(type: InvaderSfx) {
  if (!globalSoundOn || !invaderGameSoundOn) return;

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

export type ArkanoidSfx = "launch" | "brick" | "paddle" | "loseLife" | "clear" | "gameOver";

export function playArkanoidSfx(type: ArkanoidSfx) {
  if (!globalSoundOn || !arkanoidGameSoundOn) return;

  switch (type) {
    case "launch":
      tone(440, 0.06, "square", 0.04, 660);
      break;
    case "brick":
      tone(320 + Math.random() * 80, 0.05, "square", 0.035, 180);
      break;
    case "paddle":
      tone(220, 0.05, "triangle", 0.04, 160);
      break;
    case "loseLife":
      tone(140, 0.12, "sawtooth", 0.05, 70);
      break;
    case "clear":
      tone(392, 0.08, "square", 0.04);
      tone(523.25, 0.1, "square", 0.04);
      tone(659.25, 0.12, "square", 0.045);
      break;
    case "gameOver":
      noiseBurst(0.2, 0.06);
      tone(110, 0.2, "sawtooth", 0.05, 55);
      break;
  }
}

export function setInvaderBgmTempo(_aliveRatio: number) {
  /* march interval controlled in HeaderInvaders */
}

export function resumeAudioContext() {
  if (!globalSoundOn) return;
  const epoch = playEpoch;
  void getCtx(epoch)?.resume();
}

/** ハンマー打撃 — 低い「ドシン」 */
export function playHammerThud() {
  if (!globalSoundOn) return;
  const epoch = playEpoch;
  if (!canPlay(epoch)) return;
  const ctx = getCtx(epoch);
  if (!ctx) return;

  const bufferSize = Math.floor(ctx.sampleRate * 0.16);
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize) ** 1.4;
  }
  const source = ctx.createBufferSource();
  const gain = ctx.createGain();
  const filter = ctx.createBiquadFilter();
  source.buffer = buffer;
  filter.type = "lowpass";
  filter.frequency.value = 140;
  gain.gain.setValueAtTime(0.13, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.16);
  source.connect(filter);
  filter.connect(gain);
  gain.connect(ensureMasterGain(ctx));
  startNode(source, epoch);

  tone(62, 0.24, "sine", 0.12, 30);
  tone(38, 0.34, "triangle", 0.08, 22);
}

/** ?ブロック頭上ジャンプの「コイン」風ヒット */
export function playMarioBlockHit() {
  if (!globalSoundOn) return;
  tone(988, 0.045, "square", 0.05, 1318.5);
  tone(1318.5, 0.07, "square", 0.042, 1568);
}

/** スーパーキノコ取得のパワーアップ音 */
export function playMarioPowerUp() {
  if (!globalSoundOn) return;
  const epoch = playEpoch;
  const ctx = getCtx(epoch);
  if (!ctx) return;
  const t0 = ctx.currentTime;
  [523.25, 659.25, 783.99, 1046.5, 1318.5].forEach((freq, i) => {
    tone(freq, 0.09, "square", 0.042, undefined, t0 + i * 0.055);
  });
}

/** ガンダム・ビームサーベル「ブォン」 */
export function playBeamSaberBuon() {
  if (!globalSoundOn) return;
  tone(90, 0.28, "sawtooth", 0.065, 2200);
  tone(1800, 0.12, "sawtooth", 0.028, 400);
  noiseBurst(0.14, 0.035);
}

/** リンクの剣攻撃 */
export function playSwordSlash() {
  if (!globalSoundOn) return;
  noiseBurst(0.07, 0.048);
  tone(520, 0.05, "sawtooth", 0.038, 140);
  tone(280, 0.04, "square", 0.028, 90);
}

/** DQ勇者の剣攻撃 */
export function playHeroSwordSlash() {
  if (!globalSoundOn) return;
  tone(740, 0.055, "square", 0.04, 220);
  noiseBurst(0.06, 0.032);
}

/** 魔王の攻撃 */
export function playMaouAttack() {
  if (!globalSoundOn) return;
  tone(95, 0.14, "sawtooth", 0.052, 48);
  noiseBurst(0.11, 0.04);
  tone(180, 0.1, "square", 0.03, 70);
}

setGlobalSoundEnabled(false);
