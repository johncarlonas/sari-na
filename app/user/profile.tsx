import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, TextInput, Modal, ScrollView, Animated, Easing, Keyboard, BackHandler } from 'react-native';
// @ts-ignore: no types available locally
import MaskedView from '@react-native-masked-view/masked-view';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, MaterialIcons, MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

export default function Profile() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [userName, setUserName] = useState('John Renzzo Montenegro');
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [isAboutModalVisible, setIsAboutModalVisible] = useState(false);
  const [isLogoutModalVisible, setIsLogoutModalVisible] = useState(false);
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

  const handleLogout = () => {
    setIsLogoutModalVisible(false);
    try {
      (global as any).currentCheckpoint = null;
      (global as any).currentLocation = null;
    } catch {}
    router.replace('/login_signup');
  };

  useFocusEffect(
    React.useCallback(() => {
      const onBackPress = () => {
        if (isLogoutModalVisible) {
          setIsLogoutModalVisible(false);
          return true;
        }
        router.replace('/user/home');
        return true;
      };
      const sub = BackHandler.addEventListener('hardwareBackPress', onBackPress);
      return () => sub.remove();
    }, [isLogoutModalVisible, router])
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 90 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        onScrollBeginDrag={() => Keyboard.dismiss()}
      >
        <View style={styles.profileCard}>
            <LinearGradient
              colors={["#1565C0", "#002A7A"]}
              style={styles.avatarOuter}
            >
              <View style={styles.avatarInner}>
                <MaskedView
                  maskElement={<Text style={styles.avatarText}>{getInitials(userName)}</Text>}
                  style={styles.maskedContainer}
                >
                  <LinearGradient
                    colors={["#1565C0", "#002A7A"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.maskedContainer}
                  />
                </MaskedView>
              </View>
            </LinearGradient>
            <Text style={styles.userName}>{userName.toUpperCase()}</Text>
        </View>

          <Pressable onPress={() => setIsAboutModalVisible(true)} style={({pressed})=>[{opacity: pressed?0.6:1}] }>
            <Animated.View style={[styles.menuCard, styles.menuAnim, {
              opacity: menuAnims.current[0],
              transform: [{
                translateY: menuAnims.current[0].interpolate({
                  inputRange: [0, 1],
                  outputRange: [20, 0],
                }),
              }],
              marginBottom: 10,
            }]}
            >
              <LinearGradient colors={['#1E88E5', '#1565C0']} style={styles.menuIconBox}>
                <MaterialIcons name="info-outline" size={24} color="#fff" />
              </LinearGradient>
              <Text style={styles.menuText}>About</Text>
              <Feather name="chevron-right" size={22} color="#9ab0d6" style={styles.menuChevron} />
            </Animated.View>
          </Pressable>

          <Animated.View style={[styles.menuCard, styles.menuAnim, {
            opacity: menuAnims.current[1],
            transform: [{
              translateY: menuAnims.current[1].interpolate({
                inputRange: [0, 1],
                outputRange: [20, 0],
              }),
            }],
            marginBottom: 10,
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
            marginBottom: 10,
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
            marginBottom: 10,
          }]}
          >
            <LinearGradient colors={['#F59E0B', '#D97706']} style={styles.menuIconBox}>
              <Feather name="heart" size={22} color="#fff" />
            </LinearGradient>
            <Text style={styles.menuText}>Support Devs</Text>
            <Feather name="chevron-right" size={22} color="#9ab0d6" style={styles.menuChevron} />
          </Animated.View>

          <Pressable style={[styles.logoutButton, {marginBottom: 10}]} onPress={() => setIsLogoutModalVisible(true)}>
            <LinearGradient
                  colors={["#1565C0", "#002A7A"]}
                  // start={{ x: 0, y: 0 }}
                  // end={{ x: 1, y: 0.5 }}
                  style={styles.logoutGradient}
            >
                   <Text style={styles.logoutText}>Logout</Text>
            </LinearGradient>
          </Pressable>
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

      {/* about dialog */}
      <Modal
        visible={isAboutModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setIsAboutModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <Pressable style={styles.modalDismissArea} onPress={() => setIsAboutModalVisible(false)} />
          <View style={styles.modalCard}>
            <View style={styles.aboutHeader}>
              <Text style={styles.aboutTitle}>About SARI NA?</Text>
              <Pressable style={styles.aboutCloseButton} onPress={() => setIsAboutModalVisible(false)}>
                <Ionicons name="close" size={22} color="#002A7A" />
              </Pressable>
            </View>
            <ScrollView
              style={styles.aboutScroll}
              contentContainerStyle={styles.aboutScrollContent}
              showsVerticalScrollIndicator={false}
            >
              <Text style={[styles.aboutText, styles.aboutCenter]}>
                Version 2.0.0
              </Text>
              <Text style={[styles.aboutSubtitle, {marginTop:12}]}>The Intelligent Campus Navigation Ecosystem</Text>
              <Text style={[styles.aboutText, styles.aboutJustified, {marginTop:20}]}>
                SARI NA is a hybrid navigation solution engineered to solve the “indoor
                blind spot” inherent in traditional GPS. While satellite positioning
                works well across the CSPC campus, it lacks vertical accuracy and signal
                penetration inside multi‑story buildings. Version 2.0.0 bridges that gap
                by merging satellite tracking with high‑precision computer vision,
                delivering a seamless door‑to‑door experience for students, faculty, and
                visitors.
              </Text>
              <Text style={[styles.aboutText, {marginTop:16, fontWeight:'700'}]}>How to Use SARI NA</Text>
              <Text style={[styles.aboutText, styles.aboutJustified, {marginTop:8}]}>1. Scan the nearest QR code to determine your current location.</Text>
              <Text style={[styles.aboutText, styles.aboutJustified, {marginTop:4}]}>2. Search for the destination you want to reach.</Text>
              <Text style={[styles.aboutText, styles.aboutJustified, {marginTop:4}]}>3. Tap the result to view the campus map and building directions.</Text>
              <Text style={[styles.aboutText, styles.aboutJustified, {marginTop:4}]}>4. Follow the displayed route; scan intermediate QR checkpoints along the way.</Text>
              <Text style={[styles.aboutText, styles.aboutJustified, {marginTop:4}]}>5. Upon arrival, perform the final verification scan to complete navigation.{'\n'}</Text>
              <Text style={[styles.aboutFooter, {marginTop: 10}]}>“Precision Navigation, Inside and Out.”</Text>
            </ScrollView>
          </View>
        </View>
      </Modal>

      <Modal
        visible={isLogoutModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setIsLogoutModalVisible(false)}
      >
        <Pressable style={styles.modalBackdrop} onPress={() => setIsLogoutModalVisible(false)}>
          <View style={styles.modalCard} pointerEvents="box-none">
            <Text style={styles.modalTitleCentered}>Logout</Text>
            <Text style={styles.modalTextCentered}>Are you sure you want to log out?</Text>

            <View style={styles.logoutActionRow}>
              <LinearGradient
                colors={["#1565C0", "#002A7A"]}
                style={styles.logoutCancelWrapper}
              >
                <Pressable
                  style={styles.logoutCancelButton}
                  onPress={() => setIsLogoutModalVisible(false)}
                >
                  <Text style={styles.logoutCancelText}>Cancel</Text>
                </Pressable>
              </LinearGradient>

              <Pressable style={styles.logoutConfirmButton} onPress={handleLogout}>
                <LinearGradient
                  colors={["#1565C0", "#002A7A"]}
                  style={styles.logoutConfirmGradient}
                >
                  <Text style={styles.logoutConfirmText}>Logout</Text>
                </LinearGradient>
              </Pressable>
            </View>
          </View>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  content: {
    paddingTop: 70,
    paddingHorizontal: 14,
    marginLeft: 0,
    marginRight: 0,
  },
  profileCard: {
    backgroundColor: '#edf2f8',
    paddingVertical: 22,
    paddingHorizontal: 20,
    flexDirection: 'column',
    alignItems: 'center',
    marginBottom: 20,
    marginLeft: -15,
    marginRight: -15,
  },

  avatarOuter: {
    width: 100,
    height: 100,
    borderRadius: 54,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  avatarInner: {
    width: 85,
    height: 85,
    borderRadius: 45,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 0,
  },
  maskedContainer: {
    width: 85,
    height: 85,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 40,
    fontWeight: '700',
    color: '#002A7A',
    textAlign: 'center',
    textAlignVertical: 'center',
    lineHeight: 85, 

    alignSelf: 'center',
  },
  userName: {
    fontSize: 22,
    fontWeight: '900',
    color: '#002A7A',
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  menuAnim: {

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
    fontSize: 17,
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
  /* shared with navigation screen for guide/complete dialogs */
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(4, 17, 43, 0.44)',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  modalDismissArea: {
    ...StyleSheet.absoluteFillObject,
  },
  modalCard: {
    backgroundColor: '#f5f8fd',
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 8,
    maxHeight: '88%',
    zIndex: 1,
  },
  modalPrimary: {
    height: 50,
    borderRadius: 13,
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalPrimaryGradient: {
    flex: 1,
    borderRadius: 30,
    overflow: 'hidden',
    alignSelf: 'stretch',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalPrimaryText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#ffffff',
  },
  modalTitleCentered: {
    fontSize: 25,
    fontWeight: '900',
    color: '#002A7A',
    textAlign: 'center',
    marginBottom: 10,
  },
  modalTextCentered: {
    fontSize: 15,
    color: '#31538f',
    textAlign: 'center',
    marginBottom: 16,
  },
  logoutActionRow: {
    flexDirection: 'row',
    gap: 10,
  },
  logoutCancelWrapper: {
    flex: 1,
    borderRadius: 30,
    padding: 3,
  },
  logoutCancelButton: {
    height: 46,
    borderRadius: 30,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoutCancelText: {
    color: '#113e94',
    fontSize: 17,
    fontWeight: '800',
  },
  logoutConfirmButton: {
    flex: 1,
    height: 46,
    borderRadius: 30,
    overflow: 'hidden',
  },
  logoutConfirmGradient: {
    flex: 1,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoutConfirmText: {
    color: '#ffffff',
    fontSize: 17,
    fontWeight: '800',
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
  aboutText: {
    fontSize: 14,
    lineHeight: 22,
    color: '#333',
  },
  aboutCenter: {
    textAlign: 'center',
  },
  aboutItalic: {
    fontStyle: 'italic',
  },
  aboutFooter: {
    textAlign: 'center',
    fontWeight: '900',
    color: '#002A7A',
    fontSize: 16,
  },
  aboutTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#002A7A',
    marginBottom: 20,
    textAlign: 'center',
  },
  aboutHeader: {
    position: 'relative',
    justifyContent: 'center',
    marginBottom: 1,
  },
  aboutCloseButton: {
    position: 'absolute',
    right: 0,
    top: -2,
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  aboutSubtitle: {
    fontSize: 16,
    lineHeight: 22,
    color: '#333',
    textAlign: 'center',
    fontWeight: '600',
  },
  aboutJustified: {
    textAlign: 'justify',
  },
  aboutScroll: {
    maxHeight: '90%',
  },
  aboutScrollContent: {
    paddingBottom: 1,
  },
});