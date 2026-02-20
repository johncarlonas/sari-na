import React, { useMemo, useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  Switch,
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
import PLACES from '../data/places';
import * as Location from 'expo-location';

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

  // default "current location" for development/testing — set to CCS so map centers to campus by default
  const [currentLocation, setCurrentLocation] = useState({ latitude: 13.405669, longitude: 123.377169 });
  // DEMO mode state: when true the displayed location is locked to College of Computer Studies (toggle in UI)
  const [demoMode, setDemoMode] = useState(true);
  const DEMO_COORDS = { latitude: 13.405669, longitude: 123.377169 };
  // movement detection state (true while user is moving)
  const [isMoving, setIsMoving] = useState(false);
  const lastPosRef = useRef<{ latitude: number; longitude: number; timestamp: number } | null>(null);
  // campus polygon fetched from OSM (if available)
  const [campusPolygon, setCampusPolygon] = useState<any[] | null>(null);
  // resolved URI for the local navigation icon (used inside the WebView)
  const navIconUri = Image.resolveAssetSource(require('../../assets/images/navigation.png')).uri;

  // all known place coordinates (extended in app/data/places.ts)
  const allPlaces = PLACES;

  // helper: distance in meters (Haversine)
  function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
    const toRad = (v: number) => (v * Math.PI) / 180;
    const R = 6371000; // meters
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  // send device heading + location updates to the WebView so the marker can rotate/move in real time
  useEffect(() => {
    let headingSub: any = null;
    let posSub: any = null;

    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          console.warn('Location permission not granted');
          return;
        }

        // watch heading (compass) — posts heading to WebView
        headingSub = await Location.watchHeadingAsync((hd: any) => {
          const angle = hd.trueHeading ?? hd.magHeading ?? 0;
          try { webviewRef.current?.postMessage(JSON.stringify({ type: 'heading', heading: angle })); } catch (e) {}
        });

        if (!demoMode) {
          // watch position — higher-frequency, real-time updates + movement detection
          posSub = await Location.watchPositionAsync(
            { accuracy: Location.Accuracy.BestForNavigation, timeInterval: 1000, distanceInterval: 1 },
            (pos) => {
              const lat = Number(pos.coords.latitude);
              const lng = Number(pos.coords.longitude);
              // drop bad readings
              if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;

              // determine if user is moving (use provided speed if available, otherwise compute)
              let moving = false;
              const speed = Number(pos.coords.speed);
              const now = pos.timestamp || Date.now();
              if (Number.isFinite(speed)) {
                moving = speed > 0.5; 
              } else if (lastPosRef.current) {
                const d = haversineDistance(lastPosRef.current.latitude, lastPosRef.current.longitude, lat, lng);
                const dt = Math.max(0.5, (now - lastPosRef.current.timestamp) / 1000); 
                const computed = d / dt; 
                moving = computed > 0.5;
              }
              lastPosRef.current = { latitude: lat, longitude: lng, timestamp: now };

              setIsMoving(moving);
              setCurrentLocation({ latitude: lat, longitude: lng });
              try { webviewRef.current?.postMessage(JSON.stringify({ type: 'location', lat, lng, moving })); } catch (e) {}
            },
          );
        } else {
          // demo mode: keep shown location at CCS, report not moving
          const lat = DEMO_COORDS.latitude;
          const lng = DEMO_COORDS.longitude;
          lastPosRef.current = { latitude: lat, longitude: lng, timestamp: Date.now() };
          setIsMoving(false);
          setCurrentLocation({ latitude: lat, longitude: lng });
          try { webviewRef.current?.postMessage(JSON.stringify({ type: 'location', lat, lng, moving: false })); } catch (e) {}
        }
      } catch (e) {
        console.warn('Failed to start location/heading listeners', e);
      }
    })();

    return () => {
      try { headingSub?.remove?.(); } catch (e) {}
      try { posSub?.remove?.(); } catch (e) {}
      lastPosRef.current = null;
    };
  }, [demoMode]);

  // fetch campus boundary from OSM (try Overpass, fall back to Nominatim, then manual boundary)
  useEffect(() => {
    let mounted = true;
    const fetchCampus = async () => {
      const name = 'Camarines Sur Polytechnic College';
      try {
        // try Overpass first
        console.log('🔍 Querying Overpass API for campus boundary...');
        const overpassQuery = `[out:json][timeout:25];(way["name"~"${name}",i];relation["name"~"${name}",i];);out geom;`;
        const ov = await fetch('https://overpass-api.de/api/interpreter', { method: 'POST', body: overpassQuery, headers: { 'Content-Type': 'text/plain' } });
        const ovJson = await ov.json().catch(() => null);
        console.log('Overpass response:', ovJson);
        let coords: any = null;
        if (ovJson && Array.isArray(ovJson.elements) && ovJson.elements.length) {
          // try to find first element with geometry
          const el = ovJson.elements.find((e: any) => Array.isArray(e.geometry) && e.geometry.length > 0);
          if (el && el.geometry) {
            coords = el.geometry.map((p: any) => [p.lat, p.lon]);
            console.log('✅ Found boundary via Overpass');
          }
        }

        // fallback to Nominatim search for polygon
        if (!coords) {
          console.log('🔍 Trying Nominatim API...');
          const nm = await fetch(`https://nominatim.openstreetmap.org/search?format=jsonv2&polygon_geojson=1&q=${encodeURIComponent(name)}`);
          const nmJson = await nm.json().catch(() => null);
          console.log('Nominatim response:', nmJson);
          if (nmJson && Array.isArray(nmJson) && nmJson[0] && nmJson[0].geojson) {
            const g = nmJson[0].geojson;
            if (g.type === 'Polygon') coords = g.coordinates[0].map((c: any) => [c[1], c[0]]);
            else if (g.type === 'MultiPolygon') coords = g.coordinates[0][0].map((c: any) => [c[1], c[0]]);
            if (coords) console.log('✅ Found boundary via Nominatim');
          }
        }

        // manual fallback: traced campus boundary from official map
        if (!coords) {
          console.log('📍 Using manually traced campus boundary');
          coords = [
            [13.406734, 123.373722], // northwest corner
            [13.406734, 123.378389], // northeast corner top
            [13.406501, 123.378472], // northeast corner curve
            [13.405918, 123.378472], // east side middle
            [13.405573, 123.378806], // southeast corner point
            [13.405156, 123.378472], // southeast corner base
            [13.404978, 123.378111], // south side right
            [13.404978, 123.374667], // south side middle
            [13.405156, 123.374083], // southwest corner inner
            [13.405323, 123.373806], // west side entrance
            [13.405573, 123.373722], // west side mid
            [13.406167, 123.373389], // northwest corner point
            [13.406734, 123.373722], // close polygon
          ];
        }

        if (mounted && coords) {
          setCampusPolygon(coords);
          try { webviewRef.current?.postMessage(JSON.stringify({ type: 'campusPolygon', coords })); } catch (e) {}
        } else {
          console.warn('⚠️ No campus boundary found in OSM data');
        }
      } catch (e) {
        console.warn('Failed to fetch campus polygon from OSM', e);
      }
    };
    fetchCampus();
    return () => { mounted = false; };
  }, []);

  const MAP_HTML = useMemo(() => `
  <!doctype html>
  <html>
  <head>
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
    <style>
      html,body,#map{height:100%;margin:0;padding:0;background-color:#0b0b0b}
      .leaflet-control-container{display:none}

      /* user location marker (pulsing + directional) */
      .user-marker { position: relative; width:36px; height:36px; transform-origin:center; }
      .user-marker { position: relative; width:46px; height:46px; transform-origin:center; }
      /* marker: white circular background, small navigator icon, and teal pulsing ring */
      .user-marker .ring { position:absolute; left:50%; top:50%; width:44px; height:44px; margin-left:-22px; margin-top:-22px; border-radius:50%; z-index:0; pointer-events:none; transform-origin:center center; }
            .user-marker .ring::after { content:''; position:absolute; left:50%; top:50%; width:100%; height:100%; border-radius:50%; background: rgba(0,42,122,0.06); border: 3px solid rgba(0,42,122,0.30); box-shadow: 0 6px 18px rgba(0,42,122,0.08); transform-origin:center center; animation: ringPulse 1400ms ease-out infinite; }
      @keyframes ringPulse { 0% { transform: translate(-50%,-50%) scale(0.85); opacity: 0.9 } 60% { transform: translate(-50%,-50%) scale(1.25); opacity: 0.25 } 100% { transform: translate(-50%,-50%) scale(1.45); opacity: 0 } }
      .user-marker .bg { position:absolute; left:50%; top:50%; width:28px; height:28px; margin-left:-14px; margin-top:-14px; border-radius:50%; background:#fff; display:flex; align-items:center; justify-content:center; z-index:2; box-shadow:0 2px 6px rgba(0,0,0,0.18); border:1px solid rgba(0,42,122,0.08); transform-origin:center center; }
      .user-marker .bg img.icon { width:14px; height:14px; display:block; transform-origin:center center; will-change:transform; }
      .user-marker.moving .ring::after { animation-duration: 900ms !important; border-color: rgba(0,42,122,0.48) !important; background: rgba(0,42,122,0.08) !important; }
      /* keep legacy selectors as fallback */
      .user-marker .triangle { display:none }
      .user-marker .pulse { display:none }
    </style>
  </head>
  <body>
    <div id="map"></div>
    <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
    <script>
      let lat = ${currentLocation.latitude};
      let lng = ${currentLocation.longitude};
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

      // start centered on user's (default) location — zoom to campus center (match 'recenter')
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

      // campus boundary will be loaded from OSM data — no hardcoded rectangle

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

      // expose postMessage handler so RN can command the map (recenter / landscape / heading)
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
        if (msg.type === 'location' && typeof msg.lat === 'number' && typeof msg.lng === 'number') {
          lat = msg.lat;
          lng = msg.lng;
          try { userMarker.setLatLng([msg.lat, msg.lng]); } catch (e) {}
          // visual movement indicator: add/remove 'moving' class so ring animates faster when in motion
          try {
            const markerEl = document.querySelector('.user-marker');
            if (markerEl) {
              if (msg.moving) markerEl.classList.add('moving'); else markerEl.classList.remove('moving');
            }
          } catch (e) {}
        }

        if (msg.type === 'campusPolygon' && Array.isArray(msg.coords) && msg.coords.length) {
          try {
            if (window._campusLayer) map.removeLayer(window._campusLayer);
            window._campusLayer = L.polygon(msg.coords, { color: '#002A7A', weight: 4, opacity: 0.95, fillColor: '#002A7A', fillOpacity: 0.06 }).addTo(map);
            // keep map centered but do not force-fit on every update; only pan if marker outside bounds
          } catch (e) {}
        }

        if (msg.type === 'heading' && typeof msg.heading === 'number') {
          // rotate the whole visible marker (icon + bg + ring) so they stay perfectly synced
          const iconEl = document.querySelector('.user-marker .icon');
          const bgEl = document.querySelector('.user-marker .bg');
          const ringEl = document.querySelector('.user-marker .ring');
          const others = [iconEl, bgEl, ringEl];
          others.forEach(el => { if (el) el.style.transform = 'rotate(' + msg.heading + 'deg)'; });
        }
      }
      document.addEventListener('message', handleRNMessage);
      window.addEventListener('message', handleRNMessage);

      // main user marker (current location) — pulsing + directional indicator
      const userPin = L.divIcon({
        className: 'user-marker',
        html: '<div class="ring"></div><div class="bg"><img class="icon" src="${navIconUri}" style="display:block"/></div>',
        iconSize: [44,44],
        iconAnchor: [22,22]
      });
      const userMarker = L.marker([lat, lng], { icon: userPin }).addTo(map).bindPopup('Current location');

      // sample campus markers (replace coordinates with exact campus coords if you have them)
      const spots = [
        { lat: 13.406402, lng: 123.375668, title: 'CSPC Auditorium' },
        { lat: 13.405569, lng: 123.374683, title: 'Academic Building 1' },
        { lat: 13.405508, lng: 123.375034, title: 'Graduate School Building' },
        { lat: 13.405485, lng: 123.375518, title: 'Laboratory Shop Building' },
        { lat: 13.405643, lng: 123.374459, title: 'CSPC Chapel' },
        { lat: 13.405917, lng: 123.375264, title: 'Gymnasium' },
        { lat: 13.405669, lng: 123.377169, title: 'CCS Building' },
        { lat: 13.4059, lng: 123.377112, title: 'CAS Building' },
        { lat: 13.406001, lng: 123.376567, title: 'CEA' },
        { lat: 13.406365, lng: 123.376218, title: 'CTHBM' },
        { lat: 13.406159, lng: 123.377347, title: 'SASO Building' },
        { lat: 13.405313, lng: 123.377516, title: 'CHS Building' },
        { lat: 13.40551, lng: 123.374874, title: 'Technohub Building' },
        { lat: 13.405479, lng: 123.375275, title: 'Restroom Male' }
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
  `, [initialRegion.latitude, initialRegion.longitude, navIconUri]);
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

  const searchResults = searchText.trim().length ? allPlaces.filter(p => p.title.toLowerCase().includes(searchText.toLowerCase())) : [];

  const [savedPlaces, setSavedPlaces] = useState([    { id: 'auditorium', title: 'CSPC Auditorium', subtitle: 'Auditorium', coords: [13.406402, 123.375668] },
    // { id: 'ab1', title: 'Academic Building 1', subtitle: 'Academic Building 1', coords: [13.405569, 123.374683] },
    // { id: 'grad_school', title: 'Graduate School Building', subtitle: 'Graduate School', coords: [13.405508, 123.375034] },
    // { id: 'lab_shop', title: 'Laboratory Shop Building', subtitle: 'Laboratory Shop', coords: [13.405485, 123.375518] },
    // { id: 'chapel', title: 'CSPC Chapel', subtitle: 'Chapel', coords: [13.405643, 123.374459] },
    { id: 'gym', title: 'Gymnasium', subtitle: 'Gymnasium', coords: [13.405917, 123.375264] },
    // { id: 'ccs', title: 'College of Computer Studies', subtitle: 'Academic Building IV', coords: [13.405669, 123.377169] },
    // { id: 'cas', title: 'CAS', subtitle: 'College of Arts & Sciences', coords: [13.4059, 123.377112] },
    // { id: 'cea', title: 'CEA', subtitle: 'College of Education & Arts', coords: [13.406001, 123.376567] },
    // { id: 'cthbm', title: 'CTHBM', subtitle: 'CTHBM', coords: [13.406365, 123.376218] },
    // { id: 'chs', title: 'CHS', subtitle: 'College of Health Sciences', coords: [13.406159, 123.377347] },
    // { id: 'ab6', title: 'Academic Building VI', subtitle: 'Academic Building VI', coords: [13.405313, 123.377516] },
    // { id: 'technohub', title: 'Technohub Building', subtitle: 'Technohub', coords: [13.40551, 123.374874] },
    // { id: 'restroom_m', title: 'Restroom Male', subtitle: 'Restroom', coords: [13.405479, 123.375275] },
  ]);

  const handleDeletePlace = (id: string) => {
    setSavedPlaces((prev) => prev.filter((p) => p.id !== id));
  }; 

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
      // when WebView map initializes, send campus polygon (if fetched)
      if (data?.type === 'init') {
        try {
          if (campusPolygon) webviewRef.current?.postMessage(JSON.stringify({ type: 'campusPolygon', coords: campusPolygon }));
        } catch (e) {}
        return;
      }
      // ignore other 'view' messages to avoid triggering RN re-renders on every map movement
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

        <View style={styles.demoRow}>
          <Text style={styles.demoLabel}>Demo location (CCS)</Text>
          <Switch
            value={demoMode}
            onValueChange={(v) => setDemoMode(v)}
            trackColor={{ true: '#002A7A', false: '#9aa0a6' }}
            thumbColor={'#ffffff'}
          />
        </View>

        {/* Search results (limited to known campus coordinates) */}
        {searchText.trim().length > 0 && (
          <View style={{ marginBottom: 8 }}>
            {searchResults.length ? (
              searchResults.map((r) => (
                <View key={r.id} style={[styles.placeRow, styles.placeCard, { marginVertical: 4 }]}>
                  <Pressable
                    style={{ flex: 1, flexDirection: 'row', alignItems: 'center', paddingVertical: 0, paddingHorizontal: 0 }}
                    onPress={() => {
                      try { webviewRef.current?.postMessage(JSON.stringify({ type: 'goto', lat: r.coords[0], lng: r.coords[1] })); } catch (e) {}
                    }}
                  >
                    <View style={styles.placeIconBg}>
                      <Ionicons name="business" size={23} color="#002A7A" />
                    </View>
                    <View style={styles.placeInfo}>
                      <Text style={styles.placeTitle}>{r.title}</Text>
                      <Text style={styles.placeSubtitle}>{r.subtitle}</Text>
                    </View>
                  </Pressable>

                  <Pressable
                    style={styles.addResultButton}
                    onPress={() => setSavedPlaces((prev) => [r, ...prev.filter((x) => x.id !== r.id)])}
                  >
                    <MaterialIcons name="add" size={20} color="#fff" />
                  </Pressable>
                </View>
              ))
            ) : (
              <Text style={{ color: '#9aa0a6', marginBottom: 8 }}>No results</Text>
            )}
          </View>
        )}

        <Text style={styles.sectionTitle}>Saved Places</Text>

        {filteredPlaces.map((p) => (
          <View key={p.id} style={[styles.placeRow, styles.placeCard, { marginVertical: 4 }]}>
            <Pressable
              style={{ flex: 1, flexDirection: 'row', alignItems: 'center', paddingVertical: 0, paddingHorizontal: 0 }}
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
            </Pressable>

            {/* delete button visually inside the card but implemented as a sibling Pressable to avoid triggering card onPress */}
            <Pressable
              style={styles.deleteInside}
              onPress={() => handleDeletePlace(p.id)}
              accessibilityLabel={`Delete ${p.title}`}
            >
              <MaterialIcons name="delete" size={23} color="#ffffff" />
            </Pressable>
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
  demoRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, paddingHorizontal: 6 },
  demoLabel: { color: '#fff', fontWeight: '600' },
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
    backgroundColor: "#002A7A",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 4)",
  },
  placeRow: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 4,
  },
  deleteOutside: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: "#002A7A",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 12,
  },
  deleteInside: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: "transparent",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 12,
  },
  addResultButton: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#002A7A',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
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
