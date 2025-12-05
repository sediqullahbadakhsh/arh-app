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
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return 'Invalid Date';
    }
  };

  const formatCurrency = (amount) => {
    if (!amount) return '$0.00';
    return `$${parseFloat(amount).toFixed(2)}`;
  };

  const getStatusConfig = (status) => {
    switch (status?.toLowerCase()) {
      case 'completed':
      case 'delivered':
        return {
          color: '#4CAF50',
          backgroundColor: '#E8F5E8',
          text: t('common.completed')
        };
      case 'pending':
      case 'processing':
        return {
          color: '#FF9800',
          backgroundColor: '#FFF3E0',
          text: t('common.pending')
        };
      case 'cancelled':
      case 'rejected':
        return {
          color: '#F44336',
          backgroundColor: '#FFEBEE',
          text: t('common.cancelled')
        };
      default:
        return {
          color: '#9E9E9E',
          backgroundColor: '#F5F5F5',
          text: status || t('common.unknown')
        };
    }
  };

  const renderUsageItem = ({ item, index }) => {
    const statusConfig = getStatusConfig(item.orderDetails?.status);
    
    return (
      <View style={[
        styles.usageCard,
        index === 0 && styles.firstCard,
        index === data.length - 1 && styles.lastCard
      ]}>
        {/* Header with Order ID and Date */}
        <View style={styles.usageHeader}>
          <View style={styles.orderInfo}>
            <Text style={styles.orderId}>
              {t('promoCode.order')}: #{item.orderDetails?.id || item.id}
            </Text>
            <Text style={styles.usageDate}>
              {formatDate(item.createdAt)}
            </Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: statusConfig.backgroundColor }]}>
            <Text style={[styles.statusText, { color: statusConfig.color }]}>
              {statusConfig.text}
            </Text>
          </View>
        </View>

        {/* Usage Details */}
        <View style={styles.usageDetails}>
          {/* Promo Code Used */}
          <View style={styles.detailRow}>
            <Ionicons name="pricetag" size={16} color={Colors.primary} />
            <Text style={styles.detailLabel}>{t('promoCode.promoCodeUsed')}:</Text>
            <Text style={styles.detailValue}>
              {item.promoCodeDetails?.code || item.promoCode}
            </Text>
          </View>

          {/* Discount Applied */}
          <View style={styles.detailRow}>
            <Ionicons name="trending-down" size={16} color="#4CAF50" />
            <Text style={styles.detailLabel}>{t('promoCode.discountApplied')}:</Text>
            <Text style={[styles.detailValue, styles.discountValue]}>
              -{formatCurrency(item.discountAmount)}
            </Text>
          </View>

          {/* Order Amount */}
          <View style={styles.detailRow}>
            <Ionicons name="cart" size={16} color={Colors.primary} />
            <Text style={styles.detailLabel}>{t('promoCode.orderAmount')}:</Text>
            <Text style={styles.detailValue}>
              {formatCurrency(item.orderDetails?.amount)}
            </Text>
          </View>

          {/* Final Amount */}
          <View style={styles.detailRow}>
            <Ionicons name="card" size={16} color={Colors.primary} />
            <Text style={styles.detailLabel}>{t('promoCode.finalAmount')}:</Text>
            <Text style={[styles.detailValue, styles.finalAmount]}>
              {formatCurrency(
                (item.orderDetails?.amount || 0) - (item.discountAmount || 0)
              )}
            </Text>
          </View>

          {/* Discount Type */}
          {item.promoCodeDetails && (
            <View style={styles.detailRow}>
              <Ionicons name="information-circle" size={16} color={Colors.primary} />
              <Text style={styles.detailLabel}>{t('promoCode.discountType')}:</Text>
              <Text style={styles.detailValue}>
                {item.promoCodeDetails.discount_type === 'percentage' 
                  ? `${item.promoCodeDetails.discount_value}%`
                  : `${formatCurrency(item.promoCodeDetails.discount_value)}`
                }
              </Text>
            </View>
          )}
        </View>

        {/* Footer with additional info */}
        <View style={styles.usageFooter}>
          <Text style={styles.footerText}>
            {t('promoCode.savings')}: {formatCurrency(item.discountAmount)}
          </Text>
        </View>
      </View>
    );
  };

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
          tintColor={Colors.primary}
        />
      }
      ListEmptyComponent={EmptyState}
      showsVerticalScrollIndicator={false}
      initialNumToRender={10}
      maxToRenderPerBatch={10}
      windowSize={5}
    />
  );
};

const styles = StyleSheet.create({
  listContainer: {
    padding: 16,
    paddingTop: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
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
    borderLeftWidth: 4,
    borderLeftColor: Colors.primary,
  },
  firstCard: {
    marginTop: 8,
  },
  lastCard: {
    marginBottom: 20,
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
  },
  statusText: {
    fontSize: 10,
    fontWeight: "600",
    textTransform: "uppercase",
  },
  usageDetails: {
    borderTopWidth: 1,
    borderTopColor: "#F5F5F5",
    paddingTop: 12,
    gap: 8,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  detailLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginLeft: 8,
    marginRight: 4,
    flex: 1,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: "500",
    color: Colors.textPrimary,
  },
  discountValue: {
    color: "#4CAF50",
    fontWeight: "600",
  },
  finalAmount: {
    color: Colors.primary,
    fontWeight: "600",
    fontSize: 15,
  },
  usageFooter: {
    borderTopWidth: 1,
    borderTopColor: "#F5F5F5",
    paddingTop: 8,
    marginTop: 8,
  },
  footerText: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontStyle: "italic",
    textAlign: "center",
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
    textAlign: "center",
  },
  emptyStateText: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: "center",
    lineHeight: 20,
  },
});

export default PromoCodeUsage;