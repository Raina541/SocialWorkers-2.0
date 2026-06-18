import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
  Pressable,
  Image,
  Modal,
  ImageBackground,
  TextInput,
  Animated,
  Alert,
} from 'react-native';
import { Colors, Spacing, Typography, Shapes } from '../constants/Theme';
import { Card } from '../components/Card';
import { Badge } from '../components/Badge';
import { Button } from '../components/Button';
import { Avatar } from '../components/Avatar';
import { HandshakeHeartIcon } from '../components/HandshakeHeartIcon';
import { OpportunityCard } from '../components/OpportunityCard';
import { MicroVolunteering } from './MicroVolunteering';
import { NotificationsScreen } from './NotificationsScreen';
import { Personalization, CauseType, Opportunity } from '../services/personalization';
import { StoryService, Story } from '../services/storyManager';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// Unsplash cause icon mapping
const CAUSE_IMAGES: Record<CauseType, string> = {
  'Education': 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=200',
  'Healthcare': 'https://images.unsplash.com/photo-1505751172876-fa1923c5c528?w=200',
  'Child Welfare': 'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?w=200',
  'Poverty Alleviation & Livelihoods': 'https://images.unsplash.com/photo-1532629345422-7515f3d16bb6?w=200',
  'Women Empowerment': 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200',
  'Disaster Relief': 'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?w=200',
  'Environment & Sustainability': 'https://images.unsplash.com/photo-1466692476868-aef1dfb1e735?w=200',
  'Animal Welfare': 'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=200',
  'Support for Persons with Disabilities': 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=200',
  'Elderly Care': 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=200',
  'Water, Sanitation, and Hygiene (WASH)': 'https://images.unsplash.com/photo-1541963463532-d68292c34b19?w=200',
  'Rural Development': 'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?w=200',
};

interface Idea {
  id: string;
  description: string;
  creatorName: string;
  creatorLogo: string;
  initialSupports: number;
  taggedFriends: string[];
  mentionsCount: number;
}

interface HomeProps {
  isDarkMode?: boolean;
  onNavigateToTab?: (index: number) => void;
}

export const Home: React.FC<HomeProps> = ({ isDarkMode = false }) => {
  const themeColors = isDarkMode ? Colors.dark : Colors.light;

  // --- State management ---
  const [causes, setCauses] = useState<CauseType[]>([]);
  const [localOpportunities, setLocalOpportunities] = useState<Opportunity[]>([]);
  const [remoteOpportunities, setRemoteOpportunities] = useState<Opportunity[]>([]);
  const [showMicroVolunteering, setShowMicroVolunteering] = useState(false);
  const [radiusFilter, setRadiusFilter] = useState<'Auto' | '5km' | '25km' | '50km' | '100km'>('Auto');

  // Story state
  const [activeStoryCause, setActiveStoryCause] = useState<CauseType | null>(null);
  const [activeStories, setActiveStories] = useState<Story[]>([]);
  const [storyIndex, setStoryIndex] = useState(0);
  const storyProgress = useRef(new Animated.Value(0)).current;
  const storyTimerRef = useRef<any>(null);

  // Notifications
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadNotificationsCount, setUnreadNotificationsCount] = useState(2);

  // Idea Threads state
  const [ideas, setIdeas] = useState<Idea[]>([
    {
      id: 'idea_1',
      description: 'Developing community kitchen gardens in abandoned plots to provide organic vegetables to low-income senior citizens.',
      creatorName: 'Morar Neighborhood Council',
      creatorLogo: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=80',
      initialSupports: 48,
      taggedFriends: ['anita', 'sunita'],
      mentionsCount: 25,
    },
    {
      id: 'idea_2',
      description: 'Setting up roadside water dispensers (Pyaus) with bio-sand filtration systems for hot summer months.',
      creatorName: 'WASH Coalition Gwalior',
      creatorLogo: 'https://images.unsplash.com/photo-1541963463532-d68292c34b19?w=80',
      initialSupports: 92,
      taggedFriends: ['rahul'],
      mentionsCount: 14,
    },
  ]);
  const [supportState, setSupportState] = useState<Record<string, boolean>>({});
  const [showMentionBoxForIdea, setShowMentionBoxForIdea] = useState<string | null>(null);
  const [newMentionText, setNewMentionText] = useState('');

  // Load and Rank Data
  const loadPersonalizedData = () => {
    // 1. Sort causes based on affinity
    setCauses(Personalization.getSortedCauses());

    // 2. Fetch and Rank Opportunities
    const allOpps = Personalization.getRawOpportunities();
    const rankedOpps = Personalization.rankOpportunities(allOpps);

    // 3. Filter local opportunities (Gwalior) based on fallback logic
    if (radiusFilter === 'Auto') {
      setLocalOpportunities(Personalization.getFilteredLocalOpportunities(rankedOpps));
    } else {
      const radiusKm = parseInt(radiusFilter.replace('km', ''));
      setLocalOpportunities(rankedOpps.filter(o => !o.isRemote && o.distanceKm <= radiusKm));
    }

    // 4. Remote opportunities
    setRemoteOpportunities(rankedOpps.filter(o => o.isRemote));
  };

  useEffect(() => {
    loadPersonalizedData();
  }, [radiusFilter]);

  // --- Story Functions ---
  const openStoriesForCause = (cause: CauseType) => {
    // Record visual click rates (Positive signal)
    Personalization.recordSignal(cause, 'OpenProfile');

    const stories = StoryService.getStories(cause);
    const lastIndex = StoryService.getLastReadIndex(cause);

    setActiveStoryCause(cause);
    setActiveStories(stories);
    setStoryIndex(lastIndex);
  };

  useEffect(() => {
    if (activeStoryCause && activeStories.length > 0) {
      startStoryTimer();
    } else {
      stopStoryTimer();
    }
    return () => stopStoryTimer();
  }, [activeStoryCause, storyIndex]);

  const startStoryTimer = () => {
    stopStoryTimer();
    storyProgress.setValue(0);
    
    // Auto-advance after 7 seconds
    Animated.timing(storyProgress, {
      toValue: 1,
      duration: 7000,
      useNativeDriver: false,
    }).start(({ finished }) => {
      if (finished) {
        handleStoryNext();
      }
    });
  };

  const stopStoryTimer = () => {
    if (storyTimerRef.current) {
      clearTimeout(storyTimerRef.current);
    }
    storyProgress.stopAnimation();
  };

  const handleStoryNext = () => {
    if (storyIndex < activeStories.length - 1) {
      const nextIdx = storyIndex + 1;
      setStoryIndex(nextIdx);
      if (activeStoryCause) {
        StoryService.saveProgress(activeStoryCause, nextIdx);
      }
    } else {
      // Completed all stories in cause (Positive signal)
      if (activeStoryCause) {
        Personalization.recordSignal(activeStoryCause, 'CompleteStory');
        // Close modal
        closeStories();
      }
    }
  };

  const handleStoryPrev = () => {
    if (storyIndex > 0) {
      const prevIdx = storyIndex - 1;
      setStoryIndex(prevIdx);
      if (activeStoryCause) {
        StoryService.saveProgress(activeStoryCause, prevIdx);
      }
    }
  };

  const closeStories = () => {
    setActiveStoryCause(null);
    setActiveStories([]);
    loadPersonalizedData(); // Re-rank dynamically based on story completion signals
  };

  // Switch cause inside story viewer (horizontal swipe simulation)
  const changeStoryCause = (direction: 'left' | 'right') => {
    if (!activeStoryCause) return;
    const currentIndex = causes.indexOf(activeStoryCause);
    let newIndex = currentIndex + (direction === 'left' ? -1 : 1);
    
    if (newIndex >= 0 && newIndex < causes.length) {
      // Record skip signal for skipped cause
      Personalization.recordSignal(activeStoryCause, 'SkipStory');
      openStoriesForCause(causes[newIndex]);
    }
  };

  // --- Ideas Functions ---
  const handleSupportIdea = (ideaId: string, cause: CauseType) => {
    const isSupported = !!supportState[ideaId];
    
    // Record positive signal on support
    if (!isSupported) {
      Personalization.recordSignal(cause, 'Support');
    }
    
    setSupportState(prev => ({ ...prev, [ideaId]: !isSupported }));
  };

  const handleAddMention = (ideaId: string, cause: CauseType) => {
    if (!newMentionText.trim()) return;

    Personalization.recordSignal(cause, 'TagFriends'); // Record tag signal

    setIdeas(prev =>
      prev.map(i => {
        if (i.id === ideaId) {
          return {
            ...i,
            taggedFriends: [...i.taggedFriends, newMentionText.trim()],
            mentionsCount: i.mentionsCount + 1,
          };
        }
        return i;
      })
    );

    setNewMentionText('');
    setShowMentionBoxForIdea(null);
    Alert.alert("Tagged!", "Your friend has been tagged on this idea thread.");
  };

  const handleNotificationPress = () => {
    setShowNotifications(true);
  };

  const handleOpportunityPress = (opp: Opportunity) => {
    // Open org profile / detailed opportunity
    Personalization.recordSignal(opp.cause, 'OpenProfile');
    
    Alert.alert(
      opp.title,
      `Would you like to sign up for this opportunity under ${opp.cause}? Located at ${opp.locationName}.`,
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Sign Up", 
          onPress: () => {
            Personalization.recordSignal(opp.cause, 'SignUp');
            Alert.alert("Thank you!", "You signed up successfully! We notified your mutual connections.");
            loadPersonalizedData();
          } 
        }
      ]
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: themeColors.neutralBackground2 }]}>
      
      {/* ## Section 1: Top Navigation ## */}
      <View style={[styles.topNav, { backgroundColor: themeColors.neutralBackground1, borderBottomColor: themeColors.neutralStroke2 }]}>
        <View style={styles.logoRow}>
          <HandshakeHeartIcon size={28} color={themeColors.brandForeground1} style={styles.logoIcon} />
          <Text style={[styles.logoText, { color: themeColors.brandForeground1 }]}>
            SocialWorkers
          </Text>
        </View>
        
        <Pressable onPress={handleNotificationPress} style={styles.notificationBell}>
          <Ionicons name="notifications-outline" size={24} color={themeColors.neutralForeground1} />
          {unreadNotificationsCount > 0 && (
            <View style={[styles.notificationBadge, { backgroundColor: themeColors.brandForeground1 }]} />
          )}
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* ## Section 2: Learn About Causes ## */}
        <Text style={[styles.sectionTitle, Typography.bodyStrong, { color: themeColors.neutralForeground1 }]}>
          Learn about causes
        </Text>
        
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.causesContainer}
        >
          {causes.map((cause) => (
            <Pressable
              key={cause}
              onPress={() => openStoriesForCause(cause)}
              style={styles.causeFrame}
            >
              <Image
                source={{ uri: CAUSE_IMAGES[cause] }}
                style={styles.causeImage}
              />
              <LinearGradient
                colors={['transparent', 'rgba(0,0,0,0.85)']}
                style={styles.causeTextOverlay}
              >
                <Text style={styles.causeTitleText} numberOfLines={2}>
                  {cause}
                </Text>
              </LinearGradient>
            </Pressable>
          ))}
        </ScrollView>

        {/* ## Section 3: Micro-Volunteering Opportunity Card ## */}
        <Card
          variant="Filled"
          size="Large"
          onPress={() => setShowMicroVolunteering(true)}
          style={[styles.microCard, { borderColor: themeColors.neutralStroke2 }]}
        >
          <View style={styles.microContentRow}>
            {/* Left stack */}
            <View style={styles.microLeft}>
              <Text style={[styles.microTitle, { color: themeColors.neutralForeground1 }]}>
                Micro-Volunteering Opportunities
              </Text>
              <Text style={[styles.microSubtitle, { color: themeColors.neutralForeground3 }]}>
                Volunteering doesn't always need to be time-consuming.
              </Text>
              
              <View style={[styles.microBadge, { backgroundColor: themeColors.brandForeground1 }]}>
                <Text style={styles.microBadgeText}>Find opportunities</Text>
              </View>
            </View>

            {/* Right Image */}
            <Image
              source={{ uri: 'https://images.unsplash.com/photo-1559027615-cd4628902d4a?w=400' }}
              style={styles.microImage}
            />
          </View>
        </Card>

        {/* ## Section 4: Location-Based Opportunities ## */}
        <View style={styles.locationHeaderRow}>
          <Text style={[Typography.bodyStrong, { color: themeColors.neutralForeground1 }]}>
            Opportunities in Gwalior
          </Text>
          
          {/* Radius toggle simulation */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.radiusRow}>
            {(['Auto', '5km', '25km', '50km', '100km'] as const).map(r => (
              <Pressable
                key={r}
                onPress={() => setRadiusFilter(r)}
                style={[
                  styles.radiusChip,
                  {
                    backgroundColor: radiusFilter === r ? themeColors.brandForeground1 : themeColors.neutralBackground3,
                  }
                ]}
              >
                <Text
                  style={{
                    color: radiusFilter === r ? '#ffffff' : themeColors.neutralForeground1,
                    fontSize: 10,
                    fontWeight: 'bold',
                  }}
                >
                  {r}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>

        <View style={styles.opportunitiesStack}>
          {localOpportunities.slice(0, 5).map(opp => (
            <OpportunityCard
              key={opp.id}
              opportunity={opp}
              onPress={() => handleOpportunityPress(opp)}
              isDarkMode={isDarkMode}
            />
          ))}

          {localOpportunities.length === 0 && (
            <View style={styles.emptyStack}>
              <Text style={[Typography.caption, { color: themeColors.neutralForeground3 }]}>
                No local opportunities found in range. Displaying fallbacks...
              </Text>
            </View>
          )}
        </View>

        {/* Volunteer from Anywhere (Remote Section) */}
        <Text style={[styles.sectionTitle, Typography.bodyStrong, { color: themeColors.neutralForeground1 }]}>
          Volunteer from anywhere
        </Text>
        <Text style={[Typography.caption, { color: themeColors.neutralForeground3, marginBottom: Spacing.xs, marginTop: -Spacing.xs }]}>
          Remote volunteering opportunities
        </Text>
        
        <View style={styles.opportunitiesStack}>
          {remoteOpportunities.map(opp => (
            <OpportunityCard
              key={opp.id}
              opportunity={opp}
              onPress={() => handleOpportunityPress(opp)}
              isDarkMode={isDarkMode}
            />
          ))}
        </View>

        {/* ## Section 5: Idea Threads ## */}
        <Text style={[styles.sectionTitle, Typography.bodyStrong, { color: themeColors.neutralForeground1 }]}>
          Idea threads
        </Text>
        <Text style={[Typography.caption, { color: themeColors.neutralForeground3, marginBottom: Spacing.s, marginTop: -Spacing.xs }]}>
          Early-stage initiatives looking for support. Show your interest to help bring these ideas to life.
        </Text>

        <View style={styles.ideasStack}>
          {ideas.map(idea => {
            const hasSupported = !!supportState[idea.id];
            return (
              <Card key={idea.id} variant="Filled" isDarkMode={isDarkMode} style={styles.ideaCard}>
                
                {/* Description */}
                <Text style={[styles.ideaDesc, { color: themeColors.neutralForeground1 }]}>
                  {idea.description}
                </Text>

                {/* Creator Profile */}
                <View style={styles.creatorRow}>
                  <Image source={{ uri: idea.creatorLogo }} style={styles.creatorAvatar} />
                  <Text style={[styles.creatorName, { color: themeColors.neutralForeground2 }]}>
                    {idea.creatorName}
                  </Text>
                </View>

                <View style={[styles.divider, { backgroundColor: themeColors.neutralStroke2 }]} />

                {/* Support and Tag bar */}
                <View style={styles.ideaActionBar}>
                  
                  {/* Left: Support button */}
                  <Pressable
                    onPress={() => handleSupportIdea(idea.id, 'Child Welfare')}
                    style={styles.ideaActionItem}
                  >
                    <HandshakeHeartIcon
                      size={20}
                      color={hasSupported ? themeColors.brandForeground1 : themeColors.neutralForeground3}
                    />
                    <Text
                      style={[
                        styles.actionCount,
                        {
                          color: hasSupported ? themeColors.brandForeground1 : themeColors.neutralForeground2,
                          fontWeight: hasSupported ? 'bold' : '500',
                        }
                      ]}
                    >
                      {idea.initialSupports + (hasSupported ? 1 : 0)}
                    </Text>
                  </Pressable>

                  {/* Right: Mention/Tag button */}
                  <Pressable
                    onPress={() => setShowMentionBoxForIdea(showMentionBoxForIdea === idea.id ? null : idea.id)}
                    style={styles.ideaActionItem}
                  >
                    <Ionicons name="people-outline" size={20} color={themeColors.neutralForeground3} />
                    <Text style={[styles.actionCount, { color: themeColors.neutralForeground2 }]}>
                      {idea.taggedFriends.slice(0, 2).join(', ')}
                      {idea.mentionsCount > 2 ? ` +${idea.mentionsCount - 2} mentions` : ' mentions'}
                    </Text>
                  </Pressable>
                </View>

                {/* Mention comment drawer input box */}
                {showMentionBoxForIdea === idea.id && (
                  <View style={[styles.mentionInputBox, { borderTopColor: themeColors.neutralStroke2 }]}>
                    <TextInput
                      value={newMentionText}
                      onChangeText={setNewMentionText}
                      placeholder="Tag a friend by name..."
                      placeholderTextColor={themeColors.neutralForegroundDisabled}
                      style={[styles.mentionInput, { color: themeColors.neutralForeground1, borderColor: themeColors.neutralStroke1 }]}
                    />
                    <Button
                      label="Tag"
                      appearance="Primary"
                      size="Small"
                      onPress={() => handleAddMention(idea.id, 'Child Welfare')}
                      isDarkMode={isDarkMode}
                    />
                  </View>
                )}

              </Card>
            );
          })}
        </View>

      </ScrollView>

      {/* --- Overlay Modals --- */}

      {/* Modal 1: Micro Volunteering Sheet */}
      <Modal visible={showMicroVolunteering} animationType="slide">
        <MicroVolunteering isDarkMode={isDarkMode} onBack={() => setShowMicroVolunteering(false)} />
      </Modal>

      {/* Modal 2: Notifications List */}
      <Modal visible={showNotifications} animationType="slide">
        <NotificationsScreen
          isDarkMode={isDarkMode}
          onBack={() => setShowNotifications(false)}
          onUnreadCountChange={(count) => setUnreadNotificationsCount(count)}
        />
      </Modal>

      {/* Modal 3: Immersive Story Viewer */}
      {activeStoryCause && activeStories.length > 0 && (
        <Modal visible={true} transparent={false} animationType="fade">
          <View style={styles.storyContainer}>
            
            {/* Story Image background */}
            <ImageBackground
              source={{ uri: activeStories[storyIndex].imageUri }}
              style={styles.storyBgImage}
              resizeMode="cover"
            >
              <LinearGradient
                colors={['rgba(0,0,0,0.6)', 'transparent', 'rgba(0,0,0,0.95)']}
                style={styles.storyGradient}
              >
                
                {/* 1. Progress indicators at top */}
                <View style={styles.storyProgressRow}>
                  {activeStories.map((s, idx) => {
                    let progressWidth: any = '0%';
                    if (idx < storyIndex) progressWidth = '100%';
                    if (idx === storyIndex) {
                      // Bind animated progress
                      return (
                        <View key={s.id} style={styles.storyProgressTrack}>
                          <Animated.View
                            style={[
                              styles.storyProgressFill,
                              {
                                width: storyProgress.interpolate({
                                  inputRange: [0, 1],
                                  outputRange: ['0%', '100%'],
                                }) as any,
                              },
                            ]}
                          />
                        </View>
                      );
                    }
                    return (
                      <View key={s.id} style={styles.storyProgressTrack}>
                        <View style={[styles.storyProgressFill, { width: progressWidth }]} />
                      </View>
                    );
                  })}
                </View>

                {/* 2. Top-left Header */}
                <View style={styles.storyHeader}>
                  <Pressable onPress={handleStoryPrev} style={styles.storyHeaderNav}>
                    <Ionicons name="chevron-back" size={24} color="#ffffff" />
                  </Pressable>
                  
                  {/* Cause Image logo + Name */}
                  <View style={styles.storyCauseBox}>
                    <Image source={{ uri: CAUSE_IMAGES[activeStoryCause] }} style={styles.storyCauseLogo} />
                    <Text style={styles.storyCauseName}>{activeStoryCause}</Text>
                  </View>

                  <Pressable onPress={closeStories} style={styles.storyCloseButton}>
                    <Ionicons name="close" size={24} color="#ffffff" />
                  </Pressable>
                </View>

                {/* Left/Right click detectors */}
                <View style={styles.storyClickRow}>
                  <Pressable style={styles.storyLeftClick} onPress={handleStoryPrev} />
                  <Pressable style={styles.storyRightClick} onPress={handleStoryNext} />
                </View>

                {/* 3. Lower content Area */}
                <View style={styles.storyContentArea}>
                  
                  {/* Headline */}
                  <Text style={styles.storyHeadline}>
                    {activeStories[storyIndex].headline}
                  </Text>

                  {/* AI Summary */}
                  <Text style={styles.storySummary}>
                    {activeStories[storyIndex].summary}
                  </Text>

                  {/* Source citation */}
                  <Text style={styles.storySource}>
                    Source: {activeStories[storyIndex].sourceName} • {activeStories[storyIndex].timestamp}
                  </Text>

                  {/* Contributors */}
                  {activeStories[storyIndex].contributorsCount > 0 && (
                    <View style={styles.storySocialRow}>
                      <View style={styles.storyAvatarsStack}>
                        {activeStories[storyIndex].contributorsAvatars.map((url, i) => (
                          <Image
                            key={url}
                            source={{ uri: url }}
                            style={[styles.storyAvatarItem, { marginLeft: i === 0 ? 0 : -8 }]}
                          />
                        ))}
                      </View>
                      <Text style={styles.storyContributorText}>
                        {activeStories[storyIndex].contributorsCount} participants impacted
                      </Text>
                    </View>
                  )}

                  {/* Swipe down / exit helper */}
                  <Text style={styles.storyExitHelper}>
                    Swipe down or press X to exit story
                  </Text>

                  {/* Persistent call-to-action button */}
                  <Pressable
                    onPress={() => {
                      closeStories();
                      // Open micro-volunteering or scroll to opportunities
                      setShowMicroVolunteering(true);
                    }}
                    style={styles.storyCtaButton}
                  >
                    <Text style={styles.storyCtaButtonText}>
                      Find opportunities to help with {activeStoryCause}
                    </Text>
                  </Pressable>

                </View>

              </LinearGradient>
            </ImageBackground>
          </View>
        </Modal>
      )}

    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topNav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: 56,
    paddingHorizontal: Spacing.m,
    borderBottomWidth: 1,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoIcon: {
    marginRight: 6,
  },
  logoText: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  notificationBell: {
    padding: Spacing.xxs,
    position: 'relative',
  },
  notificationBadge: {
    width: 8,
    height: 8,
    borderRadius: 4,
    position: 'absolute',
    top: 4,
    right: 4,
  },
  scrollContent: {
    padding: Spacing.m,
    paddingBottom: Spacing.xxl * 2,
  },
  sectionTitle: {
    marginTop: Spacing.l,
    marginBottom: Spacing.xs,
  },
  causesContainer: {
    paddingRight: Spacing.m,
    marginVertical: Spacing.xs / 2,
  },
  causeFrame: {
    width: 110,
    height: 110,
    borderRadius: Shapes.rounded + 2,
    marginRight: Spacing.s,
    overflow: 'hidden',
    position: 'relative',
  },
  causeImage: {
    width: '100%',
    height: '100%',
  },
  causeTextOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '55%',
    justifyContent: 'flex-end',
    padding: Spacing.xs,
  },
  causeTitleText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
    lineHeight: 14,
  },
  microCard: {
    marginTop: Spacing.l,
    aspectRatio: 2.3,
    padding: Spacing.xl,
    justifyContent: 'center',
  },
  microContentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  microLeft: {
    flex: 1,
    paddingRight: Spacing.m,
  },
  microTitle: {
    fontSize: 16,
    fontWeight: '700',
    lineHeight: 20,
    marginBottom: 4,
  },
  microSubtitle: {
    fontSize: 12,
    lineHeight: 16,
    marginBottom: Spacing.s,
  },
  microBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: Spacing.m,
    paddingVertical: Spacing.xs / 2,
    borderRadius: Shapes.circular,
  },
  microBadgeText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: 'bold',
  },
  microImage: {
    width: 70,
    height: 70,
    borderRadius: Shapes.rounded,
  },
  locationHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.l,
    marginBottom: Spacing.xs,
  },
  radiusRow: {
    paddingLeft: Spacing.xs,
  },
  radiusChip: {
    paddingHorizontal: Spacing.s,
    paddingVertical: 4,
    borderRadius: Shapes.circular,
    marginRight: 4,
  },
  opportunitiesStack: {
    marginVertical: Spacing.xs,
  },
  emptyStack: {
    padding: Spacing.m,
    alignItems: 'center',
  },
  ideasStack: {
    marginVertical: Spacing.xs,
  },
  ideaCard: {
    borderWidth: 1,
  },
  ideaDesc: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '500',
    marginBottom: Spacing.s,
  },
  creatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.s,
  },
  creatorAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    marginRight: Spacing.xs,
  },
  creatorName: {
    fontSize: 12,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    width: '100%',
    marginBottom: Spacing.s,
  },
  ideaActionBar: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ideaActionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: Spacing.l,
  },
  actionCount: {
    fontSize: 12,
    marginLeft: 6,
  },
  mentionInputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    paddingTop: Spacing.s,
    marginTop: Spacing.s,
  },
  mentionInput: {
    flex: 1,
    height: 36,
    borderRadius: Shapes.rounded,
    borderWidth: 1,
    paddingHorizontal: Spacing.s,
    marginRight: Spacing.s,
    fontSize: 12,
  },
  notificationOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.l,
  },
  notificationModal: {
    width: '100%',
    maxHeight: '60%',
    borderRadius: Shapes.rounded * 2,
    borderWidth: 1,
    padding: Spacing.m,
  },
  notificationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: 'transparent',
    paddingBottom: Spacing.s,
    marginBottom: Spacing.s,
  },
  notificationList: {
    flexGrow: 0,
  },
  notificationItem: {
    paddingVertical: Spacing.s,
    borderBottomWidth: 1,
  },
  storyContainer: {
    flex: 1,
    backgroundColor: '#000000',
  },
  storyBgImage: {
    width: screenWidth,
    height: screenHeight,
  },
  storyGradient: {
    flex: 1,
    justifyContent: 'space-between',
    paddingTop: 44,
    paddingBottom: 24,
    paddingHorizontal: Spacing.m,
  },
  storyProgressRow: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.xxs,
    marginBottom: Spacing.s,
  },
  storyProgressTrack: {
    flex: 1,
    height: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.35)',
    marginHorizontal: 2,
    borderRadius: 1.5,
    overflow: 'hidden',
  },
  storyProgressFill: {
    height: '100%',
    backgroundColor: '#ffffff',
  },
  storyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.xxs,
  },
  storyHeaderNav: {
    padding: Spacing.xxs,
  },
  storyCauseBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.4)',
    paddingHorizontal: Spacing.s,
    paddingVertical: 4,
    borderRadius: Shapes.rounded,
  },
  storyCauseLogo: {
    width: 20,
    height: 20,
    borderRadius: 4,
    marginRight: 6,
  },
  storyCauseName: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  storyCloseButton: {
    padding: Spacing.xxs,
  },
  storyClickRow: {
    flexDirection: 'row',
    position: 'absolute',
    top: 150,
    bottom: 250,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  storyLeftClick: {
    flex: 1,
  },
  storyRightClick: {
    flex: 1,
  },
  storyContentArea: {
    zIndex: 20,
  },
  storyHeadline: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: 'bold',
    lineHeight: 32,
    marginBottom: Spacing.s,
  },
  storySummary: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 14,
    lineHeight: 22,
    marginBottom: Spacing.s,
  },
  storySource: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 10,
    marginBottom: Spacing.s,
  },
  storySocialRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.l,
  },
  storyAvatarsStack: {
    flexDirection: 'row',
    marginRight: Spacing.s,
  },
  storyAvatarItem: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#ffffff',
  },
  storyContributorText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 11,
    fontWeight: '500',
  },
  storyExitHelper: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 9,
    textAlign: 'center',
    marginBottom: Spacing.xs,
  },
  storyCtaButton: {
    backgroundColor: '#0f6cbd', // Brand blue
    paddingVertical: Spacing.m,
    borderRadius: Shapes.rounded,
    alignItems: 'center',
    justifyContent: 'center',
  },
  storyCtaButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
  },
});

