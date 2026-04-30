// ============================================================
// CloudOS — Memory Manager v3  (memory-manager.js)
// Clean, organised, smooth-animated UI
// ============================================================
window.MemoryManagerApp = {
  log: [],

  getHTML() {
    return `
      <!-- Header -->
      <div class="app-header">
        <span class="app-title">Memory Manager</span>
        <div style="display:flex;gap:8px;">
          <button class="app-btn success" onclick="MemoryManagerApp.autoAllocate()">
            <span style="font-size:15px;margin-right:4px;">+</span> Auto Allocate
          </button>
          <button class="app-btn danger" onclick="MemoryManagerApp.autoFree()">
            <span style="font-size:15px;margin-right:4px;">−</span> Free Last
          </button>
        </div>
      </div>

      <!-- ── Row 1: four stat cards ── -->
      <div class="mm-stat-row" id="mm-stats"></div>

      <!-- ── Row 2: visual memory map bar ── -->
      <div class="mm-section-head">
        <span class="section-label" style="margin:0;">Memory Map</span>
        <span id="mm-usage-text" style="font-size:12px;color:var(--app-text3);"></span>
      </div>
      <div class="mm-map-bar" id="mm-bar"></div>
      <div class="mm-map-legend" id="mm-legend"></div>

      <!-- ── Row 3: partition list ── -->
      <div class="mm-section-head" style="margin-top:4px;">
        <span class="section-label" style="margin:0;">Partitions</span>
        <span style="font-size:12px;color:var(--app-text3);">Fixed allocation — 6 slots</span>
      </div>
      <div class="mm-partition-list" id="mm-partitions"></div>

      <!-- ── Row 4: allocation log ── -->
      <div class="mm-section-head" style="margin-top:4px;">
        <span class="section-label" style="margin:0;">Allocation Log</span>
        <button onclick="MemoryManagerApp.clearLog()"
          style="font-size:11.5px;background:none;border:none;color:var(--app-text3);cursor:pointer;
                 padding:2px 6px;border-radius:4px;transition:background .15s;"
          onmouseover="this.style.background='var(--app-hover)'"
          onmouseout="this.style.background='none'">Clear</button>
      </div>
      <div class="mm-log-box" id="mm-log"></div>
    `;
  },

  init() {
    this.log = [];
    this.render();
  },

  // ── Master render ────────────────────────────────────────
  render() {
    this.renderStats();
    this.renderBar();
    this.renderPartitions();
    this.renderLog();
  },

  // ── Stat cards ───────────────────────────────────────────
  renderStats() {
    const el = document.getElementById('mm-stats');
    if (!el) return;
    const total    = OSState.totalMemory;
    const used     = OSState.usedMemory;
    const free     = OSState.freeMemory;
    const pct      = Math.round(used / total * 100);
    const occupied = OSState.memoryPartitions.filter(p => p.process).length;
    const freeSlots= OSState.memoryPartitions.length - occupied;

    const usedColor = pct > 80 ? '#c0392b' : pct > 60 ? '#c87900' : 'var(--app-accent)';

    el.innerHTML = `
      <div class="mm-stat-card">
        <div class="mm-stat-val">${total} <span class="mm-stat-unit">MB</span></div>
        <div class="mm-stat-label">Total RAM</div>
        <div class="mm-stat-sub">Physical memory</div>
      </div>
      <div class="mm-stat-card">
        <div class="mm-stat-val" style="color:${usedColor};">${used} <span class="mm-stat-unit">MB</span></div>
        <div class="mm-stat-label">In Use</div>
        <div class="mm-stat-sub">${pct}% utilised</div>
        <div class="mm-mini-bar">
          <div class="mm-mini-fill" style="width:${pct}%;background:${usedColor};"></div>
        </div>
      </div>
      <div class="mm-stat-card">
        <div class="mm-stat-val" style="color:#00966d;">${free} <span class="mm-stat-unit">MB</span></div>
        <div class="mm-stat-label">Available</div>
        <div class="mm-stat-sub">${100 - pct}% free</div>
      </div>
      <div class="mm-stat-card">
        <div class="mm-stat-val">${occupied}<span class="mm-stat-unit" style="font-size:14px;">/${OSState.memoryPartitions.length}</span></div>
        <div class="mm-stat-label">Slots Used</div>
        <div class="mm-stat-sub">${freeSlots} slot${freeSlots !== 1 ? 's' : ''} free</div>
      </div>
    `;
  },

  // ── Visual map bar ───────────────────────────────────────
  renderBar() {
    const bar    = document.getElementById('mm-bar');
    const legend = document.getElementById('mm-legend');
    const usageText = document.getElementById('mm-usage-text');
    if (!bar) return;

    const total = OSState.totalMemory;
    const used  = OSState.usedMemory;
    if (usageText) usageText.textContent = `${used} MB used of ${total} MB`;

    bar.innerHTML = OSState.memoryPartitions.map(p => {
      const w   = (p.size / total * 100).toFixed(2);
      const bg  = p.process ? p.color : null;
      const cls = p.process ? '' : ' mm-seg-free';
      return `
        <div class="mm-seg${cls}" style="width:${w}%;${bg ? `background:${bg};` : ''}"
          title="${p.id} — ${p.process || 'Free'}: ${p.used || 0}/${p.size} MB">
          ${parseFloat(w) > 7 ? `<span>${p.id}</span>` : ''}
        </div>`;
    }).join('');

    if (legend) {
      legend.innerHTML = OSState.memoryPartitions.map(p => `
        <div class="mm-legend-item">
          <span class="mm-legend-dot" style="background:${p.process ? p.color : '#c8d8ee'};"></span>
          <span>${p.id}: ${p.process ? `<strong>${p.process}</strong>` : 'Free'} (${p.size} MB)</span>
        </div>`).join('');
    }
  },

  // ── Partition rows ───────────────────────────────────────
  renderPartitions() {
    const el = document.getElementById('mm-partitions');
    if (!el) return;

    el.innerHTML = OSState.memoryPartitions.map((p, i) => {
      const pct    = p.process ? Math.round(p.used / p.size * 100) : 0;
      const isFree = !p.process;

      return `
        <div class="mm-partition-row ${isFree ? 'mm-row-free' : 'mm-row-used'}" id="mpart-${i}">

          <!-- Slot badge -->
          <div class="mm-slot-badge" style="${isFree ? '' : `background:${p.color};`}">
            ${p.id}
          </div>

          <!-- Size chip -->
          <div class="mm-size-chip">${p.size} MB</div>

          <!-- Process name / status -->
          <div class="mm-proc-name">
            ${isFree
              ? `<span style="color:var(--app-text3);font-style:italic;">Free slot</span>`
              : `<span style="color:var(--app-text);font-weight:600;">${p.process}</span>`}
          </div>

          <!-- Usage bar + percentage -->
          <div class="mm-usage-col">
            ${isFree
              ? `<span style="font-size:12px;color:var(--app-text3);">—</span>`
              : `<div class="mm-row-bar">
                   <div class="mm-row-fill" style="width:${pct}%;background:${p.color};"></div>
                 </div>
                 <span class="mm-row-pct" style="color:${pct>80?'#c0392b':pct>60?'#c87900':'var(--app-text2)'};">${pct}%</span>`}
          </div>

          <!-- Used/Size text -->
          <div class="mm-used-text">
            ${isFree ? `<span style="color:var(--app-text3);">0 / ${p.size} MB</span>` : `${p.used} / ${p.size} MB`}
          </div>

          <!-- Action button -->
          <div class="mm-action-col">
            ${isFree
              ? `<button class="mm-action-btn mm-btn-alloc" onclick="MemoryManagerApp.allocateToPartition(${i})">Allocate</button>`
              : `<button class="mm-action-btn mm-btn-free" onclick="MemoryManagerApp.deallocatePartition(${i})">Free</button>`}
          </div>
        </div>`;
    }).join('');
  },

  // ── Log box ──────────────────────────────────────────────
  renderLog() {
    const el = document.getElementById('mm-log');
    if (!el) return;
    if (!this.log || this.log.length === 0) {
      el.innerHTML = `<div class="mm-log-empty">No allocation events yet.</div>`;
      return;
    }
    el.innerHTML = this.log.slice(-14).reverse().map((l, i) => `
      <div class="mm-log-row" style="animation-delay:${i * 0.03}s;">
        <span class="mm-log-time">${l.time}</span>
        <span class="mm-log-msg">${l.msg}</span>
      </div>`).join('');
  },

  // ── Auto allocate ─────────────────────────────────────────
  autoAllocate() {
    const freeSlot = OSState.memoryPartitions.find(p => !p.process);
    const readyProc = OSState.processes.find(p => p.state === 'Ready' || p.state === 'Waiting');

    if (!freeSlot) { window.showToast('No free partitions available!', 'error'); return; }
    if (!readyProc){ window.showToast('No ready/waiting processes to allocate!', 'warning'); return; }

    freeSlot.process = readyProc.name;
    freeSlot.used    = Math.min(freeSlot.size, readyProc.memory);
    freeSlot.color   = this.procColor(readyProc.pid);

    this.addLog(`[ALLOC] ${freeSlot.id} → ${readyProc.name} (${freeSlot.used} MB used of ${freeSlot.size} MB)`);
    this.render();
    window.showToast(`Allocated ${freeSlot.id} → ${readyProc.name}`, 'success');
  },

  // ── Allocate specific partition ───────────────────────────
  allocateToPartition(index) {
    const part = OSState.memoryPartitions[index];
    if (part.process) return;

    const available = OSState.processes.filter(p => p.state !== 'Terminated');
    if (!available.length) { window.showToast('No active processes available!', 'warning'); return; }

    const list   = available.map((p, i) => `${i + 1}. ${p.name} (${p.memory} MB)`).join('\n');
    const choice = prompt(`Allocate ${part.id} (${part.size} MB) to:\n\n${list}\n\nEnter number:`);
    const idx    = parseInt(choice) - 1;
    if (isNaN(idx) || idx < 0 || idx >= available.length) return;

    const proc        = available[idx];
    part.process      = proc.name;
    part.used         = Math.min(part.size, proc.memory);
    part.color        = this.procColor(proc.pid);

    this.addLog(`[ALLOC] ${part.id} → ${proc.name} (${part.used} MB used of ${part.size} MB)`);
    this.render();
    window.showToast(`${part.id} allocated to ${proc.name}`, 'success');
  },

  // ── Free last occupied partition ──────────────────────────
  autoFree() {
    const occupied = OSState.memoryPartitions.filter(p => p.process);
    if (!occupied.length) { window.showToast('No occupied partitions to free!', 'warning'); return; }
    const part = occupied[occupied.length - 1];
    const name = part.process;
    this.addLog(`[FREE]  ${part.id} released (was: ${name})`);
    part.process = null;
    part.used    = 0;
    this.render();
    window.showToast(`Freed ${part.id} (was: ${name})`, 'info');
  },

  // ── Free specific partition ───────────────────────────────
  deallocatePartition(index) {
    const part = OSState.memoryPartitions[index];
    if (!part.process) return;
    const name = part.process;
    this.addLog(`[FREE]  ${part.id} released (was: ${name})`);
    part.process = null;
    part.used    = 0;
    this.render();
    window.showToast(`Freed ${part.id} (was: ${name})`, 'info');
  },

  // ── Log helpers ───────────────────────────────────────────
  addLog(msg) {
    if (!this.log) this.log = [];
    const now = new Date();
    const t   = `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}:${String(now.getSeconds()).padStart(2,'0')}`;
    this.log.push({ time: t, msg });
  },

  clearLog() {
    this.log = [];
    this.renderLog();
  },

  procColor(pid) {
    const palette = ['#1565c0','#7b1fa2','#00897b','#e64a19','#c62828','#0277bd','#558b2f','#6d4c41'];
    return palette[pid % palette.length];
  }
};
