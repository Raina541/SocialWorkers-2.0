import React, { useState, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Dimensions,
  Pressable,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Colors, Spacing, Typography, Shapes } from './constants/Theme';
import { Avatar, PresenceState } from './components/Avatar';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';

// Import Screen Sections
import { Home } from './screens/Home';
import { Feed } from './screens/Feed';
import { Community } from './screens/Community';
import { Blog } from './screens/Blog';
import { Profile } from './screens/Profile';

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
  const [presence, setPresence] = useState<PresenceState>('Available');
  const [activeTab, setActiveTab] = useState(0);

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

  // Navigate to a specific section tab
  const handleTabPress = (index: number) => {
    setActiveTab(index);
    scrollViewRef.current?.scrollTo({
      x: index * screenWidth,
      animated: true,
    });
  };

  const handleScrollEnd = (event: any) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(offsetX / screenWidth);
    if (index !== activeTab && index >= 0 && index < tabs.length) {
      setActiveTab(index);
    }
  };

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
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleScrollEnd}
        bounces={false}
        overScrollMode="never"
        style={styles.pager}
      >
        <View style={[styles.page, { width: screenWidth }]}>
          <Home isDarkMode={isDarkMode} onNavigateToTab={handleTabPress} />
        </View>
        
        <View style={[styles.page, { width: screenWidth }]}>
          <Feed isDarkMode={isDarkMode} />
        </View>
        
        <View style={[styles.page, { width: screenWidth }]}>
          <Community isDarkMode={isDarkMode} />
        </View>
        
        <View style={[styles.page, { width: screenWidth }]}>
          <Blog isDarkMode={isDarkMode} />
        </View>
        
        <View style={[styles.page, { width: screenWidth }]}>
          <Profile
            isDarkMode={isDarkMode}
            onToggleDarkMode={() => setIsDarkMode(!isDarkMode)}
            presence={presence}
            onChangePresence={setPresence}
          />
        </View>
      </ScrollView>

      {/* Bottom Navigation Bar */}
      <View
        style={[
          styles.tabBar,
          {
            backgroundColor: themeColors.neutralBackground1,
            borderTopColor: themeColors.neutralStroke2,
            paddingBottom: insets.bottom > 0 ? insets.bottom : Spacing.s,
            paddingTop: Spacing.xxs,
          },
        ]}
      >
        {tabs.map((tab, index) => {
          const isSelected = activeTab === index;
          return (
            <Pressable
              key={tab.name}
              onPress={() => handleTabPress(index)}
              style={styles.tabItem}
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

              <View style={styles.tabContent}>
                <Ionicons
                  name={isSelected ? tab.activeIcon : tab.inactiveIcon}
                  size={22}
                  color={isSelected ? themeColors.brandForeground1 : themeColors.neutralForeground3}
                />
                <Text
                  style={[
                    styles.tabLabel,
                    isSelected ? Typography.captionStrong : Typography.caption,
                    {
                      color: isSelected ? themeColors.brandForeground1 : themeColors.neutralForeground3,
                      marginTop: 2,
                    },
                  ]}
                >
                  {tab.name}
                </Text>
              </View>
            </Pressable>
          );
        })}
      </View>
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
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    position: 'relative',
    paddingVertical: Spacing.xxs,
  },
  tabAccentLine: {
    height: 3,
    width: '50%',
    borderBottomLeftRadius: 1.5,
    borderBottomRightRadius: 1.5,
    position: 'absolute',
    top: 0,
  },
  tabContent: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 4,
  },
  tabLabel: {
    fontSize: 10,
  },
});
