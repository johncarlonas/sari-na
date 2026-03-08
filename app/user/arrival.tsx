import React, { useMemo } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

type Params = {
  location?: string;
  detail?: string;
  placeId?: string;
};

export default function ArrivalScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<Params>();

  const location = typeof params.location === "string" ? params.location : "CCS Faculty Lounge";
  const detail = typeof params.detail === "string" ? params.detail : "Academic Building IV, Floor 2";

  const destinationFloor = useMemo(() => {
    const floorMatch = detail.match(/Floor\s*([0-9]+)/i);
    return floorMatch?.[1] ? `Floor ${floorMatch[1]}` : "Destination";
  }, [detail]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.content}>
        <View style={styles.checkCircle}>
          <Ionicons name="checkmark" size={60} color="#26B376" />
        </View>

        <Text style={styles.title}>Arrival Confirmed!</Text>
        <Text style={styles.subtitle}>You have successfully reached your destination</Text>

        <View style={styles.destinationCard}>
          <View style={styles.destinationRow}>
            <View style={styles.iconWrap}>
              <Ionicons name="location-outline" size={18} color="#ffffff" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.destinationTitle}>{location}</Text>
              <Text style={styles.destinationDetail}>{detail}</Text>
            </View>
          </View>

          <View style={styles.officeHoursCard}>
            <View style={styles.officeHoursRow}>
              <Ionicons name="time-outline" size={16} color="#00348f" />
              <Text style={styles.officeHoursTitle}>Office Hours</Text>
            </View>
            <Text style={styles.officeHoursText}>Monday - Friday: 8:00 AM - 5:00 PM</Text>
            <Text style={styles.officeHoursText}>Saturday: 9:00 AM - 12:00 PM</Text>
          </View>
        </View>

        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Journey Summary</Text>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Starting Point:</Text>
            <Text style={styles.summaryValue}>Room 2, Academic Building IV</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Destination:</Text>
            <Text style={styles.summaryValue}>{destinationFloor}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Building Crossed:</Text>
            <Text style={styles.summaryValue}>1</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Estimated Time:</Text>
            <Text style={styles.summaryValue}>~5 minutes</Text>
          </View>
        </View>

        <Pressable style={styles.homeButton} onPress={() => router.replace("/user/home") }>
          <Ionicons name="home" size={18} color="#002A7A" />
          <Text style={styles.homeButtonText}>Return to Home</Text>
        </Pressable>

        <Text style={styles.feedbackText}>How was your navigation experience?</Text>
        <View style={styles.feedbackRow}>
          <Pressable style={styles.feedbackButton}>
            <Ionicons name="thumbs-up" size={20} color="#ffffff" />
          </Pressable>
          <Pressable style={styles.feedbackButton}>
            <Ionicons name="thumbs-down" size={20} color="#ffffff" />
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#00369e",
  },
  content: {
    flex: 1,
    paddingTop: 120, // account for navbar height
    paddingHorizontal: 18,
  },
  checkCircle: {
    alignSelf: "center",
    width: 126,
    height: 126,
    borderRadius: 63,
    backgroundColor: "#ffffff",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 18,
  },
  title: {
    color: "#ffffff",
    textAlign: "center",
    fontSize: 39,
    fontWeight: "900",
  },
  subtitle: {
    color: "#e3eeff",
    textAlign: "center",
    marginTop: 6,
    fontSize: 20,
    marginBottom: 16,
  },
  destinationCard: {
    backgroundColor: "#f4f8ff",
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
  },
  destinationRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#2583de",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  destinationTitle: {
    color: "#002A7A",
    fontSize: 30,
    fontWeight: "900",
  },
  destinationDetail: {
    color: "#5a78ac",
    fontSize: 19,
    marginTop: 2,
  },
  officeHoursCard: {
    marginTop: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#c7d9f4",
    backgroundColor: "#e8f0fb",
    padding: 10,
  },
  officeHoursRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  officeHoursTitle: {
    marginLeft: 6,
    color: "#00348f",
    fontSize: 20,
    fontWeight: "800",
  },
  officeHoursText: {
    color: "#365e9f",
    fontSize: 18,
    marginLeft: 22,
    marginBottom: 2,
  },
  summaryCard: {
    backgroundColor: "#2a58ad",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#4f77bf",
    padding: 14,
    marginBottom: 14,
  },
  summaryTitle: {
    color: "#ffffff",
    fontSize: 28,
    fontWeight: "800",
    marginBottom: 10,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 7,
  },
  summaryLabel: {
    color: "#d9e6ff",
    fontSize: 18,
  },
  summaryValue: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "700",
    marginLeft: 12,
  },
  homeButton: {
    height: 52,
    borderRadius: 26,
    backgroundColor: "#ffffff",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
    marginBottom: 14,
  },
  homeButtonText: {
    color: "#002A7A",
    fontSize: 18,
    fontWeight: "800",
  },
  feedbackText: {
    color: "#dbe8ff",
    textAlign: "center",
    fontSize: 15,
    marginBottom: 10,
  },
  feedbackRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 14,
  },
  feedbackButton: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: "#4b74bc",
    alignItems: "center",
    justifyContent: "center",
  },
});
