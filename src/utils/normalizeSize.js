import { PixelRatio } from 'react-native';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';

const getScaleFactor = () => {
  const ratio = PixelRatio.get();
  if (ratio > 3) return 1.2;
  if (ratio > 2.5) return 1.1;
  return 1;
};

export const scale = {
  hp: (val) => hp(val) * getScaleFactor(),
  wp: (val) => wp(val) * getScaleFactor(),
};