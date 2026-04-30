// ============================================================
// CloudOS — Terminal App (terminal.js)
// ============================================================

window.TerminalApp = {
  history: [],
  historyIndex: -1,

  getHTML() {
    return `
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;flex-shrink:0;">
        <span class="app-title" style="font-size:14px;">⌨ CloudOS Terminal</span>
        <button class="mini-btn kill" onclick="TerminalApp.clearTerminal()">Clear</button>
      </div>
      <div class="terminal-body">
        <div class="terminal-output" id="term-output">
          <div class="t-line t-header">CloudOS Terminal v1.0.0</div>
          <div class="t-line t-info">Type 'help' for available commands.</div>
          <div class="t-line">&nbsp;</div>
        </div>
        <div class="terminal-input-row">
          <span class="t-prompt-symbol">user@CloudOS:~$</span>
          <input type="text" class="terminal-input" id="term-input"
            placeholder="Enter command..."
            onkeydown="TerminalApp.handleKey(event)"
            autocomplete="off" spellcheck="false"/>
        </div>
      </div>
    `;
  },

  init() {
    setTimeout(() => {
      document.getElementById('term-input')?.focus();
    }, 100);
  },

  handleKey(e) {
    if (e.key === 'Enter') {
      const input = e.target.value.trim();
      if (input) {
        this.history.unshift(input);
        this.historyIndex = -1;
        this.execute(input);
        e.target.value = '';
      }
    } else if (e.key === 'ArrowUp') {
      if (this.historyIndex < this.history.length - 1) {
        this.historyIndex++;
        e.target.value = this.history[this.historyIndex];
      }
      e.preventDefault();
    } else if (e.key === 'ArrowDown') {
      if (this.historyIndex > 0) {
        this.historyIndex--;
        e.target.value = this.history[this.historyIndex];
      } else {
        this.historyIndex = -1;
        e.target.value = '';
      }
      e.preventDefault();
    }
  },

  execute(cmd) {
    this.print(`user@CloudOS:~$ ${cmd}`, 't-prompt');
    const parts = cmd.toLowerCase().split(' ');
    const base = parts[0];
    const args = parts.slice(1);

    switch (base) {
      case 'help':
        this.cmdHelp(); break;
      case 'ps':
        this.cmdPS(); break;
      case 'top':
        this.cmdTop(); break;
      case 'kill':
        this.cmdKill(args[0]); break;
      case 'spawn':
        this.cmdSpawn(args.slice(0).join(' ')); break;
      case 'mem':
      case 'free':
        this.cmdMem(); break;
      case 'ls':
        this.cmdLS(args[0]); break;
      case 'cat':
        this.cmdCat(args[0]); break;
      case 'touch':
        this.cmdTouch(args[0]); break;
      case 'rm':
        this.cmdRM(args[0]); break;
      case 'mkdir':
        this.cmdMkdir(args[0]); break;
      case 'pwd':
        this.print('/home/user', 't-response'); break;
      case 'clear':
        this.clearTerminal(); break;
      case 'date':
        this.print(new Date().toString(), 't-response'); break;
      case 'uname':
        this.cmdUname(args); break;
      case 'print':
        this.cmdPrint(args.slice(0).join(' ')); break;
      case 'sched':
        this.cmdSched(args[0]); break;
      case 'uptime':
        this.cmdUptime(); break;
      case 'whoami':
        this.print('user (CloudOS Simulator)', 't-response'); break;
      case 'echo':
        this.print(args.join(' '), 't-response'); break;
      case 'history':
        this.cmdHistory(); break;
      default:
        this.print(`bash: ${base}: command not found`, 't-error');
        this.print(`Type 'help' for available commands.`, 't-info');
    }
    this.print('', 't-response');
    this.scrollToBottom();
  },

  cmdHelp() {
    const cmds = [
      ['help',           'Show this help message'],
      ['ps',             'List all processes'],
      ['top',            'Show CPU/memory usage'],
      ['kill <pid>',     'Terminate a process by PID'],
      ['spawn [name]',   'Create a new process'],
      ['free',           'Show memory usage'],
      ['ls [path]',      'List directory contents'],
      ['cat <filename>', 'Display file contents'],
      ['touch <name>',   'Create an empty file'],
      ['rm <name>',      'Delete a file'],
      ['mkdir <name>',   'Create a directory'],
      ['pwd',            'Print working directory'],
      ['echo [text]',    'Print text'],
      ['print [doc]',    'Send document to printer'],
      ['sched [algo]',   'Show/set scheduler algorithm'],
      ['uname [-a]',     'System information'],
      ['date',           'Show current date/time'],
      ['uptime',         'Show system uptime'],
      ['whoami',         'Current user'],
      ['history',        'Command history'],
      ['clear',          'Clear terminal'],
    ];
    this.print('Available Commands:', 't-header');
    cmds.forEach(([c, d]) => {
      this.printRaw(`  <span class="t-success">${c.padEnd(20)}</span><span class="t-info">${d}</span>`);
    });
  },

  cmdPS() {
    this.print('PID    NAME                STATE        CPU%   MEM', 't-header');
    this.print('─'.repeat(55), 't-info');
    OSState.processes.forEach(p => {
      const stateColor = { Running:'t-success', Ready:'t-response', Waiting:'t-info', Terminated:'t-error' }[p.state] || 't-response';
      this.printRaw(`  <span style="font-family:monospace;">${String(p.pid).padEnd(7)}</span><span>${p.name.padEnd(20)}</span><span class="${stateColor}">${p.state.padEnd(13)}</span><span>${String(p.cpu+'%').padEnd(7)}</span><span>${p.memory}MB</span>`);
    });
    this.print(`Total: ${OSState.processes.filter(p=>p.state!=='Terminated').length} active processes`, 't-info');
  },

  cmdTop() {
    const running = OSState.processes.filter(p => p.state === 'Running');
    const totalCPU = running.reduce((s, p) => s + p.cpu, 0);
    this.print('=== System Status ===', 't-header');
    this.print(`CPU Usage:    ${Math.round(totalCPU)}%`, 't-response');
    this.print(`Memory:       ${OSState.usedMemory}MB / ${OSState.totalMemory}MB (${Math.round(OSState.usedMemory/OSState.totalMemory*100)}%)`, 't-response');
    this.print(`Processes:    ${OSState.processes.filter(p=>p.state!=='Terminated').length} active`, 't-response');
    this.print(`Running:      ${running.length}`, 't-success');
    this.print(`Waiting:      ${OSState.processes.filter(p=>p.state==='Waiting').length}`, 't-info');
    this.print(`Print Queue:  ${OSState.printerQueue.length} job(s)`, 't-response');
  },

  cmdKill(pidStr) {
    const pid = parseInt(pidStr);
    if (isNaN(pid)) { this.print('Usage: kill <pid>', 't-error'); return; }
    const proc = OSState.getProcess(pid);
    if (!proc) { this.print(`kill: (${pid}) - No such process`, 't-error'); return; }
    if (pid <= 1001) { this.print(`kill: (${pid}) - Operation not permitted (system process)`, 't-error'); return; }
    proc.state = 'Terminated';
    proc.cpu = 0;
    this.print(`Process ${pid} (${proc.name}) terminated.`, 't-success');
    window.showToast(`Killed: ${proc.name}`, 'warning');
  },

  cmdSpawn(name) {
    const pname = name || 'terminal-process-' + Math.floor(Math.random()*100);
    const proc = OSState.addProcess(pname);
    this.print(`Created process: ${pname} (PID ${proc.pid})`, 't-success');
    window.showToast(`Spawned: ${pname}`, 'success');
  },

  cmdMem() {
    const total = OSState.totalMemory;
    const used = OSState.usedMemory;
    const free = OSState.freeMemory;
    this.print('              total        used        free', 't-header');
    this.print(`Mem:       ${String(total+'MB').padEnd(12)}${String(used+'MB').padEnd(12)}${free}MB`, 't-response');
    this.print('', 't-response');
    this.print('Partition Details:', 't-header');
    OSState.memoryPartitions.forEach(p => {
      const bar = '█'.repeat(Math.round(p.used/p.size * 10)) + '░'.repeat(10 - Math.round(p.used/p.size * 10));
      const proc = p.process ? p.process : 'FREE';
      this.print(`  ${p.id} [${bar}] ${p.used}/${p.size}MB  ${proc}`, 't-response');
    });
  },

  cmdLS(path) {
    const p = path ? (path.startsWith('/') ? path : '/home/user/' + path) : '/home/user';
    const node = OSState.fileSystem[p];
    if (!node || node.type !== 'dir') { this.print(`ls: cannot access '${path || '/home/user'}': No such directory`, 't-error'); return; }
    if (node.children.length === 0) { this.print('(empty directory)', 't-info'); return; }
    node.children.forEach(name => {
      const childPath = p.replace(/\/$/, '') + '/' + name;
      const child = OSState.fileSystem[childPath];
      if (!child) return;
      const isDir = child.type === 'dir';
      const size = isDir ? '      ' : String((child.size || 0) + 'B').padEnd(6);
      const color = isDir ? 't-info' : 't-response';
      this.printRaw(`  <span class="${color}">${size}  ${name}${isDir ? '/' : ''}</span>`);
    });
  },

  cmdCat(filename) {
    if (!filename) { this.print('Usage: cat <filename>', 't-error'); return; }
    const path = '/home/user/' + filename;
    const node = OSState.fileSystem[path];
    if (!node) { this.print(`cat: ${filename}: No such file`, 't-error'); return; }
    if (node.type === 'dir') { this.print(`cat: ${filename}: Is a directory`, 't-error'); return; }
    (node.content || '(empty)').split('\n').forEach(line => this.print(line, 't-response'));
  },

  cmdTouch(filename) {
    if (!filename) { this.print('Usage: touch <filename>', 't-error'); return; }
    const path = '/home/user/' + filename;
    if (OSState.fileSystem[path]) { this.print(`Updated timestamp: ${filename}`, 't-info'); return; }
    OSState.fileSystem[path] = { type:'file', name:filename, size:0, content:'', created:new Date().toLocaleDateString() };
    const dir = OSState.fileSystem['/home/user'];
    if (dir && !dir.children.includes(filename)) dir.children.push(filename);
    this.print(`Created: ${filename}`, 't-success');
  },

  cmdRM(filename) {
    if (!filename) { this.print('Usage: rm <filename>', 't-error'); return; }
    const path = '/home/user/' + filename;
    if (!OSState.fileSystem[path]) { this.print(`rm: ${filename}: No such file`, 't-error'); return; }
    delete OSState.fileSystem[path];
    const dir = OSState.fileSystem['/home/user'];
    if (dir) dir.children = dir.children.filter(c => c !== filename);
    this.print(`Removed: ${filename}`, 't-success');
  },

  cmdMkdir(name) {
    if (!name) { this.print('Usage: mkdir <name>', 't-error'); return; }
    const path = '/home/user/' + name;
    if (OSState.fileSystem[path]) { this.print(`mkdir: ${name}: File exists`, 't-error'); return; }
    OSState.fileSystem[path] = { type:'dir', children:[] };
    const dir = OSState.fileSystem['/home/user'];
    if (dir && !dir.children.includes(name)) dir.children.push(name);
    this.print(`Directory created: ${name}/`, 't-success');
  },

  cmdPrint(docName) {
    const name = docName || 'terminal-document.txt';
    IOSimulatorApp.addCustomJob(name);
    this.print(`Sent to printer: ${name}`, 't-success');
    this.print(`Print queue: ${OSState.printerQueue.length} job(s)`, 't-info');
  },

  cmdSched(algo) {
    if (!algo) {
      this.print('Current scheduler: ' + (CPUSchedulerApp.algorithm || 'FCFS'), 't-response');
      this.print('Available: FCFS, RR, SJF', 't-info');
      return;
    }
    const a = algo.toUpperCase();
    if (!['FCFS','RR','SJF'].includes(a)) { this.print(`Unknown algorithm: ${algo}`, 't-error'); return; }
    CPUSchedulerApp.algorithm = a;
    this.print(`Scheduler set to: ${a}`, 't-success');
  },

  cmdUname(args) {
    if (args.includes('-a')) {
      this.print('CloudOS 1.0.0 #1 SMP (Simulated) x86_64 CloudOS', 't-response');
    } else {
      this.print('CloudOS', 't-response');
    }
  },

  cmdUptime() {
    const upMs = Date.now() - (window._bootTime || Date.now());
    const upSec = Math.floor(upMs / 1000);
    const m = Math.floor(upSec / 60);
    const s = upSec % 60;
    const running = OSState.processes.filter(p => p.state === 'Running').length;
    this.print(`up ${m}m ${s}s,  load average: ${(Math.random()*2).toFixed(2)}, ${running} processes running`, 't-response');
  },

  cmdHistory() {
    if (this.history.length === 0) { this.print('No history.', 't-info'); return; }
    this.history.slice().reverse().forEach((cmd, i) => {
      this.print(`  ${i+1}  ${cmd}`, 't-response');
    });
  },

  print(text, cls = 't-response') {
    const el = document.getElementById('term-output');
    if (!el) return;
    const div = document.createElement('div');
    div.className = `t-line ${cls}`;
    div.textContent = text;
    el.appendChild(div);
  },

  printRaw(html) {
    const el = document.getElementById('term-output');
    if (!el) return;
    const div = document.createElement('div');
    div.className = 't-line';
    div.innerHTML = html;
    el.appendChild(div);
  },

  scrollToBottom() {
    const el = document.getElementById('term-output');
    if (el) el.scrollTop = el.scrollHeight;
  },

  clearTerminal() {
    const el = document.getElementById('term-output');
    if (el) {
      el.innerHTML = '<div class="t-line t-header">CloudOS Terminal v1.0.0</div><div class="t-line t-info">Terminal cleared. Type \'help\' for commands.</div><div class="t-line">&nbsp;</div>';
    }
  }
};
