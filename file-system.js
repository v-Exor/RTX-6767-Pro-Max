// ============================================================
// CloudOS — File System App (file-system.js)
// ============================================================

window.FileSystemApp = {
  currentPath: '/home/user',
  selectedFile: null,

  getHTML() {
    return `
      <div class="app-header">
        <span class="app-title">📁 File Explorer</span>
      </div>

      <div class="fs-toolbar">
        <button class="app-btn" onclick="FileSystemApp.goUp()">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14" style="vertical-align:middle;margin-right:4px;"><polyline points="15 18 9 12 15 6"/></svg>Up
        </button>
        <button class="app-btn success" onclick="FileSystemApp.showCreateModal()">+ New File</button>
        <button class="app-btn" style="background:rgba(255,255,255,0.1);" onclick="FileSystemApp.showCreateDirModal()">+ New Folder</button>
        <button class="app-btn danger" id="fs-delete-btn" style="display:none;" onclick="FileSystemApp.deleteSelected()">Delete</button>
        <button class="app-btn" id="fs-open-btn" style="display:none;background:var(--blue-bright);" onclick="FileSystemApp.openSelected()">Open</button>
      </div>

      <div class="fs-breadcrumb" id="fs-breadcrumb"></div>

      <div style="display:flex;gap:8px;margin-bottom:8px;border-bottom:1px solid var(--glass-border);padding-bottom:8px;">
        <span style="font-size:11px;color:var(--text-dim);flex:1;">NAME</span>
        <span style="font-size:11px;color:var(--text-dim);width:60px;text-align:right;">SIZE</span>
        <span style="font-size:11px;color:var(--text-dim);width:100px;text-align:right;">MODIFIED</span>
      </div>

      <div class="file-list" id="fs-file-list"></div>

      <div style="margin-top:8px;font-size:11px;color:var(--text-dim);border-top:1px solid var(--glass-border);padding-top:6px;" id="fs-status"></div>
    `;
  },

  init() {
    this.render();
  },

  render() {
    this.renderBreadcrumb();
    this.renderFileList();
    this.updateStatus();
  },

  renderBreadcrumb() {
    const el = document.getElementById('fs-breadcrumb');
    if (!el) return;
    const parts = this.currentPath.split('/').filter(Boolean);
    let path = '';
    const crumbs = ['<span onclick="FileSystemApp.navigate(\'/\')" style="color:var(--blue-light);cursor:pointer;">C:</span>'];
    parts.forEach(p => {
      path += '/' + p;
      const cap = path;
      crumbs.push(`<span onclick="FileSystemApp.navigate('${cap}')" style="color:var(--blue-light);cursor:pointer;">${p}</span>`);
    });
    el.innerHTML = crumbs.join(' <span style="color:var(--text-dim);">›</span> ');
  },

  renderFileList() {
    const el = document.getElementById('fs-file-list');
    if (!el) return;

    const node = OSState.fileSystem[this.currentPath];
    if (!node || node.type !== 'dir') {
      el.innerHTML = '<div class="empty-state">Directory not found.</div>';
      return;
    }

    if (node.children.length === 0) {
      el.innerHTML = '<div class="empty-state">This folder is empty.</div>';
      return;
    }

    el.innerHTML = node.children.map(name => {
      const childPath = this.currentPath.replace(/\/$/, '') + '/' + name;
      const child = OSState.fileSystem[childPath];
      if (!child) return '';

      const isDir = child.type === 'dir';
      const ext = name.split('.').pop();
      const iconClass = isDir ? 'ftype-dir' : (ext === 'js' ? 'ftype-js' : 'ftype-txt');
      const iconSVG = isDir
        ? `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>`
        : `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>`;

      const size = isDir ? '—' : this.formatSize(child.size || 0);
      const date = child.created || '—';
      const selected = this.selectedFile === childPath;

      return `
        <div class="file-item ${selected ? 'selected' : ''}"
          onclick="FileSystemApp.selectFile('${childPath}')"
          ondblclick="FileSystemApp.openItem('${childPath}')">
          <div class="file-icon-sm ${iconClass}">${iconSVG}</div>
          <span class="file-name">${name}${isDir ? '/' : ''}</span>
          <span class="file-size">${size}</span>
          <span class="file-date">${date}</span>
        </div>
      `;
    }).join('');
  },

  selectFile(path) {
    this.selectedFile = path;
    const deleteBtn = document.getElementById('fs-delete-btn');
    const openBtn = document.getElementById('fs-open-btn');
    if (deleteBtn) deleteBtn.style.display = '';
    if (openBtn) openBtn.style.display = '';
    this.renderFileList();
  },

  openItem(path) {
    const node = OSState.fileSystem[path];
    if (!node) return;
    if (node.type === 'dir') {
      this.navigate(path);
    } else {
      this.showFileContent(path, node);
    }
  },

  openSelected() {
    if (this.selectedFile) this.openItem(this.selectedFile);
  },

  navigate(path) {
    this.selectedFile = null;
    this.currentPath = path;
    document.getElementById('fs-delete-btn').style.display = 'none';
    document.getElementById('fs-open-btn').style.display = 'none';
    this.render();
  },

  goUp() {
    const parts = this.currentPath.split('/').filter(Boolean);
    if (parts.length <= 1) {
      this.navigate('/');
    } else {
      parts.pop();
      this.navigate('/' + parts.join('/'));
    }
  },

  showFileContent(path, node) {
    const modal = document.createElement('div');
    modal.className = 'file-modal';
    modal.innerHTML = `
      <div class="file-modal-card" style="width:480px;max-height:70vh;display:flex;flex-direction:column;">
        <h3>📄 ${node.name}</h3>
        <div style="flex:1;overflow:auto;background:rgba(0,0,0,0.3);border-radius:6px;padding:12px;margin-bottom:12px;">
          <pre style="font-family:monospace;font-size:12px;color:var(--text-primary);white-space:pre-wrap;line-height:1.6;">${this.escapeHtml(node.content || '(empty)')}</pre>
        </div>
        <div style="display:flex;justify-content:space-between;align-items:center;">
          <span style="font-size:11px;color:var(--text-dim);">${this.formatSize(node.size || 0)} · ${node.created || 'Unknown'}</span>
          <div class="modal-btns">
            <button class="app-btn" style="background:rgba(255,255,255,0.1);" onclick="this.closest('.file-modal').remove()">Close</button>
            <button class="app-btn success" onclick="FileSystemApp.editFile('${path}',this)">Edit</button>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
  },

  editFile(path, btn) {
    const modal = btn.closest('.file-modal');
    const node = OSState.fileSystem[path];
    if (!node) return;
    const pre = modal.querySelector('pre');
    const textarea = document.createElement('textarea');
    textarea.value = node.content || '';
    textarea.style.cssText = 'width:100%;height:200px;resize:vertical;background:rgba(0,0,0,0.3);border:1px solid var(--glass-border);border-radius:6px;padding:10px;color:var(--text-primary);font-family:monospace;font-size:12px;outline:none;';
    pre.parentNode.replaceChild(textarea, pre);
    btn.textContent = 'Save';
    btn.onclick = () => {
      node.content = textarea.value;
      node.size = textarea.value.length;
      window.showToast(`Saved: ${node.name}`, 'success');
      modal.remove();
    };
  },

  showCreateModal() {
    const modal = document.createElement('div');
    modal.className = 'file-modal';
    modal.innerHTML = `
      <div class="file-modal-card">
        <h3>📄 New File</h3>
        <input type="text" id="new-file-name" placeholder="filename.txt" autofocus/>
        <textarea id="new-file-content" placeholder="File contents (optional)" style="height:100px;"></textarea>
        <div class="modal-btns">
          <button class="app-btn" style="background:rgba(255,255,255,0.1);" onclick="this.closest('.file-modal').remove()">Cancel</button>
          <button class="app-btn success" onclick="FileSystemApp.createFile()">Create</button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
    setTimeout(() => document.getElementById('new-file-name').focus(), 50);
  },

  showCreateDirModal() {
    const name = prompt('Folder name:');
    if (!name) return;
    this.createDirectory(name.trim());
  },

  createFile() {
    const name = document.getElementById('new-file-name').value.trim();
    const content = document.getElementById('new-file-content').value;
    if (!name) { window.showToast('Enter a filename!', 'warning'); return; }

    const path = this.currentPath.replace(/\/$/, '') + '/' + name;
    if (OSState.fileSystem[path]) { window.showToast('File already exists!', 'error'); return; }

    OSState.fileSystem[path] = {
      type: 'file', name, size: content.length,
      content, created: new Date().toLocaleDateString()
    };

    const dirNode = OSState.fileSystem[this.currentPath];
    if (dirNode && !dirNode.children.includes(name)) dirNode.children.push(name);

    document.querySelector('.file-modal')?.remove();
    this.render();
    window.showToast(`Created: ${name}`, 'success');
  },

  createDirectory(name) {
    const path = this.currentPath.replace(/\/$/, '') + '/' + name;
    if (OSState.fileSystem[path]) { window.showToast('Folder already exists!', 'error'); return; }

    OSState.fileSystem[path] = { type: 'dir', children: [] };
    const dirNode = OSState.fileSystem[this.currentPath];
    if (dirNode && !dirNode.children.includes(name)) dirNode.children.push(name);

    this.render();
    window.showToast(`Created folder: ${name}`, 'success');
  },

  deleteSelected() {
    if (!this.selectedFile) return;
    const node = OSState.fileSystem[this.selectedFile];
    if (!node) return;

    const name = this.selectedFile.split('/').pop();
    if (!confirm(`Delete "${name}"?`)) return;

    // Remove from parent
    const dirNode = OSState.fileSystem[this.currentPath];
    if (dirNode) dirNode.children = dirNode.children.filter(c => c !== name);

    // Remove recursively if dir
    if (node.type === 'dir') {
      Object.keys(OSState.fileSystem).forEach(k => {
        if (k.startsWith(this.selectedFile + '/') || k === this.selectedFile) {
          delete OSState.fileSystem[k];
        }
      });
    } else {
      delete OSState.fileSystem[this.selectedFile];
    }

    this.selectedFile = null;
    document.getElementById('fs-delete-btn').style.display = 'none';
    document.getElementById('fs-open-btn').style.display = 'none';
    this.render();
    window.showToast(`Deleted: ${name}`, 'info');
  },

  updateStatus() {
    const el = document.getElementById('fs-status');
    if (!el) return;
    const node = OSState.fileSystem[this.currentPath];
    const count = node?.children?.length || 0;
    const totalSize = node?.children?.reduce((s, name) => {
      const child = OSState.fileSystem[this.currentPath + '/' + name];
      return s + (child?.size || 0);
    }, 0) || 0;
    el.textContent = `${count} item(s) · ${this.formatSize(totalSize)} · Path: ${this.currentPath}`;
  },

  formatSize(bytes) {
    if (bytes < 1024) return bytes + ' B';
    return (bytes / 1024).toFixed(1) + ' KB';
  },

  escapeHtml(str) {
    return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  }
};
