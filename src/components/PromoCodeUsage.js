import React from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "../theme/colors";
import { useTranslation } from "react-i18next";

const PromoCodeUsage = ({ data, refreshing, onRefresh }) => {
  const { t } = useTranslation();

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  const formatCurrency = (amount) => {
    return `$${parseFloat(amount).toFixed(2)}`;
  };

  const renderUsageItem = ({ item }) => (
    <View style={styles.usageCard}>
      <View style={styles.usageHeader}>
        <View style={styles.orderInfo}>
          <Text style={styles.orderId}>
            {t('promoCode.order')}: #{item.orderDetails?.id || 'N/A'}
          </Text>
          <Text style={styles.usageDate}>
            {formatDate(item.createdAt)}
          </Text>
        </View>
        <View style={[
          styles.statusBadge,
          item.orderDetails?.status === 'completed' && styles.statusCompleted,
          item.orderDetails?.status === 'pending' && styles.statusPending,
          item.orderDetails?.status === 'cancelled' && styles.statusCancelled,
        ]}>
          <Text style={styles.statusText}>
            {item.orderDetails?.status || 'unknown'}
          </Text>
        </View>
      </View>

      <View style={styles.usageDetails}>
        <View style={styles.detailRow}>
          <Ionicons name="pricetag" size={16} color={Colors.primary} />
          <Text style={styles.detailLabel}>{t('promoCode.discountApplied')}:</Text>
          <Text style={styles.detailValue}>
            {formatCurrency(item.discountAmount)}
          </Text>
        </View>

        <View style={styles.detailRow}>
          <Ionicons name="cart" size={16} color={Colors.primary} />
          <Text style={styles.detailLabel}>{t('promoCode.orderAmount')}:</Text>
          <Text style={styles.detailValue}>
            {formatCurrency(item.orderDetails?.amount || 0)}
          </Text>
        </View>

        {item.customerDetails && (
          <View style={styles.detailRow}>
            <Ionicons name="person" size={16} color={Colors.primary} />
            <Text style={styles.detailLabel}>{t('promoCode.usedBy')}:</Text>
            <Text style={styles.detailValue}>
              {item.customerDetails.fullName || item.customerDetails.email}
            </Text>
          </View>
        )}
      </View>
    </View>
  );

  const EmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="pricetag-outline" size={64} color="#E0E0E0" />
      <Text style={styles.emptyStateTitle}>
        {t('promoCode.noUsageData')}
      </Text>
      <Text style={styles.emptyStateText}>
        {t('promoCode.noUsageDescription')}
      </Text>
    </View>
  );

  return (
    <FlatList
      data={data}
      renderItem={renderUsageItem}
      keyExtractor={(item) => item.id.toString()}
      contentContainerStyle={data.length === 0 ? styles.emptyContainer : styles.listContainer}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          colors={[Colors.primary]}
        />
      }
      ListEmptyComponent={EmptyState}
      showsVerticalScrollIndicator={false}
    />
  );
};

const styles = StyleSheet.create({
  listContainer: {
    padding: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  usageCard: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  usageHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  orderInfo: {
    flex: 1,
  },
  orderId: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  usageDate: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: "#E0E0E0",
  },
  statusCompleted: {
    backgroundColor: "#E8F5E8",
  },
  statusPending: {
    backgroundColor: "#FFF3E0",
  },
  statusCancelled: {
    backgroundColor: "#FFEBEE",
  },
  statusText: {
    fontSize: 10,
    fontWeight: "500",
    textTransform: "capitalize",
  },
  usageDetails: {
    borderTopWidth: 1,
    borderTopColor: "#F5F5F5",
    paddingTop: 12,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginLeft: 8,
    marginRight: 4,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: "500",
    color: Colors.textPrimary,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: Colors.textSecondary,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: "center",
    lineHeight: 20,
  },
});

export default PromoCodeUsage;