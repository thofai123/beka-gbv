import { resolveFileUrl } from "@/lib/file-url";
import { Button } from "@/components/ui/button";
import { Image, Mic, FileText, File, Download, Lock } from "lucide-react";
import { motion } from "framer-motion";
import moment from "moment";

const typeConfig = {
  photo: { icon: Image, label: "Photo", color: "text-blue-600 bg-blue-500/10" },
  audio: { icon: Mic, label: "Audio", color: "text-purple-600 bg-purple-500/10" },
  document: { icon: FileText, label: "Document", color: "text-orange-600 bg-orange-500/10" },
  zp_form_32: { icon: FileText, label: "ZP Form 32", color: "text-red-600 bg-red-500/10" },
  other: { icon: File, label: "Other", color: "text-gray-600 bg-gray-500/10" },
};

export default function CaseEvidenceSection({ evidence }) {
  return (
    <div className="bg-card border border-border rounded-xl p-4">
      <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
        <Lock className="w-4 h-4 text-primary" /> Evidence
      </h3>
      {evidence.length === 0 ? (
        <p className="text-sm text-muted-foreground">No evidence submitted yet</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {evidence.map((file, i) => {
            const cfg = typeConfig[file.file_type] || typeConfig.other;
            const Icon = cfg.icon;
            return (
              <motion.div
                key={file.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className="border border-border rounded-lg p-3"
              >
                <div className="flex items-start gap-3">
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${cfg.color}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate">{file.file_name}</p>
                    {file.description && (
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{file.description}</p>
                    )}
                    <p className="text-[10px] text-muted-foreground mt-1">
                      {moment(file.created_date).fromNow()}
                    </p>
                  </div>
                  <a href={resolveFileUrl(file.file_url)} target="_blank" rel="noopener noreferrer" className="flex-shrink-0">
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
                      <Download className="w-4 h-4" />
                    </Button>
                  </a>
                </div>

                {file.file_type === "photo" && file.file_url && (
                  <img
                    src={resolveFileUrl(file.file_url)}
                    alt="Evidence"
                    className="mt-3 h-36 w-full object-cover rounded-lg border border-border"
                  />
                )}
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}