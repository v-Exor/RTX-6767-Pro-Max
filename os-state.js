// ============================================================
// CloudOS — Shared OS State (os-state.js)
// ============================================================

window.OSState = {
  // Process Management
  nextPID: 1000,
  processes: [
    { pid: 1000, name: 'System Kernel', state: 'Running',  cpu: 2,  memory: 64,  priority: 0, created: Date.now() - 60000 },
    { pid: 1001, name: 'CloudOS Shell', state: 'Running',  cpu: 5,  memory: 32,  priority: 1, created: Date.now() - 45000 },
    { pid: 1002, name: 'File Manager',  state: 'Ready',    cpu: 0,  memory: 48,  priority: 2, created: Date.now() - 30000 },
    { pid: 1003, name: 'Network Svc',   state: 'Waiting',  cpu: 0,  memory: 16,  priority: 2, created: Date.now() - 20000 },
    { pid: 1004, name: 'Audio Engine',  state: 'Ready',    cpu: 0,  memory: 24,  priority: 3, created: Date.now() - 10000 },
  ],

  // Memory Management — fixed partitions (MB)
  memoryPartitions: [
    { id: 'P1', size: 128, used: 64,  process: 'System Kernel', color: '#0078d4' },
    { id: 'P2', size: 256, used: 80,  process: 'CloudOS Shell', color: '#7b1fa2' },
    { id: 'P3', size: 128, used: 0,   process: null,            color: '#4fc3f7' },
    { id: 'P4', size: 256, used: 64,  process: 'File Manager',  color: '#f57c00' },
    { id: 'P5', size: 128, used: 0,   process: null,            color: '#4fc3f7' },
    { id: 'P6', size: 128, used: 24,  process: 'Network Svc',   color: '#2e7d32' },
  ],

  // File System
  fileSystem: {
    '/': {
      type: 'dir',
      children: ['home', 'sys', 'tmp']
    },
    '/home': {
      type: 'dir',
      children: ['user']
    },
    '/home/user': {
      type: 'dir',
      children: ['readme.txt', 'notes.txt', 'script.js', 'data.json']
    },
    '/home/user/readme.txt': {
      type: 'file',
      name: 'readme.txt',
      size: 1024,
      content: 'Welcome to CloudOS!\n\nThis is an Operating System Simulator.\n\nFeatures:\n- Process Management\n- CPU Scheduling\n- Memory Management\n- File System\n- I/O Simulation\n\nEnjoy exploring!',
      created: new Date(Date.now() - 86400000).toLocaleDateString()
    },
    '/home/user/notes.txt': {
      type: 'file',
      name: 'notes.txt',
      size: 512,
      content: 'CloudOS Notes\n==============\n\nTODO:\n- Implement virtual memory\n- Add process scheduling improvements\n- Optimize file I/O\n\nCompleted:\n- Basic process management\n- FCFS & Round Robin scheduling\n- Fixed memory partitions\n- Basic file operations',
      created: new Date(Date.now() - 3600000).toLocaleDateString()
    },
    '/home/user/script.js': {
      type: 'file',
      name: 'script.js',
      size: 256,
      content: '// CloudOS automation script\nfunction greet(name) {\n  console.log("Hello, " + name + "!");\n}\n\ngreet("CloudOS");\ngreet("World");',
      created: new Date(Date.now() - 7200000).toLocaleDateString()
    },
    '/home/user/data.json': {
      type: 'file',
      name: 'data.json',
      size: 320,
      content: '{\n  "os": "CloudOS",\n  "version": "1.0.0",\n  "author": "CloudOS Team",\n  "features": [\n    "Process Management",\n    "CPU Scheduling",\n    "Memory Management",\n    "File System",\n    "I/O Simulation"\n  ]\n}',
      created: new Date().toLocaleDateString()
    },
    '/sys': {
      type: 'dir',
      children: ['kernel.sys', 'drivers.sys']
    },
    '/sys/kernel.sys': {
      type: 'file',
      name: 'kernel.sys',
      size: 4096,
      content: '[CloudOS Kernel Binary]\nVersion: 1.0.0\nBuild: 20250101\n(Binary content not displayable)',
      created: new Date(Date.now() - 172800000).toLocaleDateString()
    },
    '/sys/drivers.sys': {
      type: 'file',
      name: 'drivers.sys',
      size: 2048,
      content: '[Device Drivers]\n- Display Driver v1.0\n- Network Driver v2.1\n- Audio Driver v1.5\n- Storage Driver v3.0',
      created: new Date(Date.now() - 172800000).toLocaleDateString()
    },
    '/tmp': {
      type: 'dir',
      children: []
    }
  },

  // I/O — Printer queue
  printerQueue: [],
  printerBusy: false,
  printerJobId: 1,

  // CPU Scheduling history
  schedulerHistory: [],

  // Helper — get all processes
  getProcess(pid) {
    return this.processes.find(p => p.pid === pid);
  },

  // Helper — add process
  addProcess(name) {
    const proc = {
      pid: ++this.nextPID,
      name,
      state: 'Ready',
      cpu: 0,
      memory: Math.floor(Math.random() * 48) + 16,
      priority: Math.floor(Math.random() * 5),
      created: Date.now()
    };
    this.processes.push(proc);
    return proc;
  },

  // Total memory
  get totalMemory() {
    return this.memoryPartitions.reduce((s, p) => s + p.size, 0);
  },
  get usedMemory() {
    return this.memoryPartitions.reduce((s, p) => s + p.used, 0);
  },
  get freeMemory() {
    return this.totalMemory - this.usedMemory;
  }
};
