export const configPage = String.raw`<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>CECI FUNCIONALIDADES</title>
  <style>
    :root {
      color-scheme: light;
      --bg: #f5f7fb;
      --surface: #ffffff;
      --soft-surface: #f1f5fb;
      --chip: #e7edf5;
      --line: #dbe3ef;
      --line-strong: #c8d3e1;
      --text: #071225;
      --muted: #60728a;
      --brand: #4b43e6;
      --brand-2: #2554d9;
      --brand-soft: #eef1ff;
      --blue: #2554d9;
      --green: #22c55e;
      --yellow: #f59e0b;
      --red: #dc2626;
      --shadow: 0 12px 36px rgba(15, 23, 42, .08);
      font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      min-height: 100vh;
      color: var(--text);
      background: var(--bg);
      overflow-x: hidden;
    }
    button, input, select, textarea { font: inherit; }
    button { cursor: pointer; }
    .app { display: grid; grid-template-columns: 282px minmax(0, 1fr); min-height: 100vh; }
    .sidebar {
      position: sticky;
      top: 0;
      z-index: 20;
      height: 100vh;
      padding: 18px 14px;
      border-right: 0;
      border-bottom: 0;
      background: #24438f;
      color: #eaf0ff;
      display: flex;
      flex-direction: column;
      align-items: stretch;
      gap: 18px;
    }
    .brand { display: flex; align-items: center; gap: 10px; margin: 0; min-width: 0; padding: 0 10px 12px; border-bottom: 1px solid rgba(255,255,255,.12); }
    .mark {
      width: 24px;
      height: 24px;
      display: grid;
      place-items: center;
      border-radius: 6px;
      background: rgba(255,255,255,.12);
      color: #dce6ff;
      font-weight: 900;
      font-size: 12px;
      box-shadow: none;
    }
    h1, h2, h3, p { margin-top: 0; }
    .brand h1 { margin: 0; font-size: 14px; line-height: 1.08; color: #fff; font-weight: 800; letter-spacing: 0; }
    .brand h1 span { color: #dce6ff !important; }
    .brand p { margin: 3px 0 0; color: #b9c8ec; font-size: 11px; font-weight: 600; letter-spacing: 0; }
    .nav { display: grid; gap: 6px; flex: 0 0 auto; min-width: 0; }
    .nav-group {
      display: grid;
      gap: 8px;
    }
    .nav button {
      width: 100%;
      border: 1px solid transparent;
      border-radius: 6px;
      padding: 10px 11px;
      color: #d8e3ff;
      background: transparent;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
      text-align: left;
      font-size: 13px;
      font-weight: 500;
      white-space: nowrap;
    }
    .nav button.nav-parent {
      color: #fff;
      background: transparent;
      border-color: transparent;
      font-weight: 700;
    }
    .nav button.active, .nav button:hover {
      color: #fff;
      border-color: transparent;
      background: rgba(255,255,255,.14);
    }
    .nav b { display: flex; align-items: center; gap: 10px; font-weight: inherit; }
    .nav span { color: inherit; font-size: 11px; opacity: .75; }
    .nav-icon {
      width: 18px;
      height: 18px;
      display: inline-grid;
      place-items: center;
      position: relative;
      flex: 0 0 auto;
      color: currentColor;
      opacity: .95;
    }
    .dot {
      width: 18px;
      height: 18px;
      border-radius: 4px;
      background:
        linear-gradient(currentColor, currentColor) 4px 5px / 10px 2px no-repeat,
        linear-gradient(currentColor, currentColor) 4px 11px / 10px 2px no-repeat;
      border: 1px solid rgba(255,255,255,.45);
      box-shadow: none;
      opacity: .92;
    }
    .icon-clients:before,
    .icon-clients:after {
      content: "";
      position: absolute;
      border-radius: 999px;
      border: 1.6px solid currentColor;
    }
    .icon-clients:before {
      width: 6px;
      height: 6px;
      top: 2px;
      left: 6px;
    }
    .icon-clients:after {
      width: 13px;
      height: 7px;
      left: 2px;
      bottom: 2px;
      border-top-left-radius: 9px;
      border-top-right-radius: 9px;
      border-bottom: 0;
    }
    .icon-automation:before {
      content: "";
      width: 14px;
      height: 14px;
      border: 1.6px solid currentColor;
      border-radius: 999px;
      background:
        radial-gradient(circle, currentColor 0 2px, transparent 2.5px),
        linear-gradient(currentColor, currentColor) 50% 0 / 2px 4px no-repeat,
        linear-gradient(currentColor, currentColor) 50% 100% / 2px 4px no-repeat,
        linear-gradient(90deg, currentColor, currentColor) 0 50% / 4px 2px no-repeat,
        linear-gradient(90deg, currentColor, currentColor) 100% 50% / 4px 2px no-repeat;
    }
    .icon-sessions:before {
      content: "";
      width: 15px;
      height: 12px;
      border: 1.6px solid currentColor;
      border-radius: 4px;
      background:
        linear-gradient(currentColor, currentColor) 3px 4px / 8px 1.5px no-repeat,
        linear-gradient(currentColor, currentColor) 3px 8px / 6px 1.5px no-repeat;
    }
    .icon-sessions:after {
      content: "";
      position: absolute;
      left: 5px;
      bottom: 1px;
      width: 5px;
      height: 5px;
      background: #24438f;
      border-left: 1.6px solid currentColor;
      border-bottom: 1.6px solid currentColor;
      transform: rotate(-45deg);
    }
    .icon-webhook:before {
      content: "";
      width: 15px;
      height: 15px;
      border: 1.6px solid currentColor;
      border-radius: 5px;
      background:
        radial-gradient(circle, currentColor 0 1.7px, transparent 2px) 3px 3px / 6px 6px no-repeat,
        radial-gradient(circle, currentColor 0 1.7px, transparent 2px) 8px 8px / 6px 6px no-repeat,
        linear-gradient(135deg, transparent 43%, currentColor 45% 55%, transparent 57%);
    }
    .nav-children {
      display: grid;
      gap: 4px;
      padding-left: 34px;
      margin-left: 0;
      border-left: 0;
    }
    .nav-group.collapsed .nav-children { display: none; }
    .nav-children button {
      min-height: 38px;
      padding: 10px 12px;
      font-size: 13px;
      background: transparent;
      border-color: transparent;
      color: #d8e3ff;
      justify-content: flex-start;
    }
    .nav-chev {
      transition: transform .18s ease;
    }
    .nav-group.collapsed .nav-chev {
      transform: rotate(-90deg);
    }
    .side-card {
      margin: auto 0 0;
      min-width: 0;
      padding: 14px;
      border: 1px solid rgba(255,255,255,.13);
      border-radius: 6px;
      background: rgba(255,255,255,.08);
    }
    .side-card strong { display: block; margin-bottom: 2px; color: #fff; font-size: 13px; font-weight: 700; }
    .side-card p { margin: 0; color: #b9c8ec; font-size: 11px; line-height: 1.35; }
    .main { position: relative; padding: 20px 28px 28px; min-width: 0; }
    .topbar { display: grid; grid-template-columns: minmax(0, 1fr) 390px; gap: 16px; align-items: stretch; margin-bottom: 16px; }
    .hero, .control, .card, .metric {
      border: 1px solid var(--line);
      background: var(--surface);
      box-shadow: var(--shadow);
    }
    .hero {
      border-radius: 8px;
      padding: 18px 20px;
      min-height: 136px;
      overflow: hidden;
      position: relative;
    }
    .hero:after {
      content: "";
      position: absolute;
      right: 18px;
      bottom: 16px;
      width: 160px;
      height: 8px;
      border-radius: 999px;
      background: linear-gradient(90deg, var(--brand), var(--brand-2));
    }
    .eyebrow { color: var(--brand); font-size: 12px; font-weight: 900; letter-spacing: .08em; text-transform: uppercase; }
    .hero h2 { margin: 7px 0 8px; font-size: clamp(24px, 3vw, 34px); line-height: 1.05; letter-spacing: 0; color: var(--text); }
    .hero p { color: var(--muted); max-width: 760px; line-height: 1.48; margin-bottom: 0; }
    .control { border-radius: 8px; padding: 16px; display: grid; gap: 12px; }
    label { display: grid; gap: 7px; color: var(--muted); font-size: 12px; font-weight: 800; }
    input, select, textarea {
      width: 100%;
      border: 1px solid var(--line-strong);
      border-radius: 8px;
      background: #fff;
      color: var(--text);
      padding: 10px 12px;
      outline: none;
    }
    textarea { min-height: 90px; resize: vertical; }
    input:focus, select:focus, textarea:focus { border-color: var(--brand); box-shadow: 0 0 0 3px rgba(75,67,230,.12); }
    .grid { display: grid; gap: 16px; }
    .two { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    .three { grid-template-columns: repeat(3, minmax(0, 1fr)); }
    .four { grid-template-columns: repeat(4, minmax(0, 1fr)); }
    .split { grid-template-columns: minmax(0, 1.42fr) minmax(320px, .78fr); }
    .card { border-radius: 8px; padding: 18px; min-width: 0; }
    .card-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; margin-bottom: 14px; }
    .card h3 { margin: 0; font-size: 18px; color: var(--text); }
    .card p { margin: 5px 0 0; color: var(--muted); line-height: 1.45; }
    .metric { border-radius: 8px; padding: 16px; min-height: 96px; background: var(--surface); }
    .metric span { color: var(--muted); font-size: 11px; font-weight: 900; letter-spacing: .08em; text-transform: uppercase; }
    .metric strong { display: block; margin-top: 12px; font-size: 28px; overflow-wrap: anywhere; color: var(--text); }
    .metric small { color: var(--muted); }
    .btn {
      border: 1px solid var(--line-strong);
      border-radius: 999px;
      padding: 10px 13px;
      min-height: 38px;
      color: var(--brand);
      background: #fff;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      font-size: 13px;
      font-weight: 800;
      box-shadow: none;
    }
    .btn:hover { background: var(--brand-soft); border-color: #cfd6ff; }
    .btn.primary { border: 0; color: #fff; background: var(--brand); font-weight: 900; box-shadow: 0 8px 18px rgba(75,67,230,.18); }
    .btn.primary:hover { background: #3f37d8; }
    .btn.warn { color: var(--brand); border-color: #cfd6ff; background: #fff; }
    .btn.ghost { background: transparent; color: var(--muted); }
    .row { display: flex; gap: 10px; align-items: center; flex-wrap: wrap; }
    .alert { display: none; margin-bottom: 16px; padding: 12px 14px; border-radius: 8px; border: 1px solid var(--line); background: #fff; }
    .alert.show { display: block; }
    .alert.ok { color: var(--green); border-color: rgba(49,230,161,.3); }
    .alert.bad { color: var(--red); border-color: rgba(255,111,127,.32); }
    .muted { color: var(--muted); }
    .tiny { font-size: 12px; }
    .mono { font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; }
    .pill { display: inline-flex; align-items: center; gap: 7px; border: 1px solid transparent; border-radius: 999px; padding: 6px 10px; color: var(--brand); background: var(--chip); font-size: 12px; font-weight: 900; white-space: nowrap; }
    .pill.ok { color: #087a42; background: #dff8ea; }
    .pill.bad { color: var(--red); background: #fee2e2; }
    .pill.wait { color: #9a5b00; background: #fef3c7; }
    .list { display: grid; gap: 10px; }
    .item { display: grid; grid-template-columns: minmax(0, 1fr) auto; gap: 12px; align-items: center; padding: 14px; border: 1px solid var(--line); border-radius: 8px; background: #fff; }
    .item.active { border-color: #cfd6ff; background: #f7f8ff; box-shadow: 0 0 0 3px rgba(75,67,230,.08); }
    .empty { padding: 34px 20px; border: 1px dashed var(--line-strong); border-radius: 8px; color: var(--muted); text-align: center; background: #fff; }
    .table-wrap { overflow-x: auto; border: 1px solid var(--line); border-radius: 8px; background: #fff; }
    table { width: 100%; min-width: 760px; border-collapse: collapse; }
    th, td { padding: 12px; border-bottom: 1px solid var(--line); text-align: left; vertical-align: middle; }
    th { background: var(--soft-surface); color: var(--muted); font-size: 11px; letter-spacing: .08em; text-transform: uppercase; }
    tr:last-child td { border-bottom: 0; }
    .collapsible.collapsed .body { display: none; }
    .chev { transition: transform .18s ease; display: inline-block; }
    .collapsed .chev { transform: rotate(-90deg); }
    .agent-row { display: grid; grid-template-columns: 42px minmax(180px, 1fr) 140px 140px; gap: 10px; align-items: center; padding: 10px; border: 1px solid var(--line); border-radius: 8px; background: #fff; }
    .toggle { width: 20px; height: 20px; accent-color: var(--green); }
    dialog { width: min(920px, calc(100vw - 28px)); border: 1px solid var(--line); border-radius: 8px; color: var(--text); background: #fff; box-shadow: var(--shadow); padding: 0; }
    dialog::backdrop { background: rgba(15,23,42,.46); backdrop-filter: blur(3px); }
    .dialog-head { display: flex; justify-content: space-between; align-items: center; gap: 12px; padding: 16px 18px; border-bottom: 1px solid var(--line); }
    .dialog-body { padding: 18px; max-height: 72vh; overflow: auto; }
    pre { white-space: pre-wrap; word-break: break-word; margin: 0; padding: 14px; border: 1px solid var(--line); border-radius: 8px; background: #f8fafc; color: var(--text); }
    .chat { display: grid; gap: 12px; padding: 18px; border: 1px solid var(--line); border-radius: 8px; background: #fff; }
    .bubble { max-width: 82%; padding: 12px 14px; border-radius: 8px; line-height: 1.45; box-shadow: none; }
    .bubble.customer { justify-self: start; background: #f1f5f9; border-bottom-left-radius: 2px; }
    .bubble.agent { justify-self: end; background: #eaf2ff; border-bottom-right-radius: 2px; }
    .bubble small { display: block; margin-bottom: 5px; color: #52657c; font-size: 11px; font-weight: 800; }
    @media (max-width: 980px) {
      .app, .topbar, .split, .two, .three, .four { grid-template-columns: 1fr; }
      .sidebar { position: relative; height: auto; padding: 14px; align-items: stretch; flex-direction: column; gap: 12px; }
      .nav { flex-wrap: wrap; }
      .side-card { margin: 0; width: 100%; border-radius: 8px; }
      .main { padding: 16px; }
      .agent-row { grid-template-columns: 34px 1fr; }
    }
  </style>
</head>
<body>
  <div class="app">
    <aside class="sidebar">
      <div class="brand">
        <div class="mark">C</div>
        <div>
          <h1>ceci<span style="color:#2554d9">.CHAT</span></h1>
          <p>CECI FUNCIONALIDADES</p>
        </div>
      </div>
      <nav class="nav" id="nav">
        <div class="nav-group" id="sem-resposta-nav">
          <button class="nav-parent" data-action="toggle-sem-resposta-nav" type="button"><b><i class="dot"></i>SEM RESPOSTA</b><span class="nav-chev">v</span></button>
          <div class="nav-children">
            <button data-tab="clients" class="active"><b><i class="nav-icon icon-clients"></i>Clientes</b></button>
            <button data-tab="automation"><b><i class="nav-icon icon-automation"></i>Automacao</b></button>
            <button data-tab="sessions"><b><i class="nav-icon icon-sessions"></i>Sessoes</b></button>
            <button data-tab="webhook"><b><i class="nav-icon icon-webhook"></i>Webhook</b></button>
          </div>
        </div>
      </nav>
      <div class="side-card">
        <strong id="side-client">Nenhum cliente ativo</strong>
        <p id="side-copy">Crie ou selecione um cliente para carregar configuracoes e logs separados.</p>
      </div>
    </aside>

    <main class="main">
      <div class="topbar">
        <section class="hero">
          <div class="eyebrow">CECI FUNCIONALIDADES</div>
          <h2>CECI FUNCIONALIDADES</h2>
          <p>Transferencia automatica, logs de webhook, regras por atendente, sessoes monitoradas e rankings por cliente em uma unica central.</p>
        </section>
        <section class="control">
          <label>Cliente ativo
            <select id="active-client-select"></select>
          </label>
          <form id="public-url-form" class="grid">
            <label>URL publica
              <input name="publicBaseUrl" id="public-base-url" placeholder="https://seu-ngrok.ngrok-free.app" />
            </label>
            <button class="btn primary" type="submit">Salvar URL publica</button>
          </form>
        </section>
      </div>

      <div id="alert" class="alert"></div>
      <section id="metrics" class="grid four"></section>
      <section id="page" class="grid" style="margin-top:16px"></section>
    </main>
  </div>

  <dialog id="log-dialog">
    <div class="dialog-head">
      <strong id="log-title">Log</strong>
      <button class="btn ghost" data-action="close-log" type="button">Fechar</button>
    </div>
    <div class="dialog-body"><pre id="log-json"></pre></div>
  </dialog>

  <dialog id="summary-dialog">
    <div class="dialog-head">
      <strong id="summary-title">Resumo do atendimento</strong>
      <button class="btn ghost" data-action="close-summary" type="button">Fechar</button>
    </div>
    <div class="dialog-body" id="summary-body"></div>
  </dialog>

  <script>
    const state = {
      tab: "clients",
      clients: [],
      activeClientId: null,
      publicBaseUrl: "",
      logs: [],
      actionLogs: [],
      sessions: [],
      scoreboard: [],
      clientRanking: [],
      departmentsByClientId: {},
      agentRulesByClientId: {},
      actionLogsCollapsed: false,
      webhookLogsCollapsed: false,
      sessionPanelLoadId: 0,
      lastRefreshAt: null
    };

    const el = {
      nav: document.getElementById("nav"),
      page: document.getElementById("page"),
      metrics: document.getElementById("metrics"),
      alert: document.getElementById("alert"),
      activeClientSelect: document.getElementById("active-client-select"),
      publicBaseUrl: document.getElementById("public-base-url"),
      sideClient: document.getElementById("side-client"),
      sideCopy: document.getElementById("side-copy"),
      logDialog: document.getElementById("log-dialog"),
      logTitle: document.getElementById("log-title"),
      logJson: document.getElementById("log-json"),
      summaryDialog: document.getElementById("summary-dialog"),
      summaryTitle: document.getElementById("summary-title"),
      summaryBody: document.getElementById("summary-body")
    };

    function escapeHtml(value) {
      return String(value ?? "").replace(/[&<>'"]/g, function(char) {
        return { "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", "\"": "&quot;" }[char];
      });
    }

    function activeClient() {
      return state.clients.find(function(client) { return client.id === state.activeClientId; }) || state.clients[0] || null;
    }

    function showAlert(message, type) {
      el.alert.textContent = message;
      el.alert.className = "alert show " + (type || "ok");
      window.clearTimeout(showAlert.timer);
      showAlert.timer = window.setTimeout(function() { el.alert.className = "alert"; }, 4300);
    }

    function formatDate(value) {
      if (!value) return "-";
      try { return new Date(value).toLocaleString("pt-BR"); } catch (_error) { return value; }
    }

    function secondsLabel(value) {
      if (value === null || value === undefined) return "sem timer";
      const safe = Math.max(0, Number(value));
      const minutes = Math.floor(safe / 60);
      const seconds = safe % 60;
      return minutes ? minutes + "m " + String(seconds).padStart(2, "0") + "s" : seconds + "s";
    }

    function statusPill(status) {
      const text = status || "SEM STATUS";
      let kind = "";
      if (text === "RETURNED_TO_QUEUE" || text === "TRANSFERRED") kind = "ok";
      if (text === "WAITING_SELLER" || text === "IN_PROGRESS") kind = "wait";
      if (text === "ERROR") kind = "bad";
      return '<span class="pill ' + kind + '">' + escapeHtml(text) + '</span>';
    }

    function metric(label, value, hint) {
      return '<div class="metric"><span>' + escapeHtml(label) + '</span><strong>' + escapeHtml(value) + '</strong><small>' + escapeHtml(hint) + '</small></div>';
    }

    function webhookUrl(client) {
      if (!client || !state.publicBaseUrl) return "";
      return state.publicBaseUrl.replace(/\/+$/, "") + "/webhooks/" + client.webhookToken;
    }

    async function api(path, options) {
      const response = await fetch(path, Object.assign({ headers: { "content-type": "application/json" } }, options || {}));
      const text = await response.text();
      const data = text ? JSON.parse(text) : {};
      if (!response.ok || data.ok === false) throw new Error(data.error || data.message || "Falha na requisicao");
      return data;
    }

    async function loadConfig() {
      const data = await api("/api/automation-config");
      state.clients = data.clients || [];
      state.activeClientId = data.activeClientId || (state.clients[0] && state.clients[0].id) || null;
      state.publicBaseUrl = data.publicBaseUrl || "";
      render();
      await loadClientScopedData();
    }

    async function loadClientScopedData() {
      const client = activeClient();
      state.sessionPanelLoadId += 1;
      const loadId = state.sessionPanelLoadId;
      if (!client) {
        state.logs = [];
        state.actionLogs = [];
        state.sessions = [];
        state.scoreboard = [];
        render();
        return;
      }
      await Promise.all([
        loadWebhookLogs(loadId),
        loadActionLogs(loadId),
        loadMonitoredSessions(loadId),
        loadAgentScoreboard(loadId),
        loadClientRanking(loadId)
      ]);
      state.lastRefreshAt = new Date();
      render();
    }

    async function loadWebhookLogs(loadId) {
      const client = activeClient();
      if (!client) return;
      try {
        const data = await api("/api/clients/" + client.id + "/webhook-logs");
        if (loadId === state.sessionPanelLoadId) state.logs = data.logs || [];
      } catch (_error) {
        if (loadId === state.sessionPanelLoadId) state.logs = [];
      }
    }

    async function loadActionLogs(loadId) {
      const client = activeClient();
      if (!client) return;
      try {
        const data = await api("/api/clients/" + client.id + "/action-logs");
        if (loadId === state.sessionPanelLoadId) state.actionLogs = data.logs || [];
      } catch (_error) {
        if (loadId === state.sessionPanelLoadId) state.actionLogs = [];
      }
    }

    async function loadMonitoredSessions(loadId) {
      const client = activeClient();
      if (!client) return;
      try {
        const data = await api("/api/clients/" + client.id + "/monitored-sessions");
        if (loadId === state.sessionPanelLoadId) state.sessions = data.sessions || [];
      } catch (_error) {
        if (loadId === state.sessionPanelLoadId) state.sessions = [];
      }
    }

    async function loadAgentScoreboard(loadId) {
      const client = activeClient();
      if (!client) return;
      try {
        const data = await api("/api/clients/" + client.id + "/agent-scoreboard");
        if (loadId === state.sessionPanelLoadId) state.scoreboard = data.scoreboard || [];
      } catch (_error) {
        if (loadId === state.sessionPanelLoadId) state.scoreboard = [];
      }
    }

    async function loadClientRanking(loadId) {
      try {
        const data = await api("/api/client-ranking");
        if (loadId === state.sessionPanelLoadId) state.clientRanking = data.ranking || [];
      } catch (_error) {
        if (loadId === state.sessionPanelLoadId) state.clientRanking = [];
      }
    }

    function render() {
      renderNavigation();
      renderTopControls();
      renderMetrics();
      if (state.tab === "clients") renderClients();
      if (state.tab === "automation") renderAutomation();
      if (state.tab === "sessions") renderSessions();
      if (state.tab === "webhook") renderWebhook();
    }

    function renderNavigation() {
      Array.from(el.nav.querySelectorAll("button")).forEach(function(button) {
        button.classList.toggle("active", button.dataset.tab === state.tab);
      });
      const client = activeClient();
      el.sideClient.textContent = client ? client.name : "Nenhum cliente ativo";
      el.sideCopy.textContent = client ? "Timer: " + client.timeoutMinutes + " min | dados isolados por cliente" : "Crie ou selecione um cliente para iniciar.";
    }

    function renderTopControls() {
      el.activeClientSelect.innerHTML = state.clients.length ? state.clients.map(function(client) {
        return '<option value="' + escapeHtml(client.id) + '" ' + (client.id === state.activeClientId ? "selected" : "") + '>' + escapeHtml(client.name) + '</option>';
      }).join("") : '<option value="">Crie um cliente</option>';
      el.publicBaseUrl.value = state.publicBaseUrl || "";
    }

    function renderMetrics() {
      const client = activeClient();
      const waiting = state.sessions.filter(function(session) { return session.status === "WAITING_SELLER" || session.status === "IN_PROGRESS"; }).length;
      const transferred = state.sessions.filter(function(session) { return session.status === "RETURNED_TO_QUEUE"; }).length;
      const errors = state.actionLogs.filter(function(log) { return log.status === "ERROR"; }).length + state.logs.filter(function(log) { return log.error; }).length;
      el.metrics.innerHTML = [
        metric("Cliente ativo", client ? client.name : "-", client ? "configuracao isolada" : "sem cliente"),
        metric("Sessoes", state.sessions.length, waiting + " em acompanhamento"),
        metric("Transferidas", transferred, "automaticas neste cliente"),
        metric("Alertas", errors, "erros em logs e acoes")
      ].join("");
    }

    function renderClients() {
      el.page.innerHTML = '<div class="grid split">' +
        '<section class="card"><div class="card-head"><div><h3>Criar cliente</h3><p>Separe token, webhook, timer e logs por cliente.</p></div></div>' +
        '<form id="create-client-form" class="grid">' +
        '<label>Nome do cliente<input name="name" required placeholder="Ex: Loja Matriz" /></label>' +
        '<div class="grid two"><label>ID da empresa na CECI<input name="ceciCompanyId" placeholder="companyId opcional" /></label><label>Tempo sem resposta (min)<input name="timeoutMinutes" type="number" min="1" max="240" value="5" /></label></div>' +
        '<button class="btn primary" type="submit">Criar cliente</button>' +
        '</form></section>' +
        '<section class="card"><div class="card-head"><div><h3>Clientes</h3><p>Selecione um cliente para carregar a operacao dele.</p></div></div><div class="list">' + renderClientList() + '</div></section>' +
        '</div>';
    }

    function renderClientList() {
      if (!state.clients.length) return '<div class="empty">Nenhum cliente cadastrado ainda.</div>';
      return state.clients.map(function(client) {
        return '<article class="item ' + (client.id === state.activeClientId ? "active" : "") + '"><div><strong>' + escapeHtml(client.name) + '</strong><p class="muted tiny">Timer ' + client.timeoutMinutes + ' min | ' + (client.ceciCompanyId ? "Empresa " + escapeHtml(client.ceciCompanyId) : "Sem empresa vinculada") + '</p></div><button class="btn" data-action="select-client" data-client-id="' + escapeHtml(client.id) + '">Usar</button></article>';
      }).join("");
    }

    function renderAutomation() {
      const client = activeClient();
      if (!client) { el.page.innerHTML = '<div class="empty">Crie um cliente para configurar automacoes.</div>'; return; }
      const url = webhookUrl(client);
      const departments = state.departmentsByClientId[client.id] || [];
      const agents = state.agentRulesByClientId[client.id] || [];
      el.page.innerHTML = '<div class="grid split">' +
        '<section class="card"><div class="card-head"><div><h3>Automacao do cliente</h3><p>Timer, API, fila de retorno e horario global.</p></div></div>' +
        '<form id="automation-form" class="grid" data-client-id="' + escapeHtml(client.id) + '">' +
        '<div class="grid two"><label>Nome<input name="name" value="' + escapeHtml(client.name) + '" required /></label><label>ID da empresa CECI<input name="ceciCompanyId" value="' + escapeHtml(client.ceciCompanyId || "") + '" /></label></div>' +
        '<div class="grid three"><label>Tempo por cliente (min)<input name="timeoutMinutes" type="number" min="1" max="240" value="' + escapeHtml(client.timeoutMinutes) + '" /></label><label>Comeca a transferir<input name="transferWindowStart" type="time" value="' + escapeHtml(client.transferWindowStart || "") + '" /></label><label>Para de transferir<input name="transferWindowEnd" type="time" value="' + escapeHtml(client.transferWindowEnd || "") + '" /></label></div>' +
        '<label>Token da API FLW/CECI<input name="wtsApiToken" type="password" placeholder="' + (client.hasWtsApiToken ? "Token salvo. Preencha apenas para trocar." : "Cole o token do cliente") + '" autocomplete="off" /></label>' +
        '<label>URL de transferencia<input name="wtsTransferSessionUrl" value="' + escapeHtml(client.wtsTransferSessionUrl || "https://api.wts.chat/chat/v1/session/{id}/transfer") + '" /></label>' +
        '<div class="grid two"><label>Fila/departamento de retorno<select name="transferDepartmentId">' + departmentOptions(client, departments) + '</select></label><label>Nome da fila selecionada<input name="transferDepartmentName" value="' + escapeHtml(client.transferDepartmentName || "") + '" /></label></div>' +
        '<label>Webhook para colar na CECI<input readonly value="' + escapeHtml(url || "Configure a URL publica primeiro") + '" /></label>' +
        '<div class="row"><button class="btn primary" type="submit">Salvar automacao</button><button class="btn" type="button" data-action="copy-webhook">Copiar webhook</button><button class="btn" type="button" data-action="load-departments">Buscar filas</button></div>' +
        '<div class="grid two"><label>ID do atendimento para teste<input name="testSessionId" placeholder="session id" /></label><div class="row" style="align-self:end"><button class="btn warn" type="button" data-action="test-transfer">Testar transferencia</button><button class="btn primary" type="button" data-action="test-ai-transfer">Transferir com resumo IA</button></div></div>' +
        '</form></section>' +
        '<section class="card"><div class="card-head"><div><h3>Usuarios com regra propria</h3><p>Escolha quem entra na automacao e o horario por atendente.</p></div><button class="btn" data-action="load-agents" type="button">Buscar usuarios</button></div>' +
        '<div id="agents-panel">' + renderAgentRules(client, agents) + '</div></section>' +
        '</div>';
    }

    function departmentOptions(client, departments) {
      let html = '<option value="">Selecione uma fila</option>';
      if (client.transferDepartmentId) html += '<option selected value="' + escapeHtml(client.transferDepartmentId) + '">' + escapeHtml(client.transferDepartmentName || client.transferDepartmentId) + '</option>';
      departments.forEach(function(dept) {
        const id = dept.id || dept.departmentId || dept.value || "";
        const name = dept.name || dept.description || dept.label || id;
        if (!id || id === client.transferDepartmentId) return;
        html += '<option value="' + escapeHtml(id) + '" data-name="' + escapeHtml(name) + '">' + escapeHtml(name) + '</option>';
      });
      return html;
    }

    function renderAgentRules(client, agents) {
      if (!agents.length) return '<div class="empty">Busque os usuarios depois de salvar o token deste cliente.</div>';
      return '<form id="agent-rules-form" class="grid" data-client-id="' + escapeHtml(client.id) + '"><div class="grid">' + agents.map(function(agent) {
        return '<div class="agent-row" data-agent-row data-agent-id="' + escapeHtml(agent.id) + '" data-agent-name="' + escapeHtml(agent.name || agent.email || agent.id) + '">' +
          '<input class="toggle" type="checkbox" name="enabled" ' + (agent.enabled === false ? "" : "checked") + ' />' +
          '<div><strong>' + escapeHtml(agent.name || agent.id) + '</strong><p class="muted tiny">' + escapeHtml(agent.email || agent.agentId || agent.id) + '</p></div>' +
          '<label>Inicio<input type="time" name="transferWindowStart" value="' + escapeHtml(agent.transferWindowStart || "") + '" /></label>' +
          '<label>Fim<input type="time" name="transferWindowEnd" value="' + escapeHtml(agent.transferWindowEnd || "") + '" /></label>' +
        '</div>';
      }).join("") + '</div><button class="btn primary" type="submit">Salvar regras dos usuarios</button></form>';
    }

    function renderSessions() {
      const client = activeClient();
      if (!client) { el.page.innerHTML = '<div class="empty">Selecione um cliente para ver sessoes.</div>'; return; }
      el.page.innerHTML = '<div class="grid">' +
        '<section class="card"><div class="card-head"><div><h3>Sessoes monitoradas</h3><p>Atualiza automaticamente. Ultima leitura: ' + escapeHtml(state.lastRefreshAt ? state.lastRefreshAt.toLocaleTimeString("pt-BR") : "-") + '</p></div><button class="btn" data-action="refresh-sessions">Atualizar agora</button></div>' + renderSessionsTable() + '</section>' +
        '<div class="grid two"><section class="card"><div class="card-head"><div><h3>Placar dos atendentes</h3><p>Ativos, expirados e tempo medio.</p></div></div>' + renderScoreboard() + '</section>' +
        '<section class="card"><div class="card-head"><div><h3>Ranking por cliente</h3><p>Comparativo geral da operacao.</p></div></div>' + renderClientRanking() + '</section></div>' +
        '<section class="card collapsible ' + (state.actionLogsCollapsed ? "collapsed" : "") + '"><div class="card-head"><div><h3>Logs de transferencia e resumo</h3><p>Retorno das acoes executadas pelo sistema.</p></div><button class="btn" data-action="toggle-action-logs"><span class="chev">v</span> Logs</button></div><div class="body">' + renderActionLogs() + '</div></section>' +
        '</div>';
    }

    function renderSessionsTable() {
      if (!state.sessions.length) return '<div class="empty">Nenhuma sessao monitorada para este cliente ainda.</div>';
      return '<div class="table-wrap"><table><thead><tr><th>Cliente</th><th>ID atendimento</th><th>Status</th><th>Atendente</th><th>Tempo Redis</th><th>Acoes</th></tr></thead><tbody>' + state.sessions.map(function(session) {
        return '<tr><td>' + escapeHtml(session.clientName || "-") + '</td><td class="mono tiny">' + escapeHtml(session.sessionId) + '</td><td>' + statusPill(session.status) + '</td><td>' + escapeHtml(session.attendantName || "Nao identificado") + '</td><td><span class="pill ' + (session.remainingSource === "redis" ? "ok" : "") + '">' + escapeHtml(secondsLabel(session.redisTtlSeconds ?? session.remainingSeconds)) + '</span></td><td class="row"><button class="btn" data-action="open-summary" data-session-id="' + escapeHtml(session.sessionId) + '">Resumo</button><button class="btn warn" data-action="session-transfer" data-session-id="' + escapeHtml(session.sessionId) + '">Transferir</button><button class="btn primary" data-action="session-ai-transfer" data-session-id="' + escapeHtml(session.sessionId) + '">IA + transferir</button></td></tr>';
      }).join("") + '</tbody></table></div>';
    }

    function renderScoreboard() {
      if (!state.scoreboard.length) return '<div class="empty">Sem dados de atendente para este cliente.</div>';
      return '<div class="table-wrap"><table><thead><tr><th>Atendente</th><th>Ativos</th><th>Expirou</th><th>Media</th></tr></thead><tbody>' + state.scoreboard.map(function(row) {
        return '<tr><td>' + escapeHtml(row.agentName || "Nao identificado") + '</td><td>' + escapeHtml(row.activeSessions) + '</td><td>' + escapeHtml(row.autoTransfers) + '</td><td>' + escapeHtml(row.averageResponseSeconds === null ? "-" : row.averageResponseSeconds + "s") + '</td></tr>';
      }).join("") + '</tbody></table></div>';
    }

    function renderClientRanking() {
      if (!state.clientRanking.length) return '<div class="empty">Sem ranking ainda.</div>';
      return '<div class="table-wrap"><table><thead><tr><th>Cliente</th><th>Monitorados</th><th>Auto</th><th>Mais expira</th></tr></thead><tbody>' + state.clientRanking.map(function(row) {
        return '<tr><td>' + escapeHtml(row.clientName) + '</td><td>' + escapeHtml(row.monitoredSessions) + '</td><td>' + escapeHtml(row.automaticTransfers) + '</td><td>' + escapeHtml(row.topExpirer ? row.topExpirer.agentName + " (" + row.topExpirer.expirations + ")" : "-") + '</td></tr>';
      }).join("") + '</tbody></table></div>';
    }

    function renderActionLogs() {
      if (!state.actionLogs.length) return '<div class="empty">Nenhum log de transferencia ou nota ainda.</div>';
      return '<div class="list">' + state.actionLogs.map(function(log) {
        return '<article class="item"><div><strong>' + escapeHtml(log.actionType) + ' - ' + escapeHtml(log.status) + '</strong><p class="muted tiny">' + escapeHtml(formatDate(log.createdAt)) + ' | sessao ' + escapeHtml(log.sessionId || "-") + '</p><p>' + escapeHtml(log.message || "") + '</p></div><button class="btn" data-action="open-action-log" data-log-id="' + escapeHtml(log.id) + '">Abrir</button></article>';
      }).join("") + '</div>';
    }

    function renderWebhook() {
      const client = activeClient();
      if (!client) { el.page.innerHTML = '<div class="empty">Selecione um cliente para ver webhook.</div>'; return; }
      const url = webhookUrl(client);
      el.page.innerHTML = '<div class="grid">' +
        '<section class="card"><div class="card-head"><div><h3>Webhook do cliente</h3><p>Cole esta URL na CECI para mensagens recebidas, enviadas e atualizacoes de sessao.</p></div><button class="btn primary" data-action="copy-webhook">Copiar</button></div><input readonly value="' + escapeHtml(url || "Configure a URL publica primeiro") + '" /></section>' +
        '<section class="card collapsible ' + (state.webhookLogsCollapsed ? "collapsed" : "") + '"><div class="card-head"><div><h3>Logs do webhook</h3><p>Cada log abre o payload completo recebido da CECI.</p></div><button class="btn" data-action="toggle-webhook-logs"><span class="chev">v</span> Logs</button></div><div class="body">' + renderWebhookLogs() + '</div></section>' +
        '</div>';
    }

    function renderWebhookLogs() {
      if (!state.logs.length) return '<div class="empty">Nenhum webhook recebido para este cliente.</div>';
      return '<div class="list">' + state.logs.map(function(log) {
        return '<article class="item"><div><strong>' + escapeHtml(log.eventType) + ' ' + (log.handled ? '<span class="pill ok">OK</span>' : '<span class="pill bad">Ignorado</span>') + '</strong><p class="muted tiny">' + escapeHtml(formatDate(log.receivedAt)) + ' | sessao ' + escapeHtml(log.sessionId || "-") + '</p><p>' + escapeHtml(log.reason || log.error || "Payload recebido") + '</p></div><button class="btn" data-action="open-webhook-log" data-log-id="' + escapeHtml(log.id) + '">Abrir</button></article>';
      }).join("") + '</div>';
    }

    async function selectClient(clientId) {
      const data = await api("/api/active-client", { method: "POST", body: JSON.stringify({ clientId: clientId }) });
      state.clients = data.clients || [];
      state.activeClientId = data.activeClientId;
      state.publicBaseUrl = data.publicBaseUrl || "";
      render();
      await loadClientScopedData();
      showAlert("Cliente carregado.", "ok");
    }

    async function createClient(form) {
      const values = Object.fromEntries(new FormData(form).entries());
      const data = await api("/api/clients", { method: "POST", body: JSON.stringify({ name: values.name, ceciCompanyId: values.ceciCompanyId, timeoutMinutes: Number(values.timeoutMinutes || 5) }) });
      state.clients = data.clients || [];
      state.activeClientId = data.activeClientId;
      state.publicBaseUrl = data.publicBaseUrl || "";
      form.reset();
      render();
      await loadClientScopedData();
      showAlert("Cliente criado.", "ok");
    }

    async function savePublicUrl(form) {
      const value = new FormData(form).get("publicBaseUrl");
      const data = await api("/api/public-url", { method: "POST", body: JSON.stringify({ publicBaseUrl: value }) });
      state.clients = data.clients || [];
      state.activeClientId = data.activeClientId;
      state.publicBaseUrl = data.publicBaseUrl || "";
      render();
      showAlert("URL publica salva.", "ok");
    }

    async function saveAutomation(form) {
      const clientId = form.dataset.clientId;
      const values = Object.fromEntries(new FormData(form).entries());
      const select = form.querySelector('select[name="transferDepartmentId"]');
      const selected = select && select.options[select.selectedIndex];
      const departmentName = values.transferDepartmentName || (selected && selected.dataset.name) || (selected && selected.textContent) || "";
      const payload = {
        name: values.name,
        ceciCompanyId: values.ceciCompanyId,
        timeoutMinutes: Number(values.timeoutMinutes || 5),
        transferWindowStart: values.transferWindowStart || null,
        transferWindowEnd: values.transferWindowEnd || null,
        transferDepartmentId: values.transferDepartmentId || null,
        transferDepartmentName: values.transferDepartmentId ? departmentName : null,
        wtsTransferSessionUrl: values.wtsTransferSessionUrl
      };
      if (values.wtsApiToken) payload.wtsApiToken = values.wtsApiToken;
      const data = await api("/api/clients/" + clientId, { method: "PATCH", body: JSON.stringify(payload) });
      state.clients = data.clients || [];
      state.activeClientId = data.activeClientId;
      state.publicBaseUrl = data.publicBaseUrl || "";
      render();
      showAlert("Automacao salva para este cliente.", "ok");
    }

    async function loadDepartments() {
      const client = activeClient();
      if (!client) return;
      const data = await api("/api/clients/" + client.id + "/departments");
      state.departmentsByClientId[client.id] = data.departments || [];
      render();
      showAlert("Filas carregadas.", "ok");
    }

    async function loadAgents() {
      const client = activeClient();
      if (!client) return;
      const data = await api("/api/clients/" + client.id + "/agent-automation-rules");
      state.agentRulesByClientId[client.id] = data.agents || [];
      render();
      showAlert("Usuarios carregados.", "ok");
    }

    async function saveAgentRules(form) {
      const clientId = form.dataset.clientId;
      const rules = Array.from(form.querySelectorAll("[data-agent-row]")).map(function(row) {
        return {
          agentId: row.dataset.agentId,
          agentName: row.dataset.agentName,
          enabled: row.querySelector('input[name="enabled"]').checked,
          transferWindowStart: row.querySelector('input[name="transferWindowStart"]').value || null,
          transferWindowEnd: row.querySelector('input[name="transferWindowEnd"]').value || null
        };
      });
      await api("/api/clients/" + clientId + "/agent-automation-rules", { method: "PATCH", body: JSON.stringify({ rules: rules }) });
      await loadAgents();
      showAlert("Regras dos usuarios salvas.", "ok");
    }

    async function testTransfer(sessionId, createAiNote) {
      const client = activeClient();
      if (!client) return;
      await api("/api/clients/" + client.id + "/test-transfer", { method: "POST", body: JSON.stringify({ sessionId: sessionId, createAiNote: Boolean(createAiNote) }) });
      showAlert(createAiNote ? "Transferencia feita e resumo IA criado." : "Transferencia feita.", "ok");
      await loadClientScopedData();
    }

    async function openSummary(sessionId) {
      const client = activeClient();
      if (!client) return;
      el.summaryTitle.textContent = "Resumo do atendimento " + sessionId;
      el.summaryBody.innerHTML = '<div class="empty">Carregando resumo...</div>';
      el.summaryDialog.showModal();
      const data = await api("/api/clients/" + client.id + "/sessions/" + encodeURIComponent(sessionId) + "/summary");
      el.summaryBody.innerHTML = renderSummary(data);
    }

    function renderSummary(data) {
      const messages = data.messagesPreview || [];
      return '<div class="grid"><div class="grid three">' +
        metric("Status", data.status || "-", data.attendantName || "atendente") +
        metric("Tempo restante", secondsLabel(data.remainingSeconds), "timer atual") +
        metric("Motivo provavel", "Regra", data.probableReason || "-") +
        '</div><div class="chat">' + (messages.length ? messages.slice().reverse().map(function(message) {
          const isAgent = message.direction === "TO_HUB";
          return '<div class="bubble ' + (isAgent ? "agent" : "customer") + '"><small>' + escapeHtml(message.agentName || (isAgent ? "Atendente" : "Cliente")) + ' - ' + escapeHtml(formatDate(message.createdAt)) + '</small>' + escapeHtml(message.text || "[sem texto]") + '</div>';
        }).join("") : '<div class="empty">Nenhuma mensagem retornada pela API.</div>') + '</div></div>';
    }

    function openLog(kind, logId) {
      const source = kind === "action" ? state.actionLogs : state.logs;
      const log = source.find(function(item) { return item.id === logId; });
      if (!log) return;
      el.logTitle.textContent = kind === "action" ? "Log de acao" : "Log do webhook";
      el.logJson.textContent = JSON.stringify(log, null, 2);
      el.logDialog.showModal();
    }

    async function copyWebhook() {
      const url = webhookUrl(activeClient());
      if (!url) { showAlert("Configure a URL publica primeiro.", "bad"); return; }
      await navigator.clipboard.writeText(url);
      showAlert("Webhook copiado.", "ok");
    }

    el.nav.addEventListener("click", function(event) {
      const button = event.target.closest("button[data-tab]");
      if (!button) return;
      state.tab = button.dataset.tab;
      render();
      if (state.tab === "sessions" || state.tab === "webhook") loadClientScopedData().catch(function(error) { showAlert(error.message, "bad"); });
    });

    el.activeClientSelect.addEventListener("change", function(event) {
      if (event.target.value) selectClient(event.target.value).catch(function(error) { showAlert(error.message, "bad"); });
    });

    document.addEventListener("submit", function(event) {
      const form = event.target;
      if (form.id === "public-url-form") { event.preventDefault(); savePublicUrl(form).catch(function(error) { showAlert(error.message, "bad"); }); }
      if (form.id === "create-client-form") { event.preventDefault(); createClient(form).catch(function(error) { showAlert(error.message, "bad"); }); }
      if (form.id === "automation-form") { event.preventDefault(); saveAutomation(form).catch(function(error) { showAlert(error.message, "bad"); }); }
      if (form.id === "agent-rules-form") { event.preventDefault(); saveAgentRules(form).catch(function(error) { showAlert(error.message, "bad"); }); }
    });

    document.addEventListener("change", function(event) {
      const select = event.target.closest('select[name="transferDepartmentId"]');
      if (!select) return;
      const form = select.closest("form");
      const nameInput = form && form.querySelector('input[name="transferDepartmentName"]');
      const option = select.options[select.selectedIndex];
      if (nameInput && option) nameInput.value = option.dataset.name || option.textContent || "";
    });

    document.addEventListener("click", function(event) {
      const button = event.target.closest("button[data-action]");
      if (!button) return;
      const action = button.dataset.action;
      if (action === "select-client") selectClient(button.dataset.clientId).catch(function(error) { showAlert(error.message, "bad"); });
      if (action === "toggle-sem-resposta-nav") {
        const group = document.getElementById("sem-resposta-nav");
        if (group) group.classList.toggle("collapsed");
      }
      if (action === "copy-webhook") copyWebhook().catch(function(error) { showAlert(error.message, "bad"); });
      if (action === "load-departments") loadDepartments().catch(function(error) { showAlert(error.message, "bad"); });
      if (action === "load-agents") loadAgents().catch(function(error) { showAlert(error.message, "bad"); });
      if (action === "test-transfer" || action === "test-ai-transfer") {
        const form = document.getElementById("automation-form");
        const input = form && form.querySelector('input[name="testSessionId"]');
        const sessionId = input ? input.value.trim() : "";
        if (!sessionId) { showAlert("Informe o ID do atendimento.", "bad"); return; }
        testTransfer(sessionId, action === "test-ai-transfer").catch(function(error) { showAlert(error.message, "bad"); });
      }
      if (action === "session-transfer" || action === "session-ai-transfer") testTransfer(button.dataset.sessionId, action === "session-ai-transfer").catch(function(error) { showAlert(error.message, "bad"); });
      if (action === "open-summary") openSummary(button.dataset.sessionId).catch(function(error) { showAlert(error.message, "bad"); });
      if (action === "open-webhook-log") openLog("webhook", button.dataset.logId);
      if (action === "open-action-log") openLog("action", button.dataset.logId);
      if (action === "close-log") el.logDialog.close();
      if (action === "close-summary") el.summaryDialog.close();
      if (action === "refresh-sessions") loadClientScopedData().catch(function(error) { showAlert(error.message, "bad"); });
      if (action === "toggle-action-logs") { state.actionLogsCollapsed = !state.actionLogsCollapsed; render(); }
      if (action === "toggle-webhook-logs") { state.webhookLogsCollapsed = !state.webhookLogsCollapsed; render(); }
    });

    window.setInterval(function() {
      if (state.tab === "sessions" || state.tab === "webhook") loadClientScopedData().catch(function() {});
    }, 7000);

    loadConfig().catch(function(error) {
      showAlert(error.message, "bad");
      render();
    });
  </script>
</body>
</html>`;
