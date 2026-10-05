import React, { useState } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, Typography, Select, MenuItem, FormControl, InputLabel, Alert } from '@mui/material';
import { AlertTriangle, CheckCircle } from 'lucide-react';

export default function IncidentReportModal({ open, onClose, booking, hostId, onReported }) {
  const [reason, setReason] = useState('Trainer overstayed slot into peak hours');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!booking) return;
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/host/incidents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingId: booking.id,
          reporterId: hostId || 'usr_elena',
          reason: `${reason}${notes ? ` - ${notes}` : ''}`,
        }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);

      setSuccess(true);
      setTimeout(() => {
        onReported && onReported(data.data);
        onClose();
        setSuccess(false);
      }, 1200);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth PaperProps={{ sx: { bgcolor: '#111827', border: '1px solid #374151' } }}>
      <DialogTitle sx={{ color: '#F9FAFB', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1 }}>
        <AlertTriangle color="#F59E0B" size={20} /> Report Session Issue / Overstay
      </DialogTitle>
      <form onSubmit={handleSubmit}>
        <DialogContent>
          <Typography variant="body2" sx={{ color: '#9CA3AF', mb: 2.5 }}>
            Booking: {booking?.id} &bull; {booking?.bay_name || 'Equipment Bay'} &bull; Trainer: {booking?.trainer_name || 'Trainer'}
          </Typography>

          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          {success && (
            <Alert icon={<CheckCircle size={20} />} severity="success" sx={{ mb: 2 }}>
              Incident report dispatched to admin queue for dispute review.
            </Alert>
          )}

          <FormControl fullWidth size="small" sx={{ mb: 2 }}>
            <InputLabel id="incident-reason-label" sx={{ color: '#9CA3AF' }}>Incident Category</InputLabel>
            <Select
              labelId="incident-reason-label"
              value={reason}
              label="Incident Category"
              onChange={(e) => setReason(e.target.value)}
            >
              <MenuItem value="Trainer overstayed slot into peak hours">Trainer overstayed slot into peak hours</MenuItem>
              <MenuItem value="Equipment left un-racked or chalk mess">Equipment left un-racked or chalk mess</MenuItem>
              <MenuItem value="Equipment damage or structural issue">Equipment damage or structural issue</MenuItem>
              <MenuItem value="Unapproved guest without signed waiver">Unapproved guest without signed waiver</MenuItem>
            </Select>
          </FormControl>

          <TextField
            label="Additional Notes / Severity"
            multiline
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            fullWidth
            placeholder="Details about time of departure or specific broken barbell..."
            size="small"
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={onClose} sx={{ color: '#9CA3AF' }}>Cancel</Button>
          <Button type="submit" variant="contained" color="error" disabled={loading}>
            {loading ? 'Submitting...' : 'File Incident Report'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
