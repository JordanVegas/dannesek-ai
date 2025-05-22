import { Drawer } from 'expo-router/drawer';
import { DrawerContentScrollView } from '@react-navigation/drawer';
import { useNavigation, useRouter, Link, useSegments, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Image,
  Text,
  View,
  StyleSheet,
  TouchableOpacity,
  useWindowDimensions,
  TextInput,
  Alert,
  Keyboard,
  Modal,
} from 'react-native';
import Colors from '@/constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import { FontAwesome6 } from '@expo/vector-icons';
import { DrawerActions } from '@react-navigation/native';
import { useEffect, useState } from 'react';
import { getChats, renameChat } from '@/utils/Database';
import { useSQLiteContext } from 'expo-sqlite';
import { useDrawerStatus } from '@react-navigation/drawer';
import { Chat } from '@/utils/Interfaces';
import * as ContextMenu from 'zeego/context-menu';
import { useRevenueCat } from '@/providers/RevenueCat';
import { useClerk } from '@clerk/clerk-expo';
import { useNavigationState } from '@react-navigation/native';


export const CustomDrawerContent = (props: any) => {
  const { bottom, top } = useSafeAreaInsets();
  const db = useSQLiteContext();
  const isDrawerOpen = useDrawerStatus() === 'open';
  const [history, setHistory] = useState<Chat[]>([]);
  const [search, setSearch] = useState('');
  const [renameModalVisible, setRenameModalVisible] = useState(false);
  const [selectedChatId, setSelectedChatId] = useState<number | null>(null);
  const [newTitle, setNewTitle] = useState('');
  const router = useRouter();
  const { user: authUser } = useClerk();

const currentChatId = useNavigationState((state) => {
  const drawerRoute = state.routes.find(r => r.name === '(drawer)');
  if (!drawerRoute || !('state' in drawerRoute)) return null;

  const nestedState = drawerRoute.state;
  if (!nestedState || !('routes' in nestedState)) return null;

  const chatRoute = nestedState.routes.find(r => r.name === '(chat)/[id]');
  return chatRoute?.params?.id ?? null;
});

console.log(currentChatId);


  useEffect(() => {
    loadChats();
    Keyboard.dismiss();
  }, [isDrawerOpen]);

  const loadChats = async () => {
    const result = (await getChats(db)) as Chat[];
    setHistory(result);
  };

  const onDeleteChat = (chatId: number) => {
    Alert.alert('Delete Chat', 'Are you sure you want to delete this chat?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        onPress: async () => {
          await db.runAsync('DELETE FROM chats WHERE id = ?', chatId);
          loadChats();
        },
      },
    ]);
  };

  const onRenameChat = (chatId: number) => {
    setSelectedChatId(chatId);
    const chat = history.find((c) => c.id === chatId);
    setNewTitle(chat?.title || '');
    setRenameModalVisible(true);
  };

  const filteredHistory = history.filter(chat =>
    chat.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <View style={{ flex: 1, marginTop: top }}>
      <View style={{ backgroundColor: '#fff', paddingBottom: 10 }}>
        <View style={styles.searchSection}>
          <Ionicons style={styles.searchIcon} name="search" size={20} color={Colors.greyLight} />
          <TextInput
            style={styles.input}
            placeholder="Search"
            value={search}
            onChangeText={setSearch}
            underlineColorAndroid="transparent"
          />
        </View>
        <TouchableOpacity onPress={() => router.push('/(auth)/(drawer)/(chat)/new')} style={styles.newChatBtn}>
          <Text style={styles.newChatText}>+ New Chat</Text>
        </TouchableOpacity>
      </View>

      <DrawerContentScrollView {...props} contentContainerStyle={{ backgroundColor: '#fff', paddingTop: 0 }}>
{filteredHistory.map((chat) => {
  const isActive = String(chat.id) === currentChatId;
  return (
    <ContextMenu.Root key={chat.id}>
      <ContextMenu.Trigger>
        <TouchableOpacity
          onPress={() => router.push(`/(auth)/(drawer)/(chat)/${chat.id}`)}
          style={[
            styles.drawerItem,
            isActive && { backgroundColor: Colors.selected },
          ]}
        >
          <Text style={styles.drawerLabel}>{chat.title}</Text>
        </TouchableOpacity>
      </ContextMenu.Trigger>
              <ContextMenu.Content>
                <ContextMenu.Preview>
                  {() => (
                    <View style={{ padding: 16, height: 200, backgroundColor: '#fff' }}>
                      <Text>{chat.title}</Text>
                    </View>
                  )}
                </ContextMenu.Preview>
                <ContextMenu.Item key={'rename'} onSelect={() => onRenameChat(chat.id)}>
                  <ContextMenu.ItemTitle>Rename</ContextMenu.ItemTitle>
                  <ContextMenu.ItemIcon ios={{ name: 'pencil', pointSize: 18 }} />
                </ContextMenu.Item>
                <ContextMenu.Item key={'delete'} onSelect={() => onDeleteChat(chat.id)} destructive>
                  <ContextMenu.ItemTitle>Delete</ContextMenu.ItemTitle>
                  <ContextMenu.ItemIcon ios={{ name: 'trash', pointSize: 18 }} />
                </ContextMenu.Item>
              </ContextMenu.Content>
            </ContextMenu.Root>
          );
        })}
      </DrawerContentScrollView>

      <View style={{ padding: 16, paddingBottom: 10 + bottom, backgroundColor: Colors.light }}>
        <Link href="/(auth)/(modal)/settings" asChild>
          <TouchableOpacity style={styles.footer}>
            <Image source={require('@/assets/images/user.png')} style={styles.avatar} />
            <Text style={styles.userName}>
              {authUser?.primaryEmailAddress?.emailAddress ?? 'Guest'}
            </Text>
            <Ionicons name="ellipsis-horizontal" size={24} color={Colors.greyLight} />
          </TouchableOpacity>
        </Link>
      </View>

      {renameModalVisible && (
        <Modal
          animationType="fade"
          transparent={true}
          visible={renameModalVisible}
          onRequestClose={() => setRenameModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Rename Chat</Text>
              <TextInput
                style={styles.modalInput}
                value={newTitle}
                onChangeText={setNewTitle}
                placeholder="Enter new title"
              />
              <View style={styles.modalActions}>
                <TouchableOpacity onPress={() => setRenameModalVisible(false)} style={styles.modalButton}>
                  <Text>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={async () => {
                    if (selectedChatId !== null && newTitle.trim()) {
                      await renameChat(db, selectedChatId, newTitle.trim());
                      setRenameModalVisible(false);
                      loadChats();
                    } else {
                      Alert.alert('Title Required', 'Please enter a new title for the chat.');
                    }
                  }}
                  style={[styles.modalButton, { backgroundColor: Colors.selected }]}
                >
                  <Text style={{ fontWeight: 'bold' }}>Save</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
};

const Layout = () => {
  const navigation = useNavigation();
  const dimensions = useWindowDimensions();
  const { user } = useRevenueCat();
  const router = useRouter();

  const handleNewChat = async () => {
    router.push('/(auth)/(drawer)/(chat)/new');
  };

  return (
    <Drawer
      drawerContent={CustomDrawerContent}
      screenOptions={{
        headerLeft: () => (
          <TouchableOpacity
            onPress={() => navigation.dispatch(DrawerActions.toggleDrawer)}
            style={{ marginLeft: 16 }}
          >
            <FontAwesome6 name="grip-lines" size={20} color={Colors.grey} />
          </TouchableOpacity>
        ),
        headerStyle: {
          backgroundColor: Colors.light,
        },
        headerShadowVisible: false,
        drawerActiveBackgroundColor: Colors.selected,
        drawerActiveTintColor: '#000',
        drawerInactiveTintColor: '#000',
        overlayColor: 'rgba(0, 0, 0, 0.2)',
        drawerItemStyle: { borderRadius: 12 },
        drawerLabelStyle: { marginLeft: -20 },
        drawerStyle: { width: dimensions.width * 0.86 },
      }}
    >
      <Drawer.Screen
        name="(chat)/[id]"
        options={{
          drawerItemStyle: { display: 'none' },
          headerRight: () => (
            <TouchableOpacity onPress={handleNewChat}>
              <Ionicons name="create-outline" size={24} color={Colors.grey} style={{ marginRight: 16 }} />
            </TouchableOpacity>
          ),
        }}
      />
    </Drawer>
  );
};

const styles = StyleSheet.create({
  searchSection: {
    marginHorizontal: 16,
    borderRadius: 10,
    height: 34,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.input,
  },
  searchIcon: { padding: 6 },
  input: {
    flex: 1,
    paddingTop: 8,
    paddingRight: 8,
    paddingBottom: 8,
    paddingLeft: 0,
    alignItems: 'center',
    color: '#424242',
  },
  newChatBtn: {
    marginHorizontal: 16,
    marginTop: 10,
    marginBottom: 5,
    padding: 10,
    backgroundColor: Colors.new,
    borderRadius: 8,
  },
  newChatText: {
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#000',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#D3D3D3',
  },
  userName: {
    fontSize: 16,
    fontWeight: 'bold',
    flex: 1,
  },
  drawerItem: {
    padding: 12,
    paddingLeft: 20,
    borderRadius: 10,
    marginVertical: 4,
    marginHorizontal: 10,
    backgroundColor: '#f8f8f8',
  },
  drawerLabel: {
    fontSize: 16,
    color: '#000',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '80%',
    padding: 20,
    backgroundColor: '#fff',
    borderRadius: 10,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 6,
    padding: 10,
    marginBottom: 15,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
  },
  modalButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    backgroundColor: '#eee',
  },
});

export default Layout;
