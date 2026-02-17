import React, { useMemo, useState, useRef } from "react";
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  Dimensions,
  Platform,
  Animated,
  PanResponder,
  Keyboard,
  Image,
} from "react-native";
import { WebView } from "react-native-webview";
import Navbar from './components/Navbar';
import { Ionicons, MaterialIcons } from "@expo/vector-icons";

const { width, height } = Dimensions.get("window");
const MAP_HEIGHT = height;

export default function Index() {
  // center set to Camarines Sur Polytechnic / Nabua (OSM result center)
  const initialRegion = {
    latitude: 13.405817,
    longitude: 123.3763382,
    latitudeDelta: 0.005,
    longitudeDelta: 0.008,
  };

  const MAP_HTML = useMemo(() => `
  <!doctype html>
  <html>
  <head>
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
    <style>html,body,#map{height:100%;margin:0;padding:0} .leaflet-control-container{display:none}</style>
  </head>
  <body>
    <div id="map"></div>
    <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
    <script>
      const lat = ${initialRegion.latitude};
      const lng = ${initialRegion.longitude};

      // exact campus bounds from OSM bounding box (keeps user inside campus area)
      const southWest = [13.4049536, 123.3735422];
      const northEast = [13.4067034, 123.3785615];

      // smoother dragging and allow free panning (we'll still default to campus on reload)
      const map = L.map('map', {
        zoomControl: false,
        minZoom: 16,
        maxZoom: 19,
        inertia: true,
        inertiaDeceleration: 3000,
        inertiaMaxSpeed: 1500,
        easeLinearity: 0.25,
        worldCopyJump: false,
        tap: true,
        dragging: true,
        touchZoom: true
      });

      // start centered on campus (default) — do NOT auto-restore previous user pans on reload
      try {
        map.fitBounds([southWest, northEast]);
      } catch (e) {
        map.setView([lat, lng], 16);
      }

      // notify RN that map initialized
      if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
        window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'init' }));
      }

      // OSM standard tiles (light)
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; OpenStreetMap contributors'
      }).addTo(map);

      // expose postMessage handler so RN can command the map (recenter / landscape)
      function handleRNMessage(raw) {
        let msg = null;
        try { msg = JSON.parse(raw && raw.data ? raw.data : raw); } catch (e) { return; }
        if (!msg || !msg.type) return;
        if (msg.type === 'recenter') {
          // center on user (campus center) and zoom in for a close view
          try { map.setView([lat, lng], 18, { animate: true }); } catch (e) {}
        }
        if (msg.type === 'landscape') {
          const on = !!msg.on;
          if (on) {
            // pan slightly to the east and zoom out one step for a wider (landscape) view
            const offset = (northEast[1] - southWest[1]) * 0.18;
            try { map.setView([lat, lng + offset], Math.max(map.getZoom() - 1, 15)); } catch (e) {}
          } else {
            try { map.setView([lat, lng], 16); } catch (e) {}
          }
        }
      }
      document.addEventListener('message', handleRNMessage);
      window.addEventListener('message', handleRNMessage);

      // main user marker (campus center)
      const userPin = L.divIcon({
        className: '',
        html: '<div style="width:20px;height:20px;border-radius:10px;background:#2b6cff;border:3px solid #fff;box-shadow:0 4px 8px rgba(0,0,0,0.3)"></div>',
        iconSize: [20,20],
        iconAnchor: [10,10]
      });
      L.marker([lat, lng], { icon: userPin }).addTo(map).bindPopup('Camarines Sur Polytechnic Colleges');

      // sample campus markers (replace coordinates with exact campus coords if you have them)
      const spots = [
        { lat: lat + 0.0009, lng: lng - 0.0009, title: 'College of Computer Studies' },
        { lat: lat - 0.0008, lng: lng + 0.0010, title: 'School Canteen' }
      ];

      const spotIcon = L.divIcon({
        className: '',
        html: '<div style="width:28px;height:28px;border-radius:8px;background:#fff;color:#0b2;text-align:center;line-height:28px;font-weight:700;box-shadow:0 4px 8px rgba(0,0,0,0.25)">B</div>',
        iconSize: [28,28],
        iconAnchor: [14,14]
      });

      spots.forEach(s => {
        L.marker([s.lat, s.lng], { icon: spotIcon }).addTo(map).bindPopup(s.title);
      });

      // do not persist user pans across reloads — allow free dragging during the session
      // but do not send frequent 'view' messages back to RN (avoids rerenders)
      map.on('moveend', function() {
        // noop — keep the user's last position in-memory within the WebView only
      });

      // bounds are enforced by "maxBounds" + "maxBoundsViscosity" (smooth, non-snapping)
    </script>
  </body>
  </html>
  `, [initialRegion.latitude, initialRegion.longitude]);
  const webviewRef = useRef<any>(null);
  const EXPANDED_PERCENT = 0.50; 
  const SHEET_MAX_HEIGHT = Math.round(height * EXPANDED_PERCENT);
  const COLLAPSED_VISIBLE = 130; 
  const SHEET_EXPANDED = 0; 
  const SHEET_COLLAPSED = Math.max(0, SHEET_MAX_HEIGHT - COLLAPSED_VISIBLE); 
  const sheetAnim = useRef(new Animated.Value(SHEET_COLLAPSED)).current; 
  const sheetOffset = useRef(SHEET_COLLAPSED);
  const webViewSource = useMemo(() => ({ html: MAP_HTML }), [MAP_HTML]);

  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [searchText, setSearchText] = useState("");

  const savedPlaces = [
    { id: 'ccs', title: 'College of Computer Studies', subtitle: 'Academic Building IV' },
    { id: 'canteen', title: 'School Canteen', subtitle: 'Building __' },
  ];

  const filteredPlaces = savedPlaces.filter((p) => p.title.toLowerCase().includes(searchText.toLowerCase()));

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: (_evt, gestureState) => Math.abs(gestureState.dy) > 5,
      onMoveShouldSetPanResponder: (_evt, gestureState) => Math.abs(gestureState.dy) > 5,
      onPanResponderMove: (_evt, gestureState) => {
        const newVal = Math.max(SHEET_EXPANDED, Math.min(SHEET_COLLAPSED, sheetOffset.current + gestureState.dy));
        sheetAnim.setValue(newVal);
      },
      onPanResponderRelease: (_evt, gestureState) => {
        const shouldExpand = gestureState.dy < -50 || gestureState.vy < -0.5;
        const toValue = shouldExpand ? SHEET_EXPANDED : SHEET_COLLAPSED;
        Animated.timing(sheetAnim, { toValue, duration: 300, useNativeDriver: true }).start(() => {
          sheetOffset.current = toValue;
        });
      },
    })
  ).current;

  const handleWebViewMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      // ignore 'view' messages to avoid triggering RN re-renders on every map movement
      // (we rely on WebView localStorage for persistence instead)
      // if (data?.type === 'init') console.log('Map initialized in WebView');
    } catch (e) {
      // ignore
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <WebView
        ref={webviewRef}
        originWhitelist={["*"]}
        source={webViewSource}
        onMessage={handleWebViewMessage}
        style={styles.map}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        scalesPageToFit={true}
        startInLoadingState={true}
      />

      <Navbar />

      <Animated.View
        {...panResponder.panHandlers}
        style={[
          styles.sheet,
          { height: SHEET_MAX_HEIGHT, transform: [{ translateY: sheetAnim }] },
        ]}
      >
        <Pressable
          style={styles.handle}
          onPress={() => {
            const toValue = sheetOffset.current === SHEET_COLLAPSED ? SHEET_EXPANDED : SHEET_COLLAPSED;
            Animated.timing(sheetAnim, { toValue, duration: 300, useNativeDriver: true }).start(() => {
              sheetOffset.current = toValue;
            });
          }}
        />

        <View style={styles.searchRow}>
          <View style={styles.searchBox}>
            <TextInput
              placeholder="Search location"
              placeholderTextColor="#9aa0a6"
              style={styles.searchInput}
              value={searchText}
              onChangeText={setSearchText}
              onFocus={() => {
                setIsSearchFocused(true);
                Animated.timing(sheetAnim, { toValue: SHEET_EXPANDED, duration: 300, useNativeDriver: true }).start(() => {
                  sheetOffset.current = SHEET_EXPANDED;
                });
              }}
              onBlur={() => setIsSearchFocused(false)}
              returnKeyType="search"
              onSubmitEditing={() => {
                // placeholder: you can wire real search here
                // keep the sheet expanded so results are visible
              }}
            />
          </View>

          <Pressable
            style={styles.geoButton}
            onPress={() => {
              if (isSearchFocused) {
                // perform search (placeholder)
                // For now just collapse keyboard
                Keyboard.dismiss();
              } else {
                try { webviewRef.current?.postMessage(JSON.stringify({ type: 'recenter' })); } catch (e) {}
              }
            }}
          >
            <Ionicons name={isSearchFocused ? 'search' : 'locate'} size={35} color="#002A7A" />
          </Pressable>
        </View>

        <Text style={styles.sectionTitle}>Saved Places</Text>

        {filteredPlaces.map((p) => (
          <View key={p.id} style={styles.placeCard}>
            <View style={styles.placeIconBg}>
              <Ionicons name="business" size={23} color="#002A7A" />
            </View>
            <View style={styles.placeInfo}>
              <Text style={styles.placeTitle}>{p.title}</Text>
              <Text style={styles.placeSubtitle}>{p.subtitle}</Text>
            </View>
            <View style={styles.deleteIconBg}>
              <MaterialIcons name="delete" size={23} color="#ffffff" />
            </View>
          </View>
        ))}

        <Pressable style={styles.addPlace}>
          <View style={styles.addIconBox}>
            <MaterialIcons name="add" size={23} color="#ffffff" />
          </View>
          <Text style={styles.addPlaceText}>Add New Place</Text>
        </Pressable>
      </Animated.View>
    </SafeAreaView>
  );
}

const darkMapStyle = [
  { elementType: "geometry", stylers: [{ color: "#212121" }] },
  { elementType: "labels.icon", stylers: [{ visibility: "off" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#757575" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#212121" }] },
  {
    featureType: "administrative",
    elementType: "geometry",
    stylers: [{ color: "#757575" }],
  },
  {
    featureType: "poi",
    elementType: "labels.text.fill",
    stylers: [{ color: "#616161" }],
  },
  {
    featureType: "poi.park",
    elementType: "geometry",
    stylers: [{ color: "#181818" }],
  },
  {
    featureType: "road",
    elementType: "geometry.fill",
    stylers: [{ color: "#2c2c2c" }],
  },
  {
    featureType: "road",
    elementType: "labels.text.fill",
    stylers: [{ color: "#8a8a8a" }],
  },
  {
    featureType: "transit",
    elementType: "geometry",
    stylers: [{ color: "#181818" }],
  },
  {
    featureType: "water",
    elementType: "geometry",
    stylers: [{ color: "#000000" }],
  },
];

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  map: {
    ...StyleSheet.absoluteFillObject,
    height: MAP_HEIGHT,
    zIndex: 0,
    backgroundColor: "#0b0b0b",
  },
  
  navbarLogo: { width: 160, height: 48, alignSelf: 'center' },
  profileButton: {
    width: 52,
    height: 52,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 6,
  },
  header: {
    position: "absolute",
    top: Platform.OS === "android" ? 36 : 14,
    left: 16,
    right: 16,
    zIndex: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarCircle: {
    position: "absolute",
    left: 0,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#2b2b2b",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { color: "#fff", fontWeight: "600" },
  greeting: { color: "#fff", fontSize: 18, fontWeight: "600" },
  menuButton: { position: "absolute", right: 0 },
  sheet: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "#002A7A",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 24,
    maxHeight: Math.round(height *0.85),
    zIndex: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  handle: {
    width: 70,
    height: 4,
    backgroundColor: "#FFFFFF",
    alignSelf: "center",
    borderRadius: 4,
    marginBottom: 12,
  },
  searchRow: { flexDirection: "row", alignItems: "center", marginBottom: 14 },
  searchBox: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#00153D",
    paddingHorizontal: 5,
    paddingVertical: 5,
    borderRadius: 15,
    marginRight: 8,
    borderWidth: 1,
  },
  searchInput: { color: "#fff", marginLeft: 8, flex: 1, fontSize: 14 },
  geoButton: {
    width: 50,
    height: 50,
    borderRadius: 15,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#002A7A",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: { color: "#fff", fontWeight: "700", marginBottom: 8 },
  placeCard: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 16,
    marginVertical: 4,
    backgroundColor: "#002A7A",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 4)",
  },
  placeIconBg: {
    width: 43,
    height: 43,
    borderRadius: 10,
    backgroundColor: "#ffffff",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  placeInfo: { flex: 1 },
  placeTitle: { color: "#fff", fontWeight: "700" },
  placeSubtitle: { color: "#9aa0a6", fontSize: 12, marginTop: 2 },
  placeDistance: { color: "#9aa0a6", fontSize: 12, marginLeft: 8 },
  deleteIconBg: {},
  addPlace: {
    marginTop: 4,
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: "#ffffff",
    borderRadius: 12,
  },
  addIconBox: {
    width: 43,
    height: 43,
    borderRadius: 10,
    backgroundColor: "#002A7A",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  addPlaceText: { color: "#002A7A", fontWeight: "600" },
});
