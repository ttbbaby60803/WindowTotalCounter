// index.js（櫻花版 + 完整 chat 統計）

const BTN_ID = "wtc-toggle-btn";
const PANEL_ID = "wtc-panel";
const BODY_ID = "wtc-body";
const STYLE_ID = "wtc-styles";
const STORAGE_KEY = "wtc-btn-pos";

// ── 櫻花 SVG ──
const SAKURA_SVG = `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">
  <defs>
    <radialGradient id="wtc-petal-g" cx="50%" cy="40%" r="60%">
      <stop offset="0%" stop-color="#FFD6E0"/>
      <stop offset="50%" stop-color="#FFB0C8"/>
      <stop offset="100%" stop-color="#FF7BAC"/>
    </radialGradient>
    <filter id="wtc-glow">
      <feGaussianBlur stdDeviation="2" result="blur"/>
      <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
  </defs>
  <g filter="url(#wtc-glow)" transform="translate(50,50)">
    <ellipse rx="14" ry="26" fill="url(#wtc-petal-g)" transform="rotate(0)   translate(0,-10)" opacity="0.92"/>
    <ellipse rx="14" ry="26" fill="url(#wtc-petal-g)" transform="rotate(72)  translate(0,-10)" opacity="0.92"/>
    <ellipse rx="14" ry="26" fill="url(#wtc-petal-g)" transform="rotate(144) translate(0,-10)" opacity="0.92"/>
    <ellipse rx="14" ry="26" fill="url(#wtc-petal-g)" transform="rotate(216) translate(0,-10)" opacity="0.92"/>
    <ellipse rx="14" ry="26" fill="url(#wtc-petal-g)" transform="rotate(288) translate(0,-10)" opacity="0.92"/>
    <circle cx="0" cy="0" r="7" fill="#FFE4A0" opacity="0.95"/>
    <circle cx="-2" cy="-2" r="1.5" fill="#E8A060" opacity="0.7"/>
    <circle cx="2" cy="1" r="1.2" fill="#E8A060" opacity="0.6"/>
    <circle cx="0" cy="3" r="1" fill="#E8A060" opacity="0.5"/>
  </g>
</svg>`;

// ── 注入全域 CSS ──
function injectStyles() {
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement("style");
  style.id = STYLE_ID;
  style.textContent = `
    @keyframes wtc-spin {
      from { transform: rotate(0deg); }
      to   { transform: rotate(360deg); }
    }
    @keyframes wtc-breathe {
      0%, 100% { box-shadow: 0 0 12px 3px rgba(255,150,180,0.35), 0 4px 16px rgba(0,0,0,0.18); }
      50%      { box-shadow: 0 0 22px 8px rgba(255,150,180,0.55), 0 4px 20px rgba(0,0,0,0.22); }
    }
    @keyframes wtc-fade-in {
      from { opacity: 0; transform: scale(0.92) translateY(6px); }
      to   { opacity: 1; transform: scale(1) translateY(0); }
    }
    @keyframes wtc-petal-fall {
      0%   { opacity: 1; transform: translate(0, 0) rotate(0deg) scale(1); }
      100% { opacity: 0; transform: translate(var(--wtc-dx), 60px) rotate(var(--wtc-rot)) scale(0.5); }
    }
    #${BTN_ID} {
      position: fixed;
      z-index: 999999;
      width: 44px;
      height: 44px;
      border: none;
      background: transparent;
      cursor: grab;
      user-select: none;
      padding: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      filter: drop-shadow(0 0 8px rgba(255,150,180,0.5)) drop-shadow(0 2px 6px rgba(0,0,0,0.25));
      transition: transform 0.25s ease, filter 0.3s ease;
      -webkit-tap-highlight-color: transparent;
      touch-action: none;
    }
    #${BTN_ID}:hover {
      transform: scale(1.15);
      filter: drop-shadow(0 0 14px rgba(255,150,180,0.85)) drop-shadow(0 2px 8px rgba(0,0,0,0.3));
    }
    #${BTN_ID}.wtc-dragging {
      cursor: grabbing;
      opacity: 0.85;
      transform: scale(1.2);
      filter: drop-shadow(0 0 18px rgba(255,150,180,0.9)) drop-shadow(0 4px 10px rgba(0,0,0,0.35));
    }
    #${BTN_ID} .wtc-sakura-icon {
      width: 44px;
      height: 44px;
      animation: wtc-spin 6s linear infinite;
      pointer-events: none;
    }
    #${BTN_ID}:hover .wtc-sakura-icon {
      animation-duration: 2.5s;
    }
    #${BTN_ID}.wtc-dragging .wtc-sakura-icon {
      animation-duration: 1.2s;
    }
    #${PANEL_ID} {
      position: fixed;
      z-index: 999998;
      width: 230px;
      padding: 12px 14px 10px 14px;
      border-radius: 16px;
      border: 1.5px solid rgba(255,183,197,0.35);
      background: linear-gradient(135deg, rgba(40,20,30,0.82), rgba(60,25,45,0.78));
      backdrop-filter: blur(14px);
      color: #fff;
      font-family: "Microsoft JhengHei", "Noto Sans TC", "PingFang TC", "Heiti TC", sans-serif;
      font-size: 13px;
      font-weight: 500;
      line-height: 1.5;
      letter-spacing: 0.5px;
      box-shadow: 0 12px 36px rgba(0,0,0,0.35), 0 0 16px rgba(255,150,180,0.15);
      animation: wtc-fade-in 0.3s ease-out;
    }
    #${PANEL_ID} .wtc-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
      margin-bottom: 8px;
    }
    #${PANEL_ID} .wtc-title {
      font-weight: 700;
      font-size: 13px;
      color: #FFD6E0;
      text-shadow: 0 0 8px rgba(255,150,180,0.4);
    }
    #${PANEL_ID} .wtc-actions {
      display: flex;
      gap: 6px;
      align-items: center;
    }
    #${PANEL_ID} .wtc-actions button {
      padding: 5px 9px;
      border-radius: 10px;
      border: 1px solid rgba(255,183,197,0.3);
      background: rgba(255,150,180,0.12);
      color: #FFD6E0;
      cursor: pointer;
      font-family: inherit;
      font-size: 12px;
      font-weight: 700;
      transition: background 0.2s, border-color 0.2s;
    }
    #${PANEL_ID} .wtc-actions button:hover {
      background: rgba(255,150,180,0.28);
      border-color: rgba(255,150,180,0.5);
    }
    #${PANEL_ID} .wtc-close-btn {
      width: 28px;
      height: 28px;
      padding: 0 !important;
      font-size: 16px !important;
      line-height: 1;
      font-weight: 900 !important;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    #${BODY_ID} {
      padding: 8px 8px 6px 8px;
      border-radius: 10px;
      background: rgba(0,0,0,0.22);
      border: 1px solid rgba(255,183,197,0.12);
    }
    #${BODY_ID} div {
      padding: 2px 0;
    }
    #${BODY_ID} b {
      color: #FFB0C8;
    }
    .wtc-falling-petal {
      position: fixed;
      width: 12px;
      height: 12px;
      pointer-events: none;
      z-index: 999997;
      animation: wtc-petal-fall 1.2s ease-out forwards;
    }
  `;
  document.head.appendChild(style);
}

// ── 清除舊版面板 ──
function removeLegacyPanels() {
  const legacy = document.getElementById("window-total-counter");
  if (legacy) legacy.remove();

  const panel = document.getElementById(PANEL_ID);
  if (panel) panel.remove();

  const btn = document.getElementById(BTN_ID);
  if (btn) btn.remove();

  const oldStyle = document.getElementById(STYLE_ID);
  if (oldStyle) oldStyle.remove();
}

// ── 取得完整 chat 陣列（優先 SillyTavern context） ──
function getChatArray() {
  try {
    const st = window.SillyTavern || (typeof SillyTavern !== "undefined" ? SillyTavern : null);
    if (st && typeof st.getContext === "function") {
      const ctx = st.getContext();
      if (ctx && Array.isArray(ctx.chat)) return ctx.chat;
    }
  } catch (e) { /* ignore */ }

  if (Array.isArray(window.chat)) return window.chat;

  return [];
}

// ── 統計邏輯（嚴格按使用者指定公式） ──
function computeStats() {
  const chat = getChatArray();

  let totalMsgs = 0;
  let userChars = 0;
  let aiChars = 0;

  for (const m of chat) {
    if (!m || typeof m !== "object") continue;
    const text = String(m.mes || "");
    const len = text.length;
    if (!text.trim()) continue;

    totalMsgs += 1;
    if (m.is_user === true) userChars += len;
    else aiChars += len;
  }

  return {
    totalChars: userChars + aiChars,
    totalMsgs,
    userChars,
    aiChars,
  };
}

// ── 掉落花瓣特效 ──
function spawnFallingPetals(x, y, count = 5) {
  for (let i = 0; i < count; i++) {
    const petal = document.createElement("div");
    petal.className = "wtc-falling-petal";
    petal.innerHTML = `<svg viewBox="0 0 20 20" width="12" height="12" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="10" cy="10" rx="5" ry="9" fill="rgba(255,180,200,0.8)" transform="rotate(${Math.random()*60-30},10,10)"/>
    </svg>`;
    const dx = (Math.random() - 0.5) * 60;
    const rot = (Math.random() - 0.5) * 360;
    petal.style.left = x + "px";
    petal.style.top = y + "px";
    petal.style.setProperty("--wtc-dx", dx + "px");
    petal.style.setProperty("--wtc-rot", rot + "deg");
    document.body.appendChild(petal);
    setTimeout(() => petal.remove(), 1300);
  }
}

// ── 面板顯示/隱藏 ──
function setPanelVisible(visible) {
  const panel = document.getElementById(PANEL_ID);
  const btn = document.getElementById(BTN_ID);
  if (!panel || !btn) return;

  if (visible) {
    updatePanelPosition();
    panel.style.display = "block";
    const rect = btn.getBoundingClientRect();
    spawnFallingPetals(rect.left + rect.width / 2, rect.top + rect.height / 2, 6);
  } else {
    panel.style.display = "none";
  }
}

function updatePanelPosition() {
  const panel = document.getElementById(PANEL_ID);
  const btn = document.getElementById(BTN_ID);
  if (!panel || !btn) return;

  const btnRect = btn.getBoundingClientRect();
  const panelW = 230;
  const panelH = 150;
  const margin = 8;

  let top = btnRect.top - panelH - margin;
  if (top < 10) {
    top = btnRect.bottom + margin;
  }

  let left = btnRect.left + btnRect.width / 2 - panelW / 2;
  if (left < 10) left = 10;
  if (left + panelW > window.innerWidth - 10) left = window.innerWidth - panelW - 10;

  panel.style.left = left + "px";
  panel.style.top = top + "px";
  panel.style.right = "auto";
  panel.style.bottom = "auto";
}

// ── 渲染統計 ──
function renderTotals() {
  const body = document.getElementById(BODY_ID);
  if (!body) return;

  const { totalChars, totalMsgs, userChars, aiChars } = computeStats();
  body.innerHTML =
    `<div>整體字數：<b>${totalChars}</b></div>` +
    `<div>訊息筆數：<b>${totalMsgs}</b></div>` +
    `<div>使用者字數：<b>${userChars}</b></div>` +
    `<div>AI字數：<b>${aiChars}</b></div>`;
}

// ── 讀取/儲存按鈕位置 ──
function loadBtnPos() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const pos = JSON.parse(raw);
      if (
        typeof pos.left === "number" &&
        typeof pos.top === "number" &&
        pos.left >= 0 && pos.left < window.innerWidth - 20 &&
        pos.top >= 0 && pos.top < window.innerHeight - 20
      ) {
        return pos;
      }
    }
  } catch (e) { /* ignore */ }
  return { left: window.innerWidth - 68, top: window.innerHeight - 68 };
}

function saveBtnPos(left, top) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ left, top }));
  } catch (e) { /* ignore */ }
}

// ── 建立 UI ──
function ensureUI() {
  injectStyles();

  let btn = document.getElementById(BTN_ID);
  if (!btn) {
    btn = document.createElement("div");
    btn.id = BTN_ID;

    const iconWrap = document.createElement("div");
    iconWrap.className = "wtc-sakura-icon";
    iconWrap.innerHTML = SAKURA_SVG;
    btn.appendChild(iconWrap);

    const pos = loadBtnPos();
    btn.style.left = pos.left + "px";
    btn.style.top = pos.top + "px";

    document.body.appendChild(btn);

    let isDragging = false;
    let dragStartX, dragStartY, btnStartX, btnStartY;
    let hasMoved = false;

    function onPointerDown(e) {
      e.preventDefault();
      isDragging = true;
      hasMoved = false;
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;
      dragStartX = clientX;
      dragStartY = clientY;
      btnStartX = btn.offsetLeft;
      btnStartY = btn.offsetTop;
      btn.classList.add("wtc-dragging");
    }

    function onPointerMove(e) {
      if (!isDragging) return;
      e.preventDefault();
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;
      const dx = clientX - dragStartX;
      const dy = clientY - dragStartY;

      if (Math.abs(dx) > 4 || Math.abs(dy) > 4) {
        hasMoved = true;
      }

      let newLeft = btnStartX + dx;
      let newTop = btnStartY + dy;

      const maxLeft = window.innerWidth - btn.offsetWidth;
      const maxTop = window.innerHeight - btn.offsetHeight;
      newLeft = Math.max(0, Math.min(newLeft, maxLeft));
      newTop = Math.max(0, Math.min(newTop, maxTop));

      btn.style.left = newLeft + "px";
      btn.style.top = newTop + "px";

      const panel = document.getElementById(PANEL_ID);
      if (panel && panel.style.display !== "none") {
        updatePanelPosition();
      }
    }

    function onPointerUp(e) {
      if (!isDragging) return;
      isDragging = false;
      btn.classList.remove("wtc-dragging");

      saveBtnPos(btn.offsetLeft, btn.offsetTop);

      if (!hasMoved) {
        const panel = document.getElementById(PANEL_ID);
        if (panel) {
          const isOpen = panel.style.display !== "none";
          setPanelVisible(!isOpen);
          if (!isOpen) renderTotals();
        }
      }
    }

    btn.addEventListener("mousedown", onPointerDown);
    document.addEventListener("mousemove", onPointerMove);
    document.addEventListener("mouseup", onPointerUp);

    btn.addEventListener("touchstart", onPointerDown, { passive: false });
    document.addEventListener("touchmove", onPointerMove, { passive: false });
    document.addEventListener("touchend", onPointerUp);
  }

  let panel = document.getElementById(PANEL_ID);
  if (!panel) {
    panel = document.createElement("div");
    panel.id = PANEL_ID;
    panel.style.display = "none";

    const header = document.createElement("div");
    header.className = "wtc-header";

    const title = document.createElement("div");
    title.className = "wtc-title";
    title.textContent = "字數統計";

    const actions = document.createElement("div");
    actions.className = "wtc-actions";

    const refresh = document.createElement("button");
    refresh.type = "button";
    refresh.textContent = "更新";
    refresh.addEventListener("click", () => {
      renderTotals();
      const btnEl = document.getElementById(BTN_ID);
      if (btnEl) {
        const rect = btnEl.getBoundingClientRect();
        spawnFallingPetals(rect.left + rect.width / 2, rect.top, 3);
      }
    });

    const close = document.createElement("button");
    close.type = "button";
    close.className = "wtc-close-btn";
    close.textContent = "×";
    close.addEventListener("click", () => setPanelVisible(false));

    actions.appendChild(refresh);
    actions.appendChild(close);

    header.appendChild(title);
    header.appendChild(actions);

    const body = document.createElement("div");
    body.id = BODY_ID;

    panel.appendChild(header);
    panel.appendChild(body);

    document.body.appendChild(panel);

    document.addEventListener("click", (e) => {
      if (panel.style.display === "none") return;
      if (panel.contains(e.target) || btn.contains(e.target)) return;
      setPanelVisible(false);
    });
  }
}

// ── 巨集指令（保留 /windowstats） ──
function registerMacro() {
  const tryRegister = () => {
    const ms = window?.macros?.registry;
    if (ms?.registerMacro) {
      ms.registerMacro("windowstats", () => {
        ensureUI();
        setPanelVisible(true);
        renderTotals();
        return "";
      });
      return true;
    }
    return false;
  };

  if (tryRegister()) return;

  let n = 0;
  const t = setInterval(() => {
    n++;
    if (tryRegister() || n > 60) clearInterval(t);
  }, 1000);
}

// ✅ 酒館入口（jQuery ready）
jQuery(async () => {
  try {
    removeLegacyPanels();
    ensureUI();
    registerMacro();
    console.log("[Window Total Counter 🌸] loaded");
  } catch (e) {
    console.error("[Window Total Counter 🌸] init failed", e);
  }
});
