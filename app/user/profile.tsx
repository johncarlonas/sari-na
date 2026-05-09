import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, View, Text, StyleSheet, Pressable, TextInput, Modal, ScrollView, Animated, Easing, Keyboard, BackHandler, Linking } from 'react-native';
// @ts-ignore: no types available locally
import MaskedView from '@react-native-masked-view/masked-view';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, MaterialIcons, MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { getDisplayName, setDisplayName, resetAppData } from '@/services/localUserService';

export default function Profile() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [displayName, setDisplayNameState] = useState('');
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [isAboutModalVisible, setIsAboutModalVisible] = useState(false);
  const [isReportModalVisible, setIsReportModalVisible] = useState(false);
  const [isResetModalVisible, setIsResetModalVisible] = useState(false);
  const [isUpdatingName, setIsUpdatingName] = useState(false);
  const [isSendingReport, setIsSendingReport] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [showToast, setShowToast] = useState(false);
  const [editError, setEditError] = useState('');
  const [reportError, setReportError] = useState('');
  const [reportTitle, setReportTitle] = useState('');
  const [reportDescription, setReportDescription] = useState('');
  const [tempName, setTempName] = useState('');

  // animation values for menu item entrance
  const menuAnims = useRef<Animated.Value[]>([]);
  if (menuAnims.current.length === 0) {
    menuAnims.current = Array(4)
      .fill(null)
      .map(() => new Animated.Value(0));
  }

  useEffect(() => {
    if (!showToast) return;
    const timer = setTimeout(() => {
      setShowToast(false);
      setToastMessage('');
    }, 2000);

    return () => clearTimeout(timer);
  }, [showToast]);

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

  const handleOpenEditModal = () => {
    setTempName(displayName);
    setEditError('');
    setIsEditModalVisible(true);
  };

  const handleSaveName = async () => {
    const name = tempName.trim();

    if (!name) {
      setEditError('Display name is required');
      return;
    }

    setIsUpdatingName(true);
    setEditError('');
    try {
      await setDisplayName(name);
      setDisplayNameState(name);
      setIsEditModalVisible(false);
      setToastMessage('Profile updated');
      setShowToast(true);
    } catch (error: any) {
      setEditError('Failed to update profile');
    } finally {
      setIsUpdatingName(false);
    }
  };

  const handleOpenReportModal = () => {
    setReportError('');
    setReportTitle('');
    setReportDescription('');
    setIsReportModalVisible(true);
  };

  const handleSendReport = async () => {
    const title = reportTitle.trim();
    const description = reportDescription.trim();

    if (!title || !description) {
      setReportError('Title and description are required');
      return;
    }

    setIsSendingReport(true);
    setReportError('');
    try {
      await new Promise((resolve) => setTimeout(resolve, 1100));
      setIsReportModalVisible(false);
      setReportTitle('');
      setReportDescription('');
      setToastMessage('Report sent!');
      setShowToast(true);
    } finally {
      setIsSendingReport(false);
    }
  };

  const handleSupportDevs = async () => {
    const supportUrl = 'https://buymeacoffee.com/sarinapp';
    const canOpen = await Linking.canOpenURL(supportUrl);
    if (canOpen) {
      await Linking.openURL(supportUrl);
      return;
    }

    setToastMessage('Support link unavailable');
    setShowToast(true);
  };

  const handleResetAppData = async () => {
    setIsResetModalVisible(false);
    await resetAppData();
    try {
      (global as any).currentCheckpoint = null;
      (global as any).currentLocation = null;
    } catch {}
    router.replace('/onboarding');
  };

  useFocusEffect(
    React.useCallback(() => {
      let mounted = true;

      const loadProfile = async () => {
        try {
          const name = await getDisplayName();
          if (!mounted) return;
          setDisplayNameState(name ?? '');
        } catch {
          if (!mounted) return;
          setDisplayNameState('');
        }
      };

      loadProfile();

      const onBackPress = () => {
        if (isEditModalVisible) {
          setIsEditModalVisible(false);
          return true;
        }

        if (isAboutModalVisible) {
          setIsAboutModalVisible(false);
          return true;
        }

        if (isReportModalVisible) {
          setIsReportModalVisible(false);
          return true;
        }

        if (isResetModalVisible) {
          setIsResetModalVisible(false);
          return true;
        }
        router.replace('/user/home');
        return true;
      };
      const sub = BackHandler.addEventListener('hardwareBackPress', onBackPress);
      return () => {
        mounted = false;
        sub.remove();
      };
    }, [isAboutModalVisible, isEditModalVisible, isResetModalVisible, isReportModalVisible, router])
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
                <Ionicons name="person" size={32} color="#002A7A" />
              </View>
            </LinearGradient>
            <View style={styles.profileTextWrap}>
              <Text style={styles.userName}>{(displayName || 'USER').toUpperCase()}</Text>
              <Text style={styles.userRole}>CAMPUS NAVIGATOR</Text>
            </View>
        </View>

          <Pressable onPress={() => setIsAboutModalVisible(true)} style={({pressed})=>[{opacity: pressed?0.6:1}] }>
            <Animated.View style={[styles.menuCard, {
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

          <Pressable onPress={handleOpenEditModal} style={({pressed})=>[{opacity: pressed?0.6:1}] }>
            <Animated.View style={[styles.menuCard, {
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
              <Text style={styles.menuText}>Edit Name</Text>
              <Feather name="chevron-right" size={22} color="#9ab0d6" style={styles.menuChevron} />
            </Animated.View>
          </Pressable>

          <Pressable onPress={handleSupportDevs} style={({pressed})=>[{opacity: pressed?0.6:1}] }>
            <Animated.View style={[styles.menuCard, {
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
              <LinearGradient colors={['#F59E0B', '#D97706']} style={styles.menuIconBox}>
                <Feather name="heart" size={22} color="#fff" />
              </LinearGradient>
              <Text style={styles.menuText}>Support Devs</Text>
              <Feather name="chevron-right" size={22} color="#9ab0d6" style={styles.menuChevron} />
            </Animated.View>
          </Pressable>

          <Pressable onPress={handleOpenReportModal} style={({pressed})=>[{opacity: pressed?0.6:1}] }>
            <Animated.View style={[styles.menuCard, {
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
              <LinearGradient colors={['#10B981', '#059669']} style={styles.menuIconBox}>
                <MaterialCommunityIcons name="alert-circle-outline" size={24} color="#fff" />
              </LinearGradient>
              <Text style={styles.menuText}>Report Issue</Text>
              <Feather name="chevron-right" size={22} color="#9ab0d6" style={styles.menuChevron} />
            </Animated.View>
          </Pressable>

          <Pressable style={[styles.resetButton, {marginBottom: 10}]} onPress={() => setIsResetModalVisible(true)}>
            <LinearGradient
                  colors={["#D62828", "#9E1B1B"]}
                  style={styles.resetGradient}
            >
                   <Text style={styles.resetText}>Reset App Data</Text>
            </LinearGradient>
          </Pressable>
      </ScrollView>

      <Modal
        visible={isEditModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setIsEditModalVisible(false)}
      >
        <Pressable style={styles.modalBackdrop} onPress={() => setIsEditModalVisible(false)}>
          <View style={[styles.modalCard, styles.actionModalCard]} pointerEvents="box-none">
            <Text style={styles.modalTitleCentered}>Edit Name</Text>

            <Text style={styles.modalFieldLabel}>Display Name</Text>
            <TextInput
              style={styles.modalInput}
              value={tempName}
              onChangeText={setTempName}
              placeholder="Enter your name"
              placeholderTextColor="#7D95C7"
            />

            {!!editError && <Text style={styles.editErrorText}>{editError}</Text>}

            <View style={styles.editActionRow}>
              <LinearGradient
                colors={["#1565C0", "#002A7A"]}
                style={styles.modalCancelWrapper}
              >
                <Pressable
                  style={styles.modalCancelButton}
                  onPress={() => setIsEditModalVisible(false)}
                >
                  <Text style={styles.modalCancelText}>Cancel</Text>
                </Pressable>
              </LinearGradient>

              <Pressable style={styles.editUpdateButton} onPress={handleSaveName} disabled={isUpdatingName}>
                <LinearGradient
                  colors={["#1565C0", "#002A7A"]}
                  style={styles.editUpdateGradient}
                >
                  {isUpdatingName ? (
                    <ActivityIndicator size="small" color="#ffffff" />
                  ) : (
                    <Text style={styles.editUpdateText}>Update</Text>
                  )}
                </LinearGradient>
              </Pressable>
            </View>
          </View>
        </Pressable>
      </Modal>

      <Modal
        visible={isReportModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setIsReportModalVisible(false)}
      >
        <Pressable style={styles.modalBackdrop} onPress={() => setIsReportModalVisible(false)}>
          <View style={[styles.modalCard, styles.actionModalCard]} pointerEvents="box-none">
            <Text style={styles.modalTitleCentered}>Report Issue</Text>

            <Text style={styles.modalFieldLabel}>What to report</Text>
            <TextInput
              style={styles.modalInput}
              value={reportTitle}
              onChangeText={setReportTitle}
              placeholder="Issue title"
              placeholderTextColor="#7D95C7"
            />

            <Text style={styles.modalFieldLabel}>Description</Text>
            <TextInput
              style={[styles.modalInput, styles.reportDescriptionInput]}
              value={reportDescription}
              onChangeText={setReportDescription}
              placeholder="Describe the issue in detail"
              placeholderTextColor="#7D95C7"
              multiline
              textAlignVertical="top"
            />

            {!!reportError && <Text style={styles.editErrorText}>{reportError}</Text>}

            <View style={styles.editActionRow}>
              <LinearGradient
                colors={["#1565C0", "#002A7A"]}
                style={styles.modalCancelWrapper}
              >
                <Pressable
                  style={styles.modalCancelButton}
                  onPress={() => setIsReportModalVisible(false)}
                >
                  <Text style={styles.modalCancelText}>Cancel</Text>
                </Pressable>
              </LinearGradient>

              <Pressable style={styles.editUpdateButton} onPress={handleSendReport} disabled={isSendingReport}>
                <LinearGradient
                  colors={["#1565C0", "#002A7A"]}
                  style={styles.editUpdateGradient}
                >
                  {isSendingReport ? (
                    <ActivityIndicator size="small" color="#ffffff" />
                  ) : (
                    <Text style={styles.editUpdateText}>Send</Text>
                  )}
                </LinearGradient>
              </Pressable>
            </View>
          </View>
        </Pressable>
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
        visible={isResetModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setIsResetModalVisible(false)}
      >
        <Pressable style={styles.modalBackdrop} onPress={() => setIsResetModalVisible(false)}>
          <View style={[styles.modalCard, styles.actionModalCard]} pointerEvents="box-none">
            <Text style={styles.modalTitleCentered}>Reset App Data</Text>
            <Text style={styles.modalTextCentered}>This will erase your name and history. Are you sure?</Text>

            <View style={styles.resetActionRow}>
              <LinearGradient
                colors={["#1565C0", "#002A7A"]}
                style={styles.modalCancelWrapper}
              >
                <Pressable
                  style={styles.modalCancelButton}
                  onPress={() => setIsResetModalVisible(false)}
                >
                  <Text style={styles.modalCancelText}>Cancel</Text>
                </Pressable>
              </LinearGradient>

              <Pressable style={styles.resetConfirmButton} onPress={handleResetAppData}>
                <LinearGradient
                  colors={["#D62828", "#9E1B1B"]}
                  style={styles.resetConfirmGradient}
                >
                  <Text style={styles.resetConfirmText}>Reset</Text>
                </LinearGradient>
              </Pressable>
            </View>
          </View>
        </Pressable>
      </Modal>

      {showToast && !!toastMessage && (
        <View style={styles.toastContainer} pointerEvents="none">
          <Text style={styles.toastText}>{toastMessage}</Text>
        </View>
      )}
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
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    marginLeft: -15,
    marginRight: -15,
    gap: 15,
  },
  profileTextWrap: {
    flex: 1,
    justifyContent: 'center',
  },
  userRole: {
    fontSize: 12,
    fontWeight: '700',
    color: '#6b84b7',
    marginTop: 2,
    letterSpacing: 1,
  },

  avatarOuter: {
    width: 70,
    height: 70,
    borderRadius: 35,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  maskedContainer: {
    width: 60,
    height: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 28,
    fontWeight: '700',
    color: '#002A7A',
    textAlign: 'center',
    textAlignVertical: 'center',
    lineHeight: 60, 
    alignSelf: 'center',
  },
  userName: {
    fontSize: 20,
    fontWeight: '900',
    color: '#002A7A',
    letterSpacing: 0.5,
    textAlign: 'left',
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
  resetButton: {
    marginTop: 15,
    borderRadius: 27,
    height: 52,
    shadowColor: "#D62828",
    shadowOpacity: 0.35,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
    overflow: "hidden",
  },
  resetText: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '800',
  },
  resetGradient: {
    flex: 1,
    borderRadius: 27,
    alignItems: "center",
    justifyContent: "center",
  },
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
  actionModalCard: {
    paddingBottom: 20,
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
  resetActionRow: {
    flexDirection: 'row',
    gap: 10,
  },
  modalCancelWrapper: {
    flex: 1,
    borderRadius: 30,
    padding: 3,
  },
  modalCancelButton: {
    height: 44,
    borderRadius: 30,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCancelText: {
    color: '#113e94',
    fontSize: 17,
    fontWeight: '800',
  },
  resetConfirmButton: {
    flex: 1,
    height: 50,
    borderRadius: 30,
    overflow: 'hidden',
  },
  resetConfirmGradient: {
    flex: 1,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resetConfirmText: {
    color: '#ffffff',
    fontSize: 17,
    fontWeight: '800',
  },
  modalInput: {
    height: 50,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#cfdaf0',
    backgroundColor: '#ffffff',
    paddingHorizontal: 14,
    fontSize: 15,
    marginBottom: 12,
    color: '#002A7A',
  },
  reportDescriptionInput: {
    height: 120,
    paddingTop: 12,
  },
  modalFieldLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#002A7A',
    marginBottom: 4,
    marginTop: 10,
  },
  editActionRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  editUpdateButton: {
    flex: 1,
    height: 50,
    borderRadius: 30,
    overflow: 'hidden',
  },
  editUpdateGradient: {
    flex: 1,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editUpdateText: {
    color: '#ffffff',
    fontSize: 17,
    fontWeight: '800',
  },
  editErrorText: {
    color: '#D62828',
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 10,
  },
  toastContainer: {
    position: 'absolute',
    left: 70,
    right: 70,
    top: 120,
    backgroundColor: 'rgba(17, 62, 148, 0.95)',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    alignItems: 'center',
    zIndex: 999,
    elevation: 20,
  },
  toastText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  aboutText: {
    fontSize: 14,
    lineHeight: 22,
    color: '#333',
  },
  aboutCenter: {
    textAlign: 'center',
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