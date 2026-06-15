// index.js（櫻花版）

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

// ── 注入全域 CSS 動畫 ──
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
      width: 52px;
      height: 52px;
      border-radius: 50%;
      border: 2px solid rgba(255,183,197,0.45);
      background: radial-gradient(circle at 40% 35%, rgba(255,220,230,0.85), rgba(255,150,180,0.55));
      backdrop-filter: blur(6px);
      cursor: grab;
      user-select: none;
      padding: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      animation: wtc-breathe 3s ease-in-out infinite;
      transition: transform 0.25s ease, border-color 0.3s ease;
      -webkit-tap-highlight-color: transparent;
      touch-action: none;
    }
    #${BTN_ID}:hover {
      transform: scale(1.13);
      border-color: rgba(255,130,170,0.7);
    }
    #${BTN_ID}.wtc-dragging {
      cursor: grabbing;
      opacity: 0.82;
      transform: scale(1.18);
      animation: none;
      box-shadow: 0 0 28px 10px rgba(255,150,180,0.5), 0 8px 28px rgba(0,0,0,0.25);
    }
    #${BTN_ID} .wtc-sakura-icon {
      width: 36px;
      height: 36px;
      animation: wtc-spin 8s linear infinite;
      pointer-events: none;
    }
    #${BTN_ID}:hover .wtc-sakura-icon {
      animation-duration: 3s;
    }
    #${BTN_ID}.wtc-dragging .wtc-sakura-icon {
      animation-duration: 1.5s;
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
      font-size: 12px;
      line-height: 1.4;
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
      font-weight: 800;
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

// ── 統計邏輯（不動） ──
function getMessagesText() {
  const mesEls = document.querySelectorAll(".mes");
  if (mesEls && mesEls.length) {
    return [...mesEls]
      .map((m) => (m.querySelector(".mes_text")?.innerText || "").trim())
      .filter(Boolean);
  }

  const msgEls =
    document.querySelectorAll(".chat_message, .message, .mes_text") || [];
  return [...msgEls]
    .map((n) => (n?.innerText || n?.textContent || "").trim())
    .filter(Boolean);
}

function computeTotals() {
  const texts = getMessagesText();
  return {
    messageCount: texts.length,
    totalChars: texts.reduce((s, t) => s + t.length, 0),
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
    // 根據按鈕位置決定面板展開方向
    updatePanelPosition();
    panel.style.display = "block";
    // 點擊時噴花瓣
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
  const panelH = 120;
  const margin = 8;

  // 垂直方向：優先在按鈕上方
  let top = btnRect.top - panelH - margin;
  if (top < 10) {
    top = btnRect.bottom + margin;
  }

  // 水平方向：以按鈕中心對齊面板中心，但不超出螢幕
  let left = btnRect.left + btnRect.width / 2 - panelW / 2;
  if (left < 10) left = 10;
  if (left + panelW > window.innerWidth - 10) left = window.innerWidth - panelW - 10;

  // 使用 left/top 而非 right/bottom，因為按鈕可拖動到任意位置
  panel.style.left = left + "px";
  panel.style.top = top + "px";
  panel.style.right = "auto";
  panel.style.bottom = "auto";
}

// ── 渲染統計 ──
function renderTotals() {
  const body = document.getElementById(BODY_ID);
  if (!body) return;

  const { messageCount, totalChars } = computeTotals();
  body.innerHTML =
    `<div>🌸 訊息數：<b>${messageCount}</b></div>` +
    `<div>🌸 總字符：<b>${totalChars}</b></div>`;
}

// ── 讀取/儲存按鈕位置 ──
function loadBtnPos() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const pos = JSON.parse(raw);
      // 驗證位置在視窗範圍內
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
  // 預設位置：右下角
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

  // ── 按鈕 ──
  let btn = document.getElementById(BTN_ID);
  if (!btn) {
    btn = document.createElement("div");
    btn.id = BTN_ID;

    const iconWrap = document.createElement("div");
    iconWrap.className = "wtc-sakura-icon";
    iconWrap.innerHTML = SAKURA_SVG;
    btn.appendChild(iconWrap);

    // 設定初始位置
    const pos = loadBtnPos();
    btn.style.left = pos.left + "px";
    btn.style.top = pos.top + "px";

    document.body.appendChild(btn);

    // ── 拖動邏輯 ──
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

      // 邊界檢測
      const maxLeft = window.innerWidth - btn.offsetWidth;
      const maxTop = window.innerHeight - btn.offsetHeight;
      newLeft = Math.max(0, Math.min(newLeft, maxLeft));
      newTop = Math.max(0, Math.min(newTop, maxTop));

      btn.style.left = newLeft + "px";
      btn.style.top = newTop + "px";

      // 拖動中同步更新面板位置
      const panel = document.getElementById(PANEL_ID);
      if (panel && panel.style.display !== "none") {
        updatePanelPosition();
      }
    }

    function onPointerUp(e) {
      if (!isDragging) return;
      isDragging = false;
      btn.classList.remove("wtc-dragging");

      // 儲存位置
      saveBtnPos(btn.offsetLeft, btn.offsetTop);

      // 如果沒有移動 → 視為點擊 → 切換面板
      if (!hasMoved) {
        const panel = document.getElementById(PANEL_ID);
        if (panel) {
          const isOpen = panel.style.display !== "none";
          setPanelVisible(!isOpen);
          if (!isOpen) renderTotals();
        }
      }
    }

    // 滑鼠事件
    btn.addEventListener("mousedown", onPointerDown);
    document.addEventListener("mousemove", onPointerMove);
    document.addEventListener("mouseup", onPointerUp);

    // 觸控事件
    btn.addEventListener("touchstart", onPointerDown, { passive: false });
    document.addEventListener("touchmove", onPointerMove, { passive: false });
    document.addEventListener("touchend", onPointerUp);
  }

  // ── 面板 ──
  let panel = document.getElementById(PANEL_ID);
  if (!panel) {
    panel = document.createElement("div");
    panel.id = PANEL_ID;
    panel.style.display = "none";

    // Header
    const header = document.createElement("div");
    header.className = "wtc-header";

    const title = document.createElement("div");
    title.className = "wtc-title";
    title.textContent = "🌸 本窗口統計";

    const actions = document.createElement("div");
    actions.className = "wtc-actions";

    const refresh = document.createElement("button");
    refresh.type = "button";
    refresh.textContent = "更新";
    refresh.addEventListener("click", () => {
      renderTotals();
      // 更新時也噴花瓣
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
  }
}

// ── 巨集指令（不動） ──
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

// ✅ 酒館會呼叫這個
export function init() {
  try {
    removeLegacyPanels();
    ensureUI();
    registerMacro();
    console.log("[Window Total Counter 🌸] loaded");
  } catch (e) {
    console.error("[Window Total Counter 🌸] init failed", e);
  }
}
