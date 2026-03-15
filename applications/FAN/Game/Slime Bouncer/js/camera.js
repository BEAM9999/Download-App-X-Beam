/* ══════════════════════════════════════════════
   Slime Bouncer — Camera System
   ═════════════════════════════════════════════ */
'use strict';
(function() {
const SB = window.SB || (window.SB = {});

SB.Camera = {
  x: 0, y: 0,
  shakeX: 0, shakeY: 0,
  shakeDur: 0, shakeIntensity: 0,
  targetX: 0,
  levelWidth: 800,
  locked: false,

  reset(levelWidth) {
    this.x = 0; this.y = 0;
    this.shakeX = 0; this.shakeY = 0;
    this.shakeDur = 0;
    this.levelWidth = levelWidth || 800;
    this.locked = false;
  },

  follow(player, dt) {
    if (this.locked) return;
    // Smooth camera follow without dead zone jitter
    const cx = player.x + player.w / 2;
    const targetX = cx - SB.W / 2;
    // Exponential smoothing (frame-rate independent)
    const smoothing = 1 - Math.pow(0.001, dt);
    this.x += (targetX - this.x) * smoothing;
    // Clamp to level bounds
    this.x = SB.Utils.clamp(this.x, 0, Math.max(0, this.levelWidth - SB.W));
    this.y = 0; // horizontal scroll only
  },

  lock(x) {
    this.locked = true;
    this.x = x;
  },

  shake(intensity, duration) {
    this.shakeIntensity = intensity;
    this.shakeDur = duration;
  },

  update(dt) {
    if (this.shakeDur > 0) {
      this.shakeDur -= dt;
      this.shakeX = (Math.random() - 0.5) * this.shakeIntensity * 2;
      this.shakeY = (Math.random() - 0.5) * this.shakeIntensity * 2;
    } else {
      this.shakeX = 0; this.shakeY = 0;
    }
  },

  // Screen coords for rendering (respects screenShake setting)
  get sx() {
    if (SB.Save.data.settings.screenShake === false) return Math.round(this.x);
    return Math.round(this.x + this.shakeX);
  },
  get sy() {
    if (SB.Save.data.settings.screenShake === false) return Math.round(this.y);
    return Math.round(this.y + this.shakeY);
  }
};
})();
