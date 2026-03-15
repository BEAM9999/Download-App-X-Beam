/* ══════════════════════════════════════════════
   Slime Bouncer — Items & Collectibles
   Coins, Power-ups, Blocks, Springs
   ═════════════════════════════════════════════ */
'use strict';
(function() {
const SB = window.SB || (window.SB = {});

// ── Coin ──
class Coin {
  constructor(x, y, type) {
    this.x = x; this.y = y;
    this.w = 12; this.h = 12;
    this.type = type || 'gold'; // gold, silver, red, ancient
    this.collected = false;
    this.bobPhase = Math.random() * Math.PI * 2;
    this.frame = 0; this.frameTimer = 0;
  }

  get value() {
    return { gold: 10, silver: 5, red: 50, ancient: 100 }[this.type] || 10;
  }

  get color() {
    return { gold: '#FFD700', silver: '#C0C0C0', red: '#FF4444', ancient: '#9B59B6' }[this.type];
  }

  update(dt) {
    this.bobPhase += dt * 3;
    this.frameTimer += dt;
    if (this.frameTimer > 0.1) { this.frameTimer = 0; this.frame = (this.frame + 1) % 4; }
    // Falling coin physics (boss defeat waterfall)
    if (this._falling) {
      this._vy = (this._vy || 0) + 400 * dt;
      this.x += (this._vx || 0) * dt;
      this.y += this._vy * dt;
      // Stop at ground
      const groundY = (SB.Level && SB.Level.tilemap) ? (SB.Level.tilemap.h - 3) * SB.TILE : 400;
      if (this.y > groundY) { this.y = groundY; this._vy = 0; this._vx = 0; this._falling = false; }
    }
  }

  draw(ctx, cam) {
    if (this.collected) return;
    const sx = Math.round(this.x - cam.x);
    const sy = Math.round(this.y - cam.y + Math.sin(this.bobPhase) * 3);
    const size = this.type === 'ancient' ? 14 : 12;
    const half = size / 2;
    const cx = sx + half;
    const cy = sy + half;

    // Spinning coin: scale X for rotation illusion
    const scaleX = [1, 0.6, 0.15, 0.6][this.frame];
    ctx.save();
    ctx.translate(cx, cy);
    ctx.scale(scaleX, 1);

    // Coin glow
    ctx.fillStyle = this.color + '44';
    ctx.beginPath();
    ctx.arc(0, 0, half + 2, 0, Math.PI * 2);
    ctx.fill();

    // Coin body (circle)
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(0, 0, half, 0, Math.PI * 2);
    ctx.fill();

    // Darker rim
    ctx.strokeStyle = this.type === 'gold' ? '#b8860b' : this.type === 'silver' ? '#808080' : this.type === 'red' ? '#cc0000' : '#7d3c98';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Highlight crescent
    ctx.fillStyle = 'rgba(255,255,255,0.45)';
    ctx.beginPath();
    ctx.arc(-1, -1, half - 2, -Math.PI * 0.7, Math.PI * 0.3);
    ctx.fill();

    // Center symbol
    if (this.type === 'ancient') {
      ctx.fillStyle = '#FFD700';
      ctx.font = 'bold 8px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('★', 0, 3);
      ctx.textAlign = 'left';
    }

    ctx.restore();
  }
}

// ── PowerUp ──
class PowerUp {
  constructor(x, y, type) {
    this.x = x; this.y = y;
    this.w = 16; this.h = 16;
    this.type = type; // heart, speed, shield, magnet, oneup, fire, ice, wind
    this.collected = false;
    this.vy = 0;
    this.bobPhase = Math.random() * Math.PI * 2;
    this.spawning = false; // true when popping out of ? block
    this.spawnVy = 0;
  }

  get color() {
    return {
      heart: '#e74c3c', speed: '#f1c40f', shield: '#3498db',
      magnet: '#95a5a6', oneup: '#2ecc71',
      fire: '#e67e22', ice: '#00bcd4', wind: '#8bc34a',
      triple_shot: '#00e5ff'
    }[this.type] || '#fff';
  }

  update(dt) {
    if (this.spawning) {
      this.y += this.spawnVy * dt;
      this.spawnVy += 400 * dt;
      if (this.spawnVy > 0) { this.spawning = false; this.spawnVy = 0; this.falling = true; this.vy = 0; }
    } else if (this.falling) {
      // Fall with gravity until landing on solid tile
      this.vy += 600 * dt;
      if (this.vy > 400) this.vy = 400;
      this.y += this.vy * dt;
      const tm = SB.Level.tilemap;
      if (tm) {
        const col = Math.floor((this.x + this.w / 2) / SB.TILE);
        const row = Math.floor((this.y + this.h) / SB.TILE);
        if (SB.SOLID_TILES.has(tm.get(col, row))) {
          this.y = row * SB.TILE - this.h;
          this.vy = 0;
          this.falling = false;
        }
      }
      if (this.y > 600) this.collected = true; // fell off world
    }
    this.bobPhase += dt * 2.5;
  }

  draw(ctx, cam) {
    if (this.collected) return;
    const sx = Math.round(this.x - cam.x);
    const sy = Math.round(this.y - cam.y + (this.spawning ? 0 : Math.sin(this.bobPhase) * 2));
    const cx = sx + 8;
    const cy = sy + 8;

    // Glow
    ctx.fillStyle = this.color + '33';
    ctx.beginPath();
    ctx.arc(cx, cy, 10, 0, Math.PI * 2);
    ctx.fill();

    // Body (rounded square via arc)
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(cx, cy, 7, 0, Math.PI * 2);
    ctx.fill();

    // Border
    ctx.strokeStyle = 'rgba(0,0,0,0.25)';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Highlight
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    ctx.beginPath();
    ctx.arc(cx - 1, cy - 2, 4, -Math.PI * 0.8, Math.PI * 0.2);
    ctx.fill();

    // Type icon (white)
    ctx.fillStyle = '#fff';
    if (this.type === 'heart') {
      ctx.beginPath();
      ctx.moveTo(cx, cy + 3);
      ctx.quadraticCurveTo(cx - 5, cy - 1, cx - 3, cy - 3);
      ctx.quadraticCurveTo(cx, cy - 5, cx, cy - 1);
      ctx.quadraticCurveTo(cx, cy - 5, cx + 3, cy - 3);
      ctx.quadraticCurveTo(cx + 5, cy - 1, cx, cy + 3);
      ctx.fill();
    } else if (this.type === 'speed') {
      // Lightning bolt
      ctx.beginPath();
      ctx.moveTo(cx + 1, cy - 4);
      ctx.lineTo(cx - 2, cy);
      ctx.lineTo(cx + 1, cy);
      ctx.lineTo(cx - 1, cy + 4);
      ctx.lineTo(cx + 2, cy);
      ctx.lineTo(cx - 1, cy);
      ctx.fill();
    } else if (this.type === 'shield') {
      // Shield shape
      ctx.beginPath();
      ctx.moveTo(cx, cy + 4);
      ctx.lineTo(cx - 4, cy);
      ctx.lineTo(cx - 4, cy - 3);
      ctx.lineTo(cx, cy - 4);
      ctx.lineTo(cx + 4, cy - 3);
      ctx.lineTo(cx + 4, cy);
      ctx.fill();
    } else if (this.type === 'oneup') {
      ctx.font = 'bold 9px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('1UP', cx, cy + 3);
      ctx.textAlign = 'left';
    } else if (this.type === 'magnet') {
      ctx.font = 'bold 9px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('M', cx, cy + 3);
      ctx.textAlign = 'left';
    } else if (this.type === 'fire') {
      ctx.beginPath();
      ctx.moveTo(cx, cy - 4);
      ctx.quadraticCurveTo(cx + 4, cy - 1, cx, cy + 4);
      ctx.quadraticCurveTo(cx - 4, cy - 1, cx, cy - 4);
      ctx.fill();
    } else if (this.type === 'ice') {
      ctx.font = 'bold 9px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('❄', cx, cy + 3);
      ctx.textAlign = 'left';
    } else if (this.type === 'wind') {
      ctx.font = 'bold 9px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('≋', cx, cy + 3);
      ctx.textAlign = 'left';
    } else if (this.type === 'triple_shot') {
      // Three upward arrows
      ctx.beginPath();
      ctx.moveTo(cx - 3, cy + 2); ctx.lineTo(cx - 3, cy - 2); ctx.lineTo(cx - 5, cy); ctx.moveTo(cx - 3, cy - 2); ctx.lineTo(cx - 1, cy);
      ctx.moveTo(cx, cy + 2); ctx.lineTo(cx, cy - 3); ctx.lineTo(cx - 2, cy - 1); ctx.moveTo(cx, cy - 3); ctx.lineTo(cx + 2, cy - 1);
      ctx.moveTo(cx + 3, cy + 2); ctx.lineTo(cx + 3, cy - 2); ctx.lineTo(cx + 1, cy); ctx.moveTo(cx + 3, cy - 2); ctx.lineTo(cx + 5, cy);
      ctx.strokeStyle = '#fff'; ctx.lineWidth = 1; ctx.stroke();
    }
  }
}

// ── QBlock interaction state ──
// Managed via level tilemap - no separate object needed
// When hit from below: tile changes to EMPTY_BLOCK, spawns item

SB.Items = {
  Coin,
  PowerUp,

  coins: [],
  powerups: [],
  floatTexts: [],   // "+10" popups

  clear() {
    this.coins = []; this.powerups = []; this.floatTexts = [];
  },

  addCoin(x, y, type) { this.coins.push(new Coin(x, y, type)); },
  addPowerUp(x, y, type) { this.powerups.push(new PowerUp(x, y, type)); },

  addFloatText(x, y, text, color) {
    this.floatTexts.push({ x, y, text, color: color || '#FFD700', life: 1, maxLife: 1, vy: -60 });
  },

  update(dt) {
    for (const c of this.coins) if (!c.collected) c.update(dt);
    for (const p of this.powerups) if (!p.collected) p.update(dt);
    // Float texts
    for (let i = this.floatTexts.length - 1; i >= 0; i--) {
      const ft = this.floatTexts[i];
      ft.y += ft.vy * dt;
      ft.life -= dt;
      if (ft.life <= 0) this.floatTexts.splice(i, 1);
    }
  },

  draw(ctx, cam) {
    for (const c of this.coins) if (!c.collected) c.draw(ctx, cam);
    for (const p of this.powerups) if (!p.collected) p.draw(ctx, cam);
  },

  drawFloatTexts(ctx, cam) {
    for (const ft of this.floatTexts) {
      ctx.globalAlpha = Math.max(0, ft.life / ft.maxLife);
      ctx.fillStyle = ft.color;
      ctx.font = 'bold 10px monospace';
      ctx.fillText(ft.text, Math.round(ft.x - cam.x), Math.round(ft.y - cam.y));
    }
    ctx.globalAlpha = 1;
  },

  checkPlayerCollision(player) {
    // Coins
    for (const c of this.coins) {
      if (c.collected) continue;
      const magnetRange = player.magnet ? 80 : 0;
      if (magnetRange > 0 && SB.Utils.dist(player.x + player.w / 2, player.y + player.h / 2, c.x + 6, c.y + 6) < magnetRange) {
        // Magnet: attract coins
        const dx = (player.x + player.w / 2) - c.x;
        const dy = (player.y + player.h / 2) - c.y;
        const d = Math.max(1, Math.hypot(dx, dy));
        c.x += (dx / d) * 200 * 0.016;
        c.y += (dy / d) * 200 * 0.016;
      }
      if (SB.Utils.aabb(player.x, player.y, player.w, player.h, c.x, c.y, c.w, c.h)) {
        player.collectCoin(c);
      }
    }
    // Powerups
    for (const p of this.powerups) {
      if (p.collected || p.spawning) continue;
      if (SB.Utils.aabb(player.x, player.y, player.w, player.h, p.x, p.y, p.w, p.h)) {
        player.collectPowerUp(p);
      }
    }
  },

  spawnFromQBlock(tileX, tileY) {
    const y = tileY * SB.TILE - 16;
    const roll = Math.random();
    if (roll < 0.55) {
      const x = tileX * SB.TILE + (SB.TILE - 12) / 2;
      this.addCoin(x, y, 'gold');
    } else if (roll < 0.70) {
      const x = tileX * SB.TILE + (SB.TILE - 12) / 2;
      this.addCoin(x, y, 'red');
    } else if (roll < 0.82) {
      const x = tileX * SB.TILE;
      const pu = new PowerUp(x, y + 16, 'heart');
      pu.spawning = true; pu.spawnVy = -150;
      this.powerups.push(pu);
    } else if (roll < 0.92) {
      const x = tileX * SB.TILE;
      const types = ['speed', 'shield', 'magnet'];
      const pu = new PowerUp(x, y + 16, types[SB.Utils.randInt(0, 2)]);
      pu.spawning = true; pu.spawnVy = -150;
      this.powerups.push(pu);
    } else {
      const x = tileX * SB.TILE;
      const pu = new PowerUp(x, y + 16, 'oneup');
      pu.spawning = true; pu.spawnVy = -150;
      this.powerups.push(pu);
    }
  }
};
})();
