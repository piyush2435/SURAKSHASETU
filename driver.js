/* ============================================
   SURAKSHA SETU — Driver Dashboard
   ============================================ */

document.addEventListener('DOMContentLoaded', () => {
  const session = Auth.requireRole('driver');
  if (!session) return;

  const busNumber = session.busNumber;
  const busInfo = Storage.getData(Storage.KEYS.BUSES, []).find(b => b.busNumber === busNumber) || {};

  let mapReady = false;

  setupSidebar();
  setupLogout();
  renderHeader();
  renderStudents();
  initLocationControls();
  initReportForm();
  initEmergencyForm();
  updateSimStatus();

  setInterval(() => {
    renderStudents();
    if (mapReady) refreshMap();
    updateSimStatus();
  }, 3000);

  setInterval(() => {
    if (Simulation.isActive(busNumber)) Simulation.tick(busNumber);
  }, Simulation.TICK_MS);

  function setupSidebar() {
    document.getElementById('sidebarUserName').textContent = session.name;
    document.querySelectorAll('.side-link').forEach(btn =>
      btn.addEventListener('click', () => switchSection(btn.dataset.section)));

    const burger = document.getElementById('hamburger');
    const backdrop = document.querySelector('.sidebar-backdrop');
    burger.addEventListener('click', () => {
      document.querySelector('.sidebar').classList.toggle('open');
      backdrop.classList.toggle('show');
    });
    backdrop.addEventListener('click', closeMobileSidebar);
  }

  function switchSection(id) {
    document.querySelectorAll('.side-link').forEach(x =>
      x.classList.toggle('active', x.dataset.section === id));
    document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
    const sec = document.getElementById(id);
    if (sec) sec.classList.add('active');
    closeMobileSidebar();

    if (id === 'sec-map' && !mapReady) {
      mapReady = true;
      setTimeout(refreshMap, 100);
    }
  }

  function closeMobileSidebar() {
    document.querySelector('.sidebar').classList.remove('open');
    document.querySelector('.sidebar-backdrop').classList.remove('show');
  }

  function setupLogout() {
    const topbar = document.getElementById('topbarRight');
    if (!topbar) return;
    topbar.addEventListener('click', (e) => {
      const btn = e.target.closest('#logoutBtn');
      if (!btn) return;
      e.preventDefault();
      if (confirm('Are you sure you want to logout?')) Auth.logout();
    });
  }

  function renderHeader() {
    document.getElementById('driverName').textContent = session.name;
    document.getElementById('driverBus').textContent = busNumber;
    document.getElementById('busPlate').textContent = busNumber;
    document.getElementById('driverRoute').textContent = busInfo.routeName || busInfo.route || 'Route';
  }

  function renderStudents() {
    const all = Storage.getData(Storage.KEYS.STUDENTS, []);
    const mine = all.filter(s => s.busNumber === busNumber);
    const container = document.getElementById('driverStudentList');

    if (!mine.length) {
      container.innerHTML = `<div class="empty-state"><i class="fa-solid fa-user-graduate"></i>
        <p>No students assigned to ${Utils.escapeHtml(busNumber)}.</p></div>`;
      return;
    }

    container.innerHTML = mine.map(s => `
      <div class="student-board-card ${s.status}">
        <img src="${s.photo || ''}" class="sbc-photo" alt="">
        <div class="sbc-info">
          <h4>${Utils.escapeHtml(s.name)}</h4>
          <div class="sbc-id">${Utils.escapeHtml(s.id)} · ${Utils.escapeHtml(s.className)}</div>
          <span class="badge badge-${s.status}">${s.status}</span>
          ${s.status === 'boarded' && s.boardedAt
            ? `<div class="sbc-time"><i class="fa-regular fa-clock"></i> Boarded: ${Utils.formatTime(s.boardedAt)}</div>` : ''}
          ${s.status === 'dropped' && s.droppedAt
            ? `<div class="sbc-time"><i class="fa-regular fa-clock"></i> Dropped: ${Utils.formatTime(s.droppedAt)}</div>` : ''}
        </div>
        <div class="sbc-actions">
          ${s.status === 'waiting' ? `<button type="button" class="btn btn-success btn-sm" data-board="${s.id}">
            <i class="fa-solid fa-arrow-right-to-bracket"></i> Board</button>` : ''}
          ${s.status === 'boarded' ? `<button type="button" class="btn btn-primary btn-sm" data-drop="${s.id}">
            <i class="fa-solid fa-arrow-right-from-bracket"></i> Drop</button>` : ''}
          ${s.status === 'dropped' ? `<span class="badge badge-dropped">
            <i class="fa-solid fa-check"></i> Done</span>` : ''}
        </div>
      </div>`).join('');

    container.querySelectorAll('[data-board]').forEach(b =>
      b.addEventListener('click', () => boardStudent(b.dataset.board)));
    container.querySelectorAll('[data-drop]').forEach(b =>
      b.addEventListener('click', () => dropStudent(b.dataset.drop)));
  }

  function boardStudent(id) {
    const students = Storage.getData(Storage.KEYS.STUDENTS, []);
    const idx = students.findIndex(s => s.id === id);
    if (idx === -1) return;
    students[idx].status = 'boarded';
    students[idx].boardedAt = Date.now();
    students[idx].boardedLocation = 'Pickup Point';
    Storage.saveData(Storage.KEYS.STUDENTS, students);

    Notifications.push(students[idx].parentUserId,
      `Your child ${students[idx].name} has boarded Bus ${busNumber} at ${Utils.formatTime(Date.now())}.`,
      'success');
    Utils.toast(`${students[idx].name} boarded.`, 'success');
    renderStudents();
    if (mapReady) refreshMap();
  }

  function dropStudent(id) {
    const students = Storage.getData(Storage.KEYS.STUDENTS, []);
    const idx = students.findIndex(s => s.id === id);
    if (idx === -1) return;

    students[idx].status = 'dropped';
    students[idx].droppedAt = Date.now();
    students[idx].droppedLocation = 'School Gate';
    Storage.saveData(Storage.KEYS.STUDENTS, students);

    const activeReports = Reports.getActive().filter(r => r.busNumber === busNumber);
    const outcome = activeReports.length > 0 ? 'problem' : 'flawless';
    const notes = outcome === 'problem'
      ? `Problem reported: ${activeReports[0].problemType}` : null;

    const s = students[idx];
    Storage.appendData(Storage.KEYS.JOURNEYS, {
      id: Utils.uid('journey'), studentId: s.id, studentName: s.name,
      busNumber, driverId: session.userId, date: Date.now(),
      boardedAt: s.boardedAt, droppedAt: s.droppedAt,
      boardedLocation: s.boardedLocation, droppedLocation: s.droppedLocation,
      status: 'completed', outcome, notes
    });

    Notifications.push(s.parentUserId,
      `Your child ${s.name} was dropped safely at ${Utils.formatTime(Date.now())}.`,
      'success');
    Utils.toast(`${s.name} dropped safely.`, 'success');
    renderStudents();
    if (mapReady) refreshMap();
  }

  function initLocationControls() {
    const loc = MapModule.getSavedBusLocation(busNumber) || DemoData.DEFAULT_BUS_LOCATION;
    document.getElementById('locLat').value = loc.lat;
    document.getElementById('locLng').value = loc.lng;
    document.getElementById('currentLocationText').textContent =
      `${loc.lat.toFixed(4)}, ${loc.lng.toFixed(4)}`;

    document.getElementById('updateLocBtn').addEventListener('click', () => {
      const lat = parseFloat(document.getElementById('locLat').value);
      const lng = parseFloat(document.getElementById('locLng').value);
      if (isNaN(lat) || isNaN(lng)) { Utils.toast('Invalid coordinates.', 'error'); return; }
      MapModule.saveBusLocation(busNumber, lat, lng);
      document.getElementById('currentLocationText').textContent =
        `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
      Utils.toast('Bus location updated.', 'success');

      Storage.getData(Storage.KEYS.STUDENTS, [])
        .filter(s => s.busNumber === busNumber && s.status === 'boarded')
        .forEach(s => Notifications.push(s.parentUserId,
          `Bus ${busNumber} location updated.`, 'info'));
      if (mapReady) refreshMap();
    });

    document.getElementById('startSimBtn').addEventListener('click', () => {
      Simulation.start(busNumber);
      updateSimStatus();
      if (mapReady) refreshMap();
    });
    document.getElementById('stopSimBtn').addEventListener('click', () => {
      Simulation.stop(busNumber);
      updateSimStatus();
    });
  }

  function updateSimStatus() {
    const el = document.getElementById('simStatus');
    if (!el) return;
    const active = Simulation.isActive(busNumber);
    el.textContent = active ? 'Running' : 'Idle';
    el.className = 'sim-status' + (active ? ' active' : '');
  }

  function initReportForm() {
    document.getElementById('reportProblemBtn').addEventListener('click', () => {
      document.getElementById('reportModal').classList.add('open');
      const loc = MapModule.getSavedBusLocation(busNumber) || DemoData.DEFAULT_BUS_LOCATION;
      document.getElementById('reportLocationText').textContent =
        `${loc.lat.toFixed(4)}, ${loc.lng.toFixed(4)}`;
    });
    document.getElementById('reportModalClose').addEventListener('click', () =>
      document.getElementById('reportModal').classList.remove('open'));
    document.getElementById('reportCancelBtn').addEventListener('click', () =>
      document.getElementById('reportModal').classList.remove('open'));

    document.getElementById('reportSubmitBtn').addEventListener('click', () => {
      const problemType = document.getElementById('reportType').value;
      const message = document.getElementById('reportMessage').value.trim();
      if (!message) { Utils.toast('Please describe the problem.', 'error'); return; }

      const loc = MapModule.getSavedBusLocation(busNumber) || DemoData.DEFAULT_BUS_LOCATION;
      Reports.createReport({
        busNumber, driverId: session.userId, driverName: session.name,
        problemType, message, location: { lat: loc.lat, lng: loc.lng }
      });

      Utils.toast('Report submitted.', 'success');
      document.getElementById('reportModal').classList.remove('open');
      document.getElementById('reportMessage').value = '';
    });

    document.getElementById('reportModal').addEventListener('click', (e) => {
      if (e.target.id === 'reportModal') e.target.classList.remove('open');
    });
  }

  /* ============ EMERGENCY ============ */
  function initEmergencyForm() {
    const openBtn = document.getElementById('raiseEmergencyBtn');
    const modal = document.getElementById('emergencyModal');
    const closeBtn = document.getElementById('emergencyModalClose');
    const cancelBtn = document.getElementById('emgCancelBtn');
    const sendBtn = document.getElementById('emgSendBtn');
    const typeSel = document.getElementById('emgType');

    openBtn.addEventListener('click', () => {
      const loc = MapModule.getSavedBusLocation(busNumber) || DemoData.DEFAULT_BUS_LOCATION;
      document.getElementById('emgLocationText').textContent =
        `${loc.lat.toFixed(4)}, ${loc.lng.toFixed(4)}`;
      updateEmergencyPreview();
      modal.classList.add('open');
    });

    closeBtn.addEventListener('click', () => modal.classList.remove('open'));
    cancelBtn.addEventListener('click', () => modal.classList.remove('open'));
    typeSel.addEventListener('change', updateEmergencyPreview);

    sendBtn.addEventListener('click', () => {
      const emergencyType = typeSel.value;
      const message = document.getElementById('emgMessage').value.trim();
      const loc = MapModule.getSavedBusLocation(busNumber) || DemoData.DEFAULT_BUS_LOCATION;

      if (!message) { Utils.toast('Please describe the emergency.', 'error'); return; }
      if (!confirm(`Confirm: Send EMERGENCY alert for "${emergencyType}"?`)) return;

      const result = Emergency.raise({
        emergencyType, message, busNumber,
        driverId: session.userId, driverName: session.name,
        location: { lat: loc.lat, lng: loc.lng }
      });

      if (!result.ok) {
        Utils.toast(result.error || 'Failed to send.', 'error');
        return;
      }

      modal.classList.remove('open');
      document.getElementById('emgMessage').value = '';
      document.getElementById('emgType').value = 'Accident';

      Utils.toast(`Emergency alert sent to ${result.alert.notifiedServices.length} service(s). Parents and admin notified.`,
        'success', 'Emergency Sent');

      // Show call modal with tap-to-call buttons
      showCallModal(result.alert);
    });

    modal.addEventListener('click', (e) => {
      if (e.target.id === 'emergencyModal') e.target.classList.remove('open');
    });

    document.getElementById('callModalClose').addEventListener('click', () => {
      document.getElementById('callServiceModal').classList.remove('open');
    });
    document.getElementById('callServiceModal').addEventListener('click', (e) => {
      if (e.target.id === 'callServiceModal') e.target.classList.remove('open');
    });
  }

  function updateEmergencyPreview() {
    const emergencyType = document.getElementById('emgType').value;
    const loc = MapModule.getSavedBusLocation(busNumber) || DemoData.DEFAULT_BUS_LOCATION;
    const listEl = document.getElementById('emgPreviewList');

    const wantedTypes = (() => {
      const map = {
        'Accident': ['hospital', 'police'],
        'Medical Emergency': ['hospital'],
        'Fire': ['hospital', 'police'],
        'Bus Breakdown': ['police'],
        'Road Block': ['police'],
        'Suspicious Activity': ['police'],
        'Theft': ['police'],
        'Other': ['police']
      };
      return map[emergencyType] || ['police'];
    })();

    listEl.innerHTML = wantedTypes.map(type => {
      const nearest = Emergency.findNearest(type, loc);
      if (!nearest) return `<div class="emg-preview-item text-muted">No ${type} nearby</div>`;
      const icon = type === 'hospital' ? 'fa-hospital' : 'fa-shield-halved';
      const label = type === 'hospital' ? 'Hospital' : 'Police';
      return `
        <div class="emg-preview-item">
          <i class="fa-solid ${icon}"></i>
          <div>
            <strong>${Utils.escapeHtml(nearest.name)}</strong>
            <div style="font-size:0.75rem;color:var(--text-muted);">${label} · ${Utils.escapeHtml(nearest.phone)}</div>
          </div>
          <span class="emg-dist">${nearest.distanceKm.toFixed(1)} km</span>
        </div>`;
    }).join('');
  }

  /* Show a modal with tap-to-call buttons */
  function showCallModal(alert) {
    const modal = document.getElementById('callServiceModal');
    const list = document.getElementById('callServicesList');

    list.innerHTML = alert.notifiedServices.map(svc => {
      const isHospital = svc.serviceType === 'hospital';
      const icon = isHospital ? 'fa-hospital' : 'fa-shield-halved';
      const label = isHospital ? 'Hospital' : 'Police';
      const primaryPhone = svc.emergencyPhone || svc.servicePhone;

      return `
        <a href="tel:${Utils.escapeHtml(primaryPhone)}" class="call-service-btn ${isHospital ? '' : 'police'}">
          <div class="call-service-icon ${isHospital ? 'hospital' : 'police'}">
            <i class="fa-solid ${icon}"></i>
          </div>
          <div class="call-service-info">
            <strong>${Utils.escapeHtml(svc.serviceName)}</strong>
            <span>${label} · ${svc.distanceKm} km away</span>
          </div>
          <div class="call-service-number">
            <i class="fa-solid fa-phone"></i> ${Utils.escapeHtml(primaryPhone)}
          </div>
        </a>
        <a href="tel:${Utils.escapeHtml(svc.servicePhone)}" class="call-service-btn ${isHospital ? '' : 'police'}"
           style="margin-top:-4px;padding:10px 16px;font-size:0.85rem;">
          <i class="fa-solid fa-phone" style="color:#64748b;margin-right:8px;"></i>
          Station line: ${Utils.escapeHtml(svc.servicePhone)}
        </a>`;
    }).join('') + `
      <div style="margin-top:14px;padding:10px 12px;background:#fef3c7;border-radius:8px;
                  font-size:0.82rem;color:#92400e;line-height:1.55;">
        <strong><i class="fa-solid fa-circle-info"></i> Note:</strong>
        Tap a card to call directly from your phone. All India emergency numbers:
        Ambulance <strong>108</strong>, Police <strong>100</strong>, Fire <strong>101</strong>.
      </div>`;

    modal.classList.add('open');
  }

  function refreshMap() {
    const mine = Storage.getData(Storage.KEYS.STUDENTS, [])
      .filter(s => s.busNumber === busNumber && s.pickupLocation);
    const loc = MapModule.getSavedBusLocation(busNumber) ||
      (mine[0] ? mine[0].pickupLocation : DemoData.DEFAULT_BUS_LOCATION);

    MapModule.init('driverMap', loc);
    MapModule.drawBusRoute({
      busNumber, students: mine, busLocation: loc, school: MapModule.SCHOOL_LOCATION
    });
  }
});