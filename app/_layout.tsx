import { useEffect, useState } from 'react';
import { GestureHandlerRootView, TouchableOpacity } from 'react-native-gesture-handler';
import { ClerkProvider, useAuth } from '@clerk/clerk-expo';
import * as SplashScreen from 'expo-splash-screen';
import * as SecureStore from 'expo-secure-store';
import { useFonts } from 'expo-font';
import { Ionicons } from '@expo/vector-icons';
import { Slot, Stack, useRouter, useSegments } from 'expo-router';
import Constants from 'expo-constants';

const CLERK_PUBLISHABLE_KEY = Constants.expoConfig?.extra?.CLERK_PUBLISHABLE_KEY;

const tokenCache = {
  async getToken(key: string) {
    try {
      return SecureStore.getItemAsync(key);
    } catch {
      return null;
    }
  },
  async saveToken(key: string, value: string) {
    try {
      return SecureStore.setItemAsync(key, value);
    } catch {}
  },
};

const InitialLayout = () => {
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });
  const { isLoaded, isSignedIn } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (error) {
      console.error('Error loading fonts:', error);
      throw error;
    }
  }, [error]);

  useEffect(() => {
    console.log("Loaded:", loaded, "isLoaded:", isLoaded, "segments:", segments, "signedIn:", isSignedIn);
  }, [isLoaded, loaded, segments, isSignedIn]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  useEffect(() => {
    if (!isLoaded || !loaded) return;

    if (!segments || segments.length === 0) return;

    const inAuthGroup = segments[0]?.startsWith('(auth)');

    if (isSignedIn && !inAuthGroup) {
      requestAnimationFrame(() => {
        router.replace('/(auth)/(drawer)/(chat)/new');
      });
    } else if (!isSignedIn && inAuthGroup) {
      requestAnimationFrame(() => {
        router.replace('/');
      });
    }
  }, [isLoaded, loaded, isSignedIn, segments]);

  if (!loaded || !isLoaded) {
    return <Slot />;
  }

  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="login"
        options={{
          presentation: 'modal',
          title: '',
          headerTitleStyle: {
            fontFamily: 'mon-sb',
          },
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()}>
              <Ionicons name="close-outline" size={28} />
            </TouchableOpacity>
          ),
        }}
      />
      <Stack.Screen name="(auth)" options={{ headerShown: false }} />
    </Stack>
  );
};

export default function RootLayoutNav() {
  const [appReady, setAppReady] = useState(false);

  useEffect(() => {
    const prepare = async () => {
      await new Promise((res) => setTimeout(res, 4000));
      setAppReady(true);
    };
    prepare();
  }, []);

  if (!appReady) return null;

  return (
    <ClerkProvider publishableKey={CLERK_PUBLISHABLE_KEY!} tokenCache={tokenCache}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <InitialLayout />
      </GestureHandlerRootView>
    </ClerkProvider>
  );
}
