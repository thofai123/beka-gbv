import { Badge } from "@/components/ui/badge";

const riskConfig = {
  low: { bg: "bg-green-500/10", text: "text-green-600", border: "border-green-200", label: "Low" },
  medium: { bg: "bg-yellow-500/10", text: "text-yellow-600", border: "border-yellow-200", label: "Medium" },
  high: { bg: "bg-orange-500/10", text: "text-orange-600", border: "border-orange-200", label: "High" },
  critical: { bg: "bg-red-500/10", text: "text-red-600", border: "border-red-200", label: "Critical" },
};

export default function RiskBadge({ level }) {
  const config = riskConfig[level] || riskConfig.medium;
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${config.bg} ${config.text} border ${config.border}`}>
      {config.label}
    </span>
  );
}