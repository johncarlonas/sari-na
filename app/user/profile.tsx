import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, TextInput, Modal, ScrollView, Animated, Easing } from 'react-native';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, MaterialIcons, MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

export default function Profile() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [userName, setUserName] = useState('Riezah Mae Thrisia Encisa');
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  // editing pieces
  const [tempFirst, setTempFirst] = useState('');
  const [tempLast, setTempLast] = useState('');

  // animation values for menu item entrance
  const menuAnims = useRef<Animated.Value[]>([]);
  if (menuAnims.current.length === 0) {
    menuAnims.current = Array(4)
      .fill(null)
      .map(() => new Animated.Value(0));
  }

  useFocusEffect(
    React.useCallback(() => {
      // reset and run animation on focus
      menuAnims.current.forEach(anim => anim.setValue(0));
      const animations = menuAnims.current.map((anim, i) =>
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

  const getInitials = (name: string) => {
    const parts = name.trim().split(' ').filter(Boolean);
    if (parts.length === 0) return '';
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    const first = parts[0].charAt(0);
    const last = parts[parts.length - 1].charAt(0);
    return (first + last).toUpperCase();
  };

  const toTitleCase = (s: string) =>
    s
      .toLowerCase()
      .split(' ')
      .map((w) => (w.length ? w[0].toUpperCase() + w.slice(1) : w))
      .join(' ');

  const handleSaveName = () => {
    // combine first and last, trim each, ignore empty
    const first = tempFirst.trim();
    const last = tempLast.trim();
    let combined = '';
    if (first && last) combined = `${first} ${last}`;
    else combined = first || last;
    setUserName(combined);
    setIsEditModalVisible(false);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.profileCard}>
            <View style={styles.avatarInner}>
              <Text style={styles.avatarText}>{getInitials(userName)}</Text>
            </View>
            <Text style={styles.userName}>{userName.toUpperCase()}</Text>
        </View>

        <View style={styles.menuContainer}>
          <Animated.View style={[styles.menuCard, styles.menuAnim, {
            opacity: menuAnims.current[0],
            transform: [{
              translateY: menuAnims.current[0].interpolate({
                inputRange: [0, 1],
                outputRange: [20, 0],
              }),
            }],
          }]}
          >
            <LinearGradient colors={['#1E88E5', '#1565C0']} style={styles.menuIconBox}>
              <MaterialIcons name="info-outline" size={24} color="#fff" />
            </LinearGradient>
            <Text style={styles.menuText}>About</Text>
            <Feather name="chevron-right" size={22} color="#9ab0d6" style={styles.menuChevron} />
          </Animated.View>

          <Animated.View style={[styles.menuCard, styles.menuAnim, {
            opacity: menuAnims.current[1],
            transform: [{
              translateY: menuAnims.current[1].interpolate({
                inputRange: [0, 1],
                outputRange: [20, 0],
              }),
            }],
          }]}
            >
            <LinearGradient colors={['#8B5CF6', '#6D28D9']} style={styles.menuIconBox}>
              <MaterialCommunityIcons name="square-edit-outline" size={24} color="#fff" />
            </LinearGradient>
            <Text style={styles.menuText}>Edit Profile</Text>
            <Feather name="chevron-right" size={22} color="#9ab0d6" style={styles.menuChevron} />
          </Animated.View>

          <Animated.View style={[styles.menuCard, styles.menuAnim, {
            opacity: menuAnims.current[2],
            transform: [{
              translateY: menuAnims.current[2].interpolate({
                inputRange: [0, 1],
                outputRange: [20, 0],
              }),
            }],
          }]}
          >
            <LinearGradient colors={['#10B981', '#059669']} style={styles.menuIconBox}>
              <Feather name="key" size={22} color="#fff" />
            </LinearGradient>
            <Text style={styles.menuText}>Change Password</Text>
            <Feather name="chevron-right" size={22} color="#9ab0d6" style={styles.menuChevron} />
          </Animated.View>

          <Animated.View style={[styles.menuCard, styles.menuAnim, {
            opacity: menuAnims.current[3],
            transform: [{
              translateY: menuAnims.current[3].interpolate({
                inputRange: [0, 1],
                outputRange: [20, 0],
              }),
            }],
          }]}
          >
            <LinearGradient colors={['#F59E0B', '#D97706']} style={styles.menuIconBox}>
              <Feather name="coffee" size={22} color="#fff" />
            </LinearGradient>
            <Text style={styles.menuText}>Buy us a Coffee</Text>
            <Feather name="chevron-right" size={22} color="#9ab0d6" style={styles.menuChevron} />
          </Animated.View>

          <Pressable style={styles.logoutButton} onPress={() => router.replace('/login_signup')}>
            <LinearGradient
                  colors={["#002A7A", "#1565C0"]}
                  start={{ x: 0, y: 0.5 }}
                  end={{ x: 1, y: 0.5 }}
                  style={styles.logoutGradient}
            >
                   <Text style={styles.logoutText}>Logout</Text>
            </LinearGradient>
          </Pressable>
        </View>
      </ScrollView>

      <Modal
        visible={isEditModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsEditModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Edit Name</Text>
            <Text style={styles.modalFieldLabel}>First Name</Text>
            <TextInput
              style={styles.modalInput}
              value={tempFirst}
              onChangeText={setTempFirst}
              placeholder="First"
              placeholderTextColor="#999"
            />
            <Text style={styles.modalFieldLabel}>Last Name</Text>
            <TextInput
              style={styles.modalInput}
              value={tempLast}
              onChangeText={setTempLast}
              placeholder="Last"
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
  safeArea: {
    flex: 1,
    backgroundColor: '#edf2f8',
  },
  content: {
    paddingTop: 90,
    paddingHorizontal: 14,
    marginLeft: 0,
    marginRight: 0,
  },
  profileCard: {
    backgroundColor: 'none',
    paddingVertical: 0,
    paddingHorizontal: 20,
    flexDirection: 'column',
    alignItems: 'center',
    marginBottom: 15,
  },

  avatarInner: {
    width: 80,
    height: 80,
    borderRadius: 50,
    backgroundColor: '#1565C0',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 15,
  },
  avatarText: {
    fontSize: 30,
    fontWeight: '700',
    color: '#ffffff',
  },
  userName: {
    fontSize: 21,
    fontWeight: '900',
    color: '#00328f',
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  menuContainer: {
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 22,
    paddingTop: 26,
    paddingBottom: 50,
    marginTop: 2,
    gap: 10,
    marginLeft: -24,
    marginRight: -24,
    marginBottom: -20,
  },
  menuAnim: {
    // placeholder for Animated.View wrapper
  },
  menuCard: {
    backgroundColor: '#f7f9fd',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#cfdaef',
    paddingHorizontal: 16,
    minHeight: 78,
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuIconBox: {
    width: 44,
    height: 44,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  menuText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#00328f',
  },
  menuChevron: {
    marginLeft: 'auto',
  },
  logoutButton: {
    marginTop: 15,
    borderRadius: 27,
    height: 52,
    shadowColor: "#1E88E5",
    shadowOpacity: 0.35,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
    overflow: "hidden",
  },
  logoutText: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '800',
  },
  logoutGradient: {
    flex: 1,
    borderRadius: 27,
    alignItems: "center",
    justifyContent: "center",
  },
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
    textTransform: 'uppercase',
  },
  modalFieldLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#002A7A',
    marginBottom: 4,
    marginTop: 10,
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