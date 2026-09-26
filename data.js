/* ============================================
   SURAKSHA SETU — Seed / Demo Data
   ============================================ */

const DemoData = (() => {

  function makeAvatar(color, letter) {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120">
      <rect width="120" height="120" fill="${color}"/>
      <text x="50%" y="54%" font-family="Segoe UI, sans-serif" font-size="56"
        fill="#fff" text-anchor="middle" dominant-baseline="middle">${letter}</text>
    </svg>`;
    return 'data:image/svg+xml;base64,' + btoa(svg);
  }

  const SAMPLE_PHOTOS = {
    boy:   makeAvatar('#3b82f6', 'B'),
    girl:  makeAvatar('#ec4899', 'G'),
    boy2:  makeAvatar('#16a34a', 'B'),
    girl2: makeAvatar('#f59e0b', 'G'),
    boy3:  makeAvatar('#8b5cf6', 'B')
  };

  const DEFAULT_BUS_LOCATION = { lat: 25.2138, lng: 75.8648 };

  const BUSES = [
    {
      busNumber: 'BUS-01', routeNumber: 'R-101', routeName: 'Kota Central → School',
      driverId: 'driver001', driverName: 'Amit Kumar',
      driverLicense: 'RJ45-2019-0012345', driverPhone: '9876500001',
      capacity: 40, status: 'active'
    },
    {
      busNumber: 'BUS-02', routeNumber: 'R-102', routeName: 'Talwandi → School',
      driverId: 'driver002', driverName: 'Suresh Yadav',
      driverLicense: 'RJ45-2018-0098765', driverPhone: '9876500002',
      capacity: 40, status: 'active'
    }
  ];

  /* ---------- HOSPITALS + POLICE STATIONS (near Kota, Rajasthan) ---------- */
  const SERVICES = [
    {
      id: 'HOSP-01', type: 'hospital', name: 'MBS Hospital Kota',
      phone: '0744-2320001', emergencyPhone: '108',
      address: 'Nayapura, Kota, Rajasthan',
      location: { lat: 25.1846, lng: 75.8410 },
      services: ['Emergency', 'Trauma', 'ICU', 'Ambulance']
    },
    {
      id: 'HOSP-02', type: 'hospital', name: 'New Medical College Hospital',
      phone: '0744-2411000', emergencyPhone: '108',
      address: 'Rangbari, Kota, Rajasthan',
      location: { lat: 25.1464, lng: 75.8433 },
      services: ['Emergency', 'Surgery', 'Pediatric']
    },
    {
      id: 'HOSP-03', type: 'hospital', name: 'Sudha Hospital',
      phone: '0744-2450100', emergencyPhone: '108',
      address: 'Talwandi, Kota, Rajasthan',
      location: { lat: 25.1552, lng: 75.8623 },
      services: ['Emergency', 'General', 'Ambulance']
    },
    {
      id: 'POL-01', type: 'police', name: 'Kota City Police Station',
      phone: '0744-2222000', emergencyPhone: '100',
      address: 'Kota Junction, Rajasthan',
      location: { lat: 25.1775, lng: 75.8372 },
      services: ['Patrol', 'Traffic', 'Emergency']
    },
    {
      id: 'POL-02', type: 'police', name: 'Talwandi Police Station',
      phone: '0744-2222300', emergencyPhone: '100',
      address: 'Talwandi, Kota, Rajasthan',
      location: { lat: 25.1605, lng: 75.8650 },
      services: ['Patrol', 'Traffic']
    },
    {
      id: 'POL-03', type: 'police', name: 'Traffic Police Kota',
      phone: '0744-2222400', emergencyPhone: '1073',
      address: 'Kota, Rajasthan',
      location: { lat: 25.1900, lng: 75.8500 },
      services: ['Traffic Control', 'Accident Response']
    }
  ];

  const USERS = [
    { userId: 'admin001',  password: 'admin123',  role: 'admin',  name: 'Principal Sharma',  mobile: '9812345678' },
    { userId: 'driver001', password: 'driver123', role: 'driver', name: 'Amit Kumar',       mobile: '9876500001', busNumber: 'BUS-01' },
    { userId: 'driver002', password: 'driver123', role: 'driver', name: 'Suresh Yadav',     mobile: '9876500002', busNumber: 'BUS-02' },
    { userId: 'parent001', password: 'parent123', role: 'parent', name: 'Mr. Rajesh Sharma', mobile: '9876543210', studentId: 'STU001' },
    { userId: 'parent002', password: 'parent123', role: 'parent', name: 'Mrs. Sunita Verma', mobile: '9876543211', studentId: 'STU002' },
    { userId: 'parent003', password: 'parent123', role: 'parent', name: 'Mr. Anil Gupta',    mobile: '9876543212', studentId: 'STU003' },
    { userId: 'parent004', password: 'parent123', role: 'parent', name: 'Mrs. Kavita Singh', mobile: '9876543213', studentId: 'STU004' },
    { userId: 'parent005', password: 'parent123', role: 'parent', name: 'Mr. Deepak Meena',  mobile: '9876543214', studentId: 'STU005' }
  ];

  function seedStudents() {
    return [
      {
        id: 'STU001', name: 'Rahul Sharma', className: '8th',
        address: 'Kota, Rajasthan', parentMobile: '9876543210',
        parentUserId: 'parent001', parentPassword: 'parent123',
        busNumber: 'BUS-01',
        pickupLocation: { lat: 25.2138, lng: 75.8648 },
        dropLocation:   { lat: 25.1800, lng: 75.8500 },
        photo: SAMPLE_PHOTOS.boy, status: 'waiting',
        boardedAt: null, droppedAt: null,
        boardedLocation: null, droppedLocation: null
      },
      {
        id: 'STU002', name: 'Priya Verma', className: '9th',
        address: 'Talwandi, Kota', parentMobile: '9876543211',
        parentUserId: 'parent002', parentPassword: 'parent123',
        busNumber: 'BUS-01',
        pickupLocation: { lat: 25.2200, lng: 75.8700 },
        dropLocation:   { lat: 25.1820, lng: 75.8520 },
        photo: SAMPLE_PHOTOS.girl, status: 'boarded',
        boardedAt: new Date().setHours(8, 15, 0, 0),
        droppedAt: null, boardedLocation: 'Pickup Point', droppedLocation: null
      },
      {
        id: 'STU003', name: 'Aarav Gupta', className: '7th',
        address: 'Borkhera, Kota', parentMobile: '9876543212',
        parentUserId: 'parent003', parentPassword: 'parent123',
        busNumber: 'BUS-01',
        pickupLocation: { lat: 25.2100, lng: 75.8600 },
        dropLocation:   { lat: 25.1790, lng: 75.8490 },
        photo: SAMPLE_PHOTOS.boy2, status: 'dropped',
        boardedAt: new Date().setHours(8, 20, 0, 0),
        droppedAt: new Date().setHours(15, 42, 0, 0),
        boardedLocation: 'Pickup Point', droppedLocation: 'School Gate'
      },
      {
        id: 'STU004', name: 'Ananya Singh', className: '10th',
        address: 'Vigyan Nagar, Kota', parentMobile: '9876543213',
        parentUserId: 'parent004', parentPassword: 'parent123',
        busNumber: 'BUS-01',
        pickupLocation: { lat: 25.2180, lng: 75.8680 },
        dropLocation:   { lat: 25.1830, lng: 75.8530 },
        photo: SAMPLE_PHOTOS.girl2, status: 'waiting',
        boardedAt: null, droppedAt: null,
        boardedLocation: null, droppedLocation: null
      },
      {
        id: 'STU005', name: 'Vivaan Meena', className: '6th',
        address: 'Rampura, Kota', parentMobile: '9876543214',
        parentUserId: 'parent005', parentPassword: 'parent123',
        busNumber: 'BUS-02',
        pickupLocation: { lat: 25.2250, lng: 75.8750 },
        dropLocation:   { lat: 25.1850, lng: 75.8550 },
        photo: SAMPLE_PHOTOS.boy3, status: 'waiting',
        boardedAt: null, droppedAt: null,
        boardedLocation: null, droppedLocation: null
      }
    ];
  }

  function seedJourneys() {
    const today = new Date();
    const daysAgo = n => new Date(today.getTime() - n * 86400000).getTime();
    const atHour = (base, h, m) => {
      const d = new Date(base); d.setHours(h, m, 0, 0); return d.getTime();
    };

    return [
      { id: 'journey-seed-01', studentId: 'STU001', studentName: 'Rahul Sharma',
        busNumber: 'BUS-01', driverId: 'driver001', date: daysAgo(1),
        boardedAt: atHour(daysAgo(1), 8, 12), droppedAt: atHour(daysAgo(1), 15, 40),
        boardedLocation: 'Pickup Point', droppedLocation: 'School Gate',
        status: 'completed', outcome: 'flawless' },
      { id: 'journey-seed-02', studentId: 'STU001', studentName: 'Rahul Sharma',
        busNumber: 'BUS-01', driverId: 'driver001', date: daysAgo(2),
        boardedAt: atHour(daysAgo(2), 8, 18), droppedAt: atHour(daysAgo(2), 15, 45),
        boardedLocation: 'Pickup Point', droppedLocation: 'School Gate',
        status: 'completed', outcome: 'flawless' },
      { id: 'journey-seed-03', studentId: 'STU001', studentName: 'Rahul Sharma',
        busNumber: 'BUS-01', driverId: 'driver001', date: daysAgo(3),
        boardedAt: atHour(daysAgo(3), 8, 22), droppedAt: atHour(daysAgo(3), 16, 5),
        boardedLocation: 'Pickup Point', droppedLocation: 'School Gate',
        status: 'completed', outcome: 'delayed',
        notes: 'Bus delayed due to traffic near main road.' },
      { id: 'journey-seed-04', studentId: 'STU002', studentName: 'Priya Verma',
        busNumber: 'BUS-01', driverId: 'driver001', date: daysAgo(1),
        boardedAt: atHour(daysAgo(1), 8, 20), droppedAt: atHour(daysAgo(1), 15, 55),
        boardedLocation: 'Pickup Point', droppedLocation: 'School Gate',
        status: 'completed', outcome: 'flawless' },
      { id: 'journey-seed-05', studentId: 'STU002', studentName: 'Priya Verma',
        busNumber: 'BUS-01', driverId: 'driver001', date: daysAgo(4),
        boardedAt: atHour(daysAgo(4), 8, 25), droppedAt: atHour(daysAgo(4), 16, 30),
        boardedLocation: 'Pickup Point', droppedLocation: 'School Gate',
        status: 'completed', outcome: 'problem',
        notes: 'Bus breakdown — engine stopped. Students transferred to BUS-02.' },
      { id: 'journey-seed-06', studentId: 'STU003', studentName: 'Aarav Gupta',
        busNumber: 'BUS-01', driverId: 'driver001', date: daysAgo(1),
        boardedAt: atHour(daysAgo(1), 8, 22), droppedAt: atHour(daysAgo(1), 15, 42),
        boardedLocation: 'Pickup Point', droppedLocation: 'School Gate',
        status: 'completed', outcome: 'flawless' },
      { id: 'journey-seed-07', studentId: 'STU003', studentName: 'Aarav Gupta',
        busNumber: 'BUS-01', driverId: 'driver001', date: daysAgo(5),
        boardedAt: atHour(daysAgo(5), 8, 30), droppedAt: atHour(daysAgo(5), 16, 10),
        boardedLocation: 'Pickup Point', droppedLocation: 'School Gate',
        status: 'completed', outcome: 'delayed',
        notes: 'Heavy rain — slow route.' },
      { id: 'journey-seed-08', studentId: 'STU004', studentName: 'Ananya Singh',
        busNumber: 'BUS-01', driverId: 'driver001', date: daysAgo(2),
        boardedAt: atHour(daysAgo(2), 8, 14), droppedAt: atHour(daysAgo(2), 15, 38),
        boardedLocation: 'Pickup Point', droppedLocation: 'School Gate',
        status: 'completed', outcome: 'flawless' },
      { id: 'journey-seed-09', studentId: 'STU005', studentName: 'Vivaan Meena',
        busNumber: 'BUS-02', driverId: 'driver002', date: daysAgo(1),
        boardedAt: atHour(daysAgo(1), 8, 10), droppedAt: atHour(daysAgo(1), 15, 35),
        boardedLocation: 'Pickup Point', droppedLocation: 'School Gate',
        status: 'completed', outcome: 'flawless' },
      { id: 'journey-seed-10', studentId: 'STU005', studentName: 'Vivaan Meena',
        busNumber: 'BUS-02', driverId: 'driver002', date: daysAgo(6),
        boardedAt: atHour(daysAgo(6), 8, 12), droppedAt: atHour(daysAgo(6), 16, 45),
        boardedLocation: 'Pickup Point', droppedLocation: 'School Gate',
        status: 'completed', outcome: 'problem',
        notes: 'Road block due to local procession. Rerouted.' }
    ];
  }

  function seedIfEmpty() {
    if (Storage.getData(Storage.KEYS.SEEDED)) return;

    Storage.saveData(Storage.KEYS.USERS, USERS);
    Storage.saveData(Storage.KEYS.BUSES, BUSES);
    Storage.saveData(Storage.KEYS.STUDENTS, seedStudents());
    Storage.saveData(Storage.KEYS.REPORTS, []);
    Storage.saveData(Storage.KEYS.JOURNEYS, seedJourneys());
    Storage.saveData(Storage.KEYS.NOTIFICATIONS, [
      { id: 'notif-' + Date.now(), target: 'parent001', type: 'info',
        message: 'Welcome to Suraksha Setu! Your child\'s bus updates will appear here.',
        time: new Date().toISOString(), read: false }
    ]);
    Storage.saveData(Storage.KEYS.BUS_LOCATION, {
      'BUS-01': { ...DEFAULT_BUS_LOCATION, updatedAt: new Date().toISOString() },
      'BUS-02': { lat: 25.2250, lng: 75.8750, updatedAt: new Date().toISOString() }
    });
    Storage.saveData(Storage.KEYS.SIM_STATE, { active: {}, leader: {} });
    Storage.saveData(Storage.KEYS.SERVICES, SERVICES);
    Storage.saveData(Storage.KEYS.EMERGENCY_ALERTS, []);
    Storage.saveData(Storage.KEYS.SEEDED, true);
  }

  return { seedIfEmpty, BUSES, USERS, SERVICES, DEFAULT_BUS_LOCATION, makeAvatar };
})();