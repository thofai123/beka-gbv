import { useEffect, useMemo, useState } from "react";
import { apiClient } from "@/api/client";
import { Button } from "@/components/ui/button";
import { Loader2, RefreshCw, ShieldCheck } from "lucide-react";

const inputStyle = {
  width: "100%",
  height: "58px",
  border: "0",
  borderBottom: "2px solid hsl(var(--border))",
  background: "transparent",
  color: "hsl(var(--foreground))",
  fontSize: "24px",
  fontWeight: 700,
  textAlign: "center",
  outline: "none",
  borderRadius: "0",
};

function secondsToTime(seconds) {
  const minutes = Math.floor(seconds / 60);
  const rest = String(seconds % 60).padStart(2, "0");
  return `${minutes}:${rest}`;
}

function toLocalNumber(phone) {
  const clean = String(phone || "").replace(/\D/g, "");
  if (clean.startsWith("260")) return clean.slice(3, 12);
  return clean.slice(0, 9);
}

export default function PhoneVerificationStep({ initialPhone, onVerified }) {
  const [localPhone, setLocalPhone] = useState(toLocalNumber(initialPhone));
  const [otp, setOtp] = useState("");
  const [sent, setSent] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const phoneNumber = useMemo(() => `+260${localPhone}`, [localPhone]);
  const phoneValid = /^9\d{8}$/.test(localPhone);

  useEffect(() => {
    if (!sent || secondsLeft <= 0) return;
    const timer = setTimeout(() => setSecondsLeft((value) => Math.max(0, value - 1)), 1000);
    return () => clearTimeout(timer);
  }, [sent, secondsLeft]);

  const sendCode = async () => {
    setError("");
    if (!phoneValid) {
      setError("Enter a valid Zambian number starting with 9.");
      return;
    }
    setLoading(true);
    try {
      await apiClient.functions.invoke("sendOTP", { phoneNumber });
      setSent(true);
      setSecondsLeft(600);
      setOtp("");
    } catch (err) {
      setError(err.response?.data?.error || err.message || "Could not send code.");
    }
    setLoading(false);
  };

  const verifyCode = async () => {
    setError("");
    if (!/^\d{6}$/.test(otp)) {
      setError("Enter the 6-digit code.");
      return;
    }
    setLoading(true);
    try {
      await apiClient.functions.invoke("verifyOTP", { phoneNumber, otp });
      await onVerified(phoneNumber);
    } catch (err) {
      setError(err.response?.data?.error || err.message || "Verification failed.");
    }
    setLoading(false);
  };

  return (
    <div className="w-full space-y-4">
      <div className="flex items-end gap-2">
        <div className="h-[58px] px-3 flex items-center justify-center border-b-2 border-border font-mono text-2xl font-bold text-muted-foreground">
          +260
        </div>
        <input
          autoFocus
          type="tel"
          inputMode="numeric"
          value={localPhone}
          onChange={(e) => setLocalPhone(e.target.value.replace(/\D/g, "").slice(0, 9))}
          placeholder="9XXXXXXXX"
          style={{ ...inputStyle, fontFamily: "var(--font-mono)", letterSpacing: "-0.04em" }}
          onKeyDown={(e) => e.key === "Enter" && (sent ? verifyCode() : sendCode())}
        />
      </div>

      {!sent ? (
        <Button onClick={sendCode} disabled={!phoneValid || loading} className="w-full h-12 rounded-2xl font-bold">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
          Send Code
        </Button>
      ) : (
        <div className="space-y-3">
          <input
            type="tel"
            inputMode="numeric"
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
            placeholder="000000"
            style={{ ...inputStyle, fontFamily: "var(--font-mono)", letterSpacing: "0.35em" }}
            onKeyDown={(e) => e.key === "Enter" && verifyCode()}
          />
          <Button onClick={verifyCode} disabled={otp.length !== 6 || loading || secondsLeft === 0} className="w-full h-12 rounded-2xl font-bold">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            Verify
          </Button>
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Code expires in {secondsToTime(secondsLeft)}</span>
            <button type="button" onClick={sendCode} disabled={loading} className="inline-flex items-center gap-1 text-primary font-medium">
              <RefreshCw className={`w-3 h-3 ${loading ? "animate-spin" : ""}`} /> Resend Code
            </button>
          </div>
        </div>
      )}

      {error && <p className="text-sm text-destructive font-medium text-center">{error}</p>}
      <p className="text-xs text-center text-muted-foreground">Use international format: +2609XXXXXXXX</p>
    </div>
  );
}