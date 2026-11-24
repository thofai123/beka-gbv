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
    read: "admin",         // codes are redeemed only through the backend function
    write: "admin",
  },
  AuditLog: {
    create: "staff",
    read: "admin",
    write: "none",
  },
  Case: {
    create: "auth",
    read: "staff+own",
    write: "staff+own",
    // a case is "owned" by its creator, reporter, or assigned responder
    ownerFields: ["created_by", "reporter_email", "assigned_responder"],
  },
  CaseUpdate: {
    create: "staff",
    read: "staff+own",
    write: "staff",
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
    create: "staff",
    read: "own",
    write: "own",
    ownerFields: ["recipient_email"],
    adminOverride: true,
  },
  OtpVerification: {
    create: "none",
    read: "none",
    write: "none",
  },
  PanicAlert: {
    create: "none",
    read: "staff+own",
    write: "staff",
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
    create: "none",
    read: "none",
    write: "none",
  },
  User: {
    create: "admin",
    read: "staff",
    write: "admin",
  },
  WhatsAppSession: {
    create: "none",
    read: "admin",
    write: "none",
  },
};

export function isStaff(user) {
  return !!user && STAFF_ROLES.includes(user.role);
}

export function isAdmin(user) {
  return !!user && user.role === "admin";
}
