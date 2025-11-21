import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { scale } from '../../utils/normalizeSize';

export default function OrdersHeader({ title, onBack, onFilter }) {
    const insets = useSafeAreaInsets();
    return (
        <View>
            <LinearGradient
                colors={["#9F0901", "#E20E02"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[styles.gradient, { paddingTop: insets.top }]}
            >
                <View style={styles.centerContainer}>
                    <View style={styles.headerContent}>
                        <TouchableOpacity style={styles.backBtn} onPress={onBack} activeOpacity={0.8}>
                            <Ionicons name="arrow-back" size={24} color="#fff" />
                        </TouchableOpacity>
                        
                        <View style={styles.titleWrapper}>
                            <Text style={styles.title}>{title}</Text>
                        </View>
                        
                        <TouchableOpacity style={styles.filterBtn} onPress={onFilter} activeOpacity={0.8}>
                            <Ionicons name="filter" size={24} color="#fff" />
                        </TouchableOpacity>
                    </View>
                </View>
                
                <View style={{position: "absolute",  top:15, right: -186, backgroundColor: "#FFFFFF0A", height: 80, width: "100%",transform: [{ rotate: "130deg" }], 
                            justifyContent: "center",
                            alignItems: "center", pointerEvents: "none" }}></View>
                            
                <View style={{position: "absolute",  top:15, right: -300, backgroundColor: "#FFFFFF14", height: 120, width: "100%",transform: [{ rotate: "130deg" }],
                            justifyContent: "center",
                            alignItems: "center", pointerEvents: "none" }}></View>
            </LinearGradient>
            <View style={styles.roundedTop} />
        </View>
    );
}

const styles = StyleSheet.create({
  gradient: {
    width: '100%',
    height: scale.hp(23.4),
    paddingHorizontal: scale.wp(6.2),
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    marginBottom: scale.hp(1.55),
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    height: scale.hp(5.2),
  },
  backBtn: {
    width: scale.wp(10.4),
    height: scale.wp(10.4),
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: scale.wp(5.2),
  },
  filterBtn: {
    width: scale.wp(10.4),
    height: scale.wp(10.4),
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: scale.wp(5.2),
  },
  titleWrapper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: scale.hp(2.35),
    fontWeight: '600',
    color: '#fff',
    textAlign: 'center',
    lineHeight: scale.hp(3.1),
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  roundedTop: {
    height: scale.hp(3.1),
    backgroundColor: '#fff',
    borderTopLeftRadius: scale.hp(3.1),
    borderTopRightRadius: scale.hp(3.1),
    marginTop: -scale.hp(3.1),
  },
});