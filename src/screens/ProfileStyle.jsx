


import { StyleSheet, Platform } from "react-native";
import { Colors } from "../../theme/colors";





const profileStyles = StyleSheet.create({
  safeArea: { 
    flex: 1, 
    backgroundColor: Colors.white 
  },
  menuWrapper: {
    flex: 1,
    backgroundColor: Colors.white,
    marginTop:   100,
  },
  header: {
    height: 150,
    paddingHorizontal: 24,
    paddingTop: Platform.OS === "android" ? 24 : 0,
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
    borderWidth: 3,
    borderColor: "#fff",
  },
  avatarPlaceholder: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    backgroundColor: "#000",
    borderWidth: 3,
    borderColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
  },
  editBtn: {
    position: "absolute",
    right: -4,
    bottom: -4,
    width: EDIT_SIZE,
    height: EDIT_SIZE,
    borderRadius: EDIT_SIZE / 2,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
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
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.primary,
  },
  decoration1: {
    position: "absolute", 
    top: 15, 
    right: -186, 
    backgroundColor: "#FFFFFF0A", 
    height: 80, 
    width: "100%",
    transform: [{ rotate: "130deg" }],
  },
  decoration2: {
    position: "absolute", 
    top: 15, 
    right: -300, 
    backgroundColor: "#FFFFFF14", 
    height: 120, 
    width: "100%",
    transform: [{ rotate: "130deg" }],
  },
  body: {
    flex: 1,
    paddingHorizontal: 24,
    paddingBottom: 120,
  },
  nameRow: {
    flexDirection: "row",
    alignSelf: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  nameText: {
    color: Colors.textPrimary,
    fontSize: 20,
    fontWeight: "600",
  },
  card: {
    paddingVertical: 8,
    overflow: "hidden",
  },
  row: {
    flexDirection: "row",
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#F3F3F3",
    marginBottom: 10,
    justifyContent: "space-between",
    borderRadius: 10,
    backgroundColor: '#fff',
  },
  rowLeft: { 
    flexDirection: "row", 
    alignItems: "center", 
    flex: 1 
  },
  rowIcon: {
    width: 32,
    height: 32,
    borderRadius: 6,
    backgroundColor: "#FFF5F5",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  rowTitle: { 
    color: Colors.textPrimary, 
    fontSize: 14, 
    fontWeight: "500" 
  },
  rowSubtitle: { 
    color: "#9E9E9E", 
    fontSize: 11, 
    marginTop: 2 
  },

  // Skeleton Styles
  skeletonAvatar: {
    backgroundColor: '#E0E0E0',
    borderColor: '#E0E0E0',
  },
  skeletonIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#BDBDBD',
  },
  skeletonName: {
    width: 120,
    height: 20,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
    marginRight: 8,
  },
  skeletonCheckmark: {
    width: 16,
    height: 16,
    backgroundColor: '#E0E0E0',
    borderRadius: 8,
  },
  skeletonRow: {
    flexDirection: "row",
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#F3F3F3",
    marginBottom: 10,
    justifyContent: "space-between",
    borderRadius: 10,
    backgroundColor: '#fff',
  },
  skeletonRowLeft: { 
    flexDirection: "row", 
    alignItems: "center", 
    flex: 1 
  },
  skeletonIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 6,
    backgroundColor: '#E0E0E0',
    marginRight: 12,
  },
  skeletonTextContainer: {
    flex: 1,
  },
  skeletonTitle: {
    width: '60%',
    height: 14,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
    marginBottom: 6,
  },
  skeletonSubtitle: {
    width: '80%',
    height: 11,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
  },
  skeletonChevron: {
    width: 18,
    height: 18,
    backgroundColor: '#E0E0E0',
    borderRadius: 9,
  },
});


export default profileStyles;