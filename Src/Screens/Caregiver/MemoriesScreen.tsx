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
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { launchImageLibrary } from 'react-native-image-picker';
import { useAuth } from '../../Context/AuthContext';
import { apiService } from '../../Services/apiService';

// ─── Theme ────────────────────────────────────────────────────────────────────
const YELLOW = '#E3F73F';
const DARK   = '#1F2937';
const BG     = '#F4F1EC';
const MUTED  = '#9CA3AF';
const BORDER = '#E5E0D8';
const WHITE  = '#FFFFFF';
const TEAL   = '#0D9488';

// ─── Types ────────────────────────────────────────────────────────────────────
type TabType = 'photo' | 'story' | 'place';

interface Patient {
  _id: string;
  id?: string;
  name: string;
  email: string;
}

interface PhotoPayload {
  title: string;
  year?: string;
  category: string;
  caption?: string;
  images: { uri: string; type: string; name: string }[];
}

interface StoryPayload {
  title: string;
  year?: string;
  content: string;
  icon: string;
}

interface PlacePayload {
  name: string;
  address?: string;
  category: string;
  description?: string;
  images: { uri: string; type: string; name: string }[];
}

// ─── Category configs ─────────────────────────────────────────────────────────
const PHOTO_CATEGORIES  = ['Family', 'Travel', 'Achievement', 'Festival', 'Childhood', 'Other'];
const PLACE_CATEGORIES  = ['Home', 'Park', 'Workplace', 'Temple', 'Restaurant', 'Other'];
const STORY_ICONS: { icon: string; label: string }[] = [
  { icon: 'home-heart',    label: 'Home'    },
  { icon: 'heart',         label: 'Love'    },
  { icon: 'briefcase',     label: 'Work'    },
  { icon: 'airplane',      label: 'Travel'  },
  { icon: 'party-popper',  label: 'Celebr.' },
  { icon: 'tree',          label: 'Nature'  },
  { icon: 'book-open',     label: 'Learn'   },
  { icon: 'trophy',        label: 'Achieve' },
];

// ─── Tab config ───────────────────────────────────────────────────────────────
const TABS: { key: TabType; label: string; icon: string }[] = [
  { key: 'photo',  label: 'PHOTO',  icon: 'image-multiple'     },
  { key: 'story',  label: 'STORY',  icon: 'book-open-variant'  },
  { key: 'place',  label: 'PLACE',  icon: 'map-marker-multiple'},
];

// ─── Patient Avatar ───────────────────────────────────────────────────────────
function PatientAvatar({ name, size = 38 }: { name: string; size?: number }) {
  const initials = name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
  return (
    <View style={[styles.avatar, { width: size, height: size, borderRadius: size / 2 }]}>
      <Text style={[styles.avatarText, { fontSize: size * 0.35 }]}>{initials}</Text>
    </View>
  );
}

// ─── Patient Selector Sheet ───────────────────────────────────────────────────
function PatientSelectorSheet({
  visible, patients, selected, onSelect, onClose, loading,
}: {
  visible: boolean;
  patients: Patient[];
  selected: Patient | null;
  onSelect: (p: Patient) => void;
  onClose: () => void;
  loading: boolean;
}) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={modal.overlay} />
      </TouchableWithoutFeedback>
      <View style={[modal.sheetWrapper, { position: 'absolute', bottom: 0, left: 0, right: 0 }]}>
        <View style={[modal.sheet, { paddingBottom: Platform.OS === 'ios' ? 44 : 28 }]}>
          <View style={modal.handle} />
          <Text style={styles.selectorTitle}>Select Patient</Text>
          <Text style={styles.selectorSubtitle}>Choose whose memory you're adding</Text>
          {loading ? (
            <ActivityIndicator size="large" color={DARK} style={{ marginVertical: 32 }} />
          ) : patients.length === 0 ? (
            <View style={styles.noPatients}>
              <Icon name="account-off-outline" size={40} color={MUTED} />
              <Text style={styles.noPatientsText}>No linked patients yet</Text>
            </View>
          ) : (
            <ScrollView style={{ maxHeight: 320 }} showsVerticalScrollIndicator={false}>
              {patients.map(p => {
                const isSelected = selected?._id === p._id;
                return (
                  <TouchableOpacity
                    key={p._id}
                    style={[styles.patientRow, isSelected && styles.patientRowSelected]}
                    onPress={() => { onSelect(p); onClose(); }}
                    activeOpacity={0.8}
                  >
                    <PatientAvatar name={p.name} size={44} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.patientName}>{p.name}</Text>
                      <Text style={styles.patientEmail}>{p.email}</Text>
                    </View>
                    {isSelected && (
                      <View style={styles.selectedCheck}>
                        <Icon name="check" size={14} color={WHITE} />
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
}

// ─── Category Pill Row ────────────────────────────────────────────────────────
function CategoryPills({
  options, selected, onSelect,
}: { options: string[]; selected: string; onSelect: (v: string) => void }) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 4 }}>
      <View style={{ flexDirection: 'row', gap: 8, paddingBottom: 4 }}>
        {options.map(opt => {
          const isActive = selected === opt;
          return (
            <TouchableOpacity
              key={opt}
              style={[styles.catPill, isActive && styles.catPillActive]}
              onPress={() => onSelect(opt)}
              activeOpacity={0.8}
            >
              <Text style={[styles.catPillText, isActive && styles.catPillTextActive]}>{opt}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </ScrollView>
  );
}

// ─── Image Upload Row ─────────────────────────────────────────────────────────
function ImageUploadRow({
  images, onAdd, onRemove, max = 4,
}: {
  images: { uri: string; type: string; name: string }[];
  onAdd: (imgs: { uri: string; type: string; name: string }[]) => void;
  onRemove: (idx: number) => void;
  max?: number;
}) {
  const pickImages = () => {
    launchImageLibrary(
      { mediaType: 'photo', selectionLimit: max - images.length, includeBase64: false },
      response => {
        if (response.assets) {
          const picked = response.assets.map(a => ({
            uri: a.uri ?? '',
            type: a.type ?? 'image/jpeg',
            name: a.fileName ?? 'photo.jpg',
          }));
          onAdd(picked);
        }
      }
    );
  };

  return (
    <View>
      {images.length === 0 ? (
        <TouchableOpacity style={styles.uploadBox} onPress={pickImages} activeOpacity={0.8}>
          <View style={styles.uploadIconWrap}>
            <Icon name="image-plus" size={22} color={MUTED} />
          </View>
          <Text style={styles.uploadText}>Tap to upload photos</Text>
          <Text style={styles.uploadSub}>JPG, PNG — up to {max} photos</Text>
        </TouchableOpacity>
      ) : (
        <View style={styles.thumbRow}>
          {images.map((img, idx) => (
            <View key={idx} style={{ position: 'relative' }}>
              <Image source={{ uri: img.uri }} style={styles.thumb} />
              <TouchableOpacity
                style={styles.thumbRemove}
                onPress={() => onRemove(idx)}
                hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
              >
                <Icon name="close" size={10} color={WHITE} />
              </TouchableOpacity>
            </View>
          ))}
          {images.length < max && (
            <TouchableOpacity style={styles.thumbAdd} onPress={pickImages} activeOpacity={0.8}>
              <Icon name="plus" size={22} color={MUTED} />
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
}

// ─── Add Memory Modal ─────────────────────────────────────────────────────────
function AddMemoryModal({
  visible, onClose, onSave, patientName, activeTab,
}: {
  visible: boolean;
  onClose: () => void;
  onSave: (tab: TabType, data: PhotoPayload | StoryPayload | PlacePayload) => Promise<void>;
  patientName: string;
  activeTab: TabType;
}) {
  // — Photo state —
  const [phTitle,    setPhTitle]    = useState('');
  const [phYear,     setPhYear]     = useState('');
  const [phCat,      setPhCat]      = useState('Family');
  const [phCaption,  setPhCaption]  = useState('');
  const [phImages,   setPhImages]   = useState<{ uri: string; type: string; name: string }[]>([]);

  // — Story state —
  const [stTitle,    setStTitle]    = useState('');
  const [stYear,     setStYear]     = useState('');
  const [stContent,  setStContent]  = useState('');
  const [stIcon,     setStIcon]     = useState('home-heart');

  // — Place state —
  const [plName,     setPlName]     = useState('');
  const [plAddr,     setPlAddr]     = useState('');
  const [plCat,      setPlCat]      = useState('Home');
  const [plDesc,     setPlDesc]     = useState('');
  const [plImages,   setPlImages]   = useState<{ uri: string; type: string; name: string }[]>([]);

  const [saving, setSaving] = useState(false);

  const reset = () => {
    setPhTitle(''); setPhYear(''); setPhCat('Family'); setPhCaption(''); setPhImages([]);
    setStTitle(''); setStYear(''); setStContent(''); setStIcon('home-heart');
    setPlName('');  setPlAddr(''); setPlCat('Home');  setPlDesc('');   setPlImages([]);
  };

  const handleClose = () => { reset(); onClose(); };

  const handleSave = async () => {
    if (activeTab === 'photo') {
      if (!phTitle.trim()) { Alert.alert('Required', 'Please add a title.'); return; }
      setSaving(true);
      try {
        await onSave('photo', {
          title: phTitle.trim(), year: phYear.trim() || undefined,
          category: phCat, caption: phCaption.trim() || undefined, images: phImages,
        });
        reset(); onClose();
      } finally { setSaving(false); }

    } else if (activeTab === 'story') {
      if (!stTitle.trim() || !stContent.trim()) {
        Alert.alert('Required', 'Please add a title and the story text.'); return;
      }
      setSaving(true);
      try {
        await onSave('story', {
          title: stTitle.trim(), year: stYear.trim() || undefined,
          content: stContent.trim(), icon: stIcon,
        });
        reset(); onClose();
      } finally { setSaving(false); }

    } else {
      if (!plName.trim()) { Alert.alert('Required', 'Please add the place name.'); return; }
      setSaving(true);
      try {
        await onSave('place', {
          name: plName.trim(), address: plAddr.trim() || undefined,
          category: plCat, description: plDesc.trim() || undefined, images: plImages,
        });
        reset(); onClose();
      } finally { setSaving(false); }
    }
  };

  const tabLabel: Record<TabType, string> = {
    photo: 'Add Photo Memory',
    story: 'Add Story',
    place: 'Add Place',
  };

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
          <View style={modal.handle} />

          {/* For patient banner */}
          <View style={styles.forPatientBanner}>
            <Icon name="account-heart-outline" size={14} color={TEAL} />
            <Text style={styles.forPatientText}>
              For <Text style={{ fontFamily: 'Coolvetica-Bold' }}>{patientName}</Text>
            </Text>
          </View>

          {/* Title row */}
          <View style={modal.titleRow}>
            <Text style={modal.title}>{tabLabel[activeTab]}</Text>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

            {/* ── PHOTO FORM ── */}
            {activeTab === 'photo' && (
              <View>
                <Text style={modal.fieldLabel}>Title *</Text>
                <TextInput
                  style={modal.inputLarge}
                  value={phTitle}
                  onChangeText={setPhTitle}
                  placeholder="e.g. Wedding Day"
                  placeholderTextColor={MUTED}
                  autoFocus
                  multiline
                />
                <Text style={modal.fieldLabel}>Year</Text>
                <TextInput
                  style={modal.input}
                  value={phYear}
                  onChangeText={setPhYear}
                  placeholder="e.g. 1985"
                  placeholderTextColor={MUTED}
                  keyboardType="number-pad"
                  maxLength={4}
                />
                <Text style={modal.fieldLabel}>Category</Text>
                <CategoryPills options={PHOTO_CATEGORIES} selected={phCat} onSelect={setPhCat} />
                <Text style={[modal.fieldLabel, { marginTop: 12 }]}>Photos</Text>
                <ImageUploadRow
                  images={phImages}
                  onAdd={imgs => setPhImages(prev => [...prev, ...imgs].slice(0, 4))}
                  onRemove={idx => setPhImages(prev => prev.filter((_, i) => i !== idx))}
                  max={4}
                />
                <Text style={[modal.fieldLabel, { marginTop: 12 }]}>Caption (optional)</Text>
                <TextInput
                  style={[modal.input, { height: 80, textAlignVertical: 'top' }]}
                  value={phCaption}
                  onChangeText={setPhCaption}
                  placeholder="Add a short caption…"
                  placeholderTextColor={MUTED}
                  multiline
                />
              </View>
            )}

            {/* ── STORY FORM ── */}
            {activeTab === 'story' && (
              <View>
                <Text style={modal.fieldLabel}>Title *</Text>
                <TextInput
                  style={modal.inputLarge}
                  value={stTitle}
                  onChangeText={setStTitle}
                  placeholder="e.g. Meeting your wife"
                  placeholderTextColor={MUTED}
                  autoFocus
                  multiline
                />
                <Text style={modal.fieldLabel}>Year</Text>
                <TextInput
                  style={modal.input}
                  value={stYear}
                  onChangeText={setStYear}
                  placeholder="e.g. 1978"
                  placeholderTextColor={MUTED}
                  keyboardType="number-pad"
                  maxLength={4}
                />
                <Text style={modal.fieldLabel}>Story *</Text>
                <TextInput
                  style={[modal.input, { height: 120, textAlignVertical: 'top' }]}
                  value={stContent}
                  onChangeText={setStContent}
                  placeholder="Write the memory in detail. The more specific, the more meaningful it will be…"
                  placeholderTextColor={MUTED}
                  multiline
                />
                <Text style={modal.fieldLabel}>Mood Icon</Text>
                <View style={styles.iconGrid}>
                  {STORY_ICONS.map(({ icon, label }) => {
                    const isActive = stIcon === icon;
                    return (
                      <TouchableOpacity
                        key={icon}
                        style={[styles.iconCard, isActive && styles.iconCardActive]}
                        onPress={() => setStIcon(icon)}
                        activeOpacity={0.8}
                      >
                        {isActive && (
                          <View style={styles.iconCheck}>
                            <Icon name="check" size={9} color={WHITE} />
                          </View>
                        )}
                        <View style={[styles.iconWrap, isActive && styles.iconWrapActive]}>
                          <Icon name={icon} size={22} color={isActive ? DARK : MUTED} />
                        </View>
                        <Text style={[styles.iconLabel, isActive && styles.iconLabelActive]}>
                          {label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            )}

            {/* ── PLACE FORM ── */}
            {activeTab === 'place' && (
              <View>
                <Text style={modal.fieldLabel}>Place Name *</Text>
                <TextInput
                  style={modal.inputLarge}
                  value={plName}
                  onChangeText={setPlName}
                  placeholder="e.g. Central Park"
                  placeholderTextColor={MUTED}
                  autoFocus
                  multiline
                />
                <Text style={modal.fieldLabel}>Address</Text>
                <TextInput
                  style={modal.input}
                  value={plAddr}
                  onChangeText={setPlAddr}
                  placeholder="e.g. Downtown area"
                  placeholderTextColor={MUTED}
                />
                <Text style={modal.fieldLabel}>Category</Text>
                <CategoryPills options={PLACE_CATEGORIES} selected={plCat} onSelect={setPlCat} />
                <Text style={[modal.fieldLabel, { marginTop: 12 }]}>Description</Text>
                <TextInput
                  style={[modal.input, { height: 100, textAlignVertical: 'top' }]}
                  value={plDesc}
                  onChangeText={setPlDesc}
                  placeholder="Why is this place meaningful? What happened here?"
                  placeholderTextColor={MUTED}
                  multiline
                />
                <Text style={[modal.fieldLabel, { marginTop: 4 }]}>Photos (optional)</Text>
                <ImageUploadRow
                  images={plImages}
                  onAdd={imgs => setPlImages(prev => [...prev, ...imgs].slice(0, 3))}
                  onRemove={idx => setPlImages(prev => prev.filter((_, i) => i !== idx))}
                  max={3}
                />
              </View>
            )}

            {/* Save button */}
            <TouchableOpacity
              style={modal.saveBtn}
              onPress={handleSave}
              disabled={saving}
              activeOpacity={0.85}
            >
              {saving ? (
                <ActivityIndicator size="small" color={YELLOW} />
              ) : (
                <>
                  <Icon name="check-circle-outline" size={18} color={YELLOW} />
                  <Text style={modal.saveBtnText}>Save Memory</Text>
                </>
              )}
            </TouchableOpacity>

          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────
export default function MemoriesScreen() {
  const { state } = useAuth();

  const [patients,        setPatients]        = useState<Patient[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [loadingPatients, setLoadingPatients] = useState(true);
  const [selectorVisible, setSelectorVisible] = useState(false);
  const [modalVisible,    setModalVisible]    = useState(false);
  const [activeTab,       setActiveTab]       = useState<TabType>('photo');

  // ── Load linked patients ──
  useEffect(() => {
    (async () => {
      try {
        const data = await apiService.getLinkedPatients();
        setPatients(data);
        if (data.length > 0) setSelectedPatient(data[0]);
      } catch (e) {
        console.log('Load patients error:', e);
      } finally {
        setLoadingPatients(false);
      }
    })();
  }, []);



 


  // ── Save handler ──
const handleSave = async (
  tab: TabType,
  data: PhotoPayload | StoryPayload | PlacePayload
) => {
  if (!selectedPatient) return;

  const patientId = selectedPatient._id ?? selectedPatient.id;

  try {
    if (tab === 'photo') {
      const photoData = data as PhotoPayload;

      if (!photoData.images.length) {
        Alert.alert("Error", "Please select an image");
        return;
      }

      // ✅ STEP 1: take first image
      const file = photoData.images[0];

      // ✅ STEP 2: get upload URL
      const { signedUrl, publicUrl } = await apiService.api.post(
        "/media/upload-url",
        {
          fileName: file.name,
          mimeType: file.type,
        }
      ).then(res => res.data);

      // ✅ STEP 3: upload to supabase
      await fetch(signedUrl, {
        method: "PUT",
        headers: {
          "Content-Type": file.type,
        },
        body: {
          uri: file.uri,
          type: file.type,
          name: file.name,
        } as any,
      });

      // ✅ STEP 4: send to backend
      await apiService.addPhotoMemory(patientId, {
        title: photoData.title,
        year: photoData.year,
        category: photoData.category,
        caption: photoData.caption,
        imageUrl: publicUrl, // 🔥 THIS IS THE FIX
      });

    } 
    else if (tab === 'story') {
      const storyData = data as StoryPayload;

       const moodMap: Record<string, string> = {
          "home-heart": "Home",
          "heart": "Love",
          "briefcase": "Work",
          "airplane": "Travel",
          "party-popper": "Celebrate",
          "tree": "Nature",
          "book-open": "Learn",
          "trophy": "Achieve",
        };

      await apiService.addStoryMemory(patientId, {
        title: storyData.title,
        year: storyData.year,
        description: storyData.content, // 🔥 FIX NAME
        mood: moodMap[storyData.icon] || "Home",          // 🔥 FIX NAME
      });

    } 
    else {
      const placeData = data as PlacePayload;

      let photoUrl = "";

      if (placeData.images.length > 0) {
        const file = placeData.images[0];

        const { signedUrl, publicUrl } = await apiService.api.post(
          "/media/upload-url",
          {
            fileName: file.name,
            mimeType: file.type,
          }
        ).then(res => res.data);

        await fetch(signedUrl, {
          method: "PUT",
          headers: {
            "Content-Type": file.type,
          },
          body: {
            uri: file.uri,
            type: file.type,
            name: file.name,
          } as any,
        });

        photoUrl = publicUrl;
      }

      await apiService.addPlaceMemory(patientId, {
        placeName: placeData.name,   // 🔥 FIX NAME
        address: placeData.address,
        category: placeData.category,
        description: placeData.description,
        photoUrl,
      });
    }

  } catch (e: any) {
    console.log("ERROR FULL:", e?.response?.data || e);
    Alert.alert("Error", e?.response?.data?.error || "Something went wrong");
  }
};

  // ── Loading state ──
  if (loadingPatients) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.centerLoader}>
          <ActivityIndicator size="large" color={DARK} />
          <Text style={styles.centerLoaderText}>Loading patients…</Text>
        </View>
      </SafeAreaView>
    );
  }

  // ── No patients linked ──
  if (patients.length === 0) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <View>
            <Text style={styles.headerEyebrow}>Caregiver</Text>
            <Text style={styles.headerTitle}>Memories</Text>
          </View>
        </View>
        <View style={styles.accentBar}>
          <View style={styles.accentLine} />
          <View style={[styles.accentLine, styles.accentLineShort]} />
        </View>
        <View style={styles.emptyState}>
          <View style={styles.emptyIconWrap}>
            <Icon name="account-plus-outline" size={44} color={MUTED} />
          </View>
          <Text style={styles.emptyTitle}>No patients linked</Text>
          <Text style={styles.emptySubtitle}>
            Link a patient from your profile to manage their memories
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>

      {/* ── Header ── */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerEyebrow}>Caregiver</Text>
          <Text style={styles.headerTitle}>Memories</Text>
        </View>
      </View>

      {/* ── Accent Bar ── */}
      <View style={styles.accentBar}>
        <View style={styles.accentLine} />
        <View style={[styles.accentLine, styles.accentLineShort]} />
      </View>

      {/* ── Patient Selector ── */}
      <TouchableOpacity
        style={styles.patientSelector}
        onPress={() => setSelectorVisible(true)}
        activeOpacity={0.85}
      >
        <View style={styles.patientSelectorLeft}>
          {selectedPatient && <PatientAvatar name={selectedPatient.name} size={36} />}
          <View>
            <Text style={styles.patientSelectorLabel}>Adding memories for</Text>
            <Text style={styles.patientSelectorName}>
              {selectedPatient?.name ?? 'Select patient'}
            </Text>
          </View>
        </View>
        <View style={styles.switchBadge}>
          <Icon name="swap-horizontal" size={14} color={TEAL} />
          <Text style={styles.switchBadgeText}>Switch</Text>
        </View>
      </TouchableOpacity>

      {/* ── Tabs ── */}
      <View style={styles.tabsContainer}>
        {TABS.map(({ key, label, icon }) => {
          const isActive = activeTab === key;
          return (
            <TouchableOpacity
              key={key}
              style={[styles.tab, isActive && styles.tabActive]}
              onPress={() => setActiveTab(key)}
              activeOpacity={0.85}
            >
              <Icon name={icon} size={16} color={isActive ? DARK : MUTED} style={{ marginBottom: 3 }} />
              <Text style={[styles.tabLabel, isActive && styles.tabLabelActive]}>{label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* ── Info cards ── */}
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >

        {activeTab === 'photo' && (
          <View style={styles.infoCard}>
            <View style={[styles.infoIconWrap, { backgroundColor: '#86EFAC33' }]}>
              <Icon name="image-multiple" size={26} color={DARK} />
            </View>
            <Text style={styles.infoTitle}>Photo Memories</Text>
            <Text style={styles.infoSubtitle}>
              Upload photos with a title, year, and category. These will appear in the patient's
              Photos tab as cherished moments.
            </Text>
            <View style={styles.infoFields}>
              {['Title (required)', 'Year', 'Category', 'Up to 4 photos', 'Caption'].map(f => (
                <View key={f} style={styles.infoFieldRow}>
                  <View style={styles.infoFieldDot} />
                  <Text style={styles.infoFieldText}>{f}</Text>
                </View>
              ))}
            </View>
            <TouchableOpacity
              style={styles.infoBtn}
              onPress={() => setModalVisible(true)}
              activeOpacity={0.85}
            >
              <Icon name="plus" size={18} color={DARK} />
              <Text style={styles.infoBtnText}>Add Photo Memory</Text>
            </TouchableOpacity>
          </View>
        )}

        {activeTab === 'story' && (
          <View style={styles.infoCard}>
            <View style={[styles.infoIconWrap, { backgroundColor: '#F9A8D433' }]}>
              <Icon name="book-open-variant" size={26} color={DARK} />
            </View>
            <Text style={styles.infoTitle}>Life Stories</Text>
            <Text style={styles.infoSubtitle}>
              Write meaningful stories from the patient's life. These appear as expandable life
              chapters the patient can read and reflect on.
            </Text>
            <View style={styles.infoFields}>
              {['Title (required)', 'Year', 'Story text (required)', 'Mood icon'].map(f => (
                <View key={f} style={styles.infoFieldRow}>
                  <View style={styles.infoFieldDot} />
                  <Text style={styles.infoFieldText}>{f}</Text>
                </View>
              ))}
            </View>
            <TouchableOpacity
              style={styles.infoBtn}
              onPress={() => setModalVisible(true)}
              activeOpacity={0.85}
            >
              <Icon name="plus" size={18} color={DARK} />
              <Text style={styles.infoBtnText}>Add Story</Text>
            </TouchableOpacity>
          </View>
        )}

        {activeTab === 'place' && (
          <View style={styles.infoCard}>
            <View style={[styles.infoIconWrap, { backgroundColor: '#93C5FD33' }]}>
              <Icon name="map-marker-multiple" size={26} color={DARK} />
            </View>
            <Text style={styles.infoTitle}>Meaningful Places</Text>
            <Text style={styles.infoSubtitle}>
              Add places that hold significance — home, a favourite café, a park. The patient sees
              them as a map of their life's meaningful locations.
            </Text>
            <View style={styles.infoFields}>
              {['Place name (required)', 'Address', 'Category', 'Description', 'Up to 3 photos'].map(f => (
                <View key={f} style={styles.infoFieldRow}>
                  <View style={styles.infoFieldDot} />
                  <Text style={styles.infoFieldText}>{f}</Text>
                </View>
              ))}
            </View>
            <TouchableOpacity
              style={styles.infoBtn}
              onPress={() => setModalVisible(true)}
              activeOpacity={0.85}
            >
              <Icon name="plus" size={18} color={DARK} />
              <Text style={styles.infoBtnText}>Add Place</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Footer hint */}
        <View style={styles.footerHint}>
          <Icon name="information-outline" size={13} color={MUTED} />
          <Text style={styles.footerHintText}>
            Memories are saved directly to the patient's profile
          </Text>
        </View>

      </ScrollView>

      {/* ── Modals ── */}
      <PatientSelectorSheet
        visible={selectorVisible}
        patients={patients}
        selected={selectedPatient}
        onSelect={setSelectedPatient}
        onClose={() => setSelectorVisible(false)}
        loading={loadingPatients}
      />

      {selectedPatient && (
        <AddMemoryModal
          visible={modalVisible}
          onClose={() => setModalVisible(false)}
          onSave={handleSave}
          patientName={selectedPatient.name}
          activeTab={activeTab}
        />
      )}

    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG, paddingBottom: 110 },

  centerLoader: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  centerLoaderText: { fontSize: 15, fontFamily: 'Coolvetica-Regular', color: MUTED },

  // ── Header ──
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 26, paddingTop: 10, paddingBottom: 18,
  },
  headerEyebrow: {
    fontSize: 13, fontFamily: 'Coolvetica-Regular', color: MUTED,
    letterSpacing: 2, textTransform: 'uppercase', marginBottom: 4,
  },
  headerTitle: { fontSize: 34, fontFamily: 'Coolvetica-Heavy-Regular', color: DARK, lineHeight: 38 },

  // ── Accent bar ──
  accentBar: { flexDirection: 'row', paddingHorizontal: 26, gap: 6, marginBottom: 14 },
  accentLine: { height: 3, flex: 1, backgroundColor: YELLOW, borderRadius: 4 },
  accentLineShort: { flex: 0, width: 24, backgroundColor: DARK },

  // ── Patient selector ──
  patientSelector: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginHorizontal: 20, marginBottom: 14,
    backgroundColor: WHITE, borderRadius: 18, borderWidth: 1.5, borderColor: BORDER,
    paddingHorizontal: 16, paddingVertical: 12,
    shadowColor: DARK, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },
  patientSelectorLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  patientSelectorLabel: {
    fontSize: 11, fontFamily: 'Coolvetica-Regular', color: MUTED,
    textTransform: 'uppercase', letterSpacing: 1,
  },
  patientSelectorName: { fontSize: 17, fontFamily: 'Coolvetica-Bold', color: DARK },
  switchBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: TEAL + '18', paddingHorizontal: 10, paddingVertical: 6,
    borderRadius: 12, borderWidth: 1, borderColor: TEAL + '44',
  },
  switchBadgeText: { fontSize: 12, fontFamily: 'Coolvetica-Bold', color: TEAL },

  // ── Avatar ──
  avatar: {
    backgroundColor: TEAL + '22', borderWidth: 1.5, borderColor: TEAL + '55',
    justifyContent: 'center', alignItems: 'center',
  },
  avatarText: { fontFamily: 'Coolvetica-Bold', color: TEAL },

  // ── Patient selector sheet ──
  selectorTitle: { fontSize: 26, fontFamily: 'Coolvetica-Heavy-Regular', color: DARK, marginBottom: 4 },
  selectorSubtitle: { fontSize: 14, fontFamily: 'Coolvetica-Regular', color: MUTED, marginBottom: 20 },
  patientRow: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: WHITE, borderRadius: 16, borderWidth: 1.5, borderColor: BORDER,
    paddingHorizontal: 16, paddingVertical: 14, marginBottom: 10,
  },
  patientRowSelected: { borderColor: TEAL, backgroundColor: TEAL + '08' },
  patientName: { fontSize: 16, fontFamily: 'Coolvetica-Bold', color: DARK, marginBottom: 2 },
  patientEmail: { fontSize: 13, fontFamily: 'Coolvetica-Regular', color: MUTED },
  selectedCheck: {
    width: 26, height: 26, borderRadius: 13, backgroundColor: TEAL,
    justifyContent: 'center', alignItems: 'center',
  },
  noPatients: { alignItems: 'center', gap: 10, paddingVertical: 32 },
  noPatientsText: { fontSize: 15, fontFamily: 'Coolvetica-Regular', color: MUTED },

  // ── Tabs ──
  tabsContainer: { flexDirection: 'row', paddingHorizontal: 24, paddingBottom: 16, gap: 8 },
  tab: {
    flex: 1, paddingVertical: 10, borderRadius: 14,
    backgroundColor: WHITE, borderWidth: 1.5, borderColor: BORDER,
    alignItems: 'center', justifyContent: 'center',
  },
  tabActive: { backgroundColor: YELLOW, borderColor: DARK },
  tabLabel: { fontSize: 11, fontFamily: 'Coolvetica-Bold', color: MUTED, letterSpacing: 0.5 },
  tabLabelActive: { color: DARK },

  // ── Scroll ──
  scrollContent: { paddingHorizontal: 20, paddingTop: 4, paddingBottom: 36 },

  // ── Info card ──
  infoCard: {
    backgroundColor: WHITE, borderRadius: 22, borderWidth: 1.5, borderColor: BORDER,
    padding: 22, alignItems: 'center',
    shadowColor: DARK, shadowOpacity: 0.05, shadowRadius: 12, elevation: 3,
  },
  infoIconWrap: {
    width: 68, height: 68, borderRadius: 20,
    justifyContent: 'center', alignItems: 'center', marginBottom: 14,
  },
  infoTitle: {
    fontSize: 22, fontFamily: 'Coolvetica-Heavy-Regular', color: DARK,
    marginBottom: 8, textAlign: 'center',
  },
  infoSubtitle: {
    fontSize: 14, fontFamily: 'Coolvetica-Regular', color: MUTED,
    textAlign: 'center', lineHeight: 21, marginBottom: 20,
  },
  infoFields: { alignSelf: 'stretch', gap: 8, marginBottom: 22 },
  infoFieldRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  infoFieldDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: YELLOW, borderWidth: 1, borderColor: DARK },
  infoFieldText: { fontSize: 14, fontFamily: 'Coolvetica-Regular', color: DARK },
  infoBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: YELLOW, borderWidth: 1.5, borderColor: DARK,
    borderRadius: 22, paddingHorizontal: 28, paddingVertical: 14,
  },
  infoBtnText: { fontSize: 16, fontFamily: 'Coolvetica-Bold', color: DARK },

  // ── Category pills ──
  catPill: {
    paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: 20, backgroundColor: WHITE,
    borderWidth: 1.5, borderColor: BORDER,
  },
  catPillActive: { backgroundColor: YELLOW, borderColor: DARK },
  catPillText: { fontSize: 13, fontFamily: 'Coolvetica-Bold', color: MUTED },
  catPillTextActive: { color: DARK },

  // ── Image upload ──
  uploadBox: {
    backgroundColor: BG, borderWidth: 1.5, borderColor: BORDER,
    borderRadius: 16, borderStyle: 'dashed',
    padding: 20, alignItems: 'center', gap: 6,
  },
  uploadIconWrap: {
    width: 44, height: 44, borderRadius: 14,
    backgroundColor: BORDER, justifyContent: 'center', alignItems: 'center',
  },
  uploadText: { fontSize: 14, fontFamily: 'Coolvetica-Bold', color: MUTED },
  uploadSub: { fontSize: 11, fontFamily: 'Coolvetica-Regular', color: MUTED },
  thumbRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  thumb: { width: 72, height: 72, borderRadius: 12, borderWidth: 1.5, borderColor: BORDER },
  thumbRemove: {
    position: 'absolute', top: -6, right: -6,
    width: 18, height: 18, borderRadius: 9,
    backgroundColor: DARK, justifyContent: 'center', alignItems: 'center',
  },
  thumbAdd: {
    width: 72, height: 72, borderRadius: 12,
    backgroundColor: BG, borderWidth: 1.5, borderColor: BORDER, borderStyle: 'dashed',
    justifyContent: 'center', alignItems: 'center',
  },

  // ── Icon grid ──
  iconGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  iconCard: {
    width: '22%', borderRadius: 16, borderWidth: 1.5, borderColor: BORDER,
    backgroundColor: WHITE, padding: 10, alignItems: 'center', gap: 5,
    position: 'relative',
  },
  iconCardActive: { backgroundColor: YELLOW, borderColor: DARK },
  iconCheck: {
    position: 'absolute', top: 6, right: 6,
    width: 14, height: 14, borderRadius: 7,
    backgroundColor: DARK, justifyContent: 'center', alignItems: 'center',
  },
  iconWrap: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: BG, justifyContent: 'center', alignItems: 'center',
  },
  iconWrapActive: { backgroundColor: WHITE + '99' },
  iconLabel: { fontSize: 10, fontFamily: 'Coolvetica-Bold', color: MUTED, textAlign: 'center' },
  iconLabelActive: { color: DARK },

  // ── Empty / Footer ──
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12, paddingBottom: 60 },
  emptyIconWrap: {
    width: 90, height: 90, borderRadius: 28, backgroundColor: WHITE,
    borderWidth: 1.5, borderColor: BORDER, justifyContent: 'center', alignItems: 'center', marginBottom: 8,
  },
  emptyTitle: { fontSize: 22, fontFamily: 'Coolvetica-Heavy-Regular', color: DARK },
  emptySubtitle: {
    fontSize: 15, fontFamily: 'Coolvetica-Regular', color: MUTED,
    textAlign: 'center', paddingHorizontal: 40,
  },
  footerHint: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, marginTop: 24,
  },
  footerHintText: { fontSize: 12, fontFamily: 'Coolvetica-Regular', color: MUTED },

  // ── For patient banner ──
  forPatientBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 7,
    alignSelf: 'flex-start', backgroundColor: TEAL + '14',
    paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: 12, borderWidth: 1, borderColor: TEAL + '33', marginBottom: 16,
  },
  forPatientText: { fontSize: 13, fontFamily: 'Coolvetica-Regular', color: TEAL },
});

const modal = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' },
  sheetWrapper: { position: 'absolute', bottom: 0, left: 0, right: 0 },
  sheet: {
    backgroundColor: BG,
    borderTopLeftRadius: 32, borderTopRightRadius: 32,
    paddingHorizontal: 24, paddingBottom: Platform.OS === 'ios' ? 44 : 32,
    paddingTop: 16, borderTopWidth: 1.5, borderColor: BORDER,
    maxHeight: '100%',
  },
  handle: {
    alignSelf: 'center', width: 44, height: 4,
    borderRadius: 2, backgroundColor: '#D1D5DB', marginBottom: 16,
  },
  titleRow: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', marginBottom: 20,
  },
  title: { fontSize: 26, fontFamily: 'Coolvetica-Heavy-Regular', color: DARK },
  fieldLabel: {
    fontSize: 11, fontFamily: 'Coolvetica-Bold', color: MUTED,
    letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 8,
  },
  inputLarge: {
    backgroundColor: WHITE, borderWidth: 1.5, borderColor: BORDER,
    borderRadius: 16, paddingHorizontal: 18, paddingVertical: 16,
    fontSize: 18, fontFamily: 'Coolvetica-Regular', color: DARK,
    marginBottom: 16, minHeight: 70,
  },
  input: {
    backgroundColor: WHITE, borderWidth: 1.5, borderColor: BORDER,
    borderRadius: 16, paddingHorizontal: 18, paddingVertical: 14,
    fontSize: 16, fontFamily: 'Coolvetica-Regular', color: DARK, marginBottom: 16,
  },
  saveBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, backgroundColor: DARK, borderWidth: 1.5, borderColor: DARK,
    borderRadius: 18, paddingVertical: 16, marginTop: 20, marginBottom: 8,
  },
  saveBtnText: { fontSize: 16, fontFamily: 'Coolvetica-Bold', color: YELLOW },
});