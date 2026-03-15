/* ══════════════════════════════════════════════
   Slime Bouncer — Level System + World 1 Data
   Tilemap, level loading, tile rendering
   ═════════════════════════════════════════════ */
'use strict';
(function() {
const SB = window.SB || (window.SB = {});
const T = SB.T;

// ── Tilemap ──
class Tilemap {
  constructor(w, h) {
    this.w = w; this.h = h;
    this.data = new Uint8Array(w * h);
  }
  get(x, y) {
    if (x < 0 || x >= this.w || y < 0) return T.STONE;
    if (y >= this.h) return T.AIR; // fall through bottom = death
    return this.data[y * this.w + x];
  }
  set(x, y, v) {
    if (x >= 0 && x < this.w && y >= 0 && y < this.h) this.data[y * this.w + x] = v;
  }
}

// ── Parse level string into tilemap ──
// Each char maps to a tile type
const CHAR_MAP = {
  '.': T.AIR, 'G': T.GRASS, 'D': T.DIRT, 'S': T.STONE,
  '?': T.QBLOCK, 'B': T.BRICK, '=': T.PLATFORM, '^': T.SPIKE,
  'o': T.SPRING, 'F': T.CHECKPOINT, 'E': T.EXIT,
  '~': T.WATER_TOP, 'w': T.WATER, 'H': T.LADDER,
  'I': T.INVIS_BLOCK, 'X': T.EMPTY_BLOCK,
  'L': T.LOG, 'l': T.LEAF, 'M': T.MUSHROOM
};

function parseLevel(rows) {
  const h = rows.length;
  const w = rows[0].length;
  const tm = new Tilemap(w, h);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const ch = rows[y][x] || '.';
      tm.set(x, y, CHAR_MAP[ch] !== undefined ? CHAR_MAP[ch] : T.AIR);
    }
  }
  return tm;
}

// ── Tile Colors ──
const TILE_COLORS = {
  [T.GRASS]:      ['#4aba4a', '#3a9a3a'],
  [T.DIRT]:       ['#8B6914', '#7a5c10'],
  [T.STONE]:      ['#808080', '#707070'],
  [T.QBLOCK]:     ['#f1c40f', '#d4a017'],
  [T.BRICK]:      ['#c0392b', '#a93226'],
  [T.PLATFORM]:   ['#8e7650', '#7d6842'],
  [T.SPIKE]:      ['#c0392b', '#888'],
  [T.SPRING]:     ['#e91e63', '#c2185b'],
  [T.CHECKPOINT]: ['#e74c3c', '#c0392b'],
  [T.EXIT]:       ['#f39c12', '#d68910'],
  [T.LOG]:        ['#6d4c2e', '#5a3d22'],
  [T.LEAF]:       ['#27ae60', '#219a52'],
  [T.MUSHROOM]:   ['#e74c3c', '#fff'],
  [T.EMPTY_BLOCK]:['#95a5a6', '#7f8c8d'],
  [T.WATER_TOP]:  ['rgba(52,152,219,0.5)', 'rgba(41,128,185,0.5)'],
  [T.WATER]:      ['rgba(52,152,219,0.35)', 'rgba(41,128,185,0.35)']
};

function drawTile(ctx, tileType, sx, sy) {
  const colors = TILE_COLORS[tileType];
  if (!colors) return;
  const S = SB.TILE;
  const world = (SB.Save.data && SB.Save.data.currentWorld) || 1;

  switch (tileType) {
    case T.GRASS:
      if (world === 2) {
        // Desert sand surface
        ctx.fillStyle = '#d4a84a';
        ctx.fillRect(sx, sy, S, S);
        ctx.fillStyle = '#c49a3a';
        ctx.fillRect(sx, sy + 3, S, S - 3);
        ctx.fillStyle = '#b48a2a';
        ctx.fillRect(sx + 4, sy + 8, 2, 2);
        ctx.fillRect(sx + 11, sy + 12, 3, 1);
        // Sand top
        ctx.fillStyle = '#e8c860';
        ctx.fillRect(sx, sy, S, 4);
        ctx.fillStyle = '#f0d870';
        ctx.fillRect(sx, sy, S, 2);
        // Sand grains
        ctx.fillStyle = '#c49a3a';
        ctx.fillRect(sx + 2, sy, 1, 1);
        ctx.fillRect(sx + 7, sy + 1, 1, 1);
        ctx.fillRect(sx + 12, sy, 1, 1);
      } else if (world === 3) {
        // Ice/snow surface
        ctx.fillStyle = '#a0c8d8';
        ctx.fillRect(sx, sy, S, S);
        ctx.fillStyle = '#88b8cc';
        ctx.fillRect(sx, sy + 3, S, S - 3);
        // Snow top
        ctx.fillStyle = '#e8f0f4';
        ctx.fillRect(sx, sy, S, 5);
        ctx.fillStyle = '#f0f8ff';
        ctx.fillRect(sx, sy, S, 2);
        // Ice sparkles
        ctx.fillStyle = 'rgba(255,255,255,0.6)';
        ctx.fillRect(sx + 3, sy + 1, 1, 1);
        ctx.fillRect(sx + 10, sy, 1, 1);
        ctx.fillRect(sx + 6, sy + 6, 1, 1);
      } else if (world === 4) {
        // Dark castle stone surface
        ctx.fillStyle = '#3a2a4e';
        ctx.fillRect(sx, sy, S, S);
        ctx.fillStyle = '#2a1a3e';
        ctx.fillRect(sx, sy + 3, S, S - 3);
        // Purple-tinted top
        ctx.fillStyle = '#5a4a6e';
        ctx.fillRect(sx, sy, S, 4);
        ctx.fillStyle = '#6c5ce7';
        ctx.fillRect(sx, sy, S, 2);
        // Cracks
        ctx.fillStyle = '#1a0a2e';
        ctx.fillRect(sx + 4, sy + 7, 2, 1);
        ctx.fillRect(sx + 10, sy + 10, 3, 1);
      } else {
        // Default forest grass (World 1)
        ctx.fillStyle = '#7a5c10';
        ctx.fillRect(sx, sy, S, S);
        ctx.fillStyle = '#8B6914';
        ctx.fillRect(sx, sy + 3, S, S - 3);
        ctx.fillStyle = '#6d4c0e';
        ctx.fillRect(sx + 3, sy + 7, 2, 2);
        ctx.fillRect(sx + 10, sy + 11, 3, 2);
        ctx.fillRect(sx + 6, sy + 5, 2, 1);
        ctx.fillStyle = '#4aba4a';
        ctx.fillRect(sx, sy, S, 5);
        ctx.fillStyle = '#5cd65c';
        ctx.fillRect(sx, sy, S, 2);
        ctx.fillStyle = '#6be86b';
        ctx.fillRect(sx + 1, sy - 1, 1, 2);
        ctx.fillRect(sx + 5, sy - 1, 1, 2);
        ctx.fillRect(sx + 9, sy - 1, 1, 2);
        ctx.fillRect(sx + 13, sy - 1, 1, 2);
      }
      break;
    case T.DIRT:
      if (world === 2) {
        ctx.fillStyle = '#c49a3a';
        ctx.fillRect(sx, sy, S, S);
        ctx.fillStyle = '#b48a2a';
        ctx.fillRect(sx + 2, sy + 3, 3, 3);
        ctx.fillRect(sx + 10, sy + 8, 4, 3);
        ctx.fillStyle = '#d4a84a';
        ctx.fillRect(sx, sy, S, 1);
      } else if (world === 3) {
        ctx.fillStyle = '#88b8cc';
        ctx.fillRect(sx, sy, S, S);
        ctx.fillStyle = '#78a8bc';
        ctx.fillRect(sx + 2, sy + 3, 3, 3);
        ctx.fillRect(sx + 10, sy + 8, 4, 3);
        ctx.fillStyle = 'rgba(255,255,255,0.15)';
        ctx.fillRect(sx + 5, sy + 5, 2, 2);
        ctx.fillRect(sx + 12, sy + 3, 1, 1);
      } else if (world === 4) {
        ctx.fillStyle = '#2a1a3e';
        ctx.fillRect(sx, sy, S, S);
        ctx.fillStyle = '#1a0a2e';
        ctx.fillRect(sx + 2, sy + 3, 3, 3);
        ctx.fillRect(sx + 10, sy + 8, 4, 3);
        ctx.fillStyle = '#3a2a4e';
        ctx.fillRect(sx, sy, S, 1);
      } else {
        ctx.fillStyle = '#8B6914';
        ctx.fillRect(sx, sy, S, S);
        ctx.fillStyle = '#7a5c10';
        ctx.fillRect(sx + 2, sy + 3, 3, 3);
        ctx.fillRect(sx + 10, sy + 8, 4, 3);
        ctx.fillRect(sx + 6, sy + 12, 2, 2);
        ctx.fillStyle = '#9a7918';
        ctx.fillRect(sx, sy, S, 1);
      }
      break;
    case T.QBLOCK:
      // Golden block with rounded feel
      ctx.fillStyle = '#f1c40f';
      ctx.fillRect(sx, sy, S, S);
      // Darker edges
      ctx.fillStyle = '#d4a017';
      ctx.fillRect(sx, sy + S - 2, S, 2);
      ctx.fillRect(sx + S - 2, sy, 2, S);
      // Highlight top-left
      ctx.fillStyle = '#ffe066';
      ctx.fillRect(sx, sy, S, 2);
      ctx.fillRect(sx, sy, 2, S);
      // ? mark centered
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 12px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('?', sx + S / 2, sy + S - 3);
      ctx.textAlign = 'left';
      // Inner border
      ctx.strokeStyle = '#b8860b';
      ctx.lineWidth = 1;
      ctx.strokeRect(sx + 1.5, sy + 1.5, S - 3, S - 3);
      // Sparkle
      ctx.fillStyle = 'rgba(255,255,255,0.6)';
      ctx.fillRect(sx + 3, sy + 3, 2, 2);
      break;
    case T.BRICK:
      ctx.fillStyle = '#c0392b';
      ctx.fillRect(sx, sy, S, S);
      // Brick pattern
      ctx.fillStyle = '#a93226';
      ctx.fillRect(sx, sy + 7, S, 1);
      ctx.fillRect(sx + 7, sy, 1, 7);
      ctx.fillRect(sx + 3, sy + 8, 1, 8);
      ctx.fillRect(sx + 11, sy + 8, 1, 8);
      // Highlights
      ctx.fillStyle = '#d44637';
      ctx.fillRect(sx + 1, sy + 1, 5, 1);
      ctx.fillRect(sx + 9, sy + 1, 5, 1);
      ctx.fillRect(sx + 1, sy + 9, 1, 1);
      ctx.fillRect(sx + 5, sy + 9, 5, 1);
      break;
    case T.PLATFORM:
      // Wooden platform with grain
      ctx.fillStyle = '#8e7650';
      ctx.fillRect(sx, sy, S, 6);
      ctx.fillStyle = '#a08860';
      ctx.fillRect(sx, sy, S, 2);
      ctx.fillStyle = '#7d6842';
      ctx.fillRect(sx, sy + 4, S, 2);
      // Wood grain dots
      ctx.fillStyle = '#6d5832';
      ctx.fillRect(sx + 3, sy + 2, 1, 1);
      ctx.fillRect(sx + 10, sy + 3, 1, 1);
      break;
    case T.SPIKE:
      // Modern spike triangles
      ctx.fillStyle = '#888';
      ctx.fillRect(sx, sy + 12, S, 4);
      ctx.fillStyle = '#c0392b';
      for (let i = 0; i < 4; i++) {
        const tx = sx + i * 4;
        ctx.beginPath();
        ctx.moveTo(tx, sy + 12);
        ctx.lineTo(tx + 2, sy + 3);
        ctx.lineTo(tx + 4, sy + 12);
        ctx.fill();
      }
      // Highlight on tips
      ctx.fillStyle = '#e74c3c';
      for (let i = 0; i < 4; i++) {
        ctx.fillRect(sx + i * 4 + 1, sy + 4, 1, 2);
      }
      break;
    case T.SPRING:
      // Coil spring
      ctx.fillStyle = '#c2185b';
      ctx.fillRect(sx + 3, sy + 10, 10, 6);
      ctx.fillStyle = '#e91e63';
      ctx.fillRect(sx + 2, sy + 8, 12, 3);
      ctx.fillStyle = '#f48fb1';
      ctx.fillRect(sx + 4, sy + 5, 8, 3);
      ctx.fillRect(sx + 5, sy + 3, 6, 2);
      // Top platform
      ctx.fillStyle = '#ff80ab';
      ctx.fillRect(sx + 3, sy + 3, 10, 2);
      // Coil lines
      ctx.fillStyle = '#ad1457';
      ctx.fillRect(sx + 4, sy + 11, 8, 1);
      ctx.fillRect(sx + 5, sy + 13, 6, 1);
      break;
    case T.CHECKPOINT:
      // Flag with pole
      ctx.fillStyle = '#888';
      ctx.fillRect(sx + 7, sy + 2, 2, S - 2);
      // Flag (waving)
      ctx.fillStyle = '#e74c3c';
      ctx.beginPath();
      ctx.moveTo(sx + 9, sy + 2);
      ctx.lineTo(sx + 15, sy + 4);
      ctx.lineTo(sx + 9, sy + 8);
      ctx.fill();
      // Pole base
      ctx.fillStyle = '#666';
      ctx.fillRect(sx + 5, sy + S - 3, 6, 3);
      break;
    case T.EXIT:
      // Boss levels: hide exit until boss defeated, then show finish flag
      if (SB.boss && !SB.boss.defeated) {
        // Hidden — do not draw exit
        break;
      }
      if (SB.boss && SB.boss.defeated) {
        // Finish flag (checkered) for boss levels
        const flagT = (SB.UI.animTime || 0);
        ctx.fillStyle = '#ddd';
        ctx.fillRect(sx + 7, sy, 2, S);
        // Checkered flag
        const wave = Math.sin(flagT * 4) * 1.5;
        for (let fy = 0; fy < 3; fy++) {
          for (let fx = 0; fx < 3; fx++) {
            ctx.fillStyle = (fx + fy) % 2 === 0 ? '#111' : '#fff';
            ctx.fillRect(sx + 9 + fx * 3, sy + 1 + fy * 3 + wave * (fx * 0.3), 3, 3);
          }
        }
        // Pole top ball
        ctx.fillStyle = '#f1c40f';
        ctx.beginPath(); ctx.arc(sx + 8, sy, 2, 0, Math.PI * 2); ctx.fill();
        // Glow
        ctx.fillStyle = 'rgba(241,196,15,0.3)';
        ctx.fillRect(sx, sy, S, S);
      } else {
        // Normal exit door
        ctx.fillStyle = '#d68910';
        ctx.fillRect(sx + 2, sy, 12, S);
        ctx.fillStyle = '#f39c12';
        ctx.fillRect(sx + 3, sy + 1, 10, S - 1);
        ctx.fillStyle = '#e67e22';
        ctx.fillRect(sx + 4, sy + 2, 8, 6);
        ctx.fillRect(sx + 4, sy + 10, 8, 4);
        ctx.fillStyle = '#fff';
        ctx.fillRect(sx + 10, sy + 8, 2, 2);
        ctx.fillStyle = '#b8720e';
        ctx.fillRect(sx + 2, sy, 12, 2);
        ctx.fillStyle = 'rgba(243,156,18,0.3)';
        ctx.fillRect(sx, sy, S, S);
      }
      break;
    case T.EMPTY_BLOCK:
      ctx.fillStyle = '#7f8c8d';
      ctx.fillRect(sx, sy, S, S);
      ctx.fillStyle = '#95a5a6';
      ctx.fillRect(sx + 1, sy + 1, S - 2, S - 2);
      ctx.fillStyle = '#6d7b7c';
      ctx.fillRect(sx + S - 2, sy + 2, 2, S - 2);
      ctx.fillRect(sx + 2, sy + S - 2, S - 2, 2);
      break;
    case T.LOG:
      ctx.fillStyle = colors[0];
      ctx.fillRect(sx, sy, S, S);
      ctx.fillStyle = colors[1];
      ctx.fillRect(sx + 3, sy + 3, 2, 3);
      ctx.fillRect(sx + 8, sy + 7, 3, 3);
      ctx.fillRect(sx + 12, sy + 2, 2, 2);
      // Bark lines
      ctx.fillStyle = '#5a3d22';
      ctx.fillRect(sx, sy + 5, S, 1);
      ctx.fillRect(sx, sy + 11, S, 1);
      break;
    case T.LEAF:
      ctx.fillStyle = colors[0];
      ctx.fillRect(sx, sy, S, S);
      ctx.fillStyle = '#1abc9c';
      ctx.fillRect(sx + 2, sy + 2, 4, 4);
      ctx.fillRect(sx + 9, sy + 6, 5, 5);
      // Leaf veins
      ctx.fillStyle = '#16a085';
      ctx.fillRect(sx + 3, sy + 4, 2, 1);
      ctx.fillRect(sx + 11, sy + 8, 2, 1);
      break;
    case T.MUSHROOM:
      ctx.fillStyle = colors[0]; // red cap
      ctx.fillRect(sx + 2, sy, S - 4, 8);
      ctx.fillStyle = '#fff';
      ctx.fillRect(sx + 4, sy + 2, 3, 3);
      ctx.fillRect(sx + 9, sy + 1, 2, 2);
      // Stem
      ctx.fillStyle = '#f5f0e0';
      ctx.fillRect(sx + 5, sy + 8, 6, 8);
      break;
    default: {
      ctx.fillStyle = colors[0];
      ctx.fillRect(sx, sy, S, S);
      break;
    }
  }
}

// ══════ WORLD 1 — EMERALD FOREST LEVELS ══════
// 31 rows high (496px), variable width
// Row 0 = top, Row 30 = bottom
// Ground level at row ~27 (y = 432)

function makeRow(pattern, width) {
  let row = '';
  for (let i = 0; i < width; i++) row += pattern[i % pattern.length];
  return row.substring(0, width);
}
function airRow(w) { return '.'.repeat(w); }
function groundRow(w) { return 'G'.repeat(w); }
function dirtRow(w) { return 'D'.repeat(w); }

function addTree(put, x, base) {
  if (base === undefined) base = 27;
  put(x, base-3, 'M');
  put(x-1, base-2, 'MMM');
  put(x, base-1, 'L');
  put(x, base, 'L');
}

// ── Level 1-1: Tutorial (200 tiles = 3200px) ──
function buildLevel1_1() {
  const W = 200, H = 31;
  const rows = [];
  for (let r = 0; r < H; r++) rows.push('.'.repeat(W));

  // Helper to set chars
  function put(x, y, str) {
    if (y < 0 || y >= H) return;
    const arr = rows[y].split('');
    for (let i = 0; i < str.length && x + i < W; i++) {
      if (x + i >= 0) arr[x + i] = str[i];
    }
    rows[y] = arr.join('');
  }
  function fillRect(x1, y1, x2, y2, ch) {
    for (let y = y1; y <= y2; y++) for (let x = x1; x <= x2; x++) put(x, y, ch);
  }

  // Ground (row 28 = grass, 29-30 = dirt)
  fillRect(0, 28, 199, 28, 'G');
  fillRect(0, 29, 199, 29, 'D');
  fillRect(0, 30, 199, 30, 'D');

  // Gap (small pit, row 28-30 cleared) at x=55-58
  fillRect(55, 28, 58, 30, '.');

  // Bigger gap at x=120-126
  fillRect(120, 28, 126, 30, '.');

  // Platforms for tutorial jumping
  put(30, 25, '===');
  put(36, 22, '===');
  put(42, 19, '===');

  // ? Blocks
  put(34, 22, '?');
  put(48, 16, '?');
  put(80, 24, '??');

  // Coins (represented as items, not tiles) — spawned via entity list

  // Checkpoint
  put(100, 27, 'F');

  // Hidden block
  put(65, 22, 'I');

  // Moving platforms section
  put(130, 24, '===');
  put(138, 21, '===');

  // More ? blocks
  put(155, 24, '?');
  put(160, 24, '?');

  // Exit
  put(195, 27, 'E');

  // Small platforming section with wall
  fillRect(85, 23, 87, 27, 'S');
  put(85, 22, 'G');
  put(86, 22, 'G');
  put(87, 22, 'G');

  return { rows, w: W, h: H };
}

// ── Level 1-2: First Enemies (250 tiles) ──
function buildLevel1_2() {
  const W = 250, H = 31;
  const rows = [];
  for (let r = 0; r < H; r++) rows.push('.'.repeat(W));

  function put(x, y, str) {
    if (y < 0 || y >= H) return;
    const arr = rows[y].split('');
    for (let i = 0; i < str.length && x + i < W; i++) if (x + i >= 0) arr[x + i] = str[i];
    rows[y] = arr.join('');
  }
  function fillRect(x1, y1, x2, y2, ch) {
    for (let y = y1; y <= y2; y++) for (let x = x1; x <= x2; x++) put(x, y, ch);
  }

  // Ground
  fillRect(0, 28, 249, 28, 'G');
  fillRect(0, 29, 249, 29, 'D');
  fillRect(0, 30, 249, 30, 'D');

  // Gaps
  fillRect(60, 28, 64, 30, '.');
  fillRect(130, 28, 136, 30, '.');
  fillRect(180, 28, 185, 30, '.');

  // Platforms
  put(62, 25, '====');
  put(100, 24, '===');
  put(110, 21, '===');
  put(132, 25, '====');
  put(182, 24, '====');

  // ? Blocks
  put(50, 23, '?');
  put(95, 22, '??');
  put(150, 23, '?');
  put(200, 24, '?');

  // Brick blocks
  put(92, 22, 'BBB');
  put(148, 23, 'BB');

  // Spikes
  put(170, 27, '^^^');

  // Checkpoints
  put(80, 27, 'F');
  put(160, 27, 'F');

  // Walls
  fillRect(75, 24, 76, 27, 'S');
  put(75, 23, 'GG');
  fillRect(115, 22, 117, 27, 'S');
  put(115, 21, 'GGG');

  // Exit
  put(245, 27, 'E');

  return { rows, w: W, h: H };
}

// ── Level 1-3: Caves and Secrets (300 tiles) ──
function buildLevel1_3() {
  const W = 300, H = 31;
  const rows = [];
  for (let r = 0; r < H; r++) rows.push('.'.repeat(W));

  function put(x, y, str) {
    if (y < 0 || y >= H) return;
    const arr = rows[y].split('');
    for (let i = 0; i < str.length && x + i < W; i++) if (x + i >= 0) arr[x + i] = str[i];
    rows[y] = arr.join('');
  }
  function fillRect(x1, y1, x2, y2, ch) {
    for (let y = y1; y <= y2; y++) for (let x = x1; x <= x2; x++) put(x, y, ch);
  }

  // Ground
  fillRect(0, 28, 299, 28, 'G');
  fillRect(0, 29, 299, 29, 'D');
  fillRect(0, 30, 299, 30, 'D');

  // Elevated sections
  fillRect(40, 25, 55, 25, 'G');
  fillRect(40, 26, 55, 27, 'D');

  fillRect(100, 22, 120, 22, 'G');
  fillRect(100, 23, 120, 27, 'D');

  // Gaps
  fillRect(70, 28, 76, 30, '.');
  fillRect(140, 28, 148, 30, '.');
  fillRect(200, 28, 208, 30, '.');
  fillRect(250, 28, 256, 30, '.');

  // Platforms
  put(72, 24, '===');
  put(78, 21, '===');
  put(142, 25, '===');
  put(148, 22, '===');
  put(202, 25, '===');
  put(208, 22, '===');
  put(252, 24, '====');

  // ? Blocks and bricks
  put(45, 21, '?B?');
  put(110, 18, '??');
  put(155, 22, 'B?B');
  put(230, 24, '?');

  // Spikes
  put(160, 27, '^^^^');
  put(220, 27, '^^');

  // Springs
  put(90, 27, 'o');
  put(240, 27, 'o');

  // Checkpoints
  put(85, 27, 'F');
  put(175, 27, 'F');
  put(260, 27, 'F');

  // Exit
  put(295, 27, 'E');

  // Hidden blocks (secrets)
  put(75, 18, 'I');
  put(205, 18, 'I');

  return { rows, w: W, h: H };
}

// ── Level 1-4: Forest Gauntlet (350 tiles) ──
function buildLevel1_4() {
  const W = 350, H = 31;
  const rows = [];
  for (let r = 0; r < H; r++) rows.push('.'.repeat(W));

  function put(x, y, str) {
    if (y < 0 || y >= H) return;
    const arr = rows[y].split('');
    for (let i = 0; i < str.length && x + i < W; i++) if (x + i >= 0) arr[x + i] = str[i];
    rows[y] = arr.join('');
  }
  function fillRect(x1, y1, x2, y2, ch) {
    for (let y = y1; y <= y2; y++) for (let x = x1; x <= x2; x++) put(x, y, ch);
  }

  // Ground
  fillRect(0, 28, 349, 28, 'G');
  fillRect(0, 29, 349, 29, 'D');
  fillRect(0, 30, 349, 30, 'D');

  // Many gaps (challenging platforming)
  fillRect(50, 28, 56, 30, '.');
  fillRect(80, 28, 88, 30, '.');
  fillRect(120, 28, 130, 30, '.');
  fillRect(160, 28, 168, 30, '.');
  fillRect(200, 28, 210, 30, '.');
  fillRect(250, 28, 260, 30, '.');
  fillRect(290, 28, 298, 30, '.');

  // Elevated sections with enemies
  fillRect(60, 24, 75, 24, 'G');
  fillRect(60, 25, 75, 27, 'D');

  fillRect(140, 22, 155, 22, 'G');
  fillRect(140, 23, 155, 27, 'D');

  fillRect(215, 24, 240, 24, 'G');
  fillRect(215, 25, 240, 27, 'D');

  // Platforms
  put(52, 25, '===');
  put(82, 24, '====');
  put(90, 21, '===');
  put(122, 24, '===');
  put(128, 21, '===');
  put(162, 24, '====');
  put(168, 21, '===');
  put(202, 25, '====');
  put(210, 22, '===');
  put(252, 24, '===');
  put(258, 21, '===');
  put(292, 25, '====');
  put(298, 22, '===');

  // ? Blocks
  put(55, 20, '?');
  put(125, 18, '??');
  put(165, 20, '?');
  put(255, 18, '?');
  put(300, 20, '?');

  // Spikes
  put(135, 27, '^^^');
  put(180, 27, '^^^^');
  put(270, 27, '^^^');

  // Springs
  put(95, 27, 'o');
  put(175, 27, 'o');

  // Checkpoints
  put(100, 27, 'F');
  put(195, 27, 'F');
  put(305, 27, 'F');

  // Exit
  put(345, 27, 'E');

  return { rows, w: W, h: H };
}

// ── Level 1-5: Thornback Boss (350 tiles + boss arena) ──
function buildLevel1_5() {
  const W = 350, H = 31;
  const rows = [];
  for (let r = 0; r < H; r++) rows.push('.'.repeat(W));

  function put(x, y, str) {
    if (y < 0 || y >= H) return;
    const arr = rows[y].split('');
    for (let i = 0; i < str.length && x + i < W; i++) if (x + i >= 0) arr[x + i] = str[i];
    rows[y] = arr.join('');
  }
  function fillRect(x1, y1, x2, y2, ch) {
    for (let y = y1; y <= y2; y++) for (let x = x1; x <= x2; x++) put(x, y, ch);
  }

  // Ground
  fillRect(0, 28, 349, 28, 'G');
  fillRect(0, 29, 349, 29, 'D');
  fillRect(0, 30, 349, 30, 'D');

  // Pre-boss section (short gauntlet)
  fillRect(60, 28, 66, 30, '.');
  fillRect(100, 28, 108, 30, '.');
  put(62, 24, '===');
  put(102, 25, '====');
  put(50, 22, '?');
  put(90, 23, '?B?');

  // Spikes
  put(120, 27, '^^');

  // Checkpoint before boss
  put(130, 27, 'F');

  // Item room before boss
  put(140, 24, '?');
  put(145, 24, '?');

  // ── BOSS ARENA: x=200 to x=250 ── (800px = exactly one screen width)
  // No left wall — player enters freely from left side
  // Ceiling for atmosphere
  fillRect(200, 0, 250, 2, 'S');
  // Right wall — blocks player escaping right
  fillRect(250, 0, 250, 27, 'S');

  // Boss platforms: staircase lets player jump up to boss at y=10*16=160
  put(204, 24, '======');   // low-left:   screen x=64,  y=384
  put(237, 22, '=====');    // low-right:  screen x=592, y=352
  put(211, 20, '=====');    // mid-left:   screen x=176, y=320
  put(239, 18, '====');     // high-right: screen x=624, y=288
  put(220, 15, '=====');    // top-center: screen x=320, y=240 (near boss)

  // Exit (visible at screen x=736 when camera locked at 3200)
  put(246, 27, 'E');

  return { rows, w: W, h: H, bossArenaX: 200 };
}

// ── Entity spawn definitions ──
const LEVEL_ENTITIES = {
  '1-1': {
    spawn: [32, 416],
    coins: [
      // Trail 1 — tutorial path
      [80,420,'gold'],[96,420,'gold'],[112,420,'gold'],[128,420,'gold'],[144,420,'gold'],
      [260,420,'gold'],[276,420,'gold'],[292,420,'gold'],
      // Above platform section
      [504,380,'gold'],[520,380,'gold'],[536,380,'gold'],
      [592,340,'gold'],[608,340,'gold'],
      [688,300,'gold'],
      // Trail 2 
      [800,420,'gold'],[816,420,'gold'],[832,420,'gold'],[848,420,'gold'],
      [1000,420,'gold'],[1016,420,'gold'],[1032,420,'gold'],
      // Near Q-blocks (above them)
      [1280,360,'gold'],[1296,360,'gold'],
      [1360,320,'gold'],[1376,320,'gold'],
      // Trail 3
      [1500,420,'gold'],[1516,420,'gold'],[1532,420,'gold'],
      [1700,420,'gold'],[1716,420,'gold'],[1732,420,'gold'],
      [1800,420,'gold'],[1816,420,'gold'],[1832,420,'gold'],
      // Aerial path
      [2080,380,'gold'],[2096,380,'gold'],[2112,380,'gold'],
      [2480,360,'gold'],[2496,360,'gold'],
      [2700,420,'gold'],[2716,420,'gold'],[2732,420,'gold'],
      [2900,420,'gold'],[2916,420,'gold'],
      // Red coins (hidden)
      [1060,300,'red'],[2200,300,'red'],
      // Ancient coin
      [3100,416,'ancient']
    ],
    enemies: [],
    powerups: []
  },
  '1-2': {
    spawn: [32, 416],
    coins: [
      [200,420,'gold'],[216,420,'gold'],[232,420,'gold'],[248,420,'gold'],
      [400,420,'gold'],[416,420,'gold'],[432,420,'gold'],
      [500,420,'gold'],[516,420,'gold'],
      // Above Q-blocks (not inside them)
      [800,348,'gold'],[816,348,'gold'],[832,348,'gold'],
      [1000,420,'gold'],[1016,420,'gold'],[1032,420,'gold'],
      [1200,340,'gold'],[1216,340,'gold'],[1232,340,'gold'],
      [1600,360,'gold'],[1616,360,'gold'],[1632,360,'gold'],
      [1700,320,'gold'],[1716,320,'gold'],
      [1900,420,'gold'],[1916,420,'gold'],
      [2000,420,'gold'],[2016,420,'gold'],[2032,420,'gold'],
      [2200,420,'gold'],[2216,420,'gold'],
      [2400,340,'gold'],[2416,340,'gold'],
      [2600,420,'gold'],[2616,420,'gold'],
      [2800,420,'gold'],[2816,420,'gold'],[2832,420,'gold'],
      // Above Q-block (was inside — fixed)
      [3200,364,'gold'],[3216,364,'gold'],
      [3500,420,'gold'],[3516,420,'gold'],
      [900,340,'red'],[1800,300,'red'],[2900,300,'red'],
      [3900,416,'ancient']
    ],
    enemies: [
      [350, 420, 'red_slime'],
      [550, 420, 'green_goblin'],
      [700, 420, 'red_slime'],
      [1100, 420, 'angry_berry'],
      [1400, 420, 'red_slime'],
      [1800, 420, 'green_goblin'],
      [2100, 420, 'angry_berry'],
      [2400, 420, 'red_slime'],
      [2600, 420, 'green_goblin'],
      [3000, 420, 'red_slime'],
      [3400, 420, 'angry_berry'],
    ],
    powerups: [[1500, 416, 'heart']]
  },
  '1-3': {
    spawn: [32, 416],
    coins: [
      [200,420,'gold'],[216,420,'gold'],[232,420,'gold'],
      [400,420,'gold'],[416,420,'gold'],
      [500,380,'gold'],[516,380,'gold'],[532,380,'gold'],
      [720,370,'gold'],[736,370,'gold'],[752,370,'gold'],
      [900,420,'gold'],[916,420,'gold'],
      [1000,420,'gold'],[1016,420,'gold'],[1032,420,'gold'],[1048,420,'gold'],
      [1200,330,'gold'],[1216,330,'gold'],[1232,330,'gold'],
      [1400,420,'gold'],[1416,420,'gold'],
      [1600,330,'gold'],[1616,330,'gold'],
      [1800,330,'gold'],[1816,330,'gold'],
      [2000,420,'gold'],[2016,420,'gold'],[2032,420,'gold'],
      [2200,420,'gold'],[2216,420,'gold'],
      [2480,370,'gold'],[2496,370,'gold'],
      [2700,420,'gold'],[2716,420,'gold'],
      [2800,370,'gold'],[2816,370,'gold'],
      [3000,420,'gold'],[3016,420,'gold'],
      [3200,380,'gold'],[3216,380,'gold'],[3232,380,'gold'],
      [3400,420,'gold'],[3416,420,'gold'],
      [3600,380,'gold'],[3616,380,'gold'],
      [3800,420,'gold'],[3816,420,'gold'],
      [1100,280,'red'],[2100,280,'red'],[3300,280,'red'],
      [4700,416,'ancient']
    ],
    enemies: [
      [300, 420, 'red_slime'],
      [500, 420, 'green_goblin'],
      [600, 386, 'angry_berry'],
      [850, 420, 'bush_mimic'],
      [1100, 340, 'poison_shroom'],
      [1350, 420, 'green_goblin'],
      [1500, 420, 'red_slime'],
      [1700, 360, 'tiny_bat'],
      [1900, 420, 'angry_berry'],
      [2150, 420, 'lurk_wolf'],
      [2300, 420, 'bush_mimic'],
      [2600, 420, 'green_goblin'],
      [2900, 420, 'poison_shroom'],
      [3100, 420, 'lurk_wolf'],
      [3500, 420, 'bush_mimic'],
    ],
    powerups: [[1400, 416, 'heart'],[2500, 416, 'speed']]
  },
  '1-4': {
    spawn: [32, 416],
    coins: [
      [200,420,'gold'],[216,420,'gold'],[232,420,'gold'],
      [400,420,'gold'],[416,420,'gold'],
      [500,380,'gold'],[516,380,'gold'],
      [800,370,'gold'],[816,370,'gold'],[832,370,'gold'],
      [1050,360,'gold'],[1066,360,'gold'],
      [1300,310,'gold'],[1316,310,'gold'],[1332,310,'gold'],
      [1600,420,'gold'],[1616,420,'gold'],
      [1700,370,'gold'],[1716,370,'gold'],
      [1900,420,'gold'],[1916,420,'gold'],
      [2000,420,'gold'],[2016,420,'gold'],[2032,420,'gold'],
      [2200,420,'gold'],[2216,420,'gold'],
      [2400,330,'gold'],[2416,330,'gold'],
      [2600,420,'gold'],[2616,420,'gold'],
      [2700,370,'gold'],[2716,370,'gold'],[2732,370,'gold'],
      [2900,420,'gold'],[2916,420,'gold'],
      [3000,310,'gold'],[3016,310,'gold'],
      [3200,420,'gold'],[3216,420,'gold'],
      [3400,380,'gold'],[3416,380,'gold'],[3432,380,'gold'],
      [3600,420,'gold'],[3616,420,'gold'],
      [3800,370,'gold'],[3816,370,'gold'],
      [4100,310,'gold'],[4116,310,'gold'],
      [4300,420,'gold'],[4316,420,'gold'],
      [4500,380,'gold'],[4516,380,'gold'],
      [4800,420,'gold'],[4816,420,'gold'],[4832,420,'gold'],
      [1800,280,'red'],[2800,280,'red'],[4000,280,'red'],
      [5500,416,'ancient']
    ],
    enemies: [
      [300, 420, 'green_goblin'],
      [450, 420, 'angry_berry'],
      [500, 376, 'red_slime'],
      [750, 420, 'bush_mimic'],
      [1000, 420, 'tiny_bat'],
      [1200, 420, 'green_goblin'],
      [1500, 340, 'poison_shroom'],
      [1700, 420, 'bush_mimic'],
      [1900, 420, 'lurk_wolf'],
      [2100, 420, 'angry_berry'],
      [2350, 420, 'green_goblin'],
      [2500, 360, 'tiny_bat'],
      [2750, 420, 'bush_mimic'],
      [2900, 420, 'red_slime'],
      [3200, 420, 'angry_berry'],
      [3500, 340, 'poison_shroom'],
      [3700, 420, 'lurk_wolf'],
      [4000, 420, 'green_goblin'],
      [4300, 360, 'tiny_bat'],
      [4600, 420, 'bush_mimic']
    ],
    powerups: [[1600, 416, 'fire'],[3300, 416, 'heart']]
  },
  '1-5': {
    spawn: [32, 416],
    coins: [
      [200,420,'gold'],[216,420,'gold'],[232,420,'gold'],
      [400,420,'gold'],[416,420,'gold'],[432,420,'gold'],
      [600,420,'gold'],[616,420,'gold'],[632,420,'gold'],
      [850,420,'gold'],[866,420,'gold'],
      [1000,420,'gold'],[1016,420,'gold'],[1032,420,'gold'],
      [1300,420,'gold'],[1316,420,'gold'],
      [1500,420,'gold'],[1516,420,'gold'],[1532,420,'gold'],
      [1800,420,'gold'],[1816,420,'gold'],
      [2000,420,'gold'],[2016,420,'gold'],[2032,420,'gold'],
      [700,340,'red'],[1700,340,'red'],
    ],
    enemies: [
      [300, 420, 'green_goblin'],
      [500, 360, 'tiny_bat'],
      [700, 420, 'bush_mimic'],
      [800, 420, 'angry_berry'],
      [1100, 420, 'lurk_wolf'],
      [1400, 420, 'poison_shroom'],
      [1800, 420, 'green_goblin'],
    ],
    powerups: [[2240, 416, 'heart'], [2320, 416, 'heart']],
    boss: { type: 'thornback', x: 225 * 16, y: 10 * 16 }
  }
};

// ══════════════════════════════════════════════
// GENERIC LEVEL BUILDER — used by Worlds 2-4
// ══════════════════════════════════════════════
function buildGeneric(W, cfg) {
  const H = 31;
  const rows = [];
  for (let r = 0; r < H; r++) rows.push('.'.repeat(W));
  function put(x, y, str) {
    if (y < 0 || y >= H) return;
    const arr = rows[y].split('');
    for (let i = 0; i < str.length && x + i < W; i++) if (x + i >= 0) arr[x + i] = str[i];
    rows[y] = arr.join('');
  }
  function fill(x1, y1, x2, y2, ch) {
    for (let y = y1; y <= y2; y++) for (let x = x1; x <= x2; x++) put(x, y, ch);
  }
  // Ground
  fill(0, 28, W - 1, 28, 'G'); fill(0, 29, W - 1, 29, 'D'); fill(0, 30, W - 1, 30, 'D');
  // Apply config commands
  for (const c of (cfg.cmds || [])) {
    if (c[0] === 'gap') fill(c[1], 28, c[2], 30, '.');
    else if (c[0] === 'elev') { fill(c[1], c[2], c[3], c[2], 'G'); fill(c[1], c[2]+1, c[3], 27, 'D'); }
    else if (c[0] === 'stone') fill(c[1], c[2], c[3], c[4], 'S');
    else if (c[0] === 'plat') put(c[1], c[2], '='.repeat(c[3]));
    else if (c[0] === 'q') put(c[1], c[2], '?'.repeat(c[3] || 1));
    else if (c[0] === 'brick') put(c[1], c[2], 'B'.repeat(c[3] || 1));
    else if (c[0] === 'spike') put(c[1], c[2] || 27, '^'.repeat(c[3] || 3));
    else if (c[0] === 'spring') put(c[1], c[2] || 27, 'o');
    else if (c[0] === 'cp') put(c[1], c[2] || 27, 'F');
    else if (c[0] === 'exit') put(c[1], c[2] || 27, 'E');
    else if (c[0] === 'boss') {
      fill(c[1], 0, c[2], 2, 'S'); // ceiling
      fill(c[2], 0, c[2], 27, 'S'); // right wall
      for (const p of (c[3] || [])) put(p[0], p[1], '='.repeat(p[2]));
      put(c[2] - 4, 27, 'E');
    }
    else if (c[0] === 'tree') { /* trees now handled by background decoration system */ }
    else if (c[0] === 'mush') { /* mushrooms now handled by background decoration system */ }
  }
  const result = { rows, w: W, h: H };
  if (cfg.bossArenaX) result.bossArenaX = cfg.bossArenaX;
  return result;
}

// ══════ WORLD 2 — GOLDEN DESERT ══════
function buildLevel2_1() {
  return buildGeneric(220, { cmds: [
    ['gap',50,55],['gap',100,106],['gap',160,165],
    ['plat',52,25,4],['plat',102,24,4],['plat',162,25,3],
    ['q',45,23,1],['q',110,22,2],['q',170,24,1],
    ['spike',130,27,3],
    ['cp',80,27],['cp',140,27],
    ['exit',215,27],
    ['tree',10],['tree',30],['tree',65],['tree',110],['tree',145],['tree',180],['tree',205],
    ['mush',18],['mush',75]
  ]});
}
function buildLevel2_2() {
  return buildGeneric(260, { cmds: [
    ['gap',55,60],['gap',110,118],['gap',170,178],
    ['elev',65,24,80],['elev',125,22,140],
    ['plat',57,24,3],['plat',112,24,5],['plat',172,24,5],
    ['q',70,20,2],['q',130,18,1],['brick',132,18,2],
    ['spike',90,27,3],['spike',155,27,4],
    ['cp',85,27],['cp',150,27],
    ['exit',255,27],
    ['tree',10],['tree',30],['tree',90],['tree',195],['tree',230],['tree',250],
    ['tree',70,23],['tree',130,21],
    ['mush',20],['mush',200]
  ]});
}
function buildLevel2_3() {
  return buildGeneric(300, { cmds: [
    ['gap',60,67],['gap',130,140],['gap',200,210],['gap',250,258],
    ['elev',70,24,85],['elev',145,22,165],
    ['plat',62,24,4],['plat',132,24,6],['plat',140,21,3],['plat',202,24,5],['plat',210,21,4],['plat',252,24,5],
    ['q',75,20,2],['q',155,18,1],['q',225,22,1],
    ['brick',77,20,1],['brick',230,22,2],
    ['spike',100,27,3],['spike',180,27,4],['spike',270,27,3],
    ['spring',95,27],['spring',240,27],
    ['cp',90,27],['cp',175,27],['cp',260,27],
    ['exit',295,27],
    ['tree',10],['tree',30],['tree',55],['tree',100],['tree',175],['tree',220],['tree',265],['tree',285],
    ['tree',75,23],['tree',150,21],
    ['mush',15],['mush',225]
  ]});
}
function buildLevel2_4() {
  return buildGeneric(350, { cmds: [
    ['gap',50,58],['gap',90,100],['gap',130,140],['gap',170,180],['gap',210,220],['gap',260,270],['gap',300,308],
    ['elev',60,24,85],['elev',145,22,165],['elev',225,24,250],
    ['plat',52,24,4],['plat',92,24,5],['plat',100,21,3],['plat',132,24,5],['plat',140,21,3],
    ['plat',172,24,5],['plat',180,21,3],['plat',212,24,5],['plat',220,21,3],
    ['plat',262,24,4],['plat',270,21,3],['plat',302,24,5],
    ['q',55,20,1],['q',135,18,2],['q',175,20,1],['q',265,18,1],['q',310,20,1],
    ['spike',115,27,3],['spike',190,27,4],['spike',280,27,3],
    ['spring',105,27],['spring',185,27],
    ['cp',110,27],['cp',200,27],['cp',310,27],
    ['exit',345,27],
    ['tree',10],['tree',25],['tree',40],['tree',110],['tree',195],['tree',275],['tree',320],['tree',340],
    ['tree',70,23],['tree',150,21],['tree',235,23],
    ['mush',15],['mush',200]
  ]});
}
function buildLevel2_5() {
  return buildGeneric(350, { cmds: [
    ['gap',60,66],['gap',100,108],
    ['plat',62,24,3],['plat',102,25,4],
    ['q',50,22,1],['q',90,23,1],['brick',92,23,1],
    ['spike',120,27,2],['cp',130,27],
    ['q',140,24,1],['q',145,24,1],
    ['boss',200,250,[
      [204,24,6],[237,22,5],[211,20,5],[239,18,4],[220,15,5]
    ]],
    ['tree',10],['tree',25],['tree',45],['tree',70],['tree',85],['tree',110],['tree',135],['tree',155],['tree',175],['tree',190],
    ['mush',15],['mush',80]
  ], bossArenaX: 200});
}

// ══════ WORLD 3 — FROZEN SEA ══════
function buildLevel3_1() {
  return buildGeneric(220, { cmds: [
    ['gap',45,50],['gap',90,96],['gap',150,156],
    ['plat',47,25,3],['plat',92,24,4],['plat',152,25,4],
    ['q',40,22,1],['q',100,21,2],
    ['spike',120,27,2],
    ['cp',75,27],['cp',130,27],
    ['exit',215,27],
    ['tree',10],['tree',25],['tree',55],['tree',100],['tree',130],['tree',170],['tree',200],
    ['mush',15],['mush',110]
  ]});
}
function buildLevel3_2() {
  return buildGeneric(260, { cmds: [
    ['gap',50,56],['gap',100,110],['gap',160,170],
    ['elev',60,24,75],['elev',115,22,135],
    ['plat',52,24,3],['plat',102,24,5],['plat',110,21,4],['plat',162,24,5],['plat',170,21,3],
    ['q',65,20,2],['q',120,18,1],['brick',122,18,2],
    ['spike',85,27,3],['spike',145,27,3],
    ['spring',80,27],
    ['cp',78,27],['cp',140,27],
    ['exit',255,27],
    ['tree',10],['tree',30],['tree',90],['tree',195],['tree',240],
    ['tree',65,23],['tree',120,21],
    ['mush',20],['mush',200]
  ]});
}
function buildLevel3_3() {
  return buildGeneric(300, { cmds: [
    ['gap',55,62],['gap',120,130],['gap',190,200],['gap',240,250],
    ['elev',65,24,80],['elev',135,22,155],['elev',205,24,230],
    ['plat',57,24,4],['plat',122,24,5],['plat',130,21,4],['plat',192,24,5],['plat',200,21,3],['plat',242,24,5],
    ['q',70,20,2],['q',140,18,1],['q',210,22,1],
    ['spike',95,27,3],['spike',170,27,4],['spike',260,27,3],
    ['spring',90,27],['spring',235,27],
    ['cp',88,27],['cp',168,27],['cp',255,27],
    ['exit',295,27],
    ['tree',10],['tree',30],['tree',50],['tree',100],['tree',170],['tree',260],['tree',285],
    ['tree',70,23],['tree',140,21],['tree',215,23],
    ['mush',15],['mush',175]
  ]});
}
function buildLevel3_4() {
  return buildGeneric(350, { cmds: [
    ['gap',45,55],['gap',85,95],['gap',125,138],['gap',165,175],['gap',205,218],['gap',255,265],['gap',295,305],
    ['elev',58,24,80],['elev',140,22,160],['elev',220,24,245],
    ['plat',47,24,5],['plat',87,24,5],['plat',95,21,3],['plat',127,24,6],['plat',138,21,4],
    ['plat',167,24,5],['plat',175,21,3],['plat',207,24,6],['plat',218,21,3],
    ['plat',257,24,5],['plat',265,21,3],['plat',297,24,5],
    ['q',50,20,1],['q',130,18,2],['q',170,20,1],['q',260,18,1],
    ['spike',110,27,3],['spike',185,27,4],['spike',275,27,3],
    ['spring',100,27],['spring',180,27],
    ['cp',105,27],['cp',195,27],['cp',310,27],
    ['exit',345,27],
    ['tree',10],['tree',25],['tree',40],['tree',105],['tree',195],['tree',270],['tree',320],['tree',340],
    ['tree',65,23],['tree',145,21],['tree',230,23],
    ['mush',15],['mush',200]
  ]});
}
function buildLevel3_5() {
  return buildGeneric(350, { cmds: [
    ['gap',55,62],['gap',95,105],
    ['plat',57,24,4],['plat',97,25,5],
    ['q',48,22,1],['q',85,23,1],['brick',87,23,1],
    ['spike',115,27,2],['cp',125,27],
    ['q',135,24,1],['q',140,24,1],
    ['boss',200,250,[
      [204,24,6],[237,22,5],[211,20,5],[239,18,4],[220,15,5]
    ]],
    ['tree',10],['tree',25],['tree',45],['tree',70],['tree',85],['tree',110],['tree',135],['tree',155],['tree',175],['tree',190],
    ['mush',15],['mush',80]
  ], bossArenaX: 200});
}

// ══════ WORLD 4 — SHADOW CASTLE ══════
function buildLevel4_1() {
  return buildGeneric(230, { cmds: [
    ['gap',40,46],['gap',85,92],['gap',140,148],['gap',180,186],
    ['plat',42,25,3],['plat',87,24,4],['plat',142,25,5],['plat',182,24,4],
    ['q',35,22,1],['q',95,21,2],['q',155,23,1],
    ['spike',110,27,3],['spike',165,27,2],
    ['cp',70,27],['cp',130,27],
    ['exit',225,27],
    ['tree',10],['tree',25],['tree',50],['tree',100],['tree',125],['tree',160],['tree',200],
    ['mush',15],['mush',105]
  ]});
}
function buildLevel4_2() {
  return buildGeneric(270, { cmds: [
    ['gap',45,52],['gap',95,105],['gap',150,162],['gap',210,218],
    ['elev',55,24,70],['elev',110,22,130],['elev',165,24,190],
    ['plat',47,24,4],['plat',97,24,5],['plat',105,21,3],['plat',152,24,5],['plat',162,21,4],['plat',212,24,5],
    ['q',60,20,2],['q',115,18,1],['brick',117,18,2],['q',175,22,1],
    ['spike',80,27,3],['spike',140,27,3],['spike',200,27,4],
    ['spring',75,27],
    ['cp',73,27],['cp',135,27],['cp',195,27],
    ['exit',265,27],
    ['tree',10],['tree',30],['tree',85],['tree',145],['tree',200],['tree',250],
    ['tree',60,23],['tree',120,21],['tree',175,23],
    ['mush',20],['mush',205]
  ]});
}
function buildLevel4_3() {
  return buildGeneric(310, { cmds: [
    ['gap',50,58],['gap',110,122],['gap',180,192],['gap',240,252],
    ['elev',60,24,80],['elev',125,22,150],['elev',195,24,225],
    ['plat',52,24,5],['plat',112,24,6],['plat',122,21,4],['plat',182,24,5],['plat',192,21,4],['plat',242,24,6],['plat',252,21,3],
    ['q',65,20,2],['q',130,18,1],['q',200,22,1],['q',248,20,1],
    ['brick',67,20,1],['brick',250,20,2],
    ['spike',90,27,3],['spike',160,27,4],['spike',265,27,3],
    ['spring',85,27],['spring',230,27],
    ['cp',83,27],['cp',158,27],['cp',260,27],
    ['exit',305,27],
    ['tree',10],['tree',30],['tree',48],['tree',95],['tree',165],['tree',240],['tree',275],['tree',295],
    ['tree',65,23],['tree',135,21],['tree',210,23],
    ['mush',15],['mush',170]
  ]});
}
function buildLevel4_4() {
  return buildGeneric(360, { cmds: [
    ['gap',40,50],['gap',80,92],['gap',120,132],['gap',160,172],['gap',200,215],['gap',250,262],['gap',300,312],
    ['elev',55,24,75],['elev',135,22,155],['elev',218,24,240],
    ['plat',42,24,5],['plat',82,24,6],['plat',92,21,4],['plat',122,24,6],['plat',132,21,4],
    ['plat',162,24,6],['plat',172,21,4],['plat',202,24,6],['plat',215,21,4],
    ['plat',252,24,5],['plat',262,21,4],['plat',302,24,6],
    ['q',45,20,1],['q',125,18,2],['q',165,20,1],['q',255,18,1],['q',305,20,1],
    ['spike',105,27,3],['spike',185,27,4],['spike',275,27,3],
    ['spring',95,27],['spring',178,27],
    ['cp',100,27],['cp',190,27],['cp',315,27],
    ['exit',355,27],
    ['tree',10],['tree',25],['tree',105],['tree',190],['tree',280],['tree',320],['tree',345],
    ['tree',60,23],['tree',140,21],['tree',225,23],
    ['mush',15],['mush',195]
  ]});
}
function buildLevel4_5() {
  return buildGeneric(360, { cmds: [
    ['gap',50,58],['gap',90,100],['gap',130,138],
    ['plat',52,24,4],['plat',92,25,5],['plat',132,24,4],
    ['q',45,22,1],['q',80,23,1],['brick',82,23,1],['q',125,22,1],
    ['spike',110,27,2],['spike',145,27,2],['cp',155,27],
    ['q',165,24,1],['q',170,24,1],
    ['boss',210,260,[
      [214,24,6],[247,22,5],[221,20,5],[249,18,4],[230,15,5]
    ]],
    ['tree',10],['tree',25],['tree',45],['tree',70],['tree',85],['tree',110],['tree',135],['tree',155],['tree',175],['tree',195],
    ['mush',15],['mush',80]
  ], bossArenaX: 210});
}

// ── Entity data for Worlds 2-4 ──
// World 2 — Golden Desert
LEVEL_ENTITIES['2-1'] = {
  spawn: [32, 416], coins: [
    [200,420,'gold'],[216,420,'gold'],[232,420,'gold'],
    [400,420,'gold'],[416,420,'gold'],[432,420,'gold'],
    [500,420,'gold'],[516,420,'gold'],
    [700,420,'gold'],[716,420,'gold'],
    [800,380,'gold'],[816,380,'gold'],[832,380,'gold'],
    [1100,420,'gold'],[1116,420,'gold'],
    [1200,420,'gold'],[1216,420,'gold'],[1232,420,'gold'],
    [1500,420,'gold'],[1516,420,'gold'],
    [1800,380,'gold'],[1816,380,'gold'],[1832,380,'gold'],
    [2100,420,'gold'],[2116,420,'gold'],
    [2400,420,'gold'],[2416,420,'gold'],[2432,420,'gold'],
    [2700,420,'gold'],[2716,420,'gold'],
    [3000,420,'gold'],[3016,420,'gold'],
    [1000,340,'red'],[2000,320,'red'],
    [3400,416,'ancient']
  ], enemies: [
    [350, 420, 'sand_scorpion'],[550, 420, 'sand_beetle'],
    [750, 420, 'cactus_walker'],[950, 420, 'sand_scorpion'],
    [1400, 420, 'sand_beetle'],[1700, 420, 'cactus_walker'],
    [2200, 420, 'sand_scorpion'],[2600, 420, 'sand_beetle'],
  ], powerups: [[1000, 416, 'heart']]
};
LEVEL_ENTITIES['2-2'] = {
  spawn: [32, 416], coins: [
    [200,420,'gold'],[216,420,'gold'],[232,420,'gold'],
    [400,420,'gold'],[416,420,'gold'],
    [600,380,'gold'],[616,380,'gold'],[632,380,'gold'],
    [800,420,'gold'],[816,420,'gold'],
    [1000,370,'gold'],[1016,370,'gold'],[1032,370,'gold'],
    [1200,420,'gold'],[1216,420,'gold'],
    [1400,340,'gold'],[1416,340,'gold'],[1432,340,'gold'],
    [1600,420,'gold'],[1616,420,'gold'],
    [1800,420,'gold'],[1816,420,'gold'],[1832,420,'gold'],
    [2000,420,'gold'],[2016,420,'gold'],
    [2200,370,'gold'],[2216,370,'gold'],[2232,370,'gold'],
    [2500,420,'gold'],[2516,420,'gold'],
    [2800,420,'gold'],[2816,420,'gold'],[2832,420,'gold'],
    [3200,420,'gold'],[3216,420,'gold'],
    [1100,300,'red'],[2400,300,'red'],[3000,300,'red'],
    [4000,416,'ancient']
  ], enemies: [
    [300, 420, 'sand_beetle'],[450, 420, 'cactus_walker'],
    [700, 420, 'mini_mummy'],[900, 420, 'sand_scorpion'],
    [1100, 420, 'desert_djinn'],[1350, 420, 'bone_vulture'],
    [1600, 420, 'sand_beetle'],[1900, 420, 'cactus_walker'],
    [2100, 420, 'bone_vulture'],[2400, 420, 'desert_djinn'],
    [2700, 420, 'mini_mummy'],[3100, 420, 'sand_beetle'],
  ], powerups: [[1300, 416, 'heart'],[2600, 416, 'speed']]
};
LEVEL_ENTITIES['2-3'] = {
  spawn: [32, 416], coins: [
    [200,420,'gold'],[216,420,'gold'],[232,420,'gold'],
    [400,420,'gold'],[416,420,'gold'],
    [500,380,'gold'],[516,380,'gold'],[532,380,'gold'],
    [700,420,'gold'],[716,420,'gold'],
    [900,370,'gold'],[916,370,'gold'],[932,370,'gold'],
    [1100,420,'gold'],[1116,420,'gold'],
    [1300,340,'gold'],[1316,340,'gold'],[1332,340,'gold'],
    [1500,420,'gold'],[1516,420,'gold'],
    [1700,420,'gold'],[1716,420,'gold'],[1732,420,'gold'],
    [1900,420,'gold'],[1916,420,'gold'],
    [2100,370,'gold'],[2116,370,'gold'],[2132,370,'gold'],
    [2300,420,'gold'],[2316,420,'gold'],
    [2500,380,'gold'],[2516,380,'gold'],
    [2700,420,'gold'],[2716,420,'gold'],
    [2900,420,'gold'],[2916,420,'gold'],[2932,420,'gold'],
    [3200,420,'gold'],[3216,420,'gold'],
    [3500,420,'gold'],[3516,420,'gold'],
    [1100,280,'red'],[2200,280,'red'],[3500,280,'red'],
    [4600,416,'ancient']
  ], enemies: [
    [350, 420, 'cactus_walker'],[550, 420, 'mini_mummy'],
    [750, 420, 'sand_beetle'],[1000, 420, 'desert_djinn'],
    [1200, 420, 'sand_scorpion'],[1500, 420, 'cactus_walker'],
    [1800, 420, 'mini_mummy'],[2000, 420, 'sand_beetle'],
    [2300, 420, 'bone_vulture'],[2600, 420, 'desert_djinn'],
    [2800, 420, 'cactus_walker'],[3100, 420, 'bone_vulture'],
    [3400, 420, 'sand_beetle'],
  ], powerups: [[1600, 416, 'speed'],[2800, 416, 'heart']]
};
LEVEL_ENTITIES['2-4'] = {
  spawn: [32, 416], coins: [
    [200,420,'gold'],[216,420,'gold'],[232,420,'gold'],
    [400,420,'gold'],[416,420,'gold'],
    [500,380,'gold'],[516,380,'gold'],[532,380,'gold'],
    [700,420,'gold'],[716,420,'gold'],
    [800,370,'gold'],[816,370,'gold'],[832,370,'gold'],
    [1000,420,'gold'],[1016,420,'gold'],
    [1200,340,'gold'],[1216,340,'gold'],[1232,340,'gold'],
    [1400,420,'gold'],[1416,420,'gold'],
    [1600,420,'gold'],[1616,420,'gold'],[1632,420,'gold'],
    [1800,420,'gold'],[1816,420,'gold'],
    [2000,370,'gold'],[2016,370,'gold'],[2032,370,'gold'],
    [2200,420,'gold'],[2216,420,'gold'],
    [2400,340,'gold'],[2416,340,'gold'],[2432,340,'gold'],
    [2600,420,'gold'],[2616,420,'gold'],
    [2800,420,'gold'],[2816,420,'gold'],[2832,420,'gold'],
    [3000,420,'gold'],[3016,420,'gold'],
    [3200,380,'gold'],[3216,380,'gold'],[3232,380,'gold'],
    [3400,420,'gold'],[3416,420,'gold'],
    [3600,370,'gold'],[3616,370,'gold'],
    [3800,420,'gold'],[3816,420,'gold'],
    [4000,420,'gold'],[4016,420,'gold'],[4032,420,'gold'],
    [1500,280,'red'],[2700,280,'red'],[4200,280,'red'],
    [5400,416,'ancient']
  ], enemies: [
    [300, 420, 'desert_djinn'],[450, 420, 'mini_mummy'],
    [650, 420, 'cactus_walker'],[850, 420, 'bone_vulture'],
    [1050, 420, 'sand_beetle'],[1300, 420, 'desert_djinn'],
    [1500, 420, 'bone_vulture'],[1700, 420, 'cactus_walker'],
    [1900, 420, 'mini_mummy'],[2100, 420, 'sand_beetle'],
    [2350, 420, 'desert_djinn'],[2500, 420, 'cactus_walker'],
    [2700, 420, 'sand_scorpion'],[2900, 420, 'bone_vulture'],
    [3100, 420, 'sand_beetle'],[3300, 420, 'mini_mummy'],
    [3600, 420, 'desert_djinn'],[3900, 420, 'cactus_walker'],
  ], powerups: [[1500, 416, 'fire'],[3000, 416, 'heart'],[4200, 416, 'shield']]
};
LEVEL_ENTITIES['2-5'] = {
  spawn: [32, 416], coins: [
    [200,420,'gold'],[216,420,'gold'],[232,420,'gold'],
    [400,420,'gold'],[416,420,'gold'],[432,420,'gold'],
    [600,420,'gold'],[616,420,'gold'],[632,420,'gold'],
    [850,420,'gold'],[866,420,'gold'],
    [1000,420,'gold'],[1016,420,'gold'],[1032,420,'gold'],
    [1300,420,'gold'],[1316,420,'gold'],
    [1500,420,'gold'],[1516,420,'gold'],[1532,420,'gold'],
    [1800,420,'gold'],[1816,420,'gold'],
    [2000,420,'gold'],[2016,420,'gold'],[2032,420,'gold'],
    [700,340,'red'],[1700,340,'red'],
  ], enemies: [
    [300, 420, 'cactus_walker'],[500, 420, 'bone_vulture'],
    [700, 420, 'desert_djinn'],[900, 420, 'sand_beetle'],
    [1200, 420, 'mini_mummy'],[1600, 420, 'cactus_walker'],
  ], powerups: [[2240, 416, 'heart'], [2320, 416, 'heart']],
  boss: { type: 'sand_wyrm', x: 225 * 16, y: 12 * 16 }
};

// World 3 — Frozen Sea
LEVEL_ENTITIES['3-1'] = {
  spawn: [32, 416], coins: [
    [200,420,'gold'],[216,420,'gold'],[232,420,'gold'],
    [400,420,'gold'],[416,420,'gold'],[432,420,'gold'],
    [500,420,'gold'],[516,420,'gold'],
    [700,420,'gold'],[716,420,'gold'],
    [800,380,'gold'],[816,380,'gold'],[832,380,'gold'],
    [1100,420,'gold'],[1116,420,'gold'],
    [1200,420,'gold'],[1216,420,'gold'],[1232,420,'gold'],
    [1500,420,'gold'],[1516,420,'gold'],
    [1800,380,'gold'],[1816,380,'gold'],[1832,380,'gold'],
    [2100,420,'gold'],[2116,420,'gold'],
    [2400,420,'gold'],[2416,420,'gold'],[2432,420,'gold'],
    [2700,420,'gold'],[2716,420,'gold'],
    [3000,420,'gold'],[3016,420,'gold'],
    [1000,340,'red'],[2000,320,'red'],
    [3400,416,'ancient']
  ], enemies: [
    [350, 420, 'rolling_penguin'],[550, 420, 'ice_crab'],
    [750, 420, 'frost_sprite'],[950, 420, 'rolling_penguin'],
    [1400, 420, 'ice_crab'],[1700, 420, 'frost_sprite'],
    [2200, 420, 'rolling_penguin'],[2600, 420, 'ice_crab'],
  ], powerups: [[1000, 416, 'heart']]
};
LEVEL_ENTITIES['3-2'] = {
  spawn: [32, 416], coins: [
    [200,420,'gold'],[216,420,'gold'],[232,420,'gold'],
    [400,420,'gold'],[416,420,'gold'],
    [600,380,'gold'],[616,380,'gold'],[632,380,'gold'],
    [800,420,'gold'],[816,420,'gold'],
    [1000,370,'gold'],[1016,370,'gold'],[1032,370,'gold'],
    [1200,420,'gold'],[1216,420,'gold'],
    [1400,340,'gold'],[1416,340,'gold'],[1432,340,'gold'],
    [1600,420,'gold'],[1616,420,'gold'],
    [1800,420,'gold'],[1816,420,'gold'],[1832,420,'gold'],
    [2000,420,'gold'],[2016,420,'gold'],
    [2200,370,'gold'],[2216,370,'gold'],[2232,370,'gold'],
    [2500,420,'gold'],[2516,420,'gold'],
    [2800,420,'gold'],[2816,420,'gold'],[2832,420,'gold'],
    [3200,420,'gold'],[3216,420,'gold'],
    [1100,300,'red'],[2400,300,'red'],[3000,300,'red'],
    [4000,416,'ancient']
  ], enemies: [
    [300, 420, 'ice_crab'],[450, 420, 'frost_sprite'],
    [700, 420, 'snow_bear'],[900, 420, 'rolling_penguin'],
    [1100, 420, 'ice_crab'],[1350, 420, 'frost_sprite'],
    [1600, 420, 'rolling_penguin'],[1900, 420, 'snow_bear'],
    [2100, 420, 'ice_crab'],[2400, 420, 'frost_sprite'],
    [2700, 420, 'snow_bear'],[3100, 420, 'ice_crab'],
  ], powerups: [[1300, 416, 'heart'],[2600, 416, 'ice']]
};
LEVEL_ENTITIES['3-3'] = {
  spawn: [32, 416], coins: [
    [200,420,'gold'],[216,420,'gold'],[232,420,'gold'],
    [400,420,'gold'],[416,420,'gold'],
    [500,380,'gold'],[516,380,'gold'],[532,380,'gold'],
    [700,420,'gold'],[716,420,'gold'],
    [900,370,'gold'],[916,370,'gold'],[932,370,'gold'],
    [1100,420,'gold'],[1116,420,'gold'],
    [1300,340,'gold'],[1316,340,'gold'],[1332,340,'gold'],
    [1500,420,'gold'],[1516,420,'gold'],
    [1700,420,'gold'],[1716,420,'gold'],[1732,420,'gold'],
    [1900,420,'gold'],[1916,420,'gold'],
    [2100,370,'gold'],[2116,370,'gold'],[2132,370,'gold'],
    [2300,420,'gold'],[2316,420,'gold'],
    [2500,380,'gold'],[2516,380,'gold'],
    [2700,420,'gold'],[2716,420,'gold'],
    [2900,420,'gold'],[2916,420,'gold'],[2932,420,'gold'],
    [3200,420,'gold'],[3216,420,'gold'],
    [3500,420,'gold'],[3516,420,'gold'],
    [1100,280,'red'],[2200,280,'red'],[3500,280,'red'],
    [4600,416,'ancient']
  ], enemies: [
    [350, 420, 'frost_sprite'],[550, 420, 'snow_bear'],
    [750, 420, 'ice_crab'],[1000, 420, 'yeti'],
    [1200, 420, 'frost_sprite'],[1500, 420, 'rolling_penguin'],
    [1800, 420, 'ice_crab'],[2000, 420, 'snow_bear'],
    [2300, 420, 'yeti'],[2600, 420, 'frost_sprite'],
    [2800, 420, 'ice_crab'],[3100, 420, 'snow_bear'],
    [3400, 420, 'frost_sprite'],
  ], powerups: [[1600, 416, 'ice'],[2800, 416, 'heart']]
};
LEVEL_ENTITIES['3-4'] = {
  spawn: [32, 416], coins: [
    [200,420,'gold'],[216,420,'gold'],[232,420,'gold'],
    [400,420,'gold'],[416,420,'gold'],
    [500,380,'gold'],[516,380,'gold'],[532,380,'gold'],
    [700,420,'gold'],[716,420,'gold'],
    [800,370,'gold'],[816,370,'gold'],[832,370,'gold'],
    [1000,420,'gold'],[1016,420,'gold'],
    [1200,340,'gold'],[1216,340,'gold'],[1232,340,'gold'],
    [1400,420,'gold'],[1416,420,'gold'],
    [1600,420,'gold'],[1616,420,'gold'],[1632,420,'gold'],
    [1800,420,'gold'],[1816,420,'gold'],
    [2000,370,'gold'],[2016,370,'gold'],[2032,370,'gold'],
    [2200,420,'gold'],[2216,420,'gold'],
    [2400,340,'gold'],[2416,340,'gold'],[2432,340,'gold'],
    [2600,420,'gold'],[2616,420,'gold'],
    [2800,420,'gold'],[2816,420,'gold'],[2832,420,'gold'],
    [3000,420,'gold'],[3016,420,'gold'],
    [3200,380,'gold'],[3216,380,'gold'],[3232,380,'gold'],
    [3600,370,'gold'],[3616,370,'gold'],
    [4000,420,'gold'],[4016,420,'gold'],[4032,420,'gold'],
    [1500,280,'red'],[2700,280,'red'],[4200,280,'red'],
    [5400,416,'ancient']
  ], enemies: [
    [300, 420, 'ice_crab'],[450, 420, 'yeti'],
    [650, 420, 'frost_sprite'],[850, 420, 'rolling_penguin'],
    [1050, 420, 'snow_bear'],[1300, 420, 'ice_crab'],
    [1500, 420, 'yeti'],[1700, 420, 'frost_sprite'],
    [1900, 420, 'ice_crab'],[2100, 420, 'rolling_penguin'],
    [2350, 420, 'yeti'],[2500, 420, 'frost_sprite'],
    [2700, 420, 'snow_bear'],[2900, 420, 'ice_crab'],
    [3100, 420, 'frost_sprite'],[3300, 420, 'yeti'],
    [3600, 420, 'snow_bear'],[3900, 420, 'ice_crab'],
  ], powerups: [[1500, 416, 'shield'],[3000, 416, 'heart'],[4200, 416, 'ice']]
};
LEVEL_ENTITIES['3-5'] = {
  spawn: [32, 416], coins: [
    [200,420,'gold'],[216,420,'gold'],[232,420,'gold'],
    [400,420,'gold'],[416,420,'gold'],[432,420,'gold'],
    [600,420,'gold'],[616,420,'gold'],[632,420,'gold'],
    [850,420,'gold'],[866,420,'gold'],
    [1000,420,'gold'],[1016,420,'gold'],[1032,420,'gold'],
    [1300,420,'gold'],[1316,420,'gold'],
    [1500,420,'gold'],[1516,420,'gold'],[1532,420,'gold'],
    [1800,420,'gold'],[1816,420,'gold'],
    [2000,420,'gold'],[2016,420,'gold'],[2032,420,'gold'],
    [700,340,'red'],[1700,340,'red'],
  ], enemies: [
    [300, 420, 'frost_sprite'],[500, 420, 'ice_crab'],
    [700, 420, 'yeti'],[900, 420, 'rolling_penguin'],
    [1200, 420, 'frost_sprite'],[1600, 420, 'ice_crab'],
  ], powerups: [[2240, 416, 'heart'], [2320, 416, 'heart']],
  boss: { type: 'frost_giant', x: 225 * 16, y: 8 * 16 }
};

// World 4 — Shadow Castle
LEVEL_ENTITIES['4-1'] = {
  spawn: [32, 416], coins: [
    [200,420,'gold'],[216,420,'gold'],[232,420,'gold'],
    [400,420,'gold'],[416,420,'gold'],[432,420,'gold'],
    [500,420,'gold'],[516,420,'gold'],
    [700,420,'gold'],[716,420,'gold'],
    [800,380,'gold'],[816,380,'gold'],[832,380,'gold'],
    [1100,420,'gold'],[1116,420,'gold'],
    [1200,420,'gold'],[1216,420,'gold'],[1232,420,'gold'],
    [1500,420,'gold'],[1516,420,'gold'],
    [1800,380,'gold'],[1816,380,'gold'],[1832,380,'gold'],
    [2100,420,'gold'],[2116,420,'gold'],
    [2400,420,'gold'],[2416,420,'gold'],[2432,420,'gold'],
    [2700,420,'gold'],[2716,420,'gold'],
    [3000,420,'gold'],[3016,420,'gold'],
    [1000,340,'red'],[2000,320,'red'],
    [3500,416,'ancient']
  ], enemies: [
    [350, 420, 'shadow_knight'],[550, 420, 'demon_imp'],
    [750, 420, 'bone_warrior'],[950, 420, 'shadow_wisp'],
    [1400, 420, 'dark_mage'],[1700, 420, 'demon_imp'],
    [2200, 420, 'bone_warrior'],[2600, 420, 'shadow_knight'],
  ], powerups: [[1000, 416, 'heart']]
};
LEVEL_ENTITIES['4-2'] = {
  spawn: [32, 416], coins: [
    [200,420,'gold'],[216,420,'gold'],[232,420,'gold'],
    [400,420,'gold'],[416,420,'gold'],
    [600,380,'gold'],[616,380,'gold'],[632,380,'gold'],
    [800,420,'gold'],[816,420,'gold'],
    [1000,370,'gold'],[1016,370,'gold'],[1032,370,'gold'],
    [1200,420,'gold'],[1216,420,'gold'],
    [1400,340,'gold'],[1416,340,'gold'],[1432,340,'gold'],
    [1600,420,'gold'],[1616,420,'gold'],
    [1800,420,'gold'],[1816,420,'gold'],[1832,420,'gold'],
    [2000,420,'gold'],[2016,420,'gold'],
    [2200,370,'gold'],[2216,370,'gold'],[2232,370,'gold'],
    [2500,420,'gold'],[2516,420,'gold'],
    [2800,420,'gold'],[2816,420,'gold'],[2832,420,'gold'],
    [3200,420,'gold'],[3216,420,'gold'],
    [1100,300,'red'],[2400,300,'red'],[3000,300,'red'],
    [4200,416,'ancient']
  ], enemies: [
    [300, 420, 'bone_warrior'],[450, 420, 'demon_imp'],
    [700, 420, 'gear_golem'],[900, 420, 'dark_mage'],
    [1100, 420, 'shadow_knight'],[1350, 420, 'demon_imp'],
    [1600, 420, 'shadow_wisp'],[1900, 420, 'bone_warrior'],
    [2100, 420, 'dark_mage'],[2400, 420, 'demon_imp'],
    [2700, 420, 'gear_golem'],[3100, 420, 'bone_warrior'],
  ], powerups: [[1300, 416, 'heart'],[2600, 416, 'fire']]
};
LEVEL_ENTITIES['4-3'] = {
  spawn: [32, 416], coins: [
    [200,420,'gold'],[216,420,'gold'],[232,420,'gold'],
    [400,420,'gold'],[416,420,'gold'],
    [500,380,'gold'],[516,380,'gold'],[532,380,'gold'],
    [700,420,'gold'],[716,420,'gold'],
    [900,370,'gold'],[916,370,'gold'],[932,370,'gold'],
    [1100,420,'gold'],[1116,420,'gold'],
    [1300,340,'gold'],[1316,340,'gold'],[1332,340,'gold'],
    [1500,420,'gold'],[1516,420,'gold'],
    [1700,420,'gold'],[1716,420,'gold'],[1732,420,'gold'],
    [1900,420,'gold'],[1916,420,'gold'],
    [2100,370,'gold'],[2116,370,'gold'],[2132,370,'gold'],
    [2300,420,'gold'],[2316,420,'gold'],
    [2500,380,'gold'],[2516,380,'gold'],
    [2700,420,'gold'],[2716,420,'gold'],
    [2900,420,'gold'],[2916,420,'gold'],[2932,420,'gold'],
    [3200,420,'gold'],[3216,420,'gold'],
    [3500,420,'gold'],[3516,420,'gold'],
    [1100,280,'red'],[2200,280,'red'],[3500,280,'red'],
    [4800,416,'ancient']
  ], enemies: [
    [350, 420, 'dark_mage'],[550, 420, 'demon_imp'],
    [750, 420, 'gear_golem'],[1000, 420, 'bone_warrior'],
    [1200, 420, 'shadow_knight'],[1500, 420, 'dark_mage'],
    [1800, 420, 'demon_imp'],[2000, 420, 'bone_warrior'],
    [2300, 420, 'shadow_wisp'],[2600, 420, 'dark_mage'],
    [2800, 420, 'gear_golem'],[3100, 420, 'demon_imp'],
    [3400, 420, 'bone_warrior'],
  ], powerups: [[1600, 416, 'fire'],[2800, 416, 'heart']]
};
LEVEL_ENTITIES['4-4'] = {
  spawn: [32, 416], coins: [
    [200,420,'gold'],[216,420,'gold'],[232,420,'gold'],
    [400,420,'gold'],[416,420,'gold'],
    [500,380,'gold'],[516,380,'gold'],[532,380,'gold'],
    [700,420,'gold'],[716,420,'gold'],
    [800,370,'gold'],[816,370,'gold'],[832,370,'gold'],
    [1000,420,'gold'],[1016,420,'gold'],
    [1200,340,'gold'],[1216,340,'gold'],[1232,340,'gold'],
    [1400,420,'gold'],[1416,420,'gold'],
    [1600,420,'gold'],[1616,420,'gold'],[1632,420,'gold'],
    [1800,420,'gold'],[1816,420,'gold'],
    [2000,370,'gold'],[2016,370,'gold'],[2032,370,'gold'],
    [2200,420,'gold'],[2216,420,'gold'],
    [2400,340,'gold'],[2416,340,'gold'],[2432,340,'gold'],
    [2600,420,'gold'],[2616,420,'gold'],
    [2800,420,'gold'],[2816,420,'gold'],[2832,420,'gold'],
    [3000,420,'gold'],[3016,420,'gold'],
    [3200,380,'gold'],[3216,380,'gold'],[3232,380,'gold'],
    [3400,420,'gold'],[3416,420,'gold'],
    [3600,370,'gold'],[3616,370,'gold'],
    [3800,420,'gold'],[3816,420,'gold'],
    [4000,420,'gold'],[4016,420,'gold'],[4032,420,'gold'],
    [1500,280,'red'],[2700,280,'red'],[4200,280,'red'],
    [5600,416,'ancient']
  ], enemies: [
    [300, 420, 'demon_imp'],[450, 420, 'dark_mage'],
    [650, 420, 'bone_warrior'],[850, 420, 'shadow_wisp'],
    [1050, 420, 'dark_mage'],[1300, 420, 'demon_imp'],
    [1500, 420, 'gear_golem'],[1700, 420, 'bone_warrior'],
    [1900, 420, 'shadow_wisp'],[2100, 420, 'dark_mage'],
    [2350, 420, 'demon_imp'],[2500, 420, 'bone_warrior'],
    [2700, 420, 'shadow_knight'],[2900, 420, 'dark_mage'],
    [3100, 420, 'demon_imp'],[3300, 420, 'bone_warrior'],
    [3600, 420, 'dark_mage'],[3900, 420, 'shadow_wisp'],
  ], powerups: [[1500, 416, 'wind'],[3000, 416, 'heart'],[4200, 416, 'shield']]
};
LEVEL_ENTITIES['4-5'] = {
  spawn: [32, 416], coins: [
    [200,420,'gold'],[216,420,'gold'],[232,420,'gold'],
    [400,420,'gold'],[416,420,'gold'],[432,420,'gold'],
    [600,420,'gold'],[616,420,'gold'],[632,420,'gold'],
    [850,420,'gold'],[866,420,'gold'],
    [1000,420,'gold'],[1016,420,'gold'],[1032,420,'gold'],
    [1300,420,'gold'],[1316,420,'gold'],
    [1500,420,'gold'],[1516,420,'gold'],[1532,420,'gold'],
    [1800,420,'gold'],[1816,420,'gold'],
    [2000,420,'gold'],[2016,420,'gold'],[2032,420,'gold'],
    [700,340,'red'],[1700,340,'red'],
  ], enemies: [
    [300, 420, 'dark_mage'],[500, 420, 'demon_imp'],
    [700, 420, 'bone_warrior'],[900, 420, 'shadow_wisp'],
    [1200, 420, 'dark_mage'],[1600, 420, 'demon_imp'],
  ], powerups: [[2240, 416, 'heart'], [2320, 416, 'heart']],
  boss: { type: 'shadow_king', x: 235 * 16, y: 6 * 16 }
};

// ── Level builder dispatch ──
const LEVEL_BUILDERS = {
  '1-1': buildLevel1_1, '1-2': buildLevel1_2, '1-3': buildLevel1_3, '1-4': buildLevel1_4, '1-5': buildLevel1_5,
  '2-1': buildLevel2_1, '2-2': buildLevel2_2, '2-3': buildLevel2_3, '2-4': buildLevel2_4, '2-5': buildLevel2_5,
  '3-1': buildLevel3_1, '3-2': buildLevel3_2, '3-3': buildLevel3_3, '3-4': buildLevel3_4, '3-5': buildLevel3_5,
  '4-1': buildLevel4_1, '4-2': buildLevel4_2, '4-3': buildLevel4_3, '4-4': buildLevel4_4, '4-5': buildLevel4_5
};

// ── Level info ──
const LEVEL_INFO = {
  '1-1': { name: 'จุดเริ่มต้น', world: 1, num: 1, timeLimit: 120 },
  '1-2': { name: 'ศัตรูตัวแรก', world: 1, num: 2, timeLimit: 150 },
  '1-3': { name: 'ป่าลึกลับ', world: 1, num: 3, timeLimit: 180 },
  '1-4': { name: 'ป่าหายนะ', world: 1, num: 4, timeLimit: 200 },
  '1-5': { name: 'Thornback', world: 1, num: 5, timeLimit: 240 },
  '2-1': { name: 'ปากทะเลทราย', world: 2, num: 1, timeLimit: 120 },
  '2-2': { name: 'โอเอซิส', world: 2, num: 2, timeLimit: 150 },
  '2-3': { name: 'สุสานโบราณ', world: 2, num: 3, timeLimit: 180 },
  '2-4': { name: 'พายุทราย', world: 2, num: 4, timeLimit: 200 },
  '2-5': { name: 'Sand Wyrm', world: 2, num: 5, timeLimit: 240 },
  '3-1': { name: 'ฝั่งน้ำแข็ง', world: 3, num: 1, timeLimit: 120 },
  '3-2': { name: 'ถ้ำน้ำแข็ง', world: 3, num: 2, timeLimit: 150 },
  '3-3': { name: 'ภูเขาหิมะ', world: 3, num: 3, timeLimit: 180 },
  '3-4': { name: 'พายุหิมะ', world: 3, num: 4, timeLimit: 200 },
  '3-5': { name: 'Frost Giant', world: 3, num: 5, timeLimit: 260 },
  '4-1': { name: 'ประตูปราสาท', world: 4, num: 1, timeLimit: 130 },
  '4-2': { name: 'ห้องกลไก', world: 4, num: 2, timeLimit: 160 },
  '4-3': { name: 'หอคอยมืด', world: 4, num: 3, timeLimit: 200 },
  '4-4': { name: 'ห้องโถงสุดท้าย', world: 4, num: 4, timeLimit: 220 },
  '4-5': { name: 'Shadow King', world: 4, num: 5, timeLimit: 300 }
};

SB.Level = {
  tilemap: null,
  currentId: '1-1',
  info: null,
  pixelWidth: 0,
  bossArenaX: -1,

  load(levelId) {
    this.currentId = levelId;
    this.info = LEVEL_INFO[levelId];
    const builder = LEVEL_BUILDERS[levelId];
    if (!builder) return;

    const data = builder();
    this.tilemap = parseLevel(data.rows);
    this.pixelWidth = data.w * SB.TILE;
    this.bossArenaX = data.bossArenaX ? data.bossArenaX * SB.TILE : -1;

    // Spawn entities
    const ents = LEVEL_ENTITIES[levelId];
    SB.Items.clear();
    SB.enemies.length = 0;
    SB.playerProjectiles.length = 0;
    SB.boss = null;

    if (ents) {
      // Coins — auto-correct Y if overlapping solid tiles
      for (const [x, y, type] of (ents.coins || [])) {
        let cy = y;
        const col = Math.floor((x + 6) / SB.TILE);
        let row = Math.floor(cy / SB.TILE);
        while (row >= 0 && SB.SOLID_TILES.has(this.tilemap.get(col, row))) {
          cy = row * SB.TILE - 14;
          row = Math.floor(cy / SB.TILE);
        }
        SB.Items.addCoin(x, cy, type);
      }
      // Enemies — snap to ground surface at their X position
      for (const [x, y, type] of (ents.enemies || [])) {
        const cfg = SB.Enemy.TYPES ? SB.Enemy.TYPES[type] : null;
        const eh = cfg ? (cfg.h || 16) : 16;
        let ey = y - eh;
        const col = Math.floor((x + 8) / SB.TILE);
        let row = Math.floor((ey + eh - 1) / SB.TILE);
        while (row >= 0 && SB.SOLID_TILES.has(this.tilemap.get(col, row))) {
          ey = row * SB.TILE - eh;
          row = Math.floor((ey + eh - 1) / SB.TILE);
        }
        SB.enemies.push(new SB.Enemy(x, ey, type));
      }
      // Power-ups — auto-correct Y
      for (const [x, y, type] of (ents.powerups || [])) {
        let py = y;
        const col = Math.floor((x + 8) / SB.TILE);
        let row = Math.floor(py / SB.TILE);
        while (row >= 0 && SB.SOLID_TILES.has(this.tilemap.get(col, row))) {
          py = row * SB.TILE - 18;
          row = Math.floor(py / SB.TILE);
        }
        SB.Items.addPowerUp(x, py, type);
      }
      // Boss
      if (ents.boss) {
        SB.boss = new SB.Boss(ents.boss.x, ents.boss.y, ents.boss.type);
      }
      // Player spawn
      SB.Player.reset(ents.spawn[0], ents.spawn[1]);
    }

    SB.Camera.reset(this.pixelWidth);
    SB.Particles.clear();

    // Generate background decorations per world
    this.decorations = [];
    this._generateDecorations();
  },

  _generateDecorations() {
    const world = this.info ? this.info.world : 1;
    const pw = this.pixelWidth;
    const tm = this.tilemap;
    const decos = this.decorations;

    // Helper: find ground Y at a given pixel X (returns -1 if no valid ground/gap)
    function groundY(px) {
      const col = Math.floor(px / SB.TILE);
      if (col < 0 || col >= tm.w) return -1;
      for (let r = 0; r < 31; r++) {
        const tile = tm.get(col, r);
        if (SB.SOLID_TILES.has(tile)) {
          // Check that the tile above is NOT solid (it's the surface, not buried)
          if (r === 0 || !SB.SOLID_TILES.has(tm.get(col, r - 1))) {
            return r * SB.TILE;
          }
          // Otherwise it's an inner block, skip
          return -1;
        }
      }
      // No ground found (gap/pit)
      return -1;
    }

    // Pseudo-random from seed
    function seeded(i) { return ((i * 7919 + 997) % 6271) / 6271; }

    if (world === 1) {
      // ═══ EMERALD FOREST: trees, bushes, grass, flowers ═══
      // Large trees every ~120px with variation
      for (let i = 0; i < pw; i += 90 + Math.floor(seeded(i) * 80)) {
        const x = i + seeded(i * 3) * 40;
        const gy = groundY(x);
        if (gy > 100) {
          const r = seeded(i + 100);
          if (r > 0.6) {
            decos.push({ type: 'tree_large', x, y: gy, size: 65 + seeded(i + 1) * 35, seed: i });
          } else if (r > 0.25) {
            decos.push({ type: 'tree_medium', x, y: gy, size: 40 + seeded(i + 2) * 20, seed: i });
          } else {
            decos.push({ type: 'bush', x, y: gy, size: 10 + seeded(i + 3) * 10, seed: i });
          }
        }
      }
      // Grass tufts
      for (let i = 0; i < pw; i += 25 + Math.floor(seeded(i + 500) * 30)) {
        const x = i + seeded(i * 5 + 300) * 20;
        const gy = groundY(x);
        if (gy > 100) decos.push({ type: 'grass_tuft', x, y: gy, seed: i, color: seeded(i + 700) > 0.5 ? '#3a9a3a' : '#4aba4a' });
      }
      // Flowers
      for (let i = 0; i < pw; i += 100 + Math.floor(seeded(i + 800) * 150)) {
        const x = i + seeded(i * 7 + 400) * 60;
        const gy = groundY(x);
        if (gy > 100) decos.push({ type: 'flower', x, y: gy, seed: i });
      }
    } else if (world === 2) {
      // ═══ GOLDEN DESERT: cacti, dead trees, rocks, tumbleweeds ═══
      for (let i = 0; i < pw; i += 100 + Math.floor(seeded(i) * 120)) {
        const x = i + seeded(i * 3) * 50;
        const gy = groundY(x);
        if (gy > 100) {
          const r = seeded(i + 200);
          if (r > 0.65) {
            decos.push({ type: 'cactus', x, y: gy, size: 25 + seeded(i + 1) * 20, seed: i });
          } else if (r > 0.35) {
            decos.push({ type: 'dead_tree', x, y: gy, size: 40 + seeded(i + 2) * 20, seed: i });
          } else {
            decos.push({ type: 'rock', x, y: gy, size: 8 + seeded(i + 3) * 12, seed: i });
          }
        }
      }
      // Tumbleweeds (sparse)
      for (let i = 0; i < pw; i += 200 + Math.floor(seeded(i + 600) * 300)) {
        const x = i; const gy = groundY(x);
        if (gy > 100) decos.push({ type: 'tumbleweed', x, y: gy, seed: i });
      }
      // Small rocks
      for (let i = 0; i < pw; i += 60 + Math.floor(seeded(i + 900) * 60)) {
        const x = i + seeded(i + 950) * 30;
        const gy = groundY(x);
        if (gy > 100 && seeded(i + 951) > 0.5) decos.push({ type: 'rock', x, y: gy, size: 5 + seeded(i + 952) * 7, seed: i + 1000 });
      }
    } else if (world === 3) {
      // ═══ FROZEN SEA: pine trees, ice crystals, snow bushes ═══
      for (let i = 0; i < pw; i += 80 + Math.floor(seeded(i) * 90)) {
        const x = i + seeded(i * 3) * 40;
        const gy = groundY(x);
        if (gy > 100) {
          const r = seeded(i + 300);
          if (r > 0.5) {
            decos.push({ type: 'pine_tree', x, y: gy, size: 50 + seeded(i + 1) * 30, seed: i });
          } else if (r > 0.2) {
            decos.push({ type: 'snow_bush', x, y: gy, size: 10 + seeded(i + 5) * 8, seed: i });
          } else {
            decos.push({ type: 'ice_crystal', x, y: gy, size: 15 + seeded(i + 4) * 15, seed: i });
          }
        }
      }
      // Snow grass (sparse white tufts)
      for (let i = 0; i < pw; i += 40 + Math.floor(seeded(i + 500) * 40)) {
        const x = i + seeded(i * 5 + 300) * 20;
        const gy = groundY(x);
        if (gy > 100) decos.push({ type: 'grass_tuft', x, y: gy, seed: i, color: '#aaccdd' });
      }
    } else if (world === 4) {
      // ═══ SHADOW CASTLE: torches, banners, chains, gargoyles (NO trees) ═══
      for (let i = 0; i < pw; i += 120 + Math.floor(seeded(i) * 100)) {
        const x = i + seeded(i * 3) * 40;
        const gy = groundY(x);
        if (gy > 100) {
          const r = seeded(i + 400);
          if (r > 0.65) {
            decos.push({ type: 'torch', x, y: gy, size: 30 + seeded(i + 1) * 15, seed: i });
          } else if (r > 0.35) {
            decos.push({ type: 'banner', x, y: gy - 50 - seeded(i + 2) * 30, size: 30 + seeded(i + 6) * 15, seed: i });
          } else {
            decos.push({ type: 'chain', x, y: gy - 70 - seeded(i + 7) * 40, size: 40 + seeded(i + 8) * 30, seed: i });
          }
        }
      }
      // Gargoyles (rare)
      for (let i = 0; i < pw; i += 300 + Math.floor(seeded(i + 700) * 250)) {
        const x = i + seeded(i + 750) * 100;
        const gy = groundY(x);
        if (gy > 100) decos.push({ type: 'gargoyle', x, y: gy - 40 - seeded(i + 760) * 30, seed: i });
      }
    }
  },

  drawTilemap(ctx, cam) {
    if (!this.tilemap) return;
    const startCol = Math.max(0, Math.floor(cam.x / SB.TILE) - 1);
    const endCol = Math.min(this.tilemap.w - 1, Math.ceil((cam.x + SB.W) / SB.TILE) + 1);
    const startRow = 0;
    const endRow = this.tilemap.h - 1;
    const world = (SB.Save.data && SB.Save.data.currentWorld) || 1;

    for (let y = startRow; y <= endRow; y++) {
      for (let x = startCol; x <= endCol; x++) {
        const t = this.tilemap.get(x, y);
        if (t === T.AIR || t === T.INVIS_BLOCK) {
          // Draw pit bottom fill for World 3 (water) and World 4 (lava)
          if (y >= endRow - 1) {
            const sx = Math.round(x * SB.TILE - cam.x);
            const sy = Math.round(y * SB.TILE - cam.y);
            const time = SB.UI.animTime || 0;
            if (world === 3) {
              // Ocean water
              const wave = Math.sin(time * 2 + x * 0.5) * 2;
              ctx.fillStyle = 'rgba(30,100,180,0.7)';
              ctx.fillRect(sx, sy + wave, SB.TILE, SB.TILE);
              ctx.fillStyle = 'rgba(52,152,219,0.4)';
              ctx.fillRect(sx, sy + wave, SB.TILE, 4);
              // Foam
              ctx.fillStyle = 'rgba(255,255,255,0.3)';
              ctx.fillRect(sx + Math.floor(Math.sin(time * 3 + x) * 3) + 4, sy + wave, 4, 2);
            } else if (world === 4) {
              // Lava
              const lwave = Math.sin(time * 1.5 + x * 0.3) * 2;
              ctx.fillStyle = 'rgba(180,40,20,0.8)';
              ctx.fillRect(sx, sy + lwave, SB.TILE, SB.TILE);
              ctx.fillStyle = 'rgba(255,120,20,0.5)';
              ctx.fillRect(sx, sy + lwave, SB.TILE, 3);
              // Lava glow
              ctx.fillStyle = 'rgba(255,200,50,' + (0.2 + Math.sin(time * 4 + x) * 0.1) + ')';
              ctx.fillRect(sx + 3, sy + lwave + 1, 6, 2);
            }
          }
          continue;
        }
        const sx = x * SB.TILE - cam.x;
        const sy = y * SB.TILE - cam.y;
        drawTile(ctx, t, Math.round(sx), Math.round(sy));
      }
    }
  },

  getWorldLevels(worldNum) {
    const levels = [];
    for (const id in LEVEL_INFO) {
      if (LEVEL_INFO[id].world === worldNum) levels.push({ id, ...LEVEL_INFO[id] });
    }
    return levels.sort((a, b) => a.num - b.num);
  }
};
})();
