import Colors from '@/constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter, useSegments } from 'expo-router';
import { TouchableOpacity } from 'react-native';
import { SQLiteProvider, useSQLiteContext } from 'expo-sqlite';
import { migrateDbIfNeeded, getChats } from '@/utils/Database';
import { RevenueCatProvider } from '@/providers/RevenueCat';
import { useEffect } from 'react';
import { useAuth } from '@clerk/clerk-expo';

const AuthenticatedLayout = () => {
  const router = useRouter();
  const segments = useSegments();
  const db = useSQLiteContext();
  const { isSignedIn } = useAuth();

  useEffect(() => {
    const redirectToLatestChat = async () => {
      const currentSegment = segments[segments.length - 1];
      const inDrawer = segments.includes('(drawer)');
      const isAtRoot = segments.length === 1 || currentSegment === '(auth)';

      if (isSignedIn && (isAtRoot || !inDrawer)) {
        const chats = await getChats(db);
        const latestChat = chats?.[0];

        if (latestChat) {
          router.replace(`/(auth)/(drawer)/(chat)/${latestChat.id}`);
        } else {
          router.replace('/(auth)/(drawer)/(chat)/new');
        }
      }
    };

    redirectToLatestChat();
  }, [isSignedIn, segments]);

  return (
    <Stack
      screenOptions={{
        contentStyle: { backgroundColor: Colors.selected },
      }}
    >
      <Stack.Screen name="(drawer)" options={{ headerShown: false }} />
      <Stack.Screen
        name="(modal)/settings"
        options={{
          headerTitle: 'Settings',
          presentation: 'modal',
          headerShadowVisible: false,
          headerStyle: { backgroundColor: Colors.selected },
          headerRight: () => (
            <TouchableOpacity
              onPress={() => router.replace('/(auth)/(drawer)/(chat)/new')}
              style={{ backgroundColor: Colors.greyLight, borderRadius: 20, padding: 4 }}
            >
              <Ionicons name="close-outline" size={16} color={Colors.grey} />
            </TouchableOpacity>
          ),
        }}
      />
      <Stack.Screen
        name="(modal)/image/[url]"
        options={{
          headerTitle: '',
          presentation: 'fullScreenModal',
          headerBlurEffect: 'dark',
          headerStyle: { backgroundColor: 'rgba(0,0,0,0.4)' },
          headerTransparent: true,
          headerShadowVisible: false,
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()} style={{ borderRadius: 20, padding: 4 }}>
              <Ionicons name="close-outline" size={28} color={'#fff'} />
            </TouchableOpacity>
          ),
        }}
      />
      <Stack.Screen
        name="(modal)/purchase"
        options={{
          headerTitle: '',
          presentation: 'fullScreenModal',
          headerShadowVisible: false,
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()} style={{ borderRadius: 20, padding: 4 }}>
              <Ionicons name="close-outline" size={28} color={Colors.greyLight} />
            </TouchableOpacity>
          ),
        }}
      />
    </Stack>
  );
};

const Layout = () => {
  return (
    <RevenueCatProvider>
      <SQLiteProvider databaseName="chat.db" onInit={migrateDbIfNeeded}>
        <AuthenticatedLayout />
      </SQLiteProvider>
    </RevenueCatProvider>
  );
};

export default Layout;
