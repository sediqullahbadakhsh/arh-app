import React, { useEffect, useState } from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Colors } from '../theme/colors';
import { scale } from '../utils/normalizeSize';

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
            onConfirm?.(); 
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
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  box: {
    width: '80%',
    padding: scale.hp(3.1),
    backgroundColor: '#fff',
    borderRadius: scale.hp(2.1),
  },
  title: {
    fontSize: scale.hp(2.35),
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: scale.hp(2.1),
    textAlign: 'center',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: scale.hp(1.05),
  },
  label: {
    color: Colors.textSecondary,
    fontSize: scale.hp(1.8),
  },
  value: {
    color: Colors.textPrimary,
    fontSize: scale.hp(1.8),
    fontWeight: '600',
  },
  timer: {
    color: Colors.textSecondary,
    fontSize: scale.hp(1.55),
    textAlign: 'center',
    marginTop: scale.hp(1.55),
  },
  btnRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: scale.hp(2.6),
  },
  cancelBtn: {
    flex: 1,
    height: scale.hp(5.7),
    borderRadius: scale.hp(2.9),
    borderWidth: 1,
    borderColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: scale.wp(2.1),
  },
  cancelText: {
    color: Colors.primary,
    fontSize: scale.hp(2),
    fontWeight: '600',
  },
  okBtn: {
    flex: 1,
    height: scale.hp(5.7),
    borderRadius: scale.hp(2.9),
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: scale.wp(2.1),
  },
  okText: {
    color: '#fff',
    fontSize: scale.hp(2),
    fontWeight: '600',
  },
});
