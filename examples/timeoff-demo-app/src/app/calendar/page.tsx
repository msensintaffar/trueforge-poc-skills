'use client';
import * as React from 'react';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import IconButton from '@mui/material/IconButton';
import Button from '@mui/material/Button';
import Tooltip from '@mui/material/Tooltip';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { useUABTheme } from '@/theme/ThemeProvider';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
const DOW = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

const TYPE_COLORS: Record<string, string> = {
  vacation: '#1A5632', // UAB Green
  sick: '#42CAF0',     // Bham Sky Blue
  personal: '#FDB913', // UAB Gold
};

type Entry = {
  id: number;
  person_name: string;
  leave_type: string;
  start_date: string;
  end_date: string;
};

// Shared yearly calendar: everyone's approved time off, 12 mini months.
export default function CalendarPage() {
  const { mode } = useUABTheme();
  const thisYear = new Date().getUTCFullYear();
  const [year, setYear] = React.useState(thisYear);
  const [entries, setEntries] = React.useState<Entry[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    setLoading(true);
    fetch(`/api/calendar?year=${year}`)
      .then(r => (r.ok ? r.json() : Promise.reject(new Error(`Server responded ${r.status}`))))
      .then(d => setEntries(d.entries || []))
      .catch(() => setEntries([]))
      .finally(() => setLoading(false));
  }, [year]);

  // Build a map: 'YYYY-MM-DD' -> list of {name, type}
  const byDay = React.useMemo(() => {
    const map: Record<string, { name: string; type: string }[]> = {};
    for (const e of entries) {
      let d = new Date(`${e.start_date}T00:00:00Z`);
      const end = new Date(`${e.end_date}T00:00:00Z`);
      while (d <= end) {
        const key = d.toISOString().slice(0, 10);
        (map[key] ||= []).push({ name: e.person_name, type: e.leave_type });
        d = new Date(d.getTime() + 86400000);
      }
    }
    return map;
  }, [entries]);

  function MonthGrid({ month }: { month: number }) {
    const first = new Date(Date.UTC(year, month, 1));
    const daysInMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
    const lead = first.getUTCDay(); // 0 = Sunday
    const cells: (number | null)[] = [
      ...Array(lead).fill(null),
      ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
    ];
    while (cells.length % 7 !== 0) cells.push(null);

    return (
      <Paper sx={{ p: 1.5 }}>
        <Typography variant="subtitle2" align="center" gutterBottom>
          {MONTH_NAMES[month]}
        </Typography>
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 0.25 }}>
          {DOW.map((d, i) => (
            <Box key={`dow-${month}-${i}`} sx={{ textAlign: 'center', fontSize: 11, color: 'text.secondary' }}>
              {d}
            </Box>
          ))}
          {cells.map((day, idx) => {
            if (day === null) return <Box key={`pad-${month}-${idx}`} />;
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const marks = byDay[dateStr] || [];
            const isToday = dateStr === new Date().toISOString().slice(0, 10);
            return (
              <Tooltip
                key={dateStr}
                title={marks.length ? marks.map(m => `${m.name} — ${m.type}`).join(', ') : ''}
                disableHoverListener={marks.length === 0}
              >
                <Box
                  sx={{
                    aspectRatio: '1',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 12,
                    borderRadius: 1,
                    position: 'relative',
                  }}
                >
                  {day}
                  {marks.length > 0 ? (
                    <Box
                      sx={{
                        position: 'absolute',
                        bottom: 2,
                        left: 2,
                        right: 2,
                        height: 4,
                        borderRadius: 1,
                        background: TYPE_COLORS[marks[0].type] || '#1A5632',
                      }}
                      aria-label={`${marks.length} person(s) approved time off on this day`}
                    />
                  ) : null}
                </Box>
              </Tooltip>
            );
          })}
        </Box>
      </Paper>
    );
  }

  return (
    <Stack spacing={2}>
      <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
        <IconButton aria-label="Previous year" onClick={() => setYear(y => y - 1)}>
          <ChevronLeftIcon />
        </IconButton>
        <Typography variant="h4" component="h2">{year}</Typography>
        <IconButton aria-label="Next year" onClick={() => setYear(y => y + 1)}>
          <ChevronRightIcon />
        </IconButton>
        <Box sx={{ flexGrow: 1 }} />
        {year !== thisYear ? (
          <Button size="small" onClick={() => setYear(thisYear)}>Back to {thisYear}</Button>
        ) : null}
      </Stack>
      <Typography variant="body1" color="text.secondary">
        Everyone's approved time off. Hover a highlighted day to see who is out.
      </Typography>
      <Stack direction="row" spacing={2} sx={{ flexWrap: 'wrap' }}>
        {Object.entries(TYPE_COLORS).map(([type, color]) => (
          <Chip
            key={type}
            size="small"
            label={type === 'vacation' ? 'Vacation' : type === 'sick' ? 'Sick' : 'Personal holiday'}
            sx={{ backgroundColor: color, color: '#fff' }}
          />
        ))}
      </Stack>
      {loading ? <Typography color="text.secondary">Loading…</Typography> : (
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr 1fr', md: 'repeat(4, 1fr)' }, gap: 2 }}>
          {Array.from({ length: 12 }, (_, m) => <MonthGrid key={m} month={m} />)}
        </Box>
      )}
    </Stack>
  );
}
