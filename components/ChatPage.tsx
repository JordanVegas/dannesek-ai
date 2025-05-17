import HeaderDropDown from '@/components/HeaderDropDown';
import MessageInput from '@/components/MessageInput';
import { defaultStyles } from '@/constants/Styles';
import { Redirect, Stack, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Image, View, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import ChatMessage from '@/components/ChatMessage';
import { Message, Role } from '@/utils/Interfaces';
import MessageIdeas from '@/components/MessageIdeas';
import { addChat, addMessage, getMessages } from '@/utils/Database';
import { useSQLiteContext } from 'expo-sqlite/next';
import { talkToAssistant } from '@/utils/assistantApi'; // Assistant API

const ChatPage = () => {
  const [gptVersion, setGptVersion] = useState('4'); // Default to GPT-4
  const [height, setHeight] = useState(0);
  const [messages, setMessages] = useState<Message[]>([]);
  const db = useSQLiteContext();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [isTyping, setIsTyping] = useState(false);


  const [chatId, _setChatId] = useState(id);
  const chatIdRef = useRef(chatId);
  function setChatId(id: string) {
    chatIdRef.current = id;
    _setChatId(id);
  }

  useEffect(() => {
    if (id) {
      getMessages(db, parseInt(id)).then((res) => {
        setMessages(res);
      });
    }
  }, [id]);

  const onGptVersionChange = (version: string) => {
    setGptVersion(version);
  };

  const onLayout = (event: any) => {
    const { height } = event.nativeEvent.layout;
    setHeight(height / 2);
  };

const getCompletion = async (text: string) => {
  setMessages((prev) => [
    ...prev,
    { role: Role.User, content: text },
    { role: Role.Bot, content: '' },
  ]);
  setIsTyping(true); // ✅ Start blinking indicator

  if (messages.length === 0) {
    const res = await addChat(db, text);
    const newChatId = res.lastInsertRowId;
    setChatId(newChatId.toString());
    await addMessage(db, newChatId, { content: text, role: Role.User });
  } else {
    await addMessage(db, parseInt(chatIdRef.current), { content: text, role: Role.User });
  }

  const reply = await talkToAssistant(text);

  // Simulated fast typing
  let i = 0;
  const interval = setInterval(() => {
    i += 3; // ✅ Type 3 characters at a time
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
      setIsTyping(false); // ✅ Stop blinking
    }
  }, 5); // ✅ Fast typing (5ms between updates)

  await addMessage(db, parseInt(chatIdRef.current), {
    content: reply,
    role: Role.Bot,
  });
};



  return (
    <View style={defaultStyles.pageContainer}>
      <Stack.Screen
        options={{
          headerTitle: () => (
            <HeaderDropDown
              title="GPT"
              items={[
                { key: '3.5', title: 'GPT-3.5', icon: 'bolt' },
                { key: '4', title: 'GPT-4', icon: 'sparkles' },
              ]}
              onSelect={onGptVersionChange}
              selected={gptVersion}
            />
          ),
        }}
      />
      <View style={styles.page} onLayout={onLayout}>
        {messages.length == 0 && (
          <View style={[styles.logoContainer, { marginTop: height / 2 - 100 }]}>
            <Image source={require('@/assets/images/logo-white.png')} style={styles.image} />
          </View>
        )}
        <FlashList
          data={messages}
          renderItem={({ item }) => <ChatMessage {...item} />}
          estimatedItemSize={400}
          contentContainerStyle={{ paddingTop: 30, paddingBottom: 150 }}
          keyboardDismissMode="on-drag"
        />
        {isTyping && (
  <View style={styles.typingContainer}>
    <ChatMessage
      role={Role.Bot}
      content={
        <TypingDots />
      }
    />
  </View>
)}

      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={70}
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          width: '100%',
        }}
      >
        {messages.length === 0 && <MessageIdeas onSelectCard={getCompletion} />}
        <MessageInput onShouldSend={getCompletion} />
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  typingContainer: {
  paddingHorizontal: 20,
  paddingVertical: 5,
},
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
});

export default ChatPage;
