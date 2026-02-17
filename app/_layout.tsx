import { Stack } from "expo-router";
import { SafeAreaProvider } from 'react-native-safe-area-context';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <Stack 
        screenOptions={{ 
          headerShown: false, 
          animation: 'slide_from_right',
          animationDuration: 300,
          contentStyle: { backgroundColor: '#000' },
        }}
      >
        <Stack.Screen name="user/home" options={{ animation: 'slide_from_left' }} />
        <Stack.Screen name="user/profile" options={{ animation: 'slide_from_right' }} />
      </Stack>
    </SafeAreaProvider>
  );
}
