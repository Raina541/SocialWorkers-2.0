import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  Pressable,
  Image,
  Dimensions,
  Animated,
  Modal,
  FlatList,
  Platform,
  Keyboard,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Spacing, Typography, Shapes } from '../constants/Theme';
import { Ionicons } from '@expo/vector-icons';
import { Avatar } from '../components/Avatar';
import { Badge } from '../components/Badge';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// Use a beautiful premium magenta-red color for notification badges as requested
const MAGENTA_RED = '#d8246c';

interface Comment {
  id: string;
  author: {
    name: string;
    avatar: string;
  };
  text: string;
  time: string;
}

interface Message {
  id: string;
  type: 'text' | 'image' | 'poll' | 'system';
  author: {
    name: string;
    avatar: string;
    username: string;
  };
  text?: string;
  imageUri?: string;
  reactions: { icon: string; user: string }[];
  time: string;
  pollData?: {
    template: 'Event' | 'Time' | 'Day' | 'Venue';
    question: string;
    description?: string;
    options: { text: string; votes: string[] }[];
    totalVotes: number;
    owner: string;
  };
  comments?: Comment[];
}

interface EventItem {
  id: string;
  title: string;
  date: string;
  time: string;
  hostName: string;
  hostAvatar: string;
  attendees: string[];
  imageUri: string;
  pastPhotos?: string[];
  isPast?: boolean;
}

interface BlogItem {
  id: string;
  author: string;
  authorAvatar: string;
  title: string;
  excerpt: string;
  upvotes: number;
  comments: number;
}

interface CommunityDetailProps {
  isDarkMode?: boolean;
  communityName: string;
  memberCount: number;
  activeCount: number;
  initialIsMember?: boolean;
  onBack: () => void;
  onOpenDM: (name: string) => void;
}

export const CommunityDetail: React.FC<CommunityDetailProps> = ({
  isDarkMode = false,
  communityName,
  memberCount,
  activeCount,
  initialIsMember = false,
  onBack,
  onOpenDM,
}) => {
  const themeColors = isDarkMode ? Colors.dark : Colors.light;
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const insets = useSafeAreaInsets();

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

  const [isMember, setIsMember] = useState(initialIsMember);
  const [activeTab, setActiveTab] = useState<'About' | 'Discussions' | 'People' | 'Events' | 'Blogs' | 'Friends'>(
    initialIsMember ? 'Discussions' : 'People'
  );
  
  // Settings popup menu
  const [showSettingsMenu, setShowSettingsMenu] = useState(false);

  // UX enhancement states
  const [infoDrawerVisible, setInfoDrawerVisible] = useState(false);
  const [leftPanelVisible, setLeftPanelVisible] = useState(false);
  const [expandedComments, setExpandedComments] = useState<Record<string, boolean>>({});
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});

  // Undo Toast and Deduplication states
  const [undoMessageId, setUndoMessageId] = useState<string | null>(null);
  const [undoMessageText, setUndoMessageText] = useState<string>('');
  const [showUndoToast, setShowUndoToast] = useState(false);
  const [lastSentMsg, setLastSentMsg] = useState<{ text: string; timestamp: number } | null>(null);
  const [showDedupeConfirm, setShowDedupeConfirm] = useState(false);
  const undoTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Inline Editing message state
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState<string>('');

  // Expandable composer options
  const [showMoreComposerOptions, setShowMoreComposerOptions] = useState(false);

  // Floating Rising Emoji micro-animation states
  const [flyingEmoji, setFlyingEmoji] = useState<{ emoji: string; messageId: string } | null>(null);
  const flyAnimX = useRef(new Animated.Value(0)).current;
  const flyAnimY = useRef(new Animated.Value(0)).current;
  const flyAnimScale = useRef(new Animated.Value(1)).current;
  const flyAnimOpacity = useRef(new Animated.Value(0)).current;

  // Sidebar Slide animation
  const slideAnim = useRef(new Animated.Value(-screenWidth)).current;

  // Composer options FAB stack animation
  const composerOptionsAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (leftPanelVisible) {
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [leftPanelVisible]);

  const closeLeftPanel = () => {
    Animated.timing(slideAnim, {
      toValue: -screenWidth,
      duration: 250,
      useNativeDriver: true,
    }).start(() => {
      setLeftPanelVisible(false);
    });
  };

  useEffect(() => {
    if (showMoreComposerOptions) {
      Animated.spring(composerOptionsAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(composerOptionsAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [showMoreComposerOptions]);

  useEffect(() => {
    return () => {
      if (undoTimerRef.current) {
        clearTimeout(undoTimerRef.current);
      }
    };
  }, []);

  const toggleComments = (id: string) => {
    setExpandedComments((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const submitComment = (msgId: string) => {
    const text = commentInputs[msgId];
    if (!text || !text.trim()) return;

    setMessages((prev) =>
      prev.map((msg) => {
        if (msg.id === msgId) {
          const newComment: Comment = {
            id: `c_${Date.now()}`,
            author: { name: 'Me', avatar: '' },
            text: text.trim(),
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          };
          return {
            ...msg,
            comments: [...(msg.comments || []), newComment],
          };
        }
        return msg;
      })
    );

    setCommentInputs((prev) => ({
      ...prev,
      [msgId]: '',
    }));
  };
  const [notifPreference, setNotifPreference] = useState<'All' | 'Mentions' | 'Mute'>('All');
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Create Poll sheet
  const [pollModalVisible, setPollModalVisible] = useState(false);
  const [pollTemplate, setPollTemplate] = useState<'Event' | 'Time' | 'Day' | 'Venue' | null>(null);
  const [pollRawInput, setPollRawInput] = useState('');
  const [pollOptions, setPollOptions] = useState<string[]>(['', '']);

  // Reactor drawer
  const [reactorDrawerVisible, setReactorDrawerVisible] = useState(false);
  const [reactorList, setReactorList] = useState<{ icon: string; user: string }[]>([]);

  // Story Viewer modal
  const [storyViewerVisible, setStoryViewerVisible] = useState(false);
  const [storyPhotos, setStoryPhotos] = useState<string[]>([]);
  const [activeStoryIdx, setActiveStoryIdx] = useState(0);

  // Autocomplete Mentions overlay
  const [showMentions, setShowMentions] = useState(false);
  const [mentionFilter, setMentionFilter] = useState('');

  // Discussions list
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'm1',
      type: 'system',
      author: { name: 'System', avatar: '', username: '' },
      text: 'Riya joined the community',
      reactions: [],
      time: '9:00 AM',
    },
    {
      id: 'm2',
      type: 'text',
      author: { name: 'Aman Caseworker', avatar: '', username: 'amancw' },
      text: 'Hello everyone! Glad to join the CWS team here. Let me know if there are active cases in the North sector.',
      reactions: [{ icon: '❤️', user: 'Riya' }, { icon: '👍', user: 'Aman' }],
      time: '9:02 AM',
      comments: [
        {
          id: 'c1',
          author: { name: 'Riya coordinator', avatar: '' },
          text: 'Welcome Aman! Let’s coordinate on the book drive.',
          time: '9:05 AM',
        },
        {
          id: 'c2',
          author: { name: 'Jane Doe', avatar: '' },
          text: 'Glad you are here, Aman!',
          time: '9:08 AM',
        },
      ],
    },
    {
      id: 'm3',
      type: 'image',
      author: { name: 'Riya coordinator', avatar: '', username: 'riyacoord' },
      text: 'We set up our new distribution point in the community center today!',
      imageUri: 'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?w=600',
      reactions: [{ icon: '🔥', user: 'Aman' }, { icon: '👏', user: 'Jane' }],
      time: '9:15 AM',
      comments: [],
    },
  ]);

  // Events list
  const [events, setEvents] = useState<EventItem[]>([
    {
      id: 'e1',
      title: 'North Sector Book Donation drive',
      date: 'Sat, Jun 20',
      time: '10:00 AM',
      hostName: 'Riya coordinator',
      hostAvatar: '',
      attendees: ['Aman', 'Riya', 'Rahul', 'Neha'],
      imageUri: 'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?w=400',
      isPast: false,
    },
    {
      id: 'e2',
      title: 'Weekend Digital Literacy Workshop',
      date: 'Sat, Jun 6',
      time: '4:00 PM',
      hostName: 'Aman Caseworker',
      hostAvatar: '',
      attendees: ['Jane', 'Diana', 'Bob'],
      imageUri: 'https://images.unsplash.com/photo-1509062522246-3755977927d7?w=400',
      pastPhotos: [
        'https://images.unsplash.com/photo-1509062522246-3755977927d7?w=800',
        'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=800'
      ],
      isPast: true,
    },
  ]);

  // Blogs list
  const [blogs, setBlogs] = useState<BlogItem[]>([
    {
      id: 'b1',
      author: 'Jane Doe',
      authorAvatar: '',
      title: 'Bridging the Rural Education Deficit: 5 Lessons',
      excerpt: 'In our 6 months of distributing tablets across villages in MP, we discovered that peer learning groups outpaced formal teaching sessions...',
      upvotes: 42,
      comments: 12,
    },
  ]);

  // Members list
  const members = [
    { name: 'Riya coordinator', isFriend: true, bio: 'NGO District Lead', imageUri: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150' },
    { name: 'Aman Caseworker', isFriend: true, bio: 'Rural education advocate', imageUri: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150' },
    { name: 'Jane Doe', isFriend: true, bio: 'Volunteer tutor', imageUri: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150' },
    { name: 'Bob Smith', isFriend: false, bio: 'Community supporter', imageUri: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150' },
    { name: 'Alice Green', isFriend: false, bio: 'WASH engineer', imageUri: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150' },
  ];

  const [composerText, setComposerText] = useState('');

  const handleInputChange = (text: string) => {
    setComposerText(text);

    // Look for @mention triggers
    const words = text.split(' ');
    const lastWord = words[words.length - 1];
    if (lastWord.startsWith('@')) {
      setShowMentions(true);
      setMentionFilter(lastWord.slice(1).toLowerCase());
    } else {
      setShowMentions(false);
    }
  };

  const selectMention = (name: string) => {
    const words = composerText.split(' ');
    words[words.length - 1] = `@${name} `;
    setComposerText(words.join(' '));
    setShowMentions(false);
  };

  const handleSendText = (forceSend = false) => {
    if (!composerText.trim()) return;
    const text = composerText.trim();

    // Deduplication check: same text from 'Me' within 60s
    const now = Date.now();
    if (!forceSend && lastSentMsg && lastSentMsg.text === text && now - lastSentMsg.timestamp < 60000) {
      setShowDedupeConfirm(true);
      return;
    }

    const newId = now.toString();
    const newMsg: Message = {
      id: newId,
      type: 'text',
      author: { name: 'Me', avatar: '', username: 'me' },
      text: text,
      reactions: [],
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, newMsg]);
    setComposerText('');
    setLastSentMsg({ text, timestamp: now });

    // Show undo toast
    setUndoMessageId(newId);
    setUndoMessageText(text);
    setShowUndoToast(true);

    if (undoTimerRef.current) {
      clearTimeout(undoTimerRef.current);
    }
    undoTimerRef.current = setTimeout(() => {
      setShowUndoToast(false);
      setUndoMessageId(null);
    }, 5000);
  };

  const handleUndo = () => {
    if (!undoMessageId) return;
    setMessages((prev) => prev.filter((m) => m.id !== undoMessageId));
    setComposerText(undoMessageText);
    setShowUndoToast(false);
    setUndoMessageId(null);
    if (undoTimerRef.current) {
      clearTimeout(undoTimerRef.current);
    }
  };

  const renderHighlightedText = (text: string, query: string) => {
    if (!query) return <Text>{text}</Text>;
    const escapedQuery = query.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    const parts = text.split(new RegExp(`(${escapedQuery})`, 'gi'));
    return (
      <Text>
        {parts.map((part, index) => {
          const isMatch = part.toLowerCase() === query.toLowerCase();
          return isMatch ? (
            <Text
              key={index}
              style={{
                fontWeight: 'bold',
                backgroundColor: '#ffe066',
                color: '#000000',
              }}
            >
              {part}
            </Text>
          ) : (
            <Text key={index}>{part}</Text>
          );
        })}
      </Text>
    );
  };

  // Reactions long press picker
  const [activeMessageId, setActiveMessageId] = useState<string | null>(null);
  const [reactionModalVisible, setReactionModalVisible] = useState(false);

  const handleLongPressMsg = (id: string) => {
    setActiveMessageId(id);
    setReactionModalVisible(true);
  };

  const addReaction = (icon: string) => {
    if (!activeMessageId) return;

    const msgId = activeMessageId;
    let isAdding = false;

    setMessages((prev) =>
      prev.map((msg) => {
        if (msg.id === msgId) {
          // Check if reaction already exists
          const exists = msg.reactions.find((r) => r.icon === icon && r.user === 'Me');
          if (exists) {
            isAdding = false;
            return {
              ...msg,
              reactions: msg.reactions.filter((r) => !(r.icon === icon && r.user === 'Me')),
            };
          } else {
            isAdding = true;
            return {
              ...msg,
              reactions: [...msg.reactions, { icon, user: 'Me' }],
            };
          }
        }
        return msg;
      })
    );
    setReactionModalVisible(false);
    setActiveMessageId(null);

    // Trigger micro-animation if adding a reaction
    if (isAdding) {
      setFlyingEmoji({ emoji: icon, messageId: msgId });
      flyAnimX.setValue(0);
      flyAnimY.setValue(-100);
      flyAnimScale.setValue(0.3);
      flyAnimOpacity.setValue(1);

      Animated.parallel([
        Animated.spring(flyAnimY, {
          toValue: 0, // Drop down to final alignment position
          tension: 60,
          friction: 4, // low friction = high bounciness!
          useNativeDriver: true,
        }),
        Animated.spring(flyAnimScale, {
          toValue: 1.0,
          tension: 60,
          friction: 4,
          useNativeDriver: true,
        }),
      ]).start(() => {
        // Wait 400ms after landing, then fade it out cleanly
        setTimeout(() => {
          Animated.timing(flyAnimOpacity, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }).start(() => {
            setFlyingEmoji(null);
          });
        }, 400);
      });
    }
  };

  const handleOpenReactors = (reactions: { icon: string; user: string }[]) => {
    setReactorList(reactions);
    setReactorDrawerVisible(true);
  };

  // AI Event template resolver
  const handleAISuggestEvent = () => {
    if (!pollRawInput.trim()) return;

    // AI templates
    const cleanDraft = pollRawInput.toLowerCase();
    let finalTitle = 'Community Initiative';
    let finalDesc = pollRawInput;

    if (cleanDraft.includes('beach') || cleanDraft.includes('cleanup')) {
      finalTitle = '🔥 Beach Cleanup Volunteers Drive';
      finalDesc = 'An initiative to collect plastics and restore the local coastal belt. Keywords: ecology, plastic-free, civic-duty.';
    } else if (cleanDraft.includes('tutoring') || cleanDraft.includes('teaching')) {
      finalTitle = '📚 Children Evening Casework Class';
      finalDesc = 'Tutoring sessions for elementary student groups. Keywords: education, literacy, youth-mentor.';
    } else {
      finalTitle = `✨ Initiative: ${pollRawInput}`;
    }

    setPollRawInput('');
    setComposerText(`${finalTitle}\n${finalDesc}`);
    setPollModalVisible(false);
  };

  const handleCreatePoll = () => {
    if (!pollTemplate) return;

    let newPoll: Message = {
      id: Date.now().toString(),
      type: 'poll',
      author: { name: 'Me', avatar: '', username: 'me' },
      reactions: [],
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      pollData: {
        template: pollTemplate,
        question: pollTemplate === 'Event' ? 'Should we schedule this event?' : `Poll for ${pollTemplate}`,
        options: pollOptions
          .filter((opt) => opt.trim() !== '')
          .map((text) => ({ text, votes: [] })),
        totalVotes: 0,
        owner: 'Me',
      },
    };

    setMessages((prev) => [...prev, newPoll]);
    setPollOptions(['', '']);
    setPollTemplate(null);
    setPollModalVisible(false);
  };

  const votePollOption = (msgId: string, optIdx: number) => {
    setMessages((prev) =>
      prev.map((msg) => {
        if (msg.id === msgId && msg.pollData) {
          const updatedOptions = msg.pollData.options.map((opt, idx) => {
            if (idx === optIdx) {
              const voted = opt.votes.includes('Me');
              return {
                ...opt,
                votes: voted ? opt.votes.filter((u) => u !== 'Me') : [...opt.votes, 'Me'],
              };
            }
            return opt;
          });
          const total = updatedOptions.reduce((sum, o) => sum + o.votes.length, 0);
          return {
            ...msg,
            pollData: {
              ...msg.pollData,
              options: updatedOptions,
              totalVotes: total,
            },
          };
        }
        return msg;
      })
    );
  };

  const convertPollToEvent = (msgId: string) => {
    const msg = messages.find((m) => m.id === msgId);
    if (!msg || !msg.pollData) return;

    // Get winning option
    let winner = msg.pollData.options[0]?.text || 'TBD Option';
    let maxVotes = -1;
    msg.pollData.options.forEach((opt) => {
      if (opt.votes.length > maxVotes) {
        maxVotes = opt.votes.length;
        winner = opt.text;
      }
    });

    const newEvent: EventItem = {
      id: Date.now().toString(),
      title: `${msg.pollData.question} - ${winner}`,
      date: 'Upcoming Saturday',
      time: winner,
      hostName: 'Me',
      hostAvatar: '',
      attendees: ['Me'],
      imageUri: 'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?w=400',
    };

    setEvents((prev) => [newEvent, ...prev]);
    alert('Successfully converted poll winner to an Event!');
  };

  const handleOpenPastPhotos = (photos: string[]) => {
    setStoryPhotos(photos);
    setActiveStoryIdx(0);
    setStoryViewerVisible(true);
  };

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: themeColors.neutralBackground2,
          paddingBottom: keyboardHeight > 0 ? keyboardHeight : insets.bottom,
        },
      ]}
    >
      {/* Sticky Header */}
      {!searchOpen && (
        <View style={[styles.header, { backgroundColor: themeColors.neutralBackground1, borderBottomColor: themeColors.neutralStroke2 }]}>
          <Pressable onPress={onBack} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={themeColors.neutralForeground1} />
          </Pressable>
          
          {/* Square community logo to the left of heading */}
          <Pressable onPress={() => setLeftPanelVisible(true)} style={[styles.headerLogo, { backgroundColor: '#b4009e' }]}>
            <Ionicons name="people" size={18} color="#ffffff" />
          </Pressable>

          <Pressable onPress={() => setLeftPanelVisible(true)} style={styles.headerInfo}>
            <Text style={[Typography.bodyStrong, { color: themeColors.neutralForeground1, fontSize: 16 }]} numberOfLines={1}>
              {communityName}
            </Text>
            <Text style={[Typography.caption, { color: themeColors.neutralForeground2 }]}>
              {memberCount} members • {activeCount} active
            </Text>
          </Pressable>

          {/* Three dots menu */}
          <Pressable onPress={() => setShowSettingsMenu(!showSettingsMenu)} style={styles.menuButton}>
            <Ionicons name="ellipsis-vertical" size={20} color={themeColors.neutralForeground1} />
          </Pressable>
        </View>
      )}

      {/* Settings Menu Popup */}
      {showSettingsMenu && (
        <View style={[styles.settingsPopup, { backgroundColor: themeColors.neutralBackground1, borderColor: themeColors.neutralStroke2, width: 220 }]}>
          <Text style={[styles.popupTitle, Typography.captionStrong, { color: themeColors.neutralForeground2 }]}>
            NOTIFICATIONS
          </Text>
          {(['All', 'Mentions', 'Mute'] as const).map((pref) => (
            <Pressable
              key={pref}
              onPress={() => {
                setNotifPreference(pref);
                setShowSettingsMenu(false);
              }}
              style={styles.popupItem}
            >
              <Text style={[Typography.body, { color: notifPreference === pref ? MAGENTA_RED : themeColors.neutralForeground1 }]}>
                {pref} {pref === 'All' ? 'Announcements' : pref === 'Mentions' ? 'Only @Mentions' : 'Muted'}
              </Text>
              {notifPreference === pref && (
                <Ionicons name="checkmark" size={16} color={MAGENTA_RED} />
              )}
            </Pressable>
          ))}
          <View style={[styles.divider, { backgroundColor: themeColors.neutralStroke2 }]} />
          
          {/* Discussions page-specific search */}
          {activeTab === 'Discussions' && (
            <Pressable
              onPress={() => {
                setSearchOpen(true);
                setShowSettingsMenu(false);
              }}
              style={styles.popupItem}
            >
              <Text style={[Typography.body, { color: themeColors.neutralForeground1 }]}>Search Chat</Text>
              <Ionicons name="search-outline" size={16} color={themeColors.neutralForeground2} />
            </Pressable>
          )}

          {/* About page-specific details */}
          {activeTab === 'About' && (
            <>
              <Pressable
                onPress={() => {
                  setShowSettingsMenu(false);
                  alert('Guidelines copied to clipboard!');
                }}
                style={styles.popupItem}
              >
                <Text style={[Typography.body, { color: themeColors.neutralForeground1 }]}>Copy Guidelines</Text>
                <Ionicons name="copy-outline" size={16} color={themeColors.neutralForeground2} />
              </Pressable>
              <Pressable
                onPress={() => {
                  setShowSettingsMenu(false);
                  alert('Sharing community link...');
                }}
                style={styles.popupItem}
              >
                <Text style={[Typography.body, { color: themeColors.neutralForeground1 }]}>Share Community</Text>
                <Ionicons name="share-social-outline" size={16} color={themeColors.neutralForeground2} />
              </Pressable>
            </>
          )}

          {/* People page-specific search/invites */}
          {activeTab === 'People' && (
            <>
              <Pressable
                onPress={() => {
                  setShowSettingsMenu(false);
                  alert('Invite link copied!');
                }}
                style={styles.popupItem}
              >
                <Text style={[Typography.body, { color: themeColors.neutralForeground1 }]}>Invite Members</Text>
                <Ionicons name="person-add-outline" size={16} color={themeColors.neutralForeground2} />
              </Pressable>
              <Pressable
                onPress={() => {
                  setShowSettingsMenu(false);
                  alert('Searching members...');
                }}
                style={styles.popupItem}
              >
                <Text style={[Typography.body, { color: themeColors.neutralForeground1 }]}>Search Members</Text>
                <Ionicons name="search-outline" size={16} color={themeColors.neutralForeground2} />
              </Pressable>
            </>
          )}

          {/* Events page-specific calendar details */}
          {activeTab === 'Events' && (
            <>
              <Pressable
                onPress={() => {
                  setShowSettingsMenu(false);
                  setPollTemplate(null);
                  setPollModalVisible(true);
                }}
                style={styles.popupItem}
              >
                <Text style={[Typography.body, { color: themeColors.neutralForeground1 }]}>Create Event Interest</Text>
                <Ionicons name="calendar-outline" size={16} color={themeColors.neutralForeground2} />
              </Pressable>
              <Pressable
                onPress={() => {
                  setShowSettingsMenu(false);
                  alert('Reminder added to event calendar!');
                }}
                style={styles.popupItem}
              >
                <Text style={[Typography.body, { color: themeColors.neutralForeground1 }]}>Add Event Calendar</Text>
                <Ionicons name="time-outline" size={16} color={themeColors.neutralForeground2} />
              </Pressable>
            </>
          )}

          {/* Blogs page-specific write blog */}
          {activeTab === 'Blogs' && (
            <Pressable
              onPress={() => {
                setShowSettingsMenu(false);
                alert('Drafting blog post...');
              }}
              style={styles.popupItem}
            >
              <Text style={[Typography.body, { color: themeColors.neutralForeground1 }]}>Write Blog Post</Text>
              <Ionicons name="create-outline" size={16} color={themeColors.neutralForeground2} />
            </Pressable>
          )}
        </View>
      )}

      {/* Search Header Replacement */}
      {searchOpen && (
        <View style={[styles.searchBar, { backgroundColor: themeColors.neutralBackground1, borderBottomColor: themeColors.neutralStroke2, height: 56 }]}>
          <Pressable
            onPress={() => {
              setSearchQuery('');
              setSearchOpen(false);
            }}
            style={{ padding: 6 }}
          >
            <Ionicons
              name="arrow-back"
              size={22}
              color={themeColors.neutralForeground1}
            />
          </Pressable>
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search messages or people..."
            placeholderTextColor={themeColors.neutralForegroundDisabled}
            style={[styles.searchInput, { color: themeColors.neutralForeground1, marginLeft: 8 }]}
            autoFocus
          />
          {searchQuery.length > 0 && (
            <Pressable onPress={() => setSearchQuery('')} style={{ padding: 8 }}>
              <Ionicons name="close-circle" size={20} color={themeColors.neutralForeground3} />
            </Pressable>
          )}
        </View>
      )}

      {/* Navigation tabs removed from main view */}

      {/* Non-Member Banner */}
      {!isMember && (
        <View style={[styles.whyJoinBanner, { backgroundColor: isDarkMode ? '#1e3a24' : '#edf7ee', borderColor: isDarkMode ? '#107c41' : '#c8e6c9' }]}>
          <Text style={[Typography.captionStrong, { color: isDarkMode ? '#a2e0b1' : '#1b5e20' }]}>
            Why Join?
          </Text>
          <Text style={[Typography.caption, { color: themeColors.neutralForeground1, marginTop: 2 }]}>
            3 events scheduled this month • 12 active volunteers joined this week
          </Text>
        </View>
      )}

      {/* Tab Content Area */}
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {activeTab === 'About' && (
          <View style={styles.tabContentPanel}>
            {/* Cause Category Badge (magenta red as per constraints) */}
            <View style={styles.infoSection}>
              <Text style={[Typography.captionStrong, { color: themeColors.neutralForeground2, marginBottom: Spacing.xs }]}>
                CAUSE CATEGORY
              </Text>
              <View style={[styles.customBadge, { backgroundColor: MAGENTA_RED, marginBottom: Spacing.m }]}>
                <Text style={styles.customBadgeText}>Child Welfare & Family Support</Text>
              </View>
            </View>

            {/* Description */}
            <View style={styles.infoSection}>
              <Text style={[Typography.captionStrong, { color: themeColors.neutralForeground2, marginBottom: Spacing.xs }]}>
                COMMUNITY DESCRIPTION
              </Text>
              <Text style={[Typography.body, { color: themeColors.neutralForeground1, lineHeight: 20, marginBottom: Spacing.m }]}>
                This community is dedicated to protecting child rights, promoting welfare, and supporting caseworkers in managing family relief efforts. We share active cases, coordinate food/book donation drives, host literacy workshops, and collaborate on emergency relocations in the North and Central sectors.
              </Text>
            </View>

            {/* Coordination Guidelines */}
            <View style={styles.infoSection}>
              <Text style={[Typography.captionStrong, { color: themeColors.neutralForeground2, marginBottom: Spacing.xs }]}>
                COORDINATION RULES
              </Text>
              <Text style={[Typography.caption, { color: themeColors.neutralForeground2, lineHeight: 18 }]}>
                • Respect caseworker privacy: do not share sensitive child ID details directly in discussions. Use Direct Messages for specific case handovers.{"\n"}
                • Keep content professional and community-focused.{"\n"}
                • To schedule a volunteer event, post a poll first to gather interest.
              </Text>
            </View>
          </View>
        )}

        {activeTab === 'Discussions' && isMember && (
          <View style={styles.feedContainer}>
            {/* Render all non-system chat messages */}
            {messages
              .filter((m) => m.type !== 'system')
              .filter((m) =>
                searchQuery ? m.text?.toLowerCase().includes(searchQuery.toLowerCase()) : true
              )
              .map((msg) => {
                const commentsCount = msg.comments?.length || 0;
                const isExpanded = !!expandedComments[msg.id];
                const isMe = msg.author.name === 'Me' || msg.author.username === 'me';
                
                return (
                  <View key={msg.id} style={styles.msgCard}>
                    <Pressable
                      onLongPress={() => handleLongPressMsg(msg.id)}
                      style={[
                        styles.msgBubble,
                        {
                          backgroundColor: isMe ? themeColors.brandBackgroundSubtle : themeColors.neutralBackground1,
                          borderColor: isMe ? themeColors.brandForeground1 : themeColors.neutralStroke2,
                          borderWidth: isMe ? 1.5 : 1,
                        },
                      ]}
                    >
                      {/* Floating Bouncy Drop-In Emoji micro-animation */}
                      {flyingEmoji && flyingEmoji.messageId === msg.id && (
                        <Animated.Text
                          style={[
                            styles.flyingEmoji,
                            {
                              transform: [
                                { translateX: flyAnimX },
                                { translateY: flyAnimY },
                                { scale: flyAnimScale },
                              ],
                              opacity: flyAnimOpacity,
                            },
                          ]}
                        >
                          {flyingEmoji.emoji}
                        </Animated.Text>
                      )}

                      <View style={styles.msgHeader}>
                        {/* Avatar size increased to 120% */}
                        <Avatar size={30} name={msg.author.name} isDarkMode={isDarkMode} />
                        <Text style={[Typography.bodyStrong, { color: themeColors.neutralForeground1, marginLeft: 6 }]}>
                          {msg.author.name}
                        </Text>
                      </View>

                      {msg.type === 'image' && msg.imageUri && (
                        <Image source={{ uri: msg.imageUri }} style={styles.msgImage} resizeMode="cover" />
                      )}

                      {msg.text && (
                        editingMessageId === msg.id ? (
                          <View style={styles.inlineEditContainer}>
                            <TextInput
                              value={editingText}
                              onChangeText={setEditingText}
                              style={[
                                styles.inlineEditTextInput,
                                {
                                  color: themeColors.neutralForeground1,
                                  borderColor: themeColors.neutralStroke1,
                                  backgroundColor: themeColors.neutralBackground2,
                                }
                              ]}
                              multiline
                              autoFocus
                            />
                            <View style={styles.inlineEditButtons}>
                              <Pressable
                                onPress={() => {
                                  if (editingText.trim()) {
                                    setMessages((prev) =>
                                      prev.map((m) => (m.id === msg.id ? { ...m, text: editingText.trim() } : m))
                                    );
                                  }
                                  setEditingMessageId(null);
                                  setEditingText('');
                                }}
                                style={[styles.inlineEditBtn, { backgroundColor: themeColors.brandForeground1 }]}
                              >
                                <Text style={styles.inlineEditBtnText}>Save</Text>
                              </Pressable>
                              <Pressable
                                onPress={() => {
                                  setEditingMessageId(null);
                                  setEditingText('');
                                }}
                                style={[styles.inlineEditBtn, { backgroundColor: 'transparent' }]}
                              >
                                <Text style={[styles.inlineEditBtnText, { color: themeColors.neutralForeground2 }]}>Cancel</Text>
                              </Pressable>
                            </View>
                          </View>
                        ) : (
                          <Text style={[Typography.body, { color: themeColors.neutralForeground1, marginTop: 4 }]}>
                            {renderHighlightedText(msg.text, searchQuery)}
                          </Text>
                        )
                      )}

                      {/* Render Poll card */}
                      {msg.type === 'poll' && msg.pollData && (
                        <View style={[styles.pollCard, { backgroundColor: themeColors.neutralBackground2, borderColor: themeColors.neutralStroke1 }]}>
                          <Text style={[Typography.bodyStrong, { color: themeColors.neutralForeground1 }]}>
                            {msg.pollData.question}
                          </Text>
                          {msg.pollData.description && (
                            <Text style={[Typography.caption, { color: themeColors.neutralForeground2, marginBottom: 8 }]}>
                              {msg.pollData.description}
                            </Text>
                          )}

                          {msg.pollData.options.map((opt, oIdx) => {
                            const voted = opt.votes.includes('Me');
                            const total = msg.pollData!.totalVotes || 1;
                            const percent = Math.round((opt.votes.length / total) * 100);
                            return (
                              <Pressable
                                key={opt.text}
                                onPress={() => votePollOption(msg.id, oIdx)}
                                style={[
                                  styles.pollOptionRow,
                                  {
                                    backgroundColor: themeColors.neutralBackground1,
                                    borderColor: voted ? MAGENTA_RED : themeColors.neutralStroke1,
                                  },
                                ]}
                              >
                                <View style={[styles.pollFill, { width: `${percent}%`, backgroundColor: voted ? 'rgba(216, 36, 108, 0.12)' : 'rgba(0, 0, 0, 0.05)' }]} />
                                <Text style={[Typography.body, { color: themeColors.neutralForeground1, paddingLeft: 8 }]}>
                                  {opt.text}
                                </Text>
                                <Text style={[Typography.captionStrong, { color: themeColors.neutralForeground2, marginLeft: 'auto', paddingRight: 8 }]}>
                                  {percent}% ({opt.votes.length})
                                </Text>
                              </Pressable>
                            );
                          })}

                          {/* Poll action owner */}
                          {msg.pollData.owner === 'Me' && (
                            <View style={styles.pollOwnerControls}>
                              <View style={[styles.aiSummaryChip, { backgroundColor: themeColors.neutralBackground1 }]}>
                                <Ionicons name="sparkles" size={12} color={themeColors.brandForeground1} />
                                <Text style={[Typography.captionStrong, { color: themeColors.brandForeground1, marginLeft: 4 }]}>
                                  {msg.pollData.totalVotes >= 5 ? 'Strong interest. Ready to schedule!' : 'Needs more feedback.'}
                                </Text>
                              </View>
                              <Pressable
                                onPress={() => convertPollToEvent(msg.id)}
                                style={[styles.convertButton, { backgroundColor: themeColors.brandForeground1 }]}
                              >
                                <Text style={styles.convertButtonText}>Convert to Event</Text>
                              </Pressable>
                            </View>
                          )}
                        </View>
                      )}

                      {/* Action Row */}
                      <View style={styles.msgActions}>
                        <Pressable onPress={() => toggleComments(msg.id)} style={styles.actionItem}>
                          <Ionicons
                            name={isExpanded ? "chatbubble" : "chatbubble-outline"}
                            size={16}
                            color={isExpanded ? themeColors.brandForeground1 : themeColors.neutralForeground2}
                          />
                          <Text style={[Typography.caption, { color: isExpanded ? themeColors.brandForeground1 : themeColors.neutralForeground2, marginLeft: 4 }]}>
                            Comment {commentsCount > 0 ? `(${commentsCount})` : ''}
                          </Text>
                        </Pressable>
                        
                        {/* Timestamp moves to bottom-right of card and reduced font size */}
                        <Text style={[Typography.caption, { color: themeColors.neutralForeground3, marginLeft: 'auto', fontSize: 10, alignSelf: 'center' }]}>
                          {msg.time}
                        </Text>
                      </View>

                      {/* Display reaction badges */}
                      {msg.reactions.length > 0 && (
                        <Pressable
                          onPress={() => handleOpenReactors(msg.reactions)}
                          style={[
                            styles.reactionRowBadge,
                            {
                              backgroundColor: themeColors.neutralBackground2,
                              borderColor: themeColors.neutralStroke2,
                            },
                          ]}
                        >
                          {Array.from(new Set(msg.reactions.map((r) => r.icon))).map((ic, iIdx) => (
                            <Text key={iIdx} style={styles.reactEmojiBadge}>
                              {ic}
                            </Text>
                          ))}
                        </Pressable>
                      )}

                      {/* Inline comments thread */}
                      {isExpanded && (
                        <View style={[styles.commentsSection, { borderTopColor: themeColors.neutralStroke2 }]}>
                          {(msg.comments || []).map((comm) => (
                            <View key={comm.id} style={styles.commentRow}>
                              {/* Avatar size increased to 120% */}
                              <Avatar size={24} name={comm.author.name} isDarkMode={isDarkMode} />
                              <View style={[styles.commentContent, { backgroundColor: isDarkMode ? '#2d2d2d' : '#f5f5f5' }]}>
                                <View style={styles.commentHeader}>
                                  <Text style={[Typography.captionStrong, { color: themeColors.neutralForeground1 }]}>
                                    {comm.author.name}
                                  </Text>
                                  <Text style={[styles.commentTime, { color: themeColors.neutralForeground3 }]}>
                                    {comm.time}
                                  </Text>
                                </View>
                                <Text style={[styles.commentText, { color: themeColors.neutralForeground2 }]}>
                                  {comm.text}
                                </Text>
                              </View>
                            </View>
                          ))}

                          {/* Write Comment box */}
                          <View style={styles.commentInputRow}>
                            <TextInput
                              value={commentInputs[msg.id] || ''}
                              onChangeText={(txt) => setCommentInputs((prev) => ({ ...prev, [msg.id]: txt }))}
                              placeholder="Write a comment..."
                              placeholderTextColor={themeColors.neutralForegroundDisabled}
                              style={[
                                styles.commentInput,
                                {
                                  color: themeColors.neutralForeground1,
                                  borderColor: themeColors.neutralStroke2,
                                  backgroundColor: themeColors.neutralBackground2,
                                },
                              ]}
                            />
                            <Pressable
                              onPress={() => submitComment(msg.id)}
                              disabled={!(commentInputs[msg.id] || '').trim()}
                              style={[
                                styles.commentSendBtn,
                                {
                                  backgroundColor: (commentInputs[msg.id] || '').trim()
                                    ? themeColors.brandForeground1
                                    : 'transparent',
                                },
                              ]}
                            >
                              <Ionicons
                                name="send"
                                size={12}
                                color={(commentInputs[msg.id] || '').trim() ? '#ffffff' : themeColors.neutralForegroundDisabled}
                              />
                            </Pressable>
                          </View>
                        </View>
                      )}
                    </Pressable>
                  </View>
                );
              })}

            {/* Reposition system join messages & suggestions to the bottom of discussions */}
            {messages
              .filter((m) => m.type === 'system')
              .map((msg) => (
                <View key={msg.id} style={styles.systemMsg}>
                  <Text style={[Typography.caption, { color: themeColors.neutralForeground3 }]}>
                    {msg.text}
                  </Text>
                  {msg.text?.includes('joined') && (
                    <View style={styles.quickReplies}>
                      {['Say hi 👋', 'Welcome!', "Hi, glad you're here"].map((reply) => (
                        <Pressable
                          key={reply}
                          onPress={() => setComposerText(reply)}
                          style={[
                            styles.quickChip,
                            {
                              backgroundColor: themeColors.neutralBackground1,
                              borderColor: themeColors.neutralStroke2,
                            },
                          ]}
                        >
                          <Text style={[Typography.captionStrong, { color: themeColors.brandForeground1 }]}>
                            {reply}
                          </Text>
                        </Pressable>
                      ))}
                    </View>
                  )}
                </View>
              ))}
          </View>
        )}

        {activeTab === 'People' && (
          <View style={styles.tabContentPanel}>
            {/* Friends Section */}
            <Text style={[styles.sectionTitle, Typography.sectionHeading, { color: themeColors.neutralForeground1 }]}>
              Friends in this Community
            </Text>
            {members
              .filter((m) => m.isFriend)
              .map((item) => (
                <View key={item.name} style={[styles.personRow, { borderBottomColor: themeColors.neutralStroke2 }]}>
                  {/* Avatar size increased to 120% */}
                  <Avatar size={44} name={item.name} imageUri={item.imageUri} isDarkMode={isDarkMode} />
                  <View style={{ marginLeft: Spacing.s, flex: 1 }}>
                    <Text style={[Typography.bodyStrong, { color: themeColors.neutralForeground1 }]}>{item.name}</Text>
                    <Text style={[Typography.caption, { color: themeColors.neutralForeground2 }]}>{item.bio}</Text>
                  </View>
                  <Pressable
                    onPress={() => onOpenDM(item.name)}
                    style={[styles.messageRowBtn, { borderColor: themeColors.neutralStroke1 }]}
                  >
                    <Ionicons name="chatbubble-ellipses-outline" size={18} color={themeColors.brandForeground1} />
                  </Pressable>
                </View>
              ))}

            {/* Other Members Section */}
            <Text style={[styles.sectionTitle, Typography.sectionHeading, { color: themeColors.neutralForeground1, marginTop: Spacing.l }]}>
              Other Members
            </Text>
            {members
              .filter((m) => !m.isFriend)
              .map((item) => (
                <View key={item.name} style={[styles.personRow, { borderBottomColor: themeColors.neutralStroke2 }]}>
                  {/* Avatar size increased to 120% */}
                  <Avatar size={44} name={item.name} imageUri={item.imageUri} isDarkMode={isDarkMode} />
                  <View style={{ marginLeft: Spacing.s, flex: 1 }}>
                    <Text style={[Typography.bodyStrong, { color: themeColors.neutralForeground1 }]}>{item.name}</Text>
                    <Text style={[Typography.caption, { color: themeColors.neutralForeground2 }]}>{item.bio}</Text>
                  </View>
                  <Pressable style={[styles.addFriendRowBtn, { backgroundColor: themeColors.brandForeground1 }]}>
                    <Text style={styles.addFriendBtnText}>Add Friend</Text>
                  </Pressable>
                </View>
              ))}
          </View>
        )}

        {activeTab === 'Friends' && !isMember && (
          <View style={styles.tabContentPanel}>
            <Text style={[Typography.body, { color: themeColors.neutralForeground2, marginBottom: Spacing.m, textAlign: 'center' }]}>
              Here are your friends who have already joined this community:
            </Text>
            {members
              .filter((m) => m.isFriend)
              .map((item) => (
                <View key={item.name} style={[styles.personRow, { borderBottomColor: themeColors.neutralStroke2 }]}>
                  {/* Avatar size increased to 120% */}
                  <Avatar size={44} name={item.name} imageUri={item.imageUri} isDarkMode={isDarkMode} />
                  <View style={{ marginLeft: Spacing.s, flex: 1 }}>
                    <Text style={[Typography.bodyStrong, { color: themeColors.neutralForeground1 }]}>{item.name}</Text>
                    <Text style={[Typography.caption, { color: themeColors.neutralForeground2 }]}>{item.bio}</Text>
                  </View>
                </View>
              ))}
          </View>
        )}

        {activeTab === 'Events' && (
          <View style={styles.tabContentPanel}>
            {/* Upcoming Events */}
            <Text style={[styles.sectionTitle, Typography.sectionHeading, { color: themeColors.neutralForeground1 }]}>
              Upcoming Events
            </Text>
            {events
              .filter((ev) => !ev.isPast)
              .map((item) => (
                <View key={item.id} style={[styles.eventCard, { backgroundColor: themeColors.neutralBackground1, borderColor: themeColors.neutralStroke2 }]}>
                  <Image source={{ uri: item.imageUri }} style={styles.eventThumbnail} />
                  <View style={styles.eventDetails}>
                    <Text style={[Typography.bodyStrong, { color: themeColors.neutralForeground1 }]}>
                      {item.title}
                    </Text>
                    <Text style={[Typography.caption, { color: MAGENTA_RED, marginVertical: 2 }]}>
                      {item.date} at {item.time}
                    </Text>
                    <View style={styles.hostRow}>
                      {/* Avatar size increased to 120% */}
                      <Avatar size={24} name={item.hostName} isDarkMode={isDarkMode} />
                      <Text style={[Typography.captionStrong, { color: themeColors.neutralForeground2, marginLeft: 4 }]}>
                        {item.hostName}
                      </Text>
                    </View>
                    <Text style={[Typography.caption, { color: themeColors.neutralForeground3, marginTop: 4 }]}>
                      {item.attendees.slice(0, 2).join(', ')} +{item.attendees.length - 2} joined
                    </Text>
                  </View>
                </View>
              ))}

            {/* Past Events */}
            <Text style={[styles.sectionTitle, Typography.sectionHeading, { color: themeColors.neutralForeground1, marginTop: Spacing.l }]}>
              Past Events
            </Text>
            {events
              .filter((ev) => ev.isPast)
              .map((item) => (
                <View key={item.id} style={[styles.eventCard, { backgroundColor: themeColors.neutralBackground1, borderColor: themeColors.neutralStroke2 }]}>
                  <View style={styles.thumbnailContainer}>
                    <Image source={{ uri: item.imageUri }} style={styles.eventThumbnail} />
                    {item.pastPhotos && item.pastPhotos.length > 0 && (
                      <Pressable
                        onPress={() => handleOpenPastPhotos(item.pastPhotos!)}
                        style={styles.playOverlay}
                      >
                        <Ionicons name="play-circle" size={36} color="#ffffff" />
                      </Pressable>
                    )}
                  </View>
                  <View style={styles.eventDetails}>
                    <Text style={[Typography.bodyStrong, { color: themeColors.neutralForeground1 }]}>
                      {item.title}
                    </Text>
                    <Text style={[Typography.caption, { color: themeColors.neutralForeground3, marginVertical: 2 }]}>
                      Completed
                    </Text>
                    <View style={styles.hostRow}>
                      {/* Avatar size increased to 120% */}
                      <Avatar size={24} name={item.hostName} isDarkMode={isDarkMode} />
                      <Text style={[Typography.captionStrong, { color: themeColors.neutralForeground2, marginLeft: 4 }]}>
                        {item.hostName}
                      </Text>
                    </View>
                  </View>
                </View>
              ))}
          </View>
        )}

        {activeTab === 'Blogs' && isMember && (
          <View style={styles.tabContentPanel}>
            {blogs.map((item) => (
              <View key={item.id} style={[styles.blogCard, { backgroundColor: themeColors.neutralBackground1, borderColor: themeColors.neutralStroke2 }]}>
                <View style={styles.blogAuthor}>
                  {/* Avatar size increased to 120% */}
                  <Avatar size={30} name={item.author} isDarkMode={isDarkMode} />
                  <Text style={[Typography.captionStrong, { color: themeColors.neutralForeground2, marginLeft: 6 }]}>
                    {item.author}
                  </Text>
                </View>
                <Text style={[Typography.bodyStrong, { color: themeColors.neutralForeground1, marginTop: Spacing.xs }]}>
                  {item.title}
                </Text>
                <Text style={[Typography.body, { color: themeColors.neutralForeground2, marginTop: 4 }]} numberOfLines={3}>
                  {item.excerpt}
                </Text>
                
                <View style={styles.blogFooter}>
                  <View style={styles.blogVote}>
                    <Pressable style={styles.voteBtn}>
                      <Ionicons name="caret-up" size={18} color={themeColors.neutralForeground2} />
                    </Pressable>
                    <Text style={[Typography.captionStrong, { color: themeColors.neutralForeground1 }]}>
                      {item.upvotes}
                    </Text>
                    <Pressable style={styles.voteBtn}>
                      <Ionicons name="caret-down" size={18} color={themeColors.neutralForeground2} />
                    </Pressable>
                  </View>
                  
                  <View style={styles.blogComments}>
                    <Ionicons name="chatbox-outline" size={16} color={themeColors.neutralForeground2} />
                    <Text style={[Typography.captionStrong, { color: themeColors.neutralForeground2, marginLeft: 4 }]}>
                      {item.comments} Comments
                    </Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Non-Member Join Sticky Button */}
      {!isMember && (
        <View style={[styles.joinContainer, { backgroundColor: themeColors.neutralBackground1, borderTopColor: themeColors.neutralStroke2 }]}>
          <Pressable
            onPress={() => {
              setIsMember(true);
              setActiveTab('Discussions');
            }}
            style={[styles.joinButton, { backgroundColor: themeColors.brandForeground1 }]}
          >
            <Text style={styles.joinButtonText}>Join Community</Text>
          </Pressable>
        </View>
      )}

      {/* Member Input Composer */}
      {isMember && activeTab === 'Discussions' && (
        <View style={styles.composerWrapper}>
          {/* Autocomplete mentions overlay */}
          {showMentions && (
            <View style={[styles.mentionOverlay, { backgroundColor: themeColors.neutralBackground1, borderColor: themeColors.neutralStroke2 }]}>
              <Text style={[styles.mentionHeader, Typography.captionStrong, { color: themeColors.neutralForeground2 }]}>
                MENTION MEMBER
              </Text>
              {members
                .filter((m) => m.name.toLowerCase().includes(mentionFilter))
                .map((m) => (
                  <Pressable
                    key={m.name}
                    onPress={() => selectMention(m.name.split(' ')[0])}
                    style={styles.mentionRow}
                  >
                    {/* Avatar size increased to 120% */}
                    <Avatar size={30} name={m.name} imageUri={m.imageUri} isDarkMode={isDarkMode} />
                    <Text style={[Typography.bodyStrong, { color: themeColors.neutralForeground1, marginLeft: 8 }]}>
                      {m.name}
                    </Text>
                  </Pressable>
                ))}
            </View>
          )}

          {/* Vertical Options bubble list stacked above composer */}
          {showMoreComposerOptions && (
            <Animated.View
              style={[
                styles.verticalOptionsContainer,
                {
                  opacity: composerOptionsAnim,
                  transform: [
                    {
                      translateY: composerOptionsAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [50, 0],
                      }),
                    },
                    {
                      scale: composerOptionsAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0.8, 1],
                      }),
                    },
                  ],
                },
              ]}
            >
              {/* Option 2: Poll */}
              <Pressable
                onPress={() => {
                  setShowMoreComposerOptions(false);
                  setPollTemplate(null);
                  setPollModalVisible(true);
                }}
                style={[styles.verticalOptionRow, { backgroundColor: themeColors.neutralBackground1 }]}
              >
                <View style={[styles.verticalOptionCircle, { backgroundColor: themeColors.brandBackgroundSubtle }]}>
                  <Ionicons name="bar-chart-outline" size={20} color={themeColors.brandForeground1} />
                </View>
                <View style={styles.verticalOptionLabel}>
                  <Text style={[Typography.captionStrong, { color: themeColors.neutralForeground1 }]}>Poll</Text>
                </View>
              </Pressable>

              {/* Option 1: Attachment */}
              <Pressable
                onPress={() => {
                  setShowMoreComposerOptions(false);
                  alert('Attachment selected!');
                }}
                style={[styles.verticalOptionRow, { backgroundColor: themeColors.neutralBackground1 }]}
              >
                <View style={[styles.verticalOptionCircle, { backgroundColor: themeColors.brandBackgroundSubtle }]}>
                  <Ionicons name="attach" size={20} color={themeColors.brandForeground1} />
                </View>
                <View style={styles.verticalOptionLabel}>
                  <Text style={[Typography.captionStrong, { color: themeColors.neutralForeground1 }]}>Attachment</Text>
                </View>
              </Pressable>
            </Animated.View>
          )}

          <View style={[styles.composer, { backgroundColor: themeColors.neutralBackground1, borderTopColor: themeColors.neutralStroke2 }]}>
            <Pressable
              style={styles.composerIcon}
              onPress={() => setShowMoreComposerOptions(!showMoreComposerOptions)}
            >
              <Ionicons
                name={showMoreComposerOptions ? "close" : "add"}
                size={24}
                color={showMoreComposerOptions ? themeColors.brandForeground1 : themeColors.neutralForeground2}
              />
            </Pressable>

            <TextInput
              value={composerText}
              onChangeText={handleInputChange}
              placeholder="Message..."
              placeholderTextColor={themeColors.neutralForegroundDisabled}
              style={[styles.input, { color: themeColors.neutralForeground1 }]}
              multiline
            />

            <Pressable
              onPress={() => handleSendText(false)}
              disabled={!composerText.trim()}
              style={[
                styles.sendButton,
                { backgroundColor: composerText.trim() ? themeColors.brandForeground1 : 'transparent' },
              ]}
            >
              <Ionicons
                name="send"
                size={18}
                color={composerText.trim() ? '#ffffff' : themeColors.neutralForegroundDisabled}
              />
            </Pressable>
          </View>

          {/* Undo Toast UI overlay */}
          {showUndoToast && (
            <View style={[styles.undoToast, { backgroundColor: '#222222' }]}>
              <Text style={styles.undoToastText}>Message posted</Text>
              <Pressable onPress={handleUndo} style={styles.undoButton}>
                <Text style={styles.undoButtonText}>Undo</Text>
              </Pressable>
            </View>
          )}
        </View>
      )}

      {/* Long Press Reaction Modal with Context Menu */}
      <Modal visible={reactionModalVisible} transparent animationType="fade">
        <Pressable
          style={styles.reactionOverlay}
          onPress={() => {
            setReactionModalVisible(false);
            setActiveMessageId(null);
          }}
        >
          <Pressable style={styles.reactionMenuContainer} onPress={(e) => e.stopPropagation()}>
            <View style={[styles.reactionContainer, { backgroundColor: themeColors.neutralBackground1 }]}>
              {['❤️', '👍', '🔥', '👏', '💡'].map((emoji) => {
                const activeMsg = messages.find((m) => m.id === activeMessageId);
                const hasReacted = activeMsg?.reactions.some((r) => r.icon === emoji && r.user === 'Me');
                return (
                  <Pressable
                    key={emoji}
                    onPress={() => addReaction(emoji)}
                    style={[
                      styles.reactionEmojiButton,
                      hasReacted && {
                        backgroundColor: themeColors.brandBackgroundSubtle,
                        borderRadius: 16,
                      }
                    ]}
                  >
                    <Text style={styles.reactionEmojiText}>{emoji}</Text>
                  </Pressable>
                );
              })}
            </View>
            
            <View style={[styles.longPressMenu, { backgroundColor: themeColors.neutralBackground1 }]}>
              {/* Edit Message */}
              {(() => {
                const msg = messages.find((m) => m.id === activeMessageId);
                const isMe = msg?.author.name === 'Me' || msg?.author.username === 'me';
                if (isMe && msg?.type === 'text') {
                  return (
                    <Pressable
                      onPress={() => {
                        setEditingMessageId(msg.id);
                        setEditingText(msg.text || '');
                        setReactionModalVisible(false);
                        setActiveMessageId(null);
                      }}
                      style={styles.longPressMenuItem}
                    >
                      <Ionicons name="pencil-outline" size={20} color={themeColors.neutralForeground1} />
                      <Text style={[Typography.body, { color: themeColors.neutralForeground1, marginLeft: 12 }]}>
                        Edit Message
                      </Text>
                    </Pressable>
                  );
                }
                return null;
              })()}

              {/* Delete Message */}
              {(() => {
                const msg = messages.find((m) => m.id === activeMessageId);
                const isMe = msg?.author.name === 'Me' || msg?.author.username === 'me';
                if (isMe) {
                  return (
                    <Pressable
                      onPress={() => {
                        if (activeMessageId) {
                          setMessages((prev) => prev.filter((m) => m.id !== activeMessageId));
                        }
                        setReactionModalVisible(false);
                        setActiveMessageId(null);
                      }}
                      style={styles.longPressMenuItem}
                    >
                      <Ionicons name="trash-outline" size={20} color="#ff3b30" />
                      <Text style={[Typography.body, { color: '#ff3b30', marginLeft: 12 }]}>
                        Delete Message
                      </Text>
                    </Pressable>
                  );
                }
                return null;
              })()}

              <Pressable
                onPress={() => {
                  setReactionModalVisible(false);
                  setActiveMessageId(null);
                  alert('Message link copied to clipboard!');
                }}
                style={styles.longPressMenuItem}
              >
                <Ionicons name="share-social-outline" size={20} color={themeColors.neutralForeground1} />
                <Text style={[Typography.body, { color: themeColors.neutralForeground1, marginLeft: 12 }]}>
                  Share Message
                </Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Deduplication Confirmation Modal */}
      <Modal visible={showDedupeConfirm} transparent animationType="fade">
        <View style={styles.dedupeOverlay}>
          <View style={[styles.dedupeContainer, { backgroundColor: themeColors.neutralBackground1 }]}>
            <Text style={[Typography.bodyStrong, { color: themeColors.neutralForeground1, fontSize: 16, marginBottom: 8 }]}>
              Post again?
            </Text>
            <Text style={[Typography.body, { color: themeColors.neutralForeground2, marginBottom: 20 }]}>
              You just sent this message. Are you sure you want to post it again?
            </Text>
            <View style={styles.dedupeButtons}>
              <Pressable
                onPress={() => {
                  setShowDedupeConfirm(false);
                  handleSendText(true);
                }}
                style={[styles.dedupeBtn, { backgroundColor: themeColors.brandForeground1 }]}
              >
                <Text style={styles.dedupeBtnText}>Confirm</Text>
              </Pressable>
              <Pressable
                onPress={() => setShowDedupeConfirm(false)}
                style={[styles.dedupeBtn, { backgroundColor: 'transparent', borderWidth: 1, borderColor: themeColors.neutralStroke1 }]}
              >
                <Text style={[styles.dedupeBtnText, { color: themeColors.neutralForeground1 }]}>Cancel</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* Reactors bottom drawer */}
      <Modal visible={reactorDrawerVisible} animationType="slide" transparent>
        <View style={styles.bottomDrawerOverlay}>
          <View style={[styles.bottomDrawer, { backgroundColor: themeColors.neutralBackground1 }]}>
            <View style={styles.drawerHeader}>
              <Text style={[Typography.bodyStrong, { color: themeColors.neutralForeground1 }]}>
                Reactions
              </Text>
              <Pressable onPress={() => setReactorDrawerVisible(false)} style={styles.closeDrawerBtn}>
                <Ionicons name="close" size={20} color={themeColors.neutralForeground1} />
              </Pressable>
            </View>
            <FlatList
              data={reactorList}
              keyExtractor={(item, index) => index.toString()}
              renderItem={({ item }) => (
                <View style={styles.reactorRow}>
                  <Text style={{ fontSize: 20, marginRight: 8 }}>{item.icon}</Text>
                  {/* Avatar size increased to 120% */}
                  <Avatar size={30} name={item.user} isDarkMode={isDarkMode} />
                  <Text style={[Typography.bodyStrong, { color: themeColors.neutralForeground1, marginLeft: 8 }]}>
                    {item.user}
                  </Text>
                </View>
              )}
              contentContainerStyle={{ paddingHorizontal: Spacing.m, paddingBottom: Spacing.xl }}
            />
          </View>
        </View>
      </Modal>

      {/* Poll Creation Modal Sheet */}
      <Modal visible={pollModalVisible} animationType="slide" transparent>
        <View style={styles.bottomDrawerOverlay}>
          <View style={[styles.bottomDrawer, { backgroundColor: themeColors.neutralBackground1 }]}>
            <View style={styles.drawerHeader}>
              <Text style={[Typography.subtitle, { color: themeColors.neutralForeground1 }]}>
                Create Poll
              </Text>
              <Pressable onPress={() => setPollModalVisible(false)} style={styles.closeDrawerBtn}>
                <Ionicons name="close" size={24} color={themeColors.neutralForeground1} />
              </Pressable>
            </View>

            {!pollTemplate ? (
              /* Templates Selector */
              <View style={styles.templatesGrid}>
                <Text style={[Typography.body, { color: themeColors.neutralForeground2, marginBottom: Spacing.s }]}>
                  Choose a Template
                </Text>
                
                <Pressable
                  onPress={() => setPollTemplate('Event')}
                  style={[styles.templateCard, { backgroundColor: themeColors.neutralBackground2, borderColor: themeColors.neutralStroke1 }]}
                >
                  <Ionicons name="calendar-outline" size={24} color={themeColors.brandForeground1} />
                  <View style={{ marginLeft: 12 }}>
                    <Text style={[Typography.bodyStrong, { color: themeColors.neutralForeground1 }]}>Event Interest</Text>
                    <Text style={[Typography.caption, { color: themeColors.neutralForeground2 }]}>AI-Draft interest poll for events</Text>
                  </View>
                </Pressable>

                <Pressable
                  onPress={() => { setPollTemplate('Time'); setPollOptions(['5:00 PM', '6:00 PM', '7:00 PM']); }}
                  style={[styles.templateCard, { backgroundColor: themeColors.neutralBackground2, borderColor: themeColors.neutralStroke1 }]}
                >
                  <Ionicons name="time-outline" size={24} color={themeColors.brandForeground1} />
                  <View style={{ marginLeft: 12 }}>
                    <Text style={[Typography.bodyStrong, { color: themeColors.neutralForeground1 }]}>Preferred Time</Text>
                    <Text style={[Typography.caption, { color: themeColors.neutralForeground2 }]}>Pre-filled candidate hours</Text>
                  </View>
                </Pressable>

                <Pressable
                  onPress={() => { setPollTemplate('Day'); setPollOptions(['Saturday', 'Sunday', 'Next Friday']); }}
                  style={[styles.templateCard, { backgroundColor: themeColors.neutralBackground2, borderColor: themeColors.neutralStroke1 }]}
                >
                  <Ionicons name="calendar-number-outline" size={24} color={themeColors.brandForeground1} />
                  <View style={{ marginLeft: 12 }}>
                    <Text style={[Typography.bodyStrong, { color: themeColors.neutralForeground1 }]}>Preferred Day</Text>
                    <Text style={[Typography.caption, { color: themeColors.neutralForeground2 }]}>Pre-filled week days</Text>
                  </View>
                </Pressable>

                <Pressable
                  onPress={() => { setPollTemplate('Venue'); setPollOptions(['Society Hall', 'Community Center', 'Local Ground']); }}
                  style={[styles.templateCard, { backgroundColor: themeColors.neutralBackground2, borderColor: themeColors.neutralStroke1 }]}
                >
                  <Ionicons name="location-outline" size={24} color={themeColors.brandForeground1} />
                  <View style={{ marginLeft: 12 }}>
                    <Text style={[Typography.bodyStrong, { color: themeColors.neutralForeground1 }]}>Venue Location</Text>
                    <Text style={[Typography.caption, { color: themeColors.neutralForeground2 }]}>Select candidate sites</Text>
                  </View>
                </Pressable>
              </View>
            ) : (
              /* Template Setup Form */
              <View style={styles.pollSetupForm}>
                <Pressable onPress={() => setPollTemplate(null)} style={styles.backTemplate}>
                  <Ionicons name="chevron-back" size={14} color={themeColors.brandForeground1} />
                  <Text style={{ color: themeColors.brandForeground1, fontSize: 13, marginLeft: 2 }}>Back to Templates</Text>
                </Pressable>

                {pollTemplate === 'Event' ? (
                  /* AI Event generator draft */
                  <View>
                    <Text style={[Typography.bodyStrong, { color: themeColors.neutralForeground1, marginBottom: 4 }]}>
                      Write your Event idea in plain words
                    </Text>
                    <TextInput
                      value={pollRawInput}
                      onChangeText={setPollRawInput}
                      placeholder="e.g. beach cleanup this Sat morning"
                      placeholderTextColor={themeColors.neutralForegroundDisabled}
                      style={[styles.input, { color: themeColors.neutralForeground1, backgroundColor: themeColors.neutralBackground2, borderColor: themeColors.neutralStroke1 }]}
                    />
                    <Pressable
                      onPress={handleAISuggestEvent}
                      disabled={!pollRawInput.trim()}
                      style={[styles.aiGenerateBtn, { backgroundColor: themeColors.brandForeground1 }]}
                    >
                      <Ionicons name="sparkles" size={16} color="#ffffff" style={{ marginRight: 6 }} />
                      <Text style={styles.aiGenerateBtnText}>AI Suggest Draft & Format</Text>
                    </Pressable>
                  </View>
                ) : (
                  /* Option Editor for time/day/venue */
                  <View>
                    <Text style={[Typography.bodyStrong, { color: themeColors.neutralForeground1, marginBottom: 8 }]}>
                      Edit candidate choices ({pollTemplate})
                    </Text>
                    {pollOptions.map((opt, idx) => (
                      <TextInput
                        key={idx}
                        value={opt}
                        onChangeText={(txt) => {
                          const updated = [...pollOptions];
                          updated[idx] = txt;
                          setPollOptions(updated);
                        }}
                        placeholder={`Option ${idx + 1}`}
                        placeholderTextColor={themeColors.neutralForegroundDisabled}
                        style={[styles.input, { color: themeColors.neutralForeground1, backgroundColor: themeColors.neutralBackground2, borderColor: themeColors.neutralStroke1, marginBottom: Spacing.s }]}
                      />
                    ))}
                    <Pressable
                      onPress={() => setPollOptions([...pollOptions, ''])}
                      style={styles.addOptionBtn}
                    >
                      <Ionicons name="add" size={16} color={themeColors.brandForeground1} />
                      <Text style={{ color: themeColors.brandForeground1, fontSize: 13, fontWeight: 'bold', marginLeft: 4 }}>Add Option</Text>
                    </Pressable>

                    <Pressable
                      onPress={handleCreatePoll}
                      style={[styles.createPollSubmit, { backgroundColor: themeColors.brandForeground1 }]}
                    >
                      <Text style={styles.createPollSubmitText}>Publish Poll</Text>
                    </Pressable>
                  </View>
                )}
              </View>
            )}
          </View>
        </View>
      </Modal>

      {/* Past Event Story Viewer Modal */}
      <Modal visible={storyViewerVisible} transparent animationType="fade">
        <View style={styles.storyViewerOverlay}>
          <Pressable
            style={styles.storyCloseArea}
            onPress={() => setStoryViewerVisible(false)}
          />
          {storyPhotos[activeStoryIdx] && (
            <View style={styles.storyImageWrapper}>
              {/* Progress bars */}
              <View style={styles.storyProgressList}>
                {storyPhotos.map((s, idx) => (
                  <View
                    key={idx}
                    style={[
                      styles.storyProgressBar,
                      {
                        backgroundColor: idx <= activeStoryIdx ? '#ffffff' : 'rgba(255, 255, 255, 0.3)',
                      },
                    ]}
                  />
                ))}
              </View>

              <Image source={{ uri: storyPhotos[activeStoryIdx] }} style={styles.storyViewerImage} />
              
              {/* Story navigation tap zones */}
              <View style={styles.storyNavigation}>
                <Pressable
                  style={styles.storyNavHalf}
                  onPress={() => activeStoryIdx > 0 && setActiveStoryIdx(activeStoryIdx - 1)}
                />
                <Pressable
                  style={styles.storyNavHalf}
                  onPress={() =>
                    activeStoryIdx < storyPhotos.length - 1
                      ? setActiveStoryIdx(activeStoryIdx + 1)
                      : setStoryViewerVisible(false)
                  }
                />
              </View>

              <Pressable onPress={() => setStoryViewerVisible(false)} style={styles.storyCloseBtn}>
                <Ionicons name="close" size={24} color="#ffffff" />
              </Pressable>
            </View>
          )}
        </View>
      </Modal>

      {/* Left Side Navigation Panel Custom slide-in overlay */}
      {leftPanelVisible && (
        <View style={StyleSheet.absoluteFill}>
          <Pressable style={styles.leftPanelOverlay} onPress={closeLeftPanel} />
          <Animated.View
            style={[
              styles.leftPanelContentAbsolute,
              {
                backgroundColor: themeColors.neutralBackground1,
                transform: [{ translateX: slideAnim }],
              }
            ]}
          >
            <View style={[styles.leftPanelHeader, { borderBottomColor: themeColors.neutralStroke2 }]}>
              {/* Back button chevron to exit individual community view */}
              <Pressable
                onPress={() => {
                  closeLeftPanel();
                  onBack();
                }}
                style={styles.leftPanelBackButton}
              >
                <Ionicons name="arrow-back" size={24} color={themeColors.neutralForeground1} />
              </Pressable>

              <View style={[styles.headerLogo, { backgroundColor: '#b4009e', marginLeft: Spacing.xs }]}>
                <Ionicons name="people" size={18} color="#ffffff" />
              </View>
              <View style={styles.headerInfo}>
                <Text style={[Typography.bodyStrong, { color: themeColors.neutralForeground1, fontSize: 16 }]} numberOfLines={1}>
                  {communityName}
                </Text>
                <Text style={[Typography.caption, { color: themeColors.neutralForeground2 }]}>
                  {memberCount} members • {activeCount} active
                </Text>
              </View>
            </View>

            <View style={styles.leftPanelTabsStack}>
              {([
                { id: 'About', icon: 'information-circle-outline' },
                { id: 'Discussions', icon: 'chatbubble-ellipses-outline' },
                { id: 'People', icon: 'people-outline' },
                { id: 'Events', icon: 'calendar-outline' },
                { id: 'Blogs', icon: 'document-text-outline' },
              ] as const).map((tab) => {
                const active = activeTab === tab.id;
                return (
                  <Pressable
                    key={tab.id}
                    onPress={() => {
                      setActiveTab(tab.id as any);
                      closeLeftPanel();
                    }}
                    style={[
                      styles.leftPanelTabItem,
                      active && { backgroundColor: themeColors.brandBackgroundSubtle }
                    ]}
                  >
                    <Ionicons
                      name={tab.icon as any}
                      size={20}
                      color={active ? themeColors.brandForeground1 : themeColors.neutralForeground2}
                    />
                    <Text
                      style={[
                        Typography.bodyStrong,
                        {
                          color: active ? themeColors.brandForeground1 : themeColors.neutralForeground1,
                          marginLeft: Spacing.s,
                        }
                      ]}
                    >
                      {tab.id}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </Animated.View>
        </View>
      )}

      {/* Community Info Drawer Modal (covers 90% screen height) */}
      <Modal visible={infoDrawerVisible} animationType="slide" transparent>
        <View style={styles.bottomDrawerOverlay}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setInfoDrawerVisible(false)} />
          
          <View style={[styles.bottomDrawer, styles.infoDrawer, { backgroundColor: themeColors.neutralBackground1 }]}>
            {/* Drag Handle */}
            <Pressable onPress={() => setInfoDrawerVisible(false)} style={styles.drawerHandleWrapper}>
              <View style={[styles.drawerHandle, { backgroundColor: themeColors.neutralStroke2 }]} />
            </Pressable>

            <View style={styles.drawerHeader}>
              <Text style={[Typography.subtitle, { color: themeColors.neutralForeground1 }]} numberOfLines={1}>
                About Community
              </Text>
              <Pressable onPress={() => setInfoDrawerVisible(false)} style={styles.closeDrawerBtn}>
                <Ionicons name="close" size={24} color={themeColors.neutralForeground1} />
              </Pressable>
            </View>

            <ScrollView contentContainerStyle={styles.infoDrawerContent} showsVerticalScrollIndicator={false}>
              {/* Square Logo large */}
              <View style={styles.infoLogoContainer}>
                <View style={[styles.infoLargeLogo, { backgroundColor: '#b4009e' }]}>
                  <Ionicons name="people" size={48} color="#ffffff" />
                </View>
                <Text style={[Typography.subtitle, { color: themeColors.neutralForeground1, marginTop: Spacing.s, textAlign: 'center' }]}>
                  {communityName}
                </Text>
                
                <Text style={[Typography.caption, { color: themeColors.neutralForeground2, marginTop: 4 }]}>
                  {memberCount} registered volunteers • {activeCount} active now
                </Text>
              </View>

              <View style={[styles.divider, { backgroundColor: themeColors.neutralStroke2, marginVertical: Spacing.m }]} />

              {/* Cause Category Badge (magenta red as per constraints) */}
              <View style={styles.infoSection}>
                <Text style={[Typography.captionStrong, { color: themeColors.neutralForeground2, marginBottom: Spacing.xs }]}>
                  CAUSE CATEGORY
                </Text>
                <View style={[styles.customBadge, { backgroundColor: MAGENTA_RED }]}>
                  <Text style={styles.customBadgeText}>Child Welfare & Family Support</Text>
                </View>
              </View>

              <View style={[styles.divider, { backgroundColor: themeColors.neutralStroke2, marginVertical: Spacing.m }]} />

              {/* Description */}
              <View style={styles.infoSection}>
                <Text style={[Typography.captionStrong, { color: themeColors.neutralForeground2, marginBottom: Spacing.xs }]}>
                  COMMUNITY DESCRIPTION
                </Text>
                <Text style={[Typography.body, { color: themeColors.neutralForeground1, lineHeight: 20 }]}>
                  This community is dedicated to protecting child rights, promoting welfare, and supporting caseworkers in managing family relief efforts. We share active cases, coordinate food/book donation drives, host literacy workshops, and collaborate on emergency relocations in the North and Central sectors.
                </Text>
              </View>

              <View style={[styles.divider, { backgroundColor: themeColors.neutralStroke2, marginVertical: Spacing.m }]} />

              {/* Coordination Guidelines */}
              <View style={styles.infoSection}>
                <Text style={[Typography.captionStrong, { color: themeColors.neutralForeground2, marginBottom: Spacing.xs }]}>
                  COORDINATION RULES
                </Text>
                <Text style={[Typography.caption, { color: themeColors.neutralForeground2, lineHeight: 18 }]}>
                  • Respect caseworker privacy: do not share sensitive child ID details directly in discussions. Use Direct Messages for specific case handovers.{"\n"}
                  • Keep content professional and community-focused.{"\n"}
                  • To schedule a volunteer event, post a poll first to gather interest.
                </Text>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.s,
    borderBottomWidth: 1,
    zIndex: 10,
  },
  backButton: {
    padding: Spacing.xs,
  },
  headerInfo: {
    marginLeft: Spacing.xs,
    flex: 1,
  },
  menuButton: {
    padding: Spacing.s,
  },
  settingsPopup: {
    position: 'absolute',
    top: 56,
    right: 12,
    borderRadius: 8,
    borderWidth: 1,
    padding: Spacing.xs,
    width: 200,
    zIndex: 100,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  popupTitle: {
    fontSize: 9,
    paddingHorizontal: Spacing.s,
    paddingVertical: 4,
  },
  popupItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.s,
    paddingVertical: Spacing.s,
  },
  divider: {
    height: 1,
    marginVertical: 4,
  },
  searchBar: {
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.m,
    borderBottomWidth: 1,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    paddingVertical: 6,
  },
  tabBar: {
    height: 40,
    flexDirection: 'row',
    borderBottomWidth: 1,
  },
  tabItem: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  tabIndicator: {
    position: 'absolute',
    bottom: 0,
    height: 3,
    width: '40%',
    borderTopLeftRadius: 3,
    borderTopRightRadius: 3,
  },
  whyJoinBanner: {
    paddingHorizontal: Spacing.m,
    paddingVertical: Spacing.s,
    borderBottomWidth: 1,
  },
  scrollContent: {
    paddingBottom: 80,
  },
  feedContainer: {
    padding: Spacing.m,
  },
  systemMsg: {
    alignItems: 'center',
    marginVertical: Spacing.s,
  },
  quickReplies: {
    flexDirection: 'row',
    gap: 6,
    marginTop: Spacing.xs,
  },
  quickChip: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  msgCard: {
    marginBottom: Spacing.m,
  },
  msgBubble: {
    padding: Spacing.m,
    borderRadius: 12,
    borderWidth: 1,
  },
  msgHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  msgImage: {
    width: '100%',
    height: 180,
    borderRadius: 8,
    marginVertical: Spacing.xs,
  },
  msgActions: {
    flexDirection: 'row',
    marginTop: Spacing.s,
    gap: Spacing.l,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: Spacing.s,
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  reactionRowBadge: {
    position: 'absolute',
    bottom: -10,
    right: 12,
    flexDirection: 'row',
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  reactEmojiBadge: {
    fontSize: 12,
  },
  tabContentPanel: {
    padding: Spacing.m,
  },
  sectionTitle: {
    marginBottom: Spacing.s,
  },
  personRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.s,
    borderBottomWidth: 1,
  },
  messageRowBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addFriendRowBtn: {
    paddingHorizontal: Spacing.s,
    paddingVertical: 6,
    borderRadius: 4,
  },
  addFriendBtnText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: 'bold',
  },
  eventCard: {
    flexDirection: 'row',
    borderRadius: 8,
    borderWidth: 1,
    padding: Spacing.s,
    marginBottom: Spacing.s,
  },
  thumbnailContainer: {
    position: 'relative',
    width: 72,
    height: 72,
    borderRadius: 4,
    overflow: 'hidden',
  },
  eventThumbnail: {
    width: 72,
    height: 72,
    borderRadius: 4,
  },
  playOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  eventDetails: {
    flex: 1,
    marginLeft: Spacing.s,
    justifyContent: 'center',
  },
  hostRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  blogCard: {
    borderRadius: 8,
    borderWidth: 1,
    padding: Spacing.m,
    marginBottom: Spacing.s,
  },
  blogAuthor: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  blogFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: Spacing.m,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: Spacing.s,
  },
  blogVote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  voteBtn: {
    padding: 4,
  },
  blogComments: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  joinContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 60,
    justifyContent: 'center',
    paddingHorizontal: Spacing.m,
    borderTopWidth: 1,
  },
  joinButton: {
    height: 40,
    borderRadius: Shapes.rounded,
    justifyContent: 'center',
    alignItems: 'center',
  },
  joinButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  composerWrapper: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  composer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.s,
    paddingVertical: Spacing.xs,
    borderTopWidth: 1,
    minHeight: 72,
  },
  composerIcon: {
    padding: Spacing.s,
  },
  input: {
    flex: 1,
    fontSize: 14,
    maxHeight: 100,
    paddingHorizontal: Spacing.s,
    paddingVertical: Spacing.xs,
    textAlignVertical: 'center',
  },
  sendButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mentionOverlay: {
    borderRadius: 8,
    borderWidth: 1,
    marginHorizontal: Spacing.m,
    marginBottom: Spacing.xs,
    maxHeight: 150,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  mentionHeader: {
    fontSize: 9,
    paddingHorizontal: Spacing.s,
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  mentionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.s,
    paddingVertical: Spacing.xs,
  },
  reactionOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  reactionContainer: {
    flexDirection: 'row',
    borderRadius: 24,
    paddingHorizontal: Spacing.s,
    paddingVertical: Spacing.xs,
  },
  reactionEmojiButton: {
    padding: Spacing.s,
  },
  reactionEmojiText: {
    fontSize: 28,
  },
  bottomDrawerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  bottomDrawer: {
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: '70%',
  },
  drawerHeader: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.m,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  closeDrawerBtn: {
    padding: Spacing.xs,
  },
  reactorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.s,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  templatesGrid: {
    padding: Spacing.m,
    gap: Spacing.s,
  },
  templateCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.m,
    borderWidth: 1,
    borderRadius: 8,
  },
  pollSetupForm: {
    padding: Spacing.m,
  },
  backTemplate: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.m,
  },
  addOptionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.s,
    alignSelf: 'flex-start',
  },
  createPollSubmit: {
    height: 40,
    borderRadius: Shapes.rounded,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: Spacing.m,
  },
  createPollSubmitText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  aiGenerateBtn: {
    flexDirection: 'row',
    height: 40,
    borderRadius: Shapes.rounded,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: Spacing.s,
  },
  aiGenerateBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: 'bold',
  },
  pollCard: {
    borderWidth: 1,
    borderRadius: 8,
    padding: Spacing.s,
    marginVertical: Spacing.xs,
  },
  pollOptionRow: {
    height: 38,
    borderRadius: 6,
    borderWidth: 1,
    justifyContent: 'center',
    marginVertical: 4,
    position: 'relative',
    overflow: 'hidden',
  },
  pollFill: {
    ...StyleSheet.absoluteFillObject,
  },
  pollOwnerControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: Spacing.s,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    paddingTop: Spacing.s,
  },
  aiSummaryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  convertButton: {
    paddingHorizontal: Spacing.s,
    paddingVertical: 6,
    borderRadius: 4,
  },
  convertButtonText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: 'bold',
  },
  storyViewerOverlay: {
    flex: 1,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  storyCloseArea: {
    ...StyleSheet.absoluteFillObject,
  },
  storyImageWrapper: {
    width: screenWidth,
    height: screenHeight,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  storyViewerImage: {
    width: '100%',
    height: '80%',
  },
  storyProgressList: {
    position: 'absolute',
    top: 40,
    left: 16,
    right: 16,
    flexDirection: 'row',
    gap: 4,
    zIndex: 10,
  },
  storyProgressBar: {
    flex: 1,
    height: 3,
    borderRadius: 1.5,
  },
  storyNavigation: {
    ...StyleSheet.absoluteFillObject,
    flexDirection: 'row',
    zIndex: 5,
  },
  storyNavHalf: {
    flex: 1,
    height: '100%',
  },
  storyCloseBtn: {
    position: 'absolute',
    top: 60,
    right: 20,
    zIndex: 10,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerLogo: {
    width: 36,
    height: 36,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.s,
    marginLeft: Spacing.xs,
  },
  leftPanelOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  leftPanelContentAbsolute: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    width: screenWidth,
    elevation: 16,
    shadowColor: '#000',
    shadowOffset: { width: 4, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
    zIndex: 1000,
  },
  leftPanelHeader: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.s,
    borderBottomWidth: 1,
  },
  leftPanelBackButton: {
    padding: Spacing.xs,
  },
  leftPanelTabsStack: {
    padding: Spacing.s,
    gap: 8,
    marginTop: Spacing.s,
  },
  leftPanelTabItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.m,
    borderRadius: 8,
  },
  verticalOptionsContainer: {
    position: 'absolute',
    bottom: 80,
    left: 12,
    zIndex: 1000,
    gap: 12,
    flexDirection: 'column-reverse',
  },
  verticalOptionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 24,
    paddingHorizontal: 4,
    paddingVertical: 4,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
  },
  verticalOptionCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  verticalOptionLabel: {
    paddingRight: 12,
    paddingLeft: 4,
  },
  commentsSection: {
    borderTopWidth: 1,
    paddingTop: Spacing.s,
    marginTop: Spacing.s,
  },
  commentRow: {
    flexDirection: 'row',
    marginTop: Spacing.s,
  },
  commentContent: {
    flex: 1,
    marginLeft: Spacing.s,
    padding: 8,
    borderRadius: 8,
  },
  commentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  commentTime: {
    fontSize: 9,
  },
  commentText: {
    fontSize: 12.5,
    marginTop: 2,
  },
  commentInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.s,
    gap: 8,
  },
  commentInput: {
    flex: 1,
    height: 32,
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: Spacing.m,
    fontSize: 12,
    paddingVertical: 4,
  },
  commentSendBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoDrawer: {
    height: '90%',
  },
  infoDrawerContent: {
    padding: Spacing.m,
    paddingBottom: Spacing.xl,
  },
  infoLogoContainer: {
    alignItems: 'center',
    marginTop: Spacing.s,
  },
  infoLargeLogo: {
    width: 80,
    height: 80,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoSection: {
    marginVertical: 4,
  },
  customBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  customBadgeText: {
    color: '#ffffff',
    fontSize: 11.5,
    fontWeight: '600',
  },
  reactionMenuContainer: {
    width: '80%',
    alignItems: 'center',
    gap: 12,
  },
  longPressMenu: {
    width: '100%',
    borderRadius: 12,
    padding: Spacing.xs,
  },
  longPressMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.m,
    paddingHorizontal: Spacing.m,
  },
  drawerHandleWrapper: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  drawerHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
  },
  inlineEditContainer: {
    marginTop: Spacing.s,
    width: '100%',
  },
  inlineEditTextInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: Spacing.s,
    fontSize: 14,
    minHeight: 60,
    textAlignVertical: 'top',
  },
  inlineEditButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: Spacing.s,
  },
  inlineEditBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
  },
  inlineEditBtnText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  flyingEmoji: {
    position: 'absolute',
    bottom: -12,
    right: 28,
    fontSize: 24,
    zIndex: 999,
  },
  undoToast: {
    position: 'absolute',
    bottom: 85,
    left: 20,
    right: 20,
    height: 48,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.m,
    zIndex: 999,
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
  undoToastText: {
    color: '#ffffff',
    fontSize: 14,
  },
  undoButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: '#ffe066',
    borderRadius: 4,
  },
  undoButtonText: {
    color: '#000000',
    fontWeight: 'bold',
    fontSize: 13,
  },
  dedupeOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dedupeContainer: {
    width: '80%',
    padding: Spacing.m,
    borderRadius: 12,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  dedupeButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  dedupeBtn: {
    paddingHorizontal: Spacing.m,
    paddingVertical: 8,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dedupeBtnText: {
    fontWeight: 'bold',
    fontSize: 14,
    color: '#ffffff',
  },
});
