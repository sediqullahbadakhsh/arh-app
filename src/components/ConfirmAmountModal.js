import React, { useEffect, useState } from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Colors } from '../theme/colors';

export default function ConfirmAmountModal({
    visible,
    usd,
    afn,
    onConfirm,
    onCancel,
    autoCloseSec = 3,   // 0 = no auto close
}) {
    const [count, setCount] = useState(autoCloseSec);

    useEffect(() => {
        if (!visible || autoCloseSec === 0) return;
        setCount(autoCloseSec);
        const interval = setInterval(() => {
            setCount((c) => c - 1);
        }, 1000);
        return () => clearInterval(interval);
    }, [visible, autoCloseSec]);

    useEffect(() => {
        if (autoCloseSec > 0 && count === 0 && visible) {
            onConfirm?.(); // auto-confirm, or change to onCancel if you prefer auto-close
        }
    }, [count, visible, autoCloseSec, onConfirm]);

    return (
        <Modal transparent visible={visible} animationType="fade">
            <View style={styles.backdrop}>
                <View style={styles.box}>
                    <Text style={styles.title}>Confirm Amount</Text>

                    <View style={styles.row}>
                        <Text style={styles.label}>USD</Text>
                        <Text style={styles.value}>{usd}</Text>
                    </View>
                    <View style={styles.row}>
                        <Text style={styles.label}>AFN</Text>
                        <Text style={styles.value}>{afn}</Text>
                    </View>

                    {autoCloseSec > 0 && (
                        <Text style={styles.timer}>Auto confirm in {count}s...</Text>
                    )}

                    <View style={styles.btnRow}>
                        <TouchableOpacity style={styles.cancelBtn} onPress={onCancel}>
                            <Text style={styles.cancelText}>Cancel</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.okBtn} onPress={onConfirm}>
                            <Text style={styles.okText}>Confirm</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    backdrop: {
        flex: 1, backgroundColor: 'rgba(0,0,0,0.35)',
        justifyContent: 'center', alignItems: 'center',
    },
    box: {
        width: '80%', padding: 24, backgroundColor: '#fff',
        borderRadius: 16,
    },
    title: {
        fontSize: 18, fontWeight: '600', color: Colors.textPrimary,
        marginBottom: 16, textAlign: 'center',
    },
    row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
    label: { color: Colors.textSecondary, fontSize: 14 },
    value: { color: Colors.textPrimary, fontSize: 14, fontWeight: '600' },
    timer: { color: Colors.textSecondary, fontSize: 12, textAlign: 'center', marginTop: 12 },
    btnRow: {
        flexDirection: 'row', justifyContent: 'space-between',
        marginTop: 20,
    },
    cancelBtn: {
        flex: 1, height: 44, borderRadius: 22,
        borderWidth: 1, borderColor: Colors.primary,
        justifyContent: 'center', alignItems: 'center', marginRight: 8,
    },
    cancelText: { color: Colors.primary, fontSize: 15, fontWeight: '600' },
    okBtn: {
        flex: 1, height: 44, borderRadius: 22,
        backgroundColor: Colors.primary,
        justifyContent: 'center', alignItems: 'center', marginLeft: 8,
    },
    okText: { color: '#fff', fontSize: 15, fontWeight: '600' },
});
