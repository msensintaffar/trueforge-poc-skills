'use client';
import * as React from 'react';
import Typography from '@mui/material/Typography';
import Table from '@mui/material/Table';
import TableHead from '@mui/material/TableHead';
import TableBody from '@mui/material/TableBody';
import TableRow from '@mui/material/TableRow';
import TableCell from '@mui/material/TableCell';
import Chip from '@mui/material/Chip';
import Button from '@mui/material/Button';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Box from '@mui/material/Box';
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

// Manager view: review pending team requests and approve or deny them.
export default function ApprovalsPage() {
  const { person, blazerId, loading } = usePerson();
  const [team, setTeam] = React.useState<any[]>([]);
  const [isManager, setIsManager] = React.useState(false);
  const [loaded, setLoaded] = React.useState(false);
  const [actionError, setActionError] = React.useState<string | null>(null);
  const [busyId, setBusyId] = React.useState<number | null>(null);

  async function load() {
    if (!blazerId) return;
    try {
      const res = await fetch(`/api/team?sub=${encodeURIComponent(blazerId)}`);
      const d = await res.json();
      setIsManager(Boolean(d.isManager));
      setTeam(d.requests || []);
    } catch {
      setTeam([]);
    } finally {
      setLoaded(true);
    }
  }

  React.useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [blazerId]);

  async function decide(id: number, decision: 'approved' | 'denied') {
    setActionError(null);
    setBusyId(id);
    try {
      const res = await fetch(`/api/requests/${id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ decision, sub: blazerId }),
      });
      const d = await res.json();
      if (!res.ok) {
        setActionError(d.error || 'Could not record that decision.');
      } else {
        await load();
      }
    } catch {
      setActionError('Could not reach the server. Try again.');
    } finally {
      setBusyId(null);
    }
  }

  if (loading || !loaded) return <Typography color="text.secondary">Loading…</Typography>;
  if (!isManager) {
    return (
      <Stack spacing={2}>
        <Typography variant="h4" component="h1">Approvals</Typography>
        <Alert severity="info">
          Only managers see team requests here. You don't currently have anyone reporting to you.
        </Alert>
      </Stack>
    );
  }

  const pending = team.filter(r => r.status === 'pending');
  const decided = team.filter(r => r.status !== 'pending');

  return (
    <Stack spacing={3}>
      <Typography variant="h4" component="h1">Approvals</Typography>
      {actionError ? <Alert severity="error">{actionError}</Alert> : null}

      <Box>
        <Typography variant="h5" component="h2" gutterBottom>
          Waiting for review ({pending.length})
        </Typography>
        {pending.length === 0 ? (
          <Typography color="text.secondary">Nothing is waiting right now.</Typography>
        ) : (
          <Table size="medium">
            <TableHead>
              <TableRow>
                <TableCell>Person</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Dates</TableCell>
                <TableCell align="right">Hours</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {pending.map(r => (
                <TableRow key={r.id}>
                  <TableCell>{r.person_name}</TableCell>
                  <TableCell>{TYPE_LABELS[r.leave_type] || r.leave_type}</TableCell>
                  <TableCell>
                    {r.start_date === r.end_date ? r.start_date : `${r.start_date} to ${r.end_date}`}
                  </TableCell>
                  <TableCell align="right">{r.hours_total}</TableCell>
                  <TableCell align="right">
                    <Stack direction="row" spacing={1} sx={{ justifyContent: 'flex-end' }}>
                      <Button
                        variant="contained"
                        color="success"
                        size="small"
                        disabled={busyId === r.id}
                        onClick={() => decide(r.id, 'approved')}
                      >
                        Approve
                      </Button>
                      <Button
                        variant="outlined"
                        color="error"
                        size="small"
                        disabled={busyId === r.id}
                        onClick={() => decide(r.id, 'denied')}
                      >
                        Deny
                      </Button>
                    </Stack>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Box>

      {decided.length > 0 ? (
        <Box>
          <Typography variant="h5" component="h2" gutterBottom>Recently decided</Typography>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Person</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Dates</TableCell>
                <TableCell>Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {decided.map(r => (
                <TableRow key={r.id}>
                  <TableCell>{r.person_name}</TableCell>
                  <TableCell>{TYPE_LABELS[r.leave_type] || r.leave_type}</TableCell>
                  <TableCell>
                    {r.start_date === r.end_date ? r.start_date : `${r.start_date} to ${r.end_date}`}
                  </TableCell>
                  <TableCell>
                    <Chip size="small" label={r.status} color={STATUS_COLOR[r.status] || 'default'} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Box>
      ) : null}
    </Stack>
  );
}
