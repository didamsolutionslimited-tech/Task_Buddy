// OAuth redirect landing: stores the token then goes to the profile
import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { setSession, refreshMe, getCachedUser } from '../auth.ts';

export default function GoogleCallback() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [error, setError] = useState('');

  useEffect(() => {
    const t = params.get('t');
    if (!t) {
      setError('Google sign-in did not return a session token.');
      return;
    }
    // verify the token server-side, then continue
    (async () => {
      try {
        localStorage.setItem('tb_token', t);
        const user = await refreshMe();
        if (!user) {
          setError('The Google session could not be verified.');
          localStorage.removeItem('tb_token');
          return;
        }
        navigate('/profile');
      } catch {
        setError('Unexpected error finishing Google sign-in.');
      }
    })();
  }, []);

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center px-4">
        <div className="bg-white dark:bg-gray-900 rounded-3xl p-10 shadow-xl text-center">
          <p className="text-4xl mb-3">😕</p>
          <p className="font-extrabold text-buddy-dark dark:text-white mb-1">Google sign-in failed</p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-5">{error}</p>
          <button onClick={() => navigate('/login')} className="bg-buddy-blue text-white px-6 py-3 rounded-full font-bold text-sm">Back to login</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
      <div className="text-center">
        <img src="/task-buddy-logo.png" alt="" className="h-14 mx-auto animate-pulse" />
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-3">Finishing Google sign-in…</p>
      </div>
    </div>
  );
}
