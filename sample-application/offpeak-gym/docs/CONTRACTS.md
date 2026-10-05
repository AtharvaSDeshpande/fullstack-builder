# OffPeak Gym — Architecture & Integration Contracts

Version: 1.0 (Spec v1.1)  
Target Slug: `offpeak-gym`

---

## 1. Routes & Page Conventions
All page components are exported from their respective feature or page modules:
- `/` -> `LandingPage` (public hero, how it works, curated bays)
- `/explore` -> `ExplorePage` (search, equipment filter, map view, bay cards)
- `/bays/:id` -> `BayDetailPage` (specs, amenities, host info, 60-min slot selector)
- `/checkout/:slotId` -> `CheckoutPage` (client liability waiver intake, Razorpay payment gateway modal, summary)
- `/booking/confirmed/:bookingId` -> `ConfirmationPage` (booking card, entry PIN, access directions)
- `/trainer/dashboard` -> `TrainerDashboardPage` (active bookings, session history, COI upload status)
- `/host/dashboard` -> `HostDashboardPage` (studio schedule, calendar bookings, net payout ledger)
- `/admin/queue` -> `AdminQueuePage` (COI verification table, incident arbitration)

---

## 2. Data Entities & Storage Schema (SQLite)

### `users`
- `id`: TEXT PRIMARY KEY (e.g. `usr_marcus`)
- `name`: TEXT NOT NULL
- `email`: TEXT UNIQUE NOT NULL
- `role`: TEXT NOT NULL CHECK(role IN ('trainer', 'host', 'admin'))
- `phone`: TEXT
- `avatar_url`: TEXT
- `coi_status`: TEXT DEFAULT 'unsubmitted' CHECK(coi_status IN ('unsubmitted', 'pending', 'approved', 'rejected'))
- `coi_url`: TEXT
- `created_at`: DATETIME DEFAULT CURRENT_TIMESTAMP

### `gyms`
- `id`: TEXT PRIMARY KEY (e.g. `gym_iron_vault`)
- `host_id`: TEXT NOT NULL REFERENCES users(id)
- `name`: TEXT NOT NULL
- `address`: TEXT NOT NULL
- `city`: TEXT NOT NULL
- `state`: TEXT NOT NULL
- `zip`: TEXT NOT NULL
- `lat`: REAL NOT NULL
- `lng`: REAL NOT NULL
- `description`: TEXT
- `amenities`: TEXT (JSON array of strings)
- `rules`: TEXT (JSON array of strings)
- `photos`: TEXT (JSON array of image URLs)
- `access_instructions`: TEXT NOT NULL
- `created_at`: DATETIME DEFAULT CURRENT_TIMESTAMP

### `bays`
- `id`: TEXT PRIMARY KEY (e.g. `bay_iv_squat_1`)
- `gym_id`: TEXT NOT NULL REFERENCES gyms(id)
- `name`: TEXT NOT NULL
- `category`: TEXT NOT NULL (e.g. 'Powerlifting Rack', 'Turf Sprint Lane', 'Reformer Pilates', 'Boxing Ring')
- `equipment_tags`: TEXT (JSON array)
- `hourly_rate`: REAL NOT NULL
- `offpeak_start`: TEXT NOT NULL (e.g. '10:00')
- `offpeak_end`: TEXT NOT NULL (e.g. '16:00')
- `created_at`: DATETIME DEFAULT CURRENT_TIMESTAMP

### `slots`
- `id`: TEXT PRIMARY KEY (e.g. `slt_20261010_1100`)
- `bay_id`: TEXT NOT NULL REFERENCES bays(id)
- `date`: TEXT NOT NULL (YYYY-MM-DD)
- `start_time`: TEXT NOT NULL (HH:MM)
- `end_time`: TEXT NOT NULL (HH:MM)
- `status`: TEXT NOT NULL DEFAULT 'available' CHECK(status IN ('available', 'booked', 'blocked'))
- `buffer_end_time`: TEXT (HH:MM, +10 mins transition buffer)

### `bookings`
- `id`: TEXT PRIMARY KEY (e.g. `bkg_94821`)
- `slot_id`: TEXT NOT NULL REFERENCES slots(id)
- `trainer_id`: TEXT NOT NULL REFERENCES users(id)
- `host_id`: TEXT NOT NULL REFERENCES users(id)
- `client_name`: TEXT NOT NULL
- `client_email`: TEXT NOT NULL
- `waiver_signed`: INTEGER NOT NULL DEFAULT 1
- `amount_subtotal`: REAL NOT NULL
- `trainer_fee`: REAL NOT NULL (10% of subtotal)
- `host_fee`: REAL NOT NULL (5% of subtotal)
- `total_charged`: REAL NOT NULL (subtotal + trainer_fee)
- `access_pin`: TEXT NOT NULL (4-digit numeric PIN)
- `status`: TEXT NOT NULL DEFAULT 'confirmed' CHECK(status IN ('confirmed', 'completed', 'disputed', 'cancelled'))
- `created_at`: DATETIME DEFAULT CURRENT_TIMESTAMP

### `incidents`
- `id`: TEXT PRIMARY KEY (e.g. `inc_102`)
- `booking_id`: TEXT NOT NULL REFERENCES bookings(id)
- `reporter_id`: TEXT NOT NULL REFERENCES users(id)
- `reason`: TEXT NOT NULL
- `status`: TEXT NOT NULL DEFAULT 'open' CHECK(status IN ('open', 'resolved', 'dismissed'))
- `resolution_notes`: TEXT
- `created_at`: DATETIME DEFAULT CURRENT_TIMESTAMP

---

## 3. REST API Endpoints
All API responses return JSON with `{ success: true, data: ... }` or `{ success: false, error: ... }`.

- `GET /api/health` -> `{ status: "ok", service: "offpeak-gym-api", region: "India (Pune)", currency: "INR", liveThirdParties: ... }`
- `GET /api/bays` -> List bays with query params `?category=&city=&search=&minRate=&maxRate=` (supports Pune localities like Koregaon Park, Kalyani Nagar, Baner, Shivajinagar, Aundh, Kothrud)
- `GET /api/bays/:id` -> Detailed bay object + list of upcoming slots
- `POST /api/payments/razorpay-order` -> Create Razorpay order in INR paise subunits:
  - Input: `{ amount, currency: "INR", bookingDetails }`
  - Output: `{ order: { id, amount, currency }, isSandbox: boolean, keyId }`
- `POST /api/payments/verify` -> Verify payment signature:
  - Input: `{ razorpay_order_id, razorpay_payment_id, razorpay_signature }`
  - Output: `{ verified: true, mode: "live" | "sandbox" }`
- `POST /api/bookings` -> Create new booking:
  - Input: `{ slotId, trainerId, clientName, clientEmail, waiverSigned }`
  - Calculates fees in INR: subtotal, trainerFee (10%), hostFee (5%), totalCharged.
  - Generates 4-digit `access_pin` (e.g. `4821`).
  - Dispatches Twilio SMS to trainer/client mobile with PIN and venue instructions.
  - Marks slot status to `booked`.
- `GET /api/trainer/bookings` -> Return bookings for active trainer with PINs & status
- `POST /api/trainer/coi` -> Upload or submit trainer certification & liability policy (REPs India / ACE / ISSA):
  - Input: `{ trainerId, coiUrl, policyNumber, expirationDate }`
  - Sets user `coi_status` to `'pending'`.
- `GET /api/host/dashboard` -> Return host's studios, bays, booked slots, and computed earnings:
  - `grossEarnings`: sum(amount_subtotal) in INR
  - `platformFeesDeducted`: sum(host_fee)
  - `netPayoutBalance`: grossEarnings - platformFeesDeducted (currency: `INR`)
- `GET /api/admin/coi-queue` -> Return all pending trainer certifications & liability submissions
- `PATCH /api/admin/coi/:userId` -> Update status `{ status: 'approved' | 'rejected' }`
- `POST /api/host/incidents` -> Report overstay/equipment damage `{ bookingId, reporterId, reason }`

---

## 4. UI Design System Tokens & Localization
- Region: India (Pilot Metro: Pune, Maharashtra)
- Currency: Indian Rupee (`INR`, symbol `₹`)
- Localities: Koregaon Park, Kalyani Nagar, Baner, Shivajinagar, Aundh, Kothrud
- Coordinates: 18.5204° N, 73.8567° E (Pune Metro Center)
- Background: `#0B0F19` (Dark Navy Charcoal)
- Surface: `#111827` (Deep Card Slate), `#1F2937` (Elevated)
- Accent Primary: `#E0FE10` (Electric Athletic Lime), Hover `#CCEE00`
- Accent Secondary: `#38BDF8` (Sky Blue)
- Text Primary: `#F9FAFB`, Text Secondary: `#9CA3AF`, Muted: `#6B7280`
- Status: Success `#10B981`, Warning `#F59E0B`, Danger `#EF4444`
- Fonts: `Inter`, `Outfit`
- Breakpoints: Mobile 360px, Tablet 768px, Desktop 1280px

---

## 5. Environment Variables & Fallbacks
Configured in `.env`:
- `PORT=3000` (Backend automatically uses port 3001 if PORT=3000 to avoid collision with Vite dev server)
- `RAZORPAY_KEY_ID=` (Live key id; falls back to sandbox order generation if missing)
- `RAZORPAY_KEY_SECRET=` (HMAC-SHA256 signature verification secret)
- `TWILIO_ACCOUNT_SID=` (Live Twilio Account SID; logs to console if missing)
- `TWILIO_AUTH_TOKEN=` (Live Twilio Auth Token)
- `TWILIO_PHONE_NUMBER=` (Live Twilio Sender Phone Number)
- Map: Native keyless interactive Pune studio radar map with GPS coordinates (zero third-party API keys required)

---

## 6. Clean-Code Rules
- One component per file under 150 lines.
- Feature-based folder structure with `index.js` boundary.
- No magic numbers or hardcoded secrets.
- Input validation on all server endpoints.
