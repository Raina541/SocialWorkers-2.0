import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Alert } from 'react-native';
import { Colors, Spacing, Typography, Shapes } from '../constants/Theme';
import { OpportunityCard } from '../components/OpportunityCard';
import { Personalization, Opportunity } from '../services/personalization';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

interface MicroVolunteeringProps {
  isDarkMode?: boolean;
  onBack: () => void;
}

export const MicroVolunteering: React.FC<MicroVolunteeringProps> = ({
  isDarkMode = false,
  onBack,
}) => {
  const themeColors = isDarkMode ? Colors.dark : Colors.light;

  // Fetch opportunities with <= 2 hours commitment
  const [opportunities, setOpportunities] = useState<Opportunity[]>(
    Personalization.getRawOpportunities().filter(opp => opp.durationHrs <= 2.0)
  );

  const handleOpportunityPress = (opp: Opportunity) => {
    // Record signal positive when user clicks on opportunity
    Personalization.recordSignal(opp.cause, 'Save');
    
    Alert.alert(
      "Micro-Volunteering SignUp",
      `Would you like to sign up for "${opp.title}" with ${opp.organizationName}? This requires a commitment of ${opp.durationHrs} hours.`,
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Sign Up", 
          onPress: () => {
            // Record sign up signal
            Personalization.recordSignal(opp.cause, 'SignUp');
            Alert.alert("Success!", "You have signed up for this micro-volunteering opportunity! Your friends have been notified.");
            // Add current user to connections count
            setOpportunities(prev =>
              prev.map(o =>
                o.id === opp.id
                  ? { 
                      ...o, 
                      friendsSignedUpCount: o.friendsSignedUpCount + 1,
                      friendsSignedUpNames: ['You', ...o.friendsSignedUpNames],
                    }
                  : o
              )
            );
          } 
        }
      ]
    );
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: themeColors.neutralBackground2 }]}>
      {/* Header bar */}
      <View style={[styles.header, { borderBottomColor: themeColors.neutralStroke2 }]}>
        <Pressable onPress={onBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={themeColors.neutralForeground1} />
        </Pressable>
        <Text style={[Typography.bodyStrong, styles.headerTitle, { color: themeColors.neutralForeground1 }]}>
          Micro-Volunteering
        </Text>
        <View style={{ width: 40 }} /> {/* balance layout */}
      </View>

      <ScrollView contentContainerStyle={styles.contentContainer} showsVerticalScrollIndicator={false}>
        {/* Banner info */}
        <View style={[styles.banner, { backgroundColor: themeColors.neutralBackground1, borderColor: themeColors.neutralStroke2 }]}>
          <Text style={[Typography.subtitle, { color: themeColors.neutralForeground1, marginBottom: Spacing.xxs }]}>
            Quick Contributions
          </Text>
          <Text style={[Typography.body, { color: themeColors.neutralForeground2 }]}>
            Volunteering doesn't always need to be time-consuming. Explore these listings requiring under 2 hours of time commitment, optimized for busy schedules.
          </Text>
        </View>

        {/* Opportunity Lists */}
        <Text style={[styles.sectionTitle, Typography.bodyStrong, { color: themeColors.neutralForeground1 }]}>
          Available Listings ({opportunities.length})
        </Text>

        {opportunities.map(opp => (
          <OpportunityCard
            key={opp.id}
            opportunity={opp}
            onPress={() => handleOpportunityPress(opp)}
            isDarkMode={isDarkMode}
          />
        ))}

        {opportunities.length === 0 && (
          <View style={styles.emptyContainer}>
            <Ionicons name="sparkles-outline" size={48} color={themeColors.neutralForegroundDisabled} />
            <Text style={[Typography.body, { color: themeColors.neutralForeground3, marginTop: Spacing.s }]}>
              No micro-volunteering options available at this time.
            </Text>
          </View>
        )}
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
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
  },
  contentContainer: {
    padding: Spacing.m,
  },
  banner: {
    padding: Spacing.m,
    borderRadius: Shapes.rounded,
    borderWidth: 1,
    marginBottom: Spacing.m,
  },
  sectionTitle: {
    marginBottom: Spacing.s,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xxl * 2,
  },
});
