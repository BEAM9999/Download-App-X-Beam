/* ══════════════════════════════════════════════
   Slime Bouncer — Main Game Loop & State Machine
   Entry point, collision checks, game flow
   ═════════════════════════════════════════════ */
'use strict';
(function() {
const SB = window.SB || (window.SB = {});

// ── Game State ──
SB.gameState = 'TITLE';
SB.prevState = 'TITLE';
SB.gameTimer = 0;
SB.totalTime = 0;
SB.enemies = [];
SB.playerProjectiles = [];
SB.boss = null;
SB.enemiesDefeated = 0;

// ── Start a level ──
SB.startLevel = function(levelId) {
  SB.gameState = 'PLAYING';
  SB.gameTimer = 0;
  SB.enemiesDefeated = 0;
  // Save for Continue
  if (SB.Save.data) { SB.Save.data.lastPlayedLevel = levelId; SB.Save.save(); }
  SB.Level.load(levelId);
  if (SB.Level.info) SB.gameTimer = SB.Level.info.timeLimit;
  const world = SB.Level.info ? SB.Level.info.world : 1;
  const bgmMap = { 1: 'forest', 2: 'desert', 3: 'ice', 4: 'castle' };
  const bgm = bgmMap[world] || 'forest';
  SB.Audio.playBGM(bgm);

  // Shop items are now used manually via HUD inventory bar

  SB.Save.save(); // Auto-save progress
};

// ── Collision: Player ↔ Enemies ──
function checkPlayerEnemyCollisions() {
  const p = SB.Player;
  if (!p.alive || p.invTimer > 0) return;

  for (const e of SB.enemies) {
    if (!e.alive) continue;
    if (!SB.Utils.aabb(p.x, p.y, p.hitW, p.hitH, e.x, e.y, e.w, e.h)) continue;

    // Check if stomping (player falling onto enemy from above)
    if (SB.Utils.isStomping(p, e)) {
      e.hit(1);
      p.combo++;
      p.score += e.score * p.combo;
      p.vy = -350; // Stomp bounce
      SB.Particles.emit('stomp', e.x + e.w / 2, e.y);
      SB.Audio.sfx('stomp');
      if (!e.alive) {
        SB.Audio.sfx('enemyDie');
        SB.Particles.emit('death', e.x + e.w / 2, e.y + e.h / 2);
        SB.enemiesDefeated++;
      }
    } else {
      // Player takes damage
      p.takeDamage(1, e.x < p.x ? 1 : -1);
    }
  }
}

// ── Collision: Player ↔ Boss ──
function checkPlayerBossCollision() {
  const p = SB.Player;
  const b = SB.boss;
  if (!b || !b.alive || !p.alive || p.invTimer > 0) return;

  if (!SB.Utils.aabb(p.x, p.y, p.hitW, p.hitH, b.x, b.y, b.w, b.h)) return;

  if (b.vulnerable && SB.Utils.isStomping(p, b)) {
    b.hit(1);
    p.vy = -400;
    p.combo++;
    p.score += 200 * p.combo;
    SB.Audio.sfx('bossHit');
    SB.Camera.shake(6, 0.3);
    SB.Particles.emit('stomp', b.x + b.w / 2, b.y);

    if (!b.alive) {
      SB.Audio.sfx('bossDie');
      SB.Camera.shake(15, 1.5);
      SB.Particles.emit('bossExplosion', b.x + b.w / 2, b.y + b.h / 2);
      p.score += 5000;
      // Trigger level complete after short delay
      setTimeout(() => {
        SB.UI.initLevelComplete(
          SB.Level.info ? SB.Level.info.timeLimit - SB.gameTimer : 0,
          p.coins,
          SB.enemiesDefeated
        );
      }, 2000);
    }
  } else if (!b.vulnerable) {
    p.takeDamage(2, b.x < p.x ? 1 : -1);
  }
}

// ── Collision: Player ↔ Items ──
function checkPlayerItemCollisions() {
  const p = SB.Player;
  if (!p.alive) return;
  SB.Items.checkPlayerCollision(p);
}

// ── Collision: Player Projectiles ↔ Enemies ──
function checkProjectileCollisions() {
  for (let i = SB.playerProjectiles.length - 1; i >= 0; i--) {
    const proj = SB.playerProjectiles[i];
    if (!proj.alive) { SB.playerProjectiles.splice(i, 1); continue; }

    // Check vs enemies
    for (const e of SB.enemies) {
      if (!e.alive) continue;
      if (SB.Utils.aabb(proj.x, proj.y, proj.w || 8, proj.h || 8, e.x, e.y, e.w, e.h)) {
        e.hit(proj.damage || 1);
        proj.alive = false;
        SB.Particles.emit('fire', e.x + e.w / 2, e.y + e.h / 2);
        if (!e.alive) {
          SB.Audio.sfx('enemyDie');
          SB.Particles.emit('death', e.x + e.w / 2, e.y + e.h / 2);
          SB.Player.score += e.score;
          SB.enemiesDefeated++;
        }
        break;
      }
    }

    // Check vs boss
    if (proj.alive && SB.boss && SB.boss.alive && SB.boss.vulnerable) {
      const b = SB.boss;
      if (SB.Utils.aabb(proj.x, proj.y, proj.w || 8, proj.h || 8, b.x, b.y, b.w, b.h)) {
        const dead = b.hit(proj.damage || 1);
        proj.alive = false;
        SB.Camera.shake(4, 0.2);
        if (dead) {
          SB.Player.score += 5000;
          // Timer-based collect phase starts in boss._dropDefeatLoot
          // Level complete will trigger when bossDefeatTimer expires
        }
      }
    }
  }
}

// ── Collision: Boss Projectiles ↔ Player ──
function checkBossProjectileCollisions() {
  const p = SB.Player;
  if (!p.alive || p.invTimer > 0) return;

  // Boss projectiles
  if (SB.boss) {
    const projs = SB.boss.projectiles || [];
    for (let i = projs.length - 1; i >= 0; i--) {
      const proj = projs[i];
      if (SB.Utils.aabb(p.x, p.y, p.hitW, p.hitH, proj.x, proj.y, proj.w || 8, proj.h || 8)) {
        p.takeDamage(1, proj.x < p.x ? 1 : -1);
        projs.splice(i, 1);
      }
    }
  }

  // Enemy projectiles (turrets etc.)
  for (const e of SB.enemies) {
    if (!e.active || !e.projectiles) continue;
    for (let i = e.projectiles.length - 1; i >= 0; i--) {
      const proj = e.projectiles[i];
      if (SB.Utils.aabb(p.x, p.y, p.hitW, p.hitH, proj.x, proj.y, proj.w || 6, proj.h || 6)) {
        p.takeDamage(1, proj.x < p.x ? 1 : -1);
        e.projectiles.splice(i, 1);
      }
    }
  }
}

// ── Check exit/checkpoint tiles ──
function checkSpecialTiles() {
  const p = SB.Player;
  if (!p.alive || !SB.Level.tilemap) return;
  const tm = SB.Level.tilemap;
  const T = SB.T;

  // Player center tile
  const cx = Math.floor((p.x + p.hitW / 2) / SB.TILE);
  const cy = Math.floor((p.y + p.hitH / 2) / SB.TILE);

  // Check 2x2 area around player
  for (let dy = -1; dy <= 1; dy++) {
    for (let dx = -1; dx <= 1; dx++) {
      const t = tm.get(cx + dx, cy + dy);
      const tx = (cx + dx) * SB.TILE;
      const ty = (cy + dy) * SB.TILE;

      // Exit door — blocked if boss is alive
      if (t === T.EXIT && SB.Utils.aabb(p.x, p.y, p.hitW, p.hitH, tx, ty, SB.TILE, SB.TILE)) {
        if (SB.gameState === 'PLAYING') {
          // Boss must be defeated to use exit
          if (SB.boss && SB.boss.active && !SB.boss.defeated) {
            SB.HUD.notify('ต้องเอาชนะบอสก่อน!', 1.5);
            continue;
          }
          SB.UI.initLevelComplete(
            SB.Level.info ? SB.Level.info.timeLimit - SB.gameTimer : 0,
            p.coins,
            SB.enemiesDefeated
          );
        }
        return;
      }

      // Checkpoint — activates when walking near (wider zone)
      if (t === T.CHECKPOINT) {
        const cpDist = Math.abs((p.x + p.hitW / 2) - (tx + 8));
        if (cpDist < 24 && Math.abs((p.y + p.hitH / 2) - (ty + 8)) < 24) {
          if (p.checkpointX !== tx) {
            p.checkpointX = tx;
            p.checkpointY = ty - p.hitH + SB.TILE;
            SB.Audio.sfx('checkpoint');
            SB.Particles.emit('checkpoint', tx + 8, ty + 8);
            SB.HUD.notify('CHECKPOINT!', 1.5);
          }
        }
      }
    }
  }

  // Boss arena trigger
  if (SB.Level.bossArenaX > 0 && p.x > SB.Level.bossArenaX - 32 && SB.boss && !SB.boss.activated) {
    SB.boss.activated = true;
    SB.boss.activate(SB.Level.bossArenaX);
    SB.Camera.lock(SB.Level.bossArenaX);
    // Respawn inside arena if player dies during boss fight
    SB.Player.checkpointX = SB.Level.bossArenaX + SB.TILE * 2;
    SB.Player.checkpointY = SB.Player.y;
    SB.Audio.playBGM('boss');
    SB.HUD.notify(SB.boss.name || 'BOSS FIGHT!', 2);
  }
}

// ── Update playing state ──
function updatePlaying(dt) {
  // Timer
  if (SB.gameTimer > 0) {
    SB.gameTimer -= dt;
    if (SB.gameTimer <= 0) {
      SB.Player.die();
      return;
    }
  }

  // Player
  SB.Player.update(dt);

  // Camera
    SB.Camera.follow(SB.Player, dt);
    SB.Camera.update(dt);
  // Enemies
  for (const e of SB.enemies) {
    if (e.alive) e.update(dt);
  }

  // Boss
  if (SB.boss && SB.boss.alive) {
    SB.boss.update(dt, SB.Player);
  }

  // Player projectiles
  for (let i = SB.playerProjectiles.length - 1; i >= 0; i--) {
    const proj = SB.playerProjectiles[i];
    if (!proj.alive) { SB.playerProjectiles.splice(i, 1); continue; }
    proj.x += proj.vx * dt;
    proj.y += (proj.vy || 0) * dt;
    proj.life -= dt;
    if (proj.life <= 0 || proj.x < SB.Camera.x - 50 || proj.x > SB.Camera.x + SB.W + 50) {
      proj.alive = false;
    }
  }

  // Items
  SB.Items.update(dt);

  // Particles
  SB.Particles.update(dt);

  // HUD
  SB.HUD.update(dt);

  // Collision checks
  checkPlayerEnemyCollisions();
  checkPlayerBossCollision();
  checkPlayerItemCollisions();
  checkProjectileCollisions();
  checkBossProjectileCollisions();
  checkSpecialTiles();

  // Player death → reset or game over
  if (!SB.Player.alive && SB.Player.deathTimer > 1.5) {
    if (SB.Player.lives > 0) {
      SB.Player.respawn();
    } else {
      SB.UI.initGameOver();
    }
  }

  // Fall into pit
  if (SB.Player.y > SB.Level.tilemap.h * SB.TILE + 100) {
    if (SB.Player.alive) SB.Player.die();
  }

  // Reset combo if not stomping for a while
  SB.totalTime += dt;

  // Boss defeat countdown timer
  if (SB.bossDefeatActive && SB.bossDefeatTimer > 0) {
    SB.bossDefeatTimer -= dt;
    if (SB.bossDefeatTimer <= 0) {
      SB.bossDefeatActive = false;
      SB.UI.initLevelComplete(
        SB.Level.info ? SB.Level.info.timeLimit - SB.gameTimer : 0,
        SB.Player.coins, SB.enemiesDefeated
      );
    }
  }
}

// ══════ MAIN GAME LOOP ══════
let lastTime = 0;
let _fpsLastFrame = 0;
let _smoothDt = 1 / 60;

function gameLoop(timestamp) {
  // FPS cap: skip frame if too soon
  const fpsCap = SB.Save.data.settings.fpsCap || 60;
  if (fpsCap < 200) {
    const interval = 1000 / fpsCap;
    const elapsed = timestamp - _fpsLastFrame;
    if (elapsed < interval) { requestAnimationFrame(gameLoop); return; }
    _fpsLastFrame = timestamp - (elapsed % interval);
  }
  const rawDt = Math.min((timestamp - lastTime) / 1000, 0.05); // Cap at 50ms
  lastTime = timestamp;
  // Smooth delta to reduce frame-time spikes
  _smoothDt = _smoothDt * 0.8 + rawDt * 0.2;
  const dt = _smoothDt;

  try {
    // Input
    SB.Input.update();

    // UI input handling (all states)
    SB.UI.handleInput();
    SB.UI.update(dt);

    // State-specific update
    if (SB.gameState === 'PLAYING') {
      // Pause check (keyboard/touch + gear button click)
      let gearClicked = false;
      let itemClicked = false;
      // Item slot click check FIRST (higher priority than gear)
      if (SB.Input.mouse.clicked && SB.HUD._itemSlots) {
        for (const slot of SB.HUD._itemSlots) {
          if (SB.Input.mouse.x >= slot.x && SB.Input.mouse.x <= slot.x + slot.w &&
              SB.Input.mouse.y >= slot.y && SB.Input.mouse.y <= slot.y + slot.h) {
            SB.HUD.useItem(slot.id);
            itemClicked = true;
            break;
          }
        }
      }
      // Gear button check only if no item was clicked
      if (!itemClicked && SB.Input.mouse.clicked && SB.HUD._gearBtn) {
        const g = SB.HUD._gearBtn;
        if (SB.Input.mouse.x >= g.x && SB.Input.mouse.x <= g.x + g.w &&
            SB.Input.mouse.y >= g.y && SB.Input.mouse.y <= g.y + g.h) {
          gearClicked = true;
        }
      }
      // Number keys 1-5 to use items
      const itemKeys = ['Digit1','Digit2','Digit3','Digit4','Digit5'];
      const itemIds = ['speed','heart','shield','magnet','sword'];
      for (let ki = 0; ki < 5; ki++) {
        if (SB.Input.keys[itemKeys[ki]] && !SB.Input.prev[itemKeys[ki]]) {
          SB.HUD.useItem(itemIds[ki]);
        }
      }

      if (SB.Input.pausePressed || gearClicked) {
        SB.UI.initPause();
      } else {
        updatePlaying(dt);
      }
    }

    // Render
    SB.Renderer.render();
  } catch (err) {
    // Draw error to canvas so we can debug
    const ctx = SB.Renderer.ctx;
    if (ctx) {
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, SB.W, SB.H);
      ctx.fillStyle = '#e74c3c';
      ctx.font = 'bold 18px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('ERROR: ' + err.message, SB.W / 2, SB.H / 2 - 20);
      ctx.fillStyle = '#bdc3c7';
      ctx.font = '12px monospace';
      const stack = (err.stack || '').split('\n').slice(0, 4);
      stack.forEach((line, i) => ctx.fillText(line.trim().substring(0, 80), SB.W / 2, SB.H / 2 + 10 + i * 18));
    }
    console.error('Slime Bouncer Error:', err);
  }

  // Next frame
  requestAnimationFrame(gameLoop);
}

// ══════ INITIALIZATION ══════
function init() {
  SB.Renderer.init();
  SB.Input.init();
  SB.Save.load();

  // Apply saved audio settings
  const s = SB.Save.data.settings;
  SB.Audio.setBGMVolume(s.bgmVol);
  SB.Audio.setSFXVolume(s.sfxVol);
  SB.Renderer.applyResolution(s.resolution || 1);

  // Initialize player
  SB.Player.init();

  // Restore last screen or go to title
  const lastScreen = SB.Save.data.lastScreen || 'TITLE';
  if (lastScreen === 'WORLD_MAP') {
    SB.UI.initWorldMap();
  } else if (lastScreen === 'WORLD_SELECT') {
    SB.UI.initWorldSelect();
  } else {
    SB.UI.initTitle();
  }

  // Start game loop
  lastTime = performance.now();
  requestAnimationFrame(gameLoop);
}

// Save on page unload
window.addEventListener('beforeunload', () => {
  if (SB.Save.data) SB.Save.save();
});
window.addEventListener('pagehide', () => {
  if (SB.Save.data) SB.Save.save();
});
// Periodic auto-save every 30s
setInterval(() => {
  if (SB.Save.data) SB.Save.save();
}, 30000);

// Wait for DOM
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
})();
