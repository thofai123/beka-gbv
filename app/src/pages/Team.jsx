import { useState, useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useUsers } from "@/hooks/useEntityQueries";
import { UserService } from "@/services/UserService";
import { apiClient } from "@/api/client";
import {
  Users,
  Shield,
  UserCheck,
  Briefcase,
  Edit2,
  Check,
  X,
  Phone,
  Lock,
  UserPlus,
  Camera,
  Mail,
  Loader2,
  KeyRound,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import EmptyState from "../components/EmptyState";
import { motion } from "framer-motion";

const TEAM_PIN_SESSION_KEY = "beka_team_pin_unlocked";

const roleConfig = {
  admin:     { color: "bg-purple-500/10 text-purple-400 border-purple-500/30", label: "Admin" },
  responder: { color: "bg-blue-500/10 text-blue-400 border-blue-500/30",   label: "Responder" },
  survivor:  { color: "bg-green-500/10 text-green-400 border-green-500/30",  label: "Survivor" },
};

const specLabels = {
  general:    "General",
  counseling: "Counseling",
  legal:      "Legal Aid",
  medical:    "Medical",
  shelter:    "Shelter",
};

async function uploadPhotoFile(file) {
  if (apiClient?.integrations?.Core?.UploadFile) {
    const res = await apiClient.integrations.Core.UploadFile({ file });
    if (res?.file_url) return res.file_url;
  }
  const formData = new FormData();
  formData.append("file", file);
  const token =
    apiClient?.getToken?.() ||
    localStorage.getItem("beka_token") ||
    localStorage.getItem("token") ||
    localStorage.getItem("auth_token") ||
    localStorage.getItem("beka_access_token") ||
    localStorage.getItem("access_token") ||
    "";
  const res = await fetch("/integrations/upload", {
    method: "POST",
    credentials: "include",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Upload failed");
  return data.file_url;
}

function UserCard({ u, isAdmin, isSelf, onRoleChange, onRequestDelete }) {
  const { toast } = useToast();
  const editFileRef = useRef(null);

  const [editing, setEditing]         = useState(false);
  const [fullName, setFullName]       = useState(u.full_name || "");
  const [role, setRole]               = useState(u.role || "survivor");
  const [phone, setPhone]             = useState(u.phone || "");
  const [photo, setPhoto]             = useState(u.profile_picture || "");
  const [uploading, setUploading]     = useState(false);
  const [saving, setSaving]           = useState(false);

  const rc = roleConfig[u.role] || roleConfig.survivor;

  const handleEditPhoto = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadPhotoFile(file);
      setPhoto(url);
      toast({ title: "Photo updated" });
    } catch (err) {
      toast({ title: "Photo upload failed", description: err?.message, variant: "destructive" });
    }
    setUploading(false);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await UserService.update(u.id, {
        full_name: fullName.trim() || u.full_name,
        role,
        phone: phone.trim(),
        profile_picture: photo || null,
      });
      toast({ title: "Team member updated" });
      setEditing(false);
      onRoleChange();
    } catch {
      toast({ title: "Update failed", variant: "destructive" });
    }
    setSaving(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card border border-border rounded-xl p-4"
    >
      <div className="flex items-start gap-3">
        {(editing ? photo : u.profile_picture) ? (
          <img
            src={editing ? photo : u.profile_picture}
            alt={u.full_name || u.email}
            className="w-11 h-11 rounded-full object-cover border border-border flex-shrink-0"
          />
        ) : (
          <div className="w-11 h-11 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
            <span className="text-sm font-semibold text-primary">
              {u.full_name?.charAt(0)?.toUpperCase() || u.email?.charAt(0)?.toUpperCase() || "?"}
            </span>
          </div>
        )}

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <p className="text-sm font-semibold truncate">{u.full_name || "Unnamed"}</p>
            {isSelf && (
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-orange-500/15 text-orange-400 font-semibold">
                You
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground truncate">{u.email}</p>

          {editing ? (
            <div className="mt-3 space-y-2.5">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Full Name</p>
                <Input
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Full Name"
                  className="h-8 text-xs"
                />
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Role</p>
                <Select value={role} onValueChange={setRole}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="survivor">Survivor</SelectItem>
                    <SelectItem value="responder">Responder</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Phone</p>
                <Input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+260 9XX XXX XXX"
                  className="h-8 text-xs"
                />
              </div>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => editFileRef.current?.click()}
                  disabled={uploading}
                  className="h-7 text-xs gap-1"
                >
                  {uploading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Camera className="w-3 h-3" />}
                  {photo ? "Change Photo" : "Upload Photo"}
                </Button>
                <input
                  ref={editFileRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleEditPhoto}
                  className="hidden"
                />
              </div>
              <div className="flex items-center justify-between gap-2 pt-1">
                <div className="flex gap-2">
                  <Button size="sm" onClick={handleSave} disabled={saving || uploading} className="h-7 text-xs gap-1">
                    <Check className="w-3 h-3" /> Save
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setEditing(false)} className="h-7 text-xs gap-1">
                    <X className="w-3 h-3" /> Cancel
                  </Button>
                </div>
                {!isSelf && (
                  <Button
                    type="button"
                    size="sm"
                    variant="destructive"
                    onClick={() => onRequestDelete(u)}
                    className="h-7 text-xs gap-1"
                  >
                    <Trash2 className="w-3 h-3" /> Delete
                  </Button>
                )}
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${rc.color}`}>
                {rc.label}
              </span>
              {u.specialization && u.role === "responder" && (
                <span className="text-[10px] bg-muted text-muted-foreground px-2 py-0.5 rounded-full flex items-center gap-0.5">
                  <Briefcase className="w-2.5 h-2.5" /> {specLabels[u.specialization] || u.specialization}
                </span>
              )}
              {u.phone && (
                <span className="text-[10px] bg-muted text-muted-foreground px-2 py-0.5 rounded-full flex items-center gap-0.5">
                  <Phone className="w-2.5 h-2.5" /> {u.phone}
                </span>
              )}
            </div>
          )}
        </div>

        {isAdmin && !editing && (
          <div className="flex items-center gap-1 flex-shrink-0">
            <Button
              size="icon"
              variant="ghost"
              aria-label="Edit member"
              className="w-7 h-7"
              onClick={() => setEditing(true)}
            >
              <Edit2 className="w-3.5 h-3.5" />
            </Button>
            {!isSelf && (
              <Button
                size="icon"
                variant="ghost"
                aria-label="Delete member"
                className="w-7 h-7 text-destructive hover:text-destructive hover:bg-destructive/10"
                onClick={() => onRequestDelete(u)}
              >
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}

export default function Team() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const fileInputRef = useRef(null);

  const [currentUser, setCurrentUser]   = useState(null);
  const [pinUnlocked, setPinUnlocked]   = useState(() => sessionStorage.getItem(TEAM_PIN_SESSION_KEY) === "1126");
  const [pinInput, setPinInput]         = useState("");
  const [verifyingPin, setVerifyingPin] = useState(false);

  const [showAddAdmin, setShowAddAdmin]     = useState(false);
  const [fullName, setFullName]             = useState("");
  const [email, setEmail]                   = useState("");
  const [phone, setPhone]                   = useState("");
  const [photoUrl, setPhotoUrl]             = useState("");
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [inviting, setInviting]             = useState(false);

  // PIN-confirmed Delete state
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deletePin, setDeletePin]       = useState("");
  const [deleting, setDeleting]         = useState(false);

  const [refreshKey, setRefreshKey] = useState(0);
  const [search, setSearch]         = useState("");

  const { data: users = [], isLoading: loading } = useUsers(
    {}, { sort: "-created_date", limit: 100 }
  );

  useEffect(() => {
    UserService.me().then(setCurrentUser).catch(() => {});
  }, []);

  const isAdmin = currentUser?.role === "admin";

  const handleUnlockPin = async (e) => {
    e?.preventDefault();
    if (!pinInput.trim()) return;
    setVerifyingPin(true);
    try {
      await apiClient.functions.invoke("verifyAdminPin", { pin: pinInput.trim() });
      sessionStorage.setItem(TEAM_PIN_SESSION_KEY, pinInput.trim());
      setPinUnlocked(true);
      toast({ title: "Team Console Unlocked" });
    } catch (err) {
      toast({
        title: "Incorrect PIN",
        description: err?.message || "Enter the 4-digit Admin Team PIN to continue.",
        variant: "destructive",
      });
    }
    setVerifyingPin(false);
  };

  const handlePhotoSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingPhoto(true);
    try {
      const url = await uploadPhotoFile(file);
      setPhotoUrl(url);
      toast({ title: "Security photo uploaded" });
    } catch (err) {
      toast({ title: "Photo upload failed", description: err?.message || "Try JPG or PNG", variant: "destructive" });
    }
    setUploadingPhoto(false);
  };

  const handleInviteAdmin = async (e) => {
    e.preventDefault();
    if (!fullName.trim() || !email.trim() || !phone.trim()) {
      toast({ title: "Full name, email, and phone line are required", variant: "destructive" });
      return;
    }
    setInviting(true);
    try {
      const savedPin = sessionStorage.getItem(TEAM_PIN_SESSION_KEY) || pinInput.trim();
      const res = await apiClient.functions.invoke("inviteAdmin", {
        pin: savedPin,
        full_name: fullName.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim(),
        profile_picture: photoUrl || null,
      });
      const data = res?.data || {};
      toast({
        title: `Admin Added: ${fullName.trim()}`,
        description: data.email_sent
          ? `Invitation & login credentials emailed to ${email.trim()}`
          : `Admin role saved for ${email.trim()} (will auto-unlock Admin Console on login)`,
      });
      setFullName("");
      setEmail("");
      setPhone("");
      setPhotoUrl("");
      setShowAddAdmin(false);
      queryClient.invalidateQueries({ queryKey: ["users"] });
      setRefreshKey((k) => k + 1);
    } catch (err) {
      toast({
        title: "Could not add admin",
        description: err?.message || "Please verify the details and try again.",
        variant: "destructive",
      });
    }
    setInviting(false);
  };

  const handleConfirmDelete = async (e) => {
    e?.preventDefault();
    if (!deleteTarget) return;
    if (!deletePin.trim()) {
      toast({ title: "Enter the 1126 security PIN to confirm deletion", variant: "destructive" });
      return;
    }
    setDeleting(true);
    try {
      await apiClient.functions.invoke("deleteTeamMember", {
        user_id: deleteTarget.id,
        pin: deletePin.trim(),
      });
      toast({
        title: "Team Member Deleted",
        description: `${deleteTarget.full_name || deleteTarget.email} has been removed.`,
      });
      setDeleteTarget(null);
      setDeletePin("");
      queryClient.invalidateQueries({ queryKey: ["users"] });
      setRefreshKey((k) => k + 1);
    } catch (err) {
      toast({
        title: "Deletion blocked",
        description: err?.message || "Incorrect PIN or action not allowed.",
        variant: "destructive",
      });
    }
    setDeleting(false);
  };

  if (!pinUnlocked) {
    return (
      <div className="max-w-sm mx-auto px-4 pt-12">
        <div className="bg-card border border-border rounded-2xl p-6 text-center space-y-4 shadow-xl">
          <div className="w-12 h-12 rounded-2xl bg-orange-500/15 border border-orange-500/30 text-orange-400 flex items-center justify-center mx-auto">
            <Lock className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight">Admin Team Access</h1>
            <p className="text-xs text-muted-foreground mt-1">
              Enter the security PIN to view team members and manage administrators.
            </p>
          </div>
          <form onSubmit={handleUnlockPin} className="space-y-3">
            <div className="relative">
              <KeyRound className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
              <Input
                type="password"
                inputMode="numeric"
                maxLength={6}
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value)}
                placeholder="Enter Admin PIN"
                className="pl-9 text-center tracking-[0.35em] font-bold text-base h-11"
                autoFocus
              />
            </div>
            <Button type="submit" disabled={verifyingPin || !pinInput.trim()} className="w-full h-11 font-semibold">
              {verifyingPin ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Unlock Team Management
            </Button>
          </form>
        </div>
      </div>
    );
  }

  const filtered = search
    ? users.filter((u) =>
        u.full_name?.toLowerCase().includes(search.toLowerCase()) ||
        u.email?.toLowerCase().includes(search.toLowerCase()) ||
        u.phone?.includes(search)
      )
    : users;

  const admins     = filtered.filter((u) => u.role === "admin");
  const responders = filtered.filter((u) => u.role === "responder");
  const survivors  = filtered.filter((u) => u.role === "survivor");

  const renderSection = (title, userList, icon) => (
    userList.length === 0 ? null : (
      <div>
        <div className="flex items-center gap-2 mb-3">
          {icon}
          <h2 className="font-semibold text-sm">{title}</h2>
          <span className="text-xs text-muted-foreground">({userList.length})</span>
        </div>
        <div className="grid grid-cols-1 gap-3">
          {userList.map((u) => (
            <UserCard
              key={u.id + refreshKey}
              u={u}
              isAdmin={isAdmin}
              isSelf={currentUser?.email?.toLowerCase() === u.email?.toLowerCase()}
              onRoleChange={() => {
                queryClient.invalidateQueries({ queryKey: ["users"] });
                setRefreshKey((k) => k + 1);
              }}
              onRequestDelete={(target) => {
                setDeleteTarget(target);
                setDeletePin("");
              }}
            />
          ))}
        </div>
      </div>
    )
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 pt-4 pb-8 space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Team & Admins</h1>
          <p className="text-xs text-muted-foreground">{admins.length} admin(s) · {users.length} total users</p>
        </div>
        <Button onClick={() => setShowAddAdmin((v) => !v)} size="sm" className="gap-1.5">
          <UserPlus className="w-4 h-4" /> {showAddAdmin ? "Close" : "Add Admin"}
        </Button>
      </div>

      {showAddAdmin && (
        <form onSubmit={handleInviteAdmin} className="bg-card border border-orange-500/30 rounded-2xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold flex items-center gap-1.5">
              <Shield className="w-4 h-4 text-orange-400" /> Assign New Administrator
            </h2>
            <span className="text-[10px] text-muted-foreground">PIN Verified</span>
          </div>

          <div className="flex items-center gap-3 pt-1">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-14 h-14 rounded-full bg-muted border border-dashed border-border flex flex-col items-center justify-center overflow-hidden flex-shrink-0 hover:border-primary transition-colors"
            >
              {photoUrl ? (
                <img src={photoUrl} alt="Admin security photo" className="w-full h-full object-cover" />
              ) : uploadingPhoto ? (
                <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
              ) : (
                <>
                  <Camera className="w-4 h-4 text-muted-foreground" />
                  <span className="text-[9px] text-muted-foreground mt-0.5">Photo</span>
                </>
              )}
            </button>
            <div className="text-xs text-muted-foreground">
              <p className="font-medium text-foreground">Security Photo (Optional)</p>
              <p className="text-[11px]">Upload an ID/profile photo for verification.</p>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handlePhotoSelect}
                className="hidden"
              />
            </div>
          </div>

          <div className="space-y-1">
            <Label className="text-xs">Full Name *</Label>
            <Input
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="e.g. Chanda Mwale"
              required
            />
          </div>

          <div className="space-y-1">
            <Label className="text-xs">Email Address *</Label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@organization.org"
              required
            />
          </div>

          <div className="space-y-1">
            <Label className="text-xs">Contact Phone Line *</Label>
            <Input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+260 97X XXX XXX"
              required
            />
          </div>

          <div className="flex gap-2 pt-2">
            <Button type="submit" disabled={inviting || uploadingPhoto} className="flex-1 gap-1.5">
              {inviting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
              Assign & Send Email Invite
            </Button>
            <Button type="button" variant="ghost" onClick={() => setShowAddAdmin(false)}>
              Cancel
            </Button>
          </div>
        </form>
      )}

      <Input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search by name, email, or phone..."
      />

      {users.length === 0 ? (
        <EmptyState icon={Users} title="No team members" description="Users will appear here once added." />
      ) : (
        <div className="space-y-6">
          {renderSection("Administrators", admins, <Shield className="w-4 h-4 text-purple-400" />)}
          {renderSection("Responders", responders, <UserCheck className="w-4 h-4 text-blue-400" />)}
          {renderSection("Users / Survivors", survivors, <Users className="w-4 h-4 text-green-400" />)}
        </div>
      )}

      {/* PIN-Gated Delete Confirmation Dialog */}
      <Dialog
        open={!!deleteTarget}
        onOpenChange={(open) => {
          if (!open) {
            setDeleteTarget(null);
            setDeletePin("");
          }
        }}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <Trash2 className="w-4 h-4" /> Delete Team Member
            </DialogTitle>
            <DialogDescription>
              You are about to permanently remove{" "}
              <strong className="text-foreground">
                {deleteTarget?.full_name || deleteTarget?.email}
              </strong>{" "}
              ({deleteTarget?.role || "member"}). Enter the security PIN to confirm.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleConfirmDelete} className="space-y-4 pt-1">
            <div className="space-y-1.5">
              <Label className="text-xs">Security PIN *</Label>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                <Input
                  type="password"
                  inputMode="numeric"
                  maxLength={6}
                  value={deletePin}
                  onChange={(e) => setDeletePin(e.target.value)}
                  placeholder="Enter 4-digit PIN"
                  className="pl-9 text-center tracking-[0.35em] font-bold h-11"
                  autoFocus
                />
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setDeleteTarget(null);
                  setDeletePin("");
                }}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="destructive"
                disabled={deleting || !deletePin.trim()}
                className="gap-1.5"
              >
                {deleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                Confirm Delete
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
