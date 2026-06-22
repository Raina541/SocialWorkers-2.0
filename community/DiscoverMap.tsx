import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  Pressable,
  Platform,
  Image,
  PanResponder,
  Animated,
  ImageStyle,
  ScrollView,
} from 'react-native';
import { Colors, Spacing, Typography, Shapes } from '../constants/Theme';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';

// Try loading react-native-maps. Provide mock fallback if on Web or if it fails.
let MapView: any;
let Marker: any;
let Circle: any;

try {
  const Maps = require('react-native-maps');
  MapView = Maps.default;
  Marker = Maps.Marker;
  Circle = Maps.Circle;
} catch (e) {
  // Web Fallback will be used, react-native-maps imports ignored.
}

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
const drawerHeight = screenHeight - 110;

// Coordinate center helper
const SF_COORDS = { latitude: 37.7749, longitude: -122.4194 };
const EARTH_RADIUS_KM = 6371;
const MAGENTA_RED = '#d8246c';
const maxRadiusKm = 20;

interface GeoCoords {
  latitude: number;
  longitude: number;
}

interface CommunityItem {
  id: string;
  name: string;
  members: number;
  activeMembers: number;
  lastMessage: string;
  time: string;
  unreadCount: number;
  isPinned: boolean;
  isMuted: boolean;
  imageUri: string;
  tags: string[];
  description?: string;
  // Geo offsets relative to user coordinates
  latOffset: number;
  lngOffset: number;
  // Computed fields
  distance?: number;
  latitude?: number;
  longitude?: number;
}

interface DiscoverMapProps {
  isDarkMode?: boolean;
  onJoinCommunity: (item: any) => void;
}

// Distance helper using Haversine formula
const getDistanceInKm = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS_KM * c;
};

// Calculate coordinates for circle edge (east point)
const getEdgeCoordinate = (center: GeoCoords, radiusKm: number): GeoCoords => {
  const latRad = (center.latitude * Math.PI) / 180;
  const lngOffset = radiusKm / (111.32 * Math.cos(latRad));
  return {
    latitude: center.latitude,
    longitude: center.longitude + lngOffset,
  };
};

// Calculate required latitudeDelta and longitudeDelta to fit circular search radius
const getRegionForRadius = (center: GeoCoords, radiusKm: number) => {
  const latRad = (center.latitude * Math.PI) / 180; 
  const padding = 1.35; // margin factor
  const latDelta = (2 * radiusKm / 111.32) * padding;
  const lngDelta = (2 * radiusKm / (111.32 * Math.cos(latRad))) * padding;
  return {
    latitude: center.latitude,
    longitude: center.longitude,
    latitudeDelta: Math.max(0.005, latDelta),
    longitudeDelta: Math.max(0.005, lngDelta),
  };
};

export const DiscoverMap: React.FC<DiscoverMapProps> = ({
  isDarkMode = false,
  onJoinCommunity,
}) => {
  const themeColors = isDarkMode ? Colors.dark : Colors.light;

  const mapRef = useRef<any>(null);
  const [userLocation, setUserLocation] = useState<GeoCoords>(SF_COORDS);
  const [radius, setRadius] = useState<number>(5.0); // radius in km (default: 5.0)
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [selectedCommunity, setSelectedCommunity] = useState<CommunityItem | null>(null);

  // Pulsing user location dot animation
  const pulseAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const pulseLoop = () => {
      pulseAnim.setValue(0);
      Animated.timing(pulseAnim, {
        toValue: 1,
        duration: 2500,
        useNativeDriver: true,
      }).start(() => pulseLoop());
    };
    pulseLoop();
  }, [pulseAnim]);

  const pulseScale = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.6, 2.5],
  });

  const pulseOpacity = pulseAnim.interpolate({
    inputRange: [0, 0.75, 1],
    outputRange: [0.5, 0.2, 0],
  });

  // Draggable snap drawer state management
  const [drawerState, setDrawerState] = useState<'closed' | 'collapsed' | 'expanded'>('collapsed');
  const drawerY = useRef(new Animated.Value(drawerHeight - 70)).current;
  const startY = useRef(drawerHeight - 70);

  // Effect to automatically animate drawer to collapsed state when a pin selection changes
  useEffect(() => {
    animateDrawer('collapsed');
  }, [selectedCommunity]);

  const animateDrawer = (state: 'closed' | 'collapsed' | 'expanded') => {
    setDrawerState(state);
    let toValue = drawerHeight; // default closed/hidden
    if (state === 'collapsed') {
      toValue = selectedCommunity ? (drawerHeight - 260) : (drawerHeight - 70);
    } else if (state === 'expanded') {
      toValue = 0;
    }

    Animated.spring(drawerY, {
      toValue,
      tension: 60,
      friction: 10,
      useNativeDriver: true,
    }).start();
  };

  // PanResponder to handle swipe gestures on the bottom sheet handle
  const drawerPanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dy) > 5;
      },
      onPanResponderGrant: () => {
        let currentPos = drawerHeight;
        if (drawerState === 'collapsed') {
          currentPos = selectedCommunity ? (drawerHeight - 260) : (drawerHeight - 70);
        } else if (drawerState === 'expanded') {
          currentPos = 0;
        }
        startY.current = currentPos;
      },
      onPanResponderMove: (_, gestureState) => {
        const nextY = startY.current + gestureState.dy;
        // Keep it clamped so the user cannot drag above 0px offset (drawer top limit)
        if (nextY >= 0) {
          drawerY.setValue(nextY);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        const finalY = startY.current + gestureState.dy;

        const thresholdCollapsed = selectedCommunity ? (drawerHeight - 260) : (drawerHeight - 70);
        const thresholdExpanded = 0;

        let targetState: 'closed' | 'collapsed' | 'expanded' = 'collapsed';

        // Check vertical velocity for quick swipe gestures
        if (gestureState.vy < -0.5) {
          targetState = 'expanded';
        } else if (gestureState.vy > 0.5) {
          // If in single pin view and swiping down, return to macro view collapsed bar
          if (selectedCommunity && startY.current === (drawerHeight - 260)) {
            setSelectedCommunity(null);
            targetState = 'collapsed';
          } else {
            targetState = 'collapsed';
          }
        } else {
          // Snap based on closest distance
          const distCollapsed = Math.abs(finalY - thresholdCollapsed);
          const distExpanded = Math.abs(finalY - thresholdExpanded);

          if (distExpanded < distCollapsed) {
            targetState = 'expanded';
          } else {
            targetState = 'collapsed';
          }
        }

        animateDrawer(targetState);
      },
    })
  ).current;

  // Sample discoverable communities with coordinate offsets
  const [discoverCommunities] = useState<CommunityItem[]>([
    {
      id: 'dm_c1',
      name: 'Global Climate Action & Advocacy',
      members: 342,
      activeMembers: 45,
      lastMessage: "Let's organize a green drive next Saturday.",
      time: 'Just now',
      unreadCount: 0,
      isPinned: false,
      isMuted: false,
      imageUri: 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=150',
      tags: ['Climate', 'Environment'],
      description: 'Coordinate climate strikes, local tree planting drives, recycling programs, and green policy advocacy within the city.',
      latOffset: 0.012,
      lngOffset: 0.012, // Distance ~1.9 km
    },
    {
      id: 'dm_c2',
      name: 'Senior Citizen Care & Outreach',
      members: 128,
      activeMembers: 14,
      lastMessage: 'Volunteers needed for the nursing home visit.',
      time: '3 hours ago',
      unreadCount: 0,
      isPinned: false,
      isMuted: false,
      imageUri: 'https://images.unsplash.com/photo-1516627145497-ae6968895b74?w=150',
      tags: ['Elderly Care', 'Outreach'],
      description: 'Providing meal deliveries, companion visits, medication pickup runs, and general emergency housing assistance for elderly community members.',
      latOffset: -0.025,
      lngOffset: -0.025, // Distance ~3.9 km
    },
    {
      id: 'dm_c3',
      name: 'Urban Literacy & Youth Mentors',
      members: 215,
      activeMembers: 22,
      lastMessage: 'New library curriculum is ready for review.',
      time: 'Yesterday',
      unreadCount: 0,
      isPinned: false,
      isMuted: false,
      imageUri: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=150',
      tags: ['Education', 'Mentorship'],
      description: 'Tutor underprivileged public school children, host local weekend book reading events, and establish mini libraries in neighborhood zones.',
      latOffset: 0.045,
      lngOffset: -0.045, // Distance ~7.1 km
    },
    {
      id: 'dm_c4',
      name: 'Homeless Shelter Volunteers',
      members: 512,
      activeMembers: 84,
      lastMessage: 'Night shelter coordination document updated.',
      time: '12 hours ago',
      unreadCount: 0,
      isPinned: false,
      isMuted: false,
      imageUri: 'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?w=150',
      tags: ['Housing', 'Food Security'],
      description: 'Distributing food kits, clothing, coordinate transitional shelter bed spaces, and run hygiene campaigns for homeless individuals.',
      latOffset: -0.07,
      lngOffset: 0.07, // Distance ~11.0 km
    },
    {
      id: 'dm_c5',
      name: 'Crisis Counseling & Therapy Aid',
      members: 198,
      activeMembers: 19,
      lastMessage: 'Support lines training guide shared.',
      time: '2 days ago',
      unreadCount: 0,
      isPinned: false,
      isMuted: false,
      imageUri: 'https://images.unsplash.com/photo-1518495973542-4542c06a5843?w=150',
      tags: ['Mental Health', 'Counseling'],
      description: 'Dedicated network providing counseling referrals, alcohol and substance abuse helpline slots, and mental health aid circles.',
      latOffset: 0.11,
      lngOffset: 0.11, // Distance ~17.2 km
    },
  ]);

  // Request location on mount
  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          const loc = await Location.getCurrentPositionAsync({});
          setUserLocation({
            latitude: loc.coords.latitude,
            longitude: loc.coords.longitude,
          });
        }
      } catch (err) {
        console.log('Permission to access location was denied, using fallback coordinate.');
      }
    })();
  }, []);

  // Center map on user location when coordinates load (5km default radius)
  useEffect(() => {
    if (mapRef.current && userLocation) {
      const region = getRegionForRadius(userLocation, 5.0);
      mapRef.current.animateToRegion(region, 1000);
    }
  }, [userLocation]);

  // Compute community coordinates and distances
  const mappedCommunities = discoverCommunities.map((c) => {
    const lat = userLocation.latitude + c.latOffset;
    const lng = userLocation.longitude + c.lngOffset;
    const dist = getDistanceInKm(userLocation.latitude, userLocation.longitude, lat, lng);
    return {
      ...c,
      latitude: lat,
      longitude: lng,
      distance: dist,
    };
  });

  // Filter based on active selected radius
  const filteredCommunities = mappedCommunities.filter((c) => c.distance <= radius);

  // Handle drawer animation opening (Micro View)
  const openDrawer = (community: CommunityItem) => {
    setSelectedCommunity(community);
    
    // Focus/Center map on marker coordinate (slightly offset to account for bottom sheet height)
    if (mapRef.current && community.latitude !== undefined && community.longitude !== undefined) {
      mapRef.current.animateToRegion(
        {
          latitude: community.latitude - (radius * 0.003),
          longitude: community.longitude,
          latitudeDelta: Math.max(0.015, radius * 0.012),
          longitudeDelta: Math.max(0.015, radius * 0.012),
        },
        600
      );
    }
  };

  // Web Radar Map Drag gesture setup
  // Web scale: center is (centerX=175, centerY=175), max 20km = 150px (7.5px/km)
  const radarScale = 7.5;
  const webCenter = 175;

  const webPanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        setIsDragging(true);
      },
      onPanResponderMove: (evt) => {
        const touchX = evt.nativeEvent.locationX;
        const touchY = evt.nativeEvent.locationY;
        const dx = touchX - webCenter;
        const dy = touchY - webCenter;
        const distPx = Math.sqrt(dx * dx + dy * dy);
        const calculatedRadius = distPx / radarScale;
        setRadius(Math.min(maxRadiusKm, Math.max(1.0, calculatedRadius)));
      },
      onPanResponderRelease: () => {
        setIsDragging(false);
      },
    })
  ).current;

  // Render bottom details drawer overlay (Macro vs Micro view)
  const renderExpandableDrawer = () => {
    const isMicro = selectedCommunity !== null;
    const collapsedVisibleHeight = isMicro ? 260 : 70;

    const translateY = drawerY.interpolate({
      inputRange: [0, drawerHeight - collapsedVisibleHeight, drawerHeight],
      outputRange: [0, drawerHeight - collapsedVisibleHeight, drawerHeight],
      extrapolate: 'clamp',
    });

    return (
      <Animated.View
        style={[
          styles.bottomDrawer,
          {
            backgroundColor: themeColors.neutralBackground1,
            transform: [{ translateY }],
            borderColor: themeColors.neutralStroke2,
            height: drawerHeight,
          },
        ]}
      >
        {/* Top Draggable Handle Area */}
        <View {...drawerPanResponder.panHandlers} style={styles.drawerDragHandleContainer}>
          <View style={[styles.drawerCloseLine, { backgroundColor: themeColors.neutralStroke1 }]} />
        </View>

        {isMicro ? (
          /* ================= MICRO VIEW (SINGLE PIN PEEK) ================= */
          <View style={{ flex: 1 }}>
            <ScrollView
              style={styles.drawerScrollView}
              contentContainerStyle={styles.drawerScrollContent}
              showsVerticalScrollIndicator={false}
              scrollEnabled={drawerState === 'expanded'}
            >
              {/* Summary Row */}
              <View style={styles.drawerHeaderRow}>
                <Image source={{ uri: selectedCommunity.imageUri }} style={styles.drawerImage as ImageStyle} />
                <View style={styles.drawerHeaderDetails}>
                  <Text style={[styles.drawerTitle, { color: themeColors.neutralForeground1 }]}>
                    {selectedCommunity.name}
                  </Text>
                  <Text style={[Typography.body, { color: themeColors.neutralForeground3, fontSize: 13, marginTop: 2 }]}>
                    {selectedCommunity.members} members • {selectedCommunity.activeMembers} online
                  </Text>
                  <Text style={[Typography.captionStrong, { color: themeColors.brandForeground1, marginTop: 4, fontSize: 12 }]}>
                    {(selectedCommunity.distance ?? 0).toFixed(1)} km away
                  </Text>
                </View>
              </View>

              {/* Tags */}
              <View style={styles.drawerTagsRow}>
                {selectedCommunity.tags.map((tag) => (
                  <View key={tag} style={[styles.drawerTagChip, { backgroundColor: isDarkMode ? '#243454' : '#e0ecfa' }]}>
                    <Text style={[styles.drawerTagText, { color: themeColors.brandForeground1 }]}>{tag}</Text>
                  </View>
                ))}
              </View>

              {/* Description Block */}
              {drawerState === 'collapsed' ? (
                <Text
                  style={[styles.drawerDescription, Typography.body, { color: themeColors.neutralForeground2 }]}
                  numberOfLines={3}
                >
                  {selectedCommunity.description}
                </Text>
              ) : (
                <View style={styles.expandedAboutSection}>
                  <View style={[styles.dividerLineItem, { backgroundColor: themeColors.neutralStroke2 }]} />
                  
                  {/* Cause Category Badge (magenta red) */}
                  <View style={styles.infoSection}>
                    <Text style={[Typography.captionStrong, { color: themeColors.neutralForeground2, marginBottom: Spacing.xxs, fontSize: 11 }]}>
                      CAUSE CATEGORY
                    </Text>
                    <View style={[styles.customBadge, { backgroundColor: MAGENTA_RED }]}>
                      <Text style={styles.customBadgeText}>Child Welfare & Family Support</Text>
                    </View>
                  </View>

                  {/* Description */}
                  <View style={styles.infoSection}>
                    <Text style={[Typography.captionStrong, { color: themeColors.neutralForeground2, marginBottom: Spacing.xxs, fontSize: 11 }]}>
                      COMMUNITY DESCRIPTION
                    </Text>
                    <Text style={[Typography.body, { color: themeColors.neutralForeground1, lineHeight: 20 }]}>
                      {selectedCommunity.description || "This community is dedicated to sharing active casework, coordinating local relief projects, hosting mentorship workshops, and collaborating on emergency campaigns in the neighborhood."}
                    </Text>
                  </View>

                  {/* Coordination Guidelines */}
                  <View style={styles.infoSection}>
                    <Text style={[Typography.captionStrong, { color: themeColors.neutralForeground2, marginBottom: Spacing.xxs, fontSize: 11 }]}>
                      COORDINATION RULES & GUIDELINES
                    </Text>
                    <Text style={[Typography.caption, { color: themeColors.neutralForeground2, lineHeight: 18 }]}>
                      • Respect caseworker privacy: do not share sensitive personal info in discussions.{"\n"}
                      • Keep conversations focused on social service coordinate.{"\n"}
                      • Post a poll to gather availability before scheduling local events.
                    </Text>
                  </View>
                </View>
              )}
            </ScrollView>

            {/* Join button row (Sticky at the base) */}
            <View style={[styles.drawerButtonRow, { borderTopColor: themeColors.neutralStroke2, backgroundColor: themeColors.neutralBackground1 }]}>
              <Pressable
                onPress={() => setSelectedCommunity(null)}
                style={[styles.drawerCancelButton, { borderColor: themeColors.neutralStroke1 }]}
              >
                <Text style={{ color: themeColors.neutralForeground1, fontWeight: '600' }}>Back</Text>
              </Pressable>
              <Pressable
                onPress={() => {
                  onJoinCommunity(selectedCommunity);
                  setSelectedCommunity(null);
                }}
                style={[styles.drawerJoinButton, { backgroundColor: themeColors.brandForeground1 }]}
              >
                <Text style={styles.drawerJoinButtonText}>Join Community</Text>
              </Pressable>
            </View>
          </View>
        ) : (
          /* ================= MACRO VIEW (MULTI-COMMUNITY LIST) ================= */
          <View style={{ flex: 1 }}>
            {drawerState === 'collapsed' ? (
              <Pressable onPress={() => animateDrawer('expanded')} style={styles.macroCollapsedHandleContent}>
                <Ionicons name="chevron-up" size={16} color={themeColors.neutralForeground3} style={{ marginRight: 6 }} />
                <Text style={[Typography.bodyStrong, { color: themeColors.neutralForeground2, fontSize: 13 }]}>
                  Swipe up to view {filteredCommunities.length} {filteredCommunities.length === 1 ? 'community' : 'communities'} in range
                </Text>
              </Pressable>
            ) : (
              <View style={{ flex: 1 }}>
                <Text style={[styles.macroExpandedTitle, { color: themeColors.neutralForeground1 }]}>
                  Communities in Range ({filteredCommunities.length})
                </Text>
                
                <ScrollView
                  style={styles.drawerScrollView}
                  contentContainerStyle={styles.macroListScrollContent}
                  showsVerticalScrollIndicator={false}
                >
                  {filteredCommunities.length === 0 ? (
                    <View style={styles.emptyListContainer}>
                      <Ionicons name="compass-outline" size={48} color={themeColors.neutralForegroundDisabled} />
                      <Text style={[Typography.body, { color: themeColors.neutralForeground3, marginTop: Spacing.s, textAlign: 'center', paddingHorizontal: Spacing.l }]}>
                        No communities found in this range. Drag the handle to expand your search area.
                      </Text>
                    </View>
                  ) : (
                    filteredCommunities.map((item) => (
                      <Pressable
                        key={item.id}
                        onPress={() => openDrawer(item)}
                        style={[
                          styles.macroListItemCard,
                          {
                            backgroundColor: themeColors.neutralBackground2,
                            borderColor: themeColors.neutralStroke1,
                          },
                        ]}
                      >
                        <Image source={{ uri: item.imageUri }} style={styles.macroListImage as ImageStyle} />
                        <View style={styles.macroListDetails}>
                          <Text style={[styles.macroListTitle, { color: themeColors.neutralForeground1 }]} numberOfLines={1}>
                            {item.name}
                          </Text>
                          <Text style={[Typography.caption, { color: themeColors.neutralForeground3, marginTop: 2 }]}>
                            {item.members} members • {(item.distance ?? 0).toFixed(1)} km away
                          </Text>
                          <View style={styles.macroListTags}>
                            {item.tags.slice(0, 2).map((tag) => (
                              <View key={tag} style={[styles.macroListTagChip, { backgroundColor: isDarkMode ? '#243454' : '#e0ecfa' }]}>
                                <Text style={[styles.macroListTagText, { color: themeColors.brandForeground1 }]}>{tag}</Text>
                              </View>
                            ))}
                          </View>
                        </View>
                        <Ionicons name="chevron-forward" size={18} color={themeColors.neutralForeground3} />
                      </Pressable>
                    ))
                  )}
                </ScrollView>
              </View>
            )}
          </View>
        )}
      </Animated.View>
    );
  };

  // Render Web platform visualization
  const renderWebRadarMap = () => {
    const radiusPx = radius * radarScale;
    return (
      <View style={[styles.mapContainer, { backgroundColor: isDarkMode ? '#0d1117' : '#f0f4f8' }]}>
        
        {/* Floating Distance Tooltip */}
        <View style={[styles.floatingBox, { backgroundColor: themeColors.brandBackground, opacity: isDragging ? 0.95 : 0.85 }]}>
          <Text style={styles.floatingBoxText}>
            {radius.toFixed(1)} km Radius • {filteredCommunities.length} {filteredCommunities.length === 1 ? 'community' : 'communities'} in range
          </Text>
        </View>

        {/* Interactive Radar Screen */}
        <Pressable
          style={styles.radarLayout}
          onPress={() => {
            if (selectedCommunity) {
              setSelectedCommunity(null);
            }
          }}
        >
          <Text style={[styles.radarTitle, Typography.captionStrong, { color: themeColors.neutralForeground1 }]}>
            DISCOVER RADAR SCANNER
          </Text>
          <Text style={[Typography.caption, { color: themeColors.neutralForeground3, textAlign: 'center', marginBottom: Spacing.s }]}>
            Drag the handle to adjust search range. Rings filter communities.
          </Text>

          <View
            style={[
              styles.radarScreen,
              {
                borderColor: isDarkMode ? '#1f2937' : '#d2d6dc',
                backgroundColor: isDarkMode ? '#161b22' : '#ffffff',
              },
            ]}
          >
            {/* Concentric grid lines background */}
            <View style={[styles.radarGridRing, { width: 50, height: 50, borderRadius: 25, borderColor: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }]} />
            <View style={[styles.radarGridRing, { width: 100, height: 100, borderRadius: 50, borderColor: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }]} />
            <View style={[styles.radarGridRing, { width: 200, height: 200, borderRadius: 100, borderColor: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }]} />
            <View style={[styles.radarGridRing, { width: 300, height: 300, borderRadius: 150, borderColor: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }]} />

            {/* Sweep radar animation line simulation */}
            <View style={[styles.radarSweepLine, { borderColor: isDarkMode ? 'rgba(71, 158, 245, 0.08)' : 'rgba(15, 108, 189, 0.04)' }]} />

            {/* Active Range Circle Overlay */}
            <View
              style={[
                styles.radarRangeCircle,
                {
                  width: radiusPx * 2,
                  height: radiusPx * 2,
                  borderRadius: radiusPx,
                  borderColor: themeColors.brandForeground1,
                  backgroundColor: isDarkMode ? 'rgba(71, 158, 245, 0.05)' : 'rgba(15, 108, 189, 0.03)',
                },
              ]}
            />

            {/* Concentric rings drawn when released */}
            {!isDragging && (
              <>
                <View
                  style={[
                    styles.radarRangeCircle,
                    {
                      width: radiusPx * 2 * 0.75,
                      height: radiusPx * 2 * 0.75,
                      borderRadius: radiusPx * 0.75,
                      borderColor: isDarkMode ? 'rgba(71,158,245,0.18)' : 'rgba(15,108,189,0.18)',
                      borderStyle: 'dashed',
                    },
                  ]}
                />
                <View
                  style={[
                    styles.radarRangeCircle,
                    {
                      width: radiusPx * 2 * 0.5,
                      height: radiusPx * 2 * 0.5,
                      borderRadius: radiusPx * 0.5,
                      borderColor: isDarkMode ? 'rgba(71,158,245,0.18)' : 'rgba(15,108,189,0.18)',
                      borderStyle: 'dashed',
                    },
                  ]}
                />
                <View
                  style={[
                    styles.radarRangeCircle,
                    {
                      width: radiusPx * 2 * 0.25,
                      height: radiusPx * 2 * 0.25,
                      borderRadius: radiusPx * 0.25,
                      borderColor: isDarkMode ? 'rgba(71,158,245,0.18)' : 'rgba(15,108,189,0.18)',
                      borderStyle: 'dashed',
                    },
                  ]}
                />
              </>
            )}

            {/* Draggable Circle Edge Handle */}
            <View
              {...webPanResponder.panHandlers}
              style={[
                styles.radarDragHandle,
                {
                  left: webCenter + radiusPx - 14,
                  top: webCenter - 14,
                  backgroundColor: themeColors.brandForeground1,
                  shadowColor: '#000',
                },
              ]}
            >
              <Ionicons name="resize-outline" size={14} color="#ffffff" />
            </View>

            {/* User Center Pulsing Dot */}
            <View style={[styles.radarUserDot, { backgroundColor: themeColors.brandForeground1 }]}>
              <Animated.View
                style={[
                  styles.radarUserPulse,
                  {
                    backgroundColor: themeColors.brandForeground1,
                    transform: [{ scale: pulseScale }],
                    opacity: pulseOpacity,
                  },
                ]}
              />
            </View>

            {/* Filtered Communities Markers */}
            {filteredCommunities.map((c) => {
              const scaleDegree = 820; 
              const markerX = webCenter + c.lngOffset * scaleDegree;
              const markerY = webCenter - c.latOffset * scaleDegree;

              return (
                <Pressable
                  key={c.id}
                  onPress={(e) => {
                    e.stopPropagation();
                    openDrawer(c);
                  }}
                  style={[styles.radarMarker, { left: markerX - 16, top: markerY - 24 }]}
                >
                  <View style={[styles.markerBubble, { backgroundColor: themeColors.neutralBackground1, borderColor: themeColors.brandForeground1 }]}>
                    <Image source={{ uri: c.imageUri }} style={styles.markerImage as ImageStyle} />
                  </View>
                  <View style={[styles.markerLabelContainer, { backgroundColor: isDarkMode ? '#1e1e1e' : '#ffffff' }]}>
                    <Text style={[styles.markerLabel, { color: themeColors.neutralForeground1 }]} numberOfLines={1}>
                      {c.name.split(' ')[0]}
                    </Text>
                  </View>
                </Pressable>
              );
            })}
          </View>
        </Pressable>

        {/* Expandable Bottom Drawer */}
        {renderExpandableDrawer()}
      </View>
    );
  };

  // Render Native react-native-maps Layout
  const renderNativeMap = () => {
    const handleCoordinate = getEdgeCoordinate(userLocation, radius);

    return (
      <View style={styles.mapContainer}>
        {/* Floating Distance Tooltip */}
        <View style={[styles.floatingBox, { backgroundColor: themeColors.brandBackground, opacity: isDragging ? 0.95 : 0.85, zIndex: 10 }]}>
          <Text style={styles.floatingBoxText}>
            {radius.toFixed(1)} km Radius • {filteredCommunities.length} {filteredCommunities.length === 1 ? 'community' : 'communities'} in range
          </Text>
        </View>

        <MapView
          ref={mapRef}
          style={styles.nativeMap}
          initialRegion={getRegionForRadius(userLocation, 5.0)}
          customMapStyle={isDarkMode ? darkMapStyle : lightMapStyle}
          showsUserLocation={false}
          onPress={(e: any) => {
            // Check if user clicked empty map background (not a marker)
            if (e.nativeEvent.action !== 'marker-press') {
              if (selectedCommunity) {
                setSelectedCommunity(null);
              }
            }
          }}
        >
          {/* User Location Pulsing Marker */}
          <Marker coordinate={userLocation} key="user-location-marker">
            <View style={[styles.radarUserDot, { backgroundColor: themeColors.brandForeground1 }]}>
              <Animated.View
                style={[
                  styles.radarUserPulse,
                  {
                    backgroundColor: themeColors.brandForeground1,
                    transform: [{ scale: pulseScale }],
                    opacity: pulseOpacity,
                  },
                ]}
              />
            </View>
          </Marker>

          {/* Active search radius Circle */}
          <Circle
            center={userLocation}
            radius={radius * 1000} // radius in meters
            strokeWidth={1.5}
            strokeColor={themeColors.brandForeground1}
            fillColor={isDarkMode ? 'rgba(71, 158, 245, 0.05)' : 'rgba(15, 108, 189, 0.03)'}
          />

          {/* Concentric rings drawn when not dragging */}
          {!isDragging && (
            <>
              <Circle
                center={userLocation}
                radius={radius * 1000 * 0.75}
                strokeWidth={1}
                strokeColor={isDarkMode ? 'rgba(71,158,245,0.18)' : 'rgba(15,108,189,0.18)'}
                lineDashPattern={[4, 4]}
              />
              <Circle
                center={userLocation}
                radius={radius * 1000 * 0.50}
                strokeWidth={1}
                strokeColor={isDarkMode ? 'rgba(71,158,245,0.18)' : 'rgba(15,108,189,0.18)'}
                lineDashPattern={[4, 4]}
              />
              <Circle
                center={userLocation}
                radius={radius * 1000 * 0.25}
                strokeWidth={1}
                strokeColor={isDarkMode ? 'rgba(71,158,245,0.18)' : 'rgba(15,108,189,0.18)'}
                lineDashPattern={[4, 4]}
              />
            </>
          )}

          {/* Draggable Circle Edge Handle Marker */}
          <Marker
            coordinate={handleCoordinate}
            draggable
            onDragStart={() => setIsDragging(true)}
            onDrag={(e: any) => {
              const dragCoords = e.nativeEvent.coordinate;
              const newRadius = getDistanceInKm(
                userLocation.latitude,
                userLocation.longitude,
                dragCoords.latitude,
                dragCoords.longitude
              );
              const boundedRadius = Math.min(maxRadiusKm, Math.max(1.0, newRadius));
              setRadius(boundedRadius);
              
              if (mapRef.current) {
                const nextRegion = getRegionForRadius(userLocation, boundedRadius);
                mapRef.current.animateToRegion(nextRegion, 120);
              }
            }}
            onDragEnd={(e: any) => {
              setIsDragging(false);
              const dragCoords = e.nativeEvent.coordinate;
              const newRadius = getDistanceInKm(
                userLocation.latitude,
                userLocation.longitude,
                dragCoords.latitude,
                dragCoords.longitude
              );
              const boundedRadius = Math.min(maxRadiusKm, Math.max(1.0, newRadius));
              setRadius(boundedRadius);
              
              if (mapRef.current) {
                const nextRegion = getRegionForRadius(userLocation, boundedRadius);
                mapRef.current.animateToRegion(nextRegion, 120);
              }
            }}
            key="circle-drag-handle"
          >
            <View
              style={[
                styles.nativeDragHandle,
                {
                  backgroundColor: themeColors.brandForeground1,
                  borderColor: '#ffffff',
                },
              ]}
            >
              <Ionicons name="resize-outline" size={14} color="#ffffff" />
            </View>
          </Marker>

          {/* Filtered Community Markers */}
          {filteredCommunities.map((c) => (
            <Marker
              key={c.id}
              coordinate={{ latitude: c.latitude ?? 0, longitude: c.longitude ?? 0 }}
              onPress={(e: any) => {
                e.stopPropagation();
                openDrawer(c);
              }}
            >
              <View style={styles.nativeMarkerContainer}>
                <View style={[styles.markerBubble, { backgroundColor: themeColors.neutralBackground1, borderColor: themeColors.brandForeground1 }]}>
                  <Image source={{ uri: c.imageUri }} style={styles.markerImage as ImageStyle} />
                </View>
                <View style={[styles.markerLabelContainer, { backgroundColor: isDarkMode ? '#1e1e1e' : '#ffffff' }]}>
                  <Text style={[styles.markerLabel, { color: themeColors.neutralForeground1 }]} numberOfLines={1}>
                    {c.name.split(' ')[0]}
                  </Text>
                </View>
              </View>
            </Marker>
          ))}
        </MapView>

        {/* Expandable Bottom Drawer */}
        {renderExpandableDrawer()}
      </View>
    );
  };

  // Render check
  if (Platform.OS === 'web' || !MapView) {
    return renderWebRadarMap();
  } else {
    return renderNativeMap();
  }
};

// Styling definitions
const styles = StyleSheet.create({
  mapContainer: {
    flex: 1,
    position: 'relative',
    overflow: 'hidden',
  },
  nativeMap: {
    width: '100%',
    height: '100%',
  },
  floatingBox: {
    position: 'absolute',
    top: Spacing.s,
    alignSelf: 'center',
    paddingHorizontal: Spacing.m,
    paddingVertical: Spacing.xs,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  floatingBoxText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: 'bold',
  },
  bottomDrawer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderWidth: 1,
    borderBottomWidth: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 10,
    zIndex: 100,
  },
  drawerDragHandleContainer: {
    width: '100%',
    alignItems: 'center',
    paddingVertical: Spacing.s,
  },
  drawerCloseLine: {
    width: 44,
    height: 5,
    borderRadius: 2.5,
  },
  drawerScrollView: {
    flex: 1,
  },
  drawerScrollContent: {
    paddingHorizontal: Spacing.m,
    paddingBottom: 90, // room for bottom button row
  },
  drawerHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.xxs,
  },
  drawerImage: {
    width: 60,
    height: 60,
    borderRadius: 10,
  },
  drawerHeaderDetails: {
    flex: 1,
    marginLeft: Spacing.s,
  },
  drawerTitle: {
    fontSize: 16,
    fontWeight: '700',
    lineHeight: 20,
  },
  drawerTagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
    marginVertical: Spacing.m,
  },
  drawerTagChip: {
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  drawerTagText: {
    fontSize: 10,
    fontWeight: '700',
  },
  drawerDescription: {
    fontSize: 13,
    lineHeight: 18,
    marginVertical: Spacing.xxs,
  },
  expandedAboutSection: {
    marginTop: Spacing.xs,
  },
  dividerLineItem: {
    height: 1,
    marginVertical: Spacing.m,
  },
  infoSection: {
    marginBottom: Spacing.m,
  },
  customBadge: {
    alignSelf: 'flex-start',
    borderRadius: Shapes.rounded,
    paddingHorizontal: Spacing.s,
    paddingVertical: Spacing.xxs,
  },
  customBadgeText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: 'bold',
  },
  drawerButtonRow: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    padding: Spacing.m,
    gap: Spacing.s,
    borderTopWidth: 1,
  },
  drawerCancelButton: {
    flex: 1,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  drawerJoinButton: {
    flex: 2,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  drawerJoinButtonText: {
    color: '#ffffff',
    fontWeight: 'bold',
  },
  nativeMarkerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  nativeDragHandle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
    elevation: 5,
  },
  radarLayout: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.l,
  },
  radarTitle: {
    fontSize: 14,
    letterSpacing: 1.5,
    marginBottom: Spacing.xxs,
  },
  radarScreen: {
    width: 350,
    height: 350,
    borderRadius: 175,
    borderWidth: 2,
    position: 'relative',
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  radarGridRing: {
    position: 'absolute',
    borderWidth: 1.2,
    borderStyle: 'dashed',
  },
  radarSweepLine: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    borderRadius: 175,
    borderWidth: 4,
  },
  radarRangeCircle: {
    position: 'absolute',
    borderWidth: 1.5,
  },
  radarDragHandle: {
    position: 'absolute',
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
    zIndex: 20,
  },
  radarUserDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radarUserPulse: {
    width: 32,
    height: 32,
    borderRadius: 16,
    position: 'absolute',
  },
  radarMarker: {
    position: 'absolute',
    alignItems: 'center',
  },
  markerBubble: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 3,
  },
  markerImage: {
    width: '100%',
    height: '100%',
  },
  markerLabelContainer: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 6,
    marginTop: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    elevation: 1,
  },
  markerLabel: {
    fontSize: 9,
    fontWeight: 'bold',
  },
  macroCollapsedHandleContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 40,
    paddingHorizontal: Spacing.m,
  },
  macroExpandedTitle: {
    ...Typography.subtitle,
    fontSize: 16,
    paddingHorizontal: Spacing.m,
    paddingBottom: Spacing.s,
    fontWeight: 'bold',
  },
  macroListScrollContent: {
    paddingHorizontal: Spacing.m,
    paddingBottom: 40,
  },
  emptyListContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xxl,
  },
  macroListItemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.s,
    borderRadius: Shapes.rounded,
    borderWidth: 1,
    marginBottom: Spacing.s,
  },
  macroListImage: {
    width: 50,
    height: 50,
    borderRadius: 8,
  },
  macroListDetails: {
    flex: 1,
    marginLeft: Spacing.s,
    marginRight: Spacing.xs,
  },
  macroListTitle: {
    ...Typography.bodyStrong,
    fontSize: 14,
  },
  macroListTags: {
    flexDirection: 'row',
    gap: 4,
    marginTop: 4,
  },
  macroListTagChip: {
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 1,
  },
  macroListTagText: {
    fontSize: 8.5,
    fontWeight: 'bold',
  },
});

// Premium, low-friction light theme map style with muted desaturated tones and hidden default POIs
const lightMapStyle = [
  {
    featureType: 'poi',
    elementType: 'all',
    stylers: [{ visibility: 'off' }],
  },
  {
    featureType: 'poi.business',
    elementType: 'all',
    stylers: [{ visibility: 'off' }],
  },
  {
    featureType: 'poi.medical',
    elementType: 'all',
    stylers: [{ visibility: 'off' }],
  },
  {
    featureType: 'poi.government',
    elementType: 'all',
    stylers: [{ visibility: 'off' }],
  },
  {
    featureType: 'poi.place_of_worship',
    elementType: 'all',
    stylers: [{ visibility: 'off' }],
  },
  {
    featureType: 'transit.station',
    elementType: 'all',
    stylers: [{ visibility: 'off' }],
  },
  {
    featureType: 'administrative.neighborhood',
    elementType: 'labels',
    stylers: [{ visibility: 'off' }],
  },
  {
    featureType: 'administrative.land_parcel',
    elementType: 'labels',
    stylers: [{ visibility: 'off' }],
  },
  {
    featureType: 'landscape',
    elementType: 'geometry',
    stylers: [{ color: '#f5f5f5' }],
  },
  {
    featureType: 'water',
    elementType: 'geometry',
    stylers: [{ color: '#cbdff7' }],
  },
  {
    featureType: 'poi.park',
    elementType: 'geometry',
    stylers: [{ color: '#e2eedd' }, { visibility: 'on' }],
  },
  {
    featureType: 'road',
    elementType: 'geometry',
    stylers: [{ color: '#ffffff' }],
  },
  {
    featureType: 'road',
    elementType: 'geometry.stroke',
    stylers: [{ color: '#e0e0e0' }],
  },
  {
    featureType: 'road.highway',
    elementType: 'geometry',
    stylers: [{ color: '#fcdcb6' }],
  },
  {
    featureType: 'road.highway',
    elementType: 'geometry.stroke',
    stylers: [{ color: '#f8c58c' }],
  },
  {
    featureType: 'road.local',
    elementType: 'geometry.stroke',
    stylers: [{ color: '#f0f0f0' }],
  },
  {
    featureType: 'road.local',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#9e9e9e' }],
  },
];

// Premium, low-friction dark theme map style with muted desaturated tones and hidden default POIs
const darkMapStyle = [
  {
    featureType: 'all',
    elementType: 'labels.text.stroke',
    stylers: [{ visibility: 'off' }],
  },
  {
    featureType: 'poi',
    elementType: 'all',
    stylers: [{ visibility: 'off' }],
  },
  {
    featureType: 'poi.business',
    elementType: 'all',
    stylers: [{ visibility: 'off' }],
  },
  {
    featureType: 'poi.medical',
    elementType: 'all',
    stylers: [{ visibility: 'off' }],
  },
  {
    featureType: 'poi.government',
    elementType: 'all',
    stylers: [{ visibility: 'off' }],
  },
  {
    featureType: 'poi.place_of_worship',
    elementType: 'all',
    stylers: [{ visibility: 'off' }],
  },
  {
    featureType: 'transit.station',
    elementType: 'all',
    stylers: [{ visibility: 'off' }],
  },
  {
    featureType: 'administrative.neighborhood',
    elementType: 'labels',
    stylers: [{ visibility: 'off' }],
  },
  {
    featureType: 'administrative.land_parcel',
    elementType: 'labels',
    stylers: [{ visibility: 'off' }],
  },
  {
    featureType: 'landscape',
    elementType: 'geometry',
    stylers: [{ color: '#1f1f1f' }],
  },
  {
    featureType: 'water',
    elementType: 'geometry',
    stylers: [{ color: '#0f1c2e' }],
  },
  {
    featureType: 'poi.park',
    elementType: 'geometry',
    stylers: [{ color: '#15241b' }, { visibility: 'on' }],
  },
  {
    featureType: 'road',
    elementType: 'geometry',
    stylers: [{ color: '#2c2c2c' }],
  },
  {
    featureType: 'road',
    elementType: 'geometry.stroke',
    stylers: [{ color: '#242424' }],
  },
  {
    featureType: 'road.highway',
    elementType: 'geometry',
    stylers: [{ color: '#3f301b' }],
  },
  {
    featureType: 'road.highway',
    elementType: 'geometry.stroke',
    stylers: [{ color: '#332615' }],
  },
  {
    featureType: 'road.local',
    elementType: 'geometry.stroke',
    stylers: [{ color: '#282828' }],
  },
  {
    featureType: 'road.local',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#5c5c5c' }],
  },
];
