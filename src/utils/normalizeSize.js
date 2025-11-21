import { Dimensions, PixelRatio } from 'react-native';

const { width, height } = Dimensions.get('window');
const pixelRatio = PixelRatio.get();


const scaleFactor = (() => {
  if (pixelRatio >= 3.6) return 0.9;
  if (pixelRatio >= 3.5) return 1.0;
  if (pixelRatio >= 3.0) return 0.95;
  if (pixelRatio >= 2.5) return 0.9;
  if (pixelRatio >= 2.0) return 0.85;
  if (pixelRatio >= 1.5) return 0.8;
  if (pixelRatio >= 1.0) return 0.75;
  return 0.7;
})();


const heightModifier = (() => {
  if (height >= 1000) return 1.15;   
  if (height >= 900) return 1.1;      
  if (height >= 830) return 0.9;
  if (height >= 800) return 0.95;
  if (height >= 750) return 0.95;
  if (height >= 700) return 0.9;
  if (height >= 650) return 0.875;
  if (height >= 600) return 0.85;
  return 0.8;                          
})();


const widthModifier = (() => {
  if (width >= 600) return 0.9;      
  if (width >= 480) return 0.95;      
  if (width >= 420) return 0.975;     
  if (width >= 400) return 1.0;      
  if (width >= 390) return 1.05;
  if (width >= 380) return 1.1;
  if (width >= 370) return 1.15;
  if (width >= 360) return 1.15;      
  return 1.3;                         
})();


const clamp = (val, min, max) => Math.min(Math.max(val, min), max);


export const scale = {
  wp: (val) => clamp((width * val) / 100 * scaleFactor * widthModifier, 0, width),
  hp: (val) => clamp((height * val) / 100 * scaleFactor * heightModifier, 0, height),
};


console.log('📱 Device Metrics');
console.log('Width:', width);
console.log('Height:', height);
console.log('Pixel Ratio:', pixelRatio);
console.log('Scale Factor:', scaleFactor);
console.log('Height Modifier:', heightModifier);
console.log('Width Modifier:', widthModifier);