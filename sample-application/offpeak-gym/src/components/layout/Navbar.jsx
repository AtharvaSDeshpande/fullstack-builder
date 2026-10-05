import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { AppBar, Toolbar, Container, Box, Button, Chip, Typography } from '@mui/material';
import { Search, Calendar, LayoutDashboard, ShieldCheck } from 'lucide-react';
import Logo from '../brand/Logo';
import { useAuth } from '../../App';

export default function Navbar() {
  const { currentUser, switchUser } = useAuth();
  const location = useLocation();

  const isCurrent = (path) => location.pathname === path;

  return (
    <AppBar
      position="sticky"
      sx={{
        bgcolor: 'rgba(11, 15, 25, 0.85)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid #1F2937',
      }}
      elevation={0}
    >
      <Container maxWidth="xl">
        <Toolbar disableGutters sx={{ justifyContent: 'space-between', height: 70 }}>
          {/* Brand Logo */}
          <Link to="/">
            <Logo size={34} />
          </Link>

          {/* Navigation Links */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Button
              component={Link}
              to="/explore"
              startIcon={<Search size={18} />}
              sx={{
                color: isCurrent('/explore') ? '#E0FE10' : '#9CA3AF',
                '&:hover': { color: '#F9FAFB' },
              }}
            >
              Explore Bays
            </Button>
            {currentUser?.role === 'trainer' && (
              <Button
                component={Link}
                to="/trainer/dashboard"
                startIcon={<Calendar size={18} />}
                sx={{
                  color: isCurrent('/trainer/dashboard') ? '#E0FE10' : '#9CA3AF',
                  '&:hover': { color: '#F9FAFB' },
                }}
              >
                My Bookings
              </Button>
            )}
            {currentUser?.role === 'host' && (
              <Button
                component={Link}
                to="/host/dashboard"
                startIcon={<LayoutDashboard size={18} />}
                sx={{
                  color: isCurrent('/host/dashboard') ? '#E0FE10' : '#9CA3AF',
                  '&:hover': { color: '#F9FAFB' },
                }}
              >
                Host Portal
              </Button>
            )}
            {currentUser?.role === 'admin' && (
              <Button
                component={Link}
                to="/admin/queue"
                startIcon={<ShieldCheck size={18} />}
                sx={{
                  color: isCurrent('/admin/queue') ? '#E0FE10' : '#9CA3AF',
                  '&:hover': { color: '#F9FAFB' },
                }}
              >
                Admin Queue
              </Button>
            )}
          </Box>

          {/* Interactive Role Switcher */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="caption" sx={{ color: '#6B7280', mr: 0.5, display: { xs: 'none', sm: 'block' } }}>
              Active Demo Role:
            </Typography>
            <Chip
              label="Trainer"
              size="small"
              clickable
              onClick={() => switchUser('trainer')}
              sx={{
                bgcolor: currentUser?.role === 'trainer' ? '#E0FE10' : '#1F2937',
                color: currentUser?.role === 'trainer' ? '#000000' : '#9CA3AF',
                fontWeight: 700,
              }}
            />
            <Chip
              label="Host"
              size="small"
              clickable
              onClick={() => switchUser('host')}
              sx={{
                bgcolor: currentUser?.role === 'host' ? '#E0FE10' : '#1F2937',
                color: currentUser?.role === 'host' ? '#000000' : '#9CA3AF',
                fontWeight: 700,
              }}
            />
            <Chip
              label="Admin"
              size="small"
              clickable
              onClick={() => switchUser('admin')}
              sx={{
                bgcolor: currentUser?.role === 'admin' ? '#E0FE10' : '#1F2937',
                color: currentUser?.role === 'admin' ? '#000000' : '#9CA3AF',
                fontWeight: 700,
              }}
            />
          </Box>
        </Toolbar>
      </Container>
    </AppBar>
  );
}
