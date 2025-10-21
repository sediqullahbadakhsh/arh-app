import { StyleSheet, Dimensions } from "react-native";
import { Colors } from "../../../theme/colors";
import {widthPercentageToDP as wp, heightPercentageToDP as hp} from 'react-native-responsive-screen';
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
  safeArea: { flex: 1, backgroundColor: Colors.white },
  header: {
    height: hp(22.5),
    position: 'relative',
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
    paddingHorizontal: wp(5.5),
    transform: [{ translateY: -hp(3) }],
    zIndex: 1,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatarContainer: {
    width: wp(13.3),
    height: wp(13.3),
    borderRadius: wp(6.6),
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: wp(3.2),
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  avatarImage: {
    width: wp(12.2),
    height: wp(12.2),
    borderRadius: wp(6.1),
  },
  avatarPlaceholder: {
    width: wp(12.2),
    height: wp(12.2),
    borderRadius: wp(6.1),
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  userTextContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  greeting: {
    fontSize: hp(1.75),
    color: 'rgba(255,255,255,0.8)',
  },
  userName: {
    fontSize: hp(2.2),
    fontWeight: 'bold',
    color: '#fff',
    marginTop: hp(0.25),
  },
  iconBtn: {
    width: wp(12.2),
    height: wp(12.2),
    borderRadius: wp(6.1),
    backgroundColor: "rgba(255,255,255,0.15)",
    justifyContent: "center",
    alignItems: "center",
    marginLeft: wp(2.7),
  },

  promoBanner: {
    marginHorizontal: wp(5.5),
    marginBottom: hp(3.1),
    borderRadius: wp(5.5),
    shadowColor: "#000",
    shadowOffset: { width: 0, height: hp(1) },
    shadowOpacity: 0.2,
    shadowRadius: hp(2),
    elevation: 10,
  },
  promoGradient: {
    borderRadius: wp(5.5),
    padding: wp(5.5),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: hp(15),
  },
  promoContent: { flex: 1 },
  promoTextContainer: { marginBottom: hp(1.8) },
  promoTitle: {
    fontSize: hp(2.75),
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: hp(0.6),
  },
  promoSubtitle: {
    fontSize: hp(1.75),
    color: 'rgba(255,255,255,0.9)',
    lineHeight: hp(2.5),
  },
  promoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: wp(4.4),
    paddingVertical: hp(1),
    borderRadius: wp(5.5),
    alignSelf: 'flex-start',
  },
  promoButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: hp(1.75),
    marginRight: wp(1.3),
  },
  promoIcon: { marginLeft: wp(2.7) },

  servicesHeader: {
    paddingHorizontal: wp(6.4),
    marginBottom: hp(1.5),
    marginTop: hp(1.25),
  },
  servicesTitle: {
    fontSize: hp(2.2),
    fontWeight: "700",
    color: Colors.textPrimary,
  },
  servicesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",

    marginHorizontal: wp(5.5),
    padding: wp(2.7),
    justifyContent: "space-between",
 
  },

  offersContainer: {
    marginHorizontal: wp(5.5),
    marginBottom: hp(3),
  },
  offersHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: hp(2),
  },
  offersTitle: {
    color: Colors.textPrimary,
    fontSize: hp(2.2),
    fontWeight: "500",
  },
  seeAll: {
    color: Colors.primary,
    fontSize: hp(1.75),
    fontWeight: "600",
  },
  sliderContainer: { position: 'relative' },
  offerCard: {
    width: screenWidth - wp(11),
    height: hp(25),
    borderRadius: wp(5.5),
    padding: wp(5.5),
    justifyContent: 'center',
  },
  offerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  offerIconContainer: {
    width: wp(16.6),
    height: wp(16.6),
    borderRadius: wp(8.3),
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: wp(4),
  },
  offerTextContainer: { flex: 1 },
  offerTitle: {
    fontSize: hp(2.2),
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: hp(0.6),
  },
  offerDescription: {
    fontSize: hp(1.75),
    color: 'rgba(255,255,255,0.9)',
    lineHeight: hp(2.25),
    marginBottom: hp(1.25),
  },

  countdownContainer: { marginTop: hp(1) },
  countdownTitle: {
    fontSize: hp(1.5),
    color: 'rgba(255,255,255,0.8)',
    marginBottom: hp(0.75),
    fontWeight: '500',
  },
  timerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeUnit: {
    alignItems: 'center',
    marginRight: wp(3.2),
    minWidth: wp(11),
  },
  timeValue: {
    fontSize: hp(2.2),
    fontWeight: 'bold',
    color: '#fff',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: wp(1.6),
    paddingVertical: hp(0.5),
    borderRadius: wp(3.2),
    minWidth: wp(10),
    textAlign: 'center',
  },
  timeLabel: {
    fontSize: hp(1.25),
    color: 'rgba(255,255,255,0.8)',
    marginTop: hp(0.5),
    fontWeight: '500',
  },
  expiredText: {
    fontSize: hp(1.75),
    color: '#FF6B6B',
    fontWeight: 'bold',
    fontStyle: 'italic',
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: hp(1.8),
  },
  paginationDot: {
    width: wp(2.2),
    height: wp(2.2),
    borderRadius: wp(1.1),
    backgroundColor: '#E0E0E0',
    marginHorizontal: wp(1.1),
  },
  paginationDotActive: {
    backgroundColor: Colors.primary,
    width: wp(5.5), // ~20
  },

  recent: {
    paddingBottom: hp(12.5), // ~100
  },
  recentContainer: {
    backgroundColor: "#fff",
    borderRadius: wp(4.2), // ~16
    padding: hp(3.5), // ~28
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: hp(0.25), // ~2
    },
    shadowOpacity: 0.1,
    shadowRadius: hp(0.5), // ~3.84
    elevation: 5,
  },
  recentHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: hp(2),
  },
  recentTitle: {
    color: Colors.textPrimary,
    fontSize: hp(2.2),
    fontWeight: "500",
  },
  txRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: hp(2),
    borderBottomWidth: 1,
    borderBottomColor: "#F3F3F3",
  },
  txLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  txIconWrap: {
    width: wp(13.3),
    height: wp(13.3),
    borderRadius: wp(6.6),
    justifyContent: "center",
    alignItems: "center",
    marginRight: wp(3.2),
  },
  txInfo: {
    flex: 1,
  },
  txTitle: {
    color: Colors.textPrimary,
    fontSize: hp(2),
    fontWeight: "600",
    textTransform: 'capitalize',
  },
  txSub: {
    color: "#9E9E9E",
    fontSize: hp(1.5),
    marginTop: hp(0.25),
  },
  txPhone: {
    color: "#9E9E9E",
    fontSize: hp(1.5),
    marginTop: hp(0.25),
  },
  txRight: {
    alignItems: "flex-end",
  },
  txAmount: {
    fontSize: hp(2),
    fontWeight: "700",
    marginBottom: hp(0.5),
  },
  statusBadge: {
    paddingHorizontal: wp(2.2),
    paddingVertical: hp(0.5),
    borderRadius: wp(3.2),
  },
  statusText: {
    fontSize: hp(1.5),
    fontWeight: "600",
    textTransform: 'capitalize',
  },
  loader: {
    padding: hp(2.5),
  },
  errorContainer: {
    alignItems: 'center',
    padding: hp(2.5),
  },
  errorText: {
    color: '#f44336',
    fontSize: hp(1.75),
    marginTop: hp(1),
    marginBottom: hp(1.5),
  },
  retryButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: wp(4.4),
    paddingVertical: hp(1),
    borderRadius: wp(2.2),
  },
  retryButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    padding: hp(2.5),
  },
  emptyStateText: {
    color: '#9E9E9E',
    fontSize: hp(1.75),
    marginTop: hp(1),
  },
});


export default HomeStyles;