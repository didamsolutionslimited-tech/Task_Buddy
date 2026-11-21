// Web auth helpers (token + whoami)
export const TOKEN_KEY = 'tb_token';
export const USER_KEY = 'tb_user';

export const getToken = () => {
  try { return localStorage.getItem(TOKEN_KEY); } catch { return null; }
};
export const setSession = (token, user) => {
  try {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  } catch {}
};
export const getCachedUser = () => {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
};
export const logout = () => {
  try {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  } catch {}
};

export const authedFetch = async (path, opts = {}) => {
  const token = getToken();
  const res = await fetch(`http://localhost:5000${path}`, {
    ...opts,
    headers: {
      ...(opts.headers || {}),
      'Content-Type': opts.body instanceof FormData ? undefined : (opts.headers?.['Content-Type'] || 'application/json'),
      Authorization: token ? `Bearer ${token}` : undefined,
    },
  });
  return res;
};

export const refreshMe = async () => {
  const token = getToken();
  if (!token) return null;
  try {
    const res = await authedFetch('/api/web-auth/me');
    if (!res.ok) return null;
    const data = await res.json();
    if (data.user) setSession(token, data.user);
    return data.user;
  } catch {
    return null;
  }
};

export const googleEnabled = async () => {
  try {
    const res = await fetch('http://localhost:5000/api/web-auth/google-status');
    const data = await res.json();
    return !!data.enabled;
  } catch { return false; }
};
