#!/usr/bin/env node
/* ══════════════════════════════════════════════════════════════
   scan.js — ตรวจจับแอปพลิเคชัน + เว็บไซต์อัตโนมัติ
   วิธีใช้:  node scan.js
   สแกนโฟลเดอร์ applications/, games/, local-websites/, websites/
   แล้วสร้าง catalog.json
   ══════════════════════════════════════════════════════════════ */

const fs    = require('fs');
const path  = require('path');
const http  = require('http');
const https = require('https');

const CATEGORIES = ['applications', 'games'];
const WEBSITES_DIR       = path.join(__dirname, 'websites');
const LOCAL_WEBSITES_DIR = path.join(__dirname, 'local-websites');
const ICON_NAMES = [
  'favicon-512.png','favicon-192.png','favicon-touch.png',
  'apple-touch-icon.png','apple-touch-icon-precomposed.png',
  'favicon-96x96.png','favicon-48x48.png','favicon-32x32.png','favicon-16x16.png',
  'icon-512.png','icon-192.png','icon.png','logo.png',
  'favicon.png','favicon.ico','icon.svg','logo.svg','mask-icon.svg'
];

const VSTR_RE = /\bv?(\d+\.\d+(?:\.\d+)*(?:[-+][a-zA-Z0-9._-]*)?)\b/;

function pickVersion(text) {
  if (!text) return '';
  const jsonVer = text.match(/"version"\s*:\s*"([^"]{1,40})"/);
  if (jsonVer) return jsonVer[1].trim();
  const assignVer = text.match(/\bversion\s*[=:]\s*['"]([^'"]{1,40})['"]?/i);
  if (assignVer) return assignVer[1].trim();
  const generic = text.match(VSTR_RE);
  return generic ? generic[1].trim() : '';
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
  const meta = {
    name: '',
    description: '',
    version: '',
    iconHref: '',
    manifestHref: ''
  };

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
    if (!meta.version && key === 'generator') meta.version = pickVersion(content);

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
  for (const iname of ICON_NAMES) {
    if (fs.existsSync(path.join(baseDir, iname))) return relBase + '/' + iname;
    if (fs.existsSync(path.join(baseDir, 'icons', iname))) return relBase + '/icons/' + iname;
  }
  return '';
}

function scanFolder(catDir, category) {
  const results = [];
  if (!fs.existsSync(catDir)) return results;

  const entries = fs.readdirSync(catDir, { withFileTypes: true });
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const appDir  = path.join(catDir, entry.name);
    const appId   = entry.name;
    const relBase = category + '/' + entry.name;

    let name = appId;
    let description = '';
    let version = '';
    let author = 'BEAM';
    let icon = '';
    let url = relBase + '/index.html';

    // 1) ลอง index.html → <title>, <meta description>, icon, manifest link
    const indexFile = path.join(appDir, 'index.html');
    let linkedManifestPath = '';
    if (fs.existsSync(indexFile)) {
      try {
        const html = fs.readFileSync(indexFile, 'utf8');
        const htmlMeta = extractHTMLMeta(html);
        if (!name || name === appId) name = htmlMeta.name || name;
        if (!description) description = htmlMeta.description || '';
        if (!version) version = htmlMeta.version || '';
        if (!icon && htmlMeta.iconHref) icon = resolveLocalAsset(relBase, htmlMeta.iconHref);
        linkedManifestPath = resolveLocalManifestPath(appDir, htmlMeta.manifestHref);
      } catch (_) {}
    }

    // 2) ลอง manifest ที่ลิงก์ใน HTML และ manifest.json ปกติ
    const manifestCandidates = [];
    if (linkedManifestPath) manifestCandidates.push(linkedManifestPath);
    manifestCandidates.push(path.join(appDir, 'manifest.json'));
    for (const manifestPath of [...new Set(manifestCandidates)]) {
      if (!manifestPath || !fs.existsSync(manifestPath)) continue;
      const manifestMeta = parseManifestText(fs.readFileSync(manifestPath, 'utf8'), src => resolveLocalAsset(relBase, src));
      if (!name || name === appId) name = manifestMeta.name || name;
      if (!description) description = manifestMeta.description || description;
      if (!version) version = manifestMeta.version || version;
      if (!icon) icon = manifestMeta.icon || icon;
    }

    // 3) ลอง package.json
    const pkg = path.join(appDir, 'package.json');
    if (fs.existsSync(pkg)) {
      try {
        const p = JSON.parse(fs.readFileSync(pkg, 'utf8'));
        if (!name || name === appId) name = p.name || name;
        if (!description) description = p.description || '';
        if (!version) version = p.version || '';
        if (p.author) author = typeof p.author === 'string' ? p.author : (p.author.name || author);
      } catch(e) {}
    }

    // 4) ค้นหา icon อัตโนมัติ (ถ้ายังไม่มี)
    if (!icon) {
      icon = pickFallbackIcon(appDir, relBase);
    }

    // 5) ตรวจว่ามี index.html
    if (!fs.existsSync(indexFile)) {
      console.log(`  ⚠️ ข้าม ${appId}: ไม่พบ index.html`);
      continue;
    }

    results.push({ id: appId, name, description, category, icon, url, version, author });
    console.log(`  ✅ ${name} (${category}/${appId})`);
  }
  return results;
}

// ═══════ สแกน local-websites/ ═══════
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

    // index.html
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
    } else {
      continue; // ข้ามถ้าไม่มี index.html
    }

    // manifest ที่ลิงก์ใน HTML และ manifest.json ปกติ
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

    // fallback icon
    if (!icon) {
      icon = pickFallbackIcon(siteDir, relBase);
    }

    results.push({
      id: 'localweb_' + entry.name, name,
      description: description || 'เว็บไซต์ภายใน',
      category: 'local-websites', icon,
      url: relBase + '/index.html', version, author: 'BEAM'
    });
    console.log(`  ✅ ${name} (local-websites/${entry.name})`);
  }
  return results;
}

// ═══════ Fetch HTML จาก URL ภายนอก (ตาม redirect สูงสุด 3 ครั้ง) ═══════
function fetchHTML(targetUrl, _redirects) {
  if (!_redirects) _redirects = 0;
  if (_redirects > 3) return Promise.resolve('');
  return new Promise((resolve) => {
    const timer = setTimeout(() => resolve(''), 6000);
    try {
      const mod = targetUrl.startsWith('https') ? https : http;
      const req = mod.get(targetUrl, { timeout: 5000, headers: { 'User-Agent': 'BeamAppStore/1.0' } }, (res) => {
        if ((res.statusCode === 301 || res.statusCode === 302) && res.headers.location) {
          clearTimeout(timer);
          res.resume();
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

// ═══════ ดึง metadata จาก HTML ═══════
function parseMetaFromHTML(html, siteUrl) {
  const htmlMeta = extractHTMLMeta(html);
  let icon = htmlMeta.iconHref ? resolveExternalAsset(siteUrl, htmlMeta.iconHref) : '';
  if (!icon) {
    try { icon = new URL(siteUrl).origin + '/favicon.ico'; } catch (_) {}
  }
  return {
    name: htmlMeta.name,
    description: htmlMeta.description,
    icon,
    version: htmlMeta.version,
    manifestUrl: htmlMeta.manifestHref ? resolveExternalAsset(siteUrl, htmlMeta.manifestHref) : ''
  };
}

// ═══════ สแกน websites/ — อ่าน URL จากไฟล์ทุกตัว แล้ว fetch metadata ═══════
const URL_RE = /https?:\/\/[^\s<>"']+/gi;

function readWebsiteURLs() {
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
      found.forEach(u => urls.add(u.replace(/#.*$/, '')));
    } catch (_) {}
  }
  return [...urls];
}

async function scanWebsites() {
  const urls = readWebsiteURLs();
  if (!urls.length) return [];
  const results = [];

  // fetch 5 พร้อมกัน
  const chunks = [];
  for (let i = 0; i < urls.length; i += 5) chunks.push(urls.slice(i, i + 5));

  for (const chunk of chunks) {
    const fetched = await Promise.all(chunk.map(async u => {
      let meta = { name: '', description: '', icon: '', version: '', manifestUrl: '' };
      try {
        const html = await fetchHTML(u);
        if (html) {
          meta = parseMetaFromHTML(html, u);
          const manifestUrl = meta.manifestUrl || (() => {
            try { return new URL('/manifest.json', u).href; } catch (_) { return ''; }
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
        }
      } catch (_) {}
      let id;
      try { id = new URL(u).pathname.replace(/\//g, '').replace(/[^a-zA-Z0-9_-]/g, '') || new URL(u).hostname; }
      catch (_) { id = u.replace(/[^a-zA-Z0-9]/g, '').substring(0, 30); }
      const name = meta.name || u;
      console.log(`  ${meta.name ? '✅' : '⚠️'} ${name}`);
      return {
        id: 'web_' + id, name,
        description: meta.description || 'เว็บไซต์ภายนอก',
        category: 'websites',
        icon: meta.icon || '',
        url: u, version: meta.version || '', author: 'BEAM', external: true
      };
    }));
    results.push(...fetched);
  }
  return results;
}

// ═══════ Main (async) ═══════
async function main() {
  console.log('🔍 สแกนแอปพลิเคชัน เกม และเว็บไซต์...\n');
  const allApps = [];

  for (const cat of CATEGORIES) {
    const catDir = path.join(__dirname, cat);
    console.log(`📁 สแกน ${cat}/`);
    const found = scanFolder(catDir, cat);
    allApps.push(...found);
    if (!found.length) console.log('  (ว่าง)');
  }

  // local-websites
  console.log(`📁 สแกน local-websites/`);
  const localWebs = scanLocalWebsites();
  allApps.push(...localWebs);
  if (!localWebs.length) console.log('  (ว่าง)');

  // websites (external) — fetch metadata จากอินเทอร์เน็ต
  console.log(`🌐 สแกน websites/ (ดึงข้อมูลจากเว็บภายนอก...)`);
  const webApps = await scanWebsites();
  allApps.push(...webApps);
  if (!webApps.length) console.log('  (ว่าง)');

  const catalogData = {
    lastUpdated: new Date().toISOString(),
    generatedBy: 'scan.js',
    apps: allApps
  };

  const outFile = path.join(__dirname, 'catalog.json');
  fs.writeFileSync(outFile, JSON.stringify(catalogData, null, 2), 'utf8');
  console.log(`\n✨ สร้าง catalog.json สำเร็จ! (${allApps.length} รายการ: ${allApps.filter(a=>a.category==='applications').length} แอป, ${allApps.filter(a=>a.category==='games').length} เกม, ${localWebs.length} เว็บภายใน, ${webApps.length} เว็บภายนอก)`);
  console.log('\n📌 วิธีเพิ่ม:');
  console.log('   แอป/เกม     → วางโฟลเดอร์ใน applications/ หรือ games/');
  console.log('   เว็บภายใน    → วางโฟลเดอร์ใน local-websites/');
  console.log('   เว็บภายนอก   → เพิ่ม URL ในไฟล์ websites/*.txt');
  console.log('   จากนั้นรัน: node scan.js');
}

main();
