/* ============================================
   SURAKSHA SETU — Storage Module
   ============================================ */

const Storage = (() => {

  const KEYS = {
    STUDENTS:         'suraksha_students',
    USERS:            'suraksha_users',
    BUSES:            'suraksha_buses',
    REPORTS:          'suraksha_reports',
    JOURNEYS:         'suraksha_journeys',
    NOTIFICATIONS:    'suraksha_notifications',
    BUS_LOCATION:     'suraksha_current_bus_location',
    SESSION:          'suraksha_session',
    SEEDED:           'suraksha_seeded',
    OTP:              'suraksha_otp_pending',
    SIM_STATE:        'suraksha_sim_state',
    SERVICES:         'suraksha_services',
    EMERGENCY_ALERTS: 'suraksha_emergency_alerts'
  };

  function saveData(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); return true; }
    catch (e) { console.error('Storage.saveData error:', e); return false; }
  }

  function getData(key, fallback = null) {
    try {
      const raw = localStorage.getItem(key);
      if (raw === null) return fallback;
      return JSON.parse(raw);
    } catch (e) { console.error('Storage.getData error:', e); return fallback; }
  }

  function removeData(key) { localStorage.removeItem(key); }

  function updateData(key, predicate, updates) {
    const arr = getData(key, []);
    const idx = arr.findIndex(predicate);
    if (idx === -1) return false;
    arr[idx] = { ...arr[idx], ...updates };
    saveData(key, arr);
    return true;
  }

  function appendData(key, item) {
    const arr = getData(key, []);
    arr.push(item);
    saveData(key, arr);
    return item;
  }

  function deleteData(key, predicate) {
    const arr = getData(key, []);
    const filtered = arr.filter(x => !predicate(x));
    saveData(key, filtered);
    return arr.length !== filtered.length;
  }

  function clearAll() { Object.values(KEYS).forEach(k => localStorage.removeItem(k)); }

  return { KEYS, saveData, getData, removeData, updateData, appendData, deleteData, clearAll };
})();