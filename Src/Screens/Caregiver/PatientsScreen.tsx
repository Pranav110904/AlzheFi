import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useAuth } from '../../Context/AuthContext';
import { apiService } from '../../Services/apiService';

// ─── Theme ────────────────────────────────────────────────────────────────────
const YELLOW = '#E3F73F';
const DARK   = '#1F2937';
const BG     = '#F4F1EC';
const MUTED  = '#9CA3AF';
const BORDER = '#E5E0D8';
const WHITE  = '#FFFFFF';

// ─── Types ────────────────────────────────────────────────────────────────────
interface Patient {
  _id: string;
  name: string;
  email: string;
  role: string;
}

interface Event {
  _id: string;
  title: string;
  description?: string;
  datetime: string;
  importance: 'low' | 'medium' | 'high';
  userId: string;
}

interface PatientCardData {
  patient: Patient;
  events: Event[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const IMPORTANCE_CONFIG = {
  low:    { color: '#6B7280', bg: '#F9FAFB', border: '#E5E7EB', label: 'Low' },
  medium: { color: '#D97706', bg: '#FFFBEB', border: '#FDE68A', label: 'Medium' },
  high:   { color: '#DC2626', bg: '#FEF2F2', border: '#FECACA', label: 'High' },
};

const getTimeUntil = (iso: string) => {
  const diffMs  = new Date(iso).getTime() - Date.now();
  if (diffMs < 0) return null;
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 60) return `in ${diffMin} min`;
  const diffHr  = Math.floor(diffMin / 60);
  if (diffHr  < 24) return `in ${diffHr} hr`;
  const diffDay = Math.floor(diffHr / 24);
  return `in ${diffDay} day${diffDay > 1 ? 's' : ''}`;
};

const formatTime = (iso: string) =>
  new Date(iso).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

const isToday = (iso: string) =>
  new Date(iso).toDateString() === new Date().toDateString();

const getDayLabel = (iso: string) => {
  if (isToday(iso)) return 'Today';
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  if (new Date(iso).toDateString() === yesterday.toDateString()) return 'Yesterday';
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
};

const getUpcomingReminders = (events: Event[]) =>
  events.filter(e => new Date(e.datetime).getTime() > Date.now());

const getTodayReminders = (events: Event[]) =>
  events.filter(e => isToday(e.datetime));

const getNextReminder = (events: Event[]): Event | null => {
  const upcoming = getUpcomingReminders(events).sort(
    (a, b) => new Date(a.datetime).getTime() - new Date(b.datetime).getTime()
  );
  return upcoming[0] ?? null;
};

// ─── Avatar ───────────────────────────────────────────────────────────────────
function PatientAvatar({ name, index }: { name: string; index: number }) {
  const initial = name?.charAt(0).toUpperCase() ?? '?';
  const isDark  = index % 2 !== 0;
  return (
    <View style={[styles.avatarRing, isDark && styles.avatarRingDark]}>
      <Text style={[styles.avatarText, isDark && styles.avatarTextDark]}>
        {initial}
      </Text>
    </View>
  );
}

// ─── Next Reminder Row ────────────────────────────────────────────────────────
function NextReminderRow({ event }: { event: Event }) {
  const cfg   = IMPORTANCE_CONFIG[event.importance ?? 'medium'];
  const until = getTimeUntil(event.datetime);
  const day   = getDayLabel(event.datetime);
  const time  = formatTime(event.datetime);

  return (
    <View style={styles.reminderRow}>
      <View style={styles.bellWrap}>
        <Icon name="bell-ring-outline" size={18} color={DARK} />
      </View>
      <View style={styles.reminderInfo}>
        <Text style={styles.reminderTitle} numberOfLines={1}>{event.title}</Text>
        <Text style={styles.reminderMeta}>
          {day} · {time}{until ? ` · ${until}` : ''}
        </Text>
      </View>
      <View style={[styles.impPill, { backgroundColor: cfg.bg, borderColor: cfg.border }]}>
        <Text style={[styles.impPillText, { color: cfg.color }]}>{cfg.label}</Text>
      </View>
    </View>
  );
}

// ─── Patient Card ─────────────────────────────────────────────────────────────
function PatientCard({
  data,
  index,
}: {
  data: PatientCardData;
  index: number;
}) {
  const { patient, events } = data;
  const todayCount    = getTodayReminders(events).length;
  const upcomingCount = getUpcomingReminders(events).length;
  const nextReminder  = getNextReminder(events);
  const totalEvents   = events.length;

  return (
    <View style={styles.card}>
      {/* Top — Avatar + Name */}
      <View style={styles.cardTop}>
        <PatientAvatar name={patient.name} index={index} />
        <View>
          <Text style={styles.cardName}>{patient.name}</Text>
          <View style={styles.roleBadge}>
            <Icon name="hospital-box-outline" size={11} color={DARK} />
            <Text style={styles.roleBadgeText}>Patient</Text>
          </View>
        </View>
      </View>

      {/* Accent bar */}
      <View style={styles.accentBarRow}>
        <View style={styles.accentLine} />
        <View style={styles.accentShort} />
      </View>

      {/* Info grid */}
      <View style={styles.infoGrid}>
        <View style={styles.infoCell}>
          <Text style={styles.infoLabel}>REMINDERS</Text>
          <Text style={styles.infoValue}>{todayCount} Today</Text>
          {upcomingCount > 0 && (
            <Text style={styles.infoSub}>{upcomingCount} upcoming</Text>
          )}
        </View>
        <View style={styles.infoCell}>
          <Text style={styles.infoLabel}>EVENTS</Text>
          <Text style={styles.infoValue}>{totalEvents} Total</Text>
        </View>
      </View>

      {/* Next reminder */}
      {nextReminder ? (
        <NextReminderRow event={nextReminder} />
      ) : (
        <View style={styles.noReminder}>
          <Icon name="bell-sleep-outline" size={14} color={MUTED} />
          <Text style={styles.noReminderText}>No upcoming reminders</Text>
        </View>
      )}
    </View>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────
export default function PatientsScreen() {
  const { state } = useAuth();

  const [patientData, setPatientData] = useState<PatientCardData[]>([]);
  const [loading,     setLoading]     = useState(true);

  useEffect(() => {
    fetchPatients();
  }, []);

  const fetchPatients = async () => {
    try {
      setLoading(true);
      const patients = await apiService.getLinkedPatients();

      const dataWithEvents = await Promise.all(
        patients.map(async (p) => {
          try {
            const events = await apiService.getPatientEvents(p._id);
            return { patient: p, events: Array.isArray(events) ? events : [] };
          } catch {
            return { patient: p, events: [] };
          }
        })
      );

      setPatientData(dataWithEvents);
    } catch (e) {
      console.log('Fetch patients error:', e);
    } finally {
      setLoading(false);
    }
  };

  const totalToday = patientData.reduce(
    (sum, d) => sum + getTodayReminders(d.events).length,
    0
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerEyebrow}>Caregiver</Text>
          <Text style={styles.headerTitle}>My Patients</Text>
        </View>
      </View>

      {/* Accent bar */}
      <View style={styles.pageAccentBar}>
        <View style={styles.accentLine} />
        <View style={styles.accentShort} />
      </View>

      {/* Stats */}
      <View style={styles.statsRow}>
        <View style={styles.statChip}>
          <Icon name="account-outline" size={14} color={DARK} />
          <Text style={styles.statChipText}>{patientData.length} Patients</Text>
        </View>
        <View style={styles.statChip}>
          <Icon name="bell-outline" size={14} color={DARK} />
          <Text style={styles.statChipText}>{totalToday} Today</Text>
        </View>
      </View>

      {loading ? (
        <View style={styles.emptyState}>
          <ActivityIndicator size="large" color={DARK} />
        </View>
      ) : patientData.length === 0 ? (
        <View style={styles.emptyState}>
          <View style={styles.emptyIconWrap}>
            <Icon name="account-off-outline" size={40} color={MUTED} />
          </View>
          <Text style={styles.emptyTitle}>No patients linked</Text>
          <Text style={styles.emptySubtitle}>
            Tap Link to connect a patient to your account
          </Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        >
          {patientData.map((d, i) => (
            <PatientCard key={d.patient._id} data={d} index={i} />
          ))}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG, paddingBottom: 110 },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 26,
    paddingTop: 10,
    paddingBottom: 18,
  },
  headerEyebrow: {
    fontSize: 13,
    fontFamily: 'Coolvetica-Regular',
    color: MUTED,
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  headerTitle: {
    fontSize: 34,
    fontFamily: 'Coolvetica-Heavy-Regular',
    color: DARK,
    lineHeight: 38,
  },
  linkBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: YELLOW,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: DARK,
    shadowColor: DARK,
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  linkBtnText: {
    fontSize: 15,
    fontFamily: 'Coolvetica-Bold',
    color: DARK,
  },

  // Page accent
  pageAccentBar: {
    flexDirection: 'row',
    paddingHorizontal: 26,
    gap: 6,
    marginBottom: 14,
  },

  // Stats
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    gap: 10,
    marginBottom: 20,
  },
  statChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: WHITE,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: BORDER,
  },
  statChipText: {
    fontSize: 13,
    fontFamily: 'Coolvetica-Bold',
    color: DARK,
  },

  // List
  list: {
    paddingHorizontal: 20,
    paddingBottom: 40,
    gap: 14,
  },

  // Card
  card: {
    backgroundColor: WHITE,
    borderRadius: 22,
    borderWidth: 1.5,
    borderColor: BORDER,
    overflow: 'hidden',
    shadowColor: DARK,
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 18,
    paddingBottom: 14,
  },
  cardName: {
    fontSize: 20,
    fontFamily: 'Coolvetica-Heavy-Regular',
    color: DARK,
    marginBottom: 5,
  },

  // Avatar
  avatarRing: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: YELLOW,
    borderWidth: 2,
    borderColor: DARK,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarRingDark: {
    backgroundColor: DARK,
  },
  avatarText: {
    fontSize: 22,
    fontFamily: 'Coolvetica-Heavy-Regular',
    color: DARK,
  },
  avatarTextDark: {
    color: YELLOW,
  },

  // Role badge
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    alignSelf: 'flex-start',
    backgroundColor: YELLOW + '44',
    borderWidth: 1.5,
    borderColor: DARK,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  roleBadgeText: {
    fontSize: 11,
    fontFamily: 'Coolvetica-Bold',
    color: DARK,
  },

  // Accent bar row inside card
  accentBarRow: {
    flexDirection: 'row',
    marginHorizontal: 18,
    gap: 6,
    marginBottom: 14,
  },
  accentLine: {
    height: 3,
    flex: 1,
    backgroundColor: YELLOW,
    borderRadius: 4,
  },
  accentShort: {
    height: 3,
    width: 24,
    backgroundColor: DARK,
    borderRadius: 4,
  },

  // Info grid
  infoGrid: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  infoCell: {
    flex: 1,
    backgroundColor: BG,
    borderRadius: 14,
    padding: 12,
  },
  infoLabel: {
    fontSize: 10,
    fontFamily: 'Coolvetica-Bold',
    color: MUTED,
    letterSpacing: 1.2,
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 16,
    fontFamily: 'Coolvetica-Heavy-Regular',
    color: DARK,
  },
  infoSub: {
    fontSize: 11,
    fontFamily: 'Coolvetica-Regular',
    color: MUTED,
    marginTop: 2,
  },

  // Reminder row
  reminderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginHorizontal: 16,
    marginBottom: 16,
    backgroundColor: BG,
    borderRadius: 14,
    padding: 12,
  },
  bellWrap: {
    width: 36,
    height: 36,
    backgroundColor: YELLOW,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: DARK,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  reminderInfo: { flex: 1 },
  reminderTitle: {
    fontSize: 14,
    fontFamily: 'Coolvetica-Bold',
    color: DARK,
  },
  reminderMeta: {
    fontSize: 11,
    fontFamily: 'Coolvetica-Regular',
    color: MUTED,
    marginTop: 2,
  },
  impPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    borderWidth: 1,
    flexShrink: 0,
  },
  impPillText: {
    fontSize: 11,
    fontFamily: 'Coolvetica-Bold',
  },

  // No reminder
  noReminder: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginHorizontal: 16,
    marginBottom: 16,
    backgroundColor: BG,
    borderRadius: 14,
    padding: 12,
  },
  noReminderText: {
    fontSize: 13,
    fontFamily: 'Coolvetica-Regular',
    color: MUTED,
  },

  // Empty state
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    paddingBottom: 60,
  },
  emptyIconWrap: {
    width: 88,
    height: 88,
    borderRadius: 26,
    backgroundColor: WHITE,
    borderWidth: 1.5,
    borderColor: BORDER,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  emptyTitle: {
    fontSize: 22,
    fontFamily: 'Coolvetica-Heavy-Regular',
    color: DARK,
  },
  emptySubtitle: {
    fontSize: 14,
    fontFamily: 'Coolvetica-Regular',
    color: MUTED,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
});