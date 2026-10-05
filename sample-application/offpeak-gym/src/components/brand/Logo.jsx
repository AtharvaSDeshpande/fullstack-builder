import React from 'react';
import { Box, Typography } from '@mui/material';

export default function Logo({ size = 32, withText = true }) {
  return (
    <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 1.5, textDecoration: 'none' }}>
      <Box
        sx={{
          width: size,
          height: size,
          borderRadius: `${size * 0.25}px`,
          bgcolor: '#E0FE10',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 0 15px rgba(224, 254, 16, 0.35)',
        }}
      >
        <svg width={size * 0.65} height={size * 0.65} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="6" cy="12" r="3" stroke="#000000" strokeWidth="2.5" />
          <circle cx="18" cy="12" r="3" stroke="#000000" strokeWidth="2.5" />
          <path d="M9 12H15" stroke="#000000" strokeWidth="2.5" strokeLinecap="round" />
          <path d="M4 8V16M20 8V16" stroke="#000000" strokeWidth="2.5" strokeLinecap="round" />
        </svg>
      </Box>
      {withText && (
        <Typography
          variant="h6"
          sx={{
            fontFamily: "'Outfit', sans-serif",
            fontWeight: 800,
            letterSpacing: '-0.5px',
            color: '#F9FAFB',
            lineHeight: 1,
          }}
        >
          OFFPEAK<Box component="span" sx={{ color: '#E0FE10' }}>GYM</Box>
        </Typography>
      )}
    </Box>
  );
}
