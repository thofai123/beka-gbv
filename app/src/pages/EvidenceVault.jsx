import { resolveFileUrl } from "@/lib/file-url";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { useToast } from "@/components/ui/use-toast";
import { Lock, Trash2, Download, FileText, Image, Mic, File } from "lucide-react";
import SurvivorEvidenceUpload from "../components/evidence/SurvivorEvidenceUpload";
import EmptyState from "../components/EmptyState";
import { useAuth } from "@/lib/AuthContext";
import { motion } from "framer-motion";
import moment from "moment";
import { useCases, useEvidence, useLiveEntityInvalidation } from "@/hooks/useEntityQueries";
import { useDeleteEvidence } from "@/hooks/useEntityMutations";
import { EvidenceService } from "@/services/EvidenceService";
import LoadingState from "@/components/LoadingState";

const typeConfig = {
  photo: { icon: Image, label: "Photo / Injury", color: "text-blue-600 bg-blue-500/10" },
  audio: { icon: Mic, label: "Audio Recording", color: "text-purple-600 bg-purple-500/10" },
  document: { icon: FileText, label: "Document", color: "text-orange-600 bg-orange-500/10" },
  zp_form_32: { icon: FileText, label: "ZP Form 32", color: "text-red-600 bg-red-500/10" },
  other: { icon: File, label: "Other", color: "text-gray-600 bg-gray-500/10" },
};

export default function EvidenceVault() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [deleteTarget, setDeleteTarget] = useState(null);
  const { data: files = [], isLoading: loadingFiles } = useEvidence({}, { sort: "-created_date", limit: 200 });
  const { data: cases = [], isLoading: loadingCases } = useCases({}, { sort: "-created_date", limit: 50 });
  const deleteEvidence = useDeleteEvidence();

  useLiveEntityInvalidation(EvidenceService, [["evidence"]]);

  const handleDelete = async () => {
    await deleteEvidence.mutateAsync(deleteTarget.id);
    setDeleteTarget(null);
    toast({ title: "File removed from vault" });
  };

  const loading = loadingFiles || loadingCases;

  if (user?.role === "admin") return null;

  if (loading) return <LoadingState />;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
          <Lock className="w-6 h-6 text-primary" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight">Evidence</h1>
      </div>

      {/* Security Notice */}
      <p className="text-xs text-muted-foreground flex items-center gap-1.5">
        <Lock className="w-3.5 h-3.5 flex-shrink-0" />
        Files are encrypted and only visible to you.
      </p>

      {/* Survivor Upload Section */}
      <SurvivorEvidenceUpload cases={cases} />

      {/* File Grid */}
      {files.length === 0 ? (
        <EmptyState
          icon={Lock}
          title="No evidence stored yet"
          description="Use the upload box above to add photos, recordings, or documents. Everything syncs securely to your account."
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {files.map((file, i) => {
            const cfg = typeConfig[file.file_type] || typeConfig.other;
            const Icon = cfg.icon;
            return (
              <motion.div
                key={file.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className="bg-card border border-border rounded-xl p-4 hover:shadow-md transition-all"
              >
                <div className="flex items-start gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${cfg.color}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate">{file.file_name}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] font-medium bg-muted px-2 py-0.5 rounded-full">{cfg.label}</span>
                      {file.case_ref && (
                        <span className="text-[10px] text-muted-foreground">Case: {file.case_ref}</span>
                      )}
                    </div>
                    {file.description && (
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{file.description}</p>
                    )}
                    <p className="text-[10px] text-muted-foreground mt-1">
                      {moment(file.created_date).format("D MMM YYYY, h:mm A")}
                      {file.file_size_kb ? ` · ${file.file_size_kb}KB` : ""}
                    </p>
                  </div>
                </div>

                {/* Preview for images */}
                {file.file_type === "photo" && file.file_url && (
                  <img
                    src={resolveFileUrl(file.file_url)}
                    alt="Evidence"
                    className="mt-3 w-full h-40 object-cover rounded-lg border border-border"
                  />
                )}

                <div className="flex gap-2 mt-3">
                  <a href={resolveFileUrl(file.file_url)} download={file.file_name || "evidence"} target="_blank" rel="noopener noreferrer" className="flex-1">
                    <Button variant="outline" size="sm" className="w-full gap-1.5 h-8 text-xs">
                      <Download className="w-3 h-3" /> Download
                    </Button>
                  </a>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:text-destructive hover:bg-destructive/10 h-8 px-2"
                    onClick={() => setDeleteTarget(file)}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Delete Confirm */}
      <Drawer open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Delete Evidence?</DrawerTitle>
          </DrawerHeader>
          <div className="px-4 pb-8 space-y-4">
            <p className="text-sm text-muted-foreground">
              Are you sure you want to permanently delete <strong>{deleteTarget?.file_name}</strong>? This cannot be undone.
            </p>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setDeleteTarget(null)}>Cancel</Button>
              <Button variant="destructive" onClick={handleDelete}>Delete Permanently</Button>
            </div>
          </div>
        </DrawerContent>
      </Drawer>
    </div>
  );
}