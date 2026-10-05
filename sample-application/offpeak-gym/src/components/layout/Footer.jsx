import React from 'react';
import { Box, Container, Typography, Grid, Link as MuiLink } from '@mui/material';
import Logo from '../brand/Logo';

export default function Footer() {
  return (
    <Box component="footer" sx={{ bgcolor: '#0B0F19', borderTop: '1px solid #1F2937', py: 6, mt: 'auto' }}>
      <Container maxWidth="xl">
        <Grid container spacing={4} sx={{ mb: 4 }}>
          <Grid item xs={12} md={5}>
            <Logo size={32} />
            <Typography variant="body2" sx={{ color: '#9CA3AF', mt: 2, maxWidth: 400, lineHeight: 1.6 }}>
              The premier hourly equipment bay and turf rental marketplace for certified freelance trainers and boutique fitness studio owners.
            </Typography>
          </Grid>
          <Grid item xs={6} md={3}>
            <Typography variant="subtitle2" sx={{ color: '#F9FAFB', fontWeight: 700, mb: 1.5 }}>
              Marketplace
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <MuiLink href="/explore" sx={{ color: '#9CA3AF', fontSize: '0.875rem', '&:hover': { color: '#E0FE10' } }}>
                Browse Squat Racks
              </MuiLink>
              <MuiLink href="/explore" sx={{ color: '#9CA3AF', fontSize: '0.875rem', '&:hover': { color: '#E0FE10' } }}>
                Sprint & Turf Lanes
              </MuiLink>
              <MuiLink href="/explore" sx={{ color: '#9CA3AF', fontSize: '0.875rem', '&:hover': { color: '#E0FE10' } }}>
                Olympic Lifting Platforms
              </MuiLink>
            </Box>
          </Grid>
          <Grid item xs={6} md={4}>
            <Typography variant="subtitle2" sx={{ color: '#F9FAFB', fontWeight: 700, mb: 1.5 }}>
              Trust & Compliance
            </Typography>
            <Typography variant="caption" sx={{ color: '#6B7280', display: 'block', mb: 1 }}>
              All rentals include mandatory verified liability coverage and digital client waivers.
            </Typography>
            <Typography variant="caption" sx={{ color: '#4B5563', display: 'block' }}>
              Payments secured via Razorpay. UPI, Netbanking & Cards supported. Zero raw card data stored.
            </Typography>
          </Grid>
        </Grid>
        <Box sx={{ pt: 3, borderTop: '1px solid #1F2937', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
          <Typography variant="caption" sx={{ color: '#6B7280' }}>
            &copy; {new Date().getFullYear()} OffPeak Gym Inc. All rights reserved.
          </Typography>
          <Typography variant="caption" sx={{ color: '#4B5563' }}>
            Standard 60-min sessions with 10-minute automated transition buffers.
          </Typography>
        </Box>
      </Container>
    </Box>
  );
}
