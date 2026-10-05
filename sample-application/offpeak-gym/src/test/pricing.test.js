import { describe, it, expect } from 'vitest';
import { calculateBookingBreakdown } from '../integrations/razorpay';
import { formatINR } from '../utils/currency';

describe('Pricing & Fee Calculations (INR & Razorpay Gateway)', () => {
  it('correctly calculates 10% trainer platform fee and 5% host processing fee for INR standard rate (₹1,200)', () => {
    const subtotal = 1200.0;
    const result = calculateBookingBreakdown(subtotal);

    expect(result.subtotal).toBe(1200.0);
    expect(result.trainerFee).toBe(120.0); // 10%
    expect(result.hostFee).toBe(60.0);    // 5%
    expect(result.totalCharged).toBe(1320.0); // subtotal + trainerFee
    expect(result.hostNetEarnings).toBe(1140.0); // subtotal - hostFee
  });

  it('handles Indian bay rates cleanly (₹999)', () => {
    const subtotal = 999.0;
    const result = calculateBookingBreakdown(subtotal);

    expect(result.trainerFee).toBe(99.9);
    expect(result.hostFee).toBe(49.95);
    expect(result.totalCharged).toBe(1098.9);
    expect(result.hostNetEarnings).toBe(949.05);
  });

  it('formats INR currency with consistent commas and decimals', () => {
    expect(formatINR(999)).toBe('₹999');
    expect(formatINR(1299)).toBe('₹1,299');
    expect(formatINR(1098.9, { decimals: true })).toBe('₹1,098.90');
    expect(formatINR(949.05, { decimals: true })).toBe('₹949.05');
    expect(formatINR(0, { decimals: true })).toBe('₹0.00');
  });

  it('guarantees price breakup arithmetic consistency across entire bay rate spectrum (₹899 - ₹1,999)', () => {
    const catalogRates = [899, 999, 1099, 1199, 1299, 1399, 1599, 1799, 1999];
    catalogRates.forEach((rate) => {
      const breakdown = calculateBookingBreakdown(rate);
      // Math: Base + 10% Fee = Total Charged
      expect(+(breakdown.subtotal + breakdown.trainerFee).toFixed(2)).toBe(breakdown.totalCharged);
      // Math: Base - 5% Host Fee = Host Net Payout
      expect(+(breakdown.subtotal - breakdown.hostFee).toFixed(2)).toBe(breakdown.hostNetEarnings);
      // String formatting integrity
      expect(formatINR(breakdown.totalCharged, { decimals: true })).toContain('₹');
      expect(formatINR(breakdown.hostNetEarnings, { decimals: true })).toContain('₹');
    });
  });
});
