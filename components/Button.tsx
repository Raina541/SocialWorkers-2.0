import React from 'react';
import { Pressable, Text, StyleSheet, View, ActivityIndicator } from 'react-native';
import { Colors, Shapes, Spacing, Typography } from '../constants/Theme';

export type ButtonAppearance = 'Primary' | 'Secondary' | 'Outline' | 'Subtle';
export type ButtonShape = 'Rounded' | 'Circular' | 'Square';
export type ButtonSize = 'Small' | 'Medium' | 'Large';

interface ButtonProps {
  label: string;
  onPress: () => void;
  appearance?: ButtonAppearance;
  shape?: ButtonShape;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  isDarkMode?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  label,
  onPress,
  appearance = 'Secondary',
  shape = 'Rounded',
  size = 'Medium',
  disabled = false,
  loading = false,
  icon,
  iconPosition = 'left',
  isDarkMode = false,
}) => {
  const themeColors = isDarkMode ? Colors.dark : Colors.light;

  const getBorderRadius = () => {
    switch (shape) {
      case 'Circular':
        return Shapes.circular;
      case 'Square':
        return Shapes.square;
      case 'Rounded':
      default:
        return Shapes.rounded;
    }
  };

  const getPaddingAndFont = () => {
    switch (size) {
      case 'Small':
        return {
          paddingHorizontal: Spacing.s,
          paddingVertical: Spacing.xxs + 1,
          font: Typography.captionStrong,
          height: 32,
        };
      case 'Large':
        return {
          paddingHorizontal: Spacing.xl,
          paddingVertical: Spacing.s,
          font: Typography.bodyStrong,
          height: 48,
        };
      case 'Medium':
      default:
        return {
          paddingHorizontal: Spacing.m,
          paddingVertical: Spacing.xs,
          font: Typography.bodyStrong,
          height: 40,
        };
    }
  };

  const getStyleConfigs = (pressed: boolean) => {
    let backgroundColor = themeColors.neutralBackground1;
    let textColor = themeColors.neutralForeground1;
    let borderColor = 'transparent';

    if (disabled) {
      return {
        backgroundColor: themeColors.neutralBackgroundDisabled,
        textColor: themeColors.neutralForegroundDisabled,
        borderColor: themeColors.neutralStrokeDisabled,
      };
    }

    switch (appearance) {
      case 'Primary':
        backgroundColor = pressed
          ? themeColors.brandBackgroundPressed
          : themeColors.brandBackground;
        textColor = themeColors.neutralForegroundOnBrand;
        break;
      case 'Outline':
        backgroundColor = pressed ? themeColors.brandBackgroundSubtle : 'transparent';
        borderColor = themeColors.brandBackground;
        textColor = themeColors.brandForeground1;
        break;
      case 'Subtle':
        backgroundColor = pressed ? themeColors.neutralBackgroundPressed : 'transparent';
        textColor = themeColors.neutralForeground1;
        break;
      case 'Secondary':
      default:
        backgroundColor = pressed
          ? themeColors.neutralBackgroundPressed
          : themeColors.neutralBackground1;
        borderColor = themeColors.neutralStroke1;
        textColor = themeColors.neutralForeground1;
        break;
    }

    return { backgroundColor, textColor, borderColor };
  };

  const borderRadius = getBorderRadius();
  const dimensions = getPaddingAndFont();

  return (
    <Pressable
      onPress={disabled || loading ? undefined : onPress}
      style={({ pressed }) => {
        const { backgroundColor, borderColor } = getStyleConfigs(pressed);
        return [
          styles.button,
          {
            backgroundColor,
            borderColor,
            borderWidth: borderColor !== 'transparent' ? 1 : 0,
            borderRadius,
            paddingHorizontal: dimensions.paddingHorizontal,
            height: dimensions.height,
            opacity: disabled ? 0.6 : 1,
          },
        ];
      }}
    >
      {({ pressed }) => {
        const { textColor } = getStyleConfigs(pressed);

        if (loading) {
          return (
            <ActivityIndicator
              size="small"
              color={textColor}
              style={{ marginRight: Spacing.xxs }}
            />
          );
        }

        return (
          <View style={styles.contentContainer}>
            {icon && iconPosition === 'left' && (
              <View style={styles.leftIconContainer}>{icon}</View>
            )}
            <Text style={[styles.text, dimensions.font, { color: textColor }]}>
              {label}
            </Text>
            {icon && iconPosition === 'right' && (
              <View style={styles.rightIconContainer}>{icon}</View>
            )}
          </View>
        );
      }}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  button: {
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
  },
  contentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  leftIconContainer: {
    marginRight: Spacing.xxs + 2,
  },
  rightIconContainer: {
    marginLeft: Spacing.xxs + 2,
  },
  text: {
    textAlign: 'center',
  },
});
