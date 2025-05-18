import Colors from '@/constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import { View, StyleSheet } from 'react-native';
import { TextInput, TouchableOpacity } from 'react-native-gesture-handler';
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRef, useState } from 'react';
import { BlurView } from 'expo-blur';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { Image } from 'react-native';


const ATouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity);

export type Props = {
  onShouldSend: (message: string, imageUri?: string) => void;
};

const MessageInput = ({ onShouldSend }: Props) => {
  const [message, setMessage] = useState('');
  const { bottom } = useSafeAreaInsets();
  const [attachedImage, setAttachedImage] = useState<string | null>(null);
  const expanded = useSharedValue(0);
  const inputRef = useRef<TextInput>(null);

  const expandItems = () => {
    expanded.value = withTiming(1, { duration: 400 });
  };

  const collapseItems = () => {
    expanded.value = withTiming(0, { duration: 400 });
  };

  const expandButtonStyle = useAnimatedStyle(() => {
    const opacityInterpolation = interpolate(expanded.value, [0, 1], [1, 0], Extrapolation.CLAMP);
    const widthInterpolation = interpolate(expanded.value, [0, 1], [30, 0], Extrapolation.CLAMP);

    return {
      opacity: opacityInterpolation,
      width: widthInterpolation,
    };
  });

  const buttonViewStyle = useAnimatedStyle(() => {
    const widthInterpolation = interpolate(expanded.value, [0, 1], [0, 100], Extrapolation.CLAMP);
    return {
      width: widthInterpolation,
      opacity: expanded.value,
    };
  });

  const onChangeText = (text: string) => {
    collapseItems();
    setMessage(text);
  };

const onSend = () => {
  if (!message.trim() && !attachedImage) return;

  onShouldSend(message.trim(), attachedImage || undefined);
  setMessage('');
  setAttachedImage(null);
};


const onImagePick = async () => {
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsMultipleSelection: false,
    quality: 1,
  });

  if (!result.canceled && result.assets && result.assets.length > 0) {
    const imageUri = result.assets[0].uri;
    setAttachedImage(imageUri); // ✅ only attach, don't send yet
  }
};



  return (
    <BlurView intensity={90} tint="extraLight" style={{ paddingBottom: bottom, paddingTop: 10 }}>
      <View style={styles.row}>
        <ATouchableOpacity onPress={expandItems} style={[styles.roundBtn, expandButtonStyle]}>
          <Ionicons name="add" size={24} color={Colors.grey} />
        </ATouchableOpacity>

        <Animated.View style={[styles.buttonView, buttonViewStyle]}>
          <TouchableOpacity onPress={() => ImagePicker.launchCameraAsync()}>
            <Ionicons name="camera-outline" size={24} color={Colors.grey} />
          </TouchableOpacity>

          <TouchableOpacity onPress={onImagePick}>
            <Ionicons name="image-outline" size={24} color={Colors.grey} />
          </TouchableOpacity>

          <TouchableOpacity onPress={() => DocumentPicker.getDocumentAsync()}>
            <Ionicons name="folder-outline" size={24} color={Colors.grey} />
          </TouchableOpacity>
        </Animated.View>
{attachedImage && (
  <View style={styles.attachmentPreview}>
    <Image source={{ uri: attachedImage }} style={styles.previewImage} />
    <TouchableOpacity onPress={() => setAttachedImage(null)} style={styles.removeButton}>
      <Ionicons name="close-circle" size={20} color={Colors.grey} />
    </TouchableOpacity>
  </View>
)}

        <TextInput
          autoFocus
          ref={inputRef}
          placeholder="Message"
          style={styles.messageInput}
          onFocus={collapseItems}
          onChangeText={onChangeText}
          value={message}
          multiline
        />

        <TouchableOpacity onPress={onSend} disabled={message.trim().length === 0}>
          <Ionicons
            name="arrow-up-circle"
            size={24}
            color={message.trim().length > 0 ? Colors.grey : Colors.greyLight}
          />
        </TouchableOpacity>
      </View>
    </BlurView>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  messageInput: {
    flex: 1,
    marginHorizontal: 10,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 20,
    padding: 10,
    borderColor: Colors.greyLight,
    backgroundColor: Colors.light,
  },
  roundBtn: {
    width: 30,
    height: 30,
    borderRadius: 20,
    backgroundColor: Colors.input,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonView: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  attachmentPreview: {
  flexDirection: 'row',
  alignItems: 'center',
  marginBottom: 8,
},
previewImage: {
  width: 60,
  height: 60,
  borderRadius: 8,
  marginRight: 8,
},
removeButton: {
  padding: 4,
},

});

export default MessageInput;
