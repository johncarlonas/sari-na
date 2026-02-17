import React, { useMemo, useState, useRef } from "react";
import {
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
import { SafeAreaView } from "react-native-safe-area-context";
import { WebView } from "react-native-webview";
import Navbar from '../components/Navbar';
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
    <style>html,body,#map{height:100%;margin:0;padding:0;background-color:#0b0b0b} .leaflet-control-container{display:none}</style>
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

      // start centered on campus (default) — zoom to campus center (match 'recenter')
      try {
        map.setView([lat, lng], 18);
      } catch (e) {
        map.setView([lat, lng], 18);
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

      // helper: set map view so the target latlng appears offset from center (pixels)
      function setViewWithOffset(latv, lngv, zoomLevel) {
        try {
          const markerOffset = L.point(0, -120); // x: 0 (center horizontally), y: move marker up by 120px
          const targetPoint = map.latLngToContainerPoint([latv, lngv]);
          const centerPoint = L.point(targetPoint.x - markerOffset.x, targetPoint.y - markerOffset.y);
          const centerLatLng = map.containerPointToLatLng(centerPoint);
          map.setView(centerLatLng, zoomLevel || map.getZoom(), { animate: true });
        } catch (e) {}
      }

      // expose postMessage handler so RN can command the map (recenter / landscape)
      function handleRNMessage(raw) {
        let msg = null;
        try { msg = JSON.parse(raw && raw.data ? raw.data : raw); } catch (e) { return; }
        if (!msg || !msg.type) return;
        if (msg.type === 'recenter') {
          // center on user (campus center) with offset so marker sits above the sheet
          try { setViewWithOffset(lat, lng, 18); } catch (e) {}
        }
        if (msg.type === 'goto' && typeof msg.lat === 'number' && typeof msg.lng === 'number') {
          try { setViewWithOffset(msg.lat, msg.lng, 18); } catch (e) {}
        }
        if (msg.type === 'landscape') {
          const on = !!msg.on;
          if (on) {
            // pan slightly to the east and zoom out one step for a wider (landscape) view
            const offset = (northEast[1] - southWest[1]) * 0.18;
            try { map.setView([lat, lng + offset], Math.max(map.getZoom() - 1, 15)); } catch (e) {}
          } else {
            try { setViewWithOffset(lat, lng, 16); } catch (e) {}
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
        { lat: 13.406402, lng: 123.375668, title: 'CSPC Auditorium' },
        // { lat: 13.405569, lng: 123.374683, title: 'Academic Building 1' },
        // { lat: 13.405508, lng: 123.375034, title: 'Graduate School Building' },
        // { lat: 13.405485, lng: 123.375518, title: 'Laboratory Shop Building' },
        // { lat: 13.405643, lng: 123.374459, title: 'CSPC Chapel' },
        // { lat: 13.405917, lng: 123.375264, title: 'Gymnasium' },
        // { lat: 13.405671, lng: 123.373563, title: 'Nabua Fire Station' },
        { lat: 13.405669, lng: 123.377169, title: 'CCS (College of Computer Studies)' },
        // { lat: 13.4059, lng: 123.377112, title: 'CAS' },
        // { lat: 13.406001, lng: 123.376567, title: 'CEA' },
        // { lat: 13.406365, lng: 123.376218, title: 'CTHBM' },
        // { lat: 13.406159, lng: 123.377347, title: 'CHS' },
        // { lat: 13.405313, lng: 123.377516, title: 'Academic Building VI' },
        // { lat: 13.40551, lng: 123.374874, title: 'Technohub Building' },
        // { lat: 13.405479, lng: 123.375275, title: 'Restroom Male' }
      ];

      const spotIcon = L.divIcon({
        className: '',
        html: '<svg width="28" height="36" viewBox="0 0 24 36" xmlns="http://www.w3.org/2000/svg"><path d="M12 0C7.03 0 3 4.03 3 9c0 7.5 9 20 9 20s9-12.5 9-20c0-4.97-4.03-9-9-9zm0 13a4 4 0 110-8 4 4 0 010 8z" fill="#002A7A" stroke="#ffffff" stroke-width="0.5"/></svg>',
        iconSize: [18,26],
        iconAnchor: [14,36]
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
  const sheetAnim = useRef(new Animated.Value(SHEET_EXPANDED)).current; 
  const sheetOffset = useRef(SHEET_EXPANDED);
  const webViewSource = useMemo(() => ({ html: MAP_HTML }), [MAP_HTML]);

  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [searchText, setSearchText] = useState("");

  const savedPlaces = [
    { id: 'auditorium', title: 'CSPC Auditorium', subtitle: 'Auditorium', coords: [13.406402, 123.375668] },
    // { id: 'ab1', title: 'Academic Building 1', subtitle: 'Academic Building 1', coords: [13.405569, 123.374683] },
    // { id: 'grad_school', title: 'Graduate School Building', subtitle: 'Graduate School', coords: [13.405508, 123.375034] },
    // { id: 'lab_shop', title: 'Laboratory Shop Building', subtitle: 'Laboratory Shop', coords: [13.405485, 123.375518] },
    // { id: 'chapel', title: 'CSPC Chapel', subtitle: 'Chapel', coords: [13.405643, 123.374459] },
    // { id: 'gym', title: 'Gymnasium', subtitle: 'Gymnasium', coords: [13.405917, 123.375264] },
    // { id: 'fire_station', title: 'Nabua Fire Station', subtitle: 'Nearby Landmark', coords: [13.405671, 123.373563] },
    { id: 'ccs', title: 'College of Computer Studies', subtitle: 'Academic Building IV', coords: [13.405669, 123.377169] },
    // { id: 'cas', title: 'CAS', subtitle: 'College of Arts & Sciences', coords: [13.4059, 123.377112] },
    // { id: 'cea', title: 'CEA', subtitle: 'College of Education & Arts', coords: [13.406001, 123.376567] },
    // { id: 'cthbm', title: 'CTHBM', subtitle: 'CTHBM', coords: [13.406365, 123.376218] },
    // { id: 'chs', title: 'CHS', subtitle: 'College of Health Sciences', coords: [13.406159, 123.377347] },
    // { id: 'ab6', title: 'Academic Building VI', subtitle: 'Academic Building VI', coords: [13.405313, 123.377516] },
    // { id: 'technohub', title: 'Technohub Building', subtitle: 'Technohub', coords: [13.40551, 123.374874] },
    // { id: 'restroom_m', title: 'Restroom Male', subtitle: 'Restroom', coords: [13.405479, 123.375275] },
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
        renderLoading={() => <View style={{ flex: 1, backgroundColor: '#000' }} />}
      />

      <Navbar screen="home" />

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
            <Ionicons name={isSearchFocused ? 'search' : 'locate'} size={30} color="#002A7A" />
          </Pressable>
        </View>

        <Text style={styles.sectionTitle}>Saved Places</Text>

        {filteredPlaces.map((p) => (
          <Pressable
            key={p.id}
            style={styles.placeCard}
            onPress={() => {
              try { webviewRef.current?.postMessage(JSON.stringify({ type: 'goto', lat: p.coords[0], lng: p.coords[1] })); } catch (e) {}
            }}
          >
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
          </Pressable>
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
