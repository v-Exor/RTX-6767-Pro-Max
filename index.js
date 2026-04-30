// ============================================================
// CloudOS — Login Page Logic (index.js)
// ============================================================

const VALID_PASSWORD = '1234';

// --- Clock ---
function updateLockClock() {
  const now = new Date();
  const h = String(now.getHours()).padStart(2, '0');
  const m = String(now.getMinutes()).padStart(2, '0');
  const days = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
  const months = ['January','February','March','April','May','June','July','August','September','October','November','December'];

  const timeEl = document.getElementById('lockTime');
  const dateEl = document.getElementById('lockDate');
  if (timeEl) timeEl.textContent = `${h}:${m}`;
  if (dateEl) dateEl.textContent = `${days[now.getDay()]}, ${months[now.getMonth()]} ${now.getDate()}`;
}
updateLockClock();
setInterval(updateLockClock, 1000);

// --- Login ---
function attemptLogin() {
  const input = document.getElementById('passwordInput');
  const error = document.getElementById('loginError');
  const val   = input.value;

  if (val === VALID_PASSWORD || val === '') {
    // Success — transition to desktop
    error.textContent = '';
    document.querySelector('.login-card').style.animation = 'fadeSlideIn 0.3s ease reverse forwards';

    // Show loading flash
    const flash = document.createElement('div');
    flash.style.cssText = `
      position: fixed; inset: 0; z-index: 9999;
      background: #0a1628; display: flex;
      align-items: center; justify-content: center;
      animation: bootFade 0.6s ease 0.5s reverse both;
    `;
    flash.innerHTML = `
      <div style="text-align:center">
        <div style="font-family:Rajdhani,sans-serif; font-size:32px; font-weight:600;
             background:linear-gradient(135deg,#4fc3f7,#0078d4);
             -webkit-background-clip:text; -webkit-text-fill-color:transparent;
             letter-spacing:3px; margin-bottom:20px;">CloudOS</div>
        <div style="display:flex;gap:8px;justify-content:center;">
          ${[0,1,2,3,4].map(i => `<span style="
            width:8px;height:8px;background:#0078d4;border-radius:50%;
            display:inline-block;
            animation:dotBounce 1.2s ease-in-out ${i*0.15}s infinite;
          "></span>`).join('')}
        </div>
      </div>
    `;
    document.body.appendChild(flash);

    setTimeout(() => {
      window.location.href = 'desktop.html';
    }, 900);

  } else {
    // Wrong password
    error.textContent = 'Incorrect password. Try: 1234';
    input.value = '';
    input.focus();

    // Shake animation
    const card = document.querySelector('.login-card');
    card.style.animation = 'none';
    requestAnimationFrame(() => {
      card.style.animation = 'shake 0.3s ease';
    });
  }
}

// --- Keyboard ---
document.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') attemptLogin();
});

// --- Power Menu (stub) ---
function showPowerMenu() {
  if (confirm('Shut down CloudOS simulator?')) {
    document.body.innerHTML = `
      <div style="
        width:100vw; height:100vh; background:#000;
        display:flex; align-items:center; justify-content:center;
        font-family:Rajdhani,sans-serif; color:#333; font-size:18px;
        letter-spacing:2px;
      ">SYSTEM OFF</div>
    `;
  }
}

// --- Auto-focus password input after boot splash ---
window.addEventListener('load', () => {
  setTimeout(() => {
    const input = document.getElementById('passwordInput');
    if (input) input.focus();
  }, 3000);
});
