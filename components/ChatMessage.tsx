import Colors from '@/constants/Colors';
import { copyImageToClipboard, downloadAndSaveImage, shareImage } from '@/utils/Image';
import { Message, Role } from '@/utils/Interfaces';
import { Link } from 'expo-router';
import {
  View,
  Text,
  StyleSheet,
  Image,
  ActivityIndicator,
  Pressable,
} from 'react-native';
import * as ContextMenu from 'zeego/context-menu';

const ChatMessage = ({
  content,
  role,
  imageUrl,
  prompt,
  loading,
}: Message & { imageUrl?: string; prompt?: string; loading?: boolean }) => {
  const contextItems = [
    {
      title: 'Copy',
      systemIcon: 'doc.on.doc',
      action: () => imageUrl && copyImageToClipboard(imageUrl),
    },
    {
      title: 'Save to Photos',
      systemIcon: 'arrow.down.to.line',
      action: () => imageUrl && downloadAndSaveImage(imageUrl),
    },
    {
      title: 'Share',
      systemIcon: 'square.and.arrow.up',
      action: () => imageUrl && shareImage(imageUrl),
    },
  ];

  const isImageOnly = typeof content === 'string' && content.trim() === '' && imageUrl;
  const imageCaption =
    typeof content === 'string' && content.startsWith('[Image]:')
      ? content.replace('[Image]:', '').trim()
      : null;

  return (
    <View style={styles.row}>
      {role === Role.Bot ? (
        <View style={[styles.item, { backgroundColor: '#000' }]}>
          <Image source={require('@/assets/images/logo-white.png')} style={styles.btnImage} />
        </View>
      ) : (
        <Image source={require('@/assets/images/user.png')} style={styles.avatar} />
      )}

      {loading ? (
        <View style={styles.loading}>
          <ActivityIndicator color={Colors.primary} size="small" />
        </View>
      ) : (
        <View style={{ flexShrink: 1 }}>
          {imageUrl && (
            <ContextMenu.Root>
              <ContextMenu.Trigger>
                <Link
                  href={`/(auth)/(modal)/image/${encodeURIComponent(
                    imageUrl
                  )}?prompt=${encodeURIComponent(prompt || '')}`}
                  asChild
                >
                  <Pressable>
                    <Image source={{ uri: imageUrl }} style={styles.previewImage} />
                  </Pressable>
                </Link>
              </ContextMenu.Trigger>
              <ContextMenu.Content>
                {contextItems.map((item) => (
                  <ContextMenu.Item key={item.title} onSelect={item.action}>
                    <ContextMenu.ItemTitle>{item.title}</ContextMenu.ItemTitle>
                    <ContextMenu.ItemIcon
                      ios={{
                        name: item.systemIcon,
                        pointSize: 18,
                      }}
                    />
                  </ContextMenu.Item>
                ))}
              </ContextMenu.Content>
            </ContextMenu.Root>
          )}

          {typeof content === 'string' && imageCaption && (
            <Text style={styles.caption}>{imageCaption}</Text>
          )}

          {!imageUrl && typeof content === 'string' && (
            <Text style={styles.text}>{content}</Text>
          )}

          {!imageUrl && typeof content !== 'string' && content}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 14,
    gap: 14,
    marginVertical: 12,
  },
  item: {
    borderRadius: 15,
    overflow: 'hidden',
  },
  btnImage: {
    margin: 0,
    width: 30,
    height: 30,
  },
  avatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#E0E0E0',
  },
  text: {
    padding: 4,
    fontSize: 16,
    flexWrap: 'wrap',
    flex: 1,
  },
  caption: {
    fontSize: 14,
    marginTop: 6,
    color: Colors.grey,
    flexWrap: 'wrap',
  },
  previewImage: {
    width: 240,
    height: 240,
    borderRadius: 10,
  },
  loading: {
    justifyContent: 'center',
    height: 26,
    marginLeft: 14,
  },
});

export default ChatMessage;
