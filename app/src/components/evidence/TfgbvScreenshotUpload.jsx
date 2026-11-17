import { useRef, useState } from "react";
import { apiClient } from "@/api/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { Image as ImageIcon, Loader2, ShieldCheck, X } from "lucide-react";

const MAX_SCREENSHOTS = 5;
const MAX_BYTES = 8 * 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

// Controlled: the parent owns `items` ([{ url, name, preview }]) so they survive step changes.
export default function TfgbvScreenshotUpload({ items, onChange }) {
  const { toast } = useToast();
  const inputRef = useRef(null);
  const [uploading, setUploading] = useState(false);

  const handleSelect = async (event) => {
    const files = Array.from(event.target.files || []);
    event.target.value = "";
    if (files.length === 0) return;

    const room = MAX_SCREENSHOTS - items.length;
    if (room <= 0) {
      toast({ title: `You can add up to ${MAX_SCREENSHOTS} screenshots`, variant: "destructive" });
      return;
    }
    if (files.length > room) {
      toast({ title: `Only ${room} more screenshot(s) can be added`, description: "Extra files were skipped." });
    }

    setUploading(true);
    const added = [];
    for (const file of files.slice(0, room)) {
      if (!ALLOWED_TYPES.includes(file.type)) {
        toast({ title: `${file.name} was skipped`, description: "Use a JPG, PNG or WebP image.", variant: "destructive" });
        continue;
      }
      if (file.size > MAX_BYTES) {
        toast({ title: `${file.name} is too large`, description: "Each screenshot must be under 8 MB.", variant: "destructive" });
        continue;
      }
      try {
        const { file_url } = await apiClient.integrations.Core.UploadFile({ file });
        added.push({ url: file_url, name: file.name, preview: URL.createObjectURL(file) });
      } catch (err) {
        toast({ title: `Could not upload ${file.name}`, description: err?.message || "Please try again.", variant: "destructive" });
      }
    }
    setUploading(false);
    if (added.length > 0) onChange([...items, ...added]);
  };

  const remove = (index) => {
    const item = items[index];
    if (item?.preview) URL.revokeObjectURL(item.preview);
    onChange(items.filter((_, i) => i !== index));
  };

  return (
    <div className="bg-card border border-border rounded-xl p-4 space-y-4">
      <div className="flex items-center gap-2">
        <ShieldCheck className="w-4 h-4 text-primary" />
        <h3 className="font-semibold text-sm">Screenshot evidence</h3>
      </div>
      <ul className="text-xs text-muted-foreground space-y-1 list-disc pl-4">
        <li>Optional. You can submit your report without screenshots.</li>
        <li>Capture the whole screen so the sender's name or number, the date and the time are visible.</li>
        <li>Keep the original messages and posts. Do not delete them after taking screenshots.</li>
      </ul>
      <input
        ref={inputRef}
        type="file"
        multiple
        className="hidden"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleSelect}
      />
      <div className="flex items-center gap-3">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={uploading || items.length >= MAX_SCREENSHOTS}
          onClick={() => inputRef.current?.click()}
        >
          {uploading ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <ImageIcon className="w-4 h-4 mr-1" />}
          Add screenshots
        </Button>
        <span className="text-xs text-muted-foreground">{items.length}/{MAX_SCREENSHOTS}</span>
      </div>
      {items.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
          {items.map((item, i) => (
            <div key={item.url} className="relative aspect-square rounded-lg overflow-hidden border border-border bg-muted">
              <img src={item.preview} alt={item.name} className="w-full h-full object-cover" />
              <button
                type="button"
                aria-label={`Remove ${item.name}`}
                disabled={uploading}
                onClick={() => remove(i)}
                className="absolute top-1 right-1 rounded-full bg-background/90 p-1 shadow"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
