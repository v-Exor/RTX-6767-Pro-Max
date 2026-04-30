// ============================================================
// CloudOS — CPU Scheduler v2  (cpu-scheduler.js)
// Staggered Gantt animation, clean light-theme UI
// ============================================================
window.CPUSchedulerApp = {
  algorithm: 'FCFS', quantum: 3, jobs: [], results: [], ganttData: [],

  getHTML() {
    return `
      <div class="app-header"><span class="app-title">CPU Scheduler</span></div>
      <div class="scheduler-controls">
        <label>Algorithm:</label>
        <select id="sched-algo" onchange="CPUSchedulerApp.setAlgo(this.value)">
          <option value="FCFS">First-Come, First-Served (FCFS)</option>
          <option value="RR">Round Robin (RR)</option>
          <option value="SJF">Shortest Job First (SJF)</option>
        </select>
        <span id="q-wrap" style="display:none;gap:6px;align-items:center;">
          <label>Quantum:</label>
          <input type="number" id="sched-q" value="3" min="1" max="10" style="width:64px;" oninput="CPUSchedulerApp.setQuantum(this.value)"/>
        </span>
        <button class="app-btn neutral" onclick="CPUSchedulerApp.loadProcs()">↺ Load</button>
        <button class="app-btn success" onclick="CPUSchedulerApp.run()">▶ Run</button>
        <button class="app-btn neutral" onclick="CPUSchedulerApp.clearAll()">✕ Clear</button>
      </div>

      <div style="margin-bottom:14px;">
        <div class="section-label">Job Queue</div>
        <div style="border-radius:9px;border:1px solid var(--app-border);overflow:hidden;">
          <table class="wait-table"><thead><tr><th>PID</th><th>Name</th><th>Burst</th><th>Arrival</th><th>Priority</th></tr></thead>
          <tbody id="sched-jobs"></tbody></table>
        </div>
        <button class="app-btn" style="margin-top:9px;font-size:13px;padding:6px 13px;" onclick="CPUSchedulerApp.addCustom()">+ Custom Job</button>
      </div>

      <div class="divider"></div>

      <div id="gantt-sec">
        <div class="section-label">Gantt Chart</div>
        <div class="gantt-chart" id="gantt-chart"><div class="empty-state" style="padding:16px;">Click ▶ Run to generate Gantt chart.</div></div>
      </div>

      <div id="results-sec" style="display:none;margin-top:14px;">
        <div class="section-label">Scheduling Results</div>
        <div style="border-radius:9px;border:1px solid var(--app-border);overflow:hidden;">
          <table class="wait-table"><thead><tr><th>PID</th><th>Name</th><th>Burst</th><th>Arrival</th><th>Start</th><th>Finish</th><th>Wait</th><th>Turnaround</th></tr></thead>
          <tbody id="sched-results"></tbody></table>
        </div>
        <div id="sched-avg" style="padding:10px 4px;font-size:13.5px;color:var(--app-text2);"></div>
      </div>`;
  },

  init() { this.loadProcs(); },

  setAlgo(v) {
    this.algorithm = v;
    const w = document.getElementById('q-wrap');
    if (w) w.style.display = v === 'RR' ? 'flex' : 'none';
  },

  setQuantum(v) { this.quantum = Math.max(1, parseInt(v) || 2); },

  loadProcs() {
    this.jobs = OSState.processes.filter(p => p.state !== 'Terminated').map((p,i) => ({
      pid: p.pid, name: p.name, burst: Math.max(1, Math.round(p.memory/10)), arrival: i, priority: p.priority
    }));
    this.renderJobs();
    window.showToast(`Loaded ${this.jobs.length} processes`, 'info');
  },

  addCustom() {
    const name  = prompt('Process name:') || 'Custom';
    const burst = Math.max(1, Math.min(20, parseInt(prompt('Burst time (1-20):')) || 5));
    const arr   = Math.max(0, parseInt(prompt('Arrival time:')) || 0);
    this.jobs.push({ pid: Math.floor(Math.random()*9000+1000), name, burst, arrival: arr, priority: 2 });
    this.renderJobs();
  },

  clearAll() {
    this.jobs = []; this.results = []; this.ganttData = [];
    this.renderJobs();
    const gc = document.getElementById('gantt-chart');
    if (gc) gc.innerHTML = '<div class="empty-state" style="padding:16px;">Click ▶ Run to generate Gantt chart.</div>';
    const rs = document.getElementById('results-sec');
    if (rs) rs.style.display = 'none';
  },

  renderJobs() {
    const tb = document.getElementById('sched-jobs');
    if (!tb) return;
    if (!this.jobs.length) { tb.innerHTML='<tr><td colspan="5" class="empty-state">No jobs. Click "↺ Load" or "+ Custom Job".</td></tr>'; return; }
    tb.innerHTML = this.jobs.map(j=>`<tr>
      <td style="font-family:monospace;color:var(--app-text2);">${j.pid}</td>
      <td style="font-weight:500;">${j.name}</td>
      <td><span style="color:var(--app-accent);font-weight:700;">${j.burst}</span></td>
      <td>${j.arrival}</td>
      <td>${['Critical','High','Normal','Low','Idle'][j.priority]||'Normal'}</td>
    </tr>`).join('');
  },

  run() {
    if (!this.jobs.length) { window.showToast('No jobs!','warning'); return; }
    ({FCFS:this.runFCFS,RR:this.runRR,SJF:this.runSJF}[this.algorithm]||this.runFCFS).call(this);
    this.renderGantt(); this.renderResults();
    window.showToast(`${this.algorithm} complete!`, 'success');
  },

  runFCFS() {
    const jobs = [...this.jobs].sort((a,b)=>a.arrival-b.arrival);
    let t=0; this.ganttData=[]; this.results=[];
    jobs.forEach(j=>{
      const s=Math.max(t,j.arrival);
      if(s>t) this.ganttData.push({label:'IDLE',duration:s-t,color:null,pid:null});
      this.ganttData.push({label:`P${j.pid}`,name:j.name,duration:j.burst,color:this.pColor(j.pid),pid:j.pid});
      this.results.push({...j,start:s,finish:s+j.burst,waiting:s-j.arrival,turnaround:s+j.burst-j.arrival});
      t=s+j.burst;
    });
  },

  runRR() {
    const jobs=[...this.jobs].map(j=>({...j,remaining:j.burst})).sort((a,b)=>a.arrival-b.arrival);
    let t=0; this.ganttData=[]; const st={}; const q=[]; let i=0;
    while(q.length>0||i<jobs.length){
      while(i<jobs.length&&jobs[i].arrival<=t) q.push(jobs[i++]);
      if(!q.length){const n=jobs[i];this.ganttData.push({label:'IDLE',duration:n.arrival-t,color:null});t=n.arrival;continue;}
      const j=q.shift();
      if(st[j.pid]===undefined) st[j.pid]=t;
      const ex=Math.min(this.quantum,j.remaining);
      this.ganttData.push({label:`P${j.pid}`,name:j.name,duration:ex,color:this.pColor(j.pid),pid:j.pid});
      t+=ex; j.remaining-=ex;
      while(i<jobs.length&&jobs[i].arrival<=t) q.push(jobs[i++]);
      if(j.remaining>0) q.push(j);
    }
    this.results=this.jobs.map(j=>{
      let fin=0,tt=0;
      this.ganttData.forEach(g=>{tt+=g.duration;if(g.pid===j.pid)fin=tt;});
      return{...j,start:st[j.pid]||0,finish:fin,waiting:Math.max(0,fin-j.arrival-j.burst),turnaround:fin-j.arrival};
    });
  },

  runSJF() {
    const jobs=[...this.jobs].sort((a,b)=>a.arrival-b.arrival);
    let t=0; this.ganttData=[]; this.results=[]; const done=new Set();
    while(done.size<jobs.length){
      const av=jobs.filter(j=>j.arrival<=t&&!done.has(j.pid));
      if(!av.length){const n=jobs.find(j=>!done.has(j.pid));this.ganttData.push({label:'IDLE',duration:n.arrival-t,color:null});t=n.arrival;continue;}
      av.sort((a,b)=>a.burst-b.burst);
      const j=av[0];
      this.ganttData.push({label:`P${j.pid}`,name:j.name,duration:j.burst,color:this.pColor(j.pid),pid:j.pid});
      const s=t; t+=j.burst; done.add(j.pid);
      this.results.push({...j,start:s,finish:t,waiting:s-j.arrival,turnaround:t-j.arrival});
    }
  },

  renderGantt() {
    const el=document.getElementById('gantt-chart');
    if(!el) return;
    const total=this.ganttData.reduce((s,g)=>s+g.duration,0);
    if(!total) return;
    const blocks=this.ganttData.map((g,i)=>{
      const w=(g.duration/total*100).toFixed(2);
      return `<div class="gantt-block${g.color?'':' idle'}" style="width:${w}%;min-width:${g.duration>0?'20px':'0'};
        background:${g.color||'#ddeefa'};animation-delay:${(i*.06).toFixed(2)}s;"
        title="${g.name||'IDLE'}: ${g.duration} units">${parseFloat(w)>5?g.label:''}</div>`;
    }).join('');
    let t=0;
    const ticks=this.ganttData.map(g=>{
      const w=(g.duration/total*100).toFixed(2);
      const tick=`<div class="gantt-tick" style="width:${w}%;">${t}</div>`;
      t+=g.duration; return tick;
    }).join('')+`<div class="gantt-tick">${t}</div>`;
    el.innerHTML=`
      <div class="gantt-label">${this.algorithm} · ${total} time units${this.algorithm==='RR'?` · Quantum=${this.quantum}`:''}</div>
      <div class="gantt-row">${blocks}</div>
      <div class="gantt-timeline" style="margin-bottom:8px;">${ticks}</div>`;
  },

  renderResults() {
    const sec=document.getElementById('results-sec');
    const tb=document.getElementById('sched-results');
    const avg=document.getElementById('sched-avg');
    if(!sec||!tb) return;
    sec.style.display='';
    tb.innerHTML=this.results.map((r,i)=>`<tr style="animation:ganttIn .3s ${(i*.04).toFixed(2)}s both;">
      <td style="font-family:monospace;">${r.pid}</td><td style="font-weight:500;">${r.name}</td>
      <td>${r.burst}</td><td>${r.arrival}</td>
      <td style="color:var(--app-accent);font-weight:600;">${r.start}</td>
      <td style="color:var(--c-green);font-weight:600;">${r.finish}</td>
      <td style="color:${r.waiting>6?'#c0392b':r.waiting>3?'#c87900':'var(--app-text)'};font-weight:600;">${Math.max(0,r.waiting)}</td>
      <td style="color:var(--app-accent);font-weight:600;">${r.turnaround}</td>
    </tr>`).join('');
    if(avg){
      const aw=(this.results.reduce((s,r)=>s+Math.max(0,r.waiting),0)/this.results.length).toFixed(2);
      const at=(this.results.reduce((s,r)=>s+r.turnaround,0)/this.results.length).toFixed(2);
      avg.innerHTML=`<strong style="color:var(--c-yellow);">Avg Wait:</strong> ${aw} &nbsp;|&nbsp; <strong style="color:var(--app-accent);">Avg Turnaround:</strong> ${at}`;
    }
  },

  pColor(pid){
    return ['#1565c0','#4527a0','#00695c','#bf360c','#00838f','#1b5e20','#880e4f','#4e342e'][pid%8];
  }
};
