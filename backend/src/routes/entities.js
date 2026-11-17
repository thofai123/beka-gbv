import express from "express";
import { prisma } from "../db.js";
import { policies, isStaff, isAdmin } from "../policies.js";

const router = express.Router();

// Map entity name -> Prisma model delegate.
const models = {
  AccessCode: prisma.accessCode,
  AuditLog: prisma.auditLog,
  Case: prisma.case,
  CaseUpdate: prisma.caseUpdate,
  EmergencyContact: prisma.emergencyContact,
  EvidenceVault: prisma.evidenceVault,
  IncidentLog: prisma.incidentLog,
  Message: prisma.message,
  Notification: prisma.notification,
  OtpVerification: prisma.otpVerification,
  PanicAlert: prisma.panicAlert,
  Resource: prisma.resource,
  ResponseUnit: prisma.responseUnit,
  StaffMessage: prisma.staffMessage,
  TwoFactorCode: prisma.twoFactorCode,
  User: prisma.user,
  WhatsAppSession: prisma.whatsAppSession,
};

function getModel(name) {
  return { model: models[name], policy: policies[name] };
}

// Parse the ?sort=-created_date style param into Prisma orderBy.
function parseSort(sort) {
  if (!sort) return { created_date: "desc" };
  const desc = sort.startsWith("-");
  const field = desc ? sort.slice(1) : sort;
  return { [field]: desc ? "desc" : "asc" };
}

// Translate a small subset of the app's filter syntax to Prisma `where`.
// Supports equality and `{ field: { $in: [...] } }`.
function parseWhere(raw) {
  if (!raw) return {};
  let obj = raw;
  if (typeof raw === "string") {
    try { obj = JSON.parse(raw); } catch { return {}; }
  }
  const where = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v && typeof v === "object" && !Array.isArray(v) && "$in" in v) {
      where[k] = { in: v.$in };
    } else {
      where[k] = v;
    }
  }
  return where;
}

// Build the ownership filter a non-staff user is restricted to, based on policy.
function ownershipWhere(policy, user) {
  const email = user?.email;
  const fields = policy.ownerFields || ["created_by"];
  if (!email) return { id: "__none__" }; // anonymous sees nothing scoped
  return { OR: fields.map((f) => ({ [f]: email })) };
}

// Compute the read-scope where-clause for the current user.
function readScopeWhere(policy, user) {
  switch (policy.read) {
    case "public":
      return {};
    case "auth":
      return user ? {} : { id: "__none__" };
    case "admin":
      return isAdmin(user) ? {} : { id: "__none__" };
    case "staff":
      return isStaff(user) ? {} : { id: "__none__" };
    case "staff+own":
      if (isStaff(user)) return {};
      return ownershipWhere(policy, user);
    case "own":
      if (policy.adminOverride && isAdmin(user)) return {};
      return ownershipWhere(policy, user);
    default:
      return { id: "__none__" };
  }
}

// Can this user create in this entity?
function canCreate(policy, user) {
  switch (policy.create) {
    case "public": return true;
    case "auth": return !!user;
    case "staff": return isStaff(user);
    case "admin": return isAdmin(user);
    case "none": return false;
    default: return false;
  }
}

// Is this specific record writable (update/delete) by the user?
function canWriteRecord(policy, user, record) {
  if (isAdmin(user)) return true;
  switch (policy.write) {
    case "admin":
      return false;
    case "staff+own":
      if (isStaff(user)) return true;
      return ownsRecord(policy, user, record);
    case "own":
      return ownsRecord(policy, user, record);
    default:
      return false;
  }
}

function ownsRecord(policy, user, record) {
  if (!user?.email) return false;
  const fields = policy.ownerFields || ["created_by"];
  return fields.some((f) => record[f] && record[f] === user.email);
}

// GET /entities/:name  -> list
router.get("/:name", async (req, res, next) => {
  try {
    const { model, policy } = getModel(req.params.name);
    if (!model || !policy) return res.status(404).json({ message: "Unknown entity" });

    const where = readScopeWhere(policy, req.user);
    const orderBy = parseSort(req.query.sort);
    const take = req.query.limit ? Number(req.query.limit) : undefined;
    const skip = req.query.skip ? Number(req.query.skip) : undefined;

    const rows = await model.findMany({ where, orderBy, take, skip });
    res.json(rows);
  } catch (e) { next(e); }
});

// GET /entities/:name/filter -> filtered list (scope + user filter)
router.get("/:name/filter", async (req, res, next) => {
  try {
    const { model, policy } = getModel(req.params.name);
    if (!model || !policy) return res.status(404).json({ message: "Unknown entity" });

    const scope = readScopeWhere(policy, req.user);
    const userWhere = parseWhere(req.query.where);
    const where = { AND: [scope, userWhere] };
    const orderBy = parseSort(req.query.sort);
    const take = req.query.limit ? Number(req.query.limit) : undefined;
    const skip = req.query.skip ? Number(req.query.skip) : undefined;

    const rows = await model.findMany({ where, orderBy, take, skip });
    res.json(rows);
  } catch (e) { next(e); }
});

// GET /entities/:name/:id -> one
router.get("/:name/:id", async (req, res, next) => {
  try {
    const { model, policy } = getModel(req.params.name);
    if (!model || !policy) return res.status(404).json({ message: "Unknown entity" });

    const record = await model.findUnique({ where: { id: req.params.id } });
    if (!record) return res.status(404).json({ message: "Not found" });

    // enforce read scope on the single record
    const scope = readScopeWhere(policy, req.user);
    if (scope.id === "__none__" && !isAdmin(req.user)) {
      return res.status(403).json({ message: "Forbidden" });
    }
    if (policy.read === "own" || policy.read === "staff+own") {
      if (!isStaff(req.user) && !ownsRecord(policy, req.user, record) && !(policy.adminOverride && isAdmin(req.user))) {
        return res.status(403).json({ message: "Forbidden" });
      }
    }
    res.json(record);
  } catch (e) { next(e); }
});

// POST /entities/:name -> create
router.post("/:name", async (req, res, next) => {
  try {
    const { model, policy } = getModel(req.params.name);
    if (!model || !policy) return res.status(404).json({ message: "Unknown entity" });
    if (!canCreate(policy, req.user)) return res.status(403).json({ message: "Forbidden" });

    const data = { ...req.body };
    delete data.id;
    if (req.user?.email && data.created_by === undefined) data.created_by = req.user.email;

    const created = await model.create({ data });
    res.status(201).json(created);
  } catch (e) { next(e); }
});

// PUT /entities/:name/:id -> update
router.put("/:name/:id", async (req, res, next) => {
  try {
    const { model, policy } = getModel(req.params.name);
    if (!model || !policy) return res.status(404).json({ message: "Unknown entity" });

    const existing = await model.findUnique({ where: { id: req.params.id } });
    if (!existing) return res.status(404).json({ message: "Not found" });
    if (!canWriteRecord(policy, req.user, existing)) return res.status(403).json({ message: "Forbidden" });

    const data = { ...req.body };
    delete data.id;
    delete data.created_by;
    delete data.created_date;

    const updated = await model.update({ where: { id: req.params.id }, data });
    res.json(updated);
  } catch (e) { next(e); }
});

// DELETE /entities/:name/:id
router.delete("/:name/:id", async (req, res, next) => {
  try {
    const { model, policy } = getModel(req.params.name);
    if (!model || !policy) return res.status(404).json({ message: "Unknown entity" });

    const existing = await model.findUnique({ where: { id: req.params.id } });
    if (!existing) return res.status(404).json({ message: "Not found" });
    if (!canWriteRecord(policy, req.user, existing)) return res.status(403).json({ message: "Forbidden" });

    await model.delete({ where: { id: req.params.id } });
    res.json({ id: req.params.id, deleted: true });
  } catch (e) { next(e); }
});

export default router;
export { models };
