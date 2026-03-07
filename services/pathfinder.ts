// services/pathfinder.ts

export interface Node {
  id: string;
  x: number;
  y: number;
  label: string;
}

export interface Edge {
  from: string;
  to: string;
  weight: number;
}

export class Pathfinder {
  // A* Implementation: Finds the shortest array of Node IDs
  static getShortestPath(startId: string, endId: string, nodes: Node[], edges: Edge[]): string[] | null {
    let openSet = [startId];
    let cameFrom: Record<string, string> = {};
    let gScore: Record<string, number> = {}; 
    let fScore: Record<string, number> = {};

    nodes.forEach(n => {
      gScore[n.id] = Infinity;
      fScore[n.id] = Infinity;
    });

    gScore[startId] = 0;
    fScore[startId] = this.heuristic(startId, endId, nodes);

    while (openSet.length > 0) {
      // Find node in openSet with lowest fScore
      let current = openSet.reduce((a, b) => fScore[a] < fScore[b] ? a : b);

      if (current === endId) return this.reconstructPath(cameFrom, current);

      openSet = openSet.filter(id => id !== current);

      const neighbors = this.getNeighbors(current, edges);
      for (let neighbor of neighbors) {
        let edge = edges.find(e => (e.from === current && e.to === neighbor) || (e.from === neighbor && e.to === current));
        let tentativeGScore = gScore[current] + (edge?.weight || 0);

        if (tentativeGScore < gScore[neighbor]) {
          cameFrom[neighbor] = current;
          gScore[neighbor] = tentativeGScore;
          fScore[neighbor] = gScore[neighbor] + this.heuristic(neighbor, endId, nodes);
          if (!openSet.includes(neighbor)) openSet.push(neighbor);
        }
      }
    }
    return null;
  }

  private static heuristic(idA: string, idB: string, nodes: Node[]): number {
    const a = nodes.find(n => n.id === idA)!;
    const b = nodes.find(n => n.id === idB)!;
    return Math.sqrt(Math.pow(b.x - a.x, 2) + Math.pow(b.y - a.y, 2));
  }

  private static getNeighbors(nodeId: string, edges: Edge[]): string[] {
    return edges
      .filter(e => e.from === nodeId || e.to === nodeId)
      .map(e => e.from === nodeId ? e.to : e.from);
  }

  private static reconstructPath(cameFrom: Record<string, string>, current: string): string[] {
    let path = [current];
    while (current in cameFrom) {
      current = cameFrom[current];
      path.unshift(current);
    }
    return path;
  }
}