import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Image,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { apiService } from '../../Services/apiService'; // adjust if needed

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 60) / 2;

const YELLOW = '#E3F73F';
const DARK   = '#1F2937';
const BG     = '#F4F1EC';
const MUTED  = '#9CA3AF';
const BORDER = '#E5E0D8';
const WHITE  = '#FFFFFF';

type TabType = 'photos' | 'stories' | 'places';

interface PhotoMemory {
  _id: string;
  title?: string;
  year?: string;
  category?: string;
  imageUrl?: string;
}

interface StoryMemory {
  _id: string;
  title?: string;
  year?: string;
  description?: string;
  mood?: string;
}

interface PlaceMemory {
  _id: string;
  placeName: string;
  address?: string;
  description?: string;
  photoUrl?: string;
}

const TABS: { key: TabType; label: string; icon: string }[] = [
  { key: 'photos',  label: 'PHOTOS',  icon: 'image-multiple' },
  { key: 'stories', label: 'STORIES', icon: 'book-open-variant' },
  { key: 'places',  label: 'PLACES',  icon: 'map-marker-multiple' },
];

const STORY_ICONS  = ['home-heart', 'heart', 'briefcase', 'star', 'music', 'book'];
const STORY_COLORS = ['#86EFAC', '#F9A8D4', '#93C5FD', '#FDE68A', '#C4B5FD', '#6EE7B7'];

export default function ProfileScreen() {
  const [activeTab, setActiveTab]         = useState<TabType>('photos');
  const [expandedStory, setExpandedStory] = useState<string | null>(null);
  const [expandedPlace, setExpandedPlace] = useState<string | null>(null);

  const [photos,  setPhotos]  = useState<PhotoMemory[]>([]);
  const [stories, setStories] = useState<StoryMemory[]>([]);
  const [places,  setPlaces]  = useState<PlaceMemory[]>([]);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState<string | null>(null);


  const MOOD_TO_ICON: Record<string, string> = {
  Home: 'home-heart',
  Love: 'heart',
  Work: 'briefcase',
  Travel: 'airplane',
  Celebrate: 'party-popper',
  Nature: 'tree',
  Learn: 'book-open',
  Achieve: 'trophy',
};

  useEffect(() => {
    fetchTab(activeTab);
  }, [activeTab]);

const fetchTab = async (tab: TabType) => {
  setLoading(true);
  setError(null);

  try {
    if (tab === 'photos') {
      const data = await apiService.getMemoriesByType('photo');

      setPhotos(data ?? []);
    } 
    else if (tab === 'stories') {
      const data = await apiService.getMemoriesByType('story');
     
      setStories(data ?? []);
    } 
    else if (tab === 'places') {

      const data = await apiService.getMemoriesByType('place');
      console.log(data)
      setPlaces(data ?? []);
    }
  } catch (err: any) {
    console.log('FETCH ERROR:', err?.response?.status, err?.response?.data);
    setError('Failed to load. Tap to retry.');
  } finally {
    setLoading(false);
  }
};

  const totalCount = photos.length + stories.length + places.length;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>

      {/* ── Header ── */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerEyebrow}>Your Life Story</Text>
          <Text style={styles.headerTitle}>Memories</Text>
        </View>
        <View style={styles.countBadge}>
          <Icon name="clock-outline" size={13} color={DARK} />
          <Text style={styles.countBadgeText}>{totalCount} items</Text>
        </View>
      </View>

      {/* ── Accent Bar ── */}
      <View style={styles.accentBar}>
        <View style={styles.accentLine} />
        <View style={[styles.accentLine, styles.accentLineShort]} />
      </View>

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

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {/* ── Loading ── */}
        {loading && (
          <View style={styles.centerState}>
            <ActivityIndicator size="large" color={DARK} />
            <Text style={styles.centerStateText}>Loading memories...</Text>
          </View>
        )}

        {/* ── Error ── */}
        {!loading && error && (
          <View style={styles.centerState}>
            <Icon name="alert-circle-outline" size={36} color={MUTED} />
            <Text style={styles.centerStateText}>{error}</Text>
            <TouchableOpacity style={styles.retryBtn} onPress={() => fetchTab(activeTab)}>
              <Text style={styles.retryBtnText}>Retry</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ── Empty ── */}
        {!loading && !error && activeTab === 'photos'  && photos.length  === 0 && (
          <View style={styles.centerState}>
            <Icon name="image-off-outline" size={40} color={MUTED} />
            <Text style={styles.centerStateText}>No photo memories yet</Text>
          </View>
        )}
        {!loading && !error && activeTab === 'stories' && stories.length === 0 && (
          <View style={styles.centerState}>
            <Icon name="book-off-outline" size={40} color={MUTED} />
            <Text style={styles.centerStateText}>No stories yet</Text>
          </View>
        )}
        {!loading && !error && activeTab === 'places'  && places.length  === 0 && (
          <View style={styles.centerState}>
            <Icon name="map-marker-off-outline" size={40} color={MUTED} />
            <Text style={styles.centerStateText}>No places yet</Text>
          </View>
        )}

        {/* ── PHOTOS ── */}
        {!loading && !error && activeTab === 'photos' && photos.length > 0 && (
          <>
            <Text style={styles.sectionLabel}>Cherished Moments</Text>
            <View style={styles.photosGrid}>
              {photos.map((photo) => (
                  <TouchableOpacity key={photo._id} style={styles.photoCard} activeOpacity={0.9}>

                    {photo.data?.imageUrl ? (
                      <Image
                        source={{ uri: photo.data.imageUrl }}
                        style={styles.photoImage}
                      />
                    ) : (
                      <View style={[styles.photoImage, styles.noImage]}>
                        <Icon name="image-off-outline" size={24} color={MUTED} />
                      </View>
                    )}

                    <View style={styles.categoryPill}>
                      <Text style={styles.categoryPillText}>
                        {photo.data?.category || 'Memory'}
                      </Text>
                    </View>

                    <View style={styles.photoInfo}>
                      <Text style={styles.cardTitle}>
                        {photo.title || 'Untitled'}
                      </Text>

                      <View style={styles.yearRow}>
                        <Icon name="calendar" size={11} color={MUTED} />
                        <Text style={styles.cardMeta}>
                          {photo.year || '—'}
                        </Text>
                      </View>
                    </View>

                  </TouchableOpacity>
                ))}
            </View>
          </>
        )}

        {/* ── STORIES ── */}
        {!loading && !error && activeTab === 'stories' && stories.length > 0 && (
          <>
            <Text style={styles.sectionLabel}>Life Chapters</Text>
            <View style={{ gap: 14 }}>
              {stories.map((story, index) => {
  const isExpanded = expandedStory === story._id;
  const color = STORY_COLORS[index % STORY_COLORS.length];
  const icon  = STORY_ICONS[index % STORY_ICONS.length];

  return (
    <TouchableOpacity
      key={story._id}
      style={styles.storyCard}
      activeOpacity={0.85}
      onPress={() => setExpandedStory(isExpanded ? null : story._id)}
    >
      <View style={styles.storyTopRow}>
        <View style={[styles.storyAvatar, { backgroundColor: color + '33' }]}>
          <Icon
            name={MOOD_TO_ICON[story.data?.mood] || 'book-open'}
            size={22}
            color={DARK}
          />
        </View>

        <View style={{ flex: 1 }}>
          <Text style={styles.cardTitle}>
            {story.title || 'Untitled'}
          </Text>

          {/* 🔥 Mood */}
          {story.data?.mood && (
            <Text style={{ fontSize: 12, color: MUTED }}>
              {story.data.mood}
            </Text>
          )}

          <View style={styles.yearRow}>
            <Icon name="calendar" size={11} color={MUTED} />
            <Text style={styles.cardMeta}>
              {story.year || '—'}
            </Text>
          </View>
        </View>

        <Icon name={isExpanded ? 'chevron-up' : 'chevron-down'} size={20} color={MUTED} />
      </View>

      {isExpanded && (
        <View style={styles.storyBody}>
          <Text style={styles.storyContent}>
            {story.data?.description || 'No content available.'}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
})}
            </View>
          </>
        )}

        {/* ── PLACES ── */}
        {!loading && !error && activeTab === 'places' && places.length > 0 && (
          <>
            <Text style={styles.sectionLabel}>Meaningful Places</Text>
            <View style={{ gap: 14 }}>
              {places.map((place) => {
  const isExpanded = expandedPlace === place._id;

  return (
    <TouchableOpacity
      key={place._id}
      style={styles.placeCard}
      activeOpacity={0.9}
      onPress={() => setExpandedPlace(isExpanded ? null : place._id)}
    >
      <View style={styles.placeTopRow}>
        <View style={styles.placeAvatar}>
          <Icon name="map-marker" size={22} color={DARK} />
        </View>

        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={styles.cardTitle}>
            {place.data?.placeName || 'Unnamed Place'}
          </Text>

          <View style={styles.yearRow}>
            <Icon name="map-outline" size={11} color={MUTED} />
            <Text style={styles.cardMeta}>
              {place.data?.address || '—'}
            </Text>
          </View>
        </View>

        <Icon
          name={isExpanded ? 'chevron-up' : 'chevron-down'}
          size={20}
          color={MUTED}
        />
      </View>

      {isExpanded && (
        <View style={styles.placeDropdown}>
          <Text style={styles.placeDescription}>
            {place.data?.description || 'No description available.'}
          </Text>

          {place.data?.photoUrl && (
            <View style={styles.placePhotosRow}>
              <Image
                source={{ uri: place.data.photoUrl }}
                style={styles.placeImage}
              />
            </View>
          )}
        </View>
      )}
    </TouchableOpacity>
  );
})}
            </View>
          </>
        )}

        {/* ── Footer hint ── */}
        {!loading && !error && (
          <View style={styles.footerHint}>
            <Icon name="information-outline" size={13} color={MUTED} />
            <Text style={styles.footerHintText}>
              {activeTab === 'photos' ? 'Tap a photo to view it' : 'Tap any card to expand'}
            </Text>
          </View>
        )}

      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG , paddingBottom: 110 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 26, paddingTop: 10, paddingBottom: 18,
  },
  headerEyebrow: {
    fontSize: 13, fontFamily: 'Coolvetica-Regular', color: MUTED,
    letterSpacing: 2, textTransform: 'uppercase', marginBottom: 4,
  },
  headerTitle: { fontSize: 34, fontFamily: 'Coolvetica-Heavy-Regular', color: DARK, lineHeight: 38 },
  countBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: WHITE,
    paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20, borderWidth: 1.5, borderColor: BORDER,
  },
  countBadgeText: { fontSize: 13, fontFamily: 'Coolvetica-Regular', color: DARK },
  accentBar: { flexDirection: 'row', paddingHorizontal: 26, gap: 6, marginBottom: 10 },
  accentLine: { height: 3, flex: 1, backgroundColor: YELLOW, borderRadius: 4 },
  accentLineShort: { flex: 0, width: 24, backgroundColor: DARK },
  tabsContainer: { flexDirection: 'row', paddingHorizontal: 24, paddingBottom: 12, gap: 8 },
  tab: {
    flex: 1, paddingVertical: 10, borderRadius: 14, backgroundColor: WHITE,
    borderWidth: 1.5, borderColor: BORDER, alignItems: 'center', justifyContent: 'center',
  },
  tabActive: { backgroundColor: YELLOW, borderColor: DARK },
  tabLabel: { fontSize: 11, fontFamily: 'Coolvetica-Bold', color: MUTED, letterSpacing: 0.5 },
  tabLabelActive: { color: DARK },
  scrollContent: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 36 },
  sectionLabel: {
    fontSize: 12, fontFamily: 'Coolvetica-Bold', color: MUTED,
    letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 14, marginLeft: 2,
  },
  photosGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  photoCard: {
    width: CARD_WIDTH, backgroundColor: WHITE, borderRadius: 18, borderWidth: 1.5,
    borderColor: BORDER, overflow: 'hidden', shadowColor: DARK, shadowOpacity: 0.06,
    shadowRadius: 10, elevation: 3,
  },
  photoImage: { width: '100%', height: CARD_WIDTH },
  categoryPill: {
    position: 'absolute', top: 10, left: 10, backgroundColor: YELLOW,
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10, borderWidth: 1, borderColor: DARK,
  },
  categoryPillText: { fontSize: 10, fontFamily: 'Coolvetica-Bold', color: DARK },
  photoInfo: { padding: 12 },
  yearRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 3 },
  storyCard: {
    backgroundColor: WHITE, borderRadius: 18, borderWidth: 1.5, borderColor: BORDER,
    padding: 16, shadowColor: DARK, shadowOpacity: 0.05, shadowRadius: 10, elevation: 2,
  },
  storyTopRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  storyAvatar: { width: 48, height: 48, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  storyBody: { marginTop: 14, paddingTop: 14, borderTopWidth: 1, borderTopColor: BORDER },
  storyContent: { fontSize: 15, lineHeight: 22, color: '#555', fontFamily: 'Coolvetica-Regular' },
  placeCard: {
    backgroundColor: WHITE, borderRadius: 18, borderWidth: 1.5, borderColor: BORDER,
    padding: 16, shadowColor: DARK, shadowOpacity: 0.05, shadowRadius: 10, elevation: 2,
  },
  placeTopRow: { flexDirection: 'row', alignItems: 'center' },
  placeAvatar: {
    width: 48, height: 48, borderRadius: 14,
    backgroundColor: YELLOW + '33', justifyContent: 'center', alignItems: 'center',
  },
  placeDropdown: { marginTop: 14, borderTopWidth: 1, borderTopColor: BORDER, paddingTop: 14 },
  placeDescription: { fontSize: 14, color: '#555', fontFamily: 'Coolvetica-Regular', lineHeight: 21, marginBottom: 14 },
  placePhotosRow: { flexDirection: 'row', justifyContent: 'space-between' },
  placeImage: { width: 76, height: 76, borderRadius: 12 },
  cardTitle: { fontSize: 16, fontFamily: 'Coolvetica-Bold', color: DARK },
  cardMeta: { fontSize: 12, color: MUTED, fontFamily: 'Coolvetica-Regular' },
  centerState: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60, gap: 12 },
  centerStateText: { fontSize: 14, fontFamily: 'Coolvetica-Regular', color: MUTED, textAlign: 'center' },
  retryBtn: {
    marginTop: 8, backgroundColor: YELLOW, paddingHorizontal: 24,
    paddingVertical: 10, borderRadius: 12, borderWidth: 1.5, borderColor: DARK,
  },
  retryBtnText: { fontSize: 14, fontFamily: 'Coolvetica-Bold', color: DARK },
  footerHint: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 24 },
  footerHintText: { fontSize: 12, fontFamily: 'Coolvetica-Regular', color: MUTED },
});