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
  Platform,
  Keyboard,
  Vibration,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
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
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
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
        friction: 8,
        tension: 15,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1.0,
        useNativeDriver: true,
        friction: 8,
        tension: 15,
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

// Sub-component to highlight matched characters in search
interface HighlightTextProps {
  text: string;
  highlight: string;
  style?: any;
  highlightStyle?: any;
}

const HighlightText: React.FC<HighlightTextProps> = ({
  text,
  highlight,
  style,
  highlightStyle,
}) => {
  const cleanHighlight = highlight.replace(/^@/, '').trim();
  if (!cleanHighlight) {
    return <Text style={style}>{text}</Text>;
  }

  // Escape regex special chars
  const escapedHighlight = cleanHighlight.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
  const parts = text.split(new RegExp(`(${escapedHighlight})`, 'gi'));

  return (
    <Text style={style}>
      {parts.map((part, index) => {
        const isMatch = part.toLowerCase() === cleanHighlight.toLowerCase();
        return (
          <Text key={index} style={isMatch ? [highlightStyle, { fontWeight: 'bold' }] : null}>
            {part}
          </Text>
        );
      })}
    </Text>
  );
};

// Skeleton Placeholder Row component for loading state
interface SkeletonRowProps {
  themeColors: any;
}

const SkeletonRow: React.FC<SkeletonRowProps> = ({ themeColors }) => {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: themeColors.neutralStroke2,
      }}
    >
      <View
        style={{
          width: 32,
          height: 32,
          borderRadius: 16,
          backgroundColor: themeColors.neutralStroke2,
          opacity: 0.6,
        }}
      />
      <View style={{ flex: 1, marginLeft: Spacing.s }}>
        <View
          style={{
            height: 12,
            width: '60%',
            backgroundColor: themeColors.neutralStroke2,
            borderRadius: 6,
            marginBottom: 6,
            opacity: 0.6,
          }}
        />
        <View
          style={{
            height: 10,
            width: '40%',
            backgroundColor: themeColors.neutralStroke2,
            borderRadius: 5,
            opacity: 0.6,
          }}
        />
      </View>
    </View>
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
  autoOpenCause?: string | null;
  onClearAutoOpenCause?: () => void;
  onToggleTabBar?: (visible: boolean) => void;
}

export const Home: React.FC<HomeProps> = ({
  isDarkMode = false,
  onNavigateToTab,
  onSetPagerScrollEnabled,
  autoOpenCause,
  onClearAutoOpenCause,
  onToggleTabBar,
}) => {
  const themeColors = isDarkMode ? Colors.dark : Colors.light;
  const isCompactScreen = screenWidth < 380;
  const insets = useSafeAreaInsets();

  const [keyboardHeight, setKeyboardHeight] = useState(0);

  useEffect(() => {
    const showSubscription = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      (e) => {
        setKeyboardHeight(e.endCoordinates.height);
      }
    );
    const hideSubscription = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => {
        setKeyboardHeight(0);
      }
    );
    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);

  // --- State management ---
  const [causes, setCauses] = useState<CauseType[]>([]);

  useEffect(() => {
    if (autoOpenCause) {
      openStoriesForCause(autoOpenCause as CauseType);
      onClearAutoOpenCause?.();
    }
  }, [autoOpenCause]);

  const rotateAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 8000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );
    loop.start();
    return () => loop.stop();
  }, []);

  const rotateStr = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });
  const [localOpportunities, setLocalOpportunities] = useState<Opportunity[]>([]);
  const [remoteOpportunities, setRemoteOpportunities] = useState<Opportunity[]>([]);
  // Story state
  const [activeStoryCause, setActiveStoryCause] = useState<CauseType | null>(null);
  const [activeStories, setActiveStories] = useState<Story[]>([]);
  const [storyIndex, setStoryIndex] = useState(0);
  const storyProgress = useRef(new Animated.Value(0)).current;
  const storyTimerRef = useRef<any>(null);

  const storyViewerAnim = useRef(new Animated.Value(0)).current;
  const storyPanY = useRef(new Animated.Value(0)).current;
  const [showStoryCoachMark, setShowStoryCoachMark] = useState(false);
  const [causeSupportState, setCauseSupportState] = useState<Record<CauseType, { supported: boolean; count: number }>>(() => {
    const initial: any = {};
    const causesList: CauseType[] = [
      'Education', 'Healthcare', 'Child Welfare', 'Poverty Alleviation & Livelihoods',
      'Women Empowerment', 'Disaster Relief', 'Environment & Sustainability', 'Animal Welfare',
      'Support for Persons with Disabilities', 'Elderly Care', 'Water, Sanitation, and Hygiene (WASH)',
      'Rural Development'
    ];
    causesList.forEach(c => {
      initial[c] = { supported: false, count: 28 + Math.floor((c.charCodeAt(0) + c.charCodeAt(1)) % 30) };
    });
    return initial;
  });
  
  const [causeBookmarkState, setCauseBookmarkState] = useState<Record<CauseType, boolean>>(() => {
    const initial: any = {};
    const causesList: CauseType[] = [
      'Education', 'Healthcare', 'Child Welfare', 'Poverty Alleviation & Livelihoods',
      'Women Empowerment', 'Disaster Relief', 'Environment & Sustainability', 'Animal Welfare',
      'Support for Persons with Disabilities', 'Elderly Care', 'Water, Sanitation, and Hygiene (WASH)',
      'Rural Development'
    ];
    causesList.forEach(c => {
      initial[c] = false;
    });
    return initial;
  });

  const pausedValueRef = useRef(0);
  const isPausedRef = useRef(false);

  // CTA Pulse Animation
  const ctaPulseAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    let loop: any = null;
    if (activeStoryCause && activeStories.length > 0 && storyIndex === activeStories.length - 1) {
      ctaPulseAnim.setValue(0);
      loop = Animated.loop(
        Animated.sequence([
          Animated.timing(ctaPulseAnim, {
            toValue: 1,
            duration: 1000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(ctaPulseAnim, {
            toValue: 0,
            duration: 1000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      );
      loop.start();
    } else {
      ctaPulseAnim.setValue(0);
    }
    return () => {
      if (loop) loop.stop();
    };
  }, [storyIndex, activeStoryCause, activeStories.length]);

  const ctaScale = ctaPulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.03],
  });

  // Ref to hold current story state to avoid stale closures in PanResponder
  const storyStateRef = useRef({ activeStoryCause, activeStories, causes });
  storyStateRef.current = { activeStoryCause, activeStories, causes };

  // Transition directly to the next/previous cause category with a slide animation
  function handleSwipeCause(isNext: boolean) {
    const { activeStoryCause: currentCause, activeStories: currentStories, causes: currentCauses } = storyStateRef.current;
    if (!currentCause || currentStories.length === 0) return;

    const currentIdx = currentCauses.indexOf(currentCause);
    const targetIdx = isNext ? currentIdx + 1 : currentIdx - 1;

    if (targetIdx >= 0 && targetIdx < currentCauses.length) {
      const targetCause = currentCauses[targetIdx];
      const targetStories = StoryService.getSortedStoriesForCause(targetCause);

      stopStoryTimer();

      animateCauseTransition(() => {
        setActiveStoryCause(targetCause);
        setActiveStories(targetStories);
        setStoryIndex(0);
        setCauseBookmarkState(prev => ({
          ...prev,
          [targetCause]: StoryService.isCauseBookmarked(targetCause),
        }));
      }, isNext);
    }
  }

  // Swipe-down and swipe-left/right PanResponder
  const storyPanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        const isSwipeDown = gestureState.dy > 10 && Math.abs(gestureState.dx) < gestureState.dy;
        const isHorizontalSwipe = Math.abs(gestureState.dx) > 10 && Math.abs(gestureState.dy) < Math.abs(gestureState.dx);
        return isSwipeDown || isHorizontalSwipe;
      },
      onPanResponderMove: (evt, gestureState) => {
        if (Math.abs(gestureState.dy) > Math.abs(gestureState.dx)) {
          if (gestureState.dy > 0) {
            storyPanY.setValue(gestureState.dy);
          }
        }
      },
      onPanResponderRelease: (evt, gestureState) => {
        const { activeStoryCause: currentCause } = storyStateRef.current;
        // Vertical swipe down to close
        if (Math.abs(gestureState.dy) > Math.abs(gestureState.dx) && (gestureState.dy > 80 || gestureState.vy > 0.4)) {
          onToggleTabBar?.(true);
          if (currentCause) {
            StoryService.markCauseSeen(currentCause, true);
          }
          Animated.timing(storyPanY, {
            toValue: screenHeight,
            duration: 500,
            useNativeDriver: true,
          }).start(() => {
            setActiveStoryCause(null);
            setActiveStories([]);
            storyPanY.setValue(0);
            storyViewerAnim.setValue(0);
            loadPersonalizedData();
          });
        }
        // Horizontal swipe right (finger moving right-to-left) -> next cause
        else if (gestureState.dx < -50 || gestureState.vx < -0.3) {
          handleSwipeCause(true);
        }
        // Horizontal swipe left (finger moving left-to-right) -> previous cause
        else if (gestureState.dx > 50 || gestureState.vx > 0.3) {
          handleSwipeCause(false);
        }
        // Spring back if drag wasn't enough to trigger an action
        else {
          Animated.spring(storyPanY, {
            toValue: 0,
            tension: 10,
            friction: 12,
            useNativeDriver: true,
          }).start();
        }
      },
      onPanResponderTerminate: () => {
        Animated.spring(storyPanY, {
          toValue: 0,
          tension: 10,
          friction: 12,
          useNativeDriver: true,
        }).start();
      },
    })
  ).current;

  // Notifications
  const [unreadNotificationsCount, setUnreadNotificationsCount] = useState(
    Personalization.getNotifications().filter(n => n.unread).length
  );

  // Curated sequence of causes
  const causesList: CauseType[] = [
    'Animal Welfare',
    'Child Welfare',
    'Disaster Relief',
    'Education',
    'Elderly Care',
    'Environment & Sustainability',
    'Healthcare',
    'Poverty Alleviation & Livelihoods',
    'Rural Development',
    'Support for Persons with Disabilities',
    'Water, Sanitation, and Hygiene (WASH)',
    'Women Empowerment',
  ];

  // Category and Pinned Category State
  const [pinnedCause, setPinnedCause] = useState<CauseType | null>(() => {
    try {
      if (typeof localStorage !== 'undefined' && localStorage !== null) {
        const saved = localStorage.getItem('pinnedCause');
        return saved ? (saved as CauseType) : null;
      }
    } catch (e) {}
    return (global as any)['__storage_pinnedCause'] || null;
  });
  const [activeCategory, setActiveCategory] = useState<string>('All');

  // Stories Paused State & Dimmer overlay animations
  const [isStoryPaused, setIsStoryPaused] = useState(false);
  const leftFlashOpacity = useRef(new Animated.Value(0)).current;
  const rightFlashOpacity = useRef(new Animated.Value(0)).current;
  const bookmarkScaleAnim = useRef(new Animated.Value(1)).current;
  const [isCaptionSheetOpen, setIsCaptionSheetOpen] = useState(false);

  // Heart like animation scale
  const heartScaleAnim = useRef(new Animated.Value(1)).current;

  // Story transition animations
  const causeTransitionAnim = useRef(new Animated.Value(0)).current;
  const storyFadeAnim = useRef(new Animated.Value(1)).current;

  // CTA Press feedback scale
  const ctaPressScale = useRef(new Animated.Value(1)).current;

  // Swipe-down dismiss coachmark state
  const [showSwipeCoachMark, setShowSwipeCoachMark] = useState(false);

  // Coachmark timer ref
  const storyCoachMarkTimeoutRef = useRef<any>(null);

  const dismissCoachMark = () => {
    setShowStoryCoachMark(false);
    if (storyCoachMarkTimeoutRef.current) {
      clearTimeout(storyCoachMarkTimeoutRef.current);
    }
  };

  // Pin category handler
  const handlePinCause = (cause: CauseType) => {
    if (pinnedCause === cause) {
      setPinnedCause(null);
      try {
        if (typeof localStorage !== 'undefined' && localStorage !== null) {
          localStorage.setItem('pinnedCause', '');
        }
      } catch (e) {}
      (global as any)['__storage_pinnedCause'] = null;
      try {
        Vibration.vibrate(15);
      } catch (err) {}
      Alert.alert("Unpinned", `"${cause}" has been unpinned.`);
    } else {
      setPinnedCause(cause);
      try {
        if (typeof localStorage !== 'undefined' && localStorage !== null) {
          localStorage.setItem('pinnedCause', cause);
        }
      } catch (e) {}
      (global as any)['__storage_pinnedCause'] = cause;
      try {
        Vibration.vibrate(30);
      } catch (err) {}
      Alert.alert("Pinned", `"${cause}" has been pinned to the front.`);
    }
  };

  // Category select handler
  const handleCategoryPress = (category: string) => {
    setActiveCategory(category);
    if (category !== 'All') {
      openStoriesForCause(category as CauseType);
    }
  };

  // Segment tap handler to jump between stories
  const handleSegmentTap = (idx: number) => {
    if (idx !== storyIndex) {
      setStoryIndex(idx);
      StoryService.saveProgress(activeStoryCause as CauseType, idx);
      // Restart timer for the new segment
      startStoryTimer();
    }
  };

  // Caption sheet open/close helpers
  const openCaptionSheet = () => {
    setIsCaptionSheetOpen(true);
    handleStoryPressIn();
  };

  const closeCaptionSheet = () => {
    setIsCaptionSheetOpen(false);
    handleStoryPressOut();
  };

  // Helper to map causes to custom cover props (icon, color background)
  const getCauseCoverProps = (cause: CauseType) => {
    switch (cause) {
      case 'Education':
        return {
          icon: 'school-outline',
          bgColor: themeColors.causeEducation || '#9c27b0',
          iconFamily: 'Ionicons'
        };
      case 'Child Welfare':
        return {
          icon: 'baby',
          bgColor: themeColors.causeChild || '#ff9800',
          iconFamily: 'MaterialCommunityIcons'
        };
      case 'Healthcare':
        return {
          icon: 'stethoscope',
          bgColor: themeColors.causeHealth || '#009688',
          iconFamily: 'MaterialCommunityIcons'
        };
      case 'Women Empowerment':
        return {
          icon: 'sparkles-outline',
          bgColor: themeColors.causeWomen || '#e91e63',
          iconFamily: 'Ionicons'
        };
      case 'Elderly Care':
        return {
          icon: 'hand-heart',
          bgColor: themeColors.causeElderly || '#3f51b5',
          iconFamily: 'MaterialCommunityIcons'
        };
      case 'Poverty Alleviation & Livelihoods':
        return {
          icon: 'sprout',
          bgColor: themeColors.causePoverty || '#4caf50',
          iconFamily: 'MaterialCommunityIcons'
        };
      case 'Animal Welfare':
        return {
          icon: 'paw',
          bgColor: themeColors.causeChild || '#ff9800',
          iconFamily: 'Ionicons'
        };
      case 'Disaster Relief':
        return {
          icon: 'help-buoy-outline',
          bgColor: themeColors.dangerForeground1 || '#c41818',
          iconFamily: 'Ionicons'
        };
      case 'Environment & Sustainability':
        return {
          icon: 'leaf-outline',
          bgColor: themeColors.causePoverty || '#4caf50',
          iconFamily: 'Ionicons'
        };
      case 'Rural Development':
        return {
          icon: 'home-outline',
          bgColor: '#8d6e63',
          iconFamily: 'Ionicons'
        };
      case 'Support for Persons with Disabilities':
        return {
          icon: 'accessibility-outline',
          bgColor: themeColors.brandForeground1 || '#0f6cbd',
          iconFamily: 'Ionicons'
        };
      case 'Water, Sanitation, and Hygiene (WASH)':
        return {
          icon: 'water-outline',
          bgColor: '#2196f3',
          iconFamily: 'Ionicons'
        };
      default:
        return {
          icon: 'heart-outline',
          bgColor: themeColors.brandForeground1 || '#0f6cbd',
          iconFamily: 'Ionicons'
        };
    }
  };

  // Quick fade in-out animation helper for same-cause transitions
  const animateStoryTransition = (callback: () => void) => {
    Animated.timing(storyFadeAnim, {
      toValue: 0,
      duration: 400,
      useNativeDriver: true,
    }).start(() => {
      callback();
      Animated.timing(storyFadeAnim, {
        toValue: 1,
        duration: 450,
        useNativeDriver: true,
      }).start();
    });
  };

  // Horizontal slide animation helper for cause-to-cause transitions
  const animateCauseTransition = (callback: () => void, isNext: boolean) => {
    const outValue = isNext ? -screenWidth : screenWidth;
    const inStartValue = isNext ? screenWidth : -screenWidth;
    
    Animated.timing(causeTransitionAnim, {
      toValue: outValue,
      duration: 400,
      easing: Easing.out(Easing.ease),
      useNativeDriver: true,
    }).start(() => {
      callback();
      causeTransitionAnim.setValue(inStartValue);
      Animated.timing(causeTransitionAnim, {
        toValue: 0,
        duration: 450,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }).start();
    });
  };

  // CTA Press scaling feedback functions
  const handleStoryCtaPressIn = () => {
    Animated.timing(ctaPressScale, {
      toValue: 0.98,
      duration: 120,
      useNativeDriver: true,
    }).start();
  };

  const handleStoryCtaPressOut = () => {
    Animated.timing(ctaPressScale, {
      toValue: 1.0,
      duration: 120,
      useNativeDriver: true,
    }).start();
  };

  // Category opportunity count helper
  const getOpportunityCount = (category: string) => {
    const allOpps = Personalization.getRawOpportunities();
    if (category === 'All') {
      return allOpps.length;
    }
    return allOpps.filter(opp => opp.cause === category).length;
  };

  // Micro-volunteering Card Redesign states and animations
  const [selectedTimeFilter, setSelectedTimeFilter] = useState<number>(15);
  const [microVolCount, setMicroVolCount] = useState(0);

  // 1. Counter roll-up animation: 0 -> 12
  useEffect(() => {
    let current = 0;
    const interval = setInterval(() => {
      if (current < 12) {
        current += 1;
        setMicroVolCount(current);
      } else {
        clearInterval(interval);
      }
    }, 60);
    return () => clearInterval(interval);
  }, []);

  // 2. Shimmer animation for preview rows on filter change
  const previewShimmerAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    previewShimmerAnim.setValue(0);
    Animated.timing(previewShimmerAnim, {
      toValue: 1,
      duration: 800,
      easing: Easing.out(Easing.ease),
      useNativeDriver: true,
    }).start();
  }, [selectedTimeFilter]);

  const shimmerTranslateX = previewShimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-180, screenWidth - Spacing.m * 2],
  });

  // 3. CTA Haptic spring scale animation
  const ctaButtonScale = useRef(new Animated.Value(1)).current;
  const handleCtaPressIn = () => {
    Animated.spring(ctaButtonScale, {
      toValue: 0.96,
      tension: 20,
      friction: 8,
      useNativeDriver: true,
    }).start();
  };
  const handleCtaPressOut = () => {
    Animated.spring(ctaButtonScale, {
      toValue: 1.0,
      tension: 20,
      friction: 8,
      useNativeDriver: true,
    }).start();
  };

  const getMicroVolunteeringPreviewList = () => {
    const allOpps = Personalization.getRawOpportunities();
    const filtered = allOpps.filter(opp => {
      const commitmentMins = Math.round(opp.durationHrs * 60);
      return opp.durationHrs <= 2.0 && commitmentMins <= selectedTimeFilter;
    });
    return filtered.slice(0, 2);
  };


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
      duration: 450,
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
      duration: 450,
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
      duration: 450,
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
      duration: 450,
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
            duration: 400,
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
            duration: 350,
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
          duration: 350,
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
            duration: 400,
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
            duration: 350,
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
          duration: 350,
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
    // Pair with a subtle haptic tick on action
    try {
      Vibration.vibrate(15);
    } catch (err) {
      console.warn('Vibration failed', err);
    }

    setToast({ message, onUndo });
    toastAnim.setValue(0);
    Animated.timing(toastAnim, {
      toValue: 1,
      duration: 450,
      useNativeDriver: true,
    }).start();

    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current);
    }
    toastTimeoutRef.current = setTimeout(() => {
      hideToast();
    }, 5000);
  };

  const hideToast = () => {
    Animated.timing(toastAnim, {
      toValue: 0,
      duration: 400,
      useNativeDriver: true,
    }).start(() => {
      setToast(null);
    });
  };

  // Friend Picker state
  const [pickerIdeaId, setPickerIdeaId] = useState<string | null>(null);
  const [searchInputValue, setSearchInputValue] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [selectedFriends, setSelectedFriends] = useState<string[]>([]);
  const [isLoadingPickerResults, setIsLoadingPickerResults] = useState(false);
  const [accessibilityAnnouncement, setAccessibilityAnnouncement] = useState('');
  const pickerAnim = useRef(new Animated.Value(0)).current;

  const searchInputRef = useRef<TextInput>(null);

  // Debouncing search input by 150ms to avoid typing jitter
  useEffect(() => {
    if (pickerIdeaId === null) return;

    setIsLoadingPickerResults(true);
    const handler = setTimeout(() => {
      setDebouncedSearchQuery(searchInputValue);
      setIsLoadingPickerResults(false);
    }, 150);

    return () => clearTimeout(handler);
  }, [searchInputValue, pickerIdeaId]);

  const openPicker = (ideaId: string) => {
    const idea = ideas.find(i => i.id === ideaId);
    if (!idea) return;
    setPickerIdeaId(ideaId);
    setSearchInputValue('');
    setDebouncedSearchQuery('');
    setSelectedFriends([...idea.taggedFriends]);
    setIsLoadingPickerResults(false);
    setAccessibilityAnnouncement('');
    pickerAnim.setValue(0);
    Animated.timing(pickerAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();

    // Auto-focus search input when opening
    setTimeout(() => {
      searchInputRef.current?.focus();
    }, 150);
  };

  const closePicker = () => {
    Animated.timing(pickerAnim, {
      toValue: 0,
      duration: 450,
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

  const loadPersonalizedData = () => {
    // 1. Sort causes: unseen first, seen/read causes towards the end (right side), keeping alphabetical order within groups
    const sorted = [...Personalization.getSortedCauses()].sort((a, b) => a.localeCompare(b));
    const unseenCauses = sorted.filter(c => !StoryService.isCauseSeen(c));
    const seenCauses = sorted.filter(c => StoryService.isCauseSeen(c));
    let ordered = [...unseenCauses, ...seenCauses];

    if (pinnedCause && ordered.includes(pinnedCause)) {
      ordered = [pinnedCause, ...ordered.filter(c => c !== pinnedCause)];
    }
    setCauses(ordered);

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
  }, [pinnedCause]);

  // --- Story Functions ---
  const openStoriesForCause = (cause: CauseType) => {
    // Hide bottom tab bar
    onToggleTabBar?.(false);

    // Record visual click rates (Positive signal)
    Personalization.recordSignal(cause, 'OpenProfile');

    const stories = StoryService.getSortedStoriesForCause(cause);
    const lastIndex = StoryService.getLastReadIndex(cause);

    setActiveStoryCause(cause);
    setActiveStories(stories);
    setStoryIndex(lastIndex);
    
    // Sync bookmark state
    setCauseBookmarkState(prev => ({
      ...prev,
      [cause]: StoryService.isCauseBookmarked(cause)
    }));

    // Trigger coach mark if it's the first time, persisted in localStorage
    let hasSeenCoachMark = false;
    try {
      if (typeof localStorage !== 'undefined' && localStorage !== null) {
        hasSeenCoachMark = localStorage.getItem('hasSeenStoryCoachMark') === 'true';
      }
    } catch (e) {}
    if ((global as any)['__storage_hasSeenStoryCoachMark'] === 'true') {
      hasSeenCoachMark = true;
    }

    if (!hasSeenCoachMark) {
      setShowStoryCoachMark(true);
      try {
        if (typeof localStorage !== 'undefined' && localStorage !== null) {
          localStorage.setItem('hasSeenStoryCoachMark', 'true');
        }
      } catch (e) {}
      (global as any)['__storage_hasSeenStoryCoachMark'] = 'true';

      if (storyCoachMarkTimeoutRef.current) {
        clearTimeout(storyCoachMarkTimeoutRef.current);
      }
      storyCoachMarkTimeoutRef.current = setTimeout(() => {
        setShowStoryCoachMark(false);
      }, 3000);
    } else {
      setShowStoryCoachMark(false);
    }

    // Swipe close coach mark check
    let hasSeenSwipeCoach = false;
    try {
      if (typeof localStorage !== 'undefined' && localStorage !== null) {
        hasSeenSwipeCoach = localStorage.getItem('hasSeenSwipeCloseCoachMark') === 'true';
      }
    } catch (e) {}
    if ((global as any)['__storage_hasSeenSwipeCloseCoachMark'] === 'true') {
      hasSeenSwipeCoach = true;
    }

    if (!hasSeenSwipeCoach) {
      setShowSwipeCoachMark(true);
      try {
        if (typeof localStorage !== 'undefined' && localStorage !== null) {
          localStorage.setItem('hasSeenSwipeCloseCoachMark', 'true');
        }
      } catch (e) {}
      (global as any)['__storage_hasSeenSwipeCloseCoachMark'] = 'true';

      setTimeout(() => {
        setShowSwipeCoachMark(false);
      }, 2000);
    } else {
      setShowSwipeCoachMark(false);
    }

    // Zoom/Spring scale open transition
    storyPanY.setValue(0);
    storyViewerAnim.setValue(0);
    Animated.spring(storyViewerAnim, {
      toValue: 1,
      tension: 10,
      friction: 12,
      useNativeDriver: true,
    }).start();
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
    isPausedRef.current = false;

    const reduceMotion = Personalization.getReduceMotion();
    if (reduceMotion) {
      // Do not auto-advance if reduced motion is enabled
      return;
    }

    // Auto-advance after 7 seconds
    Animated.timing(storyProgress, {
      toValue: 1,
      duration: 7000,
      useNativeDriver: false,
    }).start(({ finished }) => {
      if (finished && !isPausedRef.current) {
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
    if (!activeStoryCause || activeStories.length === 0) return;

    // Track finish progress: Users finished the current story if they are moving next
    const currentStory = activeStories[storyIndex];
    if (currentStory) {
      // Mark as read/seen in local storage seenStoryIds
      StoryService.markStorySeen(currentStory.id);
      
      // Increment tag weights for completing this story (>80% progress)
      if (currentStory.tags) {
        currentStory.tags.forEach(tag => {
          StoryService.incrementTagWeight(tag, 1); // completion boosts by 1 point
        });
      }
    }

    if (storyIndex < activeStories.length - 1) {
      // Same cause transition: Do a quick fade-in fade-out animation
      animateStoryTransition(() => {
        const nextIdx = storyIndex + 1;
        setStoryIndex(nextIdx);
        StoryService.saveProgress(activeStoryCause, nextIdx);
      });
    } else {
      // Completed all stories in cause (Positive signal)
      Personalization.recordSignal(activeStoryCause, 'CompleteStory');
      StoryService.markCauseSeen(activeStoryCause, true);

      // Auto-advance to the next cause
      const currentIdx = causes.indexOf(activeStoryCause);
      const nextIdx = currentIdx + 1;
      if (nextIdx < causes.length) {
        const nextCause = causes[nextIdx];
        const nextStories = StoryService.getSortedStoriesForCause(nextCause);
        
        // Cause-to-cause transition: Horizontal slide (180 ms, ease-out)
        animateCauseTransition(() => {
          setActiveStoryCause(nextCause);
          setActiveStories(nextStories);
          setStoryIndex(0);
          setCauseBookmarkState(prev => ({
            ...prev,
            [nextCause]: StoryService.isCauseBookmarked(nextCause)
          }));
        }, true); // next = slide left
      } else {
        // No more causes, close
        closeStories();
      }
    }
  };

  const handleStoryPrev = () => {
    if (!activeStoryCause || activeStories.length === 0) return;

    if (storyIndex > 0) {
      // Same cause transition: Do a quick fade-in fade-out animation
      animateStoryTransition(() => {
        const prevIdx = storyIndex - 1;
        setStoryIndex(prevIdx);
        StoryService.saveProgress(activeStoryCause, prevIdx);
      });
    } else {
      // Go back to the previous cause's last story
      const currentIdx = causes.indexOf(activeStoryCause);
      const prevIdx = currentIdx - 1;
      if (prevIdx >= 0) {
        const prevCause = causes[prevIdx];
        const prevStories = StoryService.getSortedStoriesForCause(prevCause);

        // Cause-to-cause transition: Horizontal slide (180 ms, ease-out)
        animateCauseTransition(() => {
          setActiveStoryCause(prevCause);
          setActiveStories(prevStories);
          setStoryIndex(prevStories.length - 1);
          setCauseBookmarkState(prev => ({
            ...prev,
            [prevCause]: StoryService.isCauseBookmarked(prevCause)
          }));
        }, false); // prev = slide right
      }
    }
  };

  const closeStories = () => {
    if (!activeStoryCause) return;
    
    // Restore bottom tab bar
    onToggleTabBar?.(true);

    // Mark cause as seen when closed
    StoryService.markCauseSeen(activeStoryCause, true);

    Animated.timing(storyViewerAnim, {
      toValue: 0,
      duration: 500,
      useNativeDriver: true,
    }).start(() => {
      setActiveStoryCause(null);
      setActiveStories([]);
      loadPersonalizedData(); // Re-rank dynamically based on seen states
    });
  };

  const handleStoryPressIn = () => {
    isPausedRef.current = true;
    setIsStoryPaused(true);
    storyProgress.stopAnimation((value) => {
      pausedValueRef.current = value;
    });
  };

  const handleStoryPressOut = () => {
    isPausedRef.current = false;
    setIsStoryPaused(false);
    const remainingTime = 7000 * (1 - pausedValueRef.current);

    const reduceMotion = Personalization.getReduceMotion();
    if (reduceMotion) return;

    Animated.timing(storyProgress, {
      toValue: 1,
      duration: remainingTime,
      useNativeDriver: false,
    }).start(({ finished }) => {
      if (finished && !isPausedRef.current) {
        handleStoryNext();
      }
    });
  };

  const triggerLeftFlash = () => {
    leftFlashOpacity.setValue(1);
    Animated.timing(leftFlashOpacity, {
      toValue: 0,
      duration: 150,
      useNativeDriver: true,
    }).start();
  };

  const triggerRightFlash = () => {
    rightFlashOpacity.setValue(1);
    Animated.timing(rightFlashOpacity, {
      toValue: 0,
      duration: 150,
      useNativeDriver: true,
    }).start();
  };

  const handleToggleBookmarkStory = () => {
    if (!activeStoryCause) return;

    // Trigger spring scale animation: 1 -> 1.3 -> 1
    bookmarkScaleAnim.setValue(1);
    Animated.sequence([
      Animated.spring(bookmarkScaleAnim, {
        toValue: 1.3,
        useNativeDriver: true,
        friction: 8,
        tension: 15,
      }),
      Animated.spring(bookmarkScaleAnim, {
        toValue: 1.0,
        useNativeDriver: true,
        friction: 8,
        tension: 15,
      }),
    ]).start();

    // Subtle haptic tick
    try {
      Vibration.vibrate(15);
    } catch (err) {}

    const isBookmarkedNow = StoryService.toggleCauseBookmarked(activeStoryCause);
    setCauseBookmarkState(prev => ({ ...prev, [activeStoryCause]: isBookmarkedNow }));
    
    showToast(
      isBookmarkedNow ? `Saved "${activeStoryCause}"` : `Removed "${activeStoryCause}"`,
      () => {
        const reverted = StoryService.toggleCauseBookmarked(activeStoryCause);
        setCauseBookmarkState(prev => ({ ...prev, [activeStoryCause]: reverted }));
      }
    );
  };

  const handleSupportCause = () => {
    if (!activeStoryCause) return;
    const current = causeSupportState[activeStoryCause];
    const newSupported = !current.supported;
    const newCount = current.count + (newSupported ? 1 : -1);
    
    // Heart burst scale animation: 1 -> 1.3 -> 1
    heartScaleAnim.setValue(1);
    Animated.sequence([
      Animated.spring(heartScaleAnim, {
        toValue: 1.3,
        useNativeDriver: true,
        friction: 8,
        tension: 15,
      }),
      Animated.spring(heartScaleAnim, {
        toValue: 1.0,
        useNativeDriver: true,
        friction: 8,
        tension: 15,
      }),
    ]).start();

    // Subtle vibration
    try {
      Vibration.vibrate(15);
    } catch (err) {}

    setCauseSupportState(prev => ({
      ...prev,
      [activeStoryCause]: { supported: newSupported, count: newCount }
    }));

    if (newSupported) {
      Personalization.recordSignal(activeStoryCause, 'Support');
    }
  };

  const getStoryImpactText = (story: Story, cause: CauseType) => {
    if (story.id === 'child_1') return "14 children helped • 5 volunteers";
    if (story.id === 'edu_1') return "4,500 children helped • 4 volunteers";
    if (story.id === 'edu_2') return "80 children helped • 12 volunteers";
    if (story.id === 'edu_3') return "12 settlements reached • 3 volunteers";
    if (story.id === 'health_1') return "250 patients helped • 8 volunteers";
    if (story.id === 'pov_1') return "120 families supported • 18 volunteers";
    if (story.id === 'women_1') return "400 women trained • 6 volunteers";
    if (story.id === 'disaster_1') return "200 family units assisted • 22 volunteers";
    if (story.id === 'env_1') return "3,500 trees planted • 38 volunteers";
    if (story.id === 'env_2') return "18 village wells built • 14 volunteers";
    if (story.id === 'animal_1') return "180 stray animals collars fitted • 9 volunteers";
    if (story.id === 'disability_1') return "120 audiobooks recorded • 15 volunteers";
    if (story.id === 'elder_1') return "60 elderly residents assisted • 20 volunteers";
    if (story.id === 'wash_1') return "70 biosand filters installed • 7 volunteers";
    if (story.id === 'rural_1') return "350 crop varieties preserved • 11 volunteers";
    
    return `${story.contributorsCount * 5 || 15} helped • ${story.contributorsCount || 4} volunteers`;
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
    const isAtSearch = debouncedSearchQuery.startsWith('@');
    const query = debouncedSearchQuery.replace(/^@/, '').toLowerCase().trim();
    if (query === '') {
      const recent = MOCK_FRIENDS.filter(f => f.recentInteraction);
      const others = MOCK_FRIENDS.filter(f => !f.recentInteraction).sort((a, b) => a.displayName.localeCompare(b.displayName));
      return { recent, others };
    }

    const filtered = MOCK_FRIENDS.filter(f => {
      if (isAtSearch) {
        return f.username.toLowerCase().startsWith(query);
      } else {
        return (
          f.displayName.toLowerCase().includes(query) ||
          f.username.toLowerCase().includes(query)
        );
      }
    });

    const recent = filtered.filter(f => f.recentInteraction);
    const others = filtered.filter(f => !f.recentInteraction).sort((a, b) => a.displayName.localeCompare(b.displayName));
    
    return { recent, others };
  };


  const { recent: recentFriends, others: allFriendsFiltered } = getFriendsLists();

  // Screen Reader Accessibility Announcements
  useEffect(() => {
    if (pickerIdeaId === null) return;
    if (isLoadingPickerResults) return;

    const totalCount = recentFriends.length + allFriendsFiltered.length;
    if (totalCount === 0) {
      setAccessibilityAnnouncement("No friends found");
    } else {
      setAccessibilityAnnouncement(`${totalCount} friend${totalCount === 1 ? '' : 's'} found`);
    }
  }, [debouncedSearchQuery, isLoadingPickerResults, pickerIdeaId, recentFriends.length, allFriendsFiltered.length]);

  const storyTranslateY = Animated.add(
    storyPanY,
    storyViewerAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [300, 0],
    })
  );

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
          style={{ position: 'relative' }}
        >
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={[styles.causesContainer, { paddingRight: 28 }]}
            snapToInterval={88}
            decelerationRate="fast"
            nestedScrollEnabled={true}
          >


            {/* Curated Categories List */}
            {causes.map((cause) => {
              const isSeen = StoryService.isCauseSeen(cause);
              const isActive = activeCategory === cause;
              const isPinned = pinnedCause === cause;
              const coverProps = getCauseCoverProps(cause);
              const IconComponent = coverProps.iconFamily === 'MaterialCommunityIcons' ? MaterialCommunityIcons : Ionicons;

              return (
                <Pressable
                  key={cause}
                  onPress={() => handleCategoryPress(cause)}
                  onLongPress={() => handlePinCause(cause)}
                  style={{ alignItems: 'center', width: 72, paddingVertical: 8, marginVertical: 4, marginRight: 16 }}
                  delayLongPress={600}
                >
                  <View style={{ width: 72, height: 72, justifyContent: 'center', alignItems: 'center', position: 'relative' }}>
                    {/* Ring selection & story seen check */}
                    {isActive ? (
                      /* Active category ring in primary */
                      <View
                        style={{
                          width: 72,
                          height: 72,
                          borderRadius: 36,
                          borderWidth: 2,
                          borderColor: themeColors.brandForeground1,
                          justifyContent: 'center',
                          alignItems: 'center',
                          backgroundColor: themeColors.neutralBackground1,
                        }}
                      >
                        <View style={{ width: 62, height: 62, borderRadius: 31, backgroundColor: coverProps.bgColor, justifyContent: 'center', alignItems: 'center' }}>
                          <IconComponent name={coverProps.icon as any} size={28} color="#ffffff" />
                        </View>
                      </View>
                    ) : isSeen ? (
                      /* Seen State Ring */
                      <View
                        style={{
                          width: 72,
                          height: 72,
                          borderRadius: 36,
                          borderWidth: 2,
                          borderColor: themeColors.neutralStroke2,
                          justifyContent: 'center',
                          alignItems: 'center',
                        }}
                      >
                        <View style={{ width: 62, height: 62, borderRadius: 31, backgroundColor: coverProps.bgColor, justifyContent: 'center', alignItems: 'center', opacity: 0.65 }}>
                          <IconComponent name={coverProps.icon as any} size={28} color="#ffffff" />
                        </View>
                      </View>
                    ) : (
                      /* Unseen State Ring with Rotating Gradient and play badge */
                      <View style={{ width: 72, height: 72, justifyContent: 'center', alignItems: 'center' }}>
                        <Animated.View
                          style={{
                            position: 'absolute',
                            width: 72,
                            height: 72,
                            borderRadius: 36,
                            overflow: 'hidden',
                            transform: [{ rotate: rotateStr }],
                          }}
                        >
                          <LinearGradient
                            colors={['#0f6cbd', '#8660a9', '#d86109', '#0f6cbd']}
                            style={{ flex: 1 }}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                          />
                        </Animated.View>
                        <View
                          style={{
                            width: 66,
                            height: 66,
                            borderRadius: 33,
                            backgroundColor: themeColors.neutralBackground1,
                            justifyContent: 'center',
                            alignItems: 'center',
                            zIndex: 1,
                          }}
                        >
                          <View style={{ width: 60, height: 60, borderRadius: 30, backgroundColor: coverProps.bgColor, justifyContent: 'center', alignItems: 'center' }}>
                            <IconComponent name={coverProps.icon as any} size={26} color="#ffffff" />
                          </View>
                        </View>
                        {/* Play Badge */}
                        <View
                          style={{
                            position: 'absolute',
                            bottom: 0,
                            right: 0,
                            width: 18,
                            height: 18,
                            borderRadius: 9,
                            backgroundColor: themeColors.neutralBackground1,
                            justifyContent: 'center',
                            alignItems: 'center',
                            borderWidth: 1.5,
                            borderColor: themeColors.neutralBackground1,
                            shadowColor: '#000',
                            shadowOffset: { width: 0, height: 1 },
                            shadowOpacity: 0.2,
                            shadowRadius: 1.5,
                            elevation: 2,
                            zIndex: 2,
                          }}
                        >
                          <Ionicons name="play" size={8} color={themeColors.brandForeground1} style={{ marginLeft: 1 }} />
                        </View>
                      </View>
                    )}

                    {/* Pinned Icon Badge */}
                    {isPinned && (
                      <View
                        style={{
                          position: 'absolute',
                          top: -2,
                          left: -2,
                          backgroundColor: themeColors.brandForeground1,
                          borderRadius: 8,
                          width: 16,
                          height: 16,
                          alignItems: 'center',
                          justifyContent: 'center',
                          zIndex: 3,
                          borderWidth: 1,
                          borderColor: '#ffffff',
                        }}
                      >
                        <Ionicons name="pin" size={8} color="#ffffff" />
                      </View>
                    )}
                  </View>

                  {/* Label below the circle */}
                  <Text
                    style={{
                      marginTop: 6,
                      fontSize: 11,
                      fontWeight: isActive ? '600' : '500',
                      color: isActive ? themeColors.brandForeground1 : themeColors.neutralForeground2,
                      textAlign: 'center',
                      lineHeight: 14,
                      height: 28,
                    }}
                    numberOfLines={2}
                  >
                    {cause}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>

          {/* Fade Mask (16px) on the right edge */}
          <LinearGradient
            colors={['transparent', themeColors.neutralBackground2]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={{
              position: 'absolute',
              top: 0,
              bottom: 0,
              right: 0,
              width: 16,
              zIndex: 10,
            }}
            pointerEvents="none"
          />
        </View>

        {/* ## Section 3: Micro-Volunteering Opportunity Card ## */}
        <Pressable
          onPress={() => openMicroVolunteering()}
          style={({ pressed }) => [
            styles.microCard,
            {
              borderColor: themeColors.neutralStroke2,
              padding: 0,
              overflow: 'hidden',
            }
          ]}
        >
          <LinearGradient
            colors={isDarkMode ? ['#0e3c6c', '#15213b'] : ['#e9f3fc', '#ffffff']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{ padding: Spacing.m }}
          >
            {/* Top Right Ornament: Soft orb or overlapping rounded task card shapes */}
            <View style={styles.topRightOrnamentContainer} pointerEvents="none">
              <View style={[styles.ornamentOrb, { backgroundColor: isDarkMode ? 'rgba(15, 108, 189, 0.15)' : 'rgba(15, 108, 189, 0.08)' }]} />
              <View style={[styles.ornamentCard1, { borderColor: isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(15,108,189,0.06)' }]} />
              <View style={[styles.ornamentCard2, { borderColor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(15,108,189,0.08)' }]} />
            </View>

            {/* Eyebrow Row */}
            <View style={styles.microEyebrowRow}>
              <View style={[styles.microPill, { backgroundColor: isDarkMode ? 'rgba(15,108,189,0.3)' : '#dbeafe' }]}>
                <Text style={[styles.microPillText, { color: isDarkMode ? '#60a5fa' : '#1e40af' }]}>
                  Micro-volunteering
                </Text>
              </View>
              <View style={styles.microCounterContainer}>
                <OdometerText
                  value={microVolCount}
                  style={[styles.microCounterNumber, { color: themeColors.brandForeground1 }]}
                />
                <Text style={[styles.microCounterLabel, { color: themeColors.neutralForeground3 }]}>
                  {' '}tasks near you
                </Text>
              </View>
            </View>

            {/* Headline & Subtitle */}
            <Text style={[styles.microNewTitle, { color: themeColors.neutralForeground1 }]}>
              Help in 15 minutes or less
            </Text>
            <Text style={[styles.microNewSubtitle, { color: themeColors.neutralForeground3 }]} numberOfLines={1}>
              Bite-sized tasks. High-impact results.
            </Text>

            {/* Selectable Time Filter Chips */}
            <View style={styles.timeChipsRow}>
              {[5, 15, 30].map((mins) => {
                const isSelected = selectedTimeFilter === mins;
                return (
                  <Pressable
                    key={mins}
                    accessibilityRole="button"
                    accessibilityState={{ selected: isSelected }}
                    accessibilityLabel={`Filter by ${mins} minutes`}
                    onPress={() => setSelectedTimeFilter(mins)}
                    style={[
                      styles.timeChip,
                      {
                        backgroundColor: isSelected
                          ? themeColors.brandForeground1
                          : 'transparent',
                        borderColor: isSelected
                          ? themeColors.brandForeground1
                          : themeColors.neutralStroke2,
                      }
                    ]}
                  >
                    <Text
                      style={[
                        styles.timeChipText,
                        {
                          color: isSelected
                            ? '#ffffff'
                            : themeColors.neutralForeground1,
                        }
                      ]}
                    >
                      {mins} min
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {/* Opportunity Preview Rows */}
            <View style={styles.previewsContainer}>
              {getMicroVolunteeringPreviewList().map((opp, idx) => {
                let iconName: any = 'help-circle-outline';
                let iconColor = '#0f6cbd';
                let iconBg = '#e1f0fa';
                
                if (opp.cause === 'Education') {
                  iconName = 'book-outline';
                  iconColor = '#107c41';
                  iconBg = '#dff6dd';
                } else if (opp.cause === 'Healthcare') {
                  iconName = 'medical-outline';
                  iconColor = '#107c10';
                  iconBg = '#dff6dd';
                } else if (opp.cause === 'Child Welfare') {
                  iconName = 'heart-outline';
                  iconColor = '#d83b01';
                  iconBg = '#fde7e9';
                } else if (opp.cause === 'Water, Sanitation, and Hygiene (WASH)') {
                  iconName = 'water-outline';
                  iconColor = '#0078d4';
                  iconBg = '#e1dfdd';
                } else if (opp.cause === 'Environment & Sustainability') {
                  iconName = 'leaf-outline';
                  iconColor = '#107c41';
                  iconBg = '#dff6dd';
                } else if (opp.cause === 'Poverty Alleviation & Livelihoods') {
                  iconName = 'people-outline';
                  iconColor = '#8764b8';
                  iconBg = '#f2f0f5';
                } else if (opp.cause === 'Support for Persons with Disabilities') {
                  iconName = 'accessibility-outline';
                  iconColor = '#0078d4';
                  iconBg = '#e1f0fa';
                } else if (opp.cause === 'Animal Welfare') {
                  iconName = 'paw-outline';
                  iconColor = '#a80000';
                  iconBg = '#fde7e9';
                }

                if (isDarkMode) {
                  iconBg = 'rgba(255,255,255,0.06)';
                }

                const durationMins = Math.round(opp.durationHrs * 60);
                const accessibilityLabel = `${opp.title}, takes ${durationMins} minutes, location is ${opp.isRemote ? 'Remote' : `${opp.distanceKm} km away`}`;

                return (
                  <View
                    key={opp.id}
                    accessible={true}
                    accessibilityLabel={accessibilityLabel}
                    style={[
                      styles.previewRow,
                      {
                        borderBottomColor: idx === 0 ? themeColors.neutralStroke2 : 'transparent',
                        borderBottomWidth: idx === 0 ? 1 : 0,
                      }
                    ]}
                  >
                    <View style={[styles.previewIconWrapper, { backgroundColor: iconBg }]}>
                      <Ionicons name={iconName} size={18} color={iconColor} />
                    </View>
                    <View style={styles.previewInfo}>
                      <Text
                        style={[styles.previewTitle, { color: themeColors.neutralForeground1 }]}
                        numberOfLines={1}
                      >
                        {opp.title}
                      </Text>
                      <Text style={[styles.previewMeta, { color: themeColors.neutralForeground3 }]}>
                        {durationMins}m • {opp.isRemote ? 'Remote' : `${opp.distanceKm} km`}
                      </Text>
                    </View>
                    <Ionicons name="chevron-forward" size={14} color={themeColors.neutralForeground3} />
                  </View>
                );
              })}

              {/* Shimmer Overlay effect */}
              <Animated.View
                pointerEvents="none"
                style={[
                  styles.shimmerOverlay,
                  {
                    transform: [{ translateX: shimmerTranslateX }],
                    backgroundColor: isDarkMode
                      ? 'rgba(255, 255, 255, 0.05)'
                      : 'rgba(255, 255, 255, 0.4)',
                  }
                ]}
              />
            </View>

            {/* Primary CTA (Button) with Spring Haptic Animation */}
            <Animated.View style={{ transform: [{ scale: ctaButtonScale }] }}>
              <Pressable
                onPressIn={handleCtaPressIn}
                onPressOut={handleCtaPressOut}
                onPress={() => openMicroVolunteering()}
                style={[styles.fullWidthCta, { backgroundColor: themeColors.brandForeground1 }]}
                accessibilityRole="button"
                accessibilityLabel="See all 12 opportunities"
              >
                <Text style={styles.fullWidthCtaText}>See all 12 opportunities</Text>
                <Ionicons name="arrow-forward" size={16} color="#ffffff" style={{ marginLeft: 6 }} />
              </Pressable>
            </Animated.View>

            {/* Secondary "How micro-volunteering works" text link */}
            <Pressable
              onPress={() => {
                Alert.alert(
                  "How Micro-Volunteering Works",
                  "Micro-volunteering allows you to complete bite-sized tasks (under 30 minutes) on your phone or locally. No long-term commitment is needed. Simply select a task, follow the instructions, and make a quick difference!",
                  [{ text: "Got it" }]
                );
              }}
              style={styles.explanationLink}
              accessibilityRole="link"
              accessibilityLabel="How micro-volunteering works info button"
            >
              <Text style={[styles.explanationLinkText, { color: themeColors.brandForeground1 }]}>
                How micro-volunteering works
              </Text>
            </Pressable>
          </LinearGradient>
        </Pressable>

        {/* ## Section 4: Location-Based Opportunities ## */}
        {(() => {
          const filteredLocal = localOpportunities.filter(o => activeCategory === 'All' || o.cause === activeCategory);
          if (filteredLocal.length > 0) {
            return (
              <View>
                <View style={styles.locationHeaderRow}>
                  <Text style={[Typography.sectionHeading, { color: themeColors.neutralForeground1 }]}>
                    {localOpportunities.some(opp => !opp.isRemote && opp.distanceKm <= 5)
                      ? "Opportunities in Gwalior"
                      : "Opportunities Near You"}
                  </Text>
                </View>

                <View style={styles.opportunitiesStack}>
                  {filteredLocal.slice(0, 5).map(opp => (
                    <OpportunityCard
                      key={opp.id}
                      opportunity={opp}
                      onPress={() => handleOpportunityPress(opp)}
                      isDarkMode={isDarkMode}
                    />
                  ))}
                </View>
              </View>
            );
          } else if (activeCategory !== 'All') {
            return (
              <View style={{ padding: Spacing.m, alignItems: 'center', marginVertical: Spacing.xs }}>
                <Text style={{ color: themeColors.neutralForeground3, fontSize: 13 }}>
                  No local opportunities for "{activeCategory}" matching Gwalior radius.
                </Text>
              </View>
            );
          }
          return null;
        })()}

        {/* Volunteer from Anywhere (Remote Section) */}
        <Text style={[styles.sectionTitle, Typography.sectionHeading, { color: themeColors.neutralForeground1 }]}>
          Volunteer from anywhere
        </Text>
        <Text style={[Typography.body, { color: themeColors.neutralForeground3, marginBottom: Spacing.xs, marginTop: -Spacing.xs }]}>
          Remote volunteering opportunities
        </Text>
        
        <View style={styles.opportunitiesStack}>
          {(() => {
            const filteredRemote = remoteOpportunities.filter(o => activeCategory === 'All' || o.cause === activeCategory);
            if (filteredRemote.length > 0) {
              return filteredRemote.map(opp => (
                <OpportunityCard
                  key={opp.id}
                  opportunity={opp}
                  onPress={() => handleOpportunityPress(opp)}
                  isDarkMode={isDarkMode}
                />
              ));
            } else {
              return (
                <View style={{ padding: Spacing.m, alignItems: 'center', marginVertical: Spacing.xs }}>
                  <Text style={{ color: themeColors.neutralForeground3, fontSize: 13 }}>
                    No remote opportunities for "{activeCategory}".
                  </Text>
                </View>
              );
            }
          })()}
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
        <Animated.View
          {...storyPanResponder.panHandlers}
          style={[
            styles.storyContainer,
            {
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 100,
              opacity: storyViewerAnim,
              transform: [
                { scale: storyViewerAnim },
                { translateY: storyTranslateY }
              ],
            }
          ]}
        >
          <Animated.View
            style={{
              flex: 1,
              opacity: storyFadeAnim,
              transform: [{ translateX: causeTransitionAnim }],
            }}
          >
            {/* Story Image background */}
            <ImageBackground
              source={{ uri: activeStories[storyIndex].imageUri }}
              style={styles.storyBgImage}
              resizeMode="cover"
              accessibilityLabel={`${activeStories[storyIndex].headline}. ${activeStories[storyIndex].summary}. Source: ${activeStories[storyIndex].sourceName}. ${getStoryImpactText(activeStories[storyIndex], activeStoryCause)}.`}
              accessibilityRole="image"
            >
              {/* Top dark gradient overlay for legibility (behind text/buttons, zIndex: 1) */}
              <LinearGradient
                colors={['rgba(0,0,0,0.65)', 'transparent']}
                style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 110, zIndex: 1 }}
                pointerEvents="none"
              />

              {/* Bottom dark gradient overlay for text readability (behind text/buttons, zIndex: 2) */}
              <LinearGradient
                colors={['transparent', 'rgba(0,0,0,0.95)']}
                style={{ position: 'absolute', top: '40%', bottom: 0, left: 0, right: 0, zIndex: 2 }}
                pointerEvents="none"
              />

              <View style={[styles.storyGradient, { flex: 1, zIndex: 10 }]}>
                
                {/* 1. Progress indicators at top - Segmented & Clickable */}
                <View
                  style={{
                    position: 'absolute',
                    top: insets.top > 0 ? insets.top : 16,
                    left: Spacing.s,
                    right: Spacing.s,
                    flexDirection: 'row',
                    zIndex: 130,
                  }}
                >
                  {activeStories.map((s, idx) => {
                    let progressContent;
                    if (idx < storyIndex) {
                      progressContent = <View style={[styles.storyProgressFill, { width: '100%' }]} />;
                    } else if (idx === storyIndex) {
                      const reduceMotion = Personalization.getReduceMotion();
                      if (reduceMotion) {
                        progressContent = <View style={[styles.storyProgressFill, { width: '5%' }]} />;
                      } else {
                        progressContent = (
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
                        );
                      }
                    } else {
                      progressContent = <View style={[styles.storyProgressFill, { width: '0%' }]} />;
                    }

                    const segmentGap = activeStories.length > 8 ? 1 : 2;

                    return (
                      <Pressable
                        key={s.id}
                        onPress={() => handleSegmentTap(idx)}
                        style={{ flex: 1, height: 16, justifyContent: 'center', marginHorizontal: segmentGap }}
                        hitSlop={{ top: 10, bottom: 10 }}
                        accessibilityLabel={`Story slide ${idx + 1} of ${activeStories.length}`}
                        accessibilityRole="button"
                      >
                        <View style={{ height: 2, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 1, overflow: 'hidden', width: '100%' }}>
                          {progressContent}
                        </View>
                      </Pressable>
                    );
                  })}
                </View>

                {/* 2. Top Header Row (Cause Logo & Name on Left, Bookmark Action on Right) */}
                {(() => {
                  const coverProps = getCauseCoverProps(activeStoryCause);
                  const HeaderIconComponent = coverProps.iconFamily === 'MaterialCommunityIcons' ? MaterialCommunityIcons : Ionicons;
                  const progressTop = insets.top > 0 ? insets.top : 16;
                  const headerTop = progressTop + 24; // positioned 24px below the top of the progress bar
                  return (
                    <View
                      style={{
                        position: 'absolute',
                        top: headerTop,
                        left: Spacing.m,
                        right: Spacing.m,
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        zIndex: 120,
                      }}
                    >
                      {/* Left: Cause Icon (44x44 circular, colored, same size as bookmark circle) & Name */}
                      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <View
                          style={{
                            width: 44,
                            height: 44,
                            borderRadius: 22,
                            backgroundColor: coverProps.bgColor,
                            justifyContent: 'center',
                            alignItems: 'center',
                            marginRight: 10,
                            shadowColor: '#000',
                            shadowOffset: { width: 0, height: 1 },
                            shadowOpacity: 0.2,
                            shadowRadius: 1.5,
                            elevation: 3,
                          }}
                        >
                          <HeaderIconComponent name={coverProps.icon as any} size={22} color="#ffffff" />
                        </View>
                        <Text
                          style={{
                            color: '#ffffff',
                            fontSize: 16,
                            fontWeight: 'bold',
                            textShadowColor: 'rgba(0, 0, 0, 0.6)',
                            textShadowOffset: { width: 1, height: 1 },
                            textShadowRadius: 3,
                          }}
                        >
                          {activeStoryCause}
                        </Text>
                      </View>

                      {/* Right: Bookmark Button (44x44 circular) */}
                      <Animated.View style={{ transform: [{ scale: bookmarkScaleAnim }] }}>
                        <Pressable
                          onPress={handleToggleBookmarkStory}
                          style={{
                            width: 44,
                            height: 44,
                            borderRadius: 22,
                            backgroundColor: 'rgba(0,0,0,0.5)',
                            justifyContent: 'center',
                            alignItems: 'center',
                          }}
                          accessibilityLabel={causeBookmarkState[activeStoryCause] ? "Remove bookmark" : "Bookmark this cause"}
                          accessibilityRole="button"
                        >
                          <Ionicons
                            name={causeBookmarkState[activeStoryCause] ? "bookmark" : "bookmark-outline"}
                            size={20}
                            color={causeBookmarkState[activeStoryCause] ? themeColors.brandForeground1 : "#ffffff"}
                          />
                        </Pressable>
                      </Animated.View>
                    </View>
                  );
                })()}

                {/* Tapping Overlay Click Zones (Hold to pause, Tap to skip / caption expand) */}
                <Pressable
                  onPressIn={handleStoryPressIn}
                  onPressOut={handleStoryPressOut}
                  onPress={(evt) => {
                    const pageX = evt.nativeEvent.pageX;
                    if (pageX < screenWidth * 0.3) {
                      triggerLeftFlash();
                      handleStoryPrev();
                    } else if (pageX > screenWidth * 0.7) {
                      triggerRightFlash();
                      handleStoryNext();
                    } else {
                      openCaptionSheet();
                    }
                  }}
                  style={StyleSheet.absoluteFill}
                />

                {/* Left Edge Flash overlay */}
                <Animated.View
                  style={{
                    position: 'absolute',
                    top: 0,
                    bottom: 0,
                    left: 0,
                    width: 60,
                    opacity: leftFlashOpacity,
                    zIndex: 80,
                  }}
                  pointerEvents="none"
                >
                  <LinearGradient
                    colors={['rgba(255,255,255,0.4)', 'transparent']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={{ flex: 1 }}
                  />
                </Animated.View>

                {/* Right Edge Flash overlay */}
                <Animated.View
                  style={{
                    position: 'absolute',
                    top: 0,
                    bottom: 0,
                    right: 0,
                    width: 60,
                    opacity: rightFlashOpacity,
                    zIndex: 80,
                  }}
                  pointerEvents="none"
                >
                  <LinearGradient
                    colors={['transparent', 'rgba(255,255,255,0.4)']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={{ flex: 1 }}
                  />
                </Animated.View>

                {/* First-run Coach Mark over the progress bars */}
                {showStoryCoachMark && (
                  <Pressable
                    onPress={dismissCoachMark}
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      height: 80,
                      backgroundColor: 'rgba(15, 108, 189, 0.95)',
                      justifyContent: 'center',
                      alignItems: 'center',
                      paddingHorizontal: Spacing.m,
                      zIndex: 150,
                    }}
                  >
                    <Text style={{ color: '#ffffff', fontSize: 13, fontWeight: '600', textAlign: 'center' }}>
                      💡 Tap left/right to skip · Hold to pause · Tap segments to jump
                    </Text>
                    <Text style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: 10, marginTop: 4 }}>
                      Tap to dismiss
                    </Text>
                  </Pressable>
                )}

                {/* Swipe down to close coachmark */}
                {showSwipeCoachMark && (
                  <View
                    style={{
                      position: 'absolute',
                      top: '45%',
                      left: 0,
                      right: 0,
                      alignItems: 'center',
                      justifyContent: 'center',
                      zIndex: 140,
                    }}
                    pointerEvents="none"
                  >
                    <View
                      style={{
                        backgroundColor: 'rgba(0, 0, 0, 0.75)',
                        paddingHorizontal: 20,
                        paddingVertical: 12,
                        borderRadius: 20,
                        alignItems: 'center',
                        flexDirection: 'column',
                      }}
                    >
                      <Ionicons name="chevron-down" size={18} color="#ffffff" style={{ marginBottom: 4 }} />
                      <Text style={{ color: '#ffffff', fontSize: 13, fontWeight: '600' }}>
                        Swipe down to close
                      </Text>
                    </View>
                  </View>
                )}

                {/* 3. Lower content Area (respect safe-area inset bottom padding) */}
                <View style={[styles.storyContentArea, { zIndex: 12, paddingBottom: insets.bottom > 0 ? insets.bottom + 16 : 24 }]}>
                  
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

                  {/* Contributors & Clarified Metrics */}
                  <View style={styles.storySocialRow}>
                    {activeStories[storyIndex].contributorsCount > 0 && (
                      <View style={styles.storyAvatarsStack}>
                        {activeStories[storyIndex].contributorsAvatars.slice(0, 3).map((url, i) => (
                          <Image
                            key={url}
                            source={{ uri: url }}
                            style={[styles.storyAvatarItem, { marginLeft: i === 0 ? 0 : -8 }]}
                          />
                        ))}
                      </View>
                    )}
                    <Text style={styles.storyContributorText}>
                      {getStoryImpactText(activeStories[storyIndex], activeStoryCause)}
                    </Text>
                  </View>

                  {/* Persistent CTA and Support Row */}
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: Spacing.s }}>
                    
                    {/* Primary CTA button with basic touch scale feedback */}
                    <Animated.View style={{ flex: 1, transform: [{ scale: ctaPressScale }] }}>
                      <Pressable
                        onPressIn={handleStoryCtaPressIn}
                        onPressOut={handleStoryCtaPressOut}
                        onPress={() => {
                          closeStories();
                          openMicroVolunteering();
                        }}
                        style={[styles.storyCtaButton, { backgroundColor: '#0f6cbd', height: 48, borderRadius: Shapes.rounded, justifyContent: 'center', alignItems: 'center' }]}
                      >
                        <Text style={styles.storyCtaButtonText}>Help with this cause</Text>
                      </Pressable>
                    </Animated.View>

                    {/* Secondary Support Action Pill Button */}
                    <Pressable
                      onPress={handleSupportCause}
                      style={{
                        marginLeft: Spacing.s,
                        height: 48,
                        borderRadius: Shapes.rounded,
                        borderWidth: 1.5,
                        borderColor: causeSupportState[activeStoryCause]?.supported ? 'transparent' : '#ffffff',
                        backgroundColor: causeSupportState[activeStoryCause]?.supported ? themeColors.brandBackgroundSubtle : 'transparent',
                        paddingHorizontal: Spacing.m,
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'center',
                        minWidth: 80,
                      }}
                    >
                      <Animated.View style={{ transform: [{ scale: heartScaleAnim }] }}>
                        <Ionicons
                          name={causeSupportState[activeStoryCause]?.supported ? "heart" : "heart-outline"}
                          size={20}
                          color={causeSupportState[activeStoryCause]?.supported ? (themeColors.dangerForeground1 || '#ff3b30') : "#ffffff"}
                        />
                      </Animated.View>
                      <Text
                        style={{
                          color: causeSupportState[activeStoryCause]?.supported ? (themeColors.dangerForeground1 || '#ff3b30') : "#ffffff",
                          fontWeight: '600',
                          fontSize: 14,
                          marginLeft: 6,
                        }}
                      >
                        {causeSupportState[activeStoryCause]?.count || 0}
                      </Text>
                    </Pressable>

                  </View>

                </View>

              </View>
            </ImageBackground>
          </Animated.View>
        </Animated.View>
      )}

      {/* Caption Bottom Sheet */}
      {isCaptionSheetOpen && activeStoryCause && activeStories[storyIndex] && (
        <View
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            backgroundColor: themeColors.neutralBackground1,
            borderTopLeftRadius: 16,
            borderTopRightRadius: 16,
            paddingHorizontal: Spacing.m,
            paddingTop: Spacing.m,
            paddingBottom: insets.bottom > 0 ? insets.bottom + 16 : 24,
            zIndex: 130,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: -4 },
            shadowOpacity: 0.2,
            shadowRadius: 10,
            elevation: 20,
          }}
        >
          {/* Handlebar indicator */}
          <View
            style={{
              width: 40,
              height: 4,
              borderRadius: 2,
              backgroundColor: themeColors.neutralStroke2,
              alignSelf: 'center',
              marginBottom: Spacing.m,
            }}
          />

          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.s }}>
            <Text style={[Typography.bodyStrong, { color: themeColors.brandForeground1, textTransform: 'uppercase', fontSize: 12, letterSpacing: 0.5 }]}>
              {activeStoryCause}
            </Text>
            <Pressable
              onPress={closeCaptionSheet}
              style={{
                width: 32,
                height: 32,
                borderRadius: 16,
                backgroundColor: themeColors.neutralBackground2,
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              <Ionicons name="close" size={18} color={themeColors.neutralForeground1} />
            </Pressable>
          </View>

          <Text style={[Typography.sectionHeading, { color: themeColors.neutralForeground1, marginBottom: Spacing.s }]}>
            {activeStories[storyIndex].headline}
          </Text>

          <ScrollView style={{ maxHeight: 200, marginBottom: Spacing.m }} showsVerticalScrollIndicator={true}>
            <Text style={[Typography.body, { color: themeColors.neutralForeground2, lineHeight: 20 }]}>
              {activeStories[storyIndex].summary}
            </Text>
            <Text style={[Typography.caption, { color: themeColors.neutralForeground3, marginTop: Spacing.s }]}>
              Source: {activeStories[storyIndex].sourceName} • {activeStories[storyIndex].timestamp}
            </Text>
          </ScrollView>

          <View style={{ flexDirection: 'row', gap: Spacing.s }}>
            <Pressable
              onPress={() => {
                closeCaptionSheet();
                closeStories();
                openMicroVolunteering();
              }}
              style={{
                flex: 1,
                backgroundColor: themeColors.brandForeground1,
                height: 48,
                borderRadius: Shapes.rounded,
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              <Text style={{ color: '#ffffff', fontWeight: '600' }}>Help with this cause</Text>
            </Pressable>
            <Pressable
              onPress={handleSupportCause}
              style={{
                backgroundColor: causeSupportState[activeStoryCause]?.supported ? themeColors.brandBackgroundSubtle : themeColors.neutralBackground2,
                width: 60,
                height: 48,
                borderRadius: Shapes.rounded,
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              <Ionicons
                name={causeSupportState[activeStoryCause]?.supported ? "heart" : "heart-outline"}
                size={22}
                color={causeSupportState[activeStoryCause]?.supported ? themeColors.brandForeground1 : themeColors.neutralForeground1}
              />
            </Pressable>
          </View>
        </View>
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
                  ref={searchInputRef}
                  value={searchInputValue}
                  onChangeText={setSearchInputValue}
                  placeholder="Search friends..."
                  placeholderTextColor={themeColors.neutralForegroundDisabled}
                  style={{ flex: 1, color: themeColors.neutralForeground1, fontSize: 14 }}
                  keyboardType="default"
                  autoComplete="off"
                  accessibilityLabel="Search friends"
                  accessibilityRole="search"
                  autoFocus={true}
                />
                {searchInputValue.length > 0 && (
                  <Pressable
                    onPress={() => {
                      setSearchInputValue('');
                      setDebouncedSearchQuery('');
                      searchInputRef.current?.focus();
                    }}
                    style={{ padding: 4 }}
                  >
                    <Ionicons name="close-circle" size={18} color={themeColors.neutralForeground3} />
                  </Pressable>
                )}
              </View>

              {/* Selected Friends Chips Row */}
              {selectedFriends.length > 0 && (
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.s, paddingVertical: 4 }}>
                  <Text style={[Typography.captionStrong, { color: themeColors.neutralForeground2, marginRight: 8, fontSize: 11 }]}>
                    Selected:
                  </Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ alignItems: 'center' }}>
                    {selectedFriends.map(username => {
                      return (
                        <Pressable
                          key={username}
                          onPress={() => setSelectedFriends(prev => prev.filter(u => u !== username))}
                          style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            backgroundColor: themeColors.brandBackgroundSubtle,
                            paddingHorizontal: 8,
                            paddingVertical: 3,
                            borderRadius: 12,
                            marginRight: 6,
                          }}
                        >
                          <Text style={[Typography.captionStrong, { color: themeColors.brandForeground1, fontSize: 11 }]}>
                            @{username}
                          </Text>
                          <Ionicons name="close" size={12} color={themeColors.brandForeground1} style={{ marginLeft: 4 }} />
                        </Pressable>
                      );
                    })}
                  </ScrollView>
                </View>
              )}

              {/* Accessibility Announcer */}
              <Text
                accessibilityLiveRegion="polite"
                style={{ position: 'absolute', width: 1, height: 1, opacity: 0, overflow: 'hidden' }}
              >
                {accessibilityAnnouncement}
              </Text>

              <ScrollView style={{ maxHeight: 300 }} showsVerticalScrollIndicator={false}>
                {isLoadingPickerResults ? (
                  <View>
                    <SkeletonRow themeColors={themeColors} />
                    <SkeletonRow themeColors={themeColors} />
                    <SkeletonRow themeColors={themeColors} />
                  </View>
                ) : MOCK_FRIENDS.length === 0 ? (
                  /* Empty state: No Friends Added at all */
                  <View style={{ alignItems: 'center', justifyContent: 'center', paddingVertical: Spacing.xl }}>
                    <Ionicons name="people-outline" size={48} color={themeColors.neutralForegroundDisabled} style={{ marginBottom: Spacing.s }} />
                    <Text style={[Typography.bodyStrong, { color: themeColors.neutralForeground1, textAlign: 'center' }]}>
                      You haven't added any friends yet
                    </Text>
                    <Pressable
                      onPress={() => {
                        closePicker();
                        Alert.alert("Find Friends", "Redirecting to Find Friends screen...");
                      }}
                      style={{ marginTop: Spacing.xs }}
                    >
                      <Text style={[Typography.body, { color: themeColors.brandForeground1, fontWeight: 'bold' }]}>
                        Find Friends
                      </Text>
                    </Pressable>
                  </View>
                ) : recentFriends.length === 0 && allFriendsFiltered.length === 0 ? (
                  /* Empty state: No Results for Query */
                  <View style={{ alignItems: 'center', justifyContent: 'center', paddingVertical: Spacing.xl }}>
                    <Ionicons name="search-outline" size={48} color={themeColors.neutralForegroundDisabled} style={{ marginBottom: Spacing.s }} />
                    <Text style={[Typography.bodyStrong, { color: themeColors.neutralForeground1, textAlign: 'center' }]}>
                      No friends found
                    </Text>
                    <Text style={[Typography.caption, { color: themeColors.neutralForeground3, textAlign: 'center', marginTop: 4, paddingHorizontal: Spacing.m }]}>
                      No one in your friends list matches "{debouncedSearchQuery}".
                    </Text>
                    {debouncedSearchQuery.trim().length > 0 && (
                      <Pressable
                        onPress={() => {
                          closePicker();
                          showToast(`Invite sent to "${debouncedSearchQuery}"`, () => {});
                        }}
                        style={{
                          marginTop: Spacing.s,
                          borderWidth: 1.5,
                          borderColor: themeColors.brandForeground1,
                          paddingHorizontal: Spacing.m,
                          paddingVertical: 8,
                          borderRadius: 18,
                        }}
                      >
                        <Text style={[Typography.captionStrong, { color: themeColors.brandForeground1 }]}>
                          Invite "{debouncedSearchQuery}" to SocialWorkers
                        </Text>
                      </Pressable>
                    )}
                  </View>
                ) : debouncedSearchQuery.trim().length > 0 ? (
                  /* Query results view */
                  <View>
                    <Text style={[Typography.captionStrong, { color: themeColors.neutralForeground3, marginBottom: 8 }]}>
                      Results for "{debouncedSearchQuery}"
                    </Text>
                    {[...recentFriends, ...allFriendsFiltered].map(friend => {
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
                            <HighlightText
                              text={friend.displayName}
                              highlight={debouncedSearchQuery}
                              style={[Typography.body, { color: themeColors.neutralForeground1 }]}
                              highlightStyle={{ color: themeColors.brandForeground1 }}
                            />
                            <HighlightText
                              text={`@${friend.username}`}
                              highlight={debouncedSearchQuery}
                              style={[Typography.caption, { color: themeColors.neutralForeground3 }]}
                              highlightStyle={{ color: themeColors.brandForeground1 }}
                            />
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
                ) : (
                  /* Default view (empty query) */
                  <View>
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
                  </View>
                )}
              </ScrollView>

              <View style={{ marginTop: Spacing.m, width: '100%', height: 44 }}>
                <Button
                  label={
                    selectedFriends.length === 0
                      ? "Mention friends"
                      : `Mention ${selectedFriends.length} friend${selectedFriends.length === 1 ? '' : 's'}`
                  }
                  appearance="Primary"
                  onPress={handleDonePicker}
                  isDarkMode={isDarkMode}
                  disabled={selectedFriends.length === 0}
                />
              </View>
            </Animated.View>
          </View>
        </Modal>
      )}

      {/* Undo Toast Notification */}
      {toast !== null && (
        <>
          {/* Transparent full-screen overlay to dismiss toast on tap outside */}
          <Pressable
            style={[StyleSheet.absoluteFill, { zIndex: 9998 }]}
            onPress={hideToast}
          />
          <Animated.View
            style={[
              {
                position: 'absolute',
                bottom: keyboardHeight > 0 
                  ? (Platform.OS === 'ios' ? keyboardHeight - (50 + (insets.bottom > 0 ? insets.bottom : Spacing.s)) + 16 : 16)
                  : 16,
                left: 16,
                right: 16,
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
              style={{
                paddingVertical: 12,
                paddingHorizontal: 20,
                marginRight: -Spacing.m,
              }}
              accessibilityRole="button"
              accessibilityLabel="Undo last action"
            >
              <Text style={{ color: themeColors.brandForeground1, fontSize: 14, fontWeight: 'bold' }}>
                Undo
              </Text>
            </Pressable>
          </Animated.View>
        </>
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
    borderRadius: Shapes.rounded + 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  topRightOrnamentContainer: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 150,
    height: 120,
    overflow: 'hidden',
  },
  ornamentOrb: {
    position: 'absolute',
    top: -40,
    right: -40,
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  ornamentCard1: {
    position: 'absolute',
    top: 15,
    right: 25,
    width: 60,
    height: 40,
    borderRadius: 8,
    borderWidth: 1,
    transform: [{ rotate: '15deg' }],
  },
  ornamentCard2: {
    position: 'absolute',
    top: 25,
    right: 15,
    width: 60,
    height: 40,
    borderRadius: 8,
    borderWidth: 1,
    transform: [{ rotate: '-10deg' }],
  },
  microEyebrowRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.s,
  },
  microPill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  microPillText: {
    fontSize: 11,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  microCounterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  microCounterNumber: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  microCounterLabel: {
    fontSize: 13,
  },
  microNewTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    lineHeight: 24,
    marginBottom: 2,
  },
  microNewSubtitle: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: Spacing.s,
  },
  timeChipsRow: {
    flexDirection: 'row',
    marginBottom: Spacing.m,
  },
  timeChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    marginRight: Spacing.s,
    justifyContent: 'center',
    alignItems: 'center',
  },
  timeChipText: {
    fontSize: 12,
    fontWeight: '600',
  },
  previewsContainer: {
    borderRadius: 8,
    backgroundColor: 'rgba(0,0,0,0.02)',
    paddingHorizontal: Spacing.s,
    marginBottom: Spacing.m,
    overflow: 'hidden',
    position: 'relative',
  },
  previewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  previewIconWrapper: {
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.s,
  },
  previewInfo: {
    flex: 1,
  },
  previewTitle: {
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 18,
    marginBottom: 1,
  },
  previewMeta: {
    fontSize: 11,
  },
  shimmerOverlay: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 100,
    opacity: 0.5,
  },
  fullWidthCta: {
    flexDirection: 'row',
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    marginBottom: Spacing.s,
  },
  fullWidthCtaText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  explanationLink: {
    alignSelf: 'center',
    paddingVertical: 4,
  },
  explanationLinkText: {
    fontSize: 12,
    fontWeight: '600',
    textDecorationLine: 'underline',
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
    justifyContent: 'flex-end',
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
    height: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    marginHorizontal: 2,
    borderRadius: 1,
    overflow: 'hidden',
  },
  storyProgressFill: {
    height: '100%',
    backgroundColor: '#ffffff',
    borderRadius: 1,
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

