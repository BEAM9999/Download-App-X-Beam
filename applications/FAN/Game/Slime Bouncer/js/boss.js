/* ══════════════════════════════════════════════
   Slime Bouncer — Boss System (Shooter Style)
   Bosses move L/R, shoot projectiles.
   Player gets a gun to shoot back.
   HP bar: green → red (enraged).
   ═════════════════════════════════════════════ */
'use strict';
(function() {
const SB = window.SB || (window.SB = {});
const U = SB.Utils;

class Boss {
  constructor(x, y, type) {
    this.x = x; this.y = y; this.type = type;
    this.active = false;
    this.defeated = false;
    this.phase = 1; // 1 = normal, 2 = enraged (red HP bar)
    this.frame = 0; this.frameTimer = 0;
    this.flashTimer = 0;
    this.projectiles = [];
    this.vulnerable = true; // always damageable by player bullets
    this.activated = false;

    const cfg = Boss.TYPES[type] || Boss.TYPES.thornback;
    this.w = cfg.w; this.h = cfg.h;
    this.hp = cfg.hp; this.maxHp = cfg.hp;
    this.color = cfg.color;
    this.name = cfg.name;
    this.arenaX = 0;

    // Movement
    this.moveDir = 1;
    this.speed = cfg.speed || 60;
    this.arenaLeft = 0;
    this.arenaRight = 0;

    // Shooting
    this.shootTimer = 0;
    this.shootInterval = cfg.shootInterval || 1.8;
    this.burstCount = 0;
    this.burstTimer = 0;

    // ── Type-specific state ──
    // Thornback: charge attack + vine whip + spawn mini thorns
    this.chargeTimer = 4;
    this.charging = false;
    this.chargeDur = 0;
    this.vineTimer = 7;
    this.vineActive = false;
    this.vineSweepAngle = 0;
    this.thornSpawnTimer = 12;
    this.thornlings = []; // mini thorn clones
    this.poisonZones = []; // toxic zones after charge

    // Sand Wyrm: burrow attack + fire breath + sandstorm
    this.burrowTimer = 5;
    this.burrowed = false;
    this.burrowDur = 0;
    this.burrowTargetX = 0;
    this.baseY = y;
    this.breathTimer = 8;
    this.breathing = false;
    this.breathDur = 0;
    this.sandstormTimer = 15;
    this.sandstormActive = false;
    this.sandstormDur = 0;

    // Frost Giant: ground slam + ice shard rain + freeze beam
    this.slamTimer = 6;
    this.slamming = false;
    this.slamPhase = 0; // 0=idle,1=rising,2=falling
    this.slamY = 0;
    this.iceRainTimer = 10;
    this.iceRaining = false;
    this.iceRainDur = 0;
    this.freezeBeamTimer = 14;
    this.freezeBeamActive = false;
    this.freezeBeamAngle = 0;
    this.freezeBeamDur = 0;
    this.iceWalls = [];

    // Shadow King: teleport + shadow orbs + clone split + dark meteor + laser sweep
    this.teleportTimer = 4;
    this.orbTimer = 3;
    this.teleportFlash = 0;
    this.cloneSplitTimer = 12;
    this.clones = []; // shadow clones
    this.meteorTimer = 16;
    this.meteorActive = false;
    this.meteorDur = 0;
    this.laserTimer = 20;
    this.laserActive = false;
    this.laserAngle = 0;
    this.laserDur = 0;
    this.soulDrainTimer = 18;
  }

  get alive() { return this.active && !this.defeated; }
  set alive(v) { if (!v) { this.active = false; this.defeated = true; } }

  activate(arenaX) {
    this.active = true;
    this.arenaX = arenaX;
    this.arenaLeft = arenaX + 16;
    this.arenaRight = arenaX + 50 * 16 - this.w - 16;
    this.shootTimer = 1.5;
    SB.Audio.sfx('bossPhase');

    // Give player a gun and enable boss fight mode (W=shoot up, Space=jump)
    SB.Player.hasGun = true;
    SB.Player.bossFightMode = true;
    if (SB.Player.hp < SB.Player.maxHp) SB.Player.hp = SB.Player.maxHp;
    if (SB.Player.maxHp < 5) { SB.Player.maxHp = 5; SB.Player.hp = 5; }
    SB.HUD.notify('W = ยิงขึ้น! Space = กระโดด!', 3);
  }

  update(dt, player) {
    if (!this.active || this.defeated) return;
    this.frameTimer += dt;
    if (this.frameTimer > 0.2) { this.frameTimer = 0; this.frame = (this.frame + 1) % 4; }
    if (this.flashTimer > 0) this.flashTimer -= dt;
    if (this.teleportFlash > 0) this.teleportFlash -= dt;

    // ── Type-specific update ──
    if (this.type === 'thornback') this._updateThornback(dt, player);
    else if (this.type === 'sand_wyrm') this._updateSandWyrm(dt, player);
    else if (this.type === 'frost_giant') this._updateFrostGiant(dt, player);
    else if (this.type === 'shadow_king') this._updateShadowKing(dt, player);
    else this._updateDefault(dt, player);

    // ── Update projectiles ──
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      if (p.gravity) p.vy += p.gravity * dt;
      p.life -= dt;
      if (p.life <= 0) this.projectiles.splice(i, 1);
    }
  }

  // ── Default patrol + shoot ──
  _updateDefault(dt, player) {
    const spd = this.phase >= 2 ? this.speed * 1.5 : this.speed;
    this.x += this.moveDir * spd * dt;
    if (this.x <= this.arenaLeft) { this.x = this.arenaLeft; this.moveDir = 1; }
    if (this.x >= this.arenaRight) { this.x = this.arenaRight; this.moveDir = -1; }
    this.shootTimer -= dt;
    if (this.shootTimer <= 0) {
      this._shoot(player);
      const interval = this.phase >= 2 ? this.shootInterval * 0.5 : this.shootInterval;
      this.shootTimer = interval + U.randFloat(-0.3, 0.3);
    }
    if (this.burstCount > 0) {
      this.burstTimer -= dt;
      if (this.burstTimer <= 0) { this._fireSingle(player); this.burstCount--; this.burstTimer = 0.15; }
    }
  }

  // ── Thornback: charge + vine whip + mini thorns + poison zones ──
  _updateThornback(dt, player) {
    // Update thornlings (mini clones)
    for (let i = this.thornlings.length - 1; i >= 0; i--) {
      const t = this.thornlings[i];
      t.life -= dt;
      if (t.life <= 0) { this.thornlings.splice(i, 1); continue; }
      // Chase player
      const dir = player.x > t.x ? 1 : -1;
      t.x += dir * 80 * dt;
      t.y += Math.sin(Date.now() * 0.005 + i) * 0.5;
      // Thornling projectile: hurt player on contact
      const dx = player.x - t.x, dy = player.y - t.y;
      if (Math.abs(dx) < 14 && Math.abs(dy) < 14) {
        SB.Player.takeDamage(1);
        this.thornlings.splice(i, 1);
      }
    }
    // Update poison zones
    for (let i = this.poisonZones.length - 1; i >= 0; i--) {
      const z = this.poisonZones[i];
      z.life -= dt;
      if (z.life <= 0) { this.poisonZones.splice(i, 1); continue; }
      // Damage player if standing in zone
      if (Math.abs(player.x - z.x) < z.r && Math.abs(player.y + player.h - z.y) < 12) {
        if (!z._dmgCD || z._dmgCD <= 0) { SB.Player.takeDamage(1); z._dmgCD = 1.5; }
      }
      if (z._dmgCD > 0) z._dmgCD -= dt;
    }

    if (this.vineActive) {
      // Vine whip: sweeping arc of projectiles
      this.vineSweepAngle += dt * 4;
      if (this.vineSweepAngle >= Math.PI) {
        this.vineActive = false;
        this.vineTimer = this.phase >= 2 ? 4 : 7;
      } else {
        // Emit vine segment projectiles along arc
        const cx = this.x + this.w / 2, cy = this.y + this.h / 2;
        const reach = this.phase >= 2 ? 120 : 90;
        for (let seg = 0; seg < 3; seg++) {
          const a = this.vineSweepAngle + seg * 0.15;
          this.projectiles.push({
            x: cx + Math.cos(a) * reach * (seg + 1) / 3,
            y: cy + Math.sin(a) * reach * (seg + 1) / 3,
            vx: 0, vy: 0, gravity: 0, life: 0.12, w: 8, h: 8,
            color: this.phase >= 2 ? '#9b59b6' : '#27ae60'
          });
        }
      }
    } else if (this.charging) {
      const dir = player.x > this.x + this.w / 2 ? 1 : -1;
      this.x += dir * this.speed * 3 * dt;
      if (this.x <= this.arenaLeft) this.x = this.arenaLeft;
      if (this.x >= this.arenaRight) this.x = this.arenaRight;
      this.chargeDur -= dt;
      if (this.chargeDur <= 0) {
        this.charging = false;
        this.chargeTimer = this.phase >= 2 ? 3 : 5;
        // Thorn burst on charge end
        const burstCount = this.phase >= 2 ? 12 : 8;
        for (let i = 0; i < burstCount; i++) {
          const a = (i / burstCount) * Math.PI * 2;
          this.projectiles.push({
            x: this.x + this.w / 2, y: this.y + this.h / 2,
            vx: Math.cos(a) * 120, vy: Math.sin(a) * 120,
            gravity: 0, life: 2, w: 6, h: 6,
            color: this.phase >= 2 ? '#9b59b6' : '#2ecc71'
          });
        }
        // Leave poison zone at charge end position
        this.poisonZones.push({
          x: this.x + this.w / 2, y: this.y + this.h,
          r: 30, life: 4, _dmgCD: 0
        });
        SB.Camera.shake(4, 0.3);
      }
    } else {
      this._updateDefault(dt, player);
      this.chargeTimer -= dt;
      if (this.chargeTimer <= 0) {
        this.charging = true;
        this.chargeDur = 1.2;
        SB.Audio.sfx('bossPhase');
        SB.HUD.notify('หนามบุก!', 1.5);
      }
      this.vineTimer -= dt;
      if (this.vineTimer <= 0) {
        this.vineActive = true;
        this.vineSweepAngle = 0;
        SB.HUD.notify('เถาวัลย์โจมตี!', 1.5);
        SB.Camera.shake(3, 0.2);
      }
      // Spawn thornlings in phase 2
      if (this.phase >= 2) {
        this.thornSpawnTimer -= dt;
        if (this.thornSpawnTimer <= 0) {
          this.thornSpawnTimer = 8;
          const spawnCount = 3;
          for (let i = 0; i < spawnCount; i++) {
            this.thornlings.push({
              x: this.x + this.w / 2 + (i - 1) * 30,
              y: this.y + this.h / 2,
              life: 6, size: 10
            });
          }
          SB.HUD.notify('หนามจิ๋ว! ระวัง!', 1.5);
          SB.Camera.shake(3, 0.2);
        }
      }
    }
  }

  // ── Sand Wyrm: burrow + fire breath + sandstorm ──
  _updateSandWyrm(dt, player) {
    // Sandstorm phase: slow-moving sand projectiles across screen
    if (this.sandstormActive) {
      this.sandstormDur -= dt;
      if (this.sandstormDur <= 0) {
        this.sandstormActive = false;
        this.sandstormTimer = this.phase >= 2 ? 10 : 15;
      } else {
        // Emit sand particles from edges every few frames
        if (Math.random() < 0.3) {
          const fromLeft = Math.random() > 0.5;
          this.projectiles.push({
            x: fromLeft ? this.arenaLeft : this.arenaRight,
            y: this.baseY - SB.Utils.randFloat(20, 100),
            vx: fromLeft ? SB.Utils.randFloat(40, 90) : SB.Utils.randFloat(-90, -40),
            vy: SB.Utils.randFloat(-10, 10),
            gravity: 15, life: 4, w: 5, h: 5,
            color: '#c9a83a'
          });
        }
      }
      if (!this.breathing && !this.burrowed) this._updateDefault(dt, player);
    }

    if (this.breathing) {
      // Fire breath: cone of fire projectiles from mouth
      this.breathDur -= dt;
      const dir = player.x > this.x + this.w / 2 ? 1 : -1;
      if (this.breathDur <= 0) {
        this.breathing = false;
        this.breathTimer = this.phase >= 2 ? 5 : 8;
      } else {
        // Emit fire cone
        if (Math.random() < 0.6) {
          const cx = this.x + this.w / 2 + dir * (this.w / 2);
          const cy = this.y + this.h * 0.4;
          const spread = SB.Utils.randFloat(-0.4, 0.4);
          const spd = SB.Utils.randFloat(140, 220);
          this.projectiles.push({
            x: cx, y: cy,
            vx: dir * spd * Math.cos(spread), vy: spd * Math.sin(spread) - 20,
            gravity: 30, life: 1.5, w: 7, h: 7,
            color: Math.random() > 0.5 ? '#e74c3c' : '#f39c12'
          });
        }
      }
    } else if (this.burrowed) {
      const targetX = player.x - this.w / 2;
      this.x += (targetX - this.x) * 2.5 * dt;
      this.y = this.baseY + 60;
      this.vulnerable = false;
      this.burrowDur -= dt;
      if (this.burrowDur <= 0) {
        this.burrowed = false;
        this.y = this.baseY;
        this.vulnerable = true;
        this.burrowTimer = this.phase >= 2 ? 3 : 5;
        SB.Camera.shake(6, 0.4);
        const cx = this.x + this.w / 2;
        const count = this.phase >= 2 ? 8 : 5;
        for (let i = 0; i < count; i++) {
          const spread = (i - (count - 1) / 2) * 0.4;
          this.projectiles.push({
            x: cx, y: this.y,
            vx: Math.sin(spread) * 100, vy: -180 - Math.random() * 60,
            gravity: 200, life: 2.5, w: 7, h: 7,
            color: this.phase >= 2 ? '#b8860b' : '#daa520'
          });
        }
        // After emerging, shoot ring of sand
        if (this.phase >= 2) {
          for (let a = 0; a < Math.PI * 2; a += Math.PI / 5) {
            this.projectiles.push({
              x: cx, y: this.y + this.h / 2,
              vx: Math.cos(a) * 80, vy: Math.sin(a) * 80,
              gravity: 0, life: 2, w: 5, h: 5,
              color: '#daa520'
            });
          }
        }
      }
    } else {
      this._updateDefault(dt, player);
      this.burrowTimer -= dt;
      if (this.burrowTimer <= 0) {
        this.burrowed = true;
        this.burrowDur = 1.5;
        this.burrowTargetX = player.x;
        SB.Audio.sfx('bossPhase');
        SB.HUD.notify('ใต้ดิน! ระวัง!', 1.5);
      }
      this.breathTimer -= dt;
      if (this.breathTimer <= 0 && !this.burrowed) {
        this.breathing = true;
        this.breathDur = this.phase >= 2 ? 2.5 : 1.8;
        SB.Audio.sfx('bossPhase');
        SB.HUD.notify('ลมหายใจไฟ! 🔥', 1.5);
        SB.Camera.shake(4, 0.3);
      }
      if (!this.sandstormActive) {
        this.sandstormTimer -= dt;
        if (this.sandstormTimer <= 0) {
          this.sandstormActive = true;
          this.sandstormDur = this.phase >= 2 ? 6 : 4;
          SB.HUD.notify('พายุทราย! 🏜️', 2);
          SB.Camera.shake(5, 0.4);
        }
      }
    }
  }

  // ── Frost Giant: slam + ice shard rain + freeze beam + ice walls ──
  _updateFrostGiant(dt, player) {
    // Update ice walls
    for (let i = this.iceWalls.length - 1; i >= 0; i--) {
      this.iceWalls[i].life -= dt;
      if (this.iceWalls[i].life <= 0) this.iceWalls.splice(i, 1);
    }

    // Freeze beam: rotating beam from boss
    if (this.freezeBeamActive) {
      this.freezeBeamDur -= dt;
      const rotSpeed = this.phase >= 2 ? 1.8 : 1.2;
      this.freezeBeamAngle += rotSpeed * dt;
      // Emit beam projectiles along line
      const cx = this.x + this.w / 2, cy = this.y + this.h / 2;
      const beamLen = this.phase >= 2 ? 180 : 140;
      for (let d = 20; d < beamLen; d += 15) {
        this.projectiles.push({
          x: cx + Math.cos(this.freezeBeamAngle) * d,
          y: cy + Math.sin(this.freezeBeamAngle) * d,
          vx: 0, vy: 0, gravity: 0, life: 0.08, w: 8, h: 8,
          color: this.phase >= 2 ? '#ff6b6b' : '#74b9ff'
        });
      }
      if (this.freezeBeamDur <= 0) {
        this.freezeBeamActive = false;
        this.freezeBeamTimer = this.phase >= 2 ? 8 : 14;
      }
    }

    // Ice shard rain
    if (this.iceRaining) {
      this.iceRainDur -= dt;
      if (this.iceRainDur <= 0) {
        this.iceRaining = false;
        this.iceRainTimer = this.phase >= 2 ? 6 : 10;
      } else {
        // Drop icicles from above at random x positions
        if (Math.random() < (this.phase >= 2 ? 0.4 : 0.25)) {
          const rx = this.arenaLeft + Math.random() * (this.arenaRight - this.arenaLeft);
          this.projectiles.push({
            x: rx, y: this.baseY - 120,
            vx: SB.Utils.randFloat(-10, 10), vy: SB.Utils.randFloat(100, 180),
            gravity: 80, life: 3, w: 6, h: 10,
            color: this.phase >= 2 ? '#e74c3c' : '#a8d8ea'
          });
        }
      }
    }

    if (this.slamming) {
      if (this.slamPhase === 1) {
        this.y -= 150 * dt;
        this.slamY -= 150 * dt;
        if (this.slamY <= -60) {
          this.slamPhase = 2;
          this.x = Math.max(this.arenaLeft, Math.min(this.arenaRight, player.x - this.w / 2));
        }
      } else if (this.slamPhase === 2) {
        this.y += 400 * dt;
        this.slamY += 400 * dt;
        if (this.slamY >= 0) {
          this.y = this.baseY;
          this.slamming = false;
          this.slamTimer = this.phase >= 2 ? 3.5 : 6;
          SB.Camera.shake(8, 0.5);
          const groundY = this.y + this.h - 4;
          const cx = this.x + this.w / 2;
          const waveCount = this.phase >= 2 ? 6 : 4;
          for (let i = 0; i < waveCount; i++) {
            this.projectiles.push({
              x: cx, y: groundY,
              vx: -120 - i * 30, vy: 0,
              gravity: 0, life: 3, w: 10, h: 10,
              color: this.phase >= 2 ? '#e74c3c' : '#74b9ff'
            });
            this.projectiles.push({
              x: cx, y: groundY,
              vx: 120 + i * 30, vy: 0,
              gravity: 0, life: 3, w: 10, h: 10,
              color: this.phase >= 2 ? '#e74c3c' : '#74b9ff'
            });
          }
          // Spawn ice walls near player to trap them
          if (this.phase >= 2) {
            this.iceWalls.push({ x: player.x - 50, y: this.baseY - 10, w: 8, h: 40, life: 4 });
            this.iceWalls.push({ x: player.x + player.w + 50, y: this.baseY - 10, w: 8, h: 40, life: 4 });
          }
        }
      }
    } else {
      this._updateDefault(dt, player);
      this.slamTimer -= dt;
      if (this.slamTimer <= 0) {
        this.slamming = true;
        this.slamPhase = 1;
        this.slamY = 0;
        this.baseY = this.y;
        SB.Audio.sfx('bossPhase');
        SB.HUD.notify('กระแทกพื้น!', 1.5);
      }
      // Ice rain timer
      if (!this.iceRaining) {
        this.iceRainTimer -= dt;
        if (this.iceRainTimer <= 0) {
          this.iceRaining = true;
          this.iceRainDur = this.phase >= 2 ? 4 : 3;
          SB.HUD.notify('ฝนน้ำแข็ง! ❄️', 1.5);
          SB.Camera.shake(4, 0.3);
        }
      }
      // Freeze beam timer (phase 2 only initially, phase 1 at longer interval)
      if (!this.freezeBeamActive) {
        this.freezeBeamTimer -= dt;
        if (this.freezeBeamTimer <= 0) {
          this.freezeBeamActive = true;
          this.freezeBeamAngle = Math.atan2(player.y - (this.y + this.h / 2), player.x - (this.x + this.w / 2));
          this.freezeBeamDur = this.phase >= 2 ? 3 : 2;
          SB.HUD.notify('ลำแสงน้ำแข็ง! 💎', 1.5);
          SB.Camera.shake(5, 0.4);
        }
      }
    }
  }

  // ── Shadow King: teleport + orbs + clones + meteor + laser + soul drain ──
  _updateShadowKing(dt, player) {
    this._updateDefault(dt, player);

    // Update shadow clones
    for (let i = this.clones.length - 1; i >= 0; i--) {
      const c = this.clones[i];
      c.life -= dt;
      if (c.life <= 0 || c.hp <= 0) {
        // Clone death: explosion of shadow particles
        for (let a = 0; a < Math.PI * 2; a += Math.PI / 4) {
          this.projectiles.push({
            x: c.x, y: c.y,
            vx: Math.cos(a) * 50, vy: Math.sin(a) * 50,
            gravity: 0, life: 1, w: 4, h: 4, color: '#8e44ad'
          });
        }
        this.clones.splice(i, 1);
        continue;
      }
      // Clone shoots at player occasionally
      c.shootCD -= dt;
      if (c.shootCD <= 0) {
        c.shootCD = 2;
        const dx = player.x - c.x, dy = player.y - c.y;
        const dist = Math.max(1, Math.hypot(dx, dy));
        this.projectiles.push({
          x: c.x, y: c.y,
          vx: (dx / dist) * 100, vy: (dy / dist) * 100,
          gravity: 20, life: 3, w: 6, h: 6, color: '#6c3483'
        });
      }
      // Clone patrols near spawn
      c.x += c.dir * 40 * dt;
      if (c.x < c.homeX - 60 || c.x > c.homeX + 60) c.dir *= -1;
    }

    // Teleport
    this.teleportTimer -= dt;
    if (this.teleportTimer <= 0) {
      const oldCx = this.x + this.w / 2, oldCy = this.y + this.h / 2;
      const orbCount = this.phase >= 2 ? 8 : 6;
      for (let i = 0; i < orbCount; i++) {
        const a = (i / orbCount) * Math.PI * 2;
        this.projectiles.push({
          x: oldCx, y: oldCy,
          vx: Math.cos(a) * 60, vy: Math.sin(a) * 60,
          gravity: 0, life: 2.5, w: 6, h: 6, color: '#8e44ad'
        });
      }
      this.x = this.arenaLeft + Math.random() * (this.arenaRight - this.arenaLeft);
      this.teleportFlash = 0.3;
      this.teleportTimer = this.phase >= 2 ? 2.5 : 4;
      SB.Camera.shake(3, 0.2);
    }

    // Shadow orb ring attack
    this.orbTimer -= dt;
    if (this.orbTimer <= 0) {
      const cx = this.x + this.w / 2, cy = this.y + this.h / 2;
      const count = this.phase >= 2 ? 12 : 8;
      const angleOff = Date.now() * 0.001;
      for (let i = 0; i < count; i++) {
        const a = (i / count) * Math.PI * 2 + angleOff;
        const spd = this.phase >= 2 ? 110 : 80;
        this.projectiles.push({
          x: cx, y: cy,
          vx: Math.cos(a) * spd, vy: Math.sin(a) * spd,
          gravity: 0, life: 3, w: 5, h: 5,
          color: this.phase >= 2 ? '#e74c3c' : '#9b59b6'
        });
      }
      this.orbTimer = this.phase >= 2 ? 2 : 3;
      SB.Audio.sfx('bossPhase');
    }

    // Clone split
    this.cloneSplitTimer -= dt;
    if (this.cloneSplitTimer <= 0 && this.clones.length < 3) {
      const count = this.phase >= 2 ? 3 : 2;
      for (let i = 0; i < count; i++) {
        const cx = this.arenaLeft + Math.random() * (this.arenaRight - this.arenaLeft);
        const cy = this.y + this.h / 2;
        this.clones.push({
          x: cx, y: cy, homeX: cx, dir: i % 2 === 0 ? 1 : -1,
          hp: 2, life: 8, shootCD: 1 + i
        });
      }
      this.cloneSplitTimer = this.phase >= 2 ? 8 : 12;
      SB.HUD.notify('แยกร่างเงา! 👤', 1.5);
      SB.Camera.shake(4, 0.3);
      SB.Audio.sfx('bossPhase');
    }

    // Dark meteor rain (phase 2 or long interval in phase 1)
    this.meteorTimer -= dt;
    if (this.meteorTimer <= 0 && !this.meteorActive) {
      this.meteorActive = true;
      this.meteorDur = this.phase >= 2 ? 4 : 2.5;
      SB.HUD.notify('อุกกาบาตดำ! ☄️', 2);
      SB.Camera.shake(6, 0.5);
    }
    if (this.meteorActive) {
      this.meteorDur -= dt;
      if (this.meteorDur <= 0) {
        this.meteorActive = false;
        this.meteorTimer = this.phase >= 2 ? 10 : 16;
      } else {
        // Drop dark orbs from sky near player
        if (Math.random() < (this.phase >= 2 ? 0.35 : 0.2)) {
          const mx = player.x + SB.Utils.randFloat(-80, 80);
          this.projectiles.push({
            x: mx, y: this.baseY - 140,
            vx: SB.Utils.randFloat(-15, 15), vy: SB.Utils.randFloat(120, 200),
            gravity: 60, life: 3, w: 8, h: 8,
            color: Math.random() > 0.5 ? '#8e44ad' : '#2c3e50'
          });
        }
      }
    }

    // Laser sweep (phase 2 only)
    if (this.phase >= 2) {
      this.laserTimer -= dt;
      if (this.laserTimer <= 0 && !this.laserActive) {
        this.laserActive = true;
        this.laserAngle = -Math.PI * 0.8;
        this.laserDur = 3;
        SB.HUD.notify('เลเซอร์เงา! ⚡', 1.5);
        SB.Camera.shake(5, 0.4);
      }
      if (this.laserActive) {
        this.laserDur -= dt;
        this.laserAngle += 1.2 * dt;
        // Emit laser dots along sweep line
        const cx = this.x + this.w / 2, cy = this.y + this.h / 2;
        for (let d = 15; d < 200; d += 12) {
          this.projectiles.push({
            x: cx + Math.cos(this.laserAngle) * d,
            y: cy + Math.sin(this.laserAngle) * d,
            vx: 0, vy: 0, gravity: 0, life: 0.06, w: 6, h: 6,
            color: '#e74c3c'
          });
        }
        if (this.laserDur <= 0) {
          this.laserActive = false;
          this.laserTimer = 12;
        }
      }
    }

    // Soul drain: pulls player toward boss periodically (phase 2)
    if (this.phase >= 2) {
      this.soulDrainTimer -= dt;
      if (this.soulDrainTimer <= 0) {
        this.soulDrainTimer = 10;
        // Pull effect: shift player velocity toward boss
        const pdx = (this.x + this.w / 2) - player.x;
        const pullStr = 120;
        if (Math.abs(pdx) > 30) {
          SB.Player.vx += (pdx > 0 ? pullStr : -pullStr) * 0.5;
        }
        SB.HUD.notify('ดูดวิญญาณ! 💀', 1.5);
        SB.Camera.shake(3, 0.3);
        // Visual: ring of particles toward boss
        const cx = this.x + this.w / 2, cy = this.y + this.h / 2;
        for (let a = 0; a < Math.PI * 2; a += Math.PI / 6) {
          this.projectiles.push({
            x: cx + Math.cos(a) * 120, y: cy + Math.sin(a) * 120,
            vx: -Math.cos(a) * 60, vy: -Math.sin(a) * 60,
            gravity: 0, life: 1.5, w: 4, h: 4, color: '#6c3483'
          });
        }
      }
    }
  }

  _shoot(player) {
    if (this.phase >= 2) {
      this.burstCount = 2;
      this.burstTimer = 0.15;
      this._fireSingle(player);
      this._fireSpread(player);
    } else {
      if (Math.random() < 0.5) this._fireSingle(player);
      else this._fireSpread(player);
    }
  }

  _fireSingle(player) {
    const cx = this.x + this.w / 2, cy = this.y + this.h / 2;
    const dx = player.x - cx, dy = player.y - cy;
    const dist = Math.max(1, Math.hypot(dx, dy));
    const speed = this.phase >= 2 ? 200 : 140;
    this.projectiles.push({
      x: cx, y: cy,
      vx: (dx / dist) * speed, vy: (dy / dist) * speed,
      gravity: 30, life: 4, w: 8, h: 8,
      color: this.phase >= 2 ? '#e74c3c' : '#8B4513'
    });
  }

  _fireSpread(player) {
    const cx = this.x + this.w / 2, cy = this.y + this.h / 2;
    const dx = player.x - cx, dy = player.y - cy;
    const baseAngle = Math.atan2(dy, dx);
    const count = this.phase >= 2 ? 5 : 3;
    const speed = this.phase >= 2 ? 170 : 130;
    for (let i = 0; i < count; i++) {
      const spread = (i - (count - 1) / 2) * 0.3;
      const angle = baseAngle + spread;
      this.projectiles.push({
        x: cx, y: cy,
        vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed,
        gravity: 40, life: 3.5, w: 6, h: 6,
        color: this.phase >= 2 ? '#ff6b6b' : '#27ae60'
      });
    }
  }

  hit(dmg) {
    this.hp -= (dmg || 1);
    this.flashTimer = 0.2;
    SB.Audio.sfx('bossHit');
    SB.Camera.shake(4, 0.2);

    if (this.hp <= Math.floor(this.maxHp / 2) && this.phase === 1) {
      this.phase = 2;
      this.shootTimer = 0.5;
      SB.Audio.sfx('bossPhase');
      SB.Camera.shake(6, 0.5);
      SB.HUD.notify('บอสคลั่ง! ระวัง!', 2);
      // Drop buff items ONCE when entering rage mode
      this._dropLoot();
    }

    if (this.hp <= 0) {
      this.defeated = true;
      this.active = false;
      SB.Player.hasGun = false;
      SB.Player.bossFightMode = false;
      SB.Particles.emit('bossExplosion', this.x + this.w / 2, this.y + this.h / 2);
      SB.Audio.sfx('bossDie');
      SB.Camera.shake(8, 1);
      // Drop defeat loot — falls to ground
      this._dropDefeatLoot();
      return true;
    }
    return false;
  }

  _dropLoot() {
    // Drop power-ups when boss enters enraged phase
    const drops = ['triple_shot', 'heart', 'shield'];
    const baseX = this.x + this.w / 2;
    const baseY = this.y;
    for (let i = 0; i < drops.length; i++) {
      const dx = baseX + (i - 1) * 40;
      if (SB.Items && SB.Items.addPowerUp) {
        const pu = new SB.Items.PowerUp(dx, baseY, drops[i]);
        pu.falling = true; pu.vy = -150 - i * 30;
        SB.Items.powerups.push(pu);
      }
    }
  }

  _dropDefeatLoot() {
    // Boss defeated — massive coin waterfall!
    const baseX = this.x + this.w / 2;
    const baseY = this.y;
    const coinCount = 30;
    for (let i = 0; i < coinCount; i++) {
      const dx = baseX + (Math.random() - 0.5) * 120;
      const dy = baseY - Math.random() * 40;
      const type = Math.random() < 0.15 ? 'red' : 'gold';
      if (SB.Items && SB.Items.addCoin) {
        SB.Items.addCoin(dx, dy, type);
        // Give coins upward velocity for fountain/waterfall effect
        const c = SB.Items.coins[SB.Items.coins.length - 1];
        c._vy = -200 - Math.random() * 250;
        c._vx = (Math.random() - 0.5) * 160;
        c._falling = true;
      }
    }
    // Start countdown timer for collecting coins
    SB.bossDefeatTimer = 8; // 8 seconds to collect
    SB.bossDefeatActive = true;
    SB.HUD.notify('เก็บเหรียญให้หมด! ⏱️ 8 วินาที', 3);
  }

  draw(ctx, cam) {
    if (!this.active || this.defeated) return;
    // Sand Wyrm hidden when burrowed (show dust particles instead)
    if (this.burrowed) {
      const bx = Math.round(this.x + this.w / 2 - cam.x);
      const by = Math.round(this.baseY + this.h - cam.y);
      ctx.fillStyle = '#daa520';
      for (let i = 0; i < 5; i++) {
        const px = bx + Math.sin(Date.now() * 0.01 + i) * 20;
        const py = by - Math.random() * 8;
        ctx.globalAlpha = 0.4;
        ctx.beginPath(); ctx.arc(px, py, 3 + Math.random() * 3, 0, Math.PI * 2); ctx.fill();
      }
      ctx.globalAlpha = 1;
      return;
    }
    // Shadow King teleport flash
    if (this.teleportFlash > 0) {
      const tx = Math.round(this.x + this.w / 2 - cam.x);
      const ty = Math.round(this.y + this.h / 2 - cam.y);
      ctx.globalAlpha = this.teleportFlash;
      ctx.fillStyle = '#9b59b6';
      ctx.beginPath(); ctx.arc(tx, ty, 40, 0, Math.PI * 2); ctx.fill();
      ctx.globalAlpha = 1;
    }
    const sx = Math.round(this.x - cam.x);
    const sy = Math.round(this.y - cam.y);
    const cx = sx + this.w / 2;
    const cy = sy + this.h / 2;
    const flash = this.flashTimer > 0 && Math.floor(this.flashTimer * 20) % 2 === 0;
    const armBob = Math.sin(Date.now() / 300) * 5;
    const breathe = Math.sin(Date.now() / 500) * 2;

    // ── Boss body (curved shapes per type) ──
    ctx.save();
    if (this.type === 'thornback') {
      // Tree-like boss with thorny crown
      const col = flash ? '#fff' : (this.phase >= 2 ? '#6c3483' : '#27ae60');
      const colDark = this.phase >= 2 ? '#4a235a' : '#1a7a3a';
      // Body (rounded)
      ctx.fillStyle = col;
      ctx.beginPath();
      ctx.moveTo(sx + 8, sy + this.h);
      ctx.quadraticCurveTo(sx - 4, cy, sx + 8, sy + 10);
      ctx.quadraticCurveTo(cx, sy - 5 + breathe, sx + this.w - 8, sy + 10);
      ctx.quadraticCurveTo(sx + this.w + 4, cy, sx + this.w - 8, sy + this.h);
      ctx.closePath(); ctx.fill();
      // Dark belly
      ctx.fillStyle = colDark;
      ctx.beginPath();
      ctx.ellipse(cx, cy + 10, this.w * 0.3, this.h * 0.2, 0, 0, Math.PI * 2);
      ctx.fill();
      // Thorny crown spikes
      ctx.fillStyle = this.phase >= 2 ? '#9b59b6' : '#2ecc71';
      for (let i = 0; i < 5; i++) {
        const spX = sx + 12 + i * 14;
        ctx.beginPath();
        ctx.moveTo(spX, sy + 12);
        ctx.lineTo(spX + 4, sy - 8 + breathe);
        ctx.lineTo(spX + 8, sy + 12);
        ctx.fill();
      }
      // Arms
      ctx.fillStyle = col;
      ctx.beginPath(); ctx.ellipse(sx - 8, cy + armBob, 10, 5, -0.3, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.ellipse(sx + this.w + 8, cy - armBob, 10, 5, 0.3, 0, Math.PI * 2); ctx.fill();
    } else if (this.type === 'sand_wyrm') {
      const col = flash ? '#fff' : (this.phase >= 2 ? '#b8860b' : '#daa520');
      // Segmented worm body
      ctx.fillStyle = col;
      ctx.beginPath();
      ctx.ellipse(cx, cy + breathe, this.w * 0.48, this.h * 0.45, 0, 0, Math.PI * 2);
      ctx.fill();
      // Segments
      ctx.strokeStyle = this.phase >= 2 ? '#8B6914' : '#c49b1a';
      ctx.lineWidth = 1.5;
      for (let i = 1; i < 4; i++) {
        ctx.beginPath();
        ctx.ellipse(cx, cy + breathe, this.w * 0.48 - i * 3, this.h * 0.45 - i * 2, 0, 0, Math.PI * 2);
        ctx.stroke();
      }
      // Mandibles
      ctx.fillStyle = flash ? '#fff' : '#8B0000';
      const mAng = Math.sin(Date.now() / 200) * 0.2;
      ctx.save(); ctx.translate(sx + 5, cy); ctx.rotate(-0.3 + mAng);
      ctx.fillRect(-3, -12, 6, 14); ctx.restore();
      ctx.save(); ctx.translate(sx + this.w - 5, cy); ctx.rotate(0.3 - mAng);
      ctx.fillRect(-3, -12, 6, 14); ctx.restore();
    } else if (this.type === 'frost_giant') {
      const col = flash ? '#fff' : (this.phase >= 2 ? '#ff6b6b' : '#a8d8ea');
      // Icy body rounded
      ctx.fillStyle = col;
      ctx.beginPath();
      ctx.moveTo(sx + 10, sy + this.h);
      ctx.quadraticCurveTo(sx - 2, cy + 10, sx + 5, sy + 15);
      ctx.quadraticCurveTo(cx, sy - 2 + breathe, sx + this.w - 5, sy + 15);
      ctx.quadraticCurveTo(sx + this.w + 2, cy + 10, sx + this.w - 10, sy + this.h);
      ctx.closePath(); ctx.fill();
      // Ice crown
      ctx.fillStyle = this.phase >= 2 ? '#e74c3c' : '#74b9ff';
      for (let i = 0; i < 5; i++) {
        const spX = sx + 12 + i * 14;
        ctx.beginPath();
        ctx.moveTo(spX, sy + 12);
        ctx.lineTo(spX + 3, sy - 12 + breathe);
        ctx.lineTo(spX + 6, sy + 12);
        ctx.fill();
      }
      // Arms
      ctx.fillStyle = col;
      ctx.beginPath(); ctx.ellipse(sx - 10, cy + 5 + armBob, 12, 7, 0, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.ellipse(sx + this.w + 10, cy + 5 - armBob, 12, 7, 0, 0, Math.PI * 2); ctx.fill();
    } else if (this.type === 'shadow_king') {
      const col = flash ? '#fff' : (this.phase >= 2 ? '#8e44ad' : '#2c3e50');
      // Dark robe body
      ctx.fillStyle = col;
      ctx.beginPath();
      ctx.moveTo(sx + 5, sy + this.h);
      ctx.quadraticCurveTo(sx - 5, cy, sx + 10, sy + 15);
      ctx.quadraticCurveTo(cx, sy + 2 + breathe, sx + this.w - 10, sy + 15);
      ctx.quadraticCurveTo(sx + this.w + 5, cy, sx + this.w - 5, sy + this.h);
      ctx.closePath(); ctx.fill();
      // Crown
      ctx.fillStyle = '#f1c40f';
      for (let i = 0; i < 5; i++) {
        const spX = sx + 18 + i * 14;
        ctx.beginPath();
        ctx.moveTo(spX, sy + 14);
        ctx.lineTo(spX + 4, sy - 6 + breathe);
        ctx.lineTo(spX + 8, sy + 14);
        ctx.fill();
      }
      // Crown band
      ctx.fillRect(sx + 15, sy + 12, this.w - 30, 4);
      // Gem on crown
      ctx.fillStyle = this.phase >= 2 ? '#e74c3c' : '#9b59b6';
      ctx.beginPath(); ctx.arc(cx, sy + 10, 3, 0, Math.PI * 2); ctx.fill();
      // Arms (cloak)
      ctx.fillStyle = col;
      ctx.beginPath(); ctx.ellipse(sx - 12, cy + 5 + armBob, 14, 6, -0.2, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.ellipse(sx + this.w + 12, cy + 5 - armBob, 14, 6, 0.2, 0, Math.PI * 2); ctx.fill();
    }

    // ── Eyes (track player direction) ──
    const eyeY = cy - 6;
    let eyePupilX = 0, eyePupilY = 0;
    if (SB.Player) {
      const pdx = SB.Player.x - (this.x + this.w / 2);
      const pdy = SB.Player.y - (this.y + this.h / 2);
      const pd = Math.max(1, Math.hypot(pdx, pdy));
      eyePupilX = (pdx / pd) * 3;
      eyePupilY = (pdy / pd) * 2;
    }
    const eyeColor = this.phase >= 2 ? '#e74c3c' : '#f1c40f';
    // Eye whites
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.ellipse(cx - 12, eyeY, 6, 7, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(cx + 12, eyeY, 6, 7, 0, 0, Math.PI * 2); ctx.fill();
    // Pupils
    ctx.fillStyle = eyeColor;
    ctx.beginPath(); ctx.arc(cx - 12 + eyePupilX, eyeY + eyePupilY, 3.5, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(cx + 12 + eyePupilX, eyeY + eyePupilY, 3.5, 0, Math.PI * 2); ctx.fill();
    // Pupil centers
    ctx.fillStyle = '#111';
    ctx.beginPath(); ctx.arc(cx - 12 + eyePupilX, eyeY + eyePupilY, 1.8, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(cx + 12 + eyePupilX, eyeY + eyePupilY, 1.8, 0, Math.PI * 2); ctx.fill();

    // Mouth
    ctx.strokeStyle = this.phase >= 2 ? '#c0392b' : '#2c3e50';
    ctx.lineWidth = 2;
    ctx.beginPath();
    if (this.phase >= 2) {
      // Angry jagged mouth
      ctx.moveTo(cx - 14, cy + 8);
      for (let i = 0; i < 5; i++) {
        ctx.lineTo(cx - 10 + i * 6, cy + (i % 2 === 0 ? 12 : 5));
      }
    } else {
      ctx.arc(cx, cy + 10, 10, 0.2, Math.PI - 0.2);
    }
    ctx.stroke();

    ctx.restore();

    // ── Thornlings (mini thorn creatures) ──
    for (const t of this.thornlings) {
      const tx = Math.round(t.x - cam.x), ty = Math.round(t.y - cam.y);
      const s = t.size;
      const pulse = 1 + Math.sin(Date.now() * 0.01) * 0.15;
      // Body
      ctx.fillStyle = this.phase >= 2 ? '#9b59b6' : '#27ae60';
      ctx.globalAlpha = Math.min(1, t.life);
      ctx.beginPath(); ctx.arc(tx, ty, s * pulse, 0, Math.PI * 2); ctx.fill();
      // Spikes
      ctx.fillStyle = this.phase >= 2 ? '#6c3483' : '#1a7a3a';
      for (let a = 0; a < Math.PI * 2; a += Math.PI / 3) {
        ctx.beginPath();
        ctx.moveTo(tx + Math.cos(a) * s * 0.7, ty + Math.sin(a) * s * 0.7);
        ctx.lineTo(tx + Math.cos(a - 0.2) * s * 1.6, ty + Math.sin(a - 0.2) * s * 1.6);
        ctx.lineTo(tx + Math.cos(a + 0.2) * s * 1.6, ty + Math.sin(a + 0.2) * s * 1.6);
        ctx.fill();
      }
      // Eyes
      ctx.fillStyle = '#e74c3c';
      ctx.beginPath(); ctx.arc(tx - 3, ty - 2, 2, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(tx + 3, ty - 2, 2, 0, Math.PI * 2); ctx.fill();
      ctx.globalAlpha = 1;
    }

    // ── Poison Zones (toxic green puddles) ──
    for (const z of this.poisonZones) {
      const zx = Math.round(z.x - cam.x), zy = Math.round(z.y - cam.y);
      const alpha = Math.min(0.6, z.life * 0.2);
      ctx.globalAlpha = alpha;
      // Outer glow
      ctx.fillStyle = '#27ae60';
      ctx.beginPath(); ctx.ellipse(zx, zy, z.r + 6, 8, 0, 0, Math.PI * 2); ctx.fill();
      // Inner toxic pool
      ctx.fillStyle = '#2ecc71';
      ctx.beginPath(); ctx.ellipse(zx, zy, z.r, 5, 0, 0, Math.PI * 2); ctx.fill();
      // Bubbles
      const bTime = Date.now() * 0.003;
      for (let i = 0; i < 3; i++) {
        const bx = zx + Math.sin(bTime + i * 2.1) * (z.r * 0.6);
        const by = zy - 3 - Math.abs(Math.sin(bTime * 1.5 + i)) * 6;
        ctx.fillStyle = 'rgba(46,204,113,0.7)';
        ctx.beginPath(); ctx.arc(bx, by, 2 + Math.sin(bTime + i) * 1, 0, Math.PI * 2); ctx.fill();
      }
      ctx.globalAlpha = 1;
    }

    // ── Ice Walls (blue ice barriers) ──
    for (const wall of this.iceWalls) {
      const wx = Math.round(wall.x - cam.x), wy = Math.round(wall.y - cam.y);
      const alpha = Math.min(0.9, wall.life * 0.3);
      ctx.globalAlpha = alpha;
      // Ice body
      ctx.fillStyle = '#a8d8ea';
      ctx.fillRect(wx, wy, wall.w, wall.h);
      // Highlight streak
      ctx.fillStyle = 'rgba(255,255,255,0.5)';
      ctx.fillRect(wx + 1, wy + 2, 2, wall.h - 4);
      // Frost glow
      ctx.fillStyle = 'rgba(116,185,255,0.3)';
      ctx.fillRect(wx - 2, wy - 2, wall.w + 4, wall.h + 4);
      // Cracks when fading
      if (wall.life < 1.5) {
        ctx.strokeStyle = 'rgba(255,255,255,0.6)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(wx + 2, wy + wall.h * 0.3);
        ctx.lineTo(wx + wall.w - 2, wy + wall.h * 0.6);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
    }

    // ── Shadow Clones (semi-transparent dark silhouettes) ──
    for (const c of this.clones) {
      const clx = Math.round(c.x - cam.x - 20), cly = Math.round(c.y - cam.y - 25);
      const alpha = Math.min(0.55, c.life * 0.15);
      ctx.globalAlpha = alpha;
      // Dark robe body (smaller version of Shadow King)
      ctx.fillStyle = this.phase >= 2 ? '#6c3483' : '#2c3e50';
      ctx.beginPath();
      ctx.moveTo(clx + 5, cly + 50);
      ctx.quadraticCurveTo(clx - 2, cly + 25, clx + 8, cly + 10);
      ctx.quadraticCurveTo(clx + 20, cly, clx + 32, cly + 10);
      ctx.quadraticCurveTo(clx + 42, cly + 25, clx + 35, cly + 50);
      ctx.closePath(); ctx.fill();
      // Eyes glow
      ctx.fillStyle = '#e74c3c';
      ctx.beginPath(); ctx.arc(clx + 14, cly + 18, 2.5, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(clx + 26, cly + 18, 2.5, 0, Math.PI * 2); ctx.fill();
      // Aura shimmer
      ctx.strokeStyle = 'rgba(142,68,173,0.3)';
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(clx + 20, cly + 25, 28 + Math.sin(Date.now() * 0.005) * 3, 0, Math.PI * 2); ctx.stroke();
      ctx.globalAlpha = 1;
    }

    // ── Sand Wyrm fire breath mouth glow ──
    if (this.breathing && this.type === 'sand_wyrm') {
      const dir = SB.Player ? (SB.Player.x > this.x + this.w / 2 ? 1 : -1) : 1;
      const mx = sx + this.w / 2 + dir * (this.w / 2 - 5);
      const my = sy + this.h * 0.4;
      ctx.globalAlpha = 0.6 + Math.sin(Date.now() * 0.02) * 0.3;
      ctx.fillStyle = '#f39c12';
      ctx.beginPath(); ctx.arc(mx, my, 10, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#e74c3c';
      ctx.beginPath(); ctx.arc(mx, my, 6, 0, Math.PI * 2); ctx.fill();
      ctx.globalAlpha = 1;
    }

    // ── Projectiles (circles with glow instead of rectangles) ──
    for (const p of this.projectiles) {
      const px = Math.round(p.x - cam.x), py = Math.round(p.y - cam.y);
      const pr = p.w / 2;
      // Glow
      ctx.globalAlpha = 0.25;
      ctx.fillStyle = p.color || '#8B4513';
      ctx.beginPath(); ctx.arc(px + pr, py + pr, pr + 3, 0, Math.PI * 2); ctx.fill();
      // Core
      ctx.globalAlpha = 1;
      ctx.fillStyle = p.color || '#8B4513';
      ctx.beginPath(); ctx.arc(px + pr, py + pr, pr, 0, Math.PI * 2); ctx.fill();
      // Highlight
      ctx.fillStyle = 'rgba(255,255,255,0.4)';
      ctx.beginPath(); ctx.arc(px + pr - 1, py + pr - 1, pr * 0.4, 0, Math.PI * 2); ctx.fill();
    }
  }
}

Boss.TYPES = {
  thornback:   { w: 80, h: 70, hp: 30, color: '#8B4513', name: 'Thornback', speed: 55, shootInterval: 2.0 },
  sand_wyrm:   { w: 70, h: 50, hp: 40, color: '#d4a017', name: 'Sand Wyrm', speed: 70, shootInterval: 1.6 },
  frost_giant:  { w: 80, h: 80, hp: 50, color: '#74b9ff', name: 'Frost Giant', speed: 45, shootInterval: 1.4 },
  shadow_king:  { w: 90, h: 90, hp: 70, color: '#2c3e50', name: 'Shadow King', speed: 65, shootInterval: 1.2 }
};

SB.Boss = Boss;
SB.boss = null;
})();
