import React, { useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { MAP_DATA } from "../../constants/mapData";
import type { MapNode } from "../../types/mapTypes";

type GraphProps = {
  buildingId: string;
  floorLevel?: number;
  pathNodeIds?: string[];
  currentNodeId?: string | null;
  destinationNodeId?: string | null;
  heading?: number;
  fullScreen?: boolean;
};

const NODE_TYPES_FOR_GRAPH = new Set(["room", "stairs", "entrance"]);
const HIDDEN_GRAPH_NODE_IDS = new Set(["ccs_f1_portal_annex", "annex_f1_portal_ccs"]);
const OUTSIDE_CENTER_NODE_ID = "__outside_center__";

const getGraphLabel = (node: MapNode) => {
  if (node.id.includes("_wcr")) return "WCR";
  if (node.id.includes("_mcr")) return "MCR";
  if (node.id.includes("_stairs_w")) return "WST";
  if (node.id.includes("_stairs_e")) return "EST";
  if (node.id === "ccs_f1_offices") return "OF";
  if (node.id === "ccs_f2_faculty") return "FAC";
  if (node.id === "ccs_f2_dean") return "DEA";
  if (node.id === "ccs_f1_canteen") return "C";
  if (node.id === "ccs_f3_it1") return "IT1";
  if (node.id === "ccs_f3_it2") return "IT2";
  if (node.id === "ccs_f3_erp") return "ERP";
  if (node.id === "ccs_f3_cs") return "CSL";
  if (node.id === "ccs_f2_mac") return "MAC";
  if (node.id === "ccs_f2_open") return "OPL";
  if (node.id === "ccs_f4_air") return "AIR";
  if (node.id === "ccs_f4_lis") return "LIS";
  if (node.id === "ccs_f4_nas") return "NAS";
  if (node.id === "ccs_f4_rise") return "RIS";

  const roomMatch = node.id.match(/_r(\d+)$/i);
  if (roomMatch) return `R${roomMatch[1]}`;

  if (node.id === "annex_f1_room101") return "R1";
  if (node.id === "annex_f1_room102") return "R2";
  if (node.id === "annex_f1_entrance") return "ENT";

  return node.label;
};

export default function Graph({
  buildingId,
  pathNodeIds = [],
  currentNodeId = null,
  destinationNodeId = null,
  fullScreen = false,
}: GraphProps) {
  const building = MAP_DATA.buildings[buildingId];
  const [dialogNodeId, setDialogNodeId] = useState<string | null>(null);

  const rows = useMemo(() => {
    if (!building) return [] as Array<{ level: number; nodes: MapNode[] }>;

    return [...building.floors]
      .sort((a, b) => b.level - a.level)
      .map((floor) => ({
        level: floor.level,
        nodes: floor.nodes
          .filter(
            (node) =>
              NODE_TYPES_FOR_GRAPH.has(node.type) && !HIDDEN_GRAPH_NODE_IDS.has(node.id)
          )
          .sort((a, b) => a.x - b.x),
      }));
  }, [building]);

  const pathSet = useMemo(() => new Set(pathNodeIds), [pathNodeIds]);
  const showOutsideStart = currentNodeId === OUTSIDE_CENTER_NODE_ID;

  if (!building || rows.length === 0) {
    return (
      <View style={[styles.emptyWrap, fullScreen && styles.emptyWrapFull]}>
        <Text style={styles.emptyTitle}>Graph unavailable</Text>
        <Text style={styles.emptyText}>No graph data found for this building.</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, fullScreen && styles.containerFull]}>
      <Text style={styles.title}>{building.name}</Text>
      <Text style={styles.subtitle}>
        {building.id === "ccs"
          ? "4th floor at top to 1st floor at bottom"
          : "Single-floor building graph"}
      </Text>

      <ScrollView
        horizontal={false}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.gridContent}
        bounces={false}
      >
        <View style={styles.grid}>
          {showOutsideStart ? (
            <View style={styles.outsideWrap}>
              <View style={[styles.cell, styles.cellCurrent, styles.outsideCell]}>
                <Text style={[styles.cellText, styles.cellTextOnHighlight]}>out</Text>
              </View>
            </View>
          ) : null}

          {rows.map((row) => {
            const rowHasDialog = row.nodes.some((node) => node.id === dialogNodeId);
            const isTopRow = row.level === rows[0]?.level;

            return (
            <View
              key={`floor-${row.level}`}
              style={[styles.rowWrap, rowHasDialog && styles.rowWrapActive]}
            >
              <View style={styles.floorBadge}>
                <Text style={styles.floorBadgeText}>L{row.level}</Text>
              </View>

              <View style={styles.rowLine}>
                {row.nodes.map((node) => {
                  const isCurrent = node.id === currentNodeId;
                  const isDestination = node.id === destinationNodeId;
                  const isPath = pathSet.has(node.id);
                  const isStairs = node.type === "stairs";
                  const isPortal = node.type === "entrance";
                  const showDialog = dialogNodeId === node.id;
                  const isMcrNode = node.id.includes("_mcr");
                  const isFirstFloorSmall =
                    building.id === "ccs" &&
                    row.level === 1 &&
                    [
                      "ccs_f1_r1",
                      "ccs_f1_offices",
                      "ccs_f1_canteen",
                      "ccs_f1_r2",
                      "ccs_f1_r4",
                      "ccs_f1_r5",
                    ].includes(node.id);

                  return (
                    <Pressable
                      key={node.id}
                      onPress={() => setDialogNodeId((prev) => (prev === node.id ? null : node.id))}
                      style={[
                        styles.cell,
                        isFirstFloorSmall && styles.cellSmall,
                        isStairs && styles.cellStairs,
                        isPortal && styles.cellPortal,
                        isPath && styles.cellPath,
                        isCurrent && styles.cellCurrent,
                        isDestination && styles.cellDestination,
                        showDialog && styles.cellDialogAnchor,
                      ]}
                    >
                      {showDialog ? (
                        <View
                          style={[
                            styles.nodeDialog,
                            isTopRow && styles.nodeDialogBelow,
                            isMcrNode && styles.nodeDialogMcr,
                            isTopRow && isMcrNode && styles.nodeDialogMcrBelow,
                          ]}
                        >
                          <Text style={styles.nodeDialogText}>{node.label}</Text>
                          <View
                            style={[
                              styles.nodeDialogArrow,
                              isTopRow && styles.nodeDialogArrowBelow,
                              isMcrNode && styles.nodeDialogArrowMcr,
                              isTopRow && isMcrNode && styles.nodeDialogArrowMcrBelow,
                            ]}
                          />
                        </View>
                      ) : null}
                      <Text
                        numberOfLines={2}
                        style={[
                          styles.cellText,
                          styles.cellTextSmall,
                          (isCurrent || isDestination) && styles.cellTextOnHighlight,
                        ]}
                      >
                        {getGraphLabel(node)}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          );
          })}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#d5e2fb",
    backgroundColor: "#f7faff",
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 12,
  },
  containerFull: {
    borderRadius: 0,
    borderWidth: 0,
    backgroundColor: "#E3EAFD",
    flex: 1,
    paddingTop: 24,
    paddingHorizontal: 10,
  },
  title: {
    color: "#002A7A",
    fontSize: 17,
    fontWeight: "900",
  },
  subtitle: {
    color: "#5c79ac",
    fontSize: 12,
    marginTop: 2,
    marginBottom: 10,
  },
  gridContent: {
    width: "100%",
  },
  grid: {
    gap: 8,
    marginTop: 8,
    alignItems: "center",
  },
  rowWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    width: "100%",
    justifyContent: "center",
    overflow: "visible",
  },
  rowWrapActive: {
    zIndex: 40,
    elevation: 20,
  },
  floorBadge: {
    width: 35,
    borderRadius: 10,
    backgroundColor: "#002A7A",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
  },
  floorBadgeText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "800",
  },
  rowLine: {
    flexDirection: "row",
    flexWrap: "wrap",
    flex: 1,
    minHeight: 48,
    gap: 4,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
    overflow: "visible",
  },
  cell: {
    width: 35,
    minWidth: 35,
    maxWidth: 35,
    minHeight: 35,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#c6d7f8",
    backgroundColor: "#ffffff",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 2,
    paddingVertical: 8,
    position: "relative",
    overflow: "visible",
  },
  cellDialogAnchor: {
    zIndex: 60,
    elevation: 30,
  },
  cellSmall: {
    width: 22,
    minWidth: 22,
    maxWidth: 22,
  },
  cellStairs: {
    backgroundColor: "#fff4e0",
    borderColor: "#e4bb78",
  },
  cellPortal: {
    backgroundColor: "#e6f2ff",
    borderColor: "#7ab0f0",
  },
  cellPath: {
    borderColor: "#20a35a",
    borderWidth: 1.5,
    backgroundColor: "#e8f9ef",
  },
  cellCurrent: {
    backgroundColor: "#00A86B",
    borderColor: "#008a58",
  },
  cellDestination: {
    backgroundColor: "#D62828",
    borderColor: "#b61e1e",
  },
  cellText: {
    color: "#163b79",
    fontSize: 11,
    fontWeight: "700",
    textAlign: "center",
  },
  cellTextSmall: {
    fontSize: 11,
  },
  cellTextOnHighlight: {
    color: "#ffffff",
  },
  nodeDialog: {
    position: "absolute",
    bottom: "100%",
    marginBottom: 8,
    left: "50%",
    transform: [{ translateX: -62 }],
    width: 124,
    backgroundColor: "rgba(18, 27, 46, 0.92)",
    borderRadius: 10,
    paddingVertical: 7,
    paddingHorizontal: 8,
    zIndex: 120,
    elevation: 40,
  },
  nodeDialogMcr: {
    transform: [{ translateX: -84 }],
  },
  nodeDialogBelow: {
    top: "100%",
    bottom: undefined,
    marginTop: 8,
    marginBottom: 0,
  },
  nodeDialogMcrBelow: {
    transform: [{ translateX: -84 }],
  },
  nodeDialogText: {
    color: "#ffffff",
    fontSize: 11,
    fontWeight: "700",
    textAlign: "center",
  },
  nodeDialogArrow: {
    position: "absolute",
    bottom: -6,
    left: "50%",
    marginLeft: -6,
    width: 0,
    height: 0,
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderTopWidth: 6,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    borderTopColor: "rgba(18, 27, 46, 0.92)",
  },
  nodeDialogArrowBelow: {
    top: -6,
    bottom: undefined,
    borderTopWidth: 0,
    borderBottomWidth: 6,
    borderTopColor: "transparent",
    borderBottomColor: "rgba(18, 27, 46, 0.92)",
  },
  nodeDialogArrowMcr: {
    marginLeft: 16,
  },
  nodeDialogArrowMcrBelow: {
    marginLeft: 16,
  },
  outsideWrap: {
    width: "100%",
    alignItems: "center",
    marginBottom: 2,
  },
  outsideCell: {
    width: 64,
    minWidth: 64,
    maxWidth: 64,
    paddingVertical: 7,
  },
  emptyWrap: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#d5e2fb",
    backgroundColor: "#f7faff",
    padding: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyWrapFull: {
    flex: 1,
    borderWidth: 0,
    borderRadius: 0,
  },
  emptyTitle: {
    color: "#002A7A",
    fontSize: 16,
    fontWeight: "900",
  },
  emptyText: {
    color: "#5c79ac",
    fontSize: 12,
    marginTop: 4,
    textAlign: "center",
  },
});
