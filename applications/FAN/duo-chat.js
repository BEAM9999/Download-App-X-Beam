'use strict';
/* ═══════════════════════════════════════════════════════════
   FAN Duo Chat – duo-chat.js
   บีม เก๊ & เนย เก๊ คุยกันเอง – ผู้ใช้สวมบทได้
   ═══════════════════════════════════════════════════════════ */

(function () {
  if (!window.__DUO_MODE__) return;

  // ─── Duo State ─────────────────────────────────────────
  let duoSide = null;          // 'beam' | 'noey' — ฝั่งปัจจุบันที่ผู้ใช้สวมบท
  let duoStopped = false;      // true = หยุดการตอบโต้อัตโนมัติ
  let duoAutoTimer = null;     // setTimeout id สำหรับ auto continue
  let duoRespondingSide = null; // track which side is currently generating (for appendBotChunk)
  const DUO_STORE_KEY = 'fan_duo_';

  // ─── Override persona to always use beam (primary) for shared settings ──
  // But we need BOTH personas available
  const beamPersona = PERSONAS.beam;
  const noeyPersona = PERSONAS.noey;

  // ─── DOM Helpers ───────────────────────────────────────
  const $ = id => document.getElementById(id);

  // ─── Randomly assign starting side ─────────────────────
  function randomSide() {
    return Math.random() < 0.5 ? 'beam' : 'noey';
  }

  function setSide(side) {
    duoSide = side;
    const beamBtn = $('duoBtnBeam');
    const noeyBtn = $('duoBtnNoey');
    beamBtn.classList.toggle('active', side === 'beam');
    noeyBtn.classList.toggle('active', side === 'noey');
    const input = $('msgInput');
    input.placeholder = side === 'beam'
      ? 'พิมพ์เป็น บีม เก๊ 👦...'
      : 'พิมพ์เป็น เนย เก๊ 👧...';
    saveDuoState();
  }

  function otherSide(side) {
    return side === 'beam' ? 'noey' : 'beam';
  }

  function getPersona(side) {
    return side === 'beam' ? beamPersona : noeyPersona;
  }

  // ─── Stop / Play ───────────────────────────────────────
  function setStopState(stopped) {
    duoStopped = stopped;
    const btn = $('duoBtnStop');
    if (stopped) {
      btn.textContent = '▶️';
      btn.title = 'เริ่มคุยต่อ';
      btn.classList.add('stopped');
      btn.classList.remove('playing');
      clearTimeout(duoAutoTimer);
    } else {
      btn.textContent = '⏸️';
      btn.title = 'หยุดคุย';
      btn.classList.remove('stopped');
      btn.classList.add('playing');
    }
    saveDuoState();
  }

  // ─── Persistence ───────────────────────────────────────
  function saveDuoState() {
    localStorage.setItem(DUO_STORE_KEY + 'side', duoSide || '');
    localStorage.setItem(DUO_STORE_KEY + 'stopped', duoStopped ? '1' : '0');
  }
  function loadDuoState() {
    const side = localStorage.getItem(DUO_STORE_KEY + 'side');
    const stopped = localStorage.getItem(DUO_STORE_KEY + 'stopped') === '1';
    return { side: side || null, stopped };
  }

  // ─── Build messages for a specific side ────────────────
  function buildDuoMessages(session, respondingSide) {
    const pe = getPersona(respondingSide);
    const otherPe = getPersona(otherSide(respondingSide));

    const now = new Date();
    const thM = ['มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน', 'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'];
    const thDay = ['วันอาทิตย์', 'วันจันทร์', 'วันอังคาร', 'วันพุธ', 'วันพฤหัสบดี', 'วันศุกร์', 'วันเสาร์'];
    const beamAge = now.getFullYear() - 2004 - (now < new Date(now.getFullYear(), 9, 28) ? 1 : 0);
    const noeyAge = now.getFullYear() - 2007 - (now < new Date(now.getFullYear(), 11, 12) ? 1 : 0);
    const annivDays = Math.floor((now - new Date(2023, 0, 7)) / 86400000);
    const annivYears = Math.floor(annivDays / 365.25);
    const annivMonths = Math.floor(((annivDays % 365.25)) / 30.44);
    const pad = n => String(n).padStart(2, '0');

    const dateCtx = `[ข้อมูลปัจจุบัน
วันนี้: ${thDay[now.getDay()]} ${now.getDate()} ${thM[now.getMonth()]} ${now.getFullYear() + 543} (ค.ศ.${now.getFullYear()})
เวลาตอนนี้: ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())} น.
อายุบีมตอนนี้: ${beamAge} ปี | อายุเนยตอนนี้: ${noeyAge} ปี
คบกันมาแล้ว: ${annivYears} ปี ${annivMonths} เดือน (${annivDays} วัน)]

[โหมด: แชทคู่จำลอง — คุณคือ "${pe.name}" กำลังคุยกับ "${otherPe.name}" (แฟนของคุณ)
- พิมพ์ตอบโต้ให้เป็นธรรมชาติเหมือนคู่รักวัยรุ่นไทยคุยกัน
- ต่อบทสนทนาจากข้อความก่อนหน้า อย่าพูดซ้ำ
- ตอบ 1-3 ประโยค สั้น กระชับ เป็นธรรมชาติ]`;

    // Resolve prompt with live age
    const currentAge = respondingSide === 'beam' ? beamAge : noeyAge;
    const sysPrompt = pe.systemPrompt.replace(/อายุ \d+ ปี/, `อายุ ${currentAge} ปี`);

    const msgs = [{ role: 'system', content: sysPrompt + '\n\n' + dateCtx }];

    // Convert session messages to alternating user/assistant from this side's POV
    for (const m of session.messages) {
      if (m.duoSide === respondingSide) {
        // This side's messages are "assistant" (it said them previously)
        msgs.push({ role: 'assistant', content: m.content });
      } else if (m.role === 'director') {
        // Director instructions from user
        msgs.push({ role: 'user', content: '[คำสั่งจากผู้ควบคุม: ' + m.content + ']' });
      } else {
        // Other side's messages are "user" (the chat partner said them)
        msgs.push({ role: 'user', content: m.content });
      }
    }

    return msgs;
  }

  function buildDuoGeminiPayload(session, respondingSide) {
    const sourceMessages = buildDuoMessages(session, respondingSide);
    const systemChunks = [];
    const contents = [];

    for (const msg of sourceMessages) {
      if (msg.role === 'system') {
        systemChunks.push(msg.content);
        continue;
      }
      const role = msg.role === 'assistant' ? 'model' : 'user';
      // Merge consecutive same-role messages (Gemini requires alternating roles)
      const prev = contents[contents.length - 1];
      if (prev && prev.role === role) {
        prev.parts.push({ text: msg.content });
      } else {
        contents.push({ role, parts: [{ text: msg.content }] });
      }
    }

    // Ensure at least one user message
    if (!contents.length || contents[contents.length - 1].role !== 'user') {
      contents.push({ role: 'user', parts: [{ text: 'สวัสดี' }] });
    }

    const payload = {
      contents,
      generationConfig: {
        maxOutputTokens: 512,
        temperature: 0.85,
        topP: 0.95
      }
    };

    if (systemChunks.length) {
      payload.systemInstruction = { parts: [{ text: systemChunks.join('\n\n') }] };
    }
    return payload;
  }

  // ─── AI Response for a specific side ───────────────────
  async function duoRequestGemini(session, respondingSide) {
    if (!getGeminiKeySlots().length) {
      throw new Error('ยังไม่ได้กรอก Gemini API Key');
    }
    const preferredModelId = getSelectedModelId('gemini');
    let route = getGeminiRouteFromCache(preferredModelId);
    if (!route) route = await findGeminiRoute(preferredModelId, { allowOtherModels: true });
    if (!route) throw new Error('Gemini ทุกโมเดลไม่มีโควต้าในตอนนี้');

    applyGeminiRoute(route, { skipRender: true });

    const res = await fetch(`${GEMINI_BASE_URL}/${encodeURIComponent(route.modelId)}:generateContent?key=${encodeURIComponent(route.key)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(buildDuoGeminiPayload(session, respondingSide)),
      signal: abortCtrl.signal
    });

    if (!res.ok) {
      const err = await readErrorResponse(res);
      throw new Error(`Gemini ${res.status}: ${err.message}`);
    }

    const json = await res.json();
    return extractGeminiText(json);
  }

  async function duoRequestOpenRouter(session, respondingSide) {
    const messages = buildDuoMessages(session, respondingSide);
    const excludeIds = new Set();

    for (const model of getOrderedOpenRouterModels(getSelectedModelId('openrouter'), excludeIds)) {
      if (!model.key || !model.modelId) continue;

      applyOpenRouterRoute(model, { skipRender: true });

      const res = await fetch(OPENROUTER_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${model.key}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': location.href,
          'X-Title': 'FAN Duo Chat'
        },
        body: JSON.stringify({
          model: model.modelId,
          messages,
          stream: true,
          max_tokens: 512,
          temperature: 0.80,
          top_p: 0.9,
          frequency_penalty: 0.7,
          repetition_penalty: 1.15
        }),
        signal: abortCtrl.signal
      });

      if (!res.ok) {
        const err = await readErrorResponse(res);
        excludeIds.add(model.id);
        if (isOpenRouterRetryableError(res.status, err.message)) continue;
        throw new Error(`OpenRouter ${res.status}: ${err.message}`);
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let fullText = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || !trimmed.startsWith('data: ')) continue;
          const data = trimmed.slice(6);
          if (data === '[DONE]') continue;
          try {
            const json = JSON.parse(data);
            const token = json.choices?.[0]?.delta?.content;
            if (token) {
              fullText += token;
              appendBotChunk(fullText);
            }
          } catch (_) {}
        }
      }

      return fullText;
    }

    throw new Error('ไม่มี OpenRouter model/API key ที่พร้อมใช้งาน');
  }

  async function duoSendToAI(session, respondingSide) {
    if (isGenerating) return;
    isGenerating = true;
    duoRespondingSide = respondingSide;
    abortCtrl = new AbortController();

    const pe = getPersona(respondingSide);
    $('typingIndicator').classList.add('active');
    const whoEl = $('typingWho');
    if (whoEl) whoEl.textContent = pe.name;
    updateSendBtn();

    try {
      const fullText = selectedPlatform === 'gemini'
        ? await duoRequestGemini(session, respondingSide)
        : await duoRequestOpenRouter(session, respondingSide);

      if (fullText) {
        const { text: cleanText, actions } = extractWidgetActions(fullText);
        const botMsg = {
          role: 'assistant',
          content: cleanText || fullText,
          ts: Date.now(),
          duoSide: respondingSide
        };
        session.messages.push(botMsg);
        finalizeDuoMsg(botMsg.content, botMsg.ts, respondingSide);
        sfxAiDone();
        save();
        if (actions.length) fireWidgetActions(actions, session);

        // Auto-continue: the other side replies after a delay
        if (!duoStopped) {
          const nextSide = otherSide(respondingSide);
          duoAutoTimer = setTimeout(() => {
            if (!duoStopped && !isGenerating) {
              duoSendToAI(session, nextSide);
            }
          }, 1500 + Math.random() * 2000);
        }
      }
    } catch (err) {
      if (err.name === 'AbortError') return;
      const errMsg = '❌ ขอโทษนะ เกิดข้อผิดพลาด: ' + err.message;
      session.messages.push({ role: 'assistant', content: errMsg, ts: Date.now(), duoSide: respondingSide });
      renderDuoMessages();
      save();
    } finally {
      isGenerating = false;
      duoRespondingSide = null;
      abortCtrl = null;
      $('typingIndicator').classList.remove('active');
      if ($('typingWho')) $('typingWho').textContent = '';
      updateSendBtn();
    }
  }

  // ─── Duo Render Messages ───────────────────────────────
  function renderDuoMessages() {
    const el = $('messages');
    const session = activeSession();
    if (!session || session.messages.length === 0) {
      el.innerHTML = `
        <div class="ch-welcome">
          <div class="welcome-avatar">💑</div>
          <div class="welcome-name">บีม เก๊ & เนย เก๊</div>
          <div class="welcome-sub">แชทคู่จำลอง – พิมพ์เพื่อเริ่มบทสนทนา!</div>
        </div>`;
      return;
    }

    let html = '';
    for (let idx = 0; idx < session.messages.length; idx++) {
      const m = session.messages[idx];

      if (m.role === 'director') {
        // Director messages (user instructions to guide conversation)
        html += `
          <div class="msg duo-director">
            <div class="msg-content">
              <div class="msg-bubble">🎬 ${esc(m.content)}</div>
              <div class="msg-time">${timeStr(m.ts)}</div>
            </div>
          </div>`;
        continue;
      }

      const side = m.duoSide || (m.role === 'user' ? duoSide : otherSide(duoSide));
      const pe = getPersona(side);
      const cls = side === 'beam' ? 'duo-beam' : 'duo-noey';
      const bubble = renderMd(m.content);

      const escaped = esc(m.content);
      const actions = `<div class="msg-actions">
          <button class="msg-act" onclick="copyMsg(this)" data-text="${escaped}">📋 คัดลอก</button>
          <button class="msg-act" onclick="regenMsg(${idx})">🔄 ตอบใหม่</button>
          <button class="msg-act" onclick="restoreMsg(${idx})">↩️ ย้อน</button>
          <button class="msg-act" onclick="speakMsg(this)" data-text="${escaped}">🔊 ฟัง</button>
        </div>`;

      html += `
        <div class="msg ${cls}">
          <div class="duo-msg-avatar">${pe.avatar}</div>
          <div class="msg-content">
            <div class="msg-bubble">${bubble}</div>
            ${actions}
            <div class="msg-time">${timeStr(m.ts)}</div>
          </div>
        </div>`;  // escaped already declared above
    }
    el.innerHTML = html;
    requestAnimationFrame(() => el.scrollTop = el.scrollHeight);
  }

  function finalizeDuoMsg(text, ts, side) {
    const el = $('messages');
    const pe = getPersona(side);
    const cls = side === 'beam' ? 'duo-beam' : 'duo-noey';

    let lastMsg = el.querySelector('.msg:last-child');
    if (!lastMsg || !lastMsg.classList.contains(cls)) {
      const div = document.createElement('div');
      div.className = `msg ${cls}`;
      div.innerHTML = `
        <div class="duo-msg-avatar">${pe.avatar}</div>
        <div class="msg-content">
          <div class="msg-bubble"></div>
        </div>`;
      el.appendChild(div);
      lastMsg = div;
    }

    const bubble = lastMsg.querySelector('.msg-bubble');
    if (bubble) bubble.innerHTML = renderMd(text);

    // Add actions
    const content = lastMsg.querySelector('.msg-content');
    const escaped = esc(text);
    if (content && !content.querySelector('.msg-actions')) {
      const session = activeSession();
      const botIdx = session ? Math.max(session.messages.length - 1, 0) : 0;
      content.insertAdjacentHTML('beforeend', `
        <div class="msg-actions">
          <button class="msg-act" onclick="copyMsg(this)" data-text="${escaped}">📋 คัดลอก</button>
          <button class="msg-act" onclick="regenMsg(${botIdx})">🔄 ตอบใหม่</button>
          <button class="msg-act" onclick="restoreMsg(${botIdx})">↩️ ย้อน</button>
          <button class="msg-act" onclick="speakMsg(this)" data-text="${escaped}">🔊 ฟัง</button>
        </div>
        <div class="msg-time">${timeStr(ts)}</div>`);
    }

    el.scrollTop = el.scrollHeight;
  }

  // ─── Override handleSend for duo mode ──────────────────
  function duoHandleSend() {
    if (isGenerating) {
      if (abortCtrl) abortCtrl.abort();
      clearTimeout(duoAutoTimer);
      sfxAbort();
      return;
    }

    const input = $('msgInput');
    const text = input.value.trim();
    if (!text) return;

    if (typeof stopListening === 'function' && typeof isRecording !== 'undefined' && isRecording) {
      stopListening();
    }

    sfxSend();
    input.value = '';
    draft = '';
    save();
    autoResize();

    // Ensure session exists
    let session = activeSession();
    if (!session) {
      session = createSession();
    }

    // Check if text starts with /dir or /กำกับ → director message
    const dirMatch = text.match(/^(?:\/dir(?:ect(?:or)?)?|\/กำกับ|\/บอก)\s+(.+)/is);
    if (dirMatch) {
      session.messages.push({
        role: 'director',
        content: dirMatch[1].trim(),
        ts: Date.now()
      });
      renderDuoMessages();
      save();
      if (session.messages.filter(m => m.role !== 'director').length === 0) {
        autoTitle(session);
      }
      // After director message, make the next responder respond
      if (!duoStopped) {
        // Determine who should respond next
        const lastSpoke = [...session.messages].reverse().find(m => m.duoSide);
        const nextSide = lastSpoke ? otherSide(lastSpoke.duoSide) : randomSide();
        duoSendToAI(session, nextSide);
      }
      return;
    }

    // Normal message: user sends as the currently selected side
    session.messages.push({
      role: 'user',
      content: text,
      ts: Date.now(),
      duoSide: duoSide
    });
    renderDuoMessages();
    save();

    if (session.messages.filter(m => m.role === 'user').length === 1) {
      autoTitle(session);
    }

    // Hide welcome
    const welcome = $('welcomeArea');
    if (welcome) welcome.remove();

    // Un-stop when user sends a message
    setStopState(false);

    // The other side responds
    const respondingSide = otherSide(duoSide);
    duoSendToAI(session, respondingSide);
  }

  // ─── Override key functions BEFORE init runs ────────────
  // Since these are global-scope function declarations in chat.js,
  // reassigning window.X changes the binding used by all chat.js code.
  window.renderMessages = renderDuoMessages;
  window.handleSend = duoHandleSend;

  // Override appendBotChunk to use duo-styled streaming element
  window.appendBotChunk = function duoAppendBotChunk(text) {
    const el = $('messages');
    const side = duoRespondingSide || duoSide || 'beam';
    const pe = getPersona(side);
    const cls = side === 'beam' ? 'duo-beam' : 'duo-noey';

    let lastMsg = el.querySelector('.msg:last-child');
    if (!lastMsg || !lastMsg.classList.contains(cls)) {
      const div = document.createElement('div');
      div.className = `msg ${cls}`;
      div.innerHTML = `
        <div class="duo-msg-avatar">${pe.avatar}</div>
        <div class="msg-content">
          <div class="msg-bubble"></div>
        </div>`;
      el.appendChild(div);
      lastMsg = div;
    }
    const bubble = lastMsg.querySelector('.msg-bubble');
    if (bubble) bubble.innerHTML = renderMd(text);
    el.scrollTop = el.scrollHeight;
  };

  // Override sendToAI so regenMsg/restoreMsg work in duo mode
  window.sendToAI = function duoSendToAIProxy(session) {
    // Determine which side should respond based on last message
    const lastSpoke = [...session.messages].reverse().find(m => m.duoSide);
    const nextSide = lastSpoke ? otherSide(lastSpoke.duoSide) : randomSide();
    duoSendToAI(session, nextSide);
  };

  // Disable idle timer in duo mode (auto-conversation handles flow)
  window.resetIdleTimer = function() {};
  window.scheduleNextIdle = function() {};

  // Override save/load so storage uses 'duo' prefix
  window.save = function duoSave() {
    const p = 'duo';
    localStorage.setItem('fan_chat_' + p + '_sessions', JSON.stringify(sessions));
    localStorage.setItem('fan_chat_' + p + '_active', activeSessionId || '');
    localStorage.setItem('fan_chat_' + p + '_platform', selectedPlatform);
    localStorage.setItem('fan_chat_' + p + '_models', JSON.stringify(selectedModels));
    localStorage.setItem('fan_chat_' + p + '_model', selectedModel);
    localStorage.setItem('fan_chat_' + p + '_draft', draft);
    localStorage.setItem('fan_chat_' + p + '_mood', mood);
    localStorage.setItem('fan_chat_' + p + '_coax', coaxCount);
    localStorage.setItem('fan_chat_' + p + '_coaxNeeded', coaxNeeded);
    localStorage.setItem('fan_chat_' + p + '_ttsPlatform', ttsPlatform);
    localStorage.setItem('fan_chat_' + p + '_idleAttempts', idleAttemptCount);
    localStorage.setItem('fan_chat_' + p + '_idleGaveUp', idleGaveUp ? '1' : '0');
    if (ttsVoiceName) localStorage.setItem('fan_chat_' + p + '_ttsVoice', ttsVoiceName);
    if (ttsBrowserVoiceName) localStorage.setItem('fan_chat_' + p + '_ttsBrowserVoice', ttsBrowserVoiceName);
  };

  window.load = function duoLoad() {
    const p = 'duo';
    try { sessions = JSON.parse(localStorage.getItem('fan_chat_' + p + '_sessions')) || []; } catch (e) { sessions = []; }
    activeSessionId = localStorage.getItem('fan_chat_' + p + '_active') || null;
    selectedPlatform = localStorage.getItem('fan_chat_' + p + '_platform') || DEFAULT_PLATFORM_ID;
    selectedModels = safeJsonParse(localStorage.getItem('fan_chat_' + p + '_models'), {}) || {};
    const legacyModel = localStorage.getItem('fan_chat_' + p + '_model') || '';
    if (legacyModel && !selectedModels.openrouter) selectedModels.openrouter = legacyModel;
    draft = localStorage.getItem('fan_chat_' + p + '_draft') || '';
    mood = localStorage.getItem('fan_chat_' + p + '_mood') || 'normal';
    coaxCount = parseInt(localStorage.getItem('fan_chat_' + p + '_coax')) || 0;
    coaxNeeded = parseInt(localStorage.getItem('fan_chat_' + p + '_coaxNeeded')) || (3 + Math.floor(Math.random() * 3));
    ttsPlatform = localStorage.getItem('fan_chat_' + p + '_ttsPlatform') || 'browser';
    idleAttemptCount = parseInt(localStorage.getItem('fan_chat_' + p + '_idleAttempts')) || 0;
    idleGaveUp = localStorage.getItem('fan_chat_' + p + '_idleGaveUp') === '1';
    ttsVoiceName = localStorage.getItem('fan_chat_' + p + '_ttsVoice') || defaultVoice();
    ttsBrowserVoiceName = localStorage.getItem('fan_chat_' + p + '_ttsBrowserVoice') || '';
    theme = localStorage.getItem('fan_chat_' + 'theme') || 'default';

    // Load shared API key config from normal chat
    const legacyOpenRouterKey = localStorage.getItem('fan_chat_' + 'apiKey') || '';
    const legacyGeminiKey = localStorage.getItem('fan_chat_' + 'geminiApiKey') || '';
    openrouterEntries = safeJsonParse(localStorage.getItem(OPENROUTER_ENTRIES_STORE_KEY), null);
    openrouterEntries = Array.isArray(openrouterEntries) ? openrouterEntries.map(createOpenRouterEntry) : [];
    if (!openrouterEntries.length) {
      seedOpenRouterEntriesFromConfig();
      if (legacyOpenRouterKey && openrouterEntries.length) {
        openrouterEntries[0].apiKey = legacyOpenRouterKey;
      }
    }
    geminiApiKeys = safeJsonParse(localStorage.getItem(GEMINI_KEYS_STORE_KEY), null);
    geminiApiKeys = Array.isArray(geminiApiKeys) ? geminiApiKeys.map(createGeminiKeyEntry) : [];
    if (!geminiApiKeys.length && legacyGeminiKey) {
      geminiApiKeys.push(createGeminiKeyEntry({ key: legacyGeminiKey }));
    }
    geminiActiveKeyId = localStorage.getItem('fan_chat_' + 'geminiActiveKeyId') || '';
    loadGeminiQuotaCache();
    ensureConfigRows();
    syncPlatformSelectionState();
  };

  // ─── Override init ─────────────────────────────────────
  // We need the original init to run (it binds ALL event listeners)
  // but we patch persona and UI afterwards.
  const _origInit = init;
  window.init = function duoInit() {
    // Force persona before original init reads URL params
    // Patch URL so original init picks up 'beam' as persona
    if (!new URLSearchParams(location.search).has('persona')) {
      const url = new URL(location.href);
      url.searchParams.set('persona', 'beam');
      history.replaceState({}, '', url.toString());
    }

    // Run the ORIGINAL init (which uses overridden save/load/renderMessages/handleSend)
    _origInit();

    // Now patch duo-specific UI on top
    persona = 'beam';
    $('personaAvatar').textContent = '💑';
    $('personaName').textContent = 'บีม เก๊ & เนย เก๊';
    $('personaStatus').textContent = 'คุยกัน';
    document.title = 'บีม เก๊ & เนย เก๊ – FAN Duo Chat';

    // Update welcome area
    const wa = $('welcomeAvatar'), wn = $('welcomeName');
    if (wa) wa.textContent = '💑';
    if (wn) wn.textContent = 'บีม เก๊ & เนย เก๊';

    // Override back button to go to anniv page
    const btnBack = $('btnBack');
    if (btnBack) {
      // Remove old listener by replacing element
      const newBtn = btnBack.cloneNode(true);
      btnBack.parentNode.replaceChild(newBtn, btnBack);
      newBtn.addEventListener('click', () => {
        sfxBtn();
        clearTimeout(duoAutoTimer);
        if (abortCtrl) abortCtrl.abort();
        window.location.replace('index.html?persona=anniv');
      });
    }

    // Override popstate (remove old, add new)
    // The original init already added a popstate listener; we must handle it
    // Since we can't remove anonymous listeners, we'll just add ours
    // and the duoSide state will make it obvious we're in duo mode
    window.addEventListener('popstate', (e) => {
      e.stopImmediatePropagation();
      window.location.replace('index.html?persona=anniv');
    });

    // Load duo state or randomize
    const savedState = loadDuoState();
    const startSide = savedState.side || randomSide();
    setSide(startSide);
    setStopState(savedState.stopped);

    // Re-render with duo version (original init already called renderMessages
    // which is now renderDuoMessages, but let's ensure correct state)
    if (activeSessionId && getSession(activeSessionId)) {
      renderDuoMessages();
    }

    // ─── Wire duo controls ───────────────────────────────
    $('duoBtnBeam').addEventListener('click', () => {
      sfxBtn();
      setSide('beam');
    });
    $('duoBtnNoey').addEventListener('click', () => {
      sfxBtn();
      setSide('noey');
    });
    $('duoBtnStop').addEventListener('click', () => {
      sfxBtn();
      if (duoStopped) {
        // Resume → trigger next response
        setStopState(false);
        const session = activeSession();
        if (session && session.messages.length && !isGenerating) {
          const lastSpoke = [...session.messages].reverse().find(m => m.duoSide);
          if (lastSpoke) {
            const nextSide = otherSide(lastSpoke.duoSide);
            duoSendToAI(session, nextSide);
          }
        }
      } else {
        // Stop
        setStopState(true);
        if (abortCtrl) abortCtrl.abort();
      }
    });
  };


})();
