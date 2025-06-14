import Colors from '@/constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import { View, StyleSheet, ScrollView } from 'react-native';
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
  onShouldSend: (message: string, imageUris?: string[]) => void;
  isDisabled?: boolean;
};


const MessageInput = ({ onShouldSend, isDisabled }: Props) => {
  const [message, setMessage] = useState('');
  const { bottom } = useSafeAreaInsets();
const [attachedImages, setAttachedImages] = useState<string[]>([]);
  const expanded = useSharedValue(0);
  const inputRef = useRef<TextInput>(null);

  const expandItems = () => {
    expanded.value = withTiming(1, { duration: 1 });
  };

  const collapseItems = () => {
    expanded.value = withTiming(0, { duration: 1 });
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
  if (!message.trim() && attachedImages.length === 0) return;

onShouldSend(message.trim(), attachedImages.length > 0 ? attachedImages : undefined);
  setMessage('');
  setAttachedImages([]);
};



const onImagePick = async () => {
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsMultipleSelection: true,
    quality: 1,
  });

  if (!result.canceled && result.assets && result.assets.length > 0) {
    const selected = result.assets.map((a) => a.uri);
    setAttachedImages((prev) => [...prev, ...selected]);
  }
};




  return (
<BlurView intensity={90} tint="extraLight" style={{ paddingBottom: bottom, paddingTop: 10 }}>
{attachedImages.length > 0 && (
  <ScrollView
    horizontal
    style={styles.attachmentPreviewContainer}
    contentContainerStyle={{ alignItems: 'center' }}
  >
    {attachedImages.map((uri, index) => (
      <View key={index} style={styles.attachmentPreview}>
        <Image source={{ uri }} style={styles.previewImage} />
        <TouchableOpacity
          onPress={() =>
            setAttachedImages((prev) => prev.filter((_, i) => i !== index))
          }
          style={styles.removeButton}
        >
          <Ionicons name="close-circle" size={20} color={Colors.grey} />
        </TouchableOpacity>
      </View>
    ))}
  </ScrollView>
)}


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

    <TextInput
      autoFocus
      ref={inputRef}
      placeholder="Message"
      placeholderTextColor={'#aaa'}
      style={styles.messageInput}
      onFocus={collapseItems}
      onChangeText={onChangeText}
      value={message}
      multiline
    />

<TouchableOpacity
  onPress={onSend}
  disabled={isDisabled || (message.trim().length === 0 && attachedImages.length === 0)}
>
  <Ionicons
    name="arrow-up-circle"
    size={24}
    color={
      isDisabled
        ? Colors.greyLight
        : message.trim().length > 0 || attachedImages.length > 0
        ? Colors.grey
        : Colors.greyLight
    }
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
attachmentPreviewContainer: {
  paddingHorizontal: 20,
  paddingVertical: 8,
  overflow: 'visible', // ✅ Allow overflow for buttons
},

attachmentPreview: {
  overflow: 'visible',
  marginRight: 8,
  position: 'relative',
},
previewImage: {
  width: 60,
  height: 60,
  borderRadius: 8,
},
removeButton: {
  position: 'absolute',
  top: -20,
  right: -6,
  backgroundColor: 'white',
  borderRadius: 12,
  padding: 2, // ✅ Slight padding around icon
  zIndex: 1,
},



});

export default MessageInput;
