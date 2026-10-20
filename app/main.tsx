import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import Lab from './lab';
import Landing from './landing';
import { AuthGate, AuthPage } from './auth';
import './globals.css';
function Root() {
  const [hash, setHash] = useState(location.hash);
  useEffect(() => { const f = () => setHash(location.hash); addEventListener('hashchange', f); return () => removeEventListener('hashchange', f); }, []);
  if (hash === '#app') return <AuthGate><Lab/></AuthGate>;
  if (hash === '#login' || hash === '#signup') return <AuthPage key={hash} mode={hash === '#signup' ? 'signup' : 'login'}/>;
  return <Landing/>;
}
createRoot(document.getElementById('root')!).render(<React.StrictMode><Root/></React.StrictMode>);
