// ─────────────────────────────────────────────────────────────
// 📦 Imports
// ─────────────────────────────────────────────────────────────
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Animated,
  Easing,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';

import { launchCamera, launchImageLibrary } from 'react-native-image-picker';
import { Image, ScrollView } from 'react-native';

import MaterialIcons from 'react-native-vector-icons/Fontisto';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MCIcon from 'react-native-vector-icons/MaterialCommunityIcons';

import { startSpeechToText } from 'react-native-voice-to-text';
import { apiService } from '../../Services/apiService';
import { useAuth } from '../../Context/AuthContext';
import Speech from '@mhpdev/react-native-speech';
import { PermissionsAndroid } from 'react-native';


// ─────────────────────────────────────────────────────────────
// 🧠 Types
// ─────────────────────────────────────────────────────────────
interface Message {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  timestamp: Date;
}
interface AttachedFile {
  id: string;
  name: string;
  uri: string;
  mimeType?: string;
}


// ─────────────────────────────────────────────────────────────
// 🎨 Constants
// ─────────────────────────────────────────────────────────────
const YELLOW = '#E3F73F';
const DARK   = '#1F2937';
const BG     = '#F4F1EC';
const MUTED  = '#9CA3AF';
const BORDER = '#E5E0D8';
const WHITE  = '#FFFFFF';


// ─────────────────────────────────────────────────────────────
// 💬 Chat Screen Component
// ─────────────────────────────────────────────────────────────
export default function ChatScreen() {
  const { state } = useAuth();

  const [listening, setListening]   = useState(false);
  const [loading, setLoading]       = useState(false);
  const [session, setSession]       = useState<Message[] | null>(null);
  const [inputText, setInputText]   = useState('');
  const [speakingId, setSpeakingId] = useState<string | null>(null);

  const pulseAnim    = useRef(new Animated.Value(1)).current;
  const pulseOpacity = useRef(new Animated.Value(0.4)).current;
  const flatListRef  = useRef<FlatList>(null);
  const [attachments, setAttachments] = useState<AttachedFile[]>([]);
  const [showAttachMenu, setShowAttachMenu] = useState(false);


  // ───────────────────────────────────────────────────────────
  // 🌅 Greeting
  // ───────────────────────────────────────────────────────────
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour >= 5  && hour < 12) return 'Good Morning';
    if (hour >= 12 && hour < 17) return 'Good Afternoon';
    if (hour >= 17 && hour < 21) return 'Good Evening';
    return 'Hope you\'re having a peaceful night';
  };

  const getGreetingIcon = () => {
    const hour = new Date().getHours();
    if (hour >= 5  && hour < 12) return 'weather-sunny';
    if (hour >= 12 && hour < 17) return 'weather-partly-cloudy';
    if (hour >= 17 && hour < 21) return 'weather-sunset';
    return 'moon-waning-crescent';
  };
  const requestCameraPermission = async () => {
  try {
    const granted = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.CAMERA,
      {
        title: 'Camera Permission',
        message: 'App needs access to your camera',
        buttonPositive: 'OK',
      },
    );

    return granted === PermissionsAndroid.RESULTS.GRANTED;
  } catch (err) {
    console.log('Permission error:', err);
    return false;
  }
};


  // ───────────────────────────────────────────────────────────
  // 🔊 Speech
  // ───────────────────────────────────────────────────────────
  useEffect(() => {
    const loadMaleVoices = async () => {
      const voices = await Speech.getAvailableVoices();
      const malePatterns = ['iog', 'iom', 'tpc', 'tpd'];
      const maleVoices = voices.filter(v =>
        v.language.startsWith('en') &&
        malePatterns.some(p => v.identifier.toLowerCase().includes(p))
      );
      console.log('Possible Male Voices:', maleVoices);
    };
    loadMaleVoices();
  }, []);

  const speakMessage = async (id: string, text: string) => {
    try {
      if (speakingId === id) {
        await Speech.stop();
        setSpeakingId(null);
        return;
      }
      await Speech.stop();
      setSpeakingId(id);
      await Speech.speak(text, { voice: 'en-us-x-tpd-network', rate: 0.9, pitch: 0.9 });
      setSpeakingId(null);
    } catch (error) {
      console.log('Speech error:', error);
      setSpeakingId(null);
    }
  };


  // ───────────────────────────────────────────────────────────
  // 🔄 Focus effect
  // ───────────────────────────────────────────────────────────
  useFocusEffect(
    React.useCallback(() => {
      return () => {};
    }, [])
  );


  // ───────────────────────────────────────────────────────────
  // 🎤 Pulse Animation
  // ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (listening) {
      Animated.loop(
        Animated.sequence([
          Animated.parallel([
            Animated.timing(pulseAnim, { toValue: 1.22, duration: 700, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
            Animated.timing(pulseOpacity, { toValue: 0, duration: 700, useNativeDriver: true }),
          ]),
          Animated.parallel([
            Animated.timing(pulseAnim, { toValue: 1, duration: 0, useNativeDriver: true }),
            Animated.timing(pulseOpacity, { toValue: 0.4, duration: 0, useNativeDriver: true }),
          ]),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
      pulseOpacity.setValue(0.4);
    }
  }, [listening]);


  // ───────────────────────────────────────────────────────────
  // 🔽 Auto Scroll
  // ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (session?.length) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 120);
    }
  }, [session?.length]);


  // ───────────────────────────────────────────────────────────
  // 🌐 Send to API
  // ───────────────────────────────────────────────────────────
  const sendToAPI = async (text: string) => {
    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      text: text.trim(),
      timestamp: new Date(),
    };

    setSession(prev => (prev === null ? [userMsg] : [...prev, userMsg]));
    setLoading(true);

    try {
      const data = await apiService.sendMessage(text.trim());

      const assistantMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        text: data.response,
        timestamp: new Date(),
      };

      setSession(prev => [...(prev ?? []), assistantMsg]);
    } catch (err: any) {
      const errMsg: Message = {
        id: (Date.now() + 2).toString(),
        role: 'assistant',
        text: "Sorry, I couldn't reach the server. Please try again.",
        timestamp: new Date(),
      };
      setSession(prev => (prev ? [...prev, errMsg] : prev));
    } finally {
      setLoading(false);
    }
  };


  // ───────────────────────────────────────────────────────────
  // ⌨️ Text Send
  // ───────────────────────────────────────────────────────────
  const handleTextSend = async () => {
    const text = inputText.trim();
    if (!text || loading) return;
    setInputText('');
    await sendToAPI(text);
  };


  // ───────────────────────────────────────────────────────────
  // 🎙 Voice Send
  // ───────────────────────────────────────────────────────────
  const handleMicPress = async () => {
    if (loading) return;
    try {
      setListening(true);
      const audioText: string = await startSpeechToText();
      if (!audioText?.trim()) return;
      await sendToAPI(audioText);
    } catch (err: any) {
    } finally {
      setListening(false);
    }
  };




// ─── 🖼 Pick from Gallery ─────────────────────────────────
const handleGalleryPick = async () => {
  setShowAttachMenu(false);
  launchImageLibrary({ mediaType: 'photo', selectionLimit: 5 }, (response) => {
    if (response.didCancel || response.errorCode) return;
    const mapped: AttachedFile[] = (response.assets ?? []).map(a => ({
      id: Date.now().toString() + Math.random(),
      name: a.fileName ?? 'photo.jpg',
      uri: a.uri ?? '',
      type: 'image',
      mimeType: a.type ?? 'image/jpeg',
    }));
    setAttachments(prev => [...prev, ...mapped]);
  });
};

// ─── 📷 Open Camera ──────────────────────────────────────
const handleCamera = async () => {
  setShowAttachMenu(false);

  const hasPermission = await requestCameraPermission();
  if (!hasPermission) {
    console.log('Camera permission denied');
    return;
  }

  try {
    const result = await launchCamera({
      mediaType: 'photo',
      cameraType: 'back',
      saveToPhotos: false,
    });


    if (result.didCancel) return;
    if (result.errorCode) {
      console.log('Camera error:', result.errorMessage);
      return;
    }

    const asset = result.assets?.[0];
    if (!asset) return;

    setAttachments(prev => [
      ...prev,
      {
        id: Date.now().toString(),
        name: asset.fileName ?? 'camera.jpg',
        uri: asset.uri ?? '',
        mimeType: asset.type ?? 'image/jpeg',
      },
    ]);
  } catch (error) {
    console.log('Launch camera error:', error);
  }
};

// ─── ✖ Remove Attachment ─────────────────────────────────
const removeAttachment = (id: string) => {
  setAttachments(prev => prev.filter(a => a.id !== id));
};

  // ───────────────────────────────────────────────────────────
  // 💬 CHAT UI
  // ───────────────────────────────────────────────────────────
  if (session !== null) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >

          {/* ── Header ── */}
          <View style={styles.chatHeader}>
            <View style={styles.headerLeft}>
              <View style={styles.brainIconWrap}>
                <MCIcon name="brain" size={22} color={DARK} />
              </View>
              <View>
                <Text style={styles.chatHeaderEyebrow}>AI Assistant</Text>
                <Text style={styles.chatHeaderTitle}>Ask Anything</Text>
              </View>
            </View>

            <View style={styles.sessionBadge}>
              <View style={styles.sessionDot} />
              <Text style={styles.sessionLabel}>Live</Text>
            </View>
          </View>

          {/* ── Accent Bar ── */}
          <View style={styles.accentBar}>
            <View style={styles.accentLine} />
            <View style={[styles.accentLine, styles.accentLineShort]} />
          </View>

          {/* ── Messages ── */}
          <FlatList
            ref={flatListRef}
            data={session}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.messageList}
            renderItem={({ item }) => {
              const isSpeaking = speakingId === item.id;
              const isUser = item.role === 'user';

              return (
                <TouchableOpacity
                  activeOpacity={0.85}
                  onPress={() => {
                    if (!isUser) speakMessage(item.id, item.text);
                  }}
                >
                  <View style={[
                    styles.bubbleRow,
                    isUser ? styles.bubbleRowUser : styles.bubbleRowAssistant,
                  ]}>

                    {/* Assistant avatar */}
                    {!isUser && (
                      <View style={styles.assistantAvatar}>
                        <MCIcon name="brain" size={16} color={DARK} />
                      </View>
                    )}

                    <View style={[
                      styles.bubble,
                      isUser ? styles.bubbleUser : styles.bubbleAssistant,
                      isSpeaking && styles.bubbleSpeaking,
                    ]}>
                      {!isUser && (
                        <View style={styles.bubbleRoleRow}>
                          <MCIcon
                            name={isSpeaking ? 'volume-high' : 'volume-medium'}
                            size={12}
                            color={isSpeaking ? DARK : MUTED}
                          />
                          <Text style={[styles.bubbleRole, isSpeaking && { color: DARK }]}>
                            {isSpeaking ? 'Speaking...' : 'Tap to hear'}
                          </Text>
                        </View>
                      )}

                      <Text style={[
                        styles.bubbleText,
                        isUser ? styles.bubbleTextUser : styles.bubbleTextAssistant,
                      ]}>
                        {item.text}
                      </Text>

                      <Text style={[styles.bubbleTime, isUser && styles.bubbleTimeUser]}>
                        {item.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            }}
            ListFooterComponent={
              loading ? (
                <View style={styles.typingRow}>
                  <View style={styles.assistantAvatar}>
                    <MCIcon name="brain" size={16} color={DARK} />
                  </View>
                  <View style={styles.typingBubble}>
                    <View style={styles.typingDots}>
                      <ActivityIndicator size="small" color={MUTED} />
                      <Text style={styles.typingText}>Thinking…</Text>
                    </View>
                  </View>
                </View>
              ) : null
            }
          />

          {/* ── Center Mic ── */}
          <View style={styles.centerMicWrapper}>
            <TouchableOpacity
              style={[styles.centerMicButton, listening && styles.micButtonActive]}
              activeOpacity={0.85}
              onPress={handleMicPress}
              disabled={loading}
            >
              {listening
                ? <ActivityIndicator size="large" color={DARK} />
                : <MaterialIcons name="mic" size={32} color={DARK} />
              }
            </TouchableOpacity>
          </View>

          {/* ── Attach Menu Popup ── */}
          {showAttachMenu && (
            <View style={styles.attachMenu}>
              <TouchableOpacity style={styles.attachMenuItem} onPress={handleCamera}>
                <View style={styles.attachMenuIcon}>
                  <Ionicons name="camera" size={20} color={DARK} />
                </View>
                <Text style={styles.attachMenuLabel}>Camera</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.attachMenuItem} onPress={handleGalleryPick}>
                <View style={styles.attachMenuIcon}>
                  <Ionicons name="image" size={20} color={DARK} />
                </View>
                <Text style={styles.attachMenuLabel}>Gallery</Text>
              </TouchableOpacity>


            </View>
          )}

          {/* ── Attachments Preview ── */}
          {attachments.length > 0 && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.attachPreviewBar}
              contentContainerStyle={styles.attachPreviewContent}
            >
              {attachments.map(a => (
                <View key={a.id} style={styles.attachChip}>
                  {a.type === 'image' ? (
                    <Image source={{ uri: a.uri }} style={styles.attachThumb} />
                  ) : (
                    <View style={styles.attachFileIcon}>
                      <Ionicons name="document-text" size={18} color={DARK} />
                    </View>
                  )}
                  <Text style={styles.attachChipName} numberOfLines={1}>{a.name}</Text>
                  <TouchableOpacity onPress={() => removeAttachment(a.id)} style={styles.attachRemove}>
                    <Ionicons name="close-circle" size={16} color={DARK} />
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>
          )}

          {/* ── Input Bar ── */}
          <View style={styles.inputBar}>
            {/* Attach Button */}
            <TouchableOpacity
              style={styles.attachBtn}
              onPress={() => setShowAttachMenu(prev => !prev)}
              activeOpacity={0.8}
            >
              <Ionicons
                name={showAttachMenu ? 'close' : 'add'}
                size={22}
                color={DARK}
              />
            </TouchableOpacity>

            <TextInput
              style={styles.textInput}
              value={inputText}
              onChangeText={setInputText}
              placeholder="Type a message…"
              placeholderTextColor={MUTED}
              multiline
              maxLength={500}
              editable={!loading}
              onSubmitEditing={handleTextSend}
              blurOnSubmit={false}
            />

            <TouchableOpacity
              style={[styles.sendBtn, (!inputText.trim() && attachments.length === 0 || loading) && styles.sendBtnDisabled]}
              onPress={handleTextSend}
              disabled={loading || (!inputText.trim() && attachments.length === 0)}
              activeOpacity={0.8}
            >
              <Ionicons name="send" size={18} color={DARK} />
            </TouchableOpacity>
          </View>

        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }


  // ───────────────────────────────────────────────────────────
  // 🟡 WELCOME UI
  // ───────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >

        {/* ── Welcome Header ── */}
        <View style={styles.welcomeHeader}>
          <View style={styles.headerLeft}>
            <View style={styles.brainIconWrap}>
              <MCIcon name="brain" size={22} color={DARK} />
            </View>
            <View>
              <Text style={styles.chatHeaderEyebrow}>AI Assistant</Text>
              <Text style={styles.chatHeaderTitle}>Ask Anything</Text>
            </View>
          </View>
        </View>

        {/* ── Accent Bar ── */}
        <View style={styles.accentBar}>
          <View style={styles.accentLine} />
          <View style={[styles.accentLine, styles.accentLineShort]} />
        </View>

        <View style={styles.container}>
          <View style={styles.centerBlock}>
            <View style={styles.textContainer}>

              {/* Greeting pill */}
              <View style={styles.greetingPill}>
                <MCIcon name={getGreetingIcon()} size={16} color={DARK} />
                <Text style={styles.greeting}>{getGreeting()}</Text>
              </View>

              {/* Name block */}
              <View style={styles.nameCard}>
                <Text style={styles.hello}>Hello,</Text>
                <Text style={styles.name}>{state?.user?.name || 'Friend'}</Text>
              </View>

              {/* Divider */}
              <View style={styles.dividerRow}>
                <View style={styles.dividerLine} />
                <View style={styles.dividerDot} />
                <View style={styles.dividerLine} />
              </View>

              <Text style={styles.description}>
                I'm here to remind you and help{'\n'}with anything you need.
              </Text>


            </View>
          </View>

          {/* ── Mic Section ── */}
          <View style={styles.micWrapper}>
            <Animated.View
              style={[
                styles.pulseRing,
                { transform: [{ scale: pulseAnim }], opacity: pulseOpacity },
              ]}
            />

            <TouchableOpacity
              style={[styles.micButton, listening && styles.micButtonActive]}
              activeOpacity={0.88}
              onPress={handleMicPress}
            >
              {listening ? (
                <>
                  <ActivityIndicator size="large" color={DARK} />
                  <Text style={styles.listeningLabel}>Listening…</Text>
                </>
              ) : (
                <>
                  <MaterialIcons name="mic" size={52} color={DARK} />
                  <Text style={styles.tapLabel}>Tap to speak</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Attach Menu Popup ── */}
        {showAttachMenu && (
          <View style={styles.attachMenu}>
            <TouchableOpacity style={styles.attachMenuItem} onPress={handleCamera}>
              <View style={styles.attachMenuIcon}>
                <Ionicons name="camera" size={20} color={DARK} />
              </View>
              <Text style={styles.attachMenuLabel}>Camera</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.attachMenuItem} onPress={handleGalleryPick}>
              <View style={styles.attachMenuIcon}>
                <Ionicons name="image" size={20} color={DARK} />
              </View>
              <Text style={styles.attachMenuLabel}>Gallery</Text>
            </TouchableOpacity>

          </View>
        )}

        {/* ── Attachments Preview ── */}
        {attachments.length > 0 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.attachPreviewBar}
            contentContainerStyle={styles.attachPreviewContent}
          >
            {attachments.map(a => (
              <View key={a.id} style={styles.attachChip}>
                <Image source={{ uri: a.uri }} style={styles.attachThumb} />
                <Text style={styles.attachChipName} numberOfLines={1}>{a.name}</Text>
                <TouchableOpacity onPress={() => removeAttachment(a.id)} style={styles.attachRemove}>
                  <Ionicons name="close-circle" size={16} color={DARK} />
                </TouchableOpacity>
              </View>
            ))}
          </ScrollView>
        )}

        {/* ── Input Bar ── */}
        <View style={styles.inputBar}>
          {/* Attach Button */}
          <TouchableOpacity
            style={styles.attachBtn}
            onPress={() => setShowAttachMenu(prev => !prev)}
            activeOpacity={0.8}
          >
            <Ionicons
              name={showAttachMenu ? 'close' : 'add'}
              size={22}
              color={DARK}
            />
          </TouchableOpacity>

          <TextInput
            style={styles.textInput}
            value={inputText}
            onChangeText={setInputText}
            placeholder="Type a message…"
            placeholderTextColor={MUTED}
            multiline
            maxLength={500}
            editable={!loading}
            onSubmitEditing={handleTextSend}
            blurOnSubmit={false}
          />

          <TouchableOpacity
            style={[styles.sendBtn, (!inputText.trim() && attachments.length === 0 || loading) && styles.sendBtnDisabled]}
            onPress={handleTextSend}
            disabled={loading || (!inputText.trim() && attachments.length === 0)}
            activeOpacity={0.8}
          >
            <Ionicons name="send" size={18} color={DARK} />
          </TouchableOpacity>
        </View>

      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}


// ─────────────────────────────────────────────────────────────
// 🎨 Styles
// ─────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: BG,
    paddingBottom: 100,
  },

  // ── Header ─────────────────────────────────────────────────
  chatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 26,
    paddingTop: 10,
    paddingBottom: 18,
  },

  welcomeHeader: {
    paddingHorizontal: 26,
    paddingTop: 10,
    paddingBottom: 18,
  },

  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },

  brainIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: YELLOW,
    borderWidth: 1.5,
    borderColor: DARK,
    justifyContent: 'center',
    alignItems: 'center',
  },

  chatHeaderEyebrow: {
    fontSize: 13,
    fontFamily: 'Coolvetica-Regular',
    color: MUTED,
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: 4,
  },

  chatHeaderTitle: {
    fontSize: 34,
    fontFamily: 'Coolvetica-Heavy-Regular',
    color: DARK,
    lineHeight: 38,
  },

  sessionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#D1FAE5',
    gap: 6,
  },

  sessionDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#4ADE80',
  },

  sessionLabel: {
    fontSize: 13,
    fontFamily: 'Coolvetica-Bold',
    color: '#22C55E',
    letterSpacing: 0.5,
  },

  // ── Accent Bar ─────────────────────────────────────────────
  accentBar: {
    flexDirection: 'row',
    paddingHorizontal: 26,
    gap: 6,
    marginBottom: 10,
  },

  accentLine: {
    height: 3,
    flex: 1,
    backgroundColor: YELLOW,
    borderRadius: 4,
  },

  accentLineShort: {
    flex: 0,
    width: 24,
    backgroundColor: DARK,
  },

  // ── Welcome ────────────────────────────────────────────────
  container: {
    flex: 1,
    paddingHorizontal: 24,
    alignItems: 'center',
  },

  centerBlock: {
    flex: 1,
    justifyContent: 'center',
    width: '100%',
  },

  textContainer: {
    width: '100%',
    alignItems: 'center',
  },

  greetingPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: WHITE,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: BORDER,
    marginBottom: 24,
  },

  greeting: {
    fontSize: 14,
    fontFamily: 'Coolvetica-Bold',
    color: DARK,
    letterSpacing: 0.5,
  },

  nameCard: {
    backgroundColor: WHITE,
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: BORDER,
    paddingHorizontal: 32,
    paddingVertical: 20,
    alignItems: 'center',
    width: '100%',
    marginBottom: 20,
    shadowColor: DARK,
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
  },

  hello: {
    fontSize: 20,
    fontFamily: 'Coolvetica-Regular',
    color: MUTED,
    marginBottom: 4,
  },

  name: {
    fontSize: 44,
    fontFamily: 'Coolvetica-Heavy-Regular',
    color: DARK,
    lineHeight: 50,
  },

  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 20,
    width: '60%',
  },

  dividerLine: {
    flex: 1,
    height: 2,
    backgroundColor: BORDER,
    borderRadius: 2,
  },

  dividerDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: YELLOW,
    borderWidth: 1.5,
    borderColor: DARK,
  },

  description: {
    fontSize: 18,
    lineHeight: 26,
    fontFamily: 'Coolvetica-Regular',
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
  },

  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
  },

  chip: {
    backgroundColor: WHITE,
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: BORDER,
  },

  chipText: {
    fontSize: 14,
    fontFamily: 'Coolvetica-Bold',
    color: DARK,
  },

  // ── Mic ────────────────────────────────────────────────────
  micWrapper: {
    paddingBottom: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },

  micButton: {
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: YELLOW,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: DARK,
    shadowColor: DARK,
    shadowOpacity: 0.22,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 14,
  },

  micButtonActive: { backgroundColor: '#d6e836' },

  tapLabel: {
    marginTop: 10,
    fontSize: 20,
    fontFamily: 'Coolvetica-Bold',
    letterSpacing: 0.5,
    color: DARK,
  },

  listeningLabel: {
    marginTop: 10,
    fontSize: 20,
    fontFamily: 'Coolvetica-Bold',
    letterSpacing: 0.5,
    color: DARK,
  },

  // ── Chat messages ──────────────────────────────────────────
  messageList: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
    gap: 14,
  },

  bubbleRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
  },

  bubbleRowUser: { justifyContent: 'flex-end' },
  bubbleRowAssistant: { justifyContent: 'flex-start' },

  assistantAvatar: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: YELLOW,
    borderWidth: 1.5,
    borderColor: DARK,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 2,
  },

  bubble: {
    maxWidth: '78%',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1.5,
  },

  bubbleSpeaking: {
    borderColor: DARK,
    shadowColor: DARK,
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },

  bubbleUser: {
    backgroundColor: YELLOW,
    borderColor: DARK,
    borderBottomRightRadius: 4,
  },

  bubbleAssistant: {
    backgroundColor: WHITE,
    borderColor: BORDER,
    borderBottomLeftRadius: 4,
  },

  bubbleRoleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 5,
  },

  bubbleRole: {
    fontSize: 11,
    fontFamily: 'Coolvetica-Bold',
    color: MUTED,
    letterSpacing: 0.8,
  },

  bubbleText: {
    fontSize: 16,
    lineHeight: 23,
  },

  bubbleTextUser: {
    fontFamily: 'Coolvetica-Regular',
    color: DARK,
  },

  bubbleTextAssistant: {
    fontFamily: 'Coolvetica-Regular',
    color: '#333',
  },

  bubbleTime: {
    fontSize: 11,
    fontFamily: 'Coolvetica-Regular',
    color: MUTED,
    marginTop: 6,
    textAlign: 'right',
  },

  bubbleTimeUser: {
    color: '#666',
  },

  // ── Typing ─────────────────────────────────────────────────
  typingRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    paddingHorizontal: 16,
    marginTop: 4,
  },

  typingBubble: {
    backgroundColor: WHITE,
    borderWidth: 1.5,
    borderColor: BORDER,
    borderRadius: 20,
    borderBottomLeftRadius: 4,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },

  typingDots: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  typingText: {
    fontSize: 14,
    fontFamily: 'Coolvetica-Regular',
    color: MUTED,
  },

  // ── Center Mic (chat view) ─────────────────────────────────
  centerMicWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    backgroundColor: 'transparent',
  },

  centerMicButton: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: YELLOW,
    borderWidth: 2,
    borderColor: DARK,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: DARK,
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 10,
  },

  // ── Input Bar ──────────────────────────────────────────────
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 10,
    paddingBottom: 30,
    borderTopWidth: 1,
    borderTopColor: BORDER,
    backgroundColor: BG,
    gap: 10,
  },

  textInput: {
    flex: 1,
    minHeight: 46,
    maxHeight: 110,
    backgroundColor: WHITE,
    borderWidth: 1.5,
    borderColor: BORDER,
    borderRadius: 24,
    paddingHorizontal: 18,
    paddingTop:    Platform.OS === 'ios' ? 13 : 9,
    paddingBottom: Platform.OS === 'ios' ? 13 : 9,
    fontSize: 16,
    fontFamily: 'Coolvetica-Regular',
    color: DARK,
  },

  sendBtn: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: YELLOW,
    borderWidth: 1.5,
    borderColor: DARK,
    justifyContent: 'center',
    alignItems: 'center',
  },

  sendBtnDisabled: {
    opacity: 0.4,
  },

  // ── Attach Menu ───────────────────────────────────────────
  attachBtn: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: WHITE,
    borderWidth: 1.5,
    borderColor: BORDER,
    justifyContent: 'center',
    alignItems: 'center',
  },

attachMenu: {
  position: 'absolute',
  bottom: 80, // adjust based on your input bar height
  left: 16,
  right: 16,

  flexDirection: 'row',
  paddingHorizontal: 16,
  paddingVertical: 14,
  gap: 14,

  backgroundColor: WHITE,
  borderRadius: 20,

  borderWidth: 1,
  borderColor: BORDER,

  shadowColor: '#000',
  shadowOpacity: 0.15,
  shadowRadius: 15,
  shadowOffset: { width: 0, height: 8 },
  elevation: 12,

  zIndex: 999,
},

  attachMenuItem: {
    alignItems: 'center',
    gap: 6,
  },

  attachMenuIcon: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: BG,
    borderWidth: 1.5,
    borderColor: BORDER,
    justifyContent: 'center',
    alignItems: 'center',
  },

  attachMenuLabel: {
    fontSize: 12,
    fontFamily: 'Coolvetica-Bold',
    color: DARK,
    letterSpacing: 0.4,
  },

  // ── Attach Preview ────────────────────────────────────────
  attachPreviewBar: {
    backgroundColor: BG,
    borderTopWidth: 1,
    borderTopColor: BORDER,
    maxHeight: 90,
  },

  attachPreviewContent: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 10,
    alignItems: 'center',
  },

  attachChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: WHITE,
    borderWidth: 1.5,
    borderColor: BORDER,
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 6,
    gap: 6,
    maxWidth: 160,
  },

  attachThumb: {
    width: 36,
    height: 36,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: BORDER,
  },

  attachFileIcon: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: YELLOW,
    borderWidth: 1.5,
    borderColor: DARK,
    justifyContent: 'center',
    alignItems: 'center',
  },

  attachChipName: {
    flex: 1,
    fontSize: 12,
    fontFamily: 'Coolvetica-Regular',
    color: DARK,
  },

  attachRemove: {
    padding: 2,
  },
});