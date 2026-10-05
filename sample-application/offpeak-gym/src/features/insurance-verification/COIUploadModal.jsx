import React, { useState } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, Typography, Box, Alert } from '@mui/material';
import { UploadCloud, CheckCircle } from 'lucide-react';

export default function COIUploadModal({ open, onClose, trainerId, onSubmitted }) {
  const [coiUrl, setCoiUrl] = useState('');
  const [policyNumber, setPolicyNumber] = useState('');
  const [expirationDate, setExpirationDate] = useState('2027-04-01');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/trainer/coi', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          trainerId,
          coiUrl: coiUrl || 'https://offpeakgym.app/coi/trainer-general-liability.pdf',
          policyNumber: policyNumber || 'GL-994820-2026',
          expirationDate,
        }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);

      setSuccess(true);
      setTimeout(() => {
        onSubmitted && onSubmitted(data.data);
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
      <DialogTitle sx={{ color: '#F9FAFB', fontWeight: 700 }}>
        Submit Certificate of Insurance (COI)
      </DialogTitle>
      <form onSubmit={handleSubmit}>
        <DialogContent>
          <Typography variant="body2" sx={{ color: '#9CA3AF', mb: 3 }}>
            To protect boutique studios and equipment, all trainers must maintain an active professional liability policy or certification (REPs India / ACE / ISSA) naming OffPeak Gym as an additional insured.
          </Typography>

          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          {success && (
            <Alert icon={<CheckCircle size={20} />} severity="success" sx={{ mb: 2 }}>
              COI uploaded successfully! Submitted to admin verification queue.
            </Alert>
          )}

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="Policy Number"
              value={policyNumber}
              onChange={(e) => setPolicyNumber(e.target.value)}
              placeholder="e.g. GL-884920-A"
              fullWidth
              size="small"
            />
            <TextField
              label="Expiration Date"
              type="date"
              value={expirationDate}
              onChange={(e) => setExpirationDate(e.target.value)}
              fullWidth
              size="small"
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              label="Document Link or PDF URL"
              value={coiUrl}
              onChange={(e) => setCoiUrl(e.target.value)}
              placeholder="https://example.com/my-insurance.pdf"
              fullWidth
              size="small"
              helperText="Upload to Cloud or provide PDF link for instant review"
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={onClose} sx={{ color: '#9CA3AF' }}>Cancel</Button>
          <Button type="submit" variant="contained" color="primary" disabled={loading} startIcon={<UploadCloud size={18} />}>
            {loading ? 'Submitting...' : 'Submit for Verification'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
