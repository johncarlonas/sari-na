import { supabase } from '../lib/supabaseClient';
import { Pathfinder } from './pathfinder';
import { MapNode, MapEdge } from '../types/mapTypes';

export const MapService = {
  /**
   * Fetches the university map from the cloud and calculates the path.
   */
  calculateCloudRoute: async (startNodeId: string, endNodeId: string): Promise<MapNode[] | null> => {
    console.log(`🔍 Initializing route search: ${startNodeId} ➔ ${endNodeId}`);

    // 1. Fetch Data from Supabase
    const { data: nodesData, error: nodeError } = await supabase.from('nodes').select('*');
    const { data: edgesData, error: edgeError } = await supabase.from('edges').select('*');

    if (nodeError || edgeError) {
      console.error("❌ Supabase Fetch Error:", nodeError || edgeError);
      return null;
    }

    // 2. Logging for Debugging
    console.log(`📊 Data Received: ${nodesData?.length} nodes, ${edgesData?.length} edges.`);

    // 3. Mapping Nodes: Convert DB snake_case to TS camelCase
    const nodes: MapNode[] = (nodesData || []).map(n => ({
      id: n.id,
      label: n.label,
      type: n.type,
      instruction: n.instruction,
      x: n.x,
      y: n.y,
      floor: n.floor,
      buildingId: n.building_id, // Important: matching DB 'building_id'
      lat: n.lat,
      lng: n.lng
    }));

    // 4. Mapping Edges: Ensure they match your MapEdge interface
    const edges: MapEdge[] = (edgesData || []).map(e => ({
      from: e.from_node, // Important: matching DB 'from_node'
      to: e.to_node,     // Important: matching DB 'to_node'
      weight: e.weight
    }));

    // 5. Validation Check
    const startExists = nodes.some(n => n.id === startNodeId);
    const endExists = nodes.some(n => n.id === endNodeId);

    if (!startExists || !endExists) {
      console.error(`❌ Missing Node Error: Start (${startNodeId}) or End (${endNodeId}) not found in database.`);
      return null;
    }

    // 6. Execute Pathfinding logic
    console.log("⚡ Running A* Algorithm...");
    const pathIds = Pathfinder.getShortestPath(startNodeId, endNodeId, nodes, edges);

    if (!pathIds) {
      console.warn("⚠️ No path found between these points. Check if your edges (connections) are correct in Supabase.");
      return null;
    }

    // 7. Convert IDs back to full Node objects for the UI
    const fullPath = pathIds.map(id => nodes.find(n => n.id === id)).filter((n): n is MapNode => !!n);
    
    console.log(`✅ Success! Path found with ${fullPath.length} steps.`);
    return fullPath;
  }
};