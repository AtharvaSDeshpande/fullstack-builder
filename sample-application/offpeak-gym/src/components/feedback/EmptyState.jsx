import React from 'react';
import { Box, Typography, Button } from '@mui/material';
import { SearchX } from 'lucide-react';

export default function EmptyState({ title = 'No results found', message = 'Try adjusting your search filters or dates to find available bays.', onAction, actionLabel }) {
  return (
    <Box sx={{ textAlign: 'center', py: 8, px: 2, bgcolor: '#111827', borderRadius: 3, border: '1px dashed #374151', my: 4 }}>
      <Box sx={{ width: 56, height: 56, bgcolor: '#1F2937', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', mx: 'auto', mb: 2 }}>
        <SearchX size={28} color="#9CA3AF" />
      </Box>
      <Typography variant="h6" sx={{ color: '#F9FAFB', fontWeight: 600, mb: 1 }}>
        {title}
      </Typography>
      <Typography variant="body2" sx={{ color: '#9CA3AF', maxWidth: 440, mx: 'auto', mb: onAction ? 3 : 0 }}>
        {message}
      </Typography>
      {onAction && (
        <Button variant="outlined" color="primary" onClick={onAction}>
          {actionLabel || 'Reset Filters'}
        </Button>
      )}
    </Box>
  );
}
