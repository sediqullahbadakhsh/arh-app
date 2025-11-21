import { StyleSheet, Dimensions } from "react-native";
import { Colors } from "../../../theme/colors";
import {widthPercentageToDP as wp, heightPercentageToDP as hp} from 'react-native-responsive-screen';
import { scale } from "../../../utils/normalizeSize";
const { width: screenWidth } = Dimensions.get('window');

// const HomeStyles = StyleSheet.create({
//   safeArea: { flex: 1, backgroundColor: Colors.white },
//   header: {
//     height: 180,
//     position: 'relative', 
//   },
//   svgContainer: {
//     width: '100%',
//     height: '100%',
//     position: 'absolute',
//   },
//   headerContent: {
//     position: 'absolute',
//     top: '50%',
//     left: 0,
//     right: 0,
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     paddingHorizontal: 20,
//     transform: [{ translateY: -24 }], 
//     zIndex: 1,
//   },
//   userInfo: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     flex: 1,
//   },
//   avatarContainer: {
//     width: 48,
//     height: 48,
//     borderRadius: 24,
//     backgroundColor: 'rgba(255,255,255,0.2)',
//     justifyContent: 'center',
//     alignItems: 'center',
//     marginRight: 12,
//     borderWidth: 2,
//     borderColor: 'rgba(255,255,255,0.3)',
//   },
//   avatarImage: {
//     width: 44,
//     height: 44,
//     borderRadius: 22,
//   },
//   avatarPlaceholder: {
//     width: 44,
//     height: 44,
//     borderRadius: 22,
//     justifyContent: 'center',
//     alignItems: 'center',
//     backgroundColor: 'rgba(255,255,255,0.2)',
//   },
//   userTextContainer: {
//     flex: 1,
//     justifyContent: 'center',
//   },
//   greeting: {
//     fontSize: 14,
//     color: 'rgba(255,255,255,0.8)',
//   },
//   userName: {
//     fontSize: 18,
//     fontWeight: 'bold',
//     color: '#fff',
//     marginTop: 2,
//   },
//   iconBtn: {
//     width: 44,
//     height: 44,
//     borderRadius: 22,
//     backgroundColor: "rgba(255,255,255,0.15)",
//     justifyContent: "center",
//     alignItems: "center",
//     marginLeft: 10,
//   },


//   promoBanner: {
//     marginHorizontal: 20,
//     marginTop: 20,
//     marginBottom: 25,
//     borderRadius: 20,
//     shadowColor: "#000",
//     shadowOffset: {
//       width: 0,
//       height: 8,
//     },
//     shadowOpacity: 0.2,
//     shadowRadius: 16,
//     elevation: 10,
//   },
//   promoGradient: {
//     borderRadius: 20,
//     padding: 20,
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'space-between',
//     minHeight: 120,
//   },
//   promoContent: {
//     flex: 1,
//   },
//   promoTextContainer: {
//     marginBottom: 15,
//   },
//   promoTitle: {
//     fontSize: 22,
//     fontWeight: 'bold',
//     color: '#fff',
//     marginBottom: 5,
//   },
//   promoSubtitle: {
//     fontSize: 14,
//     color: 'rgba(255,255,255,0.9)',
//     lineHeight: 20,
//   },
//   promoButton: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     backgroundColor: 'rgba(255,255,255,0.2)',
//     paddingHorizontal: 16,
//     paddingVertical: 8,
//     borderRadius: 20,
//     alignSelf: 'flex-start',
//   },
//   promoButtonText: {
//     color: '#fff',
//     fontWeight: '600',
//     fontSize: 14,
//     marginRight: 5,
//   },
//   promoIcon: {
//     marginLeft: 10,
//   },


//   servicesHeader: { 
//     paddingHorizontal: 24, 
//     marginBottom: 12, 
//     marginTop: 10,
//   },
//   servicesTitle: { 
//     fontSize: 18, 
//     fontWeight: "700", 
//     color: Colors.textPrimary 
//   },
//  servicesGrid: {
//   flexDirection: "row",
//   marginTop: 25,
//   flexWrap: "wrap",
//   shadowOffset: {
//     width: 0,
//     height: 0,},
//   shadowOpacity: 0.1,
//   shadowRadius: 6,
//   elevation: 3,
//   borderRadius: 16,
//   marginHorizontal: 20,
//   marginTop: 10,
//   backgroundColor: "#fff",
//   padding: 10,
//   justifyContent: "space-between", 
//   marginBottom: 24,
// },


//   offersContainer: {
//     marginHorizontal: 20,
//     marginBottom: 24,
//   },
//   offersHeader: {
//     flexDirection: "row",
//     justifyContent: "space-between",
//     alignItems: "center",
//     marginBottom: 16,
//   },
//   offersTitle: { 
//     color: Colors.textPrimary, 
//     fontSize: 18, 
//     fontWeight: "500" 
//   },
//   seeAll: { 
//     color: Colors.primary, 
//     fontSize: 14, 
//     fontWeight: "600" 
//   },
//   sliderContainer: {
//     position: 'relative',
//   },
//   offerCard: {
//     width: screenWidth - 40,
//     height: 200,
//     borderRadius: 20,
//     padding: 20,
//     justifyContent: 'center',
//   },
//   offerContent: {
//     flexDirection: 'row',
//     alignItems: 'center',
//   },
//   offerIconContainer: {
//     width: 60,
//     height: 60,
//     borderRadius: 30,
//     backgroundColor: 'rgba(255,255,255,0.2)',
//     justifyContent: 'center',
//     alignItems: 'center',
//     marginRight: 15,
//   },
//   offerTextContainer: {
//     flex: 1,
//   },
//   offerTitle: {
//     fontSize: 18,
//     fontWeight: 'bold',
//     color: '#fff',
//     marginBottom: 5,
//   },
//   offerDescription: {
//     fontSize: 14,
//     color: 'rgba(255,255,255,0.9)',
//     lineHeight: 18,
//     marginBottom: 10,
//   },

//   countdownContainer: {
//     marginTop: 8,
//   },
//   countdownTitle: {
//     fontSize: 12,
//     color: 'rgba(255,255,255,0.8)',
//     marginBottom: 6,
//     fontWeight: '500',
//   },
//   timerContainer: {
//     flexDirection: 'row',
//     alignItems: 'center',
//   },
//   timeUnit: {
//     alignItems: 'center',
//     marginRight: 12,
//     minWidth: 40,
//   },
//   timeValue: {
//     fontSize: 18,
//     fontWeight: 'bold',
//     color: '#fff',
//     backgroundColor: 'rgba(255,255,255,0.2)',
//     paddingHorizontal: 6,
//     paddingVertical: 4,
//     borderRadius: 6,
//     minWidth: 36,
//     textAlign: 'center',
//   },
//   timeLabel: {
//     fontSize: 10,
//     color: 'rgba(255,255,255,0.8)',
//     marginTop: 4,
//     fontWeight: '500',
//   },
//   expiredText: {
//     fontSize: 14,
//     color: '#FF6B6B',
//     fontWeight: 'bold',
//     fontStyle: 'italic',
//   },
//   pagination: {
//     flexDirection: 'row',
//     justifyContent: 'center',
//     alignItems: 'center',
//     marginTop: 15,
//   },
//   paginationDot: {
//     width: 8,
//     height: 8,
//     borderRadius: 4,
//     backgroundColor: '#E0E0E0',
//     marginHorizontal: 4,
//   },
//   paginationDotActive: {
//     backgroundColor: Colors.primary,
//     width: 20,
//   },
//   recent: {
//     paddingBottom: 100,
//   },
//   recentContainer: {
//     backgroundColor: "#fff",
//     borderRadius: 16,
//     padding: 28,

 
//     shadowColor: "#000",
//     shadowOffset: {
//       width: 0,
//       height: 2,
//     },
//     shadowOpacity: 0.1,
//     shadowRadius: 3.84,
//     elevation: 5,
//   },
//   recentHeader: {
//     flexDirection: "row",
//     justifyContent: "space-between",
//     alignItems: "center",
//     marginBottom: 16,
//   },
//   recentTitle: { 
//     color: Colors.textPrimary, 
//     fontSize: 18, 
//     fontWeight: "500" 
//   },
//   txRow: {
//     flexDirection: "row",
//     justifyContent: "space-between",
//     alignItems: "center",
//     paddingVertical: 16,
//     borderBottomWidth: 1,
//     borderBottomColor: "#F3F3F3",
//   },
//   txLeft: { 
//     flexDirection: "row", 
//     alignItems: "center", 
//     flex: 1 
//   },
//   txIconWrap: {
//     width: 48,
//     height: 48,
//     borderRadius: 24,
//     justifyContent: "center",
//     alignItems: "center",
//     marginRight: 12,
//   },
//   txInfo: {
//     flex: 1,
//   },
//   txTitle: { 
//     color: Colors.textPrimary, 
//     fontSize: 16, 
//     fontWeight: "600",
//     textTransform: 'capitalize'
//   },
//   txSub: { 
//     color: "#9E9E9E", 
//     fontSize: 12, 
//     marginTop: 2 
//   },
//   txPhone: { 
//     color: "#9E9E9E", 
//     fontSize: 12, 
//     marginTop: 2 
//   },
//   txRight: { 
//     alignItems: "flex-end" 
//   },
//   txAmount: { 
//     fontSize: 16, 
//     fontWeight: "700",
//     marginBottom: 4
//   },
//   statusBadge: {
//     paddingHorizontal: 8,
//     paddingVertical: 4,
//     borderRadius: 12,
//   },
//   statusText: {
//     fontSize: 12,
//     fontWeight: "600",
//     textTransform: 'capitalize'
//   },
//   loader: {
//     padding: 20,
//   },
//   errorContainer: {
//     alignItems: 'center',
//     padding: 20,
//   },
//   errorText: {
//     color: '#f44336',
//     fontSize: 14,
//     marginTop: 8,
//     marginBottom: 12,
//   },
//   retryButton: {
//     backgroundColor: Colors.primary,
//     paddingHorizontal: 16,
//     paddingVertical: 8,
//     borderRadius: 8,
//   },
//   retryButtonText: {
//     color: '#fff',
//     fontWeight: '600',
//   },
//   emptyState: {
//     alignItems: 'center',
//     padding: 20,
//   },
//   emptyStateText: {
//     color: '#9E9E9E',
//     fontSize: 14,
//     marginTop: 8,
//   }
// });



const HomeStyles = StyleSheet.create({
 safeArea: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  header: {
    height: scale.hp(22.5),
    position: 'relative',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  receiptModalContainer: {
    width: '90%',
    maxWidth: scale.wp(100), 
    height: '90%',
    backgroundColor: '#fff',
    borderRadius: scale.hp(3), 
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: scale.hp(1.25), 
    },
    shadowOpacity: 0.3,
    shadowRadius: scale.hp(2.5), 
    elevation: 10,
  },
  receiptHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: scale.hp(3), 
    backgroundColor: Colors.primary,
    borderTopLeftRadius: scale.hp(3),
    borderTopRightRadius: scale.hp(3),
  },
  receiptHeaderIcon: {
    width: scale.wp(14), 
    height: scale.wp(14),
    borderRadius: scale.wp(7),
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: scale.wp(4),
  },
  receiptHeaderText: {
    flex: 1,
  },
  receiptTitle: {
    fontSize: scale.hp(2.5),
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: scale.hp(0.5), 
  },
  receiptSubtitle: {
    fontSize: scale.hp(1.75),
    color: 'rgba(255, 255, 255, 0.9)',
  },
  closeButton: {
    width: scale.wp(10),
    height: scale.wp(10),
    borderRadius: scale.wp(5),
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  receiptContent: {
    flex: 1,
    padding: scale.hp(3), 
  },
  statusSection: {
    alignItems: 'center',
    marginBottom: scale.hp(3), 
  },
  statusBadgeLarge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: scale.wp(4), 
    paddingVertical: scale.hp(1),
    borderRadius: scale.hp(2.5), 
  },
  statusDot: {
    width: scale.hp(1), 
    height: scale.hp(1),
    borderRadius: scale.hp(0.5),
    marginRight: scale.wp(2), 
  },
  statusTextLarge: {
    fontSize: scale.hp(1.75), 
    fontWeight: '600',
  },
  amountSection: {
    alignItems: 'center',
    marginBottom: scale.hp(3),
    backgroundColor: '#F3F4F6',
    borderRadius: scale.hp(1.5), 
    paddingTop: scale.hp(1.5),
    paddingBottom: scale.hp(1.5),
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  topSection: {
    alignItems: 'center',
    paddingTop: scale.hp(1.5),
  },
modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  receiptHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: scale.wp(5),
    paddingVertical: scale.hp(2),
    backgroundColor: Colors.primary,
    borderTopLeftRadius: scale.hp(3),
    borderTopRightRadius: scale.hp(3),
  },
  headerLeft: {
    flex: 1,
  },
  headerCenter: {
    flex: 2,
    alignItems: 'center',
  },
  headerRight: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  closeButton: {
    width: scale.wp(8),
    height: scale.wp(8),
    borderRadius: scale.wp(4),
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerActionButton: {
    width: scale.wp(9),
    height: scale.wp(9),
    borderRadius: scale.wp(4.5),
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: scale.wp(2),
  },
  receiptTitle: {
    fontSize: scale.hp(2.25),
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
  },
  receiptContent: {
    flex: 1,
    padding: scale.hp(2.5),
  },
  statusSection: {
    alignItems: 'center',
    marginBottom: scale.hp(1.5),
  },
  statusIconContainer: {
    width: scale.wp(25),
    height: scale.wp(25),
    borderRadius: scale.wp(25),
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusTextLarge: {
    fontSize: scale.hp(2),
    fontWeight: '600',
    textAlign: 'center',
  },
  topSection: {
    alignItems: 'center',
  },
  amountSection: {
    alignItems: 'center',
    marginBottom: scale.hp(3),
    backgroundColor: '#F3F4F6',
    borderRadius: scale.hp(1.5),
    padding: scale.hp(2),
  },
  amountLabel: {
    fontSize: scale.hp(1.75),
    color: '#6B7280',
    marginBottom: scale.hp(0.5),
  },
  amountValue: {
    fontSize: scale.hp(3),
    fontWeight: 'bold',
    color: Colors.textPrimary,
  },
  detailItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: scale.hp(1.5),
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  detailLabel: {
    fontSize: scale.hp(1.75),
    color: '#6B7280',
    flex: 1,
  },
  detailValue: {
    fontSize: scale.hp(1.75),
    fontWeight: '500',
    color: Colors.textPrimary,
    flex: 1,
    textAlign: 'right',
  },
  additionalInfo: {
    backgroundColor: '#F9FAFB',
    borderRadius: scale.hp(1.5),
    padding: scale.hp(2),
    marginBottom: scale.hp(3),
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  infoText: {
    fontSize: scale.hp(1.5),
    color: '#6B7280',
    marginLeft: scale.wp(2),
    flex: 1,
    lineHeight: scale.hp(2),
  },
  receiptActions: {
    padding: scale.hp(2.5),
    paddingTop: 0,
  },

  primaryButton: {
    flex: 2,
    backgroundColor: Colors.primary,
    paddingVertical: scale.hp(1.25),
    paddingHorizontal: scale.wp(6),
    borderRadius: scale.hp(1.5),
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: scale.hp(2),
    fontWeight: '600',
  },
  amountValueTop: {
    fontSize: scale.hp(3),
    textAlign: 'center',
    fontWeight: 'bold',
    marginBottom: scale.hp(3),
    color: Colors.textPrimary,
  },
  amountLabel: {
    fontSize: scale.hp(2),
    color: '#6B7280',
  },
  amountValue: {
    fontSize: scale.hp(4),
    fontWeight: 'bold',
    color: Colors.textPrimary,
  },
  detailsGrid: {
    marginBottom: scale.hp(3),
  },
  detailItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: scale.hp(1.5),
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  detailLabel: {
    fontSize: scale.hp(1.75),
    color: '#6B7280',
    flex: 1,
  },
  detailValue: {
    fontSize: scale.hp(1.75),
    fontWeight: '500',
    color: Colors.textPrimary,
    flex: 1,
    textAlign: 'right',
  },
  additionalInfo: {
    backgroundColor: '#F9FAFB',
    borderRadius: scale.hp(1.5),
    padding: scale.hp(2),
    marginBottom: scale.hp(3),
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: scale.hp(1),
  },
  infoText: {
    fontSize: scale.hp(1.5),
    color: '#6B7280',
    marginLeft: scale.wp(2),
    flex: 1,
  },
  receiptActions: {
    flexDirection: 'row',
    padding: scale.hp(3),
    paddingTop: scale.hp(1.5),
    gap: scale.wp(3),
  },
  secondaryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: scale.hp(2),
    paddingHorizontal: scale.wp(4),
    borderRadius: scale.hp(1.5),
    borderWidth: 1,
    borderColor: Colors.primary,
    gap: scale.wp(2),
  },
  secondaryButtonText: {
    color: Colors.primary,
    fontSize: scale.hp(1.75),
    fontWeight: '600',
  },
  svgContainer: {
    width: '100%',
    height: '100%',
    position: 'absolute',
  },
  headerContent: {
    position: 'absolute',
    top: '50%',
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: scale.wp(5.5),
    transform: [{ translateY: -scale.hp(3) }],
    zIndex: 1,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },

  avatarContainer: {
    width: scale.wp(13.3),
    height: scale.wp(13.3),
    borderRadius: scale.wp(6.6),
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: scale.wp(3.2),
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  avatarImage: {
    width: scale.wp(12.2),
    height: scale.wp(12.2),
    borderRadius: scale.wp(6.1),
  },
  avatarPlaceholder: {
    width: scale.wp(12.2),
    height: scale.wp(12.2),
    borderRadius: scale.wp(6.1),
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  userTextContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  greeting: {
    fontSize: scale.hp(1.75),
    color: 'rgba(255,255,255,0.8)',
  },
  userName: {
    fontSize: scale.hp(2.2),
    fontWeight: 'bold',
    color: '#fff',
    marginTop: scale.hp(0.25),
  },
  iconBtn: {
    width: scale.wp(12.2),
    height: scale.wp(12.2),
    borderRadius: scale.wp(6.1),
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: scale.wp(2.7),
  },
  promoBanner: {
    marginHorizontal: scale.wp(5.5),
    marginBottom: scale.hp(3.1),
    borderRadius: scale.wp(5.5),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: scale.hp(1) },
    shadowOpacity: 0.2,
    shadowRadius: scale.hp(2),
    elevation: 10,
  },
  promoGradient: {
    borderRadius: scale.wp(5.5),
    padding: scale.wp(5.5),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: scale.hp(15),
  },
  promoContent: {
    flex: 1,
  },
  promoTextContainer: {
    marginBottom: scale.hp(1.8),
  },
  promoTitle: {
    fontSize: scale.hp(2.75),
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: scale.hp(0.6),
  },
  promoSubtitle: {
    fontSize: scale.hp(1.75),
    color: 'rgba(255,255,255,0.9)',
    lineHeight: scale.hp(2.5),
  },
  promoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: scale.wp(4.4),
    paddingVertical: scale.hp(1),
    borderRadius: scale.wp(5.5),
    alignSelf: 'flex-start',
  },
  promoButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: scale.hp(1.75),
    marginRight: scale.wp(1.3),
  },
  promoIcon: {
    marginLeft: scale.wp(2.7),
  },
  servicesHeader: {
    paddingHorizontal: scale.wp(6.4),
    marginBottom: scale.hp(1.5),
    marginTop: scale.hp(1.25),
  },
  servicesTitle: {
    fontSize: scale.hp(2.2),
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  servicesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: scale.wp(5.5),
    marginTop: scale.hp(3.75),
    justifyContent: 'space-between',
    marginBottom: scale.hp(1.25),
  },
  offersContainer: {
    marginHorizontal: scale.wp(5.5),
    marginBottom: scale.hp(3),
  },
  offersHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: scale.hp(2),
  },
  offersTitle: {
    color: Colors.textPrimary,
    fontSize: scale.hp(2.2),
    fontWeight: '500',
  },
  seeAll: {
    color: Colors.primary,
    fontSize: scale.hp(1.75),
    fontWeight: '600',
  },
  sliderContainer: {
    position: 'relative',
  },
  offerCard: {
    width: scale.wp(100) - scale.wp(11),
    height: scale.hp(25),
    borderRadius: scale.wp(5.5),
    padding: scale.wp(5.5),
    justifyContent: 'center',
  },
 offerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  offerIconContainer: {
    width: scale.wp(16.6),
    height: scale.wp(16.6),
    borderRadius: scale.wp(8.3),
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: scale.wp(4),
  },
  offerTextContainer: {
    flex: 1,
  },
  offerTitle: {
    fontSize: scale.hp(2.2),
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: scale.hp(0.6),
  },
  offerDescription: {
    fontSize: scale.hp(1.75),
    color: 'rgba(255,255,255,0.9)',
    lineHeight: scale.hp(2.25),
    marginBottom: scale.hp(1.25),
  },
  countdownContainer: {
    marginTop: scale.hp(1),
  },
  countdownTitle: {
    fontSize: scale.hp(1.5),
    color: 'rgba(255,255,255,0.8)',
    marginBottom: scale.hp(0.75),
    fontWeight: '500',
  },
  timerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeUnit: {
    alignItems: 'center',
    marginRight: scale.wp(3.2),
    minWidth: scale.wp(11),
  },
  timeValue: {
    fontSize: scale.hp(2.2),
    fontWeight: 'bold',
    color: '#fff',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: scale.wp(1.6),
    paddingVertical: scale.hp(0.5),
    borderRadius: scale.wp(3.2),
    minWidth: scale.wp(10),
    textAlign: 'center',
  },
  timeLabel: {
    fontSize: scale.hp(1.25),
    color: 'rgba(255,255,255,0.8)',
    marginTop: scale.hp(0.5),
    fontWeight: '500',
  },
  expiredText: {
    fontSize: scale.hp(1.75),
    color: '#FF6B6B',
    fontWeight: 'bold',
    fontStyle: 'italic',
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: scale.hp(1.8),
  },
  paginationDot: {
    width: scale.wp(2.2),
    height: scale.wp(2.2),
    borderRadius: scale.wp(1.1),
    backgroundColor: '#E0E0E0',
    marginHorizontal: scale.wp(1.1),
  },
  paginationDotActive: {
    backgroundColor: Colors.primary,
    width: scale.wp(5.5),
  },
  recent: {
    paddingBottom: scale.hp(12.5),
  },
  recentContainer: {
    backgroundColor: '#fff',
    borderRadius: scale.wp(4.2),
    padding: scale.hp(3.5),
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: scale.hp(0.25),
    },
    shadowOpacity: 0.1,
    shadowRadius: scale.hp(0.5),
    elevation: 5,
  },
  recentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: scale.hp(2),
  },
  recentTitle: {
    color: Colors.textPrimary,
    fontSize: scale.hp(2.2),
    fontWeight: '500',
  },
  txRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: scale.hp(2),
    borderBottomWidth: 1,
    borderBottomColor: '#F3F3F3',
  },
  txLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  txIconWrap: {
    width: scale.wp(13.3),
    height: scale.wp(13.3),
    borderRadius: scale.wp(6.6),
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: scale.wp(3.2),
  },
  txInfo: {
    flex: 1,
  },
  txTitle: {
    color: Colors.textPrimary,
    fontSize: scale.hp(2),
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  txSub: {
    color: '#9E9E9E',
    fontSize: scale.hp(1.5),
    marginTop: scale.hp(0.25),
  },
  txPhone: {
    color: '#9E9E9E',
    fontSize: scale.hp(1.5),
    marginTop: scale.hp(0.25),
  },
  txRight: {
    alignItems: 'flex-end',
  },
  txAmount: {
    fontSize: scale.hp(2),
    fontWeight: '700',
    marginBottom: scale.hp(0.5),
  },
  statusBadge: {
    paddingHorizontal: scale.wp(2.2),
    paddingVertical: scale.hp(0.5),
    borderRadius: scale.wp(3.2),
  },
  statusText: {
    fontSize: scale.hp(1.5),
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  loader: {
    padding: scale.hp(2.5),
  },
  errorContainer: {
    alignItems: 'center',
    padding: scale.hp(2.5),
  },
  errorText: {
    color: '#f44336',
    fontSize: scale.hp(1.75),
    marginTop: scale.hp(1),
    marginBottom: scale.hp(1.5),
  },
  retryButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: scale.wp(4.4),
    paddingVertical: scale.hp(1),
    borderRadius: scale.wp(2.2),
  },
  retryButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    padding: scale.hp(2.5),
  },
  emptyStateText: {
    color: '#9E9E9E',
    fontSize: scale.hp(1.75),
    marginTop: scale.hp(1),
  },

});


export default HomeStyles;