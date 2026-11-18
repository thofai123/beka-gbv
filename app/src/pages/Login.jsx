import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { apiClient } from "@/api/client";
import { Eye, EyeOff, Loader2, ShieldCheck } from "lucide-react";

const ACCENT = "#E84B1D";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Sync with Google Password Manager / browser Credential Management API on mount
  useEffect(() => {
    let active = true;
    async function checkSavedCredentials() {
      try {
        if (typeof window !== "undefined" && navigator.credentials && navigator.credentials.get) {
          const cred = await navigator.credentials.get({
            password: true,
            mediation: "optional",
          });
          if (active && cred && cred.type === "password") {
            if (cred.id) setEmail(cred.id);
            if (cred.password) setPassword(cred.password);
          }
        }
      } catch {
        // Browser native autofill still handles <input autoComplete="username" / "current-password">
      }
    }
    checkSavedCredentials();
    return () => { active = false; };
  }, []);

  const handleSignIn = async (e) => {
    e.preventDefault();
    setError("");
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail || !normalizedEmail.includes("@")) {
      setError("Please enter a valid email address");
      return;
    }
    if (!password) {
      setError("Please enter your password");
      return;
    }
    setLoading(true);
    try {
      const user = await apiClient.auth.loginViaEmailPassword(normalizedEmail, password);
      try {
        if (typeof window !== "undefined" && window.PasswordCredential && navigator.credentials) {
          const cred = new window.PasswordCredential({
            id: normalizedEmail,
            password,
            name: user?.full_name || normalizedEmail,
          });
          await navigator.credentials.store(cred);
        }
      } catch {
        // Ignore if unsupported
      }
      window.location.href = "/beka/";
    } catch (err) {
      setError(err.message || "Invalid email or password");
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = {
    width: "100%",
    height: "48px",
    borderRadius: "12px",
    background: "rgba(255,255,255,0.07)",
    border: "1px solid rgba(255,255,255,0.12)",
    color: "#fff",
    fontSize: "15px",
    padding: "0 16px",
    outline: "none",
    transition: "border-color 0.2s",
    boxSizing: "border-box",
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        background: "linear-gradient(160deg, #1a0500, #3d0f00, #1a0500)",
      }}
    >
      {/* Top wave section */}
      <div className="relative flex-shrink-0" style={{ height: "22vh", minHeight: 160 }}>
        <div
          className="absolute inset-0 flex flex-col items-center justify-center"
          style={{ background: "linear-gradient(135deg, #c43a10 0%, #E84B1D 100%)", paddingBottom: 24 }}
        >
          <ShieldCheck size={32} color="#fff" strokeWidth={1.8} />
          <h1 style={{ color: "#fff", fontWeight: 700, fontSize: "19px", marginTop: "10px", letterSpacing: "-0.3px" }}>
            Welcome to BEKA
          </h1>
          <p style={{ color: "rgba(255,255,255,0.75)", fontSize: "12px", marginTop: "3px" }}>
            Your safety, your power
          </p>
        </div>

        {/* Layered wave blending into the dark form below */}
        <svg
          className="absolute bottom-0 left-0 w-full"
          viewBox="0 0 375 80"
          preserveAspectRatio="none"
          style={{ height: 80, display: "block" }}
          aria-hidden="true"
        >
          <path
            d="M0 40 C 70 80, 150 80, 210 50 C 270 20, 330 20, 375 45 L 375 80 L 0 80 Z"
            fill="#1a0500"
            opacity="0.5"
          />
          <path
            d="M0 55 C 80 90, 160 70, 230 55 C 300 40, 340 50, 375 60 L 375 80 L 0 80 Z"
            fill="#1a0500"
          />
        </svg>
      </div>

      {/* Bottom unified credential form section (Google Password Manager compatible) */}
      <div className="flex-1 overflow-y-auto" style={{ background: "#1a0500", WebkitOverflowScrolling: "touch" }}>
        <div
          className="mx-auto w-full"
          style={{ maxWidth: 400, padding: "12px 28px calc(env(safe-area-inset-bottom) + 32px)" }}
        >
          <h2 className="text-white font-bold text-xl mb-1">Sign in</h2>
          <p className="text-sm mb-5" style={{ color: "rgba(255,255,255,0.45)" }}>
            Enter your registered email and password
          </p>

          <form onSubmit={handleSignIn} method="post" action="/beka/login" className="space-y-4">
            <div>
              <label
                htmlFor="login-email"
                style={{ display: "block", fontSize: "12px", color: "rgba(255,255,255,0.5)", marginBottom: "6px", fontWeight: 500 }}
              >
                Email address
              </label>
              <input
                id="login-email"
                name="email"
                type="email"
                autoComplete="username"
                inputMode="email"
                autoCapitalize="none"
                spellCheck={false}
                placeholder="you@example.com"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setError(""); }}
                style={inputStyle}
                onFocus={(e) => { e.currentTarget.style.borderColor = ACCENT; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.12)"; }}
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label
                  htmlFor="login-password"
                  style={{ fontSize: "12px", color: "rgba(255,255,255,0.5)", fontWeight: 500 }}
                >
                  Password
                </label>
                <Link to="/beka/forgot-password" className="text-xs font-semibold" style={{ color: ACCENT }}>
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <input
                  id="login-password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(""); }}
                  style={{ ...inputStyle, paddingRight: 44 }}
                  onFocus={(e) => { e.currentTarget.style.borderColor = ACCENT; }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.12)"; }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
                  style={{ color: "rgba(255,255,255,0.4)", background: "none", border: "none", cursor: "pointer" }}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && <p className="text-red-400 text-xs pl-1">{error}</p>}

            <button
              type="submit"
              disabled={loading || !email || !password}
              className="w-full font-bold text-sm text-white active:scale-[0.98] transition-transform disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2"
              style={{
                height: 52,
                borderRadius: 14,
                background: "linear-gradient(135deg, #E84B1D, #c43a10)",
                border: "none",
                cursor: "pointer",
                marginTop: "8px",
                boxShadow: "0 8px 24px rgba(232,75,29,0.4)",
              }}
            >
              {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Signing in...</> : "Sign In"}
            </button>
          </form>

          <p style={{ textAlign: "center", fontSize: "12px", marginTop: "20px", color: "rgba(255,255,255,0.3)" }}>
            Safe, encrypted &amp; confidential
          </p>

          <p style={{ textAlign: "center", fontSize: "13px", marginTop: "12px", color: "rgba(255,255,255,0.5)" }}>
            Don't have an account?{" "}
            <Link to="/beka/register" style={{ color: ACCENT, fontWeight: 600 }}>Register</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
