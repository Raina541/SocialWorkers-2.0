import React from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions, Pressable } from 'react-native';
import { Colors, Spacing, Typography, Shapes } from '../constants/Theme';
import { Card } from '../components/Card';
import { Badge } from '../components/Badge';
import { Button } from '../components/Button';
import { Ionicons } from '@expo/vector-icons';

interface BlogProps {
  isDarkMode?: boolean;
}

interface Article {
  id: string;
  title: string;
  author: string;
  date: string;
  readTime: string;
  summary: string;
  category: string;
  categoryIntent: 'Brand' | 'Success' | 'Warning' | 'Danger' | 'Important';
}

const { width: screenWidth } = Dimensions.get('window');

export const Blog: React.FC<BlogProps> = ({ isDarkMode = false }) => {
  const themeColors = isDarkMode ? Colors.dark : Colors.light;

  const featuredArticles: Article[] = [
    {
      id: 'f1',
      title: 'Empathy in Action: Advanced De-escalation Workflows',
      author: 'Dr. Evelyn Martinez',
      date: 'June 15, 2026',
      readTime: '8 min read',
      summary: 'Practical tactics and psychological triggers to de-escalate high-tension client situations in outpatient and domestic visits.',
      category: 'Best Practices',
      categoryIntent: 'Brand',
    },
    {
      id: 'f2',
      title: 'Understanding Modern Substance Abuse Pathways',
      author: 'Marcus Vance, LCSW',
      date: 'June 10, 2026',
      readTime: '12 min read',
      summary: 'An analytical review of newly identified chemical compounds and corresponding treatment referral pipelines in urban sectors.',
      category: 'Clinical Research',
      categoryIntent: 'Important',
    },
  ];

  const recentArticles: Article[] = [
    {
      id: 'r1',
      title: 'Self-Care for First Responders & Social Workers',
      author: 'Kelly Clarkson, PsyD',
      date: 'June 12, 2026',
      readTime: '5 min read',
      summary: 'Preventing secondary traumatic stress through micro-boundaries, structural downtime, and cognitive reframing techniques.',
      category: 'Wellness',
      categoryIntent: 'Success',
    },
    {
      id: 'r2',
      title: 'Guide to Navigating Government Housing Vouchers',
      author: 'Albert Ross, Housing Coordinator',
      date: 'June 08, 2026',
      readTime: '7 min read',
      summary: 'A step-by-step breakdown of Section 8 application filings, fast-track submittals, and emergency local hotel vouchers.',
      category: 'Housing Policy',
      categoryIntent: 'Warning',
    },
    {
      id: 'r3',
      title: 'Child Safety Protocols in Digital Spaces',
      author: 'Sarah Jenkins',
      date: 'May 29, 2026',
      readTime: '10 min read',
      summary: 'What case managers need to know about tracking cyberbullying, digital exploitation, and parent supervision frameworks.',
      category: 'Child Welfare',
      categoryIntent: 'Danger',
    },
  ];

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: themeColors.neutralBackground2 }]}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      {/* Title */}
      <Text style={[Typography.subtitle, { color: themeColors.neutralForeground1, marginBottom: Spacing.s }]}>
        Knowledge Base & Blog
      </Text>

      {/* Featured Header */}
      <Text style={[styles.sectionTitle, Typography.bodyStrong, { color: themeColors.neutralForeground1 }]}>
        Featured Articles
      </Text>

      {/* Horizontal Carousel */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        pagingEnabled
        decelerationRate="fast"
        snapToInterval={screenWidth - Spacing.m * 2 + Spacing.s}
        snapToAlignment="center"
        contentContainerStyle={styles.carouselContainer}
      >
        {featuredArticles.map(article => (
          <Card
            key={article.id}
            variant="Filled"
            isDarkMode={isDarkMode}
            style={[styles.featuredCard, { width: screenWidth - Spacing.m * 2 }]}
          >
            {/* Category and Read time */}
            <View style={styles.cardHeader}>
              <Badge label={article.category} intent={article.categoryIntent} variant="Tint" size="Small" isDarkMode={isDarkMode} />
              <Text style={[Typography.caption, { color: themeColors.neutralForeground3 }]}>
                {article.readTime}
              </Text>
            </View>

            {/* Title */}
            <Text style={[Typography.bodyStrong, styles.featuredTitle, { color: themeColors.neutralForeground1 }]}>
              {article.title}
            </Text>

            {/* Description */}
            <Text style={[Typography.body, styles.featuredSummary, { color: themeColors.neutralForeground2 }]} numberOfLines={3}>
              {article.summary}
            </Text>

            {/* Author */}
            <Text style={[Typography.captionStrong, { color: themeColors.neutralForeground3 }]}>
              By {article.author} • {article.date}
            </Text>
          </Card>
        ))}
      </ScrollView>

      {/* Recent Feed */}
      <Text style={[styles.sectionTitle, Typography.bodyStrong, { color: themeColors.neutralForeground1, marginTop: Spacing.m }]}>
        Recent Publications
      </Text>

      {recentArticles.map(article => (
        <Card key={article.id} variant="Filled" isDarkMode={isDarkMode} style={styles.recentCard}>
          <View style={styles.cardHeader}>
            <Badge label={article.category} intent={article.categoryIntent} variant="Subtle" size="Small" isDarkMode={isDarkMode} />
            <Text style={[Typography.caption, { color: themeColors.neutralForeground3 }]}>
              {article.readTime}
            </Text>
          </View>
          <Text style={[Typography.bodyStrong, { color: themeColors.neutralForeground1, marginVertical: Spacing.xxs }]}>
            {article.title}
          </Text>
          <Text style={[Typography.caption, { color: themeColors.neutralForeground2, marginBottom: Spacing.s }]} numberOfLines={2}>
            {article.summary}
          </Text>
          <View style={styles.cardFooter}>
            <Text style={[Typography.caption, { color: themeColors.neutralForeground3 }]}>
              By {article.author}
            </Text>
            <Pressable onPress={() => console.log('Read clicked')}>
              <Text style={[Typography.captionStrong, { color: themeColors.brandForeground1 }]}>
                Read Article →
              </Text>
            </Pressable>
          </View>
        </Card>
      ))}
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
  sectionTitle: {
    marginBottom: Spacing.xs,
  },
  carouselContainer: {
    paddingRight: Spacing.m,
  },
  featuredCard: {
    marginRight: Spacing.s,
    height: 180,
    justifyContent: 'space-between',
    padding: Spacing.m,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  featuredTitle: {
    fontSize: 16,
    marginVertical: Spacing.xxs,
  },
  featuredSummary: {
    fontSize: 13,
    marginBottom: Spacing.xs,
  },
  recentCard: {
    marginBottom: Spacing.s,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.xxs,
  },
});
