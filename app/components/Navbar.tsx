import React from 'react';
import { View, Image, StyleSheet, Platform } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';

export default function Navbar({ screen }: { screen?: 'home' | 'profile' | 'scan_qr' }) {
  return (
    <>
      <StatusBar style="light" backgroundColor="#1565C0" />
      <LinearGradient
        colors={['#002A7A', '#1565C0']}
        start={{ x: 1, y: 1 }}
        end={{ x: 0, y: 0 }}
        style={styles.navbar}
        pointerEvents="box-none"
      >
        <View style={styles.logoWrap}>
          <Image source={require('../../assets/images/sarina_logo.png')} style={styles.navbarLogo} resizeMode="contain" />
        </View>
      </LinearGradient>
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
    zIndex: 50,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'android' ? 30 : 30,
  },
  logoWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  navbarLogo: { width: 150, height: 48 },
});