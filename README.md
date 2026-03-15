# SARI NA — Smart AI Recognition & Indoor Navigation Assistant

SARI NA is a React Native (Expo) showcase for an indoor navigation experience that helps CSPC students move from one QR checkpoint to another when GPS coverage collapses inside the CCS and Annex buildings.

## ✨ Highlights

- **On-device QR anchoring** – the `Scan QR` screen relies on `expo-camera` and `react-native-vision-camera` compatible APIs so every scan instantly pins the user's indoor node without the need for Wi-Fi.
- **Smart pathfinding** – a reusable `Pathfinder` service implements the A* algorithm on top of a JSON node graph (see `constants/mapData.ts`) that describes rooms, hallways, stairs, and portal nodes that bridge buildings.
- **2D floor visualizer** – the new `Graph` component renders a static indoor map with highlighted routes so students can preview their walk before taking a step.
- **Cross-building proof** – CCS floor data links to an Annex ground-floor map through "portal" nodes, satisfying the scalability requirement from the project brief.

## 🧱 Project Structure

```
app/
 ├─ components/        # Map + indoor graph visualizations
 ├─ data/              # Searchable destinations that map to node IDs
 ├─ user/              # File-based Expo Router screens (home, navigation, QR, etc.)
constants/
 ├─ mapData.ts         # University graph definition
 └─ qrCheckpoints.ts   # Sample QR payloads → node metadata
services/              # Pathfinder, map service helpers
types/                 # Shared TypeScript types for nodes/floors/buildings
```

## 🚶 Routing Data Model

- **Map Nodes** – `MapNode` objects represent rooms, hallways, stairs, or entrances. Each node keeps indoor pixel coordinates (`x`, `y`), its building ID, floor level, and optional outdoor GPS coordinates.
- **Edges** – `MapEdge` connections define weighted, bi-directional walkways. Floors also list `interFloorEdges` for stairs or elevators.
- **Portals** – special entrance nodes like `ccs_f1_portal_annex` and `annex_f1_portal_ccs` link two buildings. Their edge weight is higher to reflect longer walks.

To add a new space:

1. Append a node to the appropriate building + floor inside `constants/mapData.ts`.
2. Connect it with `bi(...)` helper edges toward adjacent hallways or stairs.
3. Extend `app/data/places.ts` so the destination appears inside search results.
4. (Optional) Add a QR payload in `constants/qrCheckpoints.ts` to simulate scanning that checkpoint.

## 📱 Simulating a QR Scan

Use one of these payloads when testing with printed QR codes or by typing into Expo Go's developer QR mock:

| Location             | Payload string             |
| -------------------- | -------------------------- |
| Room 1 (CCS F1)      | `SARI::CCS::F1::ROOM1`     |
| CCS Canteen          | `SARI::CCS::F1::CANTEEN`   |
| AiRCoDe Lab (CCS F4) | `SARI::CCS::F4::AIRCODE`   |
| Annex Room 101       | `SARI::ANNEX::ROOM101`     |

Scanning one of these strings updates the global anchor (`global.currentCheckpoint`, `global.currentNodeId`) so the Navigation screen can compute an accurate indoor path.

## 🗺️ Indoor Graph Preview

When a user selects a destination with indoor metadata, the Navigation bottom sheet now shows:

1. Turn-by-turn cards for each node visited by the A* path.
2. Floor chips to toggle between levels that participate in the route.
3. A static 2D map (built with pure React Native views) that highlights the route, start, and destination nodes.

## 🛠️ Getting Started

```bash
npm install
npx expo start
```

- Use the **Home → Search** flow to choose a CCS/Annex room (e.g., AiRCoDe Lab).
- Open **Scan QR** and scan a supported payload so your current node is pinned.
- Navigate back to **Navigation** to see the computed route, indoor visualization, and guidance modals.

## 🧭 Roadmap Ideas

- Integrate the `react-native-vision-camera` based QR scanner with actual image processing once device testing is available.
- Persist scanned checkpoints per user and sync them to a backend for analytics.
- Extend `mapData.ts` with elevators, accessibility metadata, and additional buildings to cover the entire campus.
- Replace the static Leaflet web view with vector tiles rendered directly inside React Native for finer control.

---

SARI NA makes the “scan → anchor → navigate” story tangible by pairing QR checkpoints, explicit indoor graphs, and a deterministic routing UI. Customize the graph data and payloads to map the next building in your campus expansion plan. 💡
