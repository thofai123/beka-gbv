import { useState, useEffect } from "react";
import { UserService } from "@/services/UserService";
import { Shield, Lock, Key, Users, CheckCircle, AlertTriangle, Eye, Globe } from "lucide-react";
import { motion } from "framer-motion";
import AuditLog from "../components/security/AuditLog";

const SecurityFeature = ({ icon: Icon, title, description, status, detail, index }) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: index * 0.07 }}
    className="bg-card border border-border rounded-xl p-5 flex gap-4"
  >
    <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${status === "active" ? "bg-green-500/10" : "bg-yellow-500/10"}`}>
      <Icon className={`w-5 h-5 ${status === "active" ? "text-green-600" : "text-yellow-600"}`} />
    </div>
    <div className="flex-1 min-w-0">
      <div className="flex items-center gap-2 flex-wrap">
        <h3 className="font-semibold text-sm">{title}</h3>
        <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${status === "active" ? "bg-green-500/10 text-green-700" : "bg-yellow-500/10 text-yellow-700"}`}>
          {status === "active" ? "Active" : "Partial"}
        </span>
      </div>
      <p className="text-xs text-muted-foreground mt-1">{description}</p>
      {detail && <p className="text-[11px] text-muted-foreground/70 mt-1.5 font-mono bg-muted/50 px-2 py-1 rounded">{detail}</p>}
    </div>
    <CheckCircle className={`w-4 h-4 flex-shrink-0 mt-0.5 ${status === "active" ? "text-green-500" : "text-yellow-500"}`} />
  </motion.div>
);

const RoleRow = ({ role, color, permissions }) => (
  <div className="flex items-start gap-3 py-3 border-b border-border last:border-0">
    <span className={`text-xs font-bold uppercase px-2 py-1 rounded-full flex-shrink-0 ${color}`}>{role}</span>
    <div className="flex flex-wrap gap-1.5 flex-1">
      {permissions.map((p) => (
        <span key={p} className="text-[11px] bg-muted px-2 py-0.5 rounded text-muted-foreground">{p}</span>
      ))}
    </div>
  </div>
);

export default function SecurityPage() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    UserService.me().then(setUser).catch(() => {});
  }, []);

  if (user?.role !== "admin") {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3 text-center">
        <Lock className="w-10 h-10 text-muted-foreground" />
        <h2 className="font-semibold">Access Restricted</h2>
        <p className="text-sm text-muted-foreground">Only admins can view the security dashboard.</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center">
          <Shield className="w-6 h-6 text-green-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Security & Privacy</h1>
          <p className="text-sm text-muted-foreground">SafeGuard Zambia security posture overview</p>
        </div>
      </div>

      {/* Security Score */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="bg-gradient-to-br from-green-500/10 to-green-500/5 border border-green-200 rounded-2xl p-6 flex items-center gap-6"
      >
        <div className="relative w-20 h-20 flex-shrink-0">
          <svg className="w-20 h-20 -rotate-90" viewBox="0 0 80 80">
            <circle cx="40" cy="40" r="34" fill="none" stroke="hsl(160,60%,85%)" strokeWidth="8" />
            <circle cx="40" cy="40" r="34" fill="none" stroke="hsl(160,60%,42%)" strokeWidth="8"
              strokeDasharray={`${2 * Math.PI * 34 * 0.92} ${2 * Math.PI * 34}`} strokeLinecap="round" />
          </svg>
          <span className="absolute inset-0 flex items-center justify-center text-lg font-bold text-green-700">✓</span>
        </div>
        <div>
          <p className="text-sm font-medium text-green-800">Security Controls</p>
          <p className="text-xs text-green-700/70 mt-1">The backend applies role and record-ownership checks to protected API operations.</p>
        </div>
      </motion.div>

      {/* Security Features */}
      <div>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Active Protections</h2>
        <div className="space-y-3">
          <SecurityFeature index={0} icon={Globe} title="HTTPS — Transport Security" status="hosting-dependent"
            description="Use the application over HTTPS to encrypt data in transit."
            detail="TLS version and HSTS depend on the hosting configuration." />
          <SecurityFeature index={1} icon={Lock} title="Server Storage — Access Controls" status="active"
            description="Records and uploaded files are stored on the server. Storage encryption depends on the hosting configuration."
            detail="The application does not implement app-level AES encryption." />
          <SecurityFeature index={2} icon={Key} title="Evidence File Access" status="active"
            description="Document uploads use an authenticated owner-or-staff check. Files are stored on server disk and are not end-to-end encrypted."
            detail="Access: owner and staff · Storage: server upload directory" />
          <SecurityFeature index={3} icon={Users} title="Role-Based Access Control (RBAC)" status="active"
            description="The backend applies role and record-ownership rules to protected API operations."
            detail="Enforcement: Express API policy checks" />
          <SecurityFeature index={4} icon={Eye} title="Anonymous Case Reporting" status="active"
            description="Survivors can submit reports without revealing their identity. Anonymous cases hide PII from all non-admin users."
            detail="PII fields: masked for responders · Admin-only full access" />
          <SecurityFeature index={5} icon={Shield} title="Panic Alert Privacy" status="active"
            description="Panic alerts are visible only to the triggering user, their assigned responder, and admins."
            detail="RLS: created_by OR responder_email OR role=admin" />
        </div>
      </div>

      {/* RBAC Matrix */}
      <div>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Role Permissions Matrix</h2>
        <div className="bg-card border border-border rounded-xl p-5">
          <RoleRow role="Admin" color="bg-red-500/10 text-red-700"
            permissions={["Full case access", "All alerts", "Manage team", "Delete records", "View analytics", "Security dashboard", "Manage resources"]} />
          <RoleRow role="Responder" color="bg-blue-500/10 text-blue-700"
            permissions={["Assigned cases only", "Acknowledge alerts", "Case messaging", "Add case notes", "View evidence", "View resources"]} />
          <RoleRow role="Survivor" color="bg-purple-500/10 text-purple-700"
            permissions={["Own cases only", "Trigger panic alert", "Own evidence vault", "Own messages", "View resources", "Anonymous reporting"]} />
        </div>
      </div>

      {/* Compliance note */}
      <div className="bg-muted/50 border border-border rounded-xl p-4 flex gap-3">
        <AlertTriangle className="w-4 h-4 text-yellow-600 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-muted-foreground">
          <span className="font-semibold text-foreground">Zambia Data Protection Act Compliance: </span>
          This system is designed in alignment with the Zambia Data Protection Act (2021). Sensitive survivor data is minimized, access-controlled, and protected. For full legal compliance review, consult your organization's data protection officer.
        </p>
      </div>

      {/* Audit Log */}
      <div>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Audit Log</h2>
        <AuditLog />
      </div>
    </div>
  );
}