import { useEffect, useState } from "react";
import { Shield, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { apiClient } from "@/api/client";

// v2: bumped so existing users re-accept the updated Terms and Privacy Policy once.
const STORAGE_KEY = "safe4all_terms_accepted_v2";
const SITE = "https://safe4all.online";

const linkStyle = { color: "hsl(var(--primary))", fontWeight: 600, textDecoration: "underline" };

export default function TermsGate({ children }) {
  const [status, setStatus] = useState("checking"); // checking | accepted | pending | declined

  useEffect(() => {
    try {
      setStatus(localStorage.getItem(STORAGE_KEY) === "true" ? "accepted" : "pending");
    } catch {
      setStatus("pending");
    }
  }, []);

  const accept = () => {
    try { localStorage.setItem(STORAGE_KEY, "true"); } catch {}
    setStatus("accepted");
  };

  if (status === "checking") return null;
  if (status === "accepted") return children;

  if (status === "declined") {
    return (
      <div className="fixed inset-0 z-[200] bg-background flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
          <X className="w-8 h-8 text-destructive" />
        </div>
        <h2 className="text-xl font-bold mb-2">Access Restricted</h2>
        <p className="text-sm text-muted-foreground max-w-sm mb-6">
          You must accept the Terms and Privacy Policy to use BEKA. The app handles sensitive emergency data and needs your consent.
        </p>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => apiClient.auth.logout()}>Exit App</Button>
          <Button onClick={() => setStatus("pending")}>Review Again</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[200] bg-background flex flex-col">
      <div className="flex items-center gap-3 px-5 py-4 border-b border-border flex-shrink-0">
        <div className="w-9 h-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
          <Shield className="w-5 h-5" />
        </div>
        <div>
          <h2 className="font-bold text-base leading-tight">Terms &amp; Privacy</h2>
          <p className="text-[11px] text-muted-foreground">Please read before continuing</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-4 text-sm text-foreground/85 space-y-4 leading-relaxed">
        <section>
          <h3 className="font-semibold text-foreground mb-1">What BEKA does</h3>
          <p>
            BEKA helps people in Zambia report gender-based violence, raise emergency alerts, and share their location with chosen contacts and responders.
          </p>
        </section>
        <section>
          <h3 className="font-semibold text-foreground mb-1">Not a replacement for emergency services</h3>
          <p>
            Alerts can be delayed or fail because of network, battery, location or provider problems. If you are in immediate danger, contact the police or emergency services directly if you can.
          </p>
        </section>
        <section>
          <h3 className="font-semibold text-foreground mb-1">Your data</h3>
          <p>
            We collect the details you give us, your location during alerts (with your permission), and reports or evidence you submit. These are shared only with responders and contacts as needed to help you. Read the full details before you continue:
          </p>
          <p className="mt-2">
            <a href={`${SITE}/terms`} target="_blank" rel="noopener noreferrer" style={linkStyle}>Terms of Service</a>
            {" · "}
            <a href={`${SITE}/privacy`} target="_blank" rel="noopener noreferrer" style={linkStyle}>Privacy Policy</a>
            {" · "}
            <a href={`${SITE}/cookies`} target="_blank" rel="noopener noreferrer" style={linkStyle}>Cookie Policy</a>
          </p>
        </section>
        <section>
          <h3 className="font-semibold text-foreground mb-1">Your consent</h3>
          <p>
            By tapping <strong>Accept</strong>, you agree to the Terms and Privacy Policy and consent to us processing the data needed to provide emergency response services, including your location when you use alerts. You can withdraw consent or ask for your data to be deleted by contacting us.
          </p>
        </section>
      </div>

      <div
        className="flex-shrink-0 border-t border-border bg-card p-4 flex gap-2"
        style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 1rem)" }}
      >
        <Button variant="outline" onClick={() => setStatus("declined")} className="flex-1 gap-2">
          <X className="w-4 h-4" /> Decline
        </Button>
        <Button onClick={accept} className="flex-1 gap-2">
          <Check className="w-4 h-4" /> Accept
        </Button>
      </div>
    </div>
  );
}
