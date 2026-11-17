import { Phone, Globe, MapPin, Clock, Share2, MessageSquare, Navigation } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

const typeConfig = {
  vsu: { label: "Victim Support Unit", color: "bg-blue-500/10 text-blue-700 border-blue-200", icon: "🚔" },
  osc: { label: "One-Stop Centre", color: "bg-purple-500/10 text-purple-700 border-purple-200", icon: "🧡" },
  shelter: { label: "Shelter / Safe House", color: "bg-green-500/10 text-green-700 border-green-200", icon: "🏠" },
  legal_aid: { label: "Legal Aid", color: "bg-orange-500/10 text-orange-700 border-orange-200", icon: "⚖️" },
  medical: { label: "Health Support", color: "bg-red-500/10 text-red-700 border-red-200", icon: "💊" },
  counseling: { label: "Counselling", color: "bg-teal-500/10 text-teal-700 border-teal-200", icon: "💚" },
  hotline: { label: "Hotline", color: "bg-yellow-500/10 text-yellow-700 border-yellow-200", icon: "📞" },
  police: { label: "Police", color: "bg-gray-500/10 text-gray-700 border-gray-200", icon: "🚔" },
  other: { label: "Other Support", color: "bg-muted text-muted-foreground border-border", icon: "ℹ️" },
};

function formatDistance(km) {
  if (km == null) return null;
  return km < 1 ? `${Math.round(km * 1000)}m away` : `${km.toFixed(1)}km away`;
}

export default function ResourceCard({ resource, distance, index = 0, onShareToCase, cases = [] }) {
  const config = typeConfig[resource.type] || typeConfig.other;

  const handleCall = () => {
    if (resource.phone) window.open(`tel:${resource.phone}`, "_self");
  };

  const handleWhatsApp = () => {
    if (resource.whatsapp) {
      const cleaned = resource.whatsapp.replace(/\D/g, "");
      window.open(`https://wa.me/${cleaned}`, "_blank");
    }
  };

  const handleDirections = () => {
    if (resource.location_lat && resource.location_lng) {
      window.open(`https://maps.google.com/?q=${resource.location_lat},${resource.location_lng}`, "_blank");
    } else if (resource.address) {
      window.open(`https://maps.google.com/?q=${encodeURIComponent(resource.address)}`, "_blank");
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04 }}
      className="bg-card border border-border rounded-xl p-5 hover:shadow-md hover:border-primary/20 transition-all duration-200"
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <div className="text-2xl flex-shrink-0 mt-0.5">{config.icon}</div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-semibold text-sm">{resource.name}</h3>
              {resource.is_free && (
                <span className="text-[10px] bg-green-500/10 text-green-600 border border-green-200 px-1.5 py-0.5 rounded-full font-medium">Free</span>
              )}
            </div>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${config.color}`}>{config.label}</span>
              {distance != null && (
                <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                  <Navigation className="w-2.5 h-2.5" /> {formatDistance(distance)}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Description */}
      {resource.description && (
        <p className="text-xs text-muted-foreground mt-3 leading-relaxed">{resource.description}</p>
      )}

      {/* Details */}
      <div className="mt-3 space-y-1.5">
        {resource.address && (
          <div className="flex items-start gap-1.5 text-xs text-muted-foreground">
            <MapPin className="w-3 h-3 mt-0.5 flex-shrink-0" />
            <span>{resource.address}</span>
          </div>
        )}
        {resource.operating_hours && (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Clock className="w-3 h-3 flex-shrink-0" />
            <span>{resource.operating_hours}</span>
          </div>
        )}
        {resource.languages?.length > 0 && (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span className="text-[10px]">🌐</span>
            <span>{resource.languages.join(", ")}</span>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-2 mt-4">
        {resource.phone && (
          <Button size="sm" onClick={handleCall} className="gap-1.5 h-8 text-xs">
            <Phone className="w-3 h-3" /> Call
          </Button>
        )}
        {resource.whatsapp && (
          <Button size="sm" variant="outline" onClick={handleWhatsApp} className="gap-1.5 h-8 text-xs border-green-300 text-green-700 hover:bg-green-50">
            <MessageSquare className="w-3 h-3" /> WhatsApp
          </Button>
        )}
        {(resource.location_lat || resource.address) && (
          <Button size="sm" variant="outline" onClick={handleDirections} className="gap-1.5 h-8 text-xs">
            <Navigation className="w-3 h-3" /> Directions
          </Button>
        )}
        {resource.website && (
          <Button size="sm" variant="ghost" onClick={() => window.open(resource.website, "_blank")} className="gap-1.5 h-8 text-xs">
            <Globe className="w-3 h-3" /> Website
          </Button>
        )}
        {onShareToCase && (
          <Button size="sm" variant="ghost" onClick={() => onShareToCase(resource)} className="gap-1.5 h-8 text-xs ml-auto">
            <Share2 className="w-3 h-3" /> Share to Case
          </Button>
        )}
      </div>
    </motion.div>
  );
}