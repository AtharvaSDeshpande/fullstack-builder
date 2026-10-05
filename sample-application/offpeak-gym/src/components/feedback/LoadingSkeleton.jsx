import React from 'react';
import { Box, Skeleton, Grid, Card, CardContent } from '@mui/material';

export default function LoadingSkeleton({ count = 6 }) {
  return (
    <Grid container spacing={3}>
      {Array.from(new Array(count)).map((_, i) => (
        <Grid item xs={12} sm={6} md={4} key={i}>
          <Card sx={{ bgcolor: '#111827', border: '1px solid #1F2937' }}>
            <Skeleton variant="rectangular" height={180} sx={{ bgcolor: '#1F2937' }} />
            <CardContent>
              <Skeleton variant="text" width="60%" height={28} sx={{ bgcolor: '#1F2937' }} />
              <Skeleton variant="text" width="80%" height={20} sx={{ bgcolor: '#1F2937', my: 1 }} />
              <Skeleton variant="rectangular" width="40%" height={32} sx={{ bgcolor: '#1F2937', mt: 2 }} />
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  );
}
