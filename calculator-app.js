// ============================================================
// CloudOS — Calculator App  (calculator-app.js)
// Standard & Scientific, keyboard support, history log
// ============================================================
window.CalculatorApp = {
  display: '0', prev: null, operator: null,
  waitingForOperand: false, history: [], mode: 'standard', memory: 0,

  getHTML() { return this.buildShell(); },

  buildShell() {
    const stdRows = [
      [
        {l:'MC',  a:"CalculatorApp.mc()",        cls:'calc-fn'},
        {l:'MR',  a:"CalculatorApp.mr()",        cls:'calc-fn'},
        {l:'M+',  a:"CalculatorApp.mplus()",     cls:'calc-fn'},
        {l:'M−',  a:"CalculatorApp.mminus()",    cls:'calc-fn'},
      ],
      [
        {l:'CE',  a:"CalculatorApp.ce()",        cls:'calc-fn'},
        {l:'C',   a:"CalculatorApp.clearAll()",  cls:'calc-fn'},
        {l:'⌫',   a:"CalculatorApp.back()",      cls:'calc-fn'},
        {l:'÷',   a:"CalculatorApp.op('/')",     cls:'calc-op'},
      ],
      [
        {l:'7',   a:"CalculatorApp.num('7')"},   {l:'8', a:"CalculatorApp.num('8')"},
        {l:'9',   a:"CalculatorApp.num('9')"},   {l:'×', a:"CalculatorApp.op('*')", cls:'calc-op'},
      ],
      [
        {l:'4',   a:"CalculatorApp.num('4')"},   {l:'5', a:"CalculatorApp.num('5')"},
        {l:'6',   a:"CalculatorApp.num('6')"},   {l:'−', a:"CalculatorApp.op('-')", cls:'calc-op'},
      ],
      [
        {l:'1',   a:"CalculatorApp.num('1')"},   {l:'2', a:"CalculatorApp.num('2')"},
        {l:'3',   a:"CalculatorApp.num('3')"},   {l:'+', a:"CalculatorApp.op('+')", cls:'calc-op'},
      ],
      [
        {l:'±',   a:"CalculatorApp.negate()"},
        {l:'0',   a:"CalculatorApp.num('0')"},
        {l:'.',   a:"CalculatorApp.dot()"},
        {l:'=',   a:"CalculatorApp.equals()",    cls:'calc-eq'},
      ],
    ];

    const sciBtns = [
      {l:'sin',a:"CalculatorApp.sci('sin')",cls:'calc-sci'},
      {l:'cos',a:"CalculatorApp.sci('cos')",cls:'calc-sci'},
      {l:'tan',a:"CalculatorApp.sci('tan')",cls:'calc-sci'},
      {l:'√',  a:"CalculatorApp.sci('sqrt')",cls:'calc-sci'},
      {l:'x²', a:"CalculatorApp.sci('sq')", cls:'calc-sci'},
      {l:'xⁿ', a:"CalculatorApp.op('pow')",cls:'calc-sci'},
      {l:'log',a:"CalculatorApp.sci('log')",cls:'calc-sci'},
      {l:'ln', a:"CalculatorApp.sci('ln')", cls:'calc-sci'},
      {l:'π',  a:"CalculatorApp.insertConst(Math.PI)", cls:'calc-sci'},
      {l:'e',  a:"CalculatorApp.insertConst(Math.E)",  cls:'calc-sci'},
      {l:'1/x',a:"CalculatorApp.sci('inv')",cls:'calc-sci'},
      {l:'|x|',a:"CalculatorApp.sci('abs')",cls:'calc-sci'},
    ];

    const makeBtnHTML = (b) =>
      `<button class="calc-btn ${b.cls||''}" onclick="${b.a}">${b.l}</button>`;

    const sciHTML = this.mode === 'scientific'
      ? `<div class="calc-grid" style="margin-bottom:6px;">${sciBtns.map(makeBtnHTML).join('')}</div>`
      : '';

    const stdHTML = stdRows.map(row =>
      `<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:6px;margin-bottom:6px;">${row.map(makeBtnHTML).join('')}</div>`
    ).join('');

    return `<div class="calc-shell">
      <div class="calc-mode-row">
        <button class="calc-mode-btn${this.mode==='standard'?' active':''}" onclick="CalculatorApp.setMode('standard')">Standard</button>
        <button class="calc-mode-btn${this.mode==='scientific'?' active':''}" onclick="CalculatorApp.setMode('scientific')">Scientific</button>
      </div>
      <div class="calc-display-wrap">
        <div class="calc-expr" id="calc-expr"></div>
        <div class="calc-display" id="calc-display">${this.display}</div>
      </div>
      ${sciHTML}
      <div id="calc-std-grid">${stdHTML}</div>
      <div class="calc-history-head">
        <span style="font-size:11.5px;font-weight:600;letter-spacing:.5px;text-transform:uppercase;color:var(--app-text3);">History</span>
        <button onclick="CalculatorApp.clearHistory()"
          style="font-size:11px;background:none;border:none;color:var(--app-text3);cursor:pointer;padding:2px 6px;border-radius:4px;"
          onmouseover="this.style.background='var(--app-hover)'"
          onmouseout="this.style.background='none'">Clear</button>
      </div>
      <div class="calc-history" id="calc-history">
        <div style="font-size:12.5px;color:var(--app-text3);font-style:italic;padding:4px 0;">No calculations yet.</div>
      </div>
    </div>`;
  },

  init(winId) {
    this.winId = winId;
    this._keyHandler = (e) => {
      // Only respond when this window is focused
      const myWin = Object.values(window.windows||{}).find(w=>w.appId==='calculator');
      if (!myWin || myWin.id !== window.focusedWindowId) return;
      const k = e.key;
      if ('0123456789'.includes(k))         { this.num(k); return; }
      if (k==='.')                           { this.dot(); return; }
      if (k==='+')                           { this.op('+'); return; }
      if (k==='-')                           { this.op('-'); return; }
      if (k==='*')                           { this.op('*'); return; }
      if (k==='/')                           { e.preventDefault(); this.op('/'); return; }
      if (k==='Enter'||k==='=')              { this.equals(); return; }
      if (k==='Backspace')                   { this.back(); return; }
      if (k==='Escape')                      { this.clearAll(); return; }
    };
    document.addEventListener('keydown', this._keyHandler);
  },

  destroy() {
    if (this._keyHandler) document.removeEventListener('keydown', this._keyHandler);
  },

  setMode(m) {
    this.mode = m;
    // Re-render the content area
    const body = document.getElementById(this.winId+'-body');
    if (body) { body.innerHTML = this.buildShell(); this.updateDisplay(); }
  },

  // ── Input ──────────────────────────────────────────────
  num(n) {
    if (this.waitingForOperand) { this.display = n; this.waitingForOperand = false; }
    else this.display = this.display==='0' ? n : this.display+n;
    if (this.display.replace('-','').replace('.','').length > 14) return;
    this.updateDisplay();
  },

  insertConst(c) {
    this.display = String(parseFloat(c.toPrecision(10)));
    this.waitingForOperand = false;
    this.updateDisplay();
  },

  dot() {
    if (this.waitingForOperand) { this.display='0.'; this.waitingForOperand=false; }
    else if (!this.display.includes('.')) this.display+='.';
    this.updateDisplay();
  },

  negate() { this.display=String(-parseFloat(this.display)||0); this.updateDisplay(); },

  back() {
    this.display = this.display.length>1 ? this.display.slice(0,-1) : '0';
    this.updateDisplay();
  },

  ce()       { this.display='0'; this.updateDisplay(); },

  clearAll() {
    this.display='0'; this.prev=null; this.operator=null; this.waitingForOperand=false;
    this.setExpr(''); this.updateDisplay();
  },

  // ── Operations ─────────────────────────────────────────
  op(o) {
    const val = parseFloat(this.display);
    if (this.operator && !this.waitingForOperand) {
      const r = this.compute(this.prev, val, this.operator);
      this.display = this.fmt(r); this.prev = r;
    } else { this.prev = val; }
    this.operator = o; this.waitingForOperand = true;
    const sym = {'+':'+','-':'−','*':'×','/':'÷','pow':'^'}[o]||o;
    this.setExpr(this.fmt(this.prev)+' '+sym);
    this.updateDisplay();
  },

  equals() {
    if (this.operator===null) return;
    const val = parseFloat(this.display);
    const sym = {'+':'+','-':'−','*':'×','/':'÷','pow':'^'}[this.operator]||this.operator;
    const expr= this.fmt(this.prev)+' '+sym+' '+this.fmt(val);
    const r   = this.compute(this.prev, val, this.operator);
    const res = this.fmt(r);
    this.pushHistory(expr+' = '+res);
    this.display=res; this.prev=null; this.operator=null; this.waitingForOperand=true;
    this.setExpr(expr+' ='); this.updateDisplay();
  },

  compute(a,b,op) {
    if (op==='+')   return a+b;
    if (op==='-')   return a-b;
    if (op==='*')   return a*b;
    if (op==='/')   return b===0?NaN:a/b;
    if (op==='pow') return Math.pow(a,b);
    return b;
  },

  sci(fn) {
    const v=parseFloat(this.display), D=Math.PI/180;
    let r;
    if (fn==='sin')  r=Math.sin(v*D);
    else if (fn==='cos')  r=Math.cos(v*D);
    else if (fn==='tan')  r=Math.tan(v*D);
    else if (fn==='sqrt') r=Math.sqrt(v);
    else if (fn==='sq')   r=v*v;
    else if (fn==='log')  r=Math.log10(v);
    else if (fn==='ln')   r=Math.log(v);
    else if (fn==='inv')  r=1/v;
    else if (fn==='abs')  r=Math.abs(v);
    else r=v;
    const label={sin:'sin',cos:'cos',tan:'tan',sqrt:'√',sq:'sqr',log:'log',ln:'ln',inv:'1/',abs:'|'};
    this.pushHistory((label[fn]||fn)+'('+this.fmt(v)+') = '+this.fmt(r));
    this.setExpr((label[fn]||fn)+'('+this.fmt(v)+') =');
    this.display=this.fmt(r); this.waitingForOperand=true; this.updateDisplay();
  },

  // Memory
  mc()     { this.memory=0; window.showToast('Memory cleared','info'); },
  mr()     { this.display=this.fmt(this.memory); this.waitingForOperand=true; this.updateDisplay(); },
  mplus()  { this.memory+=parseFloat(this.display); window.showToast('M+ '+this.fmt(this.memory),'info'); },
  mminus() { this.memory-=parseFloat(this.display); window.showToast('M− '+this.fmt(this.memory),'info'); },

  // Helpers
  fmt(n) {
    if (isNaN(n)) return 'Error';
    if (!isFinite(n)) return n>0?'∞':'-∞';
    return String(parseFloat(n.toPrecision(12)));
  },

  setExpr(e) { const el=document.getElementById('calc-expr'); if(el)el.textContent=e; },

  updateDisplay() {
    const el=document.getElementById('calc-display'); if(!el)return;
    el.textContent=this.display;
    const len=this.display.length;
    el.style.fontSize=len>14?'18px':len>10?'24px':len>7?'30px':'38px';
  },

  pushHistory(entry) {
    this.history.unshift(entry); if(this.history.length>20)this.history.pop();
    const el=document.getElementById('calc-history'); if(!el)return;
    el.innerHTML=this.history.map(h=>
      `<div class="calc-hist-row" onclick="CalculatorApp.recallHist('${h.split('=').pop().trim()}')">${h}</div>`
    ).join('');
  },

  recallHist(v) { this.display=v; this.waitingForOperand=true; this.updateDisplay(); },

  clearHistory() {
    this.history=[];
    const el=document.getElementById('calc-history');
    if(el)el.innerHTML='<div style="font-size:12.5px;color:var(--app-text3);font-style:italic;padding:4px 0;">No calculations yet.</div>';
  }
};
