import { useState } from 'react'

const TABS = ['Dashboard', 'Profiles', 'Funnels', 'Performance', 'Realtime']

export function Hero() {
  const [activeTab, setActiveTab] = useState('Dashboard')

  return (
    <section className="hero">
      <div className="hero-badge">
        <span className="badge-new">NEW</span>
        <span className="badge-text">We hit $1K MRR</span>
        <span className="badge-arrow">›</span>
      </div>
      <h1 className="hero-title">
        Revenue-first
        <br />
        web analytics
      </h1>
      <p className="hero-sub">
        See every visitor in realtime and witness the moment they become a customer.
      </p>
      <div className="hero-ctas">
        <a href="#" className="btn-p">
          Start 14 day free trial
        </a>
        <a href="#" className="btn-s">
          See demo
        </a>
      </div>
      <div className="logo-strip">
        <div className="ls-item">
          <div className="ls-icon">⚡</div>
        </div>
        <div className="ls-item">
          <div className="ls-icon" style={{ background: '#2D2D2D', color: '#fff', borderRadius: '50%' }}>
            ●
          </div>
        </div>
        <div className="ls-item">
          <div className="ls-icon" style={{ background: '#1B3A2D', color: '#4ADE80' }}>
            T
          </div>
          Temple
        </div>
        <div className="ls-item">
          <div className="ls-icon" style={{ background: '#1a1a2e', color: '#818CF8' }}>
            ◈
          </div>
          inbound
        </div>
        <div className="ls-item">
          <div className="ls-icon" style={{ background: '#e5e7eb' }}>✦</div>
        </div>
        <div className="ls-item">
          <div className="ls-icon" style={{ background: '#2D2D2D', color: '#fff' }}>
            ▶
          </div>
          Buildkite
        </div>
      </div>
      <div className="tabs">
        {TABS.map((label) => (
          <button
            key={label}
            type="button"
            className={`tab${activeTab === label ? ' on' : ''}`}
            onClick={() => setActiveTab(label)}
          >
            {label}
          </button>
        ))}
      </div>
    </section>
  )
}
