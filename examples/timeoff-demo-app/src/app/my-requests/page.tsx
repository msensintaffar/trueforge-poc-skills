'use client';
import * as React from 'react';
import Typography from '@mui/material/Typography';
import Table from '@mui/material/Table';
import TableHead from '@mui/material/TableHead';
import TableBody from '@mui/material/TableBody';
import TableRow from '@mui/material/TableRow';
import TableCell from '@mui/material/TableCell';
import Chip from '@mui/material/Chip';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import { usePerson } from '@/lib/usePerson';

const TYPE_LABELS: Record<string, string> = {
  vacation: 'Vacation',
  sick: 'Sick',
  personal: 'Personal holiday',
};

const STATUS_COLOR: Record<string, 'warning' | 'success' | 'error'> = {
  pending: 'warning',
  approved: 'success',
  denied: 'error',
};

export default function MyRequestsPage() {
  const { person, blazerId, loading, error } = usePerson();
  const [requests, setRequests] = React.useState<any[]>([]);
  const [fetchError, setFetchError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!blazerId) return;
    fetch(`/api/requests?sub=${encodeURIComponent(blazerId)}`)
      .then(r => (r.ok ? r.json() : Promise.reject(new Error(`Server responded ${r.status}`))))
      .then(d => setRequests(d.requests || []))
      .catch(e => setFetchError(e.message));
  }, [blazerId]);

  if (loading) return <Typography color="text.secondary">Loading…</Typography>;
  if (error || fetchError) {
    return <Alert severity="error">Could not load your requests. Try refreshing the page.</Alert>;
  }

  return (
    <Stack spacing={2}>
      <Typography variant="h4" component="h1">My Requests</Typography>
      <Typography variant="body1" color="text.secondary">
        Every request you've submitted and where it stands.
      </Typography>
      {requests.length === 0 ? (
        <Typography color="text.secondary">
          You haven't submitted any requests yet. Use "Submit a Request" to get started.
        </Typography>
      ) : (
        <Table size="medium">
          <TableHead>
            <TableRow>
              <TableCell>Type</TableCell>
              <TableCell>Dates</TableCell>
              <TableCell align="right">Hours</TableCell>
              <TableCell>Status</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {requests.map((r) => (
              <TableRow key={r.id}>
                <TableCell>{TYPE_LABELS[r.leave_type] || r.leave_type}</TableCell>
                <TableCell>
                  {r.start_date === r.end_date ? r.start_date : `${r.start_date} to ${r.end_date}`}
                </TableCell>
                <TableCell align="right">{r.hours_total}</TableCell>
                <TableCell>
                  <Chip
                    size="small"
                    label={r.status}
                    color={STATUS_COLOR[r.status] || 'default'}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </Stack>
  );
}
