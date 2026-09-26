/* ============================================
   SURAKSHA SETU — Map Module (Leaflet)
   ============================================ */

const MapModule = (() => {

  let map = null;
  let layers = [];
  let busMarker = null;
  let animateTimer = null;

  const SCHOOL_LOCATION = { lat: 25.1800, lng: 75.8500 };

  function init(elementId, center = { lat: 25.2138, lng: 75.8648 }) {
    const el = document.getElementById(elementId);
    if (!el) return null;

    if (map && map._container && map._container.id === elementId) return map;

    if (map) { map.remove(); map = null; }
    layers = []; busMarker = null;

    map = L.map(elementId, { zoomControl: true, scrollWheelZoom: true })
      .setView([center.lat, center.lng], 14);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19, attribution: '&copy; OpenStreetMap'
    }).addTo(map);

    return map;
  }

  function busIcon() {
    return L.divIcon({
      className: 'custom-map-icon',
      html: `<div style="width:40px;height:40px;border-radius:50%;
        background:#ea580c;color:#fff;display:grid;place-items:center;
        box-shadow:0 4px 14px rgba(234,88,12,0.5);border:3px solid #fff;
        font-size:16px;animation:pulseBus 1.6s infinite;">
        <i class="fa-solid fa-bus"></i></div>`,
      iconSize: [40, 40], iconAnchor: [20, 20]
    });
  }

  function stopIcon(picked, isPickup) {
    const color = picked ? '#16a34a' : '#94a3b8';
    const icon = picked ? 'fa-check' : (isPickup ? 'fa-house' : 'fa-flag-checkered');
    return L.divIcon({
      className: 'custom-map-icon',
      html: `<div style="width:30px;height:30px;border-radius:50%;
        background:${color};color:#fff;display:grid;place-items:center;
        box-shadow:0 3px 10px rgba(0,0,0,0.35);border:3px solid #fff;font-size:12px;">
        <i class="fa-solid ${icon}"></i></div>`,
      iconSize: [30, 30], iconAnchor: [15, 15]
    });
  }

  function schoolIcon() {
    return L.divIcon({
      className: 'custom-map-icon',
      html: `<div style="width:36px;height:36px;border-radius:10px;
        background:#1e3a8a;color:#fff;display:grid;place-items:center;
        box-shadow:0 4px 12px rgba(30,58,138,0.4);border:3px solid #fff;font-size:14px;">
        <i class="fa-solid fa-school"></i></div>`,
      iconSize: [36, 36], iconAnchor: [18, 18]
    });
  }

  function clearLayers() {
    layers.forEach(l => { if (l && map) map.removeLayer(l); });
    layers = []; busMarker = null;
  }

  function drawBusRoute({ busNumber, students, busLocation, school }) {
    if (!map) return;
    clearLayers();

    const schoolLoc = school || SCHOOL_LOCATION;
    const pathPoints = [];

    students.forEach(s => {
      if (!s.pickupLocation) return;
      const picked = s.status === 'boarded' || s.status === 'dropped';
      const marker = L.marker([s.pickupLocation.lat, s.pickupLocation.lng],
        { icon: stopIcon(picked, true) }).addTo(map);
      marker.bindPopup(`
        <div style="font-family:Segoe UI,sans-serif;font-size:13px;min-width:170px;">
          <strong>${Utils.escapeHtml(s.name)}</strong><br>
          <span style="color:#64748b;">${Utils.escapeHtml(s.id)} · ${Utils.escapeHtml(s.className)}</span><br>
          <span style="display:inline-block;margin-top:6px;padding:2px 8px;border-radius:999px;
            background:${picked ? '#dcfce7' : '#e2e8f0'};
            color:${picked ? '#166534' : '#475569'};
            font-weight:700;font-size:11px;text-transform:uppercase;">
            ${picked ? '✅ Picked' : '⏳ Waiting'}</span></div>`);
      layers.push(marker);
      pathPoints.push([s.pickupLocation.lat, s.pickupLocation.lng]);
    });

    const schoolMarker = L.marker([schoolLoc.lat, schoolLoc.lng],
      { icon: schoolIcon() }).addTo(map).bindPopup('<strong>School</strong>');
    layers.push(schoolMarker);
    pathPoints.push([schoolLoc.lat, schoolLoc.lng]);

    if (busLocation) {
      busMarker = L.marker([busLocation.lat, busLocation.lng],
        { icon: busIcon(), zIndexOffset: 1000 }).addTo(map)
        .bindPopup(`<strong>Bus ${Utils.escapeHtml(busNumber || '')}</strong>`);
      layers.push(busMarker);
      pathPoints.push([busLocation.lat, busLocation.lng]);
    }

    if (pathPoints.length > 1) {
      const line = L.polyline(pathPoints, {
        color: '#3b5bdb', weight: 3, opacity: 0.55, dashArray: '8, 8'
      }).addTo(map);
      layers.push(line);
      map.fitBounds(pathPoints, { padding: [50, 50], maxZoom: 15 });
    }
  }

  function drawRoute({ pickup, drop, school, busLocation }) {
    if (!map) return;
    clearLayers();

    const pts = [];
    if (pickup) {
      const m = L.marker([pickup.lat, pickup.lng], { icon: stopIcon(false, true) })
        .addTo(map).bindPopup('Pickup Point');
      layers.push(m); pts.push([pickup.lat, pickup.lng]);
    }
    if (drop) {
      const m = L.marker([drop.lat, drop.lng], { icon: stopIcon(true, false) })
        .addTo(map).bindPopup('Drop / School Gate');
      layers.push(m); pts.push([drop.lat, drop.lng]);
    }
    if (school) {
      const m = L.marker([school.lat, school.lng], { icon: schoolIcon() })
        .addTo(map).bindPopup('School');
      layers.push(m); pts.push([school.lat, school.lng]);
    }
    if (busLocation) {
      busMarker = L.marker([busLocation.lat, busLocation.lng],
        { icon: busIcon(), zIndexOffset: 1000 }).addTo(map).bindPopup('Your Bus');
      layers.push(busMarker); pts.push([busLocation.lat, busLocation.lng]);
    }

    if (pts.length > 1) {
      const line = L.polyline(pts, {
        color: '#3b5bdb', weight: 4, opacity: 0.65, dashArray: '8,8'
      }).addTo(map);
      layers.push(line);
      map.fitBounds(pts, { padding: [50, 50], maxZoom: 15 });
    }
  }

  function updateBusLocation(lat, lng) {
    if (!map || !busMarker) return;
    busMarker.setLatLng([lat, lng]);
  }

  function animateBusTo(lat, lng, duration = 1200) {
    if (!map || !busMarker) return;
    const start = busMarker.getLatLng();
    const startTime = performance.now();
    if (animateTimer) cancelAnimationFrame(animateTimer);

    function step(now) {
      const t = Math.min((now - startTime) / duration, 1);
      const e = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
      const curLat = start.lat + (lat - start.lat) * e;
      const curLng = start.lng + (lng - start.lng) * e;
      busMarker.setLatLng([curLat, curLng]);
      if (t < 1) animateTimer = requestAnimationFrame(step);
    }
    animateTimer = requestAnimationFrame(step);
  }

  function getSavedBusLocation(busNumber) {
    const all = Storage.getData(Storage.KEYS.BUS_LOCATION, {});
    return all[busNumber] || null;
  }

  function saveBusLocation(busNumber, lat, lng) {
    const all = Storage.getData(Storage.KEYS.BUS_LOCATION, {});
    all[busNumber] = { lat, lng, updatedAt: new Date().toISOString() };
    Storage.saveData(Storage.KEYS.BUS_LOCATION, all);
  }

  return {
    init, drawRoute, drawBusRoute,
    updateBusLocation, animateBusTo,
    getSavedBusLocation, saveBusLocation,
    SCHOOL_LOCATION
  };
})();