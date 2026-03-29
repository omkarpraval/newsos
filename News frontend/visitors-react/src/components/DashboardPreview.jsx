import { useCallback, useEffect, useState } from 'react'
import { LiveBars } from './LiveBars'
import { MiniChart } from './MiniChart'

export function DashboardPreview() {
  const [people, setPeople] = useState(2369)
  const [rev, setRev] = useState(390)
  const [views, setViews] = useState(9102)
  const [livePeople, setLivePeople] = useState(28)

  const onLiveCount = useCallback((n) => {
    setLivePeople(n)
  }, [])

  useEffect(() => {
    let ppl = 2369
    let r = 390
    let v = 9102
    const id = setInterval(() => {
      ppl += Math.floor(Math.random() * 3) - 1
      if (Math.random() > 0.7) r += Math.floor(Math.random() * 40) + 10
      v += Math.floor(Math.random() * 8) + 1
      setPeople(ppl)
      setRev(r)
      setViews(v)
    }, 2200)
    return () => clearInterval(id)
  }, [])

  const rev2 = `A$${rev * 2 - 30}`

  return (
    <div className="dash-bg">
      <div className="dash-wrap">
        <div className="dash-card">
          <div className="dash-topbar">
            <div className="topbar-left">
              <div className="logo-dot" />
              Endless <div className="status-dot" style={{ marginLeft: 4 }} />
            </div>
            <div style={{ fontSize: 13, color: '#9CA3AF' }}>Today ↻</div>
            <div className="avatar-circle" />
          </div>
          <div className="dash-body">
            <div className="dash-period">
              Today <span style={{ color: '#9CA3AF', fontSize: 11 }}>↻</span>
            </div>
            <div className="dash-stats">
              <div className="ds">
                <div className="ds-lbl">
                  People <span style={{ color: 'var(--green)', fontSize: 9 }}>●</span>
                </div>
                <div className="ds-val" id="s-people">
                  {people.toLocaleString()}
                </div>
                <div className="ds-chg neg">-30%</div>
              </div>
              <div className="ds">
                <div className="ds-lbl">
                  Revenue <span style={{ color: 'var(--green)', fontSize: 9 }}>●</span>
                </div>
                <div className="ds-val" id="s-rev">
                  ${rev}
                </div>
                <div className="ds-chg neg">-32%</div>
              </div>
              <div className="ds">
                <div className="ds-lbl">
                  Views <span style={{ color: 'var(--green)', fontSize: 9 }}>●</span>
                </div>
                <div className="ds-val" id="s-views">
                  {views.toLocaleString()}
                </div>
                <div className="ds-chg neg">-33%</div>
              </div>
              <div className="ds">
                <div className="ds-lbl">CR</div>
                <div className="ds-val">100%</div>
                <div className="ds-chg pos">0%</div>
              </div>
              <div className="ds">
                <div className="ds-lbl">Bounced</div>
                <div className="ds-val" id="s-bounce">
                  33.3%
                </div>
                <div className="ds-chg pos">+100%</div>
              </div>
              <div className="ds">
                <div className="ds-lbl">Duration</div>
                <div className="ds-val">10m 53s</div>
                <div className="ds-chg pos">+252%</div>
              </div>
            </div>
            <div className="chart-wrap">
              <MiniChart />
            </div>
            <div className="dash-bottom">
              <div className="db-card">
                <div className="db-title">
                  <span id="live-ct">{livePeople} people</span>&nbsp;in the last 30m
                  <span className="rt-badge">Realtime ›</span>
                </div>
                <LiveBars onLiveCount={onLiveCount} />
              </div>
              <div className="db-card">
                <div className="db-title">
                  Experience Score{' '}
                  <span style={{ color: '#9CA3AF', fontSize: 11 }}>Performance ›</span>
                </div>
                <div className="score-row">
                  <div className="score-ring-wrap">
                    <svg width="56" height="56" viewBox="0 0 56 56">
                      <circle cx="28" cy="28" r="22" fill="none" stroke="#E5E7EB" strokeWidth="6" />
                      <circle
                        cx="28"
                        cy="28"
                        r="22"
                        fill="none"
                        stroke="var(--green)"
                        strokeWidth="6"
                        strokeDasharray="138.2"
                        strokeDashoffset="0"
                        strokeLinecap="round"
                      />
                    </svg>
                    <div className="score-txt">100</div>
                  </div>
                  <div>
                    <div className="score-info-title">Perfect</div>
                    <div className="score-info-desc">
                      All your visitors had a perfect experience. Flawless.
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="rev-row">
              <div className="rev-mini">
                <div className="rev-lbl">
                  Revenue <span className="rev-badge">+100%</span>
                </div>
                <div className="rev-val" id="s-rev2">
                  {rev2}
                </div>
              </div>
              <div className="rev-mini">
                <div className="rev-lbl">
                  Sales <span className="rev-badge">100% CR</span>
                </div>
                <div className="rev-val" style={{ fontSize: 13, color: 'var(--green)', marginTop: 2 }}>
                  28x the 3.6% industry average. Incredible.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
