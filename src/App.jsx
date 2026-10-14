import { useState, useEffect, useCallback, useRef } from 'react';
import { api, getToken, setToken, setUnauthorizedHandler } from './api.js';
import Header from './components/Header.jsx';
import BrowsePage from './components/BrowsePage.jsx';
import RecommendPage from './components/RecommendPage.jsx';
import ComparePage from './components/ComparePage.jsx';
import FavoritesPage from './components/FavoritesPage.jsx';
import LoginPage from './components/LoginPage.jsx';
import CarModal from './components/CarModal.jsx';
import Toast from './components/Toast.jsx';

export default function App() {
  const [tab, setTab]           = useState('browse');
  const [allCars, setAllCars]   = useState([]);
  const [filters, setFilters]   = useState({});
  const [user, setUser]         = useState(null);
  const [favIds, setFavIds]     = useState(new Set());
  const [cmp, setCmp]           = useState(() => JSON.parse(localStorage.getItem('cmp') || '[]'));
  const [modalId, setModalId]   = useState(null);
  const [toast, setToast]       = useState('');
  const toastTimer              = useRef(null);

  const showToast = useCallback(msg => {
    clearTimeout(toastTimer.current);
    setToast(msg);
    toastTimer.current = setTimeout(() => setToast(''), 2000);
  }, []);

  // Server rejected our token (expired / revoked) -> drop the login
  useEffect(() => {
    setUnauthorizedHandler(() => {
      setToken(null); setUser(null); setFavIds(new Set());
      showToast('Session expired — please log in again');
    });
  }, [showToast]);

  // Load all cars + filters once, and restore the login if a token is stored
  useEffect(() => {
    api('/api/cars').then(setAllCars).catch(() => {});
    api('/api/filters').then(setFilters).catch(() => {});
    if (getToken()) {
      api('/api/auth/me')
        .then(u => { setUser(u); loadFavs(); })
        .catch(() => setToken(null));
    }
  }, []);

  // Sync cmp into localStorage
  useEffect(() => {
    localStorage.setItem('cmp', JSON.stringify(cmp));
  }, [cmp]);

  // Handle #compare=... deep link
  useEffect(() => {
    const m = location.hash.match(/compare=([\d,]+)/);
    if (m) {
      const ids = m[1].split(',').map(Number).slice(0, 4);
      setCmp(ids);
      setTab('compare');
    }
  }, []);

  const loadFavs = async () => {
    try {
      const list = await api('/api/favorites');
      setFavIds(new Set(list.map(c => c.id)));
    } catch {
      /* ignore */
    }
  };

  const onAuth = ({ token, user: u }) => {
    setToken(token);
    setUser(u);
    loadFavs();
    switchTab('browse');
    showToast(`Welcome, ${u.name.split(' ')[0]}!`);
  };

  const logout = async () => {
    try { await api('/api/auth/logout', { method: 'POST' }); } catch { /* token may already be invalid */ }
    setToken(null); setUser(null); setFavIds(new Set());
    switchTab('browse');
    showToast('Logged out');
  };

  const toggleFav = async id => {
    if (!user) {
      showToast('Log in to save cars');
      switchTab('login');
      return;
    }
    try {
      await api('/api/favorites/' + id, { method: favIds.has(id) ? 'DELETE' : 'POST' });
      await loadFavs();
      showToast(favIds.has(id) ? 'Removed from saved' : 'Saved!');
    } catch (e) {
      showToast(e.message);
    }
  };

  const toggleCmp = id => {
    if (cmp.includes(id)) {
      setCmp(prev => prev.filter(x => x !== id));
      showToast('Removed from compare');
    } else if (cmp.length >= 4) {
      showToast('You can compare up to 4 cars');
    } else {
      setCmp(prev => [...prev, id]);
      showToast('Added to compare');
    }
  };

  const clearCmp = () => { setCmp([]); showToast('Compare list cleared'); };

  const switchTab = t => {
    setTab(t);
    if (t !== 'compare') {
      history.replaceState(null, '', location.pathname);
    }
  };

  const cmpNames = cmp.map(id => allCars.find(c => c.id === id)?.model).filter(Boolean);
  const showTray = cmp.length > 0 && tab !== 'compare';

  return (
    <>
      <Header
        activeTab={tab} setActiveTab={switchTab}
        cmpCount={cmp.length} favCount={favIds.size}
        user={user} onLogout={logout}
      />

      <main>
        {tab === 'browse' && (
          <BrowsePage
            cmp={cmp} toggleCmp={toggleCmp}
            favIds={favIds} toggleFav={toggleFav}
            onDetail={setModalId} allCars={allCars}
          />
        )}
        {tab === 'recommend' && (
          <RecommendPage
            favIds={favIds} toggleFav={toggleFav}
            toggleCmp={toggleCmp} onDetail={setModalId}
            filters={filters}
          />
        )}
        {tab === 'compare' && (
          <ComparePage cmp={cmp} toggleCmp={toggleCmp} allCars={allCars} />
        )}
        {tab === 'favorites' && (
          <FavoritesPage
            user={user} onLogin={() => switchTab('login')}
            favIds={favIds} toggleFav={toggleFav}
            cmp={cmp} toggleCmp={toggleCmp}
            onDetail={setModalId} allCars={allCars}
          />
        )}
        {tab === 'login' && <LoginPage onAuth={onAuth} />}
      </main>

      {/* Compare tray */}
      <div className={`tray${showTray ? ' show' : ''}`}>
        <span>
          {cmp.length}/4 selected{cmpNames.length ? ': ' + cmpNames.join(', ') : ''}
        </span>
        <button className="btn primary" disabled={cmp.length < 2} onClick={() => switchTab('compare')}>
          Compare now
        </button>
        <button className="btn" onClick={clearCmp}>Clear</button>
      </div>

      {/* Car detail modal */}
      {modalId && (
        <CarModal
          carId={modalId}
          onClose={() => setModalId(null)}
          onCmp={toggleCmp}
        />
      )}

      <Toast message={toast} />
    </>
  );
}
