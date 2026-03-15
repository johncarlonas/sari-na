import React from "react";
import { useRouter } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import { BackHandler, SafeAreaView, StyleSheet } from "react-native";
import Index from "../components/map";

export default function CampusMapScreen() {
  const router = useRouter();

  useFocusEffect(
    React.useCallback(() => {
      const onBackPress = () => {
        router.replace("/user/home");
        return true;
      };
      const sub = BackHandler.addEventListener("hardwareBackPress", onBackPress);
      return () => sub.remove();
    }, [router])
  );

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
