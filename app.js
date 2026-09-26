/* ============================================
   SURAKSHA SETU — App Entry (Splash + Login)
   ============================================ */

document.addEventListener('DOMContentLoaded', () => {
  DemoData.seedIfEmpty();

  // Show emergency banner if there are active alerts
  renderEmergencyBanner();

  // If already logged in → skip splash and go to dashboard
  const session = Utils.currentSession();
  if (session && session.role) {
    Auth.redirectToDashboard(session.role);
    return;
  }

  // Wire splash → login transition
  setupSplashNavigation();

  // Initialize auth (bind login form events)
  Auth.initLoginPage();
});

/* ============================================
   Splash ↔ Login screen switching
   ============================================ */
function setupSplashNavigation() {
  const splash = document.getElementById('splashScreen');
  const loginScreen = document.getElementById('loginScreen');
  const getStartedBtn = document.getElementById('getStartedBtn');
  const backBtn = document.getElementById('backToSplashBtn');

  if (!splash || !loginScreen) return;

  // Initially show splash, hide login
  splash.style.display = 'flex';
  loginScreen.style.display = 'none';

  // Get Started → fade splash out, show login
  getStartedBtn.addEventListener('click', () => {
    splash.classList.add('hide-anim');

    setTimeout(() => {
      splash.style.display = 'none';
      splash.classList.remove('hide-anim');
      loginScreen.style.display = 'block';
      window.scrollTo({ top: 0, behavior: 'smooth' });

      // Focus user ID field
      const userIdInput = document.getElementById('userId');
      if (userIdInput) setTimeout(() => userIdInput.focus(), 250);
    }, 350);
  });

  // Back → hide login, show splash
  if (backBtn) {
    backBtn.addEventListener('click', () => {
      loginScreen.style.display = 'none';
      splash.style.display = 'flex';
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }
}

/* ============================================
   Emergency banner on the splash/login screens
   ============================================ */
function renderEmergencyBanner() {
  // There are two possible banner spots:
  // 1. Inside the splash (splashEmergency)
  // 2. Inside the login screen (emergencyBanner)

  const alerts = Emergency.getActive();
  if (!alerts.length) return;

  const first = alerts[0];
  const more = alerts.length > 1 ? ` (+${alerts.length - 1} more)` : '';

  const html = `
    <i class="fa-solid fa-tower-broadcast"></i>
    <div class="${'sp-emg-body'}">
      <div class="${'sp-emg-title'}">
        🚨 Active Emergency${alerts.length > 1 ? 's' : ''}
      </div>
      <div class="${'sp-emg-text'}">
        ${Utils.escapeHtml(first.emergencyType)} on Bus ${Utils.escapeHtml(first.busNumber)} — ${Utils.timeAgo(first.time)}${more}
      </div>
    </div>
  `;

  // Splash banner
  const splashBanner = document.getElementById('splashEmergency');
  if (splashBanner) {
    splashBanner.style.display = 'flex';
    splashBanner.innerHTML = html;
  }

  // Login banner (reuses the emergency-top-banner styling)
  const loginBanner = document.getElementById('emergencyBanner');
  if (loginBanner) {
    loginBanner.style.display = 'flex';
    loginBanner.innerHTML = `
      <i class="fa-solid fa-tower-broadcast banner-icon"></i>
      <div class="banner-body">
        <div class="banner-title">🚨 Active Emergency${alerts.length > 1 ? 's' : ''}</div>
        <div class="banner-text">
          ${Utils.escapeHtml(first.emergencyType)} on Bus ${Utils.escapeHtml(first.busNumber)} — ${Utils.timeAgo(first.time)}${more}
        </div>
      </div>
      <div class="banner-count">${alerts.length} alert${alerts.length > 1 ? 's' : ''}</div>
      <button type="button" class="banner-close" onclick="this.parentElement.style.display='none'">
        <i class="fa-solid fa-xmark"></i>
      </button>`;
  }

  document.body.classList.add('has-emergency-banner');
}