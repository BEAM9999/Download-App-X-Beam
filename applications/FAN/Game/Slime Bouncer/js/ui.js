/* ══════════════════════════════════════════════
   Slime Bouncer — UI Screens
   Title, world map, pause, level complete,
   game over, settings, transitions
   ═════════════════════════════════════════════ */
'use strict';
(function() {
const SB = window.SB || (window.SB = {});

// ── Transition System ──
const transition = {
  active: false,
  type: 'fade', // 'fade' | 'iris'
  progress: 0,
  duration: 0.5,
  phase: 'out', // 'out' | 'in'
  callback: null,
  midCallback: null
};

function startTransition(type, midCb, endCb) {
  transition.active = true;
  transition.type = type || 'fade';
  transition.progress = 0;
  transition.phase = 'out';
  transition.duration = 0.4;
  transition.midCallback = midCb;
  transition.callback = endCb;
}

// ── Menu helpers ──
function drawMenuBg(ctx, alpha) {
  ctx.fillStyle = 'rgba(0,0,0,' + (alpha || 0.7) + ')';
  ctx.fillRect(0, 0, SB.W, SB.H);
}

function drawTextShadow(ctx, text, x, y, color, font) {
  ctx.font = font || 'bold 24px monospace';
  ctx.textAlign = 'center';
  ctx.fillStyle = '#000';
  ctx.fillText(text, x + 2, y + 2);
  ctx.fillStyle = color || '#fff';
  ctx.fillText(text, x, y);
}

function drawMenuOption(ctx, text, x, y, selected) {
  ctx.font = 'bold 16px monospace';
  ctx.textAlign = 'center';
  if (selected) {
    ctx.fillStyle = '#f1c40f';
    ctx.fillText('▸ ' + text + ' ◂', x, y);
  } else {
    ctx.fillStyle = '#bdc3c7';
    ctx.fillText(text, x, y);
  }
}

// Rounded rect helper
function _roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

SB.UI = {
  // Menu state
  menuIndex: 0,
  menuOptions: [],
  animTime: 0,
  settingsMode: false,

  // World map state
  worldMapCursor: 0,
  worldMapLevels: [],

  startTransition: startTransition,

  // Mouse click helper: returns index of clicked menu option, or -1
  _checkMenuClick(startY, count, spacing) {
    if (!SB.Input.mouse.clicked) return -1;
    const mx = SB.Input.mouse.x, my = SB.Input.mouse.y;
    spacing = spacing || 35;
    for (let i = 0; i < count; i++) {
      const itemY = startY + i * spacing;
      if (my > itemY - 18 && my < itemY + 10 && mx > SB.W / 2 - 150 && mx < SB.W / 2 + 150) {
        return i;
      }
    }
    return -1;
  },

  update(dt) {
    this.animTime += dt;

    // Update transition
    if (transition.active) {
      transition.progress += dt / transition.duration;
      if (transition.progress >= 1 && transition.phase === 'out') {
        transition.progress = 0;
        transition.phase = 'in';
        if (transition.midCallback) transition.midCallback();
      }
      if (transition.progress >= 1 && transition.phase === 'in') {
        transition.active = false;
        if (transition.callback) transition.callback();
      }
    }
  },

  handleInput() {
    const inp = SB.Input;
    switch (SB.gameState) {
      case 'TITLE': return this.handleTitleInput();
      case 'WORLD_SELECT': return this.handleWorldSelectInput();
      case 'WORLD_MAP': return this.handleWorldMapInput();
      case 'PAUSED': return this.handlePauseInput();
      case 'LEVEL_COMPLETE': return this.handleLevelCompleteInput();
      case 'GAME_OVER': return this.handleGameOverInput();
    }
  },

  // ═══ TITLE SCREEN ═══
  initTitle() {
    SB.gameState = 'TITLE';
    if (SB.Save.data) { SB.Save.data.lastScreen = 'TITLE'; SB.Save.save(); }
    const hasLastLevel = SB.Save.data && SB.Save.data.lastPlayedLevel;
    this.menuOptions = hasLastLevel
      ? ['เล่นต่อ', 'เลือก World', 'ร้านค้า', 'ตั้งค่า']
      : ['เลือก World', 'ร้านค้า', 'ตั้งค่า'];
    this._hasContinue = !!hasLastLevel;
    this.menuIndex = 0;
    SB.Audio.playBGM('title');
  },

  handleTitleInput() {
    if (transition.active) return;
    if (this.settingsMode) { this.handleSettingsInput(); return; }
    if (this.shopMode) { this.handleShopInput(); return; }
    if (SB.Input.upPressed) {
      this.menuIndex = (this.menuIndex - 1 + this.menuOptions.length) % this.menuOptions.length;
      SB.Audio.sfx('menuSelect');
    }
    if (SB.Input.downPressed) {
      this.menuIndex = (this.menuIndex + 1) % this.menuOptions.length;
      SB.Audio.sfx('menuSelect');
    }
    // Mouse click on menu
    const clicked = this._checkMenuClick(310, this.menuOptions.length, 30);
    if (clicked >= 0) { this.menuIndex = clicked; }
    if (SB.Input.enterPressed || SB.Input.jumpPressed || clicked >= 0) {
      SB.Audio.sfx('menuConfirm');
      const off = this._hasContinue ? 0 : -1;
      switch (this.menuIndex) {
        case 0:
          if (this._hasContinue) {
            // Continue: load last played level
            const lvl = SB.Save.data.lastPlayedLevel;
            startTransition('iris', () => SB.startLevel(lvl));
          } else {
            startTransition('fade', () => this.initWorldSelect());
          }
          break;
        case (1 + off): // เลือก World (index 1 with continue, 0 without)
          if (this._hasContinue) startTransition('fade', () => this.initWorldSelect());
          break;
        case (2 + off): // Shop
          this.shopMode = true;
          this.shopIndex = 0;
          break;
        case (3 + off): // Settings
          this.settingsMode = true;
          this.settingIndex = 0;
          break;
      }
    }
  },

  drawTitle(ctx) {
    const t = this.animTime;

    // ── Gradient sky background ──
    const skyGrad = ctx.createLinearGradient(0, 0, 0, SB.H);
    skyGrad.addColorStop(0, '#0d1b2a');
    skyGrad.addColorStop(0.4, '#1b2838');
    skyGrad.addColorStop(0.65, '#2a4a3a');
    skyGrad.addColorStop(1, '#1a3a20');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, SB.W, SB.H);

    // ── Twinkling stars ──
    for (let i = 0; i < 60; i++) {
      const sx = ((i * 47 + t * 8 * (i % 3 + 0.5)) % SB.W);
      const sy = ((i * 31 + Math.sin(t * 0.7 + i) * 4) % (SB.H * 0.55));
      const ss = 0.8 + (i % 3) * 0.5;
      const twinkle = 0.2 + Math.sin(t * 3 + i * 1.7) * 0.3 + Math.sin(t * 1.1 + i * 0.3) * 0.15;
      ctx.globalAlpha = Math.max(0, twinkle);
      ctx.fillStyle = i % 7 === 0 ? '#aee8ff' : (i % 5 === 0 ? '#ffe8ae' : '#fff');
      ctx.beginPath(); ctx.arc(sx, sy, ss, 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalAlpha = 1;

    // ── Moon ──
    const moonX = SB.W * 0.82, moonY = 65;
    ctx.fillStyle = 'rgba(255,255,220,0.06)';
    ctx.beginPath(); ctx.arc(moonX, moonY, 50, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,220,0.12)';
    ctx.beginPath(); ctx.arc(moonX, moonY, 32, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#fffde0';
    ctx.beginPath(); ctx.arc(moonX, moonY, 18, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#f0ecc0';
    ctx.beginPath(); ctx.arc(moonX - 5, moonY - 4, 3, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(moonX + 7, moonY + 5, 2, 0, Math.PI * 2); ctx.fill();

    // ── Distant mountains ──
    ctx.fillStyle = '#162a1e';
    ctx.beginPath(); ctx.moveTo(0, SB.H - 130);
    for (let x = 0; x <= SB.W; x += 30) {
      ctx.lineTo(x, SB.H - 130 - Math.sin(x * 0.008) * 40 - Math.sin(x * 0.015 + 2) * 20);
    }
    ctx.lineTo(SB.W, SB.H); ctx.lineTo(0, SB.H); ctx.fill();

    ctx.fillStyle = '#1e3a28';
    ctx.beginPath(); ctx.moveTo(0, SB.H - 100);
    for (let x = 0; x <= SB.W; x += 20) {
      ctx.lineTo(x, SB.H - 100 - Math.sin(x * 0.012 + 1) * 30 - Math.sin(x * 0.006) * 15);
    }
    ctx.lineTo(SB.W, SB.H); ctx.lineTo(0, SB.H); ctx.fill();

    // ── Rolling hills (ground) ──
    const groundY = SB.H - 75;
    const hillGrad = ctx.createLinearGradient(0, groundY - 10, 0, SB.H);
    hillGrad.addColorStop(0, '#3a7a3a');
    hillGrad.addColorStop(0.3, '#2d6a2d');
    hillGrad.addColorStop(1, '#1a4a1a');
    ctx.fillStyle = hillGrad;
    ctx.beginPath(); ctx.moveTo(0, groundY);
    for (let x = 0; x <= SB.W; x += 10) {
      ctx.lineTo(x, groundY - Math.sin(x * 0.02 + t * 0.3) * 6 - Math.sin(x * 0.008) * 10);
    }
    ctx.lineTo(SB.W, SB.H); ctx.lineTo(0, SB.H); ctx.fill();

    // Grass tufts on ground
    ctx.strokeStyle = '#5ab85a';
    ctx.lineWidth = 1.5;
    for (let i = 0; i < 30; i++) {
      const gx = (i * 27 + 10) % SB.W;
      const gy = groundY - Math.sin(gx * 0.02 + t * 0.3) * 6 - Math.sin(gx * 0.008) * 10;
      const sway = Math.sin(t * 2 + i * 0.5) * 3;
      ctx.beginPath(); ctx.moveTo(gx, gy); ctx.lineTo(gx + sway - 2, gy - 8); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(gx + 3, gy); ctx.lineTo(gx + 3 + sway + 1, gy - 6); ctx.stroke();
    }

    // ── Tiny decorative trees on hills ──
    for (let i = 0; i < 6; i++) {
      const tx = 30 + i * (SB.W / 6);
      const ty = groundY - Math.sin(tx * 0.02 + t * 0.3) * 6 - Math.sin(tx * 0.008) * 10;
      const treeH = 12 + (i % 3) * 5;
      const sw = Math.sin(t * 1.5 + i) * 1.5;
      ctx.fillStyle = '#2a5a2a';
      ctx.fillRect(tx - 1, ty - treeH, 3, treeH);
      ctx.fillStyle = '#3a8a3a';
      ctx.beginPath();
      ctx.moveTo(tx + 1 + sw, ty - treeH - 10);
      ctx.lineTo(tx - 8, ty - treeH + 6);
      ctx.lineTo(tx + 10, ty - treeH + 6);
      ctx.fill();
      ctx.fillStyle = '#48a848';
      ctx.beginPath();
      ctx.moveTo(tx + 1 + sw, ty - treeH - 5);
      ctx.lineTo(tx - 6, ty - treeH + 8);
      ctx.lineTo(tx + 8, ty - treeH + 8);
      ctx.fill();
    }

    // ── Floating particles ──
    for (let i = 0; i < 12; i++) {
      const px = ((i * 73 + t * 15 * (0.5 + (i % 3) * 0.3)) % (SB.W + 40)) - 20;
      const py = 80 + (i * 41 % 280) + Math.sin(t * 0.8 + i * 2) * 15;
      const ps = 1.5 + (i % 3);
      ctx.globalAlpha = 0.15 + Math.sin(t * 1.5 + i) * 0.1;
      ctx.fillStyle = i % 3 === 0 ? '#7bed9e' : (i % 3 === 1 ? '#a8edca' : '#f1c40f');
      ctx.beginPath(); ctx.arc(px, py, ps, 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalAlpha = 1;

    // ── Title text with glow ──
    const bob = Math.sin(t * 2) * 4;
    const titleY = 95 + bob;

    // Title glow
    ctx.save();
    ctx.shadowColor = '#4aba4a';
    ctx.shadowBlur = 20 + Math.sin(t * 2) * 8;
    ctx.font = 'bold 38px monospace';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#5edd5e';
    ctx.fillText('SLIME BOUNCER', SB.W / 2, titleY);
    ctx.restore();

    // Title main text
    ctx.font = 'bold 38px monospace';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#000';
    ctx.fillText('SLIME BOUNCER', SB.W / 2 + 2, titleY + 2);
    const titleGrad = ctx.createLinearGradient(SB.W / 2 - 150, titleY - 30, SB.W / 2 + 150, titleY + 5);
    titleGrad.addColorStop(0, '#7bed9e');
    titleGrad.addColorStop(0.5, '#4aba4a');
    titleGrad.addColorStop(1, '#2ecc71');
    ctx.fillStyle = titleGrad;
    ctx.fillText('SLIME BOUNCER', SB.W / 2, titleY);

    // Subtitle
    ctx.font = 'italic 13px monospace';
    ctx.fillStyle = '#000';
    ctx.fillText('The Adventures of Glim', SB.W / 2 + 1, titleY + 28 + 1);
    ctx.fillStyle = '#a8edca';
    ctx.fillText('The Adventures of Glim', SB.W / 2, titleY + 28);

    // ── Draw Glim character (larger on title) ──
    drawGlimTitle(ctx, SB.W / 2, 195 + bob, t);

    // ── Menu buttons (styled cards) ──
    const my = 290;
    const mp = SB.Input.mousePos;
    for (let i = 0; i < this.menuOptions.length; i++) {
      const bx = SB.W / 2, by = my + i * 38;
      const sel = i === this.menuIndex;
      // Check mouse hover
      const hovered = mp.x >= bx - 120 && mp.x <= bx + 120 && mp.y >= by - 16 && mp.y <= by + 12;
      if (hovered && this.menuIndex !== i) {
        this.menuIndex = i;
      }
      const active = sel || hovered;
      const scale = active ? 1.05 + Math.sin(t * 4) * 0.02 : 1;

      ctx.save();
      ctx.translate(bx, by - 2);
      ctx.scale(scale, scale);

      // Button background
      if (active) {
        _roundRect(ctx, -115, -15, 230, 30, 8);
        ctx.fillStyle = 'rgba(74,186,74,0.2)';
        ctx.fill();
        ctx.strokeStyle = 'rgba(123,237,158,0.6)';
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }

      // Button text
      ctx.font = active ? 'bold 16px monospace' : '15px monospace';
      ctx.textAlign = 'center';
      if (active) {
        ctx.fillStyle = '#7bed9e';
        ctx.fillText('▸ ' + this.menuOptions[i] + ' ◂', 0, 5);
      } else {
        ctx.fillStyle = '#8fa89b';
        ctx.fillText(this.menuOptions[i], 0, 5);
      }
      ctx.restore();
    }

    // ── Coin display top-right ──
    if (SB.Save.data) {
      const coinX = SB.W - 75, coinY = 22;
      // Coin bg pill
      _roundRect(ctx, coinX - 30, coinY - 12, 95, 24, 12);
      ctx.fillStyle = 'rgba(0,0,0,0.35)';
      ctx.fill();
      // Coin icon
      ctx.fillStyle = '#f1c40f';
      ctx.beginPath(); ctx.arc(coinX - 15, coinY, 8, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#d4a017'; ctx.font = 'bold 9px monospace'; ctx.textAlign = 'center';
      ctx.fillText('$', coinX - 15, coinY + 3);
      // Coin count
      ctx.fillStyle = '#fff'; ctx.font = 'bold 14px monospace'; ctx.textAlign = 'left';
      ctx.fillText((SB.Save.data.coins || 0), coinX - 2, coinY + 5);

      // ── Shop inventory display ──
      const inv = SB.Save.data.shopInventory || {};
      const ownedItems = this.SHOP_ITEMS.filter(it => (inv[it.id] || 0) > 0);
      if (ownedItems.length > 0) {
        const invY = coinY + 28;
        const pillW = 42, pillH = 22, pillGap = 6;
        const totalW = ownedItems.length * (pillW + pillGap) - pillGap;
        let ox = SB.W - 10 - totalW;
        // Inventory bg ribbon
        _roundRect(ctx, ox - 8, invY - 13, totalW + 16, pillH + 4, 12);
        ctx.fillStyle = 'rgba(0,0,0,0.25)';
        ctx.fill();
        for (let i = 0; i < ownedItems.length; i++) {
          const it = ownedItems[i];
          const count = inv[it.id];
          const ix = ox + i * (pillW + pillGap);
          _roundRect(ctx, ix, invY - 10, pillW, pillH, 10);
          ctx.fillStyle = 'rgba(0,0,0,0.4)';
          ctx.fill();
          ctx.strokeStyle = it.color + '66'; ctx.lineWidth = 1;
          ctx.stroke();
          ctx.font = '13px sans-serif'; ctx.textAlign = 'left';
          ctx.fillStyle = '#fff';
          ctx.fillText(it.icon, ix + 3, invY + 5);
          ctx.fillStyle = '#fff'; ctx.font = 'bold 11px monospace'; ctx.textAlign = 'right';
          ctx.fillText('×' + count, ix + pillW - 4, invY + 5);
        }
      }
    }

    // Settings overlay
    if (this.settingsMode) {
      this.drawSettings(ctx);
    }

    // Shop overlay
    if (this.shopMode) {
      this.drawShop(ctx);
    }

    // Version
    ctx.fillStyle = 'rgba(255,255,255,0.2)';
    ctx.font = '10px monospace';
    ctx.textAlign = 'right';
    ctx.fillText('v1.0.0  FAN Game Studio', SB.W - 10, SB.H - 8);
  },

  // ═══ WORLD MAP ═══
  // World info for world select screen
  WORLD_NAMES: { 1: 'Emerald Forest', 2: 'Golden Desert', 3: 'Frozen Sea', 4: 'Shadow Castle' },
  WORLD_NAMES_TH: { 1: 'ป่ามรกต', 2: 'ทะเลทรายทอง', 3: 'ทะเลน้ำแข็ง', 4: 'ปราสาทเงา' },
  WORLD_COLORS: { 1: '#4aba4a', 2: '#d4a017', 3: '#74b9ff', 4: '#6c5ce7' },
  WORLD_BG_COLORS: { 1: '#0a3d0a', 2: '#3d2b0a', 3: '#0a2a3d', 4: '#1a0a2e' },
  WORLD_GROUND_COLORS: { 1: '#2d5a27', 2: '#8B6914', 3: '#4a6a7a', 4: '#2a1a3e' },

  // World selection
  worldSelectCursor: 0,

  initWorldSelect() {
    SB.gameState = 'WORLD_SELECT';
    this.worldSelectCursor = SB.Save.data.currentWorld - 1;
    if (SB.Save.data) { SB.Save.data.lastScreen = 'WORLD_SELECT'; SB.Save.save(); }
    SB.Audio.playBGM('title');
  },

  handleWorldSelectInput() {
    if (transition.active) return;
    if (SB.Input.leftPressed) {
      this.worldSelectCursor = Math.max(0, this.worldSelectCursor - 1);
      SB.Audio.sfx('menuSelect');
    }
    if (SB.Input.rightPressed) {
      this.worldSelectCursor = Math.min(3, this.worldSelectCursor + 1);
      SB.Audio.sfx('menuSelect');
    }
    // Mouse click on world cards
    let wClicked = false;
    if (SB.Input.mouse.clicked) {
      const mx = SB.Input.mouse.x, my = SB.Input.mouse.y;
      const cardW = 140, cardH = 200;
      const totalW = 4 * cardW + 3 * 20;
      const startX = (SB.W - totalW) / 2;
      for (let i = 0; i < 4; i++) {
        const wx = startX + i * (cardW + 20) + cardW / 2;
        const wy = SB.H / 2 + 15;
        if (mx >= wx - cardW / 2 && mx <= wx + cardW / 2 &&
            my >= wy - cardH / 2 && my <= wy + cardH / 2) {
          this.worldSelectCursor = i;
          wClicked = true;
          SB.Audio.sfx('menuSelect');
          break;
        }
      }
    }
    if (SB.Input.enterPressed || SB.Input.jumpPressed || wClicked) {
      const worldNum = this.worldSelectCursor + 1;
      const unlocked = worldNum <= (SB.Save.data.unlockedWorld || 1);
      if (unlocked) {
        SB.Save.data.currentWorld = worldNum;
        SB.Audio.sfx('menuConfirm');
        startTransition('fade', () => this.initWorldMap());
      }
    }
    // Mouse click on back button
    if (SB.Input.mouse.clicked) {
      const mx = SB.Input.mouse.x, my = SB.Input.mouse.y;
      if (mx >= 15 && mx <= 95 && my >= 15 && my <= 47) {
        SB.Audio.sfx('menuSelect');
        startTransition('fade', () => this.initTitle());
        return;
      }
    }
    if (SB.Input.pausePressed) {
      startTransition('fade', () => this.initTitle());
    }
  },

  drawWorldSelect(ctx) {
    const t = this.animTime;
    // ── Gradient background ──
    const grad = ctx.createLinearGradient(0, 0, 0, SB.H);
    grad.addColorStop(0, '#050520');
    grad.addColorStop(0.5, '#0a0a3d');
    grad.addColorStop(1, '#15152e');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, SB.W, SB.H);

    // ── Moving nebula glow ──
    for (let i = 0; i < 3; i++) {
      const nx = SB.W * 0.3 + Math.sin(t * 0.3 + i * 2) * SB.W * 0.3;
      const ny = SB.H * 0.3 + Math.cos(t * 0.2 + i * 1.5) * SB.H * 0.15;
      const ng = ctx.createRadialGradient(nx, ny, 0, nx, ny, 120);
      const colors = ['#6c5ce7', '#00b894', '#e17055'];
      ng.addColorStop(0, colors[i] + '18');
      ng.addColorStop(1, 'transparent');
      ctx.fillStyle = ng;
      ctx.fillRect(0, 0, SB.W, SB.H);
    }

    // ── Parallax stars ──
    ctx.fillStyle = '#fff';
    for (let i = 0; i < 60; i++) {
      const sx = ((i * 53 + t * (3 + (i % 4) * 2)) % SB.W);
      const sy = ((i * 37 + Math.sin(t * 0.5 + i) * 4) % (SB.H * 0.5));
      ctx.globalAlpha = 0.15 + Math.sin(t * 2.5 + i * 0.7) * 0.25;
      const sz = 1 + (i % 3);
      ctx.beginPath(); ctx.arc(sx, sy, sz * 0.5, 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalAlpha = 1;

    // ── Shooting stars ──
    const ssPhase = (t * 0.4) % 1;
    if (ssPhase < 0.3) {
      ctx.strokeStyle = '#fff';
      ctx.globalAlpha = 1 - ssPhase / 0.3;
      ctx.lineWidth = 1.5;
      const ssx = SB.W * 0.8 - ssPhase * SB.W * 0.4;
      const ssy = 30 + ssPhase * 80;
      ctx.beginPath(); ctx.moveTo(ssx, ssy); ctx.lineTo(ssx + 30, ssy - 15); ctx.stroke();
      ctx.globalAlpha = 1;
    }

    // ── Title with glow ──
    ctx.save();
    ctx.shadowColor = '#f1c40f';
    ctx.shadowBlur = 15 + Math.sin(t * 2) * 5;
    drawTextShadow(ctx, 'เลือก World', SB.W / 2, 55, '#f1c40f', 'bold 30px monospace');
    ctx.restore();

    // Subtitle
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.font = '12px monospace'; ctx.textAlign = 'center';
    ctx.fillText('SELECT YOUR WORLD', SB.W / 2, 75);

    // ── World Cards ──
    const cardW = 140, cardH = 200;
    const totalW = 4 * cardW + 3 * 20;
    const startX = (SB.W - totalW) / 2;
    const mp = SB.Input.mousePos;

    for (let i = 0; i < 4; i++) {
      const wx = startX + i * (cardW + 20) + cardW / 2;
      const wy = SB.H / 2 + 15;
      const worldNum = i + 1;
      const unlocked = worldNum <= (SB.Save.data.unlockedWorld || 1);
      const selected = i === this.worldSelectCursor;

      // Mouse hover on card
      const hovered = mp.x >= wx - cardW / 2 && mp.x <= wx + cardW / 2 &&
                       mp.y >= wy - cardH / 2 && mp.y <= wy + cardH / 2;
      if (hovered && this.worldSelectCursor !== i) {
        this.worldSelectCursor = i;
      }

      const bob = selected ? Math.sin(t * 3) * 6 : (hovered ? Math.sin(t * 3) * 3 : 0);
      const active = selected || hovered;
      const color = this.WORLD_COLORS[worldNum];
      const bgCol = this.WORLD_BG_COLORS[worldNum];

      // Card shadow
      if (selected) {
        ctx.shadowColor = color;
        ctx.shadowBlur = 20;
      }

      // Card background
      ctx.fillStyle = unlocked ? bgCol : '#1a1a2e';
      _roundRect(ctx, wx - cardW / 2, wy - cardH / 2 + bob, cardW, cardH, 12);
      ctx.fill();

      // Card border glow
      ctx.strokeStyle = selected ? '#fff' : (unlocked ? color + '80' : '#333');
      ctx.lineWidth = selected ? 3 : 1.5;
      _roundRect(ctx, wx - cardW / 2, wy - cardH / 2 + bob, cardW, cardH, 12);
      ctx.stroke();

      ctx.shadowColor = 'transparent'; ctx.shadowBlur = 0;

      if (unlocked) {
        // World icon area (mini themed decoration)
        const iconY = wy - cardH / 2 + 25 + bob;
        ctx.save();
        ctx.beginPath();
        _roundRect(ctx, wx - 50, iconY, 100, 60, 8);
        ctx.clip();
        // Mini themed bg
        const ig = ctx.createLinearGradient(wx - 50, iconY, wx - 50, iconY + 60);
        ig.addColorStop(0, color + '40');
        ig.addColorStop(1, bgCol);
        ctx.fillStyle = ig;
        ctx.fillRect(wx - 50, iconY, 100, 60);
        // Mini decorations
        if (worldNum === 1) { // trees
          ctx.fillStyle = '#2ecc71';
          for (let j = 0; j < 4; j++) {
            const tx = wx - 40 + j * 25;
            ctx.beginPath(); ctx.moveTo(tx, iconY + 50); ctx.lineTo(tx + 8, iconY + 20 + Math.sin(t * 2 + j) * 3); ctx.lineTo(tx + 16, iconY + 50); ctx.fill();
          }
        } else if (worldNum === 2) { // pyramids
          ctx.fillStyle = '#d4a017';
          ctx.beginPath(); ctx.moveTo(wx - 20, iconY + 55); ctx.lineTo(wx, iconY + 15); ctx.lineTo(wx + 20, iconY + 55); ctx.fill();
          ctx.beginPath(); ctx.moveTo(wx + 15, iconY + 55); ctx.lineTo(wx + 30, iconY + 30); ctx.lineTo(wx + 45, iconY + 55); ctx.fill();
        } else if (worldNum === 3) { // snowflakes / mountains
          ctx.fillStyle = '#a8d8ea';
          for (let j = 0; j < 3; j++) {
            const mx = wx - 30 + j * 30;
            ctx.beginPath(); ctx.moveTo(mx, iconY + 55); ctx.lineTo(mx + 15, iconY + 20); ctx.lineTo(mx + 30, iconY + 55); ctx.fill();
          }
          ctx.fillStyle = '#fff';
          for (let j = 0; j < 6; j++) {
            const fx = wx - 40 + Math.sin(t + j * 1.5) * 40;
            const fy = iconY + 10 + ((t * 20 + j * 15) % 50);
            ctx.beginPath(); ctx.arc(fx, fy, 2, 0, Math.PI * 2); ctx.fill();
          }
        } else { // castle towers
          ctx.fillStyle = '#6c5ce7';
          ctx.fillRect(wx - 30, iconY + 25, 16, 30);
          ctx.fillRect(wx - 5, iconY + 15, 16, 40);
          ctx.fillRect(wx + 20, iconY + 20, 16, 35);
          ctx.fillStyle = '#f1c40f';
          ctx.fillRect(wx - 24, iconY + 30, 4, 5);
          ctx.fillRect(wx + 1, iconY + 22, 4, 5);
          ctx.fillRect(wx + 26, iconY + 28, 4, 5);
        }
        ctx.restore();

        // World number badge
        ctx.fillStyle = color;
        ctx.beginPath(); ctx.arc(wx, wy + 10 + bob, 18, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 18px monospace'; ctx.textAlign = 'center';
        ctx.fillText(worldNum, wx, wy + 17 + bob);

        // World name
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 12px monospace';
        ctx.fillText(this.WORLD_NAMES_TH[worldNum], wx, wy + 45 + bob);
        ctx.fillStyle = '#aaa';
        ctx.font = '10px monospace';
        ctx.fillText(this.WORLD_NAMES[worldNum], wx, wy + 60 + bob);

        // Star count
        let totalStars = 0;
        const worldLevels = SB.Level.getWorldLevels(worldNum);
        for (const l of worldLevels) totalStars += (SB.Save.data.stars[l.id] || 0);
        const maxStars = worldLevels.length * 3;
        // Star progress bar
        const barW = 80, barH = 6;
        const barX = wx - barW / 2, barY = wy + 70 + bob;
        ctx.fillStyle = '#333';
        _roundRect(ctx, barX, barY, barW, barH, 3); ctx.fill();
        if (totalStars > 0) {
          ctx.fillStyle = '#f1c40f';
          _roundRect(ctx, barX, barY, barW * (totalStars / maxStars), barH, 3); ctx.fill();
        }
        ctx.fillStyle = '#f1c40f';
        ctx.font = '10px monospace';
        ctx.fillText('★ ' + totalStars + '/' + maxStars, wx, wy + 88 + bob);
      } else {
        // Locked world
        ctx.fillStyle = '#444';
        ctx.font = '36px monospace'; ctx.textAlign = 'center';
        ctx.fillText('🔒', wx, wy + 5 + bob);
        ctx.fillStyle = '#666';
        ctx.font = '11px monospace';
        ctx.fillText(this.WORLD_NAMES_TH[worldNum], wx, wy + 45 + bob);
        ctx.fillStyle = '#555';
        ctx.font = '9px monospace';
        ctx.fillText('ยังปิดอยู่', wx, wy + 62 + bob);
      }
    }

    // ── Back button (top-left, with hover) ──
    const backHover = mp.x >= 15 && mp.x <= 95 && mp.y >= 15 && mp.y <= 47;
    ctx.fillStyle = backHover ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.1)';
    _roundRect(ctx, 15, 15, 80, 32, 10);
    ctx.fill();
    ctx.strokeStyle = backHover ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.25)'; ctx.lineWidth = 1;
    _roundRect(ctx, 15, 15, 80, 32, 10); ctx.stroke();
    ctx.fillStyle = backHover ? '#fff' : '#ccc'; ctx.font = 'bold 13px monospace'; ctx.textAlign = 'center';
    ctx.fillText('◀ กลับ', 55, 36);

    // ── Coin display top-right (pill style) ──
    if (SB.Save.data) {
      const coinX = SB.W - 75, coinY = 22;
      _roundRect(ctx, coinX - 30, coinY - 12, 95, 24, 12);
      ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.fill();
      ctx.fillStyle = '#f1c40f';
      ctx.beginPath(); ctx.arc(coinX - 15, coinY, 8, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#d4a017'; ctx.font = 'bold 9px monospace'; ctx.textAlign = 'center';
      ctx.fillText('$', coinX - 15, coinY + 3);
      ctx.fillStyle = '#fff'; ctx.font = 'bold 14px monospace'; ctx.textAlign = 'left';
      ctx.fillText((SB.Save.data.coins || 0), coinX - 2, coinY + 5);
    }

    // ── Bottom hint ──
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    ctx.font = '11px monospace'; ctx.textAlign = 'center';
    ctx.fillText('← → เลือก World    ENTER/คลิก เปิด    ESC กลับ', SB.W / 2, SB.H - 10);
  },

  initWorldMap() {
    SB.gameState = 'WORLD_MAP';
    const w = SB.Save.data.currentWorld;
    this.worldMapLevels = SB.Level.getWorldLevels(w);
    this.worldMapCursor = 0;
    if (SB.Save.data) { SB.Save.data.lastScreen = 'WORLD_MAP'; SB.Save.save(); }
    SB.Audio.playBGM('title');
  },

  handleWorldMapInput() {
    if (transition.active) return;
    const levels = this.worldMapLevels;
    const w = SB.Save.data.currentWorld;
    const unlockCount = (SB.Save.data.unlockedLevels && SB.Save.data.unlockedLevels[w]) || 1;
    if (SB.Input.leftPressed) {
      this.worldMapCursor = Math.max(0, this.worldMapCursor - 1);
      SB.Audio.sfx('menuSelect');
    }
    if (SB.Input.rightPressed) {
      this.worldMapCursor = Math.min(levels.length - 1, this.worldMapCursor + 1);
      SB.Audio.sfx('menuSelect');
    }
    // Mouse click on level nodes
    let nodeClicked = false;
    if (SB.Input.mouse.clicked) {
      const mx = SB.Input.mouse.x, my = SB.Input.mouse.y;
      const nodeSpacing = Math.min(150, (SB.W - 100) / Math.max(levels.length - 1, 1));
      const pathStartX = (SB.W - (levels.length - 1) * nodeSpacing) / 2;
      for (let i = 0; i < levels.length; i++) {
        const nx = pathStartX + i * nodeSpacing, ny = SB.H - 55;
        if (Math.hypot(mx - nx, my - ny) < 28) {
          this.worldMapCursor = i;
          nodeClicked = true;
          SB.Audio.sfx('menuSelect');
          break;
        }
      }
    }
    if (SB.Input.enterPressed || SB.Input.jumpPressed || nodeClicked) {
      const lvl = levels[this.worldMapCursor];
      if (lvl && this.worldMapCursor < unlockCount) {
        SB.Audio.sfx('menuConfirm');
        startTransition('iris', () => SB.startLevel(lvl.id));
      }
    }
    // Mouse click on back button
    if (SB.Input.mouse.clicked) {
      const mx = SB.Input.mouse.x, my = SB.Input.mouse.y;
      if (mx >= 15 && mx <= 95 && my >= 15 && my <= 47) {
        SB.Audio.sfx('menuSelect');
        startTransition('fade', () => this.initWorldSelect());
        return;
      }
    }
    if (SB.Input.pausePressed) {
      startTransition('fade', () => this.initWorldSelect());
    }
  },

  drawWorldMap(ctx) {
    const w = SB.Save.data.currentWorld;
    const unlockCount = (SB.Save.data.unlockedLevels && SB.Save.data.unlockedLevels[w]) || 1;
    const t = this.animTime;

    // ── Gradient background per world ──
    const bgCol = this.WORLD_BG_COLORS[w] || '#0a3d0a';
    const grad = ctx.createLinearGradient(0, 0, 0, SB.H);
    grad.addColorStop(0, bgCol);
    grad.addColorStop(0.6, bgCol);
    grad.addColorStop(1, '#000');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, SB.W, SB.H);

    // ── Animated sky particles per world ──
    if (w === 1) { // Forest: floating leaves
      ctx.fillStyle = '#2ecc71';
      for (let i = 0; i < 15; i++) {
        const lx = ((i * 67 + t * 15) % SB.W);
        const ly = ((i * 41 + t * 8 + Math.sin(t + i) * 20) % (SB.H * 0.5));
        ctx.globalAlpha = 0.2 + Math.sin(t + i) * 0.1;
        ctx.save(); ctx.translate(lx, ly); ctx.rotate(t + i);
        ctx.fillRect(-3, -1, 6, 2); ctx.restore();
      }
    } else if (w === 2) { // Desert: sand particles
      ctx.fillStyle = '#d4a017';
      for (let i = 0; i < 20; i++) {
        const sx = ((i * 43 + t * 25) % SB.W);
        const sy = ((i * 29 + Math.sin(t * 0.8 + i) * 10) % SB.H);
        ctx.globalAlpha = 0.15 + Math.sin(t + i) * 0.1;
        ctx.fillRect(sx, sy, 2, 1);
      }
    } else if (w === 3) { // Ice: snowflakes
      ctx.fillStyle = '#fff';
      for (let i = 0; i < 25; i++) {
        const fx = ((i * 37 + Math.sin(t * 0.5 + i) * 30) % SB.W);
        const fy = ((i * 23 + t * 12) % SB.H);
        ctx.globalAlpha = 0.2 + Math.sin(t * 2 + i) * 0.15;
        ctx.beginPath(); ctx.arc(fx, fy, 1 + (i % 3), 0, Math.PI * 2); ctx.fill();
      }
    } else { // Castle: floating embers
      for (let i = 0; i < 15; i++) {
        const ex = ((i * 57 + Math.sin(t + i) * 20) % SB.W);
        const ey = SB.H - ((i * 33 + t * 20) % SB.H);
        ctx.globalAlpha = 0.3 + Math.sin(t * 3 + i) * 0.2;
        ctx.fillStyle = i % 3 === 0 ? '#e74c3c' : '#f39c12';
        ctx.beginPath(); ctx.arc(ex, ey, 1.5, 0, Math.PI * 2); ctx.fill();
      }
    }
    ctx.globalAlpha = 1;

    // ── Enhanced decorations per world ──
    if (w === 1) {
      for (let i = 0; i < 10; i++) {
        const tx = 20 + i * 85, ty = SB.H - 155 + (i % 3) * 15;
        const sway = Math.sin(t * 0.8 + i * 0.5) * 2;
        ctx.fillStyle = '#1a6a1a';
        ctx.beginPath(); ctx.moveTo(tx + sway, ty); ctx.lineTo(tx + 20 + sway, ty - 50 - (i % 2) * 15); ctx.lineTo(tx + 40 + sway, ty); ctx.fill();
        ctx.fillStyle = '#0f4f0f';
        ctx.beginPath(); ctx.moveTo(tx + 5 + sway, ty - 15); ctx.lineTo(tx + 20 + sway, ty - 40 - (i % 2) * 10); ctx.lineTo(tx + 35 + sway, ty - 15); ctx.fill();
        ctx.fillStyle = '#5d3a1a'; ctx.fillRect(tx + 16, ty, 8, 25);
      }
    } else if (w === 2) {
      // Big pyramid
      ctx.fillStyle = '#6a5a2a';
      ctx.beginPath(); ctx.moveTo(100, SB.H - 100); ctx.lineTo(180, SB.H - 220); ctx.lineTo(260, SB.H - 100); ctx.fill();
      ctx.fillStyle = '#8a7a3a';
      ctx.beginPath(); ctx.moveTo(180, SB.H - 220); ctx.lineTo(260, SB.H - 100); ctx.lineTo(180, SB.H - 100); ctx.fill();
      // Small pyramid
      ctx.fillStyle = '#5a4a2a';
      ctx.beginPath(); ctx.moveTo(500, SB.H - 100); ctx.lineTo(560, SB.H - 180); ctx.lineTo(620, SB.H - 100); ctx.fill();
      // Cacti
      for (let i = 0; i < 4; i++) {
        const cx = 320 + i * 140; ctx.fillStyle = '#2d8a2d';
        ctx.fillRect(cx, SB.H - 145, 5, 35);
        ctx.fillRect(cx - 7, SB.H - 135, 7, 4);
        ctx.fillRect(cx + 5, SB.H - 125, 7, 4);
      }
    } else if (w === 3) {
      for (let i = 0; i < 7; i++) {
        const mx = 10 + i * 120, mt = SB.H - 190 - (i % 2) * 35;
        ctx.fillStyle = '#3a5a6a';
        ctx.beginPath(); ctx.moveTo(mx, SB.H - 100); ctx.lineTo(mx + 45, mt); ctx.lineTo(mx + 90, SB.H - 100); ctx.fill();
        ctx.fillStyle = '#cde';
        ctx.beginPath(); ctx.moveTo(mx + 35, mt + 8); ctx.lineTo(mx + 45, mt); ctx.lineTo(mx + 55, mt + 8); ctx.fill();
      }
      // Frozen lake effect
      ctx.fillStyle = 'rgba(116,185,255,0.1)';
      ctx.fillRect(0, SB.H - 110, SB.W, 12);
    } else {
      for (let i = 0; i < 6; i++) {
        const tx = 40 + i * 140, th = 70 + (i % 3) * 35;
        ctx.fillStyle = '#2a1a4e';
        ctx.fillRect(tx, SB.H - 100 - th, 35, th);
        // Battlements
        for (let b = 0; b < 4; b++) {
          ctx.fillRect(tx - 3 + b * 10, SB.H - 100 - th - 6, 7, 6);
        }
        // Window glow
        ctx.fillStyle = '#f1c40f';
        ctx.globalAlpha = 0.5 + Math.sin(t * 2 + i) * 0.3;
        ctx.fillRect(tx + 13, SB.H - 100 - th + 18, 8, 10);
        ctx.globalAlpha = 1;
      }
    }

    // ── Ground with gradient ──
    const gCol = this.WORLD_GROUND_COLORS[w] || '#2d5a27';
    const gGrad = ctx.createLinearGradient(0, SB.H - 100, 0, SB.H);
    gGrad.addColorStop(0, gCol);
    gGrad.addColorStop(1, '#111');
    ctx.fillStyle = gGrad;
    ctx.fillRect(0, SB.H - 100, SB.W, 100);
    // Ground line highlight
    ctx.strokeStyle = 'rgba(255,255,255,0.15)';
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(0, SB.H - 100); ctx.lineTo(SB.W, SB.H - 100); ctx.stroke();

    // ── Glowing path ──
    const worldColor = this.WORLD_COLORS[w] || '#4aba4a';
    const levels = this.worldMapLevels;
    const nodeSpacing = Math.min(150, (SB.W - 100) / Math.max(levels.length - 1, 1));
    const pathStartX = (SB.W - (levels.length - 1) * nodeSpacing) / 2;

    // Path glow
    ctx.strokeStyle = worldColor + '30';
    ctx.lineWidth = 12;
    ctx.beginPath();
    ctx.moveTo(pathStartX, SB.H - 55);
    for (let i = 1; i < levels.length; i++) {
      const px = pathStartX + i * nodeSpacing;
      ctx.lineTo(px, SB.H - 55);
    }
    ctx.stroke();
    // Path dashes
    ctx.strokeStyle = worldColor + '80';
    ctx.lineWidth = 3;
    ctx.setLineDash([10, 6]);
    ctx.beginPath();
    ctx.moveTo(pathStartX, SB.H - 55);
    for (let i = 1; i < levels.length; i++) {
      ctx.lineTo(pathStartX + i * nodeSpacing, SB.H - 55);
    }
    ctx.stroke();
    ctx.setLineDash([]);

    // ── Title with glow ──
    ctx.save();
    ctx.shadowColor = worldColor;
    ctx.shadowBlur = 10;
    drawTextShadow(ctx, 'World ' + w + ' — ' + this.WORLD_NAMES[w], SB.W / 2, 42, worldColor, 'bold 22px monospace');
    ctx.restore();
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.font = '12px monospace'; ctx.textAlign = 'center';
    ctx.fillText(this.WORLD_NAMES_TH[w], SB.W / 2, 60);

    // ── Level nodes ──
    const mp = SB.Input.mousePos;
    for (let i = 0; i < levels.length; i++) {
      const nx = pathStartX + i * nodeSpacing;
      const ny = SB.H - 55;
      const unlocked = i < unlockCount;
      const selected = i === this.worldMapCursor;

      // Mouse hover on node
      const nodeHover = Math.hypot(mp.x - nx, mp.y - ny) < 25;
      if (nodeHover && this.worldMapCursor !== i) {
        this.worldMapCursor = i;
      }

      const bob = selected ? Math.sin(t * 3) * 5 : 0;

      // Selected glow ring
      if (selected && unlocked) {
        ctx.strokeStyle = worldColor + '60';
        ctx.lineWidth = 2;
        const pulseR = 28 + Math.sin(t * 4) * 3;
        ctx.beginPath(); ctx.arc(nx, ny + bob, pulseR, 0, Math.PI * 2); ctx.stroke();
      }

      // Node circle
      const r = selected ? 22 : 17;
      // Outer ring
      ctx.beginPath(); ctx.arc(nx, ny + bob, r + 3, 0, Math.PI * 2);
      ctx.fillStyle = unlocked ? worldColor + '30' : '#222';
      ctx.fill();
      // Main circle
      ctx.beginPath(); ctx.arc(nx, ny + bob, r, 0, Math.PI * 2);
      if (unlocked) {
        const nGrad = ctx.createRadialGradient(nx - 3, ny + bob - 3, 2, nx, ny + bob, r);
        nGrad.addColorStop(0, selected ? '#fff' : worldColor);
        nGrad.addColorStop(1, selected ? '#f1c40f' : worldColor + 'aa');
        ctx.fillStyle = nGrad;
      } else {
        ctx.fillStyle = '#333';
      }
      ctx.fill();
      ctx.strokeStyle = selected ? '#fff' : (unlocked ? worldColor : '#444');
      ctx.lineWidth = selected ? 2.5 : 1.5;
      ctx.stroke();

      // Level number
      ctx.fillStyle = unlocked ? '#fff' : '#666';
      ctx.font = 'bold 14px monospace'; ctx.textAlign = 'center';
      if (unlocked) {
        ctx.fillText(levels[i].num, nx, ny + 5 + bob);
      } else {
        ctx.font = '16px monospace';
        ctx.fillText('🔒', nx, ny + 5 + bob);
      }

      // Level name below
      ctx.font = '10px monospace';
      ctx.fillStyle = unlocked ? '#ccc' : '#555';
      ctx.fillText(levels[i].name, nx, ny + 38);

      // Stars below name
      if (unlocked) {
        const stars = SB.Save.data.stars[levels[i].id] || 0;
        for (let s = 0; s < 3; s++) {
          ctx.fillStyle = s < stars ? '#f1c40f' : '#444';
          ctx.font = '10px monospace';
          ctx.fillText('★', nx - 12 + s * 12, ny + 50);
        }
      }

      // Lock icon
      if (!unlocked) {
        ctx.fillStyle = '#888';
        ctx.font = '18px monospace';
        ctx.fillText('🔒', nx, ny + 5);
      }
    }

    // ── Slime character at selected node ──
    const selNx = pathStartX + this.worldMapCursor * nodeSpacing;
    const selBob = Math.sin(t * 3) * 5;
    const slY = SB.H - 85 + selBob;
    ctx.fillStyle = '#4aba4a';
    ctx.beginPath();
    ctx.ellipse(selNx, slY, 10, 8 + Math.sin(t * 5) * 1, 0, 0, Math.PI * 2);
    ctx.fill();
    // Slime eyes
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.arc(selNx - 4, slY - 2, 3, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(selNx + 4, slY - 2, 3, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#111';
    ctx.beginPath(); ctx.arc(selNx - 3, slY - 2, 1.5, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(selNx + 5, slY - 2, 1.5, 0, Math.PI * 2); ctx.fill();

    // ── Back button (with hover) ──
    const backHover = mp.x >= 15 && mp.x <= 95 && mp.y >= 15 && mp.y <= 47;
    ctx.fillStyle = backHover ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.1)';
    _roundRect(ctx, 15, 15, 80, 32, 10);
    ctx.fill();
    ctx.strokeStyle = backHover ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.25)'; ctx.lineWidth = 1;
    _roundRect(ctx, 15, 15, 80, 32, 10); ctx.stroke();
    ctx.fillStyle = backHover ? '#fff' : '#ccc'; ctx.font = 'bold 13px monospace'; ctx.textAlign = 'center';
    ctx.fillText('◀ กลับ', 55, 36);

    // ── Coin display top-right (pill style) ──
    if (SB.Save.data) {
      const coinX = SB.W - 75, coinY = 22;
      _roundRect(ctx, coinX - 30, coinY - 12, 95, 24, 12);
      ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.fill();
      ctx.fillStyle = '#f1c40f';
      ctx.beginPath(); ctx.arc(coinX - 15, coinY, 8, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#d4a017'; ctx.font = 'bold 9px monospace'; ctx.textAlign = 'center';
      ctx.fillText('$', coinX - 15, coinY + 3);
      ctx.fillStyle = '#fff'; ctx.font = 'bold 14px monospace'; ctx.textAlign = 'left';
      ctx.fillText((SB.Save.data.coins || 0), coinX - 2, coinY + 5);
    }

    // ── Instructions ──
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    ctx.font = '11px monospace'; ctx.textAlign = 'center';
    ctx.fillText('← → เลือกด่าน    ENTER/คลิก เข้าเล่น    ESC กลับ', SB.W / 2, SB.H - 8);
  },

  // ═══ PAUSE MENU ═══
  initPause() {
    SB.prevState = SB.gameState;
    SB.gameState = 'PAUSED';
    this.menuOptions = ['ต่อเล่น', 'เริ่มใหม่', 'ตั้งค่า', 'ออกจากด่าน'];
    this.menuIndex = 0;
    SB.Audio.sfx('pause');
  },

  handlePauseInput() {
    if (transition.active) return;
    if (this.settingsMode) { this.handleSettingsInput(); return; }
    if (SB.Input.upPressed) {
      this.menuIndex = (this.menuIndex - 1 + this.menuOptions.length) % this.menuOptions.length;
      SB.Audio.sfx('menuSelect');
    }
    if (SB.Input.downPressed) {
      this.menuIndex = (this.menuIndex + 1) % this.menuOptions.length;
      SB.Audio.sfx('menuSelect');
    }
    if (SB.Input.pausePressed) {
      SB.gameState = SB.prevState || 'PLAYING';
    }
    // Mouse click on menu
    const clicked = this._checkMenuClick(200, this.menuOptions.length);
    if (clicked >= 0) { this.menuIndex = clicked; }
    if (SB.Input.enterPressed || SB.Input.jumpPressed || clicked >= 0) {
      SB.Audio.sfx('menuConfirm');
      switch (this.menuIndex) {
        case 0: SB.gameState = SB.prevState || 'PLAYING'; break;
        case 1: startTransition('fade', () => SB.startLevel(SB.Level.currentId)); break;
        case 2: this.settingsMode = true; this.settingIndex = 0; break;
        case 3: startTransition('fade', () => this.initWorldMap()); break;
      }
    }
  },

  drawPause(ctx) {
    drawMenuBg(ctx, 0.75);
    drawTextShadow(ctx, 'PAUSED', SB.W / 2, 140, '#f1c40f', 'bold 32px monospace');

    const my = 200;
    for (let i = 0; i < this.menuOptions.length; i++) {
      drawMenuOption(ctx, this.menuOptions[i], SB.W / 2, my + i * 35, i === this.menuIndex);
    }

    if (this.settingsMode) this.drawSettings(ctx);
  },

  // ═══ LEVEL COMPLETE ═══
  initLevelComplete(time, coins, enemiesDefeated) {
    SB.gameState = 'LEVEL_COMPLETE';
    this.menuOptions = ['ต่อไป', 'เล่นซ้ำ', 'แผนที่'];
    this.menuIndex = 0;
    this.lcTime = time || 0;
    this.lcCoins = coins || 0;
    this.lcEnemies = enemiesDefeated || 0;

    // Calculate stars
    let stars = 1; // Completed = 1 star
    if (this.lcTime < (SB.Level.info ? SB.Level.info.timeLimit * 0.5 : 60)) stars++;
    if (this.lcCoins >= 20) stars++;

    this.lcStars = stars;

    // Save progress
    const lvlId = SB.Level.currentId;
    const saved = SB.Save.data.stars[lvlId] || 0;
    if (stars > saved) SB.Save.data.stars[lvlId] = stars;
    if (SB.Level.info) {
      const w = SB.Level.info.world;
      const nextNum = SB.Level.info.num + 1;
      // Update per-world unlock
      if (!SB.Save.data.unlockedLevels) SB.Save.data.unlockedLevels = { 1:1, 2:0, 3:0, 4:0 };
      if (nextNum > (SB.Save.data.unlockedLevels[w] || 0)) {
        SB.Save.data.unlockedLevels[w] = nextNum;
      }
      // Legacy field
      if (w === SB.Save.data.currentWorld && nextNum > SB.Save.data.unlockedLevel) {
        SB.Save.data.unlockedLevel = nextNum;
      }
      // Unlock next world if all 5 levels completed
      if (SB.Save.data.unlockedLevels[w] >= 6 && w < 4) {
        if ((SB.Save.data.unlockedLevels[w + 1] || 0) < 1) {
          SB.Save.data.unlockedLevels[w + 1] = 1;
        }
        if (w + 1 > (SB.Save.data.unlockedWorld || 1)) {
          SB.Save.data.unlockedWorld = w + 1;
        }
      }
    }
    // Persist coins to save
    SB.Save.data.coins = (SB.Save.data.coins || 0) + (coins || 0);
    SB.Save.save();
    SB.Audio.sfx('levelComplete');
  },

  handleLevelCompleteInput() {
    if (transition.active) return;
    if (SB.Input.upPressed) {
      this.menuIndex = (this.menuIndex - 1 + this.menuOptions.length) % this.menuOptions.length;
      SB.Audio.sfx('menuSelect');
    }
    if (SB.Input.downPressed) {
      this.menuIndex = (this.menuIndex + 1) % this.menuOptions.length;
      SB.Audio.sfx('menuSelect');
    }
    // Mouse click on menu
    const clicked = this._checkMenuClick(290, this.menuOptions.length);
    if (clicked >= 0) { this.menuIndex = clicked; }
    if (SB.Input.enterPressed || SB.Input.jumpPressed || clicked >= 0) {
      SB.Audio.sfx('menuConfirm');
      switch (this.menuIndex) {
        case 0: { // Next level
          const info = SB.Level.info;
          if (info) {
            const nextId = info.world + '-' + (info.num + 1);
            // Check if next level exists
            if (SB.Level.getWorldLevels(info.world).find(l => l.id === nextId)) {
              startTransition('iris', () => SB.startLevel(nextId));
            } else {
              startTransition('fade', () => this.initWorldMap());
            }
          }
          break;
        }
        case 1: startTransition('iris', () => SB.startLevel(SB.Level.currentId)); break;
        case 2: startTransition('fade', () => this.initWorldMap()); break;
      }
    }
  },

  drawLevelComplete(ctx) {
    drawMenuBg(ctx, 0.8);
    drawTextShadow(ctx, 'LEVEL COMPLETE!', SB.W / 2, 80, '#4aba4a', 'bold 28px monospace');

    // Stars
    for (let i = 0; i < 3; i++) {
      ctx.font = '36px monospace';
      ctx.textAlign = 'center';
      const starBob = Math.sin(this.animTime * 2 + i * 0.5) * 3;
      ctx.fillStyle = i < this.lcStars ? '#f1c40f' : '#555';
      ctx.fillText('★', SB.W / 2 - 50 + i * 50, 130 + starBob);
    }

    // Stats
    ctx.font = '16px monospace';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#bdc3c7';
    const t = Math.floor(this.lcTime);
    ctx.fillText('เวลา: ' + Math.floor(t / 60) + ':' + (t % 60).toString().padStart(2, '0'), SB.W / 2, 180);
    ctx.fillText('เหรียญ: ' + this.lcCoins, SB.W / 2, 210);
    ctx.fillText('คะแนน: ' + SB.Player.score, SB.W / 2, 240);

    // Menu
    const my = 290;
    for (let i = 0; i < this.menuOptions.length; i++) {
      drawMenuOption(ctx, this.menuOptions[i], SB.W / 2, my + i * 35, i === this.menuIndex);
    }
  },

  // ═══ GAME OVER ═══
  initGameOver() {
    SB.gameState = 'GAME_OVER';
    this.menuOptions = ['ลองอีกครั้ง', 'แผนที่โลก', 'หน้าหลัก'];
    this.menuIndex = 0;
    SB.Audio.sfx('gameOver');
    SB.Audio.stopBGM();
  },

  handleGameOverInput() {
    if (transition.active) return;
    if (SB.Input.upPressed) {
      this.menuIndex = (this.menuIndex - 1 + this.menuOptions.length) % this.menuOptions.length;
      SB.Audio.sfx('menuSelect');
    }
    if (SB.Input.downPressed) {
      this.menuIndex = (this.menuIndex + 1) % this.menuOptions.length;
      SB.Audio.sfx('menuSelect');
    }
    // Mouse click on menu
    const clicked = this._checkMenuClick(280, this.menuOptions.length);
    if (clicked >= 0) { this.menuIndex = clicked; }
    if (SB.Input.enterPressed || SB.Input.jumpPressed || clicked >= 0) {
      SB.Audio.sfx('menuConfirm');
      switch (this.menuIndex) {
        case 0: startTransition('fade', () => SB.startLevel(SB.Level.currentId)); break;
        case 1: startTransition('fade', () => this.initWorldMap()); break;
        case 2: startTransition('fade', () => this.initTitle()); break;
      }
    }
  },

  drawGameOver(ctx) {
    drawMenuBg(ctx, 0.85);

    // Animated text
    const shake = Math.sin(this.animTime * 10) * 2;
    drawTextShadow(ctx, 'GAME OVER', SB.W / 2 + shake, 150, '#e74c3c', 'bold 40px monospace');

    ctx.font = '16px monospace';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#bdc3c7';
    ctx.fillText('คะแนน: ' + SB.Player.score, SB.W / 2, 200);
    ctx.fillText('เหรียญ: ' + SB.Player.coins, SB.W / 2, 225);

    const my = 280;
    for (let i = 0; i < this.menuOptions.length; i++) {
      drawMenuOption(ctx, this.menuOptions[i], SB.W / 2, my + i * 35, i === this.menuIndex);
    }
  },

  // ═══ SHOP ═══
  shopMode: false,
  shopIndex: 0,

  SHOP_ITEMS: [
    { id: 'speed',   name: 'โพชั่นเร็ว',   icon: '⚡', desc: 'เร็ว×1.5 10วิ', cost: 50,  color: '#f1c40f' },
    { id: 'heart',   name: 'หัวใจ',        icon: '❤️', desc: '+1 HP',        cost: 30,  color: '#e74c3c' },
    { id: 'shield',  name: 'โล่ป้องกัน',   icon: '🛡️', desc: 'กันดาเมจ 15วิ', cost: 80,  color: '#3498db' },
    { id: 'magnet',  name: 'แม่เหล็ก',     icon: '🧲', desc: 'ดูดเหรียญ 15วิ', cost: 60,  color: '#95a5a6' },
    { id: 'sword',   name: 'ดาบวิเศษ',     icon: '⚔️', desc: 'โจมตีอัตโนมัติ 20วิ', cost: 120, color: '#e67e22' },
  ],

  handleShopInput() {
    const inp = SB.Input;
    const items = this.SHOP_ITEMS;
    if (inp.upPressed) { this.shopIndex = (this.shopIndex - 1 + items.length) % items.length; SB.Audio.sfx('menuSelect'); }
    if (inp.downPressed) { this.shopIndex = (this.shopIndex + 1) % items.length; SB.Audio.sfx('menuSelect'); }

    // Close button click
    if (inp.mouse.clicked && this._shopCloseBtn) {
      const b = this._shopCloseBtn;
      if (inp.mouse.x >= b.x && inp.mouse.x <= b.x + b.w &&
          inp.mouse.y >= b.y && inp.mouse.y <= b.y + b.h) {
        this.shopMode = false;
        SB.Audio.sfx('menuSelect');
        return;
      }
    }

    // Mouse click on shop items handled in drawShop via hover+click

    if (inp.enterPressed || inp.jumpPressed) {
      this._buyShopItem(this.shopIndex);
    }
    if (inp.pausePressed) { this.shopMode = false; }
  },

  _buyShopItem(index) {
    const item = this.SHOP_ITEMS[index];
    if (!item) return;
    const coins = SB.Save.data.coins || 0;
    if (coins < item.cost) {
      SB.Audio.sfx('hurt');
      return;
    }
    SB.Save.data.coins -= item.cost;
    if (!SB.Save.data.shopInventory) SB.Save.data.shopInventory = {};
    SB.Save.data.shopInventory[item.id] = (SB.Save.data.shopInventory[item.id] || 0) + 1;
    SB.Save.save();
    SB.Audio.sfx('powerup');
  },

  drawShop(ctx) {
    const panelW = 380, panelH = 380;
    const px = (SB.W - panelW) / 2, py = (SB.H - panelH) / 2 - 10;
    const items = this.SHOP_ITEMS;
    const t = this.animTime;

    // ── Theme colors based on current background ──
    const world = (SB.Save.data && SB.Save.data.currentWorld) || 1;
    const themes = {
      1: { bg1: 'rgba(10,40,10,0.95)', bg2: 'rgba(5,25,5,0.95)', border: '#4aba4a', accent: '#7bed9e', glow: '#2ecc71' },
      2: { bg1: 'rgba(50,35,10,0.95)', bg2: 'rgba(30,20,5,0.95)', border: '#d4a017', accent: '#f1c40f', glow: '#e6b800' },
      3: { bg1: 'rgba(10,25,45,0.95)', bg2: 'rgba(5,15,30,0.95)', border: '#74b9ff', accent: '#a0d8ef', glow: '#3498db' },
      4: { bg1: 'rgba(25,10,40,0.95)', bg2: 'rgba(15,5,25,0.95)', border: '#9b59b6', accent: '#c39bd3', glow: '#8e44ad' }
    };
    const theme = themes[world] || themes[1];

    // ── Dimmed backdrop ──
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(0, 0, SB.W, SB.H);

    // ── Panel background with themed gradient ──
    ctx.save();
    _roundRect(ctx, px, py, panelW, panelH, 16);
    const panelGrad = ctx.createLinearGradient(px, py, px, py + panelH);
    panelGrad.addColorStop(0, theme.bg1);
    panelGrad.addColorStop(1, theme.bg2);
    ctx.fillStyle = panelGrad;
    ctx.fill();
    // Themed border
    _roundRect(ctx, px, py, panelW, panelH, 16);
    ctx.strokeStyle = theme.border;
    ctx.lineWidth = 2;
    ctx.stroke();
    // Inner glow line
    _roundRect(ctx, px + 3, py + 3, panelW - 6, panelH - 6, 13);
    ctx.strokeStyle = theme.glow + '30';
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.restore();

    // ── Close (X) button ──
    const xBtnX = px + panelW - 32, xBtnY = py + 8, xBtnS = 24;
    const xCx = xBtnX + xBtnS / 2, xCy = xBtnY + xBtnS / 2;
    // Check hover
    const mp = SB.Input.mousePos;
    const xHover = mp.x >= xBtnX && mp.x <= xBtnX + xBtnS && mp.y >= xBtnY && mp.y <= xBtnY + xBtnS;
    ctx.fillStyle = xHover ? 'rgba(231,76,60,1)' : 'rgba(231,76,60,0.8)';
    ctx.beginPath(); ctx.arc(xCx, xCy, xBtnS / 2, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#c0392b'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.arc(xCx, xCy, xBtnS / 2, 0, Math.PI * 2); ctx.stroke();
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 2;
    const cr = 5;
    ctx.beginPath(); ctx.moveTo(xCx - cr, xCy - cr); ctx.lineTo(xCx + cr, xCy + cr); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(xCx + cr, xCy - cr); ctx.lineTo(xCx - cr, xCy + cr); ctx.stroke();
    this._shopCloseBtn = { x: xBtnX, y: xBtnY, w: xBtnS, h: xBtnS };

    // ── Title ──
    ctx.save();
    ctx.shadowColor = '#f1c40f';
    ctx.shadowBlur = 12;
    ctx.font = 'bold 22px monospace'; ctx.textAlign = 'center';
    ctx.fillStyle = '#f1c40f';
    ctx.fillText('🛒 ร้านค้า', SB.W / 2, py + 35);
    ctx.restore();

    // ── Coins display ──
    const coinPillX = px + panelW - 90, coinPillY = py + 42;
    _roundRect(ctx, coinPillX, coinPillY, 72, 20, 10);
    ctx.fillStyle = 'rgba(241,196,15,0.15)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(241,196,15,0.4)';
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.fillStyle = '#f1c40f';
    ctx.beginPath(); ctx.arc(coinPillX + 14, coinPillY + 10, 6, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#d4a017'; ctx.font = 'bold 7px monospace'; ctx.textAlign = 'center';
    ctx.fillText('$', coinPillX + 14, coinPillY + 12);
    ctx.fillStyle = '#fff'; ctx.font = 'bold 12px monospace'; ctx.textAlign = 'left';
    ctx.fillText('' + (SB.Save.data.coins || 0), coinPillX + 24, coinPillY + 14);

    // ── Item cards ──
    const startY = py + 72;
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const iy = startY + i * 54;
      const sel = i === this.shopIndex;
      const owned = (SB.Save.data.shopInventory && SB.Save.data.shopInventory[item.id]) || 0;
      const canAfford = (SB.Save.data.coins || 0) >= item.cost;

      // Check mouse hover on item
      const itemHover = mp.x >= px + 10 && mp.x <= px + panelW - 10 && mp.y >= iy - 8 && mp.y <= iy + 40;
      if (itemHover && SB.Input.mouse.clicked) {
        this.shopIndex = i;
        this._buyShopItem(i);
      } else if (itemHover && this.shopIndex !== i) {
        this.shopIndex = i;
      }

      const active = sel || itemHover;

      // Card background
      _roundRect(ctx, px + 10, iy - 8, panelW - 20, 48, 8);
      if (active) {
        ctx.fillStyle = 'rgba(241,196,15,0.12)';
        ctx.fill();
        ctx.strokeStyle = 'rgba(241,196,15,0.4)';
        ctx.lineWidth = 1;
        ctx.stroke();
      } else {
        ctx.fillStyle = 'rgba(255,255,255,0.03)';
        ctx.fill();
      }

      // Icon with circle bg — bright and visible
      const iconCx = px + 35, iconCy = iy + 14;
      ctx.fillStyle = item.color + '44';
      ctx.beginPath(); ctx.arc(iconCx, iconCy, 16, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = item.color + '88'; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.arc(iconCx, iconCy, 16, 0, Math.PI * 2); ctx.stroke();
      ctx.font = '22px sans-serif'; ctx.textAlign = 'center';
      ctx.fillStyle = '#fff';
      ctx.fillText(item.icon, iconCx, iconCy + 8);

      // Name + desc
      ctx.textAlign = 'left';
      ctx.font = active ? 'bold 13px monospace' : '13px monospace';
      ctx.fillStyle = active ? '#f1c40f' : '#ccc';
      ctx.fillText(item.name, px + 58, iy + 10);
      ctx.font = '10px monospace'; ctx.fillStyle = '#777';
      ctx.fillText(item.desc, px + 58, iy + 24);

      // Cost
      ctx.textAlign = 'right';
      ctx.font = 'bold 13px monospace';
      ctx.fillStyle = canAfford ? '#f1c40f' : '#e74c3c';
      ctx.fillText(item.cost + ' 🪙', px + panelW - 18, iy + 10);

      // Owned count
      if (owned > 0) {
        _roundRect(ctx, px + panelW - 52, iy + 16, 32, 16, 8);
        ctx.fillStyle = 'rgba(46,204,113,0.2)'; ctx.fill();
        ctx.fillStyle = '#2ecc71'; ctx.font = 'bold 10px monospace'; ctx.textAlign = 'center';
        ctx.fillText('×' + owned, px + panelW - 36, iy + 28);
      }
      ctx.textAlign = 'left';
    }

    // ── Bottom instructions ──
    _roundRect(ctx, px + 20, py + panelH - 28, panelW - 40, 20, 6);
    ctx.fillStyle = 'rgba(255,255,255,0.05)'; ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.font = '10px monospace'; ctx.textAlign = 'center';
    ctx.fillText('↑↓ เลือก  ENTER/คลิก ซื้อ  ESC/X ปิด', SB.W / 2, py + panelH - 14);
  },

  // ═══ SETTINGS ═══
  settingIndex: 0,
  settingConfirmReset: false,

  handleSettingsInput() {
    const inp = SB.Input;
    const s = SB.Save.data.settings;

    // Reset confirm mode
    if (this.settingConfirmReset) {
      if (inp.enterPressed || inp.jumpPressed) {
        SB.Save.reset();
        SB.Player.fullReset();
        SB.Audio.setBGMVolume(SB.Save.data.settings.bgmVol);
        SB.Audio.setSFXVolume(SB.Save.data.settings.sfxVol);
        SB.Audio.sfx('menuConfirm');
        this.settingConfirmReset = false;
        this.settingsMode = false;
        startTransition('fade', () => this.initTitle());
        return;
      }
      if (inp.pausePressed) { this.settingConfirmReset = false; SB.Audio.sfx('menuSelect'); return; }
      return;
    }

    // Navigate
    if (inp.upPressed) { this.settingIndex = (this.settingIndex - 1 + 8) % 8; SB.Audio.sfx('menuSelect'); }
    if (inp.downPressed) { this.settingIndex = (this.settingIndex + 1) % 8; SB.Audio.sfx('menuSelect'); }

    // Mouse click on settings items
    if (inp.mouse.clicked) {
      const panelW = 360, panelH = 420;
      const px = (SB.W - panelW) / 2, py = (SB.H - panelH) / 2 - 10;
      const startY = py + 65;
      const mx = inp.mouse.x, my = inp.mouse.y;
      // Close X button check
      if (this._settingsCloseBtn) {
        const b = this._settingsCloseBtn;
        if (mx >= b.x && mx <= b.x + b.w && my >= b.y && my <= b.y + b.h) {
          this.settingsMode = false; this.settingIndex = 0; SB.Audio.sfx('menuSelect'); return;
        }
      }
      for (let i = 0; i < 8; i++) {
        const iy = startY + i * 40;
        if (my > iy - 12 && my < iy + 22 && mx > px + 8 && mx < px + panelW - 8) {
          this.settingIndex = i;
          SB.Audio.sfx('menuSelect');
          // Handle click for volume bars
          if (i === 0 || i === 1) {
            const bx = px + panelW - 130, bw = 90;
            if (mx >= bx && mx <= bx + bw) {
              const ratio = Math.round(((mx - bx) / bw) * 10) / 10;
              if (i === 0) { s.bgmVol = ratio; SB.Audio.setBGMVolume(s.bgmVol); }
              else { s.sfxVol = ratio; SB.Audio.setSFXVolume(s.sfxVol); }
              SB.Save.save();
            }
          }
          else if (i === 2) { s.particles = !s.particles; SB.Save.save(); }
          else if (i === 3) { s.screenShake = s.screenShake === false ? true : false; SB.Save.save(); }
          else if (i === 4) { // Resolution cycle
            const resOpts = [0.5, 1, 1.5, 2];
            const ci = resOpts.indexOf(s.resolution || 1);
            s.resolution = resOpts[(ci + 1) % resOpts.length];
            SB.Renderer.applyResolution();
            SB.Save.save();
          }
          else if (i === 5) { // FPS cycle
            const fpsOpts = [30, 60, 120, 200];
            const ci = fpsOpts.indexOf(s.fpsCap || 60);
            s.fpsCap = fpsOpts[(ci + 1) % fpsOpts.length];
            SB.Save.save();
          }
          else if (i === 6) { s.shadows = !s.shadows; SB.Save.save(); }
          else if (i === 7) { this.settingConfirmReset = true; }
          break;
        }
      }
    }

    // Adjust values
    const step = 0.1;
    if (this.settingIndex === 0) { // BGM Volume
      if (inp.leftPressed) { s.bgmVol = Math.max(0, Math.round((s.bgmVol - step) * 10) / 10); SB.Audio.setBGMVolume(s.bgmVol); SB.Save.save(); }
      if (inp.rightPressed) { s.bgmVol = Math.min(1, Math.round((s.bgmVol + step) * 10) / 10); SB.Audio.setBGMVolume(s.bgmVol); SB.Save.save(); }
    } else if (this.settingIndex === 1) { // SFX Volume
      if (inp.leftPressed) { s.sfxVol = Math.max(0, Math.round((s.sfxVol - step) * 10) / 10); SB.Audio.setSFXVolume(s.sfxVol); SB.Save.save(); }
      if (inp.rightPressed) { s.sfxVol = Math.min(1, Math.round((s.sfxVol + step) * 10) / 10); SB.Audio.setSFXVolume(s.sfxVol); SB.Save.save(); SB.Audio.sfx('coin'); }
    } else if (this.settingIndex === 2) { // Particles toggle
      if (inp.enterPressed || inp.jumpPressed || inp.leftPressed || inp.rightPressed) { s.particles = !s.particles; SB.Save.save(); SB.Audio.sfx('menuSelect'); }
    } else if (this.settingIndex === 3) { // Screen shake toggle
      if (inp.enterPressed || inp.jumpPressed || inp.leftPressed || inp.rightPressed) { s.screenShake = s.screenShake === false ? true : false; SB.Save.save(); SB.Audio.sfx('menuSelect'); }
    } else if (this.settingIndex === 4) { // Resolution
      const resOpts = [0.5, 1, 1.5, 2];
      if (inp.leftPressed || inp.rightPressed) {
        const ci = resOpts.indexOf(s.resolution || 1);
        s.resolution = resOpts[(ci + (inp.rightPressed ? 1 : resOpts.length - 1)) % resOpts.length];
        SB.Renderer.applyResolution();
        SB.Save.save(); SB.Audio.sfx('menuSelect');
      }
    } else if (this.settingIndex === 5) { // FPS
      const fpsOpts = [30, 60, 120, 200];
      if (inp.leftPressed || inp.rightPressed) {
        const ci = fpsOpts.indexOf(s.fpsCap || 60);
        s.fpsCap = fpsOpts[(ci + (inp.rightPressed ? 1 : fpsOpts.length - 1)) % fpsOpts.length];
        SB.Save.save(); SB.Audio.sfx('menuSelect');
      }
    } else if (this.settingIndex === 6) { // Shadows
      if (inp.enterPressed || inp.jumpPressed || inp.leftPressed || inp.rightPressed) { s.shadows = !s.shadows; SB.Save.save(); SB.Audio.sfx('menuSelect'); }
    } else if (this.settingIndex === 7) { // Reset game
      if (inp.enterPressed || inp.jumpPressed) { this.settingConfirmReset = true; SB.Audio.sfx('menuSelect'); }
    }

    if (inp.pausePressed) { this.settingsMode = false; this.settingIndex = 0; }
  },

  drawSettings(ctx) {
    const panelW = 380, panelH = 430;
    const px = (SB.W - panelW) / 2, py = (SB.H - panelH) / 2 - 10;
    const s = SB.Save.data.settings;
    const t = this.animTime;
    const mp = SB.Input.mousePos;

    // ── Dimmed backdrop ──
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(0, 0, SB.W, SB.H);

    // ── Panel background with gradient ──
    ctx.save();
    _roundRect(ctx, px, py, panelW, panelH, 16);
    const panelGrad = ctx.createLinearGradient(px, py, px, py + panelH);
    panelGrad.addColorStop(0, 'rgba(25,20,50,0.97)');
    panelGrad.addColorStop(1, 'rgba(15,12,35,0.97)');
    ctx.fillStyle = panelGrad;
    ctx.fill();
    // Border
    _roundRect(ctx, px, py, panelW, panelH, 16);
    ctx.strokeStyle = '#6c7adb';
    ctx.lineWidth = 2;
    ctx.stroke();
    // Inner glow
    _roundRect(ctx, px + 3, py + 3, panelW - 6, panelH - 6, 13);
    ctx.strokeStyle = 'rgba(108,122,219,0.15)';
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.restore();

    // ── Title with glow ──
    ctx.save();
    ctx.shadowColor = '#6c7adb';
    ctx.shadowBlur = 12;
    ctx.font = 'bold 22px monospace'; ctx.textAlign = 'center';
    ctx.fillStyle = '#a8b4ff';
    ctx.fillText('⚙ ตั้งค่า', SB.W / 2, py + 38);
    ctx.restore();

    // ── Close X button ──
    const xBtnX = px + panelW - 32, xBtnY = py + 8, xBtnS = 24;
    const xCx = xBtnX + xBtnS / 2, xCy = xBtnY + xBtnS / 2;
    const xHover = mp.x >= xBtnX && mp.x <= xBtnX + xBtnS && mp.y >= xBtnY && mp.y <= xBtnY + xBtnS;
    ctx.fillStyle = xHover ? 'rgba(231,76,60,1)' : 'rgba(231,76,60,0.8)';
    ctx.beginPath(); ctx.arc(xCx, xCy, xBtnS / 2, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#c0392b'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.arc(xCx, xCy, xBtnS / 2, 0, Math.PI * 2); ctx.stroke();
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 2;
    const cr = 5;
    ctx.beginPath(); ctx.moveTo(xCx - cr, xCy - cr); ctx.lineTo(xCx + cr, xCy + cr); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(xCx + cr, xCy - cr); ctx.lineTo(xCx - cr, xCy + cr); ctx.stroke();
    this._settingsCloseBtn = { x: xBtnX, y: xBtnY, w: xBtnS, h: xBtnS };

    const resLabels = { 0.5: '0.5×', 1: '1×', 1.5: '1.5×', 2: '2×' };
    const items = [
      { label: 'เพลง (BGM)', value: s.bgmVol === 0 ? 'ปิด' : Math.round(s.bgmVol * 100) + '%', bar: s.bgmVol },
      { label: 'เสียง (SFX)', value: s.sfxVol === 0 ? 'ปิด' : Math.round(s.sfxVol * 100) + '%', bar: s.sfxVol },
      { label: 'Particles', value: s.particles ? 'เปิด' : 'ปิด' },
      { label: 'สั่นหน้าจอ', value: s.screenShake !== false ? 'เปิด' : 'ปิด' },
      { label: 'ความละเอียด', value: resLabels[s.resolution || 1] || '1×' },
      { label: 'FPS', value: (s.fpsCap || 60) + ' fps' },
      { label: 'เงา', value: s.shadows ? 'เปิด' : 'ปิด' },
      { label: '⚠ รีเซ็ตเกมทั้งหมด', value: '' }
    ];

    const startY = py + 62;
    for (let i = 0; i < items.length; i++) {
      const iy = startY + i * 42;
      const sel = i === this.settingIndex;

      // Mouse hover on setting row
      const rowHover = mp.x >= px + 8 && mp.x <= px + panelW - 8 && mp.y >= iy - 12 && mp.y <= iy + 26;
      if (rowHover && !SB.Input.mouse.clicked) {
        if (this.settingIndex !== i) this.settingIndex = i;
      }

      const active = sel || rowHover;

      // Row background
      _roundRect(ctx, px + 8, iy - 10, panelW - 16, 36, 6);
      if (active) {
        ctx.fillStyle = i === 7 ? 'rgba(231,76,60,0.1)' : 'rgba(108,122,219,0.1)';
        ctx.fill();
        ctx.strokeStyle = i === 7 ? 'rgba(231,76,60,0.3)' : 'rgba(108,122,219,0.25)';
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      ctx.font = active ? 'bold 13px monospace' : '13px monospace';
      ctx.textAlign = 'left';
      ctx.fillStyle = i === 7 ? (active ? '#e74c3c' : '#c0392b') : (active ? '#a8b4ff' : '#999');
      ctx.fillText((active ? '▸ ' : '  ') + items[i].label, px + 16, iy + 5);

      if (items[i].bar !== undefined) {
        const bx = px + panelW - 140, bw = 100, bh = 12;
        // Bar track
        _roundRect(ctx, bx, iy - 4, bw, bh, 4);
        ctx.fillStyle = '#222'; ctx.fill();
        // Bar fill
        _roundRect(ctx, bx, iy - 4, bw * items[i].bar, bh, 4);
        ctx.fillStyle = active ? '#6c7adb' : '#4a5a8a'; ctx.fill();
        // Bar border
        _roundRect(ctx, bx, iy - 4, bw, bh, 4);
        ctx.strokeStyle = active ? '#8a9aff' : '#444'; ctx.lineWidth = 1; ctx.stroke();
        // Value text
        ctx.fillStyle = '#ccc'; ctx.font = '10px monospace'; ctx.textAlign = 'center';
        ctx.fillText(items[i].value, bx + bw / 2, iy + 18);
        // Arrows
        if (active) {
          ctx.fillStyle = '#a8b4ff'; ctx.font = 'bold 14px monospace';
          ctx.textAlign = 'left'; ctx.fillText('◀', bx - 18, iy + 6);
          ctx.textAlign = 'right'; ctx.fillText('▶', bx + bw + 18, iy + 6);
        }
      } else if (items[i].value) {
        ctx.textAlign = 'right';
        const valColor = items[i].value === 'เปิด' ? '#5dff8f' : (items[i].value === 'ปิด' ? '#e74c3c' : '#ddd');
        ctx.fillStyle = valColor;
        ctx.font = 'bold 12px monospace';
        ctx.fillText(items[i].value, px + panelW - 18, iy + 5);
        if (active && i >= 4 && i <= 6) {
          ctx.fillStyle = '#a8b4ff'; ctx.font = 'bold 14px monospace';
          ctx.textAlign = 'right'; ctx.fillText('◀ ', px + panelW - (items[i].value.length * 8 + 24), iy + 5);
          ctx.fillText(' ▶', px + panelW - 10, iy + 5);
        }
      }
    }

    // ── Reset confirmation ──
    if (this.settingConfirmReset) {
      ctx.fillStyle = 'rgba(0,0,0,0.85)';
      _roundRect(ctx, px + 20, py + panelH - 80, panelW - 40, 65, 10);
      ctx.fill();
      ctx.strokeStyle = '#e74c3c'; ctx.lineWidth = 2;
      _roundRect(ctx, px + 20, py + panelH - 80, panelW - 40, 65, 10);
      ctx.stroke();
      ctx.fillStyle = '#e74c3c'; ctx.font = 'bold 13px monospace'; ctx.textAlign = 'center';
      ctx.fillText('ลบข้อมูลทั้งหมด?', SB.W / 2, py + panelH - 55);
      ctx.fillStyle = '#bdc3c7'; ctx.font = '12px monospace';
      ctx.fillText('ENTER = ยืนยัน  |  ESC = ยกเลิก', SB.W / 2, py + panelH - 33);
    }

    // ── Bottom instructions ──
    _roundRect(ctx, px + 20, py + panelH - 28, panelW - 40, 20, 6);
    ctx.fillStyle = 'rgba(255,255,255,0.05)'; ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.3)'; ctx.font = '10px monospace'; ctx.textAlign = 'center';
    ctx.fillText('↑↓ เลือก  ←→/คลิก ปรับ  ESC/X ปิด', SB.W / 2, py + panelH - 14);
  },

  // ═══ TRANSITIONS ═══
  drawTransition(ctx) {
    if (!transition.active) return;
    const p = SB.Utils.clamp(transition.progress, 0, 1);
    const alpha = transition.phase === 'out' ? p : 1 - p;

    if (transition.type === 'iris') {
      const maxR = Math.sqrt(SB.W * SB.W + SB.H * SB.H) / 2;
      const radius = transition.phase === 'out' ? maxR * (1 - p) : maxR * p;
      ctx.save();
      ctx.fillStyle = '#000';
      ctx.beginPath();
      ctx.rect(0, 0, SB.W, SB.H);
      ctx.arc(SB.W / 2, SB.H / 2, Math.max(0, radius), 0, Math.PI * 2, true);
      ctx.fill('evenodd');
      ctx.restore();
    } else {
      ctx.fillStyle = 'rgba(0,0,0,' + alpha + ')';
      ctx.fillRect(0, 0, SB.W, SB.H);
    }
  },

  isTransitioning() {
    return transition.active;
  }
};

// ── Glim title eye animation state ──
const _glimEye = {
  lookX: 0, lookY: 0,
  targetX: 0, targetY: 0,
  nextLookTime: 2,
  blinkTimer: 3 + Math.random() * 4,
  blinkPhase: 0, // 0=open, >0 closing/closed
};

// ── Draw Glim (title screen character) ──
function drawGlimTitle(ctx, x, y, time) {
  const dt = 1 / 60; // approximate frame dt
  const bounce = Math.abs(Math.sin(time * 2.5)) * 8;
  const squishY = 1 + Math.sin(time * 2.5) * 0.08;
  const squishX = 1 - Math.sin(time * 2.5) * 0.06;
  ctx.save();
  ctx.translate(x, y - bounce);
  ctx.scale(2 * squishX, 2 * squishY);

  // Shadow on ground
  ctx.fillStyle = 'rgba(0,0,0,0.15)';
  ctx.beginPath();
  ctx.ellipse(0, 14 + bounce / 2, 14 / squishX, 3, 0, 0, Math.PI * 2);
  ctx.fill();

  // Body (smooth slime blob)
  ctx.fillStyle = '#2ecc71';
  ctx.beginPath();
  ctx.moveTo(-10, 10);
  ctx.quadraticCurveTo(-13, 0, -10, -6);
  ctx.quadraticCurveTo(0, -14, 10, -6);
  ctx.quadraticCurveTo(13, 0, 10, 10);
  ctx.quadraticCurveTo(0, 13, -10, 10);
  ctx.fill();

  // Darker bottom
  ctx.fillStyle = '#1fa855';
  ctx.beginPath();
  ctx.moveTo(-10, 10);
  ctx.quadraticCurveTo(-12, 4, -8, 2);
  ctx.lineTo(8, 2);
  ctx.quadraticCurveTo(12, 4, 10, 10);
  ctx.quadraticCurveTo(0, 13, -10, 10);
  ctx.fill();

  // Highlight
  ctx.fillStyle = 'rgba(255,255,255,0.35)';
  ctx.beginPath();
  ctx.ellipse(-5, -7, 4, 3, -0.3, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.5)';
  ctx.beginPath();
  ctx.arc(-7, -8, 1.5, 0, Math.PI * 2);
  ctx.fill();

  // ── Animated Eyes ──
  // Update look direction
  _glimEye.nextLookTime -= dt;
  if (_glimEye.nextLookTime <= 0) {
    const dirs = [
      [0, 0], [-1.2, 0], [1.2, 0], [0, -0.8], [0, 0.6],
      [-0.8, -0.5], [0.8, -0.5], [0, 0]
    ];
    const d = dirs[Math.floor(Math.random() * dirs.length)];
    _glimEye.targetX = d[0];
    _glimEye.targetY = d[1];
    _glimEye.nextLookTime = 1.5 + Math.random() * 3;
  }
  // Smooth lerp toward target
  _glimEye.lookX += (_glimEye.targetX - _glimEye.lookX) * 0.08;
  _glimEye.lookY += (_glimEye.targetY - _glimEye.lookY) * 0.08;

  // Blink
  _glimEye.blinkTimer -= dt;
  if (_glimEye.blinkTimer <= 0) {
    _glimEye.blinkPhase = 0.18; // blink duration
    _glimEye.blinkTimer = 2.5 + Math.random() * 4;
  }
  const blinking = _glimEye.blinkPhase > 0;
  if (blinking) _glimEye.blinkPhase -= dt;

  const lx = _glimEye.lookX;
  const ly = _glimEye.lookY;
  const eyeScaleY = blinking ? 0.15 : 1;

  // Eye whites
  ctx.fillStyle = '#fff';
  ctx.save();
  ctx.translate(-4, -1); ctx.scale(1, eyeScaleY);
  ctx.beginPath(); ctx.ellipse(0, 0, 3, 3.5, 0, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
  ctx.save();
  ctx.translate(4, -1); ctx.scale(1, eyeScaleY);
  ctx.beginPath(); ctx.ellipse(0, 0, 3, 3.5, 0, 0, Math.PI * 2); ctx.fill();
  ctx.restore();

  // Pupils (with look offset)
  if (!blinking) {
    ctx.fillStyle = '#111';
    ctx.beginPath(); ctx.arc(-3 + lx, 0 + ly, 1.8, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(5 + lx, 0 + ly, 1.8, 0, Math.PI * 2); ctx.fill();
    // Eye shine
    ctx.fillStyle = '#fff';
    ctx.fillRect(-5 + lx * 0.3, -2 + ly * 0.3, 1, 1);
    ctx.fillRect(3 + lx * 0.3, -2 + ly * 0.3, 1, 1);
  }

  // Smile
  ctx.strokeStyle = '#1fa855';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(1, 3, 3, 0.1, Math.PI - 0.1);
  ctx.stroke();

  // Cheeks
  ctx.fillStyle = 'rgba(255,120,120,0.25)';
  ctx.beginPath(); ctx.ellipse(-8, 2, 2.5, 1.5, 0, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(8, 2, 2.5, 1.5, 0, 0, Math.PI * 2); ctx.fill();

  ctx.restore();
}
})();
