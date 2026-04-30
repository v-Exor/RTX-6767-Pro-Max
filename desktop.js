// ============================================================
// CloudOS — Desktop & Window Manager v2  (desktop.js)
// Notifies Task Manager on every open/close event
// ============================================================
window._bootTime = Date.now();
const windows = {};
let windowZIndex = 10;
let focusedWindowId = null;

const APP_REGISTRY = {
  processManager:{title:'Task Manager',icon:'process-icon',
    iconSVG:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M7 8h2M7 12h2M11 8h6M11 12h4"/></svg>`,
    width:740,height:480,app:()=>window.ProcessManagerApp},
  cpuScheduler:{title:'CPU Scheduler',icon:'cpu-icon',
    iconSVG:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="4" y="4" width="16" height="16" rx="2"/><rect x="8" y="8" width="8" height="8" rx="1"/></svg>`,
    width:740,height:540,app:()=>window.CPUSchedulerApp},
  memoryManager:{title:'Memory Manager',icon:'memory-icon',
    iconSVG:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="2" y="6" width="20" height="12" rx="2"/><rect x="5" y="9" width="3" height="6" rx="0.5"/><rect x="10" y="9" width="3" height="6" rx="0.5"/><rect x="15" y="9" width="3" height="6" rx="0.5"/></svg>`,
    width:660,height:520,app:()=>window.MemoryManagerApp},
  fileSystem:{title:'File Explorer',icon:'file-icon',
    iconSVG:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>`,
    width:640,height:500,app:()=>window.FileSystemApp},
  ioSimulator:{title:'Printer Spooler',icon:'io-icon',
    iconSVG:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>`,
    width:600,height:560,app:()=>window.IOSimulatorApp},
  terminal:{title:'Terminal',icon:'terminal-icon',
    iconSVG:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><polyline points="4 17 10 11 4 5"/><line x1="12" y1="19" x2="20" y2="19"/></svg>`,
    width:660,height:460,app:()=>window.TerminalApp},
  paint:{title:'Paint',icon:'paint-icon',
    iconSVG:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10c1.1 0 2-.9 2-2v-.5c0-.55.45-1 1-1h1c3.31 0 6-2.69 6-6 0-4.97-4.03-9-9-9z"/></svg>`,
    width:900,height:600,app:()=>window.PaintApp},
  calculator:{title:'Calculator',icon:'calc-icon',
    iconSVG:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="4" y="2" width="16" height="20" rx="2"/><rect x="7" y="5" width="10" height="4" rx="1"/></svg>`,
    width:320,height:560,app:()=>window.CalculatorApp},
  settings:{title:'Settings',icon:'settings-icon',
    iconSVG:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3"/></svg>`,
    width:700,height:520,app:()=>window.SettingsApp},
};

function notifyTaskManager() {
  const tm = Object.values(windows).find(w => w.appId === 'processManager');
  if (tm && window.ProcessManagerApp) {
    window.ProcessManagerApp.renderStats();
    if (window.ProcessManagerApp.currentTab === 'apps') window.ProcessManagerApp.renderApps();
  }
}

function openApp(appId) {
  const ex = Object.values(windows).find(w => w.appId === appId);
  if (ex) { focusWindow(ex.id); if (ex.minimized) restoreWindow(ex.id); return; }
  const cfg = APP_REGISTRY[appId];
  if (!cfg) return;
  const id  = 'win_' + Date.now();
  const cnt = Object.keys(windows).length;
  const left = Math.max(0, Math.min(100 + cnt*26, window.innerWidth - cfg.width - 30));
  const top  = Math.max(0, Math.min(36 + cnt*26, window.innerHeight - 50 - cfg.height - 30));
  const el = document.createElement('div');
  el.className = 'os-window'; el.id = id;
  el.style.cssText = `width:${cfg.width}px;height:${cfg.height}px;left:${left}px;top:${top}px;z-index:${++windowZIndex};`;
  const app = cfg.app();
  el.innerHTML = `
    <div class="window-titlebar" id="${id}-tb">
      <div class="window-icon ${cfg.icon}">${cfg.iconSVG}</div>
      <div class="window-title">${cfg.title}</div>
      <div class="window-controls">
        <button class="wc-btn" onclick="minimizeWindow('${id}')"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="5" y1="12" x2="19" y2="12"/></svg></button>
        <button class="wc-btn" onclick="toggleMaximize('${id}')"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/></svg></button>
        <button class="wc-btn close" onclick="closeWindow('${id}')"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>
      </div>
    </div>
    <div class="window-body" id="${id}-body">${app.getHTML?app.getHTML():'<div class="empty-state">App unavailable.</div>'}</div>
    <div class="resize-handle" id="${id}-rh"></div>`;
  document.getElementById('windowsContainer').appendChild(el);
  windows[id] = {id,appId,config:cfg,minimized:false,maximized:false,prevRect:null,appModule:app};
  if (app.init) app.init(id);
  addTbBtn(id,cfg); setupDrag(id); setupResize(id); focusWindow(id);
  notifyTaskManager();
}

function closeWindow(id) {
  const w = windows[id]; if (!w) return;
  const el = document.getElementById(id);
  if (el) {
    el.style.transition = 'all .18s cubic-bezier(.22,1,.36,1)';
    el.style.opacity='0'; el.style.transform='scale(.93)translateY(8px)';
    setTimeout(()=>el.remove(),190);
  }
  if (w.appModule?.destroy) w.appModule.destroy();
  removeTbBtn(id); delete windows[id]; focusedWindowId = null;
  notifyTaskManager();
}

function minimizeWindow(id) {
  const w=windows[id]; const el=document.getElementById(id); if(!w||!el) return;
  w.minimized=true;
  el.style.transition='all .22s cubic-bezier(.22,1,.36,1)';
  el.style.opacity='0'; el.style.transform='scale(.88)translateY(24px)'; el.style.pointerEvents='none';
  updateTbBtn(id,false);
}
function restoreWindow(id) {
  const w=windows[id]; const el=document.getElementById(id); if(!w||!el) return;
  w.minimized=false;
  el.style.transition='all .22s cubic-bezier(.34,1.2,.64,1)';
  el.style.opacity='1'; el.style.transform=''; el.style.pointerEvents='';
  focusWindow(id); updateTbBtn(id,true);
}
function toggleMaximize(id) {
  const w=windows[id]; const el=document.getElementById(id); if(!w||!el) return;
  el.style.transition='all .22s cubic-bezier(.22,1,.36,1)';
  if(w.maximized){
    const r=w.prevRect;
    el.style.cssText=`width:${r.w}px;height:${r.h}px;left:${r.l}px;top:${r.t}px;z-index:${windowZIndex};transition:all .22s cubic-bezier(.22,1,.36,1);border-radius:13px 13px 9px 9px;border:1px solid var(--app-border);`;
    el.classList.remove('maximized'); document.getElementById(id+'-tb')?.classList.remove('maximized-bar'); w.maximized=false;
  } else {
    w.prevRect={w:el.offsetWidth,h:el.offsetHeight,l:el.offsetLeft,t:el.offsetTop};
    el.classList.add('maximized'); document.getElementById(id+'-tb')?.classList.add('maximized-bar'); w.maximized=true;
  }
}
function focusWindow(id) {
  if(focusedWindowId) document.getElementById(focusedWindowId)?.classList.remove('focused');
  const el=document.getElementById(id);
  if(el){el.style.zIndex=++windowZIndex;el.classList.add('focused');}
  focusedWindowId=id; updateTbBtn(id,true);
}

function addTbBtn(id,cfg) {
  const btn=document.createElement('button');
  btn.className='taskbar-app-btn active'; btn.id='tbtn_'+id;
  btn.onclick=()=>{const w=windows[id];if(!w)return;if(w.minimized)restoreWindow(id);else if(focusedWindowId===id)minimizeWindow(id);else focusWindow(id);};
  btn.innerHTML=`<div class="t-icon ${cfg.icon}" style="display:flex;align-items:center;justify-content:center;">${cfg.iconSVG.replace('<svg ','<svg style="width:16px;height:16px;color:white;" ')}</div><span>${cfg.title}</span>`;
  document.getElementById('taskbarApps').appendChild(btn);
}
function removeTbBtn(id){document.getElementById('tbtn_'+id)?.remove();}
function updateTbBtn(id,a){document.getElementById('tbtn_'+id)?.classList.toggle('active',a);}

function setupDrag(id) {
  const tb=document.getElementById(id+'-tb'); const win=document.getElementById(id); if(!tb||!win) return;
  tb.addEventListener('mousedown',e=>{
    if(e.target.closest('.window-controls')) return;
    if(windows[id]?.maximized) return;
    const ox=e.clientX-win.offsetLeft,oy=e.clientY-win.offsetTop;
    focusWindow(id);
    const ov=document.createElement('div');ov.className='drag-overlay';document.body.appendChild(ov);
    const mv=e=>{
      win.style.left=Math.max(0,Math.min(window.innerWidth-win.offsetWidth,e.clientX-ox))+'px';
      win.style.top=Math.max(0,Math.min(window.innerHeight-50-win.offsetHeight,e.clientY-oy))+'px';
    };
    const up=()=>{ov.remove();document.removeEventListener('mousemove',mv);document.removeEventListener('mouseup',up);};
    document.addEventListener('mousemove',mv);document.addEventListener('mouseup',up);
  });
}
function setupResize(id) {
  const rh=document.getElementById(id+'-rh');const win=document.getElementById(id);if(!rh||!win)return;
  rh.addEventListener('mousedown',e=>{
    e.stopPropagation();
    const sx=e.clientX,sy=e.clientY,sw=win.offsetWidth,sh=win.offsetHeight;
    const ov=document.createElement('div');ov.className='drag-overlay';ov.style.cursor='se-resize';document.body.appendChild(ov);
    const mv=e=>{win.style.width=Math.max(380,sw+e.clientX-sx)+'px';win.style.height=Math.max(240,sh+e.clientY-sy)+'px';};
    const up=()=>{ov.remove();document.removeEventListener('mousemove',mv);document.removeEventListener('mouseup',up);};
    document.addEventListener('mousemove',mv);document.addEventListener('mouseup',up);
  });
}

function toggleStartMenu(){document.getElementById('startMenu').classList.toggle('open');document.getElementById('startBtn').classList.toggle('active');}
function closeStartMenu(){document.getElementById('startMenu')?.classList.remove('open');document.getElementById('startBtn')?.classList.remove('active');}
function filterStartApps(q){document.querySelectorAll('.start-app-item').forEach(i=>{const n=i.querySelector('span')?.textContent.toLowerCase()||'';i.style.display=n.includes(q.toLowerCase())?'':'none';});}

function updateClock(){
  const n=new Date();
  const te=document.getElementById('trayTime');const de=document.getElementById('trayDate');
  if(te)te.textContent=String(n.getHours()).padStart(2,'0')+':'+String(n.getMinutes()).padStart(2,'0');
  if(de)de.textContent=`${n.getMonth()+1}/${n.getDate()}/${n.getFullYear()}`;
}
updateClock(); setInterval(updateClock,1000);

window.showToast=function(msg,type='info',title=null){
  const a=document.getElementById('toastArea');if(!a)return;
  const t=document.createElement('div');t.className=`toast ${type}`;
  const label={info:'Info',success:'Done',warning:'Warning',error:'Error'}[type]||'Info';
  t.innerHTML=`<div class="toast-icon"></div><div class="toast-content"><div class="toast-title">${title||label}</div><div class="toast-msg">${msg}</div></div>`;
  a.appendChild(t);
  setTimeout(()=>{t.classList.add('fade-out');setTimeout(()=>t.remove(),300);},3200);
};

function confirmShutdown(){closeStartMenu();document.getElementById('shutdownOverlay').classList.add('show');}
function cancelShutdown(){document.getElementById('shutdownOverlay').classList.remove('show');}
function doShutdown(){
  document.getElementById('shutdownOverlay').classList.remove('show');
  const ov=document.createElement('div');
  ov.style.cssText='position:fixed;inset:0;z-index:99999;background:#000;opacity:0;transition:opacity .8s;display:flex;align-items:center;justify-content:center;flex-direction:column;gap:14px;';
  ov.innerHTML=`<div style="font-family:Inter,sans-serif;font-size:28px;font-weight:300;color:#1a3050;letter-spacing:4px;">CloudOS</div>
    <div style="font-family:Inter,sans-serif;font-size:14px;color:#1a3050;letter-spacing:2px;">Shutting down...</div>`;
  document.body.appendChild(ov);
  requestAnimationFrame(()=>ov.style.opacity='1');
  setTimeout(()=>{window.location.href='index.html';},2200);
}

document.addEventListener('contextmenu',e=>{
  if(e.target.closest('.os-window')||e.target.closest('.taskbar')||e.target.closest('.start-menu'))return;
  e.preventDefault();
  document.querySelector('.context-menu')?.remove();
  const m=document.createElement('div');m.className='context-menu';
  m.style.cssText=`left:${Math.min(e.clientX,window.innerWidth-185)}px;top:${Math.min(e.clientY,window.innerHeight-215)}px;`;
  m.innerHTML=`
    <div class="ctx-item" onclick="openApp('fileSystem');this.closest('.context-menu').remove()">📁 File Explorer</div>
    <div class="ctx-item" onclick="openApp('terminal');this.closest('.context-menu').remove()">⌨ Terminal</div>
    <div class="ctx-divider"></div>
    <div class="ctx-item" onclick="openApp('processManager');this.closest('.context-menu').remove()">⚙ Task Manager</div>
    <div class="ctx-item" onclick="openApp('memoryManager');this.closest('.context-menu').remove()">💾 Memory Manager</div>
    <div class="ctx-divider"></div>
    <div class="ctx-item" onclick="confirmShutdown();this.closest('.context-menu').remove()">⏻ Shut Down</div>`;
  document.body.appendChild(m);
});
document.addEventListener('click',e=>{
  if(!e.target.closest('.context-menu')) document.querySelector('.context-menu')?.remove();
  if(!e.target.closest('.start-menu')&&!e.target.closest('.taskbar-start')) closeStartMenu();
});
document.getElementById('windowsContainer').addEventListener('mousedown',e=>{
  const w=e.target.closest('.os-window');if(w)focusWindow(w.id);
});
setTimeout(()=>showToast('Welcome to CloudOS! Double-click icons to launch apps.','info','CloudOS Ready'),700);
