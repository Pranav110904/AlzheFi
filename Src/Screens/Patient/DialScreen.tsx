import React, { useRef, useState } from 'react';
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
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

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

// ─── Default contacts ─────────────────────────────────────────────────────────
const DEFAULT_CONTACTS: Contact[] = [
  { id: '1', name: 'Sarah',     relationship: 'Wife',     phone: '9380526373', icon: 'heart',         color: '#F9A8D4' },
  { id: '2', name: 'Michael',   relationship: 'Son',      phone: '9393939393', icon: 'account',       color: '#93C5FD' },
  { id: '3', name: 'Emily',     relationship: 'Daughter', phone: '9900223344', icon: 'account-heart', color: '#86EFAC' },
  { id: '4', name: 'Emergency', relationship: '911',      phone: '911',        icon: 'ambulance',     color: '#FCA5A5', emergency: true },
];

// Icon + colour options for new contacts
const ICON_OPTIONS = [
  { icon: 'account',        color: '#93C5FD' },
  { icon: 'heart',          color: '#F9A8D4' },
  { icon: 'account-heart',  color: '#86EFAC' },
  { icon: 'star',           color: '#FDE68A' },
  { icon: 'doctor',         color: '#C4B5FD' },
  { icon: 'human-male',     color: '#6EE7B7' },
];

// ─── Contact Card ─────────────────────────────────────────────────────────────
function ContactCard({
  contact,
  onDelete,
}: {
  contact: Contact;
  onDelete: (id: string) => void;
}) {
  const scale = useRef(new Animated.Value(1)).current;

  const onPressIn  = () => Animated.spring(scale, { toValue: 0.97, useNativeDriver: true, speed: 30 }).start();
  const onPressOut = () => Animated.spring(scale, { toValue: 1,    useNativeDriver: true, speed: 20 }).start();
  const handleCall = () => Linking.openURL(`tel:${contact.phone}`);

  const isDefault = ['1', '2', '3', '4'].includes(contact.id);

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <TouchableOpacity
        style={[styles.card, contact.emergency && styles.cardEmergency]}
        activeOpacity={1}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        onPress={handleCall}
      >
        {/* Avatar */}
        <View style={[styles.avatar, { backgroundColor: contact.color + '33' }]}>
          <Icon name={contact.icon} size={26} color={contact.emergency ? '#DC2626' : DARK} />
        </View>

        {/* Info */}
        <View style={styles.cardInfo}>
          <Text style={[styles.cardName, contact.emergency && styles.cardNameEmergency]}>
            {contact.name}
          </Text>
          <Text style={[styles.cardRelation, contact.emergency && styles.cardRelationEmergency]}>
            {contact.relationship}
          </Text>
        </View>

        {/* Delete button for custom contacts */}
        {!isDefault && (
          <TouchableOpacity
            style={styles.deleteBtn}
            onPress={() => onDelete(contact.id)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Icon name="close" size={14} color={MUTED} />
          </TouchableOpacity>
        )}

        {/* Call pill */}
        <TouchableOpacity
          style={[styles.callPill, contact.emergency && styles.callPillEmergency]}
          onPress={handleCall}
          activeOpacity={0.85}
        >
          <Icon name="phone" size={16} color={contact.emergency ? WHITE : DARK} />
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
}: {
  visible: boolean;
  onClose: () => void;
  onAdd: (c: Contact) => void;
}) {
  const [name, setName]         = useState('');
  const [relation, setRelation] = useState('');
  const [phone, setPhone]       = useState('');
  const [selectedIdx, setSelectedIdx] = useState(0);

  const reset = () => {
    setName(''); setRelation(''); setPhone(''); setSelectedIdx(0);
  };

  const handleAdd = () => {
    if (!name.trim() || !phone.trim()) return;
    onAdd({
      id: Date.now().toString(),
      name: name.trim(),
      relationship: relation.trim() || 'Contact',
      phone: phone.trim(),
      icon:  ICON_OPTIONS[selectedIdx].icon,
      color: ICON_OPTIONS[selectedIdx].color,
    });
    reset();
    onClose();
  };

  const handleClose = () => { reset(); onClose(); };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
      <TouchableWithoutFeedback onPress={handleClose}>
        <View style={modal.overlay} />
      </TouchableWithoutFeedback>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={modal.sheetWrapper}
      >
        <View style={modal.sheet}>
          {/* Handle */}
          <View style={modal.handle} />

          {/* Title row */}
          <View style={modal.titleRow}>
            <Text style={modal.title}>Add Contact</Text>
            <TouchableOpacity onPress={handleClose} style={modal.closeBtn}>
              <Icon name="close" size={18} color={DARK} />
            </TouchableOpacity>
          </View>

          {/* Icon picker */}
          <Text style={modal.label}>Choose Icon</Text>
          <View style={modal.iconRow}>
            {ICON_OPTIONS.map((opt, i) => (
              <TouchableOpacity
                key={i}
                style={[
                  modal.iconOption,
                  { backgroundColor: opt.color + '33' },
                  selectedIdx === i && modal.iconOptionSelected,
                ]}
                onPress={() => setSelectedIdx(i)}
              >
                <Icon name={opt.icon} size={22} color={DARK} />
                {selectedIdx === i && (
                  <View style={modal.iconCheck}>
                    <Icon name="check" size={9} color={WHITE} />
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>

          {/* Fields */}
          <Text style={modal.label}>Name *</Text>
          <TextInput
            style={modal.input}
            value={name}
            onChangeText={setName}
            placeholder="e.g. John"
            placeholderTextColor={MUTED}
          />

          <Text style={modal.label}>Relationship</Text>
          <TextInput
            style={modal.input}
            value={relation}
            onChangeText={setRelation}
            placeholder="e.g. Brother, Doctor…"
            placeholderTextColor={MUTED}
          />

          <Text style={modal.label}>Phone Number *</Text>
          <TextInput
            style={modal.input}
            value={phone}
            onChangeText={setPhone}
            placeholder="e.g. 9876543210"
            placeholderTextColor={MUTED}
            keyboardType="phone-pad"
          />

          {/* Save button */}
          <TouchableOpacity
            style={[modal.saveBtn, (!name.trim() || !phone.trim()) && modal.saveBtnDisabled]}
            onPress={handleAdd}
            activeOpacity={0.85}
          >
            <Icon name="plus" size={18} color={DARK} />
            <Text style={modal.saveBtnText}>Save Contact</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────
export default function DialScreen() {
  const [contacts, setContacts] = useState<Contact[]>(DEFAULT_CONTACTS);
  const [modalVisible, setModalVisible] = useState(false);

  const handleAdd = (c: Contact) => setContacts(prev => [...prev, c]);
  const handleDelete = (id: string) => setContacts(prev => prev.filter(c => c.id !== id));

  return (
    <SafeAreaView style={styles.container} edges={['top']}>

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerEyebrow}>Quick Dial</Text>
          <Text style={styles.headerTitle}>Your People</Text>
        </View>

        {/* Add button */}
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => setModalVisible(true)}
          activeOpacity={0.85}
        >
          <Icon name="plus" size={20} color={DARK} />
          <Text style={styles.addBtnText}>Add</Text>
        </TouchableOpacity>
      </View>

      {/* Accent bar */}
      <View style={styles.accentBar}>
        <View style={styles.accentLine} />
        <View style={[styles.accentLine, styles.accentLineShort]} />
      </View>

      {/* Contact list */}
      <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionLabel}>Family & Emergency</Text>

        {contacts.map(contact => (
          <ContactCard key={contact.id} contact={contact} onDelete={handleDelete} />
        ))}

        <View style={styles.footerHint}>
          <Icon name="information-outline" size={13} color={MUTED} />
          <Text style={styles.footerHintText}>Tap any card or Call to dial instantly</Text>
        </View>
      </ScrollView>

      {/* Modal */}
      <AddContactModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onAdd={handleAdd}
      />

    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 26,
    paddingTop: 10,
    paddingBottom: 18,
  },

  headerEyebrow: {
    fontSize: 13, fontFamily: 'Coolvetica-Regular', color: MUTED,
    letterSpacing: 2, textTransform: 'uppercase', marginBottom: 4,
  },

  headerTitle: {
    fontSize: 34, fontFamily: 'Coolvetica-Heavy-Regular', color: DARK, lineHeight: 38,
  },

  addBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: YELLOW, paddingHorizontal: 16, paddingVertical: 10,
    borderRadius: 24, borderWidth: 1.5, borderColor: DARK,
    shadowColor: DARK, shadowOpacity: 0.1, shadowRadius: 8, elevation: 4,
  },

  addBtnText: {
    fontSize: 15, fontFamily: 'Coolvetica-Bold', color: DARK,
  },

  accentBar: { flexDirection: 'row', paddingHorizontal: 26, gap: 6, marginBottom: 22 },

  accentLine: { height: 3, flex: 1, backgroundColor: YELLOW, borderRadius: 4 },

  accentLineShort: { flex: 0, width: 24, backgroundColor: DARK },

  list: { paddingHorizontal: 20, paddingBottom: 36, gap: 14 },

  sectionLabel: {
    fontSize: 12, fontFamily: 'Coolvetica-Bold', color: MUTED,
    letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 4, marginLeft: 4,
  },

  card: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: WHITE,
    borderRadius: 20, paddingVertical: 16, paddingHorizontal: 18,
    borderWidth: 1.5, borderColor: BORDER, gap: 14,
    shadowColor: DARK, shadowOpacity: 0.06, shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 }, elevation: 3,
  },

  cardEmergency: { backgroundColor: '#FFF5F5', borderColor: '#FECACA' },

  avatar: { width: 52, height: 52, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },

  cardInfo: { flex: 1 },

  cardName: { fontSize: 18, fontFamily: 'Coolvetica-Bold', color: DARK, lineHeight: 22 },
  cardNameEmergency: { color: '#DC2626' },

  cardRelation: { fontSize: 13, fontFamily: 'Coolvetica-Regular', color: MUTED, marginTop: 2 },
  cardRelationEmergency: { color: '#F87171' },

  deleteBtn: {
    width: 26, height: 26, borderRadius: 13,
    backgroundColor: '#F3F4F6', justifyContent: 'center', alignItems: 'center',
  },

  callPill: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: YELLOW, paddingHorizontal: 14, paddingVertical: 9,
    borderRadius: 22, borderWidth: 1.5, borderColor: DARK,
  },

  callPillEmergency: { backgroundColor: '#DC2626', borderColor: '#991B1B' },

  callPillText: { fontSize: 14, fontFamily: 'Coolvetica-Bold', color: DARK },
  callPillTextEmergency: { color: WHITE },

  footerHint: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 8,
  },

  footerHintText: { fontSize: 12, fontFamily: 'Coolvetica-Regular', color: MUTED },
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
    paddingHorizontal: 24,
    paddingBottom: Platform.OS === 'ios' ? 40 : 28,
    paddingTop: 16,
    borderTopWidth: 1.5,
    borderColor: BORDER,
  },

  handle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#D1D5DB',
    marginBottom: 20,
  },

  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },

  title: {
    fontSize: 22,
    fontFamily: 'Coolvetica-Heavy-Regular',
    color: DARK,
  },

  closeBtn: {
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center', alignItems: 'center',
  },

  label: {
    fontSize: 12,
    fontFamily: 'Coolvetica-Bold',
    color: MUTED,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: 8,
  },

  iconRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },

  iconOption: {
    width: 48, height: 48, borderRadius: 14,
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1.5, borderColor: 'transparent',
  },

  iconOptionSelected: {
    borderColor: DARK,
  },

  iconCheck: {
    position: 'absolute', bottom: 4, right: 4,
    width: 14, height: 14, borderRadius: 7,
    backgroundColor: DARK,
    justifyContent: 'center', alignItems: 'center',
  },

  input: {
    backgroundColor: WHITE,
    borderWidth: 1.5,
    borderColor: BORDER,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    fontFamily: 'Coolvetica-Regular',
    color: DARK,
    marginBottom: 16,
  },

  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: YELLOW,
    borderWidth: 1.5,
    borderColor: DARK,
    borderRadius: 18,
    paddingVertical: 15,
    marginTop: 4,
  },

  saveBtnDisabled: {
    opacity: 0.45,
  },

  saveBtnText: {
    fontSize: 16,
    fontFamily: 'Coolvetica-Bold',
    color: DARK,
  },
});