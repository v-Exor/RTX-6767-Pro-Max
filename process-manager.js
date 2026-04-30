// ============================================================
// CloudOS — Task Manager v3  (process-manager.js)
// Single unified table: Apps section on top, Background
// Processes below — exactly like Windows Task Manager.
// "End Task" closes the real desktop window live.
// ============================================================
window.ProcessManagerApp = {
  intervalId: null,

  getHTML() {
    return `
      <!-- ── Header ── -->
      <div class="app-header">
        <span class="app-title">Task Manager</span>
        <div style="display:flex;gap:8px;">
          <button class="app-btn" onclick="ProcessManagerApp.spawnProcess()">+ New Process</button>
          <button class="app-btn neutral" onclick="ProcessManagerApp.render()">↻ Refresh</button>
        </div>
      </div>

      <!-- ── Performance summary strip ── -->
      <div class="stat-cards" id="pm-stats">
        <div class="stat-card">
          <div class="stat-val" id="pm-cpu">0%</div>
          <div class="stat-label">CPU</div>
          <div class="progress-bar">
            <div class="progress-fill" id="pm-cpu-bar" style="width:0%;background:var(--blue-primary);"></div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-val" id="pm-mem">0 MB</div>
          <div class="stat-label">Memory</div>
          <div class="progress-bar">
            <div class="progress-fill" id="pm-mem-bar" style="width:0%;background:#7b1fa2;"></div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-val" id="pm-pcount">0</div>
          <div class="stat-label">Processes</div>
        </div>
        <div class="stat-card">
          <div class="stat-val" id="pm-acount" style="color:var(--c-green);">0</div>
          <div class="stat-label">Apps Running</div>
        </div>
      </div>

      <!-- ── Unified process table ── -->
      <div class="process-table-wrap" id="pm-table-wrap">
        <table class="process-table" id="pm-table">
          <thead>
            <tr>
              <th style="width:28px;"></th>
              <th>Name</th>
              <th>PID / Window</th>
              <th>Status</th>
              <th>CPU %</th>
              <th>Memory</th>
              <th style="width:160px;">Actions</th>
            </tr>
          </thead>
          <tbody id="pm-tbody"></tbody>
        </table>
      </div>
    `;
  },

  // ── App icon colours (match desktop) ──────────────────────
  appColors: {
    processManager:'#1565c0', cpuScheduler:'#4527a0',
    memoryManager:'#00695c',  fileSystem:'#bf360c',
    ioSimulator:'#1b5e20',    terminal:'#1a1a2e'
  },

  init(winId) {
    this.winId = winId;
    this.render();
    this.intervalId = setInterval(() => this.simulate(), 1800);
  },

  destroy() {
    clearInterval(this.intervalId);
    this.intervalId = null;
  },

  simulate() {
    OSState.processes.forEach(p => {
      if (p.state === 'Running') {
        p.cpu = Math.round(Math.max(0, Math.min(99, p.cpu + (Math.random() * 10 - 5))) * 10) / 10;
      } else {
        p.cpu = 0;
      }
    });
    this.render();
  },

  render() {
    this.renderStats();
    this.renderTable();
  },

  // ── Stats strip ───────────────────────────────────────────
  renderStats() {
    const active   = OSState.processes.filter(p => p.state !== 'Terminated');
    const cpu      = Math.min(99, Math.round(active.reduce((s, p) => s + p.cpu, 0)));
    const mem      = active.reduce((s, p) => s + p.memory, 0);
    const openApps = typeof windows !== 'undefined' ? Object.keys(windows).length : 0;

    const $= id => document.getElementById(id);
    const setText = (id, v) => { const e=$(id); if(e) e.textContent=v; };

    setText('pm-cpu',    cpu + '%');
    setText('pm-mem',    mem + ' MB');
    setText('pm-pcount', active.length);
    setText('pm-acount', openApps);

    const cb = $('pm-cpu-bar');
    if (cb) {
      cb.style.width      = cpu + '%';
      cb.style.background = cpu > 80 ? '#c0392b' : cpu > 50 ? '#c87900' : 'var(--blue-primary)';
    }
    const mb = $('pm-mem-bar');
    if (mb) mb.style.width = Math.min(100, mem / 512 * 100) + '%';
  },

  // ── Main unified table ────────────────────────────────────
  renderTable() {
    const tb = document.getElementById('pm-tbody');
    if (!tb) return;

    const openWins  = typeof windows !== 'undefined' ? Object.values(windows) : [];
    const prioLabel = ['Critical','High','Normal','Low','Idle'];
    let rows = '';

    // ── SECTION 1: Apps (open desktop windows) ─────────────
    if (openWins.length > 0) {
      // Group header row
      rows += `
        <tr>
          <td colspan="7" style="
            padding:6px 12px 4px;
            font-size:11px; font-weight:700; letter-spacing:.8px; text-transform:uppercase;
            color:var(--app-text3); background:var(--app-bg2);
            border-bottom:1px solid var(--app-border-lt);
            position:sticky; top:0; z-index:1;">
            Apps (${openWins.length})
          </td>
        </tr>`;

      rows += openWins.map(w => {
        const color  = this.appColors[w.appId] || '#0078d4';
        const status = w.minimized ? 'Minimized' : 'Running';
        const statusClass = w.minimized ? 'state-waiting' : 'state-running';
        const iconSVG = w.config.iconSVG
          .replace('<svg ', '<svg style="width:14px;height:14px;color:white;" ');

        return `
          <tr class="pm-app-row" style="transition:background .15s;"
            onmouseover="this.style.background='var(--app-hover)'"
            onmouseout="this.style.background=''">
            <td style="padding:8px 6px 8px 12px;">
              <div style="width:24px;height:24px;border-radius:6px;background:${color};
                display:flex;align-items:center;justify-content:center;flex-shrink:0;">
                ${iconSVG}
              </div>
            </td>
            <td style="font-weight:600;font-size:13.5px;color:var(--app-text);">${w.config.title}</td>
            <td style="font-family:monospace;font-size:12.5px;color:var(--app-text2);">
              WIN-${w.id.split('_')[1]}
            </td>
            <td><span class="state-badge ${statusClass}">${status}</span></td>
            <td style="color:var(--app-text2);">—</td>
            <td style="color:var(--app-text2);">—</td>
            <td>
              <div class="action-btns">
                <button class="mini-btn wait"
                  onclick="ProcessManagerApp.minimizeApp('${w.id}')"
                  title="Minimise window">
                  ${w.minimized ? '▲ Restore' : '⤓ Minimise'}
                </button>
                <button class="mini-btn kill"
                  onclick="ProcessManagerApp.endTask('${w.id}')"
                  title="End Task">
                  End Task
                </button>
              </div>
            </td>
          </tr>`;
      }).join('');
    }

    // ── SECTION 2: Background processes ────────────────────
    rows += `
      <tr>
        <td colspan="7" style="
          padding:6px 12px 4px;
          font-size:11px; font-weight:700; letter-spacing:.8px; text-transform:uppercase;
          color:var(--app-text3); background:var(--app-bg2);
          border-bottom:1px solid var(--app-border-lt);
          position:sticky; top:0; z-index:1;">
          Background Processes (${OSState.processes.filter(p=>p.state!=='Terminated').length})
        </td>
      </tr>`;

    rows += OSState.processes.map(p => {
      const sc   = { Running:'state-running', Ready:'state-ready', Waiting:'state-waiting', Terminated:'state-terminated' }[p.state] || 'state-ready';
      const term = p.state === 'Terminated';

      const actions = term
        ? `<button class="mini-btn ready" onclick="ProcessManagerApp.setState(${p.pid},'Ready')">Revive</button>`
        : `<div class="action-btns">
            ${p.state !== 'Running'
              ? `<button class="mini-btn run" onclick="ProcessManagerApp.setState(${p.pid},'Running')">Run</button>`
              : ''}
            ${p.state !== 'Waiting'
              ? `<button class="mini-btn wait" onclick="ProcessManagerApp.setState(${p.pid},'Waiting')">Wait</button>`
              : ''}
            <button class="mini-btn kill" onclick="ProcessManagerApp.killProcess(${p.pid})">Kill</button>
           </div>`;

      return `
        <tr class="${term ? 'terminated-row' : ''}"
          style="transition:background .15s;"
          onmouseover="this.style.background='var(--app-hover)'"
          onmouseout="this.style.background=''">
          <td style="padding:8px 6px 8px 12px;">
            <div style="width:22px;height:22px;border-radius:5px;
              background:linear-gradient(135deg,#1a3a6a,#2255a0);
              display:flex;align-items:center;justify-content:center;">
              <svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2"
                style="width:12px;height:12px;">
                <circle cx="12" cy="12" r="3"/>
                <path d="M12 2v3M12 19v3M4.22 4.22l2.12 2.12M17.66 17.66l2.12 2.12M2 12h3M19 12h3M4.22 19.78l2.12-2.12M17.66 6.34l2.12-2.12"/>
              </svg>
            </div>
          </td>
          <td style="font-weight:600;font-size:13.5px;">${p.name}</td>
          <td style="font-family:monospace;font-size:12.5px;color:var(--app-text2);">${p.pid}</td>
          <td><span class="state-badge ${sc}">${p.state}</span></td>
          <td>
            <div style="display:flex;align-items:center;gap:7px;">
              <span style="min-width:36px;font-weight:500;font-size:13px;">
                ${term ? '—' : p.cpu + '%'}
              </span>
              <div class="progress-bar" style="width:52px;margin:0;">
                <div class="progress-fill" style="width:${p.cpu}%;background:${
                  p.cpu > 70 ? '#c0392b' : p.cpu > 40 ? '#c87900' : 'var(--blue-primary)'
                };"></div>
              </div>
            </div>
          </td>
          <td style="font-size:13px;">${term ? '—' : p.memory + ' MB'}</td>
          <td>${actions}</td>
        </tr>`;
    }).join('');

    tb.innerHTML = rows;
  },

  // ── End Task: close the real desktop window ───────────────
  endTask(winId) {
    const w = typeof windows !== 'undefined' ? windows[winId] : null;
    const title = w ? w.config.title : winId;
    if (typeof closeWindow === 'function') {
      closeWindow(winId);
      window.showToast(`Ended task: ${title}`, 'warning');
    }
  },

  // ── Minimize/Restore app from Task Manager ────────────────
  minimizeApp(winId) {
    const w = typeof windows !== 'undefined' ? windows[winId] : null;
    if (!w) return;
    if (w.minimized) {
      if (typeof restoreWindow === 'function') restoreWindow(winId);
    } else {
      if (typeof minimizeWindow === 'function') minimizeWindow(winId);
    }
    // Re-render after brief delay so state is updated
    setTimeout(() => this.render(), 80);
  },

  // ── Background process helpers ────────────────────────────
  setState(pid, state) {
    const p = OSState.getProcess(pid);
    if (!p) return;
    p.state = state;
    this.render();
    window.showToast(`${p.name} → ${state}`, 'info');
  },

  killProcess(pid) {
    const p = OSState.getProcess(pid);
    if (!p) return;
    if (pid <= 1001) { window.showToast('Cannot kill system process!', 'error'); return; }
    p.state = 'Terminated';
    p.cpu   = 0;
    this.render();
    window.showToast(`Killed: ${p.name}`, 'warning');
  },

  spawnProcess() {
    const names = [
      'Worker Thread','Cache Svc','Log Writer','Sync Agent',
      'Update Svc','Backup Task','Monitor Svc','Index Builder',
      'Render Engine','GC Collector'
    ];
    const n = names[Math.floor(Math.random() * names.length)];
    const p = OSState.addProcess(n);
    this.render();
    window.showToast(`Spawned: ${n} (PID ${p.pid})`, 'success');
  }
};
