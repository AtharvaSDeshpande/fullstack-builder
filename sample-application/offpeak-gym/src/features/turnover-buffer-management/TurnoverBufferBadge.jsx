import React from 'react';
import { Box, Typography } from '@mui/material';
import { Clock } from 'lucide-react';

export default function TurnoverBufferBadge({ startTime, endTime, bufferEndTime }) {
  return (
    <Box
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 1,
        bgcolor: 'rgba(56, 189, 248, 0.1)',
        border: '1px solid rgba(56, 189, 248, 0.25)',
        borderRadius: 2,
        px: 1.5,
        py: 0.75,
      }}
    >
      <Clock size={16} color="#38BDF8" />
      <Box>
        <Typography variant="caption" sx={{ color: '#F9FAFB', fontWeight: 600, display: 'block', lineHeight: 1.2 }}>
          {startTime} - {endTime} (+10m buffer to {bufferEndTime || `${endTime.slice(0, 2)}:10`})
        </Typography>
        <Typography variant="caption" sx={{ color: '#9CA3AF', fontSize: '0.7rem' }}>
          Strict 10-min turnover window ensures zero clash with studio classes.
        </Typography>
      </Box>
    </Box>
  );
}
