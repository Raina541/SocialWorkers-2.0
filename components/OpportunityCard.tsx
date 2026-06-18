import React from 'react';
import { View, Text, StyleSheet, Image, Pressable } from 'react-native';
import { Colors, Spacing, Typography, Shapes } from '../constants/Theme';
import { Card } from './Card';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Opportunity } from '../services/personalization';

const getOpportunityStory = (opp: Opportunity): string => {
  const staticStories: Record<string, string> = {
    opp_1: "Spend a few hours helping local students build confidence and discover the joy of reading.",
    opp_2: "Help us sort and package essential medicines and diagnostics to support clinics in nearby rural communities.",
    opp_3: "Join us in distributing warm dinner packets to neighbors staying at our community transit shelters tonight.",
    opp_4: "Help plant a native urban forest by digging and planting saplings to cool down our city streets.",
    opp_5: "Support local farmers by reviewing hailstorm damage reports from home to approve critical relief seed vouchers.",
    opp_6: "Review textbook audio transcriptions online to ensure visually impaired college students have access to vital learning materials.",
    opp_7: "Design simple local posters from home to help spread the word about our stray dog rabies vaccination drive.",
  };

  if (opp.id && staticStories[opp.id]) {
    return staticStories[opp.id];
  }

  // Fallback generator for dynamic/incomplete opportunities
  const title = opp.title || "";
  const desc = opp.description || "";
  const cause = opp.cause || "";

  // 1. If description is high quality and already has target word count (12 to 25 words), clean it and return it
  if (desc) {
    let cleanDesc = desc
      .replace(/(seeking|looking for|needs|requires)\s+volunteers\s+(to|for)\s+/i, "")
      .replace(/volunteer\s+opportunity\s+to\s+/i, "")
      .replace(/^volunteers\s+will\s+/i, "")
      .replace(/we\s+are\s+recruiting\s+/i, "")
      .replace(/is\s+seeking\s+help\s+with\s+/i, "")
      .trim();

    if (cleanDesc.length > 0) {
      cleanDesc = cleanDesc.charAt(0).toUpperCase() + cleanDesc.slice(1);
      if (!cleanDesc.endsWith('.')) {
        cleanDesc += '.';
      }

      const wordCount = cleanDesc.split(/\s+/).length;
      if (wordCount >= 10 && wordCount <= 25) {
        return cleanDesc;
      }
    }
  }

  // 2. Otherwise generate structured story sentence using cause and title
  const cleanCause = cause.toLowerCase()
    .replace(/&/g, "and")
    .replace(/support for/i, "")
    .trim();

  const action = title.toLowerCase()
    .replace(/drive/i, "drives")
    .trim();

  if (opp.isRemote) {
    return `Join our mission to ${action} and help support ${cleanCause} from your home.`;
  } else {
    return `Spend a few hours helping us ${action} to support ${cleanCause} in our community.`;
  }
};

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
  const storySentence = getOpportunityStory(opportunity);

  return (
    <Card variant="Filled" size="Medium" onPress={onPress} isDarkMode={isDarkMode} style={styles.card}>
      {/* Primary Story-style Content */}
      <Text style={[styles.storyText, { color: themeColors.neutralForeground1 }]}>
        {storySentence}
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
  storyText: {
    ...Typography.bodyStrong,
    lineHeight: 22,
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
