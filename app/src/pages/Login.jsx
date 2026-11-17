import React, { useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { apiClient } from "@/api/client";
import { Eye, EyeOff, Loader2, ShieldCheck, Mail, ChevronRight, ArrowLeft } from "lucide-react";

const VIEWS = { LANDING: 0, EMAIL: 1, PASSWORD: 2 };

const slideVariants = {
  enter: (dir) => ({ x: dir > 0 ? 60 : -60, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir) => ({ x: dir > 0 ? -60 : 60, opacity: 0 }),
};

const ACCENT = "#E84B1D";

export default function Login() {
  const [view, setView] = useState(VIEWS.LANDING);
  const [direction, setDirection] = useState(1);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const goTo = (next) => {
    setDirection(next > view ? 1 : -1);
    setError("");
    setView(next);
  };

  const handleEmailContinue = (e) => {
    e.preventDefault();
    if (!email || !email.includes("@")) { setError("Please enter a valid email address"); return; }
    goTo(VIEWS.PASSWORD);
  };

  const handleSignIn = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await apiClient.auth.loginViaEmailPassword(email, password);
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
      {/* Top wave section — 40% height */}
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

      {/* Bottom form section */}
      <div className="flex-1 overflow-y-auto" style={{ background: "#1a0500", WebkitOverflowScrolling: "touch" }}>
        <div
          className="mx-auto w-full"
          style={{ maxWidth: 400, padding: "16px 28px calc(env(safe-area-inset-bottom) + 32px)", overflow: "hidden" }}
        >
          <AnimatePresence initial={false} custom={direction} mode="popLayout">

            {/* LANDING */}
            {view === VIEWS.LANDING && (
              <motion.div key="landing" custom={direction} variants={slideVariants}
                initial="enter" animate="center" exit="exit"
                transition={{ type: "spring", stiffness: 340, damping: 32 }}
              >
                <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                  <button
                    onClick={() => goTo(VIEWS.EMAIL)}
                    className="active:scale-[0.98] transition-transform"
                    style={{
                      width: "100%", height: 52, borderRadius: 14,
                      background: "linear-gradient(135deg, #E84B1D, #c43a10)",
                      display: "flex", alignItems: "center", gap: 12, padding: "0 18px",
                      fontWeight: 700, fontSize: "15px", color: "#fff", border: "none", cursor: "pointer",
                      boxShadow: "0 8px 24px rgba(232,75,29,0.4)",
                    }}
                  >
                    <Mail className="w-5 h-5" />
                    <span>Continue with Email</span>
                    <ChevronRight className="w-5 h-5 ml-auto opacity-70" />
                  </button>
                </div>

                <p style={{ textAlign: "center", fontSize: "12px", marginTop: "20px", color: "rgba(255,255,255,0.3)" }}>
                  Safe, encrypted &amp; confidential
                </p>

                <p style={{ textAlign: "center", fontSize: "13px", marginTop: "12px", color: "rgba(255,255,255,0.5)" }}>
                  Don't have an account?{" "}
                  <Link to="/beka/register" style={{ color: ACCENT, fontWeight: 600 }}>Register</Link>
                </p>
              </motion.div>
            )}

            {/* EMAIL */}
            {view === VIEWS.EMAIL && (
              <motion.div key="email" custom={direction} variants={slideVariants}
                initial="enter" animate="center" exit="exit"
                transition={{ type: "spring", stiffness: 340, damping: 32 }}
              >
                <button onClick={() => goTo(VIEWS.LANDING)}
                  className="flex items-center gap-1.5 mb-6 text-sm font-medium"
                  style={{ color: "rgba(255,255,255,0.45)", background: "none", border: "none", cursor: "pointer" }}
                >
                  <ArrowLeft className="w-4 h-4" /> Back
                </button>
                <h2 className="text-white font-bold text-xl mb-1">What's your email?</h2>
                <p className="text-sm mb-6" style={{ color: "rgba(255,255,255,0.4)" }}>We'll use this to sign you in.</p>
                <form onSubmit={handleEmailContinue} className="space-y-3">
                  <input
                    type="email" autoFocus autoComplete="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); setError(""); }}
                    style={inputStyle}
                    onFocus={(e) => e.currentTarget.style.borderColor = ACCENT}
                    onBlur={(e) => e.currentTarget.style.borderColor = "rgba(255,255,255,0.12)"}
                  />
                  {error && <p className="text-red-400 text-xs pl-1">{error}</p>}
                  <button type="submit"
                    className="w-full font-bold text-sm text-white active:scale-[0.98] transition-transform"
                    style={{ height: 52, borderRadius: 14, background: "linear-gradient(135deg, #E84B1D, #c43a10)", border: "none", cursor: "pointer", boxShadow: "0 8px 24px rgba(232,75,29,0.4)" }}
                  >
                    Continue
                  </button>
                </form>
              </motion.div>
            )}

            {/* PASSWORD */}
            {view === VIEWS.PASSWORD && (
              <motion.div key="password" custom={direction} variants={slideVariants}
                initial="enter" animate="center" exit="exit"
                transition={{ type: "spring", stiffness: 340, damping: 32 }}
              >
                <button onClick={() => goTo(VIEWS.EMAIL)}
                  className="flex items-center gap-1.5 mb-6 text-sm font-medium"
                  style={{ color: "rgba(255,255,255,0.45)", background: "none", border: "none", cursor: "pointer" }}
                >
                  <ArrowLeft className="w-4 h-4" /> Back
                </button>
                <h2 className="text-white font-bold text-xl mb-1">Enter your password</h2>
                <p className="text-sm mb-1 truncate" style={{ color: "rgba(255,255,255,0.4)" }}>{email}</p>
                <div className="flex justify-end mb-5">
                  <Link to="/beka/forgot-password" className="text-xs font-semibold" style={{ color: ACCENT }}>
                    Forgot password?
                  </Link>
                </div>
                <form onSubmit={handleSignIn} className="space-y-3">
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"} autoFocus
                      autoComplete="current-password" placeholder="••••••••"
                      value={password}
                      onChange={(e) => { setPassword(e.target.value); setError(""); }}
                      style={{ ...inputStyle, paddingRight: 44 }}
                      onFocus={(e) => e.currentTarget.style.borderColor = ACCENT}
                      onBlur={(e) => e.currentTarget.style.borderColor = "rgba(255,255,255,0.12)"}
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)}
                      aria-label={showPassword ? "Hide password" : "Show password"}
                      className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
                      style={{ color: "rgba(255,255,255,0.35)", background: "none", border: "none", cursor: "pointer" }}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {error && <p className="text-red-400 text-xs pl-1">{error}</p>}
                  <button type="submit" disabled={loading || !password}
                    className="w-full font-bold text-sm text-white active:scale-[0.98] transition-transform disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2"
                    style={{ height: 52, borderRadius: 14, background: "linear-gradient(135deg, #E84B1D, #c43a10)", border: "none", cursor: "pointer", boxShadow: "0 8px 24px rgba(232,75,29,0.4)" }}
                  >
                    {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Signing in...</> : "Sign In"}
                  </button>
                </form>
                <p style={{ textAlign: "center", fontSize: "13px", marginTop: "20px", color: "rgba(255,255,255,0.5)" }}>
                  Don't have an account?{" "}
                  <Link to="/beka/register" style={{ color: ACCENT, fontWeight: 600 }}>Register</Link>
                </p>
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}