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
  applyForPromoCode 
} from "../../services/promoCodeApi";
import ServiceHeader from "../../components/ServiceHeader";
import { scale } from "../../utils/normalizeSize";

export default function PromoCodesScreen({ navigation }) {
  const { user } = useAuth();
  const { t } = useTranslation();
  const { showModal, modal, hideModal } = useModal();
  
  const [activeTab, setActiveTab] = useState("apply"); 
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [statusData, setStatusData] = useState(null);
  const [usageData, setUsageData] = useState([]);

  const fetchPromoCodeData = async () => {
    try {
      setLoading(true);
      const [statusResponse, usageResponse] = await Promise.all([
        getCustomerPromoCodeStatus(),
        getCustomerPromoCodeUsage()
      ]);

      if (statusResponse.status) {
        setStatusData(statusResponse.data);
      }

      if (usageResponse.status) {
        setUsageData(usageResponse.data || []);
      }
    } catch (error) {
      console.error("Error fetching promo code data:", error);
      showModal(t('error'), t('errors.loadData'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchPromoCodeData();
  };

  useEffect(() => {
    fetchPromoCodeData();
  }, []);

  const handleApplySubmit = async (formData) => {
    try {
      setLoading(true);
      const response = await applyForPromoCode(formData);
      
      if (response.status) {
        showModal(t('success'), t('promoCode.applicationSubmitted'));
        fetchPromoCodeData();
        setActiveTab("usage");
      } else {
        showModal(t('error'), response.error || t('errors.somethingWentWrong'));
      }
    } catch (error) {
      console.error("Error applying for promo code:", error);
      showModal(t('error'), t('errors.somethingWentWrong'));
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
            <Text style={styles.statusTitle}>{t('promoCode.currentStatus')}</Text>
            <View style={styles.statusRow}>
              <View style={[styles.statusIndicator, { backgroundColor: getStatusColor(statusData.status) }]} />
              <Text style={styles.statusText}>
                {getStatusText(statusData.status)}
              </Text>
            </View>
            {statusData.admin_notes && (
              <Text style={styles.adminNotes}>
                {t('promoCode.adminNotes')}: {statusData.admin_notes}
              </Text>
            )}
            {statusData.promoCode && (
              <View style={styles.promoCodeDisplay}>
                <Text style={styles.promoCodeLabel}>{t('promoCode.yourPromoCode')}:</Text>
                <Text style={styles.promoCodeValue}>{statusData.promoCode.code}</Text>
                <Text style={styles.promoCodeDetails}>
                  {t('promoCode.discount')}: {statusData.promoCode.discount_value}
                  {statusData.promoCode.discount_type === 'percentage' ? '%' : '$'}
                </Text>
              </View>
            )}
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
        ) : (
          <PromoCodeUsage 
            data={usageData}
            refreshing={refreshing}
            onRefresh={onRefresh}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    paddingBottom: scale.hp(13),
    backgroundColor: Colors.white,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  backButton: {
    padding: scale.hp(0.65),
  },
  headerTitle: {
    color: Colors.white,
    fontSize: scale.hp(2.6),
    fontWeight: "600",
  },
  headerRight: {
    width: scale.wp(6.2),
  },
  statusCard: {
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    borderRadius: scale.hp(1.55),
    padding: scale.hp(2.1),
    marginTop: scale.hp(1.3),
  },
  statusTitle: {
    fontSize: scale.hp(2.1),
    fontWeight: "600",
    color: Colors.textPrimary,
    marginBottom: scale.hp(1.05),
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: scale.hp(1.05),
  },
  statusIndicator: {
    width: scale.wp(3.1),
    height: scale.wp(3.1),
    borderRadius: scale.wp(1.55),
    marginRight: scale.wp(2),
  },
  statusText: {
    fontSize: scale.hp(1.8),
    fontWeight: "500",
    color: Colors.textPrimary,
  },
  adminNotes: {
    fontSize: scale.hp(1.55),
    color: "#666",
    fontStyle: "italic",
    marginTop: scale.hp(0.5),
  },
  promoCodeDisplay: {
    marginTop: scale.hp(1.55),
    paddingTop: scale.hp(1.55),
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
  },
  promoCodeLabel: {
    fontSize: scale.hp(1.8),
    fontWeight: "500",
    color: Colors.textPrimary,
    marginBottom: scale.hp(0.5),
  },
  promoCodeValue: {
    fontSize: scale.hp(2.35),
    fontWeight: "bold",
    color: Colors.primary,
    marginBottom: scale.hp(0.5),
  },
  promoCodeDetails: {
    fontSize: scale.hp(1.55),
    color: "#666",
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
    borderBottomWidth: 2,
    borderBottomColor: Colors.primary,
  },
  tabText: {
    fontSize: scale.hp(1.8),
    fontWeight: "500",
    color: "#666",
  },
  activeTabText: {
    color: Colors.primary,
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
    marginTop: scale.hp(1.3),
    color: Colors.textSecondary,
  },
});