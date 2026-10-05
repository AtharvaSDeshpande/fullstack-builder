import React, { useState, useEffect, createContext, useContext } from 'react';
import { BrowserRouter, Routes, Route, Link, useNavigate, useParams } from 'react-router-dom';
import {
  ThemeProvider, CssBaseline, Box, Container, Typography, Button,
  Grid, Card, CardContent, CardMedia, Chip, Paper, Alert, Divider, TextField
} from '@mui/material';
import { theme } from './app/theme';
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import { Dumbbell, ShieldCheck, MapPin, Calendar, Clock, ArrowRight, CheckCircle, AlertTriangle, KeyRound, Sparkles, Receipt } from 'lucide-react';
import { BayFilterBar, BayGrid, InteractiveBayMap } from './features/bay-discovery';
import { SlotSelector, WaiverForm, BookingSummaryCard } from './features/hourly-booking';
import { HostEarningsCard, HostScheduleTable } from './features/host-payout-ledger';
import { COIVerificationTable } from './features/admin-approval-console';
import { COIStatusBadge, COIUploadModal } from './features/insurance-verification';
import { IncidentReportModal, TurnoverBufferBadge } from './features/turnover-buffer-management';
import { VALUE_PROPOSITIONS } from './content/siteContent';
import { formatINR } from './utils/currency';
import { calculateBookingBreakdown } from './integrations/razorpay';

export const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

export default function App() {
  const [currentUser, setCurrentUser] = useState({
    id: 'usr_marcus',
    name: 'Marcus Vance',
    role: 'trainer',
    email: 'marcus@peaktraining.com',
    phone: '+91 98900 29809',
    coi_status: 'approved',
  });

  const switchUser = (role) => {
    if (role === 'trainer') {
      setCurrentUser({
        id: 'usr_marcus',
        name: 'Marcus Vance',
        role: 'trainer',
        email: 'marcus@peaktraining.com',
        phone: '+91 98900 29809',
        coi_status: 'approved',
      });
    } else if (role === 'host') {
      setCurrentUser({
        id: 'usr_elena',
        name: 'Elena Rostova',
        role: 'host',
        email: 'elena@ironvaultgym.com',
        phone: '+91 98800 44556',
        coi_status: 'not_applicable',
      });
    } else {
      setCurrentUser({
        id: 'usr_admin',
        name: 'Platform Admin',
        role: 'admin',
        email: 'admin@offpeakgym.app',
        phone: '+91 20 2612 1100',
        coi_status: 'not_applicable',
      });
    }
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthContext.Provider value={{ currentUser, switchUser, setCurrentUser }}>
        <BrowserRouter>
          <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', bgcolor: '#0B0F19' }}>
            <Navbar />
            <Box component="main" sx={{ flexGrow: 1 }}>
              <Routes>
                <Route path="/" element={<LandingScreen />} />
                <Route path="/explore" element={<ExploreScreen />} />
                <Route path="/bays/:id" element={<BayDetailScreen />} />
                <Route path="/checkout/:slotId" element={<CheckoutScreen />} />
                <Route path="/booking/confirmed/:bookingId" element={<ConfirmationScreen />} />
                <Route path="/trainer/dashboard" element={<TrainerDashboardScreen />} />
                <Route path="/host/dashboard" element={<HostDashboardScreen />} />
                <Route path="/admin/queue" element={<AdminQueueScreen />} />
              </Routes>
            </Box>
            <Footer />
          </Box>
        </BrowserRouter>
      </AuthContext.Provider>
    </ThemeProvider>
  );
}

// -------------------------------------------------------------
// SCREEN 1: LANDING & HERO
// -------------------------------------------------------------
function LandingScreen() {
  const [featuredBays, setFeaturedBays] = useState([]);

  useEffect(() => {
    fetch('/api/bays')
      .then((r) => r.json())
      .then((res) => res.success && setFeaturedBays(res.data.slice(0, 3)))
      .catch(() => {});
  }, []);

  return (
    <Box>
      {/* Hero Section */}
      <Box
        sx={{
          py: { xs: 8, md: 12 },
          background: 'radial-gradient(ellipse 80% 50% at 50% -20%, rgba(224, 254, 16, 0.15), transparent 70%)',
          textAlign: 'center',
          borderBottom: '1px solid #1F2937',
        }}
      >
        <Container maxWidth="md">
          <Chip
            icon={<Sparkles size={14} color="#E0FE10" />}
            label="Monetize Off-Peak Fitness Hours (10 AM - 4 PM)"
            sx={{ bgcolor: 'rgba(224, 254, 16, 0.1)', color: '#E0FE10', fontWeight: 700, mb: 3 }}
          />
          <Typography variant="h1" sx={{ fontSize: { xs: '2.5rem', md: '3.75rem' }, mb: 2.5, lineHeight: 1.15 }}>
            Book Boutique Gym Space <br />
            <Box component="span" sx={{ color: '#E0FE10' }}>By The Hour</Box>
          </Typography>
          <Typography variant="h6" sx={{ color: '#9CA3AF', mb: 5, maxWidth: 680, mx: 'auto', fontWeight: 400, lineHeight: 1.6 }}>
            Independent personal trainers get instant access to squat cages, 20-yard turf lanes, and reformer studios without commercial gym lock-ins. Verified insurance & digital client waivers included.
          </Typography>

          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Button
              component={Link}
              to="/explore"
              variant="contained"
              color="primary"
              size="large"
              endIcon={<ArrowRight size={18} />}
              sx={{ py: 1.6, px: 4, fontSize: '1rem', fontWeight: 800 }}
            >
              Explore Available Bays (₹899 - ₹1,999/hr)
            </Button>
            <Button
              component={Link}
              to="/host/dashboard"
              variant="outlined"
              color="inherit"
              size="large"
              sx={{ py: 1.6, px: 3, borderColor: '#374151', color: '#D1D5DB' }}
            >
              Host Studio Portal
            </Button>
          </Box>
        </Container>
      </Box>

      {/* Value Propositions */}
      <Container maxWidth="xl" sx={{ py: 8 }}>
        <Grid container spacing={3}>
          {VALUE_PROPOSITIONS.map((prop, i) => (
            <Grid item xs={12} md={4} key={i}>
              <Paper sx={{ p: 4, bgcolor: '#111827', border: '1px solid #1F2937', height: '100%', borderRadius: 3 }}>
                <Typography variant="h6" sx={{ color: '#E0FE10', mb: 1, fontWeight: 700 }}>
                  {prop.title}
                </Typography>
                <Typography variant="body2" sx={{ color: '#9CA3AF', lineHeight: 1.6 }}>
                  {prop.description}
                </Typography>
              </Paper>
            </Grid>
          ))}
        </Grid>
      </Container>

      {/* Featured Spaces Preview */}
      <Container maxWidth="xl" sx={{ pb: 10 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', mb: 3 }}>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 800 }}>Featured Equipment Bays</Typography>
            <Typography variant="body2" sx={{ color: '#9CA3AF' }}>Calibrated strength gear and functional turf in Pune</Typography>
          </Box>
          <Button component={Link} to="/explore" endIcon={<ArrowRight size={16} />} sx={{ color: '#E0FE10' }}>
            View All 15 Bays
          </Button>
        </Box>
        <BayGrid bays={featuredBays} />
      </Container>
    </Box>
  );
}

// -------------------------------------------------------------
// SCREEN 2: EXPLORE & FILTER BAYS
// -------------------------------------------------------------
function ExploreScreen() {
  const [bays, setBays] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [city, setCity] = useState('All');
  const [maxRate, setMaxRate] = useState('');
  const [selectedGymId, setSelectedGymId] = useState(null);

  const fetchBays = () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (category && category !== 'All') params.append('category', category);
    if (city && city !== 'All') params.append('city', city);
    if (search) params.append('search', search);
    if (maxRate) params.append('maxRate', maxRate);

    fetch(`/api/bays?${params.toString()}`)
      .then((r) => r.json())
      .then((res) => {
        if (res.success) setBays(res.data);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchBays();
  }, [category, city, maxRate]);

  const handleSearchSubmit = (e) => {
    e?.preventDefault();
    fetchBays();
  };

  // Distinct gyms with coordinates for interactive map radar
  const uniqueGyms = Array.from(
    new Map(
      bays.map((b) => [
        b.gym_id,
        {
          id: b.gym_id,
          name: b.gym_name,
          lat: b.gym_lat || b.lat,
          lng: b.gym_lng || b.lng,
          address: b.gym_address,
          city: b.gym_city,
        },
      ])
    ).values()
  );

  return (
    <Container maxWidth="xl" sx={{ py: 5 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h3" sx={{ fontWeight: 800, mb: 1 }}>Explore Off-Peak Gym Bays</Typography>
        <Typography variant="body1" sx={{ color: '#9CA3AF' }}>
          Select a 60-minute equipment bay slot during midday dead hours (10:00 - 16:00).
        </Typography>
      </Box>

      {/* Interactive Map Radar */}
      <Box sx={{ mb: 4 }}>
        <InteractiveBayMap gyms={uniqueGyms} selectedGymId={selectedGymId} onSelectGym={setSelectedGymId} />
      </Box>

      {/* Search & Filter Bar */}
      <BayFilterBar
        search={search}
        onSearchChange={setSearch}
        category={category}
        onCategoryChange={setCategory}
        city={city}
        onCityChange={setCity}
        maxRate={maxRate}
        onMaxRateChange={setMaxRate}
      />

      {/* Grid of Available Bays */}
      <BayGrid bays={bays} loading={loading} onReset={() => { setCategory('All'); setCity('All'); setSearch(''); setMaxRate(''); }} />
    </Container>
  );
}

// -------------------------------------------------------------
// SCREEN 3: BAY DETAIL & SLOT SELECTOR
// -------------------------------------------------------------
function BayDetailScreen() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [bay, setBay] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/bays/${id}`)
      .then((r) => r.json())
      .then((res) => {
        if (res.success) {
          setBay(res.data);
          const firstAvailable = res.data.slots.find((s) => s.status === 'available');
          if (firstAvailable) setSelectedSlot(firstAvailable);
        }
      })
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <Container maxWidth="lg" sx={{ py: 8 }}><Typography>Loading Bay...</Typography></Container>;
  if (!bay) return <Container maxWidth="lg" sx={{ py: 8 }}><Typography>Bay not found.</Typography></Container>;

  const photo = (bay.gym_photos && bay.gym_photos[0]) || 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800';

  return (
    <Container maxWidth="xl" sx={{ py: 5 }}>
      <Grid container spacing={4}>
        {/* Left Column: Media & Specs */}
        <Grid item xs={12} md={7}>
          <Card sx={{ mb: 3, border: '1px solid #1F2937', borderRadius: 3, overflow: 'hidden' }}>
            <CardMedia component="img" height="340" image={photo} alt={bay.name} sx={{ objectFit: 'cover' }} />
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                <Box>
                  <Typography variant="h4" sx={{ fontWeight: 800 }}>{bay.name}</Typography>
                  <Typography variant="subtitle1" sx={{ color: '#38BDF8', display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
                    <MapPin size={16} /> {bay.gym_name} &bull; {bay.gym_address}, {bay.gym_city}
                  </Typography>
                </Box>
                <Box sx={{ textAlign: 'right' }}>
                  <Chip label={`${formatINR(bay.hourly_rate)}/hr`} sx={{ bgcolor: '#E0FE10', color: '#000', fontWeight: 800, fontSize: '1.1rem', py: 2 }} />
                  <Typography variant="caption" sx={{ color: '#9CA3AF', display: 'block', mt: 0.5 }}>
                    Base rate (exclusive of 10% platform fee)
                  </Typography>
                </Box>
              </Box>

              <Box sx={{ my: 2.5 }}>
                <TurnoverBufferBadge startTime={bay.offpeak_start} endTime={bay.offpeak_end} />
              </Box>

              <Typography variant="subtitle2" sx={{ color: '#F9FAFB', fontWeight: 700, mb: 1 }}>Included Equipment & Rig Specifications:</Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 3 }}>
                {(bay.equipment_tags || []).map((t, i) => (
                  <Chip key={i} label={t} sx={{ bgcolor: '#1F2937', color: '#E5E7EB' }} />
                ))}
              </Box>

              <Typography variant="subtitle2" sx={{ color: '#F9FAFB', fontWeight: 700, mb: 1 }}>Studio Amenities:</Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 3 }}>
                {(bay.gym_amenities || []).map((a, i) => (
                  <Chip key={i} label={a} size="small" sx={{ bgcolor: 'rgba(56, 189, 248, 0.1)', color: '#38BDF8' }} />
                ))}
              </Box>

              <Typography variant="subtitle2" sx={{ color: '#F9FAFB', fontWeight: 700, mb: 1 }}>Host Studio Rules:</Typography>
              <Box component="ul" sx={{ pl: 2.5, color: '#9CA3AF', fontSize: '0.875rem' }}>
                {(bay.gym_rules || []).map((r, i) => (
                  <li key={i}>{r}</li>
                ))}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Right Column: Slot Selection & CTA */}
        <Grid item xs={12} md={5}>
          <Paper sx={{ p: 3, bgcolor: '#111827', border: '1px solid #1F2937', borderRadius: 3, position: 'sticky', top: 90 }}>
            <Typography variant="h5" sx={{ fontWeight: 800, mb: 1 }}>Book 60-Minute Session</Typography>
            <Typography variant="body2" sx={{ color: '#9CA3AF', mb: 2 }}>
              Choose an available off-peak time slot to proceed to client waiver and checkout.
            </Typography>

            <SlotSelector slots={bay.slots || []} selectedSlot={selectedSlot} onSelectSlot={setSelectedSlot} />

            {selectedSlot ? (
              <Box sx={{ mt: 3 }}>
                <Alert severity="info" sx={{ mb: 2, bgcolor: 'rgba(56, 189, 248, 0.1)', color: '#38BDF8' }}>
                  Selected: {selectedSlot.date} from {selectedSlot.start_time} to {selectedSlot.end_time}
                </Alert>

                {/* Price Breakup Summary Box */}
                {(() => {
                  const breakdown = calculateBookingBreakdown(bay.hourly_rate);
                  return (
                    <Box sx={{ mb: 2.5, p: 2.25, bgcolor: '#1F2937', borderRadius: 2.5, border: '1px solid #374151' }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#F9FAFB', mb: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Receipt size={16} color="#E0FE10" /> Price Breakup (60-Min Session)
                      </Typography>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.75 }}>
                        <Typography variant="body2" sx={{ color: '#9CA3AF' }}>Base Bay Rental (Paid to Host)</Typography>
                        <Typography variant="body2" sx={{ color: '#F9FAFB', fontWeight: 600 }}>{formatINR(breakdown.subtotal, { decimals: true })}</Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="body2" sx={{ color: '#9CA3AF' }}>Trainer Platform Fee (10%)</Typography>
                        <Typography variant="body2" sx={{ color: '#F9FAFB', fontWeight: 600 }}>+{formatINR(breakdown.trainerFee, { decimals: true })}</Typography>
                      </Box>
                      <Divider sx={{ my: 1, borderColor: '#374151' }} />
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 700, color: '#E0FE10' }}>Total Payable at Checkout</Typography>
                          <Typography variant="caption" sx={{ color: '#9CA3AF' }}>Includes liability escrow & door PIN</Typography>
                        </Box>
                        <Typography variant="h6" sx={{ fontWeight: 800, color: '#E0FE10', fontFamily: "'Outfit', sans-serif" }}>
                          {formatINR(breakdown.totalCharged, { decimals: true })}
                        </Typography>
                      </Box>
                    </Box>
                  );
                })()}

                <Button
                  variant="contained"
                  color="primary"
                  size="large"
                  fullWidth
                  onClick={() => navigate(`/checkout/${selectedSlot.id}`)}
                  sx={{ py: 1.5, fontWeight: 800, fontSize: '1.05rem' }}
                >
                  Continue to Waiver & Checkout ({formatINR(calculateBookingBreakdown(bay.hourly_rate).totalCharged, { decimals: true })})
                </Button>
              </Box>
            ) : (
              <Alert severity="warning">Please select an available off-peak slot above.</Alert>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
}

// -------------------------------------------------------------
// SCREEN 4: CHECKOUT & WAIVER
// -------------------------------------------------------------
function CheckoutScreen() {
  const { slotId } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  const [slotData, setSlotData] = useState(null);
  const [clientName, setClientName] = useState('Jordan Tyler');
  const [clientEmail, setClientEmail] = useState('jordan.t@gmail.com');
  const [waiverSigned, setWaiverSigned] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!slotId) return;

    // Fetch slot and bay details directly from slot endpoint
    fetch(`/api/bays/slot/${slotId}`)
      .then((r) => r.json())
      .then((res) => {
        if (res.success && res.data) {
          setSlotData({ bay: res.data.bay, slot: res.data.slot });
        } else {
          // Robust fallback parser for bay ID
          const parts = slotId.split('_');
          const fallbackBayId = parts.slice(2, -1).join('_') || parts.slice(1, -2).join('_');
          return fetch(`/api/bays/${fallbackBayId}`)
            .then((r) => r.json())
            .then((bRes) => {
              if (bRes.success) {
                const foundSlot = bRes.data.slots?.find((s) => s.id === slotId);
                setSlotData({ bay: bRes.data, slot: foundSlot });
              }
            });
        }
      })
      .catch(() => setError('Unable to load session slot details'));
  }, [slotId]);

  const handleCheckout = async () => {
    if (!clientName || !clientEmail) {
      setError('Please provide client legal name and email for waiver delivery.');
      return;
    }
    if (!waiverSigned) {
      setError('Client waiver consent checkbox must be confirmed.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slotId,
          trainerId: currentUser.id,
          clientName,
          clientEmail,
          waiverSigned: true,
        }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);

      navigate(`/booking/confirmed/${data.data.bookingId}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: 6 }}>
      <Typography variant="h4" sx={{ fontWeight: 800, mb: 1 }}>Complete Booking Reservation</Typography>
      <Typography variant="body1" sx={{ color: '#9CA3AF', mb: 4 }}>
        Fill out client waiver details and authorize payment to confirm door PIN.
      </Typography>

      <Grid container spacing={4}>
        <Grid item xs={12} md={7}>
          <WaiverForm
            clientName={clientName}
            onNameChange={setClientName}
            clientEmail={clientEmail}
            onEmailChange={setClientEmail}
            waiverSigned={waiverSigned}
            onWaiverSignedChange={setWaiverSigned}
            error={error}
          />
        </Grid>

        <Grid item xs={12} md={5}>
          <BookingSummaryCard
            bay={slotData?.bay}
            slot={slotData?.slot}
            onConfirm={handleCheckout}
            loading={loading}
          />
        </Grid>
      </Grid>
    </Container>
  );
}

// -------------------------------------------------------------
// SCREEN 5: CONFIRMATION & DOOR PIN CARD
// -------------------------------------------------------------
function ConfirmationScreen() {
  const { bookingId } = useParams();
  const [booking, setBooking] = useState(null);

  useEffect(() => {
    if (!bookingId) return;

    fetch(`/api/bookings/${bookingId}`)
      .then((r) => r.json())
      .then((res) => {
        if (res.success && res.data) {
          setBooking(res.data);
        } else {
          return fetch('/api/bookings/trainer?trainerId=usr_marcus')
            .then((r) => r.json())
            .then((tRes) => {
              if (tRes.success) {
                const found = tRes.data.find((b) => b.id === bookingId) || tRes.data[0];
                setBooking(found);
              }
            });
        }
      })
      .catch(() => {});
  }, [bookingId]);

  return (
    <Container maxWidth="sm" sx={{ py: 8 }}>
      <Paper sx={{ p: 4, bgcolor: '#111827', border: '1px solid #1F2937', borderRadius: 4, textAlign: 'center' }}>
        <Box sx={{ width: 64, height: 64, bgcolor: 'rgba(224, 254, 16, 0.15)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', mx: 'auto', mb: 2.5 }}>
          <CheckCircle size={36} color="#E0FE10" />
        </Box>

        <Typography variant="h4" sx={{ fontWeight: 800, mb: 1 }}>Booking Confirmed!</Typography>
        <Typography variant="body2" sx={{ color: '#9CA3AF', mb: 3.5 }}>
          Reservation #{booking?.id || bookingId} &bull; Confirmation sent via email and SMS.
        </Typography>

        {/* 4-Digit Door PIN Hero Card */}
        <Box sx={{ p: 3, bgcolor: '#0B0F19', border: '2px dashed #E0FE10', borderRadius: 3, mb: 3.5 }}>
          <Typography variant="caption" sx={{ color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: 1, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}>
            <KeyRound size={15} color="#E0FE10" /> Studio Door Access PIN
          </Typography>
          <Typography variant="h2" sx={{ fontWeight: 900, color: '#E0FE10', letterSpacing: 8, my: 1, fontFamily: "'Outfit', sans-serif" }}>
            {booking?.access_pin || '4821'}
          </Typography>
          <Typography variant="caption" sx={{ color: '#6B7280' }}>
            Valid 10 minutes prior to session until 10-minute post-session buffer.
          </Typography>
        </Box>

        {/* Dedicated Price Breakup Receipt Card */}
        <Box sx={{ textAlign: 'left', bgcolor: '#1F2937', p: 2.5, borderRadius: 2.5, mb: 3, border: '1px solid #374151' }}>
          <Typography variant="subtitle2" sx={{ color: '#F9FAFB', fontWeight: 700, mb: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
            <Receipt size={16} color="#E0FE10" /> Payment Receipt & Price Breakup
          </Typography>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.75 }}>
            <Typography variant="body2" sx={{ color: '#9CA3AF' }}>
              60-Min Bay Rental ({booking?.bay_name || 'Equipment Bay'})
            </Typography>
            <Typography variant="body2" sx={{ color: '#F9FAFB', fontWeight: 600 }}>
              {formatINR(booking?.amount_subtotal || 999, { decimals: true })}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="body2" sx={{ color: '#9CA3AF' }}>Trainer Platform Fee (10%)</Typography>
            <Typography variant="body2" sx={{ color: '#F9FAFB', fontWeight: 600 }}>
              +{formatINR(booking?.trainer_fee || +(booking?.amount_subtotal ? booking.amount_subtotal * 0.1 : 99.9).toFixed(2), { decimals: true })}
            </Typography>
          </Box>
          <Divider sx={{ my: 1, borderColor: '#374151' }} />
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box>
              <Typography variant="body2" sx={{ fontWeight: 700, color: '#E0FE10' }}>Total Paid via Razorpay</Typography>
              <Typography variant="caption" sx={{ color: '#9CA3AF' }}>Status: Confirmed & Escrowed</Typography>
            </Box>
            <Typography variant="h6" sx={{ fontWeight: 800, color: '#E0FE10', fontFamily: "'Outfit', sans-serif" }}>
              {formatINR(booking?.total_charged || 1098.9, { decimals: true })}
            </Typography>
          </Box>
        </Box>

        <Box sx={{ textAlign: 'left', bgcolor: '#0B0F19', p: 2, borderRadius: 2, mb: 3.5, border: '1px solid #1F2937' }}>
          <Typography variant="subtitle2" sx={{ color: '#F9FAFB', fontWeight: 700, mb: 0.5 }}>Studio Access Instructions:</Typography>
          <Typography variant="body2" sx={{ color: '#9CA3AF' }}>
            {booking?.access_instructions || 'Enter 4-digit PIN on keypad beside the entrance door. Front desk is unstaffed during off-peak hours.'}
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
          <Button component={Link} to="/trainer/dashboard" variant="contained" color="primary">
            View My Bookings
          </Button>
          <Button component={Link} to="/explore" variant="outlined" color="inherit">
            Book Another Bay
          </Button>
        </Box>
      </Paper>
    </Container>
  );
}

// -------------------------------------------------------------
// SCREEN 6: TRAINER DASHBOARD
// -------------------------------------------------------------
function TrainerDashboardScreen() {
  const { currentUser } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [openCOIModal, setOpenCOIModal] = useState(false);

  const fetchBookings = () => {
    fetch(`/api/bookings/trainer?trainerId=${currentUser.id}`)
      .then((r) => r.json())
      .then((res) => res.success && setBookings(res.data));
  };

  useEffect(() => {
    fetchBookings();
  }, [currentUser.id]);

  return (
    <Container maxWidth="xl" sx={{ py: 5 }}>
      {/* Profile Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800 }}>Trainer Dashboard</Typography>
          <Typography variant="body2" sx={{ color: '#9CA3AF' }}>
            Logged in as {currentUser.name} ({currentUser.email})
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <COIStatusBadge status={currentUser.coi_status} />
          <Button
            variant="outlined"
            color="primary"
            size="small"
            onClick={() => setOpenCOIModal(true)}
          >
            Update Insurance COI
          </Button>
        </Box>
      </Box>

      {/* Bookings Table */}
      <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>Active & Past Reservations</Typography>
      <Grid container spacing={3}>
        {bookings.map((b) => (
          <Grid item xs={12} md={6} key={b.id}>
            <Card sx={{ bgcolor: '#111827', border: '1px solid #1F2937', p: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>{b.bay_name}</Typography>
                  <Typography variant="body2" sx={{ color: '#38BDF8' }}>{b.gym_name}</Typography>
                </Box>
                <Chip label={`PIN: ${b.access_pin}`} sx={{ bgcolor: 'rgba(224, 254, 16, 0.15)', color: '#E0FE10', fontWeight: 800 }} />
              </Box>

              <Typography variant="caption" sx={{ color: '#9CA3AF', display: 'flex', alignItems: 'center', gap: 0.5, my: 1 }}>
                <Calendar size={14} /> {b.date} &bull; <Clock size={14} /> {b.start_time} - {b.end_time}
              </Typography>

              <Typography variant="body2" sx={{ color: '#9CA3AF', mb: 1 }}>
                Client: <Box component="span" sx={{ color: '#F9FAFB', fontWeight: 600 }}>{b.client_name}</Box>
              </Typography>

              {/* Price Breakup Banner on Trainer Dashboard */}
              <Box sx={{ p: 1.5, bgcolor: '#0B0F19', borderRadius: 1.5, border: '1px solid #1F2937' }}>
                <Typography variant="caption" sx={{ color: '#9CA3AF', display: 'block', mb: 0.5, fontWeight: 600 }}>
                  Price Breakup:
                </Typography>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
                  <Typography variant="caption" sx={{ color: '#D1D5DB' }}>
                    Base: {formatINR(b.amount_subtotal, { decimals: true })} + 10% Fee: {formatINR(b.trainer_fee, { decimals: true })}
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#E0FE10', fontWeight: 700 }}>
                    Total: {formatINR(b.total_charged, { decimals: true })}
                  </Typography>
                </Box>
              </Box>
            </Card>
          </Grid>
        ))}
      </Grid>

      <COIUploadModal
        open={openCOIModal}
        onClose={() => setOpenCOIModal(false)}
        trainerId={currentUser.id}
        onSubmitted={() => {
          fetchBookings();
        }}
      />
    </Container>
  );
}

// -------------------------------------------------------------
// SCREEN 7: HOST DASHBOARD & PAYOUTS
// -------------------------------------------------------------
function HostDashboardScreen() {
  const { currentUser } = useAuth();
  const [data, setData] = useState({ gyms: [], bookings: [], ledger: {} });
  const [selectedIncidentBooking, setSelectedIncidentBooking] = useState(null);

  const fetchHostData = () => {
    fetch('/api/host/dashboard?hostId=usr_elena')
      .then((r) => r.json())
      .then((res) => res.success && setData(res.data));
  };

  useEffect(() => {
    fetchHostData();
  }, []);

  return (
    <Container maxWidth="xl" sx={{ py: 5 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 800 }}>Gym Host Studio Management</Typography>
        <Typography variant="body2" sx={{ color: '#9CA3AF' }}>
          Real-time calendar bookings and net earnings ledger for Elena Rostova (Iron Vault Strength Club)
        </Typography>
      </Box>

      {/* Ledger Cards */}
      <HostEarningsCard ledger={data.ledger} />

      {/* Schedule Table */}
      <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>Upcoming Trainer Sessions</Typography>
      <HostScheduleTable bookings={data.bookings} onReportIncident={setSelectedIncidentBooking} />

      <IncidentReportModal
        open={Boolean(selectedIncidentBooking)}
        onClose={() => setSelectedIncidentBooking(null)}
        booking={selectedIncidentBooking}
        hostId={currentUser.id}
        onReported={() => {
          fetchHostData();
        }}
      />
    </Container>
  );
}

// -------------------------------------------------------------
// SCREEN 8: ADMIN VERIFICATION QUEUE
// -------------------------------------------------------------
function AdminQueueScreen() {
  const [trainers, setTrainers] = useState([]);

  const fetchTrainers = () => {
    fetch('/api/admin/coi-queue')
      .then((r) => r.json())
      .then((res) => res.success && setTrainers(res.data));
  };

  useEffect(() => {
    fetchTrainers();
  }, []);

  const handleStatusUpdate = (userId, newStatus) => {
    setTrainers((prev) =>
      prev.map((t) => (t.id === userId ? { ...t, coi_status: newStatus } : t))
    );
  };

  return (
    <Container maxWidth="xl" sx={{ py: 5 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 800 }}>Admin Compliance & COI Verification</Typography>
        <Typography variant="body2" sx={{ color: '#9CA3AF' }}>
          Inspect trainer professional liability insurance & certifications (REPs India / ACE) and update verification status.
        </Typography>
      </Box>

      <COIVerificationTable trainers={trainers} onStatusUpdate={handleStatusUpdate} />
    </Container>
  );
}
