export function Nav() {
  return (
    <div className="nav-wrap">
      <nav>
        <div className="nav-logo">
          <svg width="16" height="16" viewBox="0 0 16 16">
            <circle cx="8" cy="8" r="7" stroke="#111" strokeWidth="1.5" fill="none" />
            <circle cx="8" cy="8" r="3" fill="#111" />
          </svg>
        </div>
        <div className="nav-links">
          <div className="dd-wrap">
            <button type="button" className="nav-link">
              Features ▾
            </button>
            <div className="dd-menu">
              <div className="dd-item">
                <div className="dd-icon">💰</div>
                <div className="dd-title">Revenue</div>
                <div className="dd-desc">Track revenue by source</div>
              </div>
              <div className="dd-item">
                <div className="dd-icon">🌐</div>
                <div className="dd-title">Realtime</div>
                <div className="dd-desc">Live visitor map and feed</div>
              </div>
              <div className="dd-item">
                <div className="dd-icon">⚡</div>
                <div className="dd-title">Performance</div>
                <div className="dd-desc">Monitor your web vitals</div>
              </div>
              <div className="dd-item">
                <div className="dd-icon">😊</div>
                <div className="dd-title">Profiles</div>
                <div className="dd-desc">Identify returning visitors</div>
              </div>
            </div>
          </div>
          <a className="nav-link" href="#">
            Pricing
          </a>
          <a className="nav-link" href="#">
            Blog
          </a>
          <a className="nav-link" href="#">
            Docs
          </a>
        </div>
        <a className="nav-login" href="#">
          Login
        </a>
        <a className="nav-reg" href="#">
          Register
        </a>
      </nav>
    </div>
  )
}
