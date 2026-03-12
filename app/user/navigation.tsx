import React, { useMemo, useState, useEffect, useRef } from "react";
import { Dimensions, Modal, Pressable, StyleSheet, Text, View, ScrollView, Animated, Easing } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import places from "../data/places";
import { LinearGradient } from "expo-linear-gradient";
// eslint-disable-next-line import/no-unresolved
import Index from "../components/map";

// simple tuple for longitude/latitude pairs used in this screen
type LngLat = [number, number];

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
  const CARD_COLLAPSED_HEIGHT = 260 + navSafeBottom; 
 


  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [showGuideModal, setShowGuideModal] = useState(false);
  const [hasLiveLocation, setHasLiveLocation] = useState(false);
  const [showLostToast, setShowLostToast] = useState(false);
  const toastOpacity = useRef(new Animated.Value(0)).current;
  const toastX = useRef(new Animated.Value(0)).current;
  const buttonScale = useRef(new Animated.Value(1)).current;
  const [liveOriginCoords, setLiveOriginCoords] = useState<LngLat>(DEFAULT_CAMPUS_CENTER);
  const allPlaces = places as Place[];


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

  const guideSteps = useMemo(() => {
    const match = destinationSubtitle.match(/Floor\s*([0-9]+)/i);
    const destFloor = match?.[1] || "destination";
    return [
      "Proceed to ground floor of the building you are currently in",
      "Follow the track on map and proceed to the destination building",
      `Proceed to ${destFloor} floor`,
    ];
  }, [destinationSubtitle]);






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

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <View style={styles.mapWrap}>
        <Index
          simple={false}
          destination={{ latitude: destinationCoords[1], longitude: destinationCoords[0] }}
        />

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
            <Pressable onPress={goToScanQr}>
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
});
