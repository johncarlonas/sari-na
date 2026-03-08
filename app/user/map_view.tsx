import React, { useMemo } from "react";
import { SafeAreaView, StyleSheet, View } from "react-native";
import places from "../data/places";
import MapBoxView, { LngLat } from "../components/map";

type Place = {
  id: string;
  title: string;
  subtitle: string;
  coords: [number, number];
};

export default function CampusMapScreen() {
  const allPlaces = places as Place[];

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

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.mapWrap}>
        <MapBoxView
          campusBounds={campusBounds}
          showRoute={false}
          showDestinationMarker={false}
          showCampusBorder
          fitToDestination={false}
        />
      </View>
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
});
