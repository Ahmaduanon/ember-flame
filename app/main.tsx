import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import Lab from './lab';
import Landing from './landing';
import { AuthGate, AuthPage } from './auth';
import { ThemeProvider } from './theme';
import { ToastProvider } from './toast';
import './globals.css';

function Root() {
  const [hash, setHash] = useState(location.hash);
  useEffect(() => {
    const f = () => setHash(location.hash);
    window.addEventListener('hashchange', f);
    return () => window.removeEventListener('hashchange', f);
  }, []);

  if (hash.startsWith('#app')) {
    return <AuthGate><Lab /></AuthGate>;
  }
  const directTabs = ['#guard', '#scanner', '#guardian', '#psi', '#lab', '#experiments', '#method'];
  if (directTabs.includes(hash)) {
    location.hash = '#app?tab=' + hash.slice(1);
    return <AuthGate><Lab /></AuthGate>;
  }
  if (hash === '#login' || hash === '#signup') {
    return <AuthPage key={hash} mode={hash === '#signup' ? 'signup' : 'login'} />;
  }
  return <Landing />;
}

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ThemeProvider>
      <ToastProvider>
        <Root />
      </ToastProvider>
    </ThemeProvider>
  </React.StrictMode>
);
