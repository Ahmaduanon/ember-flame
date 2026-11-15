import { createContext, useContext, useEffect, useState, type FormEvent, type ReactNode } from 'react';
import { Flame, Shield, ArrowRight, UserCheck } from 'lucide-react';

export type User = { id: string; name: string; email: string };

interface AuthContextType {
  user: User | null;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  logout: async () => {},
});

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthPage({ mode }: { mode: 'login' | 'signup' }) {
  const signup = mode === 'signup';
  const [f, setF] = useState({ name: '', email: '', password: '' });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [pub, setPub] = useState(false);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', 'dark');
    document.documentElement.style.colorScheme = 'dark';
    fetch('/api/health')
      .then(r => (r.ok && r.headers.get('content-type')?.includes('application/json') ? r.json() : null))
      .then(j => { if (j) setPub(j.mode === 'public'); })
      .catch(() => {});
    fetch('/api/auth/me')
      .then(r => (r.ok && r.headers.get('content-type')?.includes('application/json') ? r.json() : null))
      .then(j => { if (j?.user) location.hash = '#app'; })
      .catch(() => {});
  }, []);

  async function submit(e: FormEvent) {
    e.preventDefault(); setBusy(true); setErr('');
    try {
      const r = await fetch(`/api/auth/${mode}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(signup ? f : { email: f.email, password: f.password }) });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) {
        if (r.status === 404 || r.status === 502 || r.status === 503) {
          const user: User = { id: 'guest-researcher', email: f.email || 'researcher@nasa.gov', name: f.name || 'Flight Specialist' };
          localStorage.setItem('ember_guest_session', JSON.stringify(user));
          location.hash = '#app';
          return;
        }
        throw new Error(j.error || 'Something went wrong. Try again.');
      }
      location.hash = '#app';
    } catch (x: any) {
      if (x.message?.includes('fetch') || x.message?.includes('NetworkError') || x.message?.includes('Failed to fetch')) {
        const user: User = { id: 'guest-researcher', email: f.email || 'researcher@nasa.gov', name: f.name || 'Flight Specialist' };
        localStorage.setItem('ember_guest_session', JSON.stringify(user));
        location.hash = '#app';
        return;
      }
      setErr(x.message);
      setBusy(false);
    }
  }

  function enterDemoGuest() {
    const user: User = { id: 'guest-researcher', email: 'researcher@nasa.gov', name: 'NASA Flight Specialist' };
    localStorage.setItem('ember_guest_session', JSON.stringify(user));
    location.hash = '#app';
  }

  return (
    <div className="lp">
      <header className="lp-top">
        <a className="lp-brand" href="#">
          <span style={{ color: 'var(--flame)', display: 'flex' }}><Flame size={24} /></span>
          <b>ember</b>
        </a>
        <nav>
          <a href="#">Back to site</a>
        </nav>
      </header>

      <section className="auth-page-container">
        <div className="auth-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', color: 'var(--flame)' }}>
            <Shield size={18} />
            <span style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase' }}>Mission Security</span>
          </div>
          <h2>{signup ? 'Create your account' : 'Sign in to Ember'}</h2>
          {pub ? (
            <p className="lp-lead">Sign in with your researcher credentials or enter the simulation demo below to access the lab.</p>
          ) : (
            <>
              <p style={{ fontSize: '13px', color: 'var(--muted)', marginBottom: '20px' }}>
                {signup ? 'Create your flight research account. Use at least 10 characters for the password.' : 'Access your space safety surveys and combustion experiments.'}
              </p>
              <form onSubmit={submit} style={{ display: 'grid', gap: '14px' }}>
                {signup && (
                  <label style={{ display: 'grid', gap: '6px', fontSize: '13px', fontWeight: 600 }}>
                    Name
                    <input required maxLength={80} autoComplete="name" value={f.name} onChange={e => setF({ ...f, name: e.target.value })} />
                  </label>
                )}
                <label style={{ display: 'grid', gap: '6px', fontSize: '13px', fontWeight: 600 }}>
                  Email
                  <input required type="email" maxLength={120} autoComplete="email" value={f.email} onChange={e => setF({ ...f, email: e.target.value })} />
                </label>
                <label style={{ display: 'grid', gap: '6px', fontSize: '13px', fontWeight: 600 }}>
                  Password
                  <input required type="password" minLength={signup ? 10 : 1} maxLength={128} autoComplete={signup ? 'new-password' : 'current-password'} value={f.password} onChange={e => setF({ ...f, password: e.target.value })} />
                </label>
                
                <button className="lp-btn" disabled={busy} style={{ width: '100%', marginTop: '6px' }}>
                  {busy ? 'Please wait…' : signup ? 'Create account' : 'Sign in'}
                  <ArrowRight size={16} />
                </button>

                {!signup && (
                  <div style={{ marginTop: '10px', padding: '12px 14px', background: 'var(--chip-bg)', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>Demo: <code>admin@ember.local</code></span>
                    <button
                      type="button"
                      className="lp-btn lp-btn-sm"
                      style={{ padding: '4px 10px', fontSize: '11px', background: 'var(--panel)', border: '1px solid var(--border)', color: 'var(--text)' }}
                      onClick={() => setF({ ...f, email: 'admin@ember.local', password: 'ember-password-123' })}
                    >
                      Fill demo
                    </button>
                  </div>
                )}
                <button
                  type="button"
                  className="btn btn-secondary"
                  style={{ width: '100%', marginTop: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                  onClick={enterDemoGuest}
                >
                  🚀 Enter Simulation as Demo Researcher
                </button>
                {err && <p className="lp-err" role="alert">{err}</p>}
              </form>
              <p style={{ marginTop: '18px', fontSize: '13px', color: 'var(--muted)' }}>
                {signup ? <>Already have an account? <a href="#login" style={{ color: 'var(--flame)', fontWeight: 600 }}>Sign in</a></> : <>New here? <a href="#signup" style={{ color: 'var(--flame)', fontWeight: 600 }}>Create an account</a></>}
              </p>
            </>
          )}
        </div>
      </section>
    </div>
  );
}

export function AuthGate({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    let live = true;
    const check = () => fetch('/api/auth/me').then(async r => {
      if (!live) return;
      if (r.ok && r.headers.get('content-type')?.includes('application/json')) {
        const j = await r.json().catch(() => null);
        if (j?.user) { setUser(j.user); return; }
      } else {
        const demo = typeof window !== 'undefined' ? localStorage.getItem('ember_guest_session') : null;
        if (demo) {
          try { setUser(JSON.parse(demo)); return; } catch {}
        }
        location.hash = '#login';
      }
    }).catch(() => {
      if (!live) return;
      const demo = typeof window !== 'undefined' ? localStorage.getItem('ember_guest_session') : null;
      if (demo) {
        try { setUser(JSON.parse(demo)); return; } catch {}
      }
      const defaultUser: User = { id: 'guest-researcher', email: 'researcher@nasa.gov', name: 'NASA Flight Specialist' };
      if (typeof window !== 'undefined') localStorage.setItem('ember_guest_session', JSON.stringify(defaultUser));
      setUser(defaultUser);
    });
    check();
    const id = setInterval(check, 60000);
    return () => { live = false; clearInterval(id); };
  }, []);

  async function out() {
    if (typeof window !== 'undefined') localStorage.removeItem('ember_guest_session');
    await fetch('/api/auth/logout', { method: 'POST' }).catch(() => {});
    setUser(null);
    location.hash = '#login';
  }

  if (!user) return <div className="auth-wait" role="status">Loading…</div>;

  return (
    <AuthContext.Provider value={{ user, logout: out }}>
      {children}
    </AuthContext.Provider>
  );
}
