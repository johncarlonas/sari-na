import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Navbar from '../components/Navbar';

export default function Profile() {
  return (
    <SafeAreaView style={styles.container}>
      <Navbar screen="profile" />
      <View style={styles.content}>
        <Text style={styles.title}>Profile</Text>
        <Text style={styles.sub}>This is a placeholder profile screen.</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#002A7A' },
  content: { flex: 1, paddingTop: 140, alignItems: 'center' },
  title: { fontSize: 22, fontWeight: '700', color: '#fff' },
  sub: { marginTop: 8, color: '#ccc' },
});