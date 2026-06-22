import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { Colors, Shapes } from '../constants/Theme';
import { Ionicons } from '@expo/vector-icons';

export type PresenceState = 'Available' | 'Away' | 'Busy' | 'DND' | 'Offline' | 'Unknown';

interface AvatarProps {
  size?: number;
  name?: string;
  imageUri?: string;
  presence?: PresenceState;
  isDarkMode?: boolean;
}

export const Avatar: React.FC<AvatarProps> = ({
  size = 40,
  name = '',
  imageUri,
  presence,
  isDarkMode = false,
}) => {
  const themeColors = isDarkMode ? Colors.dark : Colors.light;

  // Get initials (up to 2 letters)
  const getInitials = (fullName: string) => {
    if (!fullName) return '';
    const parts = fullName.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const initials = getInitials(name);
  const presenceSize = Math.max(8, Math.floor(size * 0.28));
  const presenceOffset = Math.floor(size * 0.05);

  const getPresenceColor = (state: PresenceState) => {
    switch (state) {
      case 'Available':
        return '#107c41'; // Success green
      case 'Away':
        return '#d86109'; // Warning orange
      case 'Busy':
      case 'DND':
        return '#c41818'; // Danger red
      case 'Offline':
      default:
        return '#8a8a8a'; // Neutral grey
    }
  };

  const renderPresenceBadge = () => {
    if (!presence) return null;
    const badgeColor = getPresenceColor(presence);

    return (
      <View
        style={[
          styles.presenceContainer,
          {
            width: presenceSize,
            height: presenceSize,
            borderRadius: presenceSize / 2,
            bottom: presenceOffset,
            right: presenceOffset,
            backgroundColor: themeColors.neutralBackground1,
            padding: 1.5,
          },
        ]}
      >
        <View
          style={[
            styles.presenceInner,
            {
              backgroundColor: badgeColor,
              borderRadius: (presenceSize - 3) / 2,
            },
          ]}
        >
          {presence === 'DND' && (
            <View
              style={[
                styles.dndBar,
                {
                  height: presenceSize * 0.15,
                  width: presenceSize * 0.5,
                  backgroundColor: themeColors.neutralBackground1,
                },
              ]}
            />
          )}
        </View>
      </View>
    );
  };

  return (
    <View style={{ width: size, height: size, position: 'relative' }}>
      <View
        style={[
          styles.avatarContainer,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: themeColors.brandBackgroundSubtle,
            borderColor: themeColors.neutralStroke2,
            borderWidth: 1,
          },
        ]}
      >
        {imageUri ? (
          <Image
            source={{ uri: imageUri }}
            style={{ width: '100%', height: '100%', borderRadius: size / 2 }}
          />
        ) : initials ? (
          <Text
            style={[
              styles.initialsText,
              {
                fontSize: Math.floor(size * 0.4),
                color: themeColors.brandForeground1,
              },
            ]}
          >
            {initials}
          </Text>
        ) : (
          <Ionicons
            name="person"
            size={Math.floor(size * 0.5)}
            color={themeColors.neutralForeground3}
          />
        )}
      </View>
      {renderPresenceBadge()}
    </View>
  );
};

const styles = StyleSheet.create({
  avatarContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  initialsText: {
    fontWeight: '600',
  },
  presenceContainer: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 1,
    elevation: 2,
  },
  presenceInner: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dndBar: {
    borderRadius: 1,
  },
});
