import Colors from '@/constants/Colors';
import { memo } from 'react';
import { StyleSheet, useWindowDimensions, View, Image } from 'react-native';
import Animated, {
  interpolate,
  interpolateColor,
  useAnimatedReaction,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import { ReText } from 'react-native-redash';

const content = [
  {
    title: 'AskDan.',
    bg: '#AE5540',
    fontColor: '#F2F2F2',
  },
  {
    title: "Let's date.",
    bg: '#000000',
    fontColor: '#AE5540',
  },
  {
    title: "Let's meet.",
    bg: '#503632',
    fontColor: Colors.sky,
  },
  {
    title: "Let's learn.",
    bg: '#A69087',
    fontColor: '#F0F0F0',
  },
  {
    title: "Let's start.",
    bg: '#432524',
    fontColor: '#F0F0F0',
  }
];

const AnimatedIntro = () => {
  const { width } = useWindowDimensions();
  const ballWidth = 34;
  const half = width / 2 - ballWidth / 2;

  const currentX = useSharedValue(half);
  const currentIndex = useSharedValue(0);
  const isAtStart = useSharedValue(true);
  const labelWidth = useSharedValue(0);
  const canGoToNext = useSharedValue(false);
  const didPlay = useSharedValue(false);

  const newColorIndex = useDerivedValue(() => {
    if (!isAtStart.value) {
      return (currentIndex.value + 1) % content.length;
    }
    return currentIndex.value;
  }, [currentIndex]);

  const textStyle = useAnimatedStyle(() => {
    return {
      color: interpolateColor(
        currentX.value,
        [half, half + labelWidth.value / 2],
        [content[newColorIndex.value].fontColor, content[currentIndex.value].fontColor],
        'RGB'
      ),
      transform: [
        {
          translateX: interpolate(
            currentX.value,
            [half, half + labelWidth.value / 2],
            [half + 4, half - labelWidth.value / 2]
          ),
        },
      ],
    };
  }, [currentIndex, currentX]);

  const ballStyle = useAnimatedStyle(() => {
    return {
      backgroundColor: interpolateColor(
        currentX.value,
        [half, half + labelWidth.value / 2],
        [content[newColorIndex.value].fontColor, content[currentIndex.value].fontColor],
        'RGB'
      ),
      transform: [{ translateX: currentX.value }],
    };
  });

  const mask = useAnimatedStyle(
    () => ({
      backgroundColor: interpolateColor(
        currentX.value,
        [half, half + labelWidth.value / 2],
        [content[newColorIndex.value].bg, content[currentIndex.value].bg],
        'RGB'
      ),
      transform: [{ translateX: currentX.value }],
      width: width / 1.5,
      borderTopLeftRadius: 20,
      borderBottomLeftRadius: 20,
    }),
    [currentIndex, currentX, labelWidth]
  );

  const style1 = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(
      currentX.value,
      [half, half + labelWidth.value / 2],
      [content[newColorIndex.value].bg, content[currentIndex.value].bg],
      'RGB'
    ),
    opacity: interpolate(1, [1, 0], [1, 0, 0, 0, 0, 0, 0]),
    transform: [
      {
        translateX: interpolate(1, [1, 0], [0, -width * 2, -width, -width, -width, -width, -width]),
      },
    ],
  }));

  const text = useDerivedValue(() => {
    const index = currentIndex.value;
    return content[index].title;
  }, [currentIndex]);

  useAnimatedReaction(
    () => labelWidth.value,
    (newWidth) => {
      currentX.value = withDelay(
        1000,
        withTiming(
          half + newWidth / 2,
          {
            duration: 800,
          },
          (finished) => {
            if (finished) {
              canGoToNext.value = true;
              isAtStart.value = false;
            }
          }
        )
      );
    },
    [labelWidth, currentX, half]
  );

  useAnimatedReaction(
    () => canGoToNext.value,
    (next) => {
      if (next) {
        canGoToNext.value = false;
        currentX.value = withDelay(
          1000,
          withTiming(
            half,
            {
              duration: 800,
            },
            (finished) => {
              if (finished) {
                currentIndex.value = (currentIndex.value + 1) % content.length;
                isAtStart.value = true;
                didPlay.value = false;
              }
            }
          )
        );
      }
    },
    [currentX, labelWidth]
  );

  return (
    <Animated.View style={[styles.wrapper, style1]}>
                              <View style={[styles.logoContainer]}> 
                  <Image source={require('@/assets/images/logo-white.png')} style={styles.image} />
                </View>
      <Animated.View style={[styles.content]}>
        <Animated.View style={[styles.ball, ballStyle]} />
        <Animated.View style={[styles.mask, mask]} />
        <ReText
          onLayout={(e) => {
            labelWidth.value = e.nativeEvent.layout.width + 4;
          }}
          style={[styles.title, textStyle]}
          text={text}
        />
      </Animated.View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
    logoContainer: {
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    // width: 200,
    // height: 200,
    // backgroundColor: '#000',
    // borderRadius: 200,
    position: 'absolute',
    top: '10%'
  },
  image: {
    width: 200,
    height: 200,
    resizeMode: 'stretch',
    borderRadius:50,
  },
  wrapper: {
    flex: 1,
  },
  mask: {
    zIndex: 1,
    position: 'absolute',
    left: '0%',
    height: 50,
  },
  ball: {
    width: 40,
    zIndex: 10,
    height: 40,
    backgroundColor: '#000',
    borderRadius: 20,
    position: 'absolute',
    left: '0%',
    top: 10
  },
  titleText: {
    flexDirection: 'row',
  },
  title: {
    fontSize: 36,
    fontWeight: '600',
    left: '0%',
    position: 'absolute',
  },
  content: {
    marginTop: 300,
  },
});
export default memo(AnimatedIntro);
