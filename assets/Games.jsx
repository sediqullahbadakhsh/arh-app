import React from 'react';
import Svg, {
  Defs,
  LinearGradient,
  Stop,
  Rect,
  Path,
  G,
} from 'react-native-svg';

const Games = ({ width, height = 1097 }) => (
  <Svg width={width} height={height} viewBox="0 0 1215 1097" preserveAspectRatio="none" fill="none">
    <Defs>
      <LinearGradient id="paint0_linear" x1="115.335" y1="514.764" x2="96.4951" y2="245.671" gradientUnits="userSpaceOnUse">
        <Stop stopColor="#FF6C7C" />
        <Stop offset="1" stopColor="#FF7A90" />
      </LinearGradient>
      <LinearGradient id="paint1_linear" x1="53.2895" y1="250.163" x2="323.295" y2="503.4" gradientUnits="userSpaceOnUse">
        <Stop stopColor="white" stopOpacity={0.43} />
        <Stop offset="0.846595" stopColor="white" stopOpacity={0.44} />
        <Stop offset="1" stopColor="white" stopOpacity={0} />
      </LinearGradient>
      <LinearGradient id="paint2_linear" x1="74.2297" y1="269.429" x2="354.993" y2="535.114" gradientUnits="userSpaceOnUse">
        <Stop stopColor="white" stopOpacity={0.09} />
        <Stop offset="0.846595" stopColor="white" stopOpacity={0.79} />
        <Stop offset="1" stopColor="white" stopOpacity={0.17} />
      </LinearGradient>
      <LinearGradient id="paint3_linear" x1="456.586" y1="216.186" x2="589.034" y2="449.867" gradientUnits="userSpaceOnUse">
        <Stop stopColor="#F92626" />
        <Stop offset="1" stopColor="#CD0202" />
      </LinearGradient>
    </Defs>

    <Path
      d="M176.186 615.976C120.236 584.682 119.399 495.129 167.105 470.02L505.865 308.485C561.909 276.13 652.775 276.13 708.819 308.485L1045.07 468.346C1096.96 494.292 1094.54 583.621 1038.5 615.976L708.819 806.3C652.775 838.655 561.909 838.655 505.865 806.3L176.186 615.976Z"
      fill="#F92626"
    />

    <G>
      <Rect
        x="4.34902"
        width="609.998"
        height="609.998"
        rx="114.662"
        transform="matrix(0.866043 -0.49997 0.866043 0.49997 75.2857 524.417)"
        fill="url(#paint0_linear)"
        stroke="url(#paint1_linear)"
        strokeWidth="5.02171"
      />
    </G>

    <G>
      <Path
        d="M199.58 415.25L448.313 271.657C528.376 225.437 658.185 225.437 738.248 271.657L986.981 415.25L651.268 609.056C619.242 627.544 567.319 627.544 535.293 609.056L199.58 415.25Z"
        fill="#FF2228"
      />
    </G>

    <Path
      d="M176.514 401.71C120.564 370.417 119.727 280.863 167.433 255.754L506.193 94.219C562.237 61.8645 653.103 61.8645 709.148 94.219L1045.4 254.08C1097.29 280.026 1094.87 369.355 1038.83 401.71L709.148 592.035C653.103 624.389 562.237 624.389 506.193 592.035L176.514 401.71Z"
      fill="white"
      fillOpacity={0.5}
    />

    <Rect
      x="4.34902"
      width="609.998"
      height="609.998"
      rx="114.662"
      transform="matrix(0.866043 -0.49997 0.866043 0.49997 75.6138 310.174)"
      fill="white"
      fillOpacity={0.5}
      stroke="url(#paint2_linear)"
      strokeWidth="5.02171"
    />

    <Path
      d="M620.574 163.289C582.746 158.03 546.673 165.126 520.934 179.715L392.238 252.658C366.499 267.247 355.384 286.896 367.473 306.744C405.494 378.644 527.049 451.256 588.822 445.614C650.595 439.971 608.012 335.948 648.766 312.849C689.519 289.75 884.392 307.457 893.402 272.981C900.266 239.721 757.262 179.265 620.574 163.289ZM538.48 303.269L517.03 315.426L541.989 327.98L520.54 340.137L495.581 327.583L474.132 339.74L449.173 327.187L470.623 315.03L445.664 302.476L467.114 290.319L492.072 302.872L513.521 290.715L538.48 303.269ZM666.785 243.897C679.264 250.173 680.668 260.058 669.943 266.136C659.218 272.215 640.655 272.056 628.176 265.78C615.697 259.503 614.293 249.619 625.018 243.54C635.743 237.461 654.306 237.62 666.785 243.897ZM657.622 195.691C670.101 201.968 671.504 211.852 660.78 217.93C650.055 224.009 631.492 223.851 619.013 217.574C606.534 211.297 605.13 201.413 615.855 195.334C626.579 189.255 645.142 189.414 657.622 195.691Z"
      fill="url(#paint3_linear)"
    />
  </Svg>
);

export default Games;