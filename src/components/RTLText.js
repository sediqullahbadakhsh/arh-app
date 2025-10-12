import React from 'react';
import { Text, I18nManager } from 'react-native';

export const RTLText = ({ style, children, ...props }) => {
  return (
    <Text
      style={[
        style,
        { 
          textAlign: I18nManager.isRTL ? 'right' : 'left',
          writingDirection: I18nManager.isRTL ? 'rtl' : 'ltr' 
        }
      ]}
      {...props}
    >
      {children}
    </Text>
  );
};