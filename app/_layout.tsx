import { Stack, usePathname } from "expo-router";
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { View } from 'react-native';
import Navbar from './components/Navbar';
import BottomNav from './components/BottomNav';

export default function RootLayout() {
  const pathname = usePathname();
  const showAppChrome = pathname.startsWith('/user/');

  return (
    <SafeAreaProvider>
      <View style={{ flex: 1 }}>
        {showAppChrome && <Navbar />}

        <Stack 
          screenOptions={{ 
            headerShown: false, 
            animation: 'slide_from_right',
            animationDuration: 10,
            contentStyle: { backgroundColor: '#000' },
          }}
        >
          <Stack.Screen name="login_signup" options={{ animation: 'slide_from_right' }} />
          <Stack.Screen name="user/home" options={{ animation: 'slide_from_left' }} />
          <Stack.Screen name="user/scan_qr" options={{ animation: 'slide_from_right' }} />
          <Stack.Screen name="user/profile" options={{ animation: 'slide_from_right' }} />
        </Stack>

        {showAppChrome && <BottomNav />}
      </View>
    </SafeAreaProvider>
  );
}
