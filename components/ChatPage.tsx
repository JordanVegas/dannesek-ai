import HeaderDropDown from '@/components/HeaderDropDown';
import MessageInput from '@/components/MessageInput';
import { defaultStyles } from '@/constants/Styles';
import { Redirect, Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  Image,
  View,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Modal,
  TextInput,
  Button,
  Text,
} from 'react-native';
import { FlashList } from '@shopify/flash-list';
import ChatMessage from '@/components/ChatMessage';
import { Message, Role } from '@/utils/Interfaces';
import MessageIdeas from '@/components/MessageIdeas';
import { addChat, addMessage, getMessages } from '@/utils/Database';
import { useSQLiteContext } from 'expo-sqlite/next';
import { talkToAssistant, uploadImageToOpenAI } from '@/utils/assistantApi';
import { TypingDots } from '@/components/TypingDots';

const ChatPage = () => {
  const [gptVersion, setGptVersion] = useState('4');
  const [height, setHeight] = useState(0);
  const [messages, setMessages] = useState<Message[]>([]);
  const db = useSQLiteContext();
  const params = useLocalSearchParams();
  const id = typeof params.id === 'string' ? params.id : '';
  const [isTyping, setIsTyping] = useState(false);
  const router = useRouter();
  const [threadId, setThreadId] = useState<string | null>(null);

  const [chatId, _setChatId] = useState(id);
  const chatIdRef = useRef(chatId);
  function setChatId(id: string) {
    chatIdRef.current = id;
    _setChatId(id);
  }

  const [chatName, setChatName] = useState(params.name || '');
  const [showNameModal, setShowNameModal] = useState(false);

  useEffect(() => {
    const initChat = async () => {
      if (!id || id === 'new') {
        const res = await addChat(db, 'New Chat');
        const newId = res.lastInsertRowId.toString();
        setChatId(newId);
        setShowNameModal(true);
        router.replace(`/(auth)/(drawer)/(chat)/${newId}`);
        return;
      }

      const numericId = parseInt(id);

      const threadRow = await db.getFirstAsync<{ thread_id: string }>(
        'SELECT thread_id FROM chats WHERE id = ?',
        [numericId]
      );
      setThreadId(threadRow?.thread_id ?? null);

      const chatRow = await db.getFirstAsync<{ title: string }>(
        'SELECT title FROM chats WHERE id = ?',
        [numericId]
      );

      if (chatRow?.title === 'New Chat') {
        setShowNameModal(true);
      }

      const msgs = await getMessages(db, numericId);
      setMessages(msgs);
    };

    initChat();
  }, [id]);

  const createNamedChat = async () => {
    if (!chatName.trim()) {
      Alert.alert('Chat name cannot be empty');
      return;
    }

    await db.runAsync('UPDATE chats SET title = ? WHERE id = ?', chatName.trim(), chatIdRef.current);
    setShowNameModal(false);
  };

  const onGptVersionChange = (version: string) => {
    setGptVersion(version);
  };

  const onLayout = (event: any) => {
    const { height } = event.nativeEvent.layout;
    setHeight(height / 2);
  };

  const getCompletion = async (text: string, imageUris?: string[]) => {
    const hasImages = Array.isArray(imageUris) && imageUris.length > 0;

    setMessages((prev) => [
      ...prev,
      {
        role: Role.User,
        content: text,
        imageUrls: imageUris,
      },
    ]);

    setIsTyping(true);

    const chatContent = text;
    await addMessage(db, parseInt(chatIdRef.current), { content: chatContent, role: Role.User });

    let fileIds: string[] = [];
    if (hasImages) {
      for (const uri of imageUris!) {
        const id = await uploadImageToOpenAI(uri);
        if (!id) {
          Alert.alert('Image upload failed');
          setIsTyping(false);
          return;
        }
        fileIds.push(id);
      }
    }

    const reply = await talkToAssistant(text, fileIds.length > 0 ? fileIds : undefined, threadId ?? undefined);

    setMessages((prev) => [...prev, { role: Role.Bot, content: '' }]);

    let i = 0;
    const interval = setInterval(() => {
      i += 6;
      setMessages((prev) => {
        const updated = [...prev];
        const botMsg = updated[updated.length - 1];
        updated[updated.length - 1] = {
          ...botMsg,
          content: reply.slice(0, i),
        };
        return updated;
      });

      if (i >= reply.length) {
        clearInterval(interval);
        setIsTyping(false);
      }
    }, 3);

    await addMessage(db, parseInt(chatIdRef.current), {
      content: reply,
      role: Role.Bot,
    });
  };

  return (
    <View style={defaultStyles.pageContainer}>
      {showNameModal && (
        <Modal transparent animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={styles.modalContainer}>
              <Text style={styles.modalTitle}>what is the name of the girl?</Text>
              <TextInput
                value={chatName}
                onChangeText={setChatName}
                placeholder="enter the girl's name"
                style={styles.modalInput}
              />
              <Button color="black" title="save" onPress={createNamedChat} />
            </View>
          </View>
        </Modal>
      )}
<Stack.Screen
  options={{
    headerTitle: chatName || 'Chat',
    headerTitleAlign: 'center',
  }}
/>


      <View style={styles.page} onLayout={onLayout}>
        {messages.length === 0 && (
          <View style={[styles.logoContainer, { marginTop: height / 2 - 100 }]}> 
            <Image source={require('@/assets/images/logo-white.png')} style={styles.image} />
          </View>
        )}

        <FlashList
          data={
            isTyping &&
            (messages.length === 0 || messages[messages.length - 1].role !== Role.Bot)
              ? [...messages, { role: Role.Bot, content: '__typing__' }]
              : messages
          }
          renderItem={({ item }) => {
            if (item.content === '__typing__') {
              return <ChatMessage role={Role.Bot} content={<TypingDots />} />;
            }

            return (
              <ChatMessage
                {...item}
                imageUrl={'imageUrl' in item ? item.imageUrl : undefined}
              />
            );
          }}
          estimatedItemSize={400}
          contentContainerStyle={{ paddingTop: 30, paddingBottom: 150 }}
          keyboardDismissMode="on-drag"
        />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={70}
        style={{ position: 'absolute', bottom: 0, left: 0, width: '100%' }}
      >
        {messages.length === 0 && <MessageIdeas onSelectCard={getCompletion} />}
        <MessageInput onShouldSend={getCompletion} isDisabled={isTyping} />
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  logoContainer: {
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    width: 50,
    height: 50,
    backgroundColor: '#000',
    borderRadius: 50,
  },
  image: {
    width: 50,
    height: 50,
    resizeMode: 'stretch',
    borderRadius: 50,
  },
  page: {
    flex: 1,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContainer: {
    width: '80%',
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 10,
    width: '100%',
    marginBottom: 16,
  },
});

export default ChatPage;
