import React from 'react';
import { Box, TextField, Checkbox, FormControlLabel, Typography, Paper, Alert } from '@mui/material';
import { ShieldCheck } from 'lucide-react';
import { STANDARD_WAIVER_TEXT } from '../../security/waiver';

export default function WaiverForm({
  clientName,
  onNameChange,
  clientEmail,
  onEmailChange,
  waiverSigned,
  onWaiverSignedChange,
  error,
}) {
  return (
    <Paper sx={{ p: 3, bgcolor: '#111827', border: '1px solid #1F2937', borderRadius: 3, mb: 3 }}>
      <Typography variant="h6" sx={{ fontWeight: 700, mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
        <ShieldCheck size={20} color="#E0FE10" /> Client Safety & Liability Waiver
      </Typography>
      <Typography variant="body2" sx={{ color: '#9CA3AF', mb: 2.5 }}>
        Studio rules require every outside client entering the facility to have a signed digital liability release on file.
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Box sx={{ display: 'flex', gap: 2, mb: 2.5, flexWrap: { xs: 'wrap', sm: 'nowrap' } }}>
        <TextField
          label="Client Full Legal Name"
          value={clientName}
          onChange={(e) => onNameChange(e.target.value)}
          placeholder="e.g. Rohan Mehra"
          fullWidth
          size="small"
          required
        />
        <TextField
          label="Client Email (for waiver receipt)"
          type="email"
          value={clientEmail}
          onChange={(e) => onEmailChange(e.target.value)}
          placeholder="jordan@example.com"
          fullWidth
          size="small"
          required
        />
      </Box>

      {/* Scrollable Terms Box */}
      <Box
        sx={{
          p: 2,
          bgcolor: '#0B0F19',
          border: '1px solid #374151',
          borderRadius: 2,
          maxHeight: 110,
          overflowY: 'auto',
          mb: 2,
          fontSize: '0.8rem',
          color: '#9CA3AF',
          lineHeight: 1.5,
        }}
      >
        <Typography variant="caption" sx={{ fontWeight: 700, color: '#F9FAFB', display: 'block', mb: 0.5 }}>
          STUDIO RELEASE OF LIABILITY & ASSUMPTION OF RISK AGREEMENT:
        </Typography>
        {STANDARD_WAIVER_TEXT}
      </Box>

      <FormControlLabel
        control={
          <Checkbox
            checked={waiverSigned}
            onChange={(e) => onWaiverSignedChange(e.target.checked)}
            sx={{
              color: '#374151',
              '&.Mui-checked': { color: '#E0FE10' },
            }}
          />
        }
        label={
          <Typography variant="body2" sx={{ color: '#D1D5DB' }}>
            I certify that the client has read and accepted the liability waiver and host gym rules.
          </Typography>
        }
      />
    </Paper>
  );
}
