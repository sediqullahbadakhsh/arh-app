import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Colors } from '../theme/colors';

export default function DotIndicators({ total, activeIndex }) {
    return (
        <View style={styles.container}>
            {Array.from({ length: total }).map((_, idx) => (
                <View
                    key={idx}
                    style={[styles.dot, idx === activeIndex ? styles.activeDot : null]}
                />
            ))}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flexDirection: 'row', justifyContent: 'center', marginTop: 8 },
    dot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: '#E0E0E0',
        marginHorizontal: 4,
    },
    activeDot: { backgroundColor: Colors.primary, width: 16, borderRadius: 3 },
});
