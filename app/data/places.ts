import { MAP_DATA } from "../../constants/mapData";

export type Place = {
  id: string;
  title: string;
  subtitle: string;
  coords: [number, number];
  buildingId?: string;
  floor?: number;
  mapNodeId?: string;
};

const DEFAULT_COORDS: [number, number] = [13.405669, 123.377169];

const BUILDING_ANCHORS: Record<string, [number, number]> = {
  ccs: [13.40565, 123.37707],
  annex: [13.406159, 123.377347],
};

const INDOOR_NODE_TYPES = new Set(["room", "entrance"]);

const indoorPlaces: Place[] = Object.values(MAP_DATA.buildings)
  .flatMap((building) =>
    building.floors.flatMap((floor) =>
      floor.nodes
        .filter((node) => INDOOR_NODE_TYPES.has(node.type))
        .map<Place>((node) => {
          const coords: [number, number] =
            node.lat !== undefined && node.lng !== undefined
              ? [node.lat, node.lng]
              : BUILDING_ANCHORS[node.buildingId] ?? DEFAULT_COORDS;

          return {
            id: node.id,
            title: node.label,
            subtitle: `${building.name} - Floor ${floor.level}`,
            coords,
            buildingId: building.id,
            floor: floor.level,
            mapNodeId: node.id,
          };
        })
    )
  )
  .sort((a, b) => {
    if (a.buildingId && b.buildingId && a.buildingId !== b.buildingId) {
      return a.buildingId.localeCompare(b.buildingId);
    }
    if (
      typeof a.floor === "number" &&
      typeof b.floor === "number" &&
      a.floor !== b.floor
    ) {
      return a.floor - b.floor;
    }
    return a.title.localeCompare(b.title);
  });

const MANUAL_LANDMARKS: Place[] = [
  {
    id: "auditorium",
    title: "CSPC Auditorium",
    subtitle: "Campus Landmark",
    coords: [13.406402, 123.375668],
  },
  {
    id: "cas",
    title: "College of Arts & Sciences",
    subtitle: "Campus Landmark",
    coords: [13.4059, 123.377112],
  },
  {
    id: "gym",
    title: "Gymnasium",
    subtitle: "Campus Landmark",
    coords: [13.405917, 123.375264],
  },
];

const PLACES: Place[] = [...indoorPlaces, ...MANUAL_LANDMARKS];

export default PLACES;
