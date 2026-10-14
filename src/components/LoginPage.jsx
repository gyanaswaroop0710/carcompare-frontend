import { useState } from 'react';
import { api } from '../api.js';

export default function LoginPage({ onAuth }) {
  const [mode, setMode]   = useState('login');          // 'login' | 'register'
  const [form, setForm]   = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy]   = useState(false);

  const isLogin = mode === 'login';
  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  const switchMode = () => { setMode(isLogin ? 'register' : 'login'); setError(''); };

  const submit = async e => {
    e.preventDefault();
    setError(''); setBusy(true);
    try {
      const body = isLogin ? { email: form.email, password: form.password } : form;
      const res = await api(isLogin ? '/api/auth/login' : '/api/auth/register', {
        method: 'POST', body: JSON.stringify(body),
      });
      onAuth(res);                                       // { token, user }
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="auth-wrap">
      <form className="panel auth-card" onSubmit={submit}>
        <h2>{isLogin ? 'Welcome back' : 'Create your account'}</h2>
        <p className="muted">
          {isLogin ? 'Log in to see your saved cars on any device.' : 'Sign up to save cars and keep them across devices.'}
        </p>

        {!isLogin && (
          <label className="field">
            Name
            <input value={form.name} onChange={set('name')} autoComplete="name" required maxLength={80} />
          </label>
        )}
        <label className="field">
          Email
          <input type="email" value={form.email} onChange={set('email')} autoComplete="email" required />
        </label>
        <label className="field">
          Password
          <input
            type="password" value={form.password} onChange={set('password')}
            autoComplete={isLogin ? 'current-password' : 'new-password'}
            required minLength={6} maxLength={72}
          />
        </label>

        {error && <div className="auth-error" role="alert">{error}</div>}

        <button className="btn primary lg" type="submit" disabled={busy}>
          {busy ? 'Please wait…' : isLogin ? 'Log in' : 'Sign up'}
        </button>

        <p className="auth-switch">
          {isLogin ? "Don't have an account? " : 'Already have an account? '}
          <button type="button" className="link-btn" onClick={switchMode}>
            {isLogin ? 'Sign up' : 'Log in'}
          </button>
        </p>
      </form>
    </section>
  );
}
