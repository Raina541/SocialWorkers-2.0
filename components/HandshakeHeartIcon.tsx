import React from 'react';
import Svg, { Path, G } from 'react-native-svg';

interface HandshakeHeartIconProps {
  size?: number;
  color?: string;
  style?: any;
}

export const HandshakeHeartIcon: React.FC<HandshakeHeartIconProps> = ({
  size = 24,
  color = '#242424',
  style,
}) => {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 100 85"
      fill="none"
      style={style}
    >
      <G stroke={color} strokeWidth="5.5" strokeLinecap="round" strokeLinejoin="round">
        {/* Heart Outline */}
        <Path d="M 50 78 C 50 78 8 50 8 28 C 8 13 19 6 32 6 C 40 6 46.5 10.5 50 16 C 53.5 10.5 60 6 68 6 C 81 6 92 13 92 28 C 92 50 50 78 50 78 Z" />
        
        {/* Left sleeve/arm coming from the left */}
        <Path d="M 22 46 Q 34 50 42 42" />
        
        {/* Right sleeve/arm coming from the right */}
        <Path d="M 78 46 Q 66 50 58 42" />
        
        {/* Clasping hands (handshake knuckles and thumb joints) */}
        {/* Left hand fingers wrapping */}
        <Path d="M 42 42 C 45 39 45 34 42 31 C 39 28 35 29 32 32 L 29 36" />
        
        {/* Right hand fingers wrapping */}
        <Path d="M 58 42 C 55 39 55 34 58 31 C 61 28 65 29 68 32 L 71 36" />
        
        {/* Knuckle interlocking lines in center */}
        <Path d="M 44 36 C 47 38 53 38 56 36" />
        <Path d="M 47 41 C 49 43 51 43 53 41" />
      </G>
    </Svg>
  );
};
