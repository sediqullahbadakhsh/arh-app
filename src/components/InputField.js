import React from 'react';
import { View, TextInput, StyleSheet, TouchableOpacity } from 'react-native';
import { Colors } from '../theme/colors';
import { scale } from '../utils/normalizeSize';

export default function InputField({
    value,
    onChangeText,
    placeholder,
    keyboardType = 'default',
    secureTextEntry = false,
    rightIcon,
    onRightIconPress,
    editable = true,
}) {
    return (
        <View style={styles.container}>
            <TextInput
                style={[styles.input, !editable && { backgroundColor: '#F6F6F6', color: '#9E9E9E' }]}
                value={value}
                onChangeText={onChangeText}
                placeholder={placeholder}
                placeholderTextColor="#BDBDBD"
                keyboardType={keyboardType}
                secureTextEntry={secureTextEntry}
                autoCapitalize="none"
                editable={editable}
            />
            {rightIcon && (
                <TouchableOpacity style={styles.iconRight} onPress={onRightIconPress}>
                    {rightIcon}
                </TouchableOpacity>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginBottom: scale.hp(2.1),
  },
  input: {
    width: '100%',
    height: scale.hp(6.2),
    borderRadius: scale.hp(0.8),
    borderWidth: 1,
    borderColor: '#E0E0E0',
    backgroundColor: Colors.pageBackColor || '#FFFFFF',
    paddingHorizontal: scale.wp(4.2),
    paddingRight: scale.wp(11.4),
    fontSize: scale.hp(1.8),
    color: Colors.textPrimary,
  },
  iconRight: {
    position: 'absolute',
    right: scale.wp(3.6),
    top: scale.hp(1.55),
  },
});
