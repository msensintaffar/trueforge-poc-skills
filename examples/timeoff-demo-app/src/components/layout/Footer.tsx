'use client';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import IconButton from '@mui/material/IconButton';
import CloseIcon from '@mui/icons-material/Close';
import Link from '@mui/material/Link';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';
import { useMediaQuery } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { useState } from 'react';

// The standard UAB footer — a fixed platform requirement, identical on
// every generated app. Links are exactly: Contact UAB, Privacy, Terms of
// Use + the copyright line and the Nondiscrimination Statement dialog.
// No A-Z Site Index link by design.

export default function Footer() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [open, setOpen] = useState(false);
  const year = new Date().getFullYear();

  const links = {
    contact: 'https://www.uab.edu/home/contact',
    privacy: 'https://www.uab.edu/privacy/statements',
    terms: 'https://www.uab.edu/toolkit/web/terms-of-use',
  };

  const NondiscButton = (
    <Button
      variant="contained"
      size="small"
      onClick={() => setOpen(true)}
      sx={{ textTransform: 'none' }}
    >
      Nondiscrimination Statement
    </Button>
  );

  const copyright = (
    <Typography variant="body2" color="text.secondary">
      © {year} The University of Alabama at Birmingham
    </Typography>
  );

  return (
    <Box
      component="footer"
      sx={{
        backgroundColor: 'background.default',
        borderTop: 1,
        borderColor: 'divider',
        py: 3,
        px: 2,
        mt: 'auto',
      }}
    >
      {isMobile ? (
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, sm: 6 }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 1 }}>
              {NondiscButton}
              <Link href={links.contact} target="_blank" rel="noopener noreferrer" underline="hover">
                Contact UAB
              </Link>
            </Box>
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 1 }}>
              <Link href={links.privacy} target="_blank" rel="noopener noreferrer" underline="hover">
                Privacy
              </Link>
              <Link href={links.terms} target="_blank" rel="noopener noreferrer" underline="hover">
                Terms of Use
              </Link>
              {copyright}
            </Box>
          </Grid>
        </Grid>
      ) : (
        <Box
          sx={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 3,
          }}
        >
          {NondiscButton}
          <Link href={links.contact} target="_blank" rel="noopener noreferrer" underline="hover">
            Contact UAB
          </Link>
          <Link href={links.privacy} target="_blank" rel="noopener noreferrer" underline="hover">
            Privacy
          </Link>
          <Link href={links.terms} target="_blank" rel="noopener noreferrer" underline="hover">
            Terms of Use
          </Link>
          {copyright}
        </Box>
      )}

      <Dialog open={open} onClose={() => setOpen(false)}>
        <DialogTitle sx={{ pr: 6 }}>
          Nondiscrimination Statement
          <IconButton
            aria-label="Close"
            onClick={() => setOpen(false)}
            sx={{ position: 'absolute', right: 8, top: 8 }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" component="div">
            UAB is an Equal Employment/Equal Educational Opportunity Institution
            dedicated to providing equal opportunities and equal access to all
            individuals regardless of race, color, religion, ethnic or national
            origin, sex (including pregnancy), genetic information, age,
            disability, and veteran's status. As required by Title IX, UAB
            prohibits sex discrimination in any education program or activity
            that it operates. Individuals may report concerns or questions to
            UAB's Assistant Vice President and Senior Title IX Coordinator. The
            Title IX notice of nondiscrimination is located at{' '}
            <Link
              href="https://uab.edu/titleix"
              target="_blank"
              rel="noopener noreferrer"
              underline="hover"
            >
              uab.edu/titleix
            </Link>
            .
          </Typography>
        </DialogContent>
      </Dialog>
    </Box>
  );
}
