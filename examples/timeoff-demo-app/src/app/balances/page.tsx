'use client';
import * as React from 'react';
import Typography from '@mui/material/Typography';
import Table from '@mui/material/Table';
import TableHead from '@mui/material/TableHead';
import TableBody from '@mui/material/TableBody';
import TableRow from '@mui/material/TableRow';
import TableCell from '@mui/material/TableCell';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import { usePerson } from '@/lib/usePerson';

// Balances page: the running earned / used / pending / remaining figures
// the app computes automatically, plus the plain-English rules.
export default function BalancesPage() {
  const { person, blazerId, loading } = usePerson();
  const [data, setData] = React.useState<any>(null);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!blazerId) return;
    fetch(`/api/balances?sub=${encodeURIComponent(blazerId)}`)
      .then(r => (r.ok ? r.json() : Promise.reject(new Error(`Server responded ${r.status}`))))
      .then(d => setData(d))
      .catch(e => setError(e.message));
  }, [blazerId]);

  if (loading) return <Typography color="text.secondary">Loading…</Typography>;
  if (error) return <Alert severity="error">Could not load balances. Try refreshing.</Alert>;
  if (!data) return null;

  const b = data.balances;
  const rows = [
    {
      label: 'Vacation',
      line: b.vacation,
      note: `Earned monthly (${b.vacationTierYears >= 15 ? '14 days/year — 15+ years of service' : '12 days/year'}, capped at 20 unused days). Leftover vacation at year's end becomes sick time at half value instead of being lost.`,
    },
    {
      label: 'Sick',
      line: b.sick,
      note: `Earned monthly at the same rate for everyone (8 days/year), no yearly maximum.${b.carriedIntoSickHours ? ` Includes ${b.carriedIntoSickHours} hours rolled in from last year's unused vacation.` : ''}`,
    },
    {
      label: 'Personal holiday',
      line: b.personal,
      note: `3 days each year, resetting every July 1 (next reset: ${b.personalResetsOn}).`,
    },
  ];

  return (
    <Stack spacing={2}>
      <Typography variant="h4" component="h1">Balances</Typography>
      <Typography variant="body1" color="text.secondary">
        Current fiscal year: {b.fiscalYearLabel} (July {b.fiscalYear} – June {b.fiscalYear + 1}). The app updates these automatically as requests are approved.
      </Typography>
      <Table size="medium">
        <TableHead>
          <TableRow>
            <TableCell>Type</TableCell>
            <TableCell align="right">Earned</TableCell>
            <TableCell align="right">Used</TableCell>
            <TableCell align="right">Pending</TableCell>
            <TableCell align="right">Remaining</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map(r => (
            <TableRow key={r.label}>
              <TableCell>{r.label}</TableCell>
              <TableCell align="right">{r.line.earned}</TableCell>
              <TableCell align="right">{r.line.used}</TableCell>
              <TableCell align="right">{r.line.pending}</TableCell>
              <TableCell align="right">
                <Typography component="strong">{r.line.remaining}</Typography>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <Stack spacing={1}>
        {rows.map(r => (
          <Typography key={r.label} variant="body2" color="text.secondary">
            <strong>{r.label}:</strong> {r.note}
          </Typography>
        ))}
      </Stack>
    </Stack>
  );
}
