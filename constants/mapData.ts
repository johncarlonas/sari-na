import { UniversityMap, MapEdge } from '../types/mapTypes';

// Helper to make paths walkable in both directions (A -> B and B -> A)
const bi = (from: string, to: string, weight: number): MapEdge[] => [
  { from, to, weight },
  { from: to, to: from, weight }
];

export const MAP_DATA: UniversityMap = {
  buildings: {
    ccs: {
      id: "ccs",
      name: "College of Computer Studies",
      floors: [
        // ==========================================
        // 1ST FLOOR
        // ==========================================
        {
          level: 1,
          nodes: [
            { id: "ccs_f1_wcr", type: "room", label: "Women's CR", instruction: "Women's CR is at the far left.", x: 100, y: 500, floor: 1, buildingId: "ccs" },
            { id: "ccs_f1_stairs_w", type: "stairs", label: "West Stairs", instruction: "Stairs near Women's CR.", x: 200, y: 500, floor: 1, buildingId: "ccs" },
            { id: "ccs_f1_r1", type: "room", label: "Room 1", instruction: "Enter Room 1.", x: 300, y: 500, floor: 1, buildingId: "ccs" },
            { id: "ccs_f1_offices", type: "room", label: "SC/JP Office", instruction: "Offices ahead.", x: 400, y: 500, floor: 1, buildingId: "ccs" },
            { id: "ccs_f1_canteen", type: "room", label: "Canteen", instruction: "Canteen area.", x: 500, y: 500, floor: 1, buildingId: "ccs" },
            { id: "ccs_f1_r2", type: "room", label: "Room 2", instruction: "Enter Room 2.", x: 600, y: 500, floor: 1, buildingId: "ccs" },
            { id: "ccs_f1_r4", type: "room", label: "Room 4", instruction: "Enter Room 4.", x: 700, y: 500, floor: 1, buildingId: "ccs" },
            { id: "ccs_f1_r5", type: "room", label: "Room 5", instruction: "Enter Room 5.", x: 750, y: 500, floor: 1, buildingId: "ccs" },
            { id: "ccs_f1_portal_annex", type: "entrance", label: "Annex Walkway", instruction: "Exit CCS through the annex walkway portal.", x: 820, y: 500, floor: 1, buildingId: "ccs" },
            { id: "ccs_f1_stairs_e", type: "stairs", label: "East Stairs", instruction: "Stairs near Men's CR.", x: 800, y: 500, floor: 1, buildingId: "ccs" },
            { id: "ccs_f1_mcr", type: "room", label: "Men's CR", instruction: "Men's CR is at the far right.", x: 900, y: 500, floor: 1, buildingId: "ccs" },
          ],
          edges: [
            ...bi("ccs_f1_wcr", "ccs_f1_stairs_w", 10),
            ...bi("ccs_f1_stairs_w", "ccs_f1_r1", 10),
            ...bi("ccs_f1_r1", "ccs_f1_offices", 10),
            ...bi("ccs_f1_offices", "ccs_f1_canteen", 10),
            ...bi("ccs_f1_canteen", "ccs_f1_r2", 10),
            ...bi("ccs_f1_r2", "ccs_f1_r4", 10),
            ...bi("ccs_f1_r4", "ccs_f1_r5", 10),
            ...bi("ccs_f1_r5", "ccs_f1_portal_annex", 8),
            ...bi("ccs_f1_portal_annex", "ccs_f1_stairs_e", 8),
            ...bi("ccs_f1_stairs_e", "ccs_f1_mcr", 10),
          ]
        },
        // ==========================================
        // 2ND FLOOR
        // ==========================================
        {
          level: 2,
          nodes: [
            { id: "ccs_f2_wcr", type: "room", label: "Women's CR", instruction: "Women's CR (2nd Floor).", x: 100, y: 400, floor: 2, buildingId: "ccs" },
            { id: "ccs_f2_stairs_w", type: "stairs", label: "West Stairs", instruction: "West stairs landing.", x: 200, y: 400, floor: 2, buildingId: "ccs" },
            { id: "ccs_f2_faculty", type: "room", label: "CCS Faculty", instruction: "Head to the Faculty Room.", x: 350, y: 400, floor: 2, buildingId: "ccs" },
            { id: "ccs_f2_dean", type: "room", label: "Dean's Office", instruction: "Head to the Dean's Office.", x: 450, y: 400, floor: 2, buildingId: "ccs" },
            { id: "ccs_f2_mac", type: "room", label: "Mac Lab", instruction: "Enter the Mac Lab.", x: 550, y: 400, floor: 2, buildingId: "ccs" },
            { id: "ccs_f2_open", type: "room", label: "Open Lab", instruction: "Enter the Open Lab.", x: 650, y: 400, floor: 2, buildingId: "ccs" },
            { id: "ccs_f2_stairs_e", type: "stairs", label: "East Stairs", instruction: "East stairs landing.", x: 800, y: 400, floor: 2, buildingId: "ccs" },
            { id: "ccs_f2_mcr", type: "room", label: "Men's CR", instruction: "Men's CR (2nd Floor).", x: 900, y: 400, floor: 2, buildingId: "ccs" },
          ],
          edges: [
            ...bi("ccs_f2_wcr", "ccs_f2_stairs_w", 10),
            ...bi("ccs_f2_stairs_w", "ccs_f2_faculty", 15),
            ...bi("ccs_f2_faculty", "ccs_f2_dean", 10),
            ...bi("ccs_f2_dean", "ccs_f2_mac", 10),
            ...bi("ccs_f2_mac", "ccs_f2_open", 10),
            ...bi("ccs_f2_open", "ccs_f2_stairs_e", 15),
            ...bi("ccs_f2_stairs_e", "ccs_f2_mcr", 10),
          ]
        },
        // ==========================================
        // 3RD FLOOR
        // ==========================================
        {
          level: 3,
          nodes: [
            { id: "ccs_f3_wcr", type: "room", label: "Women's CR", instruction: "Women's CR (3rd Floor).", x: 100, y: 300, floor: 3, buildingId: "ccs" },
            { id: "ccs_f3_stairs_w", type: "stairs", label: "West Stairs", instruction: "West stairs landing.", x: 200, y: 300, floor: 3, buildingId: "ccs" },
            { id: "ccs_f3_it1", type: "room", label: "IT Lab 1", instruction: "Enter IT Lab 1.", x: 300, y: 300, floor: 3, buildingId: "ccs" },
            { id: "ccs_f3_it2", type: "room", label: "IT Lab 2", instruction: "Enter IT Lab 2.", x: 400, y: 300, floor: 3, buildingId: "ccs" },
            { id: "ccs_f3_erp", type: "room", label: "ERP Lab", instruction: "Enter ERP Lab.", x: 500, y: 300, floor: 3, buildingId: "ccs" },
            { id: "ccs_f3_cs", type: "room", label: "CS Lab", instruction: "Enter CS Lab.", x: 600, y: 300, floor: 3, buildingId: "ccs" },
            { id: "ccs_f3_stairs_e", type: "stairs", label: "East Stairs", instruction: "East stairs landing.", x: 800, y: 300, floor: 3, buildingId: "ccs" },
            { id: "ccs_f3_mcr", type: "room", label: "Men's CR", instruction: "Men's CR (3rd Floor).", x: 900, y: 300, floor: 3, buildingId: "ccs" },
          ],
          edges: [
            ...bi("ccs_f3_wcr", "ccs_f3_stairs_w", 10),
            ...bi("ccs_f3_stairs_w", "ccs_f3_it1", 10),
            ...bi("ccs_f3_it1", "ccs_f3_it2", 10),
            ...bi("ccs_f3_it2", "ccs_f3_erp", 10),
            ...bi("ccs_f3_erp", "ccs_f3_cs", 10),
            ...bi("ccs_f3_cs", "ccs_f3_stairs_e", 15),
            ...bi("ccs_f3_stairs_e", "ccs_f3_mcr", 10),
          ]
        },
        // ==========================================
        // 4TH FLOOR
        // ==========================================
        {
          level: 4,
          nodes: [
            { id: "ccs_f4_wcr", type: "room", label: "Women's CR", instruction: "Women's CR (4th Floor).", x: 100, y: 200, floor: 4, buildingId: "ccs" },
            { id: "ccs_f4_stairs_w", type: "stairs", label: "West Stairs", instruction: "West stairs landing.", x: 200, y: 200, floor: 4, buildingId: "ccs" },
            { id: "ccs_f4_air", type: "room", label: "Aircode", instruction: "Head to Aircode Lab.", x: 300, y: 200, floor: 4, buildingId: "ccs" },
            { id: "ccs_f4_lis", type: "room", label: "LIS Lab", instruction: "Head to LIS Lab.", x: 400, y: 200, floor: 4, buildingId: "ccs" },
            { id: "ccs_f4_nas", type: "room", label: "NAS Lab", instruction: "Head to NAS Lab.", x: 500, y: 200, floor: 4, buildingId: "ccs" },
            { id: "ccs_f4_rise", type: "room", label: "Rise Lab", instruction: "Welcome to Rise Lab.", x: 600, y: 200, floor: 4, buildingId: "ccs" },
            { id: "ccs_f4_stairs_e", type: "stairs", label: "East Stairs", instruction: "East stairs landing.", x: 800, y: 200, floor: 4, buildingId: "ccs" },
            { id: "ccs_f4_mcr", type: "room", label: "Men's CR", instruction: "Men's CR (4th Floor).", x: 900, y: 200, floor: 4, buildingId: "ccs" },
          ],
          edges: [
            ...bi("ccs_f4_wcr", "ccs_f4_stairs_w", 10),
            ...bi("ccs_f4_stairs_w", "ccs_f4_air", 10),
            ...bi("ccs_f4_air", "ccs_f4_lis", 10),
            ...bi("ccs_f4_lis", "ccs_f4_nas", 10),
            ...bi("ccs_f4_nas", "ccs_f4_rise", 10),
            ...bi("ccs_f4_rise", "ccs_f4_stairs_e", 15),
            ...bi("ccs_f4_stairs_e", "ccs_f4_mcr", 10),
          ]
        }
      ],
      // ==========================================
      // VERTICAL CONNECTIONS (STAIRS)
      // ==========================================
      interFloorEdges: [
        // West Side Stairwell (Moving Up and Down)
        ...bi("ccs_f1_stairs_w", "ccs_f2_stairs_w", 50),
        ...bi("ccs_f2_stairs_w", "ccs_f3_stairs_w", 50),
        ...bi("ccs_f3_stairs_w", "ccs_f4_stairs_w", 50),
        
        // East Side Stairwell (Moving Up and Down)
        ...bi("ccs_f1_stairs_e", "ccs_f2_stairs_e", 50),
        ...bi("ccs_f2_stairs_e", "ccs_f3_stairs_e", 50),
        ...bi("ccs_f3_stairs_e", "ccs_f4_stairs_e", 50),
      ]
    },
    annex: {
      id: "annex",
      name: "Annex Building",
      floors: [
        {
          level: 1,
          nodes: [
            { id: "annex_f1_entrance", type: "entrance", label: "Annex Entrance", instruction: "Enter the Annex building lobby.", x: 200, y: 520, floor: 1, buildingId: "annex", lat: 13.40512, lng: 123.37795 },
            { id: "annex_f1_hall_a", type: "path", label: "Hallway A", instruction: "Walk through the west hallway.", x: 320, y: 520, floor: 1, buildingId: "annex" },
            { id: "annex_f1_hall_b", type: "path", label: "Hallway B", instruction: "Continue down the main hallway.", x: 460, y: 520, floor: 1, buildingId: "annex" },
            { id: "annex_f1_room101", type: "room", label: "Annex Room 101", instruction: "You are beside Annex Room 101.", x: 520, y: 460, floor: 1, buildingId: "annex", lat: 13.40524, lng: 123.37812 },
            { id: "annex_f1_room102", type: "room", label: "Annex Room 102", instruction: "Annex Room 102 is on the right.", x: 520, y: 580, floor: 1, buildingId: "annex" },
            { id: "annex_f1_portal_ccs", type: "entrance", label: "CCS Portal", instruction: "Follow the walkway back to CCS.", x: 620, y: 520, floor: 1, buildingId: "annex", lat: 13.4053, lng: 123.37825 }
          ],
          edges: [
            ...bi("annex_f1_entrance", "annex_f1_hall_a", 12),
            ...bi("annex_f1_hall_a", "annex_f1_hall_b", 10),
            ...bi("annex_f1_hall_b", "annex_f1_room101", 8),
            ...bi("annex_f1_hall_b", "annex_f1_room102", 8),
            ...bi("annex_f1_hall_b", "annex_f1_portal_ccs", 10)
          ]
        }
      ],
      interFloorEdges: []
    }
  }, // end of buildings

  // THIS IS THE BRIDGE
  interBuildingEdges: [
    // Portal walkway between CCS and Annex (represents outdoor travel)
    ...bi("ccs_f1_portal_annex", "annex_f1_portal_ccs", 220)
  ]
};
