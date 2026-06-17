import React from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions } from 'react-native';
import { Colors, Spacing, Typography } from '../constants/Theme';
import { Card } from '../components/Card';
import { Badge } from '../components/Badge';
import { Button } from '../components/Button';
import { Avatar } from '../components/Avatar';
import { Ionicons } from '@expo/vector-icons';

interface HomeProps {
  isDarkMode?: boolean;
  onNavigateToTab: (index: number) => void;
}

export const Home: React.FC<HomeProps> = ({ isDarkMode = false, onNavigateToTab }) => {
  const themeColors = isDarkMode ? Colors.dark : Colors.light;

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: themeColors.neutralBackground2 }]}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      {/* Header Profile Summary */}
      <Card variant="Filled" isDarkMode={isDarkMode} style={styles.welcomeCard}>
        <View style={styles.welcomeRow}>
          <Avatar size={56} name="Nilap Saha" presence="Available" isDarkMode={isDarkMode} />
          <View style={styles.welcomeTextContainer}>
            <Text style={[Typography.captionStrong, { color: themeColors.brandForeground1 }]}>
              SOCIAL WORKER PORTAL
            </Text>
            <Text style={[Typography.subtitle, { color: themeColors.neutralForeground1 }]}>
              Hello, Nilap!
            </Text>
            <Text style={[Typography.caption, { color: themeColors.neutralForeground3 }]}>
              Case Manager • District East
            </Text>
          </View>
          <Badge label="Active" intent="Success" size="Small" isDarkMode={isDarkMode} />
        </View>
      </Card>

      {/* Case Load Progress */}
      <Text style={[styles.sectionTitle, Typography.bodyStrong, { color: themeColors.neutralForeground1 }]}>
        Today's Case Progression
      </Text>
      
      <Card variant="Filled" isDarkMode={isDarkMode}>
        <View style={styles.statRow}>
          <Text style={[Typography.body, { color: themeColors.neutralForeground1 }]}>
            Client Visits Completed
          </Text>
          <Text style={[Typography.bodyStrong, { color: themeColors.neutralForeground1 }]}>
            4 / 6
          </Text>
        </View>
        
        {/* Fluent 2 Progress Bar */}
        <View style={[styles.progressTrack, { backgroundColor: themeColors.neutralBackground3 }]}>
          <View style={[styles.progressBar, { width: '66.6%', backgroundColor: themeColors.brandBackground }]} />
        </View>
        
        <Text style={[Typography.caption, { color: themeColors.neutralForeground3, marginTop: Spacing.xs }]}>
          Next scheduled visit: Maria Jones at 1:30 PM
        </Text>
      </Card>

      {/* Quick Action Grid */}
      <Text style={[styles.sectionTitle, Typography.bodyStrong, { color: themeColors.neutralForeground1 }]}>
        Quick Actions
      </Text>
      <View style={styles.actionGrid}>
        <View style={styles.gridCol}>
          <Card
            variant="Filled"
            isDarkMode={isDarkMode}
            onPress={() => onNavigateToTab(2)} // Navigate to Community
            style={styles.gridCard}
          >
            <View style={[styles.gridIconContainer, { backgroundColor: themeColors.brandBackgroundSubtle }]}>
              <Ionicons name="people" size={24} color={themeColors.brandForeground1} />
            </View>
            <Text style={[Typography.bodyStrong, { color: themeColors.neutralForeground1, marginTop: Spacing.xs }]}>
              Community
            </Text>
            <Text style={[Typography.caption, { color: themeColors.neutralForeground3, textAlign: 'center' }]}>
              Sync with teams
            </Text>
          </Card>
        </View>

        <View style={styles.gridCol}>
          <Card
            variant="Filled"
            isDarkMode={isDarkMode}
            onPress={() => onNavigateToTab(1)} // Navigate to Feed
            style={styles.gridCard}
          >
            <View style={[styles.gridIconContainer, { backgroundColor: themeColors.successBackgroundSubtle }]}>
              <Ionicons name="newspaper" size={24} color={themeColors.successForeground1} />
            </View>
            <Text style={[Typography.bodyStrong, { color: themeColors.neutralForeground1, marginTop: Spacing.xs }]}>
              Feed
            </Text>
            <Text style={[Typography.caption, { color: themeColors.neutralForeground3, textAlign: 'center' }]}>
              Read updates
            </Text>
          </Card>
        </View>
      </View>

      {/* Critical Tasks Card */}
      <Card variant="Filled" isDarkMode={isDarkMode} style={{ borderLeftWidth: 4, borderLeftColor: themeColors.dangerForeground1 }}>
        <View style={styles.criticalHeader}>
          <Ionicons name="warning" size={18} color={themeColors.dangerForeground1} />
          <Text style={[Typography.bodyStrong, { color: themeColors.dangerForeground1, marginLeft: Spacing.xxs }]}>
            High Priority Alert
          </Text>
        </View>
        <Text style={[Typography.body, { color: themeColors.neutralForeground1, marginTop: Spacing.xxs }]}>
          Annual review for Case #820-A is overdue by 2 days. Please submit the assessment form.
        </Text>
        <View style={{ marginTop: Spacing.s, flexDirection: 'row' }}>
          <Button
            label="Launch Form"
            appearance="Primary"
            size="Small"
            onPress={() => console.log('Form launched')}
            isDarkMode={isDarkMode}
          />
          <View style={{ width: Spacing.s }} />
          <Button
            label="Dismiss"
            appearance="Subtle"
            size="Small"
            onPress={() => console.log('Dismissed')}
            isDarkMode={isDarkMode}
          />
        </View>
      </Card>
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
  welcomeCard: {
    marginBottom: Spacing.m,
  },
  welcomeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  welcomeTextContainer: {
    flex: 1,
    marginLeft: Spacing.s,
  },
  sectionTitle: {
    marginTop: Spacing.m,
    marginBottom: Spacing.xs,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  progressTrack: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
    width: '100%',
    marginTop: Spacing.xxs,
  },
  progressBar: {
    height: '100%',
    borderRadius: 4,
  },
  actionGrid: {
    flexDirection: 'row',
    marginHorizontal: -Spacing.xs / 2,
    marginBottom: Spacing.m,
  },
  gridCol: {
    flex: 1,
    paddingHorizontal: Spacing.xs / 2,
  },
  gridCard: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 120,
  },
  gridIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  criticalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
