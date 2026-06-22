import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Switch, Pressable } from 'react-native';
import { Colors, Spacing, Typography, Shapes } from '../constants/Theme';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

interface NotificationSettingsProps {
  isDarkMode?: boolean;
  onBack: () => void;
}

export const NotificationSettings: React.FC<NotificationSettingsProps> = ({
  isDarkMode = false,
  onBack,
}) => {
  const themeColors = isDarkMode ? Colors.dark : Colors.light;

  // Categories preferences state
  const [categories, setCategories] = useState({
    opportunity: true,
    announcement: true,
    reminder: true,
    message: true,
    connection: true,
    badge: false,
    status: true,
    system: true,
  });

  // Channels preferences state
  const [channels, setChannels] = useState({
    push: true,
    email: false,
    inApp: true,
  });

  // Frequency state
  const [frequency, setFrequency] = useState<'Real-time' | 'Daily Digest' | 'Weekly'>('Real-time');

  // Muted communities state
  const [mutedCommunities, setMutedCommunities] = useState({
    cws: false,
    mentalHealth: true,
    housing: false,
  });

  const toggleCategory = (key: keyof typeof categories) => {
    setCategories(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const toggleChannel = (key: keyof typeof channels) => {
    setChannels(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const toggleMuteCommunity = (key: keyof typeof mutedCommunities) => {
    setMutedCommunities(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: themeColors.neutralBackground2 }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: themeColors.neutralStroke2, backgroundColor: themeColors.neutralBackground1 }]}>
        <Pressable onPress={onBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={themeColors.neutralForeground1} />
        </Pressable>
        <Text style={[Typography.bodyStrong, styles.headerTitle, { color: themeColors.neutralForeground1 }]}>
          Notification Settings
        </Text>
        <Pressable onPress={onBack} style={styles.saveButton}>
          <Text style={[Typography.bodyStrong, { color: themeColors.brandForeground1 }]}>Done</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Section 1: Categories */}
        <Text style={[styles.sectionTitle, Typography.captionStrong, { color: themeColors.neutralForeground3 }]}>
          CATEGORIES TO RECEIVE
        </Text>
        
        <View style={[styles.card, { backgroundColor: themeColors.neutralBackground1, borderColor: themeColors.neutralStroke2 }]}>
          <View style={styles.settingRow}>
            <Text style={[Typography.body, { color: themeColors.neutralForeground1 }]}>Volunteer opportunity updates</Text>
            <Switch
              value={categories.opportunity}
              onValueChange={() => toggleCategory('opportunity')}
              trackColor={{ false: themeColors.neutralStroke1, true: themeColors.brandBackground }}
            />
          </View>
          <View style={[styles.divider, { backgroundColor: themeColors.neutralStroke2 }]} />
          
          <View style={styles.settingRow}>
            <Text style={[Typography.body, { color: themeColors.neutralForeground1 }]}>Community announcements</Text>
            <Switch
              value={categories.announcement}
              onValueChange={() => toggleCategory('announcement')}
              trackColor={{ false: themeColors.neutralStroke1, true: themeColors.brandBackground }}
            />
          </View>
          <View style={[styles.divider, { backgroundColor: themeColors.neutralStroke2 }]} />

          <View style={styles.settingRow}>
            <Text style={[Typography.body, { color: themeColors.neutralForeground1 }]}>Event reminders</Text>
            <Switch
              value={categories.reminder}
              onValueChange={() => toggleCategory('reminder')}
              trackColor={{ false: themeColors.neutralStroke1, true: themeColors.brandBackground }}
            />
          </View>
          <View style={[styles.divider, { backgroundColor: themeColors.neutralStroke2 }]} />

          <View style={styles.settingRow}>
            <Text style={[Typography.body, { color: themeColors.neutralForeground1 }]}>New messages & tags</Text>
            <Switch
              value={categories.message}
              onValueChange={() => toggleCategory('message')}
              trackColor={{ false: themeColors.neutralStroke1, true: themeColors.brandBackground }}
            />
          </View>
          <View style={[styles.divider, { backgroundColor: themeColors.neutralStroke2 }]} />

          <View style={styles.settingRow}>
            <Text style={[Typography.body, { color: themeColors.neutralForeground1 }]}>Connection requests</Text>
            <Switch
              value={categories.connection}
              onValueChange={() => toggleCategory('connection')}
              trackColor={{ false: themeColors.neutralStroke1, true: themeColors.brandBackground }}
            />
          </View>
          <View style={[styles.divider, { backgroundColor: themeColors.neutralStroke2 }]} />

          <View style={styles.settingRow}>
            <Text style={[Typography.body, { color: themeColors.neutralForeground1 }]}>Achievement badges</Text>
            <Switch
              value={categories.badge}
              onValueChange={() => toggleCategory('badge')}
              trackColor={{ false: themeColors.neutralStroke1, true: themeColors.brandBackground }}
            />
          </View>
          <View style={[styles.divider, { backgroundColor: themeColors.neutralStroke2 }]} />

          <View style={styles.settingRow}>
            <Text style={[Typography.body, { color: themeColors.neutralForeground1 }]}>Application status updates</Text>
            <Switch
              value={categories.status}
              onValueChange={() => toggleCategory('status')}
              trackColor={{ false: themeColors.neutralStroke1, true: themeColors.brandBackground }}
            />
          </View>
          <View style={[styles.divider, { backgroundColor: themeColors.neutralStroke2 }]} />

          <View style={styles.settingRow}>
            <Text style={[Typography.body, { color: themeColors.neutralForeground1 }]}>System alerts</Text>
            <Switch
              value={categories.system}
              onValueChange={() => toggleCategory('system')}
              trackColor={{ false: themeColors.neutralStroke1, true: themeColors.brandBackground }}
            />
          </View>
        </View>

        {/* Section 2: Channels */}
        <Text style={[styles.sectionTitle, Typography.captionStrong, { color: themeColors.neutralForeground3 }]}>
          NOTIFICATION CHANNELS
        </Text>
        <View style={[styles.card, { backgroundColor: themeColors.neutralBackground1, borderColor: themeColors.neutralStroke2 }]}>
          <View style={styles.settingRow}>
            <Text style={[Typography.body, { color: themeColors.neutralForeground1 }]}>Push Notifications</Text>
            <Switch
              value={channels.push}
              onValueChange={() => toggleChannel('push')}
              trackColor={{ false: themeColors.neutralStroke1, true: themeColors.brandBackground }}
            />
          </View>
          <View style={[styles.divider, { backgroundColor: themeColors.neutralStroke2 }]} />

          <View style={styles.settingRow}>
            <Text style={[Typography.body, { color: themeColors.neutralForeground1 }]}>Email Notifications</Text>
            <Switch
              value={channels.email}
              onValueChange={() => toggleChannel('email')}
              trackColor={{ false: themeColors.neutralStroke1, true: themeColors.brandBackground }}
            />
          </View>
          <View style={[styles.divider, { backgroundColor: themeColors.neutralStroke2 }]} />

          <View style={styles.settingRow}>
            <Text style={[Typography.body, { color: themeColors.neutralForeground1 }]}>In-App Alerts</Text>
            <Switch
              value={channels.inApp}
              onValueChange={() => toggleChannel('inApp')}
              trackColor={{ false: themeColors.neutralStroke1, true: themeColors.brandBackground }}
            />
          </View>
        </View>

        {/* Section 3: Frequency */}
        <Text style={[styles.sectionTitle, Typography.captionStrong, { color: themeColors.neutralForeground3 }]}>
          DELIVERY FREQUENCY
        </Text>
        <View style={[styles.card, { backgroundColor: themeColors.neutralBackground1, borderColor: themeColors.neutralStroke2 }]}>
          {(['Real-time', 'Daily Digest', 'Weekly'] as const).map((f) => {
            const isSelected = frequency === f;
            return (
              <Pressable
                key={f}
                onPress={() => setFrequency(f)}
                style={styles.freqOption}
              >
                <Text style={[Typography.body, { color: themeColors.neutralForeground1 }]}>{f}</Text>
                {isSelected && (
                  <Ionicons name="checkmark" size={20} color={themeColors.brandForeground1} />
                )}
              </Pressable>
            );
          })}
        </View>

        {/* Section 4: Mute Communities */}
        <Text style={[styles.sectionTitle, Typography.captionStrong, { color: themeColors.neutralForeground3 }]}>
          MUTE COMMUNITIES
        </Text>
        <View style={[styles.card, { backgroundColor: themeColors.neutralBackground1, borderColor: themeColors.neutralStroke2, marginBottom: Spacing.xl }]}>
          <View style={styles.settingRow}>
            <Text style={[Typography.body, { color: themeColors.neutralForeground1 }]}>CWS Taskforce</Text>
            <Switch
              value={mutedCommunities.cws}
              onValueChange={() => toggleMuteCommunity('cws')}
              trackColor={{ false: themeColors.neutralStroke1, true: themeColors.brandBackground }}
            />
          </View>
          <View style={[styles.divider, { backgroundColor: themeColors.neutralStroke2 }]} />

          <View style={styles.settingRow}>
            <Text style={[Typography.body, { color: themeColors.neutralForeground1 }]}>Mental Health Support Group</Text>
            <Switch
              value={mutedCommunities.mentalHealth}
              onValueChange={() => toggleMuteCommunity('mentalHealth')}
              trackColor={{ false: themeColors.neutralStroke1, true: themeColors.brandBackground }}
            />
          </View>
          <View style={[styles.divider, { backgroundColor: themeColors.neutralStroke2 }]} />

          <View style={styles.settingRow}>
            <Text style={[Typography.body, { color: themeColors.neutralForeground1 }]}>Housing & Relocations</Text>
            <Switch
              value={mutedCommunities.housing}
              onValueChange={() => toggleMuteCommunity('housing')}
              trackColor={{ false: themeColors.neutralStroke1, true: themeColors.brandBackground }}
            />
          </View>
        </View>

      </ScrollView>
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
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
  },
  saveButton: {
    width: 50,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-end',
  },
  headerTitle: {
    fontSize: 16,
  },
  scrollContent: {
    padding: Spacing.m,
  },
  sectionTitle: {
    marginTop: Spacing.m,
    marginBottom: Spacing.xs,
    fontSize: 11,
    letterSpacing: 0.5,
  },
  card: {
    borderRadius: Shapes.rounded,
    borderWidth: 1,
    paddingHorizontal: Spacing.m,
    overflow: 'hidden',
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.m,
  },
  divider: {
    height: 1,
    width: '100%',
  },
  freqOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.m,
  },
});
