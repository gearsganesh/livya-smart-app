'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createSupabaseBrowserClient } from '@/lib/supabase-browser';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError('');

    const supabase = createSupabaseBrowserClient();
    const { data, error: authError } = await supabase.auth.signInWithPassword({ email, password });
    if (authError) {
      setError(authError.message);
      setBusy(false);
      return;
    }

    if (data.user) {
      const { data: staff, error: staffError } = await supabase
        .from('staff_users')
        .select('active, role')
        .eq('user_id', data.user.id)
        .maybeSingle();

      if (staffError || !staff?.active) {
        await supabase.auth.signOut();
        setError('Staff access is not enabled for this account.');
        setBusy(false);
        return;
      }
    }

    router.push('/dashboard');
  };

  return (
    <main className="admin-auth-shell">
      <form className="admin-auth-card" onSubmit={submit}>
        <div className="admin-auth-brand"><strong>LIVYA</strong><span>CLINICAL OPERATIONS</span></div>
        <span className="eyebrow">STAFF ACCESS</span>
        <h1>Sign in to LIVYA Admin</h1>
        <p className="admin-auth-copy">Clinical, patient and operations workflows in one controlled workspace.</p>

        <div className="admin-auth-fields">
          <label>Work email<input required type="email" autoComplete="username" placeholder="name@livyacurehub.com" value={email} onChange={(event) => setEmail(event.target.value)} /></label>
          <label>Password<input required type="password" autoComplete="current-password" placeholder="Your password" value={password} onChange={(event) => setPassword(event.target.value)} /></label>
          {error && <p className="admin-auth-error" role="alert">{error}</p>}
          <button className="admin-auth-button" disabled={busy}>{busy ? 'Checking access…' : 'Sign in'}</button>
        </div>

        <p className="admin-auth-footer">Access is controlled by Supabase Auth and the staff role assigned to your account. Admin privileges are enforced server-side.</p>
      </form>
    </main>
  );
}
