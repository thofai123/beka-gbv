const config = {
  available: { label: "Available", color: "bg-green-500/10 text-green-600 border-green-200", dot: "bg-green-500" },
  busy: { label: "Busy", color: "bg-yellow-500/10 text-yellow-600 border-yellow-200", dot: "bg-yellow-500" },
  off_duty: { label: "Off-duty", color: "bg-gray-500/10 text-gray-600 border-gray-200", dot: "bg-gray-400" },
};

export default function UnitStatusBadge({ status }) {
  const c = config[status] || config.available;
  return (
    <span className={`inline-flex items-center gap-1.5 text-[10px] font-semibold px-2 py-0.5 rounded-full border ${c.color}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
      {c.label}
    </span>
  );
}