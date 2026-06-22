import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  Pressable,
  Platform,
  Keyboard,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Spacing, Typography, Shapes } from '../constants/Theme';
import { Ionicons } from '@expo/vector-icons';
import { Avatar } from '../components/Avatar';

interface Message {
  id: string;
  text: string;
  sender: 'me' | 'other';
  time: string;
}

interface DirectMessageProps {
  isDarkMode?: boolean;
  colleagueName: string;
  avatarUri?: string;
  onBack: () => void;
}

export const DirectMessage: React.FC<DirectMessageProps> = ({
  isDarkMode = false,
  colleagueName,
  avatarUri,
  onBack,
}) => {
  const themeColors = isDarkMode ? Colors.dark : Colors.light;

  const [messages, setMessages] = useState<Message[]>([
    { id: '1', text: 'Hey there! How is the project going?', sender: 'other', time: '10:30 AM' },
    { id: '2', text: 'Its going great! We just finished the story optimization features.', sender: 'me', time: '10:32 AM' },
    { id: '3', text: 'Awesome! Did you update the image loading logic?', sender: 'other', time: '10:33 AM' },
    { id: '4', text: 'Yes, we are using direct RSS feeds now and it loads instantly.', sender: 'me', time: '10:34 AM' },
  ]);
  const [inputText, setInputText] = useState('');
  const scrollViewRef = useRef<ScrollView>(null);
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

  const handleSend = () => {
    if (!inputText.trim()) return;

    const newMsg: Message = {
      id: Date.now().toString(),
      text: inputText.trim(),
      sender: 'me',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, newMsg]);
    setInputText('');
    
    // Scroll to end
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
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
      {/* Header */}
      <View style={[styles.header, { backgroundColor: themeColors.neutralBackground1, borderBottomColor: themeColors.neutralStroke2 }]}>
        <Pressable onPress={onBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={themeColors.neutralForeground1} />
        </Pressable>
        <View style={styles.headerInfo}>
          <Avatar size={36} name={colleagueName} isDarkMode={isDarkMode} />
          <View style={styles.headerTextContainer}>
            <Text style={[Typography.bodyStrong, { color: themeColors.neutralForeground1 }]}>
              {colleagueName}
            </Text>
            <Text style={[Typography.caption, { color: themeColors.neutralForeground2 }]}>
              Active online
            </Text>
          </View>
        </View>
        <Pressable style={styles.headerAction}>
          <Ionicons name="call-outline" size={20} color={themeColors.neutralForeground1} />
        </Pressable>
      </View>

      {/* Chat Messages */}
      <ScrollView
        ref={scrollViewRef}
        contentContainerStyle={styles.messagesList}
        showsVerticalScrollIndicator={false}
        onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
      >
        {messages.map((item) => {
          const isMe = item.sender === 'me';
          return (
            <View
              key={item.id}
              style={[
                styles.messageContainer,
                isMe ? styles.messageMeContainer : styles.messageOtherContainer,
              ]}
            >
              {!isMe && (
                <View style={styles.messageAvatar}>
                  <Avatar size={28} name={colleagueName} isDarkMode={isDarkMode} />
                </View>
              )}
              <View
                style={[
                  styles.messageBubble,
                  {
                    backgroundColor: isMe
                      ? themeColors.brandBackground
                      : themeColors.neutralBackground1,
                    borderColor: themeColors.neutralStroke2,
                    borderWidth: isMe ? 0 : 1,
                  },
                ]}
              >
                <Text
                  style={[
                    Typography.body,
                    { color: isMe ? '#ffffff' : themeColors.neutralForeground1 },
                  ]}
                >
                  {item.text}
                </Text>
                <Text
                  style={[
                    Typography.caption,
                    styles.messageTime,
                    { color: isMe ? 'rgba(255, 255, 255, 0.7)' : themeColors.neutralForeground3 },
                  ]}
                >
                  {item.time}
                </Text>
              </View>
            </View>
          );
        })}
      </ScrollView>

      {/* Composer */}
      <View
        style={[
          styles.composer,
          {
            backgroundColor: themeColors.neutralBackground1,
            borderTopColor: themeColors.neutralStroke2,
          },
        ]}
      >

        
        <TextInput
          value={inputText}
          onChangeText={setInputText}
          placeholder="Type a message..."
          placeholderTextColor={themeColors.neutralForegroundDisabled}
          style={[styles.input, { color: themeColors.neutralForeground1 }]}
          multiline
        />

        <Pressable
          onPress={handleSend}
          style={[
            styles.sendButton,
            { backgroundColor: inputText.trim() ? themeColors.brandForeground1 : 'transparent' },
          ]}
          disabled={!inputText.trim()}
        >
          <Ionicons
            name="send"
            size={20}
            color={inputText.trim() ? '#ffffff' : themeColors.neutralForegroundDisabled}
          />
        </Pressable>
      </View>
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
  },
  backButton: {
    padding: Spacing.xs,
    marginRight: Spacing.xxs,
  },
  headerInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTextContainer: {
    marginLeft: Spacing.xs,
  },
  headerAction: {
    padding: Spacing.s,
  },
  messagesList: {
    padding: Spacing.m,
    paddingBottom: Spacing.xl,
  },
  messageContainer: {
    flexDirection: 'row',
    marginBottom: Spacing.m,
    maxWidth: '80%',
  },
  messageMeContainer: {
    alignSelf: 'flex-end',
  },
  messageOtherContainer: {
    alignSelf: 'flex-start',
  },
  messageAvatar: {
    marginRight: Spacing.xs,
    alignSelf: 'flex-end',
  },
  messageBubble: {
    paddingHorizontal: Spacing.m,
    paddingVertical: Spacing.s,
    borderRadius: 16,
  },
  messageTime: {
    alignSelf: 'flex-end',
    fontSize: 9,
    marginTop: 4,
  },
  composer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.s,
    paddingVertical: Spacing.xs,
    borderTopWidth: 1,
    minHeight: 72, // Increased height to 140% of original
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
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: Spacing.xxs,
  },
});
