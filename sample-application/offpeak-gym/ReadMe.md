# OffPeak Gym 🏋️‍♂️

> **Hourly boutique gym bay and turf rentals for freelance personal trainers in Pune, India.**  
> Monetize dead studio hours (10:00 AM – 4:00 PM) with automated insurance verification, digital client waivers, keyless door PINs, and seamless Razorpay payments.

[![Vitest Tests](https://img.shields.io/badge/tests-13%2F13%20passing-brightgreen)](docs/QA.md)
[![Region](https://img.shields.io/badge/region-India%20(Pune)-blue)]()
[![Currency](https://img.shields.io/badge/currency-INR%20(%E2%82%B9)-yellow)]()
[![Stack](https://img.shields.io/badge/stack-React%20%7C%20Vite%20%7C%20Node%20%7C%20SQLite-black)]()

---

## 📌 Executive Summary

Commercial gyms typically extract 50–60% commission cuts from freelance personal trainers, while boutique fitness studios sit empty during midday dead hours. **OffPeak Gym** provides a two-sided marketplace where:
- **Freelance Personal Trainers** book premium equipment bays (power racks, turf lanes, boxing rings, reformer pilates) by the hour at flat rates (`₹899 – ₹1,999/hr`), keeping 90% of their client revenue.
- **Boutique Gym Hosts** generate passive revenue from unstaffed off-peak slots with guaranteed payment escrow and 95% net payout.
- **Safety & Compliance** are automated via mandatory trainer liability insurance verification (REPs India / ACE) and digital pre-session client waivers.

---

## 🚀 Key Features

| Feature | Description |
|---|---|
| **Bay Discovery & Radar Scope** | Filter 15 bays across 6 Pune localities (Koregaon Park, Kalyani Nagar, Baner, Aundh, Kothrud, Shivajinagar) with an interactive, keyless vector radar map. |
| **60-Min Hourly Booking** | Select strictly off-peak slots (10:00–16:00) with automatic 10-minute turnover buffers between bookings. |
| **Digital Client Liability Waiver** | In-app waiver capture enforcing legal client name, email, and signature before checkout. |
| **Razorpay Payments** | Native INR payment gateway supporting UPI, Cards, and Netbanking with automated split fee calculations (live & sandbox). |
| **Automated Door PIN** | Generates a secure 4-digit keypad door PIN dispatched instantly via Twilio SMS to the trainer's phone. |
| **Host Earnings Ledger** | Real-time calendar schedule and financial ledger with itemized gross earnings, 5% platform fee deduction, and net payout. |
| **Admin COI Queue** | Centralized compliance desk to review and approve trainer certificates of insurance (COI). |

---

## 💰 Pricing & Fee Structure

All pricing is standardized in **Indian Rupees (INR / ₹)** with transparent price breakups across every screen:

- **Hourly Bay Rates**: `₹899 – ₹1,999 / hour` (based on equipment tier).
- **Trainer Platform Surcharge**: `+10%` added at checkout (covers insurance escrow, verification, and payment processing).
- **Host Platform Commission**: `5%` deducted from host payouts.
- **Price Breakup Formula**:
  $$\text{Total Paid by Trainer} = \text{Base Bay Rate} + 10\% \text{ Platform Fee}$$
  $$\text{Net Payout to Host} = \text{Base Bay Rate} - 5\% \text{ Host Fee}$$

*Example: For a ₹999/hr Power Rack booking:*
- **Trainer pays**: `₹999.00 (Base) + ₹99.90 (10% Fee) = ₹1,098.90`
- **Host receives**: `₹999.00 (Gross) - ₹49.95 (5% Fee) = ₹949.05`

---

## 🛠️ Architecture & Tech Stack

```
offpeak-gym/
├── src/
│   ├── app/                      # Theme and root configuration
│   ├── components/layout/        # Navbar, Footer, Brand Logo
│   ├── content/                  # Site metadata and value propositions
│   ├── features/                 # Modular, single-responsibility domain slices
│   │   ├── admin-approval-console/     # COI verification table
│   │   ├── bay-discovery/              # BayCard, BayGrid, BayFilterBar, InteractiveBayMap
│   │   ├── host-payout-ledger/         # HostEarningsCard, HostScheduleTable
│   │   ├── hourly-booking/             # SlotSelector, WaiverForm, BookingSummaryCard
│   │   ├── insurance-verification/     # COIStatusBadge, COIUploadModal
│   │   └── turnover-buffer-management/ # TurnoverBufferBadge, IncidentReportModal
│   ├── integrations/             # Razorpay Checkout SDK & fee calculators
│   ├── utils/currency.js         # Centralized formatINR formatter
│   └── test/                     # Vitest + React Testing Library test suites
├── server/
│   ├── db/                       # SQLite database (offpeak.db) & seed script
│   ├── middleware/twilio.js      # Twilio SMS dispatch helper
│   ├── routes/                   # Express REST APIs (bays, bookings, payments, host, admin)
│   └── index.js                  # Backend entry point (Port 3001)
└── docs/                         # Spec locks, runs, and QA verification logs
```

- **Frontend**: React 18, Vite 6, Material UI (MUI 6), Lucide React, React Router 7.
- **Backend**: Node.js, Express 4, SQLite (`better-sqlite3`).
- **Integrations**: Razorpay Checkout SDK (live/sandbox), Twilio SMS.
- **Design System**: Dark-mode palette (`#0B0F19` background, `#111827` cards, `#E0FE10` electric lime accent).

---

## ⚡ Quickstart Guide

### 1. Prerequisites
- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher

### 2. Installation
```bash
cd offpeak-gym
npm install
```

### 3. Environment Configuration
Copy `.env.example` to `.env` (live keys are optional; sandbox fallback activates automatically):
```bash
cp .env.example .env
```
Key configuration parameters:
```env
PORT=3001
NODE_ENV=development
RAZORPAY_KEY_ID=          # Optional live Razorpay Key
RAZORPAY_KEY_SECRET=      # Optional live Razorpay Secret
TWILIO_ACCOUNT_SID=       # Optional Twilio SID for live SMS
TWILIO_AUTH_TOKEN=        # Optional Twilio Auth Token
TWILIO_PHONE_NUMBER=      # Optional Twilio Sender Number
```

### 4. Seed Database
Initializes `server/db/offpeak.db` with 6 Pune boutique studios, 15 equipment bays, 525 upcoming off-peak slots, and verified demo user profiles:
```bash
npm run seed
```

### 5. Start Application
Runs the Vite development server (proxies `/api` requests to backend on port 3001):
```bash
# Terminal 1: Backend API (port 3001)
npm run server

# Terminal 2: Frontend Client (port 3000)
npm run dev
```
Open **[http://localhost:3000](http://localhost:3000)** in your browser.

### 6. Run Test Suite
Executes all 4 Vitest test suites (13 automated unit and DOM tests):
```bash
npm test
```

---

## 👥 Demo User Personas

Use the role switcher in the header to switch perspectives instantly:

1. **Freelance Trainer (`Marcus Vance`)**
   - Discovers bays, signs digital client waivers, completes checkout with price breakups, and tracks confirmed reservations with 4-digit door PINs.
2. **Gym Host (`Elena Rostova` — Iron Vault Strength Club)**
   - Views upcoming trainer bookings, reports overstay incidents, and inspects the live net earnings ledger.
3. **Compliance Admin (`Verification Team`)**
   - Reviews uploaded insurance certificates (COIs) and approves or rejects trainer credentials.

---

## 📡 REST API Reference

| Endpoint | Method | Description |
|---|---|---|
| `/api/health` | `GET` | Health status and third-party configuration status |
| `/api/bays` | `GET` | Filter bays by `category`, `city`, `search`, and `maxRate` |
| `/api/bays/:id` | `GET` | Bay details, equipment specs, and upcoming slots |
| `/api/bays/slot/:slotId` | `GET` | Combined slot and bay metadata for checkout |
| `/api/bookings` | `POST` | Reserve slot, create booking, store waiver, dispatch PIN SMS |
| `/api/bookings/:id` | `GET` | Booking confirmation receipt and door access PIN |
| `/api/bookings/trainer` | `GET` | Active trainer bookings list |
| `/api/payments/razorpay-order` | `POST` | Create INR order for Razorpay checkout |
| `/api/payments/verify` | `POST` | Verify Razorpay HMAC-SHA256 signature |
| `/api/host/dashboard` | `GET` | Host bays, schedule table, and net payout ledger |
| `/api/host/incidents` | `POST` | Report trainer turnover overstay or equipment dispute |
| `/api/admin/coi-queue` | `GET` | Pending trainer insurance COI verification list |
| `/api/admin/coi/:userId` | `PATCH` | Approve or reject trainer insurance status |

---

## 📄 License & Verification

Built and maintained via spec-driven autonomous full-stack development.  
QA and verification documentation available at [`docs/QA.md`](docs/QA.md).
