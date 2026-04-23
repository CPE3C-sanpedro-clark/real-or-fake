import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Layout from "../assets/components/Layout";
import "../styles/auth.css";

const API_BASE = import.meta.env.VITE_API_BASE || '';

export default function LoginPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "", mfaCode: "" });
  const [status, setStatus] = useState({ type: "", message: "" });
  const [loading, setLoading] = useState(false);
  // State for 2FA flow
  const [needs2FA, setNeeds2FA] = useState(false);
  const [tempEmail, setTempEmail] = useState("");
  const [tempPassword, setTempPassword] = useState("");

  const handleChange = (event) => {
    setForm({ ...form, [event.target.name]: event.target.value });
  };

  // Handler for standard login submission
  const handleLogin = async (event) => {
    event.preventDefault();
    setStatus({ type: "", message: "" });

    if (!form.email.trim() || !form.password.trim()) {
      setStatus({ type: "error", message: "Please enter both email and password." });
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${API_BASE}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: form.email.trim().toLowerCase(),
          password: form.password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Check if 2FA is required (HTTP 403)
        if (response.status === 403 && data.error === '2FA required') {
          setNeeds2FA(true);
          setTempEmail(form.email.trim().toLowerCase());
          setTempPassword(form.password);
          setStatus({ type: "", message: "" });
          return;
        }
        throw new Error(data.error || "Login failed. Please try again.");
      }

      // Standard login successful (no 2FA enabled)
      localStorage.setItem("authToken", data.token);
      localStorage.setItem("authUser", JSON.stringify(data.user));
      if (data.sessionToken) {
          localStorage.setItem("sessionToken", data.sessionToken);
      }

      setStatus({ type: "success", message: "Login successful! Redirecting..." });
      setTimeout(() => navigate('/landing'), 900);
    } catch (error) {
      setStatus({ type: "error", message: error.message });
    } finally {
      setLoading(false);
    }
  };

  // Handler for 2FA code submission
  const handleTwoFactorLogin = async (event) => {
    event.preventDefault();
    setStatus({ type: "", message: "" });

    if (!form.mfaCode.trim() || !/^\d{6}$/.test(form.mfaCode.trim())) {
      setStatus({ type: "error", message: "Please enter a valid 6-digit verification code." });
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${API_BASE}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: tempEmail,
          password: tempPassword,
          mfaCode: form.mfaCode.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "2FA verification failed. Please try again.");
      }

      // 2FA successful
      localStorage.setItem("authToken", data.token);
      localStorage.setItem("authUser", JSON.stringify(data.user));

      setStatus({ type: "success", message: "Login successful! Redirecting..." });
      setTimeout(() => navigate('/landing'), 900);
    } catch (error) {
      setStatus({ type: "error", message: error.message });
    } finally {
      setLoading(false);
    }
  };

  // Render Login Form or 2FA Code Form
  const renderLoginOrTwoFaForm = () => {
    if (needs2FA) {
      return (
        <form className="auth-form" onSubmit={handleTwoFactorLogin}>
          <div className="auth-field">
            <label className="auth-label" htmlFor="mfaCode">Two-Factor Authentication Code</label>
            <input
              id="mfaCode"
              name="mfaCode"
              type="text"
              className="auth-input"
              placeholder="Enter 6-digit PIN"
              value={form.mfaCode}
              onChange={handleChange}
              maxLength="6"
              pattern="\d*"
              autoFocus
              required
            />
            <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.45)', marginTop: '8px' }}>
              Enter the 6-digit PIN you set up for 2FA
            </p>
          </div>
          
          {status.message && (
            <div className={`auth-alert ${status.type}`}>{status.message}</div>
          )}
          
          <button className="auth-button" type="submit" disabled={loading}>
            {loading ? "Verifying..." : "Verify & Login"}
          </button>
          
          <button 
            type="button" 
            className="auth-button" 
            onClick={() => {
              setNeeds2FA(false);
              setForm({ ...form, mfaCode: "" });
              setStatus({ type: "", message: "" });
            }}
            style={{ background: 'rgba(255,255,255,0.1)', marginTop: '10px' }}
          >
            Back to Login
          </button>
        </form>
      );
    } else {
      return (
        <form className="auth-form" onSubmit={handleLogin}>
          <div className="auth-field">
            <label className="auth-label" htmlFor="email">Email</label>
            <input
              id="email"
              name="email"
              type="email"
              className="auth-input"
              placeholder="Enter your email"
              value={form.email}
              onChange={handleChange}
              required
            />
          </div>

          <div className="auth-field">
            <label className="auth-label" htmlFor="password">Password</label>
            <input
              id="password"
              name="password"
              type="password"
              className="auth-input"
              placeholder="Enter your password"
              value={form.password}
              onChange={handleChange}
              required
            />
          </div>

          {status.message && (
            <div className={`auth-alert ${status.type}`}>{status.message}</div>
          )}

          <button className="auth-button" type="submit" disabled={loading}>
            {loading ? "Signing in..." : "Login"}
          </button>
        </form>
      );
    }
  };

  return (
    <Layout hideSidebar hideTopbar hideFooter>
      <div className="auth-page">
        <div className="auth-card">
          <div className="auth-header">
            <h1 className="auth-title">
              {needs2FA ? "Two-Factor Authentication" : "Login"}
            </h1>
            <p className="auth-text">
              {needs2FA 
                ? "Enter your 6-digit verification code to continue." 
                : "Access your VeriFake account and continue verifying news."}
            </p>
          </div>

          {renderLoginOrTwoFaForm()}
          
          {!needs2FA && (
            <p className="auth-switch">
              Don't have an account? <Link to="/signup">Sign up</Link>
            </p>
          )}
        </div>
      </div>
    </Layout>
  );
}