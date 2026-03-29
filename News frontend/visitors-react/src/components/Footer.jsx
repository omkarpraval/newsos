export function Footer() {
  return (
    <footer>
      <div className="foot-inner">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div
              style={{
                width: 26,
                height: 26,
                background: '#111827',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <div style={{ width: 10, height: 10, background: '#fff', borderRadius: '50%' }} />
            </div>
            <span style={{ fontWeight: 700, color: '#111827', fontSize: 15 }}>Visitors</span>
          </div>
          <p className="foot-desc">
            Built over hundreds of late nights, Visitors gives you friendly, privacy-first insights about your website
            and products.
          </p>
          <div className="foot-status">
            <div className="status-dot" />
            Operational
          </div>
          <div className="foot-copy">© 2026</div>
        </div>
        <div>
          <div className="foot-col-h">Product</div>
          <a href="#" className="foot-link">
            Home
          </a>
          <a href="#" className="foot-link">
            Login
          </a>
          <a href="#" className="foot-link">
            Register
          </a>
          <a href="#" className="foot-link">
            Docs
          </a>
        </div>
        <div>
          <div className="foot-col-h">Features</div>
          <a href="#" className="foot-link">
            Revenue
          </a>
          <a href="#" className="foot-link">
            Realtime
          </a>
          <a href="#" className="foot-link">
            Performance
          </a>
          <a href="#" className="foot-link">
            Profiles
          </a>
        </div>
        <div>
          <div className="foot-col-h">Comparison</div>
          <a href="#" className="foot-link">
            Google Analytics
          </a>
          <a href="#" className="foot-link">
            Plausible
          </a>
          <a href="#" className="foot-link">
            Fathom
          </a>
        </div>
        <div>
          <div className="foot-col-h">Company</div>
          <a href="#" className="foot-link">
            Contact
          </a>
          <a href="#" className="foot-link">
            Blog
          </a>
          <a href="#" className="foot-link">
            GDPR
          </a>
          <a href="#" className="foot-link">
            Data policy
          </a>
          <a href="#" className="foot-link">
            DPA
          </a>
          <a href="#" className="foot-link">
            Privacy
          </a>
          <a href="#" className="foot-link">
            Terms
          </a>
        </div>
      </div>
      <div className="foot-arc">
        <svg viewBox="0 0 900 280" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M0 280 C150 140 350 50 450 50 C550 50 750 140 900 280"
            stroke="#7C3AED"
            strokeWidth="80"
            fill="none"
            opacity="0.2"
          />
          <path
            d="M80 280 C200 170 350 100 450 100 C550 100 700 170 820 280"
            stroke="#A78BFA"
            strokeWidth="60"
            fill="none"
            opacity="0.25"
          />
          <path
            d="M160 280 C260 190 360 150 450 150 C540 150 640 190 740 280"
            stroke="#7C3AED"
            strokeWidth="50"
            fill="none"
            opacity="0.35"
          />
        </svg>
      </div>
    </footer>
  )
}
