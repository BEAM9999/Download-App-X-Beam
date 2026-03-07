#!/usr/bin/env node
/* ══════════════════════════════════════════════════════════════════════════
   server.js — Download App X Beam — Real-time App Store Server
   ══════════════════════════════════════════════════════════════════════════
   วิธีใช้: node server.js
   เปิดเบราว์เซอร์ → http://localhost:3000

   • เพิ่มโฟลเดอร์ใน  applications/  หรือ  games/
   • รีโหลดหน้าเว็บ → แอปปรากฏอัตโนมัติ! (ไม่ต้องรัน scan.js อีกต่อไป)
   ══════════════════════════════════════════════════════════════════════════ */

const http  = require('http');
const https = require('https');
const fs    = require('fs');
const path  = require('path');
const url   = require('url');

const PORT = 3000;
const ROOT = __dirname;

const CATEGORIES          = ['applications', 'games'];
const WEBSITES_DIR        = path.join(ROOT, 'websites');
const LOCAL_WEBSITES_DIR  = path.join(ROOT, 'local-websites');
const ICON_NAMES = [
  'favicon-512.png', 'favicon-192.png', 'favicon-touch.png',
  'apple-touch-icon.png', 'apple-touch-icon-precomposed.png',
  'favicon-96x96.png', 'favicon-48x48.png', 'favicon-32x32.png', 'favicon-16x16.png',
  'icon-512.png', 'icon-192.png', 'icon.png', 'logo.png',
  'favicon.png', 'favicon.ico', 'icon.svg', 'logo.svg', 'mask-icon.svg'
];

// ══ Smart version detection helpers ══
// ตรวจ semver หรือ version string จากข้อความ
const VSTR_RE = /\bv?(\d+\.\d+(?:\.\d+)*(?:[-+][a-zA-Z0-9._-]*)?)\b/;
function _pickVersion(text) {
  if (!text) return '';
  // 1. JSON field:  "version": "x.x.x"
  const j = text.match(/"version"\s*:\s*"([^"]{1,40})"/);
  if (j) return j[1].trim();
  // 2. JS/YAML  version = '...' / version: '...'
  const a = text.match(/\bversion\s*[=:]\s*['"]([^'"]{1,40})['"]?/i);
  if (a) return a[1].trim();
  // 3. generic semver pattern
  const s = text.match(VSTR_RE);
  if (s) return s[1].trim();
  return '';
}
// สแกนไฟล์ต่างๆ ในโฟลเดอร์แอปเพื่อหา version
function smartVersionFromDir(dir) {
  // (A) manifest.json → version
  try {
    const mj = JSON.parse(fs.readFileSync(path.join(dir,'manifest.json'),'utf8'));
    if (mj.version) return String(mj.version);
  } catch (_) {}
  // (B) package.json → version
  try {
    const pj = JSON.parse(fs.readFileSync(path.join(dir,'package.json'),'utf8'));
    if (pj.version) return String(pj.version);
  } catch (_) {}
  // (C) index.html → <meta name="version"> or inline
  try {
    const html = fs.readFileSync(path.join(dir,'index.html'),'utf8').substring(0,8000);
    const vm = html.match(/<meta[^>]+name=["'](?:version|app-version|application-version)["'][^>]+content=["']([^"']+)["']/i)
            || html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+name=["'](?:version|app-version)["']/i);
    if (vm) return vm[1].trim();
    // inline script  version = '...'
    const sv = _pickVersion(html.match(/<script[^>]*>([\s\S]{1,3000}?)<\/script>/i)?.[1] || '');
    if (sv) return sv;
  } catch (_) {}
  // (D) VERSION / version.txt / CHANGELOG.md
  for (const vf of ['VERSION','version.txt','VERSION.txt','CHANGELOG.md','CHANGELOG','RELEASES.md']) {
    try {
      const txt = fs.readFileSync(path.join(dir,vf),'utf8').substring(0,500);
      const v = _pickVersion(txt);
      if (v) return v;
    } catch (_) {}
  }
  return '';
}

function parseSizeRank(sizes) {
  if (!sizes) return 0;
  if (String(sizes).trim().toLowerCase() === 'any') return 1000000;
  let best = 0;
  for (const part of String(sizes).trim().split(/\s+/)) {
    const m = part.match(/^(\d+)x(\d+)$/i);
    if (!m) continue;
    const w = parseInt(m[1], 10) || 0;
    const h = parseInt(m[2], 10) || 0;
    best = Math.max(best, w * h, w, h);
  }
  return best;
}

function parseTagAttributes(tag) {
  const attrs = {};
  const attrRe = /([:@\w-]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/g;
  let m;
  while ((m = attrRe.exec(tag)) !== null) {
    const name = (m[1] || '').toLowerCase();
    if (!name || name === 'link' || name === 'meta') continue;
    attrs[name] = (m[2] ?? m[3] ?? m[4] ?? '').trim();
  }
  return attrs;
}

function cleanRelativeAsset(href) {
  let value = String(href || '').trim();
  if (!value) return '';
  value = value.split('#')[0].split('?')[0];
  try { value = decodeURIComponent(value); } catch (_) {}
  value = value.replace(/\\/g, '/');
  return path.posix.normalize('/' + value).replace(/^\/+/, '');
}

function resolveLocalAsset(relBase, href) {
  const value = String(href || '').trim();
  if (!value) return '';
  if (/^data:/i.test(value)) return value;
  if (/^https?:/i.test(value)) return value;
  if (/^\/\//.test(value)) return 'https:' + value;
  const clean = cleanRelativeAsset(value);
  return clean ? relBase + '/' + clean : '';
}

function resolveLocalManifestPath(baseDir, href) {
  const value = String(href || '').trim();
  if (!value || /^data:/i.test(value) || /^https?:/i.test(value) || /^\/\//.test(value)) return '';
  const clean = cleanRelativeAsset(value);
  return clean ? path.join(baseDir, clean) : '';
}

function resolveExternalAsset(baseUrl, href) {
  const value = String(href || '').trim();
  if (!value) return '';
  if (/^data:/i.test(value)) return value;
  if (/^https?:/i.test(value)) return value;
  if (/^\/\//.test(value)) return 'https:' + value;
  try { return new URL(value, baseUrl).href; } catch (_) { return value; }
}

function scoreHtmlIconCandidate(candidate) {
  const rel = String(candidate.rel || '').toLowerCase();
  const href = String(candidate.href || '').toLowerCase();
  const type = String(candidate.type || '').toLowerCase();
  let score = 0;
  if (/apple-touch-icon/.test(rel)) score += 70;
  else if (/mask-icon/.test(rel)) score += 35;
  else if (/fluid-icon/.test(rel)) score += 25;
  else if (/\bicon\b/.test(rel)) score += 90;
  if (/\bshortcut\b/.test(rel)) score += 18;
  if (/og:image|twitter:image|msapplication|thumbnail|image/.test(rel)) score += 40;
  if (/png/.test(type) || /\.png(?:[?#]|$)/.test(href)) score += 16;
  if (/svg/.test(type) || /\.svg(?:[?#]|$)/.test(href)) score += 14;
  if (/webp/.test(type) || /\.webp(?:[?#]|$)/.test(href)) score += 12;
  if (/ico/.test(type) || /\.ico(?:[?#]|$)/.test(href)) score += 10;
  score += Math.min(parseSizeRank(candidate.sizes), 512 * 512) / 4096;
  return score;
}

function scoreManifestIcon(icon) {
  const purpose = String(icon && icon.purpose || '').toLowerCase();
  const src = String(icon && icon.src || '').toLowerCase();
  const type = String(icon && icon.type || '').toLowerCase();
  let score = parseSizeRank(icon && icon.sizes);
  if (/\bany\b/.test(purpose) || !purpose) score += 500;
  if (/\bmaskable\b/.test(purpose)) score += 250;
  if (/png/.test(type) || /\.png(?:[?#]|$)/.test(src)) score += 120;
  if (/svg/.test(type) || /\.svg(?:[?#]|$)/.test(src)) score += 90;
  if (/ico/.test(type) || /\.ico(?:[?#]|$)/.test(src)) score += 60;
  return score;
}

function parseManifestText(text, resolver) {
  const meta = { name: '', description: '', version: '', icon: '' };
  if (!text) return meta;
  try {
    const manifest = JSON.parse(text);
    meta.name = manifest.short_name || manifest.name || '';
    meta.description = manifest.description || '';
    meta.version = manifest.version ? String(manifest.version) : '';
    if (Array.isArray(manifest.icons) && manifest.icons.length) {
      const best = manifest.icons.slice().sort((a, b) => scoreManifestIcon(b) - scoreManifestIcon(a))[0];
      if (best && best.src) meta.icon = resolver(best.src);
    }
  } catch (_) {}
  return meta;
}

function extractHTMLMeta(html) {
  const meta = { name: '', description: '', version: '', iconHref: '', manifestHref: '' };

  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  if (titleMatch) meta.name = titleMatch[1].trim();

  const iconCandidates = [];
  const linkRe = /<link\b[^>]*>/gi;
  let tag;
  while ((tag = linkRe.exec(html)) !== null) {
    const attrs = parseTagAttributes(tag[0]);
    const rel = String(attrs.rel || '').toLowerCase();
    const href = String(attrs.href || '').trim();
    if (!meta.manifestHref && /\bmanifest\b/.test(rel) && href) meta.manifestHref = href;
    if (!href) continue;
    if (/\bicon\b/.test(rel) || /\bshortcut\b/.test(rel) || /apple-touch-icon/.test(rel) || /mask-icon/.test(rel) || /fluid-icon/.test(rel)) {
      iconCandidates.push({ rel, href, sizes: attrs.sizes || '', type: attrs.type || '', purpose: attrs.purpose || '' });
    }
  }

  const metaRe = /<meta\b[^>]*>/gi;
  while ((tag = metaRe.exec(html)) !== null) {
    const attrs = parseTagAttributes(tag[0]);
    const key = String(attrs.property || attrs.name || attrs.itemprop || '').toLowerCase();
    const content = String(attrs.content || attrs.value || '').trim();
    if (!content) continue;
    if (!meta.description && ['description', 'og:description', 'twitter:description'].includes(key)) meta.description = content;
    if (!meta.name && ['og:title', 'twitter:title', 'application-name', 'apple-mobile-web-app-title'].includes(key)) meta.name = content;
    if (!meta.version && ['version', 'app-version', 'application-version'].includes(key)) meta.version = content;
    if (!meta.version && key === 'generator') meta.version = _pickVersion(content);
    if (['og:image', 'og:image:url', 'twitter:image', 'twitter:image:src', 'msapplication-tileimage', 'msapplication-square150x150logo', 'msapplication-square310x310logo', 'msapplication-wide310x150logo', 'msapplication-square70x70logo', 'thumbnail', 'image'].includes(key)) {
      iconCandidates.push({ rel: key, href: content, sizes: attrs.sizes || '', type: attrs.type || '', purpose: '' });
    }
  }

  if (iconCandidates.length) {
    iconCandidates.sort((a, b) => scoreHtmlIconCandidate(b) - scoreHtmlIconCandidate(a));
    meta.iconHref = iconCandidates[0].href;
  }

  return meta;
}

function pickFallbackIcon(baseDir, relBase) {
  for (const iconName of ICON_NAMES) {
    if (fs.existsSync(path.join(baseDir, iconName))) return relBase + '/' + iconName;
    if (fs.existsSync(path.join(baseDir, 'icons', iconName))) return relBase + '/icons/' + iconName;
  }
  return '';
}

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css':  'text/css; charset=utf-8',
  '.js':   'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png':  'image/png',
  '.jpg':  'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif':  'image/gif',
  '.ico':  'image/x-icon',
  '.svg':  'image/svg+xml',
  '.webp': 'image/webp',
  '.mp3':  'audio/mpeg',
  '.mp4':  'video/mp4',
  '.woff': 'font/woff',
  '.woff2':'font/woff2',
  '.ttf':  'font/ttf',
  '.otf':  'font/otf',
  '.txt':  'text/plain; charset=utf-8',
  '.xml':  'application/xml',
  '.webmanifest': 'application/manifest+json',
};

// ════════════════════════════════════════════
//  สแกนโฟลเดอร์ (เรียกทุกครั้งที่มี request — real-time)
// ════════════════════════════════════════════
function scanApps() {
  const apps = [];
  for (const category of CATEGORIES) {
    const catDir = path.join(ROOT, category);
    if (!fs.existsSync(catDir)) continue;

    let entries;
    try { entries = fs.readdirSync(catDir, { withFileTypes: true }); }
    catch (_) { continue; }

    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      const appDir  = path.join(catDir, entry.name);
      const relBase = category + '/' + entry.name;

      let name = entry.name, description = '', version = '', author = 'BEAM', icon = '';
      const appUrl = relBase + '/index.html';

      // 1) index.html → title/description/icon/manifest link
      const indexPath = path.join(appDir, 'index.html');
      let linkedManifestPath = '';
      if (fs.existsSync(indexPath)) {
        try {
          const html = fs.readFileSync(indexPath, 'utf8');
          const htmlMeta = extractHTMLMeta(html);
          if (name === entry.name) name = htmlMeta.name || name;
          if (!description) description = htmlMeta.description || '';
          if (!version) version = htmlMeta.version || version;
          if (!icon && htmlMeta.iconHref) icon = resolveLocalAsset(relBase, htmlMeta.iconHref);
          linkedManifestPath = resolveLocalManifestPath(appDir, htmlMeta.manifestHref);
        } catch (_) {}
      }

      // 2) linked manifest + manifest.json
      const manifestCandidates = [];
      if (linkedManifestPath) manifestCandidates.push(linkedManifestPath);
      manifestCandidates.push(path.join(appDir, 'manifest.json'));
      for (const manifestPath of [...new Set(manifestCandidates)]) {
        if (!manifestPath || !fs.existsSync(manifestPath)) continue;
        const manifestMeta = parseManifestText(fs.readFileSync(manifestPath, 'utf8'), src => resolveLocalAsset(relBase, src));
        if (name === entry.name) name = manifestMeta.name || name;
        if (!description) description = manifestMeta.description || description;
        if (!version) version = manifestMeta.version || version;
        if (!icon) icon = manifestMeta.icon || icon;
      }

      // 3) package.json (fallback)
      const pkgPath = path.join(appDir, 'package.json');
      if (fs.existsSync(pkgPath)) {
        try {
          const p = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
          if (name === entry.name) name = p.name || name;
          if (!description)  description = p.description || '';
          if (!version)      version     = p.version || '';
          if (author === 'BEAM') {
            author = (typeof p.author === 'string' ? p.author : (p.author && p.author.name)) || author;
          }
        } catch (_) {}
      }

      // 4) ค้นหา icon ถ้ายังไม่มี
      if (!icon) {
        icon = pickFallbackIcon(appDir, relBase);
      }

      // 5) Smart version scan ถ้ายังไม่ได้ version จาก manifest/package
      if (!version) version = smartVersionFromDir(appDir);

      apps.push({ id: entry.name, name, description, category, icon, url: appUrl, version, author });
    }
  }
  return apps;
}

// ════════════════════════════════════════════
//  สแกนโฟลเดอร์ local-websites/ — เว็บโปรเจคท้องถิ่น
// ════════════════════════════════════════════
function scanLocalWebsites() {
  if (!fs.existsSync(LOCAL_WEBSITES_DIR)) return [];
  const results = [];
  let entries;
  try { entries = fs.readdirSync(LOCAL_WEBSITES_DIR, { withFileTypes: true }); }
  catch (_) { return []; }

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const siteDir = path.join(LOCAL_WEBSITES_DIR, entry.name);
    const relBase = 'local-websites/' + entry.name;
    let name = entry.name, description = '', icon = '', version = '';

    // 1) index.html — ดึง title, description, icon, linked manifest
    const htmlPath = path.join(siteDir, 'index.html');
    let linkedManifestPath = '';
    if (fs.existsSync(htmlPath)) {
      try {
        const html = fs.readFileSync(htmlPath, 'utf8');
        const htmlMeta = extractHTMLMeta(html);
        if (name === entry.name) name = htmlMeta.name || name;
        if (!description) description = htmlMeta.description || '';
        if (!version) version = htmlMeta.version || '';
        if (!icon && htmlMeta.iconHref) icon = resolveLocalAsset(relBase, htmlMeta.iconHref);
        linkedManifestPath = resolveLocalManifestPath(siteDir, htmlMeta.manifestHref);
      } catch (_) {}
    }

    // 2) linked manifest + manifest.json
    const manifestCandidates = [];
    if (linkedManifestPath) manifestCandidates.push(linkedManifestPath);
    manifestCandidates.push(path.join(siteDir, 'manifest.json'));
    for (const manifestPath of [...new Set(manifestCandidates)]) {
      if (!manifestPath || !fs.existsSync(manifestPath)) continue;
      const manifestMeta = parseManifestText(fs.readFileSync(manifestPath, 'utf8'), src => resolveLocalAsset(relBase, src));
      if (name === entry.name) name = manifestMeta.name || name;
      if (!description) description = manifestMeta.description || description;
      if (!version) version = manifestMeta.version || version;
      if (!icon) icon = manifestMeta.icon || icon;
    }

    // 3) fallback: common icon filenames
    if (!icon) {
      icon = pickFallbackIcon(siteDir, relBase);
    }

    // 4) Smart version scan ถ้ายังไม่ได้
    if (!version) version = smartVersionFromDir(siteDir);

    results.push({
      id:          'localweb_' + entry.name,
      name,
      description: description || 'เว็บไซต์ภายใน',
      category:    'local-websites',
      icon,
      url:         relBase + '/index.html',
      version,
      author:      'BEAM',
      external:    false
    });
  }
  return results;
}

// ════════════════════════════════════════════
//  สแกนโฟลเดอร์ websites/ — อ่าน URL จากไฟล์ทุกนามสกุล
// ════════════════════════════════════════════
const URL_RE = /https?:\/\/[^\s<>"']+/gi;

// cache  {url → {name, icon, description, fetchedAt}}
const _metaCache = new Map();
const META_TTL   = 5 * 60 * 1000;  // 5 นาที

function scanWebsiteFiles() {
  // อ่านไฟล์ทุกตัวในโฟลเดอร์ websites/ แล้วดึง URL
  if (!fs.existsSync(WEBSITES_DIR)) return [];
  const urls = new Set();
  let entries;
  try { entries = fs.readdirSync(WEBSITES_DIR, { withFileTypes: true }); }
  catch (_) { return []; }
  for (const entry of entries) {
    if (!entry.isFile()) continue;
    try {
      const content = fs.readFileSync(path.join(WEBSITES_DIR, entry.name), 'utf8');
      const found = content.match(URL_RE) || [];
      found.forEach(u => urls.add(u.replace(/#.*$/, '')));  // เอาแค่ base URL
    } catch (_) {}
  }
  return [...urls];
}

function fetchHTML(targetUrl, _redirects) {
  if (!_redirects) _redirects = 0;
  if (_redirects > 3) return Promise.resolve('');
  return new Promise((resolve) => {
    const timer = setTimeout(() => { resolve(''); }, 5000); // 5s hard max
    try {
      const mod = targetUrl.startsWith('https') ? https : http;
      const req = mod.get(targetUrl, { timeout: 4000, headers: { 'User-Agent': 'BeamAppStore/1.0' } }, (res) => {
        if ((res.statusCode === 301 || res.statusCode === 302) && res.headers.location) {
          clearTimeout(timer);
          res.resume(); // drain
          fetchHTML(res.headers.location, _redirects + 1).then(resolve);
          return;
        }
        if (res.statusCode !== 200) { clearTimeout(timer); res.resume(); resolve(''); return; }
        let body = '';
        res.setEncoding('utf8');
        res.on('data', c => { body += c; if (body.length > 50000) { res.destroy(); clearTimeout(timer); resolve(body); } });
        res.on('end', () => { clearTimeout(timer); resolve(body); });
        res.on('error', () => { clearTimeout(timer); resolve(''); });
      });
      req.on('error', () => { clearTimeout(timer); resolve(''); });
      req.on('timeout', () => { req.destroy(); clearTimeout(timer); resolve(''); });
    } catch (_) { clearTimeout(timer); resolve(''); }
  });
}

function parseMetaFromHTML(html, siteUrl) {
  const htmlMeta = extractHTMLMeta(html);
  let icon = htmlMeta.iconHref ? resolveExternalAsset(siteUrl, htmlMeta.iconHref) : '';
  if (!icon) {
    try {
      const base = new URL(siteUrl);
      icon = base.origin + '/favicon.ico';
    } catch (_) {}
  }
  return {
    name: htmlMeta.name,
    description: htmlMeta.description,
    icon,
    version: htmlMeta.version,
    manifestUrl: htmlMeta.manifestHref ? resolveExternalAsset(siteUrl, htmlMeta.manifestHref) : ''
  };
}

async function fetchMeta(siteUrl) {
  const cached = _metaCache.get(siteUrl);
  if (cached && (Date.now() - cached.fetchedAt < META_TTL)) {
    return cached;
  }
  try {
    const html = await fetchHTML(siteUrl);
    const meta = parseMetaFromHTML(html, siteUrl);
    const manifestUrl = meta.manifestUrl || (() => {
      try { return new URL('/manifest.json', siteUrl).href; } catch (_) { return ''; }
    })();
    if (manifestUrl) {
      const manifestText = await fetchHTML(manifestUrl);
      if (manifestText) {
        const manifestMeta = parseManifestText(manifestText, src => resolveExternalAsset(manifestUrl, src));
        if (!meta.name) meta.name = manifestMeta.name;
        if (!meta.description) meta.description = manifestMeta.description;
        if (!meta.icon) meta.icon = manifestMeta.icon;
        if (!meta.version) meta.version = manifestMeta.version;
      }
    }
    meta.fetchedAt = Date.now();
    _metaCache.set(siteUrl, meta);
    return meta;
  } catch (_) {
    return { name: '', description: '', icon: '', version: '', fetchedAt: Date.now() };
  }
}

async function scanWebsites() {
  const urls = scanWebsiteFiles();
  const results = [];
  // fetch เป็นชุดพร้อมกัน (max 5 concurrent)
  const chunks = [];
  for (let i = 0; i < urls.length; i += 5) {
    chunks.push(urls.slice(i, i + 5));
  }
  for (const chunk of chunks) {
    const fetched = await Promise.all(chunk.map(async u => {
      const meta = await fetchMeta(u);
      // สร้าง id จาก URL
      let id;
      try { id = new URL(u).pathname.replace(/\//g, '').replace(/[^a-zA-Z0-9_-]/g, '') || new URL(u).hostname; }
      catch (_) { id = u; }
      return {
        id:          'web_' + id,
        name:        meta.name || u,
        description: meta.description || 'เว็บไซต์ภายนอก',
        category:    'websites',
        icon:        meta.icon || '',
        url:         u,
        version:     '',
        author:      'BEAM',
        external:    true
      };
    }));
    results.push(...fetched);
  }
  return results;
}

// ════════════════════════════════════════════
//  HTTP Server
// ════════════════════════════════════════════
const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url);
  let pathname = parsedUrl.pathname || '/';

  // Decode URL (ป้องกัน encoded path traversal)
  try { pathname = decodeURIComponent(pathname); }
  catch (_) { res.writeHead(400); res.end('Bad Request'); return; }

  // Normalize (ป้องกัน ../../)
  pathname = '/' + path.normalize(pathname).replace(/\\/g, '/').replace(/^\/+/, '');

  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return; }

  // ─── API endpoint: real-time scan ───────────────────────────────
  if (pathname === '/api/apps') {
    const localApps    = scanApps();
    const localWebApps = scanLocalWebsites();
    // Wrap scanWebsites with a 10s timeout so API never hangs
    const webPromise = Promise.race([
      scanWebsites(),
      new Promise(r => setTimeout(() => r([]), 10000))
    ]);
    webPromise.then(webApps => {
      const apps = [...localApps, ...localWebApps, ...webApps];
      const payload = JSON.stringify({
        apps,
        total: apps.length,
        lastUpdated: new Date().toISOString(),
        source: 'live-scan'
      }, null, 2);
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.setHeader('Cache-Control', 'no-store, no-cache');
      res.end(payload);
    }).catch(() => {
      const allLocal = [...localApps, ...localWebApps];
      const payload = JSON.stringify({ apps: allLocal, total: allLocal.length, lastUpdated: new Date().toISOString(), source: 'live-scan' });
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.end(payload);
    });
    return;
  }

  // ─── Static files ───────────────────────────────────────────────
  if (pathname === '/') pathname = '/index.html';

  // Security: prevent path traversal
  const filePath = path.join(ROOT, pathname);
  const relative = path.relative(ROOT, filePath);
  if (relative.startsWith('..') || path.isAbsolute(relative)) {
    res.writeHead(403); res.end('Forbidden'); return;
  }

  let stat;
  try { stat = fs.statSync(filePath); }
  catch (_) { res.writeHead(404); res.end('Not Found'); return; }

  if (stat.isDirectory()) {
    const idx = path.join(filePath, 'index.html');
    if (fs.existsSync(idx)) {
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.end(fs.readFileSync(idx));
    } else {
      res.writeHead(404); res.end('Not Found');
    }
    return;
  }

  const ext = path.extname(filePath).toLowerCase();
  res.setHeader('Content-Type', MIME[ext] || 'application/octet-stream');
  res.end(fs.readFileSync(filePath));
});

// ════════════════════════════════════════════
//  เริ่มต้น server
// ════════════════════════════════════════════
server.listen(PORT, '127.0.0.1', () => {
  console.log('');
  console.log('╔═══════════════════════════════════════════════════╗');
  console.log('║   Download App X Beam — Server พร้อมใช้งาน! 🚀    ║');
  console.log('╠═══════════════════════════════════════════════════╣');
  console.log(`║  🌐  http://localhost:${PORT}                           ║`);
  console.log('║  �  วางโฟลเดอร์ใน  applications/ / games/          ║');
  console.log('║  🏠  วางโปรเจคเว็บใน  local-websites/                 ║');
  console.log('║  🌐  วางไฟล์ลิงก์ใน  websites/ (txt หรือไฟล์ใดก็ได้) ║');
  console.log('║  🔄  รีโหลดหน้าเว็บ → แอปปรากฏ/หายอัตโนมัติ!      ║');
  console.log('║  ⛔  Ctrl+C เพื่อหยุด server                        ║');
  console.log('╚═══════════════════════════════════════════════════╝');
  console.log('');
  // แสดงแอปที่พบตอนเริ่ม
  const apps       = scanApps();
  const localWebs  = scanLocalWebsites();
  const webUrls    = scanWebsiteFiles();
  if (apps.length) {
    console.log(`✅ พบแอป/เกม ${apps.length} รายการ:`);
    apps.forEach(a => console.log(`   • ${a.name}  (${a.category}/${a.id})`));
  }
  if (localWebs.length) {
    console.log(`🏠 พบเว็บไซต์ภายใน ${localWebs.length} รายการ:`);
    localWebs.forEach(a => console.log(`   • ${a.name}  (local-websites/${a.id})`));
  }
  if (webUrls.length) {
    console.log(`🌐 พบเว็บไซต์ภายนอก ${webUrls.length} ลิงก์:`);
    webUrls.forEach(u => console.log(`   • ${u}`));
  }
  if (!apps.length && !localWebs.length && !webUrls.length) {
    console.log('ℹ️  ยังไม่มีอะไร — วางโฟลเดอร์ใน applications/ local-websites/ หรือไฟล์ลิงก์ใน websites/');
  }
  console.log('');
});

server.on('error', (e) => {
  if (e.code === 'EADDRINUSE') {
    console.error(`\n❌ พอร์ต ${PORT} ถูกใช้งานอยู่แล้ว`);
    console.error(`   ลองปิดโปรแกรมที่ใช้พอร์ต ${PORT} หรือเปลี่ยน PORT ในไฟล์นี้\n`);
  } else {
    console.error('\n❌ เกิดข้อผิดพลาด:', e.message);
  }
  process.exit(1);
});
