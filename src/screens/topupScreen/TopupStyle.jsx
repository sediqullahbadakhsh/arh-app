
import { StyleSheet } from 'react-native';
import { Colors } from "../../theme/colors";

const TopUpStyles = StyleSheet.create({
  sectionTitle: {
    fontSize: 16,
    marginBottom: 12,
    fontWeight: "600",
    color: Colors.textPrimary,
  },
  smallLabel: {
    fontSize: 13,
    color: Colors.textPrimary,
    marginBottom: 6,
    marginTop: 12,
  },

  dropField: {
    height: 65,
    borderRadius: 50,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    paddingHorizontal: 16,
    backgroundColor: "#fff",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  editHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 8,
    marginBottom: 12,
  },
  editLink: { color: Colors.primary, fontSize: 16, fontWeight: "600" },

  phoneRow: {
    flexDirection: "row",
    height: 65,
    borderRadius: 50,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#E6E6E6",
    backgroundColor: "#fff",
  },
  phonePrefix: {
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    borderRightWidth: 1,
    borderRightColor: "#EEE",
    backgroundColor: "#FAFAFA",
  },
  phoneInput: {
    flex: 1,
    paddingHorizontal: 16,
    fontSize: 16,
    color: Colors.textPrimary,
  },

  operatorPill: {
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    height: 24,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
  },

  customRow: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 50,
    backgroundColor: "#fff",
    paddingHorizontal: 12,
    height: 65,
  },
  currencyTag: { fontWeight: "700", marginRight: 8, color: Colors.textPrimary },
  customInput: { flex: 1, fontSize: 16, color: Colors.textPrimary },
  clearBtn: { padding: 6 },
  equivText: { fontSize: 12, color: "#9E9E9E", marginTop: 6 },

  amountCell: {
    height: 48,
    borderRadius: 14,
    backgroundColor: "#FFF7F4",
    borderWidth: 1,
    borderColor: "#F7E7E5",
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  amountCellActive: { backgroundColor: "#FFECE8", borderColor: Colors.primary },
  afnLeft: { fontSize: 15, color: Colors.textPrimary, fontWeight: "600" },
  usdRight: { fontSize: 14, color: Colors.textSecondary },

  breakdownContainer: {
    marginTop: 16,
    padding: 12,
    backgroundColor: "#F9FAFB",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  breakdownTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.textPrimary,
    marginBottom: 8,
  },
  breakdownRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  breakdownTotal: {
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
    paddingTop: 8,
    marginTop: 4,
  },
  breakdownLabel: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  breakdownValue: {
    fontSize: 13,
    color: Colors.textPrimary,
    fontWeight: "500",
  },

  summaryCard: {
    marginTop: 18,
    borderWidth: 1,
    borderColor: "#F2DAD7",
    backgroundColor: "#FFF",
    borderRadius: 12,
    padding: 12,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 4,
  },
  summaryKey: { color: Colors.textSecondary, fontSize: 13 },
  summaryValue: { color: Colors.textPrimary, fontSize: 13 },

  successCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: "rgba(76,175,80,0.1)",
    borderWidth: 2,
    borderColor: "rgba(76,175,80,0.35)",
    justifyContent: "center",
    alignItems: "center",
    marginVertical: 12,
  },
  successTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: Colors.textPrimary,
    marginBottom: 16,
  },
  kv: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 6,
  },
  k: { color: Colors.textSecondary, fontSize: 13 },
  v: { color: Colors.textPrimary, fontSize: 13 },
  totalBox: {
    width: "100%",
    backgroundColor: "#F5F5F7",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    marginVertical: 18,
  },
  totalLabel: { color: Colors.textSecondary, fontSize: 12 },
  totalValue: { color: Colors.textPrimary, fontSize: 20, fontWeight: "700" },


serviceTypeToggle: {
  flexDirection: 'row',
  backgroundColor: '#F5F5F5',
  borderRadius: 50,
  padding: 4,
  marginBottom: 20,
  width: '100%', 
},
  toggleOption: {
    flex: 1,
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toggleOptionActive: {
    backgroundColor: Colors.primary,
  },
  toggleText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  toggleTextActive: {
    color: Colors.white,
  },

 quickAmountsList: {
    marginTop: 12,
  },
  quickAmountItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E8E8E8',
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  quickAmountItemSelected: {
    backgroundColor: '#FFF5F5',
    borderColor: Colors.primary,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  amountInfo: {
    display: 'flex', flexDirection: 'row',
    justifyContent: "space-between",
    alignItems: 'center',
    width: "100%",
  },
 amountValue: {
  fontSize: 18,
  fontWeight: '600',
  color: Colors.textPrimary,
  fontFamily: 'dmsansRegular',
},

amountValueSelected: {
  color: Colors.primary, 
},

amountSubtext: {
  fontSize: 16,
  color: Colors.white,
  fontFamily: 'dmsansRegular',
  padding: 12,
  backgroundColor: '#E48D08',
  borderRadius: 50,
},

amountSubtextSelected: {
  color: Colors.white, 
},

  amountSubtextSelected: {
    color: Colors.primaryLight,
  },
  selectedIndicator: {
    padding: 4,
  },
  quickAmountsContainer: {
    marginTop: 24,
  },
  quickAmountsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 12,
  },
  quickAmountsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 20,
  },
  quickAmountButton: {
    width: '30%',
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  quickAmountButtonSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  quickAmountText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  quickAmountTextSelected: {
    color: Colors.white,
  },
  quickAmountSubtext: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  quickAmountSubtextSelected: {
    color: Colors.white,
  },


  comingSoonContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    marginTop: 20,
  },
  comingSoonTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginTop: 16,
    marginBottom: 8,
  },
  comingSoonText: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
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
closeButton: {
  padding: 4,
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
  modalRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  
 
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 10,
    paddingHorizontal: 12,
    marginBottom: 16,
    height: 44,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: Colors.textPrimary,
  },
  
  
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    marginTop: 12,
  },

  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  contactAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  contactInfo: {
    flex: 1,
  },
  contactName: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.textPrimary,
  },
  contactPhone: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  contactSeparator: {
    height: 1,
    backgroundColor: '#F0F0F0',
  },
  
});


export default TopUpStyles;