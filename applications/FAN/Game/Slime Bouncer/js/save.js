/* ══════════════════════════════════════════════
   Slime Bouncer — Save System (localStorage)
   ═════════════════════════════════════════════ */
'use strict';
(function() {
const SB = window.SB || (window.SB = {});
const SAVE_KEY = 'slimeBouncer_save_v1';

SB.Save = {
  data: null,

  defaultData() {
    return {
      version: 2,
      unlockedLevel: 1,     // legacy (world 1 unlocked level)
      unlockedLevels: { 1: 1, 2: 0, 3: 0, 4: 0 }, // per-world unlock count
      unlockedWorld: 1,     // highest unlocked world
      currentWorld: 1,
      lives: 3,
      coins: 0,
      ancientCoins: [],
      secretGems: [],
      stars: {},
      bestTimes: {},
      highScores: {},
      totalPlayTime: 0,
      lastScreen: 'TITLE',
      shopInventory: {},
      settings: {
        bgmVol: 0.3,
        sfxVol: 0.5,
        particles: true,
        screenShake: true,
        resolution: 1,
        fpsCap: 60,
        shadows: false
      }
    };
  },

  load() {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (raw) {
        this.data = JSON.parse(raw);
        // Migration: add missing fields
        const def = this.defaultData();
        for (const k in def) {
          if (!(k in this.data)) this.data[k] = def[k];
        }
        // Migrate from old single unlockedLevel to per-world
        if (!this.data.unlockedLevels || typeof this.data.unlockedLevels !== 'object') {
          this.data.unlockedLevels = { 1: this.data.unlockedLevel || 1, 2: 0, 3: 0, 4: 0 };
        }
        if (!this.data.unlockedWorld) this.data.unlockedWorld = 1;
        // Ensure all worlds exist
        for (let w = 1; w <= 4; w++) {
          if (this.data.unlockedLevels[w] === undefined) this.data.unlockedLevels[w] = 0;
        }
      } else {
        this.data = this.defaultData();
      }
    } catch {
      this.data = this.defaultData();
    }
    return this.data;
  },

  save() {
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify(this.data));
    } catch (e) { console.warn('Save failed:', e); }
  },

  reset() {
    this.data = this.defaultData();
    this.save();
  },

  unlockLevel(n) {
    if (n > this.data.unlockedLevel) {
      this.data.unlockedLevel = n;
      this.save();
    }
  },

  setStars(levelId, stars) {
    const prev = this.data.stars[levelId] || 0;
    if (stars > prev) { this.data.stars[levelId] = stars; this.save(); }
  },

  setBestTime(levelId, time) {
    const prev = this.data.bestTimes[levelId];
    if (!prev || time < prev) { this.data.bestTimes[levelId] = time; this.save(); }
  },

  setHighScore(levelId, score) {
    const prev = this.data.highScores[levelId] || 0;
    if (score > prev) { this.data.highScores[levelId] = score; this.save(); }
  },

  collectAncientCoin(levelNum) {
    if (!this.data.ancientCoins.includes(levelNum)) {
      this.data.ancientCoins.push(levelNum);
      this.save();
    }
  },

  collectSecretGem(levelNum) {
    if (!this.data.secretGems.includes(levelNum)) {
      this.data.secretGems.push(levelNum);
      this.save();
    }
  }
};
})();
