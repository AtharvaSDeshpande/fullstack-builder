import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import App from '../App';

describe('App Root Component & Role Switching', () => {
  it('renders OffPeak Gym logo and main navigation', () => {
    render(<App />);
    expect(screen.getAllByText(/OFFPEAK/i)[0]).toBeInTheDocument();
    expect(screen.getByText(/Explore Bays/i)).toBeInTheDocument();
  });

  it('allows switching between Trainer, Host, and Admin roles', () => {
    render(<App />);

    // Click Host chip
    const hostChip = screen.getByRole('button', { name: /^Host$/i });
    fireEvent.click(hostChip);

    // Host portal link should appear
    expect(screen.getByRole('link', { name: /Host Portal/i })).toBeInTheDocument();

    // Click Admin chip
    const adminChip = screen.getByRole('button', { name: /^Admin$/i });
    fireEvent.click(adminChip);

    // Admin queue link should appear
    expect(screen.getByRole('link', { name: /Admin Queue/i })).toBeInTheDocument();
  });
});
