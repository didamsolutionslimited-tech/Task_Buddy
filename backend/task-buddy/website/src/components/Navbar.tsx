// Shared navigation bar with auth state (Tasks tab, Login/Sign Up or avatar menu)
import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { getCachedUser, refreshMe, logout, getToken } from '../auth.ts';

export default function Navbar({ dark, onToggleDark, onDownload, onApply, landing }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [user, setUser] = useState(getCachedUser());
  const navigate = useNavigate();

  useEffect(() => {
    refreshMe().then((u) => u && setUser(u));
  }, []);

  const anchor = (to, label, onClick) => (
    <a
      href={to}
      onClick={(e) => {
        if (onClick) onClick();
        if (!landing && to.startsWith('#')) { e.preventDefault(); navigate('/'); setTimeout(() => document.getElementById(to.slice(1))?.scrollIntoView({ behavior: 'smooth' }), 400); }
        else if (to.startsWith('#')) document.getElementById(to.slice(1))?.scrollIntoView({ behavior: 'smooth' });
        else { e.preventDefault(); navigate(to); }
        setMenuOpen(false);
      }}
      className="hover:text-buddy-blue transition cursor-pointer"
    >
      {label}
    </a>
  );

  const links = (
    <>
      {anchor('#services', 'Services')}
      {anchor('#how-it-works', 'How it Works')}
      {anchor('#become-tasker', 'Become a Tasker')}
      <Link to="/tasks" className="hover:text-buddy-blue transition">Tasks</Link>
    </>
  );

  const userArea = user ? (
    <Link
      to="/profile"
      className="flex items-center gap-2 hover:opacity-80 transition"
      title="Profile"
    >
      <span className="w-9 h-9 rounded-full bg-gradient-to-br from-buddy-cyan to-buddy-blue text-white flex items-center justify-center font-extrabold">
        {(user.full_name || user.email || '?').slice(0, 1).toUpperCase()}
      </span>
      <span className="text-sm font-bold text-buddy-dark dark:text-white hidden lg:inline">
        {(user.full_name || user.email || 'Profile').split(' ')[0]}
      </span>
    </Link>
  ) : (
    <Link
      to="/login"
      className="bg-white dark:bg-gray-800 border-2 border-buddy-blue text-buddy-blue px-5 py-2 rounded-full font-bold hover:bg-blue-50 dark:hover:bg-gray-700 transition text-sm"
    >
      Log in / Sign up
    </Link>
  );

  return (
    <nav className="flex items-center justify-between px-6 py-4 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 sticky top-0 z-50">
      <div className="flex items-center gap-2">
        <Link to="/" className="flex items-center gap-2">
          <img src="/task-buddy-logo.png" alt="Task Buddy Logo" className="h-10 w-auto" />
          <img src="/task-buddy-wordmark.png" alt="TaskBuddy" className="h-7 w-auto" />
        </Link>
      </div>

      {/* desktop */}
      <div className="hidden md:flex items-center gap-6 text-sm font-medium text-gray-600 dark:text-gray-300">
        {links}
        {landing && onApply && (
          <button onClick={onApply} className="hover:text-buddy-blue transition">Apply as Tasker</button>
        )}
        {onDownload && (
          <button onClick={onDownload} className="bg-buddy-orange text-white px-5 py-2 rounded-full font-semibold hover:bg-orange-600 transition">
            Download App
          </button>
        )}
        <button
          onClick={onToggleDark}
          title={dark ? 'Switch to light mode' : 'Switch to dark mode'}
          className="w-9 h-9 rounded-full flex items-center justify-center bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition"
        >
          {dark ? '☀️' : '🌙'}
        </button>
        {userArea}
      </div>

      {/* mobile */}
      <div className="flex md:hidden items-center gap-3">
        {user && (
          <Link to="/profile" className="w-8 h-8 rounded-full bg-gradient-to-br from-buddy-cyan to-buddy-blue text-white flex items-center justify-center font-extrabold text-sm">
            {(user.full_name || user.email || '?').slice(0, 1).toUpperCase()}
          </Link>
        )}
        <button onClick={() => setMenuOpen((o) => !o)} className="text-gray-600 dark:text-gray-300">
          {menuOpen ? <X size={26} /> : <Menu size={26} />}
        </button>
      </div>

      {menuOpen && (
        <div className="md:hidden absolute top-full left-0 right-0 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 shadow-lg">
          <div className="flex flex-col gap-4 px-6 py-5 text-sm font-medium text-gray-600 dark:text-gray-300">
            {links}
            {user ? (
              <Link to="/profile" onClick={() => setMenuOpen(false)} className="font-bold text-buddy-blue">My Profile</Link>
            ) : (
              <Link to="/login" onClick={() => setMenuOpen(false)} className="bg-buddy-blue text-white text-center px-5 py-3 rounded-full font-bold">Log in / Sign up</Link>
            )}
            {onDownload && (
              <button onClick={() => { setMenuOpen(false); onDownload(); }} className="text-left bg-buddy-orange text-white px-5 py-3 rounded-full font-semibold">Download App</button>
            )}
            <button onClick={onToggleDark} className="text-left">
              {dark ? '☀️ Light mode' : '🌙 Dark mode'}
            </button>
          </div>
        </div>
      )}
    </nav>
  );
}
