import { UniversityMap, MapEdge, MapNode } from '../types/mapTypes';

// Helper to make paths walkable in both directions (A -> B and B -> A)
const bi = (from: string, to: string, weight: number): MapEdge[] => [
  { from, to, weight },
  { from: to, to: from, weight }
];

const SLOT_SPACING = 110;
const SLOT_START_X = 80;
const FLOOR_Y: Record<number, number> = {
  1: 620,
  2: 470,
  3: 320,
  4: 170,
};

type LinearNodeConfig = Omit<MapNode, 'x' | 'y' | 'floor' | 'buildingId'> & {
  offset?: number;
};

const createLinearRow = (
  buildingId: string,
  floorLevel: number,
  configs: LinearNodeConfig[],
  options?: { y?: number }
): MapNode[] => {
  const fallbackY = 640 - (floorLevel - 1) * 150;
  const y = options?.y ?? FLOOR_Y[floorLevel] ?? fallbackY;
  return configs.map((config, index) => ({
    ...config,
    x: SLOT_START_X + (config.offset ?? index) * SLOT_SPACING,
    y,
    floor: floorLevel,
    buildingId,
  }));
};

const connectSequential = (ids: string[], weight = 10): MapEdge[] =>
  ids.length < 2 ? [] : ids.slice(1).flatMap((id, index) => bi(ids[index], id, weight));

const ccsFloor1Nodes = createLinearRow('ccs', 1, [
  { id: 'ccs_f1_wcr', type: 'room', label: "Women's CR", instruction: "Women's CR is closest to the west lobby entrance.", offset: 0 },
  { id: 'ccs_f1_stairs_w', type: 'stairs', label: 'West Stairs', instruction: 'Use the west stairwell to go up or down floors.', offset: 1 },
  { id: 'ccs_f1_r1', type: 'room', label: 'CCS Room 1', instruction: 'Proceed to CCS Room 1.', offset: 2 },
  { id: 'ccs_f1_offices', type: 'room', label: 'SC/JP Office', instruction: 'Student Council / JP office is beside Room 1.', offset: 3 },
  { id: 'ccs_f1_canteen', type: 'room', label: 'Canteen', instruction: 'Canteen area for CCS.', offset: 4 },
  { id: 'ccs_f1_r2', type: 'room', label: 'CCS Room 2', instruction: 'Proceed to CCS Room 2.', offset: 5 },
  { id: 'ccs_f1_r3', type: 'room', label: 'CCS Room 3', instruction: 'Proceed to CCS Room 3.', offset: 5.5 },
  { id: 'ccs_f1_r4', type: 'room', label: 'CCS Room 4', instruction: 'Proceed to CCS Room 4.', offset: 6 },
  { id: 'ccs_f1_r5', type: 'room', label: 'CCS Room 5', instruction: 'Proceed to CCS Room 5.', offset: 7 },
  { id: 'ccs_f1_portal_chs', type: 'entrance', label: 'CHS Walkway', instruction: 'Exit here to reach the College of Health Sciences walkway.', offset: 7.6 },
  { id: 'ccs_f1_stairs_e', type: 'stairs', label: 'East Stairs', instruction: 'Use the east stairwell beside the CHS walkway.', offset: 8.5 },
  { id: 'ccs_f1_mcr', type: 'room', label: "Men's CR", instruction: "Men's restroom on the east wing.", offset: 9.5 },
]);

const ccsFloor2Nodes = createLinearRow('ccs', 2, [
  { id: 'ccs_f2_wcr', type: 'room', label: "Women's CR", instruction: "Women's CR on the second floor.", offset: 0 },
  { id: 'ccs_f2_stairs_w', type: 'stairs', label: 'West Stairs', instruction: 'West stair landing (2F).', offset: 1 },
  { id: 'ccs_f2_faculty', type: 'room', label: 'CCS Faculty', instruction: 'Faculty office area.', offset: 2.5 },
  { id: 'ccs_f2_dean', type: 'room', label: "Dean's Office", instruction: "Dean's Office for CCS.", offset: 3.5 },
  { id: 'ccs_f2_mac', type: 'room', label: 'Mac Lab', instruction: 'Apple / Mac laboratory.', offset: 4.5 },
  { id: 'ccs_f2_open', type: 'room', label: 'Open Lab', instruction: 'Open computer laboratory.', offset: 5.5 },
  { id: 'ccs_f2_stairs_e', type: 'stairs', label: 'East Stairs', instruction: 'East stair landing (2F).', offset: 6.6 },
  { id: 'ccs_f2_mcr', type: 'room', label: "Men's CR", instruction: "Men's CR on the second floor.", offset: 7.6 },
]);

const ccsFloor3Nodes = createLinearRow('ccs', 3, [
  { id: 'ccs_f3_wcr', type: 'room', label: "Women's CR", instruction: "Women's CR on the third floor.", offset: 0 },
  { id: 'ccs_f3_stairs_w', type: 'stairs', label: 'West Stairs', instruction: 'West stair landing (3F).', offset: 1 },
  { id: 'ccs_f3_it1', type: 'room', label: 'IT Lab 1', instruction: 'Information Technology Lab 1.', offset: 2.3 },
  { id: 'ccs_f3_it2', type: 'room', label: 'IT Lab 2', instruction: 'Information Technology Lab 2.', offset: 3.3 },
  { id: 'ccs_f3_erp', type: 'room', label: 'ERP Lab', instruction: 'Enterprise Resource Planning Lab.', offset: 4.3 },
  { id: 'ccs_f3_cs', type: 'room', label: 'CS Lab', instruction: 'Computer Science Lab.', offset: 5.3 },
  { id: 'ccs_f3_stairs_e', type: 'stairs', label: 'East Stairs', instruction: 'East stair landing (3F).', offset: 6.4 },
  { id: 'ccs_f3_mcr', type: 'room', label: "Men's CR", instruction: "Men's CR on the third floor.", offset: 7.4 },
]);

const ccsFloor4Nodes = createLinearRow('ccs', 4, [
  { id: 'ccs_f4_wcr', type: 'room', label: "Women's CR", instruction: "Women's CR on the fourth floor.", offset: 0 },
  { id: 'ccs_f4_stairs_w', type: 'stairs', label: 'West Stairs', instruction: 'West stair landing (4F).', offset: 1 },
  { id: 'ccs_f4_air', type: 'room', label: 'Aircode Lab', instruction: 'Head to the Aircode Lab.', offset: 2.2 },
  { id: 'ccs_f4_lis', type: 'room', label: 'LIS Lab', instruction: 'Head to the LIS Lab.', offset: 3.2 },
  { id: 'ccs_f4_nas', type: 'room', label: 'NAS Lab', instruction: 'Head to the NAS Lab.', offset: 4.2 },
  { id: 'ccs_f4_rise', type: 'room', label: 'Rise Lab', instruction: 'Welcome to the Rise Lab.', offset: 5.2 },
  { id: 'ccs_f4_stairs_e', type: 'stairs', label: 'East Stairs', instruction: 'East stair landing (4F).', offset: 6.3 },
  { id: 'ccs_f4_mcr', type: 'room', label: "Men's CR", instruction: "Men's CR on the fourth floor.", offset: 7.3 },
]);

const ccsFloor1Edges: MapEdge[] = [
  ...connectSequential([
    'ccs_f1_wcr',
    'ccs_f1_stairs_w',
    'ccs_f1_r1',
    'ccs_f1_offices',
    'ccs_f1_canteen',
    'ccs_f1_r2',
    'ccs_f1_r3',
    'ccs_f1_r4',
    'ccs_f1_r5',
  ]),
  ...bi('ccs_f1_r5', 'ccs_f1_portal_chs', 8),
  ...bi('ccs_f1_portal_chs', 'ccs_f1_stairs_e', 8),
  ...bi('ccs_f1_stairs_e', 'ccs_f1_mcr', 10),
];

const ccsFloor2Edges: MapEdge[] = connectSequential([
  'ccs_f2_wcr',
  'ccs_f2_stairs_w',
  'ccs_f2_faculty',
  'ccs_f2_dean',
  'ccs_f2_mac',
  'ccs_f2_open',
  'ccs_f2_stairs_e',
  'ccs_f2_mcr',
]);

const ccsFloor3Edges: MapEdge[] = connectSequential([
  'ccs_f3_wcr',
  'ccs_f3_stairs_w',
  'ccs_f3_it1',
  'ccs_f3_it2',
  'ccs_f3_erp',
  'ccs_f3_cs',
  'ccs_f3_stairs_e',
  'ccs_f3_mcr',
]);

const ccsFloor4Edges: MapEdge[] = connectSequential([
  'ccs_f4_wcr',
  'ccs_f4_stairs_w',
  'ccs_f4_air',
  'ccs_f4_lis',
  'ccs_f4_nas',
  'ccs_f4_rise',
  'ccs_f4_stairs_e',
  'ccs_f4_mcr',
]);

const chsFloor1Nodes = createLinearRow(
  'chs',
  1,
  [
    {
      id: 'chs_f1_entrance',
      type: 'entrance',
      label: 'CHS Entrance',
      instruction: 'Enter the College of Health Sciences lobby.',
      offset: 0,
      lat: 13.40512,
      lng: 123.37795,
    },
    {
      id: 'chs_f1_room101',
      type: 'room',
      label: 'CHS Room 1',
      instruction: 'Proceed to CHS Room 1.',
      offset: 1.6,
      lat: 13.40524,
      lng: 123.37812,
    },
    {
      id: 'chs_f1_room102',
      type: 'room',
      label: 'CHS Room 2',
      instruction: 'Proceed to CHS Room 2.',
      offset: 2.8,
    },
    {
      id: 'chs_f1_portal_ccs',
      type: 'entrance',
      label: 'CCS Walkway',
      instruction: 'Follow this portal back to CCS.',
      offset: 3.6,
      lat: 13.4053,
      lng: 123.37825,
    },
  ],
  { y: 540 }
);

const chsFloor1Edges: MapEdge[] = connectSequential([
  'chs_f1_entrance',
  'chs_f1_room101',
  'chs_f1_room102',
  'chs_f1_portal_ccs',
]);

export const MAP_DATA: UniversityMap = {
  buildings: {
    ccs: {
      id: 'ccs',
      name: 'College of Computer Studies',
      floors: [
        { level: 1, nodes: ccsFloor1Nodes, edges: ccsFloor1Edges },
        { level: 2, nodes: ccsFloor2Nodes, edges: ccsFloor2Edges },
        { level: 3, nodes: ccsFloor3Nodes, edges: ccsFloor3Edges },
        { level: 4, nodes: ccsFloor4Nodes, edges: ccsFloor4Edges },
      ],
      interFloorEdges: [
        ...bi('ccs_f1_stairs_w', 'ccs_f2_stairs_w', 50),
        ...bi('ccs_f2_stairs_w', 'ccs_f3_stairs_w', 50),
        ...bi('ccs_f3_stairs_w', 'ccs_f4_stairs_w', 50),
        ...bi('ccs_f1_stairs_e', 'ccs_f2_stairs_e', 50),
        ...bi('ccs_f2_stairs_e', 'ccs_f3_stairs_e', 50),
        ...bi('ccs_f3_stairs_e', 'ccs_f4_stairs_e', 50),
      ],
    },
    chs: {
      id: 'chs',
      name: 'College of Health Sciences',
      floors: [
        { level: 1, nodes: chsFloor1Nodes, edges: chsFloor1Edges },
      ],
      interFloorEdges: [],
    },
  },
  interBuildingEdges: [
    // Portal walkway between CCS and CHS (represents outdoor travel)
    ...bi('ccs_f1_portal_chs', 'chs_f1_portal_ccs', 220),
  ],
};
