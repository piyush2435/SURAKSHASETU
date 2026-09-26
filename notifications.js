/* ============================================
   SURAKSHA SETU — Notifications
   ============================================ */

const Notifications = (() => {

  function push(target, message, type = 'info') {
    const notif = {
      id: Utils.uid('notif'),
      target,
      type,
      message,
      time: new Date().toISOString(),
      read: false
    };
    Storage.appendData(Storage.KEYS.NOTIFICATIONS, notif);
    return notif;
  }

  function getFor(target) {
    const all = Storage.getData(Storage.KEYS.NOTIFICATIONS, []);
    return all
      .filter(n => n.target === target || n.target === 'all')
      .sort((a, b) => new Date(b.time) - new Date(a.time));
  }

  function unreadCount(target) {
    return getFor(target).filter(n => !n.read).length;
  }

  function markAllRead(target) {
    const all = Storage.getData(Storage.KEYS.NOTIFICATIONS, []);
    let changed = false;
    all.forEach(n => {
      if ((n.target === target || n.target === 'all') && !n.read) {
        n.read = true; changed = true;
      }
    });
    if (changed) Storage.saveData(Storage.KEYS.NOTIFICATIONS, all);
  }

  return { push, getFor, unreadCount, markAllRead };
})();