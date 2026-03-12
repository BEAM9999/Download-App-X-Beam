'use strict';

/* ══════════════════════════════════════════════════════════════
   FAN Theme Customizer v3.0
   – 20 emoji scenes, 25 motions, 20 sound styles, expand/collapse,
     horizontal slider with arrows, per-page sync, sound FX engine
   ══════════════════════════════════════════════════════════════ */

(function () {

  /* ────── Storage keys ────── */
  var LEGACY_STORAGE_KEY  = 'fan_theme_customizer_v1';
  var PAGE_STORAGE_PREFIX = 'fan_theme_customizer_page_';
  var SYNC_STORAGE_KEY    = 'fan_theme_customizer_sync_v1';
  var PAGE_IDS   = ['main', 'chat'];
  var PAGE_LABELS = { main: 'UI หลัก', chat: 'UI แชท' };
  var FALLBACK_PAGE_ID = 'main';

  /* ────── Color helpers ────── */
  var COLOR_FIELDS = Object.freeze([
    { id: 'bg1',       label: 'ฉากบน' },
    { id: 'bg2',       label: 'ฉากกลาง' },
    { id: 'bg3',       label: 'ฉากล่าง' },
    { id: 'accent',    label: 'สีเด่นหลัก' },
    { id: 'accent2',   label: 'สีเด่นรอง' },
    { id: 'highlight', label: 'สีไฮไลต์' },
    { id: 'text',      label: 'ข้อความหลัก' },
    { id: 'text2',     label: 'ข้อความรอง' }
  ]);

  var LEGACY_PRESET_MAP = Object.freeze({
    default: 'berry-dream', dark: 'midnight-neon',
    light: 'cotton-cloud', pink: 'strawberry-milk',
    blue: 'sky-soda', forest: 'matcha-garden'
  });

  /* ────── 8 colour presets ────── */
  var PRESETS = Object.freeze({
    'berry-dream':     { name:'Berry Dream',     subtitle:'หวานวิ้งแบบโทนหลักของ FAN',             swatch:'linear-gradient(135deg,#140b2d,#3d1c68,#7b2cbf)', colors:{bg1:'#140b2d',bg2:'#3d1c68',bg3:'#7b2cbf',accent:'#ff6b9d',accent2:'#c44fc9',highlight:'#ffd166',text:'#f9f5ff',text2:'#cdbbe8'}},
    'sunset-pop':      { name:'Sunset Pop',      subtitle:'ส้มอมชมพู สดและเด้งขึ้นมาก',           swatch:'linear-gradient(135deg,#2b102a,#8f2453,#ff7b54)', colors:{bg1:'#2b102a',bg2:'#8f2453',bg3:'#ff7b54',accent:'#ffb703',accent2:'#ff4d6d',highlight:'#ffe66d',text:'#fff7ef',text2:'#ffd9c7'}},
    'sky-soda':        { name:'Sky Soda',        subtitle:'ฟ้าโซดาสะอาดตาแบบสดใส',               swatch:'linear-gradient(135deg,#0a1833,#123c73,#3aa0ff)', colors:{bg1:'#0a1833',bg2:'#123c73',bg3:'#3aa0ff',accent:'#7cf6ff',accent2:'#4facfe',highlight:'#d1faff',text:'#eef9ff',text2:'#c5dcf7'}},
    'matcha-garden':   { name:'Matcha Garden',   subtitle:'เขียวละมุน พร้อมประกายเหลืองนุ่ม',     swatch:'linear-gradient(135deg,#0a1d17,#165c4c,#72c288)', colors:{bg1:'#0a1d17',bg2:'#165c4c',bg3:'#72c288',accent:'#ffd166',accent2:'#43d9ad',highlight:'#f9f871',text:'#f2fff8',text2:'#b8e7d2'}},
    'peach-fizz':      { name:'Peach Fizz',      subtitle:'พีชนุ่มๆ แต่มีพลังขึ้นกล้อง',         swatch:'linear-gradient(135deg,#2b1620,#ff8a65,#ffd3b6)', colors:{bg1:'#2b1620',bg2:'#ff8a65',bg3:'#ffd3b6',accent:'#ff4f87',accent2:'#ff9a3d',highlight:'#fff0a8',text:'#fff7f2',text2:'#ffd7c4'}},
    'midnight-neon':   { name:'Midnight Neon',   subtitle:'ดึกเข้ม ตัดด้วยนีออนสด',               swatch:'linear-gradient(135deg,#050816,#0d1b48,#101c5d)', colors:{bg1:'#050816',bg2:'#0d1b48',bg3:'#101c5d',accent:'#00e5ff',accent2:'#7c4dff',highlight:'#ff4ecd',text:'#edf3ff',text2:'#99a9d6'}},
    'cotton-cloud':    { name:'Cotton Cloud',    subtitle:'สว่างฟู ใช้ได้จริงทั้งหน้าแรกและแชท', swatch:'linear-gradient(135deg,#fff7fb,#ffe8f3,#d8f2ff)', colors:{bg1:'#fff7fb',bg2:'#ffe8f3',bg3:'#d8f2ff',accent:'#ff6ba0',accent2:'#7fd5ff',highlight:'#ffd166',text:'#4b325c',text2:'#7a668c'}},
    'strawberry-milk': { name:'Strawberry Milk', subtitle:'ชมพูครีมหวานแบบคิวท์จัดเต็ม',         swatch:'linear-gradient(135deg,#2a1020,#ffbfd4,#ffe5ec)', colors:{bg1:'#2a1020',bg2:'#ffbfd4',bg3:'#ffe5ec',accent:'#ff4d8d',accent2:'#ff85a1',highlight:'#fff3b0',text:'#fff7fb',text2:'#ffd4e0'}}
  });

  /* ────── 20 Emoji Scenes + none ────── */
  var SCENES = Object.freeze({
    hearts:      { name:'หัวใจลอย',      icon:'💖', emojis:['❤️','💖','💘','💕','💗'] },
    blossoms:    { name:'สวนดอกไม้',     icon:'🌸', emojis:['🌸','🌺','🌷','🌼','🪷'] },
    stars:       { name:'ดาววิ้ง',        icon:'✨', emojis:['✨','⭐','🌟','💫','⚡'] },
    dreamy:      { name:'ฝันฟุ้ง',        icon:'🌙', emojis:['🌙','☁️','🫧','🦋','✨'] },
    cute:        { name:'คิวท์มิกซ์',     icon:'🎀', emojis:['🎀','🧸','🐰','🍓','🫧'] },
    party:       { name:'ปาร์ตี้หวาน',    icon:'🎉', emojis:['🎉','🎈','🎊','💝','🪩'] },
    ocean:       { name:'มหาสมุทร',       icon:'🌊', emojis:['🌊','🐚','🐬','🦀','🏖️'] },
    galaxy:      { name:'กาแล็กซี',       icon:'🪐', emojis:['🪐','🚀','🌌','☄️','🛸'] },
    candy:       { name:'แคนดี้ป๊อป',    icon:'🍬', emojis:['🍬','🍭','🍩','🧁','🎂'] },
    forest:      { name:'ป่าลึกลับ',      icon:'🌿', emojis:['🌿','🍃','🍄','🌲','🦊'] },
    snow:        { name:'หิมะขาว',        icon:'❄️', emojis:['❄️','⛄','🌨️','🏔️','🧊'] },
    fire:        { name:'ไฟลุก',          icon:'🔥', emojis:['🔥','💥','☀️','🌋','⚡'] },
    rainbow:     { name:'สายรุ้ง',        icon:'🌈', emojis:['🌈','🦄','🎨','🫧','💎'] },
    music:       { name:'ดนตรีป๊อป',     icon:'🎵', emojis:['🎵','🎶','🎸','🎤','🎧'] },
    gaming:      { name:'เกมเมอร์',       icon:'🎮', emojis:['🎮','🕹️','👾','🏆','💎'] },
    sakura:      { name:'ซากุระ',         icon:'🌸', emojis:['🌸','🎐','🏯','🎋','🍡'] },
    neon:        { name:'นีออนซิตี้',     icon:'💡', emojis:['💡','🔮','🪩','💜','🟣'] },
    tropical:    { name:'ทรอปิคอล',       icon:'🌴', emojis:['🌴','🍉','🦜','🌺','🥥'] },
    magic:       { name:'เวทมนตร์',       icon:'🔮', emojis:['🔮','✨','🪄','🧙','💫'] },
    love:        { name:'รักๆ มิกซ์',    icon:'💕', emojis:['💕','💌','🥰','💋','🌹'] },
    none:        { name:'ปิดพื้นหลัง',    icon:'🚫', emojis:[] }
  });

  /* ────── 25 Motion Styles ────── */
  var MOTIONS = Object.freeze({
    float:       { name:'ลอยนุ่ม',       icon:'〰️',  cat:'นุ่มนวล' },
    drift:       { name:'พัดผ่าน',       icon:'🍃',  cat:'นุ่มนวล' },
    orbit:       { name:'หมุนรอบ',       icon:'🪩',  cat:'เท่' },
    bounce:      { name:'เด้งคิวท์',     icon:'🫧',  cat:'น่ารัก' },
    zigzag:      { name:'ซิกแซก',        icon:'⚡',  cat:'เท่' },
    spiral:      { name:'เกลียวหมุน',    icon:'🌀',  cat:'สวย' },
    rain:        { name:'ตกลงนุ่ม',      icon:'🌧️',  cat:'นุ่มนวล' },
    wave:        { name:'คลื่นซัด',      icon:'🌊',  cat:'สวย' },
    pulse:       { name:'พัลส์เบา',      icon:'💓',  cat:'นุ่มนวล' },
    shake:       { name:'สั่นเบาๆ',      icon:'📳',  cat:'เท่' },
    twinkle:     { name:'กระพริบ',       icon:'✨',  cat:'สวย' },
    swing:       { name:'แกว่งไกว',      icon:'🎐',  cat:'น่ารัก' },
    pop:         { name:'ผุดป๊อป',       icon:'🎈',  cat:'น่ารัก' },
    matrix:      { name:'เมทริกซ์',      icon:'🖥️',  cat:'เท่' },
    butterfly:   { name:'ผีเสื้อบิน',    icon:'🦋',  cat:'สวย' },
    heartbeat:   { name:'หัวใจเต้น',     icon:'💗',  cat:'น่ารัก' },
    glitch:      { name:'กลิทช์',        icon:'📺',  cat:'เท่' },
    tornado:     { name:'พายุหมุน',      icon:'🌪️',  cat:'แรง' },
    explosion:   { name:'ระเบิดกระจาย', icon:'💥',  cat:'แรง' },
    meteor:      { name:'อุกกาบาต',      icon:'☄️',  cat:'แรง' },
    elastic:     { name:'ยืดหยุ่น',      icon:'🪀',  cat:'น่ารัก' },
    confetti:    { name:'คอนเฟตตี',      icon:'🎊',  cat:'สวย' },
    snow_fall:   { name:'หิมะตก',        icon:'❄️',  cat:'นุ่มนวล' },
    disco:       { name:'ดิสโก้',        icon:'🪩',  cat:'เท่' },
    firefly:     { name:'หิ่งห้อย',      icon:'🌟',  cat:'สวย' }
  });

  /* ────── 20 Sound Styles ────── */
  var SOUND_STYLES = Object.freeze({
    'bubble':      { name:'Bubble Pop',     icon:'🫧', cat:'น่ารัก', desc:'เสียงฟองอากาศนุ่มๆ',   freqs:[600,800,1000], type:'sine',      dur:0.08 },
    'chime':       { name:'Wind Chime',     icon:'🎐', cat:'นุ่มนวล', desc:'เสียงกระดิ่งลม',       freqs:[523,659,784],  type:'sine',      dur:0.15 },
    'click':       { name:'Soft Click',     icon:'🖱️', cat:'นุ่มนวล', desc:'คลิกเบาๆ',            freqs:[800],          type:'sine',      dur:0.06 },
    'pop':         { name:'Cute Pop',       icon:'🎈', cat:'น่ารัก', desc:'ป๊อปน่ารัก',           freqs:[500,700],      type:'sine',      dur:0.07 },
    'sparkle':     { name:'Sparkle',        icon:'✨', cat:'สวย',   desc:'ประกายวิ้ง',            freqs:[1200,1500,1800],type:'sine',     dur:0.12 },
    'retro':       { name:'Retro 8-bit',    icon:'🎮', cat:'เท่',   desc:'เสียงเกมย้อนยุค',      freqs:[440,550,660],  type:'square',    dur:0.06 },
    'synth':       { name:'Synth Wave',     icon:'🌊', cat:'เท่',   desc:'ซินธ์เวฟฟิวเจอร์',     freqs:[300,400,500],  type:'sawtooth',  dur:0.1  },
    'harp':        { name:'Harp Pluck',     icon:'🎵', cat:'สวย',   desc:'ดีดพิณเบาๆ',           freqs:[392,523,659],  type:'sine',      dur:0.2  },
    'glass':       { name:'Glass Tap',      icon:'🥂', cat:'สวย',   desc:'แตะแก้วใส',            freqs:[2000,2400],    type:'sine',      dur:0.1  },
    'wood':        { name:'Wood Block',     icon:'🪵', cat:'นุ่มนวล', desc:'เคาะไม้เบา',          freqs:[200,300],      type:'triangle',  dur:0.05 },
    'bell':        { name:'Tiny Bell',      icon:'🔔', cat:'น่ารัก', desc:'กระดิ่งเล็กๆ',        freqs:[800,1200,1600],type:'sine',      dur:0.18 },
    'laser':       { name:'Laser Beep',     icon:'🔫', cat:'เท่',   desc:'เลเซอร์บี๊บ',          freqs:[1400,900],     type:'sawtooth',  dur:0.08 },
    'drum':        { name:'Soft Drum',      icon:'🥁', cat:'เท่',   desc:'กลองเบาๆ',             freqs:[100,150],      type:'triangle',  dur:0.08 },
    'xylophone':   { name:'Xylophone',      icon:'🎹', cat:'สวย',   desc:'ระนาดไม้ใส',           freqs:[523,587,659],  type:'sine',      dur:0.15 },
    'whoosh':      { name:'Whoosh',         icon:'💨', cat:'นุ่มนวล', desc:'เสียงลมพัด',          freqs:[200,600],      type:'sine',      dur:0.12 },
    'boing':       { name:'Boing Spring',   icon:'🪀', cat:'น่ารัก', desc:'เด้งสปริง',            freqs:[250,500,250],  type:'sine',      dur:0.15 },
    'pixel':       { name:'Pixel Blip',     icon:'👾', cat:'เท่',   desc:'พิกเซลบลิ๊บ',          freqs:[880,1100],     type:'square',    dur:0.04 },
    'marimba':     { name:'Marimba',        icon:'🪇', cat:'สวย',   desc:'มาริมบานุ่ม',          freqs:[440,554,659],  type:'sine',      dur:0.18 },
    'droplet':     { name:'Water Drop',     icon:'💧', cat:'นุ่มนวล', desc:'หยดน้ำ',              freqs:[1000,1400],    type:'sine',      dur:0.1  },
    'crystal':     { name:'Crystal Ring',   icon:'💎', cat:'สวย',   desc:'เสียงคริสตัลใส',        freqs:[1600,2000,2400],type:'sine',     dur:0.2  }
  });

  /* ────── UI Toggle definitions (20 items) ────── */
  var UI_TOGGLES = Object.freeze([
    { id:'emojiEnabled',    label:'แสดง Emoji พื้นหลัง',      desc:'เปิด/ปิด emoji ลอยด้านหลัง UI',           icon:'✨', def:false },
    { id:'blurEmoji',       label:'เบลอ Emoji',               desc:'ทำให้ emoji เบลอนุ่มนวล',                 icon:'🌫️', def:true },
    { id:'showBorders',     label:'เส้นขอบ UI',               desc:'แสดงเส้นขอบรอบ UI elements',               icon:'🔲', def:true },
    { id:'showParticles',   label:'อนุภาคลอย',                desc:'อนุภาคเล็กๆ ลอยในพื้นหลัง',              icon:'🌟', def:true },
    { id:'showGlow',        label:'แสง Glow',                 desc:'เพิ่มแสงเรืองรอบ accent',                  icon:'💡', def:true },
    { id:'roundedCorners',  label:'มุมโค้งมน',                desc:'ทำให้ UI elements โค้งมนมากขึ้น',          icon:'⭕', def:true },
    { id:'glassMorphism',   label:'Glass Effect',             desc:'พื้นหลังโปร่งแสงแบบกระจก',                icon:'🔮', def:true },
    { id:'showShadows',     label:'เงา UI',                   desc:'เพิ่มเงาให้ปุ่มและการ์ด',                 icon:'🌑', def:true },
    { id:'animateButtons',  label:'อนิเมชั่นปุ่ม',            desc:'ปุ่มจะมีเอฟเฟกต์เมื่อกด',                icon:'👆', def:true },
    { id:'gradientText',    label:'ข้อความไล่สี',             desc:'หัวข้อหลักจะแสดงเป็นไล่สี',               icon:'🎨', def:false },
    { id:'smoothScroll',    label:'เลื่อนนุ่ม',              desc:'การเลื่อนหน้าจอนุ่มนวลมากขึ้น',          icon:'📜', def:true },
    { id:'hoverEffects',    label:'Hover Effects',            desc:'เอฟเฟกต์เมื่อเลื่อนเมาส์ผ่าน',           icon:'🎯', def:true },
    { id:'showRipple',      label:'Ripple กดปุ่ม',            desc:'แสดงคลื่น ripple เมื่อกดปุ่ม',            icon:'🔘', def:true },
    { id:'showOrbs',        label:'Orb เรืองแสง',            desc:'ลูกบอลเรืองแสงในพื้นหลัง',                icon:'🟣', def:true },
    { id:'compactMode',     label:'โหมดกะทัดรัด',            desc:'ลด spacing ให้ UI แน่นขึ้น',              icon:'📐', def:false },
    { id:'autoNightMode',   label:'Night Mode อัตโนมัติ',     desc:'เปลี่ยนโทนมืดตามเวลา (18:00-06:00)',     icon:'🌙', def:false },
    { id:'showClock',       label:'แสดงนาฬิกา',              desc:'แสดงนาฬิกาแบบเรียลไทม์',                  icon:'🕐', def:true },
    { id:'showFab',         label:'ปุ่มแชทลอย',              desc:'แสดงปุ่มลอยเข้าหน้าแชท',                  icon:'💬', def:true },
    { id:'showWelcome',     label:'หน้าจอต้อนรับ',           desc:'แสดงหน้าต้อนรับ emoji',                   icon:'👋', def:true },
    { id:'showPreview',     label:'พรีวิวธีม',                desc:'แสดงช่องพรีวิวในตัวตั้งค่าธีม',          icon:'👁️', def:true }
  ]);

  /* ────── Default settings ────── */
  var DEFAULT_SETTINGS = Object.freeze({
    preset: 'berry-dream',
    colors: {},
    emojiScene: 'hearts',
    motion: 'float',
    density: 18,
    size: 1,
    emojiEnabled: false,
    blurEmoji: true,
    showBorders: true,
    showParticles: true,
    showGlow: true,
    roundedCorners: true,
    glassMorphism: true,
    showShadows: true,
    animateButtons: true,
    gradientText: false,
    smoothScroll: true,
    hoverEffects: true,
    showRipple: true,
    showOrbs: true,
    compactMode: false,
    autoNightMode: false,
    showClock: true,
    showFab: true,
    showWelcome: true,
    showPreview: true,
    soundEnabled: false,
    soundStyle: 'bubble',
    soundVolume: 50
  });

  var DEFAULT_SYNC_STATE = Object.freeze({ enabled: false, leader: '', updatedAt: 0 });

  /* ────── Runtime ────── */
  var controllers = new Set();
  var controllerCount = 0;

  /* ═══════ Utility functions ═══════ */
  function clamp(v, mn, mx) { return Math.min(mx, Math.max(mn, v)); }
  function deepClone(o) { return JSON.parse(JSON.stringify(o)); }

  function resolveElement(t) {
    if (!t) return null;
    if (typeof t === 'string') return document.getElementById(t) || document.querySelector(t);
    return t;
  }

  function isHexColor(v) { return typeof v === 'string' && /^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i.test(v.trim()); }

  function normalizeHex(v) {
    if (!isHexColor(v)) return '';
    var h = v.trim().toLowerCase();
    if (h.length === 4) h = '#' + h[1] + h[1] + h[2] + h[2] + h[3] + h[3];
    return h;
  }

  function hexToRgb(h) {
    var v = normalizeHex(h) || '#000000';
    return { r: parseInt(v.slice(1, 3), 16), g: parseInt(v.slice(3, 5), 16), b: parseInt(v.slice(5, 7), 16) };
  }

  function rgbaString(h, a) { var c = hexToRgb(h); return 'rgba(' + c.r + ',' + c.g + ',' + c.b + ',' + a + ')'; }

  function mix(a, b, w) {
    var ca = hexToRgb(a), cb = hexToRgb(b), r = clamp(w, 0, 1);
    return '#' + [
      Math.round(ca.r + (cb.r - ca.r) * r),
      Math.round(ca.g + (cb.g - ca.g) * r),
      Math.round(ca.b + (cb.b - ca.b) * r)
    ].map(function(v) { return v.toString(16).padStart(2, '0'); }).join('');
  }

  function luminance(h) {
    var c = hexToRgb(h);
    var ch = [c.r, c.g, c.b].map(function(v) { var s = v / 255; return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4); });
    return ch[0] * 0.2126 + ch[1] * 0.7152 + ch[2] * 0.0722;
  }

  function pickTextColor(bg) { return luminance(bg) > 0.58 ? '#111421' : '#ffffff'; }
  function mapLegacyPreset(n) { return PRESETS[n] ? n : (LEGACY_PRESET_MAP[n] || DEFAULT_SETTINGS.preset); }
  function resolvePageId(id) { return PAGE_IDS.indexOf(id) !== -1 ? id : FALLBACK_PAGE_ID; }

  /* ═══════ Settings sanitize / storage ═══════ */
  function sanitizeSettings(raw, legacyPreset) {
    var src = raw && typeof raw === 'object' ? raw : {};
    var s = deepClone(DEFAULT_SETTINGS);

    var rp = typeof src.preset === 'string' ? src.preset : '';
    if (PRESETS[rp]) s.preset = rp;
    else if (PRESETS[legacyPreset]) s.preset = legacyPreset;
    else if (legacyPreset) s.preset = mapLegacyPreset(legacyPreset);

    if (typeof src.emojiScene === 'string' && SCENES[src.emojiScene]) s.emojiScene = src.emojiScene;
    if (typeof src.motion === 'string' && MOTIONS[src.motion]) s.motion = src.motion;
    s.density = clamp(parseInt(src.density, 10) || s.density, 8, 32);
    s.size = clamp(parseFloat(src.size) || s.size, 0.75, 1.75);

    UI_TOGGLES.forEach(function(t) {
      if (typeof src[t.id] === 'boolean') s[t.id] = src[t.id];
    });
    if (typeof src.soundEnabled === 'boolean') s.soundEnabled = src.soundEnabled;
    if (typeof src.soundStyle === 'string' && SOUND_STYLES[src.soundStyle]) s.soundStyle = src.soundStyle;
    s.soundVolume = clamp(parseInt(src.soundVolume, 10) || s.soundVolume, 0, 200);

    if (src.colors && typeof src.colors === 'object') {
      COLOR_FIELDS.forEach(function(f) {
        var c = normalizeHex(src.colors[f.id]);
        if (c) s.colors[f.id] = c;
      });
    }
    return s;
  }

  function pageStorageKey(pageId) { return PAGE_STORAGE_PREFIX + resolvePageId(pageId) + '_v2'; }

  function loadPageSettings(pageId, legacyPreset) {
    try {
      var stored = JSON.parse(localStorage.getItem(pageStorageKey(pageId)));
      if (stored) return sanitizeSettings(stored, legacyPreset);
    } catch (_) { /* ignore */ }
    try {
      var legacy = JSON.parse(localStorage.getItem(LEGACY_STORAGE_KEY));
      if (legacy) return sanitizeSettings(legacy, legacyPreset);
    } catch (_) { /* ignore */ }
    return sanitizeSettings(null, legacyPreset);
  }

  function savePageSettings(pageId, settings) {
    try { localStorage.setItem(pageStorageKey(pageId), JSON.stringify(settings)); } catch (_) { /* ignore */ }
  }

  function loadSyncState() {
    try { return Object.assign({}, DEFAULT_SYNC_STATE, JSON.parse(localStorage.getItem(SYNC_STORAGE_KEY))); }
    catch (_) { return deepClone(DEFAULT_SYNC_STATE); }
  }

  function saveSyncState(st) {
    try { localStorage.setItem(SYNC_STORAGE_KEY, JSON.stringify(st)); } catch (_) { /* ignore */ }
  }

  /* ═══════ Merge & effective colours ═══════ */
  function mergeSettings(base, patch, legacyPreset) {
    var next = sanitizeSettings(base, legacyPreset);
    if (!patch || typeof patch !== 'object') return next;
    if (typeof patch.preset === 'string' && PRESETS[patch.preset]) next.preset = patch.preset;
    if (typeof patch.emojiScene === 'string' && SCENES[patch.emojiScene]) next.emojiScene = patch.emojiScene;
    if (typeof patch.motion === 'string' && MOTIONS[patch.motion]) next.motion = patch.motion;
    if (patch.density != null) next.density = clamp(parseInt(patch.density, 10) || next.density, 8, 32);
    if (patch.size != null) next.size = clamp(parseFloat(patch.size) || next.size, 0.75, 1.75);
    if (patch.clearColors) next.colors = {};
    if (patch.colors && typeof patch.colors === 'object') {
      next.colors = Object.assign({}, next.colors);
      Object.entries(patch.colors).forEach(function(e) { var n = normalizeHex(e[1]); if (n) next.colors[e[0]] = n; });
    }
    UI_TOGGLES.forEach(function(t) { if (typeof patch[t.id] === 'boolean') next[t.id] = patch[t.id]; });
    if (typeof patch.soundEnabled === 'boolean') next.soundEnabled = patch.soundEnabled;
    if (typeof patch.soundStyle === 'string' && SOUND_STYLES[patch.soundStyle]) next.soundStyle = patch.soundStyle;
    if (patch.soundVolume != null) next.soundVolume = clamp(parseInt(patch.soundVolume, 10) || next.soundVolume, 0, 200);
    return sanitizeSettings(next, legacyPreset);
  }

  function getEffectiveColors(s) {
    var p = PRESETS[s.preset] || PRESETS[DEFAULT_SETTINGS.preset];
    return Object.assign({}, p.colors, s.colors);
  }

  /* ═══════ Build CSS palette ═══════ */
  function buildPalette(settings) {
    var c = getEffectiveColors(settings);
    var ab = mix(c.accent, c.accent2, 0.46);
    var ic = pickTextColor(ab);
    var pt = mix(c.bg2, c.text, 0.1);
    var st = mix(c.bg3, c.text, 0.08);
    return {
      metaColor: c.bg2,
      colors: c,
      cssVars: {
        '--bg1': c.bg1, '--bg2': c.bg2, '--bg3': c.bg3,
        '--pink': c.accent, '--pink2': mix(c.accent, c.accent2, 0.42),
        '--gold': c.highlight, '--blue': c.accent2, '--blue2': mix(c.accent2, c.highlight, 0.28),
        '--card': rgbaString(pt, 0.34), '--border': rgbaString(c.text, 0.14),
        '--text': c.text, '--text2': c.text2, '--bg': c.bg1,
        '--surface': rgbaString(mix(c.bg2, c.text, 0.08), 0.78),
        '--surface2': rgbaString(mix(st, c.accent, 0.14), 0.84),
        '--accent': c.accent, '--accent2': c.accent2,
        '--user-bubble': ab, '--user-text': ic,
        '--bot-bubble': rgbaString(mix(c.bg2, c.text, 0.06), 0.82), '--bot-text': c.text,
        '--border2': rgbaString(c.text, 0.2),
        '--text3': mix(c.text2, c.bg1, 0.45),
        '--fan-on-accent': ic,
        '--fan-preview-gradient': 'linear-gradient(135deg,' + c.bg1 + ',' + c.bg2 + ',' + c.bg3 + ')',
        '--fan-glow': rgbaString(c.accent, 0.28),
        '--fan-glow-strong': rgbaString(c.accent2, 0.28),
        '--fan-panel-bg': rgbaString(mix(c.bg2, c.text, 0.08), 0.84),
        '--fan-panel-border': rgbaString(c.text, 0.16),
        '--fan-panel-muted': c.text2,
        '--fan-section-bg': rgbaString(mix(c.bg3, c.text, 0.08), 0.26),
        '--fan-slider-fill': 'linear-gradient(90deg,' + c.accent + ',' + c.accent2 + ')',
        '--fan-emoji-shadow': rgbaString(c.bg1, 0.22),
        '--fan-emoji-blur': settings.blurEmoji ? '8px' : '0px',
        '--fan-particle-1': mix(c.accent, c.highlight, 0.2),
        '--fan-particle-2': mix(c.accent, c.accent2, 0.52),
        '--fan-particle-3': c.highlight,
        '--fan-particle-4': c.accent2,
        '--fan-particle-5': mix(c.bg3, c.highlight, 0.34),
        '--fan-particle-6': mix(c.text, c.accent2, 0.34),
        '--fan-button-grad': 'linear-gradient(135deg,' + c.accent + ',' + mix(c.accent, c.accent2, 0.6) + ')',
        '--fan-button-border': rgbaString(c.accent, 0.34),
        '--fan-button-shadow': rgbaString(c.accent, 0.4),
        '--fan-control-bg': 'rgba(255,255,255,0.08)',
        '--fan-chip-bg': rgbaString(c.accent2, 0.12),
        '--fan-chip-border': rgbaString(c.accent2, 0.28),
        '--fan-chip-text': c.text,
        '--fan-muted-surface': 'rgba(255,255,255,0.08)',
        '--fan-topbar-bg': rgbaString(c.bg1, 0.88),
        '--fan-topbar-icon-bg': 'rgba(255,255,255,0.92)',
        '--fan-accent-soft': rgbaString(c.accent, 0.12),
        '--fan-accent-soft-strong': rgbaString(c.accent, 0.22)
      }
    };
  }

  function updateMetaTheme(m, c) { if (m) m.setAttribute('content', c); }

  /* ═══════ Render emoji backdrop ═══════ */
  function renderBackdrop(host, settings) {
    if (!host) return;
    host.dataset.scene = settings.emojiScene;
    host.dataset.motion = settings.motion;
    var orbs = settings.showOrbs !== false
      ? '<div class="fan-theme-orb fan-theme-orb-a"></div><div class="fan-theme-orb fan-theme-orb-b"></div>'
      : '';
    if (!settings.emojiEnabled || settings.emojiScene === 'none') {
      host.classList.add('is-empty');
      host.innerHTML = orbs;
      return;
    }
    host.classList.remove('is-empty');
    var scene = SCENES[settings.emojiScene] || SCENES.hearts;
    var count = clamp(Math.round(settings.density), 8, 32);
    var parts = [orbs];
    for (var i = 0; i < count; i++) {
      var emoji = scene.emojis[Math.floor(Math.random() * scene.emojis.length)] || '✨';
      var sz = (26 + Math.random() * 34) * settings.size;
      parts.push(
        '<span class="fan-theme-emoji" style="' +
        '--left:' + (Math.random() * 100).toFixed(2) + '%;' +
        '--top:' + (Math.random() * 100).toFixed(2) + '%;' +
        '--size:' + sz.toFixed(1) + 'px;' +
        '--drift-x:' + Math.round((Math.random() * 2 - 1) * 92) + 'px;' +
        '--drift-y:' + Math.round(28 + Math.random() * 78) + 'px;' +
        '--rotate:' + Math.round((Math.random() * 2 - 1) * 130) + 'deg;' +
        '--duration:' + (12 + Math.random() * 18).toFixed(2) + 's;' +
        '--delay:' + (-Math.random() * 18).toFixed(2) + 's;' +
        '--opacity:' + (0.34 + Math.random() * 0.34).toFixed(2) +
        '">' + emoji + '</span>'
      );
    }
    host.innerHTML = parts.join('');
  }

  /* ═══════ Sound Action Profiles ═══════ */
  var ACTION_PROFILES = Object.freeze({
    click:    { freqMul:1.0,  durMul:1.0,  volMul:1.0  },
    send:     { freqMul:1.35, durMul:1.6,  volMul:1.15, sweep:'up'   },
    type:     { freqMul:1.8,  durMul:0.35, volMul:0.4,  randomize:0.18 },
    'delete': { freqMul:0.7,  durMul:0.5,  volMul:0.5,  sweep:'down' },
    toggle:   { freqMul:1.15, durMul:0.8,  volMul:0.85 },
    close:    { freqMul:0.8,  durMul:0.7,  volMul:0.75, sweep:'down' },
    navigate: { freqMul:1.25, durMul:1.3,  volMul:1.05, sweep:'up'   },
    done:     { freqMul:1.45, durMul:2.0,  volMul:1.0,  chord:true   },
    voiceOn:  { freqMul:1.5,  durMul:1.1,  volMul:0.9,  sweep:'up'   },
    voiceOff: { freqMul:0.65, durMul:0.9,  volMul:0.8,  sweep:'down' },
    select:   { freqMul:1.1,  durMul:0.85, volMul:0.85 },
    copy:     { freqMul:1.3,  durMul:0.55, volMul:0.7  },
    error:    { freqMul:0.5,  durMul:1.4,  volMul:1.0,  sweep:'down' }
  });

  /* ═══════ Sound FX Engine ═══════ */
  var _audioCtx = null;
  function getAudioCtx() {
    if (!_audioCtx) {
      var AC = window.AudioContext || window.webkitAudioContext;
      if (AC) _audioCtx = new AC();
    }
    return _audioCtx;
  }

  function playSoundFX(settings, action) {
    if (!settings || !settings.soundEnabled) return;
    var style = SOUND_STYLES[settings.soundStyle] || SOUND_STYLES.bubble;
    var profile = ACTION_PROFILES[action] || ACTION_PROFILES.click;
    var ctx = getAudioCtx();
    if (!ctx) return;
    if (ctx.state === 'suspended') ctx.resume();

    var vol = clamp(settings.soundVolume, 0, 200) / 100;
    var dur = style.dur * profile.durMul;
    var baseVol = 0.15 * vol * profile.volMul;

    var freqs = style.freqs.map(function(f) {
      var v = f * profile.freqMul;
      if (profile.randomize) v += (Math.random() - 0.5) * f * profile.randomize;
      return clamp(Math.round(v), 60, 4000);
    });

    if (profile.chord && freqs.length < 3) {
      freqs.push(clamp(Math.round(freqs[0] * 1.5), 60, 4000));
    }

    var gain = ctx.createGain();
    gain.connect(ctx.destination);
    gain.gain.setValueAtTime(Math.max(baseVol, 0.001), ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur + 0.06);

    freqs.forEach(function(freq, idx) {
      var osc = ctx.createOscillator();
      osc.connect(gain);
      osc.type = style.type;
      var t0 = ctx.currentTime + idx * 0.04;

      if (profile.sweep === 'up') {
        osc.frequency.setValueAtTime(Math.max(freq * 0.65, 60), t0);
        osc.frequency.exponentialRampToValueAtTime(freq, t0 + dur * 0.7);
      } else if (profile.sweep === 'down') {
        osc.frequency.setValueAtTime(freq, t0);
        osc.frequency.exponentialRampToValueAtTime(Math.max(freq * 0.45, 60), t0 + dur);
      } else {
        osc.frequency.setValueAtTime(freq, t0);
      }
      osc.start(t0);
      osc.stop(t0 + dur + 0.06);
    });
  }

  // Expose global for other scripts (app.js / chat.js).
  // Returns true if at least one controller had soundEnabled=true (so caller can skip default sound).
  window._fanPlaySoundFX = function(action) {
    var played = false;
    controllers.forEach(function(ctrl) {
      if (ctrl.settings && ctrl.settings.soundEnabled) {
        playSoundFX(ctrl.settings, action || 'click');
        played = true;
      }
    });
    return played;
  };

  /* ═══════ Build preview summary ═══════ */
  function buildPreviewHTML(settings) {
    var items = [];
    var preset = PRESETS[settings.preset] || PRESETS[DEFAULT_SETTINGS.preset];
    items.push('<div class="fan-pv-item"><span class="fan-pv-icon">🎨</span><span class="fan-pv-label">' + preset.name + '</span></div>');
    if (settings.emojiEnabled) {
      var scene = SCENES[settings.emojiScene] || SCENES.hearts;
      items.push('<div class="fan-pv-item"><span class="fan-pv-icon">' + scene.icon + '</span><span class="fan-pv-label">' + scene.name + '</span></div>');
      var motion = MOTIONS[settings.motion] || MOTIONS.float;
      items.push('<div class="fan-pv-item"><span class="fan-pv-icon">' + motion.icon + '</span><span class="fan-pv-label">' + motion.name + '</span></div>');
    }
    if (settings.blurEmoji) items.push('<div class="fan-pv-item"><span class="fan-pv-icon">🌫️</span><span class="fan-pv-label">เบลอ</span></div>');
    if (settings.showBorders) items.push('<div class="fan-pv-item"><span class="fan-pv-icon">🔲</span><span class="fan-pv-label">ขอบ</span></div>');
    if (settings.soundEnabled) {
      var ss = SOUND_STYLES[settings.soundStyle] || SOUND_STYLES.bubble;
      items.push('<div class="fan-pv-item"><span class="fan-pv-icon">' + ss.icon + '</span><span class="fan-pv-label">' + ss.name + ' ' + settings.soundVolume + '%</span></div>');
    }
    if (settings.glassMorphism) items.push('<div class="fan-pv-item"><span class="fan-pv-icon">🔮</span><span class="fan-pv-label">Glass</span></div>');
    if (settings.animateButtons) items.push('<div class="fan-pv-item"><span class="fan-pv-icon">👆</span><span class="fan-pv-label">อนิเมชัน</span></div>');
    return items.join('');
  }

  /* ═══════ Update controls state ═══════ */
  function updateControls(host, settings) {
    if (!host) return;
    var preset = PRESETS[settings.preset] || PRESETS[DEFAULT_SETTINGS.preset];
    var scene = SCENES[settings.emojiScene] || SCENES[DEFAULT_SETTINGS.emojiScene];
    var palette = buildPalette(settings);
    var colors = getEffectiveColors(settings);

    var heroTitle = host.querySelector('[data-role="hero-title"]');
    var heroSub = host.querySelector('[data-role="hero-sub"]');
    var sceneChip = host.querySelector('[data-role="scene-chip"]');
    if (heroTitle) heroTitle.textContent = preset.name + ' · ' + scene.name;
    if (heroSub) heroSub.textContent = preset.subtitle;
    if (sceneChip) sceneChip.textContent = scene.icon + ' ' + scene.name;

    var preview = host.querySelector('.fan-theme-preview');
    if (preview) {
      preview.style.setProperty('--fan-preview-gradient', palette.cssVars['--fan-preview-gradient']);
      var pvBody = host.querySelector('.fan-pv-body');
      if (pvBody) pvBody.innerHTML = buildPreviewHTML(settings);
    }

    // active states
    host.querySelectorAll('[data-preset]').forEach(function(b) { b.classList.toggle('is-active', b.getAttribute('data-preset') === settings.preset); });
    host.querySelectorAll('[data-scene]').forEach(function(b) { b.classList.toggle('is-active', b.getAttribute('data-scene') === settings.emojiScene); });
    host.querySelectorAll('[data-motion]').forEach(function(b) { b.classList.toggle('is-active', b.getAttribute('data-motion') === settings.motion); });
    host.querySelectorAll('[data-sound-style]').forEach(function(b) { b.classList.toggle('is-active', b.getAttribute('data-sound-style') === settings.soundStyle); });

    // ranges
    var dI = host.querySelector('[data-range="density"]');
    var sI = host.querySelector('[data-range="size"]');
    var dV = host.querySelector('[data-role="density-value"]');
    var sV = host.querySelector('[data-role="size-value"]');
    if (dI) dI.value = String(settings.density);
    if (sI) sI.value = String(settings.size);
    if (dV) dV.textContent = settings.density + ' ชิ้น';
    if (sV) sV.textContent = settings.size.toFixed(2) + 'x';

    var volInput = host.querySelector('[data-range="soundVolume"]');
    var volVal = host.querySelector('[data-role="volume-value"]');
    if (volInput) volInput.value = String(settings.soundVolume);
    if (volVal) volVal.textContent = settings.soundVolume + '%';

    // toggle switches
    UI_TOGGLES.forEach(function(t) {
      var inp = host.querySelector('[data-toggle="' + t.id + '"]');
      if (inp) inp.checked = !!settings[t.id];
    });
    var sndSwitch = host.querySelector('[data-toggle="soundEnabled"]');
    if (sndSwitch) sndSwitch.checked = !!settings.soundEnabled;

    // sync switch
    var syncState = loadSyncState();
    var syncSwitch = host.querySelector('[data-toggle="syncEnabled"]');
    if (syncSwitch) syncSwitch.checked = syncState.enabled;

    // color inputs
    COLOR_FIELDS.forEach(function(f) {
      var inp = host.querySelector('[data-color="' + f.id + '"]');
      var badge = host.querySelector('[data-color-badge="' + f.id + '"]');
      var card = host.querySelector('[data-color-card="' + f.id + '"]');
      var eff = colors[f.id];
      var custom = Boolean(settings.colors[f.id]);
      if (inp) inp.value = eff;
      if (badge) badge.textContent = custom ? 'custom' : 'preset';
      if (card) card.classList.toggle('is-custom', custom);
    });
  }

  /* ═══════ Horizontal slider builder ═══════ */
  function buildSlider(id, items) {
    return '<div class="fan-slider-wrap" data-slider="' + id + '">' +
      '<button class="fan-slider-arrow fan-slider-arrow-left" data-slider-arrow="' + id + '" data-dir="-1" type="button" aria-label="เลื่อนซ้าย">‹</button>' +
      '<div class="fan-slider-track" data-slider-track="' + id + '">' + items + '</div>' +
      '<button class="fan-slider-arrow fan-slider-arrow-right" data-slider-arrow="' + id + '" data-dir="1" type="button" aria-label="เลื่อนขวา">›</button>' +
    '</div>';
  }

  /* ═══════ Collapsible section builder ═══════ */
  function buildCollapsible(titleHTML, bodyHTML, startCollapsed) {
    return '<div class="fan-collapsible' + (startCollapsed ? ' is-collapsed' : '') + '">' +
      '<button class="fan-collapse-btn" type="button">' + titleHTML +
        '<span class="fan-collapse-icon">' + (startCollapsed ? '▼' : '▲') + '</span>' +
      '</button>' +
      '<div class="fan-collapse-body">' + bodyHTML + '</div>' +
    '</div>';
  }

  /* ═══════ Build controls markup ═══════ */
  function buildControlsMarkup(pageId, pageLabel) {
    var syncState = loadSyncState();

    var presetItems = Object.entries(PRESETS).map(function(e) {
      return '<button class="fan-preset-btn" type="button" data-preset="' + e[0] + '">' +
        '<div class="fan-preset-swatch" style="--swatch:' + e[1].swatch + '"></div>' +
        '<div class="fan-option-title">' + e[1].name + '</div>' +
        '<div class="fan-option-copy">' + e[1].subtitle + '</div>' +
      '</button>';
    }).join('');

    var sceneItems = Object.entries(SCENES).map(function(e) {
      return '<button class="fan-scene-btn" type="button" data-scene="' + e[0] + '">' +
        '<span class="fan-option-icon">' + e[1].icon + '</span>' +
        '<span class="fan-option-title">' + e[1].name + '</span>' +
        '<span class="fan-option-copy">' + (e[1].emojis.slice(0, 3).join(' ') || 'พื้นหลังนิ่ง') + '</span>' +
      '</button>';
    }).join('');

    var motionItems = Object.entries(MOTIONS).map(function(e) {
      return '<button class="fan-motion-btn" type="button" data-motion="' + e[0] + '">' +
        '<span class="fan-option-icon">' + e[1].icon + '</span>' +
        '<span class="fan-option-title">' + e[1].name + '</span>' +
        '<span class="fan-option-copy">' + e[1].cat + '</span>' +
      '</button>';
    }).join('');

    var soundItems = Object.entries(SOUND_STYLES).map(function(e) {
      return '<button class="fan-sound-btn" type="button" data-sound-style="' + e[0] + '">' +
        '<span class="fan-option-icon">' + e[1].icon + '</span>' +
        '<span class="fan-option-title">' + e[1].name + '</span>' +
        '<span class="fan-option-copy">' + e[1].desc + '</span>' +
      '</button>';
    }).join('');

    // UI toggles – first 6 shown, rest in collapsible
    var toggleCards = UI_TOGGLES.map(function(t) {
      return '<div class="fan-toggle-card">' +
        '<div class="fan-toggle-copy">' +
          '<span class="fan-toggle-title">' + t.icon + ' ' + t.label + '</span>' +
          '<span class="fan-toggle-sub">' + t.desc + '</span>' +
        '</div>' +
        '<label class="fan-switch"><input type="checkbox" data-toggle="' + t.id + '"><span class="fan-switch-ui"></span></label>' +
      '</div>';
    });
    var visibleToggles = toggleCards.slice(0, 6).join('');
    var hiddenToggles = toggleCards.slice(6).join('');

    return '<div class="fan-theme-editor">' +

      /* Hero */
      '<section class="fan-theme-hero">' +
        '<div>' +
          '<div class="fan-theme-kicker-row">' +
            '<span class="fan-theme-kicker">Theme Studio</span>' +
            '<span class="fan-theme-page-badge">' + (pageLabel || PAGE_LABELS[pageId] || '') + '</span>' +
          '</div>' +
          '<h3 class="fan-theme-hero-title" data-role="hero-title"></h3>' +
          '<p class="fan-theme-hero-sub" data-role="hero-sub"></p>' +
          '<div class="fan-theme-sync-row">' +
            '<div class="fan-theme-sync-copy-wrap">' +
              '<div class="fan-theme-mini-title">🔗 ซิงค์ข้ามหน้า</div>' +
              '<div class="fan-theme-mini-copy">เปิดเพื่อให้ธีมเหมือนกันทุกหน้า</div>' +
            '</div>' +
            '<label class="fan-switch"><input type="checkbox" data-toggle="syncEnabled" ' + (syncState.enabled ? 'checked' : '') + '><span class="fan-switch-ui"></span></label>' +
          '</div>' +
        '</div>' +
        '<div class="fan-theme-preview">' +
          '<div class="fan-theme-preview-card"></div>' +
          '<div class="fan-theme-preview-bubble fan-theme-preview-bubble-bot"></div>' +
          '<div class="fan-theme-preview-bubble fan-theme-preview-bubble-user"></div>' +
          '<div class="fan-theme-preview-chip" data-role="scene-chip"></div>' +
          '<div class="fan-pv-body"></div>' +
        '</div>' +
      '</section>' +

      /* Presets */
      '<section class="fan-theme-section">' +
        '<div class="fan-theme-section-head">' +
          '<div><div class="fan-theme-section-title">พรีเซ็ตหลัก</div>' +
          '<div class="fan-theme-section-copy">เลือก mood หลักก่อน แล้วค่อยขยับสีเองเพิ่มถ้าต้องการ</div></div>' +
          '<button class="fan-theme-inline-btn" type="button" data-action="clear-colors">ล้างสี custom</button>' +
        '</div>' +
        '<div class="fan-preset-grid">' + presetItems + '</div>' +
      '</section>' +

      /* Emoji Scenes – horizontal slider */
      '<section class="fan-theme-section">' +
        '<div class="fan-theme-section-head">' +
          '<div><div class="fan-theme-section-title">พื้นหลัง Emoji</div>' +
          '<div class="fan-theme-section-copy">เลือก pattern และความหนาแน่นไว้ล่วงหน้าได้ พอเปิดสวิตช์ก็ใช้งานทันที</div></div>' +
        '</div>' +
        buildSlider('scenes', sceneItems) +
        '<div class="fan-range-grid">' +
          '<div class="fan-range-card">' +
            '<div class="fan-range-head"><span class="fan-range-name">ความหนาแน่น</span><span class="fan-range-value" data-role="density-value"></span></div>' +
            '<input class="fan-range-input" type="range" min="8" max="32" step="1" value="18" data-range="density">' +
            '<div class="fan-range-copy">เพิ่มหรือลดจำนวน emoji ด้านหลัง UI</div>' +
          '</div>' +
          '<div class="fan-range-card">' +
            '<div class="fan-range-head"><span class="fan-range-name">ขนาด Emoji</span><span class="fan-range-value" data-role="size-value"></span></div>' +
            '<input class="fan-range-input" type="range" min="0.75" max="1.75" step="0.05" value="1" data-range="size">' +
            '<div class="fan-range-copy">ทำให้พื้นหลังดูฟุ้งเบาหรือเด่นขึ้น</div>' +
          '</div>' +
        '</div>' +
      '</section>' +

      /* Motion Styles – horizontal slider */
      '<section class="fan-theme-section">' +
        '<div class="fan-theme-section-head">' +
          '<div><div class="fan-theme-section-title">สไตล์การเคลื่อนไหว</div>' +
          '<div class="fan-theme-section-copy">ตั้ง motion ล่วงหน้าไว้ได้ แม้ตอนนี้จะยังปิด emoji พื้นหลังก็ตาม</div></div>' +
        '</div>' +
        buildSlider('motions', motionItems) +
      '</section>' +

      /* UI Toggles – collapsible */
      '<section class="fan-theme-section">' +
        '<div class="fan-theme-section-head">' +
          '<div><div class="fan-theme-section-title">บรรยากาศและกรอบ UI</div>' +
          '<div class="fan-theme-section-copy">สั่งเปิดปิด emoji, ความเบลอ และเส้นขอบ UI ได้แยกกัน</div></div>' +
        '</div>' +
        '<div class="fan-toggle-grid">' + visibleToggles + '</div>' +
        buildCollapsible(
          '<span class="fan-collapse-title">ตัวเลือกเพิ่มเติม (' + UI_TOGGLES.slice(6).length + ' รายการ)</span>',
          '<div class="fan-toggle-grid">' + hiddenToggles + '</div>',
          true
        ) +
      '</section>' +

      /* Sound FX */
      '<section class="fan-theme-section">' +
        '<div class="fan-theme-section-head">' +
          '<div><div class="fan-theme-section-title"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/></svg> เสียงเอฟเฟกต์</div>' +
          '<div class="fan-theme-section-copy">เปิด/ปิดเสียง ปรับระดับเสียง เลือกสไตล์เสียงที่ชอบ</div></div>' +
          '<label class="fan-switch"><input type="checkbox" data-toggle="soundEnabled"><span class="fan-switch-ui"></span></label>' +
        '</div>' +
        '<div class="fan-sound-controls" data-sound-body>' +
          '<div class="fan-range-card" style="margin-bottom:10px">' +
            '<div class="fan-range-head"><span class="fan-range-name">ระดับเสียง</span><span class="fan-range-value" data-role="volume-value">50%</span></div>' +
            '<input class="fan-range-input" type="range" min="0" max="200" step="5" value="50" data-range="soundVolume">' +
            '<div class="fan-range-copy">0% = เงียบ · 100% = ปกติ · 200% = ดังสุด</div>' +
          '</div>' +
          buildCollapsible(
            '<span class="fan-collapse-title">เลือกสไตล์เสียง (' + Object.keys(SOUND_STYLES).length + ' แบบ)</span>',
            buildSlider('sounds', soundItems),
            true
          ) +
        '</div>' +
      '</section>' +

      /* Custom Colours */
      '<section class="fan-theme-section">' +
        '<div class="fan-theme-section-head">' +
          '<div><div class="fan-theme-section-title">ปรับสีเองละเอียด</div>' +
          '<div class="fan-theme-section-copy">สีที่แก้ตรงนี้จะทับ preset ทันที</div></div>' +
        '</div>' +
        '<div class="fan-color-grid">' +
          COLOR_FIELDS.map(function(f) {
            return '<label class="fan-color-card" data-color-card="' + f.id + '">' +
              '<div class="fan-color-head"><span class="fan-color-name">' + f.label + '</span><span class="fan-color-badge" data-color-badge="' + f.id + '">preset</span></div>' +
              '<input class="fan-color-input" type="color" data-color="' + f.id + '" value="#ffffff">' +
            '</label>';
          }).join('') +
        '</div>' +
        '<div class="fan-theme-actions">' +
          '<button class="fan-theme-reset-btn" type="button" data-action="reset-all">รีเซ็ตทุกอย่างกลับค่าเดิม</button>' +
        '</div>' +
      '</section>' +

    '</div>';
  }

  /* ═══════ Bind controls ═══════ */
  function bindControls(controller) {
    var host = controller.controlsHost;
    if (!host || host.dataset.themeBound === '1') return;
    host.dataset.themeBound = '1';

    // Slider arrows
    host.querySelectorAll('.fan-slider-arrow').forEach(function(btn) {
      btn.addEventListener('click', function() {
        var id = btn.getAttribute('data-slider-arrow');
        var dir = parseInt(btn.getAttribute('data-dir'), 10);
        var track = host.querySelector('[data-slider-track="' + id + '"]');
        if (track) track.scrollBy({ left: dir * 200, behavior: 'smooth' });
        playSoundFX(controller.settings);
      });
    });

    // Slider wheel → horizontal scroll
    host.querySelectorAll('.fan-slider-track').forEach(function(track) {
      track.addEventListener('wheel', function(e) {
        if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
          e.preventDefault();
          track.scrollBy({ left: e.deltaY > 0 ? 120 : -120 });
        }
      }, { passive: false });
    });

    // Collapsible sections
    host.querySelectorAll('.fan-collapse-btn').forEach(function(btn) {
      btn.addEventListener('click', function() {
        var wrap = btn.closest('.fan-collapsible');
        if (wrap) {
          wrap.classList.toggle('is-collapsed');
          var icon = btn.querySelector('.fan-collapse-icon');
          if (icon) icon.textContent = wrap.classList.contains('is-collapsed') ? '▼' : '▲';
        }
        playSoundFX(controller.settings);
      });
    });

    // Click delegation
    host.addEventListener('click', function(e) {
      var target = e.target instanceof Element
        ? e.target.closest('[data-preset],[data-scene],[data-motion],[data-sound-style],[data-action]')
        : null;
      if (!target) return;
      playSoundFX(controller.settings);

      if (target.hasAttribute('data-preset')) {
        updateControllerSettings(controller, { preset: target.getAttribute('data-preset') }, { source: 'preset' });
        return;
      }
      if (target.hasAttribute('data-scene')) {
        updateControllerSettings(controller, { emojiScene: target.getAttribute('data-scene') }, { source: 'scene' });
        return;
      }
      if (target.hasAttribute('data-motion')) {
        updateControllerSettings(controller, { motion: target.getAttribute('data-motion') }, { source: 'motion' });
        return;
      }
      if (target.hasAttribute('data-sound-style')) {
        updateControllerSettings(controller, { soundStyle: target.getAttribute('data-sound-style') }, { source: 'sound' });
        var tempSettings = deepClone(controller.settings);
        tempSettings.soundEnabled = true;
        tempSettings.soundStyle = target.getAttribute('data-sound-style');
        playSoundFX(tempSettings);
        return;
      }
      var action = target.getAttribute('data-action');
      if (action === 'clear-colors') {
        updateControllerSettings(controller, { clearColors: true }, { source: 'clear-colors' });
      } else if (action === 'reset-all') {
        if (window.confirm('รีเซ็ตธีม สี และพื้นหลังกลับค่าเดิมทั้งหมด?')) {
          commitSettings(controller, sanitizeSettings(null, controller.options.legacyPreset), { source: 'reset' });
        }
      }
    });

    // Input delegation (ranges, colors)
    host.addEventListener('input', function(e) {
      var t = e.target;
      if (!(t instanceof HTMLInputElement)) return;
      var colorId = t.getAttribute('data-color');
      if (colorId) { updateControllerSettings(controller, { colors: { [colorId]: t.value } }, { source: 'color' }); return; }
      var range = t.getAttribute('data-range');
      if (range === 'density') { updateControllerSettings(controller, { density: t.value }, { source: 'density' }); return; }
      if (range === 'size') { updateControllerSettings(controller, { size: t.value }, { source: 'size' }); return; }
      if (range === 'soundVolume') { updateControllerSettings(controller, { soundVolume: t.value }, { source: 'volume' }); return; }
    });

    // Change delegation for toggle switches
    host.addEventListener('change', function(e) {
      var t = e.target;
      if (!(t instanceof HTMLInputElement) || t.type !== 'checkbox') return;
      var toggleId = t.getAttribute('data-toggle');
      if (!toggleId) return;
      playSoundFX(controller.settings);

      if (toggleId === 'syncEnabled') { handleSyncToggle(controller, t.checked); return; }
      if (toggleId === 'soundEnabled') { updateControllerSettings(controller, { soundEnabled: t.checked }, { source: 'toggle' }); return; }
      var found = UI_TOGGLES.find(function(u) { return u.id === toggleId; });
      if (found) {
        var patch = {};
        patch[toggleId] = t.checked;
        updateControllerSettings(controller, patch, { source: 'toggle' });
      }
    });
  }

  /* ═══════ Sync handler ═══════ */
  function handleSyncToggle(controller, nextEnabled) {
    var syncState = loadSyncState();
    if (nextEnabled) {
      var leader = window.confirm(
        'กดตกลง → ใช้ "' + (controller.pageLabel || controller.pageId) + '" เป็นตัวนำ\nกดยกเลิก → ใช้อีกหน้าเป็นตัวนำ'
      );
      var leaderPage = leader ? controller.pageId : (controller.pageId === 'main' ? 'chat' : 'main');
      syncState.enabled = true;
      syncState.leader = leaderPage;
      syncState.updatedAt = Date.now();
      saveSyncState(syncState);
      var leaderSettings = loadPageSettings(leaderPage, controller.options.legacyPreset);
      PAGE_IDS.forEach(function(pid) { savePageSettings(pid, leaderSettings); });
      controller.settings = deepClone(leaderSettings);
      applyController(controller, controller.settings, { source: 'sync' });
    } else {
      syncState.enabled = false;
      syncState.leader = '';
      syncState.updatedAt = Date.now();
      saveSyncState(syncState);
    }
    if (controller.controlsHost) updateControls(controller.controlsHost, controller.settings);
  }

  /* ═══════ Apply controller ═══════ */
  function applyController(controller, settings, meta) {
    var palette = buildPalette(settings);
    Object.entries(palette.cssVars).forEach(function(e) {
      document.documentElement.style.setProperty(e[0], e[1]);
    });
    document.body.removeAttribute('data-theme');
    document.body.dataset.fanPreset = settings.preset;
    document.body.dataset.fanScene = settings.emojiScene;
    document.body.dataset.fanMotion = settings.motion;
    document.body.dataset.fanEmoji = settings.emojiEnabled ? '1' : '0';
    document.body.dataset.fanBorders = settings.showBorders ? '1' : '0';
    document.body.dataset.fanGlass = settings.glassMorphism ? '1' : '0';
    document.body.dataset.fanAnimate = settings.animateButtons ? '1' : '0';
    document.body.dataset.fanSmooth = settings.smoothScroll ? '1' : '0';

    updateMetaTheme(controller.metaTheme, palette.metaColor);

    var src = meta && meta.source ? meta.source : 'update';
    var shouldRender = ['init', 'scene', 'density', 'size', 'storage', 'reset', 'resize', 'sync', 'toggle'].indexOf(src) !== -1;
    if (controller.backgroundHost && shouldRender) {
      renderBackdrop(controller.backgroundHost, settings);
    } else if (controller.backgroundHost) {
      controller.backgroundHost.dataset.scene = settings.emojiScene;
      controller.backgroundHost.dataset.motion = settings.motion;
      controller.backgroundHost.classList.toggle('is-empty', !settings.emojiEnabled || settings.emojiScene === 'none');
    }
    if (controller.controlsHost) updateControls(controller.controlsHost, settings);
  }

  /* ═══════ Commit settings ═══════ */
  function commitSettings(controller, settings, meta) {
    var next = sanitizeSettings(settings, meta && meta.legacyPreset);
    var syncState = loadSyncState();
    if (syncState.enabled) {
      PAGE_IDS.forEach(function(pid) { savePageSettings(pid, next); });
    } else {
      savePageSettings(controller.pageId, next);
    }
    controllers.forEach(function(ctrl) {
      ctrl.settings = deepClone(next);
      applyController(ctrl, ctrl.settings, meta || { source: 'update' });
      if (typeof ctrl.options.onChange === 'function') {
        ctrl.options.onChange(deepClone(ctrl.settings), meta || { source: 'update' });
      }
    });
  }

  function updateControllerSettings(controller, patch, meta) {
    var current = loadPageSettings(controller.pageId, controller.options.legacyPreset);
    var next = mergeSettings(current, patch, controller.options.legacyPreset);
    commitSettings(controller, next, Object.assign({}, meta || {}, { legacyPreset: controller.options.legacyPreset }));
  }

  /* ═══════ Create Controller ═══════ */
  function createController(options) {
    var opts = options || {};
    var pageId = resolvePageId(opts.pageId);
    var pageLabel = opts.pageLabel || PAGE_LABELS[pageId] || '';

    var controller = {
      id: 'fan-theme-' + (++controllerCount),
      pageId: pageId,
      pageLabel: pageLabel,
      options: opts,
      controlsHost: resolveElement(opts.controlsHost),
      backgroundHost: resolveElement(opts.backgroundHost),
      metaTheme: opts.metaTheme || document.querySelector('meta[name="theme-color"]'),
      settings: loadPageSettings(pageId, opts.legacyPreset),
      resizeFrame: null,
      handleStorage: null,
      handleResize: null
    };

    if (controller.controlsHost) {
      controller.controlsHost.innerHTML = buildControlsMarkup(pageId, pageLabel);
      bindControls(controller);
    }
    controllers.add(controller);
    applyController(controller, controller.settings, { source: 'init' });

    controller.handleStorage = function(e) {
      if (e.key && (e.key.indexOf(PAGE_STORAGE_PREFIX) === 0 || e.key === SYNC_STORAGE_KEY)) {
        controller.settings = loadPageSettings(controller.pageId, controller.options.legacyPreset);
        applyController(controller, controller.settings, { source: 'storage' });
        if (typeof controller.options.onChange === 'function') {
          controller.options.onChange(deepClone(controller.settings), { source: 'storage' });
        }
      }
    };
    controller.handleResize = function() {
      if (!controller.backgroundHost) return;
      if (controller.resizeFrame) cancelAnimationFrame(controller.resizeFrame);
      controller.resizeFrame = requestAnimationFrame(function() {
        renderBackdrop(controller.backgroundHost, controller.settings);
        controller.resizeFrame = null;
      });
    };

    window.addEventListener('storage', controller.handleStorage);
    window.addEventListener('resize', controller.handleResize);

    return {
      getSettings: function() { return deepClone(controller.settings); },
      setPreset: function(preset) { updateControllerSettings(controller, { preset: mapLegacyPreset(preset) }, { source: 'preset' }); },
      render: function() { controller.settings = loadPageSettings(controller.pageId, controller.options.legacyPreset); applyController(controller, controller.settings); },
      reset: function() { commitSettings(controller, sanitizeSettings(null, controller.options.legacyPreset), { source: 'reset', legacyPreset: controller.options.legacyPreset }); },
      playSound: function() { playSoundFX(controller.settings); },
      destroy: function() { controllers.delete(controller); window.removeEventListener('storage', controller.handleStorage); window.removeEventListener('resize', controller.handleResize); }
    };
  }

  /* ═══════ Extra motion keyframes injection ═══════ */
  (function injectExtraMotions() {
    var style = document.createElement('style');
    style.textContent = [
      '@keyframes fanEmojiZigzag{0%,100%{transform:translate3d(0,0,0) scale(.9)}25%{transform:translate3d(var(--drift-x),calc(var(--drift-y)*-.3),0) scale(1.05)}50%{transform:translate3d(calc(var(--drift-x)*-0.5),calc(var(--drift-y)*-.6),0) rotate(var(--rotate)) scale(1.1)}75%{transform:translate3d(var(--drift-x),calc(var(--drift-y)*-.8),0) scale(.95)}}',
      '@keyframes fanEmojiSpiral{0%{transform:rotate(0deg) translate(0) scale(.88)}25%{transform:rotate(90deg) translateX(calc(var(--drift-x)*.5)) scale(1)}50%{transform:rotate(180deg) translateY(calc(var(--drift-y)*-.5)) scale(1.1)}75%{transform:rotate(270deg) translateX(calc(var(--drift-x)*-.5)) scale(1)}100%{transform:rotate(360deg) translate(0) scale(.88)}}',
      '@keyframes fanEmojiRain{0%{transform:translate3d(0,-20px,0) scale(.9);opacity:0}20%{opacity:var(--opacity)}80%{opacity:var(--opacity)}100%{transform:translate3d(calc(var(--drift-x)*.3),calc(var(--drift-y)*1.2),0) scale(.85);opacity:0}}',
      '@keyframes fanEmojiWave{0%,100%{transform:translate3d(0,0,0) rotate(0) scale(.92)}25%{transform:translate3d(calc(var(--drift-x)*.4),8px,0) rotate(calc(var(--rotate)*.25)) scale(1)}50%{transform:translate3d(var(--drift-x),0,0) rotate(calc(var(--rotate)*.5)) scale(1.08)}75%{transform:translate3d(calc(var(--drift-x)*.6),-8px,0) rotate(calc(var(--rotate)*.75)) scale(1)}}',
      '@keyframes fanEmojiPulse{0%,100%{transform:scale(.85);opacity:calc(var(--opacity)*.6)}50%{transform:scale(1.15);opacity:var(--opacity)}}',
      '@keyframes fanEmojiShake{0%,100%{transform:translate3d(0,0,0)}10%{transform:translate3d(-4px,2px,0)}20%{transform:translate3d(4px,-2px,0)}30%{transform:translate3d(-6px,4px,0) rotate(-2deg)}40%{transform:translate3d(6px,-4px,0) rotate(2deg)}50%{transform:translate3d(-4px,6px,0)}60%{transform:translate3d(4px,-6px,0)}70%{transform:translate3d(-2px,4px,0)}80%{transform:translate3d(2px,-4px,0)}90%{transform:translate3d(-2px,2px,0)}}',
      '@keyframes fanEmojiTwinkle{0%,100%{opacity:calc(var(--opacity)*.3);transform:scale(.8)}50%{opacity:var(--opacity);transform:scale(1.2)}}',
      '@keyframes fanEmojiSwing{0%,100%{transform:rotate(-15deg) scale(.95)}50%{transform:rotate(15deg) scale(1.05)}}',
      '@keyframes fanEmojiPop{0%,100%{transform:scale(0);opacity:0}15%{transform:scale(1.3);opacity:var(--opacity)}30%{transform:scale(.9)}45%{transform:scale(1.05)}60%,90%{transform:scale(1);opacity:var(--opacity)}95%{opacity:0}}',
      '@keyframes fanEmojiMatrix{0%{transform:translate3d(0,-30px,0) scale(.8);opacity:0}10%{opacity:var(--opacity)}90%{opacity:var(--opacity)}100%{transform:translate3d(0,calc(var(--drift-y)*1.5),0) scale(.8);opacity:0}}',
      '@keyframes fanEmojiButterfly{0%,100%{transform:translate3d(0,0,0) rotate(0) scaleX(1)}25%{transform:translate3d(calc(var(--drift-x)*.5),calc(var(--drift-y)*-.25),0) rotate(10deg) scaleX(.6)}50%{transform:translate3d(var(--drift-x),calc(var(--drift-y)*-.5),0) rotate(-10deg) scaleX(1)}75%{transform:translate3d(calc(var(--drift-x)*.5),calc(var(--drift-y)*-.75),0) rotate(10deg) scaleX(.6)}}',
      '@keyframes fanEmojiHeartbeat{0%,100%{transform:scale(1)}14%{transform:scale(1.3)}28%{transform:scale(1)}42%{transform:scale(1.15)}56%{transform:scale(1)}}',
      '@keyframes fanEmojiGlitch{0%,100%{transform:translate(0) skew(0)}20%{transform:translate(-3px,2px) skew(-2deg)}40%{transform:translate(3px,-2px) skew(3deg)}60%{transform:translate(-2px,-3px) skew(-1deg)}80%{transform:translate(2px,3px) skew(2deg)}}',
      '@keyframes fanEmojiTornado{0%{transform:rotate(0) translate(0) scale(.8)}25%{transform:rotate(90deg) translateX(calc(var(--drift-x)*.8)) scale(1)}50%{transform:rotate(180deg) translate(0) scale(1.2)}75%{transform:rotate(270deg) translateX(calc(var(--drift-x)*-.8)) scale(1)}100%{transform:rotate(360deg) translate(0) scale(.8)}}',
      '@keyframes fanEmojiExplosion{0%{transform:translate(0) scale(0);opacity:0}20%{transform:translate(0) scale(1.5);opacity:var(--opacity)}40%{transform:translate3d(var(--drift-x),calc(var(--drift-y)*-1),0) scale(1);opacity:var(--opacity)}100%{transform:translate3d(calc(var(--drift-x)*1.5),calc(var(--drift-y)*-1.5),0) scale(.5);opacity:0}}',
      '@keyframes fanEmojiMeteor{0%{transform:translate3d(calc(var(--drift-x)*-1),calc(var(--drift-y)*-1),0) rotate(-45deg) scale(.6);opacity:0}30%{opacity:var(--opacity)}70%{opacity:var(--opacity)}100%{transform:translate3d(var(--drift-x),var(--drift-y),0) rotate(-45deg) scale(1.2);opacity:0}}',
      '@keyframes fanEmojiElastic{0%,100%{transform:scaleX(1) scaleY(1)}25%{transform:scaleX(1.25) scaleY(.75)}50%{transform:scaleX(.9) scaleY(1.1)}75%{transform:scaleX(1.1) scaleY(.9)}}',
      '@keyframes fanEmojiConfetti{0%{transform:translate(0) rotate(0) scale(0);opacity:0}20%{opacity:var(--opacity);transform:scale(1.1)}100%{transform:translate3d(var(--drift-x),var(--drift-y),0) rotate(calc(var(--rotate)*2)) scale(.7);opacity:0}}',
      '@keyframes fanEmojiSnowFall{0%{transform:translate3d(0,-20px,0) rotate(0);opacity:0}10%{opacity:var(--opacity)}90%{opacity:var(--opacity)}100%{transform:translate3d(calc(var(--drift-x)*.5),calc(var(--drift-y)*1.5),0) rotate(var(--rotate));opacity:0}}',
      '@keyframes fanEmojiDisco{0%,100%{transform:scale(1) rotate(0);filter:brightness(1)}25%{transform:scale(1.2) rotate(90deg);filter:brightness(1.3)}50%{transform:scale(.8) rotate(180deg);filter:brightness(.7)}75%{transform:scale(1.1) rotate(270deg);filter:brightness(1.2)}}',
      '@keyframes fanEmojiFirefly{0%,100%{opacity:.2;transform:translate(0) scale(.8)}30%{opacity:var(--opacity);transform:translate3d(calc(var(--drift-x)*.3),calc(var(--drift-y)*-.3),0) scale(1.1)}60%{opacity:.3;transform:translate3d(calc(var(--drift-x)*.6),calc(var(--drift-y)*-.1),0) scale(.9)}}'
    ].join('\n');
    document.head.appendChild(style);

    var motionCSS = document.createElement('style');
    var motionMap = {
      zigzag:'fanEmojiZigzag', spiral:'fanEmojiSpiral', rain:'fanEmojiRain',
      wave:'fanEmojiWave', pulse:'fanEmojiPulse', shake:'fanEmojiShake',
      twinkle:'fanEmojiTwinkle', swing:'fanEmojiSwing', pop:'fanEmojiPop',
      matrix:'fanEmojiMatrix', butterfly:'fanEmojiButterfly', heartbeat:'fanEmojiHeartbeat',
      glitch:'fanEmojiGlitch', tornado:'fanEmojiTornado', explosion:'fanEmojiExplosion',
      meteor:'fanEmojiMeteor', elastic:'fanEmojiElastic', confetti:'fanEmojiConfetti',
      snow_fall:'fanEmojiSnowFall', disco:'fanEmojiDisco', firefly:'fanEmojiFirefly'
    };
    motionCSS.textContent = Object.entries(motionMap).map(function(e) {
      return '.fan-theme-backdrop[data-motion="' + e[0] + '"] .fan-theme-emoji{animation-name:' + e[1] + '}';
    }).join('\n');
    document.head.appendChild(motionCSS);
  })();

  /* ═══════ Public API ═══════ */
  window.FANTheme = {
    LEGACY_STORAGE_KEY: LEGACY_STORAGE_KEY,
    PAGE_STORAGE_PREFIX: PAGE_STORAGE_PREFIX,
    SYNC_STORAGE_KEY: SYNC_STORAGE_KEY,
    PAGE_IDS: PAGE_IDS,
    PAGE_LABELS: PAGE_LABELS,
    PRESETS: PRESETS,
    SCENES: SCENES,
    MOTIONS: MOTIONS,
    SOUND_STYLES: SOUND_STYLES,
    COLOR_FIELDS: COLOR_FIELDS,
    UI_TOGGLES: UI_TOGGLES,
    createController: createController,
    getSettings: function(pageId) {
      return loadPageSettings(resolvePageId(pageId || FALLBACK_PAGE_ID), '');
    },
    getSyncState: function() { return loadSyncState(); },
    mapLegacyPreset: mapLegacyPreset
  };

})();
