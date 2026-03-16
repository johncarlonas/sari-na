import React, { useMemo } from "react";
import { Dimensions, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { MAP_DATA } from "../../constants/mapData";
import type { MapNode } from "../../types/mapTypes";

type GraphProps = {
  buildingId: string;
  floorLevel: number;
  pathNodeIds?: string[];
  currentNodeId?: string | null;
  destinationNodeId?: string | null;
  heading?: number;
  fullScreen?: boolean;
};

type ProjectedNode = {
  node: MapNode;
  coord: { x: number; y: number };
};

export default function Graph({
  buildingId,
  floorLevel,
  pathNodeIds = [],
  currentNodeId,
  destinationNodeId,
  heading = 0,
  fullScreen = false,
}: GraphProps) {
  const building = MAP_DATA.buildings[buildingId];
  const floor = building?.floors.find((item) => item.level === floorLevel);

  const size = useMemo(() => {
    const { width, height } = Dimensions.get("window");
    if (fullScreen) {
      // The bottom card is ~260-300px tall depending on safe area insets.
      // Subtracting 310 leaves enough room so the graph doesn't render behind it or get squished
      return { width, height: height - 310 }; 
    }
    return {
      width: Math.min(width - 40, 360),
      height: 230,
    };
  }, [fullScreen]);

  const padding = 26;

  const projectedNodes: ProjectedNode[] = useMemo(() => {
    if (!floor || !floor.nodes.length) return [];
    const nodes = floor.nodes;
    const minX = Math.min(...nodes.map((node) => node.x));
    const maxX = Math.max(...nodes.map((node) => node.x));
    const minY = Math.min(...nodes.map((node) => node.y));
    const maxY = Math.max(...nodes.map((node) => node.y));

    const spanX = Math.max(maxX - minX, 1);
    const spanY = Math.max(maxY - minY, 1);
    const drawableWidth = Math.max(size.width - padding * 2, 50);
    const drawableHeight = Math.max(size.height - padding * 2, 50);
    const scale = Math.min(drawableWidth / spanX, drawableHeight / spanY);
    const extraX = drawableWidth - spanX * scale;
    const extraY = drawableHeight - spanY * scale;
    const offsetX = padding + extraX / 2;
    const offsetY = padding + extraY / 2;

    return nodes.map((node) => ({
      node,
      coord: {
        x: offsetX + (node.x - minX) * scale,
        y: offsetY + (node.y - minY) * scale,
      },
    }));
  }, [floor, padding, size.height, size.width]);

  if (!floor) {
    return (
      <View style={[styles.container, { height: size.height }]}>
        <Text style={styles.warningText}>No indoor map available for this floor yet.</Text>
      </View>
    );
  }

  const nodeLookup = new Map(projectedNodes.map((item) => [item.node.id, item]));
  const pathSet = new Set(pathNodeIds);
  const pathColor = fullScreen ? "#D62828" : "#0D6EFD";
  const pathEdgeThickness = fullScreen ? 5 : 4;
  const pathEdgeSet = new Set<string>();
  for (let i = 0; i < pathNodeIds.length - 1; i += 1) {
    const from = pathNodeIds[i];
    const to = pathNodeIds[i + 1];
    pathEdgeSet.add(`${from}->${to}`);
    pathEdgeSet.add(`${to}->${from}`);
  }

  const renderedEdges: React.ReactNode[] = [];
  const seenEdges = new Set<string>();
  floor.edges.forEach((edge) => {
    const from = nodeLookup.get(edge.from);
    const to = nodeLookup.get(edge.to);
    if (!from || !to) return;

    const key =
      from.node.id < to.node.id
        ? `${from.node.id}-${to.node.id}`
        : `${to.node.id}-${from.node.id}`;
    if (seenEdges.has(key)) return;
    seenEdges.add(key);

    const dx = to.coord.x - from.coord.x;
    const dy = to.coord.y - from.coord.y;
    const length = Math.sqrt(dx * dx + dy * dy);
    const angle = (Math.atan2(dy, dx) * 180) / Math.PI;
    const isHighlighted = pathEdgeSet.has(`${from.node.id}->${to.node.id}`);

    renderedEdges.push(
      <View
        key={key}
        style={[
          styles.edge,
          {
            width: length,
            left: (from.coord.x + to.coord.x) / 2,
            top: (from.coord.y + to.coord.y) / 2,
            backgroundColor: isHighlighted ? pathColor : "rgba(13,110,253,0.25)",
            height: isHighlighted ? pathEdgeThickness : 2,
            opacity: isHighlighted ? 0.95 : 0.35,
            transform: [
              { translateX: -length / 2 },
              { translateY: -1 },
              { rotate: `${angle}deg` },
            ],
          },
        ]}
      />
    );
  });

  return (
    <View
      style={[
        styles.container,
        { width: size.width, height: size.height },
        fullScreen && { borderWidth: 0, borderRadius: 0, backgroundColor: "transparent" },
      ]}
    >
      <View style={styles.floorBadge}>
        <Text style={styles.floorBadgeText} numberOfLines={1}>
          {`${building?.name ?? buildingId.toUpperCase()} - L${floorLevel}`}
        </Text>
      </View>
      {renderedEdges}
      {projectedNodes.map(({ node, coord }) => {
        const isCurrent = currentNodeId && node.id === currentNodeId;
        const isDestination = destinationNodeId && node.id === destinationNodeId;
        const isOnPath = pathSet.has(node.id);

        const sizePx = isCurrent || isDestination ? 18 : isOnPath ? 12 : 8;
        let backgroundColor = "#ffffff";
        let borderColor = "#8ea8d5";

        if (isDestination) {
          backgroundColor = "#F44336";
          borderColor = "#F44336";
        } else if (isCurrent) {
          backgroundColor = "#00B56A";
          borderColor = "#00B56A";
        } else if (isOnPath) {
          backgroundColor = pathColor;
          borderColor = pathColor;
        }

        return (
          <View key={node.id}>
            {isCurrent && fullScreen ? (
              <View
                style={[
                  styles.node,
                  {
                    width: 38,
                    height: 38,
                    left: coord.x - 19,
                    top: coord.y - 19,
                    borderRadius: 19,
                    borderWidth: 2,
                    borderColor: "#fff",
                    backgroundColor: "rgba(0, 42, 122, 0.15)",
                    alignItems: "center",
                    justifyContent: "center",
                    zIndex: 20,
                  },
                ]}
              >
                <View
                  style={{
                    width: 26,
                    height: 26,
                    borderRadius: 13,
                    backgroundColor: "#fff",
                    alignItems: "center",
                    justifyContent: "center",
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.3,
                    shadowRadius: 3,
                    elevation: 5,
                    transform: [{ rotate: `${heading}deg` }],
                  }}
                >
                  {/* Ionicons navigate points up-right normally, so we offset by -45deg so it points UP at 0deg heading */}
                  <Ionicons name="navigate" size={18} color="#002A7A" style={{ transform: [{ translateY: -1 }, { translateX: -1 }, { rotate: "-45deg" }] }} />
                </View>
              </View>
            ) : (
              <View
                style={[
                  styles.node,
                  {
                    width: sizePx,
                    height: sizePx,
                    left: coord.x - sizePx / 2,
                    top: coord.y - sizePx / 2,
                    borderColor,
                    backgroundColor,
                    zIndex: isCurrent || isDestination ? 15 : isOnPath ? 10 : 1,
                  },
                ]}
              />
            )}
            {isCurrent && fullScreen && (
              <Text
                style={[
                  styles.youAreHere,
                  {
                    left: coord.x - 38,
                    top: coord.y - 46,
                  },
                ]}
              >
                You are here
              </Text>
            )}
            {(isOnPath || isCurrent || isDestination) && (
              <Text
                numberOfLines={1}
                style={[
                  styles.nodeLabel,
                  {
                    left: coord.x + 8,
                    top: coord.y - 6,
                    color: isDestination ? "#c62828" : "#0b489d",
                  },
                ]}
              >
                {node.label}
              </Text>
            )}
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
    borderColor: "#dfe7fb",
    borderRadius: 18,
    backgroundColor: "#f8fbff",
    marginBottom: 8,
    overflow: "hidden",
  },
  edge: {
    position: "absolute",
    borderRadius: 2,
  },
  node: {
    position: "absolute",
    borderRadius: 20,
    borderWidth: 2,
  },
  nodeLabel: {
    position: "absolute",
    fontSize: 11,
    fontWeight: "700",
  },
  warningText: {
    color: "#6b84b7",
    textAlign: "center",
    paddingHorizontal: 16,
    paddingVertical: 20,
  },
  floorBadge: {
    position: "absolute",
    top: 12,
    left: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "#e3e9fb",
    borderWidth: 1,
    borderColor: "#c5d3f0",
  },
  floorBadgeText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#0b489d",
  },
  youAreHere: {
    position: "absolute",
    fontSize: 11,
    fontWeight: "800",
    color: "#002A7A",
    letterSpacing: 0.2,
    textTransform: "uppercase",
  },
});
