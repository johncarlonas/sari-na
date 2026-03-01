import React, { useEffect, useRef, useState } from 'react';
import { View, Pressable, Text, StyleSheet, Animated } from 'react-native';
import { usePathname, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

export default function BottomNav() {
  const router = useRouter();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();

  const isHome = pathname === '/user/home';
  const isScan = pathname === '/user/scan_qr';
  const isProfile = pathname === '/user/profile';
  const activeIndex = isHome ? 0 : isScan ? 1 : 2;

  const homeAnim = useRef(new Animated.Value(isHome ? 1 : 0)).current;
  const scanAnim = useRef(new Animated.Value(isScan ? 1 : 0)).current;
  const profileAnim = useRef(new Animated.Value(isProfile ? 1 : 0)).current;
  const bubbleX = useRef(new Animated.Value(0)).current;
  const [tabCenters, setTabCenters] = useState<number[]>([]);

  const bubbleSize = 78;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(homeAnim, {
        toValue: isHome ? 1 : 0,
        duration: 230,
        useNativeDriver: true,
      }),
      Animated.timing(scanAnim, {
        toValue: isScan ? 1 : 0,
        duration: 230,
        useNativeDriver: true,
      }),
      Animated.timing(profileAnim, {
        toValue: isProfile ? 1 : 0,
        duration: 230,
        useNativeDriver: true,
      }),
    ]).start();
  }, [isHome, isScan, isProfile, homeAnim, scanAnim, profileAnim]);

  useEffect(() => {
    if (tabCenters.length !== 3) return;
    const targetX = tabCenters[activeIndex] - bubbleSize / 2;
    Animated.timing(bubbleX, {
      toValue: targetX,
      duration: 280,
      useNativeDriver: true,
    }).start();
  }, [activeIndex, bubbleX, tabCenters]);

  const handleTabLayout = (index: number, x: number, width: number) => {
    setTabCenters((previous) => {
      const next = [...previous];
      next[index] = x + width / 2;
      return next;
    });
  };

  const tabAnimatedStyle = (anim: Animated.Value) => ({
    transform: [
      {
        translateY: anim.interpolate({
          inputRange: [0, 1],
          outputRange: [0, -26],
        }),
      },
      {
        scale: anim.interpolate({
          inputRange: [0, 1],
          outputRange: [1, 1.05],
        }),
      },
    ],
  });

  const iconAnimatedStyle = (anim: Animated.Value) => ({
    transform: [
      {
        scale: anim.interpolate({
          inputRange: [0, 1],
          outputRange: [1, 1.05],
        }),
      },
    ],
  });

  const labelAnimatedStyle = (anim: Animated.Value) => ({
    opacity: anim,
    transform: [
      {
        translateY: anim.interpolate({
          inputRange: [0, 1],
          outputRange: [6, 0],
        }),
      },
    ],
  });

  return (
    <View style={[styles.bottomNavShell, { paddingBottom: insets.bottom + 6 }]}> 
      {tabCenters.length === 3 && (
        <Animated.View
          pointerEvents="none"
          style={[
            styles.activeBubble,
            {
              transform: [{ translateX: bubbleX }],
            },
          ]}
        />
      )}

      <LinearGradient
        colors={['#002A7A', '#1565C0']}
        start={{ x: 0, y: 1 }}
        end={{ x: 0, y: 0 }}
        style={styles.bottomNav}
      >
        <Pressable
          style={styles.bottomNavItem}
          onPress={() => router.replace('/user/home')}
          onLayout={(event) => {
            const { x, width } = event.nativeEvent.layout;
            handleTabLayout(0, x, width);
          }}
        >
          <Animated.View style={[styles.tabContent, tabAnimatedStyle(homeAnim)]}>
            <Animated.View style={iconAnimatedStyle(homeAnim)}>
              <Ionicons name={isHome ? "home" : "home-outline"} size={28} color="#ffffff" />
            </Animated.View>
            <Animated.Text style={[styles.bottomNavTextActive, labelAnimatedStyle(homeAnim)]}>Home</Animated.Text>
          </Animated.View>
        </Pressable>

        <Pressable
          style={styles.bottomNavItem}
          onPress={() => router.replace('/user/scan_qr')}
          onLayout={(event) => {
            const { x, width } = event.nativeEvent.layout;
            handleTabLayout(1, x, width);
          }}
        >
          <Animated.View style={[styles.tabContent, tabAnimatedStyle(scanAnim)]}>
            <Animated.View style={iconAnimatedStyle(scanAnim)}>
              <Ionicons name={isScan ? "qr-code" : "qr-code-outline"} size={28} color="#ffffff" />
            </Animated.View>
            <Animated.Text style={[styles.bottomNavTextActive, labelAnimatedStyle(scanAnim)]}>Scan</Animated.Text>
          </Animated.View>
        </Pressable>

        <Pressable
          style={styles.bottomNavItem}
          onPress={() => router.replace('/user/profile')}
          onLayout={(event) => {
            const { x, width } = event.nativeEvent.layout;
            handleTabLayout(2, x, width);
          }}
        >
          <Animated.View style={[styles.tabContent, tabAnimatedStyle(profileAnim)]}>
            <Animated.View style={iconAnimatedStyle(profileAnim)}>
              <Ionicons name={isProfile ? "person" : "person-outline"} size={28} color="#ffffff" />
            </Animated.View>
            <Animated.Text style={[styles.bottomNavTextActive, labelAnimatedStyle(profileAnim)]}>Profile</Animated.Text>
          </Animated.View>
        </Pressable>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  bottomNavShell: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#ffffff',
    zIndex: 30,
  },
  bottomNav: {
    height: 73,
    marginTop: -30,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-evenly',
    paddingBottom: 2,
    paddingTop: 10,
    zIndex: 2,
  },
  bottomNavItem: {
    width: 96,
    height: 70,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  tabContent: {
    width: 94,
    height: 94,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    paddingTop: 14,
  },
  activeBubble: {
    position: 'absolute',
    width: 78,
    height: 78,
    borderRadius: 44,
    backgroundColor: '#1565C0',
    top: -52,
    left: 0,

    zIndex: 1,
  },
  bottomNavTextActive: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
    marginTop: 5,
  },
});
