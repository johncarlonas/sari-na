import { MAP_DATA } from '../constants/mapData';
import { Pathfinder } from './pathfinder';
import { Building, Floor, MapNode, MapEdge } from '../types/mapTypes';

export const MapService = {
  calculateRoute: (startId: string, endId: string) => {
    const allNodes: MapNode[] = [];
    const allEdges: MapEdge[] = [];

    // Flatten everything into one searchable graph
    Object.values(MAP_DATA.buildings).forEach((b: Building) => {
      b.floors.forEach((f: Floor) => {
        allNodes.push(...f.nodes);
        allEdges.push(...f.edges);
      });
      if (b.interFloorEdges) allEdges.push(...b.interFloorEdges);
    });
    allEdges.push(...MAP_DATA.interBuildingEdges);

    const pathIds = Pathfinder.getShortestPath(startId, endId, allNodes, allEdges);
    if (!pathIds) return null;

    // Return full objects so the UI knows x, y, floor, and building
    return pathIds.map(id => allNodes.find(n => n.id === id) as MapNode);
  }
};