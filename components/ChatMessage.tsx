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
  imageUrls,
  prompt,
  loading,
}: Message & {
  imageUrl?: string;
  imageUrls?: string[];
  prompt?: string;
  loading?: boolean;
}) => {
  const renderImage = (uri: string, index: number) => {
    const contextItems = [
      {
        title: 'Copy',
        systemIcon: 'doc.on.doc',
        action: () => copyImageToClipboard(uri),
      },
      {
        title: 'Save to Photos',
        systemIcon: 'arrow.down.to.line',
        action: () => downloadAndSaveImage(uri),
      },
      {
        title: 'Share',
        systemIcon: 'square.and.arrow.up',
        action: () => shareImage(uri),
      },
    ];

    return (
      <ContextMenu.Root key={index}>
        <ContextMenu.Trigger>
          <Link
            href={`/(auth)/(modal)/image/${encodeURIComponent(uri)}?prompt=${encodeURIComponent(
              prompt || ''
            )}`}
            asChild
          >
            <Pressable>
              <Image source={{ uri }} style={styles.previewImage} />
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
    );
  };

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
          {/* Multiple image support */}
          {imageUrls?.length > 0 && (
            <View style={styles.imageWrap}>
              {imageUrls.map((uri, i) => renderImage(uri, i))}
            </View>
          )}

          {/* Single image fallback */}
          {!imageUrls && imageUrl && renderImage(imageUrl, 0)}

          {/* Text */}
          {typeof content === 'string' && content.trim() !== '' && (
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
    paddingTop: 6,
    fontSize: 16,
    flexWrap: 'wrap',
    flex: 1,
  },
  previewImage: {
    width: 180,
    height: 180,
    borderRadius: 10,
    marginRight: 8,
    marginBottom: 8,
  },
  imageWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  loading: {
    justifyContent: 'center',
    height: 26,
    marginLeft: 14,
  },
});

export default ChatMessage;
