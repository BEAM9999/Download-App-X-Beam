/* ══════════════════════════════════════════════
   Slime Bouncer — HUD (Heads-Up Display)
   HP hearts, coins, timer, combo, boss HP bar
   ═════════════════════════════════════════════ */
'use strict';
(function() {
const SB = window.SB || (window.SB = {});

// Notification queue
const notifications = [];

SB.HUD = {
  comboTimer: 0,
  lastCombo: 0,
  notifyTimer: 0,
  notifyText: '',
  _itemSlots: [],
  _itemFlash: {},  // flash timers per item id

  notify(text, duration) {
    this.notifyText = text;
    this.notifyTimer = duration || 2;
  },

  update(dt) {
    if (this.comboTimer > 0) this.comboTimer -= dt;
    if (this.notifyTimer > 0) this.notifyTimer -= dt;
    if (SB.Player.combo > 1 && SB.Player.combo !== this.lastCombo) {
      this.comboTimer = 2;
      this.lastCombo = SB.Player.combo;
    }
    // Update item flash timers
    for (const id in this._itemFlash) {
      if (this._itemFlash[id] > 0) this._itemFlash[id] -= dt;
    }
  },

  useItem(itemId) {
    const inv = SB.Save.data.shopInventory || {};
    if (!inv[itemId] || inv[itemId] <= 0) return;
    const p = SB.Player;
    switch (itemId) {
      case 'speed':
        inv.speed--; p.speedMult = 1.5; p.speedTimer = 10; break;
      case 'heart':
        inv.heart--;
        if (p.hp < p.maxHp) p.hp++;
        else if (p.maxHp < 5) { p.maxHp++; p.hp++; }
        break;
      case 'shield':
        inv.shield--; p.shield = true; break;
      case 'magnet':
        inv.magnet--; p.magnet = true; p.magnetTimer = 15; break;
      case 'sword':
        inv.sword--; p.swordTimer = 20; break;
      default: return;
    }
    this._itemFlash[itemId] = 0.5;
    SB.Save.save();
    if (SB.Audio) SB.Audio.sfx('coin');
    this.notify('ใช้ไอเทม!', 1);
  },

  draw(ctx) {
    ctx.save();

    // ── HP Hearts ──
    const p = SB.Player;
    for (let i = 0; i < p.maxHp; i++) {
      const hx = 12 + i * 22;
      const hy = 12;
      if (i < p.hp) {
        // Full heart
        ctx.fillStyle = '#e74c3c';
        drawHeart(ctx, hx, hy, 18);
      } else {
        // Empty heart
        ctx.fillStyle = '#555';
        drawHeart(ctx, hx, hy, 18);
        ctx.fillStyle = '#333';
        drawHeart(ctx, hx + 2, hy + 2, 14);
      }
    }

    // (Shield indicator moved to active power-ups section below)

    // ── Coins ──
    ctx.fillStyle = '#f1c40f';
    ctx.beginPath();
    ctx.arc(SB.W - 90, 22, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#d4a017';
    ctx.fillRect(SB.W - 93, 19, 2, 6);

    ctx.fillStyle = '#fff';
    ctx.font = 'bold 16px monospace';
    ctx.textAlign = 'left';
    ctx.fillText('× ' + p.coins, SB.W - 78, 27);

    // ── Score ──
    ctx.fillStyle = '#fff';
    ctx.font = '12px monospace';
    ctx.textAlign = 'right';
    ctx.fillText(p.score.toString().padStart(8, '0'), SB.W - 12, 50);

    // ── Lives ──
    ctx.textAlign = 'left';
    ctx.fillStyle = '#7bed7b';
    ctx.font = 'bold 14px monospace';
    ctx.fillText('♦ × ' + p.lives, 12, 55);

    // ── Timer ──
    if (SB.Level.info && SB.gameTimer !== undefined) {
      const t = Math.max(0, Math.ceil(SB.gameTimer));
      const mm = Math.floor(t / 60).toString().padStart(2, '0');
      const ss = (t % 60).toString().padStart(2, '0');
      ctx.fillStyle = t <= 30 ? '#e74c3c' : '#fff';
      ctx.font = 'bold 16px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(mm + ':' + ss, SB.W / 2, 22);
    }

    // ── Level Name ──
    if (SB.Level.info) {
      ctx.fillStyle = 'rgba(255,255,255,0.6)';
      ctx.font = '11px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(SB.Level.currentId + ' ' + SB.Level.info.name, SB.W / 2, 38);
    }

    // ── Combo Display ──
    if (this.comboTimer > 0 && p.combo > 1) {
      const alpha = Math.min(1, this.comboTimer);
      ctx.globalAlpha = alpha;
      ctx.fillStyle = '#ff6b6b';
      ctx.font = 'bold 24px monospace';
      ctx.textAlign = 'center';
      const scale = 1 + Math.sin(this.comboTimer * 6) * 0.1;
      ctx.save();
      ctx.translate(SB.W / 2, 80);
      ctx.scale(scale, scale);
      ctx.fillText(p.combo + '× COMBO!', 0, 0);
      ctx.restore();
      ctx.globalAlpha = 1;
    }

    // ── Morph indicator ──
    if (p.morph && p.morph !== 'none') {
      const morphColors = { fire: '#e74c3c', ice: '#3498db', wind: '#27ae60' };
      const morphNames = { fire: 'FIRE', ice: 'ICE', wind: 'WIND' };
      ctx.fillStyle = morphColors[p.morph] || '#fff';
      ctx.font = 'bold 12px monospace';
      ctx.textAlign = 'left';
      ctx.fillText(morphNames[p.morph], 12, 75);
      // Timer bar
      if (p.morphTimer > 0) {
        ctx.fillStyle = 'rgba(0,0,0,0.4)';
        ctx.fillRect(12, 78, 50, 4);
        ctx.fillStyle = morphColors[p.morph];
        ctx.fillRect(12, 78, 50 * (p.morphTimer / 15), 4);
      }
    }

    // ── Boss HP Bar ──
    if (SB.boss && SB.boss.alive) {
      const bw = 300;
      const bx = (SB.W - bw) / 2;
      const by = SB.H - 30;
      // Background
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(bx - 2, by - 2, bw + 4, 18);
      // HP bar — green normal, red enraged
      const ratio = SB.boss.hp / SB.boss.maxHp;
      const barColor = SB.boss.phase >= 2 ? '#e74c3c' : '#27ae60';
      ctx.fillStyle = '#333';
      ctx.fillRect(bx, by, bw, 14);
      ctx.fillStyle = barColor;
      ctx.fillRect(bx, by, bw * ratio, 14);
      // Border
      ctx.strokeStyle = SB.boss.phase >= 2 ? '#c0392b' : '#2ecc71';
      ctx.lineWidth = 1;
      ctx.strokeRect(bx, by, bw, 14);
      // Boss name
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 11px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(SB.boss.name || 'BOSS', SB.W / 2, by + 11);
      // Phase indicator
      if (SB.boss.phase > 1) {
        ctx.fillStyle = '#ff6b6b';
        ctx.fillText('★ คลั่ง! ★', SB.W / 2, by - 6);
      }
    }

    // ── Gun indicator ──
    if (SB.Player.hasGun) {
      ctx.fillStyle = '#f1c40f';
      ctx.font = 'bold 10px monospace';
      ctx.textAlign = 'left';
      ctx.fillText('🔫 GUN', 12, p.morph !== 'none' ? 95 : 75);
    }

    // ── Active power-up indicators ──
    let buffY = p.morph !== 'none' ? 95 : 75;
    if (p.hasGun) buffY += 14;
    ctx.font = 'bold 9px monospace'; ctx.textAlign = 'left';
    if (p.swordTimer > 0) {
      ctx.fillStyle = '#e67e22';
      ctx.fillText('⚔ ' + Math.ceil(p.swordTimer) + 's', 12, buffY); buffY += 12;
    }
    if (p.speedTimer > 0) {
      ctx.fillStyle = '#f1c40f';
      ctx.fillText('⚡ ' + Math.ceil(p.speedTimer) + 's', 12, buffY); buffY += 12;
    }
    if (p.magnetTimer > 0) {
      ctx.fillStyle = '#95a5a6';
      ctx.fillText('🧲 ' + Math.ceil(p.magnetTimer) + 's', 12, buffY); buffY += 12;
    }
    if (p.shield) {
      ctx.fillStyle = '#3498db';
      ctx.fillText('🛡 SHIELD', 12, buffY); buffY += 12;
    }

    // ── Inventory Bar (top-right, below coins/score) ──
    if (SB.gameState === 'PLAYING') {
      const inv = SB.Save.data.shopInventory || {};
      const items = [
        { id: 'speed',  icon: '⚡', color: '#f1c40f' },
        { id: 'heart',  icon: '❤️', color: '#e74c3c' },
        { id: 'shield', icon: '🛡️', color: '#3498db' },
        { id: 'magnet', icon: '🧲', color: '#95a5a6' },
        { id: 'sword',  icon: '⚔️', color: '#e67e22' },
      ];
      const slotSize = 30;
      const gap = 4;
      const totalW = items.length * (slotSize + gap) - gap;
      const barX = SB.W - totalW - 10;
      const barY = 80;
      this._itemSlots = [];
      for (let i = 0; i < items.length; i++) {
        const it = items[i];
        const count = inv[it.id] || 0;
        const sx = barX + i * (slotSize + gap);
        const sy = barY;
        // Slot background
        const flash = this._itemFlash[it.id] || 0;
        if (count > 0) {
          ctx.fillStyle = flash > 0 ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)';
        } else {
          ctx.fillStyle = 'rgba(0,0,0,0.25)';
        }
        ctx.beginPath();
        const r = 5;
        ctx.moveTo(sx + r, sy);
        ctx.arcTo(sx + slotSize, sy, sx + slotSize, sy + slotSize, r);
        ctx.arcTo(sx + slotSize, sy + slotSize, sx, sy + slotSize, r);
        ctx.arcTo(sx, sy + slotSize, sx, sy, r);
        ctx.arcTo(sx, sy, sx + slotSize, sy, r);
        ctx.fill();
        // Border
        ctx.strokeStyle = count > 0 ? it.color : 'rgba(255,255,255,0.15)';
        ctx.lineWidth = count > 0 ? 1.5 : 0.5;
        ctx.stroke();
        // Icon
        ctx.globalAlpha = count > 0 ? 1 : 0.3;
        ctx.font = '14px monospace';
        ctx.textAlign = 'center';
        ctx.fillStyle = '#fff';
        ctx.fillText(it.icon, sx + slotSize / 2, sy + 18);
        ctx.globalAlpha = 1;
        // Count badge
        if (count > 0) {
          ctx.fillStyle = it.color;
          ctx.beginPath();
          ctx.arc(sx + slotSize - 4, sy + 4, 7, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#000';
          ctx.font = 'bold 9px monospace';
          ctx.fillText(count, sx + slotSize - 4, sy + 7);
        }
        // Number key hint
        ctx.fillStyle = 'rgba(255,255,255,0.3)';
        ctx.font = '8px monospace';
        ctx.fillText(i + 1, sx + slotSize / 2, sy + slotSize - 2);
        // Store slot for click detection
        this._itemSlots.push({ id: it.id, x: sx, y: sy, w: slotSize, h: slotSize });
      }
    }

    // ── Notification ──
    if (this.notifyTimer > 0) {
      const alpha = Math.min(1, this.notifyTimer);
      ctx.globalAlpha = alpha;
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(SB.W / 2 - 150, SB.H / 2 - 20, 300, 40);
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 18px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(this.notifyText, SB.W / 2, SB.H / 2 + 5);
      ctx.globalAlpha = 1;
    }

    // ── Gear/Pause button (all platforms) ──
    if (SB.gameState === 'PLAYING') {
      const gx = SB.W - 30, gy = 50;
      ctx.fillStyle = 'rgba(255,255,255,0.3)';
      ctx.font = '18px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('⚙', gx, gy);
      this._gearBtn = { x: gx - 14, y: gy - 16, w: 28, h: 28 };
    }

    // ── Boss Defeat Countdown Timer ──
    if (SB.bossDefeatActive && SB.bossDefeatTimer > 0) {
      const t = Math.ceil(SB.bossDefeatTimer);
      const pulse = 1 + Math.sin(Date.now() * 0.01) * 0.08;
      ctx.save();
      ctx.translate(SB.W / 2, 70);
      ctx.scale(pulse, pulse);
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(-80, -18, 160, 36);
      ctx.strokeStyle = '#f1c40f';
      ctx.lineWidth = 2;
      ctx.strokeRect(-80, -18, 160, 36);
      ctx.fillStyle = t <= 3 ? '#e74c3c' : '#f1c40f';
      ctx.font = 'bold 22px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('⏱ ' + t + ' วินาที', 0, 8);
      ctx.restore();
    }

    ctx.restore();
  }
};

// ── Draw heart shape ──
function drawHeart(ctx, x, y, size) {
  const s = size / 18;
  ctx.beginPath();
  ctx.moveTo(x + 9 * s, y + 16 * s);
  ctx.bezierCurveTo(x + 9 * s, y + 14 * s, x + 5 * s, y + 2 * s, x + 1 * s, y + 4 * s);
  ctx.bezierCurveTo(x - 3 * s, y + 6 * s, x - 1 * s, y + 14 * s, x + 9 * s, y + 18 * s);
  ctx.moveTo(x + 9 * s, y + 16 * s);
  ctx.bezierCurveTo(x + 9 * s, y + 14 * s, x + 13 * s, y + 2 * s, x + 17 * s, y + 4 * s);
  ctx.bezierCurveTo(x + 21 * s, y + 6 * s, x + 19 * s, y + 14 * s, x + 9 * s, y + 18 * s);
  ctx.fill();
}
})();
