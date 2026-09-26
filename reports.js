/* ============================================
   SURAKSHA SETU — Problem Reports
   ============================================ */

const Reports = (() => {

  function createReport({ busNumber, driverId, driverName, problemType, message, location }) {
    const report = {
      id: Utils.uid('report'),
      busNumber, driverId, driverName, problemType, message, location,
      time: new Date().toISOString(),
      status: 'active'
    };
    Storage.appendData(Storage.KEYS.REPORTS, report);
    Notifications.push('admin',
      `🚨 ${problemType} reported by ${driverName} (${busNumber}).`, 'error');
    return report;
  }

  function getAll() {
    return Storage.getData(Storage.KEYS.REPORTS, [])
      .sort((a, b) => new Date(b.time) - new Date(a.time));
  }

  function getActive() { return getAll().filter(r => r.status === 'active'); }

  function resolve(id) {
    return Storage.updateData(Storage.KEYS.REPORTS, r => r.id === id, { status: 'resolved' });
  }

  function remove(id) {
    return Storage.deleteData(Storage.KEYS.REPORTS, r => r.id === id);
  }

  return { createReport, getAll, getActive, resolve, remove };
})();