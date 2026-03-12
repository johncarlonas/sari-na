import React from "react";
import { SafeAreaView, StyleSheet } from "react-native";
import Index from "../components/map";

export default function CampusMapScreen() {
  // simple view: only current location with heading indicator
  return (
    <SafeAreaView style={styles.safeArea}>
      <Index simple={true} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#edf2f8",
  },
});
