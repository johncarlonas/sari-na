import React, { useMemo, useState, useRef } from "react";
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
  Animated,
  Easing,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useFocusEffect } from '@react-navigation/native';
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
      icon: "map-marker" as const,
    },
    {
      title: "AiRCoDe",
      subtitle: "Academic Building IV, Floor 4",
      icon: "map-marker" as const,
    },
    {
      title: "CS Laboratory",
      subtitle: "Academic Building IV, Floor 3",
      icon: "map-marker" as const,
    },
  ];

  // simple initial helper for avatar

  // animation values for recent destination cards
  const cardAnims = useRef<Animated.Value[]>([]);
  if (cardAnims.current.length === 0) {
    cardAnims.current = recent.map(() => new Animated.Value(0));
  }

  useFocusEffect(
    React.useCallback(() => {
      // reset and run slide-in animation from left
      cardAnims.current.forEach(anim => anim.setValue(0));
      const animations = cardAnims.current.map((anim, i) =>
        Animated.timing(anim, {
          toValue: 1,
          duration: 600,
          delay: i * 150,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        })
      );
      Animated.stagger(150, animations).start();
    }, [])
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <TouchableWithoutFeedback onPress={()=>{ Keyboard.dismiss(); setSearchFocused(false); }}>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: 90 + insets.bottom }]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.greeting}>Good day, John Renzzo!</Text>

        <Pressable
          onPress={() => {
            setSearchFocused(false);
            router.push('/user/homeSearch');
          }}
          onPressIn={() => setSearchFocused(true)}
          onPressOut={() => setSearchFocused(false)}
          style={[styles.searchContainer, { borderColor: containerBorder }]}
        >
          <Text style={styles.searchPlaceholder}>Search Location</Text>
          <Pressable style={styles.searchIconWrapper} pointerEvents="none">
            <Ionicons name="search" size={25} color="#fff" marginRight="5"/>
          </Pressable>
        </Pressable>

        <Pressable onPress={() => router.push("/user/scan_qr")}>
          <LinearGradient 
            
            colors={['#002A7A', '#1565C0']} 
            style={styles.scanCard}
            // start={{ x: 0, y: 0 }}
            // end={{ x: 1, y: 0.5 }}
          >
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
        {recent.map((item, idx) => (
          <Animated.View
            key={item.title}
            style={[
              styles.destinationCard,
              {
                opacity: cardAnims.current[idx],
                transform: [
                  {
                    translateX: cardAnims.current[idx].interpolate({
                      inputRange: [0, 1],
                      outputRange: [-50, 0],
                    }),
                  },
                ],
              },
            ]}
          >
            <View style={styles.destinationIconWrap}>
              <MaterialCommunityIcons name={item.icon} size={23} color="#6d7da4" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.destinationTitle}>{item.title}</Text>
              <View style={styles.destinationSubRow}>
                <Text style={styles.destinationSub}>{item.subtitle}</Text>
              </View>
            </View>
          </Animated.View>
        ))}

        {/* Quick Tip */}
        <LinearGradient
          colors={["#FF8C5A", "#FF6B35"]}
          // start={{ x: 0, y: 0 }}
          // end={{ x: 1, y: 0 }}
          style={styles.quickTipCard}
        >
          <View style={styles.quickTipIconWrapper}>
            <View style={styles.quickTipIcon}>
              <Ionicons name="bulb" size={25} color="#fff" />
            </View>
          </View>
          <View style={styles.quickTipTextWrap}>
            <Text style={styles.quickTipTitle}>Quick Tip</Text>
            <Text style={styles.quickTipText}>
              QR codes are located at room entrances and hallway pillars. Scan nearest QR to sync your starting point for accurate navigation.
            </Text>
          </View>
        </LinearGradient>
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
    paddingRight: 50, 
  },
  searchPlaceholder: {
    flex: 1,
    color: "#8ca0c7",
    fontSize: 14,
    paddingLeft: 10,
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
  quickTipCard: {
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 15,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 15,
    backgroundColor: "#FF6B35", // gradient wrapper handles colors
    shadowColor: "#FF6B35",
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 5,
  },
  quickTipIconWrapper: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
    backdropFilter: "blur(4px)",
  },
  quickTipIcon: {
    width: 24,
    height: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  quickTipTextWrap: {
    flex: 1,
  },
  quickTipTitle: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 2,
  },
  quickTipText: {
    color: "rgba(255,255,255,0.95)",
    fontSize: 12,
    lineHeight: 18,
  },
});
