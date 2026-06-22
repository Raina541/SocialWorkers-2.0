import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  Pressable,
  Dimensions,
  Image,
  Animated,
  PanResponder,
  Platform,
  Switch,
  ImageStyle,
} from 'react-native';
import { Colors, Spacing, Typography, Shapes } from '../constants/Theme';
import { Ionicons } from '@expo/vector-icons';
import { Avatar } from '../components/Avatar';
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
  // Web Fallback will be used
}

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
const drawerHeight = screenHeight - 110;
const EARTH_RADIUS_KM = 6371;
const MAGENTA_RED = '#d8246c';
const maxRadiusKm = 25;

interface GeoCoords {
  latitude: number;
  longitude: number;
}

interface VolunteerItem {
  id: string;
  name: string;
  avatarUri: string;
  cause: string;
  latOffset: number;
  lngOffset: number;
  distance?: number;
  latitude?: number;
  longitude?: number;
  bio?: string;
  skills: string[];
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
  description: string;
  latOffset: number;
  lngOffset: number;
  distance?: number;
  latitude?: number;
  longitude?: number;
  cause: string;
  joined: boolean;
}

// Distance helper
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

// Edge coordinate calculator
const getEdgeCoordinate = (center: GeoCoords, radiusKm: number): GeoCoords => {
  const latRad = (center.latitude * Math.PI) / 180;
  const lngOffset = radiusKm / (111.32 * Math.cos(latRad));
  return {
    latitude: center.latitude,
    longitude: center.longitude + lngOffset,
  };
};

const getRegionForRadius = (center: GeoCoords, radiusKm: number) => {
  const latRad = (center.latitude * Math.PI) / 180;
  const padding = 1.35;
  const latDelta = (2 * radiusKm / 111.32) * padding;
  const lngDelta = (2 * radiusKm / (111.32 * Math.cos(latRad))) * padding;
  return {
    latitude: center.latitude,
    longitude: center.longitude,
    latitudeDelta: Math.max(0.005, latDelta),
    longitudeDelta: Math.max(0.005, lngDelta),
  };
};

export const SandboxCommunityView: React.FC<{ isDarkMode?: boolean }> = ({ isDarkMode = false }) => {
  const themeColors = isDarkMode ? Colors.dark : Colors.light;

  // VIEW MODE: 'dashboard' | 'search' | 'map'
  const [viewMode, setViewMode] = useState<'dashboard' | 'search' | 'map'>('dashboard');

  // Search overlay states
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [searchResultType, setSearchResultType] = useState<'all' | 'causes' | 'volunteers' | 'communities'>('all');
  const [selectedCauses, setSelectedCauses] = useState<string[]>([]);

  // Map state
  const mapRef = useRef<any>(null);
  const [userLocation, setUserLocation] = useState<GeoCoords>({ latitude: 37.7749, longitude: -122.4194 });
  const [radius, setRadius] = useState<number>(5.0);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [selectedMapEntity, setSelectedMapEntity] = useState<any | null>(null);
  const [entityType, setEntityType] = useState<'volunteers' | 'communities'>('communities');
  const [activeCauseFilter, setActiveCauseFilter] = useState<string>('All');
  
  // Track Map Zoom Level for clustering
  const [currentZoomRegion, setCurrentZoomRegion] = useState({
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
  });

  // Create group / anti-duplication engine states
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [newGroupTitle, setNewGroupTitle] = useState('');
  const [newGroupDesc, setNewGroupDesc] = useState('');
  const [newGroupCategory, setNewGroupCategory] = useState('Education');
  const [showDuplicationAlert, setShowDuplicationAlert] = useState(false);
  const [matchedDuplicateItem, setMatchedDuplicateItem] = useState<any | null>(null);

  // Bottom drawer state
  const [drawerState, setDrawerState] = useState<'closed' | 'collapsed' | 'expanded'>('collapsed');
  const drawerY = useRef(new Animated.Value(drawerHeight - 70)).current;
  const startY = useRef(drawerHeight - 70);

  // Pulsing dot
  const pulseAnim = useRef(new Animated.Value(0)).current;

  const pulseScale = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.6, 2.5],
  });

  const pulseOpacity = pulseAnim.interpolate({
    inputRange: [0, 0.75, 1],
    outputRange: [0.5, 0.2, 0],
  });

  // Databases
  const [communities, setCommunities] = useState<CommunityItem[]>([
    {
      id: 'sc1',
      name: 'Child Welfare Services Taskforce',
      members: 86,
      activeMembers: 12,
      lastMessage: 'Aman: Let me know if there are active cases in the North sector.',
      time: '9:02 AM',
      unreadCount: 4,
      isPinned: true,
      isMuted: false,
      imageUri: 'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?w=150',
      tags: ['Child Welfare', 'Education'],
      description: 'Dedicated to child rights and caseworker assistance. We share local relief campaigns and support emergency families.',
      latOffset: 0.003,
      lngOffset: 0.003, // Distance ~0.5 km (very close - dense)
      cause: 'Education',
      joined: true,
    },
    {
      id: 'sc2',
      name: 'Mental Health Support Group',
      members: 54,
      activeMembers: 5,
      lastMessage: 'Bob: Shared resources for rehabilitation clinics.',
      time: 'Yesterday',
      unreadCount: 0,
      isPinned: false,
      isMuted: false,
      imageUri: 'https://images.unsplash.com/photo-1518495973542-4542c06a5843?w=150',
      tags: ['Mental Health', 'Support'],
      description: 'Support network sharing counseling referrals, clinical helpline directories, and local rehabilitation services.',
      latOffset: 0.005,
      lngOffset: -0.004, // Distance ~0.7 km (very close - dense)
      cause: 'Mental Health',
      joined: true,
    },
    {
      id: 'sc3',
      name: 'Housing & Emergency Relocations',
      members: 110,
      activeMembers: 18,
      lastMessage: 'Diana: Hotel vouchers have been updated in the room status list.',
      time: '2 days ago',
      unreadCount: 0,
      isPinned: false,
      isMuted: true,
      imageUri: 'https://images.unsplash.com/photo-1513584684374-8bab748fbf90?w=150',
      tags: ['Housing', 'Emergency Relief'],
      description: 'Volunteers and case managers coordinating transitional shelter spaces and direct relocations for families.',
      latOffset: -0.025,
      lngOffset: -0.025, // Distance ~3.9 km
      cause: 'Housing',
      joined: true,
    },
    {
      id: 'sc4',
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
      description: 'Coordinate climate strikes, local tree planting drives, recycling programs, and green policy advocacy.',
      latOffset: 0.012,
      lngOffset: 0.012, // Distance ~1.9 km
      cause: 'Climate',
      joined: false,
    },
    {
      id: 'sc5',
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
      description: 'Providing meal deliveries, companion visits, medication pickup runs, and support circles for elderly community members.',
      latOffset: -0.04,
      lngOffset: -0.04, // Distance ~6.2 km (sparse area)
      cause: 'Elderly Care',
      joined: false,
    },
    {
      id: 'sc6',
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
      description: 'Tutor underprivileged public school children, host local weekend book reading events, and establish mini libraries.',
      latOffset: 0.045,
      lngOffset: -0.045, // Distance ~7.1 km
      cause: 'Education',
      joined: false,
    },
  ]);

  const [volunteers, setVolunteers] = useState<VolunteerItem[]>([
    {
      id: 'v1',
      name: 'Sarah Jenkins',
      avatarUri: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
      cause: 'Education',
      latOffset: 0.003,
      lngOffset: 0.003, // Overlaps with sc1 for collision clustering!
      bio: 'High school teacher interested in digital literacy programs.',
      skills: ['Teaching', 'Mentorship'],
    },
    {
      id: 'v2',
      name: 'Michael Chang',
      avatarUri: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
      cause: 'Climate',
      latOffset: 0.0035,
      lngOffset: 0.0035, // Overlaps closely with v1 and sc1!
      bio: 'Environmental enthusiast looking to organize green projects.',
      skills: ['Ecology', 'Logistics'],
    },
    {
      id: 'v3',
      name: 'Emma Rodriguez',
      avatarUri: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150',
      cause: 'Mental Health',
      latOffset: 0.0055,
      lngOffset: -0.0045, // Overlaps with sc2!
      bio: 'Psychology student passionate about community counseling helpline support.',
      skills: ['Counseling', 'First Aid'],
    },
    {
      id: 'v4',
      name: 'David Kim',
      avatarUri: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=150',
      cause: 'Disaster Relief',
      latOffset: 0.09,
      lngOffset: -0.09, // Distance ~14.1 km (sparse area)
      bio: 'Emergency response veteran offering logistical support.',
      skills: ['Disaster Response', 'Driving'],
    },
    {
      id: 'v5',
      name: 'Clara Oswald',
      avatarUri: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150',
      cause: 'Elderly Care',
      latOffset: 0.088,
      lngOffset: -0.088, // Overlaps closely with v4!
      bio: 'Caretaker looking to support local elderly citizens with errands.',
      skills: ['Elderly Care', 'Nursing'],
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

  // Map center logic
  useEffect(() => {
    if (mapRef.current && userLocation && viewMode === 'map') {
      const region = getRegionForRadius(userLocation, radius);
      mapRef.current.animateToRegion(region, 1000);
    }
  }, [userLocation, viewMode]);

  // Center on map and set zoom level based on density on load
  const enterMapView = () => {
    setViewMode('map');
    
    // Check local density: count communities within 3km range
    const closeItems = mappedCommunities.filter(c => (c.distance ?? 0) <= 3.0);
    const initialRadius = closeItems.length >= 3 ? 3.0 : 8.0; // tight zoom for high density, further zoom for sparse
    setRadius(initialRadius);

    setTimeout(() => {
      if (mapRef.current) {
        const region = getRegionForRadius(userLocation, initialRadius);
        mapRef.current.animateToRegion(region, 800);
      }
    }, 200);
  };

  // Pulsing loop
  useEffect(() => {
    if (viewMode === 'map') {
      const pulseLoop = () => {
        pulseAnim.setValue(0);
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 2500,
          useNativeDriver: true,
        }).start(() => pulseLoop());
      };
      pulseLoop();
    }
  }, [pulseAnim, viewMode]);

  // Drawer slider control
  useEffect(() => {
    animateDrawer('collapsed');
  }, [selectedMapEntity]);

  const animateDrawer = (state: 'closed' | 'collapsed' | 'expanded') => {
    setDrawerState(state);
    let toValue = drawerHeight; // default closed
    if (state === 'collapsed') {
      toValue = selectedMapEntity ? (drawerHeight - 260) : (drawerHeight - 70);
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

  // Drawer PanResponder gesture hooks
  const drawerPanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dy) > 5;
      },
      onPanResponderGrant: () => {
        let currentPos = drawerHeight;
        if (drawerState === 'collapsed') {
          currentPos = selectedMapEntity ? (drawerHeight - 260) : (drawerHeight - 70);
        } else if (drawerState === 'expanded') {
          currentPos = 0;
        }
        startY.current = currentPos;
      },
      onPanResponderMove: (_, gestureState) => {
        const nextY = startY.current + gestureState.dy;
        if (nextY >= 0) {
          drawerY.setValue(nextY);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        const finalY = startY.current + gestureState.dy;
        const thresholdCollapsed = selectedMapEntity ? (drawerHeight - 260) : (drawerHeight - 70);

        let targetState: 'closed' | 'collapsed' | 'expanded' = 'collapsed';

        if (gestureState.vy < -0.5) {
          targetState = 'expanded';
        } else if (gestureState.vy > 0.5) {
          if (selectedMapEntity && startY.current === (drawerHeight - 260)) {
            setSelectedMapEntity(null);
            targetState = 'collapsed';
          } else {
            targetState = 'collapsed';
          }
        } else {
          const distCollapsed = Math.abs(finalY - thresholdCollapsed);
          const distExpanded = Math.abs(finalY - 0);

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

  // Compute geofenced datasets
  const mappedCommunities = communities.map((c) => {
    const lat = userLocation.latitude + c.latOffset;
    const lng = userLocation.longitude + c.lngOffset;
    const dist = getDistanceInKm(userLocation.latitude, userLocation.longitude, lat, lng);
    return { ...c, latitude: lat, longitude: lng, distance: dist };
  });

  const mappedVolunteers = volunteers.map((v) => {
    const lat = userLocation.latitude + v.latOffset;
    const lng = userLocation.longitude + v.lngOffset;
    const dist = getDistanceInKm(userLocation.latitude, userLocation.longitude, lat, lng);
    return { ...v, latitude: lat, longitude: lng, distance: dist };
  });

  // Filter lists based on ACTIVE concentric search circle
  const activeCommunitiesList = mappedCommunities.filter(c => (c.distance ?? 0) <= radius);
  const activeVolunteersList = mappedVolunteers.filter(v => (v.distance ?? 0) <= radius);

  // Filter based on selected cause filters
  const getFilteredMapItems = () => {
    const baseList = entityType === 'communities' ? activeCommunitiesList : activeVolunteersList;
    if (activeCauseFilter === 'All') return baseList;
    return baseList.filter(item => item.cause === activeCauseFilter);
  };

  // Collision Clustering Algorithm based on coordinates
  // Returns either single pins or cluster badges
  const getClusteredMapItems = () => {
    const items = getFilteredMapItems();
    const threshold = currentZoomRegion.latitudeDelta * 0.14; // distance threshold adapts to camera zoom
    const clusters: any[] = [];

    items.forEach((item) => {
      let merged = false;
      const lat = item.latitude ?? 0;
      const lng = item.longitude ?? 0;

      for (let i = 0; i < clusters.length; i++) {
        const cluster = clusters[i];
        const distLat = Math.abs(cluster.latitude - lat);
        const distLng = Math.abs(cluster.longitude - lng);

        if (distLat < threshold && distLng < threshold) {
          cluster.items.push(item);
          // Set center to cluster average coordinate
          cluster.latitude = (cluster.latitude * (cluster.items.length - 1) + lat) / cluster.items.length;
          cluster.longitude = (cluster.longitude * (cluster.items.length - 1) + lng) / cluster.items.length;
          merged = true;
          break;
        }
      }

      if (!merged) {
        clusters.push({
          id: `cluster_${item.id}`,
          latitude: lat,
          longitude: lng,
          items: [item],
        });
      }
    });

    return clusters;
  };

  // Filter-Driven Camera Scaling when clicking filter pill
  const handleSelectCauseFilter = (cause: string) => {
    setActiveCauseFilter(cause);
    
    // Calculate how many pins match this filter in our current range
    const matches = (entityType === 'communities' ? activeCommunitiesList : activeVolunteersList)
      .filter(item => cause === 'All' || item.cause === cause);

    // If matches drop to zero inside active radius, expand camera zoom until we capture 2-3 matching pins
    if (matches.length === 0 && cause !== 'All') {
      const globalMatches = (entityType === 'communities' ? mappedCommunities : mappedVolunteers)
        .filter(item => item.cause === cause)
        .sort((a, b) => (a.distance ?? 0) - (b.distance ?? 0)); // sort by distance

      if (globalMatches.length > 0) {
        // Capture up to 3 pins, check distance of the 3rd or the furthest matching
        const targetIndex = Math.min(globalMatches.length - 1, 2);
        const targetDistance = globalMatches[targetIndex].distance ?? 5.0;
        
        // Clamp expanded search radius up to a strict geographical maximum
        const boundedRadius = Math.min(maxRadiusKm, Math.ceil(targetDistance));
        setRadius(boundedRadius);

        // Animate camera to new region
        if (mapRef.current) {
          const nextRegion = getRegionForRadius(userLocation, boundedRadius);
          mapRef.current.animateToRegion(nextRegion, 800);
        }
      }
    }
  };

  // Determine if a cause filter pill should be hidden because it returns zero matches across the entire extended ceiling
  const isCauseFilterHidden = (cause: string) => {
    if (cause === 'All') return false;
    const globalCount = (entityType === 'communities' ? mappedCommunities : mappedVolunteers)
      .filter(item => item.cause === cause && (item.distance ?? 0) <= maxRadiusKm).length;
    return globalCount === 0;
  };

  // Handle Create Group Input and Anti-Duplication warnings
  const handleGroupTitleChange = (text: string) => {
    setNewGroupTitle(text);
    checkDuplicateWarning(text, newGroupCategory);
  };

  const checkDuplicateWarning = (title: string, category: string) => {
    if (title.trim().length < 3) {
      setShowDuplicationAlert(false);
      setMatchedDuplicateItem(null);
      return;
    }

    // Match keywords like "Green", "Climate", "Mentors", "Literacy", "Homeless", "Care"
    const keywords = ['green', 'climate', 'mentor', 'literacy', 'homeless', 'care', 'welfare'];
    const matchedKeyword = keywords.find(word => title.toLowerCase().includes(word));

    if (matchedKeyword) {
      // Find similar community in database
      const match = communities.find(c => 
        c.cause.toLowerCase().includes(category.toLowerCase()) || 
        c.name.toLowerCase().includes(matchedKeyword)
      );

      if (match) {
        setMatchedDuplicateItem(match);
        setShowDuplicationAlert(true);
        return;
      }
    }
    
    setShowDuplicationAlert(false);
    setMatchedDuplicateItem(null);
  };

  // Web radar scroll control handle
  const webScale = 7.5;
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
        const calculatedRadius = distPx / webScale;
        setRadius(Math.min(maxRadiusKm, Math.max(1.0, calculatedRadius)));
      },
      onPanResponderRelease: () => {
        setIsDragging(false);
      },
    })
  ).current;

  const renderExpandableDrawer = () => {
    const isMicro = selectedMapEntity !== null;
    const collapsedVisibleHeight = isMicro ? 260 : 70;

    const translateY = drawerY.interpolate({
      inputRange: [0, drawerHeight - collapsedVisibleHeight, drawerHeight],
      outputRange: [0, drawerHeight - collapsedVisibleHeight, drawerHeight],
      extrapolate: 'clamp',
    });

    const itemsInRange = getFilteredMapItems();
    const selectedEntity = selectedMapEntity as any;

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

        {isMicro && selectedEntity ? (
          /* ================= MICRO VIEW (SINGLE ENTITY PEEK) ================= */
          <View style={{ flex: 1 }}>
            <ScrollView
              style={styles.drawerScrollView}
              contentContainerStyle={styles.drawerScrollContent}
              showsVerticalScrollIndicator={false}
              scrollEnabled={drawerState === 'expanded'}
            >
              {/* Summary Row */}
              <View style={styles.drawerHeaderRow}>
                {selectedEntity.imageUri ? (
                  <Image source={{ uri: selectedEntity.imageUri }} style={styles.drawerImage as ImageStyle} />
                ) : (
                  <Avatar size={60} name={selectedEntity.name} imageUri={selectedEntity.avatarUri} isDarkMode={isDarkMode} />
                )}
                <View style={styles.drawerHeaderDetails}>
                  <Text style={[styles.drawerTitle, { color: themeColors.neutralForeground1 }]}>
                    {selectedEntity.name}
                  </Text>
                  {selectedEntity.members !== undefined ? (
                    <Text style={[Typography.body, { color: themeColors.neutralForeground3, fontSize: 13, marginTop: 2 }]}>
                      {selectedEntity.members} members • {selectedEntity.activeMembers} online
                    </Text>
                  ) : (
                    <Text style={[Typography.body, { color: themeColors.neutralForeground3, fontSize: 13, marginTop: 2 }]}>
                      {selectedEntity.bio || "Active Volunteer"}
                    </Text>
                  )}
                  <Text style={[Typography.captionStrong, { color: themeColors.brandForeground1, marginTop: 4, fontSize: 12 }]}>
                    {(selectedEntity.distance ?? 0).toFixed(1)} km away
                  </Text>
                </View>
              </View>

              {/* Tags/Skills */}
              <View style={styles.drawerTagsRow}>
                {(selectedEntity.tags || selectedEntity.skills || []).map((tag: string) => (
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
                  {selectedEntity.description || selectedEntity.bio}
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
                      <Text style={styles.customBadgeText}>{selectedEntity.cause}</Text>
                    </View>
                  </View>

                  {/* Description / Bio */}
                  <View style={styles.infoSection}>
                    <Text style={[Typography.captionStrong, { color: themeColors.neutralForeground2, marginBottom: Spacing.xxs, fontSize: 11 }]}>
                      {selectedEntity.description ? 'COMMUNITY DESCRIPTION' : 'VOLUNTEER BIO'}
                    </Text>
                    <Text style={[Typography.body, { color: themeColors.neutralForeground1, lineHeight: 20 }]}>
                      {selectedEntity.description || selectedEntity.bio || "No description provided."}
                    </Text>
                  </View>

                  {/* Coordination / Professional Details */}
                  <View style={styles.infoSection}>
                    <Text style={[Typography.captionStrong, { color: themeColors.neutralForeground2, marginBottom: Spacing.xxs, fontSize: 11 }]}>
                      {selectedEntity.description ? 'COORDINATION RULES & GUIDELINES' : 'SKILLS & EXPERIENCE'}
                    </Text>
                    {selectedEntity.description ? (
                      <Text style={[Typography.caption, { color: themeColors.neutralForeground2, lineHeight: 18 }]}>
                        • Respect caseworker privacy: do not share sensitive personal info in discussions.{"\n"}
                        • Keep conversations focused on social service coordinate.{"\n"}
                        • Post a poll to gather availability before scheduling local events.
                      </Text>
                    ) : (
                      <Text style={[Typography.caption, { color: themeColors.neutralForeground2, lineHeight: 18 }]}>
                        • Certified in: {(selectedEntity.skills || []).join(', ')}.{"\n"}
                        • Committed to community safety and support.{"\n"}
                        • Available for local neighborhood outreach programs.
                      </Text>
                    )}
                  </View>
                </View>
              )}
            </ScrollView>

            {/* CTA button row (Sticky at the base) */}
            <View style={[styles.drawerButtonRow, { borderTopColor: themeColors.neutralStroke2, backgroundColor: themeColors.neutralBackground1 }]}>
              <Pressable
                onPress={() => setSelectedMapEntity(null)}
                style={[styles.drawerCancelButton, { borderColor: themeColors.neutralStroke1 }]}
              >
                <Text style={{ color: themeColors.neutralForeground1, fontWeight: '600' }}>Back</Text>
              </Pressable>
              {selectedEntity.joined !== undefined ? (
                <Pressable
                  onPress={() => {
                    const isJoined = selectedEntity.joined;
                    setCommunities(prev => prev.map(c => c.id === selectedEntity.id ? { ...c, joined: !isJoined } : c));
                    alert(isJoined ? `Successfully left ${selectedEntity.name}.` : `Successfully joined ${selectedEntity.name}!`);
                    setSelectedMapEntity(null);
                  }}
                  style={[styles.drawerJoinButton, { backgroundColor: themeColors.brandForeground1 }]}
                >
                  <Text style={styles.drawerJoinButtonText}>
                    {selectedEntity.joined ? 'Leave Community' : 'Join Community'}
                  </Text>
                </Pressable>
              ) : (
                <Pressable
                  onPress={() => {
                    alert(`Connection request sent to ${selectedEntity.name}!`);
                    setSelectedMapEntity(null);
                  }}
                  style={[styles.drawerJoinButton, { backgroundColor: themeColors.successForeground1 }]}
                >
                  <Text style={styles.drawerJoinButtonText}>Connect</Text>
                </Pressable>
              )}
            </View>
          </View>
        ) : (
          /* ================= MACRO VIEW (MULTI-ENTITIES LIST) ================= */
          <View style={{ flex: 1 }}>
            {drawerState === 'collapsed' ? (
              <Pressable onPress={() => animateDrawer('expanded')} style={styles.macroCollapsedHandleContent}>
                <Ionicons name="chevron-up" size={16} color={themeColors.neutralForeground3} style={{ marginRight: 6 }} />
                <Text style={[Typography.bodyStrong, { color: themeColors.neutralForeground2, fontSize: 13 }]}>
                  Swipe up to view {itemsInRange.length} {entityType === 'communities' ? 'communities' : 'volunteers'} in range
                </Text>
              </Pressable>
            ) : (
              <View style={{ flex: 1 }}>
                <Text style={[styles.macroExpandedTitle, { color: themeColors.neutralForeground1 }]}>
                  {entityType === 'communities' ? 'Communities in Range' : 'Volunteers in Range'} ({itemsInRange.length})
                </Text>
                
                <ScrollView
                  style={styles.drawerScrollView}
                  contentContainerStyle={styles.macroListScrollContent}
                  showsVerticalScrollIndicator={false}
                >
                  {itemsInRange.length === 0 ? (
                    <View style={styles.emptyListContainer}>
                      <Ionicons name="compass-outline" size={48} color={themeColors.neutralForegroundDisabled} />
                      <Text style={[Typography.body, { color: themeColors.neutralForeground3, marginTop: Spacing.s, textAlign: 'center', paddingHorizontal: Spacing.l }]}>
                        No {entityType} found in this range. Drag the handle or change filters to expand your search area.
                      </Text>
                    </View>
                  ) : (
                    itemsInRange.map((it) => {
                      const item = it as any;
                      return (
                        <Pressable
                          key={item.id}
                          onPress={() => setSelectedMapEntity(item)}
                          style={[
                            styles.macroListItemCard,
                            {
                              backgroundColor: themeColors.neutralBackground2,
                              borderColor: themeColors.neutralStroke1,
                            },
                          ]}
                        >
                          {item.imageUri ? (
                            <Image source={{ uri: item.imageUri }} style={styles.macroListImage as ImageStyle} />
                          ) : (
                            <Avatar size={50} name={item.name} imageUri={item.avatarUri} isDarkMode={isDarkMode} />
                          )}
                          <View style={styles.macroListDetails}>
                            <Text style={[styles.macroListTitle, { color: themeColors.neutralForeground1 }]} numberOfLines={1}>
                              {item.name}
                            </Text>
                            {item.members !== undefined ? (
                              <Text style={[Typography.caption, { color: themeColors.neutralForeground3, marginTop: 2 }]}>
                                {item.members} members • {(item.distance ?? 0).toFixed(1)} km away
                              </Text>
                            ) : (
                              <Text style={[Typography.caption, { color: themeColors.neutralForeground3, marginTop: 2 }]}>
                                {(item.distance ?? 0).toFixed(1)} km away • {item.cause}
                              </Text>
                            )}
                            <View style={styles.macroListTags}>
                              {(item.tags || item.skills || []).slice(0, 2).map((tag: string) => (
                                <View key={tag} style={[styles.macroListTagChip, { backgroundColor: isDarkMode ? '#243454' : '#e0ecfa' }]}>
                                  <Text style={[styles.macroListTagText, { color: themeColors.brandForeground1 }]}>{tag}</Text>
                                </View>
                              ))}
                            </View>
                          </View>
                          <Ionicons name="chevron-forward" size={18} color={themeColors.neutralForeground3} />
                        </Pressable>
                      );
                    })
                  )}
                </ScrollView>
              </View>
            )}
          </View>
        )}
      </Animated.View>
    );
  };

  const renderWebRadarMap = () => {
    const radiusPx = radius * webScale;
    const items = getClusteredMapItems();

    return (
      <View style={[styles.mapContainer, { backgroundColor: isDarkMode ? '#0d1117' : '#f0f4f8' }]}>
        
        {/* Floating Tooltip */}
        <View style={[styles.floatingBox, { backgroundColor: themeColors.brandBackground, opacity: isDragging ? 0.95 : 0.85 }]}>
          <Text style={styles.floatingBoxText}>
            {radius.toFixed(1)} km Radius • {getFilteredMapItems().length} {entityType} in range
          </Text>
        </View>

        {/* Back and search bar row */}
        <View style={styles.mapSearchHeader}>
          <Pressable onPress={() => setViewMode('dashboard')} style={[styles.backIconCircle, { backgroundColor: themeColors.neutralBackground1 }]}>
            <Ionicons name="arrow-back" size={20} color={themeColors.neutralForeground1} />
          </Pressable>
          <View style={[styles.mapSearchBarInput, { backgroundColor: themeColors.neutralBackground1, borderColor: themeColors.neutralStroke2 }]}>
            <Ionicons name="search" size={16} color={themeColors.neutralForeground3} style={{ marginRight: 6 }} />
            <Text style={{ color: themeColors.neutralForeground1, fontSize: 13 }}>
              Look up co-volunteers or communities
            </Text>
          </View>
        </View>

        {/* Horizontal Cause Filters Pills Scroll */}
        <View style={styles.causeFiltersRow}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: Spacing.xs }}>
            {['All', 'Education', 'Environment', 'Disaster Relief', 'Elderly Care', 'Housing', 'Mental Health', 'Climate'].map((cause) => {
              if (isCauseFilterHidden(cause)) return null;
              const isSelected = activeCauseFilter === cause;
              return (
                <Pressable
                  key={cause}
                  onPress={() => handleSelectCauseFilter(cause)}
                  style={[
                    styles.causeFilterPill,
                    {
                      backgroundColor: isSelected ? themeColors.brandForeground1 : themeColors.neutralBackground1,
                      borderColor: isSelected ? themeColors.brandForeground1 : themeColors.neutralStroke1,
                    },
                  ]}
                >
                  <Text style={[styles.causeFilterText, { color: isSelected ? '#ffffff' : themeColors.neutralForeground1, fontWeight: isSelected ? '600' : '400' }]}>
                    {cause}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        {/* Interactive Radar Visualizer */}
        <Pressable
          style={styles.radarLayout}
          onPress={() => {
            if (selectedMapEntity) setSelectedMapEntity(null);
          }}
        >
          <View
            style={[
              styles.radarScreen,
              {
                borderColor: isDarkMode ? '#1f2937' : '#d2d6dc',
                backgroundColor: isDarkMode ? '#161b22' : '#ffffff',
              },
            ]}
          >
            {/* Concentric helper rings background grid */}
            <View style={[styles.radarGridRing, { width: 50, height: 50, borderRadius: 25, borderColor: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }]} />
            <View style={[styles.radarGridRing, { width: 100, height: 100, borderRadius: 50, borderColor: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }]} />
            <View style={[styles.radarGridRing, { width: 200, height: 200, borderRadius: 100, borderColor: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }]} />
            <View style={[styles.radarGridRing, { width: 300, height: 300, borderRadius: 150, borderColor: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }]} />

            {/* Range overlay circle */}
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

            {/* Concentric rings released */}
            {!isDragging && (
              <>
                <View style={[styles.radarRangeCircle, { width: radiusPx * 2 * 0.75, height: radiusPx * 2 * 0.75, borderRadius: radiusPx * 0.75, borderColor: isDarkMode ? 'rgba(71,158,245,0.18)' : 'rgba(15,108,189,0.18)', borderStyle: 'dashed' }]} />
                <View style={[styles.radarRangeCircle, { width: radiusPx * 2 * 0.5, height: radiusPx * 2 * 0.5, borderRadius: radiusPx * 0.5, borderColor: isDarkMode ? 'rgba(71,158,245,0.18)' : 'rgba(15,108,189,0.18)', borderStyle: 'dashed' }]} />
                <View style={[styles.radarRangeCircle, { width: radiusPx * 2 * 0.25, height: radiusPx * 2 * 0.25, borderRadius: radiusPx * 0.25, borderColor: isDarkMode ? 'rgba(71,158,245,0.18)' : 'rgba(15,108,189,0.18)', borderStyle: 'dashed' }]} />
              </>
            )}

            {/* Draggable Circle Handle */}
            <View
              {...webPanResponder.panHandlers}
              style={[
                styles.radarDragHandle,
                {
                  left: webCenter + radiusPx - 14,
                  top: webCenter - 14,
                  backgroundColor: themeColors.brandForeground1,
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

            {/* Markers / Clusters rendering */}
            {items.map((cluster) => {
              const isCluster = cluster.items.length > 1;
              const repItem = cluster.items[0];
              const scaleDegree = 820;
              const markerX = webCenter + repItem.lngOffset * scaleDegree;
              const markerY = webCenter - repItem.latOffset * scaleDegree;

              if (isCluster) {
                return (
                  <Pressable
                    key={cluster.id}
                    onPress={(e) => {
                      e.stopPropagation();
                      // zoom camera 3x on web simulation
                      const newRadius = Math.max(1.0, radius / 2);
                      setRadius(newRadius);
                    }}
                    style={[styles.radarClusterBadge, { left: markerX - 16, top: markerY - 16, backgroundColor: themeColors.neutralForeground1 }]}
                  >
                    <Text style={[styles.radarClusterText, { color: themeColors.neutralBackground1 }]}>
                      +{cluster.items.length}
                    </Text>
                  </Pressable>
                );
              }

              const item = repItem;
              const isVolunteer = entityType === 'volunteers';
              const imageUri = isVolunteer ? item.avatarUri : item.imageUri;

              return (
                <Pressable
                  key={item.id}
                  onPress={(e) => {
                    e.stopPropagation();
                    setSelectedMapEntity(item);
                  }}
                  style={[styles.radarMarker, { left: markerX - 16, top: markerY - 24 }]}
                >
                  <View style={[styles.markerBubble, { backgroundColor: themeColors.neutralBackground1, borderColor: themeColors.brandForeground1 }]}>
                    <Image source={{ uri: imageUri }} style={styles.markerImage as ImageStyle} />
                  </View>
                  <View style={[styles.markerLabelContainer, { backgroundColor: isDarkMode ? '#1e1e1e' : '#ffffff' }]}>
                    <Text style={[styles.markerLabel, { color: themeColors.neutralForeground1 }]} numberOfLines={1}>
                      {item.name.split(' ')[0]}
                    </Text>
                  </View>
                </Pressable>
              );
            })}
          </View>
        </Pressable>

        {/* Entity Switcher FAB */}
        <Pressable
          onPress={() => {
            setSelectedMapEntity(null);
            setEntityType(entityType === 'communities' ? 'volunteers' : 'communities');
            setActiveCauseFilter('All');
          }}
          style={[styles.entitySwitchFab, { backgroundColor: themeColors.brandForeground1 }]}
        >
          <Ionicons name={entityType === 'communities' ? 'person-outline' : 'people-outline'} size={18} color="#ffffff" />
          <Text style={styles.entitySwitchFabText}>
            {entityType === 'communities' ? 'Switch to Volunteers' : 'Switch to Communities'}
          </Text>
        </Pressable>

        {/* Bottom Drawer */}
        {renderExpandableDrawer()}
      </View>
    );
  };

  const renderNativeMap = () => {
    const handleCoordinate = getEdgeCoordinate(userLocation, radius);
    const clusters = getClusteredMapItems();

    return (
      <View style={styles.mapContainer}>
        {/* Floating Tooltip */}
        <View style={[styles.floatingBox, { backgroundColor: themeColors.brandBackground, opacity: isDragging ? 0.95 : 0.85, zIndex: 10 }]}>
          <Text style={styles.floatingBoxText}>
            {radius.toFixed(1)} km Radius • {getFilteredMapItems().length} {entityType} in range
          </Text>
        </View>

        {/* Back and search bar row */}
        <View style={[styles.mapSearchHeader, { zIndex: 10 }]}>
          <Pressable onPress={() => setViewMode('dashboard')} style={[styles.backIconCircle, { backgroundColor: themeColors.neutralBackground1 }]}>
            <Ionicons name="arrow-back" size={20} color={themeColors.neutralForeground1} />
          </Pressable>
          <View style={[styles.mapSearchBarInput, { backgroundColor: themeColors.neutralBackground1, borderColor: themeColors.neutralStroke2 }]}>
            <Ionicons name="search" size={16} color={themeColors.neutralForeground3} style={{ marginRight: 6 }} />
            <Text style={{ color: themeColors.neutralForeground1, fontSize: 13 }}>
              Look up co-volunteers or communities
            </Text>
          </View>
        </View>

        {/* Horizontal Cause Filters */}
        <View style={[styles.causeFiltersRow, { zIndex: 10 }]}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: Spacing.xs }}>
            {['All', 'Education', 'Environment', 'Disaster Relief', 'Elderly Care', 'Housing', 'Mental Health', 'Climate'].map((cause) => {
              if (isCauseFilterHidden(cause)) return null;
              const isSelected = activeCauseFilter === cause;
              return (
                <Pressable
                  key={cause}
                  onPress={() => handleSelectCauseFilter(cause)}
                  style={[
                    styles.causeFilterPill,
                    {
                      backgroundColor: isSelected ? themeColors.brandForeground1 : themeColors.neutralBackground1,
                      borderColor: isSelected ? themeColors.brandForeground1 : themeColors.neutralStroke1,
                    },
                  ]}
                >
                  <Text style={[styles.causeFilterText, { color: isSelected ? '#ffffff' : themeColors.neutralForeground1, fontWeight: isSelected ? '600' : '400' }]}>
                    {cause}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        <MapView
          ref={mapRef}
          style={styles.nativeMap}
          initialRegion={getRegionForRadius(userLocation, 5.0)}
          customMapStyle={isDarkMode ? darkMapStyle : lightMapStyle}
          showsUserLocation={false}
          onRegionChangeComplete={(region: any) => {
            setCurrentZoomRegion(region);
          }}
          onPress={(e: any) => {
            if (e.nativeEvent.action !== 'marker-press') {
              if (selectedMapEntity) setSelectedMapEntity(null);
            }
          }}
        >
          {/* User Pulsing Marker */}
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

          {/* Search boundary Circle */}
          <Circle
            center={userLocation}
            radius={radius * 1000}
            strokeWidth={1.5}
            strokeColor={themeColors.brandForeground1}
            fillColor={isDarkMode ? 'rgba(71, 158, 245, 0.05)' : 'rgba(15, 108, 189, 0.03)'}
          />

          {/* Concentric rings */}
          {!isDragging && (
            <>
              <Circle center={userLocation} radius={radius * 1000 * 0.75} strokeWidth={1} strokeColor={isDarkMode ? 'rgba(71,158,245,0.18)' : 'rgba(15,108,189,0.18)'} lineDashPattern={[4, 4]} />
              <Circle center={userLocation} radius={radius * 1000 * 0.50} strokeWidth={1} strokeColor={isDarkMode ? 'rgba(71,158,245,0.18)' : 'rgba(15,108,189,0.18)'} lineDashPattern={[4, 4]} />
              <Circle center={userLocation} radius={radius * 1000 * 0.25} strokeWidth={1} strokeColor={isDarkMode ? 'rgba(71,158,245,0.18)' : 'rgba(15,108,189,0.18)'} lineDashPattern={[4, 4]} />
            </>
          )}

          {/* Draggable boundary resize handle */}
          <Marker
            coordinate={handleCoordinate}
            draggable
            onDragStart={() => setIsDragging(true)}
            onDrag={(e: any) => {
              const dragCoords = e.nativeEvent.coordinate;
              const newRadius = getDistanceInKm(userLocation.latitude, userLocation.longitude, dragCoords.latitude, dragCoords.longitude);
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
              const newRadius = getDistanceInKm(userLocation.latitude, userLocation.longitude, dragCoords.latitude, dragCoords.longitude);
              const boundedRadius = Math.min(maxRadiusKm, Math.max(1.0, newRadius));
              setRadius(boundedRadius);
              if (mapRef.current) {
                const nextRegion = getRegionForRadius(userLocation, boundedRadius);
                mapRef.current.animateToRegion(nextRegion, 120);
              }
            }}
            key="circle-drag-handle"
          >
            <View style={[styles.nativeDragHandle, { backgroundColor: themeColors.brandForeground1, borderColor: '#ffffff' }]}>
              <Ionicons name="resize-outline" size={14} color="#ffffff" />
            </View>
          </Marker>

          {/* Clusters and Markers */}
          {clusters.map((cluster) => {
            const isCluster = cluster.items.length > 1;
            const repItem = cluster.items[0];

            if (isCluster) {
              return (
                <Marker
                  key={cluster.id}
                  coordinate={{ latitude: cluster.latitude, longitude: cluster.longitude }}
                  onPress={(e: any) => {
                    e.stopPropagation();
                    // Zoom camera in 3x
                    if (mapRef.current) {
                      mapRef.current.animateToRegion({
                        latitude: cluster.latitude,
                        longitude: cluster.longitude,
                        latitudeDelta: currentZoomRegion.latitudeDelta / 3,
                        longitudeDelta: currentZoomRegion.longitudeDelta / 3,
                      }, 500);
                    }
                  }}
                >
                  <View style={[styles.radarClusterBadge, { backgroundColor: themeColors.neutralForeground1 }]}>
                    <Text style={[styles.radarClusterText, { color: themeColors.neutralBackground1 }]}>
                      +{cluster.items.length}
                    </Text>
                  </View>
                </Marker>
              );
            }

            const item = repItem;
            const isVolunteer = entityType === 'volunteers';
            const imageUri = isVolunteer ? item.avatarUri : item.imageUri;

            return (
              <Marker
                key={item.id}
                coordinate={{ latitude: item.latitude ?? 0, longitude: item.longitude ?? 0 }}
                onPress={(e: any) => {
                  e.stopPropagation();
                  setSelectedMapEntity(item);
                }}
              >
                <View style={styles.nativeMarkerContainer}>
                  <View style={[styles.markerBubble, { backgroundColor: themeColors.neutralBackground1, borderColor: themeColors.brandForeground1 }]}>
                    <Image source={{ uri: imageUri }} style={styles.markerImage as ImageStyle} />
                  </View>
                  <View style={[styles.markerLabelContainer, { backgroundColor: isDarkMode ? '#1e1e1e' : '#ffffff' }]}>
                    <Text style={[styles.markerLabel, { color: themeColors.neutralForeground1 }]} numberOfLines={1}>
                      {item.name.split(' ')[0]}
                    </Text>
                  </View>
                </View>
              </Marker>
            );
          })}
        </MapView>

        {/* Entity Switcher FAB */}
        <Pressable
          onPress={() => {
            setSelectedMapEntity(null);
            setEntityType(entityType === 'communities' ? 'volunteers' : 'communities');
            setActiveCauseFilter('All');
          }}
          style={[styles.entitySwitchFab, { backgroundColor: themeColors.brandForeground1 }]}
        >
          <Ionicons name={entityType === 'communities' ? 'person-outline' : 'people-outline'} size={18} color="#ffffff" />
          <Text style={styles.entitySwitchFabText}>
            {entityType === 'communities' ? 'Switch to Volunteers' : 'Switch to Communities'}
          </Text>
        </Pressable>

        {/* Expandable Bottom Drawer */}
        {renderExpandableDrawer()}
      </View>
    );
  };

  // Renders the Search Overlay
  const renderSearchOverlay = () => {
    const isQueryEmpty = searchQuery.trim().length === 0;

    return (
      <View style={[styles.searchOverlayContainer, { backgroundColor: themeColors.neutralBackground2 }]}>
        {/* Search header row */}
        <View style={[styles.floatingSearchBarContainer, { backgroundColor: themeColors.neutralBackground1, borderColor: themeColors.brandForeground1, marginTop: Spacing.s }]}>
          <Pressable onPress={() => setViewMode('dashboard')} style={{ marginRight: 6 }}>
            <Ionicons name="arrow-back" size={20} color={themeColors.neutralForeground1} />
          </Pressable>
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Look up co-volunteers or communities"
            placeholderTextColor={themeColors.neutralForegroundDisabled}
            style={[styles.globalSearchInput, { color: themeColors.neutralForeground1 }]}
            autoFocus
          />
          {searchQuery.length > 0 && (
            <Pressable onPress={() => setSearchQuery('')} style={{ padding: 4 }}>
              <Ionicons name="close-circle" size={18} color={themeColors.neutralForeground3} />
            </Pressable>
          )}
        </View>

        {isQueryEmpty ? (
          /* ================= PHASE 1 LAYOUT: ZERO CHARACTERS TYPED ================= */
          <View style={styles.phase1Container}>
            <Pressable onPress={enterMapView} style={styles.shortcutRow}>
              <View style={[styles.shortcutIconBox, { backgroundColor: themeColors.brandBackgroundSubtle }]}>
                <Ionicons name="compass" size={20} color={themeColors.brandForeground1} />
              </View>
              <Text style={[styles.shortcutText, { color: themeColors.neutralForeground1 }]}>Nearby</Text>
            </Pressable>

            <Pressable onPress={() => setSearchResultType('causes')} style={styles.shortcutRow}>
              <View style={[styles.shortcutIconBox, { backgroundColor: 'rgba(216,36,108,0.1)' }]}>
                <Ionicons name="heart" size={20} color={MAGENTA_RED} />
              </View>
              <Text style={[styles.shortcutText, { color: themeColors.neutralForeground1 }]}>Causes I care for</Text>
            </Pressable>

            <Pressable onPress={() => setSearchResultType('volunteers')} style={styles.shortcutRow}>
              <View style={[styles.shortcutIconBox, { backgroundColor: 'rgba(16,124,65,0.1)' }]}>
                <Ionicons name="people" size={20} color={themeColors.successForeground1} />
              </View>
              <Text style={[styles.shortcutText, { color: themeColors.neutralForeground1 }]}>Co-volunteers</Text>
            </Pressable>

            <Pressable onPress={() => setSearchResultType('communities')} style={styles.shortcutRow}>
              <View style={[styles.shortcutIconBox, { backgroundColor: 'rgba(216,97,9,0.1)' }]}>
                <Ionicons name="business" size={20} color={themeColors.warningForeground1} />
              </View>
              <Text style={[styles.shortcutText, { color: themeColors.neutralForeground1 }]}>Communities</Text>
            </Pressable>

            {/* Custom Cause Selector Modal style overlay */}
            {searchResultType === 'causes' && (
              <View style={[styles.causesBoxContainer, { backgroundColor: themeColors.neutralBackground1 }]}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.s }}>
                  <Text style={[Typography.bodyStrong, { color: themeColors.neutralForeground1 }]}>Select causes to filter</Text>
                  <Pressable onPress={() => setSearchResultType('all')}>
                    <Text style={{ color: themeColors.brandForeground1, fontWeight: 'bold' }}>Close</Text>
                  </Pressable>
                </View>
                <View style={styles.causesGrid}>
                  {['Education', 'Environment', 'Disaster Relief', 'Elderly Care', 'Housing', 'Mental Health', 'Climate'].map((cause) => {
                    const isSelected = selectedCauses.includes(cause);
                    return (
                      <Pressable
                        key={cause}
                        onPress={() => {
                          const updated = isSelected ? selectedCauses.filter(c => c !== cause) : [...selectedCauses, cause];
                          setSelectedCauses(updated);
                        }}
                        style={[styles.causeChipBtn, {
                          backgroundColor: isSelected ? themeColors.brandBackground : themeColors.neutralBackground2,
                          borderColor: isSelected ? themeColors.brandForeground2 : themeColors.neutralStroke1
                        }]}
                      >
                        <Text style={{ color: isSelected ? '#ffffff' : themeColors.neutralForeground2, fontSize: 12 }}>{cause}</Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            )}
          </View>
        ) : (
          /* ================= PHASE 2 LAYOUT: ACTIVE SPLIT-RESULT FILTERING ================= */
          <ScrollView style={styles.phase2Container} showsVerticalScrollIndicator={false}>
            {/* Top Node: Your Chats & Connections */}
            <Text style={[styles.searchSectionTitle, { color: themeColors.neutralForeground2 }]}>
              YOUR CHATS & CONNECTIONS
            </Text>
            {communities.filter(c => c.joined && c.name.toLowerCase().includes(searchQuery.toLowerCase())).map(item => (
              <Pressable
                key={item.id}
                onPress={() => {
                  setViewMode('dashboard');
                  setSearchQuery('');
                }}
                style={[styles.searchResultItemCard, { backgroundColor: themeColors.neutralBackground1 }]}
              >
                <Image source={{ uri: item.imageUri }} style={styles.searchResultImage as ImageStyle} />
                <View style={styles.searchResultDetails}>
                  <Text style={[styles.searchResultTitle, { color: themeColors.neutralForeground1 }]} numberOfLines={1}>
                    {item.name}
                  </Text>
                  <Text style={[Typography.caption, { color: themeColors.neutralForeground3 }]} numberOfLines={1}>
                    {item.lastMessage}
                  </Text>
                </View>
              </Pressable>
            ))}

            {/* Bottom Node: Explore New Opportunities */}
            <Text style={[styles.searchSectionTitle, { color: themeColors.neutralForeground2, marginTop: Spacing.l }]}>
              EXPLORE NEW OPPORTUNITIES
            </Text>
            {/* Public unjoined communities matching query */}
            {communities.filter(c => !c.joined && c.name.toLowerCase().includes(searchQuery.toLowerCase())).map(item => {
              const dist = getDistanceInKm(userLocation.latitude, userLocation.longitude, userLocation.latitude + item.latOffset, userLocation.longitude + item.lngOffset);
              return (
                <View
                  key={item.id}
                  style={[styles.searchResultItemCard, { backgroundColor: themeColors.neutralBackground1 }]}
                >
                  <Image source={{ uri: item.imageUri }} style={styles.searchResultImage as ImageStyle} />
                  <View style={styles.searchResultDetails}>
                    <Text style={[styles.searchResultTitle, { color: themeColors.neutralForeground1 }]} numberOfLines={1}>
                      {item.name}
                    </Text>
                    <Text style={[Typography.caption, { color: themeColors.brandForeground1, fontWeight: '600' }]}>
                      {dist.toFixed(1)} km away
                    </Text>
                  </View>
                  <Pressable
                    onPress={() => {
                      // join group
                      setCommunities(prev => prev.map(c => c.id === item.id ? { ...c, joined: true } : c));
                      alert(`Successfully joined ${item.name}!`);
                    }}
                    style={[styles.inlineJoinButton, { backgroundColor: themeColors.brandForeground1 }]}
                  >
                    <Text style={styles.inlineJoinButtonText}>Join</Text>
                  </Pressable>
                </View>
              );
            })}

            {/* Public volunteers matching query */}
            {volunteers.filter(v => v.name.toLowerCase().includes(searchQuery.toLowerCase())).map(item => {
              const dist = getDistanceInKm(userLocation.latitude, userLocation.longitude, userLocation.latitude + item.latOffset, userLocation.longitude + item.lngOffset);
              return (
                <View
                  key={item.id}
                  style={[styles.searchResultItemCard, { backgroundColor: themeColors.neutralBackground1 }]}
                >
                  <Avatar size={40} name={item.name} imageUri={item.avatarUri} isDarkMode={isDarkMode} />
                  <View style={styles.searchResultDetails}>
                    <Text style={[styles.searchResultTitle, { color: themeColors.neutralForeground1 }]} numberOfLines={1}>
                      {item.name}
                    </Text>
                    <Text style={[Typography.caption, { color: themeColors.successForeground1, fontWeight: '600' }]}>
                      {dist.toFixed(1)} km away • {item.cause}
                    </Text>
                  </View>
                  <Pressable
                    onPress={() => alert(`Connect request sent to ${item.name}!`)}
                    style={[styles.inlineJoinButton, { backgroundColor: themeColors.successForeground1 }]}
                  >
                    <Text style={styles.inlineJoinButtonText}>Connect</Text>
                  </Pressable>
                </View>
              );
            })}
          </ScrollView>
        )}
      </View>
    );
  };

  // Render main dashboard Layout (A)
  const renderDashboard = () => {
    return (
      <View style={[styles.dashboardContainer, { backgroundColor: themeColors.neutralBackground2 }]}>
        {/* Rounded sticky search bar row */}
        <View style={styles.dashboardHeaderRow}>
          <Pressable
            onPress={() => setViewMode('search')}
            style={[styles.dashboardSearchBar, { backgroundColor: themeColors.neutralBackground1, borderColor: themeColors.neutralStroke2 }]}
          >
            <Ionicons name="search-outline" size={18} color={themeColors.neutralForeground3} style={{ marginRight: 8 }} />
            <Text style={{ color: themeColors.neutralForegroundDisabled, fontSize: 14 }}>
              Look up co-volunteers or communities
            </Text>
          </Pressable>
          
          <Pressable
            onPress={() => {
              setShowDuplicationAlert(false);
              setNewGroupTitle('');
              setNewGroupDesc('');
              setCreateModalVisible(true);
            }}
            style={[styles.createCommunityBtn, { backgroundColor: themeColors.brandForeground1 }]}
          >
            <Ionicons name="add" size={18} color="#ffffff" style={{ marginRight: 2 }} />
            <Text style={styles.createCommunityBtnText}>Create</Text>
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Horizontally scrolling gallery row of co-volunteers */}
          <Text style={[styles.stripTitle, Typography.captionStrong, { color: themeColors.neutralForeground2 }]}>
            CO-VOLUNTEERS
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.friendsStrip}>
            {volunteers.map((item) => (
              <Pressable key={item.id} onPress={() => alert(`Opening ${item.name} profile...`)} style={styles.friendAvatarItem}>
                <Avatar size={58} name={item.name} imageUri={item.avatarUri} isDarkMode={isDarkMode} />
                <Text style={[styles.friendLabel, Typography.caption, { color: themeColors.neutralForeground1 }]} numberOfLines={1}>
                  {item.name.split(' ')[0]}
                </Text>
              </Pressable>
            ))}
          </ScrollView>

          {/* Vertically stacked list layout of communities */}
          <Text style={[styles.stripTitle, Typography.captionStrong, { color: themeColors.neutralForeground2, marginTop: Spacing.m }]}>
            CHANNELS & COMMUNITIES
          </Text>

          <View style={styles.channelsListContainer}>
            {communities.filter(c => c.joined).map((item) => (
              <Pressable
                key={item.id}
                onPress={() => alert(`Entering ${item.name} discussions...`)}
                style={[
                  styles.communityCard,
                  {
                    backgroundColor: themeColors.neutralBackground1,
                    borderColor: themeColors.neutralStroke2,
                  },
                ]}
              >
                <Image source={{ uri: item.imageUri }} style={styles.communityIconImageLarge} />
                <View style={styles.communityDetails}>
                  <View style={styles.communityTitleRow}>
                    {item.isPinned && <Ionicons name="pin" size={12} color={themeColors.neutralForeground3} style={{ marginRight: 4 }} />}
                    <Text style={[styles.communityTitleText, { color: themeColors.neutralForeground1, flex: 1 }]} numberOfLines={1}>
                      {item.name}
                    </Text>
                    <Text style={[Typography.caption, { color: themeColors.neutralForeground3, marginLeft: 'auto' }]}>
                      {item.time}
                    </Text>
                  </View>
                  <Text style={[styles.memberCountText, { color: themeColors.neutralForeground3 }]}>
                    {item.members} members
                  </Text>
                  <View style={styles.tagsRow}>
                    {item.tags.map((tag) => (
                      <View key={tag} style={[styles.tagChip, { backgroundColor: isDarkMode ? '#243454' : '#e0ecfa' }]}>
                        <Text style={[styles.tagText, { color: themeColors.brandForeground1 }]}>{tag}</Text>
                      </View>
                    ))}
                  </View>
                  <Text style={[styles.lastMessageText, { color: themeColors.neutralForeground2 }]} numberOfLines={1}>
                    {item.lastMessage}
                  </Text>
                </View>
              </Pressable>
            ))}
          </View>
        </ScrollView>

        {/* Community Creation Modal */}
        {createModalVisible && (
          <View style={[styles.createGroupModalOverlay, { backgroundColor: themeColors.neutralBackgroundOverlay }]}>
            <View style={[styles.createGroupCard, { backgroundColor: themeColors.neutralBackground1 }]}>
              <View style={styles.createGroupHeader}>
                <Text style={[Typography.subtitle, { color: themeColors.neutralForeground1 }]}>Create Community</Text>
                <Pressable onPress={() => setCreateModalVisible(false)}>
                  <Ionicons name="close" size={24} color={themeColors.neutralForeground1} />
                </Pressable>
              </View>

              <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
                <Text style={[styles.modalLabel, { color: themeColors.neutralForeground2 }]}>Community Name</Text>
                <TextInput
                  style={[styles.modalInput, { color: themeColors.neutralForeground1, borderColor: themeColors.neutralStroke1 }]}
                  placeholder="Enter community title..."
                  placeholderTextColor={themeColors.neutralForegroundDisabled}
                  value={newGroupTitle}
                  onChangeText={handleGroupTitleChange}
                />

                <Text style={[styles.modalLabel, { color: themeColors.neutralForeground2, marginTop: Spacing.s }]}>Cause Category</Text>
                <View style={styles.categoryPickerRow}>
                  {['Education', 'Environment', 'Disaster Relief', 'Elderly Care', 'Housing', 'Mental Health', 'Climate'].map((cat) => {
                    const isSel = newGroupCategory === cat;
                    return (
                      <Pressable
                        key={cat}
                        onPress={() => {
                          setNewGroupCategory(cat);
                          checkDuplicateWarning(newGroupTitle, cat);
                        }}
                        style={[styles.categoryPickerBtn, {
                          backgroundColor: isSel ? themeColors.brandBackground : themeColors.neutralBackground2,
                          borderColor: isSel ? themeColors.brandForeground2 : themeColors.neutralStroke1
                        }]}
                      >
                        <Text style={{ color: isSel ? '#ffffff' : themeColors.neutralForeground2, fontSize: 11 }}>{cat}</Text>
                      </Pressable>
                    );
                  })}
                </View>

                <Text style={[styles.modalLabel, { color: themeColors.neutralForeground2, marginTop: Spacing.s }]}>Description</Text>
                <TextInput
                  style={[styles.modalInput, { color: themeColors.neutralForeground1, borderColor: themeColors.neutralStroke1, height: 80, textAlignVertical: 'top' }]}
                  placeholder="Describe your community initiatives..."
                  placeholderTextColor={themeColors.neutralForegroundDisabled}
                  value={newGroupDesc}
                  onChangeText={(txt) => {
                    setNewGroupDesc(txt);
                    checkDuplicateWarning(newGroupTitle, newGroupCategory);
                  }}
                  multiline
                />

                {/* ================= SMART ANTI-DUPLICATION WARNING LAYOUT ================= */}
                {showDuplicationAlert && matchedDuplicateItem && (
                  <View style={[styles.duplicateAlertCard, { backgroundColor: themeColors.warningBackgroundSubtle, borderColor: themeColors.warningForeground1 }]}>
                    <View style={{ flexDirection: 'row', gap: 6, alignItems: 'flex-start' }}>
                      <Ionicons name="warning" size={20} color={themeColors.warningForeground1} />
                      <Text style={[styles.duplicateAlertTitle, { color: themeColors.warningForeground1 }]}>Potential Duplicate Detected</Text>
                    </View>
                    <Text style={[styles.duplicateAlertText, { color: themeColors.neutralForeground1 }]}>
                      We noticed similar active groups in your immediate area. You might build a bigger impact by joining forces with them. Want to view their profiles first, or proceed with creating yours?
                    </Text>
                    <View style={styles.duplicateAlertButtons}>
                      <Pressable
                        onPress={() => {
                          // view existing group, close modal, center map, open details peek!
                          setCreateModalVisible(false);
                          enterMapView();
                          setSelectedMapEntity(matchedDuplicateItem);
                        }}
                        style={[styles.duplicateAlertBtn, { backgroundColor: themeColors.brandForeground1 }]}
                      >
                        <Text style={styles.duplicateAlertBtnText}>View Group</Text>
                      </Pressable>
                      <Pressable
                        onPress={() => {
                          // proceed anyway
                          setShowDuplicationAlert(false);
                        }}
                        style={[styles.duplicateAlertBtn, { backgroundColor: 'transparent', borderWidth: 1, borderColor: themeColors.neutralStrokeAccessible }]}
                      >
                        <Text style={[styles.duplicateAlertBtnText, { color: themeColors.neutralForeground1 }]}>Proceed Anyway</Text>
                      </Pressable>
                    </View>
                  </View>
                )}
              </ScrollView>

              <Pressable
                onPress={() => {
                  const newComm: CommunityItem = {
                    id: `sc_${Date.now()}`,
                    name: newGroupTitle,
                    members: 1,
                    activeMembers: 1,
                    lastMessage: 'You created this community.',
                    time: 'Just now',
                    unreadCount: 0,
                    isPinned: false,
                    isMuted: false,
                    imageUri: 'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?w=150',
                    tags: [newGroupCategory],
                    description: newGroupDesc,
                    latOffset: 0.015,
                    lngOffset: -0.015,
                    cause: newGroupCategory,
                    joined: true,
                  };
                  setCommunities(prev => [newComm, ...prev]);
                  setCreateModalVisible(false);
                  alert(`Successfully created ${newGroupTitle}!`);
                }}
                style={[styles.modalSubmitBtn, {
                  backgroundColor: newGroupTitle && newGroupDesc && !showDuplicationAlert ? themeColors.brandForeground1 : themeColors.neutralBackgroundDisabled
                }]}
                disabled={!newGroupTitle || !newGroupDesc || showDuplicationAlert}
              >
                <Text style={[styles.modalSubmitBtnText, {
                  color: newGroupTitle && newGroupDesc && !showDuplicationAlert ? '#ffffff' : themeColors.neutralForegroundDisabled
                }]}>Create Community</Text>
              </Pressable>
            </View>
          </View>
        )}
      </View>
    );
  };

  // Render view controller
  if (viewMode === 'map') {
    if (Platform.OS === 'web' || !MapView) {
      return renderWebRadarMap();
    } else {
      return renderNativeMap();
    }
  } else if (viewMode === 'search') {
    return renderSearchOverlay();
  } else {
    return renderDashboard();
  }
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  dashboardContainer: {
    flex: 1,
  },
  dashboardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.s,
    gap: Spacing.s,
  },
  dashboardSearchBar: {
    flex: 1,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.m,
  },
  createCommunityBtn: {
    height: 40,
    paddingHorizontal: Spacing.m,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  createCommunityBtnText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 13,
  },
  scrollContent: {
    paddingBottom: Spacing.xl,
  },
  stripTitle: {
    fontSize: 10,
    paddingHorizontal: Spacing.m,
    marginTop: Spacing.s,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  friendsStrip: {
    paddingLeft: Spacing.m,
    paddingRight: Spacing.m,
    paddingVertical: Spacing.xs,
    flexDirection: 'row',
    gap: Spacing.s,
  },
  friendAvatarItem: {
    alignItems: 'center',
    width: 72,
  },
  friendLabel: {
    fontSize: 11,
    marginTop: 4,
    textAlign: 'center',
    width: '100%',
  },
  channelsListContainer: {
    paddingHorizontal: Spacing.m,
    marginTop: Spacing.xs,
  },
  communityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    padding: Spacing.s,
    marginVertical: 6,
    minHeight: 110,
  },
  communityIconImageLarge: {
    width: 80,
    height: 80,
    borderRadius: 12,
  },
  communityDetails: {
    flex: 1,
    marginLeft: Spacing.s,
  },
  communityTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  communityTitleText: {
    fontSize: 15,
    fontWeight: '700',
  },
  memberCountText: {
    fontSize: 11,
    marginVertical: 1,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginVertical: 4,
  },
  tagChip: {
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  tagText: {
    fontSize: 9,
    fontWeight: 'bold',
  },
  lastMessageText: {
    fontSize: 12,
    marginTop: 2,
  },
  searchOverlayContainer: {
    flex: 1,
    paddingHorizontal: Spacing.m,
  },
  floatingSearchBarContainer: {
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 24,
    borderWidth: 1,
    paddingHorizontal: Spacing.m,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
    marginBottom: Spacing.m,
  },
  globalSearchInput: {
    flex: 1,
    fontSize: 14,
    paddingVertical: 6,
  },
  phase1Container: {
    flex: 1,
    marginTop: Spacing.s,
    gap: Spacing.s,
  },
  shortcutRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.m,
    borderRadius: Shapes.rounded,
    backgroundColor: 'rgba(0,0,0,0.02)',
  },
  shortcutIconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.m,
  },
  shortcutText: {
    ...Typography.bodyStrong,
    fontSize: 15,
  },
  causesBoxContainer: {
    marginTop: Spacing.s,
    padding: Spacing.m,
    borderRadius: Shapes.rounded,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  causesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
  },
  causeChipBtn: {
    paddingHorizontal: Spacing.s,
    paddingVertical: 6,
    borderRadius: Shapes.circular,
    borderWidth: 1,
  },
  phase2Container: {
    flex: 1,
    marginTop: Spacing.xs,
  },
  searchSectionTitle: {
    ...Typography.captionStrong,
    fontSize: 10,
    letterSpacing: 1,
    marginBottom: Spacing.s,
  },
  searchResultItemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.s,
    borderRadius: Shapes.rounded,
    marginBottom: Spacing.s,
  },
  searchResultImage: {
    width: 40,
    height: 40,
    borderRadius: 8,
  },
  searchResultDetails: {
    flex: 1,
    marginLeft: Spacing.s,
    marginRight: Spacing.xs,
  },
  searchResultTitle: {
    ...Typography.bodyStrong,
    fontSize: 14,
  },
  inlineJoinButton: {
    paddingHorizontal: Spacing.m,
    paddingVertical: 6,
    borderRadius: 14,
  },
  inlineJoinButtonText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 12,
  },
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
    top: 72,
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
  mapSearchHeader: {
    position: 'absolute',
    top: Spacing.s,
    left: Spacing.m,
    right: Spacing.m,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.s,
  },
  backIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  mapSearchBarInput: {
    flex: 1,
    height: 40,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.m,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  causeFiltersRow: {
    position: 'absolute',
    top: Spacing.s + 48,
    left: Spacing.m,
    right: Spacing.m,
  },
  causeFilterPill: {
    paddingHorizontal: Spacing.m,
    paddingVertical: 5,
    borderRadius: 14,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  causeFilterText: {
    fontSize: 11,
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
    paddingBottom: 90,
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
  entitySwitchFab: {
    position: 'absolute',
    bottom: 90,
    right: Spacing.m,
    flexDirection: 'row',
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    paddingHorizontal: Spacing.m,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 5,
    elevation: 6,
    zIndex: 10,
  },
  entitySwitchFabText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 12,
    marginLeft: 6,
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
    paddingVertical: Spacing.xl,
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
  radarClusterBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
    elevation: 4,
  },
  radarClusterText: {
    fontWeight: 'bold',
    fontSize: 12,
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
  createGroupModalOverlay: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.m,
    zIndex: 999,
  },
  createGroupCard: {
    width: '100%',
    maxHeight: '85%',
    borderRadius: 16,
    padding: Spacing.m,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 8,
  },
  createGroupHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.s,
  },
  modalLabel: {
    ...Typography.captionStrong,
    fontSize: 12,
    marginBottom: Spacing.xxs,
  },
  modalInput: {
    height: 42,
    borderWidth: 1,
    borderRadius: Shapes.rounded,
    paddingHorizontal: Spacing.s,
    fontSize: 14,
  },
  categoryPickerRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xxs,
    marginVertical: Spacing.xxs,
  },
  categoryPickerBtn: {
    paddingHorizontal: Spacing.s,
    paddingVertical: 5,
    borderRadius: Shapes.circular,
    borderWidth: 1,
  },
  modalSubmitBtn: {
    height: 46,
    borderRadius: 23,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: Spacing.m,
  },
  modalSubmitBtnText: {
    fontWeight: 'bold',
    fontSize: 15,
  },
  duplicateAlertCard: {
    borderWidth: 1.5,
    borderRadius: 8,
    padding: Spacing.m,
    marginTop: Spacing.s,
  },
  duplicateAlertTitle: {
    ...Typography.bodyStrong,
    fontSize: 13,
  },
  duplicateAlertText: {
    ...Typography.caption,
    marginTop: 4,
    lineHeight: 16,
  },
  duplicateAlertButtons: {
    flexDirection: 'row',
    gap: Spacing.s,
    marginTop: Spacing.s,
  },
  duplicateAlertBtn: {
    paddingHorizontal: Spacing.m,
    paddingVertical: 6,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  duplicateAlertBtnText: {
    color: '#ffffff',
    fontSize: 12,
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
