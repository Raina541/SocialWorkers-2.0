import React from 'react';
import { View, Text, StyleSheet, ScrollView, Switch, Pressable } from 'react-native';
import { Colors, Spacing, Typography, Shapes } from '../constants/Theme';
import { Avatar, PresenceState } from '../components/Avatar';
import { Card } from '../components/Card';
import { Badge } from '../components/Badge';
import { Button } from '../components/Button';
import { Ionicons } from '@expo/vector-icons';

interface ProfileProps {
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
  presence: PresenceState;
  onChangePresence: (state: PresenceState) => void;
}

export const Profile: React.FC<ProfileProps> = ({
  isDarkMode,
  onToggleDarkMode,
  presence,
  onChangePresence,
}) => {
  const themeColors = isDarkMode ? Colors.dark : Colors.light;

  const presenceStates: PresenceState[] = ['Available', 'Busy', 'DND', 'Away', 'Offline'];

  const getPresenceIntent = (state: PresenceState) => {
    switch (state) {
      case 'Available': return 'Success';
      case 'Away': return 'Warning';
      case 'Busy':
      case 'DND': return 'Danger';
      case 'Offline':
      default: return 'Subtle';
    }
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: themeColors.neutralBackground2 }]}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      {/* Profile Header */}
      <View style={styles.headerContainer}>
        <Avatar size={96} name="Nilap Saha" presence={presence} isDarkMode={isDarkMode} />
        <Text style={[Typography.title, { color: themeColors.neutralForeground1, marginTop: Spacing.s }]}>
          Nilap Saha
        </Text>
        <Text style={[Typography.body, { color: themeColors.neutralForeground3 }]}>
          Senior Case Manager • East County Division
        </Text>
        <Text style={[Typography.caption, { color: themeColors.neutralForegroundDisabled, marginTop: 2 }]}>
          ID: SW-984210
        </Text>
      </View>

      {/* Interactive Presence Selector */}
      <Text style={[styles.sectionTitle, Typography.bodyStrong, { color: themeColors.neutralForeground1 }]}>
        Set Your Availability
      </Text>
      <Card variant="Filled" isDarkMode={isDarkMode}>
        <View style={styles.presenceRow}>
          {presenceStates.map(state => {
            const isSelected = presence === state;
            const stateIntent = getPresenceIntent(state);
            return (
              <Pressable
                key={state}
                onPress={() => onChangePresence(state)}
                style={[
                  styles.presenceOption,
                  {
                    backgroundColor: isSelected
                      ? themeColors.brandBackgroundSubtle
                      : 'transparent',
                    borderColor: isSelected
                      ? themeColors.brandForeground1
                      : 'transparent',
                    borderWidth: 1,
                    borderRadius: Shapes.rounded,
                  },
                ]}
              >
                <View
                  style={[
                    styles.statusDot,
                    {
                      backgroundColor:
                        state === 'Available'
                          ? '#107c41'
                          : state === 'Away'
                          ? '#d86109'
                          : state === 'Busy' || state === 'DND'
                          ? '#c41818'
                          : '#8a8a8a',
                    },
                  ]}
                />
                <Text
                  style={[
                    Typography.captionStrong,
                    {
                      color: isSelected
                        ? themeColors.brandForeground1
                        : themeColors.neutralForeground2,
                      fontSize: 11,
                    },
                  ]}
                >
                  {state}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </Card>

      {/* Case Metrics Row */}
      <View style={styles.metricsRow}>
        <Card variant="Filled" isDarkMode={isDarkMode} style={styles.metricCard}>
          <Text style={[Typography.title, { color: themeColors.brandForeground1 }]}>14</Text>
          <Text style={[Typography.captionStrong, { color: themeColors.neutralForeground2 }]}>Active Cases</Text>
        </Card>
        <Card variant="Filled" isDarkMode={isDarkMode} style={styles.metricCard}>
          <Text style={[Typography.title, { color: themeColors.successForeground1 }]}>5</Text>
          <Text style={[Typography.captionStrong, { color: themeColors.neutralForeground2 }]}>Closed (Mo)</Text>
        </Card>
        <Card variant="Filled" isDarkMode={isDarkMode} style={styles.metricCard}>
          <Text style={[Typography.title, { color: themeColors.warningForeground1 }]}>2</Text>
          <Text style={[Typography.captionStrong, { color: themeColors.neutralForeground2 }]}>Pending Review</Text>
        </Card>
      </View>

      {/* Settings Options */}
      <Text style={[styles.sectionTitle, Typography.bodyStrong, { color: themeColors.neutralForeground1 }]}>
        Preferences & Settings
      </Text>

      {/* Theme Card */}
      <Card variant="Filled" isDarkMode={isDarkMode} style={styles.settingItemCard}>
        <View style={styles.settingRow}>
          <View style={styles.settingLabelContainer}>
            <Ionicons name="moon" size={20} color={themeColors.neutralForeground2} />
            <Text style={[Typography.body, styles.settingText, { color: themeColors.neutralForeground1 }]}>
              Dark Mode Treatment
            </Text>
          </View>
          <Switch
            value={isDarkMode}
            onValueChange={onToggleDarkMode}
            trackColor={{ false: themeColors.neutralStroke1, true: themeColors.brandBackground }}
            thumbColor={isDarkMode ? '#ffffff' : '#f5f5f5'}
          />
        </View>
      </Card>

      {/* Other Settings Options */}
      <Card variant="Filled" isDarkMode={isDarkMode} style={styles.settingItemCard}>
        <Pressable onPress={() => console.log('Acc pressed')} style={styles.settingRow}>
          <View style={styles.settingLabelContainer}>
            <Ionicons name="person-circle" size={20} color={themeColors.neutralForeground2} />
            <Text style={[Typography.body, styles.settingText, { color: themeColors.neutralForeground1 }]}>
              Profile Details & Credentials
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color={themeColors.neutralForeground3} />
        </Pressable>
      </Card>

      <Card variant="Filled" isDarkMode={isDarkMode} style={styles.settingItemCard}>
        <Pressable onPress={() => console.log('Sync pressed')} style={styles.settingRow}>
          <View style={styles.settingLabelContainer}>
            <Ionicons name="sync" size={20} color={themeColors.neutralForeground2} />
            <Text style={[Typography.body, styles.settingText, { color: themeColors.neutralForeground1 }]}>
              Offline Cache & Storage Sync
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color={themeColors.neutralForeground3} />
        </Pressable>
      </Card>

      {/* Sign Out */}
      <View style={{ marginTop: Spacing.xl }}>
        <Button
          label="Sign Out of Portal"
          appearance="Outline"
          onPress={() => console.log('Signed out')}
          isDarkMode={isDarkMode}
        />
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: Spacing.m,
    paddingBottom: Spacing.xxl,
  },
  headerContainer: {
    alignItems: 'center',
    marginVertical: Spacing.m,
  },
  sectionTitle: {
    marginTop: Spacing.m,
    marginBottom: Spacing.xs,
  },
  presenceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.xxs,
  },
  presenceOption: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xs,
    marginHorizontal: 2,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginBottom: 4,
  },
  metricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: Spacing.m,
    marginHorizontal: -Spacing.xs / 2,
  },
  metricCard: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: Spacing.xs / 2,
    paddingVertical: Spacing.s,
  },
  settingItemCard: {
    marginVertical: 4,
    paddingVertical: Spacing.s,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  settingLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingText: {
    marginLeft: Spacing.s,
  },
});
