// Auth token – stored in localStorage so the login survives a page refresh
const TOKEN_KEY = 'token';
export const getToken = () => { try { return localStorage.getItem(TOKEN_KEY); } catch { return null; } };
export const setToken = t => {
  try { t ? localStorage.setItem(TOKEN_KEY, t) : localStorage.removeItem(TOKEN_KEY); } catch { /* ignore */ }
};

// App registers a callback here to be told when the server rejects our token (expired / logged out elsewhere)
let onUnauthorized = () => {};
export const setUnauthorizedHandler = fn => { onUnauthorized = fn; };

export async function api(url, opt = {}) {
  const token = getToken();
  const res = await fetch(url, {
    ...opt,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(opt.headers || {}),
    },
  });
  if (!res.ok) {
    if (res.status === 401 && token && !url.startsWith('/api/auth/login')) onUnauthorized();
    const msg = (await res.json().catch(() => ({}))).message
      || (res.status === 401 ? 'Please log in' : res.statusText);
    throw new Error(msg);
  }
  if (res.status === 204 || res.headers.get('content-length') === '0') return null;
  return res.json().catch(() => null);
}
