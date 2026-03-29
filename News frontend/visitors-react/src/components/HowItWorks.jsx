export function HowItWorks() {
  return (
    <div className="hiw">
      <div className="hiw-inner">
        <div className="hiw-lbl">How it works</div>
        <h2 className="hiw-title reveal">Get started in minutes</h2>
        <p className="hiw-sub reveal">
          Setting things up is as simple as adding a tiny script tag to your website. No complex setup or confusing tag
          manager.
        </p>
        <div className="hiw-steps">
          <div className="hiw-step reveal">
            <div className="hiw-visual">
              <div className="tech-logos">
                <div className="tech-logo" style={{ background: 'linear-gradient(135deg,#FF6B6B,#FF8E53)' }}>
                  🔴
                </div>
                <div className="tech-logo" style={{ background: '#111' }}>
                  <span style={{ color: '#61DAFB', fontSize: 24 }}>⚛</span>
                </div>
                <div className="tech-logo" style={{ background: 'linear-gradient(135deg,#43e97b,#38f9d7)' }}>🟢</div>
              </div>
            </div>
            <div className="hiw-body">
              <div className="hiw-num">01</div>
              <div className="hiw-desc">
                <strong>Install script.</strong> Watch visitors arrive on your site instantly in realtime.
              </div>
            </div>
          </div>
          <div className="hiw-step reveal">
            <div className="hiw-visual">
              <div className="stripe-orb">S</div>
            </div>
            <div className="hiw-body">
              <div className="hiw-num">02</div>
              <div className="hiw-desc">
                <strong>Connect revenue.</strong> Link your payment provider to track revenue attribution.
              </div>
            </div>
          </div>
          <div className="hiw-step reveal">
            <div className="hiw-visual">
              <div className="insights-card">
                <div className="ins-row">
                  <span>→ Direct</span>
                  <span>$4,230</span>
                </div>
                <div className="ins-row">
                  <span>G Google</span>
                  <span>$2,150</span>
                </div>
                <div className="ins-row">
                  <span>📌 Pinterest</span>
                  <span>$980</span>
                </div>
              </div>
            </div>
            <div className="hiw-body">
              <div className="hiw-num">03</div>
              <div className="hiw-desc">
                <strong>See insights.</strong> Discover which sources, locations and more drive the most revenue.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
