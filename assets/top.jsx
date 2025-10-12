import React from 'react';
import Svg, {
  Defs,
  LinearGradient,
  Stop,
  ClipPath,
  Rect,
  G,
  Path,
} from 'react-native-svg';

const HeaderBackgroundSVG = ({ width, height = 170 }) => (
  <Svg width={width} height={height} viewBox="0 0 375 178" preserveAspectRatio="none" fill="none">
    <Defs>
      <LinearGradient
        id="paint0_linear_621_8339"
        x1="375"
        y1="0"
        x2="69.6565"
        y2="259.851"
        gradientUnits="userSpaceOnUse"
      >
        <Stop offset="0" stopColor="#E20E02" />
        <Stop offset="1" stopColor="#9F0901" />
      </LinearGradient>
      <ClipPath id="clip0_621_8339">
        <Rect width="375" height="178" fill="white" />
      </ClipPath>
    </Defs>
    <G clipPath="url(#clip0_621_8339)">
      <Rect width="375" height="178" fill="url(#paint0_linear_621_8339)" />
      <Path
        d="M362.779 -37.0003L490 126.311L186.221 378L59 214.689L362.779 -37.0003Z"
        fill="white"
        fillOpacity={0.03}
      />
      <Path
        d="M382.433 18.3204L474.288 136.232L233.087 336.074L141.232 218.162L382.433 18.3204Z"
        fill="white"
        fillOpacity={0.04}
      />
      <Path
        d="M401.246 70.1189L469.839 158.17L286.082 310.418L217.489 222.367L401.246 70.1189Z"
        fill="white"
        fillOpacity={0.08}
      />
    </G>
  </Svg>
);

export default HeaderBackgroundSVG;