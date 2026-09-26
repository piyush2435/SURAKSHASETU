/* ============================================
   SURAKSHA SETU — Authentication + OTP
   ============================================ */

const Auth = (() => {

  let selectedRole = 'parent';
  let pendingSession = null;
  let resendTimer = null;

  function initLoginPage() {
    const roleBtns = document.querySelectorAll('.role-btn');
    const form = document.getElementById('loginForm');
    const toggle = document.getElementById('togglePassword');
    const passInput = document.getElementById('password');
    const errorEl = document.getElementById('loginError');

    roleBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        roleBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        selectedRole = btn.dataset.role;
        errorEl.textContent = '';
      });
    });

    toggle.addEventListener('click', () => {
      const isPass = passInput.type === 'password';
      passInput.type = isPass ? 'text' : 'password';
      toggle.innerHTML = isPass
        ? '<i class="fa-solid fa-eye-slash"></i>'
        : '<i class="fa-solid fa-eye"></i>';
    });

    const remembered = Storage.getData('suraksha_remember_userid');
    if (remembered) {
      document.getElementById('userId').value = remembered;
      document.getElementById('rememberMe').checked = true;
    }

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      errorEl.textContent = '';
      const userId = document.getElementById('userId').value.trim();
      const password = passInput.value;

      const result = login(userId, password, selectedRole);
      if (!result.success) {
        errorEl.textContent = result.message;
        Utils.toast(result.message, 'error');
        return;
      }

      if (document.getElementById('rememberMe').checked)
        Storage.saveData('suraksha_remember_userid', userId);
      else
        Storage.removeData('suraksha_remember_userid');

      pendingSession = result.user;
      startOTPFlow(result.user);
    });

    initOtpModal();
  }

  function login(userId, password, role) {
    const users = Storage.getData(Storage.KEYS.USERS, []);
    const user = users.find(u => u.userId === userId && u.role === role);

    if (!user) return { success: false, message: `No ${role} account found with that User ID.` };
    if (user.password !== password) return { success: false, message: 'Incorrect password.' };

    return {
      success: true,
      user: {
        userId: user.userId, name: user.name, role: user.role,
        studentId: user.studentId || null,
        busNumber: user.busNumber || null,
        mobile: user.mobile || '9999999999'
      }
    };
  }

  function startOTPFlow(user) {
    const code = OTP.send(user, user.mobile);
    const overlay = document.getElementById('otpOverlay');
    const mobileText = document.getElementById('otpMobileText');
    const demoCode = document.getElementById('otpDemoCode');
    const errorEl = document.getElementById('otpError');

    errorEl.textContent = '';
    mobileText.textContent = '+91-' + OTP.maskMobile(user.mobile);
    demoCode.textContent = code;

    document.querySelectorAll('.otp-inputs input').forEach(inp => {
      inp.value = '';
      inp.classList.remove('filled');
    });
    document.querySelector('.otp-inputs input').focus();

    overlay.classList.add('open');
    startResendTimer();
  }

  function initOtpModal() {
    const inputs = document.querySelectorAll('.otp-inputs input');
    const verifyBtn = document.getElementById('otpVerifyBtn');
    const cancelBtn = document.getElementById('otpCancelBtn');
    const resendLink = document.getElementById('otpResendLink');

    inputs.forEach((inp, idx) => {
      inp.addEventListener('input', (e) => {
        const val = e.target.value.replace(/[^0-9]/g, '');
        e.target.value = val;
        if (val) {
          e.target.classList.add('filled');
          if (idx < inputs.length - 1) inputs[idx + 1].focus();
        } else {
          e.target.classList.remove('filled');
        }
      });

      inp.addEventListener('keydown', (e) => {
        if (e.key === 'Backspace' && !inp.value && idx > 0) inputs[idx - 1].focus();
        if (e.key === 'Enter') verifyBtn.click();
      });

      inp.addEventListener('paste', (e) => {
        e.preventDefault();
        const text = (e.clipboardData || window.clipboardData).getData('text');
        const digits = text.replace(/[^0-9]/g, '').slice(0, 6).split('');
        digits.forEach((d, i) => {
          if (inputs[i]) { inputs[i].value = d; inputs[i].classList.add('filled'); }
        });
        const next = inputs[Math.min(digits.length, 5)];
        if (next) next.focus();
      });
    });

    verifyBtn.addEventListener('click', doVerify);

    cancelBtn.addEventListener('click', () => {
      closeOtpModal();
      pendingSession = null;
      OTP.clear();
      Utils.toast('Login cancelled.', 'info');
    });

    resendLink.addEventListener('click', () => {
      if (resendLink.classList.contains('disabled')) return;
      if (!pendingSession) return;
      const code = OTP.send(pendingSession, pendingSession.mobile);
      document.getElementById('otpDemoCode').textContent = code;
      Utils.toast('New OTP sent.', 'success');
      document.querySelectorAll('.otp-inputs input').forEach(i => {
        i.value = ''; i.classList.remove('filled');
      });
      document.querySelector('.otp-inputs input').focus();
      startResendTimer();
    });
  }

  function doVerify() {
    const inputs = document.querySelectorAll('.otp-inputs input');
    const entered = Array.from(inputs).map(i => i.value).join('');
    const errorEl = document.getElementById('otpError');

    if (entered.length !== 6) {
      errorEl.textContent = 'Please enter all 6 digits.';
      return;
    }

    const result = OTP.verify(entered);
    if (!result.ok) {
      errorEl.textContent = result.reason;
      Utils.toast(result.reason, 'error');
      return;
    }

    const session = { ...pendingSession, loginAt: new Date().toISOString() };
    Storage.saveData(Storage.KEYS.SESSION, session);
    OTP.clear();
    closeOtpModal();
    Utils.toast(`Welcome, ${session.name}!`, 'success');
    setTimeout(() => redirectToDashboard(session.role), 600);
  }

  function closeOtpModal() {
    document.getElementById('otpOverlay').classList.remove('open');
    if (resendTimer) clearInterval(resendTimer);
  }

  function startResendTimer() {
    const link = document.getElementById('otpResendLink');
    const timerEl = document.getElementById('otpTimer');
    let seconds = 30;
    link.classList.add('disabled');

    if (resendTimer) clearInterval(resendTimer);
    resendTimer = setInterval(() => {
      seconds--;
      timerEl.textContent = ` (${seconds}s)`;
      if (seconds <= 0) {
        clearInterval(resendTimer);
        link.classList.remove('disabled');
        timerEl.textContent = '';
      }
    }, 1000);
  }

  function logout() {
    Storage.removeData(Storage.KEYS.SESSION);
    OTP.clear();
    Utils.toast('Logged out successfully.', 'info');
    setTimeout(() => Utils.goTo('index.html'), 400);
  }

  function redirectToDashboard(role) {
    const map = {
      parent: 'parent.html',
      admin:  'admin.html',
      driver: 'driver.html'
    };
    Utils.goTo(map[role] || 'index.html');
  }

  function requireRole(expectedRole) {
    const session = Utils.currentSession();
    if (!session) { Utils.goTo('index.html'); return null; }
    if (session.role !== expectedRole) {
      Utils.toast('Access denied: wrong role.', 'error');
      setTimeout(() => Utils.goTo('index.html'), 800);
      return null;
    }
    return session;
  }

  return { initLoginPage, login, logout, requireRole, redirectToDashboard };
})();