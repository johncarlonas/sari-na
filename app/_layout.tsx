import React from "react";
import { Stack, usePathname } from "expo-router";
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { View } from 'react-native';
import Navbar from './components/Navbar';
import BottomNav from './components/BottomNav';

export default function RootLayout() {
  const pathname = usePathname();
  const prevPath = React.useRef(pathname);

  // keep ref up to date after render
  React.useEffect(() => {
    prevPath.current = pathname;
  }, [pathname]);

  // navbar appears on all /user screens
  const showNavbar = pathname.startsWith('/user/');
  const showBottomNav = pathname.startsWith('/user/') &&
    !pathname.startsWith('/user/home_search') &&
    !pathname.startsWith('/user/navigation') &&
    !pathname.startsWith('/user/arrival') &&
    !pathname.startsWith('/user/scan_qr');

  return (
    <SafeAreaProvider>
      <View style={{ flex: 1 }}>
        {showNavbar && <Navbar />}

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
          <Stack.Screen
            name="user/map_view"
            options={{
              animation:
                prevPath.current === '/user/profile'
                  ? 'slide_from_left'
                  : 'slide_from_right',
            }}
          />
          <Stack.Screen name="user/home_search" options={{ animation: 'fade', animationDuration: 300 }} />
          <Stack.Screen name="user/navigation" options={{ animation: 'none' }} />
          <Stack.Screen name="user/scan_qr" options={{ animation: 'slide_from_right' }} />
          <Stack.Screen name="user/arrival" options={{ animation: 'fade', animationDuration: 200 }} />
          <Stack.Screen name="user/profile" options={{ animation: 'slide_from_right' }} />
        </Stack>

        {showBottomNav && <BottomNav />}
      </View>
    </SafeAreaProvider>
  );
}
