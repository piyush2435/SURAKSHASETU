/* ============================================
   SURAKSHA SETU — OTP Module
   ============================================ */

const OTP = (() => {

  const KEY = 'suraksha_otp_pending';
  const TTL_MS = 2 * 60 * 1000;
  const MAX_ATTEMPTS = 3;

  function maskMobile(mobile) {
    if (!mobile || mobile.length < 6) return mobile;
    return mobile.slice(0, 2) + 'X'.repeat(mobile.length - 4) + mobile.slice(-2);
  }

  function generate() {
    return String(Math.floor(100000 + Math.random() * 900000));
  }

  function send(sessionUser, mobile) {
    const code = generate();
    const record = {
      userId: sessionUser.userId,
      role: sessionUser.role,
      mobile,
      code,
      createdAt: Date.now(),
      expiresAt: Date.now() + TTL_MS,
      attempts: 0,
      verified: false
    };
    Storage.saveData(KEY, record);
    console.log(`[OTP DEMO] Code for ${mobile}: ${code}`);
    return code;
  }

  function getPending() { return Storage.getData(KEY, null); }

  function clear() { Storage.removeData(KEY); }

  function isExpired(record) {
    return !record || Date.now() > record.expiresAt;
  }

  function verify(enteredCode) {
    const record = getPending();
    if (!record) return { ok: false, reason: 'No OTP request found. Please login again.' };
    if (isExpired(record)) {
      clear();
      return { ok: false, reason: 'OTP expired. Please request a new one.' };
    }
    if (record.attempts >= MAX_ATTEMPTS) {
      clear();
      return { ok: false, reason: 'Too many failed attempts. Please login again.' };
    }
    if (String(enteredCode).trim() !== record.code) {
      record.attempts += 1;
      Storage.saveData(KEY, record);
      const remaining = MAX_ATTEMPTS - record.attempts;
      return { ok: false, reason: `Incorrect OTP. ${remaining} attempt(s) left.` };
    }
    record.verified = true;
    Storage.saveData(KEY, record);
    return { ok: true };
  }

  return { send, getPending, verify, clear, isExpired, maskMobile };
})();