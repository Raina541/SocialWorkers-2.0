import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet, LayoutAnimation, Platform, UIManager } from 'react-native';
import { Colors, Spacing, Typography, Shapes } from '../constants/Theme';
import { Ionicons } from '@expo/vector-icons';

// Enable LayoutAnimation for Android
if (Platform.OS === 'android') {
  if (UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
  }
}

interface AccordionProps {
  title: string;
  children: React.ReactNode;
  initiallyExpanded?: boolean;
  chevronPosition?: 'before' | 'after';
  isDarkMode?: boolean;
}

export const Accordion: React.FC<AccordionProps> = ({
  title,
  children,
  initiallyExpanded = false,
  chevronPosition = 'after',
  isDarkMode = false,
}) => {
  const [expanded, setExpanded] = useState(initiallyExpanded);
  const themeColors = isDarkMode ? Colors.dark : Colors.light;

  const toggleExpand = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded(!expanded);
  };

  const renderChevron = () => {
    return (
      <Ionicons
        name={expanded ? 'chevron-down' : 'chevron-forward'}
        size={16}
        color={themeColors.neutralForeground2}
        style={chevronPosition === 'before' ? { marginRight: Spacing.xs } : { marginLeft: Spacing.xs }}
      />
    );
  };

  return (
    <View
      style={[
        styles.container,
        {
          borderColor: themeColors.neutralStroke2,
          backgroundColor: themeColors.neutralBackground1,
        },
      ]}
    >
      <Pressable
        onPress={toggleExpand}
        style={({ pressed }) => [
          styles.header,
          {
            backgroundColor: pressed
              ? themeColors.neutralBackgroundPressed
              : themeColors.neutralBackground1,
          },
        ]}
      >
        {chevronPosition === 'before' && renderChevron()}
        <Text
          style={[
            styles.titleText,
            Typography.bodyStrong,
            { color: themeColors.neutralForeground1, flex: 1 },
          ]}
        >
          {title}
        </Text>
        {chevronPosition === 'after' && renderChevron()}
      </Pressable>
      {expanded && (
        <View
          style={[
            styles.content,
            {
              borderTopColor: themeColors.neutralStroke2,
              backgroundColor: themeColors.neutralBackground2,
            },
          ]}
        >
          {children}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
    borderRadius: Shapes.rounded,
    marginVertical: 4,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.s,
  },
  titleText: {},
  content: {
    borderTopWidth: 1,
    padding: Spacing.m,
  },
});
