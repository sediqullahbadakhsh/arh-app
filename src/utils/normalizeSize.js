import { PixelRatio } from 'react-native';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';

const getScaleFactor = () => {
  const ratio = PixelRatio.get();
  if (ratio > 3) return 1;
  if (ratio > 2.5) return 0.95;
  return 0.9;
};

export const scale = {
  hp: (val) => hp(val) * getScaleFactor(),
  wp: (val) => wp(val) * getScaleFactor(),
};