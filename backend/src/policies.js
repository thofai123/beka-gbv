// Access-control policy per entity, derived from the original entity RLS rules.
//
// For each model we declare:
//   create: who may create        ('public' | 'auth' | 'staff' | 'admin' | 'none')
//   read:   read scope             ('public' | 'auth' | 'own' | 'staff+own' | 'staff' | 'admin')
//   write:  update/delete scope    ('own' | 'staff+own' | 'admin')
//   ownerField: field that identifies the owner (defaults to 'created_by' = email)
//
// Scope meanings for non-admins:
//   own        -> only records they created (or own via ownerField)
//   staff+own  -> admins/responders see all; everyone else sees only their own
//   staff      -> admins/responders only
//   public     -> everyone (even anonymous)
//   auth       -> any logged-in user
//   admin      -> admins only
//
// 'staff' = role in {admin, responder}. Admins always have full access.

export const STAFF_ROLES = ["admin", "responder"];

export const policies = {
  AccessCode: {
    create: "admin",
    read: "auth",          // app reads active codes during redemption
    write: "admin",
  },
  AuditLog: {
    create: "auth",
    read: "admin",
    write: "admin",
  },
  Case: {
    create: "auth",
    read: "staff+own",
    write: "staff+own",
    // a case is "owned" by its creator, reporter, or assigned responder
    ownerFields: ["created_by", "reporter_email", "assigned_responder"],
  },
  CaseUpdate: {
    create: "auth",
    read: "staff+own",
    write: "staff+own",
  },
  EmergencyContact: {
    create: "auth",
    read: "own",
    write: "own",
  },
  EvidenceVault: {
    create: "auth",
    read: "staff+own",
    write: "staff+own",
  },
  IncidentLog: {
    create: "auth",
    read: "own",           // private survivor logs; admin override handled below
    write: "own",
    adminOverride: true,
  },
  Message: {
    create: "auth",
    read: "staff+own",
    write: "staff+own",
  },
  Notification: {
    create: "auth",
    read: "own",
    write: "own",
    ownerFields: ["recipient_email"],
    adminOverride: true,
  },
  OtpVerification: {
    create: "public",
    read: "admin",
    write: "auth",
  },
  PanicAlert: {
    create: "auth",        // original was create:false (server-only); we allow via triggerEmergency fn
    read: "staff+own",
    write: "staff+own",
    ownerFields: ["created_by", "responder_email"],
  },
  Resource: {
    create: "admin",
    read: "public",
    write: "admin",
  },
  ResponseUnit: {
    create: "admin",
    read: "public",
    write: "admin",
  },
  StaffMessage: {
    create: "staff",
    read: "staff",
    write: "staff+own",
  },
  TwoFactorCode: {
    create: "public",
    read: "own",
    write: "auth",
    ownerFields: ["user_email"],
    adminOverride: true,
  },
  User: {
    create: "admin",
    read: "staff",
    write: "admin",
  },
  WhatsAppSession: {
    create: "public",
    read: "admin",
    write: "auth",
  },
};

export function isStaff(user) {
  return !!user && STAFF_ROLES.includes(user.role);
}

export function isAdmin(user) {
  return !!user && user.role === "admin";
}
