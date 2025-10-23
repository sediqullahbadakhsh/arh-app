import React from "react";
import {
  View,
  Text,
   SafeAreaView ,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "../../theme/colors";
import ServiceHeader from "../../components/ServiceHeader";

export default function StatementDetailScreen({ navigation, route }) {
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
      title: "Transaction Details",
      items: [
        { label: "Transaction ID", value: statement.transactionId, icon: "receipt-outline" },
        { label: "Type", value: statement.transactionType, icon: "swap-horizontal-outline" },
        { label: "Date & Time", value: formatDate(statement.createdAt), icon: "time-outline" },
      ],
    },
    {
      title: "Amount Details",
      items: [
        { 
          label: "Debit", 
          value: statement.debit ? formatCurrency(statement.debit) : "-", 
          icon: "arrow-down-circle-outline",
          color: statement.debit ? '#EF4444' : Colors.textSecondary 
        },
        { 
          label: "Credit", 
          value: statement.credit ? formatCurrency(statement.credit) : "-", 
          icon: "arrow-up-circle-outline",
          color: statement.credit ? '#10B981' : Colors.textSecondary 
        },
        { 
          label: "Balance After", 
          value: formatCurrency(statement.walletBalance), 
          icon: "wallet-outline",
          color: Colors.textPrimary 
        },
      ],
    },
    {
      title: "Additional Information",
      items: [
        { label: "Remarks", value: statement.remarks || "No remarks", icon: "document-text-outline" },
        { label: "Agent", value: statement.agent?.username || "N/A", icon: "person-outline" },
      ],
    },
  ];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.white }}>
      <ServiceHeader 
        title="Transaction Details" 
        onBack={() => navigation.goBack()} 
      />
      
      <ScrollView style={styles.container}>
        {/* Header Card */}
        <View style={styles.headerCard}>
          <View style={styles.amountSection}>
            <Text style={styles.amountLabel}>Transaction Amount</Text>
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
              {statement.debit ? 'Debit Transaction' : 'Credit Transaction'}
            </Text>
          </View>
        </View>

        {/* Detail Sections */}
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

        {/* Action Buttons */}
        <View style={styles.actionSection}>
          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="share-outline" size={20} color={Colors.primary} />
            <Text style={styles.actionButtonText}>Share Details</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="download-outline" size={20} color={Colors.primary} />
            <Text style={styles.actionButtonText}>Save as PDF</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  headerCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
    alignItems: 'center',
  },
  amountSection: {
    alignItems: 'center',
    marginBottom: 16,
  },
  amountLabel: {
    fontSize: 16,
    color: Colors.textSecondary,
    marginBottom: 8,
  },
  amount: {
    fontSize: 32,
    fontWeight: '700',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 8,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 12,
  },
  sectionCard: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 0,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  detailRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  detailLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  detailLabelText: {
    fontSize: 16,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 16,
    color: Colors.textPrimary,
    fontWeight: '500',
    textAlign: 'right',
    flex: 1,
  },
  actionSection: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 30,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 16,
    gap: 8,
  },
  actionButtonText: {
    fontSize: 16,
    color: Colors.primary,
    fontWeight: '600',
  },
});