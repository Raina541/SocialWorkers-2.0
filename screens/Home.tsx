import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
  Pressable,
  Image,
  ImageBackground,
  TextInput,
  Animated,
  Alert,
  BackHandler,
  Easing,
  PanResponder,
  Modal,
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
import { RelaxedVolunteerIllustration } from '../components/RelaxedVolunteerIllustration';
import { Personalization, CauseType, Opportunity, Idea, NotificationItem, MOCK_FRIENDS, Friend } from '../services/personalization';
import { StoryService, Story } from '../services/storyManager';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// Odometer Rolling Number Component
interface OdometerTextProps {
  value: number;
  style?: any;
}

const OdometerText: React.FC<OdometerTextProps> = ({ value, style }) => {
  const [prevVal, setPrevVal] = useState(value);
  const [currVal, setCurrVal] = useState(value);
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (value !== currVal) {
      setPrevVal(currVal);
      setCurrVal(value);
      anim.setValue(0);
      Animated.timing(anim, {
        toValue: 1,
        duration: 350,
        useNativeDriver: true,
      }).start();
    }
  }, [value]);

  if (prevVal === currVal) {
    return <Text style={style}>{currVal}</Text>;
  }

  const translateY = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -22],
  });

  return (
    <View style={{ height: 22, overflow: 'hidden' }}>
      <Animated.View style={{ transform: [{ translateY }] }}>
        <Text style={[style, { height: 22, lineHeight: 22 }]}>{prevVal}</Text>
        <Text style={[style, { height: 22, lineHeight: 22 }]}>{currVal}</Text>
      </Animated.View>
    </View>
  );
};

// Interactive Support Button Component with scale spring pop animation
interface SupportButtonProps {
  ideaId: string;
  initialCount: number;
  hasSupported: boolean;
  onPress: () => void;
  isDarkMode: boolean;
  themeColors: any;
}

const SupportButton: React.FC<SupportButtonProps> = ({
  ideaId,
  initialCount,
  hasSupported,
  onPress,
  isDarkMode,
  themeColors,
}) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const currentCount = initialCount + (hasSupported ? 1 : 0);
  const supportTaps = Personalization.getSupportTapsCount();
  const showLabel = supportTaps < 3;

  const handlePress = () => {
    // Heart scale animation: 1 -> 1.3 -> 1
    scaleAnim.setValue(1);
    Animated.sequence([
      Animated.spring(scaleAnim, {
        toValue: 1.3,
        useNativeDriver: true,
        friction: 4,
        tension: 40,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1.0,
        useNativeDriver: true,
        friction: 4,
        tension: 40,
      }),
    ]).start();

    onPress();
  };

  return (
    <Pressable
      onPress={handlePress}
      style={{
        borderColor: themeColors.brandForeground1,
        borderWidth: 1.5,
        backgroundColor: hasSupported ? themeColors.brandBackgroundSubtle : 'transparent',
        paddingHorizontal: Spacing.s + 4,
        height: 44, // Tap target >= 44px
        borderRadius: 22,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        minWidth: 90,
      }}
    >
      <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
        <Ionicons
          name={hasSupported ? "heart" : "heart-outline"}
          size={20}
          color={themeColors.brandForeground1}
        />
      </Animated.View>
      
      {showLabel && (
        <Text style={{ color: themeColors.brandForeground1, marginLeft: 6, fontSize: 13, fontWeight: '600' }}>
          Support
        </Text>
      )}

      {showLabel && (
        <Text style={{ color: themeColors.brandForeground1, marginHorizontal: 4 }}>·</Text>
      )}

      <OdometerText
        value={currentCount}
        style={{
          color: themeColors.brandForeground1,
          fontWeight: '600',
          fontSize: 17, // ~16-18px semibold
          marginLeft: showLabel ? 0 : 6,
        }}
      />
    </Pressable>
  );
};

const CARD_WIDTH = ((screenWidth - Spacing.m * 2 - Spacing.s * 1.3) / 2.3) * 0.9;

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



interface HomeProps {
  isDarkMode?: boolean;
  onNavigateToTab?: (index: number) => void;
  onSetPagerScrollEnabled?: (enabled: boolean) => void;
}

export const Home: React.FC<HomeProps> = ({
  isDarkMode = false,
  onNavigateToTab,
  onSetPagerScrollEnabled,
}) => {
  const themeColors = isDarkMode ? Colors.dark : Colors.light;
  const isCompactScreen = screenWidth < 380;

  // --- State management ---
  const [causes, setCauses] = useState<CauseType[]>([]);
  const [localOpportunities, setLocalOpportunities] = useState<Opportunity[]>([]);
  const [remoteOpportunities, setRemoteOpportunities] = useState<Opportunity[]>([]);
  // Story state
  const [activeStoryCause, setActiveStoryCause] = useState<CauseType | null>(null);
  const [activeStories, setActiveStories] = useState<Story[]>([]);
  const [storyIndex, setStoryIndex] = useState(0);
  const storyProgress = useRef(new Animated.Value(0)).current;
  const storyTimerRef = useRef<any>(null);

  // Notifications
  const [unreadNotificationsCount, setUnreadNotificationsCount] = useState(
    Personalization.getNotifications().filter(n => n.unread).length
  );

  // --- Custom Transition & Gesture Implementation ---
  const isTransitioning = useRef(false);
  const microVolunteeringAnim = useRef(new Animated.Value(0)).current;
  const notificationsAnim = useRef(new Animated.Value(0)).current;

  const [isMicroVolunteeringMounted, setIsMicroVolunteeringMounted] = useState(false);
  const [isNotificationsMounted, setIsNotificationsMounted] = useState(false);

  const openMicroVolunteering = () => {
    if (isTransitioning.current) return;
    isTransitioning.current = true;
    setIsMicroVolunteeringMounted(true);
    Animated.timing(microVolunteeringAnim, {
      toValue: 1,
      duration: 300,
      easing: Easing.out(Easing.ease),
      useNativeDriver: true,
    }).start(() => {
      isTransitioning.current = false;
    });
  };

  const closeMicroVolunteering = () => {
    if (isTransitioning.current) return;
    isTransitioning.current = true;
    Animated.timing(microVolunteeringAnim, {
      toValue: 0,
      duration: 300,
      easing: Easing.out(Easing.ease),
      useNativeDriver: true,
    }).start(() => {
      setIsMicroVolunteeringMounted(false);
      isTransitioning.current = false;
    });
  };

  const openNotifications = () => {
    if (isTransitioning.current) return;
    isTransitioning.current = true;
    setIsNotificationsMounted(true);
    Animated.timing(notificationsAnim, {
      toValue: 1,
      duration: 300,
      easing: Easing.out(Easing.ease),
      useNativeDriver: true,
    }).start(() => {
      isTransitioning.current = false;
    });
  };

  const closeNotifications = () => {
    if (isTransitioning.current) return;
    isTransitioning.current = true;
    Animated.timing(notificationsAnim, {
      toValue: 0,
      duration: 300,
      easing: Easing.out(Easing.ease),
      useNativeDriver: true,
    }).start(() => {
      setIsNotificationsMounted(false);
      isTransitioning.current = false;
    });
  };

  const microVolunteeringPanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: (evt, gestureState) => {
        return gestureState.x0 < 40 && !isTransitioning.current;
      },
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        return gestureState.x0 < 40 && gestureState.dx > 10 && Math.abs(gestureState.dy) < Math.abs(gestureState.dx) && !isTransitioning.current;
      },
      onPanResponderGrant: (evt, gestureState) => {
        microVolunteeringAnim.stopAnimation();
      },
      onPanResponderMove: (evt, gestureState) => {
        let progress = 1 - (gestureState.dx / screenWidth);
        progress = Math.max(0, Math.min(1, progress));
        microVolunteeringAnim.setValue(progress);
      },
      onPanResponderRelease: (evt, gestureState) => {
        if (gestureState.dx > screenWidth * 0.3 || gestureState.vx > 0.5) {
          isTransitioning.current = true;
          Animated.timing(microVolunteeringAnim, {
            toValue: 0,
            duration: 250,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
          }).start(() => {
            setIsMicroVolunteeringMounted(false);
            isTransitioning.current = false;
          });
        } else {
          isTransitioning.current = true;
          Animated.timing(microVolunteeringAnim, {
            toValue: 1,
            duration: 200,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
          }).start(() => {
            isTransitioning.current = false;
          });
        }
      },
      onPanResponderTerminate: (evt, gestureState) => {
        isTransitioning.current = true;
        Animated.timing(microVolunteeringAnim, {
          toValue: 1,
          duration: 200,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }).start(() => {
          isTransitioning.current = false;
        });
      },
    })
  ).current;

  const notificationsPanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: (evt, gestureState) => {
        return gestureState.x0 < 40 && !isTransitioning.current;
      },
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        return gestureState.x0 < 40 && gestureState.dx > 10 && Math.abs(gestureState.dy) < Math.abs(gestureState.dx) && !isTransitioning.current;
      },
      onPanResponderGrant: (evt, gestureState) => {
        notificationsAnim.stopAnimation();
      },
      onPanResponderMove: (evt, gestureState) => {
        let progress = 1 - (gestureState.dx / screenWidth);
        progress = Math.max(0, Math.min(1, progress));
        notificationsAnim.setValue(progress);
      },
      onPanResponderRelease: (evt, gestureState) => {
        if (gestureState.dx > screenWidth * 0.3 || gestureState.vx > 0.5) {
          isTransitioning.current = true;
          Animated.timing(notificationsAnim, {
            toValue: 0,
            duration: 250,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
          }).start(() => {
            setIsNotificationsMounted(false);
            isTransitioning.current = false;
          });
        } else {
          isTransitioning.current = true;
          Animated.timing(notificationsAnim, {
            toValue: 1,
            duration: 200,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
          }).start(() => {
            isTransitioning.current = false;
          });
        }
      },
      onPanResponderTerminate: (evt, gestureState) => {
        isTransitioning.current = true;
        Animated.timing(notificationsAnim, {
          toValue: 1,
          duration: 200,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }).start(() => {
          isTransitioning.current = false;
        });
      },
    })
  ).current;

  useEffect(() => {
    const handleBackButton = () => {
      if (isNotificationsMounted && !isTransitioning.current) {
        closeNotifications();
        return true;
      }
      if (isMicroVolunteeringMounted && !isTransitioning.current) {
        closeMicroVolunteering();
        return true;
      }
      return false;
    };

    const subscription = BackHandler.addEventListener('hardwareBackPress', handleBackButton);
    return () => {
      subscription.remove();
    };
  }, [isMicroVolunteeringMounted, isNotificationsMounted]);

  // Idea Threads state synced with Personalization store
  const [ideas, setIdeas] = useState<Idea[]>(Personalization.getIdeas());
  const [supportState, setSupportState] = useState<Record<string, boolean>>({});
  const [highlightedIdeaId, setHighlightedIdeaId] = useState<string | null>(null);

  // Toast state
  const toastAnim = useRef(new Animated.Value(0)).current;
  const [toast, setToast] = useState<{ message: string; onUndo: () => void } | null>(null);
  const toastTimeoutRef = useRef<any>(null);

  const showToast = (message: string, onUndo: () => void) => {
    setToast({ message, onUndo });
    toastAnim.setValue(0);
    Animated.timing(toastAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();

    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current);
    }
    toastTimeoutRef.current = setTimeout(() => {
      hideToast();
    }, 4000);
  };

  const hideToast = () => {
    Animated.timing(toastAnim, {
      toValue: 0,
      duration: 250,
      useNativeDriver: true,
    }).start(() => {
      setToast(null);
    });
  };

  // Friend Picker state
  const [pickerIdeaId, setPickerIdeaId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFriends, setSelectedFriends] = useState<string[]>([]);
  const pickerAnim = useRef(new Animated.Value(0)).current;

  const openPicker = (ideaId: string) => {
    const idea = ideas.find(i => i.id === ideaId);
    if (!idea) return;
    setPickerIdeaId(ideaId);
    setSearchQuery('');
    setSelectedFriends([...idea.taggedFriends]);
    pickerAnim.setValue(0);
    Animated.timing(pickerAnim, {
      toValue: 1,
      duration: 350,
      useNativeDriver: true,
    }).start();
  };

  const closePicker = () => {
    Animated.timing(pickerAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setPickerIdeaId(null);
    });
  };

  const mainScrollViewRef = useRef<ScrollView>(null);

  const handleScrollToIdea = (ideaId: string) => {
    // Wait slightly for screen transition to complete, then scroll
    setTimeout(() => {
      mainScrollViewRef.current?.scrollToEnd({ animated: true });
      setHighlightedIdeaId(ideaId);
      setTimeout(() => {
        setHighlightedIdeaId(null);
      }, 2200);
    }, 400);
  };

  // Load and Rank Data
  const loadPersonalizedData = () => {
    // 1. Sort causes based on affinity
    setCauses(Personalization.getSortedCauses());

    // 2. Fetch and Rank Opportunities
    const allOpps = Personalization.getRawOpportunities();
    const rankedOpps = Personalization.rankOpportunities(allOpps);

    // 3. Filter local opportunities (Gwalior) based on dynamic search radius expansion
    const candidates = rankedOpps.filter(opp => {
      if (opp.isRemote) {
        // Only keep remote opportunities that match the user's city/location
        return (
          opp.organizationName.toLowerCase().includes('gwalior') ||
          opp.locationName.toLowerCase().includes('gwalior') ||
          opp.title.toLowerCase().includes('gwalior')
        );
      }
      return true;
    });

    let finalOpps: Opportunity[] = [];
    const tiers = [5, 25, 50, 100];
    for (const radius of tiers) {
      const matchedLocal = candidates.filter(o => !o.isRemote && o.distanceKm <= radius);
      if (matchedLocal.length >= 5) {
        finalOpps = matchedLocal;
        break;
      }
      finalOpps = matchedLocal;
    }

    // If still less than 5 opportunities after all local search levels, add allowed remote opportunities
    if (finalOpps.length < 5) {
      const matchedRemote = candidates.filter(o => o.isRemote);
      // Append unique remote items
      finalOpps = [...finalOpps, ...matchedRemote.filter(ro => !finalOpps.some(fo => fo.id === ro.id))];
    }

    // Sort according to Recommendation Priority Order:
    // 1. Local (<=5km)
    // 2. Nearby (>5km)
    // 3. Remote
    finalOpps.sort((a, b) => {
      const getPriority = (o: Opportunity) => {
        if (o.isRemote) return 3;
        if (o.distanceKm <= 5) return 1;
        return 2;
      };
      const priorityA = getPriority(a);
      const priorityB = getPriority(b);
      if (priorityA !== priorityB) {
        return priorityA - priorityB;
      }
      // If priorities are equal, preserve the original ranked order
      return rankedOpps.indexOf(a) - rankedOpps.indexOf(b);
    });

    setLocalOpportunities(finalOpps);

    // 4. Remote opportunities
    setRemoteOpportunities(rankedOpps.filter(o => o.isRemote));
  };

  useEffect(() => {
    loadPersonalizedData();
  }, []);

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
      Personalization.incrementSupportTapsCount();
    }
    
    const newSupported = !isSupported;
    setSupportState(prev => ({ ...prev, [ideaId]: newSupported }));

    // Update the ideas list
    const updatedIdeas = ideas.map(i => {
      if (i.id === ideaId) {
        return {
          ...i,
          initialSupports: i.initialSupports, // SupportButton calculates dynamic count
        };
      }
      return i;
    });
    setIdeas(updatedIdeas);
    Personalization.updateIdea(ideaId, { initialSupports: updatedIdeas.find(i => i.id === ideaId)!.initialSupports });
  };

  const handleDonePicker = () => {
    if (!pickerIdeaId) return;
    const idea = ideas.find(i => i.id === pickerIdeaId);
    if (!idea) return;

    const oldFriends = idea.taggedFriends;
    const newFriends = selectedFriends;

    if (newFriends.length > 10) {
      Alert.alert("Limit Reached", "You can mention up to 10 friends per idea thread.");
      return;
    }

    const added = newFriends.filter(f => !oldFriends.includes(f));
    const removed = oldFriends.filter(f => !newFriends.includes(f));

    // Update local state and personalization store
    const updatedIdeas = ideas.map(i => {
      if (i.id === pickerIdeaId) {
        return {
          ...i,
          taggedFriends: newFriends,
          mentionsCount: i.mentionsCount + added.length - removed.length,
        };
      }
      return i;
    });

    setIdeas(updatedIdeas);
    const updatedIdea = updatedIdeas.find(i => i.id === pickerIdeaId)!;
    Personalization.updateIdea(pickerIdeaId, {
      taggedFriends: updatedIdea.taggedFriends,
      mentionsCount: updatedIdea.mentionsCount,
    });

    closePicker();

    // Show Confirmation Toast with Undo
    if (added.length > 0) {
      showToast(`Mentioned ${added.length} friend${added.length === 1 ? '' : 's'}`, () => {
        // Undo Action: Revert back to oldFriends
        const revertedIdeas = ideas.map(i => {
          if (i.id === pickerIdeaId) {
            return {
              ...i,
              taggedFriends: oldFriends,
              mentionsCount: idea.mentionsCount, // original mentionsCount
            };
          }
          return i;
        });
        setIdeas(revertedIdeas);
        Personalization.updateIdea(pickerIdeaId, {
          taggedFriends: oldFriends,
          mentionsCount: idea.mentionsCount,
        });
      });

      // Simulated mention notification for the mentioned friends:
      // A second later they get a notification in the feed
      setTimeout(() => {
        Personalization.addNotification({
          title: "Anita thinks you'd care about this idea",
          body: `Anita tagged you in the "${idea.description.substring(0, 30)}..." Idea Thread.`,
          category: "New Message",
          unread: true,
          senderName: "anita (Friend)",
          senderLogo: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80",
          ideaId: idea.id,
        });
        // Sync unread notifications count badge on Home
        setUnreadNotificationsCount(Personalization.getNotifications().filter(n => n.unread).length);
      }, 1500);
    }
  };

  const handleNotificationPress = () => {
    openNotifications();
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

  const mainTranslateX = Animated.add(
    microVolunteeringAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [0, -screenWidth * 0.15],
    }),
    notificationsAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [0, -screenWidth * 0.15],
    })
  );

  const getFriendsLists = () => {
    const query = searchQuery.toLowerCase().trim();
    const filtered = MOCK_FRIENDS.filter(f =>
      f.displayName.toLowerCase().includes(query) || f.username.toLowerCase().includes(query)
    );

    const recent = filtered.filter(f => f.recentInteraction);
    const others = filtered.filter(f => !f.recentInteraction).sort((a, b) => a.displayName.localeCompare(b.displayName));
    
    return { recent, others };
  };

  const { recent: recentFriends, others: allFriendsFiltered } = getFriendsLists();

  return (
    <View style={[styles.container, { backgroundColor: themeColors.neutralBackground2 }]}>
      <Animated.View style={{ flex: 1, transform: [{ translateX: mainTranslateX }] }}>
      
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

      <ScrollView ref={mainScrollViewRef} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* ## Section 2: Causes Carousel ## */}
        
        <View
          onTouchStart={() => onSetPagerScrollEnabled?.(false)}
          onTouchEnd={() => onSetPagerScrollEnabled?.(true)}
          onTouchCancel={() => onSetPagerScrollEnabled?.(true)}
        >
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.causesContainer}
            snapToInterval={CARD_WIDTH + Spacing.s}
            decelerationRate="fast"
            nestedScrollEnabled={true}
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
        </View>

        {/* ## Section 3: Micro-Volunteering Opportunity Card ## */}
        <Card
          variant="Filled"
          onPress={() => openMicroVolunteering()}
          isDarkMode={isDarkMode}
          style={[
            styles.microCard,
            {
              borderColor: themeColors.neutralStroke2,
              backgroundColor: themeColors.neutralBackground1,
              overflow: 'visible', // Allow overflow within card padding area
            }
          ]}
        >
          <View style={[styles.microContentRow, isCompactScreen && styles.microContentRowVertical]}>
            {/* Left stack (approximately 55-60% width on horizontal layout) */}
            <View style={[styles.microLeft, isCompactScreen && styles.microLeftVertical]}>
              <View>
                <Text style={[styles.microTitle, { color: themeColors.neutralForeground1 }]}>
                  Micro-Volunteering Opportunities
                </Text>
                <Text style={[styles.microSubtitle, { color: themeColors.neutralForeground3 }]}>
                  Volunteering doesn't always need to be time-consuming. Find bite-sized tasks.
                </Text>
              </View>
              
              <Pressable
                onPress={() => openMicroVolunteering()}
                style={[
                  styles.microCtaButton,
                  { backgroundColor: themeColors.brandBackground }
                ]}
              >
                <Text style={styles.microCtaButtonText}>Find opportunities</Text>
              </Pressable>
            </View>

            {/* Right Section (approximately 40-45% width on horizontal layout) */}
            <View style={[styles.microRight, isCompactScreen && styles.microRightVertical]}>
              <RelaxedVolunteerIllustration
                color={themeColors.brandForeground1}
                size={isCompactScreen ? 110 : 125}
                style={isCompactScreen ? styles.microIllustrationVertical : styles.microIllustration}
              />
            </View>
          </View>
        </Card>

        {/* ## Section 4: Location-Based Opportunities ## */}
        {localOpportunities.length >= 3 && (
          <View>
            <View style={styles.locationHeaderRow}>
              <Text style={[Typography.sectionHeading, { color: themeColors.neutralForeground1 }]}>
                {localOpportunities.some(opp => !opp.isRemote && opp.distanceKm <= 5)
                  ? "Opportunities in Gwalior"
                  : "Opportunities Near You"}
              </Text>
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
            </View>
          </View>
        )}

        {/* Volunteer from Anywhere (Remote Section) */}
        <Text style={[styles.sectionTitle, Typography.sectionHeading, { color: themeColors.neutralForeground1 }]}>
          Volunteer from anywhere
        </Text>
        <Text style={[Typography.body, { color: themeColors.neutralForeground3, marginBottom: Spacing.xs, marginTop: -Spacing.xs }]}>
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
        <Text style={[styles.sectionTitle, Typography.sectionHeading, { color: themeColors.neutralForeground1 }]}>
          Idea threads
        </Text>
        <Text style={[Typography.body, { color: themeColors.neutralForeground3, marginBottom: Spacing.s, marginTop: -Spacing.xs }]}>
          Early-stage initiatives looking for support. Show your interest to help bring these ideas to life.
        </Text>

        <View style={styles.ideasStack}>
          {ideas.map(idea => {
            const hasSupported = !!supportState[idea.id];
            return (
              <Card
                key={idea.id}
                variant="Filled"
                isDarkMode={isDarkMode}
                style={[
                  styles.ideaCard,
                  highlightedIdeaId === idea.id && {
                    borderColor: themeColors.brandForeground1,
                    borderWidth: 2,
                    shadowColor: themeColors.brandForeground1,
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.3,
                    shadowRadius: 6,
                    elevation: 6,
                  }
                ]}
              >
                {/* 1. Mention badge if a friend mentioned the user */}
                {idea.isMentionedBadge && (
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      backgroundColor: themeColors.brandBackgroundSubtle,
                      paddingVertical: 4,
                      paddingHorizontal: 8,
                      borderRadius: Shapes.rounded,
                      alignSelf: 'flex-start',
                      marginBottom: Spacing.s,
                    }}
                  >
                    <Ionicons name="chatbubble-ellipses-outline" size={14} color={themeColors.brandForeground1} />
                    <Text style={[Typography.captionStrong, { color: themeColors.brandForeground1, marginLeft: 6 }]}>
                      Rahul mentioned you
                    </Text>
                  </View>
                )}

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

                {/* 2. Interactive Footer Row (Mentions on Left, Support Pill Button on Right) */}
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                  
                  {/* Left: Mentions Stack */}
                  <Pressable
                    onPress={() => openPicker(idea.id)}
                    style={{ flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: Spacing.s }}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginRight: 8 }}>
                      {idea.taggedFriends.slice(0, 3).map((username, idx) => {
                        const info = MOCK_FRIENDS.find(f => f.username.toLowerCase() === username.toLowerCase()) || {
                          displayName: username,
                          avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=80',
                        };
                        return (
                          <Image
                            key={username}
                            source={{ uri: info.avatar }}
                            style={{
                              width: 24,
                              height: 24,
                              borderRadius: 12,
                              borderWidth: 1.5,
                              borderColor: themeColors.neutralBackground1,
                              marginLeft: idx === 0 ? 0 : -8,
                              zIndex: 10 - idx,
                            }}
                          />
                        );
                      })}
                      
                      {idea.mentionsCount > 3 && (
                        <View
                          style={{
                            width: 24,
                            height: 24,
                            borderRadius: 12,
                            backgroundColor: themeColors.neutralBackground3,
                            justifyContent: 'center',
                            alignItems: 'center',
                            borderWidth: 1.5,
                            borderColor: themeColors.neutralBackground1,
                            marginLeft: -8,
                            zIndex: 0,
                          }}
                        >
                          <Text style={{ fontSize: 9, fontWeight: 'bold', color: themeColors.neutralForeground1 }}>
                            +{idea.mentionsCount - 3}
                          </Text>
                        </View>
                      )}
                    </View>

                    <Text
                      style={[
                        Typography.caption,
                        {
                          color: themeColors.neutralForeground2,
                          flex: 1,
                          fontSize: 12,
                        }
                      ]}
                      numberOfLines={2}
                    >
                      {(() => {
                        const prioritized = [...idea.taggedFriends].sort((a, b) => {
                          if (a === 'priya' || a === 'rahul') return -1;
                          if (b === 'priya' || b === 'rahul') return 1;
                          return 0;
                        });

                        if (prioritized.length === 0) {
                          return 'No mentions yet';
                        }
                        
                        const firstFriend = MOCK_FRIENDS.find(f => f.username.toLowerCase() === prioritized[0].toLowerCase())?.displayName || prioritized[0];
                        if (idea.mentionsCount <= 1) {
                          return `${firstFriend} tagged`;
                        }
                        return `${firstFriend} and ${idea.mentionsCount - 1} others tagged`;
                      })()}
                    </Text>
                  </Pressable>

                  {/* Right: Support Button */}
                  <SupportButton
                    ideaId={idea.id}
                    initialCount={idea.initialSupports}
                    hasSupported={hasSupported}
                    onPress={() => handleSupportIdea(idea.id, 'Child Welfare')}
                    isDarkMode={isDarkMode}
                    themeColors={themeColors}
                  />

                </View>

              </Card>
            );
          })}
        </View>

      </ScrollView>
      </Animated.View>

      {/* --- Dimming Overlays --- */}
      {isMicroVolunteeringMounted && (
        <Animated.View
          style={[
            StyleSheet.absoluteFill,
            {
              backgroundColor: '#000000',
              opacity: microVolunteeringAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [0, 0.08],
              }),
              zIndex: 98,
            },
          ]}
          pointerEvents="none"
        />
      )}

      {isNotificationsMounted && (
        <Animated.View
          style={[
            StyleSheet.absoluteFill,
            {
              backgroundColor: '#000000',
              opacity: notificationsAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [0, 0.08],
              }),
              zIndex: 98,
            },
          ]}
          pointerEvents="none"
        />
      )}

      {/* --- Custom Sliding Overlays --- */}
      {isMicroVolunteeringMounted && (
        <Animated.View
          {...microVolunteeringPanResponder.panHandlers}
          style={[
            StyleSheet.absoluteFill,
            {
              width: screenWidth,
              height: screenHeight,
              transform: [
                {
                  translateX: microVolunteeringAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [screenWidth, 0],
                  }),
                },
              ],
              opacity: microVolunteeringAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [0.9, 1.0],
              }),
              zIndex: 99,
              backgroundColor: themeColors.neutralBackground1,
              shadowColor: '#000',
              shadowOffset: { width: -4, height: 0 },
              shadowOpacity: 0.15,
              shadowRadius: 10,
              elevation: 16,
            },
          ]}
        >
          <MicroVolunteering isDarkMode={isDarkMode} onBack={closeMicroVolunteering} />
        </Animated.View>
      )}

      {isNotificationsMounted && (
        <Animated.View
          {...notificationsPanResponder.panHandlers}
          style={[
            StyleSheet.absoluteFill,
            {
              width: screenWidth,
              height: screenHeight,
              transform: [
                {
                  translateX: notificationsAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [screenWidth, 0],
                  }),
                },
              ],
              opacity: notificationsAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [0.9, 1.0],
              }),
              zIndex: 99,
              backgroundColor: themeColors.neutralBackground1,
              shadowColor: '#000',
              shadowOffset: { width: -4, height: 0 },
              shadowOpacity: 0.15,
              shadowRadius: 10,
              elevation: 16,
            },
          ]}
        >
          <NotificationsScreen
            isDarkMode={isDarkMode}
            onBack={closeNotifications}
            onUnreadCountChange={(count) => setUnreadNotificationsCount(count)}
            onViewIdea={(ideaId) => {
              closeNotifications();
              handleScrollToIdea(ideaId);
            }}
          />
        </Animated.View>
      )}

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
                      openMicroVolunteering();
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

      {/* Friend Picker Bottom Sheet Modal */}
      {pickerIdeaId !== null && (
        <Modal
          visible={pickerIdeaId !== null}
          transparent
          animationType="fade"
          onRequestClose={closePicker}
        >
          <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
            <Pressable style={StyleSheet.absoluteFill} onPress={closePicker} />

            <Animated.View
              style={{
                backgroundColor: themeColors.neutralBackground1,
                borderTopLeftRadius: 20,
                borderTopRightRadius: 20,
                padding: Spacing.m,
                maxHeight: '80%',
                width: '100%',
                borderWidth: 1,
                borderColor: themeColors.neutralStroke2,
                transform: [
                  {
                    translateY: pickerAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [600, 0],
                    }),
                  },
                ],
              }}
            >
              <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: themeColors.neutralStroke2, alignSelf: 'center', marginBottom: 12 }} />

              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.s }}>
                <Text style={[Typography.bodyStrong, { color: themeColors.neutralForeground1, fontSize: 18 }]}>
                  Mention Friends
                </Text>
                <Pressable onPress={closePicker} style={{ padding: 4 }}>
                  <Ionicons name="close" size={24} color={themeColors.neutralForeground2} />
                </Pressable>
              </View>

              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  borderWidth: 1,
                  borderColor: themeColors.neutralStroke1,
                  borderRadius: Shapes.rounded,
                  paddingHorizontal: Spacing.s,
                  height: 40,
                  marginBottom: Spacing.s,
                  backgroundColor: isDarkMode ? '#222' : '#f5f5f5',
                }}
              >
                <Ionicons name="search" size={18} color={themeColors.neutralForeground3} style={{ marginRight: 6 }} />
                <TextInput
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  placeholder="Search friends..."
                  placeholderTextColor={themeColors.neutralForegroundDisabled}
                  style={{ flex: 1, color: themeColors.neutralForeground1, fontSize: 14 }}
                />
              </View>

              <ScrollView style={{ maxHeight: 320 }} showsVerticalScrollIndicator={false}>
                {recentFriends.length > 0 && (
                  <View style={{ marginBottom: Spacing.s }}>
                    <Text style={[Typography.captionStrong, { color: themeColors.neutralForeground3, marginBottom: 6 }]}>
                      Recently Interacted
                    </Text>
                    {recentFriends.map(friend => {
                      const isChecked = selectedFriends.includes(friend.username);
                      const toggleCheck = () => {
                        if (isChecked) {
                          setSelectedFriends(prev => prev.filter(u => u !== friend.username));
                        } else {
                          if (selectedFriends.length >= 10) {
                            Alert.alert("Limit Reached", "You can mention up to 10 friends per idea thread.");
                            return;
                          }
                          setSelectedFriends(prev => [...prev, friend.username]);
                        }
                      };

                      return (
                        <Pressable
                          key={friend.username}
                          onPress={toggleCheck}
                          style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            paddingVertical: 10,
                            borderBottomWidth: 1,
                            borderBottomColor: themeColors.neutralStroke2,
                          }}
                        >
                          <Image source={{ uri: friend.avatar }} style={{ width: 32, height: 32, borderRadius: 16 }} />
                          <View style={{ flex: 1, marginLeft: Spacing.s }}>
                            <Text style={[Typography.body, { color: themeColors.neutralForeground1 }]}>
                              {friend.displayName}
                            </Text>
                            <Text style={[Typography.caption, { color: themeColors.neutralForeground3 }]}>
                              @{friend.username}
                            </Text>
                          </View>
                          <Ionicons
                            name={isChecked ? "checkbox" : "square-outline"}
                            size={22}
                            color={isChecked ? themeColors.brandForeground1 : themeColors.neutralForeground3}
                          />
                        </Pressable>
                      );
                    })}
                  </View>
                )}

                {allFriendsFiltered.length > 0 && (
                  <View>
                    <Text style={[Typography.captionStrong, { color: themeColors.neutralForeground3, marginBottom: 6 }]}>
                      All Friends
                    </Text>
                    {allFriendsFiltered.map(friend => {
                      const isChecked = selectedFriends.includes(friend.username);
                      const toggleCheck = () => {
                        if (isChecked) {
                          setSelectedFriends(prev => prev.filter(u => u !== friend.username));
                        } else {
                          if (selectedFriends.length >= 10) {
                            Alert.alert("Limit Reached", "You can mention up to 10 friends per idea thread.");
                            return;
                          }
                          setSelectedFriends(prev => [...prev, friend.username]);
                        }
                      };

                      return (
                        <Pressable
                          key={friend.username}
                          onPress={toggleCheck}
                          style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            paddingVertical: 10,
                            borderBottomWidth: 1,
                            borderBottomColor: themeColors.neutralStroke2,
                          }}
                        >
                          <Image source={{ uri: friend.avatar }} style={{ width: 32, height: 32, borderRadius: 16 }} />
                          <View style={{ flex: 1, marginLeft: Spacing.s }}>
                            <Text style={[Typography.body, { color: themeColors.neutralForeground1 }]}>
                              {friend.displayName}
                            </Text>
                            <Text style={[Typography.caption, { color: themeColors.neutralForeground3 }]}>
                              @{friend.username}
                            </Text>
                          </View>
                          <Ionicons
                            name={isChecked ? "checkbox" : "square-outline"}
                            size={22}
                            color={isChecked ? themeColors.brandForeground1 : themeColors.neutralForeground3}
                          />
                        </Pressable>
                      );
                    })}
                  </View>
                )}
              </ScrollView>

              <View style={{ marginTop: Spacing.m, width: '100%', height: 44 }}>
                <Button
                  label={`Mention ${selectedFriends.length} friend${selectedFriends.length === 1 ? '' : 's'}`}
                  appearance="Primary"
                  onPress={handleDonePicker}
                  isDarkMode={isDarkMode}
                />
              </View>
            </Animated.View>
          </View>
        </Modal>
      )}

      {/* Undo Toast Notification */}
      {toast !== null && (
        <Animated.View
          style={[
            {
              position: 'absolute',
              bottom: 80,
              left: Spacing.m,
              right: Spacing.m,
              backgroundColor: isDarkMode ? '#2d2d2d' : '#1e1e1e',
              paddingVertical: 12,
              paddingHorizontal: Spacing.m,
              borderRadius: Shapes.rounded,
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.25,
              shadowRadius: 4,
              elevation: 5,
              zIndex: 9999,
              opacity: toastAnim,
              transform: [
                {
                  translateY: toastAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [100, 0],
                  }),
                },
              ],
            },
          ]}
        >
          <Text style={{ color: '#ffffff', fontSize: 14, fontWeight: '500' }}>
            {toast.message}
          </Text>
          <Pressable
            onPress={() => {
              toast.onUndo();
              hideToast();
            }}
            style={{ padding: 4 }}
          >
            <Text style={{ color: themeColors.brandForeground1, fontSize: 14, fontWeight: 'bold' }}>
              Undo
            </Text>
          </Pressable>
        </Animated.View>
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
    width: CARD_WIDTH,
    height: CARD_WIDTH,
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
    fontSize: 15,
    fontWeight: '700',
    lineHeight: 22.5,
  },
  microCard: {
    marginTop: Spacing.l,
    padding: Spacing.xl,
    borderRadius: Shapes.rounded + 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  microContentRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    justifyContent: 'space-between',
    minHeight: 140,
  },
  microContentRowVertical: {
    flexDirection: 'column',
    alignItems: 'stretch',
    minHeight: undefined,
  },
  microLeft: {
    flex: 0.58,
    justifyContent: 'space-between',
    paddingRight: 24, // Minimum 24px gap
  },
  microLeftVertical: {
    flex: undefined,
    paddingRight: 0,
    marginBottom: Spacing.m,
  },
  microRight: {
    flex: 0.42,
    justifyContent: 'flex-end',
    alignItems: 'flex-end',
    position: 'relative',
    overflow: 'visible',
  },
  microRightVertical: {
    flex: undefined,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: Spacing.s,
  },
  microTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    lineHeight: 26,
    marginBottom: Spacing.xs,
  },
  microSubtitle: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: Spacing.l,
  },
  microCtaButton: {
    alignSelf: 'flex-start',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.s,
    borderRadius: 24, // Pill-shaped
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  microCtaButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  microIllustration: {
    position: 'absolute',
    bottom: -20, // Slightly overflow bottom boundary
    right: -10, // Slightly overflow right boundary
  },
  microIllustrationVertical: {
    position: 'relative',
    bottom: 0,
    right: 0,
    marginTop: Spacing.s,
  },
  locationHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.l,
    marginBottom: Spacing.xs,
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

