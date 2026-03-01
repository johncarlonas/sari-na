import React, { useMemo, useState } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  ScrollView,
  Image,
  TouchableWithoutFeedback,
  Keyboard,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

type Params = {
  location?: string;
  detail?: string;
};

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<Params>();
  const [searchText, setSearchText] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);
  const containerBorder = searchFocused ? '#002A7A' : '#cfdaef';

  const currentLocation = useMemo(() => {
    const location = typeof params.location === "string" ? params.location : "";
    const detail = typeof params.detail === "string" ? params.detail : "";
    if (!location) return null;
    return { location, detail };
  }, [params.location, params.detail]);

  const recent = [
    {
      title: "Supply Office",
      subtitle: "Academic Building III, Floor 1",
      icon: "package-variant-closed" as const,
    },
    {
      title: "AiRCoDe",
      subtitle: "Academic Building IV, Floor 4",
      icon: "flask" as const,
    },
    {
      title: "CS Laboratory",
      subtitle: "Academic Building IV, Floor 3",
      icon: "monitor" as const,
    },
  ];

  return (
    <SafeAreaView style={styles.safeArea}>
      <TouchableWithoutFeedback onPress={()=>{ Keyboard.dismiss(); setSearchFocused(false); }}>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: 120 + insets.bottom }]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.greeting}>Good day, Juan!</Text>

        <View style={[styles.searchContainer, { borderColor: containerBorder }]}>
          <TextInput
            value={searchText}
            onChangeText={setSearchText}
            placeholder="Search Location"
            placeholderTextColor="#8ca0c7"
            style={[styles.searchInput]}
            onFocus={()=>setSearchFocused(true)}
            onBlur={()=>setSearchFocused(false)}
          />
          <Pressable style={styles.searchIconWrapper}>
            <Ionicons name="search" size={25} color="#fff" marginRight="5"/>
          </Pressable>
        </View>

        <Pressable onPress={() => router.push("/user/scan_qr")}>
          <LinearGradient colors={['#1565C0', '#002A7A']} style={styles.scanCard}>
            <View style={styles.scanIconBox}>
              <Image source={require("../../assets/images/qr-code.png")} style={styles.scanIcon} />
            </View>
            <View style={styles.scanCardTextWrap}>
              <Text style={styles.scanTitle}>Scan QR Code</Text>
              <Text style={styles.scanSub}>To know your current location</Text>
            </View>
          </LinearGradient>
        </Pressable>

        {currentLocation && (
          <View style={styles.locationBadge}>
            <Ionicons name="checkmark-circle" size={25} color="#00B56A" />
            <Text style={styles.badgePrefix}>You are at:</Text>
            <View style={styles.locationBox}>
              <Text style={styles.badgeLocation}>{currentLocation.location}</Text>
              {!!currentLocation.detail && <Text style={styles.badgeDetail}>{currentLocation.detail}</Text>}
            </View>
          </View>
        )}

        <Text style={styles.sectionTitle}>Recent Destinations</Text>
        {recent.map((item) => (
          <View key={item.title} style={styles.destinationCard}>
            <View style={styles.destinationIconWrap}>
              <MaterialCommunityIcons name={item.icon} size={21} color="#6d7da4" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.destinationTitle}>{item.title}</Text>
              <View style={styles.destinationSubRow}>
                <Ionicons name="location-outline" size={14} color="#6b84b7" />
                <Text style={styles.destinationSub}>{item.subtitle}</Text>
              </View>
            </View>
          </View>
        ))}
      </ScrollView>
      </TouchableWithoutFeedback>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#edf2f8" },
  content: {
    paddingHorizontal: 14,
    paddingTop: 100,
    marginLeft: 10,
    marginRight: 10,
  },
  greeting: {
    color: "#002a7a",
    fontSize: 25,
    fontWeight: "900",
    marginBottom: 20,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 30,
    height: 55,
    paddingHorizontal: 10,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: "#cfdaef",
    shadowColor: "#8ea8d5",
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
    position: "relative",
  },
  searchInput: {
    flex: 1,
    color: "#00328f",
    fontSize: 14,
    paddingVertical: 0,
    paddingLeft: 10,
    paddingRight: 50, // leave space for full-width icon
  },
  searchIconWrapper: {
    position: "absolute",
    right: 0,
    top: 0,
    bottom: 0,
    width: 55,
    backgroundColor: "#0b489d",
    borderTopRightRadius: 30,
    borderBottomRightRadius: 30,
    alignItems: "center",
    justifyContent: "center",
  },
  scanCard: {
    borderRadius: 20,
    minHeight: 114,
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
    shadowColor: "#2e8ae6",
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 5,
  },
  scanIconBox: {
    width: 60,
    height: 60,
    borderRadius: 14,
    backgroundColor: "none",
    alignItems: "center",
    justifyContent: "center",
  },
  scanIcon: {
    width: 50,
    height: 50,
    resizeMode: 'contain',
  },
  scanCardTextWrap: { marginLeft: 14, flex: 1 },
  scanTitle: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "900",
    lineHeight: 30,
  },
  scanSub: {
    color: "#e8f2ff",
    fontSize: 13,
    marginTop: 2,
  },
  locationBadge: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  badgePrefix: { color: "#002a7a", fontSize: 14, marginLeft: 6 },
  locationBox: {
    backgroundColor: "#fff",
    borderRadius: 10,
    justifyContent: "center",
    height: 52,
    marginLeft: 8,
    flex: 1,
    borderWidth: 1,
    borderColor: "#cfdaf0",
    paddingHorizontal: 12,
  },
  badgeLocation: { color: "#002A7A", fontSize: 13, fontWeight: "800" },
  badgeDetail: { color: "#666", fontSize: 11, marginTop: 2 },
  sectionTitle: {
    color: "#00328f",
    fontSize: 18,
    fontWeight: "900",
    marginBottom: 12,
  },
  destinationCard: {
    borderWidth: 1,
    borderColor: "#cfdaf0",
    borderRadius: 16,
    paddingHorizontal: 14,
    height: 88,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 10,
    backgroundColor: "#f7f9fd",
  },
  destinationIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: "#e3e8f4",
    alignItems: "center",
    justifyContent: "center",
  },
  destinationTitle: { color: "#00328f", fontSize: 16, fontWeight: "900" },
  destinationSubRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
    gap: 4,
  },
  destinationSub: { color: "#6b84b7", fontSize: 13 },
});
