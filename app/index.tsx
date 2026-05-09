import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { Redirect } from 'expo-router';
import { hasOnboarded } from '@/services/localUserService';

export default function Index() {
  const [targetPath, setTargetPath] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const bootstrap = async () => {
      const onboarded = await hasOnboarded();
      if (!mounted) return;
      setTargetPath(onboarded ? '/user/home' : '/onboarding');
    };

    bootstrap();

    return () => { mounted = false; };
  }, []);

  if (!targetPath) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#002A7A' }}>
        <ActivityIndicator size="large" color="#ffffff" />
      </View>
    );
  }

  return <Redirect href={targetPath as '/onboarding' | '/user/home'} />;
}
