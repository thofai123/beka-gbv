import { useState, useEffect } from "react";
import { useUsers } from "@/hooks/useEntityQueries";
import { UserService } from "@/services/UserService";
import { Users, Shield, UserCheck, Briefcase, Edit2, Check, X, Phone } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import EmptyState from "../components/EmptyState";
import { motion } from "framer-motion";

const roleConfig = {
  admin:     { color: "bg-purple-500/10 text-purple-600 border-purple-200", label: "Admin" },
  responder: { color: "bg-blue-500/10 text-blue-600 border-blue-200",   label: "Responder" },
  survivor:  { color: "bg-green-500/10 text-green-600 border-green-200",  label: "Survivor" },
};

const specLabels = {
  general:   "General",
  counseling:"Counseling",
  legal:     "Legal Aid",
  medical:   "Medical",
  shelter:   "Shelter",
};

function UserCard({ u, isAdmin, onRoleChange }) {
  const { toast }             = useToast();
  const [editing, setEditing] = useState(false);
  const [role, setRole]       = useState(u.role || "survivor");
  const [phone, setPhone]     = useState(u.phone || "");
  const [saving, setSaving]   = useState(false);

  const rc = roleConfig[u.role] || roleConfig.survivor;

  const handleSave = async () => {
    setSaving(true);
    try {
      await UserService.update(u.id, { role, phone });
      toast({ title: "User updated" });
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
        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
          <span className="text-sm font-semibold text-primary">
            {u.full_name?.charAt(0) || u.email?.charAt(0) || "?"}
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold truncate">{u.full_name || "Unnamed"}</p>
          <p className="text-xs text-muted-foreground truncate">{u.email}</p>

          {editing ? (
            <div className="mt-3 space-y-2">
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
              <div className="flex gap-2 pt-1">
                <Button size="sm" onClick={handleSave} disabled={saving} className="h-7 text-xs gap-1">
                  <Check className="w-3 h-3" /> Save
                </Button>
                <Button size="sm" variant="outline" onClick={() => setEditing(false)} className="h-7 text-xs gap-1">
                  <X className="w-3 h-3" /> Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${rc.color}`}>
                {rc.label}
              </span>
              {u.specialization && (
                <span className="text-[10px] bg-muted text-muted-foreground px-2 py-0.5 rounded-full flex items-center gap-0.5">
                  <Briefcase className="w-2.5 h-2.5" /> {specLabels[u.specialization] || u.specialization}
                </span>
              )}
              {u.phone && (
                <span className="text-[10px] bg-muted text-muted-foreground px-2 py-0.5 rounded-full flex items-center gap-0.5">
                  <Phone className="w-2.5 h-2.5" /> {u.phone}
                </span>
              )}
              {u.is_available === false && (
                <span className="text-[10px] bg-red-500/10 text-red-600 px-2 py-0.5 rounded-full">Unavailable</span>
              )}
            </div>
          )}
        </div>

        {isAdmin && !editing && (
          <Button
            size="icon"
            variant="ghost"
            className="w-7 h-7 flex-shrink-0"
            onClick={() => setEditing(true)}
          >
            <Edit2 className="w-3.5 h-3.5" />
          </Button>
        )}
      </div>
    </motion.div>
  );
}

export default function Team() {
  const [currentUser, setCurrentUser]   = useState(null);
  const [refreshKey, setRefreshKey]     = useState(0);
  const [search, setSearch]             = useState("");

  const { data: users = [], isLoading: loading } = useUsers(
    {}, { sort: "-created_date", limit: 100 }
  );

  useEffect(() => {
    UserService.me().then(setCurrentUser).catch(() => {});
  }, []);

  const isAdmin    = currentUser?.role === "admin";
  const filtered   = search
    ? users.filter((u) =>
        u.full_name?.toLowerCase().includes(search.toLowerCase()) ||
        u.email?.toLowerCase().includes(search.toLowerCase()) ||
        u.phone?.includes(search)
      )
    : users;

  const admins     = filtered.filter((u) => u.role === "admin");
  const responders = filtered.filter((u) => u.role === "responder");
  const survivors  = filtered.filter((u) => u.role === "survivor");
  const unassigned = filtered.filter((u) => !u.role);

  const renderSection = (title, userList, icon) => (
    userList.length === 0 ? null : (
      <div>
        <div className="flex items-center gap-2 mb-3">
          {icon}
          <h2 className="font-semibold">{title}</h2>
          <span className="text-xs text-muted-foreground">({userList.length})</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {userList.map((u) => (
            <UserCard
              key={u.id + refreshKey}
              u={u}
              isAdmin={isAdmin}
              onRoleChange={() => setRefreshKey((k) => k + 1)}
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
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Team</h1>
          <p className="text-sm text-muted-foreground">{users.length} members</p>
        </div>
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, email, phone..."
          className="w-full sm:w-64"
        />
      </div>

      {users.length === 0 ? (
        <EmptyState icon={Users} title="No team members" description="Users will appear here once they sign up." />
      ) : (
        <div className="space-y-8">
          {renderSection("Administrators", admins, <Shield className="w-4 h-4 text-purple-500" />)}
          {renderSection("Responders", responders, <UserCheck className="w-4 h-4 text-blue-500" />)}
          {renderSection("Survivors", survivors, <Users className="w-4 h-4 text-green-500" />)}
          {renderSection("Unassigned", unassigned, <Users className="w-4 h-4 text-gray-400" />)}
        </div>
      )}
    </div>
  );
}