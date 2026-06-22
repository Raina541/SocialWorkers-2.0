import React, { useState, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Dimensions,
  Pressable,
  Animated,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Colors, Spacing, Typography, Shapes } from './constants/Theme';
import { Avatar, PresenceState } from './components/Avatar';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';

// Import Screen Sections
import { Home } from './screens/Home';
import { Feed } from './screens/Feed';
import { Community } from './community/Community';
import { SandboxCommunityView } from './community/SandboxCommunityView';
import { Blog } from './screens/Blog';
import { Profile } from './screens/Profile';
import { StoryTestScreen } from './screens/StoryTestScreen';
import { AuthFlow } from './screens/AuthFlow';

const { width: screenWidth } = Dimensions.get('window');

type IconName = keyof typeof Ionicons.glyphMap;

interface TabConfig {
  name: string;
  activeIcon: IconName;
  inactiveIcon: IconName;
}

export default function App() {
  return (
    <SafeAreaProvider>
      <MainLayout />
    </SafeAreaProvider>
  );
}

function MainLayout() {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [presence, setPresence] = useState<PresenceState>('Available');
  const [activeTab, setActiveTab] = useState(0);
  const [showLiveTest, setShowLiveTest] = useState(false);
  const [pagerScrollEnabled, setPagerScrollEnabled] = useState(true);
  const [useSandboxCommunity, setUseSandboxCommunity] = useState(false);

  const [tabBarVisible, setTabBarVisible] = useState(true);
  const tabBarTranslateY = useRef(new Animated.Value(0)).current;

  const handleToggleTabBar = (visible: boolean) => {
    setTabBarVisible(visible);
    Animated.timing(tabBarTranslateY, {
      toValue: visible ? 0 : 120,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  const scrollViewRef = useRef<ScrollView>(null);
  const themeColors = isDarkMode ? Colors.dark : Colors.light;
  const insets = useSafeAreaInsets();

  const tabs: TabConfig[] = [
    { name: 'Home', activeIcon: 'home', inactiveIcon: 'home-outline' },
    { name: 'Feed', activeIcon: 'newspaper', inactiveIcon: 'newspaper-outline' },
    { name: 'Community', activeIcon: 'people', inactiveIcon: 'people-outline' },
    { name: 'Blog', activeIcon: 'book', inactiveIcon: 'book-outline' },
    { name: 'Profile', activeIcon: 'person', inactiveIcon: 'person-outline' },
  ];

  const [autoOpenCause, setAutoOpenCause] = useState<string | null>(null);

  // Fade animations for each tab page
  const fadeAnims = useRef([
    new Animated.Value(1), // Home
    new Animated.Value(1), // Feed
    new Animated.Value(1), // Community
    new Animated.Value(1), // Blog
    new Animated.Value(1), // Profile
  ]).current;

  const triggerFadeIn = (index: number) => {
    // Reset other pages to 1 instantly, and animate the target page
    fadeAnims.forEach((anim, idx) => {
      if (idx !== index) {
        anim.setValue(1);
      }
    });
    fadeAnims[index].setValue(0.3); // start from 0.3 for a smoother fade effect
    Animated.timing(fadeAnims[index], {
      toValue: 1.0,
      duration: 350,
      useNativeDriver: true,
    }).start();
  };

  // Navigate to a specific section tab
  const handleTabPress = (index: number) => {
    setActiveTab(index);
    scrollViewRef.current?.scrollTo({
      x: index * screenWidth,
      animated: false,
    });
    triggerFadeIn(index);
  };

  const handleScrollEnd = (event: any) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(offsetX / screenWidth);
    if (index !== activeTab && index >= 0 && index < tabs.length) {
      setActiveTab(index);
      triggerFadeIn(index);
    }
  };

  if (!isAuthenticated) {
    return (
      <View
        style={[
          styles.safeArea,
          {
            backgroundColor: themeColors.neutralBackground1,
            paddingTop: insets.top,
          },
        ]}
      >
        <StatusBar style={isDarkMode ? 'light' : 'dark'} />
        <AuthFlow
          isDarkMode={isDarkMode}
          onAuthComplete={(userData) => {
            console.log('Authenticated user:', userData);
            setIsAuthenticated(true);
          }}
        />
      </View>
    );
  }

  return (
    <View
      style={[
        styles.safeArea,
        {
          backgroundColor: themeColors.neutralBackground1,
          paddingTop: insets.top,
        },
      ]}
    >
      <StatusBar style={isDarkMode ? 'light' : 'dark'} />
      


      {/* Swipeable Pager Area */}
      <ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        scrollEnabled={false}
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleScrollEnd}
        bounces={false}
        overScrollMode="never"
        style={[
          styles.pager,
          {
            marginBottom: tabBarVisible ? 56 + (insets.bottom > 0 ? insets.bottom : Spacing.s) : 0,
          },
        ]}
      >
        <Animated.View style={[styles.page, { width: screenWidth, opacity: fadeAnims[0] }]}>
          <Home
            isDarkMode={isDarkMode}
            onNavigateToTab={handleTabPress}
            onSetPagerScrollEnabled={setPagerScrollEnabled}
            autoOpenCause={autoOpenCause}
            onClearAutoOpenCause={() => setAutoOpenCause(null)}
            onToggleTabBar={handleToggleTabBar}
          />
        </Animated.View>
        
        <Animated.View style={[styles.page, { width: screenWidth, opacity: fadeAnims[1] }]}>
          <Feed isDarkMode={isDarkMode} />
        </Animated.View>
        
        <Animated.View style={[styles.page, { width: screenWidth, opacity: fadeAnims[2] }]}>
          {useSandboxCommunity ? (
            <SandboxCommunityView isDarkMode={isDarkMode} />
          ) : (
            <Community isDarkMode={isDarkMode} onToggleTabBar={handleToggleTabBar} activeTab={activeTab} />
          )}
        </Animated.View>
        
        <Animated.View style={[styles.page, { width: screenWidth, opacity: fadeAnims[3] }]}>
          <Blog isDarkMode={isDarkMode} />
        </Animated.View>
        
        <Animated.View style={[styles.page, { width: screenWidth, opacity: fadeAnims[4] }]}>
          <Profile
            isDarkMode={isDarkMode}
            onToggleDarkMode={() => setIsDarkMode(!isDarkMode)}
            presence={presence}
            onChangePresence={setPresence}
            onViewCauseStories={(cause) => {
              setAutoOpenCause(cause);
              handleTabPress(0);
            }}
            onViewLiveTest={() => setShowLiveTest(true)}
            onSignOut={() => setIsAuthenticated(false)}
            useSandboxCommunity={useSandboxCommunity}
            onToggleSandboxCommunity={setUseSandboxCommunity}
          />
        </Animated.View>
      </ScrollView>

      {/* Bottom Navigation Bar */}
      <Animated.View
        style={[
          styles.tabBar,
          {
            backgroundColor: themeColors.neutralBackground1,
            borderTopColor: themeColors.neutralStroke2,
            paddingBottom: insets.bottom > 0 ? insets.bottom : Spacing.s,
            paddingTop: Spacing.xxs,
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            transform: [{ translateY: tabBarTranslateY }],
          },
        ]}
      >
        {tabs.map((tab, index) => {
          const isSelected = activeTab === index;
          return (
            <Pressable
              key={tab.name}
              onPress={() => handleTabPress(index)}
              style={({ pressed }) => [
                styles.tabItem,
                {
                  opacity: pressed ? 0.7 : 1,
                }
              ]}
            >
              {/* Active Tab Accent Line */}
              <View
                style={[
                  styles.tabAccentLine,
                  {
                    backgroundColor: isSelected ? themeColors.brandForeground1 : 'transparent',
                  },
                ]}
              />

              <Ionicons
                name={isSelected ? tab.activeIcon : tab.inactiveIcon}
                size={22}
                color={isSelected ? themeColors.brandForeground1 : themeColors.neutralForeground3}
              />
              <Text
                style={[
                  styles.tabLabel,
                  {
                    color: isSelected ? themeColors.brandForeground1 : themeColors.neutralForeground3,
                    fontWeight: isSelected ? '600' : '500',
                    marginTop: 2,
                  },
                ]}
              >
                {tab.name}
              </Text>
            </Pressable>
          );
        })}
      </Animated.View>
      {showLiveTest && (
        <StoryTestScreen isDarkMode={isDarkMode} onBack={() => setShowLiveTest(false)} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 56,
    paddingHorizontal: Spacing.m,
    borderBottomWidth: 1,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 1,
    zIndex: 10,
  },
  headerTitle: {
    fontSize: 16,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerIconButton: {
    marginRight: Spacing.s,
    padding: Spacing.xxs,
  },
  pager: {
    flex: 1,
  },
  page: {
    flex: 1,
  },
  tabBar: {
    flexDirection: 'row',
    borderTopWidth: 1,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    height: 56,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  tabAccentLine: {
    height: 2,
    width: '60%',
    borderRadius: 1,
    position: 'absolute',
    top: 0,
  },
  tabContent: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 4,
  },
  tabIconContainer: {
    paddingHorizontal: 16,
    paddingVertical: 4,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 2,
  },
  tabLabel: {
    fontSize: 10,
  },
});
