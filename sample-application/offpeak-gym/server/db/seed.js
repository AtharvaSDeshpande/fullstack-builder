import db from './database.js';

export function runSeed() {
  // Clear existing
  db.exec(`
    DELETE FROM incidents;
    DELETE FROM bookings;
    DELETE FROM slots;
    DELETE FROM bays;
    DELETE FROM gyms;
    DELETE FROM users;
  `);

  // 1. Users
  const insertUser = db.prepare(`
    INSERT INTO users (id, name, email, role, phone, avatar_url, coi_status, coi_url)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertUser.run('usr_arjun', 'Arjun Nair', 'arjun@peaktraining.in', 'trainer', '+91 98900 29809', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150', 'approved', 'https://offpeakgym.app/coi/arjun-nair-reps-2026.pdf');
  insertUser.run('usr_priya', 'Priya Sharma', 'priya@kineticfitness.in', 'trainer', '+91 98230 12345', 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150', 'approved', 'https://offpeakgym.app/coi/priya-sharma-ace-2026.pdf');
  insertUser.run('usr_rohit', 'Rohit Verma', 'rohit@ironmovement.in', 'trainer', '+91 98111 67890', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150', 'pending', 'https://offpeakgym.app/coi/rohit-verma-insurance-2026.pdf');
  insertUser.run('usr_vikram', 'Vikram Patel', 'vikram@ironvaultgym.in', 'host', '+91 98450 11223', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150', 'not_applicable', null);
  insertUser.run('usr_ananya', 'Ananya Rao', 'ananya@kinetixlab.in', 'host', '+91 98800 44556', 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150', 'not_applicable', null);
  insertUser.run('usr_admin', 'Platform Admin', 'admin@offpeakgym.in', 'admin', '+91 20 2612 1100', null, 'not_applicable', null);

  // Backward compatibility user IDs for testing & default mock role switcher
  insertUser.run('usr_marcus', 'Marcus Vance (Arjun)', 'marcus@peaktraining.com', 'trainer', '+91 98900 29809', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150', 'approved', 'https://offpeakgym.app/coi/arjun-nair-2026.pdf');
  insertUser.run('usr_sarah', 'Sarah Chen', 'sarah@kineticfitness.io', 'trainer', '+91 98230 45678', 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150', 'pending', 'https://offpeakgym.app/coi/sarah-chen-2026.pdf');
  insertUser.run('usr_dave', 'David Miller', 'dave@ironmovement.com', 'trainer', '+91 98111 22334', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150', 'pending', 'https://offpeakgym.app/coi/david-miller-2026.pdf');
  insertUser.run('usr_elena', 'Elena Rostova (Ananya)', 'elena@ironvaultgym.com', 'host', '+91 98800 44556', 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150', 'not_applicable', null);
  insertUser.run('usr_carlos', 'Carlos Mendez (Vikram)', 'carlos@metroathletic.com', 'host', '+91 98450 11223', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150', 'not_applicable', null);

  // 2. Gyms (Pune City)
  const insertGym = db.prepare(`
    INSERT INTO gyms (id, host_id, name, address, city, state, zip, lat, lng, description, amenities, rules, photos, access_instructions)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const gymsData = [
    {
      id: 'gym_iron_vault',
      host_id: 'usr_elena',
      name: 'Iron Vault Strength Club',
      address: '12 North Main Road, Koregaon Park',
      city: 'Pune',
      state: 'MH',
      zip: '411001',
      lat: 18.5362,
      lng: 73.8940,
      description: 'Premier dedicated strength & conditioning sanctuary in Koregaon Park outfitted with calibrated Eleiko competition barbells, Rogue Monster racks, and 45mm acoustic drop flooring.',
      amenities: JSON.stringify(['Chalk Permitted', 'Bluetooth Hi-Fi Sound System', 'Private Showers & Lockers', 'RO Hydration Station', 'Air Conditioned Bays']),
      rules: JSON.stringify(['Re-rack all Olympic plates after session', 'Wipe down barbells with provided brass brush', 'Strict 60-min slot cap; leave bay clean 5 mins before turnover']),
      photos: JSON.stringify([
        'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800',
        'https://images.unsplash.com/photo-1540497077202-7c8a3999166f?w=800'
      ]),
      access_instructions: 'Keypad entry on ground floor side gate. Enter your 4-digit PIN followed by #. Security guard on lobby duty.'
    },
    {
      id: 'gym_metro_lab',
      host_id: 'usr_ananya',
      name: 'Kinetix Performance Lab',
      address: '8 Central Avenue, Kalyani Nagar',
      city: 'Pune',
      state: 'MH',
      zip: '411006',
      lat: 18.5492,
      lng: 73.9038,
      description: 'High-performance sports conditioning facility in Kalyani Nagar featuring 25 yards of indoor sled turf, sprint tracks, laser timing gates, and plyometric complexes.',
      amenities: JSON.stringify(['25-Yard Sprint Turf', 'Prowler Sleds', 'Medicine Ball Wall', 'High-Speed Wi-Fi', 'Locker & Shower Suite']),
      rules: JSON.stringify(['Turf shoes or clean indoor sneakers only (no outdoor mud)', 'Return kettlebells to racks', 'Digital client liability waiver mandatory']),
      photos: JSON.stringify([
        'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=800',
        'https://images.unsplash.com/photo-1574680096145-d05b474e2155?w=800'
      ]),
      access_instructions: 'Scan dynamic QR or punch your 4-digit PIN at the tablet kiosk beside the glass entrance.'
    },
    {
      id: 'gym_apex_hub',
      host_id: 'usr_vikram',
      name: 'Apex Hybrid Performance Hub',
      address: '104 Baner High Street, Baner',
      city: 'Pune',
      state: 'MH',
      zip: '411045',
      lat: 18.5590,
      lng: 73.7868,
      description: 'Olympic weightlifting and hybrid functional training studio on Baner High Street with competition oak wood platforms, jerk blocks, and calibrated bumper sets.',
      amenities: JSON.stringify(['Eleiko Weightlifting Platforms', 'Jerk Blocks & Technique Boxes', 'Resistance Bands Station', 'Curved AirRunner Treadmills']),
      rules: JSON.stringify(['No dropping empty barbells', 'Chalk contained to platforms', 'Sound level below 80dB during off-peak']),
      photos: JSON.stringify([
        'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=800'
      ]),
      access_instructions: 'Enter via elevator to 2nd Floor. Smart keypad accepts 4-digit PIN.'
    },
    {
      id: 'gym_urban_boxing',
      host_id: 'usr_ananya',
      name: 'The Ring Combat & Boxing Academy',
      address: '45 Fergusson College (FC) Road, Shivajinagar',
      city: 'Pune',
      state: 'MH',
      zip: '411004',
      lat: 18.5284,
      lng: 73.8423,
      description: 'Authentic combat training facility on FC Road with an elevated 18-foot regulation competition ring, teardrop heavy bags, speed bags, and kick pads.',
      amenities: JSON.stringify(['18ft Regulation Ring', 'Teardrop Aqua Bags', 'Speed Bags', 'Jump Rope Track', 'Ice Bath Facility']),
      rules: JSON.stringify(['Hand wraps and clean gloves required', 'No street shoes on ring canvas', 'Sanitize heavy bags after padwork']),
      photos: JSON.stringify([
        'https://images.unsplash.com/photo-1549719386-74dfcbf7dbed?w=800'
      ]),
      access_instructions: 'Door code PIN activates electronic deadbolt. Ring bell if attendant is on break.'
    },
    {
      id: 'gym_reformer_loft',
      host_id: 'usr_vikram',
      name: 'Zenith Reformer Pilates Studio',
      address: '21 ITI Road, Aundh',
      city: 'Pune',
      state: 'MH',
      zip: '411007',
      lat: 18.5580,
      lng: 73.8075,
      description: 'Sunlit boutique Pilates sanctuary in Aundh equipped with Balanced Body Allegro 2 Reformers, jumpboards, and cadillac towers.',
      amenities: JSON.stringify(['Allegro 2 Reformers', 'Cadillac Tower', 'Grip Socks Required', 'Aromatherapy Diffusers', 'Premium Changing Rooms']),
      rules: JSON.stringify(['Grip socks required for both trainer and client', 'Wipe down carriage leather with microfiber cloth', 'Quiet atmosphere']),
      photos: JSON.stringify([
        'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=800'
      ]),
      access_instructions: 'Elevator to 3rd Floor. Digital punchpad at frosted glass doors accepts 4-digit PIN.'
    },
    {
      id: 'gym_forge_functional',
      host_id: 'usr_ananya',
      name: 'Forge Functional Arena',
      address: '78 Paud Road, Kothrud',
      city: 'Pune',
      state: 'MH',
      zip: '411038',
      lat: 18.5074,
      lng: 73.8077,
      description: 'Spacious industrial athletic arena in Kothrud equipped with Concept2 rowers, ski ergs, assault bikes, and full dumbbell sets up to 60 kg.',
      amenities: JSON.stringify(['Concept2 Erg Rowers & SkiErgs', 'Dumbbells to 60 kg', 'Trap Bars & Safety Squat Bars', 'Roll-up Bay Doors']),
      rules: JSON.stringify(['Keep roll-up bay doors closed during hot hours', 'Wipe down cardio monitors', 'No outside food on gym floor']),
      photos: JSON.stringify([
        'https://images.unsplash.com/photo-1571902943202-507ec2618e8f?w=800'
      ]),
      access_instructions: 'Basement parking reserved for trainers. Keypad entry on loading bay door.'
    }
  ];

  gymsData.forEach(g => {
    insertGym.run(g.id, g.host_id, g.name, g.address, g.city, g.state, g.zip, g.lat, g.lng, g.description, g.amenities, g.rules, g.photos, g.access_instructions);
  });

  // 3. Bays
  const insertBay = db.prepare(`
    INSERT INTO bays (id, gym_id, name, category, equipment_tags, hourly_rate, offpeak_start, offpeak_end)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const baysData = [
    { id: 'bay_iv_squat_1', gym_id: 'gym_iron_vault', name: 'Rogue Monster Power Rack #1', category: 'Squat Rack', equipment_tags: JSON.stringify(['Rogue Monster Rack', 'Competition Ohio Bar', 'Calibrated Plates (200 kg)', 'Incline Bench']), hourly_rate: 999.0, offpeak_start: '10:00', offpeak_end: '16:00' },
    { id: 'bay_iv_squat_2', gym_id: 'gym_iron_vault', name: 'Rogue Monster Power Rack #2', category: 'Squat Rack', equipment_tags: JSON.stringify(['Rogue Monster Rack', 'Safety Squat Bar', 'Band Pegs', 'Pull-up Spheres']), hourly_rate: 999.0, offpeak_start: '10:00', offpeak_end: '16:00' },
    { id: 'bay_iv_platform', gym_id: 'gym_iron_vault', name: 'Eleiko Deadlift & Oly Platform', category: 'Olympic Platform', equipment_tags: JSON.stringify(['Eleiko 8x8 Platform', 'Eleiko IWF Bar', 'Competition Bumpers', 'Chalk Bowl']), hourly_rate: 1199.0, offpeak_start: '10:00', offpeak_end: '16:00' },
    { id: 'bay_metro_turf', gym_id: 'gym_metro_lab', name: '25-Yard Sprint & Sled Turf Lane', category: 'Turf Lane', equipment_tags: JSON.stringify(['25-Yard Turf Lane', 'Rogue Dog Sled', 'Battle Ropes', 'Plyo Boxes (20-30 in)']), hourly_rate: 1299.0, offpeak_start: '10:00', offpeak_end: '16:00' },
    { id: 'bay_metro_functional', gym_id: 'gym_metro_lab', name: 'Functional Rig & Kettlebell Zone', category: 'Cardio / MetCon', equipment_tags: JSON.stringify(['Wall-mounted Monkey Rig', 'Kettlebell Set 8-40kg', 'Wall Balls 4-12kg', 'Gymnastic Rings']), hourly_rate: 899.0, offpeak_start: '10:00', offpeak_end: '16:00' },
    { id: 'bay_apex_wood', gym_id: 'gym_apex_hub', name: 'Competition Wood Lifting Bay', category: 'Olympic Platform', equipment_tags: JSON.stringify(['Oak Wood Insert Platform', 'Eleiko Sport Training Bar', 'Jerk Boxes', 'Technique Plates']), hourly_rate: 1399.0, offpeak_start: '10:00', offpeak_end: '16:00' },
    { id: 'bay_apex_rack', gym_id: 'gym_apex_hub', name: 'Heavy Duty Power Cage #3', category: 'Squat Rack', equipment_tags: JSON.stringify(['Heavy Power Cage', 'Texas Power Bar', 'Cast Iron Plates (250 kg)', 'Dip Attachment']), hourly_rate: 999.0, offpeak_start: '10:00', offpeak_end: '16:00' },
    { id: 'bay_boxing_ring', gym_id: 'gym_urban_boxing', name: 'Regulation Boxing Ring Bay', category: 'Boxing Ring', equipment_tags: JSON.stringify(['18ft Elevated Ring', 'Corner Pads', 'Corner Water Buckets', 'Round Timer Horn']), hourly_rate: 1599.0, offpeak_start: '10:00', offpeak_end: '16:00' },
    { id: 'bay_boxing_bags', gym_id: 'gym_urban_boxing', name: 'Heavy Bag Strip (4 Bags)', category: 'Boxing Bags', equipment_tags: JSON.stringify(['2x 150lb Leather Heavy Bags', '1x 100lb Angle Bag', '1x Double-End Reflex Bag']), hourly_rate: 899.0, offpeak_start: '10:00', offpeak_end: '16:00' },
    { id: 'bay_reformer_1', gym_id: 'gym_reformer_loft', name: 'Balanced Body Reformer #1', category: 'Reformer Pilates', equipment_tags: JSON.stringify(['Allegro 2 Reformer', 'Jumpboard Attachment', 'Sitting Box', 'Pilates Ring']), hourly_rate: 1799.0, offpeak_start: '10:00', offpeak_end: '16:00' },
    { id: 'bay_reformer_2', gym_id: 'gym_reformer_loft', name: 'Balanced Body Reformer #2', category: 'Reformer Pilates', equipment_tags: JSON.stringify(['Allegro 2 Reformer', 'Tower of Power', 'Rotator Discs', 'Foot Strap Extensions']), hourly_rate: 1799.0, offpeak_start: '10:00', offpeak_end: '16:00' },
    { id: 'bay_cadillac', gym_id: 'gym_reformer_loft', name: 'Full Trapeze Cadillac Bay', category: 'Reformer Pilates', equipment_tags: JSON.stringify(['Trapeze Table (Cadillac)', 'Push-Through Bar', 'Fuzzy Hanging Loops', 'Full Spring Assortment']), hourly_rate: 1999.0, offpeak_start: '10:00', offpeak_end: '16:00' },
    { id: 'bay_forge_cardio', gym_id: 'gym_forge_functional', name: 'Ergometer & MetCon Station', category: 'Cardio / MetCon', equipment_tags: JSON.stringify(['2x Concept2 RowErg', '1x Concept2 SkiErg', '2x Rogue Echo Assault Bike']), hourly_rate: 899.0, offpeak_start: '10:00', offpeak_end: '16:00' },
    { id: 'bay_forge_rack', gym_id: 'gym_forge_functional', name: 'Heavy Dumbbell & Bench Bay', category: 'Squat Rack', equipment_tags: JSON.stringify(['Urethane Dumbbells 2kg-50kg', '2x Adjustable Benches', 'Preacher Curl', 'Cable Crossover']), hourly_rate: 999.0, offpeak_start: '10:00', offpeak_end: '16:00' },
    { id: 'bay_forge_turf', gym_id: 'gym_forge_functional', name: 'Agility Turf & Tire Flip Lane', category: 'Turf Lane', equipment_tags: JSON.stringify(['15-Yard Turf', '200lb Tire with Handles', 'Agility Ladders', 'Slam Balls 6-20kg']), hourly_rate: 1099.0, offpeak_start: '10:00', offpeak_end: '16:00' }
  ];

  baysData.forEach(b => {
    insertBay.run(b.id, b.gym_id, b.name, b.category, b.equipment_tags, b.hourly_rate, b.offpeak_start, b.offpeak_end);
  });

  // 4. Slots (Generate off-peak slots for the next 7 days: 10:00, 11:10, 12:20, 13:30, 14:40)
  const insertSlot = db.prepare(`
    INSERT INTO slots (id, bay_id, date, start_time, end_time, status, buffer_end_time)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  const times = [
    { start: '10:00', end: '11:00', buffer: '11:10' },
    { start: '11:10', end: '12:10', buffer: '12:20' },
    { start: '12:20', end: '13:20', buffer: '13:30' },
    { start: '13:30', end: '14:30', buffer: '14:40' },
    { start: '14:40', end: '15:40', buffer: '15:50' },
  ];

  const today = new Date();
  const dateStrings = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    dateStrings.push(d.toISOString().slice(0, 10));
  }

  let slotCounter = 1;
  baysData.forEach(bay => {
    dateStrings.forEach(dateStr => {
      times.forEach(t => {
        const slotId = `slt_${dateStr.replace(/-/g, '')}_${bay.id}_${t.start.replace(':', '')}`;
        insertSlot.run(slotId, bay.id, dateStr, t.start, t.end, 'available', t.buffer);
        slotCounter++;
      });
    });
  });

  // 5. Pre-seed a few sample bookings to populate trainer/host dashboards
  const insertBooking = db.prepare(`
    INSERT INTO bookings (id, slot_id, trainer_id, host_id, client_name, client_email, waiver_signed, amount_subtotal, trainer_fee, host_fee, total_charged, access_pin, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const updateSlotStatus = db.prepare(`UPDATE slots SET status = 'booked' WHERE id = ?`);

  const targetDate = dateStrings[1];
  const sampleSlot1 = `slt_${targetDate.replace(/-/g, '')}_bay_iv_squat_1_1000`;
  const sampleSlot2 = `slt_${targetDate.replace(/-/g, '')}_bay_metro_turf_1110`;

  // Sample booking 1 (Iron Vault - Marcus Vance & Elena Rostova)
  insertBooking.run(
    'bkg_sample_101',
    sampleSlot1,
    'usr_marcus',
    'usr_elena',
    'Rohan Mehra',
    'rohan.mehra@gmail.com',
    1,
    999.0,
    99.9,
    49.95,
    1098.9,
    '4821',
    'confirmed'
  );
  updateSlotStatus.run(sampleSlot1);

  // Sample booking 2 (Kinetix Lab - Priya Sharma & Ananya Rao)
  insertBooking.run(
    'bkg_sample_102',
    sampleSlot2,
    'usr_priya',
    'usr_ananya',
    'Devika Sen',
    'devika.sen@outlook.com',
    1,
    1299.0,
    129.9,
    64.95,
    1428.9,
    '7390',
    'confirmed'
  );
  updateSlotStatus.run(sampleSlot2);

  // Sample booking 3 (Iron Vault - Arjun Nair & Elena Rostova)
  const sampleSlot3 = `slt_${targetDate.replace(/-/g, '')}_bay_iv_platform_1220`;
  insertBooking.run(
    'bkg_sample_103',
    sampleSlot3,
    'usr_arjun',
    'usr_elena',
    'Vikram Malhotra',
    'vikram.m@gmail.com',
    1,
    1199.0,
    119.9,
    59.95,
    1318.9,
    '5921',
    'confirmed'
  );
  updateSlotStatus.run(sampleSlot3);

  console.log(`Seeded: 11 users, ${gymsData.length} Pune boutique gyms, ${baysData.length} equipment bays, ${slotCounter - 1} slots, and 2 active bookings.`);
}

if (process.argv[1].endsWith('seed.js')) {
  runSeed();
}
