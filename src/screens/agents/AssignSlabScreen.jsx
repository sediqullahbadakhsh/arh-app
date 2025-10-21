import React, { useState, useEffect } from "react";
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Alert,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "../../theme/colors";
import ServiceHeader from "../../components/ServiceHeader";
import { getAllSlabsForMerchant, setComission } from "../../services/merchantApi";

export default function AssignSlabScreen({ navigation, route }) {
  const { agent, refreshAgentList } = route.params || {};
  const [slabs, setSlabs] = useState([]);
  const [selectedSlab, setSelectedSlab] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingSlabs, setLoadingSlabs] = useState(true);

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
      // Use the same API call structure as the web version
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
    }
  };

  const handleAssignSlab = async () => {
    if (!selectedSlab) {
      Alert.alert("Error", "Please select a commission slab");
      return;
    }

    try {
      setLoading(true);
      // Use the same mutation structure as web version - only send slabId
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
          
          <Text style={styles.slabDescription}>
            {item.slabTypeDetails?.description || "No description available"}
          </Text>

          <View style={styles.slabMeta}>
            {item.countryDetails && (
              <Text style={styles.metaText}>
                Country: {item.countryDetails.countryName}
              </Text>
            )}
            {item.providerDetails && (
              <Text style={styles.metaText}>
                Provider: {item.providerDetails.companyName}
              </Text>
            )}
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
      
      <ScrollView style={styles.container}>
        {/* Agent Info */}
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

        {/* Selected Slab Info */}
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

        {/* Available Slabs */}
        <View style={styles.slabsSection}>
          <Text style={styles.sectionTitle}>Available Commission Slabs</Text>
          
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
                    Contact administrator to create commission slabs
                  </Text>
                </View>
              }
            />
          )}
        </View>
      </ScrollView>

      {/* Action Button */}
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
    marginBottom: 100,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.textPrimary,
    marginBottom: 12,
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
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  slabTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.textPrimary,
    flex: 1,
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
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#fff",
    padding: 16,
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