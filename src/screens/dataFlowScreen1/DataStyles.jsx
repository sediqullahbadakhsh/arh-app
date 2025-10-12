
import { StyleSheet } from 'react-native';
import { Colors } from "../../theme/colors";
const DataStyles = StyleSheet.create({
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

  countryBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: "#F5F5F5",
    borderRadius: 20,
    alignSelf: 'flex-start',
    marginBottom: 16,
  },

  categoriesScroll: {
    marginBottom: 16,
  },
  categoriesContainer: {
    flexDirection: "row",
    gap: 8,
  },
  categoryChip: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    backgroundColor: "#F5F5F5",
  },
  categoryChipActive: {
    backgroundColor: Colors.primary,
  },
  categoryText: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.textSecondary,
  },
  categoryTextActive: {
    color: Colors.white,
  },

  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 50,
    paddingHorizontal: 16,
    marginBottom: 16,
    height: 50,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: Colors.textPrimary,
  },

  bundleCard: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E8E8E8",
    backgroundColor: "#fff",
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  bundleCardActive: {
    borderColor: Colors.primary,
    backgroundColor: '#FFF5F5',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  bundleHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  operatorLogo: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  bundleInfo: {
    flex: 1,
  },
  bundleName: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  bundleDesc: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  bundleFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  bundlePrice: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.textPrimary,
  },
  bundleSeparator: {
    height: 12,
  },

  summaryCard: {
    marginTop: 18,
    borderWidth: 1,
    borderColor: "#F2DAD7",
    backgroundColor: "#FFF",
    borderRadius: 12,
    padding: 16,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 6,
  },
  summaryTotal: {
    borderTopWidth: 1,
    borderTopColor: "#F2F2F2",
    paddingTop: 8,
    marginTop: 4,
  },
  summaryKey: { color: Colors.textSecondary, fontSize: 14 },
  summaryValue: { color: Colors.textPrimary, fontSize: 14, textAlign: 'right', flex: 1, paddingLeft: 8 },

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
  modalRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  closeButton: {
    padding: 4,
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

  emptyProducts: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyProductsText: {
    fontSize: 16,
    color: '#999',
    marginTop: 12,
  },
});

export default DataStyles;