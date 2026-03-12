/* ══════════════════════════════════════════════════════════════
   FAN v2.0 – บีม ❤️ เนย  ·  app.js
   ══════════════════════════════════════════════════════════════ */

// ═══════ ตั้งค่าวันเกิดและวันครบรอบ ═══════
const BEAM_BIRTHDAY = new Date(2004, 9, 28);  // 28 ตุลาคม ค.ศ. 2004 / พ.ศ. 2547 (วันพฤหัสบดี) ✅
const NOEY_BIRTHDAY = new Date(2007, 11, 12); // 12 ธันวาคม ค.ศ. 2007 / พ.ศ. 2550 (วันพุธ)    ✅
const ANNIVERSARY   = new Date(2023, 0, 7);   // 7 มกราคม  ค.ศ. 2023 / พ.ศ. 2566 (วันเสาร์)   ✅

const THAI_M = ['มกราคม','กุมภาพันธ์','มีนาคม','เมษายน','พฤษภาคม','มิถุนายน',
  'กรกฎาคม','สิงหาคม','กันยายน','ตุลาคม','พฤศจิกายน','ธันวาคม'];
const THAI_D = ['อาทิตย์','จันทร์','อังคาร','พุธ','พฤหัสบดี','ศุกร์','เสาร์'];

let currentView = null; // 'beam' | 'noey' | 'anniv'
let tickId = null;
let prevValues = {};
let themeController = null;

// ═══════ การคำนวณที่แม่นยำ 100% ═══════

function exactDiff(from, to) {
  let y = to.getFullYear() - from.getFullYear();
  let m = to.getMonth()    - from.getMonth();
  let d = to.getDate()     - from.getDate();
  if (d < 0) { m--; d += new Date(to.getFullYear(), to.getMonth(), 0).getDate(); }
  if (m < 0) { y--; m += 12; }
  return { years: y, months: m, days: d };
}

function totalDays(from, now)    { return Math.floor((now - from) / 86400000); }
function totalHours(from, now)   { return Math.floor((now - from) / 3600000); }
function totalMinutes(from, now) { return Math.floor((now - from) / 60000); }
function totalSeconds(from, now) { return Math.floor((now - from) / 1000); }

function nextOccurrence(base, now) {
  const thisYr = new Date(now.getFullYear(), base.getMonth(), base.getDate());
  if (now.getTime() < thisYr.getTime()) return thisYr;
  if (sameDay(now, thisYr)) return thisYr;
  return new Date(now.getFullYear() + 1, base.getMonth(), base.getDate());
}
function sameDay(a, b) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}
function countdown(target, now) {
  const d = target.getTime() - now.getTime();
  if (d <= 0) return { d: 0, h: 0, m: 0, s: 0 };
  return { d: Math.floor(d/864e5), h: Math.floor(d%864e5/36e5), m: Math.floor(d%36e5/6e4), s: Math.floor(d%6e4/1e3) };
}

// ═══════ ยูทิลิตี้ ═══════
const fmt = n => Number(n).toLocaleString('th-TH');
const pad = n => String(n).padStart(2, '0');
function thaiDate(d) { return d.getDate() + ' ' + THAI_M[d.getMonth()] + ' พ.ศ. ' + (d.getFullYear() + 543); }
function ceDate(d)   { return d.getDate() + ' ' + THAI_M[d.getMonth()] + ' ค.ศ. ' + d.getFullYear(); }

// ═══════ เสียง ═══════
const AC = window.AudioContext || window.webkitAudioContext;
let ac = null;
function playSound(freq, dur, type) {
  try {
    if (!ac) ac = new AC();
    const o = ac.createOscillator(), g = ac.createGain();
    o.connect(g); g.connect(ac.destination);
    o.type = type || 'sine'; o.frequency.value = freq;
    g.gain.setValueAtTime(0.1, ac.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + dur);
    o.start(); o.stop(ac.currentTime + dur);
  } catch(_) {}
}
const clickSound  = () => { if (!window._fanPlaySoundFX || !window._fanPlaySoundFX('click'))    playSound(800,  0.08, 'sine'); };
const switchSound = () => { if (!window._fanPlaySoundFX || !window._fanPlaySoundFX('navigate')) playSound(600,  0.13, 'triangle'); };

// ═══════ อนุภาค ═══════
function createParticles() {
  const c = document.getElementById('particles');
  const colors = [
    'var(--fan-particle-1)',
    'var(--fan-particle-2)',
    'var(--fan-particle-3)',
    'var(--fan-particle-4)',
    'var(--fan-particle-5)',
    'var(--fan-particle-6)'
  ];
  for (let i = 0; i < 22; i++) {
    const p = document.createElement('div');
    p.className = 'particle';
    const sz = Math.random() * 6 + 3;
    Object.assign(p.style, {
      width: sz+'px', height: sz+'px',
      left: Math.random()*100+'%',
      background: colors[Math.floor(Math.random()*colors.length)],
      animationDuration: (Math.random()*16+10)+'s',
      animationDelay: (Math.random()*12)+'s'
    });
    c.appendChild(p);
  }
}

function initThemeSettings() {
  if (!window.FANTheme) return null;
  if (!themeController) {
    themeController = window.FANTheme.createController({
      pageId: 'main',
      pageLabel: 'UI หลัก',
      controlsHost: 'fanThemeCustomizer',
      backgroundHost: 'fanThemeBackdrop'
    });
  }
  return themeController;
}

function openThemeSettings() {
  const overlay = document.getElementById('fanThemeOverlay');
  if (!overlay) return;
  const controller = initThemeSettings();
  if (controller) controller.render();
  overlay.classList.add('open');
}

function closeThemeSettings() {
  const overlay = document.getElementById('fanThemeOverlay');
  if (overlay) overlay.classList.remove('open');
}

// ═══════ Ripple ═══════
function ripple(e, el) {
  const r = document.createElement('span');
  r.className = 'ripple';
  const rect = el.getBoundingClientRect();
  const sz = Math.max(rect.width, rect.height);
  Object.assign(r.style, { width: sz+'px', height: sz+'px', left: (e.clientX-rect.left-sz/2)+'px', top: (e.clientY-rect.top-sz/2)+'px' });
  el.appendChild(r);
  r.addEventListener('animationend', () => r.remove());
}

// ═══════ นาฬิกา ═══════
function renderClock(now) {
  const time = pad(now.getHours())+':'+pad(now.getMinutes())+':'+pad(now.getSeconds());
  const wd    = 'วัน'+THAI_D[now.getDay()];
  const line1 = wd + ' ' + thaiDate(now);
  const line2 = wd + ' ' + ceDate(now);
  document.querySelectorAll('.rt-clock').forEach(el => el.textContent = time);
  document.querySelectorAll('.rt-date').forEach(el => {
    el.innerHTML = line1 + '<br><small class="date-ce-small">' + line2 + '</small>';
  });
}

// ═══════ สลับหน้าจอ ═══════
function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => {
    if (s.classList.contains('active')) { s.classList.remove('active'); s.classList.add('exit'); }
    else { s.classList.remove('exit'); }
  });
  setTimeout(() => {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('exit'));
    document.getElementById(id).classList.add('active');
    document.getElementById(id).scrollTop = 0;
  }, 100);
}

// ═══════ สถานะเครือข่าย ═══════
function updateNet() {
  document.querySelectorAll('.status-bar').forEach(bar => {
    bar.className = 'status-bar ' + (navigator.onLine ? 'online' : 'offline');
    bar.textContent = navigator.onLine ? '🟢 ออนไลน์ — อัปเดตอัตโนมัติ' : '🔴 ออฟไลน์ — ใช้ข้อมูลจากแคช';
  });
}

// ═══════ ตรวจจับค่าเปลี่ยน (สร้างเอฟเฟกต์ tick) ═══════
function tickIfChanged(key, value, el) {
  if (prevValues[key] !== undefined && prevValues[key] !== value) {
    el.classList.remove('tick');
    void el.offsetWidth; // force reflow
    el.classList.add('tick');
  }
  prevValues[key] = value;
}

// ═══════ สร้าง stat box HTML ═══════
function statHTML(icon, id, label, sub) {
  const s = sub ? `<div class="stat-sublabel">${sub}</div>` : '';
  return `<div class="stat-box"><div class="stat-icon">${icon}</div><div class="stat-value" id="${id}">-</div><div class="stat-label">${label}</div>${s}</div>`;
}

// ═══════ เรนเดอร์หน้าวันเกิด ═══════
function renderBirthday(name, emoji, birthday, themeClass, now) {
  const diff = exactDiff(birthday, now);
  const tD = totalDays(birthday, now);
  const tH = totalHours(birthday, now);
  const tM = totalMinutes(birthday, now);
  const tS = totalSeconds(birthday, now);
  const next = nextOccurrence(birthday, now);
  const cd = countdown(next, now);
  const nextAge = next.getFullYear() - birthday.getFullYear();
  const isToday = sameDay(now, new Date(now.getFullYear(), birthday.getMonth(), birthday.getDate()));
  const bdDay = 'วัน' + THAI_D[birthday.getDay()];

  const wrap = document.getElementById('statsWrap');
  wrap.className = 'stats-wrap ' + themeClass;

  wrap.innerHTML = `
    <section class="main-card">
      <div class="card-emoji"><span class="emoji-spin-fast">${isToday ? '🎉'+emoji+'🎉' : emoji}</span></div>
      <div class="card-title">${isToday ? '🎉 สุขสันต์วันเกิด '+name+'!' : 'วันเกิดของ'+name+' 🎂'}</div>

      <div class="birthday-info-block">
        <div class="bd-row">
          <span class="bd-label">📅 วันเกิด (พ.ศ.)</span>
          <span class="bd-val">${bdDay}ที่ ${thaiDate(birthday)}</span>
        </div>
        <div class="bd-row">
          <span class="bd-label">🌏 วันเกิด (ค.ศ.)</span>
          <span class="bd-val">${bdDay}ที่ ${ceDate(birthday)}</span>
        </div>
      </div>

      <div class="age-banner">
        <div class="age-main" id="stSummary">-</div>
        <div class="age-desc">⚡ อายุตอนนี้ · อัปเดตทุกวินาที</div>
      </div>

      <div class="stats-grid">
        ${statHTML('🎂','stAge','ปีเต็ม','เกิดมาแล้วกี่ขวบ')}
        ${statHTML('📆','stMonths','เดือน (ส่วนเกิน)','เดือนที่เกินจากปีเต็ม')}
        ${statHTML('📅','stDays','วัน (ส่วนเกิน)','วันที่เกินจากเดือนเต็ม')}
        ${statHTML('🗓️','stTotalD','รวมกี่วัน','นับทุกวันตั้งแต่วันเกิด')}
        ${statHTML('⏰','stTotalH','รวมกี่ชั่วโมง','นับทุกชั่วโมงตั้งแต่วันเกิด')}
        ${statHTML('⏱️','stTotalM','รวมกี่นาที','นับทุกนาทีตั้งแต่วันเกิด')}
        ${statHTML('⏲️','stTotalS','รวมกี่วินาที','นับทุกวินาทีตั้งแต่วันเกิด')}
      </div>
    </section>
    <section class="countdown-section">
      <div class="countdown-title">${isToday ? '🎊 วันนี้วันเกิด'+name+'! สุขสันต์วันเกิด! 🎊' : '⏳ นับถอยหลังวันเกิดครั้งถัดไป (อายุ '+nextAge+' ปี)'}</div>
      <div class="cd-sub">📅 ${thaiDate(next)} &nbsp;|&nbsp; 🌏 ${ceDate(next)}</div>
      <div class="countdown-boxes" style="margin-top:10px">
        <div class="cd-box"><div class="cd-val" id="cdD">-</div><div class="cd-unit">วัน</div></div>
        <div class="cd-box"><div class="cd-val" id="cdH">-</div><div class="cd-unit">ชั่วโมง</div></div>
        <div class="cd-box"><div class="cd-val" id="cdM">-</div><div class="cd-unit">นาที</div></div>
        <div class="cd-box"><div class="cd-val" id="cdS">-</div><div class="cd-unit">วินาที</div></div>
      </div>
    </section>
  `;

  fillBirthdayValues(diff, tD, tH, tM, tS, cd);
}

function fillBirthdayValues(diff, tD, tH, tM, tS, cd) {
  const ids = {stAge: diff.years, stMonths: diff.months, stDays: diff.days,
    stTotalD: fmt(tD), stTotalH: fmt(tH), stTotalM: fmt(tM), stTotalS: fmt(tS)};
  for (const [id, val] of Object.entries(ids)) {
    const el = document.getElementById(id);
    if (el) { el.textContent = val; tickIfChanged(id, String(val), el); }
  }
  const sum = document.getElementById('stSummary');
  if (sum) sum.textContent = diff.years+' ปี '+diff.months+' เดือน '+diff.days+' วัน';
  const cdEls = {cdD: cd.d, cdH: pad(cd.h), cdM: pad(cd.m), cdS: pad(cd.s)};
  for (const [id, val] of Object.entries(cdEls)) {
    const el = document.getElementById(id);
    if (el) { el.textContent = val; tickIfChanged(id, String(val), el); }
  }
}

// ═══════ เรนเดอร์หน้าวันครบรอบ ═══════
function renderAnniversary(now) {
  const diff = exactDiff(ANNIVERSARY, now);
  const tD = totalDays(ANNIVERSARY, now);
  const tH = totalHours(ANNIVERSARY, now);
  const tM = totalMinutes(ANNIVERSARY, now);
  const tS = totalSeconds(ANNIVERSARY, now);
  const next = nextOccurrence(ANNIVERSARY, now);
  const cd = countdown(next, now);
  const nextYrs = next.getFullYear() - ANNIVERSARY.getFullYear();
  const isToday = sameDay(now, new Date(now.getFullYear(), ANNIVERSARY.getMonth(), ANNIVERSARY.getDate()));

  const annivDay = 'วัน' + THAI_D[ANNIVERSARY.getDay()];
  const wrap = document.getElementById('statsWrap');
  wrap.className = 'stats-wrap theme-anniv';

  wrap.innerHTML = `
    <section class="main-card">
      <div class="card-emoji"><span class="emoji-spin-fast">💑</span></div>
      <div class="card-title">${isToday ? '🎉 ครบรอบ! ยินดีด้วยนะ! 🎉' : 'วันครบรอบของเรา 💑'}</div>

      <div class="birthday-info-block">
        <div class="bd-row">
          <span class="bd-label">📅 วันที่คบกัน (พ.ศ.)</span>
          <span class="bd-val">${annivDay}ที่ ${thaiDate(ANNIVERSARY)}</span>
        </div>
        <div class="bd-row">
          <span class="bd-label">🌏 วันที่คบกัน (ค.ศ.)</span>
          <span class="bd-val">${annivDay}ที่ ${ceDate(ANNIVERSARY)}</span>
        </div>
      </div>

      <div class="age-banner">
        <div class="age-main" id="aSummary">-</div>
        <div class="age-desc">⚡ รักกันมาแล้ว · อัปเดตทุกวินาที</div>
      </div>

      <div class="stats-grid">
        ${statHTML('💑','aYears','คบกันมากี่ปี','รักกันมาแล้วกี่ปีเต็ม')}
        ${statHTML('📆','aMonths','เดือน (ส่วนเกิน)','เดือนที่เกินจากปีเต็ม')}
        ${statHTML('📅','aDays','วัน (ส่วนเกิน)','วันที่เกินจากเดือนเต็ม')}
        ${statHTML('🗓️','aTotalD','รวมกี่วัน','นับทุกวันตั้งแต่วันที่คบกัน')}
        ${statHTML('⏰','aTotalH','รวมกี่ชั่วโมง','นับทุกชั่วโมงตั้งแต่วันที่คบกัน')}
        ${statHTML('⏱️','aTotalM','รวมกี่นาที','นับทุกนาทีตั้งแต่วันที่คบกัน')}
        ${statHTML('⏲️','aTotalS','รวมกี่วินาที','นับทุกวินาทีตั้งแต่วันที่คบกัน')}
      </div>
    </section>
    <section class="countdown-section">
      <div class="countdown-title">${isToday ? '🎊 วันนี้ครบรอบ! สุขสันต์วันครบรอบ! 🎊' : '⏳ นับถอยหลังครบรอบปีถัดไป (ปีที่ '+nextYrs+')'}</div>
      <div class="cd-sub">📅 ${thaiDate(next)} &nbsp;|&nbsp; 🌏 ${ceDate(next)}</div>
      <div class="countdown-boxes" style="margin-top:10px">
        <div class="cd-box"><div class="cd-val" id="acdD">-</div><div class="cd-unit">วัน</div></div>
        <div class="cd-box"><div class="cd-val" id="acdH">-</div><div class="cd-unit">ชั่วโมง</div></div>
        <div class="cd-box"><div class="cd-val" id="acdM">-</div><div class="cd-unit">นาที</div></div>
        <div class="cd-box"><div class="cd-val" id="acdS">-</div><div class="cd-unit">วินาที</div></div>
      </div>
    </section>
  `;

  fillAnniversaryValues(diff, tD, tH, tM, tS, cd);
}

function fillAnniversaryValues(diff, tD, tH, tM, tS, cd) {
  const ids = {aYears: diff.years, aMonths: diff.months, aDays: diff.days,
    aTotalD: fmt(tD), aTotalH: fmt(tH), aTotalM: fmt(tM), aTotalS: fmt(tS)};
  for (const [id, val] of Object.entries(ids)) {
    const el = document.getElementById(id);
    if (el) { el.textContent = val; tickIfChanged(id, String(val), el); }
  }
  const sum = document.getElementById('aSummary');
  if (sum) sum.textContent = diff.years+' ปี '+diff.months+' เดือน '+diff.days+' วัน';
  const cdEls = {acdD: cd.d, acdH: pad(cd.h), acdM: pad(cd.m), acdS: pad(cd.s)};
  for (const [id, val] of Object.entries(cdEls)) {
    const el = document.getElementById(id);
    if (el) { el.textContent = val; tickIfChanged(id, String(val), el); }
  }
}

// ═══════ Tick (ทำงานทุกวินาที) ═══════
function tick() {
  const now = new Date();
  renderClock(now);
  if (!currentView) return;

  if (currentView === 'beam') {
    const diff = exactDiff(BEAM_BIRTHDAY, now);
    const tD = totalDays(BEAM_BIRTHDAY, now), tH = totalHours(BEAM_BIRTHDAY, now);
    const tM = totalMinutes(BEAM_BIRTHDAY, now), tS = totalSeconds(BEAM_BIRTHDAY, now);
    const cd = countdown(nextOccurrence(BEAM_BIRTHDAY, now), now);
    fillBirthdayValues(diff, tD, tH, tM, tS, cd);
  } else if (currentView === 'noey') {
    const diff = exactDiff(NOEY_BIRTHDAY, now);
    const tD = totalDays(NOEY_BIRTHDAY, now), tH = totalHours(NOEY_BIRTHDAY, now);
    const tM = totalMinutes(NOEY_BIRTHDAY, now), tS = totalSeconds(NOEY_BIRTHDAY, now);
    const cd = countdown(nextOccurrence(NOEY_BIRTHDAY, now), now);
    fillBirthdayValues(diff, tD, tH, tM, tS, cd);
  } else if (currentView === 'anniv') {
    const diff = exactDiff(ANNIVERSARY, now);
    const tD = totalDays(ANNIVERSARY, now), tH = totalHours(ANNIVERSARY, now);
    const tM = totalMinutes(ANNIVERSARY, now), tS = totalSeconds(ANNIVERSARY, now);
    const cd = countdown(nextOccurrence(ANNIVERSARY, now), now);
    fillAnniversaryValues(diff, tD, tH, tM, tS, cd);
  }
}

// ═══════ Navigation ═══════
function goTo(view) {
  currentView = view;
  prevValues = {};
  const now = new Date();

  if (view === 'beam') {
    document.getElementById('statsTitle').textContent = 'บีม 👦';
    renderBirthday('บีม', '🎂', BEAM_BIRTHDAY, 'theme-beam', now);
  } else if (view === 'noey') {
    document.getElementById('statsTitle').textContent = 'เนย 👧';
    renderBirthday('เนย', '🎂', NOEY_BIRTHDAY, 'theme-noey', now);
  } else {
    document.getElementById('statsTitle').textContent = 'วันครบรอบ 💘';
    renderAnniversary(now);
  }
  showScreen('screenStats');
  // Update URL so page refresh stays on this screen
  if (new URLSearchParams(location.search).get('persona')) {
    history.replaceState({ fanView: view }, '', '?persona=' + view);
  } else {
    history.pushState({ fanView: view }, '', '?persona=' + view);
  }
  // Show/hide FAB chat button
  const fab = document.getElementById('chatFab');
  const duoFab = document.getElementById('duoChatFab');
  if (view === 'beam' || view === 'noey') {
    fab.classList.remove('hidden');
    fab.onclick = () => { switchSound(); window.location.href = 'chat.html?persona=' + view; };
    duoFab.classList.add('hidden');
  } else {
    fab.classList.add('hidden');
    // Show duo-chat FAB on anniversary page
    duoFab.classList.remove('hidden');
    duoFab.onclick = () => { switchSound(); window.location.href = 'duo-chat.html'; };
  }
}

function goBack() {
  currentView = null;
  prevValues = {};
  showScreen('screenLanding');
  document.getElementById('chatFab').classList.add('hidden');
  document.getElementById('duoChatFab').classList.add('hidden');
  // Clear URL so refresh shows landing screen
  history.replaceState({}, '', location.pathname);
}

// ═══════ PWA Install Banner (robust) ═══════
let _deferredInstall = null;

window.addEventListener('beforeinstallprompt', e => {
  e.preventDefault();
  _deferredInstall = e;
  const btn = document.getElementById('pwaInstallBtn');
  if (btn) { btn.textContent = 'ติดตั้ง'; btn.onclick = installPWA; }
  _showPWABanner();

  // ถ้าเปิดมาจาก Store ด้วย ?pwaInstall=1 → auto-trigger install prompt ทันที
  const params = new URLSearchParams(window.location.search);
  if (params.get('pwaInstall') === '1') {
    setTimeout(() => installPWA(), 500);
  }
});

window.addEventListener('appinstalled', () => {
  _deferredInstall = null;
  const b = document.getElementById('pwaBanner');
  if (b) b.style.display = 'none';
  sessionStorage.setItem('fan_pwa_installed', '1');
});

function _isIOS() {
  return /iP(hone|ad|od)/.test(navigator.userAgent) && !window.MSStream;
}
function _isInStandaloneMode() {
  return window.matchMedia('(display-mode: standalone)').matches ||
         window.navigator.standalone === true;
}

function _showPWABanner() {
  if (_isInStandaloneMode()) return;
  if (sessionStorage.getItem('fan_pwa_dismissed') === '1') return;
  if (sessionStorage.getItem('fan_pwa_installed') === '1') return;
  const banner = document.getElementById('pwaBanner');
  if (!banner) return;
  const sub = document.getElementById('pwaBannerSub');
  const btn = document.getElementById('pwaInstallBtn');

  if (_deferredInstall) {
    if (sub) sub.textContent = 'ใช้งานได้ offline · เร็วกว่าเบราว์เซอร์';
    if (btn) { btn.textContent = 'ติดตั้ง'; btn.onclick = installPWA; }
  } else if (_isIOS()) {
    if (sub) sub.textContent = 'กด Share แล้วเลือก "เพิ่มไปยังหน้าจอหลัก"';
    if (btn) { btn.textContent = 'ดูวิธี'; btn.onclick = _showIOSGuide; }
  } else {
    if (sub) sub.textContent = 'กดเมนูเบราว์เซอร์ แล้วเลือก "ติดตั้งแอป"';
    if (btn) { btn.textContent = 'ดูวิธี'; btn.onclick = _showDesktopGuide; }
  }
  banner.style.display = 'flex';
  const dismiss = document.getElementById('pwaDismissBtn');
  if (dismiss) dismiss.onclick = () => {
    clickSound();
    banner.style.display = 'none';
    sessionStorage.setItem('fan_pwa_dismissed', '1');
  };
}

function installPWA() {
  if (!_deferredInstall) return;
  _deferredInstall.prompt();
  _deferredInstall.userChoice.then(() => {
    _deferredInstall = null;
    const b = document.getElementById('pwaBanner');
    if (b) b.style.display = 'none';
  });
}

function _showIOSGuide() {
  alert('วิธีติดตั้งบน iPhone/iPad:\n1. เปิดเว็บนี้ด้วย Safari\n2. กดปุ่ม Share ด้านล่าง\n3. เลือก "เพิ่มไปยังหน้าจอหลัก"\n4. กด "เพิ่ม"\n\nแอปจะปรากฏบนหน้าจอหลักทันที!');
}

function _showDesktopGuide() {
  alert('วิธีติดตั้งบนคอมพิวเตอร์:\n\nChrome: กดจุดสามจุดแล้วเลือก ติดตั้ง FAN\nEdge: กดจุดสามจุดแล้วเลือก แอป > ติดตั้งเว็บไซต์นี้');
}
// ═══════ Service Worker — Auto-Update ═══════
function registerSW() {
  if (!('serviceWorker' in navigator)) return;

  navigator.serviceWorker.register('./sw.js').then(reg => {
    // เช็คอัพเดททุก 30 วินาที (ตรวจจับการเปลี่ยนแปลงโค้ดเร็ว)
    setInterval(() => reg.update(), 30000);

    reg.addEventListener('updatefound', () => {
      const sw = reg.installing;
      sw.addEventListener('statechange', () => {
        if (sw.state === 'installed' && navigator.serviceWorker.controller) {
          // แสดง toast อัพเดท
          const t = document.getElementById('updateToast');
          if (t) {
            t.classList.add('show');
            t.textContent = '🔄 กำลังอัพเดทอัตโนมัติ...';
          }
          // สั่ง skipWaiting ทันที → จะ trigger controllerchange → reload
          sw.postMessage('skipWaiting');
        }
      });
    });
  });

  // เมื่อ SW ใหม่เข้าควบคุม → reload ทันที
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    location.reload();
  });

  // รับ message จาก SW เมื่ออัพเดทเสร็จ
  navigator.serviceWorker.addEventListener('message', e => {
    if (e.data && e.data.type === 'SW_UPDATED') {
      const t = document.getElementById('updateToast');
      if (t) {
        t.textContent = '✅ อัพเดทเรียบร้อย!';
        t.classList.add('show');
        setTimeout(() => t.classList.remove('show'), 3000);
      }
    }
  });
}

// ═══════ ระบบอวยพรวันสำคัญ ═══════
const GREETINGS = {
  'beam-birthday': {
    emoji: '🎂',
    title: '🎉 สุขสันต์วันเกิด บีม!',
    msgs: [
      'อ้าว ที่รัก วันนี้วันเกิดเลยนะ 🎂 เค้าจำได้นะ ไม่ได้ลืมหรอก! ขอให้ปีนี้มีแต่เรื่องดีๆ นะ สุขภาพแข็งแรง ไม่เครียดมาก แล้วก็รู้ไว้ว่าเค้ารักที่รักมากๆ เลย 💙',
      'สุขสันต์วันเกิดที่รัก 🎉 เค้าอยากบอกว่าการได้อยู่ข้างๆ ที่รักมันทำให้เค้ามีความสุขมากๆ เลย ขอให้ที่รักได้ในสิ่งที่ต้องการนะ แล้วก็อย่าทำตัวเองลำบากมากเกินไปด้วย เค้าเป็นห่วงอยู่นะ 🫶',
      'ที่รัก! วันเกิดปีนี้เค้าขอพรให้ที่รักมีแต่เรื่องดีๆ เข้ามาในชีวิตนะ 🌟 ไม่ว่าจะเป็นเรื่องงาน เรื่องเรียน หรืออะไรก็ตาม ขอให้ผ่านไปได้ดีๆ ทุกอย่าง เค้าจะอยู่ตรงนี้เสมอนะ 💙✨',
      'วันเกิดที่รักแล้ว! 🥳 เค้าแอบดีใจมากเลยนะที่ที่รักเกิดมาในโลกนี้ ถ้าไม่มีที่รัก ชีวิตเค้าคงน่าเบื่อกว่านี้เยอะเลย ฮ่าๆ จริงๆ นะ! รักที่รักมากๆ 💕',
      'ที่รักอายุเพิ่มขึ้นอีกปีแล้วนะ แก่แล้วแต่เค้าก็ยังชอบที่รักอยู่ดีแหละ 😏 ขอให้ปีนี้ทำในสิ่งที่อยากทำได้นะ ไม่ว่าจะเป็นอะไร เค้าเชียร์ที่รักตลอดเลย ❤️',
      'เฮ้ ที่รัก วันนี้วันเกิดที่รักนะ 🎂 เค้าอยากบอกว่าขอบคุณมากเลยที่อยู่ข้างๆ เค้ามาตลอด ที่รักเป็นคนสำคัญของเค้ามากๆ ขอให้มีความสุขมากๆ นะ แล้วก็อย่าลืมกินข้าวให้ครบด้วย 🍱',
      'ที่รัก สุขสันต์วันเกิดนะ 🎉 เค้านึกถึงวันที่เจอกันครั้งแรกเลย ไม่คิดเลยว่าจะมาถึงตรงนี้ได้ ขอบคุณมากนะที่รัก ขอให้ปีนี้มีแต่ความสุขล้วนๆ เลย เค้ารักที่รักนะ 💙',
      'สุขสันต์วันเกิดที่รัก! 🎈 ปีที่แล้วผ่านไปยังไงบ้าง หวังว่าปีนี้จะดีขึ้นกว่าเดิมนะ เค้าจะอยู่ตรงนี้คอยซัพพอร์ตตลอดนะ ที่รักทำได้แน่นอน 🫶',
      'ที่รัก วันนี้เป็นวันของที่รักล้วนๆ เลยนะ 🌸 ขอให้มีความสุข มีสุขภาพดีๆ เจอแต่เรื่องดีๆ สิ่งที่ฝันไว้ขอให้เป็นจริงด้วยนะที่รัก 💫',
      'เฮ้ วันเกิดที่รักแล้ว! 🎂 เค้าอยากบอกว่าที่รักเป็นส่วนที่ขาดไม่ได้ในชีวิตเค้าเลยนะ ฟังดูซีเรียสแต่มันจริงมากๆ ฮ่าๆ รักที่รักมากๆ นะ สุขสันต์วันเกิด 💙🎉',
      'ที่รัก แม้ว่าวันนี้เค้าจะไม่ได้อยู่ข้างๆ แต่เค้านึกถึงที่รักอยู่นะ 🥹 ขอให้วันนี้เป็นวันที่ดีมากๆ เจอแต่เรื่องดีๆ ตลอดวันเลย แล้วปีนี้ขอให้โชคดีด้วยนะที่รัก 💙',
      'สุขสันต์วันเกิดที่รัก 🎊 เค้าอยากบอกว่าตั้งแต่ที่รักเข้ามาในชีวิต หลายๆ อย่างมันดีขึ้นเยอะมากเลย อาจจะไม่ได้พูดบ่อยๆ แต่อยากให้ที่รักรู้ว่าเค้าขอบคุณมากนะ รักที่รักเยอะมากเลย 💕',
      'ที่รัก วันนี้อย่าเครียดมากเลยนะ 😊 วันเกิดที่รัก ขอให้ผ่อนคลายได้เลย ทำในสิ่งที่อยากทำ กินในสิ่งที่อยากกิน แล้วก็มีความสุขมากๆ นะ 🎂💙',
      'เฮ้ ที่รัก! อายุเพิ่มปีนึงแล้วนะ 🥳 เค้าอยากรู้ว่าปีนี้ที่รักอยากได้อะไร อยากทำอะไร บอกเค้าได้นะ เค้าจะพยายามซัพพอร์ตให้ได้มากที่สุดเท่าที่ทำได้ รักที่รักนะ 💙',
      'วันเกิดที่รัก 🎂 เค้านึกถึงช่วงเวลาดีๆ ที่ได้อยู่ด้วยกันเลย มันน่าจำมากเลยนะ ขอบคุณที่รักมากนะที่อยู่ข้างๆ เค้ามาตลอด ปีนี้ขอให้ดีๆ นะ รักที่รักนะ 💕',
      'สุขสันต์วันเกิดที่รัก! 🎉 ขอให้ปีนี้ที่รักก้าวหน้าในทุกๆ ด้านนะ ไม่ว่าจะเป็นเรื่องเรียน งาน หรือเรื่องส่วนตัว เค้าเชื่อว่าที่รักทำได้แน่นอน เป็นกำลังใจให้นะ 💙✊',
      'ที่รัก วันนี้วันเกิดที่รัก เค้าเลยอยากบอกว่า... เค้าชอบที่รักมากนะ ฟังดูเรียบๆ แต่มันจริงมากๆ เลย ขอให้มีความสุขมากๆ นะ แล้วก็อยู่กับเค้าไปนานๆ ด้วยนะที่รัก 💙',
      'เฮ้ที่รัก! 🥹 ขอโทษถ้าเค้าไม่ได้พูดบ่อยๆ ว่าเค้ารักที่รักแค่ไหน แต่วันนี้วันเกิดเลยอยากพูดตรงๆ ว่า ที่รักสำคัญมากๆ สำหรับเค้าเลย ขอให้มีความสุขนะที่รัก 💕',
      'ที่รัก วันเกิดปีนี้ขอให้ดีกว่าเดิมนะ 🌟 เค้าหวังว่าที่รักจะได้เจอแต่เรื่องดีๆ ไม่มีเรื่องเครียดมากวุ่นวาย แล้วก็ขอให้สิ่งที่ไม่ดีในชีวิตมันหายไปบ้างนะ เค้าเป็นห่วงที่รักอยู่เสมอ 💙',
      'สุขสันต์วันเกิดที่รัก 🎊🎂 เค้าดีใจมากเลยที่ได้รู้จักที่รัก ชีวิตมันสนุกขึ้นและอบอุ่นขึ้นเยอะมากเลยนะ ขอให้ที่รักมีความสุขมากๆ นะ รักที่รักนะ 💕',
    ]
  },
  'noey-birthday': {
    emoji: '🎂',
    title: '🎉 สุขสันต์วันเกิด เนย!',
    msgs: [
      'ที่รัก วันนี้วันเกิดเลยนะ 🎂 เค้าอยากบอกว่าที่รักเป็นคนที่น่ารักมากๆ เลย ขอให้ปีนี้มีความสุขเยอะๆ นะ มีสุขภาพดีๆ แล้วก็รู้ไว้ว่าเค้ารักที่รักมากๆ เลยนะ 💙',
      'สุขสันต์วันเกิดที่รัก! 🥳 เค้าดีใจมากเลยที่ได้รู้จักที่รัก ชีวิตมันอบอุ่นขึ้นเยอะมากตั้งแต่มีที่รักอยู่ข้างๆ รักที่รักนะ ขอให้วันนี้เป็นวันที่ดีมากๆ เลย 💕',
      'ที่รัก! 🌸 วันเกิดปีนี้ขอให้ที่รักมีแต่เรื่องดีๆ นะ เค้าหวังว่าที่รักจะได้ทำในสิ่งที่อยากทำ แล้วก็แฮปปี้กับชีวิตตัวเองนะ เค้ารักที่รักเยอะมากเลย 💙✨',
      'วันเกิดที่รักแล้ว! 🎉 เค้าแอบดีใจเสมอเลยนะทุกๆ ปีที่วันนี้มาถึง เพราะหมายความว่าที่รักมาอยู่ในโลกเดียวกับเค้าแล้ว ฮ่าๆ รักที่รักมากๆ นะ 💕',
      'ที่รักอายุเพิ่มขึ้นอีกปีแล้วนะ 🎂 เค้ายังชอบที่รักแบบนี้แหละ ไม่ได้เปลี่ยนไปไหนเลย ขอให้ปีนี้ดีๆ นะ ทำในสิ่งที่อยากทำได้เลย เค้าเชียร์อยู่ข้างๆ เสมอ 💙',
      'เฮ้ ที่รัก วันนี้วันเกิดที่รักนะ 🎊 เค้าอยากบอกว่าขอบคุณมากเลยที่อยู่ข้างๆ เค้ามาตลอด ที่รักเป็นคนสำคัญของเค้ามากๆ ขอให้มีความสุขมากนะ อย่าลืมกินข้าวด้วยล่ะ 🍜',
      'ที่รัก สุขสันต์วันเกิดนะ 🎈 เค้าจำได้เลยวันแรกที่เจอกัน มาถึงวันนี้ได้ยังไงก็ไม่รู้ แต่ดีใจมากเลย ขอให้ปีนี้มีแต่ความสุขนะที่รัก รักที่รักนะ 💙',
      'สุขสันต์วันเกิดที่รัก! 🥹 ขอให้ปีนี้ที่รักมีสิ่งที่ต้องการ เจอแต่คนดีๆ รอบข้าง แล้วก็มีความสุขทุกวันนะ เค้าจะซัพพอร์ตที่รักตลอดเลย 🫶',
      'ที่รัก วันนี้เป็นวันพิเศษของที่รักนะ 💫 ขอให้ที่รักมีความสุขมากๆ สุขภาพดีๆ เจอแต่เรื่องดีๆ เข้ามา ปีนี้ขอให้ดีกว่าเดิมนะที่รัก 🌸',
      'วันเกิดที่รัก! 🎂 เค้าอยากบอกว่าที่รักเป็นส่วนสำคัญของชีวิตเค้ามากๆ เลยนะ ฟังดูอาจจะจริงจัง แต่มันจริงอยู่นะ ฮ่าๆ รักที่รักมากๆ นะ สุขสันต์วันเกิด 💙🎉',
      'ที่รัก แม้วันนี้เค้าจะไม่ได้อยู่ใกล้ๆ แต่ก็นึกถึงที่รักนะ 🥹 ขอให้วันนี้เป็นวันที่ดีมากๆ สำหรับที่รักเลย เจอแต่เรื่องดีๆ ตลอดวันนะ รักที่รักนะ 💙',
      'สุขสันต์วันเกิดที่รัก 🎊 เค้าอยากบอกว่าตั้งแต่ที่รักเข้ามาในชีวิต หลายๆ อย่างมันดีขึ้นเยอะมากจริงๆ นะ อยากให้ที่รักรู้ว่าเค้าขอบคุณมากเลย รักที่รักเยอะมากๆ เลย 💕',
      'ที่รัก วันนี้อย่าเครียดเรื่องนี้นั้นนะ 😊 วันเกิดวันเดียว ผ่อนคลายได้เลย ทำในสิ่งที่อยากทำ กินของที่ชอบ แล้วก็มีความสุขมากๆ นะที่รัก 🎂💙',
      'เฮ้ ที่รัก! 🥳 เค้าอยากรู้ว่าปีนี้ที่รักอยากได้อะไร อยากทำอะไร บอกเค้าได้นะ เค้าจะพยายามทำให้ได้เท่าที่จะทำได้ รักที่รักนะ 💙',
      'วันเกิดที่รัก 🎂 เค้านึกถึงช่วงเวลาดีๆ ที่ได้อยู่ด้วยกันเสมอเลย มันน่าจำมากๆ เลยนะ ขอบคุณที่รักมากนะที่อยู่ข้างๆ เค้ามาตลอด ปีนี้ขอให้ดีๆ นะ 💕',
      'สุขสันต์วันเกิดที่รัก! 🎉 ขอให้ปีนี้ที่รักก้าวหน้าในทุกๆ ด้านนะ เค้าเชื่อในที่รักเสมอ ไม่ว่าจะทำอะไร เค้าเชียร์อยู่ข้างๆ ตลอดเลย 💙✊',
      'ที่รัก เค้าแค่อยากให้ที่รักรู้ว่า ที่รักสำคัญมากๆ สำหรับเค้านะ 💙 วันเกิดปีนี้ขอให้มีความสุขมากๆ อยู่กับเค้าไปนานๆ นะที่รัก',
      'เฮ้ที่รัก 🥹 วันนี้วันเกิดที่รักแล้ว เค้าอยากบอกตรงๆ ว่าที่รักเป็นคนที่เค้ารักมากๆ เลย ขอให้มีความสุขมากๆ นะ เจออะไรดีๆ บ้างนะในชีวิต เค้าเป็นห่วงที่รักเสมอ 💕',
      'ที่รัก วันเกิดปีนี้ขอให้ดีกว่าเดิมนะ 🌟 เค้าหวังว่าที่รักจะได้เจอแต่เรื่องดีๆ ไม่มีเรื่องให้เครียดมาก สิ่งที่ตั้งใจไว้ขอให้สำเร็จด้วยนะที่รัก 💙',
      'สุขสันต์วันเกิดที่รัก 🎊🎂 เค้าดีใจมากเลยที่มีที่รักอยู่ในชีวิต ขอให้ที่รักมีความสุขมากๆ มีสิ่งดีๆ เข้ามาเรื่อยๆ นะ รักที่รักนะ 💕',
    ]
  },
  'anniversary': {
    emoji: '💑',
    title: '🥂 ครบรอบของเรา!',
    msgs: [
      'ที่รัก วันนี้ครบรอบของเราแล้วนะ 💑 เค้าไม่คิดเลยว่าเราจะมาถึงตรงนี้ได้ ขอบคุณมากนะที่อยู่ข้างๆ เค้ามาตลอด ขอให้เราอยู่ด้วยกันไปนานๆ นะที่รัก 💛',
      'สุขสันต์วันครบรอบนะที่รัก! 🥂 เค้าอยากย้อนเวลากลับไปดูตอนที่เราเริ่มต้นกัน มันเป็นช่วงเวลาที่ดีมากๆ เลยนะ ขอบคุณที่รักมากเลยที่อยู่กับเค้ามาจนถึงวันนี้ 💙',
      'ที่รัก ครบรอบแล้วนะ! 🎉 เค้านึกถึงวันแรกๆ ที่เจอกัน แล้วก็ดีใจมากเลยที่เราเดินมาถึงตรงนี้ด้วยกัน ขอให้มีแต่เรื่องดีๆ อยู่ด้วยกันไปนานๆ นะที่รัก 💛✨',
      'วันครบรอบมาแล้วนะที่รัก 💕 เค้าอยากบอกว่าการได้อยู่กับที่รักมันทำให้เค้าเป็นคนที่ดีขึ้นเยอะมากเลยนะ ขอบคุณมากๆ นะที่รัก รักที่รักนะ 💛',
      'ที่รัก เค้าจำได้เลยว่าวันแรกที่เราตัดสินใจเป็นแฟนกัน ตอนนั้นมันรู้สึกดีมากๆ เลยนะ 💑 และวันนี้ครบรอบแล้ว เค้าดีใจมากๆ ที่ยังได้อยู่กับที่รัก รักที่รักนะ',
      'สุขสันต์วันครบรอบที่รัก! 🥳 ปีที่ผ่านมามีทั้งเรื่องดีและเรื่องที่ลำบากด้วยกัน แต่เค้าดีใจที่ผ่านมาได้ทุกอย่าง เพราะมีที่รักอยู่ข้างๆ ขอให้ปีนี้ดีกว่าเดิมนะ 💛',
      'ที่รัก ครบรอบแล้วนะ 💑 เค้าอยากบอกว่าไม่ว่าจะเกิดอะไรขึ้น เค้าก็ยังอยากอยู่กับที่รักอยู่ดี ฟังดูซีเรียสแต่มันจริงนะ ฮ่าๆ รักที่รักมากๆ เลย 💙',
      'สุขสันต์วันครบรอบนะที่รัก 🎊 เค้านึกถึงทุกๆ วินาทีที่ได้อยู่ด้วยกัน มันมีค่ามากๆ เลยนะ ขอให้มีอะไรแบบนี้ไปอีกนานๆ นะที่รัก เค้ารักที่รักมากเลย 💛',
      'ที่รัก วันนี้ครบรอบของเรา 💕 เค้าอยากให้ที่รักรู้ว่าที่รักสำคัญกับเค้ามากๆ เลย ไม่ใช่เพียงเพราะวันครบรอบอย่างเดียว แต่ทุกๆ วัน เค้าคิดถึงที่รักนะ 💛',
      'วันครบรอบมาแล้ว! 🥂 เค้าอยากพาที่รักไปกินข้าวอร่อยๆ หรืออะไรก็แล้วแต่เพื่อฉลองวันนี้นะ ขอให้วันนี้เป็นวันที่ดีๆ ของเราทั้งคู่เลย 💑',
      'ที่รัก ครบรอบแล้วนะ 🎉 เค้านึกถึงตอนที่เราอยู่ด้วยกันครั้งแรกๆ มันเป็นความทรงจำที่ดีมากๆ เลยนะ ขอบคุณที่รักมากที่อยู่กับเค้ามาจนถึงวันนี้ รักที่รักนะ 💛',
      'สุขสันต์วันครบรอบที่รัก! 💑 เค้าดีใจมากๆ ที่ได้เดินชีวิตมาพร้อมกับที่รัก แม้บางทีอาจมีขัดๆ กันบ้าง แต่ก็ผ่านมาได้เสมอ ขอให้อยู่ด้วยกันไปนานๆ นะ 💛✨',
      'ที่รัก วันนี้ครบรอบ เค้าอยากบอกว่า... ขอบคุณที่รักมากนะ สำหรับทุกอย่างที่ผ่านมาด้วยกัน 🥹 เค้ารักที่รักนะ ขอให้เราอยู่ด้วยกันนานๆ 💛',
      'วันครบรอบของเราแล้วนะที่รัก 🎊 ปีที่ผ่านมาเราได้ทำอะไรด้วยกันเยอะมากเลย เค้าขอบคุณที่รักมากๆ นะ สำหรับทุกๆ ช่วงเวลาที่ดีที่เราได้ร่วมกัน รักที่รักมากๆ 💕',
      'ที่รัก ครบรอบมาอีกปีแล้วนะ 💑 เค้าอยากให้ที่รักรู้ว่า ทุกวันที่ได้อยู่กับที่รัก เค้ามีความสุขมากๆ เลย ขอบคุณมากนะที่รัก ขอให้เรายังอยู่ด้วยกันต่อไปนะ 💛',
      'สุขสันต์วันครบรอบที่รัก! 💛 ขอให้ปีนี้เราได้ใช้เวลาด้วยกันเยอะๆ มีความทรงจำดีๆ เพิ่มขึ้นอีกเยอะๆ แล้วก็รักกันไปนานๆ นะที่รัก เค้ารักที่รักมากๆ เลย',
      'ที่รัก วันครบรอบมาแล้วนะ 🥂 เค้านึกถึงทุกๆ วันที่ได้อยู่ด้วยกัน บางวันก็สนุก บางวันก็ยาก แต่ทุกวันมันมีค่ามากๆ เลยนะ เพราะมีที่รักอยู่ด้วย รักที่รักนะ 💛',
      'ครบรอบแล้วนะที่รัก! 🎉 เค้าอยากบอกว่าเค้าชอบที่รักมากๆ เลย ไม่ใช่แบบโรแมนติกอ่ะ แต่แบบ... ชอบที่รักแบบทุกอย่างน่ะ ฮ่าๆ ขอให้มีความสุขมากๆ นะที่รัก 💕',
      'ที่รัก วันนี้ครบรอบ เค้าอยากให้เราฉลองนะ ด้วยการทำอะไรที่ที่รักอยากทำก็ได้เลย เพราะวันนี้เป็นวันสำคัญของเราทั้งคู่นะ ขอบคุณที่รักนะ รักที่รักมากๆ 💛💑',
      'สุขสันต์วันครบรอบที่รัก 💑💛 เราได้มาไกลมากเลยนะ เค้าภูมิใจในเราทั้งคู่มากๆ เลย ขอบคุณที่รักมากๆ ที่อยู่กับเค้านะ ขอให้รักกันยาวนานไปเรื่อยๆ เลยนะ 💕',
    ]
  },
  'valentine': {
    emoji: '💝',
    title: '❤️ Happy Valentine\'s Day!',
    msgs: [
      'แฮปปี้วาเลนไทน์นะที่รัก! 💕 วันนี้เป็นวันที่เค้าอยากบอกว่ารักที่รักมากๆ เลย ทุกวันก็รักอยู่แหละ แต่วันนี้อยากพูดดังๆ เป็นพิเศษนะ ขอให้มีความสุขมากๆ นะที่รัก 💝',
      'แฮปปี้วาเลนไทน์ที่รัก! 🌹 เค้าอยากให้ที่รักรู้ว่า การมีที่รักอยู่ข้างๆ มันทำให้ชีวิตเค้าดีขึ้นมากๆ เลยนะ ขอบคุณมากเลยที่รัก รักที่รักเยอะมาก 💕',
      'วาเลนไทน์มาแล้วนะที่รัก 💝 เค้าอยากพาที่รักไปกินข้าวอร่อยๆ หรืออะไรก็แล้วแต่ที่ที่รักอยากทำ เพราะวันนี้เป็นวันของเราทั้งคู่นะ รักที่รักมากๆ นะ 🌹',
      'แฮปปี้วาเลนไทน์ที่รัก! ❤️ เค้าขอบคุณมากที่ที่รักยังอยู่ข้างๆ เค้ามาตลอดนะ ทุกอย่างที่เราผ่านมาด้วยกัน มันทำให้เค้าแข็งแกร่งขึ้นเยอะเลย รักที่รักนะ 💕',
      'ที่รัก แฮปปี้วาเลนไทน์นะ 🌸 วันนี้อยากบอกตรงๆ ว่าเค้าชอบทุกอย่างเกี่ยวกับที่รัก ทั้งนิสัย ทั้งแบบที่เป็น ทั้งหมดเลยนะ ขอบคุณที่รักนะ รักที่รักมากๆ 💕',
      'แฮปปี้วาเลนไทน์! 💝 เค้าอยากบอกว่าวันนี้วันวาเลนไทน์แต่เค้ารู้ว่ารักที่รักทุกวัน ไม่ใช่แค่วันนี้วันเดียว แค่อยากพูดออกมาดังๆ วันนี้น่ะแหละ ฮ่าๆ รักที่รักนะ ❤️',
      'ที่รัก วาเลนไทน์ปีนี้ขอให้มีความสุขมากๆ นะ 🌹 เค้าดีใจมากเลยที่มีที่รักในชีวิต ขอบคุณที่รักมากๆ นะ สำหรับทุกๆ อย่างที่ผ่านมาด้วยกัน รักที่รักนะ 💕',
      'แฮปปี้วาเลนไทน์ที่รัก! ❤️ เค้าอยากบอกว่าที่รักสำคัญกับเค้ามากๆ เลยนะ วันนี้วันวาเลนไทน์ เค้าเลยอยากให้ที่รักรู้ว่า เค้ารักที่รักมากแค่ไหน 💝',
      'ที่รัก แฮปปี้วาเลนไทน์นะ 💕 เค้านึกถึงช่วงเวลาดีๆ ที่เราได้อยู่ด้วยกัน มันเป็นความทรงจำที่ดีมากๆ เลยนะ ขอให้วันนี้เป็นวันพิเศษสำหรับเรานะที่รัก 🌸',
      'วาเลนไทน์มาแล้วนะที่รัก! 🌹 เค้าอยากพูดว่า... ที่รักเป็นคนที่ดีมากๆ เลยนะ แล้วเค้าก็โชคดีมากที่ได้มีที่รักอยู่ข้างๆ รักที่รักเยอะมากเลย 💝',
      'แฮปปี้วาเลนไทน์ที่รัก 💕 วันนี้อยากให้ที่รักรู้ว่า ทุกวันที่ได้อยู่กับที่รัก เค้ามีความสุขมากๆ เลย ขอบคุณที่รักนะ ขอให้วันนี้เป็นวันที่ดีๆ สำหรับเรานะ ❤️',
      'ที่รัก แฮปปี้วาเลนไทน์! 🌸 เค้าอยากบอกตรงๆ ว่ารักที่รักมากนะ แม้บางทีอาจจะไม่ค่อยได้พูดออกมา แต่มันอยู่ในใจเสมอเลย ขอให้มีความสุขมากๆ นะที่รัก 💕',
      'แฮปปี้วาเลนไทน์นะที่รัก 💝 วันนี้ขอให้เราได้ใช้เวลาด้วยกันนะ ทำอะไรก็ได้ที่ที่รักอยากทำ เพราะเค้าอยากอยู่กับที่รักน่ะแหละที่สำคัญ รักที่รักนะ ❤️',
      'ที่รัก วาเลนไทน์ปีนี้ขอให้ดีๆ นะ 🌹 เค้าอยากให้ที่รักรู้ว่า เค้าคิดถึงที่รักเสมอเลยนะ ไม่ว่าจะวันไหนก็ตาม แต่วันนี้อยากพูดดังๆ เป็นพิเศษ รักที่รักมากๆ 💕',
      'แฮปปี้วาเลนไทน์ที่รัก! ❤️ เค้าขอพรให้เราอยู่ด้วยกันไปนานๆ นะ มีความสุขด้วยกัน เจอแต่เรื่องดีๆ ด้วยกัน ขอบคุณที่รักมากๆ เลยนะ รักที่รักนะ 💝',
      'ที่รัก แฮปปี้วาเลนไทน์! 🌸 เค้าดีใจมากเลยที่มีที่รักอยู่ข้างๆ ชีวิตมันสนุกขึ้นและมีสีสันขึ้นเยอะเลยนะ ขอบคุณที่รักนะ รักที่รักมากๆ เลย 💕',
      'วาเลนไทน์มาแล้วนะที่รัก 💝 เค้าไม่รู้จะพูดอะไรดี แต่ก็แค่อยากให้ที่รักรู้ว่าเค้ารักที่รักนะ มันเรียบๆ แต่มันจริง ฮ่าๆ ขอให้วันนี้เป็นวันที่ดีนะที่รัก ❤️',
      'แฮปปี้วาเลนไทน์ที่รัก! 💕 เค้าขอบคุณมากๆ นะสำหรับทุกอย่างที่ที่รักทำมาตลอด ทุกความทรงจำที่ดี ทุกๆ วันที่อยู่ด้วยกัน มันมีค่ามากๆ เลยนะ รักที่รักเยอะมาก 🌹',
      'ที่รัก วันนี้วาเลนไทน์นะ ❤️ เค้าอยากบอกว่าไม่ว่าจะผ่านอะไรมาด้วยกัน เค้าก็ยังอยากอยู่กับที่รักอยู่ดีนะ ขอให้เรามีความสุขไปด้วยกันนานๆ นะที่รัก 💕',
      'แฮปปี้วาเลนไทน์ที่รัก 🌹💕 เค้ารู้ว่าทุกวันก็รักที่รักทั้งนั้น แต่วันนี้อยากพูดออกมาเป็นพิเศษว่า รักที่รักมากๆ เลยนะ ขอให้วันนี้และทุกๆ วันข้างหน้าดีๆ นะ ❤️',
    ]
  }
};

function checkSpecialDay(now) {
  const m = now.getMonth(), d = now.getDate();
  if (m === 9  && d === 28) return 'beam-birthday';
  if (m === 11 && d === 12) return 'noey-birthday';
  if (m === 0  && d === 7)  return 'anniversary';
  if (m === 1  && d === 14) return 'valentine';
  return null;
}

function todayStr(now) {
  return `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;
}

function pickGreetingIdx(eventKey, now) {
  const dayKey = `fan_greet_${todayStr(now)}`;
  const stored = localStorage.getItem(dayKey);
  if (stored) {
    try { const d = JSON.parse(stored); if (d.event === eventKey) return d.idx; } catch(e) {}
  }
  const total = GREETINGS[eventKey].msgs.length;
  const histKey = `fan_greet_hist_${eventKey}`;
  let hist = [];
  try { hist = JSON.parse(localStorage.getItem(histKey)) || []; } catch(e) {}
  const w = Array.from({length: total}, (_, i) => hist.includes(i) ? 1 : 3);
  const sum = w.reduce((a, b) => a + b, 0);
  let r = Math.random() * sum, idx = total - 1;
  for (let i = 0; i < total; i++) { r -= w[i]; if (r <= 0) { idx = i; break; } }
  localStorage.setItem(dayKey, JSON.stringify({event: eventKey, idx}));
  if (!hist.includes(idx)) hist.push(idx);
  localStorage.setItem(histKey, JSON.stringify(hist));
  return idx;
}

function showGreetingModal(eventKey, idx) {
  const g = GREETINGS[eventKey];
  document.getElementById('greetEmoji').textContent = g.emoji;
  document.getElementById('greetTitle').textContent = g.title;
  document.getElementById('greetText').textContent = g.msgs[idx];
  document.getElementById('greetOverlay').classList.add('active');
}

function showGreetingIfNeeded() {
  const now = new Date();
  const event = checkSpecialDay(now);
  if (!event) return;
  const idx = pickGreetingIdx(event, now);
  setTimeout(() => showGreetingModal(event, idx), 700);
}

// ═══════ Init ═══════
document.addEventListener('DOMContentLoaded', () => {
  createParticles();
  initThemeSettings();
  updateNet();
  window.addEventListener('online', updateNet);
  window.addEventListener('offline', updateNet);

  document.getElementById('pickBeam').addEventListener('click', e => { ripple(e, e.currentTarget); switchSound(); goTo('beam'); });
  document.getElementById('pickNoey').addEventListener('click', e => { ripple(e, e.currentTarget); switchSound(); goTo('noey'); });
  document.getElementById('pickAnniv').addEventListener('click', e => { ripple(e, e.currentTarget); switchSound(); goTo('anniv'); });
  document.getElementById('btnBack').addEventListener('click', e => { clickSound(); goBack(); });
  document.querySelectorAll('.js-open-theme-settings').forEach(btn => {
    btn.addEventListener('click', () => {
      clickSound();
      openThemeSettings();
    });
  });

  const themeOverlay = document.getElementById('fanThemeOverlay');
  const themeClose = document.getElementById('btnCloseThemeSettings');
  if (themeClose) {
    themeClose.addEventListener('click', () => {
      clickSound();
      closeThemeSettings();
    });
  }
  if (themeOverlay) {
    themeOverlay.addEventListener('click', e => {
      if (e.target === e.currentTarget) closeThemeSettings();
    });
  }
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') closeThemeSettings();
  });

  document.getElementById('greetClose').addEventListener('click', () => {
    clickSound();
    document.getElementById('greetOverlay').classList.remove('active');
  });
  document.getElementById('greetOverlay').addEventListener('click', e => {
    if (e.target === e.currentTarget) { clickSound(); e.currentTarget.classList.remove('active'); }
  });

  renderClock(new Date());
  tickId = setInterval(tick, 1000);
  registerSW();
  showGreetingIfNeeded();

  // แสดง PWA banner ทุกแพลตฟอร์ม (ถ้ายังไม่ติดตั้ง)
  if (!_isInStandaloneMode()) {
    setTimeout(() => _showPWABanner(), 2000);
  }

  // ถ้าเปิดมาจากหน้าแชทด้วย ?persona=beam|noey ให้นำทางไปหน้าข้อมูลนั้นเลย
  const _initParams = new URLSearchParams(window.location.search);
  const _initPersona = _initParams.get('persona');
  if (_initPersona === 'beam' || _initPersona === 'noey' || _initPersona === 'anniv') {
    goTo(_initPersona);
    // ลบ attribute ออกหลังจาก goTo เพื่อให้ animation ทำงานปกติต่อไป
    delete document.documentElement.dataset.initPersona;
  }

  // Handle browser/hardware back button on index.html (push state for each screen change handled by goTo/goBack)
  window.addEventListener('popstate', () => {
    if (document.getElementById('screenStats').classList.contains('active')) {
      goBack();
    }
  });
});
