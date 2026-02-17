import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, TextInput, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import Navbar from '../components/Navbar';

export default function Profile() {
  const [userName, setUserName] = useState('JUAN DE LA CRUZ');
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [tempName, setTempName] = useState(userName);

  const handleSaveName = () => {
    // save the name exactly as typed (trimmed). Display will be uppercased on the profile.
    setUserName(tempName.trim());
    setIsEditModalVisible(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      <Navbar screen="profile" />
      <View style={styles.content}>
        {/* Profile Header */}
        <View style={styles.profileHeader}>
          <View style={styles.avatarCircle}>
            <Ionicons name="person-circle" size={120} color="#fff" />
          </View>
          <Text style={styles.userName}>{userName.toUpperCase()}</Text>
        </View>

        {/* Separator Line */}
        <View style={styles.separator} />

        {/* Menu Items */}
        <View style={styles.menuContainer}>
          <Pressable style={styles.menuItem}>
            <MaterialIcons name="info" size={30} color="#fff" />
            <Text style={styles.menuText}>About</Text>
          </Pressable>

          <Pressable style={styles.menuItem} onPress={() => {
            setTempName(userName);
            setIsEditModalVisible(true);
          }}>
            <MaterialCommunityIcons name="pencil" size={30} color="#fff" />
            <Text style={styles.menuText}>Edit Profile</Text>
          </Pressable>

          <Pressable style={styles.menuItem}>
            <Ionicons name="key" size={30} color="#fff" />
            <Text style={styles.menuText}>Change Password</Text>
          </Pressable>

          <Pressable style={styles.menuItem}>
            <Ionicons name="cafe" size={30} color="#fff" />
            <Text style={styles.menuText}>Buy us a Coffee</Text>
          </Pressable>
        </View>

        {/* Logout Button */}
        <View style={styles.logoutContainer}>
          <Pressable style={styles.logoutButton}>
            <Text style={styles.logoutText}>Logout</Text>
          </Pressable>
        </View>
      </View>

      {/* Edit Name Modal */}
      <Modal
        visible={isEditModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsEditModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Edit Name</Text>
            <TextInput
              style={styles.modalInput}
              value={tempName}
              onChangeText={(text) => setTempName(text)}
              placeholder="Enter your name"
              placeholderTextColor="#999"
            />
            <View style={styles.modalButtons}>
              <Pressable style={styles.modalButtonCancel} onPress={() => setIsEditModalVisible(false)}>
                <Text style={styles.modalButtonTextCancel}>Cancel</Text>
              </Pressable>
              <Pressable style={styles.modalButtonSave} onPress={handleSaveName}>
                <Text style={styles.modalButtonTextSave}>Save</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#002A7A' 
  },
  content: { 
    flex: 1, 
    paddingTop: 80,
    paddingHorizontal: 30,
  },
  profileHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  avatarCircle: {
    width: 120,
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  userName: {
    fontSize: 25,
    fontWeight: '900',
    color: '#fff',
    letterSpacing: 0.5,
  },
  separator: {
    height: 2,
    backgroundColor: '#fff',
    marginVertical: 10,
  },
  menuContainer: {
    flex: 1,
    marginTop: 10,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    gap: 20,
  },
  menuText: {
    fontSize: 18,
    fontWeight: '500',
    color: '#fff',
  },
  logoutContainer: {
    paddingBottom: 40,
  },
  logoutButton: {
    backgroundColor: '#fff',
    paddingVertical: 18,
    borderRadius: 50,
    alignItems: 'center',
  },
  logoutText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#002A7A',
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    width: '85%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#002A7A',
    marginBottom: 16,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 20,
    color: '#000',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButtonCancel: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
  },
  modalButtonTextCancel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  modalButtonSave: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#002A7A',
    alignItems: 'center',
  },
  modalButtonTextSave: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});