import React, { useRef, useEffect, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ImageBackground,
  Animated,
  PanResponder,
  Dimensions,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import { Images } from '../constants/images';

const SCREEN_WIDTH = Dimensions.get('window').width;
const SLIDER_WIDTH = SCREEN_WIDTH - 70;
const KNOB_SIZE = 70;

/* ---------- SLIDES DATA ---------- */
const slides = [
  {
    image: Images.doctor,
    text: ['Talk anytime with', 'Chat', 'Assistance', 'support.'],
  },
  {
    image: Images.doctor2,
    text: ['Track your', 'Medicines', 'Daily', 'easily.'],
  },
  {
    image: Images.doctor3,
    text: ['Stay connected with', 'Family', 'and', 'Caregivers.'],
  },
];

export default function IntroScreen({ onFinish }: any) {
  const [index, setIndex] = useState(0);

  /* ---------- PROGRESS ANIMATION ---------- */
  const progress = useRef(slides.map(() => new Animated.Value(0))).current;

  const startProgress = (i: number) => {
    progress[i].setValue(0);

    Animated.timing(progress[i], {
      toValue: 1,
      duration: 5000,
      useNativeDriver: false,
    }).start(({ finished }) => {
      if (!finished) return;

      let nextIndex = i + 1;

      if (nextIndex >= slides.length) {
        nextIndex = 0;
        progress.forEach(p => p.setValue(0));
      }

      setIndex(nextIndex);
    });
  };

  useEffect(() => {
    startProgress(index);
  }, [index]);

  /* ---------- SLIDER ---------- */
  const translateX = useRef(new Animated.Value(0)).current;

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: () => true,

      onPanResponderMove: (_, gesture) => {
        if (gesture.dx > 0 && gesture.dx <= SLIDER_WIDTH - KNOB_SIZE) {
          translateX.setValue(gesture.dx);
        }
      },

      onPanResponderRelease: (_, gesture) => {
        if (gesture.dx > SLIDER_WIDTH * 0.7) {
          Animated.timing(translateX, {
            toValue: SLIDER_WIDTH - KNOB_SIZE - 8,
            duration: 180,
            useNativeDriver: true,
          }).start(() => {
            onFinish(); // 🔥 Tell RootNavigator to switch to Auth
          });
        } else {
          Animated.spring(translateX, {
            toValue: 0,
            useNativeDriver: true,
          }).start();
        }
      },
    })
  ).current;

  const currentSlide = slides[index];

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* HEADER */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Alzhe</Text>

        <View style={styles.progressContainer}>
          {slides.map((_, i) => (
            <View key={i} style={styles.bar}>
              <Animated.View
                style={[
                  styles.activeBar,
                  {
                    width: progress[i].interpolate({
                      inputRange: [0, 1],
                      outputRange: ['0%', '100%'],
                    }),
                  },
                ]}
              />
            </View>
          ))}
        </View>
      </View>

      {/* IMAGE SECTION */}
      <View style={styles.imageSection}>
        <ImageBackground
          source={currentSlide.image}
          resizeMode="cover"
          style={styles.background}
        >
          <LinearGradient
            colors={['#ffffff', 'rgba(255,255,255,0.7)', 'transparent']}
            style={styles.topGradient}
            pointerEvents="none"
          />

          <LinearGradient
            colors={['transparent', 'rgba(255,255,255,0.6)', '#ffffff']}
            style={styles.gradient}
          />

          <View style={styles.content}>
            <Text style={styles.text}>
              {currentSlide.text[0]}{'\n'}
              <Text style={styles.bold}>{currentSlide.text[1]}</Text> and{' '}
              <Text style={styles.bold}>{currentSlide.text[2]}</Text>{'\n'}
              {currentSlide.text[3]}
            </Text>

            {/* SWIPE BUTTON */}
            <View style={styles.sliderContainer}>
              <Text style={styles.sliderText}>Swipe to Start</Text>

              <Animated.View
                style={[styles.knob, { transform: [{ translateX }] }]}
                {...panResponder.panHandlers}
              >
                <Image source={Images.arrowIcon} style={styles.arrowIcon} />
              </Animated.View>
            </View>
          </View>
        </ImageBackground>
      </View>
    </SafeAreaView>
  );
}

/* ---------- STYLES ---------- */
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#ffffff',
  },

  header: {
    backgroundColor: '#fff',
    paddingTop: 10,
    paddingBottom: 14,
    paddingHorizontal: 20,
  },

  headerTitle: {
    fontSize: 40,
    fontFamily: 'Coolvetica-Bold',
    textAlign: 'center',
    color: '#1F2937',
    marginBottom: 10,
  },

  progressContainer: {
    flexDirection: 'row',
    gap: 6,
  },

  imageSection: {
    flex: 1,
  },

  background: {
    flex: 1,
    justifyContent: 'flex-end',
  },

  gradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '55%',
  },

  content: {
    paddingHorizontal: 25,
    paddingBottom: 45,
  },

  text: {
    fontSize: 30,
    fontFamily: 'Coolvetica-Light-Regular',
    textAlign: 'left',
    color: '#333',
    marginBottom: 28,
    lineHeight: 30,
    paddingLeft: 15,
  },

  bold: {
    fontFamily: 'Coolvetica-Bold',
    color: '#1F2937',
  },

  sliderContainer: {
    width: SLIDER_WIDTH,
    height: 80,
    backgroundColor: '#1F2937',
    borderRadius: 50,
    justifyContent: 'center',
    alignSelf: 'center',
    overflow: 'hidden',
  },

  sliderText: {
    position: 'absolute',
    alignSelf: 'center',
    color: '#fff',
    fontSize: 20,
    fontFamily: 'Coolvetica-Bold',
  },

  knob: {
    width: KNOB_SIZE,
    height: KNOB_SIZE,
    borderRadius: 50,
    backgroundColor: '#E3F73F',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 3,
  },

  bar: {
    flex: 1,
    height: 4,
    backgroundColor: '#d9d9d9',
    borderRadius: 4,
    overflow: 'hidden',
  },

  activeBar: {
    height: 4,
    backgroundColor: '#1F2937',
  },

  arrowIcon: {
    width: 40,
    height: 40,
    resizeMode: 'contain',
  },

  topGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '25%',
  },
});