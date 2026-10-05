import { describe, it, expect } from 'vitest';
import { validateWaiver } from '../security/waiver';

describe('Client Liability Waiver Validation', () => {
  it('validates a complete waiver submission', () => {
    const res = validateWaiver('Jordan Tyler', 'jordan.t@gmail.com', true);
    expect(res.valid).toBe(true);
  });

  it('rejects an unsigned waiver', () => {
    const res = validateWaiver('Jordan Tyler', 'jordan.t@gmail.com', false);
    expect(res.valid).toBe(false);
    expect(res.error).toMatch(/must agree to the liability waiver/i);
  });

  it('rejects an invalid client email', () => {
    const res = validateWaiver('Jordan Tyler', 'not-an-email', true);
    expect(res.valid).toBe(false);
    expect(res.error).toMatch(/valid client email is required/i);
  });
});
