import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, Lock, Eye, EyeOff, Loader2, KeyRound } from "lucide-react";
import { apiClient } from "@/api/client";

const PRIMARY = "#e05028";
const PRIMARY_DIM = "rgba(224,80,40,0.13)";

const blobs = [
  { top: "6%",  left: "8%",  width: 130, height: 130, borderRadius: "40% 60% 55% 45%", duration: 6, delay: 0 },
  { top: "12%", right: "6%", width: 100, height: 100, borderRadius: "60% 40% 45% 55%", duration: 7, delay: 1 },
  { top: "55%", left: "3%",  width:  80, height:  80, borderRadius: "50%",              duration: 5, delay: 2 },
  { top: "65%", right: "5%", width: 120, height: 120, borderRadius: "45% 55% 60% 40%", duration: 8, delay: 0.5 },
  { top: "40%", left: "45%", width:  60, height:  60, borderRadius: "50%",              duration: 6, delay: 1.5 },
];

const inputBase = {
  width: "100%",
  minHeight: 44,
  background: "rgba(255,255,255,0.06)",
  border: "1px solid rgba(255,255,255,0.10)",
  borderRadius: 12,
  padding: "13px 16px 13px 42px",
  color: "#fff",
  fontSize: 14,
  outline: "none",
  boxSizing: "border-box",
  transition: "border 0.2s",
};

const iconWrap = {
  position: "absolute",
  left: 13,
  top: "50%",
  transform: "translateY(-50%)",
  color: "rgba(255,255,255,0.28)",
  display: "flex",
  pointerEvents: "none",
};

export default function LoginPage() {
  const [email, setEmail]           = useState("");
  const [password, setPassword]     = useState("");
  const [showPass, setShowPass]     = useState(false);
  const [loading, setLoading]       = useState(false);
  const [showCode, setShowCode]     = useState(false);
  const [code, setCode]             = useState("");
  const [codeLoading, setCodeLoading] = useState(false);
  const [error, setError]           = useState("");
  const [focusField, setFocusField] = useState(null);

  const focusStyle = (name) =>
    focusField === name
      ? { ...inputBase, border: "1px solid rgba(224,80,40,0.6)", boxShadow: "0 0 0 3px rgba(224,80,40,0.12)" }
      : inputBase;

  const handleSignIn = async () => {
    setError("");
    if (!email || !email.includes("@")) { setError("Enter a valid email address."); return; }
    if (!password) { setError("Enter your password."); return; }
    setLoading(true);
    try {
      await apiClient.auth.loginViaEmailPassword(email, password);
      window.location.href = "/beka/";
    } catch (err) {
      setError(err.message || "Invalid email or password.");
    } finally {
      setLoading(false);
    }
  };


  const handleRedeem = async () => {
    setError("");
    if (!code.trim()) { setError("Enter your access code."); return; }
    setCodeLoading(true);
    try {
      await apiClient.functions.invoke("redeemAccessCode", { code: code.trim() });
      window.location.href = "/beka/";
    } catch (err) {
      setError(err.message || "Invalid access code.");
    } finally {
      setCodeLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #0a0a14 0%, #12121f 50%, #0a0a14 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Floating blobs */}
      {blobs.map((b, i) => (
        <motion.div
          key={i}
          animate={{ y: [0, -22, 0], rotate: [0, 6, 0] }}
          transition={{ repeat: Infinity, duration: b.duration, delay: b.delay, ease: "easeInOut" }}
          style={{
            position: "absolute",
            top: b.top,
            left: b.left,
            right: b.right,
            width: b.width,
            height: b.height,
            borderRadius: b.borderRadius,
            background: PRIMARY_DIM,
            filter: "blur(36px)",
            pointerEvents: "none",
          }}
        />
      ))}

      {/* Card */}
      <div
        style={{
          position: "relative",
          zIndex: 1,
          width: "100%",
          maxWidth: 380,
          background: "rgba(255,255,255,0.04)",
          backdropFilter: "blur(28px)",
          WebkitBackdropFilter: "blur(28px)",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: 28,
          padding: "40px 32px 32px",
          boxShadow: "0 32px 80px rgba(0,0,0,0.6)",
        }}
      >
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div
            style={{
              width: 58,
              height: 58,
              borderRadius: 16,
              background: PRIMARY,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 14px",
              boxShadow: `0 8px 28px rgba(224,80,40,0.40)`,
            }}
          >
            <span style={{ color: "#fff", fontWeight: 900, fontSize: 26, letterSpacing: -1 }}>B</span>
          </div>
          <div style={{ color: "#fff", fontWeight: 800, fontSize: 22, letterSpacing: "0.18em" }}>BEKA</div>
          <div style={{ color: "rgba(255,255,255,0.35)", fontSize: 10, letterSpacing: "0.20em", textTransform: "uppercase", marginTop: 4 }}>
            Your Safety, Your Power
          </div>
        </div>

        {/* Email */}
        <div style={{ position: "relative", marginBottom: 12 }}>
          <span style={iconWrap}><Mail size={16} /></span>
          <input
            type="email"
            placeholder="Email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onFocus={() => setFocusField("email")}
            onBlur={() => setFocusField(null)}
            onKeyDown={(e) => e.key === "Enter" && handleSignIn()}
            style={focusStyle("email")}
          />
        </div>

        {/* Password */}
        <div style={{ position: "relative", marginBottom: 22 }}>
          <span style={iconWrap}><Lock size={16} /></span>
          <input
            type={showPass ? "text" : "password"}
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onFocus={() => setFocusField("password")}
            onBlur={() => setFocusField(null)}
            onKeyDown={(e) => e.key === "Enter" && handleSignIn()}
            style={{ ...focusStyle("password"), paddingRight: 42 }}
          />
          <button
            type="button"
            onClick={() => setShowPass((v) => !v)}
            aria-label={showPass ? "Hide password" : "Show password"}
            style={{
              position: "absolute", right: 5, top: "50%", transform: "translateY(-50%)",
              background: "none", border: "none", cursor: "pointer",
              color: "rgba(255,255,255,0.28)", display: "flex",
              alignItems: "center", justifyContent: "center",
              width: 44, height: 44, padding: 0,
            }}
          >
            {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>

        {/* Sign In button */}
        <button
          onClick={handleSignIn}
          disabled={loading}
          style={{
            width: "100%",
            background: loading ? "rgba(224,80,40,0.6)" : PRIMARY,
            color: "#fff",
            fontWeight: 700,
            fontSize: 14,
            letterSpacing: "0.06em",
            borderRadius: 12,
            padding: "13px",
            border: "none",
            cursor: loading ? "not-allowed" : "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            transition: "background 0.2s",
          }}
        >
          {loading ? <Loader2 size={18} style={{ animation: "spin 1s linear infinite" }} /> : "Sign In"}
        </button>

        {/* Error */}
        <AnimatePresence>
          {error && (
            <motion.p
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              style={{ color: "#f87171", fontSize: 12, textAlign: "center", marginTop: 10 }}
            >
              {error}
            </motion.p>
          )}
        </AnimatePresence>

        {/* Divider */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "18px 0" }}>
          <hr style={{ flex: 1, border: "none", borderTop: "1px solid rgba(255,255,255,0.09)" }} />
          <span style={{ color: "rgba(255,255,255,0.25)", fontSize: 11 }}>or</span>
          <hr style={{ flex: 1, border: "none", borderTop: "1px solid rgba(255,255,255,0.09)" }} />
        </div>


        {/* Access Code */}
        <button
          onClick={() => { setShowCode((v) => !v); setError(""); }}
          aria-expanded={showCode}
          aria-label="Use access code"
          style={{
            width: "100%",
            minHeight: 44,
            background: "rgba(255,255,255,0.05)",
            border: "1px solid rgba(255,255,255,0.10)",
            borderRadius: 12,
            padding: "11px",
            color: "rgba(255,255,255,0.70)",
            fontSize: 13,
            fontWeight: 500,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
          }}
        >
          <KeyRound size={15} style={{ color: "rgba(255,255,255,0.40)" }} />
          Use Access Code
        </button>

        {/* Access Code input */}
        <AnimatePresence>
          {showCode && (
            <motion.div
              initial={{ opacity: 0, height: 0, marginTop: 0 }}
              animate={{ opacity: 1, height: "auto", marginTop: 10 }}
              exit={{ opacity: 0, height: 0, marginTop: 0 }}
              style={{ overflow: "hidden" }}
            >
              <div style={{ display: "flex", gap: 8 }}>
                <input
                  type="text"
                  placeholder="Enter access code"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleRedeem()}
                  onFocus={() => setFocusField("code")}
                  onBlur={() => setFocusField(null)}
                  style={{
                    ...focusStyle("code"),
                    paddingLeft: 16,
                    flex: 1,
                    width: "auto",
                  }}
                />
                <button
                  onClick={handleRedeem}
                  disabled={codeLoading}
                  aria-label="Redeem access code"
                  style={{
                    background: PRIMARY,
                    color: "#fff",
                    fontWeight: 600,
                    fontSize: 13,
                    borderRadius: 10,
                    minHeight: 44,
                    padding: "10px 16px",
                    border: "none",
                    cursor: codeLoading ? "not-allowed" : "pointer",
                    whiteSpace: "nowrap",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 6,
                  }}
                >
                  {codeLoading ? <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} /> : "Redeem"}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Footer note */}
        <p style={{ color: "rgba(255,255,255,0.18)", fontSize: 10, textAlign: "center", marginTop: 26, letterSpacing: "0.05em" }}>
          Confidential support &amp; safety tools
        </p>
      </div>

      {/* Keyframe for spin */}
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}