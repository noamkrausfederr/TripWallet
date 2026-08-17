import { useState } from 'react';
import Link from 'next/link';
import { supabase } from '../lib/supabaseClient';

export default function AuthPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  async function signIn() {
    setLoading(true);
    setMessage('');
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    setLoading(false);
    if (error) setMessage(error.message);
    else setMessage('Check your email for the sign-in link.');
  }

  return (
    <main className="auth-page">
      <section className="auth-shell">
        <header className="auth-nav">
          <Link href="/" className="auth-wordmark">trip wallet</Link>
          <Link href="/" className="auth-back">BACK TO HOME</Link>
        </header>
        <section className="auth-card" aria-labelledby="auth-title">
          <p className="auth-kicker">{'// WELCOME BACK'}</p>
          <h1 id="auth-title">Sign in /<br />Sign up</h1>
          <p>Enter your email and we’ll send a secure sign-in link to continue.</p>

          <div className="field-group">
            <label htmlFor="email">Email address</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
            />
          </div>

          <button className="auth-submit" onClick={signIn} disabled={loading || !email}>
            {loading ? 'Sending…' : 'Send link'}
          </button>
          {message && <p className="auth-message">{message}</p>}
        </section>
        <div className="auth-orbit auth-orbit-one" aria-hidden="true" />
        <div className="auth-orbit auth-orbit-two" aria-hidden="true" />
      </section>
    </main>
  );
}
