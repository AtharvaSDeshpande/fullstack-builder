import React, { useState } from 'react';
import { Box, Typography, Chip, Grid, Button, Paper } from '@mui/material';
import { Calendar, Clock, Check } from 'lucide-react';

export default function SlotSelector({ slots = [], selectedSlot, onSelectSlot }) {
  const [activeDate, setActiveDate] = useState(() => {
    return slots[0]?.date || new Date().toISOString().slice(0, 10);
  });

  // Extract unique dates
  const uniqueDates = [...new Set(slots.map((s) => s.date))];
  const slotsForDate = slots.filter((s) => s.date === activeDate);

  return (
    <Box sx={{ my: 3 }}>
      <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
        <Calendar size={18} color="#E0FE10" /> Select 60-Minute Off-Peak Slot
      </Typography>

      {/* Date Tabs */}
      <Box sx={{ display: 'flex', gap: 1, mb: 2.5, overflowX: 'auto', pb: 0.5 }}>
        {uniqueDates.map((dateStr) => {
          const isSelected = activeDate === dateStr;
          const d = new Date(`${dateStr}T12:00:00`);
          const label = d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

          return (
            <Chip
              key={dateStr}
              label={label}
              clickable
              onClick={() => setActiveDate(dateStr)}
              sx={{
                bgcolor: isSelected ? '#E0FE10' : '#111827',
                color: isSelected ? '#000' : '#9CA3AF',
                fontWeight: isSelected ? 700 : 500,
                border: isSelected ? '1px solid #E0FE10' : '1px solid #374151',
                px: 1,
              }}
            />
          );
        })}
      </Box>

      {/* Time Slot Buttons */}
      <Grid container spacing={1.5}>
        {slotsForDate.map((slot) => {
          const isSelected = selectedSlot?.id === slot.id;
          const isBooked = slot.status === 'booked';

          return (
            <Grid item xs={6} sm={4} md={4} key={slot.id}>
              <Paper
                onClick={() => !isBooked && onSelectSlot(slot)}
                sx={{
                  p: 1.5,
                  textAlign: 'center',
                  cursor: isBooked ? 'not-allowed' : 'pointer',
                  bgcolor: isSelected ? 'rgba(224, 254, 16, 0.15)' : isBooked ? '#1F2937' : '#111827',
                  border: isSelected ? '2px solid #E0FE10' : isBooked ? '1px solid #374151' : '1px solid #374151',
                  opacity: isBooked ? 0.45 : 1,
                  transition: 'all 0.2s',
                  '&:hover': !isBooked ? { borderColor: '#E0FE10', bgcolor: 'rgba(224, 254, 16, 0.05)' } : {},
                }}
              >
                <Typography variant="body2" sx={{ fontWeight: 700, color: isSelected ? '#E0FE10' : isBooked ? '#6B7280' : '#F9FAFB' }}>
                  {slot.start_time} - {slot.end_time}
                </Typography>
                <Typography variant="caption" sx={{ color: isBooked ? '#EF4444' : '#10B981', display: 'block', mt: 0.5 }}>
                  {isBooked ? 'Booked' : 'Available (60 min)'}
                </Typography>
              </Paper>
            </Grid>
          );
        })}
      </Grid>
    </Box>
  );
}
