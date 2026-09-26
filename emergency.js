/* ============================================
   SURAKSHA SETU — Emergency Services Dispatch
   ============================================ */

const Emergency = (() => {

  const EARTH_RADIUS_KM = 6371;

  /* Haversine distance in km */
  function distanceKm(a, b) {
    const toRad = deg => deg * Math.PI / 180;
    const dLat = toRad(b.lat - a.lat);
    const dLng = toRad(b.lng - a.lng);
    const lat1 = toRad(a.lat);
    const lat2 = toRad(b.lat);
    const h = Math.sin(dLat / 2) ** 2 +
              Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
    return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(h));
  }

  /* Find closest service of a type */
  function findNearest(type, location) {
    const all = Storage.getData(Storage.KEYS.SERVICES, [])
      .filter(s => s.type === type);
    if (!all.length) return null;

    let best = null;
    let bestDist = Infinity;
    all.forEach(s => {
      const d = distanceKm(location, s.location);
      if (d < bestDist) { bestDist = d; best = { ...s, distanceKm: d }; }
    });
    return best;
  }

  /* Emergency type → services to notify */
  function servicesFor(emergencyType) {
    const map = {
      'Accident':            ['hospital', 'police'],
      'Medical Emergency':   ['hospital'],
      'Fire':                ['hospital', 'police'],
      'Bus Breakdown':       ['police'],
      'Road Block':          ['police'],
      'Suspicious Activity': ['police'],
      'Theft':               ['police'],
      'Other':               ['police']
    };
    return map[emergencyType] || ['police'];
  }

  /* Simulate sending to a station */
  function simulateDispatch(service, alert) {
    const dispatchedAt = new Date().toISOString();
    const referenceId = 'EMG-' + Math.random().toString(36).slice(2, 8).toUpperCase();
    console.log(`[EMERGENCY DEMO] Sent to ${service.name} (${service.phone})`, {
      referenceId, alert
    });
    return { dispatchedAt, referenceId };
  }

  /* Main: raise an emergency */
  function raise({
    emergencyType, message, busNumber, driverId, driverName, location
  }) {
    if (!emergencyType || !location) {
      return { ok: false, error: 'Missing emergencyType or location' };
    }

    const wantedTypes = servicesFor(emergencyType);
    const notified = [];

    wantedTypes.forEach(type => {
      const nearest = findNearest(type, location);
      if (!nearest) return;

      const { dispatchedAt, referenceId } = simulateDispatch(nearest, {
        emergencyType, message, busNumber, location
      });

      notified.push({
        serviceId: nearest.id,
        serviceName: nearest.name,
        serviceType: nearest.type,
        servicePhone: nearest.phone,
        emergencyPhone: nearest.emergencyPhone,
        distanceKm: Number(nearest.distanceKm.toFixed(2)),
        referenceId, dispatchedAt,
        responseStatus: 'dispatched'
      });
    });

    const alert = {
      id: Utils.uid('emg'),
      emergencyType, message, busNumber, driverId, driverName, location,
      time: new Date().toISOString(),
      status: 'active',
      notifiedServices: notified
    };

    Storage.appendData(Storage.KEYS.EMERGENCY_ALERTS, alert);

    /* Notify admin */
    Notifications.push('admin',
      `🚨 EMERGENCY: ${emergencyType} on ${busNumber}. Notified ${notified.length} service(s).`,
      'error');

    /* Notify parents of students on that bus */
    const students = Storage.getData(Storage.KEYS.STUDENTS, [])
      .filter(s => s.busNumber === busNumber);
    students.forEach(s => {
      Notifications.push(s.parentUserId,
        `🚨 EMERGENCY on Bus ${busNumber}: ${emergencyType}. Services dispatched. Help is on the way.`,
        'error');
    });

    return { ok: true, alert };
  }

  function getAll() {
    return Storage.getData(Storage.KEYS.EMERGENCY_ALERTS, [])
      .sort((a, b) => new Date(b.time) - new Date(a.time));
  }

  function getActive() { return getAll().filter(a => a.status === 'active'); }

  function getForBus(busNumber) {
    return getAll().filter(a => a.busNumber === busNumber);
  }

  function resolve(id) {
    return Storage.updateData(Storage.KEYS.EMERGENCY_ALERTS, a => a.id === id,
      { status: 'resolved', resolvedAt: new Date().toISOString() });
  }

  function remove(id) {
    return Storage.deleteData(Storage.KEYS.EMERGENCY_ALERTS, a => a.id === id);
  }

  function getServices(type) {
    const all = Storage.getData(Storage.KEYS.SERVICES, []);
    return type ? all.filter(s => s.type === type) : all;
  }

  return {
    distanceKm, findNearest, raise,
    getAll, getActive, getForBus, resolve, remove, getServices
  };
})();