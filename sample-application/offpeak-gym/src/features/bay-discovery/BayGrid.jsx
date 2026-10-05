import React from 'react';
import { Grid } from '@mui/material';
import BayCard from './BayCard';
import LoadingSkeleton from '../../components/feedback/LoadingSkeleton';
import EmptyState from '../../components/feedback/EmptyState';

export default function BayGrid({ bays = [], loading = false, onReset }) {
  if (loading) {
    return <LoadingSkeleton count={6} />;
  }

  if (bays.length === 0) {
    return (
      <EmptyState
        title="No equipment bays match your criteria"
        message="Try selecting 'All' categories or loosening your price filter to discover available boutique spaces."
        onAction={onReset}
        actionLabel="Clear Filters"
      />
    );
  }

  return (
    <Grid container spacing={3}>
      {bays.map((bay) => (
        <Grid item xs={12} sm={6} lg={4} key={bay.id}>
          <BayCard bay={bay} />
        </Grid>
      ))}
    </Grid>
  );
}
