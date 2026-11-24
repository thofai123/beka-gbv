import { useState } from "react";
import { apiClient } from "@/api/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/lib/AuthContext";
import { FileText, Image, Loader2, Upload, ShieldCheck } from "lucide-react";
import { EvidenceService } from "@/services/EvidenceService";



export default function SurvivorEvidenceUpload({ cases, onUploaded }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState({ case_id: "", description: "", file: null, file_type: "document" });

  const handleFileSelect = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setForm((prev) => ({
      ...prev,
      file,
      file_type: file.type.startsWith("image/") ? "photo" : "document",
    }));
  };

  const uploadEvidence = async () => {
    if (!form.file) {
      toast({ title: "Select a photo or document", variant: "destructive" });
      return;
    }

    setUploading(true);
    try {
      const linkedCase = cases.find((item) => item.id === form.case_id);
      const { file_url } = await apiClient.integrations.Core.UploadFile({ file: form.file });

      const evidence = await EvidenceService.create({
        file_url,
        file_name: form.file.name,
        file_type: form.file_type,
        description: form.description,
        case_id: form.case_id || "",
        case_ref: linkedCase?.case_id || "",
        file_size_kb: Math.round(form.file.size / 1024),
        is_sensitive: true,
      });

      setForm({ case_id: "", description: "", file: null, file_type: "document" });
      await onUploaded?.();
      toast({ title: "Evidence saved", description: linkedCase?.case_id ? `Linked to ${linkedCase.case_id}.` : "Saved securely." });
    } catch (err) {
      toast({ title: "Upload failed", description: err?.message || "Could not save the file. Please try again.", variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  if (user?.role === "admin") return null;

  return (
    <Card className="border-primary/20 bg-primary/5 shadow-sm">
      <CardHeader className="space-y-3 p-4 sm:p-6">
        <div className="flex items-center justify-between gap-3 min-w-0">
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg leading-snug break-words">
            <ShieldCheck className="w-5 h-5 text-primary flex-shrink-0" />
            <span className="break-words">Evidence Upload</span>
          </CardTitle>
          <Badge variant="outline" className="border-primary/30 text-primary w-fit flex-shrink-0">Secure</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 p-4 pt-0 sm:p-6 sm:pt-0 min-w-0">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <p className="text-sm font-medium">Case ID <span className="font-normal text-muted-foreground">(optional)</span></p>
            {cases.length === 0 ? (
              <p className="text-xs text-muted-foreground border border-input rounded-md px-3 py-2.5 bg-background">
                No cases yet — you can still upload, or report an incident to link it.
              </p>
            ) : (
              <Select value={form.case_id || "none"} onValueChange={(value) => setForm((prev) => ({ ...prev, case_id: value === "none" ? "" : value }))}>
                <SelectTrigger className="bg-background"><SelectValue placeholder="Choose your case" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No linked case</SelectItem>
                  {cases.filter((item) => item.id).map((item) => (
                    <SelectItem key={item.id} value={item.id}>{item.case_id || item.id}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          <label className="space-y-2 cursor-pointer">
            <p className="text-sm font-medium">Photo or document</p>
            <div className="h-10 rounded-md border border-input bg-background px-3 flex items-center gap-2 text-sm">
              {form.file_type === "photo" ? <Image className="w-4 h-4 text-primary" /> : <FileText className="w-4 h-4 text-primary" />}
              <span className="truncate text-muted-foreground">{form.file ? form.file.name : "Select file"}</span>
            </div>
            <input type="file" className="hidden" accept="image/*,.pdf,.doc,.docx" onChange={handleFileSelect} />
          </label>
        </div>

        <div className="space-y-2">
          <Textarea
            value={form.description}
            onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
            placeholder="Add a note (optional)"
            rows={2}
            className="bg-background"
          />
        </div>

        <div className="flex items-center justify-end gap-3 min-w-0">
          <span className="text-xs text-muted-foreground flex-shrink-0">🔒 Access-controlled</span>
          <Button onClick={uploadEvidence} disabled={uploading || !form.file} className="gap-2 flex-shrink-0">
            {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
            <span>Upload</span>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}