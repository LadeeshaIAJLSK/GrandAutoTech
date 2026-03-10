import { useState } from 'react'
import axiosClient from '../api/axios'
import { FaAward } from 'react-icons/fa'

function Login({ onLoginSuccess }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [rememberMe, setRememberMe] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const response = await axiosClient.post('/login', {
        email,
        password
      })

      localStorage.setItem('token', response.data.token)
      localStorage.setItem('user', JSON.stringify(response.data.user))

      onLoginSuccess(response.data.user)

    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;600;700;800&family=Open+Sans:wght@400;500;600&display=swap');

        .login-page {
          min-height: 100vh;
          background-color: #FFF5EC;
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: 'Open Sans', sans-serif;
          position: relative;
          overflow: hidden;
          padding: 20px;
        }

        /* Decorative background shapes */
        .bg-shape {
          position: absolute;
          border-radius: 20px;
        }
        .bg-shape-1 {
          width: 120px; height: 120px;
          background: #F97316;
          bottom: 80px; left: 40px;
          border-radius: 20px;
          transform: rotate(15deg);
        }
        .bg-shape-2 {
          width: 90px; height: 90px;
          background: #FDBA74;
          bottom: 160px; left: 20px;
          border-radius: 50%;
          opacity: 0.6;
        }
        .bg-shape-3 {
          width: 140px; height: 80px;
          background: #FDBA74;
          top: 60px; left: 60px;
          border-radius: 20px;
          transform: rotate(-10deg);
          opacity: 0.7;
        }
        .bg-shape-4 {
          width: 100px; height: 100px;
          background: #FDBA74;
          top: 40px; right: 80px;
          border-radius: 16px;
          transform: rotate(20deg);
          opacity: 0.6;
        }
        .bg-shape-5 {
          width: 160px; height: 160px;
          background: #FDBA74;
          bottom: 40px; right: 60px;
          border-radius: 50%;
          opacity: 0.5;
        }
        .bg-shape-6 {
          width: 30px; height: 30px;
          background: #F97316;
          bottom: 100px; right: 80px;
          border-radius: 50%;
        }

        .login-card {
          background: white;
          border-radius: 20px;
          box-shadow: 0 20px 60px rgba(0,0,0,0.12);
          width: 100%;
          max-width: 860px;
          overflow: hidden;
          position: relative;
          z-index: 10;
        }

        /* Orange header banner */
        .card-header {
          background: #F97316;
          padding: 28px 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 14px;
          border-radius: 20px 20px 0 0;
        }

        .header-icon {
          width: 52px;
          height: 52px;
          background: white;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 26px;
        }

        .header-title {
          font-family: 'Montserrat', sans-serif;
          font-size: 2rem;
          font-weight: 800;
          color: white;
          letter-spacing: -0.5px;
          font-style: italic;
        }

        /* Card body: two columns */
        .card-body {
          display: grid;
          grid-template-columns: 1fr 1fr;
          min-height: 300px;
        }

        /* Left decorative panel */
        .card-left {
          padding: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-right: 1px solid #F3F4F6;
          position: relative;
          overflow: hidden;
        }

        .car-illustration {
          width: 100%;
          max-width: 260px;
          object-fit: contain;
        }

        /* Fallback decorative when no image */
        .illustration-fallback {
          text-align: center;
          color: #F97316;
        }
        .illustration-fallback .car-emoji {
          font-size: 80px;
          display: block;
          margin-bottom: 16px;
          filter: drop-shadow(2px 4px 6px rgba(249,115,22,0.3));
        }
        .illustration-fallback p {
          font-family: 'Montserrat', sans-serif;
          font-weight: 700;
          font-size: 0.9rem;
          color: #9CA3AF;
          text-transform: uppercase;
          letter-spacing: 1px;
        }

        /* Right form panel */
        .card-right {
          padding: 40px 48px;
        }

        .form-group {
          margin-bottom: 20px;
        }

        .form-label {
          display: block;
          font-size: 0.8rem;
          font-weight: 600;
          color: #6B7280;
          margin-bottom: 6px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .form-input {
          width: 100%;
          border: none;
          border-bottom: 1.5px solid #D1D5DB;
          padding: 10px 0;
          font-size: 0.95rem;
          font-family: 'Open Sans', sans-serif;
          color: #111827;
          background: transparent;
          outline: none;
          transition: border-color 0.2s;
          box-sizing: border-box;
        }

        .form-input::placeholder {
          color: #C4C4C4;
        }

        .form-input:focus {
          border-bottom-color: #F97316;
        }

        .form-input:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .form-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin: 20px 0 28px;
        }

        .remember-label {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 0.85rem;
          color: #6B7280;
          cursor: pointer;
          user-select: none;
        }

        .remember-label input[type="checkbox"] {
          width: 15px;
          height: 15px;
          accent-color: #F97316;
          cursor: pointer;
        }

        .forgot-link {
          font-size: 0.85rem;
          color: #6B7280;
          text-decoration: none;
          font-weight: 500;
          transition: color 0.2s;
        }

        .forgot-link:hover {
          color: #F97316;
        }

        .btn-login {
          width: 100%;
          background: #F97316;
          color: white;
          border: none;
          border-radius: 50px;
          padding: 14px;
          font-family: 'Montserrat', sans-serif;
          font-size: 0.95rem;
          font-weight: 700;
          letter-spacing: 1.5px;
          text-transform: uppercase;
          cursor: pointer;
          transition: background 0.2s, transform 0.1s, box-shadow 0.2s;
          box-shadow: 0 4px 16px rgba(249,115,22,0.4);
        }

        .btn-login:hover:not(:disabled) {
          background: #EA6C0A;
          box-shadow: 0 6px 20px rgba(249,115,22,0.5);
          transform: translateY(-1px);
        }

        .btn-login:active:not(:disabled) {
          transform: translateY(0);
        }

        .btn-login:disabled {
          background: #D1D5DB;
          cursor: not-allowed;
          box-shadow: none;
        }

        .error-box {
          background: #FEF2F2;
          border: 1px solid #FECACA;
          color: #DC2626;
          padding: 10px 14px;
          border-radius: 8px;
          font-size: 0.83rem;
          margin-bottom: 16px;
        }

        /* Test accounts section */
        .test-accounts {
          margin-top: 24px;
          padding: 14px;
          background: #FFF7ED;
          border-radius: 10px;
          border: 1px solid #FED7AA;
        }

        .test-accounts h4 {
          font-size: 0.75rem;
          font-weight: 700;
          color: #92400E;
          margin: 0 0 8px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .test-accounts ul {
          list-style: none;
          padding: 0;
          margin: 0;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .test-accounts li {
          font-size: 0.75rem;
          color: #78350F;
        }

        .test-accounts strong {
          color: #92400E;
        }

        @media (max-width: 640px) {
          .card-body {
            grid-template-columns: 1fr;
          }
          .card-left {
            display: none;
          }
          .card-right {
            padding: 30px 28px;
          }
          .header-title {
            font-size: 1.5rem;
          }
        }
      `}</style>

      <div className="login-page">
        {/* Background decorative shapes */}
        <div className="bg-shape bg-shape-1"></div>
        <div className="bg-shape bg-shape-2"></div>
        <div className="bg-shape bg-shape-3"></div>
        <div className="bg-shape bg-shape-4"></div>
        <div className="bg-shape bg-shape-5"></div>
        <div className="bg-shape bg-shape-6"></div>

        <div className="login-card">
          {/* Orange header */}
          <div className="card-header">
            <div className="header-icon">
                <FaAward size={28} color="#F97316" />
              </div>
            <h1 className="header-title">Grand Auto Tech</h1>
          </div>

          <div className="card-body">
            {/* Left illustration panel */}
            <div className="card-left">
              {/* Replace src with your actual image path, e.g. /images/car-illustration.png */}
              <img
                src="/images/login.jpg"
                alt="Grand Auto Tech"
                className="car-illustration"
                onError={(e) => {
                  e.target.style.display = 'none'
                  e.target.nextSibling.style.display = 'block'
                }}
              />
              <div className="illustration-fallback" style={{ display: 'none' }}>
                <span className="car-emoji">🚗</span>
                <p>Vehicle Repair Shop<br />Management System</p>
              </div>
            </div>

            {/* Right form panel */}
            <div className="card-right">
              {error && (
                <div className="error-box">❌ {error}</div>
              )}

              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label className="form-label">Email</label>
                  <input
                    type="email"
                    className="form-input"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={loading}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Password</label>
                  <input
                    type="password"
                    className="form-input"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={loading}
                  />
                </div>

                <div className="form-row">
                  <label className="remember-label">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                    />
                    Remember me
                  </label>
                  <a href="#" className="forgot-link">Forgot Password?</a>
                </div>

                <button type="submit" className="btn-login" disabled={loading}>
                  {loading ? 'Logging in...' : 'LOG IN'}
                </button>
              </form>

              {/* Test Accounts */}
              <div className="test-accounts">
                <h4>🧪 Test Accounts (password: password123)</h4>
                <ul>
                  <li><strong>Super Admin:</strong> admin@grandautotech.lk</li>
                  <li><strong>Branch Admin:</strong> colombo.manager@grandautotech.lk</li>
                  <li><strong>Accountant:</strong> accountant@grandautotech.lk</li>
                  <li><strong>Technician:</strong> technician@grandautotech.lk</li>
                  <li><strong>Support:</strong> support@grandautotech.lk</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default Login