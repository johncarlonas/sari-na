import { Stack } from "expo-router";
import { SafeAreaProvider } from 'react-native-safe-area-context';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <Stack>
        <Stack.Screen name="home" options={{headerShown: false}} />
        <Stack.Screen name="user/profile" options={{headerShown: false}} />
      </Stack>
    </SafeAreaProvider>
  );
}
