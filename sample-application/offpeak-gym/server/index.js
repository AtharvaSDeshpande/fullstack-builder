import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import baysRouter from './routes/bays.js';
import bookingsRouter from './routes/bookings.js';
import hostRouter from './routes/host.js';
import adminRouter from './routes/admin.js';
import authRouter from './auth/index.js';
import paymentsRouter from './routes/payments.js';
import { errorHandler } from './middleware/error.js';

dotenv.config();

const app = express();
const PORT = process.env.BACKEND_PORT || (process.env.PORT === '3000' ? 3001 : (process.env.PORT || 3001));

app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'offpeak-gym-api',
    region: 'India (Pune)',
    currency: 'INR',
    timestamp: new Date().toISOString(),
    liveThirdParties: {
      razorpayConfigured: Boolean(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET),
      twilioConfigured: Boolean(process.env.TWILIO_ACCOUNT_SID),
    },
  });
});

// Mount Routes
app.use('/api/bays', baysRouter);
app.use('/api/bookings', bookingsRouter);
app.use('/api/host', hostRouter);
app.use('/api/admin', adminRouter);
app.use('/api/auth', authRouter);
app.use('/api/payments', paymentsRouter);

// Error Handler
app.use(errorHandler);

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`OffPeak Gym API server listening on http://localhost:${PORT}`);
  });
}

export default app;
