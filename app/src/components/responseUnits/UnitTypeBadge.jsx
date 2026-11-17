const config = {
  police: { label: "Police", color: "bg-blue-500/10 text-blue-600 border-blue-200" },
  hospital: { label: "Hospital", color: "bg-red-500/10 text-red-600 border-red-200" },
  ngo: { label: "NGO", color: "bg-purple-500/10 text-purple-600 border-purple-200" },
  social_services: { label: "Social Services", color: "bg-green-500/10 text-green-600 border-green-200" },
  shelter: { label: "Shelter", color: "bg-orange-500/10 text-orange-600 border-orange-200" },
  legal_aid: { label: "Legal Aid", color: "bg-yellow-500/10 text-yellow-600 border-yellow-200" },
  vsu: { label: "VSU", color: "bg-blue-500/10 text-blue-600 border-blue-200" },
  osc: { label: "OSC", color: "bg-purple-500/10 text-purple-600 border-purple-200" },
  other: { label: "Other", color: "bg-gray-500/10 text-gray-600 border-gray-200" },
};

export default function UnitTypeBadge({ type }) {
  const c = config[type] || config.other;
  return (
    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${c.color}`}>
      {c.label}
    </span>
  );
}

export const UNIT_TYPE_LABELS = Object.fromEntries(Object.entries(config).map(([k, v]) => [k, v.label]));