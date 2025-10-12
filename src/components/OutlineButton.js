import React from 'react';
import { TouchableOpacity, Text, StyleSheet, Dimensions, PixelRatio } from 'react-native';
import { Colors } from '../theme/colors';
import {widthPercentageToDP as wp, heightPercentageToDP as hp} from 'react-native-responsive-screen';
const {height, width} = Dimensions.get('window');
console.log(height, width);
console.log('hp(1.8):', hp(1.8));
console.log('wp(1.8):', wp(1.8));
console.log('Screen width:', width);
console.log('Screen height:', height);
console.log('PixelRatio:', PixelRatio.get());
console.log('FontScale:', PixelRatio.getFontScale());

export default function OutlineButton({ label, onPress, style }) {
    return (
        <TouchableOpacity style={[styles.button, style]} onPress={onPress} activeOpacity={0.8}>
            <Text style={styles.label}>{label}</Text>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: Colors.white,
    borderRadius: wp(7.5),          
    paddingVertical: hp(1.8),      
    alignItems: 'center',
    borderWidth: wp(0.4),          
    borderColor: Colors.primary,
  },
  label: {
    color: "#E20E02",
    fontSize: hp(1.8),               
    // fontWeight: '600',
  },
});

