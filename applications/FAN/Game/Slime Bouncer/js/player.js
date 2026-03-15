/* ══════════════════════════════════════════════
   Slime Bouncer — Player System
   Movement, jumping, stomping, morphs, HP
   ═════════════════════════════════════════════ */
'use strict';
(function() {
const SB = window.SB || (window.SB = {});
const U = SB.Utils;

// Physics constants (from GAME-PLAN)
const GRAVITY = 980;
const MAX_FALL = 600;
const MOVE_ACCEL = 1200;
const MAX_SPEED = 180;
const GROUND_FRIC = 800;
const AIR_FRIC = 200;
const JUMP_VEL = -420;
const JUMP_CUT = 0.4;
const COYOTE = 0.08;
const JUMP_BUF = 0.1;
const STOMP_BOUNCE = -350;

SB.Player = {
  // Position & physics
  x: 0, y: 0, w: 18, h: 20,
  spriteW: 24, spriteH: 24,
  vx: 0, vy: 0,
  facingDir: 1,
  onGround: false,

  // State
  state: 'idle', // idle, walk, jump, fall, hurt, dead
  hp: 3, maxHp: 3,
  lives: 3,
  coins: 0,
  score: 0,
  combo: 0,
  comboTimer: 0,

  // Timers
  coyoteTimer: 0,
  jumpBuffer: 0,
  invTimer: 0,       // invincibility after hit
  hurtTimer: 0,
  deathTimer: 0,

  // Morph
  morph: 'none', // none, fire, ice, wind
  morphTimer: 0,

  // Gun (given during boss fight)
  hasGun: false,
  gunCooldown: 0,

  // Power-up effects
  speedMult: 1,
  shield: false,
  magnet: false,
  magnetTimer: 0,
  speedTimer: 0,
  swordTimer: 0,
  swordCooldown: 0,

  // Checkpoint
  checkpointX: 0, checkpointY: 0,

  // Anim
  frame: 0, frameTimer: 0,
  squash: 0, // land squash animation

  reset(x, y) {
    this.x = x || 32; this.y = y || 400;
    this.vx = 0; this.vy = 0;
    this.state = 'idle';
    this.hp = 3; this.maxHp = 3;
    this.onGround = false;
    this.invTimer = 0; this.hurtTimer = 0; this.deathTimer = 0;
    this.combo = 0; this.comboTimer = 0;
    this.morph = 'none'; this.morphTimer = 0;
    this.shield = false; this.magnet = false;
    this.speedMult = 1; this.speedTimer = 0; this.magnetTimer = 0;
    this.hasGun = false; this.gunCooldown = 0;
    this.swordTimer = 0; this.swordCooldown = 0;
    this.airJumpsLeft = 1;
    this.checkpointX = x || 32; this.checkpointY = y || 400;
    this.frame = 0; this.squash = 0;
    this.facingDir = 1;
    this.blinkTimer = 3 + Math.random() * 3;
    this.blinkState = 0; // 0=open, >0 = closing/closed
    this.bossFightMode = false;
    this.tripleShot = false;
    this.tripleShotTimer = 0;
  },

  fullReset() {
    this.lives = 3;
    this.coins = 0;
    this.score = 0;
    this.reset(32, 400);
  },

  // Hitbox aliases for collision checks
  get hitW() { return this.w; },
  get hitH() { return this.h; },
  get alive() { return this.state !== 'dead'; },

  init() { this.fullReset(); },

  update(dt) {
    if (this.state === 'dead') {
      this.deathTimer += dt;
      return;
    }

    const input = SB.Input;
    const tilemap = SB.Level.tilemap;
    if (!tilemap) return;

    // ── Morph / Power-up timers ──
    if (this.morphTimer > 0) { this.morphTimer -= dt; if (this.morphTimer <= 0) this.morph = 'none'; }
    if (this.speedTimer > 0) { this.speedTimer -= dt; if (this.speedTimer <= 0) this.speedMult = 1; }
    if (this.magnetTimer > 0) { this.magnetTimer -= dt; if (this.magnetTimer <= 0) this.magnet = false; }
    if (this.invTimer > 0) this.invTimer -= dt;
    if (this.hurtTimer > 0) { this.hurtTimer -= dt; if (this.hurtTimer <= 0) this.state = 'idle'; }
    if (this.comboTimer > 0) { this.comboTimer -= dt; if (this.comboTimer <= 0) this.combo = 0; }
    if (this.squash > 0) this.squash -= dt * 5;
    if (this.gunCooldown > 0) this.gunCooldown -= dt;
    if (this.swordTimer > 0) this.swordTimer -= dt;
    if (this.swordCooldown > 0) this.swordCooldown -= dt;
    if (this.tripleShotTimer > 0) { this.tripleShotTimer -= dt; if (this.tripleShotTimer <= 0) this.tripleShot = false; }

    // ── Eye blink timer ──
    if (this.blinkState > 0) {
      this.blinkState -= dt * 8;
      if (this.blinkState <= 0) { this.blinkState = 0; this.blinkTimer = 2.5 + Math.random() * 4; }
    } else {
      this.blinkTimer -= dt;
      if (this.blinkTimer <= 0) this.blinkState = 1;
    }

    // ── Hurt state: no input ──
    if (this.state === 'hurt') return;

    // ── Horizontal Movement ──
    const maxSpd = MAX_SPEED * this.speedMult;
    if (input.leftHeld()) {
      this.vx -= MOVE_ACCEL * dt;
      if (this.vx < -maxSpd) this.vx = -maxSpd;
      this.facingDir = -1;
    } else if (input.rightHeld()) {
      this.vx += MOVE_ACCEL * dt;
      if (this.vx > maxSpd) this.vx = maxSpd;
      this.facingDir = 1;
    } else {
      // Friction
      const fric = this.onGround ? GROUND_FRIC : AIR_FRIC;
      if (this.vx > 0) { this.vx -= fric * dt; if (this.vx < 0) this.vx = 0; }
      else if (this.vx < 0) { this.vx += fric * dt; if (this.vx > 0) this.vx = 0; }
    }

    // ── Coyote Time ──
    if (this.onGround) {
      this.coyoteTimer = COYOTE;
      this.airJumpsLeft = 1;
    } else {
      this.coyoteTimer -= dt;
    }

    // ── Jump Buffer ──
    // During boss fight, ArrowUp triggers jump (W/Space/Click = shoot)
    const jumpPress = this.bossFightMode
      ? ((!input.prev.ArrowUp && input.keys.ArrowUp) || (input.touch.a && !input._prevTouch.a))
      : input.jumpPressed;
    if (jumpPress) {
      this.jumpBuffer = JUMP_BUF;
    } else {
      this.jumpBuffer -= dt;
    }

    // ── Jump ──
    const canJump = this.coyoteTimer > 0;
    if (this.jumpBuffer > 0 && canJump) {
      this.vy = JUMP_VEL;
      this.coyoteTimer = 0;
      this.jumpBuffer = 0;
      this.onGround = false;
      SB.Audio.sfx('jump');
    } else if (this.jumpBuffer > 0 && this.airJumpsLeft > 0 && !this.onGround) {
      // Double jump (air jump)
      this.vy = JUMP_VEL;
      this.airJumpsLeft--;
      this.jumpBuffer = 0;
      SB.Audio.sfx('jump');
    }

    // ── Variable Jump Height ──
    if (!input.jumpHeld() && this.vy < 0) {
      this.vy *= JUMP_CUT;
    }

    // ── Gravity ──
    this.vy += GRAVITY * dt;
    if (this.vy > MAX_FALL) this.vy = MAX_FALL;

    // ── Attack (morph abilities + gun) ──
    if (this.bossFightMode) {
      // During boss fight: W / Space / mouse click = shoot upward
      const shootPress = (!input.prev.KeyW && input.keys.KeyW)
        || (!input.prev.Space && input.keys.Space)
        || (input.touch.b && !input._prevTouch.b)
        || input.mouse.clicked;
      if (shootPress) {
        if (this.hasGun && this.gunCooldown <= 0) this._bossGunAttack();
      }
    } else if (input.attackPressed) {
      if (this.hasGun && this.gunCooldown <= 0) {
        this._gunAttack();
      } else if (this.morph === 'fire') {
        this._fireAttack();
      }
    }

    // ── Sword auto-attack ──
    if (this.swordTimer > 0 && this.swordCooldown <= 0) {
      this._swordAutoAttack();
      this.swordCooldown = 0.8;
    }

    // ── Move & Collide ──
    this._moveAndCollide(dt);

    // ── Update animation state ──
    if (this.onGround) {
      this.state = Math.abs(this.vx) > 10 ? 'walk' : 'idle';
    } else {
      this.state = this.vy < 0 ? 'jump' : 'fall';
    }

    // Frame animation
    this.frameTimer += dt;
    const animSpeed = this.state === 'walk' ? 0.08 : 0.15;
    if (this.frameTimer > animSpeed) {
      this.frameTimer = 0;
      this.frame = (this.frame + 1) % 4;
    }

    // Morph particles
    if (this.morph === 'fire' && Math.random() < 0.15) SB.Particles.emit('fire', this.x + this.w / 2, this.y + this.h);
    if (this.morph === 'ice' && Math.random() < 0.15) SB.Particles.emit('ice', this.x + this.w / 2, this.y + this.h);
    // Speed boost trail particles
    if (this.speedTimer > 0 && Math.abs(this.vx) > 10) {
      this._speedParticleTimer = (this._speedParticleTimer || 0) + dt;
      if (this._speedParticleTimer > 0.03) {
        this._speedParticleTimer = 0;
        SB.Particles.emit('speedTrail', this.x + this.w / 2, this.y + this.h * 0.6, { dir: this.facingDir, vx: this.vx });
      }
    }

    // ── Fall death (handled by main.js) ──
  },

  _moveAndCollide(dt) {
    const tilemap = SB.Level.tilemap;
    if (!tilemap) return;
    // Move X
    this.x += this.vx * dt;

    // Tile collision X
    const top  = Math.floor(this.y / SB.TILE);
    const bot  = Math.floor((this.y + this.h - 1) / SB.TILE);
    const midY = Math.floor((this.y + this.h / 2) / SB.TILE);

    if (this.vx > 0) {
      const col = Math.floor((this.x + this.w) / SB.TILE);
      for (let r = top; r <= bot; r++) {
        if (SB.SOLID_TILES.has(tilemap.get(col, r))) {
          this.x = col * SB.TILE - this.w;
          this.vx = 0; break;
        }
      }
    } else if (this.vx < 0) {
      const col = Math.floor(this.x / SB.TILE);
      for (let r = top; r <= bot; r++) {
        if (SB.SOLID_TILES.has(tilemap.get(col, r))) {
          this.x = (col + 1) * SB.TILE;
          this.vx = 0; break;
        }
      }
    }

    // Move Y
    const prevY = this.y;
    this.y += this.vy * dt;
    this.onGround = false;

    const left  = Math.floor(this.x / SB.TILE);
    const right = Math.floor((this.x + this.w - 1) / SB.TILE);

    if (this.vy > 0) {
      // Falling — check floor
      const row = Math.floor((this.y + this.h) / SB.TILE);
      for (let c = left; c <= right; c++) {
        const t = tilemap.get(c, row);
        if (SB.SOLID_TILES.has(t) || t === SB.T.PLATFORM) {
          // One-way platform: only collide if coming from above
          if (t === SB.T.PLATFORM) {
            const tileTop = row * SB.TILE;
            if (prevY + this.h > tileTop + 4) continue;
          }
          this.y = row * SB.TILE - this.h;
          if (!this.onGround && this.vy > 100) {
            SB.Particles.emit('dust', this.x + this.w / 2, this.y + this.h);
            this.squash = 1;
          }
          this.vy = 0;
          this.onGround = true;

          // Check spike
          if (t === SB.T.SPIKE) { this.takeDamage(1); }
          break;
        }
      }
      // Spring
      for (let c = left; c <= right; c++) {
        if (tilemap.get(c, row) === SB.T.SPRING) {
          this.y = row * SB.TILE - this.h;
          this.vy = JUMP_VEL * 2;
          this.onGround = false;
          SB.Audio.sfx('spring');
          break;
        }
      }
    } else if (this.vy < 0) {
      // Rising — check ceiling
      const row = Math.floor(this.y / SB.TILE);
      for (let c = left; c <= right; c++) {
        const t = tilemap.get(c, row);
        if (t === SB.T.PLATFORM) continue; // pass through platforms
        if (SB.SOLID_TILES.has(t)) {
          this.y = (row + 1) * SB.TILE;
          this.vy = 0;

          // ? Block hit
          if (t === SB.T.QBLOCK) {
            tilemap.set(c, row, SB.T.EMPTY_BLOCK);
            SB.Items.spawnFromQBlock(c, row);
            SB.Audio.sfx('qblock');
          }
          break;
        }
        // Invisible block
        if (t === SB.T.INVIS_BLOCK) {
          tilemap.set(c, row, SB.T.EMPTY_BLOCK);
          SB.Items.spawnFromQBlock(c, row);
          SB.Audio.sfx('qblock');
          this.y = (row + 1) * SB.TILE;
          this.vy = 0;
          break;
        }
      }
    }

    // Clamp to level left edge
    if (this.x < 0) { this.x = 0; this.vx = 0; }
  },

  _fireAttack() {
    // Spawn fireball
    SB.playerProjectiles.push({
      x: this.x + (this.facingDir > 0 ? this.w : -8),
      y: this.y + this.h / 2 - 4,
      vx: this.facingDir * 300,
      vy: 0, w: 8, h: 8, life: 1, alive: true,
      color: '#f39c12', type: 'fireball', damage: 1
    });
  },

  _gunAttack() {
    this.gunCooldown = 0.25;
    SB.playerProjectiles.push({
      x: this.x + (this.facingDir > 0 ? this.w + 2 : -10),
      y: this.y + this.h / 2 - 3,
      vx: this.facingDir * 400,
      vy: 0, w: 6, h: 4, life: 1.2, alive: true,
      color: '#f1c40f', type: 'bullet', damage: 1
    });
    SB.Audio.sfx('shoot');
  },

  _bossGunAttack() {
    this.gunCooldown = 0.22;
    const cx = this.x + this.w / 2;
    if (this.tripleShot) {
      // Triple spread upward
      for (let i = -1; i <= 1; i++) {
        SB.playerProjectiles.push({
          x: cx - 3 + i * 6, y: this.y - 4,
          vx: i * 80, vy: -420,
          w: 5, h: 5, life: 1.5, alive: true,
          color: '#00e5ff', type: 'bossBullet', damage: 1
        });
      }
    } else {
      SB.playerProjectiles.push({
        x: cx - 3, y: this.y - 4,
        vx: 0, vy: -420,
        w: 6, h: 6, life: 1.5, alive: true,
        color: '#f1c40f', type: 'bossBullet', damage: 1
      });
    }
    SB.Audio.sfx('shoot');
  },

  _swordAutoAttack() {
    // Find nearest enemy within range and damage it
    const range = 60;
    let nearest = null, nearDist = range;
    for (const e of SB.enemies) {
      if (!e.alive) continue;
      const d = SB.Utils.dist(this.x + this.w / 2, this.y + this.h / 2, e.x + e.w / 2, e.y + e.h / 2);
      if (d < nearDist) { nearest = e; nearDist = d; }
    }
    if (nearest) {
      nearest.hit(2);
      SB.Particles.emit('fire', nearest.x + nearest.w / 2, nearest.y + nearest.h / 2);
      if (!nearest.alive) { SB.enemiesDefeated++; this.score += nearest.score; }
    }
    // Also hit boss
    if (SB.boss && SB.boss.alive) {
      const d = SB.Utils.dist(this.x + this.w / 2, this.y + this.h / 2, SB.boss.x + SB.boss.w / 2, SB.boss.y + SB.boss.h / 2);
      if (d < range) { SB.boss.hit(1); SB.Camera.shake(3, 0.15); }
    }
    SB.Audio.sfx('swordSwing');
  },

  takeDamage(dmg, knockDir) {
    if (this.invTimer > 0 || this.state === 'dead') return;
    if (this.shield) {
      this.shield = false;
      this.invTimer = 1.0;
      SB.Audio.sfx('powerup');
      SB.Camera.shake(3, 0.15);
      SB.Particles.emit('powerup', this.x + this.w / 2, this.y + this.h / 2);
      return;
    }

    this.hp -= dmg;
    this.invTimer = 1.5;
    this.hurtTimer = 0.3;
    this.state = 'hurt';
    SB.Audio.sfx('hurt');
    SB.Camera.shake(4, 0.2);

    // Knockback
    const dir = knockDir || (this.facingDir * -1);
    this.vx = dir * 200;
    this.vy = -200;

    if (this.morph !== 'none') { this.morph = 'none'; this.morphTimer = 0; }

    if (this.hp <= 0) this.die();
  },

  die() {
    if (this.state === 'dead') return;
    this.state = 'dead';
    this.deathTimer = 0;
    this.vx = 0; this.vy = 0;
    SB.Particles.emit('death', this.x + this.w / 2, this.y + this.h / 2);
    SB.Audio.sfx('die');
    this.lives--;
  },

  respawn() {
    this.x = this.checkpointX;
    this.y = this.checkpointY;
    this.vx = 0; this.vy = 0;
    this.hp = this.maxHp;
    this.state = 'idle';
    this.deathTimer = 0;
    this.invTimer = 2;
    this.morph = 'none'; this.morphTimer = 0;
  },

  collectCoin(coin) {
    coin.collected = true;
    this.coins++;
    this.score += coin.value;
    SB.Particles.emit('coinCollect', coin.x, coin.y);
    SB.Items.addFloatText(coin.x, coin.y - 5, '+' + coin.value, coin.color);

    if (coin.type === 'ancient') SB.Audio.sfx('ancientCoin');
    else if (coin.type === 'red') SB.Audio.sfx('redCoin');
    else SB.Audio.sfx('coin');

    // 100 coins = 1UP
    if (this.coins % 100 === 0 && this.coins > 0) {
      this.lives++;
      SB.Audio.sfx('oneUp');
      SB.Items.addFloatText(this.x, this.y - 20, '1UP!', '#2ecc71');
    }
  },

  collectPowerUp(pu) {
    pu.collected = true;
    SB.Particles.emit('powerup', pu.x + pu.w / 2, pu.y + pu.h / 2);
    SB.Audio.sfx('powerup');

    switch (pu.type) {
      case 'heart': if (this.hp < this.maxHp) this.hp++; else if (this.maxHp < 5) { this.maxHp++; this.hp++; } break;
      case 'speed': this.speedMult = 1.5; this.speedTimer = 10; break;
      case 'shield': this.shield = true; break;
      case 'magnet': this.magnet = true; this.magnetTimer = 15; break;
      case 'oneup': this.lives++; SB.Audio.sfx('oneUp'); SB.Items.addFloatText(this.x, this.y - 20, '1UP!', '#2ecc71'); break;
      case 'fire': this.morph = 'fire'; this.morphTimer = 30; break;
      case 'ice': this.morph = 'ice'; this.morphTimer = 25; break;
      case 'wind': this.morph = 'wind'; this.morphTimer = 20; break;
      case 'triple_shot': this.tripleShot = true; this.tripleShotTimer = 15; SB.HUD.notify('Triple Shot!', 2); break;
    }
  },

  draw(ctx, cam) {
    if (this.state === 'dead' && this.deathTimer > 1.2) return;
    // Invincibility flicker
    if (this.invTimer > 0 && Math.floor(this.invTimer * 12) % 2 === 0) return;

    const sx = Math.round(this.x - 3 - cam.x); // sprite offset (18→24)
    let sy = Math.round(this.y - 4 - cam.y);
    const sw = this.spriteW;
    let sh = this.spriteH;

    // ── Squash & Stretch (bouncy slime physics) ──
    let scaleX = 1, scaleY = 1;
    if (this.squash > 0) {
      // Landing squash: wide + short
      const s = this.squash * 0.35;
      scaleX = 1 + s * 0.5;
      scaleY = 1 - s;
    } else if (this.state === 'jump' && this.vy < -100) {
      // Jumping stretch: tall + narrow
      scaleX = 0.85;
      scaleY = 1.15;
    } else if (this.state === 'fall' && this.vy > 200) {
      // Falling stretch
      scaleX = 0.9;
      scaleY = 1.1;
    }
    // Idle jiggle (breathing)
    if (this.state === 'idle') {
      const breathe = Math.sin((SB.UI.animTime || 0) * 3) * 0.03;
      scaleX += breathe;
      scaleY -= breathe;
    }
    // Walk bounce
    if (this.state === 'walk') {
      const walkBob = Math.sin(this.frame * Math.PI / 2) * 0.06;
      scaleY -= walkBob;
      scaleX += walkBob * 0.5;
    }

    // ── Draw Glim (Slime) ──
    // Drop shadow
    if (SB.Save.data.settings.shadows) {
      ctx.save();
      ctx.fillStyle = 'rgba(0,0,0,0.18)';
      ctx.beginPath();
      ctx.ellipse(sx + sw / 2, Math.round(this.y + this.h - cam.y) + 2, 10, 3, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // Body color based on morph
    let bodyColor = '#2ecc71'; // emerald green
    let bodyDark = '#1fa855';
    let bodyLight = '#5dff8f';
    if (this.morph === 'fire') { bodyColor = '#e67e22'; bodyDark = '#c0611a'; bodyLight = '#f39c12'; }
    else if (this.morph === 'ice') { bodyColor = '#00bcd4'; bodyDark = '#0097a7'; bodyLight = '#4dd0e1'; }
    else if (this.morph === 'wind') { bodyColor = '#8bc34a'; bodyDark = '#689f38'; bodyLight = '#aed581'; }

    const flip = this.facingDir < 0;
    const cx = sx + sw / 2;
    const cy = sy + sh / 2 + 2;

    ctx.save();
    ctx.translate(cx, sy + sh);
    ctx.scale(scaleX, scaleY);
    ctx.translate(-cx, -(sy + sh));

    // Shield bubble
    if (this.shield) {
      ctx.strokeStyle = 'rgba(52,152,219,0.4)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(cx, cy, 17, 0, Math.PI * 2);
      ctx.stroke();
      // Shimmer
      ctx.strokeStyle = 'rgba(52,152,219,0.2)';
      ctx.beginPath();
      ctx.arc(cx, cy, 19, -0.5, 0.5);
      ctx.stroke();
    }

    // ── Slime body (smooth blob shape using arcs) ──
    ctx.fillStyle = bodyColor;
    ctx.beginPath();
    ctx.moveTo(sx + 5, sy + sh - 2);
    ctx.quadraticCurveTo(sx + 2, sy + sh * 0.5, sx + 5, sy + 6);
    ctx.quadraticCurveTo(sx + sw / 2, sy + 1, sx + sw - 5, sy + 6);
    ctx.quadraticCurveTo(sx + sw - 2, sy + sh * 0.5, sx + sw - 5, sy + sh - 2);
    ctx.quadraticCurveTo(sx + sw / 2, sy + sh, sx + 5, sy + sh - 2);
    ctx.fill();

    // Darker bottom gradient layer
    ctx.fillStyle = bodyDark;
    ctx.beginPath();
    ctx.moveTo(sx + 4, sy + sh - 2);
    ctx.quadraticCurveTo(sx + 3, sy + sh * 0.65, sx + 6, sy + sh * 0.55);
    ctx.lineTo(sx + sw - 6, sy + sh * 0.55);
    ctx.quadraticCurveTo(sx + sw - 3, sy + sh * 0.65, sx + sw - 4, sy + sh - 2);
    ctx.quadraticCurveTo(sx + sw / 2, sy + sh + 1, sx + 4, sy + sh - 2);
    ctx.fill();

    // Highlight (specular reflection)
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    ctx.beginPath();
    ctx.ellipse(sx + 9, sy + 7, 4, 3, -0.3, 0, Math.PI * 2);
    ctx.fill();
    // Small sparkle
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.beginPath();
    ctx.arc(sx + 7, sy + 6, 1.5, 0, Math.PI * 2);
    ctx.fill();

    // Eyes (with input-based pupil tracking + blinking)
    const eyeOff = flip ? -2 : 2;
    const blinking = this.blinkState > 0.3;
    if (blinking) {
      // Closed eyes — thin lines
      ctx.strokeStyle = '#333';
      ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.moveTo(sx + 5 + eyeOff, sy + 12); ctx.lineTo(sx + 11 + eyeOff, sy + 12); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(sx + 13 + eyeOff, sy + 12); ctx.lineTo(sx + 19 + eyeOff, sy + 12); ctx.stroke();
    } else {
      // Eye whites
      ctx.fillStyle = '#fff';
      ctx.beginPath(); ctx.ellipse(sx + 8 + eyeOff, sy + 12, 3, 3.5, 0, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.ellipse(sx + 16 + eyeOff, sy + 12, 3, 3.5, 0, 0, Math.PI * 2); ctx.fill();
      // Pupils (follow input direction: left/right/up/diagonal)
      const inp = SB.Input;
      let pupilX = flip ? -1 : 1;
      let pupilY = 0;
      if (inp.leftHeld()) pupilX = -1.5;
      else if (inp.rightHeld()) pupilX = 1.5;
      if (inp.upHeld()) pupilY = -1.2;
      else if (this.state === 'fall' && this.vy > 150) pupilY = 1;
      ctx.fillStyle = '#111';
      ctx.beginPath(); ctx.arc(sx + 8 + eyeOff + pupilX, sy + 12.5 + pupilY, 1.8, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(sx + 16 + eyeOff + pupilX, sy + 12.5 + pupilY, 1.8, 0, Math.PI * 2); ctx.fill();
      // Eye shine
      ctx.fillStyle = '#fff';
      ctx.fillRect(sx + 7 + eyeOff + pupilX, sy + 11 + pupilY, 1, 1);
      ctx.fillRect(sx + 15 + eyeOff + pupilX, sy + 11 + pupilY, 1, 1);
    }

    // Mouth
    if (this.state === 'jump' && this.vy < -100) {
      // Excited open mouth
      ctx.fillStyle = bodyDark;
      ctx.beginPath();
      ctx.arc(sx + 12 + eyeOff * 0.5, sy + 17, 2.5, 0, Math.PI);
      ctx.fill();
    } else if (this.state === 'hurt') {
      // Distressed mouth
      ctx.strokeStyle = bodyDark;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(sx + 12, sy + 17, 2, Math.PI, 0);
      ctx.stroke();
    } else {
      // Happy curve smile
      ctx.strokeStyle = bodyDark;
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.arc(sx + 12 + eyeOff * 0.3, sy + 16, 3, 0.1, Math.PI - 0.1);
      ctx.stroke();
    }

    // Cheeks (subtle blush)
    ctx.fillStyle = 'rgba(255,120,120,0.25)';
    ctx.beginPath();
    ctx.ellipse(sx + 5, sy + 15, 2.5, 1.5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(sx + 19, sy + 15, 2.5, 1.5, 0, 0, Math.PI * 2);
    ctx.fill();

    // Weapon visual (boss fight cannon on top)
    if (this.hasGun && this.bossFightMode) {
      ctx.fillStyle = '#555';
      ctx.fillRect(sx + 9, sy - 4, 6, 7);
      ctx.fillStyle = '#777';
      ctx.fillRect(sx + 10, sy - 6, 4, 4);
      // Barrel tip
      ctx.fillStyle = this.tripleShot ? '#00e5ff' : '#f1c40f';
      ctx.fillRect(sx + 10.5, sy - 7, 3, 2);
    } else if (this.hasGun) {
      const gx = flip ? sx - 2 : sx + sw - 4;
      ctx.fillStyle = '#555';
      ctx.fillRect(gx, sy + 11, 6, 3);
      ctx.fillStyle = '#f1c40f';
      ctx.fillRect(flip ? gx - 2 : gx + 4, sy + 11.5, 2, 2);
    }

    ctx.restore(); // end squash/stretch transform

    // Speed lines when fast
    if (this.speedMult > 1) {
      ctx.globalAlpha = 0.5;
      ctx.strokeStyle = '#f1c40f';
      ctx.lineWidth = 1.5;
      for (let i = 0; i < 3; i++) {
        const lx = sx - 3 - i * 8;
        const ly = sy + 6 + i * 5;
        ctx.beginPath();
        ctx.moveTo(lx + 6, ly);
        ctx.lineTo(lx, ly + 1);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
    }

    // Sword aura effect
    if (this.swordTimer > 0) {
      const t = SB.UI.animTime || 0;
      for (let i = 0; i < 3; i++) {
        const ang = t * 4 + i * (Math.PI * 2 / 3);
        const orbitX = sx + sw / 2 + Math.cos(ang) * 18;
        const orbitY = sy + sh / 2 + Math.sin(ang) * 14;
        ctx.fillStyle = '#e67e22';
        ctx.fillRect(orbitX - 2, orbitY - 5, 4, 10);
        ctx.fillStyle = '#f1c40f';
        ctx.fillRect(orbitX - 1, orbitY - 6, 2, 3);
      }
    }
  }
};

// Player projectiles (fireballs etc)
SB.playerProjectiles = [];
})();
