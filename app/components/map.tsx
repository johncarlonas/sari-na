import React, { useEffect, useMemo, useRef, useState } from "react";
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

type LatLngTuple = [number, number];
import { SafeAreaView } from "react-native-safe-area-context";
import { WebView } from "react-native-webview";
import Navbar from '../components/Navbar';
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import PLACES from '../data/places';
import * as Location from 'expo-location';

const { width, height } = Dimensions.get("window");
const MAP_HEIGHT = height;

// constants for campus boundary fallback and name variants
const DEFAULT_COORDS = { latitude: 13.405669, longitude: 123.377169 };
const NAME_VARIANTS = [
  "Polytechnic State University of Bicol",
  "Camarines Sur Polytechnic College",
  "Camarines Sur Polytechnic Colleges",
  "CSPC"
];

// simple hand trace used only if OSM queries fail completely
const CAMPUS_BORDER_FALLBACK: LatLngTuple[] = [
  [13.405607592786978,123.37354287909699],
  [13.405641933812802,123.3739264258702],
  [13.405679820877594,123.37407673788624],
  [13.405726101969634,123.37419154432826],
  [13.405751254733929,123.37421636734342],
  [13.406011266464759,123.37392507608848],
  [13.406669176671983,123.37548461448034],
  [13.406703916549517,123.37662270871078],
  [13.406458145656075,123.37668334613926],
  [13.406403699410731,123.37845271118243],
  [13.405622260298685,123.37856073274736],
  [13.40573503020876,123.37759190063679],
  [13.405341486006861,123.37793850357832],
  [13.405166577265277,123.3777811718681],
  [13.405237619954903,123.37771225048431],
  [13.40495569449672,123.37735500103673],
  [13.405609858743219,123.3767297526071],
  [13.405525690305254,123.37652086665469],
  [13.405510420095524,123.37652145563288],
  [13.405509288969213,123.37647552467172],
  [13.405457257132696,123.37634180162195],
  [13.405427611227282,123.37634091775095],
  [13.40542509864079,123.3762375992651],
  [13.405442686746426,123.3762375992651],
  [13.405401229067465,123.3759121460368],
  [13.405393668915337,123.37503886310179],
  [13.405440750497107,123.37477709885269],
  [13.405542067911895,123.37450393677523],
  [13.405665369557113,123.37429660830458],
  [13.405692132697055,123.3742553391308],
  [13.405629048149194,123.37410303622568],
  [13.405586991700716,123.37394665654563],
  [13.405578389260128,123.37387394419096],
  [13.405542067837857,123.37354870379318],
  [13.405608019888888,123.37354280819767],
];

type MapProps = {
  simple?: boolean; // if true, disable destination polyline and routing
  destination?: { latitude: number; longitude: number }; // optional destination coords
};

export default function Index({ simple = false, destination }: MapProps) {
  // center set to Camarines Sur Polytechnic / Nabua (OSM result center)
  const initialRegion = {
    latitude: 13.405817,
    longitude: 123.3763382,
    latitudeDelta: 0.005,
    longitudeDelta: 0.008,
  };

  const webviewRef = useRef<any>(null);
  const [currentLocation, setCurrentLocation] = useState({ latitude: 13.405669, longitude: 123.377169 });
  const [heading, setHeading] = useState(0);
  const [demoMode, setDemoMode] = useState(true);
  const DEMO_COORDS = { latitude: 13.405669, longitude: 123.377169 };
  const [isMoving, setIsMoving] = useState(false);
  const lastPosRef = useRef<{ latitude: number; longitude: number; timestamp: number } | null>(null);
  const [campusPolygon, setCampusPolygon] = useState<LatLngTuple[]>([]);
  const navIconUri = Image.resolveAssetSource(require('../../assets/images/navigation.png')).uri;
  // default destination (Academic Building IV) if no prop provided
  const DESTINATION_COORDS = destination ?? { latitude: 13.406402, longitude: 123.375668 };
  // when running in "simple" mode or no destination we ignore routing

  const allPlaces = PLACES;

  useEffect(() => {
    let mounted = true;
    let headingSub: Location.LocationSubscription | null = null;
    let posSub: Location.LocationSubscription | null = null;

    const startTracking = async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") return;

        const initialPos = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.BestForNavigation,
        });
        if (mounted) {
          const start = {
            latitude: Number(initialPos.coords.latitude),
            longitude: Number(initialPos.coords.longitude),
          };
          setCurrentLocation(start);
        }

        headingSub = await Location.watchHeadingAsync((hd: any) => {
          const angle = Number(hd?.trueHeading ?? hd?.magHeading ?? 0);
          if (!mounted || !Number.isFinite(angle)) return;
          setHeading(angle);
          try {
            webviewRef.current?.postMessage(JSON.stringify({ type: "heading", heading: angle }));
          } catch {}
        });

        posSub = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.BestForNavigation,
            timeInterval: 1000,
            distanceInterval: 1,
          },
          (pos) => {
            if (!mounted) return;
            const lat = Number(pos.coords.latitude);
            const lng = Number(pos.coords.longitude);
            if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;

            setCurrentLocation({ latitude: lat, longitude: lng });
            try {
              webviewRef.current?.postMessage(JSON.stringify({ type: "location", lat, lng }));
            } catch {}
          }
        );
      } catch {}
    };

    startTracking();

    return () => {
      mounted = false;
      try {
        headingSub?.remove();
      } catch {}
      try {
        posSub?.remove();
      } catch {}
    };
  }, []);

  // load campus boundary with progressive fallbacks
  useEffect(() => {
    let active = true;

    function extractCoords(el: any): LatLngTuple[] {
      if (el.type === 'way' && Array.isArray(el.geometry)) {
        return el.geometry.map((p: any) => [p.lat, p.lon] as LatLngTuple);
      }
      if (el.type === 'relation' && Array.isArray(el.members)) {
        const coords: LatLngTuple[] = [];
        el.members.forEach((m: any) => {
          if (Array.isArray(m.geometry)) {
            m.geometry.forEach((p: any) => coords.push([p.lat, p.lon] as LatLngTuple));
          }
        });
        return coords;
      }
      return [];
    }

    const fetchBoundary = async () => {
      // try overpass with any known name/alias
      try {
        const regex = NAME_VARIANTS.map(n => n.replace(/["\\]/g, "\\$&")).join("|");
        console.log('🔍 Overpass query regex', regex);
        const query = `[out:json][timeout:25];(way["name"~"${regex}",i];way["alt_name"~"${regex}",i];way["old_name"~"${regex}",i];relation["name"~"${regex}",i];relation["alt_name"~"${regex}",i];relation["old_name"~"${regex}",i];);out geom;`;
        const res = await fetch('https://overpass-api.de/api/interpreter', {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain' },
          body: query,
        });
        const json = await res.json().catch(() => null);
        if (json?.elements?.length) {
          for (const e of json.elements) {
            const coords = extractCoords(e);
            if (coords.length > 6 && active) {
              console.log('✅ Campus boundary obtained from Overpass (element type', e.type, ')', coords.slice(0,5));
              setCampusPolygon(coords);
              return;
            }
          }
        }
      } catch (e) {
        console.warn('Overpass lookup failed', e);
      }

      // try nominatim for each variant
      for (const name of NAME_VARIANTS) {
        try {
          console.log('🔍 Nominatim search for', name);
          const nm = await fetch(
            'https://nominatim.openstreetmap.org/search?format=jsonv2&polygon_geojson=1&q=' +
              encodeURIComponent(name)
          );
          const nmJson = await nm.json().catch(() => null);
          if (Array.isArray(nmJson) && nmJson[0]?.geojson) {
            const g = nmJson[0].geojson;
            let poly: any[] = [];
            if (g.type === 'Polygon') poly = g.coordinates[0];
            else if (g.type === 'MultiPolygon') poly = g.coordinates[0][0];
            if (poly.length) {
              const coords = poly.map((c: any) => [c[1], c[0]] as LatLngTuple);
              if (coords.length > 6 && active) {
                console.log('✅ Campus boundary obtained from Nominatim via', name, coords.slice(0,5));
                setCampusPolygon(coords);
                return;
              }
            }
          }
        } catch {}
      }

      // explicit relation fallback
      try {
        console.log('🔁 querying explicit relation id 19176042');
        const rel = await fetch('https://overpass-api.de/api/interpreter', {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain' },
          body: `[out:json][timeout:25];relation(19176042);out geom;`,
        });
        const relJson = await rel.json().catch(() => null);
        if (relJson?.elements?.length) {
          const el = relJson.elements[0];
          const coords = extractCoords(el);
          if (coords.length > 6 && active) {
            console.log('✅ Campus boundary obtained from relation 19176042', coords.slice(0,5));
            setCampusPolygon(coords);
            return;
          }
        }
      } catch (e) {
        console.warn('relation lookup failed', e);
      }

      console.warn('⚠️ Using manual fallback boundary');
      if (active) setCampusPolygon(CAMPUS_BORDER_FALLBACK);
    };

    fetchBoundary();
    return () => {
      active = false;
    };
  }, []);

  const MAP_HTML = useMemo(
    () => `
  <!doctype html>
  <html>
  <head>
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
    <style>
      html, body, #map { height: 100%; margin: 0; padding: 0; }
      .leaflet-control-container { display: none; }
      .user-marker { position: relative; width: 46px; height: 46px; transform-origin: center; }
      .user-marker .ring { position: absolute; left: 50%; top: 50%; width: 44px; height: 44px; margin-left: -22px; margin-top: -22px; border-radius: 50%; z-index: 0; }
      .user-marker .ring::after {
        content: '';
        position: absolute;
        left: 50%; top: 50%; width: 100%; height: 100%; border-radius: 50%;
        background: rgba(0,42,122,0.08);
        border: 3px solid rgba(0,42,122,0.35);
        transform: translate(-50%, -50%);
        animation: pulse 1.4s ease-out infinite;
      }
      .user-marker .bg {
        position: absolute;
        left: 50%; top: 50%; width: 28px; height: 28px; margin-left: -14px; margin-top: -14px;
        border-radius: 50%; background: #fff; display: flex; align-items: center; justify-content: center; z-index: 2;
        box-shadow: 0 2px 6px rgba(0,0,0,0.2);
      }
      .user-marker .bg img.icon { width: 14px; height: 14px; display: block; transform-origin: center; }
      @keyframes pulse {
        0% { transform: translate(-50%, -50%) scale(0.85); opacity: 1; }
        100% { transform: translate(-50%, -50%) scale(1.45); opacity: 0; }
      }
    </style>
  </head>
  <body>
    <div id="map"></div>
    <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
    <script>
      let lat = ${currentLocation.latitude};
      let lng = ${currentLocation.longitude};
      const destLat = ${DESTINATION_COORDS.latitude};
      const destLng = ${DESTINATION_COORDS.longitude};

      const map = L.map('map', {
        zoomControl: false,
        minZoom: 16,
        maxZoom: 19,
        dragging: true,
        touchZoom: true,
        inertia: true
      });

      map.setView([lat, lng], 18);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; OpenStreetMap contributors'
      }).addTo(map);

      const userPin = L.divIcon({
        className: 'user-marker',
        html: '<div class="ring"></div><div class="bg"><img class="icon" src="${navIconUri}" /></div>',
        iconSize: [44, 44],
        iconAnchor: [22, 22]
      });

      const userMarker = L.marker([lat, lng], { icon: userPin }).addTo(map);
      ${(!simple && !!destination) ? `
      // use a custom pin icon for destination instead of simple circle
      const destIcon = L.divIcon({
        className: '',
        html: '<svg width="40" height="40" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 110-5 2.5 2.5 0 010 5z" fill="#D62828"/></svg>',
        iconSize: [40, 40],
        iconAnchor: [20, 40]
      });
      const destinationMarker = L.marker([destLat, destLng], { icon: destIcon }).addTo(map);

      let routeLine = L.polyline([[lat, lng], [destLat, destLng]], {
        color: '#0D6EFD',
        weight: 5,
        opacity: 0.95
      }).addTo(map);

      // request osm route along roads via OSRM, update polyline
      async function updateRouteTo(destLat,destLng) {
        try {
          const resp = await fetch(
            'https://router.project-osrm.org/route/v1/driving/' + lng + ',' + lat + ';' + destLng + ',' + destLat + '?overview=full&geometries=geojson'
          );
          const json = await resp.json();
          if (json.routes && json.routes[0] && json.routes[0].geometry) {
            const coords = json.routes[0].geometry.coordinates.map(c=>[c[1],c[0]]);
            routeLine.setLatLngs(coords);
          }
        } catch (e) { console.warn('route fetch error', e); }
      }
      updateRouteTo(destLat,destLng);
      ` : ''}

      let campusLayer = null;


      function handleRNMessage(raw) {
        let msg = null;
        try { msg = JSON.parse(raw && raw.data ? raw.data : raw); } catch (e) { return; }
        if (!msg || !msg.type) return;

        if (msg.type === 'location' && typeof msg.lat === 'number' && typeof msg.lng === 'number') {
          lat = msg.lat;
          lng = msg.lng;
          userMarker.setLatLng([lat, lng]);
          ${(!simple && !!destination) ? `routeLine && updateRouteTo(destLat,destLng);` : ''}
        }

        if (msg.type === 'heading' && typeof msg.heading === 'number') {
          const iconEl = document.querySelector('.user-marker .icon');
          if (iconEl) iconEl.style.transform = 'rotate(' + msg.heading + 'deg)';
        }

        if (msg.type === 'campusPolygon' && Array.isArray(msg.coords) && msg.coords.length > 2) {
          if (campusLayer) map.removeLayer(campusLayer);
          campusLayer = L.polygon(msg.coords, {
            color: '#0B3C8A',
            weight: 4,
            opacity: 1,
            fill: false
          }).addTo(map);
        }
      }

      document.addEventListener('message', handleRNMessage);
      window.addEventListener('message', handleRNMessage);

      if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
        window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'init' }));
      }
    </script>
  </body>
  </html>
  `,
    [currentLocation.latitude, currentLocation.longitude, navIconUri, simple]
  );

  const handleWebViewMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data?.type === "init") {
        webviewRef.current?.postMessage(
          JSON.stringify({
            type: "campusPolygon",
            coords: CAMPUS_BORDER_FALLBACK,
          })
        );
        webviewRef.current?.postMessage(
          JSON.stringify({
            type: "location",
            lat: currentLocation.latitude,
            lng: currentLocation.longitude,
          })
        );
        webviewRef.current?.postMessage(JSON.stringify({ type: "heading", heading }));
      }
    } catch {}
  };

  useEffect(() => {
    // whenever campusPolygon state updates, push new boundary to the WebView
    try {
      const coords = campusPolygon.length ? campusPolygon : CAMPUS_BORDER_FALLBACK;
      console.log('🗺️ sending campus polygon, points=', coords.length);
      webviewRef.current?.postMessage(
        JSON.stringify({
          type: "campusPolygon",
          coords,
        })
      );
    } catch {}
  }, [campusPolygon]);

  return (
    <SafeAreaView style={styles.container}>
      <WebView
        ref={webviewRef}
        originWhitelist={["*"]}
        source={{ html: MAP_HTML }}
        onMessage={handleWebViewMessage}
        style={styles.map}
        javaScriptEnabled
        domStorageEnabled
        startInLoadingState
        renderLoading={() => <View style={styles.loader} />}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  map: {
    flex: 1,
  },
  loader: {
    flex: 1,
    backgroundColor: "#000",
  },
});
