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
import { Colors } from "../../theme/colors";
import ServiceHeader from "../../components/ServiceHeader";
import { getAllSlabsForMerchant, setComission } from "../../services/merchantApi";
import CreateSlabModal from "../../components/modals/CreateSlabModal";
import SlabListModal from "../../components/modals/SlabListModal";


export default function AssignCommissionSlabScreen({ navigation, route }) {
  const { agent, refreshAgentList } = route.params || {};
  const [slabs, setSlabs] = useState([]);
  const [selectedSlab, setSelectedSlab] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingSlabs, setLoadingSlabs] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [listModalVisible, setListModalVisible] = useState(false);

  useEffect(() => {
    fetchSlabs();
  }, []);

  useEffect(() => {
    if (agent?.commissionRateDetails) {
      setSelectedSlab(agent.commissionRateDetails);
    }
  }, [agent]);

  const fetchSlabs = async () => {
    try {
      setLoadingSlabs(true);
      const res = await getAllSlabsForMerchant({ 
        slabFor: "agent",
        limit: 100 
      });
      setSlabs(res?.data || []);
    } catch (error) {
      console.error("Fetch slabs error:", error);
      Alert.alert("Error", "Failed to load commission slabs");
    } finally {
      setLoadingSlabs(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchSlabs();
  };

  const handleAssignSlab = async () => {
    if (!selectedSlab) {
      Alert.alert("Error", "Please select a commission slab");
      return;
    }

    try {
      setLoading(true);
      await setComission(agent.user.id, { slabId: selectedSlab.id });
      
      Alert.alert(
        "Success", 
        "Commission slab assigned successfully!",
        [
          {
            text: "OK",
            onPress: () => {
              refreshAgentList?.();
              navigation.goBack();
            }
          }
        ]
      );
    } catch (error) {
      console.error("Assign slab error:", error);
      Alert.alert(
        "Error", 
        error.response?.data?.error || "Failed to assign commission slab"
      );
    } finally {
      setLoading(false);
    }
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
              <Text style={styles.currentText}>Currently Assigned</Text>
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

  const handleSlabCreated = () => {
    setCreateModalVisible(false);
    fetchSlabs();
  };

  const handleSlabUpdated = () => {
    fetchSlabs();
  };

  if (!agent) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: Colors.white }}>
        <ServiceHeader title="Assign Slab" onBack={() => navigation.goBack()} />
        <View style={styles.errorContainer}>
          <Text>Agent information not available</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.white }}>
      <ServiceHeader title="Assign Commission Slab" onBack={() => navigation.goBack()} />
      
      <ScrollView 
        style={styles.container}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[Colors.primary]}
          />
        }
      >
  
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[styles.actionButton, styles.createButton]}
            onPress={() => setCreateModalVisible(true)}
          >
            <Ionicons name="add-circle-outline" size={20} color="#fff" />
            <Text style={styles.actionButtonText}>Create Slab</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.listButton]}
            onPress={() => setListModalVisible(true)}
          >
            <Ionicons name="list-outline" size={20} color="#fff" />
            <Text style={styles.actionButtonText}>Slab List</Text>
          </TouchableOpacity>
        </View>

   
        <View style={styles.agentInfo}>
          <Text style={styles.agentName}>{agent.user?.username}</Text>
          <Text style={styles.agentEmail}>{agent.user?.email}</Text>
          <Text style={styles.agentPhone}>{agent.user?.mobileNumber}</Text>
          
          {agent.commissionRateDetails && (
            <View style={styles.currentCommission}>
              <Text style={styles.currentCommissionText}>
                Current Commission: {agent.commissionRateDetails.percentage}%
              </Text>
              <Text style={styles.currentSlabText}>
                Current Slab: {agent.commissionRateDetails.slabTypeDetails?.title}
              </Text>
              <Text style={styles.assignedText}>
                (Slab Assigned)
              </Text>
            </View>
          )}
        </View>

        {selectedSlab && (
          <View style={styles.selectedSlabInfo}>
            <Text style={styles.selectedTitle}>Selected Slab</Text>
            <Text style={styles.selectedSlabName}>{selectedSlab.slabTypeDetails?.title}</Text>
            <Text style={styles.selectedSlabPercentage}>{selectedSlab.percentage}% Commission</Text>
            <Text style={styles.selectedSlabNote}>
              This slab will be automatically applied to the agent's transactions
            </Text>
            {selectedSlab.countryDetails && (
              <Text style={styles.selectedSlabDetail}>
                Country: {selectedSlab.countryDetails.countryName}
              </Text>
            )}
            {selectedSlab.providerDetails && (
              <Text style={styles.selectedSlabDetail}>
                Provider: {selectedSlab.providerDetails.companyName}
              </Text>
            )}
          </View>
        )}

   
        <View style={styles.slabsSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Available Commission Slabs</Text>
            <Text style={styles.slabCount}>
              {slabs.length} slab{slabs.length !== 1 ? 's' : ''} available
            </Text>
          </View>
          
          {loadingSlabs ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={Colors.primary} />
              <Text style={styles.loadingText}>Loading commission slabs...</Text>
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
                  <Text style={styles.emptyText}>No commission slabs available</Text>
                  <Text style={styles.emptySubtext}>
                    Create your first slab to get started
                  </Text>
                  <TouchableOpacity
                    style={styles.createFirstButton}
                    onPress={() => setCreateModalVisible(true)}
                  >
                    <Text style={styles.createFirstButtonText}>Create Slab</Text>
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
            (!selectedSlab || loading) && styles.assignButtonDisabled,
          ]}
          onPress={handleAssignSlab}
          disabled={!selectedSlab || loading}
        >
          {loading ? (
            <View style={styles.loadingButton}>
              <ActivityIndicator size="small" color="#fff" />
              <Text style={styles.assignButtonText}>Assigning...</Text>
            </View>
          ) : (
            <>
              <Ionicons name="checkmark-circle-outline" size={20} color="#fff" />
              <Text style={styles.assignButtonText}>Assign Slab</Text>
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
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  marginBottom: 300,
  actionButtons: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 16,
  },
  actionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
    borderRadius: 10,
  },
  createButton: {
    backgroundColor: Colors.primary,
  },
  listButton: {
    backgroundColor: "#8B5CF6",
  },
  actionButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  agentInfo: {
    backgroundColor: "#f8f9fa",
    borderRadius: 10,
    padding: 16,
    marginBottom: 16,
  },
  agentName: {
    fontSize: 18,
    fontWeight: "600",
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  agentEmail: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  agentPhone: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 8,
  },
  currentCommission: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
  },
  currentCommissionText: {
    fontSize: 14,
    color: Colors.textPrimary,
    fontWeight: "500",
  },
  currentSlabText: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  assignedText: {
    fontSize: 11,
    color: "#3B82F6",
    fontStyle: "italic",
    marginTop: 2,
  },
  selectedSlabInfo: {
    backgroundColor: "#dbeafe",
    borderRadius: 10,
    padding: 16,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: Colors.primary,
  },
  selectedTitle: {
    fontSize: 12,
    color: Colors.primary,
    fontWeight: "600",
    marginBottom: 4,
  },
  selectedSlabName: {
    fontSize: 16,
    color: Colors.textPrimary,
    fontWeight: "600",
    marginBottom: 2,
  },
  selectedSlabPercentage: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  selectedSlabNote: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontStyle: "italic",
    marginBottom: 4,
  },
  selectedSlabDetail: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  slabsSection: {
    marginBottom: 200,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.textPrimary,
  },
  slabCount: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  slabItem: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 16,
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
    gap: 10,
    alignItems: "flex-start",
    marginBottom: 8,
  },
  slabTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.textPrimary,

  },
  slabPercentage: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginLeft: 8,
  },
  percentageText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
  slabDescription: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 8,
    lineHeight: 16,
  },
  slabMeta: {
    gap: 2,
  },
  metaText: {
    fontSize: 11,
    color: Colors.textSecondary,
  },
  currentBadge: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
    gap: 4,
  },
  currentText: {
    fontSize: 11,
    color: "#16A34A",
    fontWeight: "500",
  },
  selector: {
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 12,
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
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
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.primary,
  },
  separator: {
    height: 8,
  },
  loadingContainer: {
    alignItems: "center",
    padding: 40,
  },
  loadingText: {
    marginTop: 12,
    color: Colors.textSecondary,
  },
  emptyContainer: {
    alignItems: "center",
    padding: 40,
  },
  emptyText: {
    fontSize: 16,
    color: Colors.textSecondary,
    marginTop: 12,
    textAlign: "center",
  },
  emptySubtext: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 4,
    textAlign: "center",
  },
  createFirstButton: {
    marginTop: 16,
    backgroundColor: Colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  createFirstButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#fff",
    padding: 16,
    marginBottom: 100,
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
  },
  assignButton: {
    backgroundColor: Colors.primary,
    borderRadius: 10,
    padding: 16,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },
  assignButtonDisabled: {
    backgroundColor: "#9ca3af",
  },
  loadingButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  assignButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});