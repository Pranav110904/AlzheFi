import React, { useRef, useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
  Animated,
  Modal,
  TextInput,
  Platform,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { apiService } from '../../Services/apiService';

// ─── Theme ────────────────────────────────────────────────────────────────────
const YELLOW = '#E3F73F';
const DARK   = '#1F2937';
const BG     = '#F4F1EC';
const WHITE  = '#FFFFFF';
const MUTED  = '#9CA3AF';
const BORDER = '#E5E0D8';

// ─── Types ────────────────────────────────────────────────────────────────────
interface Contact {
  id: string;
  name: string;
  relationship: string;
  phone: string;
  icon: string;
  color: string;
  emergency?: boolean;
}

// ─── Utilities ────────────────────────────────────────────────────────────────
const validatePhone = (phone: string): boolean => {
  const cleaned = phone.replace(/\D/g, '');
  return cleaned.length >= 7 && cleaned.length <= 15;
};

const normalizePhone = (phone: string): string => phone.replace(/\D/g, '');

// ─── Defaults ─────────────────────────────────────────────────────────────────
const DEFAULT_CONTACTS: Contact[] = [
  { id: '1', name: 'Emergency', relationship: '911', phone: '911', icon: 'ambulance', color: '#FCA5A5', emergency: true },
];

const ICON_OPTIONS = [
  { icon: 'account',       color: '#93C5FD' },
  { icon: 'heart',         color: '#F9A8D4' },
  { icon: 'account-heart', color: '#86EFAC' },
  { icon: 'star',          color: '#FDE68A' },
];

// ─── Contact Card ─────────────────────────────────────────────────────────────
function ContactCard({ contact, onDelete }: { contact: Contact; onDelete: (id: string) => void }) {
  const scale = useRef(new Animated.Value(1)).current;

  const onPressIn  = () => Animated.spring(scale, { toValue: 0.97, useNativeDriver: true, speed: 30 }).start();
  const onPressOut = () => Animated.spring(scale, { toValue: 1,    useNativeDriver: true, speed: 20 }).start();

  const handleCall = useCallback(async () => {
    try {
      const canOpen = await Linking.canOpenURL(`tel:${contact.phone}`);
      if (canOpen) await Linking.openURL(`tel:${contact.phone}`);
      else Alert.alert('Error', 'Phone dialer not available');
    } catch {
      Alert.alert('Error', 'Could not open phone dialer');
    }
  }, [contact.phone]);

  const handleDelete = useCallback(() => {
    Alert.alert(
      'Delete Contact',
      `Remove ${contact.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', onPress: () => onDelete(contact.id), style: 'destructive' },
      ]
    );
  }, [contact.id, contact.name, onDelete]);

  const isDefault = contact.id === '1';

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <TouchableOpacity
        style={[styles.card, contact.emergency && styles.cardEmergency]}
        activeOpacity={1}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        onPress={handleCall}
        accessibilityLabel={`${contact.name}, ${contact.relationship}`}
        accessibilityRole="button"
      >
        {/* Avatar */}
        <View style={[styles.avatar, { backgroundColor: contact.color + '33' }]}>
          <Icon
            name={contact.icon}
            size={24}
            color={contact.emergency ? '#DC2626' : DARK}
          />
        </View>

        {/* Info */}
        <View style={styles.cardInfo}>
          <Text style={[styles.cardName, contact.emergency && styles.cardNameEmergency]}>
            {contact.name}
          </Text>
          <View style={styles.cardRelationRow}>
            <Icon
              name="phone-outline"
              size={11}
              color={contact.emergency ? '#F87171' : MUTED}
            />
            <Text style={[styles.cardRelation, contact.emergency && styles.cardRelationEmergency]}>
              {contact.relationship}
            </Text>
          </View>
        </View>

        {/* Delete */}
        {!isDefault && (
          <TouchableOpacity
            style={styles.deleteBtn}
            onPress={handleDelete}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            accessibilityLabel={`Delete ${contact.name}`}
          >
            <Icon name="close" size={13} color={MUTED} />
          </TouchableOpacity>
        )}

        {/* Call pill */}
        <TouchableOpacity
          style={[styles.callPill, contact.emergency && styles.callPillEmergency]}
          onPress={handleCall}
          activeOpacity={0.85}
          accessibilityLabel={`Call ${contact.name}`}
        >
          <Icon name="phone" size={15} color={contact.emergency ? WHITE : DARK} />
          <Text style={[styles.callPillText, contact.emergency && styles.callPillTextEmergency]}>
            Call
          </Text>
        </TouchableOpacity>
      </TouchableOpacity>
    </Animated.View>
  );
}

// ─── Add Contact Modal ────────────────────────────────────────────────────────
function AddContactModal({
  visible,
  onClose,
  onAdd,
  existingContacts,
}: {
  visible: boolean;
  onClose: () => void;
  onAdd: (c: Contact) => void;
  existingContacts: Contact[];
}) {
  const [name,         setName]         = useState('');
  const [relation,     setRelation]     = useState('');
  const [phone,        setPhone]        = useState('');
  const [selectedIcon, setSelectedIcon] = useState(0);
  const [errors,       setErrors]       = useState<Record<string, string>>({});

  const reset = useCallback(() => {
    setName(''); setRelation(''); setPhone(''); setSelectedIcon(0); setErrors({});
  }, []);

  const validateForm = useCallback((): boolean => {
    const e: Record<string, string> = {};
    if (!name.trim())          e.name  = 'Name is required';
    if (!phone.trim())         e.phone = 'Phone is required';
    else if (!validatePhone(phone)) e.phone = 'Phone must be 7–15 digits';

    const isDuplicate = existingContacts.some(
      c => c.name.toLowerCase() === name.trim().toLowerCase() ||
           normalizePhone(c.phone) === normalizePhone(phone)
    );
    if (isDuplicate) e.duplicate = 'Contact already exists';

    setErrors(e);
    return Object.keys(e).length === 0;
  }, [name, phone, existingContacts]);

  const handleAdd = useCallback(() => {
    if (!validateForm()) return;
    onAdd({
      id: '',
      name: name.trim(),
      relationship: relation.trim() || 'Contact',
      phone: normalizePhone(phone),
      icon:  ICON_OPTIONS[selectedIcon].icon,
      color: ICON_OPTIONS[selectedIcon].color,
    });
    reset();
    onClose();
  }, [name, relation, phone, selectedIcon, onAdd, onClose, reset, validateForm]);

  const handleClose = useCallback(() => { reset(); onClose(); }, [reset, onClose]);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
      <TouchableOpacity style={modal.overlay} activeOpacity={1} onPress={handleClose}>
        <View style={modal.sheetWrapper} pointerEvents="box-none">
          <TouchableOpacity style={modal.sheet} activeOpacity={1} onPress={e => e.stopPropagation()}>

            {/* Modal title */}
            <View style={modal.titleRow}>
              <View style={modal.titleIcon}>
                <Icon name="account-plus" size={18} color={DARK} />
              </View>
              <Text style={modal.title}>Add Contact</Text>
            </View>

            {/* Accent bar */}
            <View style={modal.accentBar}>
              <View style={modal.accentLine} />
              <View style={[modal.accentLine, modal.accentLineShort]} />
            </View>

            {/* Duplicate error */}
            {errors.duplicate && (
              <View style={modal.errorBanner}>
                <Icon name="alert-circle" size={14} color="#DC2626" />
                <Text style={modal.errorText}>{errors.duplicate}</Text>
              </View>
            )}

            {/* Icon chooser */}
            <Text style={modal.label}>Choose Icon</Text>
            <View style={modal.iconRow}>
              {ICON_OPTIONS.map((opt, i) => (
                <TouchableOpacity
                  key={i}
                  style={[
                    modal.iconOption,
                    { backgroundColor: opt.color + '33' },
                    selectedIcon === i && modal.iconOptionSelected,
                  ]}
                  onPress={() => setSelectedIcon(i)}
                >
                  <Icon name={opt.icon} size={22} color={DARK} />
                  {selectedIcon === i && (
                    <View style={modal.iconCheck}>
                      <Icon name="check" size={9} color={WHITE} />
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </View>

            {/* Name */}
            <Text style={modal.label}>Name *</Text>
            <TextInput
              style={[modal.input, errors.name && modal.inputError]}
              placeholder="Full name"
              placeholderTextColor={MUTED}
              value={name}
              onChangeText={setName}
              maxLength={50}
            />
            {errors.name && <Text style={modal.fieldError}>{errors.name}</Text>}

            {/* Relationship */}
            <Text style={modal.label}>Relationship</Text>
            <TextInput
              style={modal.input}
              placeholder="e.g. Brother, Doctor"
              placeholderTextColor={MUTED}
              value={relation}
              onChangeText={setRelation}
              maxLength={30}
            />

            {/* Phone */}
            <Text style={modal.label}>Phone *</Text>
            <TextInput
              style={[modal.input, errors.phone && modal.inputError]}
              placeholder="Phone number"
              placeholderTextColor={MUTED}
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              maxLength={15}
            />
            {errors.phone && <Text style={modal.fieldError}>{errors.phone}</Text>}

            {/* Save button */}
            <TouchableOpacity
              style={[modal.saveBtn, (!name.trim() || !phone.trim()) && modal.saveBtnDisabled]}
              onPress={handleAdd}
              disabled={!name.trim() || !phone.trim()}
              activeOpacity={0.85}
            >
              <Icon name="plus" size={16} color={DARK} />
              <Text style={modal.saveBtnText}>Save Contact</Text>
            </TouchableOpacity>

          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────
export default function DialScreen() {
  const [contacts,      setContacts]      = useState<Contact[]>(DEFAULT_CONTACTS);
  const [modalVisible,  setModalVisible]  = useState(false);
  const [loading,       setLoading]       = useState(false);

  useEffect(() => { fetchContacts(); }, []);

  const fetchContacts = async () => {
    try {
      setLoading(true);
      const res = await apiService.getContacts();
      const mapped = res.map((c: any) => ({
        id:           c._id,
        name:         c.name,
        relationship: c.relationship || 'Contact',
        phone:        c.phoneNumber,
        icon:         'account',
        color:        '#93C5FD',
      }));
      setContacts([...DEFAULT_CONTACTS, ...mapped]);
    } catch (e) {
      Alert.alert('Error', 'Failed to load contacts');
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = useCallback(async (c: Contact) => {
    try {
      const res = await apiService.createContact({
        name:         c.name,
        relationship: c.relationship,
        phoneNumber:  c.phone,
      });
      setContacts(prev => [...prev, {
        id:           res._id,
        name:         res.name,
        relationship: res.relationship,
        phone:        res.phoneNumber,
        icon:         c.icon,
        color:        c.color,
      }]);
    } catch {
      Alert.alert('Error', 'Failed to save contact');
    }
  }, []);

  const handleDelete = useCallback(async (id: string) => {
    try {
      if (id) await apiService.deleteContact(id);
      setContacts(prev => prev.filter(c => c.id !== id));
    } catch {
      Alert.alert('Error', 'Failed to delete contact');
    }
  }, []);

  const userContacts = contacts.filter(c => !c.emergency);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>

      {/* ── Header ── */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.headerIconWrap}>
            <Icon name="phone" size={22} color={DARK} />
          </View>
          <View>
            <Text style={styles.headerEyebrow}>Quick Dial</Text>
            <Text style={styles.headerTitle}>Contacts</Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => setModalVisible(true)}
          activeOpacity={0.85}
          accessibilityLabel="Add new contact"
        >
          <Icon name="plus" size={18} color={DARK} />
          <Text style={styles.addBtnText}>Add</Text>
        </TouchableOpacity>
      </View>

      {/* ── Accent Bar ── */}
      <View style={styles.accentBar}>
        <View style={styles.accentLine} />
        <View style={[styles.accentLine, styles.accentLineShort]} />
      </View>

      <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>

        {/* ── Emergency section label ── */}
        <View style={styles.sectionLabelRow}>
          <Icon name="alert-circle-outline" size={13} color={MUTED} />
          <Text style={styles.sectionLabel}>Emergency</Text>
        </View>

        {contacts.filter(c => c.emergency).map(c => (
          <ContactCard key={c.id} contact={c} onDelete={handleDelete} />
        ))}

        {/* ── Contacts section label ── */}
        <View style={[styles.sectionLabelRow, { marginTop: 22 }]}>
          <Icon name="account-multiple-outline" size={13} color={MUTED} />
          <Text style={styles.sectionLabel}>
            My Contacts
            <Text style={styles.sectionCount}> · {userContacts.length}</Text>
          </Text>
        </View>

        {userContacts.length > 0
          ? userContacts.map(c => (
              <ContactCard key={c.id} contact={c} onDelete={handleDelete} />
            ))
          : (
            <View style={styles.emptyState}>
              <View style={styles.emptyIconWrap}>
                <Icon name="phone-hangup-outline" size={30} color={MUTED} />
              </View>
              <Text style={styles.emptyTitle}>No contacts yet</Text>
              <Text style={styles.emptySubtitle}>Tap Add to save someone important</Text>
            </View>
          )
        }

      </ScrollView>

      <AddContactModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onAdd={handleAdd}
        existingContacts={contacts}
      />
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: BG,
    paddingBottom: 100,
  },

  // ── Header ─────────────────────────────────────────────────
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 26,
    paddingTop: 10,
    paddingBottom: 18,
  },

  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },

  headerIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: YELLOW,
    borderWidth: 1.5,
    borderColor: DARK,
    justifyContent: 'center',
    alignItems: 'center',
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

  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: YELLOW,
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: DARK,
  },

  addBtnText: {
    fontSize: 14,
    fontFamily: 'Coolvetica-Bold',
    color: DARK,
  },

  // ── Accent Bar ─────────────────────────────────────────────
  accentBar: {
    flexDirection: 'row',
    paddingHorizontal: 26,
    gap: 6,
    marginBottom: 16,
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

  // ── Section Labels ──────────────────────────────────────────
  sectionLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
    marginLeft: 2,
  },

  sectionLabel: {
    fontSize: 12,
    fontFamily: 'Coolvetica-Bold',
    color: MUTED,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },

  sectionCount: {
    fontFamily: 'Coolvetica-Regular',
    color: MUTED,
  },

  list: {
    paddingHorizontal: 20,
    paddingTop: 4,
    paddingBottom: 36,
    gap: 10,
  },

  // ── Contact Card ───────────────────────────────────────────
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: WHITE,
    borderRadius: 18,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderWidth: 1.5,
    borderColor: BORDER,
    gap: 12,
    shadowColor: DARK,
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },

  cardEmergency: {
    backgroundColor: '#FFF5F5',
    borderColor: '#FECACA',
  },

  avatar: {
    width: 50,
    height: 50,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: BORDER,
  },

  cardInfo: { flex: 1 },

  cardName: {
    fontSize: 16,
    fontFamily: 'Coolvetica-Bold',
    color: DARK,
    marginBottom: 3,
  },

  cardNameEmergency: { color: '#DC2626' },

  cardRelationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },

  cardRelation: {
    fontSize: 12,
    fontFamily: 'Coolvetica-Regular',
    color: MUTED,
  },

  cardRelationEmergency: { color: '#F87171' },

  deleteBtn: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: BORDER,
    justifyContent: 'center',
    alignItems: 'center',
  },

  callPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: YELLOW,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: DARK,
  },

  callPillEmergency: {
    backgroundColor: '#DC2626',
    borderColor: '#991B1B',
  },

  callPillText: {
    fontSize: 13,
    fontFamily: 'Coolvetica-Bold',
    color: DARK,
  },

  callPillTextEmergency: { color: WHITE },

  // ── Empty State ────────────────────────────────────────────
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    gap: 10,
  },

  emptyIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: WHITE,
    borderWidth: 1.5,
    borderColor: BORDER,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },

  emptyTitle: {
    fontSize: 16,
    fontFamily: 'Coolvetica-Bold',
    color: DARK,
  },

  emptySubtitle: {
    fontSize: 13,
    fontFamily: 'Coolvetica-Regular',
    color: MUTED,
    textAlign: 'center',
  },
});

// ─── Modal Styles ─────────────────────────────────────────────────────────────
const modal = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },

  sheetWrapper: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },

  sheet: {
    backgroundColor: BG,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
    paddingBottom: Platform.OS === 'ios' ? 44 : 28,
    borderTopWidth: 1.5,
    borderLeftWidth: 1.5,
    borderRightWidth: 1.5,
    borderColor: BORDER,
  },

  // Title row
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 14,
  },

  titleIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: YELLOW,
    borderWidth: 1.5,
    borderColor: DARK,
    justifyContent: 'center',
    alignItems: 'center',
  },

  title: {
    fontSize: 24,
    fontFamily: 'Coolvetica-Heavy-Regular',
    color: DARK,
  },

  // Accent bar inside modal
  accentBar: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 18,
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

  // Error banner
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FEE2E2',
    borderWidth: 1.5,
    borderColor: '#FECACA',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 14,
  },

  errorText: {
    fontSize: 13,
    fontFamily: 'Coolvetica-Regular',
    color: '#DC2626',
    flex: 1,
  },

  // Labels + Inputs
  label: {
    fontSize: 11,
    fontFamily: 'Coolvetica-Bold',
    color: MUTED,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginBottom: 8,
    marginTop: 14,
  },

  input: {
    borderWidth: 1.5,
    borderColor: BORDER,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: Platform.OS === 'ios' ? 13 : 10,
    fontSize: 15,
    fontFamily: 'Coolvetica-Regular',
    color: DARK,
    backgroundColor: WHITE,
    marginBottom: 2,
  },

  inputError: {
    borderColor: '#FCA5A5',
    backgroundColor: '#FEF2F2',
  },

  fieldError: {
    fontSize: 12,
    fontFamily: 'Coolvetica-Regular',
    color: '#DC2626',
    marginBottom: 4,
    marginLeft: 4,
  },

  // Icon picker
  iconRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 4,
  },

  iconOption: {
    width: 50,
    height: 50,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'transparent',
  },

  iconOptionSelected: {
    borderColor: DARK,
  },

  iconCheck: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: DARK,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Save button
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: YELLOW,
    borderWidth: 1.5,
    borderColor: DARK,
    borderRadius: 16,
    paddingVertical: 14,
    marginTop: 20,
  },

  saveBtnDisabled: {
    opacity: 0.45,
  },

  saveBtnText: {
    fontSize: 15,
    fontFamily: 'Coolvetica-Bold',
    color: DARK,
  },
});