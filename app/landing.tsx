import { useEffect, useState, type FormEvent } from 'react';

const WHAT = [
  { name: 'Hazard scanner', text: 'Map a room and see risky pairings, like a curtain beside a socket or wood beside a stove. You get a risk score and a fix for each one.', status: 'Working in the app' },
  { name: 'Building survey and alerts', text: 'Add buildings and rooms, attach photos and record findings. An optional vision model can suggest findings, and a person confirms or dismisses each one. Sensor alerts become incident records you can review and export.', status: 'Working in the app' },
  { name: 'Guardian sensor unit', text: 'Watches particles, heat and flame, and CO if you add a sensor. When two kinds of evidence agree it sounds an alarm and can release a short burst of suppressant.', status: 'Software and firmware done, hardware testing next' },
  { name: 'Flaming Freefall lab', text: 'An educational model of how a flame behaves on Earth, the Moon, Mars and in microgravity. Save runs, compare them, and set them beside live sensor readings.', status: 'Working, built for NASA Space Apps' },
];
const STAGES = [
  ['Watch', 'One kind of evidence is above its normal level for 3 seconds.'],
  ['Warning', 'Two kinds agree for 5 seconds. The alarm sounds.'],
  ['Release', 'The unit is armed and the pattern holds for 8 seconds. It releases for 3 seconds, at most twice.'],
  ['Cooldown', 'It watches for 60 seconds in case the fire restarts.'],
];
const LIMITS = [
  'Ember is a prototype, not a certified safety device. Keep certified smoke alarms and extinguishers.',
  'Photos cannot show hidden wiring. Findings are prompts for a person to check, not verdicts.',
  'Detection thresholds are bench values that have not been validated yet.',
  'Powder suppressants irritate lungs, so Guardian belongs away from people, with a manual override.',
];

export default function Landing() {
  const [f, setF] = useState({ name: '', email: '', role: 'home', note: '', website: '' });
  const [st, setSt] = useState<'idle' | 'sending' | 'done' | 'error'>('idle');
  const [msg, setMsg] = useState('');
  const [pub, setPub] = useState(false);
  useEffect(() => { fetch('/api/health').then(r => r.json()).then(j => setPub(j.mode === 'public')).catch(() => {}); }, []);
  async function submit(e: FormEvent) {
    e.preventDefault(); setSt('sending');
    try {
      const r = await fetch('/api/waitlist', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(f) });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(j.error || 'Could not save your sign-up. Try again.');
      setMsg(j.already ? 'You are already on the list. We will email you.' : 'You are on the list. We will email you when Guardian is ready to test.'); setSt('done');
    } catch (err: any) { setMsg(err.message); setSt('error'); }
  }
  return <div className="lp">
    <header className="lp-top"><b>Ember</b>
      <nav><a className="lp-navlink" href="#what">What it does</a><a className="lp-navlink" href="#how">How it works</a><a className="lp-navlink" href="#waitlist">Waitlist</a>
        {!pub && <><a href="#login">Sign in</a><a className="lp-btn lp-btn-sm" href="#signup">Create account</a></>}</nav></header>
    <section className="lp-hero">
      <div>
        <span className="lp-badge">Built for the NASA Space Apps Challenge</span>
        <h1>Catch a fire before it is a fire.</h1>
        <p className="lp-lead">Ember checks a room for fire hazards, watches for the quiet signs of smouldering, and can put it out early. It also lets you study how flames behave when gravity changes.</p>
        <div className="lp-cta"><a className="lp-btn" href="#waitlist">Join the waitlist</a>{!pub && <a className="lp-btn alt" href="#signup">Create an account</a>}</div>
        {!pub && <p className="lp-small">Already have an account? <a href="#login">Sign in</a></p>}
      </div>
      <figure>
        <svg viewBox="0 0 520 300" role="img" aria-label="Illustration: a heat curve rising over time. Guardian reacts early, a typical smoke alarm sounds later, flames spread last.">
          <line x1="20" y1="260" x2="500" y2="260" stroke="#10202b" strokeWidth="2"/>
          <path className="lp-curve" d="M20 250 C120 248 190 244 240 226 C300 202 350 150 400 70 L480 30" fill="none" stroke="#e8452c" strokeWidth="5" strokeLinecap="round"/>
          <g fontSize="14" fill="#10202b">
            <line x1="235" y1="40" x2="235" y2="260" stroke="#1f8a70" strokeWidth="2" strokeDasharray="5 5"/><circle cx="235" cy="228" r="7" fill="#1f8a70"/>
            <text x="225" y="62" fontWeight="700" textAnchor="end">Guardian sees the pattern</text>
            <line x1="345" y1="100" x2="345" y2="260" stroke="#10202b" strokeWidth="2" strokeDasharray="5 5"/><circle cx="345" cy="160" r="7" fill="#10202b"/>
            <text x="355" y="242">Typical smoke alarm</text>
            <text x="388" y="22" fill="#e8452c" fontWeight="700">Flames spread</text>
            <text x="20" y="284">Time</text>
          </g>
        </svg>
        <figcaption>An illustration of the idea, not measured data.</figcaption>
      </figure>
    </section>
    <section className="lp-sec" id="what"><h2>What Ember does</h2>
      <div className="lp-rows">{WHAT.map(b => <div key={b.name} className="lp-row"><h3>{b.name}</h3><p>{b.text}</p><span>{b.status}</span></div>)}</div></section>
    <section className="lp-sec" id="how"><h2>How Guardian decides</h2>
      <p className="lp-lead">One noisy sensor never triggers a release. Guardian compares each reading with its own slow baseline and needs independent evidence.</p>
      <ol className="lp-stages">{STAGES.map(([n, t]) => <li key={n}><b>{n}</b><p>{t}</p></li>)}</ol></section>
    <section className="lp-sec"><h2>What Ember is not</h2>
      <ul className="lp-limits">{LIMITS.map(l => <li key={l}>{l}</li>)}</ul></section>
    <section className="lp-sec lp-wait" id="waitlist">
      <div className="lp-start">
        <div><h2>Get early access</h2>
          <p className="lp-lead">Tell us who you are and we will email you when Guardian is ready for testers.</p>
          {st === 'done' ? <p className="lp-ok" role="status">{msg}</p> :
            <form onSubmit={submit}>
              <label>Name<input required maxLength={80} autoComplete="name" value={f.name} onChange={e => setF({ ...f, name: e.target.value })}/></label>
              <label>Email<input required type="email" maxLength={120} autoComplete="email" value={f.email} onChange={e => setF({ ...f, email: e.target.value })}/></label>
              <label>I am interested as<select value={f.role} onChange={e => setF({ ...f, role: e.target.value })}>
                <option value="home">A home owner or renter</option><option value="business">A business or building manager</option><option value="student">A student</option><option value="researcher">A researcher or engineer</option><option value="other">Something else</option></select></label>
              <label>Anything we should know? (optional)<textarea maxLength={500} rows={3} value={f.note} onChange={e => setF({ ...f, note: e.target.value })}/></label>
              <input className="lp-hp" tabIndex={-1} autoComplete="off" aria-hidden="true" name="website" value={f.website} onChange={e => setF({ ...f, website: e.target.value })}/>
              <button className="lp-btn" disabled={st === 'sending'}>{st === 'sending' ? 'Joining…' : 'Join the waitlist'}</button>
              {st === 'error' && <p className="lp-err" role="alert">{msg}</p>}
            </form>}
        </div>
        <aside className="lp-account"><h3>Try the app</h3>
          {pub ? <p>Accounts are not available on this public site. Run Ember on your own computer to use the lab.</p> : <>
            <p>Create an account to use the hazard scanner, building survey, Guardian simulator and the flame lab. Accounts are stored on your own computer.</p>
            <div className="lp-cta"><a className="lp-btn" href="#signup">Create account</a><a className="lp-btn alt" href="#login">Sign in</a></div></>}
        </aside>
      </div>
    </section>
    <footer className="lp-foot">Built by the Ember team for NASA Space Apps.</footer>
  </div>;
}
