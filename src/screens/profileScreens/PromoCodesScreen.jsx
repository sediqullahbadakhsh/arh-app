import React, { useState, useEffect } from "react";
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  FlatList,
  RefreshControl,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "../../theme/colors";
import { useAuth } from "../../auth/AuthProvider";
import { useTranslation } from "react-i18next";
import ValidationModal from "../../components/ValidationModal";
import { useModal } from "../../hooks/useModal";
import PromoCodeForm from "../../components/PromoCodeForm";
import PromoCodeUsage from "../../components/PromoCodeUsage";

import { 
  getCustomerPromoCodeStatus, 
  getCustomerPromoCodeUsage,
  applyForPromoCode,
  updatePromoCodeRequest,
  createCashbackRequest,
  getCustomerCashbackRequests,
} from "../../services/promoCodeApi";
import ServiceHeader from "../../components/ServiceHeader";
import { scale } from "../../utils/normalizeSize";
import CashbackRequests from "../../components/CashbackRequests";

export default function PromoCodesScreen({ navigation }) {
  const { user } = useAuth();
  const { t } = useTranslation();
  const { showModal, modal, hideModal } = useModal();
  
  const [activeTab, setActiveTab] = useState("apply"); 
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [statusData, setStatusData] = useState(null);
  const [usageData, setUsageData] = useState([]);
  const [cashbackData, setCashbackData] = useState([]);
  const [error, setError] = useState(null);

  const fetchPromoCodeData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [statusResponse, usageResponse] = await Promise.all([
        getCustomerPromoCodeStatus(),
        getCustomerPromoCodeUsage(),
      ]);

      if (statusResponse.status) {
        setStatusData(statusResponse.data);
      } else {
        setStatusData(null);
      }

      if (usageResponse.status) {
        setUsageData(usageResponse.data || []);
      } else {
        setUsageData([]);
      }

      if (statusResponse.data?.status === 'accepted' && statusResponse.data?.promoCode) {
        try {
          const cashbackResponse = await getCustomerCashbackRequests();
          if (cashbackResponse.status) {
            setCashbackData(cashbackResponse.data || []);
          }
        } catch (cashbackError) {
          console.error("Error fetching cashback data:", cashbackError);
        }
      } else {
        setCashbackData([]);
      }

    } catch (error) {
      console.error("Error fetching promo code data:", error);
      setError(t('errors.loadData'));
      showModal(t('error'), t('errors.loadData'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    setError(null);
    fetchPromoCodeData();
  };

  useEffect(() => {
    fetchPromoCodeData();
  }, []);

  const handleApplySubmit = async (formData) => {
    try {
      setLoading(true);
      setError(null);
      
      let response;
      let successMessage;
      
      if (statusData && statusData.status === 'pending') {
        response = await updatePromoCodeRequest(statusData.id, formData);
        successMessage = t('promoCode.requestUpdated');
      } else {
        response = await applyForPromoCode(formData);
        successMessage = t('promoCode.applicationSubmitted');
      }
      
      if (response.status) {
        showModal(t('success'), successMessage);
        fetchPromoCodeData();
        setActiveTab("usage");
      } else {
        const errorMessage = response.error || t('errors.somethingWentWrong');
        setError(errorMessage);
        showModal(t('error'), errorMessage);
      }
    } catch (error) {
      console.error("Error applying for promo code:", error);
      const errorMessage = t('errors.somethingWentWrong');
      setError(errorMessage);
      showModal(t('error'), errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleCashbackRequest = async (cashbackData) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await createCashbackRequest(cashbackData);
      
      if (response.status) {
        showModal(t('success'), t('promoCode.cashbackRequestSubmitted'));
        fetchPromoCodeData();
      } else {
        const errorMessage = response.error || t('errors.somethingWentWrong');
        setError(errorMessage);
        showModal(t('error'), errorMessage);
      }
    } catch (error) {
      console.error("Error creating cashback request:", error);
      const errorMessage = t('errors.somethingWentWrong');
      setError(errorMessage);
      showModal(t('error'), errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'accepted': return '#4CAF50';
      case 'rejected': return '#F44336';
      case 'pending': return '#FF9800';
      default: return '#9E9E9E';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'accepted': return t('promoCode.approved');
      case 'rejected': return t('promoCode.rejected');
      case 'pending': return t('promoCode.pending');
      default: return t('promoCode.unknown');
    }
  };

  const canEditRequest = statusData && statusData.status === 'pending';
  const hasApprovedPromoCode = statusData && statusData.status === 'accepted' && statusData.promoCode;

  return (
    <SafeAreaView style={styles.safeArea}>
      <ServiceHeader 
        title={t('promoCodes')}
        onBack={() => navigation.goBack()} 
      />
      
      <ValidationModal
        visible={modal.visible}
        title={modal.title}
        message={modal.message}
        onClose={hideModal}
      />

      {statusData && (
        <View style={styles.statusCard}>
          <View style={styles.statusHeader}>
            <Text style={styles.statusTitle}>{t('promoCode.currentStatus')}</Text>
            {canEditRequest && (
              <View style={styles.editBadge}>
                <Ionicons name="create-outline" size={scale.hp(1.7)} color={Colors.primary} />
                <Text style={styles.editBadgeText}>{t('common.editable')}</Text>
              </View>
            )}
          </View>
          
          <View style={styles.statusRow}>
            <View style={[styles.statusIndicator, { backgroundColor: getStatusColor(statusData.status) }]} />
            <Text style={styles.statusText}>
              {getStatusText(statusData.status)}
            </Text>
          </View>
          
          {statusData.admin_notes && (
            <View style={styles.adminNotesContainer}>
              <Text style={styles.adminNotesLabel}>{t('promoCode.adminNotes')}:</Text>
              <Text style={styles.adminNotes}>{statusData.admin_notes}</Text>
            </View>
          )}
          
          {statusData.promoCode && (
            <View style={styles.promoCodeDisplay}>
              <Text style={styles.promoCodeLabel}>{t('promoCode.yourPromoCode')}:</Text>
              <Text style={styles.promoCodeValue}>{statusData.promoCode.code}</Text>
              <View style={styles.promoCodeDetails}>
                <Text style={styles.promoCodeDetail}>
                  {t('promoCode.discount')}: {statusData.promoCode.discount_value}
                  {statusData.promoCode.discount_type === 'percentage' ? '%' : '$'}
                </Text>
                {statusData.promoCode.max_discount && (
                  <Text style={styles.promoCodeDetail}>
                    {t('promoCode.maxDiscount')}: ${statusData.promoCode.max_discount}
                  </Text>
                )}
                {statusData.promoCode.min_order_amount && (
                  <Text style={styles.promoCodeDetail}>
                    {t('promoCode.minOrder')}: ${statusData.promoCode.min_order_amount}
                  </Text>
                )}
              </View>
            </View>
          )}
        </View>
      )}

      {error && (
        <View style={styles.errorContainer}>
          <Ionicons name="warning-outline" size={scale.hp(2.4)} color="#F44336" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={() => setError(null)}>
            <Ionicons name="close" size={scale.hp(2.4)} color="#F44336" />
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === "apply" && styles.activeTab]}
          onPress={() => setActiveTab("apply")}
        >
          <Text style={[styles.tabText, activeTab === "apply" && styles.activeTabText]}>
            {t('promoCode.applyForPromo')}
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.tab, activeTab === "usage" && styles.activeTab]}
          onPress={() => setActiveTab("usage")}
        >
          <Text style={[styles.tabText, activeTab === "usage" && styles.activeTabText]}>
            {t('promoCode.usage')} ({usageData.length})
          </Text>
        </TouchableOpacity>
        
        {hasApprovedPromoCode && (
          <TouchableOpacity
            style={[styles.tab, activeTab === "cashback" && styles.activeTab]}
            onPress={() => setActiveTab("cashback")}
          >
            <Text style={[styles.tabText, activeTab === "cashback" && styles.activeTabText]}>
              {t('promoCode.cashback')} ({cashbackData.length})
            </Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.content}>
        {loading && !refreshing ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={styles.loadingText}>{t('loading')}</Text>
          </View>
        ) : activeTab === "apply" ? (
          <PromoCodeForm 
            onSubmit={handleApplySubmit}
            loading={loading}
            existingData={statusData}
          />
        ) : activeTab === "usage" ? (
          <PromoCodeUsage 
            data={usageData}
            refreshing={refreshing}
            onRefresh={onRefresh}
          />
        ) : (
          <CashbackRequests
            data={cashbackData}
            onSubmit={handleCashbackRequest}
            loading={loading}
            refreshing={refreshing}
            onRefresh={onRefresh}
            promoCode={statusData?.promoCode}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  statusCard: {
    backgroundColor: Colors.white,
    margin: scale.hp(2),
    marginBottom: scale.hp(1),
    padding: scale.hp(2),
    borderRadius: scale.wp(2.5),
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: scale.hp(0.25),
    },
    shadowOpacity: 0.1,
    shadowRadius: scale.wp(1),
    elevation: 5,
    borderLeftWidth: scale.wp(1),
    borderLeftColor: Colors.primary,
  },
  statusHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: scale.hp(1),
  },
  statusTitle: {
    fontSize: scale.hp(2.2),
    fontWeight: "600",
    color: Colors.textPrimary,
  },
  editBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#E3F2FD",
    paddingHorizontal: scale.wp(2),
    paddingVertical: scale.hp(0.5),
    borderRadius: scale.wp(3),
  },
  editBadgeText: {
    fontSize: scale.hp(1.4),
    color: Colors.primary,
    fontWeight: "500",
    marginLeft: scale.wp(1),
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: scale.hp(1),
  },
  statusIndicator: {
    width: scale.wp(3),
    height: scale.wp(3),
    borderRadius: scale.wp(1.5),
    marginRight: scale.wp(2),
  },
  statusText: {
    fontSize: scale.hp(1.9),
    fontWeight: "500",
    color: Colors.textPrimary,
  },
  adminNotesContainer: {
    marginTop: scale.hp(1),
    padding: scale.hp(1),
    backgroundColor: "#FFF3E0",
    borderRadius: scale.wp(1.5),
  },
  adminNotesLabel: {
    fontSize: scale.hp(1.4),
    fontWeight: "500",
    color: Colors.textPrimary,
    marginBottom: scale.hp(0.25),
  },
  adminNotes: {
    fontSize: scale.hp(1.4),
    color: Colors.textSecondary,
    fontStyle: "italic",
  },
  promoCodeDisplay: {
    marginTop: scale.hp(1.5),
    paddingTop: scale.hp(1.5),
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
  },
  promoCodeLabel: {
    fontSize: scale.hp(1.7),
    fontWeight: "500",
    color: Colors.textPrimary,
    marginBottom: scale.hp(0.5),
  },
  promoCodeValue: {
    fontSize: scale.hp(2.4),
    fontWeight: "bold",
    color: Colors.primary,
    marginBottom: scale.hp(1),
  },
  promoCodeDetails: {
    gap: scale.hp(0.5),
  },
  promoCodeDetail: {
    fontSize: scale.hp(1.4),
    color: Colors.textSecondary,
  },
  errorContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFEBEE",
    padding: scale.hp(1.5),
    margin: scale.hp(2),
    marginTop: 0,
    borderRadius: scale.wp(2),
    borderLeftWidth: scale.wp(1),
    borderLeftColor: "#F44336",
  },
  errorText: {
    fontSize: scale.hp(1.7),
    color: "#D32F2F",
    marginLeft: scale.wp(2),
    flex: 1,
  },
  tabContainer: {
    flexDirection: "row",
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  tab: {
    flex: 1,
    paddingVertical: scale.hp(2),
    alignItems: "center",
  },
  activeTab: {
    borderBottomWidth: scale.hp(0.25),
    borderBottomColor: Colors.primary,
  },
  tabText: {
    fontSize: scale.hp(1.7),
    fontWeight: "500",
    color: "#666",
    textAlign: "center",
  },
  activeTabText: {
    color: Colors.primary,
    fontWeight: "600",
  },
  content: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: scale.hp(1.5),
    color: Colors.textSecondary,
    fontSize: scale.hp(1.7),
  },
});