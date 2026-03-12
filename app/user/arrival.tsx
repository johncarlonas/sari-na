import React, { useMemo, useEffect, useRef, useState } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Pressable, StyleSheet, Text, View, Animated, ScrollView } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

type Params = {
  location?: string;
  detail?: string;
  placeId?: string;
};

export default function ArrivalScreen() {
  const router = useRouter();
  const bounce = useRef(new Animated.Value(0)).current;
  const [feedback, setFeedback] = useState<"up"|"down"|null>(null);

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(bounce, { toValue: -10, duration: 500, useNativeDriver: false }),
        Animated.timing(bounce, { toValue: 0, duration: 500, useNativeDriver: false }),
      ])
    ).start();
  }, []);
  const params = useLocalSearchParams<Params>();

  const location = typeof params.location === "string" ? params.location : "CCS Faculty Lounge";
  const detail = typeof params.detail === "string" ? params.detail : "Academic Building IV, Floor 2";

  const destinationFloor = useMemo(() => {
    const floorMatch = detail.match(/Floor\s*([0-9]+)/i);
    return floorMatch?.[1] ? `Floor ${floorMatch[1]}` : "Destination";
  }, [detail]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={{flex:1}} contentContainerStyle={styles.content}>
        <Animated.View style={[styles.checkCircle, {
            transform: [{ translateY: bounce }],
            shadowOffset: { width: 0, height: bounce.interpolate({ inputRange: [-10, 0], outputRange: [10, 2] }) },
            shadowOpacity: 0.3,
            shadowRadius: bounce.interpolate({ inputRange: [-10, 0], outputRange: [10, 2] }),
          }]}
        >
          <Ionicons name="checkmark-sharp" size={72} color="#26B376" />
        </Animated.View>

        <Text style={styles.title}>Arrival Confirmed!</Text>
        <Text style={styles.subtitle}>You have successfully reached your destination</Text>

        <View style={styles.destinationCard}>
          <View style={styles.destinationRow}>
            <View style={styles.iconWrap}>
              <Ionicons name="location" size={20} color="#ffffff" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.destinationTitle}>{location}</Text>
              <Text style={styles.destinationDetail}>{detail}</Text>
            </View>
          </View>

          <View style={styles.officeHoursCard}>
            <View style={styles.officeHoursRow}>
              <Ionicons name="time-outline" size={16} color="#0b489d" />
              <Text style={styles.officeHoursTitle}>Office Hours</Text>
            </View>
            <Text style={styles.officeHoursText}>Monday - Friday: 8:00 AM - 5:00 PM</Text>
            <Text style={styles.officeHoursText}>Saturday: 9:00 AM - 12:00 PM</Text>
          </View>
        </View>

        <LinearGradient
          colors={["#FF8C5A", "#FF6B35"]}
          style={styles.summaryCard}
        >
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
        </LinearGradient>

        <LinearGradient
          colors={["#1565C0", "#002A7A"]}
          style={styles.homeWrapper}
        >
          <Pressable style={styles.homeButton} onPress={() => router.replace("/user/home") }>
            <Ionicons name="home" size={16} color="#ffffff" style={{marginTop:10}} />
            <Text style={[styles.homeButtonText,{marginTop:10}]}>Return to Home</Text>
          </Pressable>
        </LinearGradient>

        <Text style={styles.feedbackText}>How was your navigation experience?</Text>
        <View style={styles.feedbackRow}>
          <Pressable
            style={[
              styles.feedbackButton,
              feedback === 'up' && styles.feedbackSelected,
            ]}
            onPress={() => setFeedback(feedback === 'up' ? null : 'up')}
          >
            <Ionicons name="thumbs-up" size={20} color={feedback === 'up' ? '#ffffff' : '#0b489d'} />
          </Pressable>
          <Pressable
            style={[
              styles.feedbackButton,
              feedback === 'down' && styles.feedbackSelected,
            ]}
            onPress={() => setFeedback(feedback === 'down' ? null : 'down')}
          >
            <Ionicons name="thumbs-down" size={20} color={feedback === 'down' ? '#ffffff' : '#0b489d'} />
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#edf2f8",
  },
  content: {
    flexGrow: 1,
    paddingTop: 120,
    paddingBottom: 30,
    paddingHorizontal: 18,
  },
  checkCircle: {
    alignSelf: "center",
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#ffffff",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  title: {
    color: "#002A7A",
    textAlign: "center",
    fontSize: 27,
    fontWeight: "900",
  },
  subtitle: {
    color: "#6b84b7",
    textAlign: "center",
    marginTop: 4,
    fontSize: 15,
    marginBottom: 12,
  },
  destinationCard: {
    backgroundColor: "#ffffff",
    borderRadius: 18,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#0b489d",
  },
  destinationRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#0b489d",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  destinationTitle: {
    color: "#002A7A",
    fontSize: 18,
    fontWeight: "900",
  },
  destinationDetail: {
    color: "#6b84b7",
    fontSize: 14,
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
    color: "#002A7A",
    fontSize: 16,
    fontWeight: "800",
  },
  officeHoursText: {
    color: "#6b84b7",
    fontSize: 14,
    marginLeft: 22,
    marginBottom: 2,
  },
  summaryCard: {
    borderRadius: 18,
    padding: 12,
    marginBottom: 14,
    shadowColor: "#FF6B35",
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 5,
  },
  summaryTitle: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "800",
    marginBottom: 8,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 7,
  },
  summaryLabel: {
    color: "#fce8de",
    fontSize: 13,
  },
  summaryValue: {
    color: "#ffffff",
    fontSize: 13,
    fontWeight: "700",
    marginLeft: 8,
  },
  homeButton: {
    height: 35,
    borderRadius: 30,
    backgroundColor: "transparent",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 6,
    marginBottom: 10,
  },
  homeButtonText: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "800",
  },
  homeTextMargin: {
    marginTop: 10,
  },  
  
  feedbackText: {
    color: "#6b84b7",
    textAlign: "center",
    fontSize: 14,
    marginBottom: 10,
    marginTop: 30,
  },
  homeWrapper: {
    borderRadius: 24,
    padding: 2,
    alignSelf: "stretch",
    marginBottom: 14,
  },
  feedbackRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 14,
  },
  feedbackButton: {
    width: 38,
    height: 38,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#0b489d",
    backgroundColor: "transparent",
    alignItems: "center",
    justifyContent: "center",
  },
  feedbackSelected: {
    backgroundColor: "#0b489d",
  }
});
