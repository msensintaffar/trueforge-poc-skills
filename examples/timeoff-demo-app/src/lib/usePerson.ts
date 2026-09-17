'use client';
// Shared hook: the signed-in person's record. Sends the BlazerID from the
// login session; the server creates or returns the matching record.
// NOTE: this demo build passes identity fields over the local connection;
// a production deployment would verify the access token server-side — a
// step for whoever deploys the app.

import { useEffect, useState } from 'react';
import { useOptionalAuth } from '@/auth/useOptionalAuth';

export type Person = {
  id: number;
  blazer_id: string;
  full_name: string;
  email: string;
  is_manager: number;
  manager_id: number | null;
  vacation_tier_years: number;
  sick_carry_in_hours: number;
};

export type ProfileFields = {
  preferred_username?: string;
  name?: string;
  email?: string;
};

export function usePerson(): {
  person: Person | null;
  loading: boolean;
  error: string | null;
  profile: ProfileFields | null;
  blazerId: string | null;
} {
  const auth = useOptionalAuth();
  const [person, setPerson] = useState<Person | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [profile, setProfile] = useState<ProfileFields | null>(null);

  useEffect(() => {
    const user = auth?.user;
    if (!user) {
      setLoading(false);
      return;
    }
    const p: ProfileFields = {
      preferred_username: user.profile.preferred_username as string | undefined,
      name: user.profile.name as string | undefined,
      email: user.profile.email as string | undefined,
    };
    setProfile(p);
    setLoading(true);
    fetch('/api/people/me', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(p),
    })
      .then(async res => {
        if (!res.ok) throw new Error(`Server responded ${res.status}`);
        return res.json();
      })
      .then(data => setPerson(data))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [auth?.user?.profile]);

  return { person, loading, error, profile, blazerId: profile?.preferred_username || null };
}
