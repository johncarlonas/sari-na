import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { Redirect } from 'expo-router';
import { supabase } from '@/services/supabase';

export default function Index() {
  const [targetPath, setTargetPath] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const bootstrapRoute = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!mounted) return;
      setTargetPath(session ? '/user/home' : '/login_signup');
    };

    bootstrapRoute();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;
      setTargetPath(session ? '/user/home' : '/login_signup');
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  if (!targetPath) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#ffffff' }}>
        <ActivityIndicator size="large" color="#1565C0" />
      </View>
    );
  }

  return <Redirect href={targetPath as '/login_signup' | '/user/home'} />;
}
