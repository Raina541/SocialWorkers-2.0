import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  Pressable,
  Modal,
  Image,
} from 'react-native';
import { Colors, Spacing, Typography } from '../constants/Theme';
import { Ionicons } from '@expo/vector-icons';
import { Avatar } from '../components/Avatar';

// Subcomponents
import { DirectMessage } from './DirectMessage';
import { CreateCommunityModal } from './CreateCommunityModal';
import { CommunityDetail } from './CommunityDetail';
import { DiscoverMap } from './DiscoverMap';

const MAGENTA_RED = '#d8246c';

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
}

interface ColleagueItem {
  name: string;
  unreadCount: number;
  imageUri?: string;
}

export const Community: React.FC<{
  isDarkMode?: boolean;
  onToggleTabBar?: (visible: boolean) => void;
  activeTab?: number;
}> = ({ isDarkMode = false, onToggleTabBar, activeTab }) => {
  const themeColors = isDarkMode ? Colors.dark : Colors.light;

  // Subscreen navigation and UI states
  const [selectedColleague, setSelectedColleague] = useState<string | null>(null);
  const [selectedCommunity, setSelectedCommunity] = useState<CommunityItem | null>(null);
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [longPressedCommunity, setLongPressedCommunity] = useState<CommunityItem | null>(null);
  const [activeSubTab, setActiveSubTab] = useState<'following' | 'discover'>('following');

  // Reset to Following tab when main Community tab is clicked
  useEffect(() => {
    if (activeTab === 2) {
      setActiveSubTab('following');
    }
  }, [activeTab]);

  // Colleagues and Communities states
  const [colleagues, setColleagues] = useState<ColleagueItem[]>([
    { name: 'Jane Doe', unreadCount: 2, imageUri: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150' },
    { name: 'Bob Smith', unreadCount: 0, imageUri: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150' },
    { name: 'Alice Green', unreadCount: 1, imageUri: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150' },
    { name: 'Charlie Brown', unreadCount: 0, imageUri: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=150' },
    { name: 'Diana Prince', unreadCount: 3, imageUri: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150' },
  ]);

  const [communities, setCommunities] = useState<CommunityItem[]>([
    {
      id: 'c1',
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
    },
    {
      id: 'c2',
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
    },
    {
      id: 'c3',
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
    },
  ]);

  // Discover items states
  const [discoverCommunities, setDiscoverCommunities] = useState<CommunityItem[]>([
    {
      id: 'dc1',
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
    },
    {
      id: 'dc2',
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
    },
    {
      id: 'dc3',
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
    },
  ]);

  const [discoverColleagues, setDiscoverColleagues] = useState<ColleagueItem[]>([
    { name: 'Sarah Jenkins', unreadCount: 0, imageUri: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150' },
    { name: 'Michael Chang', unreadCount: 0, imageUri: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150' },
    { name: 'Emma Rodriguez', unreadCount: 0, imageUri: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150' },
  ]);

  const handleJoinCommunity = (item: CommunityItem) => {
    setCommunities((prev) => [...prev, { ...item, id: `c_${Date.now()}` }]);
    setDiscoverCommunities((prev) => prev.filter((c) => c.id !== item.id));
  };

  const handleConnectColleague = (item: ColleagueItem) => {
    setColleagues((prev) => [...prev, item]);
    setDiscoverColleagues((prev) => prev.filter((c) => c.name !== item.name));
  };

  // Hide tab navigation when direct message screen or full details is open
  useEffect(() => {
    if (selectedColleague || selectedCommunity) {
      onToggleTabBar?.(false);
    } else {
      onToggleTabBar?.(true);
    }
    return () => {
      onToggleTabBar?.(true);
    };
  }, [selectedColleague, selectedCommunity, onToggleTabBar]);

  // Handle Channel Context Menu options
  const handleTogglePin = (id: string) => {
    setCommunities((prev) =>
      prev.map((c) => (c.id === id ? { ...c, isPinned: !c.isPinned } : c))
    );
    setLongPressedCommunity(null);
  };

  const handleToggleMute = (id: string) => {
    setCommunities((prev) =>
      prev.map((c) => (c.id === id ? { ...c, isMuted: !c.isMuted } : c))
    );
    setLongPressedCommunity(null);
  };

  const handleMarkRead = (id: string) => {
    setCommunities((prev) =>
      prev.map((c) => (c.id === id ? { ...c, unreadCount: 0 } : c))
    );
    setLongPressedCommunity(null);
  };

  const handleLeaveCommunity = (id: string) => {
    setCommunities((prev) => prev.filter((c) => c.id !== id));
    setLongPressedCommunity(null);
  };

  // Search filtering logic
  const filteredColleagues = colleagues.filter((c) =>
    searchQuery ? c.name.toLowerCase().includes(searchQuery.toLowerCase()) : true
  );

  const filteredCommunities = communities.filter((c) =>
    searchQuery ? c.name.toLowerCase().includes(searchQuery.toLowerCase()) : true
  );

  const filteredDiscoverColleagues = discoverColleagues.filter((c) =>
    searchQuery ? c.name.toLowerCase().includes(searchQuery.toLowerCase()) : true
  );

  const filteredDiscoverCommunities = discoverCommunities.filter((c) =>
    searchQuery ? c.name.toLowerCase().includes(searchQuery.toLowerCase()) : true
  );

  // Render individual channel card
  const renderCommunityCard = (item: CommunityItem) => {
    return (
      <Pressable
        key={item.id}
        onPress={() => setSelectedCommunity(item)}
        onLongPress={() => setLongPressedCommunity(item)}
        style={[
          styles.communityCard,
          {
            backgroundColor: themeColors.neutralBackground1,
            borderColor: themeColors.neutralStroke2,
          },
        ]}
      >
        <View style={styles.communityIconContainer}>
          <Image source={{ uri: item.imageUri }} style={styles.communityIconImageLarge} />
          {item.unreadCount > 0 && (
            <View style={[styles.channelBadge, { backgroundColor: MAGENTA_RED, borderColor: themeColors.neutralBackground1 }]}>
              <Text style={styles.channelBadgeText}>{item.unreadCount}</Text>
            </View>
          )}
        </View>
        <View style={styles.communityDetails}>
          <View style={styles.communityTitleRow}>
            {item.isPinned && <Ionicons name="pin" size={12} color={themeColors.neutralForeground3} style={{ marginRight: 4 }} />}
            <Text style={[styles.communityTitleText, { color: themeColors.neutralForeground1, flex: 1 }]} numberOfLines={1}>
              {item.name}
            </Text>
            {item.isMuted && <Ionicons name="notifications-off-outline" size={14} color={themeColors.neutralForeground3} style={{ marginRight: 6 }} />}
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
    );
  };

  // Subscreen detail renders
  if (selectedColleague) {
    return (
      <DirectMessage
        isDarkMode={isDarkMode}
        colleagueName={selectedColleague}
        onBack={() => {
          setSelectedColleague(null);
          setColleagues((prev) =>
            prev.map((c) => (c.name === selectedColleague ? { ...c, unreadCount: 0 } : c))
          );
        }}
      />
    );
  }

  if (selectedCommunity) {
    return (
      <CommunityDetail
        isDarkMode={isDarkMode}
        communityName={selectedCommunity.name}
        memberCount={selectedCommunity.members}
        activeCount={selectedCommunity.activeMembers}
        initialIsMember={true}
        onBack={() => {
          setSelectedCommunity(null);
          setCommunities((prev) =>
            prev.map((c) => (c.id === selectedCommunity.id ? { ...c, unreadCount: 0 } : c))
          );
        }}
        onOpenDM={(name) => {
          setSelectedCommunity(null);
          setSelectedColleague(name);
        }}
      />
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: themeColors.neutralBackground2 }]}>
      {/* Floating Capsule Search Bar & Navigation Tabs Header */}
      <View style={{ backgroundColor: themeColors.neutralBackground2, zIndex: 10 }}>
        {/* Floating Capsule Search Bar */}
        <View
          style={[
            styles.floatingSearchBarContainer,
            {
              backgroundColor: themeColors.neutralBackground1,
              borderColor: isSearchFocused ? themeColors.brandForeground1 : themeColors.neutralStroke2,
            },
          ]}
        >
          <Ionicons
            name="search-outline"
            size={18}
            color={themeColors.neutralForeground3}
            style={{ marginRight: Spacing.s }}
          />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Look for communities and friends"
            placeholderTextColor={themeColors.neutralForegroundDisabled}
            style={[styles.globalSearchInput, { color: themeColors.neutralForeground1 }]}
            onFocus={() => setIsSearchFocused(true)}
            onBlur={() => setIsSearchFocused(false)}
          />
          {searchQuery.length > 0 && (
            <Pressable onPress={() => setSearchQuery('')} style={{ padding: 4 }}>
              <Ionicons name="close-circle" size={18} color={themeColors.neutralForeground3} />
            </Pressable>
          )}
        </View>

        {/* Two Tab Navigation Menu */}
        <View style={styles.tabBarContainer}>
          {/* Following Tab */}
          <Pressable
            onPress={() => setActiveSubTab('following')}
            style={[
              styles.subTabButton,
              activeSubTab === 'following' && [styles.subTabButtonActive, { borderBottomColor: themeColors.brandForeground1 }],
            ]}
          >
            <Ionicons
              name={activeSubTab === 'following' ? 'people' : 'people-outline'}
              size={18}
              color={activeSubTab === 'following' ? themeColors.brandForeground1 : themeColors.neutralForeground3}
              style={{ marginRight: Spacing.xs }}
            />
            <Text
              style={[
                styles.subTabText,
                {
                  color: activeSubTab === 'following' ? themeColors.brandForeground1 : themeColors.neutralForeground2,
                  fontWeight: activeSubTab === 'following' ? '600' : '500',
                },
              ]}
            >
              Following
            </Text>
          </Pressable>

          {/* Discover Tab */}
          <Pressable
            onPress={() => setActiveSubTab('discover')}
            style={[
              styles.subTabButton,
              activeSubTab === 'discover' && [styles.subTabButtonActive, { borderBottomColor: themeColors.brandForeground1 }],
            ]}
          >
            <Ionicons
              name={activeSubTab === 'discover' ? 'compass' : 'compass-outline'}
              size={18}
              color={activeSubTab === 'discover' ? themeColors.brandForeground1 : themeColors.neutralForeground3}
              style={{ marginRight: Spacing.xs }}
            />
            <Text
              style={[
                styles.subTabText,
                {
                  color: activeSubTab === 'discover' ? themeColors.brandForeground1 : themeColors.neutralForeground2,
                  fontWeight: activeSubTab === 'discover' ? '600' : '500',
                },
              ]}
            >
              Discover
            </Text>
          </Pressable>
        </View>
      </View>

      {/* Main Content Areas */}
      {activeSubTab === 'following' ? (
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Direct Messages Strip */}
          {filteredColleagues.length > 0 && (
            <>
              <Text style={[styles.stripTitle, Typography.captionStrong, { color: themeColors.neutralForeground2 }]}>
                DIRECT MESSAGES
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.friendsStrip}>
                {filteredColleagues.map((item) => (
                  <Pressable key={item.name} onPress={() => setSelectedColleague(item.name)} style={styles.friendAvatarItem}>
                    <View style={styles.avatarWrapper}>
                      <Avatar size={58} name={item.name} imageUri={item.imageUri} isDarkMode={isDarkMode} />
                      {item.unreadCount > 0 && (
                        <View style={[styles.unreadBadge, { backgroundColor: MAGENTA_RED }]}>
                          <Text style={unreadBadgeTextStyles.text}>{item.unreadCount}</Text>
                        </View>
                      )}
                    </View>
                    <Text style={[styles.friendLabel, Typography.caption, { color: themeColors.neutralForeground1 }]} numberOfLines={1}>
                      {item.name.split(' ')[0]}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>
            </>
          )}

          {/* Channels Section */}
          <Text style={[styles.stripTitle, Typography.captionStrong, { color: themeColors.neutralForeground2, marginTop: Spacing.m }]}>
            CHANNELS
          </Text>

          <View style={styles.channelsListContainer}>
            {filteredCommunities.filter((c) => c.isPinned).map((item) => renderCommunityCard(item))}
            {filteredCommunities.filter((c) => !c.isPinned).map((item) => renderCommunityCard(item))}
          </View>

          {communities.length < 4 && !searchQuery && (
            <View style={[styles.nudgeCard, { backgroundColor: themeColors.brandBackgroundSubtle, borderColor: themeColors.brandForeground1 }]}>
              <View style={styles.nudgeHeader}>
                <Ionicons name="people-outline" size={20} color={themeColors.brandForeground1} />
                <Text style={[Typography.bodyStrong, { color: themeColors.brandForeground1, marginLeft: 6 }]}>
                  Build Your Social Work Communities
                </Text>
              </View>
              <Text style={[Typography.caption, { color: themeColors.neutralForeground1, marginVertical: Spacing.s }]}>
                Create a new channel to coordinate, host events, and group collaborate with colleagues around specific social work causes.
              </Text>
              <Pressable
                onPress={() => setCreateModalVisible(true)}
                style={[styles.nudgeButton, { backgroundColor: themeColors.brandForeground1 }]}
              >
                <Text style={styles.nudgeButtonText}>+ Create New Channel</Text>
              </Pressable>
            </View>
          )}
        </ScrollView>
      ) : (
        <DiscoverMap
          isDarkMode={isDarkMode}
          onJoinCommunity={handleJoinCommunity}
        />
      )}

      {/* Long Press Actions Modal */}
      <Modal visible={longPressedCommunity !== null} transparent animationType="fade">
        <Pressable style={styles.actionOverlay} onPress={() => setLongPressedCommunity(null)}>
          <View style={[styles.actionSheet, { backgroundColor: themeColors.neutralBackground1 }]}>
            <Text style={[styles.actionSheetTitle, Typography.captionStrong, { color: themeColors.neutralForeground2 }]}>
              {longPressedCommunity?.name}
            </Text>
            <Pressable
              onPress={() => handleTogglePin(longPressedCommunity!.id)}
              style={styles.sheetItem}
            >
              <Ionicons name="pin-outline" size={20} color={themeColors.neutralForeground1} />
              <Text style={[styles.sheetItemText, Typography.body, { color: themeColors.neutralForeground1 }]}>
                {longPressedCommunity?.isPinned ? 'Unpin Community' : 'Pin Community'}
              </Text>
            </Pressable>
            <Pressable
              onPress={() => handleToggleMute(longPressedCommunity!.id)}
              style={styles.sheetItem}
            >
              <Ionicons
                name={longPressedCommunity?.isMuted ? 'notifications-outline' : 'notifications-off-outline'}
                size={20}
                color={themeColors.neutralForeground1}
              />
              <Text style={[styles.sheetItemText, Typography.body, { color: themeColors.neutralForeground1 }]}>
                {longPressedCommunity?.isMuted ? 'Unmute notifications' : 'Mute notifications'}
              </Text>
            </Pressable>
            <Pressable
              onPress={() => handleMarkRead(longPressedCommunity!.id)}
              style={styles.sheetItem}
            >
              <Ionicons name="checkmark-done-outline" size={20} color={themeColors.neutralForeground1} />
              <Text style={[styles.sheetItemText, Typography.body, { color: themeColors.neutralForeground1 }]}>
                Mark as read
              </Text>
            </Pressable>
            <View style={[styles.sheetDivider, { backgroundColor: themeColors.neutralStroke2 }]} />
            <Pressable
              onPress={() => handleLeaveCommunity(longPressedCommunity!.id)}
              style={styles.sheetItem}
            >
              <Ionicons name="log-out-outline" size={20} color={MAGENTA_RED} />
              <Text style={[styles.sheetItemText, Typography.bodyStrong, { color: MAGENTA_RED }]}>
                Leave Community
              </Text>
            </Pressable>
          </View>
        </Pressable>
      </Modal>

      {/* Create Community Modal */}
      <CreateCommunityModal
        visible={createModalVisible}
        isDarkMode={isDarkMode}
        onClose={() => setCreateModalVisible(false)}
        onCreate={(name, location, description) => {
          const newComm: CommunityItem = {
            id: `c_${Date.now()}`,
            name,
            members: 1,
            activeMembers: 1,
            lastMessage: 'You: Welcome to the new community!',
            time: 'Just now',
            unreadCount: 0,
            isPinned: false,
            isMuted: false,
            imageUri: 'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?w=150',
            tags: ['New Initiative'],
          };
          setCommunities((prev) => [newComm, ...prev]);
        }}
        onViewExisting={() => {
          setCreateModalVisible(false);
          setSelectedCommunity(communities.find((c) => c.id === 'c1') || null);
        }}
      />
    </View>
  );
};

// Text styling workaround for nested properties
const unreadBadgeTextStyles = StyleSheet.create({
  text: {
    color: '#ffffff',
    fontSize: 8,
    fontWeight: 'bold',
  },
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  globalSearchBarContainer: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.m,
    borderBottomWidth: 1,
  },
  globalSearchInput: {
    flex: 1,
    fontSize: 14,
    paddingVertical: 6,
  },
  scrollContent: {
    paddingBottom: Spacing.xl,
  },
  stripTitle: {
    fontSize: 9,
    paddingHorizontal: Spacing.m,
    marginTop: Spacing.s,
    marginBottom: Spacing.xs,
  },
  friendsStrip: {
    paddingLeft: Spacing.m,
    paddingRight: Spacing.m,
    paddingVertical: Spacing.xs,
    flexDirection: 'row',
    gap: Spacing.s * 0.8,
  },
  friendAvatarItem: {
    alignItems: 'center',
    width: 72,
  },
  avatarWrapper: {
    position: 'relative',
  },
  unreadBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
    borderWidth: 1.5,
    borderColor: '#ffffff',
  },
  friendLabel: {
    fontSize: 10,
    marginTop: 4,
    textAlign: 'center',
    width: '100%',
  },
  channelsListContainer: {
    paddingHorizontal: Spacing.m,
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
  communityIconContainer: {
    position: 'relative',
  },
  channelBadge: {
    position: 'absolute',
    top: -5,
    right: -5,
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
    borderWidth: 2,
    zIndex: 5,
  },
  channelBadgeText: {
    color: '#ffffff',
    fontSize: 9,
    fontWeight: 'bold',
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
    fontSize: 10.5,
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
    fontSize: 8.5,
    fontWeight: 'bold',
  },
  lastMessageText: {
    fontSize: 12,
    marginTop: 2,
  },
  nudgeCard: {
    marginHorizontal: Spacing.m,
    marginTop: Spacing.l,
    borderRadius: 8,
    borderWidth: 1,
    padding: Spacing.m,
  },
  nudgeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  nudgeButton: {
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  nudgeButtonText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  actionOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'flex-end',
  },
  actionSheet: {
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: Spacing.m,
    paddingBottom: Spacing.xl,
  },
  actionSheetTitle: {
    fontSize: 11,
    marginBottom: Spacing.s,
    textAlign: 'center',
  },
  sheetItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.m,
  },
  sheetItemText: {
    marginLeft: Spacing.m,
    fontSize: 14,
  },
  sheetDivider: {
    height: 1,
    marginVertical: Spacing.xs,
  },
  floatingSearchBarContainer: {
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: Spacing.m,
    marginTop: Spacing.m,
    marginBottom: Spacing.s,
    paddingHorizontal: Spacing.m,
    borderRadius: 24, // pill-shaped capsule
    borderWidth: 1,
    // Premium floating look shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  tabBarContainer: {
    flexDirection: 'row',
    marginHorizontal: Spacing.m,
    borderBottomWidth: 1,
    borderBottomColor: 'transparent',
    marginBottom: Spacing.xs,
  },
  subTabButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    paddingVertical: Spacing.s,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  subTabButtonActive: {
    borderBottomWidth: 2,
  },
  subTabText: {
    fontSize: 14,
  },
  joinButton: {
    alignSelf: 'flex-start',
    paddingHorizontal: Spacing.m,
    paddingVertical: Spacing.xxs,
    borderRadius: 16,
    marginTop: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  joinButtonText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  colleagueCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    padding: Spacing.s,
    marginVertical: 6,
  },
  colleagueDetails: {
    flex: 1,
    marginLeft: Spacing.s,
  },
  colleagueName: {
    fontSize: 14,
  },
  connectButton: {
    paddingHorizontal: Spacing.s,
    paddingVertical: Spacing.xxs,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  connectButtonText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
});
