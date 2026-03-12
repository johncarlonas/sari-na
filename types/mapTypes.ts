export type NodeType = 'qr' | 'room' | 'stairs' | 'path' | 'entrance';

export interface MapNode {
  id: string;
  type: NodeType;
  label: string;
  instruction: string;
  // Indoor Coordinates (Pixels)
  x: number; 
  y: number;
  floor: number;
  buildingId: string;
  // Outdoor Coordinates (Mapbox) - Optional
  lng?: number; 
  lat?: number;
}

export interface MapEdge {
  from: string;
  to: string;
  weight: number;
}

export interface Floor {
  level: number;
  nodes: MapNode[];
  edges: MapEdge[];
}

export interface Building {
  id: string;
  name: string;
  floors: Floor[];
  interFloorEdges?: MapEdge[];
}

export interface UniversityMap {
  buildings: {
    [buildingId: string]: Building;
  };
  interBuildingEdges: MapEdge[];
}