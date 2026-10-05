import React, { useState } from 'react';
import { Box, Typography, Paper, Chip, Button, ButtonGroup, Tooltip } from '@mui/material';
import { MapPin, Navigation, Compass, Crosshair, Sparkles, Building2 } from 'lucide-react';

const DEFAULT_PUNE_GYMS = [
  { id: 'gym_iron_vault', name: 'Iron Vault Strength Club', locality: 'Koregaon Park', address: '14 Lane 7, Koregaon Park', lat: 18.5362, lng: 73.8940, bayCount: 3, category: 'Powerlifting / Free Weights' },
  { id: 'gym_metro_lab', name: 'Kinetix Performance Lab', locality: 'Kalyani Nagar', address: '8 Central Avenue, Kalyani Nagar', lat: 18.5492, lng: 73.9038, bayCount: 3, category: 'Cardio / MetCon' },
  { id: 'gym_apex_hub', name: 'Apex Hybrid Performance Hub', locality: 'Baner', address: '102 High Street, Baner', lat: 18.5590, lng: 73.7868, bayCount: 3, category: 'Functional Fitness / Turf' },
  { id: 'gym_urban_boxing', name: 'The Ring Boxing Academy', locality: 'Shivajinagar', address: '45 FC Road, Shivajinagar', lat: 18.5284, lng: 73.8423, bayCount: 2, category: 'Boxing & Combat' },
  { id: 'gym_reformer_loft', name: 'Zenith Reformer Pilates', locality: 'Aundh', address: '22 ITI Road, Aundh', lat: 18.5580, lng: 73.8075, bayCount: 2, category: 'Reformer Pilates' },
  { id: 'gym_forge_functional', name: 'Forge Functional Arena', locality: 'Kothrud', address: '18 Paud Road, Kothrud', lat: 18.5074, lng: 73.8077, bayCount: 2, category: 'HIIT & Conditioning' },
];

export default function InteractiveBayMap({ gyms = [], selectedGymId, onSelectGym }) {
  const [mapStyle, setMapStyle] = useState('radar'); // 'radar' | 'schematic'
  const [hoveredGym, setHoveredGym] = useState(null);

  // Normalize gyms data with Pune fallbacks
  const activeGyms = gyms.length > 0
    ? gyms.map((g, i) => ({
        ...DEFAULT_PUNE_GYMS[i % DEFAULT_PUNE_GYMS.length],
        ...g,
        lat: Number(g.gym_lat || g.lat || DEFAULT_PUNE_GYMS[i % DEFAULT_PUNE_GYMS.length].lat),
        lng: Number(g.gym_lng || g.lng || DEFAULT_PUNE_GYMS[i % DEFAULT_PUNE_GYMS.length].lng),
      }))
    : DEFAULT_PUNE_GYMS;

  // Pune bounding box
  const minLat = 18.50;
  const maxLat = 18.57;
  const minLng = 73.78;
  const maxLng = 73.92;
  const latSpan = maxLat - minLat || 0.07;
  const lngSpan = maxLng - minLng || 0.14;

  const selectedGym = activeGyms.find((g) => g.id === selectedGymId) || hoveredGym;

  return (
    <Paper
      sx={{
        p: 2.5,
        bgcolor: '#111827',
        border: '1px solid #1F2937',
        borderRadius: 3,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Header Bar */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 1.5 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1, color: '#F9FAFB' }}>
            <Navigation size={18} color="#E0FE10" /> Pune Studio Location Radar
          </Typography>
          <Chip
            label="Pune Metro Hub (MH)"
            size="small"
            sx={{ bgcolor: 'rgba(224, 254, 16, 0.12)', color: '#E0FE10', border: '1px solid rgba(224, 254, 16, 0.3)', fontWeight: 600 }}
          />
        </Box>

        <ButtonGroup size="small" variant="outlined" sx={{ bgcolor: '#0B0F19' }}>
          <Button
            onClick={() => setMapStyle('radar')}
            variant={mapStyle === 'radar' ? 'contained' : 'outlined'}
            startIcon={<Compass size={14} />}
            sx={{ fontSize: '0.72rem', fontWeight: 600, py: 0.5 }}
          >
            Radar Scope
          </Button>
          <Button
            onClick={() => setMapStyle('schematic')}
            variant={mapStyle === 'schematic' ? 'contained' : 'outlined'}
            startIcon={<Crosshair size={14} />}
            sx={{ fontSize: '0.72rem', fontWeight: 600, py: 0.5 }}
          >
            Metro Grid
          </Button>
        </ButtonGroup>
      </Box>

      {/* Standalone Interactive Map Canvas */}
      <Box
        sx={{
          height: 250,
          bgcolor: '#0B0F19',
          borderRadius: 2,
          position: 'relative',
          overflow: 'hidden',
          border: '1px solid #1F2937',
        }}
      >
        <svg width="100%" height="100%" style={{ position: 'absolute', top: 0, left: 0, opacity: 0.3 }}>
          <defs>
            <pattern id="pune-map-grid" width="28" height="28" patternUnits="userSpaceOnUse">
              <path d="M 28 0 L 0 0 0 28" fill="none" stroke="#374151" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#pune-map-grid)" />

          {/* Mula-Mutha River Geographic Curve */}
          <path d="M 0 165 Q 220 135, 440 125 T 900 145" fill="none" stroke="#38BDF8" strokeWidth="6" opacity="0.7" />
          <text x="30" y="180" fill="#38BDF8" fontSize="10" fontWeight="600" opacity="0.6">Mula-Mutha River</text>

          {/* Pune Radar Concentric Distance Bands */}
          <circle cx="50%" cy="50%" r="55" fill="none" stroke="#E0FE10" strokeWidth="0.5" strokeDasharray="3,3" opacity="0.4" />
          <circle cx="50%" cy="50%" r="110" fill="none" stroke="#38BDF8" strokeWidth="0.5" strokeDasharray="4,4" opacity="0.3" />
          <circle cx="50%" cy="50%" r="165" fill="none" stroke="#4B5563" strokeWidth="0.5" strokeDasharray="5,5" opacity="0.25" />

          {/* Coordinate Crosshairs & Sectors */}
          <line x1="50%" y1="0" x2="50%" y2="100%" stroke="#1F2937" strokeWidth="1" strokeDasharray="2,2" />
          <line x1="0" y1="50%" x2="100%" y2="50%" stroke="#1F2937" strokeWidth="1" strokeDasharray="2,2" />

          {/* Locality Sector Labels */}
          <text x="78%" y="35%" fill="#9CA3AF" fontSize="9" fontWeight="600">Kalyani Nagar</text>
          <text x="75%" y="60%" fill="#9CA3AF" fontSize="9" fontWeight="600">Koregaon Park</text>
          <text x="18%" y="30%" fill="#9CA3AF" fontSize="9" fontWeight="600">Baner</text>
          <text x="28%" y="42%" fill="#9CA3AF" fontSize="9" fontWeight="600">Aundh</text>
          <text x="46%" y="48%" fill="#9CA3AF" fontSize="9" fontWeight="600">Shivajinagar</text>
          <text x="24%" y="82%" fill="#9CA3AF" fontSize="9" fontWeight="600">Kothrud</text>
        </svg>

        {/* GPS Studio Markers */}
        {activeGyms.map((gym, idx) => {
          const normX = (gym.lng - minLng) / lngSpan;
          const normY = 1 - (gym.lat - minLat) / latSpan;
          const leftPercent = Math.min(88, Math.max(12, normX * 76 + 12));
          const topPercent = Math.min(85, Math.max(15, normY * 70 + 15));
          const isSelected = selectedGymId === gym.id;
          const isHovered = hoveredGym?.id === gym.id;

          return (
            <Tooltip
              key={gym.id || idx}
              title={`${gym.name} • ${gym.locality || 'Pune'} (Click to focus)`}
              arrow
              placement="top"
            >
              <Box
                onClick={() => onSelectGym && onSelectGym(gym.id)}
                onMouseEnter={() => setHoveredGym(gym)}
                onMouseLeave={() => setHoveredGym(null)}
                sx={{
                  position: 'absolute',
                  left: `${leftPercent}%`,
                  top: `${topPercent}%`,
                  cursor: 'pointer',
                  transform: 'translate(-50%, -50%)',
                  textAlign: 'center',
                  zIndex: isSelected ? 12 : isHovered ? 11 : 4,
                  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                  '&:hover': { transform: 'translate(-50%, -50%) scale(1.18)' },
                }}
              >
                <Box
                  sx={{
                    width: isSelected ? 34 : isHovered ? 30 : 24,
                    height: isSelected ? 34 : isHovered ? 30 : 24,
                    bgcolor: isSelected ? '#E0FE10' : isHovered ? '#38BDF8' : '#1F2937',
                    border: isSelected ? '2px solid #000' : '1px solid rgba(56, 189, 248, 0.7)',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: isSelected
                      ? '0 0 16px #E0FE10, 0 0 30px rgba(224, 254, 16, 0.4)'
                      : isHovered
                      ? '0 0 12px #38BDF8'
                      : '0 2px 6px rgba(0,0,0,0.6)',
                    mx: 'auto',
                  }}
                >
                  <MapPin size={isSelected ? 18 : 13} color={isSelected ? '#000000' : isHovered ? '#000000' : '#38BDF8'} />
                </Box>
                <Typography
                  variant="caption"
                  sx={{
                    bgcolor: 'rgba(11, 15, 25, 0.92)',
                    px: 0.8,
                    py: 0.2,
                    borderRadius: 1,
                    display: 'block',
                    mt: 0.5,
                    fontSize: '0.64rem',
                    fontWeight: 700,
                    color: isSelected ? '#E0FE10' : '#F9FAFB',
                    whiteSpace: 'nowrap',
                    border: isSelected ? '1px solid rgba(224, 254, 16, 0.5)' : '1px solid rgba(55, 65, 81, 0.5)',
                  }}
                >
                  {gym.locality || gym.name.split(' ')[0]}
                </Typography>
              </Box>
            </Tooltip>
          );
        })}
      </Box>

      {/* Selected Studio Details Card */}
      {selectedGym && (
        <Box
          sx={{
            mt: 2,
            p: 1.5,
            bgcolor: '#0B0F19',
            borderRadius: 2,
            border: '1px solid #1F2937',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 1,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box sx={{ p: 1, bgcolor: 'rgba(224, 254, 16, 0.1)', borderRadius: 1.5 }}>
              <Building2 size={18} color="#E0FE10" />
            </Box>
            <Box>
              <Typography variant="body2" sx={{ fontWeight: 700, color: '#F9FAFB' }}>
                {selectedGym.name}
              </Typography>
              <Typography variant="caption" sx={{ color: '#9CA3AF' }}>
                {selectedGym.address || `${selectedGym.locality}, Pune`} • GPS: {selectedGym.lat.toFixed(4)}°N, {selectedGym.lng.toFixed(4)}°E
              </Typography>
            </Box>
          </Box>
          <Chip
            size="small"
            icon={<Sparkles size={12} color="#E0FE10" />}
            label="Verified Studio Partner"
            sx={{ bgcolor: 'rgba(224, 254, 16, 0.1)', color: '#E0FE10', fontSize: '0.7rem', fontWeight: 600 }}
          />
        </Box>
      )}

      {/* Locality Quick Jump Pills */}
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75, mt: 1.5 }}>
        <Typography variant="caption" sx={{ color: '#6B7280', alignSelf: 'center', mr: 0.5, fontWeight: 600 }}>
          Neighborhoods:
        </Typography>
        {activeGyms.map((g) => {
          const isSelected = selectedGymId === g.id;
          return (
            <Chip
              key={g.id}
              label={g.locality || g.name}
              size="small"
              clickable
              onClick={() => onSelectGym && onSelectGym(g.id)}
              sx={{
                bgcolor: isSelected ? '#E0FE10' : '#1F2937',
                color: isSelected ? '#000000' : '#9CA3AF',
                fontWeight: isSelected ? 700 : 500,
                fontSize: '0.68rem',
                border: isSelected ? '1px solid #E0FE10' : '1px solid #374151',
                '&:hover': {
                  bgcolor: isSelected ? '#CCEE00' : '#374151',
                  color: isSelected ? '#000000' : '#F9FAFB',
                },
              }}
            />
          );
        })}
      </Box>
    </Paper>
  );
}
