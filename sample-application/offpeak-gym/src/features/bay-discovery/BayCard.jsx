import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardMedia, CardContent, Typography, Box, Chip, Button } from '@mui/material';
import { MapPin, Clock, ArrowRight } from 'lucide-react';

import { formatINR } from '../../utils/currency';

export default function BayCard({ bay }) {
  const photo = (bay.gym_photos && bay.gym_photos[0]) || 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800';

  return (
    <Card
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        bgcolor: '#111827',
        border: '1px solid #1F2937',
        transition: 'transform 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease',
        '&:hover': {
          transform: 'translateY(-4px)',
          borderColor: '#374151',
          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5), 0 0 15px rgba(224, 254, 16, 0.1)',
        },
      }}
    >
      <Box sx={{ position: 'relative' }}>
        <CardMedia component="img" height="190" image={photo} alt={bay.name} sx={{ objectFit: 'cover' }} />
        <Chip
          label={bay.category}
          size="small"
          sx={{
            position: 'absolute',
            top: 12,
            left: 12,
            bgcolor: 'rgba(11, 15, 25, 0.85)',
            backdropFilter: 'blur(8px)',
            color: '#E0FE10',
            fontWeight: 700,
            border: '1px solid rgba(224, 254, 16, 0.3)',
          }}
        />
        <Box
          sx={{
            position: 'absolute',
            bottom: 12,
            right: 12,
            bgcolor: '#E0FE10',
            color: '#000000',
            px: 1.5,
            py: 0.5,
            borderRadius: 1.5,
            fontWeight: 800,
            fontFamily: "'Outfit', sans-serif",
            fontSize: '0.95rem',
            boxShadow: '0 2px 8px rgba(0,0,0,0.4)',
          }}
        >
          {formatINR(bay.hourly_rate)}<Typography component="span" sx={{ fontSize: '0.75rem', fontWeight: 600 }}>/hr</Typography>
        </Box>
      </Box>

      <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', p: 2.5 }}>
        <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5, color: '#F9FAFB' }}>
          {bay.name}
        </Typography>
        <Typography variant="body2" sx={{ color: '#9CA3AF', display: 'flex', alignItems: 'center', gap: 0.5, mb: 1.5 }}>
          <MapPin size={15} color="#38BDF8" /> {bay.gym_name} &bull; {bay.gym_city}
        </Typography>

        {/* Equipment Tags */}
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75, mb: 2, flexGrow: 1 }}>
          {(bay.equipment_tags || []).slice(0, 3).map((tag, i) => (
            <Chip
              key={i}
              label={tag}
              size="small"
              sx={{ bgcolor: '#1F2937', color: '#D1D5DB', fontSize: '0.75rem', height: 24 }}
            />
          ))}
          {(bay.equipment_tags || []).length > 3 && (
            <Chip
              label={`+${bay.equipment_tags.length - 3}`}
              size="small"
              sx={{ bgcolor: '#1F2937', color: '#9CA3AF', fontSize: '0.75rem', height: 24 }}
            />
          )}
        </Box>

        {/* Price Breakup Summary Banner */}
        <Box sx={{ mb: 1.5, px: 1.25, py: 0.75, bgcolor: '#0B0F19', borderRadius: 1.5, border: '1px solid #1F2937', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="caption" sx={{ color: '#9CA3AF', fontSize: '0.72rem' }}>
            Base {formatINR(bay.hourly_rate)} + 10% fee
          </Typography>
          <Typography variant="caption" sx={{ color: '#E0FE10', fontWeight: 700, fontSize: '0.75rem' }}>
            Total: {formatINR(+(bay.hourly_rate * 1.1).toFixed(2), { decimals: true })}
          </Typography>
        </Box>

        {/* Off-peak Hours Indicator */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pt: 1.5, borderTop: '1px solid #1F2937' }}>
          <Typography variant="caption" sx={{ color: '#9CA3AF', display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Clock size={13} color="#10B981" /> Off-peak {bay.offpeak_start} - {bay.offpeak_end}
          </Typography>
          <Button
            component={Link}
            to={`/bays/${bay.id}`}
            variant="text"
            color="primary"
            size="small"
            endIcon={<ArrowRight size={14} />}
            sx={{ fontWeight: 700, p: 0 }}
          >
            Select Slot
          </Button>
        </Box>
      </CardContent>
    </Card>
  );
}
