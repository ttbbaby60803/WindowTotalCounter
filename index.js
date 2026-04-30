(() => {
  "use strict";

  const MODULE_ID = "window-total-counter";
  const FAB_ID = "wtc-fab";
  const PANEL_ID = "wtc-panel";

  function safeStr(v) {
    if (v == null) return "";
    if (typeof v === "string") return v;
    if (typeof v === "number" || typeof v === "boolean") return String(v);
    // 常見：message object
    if (typeof v === "object") {
      return (
        (typeof v.mes === "string" && v.mes) ||
        (typeof v.content === "string" && v.content) ||
        (typeof v.text === "string" && v.text) ||
        (typeof v.message === "string" && v.message) ||
        ""
      );
    }
    return "";
  }

  // 盡量把「顯示文字」抽出來計算字數（簡單去掉 HTML tag / 部分 markdown）
  function toPlainText(s) {
    if (!s) return "";
    let t = s;

    // 去掉 code block（避免把一大段程式碼也算進去，通常你要的是劇情/對話字數）
    t = t.replace(/```[\s\S]*?```/g, "");

    // 去掉 HTML tags
    t = t.replace(/<[^>]*>/g, "");

    // 去掉常見 markdown 符號（不追求完美，但夠用）
    t = t.replace(/[*_~`>#-]/g, "");
    t = t.replace(/\[(.*?)\]\((.*?)\)/g, "$1"); // [text](url) -> text

    // 正規化空白
    t = t.replace(/\s+/g, " ").trim();

    return t;
  }

  function getChatArray() {
    try {
      if (!window.SillyTavern || typeof window.SillyTavern.getContext !== "function") return [];
      const ctx = window.SillyTavern.getContext();
      if (!ctx) return [];
      return Array.isArray(ctx.chat) ? ctx.chat : [];
    } catch {
      return [];
    }
  }

  function computeStats() {
    const chat = getChatArray();

    let totalChars = 0;
    let totalMsgs = 0;

    // 嘗試拆 user / bot（如果取不到，就只給 total）
    let userChars = 0;
    let botChars = 0;

    for (const item of chat) {
      const raw = safeStr(item);
      if (!raw) continue;

      const plain = toPlainText(raw);
      if (!plain) continue;

      const len = plain.length;
      totalChars += len;
      totalMsgs += 1;

      // 嘗試判斷訊息來源（不同版本欄位可能不同）
      const isUser =
        (item && typeof item === "object" && (item.is_user === true || item.isUser === true || item.role === "user")) ||
        false;

      if (isUser) userChars += len;
      else botChars += len;
    }

    return { totalChars, totalMsgs, userChars, botChars };
  }

  function ensureFab() {
    let el = document.getElementById(FAB_ID);
    if (el) return el;

    el = document.createElement("button");
    el.id = FAB_ID;
    el.type = "button";
    el.setAttribute("data-ext", MODULE_ID);
    el.title = "字數統計";

    // 半透明小圖標（右上角）
    el.style.position = "fixed";
    el.style.top = "64px";
    el.style.right = "14px";
    el.style.zIndex = "99999";
    el.style.width = "34px";
    el.style.height = "34px";
    el.style.borderRadius = "999px";
    el.style.border = "1px solid rgba(255,255,255,0.18)";
    el.style.background = "rgba(0,0,0,0.28)";
    el.style.backdropFilter = "blur(8px)";
    el.style.webkitBackdropFilter = "blur(8px)";
    el.style.color = "rgba(255,255,255,0.92)";
    el.style.display = "flex";
    el.style.alignItems = "center";
    el.style.justifyContent = "center";
    el.style.cursor = "pointer";
    el.style.userSelect = "none";
    el.style.boxShadow = "0 8px 20px rgba(0,0,0,0.20)";

    // 圖標內容：Σ
    el.textContent = "Σ";

    document.body.appendChild(el);
    return el;
  }

  function ensurePanel() {
    let panel = document.getElementById(PANEL_ID);
    if (panel) return panel;

    panel = document.createElement("div");
    panel.id = PANEL_ID;
    panel.setAttribute("data-ext", MODULE_ID);

    panel.style.position = "fixed";
    panel.style.top = "106px";
    panel.style.right = "14px";
    panel.style.zIndex = "100000";
    panel.style.minWidth = "220px";
    panel.style.padding = "10px 12px";
    panel.style.borderRadius = "14px";
    panel.style.border = "1px solid rgba(255,255,255,0.18)";
    panel.style.background = "rgba(0,0,0,0.45)";
    panel.style.backdropFilter = "blur(10px)";
    panel.style.webkitBackdropFilter = "blur(10px)";
    panel.style.color = "rgba(255,255,255,0.92)";
    panel.style.boxShadow = "0 12px 30px rgba(0,0,0,0.28)";
    panel.style.fontSize = "13px";
    panel.style.lineHeight = "1.6";
    panel.style.display = "none";

    panel.innerHTML = `
      <div style="display:flex; align-items:center; justify-content:space-between; gap:10px;">
        <div style="font-weight:600;">字數統計</div>
        <button id="wtc-close" type="button"
          style="border:none; background:transparent; color:rgba(255,255,255,0.85); cursor:pointer; font-size:16px; line-height:1;">
          ×
        </button>
      </div>
      <div id="wtc-body" style="margin-top:8px; white-space:nowrap;"></div>
      <div style="margin-top:8px; opacity:0.75; font-size:12px;">點 Σ 開/關，點空白處可收起</div>
    `;

    document.body.appendChild(panel);

    panel.querySelector("#wtc-close")?.addEventListener("click", () => {
      panel.style.display = "none";
    });

    return panel;
  }

  function renderPanel() {
    const panel = ensurePanel();
    const body = panel.querySelector("#wtc-body");
    if (!body) return;

    const { totalChars, totalMsgs, userChars, botChars } = computeStats();

    // 你要「整個聊天字數」：這裡就是 totalChars（以「字元數」算）
    body.innerHTML = `
      <div>整體字數：<b>${totalChars}</b></div>
      <div>訊息筆數：<b>${totalMsgs}</b></div>
      <div style="margin-top:6px; opacity:0.9;">使用者字數：${userChars}</div>
      <div style="opacity:0.9;">AI字數：${botChars}</div>
    `;
  }

  function togglePanel() {
    const panel = ensurePanel();
    const isOpen = panel.style.display !== "none";
    if (isOpen) {
      panel.style.display = "none";
    } else {
      renderPanel();
      panel.style.display = "block";
    }
  }

  function bindEvents() {
    const fab = ensureFab();
    ensurePanel();

    fab.addEventListener("click", (e) => {
      e.stopPropagation();
      togglePanel();
    });

    // 點空白處自動收起
    document.addEventListener("click", (e) => {
      const panel = document.getElementById(PANEL_ID);
      if (!panel || panel.style.display === "none") return;
      const fabEl = document.getElementById(FAB_ID);
      if (panel.contains(e.target) || (fabEl && fabEl.contains(e.target))) return;
      panel.style.display = "none";
    });

    // 避免點面板內部被外面 click 收掉
    document.getElementById(PANEL_ID)?.addEventListener("click", (e) => e.stopPropagation());
  }

  function start() {
    bindEvents();

    // 低成本更新：面板開著時，每秒更新一次（你在聊天增加字數會跟著變）
    setInterval(() => {
      const panel = document.getElementById(PANEL_ID);
      if (panel && panel.style.display !== "none") renderPanel();
    }, 1000);
  }

  // 等 SillyTavern 掛好再啟動
  const t0 = Date.now();
  const timer = setInterval(() => {
    const ok = window.SillyTavern && typeof window.SillyTavern.getContext === "function";
    if (ok) {
      clearInterval(timer);
      start();
      return;
    }
    if (Date.now() - t0 > 10000) clearInterval(timer);
  }, 200);
})();