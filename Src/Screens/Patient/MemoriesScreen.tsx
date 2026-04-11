import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 60) / 2;

const YELLOW = '#E3F73F';
const DARK   = '#1F2937';
const BG     = '#F4F1EC';
const MUTED  = '#9CA3AF';
const BORDER = '#E5E0D8';
const WHITE  = '#FFFFFF';

// ─── Types ────────────────────────────────────────────────────────────────────
type TabType = 'photos' | 'stories' | 'places';

// ─── Data ─────────────────────────────────────────────────────────────────────
const photos = [
  { id: '1', title: 'Wedding Day',       year: '1985', category: 'Family',      image: 'https://picsum.photos/300/300?random=1' },
  { id: '2', title: 'Trip to Manali',    year: '1992', category: 'Travel',      image: 'https://picsum.photos/300/300?random=2' },
  { id: '3', title: 'First Car',         year: '1988', category: 'Achievement', image: 'https://picsum.photos/300/300?random=3' },
  { id: '4', title: 'With Grandchildren',year: '2016', category: 'Family',      image: 'https://picsum.photos/300/300?random=4' },
];

const stories = [
  {
    id: '1',
    title: 'Our First Home',
    year: '1980',
    icon: 'home-heart',
    color: '#86EFAC',
    content: 'We moved into our first house on Maple Street in the summer of 1980. It had a small garden and a wooden swing in the backyard. That house was full of laughter and memories.',
  },
  {
    id: '2',
    title: 'Meeting Your Wife',
    year: '1978',
    icon: 'heart',
    color: '#F9A8D4',
    content: 'It was a sunny afternoon in the park when I first saw her. She was reading a book near the fountain. That moment changed my life forever.',
  },
  {
    id: '3',
    title: 'Career Journey',
    year: '1982',
    icon: 'briefcase',
    color: '#93C5FD',
    content: 'You started as a junior engineer and worked your way up to become the head of your department. Your dedication inspired many.',
  },
];

const places = [
  {
    id: '1',
    name: 'Your Home',
    address: '123 Maple Street',
    description: 'This is where you have lived for more than 40 years. Many birthdays, festivals, and family dinners happened here.',
    images: ['https://picsum.photos/200?random=11', 'https://picsum.photos/200?random=12', 'https://picsum.photos/200?random=13'],
  },
  {
    id: '2',
    name: 'Central Park',
    address: 'Downtown Area',
    description: 'You used to go here every morning for peaceful walks. You often sat near the fountain and fed the birds.',
    images: ['https://picsum.photos/200?random=14', 'https://picsum.photos/200?random=15', 'https://picsum.photos/200?random=16'],
  },
  {
    id: '3',
    name: "Sarah's Cafe",
    address: '456 Oak Avenue',
    description: 'This is where you first met Sarah. You both used to have coffee by the window every Sunday.',
    images: ['https://picsum.photos/200?random=17', 'https://picsum.photos/200?random=18', 'https://picsum.photos/200?random=19'],
  },
  {
    id: '4',
    name: 'Community Temple',
    address: 'Lakeview Road',
    description: 'You visited this temple every festival. It holds spiritual and peaceful memories for you.',
    images: ['https://picsum.photos/200?random=20', 'https://picsum.photos/200?random=21', 'https://picsum.photos/200?random=22'],
  },
  {
    id: '5',
    name: 'Old Office Building',
    address: 'Industrial Area Sector 4',
    description: 'You worked here for more than 25 years. This is where your career journey grew and flourished.',
    images: ['https://picsum.photos/200?random=23', 'https://picsum.photos/200?random=24', 'https://picsum.photos/200?random=25'],
  },
  {
    id: '6',
    name: 'Manali Hills',
    address: 'Himachal Pradesh',
    description: 'You visited this beautiful hill station with your family during summer vacations. The mountain views were unforgettable.',
    images: ['https://picsum.photos/200?random=26', 'https://picsum.photos/200?random=27', 'https://picsum.photos/200?random=28'],
  },
];

// ─── Tab config ───────────────────────────────────────────────────────────────
const TABS: { key: TabType; label: string; icon: string }[] = [
  { key: 'photos',  label: 'PHOTOS',  icon: 'image-multiple' },
  { key: 'stories', label: 'STORIES', icon: 'book-open-variant' },
  { key: 'places',  label: 'PLACES',  icon: 'map-marker-multiple' },
];

// ─── Screen ───────────────────────────────────────────────────────────────────
export default function ProfileScreen() {
  const [activeTab, setActiveTab]       = useState<TabType>('photos');
  const [expandedStory, setExpandedStory] = useState<string | null>(null);
  const [expandedPlace, setExpandedPlace] = useState<string | null>(null);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>

      {/* ── Header ── */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerEyebrow}>Your Life Story</Text>
          <Text style={styles.headerTitle}>Memories</Text>
        </View>

        {/* Count badge */}
        <View style={styles.countBadge}>
          <Icon name="clock-outline" size={13} color={DARK} />
          <Text style={styles.countBadgeText}>{photos.length + stories.length + places.length} items</Text>
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
              <Icon
                name={icon}
                size={16}
                color={isActive ? DARK : MUTED}
                style={{ marginBottom: 3 }}
              />
              <Text style={[styles.tabLabel, isActive && styles.tabLabelActive]}>
                {label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >

        {/* ── PHOTOS ── */}
        {activeTab === 'photos' && (
          <>
            <Text style={styles.sectionLabel}>Cherished Moments</Text>
            <View style={styles.photosGrid}>
              {photos.map((photo) => (
                <TouchableOpacity key={photo.id} style={styles.photoCard} activeOpacity={0.9}>
                  <Image source={{ uri: photo.image }} style={styles.photoImage} />

                  {/* Category pill */}
                  <View style={styles.categoryPill}>
                    <Text style={styles.categoryPillText}>{photo.category}</Text>
                  </View>

                  <View style={styles.photoInfo}>
                    <Text style={styles.cardTitle}>{photo.title}</Text>
                    <View style={styles.yearRow}>
                      <Icon name="calendar" size={11} color={MUTED} />
                      <Text style={styles.cardMeta}>{photo.year}</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}

        {/* ── STORIES ── */}
        {activeTab === 'stories' && (
          <>
            <Text style={styles.sectionLabel}>Life Chapters</Text>
            <View style={{ gap: 14 }}>
              {stories.map((story) => {
                const isExpanded = expandedStory === story.id;
                return (
                  <TouchableOpacity
                    key={story.id}
                    style={styles.storyCard}
                    activeOpacity={0.85}
                    onPress={() => setExpandedStory(isExpanded ? null : story.id)}
                  >
                    <View style={styles.storyTopRow}>
                      {/* Icon avatar */}
                      <View style={[styles.storyAvatar, { backgroundColor: story.color + '33' }]}>
                        <Icon name={story.icon} size={22} color={DARK} />
                      </View>

                      <View style={{ flex: 1 }}>
                        <Text style={styles.cardTitle}>{story.title}</Text>
                        <View style={styles.yearRow}>
                          <Icon name="calendar" size={11} color={MUTED} />
                          <Text style={styles.cardMeta}>{story.year}</Text>
                        </View>
                      </View>

                      <Icon
                        name={isExpanded ? 'chevron-up' : 'chevron-down'}
                        size={20}
                        color={MUTED}
                      />
                    </View>

                    {isExpanded && (
                      <View style={styles.storyBody}>
                        <Text style={styles.storyContent}>{story.content}</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </>
        )}

        {/* ── PLACES ── */}
        {activeTab === 'places' && (
          <>
            <Text style={styles.sectionLabel}>Meaningful Places</Text>
            <View style={{ gap: 14 }}>
              {places.map((place) => {
                const isExpanded = expandedPlace === place.id;
                return (
                  <TouchableOpacity
                    key={place.id}
                    style={styles.placeCard}
                    activeOpacity={0.9}
                    onPress={() => setExpandedPlace(isExpanded ? null : place.id)}
                  >
                    <View style={styles.placeTopRow}>
                      {/* Pin avatar */}
                      <View style={styles.placeAvatar}>
                        <Icon name="map-marker" size={22} color={DARK} />
                      </View>

                      <View style={{ flex: 1, marginLeft: 12 }}>
                        <Text style={styles.cardTitle}>{place.name}</Text>
                        <View style={styles.yearRow}>
                          <Icon name="map-outline" size={11} color={MUTED} />
                          <Text style={styles.cardMeta}>{place.address}</Text>
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
                        <Text style={styles.placeDescription}>{place.description}</Text>

                        <View style={styles.placePhotosRow}>
                          {place.images.map((img, index) => (
                            <Image
                              key={index}
                              source={{ uri: img }}
                              style={styles.placeImage}
                            />
                          ))}
                        </View>
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </>
        )}

        {/* Footer hint */}
        <View style={styles.footerHint}>
          <Icon name="information-outline" size={13} color={MUTED} />
          <Text style={styles.footerHintText}>
            {activeTab === 'photos'
              ? 'Tap a photo to view it'
              : 'Tap any card to expand'}
          </Text>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BG,
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

  countBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: WHITE,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: BORDER,
  },

  countBadgeText: {
    fontSize: 13,
    fontFamily: 'Coolvetica-Regular',
    color: DARK,
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

  // ── Tabs ───────────────────────────────────────────────────
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    paddingBottom: 12,
    gap: 8,
  },

  tab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 14,
    backgroundColor: WHITE,
    borderWidth: 1.5,
    borderColor: BORDER,
    alignItems: 'center',
    justifyContent: 'center',
  },

  tabActive: {
    backgroundColor: YELLOW,
    borderColor: DARK,
  },

  tabLabel: {
    fontSize: 11,
    fontFamily: 'Coolvetica-Bold',
    color: MUTED,
    letterSpacing: 0.5,
  },

  tabLabelActive: {
    color: DARK,
  },

  // ── Scroll ─────────────────────────────────────────────────
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 36,
  },

  sectionLabel: {
    fontSize: 12,
    fontFamily: 'Coolvetica-Bold',
    color: MUTED,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginBottom: 14,
    marginLeft: 2,
  },

  // ── Photos ─────────────────────────────────────────────────
  photosGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },

  photoCard: {
    width: CARD_WIDTH,
    backgroundColor: WHITE,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: BORDER,
    overflow: 'hidden',
    shadowColor: DARK,
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
  },

  photoImage: {
    width: '100%',
    height: CARD_WIDTH,
  },

  categoryPill: {
    position: 'absolute',
    top: 10,
    left: 10,
    backgroundColor: YELLOW,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: DARK,
  },

  categoryPillText: {
    fontSize: 10,
    fontFamily: 'Coolvetica-Bold',
    color: DARK,
  },

  photoInfo: {
    padding: 12,
  },

  yearRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 3,
  },

  // ── Stories ────────────────────────────────────────────────
  storyCard: {
    backgroundColor: WHITE,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: BORDER,
    padding: 16,
    shadowColor: DARK,
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },

  storyTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },

  storyAvatar: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },

  storyBody: {
    marginTop: 14,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: BORDER,
  },

  storyContent: {
    fontSize: 15,
    lineHeight: 22,
    color: '#555',
    fontFamily: 'Coolvetica-Regular',
  },

  // ── Places ─────────────────────────────────────────────────
  placeCard: {
    backgroundColor: WHITE,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: BORDER,
    padding: 16,
    shadowColor: DARK,
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },

  placeTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  placeAvatar: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: YELLOW + '33',
    justifyContent: 'center',
    alignItems: 'center',
  },

  placeDropdown: {
    marginTop: 14,
    borderTopWidth: 1,
    borderTopColor: BORDER,
    paddingTop: 14,
  },

  placeDescription: {
    fontSize: 14,
    color: '#555',
    fontFamily: 'Coolvetica-Regular',
    lineHeight: 21,
    marginBottom: 14,
  },

  placePhotosRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },

  placeImage: {
    width: 76,
    height: 76,
    borderRadius: 12,
  },

  // ── Shared ─────────────────────────────────────────────────
  cardTitle: {
    fontSize: 16,
    fontFamily: 'Coolvetica-Bold',
    color: DARK,
  },

  cardMeta: {
    fontSize: 12,
    color: MUTED,
    fontFamily: 'Coolvetica-Regular',
  },

  footerHint: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 24,
  },

  footerHintText: {
    fontSize: 12,
    fontFamily: 'Coolvetica-Regular',
    color: MUTED,
  },
});