import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Alert,
  ActivityIndicator,
  RefreshControl,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "../theme/colors";
import { useTranslation } from "react-i18next";

const CashbackRequests = ({ data, onSubmit, loading, refreshing, onRefresh, promoCode }) => {
  const { t } = useTranslation();
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    promoCode: promoCode?.code || "",
    cashBackMethod: "Bank",
    cashBackAmountAfn: "",
    bankAccount: "",
  });

  const handleSubmit = () => {
    if (!formData.cashBackAmountAfn || !formData.cashBackMethod) {
      Alert.alert(t('error'), t('promoCode.cashback.fillAllFields'));
      return;
    }

    if (formData.cashBackMethod === "Bank" && !formData.bankAccount) {
      Alert.alert(t('error'), t('promoCode.cashback.bankAccountRequired'));
      return;
    }

    onSubmit(formData);
    setShowForm(false);
    setFormData({
      promoCode: promoCode?.code || "",
      cashBackMethod: "Bank",
      cashBackAmountAfn: "",
      bankAccount: "",
    });
  };

  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (error) {
      return 'Invalid Date';
    }
  };

  const formatCurrency = (amount) => {
    if (!amount) return '0 AFN';
    return `${parseFloat(amount).toFixed(2)} AFN`;
  };

  const getStatusConfig = (status) => {
    switch (status?.toLowerCase()) {
      case 'accepted':
        return {
          color: '#4CAF50',
          backgroundColor: '#E8F5E8',
          icon: 'checkmark-circle',
          text: t('common.approved')
        };
      case 'rejected':
        return {
          color: '#F44336',
          backgroundColor: '#FFEBEE',
          icon: 'close-circle',
          text: t('common.rejected')
        };
      case 'pending':
      default:
        return {
          color: '#FF9800',
          backgroundColor: '#FFF3E0',
          icon: 'time',
          text: t('common.pending')
        };
    }
  };

  const renderCashbackItem = ({ item, index }) => {
    const statusConfig = getStatusConfig(item.status);
    
    return (
      <View style={[
        styles.cashbackCard,
        index === 0 && styles.firstCard
      ]}>
        <View style={styles.cashbackHeader}>
          <View style={styles.cashbackInfo}>
            <Text style={styles.promoCode}>{item.promoCode}</Text>
            <Text style={styles.requestDate}>{formatDate(item.createdAt)}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: statusConfig.backgroundColor }]}>
            <Ionicons name={statusConfig.icon} size={14} color={statusConfig.color} />
            <Text style={[styles.statusText, { color: statusConfig.color }]}>
              {statusConfig.text}
            </Text>
          </View>
        </View>

        <View style={styles.cashbackDetails}>
          <View style={styles.detailRow}>
            <Ionicons name="cash" size={16} color={Colors.primary} />
            <Text style={styles.detailLabel}>{t('promoCode.cashback.amount')}:</Text>
            <Text style={styles.detailValue}>
              {formatCurrency(item.cashBackAmountAfn)}
            </Text>
          </View>

          <View style={styles.detailRow}>
            <Ionicons name="card" size={16} color={Colors.primary} />
            <Text style={styles.detailLabel}>{t('promoCode.cashback.method')}:</Text>
            <Text style={styles.detailValue}>{item.cashBackMethod}</Text>
          </View>

          {item.cashBackMethod === "Bank" && item.bankAccount && (
            <View style={styles.detailRow}>
              <Ionicons name="business" size={16} color={Colors.primary} />
              <Text style={styles.detailLabel}>{t('promoCode.cashback.bankAccount')}:</Text>
              <Text style={styles.detailValue}>{item.bankAccount}</Text>
            </View>
          )}

          {item.rejectingReason && (
            <View style={styles.rejectionReason}>
              <Ionicons name="warning" size={14} color="#F44336" />
              <Text style={styles.rejectionText}>{item.rejectingReason}</Text>
            </View>
          )}
        </View>
      </View>
    );
  };

  const EmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="cash-outline" size={64} color="#E0E0E0" />
      <Text style={styles.emptyStateTitle}>
        {t('promoCode.cashback.noRequests')}
      </Text>
      <Text style={styles.emptyStateText}>
        {t('promoCode.cashback.noRequestsDescription')}
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* New Request Button */}
      {!showForm && (
        <TouchableOpacity
          style={styles.newRequestButton}
          onPress={() => setShowForm(true)}
          disabled={loading}
        >
          <Ionicons name="add-circle" size={20} color={Colors.white} />
          <Text style={styles.newRequestButtonText}>
            {t('promoCode.cashback.newRequest')}
          </Text>
        </TouchableOpacity>
      )}

      {/* Cashback Request Form */}
      {showForm && (
        <ScrollView style={styles.formContainer}>
          <View style={styles.formHeader}>
            <Text style={styles.formTitle}>{t('promoCode.cashback.newRequest')}</Text>
            <TouchableOpacity onPress={() => setShowForm(false)}>
              <Ionicons name="close" size={24} color={Colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>{t('promoCode.cashback.promoCode')}</Text>
            <TextInput
              style={[styles.input, styles.disabledInput]}
              value={formData.promoCode}
              editable={false}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>{t('promoCode.cashback.amount')} *</Text>
            <TextInput
              style={styles.input}
              placeholder={t('promoCode.cashback.enterAmount')}
              value={formData.cashBackAmountAfn}
              onChangeText={(text) => setFormData(prev => ({ ...prev, cashBackAmountAfn: text }))}
              keyboardType="decimal-pad"
              placeholderTextColor="#999"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>{t('promoCode.cashback.method')} *</Text>
            <View style={styles.methodButtons}>
              {['Bank', 'EVC', 'Other'].map((method) => (
                <TouchableOpacity
                  key={method}
                  style={[
                    styles.methodButton,
                    formData.cashBackMethod === method && styles.methodButtonActive
                  ]}
                  onPress={() => setFormData(prev => ({ ...prev, cashBackMethod: method }))}
                >
                  <Text style={[
                    styles.methodButtonText,
                    formData.cashBackMethod === method && styles.methodButtonTextActive
                  ]}>
                    {method}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {formData.cashBackMethod === "Bank" && (
            <View style={styles.inputGroup}>
              <Text style={styles.label}>{t('promoCode.cashback.bankAccount')} *</Text>
              <TextInput
                style={styles.input}
                placeholder={t('promoCode.cashback.enterBankAccount')}
                value={formData.bankAccount}
                onChangeText={(text) => setFormData(prev => ({ ...prev, bankAccount: text }))}
                placeholderTextColor="#999"
              />
            </View>
          )}

          <View style={styles.formButtons}>
            <TouchableOpacity
              style={[styles.cancelButton, loading && styles.buttonDisabled]}
              onPress={() => setShowForm(false)}
              disabled={loading}
            >
              <Text style={styles.cancelButtonText}>{t('common.cancel')}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.submitButton, loading && styles.buttonDisabled]}
              onPress={handleSubmit}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.submitButtonText}>{t('common.submit')}</Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      )}

      {/* Cashback Requests List */}
      {!showForm && (
        <FlatList
          data={data}
          renderItem={renderCashbackItem}
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
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  newRequestButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.primary,
    padding: 16,
    margin: 16,
    borderRadius: 8,
  },
  newRequestButtonText: {
    color: Colors.white,
    fontWeight: "600",
    fontSize: 16,
    marginLeft: 8,
  },
  formContainer: {
    flex: 1,
    padding: 16,
  },
  formHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  formTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: Colors.textPrimary,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: "500",
    color: Colors.textPrimary,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: Colors.white,
  },
  disabledInput: {
    backgroundColor: "#F5F5F5",
    color: Colors.textSecondary,
  },
  methodButtons: {
    flexDirection: "row",
    gap: 8,
  },
  methodButton: {
    flex: 1,
    padding: 12,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 8,
    alignItems: "center",
    backgroundColor: Colors.white,
  },
  methodButtonActive: {
    borderColor: Colors.primary,
    backgroundColor: "#E3F2FD",
  },
  methodButtonText: {
    color: Colors.textPrimary,
    fontWeight: "500",
  },
  methodButtonTextActive: {
    color: Colors.primary,
  },
  formButtons: {
    flexDirection: "row",
    gap: 12,
    marginTop: 20,
  },
  cancelButton: {
    flex: 1,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.primary,
    borderRadius: 8,
    alignItems: "center",
    backgroundColor: Colors.white,
  },
  cancelButtonText: {
    color: Colors.primary,
    fontWeight: "600",
    fontSize: 16,
  },
  submitButton: {
    flex: 1,
    padding: 16,
    backgroundColor: Colors.primary,
    borderRadius: 8,
    alignItems: "center",
  },
  submitButtonText: {
    color: Colors.white,
    fontWeight: "600",
    fontSize: 16,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
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
  cashbackCard: {
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
  firstCard: {
    marginTop: 8,
  },
  cashbackHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  cashbackInfo: {
    flex: 1,
  },
  promoCode: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  requestDate: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  statusText: {
    fontSize: 10,
    fontWeight: "600",
    textTransform: "uppercase",
  },
  cashbackDetails: {
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
  rejectionReason: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "#FFEBEE",
    padding: 8,
    borderRadius: 6,
    marginTop: 8,
    gap: 4,
  },
  rejectionText: {
    fontSize: 12,
    color: "#D32F2F",
    flex: 1,
    fontStyle: "italic",
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

export default CashbackRequests;