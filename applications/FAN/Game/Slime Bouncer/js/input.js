/* ══════════════════════════════════════════════
   Slime Bouncer — Input System
   Keyboard + Touch + Mouse support
   ═════════════════════════════════════════════ */
'use strict';
(function() {
const SB = window.SB || (window.SB = {});

SB.Input = {
  keys: {},
  prev: {},
  touch: { left: false, right: false, up: false, down: false, a: false, b: false, pause: false },
  _prevTouch: { left: false, right: false, up: false, down: false, a: false, b: false, pause: false },

  // Mouse click (available for one frame after click)
  mouse: { clicked: false, x: 0, y: 0 },
  // Mouse position (continuously tracked for hover effects)
  mousePos: { x: -1, y: -1 },
  _pendingClick: null,

  // Computed pressed-this-frame properties (set in update)
  jumpPressed: false,
  attackPressed: false,
  enterPressed: false,
  pausePressed: false,
  upPressed: false,
  downPressed: false,
  leftPressed: false,
  rightPressed: false,

  init() {
    window.addEventListener('keydown', e => {
      if (['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Space','KeyA','KeyD','KeyW','KeyS','ShiftLeft','Escape','Enter','KeyP'].includes(e.code)) {
        e.preventDefault();
      }
      this.keys[e.code] = true;
    });
    window.addEventListener('keyup', e => { this.keys[e.code] = false; });
    window.addEventListener('blur', () => {
      this.keys = {};
      this.touch = { left:false, right:false, up:false, down:false, a:false, b:false, pause:false };
    });

    // Touch buttons
    this._initTouch('btnLeft', 'left');
    this._initTouch('btnRight', 'right');
    this._initTouch('btnUp', 'up');
    this._initTouch('btnDown', 'down');
    this._initTouch('btnA', 'a');
    this._initTouch('btnB', 'b');

    // Mouse click on canvas
    this._initMouse();
  },

  _initTouch(id, key) {
    const el = document.getElementById(id);
    if (!el) return;
    const self = this;
    const on = function(e) { e.preventDefault(); self.touch[key] = true; };
    const off = function(e) { e.preventDefault(); self.touch[key] = false; };
    el.addEventListener('touchstart', on, { passive: false });
    el.addEventListener('touchend', off, { passive: false });
    el.addEventListener('touchcancel', off, { passive: false });
    el.addEventListener('mousedown', on);
    el.addEventListener('mouseup', off);
    el.addEventListener('mouseleave', off);
  },

  _initMouse() {
    const canvas = document.getElementById('gameCanvas');
    if (!canvas) return;

    // Click on canvas → menu interaction
    canvas.addEventListener('click', e => {
      const rect = canvas.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;
      this._pendingClick = {
        x: (e.clientX - rect.left) * (SB.W / rect.width),
        y: (e.clientY - rect.top) * (SB.H / rect.height)
      };
    });

    // Touch on canvas → menu interaction + gear button (mobile)
    canvas.addEventListener('touchend', e => {
      const touch = e.changedTouches[0];
      if (!touch) return;
      const rect = canvas.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;
      this._pendingClick = {
        x: (touch.clientX - rect.left) * (SB.W / rect.width),
        y: (touch.clientY - rect.top) * (SB.H / rect.height)
      };
    }, { passive: true });

    // Mousemove on canvas → hover effects
    canvas.addEventListener('mousemove', e => {
      const rect = canvas.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;
      this.mousePos.x = (e.clientX - rect.left) * (SB.W / rect.width);
      this.mousePos.y = (e.clientY - rect.top) * (SB.H / rect.height);
    });
    canvas.addEventListener('mouseleave', () => {
      this.mousePos.x = -1;
      this.mousePos.y = -1;
    });
  },

  update() {
    const k = this.keys, p = this.prev, t = this.touch, pt = this._prevTouch;

    // Process pending mouse/touch click
    if (this._pendingClick) {
      this.mouse.clicked = true;
      this.mouse.x = this._pendingClick.x;
      this.mouse.y = this._pendingClick.y;
      this._pendingClick = null;
    } else {
      this.mouse.clicked = false;
    }

    // Compute just-pressed flags
    this.jumpPressed = (!p.Space && k.Space) || (!p.ArrowUp && k.ArrowUp) || (!p.KeyW && k.KeyW) || (t.a && !pt.a) || (t.up && !pt.up);
    this.attackPressed = (!p.KeyS && k.KeyS) || (!p.ShiftLeft && k.ShiftLeft) || (!p.ArrowDown && k.ArrowDown) || (t.b && !pt.b);
    this.enterPressed = (!p.Enter && k.Enter) || (!p.Space && k.Space) || (t.a && !pt.a);
    this.pausePressed = (!p.Escape && k.Escape) || (!p.KeyP && k.KeyP) || (t.pause && !pt.pause);
    this.upPressed = (!p.ArrowUp && k.ArrowUp) || (!p.KeyW && k.KeyW) || (t.up && !pt.up);
    this.downPressed = (!p.ArrowDown && k.ArrowDown) || (!p.KeyS && k.KeyS) || (t.down && !pt.down);
    this.leftPressed = (!p.ArrowLeft && k.ArrowLeft) || (!p.KeyA && k.KeyA) || (t.left && !pt.left);
    this.rightPressed = (!p.ArrowRight && k.ArrowRight) || (!p.KeyD && k.KeyD) || (t.right && !pt.right);

    // Store prev for next frame
    this.prev = { ...k };
    this._prevTouch = { ...t };
  },

  // Current held state
  leftHeld()  { return this.keys.ArrowLeft || this.keys.KeyA || this.touch.left; },
  rightHeld() { return this.keys.ArrowRight || this.keys.KeyD || this.touch.right; },
  upHeld()    { return this.keys.ArrowUp || this.keys.KeyW || this.touch.up; },
  jumpHeld()  { return this.keys.Space || this.keys.ArrowUp || this.keys.KeyW || this.touch.a || this.touch.up; },
  attackHeld(){ return this.keys.KeyS || this.keys.ArrowDown || this.keys.ShiftLeft || this.touch.b; }
};
})();
