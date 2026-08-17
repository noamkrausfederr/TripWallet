import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { supabase } from '../../lib/supabaseClient';

export default function AuthCallbackPage() {
  const router = useRouter();
  const [message, setMessage] = useState('Processing authentication...');

  useEffect(() => {
    async function handleCallback() {
      const code = typeof router.query.code === 'string' ? router.query.code : null;

      const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''));
      const accessToken = hashParams.get('access_token');
      const refreshToken = hashParams.get('refresh_token');
      const callbackError = hashParams.get('error_description');

      if (callbackError) {
        setMessage(callbackError);
        return;
      }

      const result = code
        ? await supabase.auth.exchangeCodeForSession(code)
        : accessToken && refreshToken
        ? await supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken })
        : null;

      if (!result) {
        setMessage('No authentication details found in the callback URL. Please sign in again.');
        return;
      }

      const { data, error } = result;
      if (error) {
        setMessage(error.message || 'Unable to complete authentication. Please try again.');
        return;
      }

      if (data.session) {
        // Remove sensitive token fragments before navigating away.
        window.history.replaceState({}, document.title, window.location.pathname);
        router.replace('/trips');
      } else {
        setMessage('Authentication succeeded but no session was created. Please sign in again.');
      }
    }

    if (router.isReady) {
      handleCallback();
    }
  }, [router]);

  return (
    <main className="auth-page">
      <section className="auth-shell">
        <header className="auth-nav">
          <Link href="/" className="auth-wordmark">trip wallet</Link>
          <Link href="/auth" className="auth-back">BACK TO SIGN IN</Link>
        </header>
        <section className="auth-card callback-card" aria-live="polite">
          <p className="auth-kicker">{'// TRIP WALLET'}</p>
          <h1>Signing in</h1>
          <p>{message}</p>
        </section>
        <div className="auth-orbit auth-orbit-one" aria-hidden="true" />
        <div className="auth-orbit auth-orbit-two" aria-hidden="true" />
      </section>
    </main>
  );
}
