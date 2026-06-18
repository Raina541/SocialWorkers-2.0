import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Image,
  Modal,
  PanResponder,
  Animated,
  Dimensions,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Colors, Spacing, Typography, Shapes } from '../constants/Theme';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NotificationSettings } from './NotificationSettings';
import { Badge } from '../components/Badge';
import { Button } from '../components/Button';
import { Personalization, NotificationItem } from '../services/personalization';

const { width: screenWidth } = Dimensions.get('window');

// Custom swipeable item component using PanResponder
interface SwipeableItemProps {
  item: NotificationItem;
  isDarkMode: boolean;
  themeColors: any;
  onDelete: () => void;
  onToggleRead: () => void;
  onPress: () => void;
  onLongPress: () => void;
  selectionMode: boolean;
  isSelected: boolean;
  onSelectToggle: () => void;
  onViewIdea?: (ideaId: string) => void;
}

const SwipeableNotificationItem: React.FC<SwipeableItemProps> = ({
  item,
  isDarkMode,
  themeColors,
  onDelete,
  onToggleRead,
  onPress,
  onLongPress,
  selectionMode,
  isSelected,
  onSelectToggle,
  onViewIdea,
}) => {
  const panX = useRef(new Animated.Value(0)).current;

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => !selectionMode,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        // Only trigger horizontal swipe gestures
        return !selectionMode && Math.abs(gestureState.dx) > 10 && Math.abs(gestureState.dy) < 8;
      },
      onPanResponderMove: (_, gestureState) => {
        // Drag limiters
        let newX = gestureState.dx;
        if (newX > 80) newX = 80 + (newX - 80) * 0.2; // Dampen drag to right
        if (newX < -80) newX = -80 + (newX + 80) * 0.2; // Dampen drag to left
        panX.setValue(newX);
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dx < -50) {
          // Swipe Left: Show Delete (animate to open state)
          Animated.spring(panX, {
            toValue: -80,
            useNativeDriver: true,
          }).start();
        } else if (gestureState.dx > 50) {
          // Swipe Right: Show Read/Unread (animate to open state)
          Animated.spring(panX, {
            toValue: 80,
            useNativeDriver: true,
          }).start();
        } else {
          // Snap back
          Animated.spring(panX, {
            toValue: 0,
            useNativeDriver: true,
          }).start();
        }
      },
    })
  ).current;

  // Reset swipe state when selection mode changes
  useEffect(() => {
    if (selectionMode) {
      Animated.spring(panX, {
        toValue: 0,
        useNativeDriver: true,
      }).start();
    }
  }, [selectionMode]);

  const closeSwipe = () => {
    Animated.spring(panX, {
      toValue: 0,
      useNativeDriver: true,
    }).start();
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Opportunity Update':
        return 'briefcase';
      case 'Community Announcement':
        return 'megaphone';
      case 'Event Reminder':
        return 'calendar-clear';
      case 'New Message':
        return 'chatbubble-ellipses';
      case 'Connection Request':
        return 'person-add';
      case 'Achievement Badge':
        return 'trophy';
      case 'Application Status':
        return 'checkbox';
      case 'System Alert':
      default:
        return 'alert-circle';
    }
  };

  return (
    <View style={styles.itemContainer}>
      {/* Background Actions (Swipe layers) */}
      <View style={styles.actionsBackground}>
        {/* Left Action: Swipe Right (Mark as Read) */}
        <Pressable
          onPress={() => {
            onToggleRead();
            closeSwipe();
          }}
          style={[styles.actionLeft, { backgroundColor: themeColors.brandBackgroundSubtle }]}
        >
          <Ionicons
            name={item.unread ? 'mail-open-outline' : 'mail-outline'}
            size={22}
            color={themeColors.brandForeground1}
          />
          <Text style={[styles.actionText, { color: themeColors.brandForeground1 }]}>
            {item.unread ? 'Read' : 'Unread'}
          </Text>
        </Pressable>

        {/* Right Action: Swipe Left (Delete) */}
        <Pressable
          onPress={() => {
            onDelete();
            closeSwipe();
          }}
          style={[styles.actionRight, { backgroundColor: themeColors.dangerBackgroundSubtle }]}
        >
          <Ionicons name="trash-outline" size={22} color={themeColors.dangerForeground1} />
          <Text style={[styles.actionText, { color: themeColors.dangerForeground1 }]}>Delete</Text>
        </Pressable>
      </View>

      {/* Front Card Item */}
      <Animated.View
        style={[
          styles.itemCard,
          {
            backgroundColor: themeColors.neutralBackground1,
            borderColor: themeColors.neutralStroke2,
            opacity: item.unread ? 1 : 0.6, // Read vs Unread States (60% opacity)
            transform: [{ translateX: panX }],
          },
        ]}
        {...panResponder.panHandlers}
      >
        <Pressable
          onPress={selectionMode ? onSelectToggle : onPress}
          onLongPress={onLongPress}
          delayLongPress={600}
          style={styles.cardPressable}
        >
          {/* Checkbox (Visible only in selection mode) */}
          {selectionMode && (
            <Pressable onPress={onSelectToggle} style={styles.checkboxContainer}>
              <Ionicons
                name={isSelected ? 'checkbox' : 'square-outline'}
                size={22}
                color={isSelected ? themeColors.brandForeground1 : themeColors.neutralForegroundDisabled}
              />
            </Pressable>
          )}

          {/* Left Icon / Profile Avatar */}
          <View style={styles.avatarContainer}>
            {item.senderLogo ? (
              <Image source={{ uri: item.senderLogo }} style={styles.senderLogo} />
            ) : (
              <View style={[styles.fallbackIcon, { backgroundColor: themeColors.neutralBackground3 }]}>
                <Ionicons name={getCategoryIcon(item.category)} size={18} color={themeColors.neutralForeground2} />
              </View>
            )}
          </View>

          {/* Notification Contents */}
          <View style={styles.contentContainer}>
            <View style={styles.cardHeader}>
              <Text style={[Typography.bodyStrong, styles.senderName, { color: themeColors.neutralForeground1 }]}>
                {item.senderName}
              </Text>
              <Badge label={item.category} size="Small" intent="Informative" isDarkMode={isDarkMode} />
            </View>

            <Text style={[Typography.body, styles.messageBody, { color: themeColors.neutralForeground2 }]} numberOfLines={2}>
              {item.title}: {item.body}
            </Text>

            <Text style={[styles.timestampText, { color: themeColors.neutralForeground3 }]}>
              {item.timeLabel}
            </Text>

            {item.ideaId && (
              <View style={{ flexDirection: 'row', marginTop: Spacing.s, gap: Spacing.s }}>
                <Pressable
                  onPress={() => {
                    if (onViewIdea) onViewIdea(item.ideaId!);
                  }}
                  style={{
                    backgroundColor: themeColors.brandBackground,
                    paddingHorizontal: Spacing.s + 4,
                    paddingVertical: 6,
                    borderRadius: Shapes.rounded,
                  }}
                >
                  <Text style={{ color: '#ffffff', fontSize: 12, fontWeight: 'bold' }}>View</Text>
                </Pressable>
                <Pressable
                  onPress={onDelete}
                  style={{
                    borderWidth: 1,
                    borderColor: themeColors.neutralStroke1,
                    paddingHorizontal: Spacing.s + 4,
                    paddingVertical: 6,
                    borderRadius: Shapes.rounded,
                  }}
                >
                  <Text style={{ color: themeColors.neutralForeground2, fontSize: 12, fontWeight: 'bold' }}>Not interested</Text>
                </Pressable>
              </View>
            )}
          </View>
        </Pressable>
      </Animated.View>
    </View>
  );
};

// Main Screen Component
interface NotificationsScreenProps {
  isDarkMode?: boolean;
  onBack: () => void;
  onUnreadCountChange: (count: number) => void;
  onViewIdea?: (ideaId: string) => void;
}

const INITIAL_MOCK_NOTIFICATIONS: NotificationItem[] = [
  // Today's notifications
  {
    id: 'n_1',
    title: 'New Opportunity',
    body: 'Spend a few hours mentoring students and helping them build confidence through reading at Gudi guda ka naka.',
    category: 'Opportunity Update',
    timestamp: new Date(),
    timeLabel: '5m ago',
    unread: true,
    senderName: 'Pratham MP Education',
    senderLogo: 'https://images.unsplash.com/photo-1577896851231-70ef18881754?w=80',
  },
  {
    id: 'n_2',
    title: 'Account Alert',
    body: 'Your account was accessed from a new device in Lashkar, Gwalior.',
    category: 'System Alert',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
    timeLabel: '2h ago',
    unread: false,
    senderName: 'System Security',
    senderLogo: '',
  },
  // Yesterday's notifications
  {
    id: 'n_3',
    title: 'Connection Tagged You',
    body: 'Anita tagged you in the WASH Bio-Sand Well Rejuvenation Idea Thread. Review and show your interest.',
    category: 'New Message',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 18), // 18 hours ago
    timeLabel: 'Yesterday, 4:30 PM',
    unread: true,
    senderName: 'anita (Friend)',
    senderLogo: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80',
  },
  {
    id: 'n_4',
    title: 'Weekly Assembly Meeting',
    body: 'Weekly Gwalior environmental coalition meeting starts Sunday 10 AM at City Centre municipal hall.',
    category: 'Event Reminder',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 28), // 28 hours ago
    timeLabel: 'Yesterday, 10:15 AM',
    unread: false,
    senderName: 'Green Gwalior Group',
    senderLogo: 'https://images.unsplash.com/photo-1530595467537-0b5996c41f2d?w=80',
  },
  // Earlier dates
  {
    id: 'n_5',
    title: 'Community Announcements',
    body: 'CWS Taskforce has approved 4 new rural caseworkers. Welcome them in the community forum.',
    category: 'Community Announcement',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 6), // 6 days ago
    timeLabel: '12 Sept, 2:10 PM',
    unread: false,
    senderName: 'Child Welfare Service',
    senderLogo: 'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?w=80',
  },
  {
    id: 'n_6',
    title: 'New Achievement Earned',
    body: 'Congratulations! You unlocked the "Active Responder" badge for completing 3 micro-volunteering opportunities.',
    category: 'Achievement Badge',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 8), // 8 days ago
    timeLabel: '10 Sept, 9:00 AM',
    unread: false,
    senderName: 'Achievement Portal',
    senderLogo: '',
  },
];

const PAGINATION_OLDER_NOTIFICATIONS: NotificationItem[] = [
  {
    id: 'n_7',
    title: 'Casework Status Approved',
    body: 'Your registration renewal for East District Case Manager certification is approved and active.',
    category: 'Application Status',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 12),
    timeLabel: '6 Sept, 11:30 AM',
    unread: false,
    senderName: 'MP Welfare Council',
    senderLogo: '',
  },
  {
    id: 'n_8',
    title: 'New Connection Request',
    body: 'Sunita (WASH activist) sent you a connection request. Click to view and build your mutual network.',
    category: 'Connection Request',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 15),
    timeLabel: '3 Sept, 3:45 PM',
    unread: false,
    senderName: 'sunita',
    senderLogo: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=80',
  },
];

export const NotificationsScreen: React.FC<NotificationsScreenProps> = ({
  isDarkMode = false,
  onBack,
  onUnreadCountChange,
  onViewIdea,
}) => {
  const themeColors = isDarkMode ? Colors.dark : Colors.light;

  // Screen states
  const [notifications, setNotifications] = useState<NotificationItem[]>(Personalization.getNotifications());
  const [showSettings, setShowSettings] = useState(false);
  const [activeDetailNotification, setActiveDetailNotification] = useState<NotificationItem | null>(null);

  // Selection mode states
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Record<string, boolean>>({});

  // Pagination states
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [hasLoadedOlder, setHasLoadedOlder] = useState(false);

  // Update parent unread count badge and personalization store
  useEffect(() => {
    const unreadCount = notifications.filter(n => n.unread).length;
    onUnreadCountChange(unreadCount);
    Personalization.setNotifications(notifications);
  }, [notifications]);

  // --- Deletions and status edits ---
  const handleDeleteItem = (id: string) => {
    setNotifications(prev => prev.filter(item => item.id !== id));
  };

  const handleToggleReadItem = (id: string) => {
    setNotifications(prev =>
      prev.map(item => (item.id === id ? { ...item, unread: !item.unread } : item))
    );
  };

  const handleLongPressItem = (id: string) => {
    if (!selectionMode) {
      setSelectionMode(true);
      setSelectedIds({ [id]: true });
    }
  };

  const handleToggleSelectItem = (id: string) => {
    setSelectedIds(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleSelectAll = () => {
    const allSelected = notifications.every(n => selectedIds[n.id]);
    if (allSelected) {
      setSelectedIds({});
    } else {
      const newSelected: Record<string, boolean> = {};
      notifications.forEach(n => {
        newSelected[n.id] = true;
      });
      setSelectedIds(newSelected);
    }
  };

  const handleDeleteSelected = () => {
    const selectedCount = Object.values(selectedIds).filter(Boolean).length;
    if (selectedCount === 0) return;

    Alert.alert(
      "Confirm Delete",
      `Are you sure you want to delete ${selectedCount} selected notifications?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            setNotifications(prev => prev.filter(item => !selectedIds[item.id]));
            setSelectedIds({});
            setSelectionMode(false);
          },
        },
      ]
    );
  };

  // Exit selection mode
  const exitSelectionMode = () => {
    setSelectionMode(false);
    setSelectedIds({});
  };

  // --- Scroll Pagination ---
  const handleScroll = (event: any) => {
    if (loadingOlder || hasLoadedOlder) return;

    const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
    const paddingToBottom = 20;
    
    // Check if scrolled close to bottom
    const isAtBottom = layoutMeasurement.height + contentOffset.y >= contentSize.height - paddingToBottom;

    if (isAtBottom) {
      setLoadingOlder(true);
      // Simulate network request
      setTimeout(() => {
        setNotifications(prev => [...prev, ...PAGINATION_OLDER_NOTIFICATIONS]);
        setLoadingOlder(false);
        setHasLoadedOlder(true);
      }, 1500);
    }
  };

  // --- Grouping logic by dates ---
  const getGroupedNotifications = () => {
    const today: NotificationItem[] = [];
    const yesterday: NotificationItem[] = [];
    const earlier: NotificationItem[] = [];

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfYesterday = new Date(startOfToday.getTime() - 24 * 60 * 60 * 1000);

    notifications.forEach(item => {
      const itemDate = new Date(item.timestamp);
      if (itemDate >= startOfToday) {
        today.push(item);
      } else if (itemDate >= startOfYesterday) {
        yesterday.push(item);
      } else {
        earlier.push(item);
      }
    });

    return { today, yesterday, earlier };
  };

  const { today, yesterday, earlier } = getGroupedNotifications();
  const selectedCount = Object.values(selectedIds).filter(Boolean).length;

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: themeColors.neutralBackground2 }]}>
      
      {/* Header (Dual Mode: Selection Mode vs Navigation Mode) */}
      {selectionMode ? (
        <View style={[styles.header, { borderBottomColor: themeColors.neutralStroke2, backgroundColor: themeColors.neutralBackground1 }]}>
          <Pressable onPress={exitSelectionMode} style={styles.backButton}>
            <Ionicons name="close" size={24} color={themeColors.neutralForeground1} />
          </Pressable>
          <Text style={[Typography.bodyStrong, styles.headerTitle, { color: themeColors.neutralForeground1 }]}>
            {selectedCount} Selected
          </Text>
          <View style={styles.headerRightActions}>
            <Pressable onPress={handleSelectAll} style={styles.headerTextButton}>
              <Text style={[Typography.captionStrong, { color: themeColors.brandForeground1 }]}>Select All</Text>
            </Pressable>
            <Pressable onPress={handleDeleteSelected} style={styles.headerIconButton}>
              <Ionicons name="trash" size={20} color={themeColors.dangerForeground1} />
            </Pressable>
          </View>
        </View>
      ) : (
        <View style={[styles.header, { borderBottomColor: themeColors.neutralStroke2, backgroundColor: themeColors.neutralBackground1 }]}>
          <Pressable onPress={onBack} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={themeColors.neutralForeground1} />
          </Pressable>
          <Text style={[Typography.bodyStrong, styles.headerTitle, { color: themeColors.neutralForeground1 }]}>
            Notifications
          </Text>
          <View style={styles.headerRightActions}>
            <Pressable onPress={() => setShowSettings(true)} style={styles.headerIconButton}>
              <Ionicons name="settings-outline" size={20} color={themeColors.neutralForeground1} />
            </Pressable>
          </View>
        </View>
      )}

      {/* Main scrolling list */}
      <ScrollView
        onScroll={handleScroll}
        scrollEventThrottle={400}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {notifications.length === 0 ? (
          /* Empty state view */
          <View style={styles.emptyContainer}>
            <View style={[styles.emptyGraphicCircle, { backgroundColor: themeColors.brandBackgroundSubtle }]}>
              <Ionicons name="notifications-off-outline" size={48} color={themeColors.brandForeground1} />
            </View>
            <Text style={[styles.emptyTitle, Typography.subtitle, { color: themeColors.neutralForeground1 }]}>
              No Notifications Yet
            </Text>
            <Text style={[styles.emptySubtitle, Typography.body, { color: themeColors.neutralForeground3 }]}>
              You are all caught up! New alerts and opportunity updates will appear here.
            </Text>
          </View>
        ) : (
          <View>
            {/* Group 1: Today */}
            {today.length > 0 && (
              <View>
                <Text style={[styles.dateGroupLabel, { color: themeColors.neutralForeground3 }]}>
                  Today
                </Text>
                {today.map(item => (
                  <SwipeableNotificationItem
                    key={item.id}
                    item={item}
                    isDarkMode={isDarkMode}
                    themeColors={themeColors}
                    onDelete={() => handleDeleteItem(item.id)}
                    onToggleRead={() => handleToggleReadItem(item.id)}
                    onPress={() => setActiveDetailNotification(item)}
                    onLongPress={() => handleLongPressItem(item.id)}
                    selectionMode={selectionMode}
                    isSelected={!!selectedIds[item.id]}
                    onSelectToggle={() => handleToggleSelectItem(item.id)}
                  />
                ))}
              </View>
            )}

            {/* Group 2: Yesterday */}
            {yesterday.length > 0 && (
              <View>
                <Text style={[styles.dateGroupLabel, { color: themeColors.neutralForeground3 }]}>
                  Yesterday
                </Text>
                {yesterday.map(item => (
                  <SwipeableNotificationItem
                    key={item.id}
                    item={item}
                    isDarkMode={isDarkMode}
                    themeColors={themeColors}
                    onDelete={() => handleDeleteItem(item.id)}
                    onToggleRead={() => handleToggleReadItem(item.id)}
                    onPress={() => setActiveDetailNotification(item)}
                    onLongPress={() => handleLongPressItem(item.id)}
                    selectionMode={selectionMode}
                    isSelected={!!selectedIds[item.id]}
                    onSelectToggle={() => handleToggleSelectItem(item.id)}
                  />
                ))}
              </View>
            )}

            {/* Group 3: Earlier */}
            {earlier.length > 0 && (
              <View>
                <Text style={[styles.dateGroupLabel, { color: themeColors.neutralForeground3 }]}>
                  Earlier Dates
                </Text>
                {earlier.map(item => (
                  <SwipeableNotificationItem
                    key={item.id}
                    item={item}
                    isDarkMode={isDarkMode}
                    themeColors={themeColors}
                    onDelete={() => handleDeleteItem(item.id)}
                    onToggleRead={() => handleToggleReadItem(item.id)}
                    onPress={() => setActiveDetailNotification(item)}
                    onLongPress={() => handleLongPressItem(item.id)}
                    selectionMode={selectionMode}
                    isSelected={!!selectedIds[item.id]}
                    onSelectToggle={() => handleToggleSelectItem(item.id)}
                  />
                ))}
              </View>
            )}
          </View>
        )}

        {/* Loading Spinner for Pagination */}
        {loadingOlder && (
          <View style={styles.loaderContainer}>
            <ActivityIndicator size="small" color={themeColors.brandForeground1} />
            <Text style={[styles.loaderText, { color: themeColors.neutralForeground3 }]}>
              Loading older updates...
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Modal 1: Details Modal */}
      {activeDetailNotification && (
        <Modal visible={true} transparent animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={[styles.detailModal, { backgroundColor: themeColors.neutralBackground1, borderColor: themeColors.neutralStroke2 }]}>
              <View style={styles.detailHeader}>
                <Badge label={activeDetailNotification.category} intent="Brand" isDarkMode={isDarkMode} />
                <Pressable onPress={() => {
                  // Mark as read once opened
                  handleToggleReadItem(activeDetailNotification.id);
                  setActiveDetailNotification(null);
                }}>
                  <Ionicons name="close" size={24} color={themeColors.neutralForeground1} />
                </Pressable>
              </View>

              <ScrollView style={styles.detailScroll} showsVerticalScrollIndicator={false}>
                <View style={styles.detailSenderRow}>
                  {activeDetailNotification.senderLogo ? (
                    <Image source={{ uri: activeDetailNotification.senderLogo }} style={styles.detailSenderLogo} />
                  ) : (
                    <View style={[styles.detailFallbackIcon, { backgroundColor: themeColors.neutralBackground3 }]}>
                      <Ionicons name="person" size={24} color={themeColors.neutralForeground2} />
                    </View>
                  )}
                  <View>
                    <Text style={[Typography.bodyStrong, { color: themeColors.neutralForeground1 }]}>
                      {activeDetailNotification.senderName}
                    </Text>
                    <Text style={[Typography.caption, { color: themeColors.neutralForeground3 }]}>
                      {activeDetailNotification.timeLabel}
                    </Text>
                  </View>
                </View>

                <Text style={[Typography.subtitle, styles.detailTitle, { color: themeColors.neutralForeground1 }]}>
                  {activeDetailNotification.title}
                </Text>
                
                <Text style={[Typography.body, styles.detailBody, { color: themeColors.neutralForeground2 }]}>
                  {activeDetailNotification.body}
                </Text>
              </ScrollView>

              <View style={styles.detailButton}>
                <Button
                  label="Dismiss"
                  appearance="Primary"
                  onPress={() => {
                    // Mark as read once closed
                    if (activeDetailNotification.unread) {
                      handleToggleReadItem(activeDetailNotification.id);
                    }
                    setActiveDetailNotification(null);
                  }}
                  isDarkMode={isDarkMode}
                />
              </View>
            </View>
          </View>
        </Modal>
      )}

      {/* Modal 2: Settings Modal */}
      <Modal visible={showSettings} animationType="slide">
        <NotificationSettings isDarkMode={isDarkMode} onBack={() => setShowSettings(false)} />
      </Modal>

    </SafeAreaView>
  );
};

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
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 16,
  },
  headerRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerIconButton: {
    padding: Spacing.xxs,
    marginLeft: Spacing.xs,
  },
  headerTextButton: {
    paddingVertical: Spacing.xxs,
    paddingHorizontal: Spacing.xs,
  },
  scrollContent: {
    paddingVertical: Spacing.s,
    paddingHorizontal: Spacing.m,
    flexGrow: 1,
  },
  dateGroupLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'center',
    marginVertical: Spacing.s,
    opacity: 0.7,
  },
  itemContainer: {
    marginVertical: 4,
    height: 90,
    position: 'relative',
  },
  actionsBackground: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    borderRadius: Shapes.rounded,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    overflow: 'hidden',
  },
  actionLeft: {
    flex: 1,
    height: '100%',
    justifyContent: 'center',
    paddingLeft: Spacing.l,
  },
  actionRight: {
    flex: 1,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'flex-end',
    paddingRight: Spacing.l,
  },
  actionText: {
    fontSize: 10,
    fontWeight: 'bold',
    marginTop: 2,
  },
  itemCard: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    borderRadius: Shapes.rounded,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 2,
    elevation: 1,
  },
  cardPressable: {
    flexDirection: 'row',
    alignItems: 'center',
    height: '100%',
    paddingHorizontal: Spacing.m,
  },
  checkboxContainer: {
    marginRight: Spacing.s,
    padding: 2,
  },
  avatarContainer: {
    marginRight: Spacing.m,
  },
  senderLogo: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  fallbackIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  contentContainer: {
    flex: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  senderName: {
    fontSize: 13,
  },
  messageBody: {
    fontSize: 12,
    lineHeight: 16,
    marginBottom: 4,
  },
  timestampText: {
    fontSize: 10,
    alignSelf: 'flex-end',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xxl * 2,
  },
  emptyGraphicCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.l,
  },
  emptyTitle: {
    fontWeight: 'bold',
    marginBottom: Spacing.xs,
  },
  emptySubtitle: {
    textAlign: 'center',
    maxWidth: 280,
    lineHeight: 20,
  },
  loaderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.m,
  },
  loaderText: {
    fontSize: 12,
    marginLeft: Spacing.s,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.l,
  },
  detailModal: {
    width: '100%',
    maxHeight: '75%',
    borderRadius: Shapes.rounded * 2,
    borderWidth: 1,
    padding: Spacing.l,
    justifyContent: 'space-between',
  },
  detailHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.l,
  },
  detailScroll: {
    flexGrow: 0,
    marginBottom: Spacing.l,
  },
  detailSenderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.m,
  },
  detailSenderLogo: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginRight: Spacing.m,
  },
  detailFallbackIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginRight: Spacing.m,
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailTitle: {
    fontWeight: 'bold',
    marginBottom: Spacing.s,
  },
  detailBody: {
    lineHeight: 22,
  },
  detailButton: {
    width: '100%',
  },
});
