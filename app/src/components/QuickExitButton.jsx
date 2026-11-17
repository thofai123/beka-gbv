import { X } from "lucide-react";
import { quickExit } from "@/lib/quickExit";
import { haptic } from "@/lib/haptics";

export default function QuickExitButton({ className = "" }) {
  const handleExit = () => {
    haptic.medium();
    quickExit();
  };

  return null;









}