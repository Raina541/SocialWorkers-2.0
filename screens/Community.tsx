import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, Pressable } from 'react-native';
import { Colors, Spacing, Typography, Shapes } from '../constants/Theme';
import { Accordion } from '../components/Accordion';
import { Avatar } from '../components/Avatar';
import { Badge } from '../components/Badge';
import { Card } from '../components/Card';
import { Ionicons } from '@expo/vector-icons';

interface CommunityProps {
  isDarkMode?: boolean;
}

export const Community: React.FC<CommunityProps> = ({ isDarkMode = false }) => {
  const themeColors = isDarkMode ? Colors.dark : Colors.light;
  const [search, setSearch] = useState('');
  const [isFocused, setIsFocused] = useState(false);

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: themeColors.neutralBackground2 }]}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      {/* Title */}
      <Text style={[Typography.subtitle, { color: themeColors.neutralForeground1, marginBottom: Spacing.s }]}>
        Communities & Channels
      </Text>

      {/* Fluent 2 SearchBox */}
      <View
        style={[
          styles.searchContainer,
          {
            backgroundColor: themeColors.neutralBackground1,
            borderColor: isFocused ? themeColors.brandForeground1 : themeColors.neutralStroke1,
            borderBottomWidth: isFocused ? 2 : 1,
          },
        ]}
      >
        <Ionicons name="search-outline" size={20} color={themeColors.neutralForeground3} style={styles.searchIcon} />
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Search teams, channels or cases..."
          placeholderTextColor={themeColors.neutralForegroundDisabled}
          style={[styles.searchInput, { color: themeColors.neutralForeground1 }]}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
        />
        {search.length > 0 && (
          <Pressable onPress={() => setSearch('')} style={styles.clearButton}>
            <Ionicons name="close-circle" size={16} color={themeColors.neutralForeground3} />
          </Pressable>
        )}
      </View>

      {/* Active Team Members */}
      <Text style={[styles.sectionTitle, Typography.bodyStrong, { color: themeColors.neutralForeground1 }]}>
        Active Colleagues Online
      </Text>
      
      <Card variant="Filled" isDarkMode={isDarkMode} style={styles.membersCard}>
        <View style={styles.avatarSpread}>
          <Avatar size={40} name="Jane Doe" presence="Available" isDarkMode={isDarkMode} />
          <Avatar size={40} name="Bob Smith" presence="Busy" isDarkMode={isDarkMode} />
          <Avatar size={40} name="Alice Green" presence="Away" isDarkMode={isDarkMode} />
          <Avatar size={40} name="Charlie Brown" presence="Offline" isDarkMode={isDarkMode} />
          <Avatar size={40} name="Diana Prince" presence="DND" isDarkMode={isDarkMode} />
          {/* Pie/Spread overflow indicator */}
          <View
            style={[
              styles.avatarOverflow,
              {
                backgroundColor: themeColors.brandBackgroundSubtle,
                borderColor: themeColors.neutralStroke2,
              },
            ]}
          >
            <Text style={[Typography.captionStrong, { color: themeColors.brandForeground1 }]}>
              +12
            </Text>
          </View>
        </View>
      </Card>

      {/* Accordion List for Channels */}
      <Text style={[styles.sectionTitle, Typography.bodyStrong, { color: themeColors.neutralForeground1 }]}>
        Official Channels
      </Text>

      <Accordion title="Child Welfare Services (CWS) Taskforce" chevronPosition="after" isDarkMode={isDarkMode}>
        <Text style={[Typography.body, { color: themeColors.neutralForeground2, marginBottom: Spacing.s }]}>
          Coordination channel for county youth welfare reviews, emergency shelter allocations, and foster home approvals.
        </Text>
        <View style={[styles.channelItem, { borderBottomColor: themeColors.neutralStroke2 }]}>
          <Text style={[Typography.bodyStrong, { color: themeColors.neutralForeground1 }]}># General Discussion</Text>
          <Badge label="4 New" intent="Brand" size="Small" isDarkMode={isDarkMode} />
        </View>
        <View style={styles.channelItem}>
          <Text style={[Typography.bodyStrong, { color: themeColors.neutralForeground1 }]}># Case Transfers</Text>
          <Badge label="Active" intent="Informative" size="Small" isDarkMode={isDarkMode} />
        </View>
      </Accordion>

      <Accordion title="Mental Health Support Group" chevronPosition="after" isDarkMode={isDarkMode}>
        <Text style={[Typography.body, { color: themeColors.neutralForeground2, marginBottom: Spacing.s }]}>
          Shared resources for drug/alcohol rehabilitation clinics, counseling availability, and psychiatric assistance.
        </Text>
        <View style={styles.channelItem}>
          <Text style={[Typography.bodyStrong, { color: themeColors.neutralForeground1 }]}># Clinic Referral Slots</Text>
          <Badge label="2 Slots Left" intent="Warning" size="Small" isDarkMode={isDarkMode} />
        </View>
      </Accordion>

      <Accordion title="Housing & Emergency Relocations" chevronPosition="after" isDarkMode={isDarkMode}>
        <Text style={[Typography.body, { color: themeColors.neutralForeground2, marginBottom: Spacing.s }]}>
          District shelter coordinates, hotel vouchers, and transitional housing application workflows.
        </Text>
        <View style={styles.channelItem}>
          <Text style={[Typography.bodyStrong, { color: themeColors.neutralForeground1 }]}># Room Availability Live</Text>
          <Badge label="Updated 5m ago" intent="Success" size="Small" isDarkMode={isDarkMode} />
        </View>
      </Accordion>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: Spacing.m,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 44,
    borderRadius: Shapes.rounded,
    paddingHorizontal: Spacing.s,
    borderWidth: 1,
    marginBottom: Spacing.m,
  },
  searchIcon: {
    marginRight: Spacing.xs,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    paddingVertical: 8,
  },
  clearButton: {
    padding: Spacing.xxs,
  },
  sectionTitle: {
    marginTop: Spacing.m,
    marginBottom: Spacing.xs,
  },
  membersCard: {
    paddingVertical: Spacing.s,
  },
  avatarSpread: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  avatarOverflow: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  channelItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.s,
    borderBottomWidth: 1,
    borderBottomColor: 'transparent',
  },
});
