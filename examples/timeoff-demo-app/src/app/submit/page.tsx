'use client';
import * as React from 'react';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import Select from '@mui/material/Select';
import Button from '@mui/material/Button';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import { usePerson } from '@/lib/usePerson';

// Submit a time-off request: type, start date, end date, hours per day.
export default function SubmitPage() {
  const { person, blazerId } = usePerson();
  const [leaveType, setLeaveType] = React.useState('');
  const [startDate, setStartDate] = React.useState('');
  const [endDate, setEndDate] = React.useState('');
  const [hoursPerDay, setHoursPerDay] = React.useState('8');
  const [submitting, setSubmitting] = React.useState(false);
  const [success, setSuccess] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    if (!blazerId) return;
    setSubmitting(true);
    try {
      const res = await fetch('/api/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sub: blazerId,
          leave_type: leaveType,
          start_date: startDate,
          end_date: endDate || startDate,
          hours_per_day: Number(hoursPerDay),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Something went wrong. Try again.');
      } else {
        setSuccess('Request submitted! It is now waiting for your manager to review it.');
        setLeaveType('');
        setStartDate('');
        setEndDate('');
        setHoursPerDay('8');
      }
    } catch {
      setError('Could not reach the server. Try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Stack spacing={2} sx={{ maxWidth: 520 }}>
      <Typography variant="h4" component="h1">
        Submit a Request
      </Typography>
      <Typography variant="body1" color="text.secondary">
        Choose the type of time off, the dates, and how many hours each day (8 hours = a full day).
      </Typography>

      {success ? <Alert severity="success">{success}</Alert> : null}
      {error ? <Alert severity="error">{error}</Alert> : null}

      <Box component="form" onSubmit={handleSubmit}>
        <Stack spacing={2}>
          <FormControl required fullWidth>
            <InputLabel id="leave-type-label">Type of time off</InputLabel>
            {/* TODO: none — types match the plan (vacation, sick, personal) */}
            <select
              aria-label="Type of time off"
              value={leaveType}
              onChange={e => setLeaveType(e.target.value)}
              style={{ padding: 12, marginTop: 8 }}
            >
              <option value="">Choose…</option>
              <option value="vacation">Vacation</option>
              <option value="sick">Sick time</option>
              <option value="personal">Personal holiday</option>
            </select>
          </FormControl>
          <TextField
            label="Start date"
            type="date"
            required
            value={startDate}
            onChange={e => setStartDate(e.target.value)}
            slotProps={{ inputLabel: { shrink: true } }}
          />
          <TextField
            label="End date (same as start for one day)"
            type="date"
            required
            value={endDate}
            onChange={e => setEndDate(e.target.value)}
            slotProps={{ inputLabel: { shrink: true } }}
          />
          <TextField
            label="Hours per day (8 = full day)"
            type="number"
            required
            slotProps={{ htmlInput: { min: 0.5, max: 8, step: 0.5 } }}
            value={hoursPerDay}
            onChange={e => setHoursPerDay(e.target.value)}
          />
          <Button type="submit" variant="contained" disabled={submitting || !person}>
            {submitting ? 'Submitting…' : 'Submit Request'}
          </Button>
        </Stack>
      </Box>
    </Stack>
  );
}
