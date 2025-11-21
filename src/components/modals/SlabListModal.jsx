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
import { scale } from "../../utils/normalizeSize";


const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const SlabListModal = ({ visible, onClose, onUpdate, slabs }) => {
  const [selectedSlab, setSelectedSlab] = useState(null);
  const [updateModalVisible, setUpdateModalVisible] = useState(false);
  

  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [slabToDelete, setSlabToDelete] = useState(null);


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
          <TouchableOpacity 
            style={styles.modalBackdrop}
            activeOpacity={1}
            onPress={onClose}
          />
          
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Commission Slabs</Text>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <Ionicons name="close" size={24} color={Colors.textPrimary} />
              </TouchableOpacity>
            </View>

    
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
    borderRadius: scale.hp(1.55),
    width: screenWidth * 0.9,
    height: screenHeight * 0.8,
    overflow: "hidden",
    margin: scale.hp(2.6),
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: scale.hp(2.1),
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  modalTitle: {
    fontSize: scale.hp(2.35),
    fontWeight: "600",
    color: Colors.textPrimary,
  },
  closeButton: {
    padding: scale.hp(0.5),
  },
  listContent: {
    padding: scale.hp(2.1),
    flexGrow: 1,
  },
  slabItem: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: scale.hp(1.3),
    padding: scale.hp(2.1),
    borderWidth: 1,
    borderColor: "#e5e7eb",
    shadowColor: '#000',
    shadowOffset: { width: 0, height: scale.hp(0.13) },
    shadowOpacity: 0.05,
    shadowRadius: scale.hp(0.26),
    elevation: 1,
  },
  slabContent: {
    flex: 1,
  },
  slabHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: scale.hp(1.05),
  },
  slabTitle: {
    fontSize: scale.hp(2.1),
    fontWeight: "600",
    color: Colors.textPrimary,
    flex: 1,
  },
  slabPercentage: {
    backgroundColor: Colors.primary,
    paddingHorizontal: scale.wp(2.1),
    paddingVertical: scale.hp(0.5),
    borderRadius: scale.hp(0.8),
    marginLeft: scale.wp(2.1),
    minWidth: scale.wp(13),
    alignItems: 'center',
  },
  percentageText: {
    color: "#fff",
    fontSize: scale.hp(1.55),
    fontWeight: "600",
  },
  slabDescription: {
    fontSize: scale.hp(1.55),
    color: Colors.textSecondary,
    marginBottom: scale.hp(1.05),
    lineHeight: scale.hp(2.1),
  },
  slabMeta: {
    gap: scale.hp(0.26),
  },
  metaText: {
    fontSize: scale.hp(1.4),
    color: Colors.textSecondary,
  },
  slabActions: {
    justifyContent: "center",
    alignItems: "center",
    marginLeft: scale.wp(3.1),
    gap: scale.hp(1.05),
  },
  actionButton: {
    width: scale.wp(9.4),
    height: scale.wp(9.4),
    borderRadius: scale.hp(1.05),
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
    height: scale.hp(1.05),
  },
  emptyContainer: {
    alignItems: "center",
    padding: scale.hp(5.2),
    justifyContent: 'center',
    flex: 1,
  },
  emptyText: {
    fontSize: scale.hp(2.1),
    color: Colors.textSecondary,
    marginTop: scale.hp(1.55),
    textAlign: "center",
    fontWeight: '500',
  },
  emptySubtext: {
    fontSize: scale.hp(1.55),
    color: Colors.textSecondary,
    marginTop: scale.hp(0.5),
    textAlign: "center",
  },
});

export default SlabListModal;