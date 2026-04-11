import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useAuth } from '../../Context/AuthContext';
import { apiService } from '../../Services/apiService'; // 👈 IMPORTANT

const YELLOW = '#E3F73F';
const DARK   = '#1F2937';
const BG     = '#F4F1EC';
const MUTED  = '#9CA3AF';
const BORDER = '#E5E0D8';
const WHITE  = '#FFFFFF';

const ProfileScreen = () => {

  const { state, signOut } = useAuth();
  const user = state?.user;

  // ✅ CAREGIVER LOGOUT (FINAL FIXED)
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
            // 1️⃣ Clear storage
            await apiService.logout();

            // 2️⃣ Clear auth context
            await signOut();

            // 3️⃣ 🔥 FORCE NAVIGATION RESET (IMPORTANT)
            // If using React Navigation:
            // navigation.reset({
            //   index: 0,
            //   routes: [{ name: 'Login' }],
            // });

          } catch (error) {
            console.log('Logout error:', error);
          }
        },
      },
    ],
    { cancelable: true }
  );
};

  const profileSections = [
    {
      title: 'Account',
      items: [
        {
          id: 'name',
          icon: 'account',
          iconColor: '#93C5FD',
          label: 'Name',
          value: user?.name || 'N/A',
        },
        {
          id: 'email',
          icon: 'email-outline',
          iconColor: '#86EFAC',
          label: 'Email',
          value: user?.email || 'N/A',
        },
        {
          id: 'role',
          icon: 'account-heart',
          iconColor: '#F9A8D4',
          label: 'Role',
          value:
            user?.role === 'caregiver'
              ? 'Caregiver'
              : 'Patient',
        },
      ],
    },
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>

      {/* HEADER */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerEyebrow}>Your Account</Text>
          <Text style={styles.headerTitle}>Profile</Text>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >

        {/* PROFILE CARD */}
        <View style={styles.profileCard}>
          <View style={styles.avatarRing}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {user?.name?.charAt(0).toUpperCase() || 'U'}
              </Text>
            </View>
          </View>

          <Text style={styles.profileName}>
            {user?.name || 'User'}
          </Text>

          <View style={styles.roleBadge}>
            <Icon name="hospital-box-outline" size={13} color={DARK} />
            <Text style={styles.roleBadgeText}>
              {user?.role === 'caregiver'
                ? 'Caregiver Account'
                : 'Patient Account'}
            </Text>
          </View>

          <Text style={styles.profileEmail}>
            {user?.email || ''}
          </Text>
        </View>

        {/* ACCOUNT DETAILS */}
        {profileSections.map((section) => (
          <View key={section.title} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title}</Text>

            <View style={styles.sectionCard}>
              {section.items.map((item) => (
                <View key={item.id} style={styles.row}>
                  <View
                    style={[
                      styles.rowIcon,
                      { backgroundColor: item.iconColor + '33' },
                    ]}
                  >
                    <Icon name={item.icon} size={18} color={DARK} />
                  </View>

                  <View style={styles.rowInfo}>
                    <Text style={styles.rowLabel}>
                      {item.label}
                    </Text>
                    <Text style={styles.rowValue}>
                      {item.value}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        ))}

        {/* LOGOUT SECTION */}
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
};

export default ProfileScreen;
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG, paddingBottom: 50 },

  header: {
    paddingHorizontal: 26,
    paddingTop: 10,
    paddingBottom: 18,
  },

  headerEyebrow: {
    fontSize: 13,
    fontFamily: 'Coolvetica-Regular',   // ✅ FIXED
    color: MUTED,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },

  headerTitle: {
    fontSize: 34,
    fontFamily: 'Coolvetica-Heavy-Regular',  // ✅ FIXED
    color: DARK,
  },

  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },

  profileCard: {
    backgroundColor: WHITE,
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: BORDER,
    padding: 24,
    alignItems: 'center',
    marginBottom: 24,
  },

  avatarRing: {
    width: 92,
    height: 92,
    borderRadius: 46,
    backgroundColor: YELLOW,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },

  avatar: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: DARK,
    justifyContent: 'center',
    alignItems: 'center',
  },

  avatarText: {
    fontSize: 32,
    fontFamily: 'Coolvetica-Heavy-Regular', // ✅ FIXED
    color: YELLOW,
  },

  profileName: {
    fontSize: 26,
    fontFamily: 'Coolvetica-Heavy-Regular', // ✅ FIXED
    color: DARK,
  },

  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: YELLOW + '55',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 10,
  },

  roleBadgeText: {
    fontSize: 13,
    fontFamily: 'Coolvetica-Bold',   // ✅ FIXED
    color: DARK,
  },

  profileEmail: {
    fontSize: 14,
    fontFamily: 'Coolvetica-Regular',  // ✅ FIXED
    color: MUTED,
  },

  section: { marginBottom: 24 },

  sectionTitle: {
    fontSize: 20,
    fontFamily: 'Coolvetica-Heavy-Regular', // ✅ FIXED
    color: DARK,
    marginBottom: 10,
  },

  sectionCard: {
    backgroundColor: WHITE,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: BORDER,
  },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    gap: 14,
  },

  rowIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },

  rowInfo: { flex: 1 },

  rowLabel: {
    fontSize: 16,
    fontFamily: 'Coolvetica-Bold',   // ✅ FIXED
    color: DARK,
  },

  rowValue: {
    fontSize: 13,
    fontFamily: 'Coolvetica-Regular',  // ✅ FIXED
    color: MUTED,
  },
});