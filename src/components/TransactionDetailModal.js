import React, { useRef } from 'react';
import {
    Modal,
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Dimensions,
} from 'react-native';
import { Colors } from '../theme/colors';
import { Ionicons } from '@expo/vector-icons';
import { captureRef } from 'react-native-view-shot';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';

const { width } = Dimensions.get('window');

export default function TransactionDetailModal({ visible, onClose, tx }) {
    const shotRef = useRef(null);

    const shareImage = async () => {
        try {
            const uri = await captureRef(shotRef, {
                format: 'png',
                quality: 1,
                result: 'tmpfile', // returns file path
            });

            // Some platforms require file in cache dir
            const dest = FileSystem.cacheDirectory + `tx-${tx?.id}.png`;
            await FileSystem.copyAsync({ from: uri, to: dest });

            await Sharing.shareAsync(dest, {
                mimeType: 'image/png',
                dialogTitle: 'Share Transaction',
            });
        } catch (err) {
            console.log('share error', err);
        }
    };

    if (!tx) return null;

    return (
        <Modal transparent visible={visible} animationType="fade">
            <View style={styles.backdrop}>
                <View style={styles.container}>
                    <View style={styles.headerBar}>
                        <TouchableOpacity onPress={onClose} style={styles.iconBtn}>
                            <Ionicons name="close" size={22} color="#000" />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={shareImage} style={styles.iconBtn}>
                            <Ionicons name="share-outline" size={22} color="#000" />
                        </TouchableOpacity>
                    </View>

                    {/* white background capture area */}
                    <View style={styles.captureWrapper} ref={shotRef} collapsable={false}>
                        <Text style={styles.title}>Transaction Details</Text>

                        <DetailRow label="Type" value={tx.type} />
                        <DetailRow label="Amount" value={`${tx.amount} ${tx.currency || 'AFN'}`} />
                        <DetailRow label="Card Type" value={tx.cardType} />
                        <DetailRow label="Card Number" value={tx.cardNumber} />
                        <DetailRow label="Phone Number" value={tx.phone} />
                        <DetailRow label="Transaction ID" value={tx.txId} />
                        <DetailRow label="Date" value={formatFullDate(tx.date)} />
                    </View>
                </View>
            </View>
        </Modal>
    );
}

function DetailRow({ label, value }) {
    return (
        <View style={styles.row}>
            <Text style={styles.rowLabel}>{label}</Text>
            <Text style={styles.rowValue}>{value}</Text>
        </View>
    );
}

function formatFullDate(dateStr) {
    const d = new Date(dateStr);
    const date = d.toLocaleDateString('en', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });
    const time = d.toLocaleTimeString('en', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
    });
    return `${date} ${time}`;
}

const styles = StyleSheet.create({
    backdrop: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.35)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    container: {
        width: width * 0.9,
        borderRadius: 16,
        backgroundColor: '#fff',
        paddingBottom: 16,
        overflow: 'hidden',
    },
    headerBar: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        paddingHorizontal: 8,
        paddingTop: 8,
    },
    iconBtn: {
        padding: 6,
        marginLeft: 4,
    },
    captureWrapper: {
        backgroundColor: '#fff',
        padding: 20,
        borderRadius: 12,
    },
    title: {
        fontSize: 18,
        color: Colors.textPrimary,
        fontWeight: '700',
        textAlign: 'center',
        marginBottom: 16,
    },
    row: {
        flexDirection: 'row',
        marginBottom: 8,
        justifyContent: 'space-between',
    },
    rowLabel: { fontSize: 13, color: Colors.textSecondary },
    rowValue: { fontSize: 13, color: Colors.textPrimary, fontWeight: '600', maxWidth: '55%', textAlign: 'right' },
});
