import React from 'react';
import { Grid, Card, CardContent, Typography, Box } from '@mui/material';
import { IndianRupee, Percent, Clock, TrendingUp } from 'lucide-react';
import { formatINR } from '../../utils/currency';

export default function HostEarningsCard({ ledger = {} }) {
  const cards = [
    {
      title: 'Net Payout Balance',
      value: formatINR(ledger.netPayout || 0, { decimals: true }),
      subtitle: `Breakup: ${formatINR(ledger.grossEarnings || 0, { decimals: true })} gross - ${formatINR(ledger.platformFees || 0, { decimals: true })} fee`,
      icon: IndianRupee,
      color: '#E0FE10',
    },
    {
      title: 'Gross Off-Peak Volume',
      value: formatINR(ledger.grossEarnings || 0, { decimals: true }),
      subtitle: `${ledger.totalHoursBooked || 0} hours booked @ base rate`,
      icon: TrendingUp,
      color: '#38BDF8',
    },
    {
      title: 'Platform Fee (5%)',
      value: `-${formatINR(ledger.platformFees || 0, { decimals: true })}`,
      subtitle: `5% platform fee deducted from ${formatINR(ledger.grossEarnings || 0, { decimals: true })} gross`,
      icon: Percent,
      color: '#9CA3AF',
    },
    {
      title: 'Off-Peak Hours Utilized',
      value: `${ledger.totalHoursBooked || 0} hrs`,
      subtitle: 'Across active equipment bays',
      icon: Clock,
      color: '#10B981',
    },
  ];

  return (
    <Grid container spacing={2.5} sx={{ mb: 4 }}>
      {cards.map((c, i) => {
        const Icon = c.icon;
        return (
          <Grid item xs={12} sm={6} md={3} key={i}>
            <Card sx={{ bgcolor: '#111827', border: '1px solid #1F2937', height: '100%' }}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                  <Typography variant="caption" sx={{ color: '#9CA3AF', fontWeight: 600, textTransform: 'uppercase' }}>
                    {c.title}
                  </Typography>
                  <Box sx={{ p: 1, borderRadius: 1.5, bgcolor: '#1F2937', color: c.color }}>
                    <Icon size={18} />
                  </Box>
                </Box>
                <Typography variant="h4" sx={{ fontWeight: 800, color: '#F9FAFB', fontFamily: "'Outfit', sans-serif", mb: 0.5 }}>
                  {c.value}
                </Typography>
                <Typography variant="caption" sx={{ color: '#6B7280' }}>
                  {c.subtitle}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        );
      })}
    </Grid>
  );
}
