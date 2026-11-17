const statusConfig = {
  reported: { bg: "bg-blue-500/10", text: "text-blue-600", border: "border-blue-200", label: "Reported" },
  assigned: { bg: "bg-purple-500/10", text: "text-purple-600", border: "border-purple-200", label: "Assigned" },
  in_progress: { bg: "bg-orange-500/10", text: "text-orange-600", border: "border-orange-200", label: "In Progress" },
  resolved: { bg: "bg-green-500/10", text: "text-green-600", border: "border-green-200", label: "Resolved" },
  closed: { bg: "bg-gray-500/10", text: "text-gray-600", border: "border-gray-200", label: "Closed" },
};

export default function StatusBadge({ status }) {
  const config = statusConfig[status] || statusConfig.reported;
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${config.bg} ${config.text} border ${config.border}`}>
      {config.label}
    </span>
  );
}