/* ══════════════════════════════════════════════
   Slime Bouncer — Particle System
   ═════════════════════════════════════════════ */
'use strict';
(function() {
const SB = window.SB || (window.SB = {});

class Particle {
  constructor(x, y, vx, vy, life, color, size, shape) {
    this.x = x; this.y = y;
    this.vx = vx; this.vy = vy;
    this.life = life; this.maxLife = life;
    this.color = color;
    this.size = size || 2;
    this.gravity = 200;
    this.shape = shape || 'circle'; // 'circle', 'square', 'star', 'glow'
    this.rot = Math.random() * Math.PI * 2;
    this.rotSpeed = (Math.random() - 0.5) * 8;
  }
  update(dt) {
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.vy += this.gravity * dt;
    this.life -= dt;
    this.rot += this.rotSpeed * dt;
  }
  get alpha() { return Math.max(0, this.life / this.maxLife); }
  get alive() { return this.life > 0; }
}

SB.Particles = {
  pool: [],

  clear() { this.pool.length = 0; },

  update(dt) {
    for (let i = this.pool.length - 1; i >= 0; i--) {
      this.pool[i].update(dt);
      if (!this.pool[i].alive) this.pool.splice(i, 1);
    }
  },

  draw(ctx, cam) {
    for (const p of this.pool) {
      const px = Math.round(p.x - cam.x);
      const py = Math.round(p.y - cam.y);
      ctx.globalAlpha = p.alpha;
      ctx.fillStyle = p.color;
      if (p.shape === 'glow') {
        // Soft glow circle with outer halo
        ctx.globalAlpha = p.alpha * 0.25;
        ctx.beginPath(); ctx.arc(px, py, p.size * 2, 0, Math.PI * 2); ctx.fill();
        ctx.globalAlpha = p.alpha;
        ctx.beginPath(); ctx.arc(px, py, p.size, 0, Math.PI * 2); ctx.fill();
      } else if (p.shape === 'star') {
        ctx.save();
        ctx.translate(px, py);
        ctx.rotate(p.rot);
        const s = p.size * 0.6;
        ctx.beginPath();
        for (let i = 0; i < 5; i++) {
          const a = (i * 2 * Math.PI / 5) - Math.PI / 2;
          const r = i % 2 === 0 ? s : s * 0.4;
          if (i === 0) ctx.moveTo(Math.cos(a) * r, Math.sin(a) * r);
          else ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
        }
        ctx.closePath(); ctx.fill();
        ctx.restore();
      } else if (p.shape === 'square') {
        ctx.fillRect(px, py, p.size, p.size);
      } else {
        // Default: smooth circle
        ctx.beginPath(); ctx.arc(px, py, p.size * 0.6, 0, Math.PI * 2); ctx.fill();
      }
    }
    ctx.globalAlpha = 1;
  },

  // ── Emit dispatcher (respects particles setting) ──
  emit(name, x, y, extra) {
    if (SB.Save && SB.Save.data && !SB.Save.data.settings.particles) return;
    if (typeof this[name] === 'function') this[name](x, y, extra);
  },

  // ── Preset Effects ──

  dust(x, y) {
    for (let i = 0; i < 6; i++) {
      const p = new Particle(
        x + SB.Utils.randFloat(-6, 6), y,
        SB.Utils.randFloat(-50, 50), SB.Utils.randFloat(-70, -20),
        SB.Utils.randFloat(0.25, 0.5),
        '#cdb891', SB.Utils.randFloat(1.5, 3), 'circle'
      );
      p.gravity = 80;
      this.pool.push(p);
    }
  },

  stomp(x, y) {
    const colors = ['#FFD700', '#FF6B6B', '#7BF', '#FFF', '#AE6', '#F9A'];
    for (let i = 0; i < 14; i++) {
      const a = Math.random() * Math.PI * 2;
      const spd = SB.Utils.randFloat(80, 220);
      const shape = i < 4 ? 'star' : 'glow';
      this.pool.push(new Particle(
        x, y, Math.cos(a) * spd, Math.sin(a) * spd,
        SB.Utils.randFloat(0.3, 0.7),
        colors[i % colors.length], SB.Utils.randInt(2, 5), shape
      ));
    }
  },

  coinCollect(x, y) {
    for (let i = 0; i < 6; i++) {
      const shape = i < 2 ? 'star' : 'glow';
      this.pool.push(new Particle(
        x, y,
        SB.Utils.randFloat(-40, 40), SB.Utils.randFloat(-110, -40),
        0.4, '#FFD700', SB.Utils.randFloat(2, 3.5), shape
      ));
    }
  },

  death(x, y) {
    for (let i = 0; i < 14; i++) {
      const a = Math.random() * Math.PI * 2;
      const spd = SB.Utils.randFloat(60, 180);
      const p = new Particle(
        x, y, Math.cos(a) * spd, Math.sin(a) * spd,
        SB.Utils.randFloat(0.4, 0.9),
        i % 3 === 0 ? '#fff' : '#2ecc71', SB.Utils.randInt(3, 5), 'glow'
      );
      p.gravity = 40;
      this.pool.push(p);
    }
  },

  powerup(x, y) {
    for (let i = 0; i < 16; i++) {
      const a = (i / 16) * Math.PI * 2;
      const shape = i % 3 === 0 ? 'star' : 'glow';
      const p = new Particle(
        x, y, Math.cos(a) * 130, Math.sin(a) * 130,
        0.6, i % 2 === 0 ? '#FFF' : '#f1c40f', SB.Utils.randFloat(2, 4), shape
      );
      p.gravity = 50;
      this.pool.push(p);
    }
  },

  fire(x, y) {
    const p = new Particle(
      x + SB.Utils.randFloat(-3, 3), y + SB.Utils.randFloat(-3, 3),
      SB.Utils.randFloat(-10, 10), SB.Utils.randFloat(-60, -25),
      SB.Utils.randFloat(0.15, 0.35),
      Math.random() > 0.5 ? '#f39c12' : '#e74c3c', SB.Utils.randFloat(2, 3.5), 'glow'
    );
    p.gravity = -30;
    this.pool.push(p);
  },

  ice(x, y) {
    const p = new Particle(
      x + SB.Utils.randFloat(-3, 3), y + SB.Utils.randFloat(-3, 3),
      SB.Utils.randFloat(-15, 15), SB.Utils.randFloat(-35, -10),
      0.35, Math.random() > 0.5 ? '#a8e6ff' : '#e0f7ff', SB.Utils.randFloat(1.5, 3), 'star'
    );
    p.gravity = -20;
    this.pool.push(p);
  },

  combo(x, y, count) {
    const colors = ['#FFD700', '#FF6B6B', '#00E5FF', '#FF4081', '#76FF03'];
    for (let i = 0; i < Math.min(count * 4, 24); i++) {
      const a = Math.random() * Math.PI * 2;
      const spd = SB.Utils.randFloat(100, 280);
      const shape = i % 3 === 0 ? 'star' : 'glow';
      this.pool.push(new Particle(
        x, y, Math.cos(a) * spd, Math.sin(a) * spd,
        SB.Utils.randFloat(0.4, 0.9),
        colors[i % colors.length], SB.Utils.randInt(2, 5), shape
      ));
    }
  },

  bossExplosion(x, y) {
    for (let i = 0; i < 40; i++) {
      const a = Math.random() * Math.PI * 2;
      const spd = SB.Utils.randFloat(50, 350);
      const shape = i < 10 ? 'star' : 'glow';
      const p = new Particle(
        x + SB.Utils.randFloat(-25, 25),
        y + SB.Utils.randFloat(-25, 25),
        Math.cos(a) * spd, Math.sin(a) * spd,
        SB.Utils.randFloat(0.5, 1.5),
        ['#FF6B6B','#FFD700','#FFF','#f39c12','#e74c3c','#ff4081'][SB.Utils.randInt(0,5)],
        SB.Utils.randInt(3, 7), shape
      );
      p.gravity = 30;
      this.pool.push(p);
    }
  },

  speedTrail(x, y, extra) {
    const dir = extra && extra.dir || -1;
    const vxBase = extra && extra.vx || 0;
    // Main afterimage streaks (horizontal motion blur)
    for (let i = 0; i < 3; i++) {
      const p = new Particle(
        x + SB.Utils.randFloat(-4, 4),
        y + SB.Utils.randFloat(-6, 6),
        -dir * SB.Utils.randFloat(60, 160) - vxBase * 0.3,
        SB.Utils.randFloat(-15, 15),
        SB.Utils.randFloat(0.15, 0.35),
        i === 0 ? '#ffe066' : (i === 1 ? '#f1c40f' : '#fff'),
        SB.Utils.randFloat(1.5, 3.5), 'glow'
      );
      p.gravity = -10;
      this.pool.push(p);
    }
    // Sparkle stars trailing behind
    if (Math.random() < 0.5) {
      const p = new Particle(
        x + SB.Utils.randFloat(-3, 3),
        y + SB.Utils.randFloat(-8, 4),
        -dir * SB.Utils.randFloat(40, 120),
        SB.Utils.randFloat(-40, -10),
        SB.Utils.randFloat(0.2, 0.5),
        '#fff', SB.Utils.randFloat(2, 4), 'star'
      );
      p.gravity = 20;
      this.pool.push(p);
    }
    // Wind line (long thin streak)
    if (Math.random() < 0.3) {
      const p = new Particle(
        x + dir * SB.Utils.randFloat(-15, 5),
        y + SB.Utils.randFloat(-10, 8),
        -dir * SB.Utils.randFloat(200, 350),
        SB.Utils.randFloat(-5, 5),
        SB.Utils.randFloat(0.08, 0.18),
        'rgba(255,230,120,0.6)', SB.Utils.randFloat(1, 2), 'circle'
      );
      p.gravity = 0;
      this.pool.push(p);
    }
  },

  checkpoint(x, y) {
    // Rising sparkles on player
    const colors = ['#f1c40f', '#e67e22', '#fff', '#2ecc71', '#3498db'];
    for (let i = 0; i < 24; i++) {
      const a = (i / 24) * Math.PI * 2;
      const spd = SB.Utils.randFloat(60, 160);
      const shape = i % 4 === 0 ? 'star' : 'glow';
      const p = new Particle(
        x + SB.Utils.randFloat(-8, 8), y + SB.Utils.randFloat(-8, 8),
        Math.cos(a) * spd * 0.3, -SB.Utils.randFloat(80, 220),
        SB.Utils.randFloat(0.5, 1.2),
        colors[i % colors.length], SB.Utils.randInt(2, 4), shape
      );
      p.gravity = -60;
      this.pool.push(p);
    }
  }
};
})();
