/* ══════════════════════════════════════════════════════════════
   Download App X Beam — store.js
   ══════════════════════════════════════════════════════════════ */

let catalog = { apps: [] };
let currentCat = 'all';
let searchQuery = '';
let _apiAvailable = false;  // true เมื่อ server.js กำลังรัน

// ═══════ โหลด catalog (ลอง API ก่อน → fallback catalog.json) ═══════
async function loadCatalog() {
  _apiAvailable = false;
  // ลองดึงจาก server.js (เรียลไทม์)
  try {
    const res = await fetch('/api/apps');
    if (res.ok) {
      catalog = await res.json();
      _apiAvailable = true;
    }
  } catch (_) {}

  // fallback: อ่าน catalog.json (กรณีเปิดไฟล์โดยตรงไม่ใช้ server)
  if (!_apiAvailable) {
    try {
      const res = await fetch('./catalog.json?t=' + Date.now());
      catalog = await res.json();
    } catch (e) {
      console.warn('⚠️ ไม่พบ catalog — ใช้ node server.js เพื่อ auto-detect หรือรัน node scan.js เพื่อสร้าง catalog.json');
      catalog = { apps: [] };
    }
  }
  render();
  // บน static hosting (GitHub Pages ฯลฯ) → อ่าน websites/*.txt โดยตรงเพื่อเติมเว็บที่ขาด
  if (!_apiAvailable) loadWebsiteFilesClient();
}

// ═══════ อ่าน websites/1.txt–9.txt จากเบราว์เซอร์ (static hosting fallback) ═══════
function guessNameFromUrl(u) {
  try {
    const parsed = new URL(u);
    const parts  = parsed.pathname.split('/').filter(Boolean);
    const raw    = parts.length ? parts[parts.length - 1] : parsed.hostname;
    return raw.replace(/[-_]/g, ' ')
              .replace(/([a-z])([A-Z])/g, '$1 $2')
              .split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
              .trim() || parsed.hostname;
  } catch (_) { return u; }
}

async function loadWebsiteFilesClient() {
  // รวม URL ที่อยู่ใน catalog แล้ว (หลากหลาย trailing-slash variant)
  const knownUrls = new Set();
  for (const a of catalog.apps || []) {
    if (a.category !== 'websites') continue;
    const u = a.url || '';
    knownUrls.add(u);
    knownUrls.add(u.replace(/\/$/, ''));
    knownUrls.add(u.endsWith('/') ? u : u + '/');
  }

  const newEntries = [];
  for (let i = 1; i <= 9; i++) {
    let res;
    try { res = await fetch(`./websites/${i}.txt`); } catch (_) { continue; }
    if (!res.ok) continue;

    const text = await res.text();
    const rawUrls = (text.match(/https?:\/\/[^\s<>"']+/gi) || []);
    for (const raw of rawUrls) {
      const u = raw.replace(/#.*$/, '');  // ตัด fragment
      if (knownUrls.has(u) || knownUrls.has(u.replace(/\/$/, '')) || knownUrls.has(u.endsWith('/') ? u : u + '/')) continue;
      knownUrls.add(u);

      let hostname = u;
      try { hostname = new URL(u).hostname; } catch (_) {}
      let id;
      try { id = new URL(u).pathname.replace(/\//g, '').replace(/[^a-zA-Z0-9_-]/g, '') || hostname.replace(/\./g, '_'); }
      catch (_) { id = u.replace(/[^a-zA-Z0-9]/g, '').substring(0, 30); }

      newEntries.push({
        id:          'web_' + id,
        name:        guessNameFromUrl(u),
        description: 'เว็บไซต์ภายนอก',
        category:    'websites',
        icon:        `https://www.google.com/s2/favicons?domain=${encodeURIComponent(hostname)}&sz=64`,
        url:         u,
        version:     '',
        author:      'BEAM',
        external:    true
      });
    }
  }

  if (newEntries.length > 0) {
    catalog.apps = [...(catalog.apps || []), ...newEntries];
    render();
  }
}
function startPolling() {
  setInterval(async () => {
    if (!_apiAvailable) return;
    if (document.visibilityState !== 'visible') return;
    try {
      const res = await fetch('/api/apps?t=' + Date.now());
      if (!res.ok) return;
      const data = await res.json();
      // ตรวจว่ามีการเปลี่ยนแปลงไหม (เพิ่ม/ลบแอป)
      const newIds = (data.apps || []).map(a => a.id).sort().join(',');
      const oldIds = (catalog.apps || []).map(a => a.id).sort().join(',');
      if (newIds !== oldIds) {
        catalog = data;
        render();
        console.log('🔄 ตรวจพบการเปลี่ยนแปลง: ' + data.apps.length + ' แอป');
      }
    } catch (_) {}
  }, 3000);
}

// ═══════ กรองแอป ═══════
function getFiltered() {
  let list = catalog.apps || [];
  if (currentCat !== 'all') list = list.filter(a => a.category === currentCat);
  if (searchQuery) {
    const q = searchQuery.toLowerCase();
    list = list.filter(a => (a.name||'').toLowerCase().includes(q) || (a.description||'').toLowerCase().includes(q));
  }
  return list;
}

// ═══════ สร้าง HTML card ═══════
function cardHTML(app) {
  const isWeb      = app.category === 'websites';
  const isLocalWeb = app.category === 'local-websites';
  const fallback   = app.category === 'games' ? '🎮' : (isWeb ? '🌐' : (isLocalWeb ? '🏠' : '📱'));
  const iconHTML   = app.icon
    ? `<img src="${escapeAttr(app.icon)}" alt="${escapeAttr(app.name)}" loading="lazy" onerror="this.parentElement.textContent='${fallback}'">`
    : fallback;
  const catLabel   = app.category === 'games' ? 'เกม' : (isWeb ? 'เว็บภายนอก' : (isLocalWeb ? 'เว็บภายใน' : 'แอป'));
  const btnText    = isWeb ? 'เยี่ยมชม' : 'เปิด';
  const badge      = isWeb
    ? '<span class="ext-badge">🔗 ภายนอก</span>'
    : (isLocalWeb ? '<span class="local-badge">🏠 ภายใน</span>' : '');
  const cardClass  = isWeb ? 'web-card' : (isLocalWeb ? 'local-web-card' : '');
  return `
    <div class="app-card ${cardClass}" data-id="${escapeAttr(app.id)}" onclick="openDetail('${escapeAttr(app.id)}')">
      <div class="app-icon">${iconHTML}</div>
      <div class="app-info">
        <div class="app-name">${escape(app.name)}${badge}</div>
        <div class="app-desc">${escape(app.description || 'ไม่มีคำอธิบาย')}</div>
        <div class="app-meta">
          <span class="app-cat-badge ${app.category}">${catLabel}</span>
          <span class="app-version">${escape(app.version || '')}</span>
        </div>
      </div>
      <button class="app-get" onclick="event.stopPropagation(); openApp('${escapeAttr(app.id)}')">${btnText}</button>
    </div>`;
}

// ═══════ เรนเดอร์ ═══════
function render() {
  const apps      = getFiltered().filter(a => a.category === 'applications');
  const games     = getFiltered().filter(a => a.category === 'games');
  const webs      = getFiltered().filter(a => a.category === 'websites');
  const localWebs = getFiltered().filter(a => a.category === 'local-websites');
  const all       = getFiltered();

  const appGrid      = document.getElementById('appGrid');
  const gameGrid     = document.getElementById('gameGrid');
  const webGrid      = document.getElementById('webGrid');
  const localWebGrid = document.getElementById('localWebGrid');
  const appSec       = document.getElementById('appsSection');
  const gameSec      = document.getElementById('gamesSection');
  const webSec       = document.getElementById('websSection');
  const localWebSec  = document.getElementById('localWebsSection');
  const empty        = document.getElementById('emptyState');

  if (currentCat === 'all') {
    appSec.style.display      = apps.length      ? '' : 'none';
    gameSec.style.display     = games.length     ? '' : 'none';
    webSec.style.display      = webs.length      ? '' : 'none';
    localWebSec.style.display = localWebs.length ? '' : 'none';
    appGrid.innerHTML      = apps.map(cardHTML).join('');
    gameGrid.innerHTML     = games.map(cardHTML).join('');
    webGrid.innerHTML      = webs.map(cardHTML).join('');
    localWebGrid.innerHTML = localWebs.map(cardHTML).join('');
    empty.style.display = all.length === 0 ? '' : 'none';
  } else if (currentCat === 'applications') {
    appSec.style.display      = '';
    gameSec.style.display     = 'none';
    webSec.style.display      = 'none';
    localWebSec.style.display = 'none';
    appGrid.innerHTML = apps.map(cardHTML).join('');
    empty.style.display = apps.length === 0 ? '' : 'none';
  } else if (currentCat === 'games') {
    appSec.style.display      = 'none';
    gameSec.style.display     = '';
    webSec.style.display      = 'none';
    localWebSec.style.display = 'none';
    gameGrid.innerHTML = games.map(cardHTML).join('');
    empty.style.display = games.length === 0 ? '' : 'none';
  } else if (currentCat === 'websites') {
    appSec.style.display      = 'none';
    gameSec.style.display     = 'none';
    webSec.style.display      = '';
    localWebSec.style.display = 'none';
    webGrid.innerHTML = webs.map(cardHTML).join('');
    empty.style.display = webs.length === 0 ? '' : 'none';
  } else { // local-websites
    appSec.style.display      = 'none';
    gameSec.style.display     = 'none';
    webSec.style.display      = 'none';
    localWebSec.style.display = '';
    localWebGrid.innerHTML = localWebs.map(cardHTML).join('');
    empty.style.display = localWebs.length === 0 ? '' : 'none';
  }

  renderFeatured();
}

// ═══════ Featured banner ═══════
function renderFeatured() {
  const feat = document.getElementById('featured');
  // ซ่อน featured banner ทั้งหมดเมื่ออยู่ในหมวดเว็บ (ภายนอก/ภายใน)
  if (currentCat === 'websites' || currentCat === 'local-websites') {
    feat.innerHTML = '';
    return;
  }
  if (!catalog.apps.length) { feat.innerHTML = ''; return; }
  // เลือกแอปแรกที่ไม่ใช่เว็บมาแสดง
  const app = catalog.apps.find(a => a.category !== 'websites' && a.category !== 'local-websites')
           || catalog.apps[0];
  const iconHTML = app.icon
    ? `<img src="${escapeAttr(app.icon)}" alt="">`
    : '📱';
  const isWebApp = app.category === 'websites' || app.category === 'local-websites';
  const btnLabel = isWebApp ? 'เยี่ยมชม' : 'ติดตั้ง';
  const installGuide = isWebApp ? '' : `
    <details class="install-guide">
      <summary>📖 วิธีติดตั้งแอปลงเครื่อง</summary>
      <div class="ig-body">
        <b>Android (Chrome):</b> เปิดแอป → กด ⋮ → "เพิ่มไปยังหน้าจอหลัก" หรือ "ติดตั้งแอป"<br>
        <b>iOS (Safari):</b> เปิดแอป → กด ⬆ แชร์ → "เพิ่มไปยังหน้าจอหลัก"<br>
        <b>Windows (Chrome/Edge):</b> เปิดแอป → กด ⊕ ที่แถบ URL → "ติดตั้ง"
      </div>
    </details>`;
  feat.innerHTML = `
    <div class="feat-banner" onclick="openDetail('${escapeAttr(app.id)}')">
      <div class="feat-icon">${iconHTML}</div>
      <div class="feat-info">
        <span class="feat-badge">⭐ แนะนำ</span>
        <div class="feat-name">${escape(app.name)}</div>
        <div class="feat-desc">${escape(app.description || '')}</div>
      </div>
      <button class="feat-install" onclick="event.stopPropagation(); openApp('${escapeAttr(app.id)}')">${btnLabel}</button>
    </div>
    ${installGuide}`;
}

// ═══════ เปิดแอป ═══════
function openApp(id) {
  const app = catalog.apps.find(a => a.id === id);
  if (app && app.url) {
    playClick();
    window.open(app.url, '_blank');
  }
}

// ═══════ Modal detail ═══════
function openDetail(id) {
  const app = catalog.apps.find(a => a.id === id);
  if (!app) return;
  playClick();

  const modal      = document.getElementById('modal');
  const isWeb      = app.category === 'websites';
  const isLocalWeb = app.category === 'local-websites';
  const fallback   = isWeb ? '🌐' : (isLocalWeb ? '🏠' : '📱');
  const iconHTML   = app.icon
    ? `<img src="${escapeAttr(app.icon)}" alt="" onerror="this.parentElement.textContent='${fallback}'">`
    : fallback;

  const btnLabel = isWeb ? 'เยี่ยมชมเว็บไซต์' : 'เปิดแอป / ติดตั้ง';

  document.getElementById('modalHeader').innerHTML = `
    <div class="m-icon">${iconHTML}</div>
    <div class="m-info">
      <div class="m-name">${escape(app.name)}</div>
      <div class="m-author">โดย ${escape(app.author || 'BEAM')}</div>
      ${isWeb ? `<div class="m-url" style="font-size:.7rem;color:var(--text2);word-break:break-all;margin-top:2px">🔗 ${escape(app.url)}</div>` : ''}
      <button class="m-install" onclick="openApp('${escapeAttr(app.id)}')">${btnLabel}</button>
    </div>`;

  // Preview: iframe สำหรับ external หรือ local
  document.getElementById('modalPreview').innerHTML = app.url
    ? `<iframe src="${escapeAttr(app.url)}" loading="lazy" title="${escapeAttr(app.name)}"></iframe>`
    : '<div style="text-align:center;padding:40px;color:var(--text2)">ไม่มีตัวอย่าง</div>';

  const catTh     = app.category === 'games' ? 'เกม' : (isWeb ? 'เว็บไซต์ภายนอก' : (isLocalWeb ? 'เว็บไซต์ภายใน' : 'แอปพลิเคชัน'));
  const installInfo = isWeb
    ? `<div class="web-notice">⚠️ นี่คือเว็บไซต์ภายนอก ไม่ใช่แอปที่ติดตั้งลงเครื่องได้ — กดปุ่มด้านบนเพื่อเข้าชมผ่านเบราว์เซอร์</div>`
    : '';
  document.getElementById('modalInfo').innerHTML = `
    ${installInfo}
    <h3>รายละเอียด</h3>
    <p>${escape(app.description || 'ไม่มีคำอธิบาย')}</p>
    <div class="info-grid">
      <div class="info-item"><div class="info-label">เวอร์ชัน</div><div class="info-val">${escape(app.version || '-')}</div></div>
      <div class="info-item"><div class="info-label">หมวดหมู่</div><div class="info-val">${catTh}</div></div>
      <div class="info-item"><div class="info-label">ผู้พัฒนา</div><div class="info-val">${escape(app.author || 'BEAM')}</div></div>
      <div class="info-item"><div class="info-label">แพลตฟอร์ม</div><div class="info-val">${isWeb ? 'เบราว์เซอร์' : 'ทุกเครื่อง'}</div></div>
    </div>`;

  modal.style.display = 'flex';
}

function closeModal() {
  document.getElementById('modal').style.display = 'none';
  // ลบ iframe preview เพื่อหยุดโหลด
  document.getElementById('modalPreview').innerHTML = '';
}

// ═══════ เสียง ═══════
const AC = window.AudioContext || window.webkitAudioContext;
let ac = null;
function playClick() {
  try {
    if (!ac) ac = new AC();
    const o = ac.createOscillator(), g = ac.createGain();
    o.connect(g); g.connect(ac.destination);
    o.type = 'sine'; o.frequency.value = 750;
    g.gain.setValueAtTime(0.08, ac.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.08);
    o.start(); o.stop(ac.currentTime + 0.08);
  } catch(_) {}
}

// ═══════ อนุภาค ═══════
function initParticles() {
  const c = document.getElementById('particles');
  const colors = ['#4facfe','#ff6b9d','#ffd700','#3ddc84','#c44dff'];
  for (let i = 0; i < 16; i++) {
    const p = document.createElement('div');
    p.className = 'particle';
    const sz = Math.random()*5+2;
    Object.assign(p.style, {
      width: sz+'px', height: sz+'px', left: Math.random()*100+'%',
      background: colors[Math.floor(Math.random()*colors.length)],
      animationDuration: (Math.random()*18+12)+'s',
      animationDelay: (Math.random()*12)+'s'
    });
    c.appendChild(p);
  }
}

// ═══════ PWA Install Prompt ═══════
let _deferredInstall = null;

// Android / Chrome / Edge: catch install prompt
window.addEventListener('beforeinstallprompt', e => {
  e.preventDefault();
  _deferredInstall = e;
  _showPWABanner('android');
});

// Hide banner once installed
window.addEventListener('appinstalled', () => {
  _deferredInstall = null;
  const b = document.getElementById('pwaBanner');
  if (b) b.style.display = 'none';
});

// Detect iOS Safari (no beforeinstallprompt, needs manual steps)
function _isIOS() {
  return /iP(hone|ad|od)/.test(navigator.userAgent) && !(window.MSStream);
}
function _isInStandaloneMode() {
  return window.matchMedia('(display-mode: standalone)').matches ||
         window.navigator.standalone === true;
}

function _showPWABanner(type) {
  if (_isInStandaloneMode()) return; // already installed
  const banner = document.getElementById('pwaBanner');
  if (!banner) return;
  const sub = document.getElementById('pwaBannerSub');
  if (type === 'ios') {
    if (sub) sub.textContent = 'กด ☰ แล้วเลือก “เพิ่มไปยังหน้าจอหลัก” ใน Safari';
    const btn = document.getElementById('pwaInstallBtn');
    if (btn) { btn.textContent = 'ดูวิธี'; btn.onclick = _showIOSGuide; }
  }
  banner.style.display = 'flex';
}

function installPWA() {
  if (!_deferredInstall) return;
  _deferredInstall.prompt();
  _deferredInstall.userChoice.then(() => {
    _deferredInstall = null;
    const banner = document.getElementById('pwaBanner');
    if (banner) banner.style.display = 'none';
  });
}

function _showIOSGuide() {
  alert('วิธีติดตั้งบน iPhone/iPad:\n1. เปิดเว็บนี้ด้วย Safari\n2. กดปุ่ม \u23eb (Share) ด้านล่าง\n3. เลือก “เพิ่มไปยังหน้าจอหลัก”\n4. กด “เพิ่ม”\n\nแอปจะปรากบนหน้าจอหลักทันที 🎉');
}

// ═══════ Security helpers ═══════
function escape(s) {
  const d = document.createElement('div');
  d.textContent = s || '';
  return d.innerHTML;
}
function escapeAttr(s) {
  return (s||'').replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/'/g,'&#39;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

// ═══════ Init ═══════
document.addEventListener('DOMContentLoaded', () => {
  initParticles();
  loadCatalog();
  startPolling();  // เริ่ม auto-detect real-time

  // Show iOS install banner after a short delay (if on iOS Safari and not installed)
  if (_isIOS() && !_isInStandaloneMode()) {
    setTimeout(() => _showPWABanner('ios'), 2500);
  }

  // Tabs scroll-end fade detector + mouse wheel horizontal scroll
  const tabsEl   = document.querySelector('.tabs');
  const tabsWrap = document.querySelector('.tabs-wrap');
  if (tabsEl && tabsWrap) {
    const checkEnd = () => {
      const atEnd = tabsEl.scrollLeft + tabsEl.clientWidth >= tabsEl.scrollWidth - 4;
      tabsWrap.classList.toggle('scrolled-end', atEnd);
    };
    tabsEl.addEventListener('scroll', checkEnd, { passive: true });
    checkEnd();

    // แปลง mouse wheel (vertical) → horizontal scroll
    tabsEl.addEventListener('wheel', (e) => {
      if (e.deltaY === 0) return;
      e.preventDefault();
      tabsEl.scrollBy({ left: e.deltaY, behavior: 'smooth' });
    }, { passive: false });
  }

  // Tabs
  document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', () => {
      playClick();
      document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      currentCat = tab.dataset.cat;
      render();
    });
  });

  // Search
  const input = document.getElementById('searchInput');
  const clear = document.getElementById('searchClear');
  input.addEventListener('input', () => {
    searchQuery = input.value.trim();
    clear.style.display = searchQuery ? '' : 'none';
    render();
  });
  clear.addEventListener('click', () => {
    input.value = '';
    searchQuery = '';
    clear.style.display = 'none';
    render();
  });

  // Modal close
  document.getElementById('modalClose').addEventListener('click', closeModal);
  document.getElementById('modal').addEventListener('click', e => {
    if (e.target === e.currentTarget) closeModal();
  });
});
