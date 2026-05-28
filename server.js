const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const app = express();
const PORT = 3000;
const DATA_FILE = path.join(__dirname, 'data', 'reservations.json');

// Middleware
app.use(cors());
app.use(express.json());

// Security middleware to prevent access to backend files and database
app.use((req, res, next) => {
  const forbidden = ['/data', '/server.js', '/package.json', '/package-lock.json', '/.git', '/.gitignore'];
  if (forbidden.some(path => req.path.startsWith(path))) {
    return res.status(403).send('Forbidden');
  }
  next();
});

app.use(express.static(__dirname)); // Serve static files (index.html, css, js, images)

// Helper Functions
function readReservations() {
  try {
    const data = fs.readFileSync(DATA_FILE, 'utf-8');
    return JSON.parse(data);
  } catch {
    return [];
  }
}

function writeReservations(reservations) {
  const dir = path.dirname(DATA_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(DATA_FILE, JSON.stringify(reservations, null, 2), 'utf-8');
}

// API ROUTES

// POST /api/reservations â€” Create new reservation
app.post('/api/reservations', (req, res) => {
  const { name, email, phone, guests, date, time, notes } = req.body;

  // Validation
  const errors = [];
  if (!name || name.trim().length < 2) errors.push('Name is required (min 2 characters).');
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.push('Valid email is required.');
  if (!date) errors.push('Date is required.');
  if (!time) errors.push('Time is required.');
  if (!guests) errors.push('Number of guests is required.');

  // Check date is not in the past
  const reservationDate = new Date(date + 'T' + time);
  if (reservationDate < new Date()) {
    errors.push('Reservation date/time cannot be in the past.');
  }

  if (errors.length > 0) {
    return res.status(400).json({ success: false, errors });
  }

  const reservations = readReservations();

  const newReservation = {
    id: crypto.randomUUID(),
    name: name.trim(),
    email: email.trim().toLowerCase(),
    phone: phone ? phone.trim() : '',
    guests: parseInt(guests),
    date,
    time,
    notes: notes ? notes.trim() : '',
    status: 'pending', // pending, confirmed, cancelled
    createdAt: new Date().toISOString()
  };

  reservations.push(newReservation);
  writeReservations(reservations);

  console.log(`\n✨ New reservation from ${newReservation.name}`);
  console.log(`   📅 ${newReservation.date} at ${newReservation.time}`);
  console.log(`   👥 ${newReservation.guests} guests`);
  console.log(`   📧 ${newReservation.email}\n`);

  res.status(201).json({
    success: true,
    message: 'Reservation created successfully!',
    reservation: newReservation
  });
});

// GET /api/reservations â€” Get all reservations (for admin)
app.get('/api/reservations', (req, res) => {
  const reservations = readReservations();

  // Optional filtering by status or date
  let filtered = [...reservations];

  if (req.query.status && req.query.status !== 'all') {
    filtered = filtered.filter(r => r.status === req.query.status);
  }
  if (req.query.date) {
    filtered = filtered.filter(r => r.date === req.query.date);
  }

  // Sort by date (newest first)
  filtered.sort((a, b) => new Date(b.date + 'T' + b.time) - new Date(a.date + 'T' + a.time));

  res.json({ success: true, count: filtered.length, reservations: filtered });
});

// PATCH /api/reservations/:id â€” Update reservation status
app.patch('/api/reservations/:id', (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!['pending', 'confirmed', 'cancelled'].includes(status)) {
    return res.status(400).json({ success: false, error: 'Invalid status. Use: pending, confirmed, or cancelled.' });
  }

  const reservations = readReservations();
  const index = reservations.findIndex(r => r.id === id);

  if (index === -1) {
    return res.status(404).json({ success: false, error: 'Reservation not found.' });
  }

  reservations[index].status = status;
  reservations[index].updatedAt = new Date().toISOString();
  writeReservations(reservations);

  console.log(`📝 Reservation ${id.slice(0, 8)}... status → ${status}`);

  res.json({ success: true, reservation: reservations[index] });
});

// DELETE /api/reservations/:id â€” Delete reservation
app.delete('/api/reservations/:id', (req, res) => {
  const { id } = req.params;
  const reservations = readReservations();
  const index = reservations.findIndex(r => r.id === id);

  if (index === -1) {
    return res.status(404).json({ success: false, error: 'Reservation not found.' });
  }

  const deleted = reservations.splice(index, 1)[0];
  writeReservations(reservations);

  console.log(`🗑️  Deleted reservation from ${deleted.name}`);

  res.json({ success: true, message: 'Reservation deleted.' });
});

// GET /api/stats â€” Quick stats for admin dashboard
app.get('/api/stats', (req, res) => {
  const reservations = readReservations();
  const today = new Date().toISOString().split('T')[0];

  const stats = {
    total: reservations.length,
    pending: reservations.filter(r => r.status === 'pending').length,
    confirmed: reservations.filter(r => r.status === 'confirmed').length,
    cancelled: reservations.filter(r => r.status === 'cancelled').length,
    today: reservations.filter(r => r.date === today).length,
    upcoming: reservations.filter(r => r.date >= today && r.status !== 'cancelled').length
  };

  res.json({ success: true, stats });
});

// Start server
app.listen(PORT, () => {
  console.log(`\n🍽️  Lumiere Fine Dining Server`);
  console.log(`   🌐 Site:   http://localhost:${PORT}`);
  console.log(`   🔧 Admin:  http://localhost:${PORT}/admin.html`);
  console.log(`   📡 API:    http://localhost:${PORT}/api/reservations\n`);
});
