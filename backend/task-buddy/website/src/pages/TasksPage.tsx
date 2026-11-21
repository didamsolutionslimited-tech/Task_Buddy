// Task Center: Post a Task (+), Helping, Posted tasks
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar.tsx';
import { getCachedUser, refreshMe, getToken, authedFetch } from '../auth.ts';

const SERVICES = ['Cleaning', 'Plumbing', 'Electrical', 'Furniture', 'Gardening', 'General Help', 'Air Conditioner Repair', 'Auto Repair'];

const fmtNaira = (v) => (v == null ? 'NGN —' : 'NGN ' + Number(v).toLocaleString());
const fmtDate = (d) => (d ? new Date(d).toLocaleString('en-NG', { dateStyle: 'medium', timeStyle: 'short' }) : '—');

export default function TasksPage({ dark, onToggleDark }: any) {
  const navigate = useNavigate();
  const [user, setUser] = useState(getCachedUser());
  const [posted, setPosted] = useState([]);
  const [helping, setHelping] = useState([]);
  const [openTasks, setOpenTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'posted' | 'helping'>('posted');
  const [showPost, setShowPost] = useState(false);
  const [toast, setToast] = useState('');

  useEffect(() => {
    (async () => {
      const u = await refreshMe();
      const me = u || getCachedUser();
      setUser(me);
      if (!getToken()) {
        navigate('/login');
        return;
      }
      const [mine, help, open] = await Promise.all([
        authedFetch('/api/tasks/mine').then((r) => (r.ok ? r.json() : { tasks: [] })).catch(() => ({ tasks: [] })),
        authedFetch('/api/tasks/helping').then((r) => (r.ok ? r.json() : { tasks: [] })).catch(() => ({ tasks: [] })),
        fetch('http://localhost:5000/api/tasks/open').then((r) => (r.ok ? r.json() : [])).catch(() => []),
      ]);
      setPosted(mine.tasks || []);
      setHelping(help.tasks || []);
      // open tasks that aren't mine and have no booking yet
      setOpenTasks((Array.isArray(open) ? open : []).filter((t) => t.client_id !== me?.id));
      setLoading(false);
    })();
  }, []);

  const acceptTask = async (taskId) => {
    const res = await authedFetch('/api/bookings/accept', { method: 'POST', body: JSON.stringify({ task_id: taskId }) });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) { showToast(data.error || 'Could not accept the task'); return; }
    showToast('Accepted! It moved to your Helping list.');
    // refresh lists
    const [mine, help] = await Promise.all([
      authedFetch('/api/tasks/mine').then((r) => (r.ok ? r.json() : { tasks: [] })).catch(() => ({ tasks: [] })),
      authedFetch('/api/tasks/helping').then((r) => (r.ok ? r.json() : { tasks: [] })).catch(() => ({ tasks: [] })),
    ]);
    setPosted(mine.tasks || []);
    setHelping(help.tasks || []);
    setOpenTasks((prev) => prev.filter((t) => t.id !== taskId));
  };

  const showToast = (t) => { setToast(t); setTimeout(() => setToast(''), 2600); };

  const Status = ({ s }: { s: string }) => (
    <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wide ${
      s === 'open' ? 'bg-green-100 dark:bg-green-900/40 text-green-600 dark:text-green-400'
      : s?.startsWith('accepted') ? 'bg-blue-100 dark:bg-blue-900/40 text-buddy-blue'
      : s === 'completed' ? 'bg-purple-100 dark:bg-purple-900/40 text-purple-500'
      : 'bg-orange-100 dark:bg-orange-900/40 text-buddy-orange'}`}>
      {(s || '—').replace('_', ' ')}
    </span>
  );

  const TaskCard = ({ t, kind }: { t: any, kind: 'posted' | 'helping' }) => (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm p-5 hover:shadow-md transition">
      <div className="flex items-center justify-between mb-2">
        <Status s={kind === 'posted' ? t.status : t.booking_status || t.task_status} />
        <span className="font-extrabold text-buddy-dark dark:text-white">{fmtNaira(t.budget)}</span>
      </div>
      <p className="font-extrabold text-buddy-dark dark:text-white">{t.title}</p>
      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">{t.description}</p>
      <div className="flex items-center justify-between mt-3 text-[11px] text-gray-400">
        <span>📍 {t.location_address || '—'}</span>
        <span>{kind === 'helping' && t.client_name ? `for ${t.client_name}` : `🗓 ${fmtDate(t.scheduled_date)}`}</span>
      </div>
      {kind === 'posted' && t.offers > 0 && (
        <p className="text-[11px] mt-2 text-buddy-orange font-bold">⚡ {t.offers} tasker offer{t.offers > 1 ? 's' : ''} so far</p>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <Navbar dark={dark} onToggleDark={onToggleDark} />
      <div className="max-w-5xl mx-auto px-4 py-10">
        <h1 className="text-3xl font-extrabold text-buddy-dark dark:text-white mb-1">Task Center</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-8">
          Welcome back{user?.full_name ? `, ${user.full_name.split(' ')[0]}` : ''} — manage your work.
        </p>

        {/* Post a task (+) */}
        <button
          onClick={() => setShowPost(true)}
          className="w-full mb-10 bg-gradient-to-br from-buddy-cyan to-buddy-blue rounded-3xl p-8 flex items-center gap-5 text-left hover:shadow-xl transition group"
        >
          <span className="w-16 h-16 rounded-full bg-white/20 backdrop-blur flex items-center justify-center text-white text-4xl font-extrabold group-hover:rotate-90 transition-transform duration-300">
            +
          </span>
          <span>
            <span className="block text-2xl font-extrabold text-white">Post a Task</span>
            <span className="block text-blue-100 text-sm">Get verified taskers on it today — it takes a minute</span>
          </span>
        </button>

        {/* tabs */}
        <div className="grid grid-cols-2 gap-1 bg-gray-100 dark:bg-gray-800 rounded-2xl p-1 mb-6 max-w-md">
          {([['posted', `Posted (${posted.length})`], ['helping', `Helping (${helping.length})`]] as const).map(([k, label]) => (
            <button
              key={k}
              onClick={() => setTab(k)}
              className={`py-2.5 rounded-xl font-extrabold text-sm transition ${tab === k ? 'bg-buddy-blue text-white shadow' : 'text-gray-500 dark:text-gray-400'}`}
            >
              {label}
            </button>
          ))}
        </div>

        {loading ? (
          <p className="text-center text-gray-400 py-10">Loading your tasks…</p>
        ) : (
          <>
            {tab === 'helping' && (
              <div className="mb-8">
                <h2 className="font-extrabold text-buddy-dark dark:text-white mb-3">Open tasks — offer a hand</h2>
                {openTasks.length ? (
                  <div className="grid md:grid-cols-2 gap-4">
                    {openTasks.map((t) => (
                      <div key={t.id} className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm p-5">
                        <div className="flex items-center justify-between mb-1">
                          <span className="px-2.5 py-1 rounded-full bg-green-100 dark:bg-green-900/40 text-green-600 dark:text-green-400 text-[10px] font-extrabold uppercase">open</span>
                          <span className="font-extrabold text-buddy-dark dark:text-white">{fmtNaira(t.budget)}</span>
                        </div>
                        <p className="font-extrabold text-buddy-dark dark:text-white">{t.title}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">{t.description}</p>
                        <div className="flex items-center justify-between mt-3">
                          <span className="text-[11px] text-gray-400">📍 {t.location_address || '—'}</span>
                          <button
                            onClick={() => acceptTask(t.id)}
                            className="bg-buddy-blue hover:bg-blue-700 text-white px-4 py-2 rounded-full text-xs font-extrabold transition"
                          >
                            Accept
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-400">No open tasks right now — check back soon or post one yourself.</p>
                )}
              </div>
            )}
            <div className="grid md:grid-cols-2 gap-4">
              {tab === 'posted' && posted.map((t) => <TaskCard key={t.id} t={t} kind="posted" />)}
              {tab === 'helping' && helping.map((t) => <TaskCard key={t.task_id} t={t} kind="helping" />)}
              {((tab === 'posted' && posted.length === 0) || (tab === 'helping' && helping.length === 0)) && (
                <p className="col-span-2 text-center text-gray-400 py-10">
                  {tab === 'posted'
                    ? 'Nothing posted yet — hit the big + above to post your first task.'
                    : 'No accepted jobs yet — accept an open task above to get started.'}
                </p>
              )}
            </div>
          </>
        )}
      </div>

      {toast && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 bg-buddy-dark dark:bg-white text-white dark:text-gray-900 px-6 py-3 rounded-full shadow-xl text-sm font-bold">
          {toast}
        </div>
      )}

      {showPost && (
        <PostTaskModal
          user={user}
          onClose={() => setShowPost(false)}
          onPosted={(t) => { setPosted([t, ...posted]); setTab('posted'); showToast('Task posted! Taskers can now see it.'); }}
          show={showToast}
        />
      )}
    </div>
  );
}

const PostTaskModal = ({ onClose, onPosted, show }: any) => {
  const [form, setForm] = useState({ title: '', description: '', budget: '', location_address: '', scheduled_at: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setError('');
    setBusy(true);
    try {
      const res = await authedFetch('/api/tasks/create', { method: 'POST', body: JSON.stringify(form) });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) setError(data.error || 'Could not post the task');
      else { show('Task posted!'); onPosted(data); onClose(); }
    } catch {
      setError('Could not reach the server.');
    } finally {
      setBusy(false);
    }
  };

  const f = (key, label, type = 'text') => (
    <input
      type={type}
      value={form[key]}
      onChange={(e) => setForm({ ...form, [key]: e.target.value })}
      placeholder={label}
      className="px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm w-full"
    />
  );

  return (
    <div className="fixed inset-0 z-[100] bg-black/60 flex items-center justify-center px-4" onClick={onClose}>
      <div className="bg-white dark:bg-gray-900 rounded-3xl p-8 max-w-md w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-2xl font-extrabold text-buddy-dark dark:text-white mb-1">Post a Task</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-5">Verified taskers nearby will see this instantly.</p>
        <div className="flex flex-col gap-3">
          {f('title', 'Task title (e.g. Fix leaking kitchen tap)')}
          <textarea
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="Describe exactly what you need done…"
            rows={3}
            className="px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm w-full"
          />
          {f('budget', 'Your budget in Naira (e.g. 15000)', 'number')}
          {f('location_address', 'Where should the tasker come?')}
          {f('scheduled_at', 'Pick a date/time', 'datetime-local')}
          {error && <p className="text-red-500 text-xs">{error}</p>}
          <button
            onClick={submit}
            disabled={busy}
            className="bg-buddy-orange hover:bg-orange-600 disabled:opacity-50 text-white py-3.5 rounded-xl font-extrabold text-sm mt-2 transition"
          >
            {busy ? 'Posting…' : 'Post Task'}
          </button>
          <button onClick={onClose} className="text-sm text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">Cancel</button>
        </div>
      </div>
    </div>
  );
};
