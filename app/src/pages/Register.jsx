import React, { useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { apiClient } from "@/api/client";
import { Eye, EyeOff, Loader2, User } from "lucide-react";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";

const STEPS = { FORM: 0, OTP: 1 };

const ACCENT = "#E84B1D";

function Field({ label, children }) {
  return (
    <div style={{ marginBottom: "18px" }}>
      <label style={{ display: "block", fontSize: "12px", color: "rgba(255,255,255,0.45)", marginBottom: "6px", fontWeight: 500 }}>
        {label}
      </label>
      {children}
    </div>
  );
}

export default function Register() {
  const [step, setStep] = useState(STEPS.FORM);
  const [username, setUsername] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");
    if (!username.trim()) { setError("Please choose a username"); return; }
    if (!name.trim()) { setError("Please enter your full name"); return; }
    if (!email || !email.includes("@")) { setError("Please enter a valid email address"); return; }
    if (password.length < 8) { setError("Password must be at least 8 characters"); return; }
    if (password !== confirmPassword) { setError("Passwords do not match"); return; }
    if (!agreed) { setError("Please agree to the Terms and Privacy Policy"); return; }
    setLoading(true);
    try {
      await apiClient.auth.register({ email, password, full_name: name });
      setStep(STEPS.OTP);
    } catch (err) {
      setError(err.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    setError("");
    setLoading(true);
    try {
      const result = await apiClient.auth.verifyOtp({ email, otpCode });
      if (result?.access_token) apiClient.auth.setToken(result.access_token);
      window.location.href = "/";
    } catch (err) {
      setError(err.message || "Invalid verification code");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    try { await apiClient.auth.resendOtp(email); } catch (err) { setError(err.message); }
  };


  const inputStyle = {
    width: "100%",
    height: "44px",
    border: "none",
    borderBottom: "1.5px solid rgba(255,255,255,0.18)",
    background: "transparent",
    padding: "0 0 4px",
    fontSize: "15px",
    color: "#fff",
    outline: "none",
    transition: "border-color 0.2s",
    boxSizing: "border-box",
  };

  const onFocus = (e) => { e.currentTarget.style.borderBottomColor = ACCENT; };
  const onBlur = (e) => { e.currentTarget.style.borderBottomColor = "rgba(255,255,255,0.18)"; };

  return (
    <div
      className="fixed inset-0 flex flex-col overflow-hidden"
      style={{ background: "linear-gradient(180deg, #1a0500 0%, #0d0200 100%)" }}
    >
      {/* Wave header */}
      <div className="relative flex-shrink-0" style={{ height: "22vh", minHeight: 160 }}>
        <div
          className="absolute inset-0"
          style={{ background: "linear-gradient(135deg, #c43a10 0%, #E84B1D 100%)" }}
        />

        {/* Tab navigation top-right */}
        <div className="absolute top-0 right-0 z-10 flex items-center gap-5" style={{ padding: "calc(env(safe-area-inset-top) + 20px) 24px 0 0" }}>
          <span style={{ color: "#fff", fontWeight: 700, fontSize: "16px", textDecoration: "underline", textUnderlineOffset: "5px" }}>
            Sign up
          </span>
          <Link to="/beka/login" style={{ color: "rgba(255,255,255,0.6)", fontWeight: 500, fontSize: "16px", textDecoration: "none" }}>
            Sign in
          </Link>
        </div>

        {/* Brand bottom-left */}
        <div className="absolute z-10" style={{ left: 24, bottom: 34 }}>
          <p style={{ color: "rgba(255,255,255,0.85)", fontSize: "13px", fontWeight: 600 }}>
            BEKA · Your safety, your power
          </p>
        </div>

        {/* Layered wave SVG at the bottom of the header */}
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

      {/* Form area */}
      <div className="flex-1 overflow-y-auto" style={{ WebkitOverflowScrolling: "touch" }}>
        <div className="mx-auto w-full" style={{ maxWidth: 420, padding: "8px 28px calc(env(safe-area-inset-bottom) + 40px)" }}>
          <AnimatePresence mode="wait">
            {step === STEPS.FORM && (
              <motion.div
                key="form"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
              >
                <h1 style={{ fontSize: "26px", fontWeight: 800, color: "#fff", marginBottom: "4px" }}>Create account</h1>
                <p style={{ fontSize: "14px", color: "rgba(255,255,255,0.45)", marginBottom: "24px" }}>Join BEKA to stay safe and supported</p>

                <form onSubmit={handleRegister}>
                  <Field label="Username">
                    <input
                      type="text"
                      autoFocus
                      autoComplete="username"
                      placeholder="yourname"
                      value={username}
                      onChange={(e) => { setUsername(e.target.value); setError(""); }}
                      style={inputStyle}
                      onFocus={onFocus}
                      onBlur={onBlur}
                    />
                  </Field>

                  <Field label="Full name">
                    <input
                      type="text"
                      autoComplete="name"
                      placeholder="Your full name"
                      value={name}
                      onChange={(e) => { setName(e.target.value); setError(""); }}
                      style={inputStyle}
                      onFocus={onFocus}
                      onBlur={onBlur}
                    />
                  </Field>

                  <Field label="Email address">
                    <input
                      type="email"
                      autoComplete="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => { setEmail(e.target.value); setError(""); }}
                      style={inputStyle}
                      onFocus={onFocus}
                      onBlur={onBlur}
                    />
                  </Field>

                  <Field label="Password">
                    <div style={{ position: "relative" }}>
                      <input
                        type={showPassword ? "text" : "password"}
                        autoComplete="new-password"
                        placeholder="Min. 8 characters"
                        value={password}
                        onChange={(e) => { setPassword(e.target.value); setError(""); }}
                        style={{ ...inputStyle, paddingRight: "36px" }}
                        onFocus={onFocus}
                        onBlur={onBlur}
                      />
                      <button type="button" onClick={() => setShowPassword(!showPassword)}
                        aria-label={showPassword ? "Hide password" : "Show password"}
                        style={{ position: "absolute", right: 0, top: "50%", transform: "translateY(-50%)", color: "rgba(255,255,255,0.45)", background: "none", border: "none", cursor: "pointer" }}>
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </Field>

                  <Field label="Confirm password">
                    <div style={{ position: "relative" }}>
                      <input
                        type={showConfirm ? "text" : "password"}
                        autoComplete="new-password"
                        placeholder="Re-enter password"
                        value={confirmPassword}
                        onChange={(e) => { setConfirmPassword(e.target.value); setError(""); }}
                        style={{ ...inputStyle, paddingRight: "36px" }}
                        onFocus={onFocus}
                        onBlur={onBlur}
                      />
                      <button type="button" onClick={() => setShowConfirm(!showConfirm)}
                        aria-label={showConfirm ? "Hide password" : "Show password"}
                        style={{ position: "absolute", right: 0, top: "50%", transform: "translateY(-50%)", color: "rgba(255,255,255,0.45)", background: "none", border: "none", cursor: "pointer" }}>
                        {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </Field>

                  {/* Terms and Privacy agreement */}
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "4px 0", marginBottom: "8px" }}>
                    <button type="button" onClick={() => { setAgreed((v) => !v); setError(""); }} aria-pressed={agreed}
                      aria-label="Agree to Terms and Privacy Policy"
                      style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}>
                      <span style={{
                        width: 22, height: 22, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
                        border: agreed ? `1.5px solid ${ACCENT}` : "1.5px solid rgba(255,255,255,0.3)",
                        background: agreed ? ACCENT : "transparent", transition: "all 0.2s",
                      }}>
                        {agreed && (
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        )}
                      </span>
                    </button>
                    <span style={{ fontSize: "13px", color: "rgba(255,255,255,0.6)" }}>
                      I agree to the{" "}
                      <a href="https://safe4all.online/terms" target="_blank" rel="noopener noreferrer" style={{ color: ACCENT, fontWeight: 600 }}>Terms</a>
                      {" "}and{" "}
                      <a href="https://safe4all.online/privacy" target="_blank" rel="noopener noreferrer" style={{ color: ACCENT, fontWeight: 600 }}>Privacy Policy</a>
                    </span>
                  </div>

                  {error && <p style={{ color: "#ff7a5c", fontSize: "13px", marginBottom: "12px", marginTop: "4px" }}>{error}</p>}

                  <button
                    type="submit"
                    disabled={loading}
                    style={{
                      width: "100%",
                      height: "52px",
                      borderRadius: "14px",
                      background: "linear-gradient(135deg, #E84B1D, #c43a10)",
                      color: "#fff",
                      fontWeight: 700,
                      fontSize: "15px",
                      border: "none",
                      cursor: loading ? "not-allowed" : "pointer",
                      opacity: loading ? 0.7 : 1,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "8px",
                      marginTop: "12px",
                      boxShadow: "0 10px 28px rgba(232,75,29,0.4)",
                    }}
                  >
                    {loading ? <><Loader2 size={18} className="animate-spin" /> Creating account...</> : "Sign up"}
                  </button>
                </form>

              </motion.div>
            )}

            {step === STEPS.OTP && (
              <motion.div
                key="otp"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                style={{
                  background: "rgba(255,255,255,0.05)",
                  backdropFilter: "blur(12px)",
                  WebkitBackdropFilter: "blur(12px)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: "20px",
                  padding: "32px 28px",
                  textAlign: "center",
                  marginTop: "16px",
                }}
              >
                <div style={{
                  width: 64, height: 64, borderRadius: "16px", margin: "0 auto 20px",
                  background: "rgba(232,75,29,0.15)", border: "2px solid rgba(232,75,29,0.35)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <User size={28} style={{ color: ACCENT }} />
                </div>

                <h2 style={{ fontSize: "22px", fontWeight: 800, color: "#fff", marginBottom: "8px" }}>Verify your email</h2>
                <p style={{ fontSize: "14px", color: "rgba(255,255,255,0.5)", marginBottom: "24px" }}>
                  We sent a 6-digit code to<br />
                  <span style={{ color: "#fff", fontWeight: 600 }}>{email}</span>
                </p>

                {error && <p style={{ color: "#ff7a5c", fontSize: "13px", marginBottom: "16px" }}>{error}</p>}

                <div className="mb-6 flex justify-center [&_input]:bg-white/10 [&_input]:border-white/20 [&_input]:text-white [&_input]:text-xl [&_input]:font-bold [&_input]:rounded-xl">
                  <InputOTP maxLength={6} value={otpCode} onChange={setOtpCode} autoFocus autoComplete="one-time-code">
                    <InputOTPGroup className="gap-2">
                      <InputOTPSlot index={0} />
                      <InputOTPSlot index={1} />
                      <InputOTPSlot index={2} />
                      <InputOTPSlot index={3} />
                      <InputOTPSlot index={4} />
                      <InputOTPSlot index={5} />
                    </InputOTPGroup>
                  </InputOTP>
                </div>

                <button
                  onClick={handleVerify}
                  disabled={loading || otpCode.length < 6}
                  style={{
                    width: "100%",
                    height: "52px",
                    borderRadius: "14px",
                    background: "linear-gradient(135deg, #E84B1D, #c43a10)",
                    color: "#fff",
                    fontWeight: 700,
                    fontSize: "15px",
                    border: "none",
                    cursor: (loading || otpCode.length < 6) ? "not-allowed" : "pointer",
                    opacity: (loading || otpCode.length < 6) ? 0.6 : 1,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "8px",
                    boxShadow: "0 10px 28px rgba(232,75,29,0.4)",
                  }}
                >
                  {loading ? <><Loader2 size={18} className="animate-spin" /> Verifying...</> : "Verify & Continue"}
                </button>

                <p style={{ fontSize: "13px", color: "rgba(255,255,255,0.5)", marginTop: "18px" }}>
                  Didn't receive it?{" "}
                  <button onClick={handleResend} style={{ color: ACCENT, fontWeight: 700, background: "none", border: "none", cursor: "pointer" }}>Resend</button>
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}