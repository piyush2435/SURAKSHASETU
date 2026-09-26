/* ============================================
   SURAKSHA SETU — Parent Dashboard
   ============================================ */

document.addEventListener('DOMContentLoaded', () => {
  const session = Auth.requireRole('parent');
  if (!session) return;

  const students = Storage.getData(Storage.KEYS.STUDENTS, []);
  const student = students.find(s => s.parentUserId === session.userId);

  if (!student) {
    Utils.toast('No student linked to your account.', 'error');
    document.querySelector('.content').innerHTML = `
      <div class="empty-state"><i class="fa-solid fa-user-slash"></i>
      <p>No student is linked to your account.</p></div>`;
    return;
  }

  let miniMapReady = false;
  let fullMapReady = false;

  setupSidebar();
  setupLogout();
  renderProfile(student);
  renderStatus(student);
  renderStudentBanner(student);
  renderNotifications(session.userId);
  renderHistory(student, 'all');
  renderParentEmergencyBanner(student);

  setInterval(liveRefresh, 2000);
  setTimeout(() => { miniMapReady = true; initMiniMap(); }, 200);

  function setupSidebar() {
    document.getElementById('sidebarUserName').textContent = session.name;
    document.querySelectorAll('.side-link').forEach(btn =>
      btn.addEventListener('click', () => switchSection(btn.dataset.section)));
    document.querySelectorAll('[data-jump]').forEach(btn =>
      btn.addEventListener('click', () => switchSection(btn.dataset.jump)));

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

    if (id === 'sec-dashboard' && miniMapReady) setTimeout(initMiniMap, 60);
    if (id === 'sec-map') {
      fullMapReady = true;
      setTimeout(initFullMap, 60);
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

  function liveRefresh() {
    const fresh = Storage.getData(Storage.KEYS.STUDENTS, []).find(s => s.id === student.id);
    if (!fresh) return;
    renderStatus(fresh);
    renderStudentBanner(fresh);
    updateMaps(fresh);
    renderParentEmergencyBanner(fresh);
  }

  function renderProfile(s) {
    document.getElementById('stuPhoto').src = s.photo || '';
    document.getElementById('stuName').textContent = s.name;
    document.getElementById('stuId').textContent = 'ID: ' + s.id;
    document.getElementById('stuClass').textContent = s.className;
    document.getElementById('stuAddress').textContent = s.address;
    document.getElementById('stuMobile').textContent = s.parentMobile;
    document.getElementById('stuBus').textContent = s.busNumber;
    const buses = Storage.getData(Storage.KEYS.BUSES, []);
    const bus = buses.find(b => b.busNumber === s.busNumber);
    document.getElementById('stuDriver').textContent = bus ? bus.driverName : '—';
  }

  function renderStatus(s) {
    const map = {
      waiting:     { label: 'Waiting for Bus', cls: 'waiting' },
      approaching: { label: 'Bus Approaching', cls: 'approaching' },
      boarded:     { label: 'Boarded',         cls: 'boarded' },
      onbus:       { label: 'On Bus',          cls: 'onbus' },
      dropped:     { label: 'Dropped',         cls: 'dropped' },
      completed:   { label: 'Journey Completed', cls: 'completed' }
    };
    const info = map[s.status] || map.waiting;
    const el = document.getElementById('busStatusMain');
    el.textContent = info.label.toUpperCase();
    el.className = 'status-main ' + info.cls;
    document.getElementById('busStatusBusNo').textContent = s.busNumber;
    const loc = MapModule.getSavedBusLocation(s.busNumber);
    document.getElementById('busStatusUpdated').textContent =
      loc ? Utils.formatTime(loc.updatedAt) : '—';
  }

  function renderStudentBanner(s) {
    const el = document.getElementById('studentStatusBanner');
    if (s.status === 'boarded') {
      el.className = 'student-status-banner boarded';
      el.innerHTML = `
        <i class="fa-solid fa-circle-check"></i>
        <div class="banner-text">
          <div>🟢 BOARDED — Your child is on Bus ${Utils.escapeHtml(s.busNumber)}</div>
          <div class="banner-time">Boarded at: ${Utils.formatTime(s.boardedAt)}</div>
        </div>`;
    } else if (s.status === 'dropped') {
      el.className = 'student-status-banner dropped';
      el.innerHTML = `
        <i class="fa-solid fa-flag-checkered"></i>
        <div class="banner-text">
          <div>🔵 DROPPED — Your child was dropped safely</div>
          <div class="banner-time">Dropped at: ${Utils.formatTime(s.droppedAt)}</div>
        </div>`;
    } else {
      el.className = 'student-status-banner waiting';
      el.innerHTML = `
        <i class="fa-solid fa-clock"></i>
        <div class="banner-text">
          <div>⏳ WAITING — Your child has not boarded yet.</div>
          <div class="banner-time">Bus: ${Utils.escapeHtml(s.busNumber)}</div>
        </div>`;
    }
  }

  /* Emergency banner for parent */
  function renderParentEmergencyBanner(s) {
    const container = document.getElementById('parentEmergencyBanner');
    if (!container) return;

    const alerts = Emergency.getForBus(s.busNumber).filter(a => a.status === 'active');
    if (!alerts.length) {
      container.style.display = 'none';
      container.innerHTML = '';
      return;
    }

    const latest = alerts[0];
    const hospital = latest.notifiedServices.find(x => x.serviceType === 'hospital');
    const police = latest.notifiedServices.find(x => x.serviceType === 'police');

    container.style.display = 'block';
    container.innerHTML = `
      <div class="parent-emg-banner">
        <i class="fa-solid fa-tower-broadcast"></i>
        <div class="emg-banner-body">
          <div class="emg-banner-title">🚨 EMERGENCY on Bus ${Utils.escapeHtml(latest.busNumber)}</div>
          <div class="emg-banner-text">
            <strong>${Utils.escapeHtml(latest.emergencyType)}</strong> — ${Utils.escapeHtml(latest.message)}<br>
            ${hospital ? `🏥 Hospital notified: <strong>${Utils.escapeHtml(hospital.serviceName)}</strong><br>` : ''}
            ${police ? `🚔 Police notified: <strong>${Utils.escapeHtml(police.serviceName)}</strong>` : ''}
          </div>
          <div class="emg-banner-time">Raised ${Utils.timeAgo(latest.time)}</div>
        </div>
      </div>`;
  }

  function getStopsForBus(busNumber) {
    return Storage.getData(Storage.KEYS.STUDENTS, [])
      .filter(s => s.busNumber === busNumber && s.pickupLocation);
  }

  function initMiniMap() {
    const el = document.getElementById('parentMiniMap');
    if (!el) return;
    MapModule.init('parentMiniMap', student.pickupLocation);
    const loc = MapModule.getSavedBusLocation(student.busNumber) || student.pickupLocation;
    MapModule.drawBusRoute({
      busNumber: student.busNumber,
      students: getStopsForBus(student.busNumber),
      busLocation: loc,
      school: MapModule.SCHOOL_LOCATION
    });
  }

  function initFullMap() {
    const el = document.getElementById('parentMap');
    if (!el) return;
    MapModule.init('parentMap', student.pickupLocation);
    const loc = MapModule.getSavedBusLocation(student.busNumber) || student.pickupLocation;
    MapModule.drawBusRoute({
      busNumber: student.busNumber,
      students: getStopsForBus(student.busNumber),
      busLocation: loc,
      school: MapModule.SCHOOL_LOCATION
    });
  }

  function updateMaps(fresh) {
    const loc = MapModule.getSavedBusLocation(fresh.busNumber);
    if (!loc) return;
    const busNumber = fresh.busNumber;

    if (miniMapReady) {
      const mm = document.getElementById('parentMiniMap');
      if (mm && mm._leaflet_id) {
        MapModule.init('parentMiniMap', student.pickupLocation);
        MapModule.drawBusRoute({
          busNumber, students: getStopsForBus(busNumber),
          busLocation: loc, school: MapModule.SCHOOL_LOCATION
        });
      }
    }
    if (fullMapReady) {
      const fm = document.getElementById('parentMap');
      if (fm && fm._leaflet_id) {
        MapModule.init('parentMap', student.pickupLocation);
        MapModule.drawBusRoute({
          busNumber, students: getStopsForBus(busNumber),
          busLocation: loc, school: MapModule.SCHOOL_LOCATION
        });
      }
    }
  }

  function renderNotifications(userId) {
    const list = Notifications.getFor(userId).slice(0, 12);
    const container = document.getElementById('notifList');
    if (!list.length) {
      container.innerHTML = `<div class="empty-state"><i class="fa-regular fa-bell"></i><p>No notifications yet.</p></div>`;
      return;
    }
    container.innerHTML = list.map(n => {
      const isEmg = n.type === 'error' || n.message.includes('🚨');
      return `
        <div class="notif-item" ${isEmg ? 'style="border-left-color:#dc2626;background:#fef2f2;"' : ''}>
          <i class="fa-solid ${isEmg ? 'fa-tower-broadcast' : 'fa-bell'}"
             ${isEmg ? 'style="color:#dc2626;"' : ''}></i>
          <div class="notif-text">${Utils.escapeHtml(n.message)}
            <div class="notif-time">${Utils.timeAgo(n.time)}</div>
          </div>
        </div>`;
    }).join('');
    const unread = Notifications.unreadCount(userId);
    const dot = document.getElementById('notifDot');
    if (dot) dot.style.display = unread > 0 ? 'block' : 'none';
    Notifications.markAllRead(userId);
  }

  function renderHistory(s, filter = 'all') {
    const all = Storage.getData(Storage.KEYS.JOURNEYS, [])
      .filter(j => j.studentId === s.id)
      .sort((a, b) => new Date(b.date) - new Date(a.date));
    const journeys = filter === 'all' ? all : all.filter(j => j.outcome === filter);

    const container = document.getElementById('historyList');
    if (!journeys.length) {
      container.innerHTML = `<div class="empty-state"><i class="fa-solid fa-clock-rotate-left"></i>
        <p>No journeys in this category.</p></div>`;
      return;
    }

    container.innerHTML = journeys.map(j => {
      const o = j.outcome || 'flawless';
      const outcomeMap = {
        flawless: { badge: 'badge-completed', icon: 'fa-circle-check', label: 'Flawless', cls: 'flawless' },
        delayed:  { badge: 'badge-boarded',  icon: 'fa-clock',       label: 'Delayed',  cls: 'delayed' },
        problem:  { badge: 'badge-active',   icon: 'fa-triangle-exclamation', label: 'Had Problem', cls: 'problem' }
      };
      const info = outcomeMap[o];
      return `
        <div class="history-card ${info.cls}">
          <div class="hist-top">
            <span class="hist-date">
              <i class="fa-regular fa-calendar"></i> ${Utils.formatDate(j.date)}
            </span>
            <span class="badge ${info.badge}">
              <i class="fa-solid ${info.icon}"></i> ${info.label}
            </span>
          </div>
          <div class="hist-grid">
            <div><div class="label">Bus</div><div class="val">${Utils.escapeHtml(j.busNumber)}</div></div>
            <div><div class="label">Boarded</div><div class="val">${Utils.formatTime(j.boardedAt)}</div></div>
            <div><div class="label">Dropped</div><div class="val">${Utils.formatTime(j.droppedAt)}</div></div>
            <div><div class="label">Status</div><div class="val">${Utils.escapeHtml(j.status)}</div></div>
          </div>
          ${j.notes ? `<div class="hist-notes"><i class="fa-solid fa-circle-info"></i> ${Utils.escapeHtml(j.notes)}</div>` : ''}
        </div>`;
    }).join('');

    document.querySelectorAll('.jf-btn').forEach(b => {
      b.onclick = () => {
        document.querySelectorAll('.jf-btn').forEach(x => x.classList.remove('active'));
        b.classList.add('active');
        renderHistory(s, b.dataset.filter);
      };
    });
  }
});