import React from 'react';
import {
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, Typography, Chip, Button, Box
} from '@mui/material';
import { AlertTriangle, Clock, User } from 'lucide-react';

import { formatINR } from '../../utils/currency';

export default function HostScheduleTable({ bookings = [], onReportIncident }) {
  if (bookings.length === 0) {
    return (
      <Paper sx={{ p: 4, textAlign: 'center', bgcolor: '#111827', border: '1px solid #1F2937', borderRadius: 3 }}>
        <Typography variant="body1" sx={{ color: '#9CA3AF' }}>
          No upcoming trainer bookings scheduled for your bays yet.
        </Typography>
      </Paper>
    );
  }

  return (
    <TableContainer component={Paper} sx={{ bgcolor: '#111827', border: '1px solid #1F2937', borderRadius: 3 }}>
      <Table>
        <TableHead sx={{ bgcolor: '#0B0F19' }}>
          <TableRow>
            <TableCell sx={{ color: '#9CA3AF', fontWeight: 700 }}>Date & Slot</TableCell>
            <TableCell sx={{ color: '#9CA3AF', fontWeight: 700 }}>Equipment Bay</TableCell>
            <TableCell sx={{ color: '#9CA3AF', fontWeight: 700 }}>Trainer</TableCell>
            <TableCell sx={{ color: '#9CA3AF', fontWeight: 700 }}>Client & Waiver</TableCell>
            <TableCell sx={{ color: '#9CA3AF', fontWeight: 700 }}>Net Payout & Price Breakup</TableCell>
            <TableCell sx={{ color: '#9CA3AF', fontWeight: 700 }} align="right">Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {bookings.map((b) => {
            const hostNet = +(b.amount_subtotal - b.host_fee).toFixed(2);

            return (
              <TableRow key={b.id} sx={{ '&:hover': { bgcolor: '#1F2937' } }}>
                <TableCell sx={{ color: '#F9FAFB' }}>
                  <Typography variant="body2" sx={{ fontWeight: 700 }}>
                    {b.date}
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#9CA3AF', display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Clock size={12} color="#10B981" /> {b.start_time} - {b.end_time}
                  </Typography>
                </TableCell>
                <TableCell sx={{ color: '#F9FAFB' }}>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>{b.bay_name}</Typography>
                  <Typography variant="caption" sx={{ color: '#6B7280' }}>{b.gym_name}</Typography>
                </TableCell>
                <TableCell sx={{ color: '#F9FAFB' }}>
                  <Typography variant="display" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: '#F9FAFB', fontSize: '0.875rem' }}>
                    <User size={14} color="#38BDF8" /> {b.trainer_name}
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#6B7280' }}>{b.trainer_phone}</Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2" sx={{ color: '#F9FAFB' }}>{b.client_name}</Typography>
                  <Chip label="Waiver Signed" size="small" sx={{ bgcolor: 'rgba(16, 185, 129, 0.15)', color: '#10B981', height: 20, fontSize: '0.7rem' }} />
                </TableCell>
                <TableCell>
                  <Typography variant="body2" sx={{ fontWeight: 700, color: '#E0FE10' }}>
                    Net: {formatINR(hostNet, { decimals: true })}
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#9CA3AF', display: 'block' }}>
                    Breakup: {formatINR(b.amount_subtotal, { decimals: true })} gross - {formatINR(b.host_fee, { decimals: true })} (5% fee)
                  </Typography>
                </TableCell>
                <TableCell align="right">
                  <Button
                    size="small"
                    variant="outlined"
                    color="warning"
                    startIcon={<AlertTriangle size={14} />}
                    onClick={() => onReportIncident && onReportIncident(b)}
                    sx={{ fontSize: '0.75rem', py: 0.5 }}
                  >
                    Report Issue
                  </Button>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
