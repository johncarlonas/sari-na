import React, { useEffect, useState, useRef } from "react";
import { View, Text, StyleSheet } from "react-native";
import Constants from "expo-constants";
import type { Feature, LineString } from "geojson";
import * as Location from "expo-location";

export type LngLat = [number, number];

const DEFAULT_CAMPUS_CENTER: LngLat = [123.375668, 13.406402];

export type MapProps = {
  destinationCoords?: LngLat;
  routeLine?: Feature<LineString>;
  campusBounds: { ne: LngLat; sw: LngLat };
  showRoute?: boolean;
  showDestinationMarker?: boolean;
  showCampusBorder?: boolean;
  fitToDestination?: boolean;
  onLocationStatusChange?: (live: boolean) => void;
  onLocationUpdate?: (coords: LngLat) => void;
};

export default function MapBoxView({
  destinationCoords,
  routeLine,
  campusBounds,
  showRoute = true,
  showDestinationMarker = true,
  showCampusBorder = true,
  fitToDestination = true,
  onLocationStatusChange,
  onLocationUpdate,
}: MapProps) {
  const [mapboxLib, setMapboxLib] = useState<any>(null);
  const [mapboxError, setMapboxError] = useState<string | null>(null);
  const [originCoords, setOriginCoords] = useState<LngLat>(DEFAULT_CAMPUS_CENTER);
  const cameraRef = useRef<any>(null);

  const isExpoGo = Constants.appOwnership === "expo";

  const mapboxReady = Boolean(
    mapboxLib &&
      mapboxLib.Camera &&
      mapboxLib.MapView &&
      mapboxLib.ShapeSource &&
      mapboxLib.LineLayer &&
      mapboxLib.PointAnnotation
  );

  const Mapbox = mapboxLib;
  const Camera = mapboxLib?.Camera;
  const LineLayer = mapboxLib?.LineLayer;
  const LocationPuck = mapboxLib?.LocationPuck;
  const MapView = mapboxLib?.MapView;
  const PointAnnotation = mapboxLib?.PointAnnotation;
  const ShapeSource = mapboxLib?.ShapeSource;

  const campusBorderLine: Feature<LineString> = {
    type: "Feature",
    geometry: {
      type: "LineString",
      coordinates: [
        [campusBounds.sw[0], campusBounds.sw[1]],
        [campusBounds.ne[0], campusBounds.sw[1]],
        [campusBounds.ne[0], campusBounds.ne[1]],
        [campusBounds.sw[0], campusBounds.ne[1]],
        [campusBounds.sw[0], campusBounds.sw[1]],
      ],
    },
    properties: {},
  };

  useEffect(() => {
    if (isExpoGo) {
      setMapboxError("Mapbox native is not available in Expo Go.");
      return;
    }

    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const loaded = require("@rnmapbox/maps");
      const moduleRef = loaded?.default ?? loaded;
      if (!moduleRef) {
        setMapboxError("Mapbox module returned empty reference.");
        return;
      }
      setMapboxLib(moduleRef);
    } catch (error) {
      setMapboxError(
        error instanceof Error ? error.message : "Mapbox native module unavailable"
      );
    }
  }, [isExpoGo]);

  useEffect(() => {
    if (mapboxReady) {
      Mapbox.setAccessToken(process.env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN);
    }
  }, [mapboxReady, Mapbox]);

  useEffect(() => {
    let mounted = true;
    let locationSubscription: Location.LocationSubscription | null = null;

    const startLocationTracking = async () => {
      try {
        const permission = await Location.requestForegroundPermissionsAsync();

        if (permission.status !== "granted") {
          if (mounted) {
            setOriginCoords(DEFAULT_CAMPUS_CENTER);
            onLocationStatusChange?.(false);
            onLocationUpdate?.(DEFAULT_CAMPUS_CENTER);
          }
          return;
        }

        const initialPosition = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });

        if (mounted) {
          const nextCoords: LngLat = [
            initialPosition.coords.longitude,
            initialPosition.coords.latitude,
          ];
          setOriginCoords(nextCoords);
          onLocationStatusChange?.(true);
          onLocationUpdate?.(nextCoords);
        }

        locationSubscription = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.Balanced,
            distanceInterval: 1,
            timeInterval: 1500,
          },
          (position) => {
            if (!mounted) return;
            const nextCoords: LngLat = [position.coords.longitude, position.coords.latitude];
            setOriginCoords(nextCoords);
            onLocationStatusChange?.(true);
            onLocationUpdate?.(nextCoords);
          }
        );
      } catch {
        if (mounted) {
          setOriginCoords(DEFAULT_CAMPUS_CENTER);
          onLocationStatusChange?.(false);
          onLocationUpdate?.(DEFAULT_CAMPUS_CENTER);
        }
      }
    };

    startLocationTracking();
    return () => {
      mounted = false;
      locationSubscription?.remove();
    };
  }, [onLocationStatusChange, onLocationUpdate]);

  // whenever origin or destination update, re‑fit camera bounds
  useEffect(() => {
    if (!cameraRef.current) return;

    if (fitToDestination && destinationCoords) {
      cameraRef.current.fitBounds(originCoords, destinationCoords, 80, 600);
      return;
    }

    cameraRef.current.fitBounds(campusBounds.sw, campusBounds.ne, 50, 600);
  }, [originCoords, destinationCoords, fitToDestination, campusBounds]);

  if (!mapboxReady) {
    return (
      <View style={styles.tokenWarningWrap}>
        <Text style={styles.tokenWarningTitle}>Map unavailable in current runtime</Text>
        <Text style={styles.tokenWarningText}>Use a development build to run Mapbox native.</Text>
        {isExpoGo && <Text style={styles.tokenWarningText}>Current runtime: Expo Go.</Text>}
        {!mapboxError && (
          <Text style={styles.tokenWarningText}>Set EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN.</Text>
        )}
        {!!mapboxError && <Text style={styles.tokenWarningError}>{mapboxError}</Text>}
      </View>
    );
  }

  return (
    <MapView style={StyleSheet.absoluteFill} styleURL={Mapbox.StyleURL.Light}>
      <Camera
        ref={cameraRef}
        centerCoordinate={originCoords}
        zoomLevel={17}
        minZoomLevel={16}
        maxZoomLevel={19}
        maxBounds={campusBounds}
        animationDuration={700}
      />

      <LocationPuck
        visible
        puckBearing="heading"
        puckBearingEnabled
        androidRenderMode="compass"
        pulsing={{ isEnabled: true, color: "#4A9CFF", radius: 48 }}
      />

      {showCampusBorder && (
        <ShapeSource id="campus-border-source" shape={campusBorderLine}>
          <LineLayer
            id="campus-border-line"
            style={{
              lineColor: "#174eaa",
              lineWidth: 2,
              lineCap: "round",
              lineJoin: "round",
            }}
          />
        </ShapeSource>
      )}

      {showRoute && routeLine && (
        <ShapeSource id="route-source" shape={routeLine}>
          <LineLayer
            id="route-line"
            style={{
              lineColor: "#2b8be8",
              lineWidth: 4,
              lineCap: "round",
              lineJoin: "round",
              lineDasharray: [2, 1.4],
            }}
          />
        </ShapeSource>
      )}

      {showDestinationMarker && destinationCoords && (
        <PointAnnotation id="destination-marker" coordinate={destinationCoords}>
          <View style={styles.markerOuter}>
            <Text style={{ display: "none" }} />
          </View>
        </PointAnnotation>
      )}
    </MapView>
  );
}

const styles = StyleSheet.create({
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
    marginTop: 3,
  },
  tokenWarningError: {
    fontSize: 11,
    textAlign: "center",
    color: "#7c8eb4",
    marginTop: 8,
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
});
