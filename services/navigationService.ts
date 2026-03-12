import { MapNode } from '../types/mapTypes';

export const NavigationService = {
  getUIContext: (currentNode: MapNode, nextNode: MapNode) => {
    // If buildings are different, it's time for Mapbox!
    if (currentNode.buildingId !== nextNode.buildingId) {
      return {
        mode: 'MAPBOX',
        targetGps: { lat: nextNode.lat, lng: nextNode.lng },
        instruction: "Follow the outdoor map to the next building."
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