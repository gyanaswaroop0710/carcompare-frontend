export default function Header({ activeTab, setActiveTab, cmpCount, favCount, user, onLogout }) {
  return (
    <header className="header">
      <div className="header-inner">
        <span className="logo" onClick={() => setActiveTab('browse')}>
          Car<span>Compare</span>
        </span>
        <nav>
          {[
            { id: 'browse',    label: 'Browse' },
            { id: 'recommend', label: 'Recommend' },
            { id: 'compare',   label: <>Compare <span className="pill">{cmpCount}</span></> },
            { id: 'favorites', label: <>Saved <span className="pill">{favCount}</span></> },
          ].map(({ id, label }) => (
            <button
              key={id}
              className={`nav-btn${activeTab === id ? ' active' : ''}`}
              onClick={() => setActiveTab(id)}
            >
              {label}
            </button>
          ))}

          {user ? (
            <>
              <span className="nav-user" title={user.email}>Hi, {user.name.split(' ')[0]}</span>
              <button className="nav-btn" onClick={onLogout}>Log out</button>
            </>
          ) : (
            <button
              className={`nav-btn${activeTab === 'login' ? ' active' : ''}`}
              onClick={() => setActiveTab('login')}
            >
              Log in
            </button>
          )}
        </nav>
      </div>
    </header>
  );
}
