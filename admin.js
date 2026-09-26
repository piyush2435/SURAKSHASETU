/* ============================================
   SURAKSHA SETU — Admin Dashboard
   ============================================ */

document.addEventListener('DOMContentLoaded', () => {
  const session = Auth.requireRole('admin');
  if (!session) return;

  let mapReady = false;
  let editingStudentId = null;
  let deletingStudentId = null;
  let editingBusNumber = null;
  let deletingBusNumber = null;
  let pendingPhoto = null;
  let currentEmgFilter = 'all';

  setupSidebar();
  setupLogout();
  setupStudentModal();
  setupBusModal();
  setupConfirmDelete();
  setupEmergencyUI();
  populateBusSelectForStudentForm();
  populateFleetSelect();

  renderStats();
  renderFleet();
  renderBuses();
  renderStudents();
  renderReports();
  renderEmergency('all');
  renderHistory('all');
  updateSimStatus();

  setInterval(() => {
    renderStats();
    renderFleet();
    renderStudents();
    renderReports();
    renderEmergency(currentEmgFilter);
    if (mapReady) refreshMap();
    updateSimStatus();
  }, 3000);

  setInterval(() => {
    const bus = document.getElementById('mapBusSelect')?.value;
    if (bus && Simulation.isActive(bus)) Simulation.tick(bus);
  }, Simulation.TICK_MS);

  function setupSidebar() {
    document.getElementById('sidebarUserName').textContent = session.name;
    document.querySelectorAll('.side-link').forEach(btn => {
      btn.addEventListener('click', () => switchSection(btn.dataset.section));
    });
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
      setTimeout(() => {
        const bus = document.getElementById('mapBusSelect').value;
        if (bus) drawAdminMap(bus);
      }, 80);
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

  function renderStats() {
    const students = Storage.getData(Storage.KEYS.STUDENTS, []);
    const buses = Storage.getData(Storage.KEYS.BUSES, []);
    const emg = Emergency.getActive();
    document.getElementById('statTotal').textContent   = students.length;
    document.getElementById('statOnBus').textContent    = students.filter(s => s.status === 'boarded').length;
    document.getElementById('statDropped').textContent  = students.filter(s => s.status === 'dropped').length;
    document.getElementById('statWaiting').textContent  = students.filter(s => s.status === 'waiting').length;
    document.getElementById('statBuses').textContent    = buses.filter(b => b.status === 'active').length;
    document.getElementById('statEmg').textContent      = emg.length;
  }

  /* ============ FLEET ============ */
  function renderFleet() {
    const buses = Storage.getData(Storage.KEYS.BUSES, []);
    const students = Storage.getData(Storage.KEYS.STUDENTS, []);
    const allReports = Reports.getActive();
    const grid = document.getElementById('fleetGrid');

    if (!buses.length) {
      grid.innerHTML = `<div class="empty-state"><i class="fa-solid fa-bus"></i>
        <p>No buses yet. Add one from Bus Management.</p></div>`;
      return;
    }

    grid.innerHTML = buses.map(b => {
      const busStudents = students.filter(s => s.busNumber === b.busNumber);
      const onBus = busStudents.filter(s => s.status === 'boarded').length;
      const dropped = busStudents.filter(s => s.status === 'dropped').length;
      const waiting = busStudents.filter(s => s.status === 'waiting').length;
      const reports = allReports.filter(r => r.busNumber === b.busNumber).length;
      const emerg = Emergency.getForBus(b.busNumber).filter(a => a.status === 'active').length;
      const isRunning = Simulation.isActive(b.busNumber);
      const simLoc = MapModule.getSavedBusLocation(b.busNumber);

      return `
        <div class="fleet-card ${isRunning ? 'running' : ''}">
          <div class="fleet-head">
            <div class="fleet-plate">${Utils.escapeHtml(b.busNumber)}</div>
            ${isRunning
              ? `<span class="badge badge-boarded"><i class="fa-solid fa-circle"></i> Live</span>`
              : `<span class="badge badge-waiting">Idle</span>`}
          </div>
          <div class="fleet-route">
            <div class="fr-num">${Utils.escapeHtml(b.routeNumber || '—')}</div>
            <div class="fr-name">${Utils.escapeHtml(b.routeName || '—')}</div>
          </div>
          <div class="fleet-driver">
            <i class="fa-solid fa-id-card"></i>
            <div>
              <div class="fd-name">${Utils.escapeHtml(b.driverName || '—')}</div>
              <div class="fd-meta">${Utils.escapeHtml(b.driverPhone || '')}</div>
            </div>
          </div>
          <div class="fleet-stats">
            <div class="fs-item"><div class="fs-num">${busStudents.length}</div><div class="fs-label">Total</div></div>
            <div class="fs-item green"><div class="fs-num">${onBus}</div><div class="fs-label">On Bus</div></div>
            <div class="fs-item orange"><div class="fs-num">${waiting}</div><div class="fs-label">Waiting</div></div>
            <div class="fs-item blue"><div class="fs-num">${dropped}</div><div class="fs-label">Dropped</div></div>
          </div>
          ${reports > 0 ? `
            <div class="fleet-alert">
              <i class="fa-solid fa-triangle-exclamation"></i>
              ${reports} active report${reports > 1 ? 's' : ''}
            </div>` : ''}
          ${emerg > 0 ? `
            <div class="fleet-alert" style="background:#7f1d1d;color:#fff;">
              <i class="fa-solid fa-tower-broadcast"></i>
              ${emerg} ACTIVE EMERGENCY
            </div>` : ''}
          <div class="fleet-foot">
            <span class="text-muted" style="font-size:0.76rem;">
              ${simLoc ? 'Updated ' + Utils.timeAgo(simLoc.updatedAt) : 'No location yet'}
            </span>
            <button type="button" class="btn btn-outline btn-sm" data-fleet-open="${Utils.escapeHtml(b.busNumber)}">
              View details <i class="fa-solid fa-arrow-right"></i>
            </button>
          </div>
        </div>`;
    }).join('');

    grid.querySelectorAll('[data-fleet-open]').forEach(btn => {
      btn.addEventListener('click', () => openFleetDetail(btn.dataset.fleetOpen));
    });
  }

  function openFleetDetail(busNumber) {
    const buses = Storage.getData(Storage.KEYS.BUSES, []);
    const bus = buses.find(b => b.busNumber === busNumber);
    if (!bus) return;

    const students = Storage.getData(Storage.KEYS.STUDENTS, []).filter(s => s.busNumber === busNumber);
    const reports = Reports.getActive().filter(r => r.busNumber === busNumber);
    const emergencies = Emergency.getForBus(busNumber).filter(a => a.status === 'active');

    document.getElementById('fleetDetailTitle').innerHTML =
      `<i class="fa-solid fa-bus"></i> ${Utils.escapeHtml(bus.busNumber)} — ${Utils.escapeHtml(bus.routeName || '')}`;

    document.getElementById('fleetDetailBody').innerHTML = `
      <div class="fleet-detail-top">
        <div class="fdt-item"><div class="label">Route No</div><div class="val">${Utils.escapeHtml(bus.routeNumber || '—')}</div></div>
        <div class="fdt-item"><div class="label">Driver</div><div class="val">${Utils.escapeHtml(bus.driverName || '—')}</div></div>
        <div class="fdt-item"><div class="label">License</div><div class="val">${Utils.escapeHtml(bus.driverLicense || '—')}</div></div>
        <div class="fdt-item"><div class="label">Phone</div><div class="val">${Utils.escapeHtml(bus.driverPhone || '—')}</div></div>
        <div class="fdt-item"><div class="label">Capacity</div><div class="val">${bus.capacity || 40}</div></div>
        <div class="fdt-item"><div class="label">Status</div><div class="val">${Utils.escapeHtml(bus.status || 'active')}</div></div>
      </div>

      ${emergencies.length ? `
        <div class="emg-warning" style="margin-bottom:16px;">
          <i class="fa-solid fa-tower-broadcast"></i>
          <div><strong>${emergencies.length} ACTIVE EMERGENCY ALERT(S)</strong><br>
          Check Emergency Services section for details.</div>
        </div>` : ''}

      <h4 class="fleet-detail-h">Students on this bus (${students.length})</h4>
      ${students.length ? `
        <div class="fleet-student-list">
          ${students.map(s => `
            <div class="fleet-student-row">
              <img src="${s.photo || ''}" class="fleet-student-photo" alt="">
              <div class="fsr-info">
                <strong>${Utils.escapeHtml(s.name)}</strong>
                <span>${Utils.escapeHtml(s.id)} · ${Utils.escapeHtml(s.className)}</span>
              </div>
              <span class="badge badge-${s.status}">${s.status}</span>
            </div>`).join('')}
        </div>` : `<div class="empty-state"><p>No students assigned.</p></div>`}

      ${reports.length ? `
        <h4 class="fleet-detail-h" style="color:var(--danger);">
          <i class="fa-solid fa-triangle-exclamation"></i> Active Reports (${reports.length})
        </h4>
        <div class="fleet-report-list">
          ${reports.map(r => `
            <div class="fleet-report-row">
              <strong>${Utils.escapeHtml(r.problemType)}</strong>
              <p>${Utils.escapeHtml(r.message)}</p>
              <span class="text-muted" style="font-size:0.78rem;">${Utils.timeAgo(r.time)}</span>
            </div>`).join('')}
        </div>` : ''}
    `;

    openModal('fleetDetailModal');
  }

  /* ============ EMERGENCY ============ */
  function setupEmergencyUI() {
    document.querySelectorAll('[data-emg-filter]').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('[data-emg-filter]').forEach(x => x.classList.remove('active'));
        btn.classList.add('active');
        currentEmgFilter = btn.dataset.emgFilter;
        renderEmergency(currentEmgFilter);
      });
    });

    const servicesBtn = document.getElementById('viewServicesBtn');
    if (servicesBtn) {
      servicesBtn.addEventListener('click', () => {
        const hospitals = Emergency.getServices('hospital');
        const police = Emergency.getServices('police');
        document.getElementById('hospitalsList').innerHTML = hospitals.map(s => `
          <div class="services-dir-row">
            <div class="services-dir-icon hospital"><i class="fa-solid fa-hospital"></i></div>
            <div class="services-dir-info">
              <strong>${Utils.escapeHtml(s.name)}</strong>
              <span>${Utils.escapeHtml(s.address)}</span>
              <span><i class="fa-solid fa-phone"></i> ${Utils.escapeHtml(s.phone)}
                &nbsp;·&nbsp; <strong>Emergency: ${Utils.escapeHtml(s.emergencyPhone)}</strong></span>
              <div style="margin-top:6px;">
                ${(s.services || []).map(t => `<span class="services-tag">${Utils.escapeHtml(t)}</span>`).join('')}
              </div>
            </div>
          </div>`).join('');

        document.getElementById('policeList').innerHTML = police.map(s => `
          <div class="services-dir-row">
            <div class="services-dir-icon police"><i class="fa-solid fa-shield-halved"></i></div>
            <div class="services-dir-info">
              <strong>${Utils.escapeHtml(s.name)}</strong>
              <span>${Utils.escapeHtml(s.address)}</span>
              <span><i class="fa-solid fa-phone"></i> ${Utils.escapeHtml(s.phone)}
                &nbsp;·&nbsp; <strong>Emergency: ${Utils.escapeHtml(s.emergencyPhone)}</strong></span>
              <div style="margin-top:6px;">
                ${(s.services || []).map(t => `<span class="services-tag">${Utils.escapeHtml(t)}</span>`).join('')}
              </div>
            </div>
          </div>`).join('');

        openModal('servicesModal');
      });
    }

    document.getElementById('servicesModalClose').addEventListener('click', () =>
      closeModal('servicesModal'));
    document.getElementById('fleetDetailClose').addEventListener('click', () =>
      closeModal('fleetDetailModal'));
  }

  function renderEmergency(filter = 'all') {
    const all = Emergency.getAll();
    const filtered = filter === 'all' ? all : all.filter(a => a.status === filter);
    const grid = document.getElementById('emgGrid');

    if (!filtered.length) {
      grid.innerHTML = `<div class="empty-state">
        <i class="fa-solid fa-shield-halved" style="color:#16a34a;"></i>
        <p>No emergencies in this category. All clear! 🎉</p></div>`;
      return;
    }

    grid.innerHTML = filtered.map(a => {
      const isActive = a.status === 'active';
      const servicesHtml = (a.notifiedServices || []).map(s => {
        const isHosp = s.serviceType === 'hospital';
        return `
          <div class="emg-service-row ${s.serviceType}">
            <div class="emg-service-icon ${s.serviceType}">
              <i class="fa-solid ${isHosp ? 'fa-hospital' : 'fa-shield-halved'}"></i>
            </div>
            <div class="emg-service-info">
              <strong>${Utils.escapeHtml(s.serviceName)}</strong>
              <span>${s.distanceKm} km · ${Utils.escapeHtml(s.emergencyPhone)}</span>
            </div>
            <span class="emg-service-status dispatched">Dispatched</span>
          </div>`;
      }).join('');

      return `
        <div class="emg-card ${isActive ? '' : 'resolved'}">
          <div class="emg-card-head">
            <h4><i class="fa-solid ${isActive ? 'fa-tower-broadcast' : 'fa-circle-check'}"></i>
              ${Utils.escapeHtml(a.emergencyType)}</h4>
            <span class="badge badge-${isActive ? 'active' : 'resolved'}">${a.status}</span>
          </div>
          <div class="emg-card-time">
            <i class="fa-regular fa-clock"></i> ${Utils.formatDateTime(a.time)}
          </div>
          <div class="emg-card-message">${Utils.escapeHtml(a.message)}</div>
          <div class="emg-card-location">
            <i class="fa-solid fa-location-dot"></i>
            Bus ${Utils.escapeHtml(a.busNumber)} · Driver ${Utils.escapeHtml(a.driverName)}
          </div>
          <div class="emg-card-location">
            <i class="fa-solid fa-map-pin"></i>
            ${a.location.lat.toFixed(4)}, ${a.location.lng.toFixed(4)}
          </div>

          ${(a.notifiedServices || []).length ? `
            <div style="font-size:0.72rem;text-transform:uppercase;letter-spacing:0.5px;
                        color:var(--text-muted);font-weight:700;margin-bottom:8px;">
              Services Notified
            </div>
            <div class="emg-services">${servicesHtml}</div>
          ` : ''}

          <div class="emg-card-actions">
            ${isActive ? `
              <button type="button" class="btn btn-success btn-sm" data-emg-resolve="${a.id}">
                <i class="fa-solid fa-check"></i> Mark Resolved
              </button>` : ''}
            <button type="button" class="btn btn-danger btn-sm" data-emg-delete="${a.id}">
              <i class="fa-solid fa-trash"></i> Delete
            </button>
          </div>
        </div>`;
    }).join('');

    grid.querySelectorAll('[data-emg-resolve]').forEach(b =>
      b.addEventListener('click', () => {
        Emergency.resolve(b.dataset.emgResolve);
        Utils.toast('Emergency marked resolved.', 'success');
        renderEmergency(currentEmgFilter);
        renderStats();
        renderFleet();
      }));

    grid.querySelectorAll('[data-emg-delete]').forEach(b =>
      b.addEventListener('click', () => {
        if (!confirm('Delete this emergency record?')) return;
        Emergency.remove(b.dataset.emgDelete);
        Utils.toast('Deleted.', 'info');
        renderEmergency(currentEmgFilter);
        renderStats();
        renderFleet();
      }));
  }

  /* ============ BUS MANAGEMENT ============ */
  function populateBusSelectForStudentForm() {
    const buses = Storage.getData(Storage.KEYS.BUSES, []);
    const sel = document.getElementById('fldBus');
    sel.innerHTML = buses.map(b =>
      `<option value="${Utils.escapeHtml(b.busNumber)}">${Utils.escapeHtml(b.busNumber)}</option>`).join('');
  }

  function populateFleetSelect() {
    const buses = Storage.getData(Storage.KEYS.BUSES, []);
    const sel = document.getElementById('mapBusSelect');
    const cur = sel.value;
    sel.innerHTML = buses.map(b =>
      `<option value="${Utils.escapeHtml(b.busNumber)}">${Utils.escapeHtml(b.busNumber)} — ${Utils.escapeHtml(b.driverName || '')}</option>`).join('');
    if (cur && buses.some(b => b.busNumber === cur)) sel.value = cur;

    sel.onchange = () => {
      if (mapReady) drawAdminMap(sel.value);
      updateSimStatus();
    };

    document.getElementById('startSimBtnAdmin').onclick = () => {
      const bus = sel.value;
      if (!bus) return;
      Simulation.start(bus);
      updateSimStatus();
      if (mapReady) drawAdminMap(bus);
    };
    document.getElementById('stopSimBtnAdmin').onclick = () => {
      const bus = sel.value;
      if (!bus) return;
      Simulation.stop(bus);
      updateSimStatus();
    };
  }

  function updateSimStatus() {
    const el = document.getElementById('simStatusAdmin');
    const sel = document.getElementById('mapBusSelect');
    if (!el || !sel) return;
    const bus = sel.value;
    if (!bus) { el.textContent = 'Idle'; el.className = 'sim-status'; return; }
    const active = Simulation.isActive(bus);
    el.textContent = active ? 'Running' : 'Idle';
    el.className = 'sim-status' + (active ? ' active' : '');
  }

  function renderBuses(filterText = '') {
    const buses = Storage.getData(Storage.KEYS.BUSES, []);
    const tbody = document.getElementById('busesTableBody');
    const q = filterText.trim().toLowerCase();
    const filtered = q ? buses.filter(b =>
      (b.busNumber || '').toLowerCase().includes(q) ||
      (b.routeNumber || '').toLowerCase().includes(q) ||
      (b.routeName || '').toLowerCase().includes(q) ||
      (b.driverName || '').toLowerCase().includes(q)) : buses;

    if (!filtered.length) {
      tbody.innerHTML = `<tr><td colspan="9">
        <div class="empty-state"><i class="fa-solid fa-bus"></i><p>No buses found.</p></div>
      </td></tr>`;
      return;
    }

    tbody.innerHTML = filtered.map(b => `
      <tr>
        <td><strong>${Utils.escapeHtml(b.busNumber)}</strong></td>
        <td>${Utils.escapeHtml(b.routeNumber || '—')}</td>
        <td>${Utils.escapeHtml(b.routeName || '—')}</td>
        <td>${Utils.escapeHtml(b.driverName || '—')}</td>
        <td>${Utils.escapeHtml(b.driverLicense || '—')}</td>
        <td>${Utils.escapeHtml(b.driverPhone || '—')}</td>
        <td>${b.capacity || 40}</td>
        <td><span class="badge badge-${b.status === 'active' ? 'completed' : 'waiting'}">${Utils.escapeHtml(b.status || 'active')}</span></td>
        <td>
          <div class="actions-cell">
            <button type="button" class="icon-btn edit" data-bus-edit="${Utils.escapeHtml(b.busNumber)}">
              <i class="fa-solid fa-pen"></i></button>
            <button type="button" class="icon-btn delete" data-bus-del="${Utils.escapeHtml(b.busNumber)}">
              <i class="fa-solid fa-trash"></i></button>
          </div>
        </td>
      </tr>`).join('');

    tbody.querySelectorAll('[data-bus-edit]').forEach(btn =>
      btn.addEventListener('click', () => openBusModal(btn.dataset.busEdit)));
    tbody.querySelectorAll('[data-bus-del]').forEach(btn =>
      btn.addEventListener('click', () => confirmDeleteBus(btn.dataset.busDel)));
  }

  document.getElementById('busSearch').addEventListener('input',
    Utils.debounce(e => renderBuses(e.target.value), 200));

  function setupBusModal() {
    document.getElementById('addBusBtn').addEventListener('click', () => openBusModal(null));
    document.getElementById('busModalClose').addEventListener('click', () => closeModal('busModal'));
    document.getElementById('busCancelBtn').addEventListener('click', () => closeModal('busModal'));
    document.getElementById('busSaveBtn').addEventListener('click', saveBus);
  }

  function openBusModal(busNumber) {
    editingBusNumber = busNumber;
    document.getElementById('busForm').reset();
    document.getElementById('bFldCapacity').value = 40;
    document.getElementById('bFldStatus').value = 'active';

    if (busNumber) {
      const b = Storage.getData(Storage.KEYS.BUSES, []).find(x => x.busNumber === busNumber);
      if (!b) return;
      document.getElementById('busModalTitle').innerHTML =
        `<i class="fa-solid fa-pen"></i> Edit ${Utils.escapeHtml(b.busNumber)}`;
      document.getElementById('bFldBusNumber').value = b.busNumber;
      document.getElementById('bFldRouteNumber').value = b.routeNumber || '';
      document.getElementById('bFldRouteName').value = b.routeName || '';
      document.getElementById('bFldDriverName').value = b.driverName || '';
      document.getElementById('bFldDriverLicense').value = b.driverLicense || '';
      document.getElementById('bFldDriverPhone').value = b.driverPhone || '';
      document.getElementById('bFldCapacity').value = b.capacity || 40;
      document.getElementById('bFldStatus').value = b.status || 'active';
      document.getElementById('bFldDriverUserId').value = b.driverId || '';
      document.getElementById('bFldDriverPassword').value = '';
    } else {
      document.getElementById('busModalTitle').innerHTML =
        '<i class="fa-solid fa-bus-simple"></i> Add New Bus';
    }
    openModal('busModal');
  }

  function saveBus() {
    const busNumber = document.getElementById('bFldBusNumber').value.trim().toUpperCase();
    const routeNumber = document.getElementById('bFldRouteNumber').value.trim();
    const routeName = document.getElementById('bFldRouteName').value.trim();
    const driverName = document.getElementById('bFldDriverName').value.trim();
    const driverLicense = document.getElementById('bFldDriverLicense').value.trim();
    const driverPhone = document.getElementById('bFldDriverPhone').value.trim();
    const capacity = parseInt(document.getElementById('bFldCapacity').value) || 40;
    const status = document.getElementById('bFldStatus').value;
    const driverUserId = document.getElementById('bFldDriverUserId').value.trim();
    const driverPassword = document.getElementById('bFldDriverPassword').value.trim();

    if (!busNumber || !routeNumber || !routeName || !driverName || !driverLicense) {
      Utils.toast('Please fill all required fields.', 'error'); return;
    }

    const buses = Storage.getData(Storage.KEYS.BUSES, []);

    if (editingBusNumber) {
      const idx = buses.findIndex(b => b.busNumber === editingBusNumber);
      if (idx === -1) return;
      buses[idx] = { ...buses[idx], busNumber, routeNumber, routeName,
        driverName, driverLicense, driverPhone, capacity, status };
      Storage.saveData(Storage.KEYS.BUSES, buses);

      if (driverUserId) {
        const users = Storage.getData(Storage.KEYS.USERS, []);
        const uidx = users.findIndex(u => u.userId === buses[idx].driverId && u.role === 'driver');
        if (uidx !== -1) {
          users[uidx].name = driverName;
          users[uidx].mobile = driverPhone || users[uidx].mobile;
          if (driverPassword) users[uidx].password = driverPassword;
          Storage.saveData(Storage.KEYS.USERS, users);
        }
      }
      Utils.toast('Bus updated.', 'success');
    } else {
      if (buses.some(b => b.busNumber === busNumber)) {
        Utils.toast('A bus with that number already exists.', 'error'); return;
      }
      buses.push({ busNumber, routeNumber, routeName,
        driverName, driverLicense, driverPhone, capacity, status,
        driverId: driverUserId || '' });
      Storage.saveData(Storage.KEYS.BUSES, buses);

      if (driverUserId && driverPassword) {
        const users = Storage.getData(Storage.KEYS.USERS, []);
        if (!users.some(u => u.userId === driverUserId)) {
          users.push({ userId: driverUserId, password: driverPassword, role: 'driver',
            name: driverName, mobile: driverPhone || '9999999999', busNumber });
          Storage.saveData(Storage.KEYS.USERS, users);
        }
      }
      Utils.toast('Bus added.', 'success');
    }

    closeModal('busModal');
    renderBuses(); renderFleet(); renderStats();
    populateBusSelectForStudentForm(); populateFleetSelect();
  }

  function confirmDeleteBus(busNumber) {
    deletingBusNumber = busNumber;
    deletingStudentId = null;
    const students = Storage.getData(Storage.KEYS.STUDENTS, [])
      .filter(s => s.busNumber === busNumber).length;
    document.getElementById('confirmDeleteText').textContent =
      `Delete bus ${busNumber}?` +
      (students > 0 ? ` ${students} student(s) are assigned to it.` : '');
    openModal('confirmDeleteModal');
  }

  function setupConfirmDelete() {
    document.getElementById('confirmDeleteBtn').addEventListener('click', () => {
      if (deletingBusNumber) {
        Storage.deleteData(Storage.KEYS.BUSES, b => b.busNumber === deletingBusNumber);
        Utils.toast('Bus deleted.', 'success');
        deletingBusNumber = null;
        closeModal('confirmDeleteModal');
        renderBuses(); renderFleet(); renderStats();
        populateBusSelectForStudentForm(); populateFleetSelect();
        return;
      }
      if (deletingStudentId) {
        Storage.deleteData(Storage.KEYS.STUDENTS, s => s.id === deletingStudentId);
        Storage.deleteData(Storage.KEYS.USERS, u => u.studentId === deletingStudentId);
        Utils.toast('Student deleted.', 'success');
        deletingStudentId = null;
        closeModal('confirmDeleteModal');
        renderStudents(); renderStats(); renderFleet();
      }
    });
    document.getElementById('confirmDeleteCancel').addEventListener('click', () => closeModal('confirmDeleteModal'));
    document.getElementById('confirmDeleteCancelBtn').addEventListener('click', () => closeModal('confirmDeleteModal'));
  }

  /* ============ STUDENTS ============ */
  function renderStudents(filterText = '') {
    const students = Storage.getData(Storage.KEYS.STUDENTS, []);
    const tbody = document.getElementById('studentsTableBody');
    const q = filterText.trim().toLowerCase();
    const filtered = q ? students.filter(s =>
      s.name.toLowerCase().includes(q) ||
      s.id.toLowerCase().includes(q) ||
      s.className.toLowerCase().includes(q) ||
      s.busNumber.toLowerCase().includes(q)) : students;

    if (!filtered.length) {
      tbody.innerHTML = `<tr><td colspan="9">
        <div class="empty-state"><i class="fa-solid fa-user-graduate"></i><p>No students found.</p></div>
      </td></tr>`;
      return;
    }

    tbody.innerHTML = filtered.map(s => `
      <tr>
        <td><img src="${s.photo || ''}" class="student-avatar" alt=""></td>
        <td><strong>${Utils.escapeHtml(s.name)}</strong></td>
        <td>${Utils.escapeHtml(s.id)}</td>
        <td>${Utils.escapeHtml(s.className)}</td>
        <td>${Utils.escapeHtml(s.address)}</td>
        <td>${Utils.escapeHtml(s.parentMobile)}</td>
        <td>${Utils.escapeHtml(s.busNumber)}</td>
        <td><span class="badge badge-${s.status}">${s.status}</span></td>
        <td>
          <div class="actions-cell">
            <button type="button" class="icon-btn view" data-action="view" data-id="${s.id}"><i class="fa-solid fa-eye"></i></button>
            <button type="button" class="icon-btn edit" data-action="edit" data-id="${s.id}"><i class="fa-solid fa-pen"></i></button>
            <button type="button" class="icon-btn delete" data-action="delete" data-id="${s.id}"><i class="fa-solid fa-trash"></i></button>
          </div>
        </td>
      </tr>`).join('');

    tbody.querySelectorAll('[data-action]').forEach(btn => {
      btn.addEventListener('click', () => {
        const { action, id } = btn.dataset;
        if (action === 'view') viewStudent(id);
        if (action === 'edit') openStudentModal(id);
        if (action === 'delete') confirmDeleteStudent(id);
      });
    });
  }

  document.getElementById('studentSearch').addEventListener('input',
    Utils.debounce(e => renderStudents(e.target.value), 200));

  function viewStudent(id) {
    const s = Storage.getData(Storage.KEYS.STUDENTS, []).find(x => x.id === id);
    if (!s) return;
    document.getElementById('viewStudentBody').innerHTML = `
      <div style="display:flex;gap:16px;align-items:center;margin-bottom:16px;">
        <img src="${s.photo || ''}" style="width:80px;height:80px;border-radius:50%;object-fit:cover;border:3px solid var(--border);">
        <div><h3 style="margin-bottom:4px;">${Utils.escapeHtml(s.name)}</h3>
          <span class="badge badge-${s.status}">${s.status}</span></div>
      </div>
      <div class="detail-row"><div class="d-label">Student ID</div><div class="d-value">${Utils.escapeHtml(s.id)}</div></div>
      <div class="detail-row"><div class="d-label">Class</div><div class="d-value">${Utils.escapeHtml(s.className)}</div></div>
      <div class="detail-row"><div class="d-label">Address</div><div class="d-value">${Utils.escapeHtml(s.address)}</div></div>
      <div class="detail-row"><div class="d-label">Parent Mobile</div><div class="d-value">${Utils.escapeHtml(s.parentMobile)}</div></div>
      <div class="detail-row"><div class="d-label">Parent User ID</div><div class="d-value">${Utils.escapeHtml(s.parentUserId)}</div></div>
      <div class="detail-row"><div class="d-label">Bus</div><div class="d-value">${Utils.escapeHtml(s.busNumber)}</div></div>
      <div class="detail-row"><div class="d-label">Pickup</div><div class="d-value">${s.pickupLocation.lat.toFixed(4)}, ${s.pickupLocation.lng.toFixed(4)}</div></div>
      <div class="detail-row"><div class="d-label">Drop</div><div class="d-value">${s.dropLocation.lat.toFixed(4)}, ${s.dropLocation.lng.toFixed(4)}</div></div>
    `;
    openModal('viewStudentModal');
  }

  function setupStudentModal() {
    document.getElementById('addStudentBtn').addEventListener('click', () => openStudentModal(null));
    document.getElementById('studentModalClose').addEventListener('click', () => closeModal('studentModal'));
    document.getElementById('studentCancelBtn').addEventListener('click', () => closeModal('studentModal'));
    document.getElementById('studentSaveBtn').addEventListener('click', saveStudent);
    document.getElementById('photoInput').addEventListener('change', async (e) => {
      const file = e.target.files[0]; if (!file) return;
      try {
        pendingPhoto = await Utils.fileToBase64(file);
        document.getElementById('photoPreview').src = pendingPhoto;
      } catch { Utils.toast('Could not read image.', 'error'); }
    });
    document.getElementById('viewStudentClose').addEventListener('click', () => closeModal('viewStudentModal'));

    document.querySelectorAll('.modal-overlay').forEach(ov => {
      ov.addEventListener('click', (e) => { if (e.target === ov) ov.classList.remove('open'); });
    });
  }

  function openStudentModal(id) {
    editingStudentId = id;
    pendingPhoto = null;
    document.getElementById('studentForm').reset();
    populateBusSelectForStudentForm();

    if (id) {
      const s = Storage.getData(Storage.KEYS.STUDENTS, []).find(x => x.id === id);
      if (!s) return;
      document.getElementById('studentModalTitle').innerHTML = '<i class="fa-solid fa-pen"></i> Edit Student';
      document.getElementById('fldName').value = s.name;
      document.getElementById('fldId').value = s.id;
      document.getElementById('fldClass').value = s.className;
      document.getElementById('fldAddress').value = s.address;
      document.getElementById('fldMobile').value = s.parentMobile;
      document.getElementById('fldParentUser').value = s.parentUserId;
      document.getElementById('fldParentPass').value = s.parentPassword;
      document.getElementById('fldBus').value = s.busNumber;
      document.getElementById('fldPickupLat').value = s.pickupLocation.lat;
      document.getElementById('fldPickupLng').value = s.pickupLocation.lng;
      document.getElementById('fldDropLat').value = s.dropLocation.lat;
      document.getElementById('fldDropLng').value = s.dropLocation.lng;
      document.getElementById('photoPreview').src = s.photo || '';
      pendingPhoto = s.photo;
    } else {
      document.getElementById('studentModalTitle').innerHTML =
        '<i class="fa-solid fa-user-plus"></i> Add New Student';
      document.getElementById('photoPreview').src = '';
    }
    openModal('studentModal');
  }

  function saveStudent() {
    const name = document.getElementById('fldName').value.trim();
    const id = document.getElementById('fldId').value.trim();
    const className = document.getElementById('fldClass').value.trim();
    const address = document.getElementById('fldAddress').value.trim();
    const parentMobile = document.getElementById('fldMobile').value.trim();
    const parentUserId = document.getElementById('fldParentUser').value.trim();
    const parentPassword = document.getElementById('fldParentPass').value.trim();
    const busNumber = document.getElementById('fldBus').value.trim();
    const pLat = parseFloat(document.getElementById('fldPickupLat').value);
    const pLng = parseFloat(document.getElementById('fldPickupLng').value);
    const dLat = parseFloat(document.getElementById('fldDropLat').value);
    const dLng = parseFloat(document.getElementById('fldDropLng').value);

    if (!name || !id || !className || !parentUserId || !parentPassword || !busNumber) {
      Utils.toast('Please fill all required fields.', 'error'); return;
    }
    if ([pLat, pLng, dLat, dLng].some(isNaN)) {
      Utils.toast('Invalid coordinates.', 'error'); return;
    }

    const students = Storage.getData(Storage.KEYS.STUDENTS, []);
    if (editingStudentId) {
      const idx = students.findIndex(s => s.id === editingStudentId);
      if (idx === -1) return;
      students[idx] = { ...students[idx], name, id, className, address, parentMobile,
        parentUserId, parentPassword, busNumber,
        pickupLocation: { lat: pLat, lng: pLng }, dropLocation: { lat: dLat, lng: dLng },
        photo: pendingPhoto || students[idx].photo };
      Storage.saveData(Storage.KEYS.STUDENTS, students);
      Utils.toast('Student updated.', 'success');
    } else {
      if (students.some(s => s.id === id)) { Utils.toast('Duplicate ID.', 'error'); return; }
      students.push({ id, name, className, address, parentMobile, parentUserId, parentPassword,
        busNumber, pickupLocation: { lat: pLat, lng: pLng }, dropLocation: { lat: dLat, lng: dLng },
        photo: pendingPhoto || DemoData.makeAvatar('#3b82f6', name.charAt(0).toUpperCase()),
        status: 'waiting', boardedAt: null, droppedAt: null,
        boardedLocation: null, droppedLocation: null });
      Storage.saveData(Storage.KEYS.STUDENTS, students);

      const users = Storage.getData(Storage.KEYS.USERS, []);
      if (!users.some(u => u.userId === parentUserId)) {
        users.push({ userId: parentUserId, password: parentPassword, role: 'parent',
          name: 'Parent of ' + name, studentId: id, mobile: parentMobile || '9999999999' });
        Storage.saveData(Storage.KEYS.USERS, users);
      }
      Notifications.push(parentUserId, `Welcome! Your child ${name} has been registered.`, 'info');
      Utils.toast('Student added.', 'success');
    }

    closeModal('studentModal');
    renderStats(); renderStudents(); renderFleet();
  }

  function confirmDeleteStudent(id) {
    deletingStudentId = id;
    deletingBusNumber = null;
    const s = Storage.getData(Storage.KEYS.STUDENTS, []).find(x => x.id === id);
    document.getElementById('confirmDeleteText').textContent =
      `Are you sure you want to remove "${s ? s.name : id}"?`;
    openModal('confirmDeleteModal');
  }

  /* ============ REPORTS ============ */
  function renderReports() {
    const list = Reports.getAll();
    const container = document.getElementById('reportsList');
    if (!list.length) {
      container.innerHTML = `<div class="empty-state"><i class="fa-solid fa-check-circle"></i>
        <p>No reports. All clear!</p></div>`;
      return;
    }
    container.innerHTML = list.map(r => `
      <div class="report-card ${r.status === 'resolved' ? 'resolved' : ''}">
        <div class="report-head">
          <h4><i class="fa-solid ${r.status === 'resolved' ? 'fa-circle-check' : 'fa-triangle-exclamation'}"></i>
            ${Utils.escapeHtml(r.problemType)}</h4>
          <span class="badge badge-${r.status}">${r.status}</span>
        </div>
        <div class="report-meta">
          <strong>Bus:</strong> ${Utils.escapeHtml(r.busNumber)}<br>
          <strong>Driver:</strong> ${Utils.escapeHtml(r.driverName)}<br>
          <strong>Time:</strong> ${Utils.formatDateTime(r.time)}
        </div>
        <div class="report-message">${Utils.escapeHtml(r.message)}</div>
        <div class="report-meta"><strong>Location:</strong>
          ${r.location ? r.location.lat.toFixed(4) + ', ' + r.location.lng.toFixed(4) : '—'}</div>
        <div class="report-actions">
          ${r.status === 'active' ? `<button type="button" class="btn btn-success btn-sm" data-resolve="${r.id}">
            <i class="fa-solid fa-check"></i> Mark Resolved</button>` : ''}
          <button type="button" class="btn btn-danger btn-sm" data-delrep="${r.id}">
            <i class="fa-solid fa-trash"></i> Delete</button>
        </div>
      </div>`).join('');

    container.querySelectorAll('[data-resolve]').forEach(b => b.addEventListener('click', () => {
      Reports.resolve(b.dataset.resolve); Utils.toast('Resolved.', 'success');
      renderReports(); renderStats();
    }));
    container.querySelectorAll('[data-delrep]').forEach(b => b.addEventListener('click', () => {
      Reports.remove(b.dataset.delrep); Utils.toast('Deleted.', 'info');
      renderReports(); renderStats();
    }));
  }

  /* ============ HISTORY ============ */
  function renderHistory(filter = 'all') {
    const all = Storage.getData(Storage.KEYS.JOURNEYS, [])
      .sort((a, b) => new Date(b.date) - new Date(a.date));
    const journeys = filter === 'all' ? all : all.filter(j => j.outcome === filter);

    const tbody = document.getElementById('historyTableBody');
    if (!journeys.length) {
      tbody.innerHTML = `<tr><td colspan="7">
        <div class="empty-state"><i class="fa-solid fa-clock-rotate-left"></i>
          <p>No journeys in this category.</p></div></td></tr>`;
      return;
    }
    tbody.innerHTML = journeys.map(j => {
      const o = j.outcome || 'flawless';
      const badgeCls = { flawless: 'badge-completed', delayed: 'badge-boarded', problem: 'badge-active' }[o];
      const label = { flawless: '✅ Flawless', delayed: '⏱ Delayed', problem: '⚠ Problem' }[o];
      return `<tr>
        <td><strong>${Utils.escapeHtml(j.studentName)}</strong></td>
        <td>${Utils.escapeHtml(j.busNumber)}</td>
        <td>${Utils.formatDate(j.date)}</td>
        <td>${Utils.formatTime(j.boardedAt)}</td>
        <td>${Utils.formatTime(j.droppedAt)}</td>
        <td><span class="badge ${badgeCls}">${label}</span></td>
        <td>${Utils.escapeHtml(j.notes || '—')}</td>
      </tr>`;
    }).join('');

    document.querySelectorAll('.jf-btn').forEach(b => {
      b.onclick = () => {
        document.querySelectorAll('.jf-btn').forEach(x => x.classList.remove('active'));
        b.classList.add('active');
        renderHistory(b.dataset.filter);
      };
    });
  }

  /* ============ MAP ============ */
  function drawAdminMap(busNumber) {
    if (!busNumber) return;
    const students = Storage.getData(Storage.KEYS.STUDENTS, [])
      .filter(s => s.busNumber === busNumber && s.pickupLocation);
    const loc = MapModule.getSavedBusLocation(busNumber) ||
      (students[0] ? students[0].pickupLocation : DemoData.DEFAULT_BUS_LOCATION);

    MapModule.init('adminMap', loc);
    MapModule.drawBusRoute({
      busNumber, students, busLocation: loc, school: MapModule.SCHOOL_LOCATION
    });
  }

  function refreshMap() {
    if (!mapReady) return;
    const sel = document.getElementById('mapBusSelect');
    if (sel && sel.value) drawAdminMap(sel.value);
  }

  function openModal(id) { document.getElementById(id).classList.add('open'); }
  function closeModal(id) { document.getElementById(id).classList.remove('open'); }
});