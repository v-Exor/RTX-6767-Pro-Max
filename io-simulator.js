// ============================================================
// CloudOS — Printer Spooler v2  (io-simulator.js)
// Fixed: interval only runs when app is open; proper job lifecycle
// ============================================================
window.IOSimulatorApp = {
  printInterval: null,
  currentJob: null,
  progress: 0,
  doneJobs: [],
  isOpen: false,

  getHTML() {
    return `
      <div class="app-header">
        <span class="app-title">Printer Spooler</span>
        <div style="display:flex;gap:8px;align-items:center;">
          <span id="io-badge" class="state-badge state-ready">IDLE</span>
          <button class="app-btn success" onclick="IOSimulatorApp.addJob()">+ Send to Printer</button>
          <button class="app-btn neutral" onclick="IOSimulatorApp.clearDone()">Clear Done</button>
        </div>
      </div>

      <div class="printer-visual">
        <div class="printer-body">
          <div class="printer-light idle-light" id="plight"></div>
          <svg class="printer-svg" viewBox="0 0 130 90" fill="none">
            <rect x="15" y="58" width="100" height="8" rx="2" fill="#e0ecfa" stroke="#b8d4ee" stroke-width="1.5"/>
            <rect x="8" y="30" width="114" height="34" rx="8" fill="#f0f6ff" stroke="#b8d4ee" stroke-width="1.5"/>
            <rect x="22" y="40" width="86" height="5" rx="2.5" fill="#c8d8ee"/>
            <rect x="22" y="30" width="86" height="6" rx="2" fill="#dde8f5"/>
            <circle cx="104" cy="47" r="5" fill="#0078d4" opacity=".6" stroke="#0057a8" stroke-width="1"/>
            <circle cx="90" cy="47" r="3" fill="#dde8f5"/>
            <text x="30" y="51" font-size="9" fill="#7a9ab8" font-family="Inter,sans-serif" font-weight="500">CloudPrint</text>
          </svg>
        </div>
        <div style="margin-top:8px;font-size:13px;color:var(--app-text2);font-weight:500;" id="plabel">Ready</div>
      </div>

      <div id="io-current" style="display:none;margin-bottom:13px;">
        <div class="section-label">Currently Printing</div>
        <div style="background:var(--app-surface);border:1px solid #a8d8c0;border-radius:9px;padding:13px;box-shadow:var(--shadow-card);">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:9px;">
            <span id="io-cname" style="font-weight:600;font-size:14px;color:var(--app-text);"></span>
            <span id="io-cpct" style="color:var(--c-green);font-size:13.5px;font-weight:700;"></span>
          </div>
          <div class="progress-bar" style="height:9px;"><div class="progress-fill" id="io-cbar" style="width:0%;background:var(--c-green);"></div></div>
          <div style="font-size:12px;color:var(--app-text3);margin-top:6px;" id="io-cpages"></div>
        </div>
      </div>

      <div class="section-label">Print Queue <span id="io-qcount">(0 pending)</span></div>
      <div class="print-queue" id="io-queue"><div class="empty-state">No jobs in queue.</div></div>

      <div class="section-label" style="margin-top:12px;">Completed Jobs</div>
      <div id="io-done"><div class="empty-state">No completed jobs yet.</div></div>
    `;
  },

  init() {
    this.isOpen = true;
    this.renderAll();
    if (!this.printInterval) {
      this.printInterval = setInterval(() => this.tick(), 600);
    }
  },

  destroy() {
    this.isOpen = false;
    clearInterval(this.printInterval);
    this.printInterval = null;
  },

  addJob(name) {
    const docs = ['Report_Q4.pdf','Budget.xlsx','Meeting_Notes.docx','Project_Plan.pdf',
      'Invoice.pdf','Employee_List.csv','System_Logs.txt','Manual_v2.pdf','Memo_HR.docx'];
    const doc = name || docs[Math.floor(Math.random() * docs.length)];
    const pages = Math.floor(Math.random() * 14) + 1;
    OSState.printerQueue.push({
      id: OSState.printerJobId++, name: doc, pages,
      size: (pages * 28) + ' KB', status: 'Queued', progress: 0,
      addedAt: new Date().toLocaleTimeString()
    });
    this.renderAll();
    window.showToast(`Queued: ${doc}`, 'info');
  },

  addCustomJob(name) { this.addJob(name || 'Terminal_Document.txt'); },

  tick() {
    // Start next job if idle and queue has something
    if (!OSState.printerBusy && OSState.printerQueue.length > 0) {
      const job = OSState.printerQueue[0];
      if (job.status === 'Queued') {
        this.currentJob = job;
        this.currentJob.status = 'Printing';
        this.progress = 0;
        OSState.printerBusy = true;
        if (this.isOpen) this.setUI('busy');
      }
    }

    // Advance current job
    if (OSState.printerBusy && this.currentJob) {
      this.progress += Math.random() * 7 + 4;
      if (this.progress >= 100) {
        this.progress = 100;
        const done = { ...this.currentJob, completedAt: new Date().toLocaleTimeString() };
        this.doneJobs.unshift(done);
        const idx = OSState.printerQueue.findIndex(j => j.id === this.currentJob.id);
        if (idx !== -1) OSState.printerQueue.splice(idx, 1);
        this.currentJob = null;
        OSState.printerBusy = false;
        this.progress = 0;
        if (this.isOpen) this.setUI('idle');
        window.showToast(`✓ Printed: ${done.name}`, 'success');
      } else {
        this.currentJob.progress = Math.round(this.progress);
      }
    }

    if (this.isOpen) this.renderAll();
  },

  setUI(state) {
    const light = document.getElementById('plight');
    const label = document.getElementById('plabel');
    const badge = document.getElementById('io-badge');
    const cur   = document.getElementById('io-current');
    if (state === 'busy') {
      if (light) light.className = 'printer-light busy-light';
      if (label) label.textContent = 'Printing...';
      if (badge) { badge.className = 'state-badge state-running'; badge.textContent = 'PRINTING'; }
      if (cur)   cur.style.display = '';
    } else {
      if (light) light.className = 'printer-light idle-light';
      if (label) label.textContent = OSState.printerQueue.length > 0 ? 'Queue pending...' : 'Ready';
      if (badge) { badge.className = 'state-badge state-ready'; badge.textContent = 'IDLE'; }
      if (cur)   cur.style.display = 'none';
    }
  },

  renderAll() {
    this.setUI(OSState.printerBusy ? 'busy' : 'idle');
    // Progress bar
    const cn = document.getElementById('io-cname');
    const cp = document.getElementById('io-cpct');
    const cb = document.getElementById('io-cbar');
    const cpg= document.getElementById('io-cpages');
    if (cn && this.currentJob) {
      cn.textContent  = this.currentJob.name;
      cp.textContent  = Math.round(this.progress) + '%';
      cb.style.width  = Math.round(this.progress) + '%';
      cpg.textContent = `${this.currentJob.pages} page(s) · ${this.currentJob.size}`;
    }
    // Queue
    const qel = document.getElementById('io-queue');
    const qct = document.getElementById('io-qcount');
    if (!qel) return;
    const pending = OSState.printerQueue.filter(j => j.status === 'Queued').length;
    if (qct) qct.textContent = `(${pending} pending)`;
    if (OSState.printerQueue.length === 0) {
      qel.innerHTML = '<div class="empty-state">No jobs in queue.</div>';
    } else {
      qel.innerHTML = OSState.printerQueue.map((j, i) => {
        const ip = j.status === 'Printing';
        return `<div class="queue-item ${ip?'printing-job':''}">
          <div class="queue-num">${i+1}</div>
          <div style="flex:1;"><div class="queue-name">${j.name}</div>
            <div style="font-size:12px;color:var(--app-text3);margin-top:2px;">${j.pages} pg · ${j.size} · ${j.addedAt}</div></div>
          ${ip?`<div style="width:100px;text-align:right;">
            <div style="font-size:12.5px;font-weight:700;color:var(--c-green);margin-bottom:4px;">${j.progress}%</div>
            <div class="queue-bar-wrap"><div class="queue-bar-fill" style="width:${j.progress}%;"></div></div></div>`
            :`<span class="state-badge state-ready" style="margin-right:4px;">Queued</span>
              <button class="mini-btn kill" onclick="IOSimulatorApp.cancelJob(${j.id})">Cancel</button>`}
        </div>`;
      }).join('');
    }
    // Done
    const del = document.getElementById('io-done');
    if (!del) return;
    del.innerHTML = this.doneJobs.length === 0
      ? '<div class="empty-state">No completed jobs yet.</div>'
      : this.doneJobs.slice(0,6).map(j=>`
        <div class="queue-item done-job" style="padding:9px 14px;">
          <div style="width:22px;height:22px;border-radius:50%;background:var(--c-grn-bg);color:var(--c-grn-text);
            display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;flex-shrink:0;">✓</div>
          <div style="flex:1;"><div style="font-size:13px;font-weight:500;color:var(--app-text);">${j.name}</div>
            <div style="font-size:11.5px;color:var(--app-text3);">${j.pages} pages · ${j.completedAt}</div></div>
          <span class="state-badge state-running">Done</span>
        </div>`).join('');
  },

  cancelJob(id) {
    const idx = OSState.printerQueue.findIndex(j => j.id === id);
    if (idx !== -1) {
      if (OSState.printerQueue[idx].status === 'Printing') { window.showToast('Cannot cancel active print job!','warning'); return; }
      const n = OSState.printerQueue[idx].name;
      OSState.printerQueue.splice(idx, 1);
      this.renderAll();
      window.showToast(`Cancelled: ${n}`, 'warning');
    }
  },

  clearDone() { this.doneJobs = []; this.renderAll(); }
};
