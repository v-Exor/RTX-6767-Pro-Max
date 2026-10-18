# RTX-6767-Pro-Max

A Windows-inspired desktop and operating system simulator built with **JavaScript, HTML, and CSS**. Explore operating system concepts through an interactive browser desktop.

[**Launch the simulator ↗**](https://v-exor.github.io/RTX-6767-Pro-Max/) · [Developer profile](https://github.com/v-Exor)

Use the demonstration password shown on the simulator's login screen (`1234`).

## Features

- **Desktop and window manager:** draggable and resizable app windows, minimize/maximize controls, a taskbar, and a searchable Start menu.
- **CPU scheduler:** First-Come, First-Served, Round Robin, and Shortest Job First, with Gantt charts and waiting/turnaround results.
- **Task and memory tools:** process management, fixed memory partitions, allocation controls, and usage visualizations.
- **Virtual file system:** file/folder navigation and creation inside the simulated environment.
- **Desktop utilities:** terminal, printer spooler, paint application, calculator, and settings.

This is an educational simulation running in a browser. Processes, memory, and files belong to the simulation; it does not run or manage the host operating system.

## Run locally

Clone this repository and serve its directory with a static web server, for example:

```sh
python -m http.server 8000
```

Open `http://localhost:8000/`. No package installation or build step is required.

## Code organization

| Files | Responsibility |
| :--- | :--- |
| `index.html`, `index.js` | Entry and boot interface |
| `desktop.html`, `desktop.js` | Desktop, application registry, and window interactions |
| `os-state.js` | Shared simulated operating system state |
| `cpu-scheduler.js`, `process-manager.js`, `memory-manager.js` | Scheduling, processes, and memory tools |
| `file-system.js`, `io-simulator.js`, `terminal.js` | Virtual file system, I/O simulation, and terminal |
| `paint-app.js`, `calculator-app.js`, `settings-app.js` | Desktop utilities |
| `style.css` | Application styling and transitions |
