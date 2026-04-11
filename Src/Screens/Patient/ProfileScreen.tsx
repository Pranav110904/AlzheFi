import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useAuth } from '../../Context/AuthContext';

const YELLOW = '#E3F73F';
const DARK   = '#1F2937';
const BG     = '#F4F1EC';
const MUTED  = '#9CA3AF';
const BORDER = '#E5E0D8';
const WHITE  = '#FFFFFF';

export default function ProfileScreen() {

  // ✅ Correct function from AuthContext
  const { state, signOut } = useAuth();
  const user = state?.user;

  const [notificationsEnabled, setNotificationsEnabled] = React.useState(true);
  const [voiceEnabled, setVoiceEnabled] = React.useState(true);
  const [largeText, setLargeText] = React.useState(false);

  // ✅ Logout connected correctly
  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              await signOut();
            } catch (error) {
              console.log('Logout error:', error);
            }
          },
        },
      ],
      { cancelable: true }
    );
  };

  const handleToggle = (id: string, value: boolean) => {
    if (id === 'notifications') setNotificationsEnabled(value);
    if (id === 'voice') setVoiceEnabled(value);
    if (id === 'text') setLargeText(value);
  };

  const profileSections = [
    {
      eyebrow: 'Your details',
      title: 'Account',
      items: [
        { id: 'name', icon: 'account', iconColor: '#93C5FD', label: 'Name', value: user?.name || 'N/A', hasArrow: true },
        { id: 'email', icon: 'email-outline', iconColor: '#86EFAC', label: 'Email', value: user?.email || 'N/A', hasArrow: true },
        { id: 'caregiver', icon: 'doctor', iconColor: '#F9A8D4', label: 'Caregiver', value: 'Sarah (Wife)', hasArrow: true },
      ],
    },
    
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>

      <View style={styles.header}>
        <View>
          <Text style={styles.headerEyebrow}>Your Account</Text>
          <Text style={styles.headerTitle}>Profile</Text>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

        <View style={styles.profileCard}>
          <View style={styles.avatarRing}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {user?.name?.charAt(0).toUpperCase() || 'U'}
              </Text>
            </View>
          </View>

          <Text style={styles.profileName}>{user?.name || 'Patient'}</Text>

          <View style={styles.roleBadge}>
            <Icon name="hospital-box-outline" size={13} color={DARK} />
            <Text style={styles.roleBadgeText}>
              {user?.role === 'caregiver' ? 'Caregiver Account' : 'Patient Account'}
            </Text>
          </View>

          <Text style={styles.profileEmail}>{user?.email || ''}</Text>
        </View>

        {profileSections.map((section) => (
          <View key={section.title} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title}</Text>

            <View style={styles.sectionCard}>
              {section.items.map((item) => (
                <View key={item.id}>
                  <View style={styles.row}>
                    <View style={[styles.rowIcon, { backgroundColor: item.iconColor + '33' }]}>
                      <Icon name={item.icon} size={18} color={DARK} />
                    </View>

                    <View style={styles.rowInfo}>
                      <Text style={styles.rowLabel}>{item.label}</Text>
                      {'value' in item && !item.toggle && (
                        <Text style={styles.rowValue}>{item.value}</Text>
                      )}
                    </View>

                    
                  </View>
                </View>
              ))}
            </View>
          </View>
        ))}

        {/* Logout Section (UI unchanged) */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account Actions</Text>

          <View style={styles.sectionCard}>
            <TouchableOpacity
              style={styles.row}
              activeOpacity={0.8}
              onPress={handleLogout}
            >
              <View style={[styles.rowIcon, { backgroundColor: '#FEE2E2' }]}>
                <Icon name="logout" size={18} color="#DC2626" />
              </View>
              <View style={styles.rowInfo}>
                <Text style={[styles.rowLabel, { color: '#DC2626' }]}>
                  Logout
                </Text>
              </View>
              
            </TouchableOpacity>
          </View>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG  ,paddingBottom: 50 },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 26, paddingTop: 10, paddingBottom: 18,
  },
  headerEyebrow: {
    fontSize: 13, fontFamily: 'Coolvetica-Regular', color: MUTED,
    letterSpacing: 2, textTransform: 'uppercase', marginBottom: 4,
  },
  headerTitle: { fontSize: 34, fontFamily: 'Coolvetica-Heavy-Regular', color: DARK, lineHeight: 38 },
  editBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: YELLOW, paddingHorizontal: 16, paddingVertical: 10,
    borderRadius: 24, borderWidth: 1.5, borderColor: DARK,
    shadowColor: DARK, shadowOpacity: 0.1, shadowRadius: 8, elevation: 4,
  },
  editBtnText: { fontSize: 15, fontFamily: 'Coolvetica-Bold', color: DARK },

  accentBar: { flexDirection: 'row', paddingHorizontal: 26, gap: 6, marginBottom: 20 },
  accentLine: { height: 3, flex: 1, backgroundColor: YELLOW, borderRadius: 4 },
  accentLineShort: { flex: 0, width: 24, backgroundColor: DARK },

  scrollContent: { paddingHorizontal: 20, paddingBottom: 20 },

  profileCard: {
    backgroundColor: WHITE, borderRadius: 24, borderWidth: 1.5, borderColor: BORDER,
    padding: 24, alignItems: 'center', marginBottom: 24,
    shadowColor: DARK, shadowOpacity: 0.06, shadowRadius: 12, elevation: 4,
  },
  avatarRing: {
    width: 92, height: 92, borderRadius: 46, backgroundColor: YELLOW,
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 2, borderColor: DARK, marginBottom: 16,
    shadowColor: DARK, shadowOpacity: 0.15, shadowRadius: 10, elevation: 6,
  },
  avatar: { width: 76, height: 76, borderRadius: 38, backgroundColor: DARK, justifyContent: 'center', alignItems: 'center' },
  avatarText: { fontSize: 32, fontFamily: 'Coolvetica-Heavy-Regular', color: YELLOW },
  profileName: { fontSize: 26, fontFamily: 'Coolvetica-Heavy-Regular', color: DARK, marginBottom: 8 },
  roleBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: YELLOW + '55', paddingHorizontal: 14, paddingVertical: 6,
    borderRadius: 20, borderWidth: 1.5, borderColor: DARK, marginBottom: 10,
  },
  roleBadgeText: { fontSize: 13, fontFamily: 'Coolvetica-Bold', color: DARK },
  profileEmail: { fontSize: 14, fontFamily: 'Coolvetica-Regular', color: MUTED },

  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 28 },
  statCard: {
    flex: 1, backgroundColor: WHITE, borderRadius: 18, borderWidth: 1.5,
    borderColor: BORDER, padding: 14, alignItems: 'center',
    shadowColor: DARK, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },
  statIconWrap: { width: 42, height: 42, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  statValue: { fontSize: 22, fontFamily: 'Coolvetica-Heavy-Regular', color: DARK, marginBottom: 2 },
  statLabel: { fontSize: 11, fontFamily: 'Coolvetica-Regular', color: MUTED, textAlign: 'center' },

  section: { marginBottom: 24 },
  sectionHeader: { marginBottom: 12, marginLeft: 2 },
  sectionEyebrow: {
    fontSize: 11, fontFamily: 'Coolvetica-Bold', color: MUTED,
    letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 2,
  },
  sectionTitle: { fontSize: 20, fontFamily: 'Coolvetica-Heavy-Regular', color: DARK },
  sectionCard: {
    backgroundColor: WHITE, borderRadius: 18, borderWidth: 1.5,
    borderColor: BORDER, overflow: 'hidden',
    shadowColor: DARK, shadowOpacity: 0.05, shadowRadius: 10, elevation: 2,
  },

  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 16, gap: 14 },
  rowIcon: { width: 42, height: 42, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  rowInfo: { flex: 1 },
  rowLabel: { fontSize: 16, fontFamily: 'Coolvetica-Bold', color: DARK },
  rowValue: { fontSize: 13, fontFamily: 'Coolvetica-Regular', color: MUTED, marginTop: 2 },
  divider: { height: 1, backgroundColor: BORDER, marginLeft: 72 },

  appInfo: { alignItems: 'center', paddingVertical: 70, gap: 4 },
  appInfoBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  appInfoName: { fontSize: 15, fontFamily: 'Coolvetica-Bold', color: DARK },
  appVersion: { fontSize: 13, fontFamily: 'Coolvetica-Regular', color: MUTED },
  appCopyright: { fontSize: 12, fontFamily: 'Coolvetica-Regular', color: MUTED },
});