import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Typography, Shapes } from '../constants/Theme';

export type BadgeIntent = 'Brand' | 'Danger' | 'Warning' | 'Success' | 'Important' | 'Informative' | 'Subtle';
export type BadgeVariant = 'Filled' | 'Tint' | 'Outline' | 'Subtle';
export type BadgeSize = 'Small' | 'Medium' | 'Large';

interface BadgeProps {
  label: string;
  intent?: BadgeIntent;
  variant?: BadgeVariant;
  size?: BadgeSize;
  isDarkMode?: boolean;
}

export const Badge: React.FC<BadgeProps> = ({
  label,
  intent = 'Brand',
  variant = 'Filled',
  size = 'Medium',
  isDarkMode = false,
}) => {
  const themeColors = isDarkMode ? Colors.dark : Colors.light;

  const getStyleConfigs = () => {
    let backgroundColor = themeColors.brandBackgroundSubtle;
    let textColor = themeColors.brandForeground1;
    let borderColor = 'transparent';

    switch (intent) {
      case 'Brand':
        if (variant === 'Filled') {
          backgroundColor = themeColors.brandBackground;
          textColor = themeColors.neutralForegroundOnBrand;
        } else if (variant === 'Tint') {
          backgroundColor = themeColors.brandBackgroundSubtle;
          textColor = themeColors.brandForeground1;
        } else if (variant === 'Outline') {
          backgroundColor = 'transparent';
          borderColor = themeColors.brandForeground1;
          textColor = themeColors.brandForeground1;
        } else {
          backgroundColor = 'transparent';
          textColor = themeColors.brandForeground1;
        }
        break;
      case 'Danger':
        if (variant === 'Filled') {
          backgroundColor = themeColors.dangerBackground;
          textColor = themeColors.neutralForegroundOnBrand;
        } else if (variant === 'Tint') {
          backgroundColor = themeColors.dangerBackgroundSubtle;
          textColor = themeColors.dangerForeground1;
        } else if (variant === 'Outline') {
          backgroundColor = 'transparent';
          borderColor = themeColors.dangerForeground1;
          textColor = themeColors.dangerForeground1;
        } else {
          backgroundColor = 'transparent';
          textColor = themeColors.dangerForeground1;
        }
        break;
      case 'Warning':
        if (variant === 'Filled') {
          backgroundColor = themeColors.warningBackground;
          textColor = themeColors.neutralForegroundOnBrand;
        } else if (variant === 'Tint') {
          backgroundColor = themeColors.warningBackgroundSubtle;
          textColor = themeColors.warningForeground1;
        } else if (variant === 'Outline') {
          backgroundColor = 'transparent';
          borderColor = themeColors.warningForeground1;
          textColor = themeColors.warningForeground1;
        } else {
          backgroundColor = 'transparent';
          textColor = themeColors.warningForeground1;
        }
        break;
      case 'Success':
        if (variant === 'Filled') {
          backgroundColor = themeColors.successBackground;
          textColor = themeColors.neutralForegroundOnBrand;
        } else if (variant === 'Tint') {
          backgroundColor = themeColors.successBackgroundSubtle;
          textColor = themeColors.successForeground1;
        } else if (variant === 'Outline') {
          backgroundColor = 'transparent';
          borderColor = themeColors.successForeground1;
          textColor = themeColors.successForeground1;
        } else {
          backgroundColor = 'transparent';
          textColor = themeColors.successForeground1;
        }
        break;
      case 'Important':
        if (variant === 'Filled') {
          backgroundColor = themeColors.neutralForeground1;
          textColor = themeColors.neutralBackground1;
        } else if (variant === 'Tint') {
          backgroundColor = themeColors.neutralBackgroundPressed;
          textColor = themeColors.neutralForeground1;
        } else if (variant === 'Outline') {
          backgroundColor = 'transparent';
          borderColor = themeColors.neutralForeground1;
          textColor = themeColors.neutralForeground1;
        } else {
          backgroundColor = 'transparent';
          textColor = themeColors.neutralForeground1;
        }
        break;
      case 'Informative':
        if (variant === 'Filled') {
          backgroundColor = themeColors.infoBackground;
          textColor = themeColors.neutralForegroundOnBrand;
        } else if (variant === 'Tint') {
          backgroundColor = themeColors.infoBackgroundSubtle;
          textColor = themeColors.infoForeground1;
        } else if (variant === 'Outline') {
          backgroundColor = 'transparent';
          borderColor = themeColors.neutralStrokeAccessible;
          textColor = themeColors.neutralForeground1;
        } else {
          backgroundColor = 'transparent';
          textColor = themeColors.neutralForeground2;
        }
        break;
      case 'Subtle':
      default:
        backgroundColor = themeColors.neutralBackground2;
        textColor = themeColors.neutralForeground3;
        if (variant === 'Outline') {
          borderColor = themeColors.neutralStroke1;
        }
        break;
    }

    return { backgroundColor, textColor, borderColor };
  };

  const { backgroundColor, textColor, borderColor } = getStyleConfigs();

  const getPaddingAndFont = () => {
    switch (size) {
      case 'Small':
        return {
          paddingHorizontal: 6,
          paddingVertical: 1,
          fontSize: 10,
          borderRadius: 4,
        };
      case 'Large':
        return {
          paddingHorizontal: 10,
          paddingVertical: 4,
          fontSize: 13,
          borderRadius: Shapes.rounded + 2,
        };
      case 'Medium':
      default:
        return {
          paddingHorizontal: 8,
          paddingVertical: 2.5,
          fontSize: 11.5,
          borderRadius: Shapes.rounded,
        };
    }
  };

  const dimensions = getPaddingAndFont();

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor,
          borderColor,
          borderWidth: borderColor !== 'transparent' ? 1 : 0,
          paddingHorizontal: dimensions.paddingHorizontal,
          paddingVertical: dimensions.paddingVertical,
          borderRadius: dimensions.borderRadius,
        },
      ]}
    >
      <Text style={[styles.text, { color: textColor, fontSize: dimensions.fontSize }]}>
        {label}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    fontWeight: '600',
  },
});
