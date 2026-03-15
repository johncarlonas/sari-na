import React, { useMemo, useState, useEffect, useRef, useCallback } from "react";
import { Modal, Pressable, StyleSheet, Text, View, ScrollView, Animated, Easing } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import places, { Place } from "../data/places";
import { LinearGradient } from "expo-linear-gradient";
import * as Location from "expo-location";
// eslint-disable-next-line import/no-unresolved
import Index from "../components/map";
import PathStripMap from "../components/PathStripMap";
import { MapService } from "../../services/mapService";
import type { MapNode } from "../../types/mapTypes";
import { MAP_DATA } from "../../constants/mapData";
import type { QrCheckpoint } from "../../constants/qrCheckpoints";
import { useFocusEffect } from "@react-navigation/native";

// simple tuple for longitude/latitude pairs used in this screen
type LngLat = [number, number];

type Params = {
  location?: string;
  detail?: string;
  placeId?: string;
};

export default function NavigationScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<Params>();
  const insets = useSafeAreaInsets();
  const navSafeBottom = Math.max(insets.bottom, 14);
  const CARD_COLLAPSED_HEIGHT = 260 + navSafeBottom; 
 


  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [showGuideModal, setShowGuideModal] = useState(false);
  const [currentCheckpoint, setCurrentCheckpoint] = useState<QrCheckpoint | null>(null);
  const [showLostToast, setShowLostToast] = useState(false);
  const toastOpacity = useRef(new Animated.Value(0)).current;
  const toastX = useRef(new Animated.Value(0)).current;
  const buttonScale = useRef(new Animated.Value(1)).current;
  const [activeFloorKey, setActiveFloorKey] = useState<string | null>(null);
  const [heading, setHeading] = useState(0);
  const allPlaces = places as Place[];

  const location = typeof params.location === "string" ? params.location : "Selected location";
  const detail = typeof params.detail === "string" ? params.detail : "";
  const placeId = typeof params.placeId === "string" ? params.placeId : "";

  const destinationPlace = useMemo(() => {
    if (!placeId) return null;
    return allPlaces.find((item) => item.id === placeId) ?? null;
  }, [allPlaces, placeId]);

  // campus bounding box used for fitting the map view
  const campusBounds = useMemo(() => {
    if (!allPlaces.length) {
      return {
        ne: [123.3779, 13.4069] as LngLat,
        sw: [123.3732, 13.4048] as LngLat,
      };
    }

    const coords = allPlaces.map((item) => {
      const [lat, lng] = item.coords;
      return [lng, lat] as LngLat;
    });

    const minLng = Math.min(...coords.map((item) => item[0])) - 0.00035;
    const maxLng = Math.max(...coords.map((item) => item[0])) + 0.00035;
    const minLat = Math.min(...coords.map((item) => item[1])) - 0.00035;
    const maxLat = Math.max(...coords.map((item) => item[1])) + 0.00035;

    return {
      ne: [maxLng, maxLat] as LngLat,
      sw: [minLng, minLat] as LngLat,
    };
  }, [allPlaces]);

  const destinationNodeId = destinationPlace?.mapNodeId ?? "";
  const fallbackStartNode = destinationPlace?.buildingId === "annex" ? "ccs_f1_portal_annex" : "ccs_f1_r1";
  const startNodeId = currentCheckpoint?.nodeId ?? fallbackStartNode;

  const pathNodes = useMemo<MapNode[] | null>(() => {
    if (!destinationNodeId) return null;
    return MapService.calculateRoute(startNodeId, destinationNodeId);
  }, [destinationNodeId, startNodeId]);

  type FloorSlice = {
    key: string;
    buildingId: string;
    floor: number;
    buildingName: string;
    pathNodeIds: string[];
  };

  type IndoorMapDescriptor = {
    buildingId: string;
    floorLevel: number;
    pathNodeIds: string[];
    targetNodeId: string | null;
  };

  const floorSlices = useMemo<FloorSlice[]>(() => {
    if (!pathNodes || pathNodes.length === 0) return [];
    const buckets = new Map<string, FloorSlice>();
    pathNodes.forEach((node) => {
      const key = `${node.buildingId}-${node.floor}`;
      if (!buckets.has(key)) {
        const buildingName =
          MAP_DATA.buildings[node.buildingId]?.name ?? node.buildingId.toUpperCase();
        buckets.set(key, {
          key,
          buildingId: node.buildingId,
          floor: node.floor,
          buildingName,
          pathNodeIds: [],
        });
      }
      buckets.get(key)!.pathNodeIds.push(node.id);
    });
    return Array.from(buckets.values());
  }, [pathNodes]);

  useEffect(() => {
    if (!floorSlices.length) {
      setActiveFloorKey(null);
      return;
    }
    if (!activeFloorKey || !floorSlices.some((slice) => slice.key === activeFloorKey)) {
      setActiveFloorKey(floorSlices[0].key);
    }
  }, [floorSlices, activeFloorKey]);

  const activeSlice = useMemo(() => {
    if (!activeFloorKey) return null;
    return floorSlices.find((slice) => slice.key === activeFloorKey) ?? null;
  }, [floorSlices, activeFloorKey]);

  const instructionSteps = useMemo(
    () =>
      (pathNodes ?? []).map((node, index) => ({
        node,
        index,
        buildingName: MAP_DATA.buildings[node.buildingId]?.name ?? node.buildingId.toUpperCase(),
      })),
    [pathNodes]
  );

  const currentFloorPlan = useMemo<IndoorMapDescriptor | null>(() => {
    if (currentCheckpoint) {
      const buildingId = currentCheckpoint.buildingId;
      const floorLevel = currentCheckpoint.floor;
      const fallbackIds = [currentCheckpoint.nodeId];

      if (!pathNodes || pathNodes.length === 0) {
        return { buildingId, floorLevel, pathNodeIds: fallbackIds, targetNodeId: fallbackIds[0] };
      }

      const currentIndex = pathNodes.findIndex((node) => node.id === currentCheckpoint.nodeId);
      const ids: string[] = [];
      if (currentIndex !== -1) {
        for (let i = currentIndex; i < pathNodes.length; i += 1) {
          const node = pathNodes[i];
          if (node.buildingId === buildingId && node.floor === floorLevel) {
            ids.push(node.id);
          } else {
            break;
          }
        }
      }

      const safeIds = ids.length ? ids : fallbackIds;
      const finalNode = pathNodes[pathNodes.length - 1];
      const sameFloorAsDestination =
        finalNode &&
        destinationNodeId &&
        finalNode.buildingId === buildingId &&
        finalNode.floor === floorLevel;
      const targetNodeId = sameFloorAsDestination
        ? destinationNodeId
        : safeIds[safeIds.length - 1] ?? currentCheckpoint.nodeId;

      return {
        buildingId,
        floorLevel,
        pathNodeIds: Array.from(new Set(safeIds)),
        targetNodeId,
      };
    }

    if (pathNodes && pathNodes.length > 0) {
      const first = pathNodes[0];
      const ids = pathNodes
        .filter((node) => node.buildingId === first.buildingId && node.floor === first.floor)
        .map((node) => node.id);
      const finalNode = pathNodes[pathNodes.length - 1];
      const sameFloor =
        finalNode.buildingId === first.buildingId && finalNode.floor === first.floor;

      return {
        buildingId: first.buildingId,
        floorLevel: first.floor,
        pathNodeIds: ids,
        targetNodeId: sameFloor
          ? finalNode.id
          : ids[ids.length - 1] ?? first.id,
      };
    }

    return null;
  }, [currentCheckpoint, destinationNodeId, pathNodes]);

  const destinationCoords: LngLat = useMemo(() => {
    if (!destinationPlace) return [123.377169, 13.405669];
    const [lat, lng] = destinationPlace.coords;
    return [lng, lat];
  }, [destinationPlace]);

  const destinationTitle = destinationPlace?.title ?? location;
  const destinationSubtitle = destinationPlace?.subtitle ?? detail;
  const hasLiveLocation = Boolean(currentCheckpoint);
  const currentLocationTitle = hasLiveLocation
    ? currentCheckpoint?.location ?? "Pinned via QR"
    : "Scan QR to pin start";
  const currentLocationDetail = hasLiveLocation
    ? currentCheckpoint?.detail ?? "Indoor anchor point"
    : "Scan a SARI NA QR marker to ground navigation";
  const hasReachedDestination = Boolean(
    destinationNodeId && currentCheckpoint?.nodeId === destinationNodeId
  );

  const guideSteps = useMemo(() => {
    if (!pathNodes || pathNodes.length < 2) {
      return [
        "Scan the nearest QR code to ground your position.",
        "Follow the highlighted indoor map inside the CCS building.",
        "Scan the QR code at the destination to confirm arrival.",
      ];
    }

    const steps: string[] = [];
    pathNodes.forEach((node, index) => {
      if (index === 0) {
        steps.push(`Start at ${node.label} • Floor ${node.floor}`);
        return;
      }

      const prev = pathNodes[index - 1];
      if (node.buildingId !== prev.buildingId) {
        const prevBuilding =
          MAP_DATA.buildings[prev.buildingId]?.name ?? prev.buildingId.toUpperCase();
        const nextBuilding =
          MAP_DATA.buildings[node.buildingId]?.name ?? node.buildingId.toUpperCase();
        steps.push(`Exit ${prevBuilding} via the portal nodes and walk to ${nextBuilding}.`);
      }
      steps.push(`Continue to ${node.label} (${node.instruction})`);
    });

    steps.push("Scan the QR code mounted at your destination to log arrival.");
    return steps;
  }, [pathNodes]);

  // BUG-8 FIX: Re-read checkpoint every time this screen gains focus
  useFocusEffect(
    useCallback(() => {
      try {
        const checkpoint = (global as any).currentCheckpoint as QrCheckpoint | undefined;
        if (checkpoint) setCurrentCheckpoint(checkpoint);
      } catch {}
    }, [])
  );

  const goToArrival = () => {
    setShowCompleteModal(false);
    // BUG-9 FIX: Compute dynamic journey summary data
    const startLabel = currentCheckpoint?.location ?? "QR start point";
    const buildingSet = new Set((pathNodes ?? []).map((n) => n.buildingId));
    const buildingsCrossed = Math.max(buildingSet.size, 1);
    router.replace({
      pathname: "/user/arrival",
      params: {
        location: destinationTitle,
        detail: destinationSubtitle,
        placeId,
        startLocation: startLabel,
        buildingsCrossed: String(buildingsCrossed),
      },
    });
  };

  const goToScanQr = () => {
    setShowCompleteModal(false);
    router.push({
      pathname: "/user/scan_qr",
      params: {
        mode: "arrival",
        location: destinationTitle,
        detail: destinationSubtitle,
        placeId,
      },
    });
  };

  const goToScanLost = () => {
    router.push({
      pathname: "/user/scan_qr",
      params: {
        mode: "navigation",
        location: destinationTitle,
        detail: destinationSubtitle,
        placeId,
      },
    });
  };

  // toast timer with fade and slide
  useEffect(() => {
    const interval = setInterval(() => {
      setShowLostToast(true);
      Animated.sequence([
        Animated.parallel([
          Animated.timing(toastOpacity, { toValue: 1, duration: 300, useNativeDriver: true }),
          Animated.timing(toastX, { toValue: -60, duration: 300, useNativeDriver: true }),
        ]),
        Animated.delay(5000),
        Animated.parallel([
          Animated.timing(toastOpacity, { toValue: 0, duration: 300, useNativeDriver: true }),
          Animated.timing(toastX, { toValue: 0, duration: 300, useNativeDriver: true }),
        ]),
      ]).start(() => setShowLostToast(false));
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  // floating button very gentle pulse
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(buttonScale, { toValue: 1.02, duration: 1200, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(buttonScale, { toValue: 1, duration: 1200, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    ).start();
  }, []);
  // heading compass tracking
  useEffect(() => {
    let mounted = true;
    let headingSub: Location.LocationSubscription | null = null;
    
    const startTracking = async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") return;
        
        headingSub = await Location.watchHeadingAsync((hd: any) => {
          const angle = Number(hd?.trueHeading ?? hd?.magHeading ?? 0);
          if (mounted && Number.isFinite(angle)) {
            setHeading(angle);
          }
        });
      } catch {}
    };
    
    startTracking();
    return () => {
      mounted = false;
      try { headingSub?.remove(); } catch {}
    };
  }, []);

  const indoorMapProps = useMemo<IndoorMapDescriptor | null>(() => {
    if (currentFloorPlan) {
      return currentFloorPlan;
    }
    if (activeSlice) {
      const lastId =
        activeSlice.pathNodeIds[activeSlice.pathNodeIds.length - 1] ?? null;
      return {
        buildingId: activeSlice.buildingId,
        floorLevel: activeSlice.floor,
        pathNodeIds: activeSlice.pathNodeIds,
        targetNodeId: destinationNodeId || lastId,
      };
    }
    return null;
  }, [currentFloorPlan, activeSlice, destinationNodeId]);

  const floorTargetNode = useMemo<MapNode | null>(() => {
    if (!indoorMapProps?.targetNodeId) return null;
    const building = MAP_DATA.buildings[indoorMapProps.buildingId];
    const floor = building?.floors.find((f) => f.level === indoorMapProps.floorLevel);
    return floor?.nodes.find((node) => node.id === indoorMapProps.targetNodeId) ?? null;
  }, [indoorMapProps]);

  const targetIsDestination = Boolean(
    destinationNodeId && indoorMapProps?.targetNodeId === destinationNodeId
  );

  const floorMetaLabel = useMemo(() => {
    if (!indoorMapProps) return null;
    const buildingName =
      MAP_DATA.buildings[indoorMapProps.buildingId]?.name ??
      indoorMapProps.buildingId.toUpperCase();
    return `${buildingName} - L${indoorMapProps.floorLevel}`;
  }, [indoorMapProps]);

  const floorInstruction = useMemo<{ icon: string; title: string; subtitle: string } | null>(() => {
    if (!indoorMapProps) return null;
    if (hasReachedDestination) {
      return {
        icon: "checkmark-circle",
        title: "You're already at the destination",
        subtitle: "Tap Complete Navigation below to log your arrival.",
      };
    }
    if (targetIsDestination) {
      return {
        icon: "flag",
        title: `Proceed to ${destinationPlace?.title ?? "your destination"}`,
        subtitle: "Follow the red path to reach the room entrance.",
      };
    }
    if (floorTargetNode) {
      const isStairs = floorTargetNode.type === "stairs";
      return {
        icon: isStairs ? "walk" : "navigate",
        title: isStairs
          ? `Go to ${floorTargetNode.label}`
          : `Head toward ${floorTargetNode.label}`,
        subtitle: isStairs
          ? "Use this stairwell to continue to the next floor."
          : "This is your next checkpoint on this floor.",
      };
    }
    return {
      icon: "navigate",
      title: "Follow the highlighted path",
      subtitle: "Move between the highlighted rooms on this floor.",
    };
  }, [destinationPlace?.title, floorTargetNode, hasReachedDestination, indoorMapProps, targetIsDestination]);

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <View style={styles.mapWrap}>
        {indoorMapProps ? (
          <View
            style={[
              styles.indoorMapContainer,
              { paddingTop: insets.top + 60 },
            ]}
          >
            <PathStripMap
              buildingId={indoorMapProps.buildingId}
              floorLevel={indoorMapProps.floorLevel}
              pathNodeIds={indoorMapProps.pathNodeIds}
              currentNodeId={currentCheckpoint?.nodeId ?? null}
              destinationNodeId={indoorMapProps.targetNodeId}
              heading={heading}
              fullScreen
            />
            {floorInstruction && (
              <View style={[styles.floorTipCard, { bottom: navSafeBottom + 40 }]}>
                <View style={styles.floorTipIcon}>
                  <Ionicons name={floorInstruction.icon as any} size={18} color="#ffffff" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.floorTipTitle}>{floorInstruction.title}</Text>
                  <Text style={styles.floorTipSubtitle}>{floorInstruction.subtitle}</Text>
                  {floorMetaLabel && (
                    <Text style={styles.floorTipMeta}>{floorMetaLabel}</Text>
                  )}
                </View>
              </View>
            )}
          </View>
        ) : (
          <Index
            simple={false}
            destination={{ latitude: destinationCoords[1], longitude: destinationCoords[0] }}
          />
        )}

        {hasReachedDestination && (
          <Pressable
            style={[styles.reachedBanner, { top: insets.top + 120 }]}
            onPress={goToArrival}
          >
            <View style={styles.reachedIcon}>
              <Ionicons name="flag" size={18} color="#ffffff" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.reachedTitle}>Destination reached</Text>
              <Text style={styles.reachedSubtitle}>
                You are at {currentCheckpoint?.location ?? "the destination QR"}. Tap to finalize.
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#002A7A" />
          </Pressable>
        )}

        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color="#002A7A" />
          <Text style={[styles.backText, { marginLeft: 4 }]}>Navigation</Text>
        </Pressable>

        <View style={[styles.androidNavBg, { height: navSafeBottom  }]} pointerEvents="none" />

        <View
          style={[styles.bottomCardWrapper, { height: CARD_COLLAPSED_HEIGHT + 5 }]}
        >
          <View style={styles.bottomCard}>
            <View style={styles.dragArea}>
              <View style={styles.handle} />
              <View style={styles.routeRow}>
              <View style={styles.iconBlue}>
                <Ionicons name="ellipse" size={12} color="#ffffff" />
              </View>
              <View style={styles.routeTextWrap}>
                <Text style={styles.routeTitle}>{currentLocationTitle}</Text>
                <Text style={styles.routeDetail}>{currentLocationDetail}</Text>
              </View>
            </View>

            <View style={styles.routeRow}>
              <View style={styles.iconRed}>
                <Ionicons name="location" size={25} color="#cf1f2d" />
              </View>
              <View style={styles.routeTextWrap}>
                <Text style={styles.routeTitle}>{destinationTitle}</Text>
                <Text style={styles.routeDetail}>{destinationSubtitle}</Text>
              </View>
            </View>
            </View>

            <ScrollView
              style={styles.extraContent}
              contentContainerStyle={[styles.cardContent, { paddingBottom: 0 }]}
              nestedScrollEnabled
              scrollEnabled
              showsVerticalScrollIndicator={false}
            >
              {pathNodes ? (
                <>
                  <Text style={styles.sectionHeading}>Turn-by-turn</Text>
                  {instructionSteps.map((step) => (
                    <View key={`${step.node.id}-${step.index}`} style={styles.instructionCard}>
                      <View style={styles.stepNumber}>
                        <Text style={styles.stepNumberText}>{step.index + 1}</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.stepTitle}>{step.node.label}</Text>
                        <Text style={styles.stepInstruction}>{step.node.instruction}</Text>
                        <Text style={styles.stepMeta}>
                          {step.buildingName} • Floor {step.node.floor}
                        </Text>
                      </View>
                    </View>
                  ))}
                </>
              ) : (
                <View style={styles.emptyWrap}>
                  <Text style={styles.emptyTitle}>Pick a mapped destination</Text>
                  <Text style={styles.emptyText}>
                    Indoor instructions will appear here for CCS and Annex rooms.
                  </Text>
                </View>
              )}

              {floorSlices.length > 0 && (
                <View style={styles.graphSection}>
                  <Text style={styles.sectionHeading}>Indoor Map Preview</Text>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.floorTabs}
                  >
                    {floorSlices.map((slice) => (
                      <Pressable
                        key={slice.key}
                        style={[
                          styles.floorTab,
                          activeSlice?.key === slice.key && styles.floorTabActive,
                        ]}
                        onPress={() => setActiveFloorKey(slice.key)}
                      >
                        <Text
                          style={[
                            styles.floorTabText,
                            activeSlice?.key === slice.key && styles.floorTabTextActive,
                          ]}
                        >
                          {slice.buildingName} • L{slice.floor}
                        </Text>
                      </Pressable>
                    ))}
                  </ScrollView>
                  {activeSlice ? (
                    <PathStripMap
                      buildingId={activeSlice.buildingId}
                      floorLevel={activeSlice.floor}
                      pathNodeIds={activeSlice.pathNodeIds}
                      currentNodeId={currentCheckpoint?.nodeId ?? null}
                      destinationNodeId={destinationNodeId || null}
                    />
                  ) : (
                    <View style={styles.graphPlaceholder}>
                      <Text style={styles.graphPlaceholderText}>
                        Select a floor to preview the static route.
                      </Text>
                    </View>
                  )}
                </View>
              )}
            </ScrollView>

          <LinearGradient
            colors={["#1565C0", "#002A7A"]}
            style={styles.googleWrapper}
          >
            <Pressable style={styles.googleButton} onPress={() => setShowGuideModal(true)}>
              <Text style={styles.googleText}>Click to view navigation guide</Text>
            </Pressable>
          </LinearGradient>

          <Modal
            visible={showGuideModal}
            transparent
            animationType="fade"
            onRequestClose={() => setShowGuideModal(false)}
          >
            <Pressable style={styles.modalBackdrop} onPress={() => setShowGuideModal(false)}>
              <View style={styles.modalCard} pointerEvents="box-none">
                <Text style={styles.modalTitle}>Navigation Guide</Text>
                {guideSteps.map((step, index) => (
                  <View key={index} style={styles.guideRow}>
                    <Text style={styles.guideStep}>{step}</Text>
                    {index < guideSteps.length - 1 && (
                      <Ionicons
                        name="chevron-down"
                        size={20}
                        color="#0b489d"
                        style={styles.guideArrow}
                      />
                    )}
                  </View>
                ))}
                <Pressable
                  style={[styles.modalPrimary, { marginTop: 12 }]}
                  onPress={() => setShowGuideModal(false)}
                >
                  <LinearGradient
                    colors={["#1565C0", "#002A7A"]}
                    // start={{ x: 0, y: 0 }}
                    // end={{ x: 1, y: 0 }}
                    style={styles.modalPrimaryGradient}
                  >
                    <Text style={styles.modalPrimaryText}>Close</Text>
                  </LinearGradient>
                </Pressable>
              </View>
            </Pressable>
          </Modal>

          <Pressable style={styles.completeButton} onPress={() => setShowCompleteModal(true)}>
            <LinearGradient
              colors={["#1565C0", "#002A7A"]}
              // start={{ x: 0, y: 0 }}
              // end={{ x: 1, y: 0 }}
              style={styles.completeButtonGradient}
            >
              <Text style={styles.completeButtonText}>Complete Navigation</Text>
            </LinearGradient>
          </Pressable>

          </View>
        </View>
      </View>

      <Modal
        visible={showCompleteModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowCompleteModal(false)}
      >
        <Pressable style={styles.modalBackdrop} onPress={() => setShowCompleteModal(false)}>
          <View style={styles.modalCard} pointerEvents="box-none">
            <Text style={styles.modalTitle}>Arrival Confirmation</Text>
            <Text style={styles.modalText}>
              To confirm your arrival, please scan the QR code at the destination or skip this
              step.
            </Text>

            <View style={styles.modalDestination}>
              <View style={styles.iconRed}>
                <Ionicons name="location" size={25} color="#cf1f2d" />
              </View>
              <View style={styles.routeTextWrap}>
                <Text style={styles.routeTitle}>{destinationTitle}</Text>
                <Text style={styles.routeDetail}>{destinationSubtitle}</Text>
              </View>
            </View>

            <Pressable style={[styles.modalPrimary, { marginTop: 12 }]} onPress={goToScanQr}>
              <LinearGradient
                colors={["#1565C0", "#002A7A"]}
                // start={{ x: 0, y: 0 }}
                // end={{ x: 1, y: 0 }}
                style={styles.modalPrimaryGradient}
              >
                <Text style={styles.modalPrimaryText}>Scan QR Code</Text>
              </LinearGradient>
            </Pressable>

            <LinearGradient
              colors={["#1565C0", "#002A7A"]}
              style={styles.skipWrapper}
            >
              <Pressable style={styles.modalSecondary} onPress={goToArrival}>
                <Text style={styles.modalSecondaryText}>Skip</Text>
              </Pressable>
            </LinearGradient>
          </View>
        </Pressable>
      </Modal>
            {/* floating lost icon */}
        {showLostToast && (
          <View style={styles.toast}>
            <Text style={styles.toastText}>Lost? Scan nearest QR Code</Text>
          </View>
        )}
        <Animated.View style={[styles.floatingButton, { transform: [{ scale: buttonScale }] }]}>
          <LinearGradient colors={["#002A7A", "#1565C0"]} style={styles.floatingButton} >
            <Pressable onPress={goToScanLost}>
              <Ionicons name="scan" size={35} color="#ffffff" />
            </Pressable>
          </LinearGradient>
        </Animated.View>
      </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#edf2f8",
  },
  mapWrap: {
    flex: 1,
  },
  indoorMapContainer: {
    flex: 1,
    backgroundColor: "#E3EAFD",
    alignItems: "center",
    justifyContent: "flex-start",
    position: "relative",
  },
  backButton: {
    position: "absolute",
    top: 105,
    left: 5,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    height: 38,
    justifyContent: "center",

  },
  backText: {
    fontSize: 25,
    fontWeight: "900",
    color: "#002A7A",
  },
  markerOuter: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#ffffff",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#f2c7cc",
  },
  tokenWarningWrap: {
    flex: 1,
    paddingHorizontal: 30,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#dfe8f7",
  },
  tokenWarningTitle: {
    fontSize: 20,
    fontWeight: "900",
    color: "#002A7A",
    marginBottom: 8,
  },
  tokenWarningText: {
    fontSize: 14,
    textAlign: "center",
    color: "#5e79ac",
  },
  tokenWarningError: {
    fontSize: 11,
    textAlign: "center",
    color: "#7c8eb4",
    marginTop: 8,
  },
  bottomCardWrapper: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 20,
  },
  androidNavBg: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "#ffffff",
    zIndex: 30, // above card wrapper so strip remains visible
  },
  bottomCard: {
    backgroundColor: "#ffffff",
    borderTopLeftRadius: 25,
    borderTopRightRadius: 30,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 20,
    flex: 1,
  },
  cardContent: {
    paddingTop: 4,
  },
  extraContent: {
    flexGrow: 0,
    // scrollable padding only applies to dynamic content above
  },
  handle: {
    width: 50,
    height: 4,
    backgroundColor: "#c4c4c4",
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 15,
  },
  dragArea: {
    paddingBottom: 2,
  },
  routeRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  routeTextWrap: {
    flex: 1,
    marginLeft: 10,
  },
  routeTitle: {
    fontSize: 16,
    fontWeight: "900",
    color: "#002A7A",
  },
  routeDetail: {
    fontSize: 13,
    color: "#6b84b7",
  },
  iconBlue: {
    width: 20,
    height: 20,
    borderRadius: 14,
    backgroundColor: "#2b8be8",
    alignItems: "center",
    justifyContent: "center",
  },
  iconRed: {
    width: 25,
    height: 25,
    borderRadius: 14,
    backgroundColor: "none",
    alignItems: "center",
    justifyContent: "center",
  },
  // reuse same styles as the login/signup screen google button
  googleText: {
    color: "#002A7A",
    fontSize: 18,
    fontWeight: "700",
    marginLeft: 8,
  },
  googleWrapper: {
    borderRadius: 27,
    padding: 3,
    alignSelf: "stretch",
    marginTop: 5,
  },
  googleButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#ffffff",
    borderRadius: 27,
    height: 45,
    paddingHorizontal: 15,
  },
  completeButton: {
    marginTop: 10,
    height: 50,
    borderRadius: 30,
    overflow: "hidden",
  },
  completeButtonGradient: {
    flex: 1,
    borderRadius: 27,
    alignItems: "center",
    justifyContent: "center",
  },
  completeButtonText: {
    color: "#ffffff",
    fontSize: 20,
    fontWeight: "800",
  },
  lostButton: {
    marginTop: 8,
    height: 48,
    borderRadius: 12,
    backgroundColor: "#002A7A",
    alignItems: "center",
    justifyContent: "center",
  },
  lostButtonText: {
    fontSize: 18,
    fontWeight: "800",
    color: "#ffffff",
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(4, 17, 43, 0.44)",
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  modalCard: {
    backgroundColor: "#f5f8fd",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 14,
  },
  modalTitle: {
    fontSize: 25,
    fontWeight: "900",
    color: "#002A7A",
    textAlign: "center",
    marginBottom: 14,
  },
  modalText: {
    fontSize: 14,
    color: "#31538f",
    textAlign: "center",
    marginTop: 10,
    marginBottom: 14,
  },
  guideStep: {
    fontSize: 14,
    color: "#31538f",
    marginVertical: 4,
    paddingHorizontal: 8,
    textAlign: "center",
  },
  guideRow: {
   alignItems: "center",
  },
  guideArrow: {
    alignSelf: "center",
    marginVertical: 2,
  },
  modalDestination: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#cfe0f9",
    padding: 12,
    backgroundColor: "#eaf1fc",
    marginBottom: 5,
  },
  modalPrimary: {
    height: 50, 
    borderRadius: 13,
    backgroundColor: "transparent",
    alignItems: "center",
    justifyContent: "center",
  },
  modalPrimaryGradient: {
    flex: 1,
    borderRadius: 30,
    overflow: "hidden",
    alignSelf: "stretch",
    alignItems: "center",
    justifyContent: "center",
  },
  skipWrapper: {
    borderRadius: 30,
    padding: 2,
    alignSelf: "stretch",
    marginTop: 10,
  },
  modalPrimaryText: {
    fontSize: 18,
    fontWeight: "800",
    color: "#ffffff",
  },
  modalSecondary: {
    height: 46,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: "transparent", // gradient wrapper provides visible border
    backgroundColor: "#ffffff",
    alignItems: "center",
    justifyContent: "center",
  },
  modalSecondaryText: {
    color: "#113e94",
    fontSize: 18,
    fontWeight: "800",
  },
  sectionHeading: {
    color: "#002A7A",
    fontSize: 16,
    fontWeight: "800",
    marginBottom: 10,
    marginTop: 8,
  },
  instructionCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderColor: "#e1e8f5",
  },
  stepNumber: {
    width: 28,
    height: 28,
    borderRadius: 16,
    backgroundColor: "#e2ecff",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4,
  },
  stepNumberText: {
    color: "#0b489d",
    fontWeight: "800",
  },
  stepTitle: {
    color: "#002A7A",
    fontSize: 15,
    fontWeight: "800",
    marginBottom: 2,
  },
  stepInstruction: {
    color: "#4868a3",
    fontSize: 13,
  },
  stepMeta: {
    color: "#8aa3ce",
    fontSize: 12,
    marginTop: 3,
  },
  emptyWrap: {
    borderWidth: 1,
    borderColor: "#d5e1fb",
    borderRadius: 16,
    padding: 14,
    marginTop: 6,
    backgroundColor: "#f6f9ff",
  },
  emptyTitle: {
    color: "#002A7A",
    fontSize: 15,
    fontWeight: "800",
    marginBottom: 6,
  },
  emptyText: {
    color: "#6b84b7",
    fontSize: 13,
  },
  graphSection: {
    marginTop: 18,
    marginBottom: 10,
  },
  floorTabs: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 10,
  },
  floorTab: {
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "#d7e2ff",
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: "#ffffff",
  },
  floorTabActive: {
    backgroundColor: "#0b489d",
    borderColor: "#0b489d",
  },
  floorTabText: {
    color: "#0b489d",
    fontSize: 12,
    fontWeight: "700",
  },
  floorTabTextActive: {
    color: "#ffffff",
  },
  graphPlaceholder: {
    borderWidth: 1,
    borderColor: "#dfe7fb",
    borderRadius: 16,
    padding: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  graphPlaceholderText: {
    color: "#6b84b7",
    fontSize: 13,
    textAlign: "center",
  },
  floatingButton: {
    position: "absolute",
    top: 95,
    right: 10,
    width: 65,
    height: 65,
    borderRadius: 50,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 40,
  },
  toast: {
    position: "absolute",
    top: 208,
    right: 100, 
    backgroundColor: "rgba(0,0,0,0.7)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    zIndex: 50,
  },
  toastText: {
    color: "#ffffff",
    fontSize: 14,
  },
  floorTipCard: {
    position: "absolute",
    left: 20,
    right: 20,
    borderRadius: 18,
    backgroundColor: "#ffffff",
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#001947",
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
  floorTipIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#002A7A",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  floorTipTitle: {
    color: "#002A7A",
    fontSize: 15,
    fontWeight: "900",
  },
  floorTipSubtitle: {
    color: "#4868a3",
    fontSize: 12,
    marginTop: 2,
  },
  floorTipMeta: {
    color: "#8da5cf",
    fontSize: 11,
    marginTop: 4,
    letterSpacing: 0.3,
  },
  reachedBanner: {
    position: "absolute",
    left: 16,
    right: 16,
    borderRadius: 18,
    backgroundColor: "#ffffff",
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#001947",
    shadowOpacity: 0.14,
    shadowRadius: 10,
    elevation: 5,
    zIndex: 45,
  },
  reachedIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#D62828",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  reachedTitle: {
    color: "#002A7A",
    fontSize: 15,
    fontWeight: "900",
  },
  reachedSubtitle: {
    color: "#5c6f95",
    fontSize: 12,
    marginTop: 2,
  },
});
