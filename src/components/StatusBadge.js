import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const StatusBadge = ({ status, statusMap = {}, size = 'medium' }) => {
  const statusConfig = statusMap[status] || {
    color: '#6b7280',
    label: status,
  };
  
  const sizeStyles = {
    small: {
      paddingHorizontal: 8,
      paddingVertical: 2,
      fontSize: 10,
    },
    medium: {
      paddingHorizontal: 12,
      paddingVertical: 4,
      fontSize: 12,
    },
    large: {
      paddingHorizontal: 16,
      paddingVertical: 6,
      fontSize: 14,
    },
  };
  
  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: `${statusConfig.color}20`,
          borderColor: statusConfig.color,
        },
        sizeStyles[size],
      ]}
    >
      <Text
        style={[
          styles.badgeText,
          {
            color: statusConfig.color,
            fontSize: sizeStyles[size].fontSize,
          },
        ]}
      >
        {statusConfig.label}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    borderRadius: 20,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  badgeText: {
    fontWeight: '600',
  },
});

export default StatusBadge;