import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  Platform,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  TouchableWithoutFeedback,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import notifee, { AndroidImportance, TriggerType } from '@notifee/react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useAuth } from '../../Context/AuthContext';
import { apiService } from '../../Services/apiService';
import Speech from '@mhpdev/react-native-speech';

const { width } = Dimensions.get('window');

// ─── Theme ────────────────────────────────────────────────────────────────────
const YELLOW = '#E3F73F';
const DARK   = '#1F2937';
const BG     = '#F4F1EC';
const MUTED  = '#9CA3AF';
const BORDER = '#E5E0D8';
const WHITE  = '#FFFFFF';

// ─── Types ────────────────────────────────────────────────────────────────────
type Importance = 'low' | 'medium' | 'high';

interface Event {
  _id: string;
  title: string;
  description?: string;
  datetime: string;
  importance: Importance;
  userId: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const MONTHS     = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const DAYS_SHORT = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

const formatTime = (iso: string) => {
  const d = new Date(iso);
  return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
};

const formatFullDate = (iso: string) => {
  const d = new Date(iso);
  return `${DAYS_SHORT[d.getDay()]}, ${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
};

const isToday = (iso: string) => {
  const d = new Date(iso);
  return d.toDateString() === new Date().toDateString();
};

const isTomorrow = (iso: string) => {
  const d = new Date(iso);
  const tom = new Date();
  tom.setDate(tom.getDate() + 1);
  return d.toDateString() === tom.toDateString();
};

const getDayLabel = (iso: string) => {
  if (isToday(iso))    return 'Today';
  if (isTomorrow(iso)) return 'Tomorrow';
  return formatFullDate(iso);
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

// ─── Importance config ────────────────────────────────────────────────────────
const IMPORTANCE_CONFIG: Record<Importance, {
  label: string;
  icon: string;
  color: string;
  bg: string;
  border: string;
  desc: string;
}> = {
  low: {
    label: 'Low',
    icon: 'bell-outline',
    color: '#6B7280',
    bg: '#F9FAFB',
    border: '#E5E7EB',
    desc: 'Nice to remember, not critical',
  },
  medium: {
    label: 'Medium',
    icon: 'bell-ring-outline',
    color: '#D97706',
    bg: '#FFFBEB',
    border: '#FDE68A',
    desc: 'Should not be missed',
  },
  high: {
    label: 'High',
    icon: 'bell-alert',
    color: '#DC2626',
    bg: '#FEF2F2',
    border: '#FECACA',
    desc: 'Critical — must not be missed',
  },
};

// ─── Mini Calendar ────────────────────────────────────────────────────────────
function MiniCalendar({ selected, onSelect }: { selected: Date | null; onSelect: (d: Date) => void }) {
  const today = new Date();
  const [viewYear,  setViewYear]  = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());

  const firstDay    = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

  const prevMonth = () => viewMonth === 0  ? (setViewMonth(11), setViewYear(y => y - 1)) : setViewMonth(m => m - 1);
  const nextMonth = () => viewMonth === 11 ? (setViewMonth(0),  setViewYear(y => y + 1)) : setViewMonth(m => m + 1);

  const cells: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  return (
    <View style={cal.wrapper}>
      <View style={cal.navRow}>
        <TouchableOpacity style={cal.navBtn} onPress={prevMonth}>
          <Icon name="chevron-left" size={20} color={DARK} />
        </TouchableOpacity>
        <Text style={cal.monthLabel}>{MONTHS[viewMonth]} {viewYear}</Text>
        <TouchableOpacity style={cal.navBtn} onPress={nextMonth}>
          <Icon name="chevron-right" size={20} color={DARK} />
        </TouchableOpacity>
      </View>

      <View style={cal.dayNamesRow}>
        {DAYS_SHORT.map(d => <Text key={d} style={cal.dayName}>{d}</Text>)}
      </View>

      <View style={cal.grid}>
        {cells.map((day, idx) => {
          if (!day) return <View key={`e${idx}`} style={cal.cell} />;
          const cellDate = new Date(viewYear, viewMonth, day);
          const isPast   = cellDate < new Date(today.getFullYear(), today.getMonth(), today.getDate());
          const isSel    = selected ? selected.toDateString() === cellDate.toDateString() : false;
          const isTod    = today.toDateString() === cellDate.toDateString();
          return (
            <TouchableOpacity
              key={day}
              style={[cal.cell, isTod && !isSel && cal.cellToday, isSel && cal.cellSelected, isPast && cal.cellPast]}
              onPress={() => !isPast && onSelect(cellDate)}
              disabled={isPast}
              activeOpacity={0.75}
            >
              <Text style={[
                cal.cellText,
                isTod && !isSel && cal.cellTextToday,
                isSel && cal.cellTextSelected,
                isPast && cal.cellTextPast,
              ]}>
                {day}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

// ─── Time Picker ──────────────────────────────────────────────────────────────
function TimePicker({ hour, minute, onHourChange, onMinuteChange }: {
  hour: number; minute: number;
  onHourChange: (h: number) => void; onMinuteChange: (m: number) => void;
}) {
  const hours   = Array.from({ length: 24 }, (_, i) => i);
  const minutes = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55];

  return (
    <View style={tp.wrapper}>
      <View style={tp.column}>
        <Text style={tp.colLabel}>Hour</Text>
        <ScrollView style={tp.scroll} showsVerticalScrollIndicator={false}>
          {hours.map(h => (
            <TouchableOpacity key={h} style={[tp.item, hour === h && tp.itemSelected]} onPress={() => onHourChange(h)}>
              <Text style={[tp.itemText, hour === h && tp.itemTextSelected]}>{String(h).padStart(2,'0')}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <Text style={tp.colon}>:</Text>

      <View style={tp.column}>
        <Text style={tp.colLabel}>Min</Text>
        <ScrollView style={tp.scroll} showsVerticalScrollIndicator={false}>
          {minutes.map(m => (
            <TouchableOpacity key={m} style={[tp.item, minute === m && tp.itemSelected]} onPress={() => onMinuteChange(m)}>
              <Text style={[tp.itemText, minute === m && tp.itemTextSelected]}>{String(m).padStart(2,'0')}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <View style={tp.preview}>
        <Text style={tp.previewText}>{String(hour).padStart(2,'0')}:{String(minute).padStart(2,'0')}</Text>
        <Text style={tp.previewSub}>
          {hour < 12 ? 'Morning' : hour < 17 ? 'Afternoon' : hour < 21 ? 'Evening' : 'Night'}
        </Text>
      </View>
    </View>
  );
}

// ─── Importance badge (used on cards) ────────────────────────────────────────
function ImportanceBadge({ importance }: { importance: Importance }) {
  const cfg = IMPORTANCE_CONFIG[importance];
  return (
    <View style={[
      styles.importanceBadge,
      { backgroundColor: cfg.bg, borderColor: cfg.border },
    ]}>
      <Icon name={cfg.icon} size={11} color={cfg.color} />
      <Text style={[styles.importanceBadgeText, { color: cfg.color }]}>{cfg.label}</Text>
    </View>
  );
}

// ─── Event Card ───────────────────────────────────────────────────────────────
function EventCard({ event, onDelete }: { event: Event; onDelete: (id: string) => void }) {
  const past  = new Date(event.datetime) < new Date();
  const until = getTimeUntil(event.datetime);

  return (
    <View style={[styles.card, past && styles.cardPast]}>
      {/* Left strip — coloured by importance */}
      <View style={[
        styles.cardStrip,
        { backgroundColor: past ? MUTED : IMPORTANCE_CONFIG[event.importance ?? 'medium'].color },
      ]} />

      {/* Bell icon */}
      <View style={styles.cardIcon}>
        <Icon name={past ? 'bell-check-outline' : 'bell-ring-outline'} size={24} color={past ? MUTED : DARK} />
      </View>

      <View style={styles.cardInfo}>
        <View style={styles.cardTopRow}>
          <Text style={styles.cardEyebrow}>REMINDER</Text>
          <ImportanceBadge importance={event.importance ?? 'medium'} />
        </View>

        <Text style={[styles.cardTitle, past && styles.cardTitlePast]} numberOfLines={2}>
          {event.title}
        </Text>
        {event.description ? (
          <Text style={styles.cardDesc} numberOfLines={1}>{event.description}</Text>
        ) : null}

        <View style={styles.cardTimeRow}>
          <Icon name="clock-outline" size={13} color={past ? MUTED : DARK} />
          <Text style={[styles.cardTime, past && { color: MUTED }]}>{formatTime(event.datetime)}</Text>
          {until && (
            <View style={styles.countdownPill}>
              <Text style={styles.countdownText}>{until}</Text>
            </View>
          )}
          {past && (
            <View style={styles.pastPill}>
              <Text style={styles.pastPillText}>Done</Text>
            </View>
          )}
        </View>
      </View>

      <TouchableOpacity
        style={styles.deleteBtn}
        onPress={() => onDelete(event._id)}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <Icon name="close" size={14} color={MUTED} />
      </TouchableOpacity>
    </View>
  );
}

// ─── Add Event Modal ──────────────────────────────────────────────────────────
// Steps: title → importance → date → time  (4 steps total)
function AddEventModal({ visible, onClose, onAdd }: {
  visible: boolean;
  onClose: () => void;
  onAdd: (data: Partial<Event>) => Promise<void>;
}) {
  const [step,       setStep]       = useState<'title' | 'importance' | 'date' | 'time'>('title');
  const [title,      setTitle]      = useState('');
  const [desc,       setDesc]       = useState('');
  const [importance, setImportance] = useState<Importance>('medium');
  const [selDate,    setSelDate]    = useState<Date | null>(null);
  const [hour,       setHour]       = useState(9);
  const [minute,     setMinute]     = useState(0);
  const [saving,     setSaving]     = useState(false);

  const reset = () => {
    setStep('title'); setTitle(''); setDesc('');
    setImportance('medium'); setSelDate(null); setHour(9); setMinute(0);
  };
  const handleClose = () => { reset(); onClose(); };

  const handleSave = async () => {
    if (!title.trim() || !selDate) return;
    const dt = new Date(selDate);
    dt.setHours(hour, minute, 0, 0);
    setSaving(true);
    try {
      await onAdd({
        title: title.trim(),
        description: desc.trim() || undefined,
        datetime: dt.toISOString(),
        importance,
      });
      reset(); onClose();
    } finally { setSaving(false); }
  };

  const stepNums:   Record<typeof step, number> = { title: 1, importance: 2, date: 3, time: 4 };
  const stepTitles: Record<typeof step, string> = {
    title:      'What to remember?',
    importance: 'How important is it?',
    date:       'Which day?',
    time:       'What time?',
  };
  const totalSteps = 4;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
      <TouchableWithoutFeedback onPress={handleClose}>
        <View style={modal.overlay} />
      </TouchableWithoutFeedback>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={modal.sheetWrapper}>
        <View style={modal.sheet}>
          <View style={modal.handle} />

          {/* Step dots */}
          <View style={modal.stepRow}>
            {[1, 2, 3, 4].map(n => (
              <View key={n} style={[
                modal.stepDot,
                stepNums[step] >= n && modal.stepDotActive,
                stepNums[step] === n && modal.stepDotCurrent,
              ]} />
            ))}
          </View>

          {/* Header */}
          <View style={modal.titleRow}>
            <View>
              <Text style={modal.stepLabel}>Step {stepNums[step]} of {totalSteps}</Text>
              <Text style={modal.title}>{stepTitles[step]}</Text>
            </View>
            <TouchableOpacity style={modal.closeBtn} onPress={handleClose}>
              <Icon name="close" size={18} color={DARK} />
            </TouchableOpacity>
          </View>

          {/* ── STEP 1: Title ── */}
          {step === 'title' && (
            <View>
              <Text style={modal.fieldLabel}>Reminder</Text>
              <TextInput
                style={modal.inputLarge}
                value={title}
                onChangeText={setTitle}
                placeholder="e.g. Take blood pressure tablet"
                placeholderTextColor={MUTED}
                autoFocus
                multiline
              />
              <Text style={modal.fieldLabel}>Note (optional)</Text>
              <TextInput
                style={modal.input}
                value={desc}
                onChangeText={setDesc}
                placeholder="Any extra details…"
                placeholderTextColor={MUTED}
              />
              <TouchableOpacity
                style={[modal.nextBtn, !title.trim() && modal.nextBtnDisabled]}
                onPress={() => setStep('importance')}
                disabled={!title.trim()}
              >
                <Text style={modal.nextBtnText}>Next</Text>
                <Icon name="arrow-right" size={18} color={DARK} />
              </TouchableOpacity>
            </View>
          )}

          {/* ── STEP 2: Importance ── */}
          {step === 'importance' && (
            <View>
              <Text style={modal.fieldLabel}>Priority level</Text>

              <View style={modal.importanceGrid}>
                {(['low', 'medium', 'high'] as Importance[]).map(level => {
                  const cfg = IMPORTANCE_CONFIG[level];
                  const isSelected = importance === level;
                  return (
                    <TouchableOpacity
                      key={level}
                      style={[
                        modal.importanceCard,
                        { borderColor: cfg.border, backgroundColor: cfg.bg },
                        isSelected && { borderColor: cfg.color, borderWidth: 2.5 },
                      ]}
                      onPress={() => setImportance(level)}
                      activeOpacity={0.8}
                    >
                      {/* Selected checkmark */}
                      {isSelected && (
                        <View style={[modal.importanceCheck, { backgroundColor: cfg.color }]}>
                          <Icon name="check" size={10} color={WHITE} />
                        </View>
                      )}

                      {/* Icon circle */}
                      <View style={[modal.importanceIconWrap, { backgroundColor: cfg.color + '22' }]}>
                        <Icon name={cfg.icon} size={26} color={cfg.color} />
                      </View>

                      <Text style={[modal.importanceLabel, { color: cfg.color }]}>{cfg.label}</Text>
                      <Text style={modal.importanceDesc}>{cfg.desc}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <View style={modal.navBtns}>
                <TouchableOpacity style={modal.backBtn} onPress={() => setStep('title')}>
                  <Icon name="arrow-left" size={18} color={DARK} />
                  <Text style={modal.backBtnText}>Back</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={modal.nextBtn}
                  onPress={() => setStep('date')}
                >
                  <Text style={modal.nextBtnText}>Next</Text>
                  <Icon name="arrow-right" size={18} color={DARK} />
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* ── STEP 3: Date ── */}
          {step === 'date' && (
            <View>
              <MiniCalendar selected={selDate} onSelect={setSelDate} />

              {selDate && (
                <View style={modal.selectedDateBadge}>
                  <Icon name="calendar-check" size={16} color={DARK} />
                  <Text style={modal.selectedDateText}>{formatFullDate(selDate.toISOString())}</Text>
                </View>
              )}

              <View style={modal.navBtns}>
                <TouchableOpacity style={modal.backBtn} onPress={() => setStep('importance')}>
                  <Icon name="arrow-left" size={18} color={DARK} />
                  <Text style={modal.backBtnText}>Back</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[modal.nextBtn, !selDate && modal.nextBtnDisabled]}
                  onPress={() => setStep('time')}
                  disabled={!selDate}
                >
                  <Text style={modal.nextBtnText}>Next</Text>
                  <Icon name="arrow-right" size={18} color={DARK} />
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* ── STEP 4: Time ── */}
          {step === 'time' && (
            <View>
              {/* Summary card */}
              <View style={modal.summaryCard}>
                <View style={[
                  modal.summaryIcon,
                  { backgroundColor: IMPORTANCE_CONFIG[importance].color + '22' },
                ]}>
                  <Icon name={IMPORTANCE_CONFIG[importance].icon} size={18} color={IMPORTANCE_CONFIG[importance].color} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={modal.summaryTitle} numberOfLines={1}>{title}</Text>
                  <View style={modal.summaryMeta}>
                    <Text style={modal.summaryDate}>{selDate ? formatFullDate(selDate.toISOString()) : ''}</Text>
                    <View style={[
                      modal.summaryImportancePill,
                      { backgroundColor: IMPORTANCE_CONFIG[importance].bg, borderColor: IMPORTANCE_CONFIG[importance].border },
                    ]}>
                      <Text style={[modal.summaryImportanceText, { color: IMPORTANCE_CONFIG[importance].color }]}>
                        {IMPORTANCE_CONFIG[importance].label}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>

              <TimePicker hour={hour} minute={minute} onHourChange={setHour} onMinuteChange={setMinute} />

              <View style={modal.navBtns}>
                <TouchableOpacity style={modal.backBtn} onPress={() => setStep('date')}>
                  <Icon name="arrow-left" size={18} color={DARK} />
                  <Text style={modal.backBtnText}>Back</Text>
                </TouchableOpacity>
                <TouchableOpacity style={modal.saveBtn} onPress={handleSave} disabled={saving} activeOpacity={0.85}>
                  {saving
                    ? <ActivityIndicator size="small" color={YELLOW} />
                    : <><Icon name="bell-check" size={18} color={YELLOW} /><Text style={modal.saveBtnText}>Save</Text></>
                  }
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────
export default function ReminderScreen() {
  const { state } = useAuth();
  const userId = state?.user?._id;

  const [events,       setEvents]       = useState<Event[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [activeFilter, setActiveFilter] = useState<'upcoming' | 'all'>('upcoming');

const fetchEvents = async () => {
  try {
    setLoading(true);

    const raw = await apiService.getEvents();

    // ✅ Normalize — handle both array and { events: [] } shapes
    const data: Event[] = Array.isArray(raw) ? raw : (raw as any)?.events ?? [];

    const now = Date.now();

    const filtered =
      activeFilter === 'upcoming'
        ? data.filter(ev => new Date(ev.datetime).getTime() > now)
        : data;

    setEvents(filtered);

    for (const ev of filtered) {
      await scheduleNotification(ev);
    }

  } catch (e) {
    console.log('Fetch events error:', e);
  } finally {
    setLoading(false);
  }
};


const speakReminder = async (title: string, description?: string) => {
  try {
    const message = `${title}. ${description || ''}`;

    await Speech.stop(); // stop previous speech

    await Speech.speak(message, {
      voice: 'en-us-x-tpd-network', // same as chat screen
      rate: 0.9,
      pitch: 0.9,
    });
  } catch (error) {
    console.log('TTS error:', error);
  }
};

  useEffect(() => { fetchEvents(); }, [activeFilter]);

  const handleAdd = async (data: Partial<Event>) => {
    const created = await apiService.createEvent({ ...data, userId });

    if (created?._id) {
      setEvents(prev => [...prev, created]);

      // ✅ Schedule notification immediately
      await scheduleNotification(created);

    } else {
      await fetchEvents();
    }
  };

 const handleDelete = (id: string) => {
  Alert.alert('Remove Reminder', 'Remove this reminder?', [
    { text: 'Keep', style: 'cancel' },
    {
      text: 'Remove',
      style: 'destructive',
      onPress: async () => {
        try {
          await apiService.deleteEvent(id);

          // ✅ Cancel notification
          await cancelNotification(id);

          setEvents(prev => prev.filter(e => e._id !== id));
        } catch (e) {
          console.log('Delete error:', e);
        }
      },
    },
  ]);
};

useEffect(() => {
  async function setup() {
    await notifee.requestPermission();
    await createChannel();
  }
  setup();
}, []);

  // ─── Notification Helpers ─────────────────────────────────────────────

const NOTIFICATION_CHANNEL_ID = 'default';

// Create notification channel (safe call)
const createChannel = async () => {
  await notifee.createChannel({
    id: NOTIFICATION_CHANNEL_ID,
    name: 'Reminders',
    importance: AndroidImportance.HIGH,
  });
};

// Schedule notification for an event
const scheduleNotification = async (event: Event) => {
  try {
    const triggerDate = new Date(event.datetime);

    if (triggerDate.getTime() <= Date.now()) return;

    const notificationId = `reminder-${event._id}`;

    await notifee.cancelNotification(notificationId);

    await notifee.createTriggerNotification(
      {
        id: notificationId,
        title: event.title || 'Reminder',
        body: event.description || 'You have a reminder',
        android: {
          channelId: NOTIFICATION_CHANNEL_ID,
          smallIcon: 'ic_launcher',
          pressAction: { id: 'default' },
        },
      },
      {
        type: TriggerType.TIMESTAMP,  // ✅ use enum, not 0
        timestamp: triggerDate.getTime(),
      }
    );

    const delay = triggerDate.getTime() - Date.now();
    setTimeout(() => {
      speakReminder(event.title, event.description);
    }, delay);

  } catch (err) {
    console.log('Schedule notification error:', err);
  }
};

// Cancel notification
const cancelNotification = async (eventId: string) => {
  try {
    await notifee.cancelNotification(`reminder-${eventId}`);
  } catch (err) {
    console.log('Cancel notification error:', err);
  }
};

  const grouped = events.reduce<Record<string, Event[]>>((acc, ev) => {
    const label = getDayLabel(ev.datetime);
    if (!acc[label]) acc[label] = [];
    acc[label].push(ev);
    return acc;
  }, {});

  const todayCount    = events.filter(e => isToday(e.datetime)).length;
  const upcomingCount = events.filter(e => new Date(e.datetime) >= new Date()).length;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>

      <View style={styles.header}>
        <View>
          <Text style={styles.headerEyebrow}>Stay on track</Text>
          <Text style={styles.headerTitle}>Reminders</Text>
        </View>
        <TouchableOpacity style={styles.addBtn} onPress={() => setModalVisible(true)} activeOpacity={0.85}>
          <Icon name="plus" size={20} color={DARK} />
          <Text style={styles.addBtnText}>Add</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.accentBar}>
        <View style={styles.accentLine} />
        <View style={[styles.accentLine, styles.accentLineShort]} />
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statChip}>
          <Icon name="calendar-today" size={14} color={DARK} />
          <Text style={styles.statChipText}>{todayCount} today</Text>
        </View>
        <View style={styles.statChip}>
          <Icon name="bell-outline" size={14} color={DARK} />
          <Text style={styles.statChipText}>{upcomingCount} upcoming</Text>
        </View>
      </View>

      <View style={styles.filterRow}>
        {(['upcoming', 'all'] as const).map(f => (
          <TouchableOpacity
            key={f}
            style={[styles.filterTab, activeFilter === f && styles.filterTabActive]}
            onPress={() => setActiveFilter(f)}
          >
            <Icon name={f === 'upcoming' ? 'clock-fast' : 'view-list'} size={14} color={activeFilter === f ? DARK : MUTED} />
            <Text style={[styles.filterTabText, activeFilter === f && styles.filterTabTextActive]}>
              {f === 'upcoming' ? 'Upcoming' : 'All'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <View style={styles.emptyState}>
          <ActivityIndicator size="large" color={DARK} />
        </View>
      ) : events.length === 0 ? (
        <View style={styles.emptyState}>
          <View style={styles.emptyIconWrap}>
            <Icon name="bell-sleep-outline" size={44} color={MUTED} />
          </View>
          <Text style={styles.emptyTitle}>No reminders yet</Text>
          <Text style={styles.emptySubtitle}>Tap Add to set your first reminder</Text>
          <TouchableOpacity style={styles.emptyBtn} onPress={() => setModalVisible(true)}>
            <Icon name="plus" size={18} color={DARK} />
            <Text style={styles.emptyBtnText}>Add Reminder</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
          {Object.entries(grouped).map(([dayLabel, dayEvents]) => (
            <View key={dayLabel}>
              <View style={styles.dayHeader}>
                <View style={[styles.dayBadge, dayLabel === 'Today' && styles.dayBadgeToday]}>
                  <Icon
                    name={dayLabel === 'Today' ? 'calendar-today' : 'calendar-outline'}
                    size={12}
                    color={dayLabel === 'Today' ? DARK : MUTED}
                  />
                  <Text style={[styles.dayLabel, dayLabel === 'Today' && styles.dayLabelToday]}>
                    {dayLabel}
                  </Text>
                </View>
                <View style={styles.dayLine} />
              </View>
              {dayEvents.map(ev => (
                <EventCard key={ev._id} event={ev} onDelete={handleDelete} />
              ))}
            </View>
          ))}
          <View style={styles.footerHint}>
            <Icon name="information-outline" size={13} color={MUTED} />
            <Text style={styles.footerHintText}>Tap × on a card to remove it</Text>
          </View>
        </ScrollView>
      )}

      <AddEventModal visible={modalVisible} onClose={() => setModalVisible(false)} onAdd={handleAdd} />
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG, paddingBottom: 110 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 26, paddingTop: 10, paddingBottom: 18 },
  headerEyebrow: { fontSize: 13, fontFamily: 'SpaceGrotesk-Regular', color: MUTED, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 4 },
  headerTitle: { fontSize: 34, fontFamily: 'SpaceGrotesk-Bold', color: DARK, lineHeight: 38 },
  addBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: YELLOW, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 24, borderWidth: 1.5, borderColor: DARK, shadowColor: DARK, shadowOpacity: 0.1, shadowRadius: 8, elevation: 4 },
  addBtnText: { fontSize: 15, fontFamily: 'SpaceGrotesk-Bold', color: DARK },
  accentBar: { flexDirection: 'row', paddingHorizontal: 26, gap: 6, marginBottom: 14 },
  accentLine: { height: 3, flex: 1, backgroundColor: YELLOW, borderRadius: 4 },
  accentLineShort: { flex: 0, width: 24, backgroundColor: DARK },
  statsRow: { flexDirection: 'row', paddingHorizontal: 24, gap: 10, marginBottom: 14 },
  statChip: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: WHITE, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1.5, borderColor: BORDER },
  statChipText: { fontSize: 13, fontFamily: 'SpaceGrotesk-Bold', color: DARK },
  filterRow: { flexDirection: 'row', paddingHorizontal: 24, gap: 8, marginBottom: 20 },
  filterTab: { flex: 1, paddingVertical: 10, borderRadius: 12, alignItems: 'center', backgroundColor: WHITE, borderWidth: 1.5, borderColor: BORDER, flexDirection: 'row', justifyContent: 'center', gap: 6 },
  filterTabActive: { backgroundColor: YELLOW, borderColor: DARK },
  filterTabText: { fontSize: 13, fontFamily: 'SpaceGrotesk-Bold', color: MUTED },
  filterTabTextActive: { color: DARK },
  list: { paddingHorizontal: 20, paddingBottom: 40, gap: 10 },
  dayHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10, marginTop: 6 },
  dayBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10, backgroundColor: WHITE, borderWidth: 1, borderColor: BORDER },
  dayBadgeToday: { backgroundColor: YELLOW, borderColor: DARK },
  dayLabel: { fontSize: 13, fontFamily: 'SpaceGrotesk-Bold', color: MUTED },
  dayLabelToday: { color: DARK },
  dayLine: { flex: 1, height: 1, backgroundColor: BORDER },

  // ── Card ──
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: WHITE, borderRadius: 20, borderWidth: 1.5, borderColor: BORDER, overflow: 'hidden', shadowColor: DARK, shadowOpacity: 0.06, shadowRadius: 10, elevation: 3, marginBottom: 2 },
  cardPast: { opacity: 0.5 },
  cardStrip: { width: 5, alignSelf: 'stretch' },
  cardIcon: { width: 52, height: 52, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginLeft: 12, backgroundColor: YELLOW + '33' },
  cardInfo: { flex: 1, paddingVertical: 14, paddingLeft: 12 },
  cardTopRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 2 },
  cardEyebrow: { fontSize: 10, fontFamily: 'SpaceGrotesk-Bold', color: MUTED, letterSpacing: 1.5 },
  cardTitle: { fontSize: 17, fontFamily: 'SpaceGrotesk-Bold', color: DARK, marginBottom: 3, lineHeight: 22 },
  cardTitlePast: { color: MUTED },
  cardDesc: { fontSize: 13, fontFamily: 'SpaceGrotesk-Regular', color: MUTED, marginBottom: 5 },
  cardTimeRow: { flexDirection: 'row', alignItems: 'center', gap: 5, flexWrap: 'wrap' },
  cardTime: { fontSize: 14, fontFamily: 'SpaceGrotesk-Bold', color: DARK },
  countdownPill: { backgroundColor: YELLOW + '88', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8, borderWidth: 1, borderColor: DARK + '22' },
  countdownText: { fontSize: 11, fontFamily: 'SpaceGrotesk-Bold', color: DARK },
  pastPill: { backgroundColor: '#F3F4F6', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
  pastPillText: { fontSize: 11, fontFamily: 'SpaceGrotesk-Bold', color: MUTED },
  deleteBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#F3F4F6', justifyContent: 'center', alignItems: 'center', marginRight: 14 },

  // ── Importance badge (on card) ──
  importanceBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 7, paddingVertical: 3, borderRadius: 8, borderWidth: 1 },
  importanceBadgeText: { fontSize: 10, fontFamily: 'SpaceGrotesk-Bold', letterSpacing: 0.3 },

  // ── Empty ──
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12, paddingBottom: 60 },
  emptyIconWrap: { width: 90, height: 90, borderRadius: 28, backgroundColor: WHITE, borderWidth: 1.5, borderColor: BORDER, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  emptyTitle: { fontSize: 22, fontFamily: 'SpaceGrotesk-Bold', color: DARK },
  emptySubtitle: { fontSize: 15, fontFamily: 'SpaceGrotesk-Regular', color: MUTED, textAlign: 'center', paddingHorizontal: 40 },
  emptyBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8, backgroundColor: YELLOW, paddingHorizontal: 24, paddingVertical: 14, borderRadius: 24, borderWidth: 1.5, borderColor: DARK },
  emptyBtnText: { fontSize: 16, fontFamily: 'SpaceGrotesk-Bold', color: DARK },
  footerHint: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 8 },
  footerHintText: { fontSize: 12, fontFamily: 'SpaceGrotesk-Regular', color: MUTED },
});

const modal = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' },
  sheetWrapper: { position: 'absolute', bottom: 0, left: 0, right: 0 },
  sheet: { backgroundColor: BG, borderTopLeftRadius: 32, borderTopRightRadius: 32, paddingHorizontal: 24, paddingBottom: Platform.OS === 'ios' ? 44 : 32, paddingTop: 16, borderTopWidth: 1.5, borderColor: BORDER, maxHeight: '100%' },
  handle: { alignSelf: 'center', width: 44, height: 4, borderRadius: 2, backgroundColor: '#D1D5DB', marginBottom: 16 },
  stepRow: { flexDirection: 'row', justifyContent: 'center', gap: 8, marginBottom: 20 },
  stepDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: BORDER },
  stepDotActive: { backgroundColor: YELLOW },
  stepDotCurrent: { width: 24, backgroundColor: DARK },
  titleRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 },
  stepLabel: { fontSize: 11, fontFamily: 'SpaceGrotesk-Bold', color: MUTED, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 2 },
  title: { fontSize: 26, fontFamily: 'SpaceGrotesk-Bold', color: DARK },
  closeBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#F3F4F6', justifyContent: 'center', alignItems: 'center' },

  fieldLabel: { fontSize: 11, fontFamily: 'SpaceGrotesk-Bold', color: MUTED, letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 8 },
  inputLarge: { backgroundColor: WHITE, borderWidth: 1.5, borderColor: BORDER, borderRadius: 16, paddingHorizontal: 18, paddingVertical: 16, fontSize: 18, fontFamily: 'SpaceGrotesk-Regular', color: DARK, marginBottom: 16, minHeight: 70 },
  input: { backgroundColor: WHITE, borderWidth: 1.5, borderColor: BORDER, borderRadius: 16, paddingHorizontal: 18, paddingVertical: 14, fontSize: 16, fontFamily: 'SpaceGrotesk-Regular', color: DARK, marginBottom: 16 },

  // ── Importance grid ──
  importanceGrid: { flexDirection: 'row', gap: 10, marginBottom: 8 },
  importanceCard: {
    flex: 1,
    borderRadius: 20,
    borderWidth: 1.5,
    padding: 14,
    alignItems: 'center',
    gap: 8,
    position: 'relative',
  },
  importanceCheck: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
  },
  importanceIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  importanceLabel: {
    fontSize: 15,
    fontFamily: 'SpaceGrotesk-Bold',
    letterSpacing: 0.3,
  },
  importanceDesc: {
    fontSize: 10,
    fontFamily: 'SpaceGrotesk-Regular',
    color: MUTED,
    textAlign: 'center',
    lineHeight: 14,
  },

  selectedDateBadge: { flexDirection: 'row', alignItems: 'center', gap: 8, alignSelf: 'center', backgroundColor: YELLOW, paddingHorizontal: 18, paddingVertical: 10, borderRadius: 20, borderWidth: 1.5, borderColor: DARK, marginTop: 12 },
  selectedDateText: { fontSize: 15, fontFamily: 'SpaceGrotesk-Bold', color: DARK },

  summaryCard: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: WHITE, borderRadius: 16, borderWidth: 1.5, borderColor: BORDER, padding: 14, marginBottom: 16 },
  summaryIcon: { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  summaryTitle: { fontSize: 16, fontFamily: 'SpaceGrotesk-Bold', color: DARK, marginBottom: 4 },
  summaryMeta: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  summaryDate: { fontSize: 13, fontFamily: 'SpaceGrotesk-Regular', color: MUTED },
  summaryImportancePill: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8, borderWidth: 1 },
  summaryImportanceText: { fontSize: 11, fontFamily: 'SpaceGrotesk-Bold' },

  navBtns: { flexDirection: 'row', gap: 10, marginTop: 16 },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 18, paddingVertical: 14, borderRadius: 18, backgroundColor: WHITE, borderWidth: 1.5, borderColor: BORDER },
  backBtnText: { fontSize: 15, fontFamily: 'SpaceGrotesk-Bold', color: DARK },
  nextBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: YELLOW, borderWidth: 1.5, borderColor: DARK, borderRadius: 18, paddingVertical: 14 },
  nextBtnDisabled: { opacity: 0.4 },
  nextBtnText: { fontSize: 16, fontFamily: 'SpaceGrotesk-Bold', color: DARK },
  saveBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: DARK, borderWidth: 1.5, borderColor: DARK, borderRadius: 18, paddingVertical: 14 },
  saveBtnText: { fontSize: 16, fontFamily: 'SpaceGrotesk-Bold', color: YELLOW },
});

const cal = StyleSheet.create({
  wrapper: { backgroundColor: WHITE, borderRadius: 20, borderWidth: 1.5, borderColor: BORDER, padding: 16 },
  navRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  navBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: BG, justifyContent: 'center', alignItems: 'center' },
  monthLabel: { fontSize: 18, fontFamily: 'SpaceGrotesk-Bold', color: DARK },
  dayNamesRow: { flexDirection: 'row', marginBottom: 6 },
  dayName: { flex: 1, textAlign: 'center', fontSize: 12, fontFamily: 'SpaceGrotesk-Bold', color: MUTED },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  cell: { width: `${100/7}%`, aspectRatio: 1, justifyContent: 'center', alignItems: 'center', padding: 2 },
  cellToday: {},
  cellSelected: { backgroundColor: DARK, borderRadius: 10 },
  cellPast: { opacity: 0.3 },
  cellText: { fontSize: 15, fontFamily: 'SpaceGrotesk-Regular', color: DARK },
  cellTextToday: { fontFamily: 'SpaceGrotesk-Bold', color: DARK, textDecorationLine: 'underline' },
  cellTextSelected: { color: YELLOW, fontFamily: 'SpaceGrotesk-Bold' },
  cellTextPast: { color: MUTED },
});

const tp = StyleSheet.create({
  wrapper: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: WHITE, borderRadius: 20, borderWidth: 1.5, borderColor: BORDER, padding: 16 },
  column: { width: 72 },
  colLabel: { fontSize: 11, fontFamily: 'SpaceGrotesk-Bold', color: MUTED, letterSpacing: 1.2, textTransform: 'uppercase', textAlign: 'center', marginBottom: 8 },
  scroll: { height: 160 },
  item: { paddingVertical: 10, borderRadius: 10, alignItems: 'center' },
  itemSelected: { backgroundColor: DARK },
  itemText: { fontSize: 20, fontFamily: 'SpaceGrotesk-Regular', color: DARK },
  itemTextSelected: { color: YELLOW, fontFamily: 'SpaceGrotesk-Bold' },
  colon: { fontSize: 28, fontFamily: 'SpaceGrotesk-Bold', color: DARK, alignSelf: 'center', marginTop: 20 },
  preview: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  previewText: { fontSize: 36, fontFamily: 'SpaceGrotesk-Bold', color: DARK },
  previewSub: { fontSize: 13, fontFamily: 'SpaceGrotesk-Regular', color: MUTED, marginTop: 4 },
});