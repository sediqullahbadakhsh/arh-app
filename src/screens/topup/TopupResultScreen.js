import React from 'react';
import { View, Text,  SafeAreaView , StyleSheet, TouchableOpacity } from 'react-native';
// import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../../theme/colors';
import { Ionicons } from '@expo/vector-icons';
import { scale } from '../../utils/normalizeSize';

export default function TopupResultScreen({ navigation, route }) {
    const { mobile, usdAmount, cardType, cardNumber, transactionId, date, status } = route.params || {};
    const last4 = cardNumber ? cardNumber.slice(-4) : '****';

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: Colors.white }}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.popToTop()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color="#000" />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => console.log('Print or share')} style={styles.printBtn}>
                    <Ionicons name="print-outline" size={22} color="#000" />
                </TouchableOpacity>
            </View>

            <View style={styles.container}>
                <View style={styles.checkCircle}>
                    <Ionicons name="checkmark" size={56} color="#fff" />
                </View>
                <Text style={styles.title}>{status === 'success' ? 'Topup Successful!' : 'Topup Failed'}</Text>

                <View style={styles.detailRow}>
                    <Text style={styles.key}>Card Type</Text>
                    <Text style={styles.value}>{cardType || '-'}</Text>
                </View>
                <View style={styles.detailRow}>
                    <Text style={styles.key}>Card Number</Text>
                    <Text style={styles.value}>{last4 === '****' ? '****' : `**** **** **** ${last4}`}</Text>
                </View>
                <View style={styles.detailRow}>
                    <Text style={styles.key}>Mobile Number</Text>
                    <Text style={styles.value}>{mobile || '-'}</Text>
                </View>
                <View style={styles.detailRow}>
                    <Text style={styles.key}>Transaction ID</Text>
                    <Text style={styles.value}>{transactionId || '-'}</Text>
                </View>
                <View style={styles.detailRow}>
                    <Text style={styles.key}>Date</Text>
                    <Text style={styles.value}>{date ? new Date(date).toLocaleString() : '-'}</Text>
                </View>

                <View style={styles.totalBox}>
                    <Text style={styles.totalLabel}>Total Topup Amount</Text>
                    <Text style={styles.totalValue}>{usdAmount || 0}</Text>
                </View>

                <TouchableOpacity style={styles.doneBtn} onPress={() => navigation.popToTop()}>
                    <Text style={styles.doneText}>Done</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
  header: {
    height: scale.hp(15.5),
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: scale.wp(4.2),
  },
  backBtn: {
    padding: scale.hp(0.8),
  },
  printBtn: {
    padding: scale.hp(0.8),
  },
  container: {
    flex: 1,
    paddingHorizontal: scale.wp(6.2),
    alignItems: 'center',
    paddingTop: scale.hp(2.1),
  },
  checkCircle: {
    width: scale.wp(24.8),
    height: scale.wp(24.8),
    borderRadius: scale.wp(12.4),
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: scale.hp(2.1),
  },
  title: {
    fontSize: scale.hp(3.1),
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: scale.hp(3.1),
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    paddingVertical: scale.hp(0.8),
  },
  key: {
    color: Colors.textSecondary,
    fontSize: scale.hp(1.8),
  },
  value: {
    color: Colors.textPrimary,
    fontSize: scale.hp(1.8),
  },
  totalBox: {
    width: '100%',
    backgroundColor: '#F44336',
    borderRadius: scale.hp(1.55),
    paddingVertical: scale.hp(2.1),
    marginTop: scale.hp(3.1),
    marginBottom: scale.hp(3.1),
    alignItems: 'center',
  },
  totalLabel: {
    color: '#fff',
    fontSize: scale.hp(1.8),
    marginBottom: scale.hp(0.5),
  },
  totalValue: {
    color: '#fff',
    fontSize: scale.hp(3.7),
    fontWeight: '600',
  },
  doneBtn: {
    width: '100%',
    height: scale.hp(6.7),
    borderRadius: scale.hp(3.4),
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  doneText: {
    color: '#fff',
    fontSize: scale.hp(2.6),
    fontWeight: '600',
  },
});
