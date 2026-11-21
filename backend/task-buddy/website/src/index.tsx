import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import LandingPage from './pages/LandingPage.tsx';
import LoginSignup from './pages/LoginSignup.tsx';
import GoogleCallback from './pages/GoogleCallback.tsx';
import ProfilePage from './pages/ProfilePage.tsx';
import TasksPage from './pages/TasksPage.tsx';

// site-wide light/dark state (persisted), shared by every page
export function useSiteTheme() {
  const [dark, setDark] = useState<boolean>(() => {
    try { return localStorage.getItem('tb_theme') === 'dark'; } catch { return false; }
  });
  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
    try { localStorage.setItem('tb_theme', dark ? 'dark' : 'light'); } catch {}
  }, [dark]);
  const toggle = () => setDark((d) => !d);
  return { dark, toggle };
}

export default function App() {
  const { dark, toggle } = useSiteTheme();

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage dark={dark} onToggleDark={toggle} />} />
        <Route path="/login" element={<LoginSignup />} />
        <Route path="/auth/callback" element={<GoogleCallback />} />
        <Route path="/profile" element={<ProfilePage dark={dark} onToggleDark={toggle} />} />
        <Route path="/tasks" element={<TasksPage dark={dark} onToggleDark={toggle} />} />
        <Route path="*" element={<LandingPage dark={dark} onToggleDark={toggle} />} />
      </Routes>
    </BrowserRouter>
  );
}

// mount
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
