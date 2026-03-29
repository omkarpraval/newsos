import { useCallback, useEffect, useState } from 'react'
import { GlobeCanvas } from './GlobeCanvas'

export function Features() {
  const [rnG, setRnG] = useState(2341)
  const [rnD, setRnD] = useState(1892)
  const [globeCount, setGlobeCount] = useState(66)

  const onGlobeLive = useCallback((n) => {
    setGlobeCount(n)
  }, [])

  useEffect(() => {
    const id = setInterval(() => {
      setRnG(2341 + Math.floor(Math.random() * 5))
      setRnD(1892 + Math.floor(Math.random() * 4))
    }, 2200)
    return () => clearInterval(id)
  }, [])

  return (
    <section className="feat-section">
      <div className="feat-label">Features</div>
      <h2 className="feat-title reveal">Everything you need to understand your visitors</h2>
      <p className="feat-sub reveal">
        From realtime analytics to revenue tracking, get the full picture of how people use your site.
      </p>

      <div className="feat-grid">
        <div className="feat-card reveal">
          <div className="feat-icon g">💰</div>
          <div className="feat-tag g">Revenue attribution</div>
          <div className="feat-head">See which of your channels bring in your most revenue.</div>
          <ul className="feat-list">
            <li>Revenue updates in real-time</li>
            <li>One-click Stripe sync</li>
            <li>Per-visitor revenue</li>
          </ul>
          <button type="button" className="learn-more">
            Learn more ›
          </button>
          <div className="rev-demo">
            <div className="rs-row">
              <span className="rs-icon">G</span>
              <span className="rs-name">Google</span>
              <div className="rs-bar-wrap">
                <div className="rs-bar" style={{ width: '100%' }} />
              </div>
              <span className="rs-num" id="rn-g">
                {rnG.toLocaleString()}
              </span>
            </div>
            <div className="rs-row">
              <span className="rs-icon">→</span>
              <span className="rs-name">Direct</span>
              <div className="rs-bar-wrap">
                <div className="rs-bar" style={{ width: '81%' }} />
              </div>
              <span className="rs-num" id="rn-d">
                {rnD.toLocaleString()}
              </span>
            </div>
            <div className="rs-row">
              <span className="rs-icon">✕</span>
              <span className="rs-name">Twitter</span>
              <div className="rs-bar-wrap">
                <div className="rs-bar" style={{ width: '32%' }} />
              </div>
              <span className="rs-num">743</span>
            </div>
            <div className="rs-row">
              <span className="rs-icon">⌥</span>
              <span className="rs-name">GitHub</span>
              <div className="rs-bar-wrap">
                <div className="rs-bar" style={{ width: '22%' }} />
              </div>
              <span className="rs-num">521</span>
            </div>
            <div className="rs-row">
              <span className="rs-icon">Y</span>
              <span className="rs-name">Hacker News</span>
              <div className="rs-bar-wrap">
                <div className="rs-bar" style={{ width: '18%' }} />
              </div>
              <span className="rs-num">412</span>
            </div>
            <div className="rs-row">
              <span className="rs-icon">in</span>
              <span className="rs-name">LinkedIn</span>
              <div className="rs-bar-wrap">
                <div className="rs-bar" style={{ width: '13%' }} />
              </div>
              <span className="rs-num">298</span>
            </div>
            <div className="rs-row">
              <span className="rs-icon">r</span>
              <span className="rs-name">Reddit</span>
              <div className="rs-bar-wrap">
                <div className="rs-bar" style={{ width: '8%' }} />
              </div>
              <span className="rs-num">187</span>
            </div>
          </div>
        </div>

        <div className="feat-card reveal">
          <div className="feat-icon b">🌐</div>
          <div className="feat-tag b">Realtime tracking</div>
          <div className="feat-head">Watch visitors arrive and interact with your site as it happens.</div>
          <ul className="feat-list">
            <li>Live visitor count</li>
            <li>Interactive visitor globe</li>
            <li>Streaming activity feed</li>
          </ul>
          <button type="button" className="learn-more">
            Learn more ›
          </button>
          <div className="globe-wrap">
            <GlobeCanvas onLiveCount={onGlobeLive} />
            <div className="globe-badge">
              🌐 <span className="globe-badge-count" id="globe-ct">{globeCount}</span>
            </div>
          </div>
        </div>

        <div className="feat-card reveal">
          <div className="feat-icon pk">😊</div>
          <div className="feat-tag pk">Visitor profiles</div>
          <div className="feat-head">See the complete journey of every visitor from start to finish.</div>
          <ul className="feat-list">
            <li>Full session history</li>
            <li>Cross-device tracking</li>
            <li>Identify logged-in users</li>
          </ul>
          <button type="button" className="learn-more">
            Learn more ›
          </button>
          <div className="prof-demo">
            <div className="prof-row active">
              <div className="p-av" style={{ background: 'linear-gradient(135deg,#f472b6,#fb923c)' }}>
                OP
              </div>
              <div className="p-name">
                Olivia Patel <span className="p-chk">✓</span>
              </div>
              <div className="p-src">→ Direct</div>
              <div className="p-rev">$199</div>
              <div className="p-time">now</div>
            </div>
            <div className="prof-row">
              <div className="p-av" style={{ background: 'linear-gradient(135deg,#f87171,#34d399)' }}>SR</div>
              <div className="p-name">Speedy Rabbit</div>
              <div className="p-src">🟠 Reddit</div>
              <div className="p-rev" style={{ color: '#9CA3AF' }}>
                $0
              </div>
              <div className="p-time">2m</div>
            </div>
            <div className="prof-row">
              <div className="p-av" style={{ background: 'linear-gradient(135deg,#60a5fa,#34d399)' }}>SM</div>
              <div className="p-name">
                Sarah Mitchell <span className="p-chk">✓</span>
              </div>
              <div className="p-src">G Google</div>
              <div className="p-rev">$249</div>
              <div className="p-time">5m</div>
            </div>
            <div className="prof-row">
              <div className="p-av" style={{ background: 'linear-gradient(135deg,#a78bfa,#60a5fa)' }}>QP</div>
              <div className="p-name">Quirky Penguin</div>
              <div className="p-src">→ Direct</div>
              <div className="p-rev" style={{ color: '#9CA3AF' }}>
                $0
              </div>
              <div className="p-time">12m</div>
            </div>
            <div className="prof-row">
              <div className="p-av" style={{ background: 'linear-gradient(135deg,#f472b6,#818cf8)' }}>JC</div>
              <div className="p-name">
                James Chen <span className="p-chk">✓</span>
              </div>
              <div className="p-src">✕ Twitter</div>
              <div className="p-rev">$99</div>
              <div className="p-time">1h</div>
            </div>
            <div className="prof-row">
              <div className="p-av" style={{ background: 'linear-gradient(135deg,#34d399,#60a5fa)' }}>FK</div>
              <div className="p-name">Fluffy Koala</div>
              <div className="p-src">⌥ GitHub</div>
              <div className="p-rev" style={{ color: '#9CA3AF' }}>
                $0
              </div>
              <div className="p-time">3h</div>
            </div>
            <div className="prof-row">
              <div className="p-av" style={{ background: 'linear-gradient(135deg,#f59e0b,#ef4444)' }}>ER</div>
              <div className="p-name">
                Emma Rodriguez <span className="p-chk">✓</span>
              </div>
              <div className="p-src">G Google</div>
              <div className="p-rev">$149</div>
              <div className="p-time">5h</div>
            </div>
          </div>
        </div>

        <div className="feat-card reveal">
          <div className="feat-icon y">⚡</div>
          <div className="feat-tag y">Performance metrics</div>
          <div className="feat-head">See how your site performs for real users around the world.</div>
          <ul className="feat-list">
            <li>Core Web Vitals tracking</li>
            <li>Experience Score rating</li>
            <li>Per-page breakdowns</li>
          </ul>
          <button type="button" className="learn-more">
            Learn more ›
          </button>
          <div className="perf-demo">
            <div className="p-ring">
              <svg width="96" height="96" viewBox="0 0 96 96">
                <circle cx="48" cy="48" r="38" fill="none" stroke="#E5E7EB" strokeWidth="10" />
                <circle
                  cx="48"
                  cy="48"
                  r="38"
                  fill="none"
                  stroke="var(--green)"
                  strokeWidth="10"
                  strokeDasharray="238.76"
                  strokeDashoffset="0"
                  strokeLinecap="round"
                  style={{
                    transform: 'rotate(-90deg)',
                    transformOrigin: 'center',
                    transition: 'stroke-dashoffset 1s',
                  }}
                />
              </svg>
              <div className="p-ring-txt">
                100<small>Score</small>
              </div>
            </div>
            <div>
              <div className="p-grade">Perfect</div>
              <div className="p-gdesc">
                All your visitors had a perfect experience. That&apos;s pretty remarkable.
              </div>
              <div className="p-legend">
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: '#6B7280' }}>
                  <div className="p-dot" style={{ background: '#EF4444' }} />
                  0–49
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: '#6B7280' }}>
                  <div className="p-dot" style={{ background: '#EAB308' }} />
                  50–89
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: '#6B7280' }}>
                  <div className="p-dot" style={{ background: 'var(--green)' }} />
                  90+
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="sub-feats">
        <div className="sf-card reveal">
          <div className="sf-icon">🕵️</div>
          <div>
            <div className="sf-title">Privacy-first</div>
            <div className="sf-desc">
              Privacy is our foundation, and we are fully GDPR compliant by default.
            </div>
          </div>
        </div>
        <div className="sf-card reveal">
          <div>
            <div className="sf-title">Integrations</div>
            <div className="sf-desc">
              Connect Stripe, Dodo, or RevenueCat to track revenue alongside your traffic.
            </div>
          </div>
          <div className="int-logos">
            <div className="il" style={{ background: '#635BFF' }}>
              S
            </div>
            <div className="il" style={{ background: '#FF6B35', fontSize: 14 }}>
              D
            </div>
            <div className="il" style={{ background: '#E74C3C', fontSize: 13 }}>
              RC
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
