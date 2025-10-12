import React from 'react';
import Svg, { 
  Path, 
  Rect, 
  G, 
  ClipPath, 
  LinearGradient, 
  Stop, 
  Defs,
  Filter,
  FeFlood,
  FeColorMatrix,
  FeOffset,
  FeGaussianBlur,
  FeComposite,
  FeBlend
} from 'react-native-svg';

const Bundle = () => {
  return (
    <Svg width="1215" height="1138" viewBox="0 0 1215 1138" fill="none">
      <Path d="M176.186 656.483C120.236 625.19 119.399 535.636 167.105 510.528L505.865 348.992C561.909 316.638 652.775 316.638 708.819 348.992L1045.07 508.854C1096.96 534.799 1094.54 624.129 1038.5 656.483L708.819 846.808C652.775 879.163 561.909 879.163 505.865 846.808L176.186 656.483Z" fill="#F92626"/>
      
      <G filter="url(#filter0_d_1934_31462)">
        <Rect x="4.34902" width="609.998" height="609.998" rx="114.662" transform="matrix(0.866043 -0.49997 0.866043 0.49997 75.2857 564.924)" fill="url(#paint0_linear_1934_31462)" stroke="url(#paint1_linear_1934_31462)" strokeWidth="5.02171"/>
      </G>
      
      <G filter="url(#filter1_d_1934_31462)">
        <Path d="M199.58 455.75L448.313 312.157C528.376 265.937 658.185 265.937 738.248 312.157L986.981 455.75L651.268 649.556C619.242 668.044 567.319 668.044 535.293 649.556L199.58 455.75Z" fill="#FF2228"/>
      </G>
      
      <Path d="M176.514 442.218C120.564 410.925 119.727 321.371 167.433 296.262L506.193 134.727C562.237 102.372 653.103 102.372 709.148 134.727L1045.4 294.588C1097.29 320.534 1094.87 409.863 1038.83 442.218L709.148 632.543C653.103 664.897 562.237 664.897 506.193 632.543L176.514 442.218Z" fill="white" fillOpacity="0.5"/>
      
      <Rect x="4.34902" width="609.998" height="609.998" rx="114.662" transform="matrix(0.866043 -0.49997 0.866043 0.49997 75.6138 350.659)" fill="white" fillOpacity="0.5" stroke="url(#paint2_linear_1934_31462)" strokeWidth="5.02171"/>
      
      <G clipPath="url(#clip0_1934_31462)">
        <Path d="M730.758 215.553C513.779 223.72 350.197 304.679 356.766 400.562C357.013 404.168 364.05 406.999 372.233 406.818L415.735 405.856C423.542 405.685 429.498 402.818 429.296 399.377C424.763 320.72 558.574 254.507 736.442 247.435C744.221 247.127 749.992 244.187 749.484 240.753L746.646 221.6C746.106 218 738.914 215.246 730.758 215.553ZM678.215 360.836C657.224 371.22 659.753 387.307 683.865 396.772C707.977 406.237 744.531 405.492 765.522 395.108C786.513 384.724 783.984 368.637 759.872 359.172C735.76 349.707 699.206 350.452 678.215 360.836ZM741.546 278.921C603.579 285.487 499.768 336.908 500.853 397.99C500.916 401.65 508.009 404.55 516.304 404.355L559.939 403.339C567.54 403.162 573.549 400.431 573.578 397.076C573.929 352.986 648.734 316.078 747.855 310.864C755.414 310.465 760.884 307.523 760.402 304.172L757.669 284.955C757.158 281.298 749.791 278.527 741.546 278.921V278.921Z" fill="url(#paint3_linear_1934_31462)"/>
      </G>
      
      <Defs>
        <LinearGradient id="paint0_linear_1934_31462" x1="115.335" y1="514.764" x2="96.4951" y2="245.671" gradientUnits="userSpaceOnUse">
          <Stop offset="0" stopColor="#FF6C7C"/>
          <Stop offset="1" stopColor="#FF7A90"/>
        </LinearGradient>
        
        <LinearGradient id="paint1_linear_1934_31462" x1="53.2895" y1="250.163" x2="323.295" y2="503.4" gradientUnits="userSpaceOnUse">
          <Stop offset="0" stopColor="white" stopOpacity="0.43"/>
          <Stop offset="0.846595" stopColor="white" stopOpacity="0.44"/>
          <Stop offset="1" stopColor="white" stopOpacity="0"/>
        </LinearGradient>
        
        <LinearGradient id="paint2_linear_1934_31462" x1="74.2297" y1="269.429" x2="354.993" y2="535.114" gradientUnits="userSpaceOnUse">
          <Stop offset="0" stopColor="white" stopOpacity="0.09"/>
          <Stop offset="0.846595" stopColor="white" stopOpacity="0.79"/>
          <Stop offset="1" stopColor="white" stopOpacity="0.17"/>
        </LinearGradient>
        
        <LinearGradient id="paint3_linear_1934_31462" x1="459.948" y1="275.156" x2="567.698" y2="492.97" gradientUnits="userSpaceOnUse">
          <Stop offset="0" stopColor="#F92626"/>
          <Stop offset="1" stopColor="#CD0202"/>
        </LinearGradient>
        
        <ClipPath id="clip0_1934_31462">
          <Rect width="586.347" height="562.757" fill="white" transform="matrix(0.896323 -0.443402 0.93085 0.365401 117 347.984)"/>
        </ClipPath>
        
        {/* Note: SVG filters are not fully supported in React Native SVG */}
        <Filter id="filter0_d_1934_31462" x="0.234146" y="289.578" width="1214.2" height="847.647">
          {/* Filter effects are limited in React Native */}
        </Filter>
        
        <Filter id="filter1_d_1934_31462" x="125.928" y="260.753" width="934.704" height="533.233">
          {/* Filter effects are limited in React Native */}
        </Filter>
      </Defs>
    </Svg>
  );
};

export default Bundle;