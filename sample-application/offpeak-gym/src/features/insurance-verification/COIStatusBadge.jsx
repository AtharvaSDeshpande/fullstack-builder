import React from 'react';
import { Chip } from '@mui/material';
import { ShieldCheck, ShieldAlert, Clock } from 'lucide-react';

export default function COIStatusBadge({ status = 'unsubmitted' }) {
  if (status === 'approved') {
    return (
      <Chip
        icon={<ShieldCheck size={16} color="#10B981" />}
        label="Insurance & Certification Verified"
        size="small"
        sx={{
          bgcolor: 'rgba(16, 185, 129, 0.15)',
          color: '#10B981',
          border: '1px solid rgba(16, 185, 129, 0.3)',
          fontWeight: 600,
        }}
      />
    );
  }

  if (status === 'pending') {
    return (
      <Chip
        icon={<Clock size={16} color="#F59E0B" />}
        label="COI Verification Pending"
        size="small"
        sx={{
          bgcolor: 'rgba(245, 158, 11, 0.15)',
          color: '#F59E0B',
          border: '1px solid rgba(245, 158, 11, 0.3)',
          fontWeight: 600,
        }}
      />
    );
  }

  return (
    <Chip
      icon={<ShieldAlert size={16} color="#EF4444" />}
      label="COI Action Required"
      size="small"
      sx={{
        bgcolor: 'rgba(239, 68, 68, 0.15)',
        color: '#EF4444',
        border: '1px solid rgba(239, 68, 68, 0.3)',
        fontWeight: 600,
      }}
    />
  );
}
