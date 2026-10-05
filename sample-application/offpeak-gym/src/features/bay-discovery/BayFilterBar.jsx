import React from 'react';
import { Box, TextField, InputAdornment, Chip, Select, MenuItem, FormControl, InputLabel, Typography } from '@mui/material';
import { Search, SlidersHorizontal, IndianRupee } from 'lucide-react';

const CATEGORIES = [
  'All',
  'Squat Rack',
  'Olympic Platform',
  'Turf Lane',
  'Boxing Ring',
  'Boxing Bags',
  'Reformer Pilates',
  'Cardio / MetCon',
];

const PRICE_TIERS = [
  { label: 'All Rates', value: '' },
  { label: 'Under ₹1,000/hr', value: '1000' },
  { label: 'Under ₹1,500/hr', value: '1500' },
  { label: 'Up to ₹2,000/hr', value: '2000' },
];

export default function BayFilterBar({
  search,
  onSearchChange,
  category,
  onCategoryChange,
  city,
  onCityChange,
  cities = ['All', 'Koregaon Park', 'Kalyani Nagar', 'Baner', 'Aundh', 'Kothrud', 'Shivajinagar'],
  maxRate = '',
  onMaxRateChange,
}) {
  return (
    <Box sx={{ mb: 4 }}>
      {/* Search Input and City Selector */}
      <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: { xs: 'wrap', sm: 'nowrap' } }}>
        <TextField
          placeholder="Search by equipment, barbell type, or gym name..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          fullWidth
          size="small"
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search size={18} color="#9CA3AF" />
              </InputAdornment>
            ),
            sx: { bgcolor: '#111827', borderRadius: 2 },
          }}
        />

        <FormControl size="small" sx={{ minWidth: 170 }}>
          <InputLabel id="city-select-label" sx={{ color: '#9CA3AF' }}>Locality / Area</InputLabel>
          <Select
            labelId="city-select-label"
            value={city}
            label="Locality / Area"
            onChange={(e) => onCityChange(e.target.value)}
            sx={{ bgcolor: '#111827', borderRadius: 2 }}
          >
            {cities.map((c) => (
              <MenuItem key={c} value={c}>
                {c === 'All' ? 'All Locations' : c}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      {/* Quick Category Filter Pills */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, overflowX: 'auto', pb: 1, mb: 1, '::-webkit-scrollbar': { height: 4 } }}>
        <Typography variant="caption" sx={{ color: '#6B7280', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 0.5, pr: 1, whiteSpace: 'nowrap' }}>
          <SlidersHorizontal size={14} /> Zones:
        </Typography>
        {CATEGORIES.map((cat) => {
          const isSelected = category === cat;
          return (
            <Chip
              key={cat}
              label={cat}
              size="small"
              clickable
              onClick={() => onCategoryChange(cat)}
              sx={{
                bgcolor: isSelected ? '#E0FE10' : '#111827',
                color: isSelected ? '#000000' : '#9CA3AF',
                fontWeight: isSelected ? 700 : 500,
                border: isSelected ? '1px solid #E0FE10' : '1px solid #374151',
                '&:hover': {
                  bgcolor: isSelected ? '#CCEE00' : '#1F2937',
                  color: isSelected ? '#000000' : '#F9FAFB',
                },
              }}
            />
          );
        })}
      </Box>

      {/* Hourly Rate (INR) Filter Pills */}
      {onMaxRateChange && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, overflowX: 'auto', pb: 1, '::-webkit-scrollbar': { height: 4 } }}>
          <Typography variant="caption" sx={{ color: '#6B7280', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 0.5, pr: 1, whiteSpace: 'nowrap' }}>
            <IndianRupee size={14} /> Price:
          </Typography>
          {PRICE_TIERS.map((tier) => {
            const isSelected = maxRate === tier.value;
            return (
              <Chip
                key={tier.label}
                label={tier.label}
                size="small"
                clickable
                onClick={() => onMaxRateChange(tier.value)}
                sx={{
                  bgcolor: isSelected ? '#38BDF8' : '#111827',
                  color: isSelected ? '#000000' : '#9CA3AF',
                  fontWeight: isSelected ? 700 : 500,
                  border: isSelected ? '1px solid #38BDF8' : '1px solid #374151',
                  '&:hover': {
                    bgcolor: isSelected ? '#0284C7' : '#1F2937',
                    color: isSelected ? '#000000' : '#F9FAFB',
                  },
                }}
              />
            );
          })}
        </Box>
      )}
    </Box>
  );
}
