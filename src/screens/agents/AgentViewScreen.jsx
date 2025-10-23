import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "../../theme/colors";
import ServiceHeader from "../../components/ServiceHeader";
import DeleteConfirmationModal from "../../components/modals/DeleteConfirmationModal";
import SuccessModal from "../../components/modals/SuccessModalShort";
import ErrorModal from "../../components/modals/ErrorModal";

const deleteDownlineAgent = async (agentId) => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      Math.random() > 0.1 ? resolve() : reject(new Error("Network error"));
    }, 1500);
  });
};

export default function AgentViewScreen({ navigation, route }) {
  const { agent, refreshAgentList } = route.params || {};
  const [loading, setLoading] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);

  if (!agent) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: Colors.white }}>
        <ServiceHeader title="Agent Details" onBack={() => navigation.goBack()} />
        <View style={styles.errorContainer}>
          <Text>Agent not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  const handleDeleteAgent = () => {
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    try {
      setLoading(true);
      await deleteDownlineAgent(agent.user.id);
      setShowDeleteModal(false);
      setShowSuccessModal(true);
    } catch (error) {
      console.error("Delete error:", error);
      setShowDeleteModal(false);
      setShowErrorModal(true);
    } finally {
      setLoading(false);
    }
  };

  const cancelDelete = () => {
    setShowDeleteModal(false);
  };

  const handleSuccessClose = () => {
    setShowSuccessModal(false);
    refreshAgentList?.();
    navigation.goBack();
  };

  const handleErrorClose = () => {
    setShowErrorModal(false);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "active": return "#16A34A";
      case "inactive": return "#6B7280";
      case "suspended": return "#DC2626";
      default: return "#6B7280";
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case "active": return "Active";
      case "inactive": return "Inactive";
      case "suspended": return "Suspended";
      default: return status;
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.white, paddingBottom: 65, }}>
      <ServiceHeader title="Agent Details" onBack={() => navigation.goBack()} />
      
      <ScrollView style={styles.container}>
        <View style={styles.btnBox}>
          <TouchableOpacity
            style={[styles.actionBtn, styles.editBtn]}
            onPress={() => navigation.navigate("AgentEdit", { agent, refreshAgentList })}
            disabled={loading}
          >
            <Ionicons name="create-outline" size={18} color="#fff" />
            <Text style={styles.actionBtnText}>Edit</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionBtn, styles.slabBtn]}
            onPress={() => navigation.navigate("AssignSlab", { agent, refreshAgentList })}
            disabled={loading}
          >
            <Ionicons name="add-circle-outline" size={18} color="#fff" />
            <Text style={styles.actionBtnText}>Assign Slab</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionBtn, styles.deleteBtn]}
            onPress={handleDeleteAgent}
            disabled={loading}
          >
            <Ionicons name="trash-outline" size={18} color="#fff" />
            <Text style={styles.actionBtnText}>Delete</Text>
          </TouchableOpacity>
        </View>

    
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Basic Information</Text>
          
          <InfoRow label="Username" value={agent.user?.username} />
          <InfoRow label="Email" value={agent.user?.email} />
          <InfoRow label="Mobile Number" value={agent.user?.mobileNumber} />
          <InfoRow label="Alternative Contact" value={agent.alternativeContact} />
          <InfoRow 
            label="Status" 
            value={getStatusLabel(agent.user?.status)} 
            valueColor={getStatusColor(agent.user?.status)}
          />
          <InfoRow label="Account Type" value={agent.accountType} />
          <InfoRow label="Registration Type" value={agent.registrationType} />
        </View>

     
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Commission Information</Text>
          
          <InfoRow 
            label="Commission Rate" 
            value={
              agent.commissionRateDetails?.percentage 
                ? `${agent.commissionRateDetails.percentage}%` 
                : "Not set"
            } 
          />
          <InfoRow 
            label="Current Slab" 
            value={agent.commissionRateDetails?.slabTypeDetails?.title || "Not assigned"} 
          />
          {agent.commissionRateDetails?.slabTypeDetails?.description && (
            <InfoRow 
              label="Slab Description" 
              value={agent.commissionRateDetails.slabTypeDetails.description} 
            />
          )}
        </View>

   
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Location Information</Text>
          
          <InfoRow label="Country" value={agent?.countryDetails?.countryName?.en} />
          <InfoRow label="Province" value={agent?.provinceDetails?.provinceName?.en} />
          <InfoRow label="District" value={agent?.districtDetails?.districtName?.en} />
          <InfoRow label="Address" value={agent.address} />
          <InfoRow label="Message Language" value={agent.messageLanguage} />
        </View>

 
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>System Information</Text>
          
          <InfoRow 
            label="Created Date" 
            value={agent.createdAt ? new Date(agent.createdAt).toLocaleDateString() : "-"} 
          />
          <InfoRow 
            label="Last Updated" 
            value={agent.updatedAt ? new Date(agent.updatedAt).toLocaleDateString() : "-"} 
          />
        </View>
      </ScrollView>

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        visible={showDeleteModal}
        onCancel={cancelDelete}
        onConfirm={confirmDelete}
        title="Delete Agent"
        message="Are you sure you want to delete this agent? This action cannot be undone and all associated data will be permanently removed."
        itemName={agent.user?.username}
        isLoading={loading}
        confirmText="Delete Agent"
        cancelText="Cancel"
      />

      {/* Success Modal */}
      <SuccessModal
        visible={showSuccessModal}
        onClose={handleSuccessClose}
        title="Agent Deleted Successfully"
        message="The agent has been permanently removed from the system. All associated data has been deleted."
        buttonText="Continue"
        autoHideDuration={0} // Don't auto-hide, let user click
      />

      {/* Error Modal */}
      <ErrorModal
        visible={showErrorModal}
        onClose={handleErrorClose}
        title="Failed to Delete Agent"
        message="There was an error while deleting the agent. Please check your connection and try again."
        buttonText="Try Again"
        showRetryButton={true}
      />

      {loading && (
        <View style={styles.loadingOverlay}>
          <Text style={styles.loadingText}>Processing...</Text>
        </View>
      )}
    </SafeAreaView>
  );
}

function InfoRow({ label, value, valueColor }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text 
        style={[
          styles.infoValue,
          valueColor && { color: valueColor, fontWeight: "600" }
        ]}
        numberOfLines={2}
      >
        {value || "Not set"}
      </Text>
    </View>
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
  btnBox: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 8,
    marginBottom: 20,
    padding: 12,
    backgroundColor: "#f8f9fa",
    borderRadius: 10,
  },
  actionBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    borderRadius: 8,
  },
  editBtn: {
    backgroundColor: Colors.primary,
  },
  slabBtn: {
    backgroundColor: "#8B5CF6",
  },
  deleteBtn: {
    backgroundColor: "#DC2626",
  },
  actionBtnText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
  section: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#f1f1f1",
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.textPrimary,
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#f8f9fa",
  },
  infoLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontWeight: "500",
    flex: 1,
  },
  infoValue: {
    fontSize: 14,
    color: Colors.textPrimary,
    fontWeight: "400",
    flex: 1,
    textAlign: "right",
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(255,255,255,0.8)",
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    fontSize: 16,
    color: Colors.textPrimary,
  },
});