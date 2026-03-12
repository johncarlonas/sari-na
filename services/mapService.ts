// services/mapService.ts
import { MAP_DATA } from '../constants/mapData';
import { Pathfinder } from './pathfinder';

export const MapService = {
  // Main function to be called by the Frontend
  calculateRoute: (startQrId: string, destinationRoomId: string) => {
    const floor = mapData.buildings[0].floors[0]; // Assuming CCS Building Floor 1
    const { nodes, edges } = floor.graph;

    const pathIds = Pathfinder.getShortestPath(startQrId, destinationRoomId, nodes, edges);

    if (!pathIds) return null;

    // Convert IDs back to actual Coordinate objects for the Frontend to draw
    return pathIds.map(id => nodes.find(n => n.id === id));
  }
};