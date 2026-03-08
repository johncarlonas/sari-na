import React, { useMemo, useState, useRef } from "react";
import { Dimensions, Modal, Pressable, StyleSheet, Text, View, ScrollView, Animated, PanResponder } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import type { Feature, LineString } from "geojson";
import places from "../data/places";

// eslint-disable-next-line import/no-unresolved
import MapBoxView, { LngLat } from "../components/map";

type Params = {
  location?: string;
  detail?: string;
  placeId?: string;
};

type Place = {
  id: string;
  title: string;
  subtitle: string;
  coords: [number, number];
};


const DEFAULT_CAMPUS_CENTER: LngLat = [123.375668, 13.406402];

export default function NavigationScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<Params>();
  const insets = useSafeAreaInsets();
  const navSafeBottom = Math.max(insets.bottom, 14);
  const CARD_COLLAPSED_HEIGHT = 230 + navSafeBottom; 
  const CARD_EXPANDED_HEIGHT = Math.min(
    CARD_COLLAPSED_HEIGHT + 150,
    Dimensions.get("window").height * 0.5
  );
  const COLLAPSED_VISIBLE = CARD_COLLAPSED_HEIGHT - navSafeBottom;
  const EXPANDED_VISIBLE = CARD_EXPANDED_HEIGHT - navSafeBottom;
  const cardHeight = useRef(new Animated.Value(COLLAPSED_VISIBLE)).current;
  const startHeightRef = useRef(COLLAPSED_VISIBLE);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gesture) => Math.abs(gesture.dy) > 5,
      onPanResponderGrant: () => {
        cardHeight.stopAnimation((value) => {
          startHeightRef.current = value;
        });
      },
      onPanResponderMove: (_, gesture) => {
        const dragged = startHeightRef.current - gesture.dy;
        const nextHeight = Math.max(
          COLLAPSED_VISIBLE,
          Math.min(EXPANDED_VISIBLE, dragged)
        );
        cardHeight.setValue(nextHeight);
      },
      onPanResponderRelease: (_, gesture) => {
        const dragged = startHeightRef.current - gesture.dy;
        const releasedHeight = Math.max(
          COLLAPSED_VISIBLE,
          Math.min(EXPANDED_VISIBLE, dragged)
        );
        const midpoint = (COLLAPSED_VISIBLE + EXPANDED_VISIBLE) / 2;
        const toValue = releasedHeight > midpoint ? EXPANDED_VISIBLE : COLLAPSED_VISIBLE;

        Animated.spring(cardHeight, {
          toValue,
          useNativeDriver: false,
          bounciness: 0,
        }).start(() => {
          startHeightRef.current = toValue;
        });
      },
    })
  ).current;


  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [hasLiveLocation, setHasLiveLocation] = useState(false);
  const [liveOriginCoords, setLiveOriginCoords] = useState<LngLat>(DEFAULT_CAMPUS_CENTER);
  const allPlaces = places as Place[];

  // Mapbox is handled inside the MapBoxView component; it also tracks
  // GPS and reports back via onLocationStatusChange.

  const location = typeof params.location === "string" ? params.location : "Selected location";
  const detail = typeof params.detail === "string" ? params.detail : "";
  const placeId = typeof params.placeId === "string" ? params.placeId : "";

  const destinationPlace = useMemo(() => {
    if (!placeId) return null;
    return allPlaces.find((item) => item.id === placeId) ?? null;
  }, [allPlaces, placeId]);

  const ccsPlace = useMemo(() => {
    return allPlaces.find((item) => item.id === "ccs") ?? null;
  }, [allPlaces]);

  // campus bounding box for Mapbox maxBounds
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

  const destinationCoords: LngLat = useMemo(() => {
    if (!destinationPlace) return [123.377169, 13.405669];
    const [lat, lng] = destinationPlace.coords;
    return [lng, lat];
  }, [destinationPlace]);

  const destinationTitle = destinationPlace?.title ?? location;
  const destinationSubtitle = destinationPlace?.subtitle ?? detail;
  const currentLocationTitle = hasLiveLocation ? "Your Location (GPS)" : "Room 1";
  const currentLocationDetail = hasLiveLocation
    ? "CSPC Campus (Live)"
    : "Academic Building IV (College of Computer Studies)";

  const floorGuide = useMemo(() => {
    const match = destinationSubtitle.match(/Floor\s*([0-9]+)/i);
    if (!match?.[1]) return "Proceed to destination floor";
    return `Proceed to Floor ${match[1]}`;
  }, [destinationSubtitle]);

  const routeLine: Feature<LineString> = useMemo(() => {
    // line updates whenever live origin changes
    const fallbackOrigin: LngLat = ccsPlace
      ? ([ccsPlace.coords[1], ccsPlace.coords[0]] as LngLat)
      : ([DEFAULT_CAMPUS_CENTER[0], DEFAULT_CAMPUS_CENTER[1]] as LngLat);
    const originCoords: LngLat = hasLiveLocation ? liveOriginCoords : fallbackOrigin;

    const midLng = (originCoords[0] + destinationCoords[0]) / 2;
    const midLat = (originCoords[1] + destinationCoords[1]) / 2 + 0.00008;
    const coordinates: [number, number][] = [
      originCoords,
      [midLng, midLat],
      destinationCoords,
    ];

    return {
      type: "Feature",
      geometry: {
        type: "LineString",
        coordinates,
      },
      properties: {},
    };
  }, [destinationCoords, ccsPlace, hasLiveLocation, liveOriginCoords]);





  const goToArrival = () => {
    setShowCompleteModal(false);
    router.replace({
      pathname: "/user/arrival",
      params: {
        location: destinationTitle,
        detail: destinationSubtitle,
        placeId,
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

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <View style={styles.mapWrap}>
        <MapBoxView
          destinationCoords={destinationCoords}
          routeLine={routeLine}
          campusBounds={campusBounds}
          onLocationStatusChange={setHasLiveLocation}
          onLocationUpdate={setLiveOriginCoords}
        />

        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color="#002A7A" />
          <Text style={[styles.backText, { marginLeft: 4 }]}>Navigation</Text>
        </Pressable>

        <View style={[styles.androidNavBg, { height: navSafeBottom }]} pointerEvents="none" />

        <Animated.View
          style={[styles.bottomCardWrapper, { height: cardHeight }]}
        >
          <View style={[styles.bottomCard, { paddingBottom: navSafeBottom }] }>
            <View style={styles.dragArea} {...panResponder.panHandlers}>
              {/* drag handle (panResponder attached to top area) */}
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
                <Ionicons name="location" size={15} color="#ffffff" />
              </View>
              <View style={styles.routeTextWrap}>
                <Text style={styles.routeTitle}>{destinationTitle}</Text>
                <Text style={styles.routeDetail}>{destinationSubtitle}</Text>
              </View>
            </View>
            </View>

            <ScrollView
              style={styles.extraContent}
              contentContainerStyle={[styles.cardContent, { paddingBottom: 10 + navSafeBottom }]}
              nestedScrollEnabled
              scrollEnabled
              showsVerticalScrollIndicator={false}
            >

          <Pressable style={styles.floorGuideButton}>
            <Text style={styles.floorGuideText}>{floorGuide}</Text>
          </Pressable>

          <Pressable style={styles.completeButton} onPress={() => setShowCompleteModal(true)}>
            <Text style={styles.completeButtonText}>Complete Navigation</Text>
          </Pressable>

          <Pressable style={styles.lostButton} onPress={goToScanQr}>
            <Text style={styles.lostButtonText}>Lost? Scan Nearest QR Code</Text>
          </Pressable>
            </ScrollView>
          </View>
        </Animated.View>
      </View>

      <Modal
        visible={showCompleteModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowCompleteModal(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Arrival Confirmation</Text>
            <Text style={styles.modalText}>
              To confirm your arrival, please scan the QR code at the destination or skip this
              step.
            </Text>

            <View style={styles.modalDestination}>
              <View style={styles.iconRed}>
                <Ionicons name="location-outline" size={14} color="#ffffff" />
              </View>
              <View style={styles.routeTextWrap}>
                <Text style={styles.routeTitle}>{destinationTitle}</Text>
                <Text style={styles.routeDetail}>{destinationSubtitle}</Text>
              </View>
            </View>

            <Pressable style={styles.modalPrimary} onPress={goToScanQr}>
              <Text style={styles.modalPrimaryText}>Scan QR Code</Text>
            </Pressable>

            <Pressable style={styles.modalSecondary} onPress={goToArrival}>
              <Text style={styles.modalSecondaryText}>Skip</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
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
  backButton: {
    position: "absolute",
    top: 105,
    left: 16,
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
    zIndex: 10,
  },
  bottomCard: {
    backgroundColor: "#ffffff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 16,
    paddingTop: 14,
    flex: 1,
  },
  cardContent: {
    paddingTop: 4,
  },
  extraContent: {
    flexGrow: 0,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: "#c4c4c4",
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 8,
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
    width: 23,
    height: 23,
    borderRadius: 14,
    backgroundColor: "#cf1f2d",
    alignItems: "center",
    justifyContent: "center",
  },
  floorGuideButton: {
    height: 46,
    borderRadius: 11,
    borderWidth: 1,
    borderColor: "#2f68be",
    backgroundColor: "#dfe7f5",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4,
  },
  floorGuideText: {
    fontSize: 16,
    fontWeight: "800",
    color: "#0e3d93",
  },
  completeButton: {
    marginTop: 10,
    height: 48,
    borderRadius: 12,
    backgroundColor: "#002A7A",
    alignItems: "center",
    justifyContent: "center",
  },
  completeButtonText: {
    fontSize: 18,
    fontWeight: "800",
    color: "#ffffff",
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
    fontSize: 35,
    fontWeight: "900",
    color: "#002A7A",
    textAlign: "center",
  },
  modalText: {
    fontSize: 18,
    color: "#31538f",
    textAlign: "center",
    marginTop: 10,
    marginBottom: 14,
  },
  modalDestination: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#cfe0f9",
    padding: 12,
    backgroundColor: "#eaf1fc",
    marginBottom: 14,
  },
  modalPrimary: {
    height: 46,
    borderRadius: 13,
    backgroundColor: "#0038a3",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  modalPrimaryText: {
    fontSize: 18,
    fontWeight: "800",
    color: "#ffffff",
  },
  modalSecondary: {
    height: 46,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: "#c9d8f1",
    backgroundColor: "#ffffff",
    alignItems: "center",
    justifyContent: "center",
  },
  modalSecondaryText: {
    color: "#113e94",
    fontSize: 18,
    fontWeight: "800",
  },
});
