import { useState } from "react";
import { FileText, Shield, ChevronDown } from "lucide-react";

const TERMS = [
  "Safe4All is provided as an emergency-response tool and supplements but does not replace official emergency services.",
  "You must be 13 years or older to use this service.",
  "False or malicious alerts may be reported to authorities and may lead to account suspension.",
  "We reserve the right to update these terms; continued use means acceptance of the updates.",
];

const PRIVACY = [
  "Your location and case data are encrypted in transit and at rest.",
  "Data is shared only with assigned responders or your saved destinations when you trigger help.",
  "We comply with the Zambia Data Protection Act.",
  "You can delete your account and all associated data at any time from Settings → Account.",
];

function Section({ icon: Icon, title, items }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-lg border border-border overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-3 p-3 hover:bg-muted/50 transition-colors"
      >
        <div className="w-9 h-9 rounded-md bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
          <Icon className="w-4 h-4" />
        </div>
        <span className="text-sm font-medium flex-1 text-left">{title}</span>
        <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <ul className="px-4 pb-3 pt-1 space-y-1.5">
          {items.map((t, i) => (
            <li key={i} className="text-xs text-muted-foreground leading-relaxed flex gap-2">
              <span className="text-primary mt-1.5 w-1 h-1 rounded-full bg-primary flex-shrink-0" />
              <span>{t}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function SettingsLegal() {
  return (
    <div className="space-y-2">
      <Section icon={FileText} title="Terms & Conditions" items={TERMS} />
      <Section icon={Shield} title="Privacy Policy" items={PRIVACY} />
    </div>
  );
}