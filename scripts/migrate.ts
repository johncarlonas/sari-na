import { supabase } from '../lib/supabaseClient';
import { MAP_DATA } from '../constants/mapData'; // Adjust path to your data file

async function migrate() {
  console.log("🚀 Starting Migration...");

  for (const buildingKey in MAP_DATA.buildings) {
    const building = MAP_DATA.buildings[buildingKey];

    for (const floor of building.floors) {
      console.log(`Processing ${building.name} - Floor ${floor.level}`);

      // 1. Insert Nodes
      const { error: nodeError } = await supabase
        .from('nodes')
        .upsert(floor.nodes.map(node => ({
          id: node.id,
          label: node.label,
          type: node.type,
          instruction: node.instruction,
          x: node.x,
          y: node.y,
          floor: node.floor,
          building_id: node.buildingId,
          lat: node.lat || null,
          lng: node.lng || null
        })));

      if (nodeError) console.error("Node Error:", nodeError);

      // 2. Insert Edges
      const { error: edgeError } = await supabase
        .from('edges')
        .upsert(floor.edges.map(edge => ({
          from_node: edge.from,
          to_node: edge.to,
          weight: edge.weight
        })));

      if (edgeError) console.error("Edge Error:", edgeError);
    }
  }

  // 3. Insert Inter-building Edges
  const { error: interError } = await supabase
    .from('edges')
    .upsert(MAP_DATA.interBuildingEdges.map(edge => ({
      from_node: edge.from,
      to_node: edge.to,
      weight: edge.weight
    })));

  if (interError) console.error("Inter-building Edge Error:", interError);

  console.log("✅ Migration Complete!");
}

migrate();