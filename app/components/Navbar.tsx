import React from 'react';
import { View, Pressable, Image, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useSegments } from 'expo-router';
import { useNavigation } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';

export default function Navbar({ screen }: { screen?: 'home' | 'profile' }) {
  const router = useRouter();
  const navigation = useNavigation();
  const segments = useSegments();
  // determine which screen this Navbar instance should represent. If caller passes `screen`, respect it;
  // otherwise fall back to the current route segments.
  const isProfileScreen = screen === 'profile' || (!screen && segments.length && segments[segments.length - 1] === 'profile');
  const canGoBack = typeof navigation?.canGoBack === 'function' ? navigation.canGoBack() : false;
  const showBack = isProfileScreen && canGoBack; // only show back when Navbar is for the profile screen and there is navigation history

  return (
    <>
      <StatusBar style="light" backgroundColor="#002A7A" />
      <View style={styles.navbar} pointerEvents="box-none">
        {/* LEFT SLOT */}
        <View style={styles.sideSlot}>
          {showBack ? (
            <Pressable
             
                // avoid calling `navigation.goBack()` due to known react-native-screens goBack bug
                // use replace to return to home without popping native fragments
                onPress={() => router.push('/user/home')}
                
              style={styles.sideButton}
            >
              <Ionicons name="chevron-back" size={26} color="#fff" />
            </Pressable>
          ) : (
            <View style={styles.sideContainer} />
          )}
        </View>

        {/* CENTER */}
        <View style={styles.centerSlot}>
          <Image source={require('../../assets/images/sarina_logo.png')} style={styles.navbarLogo} resizeMode="contain" />
        </View>

        {/* RIGHT SLOT */}
        <View style={styles.sideSlot}>
          {!isProfileScreen ? (
            <Pressable
              onPress={() => router.push('/user/profile')}
              style={styles.profileButton}
            >
              <Ionicons name="person-circle" size={35} color="#fff" />
            </Pressable>
          ) : (
            <View style={styles.sideContainer} />
          )}
        </View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  navbar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: Platform.OS === 'android' ? 100 : 100,
    backgroundColor: '#002A7A',
    zIndex: 50,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'android' ? 30 : 30,
  },
  sideSlot: { width: 48, alignItems: 'center', justifyContent: 'center' },
  centerSlot: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  navbarLogo: { width: 150, height: 48 },
  sideButton: {
    width: 52,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sideContainer: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#002A7A',
  },
  profileButton: {
    width: 55,
    height: 55,
    alignItems: 'center',
    justifyContent: 'center',
  },
});