//topupScreen/TopupStyle.jsx
import { StyleSheet } from 'react-native';
import { Colors } from "../../theme/colors";
import { scale } from '../../utils/normalizeSize';

const TopUpStyles = StyleSheet.create({
 sectionTitle: {
    fontSize: scale.hp(2),
    marginBottom: scale.hp(1.5),
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  lottieAnimation: {
    width: scale.wp(60),
    height: scale.wp(50),
  },
  statusHeader: {
    alignItems: 'center',
    marginBottom: scale.hp(1.5),
  },
  amountsGrid: {
  marginTop: 8,
  marginBottom: 20,
},
amountRow: {
  backgroundColor: '#FFFFFF',
  borderRadius: 16,
  padding: 16,
  marginBottom: 12,
  borderWidth: 2,
  borderColor: '#F0F0F0',
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.04,
  shadowRadius: 4,
  elevation: 1,
  transform: [{ scale: 1 }],
},
amountRowSelected: {
  borderColor: Colors.primary,
  backgroundColor: '#FFFBF9',
  shadowColor: Colors.primary,
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.12,
  shadowRadius: 8,
  elevation: 3,
},
amountRowContent: {
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'space-between',
},
amountMainInfo: {
  flex: 1,
},
amountValue: {
  fontSize: 18,
  fontWeight: '700',
  color: Colors.textPrimary,
  marginBottom: 8,
},
amountValueSelected: {
  color: Colors.primary,
},
amountBadges: {
  flexDirection: 'row',
  flexWrap: 'wrap',
  gap: 6,
},
amountBadge: {
  backgroundColor: '#F0F7FF',
  paddingHorizontal: 8,
  paddingVertical: 4,
  borderRadius: 8,
},
amountBadgeText: {
  fontSize: 11,
  color: '#0066CC',
  fontWeight: '600',
},
amountDetails: {
  alignItems: 'flex-end',
  marginLeft: 12,
},
amountDetailItem: {
  flexDirection: 'row',
  alignItems: 'center',
  marginBottom: 4,
},
amountDetailLabel: {
  fontSize: 12,
  color: Colors.textSecondary,
  marginRight: 4,
  fontWeight: '500',
},
amountDetailValue: {
  fontSize: 14,
  fontWeight: '600',
  color: Colors.textPrimary,
},
amountDetailValueSelected: {
  color: Colors.primary,
  fontWeight: '700',
},
selectedIndicator: {
  marginLeft: 12,
},
  statusIcon: {
    width: scale.wp(20),
    height: scale.wp(20),
    borderRadius: scale.wp(10),
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    marginBottom: scale.hp(1),
  },
  statusTitle: {
    fontSize: scale.hp(3),
    fontWeight: '700',
    textAlign: 'center',
    marginTop: scale.hp(2),
  },
  smallLabel: {
    fontSize: scale.hp(1.6),
    color: Colors.textPrimary,
    marginBottom: scale.hp(0.75),
    marginTop: scale.hp(1.5),
  },
  detailsCard: {
    backgroundColor: '#F8F9FA',
    borderRadius: scale.hp(1.5),
    padding: scale.hp(2.5),
    width: '100%',
    marginBottom: scale.hp(2.5),
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: scale.hp(1),
    borderBottomWidth: 1,
    borderBottomColor: '#E9ECEF',
  },
  detailLabel: {
    fontSize: scale.hp(1.75),
    color: '#6C757D',
    fontWeight: '500',
  },
  detailValue: {
    fontSize: scale.hp(1.75),
    color: Colors.textPrimary,
    fontWeight: '600',
  },
  amountSection: {
    marginTop: scale.hp(1.5),
    paddingTop: scale.hp(1.5),
    borderTopWidth: 2,
    borderTopColor: Colors.primary,
    alignItems: 'center',
  },
  amountLabel: {
    fontSize: scale.hp(2),
    color: '#6C757D',
    fontWeight: '500',
    marginBottom: scale.hp(0.5),
  },
  amountValue: {
    fontSize: scale.hp(3),
    color: Colors.primary,
    fontWeight: '700',
  },
  statusMessageContainer: {
    backgroundColor: '#F8F9FA',
    padding: scale.hp(2),
    borderRadius: scale.hp(1),
    marginBottom: scale.hp(2.5),
    width: '100%',
  },
  statusMessage: {
    fontSize: scale.hp(1.75),
    textAlign: 'center',
    fontWeight: '500',
    lineHeight: scale.hp(2.5),
  },
  progressContainer: {
    width: '100%',
    alignItems: 'center',
    marginBottom: scale.hp(2.5),
  },
  progressBar: {
    width: '100%',
    height: scale.hp(0.75),
    backgroundColor: '#E9ECEF',
    borderRadius: scale.hp(0.375),
    marginBottom: scale.hp(1),
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: scale.hp(0.375),
    transition: 'width 0.3s ease',
  },
  progressText: {
    fontSize: scale.hp(1.5),
    color: '#6C757D',
    fontWeight: '500',
  },
  moreButton: {
    padding: scale.hp(1.5),
  },
  moreButtonText: {
    color: Colors.primary,
    fontSize: scale.hp(2),
    fontWeight: '600',
    textAlign: 'center',
  },
  dropField: {
    height: scale.hp(8),
    borderRadius: scale.hp(6.25),
    marginBottom: scale.hp(1.875),
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: scale.wp(4),
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

 editHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: scale.hp(1),
    marginBottom: scale.hp(1.5),
  },
  editLink: {
    color: Colors.primary,
    fontSize: scale.hp(2),
    fontWeight: '600',
  },
  phoneRowRTL: {
    flexDirection: 'row-reverse',
  },
  phoneRow: {
    flexDirection: 'row',
    direction: 'ltr',
    height: scale.hp(8),
    borderRadius: scale.hp(6.25),
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E6E6E6',
    backgroundColor: '#fff',
  },
  phonePrefix: {
    paddingHorizontal: scale.wp(4),
    flexDirection: 'row',
    alignItems: 'center',
    borderRightWidth: 1,
    borderRightColor: '#EEE',
    backgroundColor: '#FAFAFA',
  },
  phoneInput: {
    flex: 1,
    paddingHorizontal: scale.wp(4),
    fontSize: scale.hp(2),
    color: Colors.textPrimary,
  },
  operatorPill: {
    alignSelf: 'flex-start',
    paddingHorizontal: scale.wp(2.5),
    height: scale.hp(3),
    borderRadius: scale.hp(1.5),
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  customRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: scale.hp(6.25),
    backgroundColor: '#fff',
    paddingHorizontal: scale.wp(3),
    height: scale.hp(8),
  },
  currencyTag: {
    fontWeight: '700',
    marginRight: scale.wp(2),
    color: Colors.textPrimary,
  },
  customInput: {
    flex: 1,
    fontSize: scale.hp(2),
    color: Colors.textPrimary,
  },
  clearBtn: {
    padding: scale.hp(0.75),
  },
  equivText: {
    fontSize: scale.hp(1.5),
    color: '#9E9E9E',
    marginTop: scale.hp(0.75),
  },
  amountCell: {
    height: scale.hp(6),
    borderRadius: scale.hp(1.75),
    backgroundColor: '#FFF7F4',
    borderWidth: 1,
    borderColor: '#F7E7E5',
    paddingHorizontal: scale.wp(4),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  amountCellActive: {
    backgroundColor: '#FFECE8',
    borderColor: Colors.primary,
  },
  afnLeft: {
    fontSize: scale.hp(1.9),
    color: Colors.textPrimary,
    fontWeight: '600',
  },
  usdRight: {
    fontSize: scale.hp(1.75),
    color: Colors.textSecondary,
  },
  breakdownContainer: {
    marginTop: scale.hp(2),
    padding: scale.hp(1.5),
    backgroundColor: '#F9FAFB',
    borderRadius: scale.hp(1),
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  breakdownTitle: {
    fontSize: scale.hp(1.75),
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: scale.hp(1),
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: scale.hp(0.5),
  },
  breakdownTotal: {
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingTop: scale.hp(1),
    marginTop: scale.hp(0.5),
  },
  breakdownLabel: {
    fontSize: scale.hp(1.6),
    color: Colors.textSecondary,
  },
  breakdownValue: {
    fontSize: scale.hp(1.6),
    color: Colors.textPrimary,
    fontWeight: '500',
  },
  summaryCard: {
    marginTop: scale.hp(2.25),
    borderWidth: 1,
    borderColor: '#F2DAD7',
    backgroundColor: '#FFF',
    borderRadius: scale.hp(1.5),
    padding: scale.hp(1.5),
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: scale.hp(0.5),
  },
  summaryKey: {
    color: Colors.textSecondary,
    fontSize: scale.hp(1.6),
  },
  summaryValue: {
    color: Colors.textPrimary,
    fontSize: scale.hp(1.6),
  },
  successCircle: {
    width: scale.wp(24),
    height: scale.wp(24),
    borderRadius: scale.wp(12),
    backgroundColor: 'rgba(76,175,80,0.1)',
    borderWidth: 2,
    borderColor: 'rgba(76,175,80,0.35)',
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: scale.hp(1.5),
  },
  successTitle: {
    fontSize: scale.hp(2.5),
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: scale.hp(2),
  },
  kv: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: scale.hp(0.75),
  },
  k: {
    color: Colors.textSecondary,
    fontSize: scale.hp(1.6),
  },
  v: {
    color: Colors.textPrimary,
    fontSize: scale.hp(1.6),
  },
  totalBox: {
    width: '100%',
    backgroundColor: '#F5F5F7',
    borderRadius: scale.hp(1.5),
    paddingVertical: scale.hp(1.75),
    alignItems: 'center',
    marginVertical: scale.hp(2.25),
  },
  totalLabel: {
    color: Colors.textSecondary,
    fontSize: scale.hp(1.5),
  },
  totalValue: {
    color: Colors.textPrimary,
    fontSize: scale.hp(2.5),
    fontWeight: '700',
  },
  serviceTypeToggle: {
    flexDirection: 'row',
    backgroundColor: '#F5F5F5',
    borderRadius: scale.hp(6.25),
    padding: scale.hp(0.5),
    marginBottom: scale.hp(2.5),
    width: '100%',
  },
  toggleOption: {
    flex: 1,
    paddingVertical: scale.hp(2),
    paddingHorizontal: scale.wp(5),
    borderRadius: scale.hp(6.25),
    alignItems: 'center',
    justifyContent: 'center',
  },
  toggleOptionActive: {
    backgroundColor: Colors.primary,
  },
  toggleText: {
    fontSize: scale.hp(2),
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  toggleTextActive: {
    color: Colors.white,
  },
  quickAmountsList: {
  marginTop: scale.hp(1.5),
},

quickAmountItem: {
  width: "100%",
  marginBottom: scale.hp(1.25),
  borderRadius: scale.hp(1.5),
  overflow: 'hidden',
  shadowColor: '#000',
  shadowOffset: { width: 0, height: scale.hp(0.125) },
  shadowOpacity: 0.05,
  shadowRadius: scale.hp(0.25),
  elevation: 1,
},

quickAmountTouchable: {
  width: '100%',
  padding: scale.hp(2),
},

amountInfo: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
  width: '100%',
},

amountValue: {
  fontSize: scale.hp(2.25),
  fontWeight: '600',
  color: Colors.textPrimary,
  fontFamily: 'dmsansRegular',
},

amountValueSelected: {
  color: Colors.primary,
},

amountSubtext: {
  fontSize: scale.hp(2),
  color: Colors.white,
  fontFamily: 'dmsansRegular',
  padding: scale.hp(1.5),
  backgroundColor: '#E48D08',
  borderRadius: scale.hp(6.25),
},

amountSubtextSelected: {
  color: Colors.primaryLight,
},

usdEquivalentContainer: {
  marginRight: scale.wp(2),
},

usdEquivalentText: {
  fontSize: scale.hp(1.75),
  color: Colors.textSecondary,
},

skeletonAmountItem: {
  width: "100%",
  height: scale.hp(8),
  borderRadius: scale.hp(1.5),
  backgroundColor: '#F5F5F5',
  marginBottom: scale.hp(1.25),
},
 amountInfo: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
  width: '100%',
},
  amountValue: {
    fontSize: scale.hp(2.25),
    fontWeight: '600',
    color: Colors.textPrimary,
    fontFamily: 'dmsansRegular',
  },
  amountValueSelected: {
    color: Colors.primary,
  },
  amountSubtext: {
    fontSize: scale.hp(2),
    color: Colors.white,
    fontFamily: 'dmsansRegular',
    padding: scale.hp(1.5),
    backgroundColor: '#E48D08',
    borderRadius: scale.hp(6.25),
  },
  amountSubtextSelected: {
    color: Colors.primaryLight,
  },
  selectedIndicator: {
    padding: scale.hp(0.5),
  },
  quickAmountsContainer: {
    marginTop: scale.hp(3),
  },
  quickAmountsTitle: {
    fontSize: scale.hp(2),
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: scale.hp(1.5),
  },
  quickAmountsGrid: {
    flexDirection: 'col',
    flexWrap: 'wrap',
    gap: scale.wp(2.5),
    marginBottom: scale.hp(2.5),
  },
  quickAmountButton: {
    width: '30%',
    padding: scale.hp(1.5),
    borderRadius: scale.hp(1.5),
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
    fontSize: scale.hp(1.75),
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  quickAmountTextSelected: {
    color: Colors.white,
  },
  quickAmountSubtext: {
    fontSize: scale.hp(1.5),
    color: Colors.textSecondary,
    marginTop: scale.hp(0.5),
  },
  quickAmountSubtextSelected: {
    color: Colors.white,
  },
  comingSoonContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: scale.hp(5),
    backgroundColor: '#F9FAFB',
    borderRadius: scale.hp(2),
    marginTop: scale.hp(2.5),
  },
  comingSoonTitle: {
    fontSize: scale.hp(2.5),
    fontWeight: '700',
    color: Colors.textPrimary,
    marginTop: scale.hp(2),
    marginBottom: scale.hp(1),
  },
  comingSoonText: {
    fontSize: scale.hp(2),
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: scale.hp(3),
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderTopLeftRadius: scale.hp(3.125),
    borderTopRightRadius: scale.hp(3.125),
    padding: scale.hp(2),
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -scale.hp(0.25) },
    shadowOpacity: 0.25,
    shadowRadius: scale.hp(0.5),
  },
  closeButton: {
    padding: scale.hp(0.5),
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: scale.hp(2),
    paddingBottom: scale.hp(1.5),
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  modalTitle: {
    fontSize: scale.hp(2.25),
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  modalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: scale.hp(1.5),
    paddingHorizontal: scale.wp(2),
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: scale.hp(1.25),
    paddingHorizontal: scale.wp(3),
    marginBottom: scale.hp(2),
    height: scale.hp(5.5),
  },
  searchIcon: {
    marginRight: scale.wp(2),
  },
  searchInput: {
    flex: 1,
    fontSize: scale.hp(2),
    color: Colors.textPrimary,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: scale.hp(5),
  },
  emptyText: {
    fontSize: scale.hp(2),
    color: '#999',
    marginTop: scale.hp(1.5),
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: scale.hp(1.5),
  },
  contactAvatar: {
    width: scale.wp(10),
    height: scale.wp(10),
    borderRadius: scale.wp(5),
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: scale.wp(3),
  },
  contactInfo: {
    flex: 1,
  },
   quickAmountsContainer: {
    marginTop: 20,
  },
  

 
  
  contactName: {
    fontSize: scale.hp(2),
    fontWeight: '500',
    color: Colors.textPrimary,
  },
  contactPhone: {
    fontSize: scale.hp(1.75),
    color: Colors.textSecondary,
    marginTop: scale.hp(0.25),
  },
  contactSeparator: {
    height: 1,
    backgroundColor: '#F0F0F0',
  },

});


export default TopUpStyles;