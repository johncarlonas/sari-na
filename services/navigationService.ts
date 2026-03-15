import { MapNode } from '../types/mapTypes';

export const NavigationService = {
  getUIContext: (currentNode: MapNode, nextNode: MapNode) => {
    // If buildings are different, it's time for Mapbox!
    if (currentNode.buildingId !== nextNode.buildingId) {
      // Only use MAPBOX mode if the next node actually has GPS coordinates.
      // Many indoor-only nodes lack lat/lng, so fall back to GRAPH mode.
      if (nextNode.lat != null && nextNode.lng != null) {
        return {
          mode: 'MAPBOX',
          targetGps: { lat: nextNode.lat, lng: nextNode.lng },
          instruction: "Follow the outdoor map to the next building."
        };
      }
      // Fallback: no GPS coords available — stay on indoor graph
      return {
        mode: 'GRAPH',
        coords: { x: nextNode.x, y: nextNode.y },
        floor: nextNode.floor,
        instruction: `Head toward ${nextNode.label} in the next building. Follow posted signs.`
      };
    }
    // Otherwise, stay on the indoor Graph Illustration
    return {
      mode: 'GRAPH',
      coords: { x: nextNode.x, y: nextNode.y },
      floor: nextNode.floor,
      instruction: nextNode.instruction
    };
  }
};