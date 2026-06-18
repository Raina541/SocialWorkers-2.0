import React from 'react';
import Svg, { Path, Circle, G } from 'react-native-svg';

interface RelaxedVolunteerProps {
  color: string;
  size?: number;
  style?: any;
}

const RelaxedVolunteerIllustrationRaw: React.FC<RelaxedVolunteerProps> = ({
  color,
  size = 120,
  style,
}) => {
  return (
    <Svg
      width={size}
      height={size * 1.2}
      viewBox="0 0 150 180"
      fill="none"
      style={style}
    >
      <G stroke={color} strokeWidth={2.8} strokeLinecap="round" strokeLinejoin="round">
        {/* Flower Stem */}
        <Path d="M 125 170 Q 135 110 128 50" />
        
        {/* Flower Center */}
        <Circle cx={128} cy={46} r={3} fill={color} />
        
        {/* Flower Petals (Hand-drawn look using arcs) */}
        <Path d="M 128 41 C 124 32, 132 32, 128 41" />
        <Path d="M 133 46 C 142 42, 142 50, 133 46" />
        <Path d="M 128 51 C 132 60, 124 60, 128 51" />
        <Path d="M 123 46 C 114 50, 114 42, 123 46" />
        <Path d="M 125 43 C 118 35, 124 29, 128 41" />
        
        {/* Meditative Person */}
        {/* Head */}
        <Path d="M 55 60 C 40 60, 40 25, 60 25 C 80 25, 80 60, 65 60 Z" />
        
        {/* Face details (Closed eyes and a gentle smile) */}
        <Path d="M 52 40 Q 56 43 60 40" strokeWidth={2} />
        <Path d="M 66 40 Q 70 43 74 40" strokeWidth={2} />
        <Path d="M 59 48 Q 63 52 67 48" strokeWidth={2} />

        {/* Torso & Back outline */}
        <Path d="M 46 62 C 30 75, 20 100, 22 135 C 23 150, 35 160, 50 155" />
        <Path d="M 78 62 C 95 75, 102 100, 98 135 C 97 150, 85 160, 70 155" />

        {/* Hugged Knees & Legs */}
        {/* Left Knee */}
        <Path d="M 22 135 C 20 100, 42 85, 48 95 C 55 110, 52 140, 52 155" />
        {/* Right Knee */}
        <Path d="M 98 135 C 100 100, 78 85, 72 95 C 65 110, 68 140, 68 155" />

        {/* Left Arm hugging knees */}
        <Path d="M 46 66 C 30 75, 28 105, 45 105 C 55 105, 58 102, 65 105" />
        {/* Right Arm hugging knees */}
        <Path d="M 82 66 C 94 75, 96 105, 79 105 C 69 105, 66 102, 59 105" />

        {/* Interlaced Hands / Fingers details */}
        <Path d="M 55 101 C 55 96, 62 96, 62 101" />
        <Path d="M 58 103 C 58 98, 65 98, 65 103" />
        <Path d="M 61 105 C 61 100, 68 100, 68 105" />

        {/* Crossed feet at the bottom */}
        {/* Left Foot */}
        <Path d="M 52 155 C 40 160, 25 155, 18 165 C 15 170, 25 175, 38 172" />
        {/* Left Toes */}
        <Circle cx={15} cy={162} r={2.2} fill={color} />
        <Circle cx={12} cy={166} r={1.9} fill={color} />
        <Circle cx={11} cy={171} r={1.6} fill={color} />
        <Circle cx={12} cy={176} r={1.3} fill={color} />
        <Circle cx={15} cy={180} r={1} fill={color} />

        {/* Right Foot */}
        <Path d="M 68 155 C 80 160, 95 155, 102 165 C 105 170, 95 175, 82 172" />
        {/* Right Toes */}
        <Circle cx={105} cy={162} r={2.2} fill={color} />
        <Circle cx={108} cy={166} r={1.9} fill={color} />
        <Circle cx={109} cy={171} r={1.6} fill={color} />
        <Circle cx={108} cy={176} r={1.3} fill={color} />
        <Circle cx={105} cy={180} r={1} fill={color} />
      </G>
    </Svg>
  );
};

export const RelaxedVolunteerIllustration = React.memo(RelaxedVolunteerIllustrationRaw);
