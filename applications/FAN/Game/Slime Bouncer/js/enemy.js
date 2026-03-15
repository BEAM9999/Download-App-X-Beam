/* ══════════════════════════════════════════════
   Slime Bouncer — Enemy System + AI
   All 16 enemy types with patrol/chase/fly/turret/ambush AI
   ═════════════════════════════════════════════ */
'use strict';
(function() {
const SB = window.SB || (window.SB = {});
const U = SB.Utils;

class Enemy {
  constructor(x, y, type) {
    this.x = x; this.y = y;
    this.type = type;
    this.typeName = type || '';
    this._time = Math.random() * 10;
    this.active = true;
    this.facingDir = 1; // 1=right, -1=left
    this.frame = 0; this.frameTimer = 0;
    this.attackTimer = 0;
    this.stunnedTimer = 0;
    this.flashTimer = 0;
    this.projectiles = [];

    // Defaults — overridden by type
    const cfg = Enemy.TYPES[type] || {};
    this.w = cfg.w || 16; this.h = cfg.h || 16;
    this.hp = cfg.hp || 1; this.maxHp = this.hp;
    this.speed = cfg.speed || 40;
    this.ai = cfg.ai || 'patrol';
    this.score = cfg.score || 100;
    this.color = cfg.color || '#e74c3c';
    this.detectionRange = cfg.detect || 120;
    this.shootInterval = cfg.shootInterval || 3;
    this.attackTimer = Math.random() * this.shootInterval;
    this.vx = 0; this.vy = 0;
    this.onGround = false;
    this.hidden = (this.ai === 'ambush');
    this.activated = false;
    this.baseY = y;
    this.flyPhase = Math.random() * Math.PI * 2;
    this.blinkTimer = 2 + Math.random() * 5;
    this.blinkState = 0;
  }

  get alive() { return this.active; }
  set alive(v) { this.active = v; }

  update(dt) {
    if (!this.active) return;
    this._time += dt;
    if (this.stunnedTimer > 0) { this.stunnedTimer -= dt; return; }
    const player = SB.Player;
    const tilemap = SB.Level.tilemap;
    if (!tilemap) return;

    this.frameTimer += dt;
    if (this.frameTimer > 0.15) { this.frameTimer = 0; this.frame = (this.frame + 1) % 4; }
    if (this.flashTimer > 0) this.flashTimer -= dt;

    // Eye blink timer
    if (this.blinkState > 0) {
      this.blinkState -= dt * 8;
      if (this.blinkState <= 0) { this.blinkState = 0; this.blinkTimer = 2 + Math.random() * 5; }
    } else {
      this.blinkTimer -= dt;
      if (this.blinkTimer <= 0) this.blinkState = 1;
    }

    // Run AI
    switch (this.ai) {
      case 'patrol': this._patrol(dt, tilemap); break;
      case 'chase':  this._chase(dt, player, tilemap); break;
      case 'fly':    this._fly(dt, player); break;
      case 'turret': this._turret(dt, player); break;
      case 'ambush': this._ambush(dt, player, tilemap); break;
    }

    // Apply gravity for ground enemies
    if (this.ai !== 'fly') {
      this.vy += 600 * dt;
      if (this.vy > 400) this.vy = 400;
    }

    // Move + collide
    this._moveAndCollide(dt, tilemap);

    // Update projectiles
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      if (p.gravity) p.vy += p.gravity * dt;
      p.life -= dt;
      if (p.life <= 0) this.projectiles.splice(i, 1);
    }
  }

  _patrol(dt, tilemap) {
    this.vx = this.facingDir * this.speed;
    // Check edge / wall
    const frontX = this.facingDir > 0 ? this.x + this.w + 2 : this.x - 2;
    const frontTileX = Math.floor(frontX / SB.TILE);
    const footTileY = Math.floor((this.y + this.h + 2) / SB.TILE);
    const wallTileY = Math.floor((this.y + this.h / 2) / SB.TILE);
    const wallTile = tilemap.get(frontTileX, wallTileY);
    const floorTile = tilemap.get(frontTileX, footTileY);
    if (SB.SOLID_TILES.has(wallTile) || !SB.SOLID_TILES.has(floorTile)) {
      this.facingDir *= -1;
    }
  }

  _chase(dt, player, tilemap) {
    const dist = U.dist(this.x, this.y, player.x, player.y);
    if (dist < this.detectionRange && !this.hidden) {
      this.facingDir = player.x > this.x ? 1 : -1;
      this.vx = this.facingDir * this.speed;
    } else {
      this._patrol(dt, tilemap);
    }
  }

  _fly(dt, player) {
    this.flyPhase += dt * 2;
    this.y = this.baseY + Math.sin(this.flyPhase) * 20;
    const dist = U.dist(this.x, this.y, player.x, player.y);
    if (dist < this.detectionRange) {
      this.facingDir = player.x > this.x ? 1 : -1;
      this.vx = this.facingDir * this.speed;
    } else {
      this.vx = this.facingDir * this.speed * 0.5;
    }
    this.x += this.vx * dt;
    this.vy = 0;
  }

  _turret(dt, player) {
    this.vx = 0;
    this.attackTimer -= dt;
    if (this.attackTimer <= 0) {
      this.attackTimer = this.shootInterval;
      const dx = player.x - this.x;
      const dy = player.y - this.y;
      const dist = Math.hypot(dx, dy);
      if (dist < 250) {
        const speed = 120;
        this.projectiles.push({
          x: this.x + this.w / 2, y: this.y,
          vx: (dx / dist) * speed, vy: (dy / dist) * speed - 50,
          gravity: 200, life: 3, w: 6, h: 6, color: '#9b59b6'
        });
      }
    }
  }

  _ambush(dt, player, tilemap) {
    const dist = U.dist(this.x, this.y, player.x, player.y);
    if (this.hidden && dist < 60) {
      this.hidden = false;
      this.activated = true;
      this.vy = -200; // Jump out
    }
    if (this.activated) {
      this._chase(dt, player, tilemap);
    }
  }

  _moveAndCollide(dt, tilemap) {
    if (this.ai === 'fly') return; // fly handles own movement

    // Move X
    this.x += this.vx * dt;
    // Check wall collision
    const tl = Math.floor(this.x / SB.TILE);
    const tr = Math.floor((this.x + this.w - 1) / SB.TILE);
    const tm = Math.floor((this.y + this.h / 2) / SB.TILE);
    if (SB.SOLID_TILES.has(tilemap.get(tl, tm)) || SB.SOLID_TILES.has(tilemap.get(tr, tm))) {
      this.x -= this.vx * dt;
      this.facingDir *= -1;
    }

    // Move Y
    this.y += this.vy * dt;
    this.onGround = false;
    // Check ground
    const bl = Math.floor(this.x / SB.TILE);
    const br = Math.floor((this.x + this.w - 1) / SB.TILE);
    const by = Math.floor((this.y + this.h) / SB.TILE);
    if (SB.SOLID_TILES.has(tilemap.get(bl, by)) || SB.SOLID_TILES.has(tilemap.get(br, by))) {
      this.y = by * SB.TILE - this.h;
      this.vy = 0;
      this.onGround = true;
    }
  }

  hit(dmg) {
    this.hp -= (dmg || 1);
    this.flashTimer = 0.15;
    if (this.hp <= 0) {
      this.active = false;
      SB.Particles.emit('stomp', this.x + this.w / 2, this.y + this.h / 2);
      SB.Audio.sfx('enemyDie');
      return true; // dead
    }
    return false;
  }

  draw(ctx, cam) {
    if (!this.active || this.hidden) return;
    const sx = Math.round(this.x - cam.x);
    const sy = Math.round(this.y - cam.y);
    const cx = sx + this.w / 2;
    const cy = sy + this.h / 2;
    const flash = this.flashTimer > 0 && Math.floor(this.flashTimer * 20) % 2 === 0;

    // Drop shadow
    if (SB.Save.data.settings.shadows) {
      ctx.save();
      ctx.fillStyle = 'rgba(0,0,0,0.18)';
      ctx.beginPath();
      ctx.ellipse(cx, sy + this.h + 1, this.w / 2 - 1, 3, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    const bodyColor = flash ? '#fff' : this.color;
    ctx.save();
    const eType = this.typeName || '';
    const isBat = eType.includes('bat') || eType.includes('vulture') || eType.includes('sprite') || eType.includes('imp');
    const isSlime = eType.includes('slime');
    const isShroom = eType.includes('shroom');
    const isWisp = eType.includes('wisp');
    const isGoblin = eType.includes('goblin') || eType.includes('knight') || eType.includes('warrior') || eType.includes('mage');
    const isMummy = eType.includes('mummy') || eType.includes('yeti') || eType.includes('golem');
    const isBerry = eType.includes('berry') || eType.includes('cactus_walker');
    const isBeetle = eType.includes('beetle') || eType.includes('scorpion') || eType.includes('crab');
    const isDjinn = eType.includes('djinn');
    const isBush = eType.includes('bush');
    const isPenguin = eType.includes('penguin');
    const isDemon = eType.includes('demon');

    if (isSlime) {
      // Slime blob shape
      const bob = Math.sin((this._time || 0) * 4) * 1.5;
      ctx.fillStyle = bodyColor;
      ctx.beginPath();
      ctx.moveTo(sx + 2, sy + this.h);
      ctx.quadraticCurveTo(sx - 1, cy + bob, sx + 2, sy + 4);
      ctx.quadraticCurveTo(cx, sy - 2 + bob, sx + this.w - 2, sy + 4);
      ctx.quadraticCurveTo(sx + this.w + 1, cy + bob, sx + this.w - 2, sy + this.h);
      ctx.closePath();
      ctx.fill();
      // Highlight
      ctx.fillStyle = 'rgba(255,255,255,0.25)';
      ctx.beginPath();
      ctx.ellipse(cx - 2, sy + 5, 3, 2, -0.3, 0, Math.PI * 2);
      ctx.fill();
    } else if (isBat) {
      // Bat/winged body (oval) + wing flaps
      ctx.fillStyle = bodyColor;
      ctx.beginPath();
      ctx.ellipse(cx, cy, this.w / 4, this.h / 2 - 1, 0, 0, Math.PI * 2);
      ctx.fill();
      // Wings
      const wingAngle = Math.sin((this._time || 0) * 10) * 0.5;
      ctx.beginPath();
      ctx.moveTo(cx - 3, cy);
      ctx.quadraticCurveTo(sx - 2, cy - 6 + wingAngle * 8, sx, cy + 2);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(cx + 3, cy);
      ctx.quadraticCurveTo(sx + this.w + 2, cy - 6 + wingAngle * 8, sx + this.w, cy + 2);
      ctx.fill();
      // Demon imp: tiny horns
      if (isDemon) {
        ctx.fillStyle = flash ? '#fff' : '#8b0000';
        ctx.beginPath(); ctx.moveTo(cx - 4, cy - 4); ctx.lineTo(cx - 6, cy - 9); ctx.lineTo(cx - 2, cy - 5); ctx.fill();
        ctx.beginPath(); ctx.moveTo(cx + 4, cy - 4); ctx.lineTo(cx + 6, cy - 9); ctx.lineTo(cx + 2, cy - 5); ctx.fill();
      }
    } else if (isShroom) {
      // Mushroom cap
      ctx.fillStyle = bodyColor;
      ctx.beginPath();
      ctx.ellipse(cx, sy + 6, this.w / 2, 8, 0, Math.PI, 0);
      ctx.fill();
      // Cap spots
      if (!flash) {
        ctx.fillStyle = 'rgba(255,255,255,0.4)';
        ctx.beginPath(); ctx.arc(cx - 3, sy + 3, 2, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(cx + 4, sy + 4, 1.5, 0, Math.PI * 2); ctx.fill();
      }
      // Stem
      ctx.fillStyle = flash ? '#fff' : '#f5f0e0';
      ctx.fillRect(cx - 3, sy + 6, 6, this.h - 6);
    } else if (isGoblin) {
      // Humanoid shape: body + head + limbs
      const bob2 = Math.sin((this._time || 0) * 5) * 1;
      // Body
      ctx.fillStyle = bodyColor;
      ctx.fillRect(sx + 3, sy + this.h * 0.35, this.w - 6, this.h * 0.45);
      // Head (round)
      ctx.beginPath();
      ctx.arc(cx, sy + this.h * 0.25 + bob2, this.w * 0.3, 0, Math.PI * 2);
      ctx.fill();
      // Legs
      ctx.fillRect(sx + 4, sy + this.h * 0.8, 3, this.h * 0.2);
      ctx.fillRect(sx + this.w - 7, sy + this.h * 0.8, 3, this.h * 0.2);
      // Arms (animated)
      const armAngle = Math.sin((this._time || 0) * 6) * 0.3;
      ctx.save(); ctx.translate(sx + 2, sy + this.h * 0.45);
      ctx.rotate(-0.3 + armAngle); ctx.fillRect(-1, 0, 2, 8); ctx.restore();
      ctx.save(); ctx.translate(sx + this.w - 2, sy + this.h * 0.45);
      ctx.rotate(0.3 - armAngle); ctx.fillRect(-1, 0, 2, 8); ctx.restore();
      // Knight/warrior: helmet or sword
      if (eType.includes('knight') || eType.includes('warrior')) {
        ctx.fillStyle = flash ? '#fff' : '#888';
        // Helmet visor
        ctx.fillRect(cx - this.w * 0.25, sy + this.h * 0.12, this.w * 0.5, 4);
        // Weapon glow
        ctx.fillStyle = flash ? '#fff' : '#ccc';
        ctx.fillRect(sx + this.w - 4 + Math.sin((this._time||0)*3)*2, sy + this.h * 0.3, 2, 12);
      }
      // Mage: robe bottom + staff
      if (eType.includes('mage')) {
        ctx.fillStyle = flash ? '#fff' : '#6c3483';
        ctx.beginPath();
        ctx.moveTo(sx + 2, sy + this.h * 0.7);
        ctx.lineTo(sx - 1, sy + this.h);
        ctx.lineTo(sx + this.w + 1, sy + this.h);
        ctx.lineTo(sx + this.w - 2, sy + this.h * 0.7);
        ctx.fill();
        // Staff
        ctx.strokeStyle = flash ? '#fff' : '#8B4513';
        ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.moveTo(sx + this.w - 3, sy + 2); ctx.lineTo(sx + this.w - 3, sy + this.h - 4); ctx.stroke();
        // Staff orb
        ctx.fillStyle = flash ? '#fff' : '#e74c3c';
        ctx.beginPath(); ctx.arc(sx + this.w - 3, sy + 2, 3, 0, Math.PI * 2); ctx.fill();
      }
    } else if (isMummy) {
      // Large bulky body
      const bob3 = Math.sin((this._time || 0) * 3) * 1;
      ctx.fillStyle = bodyColor;
      ctx.beginPath();
      const rr = Math.min(4, this.w / 4);
      ctx.moveTo(sx + 2 + rr, sy + 2 + bob3);
      ctx.lineTo(sx + this.w - 2 - rr, sy + 2 + bob3);
      ctx.quadraticCurveTo(sx + this.w - 2, sy + 2, sx + this.w - 2, sy + 2 + rr + bob3);
      ctx.lineTo(sx + this.w - 2, sy + this.h - 2);
      ctx.lineTo(sx + 2, sy + this.h - 2);
      ctx.lineTo(sx + 2, sy + 2 + rr + bob3);
      ctx.quadraticCurveTo(sx + 2, sy + 2, sx + 2 + rr, sy + 2 + bob3);
      ctx.fill();
      // Wrapping stripes (mummy)
      if (eType.includes('mummy')) {
        ctx.strokeStyle = flash ? '#fff' : '#a0978a';
        ctx.lineWidth = 1;
        for (let s = 0; s < 4; s++) {
          const ssy = sy + 6 + s * 5;
          ctx.beginPath(); ctx.moveTo(sx + 3, ssy); ctx.lineTo(sx + this.w - 3, ssy); ctx.stroke();
        }
      }
      // Yeti: fur tufts
      if (eType.includes('yeti')) {
        ctx.fillStyle = flash ? '#fff' : '#d0d8dc';
        ctx.fillRect(sx, sy + 3, 3, 4);
        ctx.fillRect(sx + this.w - 3, sy + 3, 3, 4);
        ctx.fillRect(cx - 1, sy - 1, 3, 3);
      }
      // Golem: gear marks
      if (eType.includes('golem')) {
        ctx.strokeStyle = flash ? '#fff' : '#3d3d3d';
        ctx.lineWidth = 1;
        ctx.beginPath(); ctx.arc(cx, cy, 5, 0, Math.PI * 2); ctx.stroke();
        ctx.fillStyle = flash ? '#fff' : '#555';
        ctx.fillRect(cx - 1, cy - 1, 2, 2);
      }
    } else if (isBerry || isBush) {
      // Round fruit/bush shape
      ctx.fillStyle = bodyColor;
      ctx.beginPath();
      ctx.arc(cx, cy, this.w / 2, 0, Math.PI * 2);
      ctx.fill();
      // Leaf/stem on top
      ctx.fillStyle = flash ? '#fff' : '#1a8a3a';
      ctx.beginPath();
      ctx.moveTo(cx - 2, sy + 2);
      ctx.quadraticCurveTo(cx, sy - 4, cx + 3, sy + 1);
      ctx.fill();
      if (isBush) {
        // Extra bush leaves
        ctx.fillStyle = flash ? '#fff' : '#3aaa5a';
        ctx.beginPath(); ctx.arc(cx - 4, cy - 3, 4, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(cx + 4, cy - 3, 4, 0, Math.PI * 2); ctx.fill();
      }
      // Highlight
      ctx.fillStyle = 'rgba(255,255,255,0.3)';
      ctx.beginPath(); ctx.arc(cx - 2, cy - 2, 3, 0, Math.PI * 2); ctx.fill();
    } else if (isBeetle) {
      // Bug shape: oval body + pincers/claws
      ctx.fillStyle = bodyColor;
      ctx.beginPath();
      ctx.ellipse(cx, cy + 1, this.w / 2 - 1, this.h / 2 - 1, 0, 0, Math.PI * 2);
      ctx.fill();
      // Shell line
      ctx.strokeStyle = flash ? '#fff' : 'rgba(0,0,0,0.3)';
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(cx, sy + 2); ctx.lineTo(cx, sy + this.h - 2); ctx.stroke();
      // Pincers/claws
      ctx.fillStyle = flash ? '#fff' : '#333';
      const legAnim = Math.sin((this._time || 0) * 8) * 2;
      // Front pincers
      ctx.fillRect(sx - 2, cy - 2 + legAnim, 3, 2);
      ctx.fillRect(sx + this.w - 1, cy - 2 - legAnim, 3, 2);
      // Legs
      ctx.fillRect(sx - 1, cy + 3, 2, 2);
      ctx.fillRect(sx + this.w - 1, cy + 3, 2, 2);
    } else if (isDjinn) {
      // Floating genie: body fades at bottom
      ctx.fillStyle = bodyColor;
      ctx.beginPath();
      ctx.arc(cx, cy - 2, this.w / 2, 0, Math.PI * 2);
      ctx.fill();
      // Wispy tail
      ctx.fillStyle = bodyColor + '88';
      ctx.beginPath();
      ctx.moveTo(cx - 4, cy + 3);
      ctx.quadraticCurveTo(cx + Math.sin((this._time||0)*3) * 4, sy + this.h + 2, cx + 2, sy + this.h - 2);
      ctx.quadraticCurveTo(cx, cy + 6, cx + 4, cy + 3);
      ctx.fill();
      // Crown/turban
      ctx.fillStyle = flash ? '#fff' : '#f1c40f';
      ctx.beginPath(); ctx.arc(cx, cy - this.h * 0.3, 4, Math.PI, 0); ctx.fill();
      ctx.fillRect(cx - 1, cy - this.h * 0.3 - 5, 2, 5);
    } else if (isPenguin) {
      // Penguin: black/white body
      ctx.fillStyle = bodyColor;
      ctx.beginPath();
      ctx.ellipse(cx, cy, this.w / 2 - 1, this.h / 2, 0, 0, Math.PI * 2);
      ctx.fill();
      // White belly
      ctx.fillStyle = flash ? '#fff' : '#ecf0f1';
      ctx.beginPath();
      ctx.ellipse(cx, cy + 1, this.w / 3, this.h / 3, 0, 0, Math.PI * 2);
      ctx.fill();
      // Beak
      ctx.fillStyle = flash ? '#fff' : '#f39c12';
      ctx.beginPath();
      ctx.moveTo(cx + (this.facingDir > 0 ? this.w / 2 - 1 : -this.w / 2 + 1), cy);
      ctx.lineTo(cx + (this.facingDir > 0 ? this.w / 2 + 3 : -this.w / 2 - 3), cy + 1);
      ctx.lineTo(cx + (this.facingDir > 0 ? this.w / 2 - 1 : -this.w / 2 + 1), cy + 3);
      ctx.fill();
    } else if (isWisp) {
      // Ghostly wisp with glow
      ctx.fillStyle = bodyColor + '66';
      ctx.beginPath();
      ctx.arc(cx, cy, this.w / 2 + 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = bodyColor;
      ctx.beginPath();
      ctx.arc(cx, cy, this.w / 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.3)';
      ctx.beginPath();
      ctx.arc(cx - 1, cy - 1, 3, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // Default rounded body
      ctx.fillStyle = bodyColor;
      ctx.beginPath();
      const r = Math.min(3, this.w / 4, this.h / 4);
      ctx.moveTo(sx + 1 + r, sy + 1);
      ctx.lineTo(sx + this.w - 1 - r, sy + 1);
      ctx.quadraticCurveTo(sx + this.w - 1, sy + 1, sx + this.w - 1, sy + 1 + r);
      ctx.lineTo(sx + this.w - 1, sy + this.h - 1 - r);
      ctx.quadraticCurveTo(sx + this.w - 1, sy + this.h - 1, sx + this.w - 1 - r, sy + this.h - 1);
      ctx.lineTo(sx + 1 + r, sy + this.h - 1);
      ctx.quadraticCurveTo(sx + 1, sy + this.h - 1, sx + 1, sy + this.h - 1 - r);
      ctx.lineTo(sx + 1, sy + 1 + r);
      ctx.quadraticCurveTo(sx + 1, sy + 1, sx + 1 + r, sy + 1);
      ctx.fill();
      // Highlight
      ctx.fillStyle = 'rgba(255,255,255,0.15)';
      ctx.fillRect(sx + 2, sy + 2, this.w - 4, Math.floor(this.h / 3));
    }

    // Eyes (skip for shroom which has eyes on cap)
    const eBlink = this.blinkState > 0.3;
    if (!isWisp) {
      const eyeY = isShroom ? sy + 2 : (isSlime ? sy + Math.floor(this.h * 0.35) : sy + Math.floor(this.h * 0.3));
      // Smart enemies track player with eyes; patrol just uses facingDir
      let eyeDirX = this.facingDir > 0 ? 2 : -2;
      let eyeDirY = 0;
      const tracksPlayer = this.ai === 'chase' || this.ai === 'turret' || this.ai === 'ambush' || this.ai === 'fly';
      if (tracksPlayer && SB.Player) {
        const pdx = SB.Player.x - this.x;
        const pdy = SB.Player.y - this.y;
        const pd = Math.max(1, Math.hypot(pdx, pdy));
        eyeDirX = (pdx / pd) * 2.5;
        eyeDirY = Math.max(-1.2, Math.min(1.2, (pdy / pd) * 2));
      } else {
        eyeDirX = this.facingDir > 0 ? 2 : -2;
      }
      if (eBlink) {
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(cx - 5, eyeY + 1); ctx.lineTo(cx - 1, eyeY + 1); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(cx + 1, eyeY + 1); ctx.lineTo(cx + 5, eyeY + 1); ctx.stroke();
      } else {
        // White
        ctx.fillStyle = '#fff';
        ctx.beginPath(); ctx.arc(cx - 3 + eyeDirX * 0.4, eyeY + 1, 2, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(cx + 3 + eyeDirX * 0.4, eyeY + 1, 2, 0, Math.PI * 2); ctx.fill();
        // Pupils
        ctx.fillStyle = '#000';
        ctx.beginPath(); ctx.arc(cx - 2.5 + eyeDirX, eyeY + 1.5 + eyeDirY, 1, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(cx + 3.5 + eyeDirX, eyeY + 1.5 + eyeDirY, 1, 0, Math.PI * 2); ctx.fill();
      }
    } else {
      // Wisp eyes: simple dots with blinking
      if (!eBlink) {
        ctx.fillStyle = '#fff';
        ctx.beginPath(); ctx.arc(cx - 2, cy - 1, 1.5, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(cx + 2, cy - 1, 1.5, 0, Math.PI * 2); ctx.fill();
      }
    }

    ctx.restore();

    // Projectiles
    for (const p of this.projectiles) {
      ctx.save();
      ctx.fillStyle = p.color || '#9b59b6';
      const px = Math.round(p.x - cam.x);
      const py = Math.round(p.y - cam.y);
      ctx.beginPath();
      ctx.arc(px + p.w / 2, py + p.h / 2, p.w / 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }
}

// ── Enemy Type Configs ──
Enemy.TYPES = {
  // World 1: Emerald Forest
  red_slime:    { w: 16, h: 16, hp: 1, speed: 40,  ai: 'patrol', score: 100, color: '#e74c3c', detect: 0 },
  green_goblin: { w: 16, h: 22, hp: 2, speed: 55,  ai: 'chase',  score: 200, color: '#27ae60', detect: 100 },
  poison_shroom:{ w: 16, h: 20, hp: 1, speed: 0,   ai: 'turret', score: 150, color: '#8e44ad', detect: 200, shootInterval: 3 },
  tiny_bat:     { w: 16, h: 12, hp: 1, speed: 60,  ai: 'fly',    score: 200, color: '#34495e', detect: 120 },
  lurk_wolf:    { w: 24, h: 20, hp: 2, speed: 100, ai: 'ambush', score: 300, color: '#7f8c8d', detect: 60 },
  angry_berry:  { w: 14, h: 14, hp: 1, speed: 50,  ai: 'patrol', score: 120, color: '#e74c3c', detect: 0 },
  bush_mimic:   { w: 18, h: 16, hp: 2, speed: 0,   ai: 'ambush', score: 250, color: '#2d8a4e', detect: 40 },

  // World 2: Golden Desert
  sand_scorpion:{ w: 20, h: 16, hp: 2, speed: 50,  ai: 'patrol', score: 250, color: '#d4a017', detect: 0 },
  mini_mummy:   { w: 16, h: 24, hp: 3, speed: 30,  ai: 'chase',  score: 400, color: '#bdc3c7', detect: 150 },
  bone_vulture: { w: 24, h: 20, hp: 1, speed: 80,  ai: 'fly',    score: 350, color: '#95a5a6', detect: 160 },
  sand_beetle:  { w: 16, h: 12, hp: 1, speed: 70,  ai: 'patrol', score: 180, color: '#8B6914', detect: 0 },
  desert_djinn: { w: 14, h: 20, hp: 2, speed: 0,   ai: 'turret', score: 350, color: '#e67e22', detect: 180, shootInterval: 2.5 },
  cactus_walker:{ w: 18, h: 22, hp: 2, speed: 35,  ai: 'patrol', score: 300, color: '#2ecc71', detect: 0 },

  // World 3: Frozen Sea
  rolling_penguin:{ w: 16, h: 16, hp: 1, speed: 120, ai: 'chase', score: 200, color: '#2c3e50', detect: 100 },
  ice_block:    { w: 20, h: 20, hp: 2, speed: 40,  ai: 'turret', score: 350, color: '#74b9ff', detect: 200, shootInterval: 2.5 },
  snow_bear:    { w: 24, h: 24, hp: 3, speed: 60,  ai: 'chase',  score: 500, color: '#dfe6e9', detect: 130 },
  frost_sprite: { w: 14, h: 14, hp: 1, speed: 70,  ai: 'fly',    score: 250, color: '#a0d8ef', detect: 120 },
  ice_crab:     { w: 18, h: 14, hp: 1, speed: 45,  ai: 'patrol', score: 180, color: '#5dade2', detect: 0 },
  yeti:         { w: 22, h: 26, hp: 4, speed: 40,  ai: 'chase',  score: 600, color: '#ecf0f1', detect: 140 },

  // World 4: Shadow Castle
  shadow_knight:{ w: 20, h: 28, hp: 3, speed: 70,  ai: 'chase',  score: 800, color: '#2c3e50', detect: 140 },
  fire_bat:     { w: 16, h: 12, hp: 1, speed: 90,  ai: 'fly',    score: 400, color: '#e74c3c', detect: 140 },
  gear_golem:   { w: 28, h: 32, hp: 5, speed: 30,  ai: 'turret', score: 1000,color: '#636e72', detect: 200, shootInterval: 2 },
  shadow_wisp:  { w: 12, h: 12, hp: 1, speed: 0,   ai: 'chase',  score: 500, color: '#6c5ce7', detect: 100 },
  demon_imp:    { w: 16, h: 18, hp: 2, speed: 75,  ai: 'fly',    score: 550, color: '#c0392b', detect: 130 },
  bone_warrior: { w: 18, h: 26, hp: 3, speed: 50,  ai: 'patrol', score: 700, color: '#bdc3c7', detect: 0 },
  dark_mage:    { w: 16, h: 24, hp: 2, speed: 0,   ai: 'turret', score: 650, color: '#9b59b6', detect: 200, shootInterval: 2 }
};

SB.Enemy = Enemy;
SB.enemies = [];
})();
