'use client';
import * as React from 'react';
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Link from 'next/link';
import { usePerson } from '@/lib/usePerson';

// Home dashboard: quick actions plus a snapshot of this person's balances.
export default function HomePage() {
  const { person, loading } = usePerson();
  const [balances, setBalances] = React.useState<any>(null);

  React.useEffect(() => {
    if (!person) return;
    fetch(`/api/balances?sub=${encodeURIComponent(person.blazer_id)}`)
      .then(r => r.json())
      .then(d => setBalances(d.balances))
      .catch(() => setBalances(null));
  }, [person]);

  const isManager = person?.is_manager === 1;

  return (
    <Stack spacing={3}>
      <Typography variant="h4" component="h1">
        Welcome{person ? `, ${person.full_name}` : ''}!
      </Typography>
      <Typography variant="body1" color="text.secondary">
        Submit time-off requests, check your balances, and see the team's approved time off on the shared calendar.
      </Typography>

      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
        <Button variant="contained" component={Link} href="/submit">
          Submit a Request
        </Button>
        <Button variant="outlined" component={Link} href="/my-requests">
          My Requests
        </Button>
        {isManager ? (
          <Button variant="outlined" component={Link} href="/approvals">
            Review Team Requests
          </Button>
        ) : null}
        <Button variant="outlined" component={Link} href="/calendar">
          Yearly Calendar
        </Button>
      </Stack>

      <Typography variant="h5" component="h2">
        Your balances at a glance
      </Typography>
      {loading ? (
        <Typography color="text.secondary">Loading…</Typography>
      ) : balances ? (
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
          {[
            { label: 'Vacation', line: balances.vacation },
            { label: 'Sick', line: balances.sick },
            { label: 'Personal', line: balances.personal },
          ].map(({ label, line }) => (
            <Card key={label} sx={{ flex: 1 }}>
              <CardContent>
                <Typography variant="subtitle1" gutterBottom>{label}</Typography>
                <Typography variant="h3" component="p">{line.remaining}</Typography>
                <Typography variant="body2" color="text.secondary">
                  hours remaining · {line.used} used · {line.pending} pending
                </Typography>
              </CardContent>
            </Card>
          ))}
        </Stack>
      ) : (
        <Typography color="text.secondary">Balances will appear here after your first sign-in.</Typography>
      )}
    </Stack>
  );
}
