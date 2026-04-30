// ============================================================
// CloudOS — Paint App  (paint-app.js)
// ============================================================
window.PaintApp = {
  canvas: null, ctx: null,
  tool: 'pencil', color: '#0078d4', bgColor: '#ffffff',
  size: 6, opacity: 1,
  drawing: false, startX: 0, startY: 0,
  history: [], shapePrev: null,

  palette: [
    '#000000','#ffffff','#c0392b','#e74c3c','#e67e22','#f39c12',
    '#f1c40f','#2ecc71','#27ae60','#3498db','#2980b9','#9b59b6',
    '#e91e63','#ff5722','#795548','#607d8b','#0078d4','#00897b'
  ],

  getHTML() {
    const swatches = this.palette.map(c =>
      `<button class="paint-swatch" style="background:${c};" onclick="PaintApp.setColor('${c}')" title="${c}"></button>`
    ).join('');

    const toolDefs = [
      ['pencil',  'Pencil',    'M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z'],
      ['brush',   'Brush',     'M20.84 4.61a5.5 5.5 0 0 0-7.78 0L3 14.67V21h6.33l10.06-10.06a5.5 5.5 0 0 0 0-7.78z'],
      ['eraser',  'Eraser',    'M20 20H7L3 16l10-10 7 7-3.5 3.5 M6.5 17.5l4-4'],
      ['fill',    'Fill',      'M19 11c0 5-7 11-7 11S5 16 5 11a7 7 0 0 1 14 0z M12 11m-2 0a2 2 0 1 0 4 0a2 2 0 1 0 -4 0'],
      ['line',    'Line',      'M5 19L19 5'],
      ['rect',    'Rectangle', 'M3 3h18v18H3z'],
      ['circle',  'Circle',    'M12 3a9 9 0 1 0 0 18A9 9 0 0 0 12 3z'],
      ['eyedrop', 'Eyedrop',   'M2 22l4-4m12.5-12.5a3.5 3.5 0 0 0-5-5L5 9l10 10 4.5-4.5z']
    ];

    const toolBtns = toolDefs.map(([id, label, path]) =>
      `<button class="paint-tool-btn${this.tool===id?' active':''}" id="ptool-${id}"
         onclick="PaintApp.setTool('${id}')" title="${label}">
         <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:16px;height:16px;">
           <path d="${path}"/>
         </svg>
       </button>`
    ).join('');

    return `<div class="paint-shell">
      <div class="paint-toolbar">
        <div class="paint-tool-group">
          <span class="paint-group-label">Tools</span>
          <div class="paint-tool-row">${toolBtns}</div>
        </div>
        <div class="paint-divider-v"></div>
        <div class="paint-tool-group">
          <span class="paint-group-label">Size: <strong id="paint-size-val">${this.size}px</strong></span>
          <input type="range" id="paint-size" min="1" max="60" value="${this.size}" class="paint-slider"
            oninput="PaintApp.setSize(this.value)" style="width:110px;"/>
          <span class="paint-group-label" style="margin-top:5px;">Opacity: <strong id="paint-op-val">100%</strong></span>
          <input type="range" id="paint-opacity" min="10" max="100" value="100" class="paint-slider"
            oninput="PaintApp.setOpacity(this.value)" style="width:110px;"/>
        </div>
        <div class="paint-divider-v"></div>
        <div class="paint-tool-group">
          <span class="paint-group-label">Colour</span>
          <div style="display:flex;gap:8px;align-items:center;margin-bottom:5px;">
            <div id="paint-fg" style="width:30px;height:30px;border-radius:7px;border:2px solid var(--app-border);background:${this.color};cursor:pointer;transition:transform .15s;" title="Current colour"></div>
            <input type="color" id="paint-color-input" value="${this.color}" class="paint-color-input"
              oninput="PaintApp.setColor(this.value)" title="Pick colour"/>
          </div>
          <div class="paint-palette">${swatches}</div>
        </div>
        <div class="paint-divider-v"></div>
        <div class="paint-tool-group">
          <span class="paint-group-label">Actions</span>
          <div style="display:flex;flex-direction:column;gap:5px;">
            <button class="app-btn neutral" style="font-size:12px;padding:5px 10px;" onclick="PaintApp.undo()">↩ Undo</button>
            <button class="app-btn neutral" style="font-size:12px;padding:5px 10px;" onclick="PaintApp.clearCanvas()">🗑 Clear</button>
            <button class="app-btn success" style="font-size:12px;padding:5px 10px;" onclick="PaintApp.download()">⬇ Save PNG</button>
          </div>
        </div>
      </div>
      <div class="paint-canvas-wrap" id="paint-canvas-wrap">
        <canvas id="paint-canvas" class="paint-canvas"></canvas>
      </div>
      <div class="paint-status">
        <span id="paint-tool-label">Tool: Pencil</span>
        <span id="paint-coords" style="margin-left:auto;">x: 0, y: 0</span>
        <span id="paint-canvas-size" style="margin-left:16px;"></span>
      </div>
    </div>`;
  },

  init(winId) {
    this.winId = winId;
    requestAnimationFrame(() => setTimeout(() => this.initCanvas(), 50));
  },

  destroy() {
    this.canvas = null; this.ctx = null; this.history = [];
  },

  initCanvas() {
    const wrap = document.getElementById('paint-canvas-wrap');
    const cvs  = document.getElementById('paint-canvas');
    if (!wrap || !cvs) return;
    const w = Math.max(560, wrap.clientWidth - 24);
    const h = Math.max(360, wrap.clientHeight - 24);
    cvs.width = w; cvs.height = h;
    this.canvas = cvs;
    this.ctx = cvs.getContext('2d');
    this.ctx.fillStyle = '#ffffff';
    this.ctx.fillRect(0, 0, w, h);
    const sz = document.getElementById('paint-canvas-size');
    if (sz) sz.textContent = w + ' × ' + h;
    this.saveHistory();
    this.bindEvents();
  },

  bindEvents() {
    const cvs = this.canvas;
    cvs.addEventListener('mousedown',  e => this.onDown(e));
    cvs.addEventListener('mousemove',  e => this.onMove(e));
    cvs.addEventListener('mouseup',    e => this.onUp(e));
    cvs.addEventListener('mouseleave', e => this.onUp(e));
  },

  pt(e) {
    const r = this.canvas.getBoundingClientRect();
    return { x: Math.round(e.clientX - r.left), y: Math.round(e.clientY - r.top) };
  },

  onDown(e) {
    const {x,y} = this.pt(e);
    this.drawing = true; this.startX = x; this.startY = y;
    const ctx = this.ctx;

    if (this.tool === 'fill')    { this.floodFill(x,y); return; }
    if (this.tool === 'eyedrop') { this.eyedrop(x,y); return; }
    if (['line','rect','circle'].includes(this.tool)) {
      this.shapePrev = ctx.getImageData(0,0,this.canvas.width,this.canvas.height);
      return;
    }
    ctx.globalAlpha = this.opacity;
    ctx.beginPath(); ctx.moveTo(x,y);
    if (this.tool === 'pencil' || this.tool === 'brush') {
      ctx.strokeStyle = this.color;
      ctx.lineWidth   = this.tool === 'brush' ? this.size * 2.5 : this.size;
      ctx.lineCap = ctx.lineJoin = 'round';
      ctx.lineTo(x,y); ctx.stroke();
    }
    if (this.tool === 'eraser') {
      ctx.arc(x,y,this.size,0,Math.PI*2);
      ctx.fillStyle = this.bgColor; ctx.globalAlpha = 1; ctx.fill();
    }
  },

  onMove(e) {
    const {x,y} = this.pt(e);
    const co = document.getElementById('paint-coords');
    if (co) co.textContent = 'x: ' + x + ', y: ' + y;
    if (!this.drawing) return;
    const ctx = this.ctx;

    if (this.tool === 'pencil' || this.tool === 'brush') {
      ctx.globalAlpha = this.opacity;
      ctx.strokeStyle = this.color;
      ctx.lineWidth   = this.tool === 'brush' ? this.size * 2.5 : this.size;
      ctx.lineCap = ctx.lineJoin = 'round';
      ctx.lineTo(x,y); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(x,y);
      return;
    }
    if (this.tool === 'eraser') {
      ctx.beginPath(); ctx.arc(x,y,this.size,0,Math.PI*2);
      ctx.fillStyle = this.bgColor; ctx.globalAlpha = 1; ctx.fill();
      return;
    }
    if (['line','rect','circle'].includes(this.tool) && this.shapePrev) {
      ctx.putImageData(this.shapePrev,0,0);
      ctx.globalAlpha = this.opacity;
      ctx.strokeStyle = this.color; ctx.lineWidth = this.size; ctx.lineCap = 'round';
      if (this.tool === 'line') {
        ctx.beginPath(); ctx.moveTo(this.startX,this.startY); ctx.lineTo(x,y); ctx.stroke();
      } else if (this.tool === 'rect') {
        ctx.beginPath(); ctx.strokeRect(this.startX,this.startY,x-this.startX,y-this.startY);
      } else {
        const rx=Math.abs(x-this.startX)/2, ry=Math.abs(y-this.startY)/2;
        const cx=this.startX+(x-this.startX)/2, cy=this.startY+(y-this.startY)/2;
        ctx.beginPath(); ctx.ellipse(cx,cy,rx||1,ry||1,0,0,Math.PI*2); ctx.stroke();
      }
    }
  },

  onUp(e) {
    if (!this.drawing) return;
    this.drawing = false;
    const {x,y} = this.pt(e);
    const ctx = this.ctx;
    if (['line','rect','circle'].includes(this.tool) && this.shapePrev) {
      ctx.putImageData(this.shapePrev,0,0);
      ctx.globalAlpha = this.opacity;
      ctx.strokeStyle = this.color; ctx.lineWidth = this.size; ctx.lineCap = 'round';
      if (this.tool === 'line') {
        ctx.beginPath(); ctx.moveTo(this.startX,this.startY); ctx.lineTo(x,y); ctx.stroke();
      } else if (this.tool === 'rect') {
        ctx.beginPath(); ctx.strokeRect(this.startX,this.startY,x-this.startX,y-this.startY);
      } else {
        const rx=Math.abs(x-this.startX)/2, ry=Math.abs(y-this.startY)/2;
        const cx=this.startX+(x-this.startX)/2, cy=this.startY+(y-this.startY)/2;
        ctx.beginPath(); ctx.ellipse(cx,cy,rx||1,ry||1,0,0,Math.PI*2); ctx.stroke();
      }
      this.shapePrev = null;
    }
    ctx.globalAlpha = 1; ctx.beginPath();
    this.saveHistory();
  },

  floodFill(sx, sy) {
    const ctx = this.ctx, w = this.canvas.width, h = this.canvas.height;
    const img = ctx.getImageData(0,0,w,h), d = img.data;
    const i = (sy*w+sx)*4;
    const [tr,tg,tb,ta] = [d[i],d[i+1],d[i+2],d[i+3]];
    const tmp = document.createElement('canvas'); tmp.width = tmp.height = 1;
    const tc = tmp.getContext('2d'); tc.fillStyle = this.color; tc.fillRect(0,0,1,1);
    const fc = tc.getImageData(0,0,1,1).data;
    const [fr,fg,fb] = [fc[0],fc[1],fc[2]];
    if (tr===fr && tg===fg && tb===fb) return;
    const match = j => d[j]===tr && d[j+1]===tg && d[j+2]===tb && d[j+3]===ta;
    const stack = [[sx,sy]];
    while (stack.length) {
      const [cx,cy] = stack.pop();
      const ci = (cy*w+cx)*4;
      if (cx<0||cx>=w||cy<0||cy>=h||!match(ci)) continue;
      d[ci]=fr; d[ci+1]=fg; d[ci+2]=fb; d[ci+3]=255;
      stack.push([cx+1,cy],[cx-1,cy],[cx,cy+1],[cx,cy-1]);
    }
    ctx.putImageData(img,0,0); this.saveHistory();
  },

  eyedrop(x,y) {
    const p = this.ctx.getImageData(x,y,1,1).data;
    const hex = '#'+[p[0],p[1],p[2]].map(v=>v.toString(16).padStart(2,'0')).join('');
    this.setColor(hex); this.setTool('pencil');
    window.showToast('Colour picked: '+hex,'info');
  },

  setTool(t) {
    this.tool = t;
    document.querySelectorAll('.paint-tool-btn').forEach(b=>b.classList.remove('active'));
    const btn = document.getElementById('ptool-'+t);
    if (btn) btn.classList.add('active');
    const names={pencil:'Pencil',brush:'Brush',eraser:'Eraser',fill:'Fill',
                 line:'Line',rect:'Rectangle',circle:'Ellipse',eyedrop:'Eyedropper'};
    const lbl = document.getElementById('paint-tool-label');
    if (lbl) lbl.textContent = 'Tool: '+(names[t]||t);
    if (this.canvas) this.canvas.style.cursor = t==='fill'?'cell':t==='eyedrop'?'crosshair':'crosshair';
  },

  setColor(c) {
    this.color = c;
    const fg = document.getElementById('paint-fg');
    if (fg) fg.style.background = c;
    const inp = document.getElementById('paint-color-input');
    if (inp) inp.value = c;
  },

  setSize(v)    { this.size = parseInt(v); const l=document.getElementById('paint-size-val'); if(l)l.textContent=v+'px'; },
  setOpacity(v) { this.opacity = v/100;    const l=document.getElementById('paint-op-val');  if(l)l.textContent=v+'%'; },

  saveHistory() {
    if (!this.ctx) return;
    this.history.push(this.ctx.getImageData(0,0,this.canvas.width,this.canvas.height));
    if (this.history.length > 25) this.history.shift();
  },

  undo() {
    if (this.history.length <= 1) { window.showToast('Nothing to undo!','warning'); return; }
    this.history.pop();
    this.ctx.putImageData(this.history[this.history.length-1],0,0);
    window.showToast('Undo','info');
  },

  clearCanvas() {
    if (!this.ctx) return;
    this.ctx.globalAlpha = 1;
    this.ctx.fillStyle = '#ffffff';
    this.ctx.fillRect(0,0,this.canvas.width,this.canvas.height);
    this.saveHistory();
    window.showToast('Canvas cleared','info');
  },

  download() {
    if (!this.canvas) return;
    const a = document.createElement('a');
    a.download = 'cloudos-paint-'+Date.now()+'.png';
    a.href = this.canvas.toDataURL('image/png');
    a.click();
    window.showToast('PNG downloaded!','success');
  }
};
