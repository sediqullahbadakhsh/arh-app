import { StyleSheet } from "react-native";
import { Colors } from "../../theme/colors";

const OrderStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    marginBottom: 110,
  },
  listContainer: {
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  filterButton: {
    padding: 4,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    margin: 16,
    borderRadius: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 44,
    fontSize: 16,
  },
  orderItem: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderLeftWidth: 4,
    borderLeftColor: Colors.primary,
  },
  orderHeader: {
    marginBottom: 12,
  },
  orderIdContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  txnId: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  dateText: {
    fontSize: 12,
    color: '#999',
  },
  orderBody: {
    marginBottom: 16,
  },
  receiverInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: "space-between",
    marginBottom: 12,
  },
  receiverInfo1: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  receiverText: {
    marginLeft: 8,
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  amountInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  amountText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.primary,
  },
  sourceText: {
    fontSize: 14,
    color: '#666',
    textTransform: 'capitalize',
  },
  orderFooter: {
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 12,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  actionButton: {
    alignItems: 'center',
    padding: 8,
  },
  actionButtonText: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  emptyList: {
    flex: 1,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateSubText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
  errorState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  errorStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#f44336',
    marginTop: 16,
    marginBottom: 8,
  },
  errorStateSubText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#CD0202',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 16,
    alignItems: 'center',
  },
  retryButtonText: {
    color: '#fff',
    fontWeight: '600',
  },


  modalOverlay: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalCard: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    padding: 16,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  modalTitle: { 
    fontSize: 18, 
    fontWeight: "700", 
    color: Colors.textPrimary 
  },
  closeButton: {
    padding: 4,
  },
  filterOptions: {
    marginBottom: 16,
  },
  filterSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  filterOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  filterOptionSelected: {
    backgroundColor: '#f0f7ff',
  },
  filterOptionText: {
    fontSize: 16,
    color: '#333',
    textTransform: 'capitalize',
  },
  filterOptionTextSelected: {
    color: Colors.primary,
    fontWeight: '600',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  resetButton: {
    flex: 1,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
  },
  resetButtonText: {
    color: '#666',
    fontWeight: '600',
  },
  applyButton: {
    flex: 1,
    padding: 12,
    alignItems: 'center',
    backgroundColor: Colors.primary,
    borderRadius: 8,
  },
  applyButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  orderDetails: {
    maxHeight: 840,
  },
  receiptContainer: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    marginBottom: 20,
    width: "100%",
  },
  receiptHeader: {
    alignItems: 'center',
    marginBottom: 15,
  },
  receiptTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: Colors.primary,
    marginBottom: 5,
  },
  receiptSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  receiptDivider: {
    height: 2,
    backgroundColor: Colors.primary,
    marginVertical: 15,
  },
  receiptDividerThin: {
    height: 1,
    backgroundColor: '#e0e0e0',
    marginVertical: 10,
  },
  receiptDetails: {
    marginBottom: 15,
  },
  receiptRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  receiptLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  receiptValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  receiptStatus: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  receiptStatusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  receiptFooter: {
    alignItems: 'center',
  },
  thankYouText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 5,
  },
  supportText: {
    fontSize: 12,
    color: '#666',
  },
  receiptActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  receiptButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    flex: 1,
    marginHorizontal: 5,
  },
  downloadButton: {
    backgroundColor: Colors.primary,
  },
  shareButton: {
    backgroundColor: '#4caf50',
  },
  receiptButtonText: {
    color: '#fff',
    fontWeight: '600',
    marginLeft: 5,
  },


  skeletonOrderItem: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderLeftWidth: 4,
    borderLeftColor: '#E0E0E0',
  },
  skeletonOrderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  skeletonTxnId: {
    width: 120,
    height: 14,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
  },
  skeletonStatus: {
    width: 60,
    height: 20,
    backgroundColor: '#E0E0E0',
    borderRadius: 10,
  },
  skeletonDate: {
    width: 80,
    height: 12,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
    marginBottom: 12,
  },
  skeletonOrderBody: {
    marginBottom: 16,
  },
  skeletonReceiverInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  skeletonReceiverIcon: {
    width: 16,
    height: 16,
    backgroundColor: '#E0E0E0',
    borderRadius: 8,
    marginRight: 8,
  },
  skeletonReceiverText: {
    width: 100,
    height: 16,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
  },
  skeletonAmountInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  skeletonAmount: {
    width: 80,
    height: 18,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
  },
  skeletonSource: {
    width: 60,
    height: 14,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
  },
  skeletonOrderFooter: {
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 12,
  },
  skeletonActionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  skeletonActionButton: {
    width: 60,
    height: 30,
    backgroundColor: '#E0E0E0',
    borderRadius: 6,
  },
  skeletonSearchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    margin: 16,
    borderRadius: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    height: 44,
  },
  skeletonSearchIcon: {
    width: 20,
    height: 20,
    backgroundColor: '#E0E0E0',
    borderRadius: 10,
    marginRight: 8,
  },
  skeletonSearchInput: {
    flex: 1,
    height: 20,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
  },
});

export default OrderStyles;