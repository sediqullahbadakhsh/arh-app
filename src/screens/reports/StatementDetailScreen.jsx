import React from "react";
import {
  View,
  Text,
  SafeAreaView,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "../../theme/colors";
import ServiceHeader from "../../components/ServiceHeader";
import { scale } from "../../utils/normalizeSize";
import { useTranslation } from "react-i18next";

export default function StatementDetailScreen({ navigation, route }) {
  const { t } = useTranslation();
  const { statement } = route.params;

  const formatCurrency = (value) => {
    if (!value) return "AFN 0.00";
    return `AFN ${parseFloat(value).toFixed(2)}`;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusColor = (type) => {
    return type?.toLowerCase().includes('debit') ? '#EF4444' : '#10B981';
  };

  const detailSections = [
    {
      title: t('transactionDetails'),
      items: [
        { label: t('transactionId'), value: statement.transactionId, icon: "receipt-outline" },
        { label: t('type'), value: statement.transactionType, icon: "swap-horizontal-outline" },
        { label: t('dateTime'), value: formatDate(statement.createdAt), icon: "time-outline" },
      ],
    },
    {
      title: t('amountDetails'),
      items: [
        { 
          label: t('debit'), 
          value: statement.debit ? formatCurrency(statement.debit) : "-", 
          icon: "arrow-down-circle-outline",
          color: statement.debit ? '#EF4444' : Colors.textSecondary 
        },
        { 
          label: t('credit'), 
          value: statement.credit ? formatCurrency(statement.credit) : "-", 
          icon: "arrow-up-circle-outline",
          color: statement.credit ? '#10B981' : Colors.textSecondary 
        },
        { 
          label: t('balanceAfter'), 
          value: formatCurrency(statement.walletBalance), 
          icon: "wallet-outline",
          color: Colors.textPrimary 
        },
      ],
    },
    {
      title: t('additionalInformation'),
      items: [
        { label: t('remarks'), value: statement.remarks || t('noRemarks'), icon: "document-text-outline" },
        { label: t('agent'), value: statement.agent?.username || t('notAvailable'), icon: "person-outline" },
      ],
    },
  ];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.white }}>
      <ServiceHeader 
        title={t('transactionDetails')} 
        onBack={() => navigation.goBack()} 
      />
      
      <ScrollView style={styles.container}>
        <View style={styles.headerCard}>
          <View style={styles.amountSection}>
            <Text style={styles.amountLabel}>{t('transactionAmount')}</Text>
            <Text style={[
              styles.amount,
              { color: getStatusColor(statement.transactionType) }
            ]}>
              {statement.debit 
                ? `-${formatCurrency(statement.debit)}`
                : `+${formatCurrency(statement.credit)}`
              }
            </Text>
          </View>
          
          <View style={[
            styles.statusBadge,
            { backgroundColor: statement.debit ? '#FEF2F2' : '#F0FDF4' }
          ]}>
            <Ionicons 
              name={statement.debit ? "arrow-down" : "arrow-up"} 
              size={16} 
              color={getStatusColor(statement.transactionType)} 
            />
            <Text style={[
              styles.statusText,
              { color: getStatusColor(statement.transactionType) }
            ]}>
              {statement.debit ? t('debitTransaction') : t('creditTransaction')}
            </Text>
          </View>
        </View>

        {detailSections.map((section, sectionIndex) => (
          <View key={sectionIndex} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            
            <View style={styles.sectionCard}>
              {section.items.map((item, itemIndex) => (
                <View 
                  key={itemIndex}
                  style={[
                    styles.detailRow,
                    itemIndex < section.items.length - 1 && styles.detailRowBorder
                  ]}
                >
                  <View style={styles.detailLabel}>
                    <Ionicons 
                      name={item.icon} 
                      size={18} 
                      color={item.color || Colors.textSecondary} 
                    />
                    <Text style={styles.detailLabelText}>{item.label}</Text>
                  </View>
                  
                  <Text style={[
                    styles.detailValue,
                    item.color && { color: item.color, fontWeight: '600' }
                  ]}>
                    {item.value}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        ))}

        <View style={styles.actionSection}>
          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="share-outline" size={20} color={Colors.primary} />
            <Text style={styles.actionButtonText}>{t('shareDetails')}</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="download-outline" size={20} color={Colors.primary} />
            <Text style={styles.actionButtonText}>{t('saveAsPDF')}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: scale.wp(5.2),
    paddingTop: scale.hp(2.1),
  },
  headerCard: {
    backgroundColor: Colors.white,
    borderRadius: scale.hp(2.1),
    padding: scale.hp(2.6),
    marginBottom: scale.hp(2.6),
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: scale.hp(0.25),
    },
    shadowOpacity: 0.1,
    shadowRadius: scale.hp(0.5),
    elevation: 5,
    alignItems: 'center',
  },
  amountSection: {
    alignItems: 'center',
    marginBottom: scale.hp(2.1),
  },
  amountLabel: {
    fontSize: scale.hp(2.1),
    color: Colors.textSecondary,
    marginBottom: scale.hp(1.05),
  },
  amount: {
    fontSize: scale.hp(4.2),
    fontWeight: '700',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: scale.wp(4.2),
    paddingVertical: scale.hp(1.05),
    borderRadius: scale.hp(2.6),
    gap: scale.wp(2),
  },
  statusText: {
    fontSize: scale.hp(1.8),
    fontWeight: '600',
  },
  section: {
    marginBottom: scale.hp(2.6),
  },
  sectionTitle: {
    fontSize: scale.hp(2.35),
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: scale.hp(1.55),
  },
  sectionCard: {
    backgroundColor: Colors.white,
    borderRadius: scale.hp(1.55),
    padding: 0,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: scale.hp(0.13),
    },
    shadowOpacity: 0.1,
    shadowRadius: scale.hp(0.4),
    elevation: 3,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: scale.hp(2.1),
  },
  detailRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  detailLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale.wp(3.1),
    flex: 1,
  },
  detailLabelText: {
    fontSize: scale.hp(2.1),
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  detailValue: {
    fontSize: scale.hp(2.1),
    color: Colors.textPrimary,
    fontWeight: '500',
    textAlign: 'right',
    flex: 1,
  },
  actionSection: {
    flexDirection: 'row',
    gap: scale.wp(3.1),
    marginBottom: scale.hp(3.9),
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: scale.hp(1.55),
    padding: scale.hp(2.1),
    gap: scale.wp(2),
  },
  actionButtonText: {
    fontSize: scale.hp(2.1),
    color: Colors.primary,
    fontWeight: '600',
  },
});