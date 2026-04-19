import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { scale } from '../../../utils/normalizeSize';

export default function NotificationsHeader({ 
  title, 
  onBack, 
  onOpenModal, 
  unreadCount,
  onMarkAllAsRead,
  hasUnreadNotifications,
  onSync 
}) {
    const { t } = useTranslation();
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
                            {unreadCount > 0 && (
                                <View style={styles.unreadBadge}>
                                    <Text style={styles.unreadCount}>{unreadCount}</Text>
                                </View>
                            )}
                        </View>
                        
                        <View style={styles.rightActions}>
                            {onSync && (
                                <TouchableOpacity 
                                    style={[styles.actionBtn, styles.syncBtn]}
                                    onPress={onSync}
                                    activeOpacity={0.8}
                                >
                                    <Ionicons name="refresh" size={20} color="#fff" />
                                </TouchableOpacity>
                            )}
                            
                            {onMarkAllAsRead && hasUnreadNotifications && (
                                <TouchableOpacity 
                                    style={[styles.actionBtn, styles.markAllReadBtn]}
                                    onPress={onMarkAllAsRead}
                                    activeOpacity={0.8}
                                >
                                    <Ionicons name="checkmark-done" size={20} color="#fff" />
                                </TouchableOpacity>
                            )}
                            
                            {onOpenModal && (
                                <TouchableOpacity 
                                    style={styles.actionBtn}
                                    onPress={onOpenModal}
                                    activeOpacity={0.8}
                                >
                                    <Ionicons name="settings" size={24} color="#fff" />
                                </TouchableOpacity>
                            )}
                        </View>
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
    height: scale.hp(23.2),
    paddingHorizontal: scale.wp(5.8),
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
    width: scale.wp(9.75),
    height: scale.wp(9.75),
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: scale.wp(4.9),
  },
  titleWrapper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
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
  unreadBadge: {
    backgroundColor: '#fff',
    borderRadius: scale.hp(1.55),
    minWidth: scale.wp(5.8),
    height: scale.hp(3.1),
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: scale.wp(1.5),
    marginLeft: scale.wp(2),
  },
  unreadCount: {
    color: '#E20E02',
    fontSize: scale.hp(1.55),
    fontWeight: 'bold',
  },
  rightActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionBtn: {
    width: scale.wp(9.75),
    height: scale.wp(9.75),
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: scale.wp(4.9),
    marginLeft: scale.wp(2),
  },
  syncBtn: {
    marginLeft: 0,
  },
  markAllReadBtn: {
    // Same as actionBtn
  },
  roundedTop: {
    height: scale.hp(3.1),
    backgroundColor: '#fff',
    borderTopLeftRadius: scale.hp(3.1),
    borderTopRightRadius: scale.hp(3.1),
    marginTop: -scale.hp(3.1),
  },
});