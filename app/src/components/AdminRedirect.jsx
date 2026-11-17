// Redirects admins away from survivor-only routes (report, panic).
// Admins are dispatchers — they respond, they don't report.

import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";
import { useToast } from "@/components/ui/use-toast";

export default function AdminRedirect({ to = "/beka/cases", reason = "Admins respond to cases — they don't create reports.", children }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (user?.role === "admin") {
      toast({ title: "Admin redirected", description: reason });
      navigate(to, { replace: true });
    }
  }, [user, navigate, to, reason, toast]);

  if (user?.role === "admin") return null;
  return children;
}