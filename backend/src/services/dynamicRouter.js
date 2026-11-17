/**
 * Dynamic Crisis Routing Engine
 * Calculates Haversine distance and ranks emergency responder facilities
 * based on proximity, active capacity, and specialized support fit.
 */

// Haversine formula to compute distance between coordinates in kilometers
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

export const findOptimalResponder = async (prisma, distressData) => {
  const { latitude, longitude, requiredService = 'GENERAL', language = 'en' } = distressData;

  // Fetch all active facilities with available capacity
  const facilities = await prisma.facility.findMany({
    where: {
      isActive: true,
      availableCapacity: { gt: 0 }
    }
  });

  if (!facilities || facilities.length === 0) {
    // Fallback: Return primary default national emergency helpline responder
    return {
      facility: null,
      message: 'No local facility currently available. Routed to National Emergency Hotline (990 / 116).',
      fallback: true
    };
  }

  // Score each facility dynamically
  const scoredFacilities = facilities.map((facility) => {
    const distanceKm = calculateDistance(
      latitude,
      longitude,
      facility.latitude,
      facility.longitude
    );

    // Scoring weights: Distance (60%), Capacity Ratio (25%), Specialization/Language Fit (15%)
    const distanceScore = Math.max(0, 100 - distanceKm * 5);
    const capacityScore = Math.min(100, (facility.availableCapacity / (facility.totalCapacity || 1)) * 100);
    const specScore = facility.servicesOffered?.includes(requiredService) ? 100 : 50;

    const totalScore = distanceScore * 0.60 + capacityScore * 0.25 + specScore * 0.15;

    return {
      facility,
      distanceKm: parseFloat(distanceKm.toFixed(2)),
      score: parseFloat(totalScore.toFixed(2))
    };
  });

  // Sort by highest score first
  scoredFacilities.sort((a, b) => b.score - a.score);

  const topMatch = scoredFacilities[0];

  return {
    facility: topMatch.facility,
    distanceKm: topMatch.distanceKm,
    matchScore: topMatch.score,
    fallback: false
  };
};
