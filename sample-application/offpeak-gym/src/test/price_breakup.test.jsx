import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import BayCard from '../features/bay-discovery/BayCard';
import BookingSummaryCard from '../features/hourly-booking/BookingSummaryCard';
import HostScheduleTable from '../features/host-payout-ledger/HostScheduleTable';
import HostEarningsCard from '../features/host-payout-ledger/HostEarningsCard';

describe('Price Breakup Visibility on Dual-Value Screens', () => {
  it('BayCard displays clear price breakup connecting base rate and total with fee', () => {
    const mockBay = {
      id: 'bay_test_1',
      name: 'Rogue Monster Rack',
      category: 'Squat Rack',
      hourly_rate: 999,
      gym_name: 'Iron Vault',
      gym_city: 'Pune',
      equipment_tags: ['Barbell', 'Bumper Plates'],
      offpeak_start: '10:00',
      offpeak_end: '16:00',
    };

    render(
      <MemoryRouter>
        <BayCard bay={mockBay} />
      </MemoryRouter>
    );

    // Verify both base rate, fee, and total are visibly broken down
    expect(screen.getByText(/Base ₹999 \+ 10% fee/i)).toBeInTheDocument();
    expect(screen.getByText(/Total: ₹1,098.90/i)).toBeInTheDocument();
  });

  it('BookingSummaryCard renders explicit Price Breakup Formula', () => {
    const mockBay = {
      id: 'bay_test_1',
      name: 'Rogue Monster Rack',
      hourly_rate: 999,
    };

    render(
      <BookingSummaryCard
        bay={mockBay}
        slot={{ id: 'slt_test_1', date: '2026-10-05', start_time: '10:00', end_time: '11:00' }}
        clientName="Test Client"
        clientEmail="client@test.com"
      />
    );

    expect(screen.getByText(/Price Breakup Formula:/i)).toBeInTheDocument();
    expect(
      screen.getByText(/₹999\.00 \(Base Bay\) \+ ₹99\.90 \(10% Platform Fee\) = ₹1,098\.90/i)
    ).toBeInTheDocument();
    expect(screen.getByText('₹1,098.90')).toBeInTheDocument();
  });

  it('HostScheduleTable renders Net Payout & Price Breakup column with gross and fee deductions', () => {
    const mockBookings = [
      {
        id: 'bkg_001',
        date: '2026-10-05',
        start_time: '10:00',
        end_time: '11:00',
        bay_name: 'Rogue Monster Rack',
        gym_name: 'Iron Vault',
        trainer_name: 'Marcus Vance',
        trainer_phone: '+91 98900 29809',
        client_name: 'Jordan Tyler',
        amount_subtotal: 999,
        host_fee: 49.95,
        total_charged: 1098.9,
      },
    ];

    render(<HostScheduleTable bookings={mockBookings} />);

    expect(screen.getByText(/Net Payout & Price Breakup/i)).toBeInTheDocument();
    expect(screen.getByText(/Net: ₹949\.05/i)).toBeInTheDocument();
    expect(screen.getByText(/Breakup: ₹999\.00 gross - ₹49\.95 \(5% fee\)/i)).toBeInTheDocument();
  });

  it('HostEarningsCard displays mathematical formula connecting gross volume and net payout', () => {
    const mockLedger = {
      grossEarnings: 4995,
      platformFees: 249.75,
      netPayout: 4745.25,
      totalHoursBooked: 5,
    };

    render(<HostEarningsCard ledger={mockLedger} />);

    expect(
      screen.getByText(/Breakup: ₹4,995\.00 gross - ₹249\.75 fee/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/5% platform fee deducted from ₹4,995\.00 gross/i)
    ).toBeInTheDocument();
  });
});
