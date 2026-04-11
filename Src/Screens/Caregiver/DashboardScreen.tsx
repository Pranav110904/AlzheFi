// ─────────────────────────────────────────────────────────────
// 📦 Imports
// ─────────────────────────────────────────────────────────────
import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Animated,
  Linking,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MCIcon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../../Context/AuthContext';
import { apiService } from '../../Services/apiService';

// ─────────────────────────────────────────────────────────────
// 🎨 Theme Constants
// ─────────────────────────────────────────────────────────────
const YELLOW = '#E3F73F';
const DARK   = '#1F2937';
const BG     = '#F4F1EC';
const MUTED  = '#9CA3AF';
const BORDER = '#E5E0D8';
const WHITE  = '#FFFFFF';

// ─────────────────────────────────────────────────────────────
// 🛠 Helpers
// ─────────────────────────────────────────────────────────────
const getGreeting = () => {
  const h = new Date().getHours();
  if (h < 12) return 'Good Morning';
  if (h < 18) return 'Good Afternoon';
  return 'Good Evening';
};

// ─────────────────────────────────────────────────────────────
// 🖥 Screen
// ─────────────────────────────────────────────────────────────
export default function CaregiverDashboardScreen() {
  const { state } = useAuth();
  const navigation = useNavigation<any>();

  // ── Stats state ───────────────────────────────────────────
  const [activePatients, setActivePatients] = useState<number>(0);
  const [pendingTasks, setPendingTasks]     = useState<number>(0);
  const [statsLoading, setStatsLoading]     = useState(true);
  const [refreshing, setRefreshing]         = useState(false);

  // ── Link state ────────────────────────────────────────────
  const [linkEmail, setLinkEmail]     = useState('');
  const [linkLoading, setLinkLoading] = useState(false);
  const [linkError, setLinkError]     = useState('');
  const [linkSuccess, setLinkSuccess] = useState('');

  // ── Refs ──────────────────────────────────────────────────
  const scrollRef     = useRef<ScrollView>(null);
  const linkCardRef   = useRef<View>(null);
  const highlightAnim = useRef(new Animated.Value(0)).current;

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric',
  });

 // ─────────────────────────────────────────────────────────
  const fetchStats = useCallback(async () => {
    try {
      const patients = await apiService.getLinkedPatients();
      setActivePatients(patients.length);

      if (patients.length === 0) {
        setPendingTasks(0);
        return;
      }

      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);

      // Fetch every patient's events in parallel
      const eventArrays = await Promise.allSettled(
        patients.map((p: any) =>
          (apiService as any).getPatientEvents(p._id ?? p.id ?? '')
        )
      );

      let total = 0;
      eventArrays.forEach(result => {
        if (result.status === 'fulfilled') {
          const events: any[] = result.value ?? [];
          events.forEach(event => {
            // Backend stores date as `datetime` field (confirmed from your route)
            const d = new Date(event.datetime);
            if (!isNaN(d.getTime()) && d >= todayStart) {
              total += 1;
            }
          });
        }
      });

      setPendingTasks(total);

    } catch {
      // keep previous values on network error
    } finally {
      setStatsLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchStats(); }, [fetchStats]);

  useFocusEffect(
    useCallback(() => { fetchStats(); }, [fetchStats])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchStats();
  };

  // ── Link card highlight ───────────────────────────────────
  const handleLinkPatientPress = () => {
    linkCardRef.current?.measureLayout(
      scrollRef.current?.getScrollableNode() as any,
      (_x, y) => scrollRef.current?.scrollTo({ y: y - 24, animated: true }),
      () => {}
    );
    setTimeout(() => {
      highlightAnim.setValue(0);
      Animated.sequence([
        Animated.timing(highlightAnim, { toValue: 1, duration: 250, useNativeDriver: false }),
        Animated.timing(highlightAnim, { toValue: 0, duration: 1200, useNativeDriver: false }),
      ]).start();
    }, 380);
  };

  const animatedBorderColor = highlightAnim.interpolate({
    inputRange: [0, 1], outputRange: [BORDER, YELLOW],
  });
  const animatedShadowOpacity = highlightAnim.interpolate({
    inputRange: [0, 1], outputRange: [0, 0.55],
  });
  const animatedShadowRadius = highlightAnim.interpolate({
    inputRange: [0, 1], outputRange: [0, 18],
  });

  // ── Link patient ──────────────────────────────────────────
  const handleLinkPatient = async () => {
    const email = linkEmail.trim().toLowerCase();
    if (!email) { setLinkError('Please enter a patient email.'); return; }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) { setLinkError('Enter a valid email address.'); return; }

    setLinkLoading(true);
    setLinkError('');
    setLinkSuccess('');
    try {
      await apiService.linkPatient(email);
      setLinkSuccess('Patient linked successfully! 🎉');
      setLinkEmail('');
      fetchStats();
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Could not link patient. Please try again.';
      setLinkError(msg);
    } finally {
      setLinkLoading(false);
    }
  };

  const quickActions = [
    { id: '1', icon: 'image-plus',       label: 'Add Memory',    onPress: () => navigation.navigate('Memories')  },
    { id: '2', icon: 'bell-plus',        label: 'Set Reminder',  onPress: () => navigation.navigate('Reminders') },
    { id: '3', icon: 'account-multiple', label: 'View Patients', onPress: () => navigation.navigate('Patients')  },
  ];

  // ── Stat Card ─────────────────────────────────────────────
  const StatCard = ({ icon, label, value }: { icon: string; label: string; value: number }) => (
    <View style={styles.statCard}>
      <MCIcon name={icon} size={26} color={DARK} />
      {statsLoading
        ? <View style={styles.statSkeleton} />
        : <Text style={styles.statValue}>{value}</Text>
      }
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          ref={scrollRef}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={DARK}
              colors={[DARK]}
            />
          }
        >
        {/* ── Header ─────────────────────────────────────── */}
        <View style={styles.header}>

        {/* Top row: icon + avatar */}
        <View style={styles.headerTopRow}>
            <View style={styles.brainIconWrap}>
            <MCIcon name="stethoscope" size={22} color={DARK} />
            </View>
            <View style={styles.avatarCircle}>
            <Text style={styles.avatarText}>
                {(state?.user?.name?.charAt(0) || 'C').toUpperCase()}
            </Text>
            </View>
        </View>

        {/* Big editorial greeting block */}
        <View style={styles.headerHero}>
            <Text style={styles.greetingEyebrow}>{getGreeting()} —</Text>
            <View style={styles.nameBlock}>
            <Text style={styles.headerDr}>Dr.</Text>
            <View style={styles.namePill}>
                <Text style={styles.headerName}>
                {state?.user?.name?.split(' ')[0] || 'Caregiver'}
                </Text>
            </View>
            </View>
            <Text style={styles.headerSub}>{today}</Text>
        </View>

        {/* Accent bar built into header */}
        <View style={styles.headerAccentBar}>
            <View style={styles.accentLine} />
            <View style={[styles.accentLine, styles.accentLineShort]} />
        </View>

        </View>

          {/* ── Stats ──────────────────────────────────────── */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>TODAY'S OVERVIEW</Text>
            <View style={styles.statsGrid}>
              <StatCard icon="account-group" label="Active Patients" value={activePatients} />
              <StatCard icon="bell-alert"    label="Pending Tasks"   value={pendingTasks}   />
            </View>
          </View>

          {/* ── Link Patient ───────────────────────────────── */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>LINK A PATIENT</Text>
            <Animated.View
              ref={linkCardRef}
              style={[
                styles.linkCard,
                {
                  borderColor: animatedBorderColor,
                  shadowColor: YELLOW,
                  shadowOffset: { width: 0, height: 0 },
                  shadowOpacity: animatedShadowOpacity,
                  shadowRadius: animatedShadowRadius,
                  elevation: 0,
                },
              ]}
            >
              <View style={styles.linkHeader}>
                <View style={styles.linkIconWrap}>
                  <MCIcon name="account-plus-outline" size={24} color={DARK} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.linkTitle}>Connect a Patient</Text>
                  <Text style={styles.linkSub}>
                    Enter the patient's registered email to link them to your account
                  </Text>
                </View>
              </View>

              <View style={styles.linkInputRow}>
                <View style={styles.linkInputWrap}>
                  <MCIcon name="email-outline" size={18} color={MUTED} style={{ marginRight: 8 }} />
                  <TextInput
                    style={styles.linkInput}
                    placeholder="patient@email.com"
                    placeholderTextColor={MUTED}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    value={linkEmail}
                    onChangeText={t => { setLinkEmail(t); setLinkError(''); setLinkSuccess(''); }}
                    editable={!linkLoading}
                  />
                </View>
                <TouchableOpacity
                  style={[styles.linkBtn, linkLoading && { opacity: 0.6 }]}
                  onPress={handleLinkPatient}
                  disabled={linkLoading}
                  activeOpacity={0.85}
                >
                  {linkLoading
                    ? <ActivityIndicator size="small" color={DARK} />
                    : <MCIcon name="link-variant" size={20} color={DARK} />
                  }
                </TouchableOpacity>
              </View>

              {!!linkError && (
                <View style={styles.linkFeedback}>
                  <MCIcon name="alert-circle-outline" size={14} color="#991B1B" />
                  <Text style={styles.linkErrorText}>{linkError}</Text>
                </View>
              )}
              {!!linkSuccess && (
                <View style={[styles.linkFeedback, styles.linkSuccessBg]}>
                  <MCIcon name="check-circle-outline" size={14} color="#065F46" />
                  <Text style={styles.linkSuccessText}>{linkSuccess}</Text>
                </View>
              )}
            </Animated.View>
          </View>

          {/* ── Quick Actions ──────────────────────────────── */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>QUICK ACTIONS</Text>
            <View style={styles.quickGrid}>
              {quickActions.map(a => (
                <TouchableOpacity
                  key={a.id}
                  style={styles.quickCard}
                  onPress={a.onPress}
                  activeOpacity={0.8}
                >
                  <View style={styles.quickIconWrap}>
                    <MCIcon name={a.icon} size={22} color={DARK} />
                  </View>
                  <Text style={styles.quickLabel}>{a.label}</Text>
                  <MCIcon name="chevron-right" size={16} color={MUTED} />
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* ── Emergency ──────────────────────────────────── */}
          <View style={[styles.section, { marginBottom: 0 }]}>
            <View style={styles.emergencyCard}>
              <View style={styles.emergencyHeader}>
                <MCIcon name="alarm-light-outline" size={24} color="#991B1B" />
                <Text style={styles.emergencyTitle}>Emergency Support</Text>
              </View>
              <Text style={styles.emergencyText}>
                24/7 support line for urgent patient care needs
              </Text>
              <TouchableOpacity
                style={styles.emergencyBtn}
                activeOpacity={0.85}
                onPress={() => Linking.openURL('tel:108')}
              >
                <MCIcon name="phone" size={18} color={WHITE} style={{ marginRight: 8 }} />
                <Text style={styles.emergencyBtnText}>Call Support</Text>
              </TouchableOpacity>
            </View>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ─────────────────────────────────────────────────────────────
// 🎨 Styles
// ─────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: BG },
  scrollContent: { paddingBottom: 120 },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 26, paddingTop: 14, paddingBottom: 4, backgroundColor: WHITE,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  brainIconWrap: {
    width: 48, height: 48, borderRadius: 14,
    backgroundColor: YELLOW, borderWidth: 1.5, borderColor: DARK,
    justifyContent: 'center', alignItems: 'center',
  },
  eyebrow: {
    fontSize: 13, fontFamily: 'Coolvetica-Regular',
    color: MUTED, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 2,
  },
  headerTitle: { fontSize: 22, fontFamily: 'Coolvetica-Heavy-Regular', color: DARK },
  avatarCircle: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: DARK, justifyContent: 'center', alignItems: 'center',
  },
  avatarText: { fontSize: 20, fontFamily: 'Coolvetica-Heavy-Regular', color: YELLOW },
  dateText: {
    fontSize: 13, fontFamily: 'Coolvetica-Regular', color: MUTED,
    paddingHorizontal: 26, paddingBottom: 14, backgroundColor: WHITE,
  },

  accentBar: {
    flexDirection: 'row', paddingHorizontal: 26, gap: 6,
    marginBottom: 24, backgroundColor: WHITE, paddingBottom: 16,
  },
  accentLine: { height: 3, flex: 1, backgroundColor: YELLOW, borderRadius: 4 },
  accentLineShort: { flex: 0, width: 24, backgroundColor: DARK },

  section: { paddingHorizontal: 20, marginBottom: 28 },
  sectionLabel: {
    fontSize: 11, fontFamily: 'Coolvetica-Bold',
    color: MUTED, letterSpacing: 1.2, marginBottom: 14,
  },

  statsGrid: { flexDirection: 'row', gap: 12 },
  statCard: {
    flex: 1, backgroundColor: WHITE, borderRadius: 16,
    borderWidth: 1.5, borderColor: BORDER, padding: 18, alignItems: 'center',
  },
  statValue: {
    fontSize: 30, fontFamily: 'Coolvetica-Heavy-Regular',
    color: DARK, marginTop: 10, marginBottom: 4,
  },
  statSkeleton: {
    width: 48, height: 36, borderRadius: 8,
    backgroundColor: BORDER, marginTop: 10, marginBottom: 4,
  },
  statLabel: {
    fontSize: 11, fontFamily: 'Coolvetica-Bold',
    color: MUTED, textAlign: 'center',
  },

  linkCard: {
    backgroundColor: WHITE, borderRadius: 18,
    borderWidth: 2, borderColor: BORDER, padding: 18,
  },
  linkHeader: { flexDirection: 'row', gap: 14, marginBottom: 16 },
  linkIconWrap: {
    width: 48, height: 48, borderRadius: 14,
    backgroundColor: YELLOW, borderWidth: 1.5, borderColor: DARK,
    justifyContent: 'center', alignItems: 'center',
  },
  linkTitle: { fontSize: 16, fontFamily: 'Coolvetica-Bold', color: DARK, marginBottom: 4 },
  linkSub: { fontSize: 12, fontFamily: 'Coolvetica-Regular', color: MUTED, lineHeight: 17 },
  linkInputRow: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  linkInputWrap: {
    flex: 1, flexDirection: 'row', alignItems: 'center',
    backgroundColor: BG, borderWidth: 1.5, borderColor: BORDER,
    borderRadius: 14, paddingHorizontal: 14, height: 48,
  },
  linkInput: {
    flex: 1, fontSize: 14, fontFamily: 'Coolvetica-Regular', color: DARK, padding: 0,
  },
  linkBtn: {
    width: 48, height: 48, borderRadius: 14,
    backgroundColor: YELLOW, borderWidth: 1.5, borderColor: DARK,
    justifyContent: 'center', alignItems: 'center',
  },
  linkFeedback: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    marginTop: 10, backgroundColor: '#FEF0EE', borderRadius: 10, padding: 10,
  },
  linkSuccessBg: { backgroundColor: '#ECFDF5' },
  linkErrorText: { fontSize: 12, fontFamily: 'Coolvetica-Regular', color: '#991B1B', flex: 1 },
  linkSuccessText: { fontSize: 12, fontFamily: 'Coolvetica-Regular', color: '#065F46', flex: 1 },

  quickGrid: { gap: 10 },
  quickCard: {
    backgroundColor: WHITE, borderRadius: 14, borderWidth: 1.5, borderColor: BORDER,
    padding: 16, flexDirection: 'row', alignItems: 'center', gap: 12,
  },
  quickIconWrap: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: YELLOW, borderWidth: 1.5, borderColor: DARK,
    justifyContent: 'center', alignItems: 'center',
  },
  quickLabel: { fontSize: 14, fontFamily: 'Coolvetica-Bold', color: DARK, flex: 1 },

  emergencyCard: {
    backgroundColor: '#FEF0EE', borderWidth: 1.5,
    borderColor: '#FECACA', borderRadius: 16, padding: 20,
  },
  emergencyHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  emergencyTitle: { fontSize: 17, fontFamily: 'Coolvetica-Heavy-Regular', color: '#991B1B' },
  emergencyText: {
    fontSize: 13, fontFamily: 'Coolvetica-Regular',
    color: '#7F1D1D', lineHeight: 20, marginBottom: 16,
  },
  emergencyBtn: {
    backgroundColor: '#EF4444', borderRadius: 12, padding: 14,
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center',
  },
  emergencyBtnText: { fontSize: 15, fontFamily: 'Coolvetica-Bold', color: WHITE },

  // ── Header (replace all old header styles) ──────────────────
header: {
  backgroundColor: WHITE,
  paddingTop: 16,
  paddingBottom: 0,
},
headerTopRow: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
  paddingHorizontal: 24,
  marginBottom: 20,
},
brainIconWrap: {
  width: 44, height: 44, borderRadius: 12,
  backgroundColor: YELLOW, borderWidth: 1.5, borderColor: DARK,
  justifyContent: 'center', alignItems: 'center',
},
avatarCircle: {
  width: 44, height: 44, borderRadius: 22,
  backgroundColor: DARK, justifyContent: 'center', alignItems: 'center',
},
avatarText: {
  fontSize: 18, fontFamily: 'Coolvetica-Heavy-Regular', color: YELLOW,
},

// ── Hero text block ─────────────────────────────────────────
headerHero: {
  paddingHorizontal: 24,
  paddingBottom: 22,
},
greetingEyebrow: {
  fontSize: 13, fontFamily: 'Coolvetica-Regular',
  color: MUTED, letterSpacing: 2, textTransform: 'uppercase',
  marginBottom: 6,
},
nameBlock: {
  flexDirection: 'row',
  alignItems: 'center',
  gap: 10,
  marginBottom: 10,
  flexWrap: 'wrap',
},
headerDr: {
  fontSize: 48, fontFamily: 'Coolvetica-Heavy-Regular',
  color: MUTED, lineHeight: 50,
},
namePill: {
  backgroundColor: YELLOW,
  borderRadius: 12,
  borderWidth: 1.5,
  borderColor: DARK,
  paddingHorizontal: 14,
  paddingVertical: 4,
},
headerName: {
  fontSize: 48, fontFamily: 'Coolvetica-Heavy-Regular',
  color: DARK, lineHeight: 54,
},
headerSub: {
  fontSize: 12, fontFamily: 'Coolvetica-Regular',
  color: MUTED, letterSpacing: 0.5,
},

// ── Accent bar (inside header now) ─────────────────────────
headerAccentBar: {
  flexDirection: 'row',
  paddingHorizontal: 24,
  gap: 6,
  paddingBottom: 18,
  backgroundColor: WHITE,
},
});