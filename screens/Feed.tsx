import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { Colors, Spacing, Typography } from '../constants/Theme';
import { Card } from '../components/Card';
import { Badge } from '../components/Badge';
import { Avatar } from '../components/Avatar';
import { Button } from '../components/Button';
import { Ionicons } from '@expo/vector-icons';

interface FeedProps {
  isDarkMode?: boolean;
}

interface PostItem {
  id: string;
  author: string;
  role: string;
  avatar: string;
  presence: 'Available' | 'Away' | 'Busy' | 'Offline';
  time: string;
  tag: string;
  tagIntent: 'Brand' | 'Success' | 'Danger' | 'Warning' | 'Important';
  content: string;
  likes: number;
  comments: number;
  likedByUser: boolean;
}

export const Feed: React.FC<FeedProps> = ({ isDarkMode = false }) => {
  const themeColors = isDarkMode ? Colors.dark : Colors.light;

  const [posts, setPosts] = useState<PostItem[]>([
    {
      id: '1',
      author: 'Sarah Jenkins',
      role: 'Director of Child Services',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
      presence: 'Available',
      time: '10 mins ago',
      tag: 'Policy Update',
      tagIntent: 'Important',
      content: 'Effective July 1st, please utilize the updated Family Support Assessment forms (v4.2). The online intake portal will undergo maintenance this Sunday from 2 AM to 6 AM.',
      likes: 12,
      comments: 3,
      likedByUser: false,
    },
    {
      id: '2',
      author: 'Michael Chang',
      role: 'Mental Health Lead',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
      presence: 'Busy',
      time: '2 hours ago',
      tag: 'Resource Alert',
      tagIntent: 'Brand',
      content: 'The downtown shelter has increased its overnight capacity by 20 beds for the winter program. They are also offering hot meals starting from 5:30 PM daily. Case managers can refer clients directly.',
      likes: 8,
      comments: 1,
      likedByUser: true,
    },
    {
      id: '3',
      author: 'Jessica Taylor',
      role: 'Community Outreach',
      avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150',
      presence: 'Away',
      time: '1 day ago',
      tag: 'Success Story',
      tagIntent: 'Success',
      content: 'Shoutout to the East District Team! Thanks to your coordination, we successfully rehoused 8 families this week. Special thanks to Nilap for handling the emergency logistics!',
      likes: 34,
      comments: 7,
      likedByUser: false,
    },
  ]);

  const toggleLike = (postId: string) => {
    setPosts(prev =>
      prev.map(post => {
        if (post.id === postId) {
          return {
            ...post,
            likedByUser: !post.likedByUser,
            likes: post.likedByUser ? post.likes - 1 : post.likes + 1,
          };
        }
        return post;
      })
    );
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: themeColors.neutralBackground2 }]}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      {/* Title */}
      <View style={styles.titleRow}>
        <Text style={[Typography.subtitle, { color: themeColors.neutralForeground1 }]}>
          Social Work Feed
        </Text>
        <Badge label="New Alerts" intent="Brand" variant="Tint" size="Small" isDarkMode={isDarkMode} />
      </View>

      {/* Feed Cards */}
      {posts.map(post => (
        <Card key={post.id} variant="Filled" isDarkMode={isDarkMode} style={styles.feedCard}>
          {/* Post Header */}
          <View style={styles.postHeader}>
            <Avatar size={40} name={post.author} imageUri={post.avatar} presence={post.presence} isDarkMode={isDarkMode} />
            
            <View style={styles.headerText}>
              <Text style={[Typography.bodyStrong, { color: themeColors.neutralForeground1 }]}>
                {post.author}
              </Text>
              <Text style={[Typography.caption, { color: themeColors.neutralForeground3 }]}>
                {post.role} • {post.time}
              </Text>
            </View>

            <Badge label={post.tag} intent={post.tagIntent} variant="Subtle" size="Small" isDarkMode={isDarkMode} />
          </View>

          {/* Post Content */}
          <Text style={[styles.postContent, Typography.body, { color: themeColors.neutralForeground1 }]}>
            {post.content}
          </Text>

          {/* Divider */}
          <View style={[styles.divider, { backgroundColor: themeColors.neutralStroke2 }]} />

          {/* Post Footer Actions */}
          <View style={styles.postActions}>
            <Pressable
              onPress={() => toggleLike(post.id)}
              style={styles.actionButton}
            >
              <Ionicons
                name={post.likedByUser ? 'heart' : 'heart-outline'}
                size={18}
                color={post.likedByUser ? themeColors.dangerForeground1 : themeColors.neutralForeground3}
              />
              <Text
                style={[
                  Typography.captionStrong,
                  {
                    color: post.likedByUser ? themeColors.dangerForeground1 : themeColors.neutralForeground3,
                    marginLeft: Spacing.xxs,
                  },
                ]}
              >
                {post.likes}
              </Text>
            </Pressable>

            <View style={styles.actionButton}>
              <Ionicons name="chatbubble-outline" size={18} color={themeColors.neutralForeground3} />
              <Text style={[Typography.captionStrong, { color: themeColors.neutralForeground3, marginLeft: Spacing.xxs }]}>
                {post.comments}
              </Text>
            </View>

            <View style={{ flex: 1 }} />

            <View style={styles.actionButton}>
              <Ionicons name="share-social-outline" size={18} color={themeColors.neutralForeground3} />
              <Text style={[Typography.captionStrong, { color: themeColors.neutralForeground3, marginLeft: Spacing.xxs }]}>
                Share
              </Text>
            </View>
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
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.m,
  },
  feedCard: {
    marginBottom: Spacing.m,
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.s,
  },
  headerText: {
    flex: 1,
    marginLeft: Spacing.xs,
  },
  postContent: {
    marginBottom: Spacing.m,
    lineHeight: 20,
  },
  divider: {
    height: 1,
    width: '100%',
    marginBottom: Spacing.xs,
  },
  postActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.xs,
    marginRight: Spacing.s,
  },
});
