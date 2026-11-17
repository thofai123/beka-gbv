import { useEffect, useMemo, useState } from "react";
import { apiClient } from "@/api/client";
import { UserService } from "@/services/UserService";
import { EmergencyContactService } from "@/services/EmergencyContactService";
import { Button } from "@/components/ui/button";
import { Shield, Phone, ChevronRight, ChevronLeft, Check, KeyRound, UserRound, Eye, EyeOff, ArrowLeft, Loader2, Mail } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import GoogleIcon from "@/components/GoogleIcon";

const STORAGE_KEY = "beka_profile_setup_v2";

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

const isPhoneValid = (value) => /^\+?[0-9\s-]{8,18}$/.test(value.trim());

const slideVariants = {
  enter: (dir) => ({ x: dir > 0 ? "100%" : "-100%", opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir) => ({ x: dir > 0 ? "-100%" : "100%", opacity: 0 }),
};

const LOGIN_STEPS = { LANDING: 0, EMAIL: 1, PASSWORD: 2 };

function InlineLogin() {
  const [step, setStep] = useState(LOGIN_STEPS.LANDING);
  const [direction, setDirection] = useState(1);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const goTo = (next) => {
    setDirection(next > step ? 1 : -1);
    setError("");
    setStep(next);
  };

  const handleEmailContinue = (e) => {
    e.preventDefault();
    if (!email || !email.includes("@")) { setError("Please enter a valid email address"); return; }
    goTo(LOGIN_STEPS.PASSWORD);
  };

  const handleSignIn = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await apiClient.auth.loginViaEmailPassword(email, password);
      window.location.reload();
    } catch (err) {
      setError(err.message || "Invalid email or password");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = () => apiClient.auth.loginWithProvider("google", "/");

  return (
    <div className="fixed inset-0 flex flex-col overflow-hidden z-[190]" style={{ background: "linear-gradient(160deg, #1a0a05 0%, #2d1208 40%, #1a0a05 100%)" }}>
      {/* Animated background glow */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <motion.div
          animate={{ scale: [1, 1.15, 1], opacity: [0.18, 0.28, 0.18] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-[15%] left-1/2 -translate-x-1/2 w-72 h-72 rounded-full"
          style={{ background: "radial-gradient(circle, #E84B1D 0%, transparent 70%)" }}
        />
      </div>

      <div className="relative z-10 pt-10 px-6 h-16 flex items-center">
        {step !== LOGIN_STEPS.LANDING && (
          <motion.button
            initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
            onClick={() => goTo(step - 1)}
            className="flex items-center justify-center w-10 h-10 rounded-full bg-white/10 text-white"
          >
            <ArrowLeft className="w-5 h-5" />
          </motion.button>
        )}
      </div>

      <div className="flex-1 relative overflow-hidden">
        <AnimatePresence initial={false} custom={direction} mode="popLayout">
          {step === LOGIN_STEPS.LANDING && (
            <motion.div key="landing" custom={direction} variants={slideVariants} initial="enter" animate="center" exit="exit"
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="absolute inset-0 flex flex-col px-6"
            >
              {/* Hero section */}
              <div className="flex-1 flex flex-col items-center justify-center gap-4">
                {/* Logo with glow ring */}
                <div className="relative mb-2">
                  <div className="absolute inset-0 rounded-3xl blur-2xl opacity-60" style={{ background: "#E84B1D", transform: "scale(1.4)" }} />
                  <div className="relative w-24 h-24 rounded-3xl flex items-center justify-center shadow-2xl" style={{ background: "linear-gradient(135deg, #E84B1D 0%, #b83010 100%)" }}>
                    <span className="text-white font-black text-5xl tracking-tight" style={{ fontFamily: "var(--font-inter)" }}>B</span>
                  </div>
                </div>

                <div className="text-center space-y-1">
                  <h1 className="text-white font-black text-5xl tracking-tight">BEKA</h1>
                  <p className="text-white/70 text-base font-medium tracking-widest uppercase text-sm">Your safety, your power</p>
                </div>

                <p className="text-white/35 text-sm text-center max-w-[220px] leading-relaxed mt-1">
                  Empowering GBV survivors across Zambia
                </p>
              </div>

              {/* Bottom buttons */}
              <div className="pb-12 space-y-3">
                <button onClick={handleGoogle}
                  className="w-full h-[58px] rounded-2xl bg-white flex items-center justify-center gap-3 font-semibold text-gray-800 text-base shadow-xl active:scale-[0.98] transition-transform"
                >
                  <GoogleIcon className="w-5 h-5" />
                  Continue with Google
                </button>
                <button onClick={() => goTo(LOGIN_STEPS.EMAIL)}
                  className="w-full h-[58px] rounded-2xl flex items-center justify-center gap-3 font-semibold text-white text-base active:scale-[0.98] transition-transform"
                  style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)" }}
                >
                  <Mail className="w-5 h-5 text-white/60" />
                  Continue with Email
                  <ChevronRight className="w-4 h-4 ml-auto mr-1 text-white/30" />
                </button>
                <p className="text-center text-white/25 text-xs pt-1">
                  Safe, encrypted & confidential
                </p>
              </div>
            </motion.div>
          )}

          {step === LOGIN_STEPS.EMAIL && (
            <motion.div key="email" custom={direction} variants={slideVariants} initial="enter" animate="center" exit="exit"
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="absolute inset-0 flex flex-col px-6 relative z-10"
            >
              <div className="flex-1 flex flex-col justify-center max-w-sm mx-auto w-full">
                <h2 className="text-white text-3xl font-bold mb-2">What's your email?</h2>
                <p className="text-white/50 text-sm mb-8">We'll use this to sign you in securely.</p>
                <form onSubmit={handleEmailContinue} className="space-y-4">
                  <div>
                    <input type="email" autoFocus autoComplete="email" placeholder="you@example.com" value={email}
                      onChange={(e) => { setEmail(e.target.value); setError(""); }}
                      className="w-full h-14 rounded-2xl bg-white/10 border border-white/15 text-white placeholder-white/30 px-4 text-base focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
                    />
                    {error && <p className="text-red-400 text-sm mt-2 pl-1">{error}</p>}
                  </div>
                  <button type="submit" className="w-full h-14 rounded-2xl bg-primary text-white font-semibold text-base shadow-lg shadow-primary/30 active:scale-[0.98] transition-transform">
                    Continue
                  </button>
                </form>
              </div>
            </motion.div>
          )}

          {step === LOGIN_STEPS.PASSWORD && (
            <motion.div key="password" custom={direction} variants={slideVariants} initial="enter" animate="center" exit="exit"
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="absolute inset-0 flex flex-col px-6 relative z-10"
            >
              <div className="flex-1 flex flex-col justify-center max-w-sm mx-auto w-full">
                <h2 className="text-white text-3xl font-bold mb-1">Enter your password</h2>
                <p className="text-white/50 text-sm mb-8 truncate">{email}</p>
                <form onSubmit={handleSignIn} className="space-y-4">
                  <div>
                    <div className="relative">
                      <input type={showPassword ? "text" : "password"} autoFocus autoComplete="current-password" placeholder="••••••••" value={password}
                        onChange={(e) => { setPassword(e.target.value); setError(""); }}
                        className="w-full h-14 rounded-2xl bg-white/10 border border-white/15 text-white placeholder-white/30 px-4 pr-12 text-base focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
                      />
                      <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70 transition-colors">
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                    {error && <p className="text-red-400 text-sm mt-2 pl-1">{error}</p>}
                  </div>
                  <button type="submit" disabled={loading || !password}
                    className="w-full h-14 rounded-2xl bg-primary text-white font-semibold text-base shadow-lg shadow-primary/30 active:scale-[0.98] transition-transform disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2"
                  >
                    {loading ? <><Loader2 className="w-5 h-5 animate-spin" /> Signing in...</> : "Sign In"}
                  </button>
                </form>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

export default function ProfileSetupGate({ user, children }) {
  const [status, setStatus] = useState("checking");
  const [step, setStep] = useState(0);
  const [firstName, setFirstName] = useState(user?.first_name || user?.data?.first_name || user?.full_name?.split(" ")?.[0] || "");
  const [lastName, setLastName] = useState(user?.last_name || user?.data?.last_name || user?.full_name?.split(" ")?.slice(1).join(" ") || "");
  const [phone, setPhone] = useState(user?.phone || user?.data?.phone || "");
  const [emergencyName, setEmergencyName] = useState("");
  const [emergencyPhone, setEmergencyPhone] = useState("");
  const [emergencyTitle, setEmergencyTitle] = useState(user?.emergency_title || user?.data?.emergency_title || "I need help");
  const [showCode, setShowCode] = useState(false);
  const [code, setCode] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user) return;

    // Trust localStorage first — if they completed setup before, never re-show it
    const done = localStorage.getItem(STORAGE_KEY) === "true";
    if (done) {
      setStatus("complete");
      return;
    }

    // Check all possible locations for custom fields (top-level or nested under .data)
    const savedPhone = user?.phone || user?.data?.phone;
    const savedFirstName = user?.first_name || user?.data?.first_name;
    const hasCompletedProfile = !!(savedPhone && savedFirstName);

    if (hasCompletedProfile) {
      localStorage.setItem(STORAGE_KEY, "true");
      setStatus("complete");
    } else {
      setStatus("pending");
    }
  }, [user]);

  const canContinue = useMemo(() => {
    if (step === 0) return firstName.trim().length >= 2 && lastName.trim().length >= 2;
    if (step === 1) return isPhoneValid(phone);
    if (step === 2) return emergencyName.trim().length >= 2 && isPhoneValid(emergencyPhone);
    return true;
  }, [step, firstName, lastName, phone, emergencyName, emergencyPhone]);

  const complete = () => {
    localStorage.setItem(STORAGE_KEY, "true");
    setStatus("complete");
  };

  const handleNext = async () => {
    setError("");
    if (!canContinue) {
      setError(step === 1 || step === 2 ? "Please enter a valid phone number." : "Please complete the required fields.");
      return;
    }
    if (step < 3) {
      setStep((current) => current + 1);
      return;
    }

    setSaving(true);
    const payload = {
      first_name: firstName.trim(),
      last_name: lastName.trim(),
      phone: phone.trim(),
      emergency_title: emergencyTitle.trim() || "I need help",
    };
    if (!user?.role) payload.role = "survivor";

    try {
      await UserService.updateMe(payload);
      await EmergencyContactService.create({
        name: emergencyName.trim(),
        phone: emergencyPhone.trim(),
        relationship: "Emergency contact",
        priority: 1,
        notify_location: true,
        user_id: user.id,
      });
      if (code.trim()) {
        try { await apiClient.functions.invoke("redeemAccessCode", { code: code.trim().toUpperCase() }); } catch {}
      }
      complete();
    } catch (err) {
      setError(err?.message || "Could not save your profile. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleSkip = async () => {
    localStorage.setItem(STORAGE_KEY, "true");
    try { if (!user?.role && !user?.data?.role) await UserService.updateMe({ role: "survivor" }); } catch {}
    complete();
  };

  const handleFocus = (event) => {
    event.currentTarget.style.borderBottomColor = "hsl(var(--primary))";
    event.currentTarget.style.boxShadow = "0 8px 0 -6px hsl(var(--primary) / 0.25)";
  };

  const handleBlur = (event) => {
    event.currentTarget.style.borderBottomColor = "hsl(var(--border))";
    event.currentTarget.style.boxShadow = "none";
  };

  if (!user) return null; // still loading auth — don't flash onboarding
  if (status === "checking") return null;
  if (status === "complete") return children;

  const commonInputProps = { onFocus: handleFocus, onBlur: handleBlur, style: inputStyle };
  const stepContent = [
    {
      icon: UserRound,
      title: "What’s your name?",
      subtitle: "So responders can address you properly in an emergency",
      input: (
        <div className="space-y-4">
          <input autoFocus value={firstName} onChange={(e) => setFirstName(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleNext()} placeholder="First name" {...commonInputProps} />
          <input value={lastName} onChange={(e) => setLastName(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleNext()} placeholder="Last name" {...commonInputProps} />
        </div>
      ),
    },
    {
      icon: Phone,
      title: "Your phone number",
      subtitle: "Used for SMS emergency alerts and verification",
      input: (
        <div className="space-y-3">
          <input autoFocus type="tel" inputMode="tel" value={phone} onChange={(e) => setPhone(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleNext()} placeholder="+260 9XX XXX XXX" {...commonInputProps} style={{ ...inputStyle, fontFamily: "var(--font-mono)", letterSpacing: "-0.04em" }} />
          <p className="text-xs text-center text-muted-foreground">Include your country code, e.g. +260 for Zambia</p>
        </div>
      ),
    },
    {
      icon: Shield,
      title: "Emergency contact",
      subtitle: "Choose one trusted person to alert if you need urgent help",
      input: (
        <div className="space-y-4">
          <input autoFocus value={emergencyName} onChange={(e) => setEmergencyName(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleNext()} placeholder="Contact name" {...commonInputProps} />
          <input type="tel" inputMode="tel" value={emergencyPhone} onChange={(e) => setEmergencyPhone(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleNext()} placeholder="Contact number" {...commonInputProps} style={{ ...inputStyle, fontFamily: "var(--font-mono)", letterSpacing: "-0.04em" }} />
        </div>
      ),
    },
    {
      icon: Shield,
      title: "Almost done",
      subtitle: "Choose how your emergency alert should appear to trusted contacts",
      input: (
        <div className="space-y-5">
          <input autoFocus value={emergencyTitle} maxLength={60} onChange={(e) => setEmergencyTitle(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleNext()} placeholder="I need help" {...commonInputProps} />
          <button type="button" onClick={() => setShowCode(true)} className="mx-auto flex items-center gap-2 text-xs font-medium text-primary">
            <KeyRound className="w-3.5 h-3.5" /> I have a staff or responder access code
          </button>
          {showCode && <input value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="ACCESS CODE" {...commonInputProps} style={{ ...inputStyle, height: "52px", fontSize: "18px", fontFamily: "var(--font-mono)", textTransform: "uppercase" }} />}
        </div>
      ),
    },
  ];

  const CurrentIcon = stepContent[step].icon;

  return (
    <div className="fixed inset-0 z-[190] bg-background flex flex-col">
      <div className="flex items-center justify-between px-5 py-4 flex-shrink-0">
        <button type="button" onClick={() => setStep((current) => Math.max(0, current - 1))} className={`w-10 h-10 rounded-full flex items-center justify-center ${step === 0 ? "invisible" : "hover:bg-muted"}`}>
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-2">
          {[0, 1, 2, 3].map((item) => <span key={item} className={`h-2 rounded-full transition-all duration-300 ${item === step ? "w-8 bg-primary" : item < step ? "w-2 bg-primary/60" : "w-2 bg-muted"}`} />)}
        </div>
        <button type="button" onClick={handleSkip} className="h-10 px-3 text-sm font-medium text-muted-foreground">Skip</button>
      </div>

      <div className="flex-1 px-6 flex flex-col items-center justify-center text-center gap-7 min-h-0">
        <div className="w-20 h-20 rounded-3xl bg-primary/10 flex items-center justify-center"><CurrentIcon className="w-9 h-9 text-primary" /></div>
        <div className="space-y-2 max-w-sm"><h1 className="text-3xl font-extrabold tracking-tight">{stepContent[step].title}</h1><p className="text-sm text-muted-foreground leading-relaxed">{stepContent[step].subtitle}</p></div>
        <div className="w-full max-w-sm">{stepContent[step].input}</div>
        {error && <p className="text-sm text-destructive font-medium">{error}</p>}
      </div>

      <div className="p-5 flex-shrink-0" style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 1.25rem)" }}>
        <Button onClick={handleNext} disabled={!canContinue || saving} className="w-full h-[52px] rounded-2xl text-base font-bold">
          {step < 3 ? <>Continue <ChevronRight className="w-5 h-5" /></> : <>Finish setup <Check className="w-5 h-5" /></>}
        </Button>
      </div>
    </div>
  );
}