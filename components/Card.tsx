import React from 'react';
import { Pressable, View, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { Colors, Shapes, Spacing } from '../constants/Theme';

export type CardVariant = 'Filled' | 'Flat';
export type CardSize = 'Small' | 'Medium' | 'Large';

interface CardProps {
  children: React.ReactNode;
  variant?: CardVariant;
  size?: CardSize;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  isDarkMode?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  variant = 'Filled',
  size = 'Medium',
  onPress,
  style,
  isDarkMode = false,
}) => {
  const themeColors = isDarkMode ? Colors.dark : Colors.light;

  const getPadding = () => {
    switch (size) {
      case 'Small':
        return Spacing.s;
      case 'Large':
        return Spacing.xl;
      case 'Medium':
      default:
        return Spacing.m;
    }
  };

  const getBaseStyle = () => {
    if (variant === 'Filled') {
      return {
        backgroundColor: themeColors.neutralBackground1,
        borderColor: themeColors.neutralStroke2,
        borderWidth: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: isDarkMode ? 0.4 : 0.04,
        shadowRadius: 6,
        elevation: 2,
      };
    } else {
      // Flat / Outline
      return {
        backgroundColor: themeColors.neutralBackground2,
        borderColor: 'transparent',
        borderWidth: 0,
      };
    }
  };

  const baseStyle = getBaseStyle();
  const padding = getPadding();

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [
          styles.card,
          baseStyle,
          {
            padding,
            borderRadius: Shapes.rounded + 2,
            backgroundColor: pressed
              ? themeColors.neutralBackgroundPressed
              : baseStyle.backgroundColor,
          },
          style,
        ]}
      >
        {children}
      </Pressable>
    );
  }

  return (
    <View
      style={[
        styles.card,
        baseStyle,
        {
          padding,
          borderRadius: Shapes.rounded + 2,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    marginVertical: 6,
    overflow: 'hidden',
  },
});
