import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import { Colors } from '../theme/colors';
import { scale } from '../utils/normalizeSize';

export default function SocialButton({ label, icon, onPress }) {
    return (
        <TouchableOpacity style={styles.button} onPress={onPress} activeOpacity={0.9}>
            <View style={{ marginRight: 8 }}>{icon}</View>
            <Text style={styles.label}>{label}</Text>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: scale.hp(6.25),               
    paddingHorizontal: scale.wp(6),     
    borderRadius: scale.hp(1.5),         
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#EFEFEF',
  },
  label: {
    fontSize: scale.hp(1.875),            
    color: Colors.textPrimary,
    fontFamily: 'dmsansMedium',
    // fontWeight: '500', 
  },
});
