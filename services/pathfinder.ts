import { MapNode, MapEdge } from '../types/mapTypes';

export const Pathfinder = {
  // This is the "Compass" (Heuristic)
  // It estimates the distance between two nodes using the Pythagorean theorem.
  // IMPORTANT: The value must be ADMISSIBLE (never overestimate the real cost)
  // so that A* is guaranteed to find the optimal path.
  getHeuristic: (nodeA: MapNode, nodeB: MapNode): number => {
    // If they are in different buildings, use a conservative flat estimate.
    // The shortest inter-building edge is 220, so 200 keeps the heuristic admissible.
    if (nodeA.buildingId !== nodeB.buildingId) return 200;

    // If in the same building, we use the x,y coordinates (Euclidean distance)
    const dx = nodeA.x - nodeB.x;
    const dy = nodeA.y - nodeB.y;
    return Math.sqrt(dx * dx + dy * dy);
  },

  getShortestPath: (startId: string, endId: string, nodes: MapNode[], edges: MapEdge[]): string[] | null => {
    const startNode = nodes.find(n => n.id === startId);
    const endNode = nodes.find(n => n.id === endId);
    if (!startNode || !endNode) return null;

    const gScore: { [key: string]: number } = {}; // Actual distance from start
    const fScore: { [key: string]: number } = {}; // Estimated total distance (g + h)
    const previous: { [key: string]: string | null } = {};
    let openSet: string[] = [startId];
    const closedSet = new Set<string>(); // Track fully-explored nodes

    nodes.forEach(node => {
      gScore[node.id] = Infinity;
      fScore[node.id] = Infinity;
      previous[node.id] = null;
    });

    gScore[startId] = 0;
    fScore[startId] = Pathfinder.getHeuristic(startNode, endNode);

    while (openSet.length > 0) {
      // Sort by fScore (the guess) instead of gScore (the actual)
      openSet.sort((a, b) => fScore[a] - fScore[b]);
      const currentId = openSet.shift()!;

      if (currentId === endId) break;

      // Skip nodes we have already fully explored
      if (closedSet.has(currentId)) continue;
      closedSet.add(currentId);

      const neighbors = edges.filter(e => e.from === currentId);
      for (const edge of neighbors) {
        // Skip neighbours already in the closed set
        if (closedSet.has(edge.to)) continue;

        const tentativeGScore = gScore[currentId] + edge.weight;

        if (tentativeGScore < gScore[edge.to]) {
          previous[edge.to] = currentId;
          gScore[edge.to] = tentativeGScore;
          
          const neighborNode = nodes.find(n => n.id === edge.to)!;
          fScore[edge.to] = gScore[edge.to] + Pathfinder.getHeuristic(neighborNode, endNode);

          if (!openSet.includes(edge.to)) {
            openSet.push(edge.to);
          }
        }
      }
    }

    // Path reconstruction remains the same
    const path: string[] = [];
    let curr: string | null = endId;
    while (curr) {
      path.unshift(curr);
      curr = previous[curr];
    }
    return path[0] === startId ? path : null;
  }
};