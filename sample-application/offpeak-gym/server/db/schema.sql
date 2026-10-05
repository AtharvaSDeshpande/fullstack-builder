CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL CHECK(role IN ('trainer', 'host', 'admin')),
  phone TEXT,
  avatar_url TEXT,
  coi_status TEXT DEFAULT 'unsubmitted' CHECK(coi_status IN ('unsubmitted', 'pending', 'approved', 'rejected', 'not_applicable')),
  coi_url TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS gyms (
  id TEXT PRIMARY KEY,
  host_id TEXT NOT NULL REFERENCES users(id),
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  zip TEXT NOT NULL,
  lat REAL NOT NULL,
  lng REAL NOT NULL,
  description TEXT,
  amenities TEXT, -- JSON array
  rules TEXT, -- JSON array
  photos TEXT, -- JSON array
  access_instructions TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS bays (
  id TEXT PRIMARY KEY,
  gym_id TEXT NOT NULL REFERENCES gyms(id),
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  equipment_tags TEXT, -- JSON array
  hourly_rate REAL NOT NULL,
  offpeak_start TEXT NOT NULL,
  offpeak_end TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS slots (
  id TEXT PRIMARY KEY,
  bay_id TEXT NOT NULL REFERENCES bays(id),
  date TEXT NOT NULL,
  start_time TEXT NOT NULL,
  end_time TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'available' CHECK(status IN ('available', 'booked', 'blocked')),
  buffer_end_time TEXT
);

CREATE TABLE IF NOT EXISTS bookings (
  id TEXT PRIMARY KEY,
  slot_id TEXT NOT NULL REFERENCES slots(id),
  trainer_id TEXT NOT NULL REFERENCES users(id),
  host_id TEXT NOT NULL REFERENCES users(id),
  client_name TEXT NOT NULL,
  client_email TEXT NOT NULL,
  waiver_signed INTEGER NOT NULL DEFAULT 1,
  amount_subtotal REAL NOT NULL,
  trainer_fee REAL NOT NULL,
  host_fee REAL NOT NULL,
  total_charged REAL NOT NULL,
  access_pin TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'confirmed' CHECK(status IN ('confirmed', 'completed', 'disputed', 'cancelled')),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS incidents (
  id TEXT PRIMARY KEY,
  booking_id TEXT NOT NULL REFERENCES bookings(id),
  reporter_id TEXT NOT NULL REFERENCES users(id),
  reason TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open' CHECK(status IN ('open', 'resolved', 'dismissed')),
  resolution_notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
