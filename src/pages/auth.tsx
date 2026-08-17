import { useState } from 'react';
import Link from 'next/link';
import { supabase } from '../lib/supabaseClient';

export default function AuthPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [authMode, setAuthMode] = useState<'magic' | 'password'>('magic');

  async function signInWithMagicLink() {
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

  async function signInWithPassword() {
    setLoading(true);
    setMessage('');
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    setLoading(false);
    if (error) setMessage(error.message);
    else setMessage('Signed in successfully!');
  }

  async function signUpWithPassword() {
    setLoading(true);
    setMessage('');
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    setLoading(false);
    if (error) setMessage(error.message);
    else setMessage('Account created! Check your email to confirm.');
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

          {/* Auth mode toggle */}
          <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
            <button
              onClick={() => setAuthMode('magic')}
              style={{
                flex: 1,
                padding: '0.5rem',
                border: authMode === 'magic' ? '2px solid #000' : '1px solid #ccc',
                background: authMode === 'magic' ? '#f0f0f0' : '#fff',
                cursor: 'pointer',
                fontSize: '0.9rem',
              }}
            >
              Magic Link
            </button>
            <button
              onClick={() => setAuthMode('password')}
              style={{
                flex: 1,
                padding: '0.5rem',
                border: authMode === 'password' ? '2px solid #000' : '1px solid #ccc',
                background: authMode === 'password' ? '#f0f0f0' : '#fff',
                cursor: 'pointer',
                fontSize: '0.9rem',
              }}
            >
              Password
            </button>
          </div>

          {authMode === 'magic' ? (
            <>
              <p>Enter your email and we&apos;ll send a secure sign-in link to continue.</p>

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

              <button className="auth-submit" onClick={signInWithMagicLink} disabled={loading || !email}>
                {loading ? 'Sending...' : 'Send link'}
              </button>
            </>
          ) : (
            <>
              <p>Sign in with your email and password, or create a new account.</p>

              <div className="field-group">
                <label htmlFor="email-password">Email address</label>
                <input
                  id="email-password"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                />
              </div>

              <div className="field-group">
                <label htmlFor="password">Password</label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="........"
                />
              </div>

              <button
                className="auth-submit"
                onClick={signInWithPassword}
                disabled={loading || !email || !password}
              >
                {loading ? 'Signing in...' : 'Sign in'}
              </button>

              <button
                className="auth-submit"
                onClick={signUpWithPassword}
                disabled={loading || !email || !password}
                style={{ marginTop: '0.5rem', background: '#f0f0f0', color: '#000' }}
              >
                {loading ? 'Creating account...' : 'Create account'}
              </button>
            </>
          )}
          {message && <p className="auth-message">{message}</p>}
        </section>
        <div className="auth-orbit auth-orbit-one" aria-hidden="true" />
        <div className="auth-orbit auth-orbit-two" aria-hidden="true" />
      </section>
    </main>
  );
}
