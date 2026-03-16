import { useState } from 'react'
import axiosClient from '../api/axios'

const CarLogo = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M5.5 10.5L7.5 5.5H16.5L18.5 10.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <rect x="2" y="10.5" width="20" height="6" rx="2" stroke="white" strokeWidth="1.5"/>
    <circle cx="6.5" cy="17.5" r="2" stroke="white" strokeWidth="1.5"/>
    <circle cx="17.5" cy="17.5" r="2" stroke="white" strokeWidth="1.5"/>
    <path d="M8.5 17.5H15.5" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
    <path d="M2 13.5H4M20 13.5H22" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
)

function Login({ onLoginSuccess }) {
  const [email, setEmail]           = useState('')
  const [password, setPassword]     = useState('')
  const [loading, setLoading]       = useState(false)
  const [error, setError]           = useState('')
  const [rememberMe, setRememberMe] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const response = await axiosClient.post('/login', { 
        email, 
        password,
        remember_me: rememberMe
      })
      localStorage.setItem('token', response.data.token)
      localStorage.setItem('user', JSON.stringify(response.data.user))
      if (rememberMe) {
        localStorage.setItem('rememberMe', 'true')
      }
      onLoginSuccess(response.data.user)
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid credentials. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:ital,wght@0,300;0,400;0,500;0,600;1,300&family=DM+Mono:wght@400;500&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        :root {
          --blue:      #2563A8;
          --blue-br:   #4A9EFF;
          --blue-glow: rgba(37,99,168,0.30);
          --grey-100:  #F6F6F6;
          --grey-200:  #E6E6E6;
          --grey-400:  #ABABAB;
          --grey-600:  #6B6B6B;
          --grey-800:  #2D2D2D;
          --ink:       #0A0A0A;
          --white:     #FFFFFF;
        }

        .lp {
          min-height: 100vh;
          display: flex;
          font-family: 'DM Sans', sans-serif;
          background: #081523;
        }

        /* ═══ LEFT PANEL ═══ */
        .lp-left {
          width: 44%;
          min-height: 100vh;
          position: relative;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          padding: 52px 56px 52px 52px;
          overflow: hidden;
          flex-shrink: 0;
          background:
            radial-gradient(ellipse 80% 70% at 100% 100%, rgba(30,80,140,0.55) 0%, transparent 60%),
            radial-gradient(ellipse 60% 50% at 0% 0%,   rgba(10,30,55,0.85)  0%, transparent 65%),
            linear-gradient(150deg,
              #071321 0%,
              #091A2E 18%,
              #0D2340 38%,
              #102C50 55%,
              #163660 72%,
              #1C4070 88%,
              #214878 100%
            );
        }

        /* Dot grid — reduced opacity so text dominates */
        .lp-dots {
          position: absolute;
          inset: 0;
          background-image: radial-gradient(circle, rgba(255,255,255,0.04) 1px, transparent 1px);
          background-size: 26px 26px;
          pointer-events: none;
          z-index: 0;
        }

        .lp-glow-top {
          position: absolute;
          top: -120px; right: -60px;
          width: 380px; height: 380px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(37,99,168,0.18) 0%, transparent 65%);
          pointer-events: none; z-index: 0;
        }
        .lp-glow-bot {
          position: absolute;
          bottom: -100px; left: -80px;
          width: 340px; height: 340px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(20,70,130,0.22) 0%, transparent 65%);
          pointer-events: none; z-index: 0;
        }

        .lp-bar {
          position: absolute;
          right: 0; top: 0; bottom: 0;
          width: 1px;
          background: linear-gradient(180deg,
            transparent 0%,
            rgba(37,99,168,0.55) 25%,
            rgba(37,99,168,0.85) 50%,
            rgba(37,99,168,0.55) 75%,
            transparent 100%);
          z-index: 1;
        }

        .lp-ring {
          position: absolute;
          border-radius: 50%;
          pointer-events: none; z-index: 0;
        }
        .lp-ring-1 {
          width: 540px; height: 540px;
          border: 1px solid rgba(37,99,168,0.12);
          bottom: -250px; left: -210px;
        }
        .lp-ring-2 {
          width: 310px; height: 310px;
          border: 1px solid rgba(37,99,168,0.18);
          bottom: -135px; left: -105px;
        }

        .lp-tl, .lp-br {
          position: absolute;
          width: 20px; height: 20px;
          pointer-events: none; z-index: 2;
        }
        .lp-tl { top: 28px; left: 28px; border-top: 1.5px solid rgba(37,99,168,0.65); border-left: 1.5px solid rgba(37,99,168,0.65); }
        .lp-br { bottom: 28px; right: 10px; border-bottom: 1.5px solid rgba(37,99,168,0.45); border-right: 1.5px solid rgba(37,99,168,0.45); }

        /* Logo */
        .lp-logo {
          display: flex;
          align-items: center;
          gap: 13px;
          position: relative;
          z-index: 2;
        }
        .lp-logo-box {
          width: 42px; height: 42px;
          background: var(--blue);
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 0 0 1px rgba(37,99,168,0.5), 0 4px 20px rgba(37,99,168,0.40);
        }
        /* HIGH CONTRAST logo label */
        .lp-logo-label {
          font-size: 0.68rem;
          font-weight: 700;
          color: rgba(255,255,255,0.90);
          letter-spacing: 2.5px;
          text-transform: uppercase;
        }

        /* Hero */
        .lp-hero { position: relative; z-index: 2; }

        /* HIGH CONTRAST eyebrow */
        .lp-eyebrow {
          display: flex;
          align-items: center;
          gap: 10px;
          font-family: 'DM Mono', monospace;
          font-size: 0.64rem;
          color: #7CB8FF;
          letter-spacing: 3.5px;
          text-transform: uppercase;
          margin-bottom: 20px;
          font-weight: 500;
        }
        .lp-eyebrow::before {
          content: '';
          width: 20px; height: 1.5px;
          background: #7CB8FF;
          border-radius: 2px;
          flex-shrink: 0;
        }

        /* ONE-LINE title — 3 crisp colours */
        .lp-title {
          font-family: 'Bebas Neue', sans-serif;
          font-size: clamp(3.2rem, 4.4vw, 4.8rem);
          line-height: 1;
          letter-spacing: 4px;
          white-space: nowrap;
          margin-bottom: 28px;
          display: flex;
          align-items: baseline;
          gap: 0.20em;
          position: relative;
          z-index: 2;
        }
        /* Full bright white — no dimming */
        .lp-t-white {
          color: #FFFFFF;
          text-shadow: 0 0 30px rgba(255,255,255,0.15);
        }
        /* Bright vivid blue */
        .lp-t-blue {
          color: #5AABFF;
          text-shadow: 0 0 20px rgba(90,171,255,0.30);
        }
        /* Light steel — still clearly readable */
        .lp-t-grey {
          color: #A8BDD4;
        }

        /* HIGH CONTRAST description */
        .lp-desc {
          font-size: 0.82rem;
          color: rgba(200,218,235,0.82);
          line-height: 1.95;
          max-width: 290px;
          font-weight: 400;
          letter-spacing: 0.1px;
        }

        /* Bottom strip */
        .lp-strip {
          position: relative;
          z-index: 2;
          border-top: 1px solid rgba(37,99,168,0.30);
          padding-top: 20px;
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .lp-strip-badge {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 14px;
          border-radius: 7px;
          border: 1px solid rgba(37,99,168,0.35);
          background: rgba(37,99,168,0.14);
        }
        .lp-strip-dot {
          width: 6px; height: 6px;
          border-radius: 50%;
          background: #5AABFF;
          box-shadow: 0 0 6px rgba(90,171,255,0.8);
        }
        /* HIGH CONTRAST strip text */
        .lp-strip-text {
          font-family: 'DM Mono', monospace;
          font-size: 0.62rem;
          color: rgba(200,218,235,0.80);
          letter-spacing: 1.5px;
          text-transform: uppercase;
          font-weight: 500;
        }

        /* ═══ RIGHT PANEL ═══ */
        .lp-right {
          flex: 1;
          background: var(--white);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 60px 80px;
          position: relative;
          overflow: hidden;
        }
        .lp-right::before {
          content: '';
          position: absolute;
          top: -90px; right: -90px;
          width: 260px; height: 260px;
          border-radius: 50%;
          background: var(--blue);
          opacity: 0.04;
          pointer-events: none;
        }
        .lp-right::after {
          content: '';
          position: absolute;
          bottom: -120px; left: -120px;
          width: 330px; height: 330px;
          border-radius: 50%;
          border: 55px solid var(--grey-200);
          pointer-events: none;
        }
        .lp-right-bar {
          position: absolute;
          top: 0; left: 0; right: 0;
          height: 3px;
          background: linear-gradient(90deg, var(--blue) 0%, rgba(37,99,168,0.15) 55%, transparent 100%);
        }

        .lp-form-wrap {
          width: 100%;
          max-width: 355px;
          position: relative;
          z-index: 1;
        }

        .lp-form-eyebrow {
          display: flex;
          align-items: center;
          gap: 8px;
          font-family: 'DM Mono', monospace;
          font-size: 0.6rem;
          color: var(--blue);
          letter-spacing: 3px;
          text-transform: uppercase;
          margin-bottom: 10px;
        }
        .lp-form-eyebrow::before { content: ''; width: 14px; height: 1.5px; background: var(--blue); }

        .lp-form-h {
          font-size: 1.85rem;
          font-weight: 600;
          color: var(--ink);
          letter-spacing: -0.6px;
          line-height: 1.1;
          margin-bottom: 6px;
        }
        .lp-form-sub {
          font-size: 0.78rem;
          color: var(--grey-400);
          font-weight: 300;
          font-style: italic;
          margin-bottom: 30px;
        }

        .lp-rule {
          height: 1px;
          background: linear-gradient(90deg, var(--blue) 28px, var(--grey-200) 28px);
          margin-bottom: 30px;
        }

        .lp-error {
          border-left: 3px solid #DC2626;
          background: #FEF2F2;
          color: #B91C1C;
          padding: 10px 14px;
          font-size: 0.78rem;
          border-radius: 0 6px 6px 0;
          margin-bottom: 20px;
          font-weight: 500;
        }

        .lp-field { margin-bottom: 18px; }
        .lp-field-label {
          display: block;
          font-size: 0.59rem;
          font-weight: 700;
          color: var(--grey-600);
          letter-spacing: 2px;
          text-transform: uppercase;
          margin-bottom: 8px;
        }
        .lp-input {
          width: 100%;
          background: var(--grey-100);
          border: 1.5px solid var(--grey-200);
          border-radius: 9px;
          padding: 13px 16px;
          font-size: 0.88rem;
          font-family: 'DM Sans', sans-serif;
          color: var(--ink);
          outline: none;
          transition: border-color 0.18s, box-shadow 0.18s, background 0.18s;
          -webkit-appearance: none;
        }
        .lp-input::placeholder { color: #C8C8C8; font-style: italic; }
        .lp-input:focus {
          border-color: var(--blue);
          background: var(--white);
          box-shadow: 0 0 0 4px rgba(37,99,168,0.09);
        }
        .lp-input:disabled { opacity: 0.45; cursor: not-allowed; }

        .lp-opts {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin: 6px 0 26px;
        }
        .lp-remember {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 0.78rem;
          color: var(--grey-600);
          cursor: pointer;
          user-select: none;
        }
        .lp-remember input[type="checkbox"] {
          width: 14px; height: 14px;
          accent-color: var(--blue);
          cursor: pointer;
        }
        .lp-forgot {
          font-size: 0.78rem;
          font-weight: 600;
          color: var(--blue);
          text-decoration: none;
          opacity: 0.85;
          transition: opacity 0.15s;
        }
        .lp-forgot:hover { opacity: 1; }

        .lp-btn {
          width: 100%;
          background: var(--grey-800);
          color: var(--white);
          border: 1.5px solid transparent;
          border-radius: 9px;
          padding: 14px;
          font-family: 'DM Sans', sans-serif;
          font-size: 0.74rem;
          font-weight: 700;
          letter-spacing: 3px;
          text-transform: uppercase;
          cursor: pointer;
          transition: background 0.2s, border-color 0.2s, transform 0.12s, box-shadow 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }
        .lp-btn:hover:not(:disabled) {
          background: var(--blue);
          border-color: var(--blue);
          transform: translateY(-2px);
          box-shadow: 0 8px 28px var(--blue-glow);
        }
        .lp-btn:active:not(:disabled) { transform: translateY(0); }
        .lp-btn:disabled { background: var(--grey-200); color: var(--grey-400); cursor: not-allowed; }

        @keyframes spin { to { transform: rotate(360deg); } }
        .lp-spinner {
          width: 13px; height: 13px;
          border: 2px solid rgba(255,255,255,0.3);
          border-top-color: var(--white);
          border-radius: 50%;
          animation: spin 0.7s linear infinite;
        }

        .lp-foot { display: flex; align-items: center; gap: 12px; margin-top: 26px; }
        .lp-foot-line { flex: 1; height: 1px; background: var(--grey-200); }
        .lp-foot-text {
          font-family: 'DM Mono', monospace;
          font-size: 0.58rem;
          color: var(--grey-400);
          text-transform: uppercase;
          letter-spacing: 1.5px;
          white-space: nowrap;
        }

        @media (max-width: 820px) {
          .lp { flex-direction: column; }
          .lp-left { width: 100%; min-height: auto; padding: 36px 32px 44px; }
          .lp-title { font-size: 2.6rem; }
          .lp-strip { display: none; }
          .lp-right { padding: 52px 32px; }
          .lp-bar { display: none; }
        }
      `}</style>

      <div className="lp">

        {/* ── LEFT PANEL ── */}
        <div className="lp-left">
          <div className="lp-dots" />
          <div className="lp-glow-top" />
          <div className="lp-glow-bot" />
          <div className="lp-bar" />
          <div className="lp-ring lp-ring-1" />
          <div className="lp-ring lp-ring-2" />
          <div className="lp-tl" />
          <div className="lp-br" />

          <div className="lp-logo">
            <div className="lp-logo-box"><CarLogo /></div>
            <span className="lp-logo-label">Grand Auto Tech</span>
          </div>

          <div className="lp-hero">
            <div className="lp-eyebrow">Management System</div>
            <h1 className="lp-title">
              <span className="lp-t-white">GRAND</span>
              <span className="lp-t-blue">AUTO</span>
              <span className="lp-t-grey">TECH</span>
            </h1>
            <p className="lp-desc">
              Streamline job cards, technician tasks, invoicing and multi-branch operations — all from one unified platform.
            </p>
          </div>

          <div className="lp-strip">
            <div className="lp-strip-badge">
              <div className="lp-strip-dot" />
              <span className="lp-strip-text">System Online</span>
            </div>
            <div className="lp-strip-badge">
              <div className="lp-strip-dot" />
              <span className="lp-strip-text">Sri Lanka</span>
            </div>
          </div>
        </div>

        {/* ── RIGHT PANEL ── */}
        <div className="lp-right">
          <div className="lp-right-bar" />
          <div className="lp-form-wrap">

            <div className="lp-form-eyebrow">Portal Access</div>
            <h2 className="lp-form-h">Welcome back</h2>
            <p className="lp-form-sub">Sign in to continue to your dashboard</p>
            <div className="lp-rule" />

            {error && <div className="lp-error">{error}</div>}

            <form onSubmit={handleSubmit}>
              <div className="lp-field">
                <label className="lp-field-label">Email address</label>
                <input
                  type="email"
                  className="lp-input"
                  placeholder="you@grandautotech.lk"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>

              <div className="lp-field">
                <label className="lp-field-label">Password</label>
                <input
                  type="password"
                  className="lp-input"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>

              <div className="lp-opts">
                <label className="lp-remember">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                  />
                  Remember me
                </label>
               
              </div>

              <button type="submit" className="lp-btn" disabled={loading}>
                {loading && <span className="lp-spinner" />}
                {loading ? 'Signing in...' : 'Sign In'}
              </button>
            </form>

            <div className="lp-foot">
              <div className="lp-foot-line" />
              <span className="lp-foot-text">Grand Auto Tech &copy; 2026</span>
              <div className="lp-foot-line" />
            </div>

          </div>
        </div>
      </div>
    </>
  )
}

export default Login