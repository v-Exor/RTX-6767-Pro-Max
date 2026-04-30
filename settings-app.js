// ============================================================
// CloudOS — Settings App v3  (settings-app.js)
// Full wallpaper: image upload, drag-drop, presets, fit modes
// Dark / Light mode, accent, font size, system toggles
// ============================================================
window.SettingsApp = {
  currentSection: 'personalisation',
  currentWallpaper: 'default',   // preset name or 'custom'
  customImageDataURL: null,       // uploaded image base64
  wallpaperFit: 'cover',          // cover | contain | fill | center

  getHTML() { return this.buildShell(); },

  buildShell() {
    const navDefs = [
      { id:'personalisation', label:'Personalisation',
        icon:'M12 20h9M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z' },
      { id:'wallpaper',       label:'Wallpaper',
        icon:'M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z' },
      { id:'system',          label:'System',
        icon:'M2 3h20v14H2zM8 21h8M12 17v4' },
      { id:'about',           label:'About CloudOS',
        icon:'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z' },
    ];

    const nav = navDefs.map(n =>
      `<div class="settings-nav-item${this.currentSection===n.id?' active':''}"
         id="snav-${n.id}" onclick="SettingsApp.showSection('${n.id}')">
         <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"
           style="width:18px;height:18px;flex-shrink:0;"><path d="${n.icon}"/></svg>
         ${n.label}
       </div>`
    ).join('');

    return `<div class="settings-shell">
      <div class="settings-sidebar">
        <div class="settings-sidebar-title">Settings</div>
        ${nav}
      </div>
      <div class="settings-content" id="settings-content">
        ${this.renderSection(this.currentSection)}
      </div>
    </div>`;
  },

  renderSection(id) {
    if (id === 'personalisation') return this.renderPersonalisation();
    if (id === 'wallpaper')       return this.renderWallpaper();
    if (id === 'system')          return this.renderSystem();
    if (id === 'about')           return this.renderAbout();
    return '';
  },

  // ── PERSONALISATION ──────────────────────────────────
  renderPersonalisation() {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    const accents = ['#0078d4','#7b1fa2','#c62828','#00838f','#2e7d32','#e65100','#4527a0','#00695c','#c2185b','#1565c0'];

    return `<div class="settings-pane">
      <h2 class="settings-pane-title">Personalisation</h2>

      <!-- Theme toggle -->
      <div class="settings-card">
        <div class="settings-card-title">App Theme</div>
        <div class="settings-card-sub">Switch between Light and Dark mode for all desktop app windows</div>
        <div class="theme-toggle-row">
          <div class="theme-tile${!isDark?' theme-tile-active':''}" onclick="SettingsApp.setTheme('light')">
            <div class="theme-preview theme-preview-light">
              <div class="tp-titlebar"></div>
              <div class="tp-body" style="background:#fff;padding:8px;">
                <div class="tp-row"></div><div class="tp-row short"></div>
              </div>
            </div>
            <div class="theme-tile-label">${!isDark?'<span class="theme-check">✓</span>':''} Light</div>
          </div>
          <div class="theme-tile${isDark?' theme-tile-active':''}" onclick="SettingsApp.setTheme('dark')">
            <div class="theme-preview theme-preview-dark">
              <div class="tp-titlebar"></div>
              <div class="tp-body" style="background:#243044;padding:8px;">
                <div class="tp-row" style="background:rgba(79,195,247,.25);"></div>
                <div class="tp-row short" style="background:rgba(79,195,247,.25);"></div>
              </div>
            </div>
            <div class="theme-tile-label">${isDark?'<span class="theme-check">✓</span>':''} Dark</div>
          </div>
        </div>
      </div>

      <!-- Accent colour -->
      <div class="settings-card" style="margin-top:14px;">
        <div class="settings-card-title">Accent Colour</div>
        <div class="settings-card-sub">Changes buttons, highlights and focus rings across all apps</div>
        <div class="accent-grid" style="margin-top:12px;">
          ${accents.map(c =>
            `<button class="accent-dot" style="background:${c};"
               onclick="SettingsApp.setAccent('${c}')" title="${c}"></button>`
          ).join('')}
          <input type="color" value="#0078d4" class="accent-custom" title="Custom colour"
            oninput="SettingsApp.setAccent(this.value)"/>
        </div>
      </div>

      <!-- Font size -->
      <div class="settings-card" style="margin-top:14px;">
        <div class="settings-card-title">Font Size</div>
        <div class="settings-card-sub">Scales text inside all app windows</div>
        <div style="display:flex;align-items:center;gap:14px;margin-top:12px;">
          <span style="font-size:12px;color:var(--app-text3);">A</span>
          <input type="range" min="12" max="18" value="15" step="1" class="paint-slider"
            style="flex:1;" oninput="SettingsApp.setFontSize(this.value)" id="fs-slider"/>
          <span style="font-size:18px;color:var(--app-text3);">A</span>
          <span id="fs-label" style="font-size:13px;color:var(--app-text2);min-width:36px;">15px</span>
        </div>
      </div>

      <!-- Reset -->
      <div class="settings-card" style="margin-top:14px;">
        <div class="settings-card-title">Reset All Settings</div>
        <div class="settings-card-sub">Restore theme, accent, font size and wallpaper to defaults</div>
        <button class="app-btn danger" style="margin-top:12px;font-size:13px;"
          onclick="SettingsApp.resetAll()">Reset to Defaults</button>
      </div>
    </div>`;
  },

  // ── WALLPAPER ────────────────────────────────────────
  renderWallpaper() {
    const presets = [
      { id:'default',  label:'Blue Orbs',  css:'linear-gradient(135deg,#05101f 0%,#0d2a5e 100%)' },
      { id:'aurora',   label:'Aurora',     css:'linear-gradient(135deg,#0d1b2a 0%,#1a472a 40%,#2d6a4f 70%,#1b4332 100%)' },
      { id:'sunset',   label:'Sunset',     css:'linear-gradient(135deg,#1a1a2e 0%,#16213e 30%,#0f3460 60%,#533483 100%)' },
      { id:'ocean',    label:'Deep Ocean', css:'linear-gradient(135deg,#0a192f 0%,#112240 40%,#1d3461 70%,#0c2340 100%)' },
      { id:'forest',   label:'Forest',     css:'linear-gradient(135deg,#0a1628 0%,#1b3a2a 40%,#2d5016 70%,#1a3a1a 100%)' },
      { id:'midnight', label:'Midnight',   css:'linear-gradient(135deg,#0a0a0a 0%,#1a0a2e 50%,#0d0d2e 100%)' },
      { id:'dawn',     label:'Dawn',       css:'linear-gradient(135deg,#1a0a0a 0%,#2e1a0a 30%,#3d1c02 60%,#1a1228 100%)' },
      { id:'neon',     label:'Neon City',  css:'linear-gradient(135deg,#0d0d2e 0%,#1a0a2e 30%,#0a1628 60%,#001a33 100%)' },
    ];

    const currentBg = this.customImageDataURL
      ? `url(${this.customImageDataURL})`
      : (presets.find(p=>p.id===this.currentWallpaper)||presets[0]).css;

    const fitModes = ['cover','contain','fill','center'];

    return `<div class="settings-pane">
      <h2 class="settings-pane-title">Wallpaper</h2>

      <!-- Live preview -->
      <div class="settings-card">
        <div class="settings-card-title">Current Wallpaper</div>
        <div class="wp-current-preview" id="wp-live-preview"
          style="background:${currentBg};background-size:${this.wallpaperFit};background-position:center;">
          <span style="font-size:11px;color:rgba(255,255,255,.5);font-weight:600;letter-spacing:1px;
            text-transform:uppercase;text-shadow:0 1px 4px rgba(0,0,0,.8);">
            ${this.customImageDataURL ? 'Custom Image' : (presets.find(p=>p.id===this.currentWallpaper)||presets[0]).label}
          </span>
        </div>

        <!-- Fit mode buttons -->
        <div style="margin-top:10px;">
          <div style="font-size:12px;color:var(--app-text3);font-weight:600;margin-bottom:6px;letter-spacing:.4px;text-transform:uppercase;">Image Fit</div>
          <div class="wp-fit-row">
            ${fitModes.map(m =>
              `<button class="wp-fit-btn${this.wallpaperFit===m?' active':''}"
                 onclick="SettingsApp.setFit('${m}')">${m.charAt(0).toUpperCase()+m.slice(1)}</button>`
            ).join('')}
          </div>
        </div>

        <!-- Overlay dimming -->
        <div style="margin-top:12px;">
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px;">
            <span style="font-size:12px;color:var(--app-text3);font-weight:600;letter-spacing:.4px;text-transform:uppercase;">Overlay Dim</span>
            <span id="dim-label" style="font-size:12px;color:var(--app-text2);">0%</span>
          </div>
          <input type="range" min="0" max="70" value="0" step="5" class="paint-slider"
            style="width:100%;" oninput="SettingsApp.setDim(this.value)" id="dim-slider"/>
        </div>
      </div>

      <!-- Image Upload -->
      <div class="settings-card" style="margin-top:14px;">
        <div class="settings-card-title">Upload Your Own Wallpaper</div>
        <div class="settings-card-sub">Supports JPG, PNG, GIF, WebP — drag & drop or click to browse</div>

        <div class="wp-upload-zone" id="wp-drop-zone"
          onclick="document.getElementById('wp-file-input').click()"
          ondragover="SettingsApp.onDragOver(event)"
          ondragleave="SettingsApp.onDragLeave(event)"
          ondrop="SettingsApp.onDrop(event)">
          <span class="wp-upload-icon">🖼</span>
          <span class="wp-upload-label">Click to browse or drag & drop an image</span>
          <span class="wp-upload-sub">JPG, PNG, GIF, WebP supported</span>
        </div>
        <input type="file" id="wp-file-input" accept="image/*"
          style="display:none;" onchange="SettingsApp.onFileSelect(event)"/>

        ${this.customImageDataURL ? `
          <button class="wp-remove-btn" onclick="SettingsApp.removeCustomWallpaper()">
            ✕ Remove Custom Wallpaper
          </button>` : ''}
      </div>

      <!-- Preset grid -->
      <div class="settings-card" style="margin-top:14px;">
        <div class="settings-card-title">Gradient Presets</div>
        <div class="settings-card-sub">Built-in wallpaper styles — click to apply instantly</div>
        <div class="wp-preset-grid" style="margin-top:12px;">
          ${presets.map(p =>
            `<button class="wp-preset-btn${this.currentWallpaper===p.id&&!this.customImageDataURL?' active-wp':''}"
               onclick="SettingsApp.applyPreset('${p.id}')">
               <div class="wp-preset-thumb" style="background:${p.css};"></div>
               <span class="wp-preset-name">${p.label}</span>
             </button>`
          ).join('')}
        </div>
      </div>
    </div>`;
  },

  // ── SYSTEM ───────────────────────────────────────────
  renderSystem() {
    return `<div class="settings-pane">
      <h2 class="settings-pane-title">System</h2>

      <div class="settings-card">
        <div class="settings-card-title">Window Animation Speed</div>
        <div class="settings-card-sub">Controls how fast windows open, close and minimise</div>
        <div style="display:flex;gap:8px;margin-top:12px;">
          ${['Fast','Normal','Slow'].map(s =>
            `<button class="app-btn neutral" style="font-size:13px;"
               onclick="SettingsApp.setAnimSpeed('${s.toLowerCase()}')">${s}</button>`
          ).join('')}
        </div>
      </div>

      <div class="settings-card" style="margin-top:14px;">
        <div class="settings-card-title">Taskbar</div>
        <div class="settings-row">
          <div class="settings-card-sub" style="margin:0;">Show clock</div>
          <label class="settings-toggle">
            <input type="checkbox" checked onchange="SettingsApp.toggleClock(this.checked)"/>
            <span class="toggle-track"><span class="toggle-thumb"></span></span>
          </label>
        </div>
        <div class="divider"></div>
        <div class="settings-row">
          <div class="settings-card-sub" style="margin:0;">Show search bar</div>
          <label class="settings-toggle">
            <input type="checkbox" checked onchange="SettingsApp.toggleSearch(this.checked)"/>
            <span class="toggle-track"><span class="toggle-thumb"></span></span>
          </label>
        </div>
      </div>

      <div class="settings-card" style="margin-top:14px;">
        <div class="settings-card-title">Notifications</div>
        <div class="settings-row">
          <div class="settings-card-sub" style="margin:0;">Show toast notifications</div>
          <label class="settings-toggle">
            <input type="checkbox" checked onchange="SettingsApp.toggleToasts(this.checked)"/>
            <span class="toggle-track"><span class="toggle-thumb"></span></span>
          </label>
        </div>
      </div>
    </div>`;
  },

  // ── ABOUT ────────────────────────────────────────────
  renderAbout() {
    const upMs  = Date.now() - (window._bootTime||Date.now());
    const upMin = Math.floor(upMs/60000);
    const upSec = Math.floor((upMs%60000)/1000);
    const stats = [
      ['Uptime',           upMin+'m '+upSec+'s'],
      ['Active Processes', OSState.processes.filter(p=>p.state!=='Terminated').length],
      ['Total RAM',        OSState.totalMemory+' MB'],
      ['Used RAM',         OSState.usedMemory+' MB'],
      ['Files',            Object.values(OSState.fileSystem).filter(n=>n.type==='file').length],
      ['Print Queue',      OSState.printerQueue.length+' job(s)'],
    ];
    return `<div class="settings-pane">
      <h2 class="settings-pane-title">About CloudOS</h2>
      <div class="settings-card about-hero">
        <div style="display:flex;align-items:center;gap:18px;">
          <div style="width:56px;height:56px;display:grid;grid-template-columns:1fr 1fr;gap:5px;flex-shrink:0;">
            <span style="background:var(--app-accent);border-radius:3px;display:block;"></span>
            <span style="background:var(--app-accent);border-radius:3px;display:block;opacity:.75;"></span>
            <span style="background:var(--app-accent);border-radius:3px;display:block;opacity:.75;"></span>
            <span style="background:var(--app-accent);border-radius:3px;display:block;opacity:.5;"></span>
          </div>
          <div>
            <div style="font-size:22px;font-weight:700;color:var(--app-text);">CloudOS</div>
            <div style="font-size:13px;color:var(--app-text3);">Version 2.0.0 — OS Simulator</div>
            <div style="font-size:12px;color:var(--app-text3);margin-top:3px;">CMSC 314 Final Project</div>
          </div>
        </div>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:14px;">
        ${stats.map(([l,v]) =>
          `<div class="settings-card" style="padding:12px 14px;">
             <div style="font-size:11px;color:var(--app-text3);font-weight:600;text-transform:uppercase;letter-spacing:.5px;">${l}</div>
             <div style="font-size:20px;font-weight:700;color:var(--app-accent);margin-top:4px;">${v}</div>
           </div>`
        ).join('')}
      </div>
      <div class="settings-card" style="margin-top:14px;">
        <div class="settings-card-title">Built With</div>
        <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:10px;">
          ${['HTML5','CSS3','Vanilla JS','Canvas API','Inter Font','No Frameworks'].map(t =>
            `<span style="background:var(--app-bg2);border:1px solid var(--app-border);
               border-radius:6px;padding:4px 10px;font-size:12.5px;color:var(--app-text2);">${t}</span>`
          ).join('')}
        </div>
      </div>
    </div>`;
  },

  // ── Navigation ───────────────────────────────────────
  showSection(id) {
    this.currentSection = id;
    document.querySelectorAll('.settings-nav-item').forEach(el => el.classList.remove('active'));
    const nav = document.getElementById('snav-'+id);
    if (nav) nav.classList.add('active');
    const content = document.getElementById('settings-content');
    if (!content) return;
    content.style.opacity = '0';
    content.style.transform = 'translateY(8px)';
    setTimeout(() => {
      content.innerHTML = this.renderSection(id);
      content.style.transition = 'opacity .2s,transform .2s';
      content.style.opacity = '1';
      content.style.transform = 'translateY(0)';
    }, 110);
  },

  // ── Wallpaper: file input ─────────────────────────────
  onFileSelect(e) {
    const file = e.target.files[0];
    if (file) this.loadImageFile(file);
  },

  onDragOver(e) {
    e.preventDefault();
    document.getElementById('wp-drop-zone')?.classList.add('drag-over');
  },

  onDragLeave(e) {
    document.getElementById('wp-drop-zone')?.classList.remove('drag-over');
  },

  onDrop(e) {
    e.preventDefault();
    document.getElementById('wp-drop-zone')?.classList.remove('drag-over');
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) this.loadImageFile(file);
    else window.showToast('Please drop an image file!', 'error');
  },

  loadImageFile(file) {
    const reader = new FileReader();
    reader.onload = (ev) => {
      this.customImageDataURL = ev.target.result;
      this.currentWallpaper   = 'custom';
      this.applyWallpaperToDesktop();
      window.showToast('Wallpaper applied: '+file.name, 'success');
      // Re-render wallpaper section to show remove button + preview
      const content = document.getElementById('settings-content');
      if (content && this.currentSection === 'wallpaper') {
        content.innerHTML = this.renderWallpaper();
      }
    };
    reader.readAsDataURL(file);
  },

  // ── Wallpaper: presets ───────────────────────────────
  applyPreset(id) {
    this.currentWallpaper   = id;
    this.customImageDataURL = null;
    this.applyWallpaperToDesktop();
    window.showToast('Wallpaper changed', 'info');
    // Refresh section to update active state
    const content = document.getElementById('settings-content');
    if (content && this.currentSection === 'wallpaper') {
      content.innerHTML = this.renderWallpaper();
    }
  },

  // ── Apply to actual desktop ───────────────────────────
  applyWallpaperToDesktop() {
    const wallpaperEl = document.getElementById('wallpaper');
    const imgEl       = document.getElementById('wallpaper-img');
    if (!imgEl || !wallpaperEl) return;

    const presets = {
      default:  'linear-gradient(135deg,#05101f 0%,#0d2a5e 100%)',
      aurora:   'linear-gradient(135deg,#0d1b2a 0%,#1a472a 40%,#2d6a4f 70%,#1b4332 100%)',
      sunset:   'linear-gradient(135deg,#1a1a2e 0%,#16213e 30%,#0f3460 60%,#533483 100%)',
      ocean:    'linear-gradient(135deg,#0a192f 0%,#112240 40%,#1d3461 70%,#0c2340 100%)',
      forest:   'linear-gradient(135deg,#0a1628 0%,#1b3a2a 40%,#2d5016 70%,#1a3a1a 100%)',
      midnight: 'linear-gradient(135deg,#0a0a0a 0%,#1a0a2e 50%,#0d0d2e 100%)',
      dawn:     'linear-gradient(135deg,#1a0a0a 0%,#2e1a0a 30%,#3d1c02 60%,#1a1228 100%)',
      neon:     'linear-gradient(135deg,#0d0d2e 0%,#1a0a2e 30%,#0a1628 60%,#001a33 100%)',
    };

    if (this.customImageDataURL) {
      // Custom image
      imgEl.style.backgroundImage    = `url(${this.customImageDataURL})`;
      imgEl.style.backgroundSize     = this.wallpaperFit === 'center' ? 'auto' : this.wallpaperFit;
      imgEl.style.backgroundPosition = 'center';
      imgEl.style.backgroundRepeat   = this.wallpaperFit === 'center' ? 'no-repeat' : 'no-repeat';
      imgEl.classList.add('visible');
      wallpaperEl.classList.add('has-image');

      // Update live preview
      const lp = document.getElementById('wp-live-preview');
      if (lp) {
        lp.style.backgroundImage = `url(${this.customImageDataURL})`;
        lp.style.backgroundSize  = this.wallpaperFit;
      }
    } else {
      // Gradient preset — apply to desktop body background instead
      const bg = presets[this.currentWallpaper] || presets.default;
      imgEl.style.backgroundImage = bg;
      imgEl.style.backgroundSize  = 'cover';
      imgEl.classList.add('visible');
      wallpaperEl.classList.remove('has-image');

      const lp = document.getElementById('wp-live-preview');
      if (lp) { lp.style.background = bg; }
    }

    // Restore orb colours for gradient presets
    if (!this.customImageDataURL) {
      const orbColors = {
        default:  ['#0055a8','#093080','#1a237e'],
        aurora:   ['#1a472a','#0d3b2a','#2d6a4f'],
        sunset:   ['#0f3460','#533483','#1a1a2e'],
        ocean:    ['#112240','#1d3461','#0a192f'],
        forest:   ['#1b3a2a','#2d5016','#0a1628'],
        midnight: ['#1a0a2e','#0d0d2e','#0a0a0a'],
        dawn:     ['#2e1a0a','#3d1c02','#1a1228'],
        neon:     ['#1a0a2e','#001a33','#0d0d2e'],
      };
      const [c1,c2,c3] = orbColors[this.currentWallpaper]||orbColors.default;
      const o1=document.querySelector('.wp-orb-1');
      const o2=document.querySelector('.wp-orb-2');
      const o3=document.querySelector('.wp-orb-3');
      if(o1)o1.style.background=c1;
      if(o2)o2.style.background=c2;
      if(o3)o3.style.background=c3;
    }
  },

  // ── Fit mode ─────────────────────────────────────────
  setFit(mode) {
    this.wallpaperFit = mode;
    const imgEl = document.getElementById('wallpaper-img');
    if (imgEl) {
      imgEl.style.backgroundSize     = mode === 'center' ? 'auto' : mode;
      imgEl.style.backgroundPosition = 'center';
    }
    // Update button states
    document.querySelectorAll('.wp-fit-btn').forEach(b => {
      b.classList.toggle('active', b.textContent.trim().toLowerCase() === mode);
    });
    // Update live preview
    const lp = document.getElementById('wp-live-preview');
    if (lp) lp.style.backgroundSize = mode;
    window.showToast('Fit mode: '+mode, 'info');
  },

  // ── Overlay dim ──────────────────────────────────────
  setDim(v) {
    const overlay = document.getElementById('wallpaper-overlay');
    if (overlay) overlay.style.background = `rgba(0,0,0,${v/100})`;
    const lbl = document.getElementById('dim-label');
    if (lbl) lbl.textContent = v + '%';
  },

  // ── Remove custom wallpaper ───────────────────────────
  removeCustomWallpaper() {
    this.customImageDataURL = null;
    this.currentWallpaper   = 'default';
    const imgEl = document.getElementById('wallpaper-img');
    if (imgEl) { imgEl.classList.remove('visible'); imgEl.style.backgroundImage = ''; }
    document.getElementById('wallpaper')?.classList.remove('has-image');
    // Reset orb colours
    const o1=document.querySelector('.wp-orb-1');
    const o2=document.querySelector('.wp-orb-2');
    const o3=document.querySelector('.wp-orb-3');
    if(o1)o1.style.background='#0055a8';
    if(o2)o2.style.background='#093080';
    if(o3)o3.style.background='#1a237e';
    window.showToast('Wallpaper removed', 'info');
    const content = document.getElementById('settings-content');
    if (content && this.currentSection === 'wallpaper') {
      content.innerHTML = this.renderWallpaper();
    }
  },

  // ── Theme ────────────────────────────────────────────
  setTheme(mode) {
    const r = document.documentElement;
    r.setAttribute('data-theme', mode);
    if (mode === 'dark') {
      r.style.setProperty('--app-bg',        '#1a2333');
      r.style.setProperty('--app-bg2',        '#1e2a3d');
      r.style.setProperty('--app-surface',    '#243044');
      r.style.setProperty('--app-surface2',   '#1e2a3d');
      r.style.setProperty('--app-border',     '#2e4060');
      r.style.setProperty('--app-border-lt',  '#253550');
      r.style.setProperty('--app-hover',      '#2a3a55');
      r.style.setProperty('--app-active',     '#1e4070');
      r.style.setProperty('--app-text',       '#e0eeff');
      r.style.setProperty('--app-text2',      '#90b8d8');
      r.style.setProperty('--app-text3',      '#5a80a0');
      window.showToast('Dark mode enabled', 'success');
    } else {
      r.style.setProperty('--app-bg',        '#eef4fd');
      r.style.setProperty('--app-bg2',        '#e4eefa');
      r.style.setProperty('--app-surface',    '#ffffff');
      r.style.setProperty('--app-surface2',   '#f5f9ff');
      r.style.setProperty('--app-border',     '#c5d8ef');
      r.style.setProperty('--app-border-lt',  '#d8e8f8');
      r.style.setProperty('--app-hover',      '#dceefa');
      r.style.setProperty('--app-active',     '#c8e0f8');
      r.style.setProperty('--app-text',       '#0b1929');
      r.style.setProperty('--app-text2',      '#2e5278');
      r.style.setProperty('--app-text3',      '#6a8faf');
      window.showToast('Light mode enabled', 'info');
    }
    // Re-render to update checkmarks
    const content = document.getElementById('settings-content');
    if (content && this.currentSection === 'personalisation') {
      content.innerHTML = this.renderPersonalisation();
    }
  },

  setAccent(c) {
    document.documentElement.style.setProperty('--app-accent',   c);
    document.documentElement.style.setProperty('--blue-primary', c);
    window.showToast('Accent colour updated', 'success');
  },

  setFontSize(v) {
    document.querySelectorAll('.window-body').forEach(el => el.style.fontSize = v+'px');
    const lbl = document.getElementById('fs-label');
    if (lbl) lbl.textContent = v+'px';
  },

  setAnimSpeed(s) {
    const d = {fast:'.1s',normal:'.22s',slow:'.5s'}[s]||'.22s';
    document.documentElement.style.setProperty('--anim-speed', d);
    window.showToast('Animation: '+s, 'info');
  },

  toggleClock(v) {
    const el = document.querySelector('.tray-clock');
    if (el) el.style.display = v ? '' : 'none';
    window.showToast('Clock '+(v?'shown':'hidden'), 'info');
  },

  toggleSearch(v) {
    const el = document.querySelector('.taskbar-search');
    if (el) el.style.display = v ? '' : 'none';
    window.showToast('Search '+(v?'shown':'hidden'), 'info');
  },

  toggleToasts(v) {
    if (!v) {
      window._origToast = window._origToast || window.showToast;
      window.showToast  = () => {};
    } else {
      if (window._origToast) window.showToast = window._origToast;
    }
    const fn = window._origToast || window.showToast;
    fn('Notifications '+(v?'enabled':'disabled'), 'info');
  },

  resetAll() {
    this.setTheme('light');
    this.setAccent('#0078d4');
    this.removeCustomWallpaper();
    document.querySelectorAll('.window-body').forEach(el => el.style.fontSize = '');
    const overlay = document.getElementById('wallpaper-overlay');
    if (overlay) overlay.style.background = 'rgba(0,0,0,0)';
    window.showToast('Settings reset to defaults', 'info');
    const content = document.getElementById('settings-content');
    if (content) content.innerHTML = this.renderSection(this.currentSection);
  },

  init() {}
};