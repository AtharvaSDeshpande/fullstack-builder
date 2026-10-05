import React, { useState } from 'react';
import {
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, Typography, Button, Box, Link as MuiLink, Chip
} from '@mui/material';
import { Check, X, FileText, ExternalLink } from 'lucide-react';
import { COIStatusBadge } from '../insurance-verification';

export default function COIVerificationTable({ trainers = [], onStatusUpdate }) {
  const [updatingId, setUpdatingId] = useState(null);

  const handleUpdate = async (userId, newStatus) => {
    setUpdatingId(userId);
    try {
      const res = await fetch(`/api/admin/coi/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (data.success && onStatusUpdate) {
        onStatusUpdate(userId, newStatus);
      }
    } catch (err) {
      console.error('Failed to update COI status:', err);
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <TableContainer component={Paper} sx={{ bgcolor: '#111827', border: '1px solid #1F2937', borderRadius: 3 }}>
      <Table>
        <TableHead sx={{ bgcolor: '#0B0F19' }}>
          <TableRow>
            <TableCell sx={{ color: '#9CA3AF', fontWeight: 700 }}>Trainer Name</TableCell>
            <TableCell sx={{ color: '#9CA3AF', fontWeight: 700 }}>Contact Info</TableCell>
            <TableCell sx={{ color: '#9CA3AF', fontWeight: 700 }}>Policy Document</TableCell>
            <TableCell sx={{ color: '#9CA3AF', fontWeight: 700 }}>Current Status</TableCell>
            <TableCell sx={{ color: '#9CA3AF', fontWeight: 700 }} align="right">Verification Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {trainers.map((t) => (
            <TableRow key={t.id} sx={{ '&:hover': { bgcolor: '#1F2937' } }}>
              <TableCell sx={{ color: '#F9FAFB', fontWeight: 600 }}>
                {t.name}
              </TableCell>
              <TableCell>
                <Typography variant="body2" sx={{ color: '#F9FAFB' }}>{t.email}</Typography>
                <Typography variant="caption" sx={{ color: '#6B7280' }}>{t.phone || 'No phone'}</Typography>
              </TableCell>
              <TableCell>
                {t.coi_url ? (
                  <MuiLink
                    href={t.coi_url}
                    target="_blank"
                    rel="noreferrer"
                    sx={{ color: '#38BDF8', display: 'inline-flex', alignItems: 'center', gap: 0.5, fontSize: '0.85rem' }}
                  >
                    <FileText size={15} /> View Policy PDF <ExternalLink size={12} />
                  </MuiLink>
                ) : (
                  <Typography variant="caption" sx={{ color: '#6B7280' }}>No document uploaded</Typography>
                )}
              </TableCell>
              <TableCell>
                <COIStatusBadge status={t.coi_status} />
              </TableCell>
              <TableCell align="right">
                <Box sx={{ display: 'inline-flex', gap: 1 }}>
                  <Button
                    size="small"
                    variant="contained"
                    color="primary"
                    disabled={updatingId === t.id || t.coi_status === 'approved'}
                    onClick={() => handleUpdate(t.id, 'approved')}
                    startIcon={<Check size={14} />}
                    sx={{ fontSize: '0.75rem', py: 0.5 }}
                  >
                    Approve
                  </Button>
                  <Button
                    size="small"
                    variant="outlined"
                    color="error"
                    disabled={updatingId === t.id || t.coi_status === 'rejected'}
                    onClick={() => handleUpdate(t.id, 'rejected')}
                    startIcon={<X size={14} />}
                    sx={{ fontSize: '0.75rem', py: 0.5 }}
                  >
                    Reject
                  </Button>
                </Box>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
