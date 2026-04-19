import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Alert,
  ScrollView,
  SafeAreaView,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Colors } from "../../theme/colors";
import ServiceHeader from "../../components/ServiceHeader";
import { getAllSlabsForMerchant, setComission } from "../../services/merchantApi";
import CreateSlabModal from "../../components/modals/CreateSlabModal";
import SlabListModal from "../../components/modals/SlabListModal";
import { scale } from "../../utils/normalizeSize";
import { useTranslation } from "react-i18next";
import { useFocusEffect } from "@react-navigation/native";

export default function AssignCommissionSlabScreen({ navigation, route }) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { agent } = route.params || {};
  const [selectedSlab, setSelectedSlab] = useState(null);
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [listModalVisible, setListModalVisible] = useState(false);

  const {
    data: slabs = [],
    isLoading: loadingSlabs,
    isError: slabsError,
    refetch: refetchSlabs,
    isRefetching: isRefetchingSlabs,
  } = useQuery({
    queryKey: ['slabs', 'agent'],
    queryFn: async () => {
      const res = await getAllSlabsForMerchant({ 
        slabFor: "agent",
        limit: 100 
      });
      return res?.data || [];
    },
    staleTime: 5 * 60 * 1000,
    cacheTime: 10 * 60 * 1000,
  });

  const assignSlabMutation = useMutation({
    mutationFn: async (slabId) => {
      return await setComission(agent.user.uid, { slabId });
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries(['agents']);
      queryClient.invalidateQueries(['agent', agent?.user?.uid]);
      
      Alert.alert(
        t('success'), 
        t('slabAssignedSuccessfully'),
        [
          {
            text: t('ok'),
            onPress: () => navigation.goBack()
          }
        ]
      );
    },
    onError: (error) => {
      console.error("Assign slab error:", error);
      Alert.alert(
        t('error'), 
        error.response?.data?.error || t('failedToAssignSlab')
      );
    },
  });

  useFocusEffect(
    React.useCallback(() => {
      console.log("AssignCommissionSlabScreen focused, refetching slabs...");
      refetchSlabs();
    }, [refetchSlabs])
  );

  useEffect(() => {
    if (agent?.commissionRateDetails) {
      setSelectedSlab(agent.commissionRateDetails);
    }
  }, [agent]);

  const handleRefresh = () => {
    refetchSlabs();
  };

  const handleAssignSlab = async () => {
    if (!selectedSlab) {
      Alert.alert(t('error'), t('selectCommissionSlab'));
      return;
    }

    assignSlabMutation.mutate(selectedSlab.id);
  };

  const handleSlabCreated = () => {
    setCreateModalVisible(false);
    refetchSlabs();
  };

  const handleSlabUpdated = () => {
    refetchSlabs();
  };

  const isCurrentlyAssignedSlab = (slab) => {
    return agent?.commissionRateDetails?.id === slab.id;
  };

  const renderSlabItem = ({ item }) => {
    const isSelected = selectedSlab?.id === item.id;
    const isCurrent = isCurrentlyAssignedSlab(item);

    return (
      <TouchableOpacity
        style={[
          styles.slabItem,
          isSelected && styles.slabItemSelected,
          isCurrent && styles.slabItemCurrent,
        ]}
        onPress={() => setSelectedSlab(item)}
        disabled={isCurrent}
      >
        <View style={styles.slabContent}>
          <View style={styles.slabHeader}>
            <Text style={styles.slabTitle}>{item.slabTypeDetails?.title}</Text>
            <View style={styles.slabPercentage}>
              <Text style={styles.percentageText}>{item.percentage}%</Text>
            </View>
          </View>
          
          {isCurrent && (
            <View style={styles.currentBadge}>
              <Ionicons name="checkmark-circle" size={14} color="#16A34A" />
              <Text style={styles.currentText}>{t('currentlyAssigned')}</Text>
            </View>
          )}
        </View>

        <View style={styles.selector}>
          <View
            style={[
              styles.radio,
              isSelected && styles.radioSelected,
              isCurrent && styles.radioCurrent,
            ]}
          >
            {isSelected && <View style={styles.radioInner} />}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (!agent) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: Colors.white }}>
        <ServiceHeader title={t('assignSlab')} onBack={() => navigation.goBack()} />
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={48} color="#DC2626" />
          <Text style={styles.errorText}>{t('agentInfoNotAvailable')}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.retryButtonText}>{t('goBack')}</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.white }}>
      <ServiceHeader title={t('assignCommissionSlab')} onBack={() => navigation.goBack()} />
      
      <ScrollView 
        style={styles.container}
        refreshControl={
          <RefreshControl
            refreshing={isRefetchingSlabs}
            onRefresh={handleRefresh}
            colors={[Colors.primary]}
          />
        }
      >
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[styles.actionButton, styles.createButton]}
            onPress={() => setCreateModalVisible(true)}
            disabled={assignSlabMutation.isLoading}
          >
            <Ionicons name="add-circle-outline" size={20} color="#fff" />
            <Text style={styles.actionButtonText}>{t('createSlab')}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.listButton]}
            onPress={() => setListModalVisible(true)}
            disabled={assignSlabMutation.isLoading}
          >
            <Ionicons name="list-outline" size={20} color="#fff" />
            <Text style={styles.actionButtonText}>{t('slabList')}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.agentInfo}>
          <Text style={styles.agentName}>{agent.user?.username}</Text>
          <Text style={styles.agentEmail}>{agent.user?.email}</Text>
          <Text style={styles.agentPhone}>{agent.user?.mobileNumber}</Text>
          
          {agent.commissionRateDetails && (
            <View style={styles.currentCommission}>
              <Text style={styles.currentCommissionText}>
                {t('currentCommission')}: {agent.commissionRateDetails.percentage}%
              </Text>
              <Text style={styles.currentSlabText}>
                {t('currentSlab')}: {agent.commissionRateDetails.slabTypeDetails?.title}
              </Text>
              <Text style={styles.assignedText}>
                ({t('slabAssigned')})
              </Text>
            </View>
          )}
        </View>

        {selectedSlab && (
          <View style={styles.selectedSlabInfo}>
            <Text style={styles.selectedTitle}>{t('selectedSlab')}</Text>
            <Text style={styles.selectedSlabName}>{selectedSlab.slabTypeDetails?.title}</Text>
            <Text style={styles.selectedSlabPercentage}>{selectedSlab.percentage}% {t('commission')}</Text>
            <Text style={styles.selectedSlabNote}>
              {t('slabAutoApplied')}
            </Text>
            {selectedSlab.countryDetails && (
              <Text style={styles.selectedSlabDetail}>
                {t('country')}: {selectedSlab.countryDetails.countryName}
              </Text>
            )}
            {selectedSlab.providerDetails && (
              <Text style={styles.selectedSlabDetail}>
                {t('provider')}: {selectedSlab.providerDetails.companyName}
              </Text>
            )}
          </View>
        )}

        <View style={styles.slabsSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{t('availableCommissionSlabs')}</Text>
            <Text style={styles.slabCount}>
              {slabs.length} {t('slabAvailable', { count: slabs.length })}
            </Text>
          </View>
          
          {slabsError ? (
            <View style={styles.errorState}>
              <Ionicons name="alert-circle-outline" size={48} color="#DC2626" />
              <Text style={styles.errorText}>{t('failedToLoadSlabs')}</Text>
              <TouchableOpacity
                style={styles.retryButton}
                onPress={() => refetchSlabs()}
              >
                <Text style={styles.retryButtonText}>{t('retry')}</Text>
              </TouchableOpacity>
            </View>
          ) : loadingSlabs ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={Colors.primary} />
              <Text style={styles.loadingText}>{t('loadingCommissionSlabs')}</Text>
            </View>
          ) : (
            <FlatList
              data={slabs}
              keyExtractor={(item) => item.id}
              renderItem={renderSlabItem}
              ItemSeparatorComponent={() => <View style={styles.separator} />}
              scrollEnabled={false}
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <Ionicons name="document-outline" size={48} color="#9E9E9E" />
                  <Text style={styles.emptyText}>{t('noCommissionSlabs')}</Text>
                  <Text style={styles.emptySubtext}>
                    {t('createFirstSlab')}
                  </Text>
                  <TouchableOpacity
                    style={styles.createFirstButton}
                    onPress={() => setCreateModalVisible(true)}
                  >
                    <Text style={styles.createFirstButtonText}>{t('createSlab')}</Text>
                  </TouchableOpacity>
                </View>
              }
            />
          )}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[
            styles.assignButton,
            (!selectedSlab || assignSlabMutation.isLoading) && styles.assignButtonDisabled,
          ]}
          onPress={handleAssignSlab}
          disabled={!selectedSlab || assignSlabMutation.isLoading}
        >
          {assignSlabMutation.isLoading ? (
            <View style={styles.loadingButton}>
              <ActivityIndicator size="small" color="#fff" />
              <Text style={styles.assignButtonText}>{t('assigning')}</Text>
            </View>
          ) : (
            <>
              <Ionicons name="checkmark-circle-outline" size={20} color="#fff" />
              <Text style={styles.assignButtonText}>{t('assignSlab')}</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      <CreateSlabModal
        visible={createModalVisible}
        onClose={() => setCreateModalVisible(false)}
        onSuccess={handleSlabCreated}
      />

      <SlabListModal
        visible={listModalVisible}
        onClose={() => setListModalVisible(false)}
        onUpdate={handleSlabUpdated}
        slabs={slabs}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: scale.wp(3.9),
    paddingTop: scale.hp(1.55),
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: scale.hp(5.2),
  },
  errorState: {
    alignItems: "center",
    padding: scale.hp(5.2),
  },
  errorText: {
    fontSize: scale.hp(1.8),
    color: Colors.textSecondary,
    marginTop: scale.hp(1.55),
    textAlign: "center",
  },
  retryButton: {
    marginTop: scale.hp(2.1),
    backgroundColor: Colors.primary,
    paddingHorizontal: scale.wp(4.9),
    paddingVertical: scale.hp(1.3),
    borderRadius: scale.hp(1.05),
  },
  retryButtonText: {
    color: "#fff",
    fontSize: scale.hp(1.8),
    fontWeight: "600",
  },
  actionButtons: {
    flexDirection: "row",
    gap: scale.wp(2.9),
    marginBottom: scale.hp(2.1),
  },
  actionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: scale.wp(1.95),
    paddingVertical: scale.hp(1.55),
    borderRadius: scale.hp(1.3),
  },
  createButton: {
    backgroundColor: Colors.primary,
  },
  listButton: {
    backgroundColor: "#8B5CF6",
  },
  actionButtonText: {
    color: "#fff",
    fontSize: scale.hp(1.8),
    fontWeight: "600",
  },
  agentInfo: {
    backgroundColor: "#f8f9fa",
    borderRadius: scale.hp(1.3),
    padding: scale.hp(2.1),
    marginBottom: scale.hp(2.1),
  },
  agentName: {
    fontSize: scale.hp(2.35),
    fontWeight: "600",
    color: Colors.textPrimary,
    marginBottom: scale.hp(0.5),
  },
  agentEmail: {
    fontSize: scale.hp(1.8),
    color: Colors.textSecondary,
    marginBottom: scale.hp(0.25),
  },
  agentPhone: {
    fontSize: scale.hp(1.8),
    color: Colors.textSecondary,
    marginBottom: scale.hp(1.05),
  },
  currentCommission: {
    marginTop: scale.hp(1.05),
    paddingTop: scale.hp(1.05),
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
  },
  currentCommissionText: {
    fontSize: scale.hp(1.8),
    color: Colors.textPrimary,
    fontWeight: "500",
  },
  currentSlabText: {
    fontSize: scale.hp(1.55),
    color: Colors.textSecondary,
    marginTop: scale.hp(0.25),
  },
  assignedText: {
    fontSize: scale.hp(1.4),
    color: "#3B82F6",
    fontStyle: "italic",
    marginTop: scale.hp(0.25),
  },
  selectedSlabInfo: {
    backgroundColor: "#dbeafe",
    borderRadius: scale.hp(1.3),
    padding: scale.hp(2.1),
    marginBottom: scale.hp(2.1),
    borderLeftWidth: 4,
    borderLeftColor: Colors.primary,
  },
  selectedTitle: {
    fontSize: scale.hp(1.55),
    color: Colors.primary,
    fontWeight: "600",
    marginBottom: scale.hp(0.5),
  },
  selectedSlabName: {
    fontSize: scale.hp(2.1),
    color: Colors.textPrimary,
    fontWeight: "600",
    marginBottom: scale.hp(0.25),
  },
  selectedSlabPercentage: {
    fontSize: scale.hp(1.8),
    color: Colors.textSecondary,
    marginBottom: scale.hp(0.5),
  },
  selectedSlabNote: {
    fontSize: scale.hp(1.55),
    color: Colors.textSecondary,
    fontStyle: "italic",
    marginBottom: scale.hp(0.5),
  },
  selectedSlabDetail: {
    fontSize: scale.hp(1.55),
    color: Colors.textSecondary,
  },
  slabsSection: {
    marginBottom: scale.hp(25.8),
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: scale.hp(1.55),
  },
  sectionTitle: {
    fontSize: scale.hp(2.1),
    fontWeight: "600",
    color: Colors.textPrimary,
  },
  slabCount: {
    fontSize: scale.hp(1.55),
    color: Colors.textSecondary,
  },
  slabItem: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: scale.hp(1.3),
    padding: scale.hp(2.1),
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  slabItemSelected: {
    borderColor: Colors.primary,
    backgroundColor: "#fef2f2",
  },
  slabItemCurrent: {
    borderColor: "#16A34A",
    backgroundColor: "#f0fff4",
  },
  slabContent: {
    flex: 1,
  },
  slabHeader: {
    flexDirection: "row",
    gap: scale.wp(2.4),
    alignItems: "flex-start",
    marginBottom: scale.hp(1.05),
  },
  slabTitle: {
    fontSize: scale.hp(2.1),
    fontWeight: "600",
    color: Colors.textPrimary,
  },
  slabPercentage: {
    backgroundColor: Colors.primary,
    paddingHorizontal: scale.wp(1.95),
    paddingVertical: scale.hp(0.5),
    borderRadius: scale.hp(0.8),
    marginLeft: scale.wp(1.95),
  },
  percentageText: {
    color: "#fff",
    fontSize: scale.hp(1.55),
    fontWeight: "600",
  },
  currentBadge: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: scale.hp(1.05),
    gap: scale.wp(1),
  },
  currentText: {
    fontSize: scale.hp(1.4),
    color: "#16A34A",
    fontWeight: "500",
  },
  selector: {
    justifyContent: "center",
    alignItems: "center",
    marginLeft: scale.wp(2.9),
  },
  radio: {
    width: scale.wp(4.9),
    height: scale.wp(4.9),
    borderRadius: scale.wp(2.4),
    borderWidth: 2,
    borderColor: "#d1d5db",
    alignItems: "center",
    justifyContent: "center",
  },
  radioSelected: {
    borderColor: Colors.primary,
  },
  radioCurrent: {
    borderColor: "#16A34A",
  },
  radioInner: {
    width: scale.wp(2.4),
    height: scale.wp(2.4),
    borderRadius: scale.wp(1.2),
    backgroundColor: Colors.primary,
  },
  separator: {
    height: scale.hp(1.05),
  },
  loadingContainer: {
    alignItems: "center",
    padding: scale.hp(5.2),
  },
  loadingText: {
    marginTop: scale.hp(1.55),
    color: Colors.textSecondary,
  },
  emptyContainer: {
    alignItems: "center",
    padding: scale.hp(5.2),
  },
  emptyText: {
    fontSize: scale.hp(2.1),
    color: Colors.textSecondary,
    marginTop: scale.hp(1.55),
    textAlign: "center",
  },
  emptySubtext: {
    fontSize: scale.hp(1.55),
    color: Colors.textSecondary,
    marginTop: scale.hp(0.5),
    textAlign: "center",
  },
  createFirstButton: {
    marginTop: scale.hp(2.1),
    backgroundColor: Colors.primary,
    paddingHorizontal: scale.wp(4.9),
    paddingVertical: scale.hp(1.3),
    borderRadius: scale.hp(1.05),
  },
  createFirstButtonText: {
    color: "#fff",
    fontSize: scale.hp(1.8),
    fontWeight: "600",
  },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#fff",
    padding: scale.hp(2.1),
    marginBottom: scale.hp(12.9),
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
  },
  assignButton: {
    backgroundColor: Colors.primary,
    borderRadius: scale.hp(1.3),
    padding: scale.hp(2.1),
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: scale.wp(1.95),
  },
  assignButtonDisabled: {
    backgroundColor: "#9ca3af",
  },
  loadingButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale.wp(1.95),
  },
  assignButtonText: {
    color: "#fff",
    fontSize: scale.hp(2.1),
    fontWeight: "600",
  },
});