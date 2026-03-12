import { MapService } from './mapService';
import { MapNode } from '../types/mapTypes'; // Importing the type fixes the "any" error

const testNavigation = () => {
  console.log("--- Starting Navigation Test ---");

  const startNode = "ccs_f4_rise";  // Start at the very top of CCS
  const endNode = "chs_f1_lab1";    // End inside CHS   

  console.log(`Searching path from Canteen to Rise Lab...`);

  const path = MapService.calculateRoute(startNode, endNode);

  if (!path) {
    console.error("❌ Path not found! Check your edges and weights.");
    return;
  }

  console.log("✅ Path Found! Instructions:");
  console.log("--------------------------------");

  // Adding types (node: MapNode, index: number) fixes the other two errors
  path.forEach((node: MapNode, index: number) => {
    const floorIndicator = `[Floor ${node.floor}]`;
    console.log(`${index + 1}. ${floorIndicator} ${node.label}: ${node.instruction}`);
  });

  console.log("--------------------------------");
  console.log("End of Route.");
};

testNavigation();