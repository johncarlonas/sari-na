import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  PanResponder,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { MAP_DATA } from "../../constants/mapData";
import type { MapNode } from "../../types/mapTypes";

type PathStripMapProps = {
  buildingId: string;
  floorLevel: number;
  pathNodeIds: string[];
  currentNodeId?: string | null;
  destinationNodeId?: string | null;
  heading?: number;
  fullScreen?: boolean;
};

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

export default function PathStripMap({
  buildingId,
  floorLevel,
  pathNodeIds,
  currentNodeId = null,
  destinationNodeId = null,
  heading = 0,
  fullScreen = false,
}: PathStripMapProps) {
  const building = MAP_DATA.buildings[buildingId];
  const floor = building?.floors.find((item) => item.level === floorLevel);

  const nodes = useMemo(() => {
    if (!floor) return [] as MapNode[];
    const seen = new Set<string>();
    return pathNodeIds
      .map((id) => floor.nodes.find((node) => node.id === id))
      .filter((node): node is MapNode => Boolean(node))
      .filter((node) => {
        if (seen.has(node.id)) return false;
        seen.add(node.id);
        return true;
      });
  }, [floor, pathNodeIds]);

  const initialIndex = useMemo(() => {
    if (!nodes.length) return 0;
    if (currentNodeId) {
      const idx = nodes.findIndex((node) => node.id === currentNodeId);
      if (idx !== -1) return idx;
    }
    return 0;
  }, [currentNodeId, nodes]);

  const [activeIndex, setActiveIndex] = useState(initialIndex);

  useEffect(() => {
    setActiveIndex(initialIndex);
  }, [initialIndex]);

  const slideAnim = useRef(new Animated.Value(0)).current;
  const prevIndexRef = useRef(initialIndex);

  useEffect(() => {
    const prev = prevIndexRef.current;
    if (prev === activeIndex) return;
    const direction = activeIndex > prev ? 1 : -1;
    prevIndexRef.current = activeIndex;
    slideAnim.setValue(direction * 90);
    Animated.spring(slideAnim, {
      toValue: 0,
      useNativeDriver: true,
      stiffness: 180,
      damping: 18,
    }).start();
  }, [activeIndex, slideAnim]);

  const handleStep = useCallback(
    (delta: 1 | -1) => {
      setActiveIndex((current) => {
        const nextIndex = current + delta;
        if (nextIndex < 0 || nextIndex >= nodes.length) return current;
        return nextIndex;
      });
    },
    [nodes.length]
  );

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, gesture) =>
          Math.abs(gesture.dx) > 16 && Math.abs(gesture.dy) < 16,
        onPanResponderRelease: (_, gesture) => {
          if (Math.abs(gesture.dx) < 40) return;
          if (gesture.dx > 0) {
            handleStep(-1);
          } else {
            handleStep(1);
          }
        },
      }),
    [handleStep]
  );

  const currentNode = nodes[activeIndex] ?? null;
  const leftNode = activeIndex > 0 ? nodes[activeIndex - 1] ?? null : null;
  const rightNode =
    activeIndex < nodes.length - 1 ? nodes[activeIndex + 1] ?? null : null;

  const sectionHeight = fullScreen
    ? Math.max(320, Math.min(SCREEN_HEIGHT - 200, 520))
    : 300;

  if (!floor || !nodes.length) {
    return (
      <View
        style={[
          styles.emptyState,
          fullScreen ? styles.emptyFull : styles.emptyCompact,
        ]}
      >
        <Text style={styles.emptyTitle}>Indoor preview unavailable</Text>
        <Text style={styles.emptyBody}>
          This floor does not have plotted checkpoints yet. Select a different
          route or scan a QR marker inside the building.
        </Text>
      </View>
    );
  }

  const buildingLabel = `${building?.name ?? buildingId.toUpperCase()} • L${floorLevel}`;
  const travelState =
    activeIndex === nodes.length - 1
      ? "Destination"
      : `Next: ${rightNode?.label ?? "Follow the path"}`;

  const progress = nodes.map((node, index) => {
    const visited = index <= activeIndex;
    const isDestination = node.id === destinationNodeId;
    return { id: node.id, visited, isDestination };
  });

  return (
    <View
      style={[
        styles.wrapper,
        fullScreen ? styles.wrapperFull : styles.wrapperCompact,
        { height: sectionHeight },
      ]}
    >
      <View style={styles.headerRow}>
        <Text style={styles.headerTitle}>{buildingLabel}</Text>
        {currentNode && (
          <View style={styles.headerChip}>
            <Ionicons name="walk" size={14} color="#002A7A" />
            <Text style={styles.headerChipText}>{currentNode.label}</Text>
          </View>
        )}
      </View>

      <View style={styles.stripSurface}>
        <Animated.View
          style={[styles.cardRow, { transform: [{ translateX: slideAnim }] }]}
          {...panResponder.panHandlers}
        >
          {renderNodeCard(leftNode, "left", {
            currentNodeId,
            destinationNodeId,
            heading,
          })}
          {renderNodeCard(currentNode, "center", {
            currentNodeId,
            destinationNodeId,
            heading,
            highlightCurrent: true,
          })}
          {renderNodeCard(rightNode, "right", {
            currentNodeId,
            destinationNodeId,
            heading,
          })}
        </Animated.View>

        <View style={styles.progressRail}>
          {progress.map((node, index) => (
            <View key={node.id} style={styles.progressSegment}>
              <View
                style={[
                  styles.progressDot,
                  node.visited && styles.progressDotActive,
                  node.isDestination && styles.progressDotDestination,
                ]}
              />
              {index < progress.length - 1 && (
                <View
                  style={[
                    styles.progressLine,
                    index < activeIndex && styles.progressLineActive,
                  ]}
                />
              )}
            </View>
          ))}
        </View>

        <Text style={styles.travelState}>{travelState}</Text>

        <View style={styles.controlRow}>
          <Pressable
            style={[
              styles.controlButton,
              activeIndex === 0 && styles.controlButtonDisabled,
            ]}
            onPress={() => handleStep(-1)}
            disabled={activeIndex === 0}
          >
            <Ionicons
              name="chevron-back"
              size={20}
              color={activeIndex === 0 ? "#6b7390" : "#ffffff"}
            />
          </Pressable>
          <Text style={styles.controlHint}>Swipe or tap arrows to move</Text>
          <Pressable
            style={[
              styles.controlButton,
              activeIndex === nodes.length - 1 && styles.controlButtonDisabled,
            ]}
            onPress={() => handleStep(1)}
            disabled={activeIndex === nodes.length - 1}
          >
            <Ionicons
              name="chevron-forward"
              size={20}
              color={activeIndex === nodes.length - 1 ? "#6b7390" : "#ffffff"}
            />
          </Pressable>
        </View>
      </View>
    </View>
  );
}

type NodeCardSlot = "left" | "center" | "right";

type NodeCardOptions = {
  currentNodeId?: string | null;
  destinationNodeId?: string | null;
  heading?: number;
  highlightCurrent?: boolean;
};

function renderNodeCard(
  node: MapNode | null,
  slot: NodeCardSlot,
  options: NodeCardOptions
) {
  const { currentNodeId, destinationNodeId, heading = 0, highlightCurrent } =
    options;
  const isCurrent = node && node.id === currentNodeId;
  const isDestination = node && node.id === destinationNodeId;
  const circleSize = slot === "center" ? 76 : 56;

  if (!node) {
    return (
      <View
        style={[
          styles.nodeCard,
          slot === "center" ? styles.centerCard : styles.neighborCard,
          styles.placeholderCard,
        ]}
      >
        <Text style={styles.placeholderText}>No node</Text>
      </View>
    );
  }

  const badgeLabel = isDestination
    ? "Destination"
    : slot === "center"
    ? "Now"
    : slot === "left"
    ? "Previous"
    : "Next";

  const backgroundColor = isDestination
    ? "#ffe5e0"
    : isCurrent || highlightCurrent
    ? "#d8f9ef"
    : "#eef2ff";
  const borderColor = isDestination
    ? "#f44336"
    : isCurrent || highlightCurrent
    ? "#00a86b"
    : "#9fb4ff";

  return (
    <View
      style={[
        styles.nodeCard,
        slot === "center" ? styles.centerCard : styles.neighborCard,
      ]}
    >
      <View style={styles.cardBadge}>
        <Text style={styles.cardBadgeText}>{badgeLabel}</Text>
      </View>
      <View
        style={[
          styles.nodeCircle,
          { width: circleSize, height: circleSize, borderColor, backgroundColor },
        ]}
      >
        {isCurrent && (
          <Ionicons
            name="navigate"
            size={20}
            color="#004bcd"
            style={{ transform: [{ rotate: `${heading - 45}deg` }] }}
          />
        )}
        {isDestination && !isCurrent && (
          <Ionicons name="flag" size={22} color="#cf1f2d" />
        )}
        {!isCurrent && !isDestination && (
          <Ionicons name="radio-button-on" size={18} color="#4c5b82" />
        )}
      </View>
      <Text style={styles.nodeLabel} numberOfLines={2}>
        {node.label}
      </Text>
      <Text style={styles.nodeInstruction} numberOfLines={2}>
        {node.instruction}
      </Text>
      <Text style={styles.nodeMeta}>{`Floor ${node.floor} • ${node.type.toUpperCase()}`}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width: "100%",
    alignSelf: "center",
  },
  wrapperFull: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  wrapperCompact: {
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
    paddingHorizontal: 6,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#0a1b3c",
  },
  headerChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#e0ecff",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  headerChipText: {
    marginLeft: 4,
    fontSize: 13,
    fontWeight: "600",
    color: "#002A7A",
  },
  stripSurface: {
    flex: 1,
    borderRadius: 32,
    backgroundColor: "#081633",
    paddingVertical: 24,
    paddingHorizontal: 18,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 10 },
    shadowRadius: 24,
    elevation: 8,
  },
  cardRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  nodeCard: {
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 16,
    backgroundColor: "#fff",
    width: (SCREEN_WIDTH - 80) / 3,
  },
  neighborCard: {
    opacity: 0.9,
  },
  centerCard: {
    width: (SCREEN_WIDTH - 80) / 3 + 30,
    minHeight: 200,
  },
  cardBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: "#e8edff",
    marginBottom: 14,
  },
  cardBadgeText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#405cb8",
  },
  nodeCircle: {
    borderRadius: 999,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  nodeLabel: {
    fontSize: 15,
    fontWeight: "700",
    color: "#0a1b3c",
  },
  nodeInstruction: {
    marginTop: 4,
    fontSize: 12,
    color: "#4a577a",
  },
  nodeMeta: {
    marginTop: 10,
    fontSize: 11,
    color: "#7a86a3",
    fontWeight: "600",
  },
  progressRail: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 28,
    marginBottom: 12,
    paddingHorizontal: 6,
  },
  progressSegment: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  progressDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#2b3655",
  },
  progressDotActive: {
    backgroundColor: "#4dc3a7",
  },
  progressDotDestination: {
    backgroundColor: "#f44336",
  },
  progressLine: {
    flex: 1,
    height: 2,
    backgroundColor: "#1d2a4f",
  },
  progressLineActive: {
    backgroundColor: "#4dc3a7",
  },
  travelState: {
    color: "#d5defa",
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 12,
    paddingHorizontal: 6,
  },
  controlRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  controlButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1,
    borderColor: "#ffffff",
    alignItems: "center",
    justifyContent: "center",
  },
  controlButtonDisabled: {
    borderColor: "#5c6485",
    backgroundColor: "rgba(255,255,255,0.05)",
  },
  controlHint: {
    color: "#9fb4ff",
    fontSize: 12,
    fontWeight: "500",
  },
  emptyState: {
    borderRadius: 28,
    borderWidth: 1,
    borderColor: "#d9e3ff",
    backgroundColor: "#f8f9ff",
    padding: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyFull: {
    marginHorizontal: 20,
    height: Math.min(SCREEN_HEIGHT - 220, 400),
  },
  emptyCompact: {
    minHeight: 220,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#102457",
    marginBottom: 6,
  },
  emptyBody: {
    color: "#4f5d7c",
    fontSize: 13,
    textAlign: "center",
  },
  placeholderCard: {
    backgroundColor: "#f3f4fa",
    borderStyle: "dashed",
    borderWidth: 1,
    borderColor: "#c7cee6",
    justifyContent: "center",
    alignItems: "center",
  },
  placeholderText: {
    fontSize: 12,
    color: "#7f89a7",
  },
});
