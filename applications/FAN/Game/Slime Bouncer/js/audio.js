/* ══════════════════════════════════════════════
   Slime Bouncer — Audio System
   Web Audio API: synthesized SFX + chiptune BGM
   ═════════════════════════════════════════════ */
'use strict';
(function() {
const SB = window.SB || (window.SB = {});

let ctx = null;
let bgmGain = null, sfxGain = null;
let currentBGM = null;

function ensureCtx() {
  if (!ctx) {
    ctx = new (window.AudioContext || window.webkitAudioContext)();
    bgmGain = ctx.createGain(); bgmGain.gain.value = 0.3; bgmGain.connect(ctx.destination);
    sfxGain = ctx.createGain(); sfxGain.gain.value = 0.5; sfxGain.connect(ctx.destination);
  }
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

// ── SFX helpers ──
function playTone(freq, dur, type, vol, dest) {
  const c = ensureCtx();
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = type || 'square';
  o.frequency.setValueAtTime(freq, c.currentTime);
  g.gain.setValueAtTime((vol || 0.3), c.currentTime);
  g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + dur);
  o.connect(g); g.connect(dest || sfxGain);
  o.start(c.currentTime);
  o.stop(c.currentTime + dur);
}

function sweep(f1, f2, dur, type, vol) {
  const c = ensureCtx();
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = type || 'square';
  o.frequency.setValueAtTime(f1, c.currentTime);
  o.frequency.linearRampToValueAtTime(f2, c.currentTime + dur);
  g.gain.setValueAtTime(vol || 0.25, c.currentTime);
  g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + dur);
  o.connect(g); g.connect(sfxGain);
  o.start(); o.stop(c.currentTime + dur);
}

function noise(dur, vol) {
  const c = ensureCtx();
  const buf = c.createBuffer(1, c.sampleRate * dur, c.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  const src = c.createBufferSource();
  src.buffer = buf;
  const g = c.createGain();
  g.gain.setValueAtTime(vol || 0.15, c.currentTime);
  g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + dur);
  src.connect(g); g.connect(sfxGain);
  src.start(); src.stop(c.currentTime + dur);
}

SB.Audio = {
  init() { /* lazy init on first interaction */ },
  resume() { ensureCtx(); },

  setBGMVolume(v) { ensureCtx(); bgmGain.gain.value = SB.Utils.clamp(v, 0, 1); },
  setSFXVolume(v) { ensureCtx(); sfxGain.gain.value = SB.Utils.clamp(v, 0, 1); },

  // ── Sound Effects ──
  jump()      { sweep(200, 800, 0.1, 'square', 0.2); },
  land()      { noise(0.05, 0.1); playTone(80, 0.05, 'sine', 0.15); },
  stomp()     { sweep(300, 600, 0.08, 'square', 0.2); playTone(500, 0.1, 'sine', 0.15); },
  coin()      { playTone(988, 0.04, 'square', 0.15); setTimeout(() => playTone(1319, 0.08, 'square', 0.15), 40); },
  redCoin()   { playTone(523, 0.06, 'square', 0.2); setTimeout(() => playTone(659, 0.06, 'square', 0.2), 60); setTimeout(() => playTone(784, 0.12, 'square', 0.2), 120); },
  ancientCoin(){ playTone(523, 0.1, 'triangle', 0.3); setTimeout(() => playTone(659, 0.1, 'triangle', 0.3), 100); setTimeout(() => playTone(784, 0.1, 'triangle', 0.3), 200); setTimeout(() => playTone(1047, 0.3, 'triangle', 0.3), 300); },
  hurt()      { sweep(600, 200, 0.2, 'sawtooth', 0.2); },
  die()       { sweep(500, 100, 0.5, 'sawtooth', 0.25); },
  powerup()   { const n=[523,659,784,1047]; n.forEach((f,i)=>setTimeout(()=>playTone(f,0.1,'square',0.2),i*70)); },
  oneUp()     { const n=[523,659,784,1047,1319]; n.forEach((f,i)=>setTimeout(()=>playTone(f,0.08,'square',0.2),i*60)); },
  checkpoint(){ playTone(784, 0.1, 'square', 0.2); setTimeout(() => playTone(1047, 0.15, 'square', 0.2), 100); },
  spring()    { sweep(200, 1200, 0.15, 'sine', 0.2); },
  qblock()    { playTone(600, 0.05, 'square', 0.15); noise(0.03, 0.1); },
  menuSelect(){ playTone(700, 0.03, 'square', 0.1); },
  menuConfirm(){ playTone(800, 0.05, 'square', 0.15); playTone(1200, 0.08, 'square', 0.15); },
  enemyDie()  { sweep(400, 800, 0.12, 'square', 0.15); noise(0.08, 0.1); },
  bossHit()   { noise(0.1, 0.25); playTone(200, 0.15, 'sawtooth', 0.2); },
  bossPhase() { sweep(100, 400, 0.5, 'sawtooth', 0.3); noise(0.5, 0.2); },
  bossDie()   { for(let i=0;i<6;i++) setTimeout(()=>{noise(0.15,0.2);playTone(200+i*50,0.15,'sawtooth',0.15);},i*200); },
  shoot()     { sweep(1200, 600, 0.08, 'square', 0.12); noise(0.03, 0.08); },
  swordSwing(){ sweep(400, 800, 0.06, 'sawtooth', 0.12); },
  levelComplete() {
    const notes = [523, 659, 784, 1047, 784, 1047, 1319];
    notes.forEach((f, i) => setTimeout(() => playTone(f, 0.15, 'square', 0.2), i * 100));
  },
  gameOver() {
    const notes = [392, 349, 330, 262];
    notes.forEach((f, i) => setTimeout(() => playTone(f, 0.25, 'triangle', 0.2), i * 200));
  },
  pause() { playTone(400, 0.05, 'square', 0.1); playTone(300, 0.08, 'square', 0.1); },

  // ── SFX Dispatcher ──
  sfx(name) {
    if (typeof this[name] === 'function') this[name]();
  },

  // ── BGM ──
  stopBGM() {
    if (currentBGM) { currentBGM.stop = true; currentBGM = null; }
  },

  playBGM(name) {
    this.stopBGM();
    ensureCtx();
    const bgm = { stop: false, timers: [] };
    currentBGM = bgm;

    const bpm = { title: 120, forest: 110, desert: 100, ice: 90, castle: 130, boss: 150 }[name] || 120;
    const beatLen = 60 / bpm;

    // Simple chiptune patterns
    const patterns = {
      title:  [[523,659,784,659],[523,659,784,1047],[440,523,659,523],[440,523,659,784]],
      forest: [[330,392,440,494],[523,494,440,392],[330,392,523,440],[392,440,494,523]],
      desert: [[294,349,440,349],[294,330,392,330],[262,294,349,294],[262,330,392,440]],
      ice:    [[440,523,659,523],[392,440,523,440],[349,392,440,392],[330,349,392,440]],
      castle: [[220,262,294,262],[247,294,330,294],[262,330,392,330],[220,247,262,294]],
      boss:   [[330,392,440,523],[494,440,392,330],[349,440,523,440],[392,494,523,659]]
    };

    const pat = patterns[name] || patterns.title;
    let barIdx = 0;

    function playBar() {
      if (bgm.stop || !ctx) return;
      const bar = pat[barIdx % pat.length];
      bar.forEach((freq, i) => {
        const t = bgm.timers.push(setTimeout(() => {
          if (bgm.stop) return;
          playTone(freq, beatLen * 0.7, 'square', 0.08, bgmGain);
          // Bass note
          playTone(freq / 2, beatLen * 0.5, 'triangle', 0.06, bgmGain);
        }, i * beatLen * 1000)) - 1;
      });
      barIdx++;
      bgm.timers.push(setTimeout(playBar, bar.length * beatLen * 1000));
    }
    playBar();
  }
};
})();
