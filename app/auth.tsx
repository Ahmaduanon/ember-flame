import { useEffect, useState, type FormEvent, type ReactNode } from 'react';

type User = { id: string; name: string; email: string };

export function AuthPage({ mode }: { mode: 'login' | 'signup' }) {
  const signup = mode === 'signup';
  const [f, setF] = useState({ name: '', email: '', password: '' });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [pub, setPub] = useState(false);
  useEffect(() => {
    fetch('/api/health').then(r => r.json()).then(j => setPub(j.mode === 'public')).catch(() => {});
    fetch('/api/auth/me').then(r => { if (r.ok) location.hash = '#app'; }).catch(() => {});
  }, []);
  async function submit(e: FormEvent) {
    e.preventDefault(); setBusy(true); setErr('');
    try {
      const r = await fetch(`/api/auth/${mode}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(signup ? f : { email: f.email, password: f.password }) });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(j.error || 'Something went wrong. Try again.');
      location.hash = '#app';
    } catch (x: any) { setErr(x.message); setBusy(false); }
  }
  return <div className="lp">
    <header className="lp-top"><b>Ember</b><nav><a href="#">Back to site</a></nav></header>
    <section className="lp-sec lp-wait">
      <h2>{signup ? 'Create your account' : 'Sign in to Ember'}</h2>
      {pub ? <p className="lp-lead">Accounts are not available on the public site. Run Ember on your own computer to use the lab.</p> : <>
        <p className="lp-lead">{signup ? 'Accounts live on this computer. Use at least 10 characters for the password.' : 'Welcome back.'}</p>
        <form onSubmit={submit}>
          {signup && <label>Name<input required maxLength={80} autoComplete="name" value={f.name} onChange={e => setF({ ...f, name: e.target.value })}/></label>}
          <label>Email<input required type="email" maxLength={120} autoComplete="email" value={f.email} onChange={e => setF({ ...f, email: e.target.value })}/></label>
          <label>Password<input required type="password" minLength={signup ? 10 : 1} maxLength={128} autoComplete={signup ? 'new-password' : 'current-password'} value={f.password} onChange={e => setF({ ...f, password: e.target.value })}/></label>
          <button className="lp-btn" disabled={busy}>{busy ? 'Please wait…' : signup ? 'Create account' : 'Sign in'}</button>
          {err && <p className="lp-err" role="alert">{err}</p>}
        </form>
        <p>{signup ? <>Already have an account? <a href="#login">Sign in</a></> : <>New here? <a href="#signup">Create an account</a></>}</p>
      </>}
    </section>
  </div>;
}

export function AuthGate({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  useEffect(() => {
    let live = true;
    const check = () => fetch('/api/auth/me').then(async r => {
      if (!live) return;
      if (r.ok) setUser((await r.json()).user); else location.hash = '#login';
    }).catch(() => {});
    check();
    const id = setInterval(check, 60000); // notice an expired session within a minute
    return () => { live = false; clearInterval(id); };
  }, []);
  async function out() { await fetch('/api/auth/logout', { method: 'POST' }).catch(() => {}); location.hash = '#login'; }
  if (!user) return <div className="auth-wait" role="status">Loading…</div>;
  return <>{children}<div className="auth-chip"><span>{user.name}</span><button onClick={out}>Sign out</button></div></>;
}
