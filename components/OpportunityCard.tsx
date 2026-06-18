import React from 'react';
import { View, Text, StyleSheet, Image, Pressable } from 'react-native';
import { Colors, Spacing, Typography, Shapes } from '../constants/Theme';
import { Card } from './Card';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Opportunity } from '../services/personalization';

interface OpportunityCardProps {
  opportunity: Opportunity;
  onPress?: () => void;
  isDarkMode?: boolean;
}

export const OpportunityCard: React.FC<OpportunityCardProps> = ({
  opportunity,
  onPress,
  isDarkMode = false,
}) => {
  const themeColors = isDarkMode ? Colors.dark : Colors.light;

  return (
    <Card variant="Filled" size="Medium" onPress={onPress} isDarkMode={isDarkMode} style={styles.card}>
      {/* 1. Large Bold Heading (18-20px) */}
      <Text style={[styles.title, { color: themeColors.neutralForeground1 }]}>
        {opportunity.title}
      </Text>

      {/* 2. Descriptive storytelling need text (2-3 lines) */}
      <Text style={[styles.description, { color: themeColors.neutralForeground2 }]} numberOfLines={3}>
        "{opportunity.description}"
      </Text>

      {/* 3. Meta Information Row (Clock and Location chips) */}
      <View style={styles.metaRow}>
        <View style={[styles.chip, { backgroundColor: isDarkMode ? '#292929' : '#f0f0f0' }]}>
          <Ionicons name="time-outline" size={14} color={themeColors.neutralForeground3} style={styles.chipIcon} />
          <Text style={[styles.chipText, { color: themeColors.neutralForeground2 }]}>
            {opportunity.durationHrs < 1 ? `${opportunity.durationHrs * 60}m` : `${opportunity.durationHrs} hrs`}
          </Text>
        </View>

        <View style={[styles.chip, { backgroundColor: isDarkMode ? '#292929' : '#f0f0f0' }]}>
          <Ionicons name="location-outline" size={14} color={themeColors.neutralForeground3} style={styles.chipIcon} />
          <Text style={[styles.chipText, { color: themeColors.neutralForeground2 }]} numberOfLines={1}>
            {opportunity.isRemote
              ? 'Remote'
              : opportunity.distanceKm > 5
                ? `${opportunity.locationName} (${Math.round(opportunity.distanceKm)} km away)`
                : opportunity.locationName
            }
          </Text>
        </View>
      </View>

      {/* 4. Category Tag with Slight Gradient */}
      <View style={styles.tagWrapper}>
        <LinearGradient
          colors={isDarkMode ? ['#1b3f6c', '#10253f'] : ['#ebf3fc', '#cfe0f7']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.gradientTag}
        >
          <Text style={[styles.tagText, { color: isDarkMode ? '#479ef5' : '#0f6cbd' }]}>
            {opportunity.categoryTag}
          </Text>
        </LinearGradient>
      </View>

      <View style={[styles.divider, { backgroundColor: themeColors.neutralStroke2 }]} />

      {/* 5. Organization Row + Social/Mutual Signups */}
      <View style={styles.footerRow}>
        {/* Left: Organization Logo + Name */}
        <View style={styles.orgInfo}>
          <Image
            source={{ uri: opportunity.organizationLogo }}
            style={styles.orgLogo}
          />
          <Text style={[styles.orgName, { color: themeColors.neutralForeground2 }]} numberOfLines={1}>
            {opportunity.organizationName}
          </Text>
        </View>

        {/* Right: Participant Avatars + Connection count */}
        {opportunity.friendsSignedUpCount > 0 && (
          <View style={styles.socialGroup}>
            <View style={styles.avatarStack}>
              {opportunity.friendsSignedUpNames.slice(0, 2).map((friend, idx) => (
                <View
                  key={friend}
                  style={[
                    styles.avatarBorder,
                    {
                      borderColor: themeColors.neutralBackground1,
                      marginLeft: idx === 0 ? 0 : -10,
                      zIndex: 10 - idx,
                    },
                  ]}
                >
                  <View style={[styles.initialsAvatar, { backgroundColor: themeColors.brandBackgroundSubtle }]}>
                    <Text style={[styles.initialsText, { color: themeColors.brandForeground1 }]}>
                      {friend.charAt(0)}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
            <Text style={[styles.signupText, { color: themeColors.neutralForeground3 }]}>
              {opportunity.friendsSignedUpNames.slice(0, 2).join(', ')}
              {opportunity.friendsSignedUpCount > 2
                ? ` +${opportunity.friendsSignedUpCount - 2} others`
                : ' signed up'}
            </Text>
          </View>
        )}
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    marginVertical: Spacing.s / 2,
    borderWidth: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    lineHeight: 24,
    marginBottom: Spacing.xs,
  },
  description: {
    ...Typography.body,
    fontStyle: 'italic',
    lineHeight: 20,
    marginBottom: Spacing.s,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: Spacing.s,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.s,
    paddingVertical: Spacing.xxs,
    borderRadius: Shapes.circular,
    marginRight: Spacing.xs,
    marginBottom: Spacing.xxs,
  },
  chipIcon: {
    marginRight: 4,
  },
  chipText: {
    fontSize: 12,
    fontWeight: '500',
  },
  tagWrapper: {
    flexDirection: 'row',
    marginBottom: Spacing.s,
  },
  gradientTag: {
    paddingHorizontal: Spacing.s,
    paddingVertical: Spacing.xxs,
    borderRadius: Shapes.rounded,
  },
  tagText: {
    fontSize: 12,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    width: '100%',
    marginBottom: Spacing.s,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  orgInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: Spacing.xs,
  },
  orgLogo: {
    width: 28,
    height: 28,
    borderRadius: 14,
    marginRight: Spacing.xs,
  },
  orgName: {
    fontSize: 12,
    fontWeight: '600',
  },
  socialGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarStack: {
    flexDirection: 'row',
    marginRight: 6,
  },
  avatarBorder: {
    borderRadius: 12,
    borderWidth: 1.5,
    overflow: 'hidden',
  },
  initialsAvatar: {
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  initialsText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  signupText: {
    fontSize: 11,
    fontWeight: '500',
  },
});
