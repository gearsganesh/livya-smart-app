'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createSupabaseBrowserClient } from '@/lib/supabase-browser';

export default function Home() {
  const router = useRouter();
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [whatsapp, setWhatsapp] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const normalizedPhone = `+91${phone.replace(/\D/g, '').slice(-10)}`;

  const sendOtp = async (event: FormEvent) => {
    event.preventDefault();
    if (phone.replace(/\D/g, '').length !== 10) { setError('Enter a valid 10-digit mobile number.'); return; }
    setBusy(true); setError('');
    const { error: authError } = await createSupabaseBrowserClient().auth.signInWithOtp({ phone: normalizedPhone, options: whatsapp ? { channel: 'whatsapp' } : undefined });
    if (authError) setError(authError.message); else setStep('otp');
    setBusy(false);
  };

  const verifyOtp = async (event: FormEvent) => {
    event.preventDefault();
    if (!/^\d{6}$/.test(otp)) { setError('Enter the 6-digit OTP.'); return; }
    setBusy(true); setError('');
    const { error: authError } = await createSupabaseBrowserClient().auth.verifyOtp({ phone: normalizedPhone, token: otp, type: 'sms' });
    if (authError) setError(authError.message); else router.push('/dashboard');
    setBusy(false);
  };

  const social = async (provider: 'google' | 'apple') => {
    setBusy(true); setError('');
    const { error: authError } = await createSupabaseBrowserClient().auth.signInWithOAuth({ provider, options: { redirectTo: `${window.location.origin}/dashboard` } });
    if (authError) { setError(authError.message); setBusy(false); }
  };

  return (
    <main className="auth-prototype">
      <section className="auth-phone" aria-label="LIVYA sign in">
        <div className="auth-brand"><span>LIVYA</span><small>AI · HEALTH PLATFORM</small></div>
        <div className="auth-copy">Your health, coordinated. Vitals, medicines, records, therapies and tests, in one place, with a care team behind it.</div>
        {step === 'phone' ? (
          <form onSubmit={sendOtp}>
            <div className="auth-label">Mobile number</div>
            <div className="phone-input"><span>🇮🇳 +91</span><input aria-label="Mobile number" inputMode="numeric" autoComplete="tel" maxLength={10} placeholder="Mobile number" value={phone} onChange={(event) => setPhone(event.target.value.replace(/\D/g, ''))} />{phone.length === 10 && <b>✓</b>}</div>
            <button className="auth-primary" type="submit" disabled={busy}>{busy ? 'Sending OTP…' : 'Send OTP'}</button>
            <label className="wa"><input type="checkbox" checked={whatsapp} onChange={(event) => setWhatsapp(event.target.checked)} /> Also send on WhatsApp</label>
          </form>
        ) : (
          <form onSubmit={verifyOtp}>
            <div className="auth-label">Verification code</div>
            <div className="phone-input"><span>OTP</span><input aria-label="OTP" inputMode="numeric" autoComplete="one-time-code" maxLength={6} placeholder="6-digit code" value={otp} onChange={(event) => setOtp(event.target.value.replace(/\D/g, ''))} /></div>
            <button className="auth-primary" type="submit" disabled={busy}>{busy ? 'Verifying…' : 'Verify & continue'}</button>
            <button className="auth-back" type="button" onClick={() => { setStep('phone'); setOtp(''); setError(''); }}>Use a different number</button>
          </form>
        )}
        {error && <p className="auth-error" role="alert">{error}</p>}
        <div className="auth-or"><span>or continue with</span></div>
        <div className="social-row"><button type="button" onClick={() => social('google')} disabled={busy}>G&nbsp;&nbsp;Google</button><button type="button" onClick={() => social('apple')} disabled={busy}>&nbsp;&nbsp;Apple</button></div>
        <div className="ref-card"><span>🎟️</span><div><strong>Have a LIVYA plan or referral code?</strong><p>Enter it after sign-in to link your membership and care team.</p></div></div>
        <p className="terms">By continuing you agree to LIVYA&apos;s <a href="#">Terms</a> and <a href="#">Privacy Policy</a>. Health data is encrypted and stored in India.</p>
        <div className="auth-footer"><span>English ▾</span><a href="/signup">New to LIVYA? Create account</a></div>
      </section>
    </main>
  );
}
