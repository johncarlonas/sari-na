import React, { useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Easing,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { setDisplayName } from "@/services/localUserService";

export default function OnboardingScreen() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  // subtle shake animation for validation error
  const shakeAnim = useRef(new Animated.Value(0)).current;

  const shake = () => {
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 8, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -8, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 6, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -6, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 60, useNativeDriver: true }),
    ]).start();
  };

  const handleGetStarted = async () => {
    const trimmed = name.trim();
    if (!trimmed) {
      setError("Please enter your name to continue.");
      shake();
      return;
    }

    setIsSubmitting(true);
    setError("");
    try {
      await setDisplayName(trimmed);
      router.replace("/user/home");
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={["#002A7A", "#1565C0", "#1976D2"]} style={styles.gradient}>
        <SafeAreaView style={styles.safe}>
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <KeyboardAvoidingView
              style={styles.inner}
              behavior={Platform.OS === "ios" ? "padding" : "height"}
            >
              {/* Logo / Hero */}
              <View style={styles.heroSection}>
                <Image
                  source={require("../assets/images/sarina_logo.png")}
                  style={styles.logo}
                  resizeMode="contain"
                />
                <Text style={styles.appName}>Welcome to SARI NA?</Text>
                <Text style={styles.tagline}>Your Offline-first Campus Navigator</Text>
              </View>

              {/* Card */}
              <View style={styles.card}>
                <Text style={styles.welcomeTitle}>Enter your name </Text>
                <Text style={styles.welcomeSubtext}>
                  What should we call you? You can always change this later in your profile.
                </Text>

                <Animated.View style={{ transform: [{ translateX: shakeAnim }] }}>
                  <View
                    style={[
                      styles.inputWrapper,
                      isFocused && styles.inputWrapperFocused,
                      !!error && styles.inputWrapperError,
                    ]}
                  >
                    <Ionicons
                      name="person-outline"
                      size={20}
                      color={isFocused ? "#1565C0" : "#8ca0c7"}
                      style={styles.inputIcon}
                    />
                    <TextInput
                      style={styles.input}
                      placeholder="Enter your name"
                      placeholderTextColor="#8ca0c7"
                      value={name}
                      onChangeText={(t) => {
                        setName(t);
                        if (error) setError("");
                      }}
                      onFocus={() => setIsFocused(true)}
                      onBlur={() => setIsFocused(false)}
                      autoCapitalize="words"
                      returnKeyType="done"
                      onSubmitEditing={handleGetStarted}
                      maxLength={40}
                    />
                  </View>
                </Animated.View>

                {!!error && (
                  <Text style={styles.errorText}>{error}</Text>
                )}

                <Pressable
                  onPress={handleGetStarted}
                  disabled={isSubmitting}
                  style={({ pressed }) => [styles.btnWrapper, { opacity: pressed ? 0.85 : 1 }]}
                >
                  <LinearGradient
                    colors={["#002A7A", "#1565C0"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.btn}
                  >
                    {isSubmitting ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <Text style={styles.btnText}>Get Started</Text>
                    )}
                  </LinearGradient>
                </Pressable>
              </View>

              {/* Footer */}
              <Text style={styles.footer}>
                No account · Offline-first · Your data stays on device
              </Text>
              <StatusBar style="light" />
            </KeyboardAvoidingView>
          </TouchableWithoutFeedback>
        </SafeAreaView>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safe: { flex: 1 },
  gradient: { flex: 1 },
  inner: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
    gap: 0,
  },

  // ─── Hero ─────────────────────────────────────────────────────────────────
  heroSection: {
    alignItems: "center",
    marginBottom: 32,
  },
  logo: {
    width: 200,
    height: 140,
    marginBottom: -15,
  },
  appName: {
    fontSize: 28,
    fontWeight: "900",
    color: "#ffffff",
    letterSpacing: 1,
    textAlign: 'center',
  },
  tagline: {
    fontSize: 14,
    color: "rgba(255,255,255,0.75)",
    marginTop: 4,
    letterSpacing: 0.5,
  },

  // ─── Card ─────────────────────────────────────────────────────────────────
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 24,
    padding: 24,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    elevation: 10,
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: "900",
    color: "#002A7A",
    marginBottom: 6,
  },
  welcomeSubtext: {
    fontSize: 14,
    color: "#6b84b7",
    lineHeight: 20,
    marginBottom: 22,
  },

  // ─── Input ────────────────────────────────────────────────────────────────
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "#cfdaef",
    borderRadius: 14,
    backgroundColor: "#f5f8fd",
    paddingHorizontal: 14,
    height: 52,
    marginBottom: 8,
  },
  inputWrapperFocused: {
    borderColor: "#1565C0",
    backgroundColor: "#ffffff",
  },
  inputWrapperError: {
    borderColor: "#D62828",
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: "#002A7A",
    fontWeight: "600",
  },
  errorText: {
    color: "#D62828",
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 12,
    marginLeft: 4,
  },

  // ─── Button ───────────────────────────────────────────────────────────────
  btnWrapper: {
    marginTop: 8,
    borderRadius: 30,
    overflow: "hidden",
  },
  btn: {
    height: 52,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
  },
  btnText: {
    color: "#ffffff",
    fontSize: 17,
    fontWeight: "900",
    letterSpacing: 0.5,
  },

  // ─── Footer ───────────────────────────────────────────────────────────────
  footer: {
    textAlign: "center",
    color: "rgba(255,255,255,0.55)",
    fontSize: 13,
    marginTop: 24,
    lineHeight: 18,
  },
});
