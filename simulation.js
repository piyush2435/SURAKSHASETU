/* ============================================
   SURAKSHA SETU — Shared Bus Simulation
   ============================================ */

const Simulation = (() => {

  const TICK_MS = 1200;
  const STEPS_PER_LEG = 20;

  function buildLegs(busNumber) {
    const students = Storage.getData(Storage.KEYS.STUDENTS, [])
      .filter(s => s.busNumber === busNumber && s.pickupLocation)
      .sort((a, b) => a.id.localeCompare(b.id));
    const points = students.map(s => s.pickupLocation);
    points.push(MapModule.SCHOOL_LOCATION);
    return points;
  }

  function getState(busNumber) {
    const all = Storage.getData(Storage.KEYS.SIM_STATE, { active: {}, leader: {} });
    return all.active[busNumber] || null;
  }

  function isActive(busNumber) {
    const st = getState(busNumber);
    return !!(st && st.running);
  }

  function start(busNumber) {
    if (isActive(busNumber)) return;
    const legs = buildLegs(busNumber);
    if (legs.length < 2) {
      Utils.toast('Not enough stops to simulate.', 'warning');
      return;
    }

    const start = MapModule.getSavedBusLocation(busNumber) || legs[0];
    const all = Storage.getData(Storage.KEYS.SIM_STATE, { active: {}, leader: {} });
    all.active[busNumber] = {
      running: true, legs, legIdx: 0, stepInLeg: 0,
      stepsPerLeg: STEPS_PER_LEG, startedAt: Date.now(),
      current: { lat: start.lat, lng: start.lng }, lastTickAt: Date.now()
    };
    all.leader[busNumber] = Utils.uid('leader');
    Storage.saveData(Storage.KEYS.SIM_STATE, all);
    Storage.saveData('suraksha_my_leader_id_' + busNumber, all.leader[busNumber]);
    Utils.toast(`Simulated journey started for ${busNumber}.`, 'success');
  }

  function stop(busNumber) {
    const all = Storage.getData(Storage.KEYS.SIM_STATE, { active: {}, leader: {} });
    if (all.active[busNumber]) all.active[busNumber].running = false;
    delete all.leader[busNumber];
    Storage.saveData(Storage.KEYS.SIM_STATE, all);
    Storage.removeData('suraksha_my_leader_id_' + busNumber);
    Utils.toast(`Simulated journey stopped for ${busNumber}.`, 'info');
  }

  function tick(busNumber) {
    const all = Storage.getData(Storage.KEYS.SIM_STATE, { active: {}, leader: {} });
    const st = all.active[busNumber];
    if (!st || !st.running) return false;

    const myLeaderId = Storage.getData('suraksha_my_leader_id_' + busNumber);
    if (myLeaderId && all.leader[busNumber] && myLeaderId !== all.leader[busNumber]) {
      return false;
    }

    const from = st.current;
    const to = st.legs[st.legIdx];
    if (!to) { stop(busNumber); return false; }

    const dLat = (to.lat - from.lat) / st.stepsPerLeg;
    const dLng = (to.lng - from.lng) / st.stepsPerLeg;
    const newLat = from.lat + dLat;
    const newLng = from.lng + dLng;

    st.current = { lat: newLat, lng: newLng };
    st.stepInLeg += 1;
    st.lastTickAt = Date.now();

    if (st.stepInLeg >= st.stepsPerLeg) {
      st.stepInLeg = 0;
      st.legIdx += 1;
      if (st.legIdx >= st.legs.length) {
        st.running = false;
        Utils.toast(`${busNumber} reached the school.`, 'success');
      }
    }

    MapModule.saveBusLocation(busNumber, newLat, newLng);
    Storage.saveData(Storage.KEYS.SIM_STATE, all);
    return true;
  }

  function statusText(busNumber) {
    const st = getState(busNumber);
    if (!st) return 'Idle';
    if (!st.running) return 'Stopped';
    return `Running · leg ${st.legIdx + 1}/${st.legs.length}`;
  }

  function getSharedLocation(busNumber) {
    return MapModule.getSavedBusLocation(busNumber);
  }

  return { TICK_MS, start, stop, tick, isActive, statusText, getSharedLocation, getState };
})();