import 'dotenv/config'; // This loads the .env file immediately
import { MapService } from '../services/mapService';
import { UsageService } from '../services/usageService';

async function testFullIntegration() {
  const testUserId = '00000000-0000-0000-0000-000000000000';  
  const startNodeId = 'ccs_f1_canteen'; 
  const endNodeId = 'ccs_f1_r1';

  console.log("🚀 Starting Full Integration Test...");

  try {
    // 1. Test Navigation
    const path = await MapService.calculateCloudRoute(startNodeId, endNodeId);
    
    if (path && path.length > 0) {
      console.log(`✅ Success! Path found with ${path.length} steps.`);
      
      // 2. Test Usage Logging (Handover Check)
      console.log("📝 Attempting to log visit to Supabase...");
      await UsageService.saveVisit(testUserId, path[0].label, path[path.length - 1].label);
      console.log("✅ Visit saved successfully.");

      // 3. Test History Retrieval (Dashboard Check)
      console.log("🕒 Fetching latest history for Dashboard...");
      const history = await UsageService.getLatestThreeVisits(testUserId);
      console.table(history);

    } else {
      console.log("❌ Route calculation failed.");
    }
  } catch (error) {
    console.error("💥 Integration test failed:", error);
  }
}

testFullIntegration();