// Profile page: identity, reward tier, theme, KYC slot, logout
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar.tsx';
import { getCachedUser, refreshMe, logout, getToken, authedFetch } from '../auth.ts';

const TIER_META = {
  Bronze: { icon: '🥉', color: '#B08D57' },
  Silver: { icon: '🥈', color: '#9FA6B2' },
  Gold: { icon: '🥇', color: '#E2B93B' },
  Platinum: { icon: '💎', color: '#29B6D8' },
};

export default function ProfilePage({ dark, onToggleDark }: any) {
  const [user, setUser] = useState(getCachedUser());
  const [tier, setTier] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      const u = await refreshMe();
      if (!u && !getToken()) {
        navigate('/login');
        return;
      }
      if (u) setUser(u);
      const res = await authedFetch(`/api/tiers/${encodeURIComponent(u?.id || getCachedUser()?.id || '')}`).catch(() => null);
      if (res?.ok) setTier(await res.json());
      setLoading(false);
    })();
  }, []);

  const meta = TIER_META[tier?.tier] || TIER_META.Bronze;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <Navbar dark={dark} onToggleDark={onToggleDark} />
      <div className="max-w-3xl mx-auto px-4 py-10">
        {loading ? (
          <p className="text-center text-gray-500 dark:text-gray-400">Loading profile…</p>
        ) : (
          <>
            {/* identity card */}
            <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-lg border border-gray-100 dark:border-gray-800 p-8 text-center mb-6">
              <span className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-buddy-cyan to-buddy-blue text-white flex items-center justify-center text-3xl font-extrabold mb-4">
                {(user?.full_name || user?.email || '?').slice(0, 1).toUpperCase()}
              </span>
              <h1 className="text-2xl font-extrabold text-buddy-dark dark:text-white">{user?.full_name || 'Task Buddy user'}</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{user?.email}</p>
              <div className="flex gap-2 justify-center mt-3">
                <span className="px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-900/30 text-buddy-blue text-xs font-extrabold capitalize">
                  {user?.role || 'client'}
                </span>
                <span className={`px-3 py-1 rounded-full text-xs font-extrabold ${user?.email_verified || user?.password_hash ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400' : 'bg-gray-100 dark:bg-gray-800 text-gray-400'}`}>
                  {user?.email_verified ? 'Email verified' : 'Email pending verification'}
                </span>
              </div>
            </div>

            {/* tier card */}
            <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-lg border border-gray-100 dark:border-gray-800 p-6 mb-6">
              <div className="flex items-center gap-4">
                <span className="text-4xl">{meta.icon}</span>
                <div className="flex-1">
                  <p className="font-extrabold text-buddy-dark dark:text-white text-lg" style={{ color: meta.color }}>
                    {tier?.tier || 'Bronze'} tasker
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {tier ? `${tier.rating || '0'}★ · ${tier.reviews || 0} review${tier.reviews === 1 ? '' : 's'}` : '—'}
                  </p>
                </div>
              </div>
              {tier?.progress && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-3 leading-relaxed">
                  {tier.progress.rating_ok
                    ? `You've held the rating — ${Math.max(0, tier.progress.days_needed - tier.progress.days_kept)} more day(s) to reach ${tier.progress.next}${tier.progress.reviews_needed ? ` (+${tier.progress.reviews_needed} reviews)` : ''}`
                    : `${tier.progress.rating_needed > 0 ? `Get ${tier.progress.rating_needed}★ higher to ` : ''}qualify for ${tier.progress.next} — then hold it for ${tier.progress.days_needed} day(s)`}
                </p>
              )}
            </div>

            {/* actions */}
            <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-lg border border-gray-100 dark:border-gray-800 p-6 mb-6">
              <div className="flex items-center justify-between py-2">
                <div>
                  <p className="font-extrabold text-buddy-dark dark:text-white">Theme</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Light or dark, your pick</p>
                </div>
                <button
                  onClick={onToggleDark}
                  className="px-4 py-2 rounded-full bg-gray-100 dark:bg-gray-800 text-sm font-bold text-gray-700 dark:text-white"
                >
                  {dark ? '☀️ Switch to light' : '🌙 Switch to dark'}
                </button>
              </div>
              <div className="flex items-center justify-between py-4 border-t border-gray-100 dark:border-gray-800 mt-2">
                <div>
                  <p className="font-extrabold text-buddy-dark dark:text-white">Verify identity</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Upload NIN/BVN proof to build trust</p>
                </div>
                <button
                  onClick={() => authedFetch('/api/kyc/status').then(async (r) => alert(JSON.stringify(await r.json(), null, 2))).catch(() => alert('KYC service is not reachable'))}
                  className="px-4 py-2 rounded-full bg-buddy-orange text-white text-sm font-bold hover:bg-orange-600"
                >
                  Check KYC status
                </button>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={() => navigate('/tasks')}
                className="bg-buddy-blue hover:bg-blue-700 text-white px-6 py-3 rounded-full font-extrabold text-sm"
              >
                📋 Go to Tasks
              </button>
              <button
                onClick={() => { logout(); navigate('/'); }}
                className="bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-full font-extrabold text-sm"
              >
                Log out
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
