// screens/modals/SlabListModal.js
import React, { useState } from "react";
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "../../theme/colors";
import { useMutation } from "@tanstack/react-query";
import { deleteSlab } from "../../services/slabs";
import UpdateSlabModal from "./UpdateSlabModal";
import SuccessModal from "./SuccessModal";
import ErrorModal from "./ErrorModal";
import DeleteConfirmationModal from "./DeleteConfirmationModal";


const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const SlabListModal = ({ visible, onClose, onUpdate, slabs }) => {
  const [selectedSlab, setSelectedSlab] = useState(null);
  const [updateModalVisible, setUpdateModalVisible] = useState(false);
  
  // Modal states
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [slabToDelete, setSlabToDelete] = useState(null);

  // Modal handlers
  const showCustomSuccessModal = (message) => {
    setSuccessMessage(message);
    setShowSuccessModal(true);
  };

  const showCustomErrorModal = (message) => {
    setErrorMessage(message);
    setShowErrorModal(true);
  };

  const handleSuccessClose = () => {
    setShowSuccessModal(false);
    setSuccessMessage("");
  };

  const handleErrorClose = () => {
    setShowErrorModal(false);
    setErrorMessage("");
  };

  const deleteSlabMutation = useMutation({
    mutationFn: deleteSlab,
    onSuccess: () => {
      showCustomSuccessModal("Slab deleted successfully");
      onUpdate?.();
    },
    onError: (error) => {
      const message = error?.response?.data?.error || "Failed to delete slab";
      showCustomErrorModal(message);
    },
  });

  const handleDeleteSlab = (slab) => {
    setSlabToDelete(slab);
    setShowDeleteModal(true);
  };

  const confirmDeleteSlab = () => {
    if (slabToDelete) {
      deleteSlabMutation.mutateAsync(slabToDelete.id);
      setShowDeleteModal(false);
      setSlabToDelete(null);
    }
  };

  const cancelDeleteSlab = () => {
    setShowDeleteModal(false);
    setSlabToDelete(null);
  };

  const handleEditSlab = (slab) => {
    setSelectedSlab(slab);
    setUpdateModalVisible(true);
  };

  const handleUpdateSuccess = () => {
    setUpdateModalVisible(false);
    setSelectedSlab(null);
    onUpdate?.();
    showCustomSuccessModal("Slab updated successfully");
  };

  const handleUpdateError = () => {
    showCustomErrorModal("Failed to update slab");
  };

  const renderSlabItem = ({ item }) => (
    <View style={styles.slabItem}>
      <View style={styles.slabContent}>
        <View style={styles.slabHeader}>
          <Text style={styles.slabTitle}>{item.slabTypeDetails?.title}</Text>
          <View style={styles.slabPercentage}>
            <Text style={styles.percentageText}>{item.percentage}%</Text>
          </View>
        </View>
        
        <Text style={styles.slabDescription}>
          {item.slabTypeDetails?.description || "No description"}
        </Text>

        <View style={styles.slabMeta}>
          <Text style={styles.metaText}>For: {item.slabFor}</Text>
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
          <Text style={styles.metaText}>
            Created: {new Date(item.createdAt).toLocaleDateString()}
          </Text>
        </View>
      </View>

      <View style={styles.slabActions}>
        <TouchableOpacity
          style={[styles.actionButton, styles.editButton]}
          onPress={() => handleEditSlab(item)}
        >
          <Ionicons name="create-outline" size={16} color="#16A34A" />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, styles.deleteButton]}
          onPress={() => handleDeleteSlab(item)}
          disabled={deleteSlabMutation.isPending}
        >
          {deleteSlabMutation.isPending && slabToDelete?.id === item.id ? (
            <ActivityIndicator size="small" color="#dc2626" />
          ) : (
            <Ionicons name="trash-outline" size={16} color="#dc2626" />
          )}
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <>
      <Modal
        visible={visible}
        animationType="slide"
        transparent={true}
        statusBarTranslucent={true}
        onRequestClose={onClose}
      >
        <View style={styles.modalOverlay}>
          {/* Full layout backdrop */}
          <TouchableOpacity 
            style={styles.modalBackdrop}
            activeOpacity={1}
            onPress={onClose}
          />
          
          <View style={styles.modalContent}>
            {/* Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Commission Slabs</Text>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <Ionicons name="close" size={24} color={Colors.textPrimary} />
              </TouchableOpacity>
            </View>

            {/* Slabs List */}
            <FlatList
              data={slabs}
              keyExtractor={(item) => item.id}
              renderItem={renderSlabItem}
              ItemSeparatorComponent={() => <View style={styles.separator} />}
              contentContainerStyle={styles.listContent}
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <Ionicons name="document-outline" size={48} color="#9E9E9E" />
                  <Text style={styles.emptyText}>No slabs created yet</Text>
                  <Text style={styles.emptySubtext}>
                    Create your first slab to get started
                  </Text>
                </View>
              }
            />
          </View>
        </View>
      </Modal>

      {/* Update Slab Modal */}
      <UpdateSlabModal
        visible={updateModalVisible}
        onClose={() => {
          setUpdateModalVisible(false);
          setSelectedSlab(null);
        }}
        onSuccess={handleUpdateSuccess}
        onError={handleUpdateError}
        slabData={selectedSlab}
      />

      {/* Success Modal */}
      <SuccessModal
        visible={showSuccessModal}
        onClose={handleSuccessClose}
        title="Success!"
        message={successMessage}
        buttonText="Continue"
        autoHideDuration={3000}
      />


      <ErrorModal
        visible={showErrorModal}
        onClose={handleErrorClose}
        title="Error"
        message={errorMessage}
        buttonText="Try Again"
        showRetryButton={true}
      />

  
      <DeleteConfirmationModal
        visible={showDeleteModal}
        onCancel={cancelDeleteSlab}
        onConfirm={confirmDeleteSlab}
        title="Delete Slab"
        message={`Are you sure you want to delete "${slabToDelete?.slabTypeDetails?.title}" slab? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        itemName="Slab"
      />
    </>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'transparent',
    justifyContent: "center",
    alignItems: "center",
  },
  modalBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 12,
    width: screenWidth * 0.9,
    height: screenHeight * 0.8,
    overflow: "hidden",
    margin: 20,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: Colors.textPrimary,
  },
  closeButton: {
    padding: 4,
  },
  listContent: {
    padding: 16,
    flexGrow: 1,
  },
  slabItem: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 16,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
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
    minWidth: 50,
    alignItems: 'center',
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
  slabActions: {
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 12,
    gap: 8,
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  editButton: {
    borderColor: "#16A34A",
    backgroundColor: "#16A34A15",
  },
  deleteButton: {
    borderColor: "#dc2626",
    backgroundColor: "#dc262615",
  },
  separator: {
    height: 8,
  },
  emptyContainer: {
    alignItems: "center",
    padding: 40,
    justifyContent: 'center',
    flex: 1,
  },
  emptyText: {
    fontSize: 16,
    color: Colors.textSecondary,
    marginTop: 12,
    textAlign: "center",
    fontWeight: '500',
  },
  emptySubtext: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 4,
    textAlign: "center",
  },
});

export default SlabListModal;