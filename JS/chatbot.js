/* =========================================
   chatbot.js — Trap-Intell AI Chat Assistant
   Drop this script into every page alongside chatbot.css
   ========================================= */

(function () {
  'use strict';

  /* ────────────────────────────────────────
     1. Inject HTML into the page
  ──────────────────────────────────────── */
  function injectChatUI() {
    // Remove existing FAB if present (pages have their own)
    const existingFab = document.querySelector('.fab');
    if (existingFab) existingFab.remove();

    const html = /* html */`
      <!-- Chat Panel -->
      <div class="chat-panel" id="chatPanel" role="dialog" aria-label="AI Chat Assistant">

        <!-- Header -->
        <div class="chat-header">
          <div class="chat-header-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor"
              stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <rect x="2" y="3" width="20" height="14" rx="2"/>
              <path d="M8 21h8M12 17v4"/>
              <circle cx="9" cy="10" r="1" fill="currentColor"/>
              <circle cx="15" cy="10" r="1" fill="currentColor"/>
              <path d="M9 13c0 0 1 1 3 1s3-1 3-1"/>
            </svg>
          </div>
          <div class="chat-header-info">
            <div class="chat-header-title">
              AI Chat Assistant <span class="chat-header-sparkle">✨</span>
            </div>
            <div class="chat-header-sub">Always here to help you</div>
          </div>
          <div class="chat-online-badge">
            <span class="chat-online-dot"></span>
            Online
          </div>
        </div>

        <!-- Messages -->
        <div class="chat-messages" id="chatMessages"></div>

        <!-- Quick prompts -->
        <div class="chat-quick-prompts" id="quickPrompts">
          <button class="quick-prompt" data-msg="Show active threats">🛡️ Active threats</button>
          <button class="quick-prompt" data-msg="Summarize recent alerts">🔔 Recent alerts</button>
          <button class="quick-prompt" data-msg="Honeypot status">🍯 Honeypot status</button>
          <button class="quick-prompt" data-msg="Top threat actors">👾 Threat actors</button>
        </div>

        <!-- Input -->
        <div class="chat-input-wrap">
          <input
            class="chat-input"
            id="chatInput"
            type="text"
            placeholder="Type your message..."
            autocomplete="off"
            maxlength="500"
          />
          <button class="btn-chat-send" id="chatSendBtn" disabled>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
              stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <line x1="22" y1="2" x2="11" y2="13"/>
              <polygon points="22 2 15 22 11 13 2 9 22 2"/>
            </svg>
            Send
          </button>
        </div>
      </div>

      <!-- FAB trigger -->
      <button class="fab" id="chatFab" aria-label="Open AI Chat Assistant">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor"
          stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <rect x="2" y="3" width="20" height="14" rx="2"/>
          <path d="M8 21h8M12 17v4"/>
          <circle cx="9" cy="10" r="1" fill="currentColor"/>
          <circle cx="15" cy="10" r="1" fill="currentColor"/>
          <path d="M9 13c0 0 1 1 3 1s3-1 3-1"/>
        </svg>
      </button>
    `;

    const wrapper = document.createElement('div');
    wrapper.innerHTML = html;
    document.body.appendChild(wrapper);
  }

  /* ────────────────────────────────────────
     2. State
  ──────────────────────────────────────── */
  let isOpen      = false;
  let isTyping    = false;
  const history   = [];   // { role: 'user'|'assistant', content: string }

  const SYSTEM_PROMPT = `You are an AI security assistant embedded in Trap-intell, a cybersecurity threat intelligence platform.
You help SOC analysts with:
- Interpreting threat alerts and attack patterns
- Explaining honeypot activity and deception strategies
- Summarizing threat actor profiles (APT groups, TTPs)
- Advising on incident response steps
- Explaining cybersecurity concepts clearly

Keep responses concise (2-4 sentences unless detail is needed), professional, and actionable.
When asked about platform data (active threats, alerts, honeypots) give plausible example responses based on the Trap-intell context.`;

  /* ────────────────────────────────────────
     3. DOM helpers
  ──────────────────────────────────────── */
  function getEl(id) { return document.getElementById(id); }

  function addMessage(role, text, animate = true) {
    const messages = getEl('chatMessages');
    const isBot    = role === 'assistant' || role === 'bot';

    const row = document.createElement('div');
    row.className = `msg-row ${isBot ? 'bot' : 'user'}`;
    if (!animate) row.style.animation = 'none';

    const initials = isBot ? 'AI' : 'ME';
    row.innerHTML = `
      <div class="msg-avatar">${initials}</div>
      <div class="msg-bubble">${escapeHtml(text)}</div>
    `;

    messages.appendChild(row);
    scrollBottom();
    return row;
  }

  function showTyping() {
    const messages = getEl('chatMessages');
    const row = document.createElement('div');
    row.className = 'msg-row bot msg-typing';
    row.id = 'typingIndicator';
    row.innerHTML = `
      <div class="msg-avatar">AI</div>
      <div class="msg-bubble">
        <span class="typing-dot"></span>
        <span class="typing-dot"></span>
        <span class="typing-dot"></span>
      </div>
    `;
    messages.appendChild(row);
    scrollBottom();
  }

  function hideTyping() {
    const t = getEl('typingIndicator');
    if (t) t.remove();
  }

  function scrollBottom() {
    const messages = getEl('chatMessages');
    if (messages) messages.scrollTop = messages.scrollHeight;
  }

  function escapeHtml(str) {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/\n/g, '<br>');
  }

  /* ────────────────────────────────────────
     4. Toggle panel
  ──────────────────────────────────────── */
  function toggleChat() {
    isOpen = !isOpen;
    const panel = getEl('chatPanel');
    const fab   = getEl('chatFab');

    panel.classList.toggle('open', isOpen);
    fab.classList.toggle('chat-open', isOpen);

    if (isOpen) {
      setTimeout(() => getEl('chatInput')?.focus(), 280);
    }
  }

  /* ────────────────────────────────────────
     5. Send message
  ──────────────────────────────────────── */
  async function sendMessage(text) {
    if (!text.trim() || isTyping) return;

    const input   = getEl('chatInput');
    const sendBtn = getEl('chatSendBtn');
    const prompts = getEl('quickPrompts');

    /* Hide quick prompts after first real message */
    if (prompts) prompts.style.display = 'none';

    /* Add user message */
    addMessage('user', text.trim());
    history.push({ role: 'user', content: text.trim() });

    /* Clear input */
    input.value = '';
    input.dispatchEvent(new Event('input'));

    /* Typing indicator */
    isTyping = true;
    sendBtn.disabled = true;
    showTyping();

    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-6',
          max_tokens: 1000,
          system: SYSTEM_PROMPT,
          messages: history,
        }),
      });

      const data = await response.json();

      hideTyping();

      const replyText = data?.content?.[0]?.text
        || "I'm having trouble connecting right now. Please try again.";

      addMessage('assistant', replyText);
      history.push({ role: 'assistant', content: replyText });

    } catch (err) {
      hideTyping();
      addMessage('assistant', 'Connection error. Please check your network and try again.');
      console.error('[Chatbot]', err);
    }

    isTyping = false;
    sendBtn.disabled = !input.value.trim();
  }

  /* ────────────────────────────────────────
     6. Wire events
  ──────────────────────────────────────── */
  function wireEvents() {
    const fab     = getEl('chatFab');
    const input   = getEl('chatInput');
    const sendBtn = getEl('chatSendBtn');

    fab.addEventListener('click', toggleChat);

    input.addEventListener('input', () => {
      sendBtn.disabled = !input.value.trim() || isTyping;
    });

    input.addEventListener('keydown', e => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage(input.value);
      }
    });

    sendBtn.addEventListener('click', () => sendMessage(input.value));

    /* Quick prompts */
    document.querySelectorAll('.quick-prompt').forEach(btn => {
      btn.addEventListener('click', () => {
        sendMessage(btn.dataset.msg);
      });
    });

    /* Close on Escape */
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && isOpen) toggleChat();
    });
  }

  /* ────────────────────────────────────────
     7. Init welcome message
  ──────────────────────────────────────── */
  function addWelcome() {
    addMessage(
      'assistant',
      "Hello! I'm your AI assistant. How can I help you today?",
      false
    );
    history.push({
      role: 'assistant',
      content: "Hello! I'm your AI assistant. How can I help you today?"
    });
  }

  /* ────────────────────────────────────────
     8. Bootstrap
  ──────────────────────────────────────── */
  function init() {
    injectChatUI();
    wireEvents();
    addWelcome();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
