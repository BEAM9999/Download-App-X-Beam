/* ══════════════════════════════════════════════
   Slime Bouncer — Renderer
   Canvas setup, parallax, tile rendering,
   entity drawing, draw order
   ═════════════════════════════════════════════ */
'use strict';
(function() {
const SB = window.SB || (window.SB = {});

// ── World parallax definitions ──
const WORLD_BG = {
  1: { // Emerald Forest
    sky: '#87ceeb',
    layers: [
      { color: '#4a7c3a', yOff: 0.65, speed: 0.05 },
      { color: '#3a6a2a', yOff: 0.55, speed: 0.15 },
      { color: '#2d5a27', yOff: 0.45, speed: 0.3 },
      { color: '#1a4a1a', yOff: 0.35, speed: 0.5 }
    ]
  },
  2: { // Sandy Desert
    sky: '#f0d9a0',
    layers: [
      { color: '#d4a84a', yOff: 0.65, speed: 0.05 },
      { color: '#c49a3a', yOff: 0.55, speed: 0.15 },
      { color: '#b48a2a', yOff: 0.45, speed: 0.3 },
      { color: '#a47a1a', yOff: 0.35, speed: 0.5 }
    ]
  },
  3: { // Ice Peaks
    sky: '#c8e8f0',
    layers: [
      { color: '#a0c8d8', yOff: 0.65, speed: 0.05 },
      { color: '#88b0c8', yOff: 0.55, speed: 0.15 },
      { color: '#7098b0', yOff: 0.45, speed: 0.3 },
      { color: '#588098', yOff: 0.35, speed: 0.5 }
    ]
  },
  4: { // Shadow Castle
    sky: '#1a0a2e',
    layers: [
      { color: '#2a1a3e', yOff: 0.65, speed: 0.05 },
      { color: '#3a2a4e', yOff: 0.55, speed: 0.15 },
      { color: '#1a0a2e', yOff: 0.45, speed: 0.3 },
      { color: '#0a0018', yOff: 0.35, speed: 0.5 }
    ]
  }
};

SB.Renderer = {
  canvas: null,
  ctx: null,
  scaleX: 1,
  scaleY: 1,

  init() {
    this.canvas = document.getElementById('gameCanvas');
    this.ctx = this.canvas.getContext('2d');
    this._updateDimensions();
    this.canvas.width = SB.W;
    this.canvas.height = SB.H;
    this.ctx.imageSmoothingEnabled = false;
    this.resize();
    window.addEventListener('resize', () => this.resize());
    // Try to lock landscape orientation on mobile
    try {
      if (screen.orientation && screen.orientation.lock) {
        screen.orientation.lock('landscape').catch(() => {});
      }
    } catch (e) {}
  },

  // Helper: get effective viewport size (swapped on portrait mobile)
  _getViewport() {
    const isPortraitMobile = window.innerHeight > window.innerWidth &&
                             ('ontouchstart' in window || navigator.maxTouchPoints > 0);
    return isPortraitMobile
      ? { w: window.innerHeight, h: window.innerWidth }
      : { w: window.innerWidth,  h: window.innerHeight };
  },

  _updateDimensions() {
    const { w: pw, h: ph } = this._getViewport();
    // Keep height fixed at 500 (levels designed for this)
    SB.H = 500;
    const viewAspect = pw / ph;
    // Scale width to fill viewport
    SB.W = Math.max(800, Math.round(SB.H * viewAspect));
  },

  resize() {
    const canvas = this.canvas;
    this._updateDimensions();
    const { w: pw, h: ph } = this._getViewport();
    // Canvas internal size matches game dimensions
    const r = (SB.Save && SB.Save.data) ? (SB.Save.data.settings.resolution || 1) : 1;
    canvas.width = Math.round(SB.W * r);
    canvas.height = Math.round(SB.H * r);
    if (r !== 1) {
      this.ctx.setTransform(r, 0, 0, r, 0, 0);
    }
    this.ctx.imageSmoothingEnabled = false;
    // Fill entire viewport
    canvas.style.width = pw + 'px';
    canvas.style.height = ph + 'px';
    this.scaleX = SB.W / pw;
    this.scaleY = SB.H / ph;
  },

  applyResolution(res) {
    if (!this.canvas) return;
    const r = res || (SB.Save.data.settings.resolution || 1);
    this.resize(); // resize will handle canvas dimensions and resolution
  },

  clear() {
    this.ctx.clearRect(0, 0, SB.W, SB.H);
  },

  // ── Draw Parallax Background ──
  drawBackground(cam) {
    const ctx = this.ctx;
    const world = SB.Save.data.currentWorld || 1;
    const bg = WORLD_BG[world] || WORLD_BG[1];
    const time = SB.UI.animTime || 0;

    // Sky gradient
    const grad = ctx.createLinearGradient(0, 0, 0, SB.H);
    grad.addColorStop(0, bg.sky);
    grad.addColorStop(1, bg.layers[0].color);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, SB.W, SB.H);

    // ── World-specific far background elements ──
    if (world === 1) {
      // Stars (early morning feel) — faint
      ctx.fillStyle = 'rgba(255,255,255,0.08)';
      for (let i = 0; i < 8; i++) {
        const sx = (i * 137 + 50) % SB.W;
        const sy = 20 + (i * 43) % 80;
        ctx.fillRect(sx, sy, 1, 1);
      }
    } else if (world === 2) {
      // Hot sun
      ctx.fillStyle = 'rgba(255,200,50,0.15)';
      ctx.beginPath(); ctx.arc(SB.W - 80, 60, 35, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = 'rgba(255,220,100,0.3)';
      ctx.beginPath(); ctx.arc(SB.W - 80, 60, 22, 0, Math.PI * 2); ctx.fill();
    } else if (world === 3) {
      // Snowfall
      ctx.fillStyle = 'rgba(255,255,255,0.5)';
      for (let i = 0; i < 30; i++) {
        const fx = ((i * 73 + time * 20 * (1 + (i % 3) * 0.3)) % (SB.W + 20)) - 10;
        const fy = ((i * 51 + time * 40 * (1 + (i % 2) * 0.5)) % (SB.H + 20)) - 10;
        const sz = 1 + (i % 3);
        ctx.beginPath(); ctx.arc(fx, fy, sz, 0, Math.PI * 2); ctx.fill();
      }
    } else if (world === 4) {
      // Dark stars / eerie eyes
      ctx.fillStyle = 'rgba(200,150,255,0.1)';
      for (let i = 0; i < 12; i++) {
        const sx = (i * 97 + 30) % SB.W;
        const sy = 10 + (i * 37) % 60;
        ctx.fillRect(sx, sy, 1.5, 1.5);
      }
      // Moon
      ctx.fillStyle = 'rgba(200,180,255,0.12)';
      ctx.beginPath(); ctx.arc(SB.W * 0.8, 45, 25, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = 'rgba(220,200,255,0.2)';
      ctx.beginPath(); ctx.arc(SB.W * 0.8, 45, 16, 0, Math.PI * 2); ctx.fill();
    }

    // Parallax mountain/hill layers
    for (let i = 0; i < bg.layers.length; i++) {
      const layer = bg.layers[i];
      const scrollX = cam.x * layer.speed;
      const baseY = SB.H * layer.yOff;
      ctx.fillStyle = layer.color;
      ctx.beginPath();
      ctx.moveTo(0, SB.H);
      for (let x = -50; x <= SB.W + 50; x += 30) {
        const nx = x + scrollX;
        const h1 = Math.sin(nx * 0.008 + i) * 25 + Math.sin(nx * 0.02 + i * 2) * 15;
        ctx.lineTo(x, baseY + h1);
      }
      ctx.lineTo(SB.W + 50, SB.H);
      ctx.closePath();
      ctx.fill();
    }

    // ── World-specific mid-background decorations (between layers) ──
    if (world === 1) {
      // Cottages/huts at fixed world positions with parallax
      const cottagePositions = [200, 650, 1200, 1900, 2700, 3600, 4500];
      for (let i = 0; i < cottagePositions.length; i++) {
        const worldX = cottagePositions[i];
        const cx = worldX - cam.x;
        if (cx < -60 || cx > SB.W + 60) continue; // cull off-screen
        const cy = SB.H * 0.52 + Math.sin(i * 2.5) * 15;
        const cs = 18 + (i % 2) * 6;
        ctx.fillStyle = 'rgba(100,70,40,0.4)';
        ctx.fillRect(cx - cs / 2, cy, cs, cs * 0.8);
        // Roof
        ctx.fillStyle = 'rgba(140,60,30,0.5)';
        ctx.beginPath();
        ctx.moveTo(cx - cs / 2 - 3, cy);
        ctx.lineTo(cx, cy - cs * 0.5);
        ctx.lineTo(cx + cs / 2 + 3, cy);
        ctx.fill();
        // Window
        ctx.fillStyle = 'rgba(255,220,100,0.3)';
        ctx.fillRect(cx - 2, cy + cs * 0.25, 4, 4);
        // Chimney
        if (i % 2 === 0) {
          ctx.fillStyle = 'rgba(80,60,40,0.4)';
          ctx.fillRect(cx + cs / 4, cy - cs * 0.35, 4, cs * 0.35);
          // Smoke
          ctx.fillStyle = 'rgba(200,200,200,0.15)';
          const smokeY = cy - cs * 0.4;
          ctx.beginPath(); ctx.arc(cx + cs / 4 + 2, smokeY - 4 - Math.sin(time + i) * 3, 3, 0, Math.PI * 2); ctx.fill();
          ctx.beginPath(); ctx.arc(cx + cs / 4, smokeY - 10 - Math.sin(time * 0.8 + i) * 4, 4, 0, Math.PI * 2); ctx.fill();
        }
        // Door
        ctx.fillStyle = 'rgba(60,40,20,0.5)';
        ctx.fillRect(cx - 2, cy + cs * 0.5, 4, cs * 0.3);
      }
    } else if (world === 2) {
      // Pyramids in far background
      const pyrScroll = cam.x * 0.08;
      for (let i = 0; i < 3; i++) {
        const px = ((i * 350 + 150 - pyrScroll) % (SB.W + 400)) - 80;
        const py = SB.H * 0.55;
        const ps = 50 + i * 20;
        ctx.fillStyle = 'rgba(180,140,60,0.35)';
        ctx.beginPath();
        ctx.moveTo(px, py);
        ctx.lineTo(px + ps / 2, py - ps * 0.7);
        ctx.lineTo(px + ps, py);
        ctx.fill();
        // Pyramid shadow side
        ctx.fillStyle = 'rgba(140,100,40,0.25)';
        ctx.beginPath();
        ctx.moveTo(px + ps / 2, py - ps * 0.7);
        ctx.lineTo(px + ps, py);
        ctx.lineTo(px + ps * 0.7, py);
        ctx.fill();
        // Pyramid lines
        ctx.strokeStyle = 'rgba(160,120,50,0.2)';
        ctx.lineWidth = 0.5;
        for (let r = 1; r < 4; r++) {
          const ly = py - ps * 0.7 * (1 - r / 4);
          const lw = ps * r / 4;
          ctx.beginPath();
          ctx.moveTo(px + ps / 2 - lw / 2, ly);
          ctx.lineTo(px + ps / 2 + lw / 2, ly);
          ctx.stroke();
        }
      }
      // Background cacti silhouettes
      const cactScroll = cam.x * 0.12;
      for (let i = 0; i < 6; i++) {
        const cx = ((i * 180 + 50 - cactScroll) % (SB.W + 200)) - 50;
        const cy = SB.H * 0.58 + (i % 3) * 10;
        ctx.fillStyle = 'rgba(80,100,40,0.25)';
        ctx.fillRect(cx - 2, cy - 18, 4, 18);
        ctx.fillRect(cx - 7, cy - 12, 5, 3);
        ctx.fillRect(cx + 3, cy - 8, 5, 3);
        ctx.fillRect(cx - 7, cy - 12, 3, -6);
        ctx.fillRect(cx + 5, cy - 8, 3, -5);
      }
    } else if (world === 3) {
      // Ice mountains in far background
      const iceScroll = cam.x * 0.06;
      for (let i = 0; i < 5; i++) {
        const mx = ((i * 250 + 80 - iceScroll) % (SB.W + 350)) - 80;
        const my = SB.H * 0.5;
        const ms = 60 + (i % 3) * 25;
        // Mountain body
        ctx.fillStyle = 'rgba(130,170,200,0.3)';
        ctx.beginPath();
        ctx.moveTo(mx, my);
        ctx.lineTo(mx + ms * 0.4, my - ms * 0.8);
        ctx.lineTo(mx + ms * 0.6, my - ms * 0.65);
        ctx.lineTo(mx + ms, my);
        ctx.fill();
        // Snow cap
        ctx.fillStyle = 'rgba(230,240,255,0.35)';
        ctx.beginPath();
        ctx.moveTo(mx + ms * 0.3, my - ms * 0.55);
        ctx.lineTo(mx + ms * 0.4, my - ms * 0.8);
        ctx.lineTo(mx + ms * 0.5, my - ms * 0.7);
        ctx.lineTo(mx + ms * 0.6, my - ms * 0.65);
        ctx.lineTo(mx + ms * 0.65, my - ms * 0.5);
        ctx.fill();
      }
      // Snowy pine trees in background
      const treeScroll = cam.x * 0.15;
      for (let i = 0; i < 8; i++) {
        const tx = ((i * 140 + 30 - treeScroll) % (SB.W + 200)) - 40;
        const ty = SB.H * 0.6 + (i % 3) * 8;
        const ts = 12 + (i % 2) * 5;
        // Trunk
        ctx.fillStyle = 'rgba(80,60,40,0.25)';
        ctx.fillRect(tx - 1, ty, 3, ts * 0.4);
        // Snow-covered tiers
        ctx.fillStyle = 'rgba(180,210,230,0.3)';
        for (let t2 = 0; t2 < 3; t2++) {
          const tw = ts * 0.7 - t2 * 3;
          ctx.beginPath();
          ctx.moveTo(tx - tw / 2, ty - t2 * ts * 0.2);
          ctx.lineTo(tx + 0.5, ty - (t2 + 1) * ts * 0.25);
          ctx.lineTo(tx + tw / 2, ty - t2 * ts * 0.2);
          ctx.fill();
        }
        // Snow on tips
        ctx.fillStyle = 'rgba(255,255,255,0.2)';
        ctx.fillRect(tx - 2, ty - ts * 0.2, 5, 2);
      }
    } else if (world === 4) {
      // Dark castle silhouettes
      const castleScroll = cam.x * 0.07;
      for (let i = 0; i < 3; i++) {
        const cx = ((i * 380 + 120 - castleScroll) % (SB.W + 500)) - 100;
        const cy = SB.H * 0.5;
        const cs = 50 + i * 15;
        // Castle body
        ctx.fillStyle = 'rgba(20,10,35,0.5)';
        ctx.fillRect(cx, cy, cs, cs * 0.6);
        // Towers
        ctx.fillRect(cx - 8, cy - cs * 0.3, 12, cs * 0.3 + cs * 0.6);
        ctx.fillRect(cx + cs - 4, cy - cs * 0.2, 12, cs * 0.2 + cs * 0.6);
        // Tower tops (pointy)
        ctx.beginPath();
        ctx.moveTo(cx - 8, cy - cs * 0.3);
        ctx.lineTo(cx - 2, cy - cs * 0.5);
        ctx.lineTo(cx + 4, cy - cs * 0.3);
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(cx + cs - 4, cy - cs * 0.2);
        ctx.lineTo(cx + cs + 2, cy - cs * 0.4);
        ctx.lineTo(cx + cs + 8, cy - cs * 0.2);
        ctx.fill();
        // Battlements
        for (let b = 0; b < Math.floor(cs / 8); b++) {
          ctx.fillRect(cx + b * 8, cy - 4, 5, 4);
        }
        // Windows (eerie glow)
        ctx.fillStyle = 'rgba(150,100,255,0.15)';
        ctx.fillRect(cx + cs * 0.3, cy + cs * 0.15, 4, 6);
        ctx.fillRect(cx + cs * 0.6, cy + cs * 0.15, 4, 6);
        // Tower window
        ctx.fillStyle = 'rgba(200,50,50,' + (0.15 + Math.sin(time * 2 + i) * 0.05) + ')';
        ctx.fillRect(cx - 4, cy - cs * 0.15, 4, 5);
      }
      // Dead trees silhouette
      const dtScroll = cam.x * 0.12;
      for (let i = 0; i < 6; i++) {
        const tx = ((i * 160 + 60 - dtScroll) % (SB.W + 200)) - 40;
        const ty = SB.H * 0.6;
        ctx.strokeStyle = 'rgba(30,15,50,0.4)';
        ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.moveTo(tx, ty); ctx.lineTo(tx, ty - 20); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(tx, ty - 14); ctx.lineTo(tx - 8, ty - 22); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(tx, ty - 10); ctx.lineTo(tx + 6, ty - 18); ctx.stroke();
      }
    }

    // Clouds (forest & ice only)
    if (world === 1 || world === 3) {
      ctx.fillStyle = world === 3 ? 'rgba(220,230,240,0.25)' : 'rgba(255,255,255,0.2)';
      for (let i = 0; i < 5; i++) {
        const cx = ((i * 200 + cam.x * 0.03) % (SB.W + 200)) - 100;
        const cy = 30 + i * 25;
        ctx.beginPath();
        ctx.arc(cx, cy, 20, 0, Math.PI * 2);
        ctx.arc(cx + 18, cy - 5, 15, 0, Math.PI * 2);
        ctx.arc(cx + 35, cy, 18, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  },

  // ── Background decorations (trees, bushes, grass) ──
  drawDecorations(ctx, cam) {
    const decos = SB.Level.decorations;
    if (!decos || !decos.length) return;
    const t = SB.UI.animTime || 0;
    const left = cam.x - 50;
    const right = cam.x + SB.W + 50;

    for (const d of decos) {
      if (d.x + (d.size || 50) < left || d.x - (d.size || 50) > right) continue;
      const sx = Math.round(d.x - cam.x);
      const sy = Math.round(d.y - cam.y);
      ctx.save();
      
      switch (d.type) {
        // ═══ WORLD 1: EMERALD FOREST ═══
        case 'tree_large': {
          const sway = Math.sin(t * 0.8 + d.seed) * 2.5;
          const h = d.size || 80;
          const trunkH = h * 0.5;
          // Trunk (grows UP from ground)
          ctx.fillStyle = '#5a3d22';
          ctx.fillRect(sx - 5, sy - trunkH, 10, trunkH);
          ctx.fillStyle = '#4a2f18';
          ctx.fillRect(sx - 3, sy - trunkH + 8, 2, trunkH * 0.7);
          // Canopy layers (above trunk)
          const leafColors = ['#1a7a1a', '#228B22', '#2ecc71', '#27ae60'];
          for (let layer = 0; layer < 3; layer++) {
            const ly = sy - trunkH - layer * h * 0.18;
            const lr = (h * 0.35 - layer * 6) + Math.sin(t * 1.2 + d.seed + layer) * 1.5;
            ctx.fillStyle = leafColors[layer];
            ctx.beginPath();
            ctx.moveTo(sx + sway - lr, ly + lr * 0.5);
            ctx.quadraticCurveTo(sx + sway, ly - lr * 0.4, sx + sway + lr, ly + lr * 0.5);
            ctx.quadraticCurveTo(sx + sway, ly + lr * 0.2, sx + sway - lr, ly + lr * 0.5);
            ctx.fill();
          }
          // Highlight
          ctx.fillStyle = 'rgba(255,255,255,0.08)';
          ctx.beginPath();
          ctx.arc(sx + sway - 5, sy - trunkH - h * 0.15, h * 0.15, 0, Math.PI * 2);
          ctx.fill();
          break;
        }
        case 'tree_medium': {
          const sway = Math.sin(t * 1.0 + d.seed) * 2;
          const h = d.size || 55;
          const trunkH = h * 0.45;
          // Trunk (grows UP from ground)
          ctx.fillStyle = '#5a3d22';
          ctx.fillRect(sx - 4, sy - trunkH, 8, trunkH);
          // Round canopy (above trunk)
          ctx.fillStyle = '#228B22';
          ctx.beginPath();
          ctx.arc(sx + sway, sy - trunkH - h * 0.1, h * 0.3, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#2ecc71';
          ctx.beginPath();
          ctx.arc(sx + sway - 4, sy - trunkH - h * 0.15, h * 0.2, 0, Math.PI * 2);
          ctx.fill();
          break;
        }
        case 'bush': {
          const sway = Math.sin(t * 1.5 + d.seed) * 1;
          const r = d.size || 14;
          ctx.fillStyle = '#1a6a1a';
          ctx.beginPath();
          ctx.arc(sx + sway, sy - r * 0.3, r, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#228B22';
          ctx.beginPath();
          ctx.arc(sx + sway - 4, sy - r * 0.5, r * 0.7, 0, Math.PI * 2);
          ctx.fill();
          // Berries
          if (d.seed % 3 === 0) {
            ctx.fillStyle = '#e74c3c';
            ctx.beginPath(); ctx.arc(sx + sway + 3, sy - 2, 2, 0, Math.PI * 2); ctx.fill();
            ctx.beginPath(); ctx.arc(sx + sway - 5, sy - 4, 1.5, 0, Math.PI * 2); ctx.fill();
          }
          break;
        }
        case 'grass_tuft': {
          const grassSway = Math.sin(t * 2 + d.seed) * 1.5;
          ctx.strokeStyle = d.color || '#3a9a3a';
          ctx.lineWidth = 1.5;
          for (let g = -2; g <= 2; g++) {
            const gx = sx + g * 3;
            const gh = 6 + (d.seed + g) % 5;
            const sw = grassSway * (1 + Math.abs(g) * 0.2);
            ctx.beginPath();
            ctx.moveTo(gx, sy);
            ctx.quadraticCurveTo(gx + sw * 0.5, sy - gh * 0.6, gx + sw, sy - gh);
            ctx.stroke();
          }
          break;
        }
        case 'flower': {
          const sway = Math.sin(t * 1.8 + d.seed) * 1;
          ctx.strokeStyle = '#2d8a2d';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(sx, sy);
          ctx.quadraticCurveTo(sx + sway * 0.5, sy - 8, sx + sway, sy - 14);
          ctx.stroke();
          const fc = ['#e74c3c','#f1c40f','#e91e63','#9b59b6','#fff'][d.seed % 5];
          ctx.fillStyle = fc;
          ctx.beginPath(); ctx.arc(sx + sway, sy - 14, 3, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = '#f1c40f';
          ctx.beginPath(); ctx.arc(sx + sway, sy - 14, 1.5, 0, Math.PI * 2); ctx.fill();
          break;
        }

        // ═══ WORLD 2: GOLDEN DESERT ═══
        case 'cactus': {
          const h = d.size || 35;
          ctx.fillStyle = '#2d8a2d';
          ctx.fillRect(sx - 4, sy - h, 8, h);
          // Arms
          ctx.fillRect(sx - 12, sy - h + h * 0.3, 8, 4);
          ctx.fillRect(sx - 12, sy - h + h * 0.15, 4, h * 0.15 + 4);
          ctx.fillRect(sx + 4, sy - h + h * 0.5, 8, 4);
          ctx.fillRect(sx + 8, sy - h + h * 0.35, 4, h * 0.15 + 4);
          // Highlights
          ctx.fillStyle = '#3aaa3a';
          ctx.fillRect(sx - 2, sy - h + 2, 2, h - 4);
          // Spines
          ctx.fillStyle = '#556';
          for (let sp = 0; sp < 4; sp++) {
            ctx.fillRect(sx + 4, sy - h + 5 + sp * (h / 5), 2, 1);
            ctx.fillRect(sx - 6, sy - h + 8 + sp * (h / 5), 2, 1);
          }
          break;
        }
        case 'dead_tree': {
          const h = d.size || 50;
          ctx.strokeStyle = '#6d5a3a';
          ctx.lineWidth = 4;
          ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(sx, sy - h * 0.7); ctx.stroke();
          // Branches
          ctx.lineWidth = 2;
          ctx.beginPath(); ctx.moveTo(sx, sy - h * 0.45); ctx.lineTo(sx - 15, sy - h * 0.65); ctx.stroke();
          ctx.beginPath(); ctx.moveTo(sx, sy - h * 0.35); ctx.lineTo(sx + 12, sy - h * 0.5); ctx.stroke();
          ctx.beginPath(); ctx.moveTo(sx, sy - h * 0.55); ctx.lineTo(sx + 8, sy - h * 0.75); ctx.stroke();
          break;
        }
        case 'rock': {
          const r = d.size || 12;
          ctx.fillStyle = '#8a7a5a';
          ctx.beginPath();
          ctx.moveTo(sx - r, sy);
          ctx.lineTo(sx - r * 0.7, sy - r * 0.8);
          ctx.lineTo(sx + r * 0.3, sy - r);
          ctx.lineTo(sx + r, sy - r * 0.5);
          ctx.lineTo(sx + r, sy);
          ctx.fill();
          ctx.fillStyle = '#9a8a6a';
          ctx.beginPath();
          ctx.moveTo(sx - r * 0.5, sy - r * 0.3);
          ctx.lineTo(sx + r * 0.2, sy - r * 0.9);
          ctx.lineTo(sx + r * 0.8, sy - r * 0.4);
          ctx.fill();
          break;
        }
        case 'tumbleweed': {
          const roll = t * 1.5 + d.seed;
          const tx = sx + Math.sin(roll) * 3;
          const ty = sy - Math.abs(Math.sin(roll * 2)) * 4;
          ctx.strokeStyle = '#8a7a3a';
          ctx.lineWidth = 1;
          ctx.beginPath(); ctx.arc(tx, ty - 5, 6, 0, Math.PI * 2); ctx.stroke();
          ctx.beginPath(); ctx.arc(tx, ty - 5, 3, 0, Math.PI * 2); ctx.stroke();
          break;
        }

        // ═══ WORLD 3: FROZEN SEA ═══
        case 'pine_tree': {
          const sway = Math.sin(t * 0.6 + d.seed) * 1.5;
          const h = d.size || 65;
          const pTrunkH = h * 0.35;
          // Trunk (grows UP from ground)
          ctx.fillStyle = '#4a3520';
          ctx.fillRect(sx - 3, sy - pTrunkH, 6, pTrunkH);
          // Pine layers (triangular, 4 tiers — above trunk)
          for (let layer = 0; layer < 4; layer++) {
            const ly = sy - pTrunkH - layer * h * 0.15;
            const lw = (h * 0.3 - layer * 5);
            ctx.fillStyle = ['#1a5a3a','#1a6a3a','#2a7a4a','#3a8a5a'][layer];
            ctx.beginPath();
            ctx.moveTo(sx + sway - lw, ly);
            ctx.lineTo(sx + sway, ly - h * 0.18);
            ctx.lineTo(sx + sway + lw, ly);
            ctx.fill();
          }
          // Snow on top
          ctx.fillStyle = '#fff';
          for (let layer = 0; layer < 3; layer++) {
            const ly = sy - pTrunkH - layer * h * 0.15;
            const lw = (h * 0.25 - layer * 5);
            ctx.beginPath();
            ctx.moveTo(sx + sway - lw * 0.6, ly - h * 0.12);
            ctx.quadraticCurveTo(sx + sway, ly - h * 0.17, sx + sway + lw * 0.6, ly - h * 0.12);
            ctx.quadraticCurveTo(sx + sway, ly - h * 0.14, sx + sway - lw * 0.6, ly - h * 0.12);
            ctx.fill();
          }
          break;
        }
        case 'ice_crystal': {
          ctx.save();
          ctx.translate(sx, sy - 10);
          ctx.rotate(Math.sin(t + d.seed) * 0.05);
          const h = d.size || 20;
          ctx.fillStyle = 'rgba(150,210,255,0.6)';
          ctx.beginPath();
          ctx.moveTo(0, -h); ctx.lineTo(h * 0.3, -h * 0.3);
          ctx.lineTo(h * 0.15, 0); ctx.lineTo(-h * 0.15, 0);
          ctx.lineTo(-h * 0.3, -h * 0.3);
          ctx.fill();
          ctx.fillStyle = 'rgba(200,230,255,0.4)';
          ctx.beginPath();
          ctx.moveTo(-2, -h * 0.9); ctx.lineTo(h * 0.2, -h * 0.2);
          ctx.lineTo(0, 0); ctx.lineTo(-h * 0.2, -h * 0.2);
          ctx.fill();
          ctx.restore();
          break;
        }
        case 'snow_bush': {
          const r = d.size || 12;
          ctx.fillStyle = '#4a6a5a';
          ctx.beginPath(); ctx.arc(sx, sy - r * 0.4, r, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = '#ddeeff';
          ctx.beginPath(); ctx.arc(sx, sy - r * 0.7, r * 0.6, -Math.PI, 0); ctx.fill();
          break;
        }

        // ═══ WORLD 4: SHADOW CASTLE ═══
        case 'torch': {
          const h = d.size || 40;
          // Pole (grows UP from ground)
          ctx.fillStyle = '#555';
          ctx.fillRect(sx - 3, sy - h, 6, h);
          // Holder
          ctx.fillStyle = '#666';
          ctx.fillRect(sx - 6, sy - h - 2, 12, 4);
          // Flame (animated)
          const flicker = Math.sin(t * 8 + d.seed) * 2;
          const fh = 10 + Math.sin(t * 6 + d.seed) * 3;
          ctx.fillStyle = '#f39c12';
          ctx.beginPath();
          ctx.moveTo(sx - 4, sy - h - 2);
          ctx.quadraticCurveTo(sx + flicker, sy - h - fh - 5, sx + 4, sy - h - 2);
          ctx.fill();
          ctx.fillStyle = '#e74c3c';
          ctx.beginPath();
          ctx.moveTo(sx - 2, sy - h - 2);
          ctx.quadraticCurveTo(sx + flicker * 0.5, sy - h - fh, sx + 2, sy - h - 2);
          ctx.fill();
          // Glow
          ctx.fillStyle = 'rgba(243,156,18,0.1)';
          ctx.beginPath(); ctx.arc(sx, sy - h - 5, 25, 0, Math.PI * 2); ctx.fill();
          break;
        }
        case 'banner': {
          const h = d.size || 35;
          const sway = Math.sin(t * 1.5 + d.seed) * 3;
          // Pole
          ctx.fillStyle = '#555';
          ctx.fillRect(sx - 1, sy, 3, h);
          ctx.fillStyle = '#888';
          ctx.beginPath(); ctx.arc(sx + 1, sy, 3, 0, Math.PI * 2); ctx.fill();
          // Banner cloth
          const bCol = ['#8e44ad','#c0392b','#2c3e50','#1a5276'][d.seed % 4];
          ctx.fillStyle = bCol;
          ctx.beginPath();
          ctx.moveTo(sx + 2, sy + 3);
          ctx.lineTo(sx + 20 + sway, sy + 5);
          ctx.lineTo(sx + 18 + sway * 0.8, sy + h * 0.5);
          ctx.lineTo(sx + 22 + sway, sy + h * 0.85);
          ctx.lineTo(sx + 2, sy + h * 0.7);
          ctx.fill();
          // Emblem
          ctx.fillStyle = '#f1c40f';
          ctx.beginPath(); ctx.arc(sx + 12 + sway * 0.5, sy + h * 0.35, 3, 0, Math.PI * 2); ctx.fill();
          break;
        }
        case 'chain': {
          const h = d.size || 50;
          const sway = Math.sin(t * 0.8 + d.seed) * 2;
          ctx.strokeStyle = '#666';
          ctx.lineWidth = 2;
          for (let c = 0; c < h / 8; c++) {
            const cy = sy + c * 8;
            const csx = sway * (c / (h / 8));
            ctx.beginPath();
            ctx.ellipse(sx + csx, cy + 4, 3, 4, 0, 0, Math.PI * 2);
            ctx.stroke();
          }
          break;
        }
        case 'gargoyle': {
          ctx.fillStyle = '#444';
          // Body
          ctx.fillRect(sx - 8, sy - 5, 16, 14);
          // Head
          ctx.beginPath();
          ctx.arc(sx, sy - 8, 7, 0, Math.PI * 2);
          ctx.fill();
          // Horns
          ctx.beginPath();
          ctx.moveTo(sx - 5, sy - 12); ctx.lineTo(sx - 8, sy - 20); ctx.lineTo(sx - 3, sy - 13);
          ctx.fill();
          ctx.beginPath();
          ctx.moveTo(sx + 5, sy - 12); ctx.lineTo(sx + 8, sy - 20); ctx.lineTo(sx + 3, sy - 13);
          ctx.fill();
          // Eyes (glowing)
          ctx.fillStyle = '#e74c3c';
          ctx.globalAlpha = 0.5 + Math.sin(t * 2 + d.seed) * 0.3;
          ctx.beginPath(); ctx.arc(sx - 3, sy - 9, 1.5, 0, Math.PI * 2); ctx.fill();
          ctx.beginPath(); ctx.arc(sx + 3, sy - 9, 1.5, 0, Math.PI * 2); ctx.fill();
          ctx.globalAlpha = 1;
          break;
        }
      }
      ctx.restore();
    }
  },

  // ── Draw all game entities ──
  drawGame() {
    const ctx = this.ctx;
    const rawCam = SB.Camera;
    // Create a camera object with shake applied for rendering
    const cam = { x: rawCam.sx, y: rawCam.sy };

    // 1. Background
    this.drawBackground(cam);

    // 1.5 Background decorations (trees, bushes, grass — behind tiles)
    this.drawDecorations(ctx, cam);

    // 2. Tilemap
    SB.Level.drawTilemap(ctx, cam);

    // 3. Items (coins, power-ups)
    SB.Items.draw(ctx, cam);

    // 4. Enemies
    for (const e of SB.enemies) {
      if (e.alive) e.draw(ctx, cam);
    }

    // 5. Boss
    if (SB.boss && SB.boss.alive) {
      SB.boss.draw(ctx, cam);
    }

    // 6. Player projectiles
    for (const p of SB.playerProjectiles) {
      if (p.alive) {
        ctx.fillStyle = p.color || '#e74c3c';
        ctx.fillRect(Math.round(p.x - cam.x), Math.round(p.y - cam.y), p.w || 8, p.h || 8);
      }
    }

    // 7. Player
    SB.Player.draw(ctx, cam);

    // 8. Particles (over everything)
    SB.Particles.draw(ctx, cam);

    // 9. Float texts
    SB.Items.drawFloatTexts(ctx, cam);

    // 10. HUD (screen-space, no camera)
    SB.HUD.draw(ctx);
  },

  // ── Main render dispatch ──
  render() {
    const ctx = this.ctx;
    this.clear();

    switch (SB.gameState) {
      case 'TITLE':
        SB.UI.drawTitle(ctx);
        break;
      case 'WORLD_SELECT':
        SB.UI.drawWorldSelect(ctx);
        break;
      case 'WORLD_MAP':
        SB.UI.drawWorldMap(ctx);
        break;
      case 'PLAYING':
        this.drawGame();
        break;
      case 'PAUSED':
        this.drawGame();
        SB.UI.drawPause(ctx);
        break;
      case 'LEVEL_COMPLETE':
        this.drawGame();
        SB.UI.drawLevelComplete(ctx);
        break;
      case 'GAME_OVER':
        this.drawGame();
        SB.UI.drawGameOver(ctx);
        break;
    }

    // Transition overlay (always on top)
    SB.UI.drawTransition(ctx);
  }
};
})();
