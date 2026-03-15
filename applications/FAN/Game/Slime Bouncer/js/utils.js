/* ══════════════════════════════════════════════
   Slime Bouncer — Utilities
   ═════════════════════════════════════════════ */
'use strict';
const SB = window.SB || (window.SB = {});

SB.TILE = 16;
SB.W = 800;
SB.H = 500;

// Tile type constants
SB.T = {
  AIR: 0, GRASS: 1, DIRT: 2, STONE: 3,
  QBLOCK: 4, BRICK: 5, PLATFORM: 6, SPIKE: 7,
  SPRING: 8, CHECKPOINT: 9, EXIT: 10,
  WATER_TOP: 11, WATER: 12, LADDER: 13,
  INVIS_BLOCK: 14, EMPTY_BLOCK: 15,
  LOG: 16, LEAF: 17, MUSHROOM: 18
};

SB.SOLID_TILES = new Set([
  SB.T.GRASS, SB.T.DIRT, SB.T.STONE,
  SB.T.QBLOCK, SB.T.BRICK, SB.T.EMPTY_BLOCK,
  SB.T.LOG, SB.T.MUSHROOM
]);

SB.Utils = {
  clamp(v, min, max) { return v < min ? min : v > max ? max : v; },
  lerp(a, b, t) { return a + (b - a) * t; },
  randInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; },
  randFloat(min, max) { return Math.random() * (max - min) + min; },
  dist(x1, y1, x2, y2) { return Math.hypot(x2 - x1, y2 - y1); },

  // AABB overlap test (supports both object and 8-arg form)
  aabb(ax, ay, aw, ah, bx, by, bw, bh) {
    // If called with 2 objects: aabb({x,y,w,h}, {x,y,w,h})
    if (typeof ax === 'object') {
      const a = ax, b = ay;
      return a.x < b.x + b.w && a.x + a.w > b.x &&
             a.y < b.y + b.h && a.y + a.h > b.y;
    }
    // 8-argument form: aabb(ax,ay,aw,ah, bx,by,bw,bh)
    return ax < bx + bw && ax + aw > bx &&
           ay < by + bh && ay + ah > by;
  },

  // Check if 'a' is stomping 'b' (coming from above)
  isStomping(a, b) {
    const ah = a.hitH || a.h;
    return a.vy > 0 &&
           (a.y + ah) >= b.y &&
           (a.y + ah) <= b.y + b.h * 0.4 &&
           a.x + (a.hitW || a.w) > b.x && a.x < b.x + b.w;
  },

  // Create offscreen canvas with pixel art
  createSprite(w, h, drawFn) {
    const c = document.createElement('canvas');
    c.width = w; c.height = h;
    const ctx = c.getContext('2d');
    ctx.imageSmoothingEnabled = false;
    drawFn(ctx, w, h);
    return c;
  },

  // Draw single pixel
  px(ctx, x, y, color) {
    ctx.fillStyle = color;
    ctx.fillRect(x, y, 1, 1);
  },

  // Draw pixel array: [[color, x, y], ...]
  drawPixels(ctx, pixels) {
    for (const [color, x, y, w, h] of pixels) {
      ctx.fillStyle = color;
      ctx.fillRect(x, y, w || 1, h || 1);
    }
  }
};
