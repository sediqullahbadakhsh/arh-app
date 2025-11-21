


import { StyleSheet, Platform } from "react-native";
import { Colors } from "../../theme/colors";
import { scale } from "../utils/normalizeSize";





const profileStyles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  menuWrapper: {
    flex: 1,
    backgroundColor: Colors.white,
    marginTop: scale.hp(13),
  },
  header: {
    height: scale.hp(19.4),
    paddingHorizontal: scale.wp(6.2),
    paddingTop: Platform.OS === "android" ? scale.hp(3.1) : 0,
    justifyContent: "flex-end",
    alignItems: "center",
    position: 'relative',
  },
  avatarWrapper: {
    position: "absolute",
    bottom: -AVATAR_SIZE / 2,
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    alignItems: "center",
    justifyContent: "center",
  },
  avatar: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    borderWidth: scale.hp(0.4),
    borderColor: "#fff",
  },
  avatarPlaceholder: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    backgroundColor: "#000",
    borderWidth: scale.hp(0.4),
    borderColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
  },
  editBtn: {
    position: "absolute",
    right: scale.wp(-1),
    bottom: scale.hp(-0.5),
    width: EDIT_SIZE,
    height: EDIT_SIZE,
    borderRadius: EDIT_SIZE / 2,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: scale.hp(0.26),
    shadowOffset: { width: 0, height: scale.hp(0.13) },
  },
  editBtnDisabled: {
    opacity: 0.7,
  },
  loadingEdit: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingDot: {
    width: scale.hp(0.8),
    height: scale.hp(0.8),
    borderRadius: scale.hp(0.4),
    backgroundColor: Colors.primary,
  },
  decoration1: {
    position: "absolute",
    top: scale.hp(2),
    right: -186,
    backgroundColor: "#FFFFFF0A",
    height: scale.hp(10.4),
    width: "100%",
    transform: [{ rotate: "130deg" }],
  },
  decoration2: {
    position: "absolute",
    top: scale.hp(2),
    right: -300,
    backgroundColor: "#FFFFFF14",
    height: scale.hp(15.5),
    width: "100%",
    transform: [{ rotate: "130deg" }],
  },
  body: {
    flex: 1,
    paddingHorizontal: scale.wp(6.2),
    paddingBottom: scale.hp(15.5),
  },
  nameRow: {
    flexDirection: "row",
    alignSelf: "center",
    alignItems: "center",
    marginBottom: scale.hp(2.1),
  },
  nameText: {
    color: Colors.textPrimary,
    fontSize: scale.hp(2.6),
    fontWeight: "600",
  },
  card: {
    paddingVertical: scale.hp(1.05),
    overflow: "hidden",
  },
  row: {
    flexDirection: "row",
    gap: scale.wp(2.6),
    paddingVertical: scale.hp(1.55),
    paddingHorizontal: scale.wp(4.2),
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#F3F3F3",
    marginBottom: scale.hp(1.3),
    justifyContent: "space-between",
    borderRadius: scale.hp(1.3),
    backgroundColor: '#fff',
  },
  rowLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  rowIcon: {
    width: scale.wp(8.3),
    height: scale.wp(8.3),
    borderRadius: scale.hp(0.8),
    backgroundColor: "#FFF5F5",
    justifyContent: "center",
    alignItems: "center",
    marginRight: scale.wp(3.1),
  },
  rowTitle: {
    color: Colors.textPrimary,
    fontSize: scale.hp(1.95),
    fontWeight: "500",
  },
  rowSubtitle: {
    color: "#9E9E9E",
    fontSize: scale.hp(1.4),
    marginTop: scale.hp(0.26),
  },
  skeletonAvatar: {
    backgroundColor: '#E0E0E0',
    borderColor: '#E0E0E0',
  },
  skeletonIcon: {
    width: scale.wp(12.4),
    height: scale.wp(12.4),
    borderRadius: scale.wp(6.2),
    backgroundColor: '#BDBDBD',
  },
  skeletonName: {
    width: scale.wp(31.2),
    height: scale.hp(2.6),
    backgroundColor: '#E0E0E0',
    borderRadius: scale.hp(0.5),
    marginRight: scale.wp(2.1),
  },
  skeletonCheckmark: {
    width: scale.wp(4.2),
    height: scale.wp(4.2),
    backgroundColor: '#E0E0E0',
    borderRadius: scale.wp(2.1),
  },
  skeletonRow: {
    flexDirection: "row",
    gap: scale.wp(2.6),
    paddingVertical: scale.hp(1.55),
    paddingHorizontal: scale.wp(4.2),
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#F3F3F3",
    marginBottom: scale.hp(1.3),
    justifyContent: "space-between",
    borderRadius: scale.hp(1.3),
    backgroundColor: '#fff',
  },
  skeletonRowLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  skeletonIconContainer: {
    width: scale.wp(8.3),
    height: scale.wp(8.3),
    borderRadius: scale.hp(0.8),
    backgroundColor: '#E0E0E0',
    marginRight: scale.wp(3.1),
  },
  skeletonTextContainer: {
    flex: 1,
  },
  skeletonTitle: {
    width: '60%',
    height: scale.hp(1.95),
    backgroundColor: '#E0E0E0',
    borderRadius: scale.hp(0.5),
    marginBottom: scale.hp(0.8),
  },
  skeletonSubtitle: {
    width: '80%',
    height: scale.hp(1.4),
    backgroundColor: '#E0E0E0',
    borderRadius: scale.hp(0.5),
  },
  skeletonChevron: {
    width: scale.wp(4.7),
    height: scale.wp(4.7),
    backgroundColor: '#E0E0E0',
    borderRadius: scale.wp(2.4),
  },
});


export default profileStyles;