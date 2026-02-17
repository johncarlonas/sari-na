import React from 'react';
import { View, Pressable, Image, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

export default function Navbar() {
  const router = useRouter();
  const segments = useSegments();
  const isProfile = segments.length && segments[segments.length - 1] === 'profile';

  return (
    <>
      <StatusBar style="light" backgroundColor="#002A7A" />
      <View style={styles.navbar} pointerEvents="box-none">
        <View style={styles.sideSlot}>
          <Pressable
            onPress={() => router.back()}
            style={[styles.sideButton, isProfile ? {} : { opacity: 0 }]}
            pointerEvents={isProfile ? 'auto' : 'none'}
          >
            <Ionicons name="chevron-back" size={32} color="#fff" />
          </Pressable>
        </View>

        <View style={styles.centerSlot}>
          <Image source={require('../../assets/images/sarina_logo.png')} style={styles.navbarLogo} resizeMode="contain" />
        </View>

        <View style={styles.sideSlot}>
          <Pressable
            onPress={() => router.push('/user/profile')}
            style={[styles.profileButton, isProfile ? { opacity: 0 } : {}]}
            pointerEvents={isProfile ? 'none' : 'auto'}
          >
            <Ionicons name="person-circle" size={32} color="#fff" />
          </Pressable>
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
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.04)',
    elevation: 6,
  },
  sideSlot: { width: 30, alignItems: 'center', justifyContent: 'center' },
  centerSlot: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  navbarLogo: { width: 150, height: 48 },
  sideButton: {
    width: 52,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileButton: {
    width: 55,
    height: 55,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
});